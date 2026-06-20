# Public Skill Pattern Research

Use this file to record public and sibling skill structures that informed `recora-prompt-topic-designer`.

This research is structural only. Do not copy license-unclear wording, code, commands, long examples, or repo-specific claims into Recora skills.

## Sources Reviewed

- source_name: OpenAI skills repository
  url_or_location: https://github.com/openai/skills
  reviewed_scope: Repository-level skill packaging model, catalog pattern, and note that skills are folders containing instructions, scripts, and resources.
  copied_text: no
  useful_pattern: Skill directory as a small capability package with `SKILL.md` plus optional references/resources.
  license_or_copying_note: Used only as a structural reference. No text, code, scripts, or examples copied.

- source_name: OpenAI skill-creator
  url_or_location: https://raw.githubusercontent.com/openai/skills/main/skills/.system/skill-creator/SKILL.md
  reviewed_scope: Anatomy of a skill, progressive disclosure, validation guidance, and reference-file use.
  copied_text: no
  useful_pattern: Keep `SKILL.md` concise and move detailed rubrics, examples, and validation material into reference files.
  license_or_copying_note: Used only to validate skill structure. No source phrasing copied.

- source_name: ComposioHQ awesome-codex-skills
  url_or_location: https://github.com/ComposioHQ/awesome-codex-skills
  reviewed_scope: Public collection of task-specific Codex skills across research, planning, triage, writing, and workflow tasks.
  copied_text: no
  useful_pattern: Skills are easier to use when they have clear triggers, task boundaries, workflow steps, examples, and validation notes.
  license_or_copying_note: Reviewed read-only. No third-party skill installed, executed, or copied.

- source_name: Composio content-research-writer skill
  url_or_location: https://raw.githubusercontent.com/ComposioHQ/awesome-codex-skills/master/content-research-writer/SKILL.md
  reviewed_scope: High-level structure for when-to-use guidance, workflow, feedback loop, and examples.
  copied_text: no
  useful_pattern: Use an explicit workflow and feedback loop so the output improves instead of being a one-shot draft.
  license_or_copying_note: Structural review only. No wording or examples copied.

- source_name: Composio create-plan skill
  url_or_location: https://raw.githubusercontent.com/ComposioHQ/awesome-codex-skills/master/create-plan/SKILL.md
  reviewed_scope: Planning structure, scope boundaries, ordered steps, and validation/risk prompts.
  copied_text: no
  useful_pattern: Separate scope, workflow, output requirements, and validation so the agent can act consistently.
  license_or_copying_note: Structural review only. No copied text or commands.

- source_name: Composio issue-triage skill
  url_or_location: https://raw.githubusercontent.com/ComposioHQ/awesome-codex-skills/master/issue-triage/SKILL.md
  reviewed_scope: Prerequisites, workflow, classification, and troubleshooting pattern.
  copied_text: no
  useful_pattern: Input completeness checks and failure handling make the skill more robust.
  license_or_copying_note: Did not adopt command execution or repo-specific workflow details.

- source_name: heilcheng awesome-agent-skills
  url_or_location: https://github.com/heilcheng/awesome-agent-skills
  reviewed_scope: Community index structure and quality-standards framing for agent skills.
  copied_text: no
  useful_pattern: A skill benefits from explicit quality standards, anti-patterns, and reusable references.
  license_or_copying_note: Reviewed as an index only. No skill content copied.

- source_name: VoltAgent awesome-agent-skills
  url_or_location: https://github.com/VoltAgent/awesome-agent-skills
  reviewed_scope: Official/community skill index structure and category grouping.
  copied_text: no
  useful_pattern: Grouping by capability helps route related references without bloating the primary `SKILL.md`.
  license_or_copying_note: Reviewed as an index only. No skill content copied.

- source_name: GitHub topic `codex-skills`
  url_or_location: https://github.com/topics/codex-skills
  reviewed_scope: Public ecosystem breadth and common packaging conventions.
  copied_text: no
  useful_pattern: Public skills are diverse, so Recora should keep a domain-specific contract instead of copying generic taxonomy.
  license_or_copying_note: Topic page used for orientation only.

- source_name: GitHub topic `agent-skills`
  url_or_location: https://github.com/topics/agent-skills
  reviewed_scope: Public ecosystem breadth, cross-agent compatibility claims, and common index/repository patterns.
  copied_text: no
  useful_pattern: Broad ecosystem pages are useful for spotting structure patterns, but not for adopting unverified skill content.
  license_or_copying_note: Topic page used for orientation only. No repository content copied from the topic listings.

