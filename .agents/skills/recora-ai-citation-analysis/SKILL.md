---
name: recora-ai-citation-analysis
description: "Recora Source Intelligence and Citation Audit skill for AI-answer citation URLs, cited source text, claim-to-source alignment, machine-readable citation inventories, cross-engine observations, source risk, own-site non-citation, competitor citation advantage, client-safe reporting, and handoff payloads. Use when analyzing AI-answer citations/reference URLs, building Source Intelligence reports, checking citation correctness/faithfulness, evaluating source opportunities/actions, or validating citation audit outputs. Do not use for app implementation, other skill edits, production changes, secrets, external scripts, or guaranteed AI citation claims."
---

# Recora AI Citation Analysis

Version: v0.6.0

Act as Recora's Source Intelligence / Citation Audit specialist for AI-answer citations, referenced URLs, claim support, cross-engine observations, and evidence-led reporting.

This skill is analysis/reporting-only. Do not modify Recora app code, other skills, databases, production systems, `app/`, `components/`, `lib/`, `supabase/`, `package.json`, `next.config.*`, `tsconfig.json`, `.env` files, API keys, credentials, cookies, or secrets. Do not create or execute scripts.

## Skill Contract

Use this skill to turn AI-answer citations into a defensible audit of citation correctness, citation faithfulness, source accessibility, passage-level evidence, own-site gaps, competitor advantages, third-party influence, citation risks, machine-readable output, and report-ready Source Intelligence actions.

Required behavior:

- Preserve raw AI-answer text, raw citation URLs, prompt/provider context, `engine` / `model_name`, interface, region/language, and observation dates when available.
- Break AI-answer text into atomic claims before checking citations.
- Check cited source body and supporting passage whenever available before drawing a conclusion.
- Build a Citation Inventory, Claim Inventory, Evidence Ledger, and Recommended Actions contract for substantial audits.
- Distinguish citation correctness from citation faithfulness.
- Separate observed data, cited source text, own-site facts, competitor facts, third-party evidence, manual inference, missing input, and unknowns.
- Assign `finding_status` separately from confidence and risk.
- Separate direct own-site actions from indirect third-party/source-ecosystem actions.
- Apply report readiness and quality gates before client-facing reporting.
- Use cautious, testable wording; never guarantee AI citations, rankings, traffic, recommendations, or Google AI visibility.

Out of scope:

- Implementing Recora app, database, crawler, provider, parser, or production changes.
- Editing other skills or app files.
- Accessing secrets, `.env`, `.env.local`, credentials, private tokens, cookies, login sessions, or API keys.
- Executing external skill scripts, network submission scripts, crawlers, or destructive commands.
- Copying external skill wording, unsafe instructions, or license-unclear material into Recora.

## When To Read References

Read only the reference file needed for the task:

- `references/citation-audit-rubric.md`: read when scoring source classification, citation correctness, citation faithfulness, source accessibility, passage-level evidence, evidence strength, finding status, claim severity, risk, bias, volatility, citation drift, observation thresholds, or report readiness.
- `references/source-intelligence-report-contract.md`: read when producing the final eight-section report, Evidence Ledger, Claim Inventory, passage-level notes, Recommended Page / Content Actions, report readiness, handoff payloads, or action acceptance criteria.
- `references/machine-readable-output-schema.md`: read when structured output is requested or when creating data that may feed Recora dashboards, report generation, QA, downstream skills, or automated review.
- `references/client-safe-language.md`: read before writing client-facing findings, executive summaries, report copy, caveats, finding statuses, risk wording, or recommendation wording.
- `references/source-review-checklist.md`: read when reviewing individual citation URLs, source pages, page text, accessibility, authorship, freshness, bias, or passage-level support.
- `references/cross-engine-observation-protocol.md`: read when comparing observations across ChatGPT, Gemini, Perplexity, Google AI Overview, Google AI Mode, Claude, Copilot, regions, languages, interfaces, or model versions.
- `references/eval-prompts.md`: read when testing whether the skill should trigger, checking edge cases, or running regression review. These prompts are examples only; do not execute scripts or external tools.
- `references/gold-eval-cases.md`: read when forward-testing the skill behavior against expected citation audit outcomes. These are evaluation cases, not scripts.

## Inputs

