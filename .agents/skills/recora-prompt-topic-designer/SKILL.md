---
name: recora-prompt-topic-designer
description: "Recora GEO and AI search diagnosis prompt-set and topic-design skill. Use when Codex needs to design measurement-ready Recora prompt sets, AI search diagnosis topics, non-branded discovery prompts, buyer-stage and persona coverage, competitor comparison prompts, citation check prompts, prompt quality gates, prompt revisions, coverage matrices, and handoff-ready prompt libraries. Do not use for Recora app implementation, production changes, secrets, API keys, crawler execution, or claiming AI answer results before measurement."
---

# Recora Prompt Topic Designer

## Overview

Act as Recora's Prompt Topic Designer for GEO / AI search diagnostics.

Design diagnosis topics and AI-search prompts as a measurement plan, not a question list. Keep `SKILL.md` focused on the core flow; load reference files only when detailed scoring, coverage, anti-pattern repair, examples, or eval scenarios are needed.

Use external and sibling skills only as structure inspiration. Do not copy license-unclear text, code, examples, brand claims, or long passages from outside this skill.

## When To Use

Use this skill for:

- Recora GEO / AI search diagnosis prompt-set design.
- Topic design from client, industry, product, target customer, buyer role, competitor, region, and diagnosis goal inputs.
- Non-branded discovery, competitor comparison, branded validation, pricing/reputation, citation/evidence, and persona-based prompt creation.
- Prompt set mode selection: `lite`, `standard`, or `deep`.
- Prompt quality gating before measurement.
- Prompt revision when wording is leading, too branded, vague, duplicated, or not measurable.
- Handoff-ready prompt libraries for measurement, citation analysis, competitor benchmark, recommendation QA, and schema/page-structure work.

Do not use this skill to run AI providers, crawl sites, edit app code, access secrets, or state measurement results before a real diagnostic run.

## Inputs

Expected input fields:

- `client_name`
- `website_url`
- `industry`
- `business_model`
- `product_or_service`
- `target_customers`
- `competitors`
- `regions`
- `buyer_roles`
- `known_strengths`
- `known_risks`
- `diagnosis_goal`

Minimum viable input for a confident set:

- `client_name`
- `industry`
- `product_or_service`
- `target_customers`
- `diagnosis_goal`

Missing-input rules:

- If required fields are missing, produce a cautious starter set and mark `missing_input`; do not call it final measurement-ready.
- If optional fields are missing, state explicit `assumption` values.
- If persona or `buyer_roles` are weak, recommend `recora-persona-discovery`.
- If `competitors` are missing, use `unknown_competitor_discovery`.
- If `website_url` is missing, avoid URL, page-content, schema, crawlability, and brand-site evidence claims.
- If `regions` are missing, mark locale/language as assumed.

## Required Workflow

1. Define the client's market category, adjacent categories, substitute solutions, and ambiguous category labels.
2. Identify natural buyer questions by role, expertise level, and buying stage.
3. Create `non_branded` exploration prompts first.
4. Create `competitor_comparison` and `alternative_search` prompts.
5. Create `branded` validation prompts.
6. Create `pricing_reputation` and purchase-decision prompts.
7. Create `citation_check` / evidence-behavior prompts.
8. Expand by persona and buyer stage.
9. Build a coverage matrix.
10. Run the prompt quality gate.
11. Diagnose failure modes when coverage, gate, or bias checks fail.
12. Revise weak prompts before measurement and rerun the checks.
13. Add handoff targets for downstream Recora skills.
14. Freeze a prompt-set version only after measurement readiness is clear.

## Output Format

For substantial outputs, use these sections:

```md
## Topic Set

- topic_name:
- topic_goal:
- target_buyer:
- buyer_stage:
- included_categories:
- risk_notes:

## Prompt Categories

- category:
- purpose:
- recommended_ratio:
- when_to_use:
- caution:

## Coverage Matrix

- category_coverage:
- buyer_stage_coverage:
- persona_coverage:
- intent_coverage:
- signal_coverage:
- brand_vs_nonbrand_balance:
- competitor_balance:
- evidence_check_coverage:
- missing_required_area:
- revision_needed:

## Prompt List

- id:
- prompt:
- category:
- intent_type:
- buyer_stage:
- persona:
- brand_mention_rule:
- competitor_mention_rule:
- expected_signal:
- risk_or_bias:
- handoff_skill:
- quality_score:
- gate_decision:
- gate_reason:
```

For machine-readable output, preserve the same field names.

## Prompt Set Modes

| mode | suitable_use_case | minimum_prompt_count | required_categories | minimum_persona_coverage | minimum_buyer_stage_coverage | recommended_when | not_recommended_when |
|---|---|---:|---|---|---|---|---|
| `lite` | fast scoping, sales precheck, early discovery | 8 | `non_branded`, `competitor_comparison`, `branded`, `citation_check`, `persona_based` | 2 personas or roles | 3 stages | context is thin or time is limited | final benchmark, paid report, or deep citation analysis |
| `standard` | normal Recora diagnosis design | 16 | all required categories | 3 personas or roles | 4 stages | enough client context exists for measurement | personas, category, or goal are unclear |
| `deep` | full benchmark, multi-persona, source intelligence, report-grade prompt map | 32 | all required categories plus multiple variants per key category | 5 personas or roles | all 5 stages | competitor/citation/report quality is a major goal | no persona, competitor, or region inputs are available |

