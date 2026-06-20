# AI Search Journey By Persona

Use this reference to map each included persona to AI-search journey stages.

The goal is not to force every persona into every stage. The goal is to identify which stage produces the best Recora diagnostic prompts.

## Required Fields

For each relevant stage, include:

- `likely_question`
- `search_intent`
- `needed_evidence`
- `competitor_watch`
- `citation_watch`
- `objection_watch`
- `prompt_angle`

## Stages

### awareness

The persona is discovering a problem, risk, category, or opportunity.

- `likely_question`: "What is AI search visibility and why does it matter for [category]?"
- `search_intent`: Understand category, risk, and vocabulary.
- `needed_evidence`: Definitions, examples, market signals, category explanation.
- `competitor_watch`: Whether competitors or adjacent categories appear unprompted.
- `citation_watch`: Whether AI cites educational or authoritative sources.
- `objection_watch`: Confusion with generic SEO or hype.
- `prompt_angle`: Test prompts that reveal how AI explains the category without seeding the brand.

### exploration

The persona is exploring solution types and requirements.

- `likely_question`: "How can a company diagnose whether it appears in AI search answers?"
- `search_intent`: Learn approaches, methods, and required inputs.
- `needed_evidence`: Methodology, prompt categories, source/citation checks, sample outputs.
- `competitor_watch`: Which solution categories and vendors appear.
- `citation_watch`: Whether methodology claims are supported.
- `objection_watch`: Black-box scoring, unclear scope, or generic advice.
- `prompt_angle`: Test prompts around methods, requirements, and expected deliverables.

### comparison

The persona compares vendors, tools, agencies, DIY, or do-nothing options.

- `likely_question`: "Which AI-search visibility diagnosis tools or services should I compare?"
- `search_intent`: Build shortlist and comparison criteria.
- `needed_evidence`: Feature differences, pricing, case studies, support, reporting quality.
- `competitor_watch`: Direct competitors, SEO tools, agencies, and substitute workflows.
- `citation_watch`: Whether comparisons cite reliable sources.
- `objection_watch`: Vendor bias, thin proof, unclear differentiation.
- `prompt_angle`: Test prompts that compare alternatives and reveal AI's decision criteria.

### validation

The persona checks trust, risk, proof, and fit before approval.

- `likely_question`: "What evidence should I check before requesting an AI-search diagnosis?"
- `search_intent`: Reduce risk and gather proof.
- `needed_evidence`: Case studies, sample reports, pricing logic, limitations, methodology, support.
- `competitor_watch`: Whether AI presents competitors as safer or more established.
- `citation_watch`: Whether brand claims are supported by sources.
- `objection_watch`: ROI, implementation burden, price opacity, category maturity.
- `prompt_angle`: Test prompts that ask for evidence, risks, and validation criteria.

### decision

The persona is close to action, purchase, request, or internal approval.

- `likely_question`: "What should I include in an internal approval request for AI-search diagnosis?"
- `search_intent`: Decide next step and justify it.
- `needed_evidence`: Scope, cost, timeline, deliverables, owner, next actions.
- `competitor_watch`: Whether AI recommends alternatives or delay.
- `citation_watch`: Whether final recommendations cite trustworthy sources.
- `objection_watch`: Procurement, budget, owner, expected outcome, support.
- `prompt_angle`: Test prompts that simulate final approval, contact, or adoption decisions.

## Journey Use Rules

- Use one primary stage per handoff row.
- Mention secondary stages only when they produce distinct prompt angles.
- Do not hand off a persona that has no stage-specific prompt angle.
- If stage is unclear, mark `needs_customer_interview` or `needs_sales_data`.
