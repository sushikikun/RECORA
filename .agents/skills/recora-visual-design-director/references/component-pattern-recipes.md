# Component Pattern Recipes

Use these recipes when producing implementation-ready guidance. They are patterns, not mandatory code. Prefer existing project components and tokens when available.

For external-skill-based reviews, use these recipes after `external-skill-review-methods.md` identifies a concrete failure. Do not list components abstractly; state the symptom, external method used, Tailwind direction, and acceptance criteria.

External-pattern baseline:

- Every interactive recipe should include visible `hover`, `active`, and `focus-visible` states where applicable.
- Icon-only controls need accessible names in implementation prompts.
- Compact UI must still keep meaningful text at 12px or larger and touch targets around 44px on mobile.
- Use `min-w-0`, wrapping, truncation, or line clamp where long Japanese text or domains can overflow.
- Add `motion-reduce:*` guidance whenever animation is proposed.
- Use `font-variant-numeric: tabular-nums` or equivalent for numeric comparisons.

## PrimaryButton

- Purpose: main action.
- Look: deep green filled, white text, calm radius, clear focus.
- Tailwind: `inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-emerald-900 px-5 sm:px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700`.
- Avoid: vague labels, multiple primary buttons, unsupported "start analysis" promises.
- Recora use: free check consultation, sample report view, approved next step.
- QA: label must say what happens next and must not imply automatic analysis unless Product Truth confirms it.

## SecondaryButton

- Purpose: lower-emphasis secondary action.
- Look: white/outline or quiet text.
- Tailwind: `inline-flex h-11 sm:h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 sm:px-6 text-sm font-semibold text-slate-900 hover:bg-slate-50`.
- Avoid: competing with primary.
- Recora use: sample report, methodology, contact route.

## Pill

- Purpose: label sample, status, category, source type.
- Look: small rounded label, semantic color.
- Tailwind: `rounded-full border border-emerald-900/10 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900`.
- Avoid: using green for every meaning.
- Recora use: "サンプル", "参考表示", query group, source status.

## SectionHeader

- Purpose: create section hierarchy.
- Look: eyebrow, H2, short description.
- Tailwind: `mx-auto max-w-3xl text-center` with H2 `text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight`.
- Avoid: long prose or poster-like H2.
- Recora use: each LP section intro.

## MetricCard

- Purpose: KPI proof shape.
- Look: label, big number, status note.
- Tailwind: `rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm`.
- Avoid: fake precision or real-looking outcomes.
- Recora use: sample score, query count, source count, recommendation count.

## MiniBarChart

- Purpose: compact comparison.
- Look: label, bar, value/status.
- Tailwind: bar track `h-2 rounded-full bg-slate-100`, fill `h-2 rounded-full bg-emerald-800`.
- Avoid: color-only meaning, exact decimals.
- Recora use: competitor gap, source type, visibility sample.

## MiniLineChart

- Purpose: subtle trend shape in mock.
- Look: tiny SVG path, no heavy axes.
- Tailwind/SVG: `h-10 w-full text-emerald-800` with simple polyline/path.
- Avoid: implying continuous measurement unless Product Truth confirms.
- Recora use: sample activity trend, mock texture.

## RankingList

- Purpose: show comparative rows.
- Look: rank, name, bar, status chip.
- Tailwind: `space-y-3`, row `grid grid-cols-[auto_1fr_auto] items-center gap-3`.
- Avoid: unsupported real rankings.
- Recora use: competitor ranking mini card.

## AnswerLogCard

- Purpose: abstract AI answer observation.
- Look: neutral card, sample label, text lines, tags, source chips.
- Tailwind: `rounded-xl border border-slate-200 bg-white p-4`.
- Avoid: mimicking provider UI.
- Recora use: AI answer log mini card, sample report.

## SourceDomainCard

- Purpose: show source/citation domain list.
- Look: domain rows, type chips, support status.
- Tailwind: row `flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0`.
- Avoid: treating source presence as claim support.
- Recora use: cited sources, source-to-claim area.

## ProductBrowserFrame

- Purpose: polished product preview wrapper.
- Look: browser toolbar, sample pill, inner dashboard.
- Tailwind: `overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]`.
- Avoid: fake URL or provider branding.
- Recora use: hero large dashboard mock.

## DashboardSidebar

- Purpose: product navigation inside mock.
- Look: narrow rail or sidebar with active item.
- Tailwind: `w-44 border-r border-slate-100 bg-slate-50/70 p-3`.
- Avoid: too many nav items or unsupported integrations.
- Recora use: large dashboard mock.

## ReportPreviewCard

- Purpose: sample report deliverable preview.
- Look: paper-like white panel with score cards, table, method note.
- Tailwind: `rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.10)]`.
- Avoid: fake client proof.
- Recora use: sample report section.

## GradientCTA

- Purpose: premium final CTA background.
- Look: deep green or white section with radial accent, dot grid, R watermark, faint report silhouette.
- Tailwind: `relative overflow-hidden rounded-2xl bg-emerald-950 px-6 py-12 text-white sm:px-10 sm:py-16`.
- Avoid: flat green band, noisy pattern, new claims.
- Recora use: final CTA.

## FeatureCardWithMiniUI

- Purpose: turn feature card into product evidence.
- Look: title/copy plus mini table/bar/chips.
- Tailwind: `rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm`.
- Avoid: text-only cards.
- Recora use: feature cards, workflow cards, report capability cards.

## TabPanelCard

- Purpose: show meaningful product state switch.
- Look: tab group plus panel with mock content.
- Tailwind: tabs `inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1`, panel `mt-6 rounded-2xl border border-slate-200 bg-white p-5`.
- Avoid: decorative tabs with same content.
- Recora use: query/source/report/recommendation states.
- QA: active state must be visually clear, keyboard focus visible, and mobile labels must not wrap into unreadable fragments.
