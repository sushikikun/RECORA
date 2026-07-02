import { lookup } from "node:dns/promises";
import net from "node:net";

import type { SiteInspectionResult, SiteInspectionWarning } from "@/lib/recora/site-inspection-types";

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 300 * 1024;
const REQUEST_TIMEOUT_MS = 5_000;
const FETCH_USER_AGENT = "Recora project setup site confirmation (+https://recora.jp)";
const LOCAL_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

type SiteInspectionInput = {
  url: string;
  brandName: string;
  aliases?: string[];
};

type NormalizedInspectionUrl = {
  url: string;
  hostname: string;
};

type PageMetadata = {
  title: string | null;
  description: string | null;
  siteName: string | null;
  h1: string | null;
  canonicalUrl: string | null;
};

export class SiteInspectionError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "SiteInspectionError";
    this.code = code;
    this.status = status;
  }
}

export async function inspectOfficialSite(input: SiteInspectionInput): Promise<SiteInspectionResult> {
  const brandName = input.brandName.trim();
  const aliases = uniqueStrings(input.aliases ?? []);
  let current = await normalizePublicHttpUrlForInspection(input.url);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetchSinglePage(current.url);
    const redirectLocation = getRedirectLocation(response);

    if (redirectLocation) {
      if (redirectCount >= MAX_REDIRECTS) {
        throw new SiteInspectionError(
          "site_inspection_too_many_redirects",
          "公式URLの転送回数が多いため、ページ情報を確認できませんでした。",
          400
        );
      }
      current = await resolveRedirectUrlForInspection(current.url, redirectLocation);
      continue;
    }

    return inspectResponseMetadata(response, current, brandName, aliases);
  }

  throw new SiteInspectionError(
    "site_inspection_too_many_redirects",
    "公式URLの転送回数が多いため、ページ情報を確認できませんでした。",
    400
  );
}

export async function normalizePublicHttpUrlForInspection(value: string): Promise<NormalizedInspectionUrl> {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new SiteInspectionError("site_inspection_url_required", "公式URLを入力してください。", 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new SiteInspectionError("site_inspection_url_invalid", "公式URLの形式を確認してください。", 400);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SiteInspectionError("site_inspection_protocol_not_allowed", "http または https のURLを入力してください。", 400);
  }

  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";

  const hostname = normalizeHostnameForInspection(parsed.hostname);
  if (!hostname || isLocalHostname(hostname)) {
    throw new SiteInspectionError("site_inspection_host_not_allowed", "このURLは確認対象にできません。", 400);
  }

  if (net.isIP(hostname) && !isPublicIpAddressForInspection(hostname)) {
    throw new SiteInspectionError("site_inspection_host_not_allowed", "このURLは確認対象にできません。", 400);
  }

  await assertPublicDnsResolution(hostname);

  return {
    url: parsed.toString(),
    hostname
  };
}

export async function resolveRedirectUrlForInspection(currentUrl: string, location: string) {
  let nextUrl: URL;
  try {
    nextUrl = new URL(location, currentUrl);
  } catch {
    throw new SiteInspectionError("site_inspection_redirect_invalid", "公式URLの転送先を確認できませんでした。", 400);
  }

  return normalizePublicHttpUrlForInspection(nextUrl.toString());
}

export function isPublicIpAddressForInspection(address: string) {
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) return isPublicIpv4Address(address);
  if (ipVersion === 6) return isPublicIpv6Address(address);
  return false;
}

export async function readResponseTextWithLimit(response: Response, byteLimit = MAX_HTML_BYTES) {
  if (!response.body) {
    const text = await response.text();
    return {
      text: text.slice(0, byteLimit),
      truncated: Buffer.byteLength(text, "utf8") > byteLimit
    };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    if (received + value.byteLength > byteLimit) {
      chunks.push(value.slice(0, Math.max(0, byteLimit - received)));
      truncated = true;
      try {
        await reader.cancel();
      } catch {
        // Ignore stream cancellation errors after the byte budget is reached.
      }
      break;
    }

    chunks.push(value);
    received += value.byteLength;
  }

  return {
    text: Buffer.concat(chunks).toString("utf8"),
    truncated
  };
}

