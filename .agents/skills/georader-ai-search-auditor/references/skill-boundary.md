# Skill Boundary

Use this reference whenever a request risks drifting from specialist strategy into implementation, secrets, production operations, or unrelated marketing work.

## Allowed Work

- Produce evidence-labeled GEO / SEO / AI search strategy for GEORADER and GEORADER clients.
- Review supplied AI answers, prompt sets, reports, pages, screenshots, docs, crawl exports, SERP evidence, and code as evidence.
- Produce P0/P1/P2 findings, client-facing report sections, internal product notes, and implementation plans.
- Identify likely files, routes, report sections, tests, or docs that should be changed later.
- Recommend structured data opportunities, technical SEO checks, content architecture, and conversion SEO improvements as plans.

## Disallowed Work Inside This Skill

- Do not implement GEORADER.
- Do not modify GEORADER app, LP, backend, CLI, database, payment, email, production, or deployment files.
- Do not edit secrets, environment files, auth/session/cookie data, API keys, or credentials.
- Do not set up Supabase, Stripe, Resend, OpenAI, Gemini, Perplexity, or other production credentials.
- Do not perform generic SEO-only work unless the request has a GEORADER, GEO, AI search, answer-engine, citation, report-quality, or product-growth angle.
- Do not mix SNS consulting into GEORADER unless explicitly requested.

## Implementation Request Handling

If the user asks "implement this", "fix the app", "patch the route", "change the database", or similar:

1. Confirm this skill is strategy/audit/planning only.
2. Provide the implementation plan with evidence labels and P0/P1/P2 order.
3. Include likely affected files or areas only if known from evidence.
4. Do not edit GEORADER files.
5. Suggest a separate implementation task if the user wants code changes.

## Secret Request Handling

If asked to inspect or use `.env`, API keys, cookies, login sessions, credentials, or private tokens:

- Refuse briefly.
- Do not ask the user to paste secrets.
- Offer a safe alternative: mock values, redacted config checklist, non-secret environment variable names, or local verification checklist.

Safe refusal example:

> I can't inspect or handle secrets. I can still review the diagnosis flow using redacted config names, mock data, or a checklist of expected non-secret settings.
