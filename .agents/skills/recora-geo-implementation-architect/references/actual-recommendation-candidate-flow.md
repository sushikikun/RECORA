# Actual Recommendation Candidate Flow

## CONFIRMED_FROM_FILES

- The generator requires either `--measurement-run-id` or `--latest-profile`.
- The generator refuses to aggregate every run when neither is supplied.
- The generator enforces `standard-v01` for `latestProfile` and selected measurement metadata.
- The generator loads:
  - project
  - measurement run
  - aggregate run
  - brands
  - run items
  - conversations
  - brand mentions
  - citations
  - before and after table counts
- The generator filters OpenAI observations by `conversation.provider === "openai"` or presence of `response_id`.
- Candidate construction observed:
  - absent target brand observations become a `brand_visibility_gap` candidate.
  - web-search citations with unknown `supports_claim` become a `citation_evidence_review` candidate.
  - matched case-study clue patterns can become a `case_study_evidence_gap` candidate.
- Candidate ID is built as:
  - `rec-${measurementRunId.slice(0, 8)}-${type.replace(/_/g, "-")}`
- Every inspected candidate has:
  - `should_save_to_recommendations: "review_required"`
  - `display_decision: "show"`
  - `evidence.db_write_status: "not_written"`
- The payload has top-level `db_write_status: "not_written"` and table count comparison.

## USER_PROVIDED_CONTEXT

- The implementation architect should become better at reviewing the actual candidate generator and producing file-impact maps without editing files.

## NEEDS_VERIFICATION

- DB schema not inspected. Exact columns remain NEEDS_VERIFICATION.
- Whether `display_decision: "show"` is used in production UI remains NEEDS_VERIFICATION.
- Whether `should_save_to_recommendations` is consumed by a later persistence step remains NEEDS_VERIFICATION.
- Whether the candidate ID strategy is collision-safe across generator versions, project boundaries, and reruns remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Split current flow into explicit stages:
  - raw measurement load
  - normalized observation evidence
  - candidate draft generation
  - draft-time rejection generation
  - quality-gate review
  - publication or internal hold/rejection
- Rename or alias fields into the stack contract without breaking current exports:
  - `id` -> `candidate_id`
  - `type` -> `candidate_type`
  - `evidence.primary_evidence_scope` -> `evidence_scope`
  - `evidence.conversation_ids` -> `ai_conversation_ids`
  - `evidence.selected_prompt_ids` -> `prompt_ids`
- Add `created_from` pointing to generator name/version and source run context.
- Add `schema_version` and `generator_version` before persistent use.

## DO_NOT_ASSUME

- Do not treat `display_decision: "show"` as `auto_publish`.
- Do not treat `quality_score` as quality-gate score unless quality-gate code confirms it.
- Do not treat `not_written` as proof of safety outside the inspected generation run.