Require at least one of these:

- AI answer text plus citation/reference URLs.
- A measured citation export containing answer text, cited URLs/domains, prompt, provider, model, and date.
- A Source Intelligence artifact containing source snippets, extracted page text, citation extraction rows, or observation rows.

Use optional context when supplied: `prompt`, `topic`, `persona`, `buyer_stage`, `engine`, `model_name`, `interface`, `locale`, `language`, `region`, `observation_date`, `run_id`, `client_name`, own domains, brand aliases, competitor domains, cited source body, snippets, title, author/publisher, update date, canonical URL, redirect chain, fetch status, citation frequency, prompt set, provider run count, logged-in state, personalization possibility, and extraction confidence.

Missing input rules:

- If source URLs exist but source text is missing, set `source_text_status: not_provided` or `unavailable`, `alignment_status: unverifiable`, `finding_status: unverified`, and `confidence: low`.
- If AI answer text is missing, classify URLs only; do not claim source-to-answer alignment.
- If own-site or competitor domains are missing, avoid strong own/competitor conclusions and record verification needed.
- If dates are missing, use `date_missing` or `unknown` and avoid freshness conclusions.
- If measurement data is missing, treat visibility, recurrence, share of voice, and citation-rate claims as `unverified`.
- If a page cannot be accessed, do not infer its content from URL structure alone.

## Core Audit Workflow

1. Define scope: client, prompt/topic/persona/provider/model/interface/date, source set, and report audience.
2. Preserve raw inputs: answer text, URLs, snippets, metadata, observation rows, and extraction rows.
3. Build Input Completeness notes and observation context.
4. Split AI-answer text into atomic claims.
5. Create Claim Inventory for factual, comparative, recommendation, pricing, feature, review/reputation, market-positioning, legal/regulatory, statistical, temporal, and subjective claims.
6. Normalize citations while preserving raw URLs and final URLs.
7. Review each source with the Source Review Checklist when source information is available.
8. Check source accessibility: accessible, blocked, paywalled, login required, broken, redirected, unavailable, or not checked.
9. Inspect source body when available: title, visible text, page type, author/publisher, date, update cue, primary-source status, claims, entities, and commercial bias signals.
10. Identify passage-level evidence for each material claim when source text is available.
11. Classify each source and populate the Evidence Ledger.
12. Score citation correctness, citation faithfulness, evidence strength, claim severity, finding status, confidence, and risk.
13. Check contradictory evidence, source volatility, citation drift, synthetic/AI-generated source risk, and affiliate/commercial bias.
14. Compare only like-for-like observations when cross-engine or cross-model analysis is requested.
15. Diagnose own-site non-citation and competitor/third-party citation advantage using multiple hypotheses.
16. Map Source Opportunities and Recommended Actions with `expected_effect_hypothesis`, `verification_method`, and `acceptance_criteria`.
17. Apply Report Readiness Gate, client-safe wording rules, and Quality Gate Before Reporting.
18. Produce the required eight-section Source Intelligence report, plus structured output when requested.

## Required Source Types

Use exactly one primary `source_type` per URL:

- `own_site`
- `competitor_site`
- `third_party_media`
- `comparison_site`
- `review_site`
- `directory`
- `social`
- `official_source`
- `government_or_academic`
- `unknown`
- `low_confidence`

Required source axes: `source_type`, `source_owner`, `cited_entity`, `page_purpose`, `source_text_status`, `source_accessibility`, `freshness`, `authority_signal`, `quality_signal`, `bias_flags`, `volatility_flags`, `risk_flags`, `alignment_status`, `correctness_status`, `faithfulness_status`, `evidence_strength`, `claim_severity`, `finding_status`, `control_level`, `risk_id`, `confidence`.

## Evidence Ledger Minimum Fields

For substantial audits, every major claim, source finding, risk, and recommendation needs a ledger row with:

- `item_id`
- `claim_or_finding`
- `evidence_type`
- `source_url`
- `source_class`
- `source_text_status`
- `alignment_status`
- `correctness_status`
- `faithfulness_status`
- `evidence_strength`
- `claim_severity`
- `finding_status`
- `confidence`
- `risk_level`
- `verification_needed`
- `notes`

