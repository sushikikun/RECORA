# Persona Trigger Events And Vocabulary

Use this reference to make each persona concrete enough for AI-search prompt design.

## Required Persona Elements

Each usable persona should include:

- JTBD
- Trigger events
- Pains
- Desired outcomes
- Objections
- Alternatives considered
- Customer language / vocabulary
- Prompt angle connection

## Trigger Event Examples

Use only when supported by site, market, or supplied context:

- Existing SEO efforts have plateaued.
- AI-search answers mention competitors but not the brand.
- A manager asks for comparison materials.
- Internal approval needs ROI explanation before budget request.
- An agency needs proposal material for a client.
- A team is considering a new GEO/AIO/LLMO initiative.
- A pricing or vendor shortlist deadline is approaching.
- Existing tools do not explain AI-answer citations or source quality.
- A client asks whether AI search affects lead generation or brand discovery.

## Customer Language / Vocabulary

Vocabulary should connect site language and market language to prompt design.

For every included persona, produce:

- `words_they_use`: Natural words or phrases the persona may type or say.
- `words_to_avoid`: Internal jargon, overclaimed words, or phrases the persona likely would not use.
- `category_terms`: Category and market terms they recognize.
- `comparison_terms`: Words used when comparing vendors, tools, services, DIY, agencies, or do-nothing options.
- `objection_terms`: Words used to express risk, doubt, budget, proof, accuracy, or implementation concern.
- `proof_terms`: Words used to ask for evidence, source, case, review, ROI, report, or methodology.
- `japanese_market_specific_terms`: Japanese buying, approval, SEO/GEO/AIO/LLMO, agency, or reporting terms where relevant.
- `likely_natural_language_ai_queries`: 2 to 4 natural AI-search questions in the persona's likely language.

Examples:

- "AI search visibility"
- "GEO diagnosis"
- "AIO"
- "LLMO"
- "AI Overviews"
- "AI citations"
- "source quality"
- "competitor visibility"
- "SEO versus AI search"
- "free diagnosis"
- "case studies"
- "pricing"
- "internal approval"
- "ROI"
- "report sample"
- "稟議"
- "資料請求"
- "無料診断"
- "導入事例"
- "費用対効果"

Treat vocabulary as a hypothesis unless observed in site copy, reviews, interviews, sales notes, support logs, search queries, or customer artifacts.

## Words To Avoid

Avoid vocabulary that would distort prompt design:

- Internal product labels not visible to customers
- Guaranteed-outcome language
- Overly technical acronyms when the persona is beginner-level
- Vendor-biased language such as "best solution" when the prompt should be diagnostic
- Generic persona labels such as "marketer", "executive", or "20s women" without decision context

## Prompt Connection

Before final output, check:

- `words_they_use` appear in or inform `sample_ai_questions`.
- `comparison_terms` map to `Alternatives They Consider`.
- `objection_terms` map to `Objections / Concerns`.
- `proof_terms` map to `What They Need to See`.
- Japanese market terms are used only when the market or site context supports them.

## Alternatives They Consider

Track these alternative categories:

- `direct_competitor`
- `existing_SEO_tool`
- `agency_or_consultant`
- `in_house_manual_research`
- `spreadsheet_or_ad_hoc_prompt_testing`
- `do_nothing`
- `wait_and_see`

Alternatives are useful because they become comparison prompts. If no alternative can be named or categorized, reduce `comparison_value`.

## Prompt Angle Connection

A strong prompt angle should include:

- Persona role
- Trigger event
- JTBD or pain
- Customer vocabulary
- Alternative being compared
- Proof or information needed

Shape:

```md
Test prompts where [persona] experiences [trigger], asks using language such as [vocabulary], compares [alternatives], and needs [proof] before [decision].
```

## Anti-Persona Reasons

Use these reasons for `Anti-Personas / Not Useful for Recora Diagnosis`:

- `no AI-search intent`
- `no buying influence`
- `too generic`
- `duplicate segment`
- `no observable prompt angle`
- `unsupported by site evidence`
- `requires customer interview first`
