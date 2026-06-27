"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  let resetError: unknown = null;

  try {
    const supabase = await createRecoraSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await getRequestOrigin()}/auth/confirm?next=${encodeURIComponent(UPDATE_PASSWORD_PATH)}`
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

async function getRequestOrigin() {
  const headerList = await headers();
  const configuredOrigin = getConfiguredSiteOrigin();
  if (configuredOrigin) return configuredOrigin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  if (!host) return "http://localhost:3000";
  return `${protocol}://${host}`;
}

function getConfiguredSiteOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!siteUrl) return undefined;

  try {
    return new URL(siteUrl).origin;
  } catch {
    return undefined;
  }
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
