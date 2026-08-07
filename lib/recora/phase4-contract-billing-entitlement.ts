import "server-only";

export const phase4ContractBillingIntegrationSchemaVersion = 1 as const;

export type Phase4ContractState =
  | "draft"
  | "pending_activation"
  | "active"
  | "paused"
  | "canceled"
  | "ended";

export type Phase4PaymentFactKind =
  | "payment_succeeded"
  | "payment_failed"
  | "payment_reversed"
  | "payment_disputed"
  | "payment_unknown";

export type Phase4OperatorEvidence = {
  auditEventId: string;
  commandReceiptId: string;
};

export type Phase4ProviderNeutralBillingCommand = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  organizationId: string;
  projectId: string | null;
  sourceKind: "provider_fixture";
  sourceNamespace: string;
  sourceReference: string;
  sourceSequence: number;
  contractReference: string;
  nextContractState: Phase4ContractState;
  paymentFactKind: Phase4PaymentFactKind;
  paymentChainKey: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  operatorEvidence: Phase4OperatorEvidence;
  correctsPaymentFactId: string | null;
};

export type Phase4ProviderNeutralBillingEnvelope = Phase4ProviderNeutralBillingCommand;

export type Phase4ConfirmLifecycleCheckpointCommand = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  organizationId: string;
  projectId: string | null;
  checkpointId: string;
  phase3LifecycleEventId: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  operatorEvidence: Phase4OperatorEvidence;
};

export type Phase4ReconcileLifecycleCheckpointCommand = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  organizationId: string;
  projectId: string | null;
  checkpointId: string;
  phase3LifecycleAuditEventId: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  operatorEvidence: Phase4OperatorEvidence;
};

export type Phase4LifecycleCheckpointAttemptOutcome = "failed_retryable" | "retry_pending" | "exhausted";

export type Phase4RecordLifecycleCheckpointAttemptCommand = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  organizationId: string;
  projectId: string | null;
  checkpointId: string;
  attemptOutcome: Phase4LifecycleCheckpointAttemptOutcome;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  operatorEvidence: Phase4OperatorEvidence;
};

export type Phase4ContractBillingValidationReason =
  | "ok"
  | "invalid_command"
  | "invalid_scope"
  | "invalid_source"
  | "invalid_contract"
  | "invalid_payment_fact"
  | "invalid_operator_evidence";

export type Phase4ContractBillingValidation =
  | { ok: true; command: Phase4ProviderNeutralBillingCommand }
  | { ok: false; reasonCode: Exclude<Phase4ContractBillingValidationReason, "ok"> };

export type Phase4CustomerSafeReason =
  | "ok"
  | "invalid_scope"
  | "no_snapshot"
  | "ambiguous_snapshot"
  | "expired_snapshot"
  | "checkpoint_pending"
  | "checkpoint_failed"
  | "ordering_conflict"
  | "reconciliation_required"
  | "command_unavailable"
  | "lifecycle_access_suspended"
  | "lifecycle_retained"
  | "lifecycle_deletion_scheduled"
  | "lifecycle_deleting"
  | "lifecycle_deleted"
  | "lifecycle_deletion_failed"
  | "lifecycle_unavailable";

export type Phase4ContractBillingRpcOutcome =
  | "applied"
  | "replayed"
  | "rejected"
  | "reconciliation_required";

export type Phase4ContractBillingStableReason =
  | "ok"
  | "invalid_scope"
  | "invalid_reference"
  | "duplicate_command"
  | "idempotency_conflict"
  | "ordering_conflict"
  | "checkpoint_pending"
  | "checkpoint_failed"
  | "reconciliation_required"
  | "command_unavailable";

export type Phase4CustomerSafeContractResult = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  outcome: Phase4ContractBillingRpcOutcome;
  stableReason: Phase4ContractBillingStableReason;
  customerAccessAllowed: boolean;
  reasonCode: Phase4CustomerSafeReason;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  capabilities: Record<string, boolean>;
  limits: Record<string, number>;
};

type Phase4ContractBillingRpcName =
  | "recora_p4c_apply_contract_billing_entitlement_command"
  | "recora_p4c_confirm_lifecycle_checkpoint_command"
  | "recora_p4c_reconcile_lifecycle_checkpoint_command"
  | "recora_p4c_record_lifecycle_checkpoint_attempt_command";