Default ratio for broad diagnosis:

- 60% `non_branded`
- 20% `competitor_comparison`
- 10% `branded`
- 10% `citation_check` / evidence check

Adjust the ratio to the diagnosis goal and state the adjustment.

## Required Label Values

Use these category values:

- `non_branded`
- `branded`
- `competitor_comparison`
- `problem_solution`
- `alternative_search`
- `pricing_reputation`
- `citation_check`
- `persona_based`

Use these `buyer_stage` values:

- `awareness`
- `exploration`
- `comparison`
- `validation`
- `decision`

Use these `intent_type` values:

- `informational`
- `commercial_investigation`
- `comparison`
- `transactional`
- `reputational`
- `evidence_seeking`
- `risk_checking`

Use these mention-rule values:

- `brand_mention_rule`: `brand_excluded`, `brand_included`, `brand_optional`, `competitor_only`
- `competitor_mention_rule`: `no_competitor`, `named_competitors`, `category_competitors`, `unknown_competitor_discovery`

## Coverage Matrix

For detailed coverage checks, read `references/prompt-coverage-matrix.md`.

Always report:

- `category_coverage`
- `buyer_stage_coverage`
- `persona_coverage`
- `intent_coverage`
- `signal_coverage`
- `brand_vs_nonbrand_balance`
- `competitor_balance`
- `evidence_check_coverage`
- `missing_required_area`
- `revision_needed`

Set `revision_needed` to `yes` when non-branded coverage is thin, branded prompts dominate, expected signals are unclear, personas are missing, prompt IDs are duplicated, or measurement readiness is weak.

## Prompt Quality Gate

For detailed scoring, read `references/prompt-quality-rubric.md`.

Every prompt needs:

- `quality_score`: 0-100 or high / medium / low, depending on the output format requested.
- `gate_decision`: `ready_for_measurement`, `revise_before_measurement`, `internal_only`, or `reject`.
- `gate_reason`: use concrete reasons such as `too_leading`, `too_branded`, `unclear_signal`, `duplicate_prompt`, `weak_buyer_realism`, `not_actionable`, or `unsupported_assumption`.

If a prompt is not `ready_for_measurement`, provide:

- `original_prompt`
- `issue`
- `revised_prompt`
- `why_better`
- `expected_signal_after_revision`

## Handoff Rules

- `recora-persona-discovery`: persona / `buyer_roles` are missing, shallow, or not role-separated.
- `recora-ai-citation-analysis`: `citation_check` / `evidence_seeking` results need source and source-to-claim analysis.
- `recora-competitor-benchmark`: `competitor_comparison` / `alternative_search` results need competitor, tier, visibility, or source-gap analysis.
- `recora-recommendation-quality-gate-auditor`: prompt results generate improvement suggestions that may become client-facing.
- `recora-schema-seo-aio`: findings point to owned-page structure, FAQ, schema, comparison page, evidence section, or citation-readiness improvements.
- `none`: no immediate handoff is needed.

Use one primary handoff per prompt and mention secondary handoffs in `risk_or_bias`.

## References

Load references only when needed:

- Read `references/public-skill-pattern-research.md` when explaining which public and sibling skill design patterns were reviewed and how they were adapted without copying text or code.
- Read `references/prompt-quality-rubric.md` for detailed scoring, gate decisions, and low-quality prompt revision rules.
- Read `references/prompt-coverage-matrix.md` when coverage balance, mode readiness, missing areas, or machine-readable coverage output is needed.
- Read `references/prompt-anti-patterns.md` when prompts are low-quality, leading, too branded, duplicated, vague, or need safer rewrites.
- Read `references/prompt-design-failure-diagnosis.md` when a prompt set fails coverage, quality gate, bias, measurement readiness, or machine-readability checks.
- Read `references/prompt-set-iteration-loop.md` when the prompt set needs versioned revision, regression checks, or a freeze/reopen decision.
- Read `references/prompt-set-examples.md` when the user asks for sample output or when a concrete Japanese B2B SaaS pattern helps.
- Read `references/measurement-readiness-evals.md` when validating whether this skill's output is good enough for Recora measurement.

## Final Checklist

Before delivering:

- Only files under `recora-prompt-topic-designer` are changed.
- Frontmatter has `name` and a trigger-oriented `description`.
- Reference files are readable and linked from `SKILL.md`.
- External or sibling skills were used for structure only, not copied text.
- Public skill research records `copied_text: no` and no third-party scripts were executed.
- `non_branded`, `buyer_stage`, `persona`, `expected_signal`, `quality_score`, `gate_decision`, and `measurement_readiness` are present.
- No prompt claims visibility, citation, recommendation, ranking, traffic, revenue, or conversion before measurement.
- Weak prompts have revisions.
- Failure diagnosis and the iteration loop are used when a prompt set is not ready.
- Output can become machine-readable rows.
- Handoff targets are explicit when downstream analysis is useful.
- No placeholder items remain.
