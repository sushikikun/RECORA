import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createRecoraSupabaseServerClient, hasSupabaseReadConfig } from "@/lib/supabase/server";

const DASHBOARD_ROOT = "/dashboard";
const UPDATE_PASSWORD_PATH = "/auth/update-password";
const DEFAULT_AUTH_NEXT_PATH = DASHBOARD_ROOT;

export async function getAuthenticatedRecoraUser(supabase?: SupabaseClient): Promise<User | null> {
  if (!supabase && !hasSupabaseReadConfig()) return null;

  try {
    const client = supabase ?? (await createRecoraSupabaseServerClient());
    const { data, error } = await client.auth.getUser();
    if (error) return null;

    return data.user ?? null;
  } catch {
    return null;
  }
}

export function sanitizeRecoraAuthNextPath(value: string | null | undefined, fallback = DEFAULT_AUTH_NEXT_PATH) {
  const safeFallback = sanitizeFallbackPath(fallback);
  if (!value) return safeFallback;

  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue.startsWith("//")) return safeFallback;

  try {
    const parsedUrl = new URL(trimmedValue, "https://recora.local");
    const path = `${parsedUrl.pathname}${parsedUrl.search}`;

    if (parsedUrl.origin !== "https://recora.local") return safeFallback;
    if (isAllowedAuthNextPath(path)) return path;
  } catch {
    return safeFallback;
  }

  return safeFallback;
}

export function getRecoraLoginPath(nextPath: string | null | undefined) {
  const safeNextPath = sanitizeRecoraAuthNextPath(nextPath);
  return `/login?next=${encodeURIComponent(safeNextPath)}`;
}

function isAllowedAuthNextPath(path: string) {
  return path === DASHBOARD_ROOT || path.startsWith(`${DASHBOARD_ROOT}/`) || path === UPDATE_PASSWORD_PATH;
}

function sanitizeFallbackPath(fallback: string) {
  if (
    fallback === "/login" ||
    fallback === "/signup" ||
    fallback === UPDATE_PASSWORD_PATH ||
    fallback.startsWith(`${DASHBOARD_ROOT}/`) ||
    fallback === DASHBOARD_ROOT
  ) {
    return fallback;
  }

  return DEFAULT_AUTH_NEXT_PATH;
}
