# Regulated / Sensitive Industry Cautions

Use this reference for medical, healthcare, legal, financial, real estate, recruiting/HR, and other high-trust or regulated contexts.

Persona discovery can identify search behavior and information needs, but it must not make unsupported claims about diagnosis, legal outcomes, financial results, eligibility, employment outcomes, or user vulnerabilities.

## Sensitive Categories

- `medical_or_healthcare`
- `legal`
- `financial`
- `insurance`
- `real_estate`
- `recruiting_or_hr`
- `security`
- `public_sector`
- `regulated_or_high_trust`

## Caution Rules

- Do not assert that a user has a specific condition, legal problem, financial status, protected characteristic, or employment outcome unless explicitly supplied.
- Do not imply guaranteed treatment, case, financial, property, or hiring results.
- Do not treat reviews, testimonials, or one case as proof of typical outcome.
- Strengthen `needs_verification` for qualifications, licenses, safety, compliance, fees, and case results.
- Keep AI-search questions informational and comparison-oriented, not diagnostic or advisory.
- Use hypothesis language: "may compare", "could look for", "needs verification", "site-informed candidate".
- Do not assert diagnosis, cure, legal outcome, financial return, claim approval, employment outcome, security guarantee, safety guarantee, or public-sector compliance without evidence.
- Verify qualification, license, case result, review, price, risk explanation, and compliance evidence before raising confidence.
- When family or caregiver involvement is plausible, avoid sensitive inference unless the site explicitly supports that context.
- Do not use `high` confidence for regulated/high-trust personas without strong site proof and customer/research data.

## Required Caution Output

```md
| persona_id | regulated_or_sensitive_area | regulated_claim_risk | unsupported_attribute_risk | required_proof | safe_language | needs_verification |
|---|---|---|---|---|---|---|
```

## Safe AI Search Question Patterns

Prefer:

- "What should I compare before choosing a [provider/service]?"
- "What qualifications or proof should I check before contacting [provider]?"
- "What questions should I ask in an initial consultation?"
- "What are common costs, risks, or process steps to verify?"

Avoid:

- "What treatment/legal/financial decision should I make?"
- "Will this provider guarantee [outcome]?"
- "Which provider will cure/win/make money/get me hired?"
- Questions that infer sensitive traits not supported by evidence.

## Category-Specific Cautions

| category | common_overclaim | required_proof | handoff_rule |
|---|---|---|---|
| healthcare | diagnosis, cure, safety, treatment fit | qualification, scope, fee, consultation flow, safety explanation | Use comparison and verification prompts only. |
| legal | case outcome, legal advice, eligibility | license, scope, case examples, fee model, consultation process | Avoid legal advice prompts. |
| finance | return, saving, approval, suitability | license/disclosure, fee, risk explanation, product scope | Avoid financial recommendation or return claims. |
| insurance | claim approval, coverage certainty, premium promise | policy scope, disclosure, claim process, fee/premium explanation | Ask what to verify, not what will be approved. |
| real_estate | property value, investment return, legal certainty | listings, area data, fee/process, agent credentials | Avoid price/investment certainty. |
| recruiting | job placement, candidate quality guarantee, eligibility | process, role scope, compliance, case examples | Separate employer-side and candidate-side personas. |
| security | breach prevention, compliance guarantee, safety guarantee | certifications, security docs, DPA, uptime, architecture | Avoid claiming protection or compliance without evidence. |
| public_sector | procurement eligibility, policy impact, public outcome | procurement docs, accessibility, security, reporting, case proof | Keep prompts about verification and criteria. |

## Handoff Cautions

- Add `regulated_claim_risk` to `risk_flags` when a persona or prompt angle touches regulated outcomes.
- Add explicit `trust_requirement` and `needed_evidence` before handoff.
- Keep confidence low or medium unless customer/research data and site proof support the role and search behavior.
- Exclude personas that require private or sensitive attribute assumptions before prompt design.
- If regulated/high-trust and evidence is thin, set `prompt_readiness` to `usable_with_caution` or `needs_more_evidence`, not `ready_for_prompt_design`.
