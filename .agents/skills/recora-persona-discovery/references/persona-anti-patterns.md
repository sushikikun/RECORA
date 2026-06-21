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
- End without a Persona Validation Plan.
- End without Persona-to-Prompt Readiness.
- End without a Persona Risk Register.
- Hand off `anti_icp`, `not_enough_evidence`, `unsupported`, or `not_enough_to_use` personas as normal diagnosis targets.
- Hand off `needs_more_evidence` or `do_not_handoff` personas as normal diagnosis targets.
- Call URL-only or public-site-only evidence a validated persona.
- Treat golden test cases as real customer evidence.
- Route to an industry pattern without site evidence.
- End without industry category, industry subtype, decision unit type, buyer/user split, location or region dependency, urgency level, trust signal requirement, and evidence needed before handoff when those factors affect the prompt angle.
- Create industry personas only from titles, such as "patient", "student", "buyer", "HR", or "local resident".
- Merge BtoC purchaser and user in clinic, school, real estate, EC, or family-involved decisions.
- Merge marketplace supply-side and demand-side personas.
- Merge BtoB2C, franchise, multi-location, public/nonprofit, or platform/local/end-customer decision units into one generic persona.
- Ignore location, reviews, qualifications, fee clarity, consultation flow, or reputation for local/high-trust services.
- Make medical, legal, financial, real estate, hiring, safety, or outcome claims without evidence.
- Mark regulated, security, finance, healthcare, legal, public-sector, or other high-trust personas `ready_for_prompt_design` when required trust evidence is missing.
- Treat urgent-service, emergency, family/caregiver, or local comparison behavior as confirmed without site evidence or a clear category signal.

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
- `needs_more_evidence`
- `do_not_handoff`
- `unsupported`
- `industry_mismatch`
- `regulated_claim_risk`
- `local_trust_gap`
- `location_dependency_gap`
- `decision_unit_confusion`
- `urgency_overclaim_risk`
- `evidence_needed_before_handoff_missing`
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
- Each included persona has a Persona Validation Plan entry.
- Each included persona has Persona-to-Prompt Readiness.
- Each included persona has a Persona Risk Register entry or explicit low-risk note.
- Business type and industry pattern are supported by observed evidence.
- Industry category, industry subtype, decision unit type, buyer/user split, location dependency, urgency level, trust signal requirement, and evidence needed before handoff are present when they affect the prompt angle.
- BtoB, BtoC, marketplace, agency, local, and high-trust roles are split correctly.
- BtoB2C, franchise, multi-location, public/nonprofit, platform, supplier, HQ, local branch, and end-customer roles are split when relevant.
- Local/high-trust personas include trust requirements.
- Regulated/sensitive personas avoid unsupported claims and strengthen verification.
- Low and medium confidence personas list the data needed to upgrade confidence.
- Validated persona and hypothesis are not mixed.
- URL-only or public-site-only outputs are not called validated personas.
- `no observable prompt angle` candidates are excluded from normal handoff.
- `anti_icp`, `not_enough_evidence`, `unsupported`, and `not_enough_to_use` candidates are excluded from normal handoff.
- `needs_more_evidence` and `do_not_handoff` candidates are excluded from normal handoff.
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
- Persona Validation Plan is present before handoff.
- Persona-to-Prompt Readiness is present before handoff.
- Persona Risk Register is present before handoff.
- Confidence upgrade data is listed for low and medium confidence personas.
- Business Type Classification is present before handoff.
- Handoff includes `business_type`, `industry_pattern`, `decision_role`, and `trust_requirement`.
- Handoff includes `industry_category`, `industry_subtype`, `regulated_or_high_trust_flag`, `decision_unit_type`, `buyer_user_split`, `trust_signal_required`, `urgency_level`, `location_dependency`, and `evidence_needed_before_prompt_design` when relevant.
- Excluded / Unsupported Personas includes `industry_mismatch` and `regulated_claim_risk` when relevant.
- Excluded / Unsupported Personas includes `location_dependency_gap`, `decision_unit_confusion`, `urgency_overclaim_risk`, and `evidence_needed_before_handoff_missing` when relevant.
- Normal handoff excludes `anti_icp`, `not_enough_evidence`, `unsupported`, and `not_enough_to_use` candidates.
- Normal handoff excludes `needs_more_evidence` and `do_not_handoff` candidates.
- Golden test cases are used only for calibration, not as evidence of real customer behavior.
- No secret, credential, `.env`, API key, cookie, or app implementation file is touched.
