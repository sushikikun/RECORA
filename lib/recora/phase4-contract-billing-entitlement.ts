import "server-only";

import { createHash } from "node:crypto";

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

export type Phase4DownstreamEffectResult = "pending" | "completed" | "reconciliation_required";

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
  authoritativePlanPolicyKey: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  operatorEvidence: Phase4OperatorEvidence;
  payloadFingerprint: string | null;
  correctsPaymentFactId: string | null;
  downstreamEffectResult: Phase4DownstreamEffectResult;
};

export type Phase4ProviderNeutralBillingEnvelope = Phase4ProviderNeutralBillingCommand;

export type Phase4ContractBillingValidationReason =
  | "ok"
  | "invalid_command"
  | "invalid_scope"
  | "invalid_source"
  | "invalid_contract"
  | "invalid_payment_fact"
  | "invalid_policy"
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
  | "reconciliation_required"
  | "command_unavailable";

export type Phase4ContractBillingRpcOutcome =
  | "applied"
  | "replayed"
  | "rejected"
  | "reconciliation_required";

export type Phase4CustomerSafeContractResult = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  outcome: Phase4ContractBillingRpcOutcome;
  stableReason: string;
  customerAccessAllowed: boolean;
  reasonCode: Phase4CustomerSafeReason;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  capabilities: Record<string, boolean>;
  limits: Record<string, number>;
};

export type Phase4ContractBillingRpcClient = {
  rpc: (
    name: "recora_p4c_apply_contract_billing_entitlement_command",
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
  "authoritativePlanPolicyKey",
  "idempotencyKey",
  "requestId",
  "correlationId",
  "operatorEvidence",
  "payloadFingerprint",
  "correctsPaymentFactId",
  "downstreamEffectResult"
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

const forbiddenInputAuthorityKeys = /^(entitlement|capabilities|limits|resolvedDocument|blocksCustomerAccess|currentContractState|latestSourceSequence|existingReceipt|receipt|contract|paymentFact|lifecycleCheckpoint)$/;
const forbiddenCustomerSafeKeys = /provider|billing|receipt|payment|audit|payload|webhook|signature|pointer|snapshot|policy|command|correlation|request|source/i;
const opaqueReference = /^[a-z][a-z0-9_.:-]{2,127}$/;
const sensitiveOpaque = /(^|[_.:-])(token|secret|password|credential|authorization|cookie|session|email|phone|jwt|claim|access|refresh|payload|webhook|signature|payment_method|database|private|api)([_.:-]|$)/i;
const fingerprint = /^[0-9a-f]{64}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contractStates = new Set<Phase4ContractState>(["draft", "pending_activation", "active", "paused", "canceled", "ended"]);
const paymentFactKinds = new Set<Phase4PaymentFactKind>(["payment_succeeded", "payment_failed", "payment_reversed", "payment_disputed", "payment_unknown"]);
const effectResults = new Set<Phase4DownstreamEffectResult>(["pending", "completed", "reconciliation_required"]);
const safeReasons = new Set<Phase4CustomerSafeReason>(["ok", "invalid_scope", "no_snapshot", "ambiguous_snapshot", "expired_snapshot", "checkpoint_pending", "checkpoint_failed", "reconciliation_required", "command_unavailable"]);
const rpcOutcomes = new Set<Phase4ContractBillingRpcOutcome>(["applied", "replayed", "rejected", "reconciliation_required"]);

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
      !isUuid(value.correlationId) ||
      !(value.payloadFingerprint === null || (typeof value.payloadFingerprint === "string" && fingerprint.test(value.payloadFingerprint)))
    ) {
      return invalid("invalid_source");
    }
    if (!isOpaque(value.contractReference) || !isContractState(value.nextContractState)) return invalid("invalid_contract");
    if (!isPaymentFactKind(value.paymentFactKind) || !isOpaque(value.paymentChainKey) || !isNullableUuid(value.correctsPaymentFactId)) {
      return invalid("invalid_payment_fact");
    }
    if (!isOpaque(value.authoritativePlanPolicyKey) || !effectResults.has(value.downstreamEffectResult as Phase4DownstreamEffectResult)) {
      return invalid("invalid_policy");
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
    correctsPaymentFactId: command.correctsPaymentFactId,
    authoritativePlanPolicyKey: command.authoritativePlanPolicyKey
  };
}

export function createPhase4ContractBillingPayloadFingerprint(command: Phase4ProviderNeutralBillingCommand): string {
  return createHash("sha256")
    .update(stableStringify(createCanonicalPhase4ContractBillingPayload(command)))
    .digest("hex");
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
    p_authoritative_plan_policy_key: command.authoritativePlanPolicyKey,
    p_idempotency_key: command.idempotencyKey,
    p_request_id: command.requestId,
    p_correlation_id: command.correlationId,
    p_operator_audit_event_id: command.operatorEvidence.auditEventId,
    p_operator_command_receipt_id: command.operatorEvidence.commandReceiptId,
    p_payload_fingerprint: command.payloadFingerprint,
    p_corrects_payment_fact_id: command.correctsPaymentFactId,
    p_downstream_effect_result: command.downstreamEffectResult
  });
  if (error) throw new Error(`P4-C RPC failed: ${formatRpcError(error)}`);
  const result = normalizeRpcResult(data);
  assertCustomerSafeContractResult(result);
  return result;
}

export function createPendingCustomerSafeContractResult(reasonCode: Exclude<Phase4CustomerSafeReason, "ok"> = "command_unavailable"): Phase4CustomerSafeContractResult {
  const result: Phase4CustomerSafeContractResult = {
    schemaVersion: phase4ContractBillingIntegrationSchemaVersion,
    outcome: "rejected",
    stableReason: reasonCode,
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
  if (!rpcOutcomes.has(result.outcome) || !safeReasons.has(result.reasonCode)) throw new Error("P4-C customer-safe result has an unknown outcome or reason.");
  if (typeof result.stableReason !== "string" || result.stableReason.trim() === "") throw new Error("P4-C customer-safe result requires a stable reason.");
  if (result.customerAccessAllowed && result.reasonCode !== "ok") throw new Error("P4-C customer access cannot be allowed for a non-ok reason.");
  if (!result.customerAccessAllowed && result.reasonCode === "ok") throw new Error("P4-C ok reason must allow access.");
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
  const row = Array.isArray(data) ? data[0] : data;
  if (!isRecord(row)) throw new Error("P4-C RPC did not return a result row.");
  const result: Phase4CustomerSafeContractResult = {
    schemaVersion: phase4ContractBillingIntegrationSchemaVersion,
    outcome: String(row.outcome) as Phase4ContractBillingRpcOutcome,
    stableReason: String(row.stable_reason ?? row.stableReason),
    customerAccessAllowed: Boolean(row.customer_access_allowed ?? row.customerAccessAllowed),
    reasonCode: String(row.reason_code ?? row.reasonCode) as Phase4CustomerSafeReason,
    effectiveFrom: normalizeNullableTimestamp(row.effective_from ?? row.effectiveFrom),
    effectiveUntil: normalizeNullableTimestamp(row.effective_until ?? row.effectiveUntil),
    capabilities: normalizeBooleanRecord(row.capabilities),
    limits: normalizeNumberRecord(row.limits)
  };
  return result;
}

function normalizeNullableTimestamp(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  throw new Error("P4-C RPC timestamp field is invalid.");
}

function normalizeBooleanRecord(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"));
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1])));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
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
  return Object.entries(value).every(([key, entry]) => {
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
