import "server-only";

/**
 * P4-A is a private server boundary. These values intentionally contain no plan,
 * provider, price, payment, or customer-safe presentation data.
 */
export const phase4CommandSchemaVersion = 1 as const;

export type Phase4CommandType =
  | "business.lifecycle"
  | "invitation.lifecycle"
  | "contract.projection"
  | "billing.receipt"
  | "billing.payment_fact"
  | "lifecycle.checkpoint";

export type Phase4StableReason =
  | "ok"
  | "invalid_scope"
  | "invalid_reference"
  | "invalid_legacy_inventory"
  | "duplicate_command"
  | "idempotency_conflict"
  | "ordering_conflict"
  | "checkpoint_pending"
  | "checkpoint_failed"
  | "reconciliation_required"
  | "command_unavailable";

export type Phase4CommandResult = {
  commandReceiptId: string | null;
  outcome: "accepted" | "replayed" | "rejected" | "reconciliation_required";
  stableReason: Phase4StableReason;
};

export type Phase4CommandFixture = {
  schemaVersion: typeof phase4CommandSchemaVersion;
  commandType: Phase4CommandType;
  sourceKind: "manual" | "provider_fixture";
  sourceNamespace: string;
  sourceReference: string;
  sourceSequence: number;
  payloadFingerprint: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
};

const reasonCodes = new Set<Phase4StableReason>([
  "ok",
  "invalid_scope",
  "invalid_reference",
  "invalid_legacy_inventory",
  "duplicate_command",
  "idempotency_conflict",
  "ordering_conflict",
  "checkpoint_pending",
  "checkpoint_failed",
  "reconciliation_required",
  "command_unavailable"
]);

const commandTypes = new Set<Phase4CommandType>([
  "business.lifecycle",
  "invitation.lifecycle",
  "contract.projection",
  "billing.receipt",
  "billing.payment_fact",
  "lifecycle.checkpoint"
]);

const opaqueReference = /^[a-z][a-z0-9_.:-]{2,127}$/;
const sensitiveOpaque = /(^|[_.:-])(token|secret|password|credential|authorization|cookie|session|email|phone|jwt|claim|access|refresh|payload|webhook|signature|payment_method|database|private|api)([_.:-]|$)/;
const fingerprint = /^[0-9a-f]{64}$/;

export function isPhase4CommandFixture(value: unknown): value is Phase4CommandFixture {
  if (!isExactPlainObject(value, ["schemaVersion", "commandType", "sourceKind", "sourceNamespace", "sourceReference", "sourceSequence", "payloadFingerprint", "idempotencyKey", "requestId", "correlationId"])) return false;
  return (
    value.schemaVersion === phase4CommandSchemaVersion &&
    typeof value.commandType === "string" &&
    commandTypes.has(value.commandType as Phase4CommandType) &&
    (value.sourceKind === "manual" || value.sourceKind === "provider_fixture") &&
    isOpaque(value.sourceNamespace) &&
    isOpaque(value.sourceReference) &&
    typeof value.sourceSequence === "number" &&
    Number.isSafeInteger(value.sourceSequence) &&
    value.sourceSequence > 0 &&
    typeof value.payloadFingerprint === "string" &&
    fingerprint.test(value.payloadFingerprint) &&
    isOpaque(value.idempotencyKey) &&
    isUuid(value.requestId) &&
    isUuid(value.correlationId)
  );
}

export function normalizePhase4CommandResult(value: unknown): Phase4CommandResult {
  if (!isExactPlainObject(value, ["command_receipt_id", "outcome", "stable_reason"]) && !isExactPlainObject(value, ["commandReceiptId", "outcome", "stableReason"])) return unavailableResult();
  const outcome = value.outcome;
  const stableReason = value.stable_reason ?? value.stableReason;
  const commandReceiptId = value.command_receipt_id ?? value.commandReceiptId;

  if (
    (outcome !== "accepted" && outcome !== "replayed" && outcome !== "rejected" && outcome !== "reconciliation_required") ||
    typeof stableReason !== "string" ||
    !reasonCodes.has(stableReason as Phase4StableReason) ||
    (commandReceiptId !== null && (!isUuid(commandReceiptId) || (outcome === "rejected" && commandReceiptId !== null))) || !isResultCombination(outcome, stableReason as Phase4StableReason)
  ) {
    return unavailableResult();
  }

  return {
    commandReceiptId,
    outcome,
    stableReason: stableReason as Phase4StableReason
  };
}

export function checkpointGateAllowsAccess(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.customer_access_allowed === true &&
    (value.reason_code === "ok" || value.reasonCode === "ok")
  );
}

function unavailableResult(): Phase4CommandResult {
  return { commandReceiptId: null, outcome: "rejected", stableReason: "command_unavailable" };
}

function isOpaque(value: unknown): value is string {
  return typeof value === "string" && opaqueReference.test(value) && !sensitiveOpaque.test(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isExactPlainObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length !== 0) return false;
  const own = Object.keys(value);
  if (own.length !== keys.length || own.some((key) => !keys.includes(key))) return false;
  return own.every((key) => { const descriptor = Object.getOwnPropertyDescriptor(value, key); return Boolean(descriptor && "value" in descriptor && descriptor.enumerable); });
}
function isResultCombination(outcome: unknown, reason: Phase4StableReason): boolean {
  return (outcome === "accepted" && reason === "ok") || (outcome === "replayed" && reason === "duplicate_command") || (outcome === "reconciliation_required" && reason === "reconciliation_required") || (outcome === "rejected" && reason !== "ok" && reason !== "duplicate_command");
}