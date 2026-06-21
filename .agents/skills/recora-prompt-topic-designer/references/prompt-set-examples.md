# Prompt Set Examples

Examples are fictional and for structure only. Do not treat them as factual evaluations of Recora, a client, competitors, or any real company.

## Japan B2B SaaS Sample Output

```md
## Topic Set

- topic_name: Japan B2B SaaS AI search diagnosis for vendor discovery
- topic_goal: Observe how AI answers describe the category, surface vendors, compare alternatives, cite evidence, and handle brand-specific validation without assuming any result before measurement.
- target_buyer: Japanese B2B SaaS founder, marketing leader, SEO manager, and skeptical evaluator
- buyer_stage: awareness, exploration, comparison, validation, decision
- included_categories: non_branded, competitor_comparison, branded, citation_check, persona_based, problem_solution, alternative_search, pricing_reputation
- risk_notes: Sample assumes a B2B SaaS buying context. It does not make pre-measurement visibility, citation, or recommendation claims for Recora or any vendor.

## Coverage Matrix

- category_coverage:
  - non_branded: 3
  - competitor_comparison: 1
  - branded: 1
  - citation_check: 1
  - persona_based: 1
  - pricing_reputation: 1
- buyer_stage_coverage: awareness, exploration, comparison, validation, decision
- persona_coverage: founder, marketing_leader, seo_manager, evaluator
- intent_coverage: informational, commercial_investigation, comparison, reputational, evidence_seeking, risk_checking
- signal_coverage: brand mention, competitor mention, comparison axes, citation/source, pricing/reputation risk, decision evidence
- brand_vs_nonbrand_balance: brand_excluded 5, brand_included 1, brand_optional 1, competitor_only 1
- competitor_balance: no_competitor 3, category_competitors 2, unknown_competitor_discovery 2, named_competitors 1
- evidence_check_coverage: present
- missing_required_area: none for lite sample; expand counts for standard or deep mode
- revision_needed: no for structure sample; still validate against real client context before measurement

## Prompt List

| id | prompt | category | intent_type | buyer_stage | persona | brand_mention_rule | competitor_mention_rule | expected_signal | risk_or_bias | handoff_skill | quality_score | gate_decision | gate_reason |
|---|---|---|---|---|---|---|---|---|---|---|---:|---|---|
| PTD-JP-B2B-001 | For a Japanese B2B SaaS company, what kinds of AI search or GEO diagnosis services should a marketing leader compare before choosing a vendor? | non_branded | commercial_investigation | exploration | marketing_leader | brand_excluded | unknown_competitor_discovery | Observe whether the answer surfaces category labels, vendor types, comparison criteria, and unprompted brand or competitor mentions. | May surface broad agency alternatives; keep as discovery signal, not a ranking claim. | recora-competitor-benchmark | 88 | ready_for_measurement | none |
| PTD-JP-B2B-002 | What problems usually lead a B2B SaaS team to investigate AI search visibility or GEO diagnosis? | problem_solution | informational | awareness | founder | brand_excluded | no_competitor | Observe whether AI connects buyer pain to visibility, citations, lead quality, content evidence, or competitive discovery. | Could return generic SEO advice; check if GEO is distinguished from SEO. | none | 84 | ready_for_measurement | none |
| PTD-JP-B2B-003 | When comparing AI search diagnosis tools for B2B SaaS, what evaluation criteria should an SEO manager use? | competitor_comparison | comparison | comparison | seo_manager | brand_excluded | category_competitors | Observe comparison axes such as measurement design, prompt coverage, citation tracking, competitor analysis, and reporting quality. | Does not measure named competitor deltas unless paired with supplied competitor list. | recora-competitor-benchmark | 87 | ready_for_measurement | none |
| PTD-JP-B2B-004 | If a team is evaluating Recora as an AI search diagnosis service, what evidence should they review before relying on the results? | branded | evidence_seeking | validation | skeptical_evaluator | brand_included | no_competitor | Observe brand explanation accuracy, evidence requirements, and whether unsupported claims appear. | Branded seed is intentional for validation only. | recora-recommendation-quality-gate-auditor | 82 | ready_for_measurement | none |
| PTD-JP-B2B-005 | What sources or page types would be useful when evaluating whether a B2B SaaS vendor is likely to be understood correctly by AI search systems? | citation_check | evidence_seeking | validation | seo_manager | brand_excluded | category_competitors | Observe source types, citation readiness themes, and source-to-claim checkability. | Do not infer actual citations until measured. | recora-ai-citation-analysis | 85 | ready_for_measurement | none |
| PTD-JP-B2B-006 | As a founder preparing a sales deck, what proof would help explain why an AI search diagnosis matters for pipeline quality? | persona_based | commercial_investigation | decision | founder | brand_excluded | no_competitor | Observe executive proof needs and sales-enablement evidence gaps. | May mix strategy advice with measurement; keep signal scoped. | recora-schema-seo-aio | 80 | ready_for_measurement | none |
| PTD-JP-B2B-007 | Besides buying a dedicated AI search diagnosis tool, what alternatives might a Japanese B2B SaaS team consider? | alternative_search | commercial_investigation | exploration | marketing_leader | brand_excluded | unknown_competitor_discovery | Observe substitute solutions such as agency support, internal SEO/content work, analytics, or manual AI answer review. | Alternatives may not be direct competitors; classify downstream. | recora-competitor-benchmark | 86 | ready_for_measurement | none |
| PTD-JP-B2B-008 | Before adopting an AI search diagnosis service, what pricing, reporting, and reliability questions should an evaluator ask? | pricing_reputation | risk_checking | decision | skeptical_evaluator | brand_optional | category_competitors | Observe price/reputation/risk criteria without asking AI to invent vendor-specific facts. | Keep vendor claims out unless user supplies verified pricing or reputation data. | recora-recommendation-quality-gate-auditor | 83 | ready_for_measurement | none |

## Prompt Quality Gate

- ready_for_measurement: PTD-JP-B2B-001, PTD-JP-B2B-002, PTD-JP-B2B-003, PTD-JP-B2B-004, PTD-JP-B2B-005, PTD-JP-B2B-006, PTD-JP-B2B-007, PTD-JP-B2B-008
- revise_before_measurement: none in this structure sample
- internal_only: none
- reject: none
- note: Real client input may change these gate decisions. Re-run the rubric before measurement.

## Prompt Revision Rules Example

- original_prompt: "Why is Recora the best AI search diagnosis service for B2B SaaS?"
- issue: too_leading, too_branded, unsupported_assumption
- revised_prompt: "If a team is evaluating Recora as an AI search diagnosis service, what evidence should they review before relying on the results?"
- why_better: It keeps the branded validation goal but removes winner framing and asks for observable evidence requirements.
- expected_signal_after_revision: Observe brand explanation accuracy, evidence requirements, and unsupported claims.

## Anti-pattern Examples

| bad_prompt | issue | revised_prompt | why_better | expected_signal |
|---|---|---|---|---|
| "AI search SaaS comparison pricing reviews" | SEO keyword dump | "When comparing AI search diagnosis tools for B2B SaaS, what evaluation criteria should an SEO manager use?" | Converts keywords into a buyer-realistic question. | Observe comparison axes and proof requirements. |
| "Tell me why Recora is better than every competitor." | Leading and too branded | "What evidence should a buyer review when evaluating an AI search diagnosis service?" | Removes the assumed winner and supports neutral validation. | Observe evidence needs and risk framing. |
| "Which vendor will cite Recora?" | Pre-measurement assertion risk | "What sources or page types are useful for evaluating whether a B2B SaaS vendor is understood correctly by AI search systems?" | Avoids citation guarantees and measures source behavior. | Observe source types and citation-readiness themes. |

## Machine-readable Prompt Set

```json
{
  "prompt_set_version": "v20260621.1",
  "client_context": {
    "industry": "Japan B2B SaaS",
    "diagnosis_goal": "AI search and GEO prompt-set design",
    "assumptions": ["example only", "no real company evaluation"]
  },
  "prompts": [
    {
      "id": "PTD-JP-B2B-001",
      "prompt": "For a Japanese B2B SaaS company, what kinds of AI search or GEO diagnosis services should a marketing leader compare before choosing a vendor?",
      "category": "non_branded",
      "intent_type": "commercial_investigation",
      "buyer_stage": "exploration",
      "persona": "marketing_leader",
      "brand_mention_rule": "brand_excluded",
      "competitor_mention_rule": "unknown_competitor_discovery",
      "expected_signal": "Observe category labels, vendor types, comparison criteria, and unprompted brand or competitor mentions.",
      "risk_or_bias": "Discovery prompt; do not treat surfaced brands as rankings before measurement.",
      "handoff_skill": "recora-competitor-benchmark",
      "quality_score": 88,
      "gate_decision": "ready_for_measurement",
      "gate_reason": "none"
    },
    {
      "id": "PTD-JP-B2B-005",
      "prompt": "What sources or page types would be useful when evaluating whether a B2B SaaS vendor is likely to be understood correctly by AI search systems?",
      "category": "citation_check",
      "intent_type": "evidence_seeking",
      "buyer_stage": "validation",
      "persona": "seo_manager",
      "brand_mention_rule": "brand_excluded",
      "competitor_mention_rule": "category_competitors",
      "expected_signal": "Observe source types, citation readiness themes, and source-to-claim checkability.",
      "risk_or_bias": "Do not infer actual citations until measured.",
      "handoff_skill": "recora-ai-citation-analysis",
      "quality_score": 85,
      "gate_decision": "ready_for_measurement",
      "gate_reason": "none"
    }
  ]
}
```

## Metric Eligibility Example

Use branded prompts for sentiment / brand perception only. Do not use them for AI Visibility Rate or AI Ranking.

| id | prompt_type | category | brand_mention_rule | metric_eligibility | metric_use_note |
|---|---|---|---|---|---|
| PTD-METRIC-001 | non-branded natural search | non_branded | brand_excluded | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Use to measure whether the brand appears without brand seeding and how it is positioned among market options. |
| PTD-METRIC-002 | competitor comparison | competitor_comparison | brand_excluded | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Use to measure market ranking or shortlist position across category competitors. |
| PTD-METRIC-003 | branded perception check | branded | brand_included | visibility_rate: excluded; ranking: excluded; sentiment: eligible | Use only to evaluate how AI describes the brand, its strengths, risks, trust, or reputation. |

Sentiment output for `PTD-METRIC-003`:

```md
sentiment_label: neutral
sentiment_reason: The answer describes the brand conditionally and asks the buyer to verify evidence before adoption.
quoted_or_observed_phrase: "verify product fit, support, pricing, and third-party evidence"
risk_note: Do not treat this branded answer as AI visibility or market ranking.
needs_verification: true
```

Machine-readable metric eligibility:

```json
{
  "id": "PTD-METRIC-003",
  "category": "branded",
  "brand_mention_rule": "brand_included",
  "metric_eligibility": {
    "visibility_rate": "excluded",
    "ranking": "excluded",
    "sentiment": "eligible"
  }
}
```

## Industry Adapter Mini Examples

These are fictional structure examples only. They do not claim actual AI visibility, ranking, citation, or sentiment.

### BtoC Service Mini Example

| id | prompt | category | brand_mention_rule | competitor_mention_rule | expected_signal | metric_eligibility |
|---|---|---|---|---|---|---|
| PTD-B2C-001 | What should a first-time user compare before choosing an online personal coaching service? | non_branded | brand_excluded | unknown_competitor_discovery | Observe consumer decision criteria such as price, reviews, convenience, support, and first-time anxiety. | visibility_rate: eligible; ranking: eligible; sentiment: excluded |
| PTD-B2C-002 | Besides paid coaching, what alternatives might someone consider when they want help with this problem? | alternative_search | brand_excluded | unknown_competitor_discovery | Observe substitutes such as apps, free resources, communities, lower-cost services, or in-person support. | visibility_rate: eligible; ranking: eligible; sentiment: excluded |
| PTD-B2C-003 | If someone is evaluating ExampleService, what reputation, price, and support concerns should they verify? | branded | brand_included | no_competitor | Observe brand perception, trust, review concerns, and risk framing. | visibility_rate: excluded; ranking: excluded; sentiment: eligible |

### Local Business Mini Example

| id | prompt | category | brand_mention_rule | competitor_mention_rule | expected_signal | metric_eligibility |
|---|---|---|---|---|---|---|
| PTD-LOCAL-001 | How should someone compare nearby hair salons in a specific area before booking for the first time? | non_branded | brand_excluded | unknown_competitor_discovery | Observe local discovery, review themes, access, booking, price, and first-visit concerns. | visibility_rate: eligible; ranking: eligible; sentiment: excluded |
| PTD-LOCAL-002 | What alternatives should a user consider if nearby salons are fully booked or hard to compare? | alternative_search | brand_excluded | category_competitors | Observe nearby substitutes, area expansion, booking platforms, and service alternatives. | visibility_rate: eligible; ranking: eligible; sentiment: excluded |
| PTD-LOCAL-003 | If someone is checking ExampleSalon, what review themes and visit risks should they verify before booking? | branded | brand_included | no_competitor | Observe local brand sentiment, review concerns, atmosphere, access, and booking friction. | visibility_rate: excluded; ranking: excluded; sentiment: eligible |

### Clinic / Healthcare Mini Example

| id | prompt | category | brand_mention_rule | competitor_mention_rule | expected_signal | metric_eligibility |
|---|---|---|---|---|---|---|
| PTD-CLINIC-001 | What general information should someone check before consulting a clinic about this kind of concern? | non_branded | brand_excluded | no_competitor | Observe whether AI stays general, suggests professional consultation, and surfaces safety/source needs. | visibility_rate: eligible; ranking: excluded; sentiment: excluded |
| PTD-CLINIC-002 | When comparing clinics for this concern, what safety, qualification, cost, and aftercare points should be verified? | competitor_comparison | brand_excluded | category_competitors | Observe cautious comparison axes, credential checks, risk language, and evidence requirements. | visibility_rate: eligible; ranking: eligible; sentiment: excluded |
| PTD-CLINIC-003 | If someone is evaluating ExampleClinic, what trust, safety, qualification, and reputation points should they verify? | branded | brand_included | no_competitor | Observe brand trust, risk framing, qualification clarity, and unsupported-claim risk. | visibility_rate: excluded; ranking: excluded; sentiment: eligible |

## Caveat

Sample prompts are not evidence that a brand appears, is cited, is ranked, or is recommended. Always run measurement before making visibility, citation, or recommendation claims.
