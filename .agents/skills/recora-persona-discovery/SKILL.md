---
name: recora-persona-discovery
description: "Recora persona discovery for AI search and GEO diagnosis preparation. Use when Codex needs to infer research-gated persona hypotheses from brand_name, url, site_text, observed_claims, homepage/product/pricing/case/review/hiring/docs evidence, trigger events, customer vocabulary, alternatives, switching forces, problem narratives, AI-search journey stages, pricing signals, CTA, case studies, features, target audiences, or customer-data availability; route business type and industry coverage across B2B SaaS/service, B2C ecommerce/local, clinic/healthcare, professional service, school/education, real estate, recruiting/HR, marketplace, agency/consulting, media/directory, manufacturing, construction/field service, logistics, finance/insurance, hospitality/restaurant/tourism, beauty/wellness, home services, automotive, public sector/nonprofit, enterprise IT/security, franchise/multi-location, subscription/membership, and regulated/high-trust services; separate B2B/B2C/BtoB2C/marketplace/agency/local/multi-location decision units; score persona quality; trace evidence to persona claims; generate validation plans and questions; classify ICP/Anti-ICP fit; assess persona-to-prompt readiness; flag persona risks; use golden test cases for calibration; specify confidence-upgrade data; identify anti-personas; and produce prompt-angle handoff for recora-prompt-topic-designer. Do not use for modifying Recora app code, accessing secrets, or claiming validated personas without enough customer research data."
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
- `references/business-type-router.md`: business-type classification and routing for B2B, B2C, marketplace, agency, local, high-trust, regulated, media, recruiting, real estate, school, clinic, and professional-service cases.
- `references/industry-coverage-expansion.md`: expanded industry routing for manufacturing, construction, logistics, finance/insurance, hospitality/restaurant/tourism, beauty/wellness, home services, automotive, public sector/nonprofit, enterprise IT/security, franchise/multi-location, and subscription/membership.
- `references/industry-persona-patterns.md`: industry-specific persona roles, pains, triggers, comparison criteria, trust requirements, vocabulary, alternatives, and unsupported persona examples.
- `references/b2b-buying-committee-patterns.md`: decision maker, economic buyer, end user, evaluator, technical reviewer, influencer, agency/consultant, and blocker patterns.
- `references/b2c-decision-role-patterns.md`: purchaser, user, comparator, recommender, family decision maker, and repeat user patterns.
- `references/local-trust-service-personas.md`: local/high-trust service persona patterns for clinics, professional services, schools, real estate, local stores, and high-ticket consultation.
- `references/regulated-industry-cautions.md`: sensitive and regulated category cautions for medical, legal, financial, real estate, recruiting/HR, and high-trust services.
- `references/research-sufficiency-gate.md`: proto-persona versus validated persona rules, research gaps, and sufficiency statuses.
- `references/evidence-source-matrix.md`: source-by-source extraction matrix for homepage, product, pricing, case, reviews, hiring, docs, and other buyer signals.
- `references/evidence-to-persona-traceability.md`: claim-level traceability from observed evidence to persona inference and handoff eligibility.
- `references/persona-research-question-generator.md`: research questions for validating pains, triggers, alternatives, vocabulary, objections, and buying influence.
- `references/icp-anti-icp-fit.md`: ICP, adjacent, anti-ICP, and not-enough-evidence fit rules for Recora diagnosis usefulness.
- `references/persona-confidence-upgrade-data.md`: data needed to move low/medium confidence hypotheses toward stronger validation.
- `references/persona-validation-plan.md`: assumptions, validation questions, evidence needs, data sources, and prompt-design use decision.
- `references/persona-to-prompt-readiness.md`: readiness values and handoff decisions for `recora-prompt-topic-designer`.
- `references/persona-risk-register.md`: persona risk flags, mitigation, output language, and exclusion rules.
- `references/persona-golden-test-cases.md`: calibration cases for BtoB SaaS, SEO/GEO/AI-search support, local trust-heavy services, agency/consultant workflows, and expanded industries such as manufacturing, construction, finance/insurance, hospitality, beauty/wellness, home services, automotive, public/nonprofit, and enterprise IT/security.
- `references/persona-trigger-events-and-vocabulary.md`: trigger events, customer language, alternatives, JTBD, desired outcomes, and vocabulary patterns.
- `references/persona-switching-forces.md`: push, pull, habit, anxiety, hire/fire criteria, and prompt implications.
- `references/ai-search-journey-by-persona.md`: awareness, exploration, comparison, validation, and decision stages by persona.
- `references/persona-problem-narrative.md`: struggling moment, blocker, stakes, pressure, decision context, and success narrative.
- `references/persona-quality-scoring.md`: 0-5 scoring dimensions for Recora diagnosis usefulness and exclusion risk.
- `references/japan-b2b-persona-patterns.md`: Japan B2B buying, evaluation, and agency/consultant patterns.
- `references/persona-output-examples.md`: realistic good examples for B2B SaaS, SEO/marketing services, B2C, and agency/consultant targets.
- `references/prompt-angle-handoff-contract.md`: required handoff fields for `recora-prompt-topic-designer`.
- `references/persona-anti-patterns.md`: failure examples, banned shortcuts, and final QA checks.

