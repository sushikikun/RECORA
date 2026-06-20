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
- End without `Handoff to recora-prompt-topic-designer`.
- Claim a persona will definitely search, buy, adopt, or recommend.

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

## Final QA Checklist

Before delivering, verify:

- The output includes all required sections.
- Every persona has a role type, buyer stage, pain, search intent, comparison target, comparison criteria, concern, required proof, prompt angle, sample questions, priority, confidence, and verification need.
- B2B role splits include `decision_maker`, `economic_buyer`, `end_user`, `evaluator`, `influencer`, and `agency_or_consultant`, or explain unsupported roles.
- B2C role splits include `purchaser`, `user`, `comparator`, `recommender_influencer`, and `repeat_user`, or explain unsupported roles.
- No persona is based only on demographics, company size, or job title.
- No site evidence is overstated as customer truth.
- No secret, credential, `.env`, API key, cookie, or app implementation file is touched.
