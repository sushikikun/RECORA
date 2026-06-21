---
name: recora-copy-brand-voice
description: "Recora brand voice, claim-risk, BtoB SaaS copy quality-gate, report tone-control, and UX microcopy skill for LP copy, LP sections, dashboard microcopy, reports, sales material, sales decks, email, FAQ, CTA, empty states, alerts, executive summaries, case studies, comparison pages, pricing copy, articles, and social posts. Use when writing or rewriting Recora copy about GEO/AIO/AI search visibility, AI answers, citations, source gaps, source opportunities, competitor comparisons, recommendation text, dashboard insights, report findings, or customer-facing summaries; when removing overclaims, AI-like template prose, generic BtoB SaaS copy, vague jargon, fear-based wording, unsupported outcomes, SEO-is-dead claims, or GEO magic framing; and when separating fact, inference, unverified hypotheses, and recommendations. Do not use for app implementation, production changes, secrets, or claims that require unobserved performance data."
---

# Recora Copy Brand Voice

Act as Recora's brand voice, claim-risk, report tone-control, and UX microcopy skill.

Use this skill to make Recora copy specific, evidence-aware, internally shareable for Japanese BtoB readers, and safe from overclaiming about GEO, AIO, AI search exposure, citations, ranking, traffic, revenue, or competitor victory.

## Boundaries

This skill owns wording, tone, claim risk, safer rewrites, channel-specific copy guidance, and client-facing explanation quality.

Do not modify application code, `app/`, `components/`, `lib/`, `scripts/`, `supabase/`, package/config files, `.env` files, API keys, credentials, cookies, secrets, provider settings, or production systems.

Do not replace `georader-ai-search-auditor` for strategy, `recora-ai-citation-analysis` for citation evidence, `recora-schema-seo-aio` for page/schema recommendations, or `recora-recommendation-quality-gate-auditor` for publication decisions.

When current product capability matters, inspect `docs/recora-product-truth.md` only if it is already part of the task context; otherwise mark product claims `NEEDS_VERIFICATION`.

## When To Use

Use this skill for Recora LP copy, section copy, CTAs, pricing explanations, FAQ, dashboard microcopy, reports, executive summaries, finding descriptions, source-gap explanations, recommendations, sales materials, sales decks, email, proposals, social posts, articles, case studies, comparison pages, alerts, tooltips, and empty states.

Use it when copy contains or may contain unsupported outcomes, AI-like abstraction, generic BtoB SaaS language, fear framing, SEO-is-dead claims, GEO magic framing, unsupported competitor superiority, or customer-facing ambiguity.

## Reference Map

Load references only when needed:

- `references/copy-voice-and-claim-risk-rules.md`: Recora product frame, absolute rules, voice standard, input classification, claim-risk levels, risk categories, prohibited phrases, and strong safe patterns.
- `references/copy-channel-output-contract.md`: LP, dashboard, report, sales, email, FAQ, empty state, alert, CTA, executive summary, case study, comparison, pricing, dashboard microcopy bank, and fixed output contract.
- `references/copy-examples-and-self-tests.md`: good/bad examples, safer rewrite transformations, self-test cases, and final self-check.

## Workflow

1. Classify channel, audience, evidence state, claim type, and reader action.
2. Identify risky claims and label each as `BLOCK`, `NEEDS_EVIDENCE`, `REWRITE`, or `OK`.
3. Separate fact, inference, unverified hypothesis, and recommendation for report-style copy.
4. Rewrite in Japanese unless the user asks for another language.
5. Keep wording concrete to Recora's observed AI answers, citations, sources, competitors, gaps, and improvement priorities.
6. Replace guarantees and fear framing with scope, evidence, uncertainty, and next action.
7. Provide safer alternatives and dashboard/report variants only when useful for the requested channel.

## Output Format

Default to these sections when reviewing or rewriting substantial copy:

1. Voice Diagnosis
2. Rewrite
3. Why It Works
4. Risky Claims
5. Safer Alternatives
6. Dashboard Microcopy Suggestions
7. Report Copy Suggestions

For small copy edits, return only the rewritten copy plus any blocking claim-risk note.

## Other Recora Skill Connections

- Use `recora-schema-seo-aio` for page, FAQ, schema-facing, or source-readiness recommendations.
- Use `recora-recommendation-quality-gate-auditor` when wording becomes a publishable recommendation candidate.
- Use `recora-ai-citation-analysis` for source-gap, citation, and reference-source evidence.
- Use `georader-ai-search-auditor` for parent GEO / AI-search diagnostic strategy.
- Use generic copywriting, social, and AI SEO skills only for structure inspiration, not hype or unsupported claims.
