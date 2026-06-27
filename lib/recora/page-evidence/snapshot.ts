import { extractPageEvidenceFromHtml } from "./extractor";
import { fetchPageEvidenceUrl, type PageFetcherOptions } from "./fetcher";
import { assertNormalizedPageEvidenceUrl, buildPageEvidenceCacheKey, sha256Hex } from "./url";
import type { PageEvidenceSnapshot, PageFetchResult, PageSourceType } from "./types";

export async function createPageEvidenceSnapshot(input: {
  url: string;
  sourceType: PageSourceType;
  fetchOptions?: PageFetcherOptions;
}): Promise<PageEvidenceSnapshot> {
  const fetchResult = await fetchPageEvidenceUrl({
    url: input.url,
    sourceType: input.sourceType,
    options: input.fetchOptions
  });
  return buildPageEvidenceSnapshotFromFetchResult(fetchResult, input.sourceType);
}

export function createPageEvidenceSnapshotFromHtml(input: {
  url: string;
  sourceType: PageSourceType;
  html: string;
  finalUrl?: string;
  fetchedAt?: string;
  httpStatus?: number;
}): PageEvidenceSnapshot {
  const requestedUrl = assertNormalizedPageEvidenceUrl(input.url);
  const finalUrl = input.finalUrl ? assertNormalizedPageEvidenceUrl(input.finalUrl) : requestedUrl;
  const fetchedAt = input.fetchedAt ?? new Date().toISOString();
  const rawHtmlHash = sha256Hex(input.html);
  return buildPageEvidenceSnapshotFromFetchResult(
    {
      requested_url: requestedUrl,
      final_url: finalUrl,
      http_status: input.httpStatus ?? 200,
      redirect_count: 0,
      content_type: "text/html; fixture=page-evidence",
      content_length: Buffer.byteLength(input.html, "utf8"),
      fetched_at: fetchedAt,
      fetch_status: "ok",
      fetch_error: null,
      raw_html_hash: rawHtmlHash,
      content_hash: rawHtmlHash,
      html: input.html,
      cache_key: buildPageEvidenceCacheKey({ url: requestedUrl, sourceType: input.sourceType })
    },
    input.sourceType
  );
}

export function buildPageEvidenceSnapshotFromFetchResult(
  fetchResult: PageFetchResult,
  sourceType: PageSourceType
): PageEvidenceSnapshot {
  if (fetchResult.fetch_status === "ok" && fetchResult.html) {
    const extraction = extractPageEvidenceFromHtml({
      html: fetchResult.html,
      url: fetchResult.requested_url,
      finalUrl: fetchResult.final_url,
      sourceType,
      fetchedAt: fetchResult.fetched_at
    });
    return {
      url: fetchResult.requested_url,
      final_url: fetchResult.final_url,
      source_type: sourceType,
      fetched_at: fetchResult.fetched_at,
      http_status: fetchResult.http_status,
      fetch_status: fetchResult.fetch_status,
      fetch_error: fetchResult.fetch_error,
      canonical_url: extraction.canonical_url,
      meta_robots: extraction.meta_robots,
      has_noindex: extraction.has_noindex,
      has_nofollow: extraction.has_nofollow,
      has_nosnippet: extraction.has_nosnippet,
      data_nosnippet_count: extraction.data_nosnippet_count,
      title: extraction.title,
      h1: extraction.h1,
      headings: extraction.headings,
      json_ld_types: extraction.json_ld_types,
      schema_warnings: extraction.schema_warnings,
      visible_text_length: extraction.visible_text_length,
      text_blocks: extraction.text_blocks,
      raw_html_hash: fetchResult.raw_html_hash,
      content_hash: extraction.content_hash
    };
  }

  return {
    url: fetchResult.requested_url,
    final_url: fetchResult.final_url,
    source_type: sourceType,
    fetched_at: fetchResult.fetched_at,
    http_status: fetchResult.http_status,
    fetch_status: fetchResult.fetch_status,
    fetch_error: fetchResult.fetch_error,
    canonical_url: null,
    meta_robots: null,
    has_noindex: false,
    has_nofollow: false,
    has_nosnippet: false,
    data_nosnippet_count: 0,
    title: null,
    h1: null,
    headings: [],
    json_ld_types: [],
    schema_warnings: [],
    visible_text_length: 0,
    text_blocks: [],
    raw_html_hash: fetchResult.raw_html_hash,
    content_hash: fetchResult.content_hash
  };
}
