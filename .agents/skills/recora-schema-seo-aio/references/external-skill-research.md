# External Skill Research Notes

Research date: 2026-06-21

Purpose: capture reusable patterns from local Recora skills, installed SEO/schema/AIO skills, and public external skill repositories without copying their instructions. Use these notes to improve `recora-schema-seo-aio` recommendations, references, and future evidence collectors.

## Source Handling Rules

- Treat local Recora skills as product-context references, not as replacement workflows.
- Treat public external skills as design inspiration only. Do not copy their prompts, scoring systems, scripts, or marketing claims.
- Prefer Google and schema.org for factual SEO/schema rules.
- Mark unverifiable claims, market statistics, and license gaps as `NEEDS_VERIFICATION`.
- Keep Recora's rules stricter than generic SEO skills: no AI citation guarantees, no ranking guarantees, no bot-access guarantees, no manipulative SEO.

## Local Recora Skill Patterns

| Source name | URL or local path | License if visible | Relevant ideas | What to borrow for Recora | What not to copy | Risk / caveat | Influence |
|---|---|---|---|---|---|---|---|
| `recora-ai-citation-analysis` | `.agents/skills/recora-ai-citation-analysis/SKILL.md` | Repo-local; `NEEDS_VERIFICATION` | Source gap, source opportunity, source-to-claim evidence, competitor citation advantage, owned vs third-party action categories. | Convert source gaps into page improvements, new owned pages, internal links, evidence sections, and legitimate third-party actions. | Do not treat observed AI answers as stable future behavior. | Source text and prompt observations must be verified before client-facing claims. | `SKILL.md` and references |
| `recora-recommendation-quality-gate-auditor` | `.agents/skills/recora-recommendation-quality-gate-auditor/SKILL.md` | Repo-local; `NEEDS_VERIFICATION` | Auto-publish / hold / suppress gate, evidence sufficiency, overclaim detection, unsafe recommendation rewrite. | Route risky schema/SEO/AIO recommendations to a quality gate. | Do not publish recommendations that imply guaranteed ranking, traffic, conversion, or AI adoption. | Client-facing language can drift into guarantees unless checked. | `SKILL.md` and eval rubric |
| `recora-copy-brand-voice` | `.agents/skills/recora-copy-brand-voice/SKILL.md` | Repo-local; `NEEDS_VERIFICATION` | Evidence-led Japanese B2B tone, fact/inference/unknown separation, safer claim phrasing. | Align FAQ, LP, report, and pricing wording with Recora voice. | Do not turn SEO/AIO recommendations into sales hype. | Tone edits can hide uncertainty if caveats are removed. | References only |
| `georader-ai-search-auditor` | `.agents/skills/georader-ai-search-auditor/SKILL.md` and `$HOME/.agents/skills/georader-ai-search-auditor/SKILL.md` | Repo/user-local; `NEEDS_VERIFICATION` | Evidence labels, broad GEO/SEO strategy, topical/entity authority, roadmap priorities. | Use evidence labels and roadmap-level separation when page fixes are part of a larger GEO plan. | Do not let broad strategy replace implementable page fixes. | Could become too generic unless tied to a target page. | References only |
| `recora-geo-implementation-architect` | `.agents/skills/recora-geo-implementation-architect/SKILL.md` | Repo-local; `NEEDS_VERIFICATION` | Technical SEO architecture, parser/citation pipeline, source-to-claim mapping, code-review boundaries. | Handoff implementation architecture and schema-generation code questions to this skill. | Do not change app code from this advisory skill. | Implementation advice can exceed allowed scope. | `SKILL.md` handoff |
| `recora-competitor-benchmark` | `.agents/skills/recora-competitor-benchmark/SKILL.md` | Repo-local; `NEEDS_VERIFICATION` | Competitor tiers, prompt-level visibility deltas, source/citation diversity gaps. | Use competitor gaps to propose fair comparison pages and evidence sections. | Do not make unsupported competitor claims. | Comparison pages carry legal and trust risk. | References only |
| `recora-prompt-topic-designer` | `.agents/skills/recora-prompt-topic-designer/SKILL.md` | Repo-local; `NEEDS_VERIFICATION` | Persona and buyer-stage prompt design. | Connect prompt topics to FAQ, comparison, glossary, case study, and pricing page needs. | Do not claim designed prompts predict real AI answer outcomes. | Prompt sets need measured provider results. | References only |
| `recora-visual-design-director` | `.agents/skills/recora-visual-design-director/SKILL.md` | Repo-local; `NEEDS_VERIFICATION` | LP, sample report, dashboard, and page-section design review. | Use for page layout and extractable UI presentation when recommendations affect visual structure. | Do not use design polish as a substitute for evidence clarity. | Visual recommendations can conflict with SEO if hidden text or heavy interaction is proposed. | References only |

