# Industry / Business Model Adapters

## Purpose

Use this reference to adapt Recora diagnosis topics and AI-search prompts to the client's industry, business model, buyer journey, and decision criteria.

The goal is not to create separate skills per industry. Use these adapters to adjust prompt angles, personas, buyer stages, expected signals, risks, and handoff rules while preserving Recora's metric rules.

## Global Rules

- Measure AI Visibility Rate and AI Ranking mainly with `non_branded`, `problem_solution`, `alternative_search`, and `competitor_comparison` prompts using `brand_mention_rule: brand_excluded`.
- Exclude `branded` and `brand_mention_rule: brand_included` prompts from AI Visibility Rate and AI Ranking in every industry.
- Use `branded` / `brand_included` prompts only for sentiment, reputation, brand perception, explanation accuracy, and risk framing.
- Keep sentiment separate from visibility and ranking in reporting.
- Adapt persona, buyer stage, prompt wording, and expected signals by business model. Do not reuse B2B SaaS buyer logic for B2C, local, healthcare, real estate, finance, or other regulated contexts.
- Preserve real persona vocabulary. Do not make every prompt sound like a formal research survey; include short, anxious, price/review/local, or role-specific wording when that is how the buyer would actually ask.
- Use `raw_user_intent` to record rough user language and `prompt` to provide the safe, measurable final wording.
- In regulated or high-risk industries such as healthcare, law, finance, insurance, and real estate, avoid diagnosis, legal advice, investment advice, guaranteed outcomes, and unsupported safety claims.
- Before measurement, never state that a brand appears, ranks, is cited, is trusted, or is recommended.

## Adapter Format

Each adapter follows this structure:

- adapter_name
- applies_when
- typical_target_customers
- persona_patterns
- buyer_stage_adjustment
- common_prompt_families
- non_branded_prompt_angles
- competitor_comparison_angles
- alternative_search_angles
- citation_check_angles
- branded_sentiment_angles
- expected_signals
- risks_or_biases
- real_persona_query_style
- safe_query_transformations
- metric_eligibility_notes
- handoff_skill_notes

## Adapter Selection

- Use one primary adapter when the business model is clear.
- Use two adapters when the client spans models, such as a local clinic with online booking, an EC brand with local stores, or a B2B SaaS with professional-service onboarding.
- Mark uncertain adapter selection as an `assumption` and keep the prompt set draft-only until the client context is confirmed.

## BtoB SaaS Adapter

- adapter_name: `b2b_saas`
- applies_when: B2B SaaS, subscription software, business workflow tools, marketing tools, sales tools, HR tools, management tools, analytics tools, internal operations tools.
- typical_target_customers: company executives, department leaders, administrators, technical evaluators, end users, procurement/evaluation roles.
- persona_patterns: executive buyer, marketing leader, sales leader, IT/security evaluator, operations owner, practitioner/end user.
- buyer_stage_adjustment: include multi-stakeholder awareness, solution exploration, category shortlist, security/procurement validation, and adoption decision.
- common_prompt_families: pain discovery, category discovery, vendor shortlist, comparison axes, adoption risk, ROI proof, case-study/evidence check, IT/security check.
- non_branded_prompt_angles: workflow inefficiency, reporting burden, handoff problems, operational visibility, team adoption, integration needs.
- competitor_comparison_angles: feature depth, implementation effort, support, security, integrations, reporting, pricing model, case studies.
- alternative_search_angles: spreadsheet/manual operation, agency support, existing CRM/MA tools, internal BI, consulting, custom development.
- citation_check_angles: official product pages, case studies, documentation, security pages, pricing pages, comparison pages, review sites, partner pages.
- branded_sentiment_angles: perceived maturity, trust, support quality, ease of implementation, differentiation clarity, adoption risk.
- expected_signals: category ownership, unprompted vendor mention, comparison axes, proof requirements, security/procurement concerns, source quality.
- risks_or_biases: overusing B2B committee language for self-serve tools; assuming enterprise procurement when SMB buyers are simpler.
- real_persona_query_style: mix `professional_research` with practical shortcut phrasing such as "which tool is better", "expensive alternative", "Excel limit", "manual reporting too hard", or "sales team not updating CRM". Avoid only consultant-style evaluation prompts.
- safe_query_transformations: keep operational vocabulary, then add measurable buyer context. Example raw intent: "HubSpot high alternative"; safe prompt: "If a sales or marketing team feels a CRM/MA tool is expensive, what alternative tool categories or evaluation points should they compare before switching?"
- metric_eligibility_notes: brand-excluded category/vendor prompts can be visibility/ranking eligible; branded SaaS validation prompts are sentiment-only.
- handoff_skill_notes: use `recora-persona-discovery` for committee roles, `recora-competitor-benchmark` for vendor deltas, and `recora-schema-seo-aio` for proof/case-study page improvements.

