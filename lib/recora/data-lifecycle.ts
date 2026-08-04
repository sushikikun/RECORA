import "server-only";

import {
  createRecoraSupabaseServerClient,
  createRecoraSupabaseServiceRoleClient
} from "@/lib/supabase/server";

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

export type DataLifecycleManifestSummary = {
  schemaVersion: 1;
  categories: Array<{
    category:
      | "organization_configuration"
      | "project_configuration"
      | "measurement_evidence"
      | "published_report_versions"
      | "operational_audit_evidence"
      | "storage_objects";
    count: number;
  }>;
};

export type DataLifecycleCommandResult = {
  lifecycleId: string | null;
  lifecycleVersion: number | null;
  outcome: "success" | "denied" | "failed";
  failureReasonCode: string | null;
};

export type DataLifecycleTransitionInput = {
  organizationId: string;
  projectId?: string | null;
  expectedState?: DataLifecycleState | null;
  expectedVersion: number;
  nextState: DataLifecycleState;
  reason: string;
  requestId: string;
  correlationId: string;
  retention?: {
    policyReference: string;
    policyVersionReference: string;
    startedAt: string;
    deadlineAt: string;
    restoreEligible: boolean;
    restoreDeadlineAt?: string | null;
  };
  manifest?: {
    identifier: string;
    version: number;
    hash: string;
    summary: DataLifecycleManifestSummary;
  };
  attempt?: {
    startedAt: string;
    finishedAt: string;
    outcome: "success" | "failed";
    failureReasonCode?: string | null;
  };
};

export type DataLifecycleLegalHoldInput = {
  organizationId: string;
  projectId?: string | null;
  expectedVersion: number;
  action: "apply" | "release";
  reason: string;
  reasonReference?: string | null;
  requestId: string;
  correlationId: string;
};

type DataLifecycleAccessRpcRow = {
  customer_access_allowed: unknown;
  new_measurement_allowed: unknown;
  restore_eligible: unknown;
  reason_code: unknown;
};

type DataLifecycleCommandRpcRow = {
  lifecycle_id: unknown;
  lifecycle_version: unknown;
  outcome: unknown;
  failure_reason_code: unknown;
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
 * Resolves only lifecycle decisions that server integrations may consume.
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

/**
 * Server-only lifecycle command boundary. It derives the operator identity from
 * the current authenticated session; callers cannot select an operator user ID.
 */
export async function transitionDataLifecycle(
  input: DataLifecycleTransitionInput
): Promise<DataLifecycleCommandResult> {
  const authUserId = await getVerifiedOperatorAuthUserId();
  const serviceClient = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await serviceClient.rpc("recora_transition_data_lifecycle", {
    p_auth_user_id: authUserId,
    p_organization_id: input.organizationId,
    p_project_id: input.projectId ?? null,
    p_expected_state: input.expectedState ?? null,
    p_expected_version: input.expectedVersion,
    p_next_state: input.nextState,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_retention_policy_reference: input.retention?.policyReference ?? null,
    p_retention_policy_version_reference: input.retention?.policyVersionReference ?? null,
    p_retention_started_at: input.retention?.startedAt ?? null,
    p_retention_deadline_at: input.retention?.deadlineAt ?? null,
    p_restore_eligible: input.retention?.restoreEligible ?? null,
    p_restore_deadline_at: input.retention?.restoreDeadlineAt ?? null,
    p_manifest_identifier: input.manifest?.identifier ?? null,
    p_manifest_version: input.manifest?.version ?? null,
    p_manifest_hash: input.manifest?.hash ?? null,
    p_manifest_summary: input.manifest
      ? {
          schema_version: input.manifest.summary.schemaVersion,
          categories: input.manifest.summary.categories
        }
      : null,
    p_attempt_started_at: input.attempt?.startedAt ?? null,
    p_attempt_finished_at: input.attempt?.finishedAt ?? null,
    p_attempt_outcome: input.attempt?.outcome ?? null,
    p_attempt_failure_reason_code: input.attempt?.failureReasonCode ?? null
  });

  if (error) {
    throw new Error("The data lifecycle command boundary could not record the command.");
  }

  return normalizeCommandResult(data);
}

/**
 * Server-only legal-hold command boundary with the same verified-session
 * identity rule as lifecycle transitions.
 */
export async function setDataLifecycleLegalHold(
  input: DataLifecycleLegalHoldInput
): Promise<DataLifecycleCommandResult> {
  const authUserId = await getVerifiedOperatorAuthUserId();
  const serviceClient = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await serviceClient.rpc("recora_set_data_lifecycle_legal_hold", {
    p_auth_user_id: authUserId,
    p_organization_id: input.organizationId,
    p_project_id: input.projectId ?? null,
    p_expected_version: input.expectedVersion,
    p_hold_action: input.action,
    p_reason: input.reason,
    p_legal_hold_reason_reference: input.reasonReference ?? null,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId
  });

  if (error) {
    throw new Error("The data lifecycle command boundary could not record the command.");
  }

  return normalizeCommandResult(data);
}

async function getVerifiedOperatorAuthUserId(): Promise<string> {
  try {
    const sessionClient = await createRecoraSupabaseServerClient();
    const { data: userData, error: userError } = await sessionClient.auth.getUser();

    if (userError || !userData.user?.id) {
      throw new Error("identity verification failed");
    }

    return userData.user.id;
  } catch {
    throw new Error("Unable to verify the operator identity.");
  }
}

function normalizeCommandResult(data: unknown): DataLifecycleCommandResult {
  const row = Array.isArray(data) ? (data[0] as DataLifecycleCommandRpcRow | undefined) : undefined;
  const isNullableString = (value: unknown): value is string | null =>
    value === null || typeof value === "string";
  const isNullableNumber = (value: unknown): value is number | null =>
    value === null || (typeof value === "number" && Number.isSafeInteger(value));

  if (
    !row ||
    !isNullableString(row.lifecycle_id) ||
    !isNullableNumber(row.lifecycle_version) ||
    (row.outcome !== "success" && row.outcome !== "denied" && row.outcome !== "failed") ||
    !isNullableString(row.failure_reason_code)
  ) {
    throw new Error("The data lifecycle command boundary returned an invalid response.");
  }

  return {
    lifecycleId: row.lifecycle_id,
    lifecycleVersion: row.lifecycle_version,
    outcome: row.outcome,
    failureReasonCode: row.failure_reason_code
  };
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
