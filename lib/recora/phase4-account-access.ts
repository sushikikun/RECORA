import "server-only";

export type Phase4AccountAccessRpcTransport = {
  rpc<TData = unknown>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<{ data: TData; error: { message?: string } | null }>;
};

export type Phase4AccountRole = "owner" | "admin" | "member" | "viewer";
export type Phase4InvitationState = "pending" | "accepted" | "expired" | "revoked" | "superseded";
export type Phase4MembershipStatus = "invited" | "active" | "suspended" | "revoked";
export type Phase4MembershipEpisodeState = "invited" | "active" | "revoked";
export type Phase4CommandOutcome = "accepted" | "replayed" | "rejected";

export type Phase4AccountCommandResult = {
  commandReceiptId: string | null;
  outcome: Phase4CommandOutcome;
  reasonCode: string;
  invitation: { id: string; state: Phase4InvitationState } | null;
  membership: { id: string; status: Phase4MembershipStatus } | null;
  membershipEpisode: { id: string; state: Phase4MembershipEpisodeState } | null;
  auditEventId: string | null;
  operatorCommandReceiptId: string | null;
};
export type Phase4OperatorAccountCommandResult = Phase4AccountCommandResult & {
  auditEventId: string | null;
  operatorCommandReceiptId: string | null;
};

export type Phase4CustomerAccountCommandResult = Phase4AccountCommandResult & {
  auditEventId: null;
  operatorCommandReceiptId: null;
};

type CommandRpcName =
  | "recora_p4b_invitation_create"
  | "recora_p4b_invitation_resend"
  | "recora_p4b_invitation_revoke"
  | "recora_p4b_invitation_accept"
  | "recora_p4b_membership_suspend"
  | "recora_p4b_membership_reactivate"
  | "recora_p4b_membership_revoke";

type MembershipCommandRpcName = Extract<CommandRpcName, "recora_p4b_membership_suspend" | "recora_p4b_membership_reactivate" | "recora_p4b_membership_revoke">;

type CommandResultContract = {
  actorKind: "operator" | "customer";
  successShape: {
    invitationState: Phase4InvitationState | null;
    membershipStatus: Phase4MembershipStatus | null;
    membershipEpisodeState: Phase4MembershipEpisodeState | null;
  };
};

export type Phase4CustomerAccessDto = {
  customerAccessAllowed: boolean;
  reasonCode: string;
  membershipRole: Phase4AccountRole | null;
  entitlement: {
    capabilities: Partial<Record<Phase4CustomerCapability, boolean>>;
    limits: Partial<Record<Phase4CustomerLimit, number>>;
  };
  evidence: {
    lifecycleReasonCode: string | null;
    entitlementReasonCode: string | null;
    checkpointReasonCode: string | null;
  };
};

type Phase4CustomerCapability = "report.view" | "export.data";
type Phase4CustomerLimit = "projects";

type CommandRpcRow = Record<(typeof commandRowKeys)[number], unknown>;
type AccessRpcRow = Record<(typeof accessRowKeys)[number], unknown>;

const roles = new Set<Phase4AccountRole>(["owner", "admin", "member", "viewer"]);
const invitationStates = new Set<Phase4InvitationState>(["pending", "accepted", "expired", "revoked", "superseded"]);
const membershipStatuses = new Set<Phase4MembershipStatus>(["invited", "active", "suspended", "revoked"]);
const episodeStates = new Set<Phase4MembershipEpisodeState>(["invited", "active", "revoked"]);
const outcomes = new Set<Phase4CommandOutcome>(["accepted", "replayed", "rejected"]);

const commandReasonCodes = new Set([
  "ok",
  "duplicate_command",
  "idempotency_conflict",
  "invalid_scope",
  "invalid_reference",
  "invalid_legacy_inventory",
  "target_organization_not_found",
  "target_scope_mismatch",
  "target_type_not_supported",
  "operator_identity_required",
  "operator_not_registered",
  "operator_not_active",
  "action_invalid",
  "reason_required",
  "reason_unsafe",
  "summary_unsafe",
  "permission_denied",
  "operator_authorization_denied",
  "operator_boundary_unavailable",
  "operator_receipt_missing",
  "operator_receipt_conflict",
  "operator_command_failed",
  "pending_invitation_exists",
  "invitation_not_pending",
  "invitation_expired",
  "recipient_mismatch",
  "identity_unverified",
  "invitation_unavailable",
  "membership_relation_exists",
  "membership_not_active",
  "membership_not_suspended",
  "membership_not_revocable",
]);

