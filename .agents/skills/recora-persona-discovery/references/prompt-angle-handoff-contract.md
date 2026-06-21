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

When `regulated_or_high_trust_flag` is `yes` or `unclear` and the missing evidence is strong, do not use `ready_for_prompt_design`. Use `usable_with_caution` for limited, clearly caveated prompt design or `needs_more_evidence` when the persona should be held out.

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

```md
| persona_id | business_type | industry_category | industry_subtype | industry_pattern | regulated_or_high_trust_flag | decision_unit_type | decision_role | role_type | role_mapping_reason | buyer_user_split | buyer_stage | pain | trust_requirement | trust_signal_required | urgency_level | location_dependency | evidence_needed_before_prompt_design | switching_forces | journey_stage | problem_narrative | vocabulary_terms | alternatives_considered | prompt_angle | sample_ai_questions | priority | confidence | icp_fit | prompt_readiness | readiness_reason | risk_flags | traceability_claim_ids | research_sufficiency | validation_questions | assumptions_to_validate | confidence_upgrade_condition | confidence_upgrade_needed | questions_to_validate_before_prompt_design | needs_verification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | b2b_saas | enterprise_it_or_security | security-review-heavy SaaS | BtoB SaaS | yes | enterprise buying committee | security_reviewer | technical_reviewer | Security reviewer maps directly to technical reviewer because security approval checks technical/vendor risk. | Economic buyer, security reviewer, and end user have different questions. | comparison | Needs to reduce vendor risk before recommending a tool. | Security docs, integration proof, DPA, case studies, and pricing clarity. | SOC2, SSO, DPA, uptime, and implementation proof. | medium | none | Verify security documentation, integration evidence, and case proof before stronger prompt design. | Push: current reporting is unclear; Pull: clearer evidence; Habit: existing SEO tools; Anxiety: security risk. | comparison | Security reviewer must assess adoption risk but lacks proof that the vendor meets internal controls. | "security review"; "DPA"; "SSO"; "vendor risk" | direct competitor; existing SEO tool; internal research; do nothing | Test prompts where a security reviewer compares category alternatives, asks what risk criteria matter, and looks for proof such as security docs, integrations, pricing clarity, implementation examples, and case studies. | "What should security reviewers check before choosing a [category] tool?"; "Which [category] tools support SSO and security review?"; "What vendor risks should we check before adopting [category] software?" | high | medium | possible_icp | usable_with_caution | Clear comparison intent, but the actual security-review role needs customer validation. | role_needs_validation; regulated_claim_risk; security_evidence_needed | C1; C3; C5 | enough_for_prompt_design | "What triggered the security review?"; "Which alternatives were compared?"; "What proof was required before recommendation?" | Security reviewer role, budget influence, actual vocabulary. | Sales notes or interviews confirm role, trigger, alternatives, and proof needs. | Needs sales notes or interviews proving reviewer role, budget influence, and actual vocabulary. | "What triggered the security review?"; "Which alternatives were compared?"; "What proof was required before recommendation?" | Verify actual reviewer role from sales notes or customer interviews. |
```

## Handoff Blockers

Do not include a persona in normal prompt-design handoff when any of these apply:

- `icp_fit` is `anti_icp` or `not_enough_evidence`.
- `research_sufficiency` is `not_enough_to_use`.
- `prompt_readiness` is `needs_more_evidence` or `do_not_handoff`.
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
