# Persona Golden Test Cases

Use these cases to calibrate whether a persona discovery output is useful for Recora diagnosis.

These are generic test patterns, not real customer claims. Do not present them as proof about any brand.

## How To Use

Before finalizing a complex output, compare the result against the nearest golden case:

- Does the output identify roles, triggers, alternatives, and prompt readiness?
- Does it exclude weak personas instead of stretching them into handoff rows?
- Does it avoid claiming validated personas from URL-only evidence?
- Does each handoff row have prompt readiness, risks, validation questions, and confidence-upgrade conditions?

## Case 1: BtoB SaaS

### sample_input

- Brand: workflow automation SaaS
- Site signals: operations efficiency, integrations, reporting, demo CTA, team plan, enterprise contact
- Customer data: not available

### observed_site_evidence

- Homepage claims reduced manual work.
- Product pages emphasize integrations and dashboards.
- Pricing suggests team or enterprise purchase.

### expected_personas

- Operations evaluator comparing workflow fit, integrations, and reporting proof.
- Economic buyer checking ROI, contract scope, and implementation risk.
- End user worried about daily workflow disruption and learning curve.

### expected_excluded_personas

- "All small businesses" because it is too broad.
- "Developers" unless docs, API, or implementation evidence exists.

### expected_validation_questions

- "What triggered the need to compare workflow tools?"
- "Which tools or manual processes are used today?"
- "What proof is required before budget approval?"

### expected_prompt_readiness

- Evaluator: `ready_for_prompt_design` or `usable_with_caution`.
- Economic buyer: `usable_with_caution` if pricing and ROI proof are thin.
- Unsupported technical buyer: `needs_more_evidence` or `do_not_handoff`.

### expected_handoff_rows

- Include only personas with comparison axis, proof need, risk flags, validation questions, and confidence-upgrade condition.

### bad_output_example

"Persona: small business owner. Prompt angle: best SaaS."

### why_bad_output_fails

It lacks role split, trigger, search intent, alternatives, comparison criteria, evidence boundary, prompt readiness, and validation plan.

## Case 2: SEO / GEO / AI Search Support Service

### sample_input

- Brand: SEO, GEO, AIO, or AI-search visibility service
- Site signals: AI visibility diagnosis, competitor comparison, citations, reporting, consultation CTA
- Customer data: unknown

### observed_site_evidence

- Site mentions AI search visibility or citation readiness.
- CTA suggests diagnosis or consultation.
- Content references SEO, AI search, competitors, or reporting.

### expected_personas

- Marketing decision maker trying to justify a new AI-search initiative.
- SEO/GEO practitioner comparing current SEO tools, manual prompt testing, and agency support.
- Agency or consultant looking for client proposal evidence.

### expected_excluded_personas

- "Anyone who uses ChatGPT" because buying influence and prompt angle are too generic.
- "Enterprise companies" unless site evidence supports enterprise motion.

### expected_validation_questions

- "What made AI-search visibility urgent now?"
- "Which alternatives are used today: SEO tool, agency, spreadsheet, manual AI prompts, or doing nothing?"
- "What evidence would make an AI visibility diagnosis credible?"

### expected_prompt_readiness

- Practitioner with clear alternatives: `ready_for_prompt_design`.
- Decision maker without budget evidence: `usable_with_caution`.
- Broad AI-curious audience: `do_not_handoff`.

### expected_handoff_rows

- Include prompt angles around AI visibility gaps, competitor mentions, citation proof, pricing uncertainty, and internal approval evidence.

### bad_output_example

"Persona: marketer interested in GEO."

### why_bad_output_fails

It is a title-level label and does not explain struggling moment, buyer stage, alternatives, proof need, or handoff risk.

## Case 3: Local Trust-Heavy Service

### sample_input

- Brand: local clinic, legal office, school, or similar trust-heavy service
- Site signals: location pages, reviews, credentials, consultation/reservation CTA, service descriptions
- Customer data: not available

### observed_site_evidence

- Site emphasizes trust, credentials, location, service details, and booking or inquiry.
- Reviews or testimonials may be present.

### expected_personas

