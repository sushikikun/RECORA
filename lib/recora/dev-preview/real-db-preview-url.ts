export const RECORA_REAL_DB_PREVIEW_SEARCH_PARAM = "data";
export const RECORA_REAL_DB_PREVIEW_SEARCH_VALUE = "real-db";
export const RECORA_REAL_DB_PREVIEW_DEFAULT_PROJECT_DISPLAY_NAME = "ミエルカSEO AI検索分析チーム";

const recoraRealDbPreviewProjectDisplayNames: Record<string, string> = {
  "mieruca-seo-demo": RECORA_REAL_DB_PREVIEW_DEFAULT_PROJECT_DISPLAY_NAME
};

export function withRecoraRealDbPreviewSearchParam(href: string, enabled: boolean) {
  if (!enabled || !href.startsWith("/dashboard")) return href;

  const hashIndex = href.indexOf("#");
  const baseHref = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const url = new URL(baseHref, "https://recora.local");
  url.searchParams.set(RECORA_REAL_DB_PREVIEW_SEARCH_PARAM, RECORA_REAL_DB_PREVIEW_SEARCH_VALUE);

  return `${url.pathname}${url.search}${hash}`;
}

export function getRecoraRealDbPreviewProjectDisplayName(projectSlug?: string | null) {
  const normalizedSlug = projectSlug?.trim();
  if (normalizedSlug && recoraRealDbPreviewProjectDisplayNames[normalizedSlug]) {
    return recoraRealDbPreviewProjectDisplayNames[normalizedSlug];
  }

  return RECORA_REAL_DB_PREVIEW_DEFAULT_PROJECT_DISPLAY_NAME;
}
