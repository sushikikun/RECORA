# Tailwind Implementation Rules

Use this when producing Tailwind-oriented implementation prompts or reviewing Tailwind UI polish. Do not edit implementation files unless explicitly approved.

## Layout Defaults

- Page max-width: `max-w-7xl` for full LP sections, `max-w-6xl` for tighter editorial/product sections.
- Horizontal padding: `px-4 sm:px-6 lg:px-8`.
- Section padding: `py-16 sm:py-20 lg:py-24`; hero may use `pt-20 pb-14 sm:pt-24 lg:pt-28`.
- Grid gaps: `gap-5 sm:gap-6 lg:gap-8`.
- Avoid nested decorative cards. Use full-width sections with constrained inner containers.

## Typography Defaults

- H1: `text-3xl sm:text-5xl lg:text-6xl` only when the line length stays controlled; otherwise prefer `lg:text-5xl`.
- H1 line-height: `leading-tight` or custom `leading-[1.12]`.
- H2: `text-2xl sm:text-3xl lg:text-4xl`.
- Body: `text-sm sm:text-base leading-7` or `leading-8` for Japanese prose.
- UI labels: `text-xs` only for non-critical captions; use `text-sm` for meaningful labels.
- Use `tracking-normal`. Do not use negative letter spacing for Japanese UI.

## Color Defaults

Suggested token direction:

- Primary deep green: `emerald-900`, `green-900`, or project token equivalent.
- Primary hover: slightly darker or less saturated deep green.
- Pale accent: `emerald-50`, `green-50`, or custom pale green.
- Border: `slate-200`, `zinc-200`, or green-tinted neutral.
- Text: near-neutral dark such as `slate-950` or local token.
- Muted text: `slate-500` to `slate-600`.
- Warning: amber/red only for true risk.

Avoid:

- page-wide green wash.
- purple AI gradients.
- heavy dark-blue SaaS palette.
- color meanings that mix target brand, competitor, third-party source, active state, and warning.

## Buttons

Primary:

```txt
inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-emerald-900 px-5 sm:px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700
```

Secondary:

```txt
inline-flex h-11 sm:h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 sm:px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700
```

Rules:

- Keep one primary CTA per decision area.
- Do not make primary and secondary buttons visually equal.
- Button labels must match Product Truth.

## Cards

Base:

```txt
rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]
```

Feature card:

```txt
rounded-xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-sm
```

Rules:

- Add mini UI inside cards.
- Use consistent radius and border.
- Keep shadows subtle. Do not rely on heavy glow.
- Avoid cards inside cards unless the inner surface represents an actual UI panel in a product mock.

## Tabs

Container:

```txt
inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1
```

Active tab:

```txt
rounded-md bg-white text-emerald-950 shadow-sm
```

Inactive tab:

```txt
text-slate-600 hover:text-slate-950
```

Mobile:

- Use horizontal scroll only when labels remain readable.
- Add `min-w-max` for tab groups if needed.
- Ensure each tab has at least `h-10` and comfortable side padding.

## Pills And Status Chips

Sample pill:

```txt
rounded-full border border-emerald-900/10 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900
```

Neutral pill:

```txt
rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600
```

Rules:

- Use pill colors semantically.
- Do not use green for every chip.
- Sample labels must be visible but calm.

## Mock UI

Outer frame:

```txt
rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]
```

Mock chrome:

```txt
border-b border-slate-100 bg-slate-50/70 px-4 py-3
```

Inner panel:

```txt
rounded-xl border border-slate-200 bg-white p-4
```

Rows:

```txt
grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 py-3 last:border-0
```

Rules:

- Use fixed or constrained heights for mock areas so hover, tabs, or data changes do not cause layout jump.
- For mobile, simplify the mock rather than shrinking everything.
- Prefer `overflow-hidden` with intentional crop over unreadable micro text.

## Mobile Break Rules

- Hero: stack copy and mock; keep CTA early.
- Product mock: use `overflow-hidden`, `scale` sparingly, or a simplified mobile mock.
- Cards: switch to one column with controlled vertical gaps.
- Tables: convert to stacked rows or show only high-signal columns.
- Tabs: scroll horizontally or wrap into two rows only if labels stay readable.

## Motion And Reduced Motion

- Use subtle opacity/translate reveal only if it supports hierarchy.
- Avoid constant ambient motion in BtoB trust surfaces.
- Respect `motion-reduce`.
- Tailwind direction:

```txt
motion-safe:transition motion-safe:duration-200 motion-reduce:transition-none
```

Do not add animation libraries for simple LP polish unless explicitly approved.
