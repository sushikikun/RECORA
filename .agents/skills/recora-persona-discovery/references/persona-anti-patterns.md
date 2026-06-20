# Persona Anti-Patterns

Use this before finalizing a Recora persona discovery output.

## Hard Failures

Do not:

- Call a persona a "main customer" or "primary customer" without real customer data.
- Invent customer industries, logos, case studies, adoption examples, or implementation targets not present in site evidence.
- Generate many vague personas that cannot become distinct Recora diagnosis prompts.
- Merge B2B decision maker and end user into one persona when their search intent differs.
- Merge B2C purchaser and user when they may be different people.
- End without a `prompt_angle` for every included persona.
- Include a persona with low `prompt_angle_value` or low `diagnosis_usefulness`.
- Hand off an excluded persona to `recora-prompt-topic-designer` as if it were valid.
- End without `Handoff to recora-prompt-topic-designer`.
- Claim a persona will definitely search, buy, adopt, or recommend.
- Treat a site-only proto-persona as validated.
- Skip trigger events, customer vocabulary, or alternatives.
- Skip switching forces, AI-search journey stage, or problem narrative.
- Handoff a persona whose vocabulary does not appear in prompt angle or sample questions.
- Use `high` confidence when evidence is only site-only or category-level.
- End without research questions that validate the persona assumptions.
- End without evidence-to-persona traceability for included personas.
- End without an ICP / Anti-ICP fit decision.
- End without data needed to upgrade low or medium confidence.
- Hand off `anti_icp`, `not_enough_evidence`, `unsupported`, or `not_enough_to_use` personas as normal diagnosis targets.
- Call URL-only or public-site-only evidence a validated persona.

## Shallow Persona Examples

These are not enough:

- "20s women"
- "small businesses"
- "marketers"
- "executives"
- "busy parents"
- "enterprise companies"
- "people comparing products"

Rewrite them into decision-useful personas:

- "Budget-owning marketing leader comparing whether a tool can reduce reporting work before approving a subscription."
- "Hands-on operator who needs to know whether the product fits their daily workflow and existing tools."
- "Comparison shopper checking price, trust, reviews, alternatives, and post-purchase risk before buying."

## Unsupported Persona Handling

If a persona seems plausible but lacks evidence:

1. Put it in `Excluded / Unsupported Personas`.
2. Explain why it was considered.
3. Mark the reason as `not_supported` or `needs_customer_data`.
4. State what evidence would make it usable.

Do not silently include unsupported personas in the main handoff.

## Anti-Persona Reasons

Use these reasons when excluding candidates from Recora diagnosis:

- `no AI-search intent`
- `no buying influence`
- `too generic`
- `duplicate segment`
- `no observable prompt angle`
- `unsupported by site evidence`
- `anti_icp`
- `not_enough_evidence`
- `unsupported`
- `requires customer interview first`

## Output Self-Check

Before finalizing, verify:

- Each included persona has switching forces.
- Each included persona has an AI-search journey stage.
- Each included persona has a problem narrative.
- Vocabulary connects to prompt angle and sample questions.
- Each included persona has validation questions.
- Each included persona appears in the evidence-to-persona traceability table.
- Each included persona has traceability claim IDs in handoff.
- Each included persona has an ICP / Anti-ICP fit decision.
- Low and medium confidence personas list the data needed to upgrade confidence.
- Validated persona and hypothesis are not mixed.
- URL-only or public-site-only outputs are not called validated personas.
- `no observable prompt angle` candidates are excluded from normal handoff.
- `anti_icp`, `not_enough_evidence`, `unsupported`, and `not_enough_to_use` candidates are excluded from normal handoff.
- Confidence is not higher than evidence strength supports.

## Final QA Checklist

Before delivering, verify:

- The output includes all required sections.
- Every persona has a role type, buyer stage, pain, search intent, comparison target, comparison criteria, concern, required proof, prompt angle, sample questions, priority, confidence, and verification need.
- Every persona has switching forces, journey stage, problem narrative, vocabulary, and alternatives.
- B2B role splits include `decision_maker`, `economic_buyer`, `end_user`, `evaluator`, `influencer`, and `agency_or_consultant`, or explain unsupported roles.
- B2C role splits include `purchaser`, `user`, `comparator`, `recommender_influencer`, and `repeat_user`, or explain unsupported roles.
- No persona is based only on demographics, company size, or job title.
- No site evidence is overstated as customer truth.
- Evidence-to-persona traceability exists for every included persona.
- Research questions exist for each included persona and validate pains, triggers, alternatives, vocabulary, objections, and buying influence.
- ICP / Anti-ICP fit is stated before handoff.
- Confidence upgrade data is listed for low and medium confidence personas.
- Normal handoff excludes `anti_icp`, `not_enough_evidence`, `unsupported`, and `not_enough_to_use` candidates.
- No secret, credential, `.env`, API key, cookie, or app implementation file is touched.
