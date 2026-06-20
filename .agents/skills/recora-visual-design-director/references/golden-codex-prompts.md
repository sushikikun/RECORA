# Golden Codex Prompts

Use these prompts when the user asks for implementation instructions. They are examples; confirm the actual target file exists before editing. Every prompt must keep Product Truth, no-copy, no-commit, and no-push boundaries.

## 1. Hero + Product Mock改善

```md
Use $recora-visual-design-director.

対象ファイル:
- app/page.tsx

目的:
- Hero poster syndromeを解消し、H1/CTA/Product Mockがfirst viewportで同時に機能するようにする。
- Product Mockを横長のSaaS画面として主役にする。

事前確認:
- docs/recora-product-truth.md がある場合は必ず確認。
- recora-before-after-casebook.md Case 1 / Case 2 を確認。
- visual-failure-patterns.md の Hero Poster Syndrome と Weak Product Mock を確認。

実装指示:
- H1をdesktop 44-56px相当に抑え、自然な日本語2-3行へ調整。
- Product Mockはtopbarまたはsidebar、scope row、KPI、query/source table、source panelを持つ横長mockにする。
- sample labelはtoolbarまたはscope rowに置く。
- 背景装飾はCSS/Tailwind/SVG/既存Recoraロゴだけで作る。

禁止:
- commit / push 禁止
- git remote を触らない
- 外部サイト/外部スキルの文章、画像、CSS、HTML、ロゴ、アイコン、アセットのコピー禁止
- Recora Product Truthを超える機能訴求禁止
- .env、APIキー、Cookie、ログインセッションに触れない

Acceptance criteria:
- desktop first viewportでH1、primary CTA、Product Mockが見える。
- H1はdesktop 2-3行、375pxで3-4行以内。
- Product Mockにscope/KPI/table/source panelがある。
- 375pxで横スクロールがない。

検証コマンド:
- npm run lint
- npm run typecheck
- npm run build
存在しないscriptは実行せず、未実行理由を報告。
```

## 2. Product Mock密度改善

```md
Use $recora-visual-design-director.

対象ファイル:
- app/page.tsx

目的:
- Dashboard card pileを解消し、Product Mockを実プロダクトらしい情報階層にする。

事前確認:
- docs/recora-product-truth.md がある場合は確認。
- imported-product-mock-methods.md と product-mock-blueprints.md を確認。

実装指示:
- random cardsをtopbar/scope row/KPI/table or ranking/source-log-insight/status stripへ置き換える。
- Recora固有のsample query、source domain、competitor gap、recommendation statusを表示例として使う。
- sample値は丸め、表示例/サンプルのlabelを近くに置く。
- 未接続provider badgesやreal-time monitoring表現は出さない。

Acceptance criteria:
- mock内に5つ以上の意味あるUI objectsがある。
- sample labelが見えるが主役を邪魔しない。
- 文字は主要部分が12px以上相当に見える。
- mobileではKPI pair + 3-row list + source chipsへ簡略化。

禁止:
- commit / push 禁止
- git remote を触らない
- 外部素材コピー禁止
- 実装以上の訴求禁止

検証コマンド:
- npm run lint
- npm run typecheck
- npm run build
```

## 3. Feature CardsにミニUI追加

```md
Use $recora-visual-design-director.

対象ファイル:
- app/page.tsx

目的:
- Text-only feature cardを解消し、各Feature Cardに1つずつRecoraらしいmini UIを入れる。

事前確認:
- visual-failure-patterns.md の Text-Only Feature Card を確認。
- component-pattern-recipes.md と imported-product-mock-methods.md を確認。

実装指示:
- 3つのFeature Cardそれぞれに、mini table、competitor ranking bar、AI answer log、source domain listのいずれかを追加。
- 本文を短くし、mini UIで情報密度を出す。
- mini UIは表示例/サンプルと分かるようにする。

Acceptance criteria:
- 各カードに1つの意味あるmini UIがある。
- 375pxで1カードが過度に長くならない。
- 12px未満相当の重要テキストを使わない。
- カードのpadding/radius/borderが揃う。

禁止:
- commit / push 禁止
- git remote を触らない
- 外部CSS/HTML/アイコン/画像コピー禁止
- 実データや成果数値の捏造禁止

検証コマンド:
- npm run lint
- npm run typecheck
```

## 4. Sample Reportの見栄え改善

```md
Use $recora-visual-design-director.

対象ファイル:
- app/sample/page.tsx

目的:
- Sample Reportを単なる文書ではなく、共有可能なproduct proofとして見せる。

事前確認:
- docs/recora-product-truth.md がある場合は確認。
- acceptance-criteria-library.md の Sample Report を確認。
- product-mock-blueprints.md の Sample Report Proof を確認。

実装指示:
- report header、scope row、KPI blocks、source table、method note、next actionを整理。
- SAMPLE巨大overlayは避け、toolbar/scope row/corner pill/method noteで表示する。
- sample値は実測値に見せない。

Acceptance criteria:
- sample labelが見えるがreport内容を覆わない。
- KPI/table/source noteが読みやすい。
- fake client logo、testimonial、outcome numbersを追加しない。
- 375pxではpaper全体縮小ではなくsection excerptへ切り替える。

禁止:
- commit / push 禁止
- git remote を触らない
- 外部素材コピー禁止
- Product Truth超過禁止

検証コマンド:
- npm run lint
- npm run typecheck
- npm run build
```

## 5. Final CTA素材追加

```md
Use $recora-visual-design-director.

対象ファイル:
- app/page.tsx

目的:
- Final CTAがただの緑帯に見える問題を解消し、Product MockやSample Reportとつながる締めにする。

事前確認:
- recora-before-after-casebook.md Case 6 を確認。
- visual-asset-system.md と acceptance-criteria-library.md の Final CTA を確認。

実装指示:
- 低opacityのR watermark、淡いdot grid、report/dashboard ghost mockをCSS/SVG/Tailwindで追加。
- CTA本文とbuttonを最前面に保つ。
- 新しい成果訴求、顧客ロゴ、導入社数、口コミ、保証表現は追加しない。

Acceptance criteria:
- Final CTAが緑帯だけに見えない。
- buttonとcopyが装飾より強い。
- 375pxでは装飾を減らしてCTAを優先。
- Product Truth riskが増えない。

禁止:
- commit / push 禁止
- git remote を触らない
- 外部画像/ロゴ/CSS/HTMLコピー禁止
- 実装以上の訴求禁止

検証コマンド:
- npm run lint
- npm run typecheck
```

## 6. Mobile visual cleanup

```md
Use $recora-visual-design-director.

対象ファイル:
- app/page.tsx

目的:
- 375pxでHeroとProduct Mockが読めなくなる問題を解消する。

事前確認:
- recora-before-after-casebook.md Case 7 を確認。
- visual-failure-patterns.md の Mobile Mock Shrinkage を確認。
- acceptance-criteria-library.md の Mobile Hero / Mobile Product Mock を確認。

実装指示:
- desktop mock全体を縮小せず、mobileではKPI pair + 3-row ranking + source chipsのexcerptにする。
- CTAをfirst viewport内または直後に置く。
- H1は3-4行以内に収める。
- tabs/cards/chartsは横スクロールを作らない。

Acceptance criteria:
- 375pxで横スクロールがない。
- mockの主要文字が読める。
- sample labelが残る。
- CTAが早い位置にある。
- button/tabsのtouch targetが小さすぎない。

禁止:
- commit / push 禁止
- git remote を触らない
- 外部素材コピー禁止
- Product Truth超過禁止

検証コマンド:
- npm run lint
- npm run typecheck
- npm run build
```
