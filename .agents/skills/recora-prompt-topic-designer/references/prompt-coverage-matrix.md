# Prompt Coverage Matrix

Use this reference when checking whether a Recora prompt set is balanced, machine-readable, and ready for measurement.

## Required Coverage Fields

```md
## Coverage Matrix

- category_coverage:
- buyer_stage_coverage:
- persona_coverage:
- intent_coverage:
- signal_coverage:
- brand_vs_nonbrand_balance:
- competitor_balance:
- evidence_check_coverage:
- missing_required_area:
- revision_needed:
```

## Field Guidance

- `category_coverage`: counts and gaps for `non_branded`, `branded`, `competitor_comparison`, `problem_solution`, `alternative_search`, `pricing_reputation`, `citation_check`, and `persona_based`.
- `buyer_stage_coverage`: coverage for `awareness`, `exploration`, `comparison`, `validation`, and `decision`.
- `persona_coverage`: personas or roles covered, including assumed personas and missing buyer roles.
- `intent_coverage`: coverage for `informational`, `commercial_investigation`, `comparison`, `transactional`, `reputational`, `evidence_seeking`, and `risk_checking`.
- `signal_coverage`: whether expected signals cover brand mention, competitor mention, citation/source, recommendation/order, comparison axes, pricing/reputation, and risk.
- `brand_vs_nonbrand_balance`: count `brand_excluded`, `brand_included`, `brand_optional`, and `competitor_only`.
- `competitor_balance`: count `no_competitor`, `named_competitors`, `category_competitors`, and `unknown_competitor_discovery`.
- `evidence_check_coverage`: whether `citation_check` and `evidence_seeking` prompts exist.
- `missing_required_area`: list missing categories, stages, personas, intents, or signals.
- `revision_needed`: `yes` or `no`, with reason.

## Mode Minimums

| mode | minimum_prompt_count | minimum_category_coverage | minimum_buyer_stage_coverage | minimum_persona_coverage | required evidence check |
|---|---:|---|---|---|---|
| `lite` | 8 | at least `non_branded`, `competitor_comparison`, `branded`, `citation_check`, `persona_based` | 3 stages | 2 personas or roles | 1 citation/evidence prompt |
| `standard` | 16 | all required categories | 4 stages | 3 personas or roles | 2+ citation/evidence prompts |
| `deep` | 32 | all required categories with variants | all 5 stages | 5 personas or roles | citation/evidence prompts across multiple stages |

## Balance Rules

- Default broad diagnosis target: about 60% `non_branded`, 20% `competitor_comparison`, 10% `branded`, 10% `citation_check`.
- `branded` prompts should not dominate unless the diagnosis goal is explicitly branded-answer quality.
- If `competitors` are unknown, prefer `unknown_competitor_discovery` and `category_competitors`.
- If persona coverage is weak, mark `revision_needed: yes` and hand off to `recora-persona-discovery`.
- If citation/evidence coverage is missing, add at least one `citation_check` prompt or mark the prompt set not ready for source analysis.

## Failure Diagnosis Hooks

Use `prompt-design-failure-diagnosis.md` when the matrix shows these gaps:

| coverage_gap | likely_failure_type | required_repair |
|---|---|---|
| `non_branded` missing or thin | `non_branded_undercoverage` | Add natural `brand_excluded` discovery prompts before branded validation. |
| `brand_included` dominates | `branded_overfit` | Reduce brand seeding and rebalance toward category, problem, and alternative prompts. |
| buyer stages missing | `buyer_stage_collapse` | Add awareness, exploration, validation, and decision prompts as needed. |
| persona coverage missing or shallow | `persona_flattening` | Change wording and expected signal by role, or hand off to `recora-persona-discovery`. |
| evidence prompts missing | `citation_check_missing` | Add `citation_check` / `evidence_seeking` prompts and hand off to `recora-ai-citation-analysis`. |
| competitor mix too narrow | `competitor_overconstraint` | Mix `named_competitors`, `category_competitors`, and `unknown_competitor_discovery`. |
| signal coverage vague | `weak_expected_signal` | Rewrite `expected_signal` into observable mention, citation, comparison, recommendation, or risk signals. |
| labels or IDs inconsistent | `machine_readability_failure` | Normalize fields, allowed values, and one stable ID per prompt. |

If any hook is triggered, set `revision_needed: yes`, revise the prompt set, and rerun the matrix before freezing a version.

## Machine-readable Coverage Example

```json
{
  "category_coverage": {"non_branded": 10, "competitor_comparison": 4, "branded": 2, "citation_check": 2},
  "buyer_stage_coverage": ["awareness", "exploration", "comparison", "validation"],
  "persona_coverage": ["marketing_leader", "seo_manager", "founder"],
  "intent_coverage": ["informational", "comparison", "evidence_seeking", "reputational"],
  "signal_coverage": ["brand_mention", "competitor_mention", "citation", "recommendation", "risk"],
  "brand_vs_nonbrand_balance": {"brand_excluded": 14, "brand_included": 2},
  "competitor_balance": {"unknown_competitor_discovery": 3, "category_competitors": 3, "no_competitor": 10},
  "evidence_check_coverage": "present",
  "missing_required_area": [],
  "revision_needed": "no"
}
```
