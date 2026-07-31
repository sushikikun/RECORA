import "server-only";

import {
  type Phase4CommandFixture,
  checkpointGateAllowsAccess,
  isPhase4CommandFixture,
  phase4CommandSchemaVersion
} from "./phase4-command-contract";
import {
  type EntitlementDocument,
  normalizeEntitlementDocument
} from "./entitlement-snapshots";

export const phase4ContractBillingIntegrationSchemaVersion = 1 as const;

export type Phase4ContractState =
  | "draft"
  | "pending_activation"
  | "active"
  | "paused"
  | "canceled"
  | "ended";

export type Phase4ReceiptState =
  | "received"
  | "validated"
  | "applying"
  | "applied"
  | "ignored_duplicate"
  | "rejected"
  | "reconciliation_required";

export type Phase4PaymentFactKind =
  | "payment_succeeded"
  | "payment_failed"
  | "payment_reversed"
  | "payment_disputed"
  | "payment_unknown";

export type Phase4ProviderNeutralBillingEnvelope = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  organizationId: string;
  projectId: string | null;
  sourceKind: "provider_fixture";
  sourceNamespace: string;
  sourceReference: string;
  sourceSequence: number;
  payloadFingerprint: string;
  idempotencyKey: string;
  requestId: string;
  correlationId: string;
  receipt: Phase4ReceiptTransition;
  paymentFact: Phase4PaymentFactFixture;
  contract: Phase4ContractTransition;
  entitlement: Phase4EntitlementSnapshotFixture | null;
  lifecycleCheckpoint: Phase4LifecycleCheckpointFixture | null;
};

export type Phase4ReceiptTransition = {
  eventSequence: number;
  previousState: Phase4ReceiptState | null;
  nextState: Phase4ReceiptState;
};

export type Phase4PaymentFactFixture = {
  factKind: Phase4PaymentFactKind;
  paymentChainKey: string;
  correctsFactId: string | null;
};

export type Phase4ContractTransition = {
  contractReference: string;
  eventSequence: number;
  previousState: Phase4ContractState | null;
  nextState: Phase4ContractState;
};

export type Phase4EntitlementSnapshotFixture = {
  planPolicyVersionId: string;
  entitlementSchemaVersion: number;
  resolvedDocument: EntitlementDocument;
  effectiveFrom: string;
  effectiveUntil: string | null;
  resolverVersion: string;
  idempotencyKey: string;
};

export type Phase4LifecycleCheckpointFixture = {
  requiredEffect: string;
  blocksCustomerAccess: boolean;
  phase3LifecycleId: string | null;
  expectedLifecycleVersion: number | null;
};

export type Phase4ContractBillingValidationReason =
  | "ok"
  | "invalid_envelope"
  | "invalid_scope"
  | "invalid_source"
  | "invalid_receipt"
  | "invalid_payment_fact"
  | "invalid_contract"
  | "invalid_entitlement"
  | "invalid_checkpoint";

export type Phase4ContractBillingValidation =
  | {
      ok: true;
      envelope: Phase4ProviderNeutralBillingEnvelope;
    }
  | {
      ok: false;
      reasonCode: Exclude<Phase4ContractBillingValidationReason, "ok">;
    };

export type Phase4ReceiptObservation = {
  sourceNamespace: string;
  sourceReference: string;
  sourceSequence: number;
  payloadFingerprint: string;
};

export type Phase4ContractBillingPlanContext = {
  latestSourceSequence: number | null;
  currentContractState: Phase4ContractState | null;
  existingReceipt: Phase4ReceiptObservation | null;
};

export type Phase4ContractBillingPlan =
  | {
      ok: true;
      receiptState: "validated" | "ignored_duplicate";
      commandFixtures: Phase4ContractBillingCommandFixtures;
      customerSafeResult: Phase4CustomerSafeContractResult;
    }
  | {
      ok: false;
      receiptState: "rejected" | "reconciliation_required";
      stableReason:
        | "invalid_reference"
        | "idempotency_conflict"
        | "ordering_conflict"
        | "reconciliation_required";
      customerSafeResult: Phase4CustomerSafeContractResult;
    };

export type Phase4ContractBillingCommandFixtures = {
  receipt: Phase4CommandFixture;
  paymentFact: Phase4CommandFixture;
  contractProjection: Phase4CommandFixture;
  lifecycleCheckpoint: Phase4CommandFixture | null;
};

