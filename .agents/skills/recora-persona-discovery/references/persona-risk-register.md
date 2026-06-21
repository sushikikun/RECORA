# Persona Risk Register

Use this reference to detect persona risks before they contaminate Recora diagnosis prompts.

The goal is to keep weak personas from creating generic prompts, unsupported claims, or misleading downstream handoff.

## Risk Types

Track these risks:

- `invented_persona_risk`
- `overconfident_persona_risk`
- `generic_segment_risk`
- `role_confusion_risk`
- `no_search_intent_risk`
- `no_prompt_angle_risk`
- `unsupported_industry_risk`
- `duplicate_persona_risk`
- `wrong_buyer_stage_risk`
- `handoff_contamination_risk`
- `industry_mismatch_risk`
- `regulated_claim_risk`
- `local_trust_gap_risk`
- `location_dependency_gap`
- `decision_unit_confusion`
- `urgency_overclaim_risk`
- `evidence_needed_before_handoff_missing`

## Risk Levels

Use one:

- `low`: Risk is named and controlled.
- `medium`: Risk requires caveats or validation before stronger claims.
- `high`: Risk should block normal handoff unless mitigated.

## Risk Register Table

```md
| persona_id | risk_type | risk_level | risk_description | detection_rule | mitigation | output_language_to_use | when_to_exclude |
|---|---|---|---|---|---|---|---|
```

## Detection And Mitigation Guide

| risk_type | detection_rule | mitigation | output_language_to_use | when_to_exclude |
|---|---|---|---|---|
| invented_persona_risk | Persona has no site, supplied, or customer evidence. | Move to excluded list or mark `not_supported`. | "Not supported by observed evidence." | Exclude when no traceability claim can be made. |
| overconfident_persona_risk | Confidence is higher than evidence strength or research sufficiency. | Downgrade confidence and add validation plan. | "Site-informed hypothesis." | Exclude if confidence would mislead prompt design. |
| generic_segment_risk | Persona is only a job title, demographic, or company size. | Rewrite as struggling moment with trigger and decision context. | "Candidate role with unresolved problem..." | Exclude if no prompt angle emerges. |
| role_confusion_risk | B2B buyer, budget owner, user, evaluator, or blocker are merged. | Split roles or mark unsupported roles. | "Same person possible, but search intent differs." | Exclude merged row when it hides distinct prompt needs. |
| no_search_intent_risk | Persona has no natural AI-search question. | Add trigger, question, and proof need or exclude. | "No observable AI-search intent." | Exclude when AI search behavior is forced. |
| no_prompt_angle_risk | Prompt angle is missing, generic, or not diagnosis-ready. | Rebuild around situation, alternatives, criteria, proof. | "No usable prompt angle yet." | Exclude from normal handoff. |
| unsupported_industry_risk | Industry is inferred without page, case, testimonial, or supplied evidence. | Remove industry or mark as weak hypothesis. | "Industry not confirmed from site." | Exclude if industry drives the prompt angle. |
| duplicate_persona_risk | Two personas share role, trigger, alternatives, and prompt angle. | Merge or differentiate by role/stage. | "Merged due to overlapping prompt angle." | Exclude duplicate row. |
| wrong_buyer_stage_risk | Buyer stage does not match trigger or information need. | Reassign awareness/exploration/comparison/validation/decision. | "Buyer stage inferred and needs verification." | Exclude if stage mismatch makes prompt unusable. |
| handoff_contamination_risk | Excluded, unsupported, or not-ready persona reaches handoff. | Block normal handoff and move to validation backlog. | "Do not hand off until evidence improves." | Always exclude from normal handoff. |
| industry_mismatch_risk | Persona or prompt angle uses an industry pattern not supported by observed site evidence. | Re-route business type or move persona to excluded list. | "Industry pattern is not supported by observed evidence." | Exclude when the industry pattern drives the prompt angle. |
| regulated_claim_risk | Persona or prompt angle implies medical, legal, financial, hiring, real estate, safety, or outcome claims without proof. | Remove claim, lower confidence, add `needs_verification`, or exclude. | "Regulated/sensitive claim needs verification." | Exclude when safe prompt wording is not possible. |
| local_trust_gap_risk | Local/high-trust persona lacks location, reviews, qualifications, fee clarity, process, or reputation proof. | Add trust requirement and evidence needed, or hold from handoff. | "Local trust proof is missing." | Exclude when trust proof is central to the prompt angle but unsupported. |
| location_dependency_gap | Persona depends on local, regional, service-area, franchise, or multi-location behavior but the site evidence does not show location structure. | Mark `location_dependency` as `unclear`, lower prompt readiness, and add evidence needed. | "Location dependency needs verification." | Exclude when local availability or service area is central and unsupported. |
| decision_unit_confusion | B2B2C, franchise, marketplace, public/nonprofit, or multi-location roles are collapsed into one persona. | Split HQ/platform/local/supplier/end-customer roles, or hold unsupported sides. | "Decision unit is mixed and needs separation." | Exclude merged persona when it hides distinct buyer/user/comparator needs. |
| urgency_overclaim_risk | Persona assumes emergency, deadline, safety, or urgent purchase behavior without site or category evidence. | Downgrade urgency, mark as hypothesis, and require trigger proof. | "Urgency is inferred and needs verification." | Exclude when urgency is the only reason the prompt angle is useful. |
| evidence_needed_before_handoff_missing | Handoff lacks required missing-evidence notes for regulated, high-trust, local, or expanded-industry personas. | Add `evidence_needed_before_handoff` and align prompt readiness. | "Evidence needed before handoff is missing." | Exclude from handoff until required evidence fields are complete. |

## Risk Flags For Handoff

When a persona is handed off with caution, include compact `risk_flags` such as:

- `role_needs_validation`
- `vocabulary_needs_validation`
- `pricing_or_budget_unknown`
- `industry_not_confirmed`
- `case_study_missing`
- `overclaim_risk`
- `generic_prompt_risk`
- `industry_mismatch`
- `regulated_claim_risk`
- `local_trust_gap`
- `location_dependency_gap`
- `decision_unit_confusion`
- `urgency_overclaim_risk`
- `evidence_needed_before_handoff_missing`

Do not hand off personas with unresolved high `handoff_contamination_risk`.
