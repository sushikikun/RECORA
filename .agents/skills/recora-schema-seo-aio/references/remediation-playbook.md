# Remediation Playbook

Research date: 2026-06-21

Purpose: define how to repair `recora-schema-seo-aio` when adversarial tests reveal weak reasoning, unsafe wording, or missing evidence discipline.

## Repair Workflow

1. Identify the failed behavior: metric confusion, overclaim, unsupported schema, source-gap oversimplification, generic advice, unsafe wording, missed quality gate, dashboard exposure, or missing `NEEDS_VERIFICATION`.
2. Record the test ID and exact unsafe output pattern.
3. Patch the smallest relevant reference first.
4. Add or adjust an adversarial case if the failure is not already represented.
5. Re-check `skill-eval-rubric.md` blocking failures and `decision-trees.md`.
6. Keep `SKILL.md` thin; only add routing when a new reference must be discoverable.

## Failure-To-Fix Map

| If this weakness occurs | Primary files to fix | What to add or tighten | Quality-gate trigger |
|---|---|---|---|
| Measurement confusion occurs | `measurement-taxonomy.md`, `advanced-aio-geo-principles.md` | Clarify definitions, required evidence, false positives, and report wording for visibility, mention, citation, recommendation, ranking, sentiment, and prompt classes. | Client-facing metrics, competitor benchmark, executive summary. |
| Schema overclaim occurs | `schema-decision-matrix.md`, `client-report-language-guide.md` | Add visible-content requirements, bad/good recommendation, validation method, and no-guarantee wording. | Any Review, AggregateRating, pricing, offer, feature, customer outcome, or competitor claim. |
| Source gap is oversimplified | `source-gap-resolution-playbook.md` | Add classification, owned-page action, third-party action, caveat, and evidence requirement. | Third-party evidence, PR, reviews, directory/profile, partner/customer proof. |
| Output is too generic | `page-audit-playbooks.md`, `implementation-handoff-templates.md` | Add page type, target section, evidence needed, internal links, source-gap connection, owner/control, and validation method. | Client-facing implementation recommendation. |
| Unsafe wording appears | `client-report-language-guide.md`, `unsafe-output-patterns.md` | Add unsafe phrase, safer replacement, required caveat, and related failure mode. | Any guarantee, certainty, superiority, revenue, traffic, ranking, or AI-citation wording. |
| Quality gate is missed | `skill-eval-rubric.md`, `aio-geo-failure-modes.md` | Add blocking failure, quality-gate handoff condition, detection signal, and corrected behavior. | Warning or Fail recommendation that could reach a client. |
| Dashboard/public indexation is mishandled | `page-audit-playbooks.md`, `decision-trees.md` | Tighten private-by-default rule, required product/security approval, noindex/sitemap checks, and public export conditions. | Any dashboard, private report, authenticated page, or user/client data surface. |
| Evidence is missing but not marked | `skill-eval-rubric.md`, `recommendation-falsifiability.md` | Add `NEEDS_VERIFICATION` trigger, dependency, evidence needed, validation method, and failure condition. | Missing crawl, index, source, rendered HTML, schema, AI-search, pricing, competitor, or review evidence. |
| Branded prompts inflate visibility | `measurement-taxonomy.md`, `advanced-aio-geo-principles.md`, `decision-trees.md` | Strengthen branded/non-branded split and report wording. | Visibility/ranking/competitor report. |
| Mention is counted as citation | `measurement-taxonomy.md`, `decision-trees.md` | Require cited URL and source-to-claim alignment before counting citation. | Citation KPI, source gap, client report. |
| Recommendation and ranking are mixed | `measurement-taxonomy.md`, `advanced-aio-geo-principles.md` | Add order-vs-endorsement distinction and examples. | Competitor comparison or recommendation report. |
| Sentiment is treated as visibility | `measurement-taxonomy.md`, `adversarial-test-cases.md` | Add sentiment-only report wording and visibility evidence requirements. | Brand health or executive summary. |
| Fake review/rating pressure appears | `schema-decision-matrix.md`, `unsafe-output-patterns.md`, `aio-geo-failure-modes.md` | Reject fake Review/AggregateRating and add legitimate evidence requirements. | Any review/rating schema proposal. |
| Competitor claims are unsupported | `page-audit-playbooks.md`, `client-report-language-guide.md`, `unsafe-output-patterns.md` | Require current sources, comparison scope, fit/non-fit, update date, and `NEEDS_VERIFICATION`. | Competitor pages, sales collateral, client report. |
| One-shot AI observation drives conclusion | `measurement-taxonomy.md`, `recommendation-falsifiability.md`, `aio-geo-failure-modes.md` | Add sample-bound wording, remeasurement plan, and failure condition. | Any AI visibility, recommendation, ranking, or sentiment conclusion. |

## Patch Size Rule

- Prefer one precise row, bullet, or decision-tree step over broad rewriting.
- Do not delete existing no-guarantee, no-spam, `NEEDS_VERIFICATION`, or dashboard privacy rules.
- Do not add scripts, app changes, credentials, external API calls, or production edits as remediation.
- If a fix requires implementation, create a handoff template entry rather than changing app code.

## Re-Test Checklist

After patching a weakness:

- Run the relevant adversarial test case again.
- Confirm the output separates SEO from AIO/GEO.
- Confirm schema, robots, sitemap, bot access, body structure, and third-party evidence are separated.
- Confirm missing evidence is marked `NEEDS_VERIFICATION`.
- Confirm unsafe wording is replaced with client-safe wording.
- Confirm quality-gate routing is present when needed.
