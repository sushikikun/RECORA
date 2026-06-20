# Persona Discovery Rubric

Use this rubric to decide whether a persona hypothesis is useful for Recora diagnosis.

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
- What alternatives or categories might they compare?
- What comparison criteria matter to them?
- What objection or anxiety blocks adoption or purchase?
- What proof, page, asset, pricing signal, or case evidence would reduce uncertainty?
- What prompt angle should Recora test?

If any answer is missing, mark `needs_verification` and lower priority.

## Diagnostic Priority

Assign `high`, `medium`, or `low`.

- `high`: Distinct role, strong buying/search influence, clear site support, and a unique prompt angle.
- `medium`: Useful search angle but weaker evidence, overlapping role, or unclear buying stage.
- `low`: Thin evidence, weak differentiation, or mainly useful as a verification gap.

Do not create more personas just to fill every possible audience. Prefer 3 to 7 high-signal candidates.

## Confidence Rules

Use `high`, `medium`, or `low`.

- `high`: Multiple explicit site signals support the role and use case.
- `medium`: Several signals support the role, but one of role, buying stage, or pain is inferred.
- `low`: URL/name-only, inaccessible site, thin evidence, no customer data, or category-level reasoning.

Confidence is not the same as priority. A high-priority persona can still be low-confidence if it is strategically important but needs customer validation.
