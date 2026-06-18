import type {
  Json,
  RecoraAiConversationRow,
  RecoraCitationRow,
  RecoraMeasurementRunRow,
  RecoraRecommendationRow,
  RecoraSourceDomainRow
} from "./types";

export const SEED_MEASUREMENT_RUN_ID = "70000000-0000-4000-8000-000000000001";

type RunWithMetadata = Pick<RecoraMeasurementRunRow, "id" | "metadata">;

export function isSeedMeasurementRunId(runId: string | null | undefined) {
  return runId === SEED_MEASUREMENT_RUN_ID;
}

export function isOpenAiAggregateRun(run: RunWithMetadata) {
  const metadata = getMetadataRecord(run.metadata);

  return (
    !isSeedMeasurementRunId(run.id) &&
    getMetadataString(metadata, "run_kind") === "aggregate" &&
    getMetadataString(metadata, "data_source") === "openai_measurement"
  );
}

export function isOpenAiMeasuredConversation(
  conversation: Pick<RecoraAiConversationRow, "provider" | "response_id">
) {
  return conversation.provider === "openai" || Boolean(conversation.response_id);
}

export function isDisplayableSourceDomain(sourceDomain: Pick<RecoraSourceDomainRow, "domain">) {
  return !isExampleDomain(sourceDomain.domain);
}

export function isDisplayableCitation(citation: Pick<RecoraCitationRow, "domain" | "url">) {
  return !isExampleDomain(citation.domain) && !isExampleDomain(citation.url);
}

export function isDisplayableRecommendation(
  recommendation: Pick<RecoraRecommendationRow, "run_id" | "target_url">
) {
  return !isSeedMeasurementRunId(recommendation.run_id) && !isExampleDomain(recommendation.target_url);
}

export function getMetadataRecord(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value ? value : null;
}

function isExampleDomain(value: string | null | undefined) {
  const hostname = getHostname(value);
  return Boolean(hostname && (hostname === "example" || hostname.endsWith(".example")));
}

function getHostname(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  try {
    return new URL(normalized.includes("://") ? normalized : `https://${normalized}`).hostname;
  } catch {
    return normalized.split("/")[0]?.split(":")[0] ?? null;
  }
}
