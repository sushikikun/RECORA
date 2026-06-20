# Seed Risk And Prompt Taxonomy Persistence Design

## CONFIRMED_FROM_FILES

- `topics`, `personas`, and `prompts` exist.
- `prompts` includes topic, optional persona, text, intent, buyer stage, priority, active flag, and timestamps.
- Candidate JSON includes prompt IDs, prompt text, topics, personas, search modes, and seed/sample/example scoring notes.
- No `prompt_taxonomy`, `seed_terms`, or `seed_contamination_risk` table was found.

## USER_PROVIDED_CONTEXT

- RECORA persistence should represent prompt taxonomy, seed terms, seed contamination risk, and version fields.

## NEEDS_VERIFICATION

- The source and version of prompt taxonomy are not persisted in a dedicated table in inspected migrations.
- Seed terms and contamination checks are not persisted as first-class DB evidence.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Treat `topics`, `personas`, and `prompts` as current taxonomy primitives.
- Add taxonomy versioning or a prompt-set snapshot when candidate generation depends on prompt grouping.
- Persist seed terms, seed source, allowed echo rules, and contamination review result when they influence candidate quality.
- Link seed risk reviews to candidate IDs and prompt IDs.

## DO_NOT_ASSUME

- Do not infer seed safety from a scoring note alone.
- Do not treat prompt text as immutable taxonomy without versioning.
- Do not allow prompt echo or seed echo to become brand mention evidence without parser safeguards.
