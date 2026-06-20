# Design Asset Prompt Templates

Use these templates when asking Codex to implement or plan visual assets. Every template preserves commit/push prohibition, Product Truth, sample labels, and external asset copy rules.

For external-source-informed prompts, include `External pattern references used` and keep the adaptation at the principle level. Never ask Codex to copy external skills, code, CSS, HTML, screenshots, logos, icons, trademarks, or assets.

Prefer `external-skill-output-styles.md` for prompt structure and `imported-tailwind-polish-recipes.md` for class-level directions. Avoid adding abstract asset theory unless it maps to a concrete screenshot issue or acceptance criterion.

## Shared Safety Block

```md
禁止:
- commit / push 禁止
- git remote を触らない
- 未承認ファイルの変更禁止
- 外部サイトの画像、文章、CSS、HTML、ロゴ、アイコン、商標、アセットのコピー禁止
- 外部スキル/公開デザイン資料の文章、CSS、HTML、画像、アイコン、ロゴ、商標、アセットのコピー禁止
- ライセンス不明ソースの直接利用禁止
- RecoraのProduct Truthを超える機能訴求禁止
- 実装以上の訴求禁止
- サンプル表記を削除しない
- サンプル値を実測値のように見せない
- .env、APIキー、Cookie、ログインセッション、外部サービス設定に触れない
```

## Hero Asset Enhancement Prompt

```md
Use $recora-visual-design-director.

Recora LPのHero素材だけを強化する実装案を作ってください。まだ実装しないでください。

必ず確認:
- `docs/recora-product-truth.md` がある場合は確認する。
- `references/visual-asset-system.md`
- `references/hero-design-playbook.md`
- `references/component-pattern-recipes.md`

目的:
- Heroが平坦に見えないよう、CSS/Tailwind/SVG/既存Recoraロゴで再現できる背景素材を提案する。
- Product Mockを主役にする。
- 装飾はCTAやサンプル表記を邪魔しない。

出力:
- Missing visual assets
- External pattern references used
- 推奨背景素材
- Tailwind方針
- 受け入れ条件

[Shared Safety Block]
```

## Product Mock Build-Out Prompt

```md
Use $recora-visual-design-director.

RecoraのProduct Mockを作り込むための実装指示を作ってください。

必ず確認:
- `docs/recora-product-truth.md` がある場合は確認する。
- `references/product-mock-pattern-library.md`
- `references/product-mock-playbook.md`
- `references/component-pattern-recipes.md`

目的:
- Hero Large Dashboard Mockとして、ブラウザ枠、サイドバー、KPI、ランキング、AI回答ログ、参照元ドメイン、サンプル表記を整理する。
- 未接続機能を本番利用可能に見せない。

出力:
- Product mock pattern to use
- Product mock blueprint to use
- External pattern references used
- 入れる情報
- Tailwind構造
- Mobileでの簡略化方針

[Shared Safety Block]
```

## Charts And Diagrams Prompt

```md
Use $recora-visual-design-director.

Recora LP / Dashboardに追加すべきグラフ・図解を提案してください。実装変更はしないでください。

必ず確認:
- `docs/recora-product-truth.md` がある場合は確認する。
- `references/data-visualization-playbook.md`
- `references/component-pattern-recipes.md`

目的:
- 理解を助ける図だけを選ぶ。
- サンプル値を実測値のように見せない。
- 色だけで意味を伝えない。
- モバイルでも読める密度にする。

出力:
- Recommended charts/diagrams
- 避けるべき図
- サンプル表記方針
- Tailwind/SVG実装方針

[Shared Safety Block]
```

## Three Card Mini UI Prompt

```md
Use $recora-visual-design-director.

Recora LPの3つのFeature Cardに、文章だけでなくミニUIを追加する実装指示を作ってください。

必ず確認:
- `references/visual-asset-system.md`
- `references/component-pattern-recipes.md`
- `references/data-visualization-playbook.md`

目的:
- 各カードにMiniBarChart、RankingList、AnswerLogCard、SourceDomainCard、Mini Tableなどを1つずつ追加する。
- カード密度を上げるが、読みにくくしない。
- サンプル表記を維持する。

出力:
- Mini UI components to add
- 各カードの役割
- Tailwind方針
- Mobile時の崩し方

[Shared Safety Block]
```

## Sample Report Preview Prompt

```md
Use $recora-visual-design-director.

Sample Reportプレビューを改善する実装指示を作ってください。

必ず確認:
- `docs/recora-product-truth.md` がある場合は確認する。
- `references/product-mock-pattern-library.md`
- `references/data-visualization-playbook.md`
- `references/component-pattern-recipes.md`

目的:
- ReportPreviewCardとして紙面感、KPI、比較表、参照元リスト、方法メモ、サンプル表記を整える。
- クライアントに共有できる信頼感を出す。
- 実データや実顧客成果に見せない。

出力:
- レポート紙面構成
- 入れる図/表
- Sample label位置
- Tailwind方針

[Shared Safety Block]
```

## Final CTA Background Prompt

```md
Use $recora-visual-design-director.

Final CTA背景装飾を改善する実装指示を作ってください。

必ず確認:
- `references/visual-asset-system.md`
- `references/product-mock-pattern-library.md`
- `references/component-pattern-recipes.md`

目的:
- ただの緑帯ではなく、Rアイコン透かし、淡いドットグリッド、レポート/ダッシュボードの薄いシルエットで上品にする。
- CTAの読みやすさを最優先する。
- 新しい機能訴求や実績訴求を追加しない。

出力:
- Background asset plan
- Tailwind/CSS方針
- アクセシビリティ注意
- Mobile簡略化

[Shared Safety Block]
```

## Mobile Visual Cleanup Prompt

```md
Use $recora-visual-design-director.

Recora LPのmobile 375px視覚崩れをレビューし、改善指示を作ってください。

必ず確認:
- `references/screenshot-review-checklist.md`
- `references/product-mock-pattern-library.md`
- `references/data-visualization-playbook.md`
- `references/component-pattern-recipes.md`

目的:
- Product Mock、チャート、ミニUIを読める密度にする。
- 横スクロールをなくす。
- CTAを早く押せる位置にする。
- サンプル表記を残す。

出力:
- Mobile issues
- Product mock simplification
- Chart simplification
- Tailwind breakpoint方針
- 受け入れ条件

[Shared Safety Block]
```
