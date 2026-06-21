# Source Intelligence Report Contract

Use this reference when producing Recora Source Intelligence / Citation Audit outputs.

## Required Output Sections

Always keep these eight sections for substantial outputs:

1. Citation Summary
2. Source Classification Table
3. Own / Competitor / Third-party Gap
4. Citation Risk
5. Source Opportunity
6. Recommended Page / Content Actions
7. Confidence Level
8. Unverified Items

Optional supporting sections:

- Input Completeness
- Observation Context
- Evidence Ledger
- Citation Inventory
- Claim Inventory
- Passage-level Evidence Notes
- Machine-readable Output
- Quality Gate Notes
- Output Quality Score
- Major Deductions
- Client Report Readiness
- Internal Review Notes
- Required Follow-up Evidence
- Report Readiness
- Adversarial Test Notes
- Handoff Notes

## Section Contract Fields

For each major section, be explicit about:

- `required_inputs`: the inputs required for strong conclusions.
- `required_evidence`: source text, observation count, passage evidence, domain mapping, or dates needed.
- `allowed_claim_strength`: confirmed, likely, hypothesis, advisory, unverified, contradicted, or blocked.
- `disallowed_claims`: guarantees, unsupported competitor superiority, URL-only confirmation, or SEO-only causality.
- `client_safe_wording`: cautious language suitable for Recora client reports.
- `handoff_payload`: downstream data needed by another Recora skill.

## 1. Citation Summary

Include:

- Scope: client, prompt/topic/persona, engine/model/interface, language/region, date range, source set.
- Input completeness: what is present and missing.
- Source mix: source types and source ownership mix.
- Own-site presence: present, absent, weak, unknown.
- Competitor presence: cited competitors and source types supporting them.
- Third-party influence: media, comparison, review, directory, official, academic, social.
- Main claim-to-source finding: supported, partial, adjacent, contradicted, unverifiable.
- Highest risks.
- Highest source opportunities.
- Finding status and report readiness decision.

## 2. Source Classification Table

Use this table:

| URL | source_type | source_owner | cited_entity | page_purpose | source_text_status | accessibility | freshness | authority_signal | quality_signal | alignment_status | correctness_status | faithfulness_status | evidence_strength | finding_status | control_level | risk_id | risk_score | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---|

Use `not_checked`, `unknown`, `low_confidence`, or `unverifiable` rather than forcing certainty.

## 3. Own / Competitor / Third-party Gap

Include:

- Own-site non-citation diagnosis.
- Competitor citation advantage.
- Third-party media/comparison/review/directory influence.
- Citation footprint by source type.
- Observation count threshold: anecdotal, weak pattern, emerging pattern, stronger pattern.
- Cross-engine differences when available.
- Evidence basis and unverified hypotheses.

## 4. Citation Risk

Use this table:

| risk_id | URL/claim | Severity | Risk score | Correctness | Faithfulness | Finding status | Why it matters | Evidence basis | Verification needed |
|---|---|---|---:|---|---|---|---|---|---|

Lead with direct contradictions, hallucinated/missing sources, brand misrepresentation, major stale sources, and misleading comparisons.

## 5. Source Opportunity

Use this table:

| opportunity_id | Opportunity | Source gap addressed | Control level | Target source/page | Evidence basis | expected_effect_hypothesis | verification_method | finding_status |
|---|---|---|---|---|---|---|---|---|

Keep expected effect cautious and testable.

## 6. Recommended Page / Content Actions

Every action must include:

- `action_id`
- `action_type`
- `target_url_or_page_idea`
- `reason`
- `linked_gap`
- `linked_claim_ids`
- `linked_citation_ids`
- `expected_effect_hypothesis`
- `evidence_needed`
- `control_level`
- `priority`
- `confidence`
- `verification_method`
- `acceptance_criteria`
- `report_readiness`
- `handoff_target`

Recommended table:

| action_id | action_type | target_url_or_page_idea | reason | linked_gap | linked_claim_ids | linked_citation_ids | expected_effect_hypothesis | evidence_needed | control_level | priority | confidence | verification_method | acceptance_criteria | report_readiness | handoff_target |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Allowed action types:

- `own_site_fix`
- `own_site_new_page`
- `third_party_outreach`
- `evidence_building`
- `technical_support`
- `monitoring`

Acceptance criteria examples:

- Missing comparison axis is added to the target page and visible in page text.
- Pricing, feature, case study, FAQ, or evidence section is verifiable in page body.
- Outdated third-party profile information is corrected or outreach has been logged.
- Mismatch between AI answer and cited source is resolved, caveated, or suppressed.
- Same-condition prompt can be re-observed in a future monitoring run.

## 7. Confidence Level

Include:

- Overall confidence.
- High-confidence findings.
- Medium-confidence hypotheses.
- Low-confidence or unverified areas.
- Contradicted items.
- Observation count threshold.
- Cross-engine comparability caveat.
- What would raise confidence.

## 8. Unverified Items

Include:

