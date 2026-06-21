# Business Type Router

Use this router before building persona candidates. It decides which role split, evidence standard, and handoff cautions apply.

Do not force one business type when the site is mixed. Use `primary_business_type` and optional `secondary_business_types`.

## Business Type Values

Use these values:

- `b2b_saas`
- `b2b_service`
- `b2c_ecommerce`
- `b2c_local_service`
- `clinic_or_healthcare`
- `professional_service`
- `school_or_education`
- `real_estate`
- `recruiting_or_hr`
- `marketplace`
- `agency_or_consulting`
- `media_or_directory`
- `regulated_or_high_trust`
- `manufacturing_or_industrial`
- `construction_or_field_service`
- `logistics_or_supply_chain`
- `finance_or_insurance`
- `hospitality_restaurant_tourism`
- `beauty_wellness`
- `home_service`
- `automotive`
- `public_sector_nonprofit`
- `enterprise_it_security`
- `franchise_multi_location`
- `subscription_membership`

## Router Output

```md
| business_type | applies? | observed_signals | likely_decision_roles | likely_user_roles | likely_comparison_roles | likely_influencers | search_intent_patterns | AI_search_question_patterns | evidence_needed | common_false_personas | handoff_cautions |
|---|---|---|---|---|---|---|---|---|---|---|---|
```

For expanded industry routing, also output:

```md
| business_type | routing_signals_from_site | required_role_splits | high_trust_or_regulated_flag | likely_prompt_angle_types | evidence_needed_before_handoff |
|---|---|---|---|---|---|
```

## Routing Patterns

