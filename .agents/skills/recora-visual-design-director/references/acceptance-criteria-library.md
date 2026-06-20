# Acceptance Criteria Library

Use this library in every review and implementation prompt. Acceptance criteria should be observable in screenshots or inspectable in code.

## Header

- 合格条件: navが軽く、CTAが明確で、brand/product名が見える。
- 不合格条件: navが多すぎる、CTAが埋もれる、headerだけで緑が強すぎる。
- 数値目安: desktop height 56-72px、mobile tap target 44px前後。
- スクショ確認ポイント: sticky時にHeroを圧迫しない。button textが収まる。

## Hero

- 合格条件: 3秒でサービスカテゴリ、primary CTA、Product Mockの役割が分かる。
- 不合格条件: Hero Poster Syndrome、CTA below fold、mockが装飾扱い。
- 数値目安: H1 desktop 44-56px相当、mobile 30-36px相当、section `py-16`から`py-24`程度。
- スクショ確認ポイント: desktop first viewportでH1/CTA/mockが同時に見える。

## Product Mock

- 合格条件: topbar/sidebar、scope row、KPI、table/ranking、source/log/insightのうち5つ以上が意味を持つ。
- 不合格条件: Dashboard Card Pile、provider badge過剰、sample labelなし。
- 数値目安: outer frame radius 16-24px、inner card radius 8-12px、主要文字12px以上相当。
- スクショ確認ポイント: sample labelが見え、表やsource panelを邪魔しない。

## Model Tabs

- 合格条件: active stateが明確で、tab切替が意味あるproduct stateを示す。
- 不合格条件: decorative tabs、同じ内容、mobileで折れて読めない。
- 数値目安: touch target 40-44px以上、tab label 12-14px以上。
- スクショ確認ポイント: active tabとpanelの対応が見える。

## Feature Cards

- 合格条件: 各カードに1つのmini UIがあり、文章だけで終わらない。
- 不合格条件: Text-only feature card、カードが多すぎる、nested cards。
- 数値目安: padding 20-28px desktop、16-20px mobile、radius 8-12px。
- スクショ確認ポイント: cardごとの役割が一目で違う。

## Product Modules

- 合格条件: moduleがquery/source/report/recommendationなどRecora product objectを示す。
- 不合格条件: 汎用AIカード、意味のないグラフ、実装以上の機能訴求。
- 数値目安: section gap 48-96px、module内gap 12-20px。
- スクショ確認ポイント: 1 module 1 messageで、UI objectが主張を支える。

## Sample Report

- 合格条件: report header、scope row、KPI、source table、method note、sample labelがある。
- 不合格条件: giant SAMPLE overlay、fake client proof、実測値っぽいprecision。
- 数値目安: report paper padding 24-32px desktop、16-20px mobile。
- スクショ確認ポイント: sample labelは見えるが内容を覆わない。

## FAQ

- 合格条件: 質問が短く、回答がProduct Truthと一致し、CTA前の不安を減らす。
- 不合格条件: 未接続機能をできるように見せる、長文、装飾カード過多。
- 数値目安: question 14-16px、answer 14-15px、row padding 16-20px。
- スクショ確認ポイント: 1画面で複数QAをスキャンできる。

## Final CTA

- 合格条件: CTAが明確で、product echo素材が控えめに入り、緑帯だけに見えない。
- 不合格条件: flat green band、fake proof、装飾がcopy/buttonを邪魔する。
- 数値目安: section `py-12` to `py-20`、decorative opacity 0.08-0.2程度。
- スクショ確認ポイント: buttonが最初に目に入り、背景は補助に留まる。

## Mobile Hero

- 合格条件: H1が3-4行以内、CTAが早い、mock excerptが見える。
- 不合格条件: H1だけでfirst viewportが終わる、CTAが遅い。
- 数値目安: 375pxで横スクロールなし、button height 44px以上。
- スクショ確認ポイント: 375px first viewportでH1とCTAが確認できる。

## Mobile Product Mock

- 合格条件: desktop full mockではなく、KPI pair + 3-row list + source chipsなどのexcerpt。
- 不合格条件: Mobile Mock Shrinkage、横スクロール、sample label消失。
- 数値目安: 主要文字12px以上相当、card padding 12-16px、gap 8-12px。
- スクショ確認ポイント: 主要テキストが読め、sample labelが残る。
