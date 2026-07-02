export type PageSourceType = "owned_page" | "competitor_page" | "third_party_source" | "unknown_source";

export type PageFetchStatus = "ok" | "non_html" | "http_error" | "timeout" | "too_large" | "fetch_failed";

export type UrlNormalizationWarningCode =
  | "invalid_url"
  | "unsupported_protocol"
  | "empty_url"
  | "hash_fragment_removed";

export type UrlNormalizationWarning = {
  code: UrlNormalizationWarningCode;
  message: string;
};

export type UrlNormalizationResult = {
  ok: boolean;
  url: string | null;
  warnings: UrlNormalizationWarning[];
};

export type PageFetchResult = {
  requested_url: string;
  final_url: string;
  http_status: number | null;
  redirect_count: number;
  content_type: string | null;
  content_length: number | null;
  fetched_at: string;
  fetch_status: PageFetchStatus;
  fetch_error: string | null;
  raw_html_hash: string | null;
  content_hash: string | null;
  html: string | null;
  cache_key: string;
};

export type JsonLdParseWarning = {
  code: "json_ld_parse_failed" | "json_ld_not_object_or_array";
  message: string;
  script_index: number;
};

export type PageHeading = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  heading_path: string[];
};

export type PageTextBlock = {
  block_id: string;
  url: string;
  source_type: PageSourceType;
  heading_path: string[];
  text: string;
  text_hash: string;
  approx_char_count: number;
  visible: boolean;
  fetched_at: string;
  content_hash: string;
};

export type PageEvidenceExtraction = {
  title: string | null;
  h1: string | null;
  headings: PageHeading[];
  canonical_url: string | null;
  meta_robots: string | null;
  has_noindex: boolean;
  has_nofollow: boolean;
  has_nosnippet: boolean;
  data_nosnippet_count: number;
  json_ld_types: string[];
  schema_warnings: JsonLdParseWarning[];
  visible_text_length: number;
  text_blocks: PageTextBlock[];
  content_hash: string;
};

export type PageEvidenceSnapshot = {
  url: string;
  final_url: string;
  source_type: PageSourceType;
  fetched_at: string;
  http_status: number | null;
  fetch_status: PageFetchStatus;
  fetch_error: string | null;
  canonical_url: string | null;
  meta_robots: string | null;
  has_noindex: boolean;
  has_nofollow: boolean;
  has_nosnippet: boolean;
  data_nosnippet_count: number;
  title: string | null;
  h1: string | null;
  headings: PageHeading[];
  json_ld_types: string[];
  schema_warnings: JsonLdParseWarning[];
  visible_text_length: number;
  text_blocks: PageTextBlock[];
  raw_html_hash: string | null;
  content_hash: string | null;
};

export type PageEvidenceInputItem = {
  url: string;
  source_type?: PageSourceType;
  html_fixture_path?: string;
};