| business_type | likely_decision_roles | likely_user_roles | likely_comparison_roles | likely_influencers | search_intent_patterns | AI_search_question_patterns | evidence_needed | common_false_personas | handoff_cautions |
|---|---|---|---|---|---|---|---|---|---|
| `b2b_saas` | decision_maker, economic_buyer, evaluator | end_user, technical_reviewer | evaluator, procurement, champion | influencer, agency_or_consultant | feature fit, ROI, security, implementation, alternatives | "Which tool fits [team/use case]?"; "What should we compare before adopting [category]?" | pricing, integrations, case studies, security/docs, role-specific pages | "all companies", "executives" | Split buyer, evaluator, user, and blocker. Do not infer enterprise buyer from one CTA. |
| `b2b_service` | decision_maker, economic_buyer | project owner, operations lead | evaluator, shortlist owner | consultant, internal champion | vendor selection, delivery quality, proof, pricing scope | "Which agency/service is best for [problem]?"; "What proof should I check?" | service pages, process, case studies, pricing/quote, outcomes | "small businesses" | Keep service buyer separate from service recipient and internal evaluator. |
| `b2c_ecommerce` | purchaser | user, recipient, repeat_user | comparator | recommender_influencer, family_decision_maker | price, reviews, quality, shipping, return risk | "Is [product/category] worth it?"; "What are alternatives to [product]?" | product pages, reviews, price, shipping, return policy, images | "20s women", "everyone who shops online" | Split purchaser, user, comparator, gift/recipient, and repeat user when relevant. |
| `b2c_local_service` | purchaser, family_decision_maker | user, recipient | comparator | recommender_influencer | nearby options, trust, availability, reviews, price | "Best [service] near me for [need]?"; "What should I check before booking?" | location, reviews, staff, pricing, booking flow, service details | "local residents" | Include location and trust proof. Do not ignore urgency or family involvement. |
| `clinic_or_healthcare` | patient, guardian, family_decision_maker | patient | comparator | family, referring professional | symptoms/concerns, safety, reputation, access, cost | "How to choose a clinic for [concern]?"; "What should I ask before booking?" | qualifications, medical scope, reviews, fees, consultation flow, disclaimers | "patients with [condition]" without evidence | Avoid diagnosis claims. Mark sensitive assumptions `needs_verification`. |
| `professional_service` | client decision maker, economic_buyer | client/project owner | comparator | referral source, family/business advisor | expertise, case fit, trust, fee clarity, risk reduction | "How to choose a lawyer/accountant for [issue]?"; "What documents/proof matter?" | qualifications, scope, case examples, fee model, consultation flow | "people with legal trouble" | Avoid legal/financial outcome claims without evidence. |
| `school_or_education` | parent/guardian, student, employer sponsor | learner/student | comparator | teacher, family, peer recommender | outcomes, curriculum, fit, price, schedule, reputation | "Which school/course fits [goal]?"; "What should parents compare?" | curriculum, instructors, outcomes, reviews, fees, schedule | "students" | Split payer, learner, guardian, recommender, and repeat/continuing learner. |
| `real_estate` | buyer, seller, renter, landlord | occupant, owner | comparator | family, broker, financial advisor | property fit, trust, fees, area, timing, risk | "What should I compare before choosing an agent/property?"; "Is this area/property type right?" | listings, area info, fees, agent credentials, transaction flow | "people moving" | Avoid financial/legal certainty. Separate buyer/seller/renter/landlord. |
| `recruiting_or_hr` | hiring manager, HR decision maker, economic_buyer | recruiter, candidate, employee | evaluator | department head, agency/consultant | candidate quality, cost, speed, fit, compliance | "Which hiring service/tool fits [role]?"; "What risks should HR check?" | role targets, pricing, process, results, compliance, case studies | "all job seekers" | Split employer-side buyer from candidate/user. Avoid employment outcome guarantees. |
| `marketplace` | demand-side buyer, supply-side seller/provider, platform operator | demand user, supplier user | comparator | recommender, agency/consultant | trust, fees, supply quality, demand quality, reviews | "Which marketplace is best for [need]?"; "How safe/reliable is [platform]?" | supply/demand pages, fees, review system, policy, onboarding | "users" | Split supply and demand sides. Do not merge marketplace participants. |
| `agency_or_consulting` | agency owner, client-side decision maker | agency operator, client-side user | evaluator | consultant, partner | proposal proof, reporting, delivery, client ROI | "What evidence helps propose [service]?"; "How to compare agencies/tools?" | service workflow, reports, case studies, partner/client language | "consultants" | Split agency buyer, agency operator, client-side buyer, and client evaluator. |
| `media_or_directory` | advertiser, sponsor, subscriber | reader, searcher, listing owner | comparator | editor, recommender | find options, compare providers, advertise, directory trust | "Which providers are listed for [need]?"; "Is this directory trustworthy?" | categories, editorial policy, rankings, reviews, ad products | "everyone reading content" | Separate searcher/reader from advertiser/listing owner. |
| `regulated_or_high_trust` | risk-owning decision maker, family/business sponsor | affected user/client | comparator | advisor, expert, family | safety, compliance, credentials, proof, risk avoidance | "What should I verify before choosing [regulated service]?" | licenses, qualifications, disclosures, reviews, process, limitations | sensitive user labels without evidence | Use conservative language. Strengthen `needs_verification` and do not imply outcomes. |

## Expanded Industry Router

