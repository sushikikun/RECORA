# Visual Asset Prompt Chain

Use this when generating a Codex implementation prompt after review. Each prompt must state the exact approved scope, Product Truth guardrails, external pattern references used, and commit/push prohibition.

## Universal Safety Block

```md
禁止:
- commit / push 禁止
- git remote を触らない
- 未承認ファイルの変更禁止
- LP本体、Dashboard本体、Sample Report本体は承認された対象以外変更しない
- 外部サイト/外部スキルの文章、画像、CSS、HTML、ロゴ、アイコン、商標、アセットのコピー禁止
- RecoraのProduct Truthを超える機能訴求禁止
- 未接続機能を本番利用可能に見せる表現禁止
- サンプル表記を削除しない
- サンプル値を実測値のように見せない
- .env、APIキー、Cookie、ログインセッション、外部サービス設定に触れない
```

## Chain Step 1: Evidence Lock

```md
事前確認:
- `docs/recora-product-truth.md` がある場合は必ず確認する。
- 現在の対象ファイルと既存デザインパターンを読む。
- 使う外部パターンを `references/external-design-pattern-bank.md` から選び、`External pattern references used` に明記する。
- ライセンス不明の外部スキル/素材は直接コピーせず、要約された判断基準だけ使う。
```

## Chain Step 2: Visual Diagnosis

```md
診断:
- 3秒でサービスカテゴリが分かるか。
- Product Mock / Sample Report が主役として見えるか。
- Cards/Tabs/CTA が文章箱や装飾だけになっていないか。
- Chart/Diagram が実測値に見えないか。
- 375px mobileでCTA、mock、tabs、cardsが読めるか。
```

## Chain Step 3: Asset Plan

```md
追加・調整する素材:
- Missing visual assets:
- Recommended charts/diagrams:
- Product Mock Blueprint to Use:
- Mini UI components to add:
- Tailwind token adjustments:
- Mobile simplification:
```

## Chain Step 4: Scoped Implementation Prompt

```md
Use $recora-visual-design-director.

以下の承認済み範囲だけ実装してください。

対象:
- [approved file or route]

目的:
- [review finding summary]
- Recoraを上品で信頼感のある日本語BtoB SaaS UIに寄せる。
- Product Mock / Sample Report / card mini UI をProduct Truth-safeに強化する。

External pattern references used:
- [e.g. Vercel Web Interface Guidelines: focus/overflow QA]
- [e.g. Tremor/Carbon: dashboard density]
- [e.g. Tailwind/Radix/shadcn: tokenized component structure]

実装指示:
- [specific changes]

受け入れ条件:
- 375pxで横スクロールがない。
- CTAが見える位置にある。
- Product Mockが読める密度で、サンプル表記が自然に残っている。
- CardsにミニUIが入り、文章だけの箱になっていない。
- Chartはサンプルとして見え、実測値に見えない。
- `motion-reduce`、focus-visible、hover/active statesを壊さない。

[Universal Safety Block]
```

## Chain Step 5: Visual QA Prompt

```md
実装後に以下を確認し、結果を報告してください。
- desktop first viewport
- product mock readability
- cards/tabs/CTA visual hierarchy
- sample report or mock sample labels
- mobile 375px overflow and CTA position
- keyboard focus and reduced motion where applicable
- Product Truth overclaim check
```

## Prompt Variants

### Hero Visual Upgrade

Use when the hero is flat, copy-heavy, or product proof is too weak.

```md
対象はHeroだけ。背景はCSS/Tailwind/SVG/既存Recoraロゴで作る。参考サイトや外部スキルの素材をコピーしない。Product Mockを主役にし、CTAとサンプル注記をfirst viewport内で自然に見せる。
```

### Product Mock Buildout

Use when the product mock is sparse or fake.

```md
`product-mock-blueprints.md` から1つ選び、ブラウザ枠、サイドバー/トップレール、KPI、ランキング/テーブル、source/log/detail panel、sample labelを組み立てる。未接続機能やprovider supportを本番利用可能に見せない。
```

### Data Visualization Cleanup

Use when charts look like real measurements or clutter.

```md
丸めたサンプル値、method note、label+colorの冗長表現、mobile simplificationを入れる。円グラフ、3Dグラフ、レーダーチャート、精密すぎる数値は禁止。
```

### CTA / Conversion Polish

Use when CTA is weak, vague, or visually cheap.

```md
Primary CTAはdeep green、secondaryはquiet outline/text。CTA文言はProduct Truthを超えず、何が起きるか明確にする。Final CTAはProduct Echo背景にするが、新しい成果訴求や偽の実績は追加しない。
```
