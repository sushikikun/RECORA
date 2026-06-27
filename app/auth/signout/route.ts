import { NextResponse, type NextRequest } from "next/server";

import { sanitizeRecoraAuthNextPath } from "@/lib/recora/auth-access";
import { createRecoraSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return noStoreRedirect(new URL("/login", request.url));
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeRecoraAuthNextPath(requestUrl.searchParams.get("next"), "/login");

  try {
    const supabase = await createRecoraSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.warn("Failed to sign out Recora user.", getSafeAuthError(error));
  }

  const redirectPath = nextPath === "/login" ? "/login?signed_out=1" : nextPath;
  return noStoreRedirect(new URL(redirectPath, requestUrl.origin));
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function getSafeAuthError(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      code: typeof record.code === "string" ? record.code : undefined,
      name: typeof record.name === "string" ? record.name : undefined,
      status: typeof record.status === "number" ? record.status : undefined
    };
  }

  return { name: "UnknownAuthError" };
}