## BtoC Service Adapter

- adapter_name: `b2c_service`
- applies_when: personal services, subscription services, booking-based services, coaching, lessons, repair, care, wellness, lifestyle, consumer-facing support services.
- typical_target_customers: first-time users, price-sensitive consumers, quality-sensitive consumers, review-oriented consumers, urgent-need users, family decision helpers.
- persona_patterns: first-time buyer, review checker, price comparer, quality seeker, urgent user, family recommender.
- buyer_stage_adjustment: shift toward problem recognition, nearby/available options, review validation, price check, reservation/contact decision.
- common_prompt_families: beginner search, review check, price comparison, failure avoidance, availability, service fit, brand perception.
- non_branded_prompt_angles: "how to choose", "best way to solve", price range, service differences, first-time concerns, local conditions when relevant.
- competitor_comparison_angles: service quality, price, availability, reviews, convenience, cancellation policy, support responsiveness.
- alternative_search_angles: DIY, app/service platforms, local providers, cheaper plans, one-time consultation, trial plan.
- citation_check_angles: review platforms, official service pages, FAQ, booking pages, comparison articles, public business profiles.
- branded_sentiment_angles: trustworthiness, convenience, price fairness, review concerns, support quality, repeat-use likelihood.
- expected_signals: review themes, price sensitivity, decision barriers, local/availability needs, brand trust signals.
- risks_or_biases: making claims from reviews not yet measured; treating all B2C decisions as low involvement.
- real_persona_query_style: include `raw_search_like`, `anxious_user`, and `comparison_shortcut` prompts when the user would likely search with short phrases, anxiety, price, reviews, "cheap", "bad reviews", "near me", or "which is better".
- safe_query_transformations: convert rough consumer language into one safe, measurable question. Keep price/review/anxiety vocabulary, but avoid asking AI to assert reputation, safety, or guaranteed outcomes.
- metric_eligibility_notes: non-branded consumer discovery and comparison prompts can support visibility/ranking; branded review/reputation prompts are sentiment-only.
- handoff_skill_notes: use `recora-recommendation-quality-gate-auditor` before turning review or reputation observations into client-facing advice.

## Local Business Adapter

- adapter_name: `local_business`
- applies_when: stores, restaurants, beauty salons, gyms, local schools, repair shops, clinics with local intent, professional offices with service areas.
- typical_target_customers: nearby searchers, same-day/this-week users, review-heavy users, price-sensitive users, family decision makers, first-time visitors.
- persona_patterns: nearby searcher, urgent visitor, review checker, price comparer, first-time user, family recommender.
- buyer_stage_adjustment: include local discovery, area comparison, review/availability validation, booking/visit decision.
- common_prompt_families: near-me discovery, area comparison, first-visit check, review check, booking availability, price/atmosphere check.
- non_branded_prompt_angles: area + service search, "near me" equivalents, same-day need, family-friendly conditions, opening hours, access.
- competitor_comparison_angles: nearby alternatives, review themes, access, price, atmosphere, service menu, booking convenience.
- alternative_search_angles: home service, online service, larger chain, different nearby area, DIY, walk-in alternative.
- citation_check_angles: Google Business Profile-like sources, maps/listing pages, official site, booking pages, review sites, local media.
- branded_sentiment_angles: reputation, atmosphere, staff/service quality, price fairness, access convenience, booking friction.
- expected_signals: local pack/listing style mentions, area relevance, review themes, access/opening-hours questions, booking intent.
- risks_or_biases: missing locality; treating local choice like national brand ranking; relying on stale reviews.
- real_persona_query_style: include local shorthand such as "near me", station/area names, "today", "open now", "reviews bad", "cheap", and "first time" when relevant.
- safe_query_transformations: preserve the local phrase while adding comparison or verification framing. Example raw intent: "[area] salon cheap reviews"; safe prompt: "When choosing a [service] near [area], how should someone compare price, reviews, access, and booking conditions before visiting?"
- metric_eligibility_notes: local visibility/ranking should use brand-excluded area/category prompts; branded local prompts are sentiment/reputation-only.
- handoff_skill_notes: use `recora-schema-seo-aio` for local business info, FAQ, service area, and review-proof page improvements.

## Clinic / Healthcare Adapter

