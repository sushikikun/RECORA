# Persona Confidence Upgrade Data

Use this reference to explain what data would raise a low or medium confidence persona.

Do not raise confidence just because a persona seems strategically important.

## Data Types

Useful data sources:

- `customer_interview`
- `sales_call_notes`
- `inquiry_form_data`
- `crm_or_lead_source`
- `case_studies`
- `pricing_plan_selection`
- `support_tickets`
- `search_query_logs`
- `ai_search_prompt_logs`
- `win_loss_notes`
- `agency_partner_feedback`

## Required Output

```md
| persona_id | current_confidence | missing_data | why_it_matters | how_to_collect | confidence_upgrade_condition |
|---|---|---|---|---|---|
```

## Upgrade Conditions

Examples:

- Upgrade from `low` to `medium` when multiple site signals plus at least one external or customer signal support the role, trigger, vocabulary, or alternative.
- Upgrade from `medium` to `high` only when 5 to 10 relevant data points support pain, trigger, alternatives, decision role, and vocabulary.
- Keep `low` when evidence is URL-only, category-level, or unsupported.
- Keep `medium` when evidence supports prompt design but not real customer validation.

## Collection Guidance

- Use interviews to validate pains, triggers, vocabulary, alternatives, and objections.
- Use sales notes and CRM to validate decision role, budget, approval, and segment fit.
- Use inquiry forms and lead sources to validate search intent and trigger events.
- Use case studies and testimonials to validate role/title, industry, problem, outcome, and proof needs.
- Use support tickets to validate onboarding, risk, pricing, implementation, and support concerns.
- Use AI-search prompt logs to validate natural-language questions and prompt categories.

If the data is not available, mark `needs_customer_interview`, `needs_sales_data`, or `needs_case_study_validation`.
