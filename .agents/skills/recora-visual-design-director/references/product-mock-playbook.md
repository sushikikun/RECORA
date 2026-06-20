# Product Mock Playbook

Use this for Recora LP product mocks, dashboard previews, sample report slices, card mini UI, and data-dense visual proof.

Also load `external-design-pattern-bank.md` and `product-mock-blueprints.md` when the user asks for high-quality SaaS mock direction. External sources should inform hierarchy, density, accessibility, and chart honesty only; never copy their dashboards, copy, CSS, screenshots, logos, icons, or exact layout.

For external-skill-based review, also load `imported-product-mock-methods.md`. Prioritize its concrete density checks over abstract advice: topbar/sidebar, scope row, KPI, table/ranking/list, log/source/insight panel, and status strip.

## Product Mock Goal

The mock should make Recora feel real, operational, and trustworthy. It should show the shape of the product without pretending that unbuilt or unverified functionality is live.

## Recommended Dashboard Mock Hierarchy

1. App chrome: sidebar or top nav with Recora identity and selected section.
2. Page title: clear screen purpose, such as "AI Visibility Report" or "Sample Report".
3. Scope row: sample label, query set, check date, provider/status caveat where Product Truth allows.
4. KPI row: 3-4 compact score cards.
5. Main table or ranking: query, brand mention, competitor, citation/source, status.
6. Detail panel: answer excerpt, cited source, recommendation candidate, or diagnostic note.
7. Activity/log strip: latest check, review state, sample report status.

External-pattern additions:

- Add table/list ergonomics: aligned labels, readable row heights, status chips with text, and tabular numbers.
- Add service-design clarity: show scope, sample status, and method note near the data, not hidden in a footnote.
- Add interaction discipline: active tabs, filters, and button states must look usable even if the mock is static.

## Recora-Specific UI Objects

Use these instead of generic analytics filler:

- AI visibility score.
- Query group or prompt cluster.
- Brand mention status.
- Recommendation vs mention distinction.
- Competitor gap row.
- Cited source domain chip.
- Source-to-claim status.
- Sample report section.
- Recommendation candidate with review status.
- Evidence or method note.

## Sidebar Rules

- Keep the sidebar narrow, around 160-220px desktop mock width.
- Include 4-6 nav items max.
- Use one active item with deep green or green-tinted background.
- Avoid provider logos or integrations unless Product Truth confirms them.
- On small mocks, a top nav or collapsed icon rail may work better than a full sidebar.

## KPI Rules

- 3-4 KPIs are enough.
- Use strong numbers with small labels.
- Add tiny trend or status only when clearly sample or verified.
- Avoid fake precision such as 87.43 unless the method supports it.
- Label sample values calmly.

## Ranking / Table Rules

- Use fewer rows with stronger rhythm.
- Include compact status chips and horizontal bars.
- Align numbers and labels.
- Use alternating subtle backgrounds only if helpful.
- Do not use tiny 10px text for meaningful row content.

## Logs / Source / Citation Panel

- Include source chips, URL/domain fragments, or citation status when relevant.
- Show "unknown" or "not reviewed" states honestly.
- Separate source presence from source support.
- Avoid implying citation count proves recommendation impact.

## Card Mini UI Patterns

Add one visual data object per card:

- status row.
- horizontal comparison bar.
- 3-item ranking.
- source chip row.
- score pill plus method note.
- tiny table.
- log timeline.
- sample answer excerpt with highlighted brand/competitor labels.

## Visual Styling Defaults

- Outer mock radius: 16-24px for the mock frame, or match local system.
- Inner cards: 8-12px.
- Border: 1px solid neutral or green-tinted neutral.
- Shadow: subtle large shadow for the main mock only; inner surfaces mostly use borders.
- Padding: mock chrome 12-18px, panels 16-24px.
- Gap: 12-20px inside mock.
- Text: meaningful labels 12px or larger; body/row text 12-14px; numbers 20-32px depending on scale.
- Background: white main surface, pale green or neutral page chrome.

## Sample Label Rules

- Required when values are sample, fictional, preview, or not measured.
- Place in the mock toolbar, scope row, top-right corner, or method caption.
- Good labels: "サンプル", "参考表示", "サンプル分析", "表示例".
- Bad labels: giant overlay, hidden footnote, or label that sounds like confirmed customer result.
- If Product Truth does not confirm provider connection, use "対象例" or "表示例" rather than "接続済み".

## Avoid Unsupported Product Implications

Do not show these as real unless Product Truth confirms:

- connected ChatGPT, Gemini, Perplexity, Claude, or other provider badges.
- live monitoring.
- automatic collection.
- automatic improvement.
- scheduled crawling.
- login-ready dashboard.
- real customer account data.
- testimonials, adoption counts, or outcome metrics.

## Product Mock Review Questions

- Would a buyer believe this is a credible SaaS product screen?
- Can the buyer understand what decision the screen supports?
- Does the mock contain Recora-specific product objects?
- Does sample labeling prevent misunderstanding?
- Is the mock readable on desktop and still meaningful on mobile?
- Does it feel calmer and more refined than a generic AI template?
- Which external pattern references were used, and were they adapted without copying?
- Which Product Mock Blueprint should replace or refine the current mock?