const accessReasonCodes = new Set([
  "ok",
  "invalid_scope",
  "capability_unavailable",
  "membership_required",
  "ambiguous_membership",
  "lifecycle_unavailable",
  "lifecycle_invalid_scope",
  "lifecycle_no_lifecycle_state",
  "lifecycle_ambiguous_lifecycle_state",
  "lifecycle_retained_restore_eligible",
  "lifecycle_access_suspended",
  "lifecycle_retained",
  "lifecycle_deletion_scheduled",
  "lifecycle_deleting",
  "lifecycle_deleted",
  "lifecycle_deletion_failed",
  "entitlement_unavailable",
  "entitlement_invalid_scope",
  "entitlement_no_snapshot",
  "entitlement_ambiguous_snapshot",
  "entitlement_expired_snapshot",
  "checkpoint_unavailable",
  "checkpoint_invalid_scope",
  "checkpoint_checkpoint_pending",
  "checkpoint_checkpoint_failed",
  "checkpoint_reconciliation_required",
  "resolver_unavailable",
]);

const evidenceReasonCodes = new Set([
  "ok",
  "active",
  "invalid_scope",
  "no_lifecycle_state",
  "ambiguous_lifecycle_state",
  "retained_restore_eligible",
  "access_suspended",
  "retained",
  "deletion_scheduled",
  "deleting",
  "deleted",
  "deletion_failed",
  "no_snapshot",
  "ambiguous_snapshot",
  "expired_snapshot",
  "checkpoint_pending",
  "checkpoint_failed",
  "reconciliation_required",
]);