export type Phase4ContractBillingRpcClient = {
  rpc: (
    name: Phase4ContractBillingRpcName,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>;
};

const commandKeys = [
  "schemaVersion",
  "organizationId",
  "projectId",
  "sourceKind",
  "sourceNamespace",
  "sourceReference",
  "sourceSequence",
  "contractReference",
  "nextContractState",
  "paymentFactKind",
  "paymentChainKey",
  "idempotencyKey",
  "requestId",
  "correlationId",
  "operatorEvidence",
  "correctsPaymentFactId"
] as const;
const confirmCommandKeys = [
  "schemaVersion",
  "organizationId",
  "projectId",
  "checkpointId",
  "phase3LifecycleEventId",
  "idempotencyKey",
  "requestId",
  "correlationId",
  "operatorEvidence"
] as const;
const reconcileCommandKeys = [
  "schemaVersion",
  "organizationId",
  "projectId",
  "checkpointId",
  "phase3LifecycleAuditEventId",
  "idempotencyKey",
  "requestId",
  "correlationId",
  "operatorEvidence"
] as const;
const attemptCommandKeys = [
  "schemaVersion",
  "organizationId",
  "projectId",
  "checkpointId",
  "attemptOutcome",
  "idempotencyKey",
  "requestId",
  "correlationId",
  "operatorEvidence"
] as const;
const operatorEvidenceKeys = ["auditEventId", "commandReceiptId"] as const;
const customerSafeKeys = [
  "schemaVersion",
  "outcome",
  "stableReason",
  "customerAccessAllowed",
  "reasonCode",
  "effectiveFrom",
  "effectiveUntil",
  "capabilities",
  "limits"
] as const;
const rpcRowKeys = [
  "schema_version",
  "outcome",
  "stable_reason",
  "customer_access_allowed",
  "reason_code",
  "effective_from",
  "effective_until",
  "capabilities",
  "limits"
] as const;

const forbiddenInputAuthorityKeys = /^(entitlement|capabilities|limits|resolvedDocument|blocksCustomerAccess|currentContractState|latestSourceSequence|existingReceipt|receipt|contract|paymentFact|lifecycleCheckpoint|authoritativePlanPolicyKey|policyKey|payloadFingerprint|downstreamEffectResult)$/;
const forbiddenCustomerSafeKeys = /provider|billing|receipt|payment|audit|payload|webhook|signature|pointer|snapshot|policy|command|correlation|request|source/i;
const opaqueReference = /^[a-z][a-z0-9_.:-]{2,127}$/;
const sensitiveOpaque = /(^|[_.:-])(token|secret|password|credential|authorization|cookie|session|email|phone|jwt|claim|access|refresh|payload|webhook|signature|payment_method|database|private|api)([_.:-]|$)/i;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contractStates = new Set<Phase4ContractState>(["draft", "pending_activation", "active", "paused", "canceled", "ended"]);
const paymentFactKinds = new Set<Phase4PaymentFactKind>(["payment_succeeded", "payment_failed", "payment_reversed", "payment_disputed", "payment_unknown"]);
const attemptOutcomes = new Set<Phase4LifecycleCheckpointAttemptOutcome>(["failed_retryable", "retry_pending", "exhausted"]);
const safeReasons = new Set<Phase4CustomerSafeReason>([
  "ok",
  "invalid_scope",
  "no_snapshot",
  "ambiguous_snapshot",
  "expired_snapshot",
  "checkpoint_pending",
  "checkpoint_failed",
  "ordering_conflict",
  "reconciliation_required",
  "command_unavailable",
  "lifecycle_access_suspended",
  "lifecycle_retained",
  "lifecycle_deletion_scheduled",
  "lifecycle_deleting",
  "lifecycle_deleted",
  "lifecycle_deletion_failed",
  "lifecycle_unavailable"
]);
const rpcOutcomes = new Set<Phase4ContractBillingRpcOutcome>(["applied", "replayed", "rejected", "reconciliation_required"]);
const stableReasons = new Set<Phase4ContractBillingStableReason>([
  "ok",
  "invalid_scope",
  "invalid_reference",
  "duplicate_command",
  "idempotency_conflict",
  "ordering_conflict",
  "checkpoint_pending",
  "checkpoint_failed",
  "reconciliation_required",
  "command_unavailable"
]);
export function validateProviderNeutralBillingEnvelope(value: unknown): Phase4ContractBillingValidation {
  try {
    if (!isExactPlainObject(value, commandKeys)) return invalid("invalid_command");
    if (Object.keys(value).some((key) => forbiddenInputAuthorityKeys.test(key))) return invalid("invalid_command");
    if (value.schemaVersion !== phase4ContractBillingIntegrationSchemaVersion || !isUuid(value.organizationId) || !isNullableUuid(value.projectId)) {
      return invalid("invalid_scope");
    }
    if (
      value.sourceKind !== "provider_fixture" ||
      !isOpaque(value.sourceNamespace) ||
      !isOpaque(value.sourceReference) ||
      !isPositiveSafeInteger(value.sourceSequence) ||
      !isOpaque(value.idempotencyKey) ||
      value.idempotencyKey.length > 96 ||
      !isUuid(value.requestId) ||
      !isUuid(value.correlationId)
    ) {
      return invalid("invalid_source");
    }
    if (!isOpaque(value.contractReference) || !isContractState(value.nextContractState)) return invalid("invalid_contract");
    if (!isPaymentFactKind(value.paymentFactKind) || !isOpaque(value.paymentChainKey) || !isNullableUuid(value.correctsPaymentFactId)) {
      return invalid("invalid_payment_fact");
    }
    if (!isOperatorEvidence(value.operatorEvidence)) return invalid("invalid_operator_evidence");
    return { ok: true, command: value as Phase4ProviderNeutralBillingCommand };
  } catch {
    return invalid("invalid_command");
  }
}

export function isProviderNeutralBillingEnvelope(value: unknown): value is Phase4ProviderNeutralBillingCommand {
  return validateProviderNeutralBillingEnvelope(value).ok;
}

export function createCanonicalPhase4ContractBillingPayload(command: Phase4ProviderNeutralBillingCommand): Record<string, unknown> {
  const validation = validateProviderNeutralBillingEnvelope(command);
  if (!validation.ok) throw new Error(`Invalid P4-C command: ${validation.reasonCode}`);
  return {
    schemaVersion: phase4ContractBillingIntegrationSchemaVersion,
    organizationId: command.organizationId,
    projectId: command.projectId,
    sourceKind: command.sourceKind,
    sourceNamespace: command.sourceNamespace,
    sourceReference: command.sourceReference,
    sourceSequence: command.sourceSequence,
    contractReference: command.contractReference,
    nextContractState: command.nextContractState,
    paymentFactKind: command.paymentFactKind,
    paymentChainKey: command.paymentChainKey,
    correctsPaymentFactId: command.correctsPaymentFactId
  };
}

export async function executePhase4ContractBillingCommand(
  client: Phase4ContractBillingRpcClient,
  value: unknown
): Promise<Phase4CustomerSafeContractResult> {
  const validation = validateProviderNeutralBillingEnvelope(value);
  if (!validation.ok) throw new Error(`Invalid P4-C command: ${validation.reasonCode}`);
  const command = validation.command;
  const { data, error } = await client.rpc("recora_p4c_apply_contract_billing_entitlement_command", {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_source_kind: command.sourceKind,
    p_source_namespace: command.sourceNamespace,
    p_source_reference: command.sourceReference,
    p_source_sequence: command.sourceSequence,
    p_contract_reference: command.contractReference,
    p_next_contract_state: command.nextContractState,
    p_payment_fact_kind: command.paymentFactKind,
    p_payment_chain_key: command.paymentChainKey,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId,
    p_corrects_payment_fact_id: command.correctsPaymentFactId
  });
  if (error) throw new Error(`P4-C RPC failed: ${formatRpcError(error)}`);
  return normalizeRpcResult(data);
}

export async function executePhase4ConfirmLifecycleCheckpointCommand(
  client: Phase4ContractBillingRpcClient,
  value: unknown
): Promise<Phase4CustomerSafeContractResult> {
  const command = validateConfirmLifecycleCheckpointCommand(value);
  const { data, error } = await client.rpc("recora_p4c_confirm_lifecycle_checkpoint_command", {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_checkpoint_id: command.checkpointId,
    p_phase3_lifecycle_event_id: command.phase3LifecycleEventId,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId
  });
  if (error) throw new Error(`P4-C confirm RPC failed: ${formatRpcError(error)}`);
  return normalizeRpcResult(data);
}

export async function executePhase4ReconcileLifecycleCheckpointCommand(
  client: Phase4ContractBillingRpcClient,
  value: unknown
): Promise<Phase4CustomerSafeContractResult> {
  const command = validateReconcileLifecycleCheckpointCommand(value);
  const { data, error } = await client.rpc("recora_p4c_reconcile_lifecycle_checkpoint_command", {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_checkpoint_id: command.checkpointId,
    p_phase3_lifecycle_audit_event_id: command.phase3LifecycleAuditEventId,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId
  });
  if (error) throw new Error(`P4-C reconcile RPC failed: ${formatRpcError(error)}`);
  return normalizeRpcResult(data);
}

export async function executePhase4RecordLifecycleCheckpointAttemptCommand(
  client: Phase4ContractBillingRpcClient,
  value: unknown
): Promise<Phase4CustomerSafeContractResult> {
  const command = validateRecordLifecycleCheckpointAttemptCommand(value);
  const { data, error } = await client.rpc("recora_p4c_record_lifecycle_checkpoint_attempt_command", {
    p_organization_id: command.organizationId,
    p_project_id: command.projectId,
    p_checkpoint_id: command.checkpointId,
    p_attempt_outcome: command.attemptOutcome,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId
  });
  if (error) throw new Error(`P4-C checkpoint attempt RPC failed: ${formatRpcError(error)}`);
  return normalizeRpcResult(data);
}

export function createPendingCustomerSafeContractResult(reasonCode: Exclude<Phase4CustomerSafeReason, "ok"> = "command_unavailable"): Phase4CustomerSafeContractResult {
  const result: Phase4CustomerSafeContractResult = {
    schemaVersion: phase4ContractBillingIntegrationSchemaVersion,
    outcome: "rejected",
    stableReason: reasonCode === "invalid_scope" ? "invalid_scope" : "command_unavailable",
    customerAccessAllowed: false,
    reasonCode,
    effectiveFrom: null,
    effectiveUntil: null,
    capabilities: {},
    limits: {}
  };
  assertCustomerSafeContractResult(result);
  return result;
}

export function planPhase4ContractBillingEffects(value: unknown): { ok: boolean; customerSafeResult: Phase4CustomerSafeContractResult; reasonCode?: string } {
  const validation = validateProviderNeutralBillingEnvelope(value);
  if (!validation.ok) return { ok: false, reasonCode: validation.reasonCode, customerSafeResult: createPendingCustomerSafeContractResult() };
  return { ok: true, customerSafeResult: createPendingCustomerSafeContractResult() };
}

export function assertCustomerSafeContractResult(result: Phase4CustomerSafeContractResult): void {
  if (!isExactPlainObject(result, customerSafeKeys)) throw new Error("P4-C customer-safe result shape is not exact.");
  if (!rpcOutcomes.has(result.outcome) || !stableReasons.has(result.stableReason) || !safeReasons.has(result.reasonCode)) {
    throw new Error("P4-C customer-safe result has an unknown outcome or reason.");
  }
  const isCommittedOk =
    result.reasonCode === "ok" &&
    ((result.outcome === "applied" && result.stableReason === "ok") ||
      (result.outcome === "replayed" && result.stableReason === "duplicate_command"));
  if (result.customerAccessAllowed && !isCommittedOk) {
    throw new Error("P4-C customer access cannot be allowed without committed ok evidence.");
  }
  if (!result.customerAccessAllowed && result.reasonCode === "ok") throw new Error("P4-C ok reason must allow access.");
  if (result.outcome === "replayed" && result.stableReason !== "duplicate_command") throw new Error("P4-C replay requires duplicate_command.");
  if (result.outcome === "applied" && result.stableReason !== "ok") throw new Error("P4-C applied result requires ok.");
  if (result.outcome === "rejected" && result.stableReason === "ok") throw new Error("P4-C rejected result cannot be ok.");
  if (result.outcome === "reconciliation_required" && result.stableReason !== "checkpoint_pending" && result.stableReason !== "checkpoint_failed" && result.stableReason !== "reconciliation_required") {
    throw new Error("P4-C reconciliation result has an invalid stable reason.");
  }
  if (!(result.effectiveFrom === null || isIsoTimestamp(result.effectiveFrom)) || !(result.effectiveUntil === null || isIsoTimestamp(result.effectiveUntil))) {
    throw new Error("P4-C customer-safe effective window is invalid.");
  }
  if (!isPlainDataRecord(result.capabilities, "boolean") || !isPlainDataRecord(result.limits, "number")) {
    throw new Error("P4-C customer-safe capabilities or limits are invalid.");
  }
  if (
    Object.keys(result).some((key) => forbiddenCustomerSafeKeys.test(key)) ||
    Object.keys(result.capabilities).some((key) => forbiddenCustomerSafeKeys.test(key)) ||
    Object.keys(result.limits).some((key) => forbiddenCustomerSafeKeys.test(key))
  ) {
    throw new Error("P4-C customer-safe result contains an internal key.");
  }
}
function normalizeRpcResult(data: unknown): Phase4CustomerSafeContractResult {
  if (!Array.isArray(data) || data.length !== 1) throw new Error("P4-C RPC must return exactly one result row.");
  const row = data[0];
  if (!isExactPlainObject(row, rpcRowKeys)) throw new Error("P4-C RPC result row shape is not exact.");
  if (row.schema_version !== phase4ContractBillingIntegrationSchemaVersion) throw new Error("P4-C RPC schema version is invalid.");
  if (!isRpcOutcome(row.outcome) || !isStableReason(row.stable_reason) || typeof row.customer_access_allowed !== "boolean" || !isSafeReason(row.reason_code)) {
    throw new Error("P4-C RPC result row contains invalid scalar fields.");
  }
  const result: Phase4CustomerSafeContractResult = {
    schemaVersion: row.schema_version,
    outcome: row.outcome,
    stableReason: row.stable_reason,
    customerAccessAllowed: row.customer_access_allowed,
    reasonCode: row.reason_code,
    effectiveFrom: normalizeNullableTimestamp(row.effective_from),
    effectiveUntil: normalizeNullableTimestamp(row.effective_until),
    capabilities: normalizeBooleanRecord(row.capabilities),
    limits: normalizeNumberRecord(row.limits)
  };
  assertCustomerSafeContractResult(result);
  return result;
}

function normalizeNullableTimestamp(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === "string" && isIsoTimestamp(value)) return value;
  throw new Error("P4-C RPC timestamp field is invalid.");
}

