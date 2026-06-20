# Source Citation Format

Use this reference when the skill handles source claims, source freshness, citation wording, official guidance, research, crawler policy, or Recora interpretation.

The goal is to keep source handling useful and precise without inventing fake citations, URLs, dates, or authority.

## Source Ledger Fields

Use this table whenever the output needs source discipline:

| Field | Requirement |
|---|---|
| Source title | Use the exact title only when known. If unknown, describe the source and mark the claim `NEEDS_VERIFICATION`. |
| Source owner | Name the owner, such as Google, OpenAI, Anthropic, Perplexity, schema.org, the client, a research publisher, or Recora. |
| Source type | Official documentation, research paper, supplied artifact, inspected page, AI answer export, SERP evidence, log excerpt, or industry practice. |
| Source URL if known | Include only known URLs. Do not invent or guess URLs. |
| Last checked date if known | Include only when actually known from the task. Do not invent freshness dates. |
| Evidence label | Use `CONFIRMED_FACT`, `OFFICIAL_SOURCE`, `RESEARCH_BACKED`, `INDUSTRY_PRACTICE`, `GEORADER_ASSUMPTION`, or `NEEDS_VERIFICATION`. |
| Claim supported | State the narrow claim the source supports. |
| Claim not supported | State what the source does not prove. |
| Safe wording | Provide wording that matches the evidence. |
| Unsafe wording | Identify wording that would overclaim. |

## Compact Source Table

Use:

| Source title | Owner | Source type | URL | Last checked | Evidence label | Claim supported | Claim not supported |
|---|---|---|---|---|---|---|---|

Rules:

- Do not invent URLs.
- Do not invent last checked dates.
- Use `unknown` when the URL or date is unknown.
- If the exact source URL or current status is unknown, mark the relevant claim `NEEDS_VERIFICATION`.
- Do not treat a source name alone as proof.
- Do not cite this local reference as an external source in client-facing reports.

## Official Guidance Handling

For official guidance:

1. State what the source actually supports.
2. State what the source does not support.
3. Separate platform guidance from Recora interpretation.
4. Use `OFFICIAL_SOURCE` only for the official-source-backed part.
5. Use `GEORADER_ASSUMPTION` for Recora scoring, packaging, report structure, or prioritization.

Safe wording:

- "`OFFICIAL_SOURCE`: The official source supports crawler access or eligibility guidance for the specific platform topic."
- "`GEORADER_ASSUMPTION`: Recora uses that guidance as one input in its internal evidence-scope framework."

Unsafe wording:

- "The platform officially endorses Recora."
- "This official source guarantees AI citation."
- "This is the official GEO standard."

## Research Handling

Use `RESEARCH_BACKED` only when named research is known and the claim is scoped to the research.

Safe wording:

- "The research supports this concept in the studied setting."
- "Current platform behavior still needs verification."

Unsafe wording:

- "The paper proves this will work for all AI engines."
- "The research is official platform guidance."

## Client Evidence Handling

Use `CONFIRMED_FACT` only for supplied or inspected artifacts in the current task:

- AI answer exports.
- SERP screenshots or exports.
- inspected public pages.
- crawl outputs.
- redacted logs.
- user-provided facts.

Safe wording:

- "In the supplied AI answer export, the brand was absent for this query."

Unsafe wording:

- "The brand is absent from all AI search" when only one answer was supplied.

## Recora Interpretation Handling

Use `GEORADER_ASSUMPTION` for:

- Recora report structure.
- Recora prioritization.
- Recora scoring.
- Recora product packaging.
- Recora roadmap logic.
- GEORADER-to-Recora transition language.

Use `NEEDS_VERIFICATION` for:

- Recora customers.
- Recora pricing.
- Recora integrations.
- Recora platform support.
- Recora product capabilities.
- Recora delivery or automation claims.
- Recora performance claims.

## When To Mark NEEDS_VERIFICATION

Mark `NEEDS_VERIFICATION` when:

- the exact source URL is unknown.
- the source may have changed and was not checked in the current task.
- current platform behavior is required.
- current SERP or AI answer data is required.
- crawler behavior, robots.txt, WAF, CDN, schema eligibility, or logs are uninspected.
- the source name is known but the exact claim is not confirmed.
- the cited source supports a narrower claim than the report wants to make.
- the claim affects trust, money, delivery, diagnosis accuracy, or client recommendations.

## Client-Facing Reports

Use short source summaries:

- "Official platform documentation was used for crawler access guidance."
- "Current AI answer visibility was not verified because answer exports were not supplied."
- "Recora's prioritization is an internal evidence-scope framework, not an official platform standard."

Do not include long quotes. Summarize and cite primary sources only when known.

## Internal Reports

Include enough detail for later verification:

- source title.
- owner.
- source type.
- known URL.
- last checked date if known.
- supported claim.
- unsupported claim.
- verification needed.

## Hard No-Guarantee Rule

Never say a source, crawler setting, schema, content format, FAQ, comparison table, case study, or source-backed claim guarantees:

- AI citation.
- AI recommendation.
- AI Overview inclusion.
- ChatGPT Search inclusion.
- Perplexity citation.
- Claude retrieval.
- ranking.
- traffic.
- conversion.

Use:

- "improves source clarity."
- "supports access conditions."
- "improves citation readiness."
- "requires fresh query testing."
- "needs verification before client-facing use."

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

