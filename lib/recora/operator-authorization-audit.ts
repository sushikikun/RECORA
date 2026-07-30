import "server-only";

import { createRecoraSupabaseServerClient, createRecoraSupabaseServiceRoleClient } from "@/lib/supabase/server";

const MAX_AUDIT_REASON_BYTES = 2048;
const MAX_AUDIT_SUMMARY_BYTES = 16_384;
const MAX_AUDIT_SUMMARY_DEPTH = 5;
const MAX_AUDIT_SUMMARY_KEYS = 32;
const MAX_AUDIT_SUMMARY_ARRAY_ITEMS = 64;
const MAX_AUDIT_SUMMARY_STRING_BYTES = 512;
const SAFE_AUDIT_KEY = /^[a-z][a-z0-9_.:-]{0,63}$/;
const SENSITIVE_AUDIT_KEY =
  /(^|[_.:-])(secret|token|password|credential|authorization|cookie|session|email|phone|jwt|claim|access|refresh|request|response|provider|payload|database|private|api)([_.:-]|$)/i;
const SENSITIVE_AUDIT_VALUE =
  /(postgres(?:ql)?:\/\/|-----begin [a-z ]*private key-----|(^|[^a-z0-9])sk-[a-z0-9_-]{12,}([^a-z0-9]|$)|(^|[^a-z0-9])ghp_[a-z0-9]{16,}([^a-z0-9]|$)|(^|[^a-z0-9])github_pat_[a-z0-9_]{16,}([^a-z0-9]|$)|(^|[^a-z0-9])eyj[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}\.[a-z0-9_-]{4,}([^a-z0-9]|$)|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(^|[^0-9])\+?[0-9][0-9 .()\-]{6,}[0-9]([^0-9]|$)|(^|[^a-z0-9])(cookie|session|authorization|auth[_ -]?claims?|jwt|access[_ -]?token|refresh[_ -]?token|raw[_ -]?(request|response)|provider[_ -]?payload|database[_ -]?url|private[_ -]?key)([^a-z0-9]|$))/i;
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
  assertSafeAuditReason(input.reason);
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

function assertSafeAuditReason(value: string): void {
  if (!isSafeAuditReason(value)) {
    throw new Error("Audit reasons must be short, opaque, and free of credentials or personal data.");
  }
}

function isSafeAuditReason(value: string): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    new TextEncoder().encode(value).length <= MAX_AUDIT_REASON_BYTES &&
    !SENSITIVE_AUDIT_VALUE.test(value)
  );
}

function assertSafeAuditSummary(value: unknown): asserts value is OperatorAuditSummary {
  if (
    !isSafeAuditValue(value, 0, new WeakSet<object>()) ||
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("Audit summaries must use the bounded safe summary contract.");
  }
}

function isSafeAuditValue(value: unknown, depth: number, seen: WeakSet<object>): boolean {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return true;
  }

  if (typeof value === "string") {
    return (
      new TextEncoder().encode(value).length <= MAX_AUDIT_SUMMARY_STRING_BYTES &&
      isSafeAuditReason(value)
    );
  }

  if (typeof value !== "object" || depth > MAX_AUDIT_SUMMARY_DEPTH) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return (
      value.length <= MAX_AUDIT_SUMMARY_ARRAY_ITEMS &&
      value.every((nestedValue) => isSafeAuditValue(nestedValue, depth + 1, seen))
    );
  }

  const entries = Object.entries(value);
  let serializedBytes: number;

  try {
    serializedBytes = new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return false;
  }

  return (
    entries.length <= MAX_AUDIT_SUMMARY_KEYS &&
    serializedBytes <= MAX_AUDIT_SUMMARY_BYTES &&
    entries.every(
      ([key, nestedValue]) =>
        SAFE_AUDIT_KEY.test(key) &&
        !SENSITIVE_AUDIT_KEY.test(key) &&
        isSafeAuditValue(nestedValue, depth + 1, seen),
    )
  );
}