- adapter_name: `clinic_healthcare`
- applies_when: clinics, dental clinics, cosmetic medicine, chiropractic/osteopathic services, treatment centers, wellness or healthcare services.
- typical_target_customers: people with symptoms or concerns, first-time patients, safety-conscious users, price comparers, users checking doctor/credential information.
- persona_patterns: symptom-concerned patient, first-time patient, safety-conscious user, cost comparer, credential checker, family helper.
- buyer_stage_adjustment: start from concern/symptom information needs, then compare treatment options, safety, credentials, costs, consultation readiness.
- common_prompt_families: concern-based search, treatment option comparison, safety check, credential check, cost comparison, risk/side-effect check, citation/evidence check.
- non_branded_prompt_angles: general information, when to consult a professional, treatment option differences, safety questions, cost/visit concerns.
- competitor_comparison_angles: clinic type, treatment method, credential/equipment, consultation process, aftercare, cost transparency.
- alternative_search_angles: medical consultation, second opinion, lifestyle/at-home care only when appropriate, other clinic types, public institutions.
- citation_check_angles: official clinic pages, medical society pages, public health sources, credential pages, treatment explanation pages, risk/consent pages.
- branded_sentiment_angles: trust, safety, doctor/credential clarity, explanation quality, reputation concerns, aftercare confidence.
- expected_signals: whether AI avoids diagnosis, whether it asks users to consult professionals, evidence/source quality, risk language, credential needs.
- risks_or_biases: medical overclaiming, diagnosis-like wording, guaranteed outcomes, before/after exaggeration, unsupported safety claims.
- real_persona_query_style: include realistic consumer wording such as short symptom/concern phrases, "cheap", "reviews", "scared", "first time", "avoid failure", local area names, and "which clinic" only after rewriting into safe comparison or verification wording.
- safe_query_transformations:
  - raw_user_intent: "東京 シミ取り 安い 口コミ"
    safe_prompt: "東京でシミ取りや肌治療の相談先を探すとき、料金・口コミ・医師情報・リスク説明はどう確認すべきですか？"
  - raw_user_intent: "美容クリニック 初めて 怖い"
    safe_prompt: "美容クリニックが初めてで不安な人は、カウンセリング前にどんな点を確認すると安心材料になりますか？"
  - raw_user_intent: "ダーマペン 失敗しないクリニック"
    safe_prompt: "肌治療の相談先を比較するとき、失敗リスクを避けるために口コミ・説明内容・医師情報・アフターケアをどう確認すべきですか？"
  - raw_user_intent: "美容クリニック 口コミ悪い 避けたい"
    safe_prompt: "美容クリニックの口コミを見るとき、参考になる内容と慎重に扱うべき内容はどう分けられますか？"
  - safety_note: preserve anxiety, price, review, and local vocabulary, but never ask AI to diagnose a condition, select a treatment for the user, guarantee a result, or declare a clinic safe.
- metric_eligibility_notes: brand-excluded informational/comparison prompts can support visibility/ranking; branded clinic prompts are sentiment/trust-only.
- handoff_skill_notes: use `recora-recommendation-quality-gate-auditor` for safety wording and `recora-ai-citation-analysis` for medical-source review.

## E-commerce / Product Adapter

- adapter_name: `ecommerce_product`
- applies_when: EC, D2C, retail products, cosmetics, food, appliances, apparel, subscription products, product comparison pages.
- typical_target_customers: price-sensitive buyers, review-heavy buyers, quality seekers, first-time buyers, gift buyers, comparison researchers.
- persona_patterns: price comparer, review checker, quality seeker, first-time buyer, gift buyer, repeat buyer.
- buyer_stage_adjustment: include product-category discovery, feature comparison, review validation, price/shipping/return check, purchase decision.
- common_prompt_families: product category discovery, recommendation comparison, review check, price/value check, shipping/returns, substitute product search, brand perception.
- non_branded_prompt_angles: product use case, budget range, quality criteria, material/ingredient/spec differences, gift/use scenario.
- competitor_comparison_angles: price, reviews, specs, availability, delivery speed, return policy, warranty, quality signals.
- alternative_search_angles: substitute products, different brands, cheaper/premium alternatives, marketplace vs official store, rental/used/refurbished options.
- citation_check_angles: official product pages, reviews, marketplace pages, comparison articles, specification pages, warranty/return pages.
- branded_sentiment_angles: quality perception, review trust, price fairness, delivery reliability, warranty confidence, brand identity.
- expected_signals: product shortlist, comparison criteria, review concerns, price/value framing, stock/delivery/return questions.
- risks_or_biases: hallucinated reviews, unsupported price or stock claims, using branded prompts for ranking.
- metric_eligibility_notes: brand-excluded product category/comparison prompts can support visibility/ranking; branded product sentiment is separate.
- handoff_skill_notes: use `recora-schema-seo-aio` for Product, FAQ, Review, and shipping/return page structure opportunities.

