# Measurement Taxonomy

Research date: 2026-06-21

Purpose: define Recora measurement concepts for SEO/AIO/GEO audits and client reports. These concepts must not be collapsed into one "AI visibility" number.

## Source Category Discipline

- Official/primary sources define platform and crawl/index/schema rules, but not Recora's report taxonomy.
- Public skills and third-party articles may inspire labels, but do not define measured Recora outcomes.
- Recora judgment defines the taxonomy below; measured prompt/provider/date evidence is required before reporting a metric.
- Unsupported provider behavior or market claims must be marked `NEEDS_VERIFICATION`.

## Prompt Class Rules

- Branded prompts must not be mixed into AI visibility rate or ranking evaluation.
- Branded prompts are mainly for sentiment, brand recognition, entity clarity, and misinformation checks.
- Non-branded prompts are mainly for visibility, ranking/order-style evaluation, competitor comparison, and source gap discovery.
- Citation and mention are different: a brand can be named without being used as a source.
- Recommendation and ranking are different: a brand can appear high in an answer without being explicitly recommended.
- SEO ranking improvement and AI answer adoption are different outcomes.

## Taxonomy

| Concept | Definition | What it measures | What it does not measure | Required evidence | Common false positives | Common false negatives | Recora report wording | Caveat language |
|---|---|---|---|---|---|---|---|---|
| visibility | Whether a brand/page/source appears in an observed AI/search answer set. | Observed presence in a prompt/provider/date sample. | Citation, recommendation, sentiment, or ranking quality. | Prompt, provider, date, answer text, entity/source match rule. | Branded prompts inflating visibility; ambiguous names. | Synonyms, product names, or page titles not matched. | "Visible in X of Y measured non-branded prompts." | "Visibility is sample-bound and does not guarantee future exposure." |
| mention | Brand/entity is named in answer text. | Named entity appearance. | Citation or source use. | Answer text, entity matching, disambiguation. | Brand appears in prompt echo or unrelated context. | Brand referred to by product/category nickname. | "Mentioned, but not cited as a source." | "Mention is not evidence that the page supported the answer." |
| citation | A URL/source is linked or attributed as support. | Source use in observed answer. | Positive sentiment or recommendation. | Cited URL, answer text, source type, source-to-claim mapping. | Link appears but claim is not supported by that source. | Provider hides citations or cites domain-level pages. | "Cited as supporting source for this claim." | "Citation is observed for this sample only." |
| recommendation | AI answer suggests a brand/product/service as a suitable option. | Explicit or implied choice guidance. | Ranking/order alone. | Answer text, recommendation criteria, prompt intent. | List inclusion treated as recommendation. | Recommendation expressed indirectly in prose. | "Recommended for this use case in the measured answer." | "Recommendation behavior varies by prompt/provider/date." |
| ranking | Relative order in a list or comparison answer. | Position/order within a measured answer. | Recommendation strength, citation quality, or SEO rank. | Ordered answer list, prompt/provider/date, tie handling. | Branded prompt creates expected first position. | Narrative answers without clear ordering. | "Appeared 2nd in the observed non-branded comparison answer." | "AI answer order is not the same as search engine ranking." |
| sentiment | Positive, neutral, negative, or mixed framing around an entity. | Tone, risk, trust, or critique in answer. | Visibility or citation. | Answer text, sentiment rationale, branded prompts allowed. | Generic positive wording counted as strong endorsement. | Mixed caveats missed. | "Sentiment was neutral-positive with caveats about pricing." | "Sentiment is interpretation and should be tied to text evidence." |
| source gap | Missing, weak, or wrong source support for a claim/topic compared with desired answer quality or competitors. | Evidence gap across owned and third-party sources. | A fix that owned pages can always solve. | Prompt, answer, cited sources, source text, target claim. | Treating any non-citation as source gap. | Uncited but well-supported public pages missed. | "Source gap: no crawlable independent source supports the claim." | "The gap may require third-party evidence, not only page edits." |
| source opportunity | A realistic owned-page or third-party source improvement that could better support future answers. | Actionable source improvement area. | Guaranteed citation. | Source gap, page inventory, source type, feasibility. | Opportunistic PR without evidence. | Owned page rewrite opportunity overlooked. | "Source opportunity: add a public methodology section and link it from the LP." | "Opportunity describes support potential, not guaranteed adoption." |
| citation confidence | Bounded confidence that a source is suitable to support a claim if retrieved. | Source quality, claim alignment, freshness, public accessibility. | Probability of future citation. | Source text, claim, freshness, authority, accessibility. | High-authority page that does not support the claim. | Niche but exact source undervalued. | "Citation confidence is medium because the source is public and specific, but not third-party." | "Confidence is not a prediction guarantee." |
| source-to-claim alignment | Whether source text actually supports the claim made in an answer or recommendation. | Claim support quality. | Domain authority alone. | Claim, source excerpt/summary, support verdict. | Source mentions topic but not the claim. | Support appears in table/FAQ not extracted. | "The cited source supports the category but not the pricing claim." | "Unsupported claims require revision or verification." |
| evidence density | Amount and quality of verifiable support on a page/section. | Proof, examples, dates, methodology, data, caveats. | Keyword frequency. | Visible text, page sections, proof artifacts. | Long generic copy counted as evidence. | Compact tables with strong evidence undervalued. | "Evidence density is low for methodology and pricing conditions." | "More evidence should mean clearer support, not more keyword repetition." |
| answer extractability | Ease with which a user or system can extract direct answers from visible content. | Direct answer blocks, Q&A, definitions, tables, labels. | Guaranteed AI use. | Rendered text, headings, structure, visible content. | Hidden accordion/PDF-only content assumed extractable. | Well-structured content missed due JS/crawl limits. | "Add a direct answer block under the pricing heading." | "Extractability supports clarity but does not guarantee citation." |
| entity clarity | Clarity of company/product/category/audience/region/service identity. | Disambiguation and entity relationships. | Authority or ranking. | Visible names, descriptions, sameAs, links, schema/body alignment. | Schema-only entity clarity without body text. | Entity clear in visuals but not text. | "Clarify Recora as an AI-search diagnosis/reporting product." | "Entity clarity is foundational, not a guaranteed visibility lever." |
| competitor citation advantage | Competitors are cited or supported more often/better in observed answers. | Relative source support by competitor. | Permanent market advantage. | Prompt set, providers, cited URLs, source-type comparison. | Branded competitor prompts included. | Competitor cited under variant brand name. | "Competitor A has citation advantage in non-branded comparison prompts." | "Advantage is sample-bound and needs remeasurement." |
