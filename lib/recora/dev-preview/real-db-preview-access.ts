import "server-only";

import { RECORA_REAL_DB_PREVIEW_SEARCH_VALUE } from "./real-db-preview-url";

export const RECORA_REAL_DB_PREVIEW_PROJECT_SLUG = "mieruca-seo-demo";
export const RECORA_REAL_DB_PREVIEW_BRANCH = "work/data-rich-real-db-integration";
export const RECORA_REAL_DB_PREVIEW_QUERY_VALUE = RECORA_REAL_DB_PREVIEW_SEARCH_VALUE;

export type RecoraRealDbPreviewEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  VERCEL_GIT_COMMIT_REF?: string;
};

export type RecoraRealDbPreviewSearchParams = {
  data?: string | string[];
};

export function isRecoraRealDbPreviewEnabled(
  searchParams?: RecoraRealDbPreviewSearchParams | null,
  env: RecoraRealDbPreviewEnv = process.env
) {
  if (getRecoraRealDbPreviewQueryValue(searchParams) !== RECORA_REAL_DB_PREVIEW_QUERY_VALUE) {
    return false;
  }

  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase() ?? "";
  const gitRef = env.VERCEL_GIT_COMMIT_REF?.trim() ?? "";

  if (vercelEnv === "production") return false;
  if (nodeEnv === "development") return true;

  return vercelEnv === "preview" && gitRef === RECORA_REAL_DB_PREVIEW_BRANCH;
}

export function getRecoraRealDbPreviewLabel(
  searchParams?: RecoraRealDbPreviewSearchParams | null,
  env: RecoraRealDbPreviewEnv = process.env
) {
  if (!isRecoraRealDbPreviewEnabled(searchParams, env)) return null;

  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase() ?? "";
  const gitRef = env.VERCEL_GIT_COMMIT_REF?.trim() ?? "";

  if (nodeEnv === "development") return "LOCAL REAL DB PREVIEW";
  if (vercelEnv === "preview" && gitRef === RECORA_REAL_DB_PREVIEW_BRANCH) return "VERCEL REAL DB PREVIEW";

  return null;
}

export function isRecoraRealDbPreviewProjectAllowed(projectSlug: string) {
  return projectSlug.trim() === RECORA_REAL_DB_PREVIEW_PROJECT_SLUG;
}

export function getRecoraRealDbPreviewQueryValue(searchParams?: RecoraRealDbPreviewSearchParams | null) {
  const value = searchParams?.data;
  return Array.isArray(value) ? value[0] : value;
}