const customerCapabilities = new Set<Phase4CustomerCapability>(["report.view", "export.data"]);
const customerLimits = new Set<Phase4CustomerLimit>(["projects"]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const commandRowKeys = [
  "command_receipt_id",
  "outcome",
  "reason_code",
  "invitation_id",
  "invitation_state",
  "membership_id",
  "membership_status",
  "membership_episode_id",
  "membership_episode_state",
  "audit_event_id",
  "operator_command_receipt_id",
] as const;
const accessRowKeys = [
  "customer_access_allowed",
  "reason_code",
  "membership_role",
  "entitlement_capabilities",
  "entitlement_limits",
  "lifecycle_reason_code",
  "entitlement_reason_code",
  "checkpoint_reason_code",
] as const;
const commandContracts = {
  recora_p4b_invitation_create: {
    actorKind: "operator",
    successShape: { invitationState: "pending", membershipStatus: null, membershipEpisodeState: null },
  },
  recora_p4b_invitation_resend: {
    actorKind: "operator",
    successShape: { invitationState: "pending", membershipStatus: null, membershipEpisodeState: null },
  },
  recora_p4b_invitation_revoke: {
    actorKind: "operator",
    successShape: { invitationState: "revoked", membershipStatus: null, membershipEpisodeState: null },
  },
  recora_p4b_invitation_accept: {
    actorKind: "customer",
    successShape: { invitationState: "accepted", membershipStatus: "active", membershipEpisodeState: "active" },
  },
  recora_p4b_membership_suspend: {
    actorKind: "operator",
    successShape: { invitationState: null, membershipStatus: "suspended", membershipEpisodeState: "active" },
  },
  recora_p4b_membership_reactivate: {
    actorKind: "operator",
    successShape: { invitationState: null, membershipStatus: "active", membershipEpisodeState: "active" },
  },
  recora_p4b_membership_revoke: {
    actorKind: "operator",
    successShape: { invitationState: null, membershipStatus: "revoked", membershipEpisodeState: "revoked" },
  },
} as const satisfies Record<CommandRpcName, CommandResultContract>;

export async function createPhase4Invitation(
  transport: Phase4AccountAccessRpcTransport,
  input: {
    operatorAuthUserId: string;
    organizationId: string;
    recipientBindingHash: string;
    intendedRole: Exclude<Phase4AccountRole, "owner">;
    expiresAt: string;
    reason: string;
    requestId: string;
    correlationId: string;
    idempotencyKey: string;
  },
): Promise<Phase4OperatorAccountCommandResult> {
  return callCommand<Phase4OperatorAccountCommandResult>(transport, "recora_p4b_invitation_create", {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_organization_id: input.organizationId,
    p_recipient_binding_hash: input.recipientBindingHash,
    p_intended_role: input.intendedRole,
    p_expires_at: input.expiresAt,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  }, commandContracts.recora_p4b_invitation_create);
}

export async function resendPhase4Invitation(
  transport: Phase4AccountAccessRpcTransport,
  input: {
    operatorAuthUserId: string;
    invitationId: string;
    recipientBindingHash: string;
    expiresAt: string;
    reason: string;
    requestId: string;
    correlationId: string;
    idempotencyKey: string;
  },
): Promise<Phase4OperatorAccountCommandResult> {
  return callCommand<Phase4OperatorAccountCommandResult>(transport, "recora_p4b_invitation_resend", {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_invitation_id: input.invitationId,
    p_recipient_binding_hash: input.recipientBindingHash,
    p_expires_at: input.expiresAt,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  }, commandContracts.recora_p4b_invitation_resend);
}

export async function revokePhase4Invitation(
  transport: Phase4AccountAccessRpcTransport,
  input: {
    operatorAuthUserId: string;
    invitationId: string;
    reason: string;
    requestId: string;
    correlationId: string;
    idempotencyKey: string;
  },
): Promise<Phase4OperatorAccountCommandResult> {
  return callCommand<Phase4OperatorAccountCommandResult>(transport, "recora_p4b_invitation_revoke", {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_invitation_id: input.invitationId,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  }, commandContracts.recora_p4b_invitation_revoke);
}

export async function acceptPhase4Invitation(
  transport: Phase4AccountAccessRpcTransport,
  input: {
    invitationId: string;
    requestId: string;
    correlationId: string;
    idempotencyKey: string;
  },
): Promise<Phase4CustomerAccountCommandResult> {
  return callCommand<Phase4CustomerAccountCommandResult>(transport, "recora_p4b_invitation_accept", {
    p_invitation_id: input.invitationId,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  }, commandContracts.recora_p4b_invitation_accept);
}

export async function suspendPhase4Membership(
  transport: Phase4AccountAccessRpcTransport,
  input: OperatorMembershipCommandInput,
): Promise<Phase4OperatorAccountCommandResult> {
  return callMembershipCommand(transport, "recora_p4b_membership_suspend", input);
}

export async function reactivatePhase4Membership(
  transport: Phase4AccountAccessRpcTransport,
  input: OperatorMembershipCommandInput,
): Promise<Phase4OperatorAccountCommandResult> {
  return callMembershipCommand(transport, "recora_p4b_membership_reactivate", input);
}

export async function revokePhase4Membership(
  transport: Phase4AccountAccessRpcTransport,
  input: OperatorMembershipCommandInput,
): Promise<Phase4OperatorAccountCommandResult> {
  return callMembershipCommand(transport, "recora_p4b_membership_revoke", input);
}

export async function resolvePhase4CustomerAccess(
  transport: Phase4AccountAccessRpcTransport,
  input: {
    verifiedAuthUserId: string;
    organizationId: string;
    projectId?: string | null;
    requiredCapability?: string | null;
  },
): Promise<Phase4CustomerAccessDto> {
  const { data, error } = await transport.rpc("recora_p4b_resolve_customer_access", {
    p_verified_auth_user_id: input.verifiedAuthUserId,
    p_organization_id: input.organizationId,
    p_project_id: input.projectId ?? null,
    p_required_capability: input.requiredCapability ?? null,
  });

  if (error) return unavailableAccess();
  return normalizeAccessRows(data);
}

type OperatorMembershipCommandInput = {
  operatorAuthUserId: string;
  membershipId: string;
  reason: string;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
};

async function callMembershipCommand(
  transport: Phase4AccountAccessRpcTransport,
  functionName: MembershipCommandRpcName,
  input: OperatorMembershipCommandInput,
): Promise<Phase4OperatorAccountCommandResult> {
  return callCommand<Phase4OperatorAccountCommandResult>(transport, functionName, {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_membership_id: input.membershipId,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  }, commandContracts[functionName]);
}

async function callCommand<TResult extends Phase4AccountCommandResult>(
  transport: Phase4AccountAccessRpcTransport,
  functionName: CommandRpcName,
  args: Record<string, unknown>,
  contract: CommandResultContract,
): Promise<TResult> {
  const { data, error } = await transport.rpc(functionName, args);
  if (error) throw new Error("The Phase 4 account command boundary could not record the command.");

  return normalizeCommandRows(data, contract) as TResult;
}

function normalizeCommandRows(data: unknown, contract: CommandResultContract): Phase4AccountCommandResult {
  const row = exactSingleRow(data, commandRowKeys);
  if (!row) throw invalidCommandResponse();
  return normalizeCommand(row as CommandRpcRow, contract);
}

function normalizeCommand(row: CommandRpcRow, contract: CommandResultContract): Phase4AccountCommandResult {
  if (typeof row.outcome !== "string" || !outcomes.has(row.outcome as Phase4CommandOutcome)) throw invalidCommandResponse();
  if (typeof row.reason_code !== "string" || !commandReasonCodes.has(row.reason_code)) throw invalidCommandResponse();
  const outcome = row.outcome as Phase4CommandOutcome;

  if ((outcome === "accepted" && row.reason_code !== "ok") || (outcome === "replayed" && row.reason_code !== "duplicate_command")) {
    throw invalidCommandResponse();
  }
  if (outcome === "rejected" && (row.reason_code === "ok" || row.reason_code === "duplicate_command")) throw invalidCommandResponse();

  const commandReceiptId = nullableUuid(row.command_receipt_id);
  if ((outcome === "accepted" || outcome === "replayed") && !commandReceiptId) throw invalidCommandResponse();
  if (outcome === "rejected" && commandReceiptId && row.reason_code !== "idempotency_conflict") throw invalidCommandResponse();

  const auditEventId = nullableUuid(row.audit_event_id);
  const operatorCommandReceiptId = nullableUuid(row.operator_command_receipt_id);
  assertCommandActorEvidence(contract, outcome, commandReceiptId, auditEventId, operatorCommandReceiptId);

  const result: Phase4AccountCommandResult = {
    commandReceiptId,
    outcome,
    reasonCode: row.reason_code,
    invitation: normalizeEntity(row.invitation_id, row.invitation_state, invitationStates, "state"),
    membership: normalizeEntity(row.membership_id, row.membership_status, membershipStatuses, "status"),
    membershipEpisode: normalizeEntity(row.membership_episode_id, row.membership_episode_state, episodeStates, "state"),
    auditEventId,
    operatorCommandReceiptId,
  };
  assertCommandSuccessShape(result, contract);
  return result;
}

function assertCommandActorEvidence(
  contract: CommandResultContract,
  outcome: Phase4CommandOutcome,
  commandReceiptId: string | null,
  auditEventId: string | null,
  operatorCommandReceiptId: string | null,
): void {
  if (contract.actorKind === "customer") {
    if (auditEventId !== null || operatorCommandReceiptId !== null) throw invalidCommandResponse();
    return;
  }

  if ((outcome === "accepted" || outcome === "replayed" || commandReceiptId !== null) && (auditEventId === null || operatorCommandReceiptId === null)) {
    throw invalidCommandResponse();
  }
  if (auditEventId === null && operatorCommandReceiptId !== null) throw invalidCommandResponse();
}

function assertCommandSuccessShape(result: Phase4AccountCommandResult, contract: CommandResultContract): void {
  if (result.outcome === "rejected") return;
  assertEntityState(result.invitation, contract.successShape.invitationState, "state");
  assertEntityState(result.membership, contract.successShape.membershipStatus, "status");
  assertEntityState(result.membershipEpisode, contract.successShape.membershipEpisodeState, "state");
}

function assertEntityState<T extends string, K extends "state" | "status">(
  entity: ({ id: string } & Record<K, T>) | null,
  expectedState: T | null,
  stateKey: K,
): void {
  if (expectedState === null) {
    if (entity !== null) throw invalidCommandResponse();
    return;
  }
  if (entity === null || entity[stateKey] !== expectedState) throw invalidCommandResponse();
}

function normalizeAccessRows(data: unknown): Phase4CustomerAccessDto {
  const row = exactSingleRow(data, accessRowKeys);
  if (!row) return unavailableAccess();
  return normalizeAccess(row as AccessRpcRow);
}

function normalizeAccess(row: AccessRpcRow): Phase4CustomerAccessDto {
  if (typeof row.customer_access_allowed !== "boolean" || typeof row.reason_code !== "string" || !accessReasonCodes.has(row.reason_code)) {
    return unavailableAccess();
  }

  const membershipRole = nullableEnum(row.membership_role, roles);
  if (row.membership_role !== null && membershipRole === null) return unavailableAccess();

  const capabilities = normalizeBooleanRecord(row.entitlement_capabilities, customerCapabilities);
  const limits = normalizeNumberRecord(row.entitlement_limits, customerLimits);
  if (capabilities === null || limits === null) return unavailableAccess();

  const lifecycleReasonCode = nullableReason(row.lifecycle_reason_code);
  const entitlementReasonCode = nullableReason(row.entitlement_reason_code);
  const checkpointReasonCode = nullableReason(row.checkpoint_reason_code);
  if (lifecycleReasonCode === undefined || entitlementReasonCode === undefined || checkpointReasonCode === undefined) return unavailableAccess();

  if (row.customer_access_allowed) {
    if (row.reason_code !== "ok" || membershipRole === null || lifecycleReasonCode !== "active" || entitlementReasonCode !== "ok" || checkpointReasonCode !== "ok") {
      return unavailableAccess();
    }
  }

  return {
    customerAccessAllowed: row.customer_access_allowed,
    reasonCode: row.reason_code,
    membershipRole,
    entitlement: { capabilities, limits },
    evidence: { lifecycleReasonCode, entitlementReasonCode, checkpointReasonCode },
  };
}

function unavailableAccess(): Phase4CustomerAccessDto {
  return {
    customerAccessAllowed: false,
    reasonCode: "resolver_unavailable",
    membershipRole: null,
    entitlement: { capabilities: {}, limits: {} },
    evidence: { lifecycleReasonCode: null, entitlementReasonCode: null, checkpointReasonCode: null },
  };
}

function invalidCommandResponse(): Error {
  return new Error("The Phase 4 account command boundary returned an invalid response.");
}

function exactSingleRow<T extends readonly string[]>(data: unknown, expectedKeys: T): Record<T[number], unknown> | null {
  if (!Array.isArray(data) || data.length !== 1) return null;
  return exactPlainRecord(data[0], expectedKeys);
}

function exactPlainRecord<T extends readonly string[]>(value: unknown, expectedKeys: T): Record<T[number], unknown> | null {
  if (!isPlainDataRecord(value)) return null;
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== expectedKeys.length) return null;
  for (const key of expectedKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) return null;
  }
  return value as Record<T[number], unknown>;
}

