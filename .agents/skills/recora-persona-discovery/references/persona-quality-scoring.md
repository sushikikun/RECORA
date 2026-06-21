# Persona Quality Scoring

Use this scoring guide to decide whether a persona should be included in Recora diagnosis, downgraded, or excluded.

Score each dimension from 0 to 5.

Use this together with `business-type-router.md`, `industry-persona-patterns.md`, `industry-coverage-expansion.md`, `evidence-to-persona-traceability.md`, `icp-anti-icp-fit.md`, `persona-research-question-generator.md`, `persona-validation-plan.md`, `persona-to-prompt-readiness.md`, `persona-risk-register.md`, `prompt-angle-handoff-contract.md`, and `persona-confidence-upgrade-data.md`. A persona can score well strategically and still be held out of normal handoff when business type, industry category, industry subtype, decision unit, buyer/user split, trust requirements, traceability, ICP fit, validation plan, prompt readiness, risk mitigation, validation questions, or confidence-upgrade data are missing.

## Scoring Dimensions

### decision_relevance

How directly the persona affects purchase, adoption, renewal, implementation, or recommendation.

- 0: No clear decision influence.
- 1: Passive audience or content reader only.
- 2: Indirect influence with unclear decision moment.
- 3: Clear influence on evaluation or use.
- 4: Strong influence on shortlist, budget, internal approval, or repeat purchase.
- 5: Direct owner of adoption, budget, approval, procurement, or ongoing success.

### search_likelihood

How likely the persona is to ask AI-search questions during evaluation.

- 0: No plausible search moment.
- 1: Search moment is generic or forced.
- 2: Might search, but question is vague.
- 3: Has a clear problem or comparison query.
- 4: Has clear trigger events and is likely to ask multiple AI-search questions by stage.
- 5: Strong natural fit for AI-search research, comparison, risk checking, evidence gathering, and vocabulary-specific prompts.

### comparison_value

How useful the persona is for comparison prompts.

- 0: No comparison target or criteria.
- 1: Only broad brand awareness.
- 2: Compares vague categories.
- 3: Compares vendors, services, approaches, pricing, trust, features, proof, or alternatives such as DIY/do nothing.
- 4: Has distinct comparison axes from other personas.
- 5: Produces high-value comparison prompts that reveal competitors, criteria, and evidence gaps.

### prompt_angle_value

Whether the persona can become useful prompt angles for `recora-prompt-topic-designer`.

- 0: No usable prompt angle.
- 1: Prompt angle is only a job title or demographic.
- 2: Prompt angle is generic and overlaps with other personas.
- 3: Prompt angle includes persona, situation, comparison axis, and proof need.
- 4: Prompt angle includes switching force, journey stage, vocabulary, alternatives, and proof need.
- 5: Prompt angle is distinct, diagnosis-ready, and likely to reveal AI-answer, competitor, citation, or objection gaps.

### evidence_strength

How strongly available evidence supports the persona.

- 0: No support.
- 1: Category assumption only.
- 2: Weak site or CTA signal.
- 3: Several site signals support the role or use case.
- 4: Explicit site page, CTA, feature, pricing, case, or target-audience signal.
- 5: Site evidence plus customer data, sales notes, interviews, or analytics.

### diagnosis_usefulness

How useful the persona is for Recora diagnosis.

- 0: Cannot guide diagnosis.
- 1: Produces generic SEO or marketing prompts only.
- 2: Useful only as background context.
- 3: Produces at least one non-branded or comparison prompt angle.
- 4: Produces multiple prompts across buyer stages or roles.
- 5: Reveals distinct AI-search visibility, competitor, citation, pricing, trust, or evidence risks.

### exclusion_risk

Risk that including the persona would mislead the diagnosis.

- 0: Low risk and clearly supported.
- 1: Minor assumptions, easy to label.
- 2: Some missing evidence, but useful with caveats.
- 3: Weak evidence or role overlap could distort prompt design.
- 4: Likely unsupported, too generic, or high overclaim risk.
- 5: Not supported, invented, harmful, impossible to turn into Recora prompts, or lacks traceability for a key handoff claim.

Higher `exclusion_risk` is worse.

## Inclusion Rules

Include as high priority when:

- `prompt_angle_value` is 4 or 5.
- `diagnosis_usefulness` is 4 or 5.
- `exclusion_risk` is 0, 1, or 2.
- The persona has a distinct role, switching force, journey stage, problem narrative, search intent, comparison axis, and proof need.
- `icp_fit` is `likely_icp` or `possible_icp`.
- Traceability claim IDs support the main role, pain, trigger, and prompt angle.
- `prompt_readiness` is `ready_for_prompt_design` or `usable_with_caution`.
- Risk flags are low or mitigated.
- `business_type` and `industry_pattern` are supported by observed evidence.
- `industry_category` and `industry_subtype` are present when the site fits an expanded industry route.
- `decision_unit_type` and `buyer_user_split` are explicit for B2B, B2C, marketplace, BtoB2C, franchise, multi-location, public/nonprofit, or high-trust businesses.
- `location_or_region_dependency`, `urgency_level`, `trust_signal_required`, and `evidence_needed_before_handoff` are present when they affect the prompt angle.
- Local/high-trust/regulated personas include trust requirements.

Include as medium priority when:

- `prompt_angle_value` is at least 3.
- `diagnosis_usefulness` is at least 3.
- `exclusion_risk` is 3 or lower.
- Evidence or customer data is incomplete but the prompt angle is useful.
- `icp_fit` is `possible_icp` or `adjacent_segment`.
- Missing evidence is explicit in research questions and confidence-upgrade data.
- `prompt_readiness` is `usable_with_caution` and the validation plan is specific.

Exclude or hold when:

- `prompt_angle_value` is 0, 1, or 2.
- `diagnosis_usefulness` is 0, 1, or 2.
- `exclusion_risk` is 4 or 5.
- The candidate is only a demographic, company size, or job title.
- The candidate lacks switching forces, problem narrative, or AI-search journey stage.
- The candidate requires customer data but no customer data exists.
- The candidate lacks traceability claim IDs.
- The candidate lacks validation questions.
- `icp_fit` is `anti_icp` or `not_enough_evidence`.
- `research_sufficiency` is `not_enough_to_use`.
- `prompt_readiness` is `needs_more_evidence` or `do_not_handoff`.
- High-risk register entries are unresolved.
- Key traceability claims are `unsupported`.
- Business type or industry pattern is unsupported.
- Industry category or subtype is unsupported by observed evidence.
- Decision unit is mixed in a way that hides buyer, user, comparator, influencer, blocker, or payer differences.
- Location, urgency, local trust, or service-area assumptions are central but unsupported.
- Local/high-trust proof or regulated proof is missing when central to the prompt angle.

## Persona Decision Table

Use this table in outputs:

```md
| Persona ID | business_type | industry_category | industry_subtype | industry_pattern | regulated_or_high_trust_flag | decision_unit_type | buyer_user_split | decision_role_separation | location_or_region_dependency | urgency_level | trust_signal_required | evidence_needed_before_handoff | decision_relevance | search_likelihood | comparison_value | prompt_angle_value | evidence_strength | diagnosis_usefulness | exclusion_risk | switching_force_summary | ai_search_journey_stage | problem_narrative_summary | customer_language_terms | alternatives_considered | icp_fit | prompt_readiness | risk_flags | traceability_claim_ids | research_sufficiency | confidence_upgrade_needed | Include / exclude | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

If a persona is excluded, still explain what evidence would make it usable.
