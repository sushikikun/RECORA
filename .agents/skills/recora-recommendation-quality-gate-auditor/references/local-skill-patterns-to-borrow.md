# Local Skill Patterns To Borrow

Use this reference to borrow safe patterns from adjacent local skills without inheriting unsafe capabilities.

## Safe Patterns To Borrow

From `georader-ai-search-auditor`:

- evidence labels.
- source freshness boundaries.
- P0/P1/P2-style risk thinking.
- internal vs client-facing output separation.
- no-guarantee language for AI citation and ranking.

From `ai-seo`:

- AI visibility and citation-readiness framing.
- query-level measurement thinking.
- source inclusion and answer parsing awareness.

From `seo-audit` and `seo-technical`:

- crawlability, indexability, robots, rendering, and technical blocker checks.
- distinguishing technical prerequisites from outcome guarantees.

From `schema`:

- structured data as comprehension and eligibility support.
- visible-content consistency.
- schema opportunities rather than implementation in this skill.

From `programmatic-seo`:

- page-type and intent mapping.
- avoiding scaled generic content when evidence is thin.

From `copywriting`, `sales-enablement`, and `marketing-psychology`:

- safer client-facing phrasing.
- objection-aware wording.
- clear business impact language without unsupported claims.

From `georader-lp-reviewer`:

- trust-risk detection.
- provisional claim caution.
- report and CTA clarity patterns.

## Do Not Borrow

- scripts.
- API-key flows.
- Search Console, DataForSEO, MCP, login, cookie, or credential assumptions.
- implementation instructions.
- DB writes.
- production edits.
- schema implementation code.
- Next.js or backend changes.
- fake citations.
- official-standard overclaims.
- guaranteed AI visibility claims.

## Quality Gate Adaptation

This skill should convert borrowed patterns into review criteria:

- Does the candidate have enough evidence?
- Is the recommendation specific to measured Recora observations?
- Is the wording safe for client display?
- Are sources scoped correctly?
- Is implementation deferred?
- Are secrets avoided?

Local skill patterns are not external evidence. Do not cite them in client-facing reports.
