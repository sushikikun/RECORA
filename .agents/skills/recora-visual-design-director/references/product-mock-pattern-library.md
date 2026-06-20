# Product Mock Pattern Library

Use this to choose concrete product mock patterns for Recora LP, Dashboard, Sample Report, feature cards, and final CTA surfaces.

For implementation-ready direction, cross-check with `product-mock-blueprints.md`. Use external-source lessons only as abstract dashboard/product-proof patterns: enterprise density, status semantics, accessible tabs, readable charts, and mobile simplification.

## A. Hero Large Dashboard Mock

- Use: Hero or first product proof section.
- Purpose: Make Recora feel like a real SaaS product immediately.
- Layout: browser frame, sidebar/top nav, KPI row, ranking/table center, source/log panel right, recommendation footer.
- Information: sample scope, query group, visibility score, competitor gap, cited source, recommendation status.
- Tailwind size: `max-w-6xl lg:max-w-7xl`, min height 420-560px desktop, 300-380px tablet.
- Spacing: outer `p-3 sm:p-4`, inner gap `gap-3 sm:gap-4`.
- Border: `border border-slate-200`.
- Shadow: one strong but soft outer shadow; inner surfaces mostly borders.
- Sample rule: sample pill in toolbar or scope row.
- Do not: show unconfirmed provider badges, tiny unreadable text, or real customer metrics.
- External pattern references: Carbon/Ant/Tremor-style dashboard hierarchy, Vercel-style overflow/focus discipline, but no copied component code or visual identity.

## B. Feature Card Mini Table

- Use: feature cards, problem/solution cards, report capability cards.
- Purpose: Add product evidence inside cards.
- Layout: title, 3-row mini table, status chips, tiny note.
- Information: query, status, source, action.
- Tailwind size: card `p-5 sm:p-6`; table rows `py-2.5`.
- Spacing: compact but readable; no text under 12px.
- Border: `border-slate-200`, row separators `border-slate-100`.
- Shadow: subtle or none.
- Sample rule: small caption "sample rows".
- Do not: turn card into a dense spreadsheet.
- External pattern references: shadcn/Tailwind-style recipe structure and Primer-like compact clarity, adapted to Recora green.

## C. Competitor Ranking Mini Card

- Use: competitor gap sections and card mini UI.
- Purpose: Show comparative structure without fake proof.
- Layout: 3-4 ranked rows with bar, status chip, label.
- Information: target company, competitor examples, sample score/status.
- Tailwind size: row height 36-44px.
- Spacing: `space-y-3`.
- Border: card border; bars no border unless needed.
- Shadow: minimal.
- Sample rule: sample label beside title.
- Do not: claim real rank or market dominance without evidence.
- External pattern references: data-viz ranking logic from chart libraries, but use rounded sample values and labels.

## D. AI Answer Log Mini Card

- Use: AI answer analysis section, report preview, feature card.
- Purpose: Represent answer excerpt structure without copying provider UI.
- Layout: abstract answer card, 2-3 text lines, highlighted tags, source chips.
- Information: sample prompt category, brand mention, competitor mention, citation/source.
- Tailwind size: `rounded-xl p-4`.
- Spacing: text lines `space-y-2`, chips `gap-2`.
- Border: neutral border.
- Shadow: none or very soft.
- Sample rule: "AI answer sample" or "表示例".
- Do not: mimic ChatGPT/Gemini/Claude/Perplexity UI.
- External pattern references: accessibility and content-resilience rules; no provider UI mimicry.

## E. Source Domain Mini Card

- Use: citation/source section and sample report preview.
- Purpose: Show where AI answers appear to rely on information.
- Layout: domain rows with type, status chip, small bar.
- Information: domain, source type, support status, last reviewed/sample note.
- Tailwind size: row `py-3`.
- Spacing: `gap-3`.
- Border: row separators.
- Shadow: none.
- Sample rule: if not verified, mark "not reviewed" or sample.
- Do not: treat URL presence as claim support.

## F. Persona Heatmap Mini Card

- Use: buyer/persona insight section.
- Purpose: Show different buyer criteria without copying reference UI.
- Layout: 3x3 or 3x4 heatmap with labels.
- Information: persona/criteria rows, visibility or fit levels columns.
- Tailwind size: cells min 44px desktop, 38px mobile.
- Spacing: grid gap `gap-1.5`.
- Border: subtle grid or rounded cell backgrounds.
- Shadow: none.
- Sample rule: label as sample criteria map.
- Do not: use color alone; include text or labels.

## G. Sample Report Preview

- Use: sample report section and final proof area.
- Purpose: Make report deliverable feel concrete and shareable.
- Layout: paper frame, header, scope row, KPI cards, table, notes, footer.
- Information: sample report title, query count/sample, source examples, recommended next action.
- Tailwind size: `max-w-4xl`, paper ratio close to A4 but responsive.
- Spacing: paper `p-6 sm:p-8`.
- Border: `border-slate-200`.
- Shadow: soft page shadow.
- Sample rule: prominent but calm "Sample Report" pill.
- Do not: add fake client logos, testimonials, or outcome numbers.

## H. Final CTA Background Mock

- Use: final CTA.
- Purpose: Add product memory and premium finish behind the action.
- Layout: CTA copy foreground, faint report/dashboard silhouettes, dot grid, R watermark.
- Information: no new product claims; optional sample report silhouette.
- Tailwind size: section `py-16 sm:py-20`, inner `max-w-6xl`.
- Spacing: generous but not empty.
- Border: optional top border or rounded container.
- Shadow: subtle background depth only.
- Sample rule: if silhouettes contain data, include sample label.
- Do not: use a flat green band, external screenshot, or unsupported proof.
- External pattern references: product echo and service clarity; CTA remains the main focus.
