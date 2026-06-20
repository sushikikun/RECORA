# Provider Status And Run State Persistence Design

## CONFIRMED_FROM_FILES

- `measurement_runs.status` uses run states from the migration enum.
- `run_items.status` uses item states from the migration enum.
- `ai_conversations` stores provider, requested model, returned model, response ID, raw response JSON, usage JSON, web search flag, citation status, measured timestamp, and response time.
- `ai_conversations_provider_response_id_unique_idx` deduplicates provider and response ID when both are present.
- No dedicated `provider_executions` table was found.

## USER_PROVIDED_CONTEXT

- v0.4 should cover provider status, run state, retries, idempotency, cost control, and observability at persistence level.

## NEEDS_VERIFICATION

- Retry attempts, timeouts, blocked states, cancellation, and cost budgets are not fully represented by confirmed tables.
- Whether raw provider responses are stored only server-side and protected by policy is unverified.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Separate provider execution attempts from final conversation evidence when retries are possible.
- Persist provider status as operational state, not evidence quality.
- Store attempt number, idempotency key, provider request hash, response ID, status, error class, latency, usage, cost estimate, and raw response pointer or JSON.
- Promote only completed, parseable, policy-allowed responses into evidence rows.
- Ensure failed, blocked, timed-out, or partial provider states cannot become valid brand absence findings without explicit review.

## DO_NOT_ASSUME

- Do not treat `run_items.status = completed` as proof that citations or parser outputs are valid.
- Do not treat `citation_status = available` as claim support.
- Do not treat provider response ID uniqueness as full regeneration idempotency.