function normalizeBooleanRecord(value: unknown): Record<string, boolean> {
  if (!isPlainDataRecord(value, "boolean")) throw new Error("P4-C RPC capabilities field is invalid.");
  return { ...value } as Record<string, boolean>;
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isPlainDataRecord(value, "number")) throw new Error("P4-C RPC limits field is invalid.");
  return { ...value } as Record<string, number>;
}

function validateConfirmLifecycleCheckpointCommand(value: unknown): Phase4ConfirmLifecycleCheckpointCommand {
  try {
    if (!isExactPlainObject(value, confirmCommandKeys)) throw new Error("shape");
    if (Object.keys(value).some((key) => forbiddenInputAuthorityKeys.test(key))) throw new Error("authority");
    if (
      value.schemaVersion !== phase4ContractBillingIntegrationSchemaVersion ||
      !isUuid(value.organizationId) ||
      !isNullableUuid(value.projectId) ||
      !isUuid(value.checkpointId) ||
      !isUuid(value.phase3LifecycleEventId) ||
      !isOpaque(value.idempotencyKey) ||
      value.idempotencyKey.length > 96 ||
      !isUuid(value.requestId) ||
      !isUuid(value.correlationId) ||
      !isOperatorEvidence(value.operatorEvidence)
    ) {
      throw new Error("invalid");
    }
    return value as Phase4ConfirmLifecycleCheckpointCommand;
  } catch {
    throw new Error("Invalid P4-C confirm checkpoint command.");
  }
}

