import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseServiceRoleClient } from "@/lib/supabase/server";

type RecoraAdminCustomerOpsRow = {
  organization_id: string;
  organization_name: string | null;
  project_id: string | null;
  project_name: string | null;
  customer_lifecycle_status: string | null;
  internal_owner: string | null;
  priority: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  plan_code: string | null;
  plan_display_name: string | null;
  billing_mode: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  price_jpy: number | null;
  billing_type: string | null;
  question_limit: number | null;
  model_limit: number | null;
  run_mode: string | null;
  cadence: string | null;
  recommendations_enabled: boolean | null;
  customer_recommendations_visible: boolean | null;
  schedule_id: string | null;
  schedule_type: string | null;
  schedule_status: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  latest_batch_status: string | null;
  latest_batch_queued_at: string | null;
  latest_report_review_status: string | null;
  latest_report_review_updated_at: string | null;
};

export type RecoraAdminCustomerOpsItem = {
  organizationId: string;
  organizationName: string;
  projectId: string | null;
  projectName: string | null;
  customerLifecycleStatus: string | null;
  internalOwner: string | null;
  priority: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  planCode: string | null;
  planDisplayName: string | null;
  billingMode: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  priceJpy: number | null;
  billingType: string | null;
  questionLimit: number | null;
  modelLimit: number | null;
  runMode: string | null;
  cadence: string | null;
  recommendationsEnabled: boolean | null;
  customerRecommendationsVisible: boolean | null;
  scheduleId: string | null;
  scheduleType: string | null;
  scheduleStatus: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  latestBatchStatus: string | null;
  latestBatchQueuedAt: string | null;
  latestReportReviewStatus: string | null;
  latestReportReviewUpdatedAt: string | null;
};

export type RecoraAdminCustomerOpsData = {
  customers: RecoraAdminCustomerOpsItem[];
};

export async function getRecoraAdminCustomerOps(): Promise<RecoraAdminCustomerOpsData> {
  noStore();

  const supabase = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("recora_admin_customer_ops_readonly");

  throwIfSupabaseError("customer_ops", error);

  return {
    customers: ((data ?? []) as RecoraAdminCustomerOpsRow[]).map(normalizeCustomerOpsRow)
  };
}

function normalizeCustomerOpsRow(row: RecoraAdminCustomerOpsRow): RecoraAdminCustomerOpsItem {
  return {
    organizationId: row.organization_id,
    organizationName: row.organization_name || "顧客名未設定",
    projectId: row.project_id,
    projectName: row.project_name,
    customerLifecycleStatus: row.customer_lifecycle_status,
    internalOwner: row.internal_owner,
    priority: row.priority,
    subscriptionId: row.subscription_id,
    subscriptionStatus: row.subscription_status,
    planCode: row.plan_code,
    planDisplayName: row.plan_display_name,
    billingMode: row.billing_mode,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    priceJpy: row.price_jpy,
    billingType: row.billing_type,
    questionLimit: row.question_limit,
    modelLimit: row.model_limit,
    runMode: row.run_mode,
    cadence: row.cadence,
    recommendationsEnabled: row.recommendations_enabled,
    customerRecommendationsVisible: row.customer_recommendations_visible,
    scheduleId: row.schedule_id,
    scheduleType: row.schedule_type,
    scheduleStatus: row.schedule_status,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    latestBatchStatus: row.latest_batch_status,
    latestBatchQueuedAt: row.latest_batch_queued_at,
    latestReportReviewStatus: row.latest_report_review_status,
    latestReportReviewUpdatedAt: row.latest_report_review_updated_at
  };
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;
  throw new Error(`Failed to load Recora admin ${context}: ${error.message}`);
}
