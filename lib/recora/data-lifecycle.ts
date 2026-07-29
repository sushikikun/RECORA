import "server-only";

import { createRecoraSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type DataLifecycleState =
  | "active"
  | "access_suspended"
  | "retained"
  | "deletion_scheduled"
  | "deleting"
  | "deleted"
  | "deletion_failed";

export type DataLifecycleAccessReasonCode =
  | DataLifecycleState
  | "retained_restore_eligible"
  | "invalid_scope"
  | "no_lifecycle_state"
  | "ambiguous_lifecycle_state"
  | "resolver_unavailable";

export type DataLifecycleAccessResolution = {
  customerAccessAllowed: boolean;
  newMeasurementAllowed: boolean;
  restoreEligible: boolean;
  reasonCode: DataLifecycleAccessReasonCode;
};

type DataLifecycleAccessRpcRow = {
  customer_access_allowed: unknown;
  new_measurement_allowed: unknown;
  restore_eligible: unknown;
  reason_code: unknown;
};

const reasonCodes = new Set<DataLifecycleAccessReasonCode>([
  "active",
  "access_suspended",
  "retained",
  "deletion_scheduled",
  "deleting",
  "deleted",
  "deletion_failed",
  "retained_restore_eligible",
  "invalid_scope",
  "no_lifecycle_state",
  "ambiguous_lifecycle_state",
  "resolver_unavailable"
]);

/**
 * Resolves only the lifecycle decisions that server integrations may consume.
 * The database boundary remains service-role-only and fails closed on any
 * malformed result or unavailable RPC response.
 */
export async function resolveDataLifecycleAccess(input: {
  organizationId: string;
  projectId?: string | null;
}): Promise<DataLifecycleAccessResolution> {
  const supabase = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("recora_resolve_data_lifecycle_access", {
    p_organization_id: input.organizationId,
    p_project_id: input.projectId ?? null
  });

  if (error || !Array.isArray(data) || data.length !== 1) {
    return unavailableResolution();
  }

  return normalizeResolution(data[0] as DataLifecycleAccessRpcRow);
}

function normalizeResolution(row: DataLifecycleAccessRpcRow): DataLifecycleAccessResolution {
  if (
    typeof row.customer_access_allowed !== "boolean" ||
    typeof row.new_measurement_allowed !== "boolean" ||
    typeof row.restore_eligible !== "boolean" ||
    typeof row.reason_code !== "string" ||
    !reasonCodes.has(row.reason_code as DataLifecycleAccessReasonCode)
  ) {
    return unavailableResolution();
  }

  return {
    customerAccessAllowed: row.customer_access_allowed,
    newMeasurementAllowed: row.new_measurement_allowed,
    restoreEligible: row.restore_eligible,
    reasonCode: row.reason_code as DataLifecycleAccessReasonCode
  };
}

function unavailableResolution(): DataLifecycleAccessResolution {
  return {
    customerAccessAllowed: false,
    newMeasurementAllowed: false,
    restoreEligible: false,
    reasonCode: "resolver_unavailable"
  };
}