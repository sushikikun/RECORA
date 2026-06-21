# Public Skill Patterns

Research date: 2026-06-21

Purpose: summarize design, evaluation, and operation patterns observed in public SEO/GEO/schema/agent-skill repositories. Do not copy public skill instructions into Recora. Convert useful patterns into Recora's advisory, evidence-safe SEO/AIO/schema workflow.

## Use Rules

- Borrow patterns, not prompt text.
- Treat public skill claims as design signals, not facts about SEO ranking or AI citation behavior.
- Use official Google, schema.org, and OpenAI sources for factual rules.
- Mark third-party metrics, platform claims, crawler claims, and "AI visibility" claims as `NEEDS_VERIFICATION`.
- Keep `recora-schema-seo-aio` advisory. Execution belongs to an explicitly approved task or another implementation skill.

## Public Skill Pattern Matrix

| Source | URL | License if visible | Reference date | What it is good at | Pattern to borrow | Recora adaptation | What not to borrow | Risk / caveat |
|---|---|---|---|---|---|---|---|---|
| `AgriciDaniel/claude-seo` | https://github.com/AgriciDaniel/claude-seo | MIT | 2026-06-21 | Large SEO skill suite, specialist agents, schema/GEO modules, action-plan orientation, primary-source grounding. | Falsifiable recommendations, failure checks, leading indicators, evidence-first action plans. | Add falsifiability to Recora recommendations without adding large sub-agent machinery. | Do not copy agent files, report formats, scoring, commercial/community positioning, or claims about speed/results. | Broad scope can overwhelm a single Recora skill. |
| `AgriciDaniel/codex-seo` | https://github.com/AgriciDaniel/codex-seo | NOASSERTION in GitHub metadata; LICENSE exists | 2026-06-21 | Codex-first routing layer, specialist workflows, TOML agents, deterministic runners, cache artifacts, security/credential boundaries. | Progressive disclosure, evidence cache concept, "read first, write second, verify third", structured artifacts. | Keep Recora references one level deep; future scripts may emit JSON evidence and leave execution separate. | Do not copy venv/installers/hooks/API integrations or credential patterns. | Heavy operational surface; not suitable for current references-only phase. |
| `Bhanunamikaze/Agentic-SEO-Skill` | https://github.com/Bhanunamikaze/Agentic-SEO-Skill | MIT | 2026-06-21 | LLM-first audits with evidence collectors, deterministic checks, confidence labels, verification gates. | Evidence collector first: scripts collect facts; judgment interprets them. | Use candidate collectors for metadata, headings, canonical/noindex, robots, sitemap, JSON-LD, source gaps. | Do not import script inventory, command syntax, file artifacts, or dated SEO rules without official verification. | Automated checks can become false authority. |
| `aaron-he-zhu/seo-geo-claude-skills` | https://github.com/aaron-he-zhu/seo-geo-claude-skills | Apache-2.0 | 2026-06-21 | Phase-based skill library, shared contracts, quality gates, cross-skill protocols. | Consistent contract: activation, data sources, instructions, handoff, next skill. | Use Recora handoffs to `recora-ai-citation-analysis`, quality gate, copy voice, visual design, and implementation architect. | Do not copy proprietary framework names or scoring rubrics wholesale. | Custom frameworks may not align with Recora evidence model. |
| `coreyhaines31/marketingskills` ai-seo | https://github.com/coreyhaines31/marketingskills | MIT | 2026-06-21 | Marketing skill family, related-skill dependency map, AI SEO trigger vocabulary. | Dependency mapping and product-context-first thinking. | Use for related-skill routing: copy, schema, SEO audit, AI citation analysis, quality gate. | Do not copy "get cited" language or third-party statistics. | AI-search statistics and provider behavior are time-sensitive. |
| `zubair-trabzada/geo-seo-claude` | https://github.com/zubair-trabzada/geo-seo-claude | MIT | 2026-06-21 | GEO-first / SEO-supported framing, crawler checks, brand authority, report orientation. | Separate GEO/AIO extractability from SEO foundations. | Translate to Recora: evidence density, source ecosystem, answer extractability, not citation guarantees. | Do not copy market-size, traffic, conversion, or correlation claims. | Strong marketing phrasing exceeds Recora safety standard. |
| `brandon468/seo-skills` | https://github.com/brandon468/seo-skills | MIT | 2026-06-21 | Schema architect workflow, validation-first JSON-LD generation, page archetype mapping. | Schema/body consistency and validation before delivery. | Require visible/supportable facts before JSON-LD; future schema collector should flag missing visible facts. | Do not copy Firecrawl, validator retries, PR injection, or platform install flows. | External validators and crawlers require permissions and may need credentials. |
| `JeffLi1993/seo-audit-skill` | https://github.com/JeffLi1993/seo-audit-skill | MIT | 2026-06-21 | Script + LLM two-layer architecture for single-page and full audits. | Deterministic checks for mechanical facts; LLM judgment for intent/content quality. | Map this directly into Recora evidence collectors and `NEEDS_VERIFICATION` labeling. | Do not copy report UI or PageSpeed/GSC API assumptions. | Tool output may hide missing crawl depth or user intent. |
| `Varnan-Tech/schema-markup-generator` | https://github.com/Varnan-Tech/schema-markup-generator | `NEEDS_VERIFICATION` | 2026-06-21 | Schema generation from visible page content and missing-field detection. | Prefer missing-field flags over guessed schema values. | Make schema recommendations conditional on visible text, dates, author/publisher, prices, reviews, and page type. | Do not copy PR-writing behavior or page-type thresholds. | License not visible in GitHub metadata. |
| `mykpono/ultimate-seo-geo` | https://github.com/mykpono/ultimate-seo-geo | MIT | 2026-06-21 | Three-mode Audit / Plan / Execute split, routing shell, progressive reference loading, evidence scripts, audit context. | Mode separation and "load only relevant references" rule. | Recora should use Audit and Plan by default; Execute requires explicit authorization or another skill. | Do not copy broad score claims, execute flows, llms.txt/RSL assertions, or script suite. | Some GEO/platform claims require official or measured verification. |
| `ComposioHQ/awesome-claude-skills` | https://github.com/ComposioHQ/awesome-claude-skills | `NEEDS_VERIFICATION` | 2026-06-21 | Large curated skill list, skill anatomy, progressive loading, action-capable plugin examples. | Treat skills as modular workflow packages and keep references discoverable. | Use for library-level pattern awareness and supply-chain caution. | Do not import app-connect/plugin/action patterns into Recora SEO skill. | Many listed skills may involve credentials or external actions. |
| `OneWave-AI/claude-skills` | https://github.com/OneWave-AI/claude-skills | MIT | 2026-06-21 | Large production-ready skill library, skill categories, agent orchestration patterns. | Use only library-level ideas: skill families, routing, composition, scoped specialists. | Keep Recora skill small and avoid unnecessary multi-agent orchestration. | Do not copy "agent army" or parallel agent execution models into this skill. | Broad library is not SEO-specific and can overfit to scale. |

