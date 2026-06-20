# Visual Asset System

Use this to propose Recora-owned visual materials for LP, Dashboard, and Sample Report surfaces. Do not fetch or copy external assets. Design assets must be reproducible with CSS, SVG, Tailwind, lucide-react icons, simple HTML structures, or the existing Recora logo.

## Global Rules

- Do not copy external images, text, CSS, HTML, logos, icons, trademarks, screenshots, or assets.
- Use Recora-owned primitives: CSS gradients, SVG patterns, Tailwind utilities, lucide-react icons, neutral UI chrome, and existing Recora logo treatment.
- Decoration must never become the main character. Product mock, report preview, or buyer action remains primary.
- Keep the tone refined Japanese BtoB SaaS: white, deep green, neutral gray, pale mint, restrained shadows.
- Visual assets must not hide or weaken sample labels.
- Do not use assets to imply unbuilt features, live providers, real monitoring, or measured customer outcomes.

## Background Gradient

Purpose:

- Add depth behind hero or final CTA without using stock AI art.

Recipe:

- White base.
- Pale green radial wash near the product mock.
- Subtle neutral gradient from white to slate/green-tinted white.
- Optional CSS mask fade.

Tailwind direction:

```txt
bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8faf9_100%)]
```

Rules:

- Keep saturation low.
- Avoid purple/blue AI gradients.
- Do not place busy gradients behind dense tables.

## Pale Dot Grid

Purpose:

- Add quiet technical texture to hero, CTA, or report background.

Recipe:

- CSS radial background with 1px dots.
- Low opacity, green-gray or slate.
- Mask edges so it does not look like a wallpaper.

Tailwind/CSS direction:

```css
background-image: radial-gradient(rgba(15, 118, 110, 0.16) 1px, transparent 1px);
background-size: 18px 18px;
mask-image: linear-gradient(to bottom, black, transparent);
```

Rules:

- Do not put dots under small UI text.
- Use behind empty space, not inside tables.

## R Icon Watermark

Purpose:

- Create Recora-owned identity without external illustration.

Recipe:

- Use existing Recora logo or simple letter `R` rendered as text/SVG.
- Place as a large low-opacity mark behind product mock or final CTA.
- Clip or mask so it feels architectural, not decorative clutter.

Rules:

- Opacity around 3-8 percent.
- Do not replace the main logo.
- Do not obscure sample labels or mock content.

## CTA Background Pattern

Purpose:

- Make final CTA feel designed without becoming a loud banner.

Recipe:

- Deep green base or white base with deep green CTA.
- Pale grid, soft radial accent, and faint browser/report card silhouettes.
- Optional diagonal hairline separators.

Rules:

- Keep copy and CTA legible.
- Avoid single flat green band.
- Do not add fake proof or urgency.

## Browser Frame

Purpose:

- Show product surface as a polished SaaS preview.

Recipe:

- Rounded outer frame.
- Top toolbar with three small dots, URL/status area, sample pill.
- Inner dashboard or report content.

Tailwind direction:

```txt
rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] overflow-hidden
```

Rules:

- Use browser frame for LP preview, not every card.
- Do not show real browser URLs unless true.

## Dashboard Frame

Purpose:

- Create a product-led hero or section visual.

Recipe:

- Sidebar or top nav.
- KPI strip.
- Ranking/table center.
- Source/log/recommendation panel.
- Sample label in toolbar or scope row.

Rules:

- Use realistic hierarchy, not random panels.
- Avoid provider icons unless Product Truth confirms them.

## Report Paper Preview

Purpose:

- Make Sample Report feel shareable and client-safe.

Recipe:

- White paper panel with subtle border.
- Report title, scope row, score cards, short table, method note.
- Optional page shadow and tiny page number.

Rules:

- Use "Sample Report" or "サンプル" label.
- Do not use real customer names or outcomes.

## Card Mini UI

Purpose:

- Prevent feature cards from becoming text-only boxes.

Recipes:

- Mini table.
- Horizontal bar.
- Ranking row.
- Source chip row.
- Status timeline.
- Small answer excerpt.
- 3-cell heatmap.

Rules:

- One mini UI object per card is often enough.
- Keep the mini UI readable at mobile sizes.

## Abstract AI Answer Card

Purpose:

- Represent AI answer observation without copying provider UI.

Recipe:

- Neutral card with "AI answer sample" label.
- 2-3 gray text lines.
- Highlighted brand/competitor tags.
- Source chips below.

Rules:

- Do not mimic ChatGPT, Gemini, Claude, or Perplexity UI.
- Do not show provider support as live unless confirmed.

## Competitor Ranking Bar

Purpose:

- Visualize relative mention/recommendation position as sample design.

Recipe:

- Rows with company label, sample tag, horizontal bar, status chip.
- Recora target in deep green, competitors in neutral/slate or amber when semantically justified.

Rules:

- Use sample values only unless measured evidence is supplied.
- Avoid precise real-looking decimals.

## Source Domain Bar

Purpose:

- Show cited/source domains as evidence shape.

Recipe:

- Domain chips or rows with source type, support status, and small bar.
- Use neutral colors for third-party sources.

Rules:

- Source presence is not claim support.
- Include unknown/not reviewed state where appropriate.
