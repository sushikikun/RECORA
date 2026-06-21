# Client Report Language Guide

Research date: 2026-06-21

Purpose: provide client-safe wording for Recora SEO/AIO/schema/source-gap reports.

## Global Rules

- Separate SEO improvements from AIO/GEO improvements.
- Use "may support", "can improve clarity", "moves closer to", or "needs verification".
- Do not promise ranking, traffic, rich results, AI citations, AI recommendations, or conversions.
- Mark missing evidence `NEEDS_VERIFICATION`.
- Separate owned-page actions from third-party evidence needs.

## Safe vs Unsafe Wording

| Situation | Unsafe wording | Safe wording |
|---|---|---|
| FAQ schema | FAQ schemaを入れればChatGPTに引用されます。 | FAQ本文を1問1答で明確化し、ページ上のFAQと一致するFAQPage JSON-LDを追加することで、検索エンジンやAIシステムが内容を解釈しやすい構造に近づけます。ただし、AI回答への採用や引用は保証できません。 |
| robots | AI botを許可すればAI検索に出ます。 | robots設定はクロール可否の確認であり、AI回答への採用や露出増加を保証するものではありません。 |
| sitemap | sitemap送信でAI引用が増えます。 | sitemapはURL発見を支援しますが、クロール、インデックス、AI引用を保証しません。 |
| schema | schemaを入れると順位が上がります。 | schemaはページ上の事実を機械が解釈しやすくする補助要素です。順位改善を保証するものではありません。 |
| source gap | 自社ページを直せばsource gapは解決します。 | このsource gapは、 owned-page clarification と third-party evidence のどちらが必要か分けて確認する必要があります。 |
| pricing | 料金を明確にすれば売上が上がります。 | 料金条件の明確化はユーザー理解と抽出精度を支援しますが、売上改善は別途検証が必要です。 |
| competitor | 競合より優れていると書きましょう。 | 比較軸、対象ユーザー、向き不向き、根拠、更新日を明示し、未確認の競合情報は `NEEDS_VERIFICATION` とします。 |

## Explaining Schema Limitations

Use:

- "Schema should mirror visible page content."
- "Schema supports interpretation and feature eligibility where supported."
- "Schema is not a substitute for factual, visible, useful page content."

Avoid:

- "Schema proves trust."
- "Schema makes AI cite the page."
- "Valid JSON-LD is enough."

## Explaining Robots / Sitemap Limitations

Use:

- "robots.txt affects crawl access, not guaranteed indexation or AI use."
- "sitemap inclusion supports discovery but does not guarantee crawling or indexing."
- "A blocked crawler may not see noindex or page-level schema."

## Explaining Source Gap

Use:

- "This is an evidence gap between the claim and available public sources."
- "Owned-page edits can clarify first-party facts, while third-party evidence may be needed for independent support."
- "This gap should be validated against source text before client-facing publication."

## Explaining Third-Party Evidence Needs

Use:

- "Third-party coverage must be earned, corrected, or completed legitimately."
- "Directories, partner pages, reviews, and media coverage are external controls and may not update on request."
- "Do not fabricate reviews, citations, or independent mentions."

## Explaining `NEEDS_VERIFICATION`

Use:

- "`NEEDS_VERIFICATION` means the recommendation depends on evidence not yet inspected or measured."
- "This is not a negative finding; it is a boundary on confidence."

## Explaining SEO vs AIO/GEO

Use:

- "SEO: crawlability, indexability, metadata, canonical, sitemap, internal links, content quality."
- "AIO/GEO: answer extractability, source-to-claim alignment, evidence density, source gaps, and third-party source ecosystem."
- "The two overlap, but one does not guarantee the other."

## Explaining Measurement Uncertainty

Use:

- "Within the measured prompt/provider/date sample..."
- "This observation should be remeasured after implementation."
- "Single observations should not drive broad conclusions."

Avoid:

- "AI visibility improved" without prompt/provider/date/method.
- "AI ranking improved" without defined ranking metric.