## Patterns To Borrow

### Sub-skills / specialist agents

- Public SEO suites often split technical SEO, schema, content, sitemap, GEO, visual analysis, and reporting.
- Recora adaptation: keep one advisory skill, but route deeper implementation or review needs to existing Recora skills.
- Use specialist thinking as an internal checklist, not as new sub-skills.

### Evidence collectors

- Public skills repeatedly separate mechanical evidence from judgment.
- Recora adaptation: future scripts should collect facts, not decide client-facing recommendations.
- Evidence collectors should emit JSON, limitations, and `NEEDS_VERIFICATION` where blocked.

### Audit / Plan / Execute mode

- Public skills often run all three modes.
- Recora adaptation:
  - Audit: inspect current evidence and label unknowns.
  - Plan: recommend page/schema/content/internal-link/source actions with priority and validation.
  - Execute: only with explicit permission or handoff to implementation skills.

### Failure criteria and leading indicators

- Strong recommendations define how to know whether the action helped or failed.
- Recora adaptation: every important action should include observation, dependency, leading indicator, failure condition, validation method, evidence needed, caveat, and quality-gate trigger.

### Dependency mapping

- Public skill libraries map related skills and next steps.
- Recora adaptation: always map source-gap actions to owned-page work, third-party evidence work, and quality-gate review.

### Source freshness

- Public SEO/GEO guidance changes quickly.
- Recora adaptation: maintain explicit refresh windows and mark stale claims as `NEEDS_VERIFICATION`.

### Output reports

- Public tools create HTML/PDF/Excel reports.
- Recora adaptation: keep this skill's required seven-section markdown output. Reports belong to product/report implementation, not this advisory reference phase.

### Quality gates

- Public skill suites use validators, rubrics, and verifier roles.
- Recora adaptation: use `recora-recommendation-quality-gate-auditor` for risky client-facing output and use `skill-eval-rubric.md` for self-checks.

### No-guarantee caveats

- Safer public skills include caveats; marketing-heavy skills often overstate.
- Recora adaptation: the no-guarantee rule is mandatory for schema, robots, sitemap, AI bot access, llms.txt, body structure, and AI citation.

### Schema/body consistency

- Schema tools converge on visible-content alignment.
- Recora adaptation: no schema field should encode facts missing from visible/supportable content.

### AI-citation-safe wording

- Translate "get cited" or "AI visibility" language into "extractability", "evidence density", "source ecosystem", and "citation-ready structure".
- Keep SEO ranking and AI answer adoption separate.

## Public Skill Pattern To Recora Decision Table

| Public pattern | Recora accepts? | Recora implementation |
|---|---|---|
| Large sub-agent suite | Partially | Use existing Recora skill handoffs instead of creating new sub-agents. |
| Scripted evidence collectors | Yes, later | Keep scripts out of this phase; design collectors in references first. |
| Health score / numeric site score | Usually no | Avoid unless measured methodology is explicit and quality-gated. |
| Audit / Plan / Execute | Yes | Audit and Plan by default; Execute only with explicit approval. |
| llms.txt claims | With caution | Treat as service-specific; never guarantee Google or AI citation impact. |
| AI crawler allow/block checks | With caution | Treat as access/discovery support, not exposure guarantee. |
| Schema generation | Yes, conditional | Only for visible/supportable page facts and validated rendered output. |
| Report artifacts | Not in this skill | Keep advisory output; product reports are separate implementation work. |
| Trigger-rich descriptions | With caution | Keep trigger broad enough for Recora SEO/AIO/schema, not generic SEO takeover. |
| External credentials/API usage | No by default | Never pull credentials, cookies, `.env`, or API keys into this skill. |
