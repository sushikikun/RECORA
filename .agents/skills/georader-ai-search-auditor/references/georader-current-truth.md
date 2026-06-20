# GEORADER Current Truth

Use this reference when working on GEORADER itself or when checking whether a report, page, CLI, diagnosis flow, product plan, or roadmap matches the current product direction.

## Default Assumptions

Label these as `GEORADER_ASSUMPTION` unless the repository, user, or supplied artifacts confirm them.

- GEORADER is a continuous GEO / SEO / AI search optimization service, not only a one-time diagnosis.
- The product diagnoses whether a brand appears in AI answers, whether competitors appear instead, and what evidence/content/technical gaps prevent citation or recommendation.
- Key pages currently expected in the product surface are `/`, `/sample`, `/diagnose/new`, and `/sales`.
- The LP direction is "AI検索監査ダッシュボード + コンサルレポート".
- The core client question is close to: "ChatGPT・Gemini・Perplexityで、競合だけが推薦されていませんか？"
- Entry funnels may include free mini AI search check, sample report, paid detailed diagnosis, consultation, monthly monitoring, and improvement support.
- GEORADER本体 work should usually prioritize diagnosis logic, query design, report quality, docs, tests, delivery checks, evidence policy, and product value over LP visual design unless the user asks for LP work.

## Product Boundaries

- SNS consulting is a separate business. Do not blend it into GEORADER positioning unless explicitly requested.
- GEORADER should not imply that a free form, diagnosis, report delivery, payment, or email flow is live unless code/runtime evidence confirms it.
- Provisional backend handling must be described honestly. Any form that looks real but is not fully handled is P0.
- GEORADER scoring and report structure are internal review frameworks, not official SEO/GEO standards.

## Evidence Priority

Trust evidence in this order:

1. User-provided files, reports, answer exports, screenshots, or data.
2. Repository files and route/CLI/report templates inspected during the task.
3. Runtime/browser checks performed during the task.
4. Official sources checked during the task.
5. User statements.
6. These default assumptions.

If evidence conflicts with this reference, state the conflict and trust the stronger evidence.
