import { buildPageEvidenceCacheKey, normalizePageEvidenceUrl, sha256Hex } from "./url";
import type { PageFetchResult, PageFetchStatus, PageSourceType } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 1_000_000;

export type PageFetcherOptions = {
  timeoutMs?: number;
  maxRedirects?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

export async function fetchPageEvidenceUrl(input: {
  url: string;
  sourceType: PageSourceType;
  options?: PageFetcherOptions;
}): Promise<PageFetchResult> {
  const options = input.options ?? {};
  const fetchedAt = (options.now ?? (() => new Date()))().toISOString();
  const normalized = normalizePageEvidenceUrl(input.url);
  const requestedUrl = normalized.url ?? input.url.trim();
  const cacheKey = normalized.url
    ? buildPageEvidenceCacheKey({ url: normalized.url, sourceType: input.sourceType })
    : sha256Hex(["page-evidence-fetcher-v1", input.sourceType, input.url].join("\n"));

  if (!normalized.ok || !normalized.url) {
    return failedFetchResult({
      requestedUrl,
      finalUrl: requestedUrl,
      fetchedAt,
      cacheKey,
      fetchStatus: "fetch_failed",
      fetchError: normalized.warnings.map((warning) => warning.message).join(" ") || "Invalid URL."
    });
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  let finalUrl = normalized.url;
  let redirectCount = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(finalUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "RecoraPageEvidenceFetcher/1.0"
        }
      });

      const contentType = response.headers.get("content-type");
      const contentLength = parseContentLength(response.headers.get("content-length"));
      const status = response.status;

      if (isRedirectStatus(status)) {
        const location = response.headers.get("location");
        if (!location) {
          return failedFetchResult({
            requestedUrl: normalized.url,
            finalUrl,
            fetchedAt,
            cacheKey,
            httpStatus: status,
            redirectCount,
            contentType,
            contentLength,
            fetchStatus: "fetch_failed",
            fetchError: "Redirect response did not include a location header."
          });
        }
        if (redirectCount >= maxRedirects) {
          return failedFetchResult({
            requestedUrl: normalized.url,
            finalUrl,
            fetchedAt,
            cacheKey,
            httpStatus: status,
            redirectCount,
            contentType,
            contentLength,
            fetchStatus: "fetch_failed",
            fetchError: `Redirect limit exceeded (${maxRedirects}).`
          });
        }

        const redirected = normalizePageEvidenceUrl(new URL(location, finalUrl).toString());
        if (!redirected.ok || !redirected.url) {
          return failedFetchResult({
            requestedUrl: normalized.url,
            finalUrl,
            fetchedAt,
            cacheKey,
            httpStatus: status,
            redirectCount,
            contentType,
            contentLength,
            fetchStatus: "fetch_failed",
            fetchError: "Redirect location was not a supported http/https URL."
          });
        }
        finalUrl = redirected.url;
        redirectCount += 1;
        continue;
      }

      const statusFromHttp = status >= 400 ? "http_error" : "ok";
      if (!isHtmlContentType(contentType)) {
        return failedFetchResult({
          requestedUrl: normalized.url,
          finalUrl: response.url || finalUrl,
          fetchedAt,
          cacheKey,
          httpStatus: status,
          redirectCount,
          contentType,
          contentLength,
          fetchStatus: "non_html",
          fetchError: contentType ? `Non-HTML content-type: ${contentType}` : "Content-type did not indicate HTML."
        });
      }

      if (contentLength !== null && contentLength > maxBytes) {
        return failedFetchResult({
          requestedUrl: normalized.url,
          finalUrl: response.url || finalUrl,
          fetchedAt,
          cacheKey,
          httpStatus: status,
          redirectCount,
          contentType,
          contentLength,
          fetchStatus: "too_large",
          fetchError: `HTML content-length exceeds maxBytes (${maxBytes}).`
        });
      }

      const html = await response.text();
      if (Buffer.byteLength(html, "utf8") > maxBytes) {
        return failedFetchResult({
          requestedUrl: normalized.url,
          finalUrl: response.url || finalUrl,
          fetchedAt,
          cacheKey,
          httpStatus: status,
          redirectCount,
          contentType,
          contentLength: Buffer.byteLength(html, "utf8"),
          fetchStatus: "too_large",
          fetchError: `HTML body exceeds maxBytes (${maxBytes}).`
        });
      }

      const rawHtmlHash = sha256Hex(html);
      return {
        requested_url: normalized.url,
        final_url: response.url || finalUrl,
        http_status: status,
        redirect_count: redirectCount,
        content_type: contentType,
        content_length: contentLength ?? Buffer.byteLength(html, "utf8"),
        fetched_at: fetchedAt,
        fetch_status: statusFromHttp,
        fetch_error: statusFromHttp === "http_error" ? `HTTP status ${status}` : null,
        raw_html_hash: rawHtmlHash,
        content_hash: rawHtmlHash,
        html,
        cache_key: cacheKey
      };
    } catch (error) {
      const isTimeout = isAbortError(error);
      return failedFetchResult({
        requestedUrl: normalized.url,
        finalUrl,
        fetchedAt,
        cacheKey,
        redirectCount,
        fetchStatus: isTimeout ? "timeout" : "fetch_failed",
        fetchError: isTimeout ? `Fetch timed out after ${timeoutMs}ms.` : errorMessage(error)
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function failedFetchResult(input: {
  requestedUrl: string;
  finalUrl: string;
  fetchedAt: string;
  cacheKey: string;
  fetchStatus: PageFetchStatus;
  fetchError: string;
  httpStatus?: number | null;
  redirectCount?: number;
  contentType?: string | null;
  contentLength?: number | null;
}): PageFetchResult {
  return {
    requested_url: input.requestedUrl,
    final_url: input.finalUrl,
    http_status: input.httpStatus ?? null,
    redirect_count: input.redirectCount ?? 0,
    content_type: input.contentType ?? null,
    content_length: input.contentLength ?? null,
    fetched_at: input.fetchedAt,
    fetch_status: input.fetchStatus,
    fetch_error: input.fetchError,
    raw_html_hash: null,
    content_hash: sha256Hex([input.finalUrl, input.fetchStatus, input.fetchError].join("\n")),
    html: null,
    cache_key: input.cacheKey
  };
}

function isHtmlContentType(contentType: string | null) {
  if (!contentType) return true;
  const normalized = contentType.toLowerCase();
  return normalized.includes("text/html") || normalized.includes("application/xhtml+xml");
}

function parseContentLength(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isRedirectStatus(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
