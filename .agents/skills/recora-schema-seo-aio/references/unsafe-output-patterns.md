# Unsafe Output Patterns

Research date: 2026-06-21

Purpose: identify dangerous Recora SEO/AIO/schema recommendation language and provide safer replacements.

## Replacement Rule

When unsafe wording appears, do not merely soften one word. Rebuild the recommendation around evidence, target page, required visible content, validation method, caveat, and quality-gate trigger.

| Unsafe pattern | Why unsafe | Safer replacement | Required caveat | Related failure mode | Related reference |
|---|---|---|---|---|---|
| AI citation guarantee | Treats uncertain provider behavior as guaranteed outcome. | "This can improve extractability/source clarity and should be remeasured against prompt/provider/date samples." | Future AI citation is not guaranteed. | Schema万能視 / one-shot AI observation | `client-report-language-guide.md`, `advanced-aio-geo-principles.md` |
| Ranking guarantee | Promises SEO rank, traffic, or SERP outcome without control or evidence. | "This may support crawl, snippet, internal-link, or content clarity; ranking impact requires separate measurement." | SEO ranking and AI answer adoption are different outcomes. | SEO/AIO conflation | `skill-eval-rubric.md`, `recommendation-falsifiability.md` |
| Schema overclaim | Presents JSON-LD as a primary source of truth or AI citation/ranking lever. | "Add body-aligned JSON-LD only after visible facts exist and validate rendered output." | Schema is supportive, not proof or guarantee. | Schema万能視 | `schema-decision-matrix.md` |
| Robots/sitemap overclaim | Confuses access/discovery with indexation, ranking, retrieval, or citation. | "Check robots and sitemap alignment with page intent; treat as access/discovery support." | Access/discovery does not prove exposure or AI use. | robots許可万能視 / sitemap送信万能視 | `decision-trees.md`, `client-report-language-guide.md` |
| Unsupported review/rating schema | Invents trust signals, ratings, or reviews. | "Do not propose Review/AggregateRating unless real, visible/supportable reviews and aggregation basis exist." | Fake or unsupported reviews/ratings are not allowed. | fake AggregateRating | `schema-decision-matrix.md`, `aio-geo-failure-modes.md` |
| Keyword stuffing | Attempts to influence search/AI through repetition rather than usefulness. | "Add direct answer blocks, definitions, buyer questions, evidence, and natural entity clarity." | More evidence does not mean more keyword repetition. | keyword stuffing | `page-audit-playbooks.md`, `advanced-aio-geo-principles.md` |
| Manipulative outreach | Suggests fake reviews, fabricated citations, doorway pages, or inauthentic mentions. | "Use legitimate profile correction, partner/customer proof, earned coverage, or monitoring." | Third-party evidence must be earned or corrected legitimately. | manipulative SEO | `public-skill-risk-notes.md`, `source-gap-resolution-playbook.md` |
| Competitor overclaim | Makes unsourced superiority/inferiority claims. | "Define comparison scope, criteria, fit/non-fit, update date, and mark unverified competitor facts `NEEDS_VERIFICATION`." | Competitor claims require current evidence. | Competitor未検証断定 | `page-audit-playbooks.md`, `client-report-language-guide.md` |
| Screenshot-only technical overclaim | Invents canonical, noindex, schema, crawl, or index status from visual evidence. | "Use lightweight audit; inspect source/rendered HTML, headers, robots, sitemap, and JSON-LD before technical conclusions." | Screenshot-only evidence cannot prove technical status. | Screenshot-only overclaim | `decision-trees.md`, `skill-eval-rubric.md` |
| Dashboard indexation risk | Exposes private or authenticated product data as an SEO target. | "Treat dashboard/private reports as non-public unless product/security approves a public export." | Public indexation requires explicit approval and privacy review. | dashboard public indexation | `page-audit-playbooks.md`, `decision-trees.md` |
| Branded prompt metric contamination | Inflates visibility/ranking metrics with brand-name prompts. | "Use branded prompts for sentiment, recognition, entity clarity, and misinformation; non-branded prompts for visibility/ranking." | Do not mix prompt classes in metrics. | Branded prompt混入 | `measurement-taxonomy.md` |
| Mention/citation confusion | Counts brand mention as source support. | "Report mention separately; count citation only when a cited URL/source supports the claim." | Mention is not citation. | mention/citation混同 | `measurement-taxonomy.md`, `decision-trees.md` |
| Source gap oversimplification | Treats schema, FAQ, robots, sitemap, or owned-page edits as the whole source-gap solution. | "Classify the gap into owned-page clarification, new page, internal links, structured data support, third-party evidence, or monitoring." | Some gaps require independent external evidence. | Source gap自社ページ万能視 | `source-gap-resolution-playbook.md` |

## Client Rewrite Pattern

Unsafe:

```text
Add X and AI/search will cite/rank/recommend the page.
```

Safe:

```text
Add X only if the required visible evidence exists. This may support discovery, interpretation, extractability, or source-to-claim clarity. It does not guarantee ranking, rich results, AI citation, AI recommendation, traffic, or conversion. Validate through the named evidence check and remeasurement.
```
