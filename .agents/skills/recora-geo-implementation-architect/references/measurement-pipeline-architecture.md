# Measurement Pipeline Architecture

## Conceptual Pipeline

prompt definition -> measurement run -> provider execution -> raw response -> normalized answer -> mention extraction -> citation extraction -> source normalization -> source-to-claim review -> evidence ledger -> candidate draft generation -> quality gate -> client-facing recommendation or internal hold/rejection -> remeasurement

## Stage Contract

For each stage, define:

- input
- output
- validation
- failure state
- retry safety
- audit fields
- what must remain immutable
- what can be recomputed

## Stage Guidance

### Prompt Definition

- Input: prompt template, taxonomy, persona, buyer stage, seed terms.
- Output: versioned prompt definition.
- Immutable: text used for a measurement run.
- Recomputable: taxonomy annotations when versioned.

### Measurement Run

- Input: prompt set, provider plan, target brand, settings.
- Output: run ID, run item IDs, state transitions.
- Failure: canceled, partial, timed out, blocked, terminal.
- Audit: requested by, requested at, settings, schema version.

### Provider Execution

- Input: run item and provider adapter request.
- Output: raw response reference, provider status, usage, latency, error state.
- Retry safety: idempotency key and request correlation ID.
- Immutable: raw response and provider metadata.

### Raw Response

- Input: provider output or error.
- Output: immutable raw artifact reference.
- Failure: missing, malformed, refusal, partial, timeout.
- Recomputable: normalized answer and extracted fields.

### Normalized Answer

- Input: raw response and parser version.
- Output: answer text, refusal/empty/partial markers, citations when supplied.
- Validation: preserve source text and uncertainty.

### Mention Extraction

- Input: normalized answer, target brand, aliases, competitors, seed terms.
- Output: mention records with span, context, entity type, confidence, parser version.
- Failure: ambiguous, collision, prompt echo, URL-only match.

### Citation Extraction

- Input: raw and normalized response.
- Output: original citation URLs, canonical URLs, domains, titles, occurrence counts.
- Failure: hallucinated, malformed, missing, duplicate.

### Source Normalization

- Input: citation URLs and source metadata.
- Output: source domain records and normalized URL records.
- Validation: do not lose original URL or occurrence count.

### Source-To-Claim Review

- Input: answer claims, source text when available, citation relation.
- Output: status: supported, partially_supported, contradicted, unrelated, unknown, not_reviewed.
- Failure: unavailable source, retrieval error, ambiguous claim.

### Evidence Ledger

- Input: run, prompt, answer, mentions, citations, source-to-claim status, seed risk.
- Output: traceable evidence ledger entry.
- Immutable: evidence references and measured context.

### Candidate Draft Generation

- Input: evidence ledger entries.
- Output: recommendation candidate draft, risk flags, missing fields, draft-time rejection.
- Rule: never decide `auto_publish`.

### Quality Gate

- Input: candidate payload and evidence refs.
- Output: separate persisted quality-gate review.
- Rule: publication uses explicit approved gate review only.

### Publication / Hold / Rejection

- Input: gate decision.
- Output: client-facing recommendation, internal hold task, or rejection record.
- Audit: review version, reviewer comment, supersession reason.

### Remeasurement

- Input: approved action, change event, schedule, or manual request.
- Output: new measurement task.
- Rule: compare only compatible methods and prompt versions.
