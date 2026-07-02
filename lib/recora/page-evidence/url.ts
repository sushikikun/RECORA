import { createHash } from "node:crypto";

import type { PageSourceType, UrlNormalizationResult, UrlNormalizationWarning } from "./types";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizePageEvidenceUrl(value: string): UrlNormalizationResult {
  const input = value.trim();
  const warnings: UrlNormalizationWarning[] = [];
  if (!input) {
    return {
      ok: false,
      url: null,
      warnings: [{ code: "empty_url", message: "URL is empty." }]
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return {
      ok: false,
      url: null,
      warnings: [{ code: "invalid_url", message: "URL must be absolute and parseable." }]
    };
  }

  if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      url: null,
      warnings: [{ code: "unsupported_protocol", message: "Only http and https URLs are supported." }]
    };
  }

  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")) {
    parsed.port = "";
  }
  if (parsed.hash) {
    parsed.hash = "";
    warnings.push({ code: "hash_fragment_removed", message: "URL hash fragment was removed." });
  }

  return {
    ok: true,
    url: parsed.toString(),
    warnings
  };
}

export function assertNormalizedPageEvidenceUrl(value: string) {
  const normalized = normalizePageEvidenceUrl(value);
  if (!normalized.ok || !normalized.url) {
    const message = normalized.warnings.map((warning) => warning.message).join(" ");
    throw new Error(message || "Invalid page evidence URL.");
  }
  return normalized.url;
}

export function parsePageSourceType(value: unknown): PageSourceType {
  if (
    value === "owned_page" ||
    value === "competitor_page" ||
    value === "third_party_source" ||
    value === "unknown_source"
  ) {
    return value;
  }
  return "unknown_source";
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildPageEvidenceCacheKey(input: {
  url: string;
  sourceType: PageSourceType;
  fetcherVersion?: string;
}) {
  const fetcherVersion = input.fetcherVersion ?? "page-evidence-fetcher-v1";
  // Future URL Collector integration should use this key before fetching the same
  // citation/project/brand/recommendation URL again. This PR does not read from DB.
  return sha256Hex([fetcherVersion, input.sourceType, assertNormalizedPageEvidenceUrl(input.url)].join("\n"));
}
