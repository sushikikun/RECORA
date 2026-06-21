# Persona Operating Contract

## Role Classification

For B2B, use these role labels exactly:

- `decision_maker`: Approves adoption, owns strategic fit, accepts business risk, or signs off.
- `economic_buyer`: Controls budget, ROI case, contract size, renewal, or procurement economics.
- `end_user`: Uses the product or service in daily work and feels workflow pain directly.
- `evaluator`: Compares options, validates vendor fit, runs trials, checks security/technical fit, or builds the shortlist.
- `technical_reviewer`: Checks security, data, integration, compliance, implementation, or operational risk.
- `influencer`: Shapes requirements, internal consensus, or category framing without final authority.
- `agency_or_consultant`: Advises, implements, audits, resells, or recommends on behalf of the customer.
- `blocker`: Raises risk, cost, compliance, disruption, or status-quo objections that may block adoption.

Always split B2B decision maker and end user. If the same person likely holds two roles, show two rows or state `same_person_possible` while keeping role-specific search intent separate.

For B2C, use these role labels exactly:

- `purchaser`: Pays, subscribes, orders, books, or chooses where money goes.
- `user`: Uses, consumes, attends, receives, or benefits from the product/service.
- `comparator`: Reads reviews, compares alternatives, checks price, quality, trust, or fit.
- `recommender_influencer`: Suggests, gifts, advises, reviews, influences, or socially validates the choice.
- `family_decision_maker`: Helps choose, pay, approve, or reduce risk for a family member or dependent.
- `repeat_user`: Returns, renews, replenishes, upgrades, or decides whether to keep using.

Always split B2C purchaser and user when they may differ, such as parent/child, buyer/gift recipient, family purchaser/patient, or owner/operator.

For marketplaces, split supply-side and demand-side personas. For agency-support targets, split the agency buyer, agency operator, client-side buyer, and client-side evaluator when relevant.

Use `references/role-mapping-contract.md` when producing tables or handoff rows. Keep `detailed_decision_role` as the canonical detailed role, treat `decision_role` as a legacy alias for the same value, keep `role_type` as the canonical downstream role bucket, and add `role_mapping_reason` when they differ.

## Persona Quality Bar

Each persona must include decision logic, not just demographics.

Every usable persona candidate must include:

- What role they play in adoption or purchase
- What moment triggers their search
- JTBD
- Trigger events
- Switching forces
- Problem narrative
- Search intent
- AI-search journey stage
- Desired outcomes
- Customer language / vocabulary
- AI-search question examples
- Alternatives they consider
- Comparison targets
- Comparison criteria
- Objections or anxieties
- Information they need before adoption or purchase
- Evidence they need to trust the brand
- Recora diagnosis prompt angle
- Business type and industry pattern
- Industry category and subtype
- Decision role separation
- Decision unit type and buyer/user split
- Location or region dependency and urgency level
- Trust requirements for local, sensitive, regulated, or high-ticket decisions
- Evidence needed before handoff
- Evidence traceability claim IDs
- ICP / Anti-ICP fit
- Research questions needed before stronger validation
- Data needed to upgrade confidence
- Persona validation plan
- Persona-to-prompt readiness
- Risk flags and mitigation
- Handoff fields for `recora-prompt-topic-designer`

Avoid shallow labels such as "20s women", "small businesses", "marketing teams", "founders", or "executives" unless connected to a concrete decision, workflow, pain, comparison axis, anxiety, and required proof.

Limit persona quantity. Prefer 3 to 7 diagnostically useful personas over a long list that cannot become distinct prompts.

## Persona Quality Scoring

Score every included or excluded candidate from 0 to 5 using `references/persona-quality-scoring.md`.

Required scoring dimensions:

- `decision_relevance`
- `search_likelihood`
- `comparison_value`
- `prompt_angle_value`
- `evidence_strength`
- `diagnosis_usefulness`
- `exclusion_risk`

Include a persona only when it can produce a specific AI-search prompt angle and a useful Recora diagnostic observation. Exclude or downgrade candidates with low `prompt_angle_value`, low `diagnosis_usefulness`, or high `exclusion_risk`.

Do not let high business importance override weak evidence. If a persona may matter strategically but lacks site or customer evidence, keep it low-confidence and mark `needs_customer_data`.

## Hypothesis Levels

Use these values exactly:

- `confirmed_from_site`: The site explicitly states the segment, use case, customer type, industry, CTA target, pricing motion, feature use, or proof signal.
- `inferred_from_site`: Multiple site signals reasonably imply the persona, but the site does not explicitly name it.
- `weak_hypothesis`: The persona follows from category knowledge or thin signals, but evidence is weak.
- `needs_customer_data`: The persona cannot be validated without CRM, analytics, sales notes, interviews, support logs, or real customer records.
- `not_supported`: The persona is tempting but not supported by supplied or inspected evidence. Put these in `Excluded / Unsupported Personas`.

Assign one primary hypothesis level to every persona and to every major evidence claim. Use lower confidence when customer data is absent.

## Research Sufficiency Gate

Use these gate values exactly:

- `site_only_hypothesis`: Based only on URL, site text, observed claims, public pages, or category inference.
- `enough_for_prompt_design`: Enough evidence to design Recora prompt angles, but not enough to call the persona validated.
- `needs_customer_interview`: Needs customer or prospect interviews to confirm pains, vocabulary, triggers, alternatives, or objections.
- `needs_sales_data`: Needs CRM, sales notes, deal loss reasons, pipeline data, or account-level buyer-role evidence.
- `needs_case_study_validation`: Needs case-study, testimonial, role/title, industry, or outcome validation.
- `not_enough_to_use`: Too little evidence to use safely in Recora diagnosis.

Do not call a persona `validated` unless there are at least 5 to 10 relevant research data points from customer interviews, sales notes, analytics, reviews, support logs, case studies, or comparable customer evidence.

Use frequency x intensity thinking for pains and trigger themes: repeated low-intensity issues may be useful for awareness prompts, while rare high-intensity issues may be useful for validation or decision prompts.

## Evidence Discipline

Never invent customer counts, revenue, market share, conversion impact, AI visibility, citations, rankings, implementation customers, industries, case studies, or real search behavior.

Never say a persona "will search" or "must be the main buyer." Say they "may search", "could evaluate", or "is a site-informed candidate."

When site evidence conflicts or is thin, explain the ambiguity and downgrade confidence.

## AI Search Prompt Angle Rules

For every persona, include at least one `AI Search Prompt Angle` that can be passed to `recora-prompt-topic-designer`.

Use this shape in the persona section:

```md
- angle_label:
- prompt_angle:
- trigger_events:
- switching_force_summary:
- ai_search_journey_stage:
- problem_narrative_summary:
- customer_language:
- sample_ai_questions:
  - "..."
  - "..."
- alternatives_they_consider:
- comparison_targets:
- comparison_axis:
- pre_purchase_information_needed:
- proof_needed:
```

Write `prompt_angle` as a reusable testing direction, not as one final prompt. It must include persona context, struggling moment, switching force, journey stage, vocabulary or question framing, alternatives considered, comparison need, and evidence need.

Good prompt angle:

```md
Test prompts where an operations manager compares tools for reducing manual reporting work, asks whether the brand fits a mid-sized team, and looks for proof such as integrations, workflow examples, pricing clarity, and case studies.
```

Bad prompt angle:

```md
Marketing manager prompt.
```
