# Evidence Sufficiency Rules

Use these rules to judge whether a recommendation candidate has enough evidence for client display.

## Evidence Labels

- `CONFIRMED_FACT`: supplied Recora observation data, AI answer export, SERP export, citation URL, screenshot, inspected artifact, or user-provided fact.
- `OFFICIAL_SOURCE`: current primary-source guidance verified for the exact platform and claim.
- `RESEARCH_BACKED`: named research supports the concept or studied behavior.
- `INDUSTRY_PRACTICE`: common SEO, GEO, content, CRO, or reporting practice.
- `RECORA_ASSUMPTION`: Recora scoring, quality-gate logic, product framing, or display policy.
- `NEEDS_VERIFICATION`: missing, stale, unmeasured, indirect, unsupported, or source-status-unknown evidence.

## Minimum Evidence For auto_publish

`auto_publish` requires enough evidence to answer:

- What was measured?
- Which query, page, source, competitor, or citation is involved?
- Which platform or search surface is involved?
- When was the observation made, if date matters?
- What exact claim does the evidence support?
- What does the evidence not support?
- What action follows from the evidence?

If these cannot be answered, use `hold` or `suppress`.

## Evidence That Is Not Enough Alone

These are not enough for `auto_publish`:

- a general SEO best practice.
- a research concept without client measurement.
- an official source that supports only a narrower claim.
- a third-party study used as platform policy.
- a source title without URL or verification status when current status matters.
- a generated answer without query, platform, or date context when visibility is being claimed.
- a seeded prompt where the brand, competitor, or desired conclusion was supplied.

## Current-State Claims

Treat these as `NEEDS_VERIFICATION` unless actual measurement data is supplied:

- current client AI answer inclusion.
- current citation URLs.
- current SERP position.
- current competitor visibility.
- current crawler access.
- current indexing or snippet eligibility.
- current source status or last checked date.
- current platform behavior.

## Official Source Boundaries

Official sources can support only what they explicitly say. Do not generalize:

- Google SEO or AI feature guidance into guaranteed AI citation.
- structured data guidance into ranking guarantees.
- crawler guidance into citation guarantees.
- robots.txt guidance into universal enforcement.
- platform docs into Recora endorsement.

## Research Boundaries

Research can support concepts such as visibility measurement, attribution, source overlap, retrieval grounding, and factuality evaluation. It cannot guarantee commercial outcomes, platform behavior, rankings, or client-specific improvement without current evidence.
