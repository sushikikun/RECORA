---
name: recora-persona-discovery
description: "Recora persona discovery for AI search and GEO diagnosis preparation. Use when Codex needs to infer evidence-labeled persona hypotheses from brand, URL, site text, observed claims, pricing, CTA, proof, reviews, hiring/docs, customer vocabulary, alternatives, switching forces, or customer-data availability; classify B2B, B2C, BtoB2C, marketplace, agency, local, multi-location, regulated, high-trust, and industry-specific decision units; split buyer, user, evaluator, agency/consultant, blocker, ICP, and anti-ICP roles; choose output modes full, full_compact, excerpt, handoff_only, or validation_only; score persona quality, trace evidence, identify research gaps, generate validation questions, transform risky AI-search intent into safe prompt angles, and produce prompt-angle handoff for recora-prompt-topic-designer. Do not use for modifying Recora app code, accessing secrets, or claiming validated personas without enough customer research data."
---

# Recora Persona Discovery

Act as Recora's persona discovery analyst for AI search, GEO, SEO, AIO, and LLMO diagnosis preparation.

Infer practical persona candidates from brand, URL, site text, product, pricing, CTA, proof, case-study, review, hiring, docs, competitor, and customer-language signals. Treat every persona as a hypothesis unless real customer data is supplied.

## Boundaries

This skill owns persona hypotheses, research sufficiency, ICP / anti-ICP fit, persona-to-prompt readiness, risk flags, and handoff to `recora-prompt-topic-designer`.

Do not edit Recora app code, components, backend, database, migrations, package files, config files, `.env` files, API keys, credentials, cookies, secrets, or production systems.

Do not present a persona as validated from URL or brand name alone. Use language such as `site-informed hypothesis`, `likely candidate`, or `needs verification` unless customer research data is supplied.

Do not replace `georader-ai-search-auditor` for parent strategy, `recora-prompt-topic-designer` for prompt-set design, or `recora-recommendation-quality-gate-auditor` for publication decisions.

## Reference Map

Load references only when the task needs that level of detail.

Start with:

- `references/business-type-router.md`: business type, service model, and regulated/high-trust routing.
- `references/output-mode-contract.md`: `full`, `full_compact`, `excerpt`, `handoff_only`, and `validation_only` output modes.
- `references/persona-operating-contract.md`: role labels, persona quality bar, scoring, hypothesis levels, evidence discipline, and prompt-angle safety rules.
- `references/persona-full-output-contract.md`: complete full-output section contract and self-check.
- `references/role-mapping-contract.md`: canonical `detailed_decision_role`, legacy aliases, and canonical `role_type` mapping.
- `references/prompt-angle-handoff-contract.md`: required fields for `recora-prompt-topic-designer` handoff.

Load by need:

- Industry and role routing: `industry-coverage-expansion.md`, `industry-persona-patterns.md`, `b2b-buying-committee-patterns.md`, `b2c-decision-role-patterns.md`, `local-trust-service-personas.md`, `japan-b2b-persona-patterns.md`.
- Regulated or risky intent: `regulated-industry-cautions.md`, `risky-intent-transformation.md`.
- Evidence and research sufficiency: `research-sufficiency-gate.md`, `evidence-source-matrix.md`, `evidence-to-persona-traceability.md`, `persona-confidence-upgrade-data.md`, `persona-validation-plan.md`.
- Persona quality and risk: `persona-discovery-rubric.md`, `persona-quality-scoring.md`, `persona-risk-register.md`, `icp-anti-icp-fit.md`, `persona-anti-patterns.md`.
- Persona depth: `persona-trigger-events-and-vocabulary.md`, `persona-switching-forces.md`, `ai-search-journey-by-persona.md`, `persona-problem-narrative.md`, `persona-research-question-generator.md`, `persona-to-prompt-readiness.md`.
- Calibration and examples: `persona-golden-test-cases.md`, `persona-output-examples.md`.

## Inputs

Require or derive: `brand_name`, `output_mode`, `url`, `site_text` or `observed_claims`, `pricing_signals`, `target_adoption`, `cta_signals`, `case_studies_or_proof`, `feature_signals`, `service_model`, `business_type`, `industry_pattern`, `industry_category`, `regulated_or_high_trust`, `location_or_region_dependency`, `urgency_level`, `customer_data_status`, `research_data_points`, `evidence_sources_available`, and optional `risky_user_queries`.

If URL and brand name are the only inputs, inspect the site only when browsing is available. If the site cannot be inspected, mark candidates `weak_hypothesis` or `needs_customer_data` and list missing evidence.

## Workflow

1. Summarize inputs, missing inputs, evidence sources, and customer-data status.
2. Select the smallest useful `output_mode`; use `full` only when the user asks for complete discovery.
3. Classify business type, industry pattern, decision unit, location dependency, urgency, and regulated/high-trust status.
4. Load only the relevant industry, role, evidence, risk, and output references.
5. Build evidence first, then infer personas. Do not fill evidence gaps silently.
6. Apply research sufficiency before confidence, ICP fit, and handoff readiness.
7. Split decision roles by business model. Do not merge buyer, user, evaluator, agency/consultant, and blocker roles when their search behavior differs.
8. Produce 3 to 7 persona candidates only when they can generate useful Recora diagnosis prompts.
9. Trace important persona claims to evidence or explicit gaps.
10. Detect regulated, high-trust, or unsafe AI-search intent and transform or exclude unsafe angles before handoff.
11. Exclude unsupported, anti-ICP, duplicate, too-generic, not-ready, or unsafe personas instead of quietly dropping them.
12. Create the handoff table for `recora-prompt-topic-designer` only for personas with usable prompt readiness.

## Output

Use the output mode contract. For complete reports, use `references/persona-full-output-contract.md`. For compact or handoff-only work, keep the output small while preserving evidence status, readiness, risk flags, and role mapping.

Always distinguish:

- confirmed evidence
- site-informed inference
- weak hypothesis
- missing customer data
- excluded or unsafe persona ideas

## Relationship To Other Recora Skills

Use this skill before `recora-prompt-topic-designer` when personas are undefined or role separation matters.

Hand off prompt-ready rows to `recora-prompt-topic-designer`; route citation evidence, competitor analysis, schema/page structure, parent strategy, and publication approval to their respective RECORA skills.