function isPlainDataRecord(value: unknown): value is Record<string, unknown> {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    if (Object.getPrototypeOf(value) !== Object.prototype) return false;
    if (Object.getOwnPropertySymbols(value).length !== 0) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return Object.values(descriptors).every((descriptor) => "value" in descriptor && descriptor.enumerable);
  } catch {
    return false;
  }
}

function nullableUuid(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === "string" && uuidPattern.test(value)) return value;
  throw invalidCommandResponse();
}

function nullableReason(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" && evidenceReasonCodes.has(value) ? value : undefined;
}

function nullableEnum<T extends string>(value: unknown, allowed: Set<T>): T | null {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : null;
}

function normalizeEntity<T extends string, K extends "state" | "status">(
  idValue: unknown,
  stateValue: unknown,
  allowedStates: Set<T>,
  stateKey: K,
): ({ id: string } & Record<K, T>) | null {
  const id = nullableUuid(idValue);
  const state = nullableEnum(stateValue, allowedStates);
  if (id === null && stateValue === null) return null;
  if (id !== null && state !== null) return { id, [stateKey]: state } as { id: string } & Record<K, T>;
  throw invalidCommandResponse();
}

function normalizeBooleanRecord<K extends string>(value: unknown, allowedKeys: Set<K>): Partial<Record<K, boolean>> | null {
  const record = exactAllowedValueRecord(value, allowedKeys);
  if (!record) return null;
  const normalized: Partial<Record<K, boolean>> = {};
  for (const [key, entryValue] of Object.entries(record)) {
    if (typeof entryValue !== "boolean") return null;
    normalized[key as K] = entryValue;
  }
  return normalized;
}

function normalizeNumberRecord<K extends string>(value: unknown, allowedKeys: Set<K>): Partial<Record<K, number>> | null {
  const record = exactAllowedValueRecord(value, allowedKeys);
  if (!record) return null;
  const normalized: Partial<Record<K, number>> = {};
  for (const [key, entryValue] of Object.entries(record)) {
    if (typeof entryValue !== "number" || !Number.isFinite(entryValue) || entryValue < 0) return null;
    normalized[key as K] = entryValue;
  }
  return normalized;
}

function exactAllowedValueRecord<K extends string>(value: unknown, allowedKeys: Set<K>): Partial<Record<K, unknown>> | null {
  if (!isPlainDataRecord(value)) return null;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key as K)) return null;
  }
  return value as Partial<Record<K, unknown>>;
}