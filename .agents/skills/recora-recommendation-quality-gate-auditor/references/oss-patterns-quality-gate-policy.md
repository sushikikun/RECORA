# OSS Patterns Quality Gate Policy

## Purpose

Use this reference when a recommendation candidate is influenced by open-source repository research or by an OSS-derived pattern.

## Core Rule

Do not `auto_publish` recommendations based only on OSS inspiration.

OSS patterns can support the shape of a recommendation, a field list, a report structure, a review checklist, or an internal hypothesis. They cannot support a client-facing claim without actual RECORA measurement evidence.

## Evidence Handling

Use:

- `OSS_RESEARCH_PATTERN`: structure or planning pattern derived from public repository research.
- `NEEDS_VERIFICATION`: unverified repository claim, feature claim, benchmark, platform support claim, or outcome claim.
- `CONFIRMED_FACT`: only when supplied RECORA observation data, inspected artifacts, or verified evidence directly supports the claim.

## Decision Guidance

### Auto-Publish

Only consider `auto_publish` when:

- OSS influence is limited to structure or phrasing.
- Actual RECORA measurement evidence supports the recommendation.
- Query, provider, date/run, seed risk, citation/source support, and confidence are clear.
- Wording does not imply guaranteed citation, ranking, traffic, revenue, or implementation.

### Hold

Use `hold` when:

- The recommendation is plausible but based on OSS structure without RECORA measurement.
- README claims are mentioned but not used as proof.
- Provider status, seed risk, source-to-claim status, or collection method is missing.
- The candidate can be rewritten safely after verification.

### Suppress

Use `suppress` when:

- The candidate treats OSS marketing or README claims as client evidence.
- The candidate guarantees AI visibility, citation, ranking, revenue, or ROI.
- The candidate asks for credentials, cookies, login sessions, API keys, or `.env` access.
- The candidate recommends browser automation, UI automation, crawling, scraping, external services, installs, external scripts, or implementation work from inside the skill.

## Required Checks

For OSS-derived candidates, check:

- What is the OSS pattern?
- Is the pattern used only for structure?
- Is there RECORA measurement evidence?
- Does the candidate cite repository claims as proof?
- Does it require a risky external service or automation path?
- Does it preserve Draft -> Gate flow?
- Does it use safe client-facing wording?

## Safe Internal Note

Use wording like:

"This recommendation structure is inspired by OSS research, but publication requires RECORA measurement evidence and quality-gate review."

