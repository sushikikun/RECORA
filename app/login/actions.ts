"use server";

import { redirect } from "next/navigation";

import { sanitizeRecoraAuthNextPath } from "@/lib/recora/auth-access";
import { createRecoraSupabaseServerClient, hasSupabaseReadConfig } from "@/lib/supabase/server";

export async function loginWithRecoraPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeRecoraAuthNextPath(String(formData.get("next") ?? ""));
  const encodedNext = encodeURIComponent(nextPath);

  if (!isLikelyEmail(email) || !password) {
    redirect(`/login?error=credentials&next=${encodedNext}`);
  }

  if (!hasSupabaseReadConfig()) {
    redirect(`/login?error=config&next=${encodedNext}`);
  }

  let signInError: unknown = null;

  try {
    const supabase = await createRecoraSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    signInError = error;
  } catch (error) {
    signInError = error;
  }

  if (signInError) {
    console.warn("Failed to sign in Recora user.", getSafeAuthError(signInError));
    redirect(`/login?error=${getLoginErrorKey(signInError)}&next=${encodedNext}`);
  }

  redirect(nextPath);
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getLoginErrorKey(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code.toLowerCase() : "";
    const message = typeof record.message === "string" ? record.message.toLowerCase() : "";

    if (code.includes("email_not_confirmed") || message.includes("email not confirmed")) {
      return "unconfirmed";
    }
  }

  return "credentials";
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
