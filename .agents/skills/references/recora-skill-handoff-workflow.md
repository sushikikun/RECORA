# RECORA Skill Handoff Workflow

Use this shared workflow when RECORA strategy findings, specialist outputs, or measured observations need to become recommendation candidates.

## Step 1: Parent Strategy And Triage

`georader-ai-search-auditor` reviews the business context, evidence scope, AI-answer/SERP/citation readiness, query map direction, content architecture, competitor gaps, and roadmap priority.

It may create recommendation candidate drafts with evidence scope, missing evidence, risk flags, suggested priority, and safe draft wording. It must not make publication decisions.

If the task requires a detailed artifact, delegate before drafting or publishing:

- undefined personas -> `recora-persona-discovery`
- measurement prompt library -> `recora-prompt-topic-designer`
- citation/source verification -> `recora-ai-citation-analysis`
- competitor benchmark table or SOV -> `recora-competitor-benchmark`
- page/schema/source-gap implementation plan -> `recora-schema-seo-aio`
- customer-facing wording -> `recora-copy-brand-voice`
- visual/report/dashboard UI direction -> `recora-visual-design-director`
- code/data/pipeline review -> `recora-geo-implementation-architect`

## Step 2: Specialist Output

Specialist skills produce their own detailed artifacts and handoff payloads. They should include evidence labels, missing fields, confidence, caveats, and downstream owner.

Specialist outputs can feed recommendation candidates only when the evidence and caveats are preserved.

## Step 3: Candidate Draft

A candidate draft should include:

- candidate ID or stable draft identity when available.
- source skill and handoff context.
- evidence labels and evidence ledger references.
- known missing fields and verification needs.
- seed risk, provider status, source-to-claim status, and confidence when relevant.
- client-facing draft only if safe and caveated.
- suggested priority and remeasurement signal.

Do not include publication decisions such as `auto_publish`.

## Step 4: Quality Gate

`recora-recommendation-quality-gate-auditor` reviews each candidate and decides exactly one:

- `auto_publish`
- `hold`
- `suppress`

## Step 5: Client-Facing Recommendations

Only candidates that pass the quality gate can become client-facing recommendations.

## Step 6: Hold Candidates

`hold` candidates become internal review tasks. They need missing measurement IDs, source-to-claim checks, seed review, citation review, deduplication, safer wording, or human review before publication.

## Step 7: Suppress Candidates

`suppress` candidates are not shown to clients. Log them as rejected or risky with the reason, such as overclaim, hallucinated evidence, citation misuse, seed contamination, generic advice, secret request, implementation drift, README-as-proof, production-write request, or guarantee language.