## Pattern Adoption Rules

Use external Agent Skill / Codex Skill material only as pattern inspiration:

- Borrow structure patterns such as input contracts, reference maps, scoring rubrics, output contracts, anti-pattern sections, and validation checklists.
- Do not copy external brand names, project names, long passages, scripts, assets, commands, or provider-specific claims.
- Do not execute, install, or import external skills or dependencies.
- Adapt every borrowed pattern to Recora persona discovery, AI-search diagnosis, and `recora-prompt-topic-designer` handoff.

## Use And Non-Use

Use this skill when a Recora diagnosis needs persona hypotheses from URL, brand name, site text, observed claims, pricing, CTA, feature, case-study, target-audience, marketplace, agency, B2B, or B2C signals.

Do not use this skill to make customer segmentation claims from real revenue, CRM, sales, analytics, interview, or support data unless that data is provided. Without real customer data, output site-informed hypotheses only.

Do not use this skill for implementation, crawling infrastructure, production diagnostics, app code, schema changes, package changes, secrets, cookies, login sessions, API calls, or external skill execution.

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
- `business_type`: classify with `business-type-router.md` when evidence supports a more specific type.
- `industry_pattern`: BtoB SaaS, SEO/GEO/AI-search support, EC/D2C, clinic, professional service, school, real estate, recruiting/HR, agency/consulting, local service, media/directory, marketplace, or unclear.
- `industry_category`: broad industry category from `industry-coverage-expansion.md` when applicable.
- `industry_subtype`: more specific subtype, such as field service, supply chain, insurance, restaurant, franchise, or enterprise security.
- `regulated_or_high_trust`: `yes`, `no`, or `unclear`.
- `location_or_region_dependency`: `none`, `local`, `service_area`, `multi_location`, `franchise`, `regional`, or `unclear`.
- `urgency_level`: `low`, `medium`, `high`, `urgent`, or `unclear`.
- `customer_data_status`: `available`, `not_available`, or `unknown`.
- `research_data_points`: count and type of customer interviews, sales notes, analytics events, support tickets, reviews, case-study quotes, testimonials, or CRM records available.
- `evidence_sources_available`: homepage, product page, pricing, case study, testimonial, CTA, FAQ, comparison page, review site, hiring page, docs/help center, or unknown.

If URL and brand name are the only inputs, inspect the site if browsing is available. If the site cannot be inspected, mark all persona candidates `weak_hypothesis` or `needs_customer_data` and list missing evidence.

If real customer data is unavailable, never label a persona as a real primary customer segment.

## Workflow

