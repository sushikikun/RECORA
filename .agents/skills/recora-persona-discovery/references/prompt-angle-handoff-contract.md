# Prompt Angle Handoff Contract

Use this contract when producing `Handoff to recora-prompt-topic-designer`.

Only hand off included personas. Do not pass excluded, unsupported, `anti_icp`, `not_enough_evidence`, `not_enough_to_use`, `needs_more_evidence`, or `do_not_handoff` personas downstream unless the handoff purpose is explicitly verification or research planning.

Use `role-mapping-contract.md` before filling `decision_role` and `role_type`.

## Required Fields

Every handoff row must include:

- `persona_id`: Stable ID such as `P1`, `P2`, `P3`.
- `business_type`: Primary business type from `business-type-router.md`.
- `industry_category`: Broad category from `industry-coverage-expansion.md` or the core industry references.
- `industry_subtype`: More specific subtype, such as franchise, field service, insurance, enterprise security, restaurant, or subscription.
- `industry_pattern`: Industry pattern used for persona discovery.
- `regulated_or_high_trust_flag`: `yes`, `no`, or `unclear`.
- `decision_unit_type`: Decision structure, such as B2B buying committee, B2C family decision, marketplace two-sided unit, franchise HQ/local split, or local high-trust service.
- `decision_role`: More specific decision role, such as `economic_buyer`, `technical_reviewer`, `family_decision_maker`, or `local_comparator`.
- `role_type`: One of the allowed B2B or B2C role values.
- `role_mapping_reason`: Explain the mapping in one compact phrase. Use `same_as_decision_role` when the detailed and canonical roles are identical.
- `buyer_user_split`: Compact statement of who buys, who uses, who compares, and who influences.
- `buyer_stage`: One of the allowed stage values.
- `pain`: Main pain or job-to-be-done in one compact sentence.
- `trust_requirement`: Required trust signal, especially for local, regulated, sensitive, high-ticket, marketplace, or high-trust services.
- `trust_signal_required`: Specific proof required before stronger prompt design, such as license, review, qualification, security document, case result, fee clarity, or process proof.
- `urgency_level`: `low`, `medium`, or `high`; use `high` only when urgency is visible from the site or category context.
- `location_dependency`: `none`, `local`, `regional`, `multi_location`, `service_area`, or `unclear`.
- `evidence_needed_before_prompt_design`: Missing evidence that must be verified before stronger prompt generation.
- `switching_forces`: Compact push/pull/habit/anxiety summary.
- `journey_stage`: Primary AI-search journey stage.
- `problem_narrative`: Compact struggling-moment summary.
- `vocabulary_terms`: Words or phrases the persona may use in AI search.
- `alternatives_considered`: Direct competitor, existing SEO tool, agency/consultant, in-house manual research, spreadsheet/ad hoc prompt testing, do nothing, or wait and see.
- `prompt_angle`: Reusable testing direction for prompt generation.
- `risky_intent_detected`: `true` when the persona or query includes risky regulated/high-trust intent; otherwise `false`.
- `risky_intent_type`: Use values from `risky-intent-transformation.md` when relevant.
- `original_unsafe_intent`: Caution-marked original wording only. Do not use it directly as a prompt.
- `safe_transformed_prompt_angle`: Required when risky intent is transformed. The handoff `prompt_angle` must use this safe wording.
- `regulated_claim_risk`: `yes`, `no`, or `unclear`; use `yes` when the angle touches medical, legal, financial, hiring, real estate, security, safety, or outcome claims.
- `safe_prompt_language_required`: `true` when risky intent or regulated/high-trust caution applies.
- `sample_ai_questions`: 2 to 4 natural AI-search questions.
- `priority`: `high`, `medium`, or `low`.
- `confidence`: `high`, `medium`, or `low`.
- `icp_fit`: `likely_icp`, `possible_icp`, or `adjacent_segment` for normal handoff. Do not normal-handoff `anti_icp` or `not_enough_evidence`.
- `prompt_readiness`: `ready_for_prompt_design` or `usable_with_caution` for normal handoff. Do not normal-handoff `needs_more_evidence` or `do_not_handoff`.
- `readiness_reason`: Compact reason why the persona is ready or only usable with caution.
- `risk_flags`: Compact list of remaining persona risks, such as `role_needs_validation`, `generic_prompt_risk`, or `overclaim_risk`.
- `traceability_claim_ids`: Claim IDs from `evidence-to-persona-traceability.md` that support the persona and prompt angle.
- `research_sufficiency`: Gate value from `research-sufficiency-gate.md`.
- `validation_questions`: Compact validation questions from `persona-validation-plan.md`.
- `assumptions_to_validate`: Assumptions that could change the prompt angle or role classification.
- `confidence_upgrade_condition`: What evidence would raise confidence.
- `confidence_upgrade_needed`: Compact description of missing data needed to raise confidence.
- `questions_to_validate_before_prompt_design`: 1 to 3 research questions needed before stronger prompt design, especially for low-confidence or borderline personas.
- `needs_verification`: Specific missing evidence, customer data, or site page to verify.

