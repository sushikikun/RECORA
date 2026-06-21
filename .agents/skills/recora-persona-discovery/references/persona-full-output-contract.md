# Persona Full Output Contract

## Output Requirements

For `full` output, include Business Type Classification, Industry Coverage / Decision Unit / High-Trust Caution, Research Sufficiency Gate, Evidence Source Matrix, Evidence-to-Persona Traceability, Persona Decision Table, ICP / Anti-ICP Fit, Switching Forces, Problem Narrative, AI Search Journey, Voice of Customer Vocabulary, Alternatives They Consider, Research Questions to Validate Personas, Persona Validation Plan, Persona-to-Prompt Readiness, Persona Risk Register, Risky Intent Transformation, Unsafe Intent Exclusions, Safe Transformed Prompt Angles, Data Needed to Upgrade Confidence, handoff to `recora-prompt-topic-designer`, and Anti-Personas. Include Golden Test Case Calibration Notes for complex, high-risk, regulated/high-trust, risky-intent, multi-location, public/nonprofit, enterprise IT/security, or ambiguous outputs.

For `full_compact`, `excerpt`, `handoff_only`, and `validation_only`, follow `references/output-mode-contract.md`. Smaller modes may omit long narrative sections, but must not omit role separation, prompt readiness, risk flags, confidence, `needs_verification`, excluded personas when relevant, or evidence boundaries. Use the `5 Persona Compact Table` when full_compact or excerpt mode needs exactly five concise persona rows.

Before final delivery, run the Output Self-Check in `persona-anti-patterns.md`. Remove or exclude any persona that lacks an observable prompt angle, switching force, journey stage, problem narrative, vocabulary-to-question connection, traceability claim, ICP fit decision, validation plan, prompt readiness decision, risk register entry, confidence-upgrade path, or sufficient evidence boundary.

## Output Modes

Use `output_mode` to control length:

- `full`: produce all default sections.
- `full_compact`: run the same internal checks as `full`, but compress the output around Input Summary, Business Type Classification, Evidence Source Matrix summary, 5 Persona Compact Table, Persona-to-Prompt Readiness summary, Handoff, Excluded / Unsupported Personas, Risk Flags, Needs Verification, and Output Self-Check Summary.
- `excerpt`: focus on Input Summary, Business Type Classification, Persona Decision Table or 5 Persona Compact Table, Persona-to-Prompt Readiness, Handoff, Risk Flags, Needs Verification, and Output Self-Check.
- `handoff_only`: output only rows for `recora-prompt-topic-designer`, while still including `role_mapping_reason`, `risk_flags`, `prompt_readiness`, `readiness_reason`, `confidence`, and `needs_verification`.
- `validation_only`: evaluate existing persona candidates and decide `ready_for_prompt_design`, `usable_with_caution`, `needs_more_evidence`, or `do_not_handoff`.

If `output_mode` is missing, infer the smallest mode that satisfies the request and state it.

## Default Full Output Format

Use this format for `full` output:

