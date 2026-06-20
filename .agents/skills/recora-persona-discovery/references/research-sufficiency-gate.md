# Research Sufficiency Gate

Use this gate to separate proto-personas from validated personas.

URL and public site evidence can support Recora prompt design, but it does not validate real customer personas by itself.

## Gate Values

Use these values exactly:

- `site_only_hypothesis`: Evidence comes from public pages, supplied site text, observed claims, category assumptions, or URL/brand context only.
- `enough_for_prompt_design`: Evidence is sufficient to design Recora diagnostic prompt angles, but not enough to call the persona validated.
- `needs_customer_interview`: Interviews are needed to confirm trigger events, pains, vocabulary, alternatives, objections, or desired outcomes.
- `needs_sales_data`: Sales notes, CRM fields, deal stage, lost reasons, pipeline data, procurement notes, or buyer-role evidence are needed.
- `needs_case_study_validation`: Case-study, testimonial, role/title, industry, outcome, or proof validation is needed.
- `not_enough_to_use`: The candidate should not be used in Recora diagnosis because evidence, search intent, or prompt angle is too weak.

## Validated Persona Rule

Do not call a persona validated unless there are at least 5 to 10 relevant data points from customer research, sales data, support logs, reviews, analytics, interviews, case studies, or similar customer evidence.

Examples of usable data points:

- Interview quote from a buyer, user, evaluator, or influencer
- Sales note naming role, objection, alternative, or trigger
- CRM field showing industry, company size, role, or buying stage
- Case study naming role/title, use case, outcome, or internal approval need
- Testimonial naming pain, desired outcome, or proof
- Review mentioning alternatives, complaints, vocabulary, or purchase criteria
- Support ticket showing onboarding, pricing, trust, or workflow concerns
- Analytics or search query showing repeated intent

## Theme Strength

Use frequency x intensity:

- High frequency + high intensity: strong candidate for prompt design and customer validation.
- High frequency + low intensity: useful for awareness and educational prompts.
- Low frequency + high intensity: useful for validation, procurement, risk, or objection prompts.
- Low frequency + low intensity: usually exclude unless strategically important and clearly labeled.

## Gate Output

Use this table:

```md
| Gate value | Applies? | Reason | Required next evidence |
|---|---|---|---|
| site_only_hypothesis | yes/no | | |
| enough_for_prompt_design | yes/no | | |
| needs_customer_interview | yes/no | | |
| needs_sales_data | yes/no | | |
| needs_case_study_validation | yes/no | | |
| not_enough_to_use | yes/no | | |
```

If more than one gate applies, choose the strongest blocking gate as the primary status and list the others as supporting gaps.