When `regulated_or_high_trust_flag` is `yes` or `unclear` and the missing evidence is strong, do not use `ready_for_prompt_design`. Use `usable_with_caution` for limited, clearly caveated prompt design or `needs_more_evidence` when the persona should be held out. If `original_unsafe_intent` is present, mark it as caution-only and never use it directly as the prompt. The handoff `prompt_angle` must use `safe_transformed_prompt_angle`.

## Allowed Role Values

B2B:

- `decision_maker`
- `economic_buyer`
- `end_user`
- `evaluator`
- `technical_reviewer`
- `influencer`
- `agency_or_consultant`
- `blocker`

B2C:

- `purchaser`
- `user`
- `comparator`
- `recommender_influencer`
- `family_decision_maker`
- `repeat_user`

Marketplace or agency-support cases may use these values with side labels in the persona name or business model side column.

## Detailed Decision Role Mapping

Use `decision_role` for detailed roles and `role_type` for canonical downstream buckets. Do not put detailed roles such as `procurement`, `security_reviewer`, `local_comparator`, or `emergency_decider` into `role_type` unless they are allowed canonical values.

| detailed_decision_role | primary_role_type | fallback_role_type |
|---|---|---|
| `decision_maker` | `decision_maker` | `influencer` |
| `economic_buyer` | `economic_buyer` | `decision_maker` |
| `end_user` | `end_user` | `influencer` |
| `evaluator` | `evaluator` | `influencer` |
| `technical_reviewer` | `technical_reviewer` | `evaluator` |
| `procurement` | `economic_buyer` | `evaluator` |
| `legal_compliance` | `evaluator` | `blocker` |
| `security_reviewer` | `technical_reviewer` | `blocker` |
| `operations_manager` | `end_user` | `decision_maker` |
| `field_manager` | `end_user` | `influencer` |
| `finance_controller` | `economic_buyer` | `blocker` |
| `local_branch_manager` | `end_user` | `decision_maker` |
| `family_decision_maker` | `purchaser` | `recommender_influencer` |
| `caregiver` | `purchaser` | `recommender_influencer` |
| `gift_purchaser` | `purchaser` | `recommender_influencer` |
| `local_comparator` | `comparator` | `purchaser` |
| `emergency_decider` | `purchaser` | `comparator` |
| `repeat_buyer` | `repeat_user` | `purchaser` |
| `agency_or_consultant` | `agency_or_consultant` | `evaluator` |
| `client_side_evaluator` | `evaluator` | `decision_maker` |

Always include `role_mapping_reason` in the handoff row. When a detailed role maps to a different canonical role, explain why. When it is identical, use `same_as_decision_role`.

## Allowed Buyer Stage Values

Prefer values already compatible with `recora-prompt-topic-designer`:

- `awareness`
- `exploration`
- `comparison`
- `validation`
- `decision`

For `repeat_user`, usually use `validation` for renew/rebuy confidence checks or `decision` for final continued-use questions.

## Prompt Angle Requirements

A prompt angle is not a final prompt. It should tell `recora-prompt-topic-designer` what kind of prompts to create.

It must include:

- Persona context
- Trigger situation
- Search intent
- Comparison target or category
- Comparison axis
- Evidence or proof need

Good shape:

```md
Test prompts where [persona] is trying to [decision/job], compares [alternatives/categories], and looks for [proof/evidence] before [buying/adopting/renewing].
```

## Sample Handoff Row

This compact sample focuses on risky intent fields. In a full handoff, also include the complete required fields above.