- Missing source text.
- Missing update dates/authors.
- Missing own/competitor mapping.
- Missing measurement data.
- Crawlability or technical assumptions.
- Third-party claims needing verification.
- Conflicting evidence needing resolution.
- Source accessibility blockers.
- Engine/model/interface differences not yet normalized.

## Input Completeness

Report:

| Input | Status | Impact | Needed next |
|---|---|---|---|

Important inputs: AI answer text, cited URLs, source text, own domains, competitor domains, engine/model/interface, observation date, prompt/persona, citation frequency, language/region, logged-in state, personalization possibility.

## Observation Context

Use fields from `cross-engine-observation-protocol.md` when comparing observations across systems.

| run_id | engine | model_name | interface | prompt_text | topic | persona | language | region | observed_at | citation_ui_type | logged_in_state | personalization_possible |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Citation Inventory

Use this table for human-readable reports, and `machine-readable-output-schema.md` for structured output:

| citation_id | url | normalized_domain | final_url | source_accessibility | source_class | source_owner | cited_entity | page_type | page_purpose | source_text_status | freshness_status | quality_signal | authority_signal | bias_flags | volatility_flags | risk_flags | confidence | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Evidence Ledger

Use this table:

| item_id | claim_or_finding | evidence_type | source_url | source_class | source_text_status | alignment_status | correctness_status | faithfulness_status | evidence_strength | finding_status | confidence | risk_level | verification_needed | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Claim Inventory

Use this table:

| claim_id | atomic_claim | claim_type | claim_severity | related_citation_ids | correctness_status | faithfulness_status | alignment_status | triangulation_status | contradictory_evidence_status | evidence_strength | finding_status | confidence | verification_note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Passage-level Evidence Notes

Use this table:

| claim_id | cited_url | supporting_passage_summary | passage_location_hint | alignment_status | correctness_status | faithfulness_status | evidence_strength | confidence | verification_note |
|---|---|---|---|---|---|---|---|---|---|

Do not quote long copyrighted text. Summarize the supporting passage.

## Machine-readable Output

Use `references/machine-readable-output-schema.md` when output needs to feed product logic, report generation, QA, monitoring, or downstream skills. The structured contract must not replace the eight human-readable sections unless the user explicitly asks for structured-only output.

## Quality Gate Notes

Include:

- High/critical risks.
- Low-confidence findings downgraded to advisory.
- Recommendations suppressed or held.
- Technical support caveats.
- Contradictory evidence.
- Client-safe wording adjustments.
- Report readiness decision.

## Output Quality Score

When the output is being reviewed, scored, or prepared for client reporting, include:

- `output_quality_score`
- `quality_rank`
- `major_deductions`
- `unsafe_for_client_report`
- `client_report_readiness`

Use `output-quality-rubric.md` for scoring. Keep this section separate from business findings so QA notes do not look like client-facing conclusions.

## Major Deductions

List any deductions that materially changed readiness, especially:

- URL-only source marked too strongly.
- Unchecked source text used as evidence.
- AI citation increase or schema/robots/`llms.txt` guarantee.
- Cross-engine observations mixed without caveat.
- Affiliate, stale, broken, paywalled, login-required, contradictory, or synthetic source risk missed.

## Client Report Readiness

State one of:

- `production_ready`
- `report_draft_ready`
- `internal_review_only`
- `needs_major_revision`
- `unsafe_or_unusable`

This quality readiness is separate from source-level `report_readiness`; both may be shown when useful.

## Internal Review Notes

Use this section for reviewer-only concerns, suppressed recommendations, questionable evidence, or wording that needs safer framing before publication.

## Required Follow-up Evidence

List evidence required before raising confidence or report readiness, such as checked source text, current pricing, third-party methodology, same-condition repeat observations, or verified entity/domain mapping.

## Report Readiness

Use one decision:

- `ready_for_client_report`
- `internal_only`
- `needs_more_evidence`
- `blocked_by_missing_source_text`
- `blocked_by_conflicting_evidence`

Include a short reason and the next verification step.

## Adversarial Test Notes

Use `adversarial-test-cases.md` when checking whether the output overtrusted weak citations. Include:

- Tested adversarial cases.
- Passed cases.
- Failed cases.
- Major deductions.
- Required fixes.
- Whether the output is safe for client reporting.

## Handoff Payload Contract

A handoff should be structured enough that another Recora skill can act without reinterpreting the report.

| target_skill | payload | reason | readiness |
|---|---|---|---|
| `recora-competitor-benchmark` | source gaps, competitor citation advantage, citation footprint, observed engines, claim ids, confidence | Compare competitor advantage and counter-moves. | Use when source patterns are at least hypothesis-level. |
| `recora-schema-seo-aio` | own_site_fix, own_site_new_page, technical_support, evidence gaps, target pages, acceptance criteria | Improve owned pages and technical support without promising AI citations. | Use when action is controllable by own site. |
| `recora-recommendation-quality-gate-auditor` | recommended actions, finding_status, risk_ids, evidence ledger, client-safe wording, report readiness | Audit recommendation quality before publication. | Use for all client-facing recommendations. |

## Handoff Notes

For each handoff, specify the target Recora skill, payload, and why.

| target_skill | payload | reason | readiness |
|---|---|---|---|