1. Summarize inputs and missing inputs. Do not fill gaps silently.
2. Read `business-type-router.md` first and classify `business_type`, `industry_pattern`, and `regulated_or_high_trust`.
3. Based on routing, read the relevant industry references: `industry-coverage-expansion.md`, `industry-persona-patterns.md`, `b2b-buying-committee-patterns.md`, `b2c-decision-role-patterns.md`, `local-trust-service-personas.md`, and `regulated-industry-cautions.md` as needed.
4. Read `research-sufficiency-gate.md`, `evidence-source-matrix.md`, `evidence-to-persona-traceability.md`, `persona-research-question-generator.md`, `persona-validation-plan.md`, `persona-to-prompt-readiness.md`, `persona-risk-register.md`, `persona-confidence-upgrade-data.md`, `icp-anti-icp-fit.md`, `persona-trigger-events-and-vocabulary.md`, `persona-switching-forces.md`, `ai-search-journey-by-persona.md`, `persona-problem-narrative.md`, `persona-discovery-rubric.md`, and `persona-quality-scoring.md` for full outputs. Read `persona-golden-test-cases.md` for complex, high-risk, or ambiguous outputs. Also read `japan-b2b-persona-patterns.md` when the market is Japan, Japanese-language, B2B, SEO/GEO/AIO/LLMO, agency, consultant, or unclear.
5. Build the context in this order: Product Overview -> Business Type -> Target Audience -> Buyer/User Roles -> Pain Points -> Competitive Landscape -> Trust Requirements -> Objections -> Customer Language.
6. Extract observed evidence into the Evidence Source Matrix from homepage, product pages, pricing, case studies, testimonials, CTA, FAQ, comparison pages, review sites, hiring pages, docs, and help centers.
7. Create Evidence-to-Persona Traceability with stable `claim_id` values so every important persona inference can be traced to evidence or an explicit gap.
8. Apply the Research Sufficiency Gate. Treat URL/site-only outputs as `site_only_hypothesis` or `enough_for_prompt_design`, not validated personas.
9. Assign hypothesis levels with the exact values in `Hypothesis Levels`.
10. Split roles by business model and business type. For B2B, separate decision maker, economic buyer, end user, evaluator, technical reviewer, procurement, legal/compliance, security reviewer, finance controller, operations/field manager, local branch manager, influencer, agency/consultant, and blocker when supported. For B2C, separate purchaser, user, comparator, recommender/influencer, family decision maker, caregiver, gift purchaser, emergency decider, repeat buyer, local comparator, and repeat user when supported. For marketplaces, separate supply side, demand side, and platform-side interests. For BtoB2C, franchise, and multi-location businesses, separate headquarters/platform, local operator/branch, and end-customer roles. For local/high-trust services, separate local comparator, user/client/patient/learner, payer/sponsor, family influencer, urgent decider, and repeat user when supported.
11. Build 3 to 7 persona candidates that can each generate useful Recora diagnosis prompts.
12. For each persona, specify JTBD, trigger events, pains, desired outcomes, search intent, vocabulary, AI-search questions, alternatives, comparison targets, comparison criteria, trust requirements, concerns, required proof, and prompt angle.
13. Add Switching Forces: push from status quo, pull toward solution, habit holding back, anxiety/switching risk, hire criteria, fire criteria, and AI-search implication.
14. Add Problem Narrative: trying to accomplish, current blocker, why it matters, consequence of inaction, pressure, decision context, and success state.
15. Map the AI Search Journey across awareness, exploration, comparison, validation, and decision when relevant.
16. Score every persona with `decision_relevance`, `search_likelihood`, `comparison_value`, `prompt_angle_value`, `evidence_strength`, `diagnosis_usefulness`, and `exclusion_risk`.
17. Classify ICP / Anti-ICP fit. Do not normal-handoff `anti_icp`, `not_enough_evidence`, `unsupported`, or `not_enough_to_use` candidates.
18. Generate research questions, Persona Validation Plan, and confidence-upgrade data for included and borderline personas.
19. Assess Persona-to-Prompt Readiness and build the Persona Risk Register. Add `regulated_claim_risk`, `industry_mismatch`, `local_trust_gap`, `location_dependency_gap`, or `decision_unit_confusion` risk flags when relevant. Do not normal-handoff `needs_more_evidence` or `do_not_handoff`.
20. Calibrate against the nearest Golden Test Case when the business model is BtoB SaaS, SEO/GEO/AI-search support, local trust-heavy service, agency/consultant-involved, regulated/high-trust, expanded-industry, public/nonprofit, enterprise IT/security, or ambiguous.
21. Create the Persona Decision Table and exclude candidates that cannot become useful prompt angles or have high unsupported-claim risk.
22. Run Output Self-Check before final delivery.
23. Produce `Handoff to recora-prompt-topic-designer` using the required handoff fields.
24. List unsupported, excluded, anti-ICP, not-ready, industry-mismatched, regulated-claim-risk, or anti-persona candidates instead of quietly dropping weak ideas.

## Role Classification

For B2B, use these role labels exactly:

- `decision_maker`: Approves adoption, owns strategic fit, accepts business risk, or signs off.
- `economic_buyer`: Controls budget, ROI case, contract size, renewal, or procurement economics.
- `end_user`: Uses the product or service in daily work and feels workflow pain directly.
- `evaluator`: Compares options, validates vendor fit, runs trials, checks security/technical fit, or builds the shortlist.
- `technical_reviewer`: Checks security, data, integration, compliance, implementation, or operational risk.
- `influencer`: Shapes requirements, internal consensus, or category framing without final authority.
- `agency_or_consultant`: Advises, implements, audits, resells, or recommends on behalf of the customer.
- `blocker`: Raises risk, cost, compliance, disruption, or status-quo objections that may block adoption.

Always split B2B decision maker and end user. If the same person likely holds two roles, show two rows or state `same_person_possible` while keeping role-specific search intent separate.

For B2C, use these role labels exactly:

- `purchaser`: Pays, subscribes, orders, books, or chooses where money goes.
- `user`: Uses, consumes, attends, receives, or benefits from the product/service.
- `comparator`: Reads reviews, compares alternatives, checks price, quality, trust, or fit.
- `recommender_influencer`: Suggests, gifts, advises, reviews, influences, or socially validates the choice.
- `family_decision_maker`: Helps choose, pay, approve, or reduce risk for a family member or dependent.
- `repeat_user`: Returns, renews, replenishes, upgrades, or decides whether to keep using.

Always split B2C purchaser and user when they may differ, such as parent/child, buyer/gift recipient, family purchaser/patient, or owner/operator.

For marketplaces, split supply-side and demand-side personas. For agency-support targets, split the agency buyer, agency operator, client-side buyer, and client-side evaluator when relevant.

## Persona Quality Bar

Each persona must include decision logic, not just demographics.

Every usable persona candidate must include:

- What role they play in adoption or purchase
- What moment triggers their search
- JTBD
- Trigger events
- Switching forces
- Problem narrative
- Search intent
- AI-search journey stage
- Desired outcomes
- Customer language / vocabulary
- AI-search question examples
- Alternatives they consider
- Comparison targets
- Comparison criteria
- Objections or anxieties
- Information they need before adoption or purchase
- Evidence they need to trust the brand
- Recora diagnosis prompt angle
- Business type and industry pattern
- Industry category and subtype
- Decision role separation
- Decision unit type and buyer/user split
- Location or region dependency and urgency level
- Trust requirements for local, sensitive, regulated, or high-ticket decisions
- Evidence needed before handoff
- Evidence traceability claim IDs
- ICP / Anti-ICP fit
- Research questions needed before stronger validation
- Data needed to upgrade confidence
- Persona validation plan
- Persona-to-prompt readiness
- Risk flags and mitigation
- Handoff fields for `recora-prompt-topic-designer`

Avoid shallow labels such as "20s women", "small businesses", "marketing teams", "founders", or "executives" unless connected to a concrete decision, workflow, pain, comparison axis, anxiety, and required proof.

Limit persona quantity. Prefer 3 to 7 diagnostically useful personas over a long list that cannot become distinct prompts.

## Persona Quality Scoring

Score every included or excluded candidate from 0 to 5 using `references/persona-quality-scoring.md`.

Required scoring dimensions:

- `decision_relevance`
- `search_likelihood`
- `comparison_value`
- `prompt_angle_value`
- `evidence_strength`
- `diagnosis_usefulness`
- `exclusion_risk`

Include a persona only when it can produce a specific AI-search prompt angle and a useful Recora diagnostic observation. Exclude or downgrade candidates with low `prompt_angle_value`, low `diagnosis_usefulness`, or high `exclusion_risk`.

Do not let high business importance override weak evidence. If a persona may matter strategically but lacks site or customer evidence, keep it low-confidence and mark `needs_customer_data`.

## Hypothesis Levels

Use these values exactly:

- `confirmed_from_site`: The site explicitly states the segment, use case, customer type, industry, CTA target, pricing motion, feature use, or proof signal.
- `inferred_from_site`: Multiple site signals reasonably imply the persona, but the site does not explicitly name it.
- `weak_hypothesis`: The persona follows from category knowledge or thin signals, but evidence is weak.
- `needs_customer_data`: The persona cannot be validated without CRM, analytics, sales notes, interviews, support logs, or real customer records.
- `not_supported`: The persona is tempting but not supported by supplied or inspected evidence. Put these in `Excluded / Unsupported Personas`.

Assign one primary hypothesis level to every persona and to every major evidence claim. Use lower confidence when customer data is absent.

## Research Sufficiency Gate

Use these gate values exactly:

- `site_only_hypothesis`: Based only on URL, site text, observed claims, public pages, or category inference.
- `enough_for_prompt_design`: Enough evidence to design Recora prompt angles, but not enough to call the persona validated.
- `needs_customer_interview`: Needs customer or prospect interviews to confirm pains, vocabulary, triggers, alternatives, or objections.
- `needs_sales_data`: Needs CRM, sales notes, deal loss reasons, pipeline data, or account-level buyer-role evidence.
- `needs_case_study_validation`: Needs case-study, testimonial, role/title, industry, or outcome validation.
- `not_enough_to_use`: Too little evidence to use safely in Recora diagnosis.

Do not call a persona `validated` unless there are at least 5 to 10 relevant research data points from customer interviews, sales notes, analytics, reviews, support logs, case studies, or comparable customer evidence.

