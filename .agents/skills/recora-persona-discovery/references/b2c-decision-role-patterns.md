# BtoC Decision Role Patterns

Use this reference when the business type is BtoC, local, healthcare, education, EC, real estate consumer-side, or mixed.

Always separate purchaser and user when they may differ.

## Output Table

```md
| decision_role | search_intent | concern | comparison_axis | trust_signal | likely_ai_questions | prompt_angle | handoff_priority |
|---|---|---|---|---|---|---|---|
```

## Role Patterns

| decision_role | search_intent | concern | comparison_axis | trust_signal | likely_ai_questions | prompt_angle | handoff_priority |
|---|---|---|---|---|---|---|---|
| `purchaser` | Decide whether to pay, book, subscribe, or order | price, risk, value, guarantee, payment friction | price, value, reviews, return/cancel policy, trust | pricing, reviews, guarantees, clear flow | "Is [product/service] worth the price?"; "What should I compare before buying?" | Test prompts where a payer compares price, trust, alternatives, and risk before purchase. | high |
| `user` | Decide whether the product/service fits their need | usability, comfort, outcome, fit, safety | fit, ease, outcome, support, quality | usage examples, reviews, explanations, support | "Will [product/service] fit my situation?"; "What should I know before using it?" | Test prompts where a user checks fit, quality, and post-purchase risk. | high when user differs from purchaser |
| `comparator` | Compare options before choosing | uncertainty, trust, option overload | alternatives, reviews, features, location, availability | comparison content, reviews, credentials | "Which [category] is best for [need]?"; "What are alternatives to [brand/category]?" | Test prompts where a comparator asks AI to compare options and evidence before deciding. | high |
| `recommender_influencer` | Suggest or validate for someone else | reputation risk, trust, suitability | proof, reviews, word-of-mouth, safety | testimonials, credentials, social proof | "What should I recommend for someone who needs [need]?" | Test prompts where a recommender looks for credible proof and suitability before suggesting. | medium |
| `family_decision_maker` | Help choose for family member or dependent | safety, cost, emotional risk, urgency | trust, location, qualifications, reviews, price | credentials, reviews, consultation flow, safety info | "How should I choose [service] for my family member?" | Test prompts where a family decision maker compares trust, access, and safety before booking. | high for healthcare, education, local trust |
| `repeat_user` | Decide whether to continue, repurchase, renew, or return | continued value, quality consistency, support | renewal value, refill/rebuy, loyalty, support | service history, reviews, guarantee, support | "Is it worth continuing with [brand/category]?"; "What alternatives should I consider now?" | Test prompts where a repeat user compares continued value, alternatives, and switching risk. | medium/high when repeat use is explicit |
| `caregiver` | Choose or support care/service for another person | safety, suitability, communication, access | trust, qualifications, reviews, process, urgency | credentials, staff, process, reviews, safety explanation | "What should I check before choosing [service] for someone I care for?" | Test prompts where a caregiver compares safety, suitability, access, and proof before contacting. | high for healthcare, education, elder/child services |
| `gift_purchaser` | Buy for someone else | recipient fit, delivery, return risk, social proof | recipient preferences, price, shipping, reviews, return policy | reviews, product details, gift options, return policy | "What should I buy for someone who needs/likes [need]?" | Test prompts where a gift purchaser compares recipient fit, delivery, reviews, and return risk. | medium/high for EC, food, beauty, experiences |
| `emergency_decider` | Make a fast but safe decision | urgency, availability, cost uncertainty, trust | response speed, location, reputation, scope, price | emergency flow, hours, phone/contact, reviews, license/insurance | "Who can help with [urgent need] near me and what should I verify?" | Test prompts where an emergency decider balances speed, trust, cost, and risk. | high for home service, healthcare access, automotive repair |
| `repeat_buyer` | Repurchase, renew, refill, or switch | value consistency, price increase, quality change | loyalty value, subscription/renewal, alternatives, support | renewal terms, reviews, support, quality proof | "Is it worth buying/renewing [category] again?" | Test prompts where a repeat buyer compares continued value, alternatives, and switching risk. | medium/high for subscription, EC, beauty, food |
| `local_comparator` | Compare nearby providers or locations | trust, distance, reviews, availability, price | location, reviews, hours, price, credentials | local pages, map/reviews, staff, price, booking flow | "Which [service] near [area] is best for [need]?" | Test prompts where a local comparator checks nearby options, reviews, availability, price, and trust. | high for local/multi-location services |

## Rules

- Do not use only age, gender, or lifestyle as a persona.
- Split gift buyer, recipient, guardian, patient, learner, renter, or family sponsor when evidence suggests different search intent.
- In sensitive categories, avoid inferring private conditions or vulnerabilities without evidence.
- For urgent or emergency contexts, include speed and availability but do not promise response, safety, diagnosis, repair, or outcome.
- For local/multi-location services, include location dependency, review/reputation need, and price transparency when supported.
