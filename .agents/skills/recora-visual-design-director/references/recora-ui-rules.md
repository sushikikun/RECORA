# Recora UI Rules

Use these rules as Recora-specific constraints for visual design review and implementation prompts.

## Brand Direction

- Recora is a Japanese BtoB SaaS product. The visual tone should be refined, trustworthy, calm, and product-led.
- Use green as the main brand direction, but do not flood the UI with green. Pair deep green with white, neutral gray, and restrained mint accents.
- Keep backgrounds mostly white or very pale neutral. Avoid heavy dark-blue, purple AI-gradient, beige, brown, or one-note green palettes.
- Recora should look operational and credible, not like a generic AI template.

## Color Semantics

- Primary CTA: deep green.
- Positive or owned-brand cues: green or deep green.
- Neutral data and UI chrome: gray, slate-neutral, or soft green-gray.
- Warning or risk: amber or red only when the meaning is truly warning/risk.
- Competitor, third-party source, and self-brand colors must not be mixed casually. Define what each color means before recommending changes.
- Active tabs and selected states should have a clear semantic role, not decoration.

## Product Truth Rule

- Before reviewing or rewriting LP copy, UI labels, product mocks, report wording, CTA text, or sample data, check `docs/recora-product-truth.md` if it exists.
- If the file exists, treat it as the product claim boundary and mention that it was checked.
- If the file does not exist, mark product truth as `NEEDS_VERIFICATION` and avoid strong product capability claims.
- Do not infer real product readiness from visual mockups, TODOs, names of components, or desired future roadmap.

## Claims To Avoid Unless Product Truth Confirms Them

Do not imply any of these as production-ready without evidence:

- AI API connections are already active.
- ChatGPT, Gemini, Perplexity, or Claude are fully supported.
- Continuous measurement, real-time monitoring, automatic collection, automatic improvement, or scheduled crawling is active.
- Free mini-check submission immediately starts a real analysis.
- Users can log in and use the product immediately.
- Customer logos, number of customers, adoption counts, testimonials, ROI, traffic lift, ranking lift, AI citation lift, or revenue impact.
- Recommendations are guaranteed to improve AI citations, search rankings, traffic, conversions, or revenue.

## Sample Display Rules

- Sample data must be marked as sample or reference display.
- The label should be visible but calm: small pill, corner label, toolbar label, or caption.
- Avoid giant "SAMPLE" overlays that make the product feel fake.
- Do not mix sample data with claims that look like measured customer results.
- Prefer labels such as "サンプル", "参考表示", "サンプル分析", or "表示例" depending on context.

## Product Mock Rules

- Product mocks should use Recora's actual or plausible product objects, not generic analytics filler.
- Include hierarchy: sidebar or header, page title, KPI summary, main table/ranking, source/citation/log panel, and recommendation or next action.
- Keep the mock credible. Do not show unbuilt integrations as connected providers unless the product truth file says they exist.
- When showing provider names, use careful wording such as "対象例" or "表示例" if support is not confirmed.
- A mock should sell product confidence through structure and clarity, not through fake metrics.

## Dashboard Consistency

- LP product mocks, dashboard UI, sample reports, and forms should share color, radius, border, shadow, typography, and spacing logic.
- Report screens should feel exportable and client-safe, not like internal debug panels.
- Form screens should feel low-friction and honest about what happens after submission.
- CTA, tabs, score pills, and status chips should use consistent styles across LP and app surfaces.

## Implementation Safety

- Review first. Do not change files without explicit user approval.
- If implementation is approved, limit edits to the approved files and stated scope.
- Implementation prompts must include: "commit / push 禁止".
- Preserve existing product facts and avoid introducing unverified claims while polishing UI.
