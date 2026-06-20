# Codex Prompt Templates

Use these when the user asks for a prompt to hand to Codex. Always preserve Product Truth, reference-copy rules, approved scope, and commit/push prohibition.

When a prompt uses any external design source or public skill, include `External pattern references used` and name only the pattern category, not copied content. Use `external-skill-audit.md` for license status and `external-design-pattern-bank.md` for Recora-specific adaptation.

Also include:

- `External lenses used`
- `Imported patterns applied`
- `external method used`
- concrete acceptance criteria
- Tailwind-level direction from `imported-tailwind-polish-recipes.md`
- Product Mock direction from `imported-product-mock-methods.md`

## Global Prohibitions To Include

```md
禁止:
- commit / push 禁止
- git remote を触らない
- 未承認ファイルの変更禁止
- 参考サイトの文章、画像、CSS、HTML、ロゴ、アセットのコピー禁止
- 外部スキル/外部デザイン資料の文章、CSS、HTML、画像、アイコン、ロゴ、商標、アセットのコピー禁止
- ライセンス不明ソースの直接利用禁止
- 外部スキルの良い出力形式・判断手順だけをRecora用に再構成し、文章を丸写ししない
- RecoraのProduct Truthを超える機能訴求禁止
- 未接続機能を本番利用可能に見せる表現禁止
- 顧客ロゴ、導入社数、成果数値、口コミの追加禁止
- .env、APIキー、Cookie、ログインセッション、外部サービス設定に触れない
```

## Review Only Prompt

```md
Use $recora-visual-design-director.

Recora LP / Dashboard / Sample Report をレビューしてください。実装変更はしないでください。

必ず確認:
- `docs/recora-product-truth.md` がある場合は確認する。
- 視覚確認できた箇所とコードからの推測を分ける。
- Product Truthを超える機能訴求を指摘する。

出力:
- 総評
- Visual Score 100点満点
- External pattern references used
- 優先修正トップ5
- セクション別レビュー
- Reference-Site Delta
- Concrete Design Directives

禁止:
- commit / push 禁止
- git remote を触らない
- 実装ファイルを変更しない
```

## Hero Improvement Prompt

```md
Use $recora-visual-design-director.

Recora LP のHeroだけを改善する実装案を作ってください。まだファイル変更はしないでください。

目的:
- 3秒で何のサービスか分かる。
- H1を日本語BtoB SaaSとして自然なサイズと改行にする。
- CTAをfirst viewport内で明確にする。
- Product MockをHeroの主役にする。
- サンプル注記を自然に置く。

参照:
- `references/hero-design-playbook.md`
- `references/reference-site-decomposition.md`
- `docs/recora-product-truth.md` がある場合は必ず確認

[Global Prohibitions]
```

## Product Mock Improvement Prompt

```md
Use $recora-visual-design-director.

Recora LP のProduct Mock / Dashboard Mockだけを改善する実装指示を作ってください。

目的:
- 横長で完成度あるSaaS画面に見せる。
- サイドバー、KPI、ランキング、ログ、参照元、推薦候補の階層を整える。
- 文字を読めるサイズにする。
- サンプル表記を誤認防止できるが過度に目立たない形にする。
- 未接続機能を本番利用可能に見せない。

参照:
- `references/product-mock-playbook.md`
- `references/tailwind-implementation-rules.md`
- `docs/recora-product-truth.md` がある場合は必ず確認

[Global Prohibitions]
```

## SE Ranking Quality Direction Prompt

```md
Use $recora-visual-design-director.

Recora LPを、SE Rankingのような白背景・広い余白・大きなProduct Mock・整ったカード密度の方向へ近づけるレビューをしてください。

重要:
- SE Rankingの文章、画像、CSS、HTML、ロゴ、アセット、 exact layout はコピーしない。
- 観察した質感を、寸法・余白・密度・階層・色・影・角丸・Product Mock構成に分解する。
- Recoraは緑基調、日本語BtoB SaaS、上品、信頼感を守る。
- Product Truthを超える機能訴求は禁止。

出力:
- Reference observation
- Underlying principle
- Recora adaptation
- Do not copy
- 優先修正トップ5
- Codex実装プロンプト

[Global Prohibitions]
```

## Mobile Improvement Prompt

```md
Use $recora-visual-design-director.

Recora LPを375px mobile基準でレビューし、改善指示を作ってください。

確認:
- 横スクロールがないか
- Hero H1が長すぎないか
- CTAがすぐ押せるか
- Product Mockが読めるか、または意図的に簡略化されているか
- Tabsが操作しやすいか
- Cardsが長すぎないか
- テキストの重なりやボタン内あふれがないか

出力:
- Mobile Visual Score
- P0/P1/P2
- 対象ファイル候補
- Tailwind class方針
- 受け入れ条件

[Global Prohibitions]
```

## Scoped Implementation Prompt

```md
Use $recora-visual-design-director.

以下の承認済み範囲だけ実装してください。

対象:
- [file or route]

目的:
- [review result summary]

事前確認:
- `docs/recora-product-truth.md` がある場合は必ず確認する。
- 既存のデザイン/コンポーネント/トークンに寄せる。
- 実装以上の機能訴求を追加しない。
- `references/external-skill-audit.md` と `references/external-design-pattern-bank.md` を確認し、使う外部パターンを要約して明記する。

実装範囲:
- [approved changes only]

External pattern references used:
- [source/category/license status/pattern role]

受け入れ条件:
- 375pxで横スクロールがない。
- Heroで3秒以内に何のサービスか分かる。
- Primary CTAがfirst viewport内で見える。
- Product Mockが横長で完成度あるSaaS画面に見える。
- カードが文章箱だけでなく、ミニUIやデータ表現を含む。
- サンプル表記が誤認防止でき、過度に目立たない。
- 変更後に該当する検証を実行し、結果を報告する。

[Global Prohibitions]
```
