# Idempotency, Retry, Concurrency, And Cost

## Cover

- idempotency keys for measurement runs and provider calls
- idempotency keys for crawl/extraction jobs
- duplicate job prevention
- retryable versus terminal errors
- exponential backoff
- partial provider completion
- partial crawl/source extraction completion
- concurrency limits
- per-run budgets
- token and cost accounting
- external service cost accounting when separately approved
- timeout handling
- cancellation
- stale job detection
- replay safety
- avoiding duplicate citations, mentions, candidates, and recommendations
- avoiding duplicate extracted pages, source domains, technical SEO issues, and source-to-claim reviews

## Review Questions

- What key prevents duplicate provider calls for the same run item?
- What key prevents duplicate derived records on repeated queue delivery?
- Can a retry distinguish "same request replay" from "new measurement"?
- Are timeouts stored as timeouts rather than brand absence?
- Are partial completions represented without marking the whole run successful?
- Are per-run and per-tenant cost ceilings enforced?
- Are cancellation and stale jobs visible to operators?
- Is cost logged without exposing prompts or sensitive payloads unnecessarily?
- Can crawl/source extraction retries avoid duplicate page artifacts and duplicate technical issues?
- Are provider fallback attempts visible instead of silently merging results from incompatible methods?
- Are rate limits, queue concurrency, and external API budgets configurable per tenant/run?
- Does replay preserve raw evidence while allowing derived outputs to be regenerated?

## Failure Handling

- Retry only retryable failures.
- Preserve terminal failures with reason and timestamp.
- Use exponential backoff with jitter when external calls are approved.
- Make retry count and last error auditable.
- Keep provider failure states out of candidate evidence unless explicitly framed as operational limitations.
- Treat repeated queue delivery as expected behavior, not an exceptional edge case.
- Keep timeout, rate limit, blocked, robots-disallowed, policy-refused, and canceled states distinct.
- Do not let a retry overwrite a prior successful raw artifact unless supersession is explicit and auditable.

## Cost And Budget Controls

- Track requested tokens, completed tokens, crawl pages, external calls, latency, and estimated cost when available.
- Store budget exhaustion as a run state, not as an evidence finding.
- Prefer fail-closed publication behavior when budgets prevent complete evidence collection.
- Do not log provider keys, credentials, cookies, full raw payloads, or sensitive customer data in cost telemetry.