function validateReconcileLifecycleCheckpointCommand(value: unknown): Phase4ReconcileLifecycleCheckpointCommand {
  try {
    if (!isExactPlainObject(value, reconcileCommandKeys)) throw new Error("shape");
    if (Object.keys(value).some((key) => forbiddenInputAuthorityKeys.test(key))) throw new Error("authority");
    if (
      value.schemaVersion !== phase4ContractBillingIntegrationSchemaVersion ||
      !isUuid(value.organizationId) ||
      !isNullableUuid(value.projectId) ||
      !isUuid(value.checkpointId) ||
      !isUuid(value.phase3LifecycleAuditEventId) ||
      !isOpaque(value.idempotencyKey) ||
      value.idempotencyKey.length > 96 ||
      !isUuid(value.requestId) ||
      !isUuid(value.correlationId) ||
      !isOperatorEvidence(value.operatorEvidence)
    ) {
      throw new Error("invalid");
    }
    return value as Phase4ReconcileLifecycleCheckpointCommand;
  } catch {
    throw new Error("Invalid P4-C reconcile checkpoint command.");
  }
}

function validateRecordLifecycleCheckpointAttemptCommand(value: unknown): Phase4RecordLifecycleCheckpointAttemptCommand {
  try {
    if (!isExactPlainObject(value, attemptCommandKeys)) throw new Error("shape");
    if (Object.keys(value).some((key) => forbiddenInputAuthorityKeys.test(key))) throw new Error("authority");
    if (
      value.schemaVersion !== phase4ContractBillingIntegrationSchemaVersion ||
      !isUuid(value.organizationId) ||
      !isNullableUuid(value.projectId) ||
      !isUuid(value.checkpointId) ||
      !isAttemptOutcome(value.attemptOutcome) ||
      !isOpaque(value.idempotencyKey) ||
      value.idempotencyKey.length > 96 ||
      !isUuid(value.requestId) ||
      !isUuid(value.correlationId) ||
      !isOperatorEvidence(value.operatorEvidence)
    ) {
      throw new Error("invalid");
    }
    return value as Phase4RecordLifecycleCheckpointAttemptCommand;
  } catch {
    throw new Error("Invalid P4-C checkpoint attempt command.");
  }
}

