import "server-only";

import { headers } from "next/headers";

import { hasSupabaseReadConfig } from "@/lib/supabase/server";

const ENABLE_PHASE1_ADMIN_UI_ENV = "RECORA_ENABLE_PHASE1_ADMIN_UI";
const ENABLED_VALUE = "true";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type RecoraInternalAdminAccess = {
  allowed: boolean;
  reasons: string[];
  authStatusLabel: "未設定";
  routeStatusLabel: "非公開" | "ローカル限定";
  supabaseReadConfigLabel: "設定済み" | "未設定";
};

export function getRecoraInternalAdminAccess(): RecoraInternalAdminAccess {
  const reasons: string[] = [];
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase() ?? "";
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase() ?? "";

  if (nodeEnv === "production" || vercelEnv) {
    reasons.push("公開され得る環境ではPhase 1内部運用画面を表示しません。");
  }

  if (process.env[ENABLE_PHASE1_ADMIN_UI_ENV]?.trim().toLowerCase() !== ENABLED_VALUE) {
    reasons.push(`${ENABLE_PHASE1_ADMIN_UI_ENV} が設定済みではありません。`);
  }

  if (!isLocalRequest()) {
    reasons.push("localhostからのアクセスではありません。");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    authStatusLabel: "未設定",
    routeStatusLabel: reasons.length === 0 ? "ローカル限定" : "非公開",
    supabaseReadConfigLabel: hasSupabaseReadConfig() ? "設定済み" : "未設定"
  };
}

function isLocalRequest() {
  const host = normalizeHostname(headers().get("host"));
  return Boolean(host && LOCAL_HOSTS.has(host));
}

function normalizeHostname(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname.toLowerCase();
  } catch {
    return value.split(":")[0]?.trim().toLowerCase() || null;
  }
}