export function extractPageMetadataFromHtml(html: string): PageMetadata {
  return {
    title: cleanMetadataText(extractTagText(html, "title")),
    description: cleanMetadataText(extractMetaContent(html, "name", "description")),
    siteName: cleanMetadataText(extractMetaContent(html, "property", "og:site_name")),
    h1: cleanMetadataText(stripTags(extractTagText(html, "h1"))),
    canonicalUrl: cleanMetadataText(extractLinkHref(html, "canonical"))
  };
}

export function inferSiteInspectionCategory(metadata: PageMetadata) {
  const text = normalizeText([metadata.title, metadata.description, metadata.siteName, metadata.h1].filter(Boolean).join(" "));

  if (matchesAny(text, ["ai検索", "geo", "llmo", "llm optimization", "aio", "生成ai", "ai answer", "ai search"])) {
    return "SEO / AI検索対策";
  }
  if (matchesAny(text, ["seo", "マーケティング", "広告", "コンテンツ", "検索対策", "集客"])) {
    return "マーケティング / SEO";
  }
  if (matchesAny(text, ["saas", "分析", "analytics", "dashboard", "ダッシュボード", "プラットフォーム", "platform", "ツール"])) {
    return "SaaS / 分析ツール";
  }
  if (matchesAny(text, ["clinic", "クリニック", "医療", "school", "スクール", "学校", "教育", "講座"])) {
    return "クリニック / スクール";
  }
  if (matchesAny(text, ["店舗", "地域", "予約", "来店", "local", "エリア"])) {
    return "地域サービス";
  }
  return "その他";
}

export function buildSuggestedServiceDescription(metadata: PageMetadata) {
  if (metadata.description) return metadata.description;
  if (metadata.h1 && metadata.title && normalizeText(metadata.h1) !== normalizeText(metadata.title)) {
    return `${metadata.h1}。${metadata.title}`;
  }
  return metadata.h1 ?? metadata.title ?? null;
}

async function inspectResponseMetadata(
  response: Response,
  current: NormalizedInspectionUrl,
  brandName: string,
  aliases: string[]
): Promise<SiteInspectionResult> {
  const warnings: SiteInspectionWarning[] = [];
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType && !contentType.includes("text/html")) {
    warnings.push("non_html_response");
    return buildInspectionResult(current, emptyMetadata(), brandName, aliases, warnings);
  }

  const { text, truncated } = await readResponseTextWithLimit(response);
  if (truncated) warnings.push("response_truncated");

  const metadata = extractPageMetadataFromHtml(text);
  if (!metadata.title && !metadata.description && !metadata.siteName && !metadata.h1) {
    warnings.push("empty_page_metadata");
  }

  return buildInspectionResult(current, metadata, brandName, aliases, warnings);
}

function buildInspectionResult(
  current: NormalizedInspectionUrl,
  metadata: PageMetadata,
  brandName: string,
  aliases: string[],
  warnings: SiteInspectionWarning[]
): SiteInspectionResult {
  const searchableText = normalizeText([metadata.title, metadata.description, metadata.siteName, metadata.h1].filter(Boolean).join(" "));
  const normalizedBrandName = normalizeText(brandName);
  const aliasFound = aliases.filter((alias) => {
    const normalizedAlias = normalizeText(alias);
    return Boolean(normalizedAlias && searchableText.includes(normalizedAlias));
  });
  const brandNameFound = Boolean(
    (normalizedBrandName && searchableText.includes(normalizedBrandName)) || aliasFound.length > 0
  );
  const resultWarnings = [...warnings];
  if (!brandNameFound) resultWarnings.push("brand_name_not_found");

  return {
    normalizedUrl: current.url,
    hostname: current.hostname,
    title: metadata.title,
    description: metadata.description,
    siteName: metadata.siteName,
    h1: metadata.h1,
    canonicalUrl: normalizeCanonicalUrl(metadata.canonicalUrl, current.url),
    brandNameFound,
    aliasFound,
    suggestedServiceDescription: buildSuggestedServiceDescription(metadata),
    suggestedCategory: inferSiteInspectionCategory(metadata),
    warnings: uniqueStrings(resultWarnings)
  };
}

