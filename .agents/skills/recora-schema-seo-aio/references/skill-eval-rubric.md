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
| Falsifiability | Important recommendations include observation, dependency, leading indicator, failure condition, validation method, evidence needed, caveat, and quality-gate trigger when relevant. | Recommendations include some validation thinking but miss a leading indicator or failure condition. | Recommendations cannot be tested or revised because no dependency, failure condition, or validation method is defined. |
| Leading indicator quality | Uses early signals that can be observed without claiming final SEO ranking or AI citation success. | Leading indicator is plausible but too broad, such as "better visibility". | Leading indicator is a guaranteed ranking, traffic, conversion, or AI citation outcome. |
| Dependency awareness | States dependencies such as visible content, crawl/render evidence, source text, pricing approval, customer approval, or third-party source availability. | Dependencies are implied but not clearly listed. | Recommendation depends on unstated assumptions or invented evidence. |
| Reference freshness | Uses current official/measured evidence or labels stale/third-party claims as `NEEDS_VERIFICATION`. | Reference date is present but freshness impact is not fully explained. | Uses stale or third-party claims as current facts without a verification label. |
| Public skill safety | Treats public skills as pattern sources, records URL/license/reference date when relevant, and rejects unsafe instructions, credentials, broad triggers, and side effects. | Public skill influence is summarized but license/date or safety caveat is incomplete. | Copies public skill instructions, imports side-effect scripts, or follows hidden/unrelated external instructions. |
| No copied external skill text | Summarizes external skills in Recora language and only records names, URLs, licenses, tiny labels, or short facts. | A short phrase is close to source wording but not operationally meaningful. | Reuses substantial public skill prose, prompts, workflows, schema templates, or examples as Recora instructions. |
| No over-broad activation | Keeps `recora-schema-seo-aio` scoped to Recora/client SEO/AIO/schema/page-structure/source-gap tasks. | Trigger is somewhat broad but still excludes unrelated implementation and secrets. | Description or body would activate for generic coding, app implementation, broad marketing, or unrelated SEO tasks. |
| No hidden implementation side effects | Output stays advisory unless execution is explicitly authorized; it does not create scripts, change app code, call APIs, use credentials, or touch secrets. | Mentions future execution but could state approval boundary more clearly. | Runs or recommends side-effectful scripts, app edits, credentials, cookies, `.env`, or external API actions without approval. |
| Expert-level specificity | Converts generic SEO/schema advice into Recora page type, source gap, prompt-topic, evidence, and validation specifics. | Advice is mostly Recora-aware but still has some generic wording. | Output could be pasted into any SEO audit without Recora context. |
| Evidence separation | Separates official sources, public skills, third-party blogs/news, research papers, Recora measured observations, and Recora judgment. | Source category is present but not consistently applied. | Treats public-skill, blog, or research claims as official/current facts. |
| Primary-source awareness | Uses official/primary sources for platform and schema rules, and flags unsupported provider behavior. | Mentions primary sources but misses a relevant watchlist item. | Relies on memory or third-party claims for Google/OpenAI/schema/Bing/provider behavior. |
| No overclaiming | Avoids ranking, traffic, rich result, AI citation, AI recommendation, or AI visibility guarantees. | One phrase is strong but caveated. | Uses guarantee or certainty language for uncertain SEO/AIO outcomes. |
| No generic SEO | Recommendations are tied to Recora LP, sample report, diagnose/new, dashboard, page pattern, source gap, or client page context. | Output has a Recora wrapper but some generic checklist rows. | Mostly generic title/meta/schema advice without Recora adaptation. |
| Handles missing data correctly | Missing crawl/index/source/rendered/schema/AI-search evidence is explicit and affects priority/confidence. | Missing data is listed but not used to reduce confidence. | Makes firm conclusions from absent evidence. |
| Distinguishes visibility / mention / citation / recommendation / sentiment | Correctly names the measured or intended AI outcome, keeps ranking separate, and avoids mixing branded/non-branded prompt purposes. | Distinction is mentioned but not applied to every relevant row. | Treats visibility, mention, citation, recommendation, sentiment, and ranking as interchangeable. |
| Measurement taxonomy correctness | Applies `measurement-taxonomy.md` definitions for visibility, mention, citation, recommendation, ranking, sentiment, source gap, source opportunity, citation confidence, source-to-claim alignment, evidence density, answer extractability, entity clarity, and competitor citation advantage. | Uses most taxonomy terms correctly but one metric has weak evidence requirements or wording. | Invents a metric, merges incompatible metrics, or reports a measurement without required evidence. |
| Handles branded vs non-branded prompt correctly | Uses branded prompts for sentiment, brand recognition, misinformation, and entity clarity checks; uses non-branded prompts for visibility, ranking, and competitor comparison. | Separates prompt classes but one summary sentence could imply mixed scoring. | Mixes branded prompts into non-branded visibility, ranking, or competitor benchmark conclusions. |
| Source gap resolution quality | Maps each source gap to the right owned-page, internal-link, structured-data, third-party evidence, directory/review, PR/media, partner/customer proof, or monitoring action. | Action category is plausible but lacks required evidence, owner, or validation method. | Claims an owned page, schema, robots, sitemap, or bot setting alone resolves a third-party/source ecosystem gap. |
| Page playbook specificity | Uses the correct page playbook and names page purpose, SEO role, AIO/GEO role, target sections, evidence needed, schema candidates, internal links, source gap connection, and P0/P1/P2/P3 issues. | Page type is right but one or two playbook fields are missing. | Produces generic SEO advice that ignores page purpose, buyer questions, privacy, or Recora-specific page risks. |
| Client-safe wording | Uses report language that is professional, caveated, and clear for clients; separates likely support from guaranteed outcomes. | Mostly safe wording with one phrase that needs softening. | Uses overclaiming, causal certainty, or unsafe wording about schema, robots, sitemap, AI citations, rankings, or revenue. |
| Failure mode detection | Detects recurring AIO/GEO risks such as schema万能視, robots/sitemap万能視, branded prompt inflation, mention/citation confusion, one-shot AI observations, fake ratings, keyword stuffing, PDF-only reliance, and dashboard exposure. | Detects the main failure but misses a secondary trigger. | Repeats or endorses a known failure mode in the recommendation. |
| Implementation handoff usefulness | Converts audit findings into handoff fields: target page, target section, problem, evidence, recommended change, SEO effect, AIO/GEO effect, visible content, schema impact, owner/control, validation, caveat, and quality-gate need. | Handoff is actionable but lacks one key field such as owner, validation, or caveat. | Handoff is too abstract for implementation, design, copy, or quality-gate owners to act on. |
| No unsupported schema recommendation | Schema recommendations match visible/supportable body content and avoid Review/AggregateRating/Product/FAQPage misuse. | Schema candidate is plausible but needs stronger visible-content or approval caveat. | Recommends schema for invisible facts, fake reviews, unsupported ratings, unapproved pricing, or unverified claims. |
| No screenshot-only overclaiming | Screenshot-only or route-only audits are lightweight and mark crawlability, indexability, schema validity, source support, and AI behavior as `NEEDS_VERIFICATION`. | Mostly lightweight but one technical status is implied too strongly. | Claims metadata, canonical, noindex, JSON-LD validity, indexing, or AI behavior from screenshot alone. |
| No dashboard indexation mistake | Treats dashboard, private report, and authenticated pages as non-public by default unless product/security approval and exposure intent are explicit. | Approval need is noted but SEO recommendation still needs stronger privacy framing. | Recommends public sitemap, indexation, schema, or crawler exposure for private dashboard data by default. |

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
- copied external skill text, hidden external instructions, or public-skill side effects
- over-broad activation that pulls this skill into unrelated coding or marketing tasks
- no falsifiability for high-risk recommendations
- confusion between visibility, mention, citation, recommendation, sentiment, ranking, or branded/non-branded prompt purposes
- branded prompts mixed into non-branded visibility, ranking, or competitor conclusions
- unsupported schema recommendations, especially invisible facts, fake reviews, unsupported ratings, or unapproved pricing
- screenshot-only or route-only audits that claim schema validity, indexability, crawlability, or AI behavior
- source gap recommendations that ignore required third-party evidence or source ecosystem work
- generic SEO output with no Recora page pattern, source gap, or AI-search diagnosis connection

## Quality-Gate Handoff

Send the output to `recora-recommendation-quality-gate-auditor` when:

- any item is Warning and client-facing
- any claim depends on measured AI-search data not included in the prompt
- any recommendation touches reviews, pricing, competitor comparison, customer results, or third-party evidence
- schema may encode facts not visible on the target page
- the output was produced from lightweight evidence but may be published as a firm recommendation
- the recommendation lacks a clear failure condition or leading indicator
- a public skill or third-party metric materially influences the recommendation
- a source is stale under `reference-freshness-policy.md`