export type Phase4CustomerSafeReason =
  | "ok"
  | "invalid_reference"
  | "checkpoint_pending"
  | "checkpoint_failed"
  | "reconciliation_required"
  | "command_unavailable";

export type Phase4CustomerSafeContractResult = {
  schemaVersion: typeof phase4ContractBillingIntegrationSchemaVersion;
  customerAccessAllowed: boolean;
  reasonCode: Phase4CustomerSafeReason;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  capabilities: Record<string, boolean>;
  limits: Record<string, number>;
};

const envelopeKeys = [
  "schemaVersion",
  "organizationId",
  "projectId",
  "sourceKind",
  "sourceNamespace",
  "sourceReference",
  "sourceSequence",
  "payloadFingerprint",
  "idempotencyKey",
  "requestId",
  "correlationId",
  "receipt",
  "paymentFact",
  "contract",
  "entitlement",
  "lifecycleCheckpoint"
] as const;
const receiptKeys = ["eventSequence", "previousState", "nextState"] as const;
const paymentFactKeys = ["factKind", "paymentChainKey", "correctsFactId"] as const;
const contractKeys = ["contractReference", "eventSequence", "previousState", "nextState"] as const;
const entitlementKeys = [
  "planPolicyVersionId",
  "entitlementSchemaVersion",
  "resolvedDocument",
  "effectiveFrom",
  "effectiveUntil",
  "resolverVersion",
  "idempotencyKey"
] as const;
const checkpointKeys = [
  "requiredEffect",
  "blocksCustomerAccess",
  "phase3LifecycleId",
  "expectedLifecycleVersion"
] as const;
const customerSafeKeys = [
  "schemaVersion",
  "customerAccessAllowed",
  "reasonCode",
  "effectiveFrom",
  "effectiveUntil",
  "capabilities",
  "limits"
] as const;
const forbiddenCustomerSafeKeys = /provider|billing|receipt|payment|audit|payload|webhook|signature|pointer|snapshot_id|policy|command|correlation|request|source/i;
const opaqueReference = /^[a-z][a-z0-9_.:-]{2,127}$/;
const sensitiveOpaque = /(^|[_.:-])(token|secret|password|credential|authorization|cookie|session|email|phone|jwt|claim|access|refresh|payload|webhook|signature|payment_method|database|private|api)([_.:-]|$)/i;
const fingerprint = /^[0-9a-f]{64}$/;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contractStates = new Set<Phase4ContractState>([
  "draft",
  "pending_activation",
  "active",
  "paused",
  "canceled",
  "ended"
]);
const receiptStates = new Set<Phase4ReceiptState>([
  "received",
  "validated",
  "applying",
  "applied",
  "ignored_duplicate",
  "rejected",
  "reconciliation_required"
]);
const paymentFactKinds = new Set<Phase4PaymentFactKind>([
  "payment_succeeded",
  "payment_failed",
  "payment_reversed",
  "payment_disputed",
  "payment_unknown"
]);

export function validateProviderNeutralBillingEnvelope(
  value: unknown
): Phase4ContractBillingValidation {
  try {
    if (!isExactPlainObject(value, envelopeKeys)) return invalid("invalid_envelope");
    if (
      value.schemaVersion !== phase4ContractBillingIntegrationSchemaVersion ||
      !isUuid(value.organizationId) ||
      !isNullableUuid(value.projectId)
    ) {
      return invalid("invalid_scope");
    }
    if (
      value.sourceKind !== "provider_fixture" ||
      !isOpaque(value.sourceNamespace) ||
      !isOpaque(value.sourceReference) ||
      !isPositiveSafeInteger(value.sourceSequence) ||
      typeof value.payloadFingerprint !== "string" ||
      !fingerprint.test(value.payloadFingerprint) ||
      !isOpaque(value.idempotencyKey) ||
      !isUuid(value.requestId) ||
      !isUuid(value.correlationId)
    ) {
      return invalid("invalid_source");
    }

    if (!isReceiptTransition(value.receipt)) return invalid("invalid_receipt");
    if (!isPaymentFactFixture(value.paymentFact)) return invalid("invalid_payment_fact");
    if (!isContractTransition(value.contract)) return invalid("invalid_contract");
    if (!isEntitlementFixture(value.entitlement, value.contract.nextState)) {
      return invalid("invalid_entitlement");
    }
    if (!isCheckpointFixture(value.lifecycleCheckpoint)) return invalid("invalid_checkpoint");

    return { ok: true, envelope: value as Phase4ProviderNeutralBillingEnvelope };
  } catch {
    return invalid("invalid_envelope");
  }
}

