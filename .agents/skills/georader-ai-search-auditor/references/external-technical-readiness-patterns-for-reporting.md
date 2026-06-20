# External Technical Readiness Patterns For Reporting

Purpose: borrow technical readiness categories for GEORADER reporting while keeping them separate from AI visibility guarantees.

## Core Rule

Technical readiness supports discoverability and evidence clarity. It does not guarantee AI citation, rankings, traffic, or revenue.

## Readiness Categories

| Category | Reporting use |
|---|---|
| Crawlability | Identify whether public proof pages can likely be discovered or fetched. |
| Schema readiness | Identify visible-content-aligned structured-data opportunities. |
| Metadata readiness | Review whether titles, headings, descriptions, and page identity support clear extraction. |
| Source page clarity | Check whether claims, proof, authorship, dates, and entity details are clear. |
| Canonical / duplicate risk | Identify URL ambiguity that could weaken citation/source traceability. |
| Internal link readiness | Check whether proof pages are connected from relevant hubs or pages. |
| Performance caution | Mention only when severe loading problems could affect access or extraction. |
| Accessibility caution | Mention only when important content is hidden or hard to extract. |

## Evidence Labels

| Situation | Label |
|---|---|
| Page or artifact inspected in current task | `CONFIRMED_FACT` |
| Based on official platform docs | `OFFICIAL_SOURCE` |
| Based on common SEO practice | `INDUSTRY_PRACTICE` |
| Based on internal RECORA scoring/reporting structure | `GEORADER_ASSUMPTION` |
| Not measured or not inspected | `NEEDS_VERIFICATION` |

## Safe Reporting Pattern

Use:

"This is a technical readiness issue that may reduce source clarity or discoverability. It should be fixed and then measured; it does not by itself prove AI visibility impact."

Avoid:

"Fixing this technical issue will make AI systems cite the page."

## Handoff

If a recommendation implies code, schema, crawler, database, migration, or production changes, hand off to `recora-geo-implementation-architect` as an implementation-plan item.
