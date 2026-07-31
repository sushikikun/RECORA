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

export type Phase4CustomerAccessDto = {
  customerAccessAllowed: boolean;
  reasonCode: string;
  membershipRole: Phase4AccountRole | null;
  entitlement: {
    capabilities: Record<string, boolean>;
    limits: Record<string, number>;
  };
  evidence: {
    lifecycleReasonCode: string | null;
    entitlementReasonCode: string | null;
    checkpointReasonCode: string | null;
  };
};

type CommandRpcRow = {
  command_receipt_id: unknown;
  outcome: unknown;
  reason_code: unknown;
  invitation_id: unknown;
  invitation_state: unknown;
  membership_id: unknown;
  membership_status: unknown;
  membership_episode_id: unknown;
  membership_episode_state: unknown;
  audit_event_id: unknown;
  operator_command_receipt_id: unknown;
};

type AccessRpcRow = {
  customer_access_allowed: unknown;
  reason_code: unknown;
  membership_role: unknown;
  entitlement_capabilities: unknown;
  entitlement_limits: unknown;
  lifecycle_reason_code: unknown;
  entitlement_reason_code: unknown;
  checkpoint_reason_code: unknown;
};

const roles = new Set<Phase4AccountRole>(["owner", "admin", "member", "viewer"]);
const invitationStates = new Set<Phase4InvitationState>(["pending", "accepted", "expired", "revoked", "superseded"]);
const membershipStatuses = new Set<Phase4MembershipStatus>(["invited", "active", "suspended", "revoked"]);
const episodeStates = new Set<Phase4MembershipEpisodeState>(["invited", "active", "revoked"]);
const outcomes = new Set<Phase4CommandOutcome>(["accepted", "replayed", "rejected"]);

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
): Promise<Phase4AccountCommandResult> {
  return callCommand(transport, "recora_p4b_invitation_create", {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_organization_id: input.organizationId,
    p_recipient_binding_hash: input.recipientBindingHash,
    p_intended_role: input.intendedRole,
    p_expires_at: input.expiresAt,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  });
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
): Promise<Phase4AccountCommandResult> {
  return callCommand(transport, "recora_p4b_invitation_resend", {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_invitation_id: input.invitationId,
    p_recipient_binding_hash: input.recipientBindingHash,
    p_expires_at: input.expiresAt,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  });
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
): Promise<Phase4AccountCommandResult> {
  return callCommand(transport, "recora_p4b_invitation_revoke", {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_invitation_id: input.invitationId,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  });
}

export async function acceptPhase4Invitation(
  transport: Phase4AccountAccessRpcTransport,
  input: {
    invitationId: string;
    verifiedAuthUserId: string;
    recipientBindingHash: string;
    requestId: string;
    correlationId: string;
    idempotencyKey: string;
  },
): Promise<Phase4AccountCommandResult> {
  return callCommand(transport, "recora_p4b_invitation_accept", {
    p_invitation_id: input.invitationId,
    p_verified_auth_user_id: input.verifiedAuthUserId,
    p_recipient_binding_hash: input.recipientBindingHash,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  });
}

export async function suspendPhase4Membership(
  transport: Phase4AccountAccessRpcTransport,
  input: OperatorMembershipCommandInput,
): Promise<Phase4AccountCommandResult> {
  return callMembershipCommand(transport, "recora_p4b_membership_suspend", input);
}

export async function reactivatePhase4Membership(
  transport: Phase4AccountAccessRpcTransport,
  input: OperatorMembershipCommandInput,
): Promise<Phase4AccountCommandResult> {
  return callMembershipCommand(transport, "recora_p4b_membership_reactivate", input);
}

export async function revokePhase4Membership(
  transport: Phase4AccountAccessRpcTransport,
  input: OperatorMembershipCommandInput,
): Promise<Phase4AccountCommandResult> {
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
  const row = Array.isArray(data) ? (data[0] as AccessRpcRow | undefined) : undefined;
  return normalizeAccess(row);
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
  functionName: string,
  input: OperatorMembershipCommandInput,
): Promise<Phase4AccountCommandResult> {
  return callCommand(transport, functionName, {
    p_operator_auth_user_id: input.operatorAuthUserId,
    p_membership_id: input.membershipId,
    p_reason: input.reason,
    p_request_id: input.requestId,
    p_correlation_id: input.correlationId,
    p_idempotency_key: input.idempotencyKey,
  });
}

async function callCommand(
  transport: Phase4AccountAccessRpcTransport,
  functionName: string,
  args: Record<string, unknown>,
): Promise<Phase4AccountCommandResult> {
  const { data, error } = await transport.rpc(functionName, args);
  if (error) throw new Error("The Phase 4 account command boundary could not record the command.");

  const row = Array.isArray(data) ? (data[0] as CommandRpcRow | undefined) : undefined;
  return normalizeCommand(row);
}

function normalizeCommand(row: CommandRpcRow | undefined): Phase4AccountCommandResult {
  if (!row || typeof row.outcome !== "string" || !outcomes.has(row.outcome as Phase4CommandOutcome) || typeof row.reason_code !== "string") {
    throw new Error("The Phase 4 account command boundary returned an invalid response.");
  }

  const invitationState = nullableEnum(row.invitation_state, invitationStates);
  const membershipStatus = nullableEnum(row.membership_status, membershipStatuses);
  const episodeState = nullableEnum(row.membership_episode_state, episodeStates);

  return {
    commandReceiptId: nullableString(row.command_receipt_id),
    outcome: row.outcome as Phase4CommandOutcome,
    reasonCode: row.reason_code,
    invitation:
      nullableString(row.invitation_id) && invitationState
        ? { id: nullableString(row.invitation_id)!, state: invitationState }
        : null,
    membership:
      nullableString(row.membership_id) && membershipStatus
        ? { id: nullableString(row.membership_id)!, status: membershipStatus }
        : null,
    membershipEpisode:
      nullableString(row.membership_episode_id) && episodeState
        ? { id: nullableString(row.membership_episode_id)!, state: episodeState }
        : null,
    auditEventId: nullableString(row.audit_event_id),
    operatorCommandReceiptId: nullableString(row.operator_command_receipt_id),
  };
}

function normalizeAccess(row: AccessRpcRow | undefined): Phase4CustomerAccessDto {
  if (!row || typeof row.customer_access_allowed !== "boolean" || typeof row.reason_code !== "string") {
    return unavailableAccess();
  }

  return {
    customerAccessAllowed: row.customer_access_allowed,
    reasonCode: row.reason_code,
    membershipRole: typeof row.membership_role === "string" && roles.has(row.membership_role as Phase4AccountRole) ? (row.membership_role as Phase4AccountRole) : null,
    entitlement: {
      capabilities: normalizeBooleanRecord(row.entitlement_capabilities),
      limits: normalizeNumberRecord(row.entitlement_limits),
    },
    evidence: {
      lifecycleReasonCode: nullableString(row.lifecycle_reason_code),
      entitlementReasonCode: nullableString(row.entitlement_reason_code),
      checkpointReasonCode: nullableString(row.checkpoint_reason_code),
    },
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

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nullableEnum<T extends string>(value: unknown, allowed: Set<T>): T | null {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : null;
}

function normalizeBooleanRecord(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"));
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] >= 0,
    ),
  );
}