function isOperatorEvidence(value: unknown): value is Phase4OperatorEvidence {
  return isExactPlainObject(value, operatorEvidenceKeys) && isUuid(value.auditEventId) && isUuid(value.commandReceiptId);
}

function isContractState(value: unknown): value is Phase4ContractState {
  return typeof value === "string" && contractStates.has(value as Phase4ContractState);
}

function isPaymentFactKind(value: unknown): value is Phase4PaymentFactKind {
  return typeof value === "string" && paymentFactKinds.has(value as Phase4PaymentFactKind);
}

function isAttemptOutcome(value: unknown): value is Phase4LifecycleCheckpointAttemptOutcome {
  return typeof value === "string" && attemptOutcomes.has(value as Phase4LifecycleCheckpointAttemptOutcome);
}

function isRpcOutcome(value: unknown): value is Phase4ContractBillingRpcOutcome {
  return typeof value === "string" && rpcOutcomes.has(value as Phase4ContractBillingRpcOutcome);
}

function isStableReason(value: unknown): value is Phase4ContractBillingStableReason {
  return typeof value === "string" && stableReasons.has(value as Phase4ContractBillingStableReason);
}

function isSafeReason(value: unknown): value is Phase4CustomerSafeReason {
  return typeof value === "string" && safeReasons.has(value as Phase4CustomerSafeReason);
}