- Purchaser or patient/guardian comparing trust, price, availability, and outcomes.
- Comparator checking reviews, credentials, access, and fit.
- Recommender such as family member or advisor when the user and payer differ.

### expected_excluded_personas

- "People nearby" because it is too broad.
- Specialist buyer personas not supported by the site.

### expected_validation_questions

- "What made you start comparing providers?"
- "What proof reduced anxiety before booking or contacting?"
- "Which alternatives did you consider: other local providers, online service, referral, or waiting?"

### expected_prompt_readiness

- Comparator with trust criteria: `ready_for_prompt_design`.
- Recommender without evidence: `usable_with_caution` or `needs_more_evidence`.

### expected_handoff_rows

- Include prompt angles around trust, local comparison, reviews, cost/availability, credentials, and risk reduction.

### bad_output_example

"Persona: local residents."

### why_bad_output_fails

It lacks purchase/user split, comparison intent, anxiety, proof requirements, and AI-search question examples.

## Case 3A: Beauty Clinic Risky Intent Transformation

### sample_input

- Brand: Example Beauty Clinic
- Industry: beauty medical / clinic
- Location: Tokyo
- Customer data: not available
- Risky user queries:
  - "効果が出る施術を知りたい"
  - "自分に合う美容医療を教えてほしい"
  - "この症状に効く治療は何ですか"
  - "安全でおすすめのクリニックはどこですか"
  - "口コミで一番効果があるクリニックを知りたい"

### expected_risky_intent_detection

- `risky_intent_detected`: true for direct treatment, diagnosis, safety, effect-oriented, or review-overreliance queries.
- `original_unsafe_intent` is audit/caution context only and must not be used as `prompt_angle`.
- `safe_transformed_prompt_angle` is used for handoff.
- `prompt_readiness` is usually `usable_with_caution`.
- Unsafe direct diagnosis, treatment recommendation, effect guarantee, or safety guarantee is `do_not_handoff` as-is.
- `regulated_claim_risk` is required.
- `safe_prompt_language_required`: true for every transformed row.
- The output must not call this a validated persona without customer or research data.

### expected_safe_transformations

| unsafe_user_intent | expected_safe_transformed_prompt_angle | expected_prompt_readiness |
|---|---|---|
| "効果が出る施術を知りたい" | "美容医療を検討する前に、効果・リスク・副作用・個人差について一般的に確認すべき観点を整理する" | `usable_with_caution` |
| "自分に合う美容医療を教えてほしい" | "美容クリニックのカウンセリングで、医師に確認すべき質問、適応判断の説明、リスク説明、費用範囲を整理する" | `usable_with_caution` |
| "この症状に効く治療は何ですか" | "症状や悩みを相談する前に、医師へ伝える情報と確認すべき説明項目を整理する" | `usable_with_caution` or `do_not_handoff` |
| "安全でおすすめのクリニックはどこですか" | "東京で美容クリニックを比較するとき、医師情報、料金、リスク説明、口コミ、アフターケアを確認する観点を整理する" | `usable_with_caution` |
| "口コミで一番効果があるクリニックを知りたい" | "口コミや症例を見るとき、効果保証と誤解せず慎重に確認すべき点を整理する" | `usable_with_caution` |

### expected_excluded_personas

- Person asking AI to choose a treatment for them.
- Person seeking diagnosis of a specific symptom from AI.
- Person asking which treatment is guaranteed to work.
- Person asking AI to decide the safest option without consultation.

### bad_output_example

"Persona: person looking for a treatment that works. Prompt angle: ask AI which treatment is best."

### why_bad_output_fails

It converts risky intent into direct medical or beauty-medical advice. The unsafe intent should be excluded as-is or transformed into general comparison and consultation-prep wording with `usable_with_caution`.

## Case 4: Agency / Consultant-Involved Service

### sample_input

- Brand: service used by agencies, consultants, or client-side teams
- Site signals: client reporting, audits, white-label language, proposal support, consultation CTA
- Customer data: unknown

### observed_site_evidence

- Site mentions audits, reports, client-facing deliverables, or advisory workflows.
- CTA suggests consultation, demo, or diagnostic request.

### expected_personas

