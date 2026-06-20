# Persona Discovery Rubric

Use this rubric to decide whether a persona hypothesis is useful for Recora diagnosis.

Use `research-sufficiency-gate.md` to separate proto-persona from validated persona. Use `evidence-source-matrix.md` to organize site evidence. Use `evidence-to-persona-traceability.md` to connect each persona claim to source evidence or an explicit research gap. Use `persona-research-question-generator.md` to generate validation questions. Use `icp-anti-icp-fit.md` to classify diagnosis fit. Use `persona-confidence-upgrade-data.md` to state what data would raise confidence. Use `persona-trigger-events-and-vocabulary.md` to add JTBD, trigger events, vocabulary, and alternatives. Use `persona-switching-forces.md`, `ai-search-journey-by-persona.md`, and `persona-problem-narrative.md` to turn titles into diagnosis-ready struggling moments. Use `persona-quality-scoring.md` when choosing include, downgrade, or exclude. Use `japan-b2b-persona-patterns.md` for Japanese B2B, agency, SEO/GEO/AIO/LLMO, or unclear business-model cases.

## Required Inputs

Track these input fields explicitly:

- `brand_name`
- `url`
- `site_text` / `observed_claims`
- `pricing_signals`
- `target_adoption`
- `cta_signals`
- `case_studies_or_proof`
- `feature_signals`
- `service_model`
- `customer_data_status`

If an input is missing, mark it as missing instead of inferring it silently.

## Hypothesis Levels

Use exactly one primary level per persona:

- `confirmed_from_site`: Directly stated by the site or supplied page text.
- `inferred_from_site`: Reasonable from multiple observed signals, but not directly stated.
- `weak_hypothesis`: Thin support or category-level assumption.
- `needs_customer_data`: Requires CRM, analytics, sales notes, support logs, interviews, or real customer data.
- `not_supported`: No supplied or inspected evidence supports it.

Do not use `high` confidence for `weak_hypothesis`, `needs_customer_data`, or URL/name-only outputs.

## Business Model Role Minimums

For `B2B`, include separate rows for:

- `decision_maker`
- `economic_buyer`
- `end_user`
- `evaluator`
- `influencer`
- `agency_or_consultant`

If a role is not supported, state why in `Excluded / Unsupported Personas` or mark it as `not_supported`. Do not merge decision maker and end user.

For `B2C`, include separate rows for:

- `purchaser`
- `user`
- `comparator`
- `recommender_influencer`
- `repeat_user`

If purchaser and user are likely the same person, state `same_person_possible` but keep search intent separate when their questions differ.

For `marketplace`, split demand-side and supply-side personas.

For `agency_service`, split agency buyer, agency operator, client-side buyer, and client-side evaluator when site signals support those roles.

## Useful Persona Criteria

A useful persona can answer all of these:

- What decision or behavior are they influencing?
- What triggers their search?
- What problem, risk, or goal do they bring to AI search?
- What trigger event starts their AI search?
- What switching force makes the status quo unstable?
- What journey stage produces the best AI-search prompt?
- What problem narrative explains the struggling moment?
- What vocabulary would they likely use?
- What alternatives or categories might they compare?
- What comparison criteria matter to them?
- What objection or anxiety blocks adoption or purchase?
- What proof, page, asset, pricing signal, or case evidence would reduce uncertainty?
- What prompt angle should Recora test?
- Which traceability claim IDs support the persona and prompt angle?
- What ICP / Anti-ICP fit decision applies?
- What research questions should validate the assumptions?
- What data is needed to upgrade confidence?

If any answer is missing, mark `needs_verification` and lower priority.

## Diagnostic Priority

Assign `high`, `medium`, or `low`.

- `high`: Distinct role, strong buying/search influence, clear site support, and a unique prompt angle.
- `medium`: Useful search angle but weaker evidence, overlapping role, or unclear buying stage.
- `low`: Thin evidence, weak differentiation, or mainly useful as a verification gap.

Do not create more personas just to fill every possible audience. Prefer 3 to 7 high-signal candidates.

## Exclusion Rule

Exclude candidates from the main persona list when they cannot produce:

- A clear decision moment
- A plausible AI-search question
- A comparison target or axis
- A concern or objection
- Required information or proof
- A prompt angle
- A switching-force summary
- A journey stage
- A problem narrative
- Evidence-to-persona traceability
- ICP fit that is not `anti_icp` or `not_enough_evidence`
- Research questions for validation
- Data needed to upgrade confidence

Put them in `Excluded / Unsupported Personas` with the missing evidence or missing decision logic.

## Confidence Rules

Use `high`, `medium`, or `low`.

- `high`: Multiple explicit site signals plus provided customer/research data support the role and use case. Do not use for URL-only or public-site-only evidence.
- `medium`: Several signals support the role, but one of role, buying stage, or pain is inferred.
- `low`: URL/name-only, inaccessible site, thin evidence, no customer data, or category-level reasoning.

Confidence is not the same as priority. A high-priority persona can still be low-confidence if it is strategically important but needs customer validation.

Do not normal-handoff candidates with `anti_icp`, `not_enough_evidence`, unsupported traceability claims, or `research_sufficiency` of `not_enough_to_use`.