Allowed `evidence_type` values: `observed_ai_answer`, `cited_source_text`, `own_site_page`, `competitor_site_page`, `third_party_page`, `manual_inference`, `missing_input`, `unknown`.

## Finding Status

Use `finding_status` to prevent weak evidence from becoming a strong report claim:

- `confirmed`: checked evidence directly supports the finding.
- `likely`: evidence is strong but one non-critical dependency remains.
- `hypothesis`: plausible explanation that needs more data.
- `advisory`: useful recommendation or caution without enough evidence for a finding.
- `unverified`: evidence is missing, source text is not checked, or measurement is insufficient.
- `contradicted`: checked evidence conflicts with the claim.
- `blocked`: do not use client-facing until a missing source, conflict, or safety issue is resolved.

## Quality Gate Before Reporting

Before finalizing client-facing or dashboard-ready language, verify:

- P0/P1 or high/critical findings are not reported without checked source text or explicit low-confidence caveat.
- Unchecked source text downgrades certainty to `low_confidence`, `unverified`, `advisory`, or `blocked`.
- Misinformation, brand confusion, competitor misattribution, hallucinated sources, and contradictory evidence have Evidence Notes.
- Competitor advantage is not asserted from URL-only data.
- Every recommendation has `expected_effect_hypothesis`, `verification_method`, and `acceptance_criteria`.
- Technical support actions do not imply schema, robots, sitemap, `llms.txt`, or internal links alone will increase citations.
- Google AI features are treated carefully: ordinary SEO foundations, indexability, snippet control, visible text, and structured data consistency may help discovery/understanding, but special markup or AI-specific files do not guarantee citation.
- `engine` / `model_name` / interface / region / language differences are recorded because ChatGPT, Perplexity, Gemini, Copilot, Claude, Google AI Overview, Google AI Mode, and other systems may cite differently.
- Critical/high risks appear before opportunities.
- Recommended actions are suitable to pass to `recora-recommendation-quality-gate-auditor`.

Report readiness decisions:

- `ready_for_client_report`
- `internal_only`
- `needs_more_evidence`
- `blocked_by_missing_source_text`
- `blocked_by_conflicting_evidence`

## Required Output Format

Always keep these eight sections for substantial outputs:

1. Citation Summary
2. Source Classification Table
3. Own / Competitor / Third-party Gap
4. Citation Risk
5. Source Opportunity
6. Recommended Page / Content Actions
7. Confidence Level
8. Unverified Items

Add optional supporting sections when useful: `Input Completeness`, `Observation Context`, `Evidence Ledger`, `Claim Inventory`, `Citation Inventory`, `Passage-level Evidence Notes`, `Machine-readable Output`, `Quality Gate Notes`, `Report Readiness`, `Eval Notes`, `Handoff Notes`.

## Handoff Contract

- From `recora-prompt-topic-designer`: receive `citation_check` prompt, topic, persona, model/provider, expected signal, answer/citation export, and observation context.
- To `recora-competitor-benchmark`: pass `source gap`, `competitor citation advantage`, third-party support, prompt/source patterns, citation footprint, observation count threshold, and confidence.
- To `recora-schema-seo-aio`: pass `own_site_fix`, `own_site_new_page`, `technical_support`, evidence-building page opportunities, acceptance criteria, and caveats.
- To `recora-recommendation-quality-gate-auditor`: pass Recommended Page / Content Actions, Evidence Ledger rows, risk IDs, finding statuses, confidence, caveats, report readiness, and client-safe wording.

## Hard Prohibitions

- Do not judge a citation as correct merely because the URL exists.
- Do not make strong conclusions without cited source text or reliable supplied evidence.
- Do not mark URL-only findings as `confirmed`.
- Do not merge cross-engine observations when engine, model, interface, persona, region, language, or date differs.
- Do not inspect or request `.env`, `.env.local`, API keys, private tokens, cookies, credentials, secrets, or login sessions.
- Do not modify Recora application files, other skills, databases, production, crawlers, providers, or external services.
- Do not create or execute scripts for this skill.
- Do not copy license-unclear external skill text.
- Do not present SEO-only fixes as direct AI citation gains.
- Do not claim schema, robots, sitemap, `llms.txt`, internal links, or one new page will guarantee AI citations.
- Do not make client-facing claims from unverified source analysis without quality-gate review.