| persona_id | role_type | detailed_decision_role | role_mapping_reason | buyer_stage | prompt_angle | prompt_readiness | confidence | risk_flags | needs_verification | risky_intent_detected | risky_intent_type | original_unsafe_intent | safe_transformed_prompt_angle | regulated_claim_risk | safe_prompt_language_required | handoff_decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BCL-1 | comparator | local_comparator | Local comparator maps to comparator because the user is comparing nearby clinics by trust, fee clarity, risk explanation, and aftercare before booking. | comparison | 美容医療を検討する前に、効果・リスク・副作用・個人差について一般的に確認すべき観点を整理する | usable_with_caution | medium | risky_intent_detected; regulated_claim_risk; medical_advice_risk; effect_guarantee_risk | Verify physician qualifications, consultation flow, fee scope, risk/side-effect explanation, review/case limitations, and aftercare evidence. | true | effect_guarantee_seeking | 効果が出る施術を知りたい | 美容医療を検討する前に、効果・リスク・副作用・個人差について一般的に確認すべき観点を整理する | yes | true | handoff_safe_transformed_angle_only |

`original_unsafe_intent` is for audit and caution only. Do not send it directly to `recora-prompt-topic-designer`. The `prompt_angle` must match the safe transformed wording in `safe_transformed_prompt_angle`.

## Handoff Blockers

Do not include a persona in normal prompt-design handoff when any of these apply:

- `icp_fit` is `anti_icp` or `not_enough_evidence`.
- `research_sufficiency` is `not_enough_to_use`.
- `prompt_readiness` is `needs_more_evidence` or `do_not_handoff`.
- Risky intent is present but `safe_transformed_prompt_angle`, `risk_flags`, or `needs_verification` is missing.
- `original_unsafe_intent` is being passed as the prompt angle, sample question, or uncautioned handoff wording.
- Required traceability claims have `inference_type` of `unsupported`.
- Business type or industry pattern is unsupported by observed evidence.
- Regulated or high-trust claims lack proof, qualification, review, fee, safety, process, or compliance evidence.
- `industry_category`, `industry_subtype`, `decision_unit_type`, `buyer_user_split`, `trust_signal_required`, `urgency_level`, `location_dependency`, or `evidence_needed_before_prompt_design` is missing for a persona where those factors affect the prompt angle.
- `ready_for_prompt_design` is used even though a regulated or high-trust persona still lacks strong evidence.
- The persona lacks `traceability_claim_ids`.
- The persona lacks validation questions for the assumptions behind the prompt angle.
- The persona lacks a validation plan or confidence-upgrade condition.
- Risk register has unresolved high `handoff_contamination_risk`, `no_prompt_angle_risk`, or `invented_persona_risk`.
- The prompt angle cannot connect persona context, search intent, alternatives, comparison criteria, and proof needs.
- `decision_role` and `role_type` are mixed, unmapped, or inconsistent with `role-mapping-contract.md`.

## Handoff Quality Checks

- Each persona has at least one distinct prompt angle.
- Sample questions are natural AI-search questions, not SEO keyword fragments.
- Prompt angles avoid guaranteed outcomes or predicted AI visibility.
- Prompt angles transformed from risky intent avoid direct advice, diagnosis, treatment recommendation, legal/financial outcome prediction, safety guarantee, or effect guarantee.
- `safe_prompt_language_required` is `true` whenever risky intent or regulated/high-trust caution applies.
- Persona IDs remain stable throughout the output.
- `needs_verification` is never empty when customer data is unavailable.
- `traceability_claim_ids` point to evidence or explicit research gaps in the traceability table.
- `prompt_readiness` is either `ready_for_prompt_design` or `usable_with_caution`.
- `readiness_reason` explains why the row is safe for prompt design.
- `risk_flags` are consistent with the Persona Risk Register.
- `business_type`, `industry_pattern`, `decision_role`, and `trust_requirement` match the Business Type Classification and relevant industry reference.
- `decision_role`, `role_type`, and `role_mapping_reason` match `role-mapping-contract.md`.
- `industry_category`, `industry_subtype`, `regulated_or_high_trust_flag`, `decision_unit_type`, `buyer_user_split`, `trust_signal_required`, `urgency_level`, `location_dependency`, and `evidence_needed_before_prompt_design` match the Persona Decision Table.
- `validation_questions`, `assumptions_to_validate`, and `confidence_upgrade_condition` match the Persona Validation Plan.
- `questions_to_validate_before_prompt_design` targets the assumptions behind the prompt angle.
- `confidence_upgrade_needed` matches the missing data in `persona-confidence-upgrade-data.md`.
- Handoff rows are consistent with the Persona Decision Table.
- Personas with high `exclusion_risk` are not handed off as normal diagnosis targets.
- `anti_icp`, `not_enough_evidence`, `unsupported`, `not_enough_to_use`, `needs_more_evidence`, and `do_not_handoff` candidates are not handed off as normal diagnosis targets.
- Switching forces, journey stage, problem narrative, vocabulary, and alternatives connect directly to `prompt_angle` and `sample_ai_questions`.