## Education / School Adapter

- adapter_name: `education_school`
- applies_when: English schools, programming schools, credential schools, cram schools, tutoring, online courses, reskilling programs.
- typical_target_customers: beginners, working adults, students, parents, career changers, credential seekers.
- persona_patterns: beginner, working adult, parent, student, career changer, certificate seeker.
- buyer_stage_adjustment: include goal clarification, skill-level fit, curriculum comparison, instructor/support validation, price/outcome decision.
- common_prompt_families: goal-based school search, beginner fit, outcome proof, price comparison, curriculum comparison, review check, brand perception.
- non_branded_prompt_angles: learning goal, beginner concerns, time commitment, online/offline fit, support needs.
- competitor_comparison_angles: curriculum, instructor quality, support, outcomes, price, schedule flexibility, refund/trial policy.
- alternative_search_angles: self-study, online course marketplace, tutoring, bootcamp, community learning, corporate training.
- citation_check_angles: curriculum pages, instructor profiles, outcome/case pages, reviews, pricing pages, FAQ, public accreditation info when relevant.
- branded_sentiment_angles: credibility, learner support, outcome confidence, beginner friendliness, price fairness, review concerns.
- expected_signals: school categories, comparison axes, outcome proof needs, parent/student concerns, review themes.
- risks_or_biases: guaranteed outcome claims, employment guarantee overreach, using testimonials as facts without evidence.
- metric_eligibility_notes: brand-excluded school/category prompts can support visibility/ranking; branded school prompts are sentiment-only.
- handoff_skill_notes: use `recora-recommendation-quality-gate-auditor` for outcome claims and `recora-schema-seo-aio` for course/FAQ/evidence pages.

## Real Estate Adapter

- adapter_name: `real_estate`
- applies_when: real estate brokerage, rental, buying/selling, housing companies, reform/remodeling, property investment services.
- typical_target_customers: first-time renters/buyers, families, investors, area-focused searchers, budget-sensitive users, risk-avoidant users.
- persona_patterns: first-time renter/buyer, family searcher, investor, area-focused buyer, budget-sensitive comparer, risk-avoidant signer.
- buyer_stage_adjustment: include area discovery, budget/initial-cost research, agency/service comparison, property validation, contract-risk check.
- common_prompt_families: area comparison, company comparison, initial cost check, failure avoidance, review check, pre-contract confirmation, alternative search.
- non_branded_prompt_angles: area suitability, cost expectations, property search methods, contract concerns, family/commute priorities.
- competitor_comparison_angles: listing volume, area expertise, fees, responsiveness, contract support, trust, review themes.
- alternative_search_angles: direct owner listings, portals, other areas, renting vs buying, renovation alternatives, consultation services.
- citation_check_angles: official company pages, listings, reviews, licensing/registration info, area guides, contract/fee explanation pages.
- branded_sentiment_angles: trust, responsiveness, transparency, area expertise, contract-risk handling, review concerns.
- expected_signals: area-intent language, agency shortlist, fee/risk concerns, trust and listing-quality signals.
- risks_or_biases: legal/financial overclaiming, stale listings, unsupported fee or property availability claims.
- metric_eligibility_notes: brand-excluded area/category prompts can support visibility/ranking; branded agency prompts are sentiment/trust-only.
- handoff_skill_notes: use `recora-recommendation-quality-gate-auditor` for legal/risk wording and `recora-schema-seo-aio` for area/service pages.

## Professional Services Adapter