## Installed Local SEO / Schema / Marketing Skills

| Source name | URL or local path | License if visible | Relevant ideas | What to borrow for Recora | What not to copy | Risk / caveat | Influence |
|---|---|---|---|---|---|---|---|
| `ai-seo` | `$HOME/.codex/skills/ai-seo/SKILL.md` | `NEEDS_VERIFICATION` | AI-search trigger vocabulary, content extractability, citation-oriented page structure. | Use trigger vocabulary and owned/third-party visibility separation. | Do not copy strong claims that content can get cited or that specific percentages apply. | Third-party statistics and platform behavior claims require current verification. | References only |
| `schema` | `$HOME/.codex/skills/schema/SKILL.md` | `NEEDS_VERIFICATION` | JSON-LD planning, schema.org type selection, visible-content alignment, rich-result caveats. | Use as a schema workflow pattern, especially "do not invent fields." | Do not rely on generic rich-result assumptions for Recora pages. | Google rich-result eligibility changes over time. | References only |
| `seo-audit` | `$HOME/.codex/skills/seo-audit/SKILL.md` | `NEEDS_VERIFICATION` | Technical/on-page audit checklist and prioritized fixes. | Borrow evidence-first issue tables and crawl/index checks. | Do not merge SEO ranking and AI answer selection. | Generic SEO audits may ignore Recora source-gap context. | References only |
| `seo-technical` | `$HOME/.codex/skills/seo-technical/SKILL.md` | MIT in local metadata | Crawlability, indexability, robots, canonical, mobile, CWV, structured data, JS rendering. | Borrow deterministic check categories for future scripts. | Do not imply technical access equals AI visibility. | Technical checks need rendered and source views. | Future scripts |
| `programmatic-seo` | `$HOME/.codex/skills/programmatic-seo/SKILL.md` | `NEEDS_VERIFICATION` | Template-page quality, thin-page and doorway-page risk. | Use for comparison/glossary page quality guardrails. | Do not recommend keyword-stuffed or duplicated pages. | Programmatic pages can become spammy if value is not unique. | References only |
| `copywriting` | `$HOME/.codex/skills/copywriting/SKILL.md` | `NEEDS_VERIFICATION` | Clear landing page copy, value proposition, CTA clarity. | Use for LP and pricing clarity, routed through Recora voice. | Do not turn evidence caveats into conversion hype. | Copy improvements can overpromise. | References only |
| `frontend-design` / `web-design-guidelines` | `$HOME/.codex/skills/frontend-design/SKILL.md`, `$HOME/.codex/skills/web-design-guidelines/SKILL.md` | `NEEDS_VERIFICATION` | Layout, information hierarchy, accessibility and visual scanability. | Use when page structure recommendations become UI recommendations. | Do not hide key answers only in interaction-heavy UI. | Visual decisions can reduce extractability if content is not visible. | References only |
| `skill-creator` | `$HOME/.codex/skills/.system/skill-creator/SKILL.md` | OpenAI bundled; `NEEDS_VERIFICATION` | Keep `SKILL.md` focused; put deeper docs in `references/`; scripts only when deterministic tools are needed. | Keep Recora's main skill concise and route to references as needed. | Do not create scripts before the workflow is proven. | Skill bloat reduces runtime usability. | `SKILL.md` |
| `openai-docs` | `$HOME/.codex/skills/.system/openai-docs/SKILL.md` and `https://github.com/openai/skills/tree/main/skills/.curated/openai-docs` | Apache-2.0 visible in public repo | Official-source routing, bounded uncertainty, reference map, quality rules. | Prefer official docs for OpenAI/Codex facts and maintain a concise reference map. | Do not rely on memory for current OpenAI product facts. | OpenAI docs can change; verify when current behavior matters. | References only |

