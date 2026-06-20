# Query Taxonomy

Use this reference for AI search diagnosis prompts, SEO/GEO search intent coverage, and query-set reviews.

## Default AI Diagnosis Mix

- 60% non-branded discovery prompts.
- 20% competitor comparison prompts.
- 10% branded verification prompts.
- 10% citation/evidence prompts.

## Volumes

- MVP: 50-100 prompts.
- Paid Standard: 150-250 prompts.
- Pro: 300-500 prompts.
- Enterprise: 1,000+ prompts when segmentation, regions, industries, or competitor coverage justify it.

## Exact-Count Output

When the user requests an exact count, use stable IDs:

- `NB001-NB060` for 60 non-branded prompts.
- `CMP001-CMP020` for 20 competitor prompts.
- `BR001-BR010` for 10 branded prompts.
- `CIT001-CIT010` for 10 citation prompts.

If details are missing, use placeholders and mark the set `NEEDS_VERIFICATION`.

## Variables

- `{BRAND}`
- `{DOMAIN}`
- `{COMPANY}`
- `{CATEGORY}`
- `{INDUSTRY}`
- `{REGION}`
- `{TARGET}`
- `{USE_CASE}`
- `{PRICE_RANGE}`
- `{COMPETITOR_1}` through `{COMPETITOR_5}`

## Prompt Categories

| Category | Purpose | Example Shape |
|---|---|---|
| Natural discovery | Test unbranded recommendation visibility | `{REGION}で{CATEGORY}に強い会社を教えて` |
| Problem-aware search | Test pain-driven discovery | `{TARGET}が{USE_CASE}で困ったときに相談できるサービスは？` |
| Comparison and shortlist | Test competitor set membership | `{BRAND}と{COMPETITOR_1}と{COMPETITOR_2}を比較して` |
| Recommendation | Test whether AI recommends the brand | `{CATEGORY}でおすすめの会社を3社選ぶなら？` |
| Price / cost | Test pricing clarity and affordability framing | `{CATEGORY}の費用相場と選び方を教えて` |
| Industry-specific | Test vertical relevance | `{INDUSTRY}向けの{CATEGORY}支援会社は？` |
| Region-specific | Test local relevance | `{REGION}で{CATEGORY}を依頼できる会社は？` |
| Alternative service | Test replacement and indirect competitors | `{COMPETITOR_1}の代替サービスは？` |
| Branded verification | Test factual brand understanding | `{BRAND}は何をしている会社？` |
| Citation/source verification | Test evidence and source availability | `{BRAND}について信頼できる情報源を挙げて` |

## Query Quality Rules

- Include natural-language prompts, not only keyword fragments.
- Include Japanese prompts for Japanese clients unless the target market is non-Japanese.
- Avoid prompts that force the brand to appear unless the category is branded verification.
- Include competitor and citation prompts early enough to reveal why the brand wins or loses.
- Design prompts to produce analyzable outputs: recommendation status, mention position, cited sources, missing evidence, and conversion opportunity.
- Do not claim the prompts were executed unless actual AI answer outputs are supplied or generated in a verified workflow.