export function isProviderNeutralBillingEnvelope(
  value: unknown
): value is Phase4ProviderNeutralBillingEnvelope {
  return validateProviderNeutralBillingEnvelope(value).ok;
}

export function planPhase4ContractBillingEffects(
  value: unknown,
  context: Phase4ContractBillingPlanContext
): Phase4ContractBillingPlan {
  const validation = validateProviderNeutralBillingEnvelope(value);
  if (!validation.ok) {
    return rejected("invalid_reference");
  }

  const envelope = validation.envelope;
  const duplicate = classifyDuplicate(envelope, context.existingReceipt);
  if (duplicate === "same") {
    return {
      ok: true,
      receiptState: "ignored_duplicate",
      commandFixtures: createCommandFixtures(envelope),
      customerSafeResult: createCustomerSafeContractResult({
        entitlement: envelope.entitlement,
        checkpointGate: { customer_access_allowed: true, reason_code: "ok" }
      })
    };
  }
  if (duplicate === "conflict") {
    return rejected("idempotency_conflict");
  }
  if (
    context.latestSourceSequence !== null &&
    envelope.sourceSequence <= context.latestSourceSequence
  ) {
    return rejected("ordering_conflict");
  }
  if (context.currentContractState !== envelope.contract.previousState) {
    return rejected("reconciliation_required");
  }
  if (!isContractTransitionAllowed(envelope.contract.previousState, envelope.contract.nextState)) {
    return rejected("reconciliation_required");
  }

  return {
    ok: true,
    receiptState: "validated",
    commandFixtures: createCommandFixtures(envelope),
    customerSafeResult: createCustomerSafeContractResult({
      entitlement: envelope.entitlement,
      checkpointGate: envelope.lifecycleCheckpoint
        ? { customer_access_allowed: false, reason_code: "checkpoint_pending" }
        : { customer_access_allowed: true, reason_code: "ok" }
    })
  };
}

export function createCommandFixtures(
  envelope: Phase4ProviderNeutralBillingEnvelope
): Phase4ContractBillingCommandFixtures {
  const receipt = createCommandFixture(envelope, "billing.receipt", envelope.sourceReference, "receipt");
  const paymentFact = createCommandFixture(
    envelope,
    "billing.payment_fact",
    envelope.sourceReference,
    "payment"
  );
  const contractProjection = createCommandFixture(
    envelope,
    "contract.projection",
    envelope.contract.contractReference,
    "contract"
  );
  const lifecycleCheckpoint = envelope.lifecycleCheckpoint
    ? createCommandFixture(envelope, "lifecycle.checkpoint", envelope.sourceReference, "checkpoint")
    : null;

  return { receipt, paymentFact, contractProjection, lifecycleCheckpoint };
}

export function createCustomerSafeContractResult(input: {
  entitlement: Phase4EntitlementSnapshotFixture | null;
  checkpointGate: unknown;
}): Phase4CustomerSafeContractResult {
  const gate = normalizeCheckpointGate(input.checkpointGate);
  const entitlement = gate.reasonCode === "ok" ? input.entitlement : null;
  const allowed = entitlement !== null;
  const result: Phase4CustomerSafeContractResult = {
    schemaVersion: phase4ContractBillingIntegrationSchemaVersion,
    customerAccessAllowed: allowed,
    reasonCode: allowed ? "ok" : gate.reasonCode,
    effectiveFrom: entitlement ? entitlement.effectiveFrom : null,
    effectiveUntil: entitlement ? entitlement.effectiveUntil : null,
    capabilities: entitlement ? { ...entitlement.resolvedDocument.capabilities } : {},
    limits: entitlement ? { ...entitlement.resolvedDocument.limits } : {}
  };

  assertCustomerSafeContractResult(result);
  return result;
}

export function assertCustomerSafeContractResult(
  result: Phase4CustomerSafeContractResult
): void {
  if (!isExactPlainObject(result, customerSafeKeys)) {
    throw new Error("P4-C customer-safe result shape is not exact.");
  }
  if (
    Object.keys(result).some((key) => forbiddenCustomerSafeKeys.test(key)) ||
    Object.keys(result.capabilities).some((key) => forbiddenCustomerSafeKeys.test(key)) ||
    Object.keys(result.limits).some((key) => forbiddenCustomerSafeKeys.test(key))
  ) {
    throw new Error("P4-C customer-safe result contains an internal key.");
  }
}

