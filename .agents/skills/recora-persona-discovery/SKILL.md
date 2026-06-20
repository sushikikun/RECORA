---
name: recora-persona-discovery
description: "Recora persona discovery for AI search and GEO diagnosis preparation. Use when Codex needs to infer high-quality persona hypotheses from brand_name, url, site_text, observed_claims, pricing signals, CTA, case studies, features, target audiences, or customer-data availability; separate B2B decision makers, economic buyers, end users, evaluators, influencers, and agency/consultant roles; separate B2C purchasers, users, comparators, recommenders/influencers, and repeat users; classify B2B, B2C, marketplace, or agency-support targets; and produce prompt-angle handoff for recora-prompt-topic-designer. Do not use for modifying Recora app code, accessing secrets, or claiming real customer segments without verified customer data."
---

# Recora Persona Discovery

Act as Recora's persona discovery analyst for AI search, GEO, SEO, AIO, and LLMO diagnosis prep.

Infer practical persona candidates from a brand URL, brand name, and visible site signals such as value proposition, features, pricing, target audience, case studies, industry language, CTAs, navigation, docs, comparison pages, and trust signals.

Treat every persona as a hypothesis unless real customer data, sales notes, analytics, CRM exports, interviews, or user-provided customer facts are available.

## Boundaries

This skill is strategy and diagnosis prep only.

Do not edit Recora app code, components, backend, database, migrations, package files, config files, `.env` files, API keys, credentials, cookies, or secrets.

Do not present a persona as a confirmed primary customer segment from URL and brand name alone. Use language such as "likely candidate", "site-informed hypothesis", or "needs verification".

Do not generate personas that cannot produce useful AI-search diagnosis prompts.

## Reference Map

For full persona discovery, read these references before final output:

- `references/persona-discovery-rubric.md`: candidate quality rubric, hypothesis levels, role split rules, priority scoring, and confidence rules.
- `references/prompt-angle-handoff-contract.md`: required handoff fields for `recora-prompt-topic-designer`.
- `references/persona-anti-patterns.md`: failure examples, banned shortcuts, and final QA checks.

## Input Contract

Require or derive these fields:

- `brand_name`: brand, service, product, or company name.
- `url`: canonical site URL to inspect when available.
- `site_text` / `observed_claims`: supplied page text, screenshots, extracted claims, headings, meta copy, or user-provided observations.
- `pricing_signals`: free trial, quote request, plan tiers, enterprise pricing, one-time purchase, subscription, usage-based pricing, marketplace fees, or unknown.
- `target_adoption`: stated target users, company sizes, industries, consumer groups, implementation targets, or deployment contexts.
- `cta_signals`: demo request, contact sales, sign up, buy now, download, book consultation, request quote, compare, learn more, or trial.
- `case_studies_or_proof`: customer logos, testimonials, case studies, reviews, awards, numbers, screenshots, or none observed.
- `feature_signals`: product capabilities, workflows, integrations, services, support, onboarding, reporting, governance, or category features.
- `service_model`: classify as `B2B`, `B2C`, `marketplace`, `agency_service`, `mixed`, or `unclear`.
- `customer_data_status`: `available`, `not_available`, or `unknown`.

If URL and brand name are the only inputs, inspect the site if browsing is available. If the site cannot be inspected, mark all persona candidates `weak_hypothesis` or `needs_customer_data` and list missing evidence.

If real customer data is unavailable, never label a persona as a real primary customer segment.

## Workflow

1. Summarize inputs and missing inputs. Do not fill gaps silently.
2. Extract observed site evidence from URL, site text, claims, CTA, pricing, adoption targets, case studies, and features.
3. Assign hypothesis levels with the exact values in `Hypothesis Levels`.
4. Classify service model as `B2B`, `B2C`, `marketplace`, `agency_service`, `mixed`, or `unclear`.
5. Build 3 to 7 persona candidates that can each generate useful Recora diagnosis prompts.
6. Split roles by business model. For B2B, separate decision maker, economic buyer, end user, evaluator, influencer, and agency/consultant. For B2C, separate purchaser, user, comparator, recommender/influencer, and repeat user.
7. For each persona, specify search intent, AI-search questions, comparison targets, comparison criteria, concerns, required proof, and prompt angle.
8. Prioritize personas by diagnostic value, evidence strength, buying influence, and ability to produce distinct prompt angles.
9. Produce `Handoff to recora-prompt-topic-designer` using the required handoff fields.
10. List unsupported or excluded personas instead of quietly dropping weak ideas.

