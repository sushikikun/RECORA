# External Design Pattern Bank

Use this file for substantial Recora reviews and for `Mode 8: External Design Ingestion`. It converts license-audited external design skill and design-system lessons into Recora-specific review criteria. Do not copy source text, code, CSS, images, icons, logos, screenshots, or brand assets.

## A. LP Visual Hierarchy

- External learning: Strong UI reviews start by checking whether one thing clearly leads the first viewport. Good design systems treat layout, focus, and content hierarchy as measurable.
- Recora application: Hero must show service category, safe value proposition, CTA, and a credible product/mock/report surface within 3 seconds.
- Tailwind lens: use one constrained width system, `max-w-*`, `gap-*`, `text-balance` or controlled line breaks, and a strong product frame.
- Failure example: a huge generic H1 plus a tiny dashboard card that looks decorative.
- Note: do not add proof metrics, logos, or provider support unless Product Truth confirms them.

## B. SaaS Hero Design

- External learning: Product-led SaaS heroes succeed when copy and product preview are not competing; the preview carries proof and the copy directs the buyer.
- Recora application: central or asymmetric hero is acceptable only if the product mock remains a first-viewport hero object. The H1 should be 2-3 Japanese lines on desktop and 3-4 short lines on mobile.
- Tailwind lens: desktop H1 around `text-4xl` to `text-6xl`, mobile around `text-3xl`, `leading-tight`, primary CTA `h-11` or `h-12`, hero spacing `pt-24 pb-16` adjusted to the header.
- Failure example: copying a reference-site composition by color only, while spacing and product density remain weak.
- Note: sample note should sit near the mock toolbar, below CTA, or in a calm scope row.

## C. Product Mock Design

- External learning: Enterprise dashboard systems use recognizable hierarchy: chrome, nav, KPI row, table/list, side detail, and status feedback.
- Recora application: use Recora-specific objects such as AI visibility, query group, brand mention status, competitor gap, source domain, recommendation candidate, sample report state, and method note.
- Tailwind lens: one strong outer browser frame, inner `border` surfaces, readable `text-xs` only for labels, no meaningful text below 12px, `tabular-nums` for numeric comparisons.
- Failure example: generic "Analytics" cards, fake provider badges, or a white rectangle with three sparse boxes.
- Note: mock data must be marked as `サンプル`, `表示例`, or `参考表示`.

## D. Card Design

- External learning: Mature component systems make cards carry a job, not just text. The card body should contain status, table, chart, list, or controls when the claim is product-related.
- Recora application: every feature card should include one mini UI object: mini table, ranking bar, answer log, source domain list, KPI pair, or heatmap.
- Tailwind lens: cards `rounded-xl border bg-white p-5 sm:p-6`; inner rows `py-2.5`; radius child <= parent; use border first and shadow sparingly.
- Failure example: six equal paragraph cards with no visual data shape.
- Note: do not use green for every chip; reserve deep green for primary/active and use neutrals for structure.

## E. Data Visualization

- External learning: Data-viz libraries are strongest when chart type follows the decision: compare, rank, trend, distribution, or table lookup.
- Recora application: prefer horizontal bars, stacked bars, mini lines, comparison tables, source lists, and simple heatmaps. Avoid circular charts, 3D charts, radar charts, and precise-looking fake metrics.
- Tailwind lens: labels outside or beside bars, `tabular-nums`, rounded sample values, text labels in addition to color, responsive simplification on mobile.
- Failure example: `87.43%` in a landing-page mock with no method note, looking like a real measured result.
- Note: charts explain the product concept; they are not customer proof.

## F. Dashboard UI

- External learning: Enterprise dashboard design depends on predictable navigation, filters, status, table ergonomics, empty states, and obvious next steps.
- Recora application: dashboard previews should show a scope row, filters or query set label, KPI cards, query/source table, insight panel, and reviewed/unreviewed states.
- Tailwind lens: compact grid with `gap-3` to `gap-5`, neutral background, white panels, visible focus states for tabs/filters, `min-w-0` to avoid overflow.
- Failure example: mock has no filter/scope context, so it looks like decorative analytics.
- Note: do not imply live login-ready operation if Product Truth does not confirm it.

## G. Mobile Design

- External learning: mobile quality requires dedicated treatment, not desktop scaled down.
- Recora application: at 375px, place CTA early, crop or stack the product mock intentionally, simplify charts, and keep sample label visible.
- Tailwind lens: use `overflow-hidden` only as a controlled crop, avoid horizontal scroll, `grid-cols-1`, `min-w-0`, touch targets around 44px, mobile input text 16px when applicable.
- Failure example: product mock shrinks until no text or chart can be read.
- Note: if a mock cannot be read at mobile size, show a focused excerpt instead of the whole dashboard.

## H. Visual QA

- External learning: reliable UI review needs evidence labels, viewport coverage, overflow checks, focus checks, and before/after comparison.
- Recora application: separate `SCREENSHOT_OBSERVED` from code inference; inspect desktop hero, product mock, tab section, cards, sample report, final CTA, and mobile 375px.
- Tailwind lens: verify `focus-visible`, `motion-reduce`, explicit hover/active states, text wrapping, and no layout shift from dynamic labels.
- Failure example: claiming "premium" without screenshots or source evidence.
- Note: screenshot QA does not replace Product Truth checks.

## I. Conversion Design

- External learning: conversion improves when the page has one clear next step, low activation energy, credible proof, and honest risk reduction.
- Recora application: primary CTA should not overpromise automatic analysis; secondary CTA should support inspection of sample report or method.
- Tailwind lens: one deep-green primary button per cluster, secondary outline/text, consistent button height, visible hover/focus, no equal-weight CTA pile.
- Failure example: "無料で分析開始" when the form is only a lead/contact flow.
- Note: trust comes from specificity and honest next steps, not fake urgency.

## J. Design System Discipline

- External learning: mature design systems keep radius, spacing, border, typography, focus, and state behavior consistent.
- Recora application: use a small local token set: deep green primary, pale green accent, white surface, slate neutral text, amber/red only for warning risk.
- Tailwind lens: favor `rounded-lg` and `rounded-xl`; avoid nested cards; use `border-slate-200`, `shadow-sm`, and one larger mock shadow; use `motion-reduce:transition-none`.
- Failure example: cards with mixed radii, heavy shadows, and green on every tag.
- Note: do not introduce a parallel design system when existing components/tokens are already coherent.
