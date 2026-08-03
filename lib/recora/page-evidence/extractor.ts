import { sha256Hex } from "./url";
import type {
  JsonLdParseWarning,
  PageEvidenceExtraction,
  PageHeading,
  PageSourceType,
  PageTextBlock
} from "./types";

const EXCLUDED_TEXT_TAGS = ["script", "style", "noscript", "svg", "template", "nav", "footer", "header", "aside", "form"];
const NOISE_ATTRIBUTE_PATTERN = /(cookie|consent|banner|navigation|footer|header|sidebar|side-bar|menu|global-nav)/i;
const MIN_TEXT_BLOCK_LENGTH = 16;

type VisibleSegment =
  | { kind: "heading"; level: PageHeading["level"]; text: string }
  | { kind: "text"; text: string };

export function extractPageEvidenceFromHtml(input: {
  html: string;
  url: string;
  finalUrl: string;
  sourceType: PageSourceType;
  fetchedAt: string;
}): PageEvidenceExtraction {
  const title = extractTitle(input.html);
  const canonicalUrl = extractCanonicalUrl(input.html, input.finalUrl);
  const metaRobots = extractMetaRobots(input.html);
  const robotTokens = parseRobotTokens(metaRobots);
  const jsonLd = extractJsonLdTypes(input.html);
  const cleanHtml = stripTextExtractionNoise(input.html);
  const segments = extractVisibleSegments(cleanHtml);
  const headings = buildHeadings(segments);
  const visibleText = normalizeText(segments.map((segment) => segment.text).join(" "));
  const contentHash = sha256Hex([
    input.finalUrl,
    title ?? "",
    canonicalUrl ?? "",
    visibleText,
    jsonLd.types.join("|")
  ].join("\n"));

  return {
    title,
    h1: headings.find((heading) => heading.level === 1)?.text ?? null,
    headings,
    canonical_url: canonicalUrl,
    meta_robots: metaRobots,
    has_noindex: robotTokens.has("noindex"),
    has_nofollow: robotTokens.has("nofollow"),
    has_nosnippet: robotTokens.has("nosnippet"),
    data_nosnippet_count: countDataNosnippet(input.html),
    json_ld_types: jsonLd.types,
    schema_warnings: jsonLd.warnings,
    visible_text_length: visibleText.length,
    text_blocks: buildTextBlocks({
      segments,
      url: input.finalUrl,
      sourceType: input.sourceType,
      fetchedAt: input.fetchedAt,
      contentHash
    }),
    content_hash: contentHash
  };
}

function extractTitle(html: string) {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? normalizeText(toPlainText(match[1])) || null : null;
}

function extractCanonicalUrl(html: string, baseUrl: string) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = parseAttributes(tag);
    const rel = attributes.rel?.toLowerCase().split(/\s+/) ?? [];
    if (!rel.includes("canonical")) continue;
    const href = attributes.href;
    if (!href) return null;
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }
  return null;
}

function extractMetaRobots(html: string) {
  const values: string[] = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = parseAttributes(tag);
    if ((attributes.name ?? "").toLowerCase() !== "robots") continue;
    if (attributes.content) values.push(attributes.content);
  }
  return values.length > 0 ? values.join(", ") : null;
}

function parseRobotTokens(metaRobots: string | null) {
  return new Set((metaRobots ?? "").toLowerCase().split(/[,\s]+/).filter(Boolean));
}

function countDataNosnippet(html: string) {
  return (html.match(/\sdata-nosnippet(?:\s|=|>|\/)/gi) ?? []).length;
}

function extractJsonLdTypes(html: string) {
  const types = new Set<string>();
  const warnings: JsonLdParseWarning[] = [];
  const scripts = Array.from(html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  scripts.forEach((match, index) => {
    const raw = match[1].trim();
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      try {
        parsed = JSON.parse(decodeHtmlEntities(raw));
      } catch {
        warnings.push({
          code: "json_ld_parse_failed",
          message: error instanceof Error ? error.message : "JSON-LD parse failed.",
          script_index: index
        });
        return;
      }
    }
    if (!isRecord(parsed) && !Array.isArray(parsed)) {
      warnings.push({
        code: "json_ld_not_object_or_array",
        message: "JSON-LD root was not an object or array.",
        script_index: index
      });
      return;
    }
    collectJsonLdTypes(parsed, types);
  });

  return {
    types: Array.from(types).sort((left, right) => left.localeCompare(right)),
    warnings
  };
}

function collectJsonLdTypes(value: unknown, types: Set<string>, depth = 0) {
  if (depth > 25) return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdTypes(item, types, depth + 1);
    return;
  }
  if (!isRecord(value)) return;

  const typeValue = value["@type"];
  if (typeof typeValue === "string" && typeValue.trim()) types.add(typeValue.trim());
  if (Array.isArray(typeValue)) {
    for (const item of typeValue) {
      if (typeof item === "string" && item.trim()) types.add(item.trim());
    }
  }

  for (const nested of Object.values(value)) {
    if (nested !== typeValue) collectJsonLdTypes(nested, types, depth + 1);
  }
}

