# Persona Problem Narrative

Use this reference to describe personas as struggling moments, not titles.

Every included persona should be explainable as a short problem narrative.

## Required Fields

- `trying_to_accomplish`: What the persona is trying to get done.
- `current_blocker`: What blocks progress now.
- `why_it_matters`: Why the problem matters to the business, team, household, client, or buyer.
- `consequence_of_inaction`: What happens if they do nothing.
- `emotional_or_business_pressure`: Pressure from risk, urgency, leadership, clients, budget, reputation, or workload.
- `decision_context`: What decision they need to make and who else is involved.
- `what_success_looks_like`: What good outcome would look like.

## Narrative Shape

Use this shape:

```md
[Persona] is trying to [job], but [blocker]. This matters because [business or emotional pressure]. If nothing changes, [consequence]. They need to decide [decision context], and success looks like [outcome].
```

## Good Example

```md
An SEO lead is trying to understand whether AI-search diagnosis adds value beyond existing SEO audits, but current tools do not explain competitor mentions or citation quality in AI answers. This matters because leadership is asking whether AI search affects discovery and pipeline. If nothing changes, the team may keep producing generic SEO reports while competitors shape AI answer narratives. They need to decide whether to test a specialized diagnosis, and success looks like a credible report with prompt coverage, source evidence, and next actions.
```

## Bad Example

```md
SEO manager at a mid-sized company.
```

Why bad: It names a role but lacks struggling moment, blocker, stakes, pressure, decision context, and success criteria.

## Use In Recora

Problem narratives should feed:

- `prompt_angle`
- `sample_ai_questions`
- `objections_or_concerns`
- `what_they_need_to_see`
- `needs_verification`

If a candidate cannot be written as a problem narrative, mark it as `too_generic` or `no_observable_prompt_angle`.
