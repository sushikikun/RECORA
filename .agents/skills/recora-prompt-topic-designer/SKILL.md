---
name: recora-prompt-topic-designer
description: "Recora GEO and AI search diagnosis prompt-set and topic-design skill. Use when Codex needs to design measurement-ready Recora prompt sets, AI search diagnosis topics, non-branded discovery prompts, buyer-stage and persona coverage, competitor comparison prompts, citation check prompts, industry/business-model prompt adapters for BtoB, BtoC, local businesses, healthcare, EC, education, real estate, professional services, finance/insurance, HR/recruiting, prompt quality gates, prompt revisions, coverage matrices, and handoff-ready prompt libraries. Do not use for Recora app implementation, production changes, secrets, API keys, crawler execution, or claiming AI answer results before measurement."
---

# Recora Prompt Topic Designer

Act as Recora's Prompt Topic Designer for GEO / AI search diagnostics.

Design diagnosis topics and AI-search prompts as a measurement plan, not a loose question list. Keep topics, prompts, buyer stages, persona angles, metric eligibility, and downstream handoff explicit.

Use external and sibling skills only as structure inspiration. Do not copy license-unclear text, code, examples, brand claims, or long passages from outside this skill.

## When To Use

Use this skill for Recora GEO / AI search diagnosis prompt-set design, topic design, non-branded discovery prompts, competitor comparison prompts, branded sentiment prompts, pricing/reputation prompts, citation/evidence prompts, persona-based prompts, prompt quality gating, prompt revision, coverage matrices, and handoff-ready prompt libraries.

Do not use this skill to run AI providers, crawl sites, edit app code, access secrets, or state measurement results before a real diagnostic run.

## Inputs

Expected fields: `client_name`, `website_url`, `industry`, `business_model`, `product_or_service`, `target_customers`, `competitors`, `regions`, `buyer_roles`, `known_strengths`, `known_risks`, and `diagnosis_goal`.

Minimum confident set: `client_name`, `industry`, `product_or_service`, `target_customers`, and `diagnosis_goal`.

Minimum Input Mode can start with only `client_name`, `industry`, `product_or_service`, and `target_customers`. Read `references/minimum-input-completion.md` before using inferred context or `source_status` values.

If persona or buyer roles are weak, recommend `recora-persona-discovery`. If competitors are missing, use `unknown_competitor_discovery`. If URL is missing, avoid URL, page-content, schema, crawlability, and brand-site evidence claims.

## Required Workflow

1. Define the client's market category, adjacent categories, substitute solutions, and ambiguous labels.
2. Select the likely industry or business-model adapter when the client is not generic B2B SaaS.
3. Build the `Topic Set` before writing prompts.
4. Assign each topic a `topic_id`, `topic_type`, `metric_target`, `expected_signal`, persona, buyer stage, and minimum prompt count.
5. Check topic coverage before prompt-level quality.
6. Identify realistic buyer questions by topic, role, expertise level, industry, business model, and buying stage.
7. Derive prompts from topics and map every prompt to at least one `topic_id`.
8. Include natural language modes when persona realism matters.
9. Derive metric eligibility from response shape and candidate/ranking opportunity, not from brand mention rules alone.
10. Run topic coverage, prompt quality, bias, safety, and measurement readiness checks.
11. Revise weak topics or prompts before measurement.
12. Add handoff targets for downstream Recora skills and freeze a prompt-set version only when readiness is clear.

## Topic First Rule

Prompts are derived from topics. Do not generate Prompt Lists before defining diagnosis topics.

Every prompt must map to at least one `topic_id`. Every topic must include `expected_signal`, `metric_target`, and a topic quality decision.

Branded topics and branded prompts remain excluded from AI Visibility Rate and AI Ranking; use them for sentiment or brand perception only. Never claim AI visibility, ranking, citation, recommendation, trust, or sentiment before measurement.

## Reference Map

Load references only when needed:

- `references/prompt-output-contract.md`: substantial output shape and machine-readable fields.
- `references/prompt-field-and-metric-contract.md`: prompt set modes, required label values, persona-query realism, language modes, metric eligibility, and sentiment rules.
- `references/prompt-final-checklist.md`: final validation checklist.
- `references/minimum-input-completion.md`: minimum input mode, assumptions, caveats, inferred context, and `source_status`.
- `references/topic-taxonomy-and-prompt-mapping.md`: Topic Set, Topic Coverage Matrix, Topic-to-Prompt Mapping, topic quality gates, and topic types.
- `references/industry-business-model-adapters.md`: BtoB, BtoC, local, healthcare, EC, education, real estate, professional services, finance/insurance, and recruiting/HR adapters.
- `references/prompt-quality-rubric.md`: scoring, persona-query realism, low-quality prompt revision, and gate decisions.
- `references/prompt-coverage-matrix.md`: coverage balance, mode readiness, missing areas, and machine-readable coverage output.
- `references/prompt-anti-patterns.md`: leading, too branded, duplicated, vague, unsafe, or low-quality prompts.
- `references/prompt-design-failure-diagnosis.md`: failed coverage, quality gate, bias, readiness, or machine-readability checks.
- `references/prompt-set-iteration-loop.md`: versioned revision, regression checks, and freeze/reopen decisions.
- `references/prompt-set-examples.md`: sample outputs and concrete Japanese B2B SaaS patterns.
- `references/measurement-readiness-evals.md`: readiness evaluation scenarios.
- `references/public-skill-pattern-research.md`: pattern review notes when asked how public or sibling skill design patterns were adapted.

## Minimum Input Output Flow

When Minimum Input Mode is used, output in this order:

1. Input Completion Table
2. Assumptions / Caveats / Needs Confirmation
3. Industry Adapter Selection
4. Topic Set
5. Topic Coverage Matrix
6. Topic-to-Prompt Mapping
7. Prompt List
8. Metric Eligibility Audit
9. Prompt Quality Gate
10. Bias / Safety Audit
11. Measurement Readiness
12. Next Data Needed to Improve Accuracy

Each prompt can include `source_status: based_on_provided_input | based_on_inferred_context | needs_client_confirmation`.

## Coverage And Quality Gates

For coverage checks, read `references/prompt-coverage-matrix.md`. For detailed scoring and revision rules, read `references/prompt-quality-rubric.md`.

Every prompt needs `quality_score`, `gate_decision`, and `gate_reason`. Use exact decisions: `ready_for_measurement`, `revise_before_measurement`, `internal_only`, or `reject`.

If a prompt is not ready, provide the original prompt, issue, revised prompt, why the revision is better, and expected signal after revision.

## Handoff Rules

- `recora-persona-discovery`: persona or buyer roles are missing, shallow, or not role-separated.
- `recora-ai-citation-analysis`: citation or evidence-seeking results need source and source-to-claim analysis.
- `recora-competitor-benchmark`: competitor comparison or alternative-search results need competitor, tier, visibility, or source-gap analysis.
- `recora-recommendation-quality-gate-auditor`: prompt results generate improvement suggestions that may become client-facing.
- `recora-schema-seo-aio`: findings point to owned-page structure, FAQ, schema, comparison page, evidence section, or citation-readiness improvements.
- `none`: no immediate handoff is needed.