- Agency owner or consultant evaluating whether the service improves client proposals.
- Agency operator needing repeatable workflow, reporting, and evidence.
- Client-side evaluator checking whether the agency recommendation is credible.

### expected_excluded_personas

- "All agencies" without workflow, decision, or client-proof context.
- Client personas not supported by site evidence.

### expected_validation_questions

- "What client request or proposal deadline triggered the search?"
- "What proof would help convince a client?"
- "What would make the agency keep using manual research or spreadsheets?"

### expected_prompt_readiness

- Agency operator with reporting workflow: `ready_for_prompt_design`.
- Client-side evaluator without site evidence: `usable_with_caution` or `needs_more_evidence`.
- Generic consultant persona: `do_not_handoff`.

### expected_handoff_rows

- Include risk flags for agency/client role confusion, client evidence gaps, and overclaim risk.

### bad_output_example

"Persona: consultants who want better marketing."

### why_bad_output_fails

It does not define the job, trigger, buyer committee, alternatives, prompt readiness, or validation plan.

## Case 4A: Agency / Consultant GEO Platform

### sample_input

- Brand: Example GEO Agency Platform
- Industry: agency / SEO consultant / AI-search diagnosis support
- Site signals: client-facing diagnosis reports, AI-search brand visibility checks, competitor comparison, improvement recommendations, document request or demo CTA
- Customer data: not available

### observed_site_evidence

- Site mentions diagnosis reports for clients.
- Site mentions checking brand visibility in AI search.
- Site mentions competitor comparison and improvement recommendations.
- CTA suggests document request or demo.

### expected_personas

- SEO agency operator who wants client proposal material and repeatable diagnosis workflow.
- Consultant adding GEO diagnosis to existing SEO advisory work.
- Agency or consulting manager checking report quality, repeatability, and client-facing credibility.
- Business owner or practice lead evaluating resale, partnership, or white-label potential only when the site supports that motion.

### expected_excluded_personas

- Client-side buyer stated as confirmed when the site only supports agency-side use.
- Generic SEO beginner with no client, proposal, or diagnosis workflow.
- Individual who is merely curious about AI tools.
- Reseller or white-label persona when the site does not show partner, resale, or white-label evidence.

### expected_validation_questions

- "What client request, proposal deadline, or reporting gap triggered the search?"
- "Which proof makes the diagnosis credible to clients: sample reports, competitor comparison, source/citation evidence, or improvement examples?"
- "Is resale, white-label, or partner use actually offered, or only a possible future hypothesis?"

### expected_prompt_readiness

- Agency operator with report/proposal evidence: `ready_for_prompt_design` or `usable_with_caution`.
- Consultant adding GEO to SEO support: `usable_with_caution` if the exact service motion needs validation.
- Business owner evaluating resale/white-label: `needs_more_evidence` unless partner or resale evidence is explicit.
- Generic AI-curious individual: `do_not_handoff`.

### expected_handoff

- Use `decision_role` of `agency_or_consultant` and `role_type` of `agency_or_consultant` for agency-side rows.
- Connect prompt angles to client proposal, diagnosis report quality, competitor comparison, and improvement recommendations.
- Keep confidence `medium` or `low` unless customer/research data supports real agency adoption.
- Include `needs_verification` for agency case studies, sales notes, partner/resale availability, white-label availability, report usage, and client-facing proof needs.

### bad_output_example

"Persona: SEO beginner interested in AI tools. Prompt angle: best GEO tool."

### why_bad_output_fails

It ignores agency decision context, client proposal workflow, report proof, competitor comparison, handoff readiness, and the need to verify resale or white-label assumptions.

## Expanded Industry Cases

These compact cases calibrate industry routing. They are not customer evidence.

