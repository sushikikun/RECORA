# Source Freshness Policy

Use this reference when a claim may be outdated, unstable, platform-dependent, or based on fast-changing AI search behavior.

The goal is to keep reports useful without pretending that old or unverified claims are current facts.

## Topics That Require Fresh Verification

Mark these as `NEEDS_VERIFICATION` unless checked in the current task or backed by a known current source:

- Google AI Overviews guidance.
- Google AI Mode guidance.
- Google Search AI feature controls, reporting, and eligibility details.
- AI crawler policies and robots.txt handling.
- OpenAI bot behavior.
- Perplexity bot behavior.
- Anthropic bot behavior.
- Google bot behavior.
- schema support and rich result eligibility.
- AI search tool behavior.
- AI answer citation behavior.
- competitor visibility in SERPs or AI answers.
- SERP results.
- AI answer results.
- crawler logs, WAF behavior, CDN blocking, and robots.txt access state.
- market benchmarks, citation rates, AI Overview rates, GEO effects, traffic lifts, and conversion lifts.
- Recora customers, pricing, product capabilities, integrations, delivery, automation, and business metrics.

## Stable Or Slower-Changing Topics

These can usually be treated as `INDUSTRY_PRACTICE` or stable conceptual guidance, unless the output needs official proof:

- general crawlability principles.
- indexability concepts.
- internal linking principles.
- clear content structure.
- clear service descriptions.
- matching structured data to visible page content.
- avoiding unsupported claims.
- separating confirmed facts from assumptions.
- client-facing clarity.
- evidence-scoped report structure.
- P0/P1/P2 prioritization as an internal framework.

Do not call these official platform rules unless official docs were checked or supplied for the task.

## Labeling Stale Claims

Use:

- `CONFIRMED_FACT`: inspected in the current task or supplied by the user as current.
- `OFFICIAL_SOURCE`: official source checked or supplied with enough context to support the current claim.
- `RESEARCH_BACKED`: named research supports the concept, not necessarily current platform behavior.
- `INDUSTRY_PRACTICE`: common practice, not a platform promise.
- `GEORADER_ASSUMPTION`: internal Recora / GEORADER interpretation.
- `NEEDS_VERIFICATION`: source age, current status, or exact applicability is unknown.

## Official Docs That May Have Changed

When official docs may have changed:

1. Name the source owner and topic only if known.
2. Do not invent a current date.
3. Say the guidance should be rechecked before client-facing or implementation use.
4. Use `OFFICIAL_SOURCE` only for the narrow guidance actually verified.
5. Use `NEEDS_VERIFICATION` for current details, UI names, bot names, API behavior, reporting availability, or policy changes.

Safe wording:

- "Official documentation should be rechecked before treating this as current platform guidance."
- "The current crawler name, purpose, and access behavior need verification before implementation."

## AI Crawler Policies

AI crawler policies are fast-changing.

Always separate:

- official platform documentation.
- observed logs.
- public robots.txt.
- WAF/CDN settings.
- Recora interpretation.
- citation outcome testing.

Do not say that allowing a crawler guarantees AI citation or recommendation.

Use:

- "may improve access conditions."
- "does not guarantee inclusion."
- "requires query-level testing."

## Research Papers Versus Current Platform Behavior

Research can support concepts, methods, or observed behavior in a studied setting. It does not automatically prove current behavior for Google, OpenAI, Anthropic, Perplexity, Gemini, ChatGPT, Claude, or any other platform.

Use `RESEARCH_BACKED` for:

- studied GEO concepts.
- retrieval or grounding concepts.
- measured behavior in the paper's dataset.

Use `NEEDS_VERIFICATION` for:

- current platform behavior.
- client-specific outcomes.
- expected lift.
- ranking impact.
- citation impact.
- conversion impact.

## Writing NEEDS_VERIFICATION Without Weakening The Report

Weak:

- "We do not know anything."
- "This may or may not matter."

Strong:

- "This is a priority verification item because it affects AI visibility claims."
- "Before client-facing use, confirm this with current platform documentation or fresh query results."
- "The strategy can proceed as a hypothesis, but the report should not state the result as fact until measured."
- "This item is actionable as a measurement step, not yet as a confirmed finding."

## Recora Report Pattern

Use:

| Claim | Freshness risk | Evidence label | Verification needed | Safe current wording |
|---|---|---|---|---|

Prioritize freshness checks when a stale claim could create:

- client trust risk.
- official-source misuse.
- wrong implementation direction.
- false AI visibility claims.
- wrong competitor conclusions.
- unsafe crawler or secret handling.

---

## v0.8.1 Source Handling Tightening

# Source Handling Tightening For v0.8.1

Use this patch content to tighten `georader-ai-search-auditor` source handling, evidence labels, and client/internal citation behavior.

## Required Rules

- Do not output exact last checked or last updated dates unless verified from the source during the task or supplied by the user.
- If source URL, current source status, or last checked date is unknown, mark the affected claim `NEEDS_VERIFICATION`.
- Do not use domain-only citations like "(developers.google.com)" as proof in internal outputs.
- Internal outputs should include source title, owner, URL if known, evidence label, claim supported, claim not supported, and last checked if known.
- Client-facing outputs should summarize sources briefly and avoid citation dumps, but must not turn unverified claims into facts.
- `OFFICIAL_SOURCE` must be assigned per platform and per claim. Google, OpenAI, Anthropic, and Perplexity should not be bundled unless each source was verified for the specific claim.
- `RESEARCH_BACKED` can support concepts and hypotheses, but cannot guarantee current commercial AI search behavior unless current platform evidence also supports it.
- Never say a crawler setting, schema, source, or content format guarantees AI citation, AI recommendation, or ranking.

## Suggested Reference Placement

Append or merge these rules into:

- `references/source-citation-format.md`
- `references/source-freshness-policy.md`
- `references/evidence-policy.md`
- `references/official-source-research-map.md`
- `references/ai-platform-crawler-policy.md`

## Good Example

`OFFICIAL_SOURCE` / `NEEDS_VERIFICATION`: Google Search Central guidance supports crawlability and indexability as prerequisites. Exact current page URL and last checked date: `NEEDS_VERIFICATION`.

## Bad Examples

- "Google says this will make AI cite you."
- "Last updated 2026-06-12" when the date was not verified from the source during the task or supplied by the user.
- "(developers.google.com)" as the only proof for an internal finding.
- "OpenAI, Anthropic, and Perplexity crawler policies all support this" when each platform source was not separately verified.

## Internal Source Ledger Minimum

For internal outputs that rely on sources, use a compact ledger with:

| Source title | Owner | URL if known | Evidence label | Claim supported | Claim not supported | Last checked if known |
|---|---|---|---|---|---|---|

Use `NEEDS_VERIFICATION` when the URL, current source status, or last checked date is not known.

## Client-Facing Source Summary Pattern

Use short, cautious language:

- "Official platform guidance was considered for crawler access and indexability, but current URLs and last checked dates should be verified before treating the guidance as current."
- "Recora's prioritization is an internal evidence-scope framework, not an official platform standard."
- "Research supports the concept, but current AI answer behavior still requires fresh platform or query-level evidence."

