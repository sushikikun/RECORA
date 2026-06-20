# Output Examples

Use this reference when an answer needs a consistent shape. These examples are patterns, not facts. Replace placeholder facts with supplied evidence and label every important claim.

## Good: GEORADER本体改善

```md
## Scope And Evidence

- Target: GEORADER本体の診断・レポート・月次改善導線
- Mode: georader-specialist-strategy
- Confirmed facts: [CONFIRMED_FACT] Supplied context says GEORADER is a continuous GEO / SEO / AI search optimization service.
- GEORADER assumptions: [GEORADER_ASSUMPTION] Paid diagnosis and monthly improvement roadmap are strategic packaging options.
- Needs verification: [NEEDS_VERIFICATION] Current CLI behavior, report delivery, and form backend were not inspected.
- Not inspected: repository, browser rendering, runtime, secrets, live AI answers
- Output type: internal

## P0 Findings

| Issue | Evidence label | Why it matters | Planning action |
|---|---|---|---|
| Provisional diagnosis or delivery claims must be labeled honestly | NEEDS_VERIFICATION | If the UI/report implies completed diagnosis without verified backend/query execution, customer trust is at risk | Audit `/diagnose/new`, report templates, and delivery copy before launch |

## P1 Findings

| Issue | Evidence label | Why it matters | Planning action |
|---|---|---|---|
| Query design should connect non-branded, competitor, branded, and citation checks to report sections | GEORADER_ASSUMPTION | This makes the paid report easier to explain and sell | Add report sections that show query mix, AI answer status, cited sources, and improvement tasks |

## P2 Findings

| Issue | Evidence label | Why it matters | Planning action |
|---|---|---|---|
| Add client-safe evidence labels to sample report language | INDUSTRY_PRACTICE | It reduces overclaiming and improves sales handoff | Add short scope/evidence notes to report sections |
```

## Good: Client AI Search Audit

```md
## Scope And Evidence

- Target: {CLIENT} / {DOMAIN}
- Mode: client-geo-seo-ai-search-strategy
- Confirmed facts: [CONFIRMED_FACT] User supplied brand, category, and three competitors.
- Needs verification: [NEEDS_VERIFICATION] Fresh ChatGPT/Gemini/Perplexity answers and SERP data were not supplied.
- Output type: client-facing + internal

## Client-Facing Summary

確認できた範囲では、{CLIENT} はAI検索で推薦されるための公開情報と根拠ページを整理する余地があります。特に、競合比較・導入事例・対象業界別の課題・診断方法をAIが引用しやすい形で公開することが重要です。

## P1 Findings

| Issue | Evidence label | Impact | Recommendation |
|---|---|---|---|
| Non-branded discovery coverage is unverified | NEEDS_VERIFICATION | AI回答で候補に入っているか判断できない | 60本程度の非指名クエリで現状を測定 |
| Competitor proof may be stronger | GEORADER_ASSUMPTION | 比較回答で競合だけが推薦される可能性がある | 比較ページ、事例、FAQ、第三者掲載を整理 |
```

## Good: Search Intent Map

```md
## Scope And Evidence

- Target: 製造業向けBtoB SaaS
- Mode: search-intent-map
- Industry practice: [INDUSTRY_PRACTICE] Intent mapping is a common SEO/content planning method.
- Needs verification: [NEEDS_VERIFICATION] Search volume and SERP difficulty were not supplied.

| Intent | Query examples | Current coverage | Recommended asset | Evidence label |
|---|---|---|---|---|
| Non-branded discovery | 製造業 SaaS おすすめ | Unknown | 業界向けサービスページ | NEEDS_VERIFICATION |
| Problem-aware | 生産管理 Excel 限界 | Unknown | 課題解決記事 + 導入相談CTA | INDUSTRY_PRACTICE |
| Comparison | {BRAND} vs {COMPETITOR_1} | Unknown | 公平な比較ページ | GEORADER_ASSUMPTION |
| Evidence | {BRAND} 事例 | Unknown | 製造業の導入事例 | INDUSTRY_PRACTICE |
```

## Good: AI Citation Readiness

```md
## Scope And Evidence

- Target: {BRAND}
- Mode: ai-citation-strategy
- Needs verification: [NEEDS_VERIFICATION] No live AI answers or cited URLs were supplied.

| Claim / query | Current source readiness | Missing evidence | Recommended asset | Evidence label |
|---|---|---|---|---|
| {BRAND} is strong for {CATEGORY} | Unknown | Proof, methodology, examples | Service page with methodology and case summary | INDUSTRY_PRACTICE |
| {BRAND} vs competitors | Unknown | Comparison criteria | Fair comparison page | GEORADER_ASSUMPTION |
| Trust and results | Unknown | Client proof | Case study with approved metrics | INDUSTRY_PRACTICE |

Do not present these as guaranteed citations. They improve citation readiness and should be tested with fresh AI answer checks.
```

## Good: Conversion SEO

```md
## Scope And Evidence

- Target: GEORADER free check -> sample report -> paid diagnosis -> monthly improvement
- Mode: conversion-seo-review
- GEORADER assumptions: [GEORADER_ASSUMPTION] This funnel reflects current product strategy unless repository evidence says otherwise.
- Needs verification: [NEEDS_VERIFICATION] Form submission, email delivery, and payment flow were not inspected.

## P0

| Issue | Evidence label | Why it matters | Safer action |
|---|---|---|---|
| Any provisional form that appears complete is a trust risk | NEEDS_VERIFICATION | Users may believe diagnosis or reception is complete | Use preview/provisional wording until backend evidence exists |

## P1

| Issue | Evidence label | Why it matters | Recommendation |
|---|---|---|---|
| CTA should say what the user receives | INDUSTRY_PRACTICE | Reduces anxiety and improves intent match | Replace vague CTA with "無料AI検索チェックの結果を見る" when supported |
```

## Bad: Generic SEO-Only Output

```md
Add keywords to your title tags, get backlinks, improve page speed, and write more blog posts.
```

Why this is bad:

- No GEORADER context.
- No AI search, citation readiness, report quality, or product value.
- No evidence labels.
- No P0/P1/P2.
- Too generic to become a GEORADER report or roadmap.

## Bad: Overclaiming GEO Output

```md
This is the official GEO standard. If you add FAQ schema and comparison tables, ChatGPT will definitely cite and recommend your company.
```

Why this is bad:

- Presents an invented framework as official.
- Guarantees AI citation and recommendation.
- Uses no evidence label.
- Should be treated as P0 if client-facing.

## Bad: Implementation Drift

```md
I will edit the Next.js route, add database tables, update the form handler, and configure API keys now.
```

Why this is bad:

- The skill is strategy/audit/planning only.
- It modifies GEORADER implementation files.
- It risks secrets and production systems.
- The correct response is an evidence-labeled implementation plan, not file edits.