async function fetchSinglePage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        "user-agent": FETCH_USER_AGENT
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("公式URLの確認が時間内に完了しませんでした。内容を入力して進められます。");
    }
    throw new Error("公式URLのページ情報を確認できませんでした。内容を入力して進められます。");
  } finally {
    clearTimeout(timeout);
  }
}

function getRedirectLocation(response: Response) {
  if (response.status < 300 || response.status >= 400) return null;
  return response.headers.get("location");
}

async function assertPublicDnsResolution(hostname: string) {
  if (net.isIP(hostname)) return;

  let records: { address: string }[];
  try {
    records = await lookup(hostname, { all: true, verbatim: false });
  } catch {
    throw new SiteInspectionError("site_inspection_dns_failed", "公式URLのホスト名を確認できませんでした。", 400);
  }

  if (records.length === 0 || records.some((record) => !isPublicIpAddressForInspection(record.address))) {
    throw new SiteInspectionError("site_inspection_host_not_allowed", "このURLは確認対象にできません。", 400);
  }
}

function isLocalHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return LOCAL_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost");
}

function isPublicIpv4Address(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = parts;

  if (a === 0) return false;
  if (a === 10) return false;
  if (a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 192 && b === 0) return false;
  if (a === 192 && b === 2) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function isPublicIpv6Address(address: string) {
  const normalized = address.toLowerCase().replace(/^\[(.*)\]$/, "$1");
  const mappedIpv4 = normalized.match(/(?:^|:)ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mappedIpv4) return isPublicIpv4Address(mappedIpv4[1]);
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (normalized.startsWith("ff")) return false;
  if (normalized.startsWith("2001:db8")) return false;
  return true;
}

function extractTagText(html: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return html.match(pattern)?.[1] ?? null;
}

function extractMetaContent(html: string, attributeName: "name" | "property", attributeValue: string) {
  const pattern = /<meta\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const attributes = extractAttributes(match[0]);
    if (normalizeText(attributes[attributeName] ?? "") === normalizeText(attributeValue)) {
      return attributes.content ?? null;
    }
  }
  return null;
}

function extractLinkHref(html: string, relValue: string) {
  const pattern = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const attributes = extractAttributes(match[0]);
    const rels = normalizeText(attributes.rel ?? "").split(/\s+/);
    if (rels.includes(normalizeText(relValue))) {
      return attributes.href ?? null;
    }
  }
  return null;
}

function extractAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(tag)) !== null) {
    attributes[match[1].toLowerCase()] = match[3] ?? match[4] ?? match[5] ?? "";
  }
  return attributes;
}

function stripTags(value: string | null) {
  if (!value) return null;
  return value.replace(/<[^>]+>/g, " ");
}

function cleanMetadataText(value: string | null) {
  if (!value) return null;
  const cleaned = decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalizeCanonicalUrl(value: string | null, baseUrl: string) {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function emptyMetadata(): PageMetadata {
  return {
    title: null,
    description: null,
    siteName: null,
    h1: null,
    canonicalUrl: null
  };
}

function matchesAny(value: string, patterns: readonly string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function normalizeText(value: string) {
  return value.normalize("NFKC").trim().toLowerCase();
}

function uniqueStrings<T extends string>(values: readonly T[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean) as T[]));
}

function normalizeHostnameForInspection(value: string) {
  return value.toLowerCase().replace(/^\[(.*)\]$/, "$1").replace(/\.$/, "");
}
