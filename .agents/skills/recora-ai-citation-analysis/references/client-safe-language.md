# Client-safe Language

Use this reference before writing Recora client-facing Source Intelligence findings, summaries, risks, or recommendations.

## Core Policy

Write findings as evidence-scoped observations, hypotheses, or recommendations. Do not present AI citation behavior as deterministic. Separate what was checked from what remains unverified.

## Safe Phrases

Use phrases like:

- `This result is for internal review.`
- `Additional verification is required before using this as a client-facing conclusion.`
- `Because the cited source text could not be checked, this should not be treated as evidence.`
- `At this stage, this should be treated as a hypothesis.`
- `Because the observation count is low, this is a one-off observation rather than a trend.`
- `Within the checked evidence...`
- `In this observation...`
- `Based on the cited source text available...`
- `When compared with the cited passage...`
- `As a hypothesis...`
- `Additional verification is needed...`
- `This is still weak for client-facing certainty...`
- `This may be directly improvable on the own site...`
- `This may require third-party listing or editorial outreach...`
- `This does not guarantee increased AI citations.`
- `The expected effect is a testable source-readiness improvement, not a guaranteed citation outcome.`

## Avoid Phrases

Avoid phrases like:

- `This result can be sent to the client as-is.`
- `The competitor is clearly winning.`
- `This action will increase AI citations.`
- `This source says it, so it is true.`
- `This will definitely be cited.`
- `Adding schema will make AI cite the page.`
- `Changing robots will make AI cite the page.`
- `This page will solve the issue.`
- `The competitor is objectively winning.`
- `Google ranking is high, so AI citations are strong.`
- `The comparison site is neutral.`
- `The cited URL exists, so the answer is correct.`
- `AI will use this source after the update.`
- `This guarantees AI Overview visibility.`

## Finding Status Wording

| finding_status | Client-safe wording |
|---|---|
| `confirmed` | State as checked evidence, with scope and source basis. |
| `likely` | State as likely within the observed evidence and name the remaining dependency. |
| `hypothesis` | State as a plausible explanation that needs further measurement or source review. |
| `advisory` | State as a cautious recommendation or internal note, not a finding. |
| `unverified` | State as unverified and list what is missing. |
| `contradicted` | State as a contradiction or correction risk; do not bury it in opportunity wording. |
| `blocked` | Do not use as client-facing conclusion until the blocker is resolved. |

## Report Wording Policy

- Use `confirmed` only when the cited source text or supplied evidence directly supports the finding.
- Use `likely` when evidence is strong but not complete.
- Use `hypothesis` for why a source may be cited or why own site may be absent.
- Use `advisory` for cautious next steps that are sensible but not proven by the current evidence.
- Use `unverified` when source text, dates, measurement count, or domain mapping is missing.
- Use `contradicted` when checked source text conflicts with the AI answer.
- Use `blocked` when a finding should not be shown to clients without more evidence.

## Claim Strength Rules

- URL-only evidence cannot support `confirmed`.
- Snippet-only evidence usually cannot exceed `hypothesis` or `advisory`.
- One observation should be called `anecdotal_observation`.
- Cross-engine differences should be described as surface-specific observations.
- High/critical claims need checked source text and caveats.
- Technical support actions are allowed, but phrase them as reducing discovery, understanding, validation, or extraction friction.

## Recommended Action Wording

Prefer:

- `Create or improve this page so the claim has a clearer owned-source basis for future testing.`
- `Update the third-party profile because stale information may be weakening or distorting the citation ecosystem.`
- `Add evidence such as pricing, feature comparison, case studies, FAQ, or data where the current cited sources are stronger than the own site.`
- `Use schema/internal links/sitemap/robots hygiene as technical support, not as a standalone citation-growth promise.`
- `Monitor the same prompt, engine, model, region, and date window after the update.`

Avoid:

- `This action will increase citations.`
- `This guarantees AI visibility.`
- `This fixes GEO.`
- `The model will use this page.`
- `Third-party outreach will make the AI cite us.`

## Client-safe Rewrite Examples

Unsafe: `The competitor is cited because they are better.`

Safe: `In the checked observations, the competitor receives more citation support from review/comparison sources. The reason may include source availability, third-party coverage, freshness, or stronger claim-level evidence; more observations are needed before treating this as a stable pattern.`

Unsafe: `Add schema and Google AI will cite the page.`

Safe: `Schema can support machine understanding when it matches visible page content, but it does not guarantee Google AI citation. Treat it as technical support and verify with later same-condition observations.`

Unsafe: `The cited URL proves the answer.`

Safe: `The URL is present, but source text has not been checked. The claim should remain unverified until the cited passage is reviewed.`

## P0/P1 Risk Wording

For critical or high-risk findings:

- Name the claim.
- Name the cited source or missing source.
- State whether the issue is contradicted, unsupported, stale, inaccessible, or brand-misrepresenting.
- State client-facing impact.
- State the verification or correction needed.

Do not soften contradictions into general recommendations.
