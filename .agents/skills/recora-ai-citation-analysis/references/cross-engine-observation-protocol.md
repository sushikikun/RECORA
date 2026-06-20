# Cross-engine Observation Protocol

Use this reference when comparing AI search or LLM-answer citation behavior across systems, models, interfaces, regions, languages, dates, or personas.

## Required Fields

Record these fields for each observation:

- `engine`
- `model_name`
- `interface`
- `prompt_text`
- `topic`
- `persona`
- `language`
- `region`
- `observed_at`
- `run_id`
- `answer_text`
- `cited_urls`
- `citation_ui_type`
- `logged_in_state`
- `personalization_possible`
- `notes`

## Engine Examples

- `ChatGPT`
- `Gemini`
- `Perplexity`
- `Google AI Overview`
- `Google AI Mode`
- `Claude`
- `Copilot`
- `other`

## Citation UI Type Examples

- `inline_link`
- `footnote`
- `source_card`
- `sources_panel`
- `search_result_link`
- `answer_grounding_link`
- `none`
- `unknown`

## Protocol Rules

- Do not aggregate observations with different `engine` or `model_name` without labeling them separately.
- Do not aggregate observations with different `interface` because web, app, browser extension, search, and API-like surfaces may cite differently.
- Do not aggregate observations with different `persona`, `prompt_text`, buyer stage, region, or language.
- Record logged-in state and possible personalization.
- Treat Google AI Overview, Google AI Mode, ChatGPT, Perplexity, Gemini, Claude, and Copilot as different citation surfaces.
- Citation UI types are not equivalent; a source card may not mean the same thing as an inline citation or answer-grounding link.
- Source gap should be compared inside the same observation set before cross-engine interpretation.
- One observation is `anecdotal_observation`.
- Twenty-plus observations may still fail to be a `stronger_pattern` if the conditions are mixed.
- Do not infer global AI behavior from one engine or one date.

## Observation Set Definition

A comparable observation set should share:

- same or intentionally grouped prompt family.
- same engine.
- same model or model family where version differences are acknowledged.
- same interface type.
- same language and region.
- same persona or buyer stage.
- similar observation window.
- same logged-in/personalization condition where possible.

If any of these differ, split the analysis or clearly label the limitation.

## Count Thresholds

- `1 observation`: `anecdotal_observation`
- `2-5 observations`: `weak_pattern`
- `6-19 observations`: `emerging_pattern`
- `20+ observations`: `stronger_pattern` only when conditions are comparable.

## Cross-engine Comparison Table

| engine | model_name | interface | language | region | observation_count | own_site_citations | competitor_citations | third_party_citations | dominant_source_types | caveat |
|---|---|---|---|---|---:|---:|---:|---:|---|---|

## Google AI Search Caution

For Google AI Overview and Google AI Mode:

- Normal SEO foundations, indexability, snippet control, and readable primary page text matter as prerequisites or support signals.
- Special schema or AI-specific files alone do not guarantee AI citation growth.
- Structured data should support and match visible content.
- Google AI Overview / AI Mode citation behavior should be separated from ChatGPT / Perplexity / Gemini citation behavior.

## Reporting Guidance

Prefer language such as:

- `In the Google AI Overview observations checked here...`
- `Perplexity showed a different citation mix in this observation set...`
- `These results should not be combined because the model/interface conditions differ...`
- `A same-condition follow-up run is needed to confirm whether this is a stable pattern...`

Avoid language such as:

- `AI systems cite this source type.`
- `The competitor wins across AI.`
- `This pattern is stable` when observation count or conditions do not support it.
