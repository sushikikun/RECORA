# Prompt Final Checklist

## Final Checklist

Before delivering:

- Only files under `recora-prompt-topic-designer` are changed.
- Frontmatter has `name` and a trigger-oriented `description`.
- Reference files are readable and linked from `SKILL.md`.
- External or sibling skills were used for structure only, not copied text.
- Public skill research records `copied_text: no` and no third-party scripts were executed.
- `non_branded`, `buyer_stage`, `persona`, `expected_signal`, `quality_score`, `gate_decision`, and `measurement_readiness` are present.
- `response_shape`, `candidate_mention_opportunity`, and `ranking_opportunity` are present before deriving metric eligibility.
- Topic Set, Topic Coverage Matrix, and Topic-to-Prompt Mapping are present for substantial prompt-set design.
- Every prompt has at least one `topic_id`.
- Every topic has `expected_signal`, `metric_target`, and a topic quality decision.
- `metric_eligibility` is present and branded prompts are excluded from visibility rate and ranking.
- Visibility rate eligibility is limited to brand-excluded prompts with direct or likely candidate mention opportunity.
- Ranking eligibility is limited to brand-excluded prompts with direct ranking or comparable-set opportunity.
- Sentiment / brand perception is reported separately from visibility rate and ranking.
- Industry/business-model adapter fit is checked when the client is not a generic B2B SaaS case.
- `language_mode` and persona-query realism are checked when BtoC, local, clinic/healthcare, or practical BtoB buyer language matters.
- No prompt claims visibility, citation, recommendation, ranking, traffic, revenue, or conversion before measurement.
- Weak prompts have revisions.
- Failure diagnosis and the iteration loop are used when a prompt set is not ready.
- Output can become machine-readable rows.
- Handoff targets are explicit when downstream analysis is useful.
- No placeholder items remain.
