"use server";

import { redirect } from "next/navigation";

import { getRecoraAuthRedirectOrigin } from "@/lib/recora/auth-origin";
import { createRecoraSupabaseServerClient, hasSupabaseReadConfig } from "@/lib/supabase/server";

const UPDATE_PASSWORD_PATH = "/auth/update-password";

export async function sendRecoraPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isLikelyEmail(email)) {
    redirect("/forgot-password?error=invalid");
  }

  if (!hasSupabaseReadConfig()) {
    redirect("/forgot-password?error=config");
  }

  const redirectOrigin = await getRecoraAuthRedirectOrigin();
  if (!redirectOrigin.ok) {
    console.warn("Failed to send Recora password reset email.", { code: "auth_redirect_origin_unavailable" });
    redirect("/forgot-password?error=auth_origin");
  }

  let resetError: unknown = null;

  try {
    const supabase = await createRecoraSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectOrigin.origin}/auth/confirm?next=${encodeURIComponent(UPDATE_PASSWORD_PATH)}`
    });
    resetError = error;
  } catch (error) {
    resetError = error;
  }

  if (resetError) {
    console.warn("Failed to send Recora password reset email.", getSafeAuthError(resetError));
    redirect("/forgot-password?error=auth");
  }

  redirect("/forgot-password?sent=1");
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
