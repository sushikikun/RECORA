# Local / High-Trust Service Personas

Use this reference for clinics, professional services, schools, real estate, local stores, and high-ticket consultation services.

Local and high-trust services often convert only after trust is established. Persona discovery must include location, reputation, credentials, price clarity, consultation flow, urgency, and risk avoidance.

## Important Signals

- `location`
- `reputation`
- `reviews`
- `qualifications`
- `case_results`
- `price_transparency`
- `consultation_flow`
- `family_involvement`
- `urgency`
- `risk_avoidance`
- `trust_before_conversion`

## Output Table

```md
| persona_pattern | applies_to | search_intent | trust_requirement | likely_ai_questions | comparison_criteria | objections | evidence_needed | prompt_angle | cautions |
|---|---|---|---|---|---|---|---|---|---|
```

## Persona Patterns

| persona_pattern | applies_to | search_intent | trust_requirement | likely_ai_questions | comparison_criteria | objections | evidence_needed | prompt_angle | cautions |
|---|---|---|---|---|---|---|---|---|---|
| local comparator | clinic, professional service, school, real estate, local store | Compare nearby options and decide who to contact | location, reviews, credentials, availability | "Which [service] near [area] is trustworthy?"; "What should I compare before booking?" | proximity, reviews, price, staff, credentials, service scope | "Can I trust them?"; "Are fees clear?" | location pages, reviews, staff profile, price, consultation flow | Test prompts where a local comparator checks nearby options, reviews, price clarity, and trust proof. | Do not infer actual location need unless site/local context supports it. |
| anxious first-time user | clinic, legal/accounting, high-ticket consulting | Reduce uncertainty before first contact | explanations, safety, consultation flow, limitations | "What should I ask before the first consultation?"; "How do I know this provider is safe?" | process clarity, credentials, cost, risk, responsiveness | "Will I be pressured?"; "What if I choose wrong?" | FAQ, process page, credentials, disclaimers, fees | Test prompts where a first-time user checks consultation flow, qualifications, risks, and cost before contacting. | Avoid diagnosing medical/legal/financial needs. |
| family or sponsor decision maker | clinic, school, real estate, care-like service | Choose on behalf of someone else | safety, reputation, suitability, access | "How should I choose [service] for a family member/child?" | safety, reviews, outcomes, location, price, staff | "Will this be safe for them?"; "Will they accept/support it?" | reviews, staff, outcomes, family-facing explanation | Test prompts where a family sponsor compares trust, suitability, access, and risk before booking. | Do not infer vulnerable status without evidence. |
| urgent need searcher | clinic, legal, repair/local service, real estate timing | Find reliable help quickly | availability, contact clarity, emergency/urgent scope | "Where can I get [service] quickly and safely?"; "What should I check before urgent booking?" | speed, availability, location, trust, scope | "Can they handle my urgent case?"; "Will cost be unclear?" | hours, contact flow, service scope, urgent limitations | Test prompts where an urgent searcher balances speed, trust, and risk before contacting. | Do not promise availability or outcomes. |
| high-ticket evaluator | professional service, consulting, school, real estate | Avoid expensive mistake | proof, qualifications, case fit, fee transparency | "What proof should I check before paying for [service]?" | credentials, case results, price, process, alternatives | "Is the fee justified?"; "Will results match claims?" | fee model, case examples, credentials, methodology | Test prompts where a high-ticket evaluator compares proof, fee clarity, process, and alternatives. | Avoid outcome guarantees and overclaiming case results. |

## Trust Before Conversion Checklist

- Does the site show who provides the service?
- Does it show where, how, and when the service happens?
- Does it provide reviews, qualifications, process, or proof?
- Does it clarify price, fee range, or quote/consultation flow?
- Does it explain risk, limitation, cancellation, or first-contact expectations?
- Does the persona have a specific reason to use AI search before contacting?

## Local / Multi-Location Patterns

Use this table when location or service area affects who searches, who decides, or what proof is needed.

```md
| local_pattern | who_searches | who_decides | who_pays | location_modifier | review_and_reputation_need | price_transparency_need | trust_signal_needed | likely_ai_search_questions |
|---|---|---|---|---|---|---|---|---|
```

| local_pattern | who_searches | who_decides | who_pays | location_modifier | review_and_reputation_need | price_transparency_need | trust_signal_needed | likely_ai_search_questions |
|---|---|---|---|---|---|---|---|---|
| `single_location` | local_comparator, purchaser, user | purchaser/user or family_decision_maker | purchaser/family | neighborhood, nearest station, city | high; reviews and photos often carry trust | medium/high | staff, qualifications, reviews, access | "Which [service] near [area] is trustworthy?" |
| `multi_location` | local_comparator, repeat_user, branch customer | customer chooses location; HQ may manage brand | purchaser/user | city, branch, service area | high at location level, not only brand level | medium | location pages, branch reviews, staff, hours | "Which [brand] location is best for [need]?" |
| `franchise` | local customer, franchisee/operator, HQ evaluator | customer for service; HQ/franchisee for operations | customer or franchisee/HQ | branch, franchise area | high; brand and local reputation both matter | medium/high | brand standards, local reviews, operator info | "How do I compare [franchise/service] locations?" |
| `service_area_business` | local_comparator, emergency_decider | purchaser/user/family | purchaser/family | service area, travel radius, dispatch zone | high; reviews and coverage reduce risk | high for quotes/travel fees | service area, license/insurance, quote flow | "Who serves [area] for [urgent/service] and what should I check?" |
| `urgent_service` | emergency_decider, family_decision_maker | fastest trusted decider | purchaser/family | nearby, open now, same-day | very high; bad choice risk is salient | high | response scope, hours, reviews, limitations | "Who can help quickly with [problem] near me?" |
| `appointment_based_service` | purchaser/user, family_decision_maker | user/payer/family | purchaser/family | location, schedule, online/offline | medium/high | medium/high | booking flow, staff, cancellation, first visit | "What should I ask before booking [service]?" |
| `review_dependent_service` | comparator, recommender, repeat_user | purchaser/user | purchaser/user | local area or platform category | very high; review volume/quality shapes trust | medium | reviews, testimonials, response to complaints | "How reliable are reviews for [service] near me?" |

## Local Handoff Rules

- Add `location_dependency` when location, branch, service area, or urgency changes search intent.
- Add `urgency_level` when the user needs same-day, emergency, deadline-driven, or event-driven service.
- Add `trust_signal_required` before handoff when reviews, qualifications, license/insurance, staff, price, or consultation flow are central to conversion.
- If location, reviews, or service area are central but not observed, set `prompt_readiness` to `usable_with_caution` or `needs_more_evidence`.
