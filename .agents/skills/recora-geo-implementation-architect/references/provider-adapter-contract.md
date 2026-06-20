# Provider Adapter Contract

## Normalized Provider Result

Use a normalized result with fields such as:

- `provider`
- `provider_family`
- `provider_model`
- `provider_status`
- `provider_capability_status`
- `search_mode`
- `collection_method`
- `surface`
- `requested_at`
- `completed_at`
- `request_id`
- `idempotency_key`
- `raw_response_ref`
- `answer_text`
- `citations`
- `citation_extraction_status`
- `usage`
- `cost_estimate`
- `currency`
- `latency`
- `finish_status`
- `response_status`
- `error_code`
- `error_message_ref`
- `retryable`
- `attempt`
- `max_attempts`
- `partial`
- `blocked_reason`
- `schema_version`
- `adapter_version`

## Rules

- `provider_status` does not prove result quality.
- `provider_capability_status` describes method availability, not evidence quality.
- Platform-specific fields stay in raw metadata.
- Normalized fields must not erase uncertainty.
- Adapter failures must not become brand-absence findings.
- Timeouts and blocked states must be distinguishable from valid `brand absent` results.
- Empty, refusal, safety-blocked, truncated, malformed, and partial responses need distinct states.
- `usage` and `latency` should be captured for cost and reliability review, but never logged with secrets.
- Product UI, browser-surface, API, manual, crawl, and SERP collection methods must not be collapsed.
- Planned, unknown, research-only, blocked, or disabled providers cannot support client-facing measurement claims.
- Provider-specific citation formats must normalize into a common citation contract while preserving raw metadata.
- A provider that returns no citations must be distinguishable from a parser that failed to extract citations.

## Review Questions

- Does the adapter preserve raw response data?
- Does it distinguish terminal and retryable errors?
- Does it carry provider request IDs where supplied?
- Does it make search mode explicit?
- Does it keep provider capability separate from answer correctness?
- Are duplicate retries idempotent?
- Are partial provider completions usable without corrupting run state?
- Does the adapter expose token/cost data without leaking secrets or full sensitive payloads?
- Can provider-specific fields be inspected without polluting normalized fields?
- Are blocked, rate-limited, policy-refused, timeout, empty, malformed, refusal, and valid absence states distinct?
- Can the same raw response be re-parsed with a new parser version without issuing a new provider request?
