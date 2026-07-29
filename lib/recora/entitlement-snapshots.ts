import "server-only";

import { createRecoraSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type EntitlementReasonCode =
  | "ok"
  | "invalid_scope"
  | "no_snapshot"
  | "expired_snapshot"
  | "ambiguous_snapshot"
  | "invalid_reference"
  | "resolver_unavailable";

export type EntitlementSnapshot = {
  snapshotId: string;
  schemaVersion: number;
  capabilities: Record<string, boolean>;
  limits: Record<string, number>;
  resolverVersion: string;
  hash: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
};

export type EntitlementSnapshotReference = {
  entitlementSnapshotId: string;
  entitlementSchemaVersion: number;
  entitlementSnapshotHash: string;
};

export type EntitlementResolution =
  | { ok: true; reasonCode: "ok"; snapshot: EntitlementSnapshot }
  | { ok: false; reasonCode: Exclude<EntitlementReasonCode, "ok"> };

export type EntitlementCapabilityResult = {
  allowed: boolean;
  reasonCode: EntitlementReasonCode | "capability_unavailable";
};

export type EntitlementLimitResult = {
  value: number | null;
  reasonCode: EntitlementReasonCode | "limit_unavailable";
};

type EntitlementSnapshotRpcRow = {
  snapshot_id: unknown;
  entitlement_schema_version: unknown;
  capabilities: unknown;
  limits: unknown;
  resolver_version: unknown;
  snapshot_hash: unknown;
  effective_from: unknown;
  effective_until: unknown;
  reason_code: unknown;
};

const reasonCodes = new Set<EntitlementReasonCode>([
  "ok",
  "invalid_scope",
  "no_snapshot",
  "expired_snapshot",
  "ambiguous_snapshot",
  "invalid_reference",
  "resolver_unavailable"
]);

export async function resolveCurrentEntitlementSnapshot(input: {
  organizationId: string;
  projectId?: string | null;
}): Promise<EntitlementResolution> {
  const supabase = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc(
    "recora_resolve_current_entitlement_snapshot",
    {
      p_organization_id: input.organizationId,
      p_project_id: input.projectId ?? null
    }
  );

  if (error || !Array.isArray(data) || data.length !== 1) {
    return { ok: false, reasonCode: "resolver_unavailable" };
  }

  return normalizeResolution(data[0] as EntitlementSnapshotRpcRow);
}

export async function validateEntitlementSnapshotReference(input: {
  organizationId: string;
  projectId?: string | null;
  snapshotId: string;
}): Promise<EntitlementReasonCode> {
  const supabase = createRecoraSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc(
    "recora_validate_entitlement_snapshot_reference",
    {
      p_organization_id: input.organizationId,
      p_project_id: input.projectId ?? null,
      p_snapshot_id: input.snapshotId
    }
  );

  if (error || typeof data !== "string" || !reasonCodes.has(data as EntitlementReasonCode)) {
    return "resolver_unavailable";
  }

  return data as EntitlementReasonCode;
}

export function toEntitlementSnapshotReference(
  resolution: EntitlementResolution
): EntitlementSnapshotReference | null {
  if (!resolution.ok) return null;

  return {
    entitlementSnapshotId: resolution.snapshot.snapshotId,
    entitlementSchemaVersion: resolution.snapshot.schemaVersion,
    entitlementSnapshotHash: resolution.snapshot.hash
  };
}

export function resolveNamedCapability(
  resolution: EntitlementResolution,
  capability: string
): EntitlementCapabilityResult {
  if (!resolution.ok) return { allowed: false, reasonCode: resolution.reasonCode };
  if (!isSafeEntitlementName(capability)) {
    return { allowed: false, reasonCode: "capability_unavailable" };
  }

  return resolution.snapshot.capabilities[capability] === true
    ? { allowed: true, reasonCode: "ok" }
    : { allowed: false, reasonCode: "capability_unavailable" };
}

export function resolveNamedLimit(
  resolution: EntitlementResolution,
  limit: string
): EntitlementLimitResult {
  if (!resolution.ok) return { value: null, reasonCode: resolution.reasonCode };
  if (!isSafeEntitlementName(limit)) {
    return { value: null, reasonCode: "limit_unavailable" };
  }

  const value = resolution.snapshot.limits[limit];
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? { value, reasonCode: "ok" }
    : { value: null, reasonCode: "limit_unavailable" };
}

function normalizeResolution(row: EntitlementSnapshotRpcRow): EntitlementResolution {
  const reasonCode = readReasonCode(row.reason_code);
  if (reasonCode !== "ok") return { ok: false, reasonCode };

  const schemaVersion =
    typeof row.entitlement_schema_version === "number"
      ? row.entitlement_schema_version
      : null;

  if (
    typeof row.snapshot_id !== "string" ||
    schemaVersion === null ||
    !Number.isInteger(schemaVersion) ||
    schemaVersion <= 0 ||
    typeof row.resolver_version !== "string" ||
    typeof row.snapshot_hash !== "string" ||
    typeof row.effective_from !== "string"
  ) {
    return { ok: false, reasonCode: "invalid_reference" };
  }

  const capabilities = asBooleanRecord(row.capabilities);
  const limits = asLimitRecord(row.limits);
  if (!capabilities || !limits) return { ok: false, reasonCode: "invalid_reference" };

  return {
    ok: true,
    reasonCode: "ok",
    snapshot: {
      snapshotId: row.snapshot_id,
      schemaVersion,
      capabilities,
      limits,
      resolverVersion: row.resolver_version,
      hash: row.snapshot_hash,
      effectiveFrom: row.effective_from,
      effectiveUntil: typeof row.effective_until === "string" ? row.effective_until : null
    }
  };
}

function readReasonCode(value: unknown): EntitlementReasonCode {
  return typeof value === "string" && reasonCodes.has(value as EntitlementReasonCode)
    ? (value as EntitlementReasonCode)
    : "invalid_reference";
}

function asBooleanRecord(value: unknown): Record<string, boolean> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  return entries.every(([, entry]) => typeof entry === "boolean")
    ? (Object.fromEntries(entries) as Record<string, boolean>)
    : null;
}

function asLimitRecord(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  return entries.every(
    ([, entry]) => typeof entry === "number" && Number.isFinite(entry) && entry >= 0
  )
    ? (Object.fromEntries(entries) as Record<string, number>)
    : null;
}

function isSafeEntitlementName(value: string) {
  return /^[a-z][a-z0-9_.-]*$/.test(value);
}