# Persona Switching Forces

Use Switching Forces to describe why a persona might move from the status quo to a new solution.

Do not use demographics as the main explanation. Start from the struggling moment, then explain what the persona would hire or fire.

## Required Fields

For every included persona, produce:

- `push_from_status_quo`: Dissatisfaction, risk, pressure, or limitation pushing them away from current behavior.
- `pull_toward_solution`: What makes the new solution attractive.
- `habit_holding_back`: Existing workflow, tool, vendor, belief, budget habit, or political constraint that keeps them where they are.
- `anxiety_or_switching_risk`: Fear or uncertainty about switching, buying, implementation, accuracy, support, budget, or internal approval.
- `hire_criteria`: What the persona would hire the solution to accomplish.
- `fire_criteria`: What would make them reject, delay, or replace the solution.
- `implication_for_ai_search_prompt`: How the forces should shape prompt angles and sample questions.

## Recora-Specific Examples

### Marketing / SEO evaluator

- `push_from_status_quo`: Existing SEO reports do not explain AI-search visibility or why competitors appear in AI answers.
- `pull_toward_solution`: A diagnosis promises structured prompts, competitor visibility checks, citation review, and actionable evidence gaps.
- `habit_holding_back`: Current SEO tools, manual prompt testing, and monthly reporting routines are already in place.
- `anxiety_or_switching_risk`: The category feels new; measurement may be unclear; recommendations may overlap with generic SEO.
- `hire_criteria`: Explain AI-search visibility gaps and produce evidence-backed next actions.
- `fire_criteria`: Generic advice, no source evidence, unclear prompt methodology, or no difference from existing SEO audit.
- `implication_for_ai_search_prompt`: Test prompts comparing AI-search diagnosis against SEO tools, manual research, and agency audits.

### Economic buyer

- `push_from_status_quo`: Budget owner sees competitors gaining visibility but lacks a clear case for new spend.
- `pull_toward_solution`: A concise diagnosis can support internal approval and prioritize action.
- `habit_holding_back`: Wait for the market to mature, continue current SEO/PR spend, or ask an existing agency.
- `anxiety_or_switching_risk`: Unclear ROI, quote-based pricing, category immaturity, or internal skepticism.
- `hire_criteria`: Show risk, opportunity, cost logic, and expected deliverables.
- `fire_criteria`: No sample report, vague scope, no pricing logic, or ungrounded visibility claims.
- `implication_for_ai_search_prompt`: Test prompts about budget justification, proof, pricing, and internal approval.

## Scoring Guidance

Strong switching forces improve:

- `search_likelihood`
- `comparison_value`
- `prompt_angle_value`
- `diagnosis_usefulness`

Weak or missing switching forces increase `exclusion_risk`.

If a persona has no clear push, pull, habit, or anxiety, it is probably too generic for Recora diagnosis.