- adapter_name: `professional_services`
- applies_when: legal, consulting, accounting, web production, SEO agencies, recruiting support, B2B support companies, freelancers/agencies.
- typical_target_customers: executives, department heads, small business owners, first-time consultation users, comparison researchers.
- persona_patterns: executive buyer, department head, business owner, first-time consulter, expert evaluator, referral-influenced buyer.
- buyer_stage_adjustment: include problem framing, expert category discovery, provider shortlist, proof/track-record validation, consultation decision.
- common_prompt_families: issue-based search, expert/provider discovery, company comparison, fee benchmark, case-study proof, risk confirmation, brand perception.
- non_branded_prompt_angles: problem symptoms, when to consult an expert, service category differences, selection criteria.
- competitor_comparison_angles: expertise, track record, case studies, fees, consultation process, communication, industry fit.
- alternative_search_angles: in-house work, freelancer, specialist agency, generalist firm, platform marketplace, tool/software replacement.
- citation_check_angles: case studies, credentials, service pages, expert profiles, publications, reviews, pricing/FAQ pages.
- branded_sentiment_angles: expertise, trust, clarity, case-study strength, fee fairness, consultation friction.
- expected_signals: expert category ownership, proof requirements, trust signals, competitor/provider shortlist, consultation objections.
- risks_or_biases: treating professional advice as guaranteed outcome, unsupported case results, legal/financial overclaiming.
- metric_eligibility_notes: brand-excluded expert discovery/comparison prompts can support visibility/ranking; branded provider prompts are sentiment-only.
- handoff_skill_notes: use `recora-recommendation-quality-gate-auditor` for claims and `recora-schema-seo-aio` for expertise/case-study structure.

## Finance / Insurance Adapter

- adapter_name: `finance_insurance`
- applies_when: financial services, insurance, investment-related services, accounting/asset management support, corporate finance services.
- typical_target_customers: beginners, comparison researchers, risk-sensitive buyers, family decision makers, corporate decision makers.
- persona_patterns: beginner, risk-sensitive comparer, family planner, corporate evaluator, fee-sensitive buyer, compliance-aware buyer.
- buyer_stage_adjustment: include education/awareness, product/service comparison, fee/risk validation, regulatory/source check, consultation decision.
- common_prompt_families: comparison criteria, fee check, risk check, reputation check, pre-contract questions, evidence/source check.
- non_branded_prompt_angles: how to compare options, risk/fee questions, suitability criteria, when to consult a qualified professional.
- competitor_comparison_angles: fees, transparency, risk explanation, support, regulatory trust, track record, product/service fit.
- alternative_search_angles: public information, independent advisor, bank/insurance agent, self-directed tools, employer benefits, government sources.
- citation_check_angles: official regulatory sources, disclosure documents, product pages, fee pages, public institution sources, FAQ.
- branded_sentiment_angles: trust, risk explanation quality, transparency, fee fairness, support reliability, reputation concerns.
- expected_signals: risk language, fee transparency, source reliability, disclaimers, comparison axes, consultation readiness.
- risks_or_biases: investment advice, guaranteed returns, suitability claims, unsupported performance claims, regulatory misinformation.
- metric_eligibility_notes: brand-excluded comparison/risk prompts can support visibility/ranking; branded finance prompts are sentiment/trust-only.
- handoff_skill_notes: use `recora-recommendation-quality-gate-auditor` for high-risk claims and `recora-ai-citation-analysis` for source quality.

## Recruiting / HR Adapter

- adapter_name: `recruiting_hr`
- applies_when: recruiting support, staffing, job boards, HR SaaS, training, assessment, onboarding, employee engagement services.
- typical_target_customers: executives, HR leaders, recruiters, hiring managers, operations leaders, job seekers where relevant.
- persona_patterns: executive buyer, HR leader, recruiter, hiring manager, operations owner, candidate/job seeker.
- buyer_stage_adjustment: include hiring problem discovery, service/tool comparison, candidate-quality validation, cost-effectiveness, risk/compliance check.
- common_prompt_families: hiring problem search, service comparison, cost-effectiveness, candidate quality, operational load, mismatch risk, brand perception.
- non_branded_prompt_angles: hiring bottlenecks, candidate quality, recruitment channels, HR workload, retention/training problems.
- competitor_comparison_angles: candidate quality, fees, speed, specialization, support, screening process, compliance/reliability.
- alternative_search_angles: in-house recruiting, job ads, agency, referral, HR SaaS, outsourcing, training/retention initiatives.
- citation_check_angles: service pages, case studies, pricing pages, candidate/placement examples, HR guides, reviews.
- branded_sentiment_angles: trust, candidate quality, support responsiveness, specialization, fee fairness, mismatch risk.
- expected_signals: recruiting category ownership, candidate-quality criteria, comparison axes, cost/risk framing, case-study needs.
- risks_or_biases: unsupported placement outcomes, discriminatory wording, overpromised hiring success.
- metric_eligibility_notes: brand-excluded recruiting service/tool prompts can support visibility/ranking; branded recruiting prompts are sentiment-only.
- handoff_skill_notes: use `recora-recommendation-quality-gate-auditor` for claims and `recora-schema-seo-aio` for case-study/service evidence pages.
