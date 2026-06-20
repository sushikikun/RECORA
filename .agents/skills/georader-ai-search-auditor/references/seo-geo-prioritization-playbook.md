# SEO / GEO Prioritization Playbook

Use this reference when deciding what to fix first in GEORADER / Recora GEO, SEO, AI search, citation-readiness, competitor-gap, report-quality, or conversion work.

This is a GEORADER / Recora internal prioritization model. It is not an official Google, SEO, or GEO standard. Use it to explain reasoning, not to pretend mathematical certainty.

## Severity Rules

### P0

Use P0 for:

- secret, credential, cookie, private-token, or `.env` exposure.
- measurement validity failure that makes the report misleading.
- crawl or index blockers on critical public pages.
- false completion claims for forms, reports, payment, diagnosis, delivery, or automation.
- fake official claims or unsupported platform endorsements.
- guaranteed AI citation, recommendation, ranking, traffic, or conversion claims.
- severe conversion trust risk.
- hallucinated or incorrect AI answer claims repeated as facts.
- client-harming misinformation.

### P1

Use P1 for high-impact improvements:

- major technical discoverability gaps.
- weak service or category explanation.
- missing non-branded or comparison intent coverage.
- weak topical architecture.
- weak entity or brand authority.
- missing proof, case studies, or third-party validation.
- weak AI citation readiness.
- strong competitor advantage in SERP or AI answers.
- unclear conversion path for high-intent visitors.
- report structure that prevents clients from acting.

### P2

Use P2 for:

- useful content expansion after core gaps are fixed.
- wording polish.
- additional FAQs or glossary entries.
- secondary schema opportunities.
- visualization improvements.
- monitoring refinements.
- experiments and lower-risk monthly enhancements.

## What To Prioritize First

### Prioritize Technical SEO First When

- critical pages may be blocked, noindexed, canonicalized incorrectly, inaccessible, or hidden behind rendering issues.
- robots.txt, sitemap, status codes, or rendered HTML are unknown and the report depends on them.
- AI crawler access claims are being made without evidence.

Default severity: P0 for confirmed critical blockers, P1 for likely blockers needing verification.

### Prioritize Service Explanation First When

- the product category is unclear.
- the ICP, use case, pricing/process, or value proposition is vague.
- AI answers mention competitors because they explain the category better.

Default severity: P1.

### Prioritize Search Intent Mapping First When

- the query set is missing, biased, too branded, or not aligned to buyer decisions.
- the report claims AI invisibility without tested prompts.
- content recommendations are being made without demand or intent structure.

Default severity: P0 for invalid report claims, otherwise P1.

### Prioritize Comparison Pages First When

- competitors appear in AI answers or SERPs for shortlist, alternative, or "best" queries.
- the brand is absent from comparison intent.
- buyers need decision criteria and competitor pages explain those criteria better.

Default severity: P1.

### Prioritize Case Studies / Proof First When

- AI answers mention the brand but do not recommend it.
- pages make claims without evidence.
- competitors have stronger proof, testimonials, external mentions, or case studies.

Default severity: P1.

### Prioritize Entity / Brand Cleanup First When

- AI answers cite the brand incorrectly.
- service descriptions conflict across owned and third-party sources.
- company identity, author/operator, or official definitions are unclear.

Default severity: P0 if misinformation is client-harming, otherwise P1.

### Prioritize AI Citation Readiness Assets First When

- pages are crawlable and relevant but not easy to cite or summarize.
- methodology, FAQ, comparison, proof, and source-backed claims are missing.
- AI answers cite directories or competitors because owned sources are thin.

Default severity: P1.

### Prioritize Conversion SEO First When

- AI search visibility exists but the page does not convert.
- CTA, sample report, pricing/process, proof, or form expectations are unclear.
- claims feel exaggerated or unsupported.

Default severity: P0 for misleading completion/delivery claims, otherwise P1.

### Delay Programmatic SEO When

- the service definition is unclear.
- core technical access is unverified.
- proof assets are missing.
- templates would create thin or duplicate pages.
- query demand and conversion intent are unverified.
- implementation would distract from P0 or P1 trust and evidence gaps.

Default severity: P2 or delayed.

### Label NEEDS_VERIFICATION Instead Of Recommending When

- current SERP or AI answer state is not known.
- source freshness is uncertain.
- crawler policy or bot behavior may have changed.
- exact URL, source, or last checked date is unknown.
- the recommendation depends on Search Console, logs, private tools, or credentials not supplied.
- Recora product, customer, metric, delivery, integration, or automation claims are unsupported.

## Internal Prioritization Model

Use:

`Priority score = Impact x Confidence x Risk modifier / Effort`

This corresponds to the user's requested Impact x Confidence x Effort x Risk model while avoiding the mistake of rewarding high effort. Higher impact, higher confidence, and higher risk raise priority. Higher effort lowers priority unless the issue is P0.

Factors:

- Impact: likely business, visibility, trust, or report-value improvement.
- Confidence: strength of evidence supporting the diagnosis.
- Effort: expected complexity or time cost, stated qualitatively when unknown.
- Risk modifier: raises priority when the issue affects trust, client harm, secrets, official-source misuse, or measurement validity.

Use scores only as an internal explanation. Do not present them as mathematically precise or official.

## Output Pattern

Use:

| Priority | Issue | Impact | Confidence | Effort | Risk | Evidence label | Why first / why later |
|---|---|---|---|---|---|---|---|

If evidence is weak, do not inflate confidence. Recommend verification as the first action.