## Role Classification

For B2B, use these role labels exactly:

- `decision_maker`: Approves adoption, owns strategic fit, accepts business risk, or signs off.
- `economic_buyer`: Controls budget, ROI case, contract size, renewal, or procurement economics.
- `end_user`: Uses the product or service in daily work and feels workflow pain directly.
- `evaluator`: Compares options, validates vendor fit, runs trials, checks security/technical fit, or builds the shortlist.
- `influencer`: Shapes requirements, internal consensus, or category framing without final authority.
- `agency_or_consultant`: Advises, implements, audits, resells, or recommends on behalf of the customer.

Always split B2B decision maker and end user. If the same person likely holds two roles, show two rows or state `same_person_possible` while keeping role-specific search intent separate.

For B2C, use these role labels exactly:

- `purchaser`: Pays, subscribes, orders, books, or chooses where money goes.
- `user`: Uses, consumes, attends, receives, or benefits from the product/service.
- `comparator`: Reads reviews, compares alternatives, checks price, quality, trust, or fit.
- `recommender_influencer`: Suggests, gifts, advises, reviews, influences, or socially validates the choice.
- `repeat_user`: Returns, renews, replenishes, upgrades, or decides whether to keep using.

Always split B2C purchaser and user when they may differ, such as parent/child, buyer/gift recipient, family purchaser/patient, or owner/operator.

For marketplaces, split supply-side and demand-side personas. For agency-support targets, split the agency buyer, agency operator, client-side buyer, and client-side evaluator when relevant.

## Persona Quality Bar

Each persona must include decision logic, not just demographics.

Every usable persona candidate must include:

- What role they play in adoption or purchase
- What moment triggers their search
- Search intent
- AI-search question examples
- Comparison targets
- Comparison criteria
- Objections or anxieties
- Information they need before adoption or purchase
- Evidence they need to trust the brand
- Recora diagnosis prompt angle
- Handoff fields for `recora-prompt-topic-designer`

Avoid shallow labels such as "20s women", "small businesses", "marketing teams", "founders", or "executives" unless connected to a concrete decision, workflow, pain, comparison axis, anxiety, and required proof.

Limit persona quantity. Prefer 3 to 7 diagnostically useful personas over a long list that cannot become distinct prompts.

## Hypothesis Levels

Use these values exactly:

- `confirmed_from_site`: The site explicitly states the segment, use case, customer type, industry, CTA target, pricing motion, feature use, or proof signal.
- `inferred_from_site`: Multiple site signals reasonably imply the persona, but the site does not explicitly name it.
- `weak_hypothesis`: The persona follows from category knowledge or thin signals, but evidence is weak.
- `needs_customer_data`: The persona cannot be validated without CRM, analytics, sales notes, interviews, support logs, or real customer records.
- `not_supported`: The persona is tempting but not supported by supplied or inspected evidence. Put these in `Excluded / Unsupported Personas`.

Assign one primary hypothesis level to every persona and to every major evidence claim. Use lower confidence when customer data is absent.

## Evidence Discipline

Never invent customer counts, revenue, market share, conversion impact, AI visibility, citations, rankings, implementation customers, industries, case studies, or real search behavior.

Never say a persona "will search" or "must be the main buyer." Say they "may search", "could evaluate", or "is a site-informed candidate."

When site evidence conflicts or is thin, explain the ambiguity and downgrade confidence.

## AI Search Prompt Angle Rules

For every persona, include at least one `AI Search Prompt Angle` that can be passed to `recora-prompt-topic-designer`.

Use this shape in the persona section:

```md
- angle_label:
- prompt_angle:
- sample_ai_questions:
  - "..."
  - "..."
- comparison_targets:
- comparison_axis:
- pre_purchase_information_needed:
- proof_needed:
```

Write `prompt_angle` as a reusable testing direction, not as one final prompt. It must include persona context, situation, comparison need, and evidence need.

Good prompt angle:

```md
Test prompts where an operations manager compares tools for reducing manual reporting work, asks whether the brand fits a mid-sized team, and looks for proof such as integrations, workflow examples, pricing clarity, and case studies.
```

Bad prompt angle:

```md
Marketing manager prompt.
```

## Default Output Format

Use this format:

