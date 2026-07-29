import "server-only";

import { createRecoraSupabaseServerClient, createRecoraSupabaseServiceRoleClient } from "@/lib/supabase/server";

const SENSITIVE_AUDIT_KEY = /(secret|token|password|credential|authorization|cookie|database[_-]?url|api[_-]?key|private[_-]?key)/i;
const SENSITIVE_AUDIT_VALUE = /(postgres(?:ql)?:\/\/|-----begin [a-z ]*private key-----|\b(?:sk|pk)_[a-z0-9_-]{12,})/i;

export type OperatorAuditSummary = Record<string, unknown>;

export type OperatorCommandInput = {
  permission: string;
  organizationId: string;
  projectId?: string | null;
  action: string;
  targetType: "organization" | "project";
  targetId: string;
  reason: string;
  requestId: string;
  correlationId: string;
  beforeSummary?: OperatorAuditSummary;
  afterSummary?: OperatorAuditSummary;
};

export type OperatorCommandResult = {
  auditEventId: string;
  outcome: "success" | "denied" | "failed";
  failureReasonCode: string | null;
};

type OperatorCommandRpcRow = {
  audit_event_id: string;
  outcome: OperatorCommandResult["outcome"];
  failure_reason_code: string | null;
};

/**
 * Executes the explicit, service-role-only 102-3E command receipt RPC.
 *
 * This is intentionally server-only: it verifies the current Supabase Auth user
 * before passing the identity into the database authorization boundary. It never
 * treats the service role as an operator identity and never accepts a browser
 * supplied organization/project as sufficient authorization.
 */
export async function executeOperatorCommandReceipt(
  input: OperatorCommandInput,
): Promise<OperatorCommandResult> {
  assertSafeAuditSummary(input.beforeSummary ?? {});
  assertSafeAuditSummary(input.afterSummary ?? {});

  const sessionClient = await createRecoraSupabaseServerClient();
  const { data: userData, error: userError } = await sessionClient.auth.getUser();

  if (userError) {
    throw new Error("Unable to verify the operator identity.");
  }

  const serviceClient = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await serviceClient.rpc(
    "recora_operator_execute_authorized_command_receipt",
    {
      p_auth_user_id: userData.user?.id ?? null,
      p_permission: input.permission,
      p_organization_id: input.organizationId,
      p_project_id: input.projectId ?? null,
      p_action: input.action,
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_reason: input.reason,
      p_request_id: input.requestId,
      p_correlation_id: input.correlationId,
      p_before_summary: input.beforeSummary ?? {},
      p_after_summary: input.afterSummary ?? {},
    },
  );

  if (error) {
    throw new Error("The operator command boundary could not record the command.");
  }

  const row = Array.isArray(data) ? (data[0] as OperatorCommandRpcRow | undefined) : undefined;

  if (!row?.audit_event_id || !row.outcome) {
    throw new Error("The operator command boundary returned an invalid response.");
  }

  return {
    auditEventId: row.audit_event_id,
    outcome: row.outcome,
    failureReasonCode: row.failure_reason_code,
  };
}

function assertSafeAuditSummary(value: unknown): asserts value is OperatorAuditSummary {
  if (!isSafeAuditValue(value)) {
    throw new Error("Audit summaries must not contain credentials or raw secret material.");
  }
}

function isSafeAuditValue(value: unknown): boolean {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return true;
  }

  if (typeof value === "string") {
    return !SENSITIVE_AUDIT_VALUE.test(value);
  }

  if (Array.isArray(value)) {
    return value.every(isSafeAuditValue);
  }

  if (typeof value === "object") {
    return Object.entries(value).every(
      ([key, nestedValue]) => !SENSITIVE_AUDIT_KEY.test(key) && isSafeAuditValue(nestedValue),
    );
  }

  return false;
}