function createCommandFixture(
  envelope: Phase4ProviderNeutralBillingEnvelope,
  commandType: Phase4CommandFixture["commandType"],
  sourceReference: string,
  idempotencySuffix: string
): Phase4CommandFixture {
  const fixture: Phase4CommandFixture = {
    schemaVersion: phase4CommandSchemaVersion,
    commandType,
    sourceKind: envelope.sourceKind,
    sourceNamespace: envelope.sourceNamespace,
    sourceReference,
    sourceSequence: envelope.sourceSequence,
    payloadFingerprint: envelope.payloadFingerprint,
    idempotencyKey: appendOpaqueSuffix(envelope.idempotencyKey, idempotencySuffix),
    requestId: envelope.requestId,
    correlationId: envelope.correlationId
  };

  if (!isPhase4CommandFixture(fixture)) {
    throw new Error("P4-C generated an invalid P4-A command fixture.");
  }
  return fixture;
}

function rejected(
  stableReason:
    | "invalid_reference"
    | "idempotency_conflict"
    | "ordering_conflict"
    | "reconciliation_required"
): Phase4ContractBillingPlan {
  return {
    ok: false,
    receiptState: stableReason === "invalid_reference" ? "rejected" : "reconciliation_required",
    stableReason,
    customerSafeResult: createCustomerSafeContractResult({
      entitlement: null,
      checkpointGate: {
        customer_access_allowed: false,
        reason_code: stableReason === "reconciliation_required" ? "reconciliation_required" : "command_unavailable"
      }
    })
  };
}

function invalid(
  reasonCode: Exclude<Phase4ContractBillingValidationReason, "ok">
): Phase4ContractBillingValidation {
  return { ok: false, reasonCode };
}

function classifyDuplicate(
  envelope: Phase4ProviderNeutralBillingEnvelope,
  existing: Phase4ReceiptObservation | null
): "none" | "same" | "conflict" {
  if (!existing) return "none";
  if (
    existing.sourceNamespace !== envelope.sourceNamespace ||
    existing.sourceReference !== envelope.sourceReference
  ) {
    return "none";
  }
  return existing.sourceSequence === envelope.sourceSequence &&
    existing.payloadFingerprint === envelope.payloadFingerprint
    ? "same"
    : "conflict";
}

function normalizeCheckpointGate(value: unknown): {
  customerAccessAllowed: boolean;
  reasonCode: Phase4CustomerSafeReason;
} {
  if (checkpointGateAllowsAccess(value)) {
    return { customerAccessAllowed: true, reasonCode: "ok" };
  }
  try {
    if (!isExactPlainObject(value, ["customer_access_allowed", "reason_code"])) {
      return { customerAccessAllowed: false, reasonCode: "command_unavailable" };
    }
    if (
      value.customer_access_allowed === false &&
      (value.reason_code === "checkpoint_pending" ||
        value.reason_code === "checkpoint_failed" ||
        value.reason_code === "reconciliation_required")
    ) {
      return { customerAccessAllowed: false, reasonCode: value.reason_code };
    }
  } catch {
    return { customerAccessAllowed: false, reasonCode: "command_unavailable" };
  }
  return { customerAccessAllowed: false, reasonCode: "command_unavailable" };
}

function isReceiptTransition(value: unknown): value is Phase4ReceiptTransition {
  return (
    isExactPlainObject(value, receiptKeys) &&
    isPositiveSafeInteger(value.eventSequence) &&
    isNullableReceiptState(value.previousState) &&
    isReceiptState(value.nextState) &&
    isReceiptTransitionAllowed(value.previousState, value.nextState)
  );
}

function isPaymentFactFixture(value: unknown): value is Phase4PaymentFactFixture {
  if (!isExactPlainObject(value, paymentFactKeys)) return false;
  if (!isPaymentFactKind(value.factKind) || !isOpaque(value.paymentChainKey)) return false;
  if (!isNullableUuid(value.correctsFactId)) return false;
  return (
    value.correctsFactId === null ||
    value.factKind === "payment_reversed" ||
    value.factKind === "payment_disputed" ||
    value.factKind === "payment_unknown"
  );
}

function isContractTransition(value: unknown): value is Phase4ContractTransition {
  return (
    isExactPlainObject(value, contractKeys) &&
    isOpaque(value.contractReference) &&
    isPositiveSafeInteger(value.eventSequence) &&
    isNullableContractState(value.previousState) &&
    isContractState(value.nextState) &&
    isContractTransitionAllowed(value.previousState, value.nextState)
  );
}