## Public External Skill Scan

Sources were discovered by GitHub repository search and sampled through README / SKILL metadata. They should influence structure, not content.

| Source name | URL or local path | License if visible | Relevant ideas | What to borrow for Recora | What not to copy | Risk / caveat | Influence |
|---|---|---|---|---|---|---|---|
| OpenAI Skills Catalog | https://github.com/openai/skills | Per-skill license files; example checked: Apache-2.0 for `openai-docs` | Repo layout, references folders, optional scripts, optional `agents/openai.yaml`, skill discovery via frontmatter. | Maintain repo-scoped skill, clear frontmatter, concise description, references for deeper knowledge. | Do not copy unrelated curated skill instructions. | Individual skill licenses vary by directory. | `SKILL.md` and references |
| OpenAI Codex Skills docs | https://developers.openai.com/codex/skills | OpenAI docs; license not shown in page excerpt | Progressive disclosure, `SKILL.md` with `name` and `description`, optional references/scripts/assets/agents, concise trigger descriptions. | Keep `recora-schema-seo-aio` focused and route deeper notes to references. | Do not overload initial skill description with all research notes. | Docs may evolve; verify before changing metadata conventions. | `SKILL.md` |
| `AgriciDaniel/claude-seo` | https://github.com/AgriciDaniel/claude-seo | MIT | Broad SEO skill suite with specialist agents, schema, GEO/AEO, action plans, falsifiable recommendations, primary-source grounding. | Borrow the idea of evidence-backed, falsifiable recommendations and explicit failure checks. | Do not copy sub-skill text, agent structure, scoring, install flow, or community/commercial framing. | Broad scope may be too heavy for one Recora skill. Claims about results or speed need verification. | References only |
| `Bhanunamikaze/Agentic-SEO-Skill` | https://github.com/Bhanunamikaze/Agentic-SEO-Skill | MIT | LLM-first SEO skill with deterministic trigger mapping, evidence collection scripts, confidence labels, baseline checks, verification gates. | Borrow `evidence collector` separation and confidence/missing-data labeling. | Do not copy script inventory, command syntax, full report artifact requirements, or any unverified date-based SEO rules. | Some rules require current Google verification before reuse. | Future scripts and eval rubric |
| `aaron-he-zhu/seo-geo-claude-skills` | https://github.com/aaron-he-zhu/seo-geo-claude-skills | Apache-2.0 | Skill library with consistent activation contracts, phase separation, shared reference materials, cross-cutting content/domain quality gates. | Borrow the contract pattern: trigger, data sources, instructions, handoff, next skill. | Do not copy CORE-EEAT/CITE frameworks wholesale. | Custom frameworks may not match Recora's evidence model. | References only |
| `coreyhaines31/marketingskills` | https://github.com/coreyhaines31/marketingskills | MIT | Marketing skill family with SEO, schema, AI SEO, product-marketing context, related-skill map. | Borrow cross-skill dependency mapping and product-context-first thinking. | Do not copy AI SEO claims that imply citations can be obtained by following a checklist. | Some AI visibility statistics and platform descriptions are third-party or time-sensitive. | References only |
| `zubair-trabzada/geo-seo-claude` | https://github.com/zubair-trabzada/geo-seo-claude | MIT | GEO-first / SEO-supported framing, AI crawler checks, brand authority, schema, report ideas. | Borrow the separation between AI-search visibility and traditional SEO foundations. | Do not copy market-size, traffic-growth, conversion-rate, or correlation claims without verification. | Marketing copy is stronger than Recora's safe recommendation standard. | References only |
| `brandon468/seo-skills` | https://github.com/brandon468/seo-skills | MIT | Schema-architect workflow, page archetype schema stacks, validation against schema.org and Google tools, no empty fields. | Borrow validation-first schema thinking and page-archetype mapping. | Do not copy Firecrawl/PR workflow or validator retry automation into this instruction-only phase. | External validators and APIs need explicit user approval and may need credentials. | Future scripts |
| `JeffLi1993/seo-audit-skill` | https://github.com/JeffLi1993/seo-audit-skill | MIT | Script + LLM two-layer architecture: deterministic checks for HTTP/XML/string matching; LLM for semantic judgment. | Borrow the deterministic-vs-judgment split for evidence collectors. | Do not copy report UI, exact coverage tables, or API-key assumptions. | Full audits can overfit to tool output and understate missing evidence. | Future scripts |
| `Varnan-Tech/schema-markup-generator` | https://github.com/Varnan-Tech/schema-markup-generator | `NEEDS_VERIFICATION` | Schema generator that emphasizes visible-page extraction and not inventing JSON-LD fields. | Borrow "missing field beats guessed field" as a schema rule. | Do not copy PR injection behavior or page-type thresholds without verification. | License was not visible in repository metadata. | References only |
| Candidate: `nowork-studio/NotFair` | https://github.com/nowork-studio/NotFair | `NEEDS_VERIFICATION` | Search result suggests SEO/GEO/ads skills. | No influence until inspected. | Do not borrow from uninspected source. | Not sampled beyond repository search result. | None |
| Candidate: `ericosiu/ai-marketing-skills` | https://github.com/ericosiu/ai-marketing-skills | `NEEDS_VERIFICATION` | Search result suggests broad AI marketing skills. | No influence until inspected. | Do not borrow from uninspected source. | Not sampled beyond repository search result. | None |

