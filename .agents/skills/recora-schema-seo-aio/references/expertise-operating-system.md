# Expertise Operating System

Research date: 2026-06-21

Purpose: define how `recora-schema-seo-aio` becomes a Recora-specific expertise system rather than a generic SEO/schema checklist.

## Operating Principle

Recora expertise is not "more SEO facts." It is the ability to turn measured AI-search evidence, page structure, source gaps, schema constraints, and client-safe caveats into implementable page improvements without promising rankings or AI citations.

## Expertise Layers

| Layer | What it does | Primary reference | Output discipline |
|---|---|---|---|
| 1. Primary-source doctrine | Separates official, schema.org, public skill, blog, research, and Recora-measured evidence. | `primary-source-watchlist.md`, `seo-schema-aio-source-notes.md` | Prefer official sources for factual rules; label others. |
| 2. Public-skill pattern mining | Learns design/evaluation/operation patterns from public skills without copying text. | `public-skill-patterns.md`, `public-skill-risk-notes.md` | Borrow structure, not claims. |
| 3. Recora-specific page pattern library | Defines page archetypes Recora should design or audit. | `recora-page-pattern-library.md` | Turn generic SEO advice into page-specific improvements. |
| 4. Gold eval cases | Tests whether the skill handles hard Recora scenarios. | `gold-eval-cases.md` | Use Pass / Warning / Fail behavior. |
| 5. Evidence collector roadmap | Defines future deterministic and hybrid checkers. | `evidence-collector-ideas.md` | Scripts collect evidence; judgment remains separate. |
| 6. Falsifiable recommendation system | Makes recommendations testable and revisable. | `recommendation-falsifiability.md` | Include hypothesis, dependencies, indicators, failure conditions. |
| 7. Reference freshness cycle | Keeps changing SEO/GEO/schema sources from becoming stale assumptions. | `reference-freshness-policy.md`, `primary-source-watchlist.md` | Mark stale or unsupported claims `NEEDS_VERIFICATION`. |
| 8. Quality-gate handoff | Prevents overclaiming and unsafe client-facing recommendations. | `skill-eval-rubric.md`, `recora-recommendation-quality-gate-auditor` | Route risky output before publication. |

## What Counts As Expert In Recora

An output is expert-level only when it:

- distinguishes SEO technical readiness from AIO/GEO extractability
- separates visibility, mention, citation, recommendation, and sentiment
- identifies page type before recommending structure or schema
- states evidence level: measured AI-search data, page source, rendered HTML, screenshot, or user description
- maps each source gap to owned-page action, new-page action, third-party evidence action, or measurement continuation
- frames schema, robots, sitemap, bot access, and llms.txt as support signals, never guarantees
- uses official sources for factual rules and labels public-skill/blog/research claims
- produces recommendations with hypothesis, dependency, leading indicator, failure condition, and validation method
- gives directly implementable page/section/internal-link/schema actions
- sends risky client-facing claims to a quality gate

## Generic SEO Knowledge vs Recora Expertise

| Generic SEO knowledge | Recora expertise |
|---|---|
| "Improve title and meta description." | Identify page intent, buyer question, SERP snippet role, AI extraction role, and exact title/meta rewrite constraints. |
| "Add FAQ schema." | Verify visible FAQ text, clarify the page question, align JSON-LD to body, caveat Google rich-result support, and avoid AI citation guarantees. |
| "Allow AI bots." | Separate crawler access from indexation, AI answer use, privacy, dashboard exposure, and provider-specific uncertainty. |
| "Create comparison pages." | Define fair scope, competitor evidence, fit/non-fit, source gaps, update date, legal risk, internal links, and quality gate. |
| "Build glossary content." | Map terms to prompt topics, buyer stages, Recora category language, internal links, and extractable definitions. |
| "Improve authority." | Split owned evidence density from third-party source ecosystem and identify which source gaps cannot be fixed on owned pages alone. |

## How To Sound Expert Without AI Citation Guarantees

Use:

- "This improves extraction clarity, not guaranteed AI adoption."
- "This closes an owned-page evidence gap, while independent third-party evidence remains separate."
- "This is a crawl/discovery support action, not proof of AI-search exposure."
- "The hypothesis is testable through remeasurement, but the result is not guaranteed."
- "The recommendation is bounded by the observed prompt/provider/date/source set."

Avoid:

- "This will get cited by AI."
- "This will improve AI rankings."
- "Schema makes the page AI-readable enough to be recommended."
- "Bot permission increases AI-search exposure."
- "SEO ranking gains mean AI answer adoption."

## What Belongs In SKILL.md vs References

Put in `SKILL.md`:

- trigger scope and boundaries
- first decision flow
- audit depth rules
- required seven-section output
- short reference routing
- hard prohibitions and quality-gate handoff

Put in references:

- primary-source details and refresh policy
- page pattern library
- public-skill pattern research and risk notes
- gold eval cases
- falsifiability examples
- future evidence collector designs
- advanced AIO/GEO principles

Do not put in either:

- copied external skill prose
- unverified third-party metrics as facts
- scripts in this phase
- credentials, cookies, API keys, `.env` handling, or private dashboard content

## Future Scripts vs LLM Judgment

| Area | Future script candidate? | Keep as LLM/human judgment? |
|---|---|---|
| title/meta extraction | Yes | Copy quality and search intent fit |
| heading outline | Yes | Whether headings answer buyer questions |
| canonical/noindex/robots meta | Yes | Whether public/index intent is appropriate |
| robots.txt and sitemap | Yes | Privacy/product/security implications |
| JSON-LD extraction | Yes | Schema type appropriateness and body consistency |
| schema/body consistency | Hybrid | Whether a paraphrase supports a claim |
| internal links | Yes | Information architecture priority |
| answer extractability | Hybrid | Whether an answer is actually useful and safe |
| source gap mapping | Hybrid | Which gaps require legitimate third-party evidence |
| pricing clarity | Hybrid | Commercial/legal approval and conversion clarity |
| comparison fairness | No deterministic-only | Competitor/legal/evidence judgment |
| quality-gate decision | No deterministic-only | Client-facing risk judgment |

## Operating Loop

1. Read only the references relevant to the task.
2. Identify page type and evidence level.
3. Separate SEO technical, AIO/GEO extractability, structured data, content/page structure, and third-party/source ecosystem.
4. Apply page pattern and advanced AIO/GEO principles.
5. Convert recommendations into falsifiable units.
6. Mark stale, missing, or third-party claims `NEEDS_VERIFICATION`.
7. Route risky output to the quality gate.
8. Preserve the seven-section Recora output format.