function isOpaque(value: unknown): value is string {
  return typeof value === "string" && opaqueReference.test(value) && !sensitiveOpaque.test(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuid.test(value);
}

function isNullableUuid(value: unknown): value is string | null {
  return value === null || isUuid(value);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.includes("T") && Number.isFinite(Date.parse(value));
}

function isPlainDataRecord(value: unknown, primitive: "boolean" | "number"): value is Record<string, boolean | number> {
  if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  if (Object.getOwnPropertySymbols(value).length !== 0) return false;
  return Object.entries(value).every(([key, entry]) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) return false;
    if (!/^[a-z][a-z0-9_.-]*$/.test(key) || forbiddenCustomerSafeKeys.test(key)) return false;
    return primitive === "boolean" ? typeof entry === "boolean" : typeof entry === "number" && Number.isFinite(entry) && entry >= 0;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isExactPlainObject<T extends readonly string[]>(value: unknown, keys: T): value is Record<T[number], unknown> {
  try {
    if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
    if (Object.getOwnPropertySymbols(value).length !== 0) return false;
    const own = Object.keys(value);
    if (own.length !== keys.length || own.some((key) => !keys.includes(key))) return false;
    return own.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return Boolean(descriptor && "value" in descriptor && descriptor.enumerable);
    });
  } catch {
    return false;
  }
}

function invalid(reasonCode: Exclude<Phase4ContractBillingValidationReason, "ok">): Phase4ContractBillingValidation {
  return { ok: false, reasonCode };
}

function formatRpcError(error: unknown): string {
  if (isRecord(error) && typeof error.message === "string") return error.message;
  return String(error);
}
