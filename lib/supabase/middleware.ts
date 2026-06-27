import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getRecoraSupabaseReadConfig, hasSupabaseReadConfig } from "@/lib/supabase/env";

export async function updateRecoraSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  if (!hasSupabaseReadConfig()) {
    setAuthNoStoreHeaders(request, response);
    return response;
  }

  const { supabaseUrl, supabaseKey } = getRecoraSupabaseReadConfig();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headersToSet).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      }
    }
  });

  try {
    await supabase.auth.getClaims();
  } catch (error) {
    console.warn("Failed to refresh Recora Supabase session.", getSafeAuthError(error));
  }

  setAuthNoStoreHeaders(request, response);
  return response;
}

function setAuthNoStoreHeaders(request: NextRequest, response: NextResponse) {
  if (!shouldDisableAuthResponseCache(request.nextUrl.pathname)) return;

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
}

function shouldDisableAuthResponseCache(pathname: string) {
  return pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname.startsWith("/auth/");
}

function getSafeAuthError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      code: typeof record.code === "string" ? record.code : undefined,
      message: typeof record.message === "string" ? record.message : undefined
    };
  }

  return { message: String(error) };
}
