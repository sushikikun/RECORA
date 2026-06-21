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