| case | sample_input | expected_persona_roles | expected_excluded_personas | expected_decision_unit_split | expected_prompt_readiness | bad_output_example | why_bad_output_fails |
|---|---|---|---|---|---|---|---|
| manufacturing BtoB | Industrial equipment or factory workflow site with specs, maintenance, quality, or supplier language. | operations_manager, procurement, technical_reviewer, finance_controller, plant/field user | "manufacturers"; "factory workers" without buying/search role | Procurement buys, operations owns pain, technical reviewer checks specs/safety, finance checks cost. | `usable_with_caution` unless specs/proof/case evidence are strong. | "Persona: manufacturers needing efficiency." | No decision unit, no spec/proof need, no procurement/operations split. |
| construction / field service | Contractor, field crew, project, estimate, safety, service area, or job-site workflow. | field_manager, project_manager, owner/decision_maker, procurement, safety/compliance reviewer | "builders"; "construction companies" | Office buyer, field user, safety/compliance reviewer, and client/project owner can differ. | `usable_with_caution`; `needs_more_evidence` if license/safety proof is absent. | "Persona: construction workers." | Merges buyer and field user; misses safety, service area, and urgency. |
| finance / insurance | Insurance, claim, premium, financial advice/product, coverage, disclosure, or regulated fee language. | risk owner, customer comparator, compliance/legal, family_decision_maker, economic_buyer | "people who want money"; "insured users" without scenario | Regulated reviewer, payer, user, and family sponsor may differ. | usually `usable_with_caution` or `needs_more_evidence`; never high confidence from URL only. | "Persona: investors who want high returns." | Makes financial outcome and user intent claims without evidence. |
| restaurant / hospitality | Restaurant, hotel, tour, venue, booking, cancellation, menu, reviews, or reservation. | traveler/diner/user, group planner, purchaser, local_comparator, repeat_user | "tourists"; "food lovers" | Booker/payer, guest/user, group planner, and recommender can differ. | `ready_for_prompt_design` when location, reviews, price/policy are visible. | "Persona: tourists looking for food." | Too broad; lacks occasion, booking, location, reviews, cancellation/price criteria. |
| beauty / wellness | Salon, spa, wellness, treatment, staff, booking, reviews, before/after, or hygiene. | user, purchaser, local_comparator, repeat_user, gift_purchaser | demographic-only personas | User, gift purchaser, repeat user, and local comparator differ. | `usable_with_caution` when treatment/safety claims are thin. | "Persona: women in their 20s." | Demographic-only and may infer sensitive/body concerns. |
| home service | Repair, moving, cleaning, renovation, emergency, quote, license/insurance, service area. | homeowner/renter, emergency_decider, family_decision_maker, local_comparator, payer | "homeowners" only | Searcher may be urgent user; payer/family may decide; provider trust matters. | `ready_for_prompt_design` if service area, reviews, and quote flow are clear; otherwise caution. | "Persona: homeowners needing repairs." | Ignores urgency, service area, price transparency, and trust signals. |
| automotive | Dealer, repair, inspection, warranty, parts, fleet, lease, or maintenance. | owner/driver, purchaser, local_comparator, fleet_manager, repeat_user | "drivers" | Consumer owner and fleet buyer have different comparison axes. | `usable_with_caution` if safety/warranty/financing proof is limited. | "Persona: drivers who need cars." | Too broad; lacks repair/dealer/fleet split and safety/warranty proof. |
| public sector / nonprofit | Government, municipality, nonprofit, grant, public service, tender, reporting, accessibility. | procurement, program_manager, compliance/legal, funder, citizen/user | "citizens" as buyer | Public procurement, program owner, funder, and end beneficiary differ. | `needs_more_evidence` unless procurement/compliance/reporting evidence is visible. | "Persona: government users." | Misses procurement, compliance, public accountability, and evidence needs. |
| enterprise IT / security | Security, SOC2, SSO, DPA, IAM, API, cloud, uptime, compliance. | IT decision_maker, security_reviewer, procurement, legal_compliance, admin/end_user | "IT teams" | Security reviewer and legal/procurement may block adoption separately from admin user. | `usable_with_caution`; `ready_for_prompt_design` only with security/docs evidence. | "Persona: IT manager looking for software." | Misses security/compliance proof, reviewer/blocker roles, and overclaim risk. |

## Expanded Case Rules

- Each expanded case must include an `expected_decision_unit_split`.
- If the case is high-trust or regulated, default to `usable_with_caution` or `needs_more_evidence` unless evidence is explicit.
- A bad output fails when it uses only industry labels, merges buyer/user/reviewer roles, or creates prompt angles without evidence.