- source_name: Local Recora sibling skills
  url_or_location: `.agents/skills/*/SKILL.md` and available `references/`
  reviewed_scope: Recora handoff language, guardrails, and domain-specific skill boundaries.
  copied_text: no
  useful_pattern: Keep Recora skills connected by explicit handoff conditions and avoid app implementation or secret access.
  license_or_copying_note: Sibling skills are used for local consistency. No unrelated Recora skill was modified.

## Useful Patterns

- pattern_name: Trigger-oriented frontmatter
  observed_in: OpenAI skill model, local Recora skills, public skill examples
  why_it_matters: The description is the first routing surface and should clearly state use cases, boundaries, and prohibited uses.
  how_to_adapt_for_recora_prompt_topic_designer: Keep the description focused on Recora prompt-set design, coverage, quality gates, revisions, and no pre-measurement claims.
  risk_if_overused: A description that tries to include every edge case becomes hard to scan and may trigger too broadly.

- pattern_name: Input contract
  observed_in: Public planning/triage skills and local Recora persona/citation/benchmark skills
  why_it_matters: Prompt design quality depends on whether the agent knows client, category, audience, competitor, region, and diagnosis goal.
  how_to_adapt_for_recora_prompt_topic_designer: Require minimum fields, mark assumptions, recommend persona handoff when roles are weak, and avoid URL claims when `website_url` is missing.
  risk_if_overused: Too many required fields can block useful starter sets.

- pattern_name: Progressive disclosure with references
  observed_in: OpenAI skill-creator pattern and public skills with examples/checklists
  why_it_matters: `SKILL.md` stays usable while deeper scoring, examples, and eval scenarios remain available.
  how_to_adapt_for_recora_prompt_topic_designer: Keep core routing in `SKILL.md`; use reference files for quality rubric, coverage matrix, failure diagnosis, iteration loop, examples, and eval scenarios.
  risk_if_overused: Too many references can fragment the workflow unless `SKILL.md` explains when to load each file.

- pattern_name: Step-by-step workflow
  observed_in: Public planning, research, and triage skills
  why_it_matters: A skill produces more reliable output when it has an ordered operational flow rather than a loose list of concepts.
  how_to_adapt_for_recora_prompt_topic_designer: Start with market category and non-branded discovery, then competitor, branded, pricing/reputation, citation, persona, coverage, quality gate, revision, and handoff.
  risk_if_overused: A rigid sequence may be too slow for tiny requests unless modes support `lite`.

- pattern_name: Output schema
  observed_in: Public workflow skills and local Recora skills
  why_it_matters: Reusable fields make prompt sets easier to review, measure, compare, and convert into rows.
  how_to_adapt_for_recora_prompt_topic_designer: Require `id`, `prompt`, `category`, `intent_type`, `buyer_stage`, `persona`, mention rules, `expected_signal`, quality gate fields, and handoff.
  risk_if_overused: Excess schema fields can make exploratory brainstorming feel heavy.

- pattern_name: Quality gates with repair path
  observed_in: Evaluator/audit patterns and local Recora quality-gate style
  why_it_matters: A prompt set should not move to measurement until bias, duplication, unclear signals, and unsupported assumptions are handled.
  how_to_adapt_for_recora_prompt_topic_designer: Use `ready_for_measurement`, `revise_before_measurement`, `internal_only`, and `reject`, with revision records for low-quality prompts.
  risk_if_overused: Gate labels without concrete repair rules can become performative rather than useful.

- pattern_name: Anti-pattern examples
  observed_in: Public quality/documentation skills and local Recora examples
  why_it_matters: Bad examples teach the boundary between keyword lists, leading questions, and measurement-ready prompts.
  how_to_adapt_for_recora_prompt_topic_designer: Maintain Recora-specific examples for SEO keyword dumps, over-branded sets, leading prompts, vague intent, and stage collapse.
  risk_if_overused: Too many examples can invite copying instead of tailoring to the client.

- pattern_name: Evals and pass/fail scenarios
  observed_in: Evaluator, audit, and testing-oriented public skill patterns
  why_it_matters: Scenario checks help confirm the skill behaves under weak inputs and biased prompt drafts.
  how_to_adapt_for_recora_prompt_topic_designer: Use `measurement-readiness-evals.md` to test weak context, missing competitors/personas, over-branding, duplicate prompts, missing handoffs, and unsupported assumptions.
  risk_if_overused: Evals can become checklist theater if failures do not trigger revision.

