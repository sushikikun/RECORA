# Persona Research Question Generator

Use this reference to turn persona hypotheses into validation questions.

These questions are for research planning. They do not validate the persona by themselves.

## Required Question Groups

For each included persona, generate questions in these groups:

- `pain_validation_questions`
- `trigger_event_questions`
- `current_alternative_questions`
- `comparison_criteria_questions`
- `budget_approval_questions`
- `evidence_needed_questions`
- `ai_search_behavior_questions`
- `vocabulary_phrasing_questions`
- `objection_discovery_questions`

## Question Design Rules

Good questions should:

- Ask about real past behavior, not imaginary future preference.
- Capture the first moment the problem became noticeable.
- Identify current alternatives such as tools, agencies, manual work, spreadsheets, or doing nothing.
- Reveal comparison criteria, budget ownership, approval process, and proof needs.
- Surface the exact language the person would use in AI search.
- Avoid leading the respondent toward Recora or any preferred answer.

Avoid:

- "Would you use this product?"
- "Do you like AI search diagnosis?"
- "Would Recora solve this?"
- Questions that teach the respondent the desired vocabulary.

## Question Templates

### pain_validation_questions

- "When did this problem first become noticeable?"
- "What made the problem feel worth paying attention to?"
- "What happens if this problem stays unresolved?"
- "How often does this problem come up, and how disruptive is it?"

### trigger_event_questions

- "What event would make you start researching this category?"
- "Who or what usually triggers the need for a comparison or diagnosis?"
- "What deadline, meeting, report, or internal request would make this urgent?"

### current_alternative_questions

- "What do you use today instead of a dedicated solution?"
- "Do you rely on an SEO tool, agency, manual prompt testing, spreadsheet, or internal research?"
- "What would make you keep doing nothing or wait?"

### comparison_criteria_questions

- "What information matters most when comparing options?"
- "Which risks would make you reject a vendor, tool, or service?"
- "What proof would you need before putting an option on a shortlist?"

### budget_approval_questions

- "Who would need to approve the budget?"
- "What would you need to explain in an internal approval request?"
- "What price, scope, or timing concerns would block adoption?"

### evidence_needed_questions

- "What evidence would make the diagnosis credible?"
- "Would you need case studies, sample reports, methodology, pricing, support details, or source/citation evidence?"
- "What claims would feel unsupported?"

### ai_search_behavior_questions

- "If you asked an AI assistant about this category, what would you ask?"
- "Would you search for vendors, methods, examples, pricing, risks, or comparisons?"
- "What would you expect the answer to include before trusting it?"

### vocabulary_phrasing_questions

- "What words would you use to describe this problem?"
- "Which terms feel natural: AI search visibility, GEO, AIO, LLMO, AI citations, AI Overviews, or something else?"
- "What terms would sound like vendor jargon?"

### objection_discovery_questions

- "What would make you skeptical of this category?"
- "What concerns would a boss, finance owner, client, or technical reviewer raise?"
- "What would make you delay, reject, or continue with the current workflow?"

## Output Format

```md
| persona_id | question_group | question | validates | why_it_matters |
|---|---|---|---|---|
```

Use questions to identify the data needed before upgrading confidence.
