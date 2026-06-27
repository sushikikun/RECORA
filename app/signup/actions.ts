"use server";

import { redirect } from "next/navigation";

import { sanitizeRecoraAuthNextPath } from "@/lib/recora/auth-access";
import { getRecoraAuthRedirectOrigin } from "@/lib/recora/auth-origin";
import { createRecoraSupabaseServerClient, hasSupabaseReadConfig } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;

export async function createRecoraAccount(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");
  const nextPath = sanitizeRecoraAuthNextPath(String(formData.get("next") ?? ""));
  const encodedNext = encodeURIComponent(nextPath);

  if (!email) {
    redirect(`/signup?error=email_required&next=${encodedNext}`);
  }

  if (!isLikelyEmail(email)) {
    redirect(`/signup?error=invalid_email&next=${encodedNext}`);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect(`/signup?error=password_length&next=${encodedNext}`);
  }

  if (password !== passwordConfirmation) {
    redirect(`/signup?error=password_mismatch&next=${encodedNext}`);
  }

  if (!hasSupabaseReadConfig()) {
    redirect(`/signup?error=config&next=${encodedNext}`);
  }

  const redirectOrigin = await getRecoraAuthRedirectOrigin();
  if (!redirectOrigin.ok) {
    console.warn("Failed to create Recora account.", { code: "auth_redirect_origin_unavailable" });
    redirect(`/signup?error=auth_origin&next=${encodedNext}`);
  }

  let signUpError: unknown = null;

  try {
    const supabase = await createRecoraSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectOrigin.origin}/auth/confirm?next=${encodedNext}`
      }
    });
    signUpError = error;
  } catch (error) {
    signUpError = error;
  }

  if (signUpError) {
    console.warn("Failed to create Recora account.", getSafeAuthError(signUpError));
    redirect(`/signup?error=auth&next=${encodedNext}`);
  }

  redirect(`/signup?sent=1&next=${encodedNext}`);
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