function stripTextExtractionNoise(html: string) {
  let next = html.replace(/<!--[\s\S]*?-->/g, " ");
  for (const tag of EXCLUDED_TEXT_TAGS) {
    next = next.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
    next = next.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), " ");
  }

  for (let pass = 0; pass < 4; pass += 1) {
    const before = next;
    next = next.replace(/<([a-z][\w:-]*)\b([^>]*)>[\s\S]*?<\/\1>/gi, (full, _tagName: string, attributes: string) => {
      return NOISE_ATTRIBUTE_PATTERN.test(attributes) ? " " : full;
    });
    if (next === before) break;
  }

  return next;
}

function extractVisibleSegments(html: string): VisibleSegment[] {
  const segments: VisibleSegment[] = [];
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
  let headingLevel: PageHeading["level"] | null = null;
  let headingText = "";
  let textBuffer = "";

  function flushText() {
    const text = normalizeText(textBuffer);
    if (text) segments.push({ kind: "text", text });
    textBuffer = "";
  }

  for (const token of tokens) {
    if (token.startsWith("<")) {
      const tagName = getTagName(token);
      if (!tagName) continue;
      const closing = /^<\//.test(token);
      const headingMatch = /^h([1-6])$/.exec(tagName);
      if (!closing && headingMatch) {
        flushText();
        headingLevel = Number(headingMatch[1]) as PageHeading["level"];
        headingText = "";
        continue;
      }
      if (closing && headingLevel && tagName === `h${headingLevel}`) {
        const text = normalizeText(headingText);
        if (text) segments.push({ kind: "heading", level: headingLevel, text });
        headingLevel = null;
        headingText = "";
        continue;
      }
      if (tagName === "br" || isBlockBoundary(tagName)) {
        if (headingLevel) headingText += " ";
        else textBuffer += " ";
      }
      continue;
    }

    const text = toPlainText(token);
    if (headingLevel) headingText += ` ${text}`;
    else textBuffer += ` ${text}`;
  }

  flushText();
  return segments;
}

function buildHeadings(segments: VisibleSegment[]) {
  const headings: PageHeading[] = [];
  const stack: string[] = [];
  for (const segment of segments) {
    if (segment.kind !== "heading") continue;
    stack[segment.level - 1] = segment.text;
    stack.length = segment.level;
    headings.push({
      level: segment.level,
      text: segment.text,
      heading_path: stack.filter(Boolean)
    });
  }
  return headings;
}

function buildTextBlocks(input: {
  segments: VisibleSegment[];
  url: string;
  sourceType: PageSourceType;
  fetchedAt: string;
  contentHash: string;
}) {
  const blocks: PageTextBlock[] = [];
  const headingStack: string[] = [];
  let pendingTexts: string[] = [];
  let pendingHeadingPath: string[] = [];

  function flushBlock() {
    const text = normalizeText(pendingTexts.join(" "));
    pendingTexts = [];
    if (text.length < MIN_TEXT_BLOCK_LENGTH) return;
    const headingPath = pendingHeadingPath.filter(Boolean);
    const textHash = sha256Hex(text);
    const contentHash = sha256Hex([input.url, headingPath.join(" > "), text].join("\n"));
    blocks.push({
      block_id: `page-block-${sha256Hex([input.url, input.sourceType, headingPath.join(">"), textHash].join("\n")).slice(0, 16)}`,
      url: input.url,
      source_type: input.sourceType,
      heading_path: headingPath,
      text,
      text_hash: textHash,
      approx_char_count: text.length,
      visible: true,
      fetched_at: input.fetchedAt,
      content_hash: contentHash
    });
  }

  for (const segment of input.segments) {
    if (segment.kind === "heading") {
      flushBlock();
      headingStack[segment.level - 1] = segment.text;
      headingStack.length = segment.level;
      pendingHeadingPath = headingStack.filter(Boolean);
      continue;
    }
    pendingTexts.push(segment.text);
  }
  flushBlock();

  return blocks;
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const withoutTagName = tag.replace(/^<\/?\s*[\w:-]+/, "").replace(/\/?\s*>$/, "");
  const pattern = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match = pattern.exec(withoutTagName);
  while (match) {
    const name = match[1].toLowerCase();
    attributes[name] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
    match = pattern.exec(withoutTagName);
  }
  return attributes;
}

function toPlainText(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "));
}

function normalizeText(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_match, entity: string) => {
    const normalized = entity.toLowerCase();
    if (normalized === "amp") return "&";
    if (normalized === "lt") return "<";
    if (normalized === "gt") return ">";
    if (normalized === "quot") return "\"";
    if (normalized === "apos") return "'";
    if (normalized === "nbsp") return " ";
    if (normalized.startsWith("#x")) return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    if (normalized.startsWith("#")) return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    return "";
  });
}

function getTagName(token: string) {
  const match = /^<\/?\s*([a-zA-Z0-9:-]+)/.exec(token);
  return match ? match[1].toLowerCase() : null;
}

function isBlockBoundary(tagName: string) {
  return (
    tagName === "p" ||
    tagName === "li" ||
    tagName === "ul" ||
    tagName === "ol" ||
    tagName === "div" ||
    tagName === "section" ||
    tagName === "article" ||
    tagName === "main" ||
    tagName === "tr" ||
    tagName === "td" ||
    tagName === "blockquote"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
