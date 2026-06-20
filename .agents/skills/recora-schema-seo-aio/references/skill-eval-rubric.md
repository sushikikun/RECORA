# Skill Eval Rubric

Research date: 2026-06-21

Purpose: evaluate whether `recora-schema-seo-aio` is operating correctly. Use Pass / Warning / Fail, not a numeric or five-level score.

## How To Use

- Evaluate the final audit or recommendation output against every criterion.
- A single Fail on guarantee language, manipulative SEO, invented evidence, or unsafe dashboard indexation should block client-facing use.
- Warnings can pass only if the output clearly marks missing evidence and gives a safe follow-up.
- Route risky outputs to `recora-recommendation-quality-gate-auditor`.

## Rubric

| Criterion | Pass | Warning | Fail |
|---|---|---|---|
| Skill activation accuracy | Used for Recora/client SEO, schema, AIO/GEO, AI-citation-friendly page structure, source gap to page action, or relevant page-type work. | Used for a related marketing/page task but scope is partly broader than SEO/AIO/schema. | Used for unrelated app implementation, secrets, database, package/config, or generic SEO detached from Recora/GEO/AIO evidence. |
| SEO/AIO separation | Clearly separates SEO technical effects from AIO/GEO extractability and source ecosystem effects. | Mentions the distinction but mixes some rows or benefits. | Treats SEO ranking improvement and AI answer adoption as the same outcome. |
| Schema caveat correctness | Frames schema as supportive, requires visible/supportable content, and states no guarantee of ranking, rich result, or AI citation. | Gives schema ideas but caveats are brief or validation is underspecified. | Claims schema will create AI citations, rankings, rich results, or recommendations. |
| `NEEDS_VERIFICATION` usage | Marks missing crawl, index, source, rendered, schema, AI-search, and third-party evidence precisely. | Some missing evidence is labeled, but one or two uncertain items are only implied. | Invents crawl/index/schema/AI behavior, source contents, rankings, citation counts, or business outcomes. |
| Implementation specificity | Names target page/section, exact issue, fix, evidence needed, owner/control, and validation method where possible. | Recommendations are implementable but lack owner, validation, or target section details. | Ends with abstract advice such as "improve SEO" or "make content better" without concrete steps. |
| Third-party vs owned-page separation | Distinguishes direct site improvements from external publication, review, directory, media, partner, PR, or source ecosystem actions. | Separates most actions but mixes one source ecosystem item into owned-page fixes. | Presents third-party coverage as something Recora can directly implement on owned pages. |
| Quality-gate handoff | Flags recommendations needing `recora-recommendation-quality-gate-auditor`, especially claims, competitors, pricing, reviews, schema/body mismatches, or source gaps. | Mentions quality gate but misses one moderate-risk item. | Publishes risky recommendation language without a gate or caveat. |
| No guarantee language | Uses safe wording such as "may support", "can improve clarity", or "move closer to citation-ready structure." | One phrase is a little strong but corrected by nearby caveat. | Says or implies guaranteed ranking, traffic, conversion, rich result, AI citation, AI recommendation, or AI visibility. |
| No manipulative SEO | Avoids keyword stuffing, fabricated reviews, spam, doorway pages, fake third-party citations, and inauthentic mentions. | Page expansion idea needs stronger unique-value guardrails. | Recommends spam, keyword stuffing, fake reviews, fabricated evidence, doorway pages, or manipulative outreach. |
| Recora-specific usefulness | Applies Recora page notes for LP, sample report, diagnose/new, dashboard, or client page; connects source gaps to page actions when relevant. | Mostly correct but could better reflect Recora product truth, buyer pain, evidence labels, or dashboard privacy. | Generic SEO output that could apply to any site and ignores Recora-specific GEO/AIO context. |
| Audit depth discipline | Correctly labels lightweight vs full audit and avoids inferring crawlability/indexability/schema validity/AI behavior when evidence is absent. | Audit depth is present but one conclusion is too certain for the evidence level. | Makes full-audit conclusions from screenshot, route name, rough copy, or user description only. |
| Page-type handling | Identifies page type and adapts checks for LP, FAQ, comparison, glossary, case study, pricing, service, research, sample report, diagnose page, dashboard, or unknown. | Page type is identified but recommendations are not fully adapted. | Does not identify page type or recommends unsafe public indexation for dashboard/form pages. |
| Source gap connection | If `recora-ai-citation-analysis` source gap exists, maps it into owned-page actions and third-party evidence needs. | Mentions source gap but lacks one side of owned vs third-party action. | Ignores provided source gap or treats schema/bot access as the whole solution. |
| Output format compliance | Uses the required seven sections exactly and keeps the tables/bullets useful. | Seven sections appear but one section is thin or renamed. | Omits or replaces the required seven-section output. |

## Required Seven-Section Output Check

Pass requires all seven sections:

1. SEO/AIO Audit Summary
2. Technical Issues
3. Structured Data Opportunities
4. AI-Citation-Friendly Page Opportunities
5. Content Structure Recommendations
6. Implementation Priority
7. Risks / Caveats

## Example Eval Scenarios

| Scenario | Expected behavior | Fail condition |
|---|---|---|
| Screenshot-only LP review | Use lightweight audit, mark crawl/index/schema/AI behavior as `NEEDS_VERIFICATION`, focus on visible hierarchy, category clarity, buyer pain, proof, and SEO vs GEO/AIO explanation. | Claims metadata, indexability, schema validity, or AI citation behavior from screenshot alone. |
| Full HTML + robots + sitemap + JSON-LD page audit | Use full audit, cite observed technical evidence, separate SEO and AIO/GEO findings, validate schema/body consistency, prioritize implementable fixes. | Omits technical checks or treats schema as the main AIO/GEO solution. |
| `recora-ai-citation-analysis` source gap handoff | Map gap to owned-page fixes, new page opportunities, internal links, and legitimate third-party evidence actions; quality-gate client-facing claims. | Says adding FAQ/schema/robots alone resolves the source gap. |
| Diagnose/new form page | Prioritize trust, privacy/caveat wording, input clarity, and conversion support; avoid over-optimizing for SEO if primarily a form flow. | Recommends public indexation or content expansion without confirming product/security intent. |
| Dashboard page | Treat as private by default; do not recommend public SEO exposure without explicit approval. | Recommends indexation, public schema, or crawler access for private dashboard data. |

## Blocking Failures

Client-facing output is not acceptable if it contains any of these:

- guaranteed AI citation, ranking, rich result, traffic, conversion, or revenue language
- invented schema facts or invisible review/rating/pricing facts
- unsupported competitor claims
- source gap recommendations without evidence labels
- public indexation recommendation for private Recora dashboards without explicit approval
- keyword stuffing, doorway pages, fabricated reviews, fake citations, or manipulative outreach
- missing `NEEDS_VERIFICATION` labels for absent crawl/index/source/schema/AI-search data

## Quality-Gate Handoff

Send the output to `recora-recommendation-quality-gate-auditor` when:

- any item is Warning and client-facing
- any claim depends on measured AI-search data not included in the prompt
- any recommendation touches reviews, pricing, competitor comparison, customer results, or third-party evidence
- schema may encode facts not visible on the target page
- the output was produced from lightweight evidence but may be published as a firm recommendation
