# Imported Tailwind Polish Recipes

These recipes translate external Tailwind/UI skill patterns into Recora class-level direction. They are not copied class blocks from any source.

## Hero Spacing Recipe

- Before symptom: hero feels cramped, empty, or split into copy versus tiny mock.
- Design intent: first viewport has clear hierarchy, strong product proof, visible CTA.
- Tailwind direction: constrain with `max-w-7xl`, use `px-4 sm:px-6 lg:px-8`, vertical rhythm around `py-16 sm:py-20 lg:py-24`, grid/flex gap `gap-8 lg:gap-12`.
- Avoid: massive empty bands, centered slogan with no mock, color-only reference imitation.
- Acceptance criteria: H1, CTA, and product mock are visible without scrolling on common desktop heights.

## H1 Japanese Typography Recipe

- Before symptom: Japanese H1 wraps awkwardly or feels poster-heavy.
- Design intent: premium BtoB clarity, not hype.
- Tailwind direction: `text-3xl sm:text-4xl lg:text-5xl xl:text-6xl`, `leading-tight`, `font-semibold`, controlled `max-w`, manual line breaks only when natural.
- Avoid: negative tracking, viewport-width font scaling, tiny subcopy under large headline.
- Acceptance criteria: desktop H1 2-3 lines; 375px mobile 3-4 readable lines.

## Product Mock Frame Recipe

- Before symptom: mock is a flat white rectangle or random cards.
- Design intent: believable SaaS surface with one strong frame.
- Tailwind direction: outer `rounded-2xl border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] overflow-hidden`; inner borders instead of heavy nested shadows.
- Avoid: provider branding, exact external screenshot look, unreadable 10px labels.
- Acceptance criteria: topbar/scope/KPI/table/detail hierarchy is readable and sample-labeled.

## KPI Card Recipe

- Before symptom: numbers feel fake, weak, or overcrowded.
- Design intent: compact sample metric that supports mock credibility.
- Tailwind direction: `rounded-xl border bg-white p-4`, label `text-xs text-slate-500`, value `text-2xl font-semibold tabular-nums`, status chip semantic.
- Avoid: false precision like `87.43%`, unverified outcomes.
- Acceptance criteria: value is rounded and marked as sample when not measured.

## Feature Card Recipe

- Before symptom: card is only paragraph copy.
- Design intent: one claim plus one mini UI proof object.
- Tailwind direction: `rounded-xl border bg-white p-5 sm:p-6 shadow-sm`, mini UI `mt-5 rounded-lg border bg-slate-50/70 p-3`.
- Avoid: six equal text boxes, tiny charts, nested cards inside cards.
- Acceptance criteria: each card has one table/bar/log/chip/mini chart element.

## Tab Panel Recipe

- Before symptom: tabs look decorative or cramped.
- Design intent: tabs switch meaningful product states.
- Tailwind direction: wrapper `inline-flex rounded-lg border bg-slate-50 p-1`, active tab deep green or white with border/shadow, panel `mt-6 rounded-2xl border bg-white p-5`.
- Avoid: identical panel content, labels wrapping badly on mobile.
- Acceptance criteria: active state, focus state, and changed content are obvious.

## CTA Button Recipe

- Before symptom: CTA does not look clickable or overpromises.
- Design intent: clear primary action with safe copy.
- Tailwind direction: primary `h-11 sm:h-12 rounded-lg bg-emerald-900 px-5 sm:px-6 text-sm font-semibold text-white hover:bg-emerald-950 focus-visible:outline`.
- Avoid: three equal CTAs, "start analysis" if Product Truth does not confirm.
- Acceptance criteria: one primary action per cluster and visible focus.

## Final CTA Recipe

- Before symptom: final CTA is a flat green band.
- Design intent: product memory plus one action.
- Tailwind direction: deep green or white section, subtle dot grid/R watermark/report ghost at low opacity, `relative overflow-hidden`, foreground max width.
- Avoid: fake proof metrics, noisy decoration, copied reference CTA assets.
- Acceptance criteria: button and copy remain more prominent than decoration.

## Mobile Stack Recipe

- Before symptom: desktop mock shrinks into noise on 375px.
- Design intent: mobile gets an excerpt, not a miniature desktop.
- Tailwind direction: `grid-cols-1`, `min-w-0`, hide/crop nonessential columns, stack KPI pair + 3-row list + source chips, touch targets `min-h-11`.
- Avoid: horizontal scroll, hidden sample labels, chart labels under 12px.
- Acceptance criteria: no overflow; CTA appears early; mock remains understandable.