function isEntitlementFixture(
  value: unknown,
  contractNextState: Phase4ContractState
): value is Phase4EntitlementSnapshotFixture | null {
  if (value === null) return contractNextState !== "active";
  if (!isExactPlainObject(value, entitlementKeys)) return false;
  if (
    !isUuid(value.planPolicyVersionId) ||
    !isPositiveSafeInteger(value.entitlementSchemaVersion) ||
    !isIsoTimestamp(value.effectiveFrom) ||
    !(value.effectiveUntil === null || isIsoTimestamp(value.effectiveUntil)) ||
    !isOpaque(value.resolverVersion) ||
    !isOpaque(value.idempotencyKey)
  ) {
    return false;
  }
  const document = normalizeEntitlementDocument(value.resolvedDocument);
  if (!document || !isExactPlainObject(value.resolvedDocument, ["capabilities", "limits"])) {
    return false;
  }
  return (
    isPlainDataRecord(document.capabilities, "boolean") &&
    isPlainDataRecord(document.limits, "number")
  );
}

function isCheckpointFixture(value: unknown): value is Phase4LifecycleCheckpointFixture | null {
  if (value === null) return true;
  return (
    isExactPlainObject(value, checkpointKeys) &&
    isOpaque(value.requiredEffect) &&
    typeof value.blocksCustomerAccess === "boolean" &&
    isNullableUuid(value.phase3LifecycleId) &&
    (value.expectedLifecycleVersion === null || isPositiveSafeInteger(value.expectedLifecycleVersion))
  );
}

function isContractTransitionAllowed(
  previousState: Phase4ContractState | null,
  nextState: Phase4ContractState
): boolean {
  return (
    (previousState === null && nextState === "draft") ||
    (previousState === "draft" && (nextState === "pending_activation" || nextState === "canceled")) ||
    (previousState === "pending_activation" &&
      (nextState === "active" ||
        nextState === "paused" ||
        nextState === "canceled" ||
        nextState === "ended")) ||
    (previousState === "active" &&
      (nextState === "paused" || nextState === "canceled" || nextState === "ended")) ||
    (previousState === "paused" &&
      (nextState === "active" || nextState === "canceled" || nextState === "ended"))
  );
}

function isReceiptTransitionAllowed(
  previousState: Phase4ReceiptState | null,
  nextState: Phase4ReceiptState
): boolean {
  return (
    (previousState === null && nextState === "received") ||
    (previousState === "received" &&
      (nextState === "validated" ||
        nextState === "rejected" ||
        nextState === "reconciliation_required")) ||
    (previousState === "validated" &&
      (nextState === "applying" ||
        nextState === "rejected" ||
        nextState === "reconciliation_required")) ||
    (previousState === "applying" &&
      (nextState === "applied" ||
        nextState === "ignored_duplicate" ||
        nextState === "rejected" ||
        nextState === "reconciliation_required"))
  );
}

function appendOpaqueSuffix(value: string, suffix: string): string {
  const next = `${value}.${suffix}`;
  if (!isOpaque(next)) {
    throw new Error("P4-C idempotency suffix would violate the opaque reference boundary.");
  }
  return next;
}

function isContractState(value: unknown): value is Phase4ContractState {
  return typeof value === "string" && contractStates.has(value as Phase4ContractState);
}

function isNullableContractState(value: unknown): value is Phase4ContractState | null {
  return value === null || isContractState(value);
}

function isReceiptState(value: unknown): value is Phase4ReceiptState {
  return typeof value === "string" && receiptStates.has(value as Phase4ReceiptState);
}

function isNullableReceiptState(value: unknown): value is Phase4ReceiptState | null {
  return value === null || isReceiptState(value);
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
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && value.includes("T");
}

function isPlainDataRecord(
  value: unknown,
  primitive: "boolean" | "number"
): value is Record<string, boolean | number> {
  if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(value).every(([key, entry]) => {
    if (!/^[a-z][a-z0-9_.-]*$/.test(key) || forbiddenCustomerSafeKeys.test(key)) return false;
    if (primitive === "boolean") return typeof entry === "boolean";
    return typeof entry === "number" && Number.isFinite(entry) && entry >= 0;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isExactPlainObject<T extends readonly string[]>(
  value: unknown,
  keys: T
): value is Record<T[number], unknown> {
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
