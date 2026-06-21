# Output Mode Contract

Use `output_mode` to control output size without weakening evidence discipline.

If the user specifies a mode, follow it. If not specified, infer the smallest mode that satisfies the task and state the mode used.

## Allowed Values

- `full`
- `excerpt`
- `handoff_only`
- `validation_only`

## Mode Requirements

| output_mode | Use when | Required sections | Do not omit |
|---|---|---|---|
| `full` | The user asks for complete persona discovery or a full Recora diagnosis prep artifact. | All default output sections from `SKILL.md`. | Research sufficiency, evidence traceability, readiness, risk register, needs verification, excluded personas, handoff. |
| `excerpt` | The user asks for a practical test, quick persona hypothesis, concise diagnosis prep, or a fixed 5-persona operational output. | Input Summary, Business Type Classification, Evidence Source Matrix, Persona Decision Table or 5 Persona Compact Table, Persona-to-Prompt Readiness, Handoff, Risk Flags, Needs Verification, Output Self-Check. | Role split, prompt angle, readiness, confidence, risk flags, excluded personas if relevant. |
| `handoff_only` | The user only needs rows for `recora-prompt-topic-designer`. | Handoff table plus compact assumptions and exclusions. | `role_mapping_reason`, `risk_flags`, `prompt_readiness`, `readiness_reason`, `confidence`, `needs_verification`, `traceability_claim_ids`, and `evidence_needed_before_prompt_design`. |
| `validation_only` | The user provides existing persona candidates and wants them judged. | Input Summary, candidate evaluation, Persona-to-Prompt Readiness, Risk Flags, Excluded / Unsupported Personas, Needs Verification. | Readiness decision, reason, risk flags, confidence, role mapping, and handoff decision. |

## Inference Rules

- Use `full` for final deliverables, audits, or comprehensive skill validation.
- Use `excerpt` for most operational Recora prep when the user asks for results but does not need every table.
- Use `handoff_only` only when persona candidates are already selected or the user explicitly asks for downstream handoff rows.
- Use `validation_only` only when evaluating supplied persona candidates instead of discovering new ones.
- Never use output mode to hide weak evidence, unsupported personas, high-trust cautions, or `needs_verification`.

## 5 Persona Compact Table

Use this template in `excerpt` mode when the user asks for exactly five persona candidates or when a practical test needs five concise rows per brand.

The compact table replaces long persona narratives, not evidence discipline.

| persona_id | persona_name | role_type | detailed_decision_role | buyer_stage | search_intent | comparison_axis | prompt_angle | prompt_readiness | confidence | risk_flags | needs_verification | risky_intent_detected | risky_intent_type | safe_transformed_prompt_angle | handoff_decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Required columns:

- `persona_id`
- `persona_name`
- `role_type`
- `detailed_decision_role`
- `buyer_stage`
- `search_intent`
- `comparison_axis`
- `prompt_angle`
- `prompt_readiness`
- `confidence`
- `risk_flags`
- `needs_verification`
- `risky_intent_detected`
- `risky_intent_type`
- `handoff_decision`

Required when risky intent is detected:

- `safe_transformed_prompt_angle`
- `regulated_claim_risk` in `risk_flags` when the category touches regulated, high-trust, safety, security, legal, financial, medical, hiring, real estate, or outcome claims.

May omit or shorten in the compact table:

- long persona narrative
- full switching forces
- full AI search journey
- full research questions
- detailed traceability notes

Must not omit:

- `risk_flags`
- `needs_verification`
- `prompt_readiness`
- `handoff_decision`
- `safe_transformed_prompt_angle` when `risky_intent_detected` is true

If a fifth persona is weak, include it only when it still has a distinct role, search intent, comparison axis, and prompt angle. Otherwise put it in Excluded / Unsupported Personas and state that fewer than five should be handed off.

## Mode Self-Check

Before finalizing, verify:

- The output uses the requested or inferred `output_mode`.
- Required sections for the selected mode are present.
- `handoff_only` still includes risk, readiness, confidence, and verification fields.
- `handoff_only` keeps detailed `decision_role`, canonical `role_type`, and `role_mapping_reason`.
- `validation_only` does not invent new validated personas from weak inputs.
- Excerpted outputs still separate buyer, user, comparator, influencer, blocker, and agency roles when relevant.
