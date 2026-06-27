import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeRecoraAuthNextPath } from "@/lib/recora/auth-access";
import { createRecoraSupabaseServerClient } from "@/lib/supabase/server";

const VALID_EMAIL_OTP_TYPES = new Set(["signup", "invite", "recovery", "email_change", "email"]);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeRecoraAuthNextPath(requestUrl.searchParams.get("next"));
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (!code && (!tokenHash || !isValidEmailOtpType(type))) {
    console.warn("Failed to confirm Recora auth.", { message: "Missing or invalid auth confirmation token." });
    return noStoreRedirect(new URL(`/login?error=auth&next=${encodeURIComponent(nextPath)}`, requestUrl.origin));
  }

  let error: unknown = null;

  try {
    const supabase = await createRecoraSupabaseServerClient();
    if (code) {
      error = (await supabase.auth.exchangeCodeForSession(code)).error;
    } else {
      error = (await supabase.auth.verifyOtp({ token_hash: tokenHash as string, type: type as EmailOtpType })).error;
    }
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    console.warn("Failed to confirm Recora auth.", getSafeAuthError(error));
    return noStoreRedirect(new URL(`/login?error=auth&next=${encodeURIComponent(nextPath)}`, requestUrl.origin));
  }

  return noStoreRedirect(new URL(nextPath, requestUrl.origin));
}

function isValidEmailOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && VALID_EMAIL_OTP_TYPES.has(value));
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
