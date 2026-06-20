# RECORA Persistence Target Map

## CONFIRMED_FROM_FILES

- Current confirmed persistence covers raw measurement and some derived dashboard metrics.
- Current generator reads `measurement_runs`, `run_items`, `ai_conversations`, `brand_mentions`, `citations`, `source_domains`, and `recommendations`.
- Current generator writes candidate JSON/Markdown output and marks DB write status as `not_written`.
- Current `recommendations` table contains user-facing recommendation work item fields such as type, priority, impact score, effort score, title, reason, target URL, related topic, related prompt, status, and metadata.

## USER_PROVIDED_CONTEXT

- RECORA persistence should represent measurement runs, evidence, source-to-claim, candidates, quality-gate decisions, publication state, remeasurement, provider status, prompt taxonomy, seed risk, and versions.

## NEEDS_VERIFICATION

- There is no confirmed table for draft recommendation candidates.
- There is no confirmed table for gate reviews, source-to-claim reviews, rejected candidates, or remeasurement tasks.
- There is no confirmed persistence for schema/generator/parser/review version fields.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

| Target | Recommended persistence boundary | Why |
| --- | --- | --- |
| Raw observations | existing measurement/evidence tables | Preserve provider and parser inputs. |
| Source-to-claim reviews | new immutable review table | URL presence and claim support are separate facts. |
| Recommendation candidates | new draft candidate table | Drafts need stable identity and gate input state. |
| Quality-gate reviews | new review table | Gate decisions must not be overwritten by candidate display state. |
| Published recommendations | existing or new final table after gate | Publication state needs clear approval lineage. |
| Rejected candidates | persisted rejection rows | Suppressed or failed candidates are still audit evidence. |
| Provider executions | new per-attempt table or normalized run item extension | Retries and provider failures must not become evidence. |
| Prompt taxonomy and seed terms | versioned taxonomy/seed tables | Seed contamination checks need reproducible inputs. |
| Versions | explicit fields on generated/reviewed artifacts | Replay requires schema, generator, parser, and review version. |

## DO_NOT_ASSUME

- Do not collapse draft, review, and published states into a single status field without loss analysis.
- Do not use `recommendations.metadata` as the only audit trail for gate decisions.
- Do not treat absent persistence as intentional product scope.
