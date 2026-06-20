# Design Principles

Use these principles to review and direct Recora LP, dashboard, report, and form UI. Treat values as starting points, then adapt to the existing codebase and viewport.

## BtoB SaaS LP Visual Hierarchy

- Lead with a clear product promise, then show the product. The first viewport should make Recora's category and use case obvious within 3 seconds.
- Keep the visual hierarchy calm: H1, short supporting copy, primary CTA, secondary proof or caveat, and a strong product mock.
- Avoid stacking many equal-weight cards above the fold. One dominant mock plus a few compact evidence cues usually feels more premium.
- Make section rhythm visible: intro, product evidence, use cases, workflow, sample report, FAQ, final CTA.
- Prefer fewer, sharper claims over many vague AI/GEO buzzwords.

## Hero Design

- Avoid an unnatural left-copy/right-empty-mock split. The mock should feel like the hero's co-star or main stage.
- H1 should be compact and readable in Japanese. As a default: desktop 44-56px, mobile 30-36px, line-height 1.12-1.25.
- Keep hero body copy short: 1-2 lines desktop, 2-4 lines mobile.
- Put the primary CTA in the first viewport. Secondary CTA can be quieter.
- Use one or two trust cues below the CTA, but do not invent customer logos, metrics, or outcomes.
- The hero should hint at the next section on both mobile and desktop. Avoid a first viewport that feels like a sealed poster.

## Product Mock Design

- Make the mock look like a real SaaS screen: horizontal composition, left navigation, page title, KPI row, ranked list or table, source/citation/log area, and a clear active state.
- Do not make mock text so small that it becomes noise. Use fewer rows with stronger visual rhythm instead of many unreadable rows.
- Show Recora-specific objects: AI visibility, query group, brand mention, citation/source, competitor comparison, recommendation candidate, sample report state.
- Mark sample data with a small label such as "サンプル" or "参考表示" inside the mock chrome or corner. It must prevent misunderstanding without dominating the design.
- Avoid implying live integrations or unbuilt functionality. Use neutral labels like "サンプル分析", "参考スコア", or "未接続の表示例" when needed.

## Card Design

- A card should not be only a paragraph box. Add a small UI object: mini table, horizontal bar, tag row, score pill, ranking row, sparkline-like line, source chips, or status log.
- Keep card style consistent: 8px radius or local design-system radius, subtle border, restrained shadow, and predictable padding.
- Default card padding: 20-28px desktop, 16-20px mobile.
- Avoid too many same-sized cards. Use one featured card plus supporting compact cards when possible.
- Use density deliberately: enough visual data to feel product-led, enough whitespace to scan comfortably.

## CTA Design

- Primary CTA should be visually unambiguous: deep green background, white text, clear hover/focus state, and strong but not oversized padding.
- Secondary CTA should be outline or text style, not a second competing filled button.
- CTA labels should describe the action honestly. Avoid wording that implies analysis starts automatically if the current flow only submits an inquiry or mini-check request.
- Final CTA should restate the practical next step, not introduce new unverified promises.

## Japanese Typography

- Use clear hierarchy: H1, H2, body, UI labels, captions, and numeric values should not compete.
- Japanese H1/H2 should not feel like a heavy poster unless the page intentionally has editorial branding. BtoB SaaS usually benefits from calmer weight and tighter text length.
- Avoid awkward Japanese line breaks. Prefer manual line breaks only where they preserve semantic chunks.
- Keep body copy concise. Long paragraphs make the page feel like a template with text poured into it.
- Avoid text below 12px for meaningful UI. Captions can be 12-13px; normal UI labels often need 13-14px.
- Numeric values should be visually strong: tabular numerals where available, enough contrast, and clear labels.

## Spacing And Density

- Use white space to frame priority, not to create emptiness. If a section feels sparse, add product detail rather than increasing decorative elements.
- Default section padding: 72-112px desktop, 48-72px tablet, 40-56px mobile.
- Hero can use larger spacing, but product mock and CTA must remain visible.
- Keep grid gaps controlled: 20-32px desktop, 16-20px mobile.
- Avoid nested cards and floating page sections. Use full-width bands or unframed sections with constrained inner content.

## Mobile Design

- Check 375px width as a baseline.
- Avoid horizontal scrolling from product mocks, tab lists, tables, or long labels.
- H1 should stay readable without taking the whole first screen.
- CTA should be reachable early and use full-width or comfortable tap targets where appropriate.
- Product mock may become a cropped but intentional preview, a simplified stacked mock, or a scroll-safe screenshot-like block. It should not shrink into unreadable dust.
- Tabs should be touchable, either wrapping cleanly or using an accessible horizontal scroll with visible affordance.
- Cards should not become a very long wall of repeated blocks; combine or compress where possible.