- pattern_name: Handoff contracts
  observed_in: Local Recora sibling skills and public workflow boundaries
  why_it_matters: Prompt design is upstream of citation analysis, competitor benchmarking, recommendation review, and schema/page improvement.
  how_to_adapt_for_recora_prompt_topic_designer: Label per-prompt `handoff_skill` and state when to use `recora-persona-discovery`, `recora-ai-citation-analysis`, `recora-competitor-benchmark`, `recora-recommendation-quality-gate-auditor`, and `recora-schema-seo-aio`.
  risk_if_overused: Routing everything to every skill creates noise and weak ownership.

- pattern_name: Iteration and versioning
  observed_in: Public review/feedback-loop patterns and software validation habits
  why_it_matters: Prompt sets improve through coverage checks, gate decisions, revisions, and regression checks.
  how_to_adapt_for_recora_prompt_topic_designer: Add `prompt-set-iteration-loop.md` with draft, coverage, quality gate, bias audit, failure diagnosis, revision, readiness recheck, handoff, and freeze version steps.
  risk_if_overused: Too much process can slow lightweight diagnosis.

## Patterns Not Adopted

- pattern_name: Installing or running third-party skills
  observed_in: Public skill repositories with scripts and tool-specific workflows
  reason_not_adopted: The user explicitly requested read-only public research and no third-party script execution.

- pattern_name: Copying external examples into Recora
  observed_in: Public skill examples and awesome-list skill samples
  reason_not_adopted: License and context are not assumed; Recora needs domain-specific examples written from scratch.

- pattern_name: Repo-specific CLI workflows
  observed_in: Issue triage and automation-oriented public skills
  reason_not_adopted: This skill designs prompt sets and should not execute external tools, crawl sites, call providers, or modify app code.

- pattern_name: Large all-in-one `SKILL.md`
  observed_in: Some public skills that keep workflows, examples, and validation in one file
  reason_not_adopted: Recora needs a compact router plus targeted references to keep the skill usable.

- pattern_name: Awesome-list taxonomy copied as capability design
  observed_in: Public agent-skill indexes
  reason_not_adopted: Broad taxonomies are useful for discovery, but Recora needs a narrow, measurement-ready prompt design contract.

- pattern_name: Provider-result assertions before measurement
  observed_in: Generic AI-search or SEO advice patterns in the broader ecosystem
  reason_not_adopted: Recora must avoid pre-measurement claims about brand visibility, rank, citation, or recommendation outcomes.

## Recora Adaptation Plan

- adopted_pattern: Trigger-oriented frontmatter
  target_file: `SKILL.md`
  adaptation_note: Keep the description centered on prompt-set design, coverage, quality gates, revisions, handoff, and guardrails.
  expected_benefit: More accurate skill activation and fewer accidental app/secrets tasks.

- adopted_pattern: Input contract and missing-input handling
  target_file: `SKILL.md`
  adaptation_note: State minimum viable fields, assumptions, persona handoff, competitor-discovery fallback, and no URL-based assertions without `website_url`.
  expected_benefit: Useful starter sets under weak context without pretending the set is final.

- adopted_pattern: Progressive disclosure
  target_file: `SKILL.md` plus `references/*.md`
  adaptation_note: Keep detailed rubrics, coverage, failure diagnosis, examples, evals, and iteration loop in references.
  expected_benefit: Maintains a concise primary skill while making deep review available.

- adopted_pattern: Quality gates and revision rules
  target_file: `references/prompt-quality-rubric.md`
  adaptation_note: Pair gate decisions with concrete gate reasons and revised prompt records.
  expected_benefit: Prevents low-quality prompts from moving into measurement.

- adopted_pattern: Failure diagnosis taxonomy
  target_file: `references/prompt-design-failure-diagnosis.md`
  adaptation_note: Add Recora-specific failure types such as `branded_overfit`, `weak_expected_signal`, `buyer_stage_collapse`, and `measurement_unready`.
  expected_benefit: Faster repair of biased, duplicated, or unmeasurable prompt sets.

- adopted_pattern: Eval scenarios
  target_file: `references/measurement-readiness-evals.md`
  adaptation_note: Expand readiness scenarios for weak context, missing competitors/personas, over-branding, duplicate prompts, missing citation checks, missing handoffs, and unsupported assumptions.
  expected_benefit: Gives reviewers clear pass/fail checks before a prompt set is used.

- adopted_pattern: Iteration and versioning loop
  target_file: `references/prompt-set-iteration-loop.md`
  adaptation_note: Add draft, coverage, quality gate, bias audit, failure diagnosis, revision, readiness recheck, handoff, and version freeze workflow.
  expected_benefit: Supports practical prompt-set improvement rather than one-shot generation.