```md
# Recora Persona Discovery

## 1. Input Summary

- brand_name:
- output_mode:
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
- risky_user_queries available: yes/no
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

| Persona ID | business_type | industry_category | industry_subtype | industry_pattern | regulated_or_high_trust_flag | decision_unit_type | buyer_user_split | decision_role_separation | location_or_region_dependency | urgency_level | trust_signal_required | evidence_needed_before_handoff | decision_relevance | search_likelihood | comparison_value | prompt_angle_value | evidence_strength | diagnosis_usefulness | exclusion_risk | switching_force_summary | ai_search_journey_stage | problem_narrative_summary | customer_language_terms | alternatives_considered | icp_fit | prompt_readiness | risk_flags | risky_intent_detected | risky_intent_type | safe_transformation_available | safe_prompt_angle | regulated_claim_risk | handoff_decision | traceability_claim_ids | research_sufficiency | confidence_upgrade_needed | Include / exclude | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Use 0-5 scores. Include only personas with enough decision value, search intent, comparison value, prompt-angle value, evidence, and diagnosis usefulness. Exclude or downgrade candidates with high unsupported-claim risk. If `risky_intent_detected` is true, show whether safe transformation is available and whether handoff uses only the safe transformed prompt angle.

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
## Risky Intent Transformation

| persona_id | risky_intent_detected | risky_intent_type | unsafe_user_intent | why_risky | safe_transformation_rule | safe_prompt_angle | prompt_readiness | risk_flags | when_to_handoff | when_to_exclude |
|---|---|---|---|---|---|---|---|---|---|---|

Use `risky-intent-transformation.md`. Treat `unsafe_user_intent` as caution-marked context only. Do not use it directly as a prompt or handoff angle. Include Unsafe Intent Exclusions and Safe Transformed Prompt Angles when regulated/high-trust intent appears.

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

| persona_id | prompt_readiness | readiness_reason | clear_search_intent | clear_trigger_event | clear_comparison_axis | observable_ai_answer_signal | prompt_angle_quality | evidence_strength | risk_of_generic_prompt | risk_of_overclaim | risky_intent_detected | safe_transformation_available | safe_prompt_angle_present | regulated_claim_risk | handoff_decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

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

| persona_id | business_type | industry_category | industry_subtype | industry_pattern | regulated_or_high_trust_flag | decision_unit_type | detailed_decision_role | role_type | role_mapping_reason | buyer_user_split | buyer_stage | pain | trust_requirement | trust_signal_required | urgency_level | location_dependency | evidence_needed_before_prompt_design | switching_forces | journey_stage | problem_narrative | vocabulary_terms | alternatives_considered | prompt_angle | risky_intent_detected | risky_intent_type | original_unsafe_intent | safe_transformed_prompt_angle | regulated_claim_risk | safe_prompt_language_required | sample_ai_questions | priority | confidence | icp_fit | prompt_readiness | readiness_reason | risk_flags | traceability_claim_ids | research_sufficiency | validation_questions | assumptions_to_validate | confidence_upgrade_condition | confidence_upgrade_needed | questions_to_validate_before_prompt_design | needs_verification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Required handoff fields:

- `persona_id`
- `business_type`
- `industry_category`
- `industry_subtype`
- `industry_pattern`
- `regulated_or_high_trust_flag`
- `decision_unit_type`
- `detailed_decision_role`
- `role_type`
- `role_mapping_reason`
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
- `risky_intent_detected`
- `risky_intent_type`
- `original_unsafe_intent`: caution-marked original wording only; never use directly as a prompt.
- `safe_transformed_prompt_angle`: required when risky intent is transformed; the handoff `prompt_angle` must use this safe wording.
- `regulated_claim_risk`
- `safe_prompt_language_required`
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

Do not normal-handoff personas with `icp_fit` of `anti_icp` or `not_enough_evidence`, unsupported traceability claims, `research_sufficiency` of `not_enough_to_use`, or `prompt_readiness` of `needs_more_evidence` or `do_not_handoff`. For regulated/high-trust personas with strong missing evidence, use `usable_with_caution` or `needs_more_evidence`, not `ready_for_prompt_design`. If risky intent is detected, never pass `original_unsafe_intent` as the prompt angle; pass only `safe_transformed_prompt_angle` with risk flags and needs verification.

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

Use reasons such as `industry_mismatch`, `regulated_claim_risk`, `risky_intent_untransformed`, `unsafe_direct_advice`, `unsafe_direct_diagnosis`, `unsafe_effect_guarantee`, `unsupported by site evidence`, `too generic`, `duplicate segment`, `no observable prompt angle`, or `requires customer interview first`.

## 35. Anti-Personas / Not Useful for Recora Diagnosis

| Anti-persona | Exclusion reason | Why not useful for Recora diagnosis | Required evidence to reconsider |
|---|---|---|---|

Use reasons such as `no AI-search intent`, `no buying influence`, `too generic`, `duplicate segment`, `industry_mismatch`, `regulated_claim_risk`, `risky_intent_untransformed`, `unsafe_direct_advice`, `unsafe_direct_diagnosis`, `unsafe_effect_guarantee`, `no observable prompt angle`, `unsupported by site evidence`, `anti_icp`, `not_enough_evidence`, `needs_more_evidence`, `do_not_handoff`, or `requires customer interview first`.

## 36. Output Self-Check

- Every included persona has switching forces.
- Business Type Classification is present and supported by observed signals.
- Output uses the requested or inferred `output_mode` and includes required sections for that mode.
- `full_compact` is not confused with `full` or `excerpt`: it keeps full-mode checks but returns the compressed required sections from `output-mode-contract.md`.
- BtoB, BtoC, marketplace, agency, local, and high-trust roles are split according to business type.
- Canonical `detailed_decision_role`, legacy `decision_role`, and canonical `role_type` are not mixed, and `role_mapping_reason` is present.
- `agency_or_consultant` personas are not mixed with client-side buyer or client-side evaluator personas unless site evidence supports both sides.
- Local/high-trust personas include trust requirements such as location, reviews, qualifications, price transparency, or consultation flow when relevant.
- Regulated/sensitive personas avoid unsupported claims and include stronger `needs_verification`.
- High-trust or regulated personas are not marked `ready_for_prompt_design` when required proof is materially missing.
- EC, beauty, medical, legal, financial, hiring, real estate, or security personas do not overstate effects, outcomes, eligibility, approval, or safety.
- D2C/skincare product-effect guarantee intent is transformed into safe comparison and verification wording or excluded.
- Risky AI-search intent is detected, classified, and either transformed into safe comparison/verification wording or excluded.
- `original_unsafe_intent` is not used directly as a prompt, sample question, or handoff angle.
- Safe transformed prompt angles include `risk_flags`, `regulated_claim_risk`, and `needs_verification` when high-trust or regulated categories are involved.
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
