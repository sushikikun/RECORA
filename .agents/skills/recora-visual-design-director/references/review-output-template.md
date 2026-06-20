# Review Output Template

Use this structure for substantial Recora visual design reviews. It is based on external design skill output styles, rewritten for Recora. Keep it concrete, screenshot-aware, and implementation-ready.

## 1. Overall Visual Judgment

```md
Overall visual judgment:
- Score: x/10
- Visual Score: x/100
- Product Truth: checked / missing / NEEDS_VERIFICATION
- Main visual failure:
- Confirmed basis: screenshot / browser / source files / user-provided / assumption
```

## 2. External Lenses Used

```md
External lenses used:
- External SaaS LP Reviewer Lens:
- External Tailwind UI Polish Lens:
- External Product Mock Designer Lens:
- External Dashboard Density Lens:
- External Screenshot QA Lens:
- External Conversion CTA Lens:
- Recora Product Truth Lens:

Imported patterns applied:
- [method/output style/recipe/source category]

What is based on external skill patterns:
- [review method, output style, Tailwind recipe, product mock method]

What is Recora-specific:
- [green base, Japanese BtoB SaaS, Product Truth, sample labels, no overclaim]
```

## 2.5 Similar Past Failure

Use `recora-before-after-casebook.md` and `visual-failure-patterns.md`.

```md
Similar past failure:
- Casebook match:
- Failure pattern:
- Why this is the same shape:
- What failed last time:
- What to do differently now:
```

## 3. Visual Score

Use `visual-score-rubric.md`, but calibrate with external methods:

- screenshot-first visibility
- above-the-fold clarity
- product mock density
- component polish
- Tailwind-level implementability
- mobile 375px
- Product Truth

## 4. Reference Similarity Score

```md
Reference similarity score:
- SE Ranking: x%
- Peec: x%
- Gumshoe: x%
- Rankscale: x%
- Other external skill/source influence:

Structural delta:
- spacing:
- product mock:
- card density:
- CTA:
- mobile:

Do not copy:
- text / HTML / CSS / images / icons / logos / assets / exact layouts
```

## 5. Above-The-Fold Diagnosis

```md
Above-the-fold diagnosis:
- Service category clarity:
- H1 hierarchy and Japanese line breaks:
- CTA visibility:
- Product mock role:
- Next-section hint:
- External method used:
- Exact implementation direction:
- Acceptance criteria:
```

## 6. Product Mock Diagnosis

```md
Product mock diagnosis:
- Current mock type:
- Missing hierarchy: topbar/sidebar / scope row / KPI / table-ranking / log-source-insight / status strip
- Product Mock Blueprint:
- Imported product mock method:
- Sample label status:
- Mobile crop strategy:
- Forbidden implications:
- Acceptance criteria:
```

## 7. Card / CTA / Tab Polish Diagnosis

```md
Card polish:
- text-only card risk:
- mini UI to add:
- padding/radius/border/shadow:
- acceptance:

CTA polish:
- primary action:
- promise risk:
- button affordance:
- safer label:
- acceptance:

Tab polish:
- active state:
- content difference:
- focus/touch behavior:
- mobile behavior:
- acceptance:
```

## 8. Tailwind-Level Fix Plan

Use `imported-tailwind-polish-recipes.md`.

```md
Tailwind-level fix plan:
- Hero spacing:
- H1 typography:
- Product mock frame:
- KPI cards:
- Feature cards:
- Tabs:
- CTA buttons:
- Final CTA:
- Mobile stack:
- motion-reduce/focus-visible:
```

## 9. Missing Assets / Charts / Mini UI

```md
Missing assets / charts / mini UI:
- Missing visual assets:
- Recommended charts/diagrams:
- Mini UI components:
- Where they go:
- Sample label:
- Product Truth guardrail:
- Mobile treatment:
```

## 10. Product Truth Risk

```md
Product Truth risk:
- Unsupported provider/API support:
- Real-time/automatic monitoring implication:
- Free-check or form promise risk:
- Sample data ambiguity:
- Fake proof/logo/testimonial/outcome risk:
- Required rewrite or visual change:
```

## 11. Lens Disagreement

Use this when external lenses pull in different directions.

```md
Lens disagreement:
- Lens A says:
- Lens B says:
- Risk:
- Decision:
- Why Recora should choose this direction:
```

## 12. Golden Pattern To Use

Use `golden-review-examples.md`, `golden-codex-prompts.md`, and `acceptance-criteria-library.md`.

```md
Golden pattern to use:
- Golden review example:
- Golden Codex prompt:
- Acceptance library sections:
- Why this pattern fits:
```

## 13. Acceptance Criteria

```md
Acceptance criteria:
- Header:
- Hero:
- Product Mock:
- Cards / Tabs / CTA:
- Sample Report:
- Final CTA:
- Mobile 375px:
```

## 14. Before / After Expectation

```md
Before/after expectation:
- Before:
- After:
- Visual score category expected to improve:
- Screenshot proof needed:
```

## 15. Regression Risks

```md
Regression risks:
- Product Truth overclaim:
- Sample label too weak/strong:
- Mobile overflow:
- Text too small:
- Green overuse:
- External asset/copy leakage:
```

## 16. Priority Fixes

Each priority fix must include:

```md
### P1. [issue title]
- issue:
- why it fails visually:
- external method used:
- similar past failure:
- Recora-specific constraint:
- exact implementation direction:
- acceptance criteria:
```

Prioritize above-the-fold, Product Mock, Product Truth risk, mobile, and CTA trust before minor polish.

## 17. Codex Implementation Prompt

Only include when requested or when the user approves implementation scope.

```md
Use $recora-visual-design-director.

Scope:
- [approved files/routes only]

External lenses used:
- [lenses]

Imported patterns applied:
- [review method/output style/Tailwind recipe/product mock method]

Similar past failure:
- [casebook case / failure pattern]

Golden pattern to use:
- [golden prompt / acceptance library sections]

Goal:
- Improve Recora into a refined Japanese BtoB SaaS UI.
- Apply external design-skill methods without copying external prose, CSS, HTML, images, icons, logos, assets, or exact layouts.
- Preserve Product Truth and sample labels.

Implementation direction:
- [exact changes]

Acceptance criteria:
- 3-second service clarity above the fold.
- Product Mock has believable hierarchy and sample label.
- Cards include mini UI where they make product claims.
- CTA is visibly clickable and truth-safe.
- 375px mobile has no horizontal overflow.
- focus-visible and motion-reduce are preserved where relevant.

Before/after expectation:
- [what should visibly change]

Regression risks:
- [what must not get worse]

禁止:
- commit / push 禁止
- git remote を触らない
- 未承認ファイルの変更禁止
- 外部スキル/参考サイトの文章、画像、CSS、HTML、ロゴ、アイコン、商標、アセットのコピー禁止
- RecoraのProduct Truthを超える機能訴求禁止
- .env、APIキー、Cookie、ログインセッション、外部サービス設定に触れない
```
