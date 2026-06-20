# Observability And Audit Trail

## Required Signals

- structured logs
- run IDs
- run item IDs
- provider request IDs
- crawler/extraction job IDs
- collection method
- parser versions
- extractor versions
- schema versions
- candidate generation versions
- quality-gate versions
- retry count
- latency
- cost
- budget status
- failure reason
- state transitions
- audit history

## Rules

- Do not log secrets.
- Do not log full sensitive payloads unnecessarily.
- Prefer references to raw artifacts over dumping full answer text into every log line.
- Record state transitions explicitly.
- Include enough correlation IDs to trace provider response -> normalized answer -> evidence ledger -> candidate -> gate review -> publication or rejection.
- Include enough correlation IDs to trace crawl/source extraction -> technical readiness issue -> source-to-claim review -> candidate -> gate review.
- Keep provider/crawler progress states separate from final evidence states.
- Log not-inspected and needs-verification reasons when review output depends on missing code or runtime evidence.

## Review Questions

- Can an operator explain why a candidate exists?
- Can an operator explain why a candidate was held or suppressed?
- Can a failed run be retried or replayed safely?
- Are parser, generator, gate, and schema versions visible?
- Are cost and latency observable per provider, run, and tenant?
- Are crawl/extraction failures visible without leaking sensitive source payloads?
- Can an internal reviewer answer whether a finding came from AI answer measurement, technical readiness, manual review, crawl extraction, SERP evidence, or OSS research pattern?
- Are planned or unsupported providers visible as limitations rather than hidden defaults?
