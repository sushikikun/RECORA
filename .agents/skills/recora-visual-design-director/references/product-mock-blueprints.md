# Product Mock Blueprints

Use these blueprints when directing Recora LP, Dashboard, Sample Report, feature-card mini UI, or final CTA product proof. Choose one blueprint, then specify allowed sample content, forbidden implications, desktop layout, mobile reduction, and Tailwind structure.

For external-skill-based direction, pair every blueprint with a method from `imported-product-mock-methods.md`: believable hierarchy, card density rule, fake-data realism vs sample clarity, mini UI purpose, dashboard screenshot illusion, or mobile crop strategy.

## Shared Guardrails

- Product Truth first: check `docs/recora-product-truth.md` if it exists.
- Values are sample unless verified. Use `サンプル`, `表示例`, or `参考表示`.
- Do not show connected ChatGPT, Gemini, Perplexity, Claude, real-time monitoring, automatic improvement, live crawling, or login-ready operation unless Product Truth confirms it.
- Do not mimic provider UI or reference-site dashboards.
- Keep meaningful text 12px or larger in the visible mock.
- If mobile cannot show the full mock, show a cropped excerpt or stacked summary.

## Blueprint A: Hero Product Console

- Use: first viewport and first product-proof section.
- Purpose: prove Recora is a real BtoB SaaS product before the buyer scrolls.
- Layout: browser frame, narrow sidebar/top nav, toolbar with sample pill, KPI row, main ranking/table, right insight/source panel, bottom recommendation/status strip.
- Allowed content: AI visibility sample score, query group, brand mention status, competitor gap, source domain, recommendation candidate, review status.
- Tailwind: outer `max-w-6xl lg:max-w-7xl rounded-2xl border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]`; inner grid `lg:grid-cols-[180px_1fr_280px] gap-4`.
- Mobile: replace sidebar with top rail; show KPI pair plus 3-row ranking and one source card.
- Avoid: fake URLs, provider badges, precise performance percentages, customer names.

## Blueprint B: Sample Report Proof

- Use: sample report section, downloadable/report preview, sales proof area.
- Purpose: make the deliverable feel shareable and client-safe.
- Layout: paper frame, report header, scope row, KPI blocks, competitor/source table, method note, next action.
- Allowed content: sample query count, sample source examples, visibility status, recommended next section.
- Tailwind: `max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.10)]`.
- Mobile: stack KPI blocks, show a clipped table excerpt, keep method note visible.
- Avoid: client logos, real-looking signatures, fake testimonials, exact ROI/outcome numbers.

## Blueprint C: Feature Card Mini Product UI

- Use: feature cards and benefit sections.
- Purpose: prevent cards from becoming paragraph-only boxes.
- Layout: heading/copy plus one mini UI object: mini table, source list, answer log, heatmap, ranking, or KPI pair.
- Allowed content: three sample rows max, simple status chips, short labels.
- Tailwind: card `rounded-xl border bg-white p-5 sm:p-6 shadow-sm`; inner UI `mt-5 rounded-lg border bg-slate-50/70 p-3`.
- Mobile: keep card compact; no dense spreadsheet; one card should not exceed the screen by itself unless content truly requires it.
- Avoid: tiny illegible chart labels, long prose, unsupported provider names.

## Blueprint D: Dashboard Detail Panel

- Use: dashboard preview, tab panels, product mock right rail.
- Purpose: show analysis depth without overwhelming the hero.
- Layout: selected query row, answer excerpt, brand/competitor tags, source domain chips, recommendation status, method note.
- Allowed content: abstract answer excerpt, source type, `未確認` or `レビュー待ち` status when appropriate.
- Tailwind: `rounded-xl border border-slate-200 bg-white p-4`; rows `space-y-3`; chips `flex flex-wrap gap-2`.
- Mobile: move detail panel below table and shorten excerpt to 2 lines.
- Avoid: mimicking ChatGPT/Gemini/Claude/Perplexity UI or claiming source support from source presence alone.

## Blueprint E: Final CTA Product Echo

- Use: final CTA background.
- Purpose: leave a premium memory of the product while keeping the action clear.
- Layout: deep green or white CTA section, faint report/dashboard silhouettes, dot grid, R watermark, single primary CTA.
- Allowed content: no new claims; optional sample report silhouette with calm label.
- Tailwind: section `relative overflow-hidden rounded-2xl px-6 py-12 sm:px-10 sm:py-16`; assets absolute with `opacity-10` to `opacity-20`.
- Mobile: reduce decorative layers and keep CTA/control area uncluttered.
- Avoid: flat green band, fake proof metrics, external screenshot copy, noisy animation.

## Blueprint Selection Rules

- Hero feels generic: choose Blueprint A.
- Product deliverable feels abstract: choose Blueprint B.
- Feature section is text-only: choose Blueprint C.
- Mock needs credible depth: choose Blueprint D.
- Final CTA feels cheap: choose Blueprint E.
