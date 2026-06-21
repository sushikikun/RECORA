# BtoB Buying Committee Patterns

Use this reference when the business type is `b2b_saas`, `b2b_service`, `agency_or_consulting`, `recruiting_or_hr`, marketplace B2B side, or unclear B2B.

Always separate decision maker, budget owner, user, evaluator, technical reviewer, influencer, agency/consultant, and blocker when site evidence supports them.

## Output Table

```md
| decision_role | search_intent | main_pain | comparison_axis | likely_ai_questions | needed_evidence | prompt_angle | handoff_priority |
|---|---|---|---|---|---|---|---|
```

## Role Patterns

| decision_role | search_intent | main_pain | comparison_axis | likely_ai_questions | needed_evidence | prompt_angle | handoff_priority |
|---|---|---|---|---|---|---|---|
| `decision_maker` | Strategic fit, business risk, adoption rationale | Needs confidence that adoption supports goals | outcomes, strategic fit, implementation risk, brand trust | "Is [category] worth adopting for [business goal]?"; "What risks should leadership check?" | case studies, outcomes, roadmap fit, implementation examples | Test prompts where a leader evaluates strategic value, adoption risk, and proof before approval. | high when site has executive/demo/enterprise signal |
| `economic_buyer` | Budget, ROI, contract scope, renewal | Needs to justify spend and avoid waste | price, ROI, scope, procurement, renewal risk | "How much should [category] cost?"; "What ROI proof is needed?" | pricing, plan tiers, ROI explanation, procurement docs | Test prompts where a budget owner compares cost, ROI, scope, and proof needed for approval. | high when pricing/contact sales/enterprise signal exists |
| `end_user` | Daily workflow fit | Needs tool/service to solve actual work pain | usability, workflow, integrations, time saved | "Will [category] fit my workflow?"; "What features matter for [use case]?" | product workflow, screenshots, docs, integrations | Test prompts where a practitioner compares workflow fit, alternatives, and friction before using. | high when product/workflow pages exist |
| `evaluator` | Shortlist and vendor comparison | Needs evidence to recommend safely | feature fit, proof, price, risk, support | "Which [category] tools/services should I compare?"; "What criteria matter?" | comparison pages, feature tables, case studies, FAQs | Test prompts where an evaluator builds a shortlist and asks for criteria, alternatives, and proof. | high |
| `technical_reviewer` | Security, integration, data, implementation | Needs to prevent technical or compliance failure | security, API, integrations, data policy, reliability | "What technical risks should we check before adopting [category]?" | docs, API pages, security page, integrations, compliance info | Test prompts where a technical reviewer checks implementation, security, and integration risk. | medium/high when docs/security exist |
| `influencer` | Requirements shaping and internal consensus | Needs language to frame the problem internally | category framing, pain, proof, alternatives | "How should we explain the need for [category] internally?" | thought leadership, category education, examples | Test prompts where an internal champion frames the problem and gathers proof for consensus. | medium |
| `agency_or_consultant` | Recommend, implement, audit, or resell | Needs client-ready proof and repeatable delivery | reports, methodology, client outcomes, white-label fit | "What evidence helps recommend [category] to clients?" | sample reports, methodology, partner/client language | Test prompts where an agency compares client proposal proof, reporting workflow, and delivery evidence. | high when agency/client signals exist |
| `blocker` | Risk, objections, status quo defense | Needs reasons not to adopt or conditions for approval | switching risk, cost, disruption, compliance | "What are the risks of adopting [category]?"; "When should we not use it?" | risk FAQ, security, implementation plan, limitations | Test prompts where a blocker checks risks, limitations, and status quo alternatives before approval. | medium; include when risk signals exist |
| `procurement` | Supplier selection, contract process, pricing control | Needs comparable scope and low procurement risk | price, terms, supplier stability, SLA, compliance | "What vendor criteria should procurement compare for [category]?" | pricing, SLA, contract terms, supplier proof | Test prompts where procurement compares vendor risk, pricing, terms, and support evidence. | high when contact sales, enterprise, public, or procurement signals exist |
| `legal_compliance` | Contract, compliance, privacy, regulated-risk review | Needs to prevent legal/compliance exposure | terms, liability, policy, compliance, data handling | "What compliance proof should legal check before approving [category]?" | legal terms, policies, licenses, certifications, data processing info | Test prompts where legal/compliance reviews risk, proof, limitations, and approval blockers. | high for regulated, public, finance, insurance, healthcare, security |
| `security_reviewer` | Security, privacy, data, access review | Needs assurance before data/system access | SOC2, SSO, DPA, encryption, uptime, access control | "What security questions should we ask before adopting [tool]?" | security page, DPA, certifications, uptime, API/SSO docs | Test prompts where a security reviewer compares security posture, integrations, and vendor risk. | high for enterprise IT/security and data-heavy tools |
| `operations_manager` | Operational efficiency and rollout | Needs adoption without workflow disruption | process fit, adoption, reporting, support, reliability | "Which solution fits operations teams with [workflow]?" | workflow examples, implementation plan, support, reporting proof | Test prompts where operations compares workflow fit, rollout risk, and measurable proof. | high for manufacturing, logistics, construction, multi-location |
| `field_manager` | Field usability, scheduling, safety, adoption | Needs field teams to use the solution safely and consistently | mobile/field use, safety, speed, offline access, training | "What should field teams compare before using [solution]?" | field workflow, training, safety process, service area | Test prompts where a field manager checks usability, safety, and rollout evidence. | medium/high for construction, home service, logistics |
| `finance_controller` | Cost control, budget, forecasting, margin | Needs cost predictability and finance approval | total cost, ROI, payment terms, renewal, utilization | "How should finance evaluate the cost of [category]?" | pricing, usage model, ROI explanation, contract terms | Test prompts where finance compares total cost, risk, renewal, and proof before approval. | medium/high when pricing or budget impact is central |
| `local_branch_manager` | Local execution and customer/reputation impact | Needs branch-level fit within HQ constraints | local reviews, adoption, staffing, reporting, brand consistency | "What should a branch compare before adopting [solution] locally?" | location-level proof, permissions, training, reporting | Test prompts where a branch manager checks local fit, reputation, and operational friction. | high for franchise/multi-location |

## Rules

- If the same person may hold multiple roles, keep role-specific search intent separate.
- Do not invent technical reviewers without docs, security, integration, data, or implementation evidence.
- Do not merge blocker concerns into decision maker approval; blockers often create distinct validation prompts.
- Do not merge procurement, legal/compliance, security, finance, operations, and local branch roles when their objections or proof needs differ.
- For public sector, enterprise IT, regulated, and high-ticket B2B, include approval blockers only when evidence supports the role or the risk is central to handoff.
