# RECORA Current Code Truth

Use this file to separate inspected truth from assumptions. It is not a live schema document.

## Confirmed From Inspected Files

- `.agents/skills/RECORA-SKILL-STACK.md` describes a stack with `georader-ai-search-auditor` for strategy/candidate drafts and `recora-recommendation-quality-gate-auditor` for `auto_publish`, `hold`, or `suppress`.
- `.agents/skills/RECORA-OSS-PATTERN-APPLICATION.md` says OSS research is pattern input only and does not inspect or modify app, backend, database, LP, CLI, production behavior, secrets, external repo source, runtime measurements, or live AI answer data.
- `.agents/skills/georader-ai-search-auditor/SKILL.md` was inspected at version v0.9. It may produce recommendation candidate drafts but must not implement RECORA or decide client publication.
- `.agents/skills/recora-recommendation-quality-gate-auditor/SKILL.md` was inspected at version v0.3.1. It decides `auto_publish`, `hold`, or `suppress` and is review-only.
- RECORA stack references in both installed skills define evidence labels, draft-to-gate handoff fields, source-to-claim checks, seed-risk checks, provider-status boundaries, and publication safety rules.
- `skill-patches/recora-open-source-reference-research-v0.1/` includes conceptual product/data-model implications and OSS patterns to borrow or avoid.
- `skill-patches/recora-open-source-patterns-apply-v0.1/` applies OSS research as patterns only, including evidence ledger, query taxonomy, seed risk, provider status, citation opportunity, README-as-proof avoidance, external automation risk, and citation-count/source-support separation.
- `tmp/recora-recommendation-candidates/generate-recommendation-candidates.ts` exists as a TypeScript recommendation candidate generator artifact.
- `tmp/recora-recommendation-candidates/recommendation-candidates.json` and `.md` exist as candidate exports.
- The temporary candidate payload inspected included measurement/evidence/citation fields, candidate arrays, `db_write_status: "not_written"`, and a count check where table counts before and after were unchanged.

## User-Provided Facts

- Known RECORA entities include `measurement_runs`, `run_items`, `ai_conversations`, `brand_mentions`, `citations`, `source_domains`, `recommendations`, and recommendation candidates.
- Candidate data has included measurement, evidence, and citation fields.
- Recommendation candidate JSON and Markdown exports have existed.
- Prior work verified no database count changes during a read-only generation run.

Treat these as project context, not exact current database schema proof.

## Architecture Assumptions

- RECORA should model raw evidence separately from derived recommendation data.
- Provider result normalization should preserve uncertainty and provider-specific raw metadata.
- Candidate generation and quality-gate publication decisions should remain separate persisted stages.

## Runtime-Unverified Items

- Exact current database schema and column definitions.
- Current application routes, backend services, migrations, jobs, queue implementation, and production behavior.
- Whether temporary generator artifacts match the active application code.
- Whether typecheck, tests, migrations, or local services currently pass.
- Whether Supabase, RLS, queues, cron, or provider integrations are active.

## Inaccessible Files

- None of the requested source paths were known to be inaccessible during package creation.
- If future code, migrations, schema files, or runtime services cannot be read, mark them `NEEDS_VERIFICATION`.

## NEEDS_VERIFICATION Items

- Exact live schema for all named entities.
- Any claim that candidate generator behavior is production behavior.
- Any migration plan before inspecting real migrations and schema.
- Any provider support status before inspecting implemented adapters and tests.
- Any source-to-claim support before inspecting citation records and validation logic.
