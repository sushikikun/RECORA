import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseServiceRoleClient } from "@/lib/supabase/server";

const PLAN_CONFIG_COLUMNS = "plan_code, display_name, status, config";
const PLAN_ORDER = [
  "free_preview",
  "trial_audit",
  "monitor_basic",
  "monitor_standard",
  "monitor_growth"
] as const;

type JsonObject = Record<string, unknown>;

type RecoraAdminPlanConfigRow = {
  plan_code: string;
  display_name: string;
  status: string;
  config: unknown;
};

export type RecoraAdminPlanConfig = {
  planCode: string;
  displayName: string;
  status: string;
  priceJpy: number | null;
  billingType: "free" | "one_time" | "monthly" | string | null;
  questionLimit: number | null;
  modelLimit: number | null;
  runMode: "one_time" | "daily_all_questions" | string | null;
  cadence: "once" | "daily" | string | null;
  recommendationsEnabled: boolean | null;
  customerRecommendationsVisible: boolean | null;
};

export type RecoraAdminPlanConfigsData = {
  plans: RecoraAdminPlanConfig[];
};

export async function getRecoraAdminPlanConfigs(): Promise<RecoraAdminPlanConfigsData> {
  noStore();

  const supabase = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .schema("recora_admin")
    .from("plan_configs")
    .select(PLAN_CONFIG_COLUMNS)
    .in("plan_code", [...PLAN_ORDER])
    .order("plan_code", { ascending: true });

  throwIfSupabaseError("plan_configs", error);

  const plans = ((data ?? []) as RecoraAdminPlanConfigRow[])
    .map(normalizePlanConfig)
    .sort((left, right) => getPlanOrder(left.planCode) - getPlanOrder(right.planCode));

  return { plans };
}

function normalizePlanConfig(row: RecoraAdminPlanConfigRow): RecoraAdminPlanConfig {
  const config = asJsonObject(row.config);

  return {
    planCode: row.plan_code,
    displayName: row.display_name,
    status: row.status,
    priceJpy: readNumber(config, "price_jpy"),
    billingType: readString(config, "billing_type"),
    questionLimit: readNumber(config, "question_limit"),
    modelLimit: readNumber(config, "model_limit"),
    runMode: readString(config, "run_mode"),
    cadence: readString(config, "cadence"),
    recommendationsEnabled: readBoolean(config, "recommendations_enabled"),
    customerRecommendationsVisible: readBoolean(config, "customer_recommendations_visible")
  };
}

function asJsonObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function readString(config: JsonObject, key: string) {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(config: JsonObject, key: string) {
  const value = config[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readBoolean(config: JsonObject, key: string) {
  const value = config[key];
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function getPlanOrder(planCode: string) {
  const index = PLAN_ORDER.findIndex((value) => value === planCode);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;
  throw new Error(`Failed to load Recora admin ${context}: ${error.message}`);
}
