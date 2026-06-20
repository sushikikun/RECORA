# Visual Score Rubric

Use this 100-point rubric for Recora LP, Dashboard, and Sample Report design reviews.

## External Method Calibration

Before scoring, load `external-skill-review-methods.md` and score from what an external review panel would actually inspect:

- screenshot-first visibility
- above-the-fold diagnosis
- hero hierarchy
- product mock density
- card/CTA/tab polish
- Tailwind-level implementability
- mobile 375px behavior
- Product Truth safety

Do not award points for abstract theory, color-only reference imitation, or visual polish that cannot be converted into an implementation direction.

Before scoring, load `external-design-pattern-bank.md` for substantial reviews. The score should reflect concrete UI/UX quality signals from licensed external patterns: focus clarity, touch targets, motion restraint, chart honesty, product-led hierarchy, dashboard density, and responsive resilience. Do not reward a design for merely resembling a reference site by color or vibe.

## Score Bands

- 90-100: premium Japanese BtoB SaaS, product-led, trustworthy, responsive, and Product Truth-safe.
- 75-89: strong foundation with visible polish gaps.
- 60-74: usable but still generic, sparse, crowded, or visually underpowered.
- 40-59: template-like, weak product proof, or major mobile/trust issues.
- 0-39: unclear service, misleading claims, broken mobile, or product mock fails as proof.

## Hero - 20 points

Good:

- Service category is clear within 3 seconds.
- H1 is specific, compact, and naturally broken in Japanese.
- Product mock or report preview is visibly central.
- CTA appears early and has one primary action.
- Above-the-fold feels calm, not empty.
- External-pattern quality: alignment, focus, CTA affordance, and mock scale are deliberate rather than template defaults.

Bad:

- Huge abstract H1 with no product proof.
- Awkward left/right split where the mock looks secondary.
- Generic AI-gradient hero.
- CTA hidden below fold or competing CTAs.
- Copy implies unsupported product readiness.

Deduct:

- -5 if the service category is unclear.
- -4 if H1 is oversized or awkwardly wrapped.
- -4 if product mock is weak or absent.
- -3 if CTA hierarchy is unclear.
- -4 if Product Truth risk appears above the fold.
- -2 if the hero claims to be "SE Ranking-like" but only changes color and leaves hierarchy/density weak.

## Product Mock - 20 points

Good:

- Looks like a real SaaS screen.
- Uses Recora-specific objects: AI visibility, query groups, brand mention, competitor gap, citation/source, recommendation, report state.
- Has clear hierarchy: sidebar/header, KPI row, table/ranking, source/log panel, next action.
- Text is readable enough to feel credible.
- Sample labels are visible but calm.
- External-pattern quality: mock has dashboard-grade density, table/list ergonomics, and status semantics.

Bad:

- Decorative screenshot-shaped card with filler rows.
- Too small to read.
- Empty or sparse mock with too much whitespace.
- Provider names or automation states look production-ready without evidence.
- Giant sample watermark destroys credibility.

Deduct:

- -6 if mock does not look like a real product.
- -4 if hierarchy is missing.
- -4 if too small or unreadable.
- -3 if sample labeling is missing or overpowering.
- -3 if it implies unsupported capabilities.
- -2 if desktop mock cannot be intentionally simplified for mobile.

## Cards / Tabs / CTA - 20 points

Good:

- Cards include mini UI, status rows, bars, source chips, rankings, or table fragments.
- Tabs change meaningful product state.
- Primary CTA is deep green, strong, and honest.
- Secondary actions are quieter.
- Components share radius, border, padding, and focus behavior.
- External-pattern quality: tab/button/card states have hover, focus-visible, active, disabled/loading, and touch affordance where relevant.

Bad:

- Cards are paragraph-only boxes.
- Too many equal cards.
- Tabs are decorative and cramped.
- Buttons use vague or overpromising labels.
- Component styles feel inconsistent.

Deduct:

- -5 if cards lack visual data shape.
- -4 if tabs are decorative or unusable.
- -4 if CTA hierarchy is weak.
- -4 if card density is too low or too chaotic.
- -3 if component style is inconsistent.
- -2 if icon-only or compact controls have no accessible name or visible affordance.

## Spacing / Density - 15 points

Good:

- White space frames priority.
- Section rhythm feels intentional.
- Max-width, grid gaps, and card padding are consistent.
- Page is spacious but not sparse.
- Information density comes from product UI, not prose volume.

Bad:

- Large empty bands.
- Crowded grids with no hierarchy.
- Nested cards or floating-card page sections.
- Section gaps feel accidental.
- Density depends on long text blocks.

Deduct:

- -4 if the page feels sparse.
- -4 if the page feels crowded.
- -3 if max-width and section rhythm are inconsistent.
- -2 if card padding/gaps are inconsistent.
- -2 if nested cards weaken structure.

## Typography - 10 points

Good:

- H1, H2, body, UI labels, captions, and numbers are clearly tiered.
- Japanese line breaks are natural.
- Meaningful text is 12px or larger.
- Numeric values are strong and easy to scan.
- Body copy is concise.

Bad:

- Poster-heavy Japanese headings.
- Overlong paragraphs.
- Tiny UI text.
- Numbers do not stand out.
- Too many weights, sizes, or label styles.

Deduct:

- -3 for awkward Japanese H1/H2 wrapping.
- -2 for tiny essential text.
- -2 for weak numeric hierarchy.
- -2 for long body copy.
- -1 for inconsistent font weights or tracking.

## Mobile - 10 points

Good:

- 375px has no horizontal scroll.
- H1 and CTA appear early.
- Product mock is simplified, cropped intentionally, or stacked.
- Tabs and cards remain touchable.
- Sample report remains readable.
- External-pattern quality: touch targets are comfortable and mobile inputs/controls avoid iOS zoom and overflow issues.

Bad:

- Horizontal overflow.
- H1 consumes the whole first viewport.
- Mock shrinks into unreadable noise.
- Tabs wrap badly or become tiny.
- Cards become a long repetitive wall.

Deduct:

- -3 for horizontal overflow.
- -2 for hero too long before CTA.
- -2 for unreadable mock.
- -2 for cramped tabs/buttons.
- -1 for overly long card stack.

## Product Truth Consistency - 5 points

Good:

- Product Truth checked or missing status is stated.
- Sample data is clearly labeled.
- Provider support, monitoring, delivery, login, and automation claims stay within evidence.
- No invented customer proof or performance claims.
- External-pattern quality: conversion pressure never overrides factual boundaries.

Bad:

- UI implies unconfirmed provider/API support.
- Free check copy implies real analysis starts when not confirmed.
- Mock looks like live monitoring without evidence.
- Fake logos, numbers, testimonials, or outcomes appear.

Deduct:

- -5 for serious unsupported product readiness or outcome claims.
- -3 for ambiguous provider/support wording.
- -2 for weak sample labeling.

## Required Summary Format

```md
Visual Score: xx/100
- Hero: xx/20
- Product Mock: xx/20
- Cards / Tabs / CTA: xx/20
- Spacing / Density: xx/15
- Typography: xx/10
- Mobile: xx/10
- Product Truth Consistency: xx/5

Main deduction reason:
- [one sentence]

External pattern calibration:
- [sources/patterns used, or none]
```