| business_type | routing_signals_from_site | required_role_splits | high_trust_or_regulated_flag | likely_prompt_angle_types | evidence_needed_before_handoff |
|---|---|---|---|---|---|
| `manufacturing_or_industrial` | factory, production, equipment, parts, OEM, maintenance, safety, quality | procurement, operations_manager, plant/field user, technical_reviewer, finance_controller | medium/high when safety or compliance appears | supplier comparison, downtime reduction, reliability proof, maintenance workflow | specs, certifications, case examples, support, safety proof |
| `construction_or_field_service` | construction, contractor, field crew, project, estimate, site, safety | owner/decision_maker, field_manager, project_manager, procurement, safety/compliance | high when safety, license, or insurance matters | field workflow, contractor selection, estimate accuracy, urgent/project risk | licenses, insurance, safety process, project examples, service area |
| `logistics_or_supply_chain` | shipping, warehouse, carrier, inventory, dispatch, 3PL, SLA | logistics_manager, operations_manager, procurement, finance_controller, technical_reviewer | medium/high when reliability or data integrations matter | SLA comparison, cost control, tracking/integration proof | SLA, coverage, integrations, pricing, support, case results |
| `finance_or_insurance` | bank, loan, investment, insurance, premium, claim, coverage | economic_buyer, risk owner, compliance/legal, customer comparator, family_decision_maker | high | fee/risk comparison, coverage proof, claims/process trust | license, disclosure, fee model, risk explanation, reviews, compliance |
| `hospitality_restaurant_tourism` | hotel, tour, venue, booking, restaurant, catering, reservation | purchaser, traveler/diner/user, group/event planner, comparator, repeat_user | medium when cancellation/safety matters | booking comparison, review trust, location/availability, group fit | reviews, photos, cancellation policy, pricing, availability, location |
| `beauty_wellness` | salon, spa, treatment, fitness, wellness, booking | user, purchaser, local_comparator, repeat_user, recommender | medium/high when treatment/safety claims appear | local provider trust, staff/qualification comparison, repeat value | staff profile, reviews, pricing, process, hygiene/safety info |
| `home_service` | repair, cleaning, moving, renovation, quote, emergency, service area | homeowner/renter, emergency_decider, local_comparator, payer/family | medium/high for urgent or licensed work | urgent local comparison, price transparency, trust proof | service area, reviews, license/insurance, emergency flow, pricing |
| `automotive` | dealer, repair, inspection, parts, fleet, lease, warranty | owner/driver, purchaser, local_comparator, fleet_manager, repeat_user | medium/high for safety/finance | repair/dealer comparison, warranty/price trust, fleet reliability | reviews, certifications, warranty, pricing, inspection/process |
| `public_sector_nonprofit` | government, municipality, nonprofit, grant, public service, tender | procurement, program_manager, compliance/legal, funder, citizen/user | high when procurement/compliance applies | procurement fit, public trust, accessibility, reporting proof | procurement info, accessibility, reporting, security, case proof |
| `enterprise_it_security` | security, SOC2, SSO, API, DPA, IAM, cloud, compliance | IT decision_maker, security_reviewer, procurement, legal_compliance, admin/end_user | high | security/compliance review, integration proof, vendor risk | security docs, certifications, DPA, uptime, implementation proof |
| `franchise_multi_location` | branches, stores, franchise, locations, area pages, local reviews | headquarters decision_maker, local_branch_manager, operations_manager, franchisee, customer comparator | medium/high when local trust matters | multi-location reporting, review/location comparison, HQ-local workflow | location pages, review proof, permissions, reporting, training/process |
| `subscription_membership` | subscription, membership, renewal, cancellation, plan, community | purchaser, subscriber/user, repeat_buyer, churn-risk user, comparator | medium when billing/health/finance claims exist | renewal value, cancellation risk, onboarding, ongoing proof | pricing, cancellation policy, onboarding, support, reviews |

## Mixed Business Rules

- If a site sells both product and service, classify both and choose personas from each only when evidence supports them.
- If local trust and regulated risk both apply, use both `local-trust-service-personas.md` and `regulated-industry-cautions.md`.
- If marketplace applies, always separate supply side, demand side, and platform-side business interests.
- If agency involvement appears, separate agency-side and client-side personas.
- If BtoB2C, franchise, multi-location, or marketplace logic appears, split headquarters/platform-side, local/supplier-side, and end-customer personas instead of collapsing them.
- If finance, insurance, healthcare, legal, security, public sector, real estate, recruiting, construction safety, or enterprise IT applies, set `high_trust_or_regulated_flag` and strengthen handoff evidence requirements.