Use frequency x intensity thinking for pains and trigger themes: repeated low-intensity issues may be useful for awareness prompts, while rare high-intensity issues may be useful for validation or decision prompts.

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
- trigger_events:
- switching_force_summary:
- ai_search_journey_stage:
- problem_narrative_summary:
- customer_language:
- sample_ai_questions:
  - "..."
  - "..."
- alternatives_they_consider:
- comparison_targets:
- comparison_axis:
- pre_purchase_information_needed:
- proof_needed:
```

Write `prompt_angle` as a reusable testing direction, not as one final prompt. It must include persona context, struggling moment, switching force, journey stage, vocabulary or question framing, alternatives considered, comparison need, and evidence need.

Good prompt angle:

```md
Test prompts where an operations manager compares tools for reducing manual reporting work, asks whether the brand fits a mid-sized team, and looks for proof such as integrations, workflow examples, pricing clarity, and case studies.
```

Bad prompt angle:

```md
Marketing manager prompt.
```

## Output Requirements

Every substantial output must include Business Type Classification, Industry Coverage / Decision Unit / High-Trust Caution, Research Sufficiency Gate, Evidence Source Matrix, Evidence-to-Persona Traceability, Persona Decision Table, ICP / Anti-ICP Fit, Switching Forces, Problem Narrative, AI Search Journey, Voice of Customer Vocabulary, Alternatives They Consider, Research Questions to Validate Personas, Persona Validation Plan, Persona-to-Prompt Readiness, Persona Risk Register, Data Needed to Upgrade Confidence, handoff to `recora-prompt-topic-designer`, and Anti-Personas. Include Golden Test Case Calibration Notes for complex, high-risk, regulated/high-trust, multi-location, public/nonprofit, enterprise IT/security, or ambiguous outputs.

Before final delivery, run the Output Self-Check in `persona-anti-patterns.md`. Remove or exclude any persona that lacks an observable prompt angle, switching force, journey stage, problem narrative, vocabulary-to-question connection, traceability claim, ICP fit decision, validation plan, prompt readiness decision, risk register entry, confidence-upgrade path, or sufficient evidence boundary.

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
- business_type:
- industry_pattern:
- industry_category:
- industry_subtype:
- regulated_or_high_trust: yes/no/unclear
- location_or_region_dependency:
- urgency_level:
- customer_data_status: available / not_available / unknown
- research_data_points:
- evidence_sources_available:
- missing_inputs:

## 2. Business Type Classification

| primary_business_type | secondary_business_types | industry_category | industry_subtype | industry_pattern | observed_signals | decision_unit_type | buyer_user_split | decision_role_separation | location_or_region_dependency | urgency_level | local_or_high_trust? | regulated_or_sensitive? | trust_signal_required | evidence_needed_before_handoff | handoff_cautions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Use business type values from `business-type-router.md`. If the site is mixed, state primary and secondary types instead of forcing one classification.

## 3. Research Sufficiency Gate

| Gate value | Applies? | Reason | Required next evidence |
|---|---|---|---|
| site_only_hypothesis | yes/no | | |
| enough_for_prompt_design | yes/no | | |
| needs_customer_interview | yes/no | | |
| needs_sales_data | yes/no | | |
| needs_case_study_validation | yes/no | | |
| not_enough_to_use | yes/no | | |

State whether the output is `proto-persona`, `prompt-design-ready hypothesis`, or `validated persona`. Do not use `validated persona` without 5 to 10 relevant customer/research data points.

## 4. Evidence Source Matrix

| evidence_source | observed_signal | persona_implication | confidence_impact | limitation |
|---|---|---|---|---|

Evidence sources to check when available: homepage, product_page, pricing, case_study, testimonial, CTA, FAQ, comparison_page, review_site, hiring_page, docs/help_center.

## 5. Evidence Observed from Site

| Evidence ID | Signal type | Observed evidence | Source or page | Hypothesis level | Persona implication | Gaps |
|---|---|---|---|---|---|---|

Use hypothesis levels: `confirmed_from_site`, `inferred_from_site`, `weak_hypothesis`, `needs_customer_data`, `not_supported`.

## 6. Evidence-to-Persona Traceability

| claim_id | site_evidence | evidence_source | inferred_persona | inference_type | confidence_impact | risk_of_overreach | verification_needed |
|---|---|---|---|---|---|---|---|

Use inference types: `direct_site_claim`, `natural_inference`, `weak_market_inference`, `unsupported`, `needs_customer_data`.

## 7. Persona Candidates

| Persona ID | Persona candidate | Role type | Business model side | Hypothesis level | Site-informed rationale | Diagnostic priority | Confidence |
|---|---|---|---|---|---|---|---|

## 8. Persona Decision Table

| Persona ID | business_type | industry_category | industry_subtype | industry_pattern | regulated_or_high_trust_flag | decision_unit_type | buyer_user_split | decision_role_separation | location_or_region_dependency | urgency_level | trust_signal_required | evidence_needed_before_handoff | decision_relevance | search_likelihood | comparison_value | prompt_angle_value | evidence_strength | diagnosis_usefulness | exclusion_risk | switching_force_summary | ai_search_journey_stage | problem_narrative_summary | customer_language_terms | alternatives_considered | icp_fit | prompt_readiness | risk_flags | traceability_claim_ids | research_sufficiency | confidence_upgrade_needed | Include / exclude | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|

Use 0-5 scores. Include only personas with enough decision value, search intent, comparison value, prompt-angle value, evidence, and diagnosis usefulness. Exclude or downgrade candidates with high unsupported-claim risk.

## 9. ICP / Anti-ICP Fit

| persona_id | icp_fit | pain_intensity | budget_likelihood | decision_influence | ai_search_likelihood | comparison_need | evidence_availability | recora_diagnosis_usefulness | risk_of_generic_output | reason |
|---|---|---|---|---|---|---|---|---|---|---|

Use fit values: `likely_icp`, `possible_icp`, `adjacent_segment`, `anti_icp`, `not_enough_evidence`. Do not include `anti_icp`, `unsupported`, or `not_enough_evidence` personas in normal handoff.

## 10. Role Classification

For B2B, include:

- `decision_maker`
- `economic_buyer`
- `end_user`
- `evaluator`
- `technical_reviewer`
- `influencer`
- `agency_or_consultant`
- `blocker`

For B2C, include:

- `purchaser`
- `user`
- `comparator`
- `recommender_influencer`
- `family_decision_maker`
- `repeat_user`

| Role type | Persona IDs | Why this role matters | Role-specific search behavior |
|---|---|---|---|

## 11. Buyer Stage

| Persona ID | Buyer stage | Trigger moment | Stage-specific information need |
|---|---|---|---|

Use `recora-prompt-topic-designer` buyer stage values: `awareness`, `exploration`, `comparison`, `validation`, `decision`.

## 12. Trigger Events

| Persona ID | Trigger events | Why this starts AI search | Research sufficiency |
|---|---|---|---|

Examples: existing SEO has plateaued, AI answers show competitors but not the brand, a manager asks for comparison materials, internal approval needs ROI, an agency needs client proposal evidence, or a team is exploring new GEO/AIO initiatives.

## 13. Main Pain

| Persona ID | Main pain | Job to be done | Why it matters |
|---|---|---|---|

## 14. Search Intent

| Persona ID | Search intent | Query posture | What they are trying to decide |
|---|---|---|---|

## 15. Customer Language / Vocabulary

| Persona ID | Words or phrases they may use | Source or rationale | Connects to prompt angle |
|---|---|---|---|

Treat vocabulary as a hypothesis unless observed in site text, reviews, interviews, sales notes, or support data.

## 16. Alternatives They Consider

| Persona ID | direct competitor | existing SEO tool | agency / consultant | in-house manual research | spreadsheet / ad hoc prompt testing | do nothing | wait and see |
|---|---|---|---|---|---|---|---|

## 17. Switching Forces

| Persona ID | push_from_status_quo | pull_toward_solution | habit_holding_back | anxiety_or_switching_risk | hire_criteria | fire_criteria | implication_for_ai_search_prompt |
|---|---|---|---|---|---|---|---|

## 18. Problem Narrative

| Persona ID | trying_to_accomplish | current_blocker | why_it_matters | consequence_of_inaction | emotional_or_business_pressure | decision_context | what_success_looks_like |
|---|---|---|---|---|---|---|---|

## 19. AI Search Journey

| Persona ID | journey_stage | likely_question | search_intent | needed_evidence | competitor_watch | citation_watch | objection_watch | prompt_angle |
|---|---|---|---|---|---|---|---|---|

Use stages: `awareness`, `exploration`, `comparison`, `validation`, `decision`.

## 20. AI Search Prompt Angle

### [Persona ID] - [Persona Name]

- angle_label:
- prompt_angle:
- trigger_events:
- switching_force_summary:
- ai_search_journey_stage:
- problem_narrative_summary:
- customer_language:
- alternatives_they_consider:
- comparison_targets:
- comparison_axis:
- pre_purchase_information_needed:
- proof_needed:

Repeat for each persona.

## 21. Sample AI Search Questions

| Persona ID | Sample AI-search questions |
|---|---|

Include 2 to 4 questions per persona. Phrase them as natural AI-search questions, not keyword lists.

## 22. Comparison Criteria

| Persona ID | Comparison targets | Comparison criteria | Why these criteria matter |
|---|---|---|---|

## 23. Objections / Concerns

| Persona ID | Objections or concerns | Risk behind the concern | Evidence needed to reduce concern |
|---|---|---|---|

## 24. What They Need to See

| Persona ID | Required information | Required proof | Site page or asset that should provide it |
|---|---|---|---|

## 25. Research Questions to Validate Personas

| persona_id | question_group | question | validates | why_it_matters |
|---|---|---|---|---|

Include questions for pains, trigger events, current alternatives, comparison criteria, budget/approval, evidence needs, AI-search behavior, vocabulary, and objections. Questions should validate real past behavior and natural language, not lead respondents toward Recora.

## 26. Data Needed to Upgrade Confidence

| persona_id | current_confidence | missing_data | why_it_matters | how_to_collect | confidence_upgrade_condition |
|---|---|---|---|---|---|

Use this to explain what customer interviews, sales notes, CRM, inquiry data, case studies, reviews, support logs, search query logs, AI-search prompt logs, win/loss notes, or agency partner feedback would raise confidence.

## 27. Persona Validation Plan

| persona_id | assumptions_to_validate | validation_questions | evidence_needed | data_sources_to_check | confidence_upgrade_condition | validation_priority | should_use_for_prompt_design_now |
|---|---|---|---|---|---|---|---|

Use `should_use_for_prompt_design_now`: `yes`, `caution`, or `no`.

## 28. Persona-to-Prompt Readiness

| persona_id | prompt_readiness | readiness_reason | clear_search_intent | clear_trigger_event | clear_comparison_axis | observable_ai_answer_signal | prompt_angle_quality | evidence_strength | risk_of_generic_prompt | risk_of_overclaim | handoff_decision |
|---|---|---|---|---|---|---|---|---|---|---|---|

Use readiness values: `ready_for_prompt_design`, `usable_with_caution`, `needs_more_evidence`, `do_not_handoff`. Do not normal-handoff `needs_more_evidence` or `do_not_handoff`.

## 29. Persona Risk Register

| persona_id | risk_type | risk_level | risk_description | detection_rule | mitigation | output_language_to_use | when_to_exclude |
|---|---|---|---|---|---|---|---|

Include risk flags for invented persona, overconfidence, generic segment, role confusion, no search intent, no prompt angle, unsupported industry, duplicate persona, wrong buyer stage, and handoff contamination when relevant.

## 30. Golden Test Case Calibration Notes

- nearest_golden_case:
- calibration_result:
- matched_expected_personas:
- matched_expected_exclusions:
- output_adjustments_made:
- remaining_gap:

Use this section for complex, high-risk, or ambiguous outputs. If not needed, state `not_applicable` with the reason.

## 31. Handoff to recora-prompt-topic-designer

| persona_id | business_type | industry_category | industry_subtype | industry_pattern | regulated_or_high_trust_flag | decision_unit_type | decision_role | role_type | buyer_user_split | buyer_stage | pain | trust_requirement | trust_signal_required | urgency_level | location_dependency | evidence_needed_before_prompt_design | switching_forces | journey_stage | problem_narrative | vocabulary_terms | alternatives_considered | prompt_angle | sample_ai_questions | priority | confidence | icp_fit | prompt_readiness | readiness_reason | risk_flags | traceability_claim_ids | research_sufficiency | validation_questions | assumptions_to_validate | confidence_upgrade_condition | confidence_upgrade_needed | questions_to_validate_before_prompt_design | needs_verification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Required handoff fields:

- `persona_id`
- `business_type`
- `industry_category`
- `industry_subtype`
- `industry_pattern`
- `regulated_or_high_trust_flag`
- `decision_unit_type`
- `decision_role`
- `role_type`
- `buyer_user_split`
- `buyer_stage`
- `pain`
- `trust_requirement`
- `trust_signal_required`
- `urgency_level`
- `location_dependency`
- `evidence_needed_before_prompt_design`
- `switching_forces`
- `journey_stage`
- `problem_narrative`
- `vocabulary_terms`
- `alternatives_considered`
- `prompt_angle`
- `sample_ai_questions`
- `priority`: high / medium / low
- `confidence`: high / medium / low
- `icp_fit`
- `prompt_readiness`
- `readiness_reason`
- `risk_flags`
- `traceability_claim_ids`
- `research_sufficiency`
- `validation_questions`
- `assumptions_to_validate`
- `confidence_upgrade_condition`
- `confidence_upgrade_needed`
- `questions_to_validate_before_prompt_design`
- `needs_verification`

Do not normal-handoff personas with `icp_fit` of `anti_icp` or `not_enough_evidence`, unsupported traceability claims, `research_sufficiency` of `not_enough_to_use`, or `prompt_readiness` of `needs_more_evidence` or `do_not_handoff`. For regulated/high-trust personas with strong missing evidence, use `usable_with_caution` or `needs_more_evidence`, not `ready_for_prompt_design`.

## 32. Confidence Level

| Persona ID | Confidence | Hypothesis level | Reason |
|---|---|---|---|

Use `high`, `medium`, or `low`.

- `high`: multiple explicit site signals plus provided customer/research data support the persona and role. Do not use for URL-only or category-only evidence.
- `medium`: several site signals exist and are enough for prompt design, but the role, buying stage, or pain is partly inferred.
- `low`: URL/brand-only, thin site evidence, inaccessible pages, no customer data, or mostly category-level inference.

## 33. Needs Verification

- Customer data needed:
- Site pages or claims to verify:
- Sales or support questions to ask:
- Research questions to ask:
- Data needed to upgrade confidence:
- Prompt readiness gaps:
- Risk flags to resolve:
- Industry or business-type evidence to verify:
- Regulated or high-trust proof needed:
- Location or region dependency to verify:
- Urgency and service-area evidence to verify:
- Risks if used as-is for Recora diagnosis:

## 34. Excluded / Unsupported Personas

| Excluded persona | Why considered | Reason excluded | What evidence would be needed |
|---|---|---|---|

Use reasons such as `industry_mismatch`, `regulated_claim_risk`, `unsupported by site evidence`, `too generic`, `duplicate segment`, `no observable prompt angle`, or `requires customer interview first`.

## 35. Anti-Personas / Not Useful for Recora Diagnosis

| Anti-persona | Exclusion reason | Why not useful for Recora diagnosis | Required evidence to reconsider |
|---|---|---|---|

Use reasons such as `no AI-search intent`, `no buying influence`, `too generic`, `duplicate segment`, `industry_mismatch`, `regulated_claim_risk`, `no observable prompt angle`, `unsupported by site evidence`, `anti_icp`, `not_enough_evidence`, `needs_more_evidence`, `do_not_handoff`, or `requires customer interview first`.

## 36. Output Self-Check

- Every included persona has switching forces.
- Business Type Classification is present and supported by observed signals.
- BtoB, BtoC, marketplace, agency, local, and high-trust roles are split according to business type.
- Local/high-trust personas include trust requirements such as location, reviews, qualifications, price transparency, or consultation flow when relevant.
- Regulated/sensitive personas avoid unsupported claims and include stronger `needs_verification`.
- Persona Decision Table includes industry category, subtype, regulated/high-trust flag, decision unit type, buyer/user split, location dependency, urgency, trust signal, and evidence needed before handoff.
- Handoff includes industry category/subtype, regulated/high-trust flag, trust signal, urgency, location dependency, and evidence needed before prompt design.
- Every included persona has an AI search journey stage.
- Every included persona is explained as a problem narrative, not only as a title or demographic.
- Vocabulary terms connect to prompt angle and sample AI questions.
- Every included persona has validation questions.
- Every included persona has evidence in the traceability table and handoff claim IDs.
- Every included persona has an ICP / Anti-ICP decision.
- Every included persona has a Persona Validation Plan entry.
- Every included persona has Persona-to-Prompt Readiness.
- Every included persona has risk register coverage or a stated low-risk reason.
- Every low or medium confidence persona lists data needed to upgrade confidence.
- Validated persona and hypothesis are not mixed.
- URL-only data is not called a validated persona.
- Personas with `no observable prompt angle` are excluded from normal handoff.
- `not_enough_evidence`, `anti_icp`, and unsupported personas are not handed off as normal diagnosis targets.
- `needs_more_evidence` and `do_not_handoff` personas are not handed off as normal diagnosis targets.
- Golden Test Case Calibration Notes are included for complex, high-risk, or ambiguous outputs.
- High confidence is used only when evidence strength supports it.
```

## Relationship To Other Recora Skills

Use `recora-persona-discovery` before `recora-prompt-topic-designer` when personas are undefined or when the diagnosis needs separate angles for decision makers, economic buyers, users, evaluators, influencers, agencies, purchasers, comparators, recommenders, or repeat users.

Do not replace `recora-prompt-topic-designer`; produce persona-specific prompt angles and the handoff table it can consume.

Do not replace recommendation quality-gate or implementation-architecture skills. This skill stops at persona hypotheses and prompt-angle preparation.
