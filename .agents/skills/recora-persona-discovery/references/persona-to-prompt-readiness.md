# Persona To Prompt Readiness

Use this reference to decide whether a persona can be handed to `recora-prompt-topic-designer`.

Readiness is about prompt-design safety and usefulness. It is not proof that the persona is a validated customer segment.

## Readiness Values

Use exactly one:

- `ready_for_prompt_design`: The persona has clear search intent, trigger, comparison axis, evidence boundary, and a usable prompt angle.
- `usable_with_caution`: The persona can produce useful prompt angles, but evidence, role, vocabulary, or buying stage needs verification.
- `needs_more_evidence`: The persona is plausible, but missing evidence could materially change the prompt angle.
- `do_not_handoff`: The persona is too generic, unsupported, risky, or unable to produce useful Recora diagnosis prompts.

Do not normal-handoff `needs_more_evidence` or `do_not_handoff`.

## Readiness Axes

Assess each persona on:

- `clear_search_intent`
- `clear_trigger_event`
- `clear_comparison_axis`
- `observable_ai_answer_signal`
- `prompt_angle_quality`
- `evidence_strength`
- `risk_of_generic_prompt`
- `risk_of_overclaim`
- `industry_route_supported`
- `decision_unit_clarity`
- `trust_and_location_evidence`

## Axis Guidance

- `clear_search_intent`: The persona has a natural question they may ask an AI assistant.
- `clear_trigger_event`: A specific event explains why search begins now.
- `clear_comparison_axis`: The persona compares vendors, tools, agencies, DIY, status quo, price, proof, or risk.
- `observable_ai_answer_signal`: Recora could observe answer quality, competitor mentions, citations, objections, or missing proof.
- `prompt_angle_quality`: The prompt angle includes role, situation, vocabulary, alternatives, comparison need, and proof need.
- `evidence_strength`: Site or customer evidence supports the persona without overclaiming.
- `risk_of_generic_prompt`: The persona would not produce vague prompts such as "best marketing tool".
- `risk_of_overclaim`: The persona does not require unsupported claims about customer type, industry, or search behavior.
- `industry_route_supported`: Business type, industry category, and industry subtype are supported by observed signals or clearly labeled as weak hypotheses.
- `decision_unit_clarity`: Buyer, user, comparator, influencer, blocker, payer, HQ/local, platform/supplier, or family roles are separated when their search intent differs.
- `trust_and_location_evidence`: Local, high-trust, regulated, urgent, service-area, or multi-location assumptions have required trust signals and evidence gaps listed.

## Output Table

```md
| persona_id | prompt_readiness | readiness_reason | clear_search_intent | clear_trigger_event | clear_comparison_axis | observable_ai_answer_signal | prompt_angle_quality | evidence_strength | risk_of_generic_prompt | risk_of_overclaim | industry_route_supported | decision_unit_clarity | trust_and_location_evidence | handoff_decision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

## Handoff Rules

- Normal handoff is allowed for `ready_for_prompt_design`.
- Normal handoff is allowed for `usable_with_caution` only when caveats, validation questions, and confidence-upgrade conditions are included.
- `needs_more_evidence` belongs in verification planning, not prompt design handoff.
- `do_not_handoff` belongs in Excluded / Unsupported Personas or Anti-Personas.
- Never use readiness to upgrade confidence. Confidence still depends on evidence and research data.
- If a persona is regulated, high-trust, local, urgent, franchise, multi-location, public-sector, finance, healthcare, legal, security, or safety-sensitive and the proof gap is material, do not mark it `ready_for_prompt_design`. Use `usable_with_caution` or `needs_more_evidence`.