## Patterns To Borrow

- Put trigger language in frontmatter and keep it narrow enough to avoid generic SEO activation.
- Use a first decision flow before auditing: page type, evidence level, issue lane, missing data, seven-section output.
- Maintain lightweight vs full audit modes to avoid false certainty from screenshots or user descriptions.
- Split deterministic checks from human/LLM judgment:
  - deterministic: title, meta description, headings, canonical, robots, sitemap, JSON-LD extraction, link counts
  - judgment: entity clarity, evidence density, source gap mapping, comparison fairness, pricing clarity
- Require evidence labels: confirmed, likely, not inspected, `NEEDS_VERIFICATION`.
- Add quality-gate handoff when recommendations affect client-facing claims, competitor statements, pricing, reviews, or AI citation expectations.
- Use future scripts as evidence collectors, not as automatic recommendation publishers.

## Patterns Not To Borrow

- Do not guarantee that AI systems will cite, rank, recommend, or surface a page.
- Do not copy market statistics, correlation claims, or dated platform behavior without current primary-source verification.
- Do not make schema generation the main optimization lever.
- Do not recommend public indexation for private Recora dashboard pages.
- Do not create a large sub-agent system for this single Recora skill unless the product workflow proves it needs one.
- Do not create scripts in this phase.

## Influence Summary

- `SKILL.md`: only needs a short reference-routing note so Codex knows when to load these files.
- `references/seo-schema-aio-source-notes.md`: should be the factual source for Google/schema.org/OpenAI rules.
- `references/evidence-collector-ideas.md`: should guide future deterministic scripts.
- `references/skill-eval-rubric.md`: should evaluate whether outputs preserve Recora's evidence and no-guarantee standards.

## Follow-Up Deep Research References

The first pass above records source inventory and broad influence. Use these focused references for deeper runtime decisions:

- `public-skill-patterns.md`: public skill design patterns, including `AgriciDaniel/codex-seo`, `mykpono/ultimate-seo-geo`, large skill libraries, audit/plan/execute separation, falsifiability, evidence collectors, source freshness, and Recora adaptation.
- `public-skill-risk-notes.md`: license, stale advice, overclaiming, AI citation guarantee language, public skill supply-chain risk, metadata/description overreach, hidden credentials/API usage, and side-effect scripts.
- `recommendation-falsifiability.md`: concrete Recora recommendation template and examples for FAQ, comparison, pricing, JSON-LD, robots, source gap, case study, glossary, and sample report improvements.
- `reference-freshness-policy.md`: source categories, refresh intervals, freshness labels, and when to mark official, third-party, research, or measured claims as `NEEDS_VERIFICATION`.
