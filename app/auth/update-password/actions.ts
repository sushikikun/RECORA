"use server";

import { redirect } from "next/navigation";

import { createRecoraSupabaseServerClient, hasSupabaseReadConfig } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;

export async function updateRecoraPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect("/auth/update-password?error=password_length");
  }

  if (password !== passwordConfirmation) {
    redirect("/auth/update-password?error=password_mismatch");
  }

  if (!hasSupabaseReadConfig()) {
    redirect("/auth/update-password?error=config");
  }

  let updateError: unknown = null;
  let hasSession = false;

  try {
    const supabase = await createRecoraSupabaseServerClient();
    const { data, error: userError } = await supabase.auth.getUser();
    hasSession = !userError && Boolean(data.user);

    if (hasSession) {
      const { error } = await supabase.auth.updateUser({ password });
      updateError = error;
    }
  } catch (error) {
    updateError = error;
  }

  if (!hasSession && !updateError) {
    redirect("/forgot-password?error=session");
  }

  if (updateError) {
    console.warn("Failed to update Recora password.", getSafeAuthError(updateError));
    redirect("/auth/update-password?error=auth");
  }

  redirect("/login?updated=1");
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
