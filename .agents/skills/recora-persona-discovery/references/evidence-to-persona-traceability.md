# Evidence To Persona Traceability

Use this reference to prevent unsupported persona claims.

Every important persona inference should trace back to site evidence, supplied evidence, or an explicit research gap.

## Required Table

```md
| claim_id | site_evidence | evidence_source | inferred_persona | inference_type | confidence_impact | risk_of_overreach | verification_needed |
|---|---|---|---|---|---|---|---|
```

## Inference Types

Use these values exactly:

- `direct_site_claim`: The site directly states the role, segment, industry, use case, CTA target, or proof point.
- `natural_inference`: Multiple site signals make the inference reasonable, but the site does not explicitly state it.
- `weak_market_inference`: The inference follows from market context or category patterns, but site support is weak.
- `unsupported`: The inference is not supported by inspected or supplied evidence.
- `needs_customer_data`: The inference requires interviews, CRM, sales notes, support logs, reviews, analytics, or case-study validation.

## Confidence Impact

- `raises_confidence`: Direct or repeated evidence supports the persona.
- `keeps_medium`: Evidence is plausible but still partly inferred.
- `keeps_low`: Evidence is thin, indirect, or site-only.
- `blocks_handoff`: Evidence is unsupported or too risky for prompt design.

## Overreach Risks

Common risks:

- Treating a CTA audience as a real customer segment.
- Treating one case study as the main customer profile.
- Inferring budget owner from feature copy alone.
- Inferring industry without explicit industry signal.
- Treating a site-only persona as validated.
- Handing off a persona with no observable AI-search prompt angle.

## Use Rules

- Include claim IDs in handoff when a persona is used for prompt design.
- Do not hand off unsupported claims as normal diagnosis targets.
- Put unsupported or high-risk in `Excluded / Unsupported Personas` or `Anti-Personas`.
- Use traceability gaps to populate `Data Needed to Upgrade Confidence`.