```md
# Recora Persona Discovery

## 1. Input Summary

- brand_name:
- url:
- site_text / observed_claims available: yes/no
- pricing_signals:
- target_adoption:
- cta_signals:
- case_studies_or_proof:
- feature_signals:
- service_model: B2B / B2C / marketplace / agency_service / mixed / unclear
- customer_data_status: available / not_available / unknown
- missing_inputs:

## 2. Evidence Observed from Site

| Evidence ID | Signal type | Observed evidence | Source or page | Hypothesis level | Persona implication | Gaps |
|---|---|---|---|---|---|---|

Use hypothesis levels: `confirmed_from_site`, `inferred_from_site`, `weak_hypothesis`, `needs_customer_data`, `not_supported`.

## 3. Persona Candidates

| Persona ID | Persona candidate | Role type | Business model side | Hypothesis level | Site-informed rationale | Diagnostic priority | Confidence |
|---|---|---|---|---|---|---|---|

## 4. Role Classification

For B2B, include:

- `decision_maker`
- `economic_buyer`
- `end_user`
- `evaluator`
- `influencer`
- `agency_or_consultant`

For B2C, include:

- `purchaser`
- `user`
- `comparator`
- `recommender_influencer`
- `repeat_user`

| Role type | Persona IDs | Why this role matters | Role-specific search behavior |
|---|---|---|---|

## 5. Buyer Stage

| Persona ID | Buyer stage | Trigger moment | Stage-specific information need |
|---|---|---|---|

Use `recora-prompt-topic-designer` buyer stage values: `early_research`, `solution_exploration`, `comparison_shortlist`, `purchase_validation`, `implementation_planning`.

## 6. Main Pain

| Persona ID | Main pain | Job to be done | Why it matters |
|---|---|---|---|

## 7. Search Intent

| Persona ID | Search intent | Query posture | What they are trying to decide |
|---|---|---|---|

## 8. AI Search Prompt Angle

### [Persona ID] - [Persona Name]

- angle_label:
- prompt_angle:
- comparison_targets:
- comparison_axis:
- pre_purchase_information_needed:
- proof_needed:

Repeat for each persona.

## 9. Sample AI Search Questions

| Persona ID | Sample AI-search questions |
|---|---|

Include 2 to 4 questions per persona. Phrase them as natural AI-search questions, not keyword lists.

## 10. Comparison Criteria

| Persona ID | Comparison targets | Comparison criteria | Why these criteria matter |
|---|---|---|---|

## 11. Objections / Concerns

| Persona ID | Objections or concerns | Risk behind the concern | Evidence needed to reduce concern |
|---|---|---|---|

## 12. What They Need to See

| Persona ID | Required information | Required proof | Site page or asset that should provide it |
|---|---|---|---|

## 13. Handoff to recora-prompt-topic-designer

| persona_id | role_type | buyer_stage | pain | prompt_angle | sample_ai_questions | priority | confidence | needs_verification |
|---|---|---|---|---|---|---|---|---|

Required handoff fields:

- `persona_id`
- `role_type`
- `buyer_stage`
- `pain`
- `prompt_angle`
- `sample_ai_questions`
- `priority`: high / medium / low
- `confidence`: high / medium / low
- `needs_verification`

## 14. Confidence Level

| Persona ID | Confidence | Hypothesis level | Reason |
|---|---|---|---|

Use `high`, `medium`, or `low`.

- `high`: multiple specific site signals support the persona and role.
- `medium`: several site signals exist, but the role or buying stage is partly inferred.
- `low`: URL/brand-only, thin site evidence, inaccessible pages, no customer data, or mostly category-level inference.

## 15. Needs Verification

- Customer data needed:
- Site pages or claims to verify:
- Sales or support questions to ask:
- Risks if used as-is for Recora diagnosis:

## 16. Excluded / Unsupported Personas

| Excluded persona | Why considered | Reason excluded | What evidence would be needed |
|---|---|---|---|
```

## Relationship To Other Recora Skills

Use `recora-persona-discovery` before `recora-prompt-topic-designer` when personas are undefined or when the diagnosis needs separate angles for decision makers, economic buyers, users, evaluators, influencers, agencies, purchasers, comparators, recommenders, or repeat users.

Do not replace `recora-prompt-topic-designer`; produce persona-specific prompt angles and the handoff table it can consume.

Do not replace recommendation quality-gate or implementation-architecture skills. This skill stops at persona hypotheses and prompt-angle preparation.
