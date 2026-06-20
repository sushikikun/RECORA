# Reference Asset Breakdown

Use this when observing reference sites at the asset level. The task is to extract the role of each visual material, then convert it into a Recora-owned asset system. Never copy the asset itself.

## Non-Copy Rule

- Do not copy external images, text, CSS, HTML, logos, icons, trademarks, screenshots, exact layouts, animation code, or assets.
- Extract role and principle only.
- Rebuild for Recora with green-based BtoB SaaS direction, CSS/SVG/Tailwind/lucide-react, existing Recora logo treatment, and Product Truth constraints.

## Breakdown Items

For each reference, inspect:

- Hero background
- Product Mock
- CTA
- Card
- Tab
- Graph
- Section background
- Final CTA
- Motion
- Mobile treatment

Use this output format:

```md
Reference asset:
- [what is visible]

Role:
- [what job it does]

Visual principle:
- [spacing / density / hierarchy / surface / motion / color]

Recora adaptation:
- [CSS/SVG/Tailwind/lucide/Recora-logo approach]

Do not copy:
- [specific external asset behaviors to avoid]

Product Truth risk:
- [none / sample label needed / wording must be softened]
```

## SE Ranking Asset Lens

- Hero background: usually clean, white-first, product-friendly. Adapt as white/pale green radial background plus subtle dot grid.
- Product Mock: large, legible product surface. Adapt as Recora dashboard frame with sidebar, KPI row, ranking, source panel.
- CTA: primary button clear and practical. Adapt as deep green primary with restrained secondary.
- Card: product-like mini data, not only copy. Adapt as mini table, ranking bar, source chips.
- Tab: structured product states. Adapt as query/source/recommendation/report states.
- Graph: simple bars/tables. Adapt as sample-labeled horizontal bars.
- Section background: clean bands and controlled contrast. Adapt with white and pale neutral sections.
- Final CTA: integrated, calm close. Adapt with report silhouette or R watermark.
- Motion: understated. Adapt with optional row reveal and `motion-reduce`.
- Mobile: simplified product preview. Adapt by cropping/simplifying mock.

## Peec Asset Lens

- Hero background: minimal and quiet. Adapt as plain white with subtle product glow.
- Product Mock: large central preview. Adapt as one dominant Recora mock.
- CTA: focused and low-noise. Adapt as one primary next step.
- Card: selective metrics. Adapt as 2-3 high-signal sample indicators.
- Tab: limited state switching. Adapt only if each tab changes product meaning.
- Graph: sparse indicators. Adapt as compact KPI and small bars.
- Section background: low contrast. Adapt with subtle borders.
- Final CTA: simple close. Adapt without heavy decoration.
- Motion: minimal. Adapt only for hierarchy.
- Mobile: keep reading order simple.

## Gumshoe Asset Lens

- Hero background: analysis-oriented, often structured around answer/buyer context. Adapt as abstract AI answer card and source chips.
- Product Mock: answer analysis surface. Adapt as answer log, buyer criteria, source support panel.
- CTA: investigation-oriented. Adapt as "sample/report/check" next step within Product Truth.
- Card: persona or criteria-specific. Adapt as persona heatmap mini card.
- Tab: buyer/persona/query state. Adapt as tabbed criteria or query groups.
- Graph: qualitative and comparative. Adapt as heatmap or comparison table.
- Section background: supports analysis reading. Adapt as report-like white paper sections.
- Final CTA: decision support. Adapt as sample report preview plus next step.
- Motion: not required. Use static clarity.
- Mobile: collapse heatmap into stacked rows.

## Rankscale Asset Lens

- Hero background: more dynamic/product-forward. Adapt as subtle row reveal, browser frame depth, or product stack silhouettes.
- Product Mock: feature stack feeling. Adapt as layered Recora dashboard/report cards.
- CTA: energetic but clear. Adapt with deep green CTA and restrained motion.
- Card: system modules. Adapt as measure/compare/source/report modules.
- Tab: feature stack or workflow. Adapt as diagnose/compare/report tabs.
- Graph: dynamic status visuals. Adapt as safe sample bars and small line chart.
- Section background: more contrast. Adapt carefully; avoid dark-heavy or purple AI look.
- Final CTA: memorable close. Adapt with gradient, dot grid, and faint report mock.
- Motion: progressive reveal. Adapt with `motion-safe` and `motion-reduce`.
- Mobile: reduce motion and simplify layers.

## Recora Conversion Checklist

- Does the proposed asset belong to Recora, or does it still feel borrowed?
- Can it be built with CSS/SVG/Tailwind/lucide/existing logo?
- Does it support product understanding?
- Does it stay behind Product Truth?
- Does it preserve sample labels?
- Is it readable on mobile?
