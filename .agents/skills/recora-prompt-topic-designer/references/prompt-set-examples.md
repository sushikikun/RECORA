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

### Real Persona Query Rows for BtoC / Local / Clinic

Use `raw_user_intent` to preserve the buyer's rough language and `final_prompt` as the safe measurement prompt.

| id | raw_user_intent | final_prompt | category | language_mode | safety_adjustment | metric_eligibility | expected_signal |
|---|---|---|---|---|---|---|---|
| PTD-B2C-RAW-001 | "安い パーソナルコーチ 口コミ" | "料金や口コミを重視してパーソナルコーチングを選ぶ人は、価格・サポート内容・口コミをどう確認すべきですか？" | non_branded | raw_search_like | Does not ask AI to assert that any provider is cheap or well reviewed. | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe price/review/support comparison axes and consumer decision barriers. |
| PTD-LOCAL-RAW-001 | "新宿 美容室 今日 口コミ悪い 避けたい" | "新宿で今日行ける美容室を探す人は、口コミ・空き状況・料金・アクセスをどう確認すべきですか？" | non_branded | anxious_user | Keeps local urgency and review concern without claiming a business has bad reviews. | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe local intent, availability, review caution, and booking criteria. |
| PTD-CLINIC-RAW-001 | "東京 シミ取り 安い 口コミ" | "東京でシミ取りや肌治療の相談先を探すとき、料金・口コミ・医師情報・リスク説明はどう確認すべきですか？" | non_branded | raw_search_like | Converts treatment shorthand into consultation and verification wording. | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe local clinic discovery, price/review concerns, credential checks, and risk-language behavior. |
| PTD-CLINIC-RAW-002 | "美容クリニック 初めて 怖い" | "美容クリニックが初めてで不安な人は、カウンセリング前にどんな点を確認すると安心材料になりますか？" | persona_based | anxious_user | Preserves anxiety but avoids diagnosis, treatment selection, or guaranteed safety. | visibility_rate: excluded; ranking: excluded; sentiment: excluded | Observe first-time anxiety, counseling-readiness guidance, and unsafe-claim avoidance. |
| PTD-CLINIC-RAW-003 | "ダーマペン 失敗しないクリニック" | "肌治療の相談先を比較するとき、失敗リスクを避けるために口コミ・説明内容・医師情報・アフターケアをどう確認すべきですか？" | competitor_comparison | comparison_shortcut | Rewrites "failure-free clinic" into risk-check and verification language. | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe comparison axes, aftercare language, credential checks, and whether AI avoids guarantees. |
| PTD-CLINIC-RAW-004 | "ExampleClinic 口コミ悪い？" | "ExampleClinicを検討する人は、口コミ・料金説明・カウンセリング内容についてどんな点を確認すべきですか？" | branded | anxious_user | Uses branded sentiment only and avoids treating reputation as fact before measurement. | visibility_rate: excluded; ranking: excluded; sentiment: eligible | Observe brand perception, reputation concern framing, and whether unsupported negative claims appear. |

### Topic-first BtoC / Clinic Example

This example shows Topic Set -> Topic Coverage Matrix -> Topic-to-Prompt Mapping -> Prompt List. It is fictional and does not claim actual visibility, ranking, citation, or sentiment.

#### Topic Set

| topic_id | topic_name | topic_type | diagnosis_goal | target_persona | buyer_stage | metric_target | brand_mention_policy | expected_signal | minimum_prompt_count | risk_or_bias | handoff_skill |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| TOPIC-CLINIC-LOCAL-001 | 東京の美容クリニック選びで、料金・口コミ・安全性がAI回答でどう扱われるか | local_regional_topic | Observe local clinic discovery, price/review framing, safety language, and whether AI avoids unsupported medical claims. | 初めて美容医療を検討する人, 料金重視の人, 口コミを確認したい人 | exploration, comparison, validation | visibility_rate: eligible; ranking: eligible; sentiment: excluded; citation_check: optional; risk_check: eligible | brand_excluded | Observe local clinic options or categories, price/review/safety axes, and cautious risk or consultation wording. | 3 | Reviews and price may be stale or unsupported; avoid treatment recommendations and safety guarantees. | recora-competitor-benchmark |
| TOPIC-CLINIC-BRAND-001 | ExampleClinicの口コミ・料金説明・カウンセリングがブランド感情としてどう語られるか | branded_sentiment_topic | Observe brand perception, reputation concern framing, and unsupported claim risk. | 口コミを確認したい人 | validation | visibility_rate: excluded; ranking: excluded; sentiment: eligible; citation_check: optional; risk_check: eligible | brand_included | Observe sentiment label candidates, trust/risk wording, and whether AI invents reputation claims. | 1 | Branded prompt is sentiment-only and must not be counted in visibility or ranking. | recora-recommendation-quality-gate-auditor |

#### Topic Coverage Matrix

- required_topics: local_regional_topic, branded_sentiment_topic, regulated_risk_topic
- covered_topics: TOPIC-CLINIC-LOCAL-001, TOPIC-CLINIC-BRAND-001
- undercovered_topics: regulated_risk_topic can be expanded with a citation/risk source topic in standard mode
- overcovered_topics: none
- missing_metric_target: none
- missing_persona_angle: none for sample scope
- missing_buyer_stage: awareness can be added for full diagnosis
- missing_language_mode: none
- topic_balance_note: Non-branded local topic drives visibility/ranking; branded topic is sentiment-only.

#### Topic-to-Prompt Mapping

| topic_id | topic_name | prompt_ids | prompt_count | prompt_language_modes | metric_eligibility_summary | coverage_status | missing_prompt_type | revision_needed |
|---|---|---|---:|---|---|---|---|---|
| TOPIC-CLINIC-LOCAL-001 | 東京の美容クリニック選びで、料金・口コミ・安全性がAI回答でどう扱われるか | PTD-CLINIC-TOKYO-001, PTD-CLINIC-TOKYO-002, PTD-CLINIC-TOKYO-003 | 3 | natural_conversation, anxious_user, raw_search_like | visibility_rate eligible 3; ranking eligible 3; sentiment excluded 3 | covered | none | no |
| TOPIC-CLINIC-BRAND-001 | ExampleClinicの口コミ・料金説明・カウンセリングがブランド感情としてどう語られるか | PTD-CLINIC-BRAND-001 | 1 | anxious_user | visibility_rate excluded 1; ranking excluded 1; sentiment eligible 1 | covered for lite sentiment sample | none | no |

#### Prompt List

| id | topic_id | raw_user_intent | prompt | category | language_mode | brand_mention_rule | competitor_mention_rule | metric_eligibility | expected_signal |
|---|---|---|---|---|---|---|---|---|---|
| PTD-CLINIC-TOKYO-001 | TOPIC-CLINIC-LOCAL-001 | | 東京で美容クリニックを選ぶとき料金と口コミはどう比較すべき？ | non_branded | natural_conversation | brand_excluded | unknown_competitor_discovery | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe price/review comparison axes and local discovery behavior. |
| PTD-CLINIC-TOKYO-002 | TOPIC-CLINIC-LOCAL-001 | 美容クリニック 口コミ悪い 避けたい | 美容クリニックの口コミを見るとき、参考になる内容と慎重に扱うべき内容はどう分けられますか？ | pricing_reputation | anxious_user | brand_excluded | no_competitor | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe review-risk framing without treating unverified reviews as facts. |
| PTD-CLINIC-TOKYO-003 | TOPIC-CLINIC-LOCAL-001 | 東京 肌治療 相談先 何見る | 東京で肌治療の相談先を探すとき、料金・医師情報・リスク説明は何を確認すべき？ | non_branded | raw_search_like | brand_excluded | category_competitors | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe safety, credential, price, and risk explanation signals without treatment recommendations. |
| PTD-CLINIC-BRAND-001 | TOPIC-CLINIC-BRAND-001 | ExampleClinic 口コミ悪い？ | ExampleClinicを検討する人は、口コミ・料金説明・カウンセリング内容についてどんな点を確認すべきですか？ | branded | anxious_user | brand_included | no_competitor | visibility_rate: excluded; ranking: excluded; sentiment: eligible | Observe brand sentiment and unsupported-reputation risk; do not use for visibility or ranking. |

## Minimum Input Mode Example

This example uses only the four required minimum inputs. It is a draft measurement design with caveats, not a verified client benchmark.

```md
input:
  client_name: Example Beauty Clinic
  industry: 美容クリニック
  product_or_service: 美容医療・肌治療相談
  target_customers: 肌悩みがある20〜40代、初めて美容医療を検討する人
```

### Input Completion Table Excerpt

| field | value | status | confidence | reason | used_for | caveat |
|---|---|---|---|---|---|---|
| client_name | Example Beauty Clinic | provided | high | User supplied. | branded sentiment prompts | Fictional sample; no real evaluation. |
| website_url | not provided | missing | high | No URL supplied. | citation and site-evidence caveats | Do not assert official pages, schema, pricing, or citation readiness. |
| business_model | local appointment-based service | inferred | medium | Clinic and consultation wording imply reservation/visit flow. | buyer stage, local intent, prompt families | Confirm booking model and service area. |
| buyer_roles_or_personas | first-time consulter, price/safety comparer, review checker, anxious user | inferred | medium | Derived from target customers. | persona coverage, language mode | Validate with `recora-persona-discovery` before final reporting. |
| competitors | unknown clinic/category alternatives | needs_confirmation | low | No competitor list supplied. | comparison and ranking prompts | Use `unknown_competitor_discovery`; do not invent names. |
| diagnosis_goal | Diagnose non-branded discovery, comparison, citation behavior, and brand sentiment for the clinic category. | inferred | medium | Standard goal from Minimum Input Mode. | Topic Set and metrics | Treat as draft until client confirms goals. |
| industry_adapter | clinic_healthcare + local_business | inferred | medium | Clinic category with likely local visit behavior. | safety and local prompt design | Avoid diagnosis, treatment recommendation, and safety guarantees. |

### Assumptions / Caveats / Needs Confirmation

- assumptions: local appointment behavior, first-time and anxious users, price/review/safety concerns.
- caveats: URL, real competitors, official claims, pricing, reviews, service area, and doctor information are not verified.
- needs_confirmation: website_url, regions, competitor list, confirmed services, pricing policy, claims that may appear on the official site.

### Inferred Personas

- first-time consulter
- price and safety comparer
- review checker
- anxious user

### Topic Set Excerpt

| topic_id | topic_name | topic_type | metric_target | brand_mention_policy | expected_signal | source_status |
|---|---|---|---|---|---|---|
| TOPIC-MIN-CLINIC-001 | 美容クリニックを初めて検討する人の非指名探索 | local_regional_topic | visibility_rate: eligible; ranking: eligible; sentiment: excluded; citation_check: optional; risk_check: eligible | brand_excluded | Observe whether AI surfaces cautious selection criteria, clinic/category alternatives, price/review/safety axes, and avoids medical overclaiming. | based_on_inferred_context |
| TOPIC-MIN-CLINIC-002 | 料金・口コミ・安全性の比較確認 | pricing_reputation_topic | visibility_rate: eligible; ranking: eligible; sentiment: excluded; citation_check: optional; risk_check: eligible | brand_excluded | Observe how price, reviews, doctor information, and risk explanation are framed without treating unverified reviews as fact. | based_on_inferred_context |
| TOPIC-MIN-CLINIC-003 | Example Beauty Clinicのブランド感情 | branded_sentiment_topic | visibility_rate: excluded; ranking: excluded; sentiment: eligible; citation_check: optional; risk_check: eligible | brand_included | Observe brand perception, trust/risk wording, and whether AI invents reputation or pricing claims. | based_on_provided_input |

### Prompt List Excerpt

| id | topic_id | raw_user_intent | prompt | category | language_mode | buyer_stage | persona | brand_mention_rule | competitor_mention_rule | metric_eligibility | expected_signal | source_status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PTD-MIN-CLINIC-001 | TOPIC-MIN-CLINIC-001 | 美容クリニック 初めて 怖い | 美容クリニックが初めてで不安な人は、カウンセリング前にどんな点を確認すると安心材料になりますか？ | persona_based | anxious_user | awareness | first-time consulter | brand_excluded | no_competitor | visibility_rate: eligible; ranking: excluded; sentiment: excluded | Observe first-time anxiety handling, consultation-readiness guidance, and unsafe-claim avoidance. | based_on_inferred_context |
| PTD-MIN-CLINIC-002 | TOPIC-MIN-CLINIC-001 | 肌治療 相談先 何見る | 肌治療の相談先を探すとき、料金・医師情報・リスク説明はどう確認すべきですか？ | non_branded | raw_search_like | exploration | price and safety comparer | brand_excluded | category_competitors | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe category discovery, safety/credential checks, and price/review comparison axes. | based_on_inferred_context |
| PTD-MIN-CLINIC-003 | TOPIC-MIN-CLINIC-002 | 美容クリニック 口コミ悪い 避けたい | 美容クリニックの口コミを見るとき、参考になる内容と慎重に扱うべき内容はどう分けられますか？ | pricing_reputation | anxious_user | validation | review checker | brand_excluded | no_competitor | visibility_rate: eligible; ranking: excluded; sentiment: excluded | Observe review-risk framing without treating unverified reputation as fact. | based_on_inferred_context |
| PTD-MIN-CLINIC-004 | TOPIC-MIN-CLINIC-002 | 美容クリニック 比較 料金 安全 | 美容クリニックを比較するとき、料金説明、医師情報、カウンセリング内容、リスク説明はどう見比べればよいですか？ | competitor_comparison | comparison_shortcut | comparison | price and safety comparer | brand_excluded | unknown_competitor_discovery | visibility_rate: eligible; ranking: eligible; sentiment: excluded | Observe comparison axes and unknown category competitors without seeding names. | based_on_inferred_context |
| PTD-MIN-CLINIC-005 | TOPIC-MIN-CLINIC-003 | Example Beauty Clinic 口コミ | Example Beauty Clinicを検討する人は、口コミ・料金説明・カウンセリング内容についてどんな点を確認すべきですか？ | branded | anxious_user | validation | review checker | brand_included | no_competitor | visibility_rate: excluded; ranking: excluded; sentiment: eligible | Observe brand sentiment and unsupported-reputation risk; do not use for visibility or ranking. | based_on_provided_input |

### Measurement Readiness

- readiness_decision: production_measurement_ready_with_caveats
- not_full_client_verified: true
- next_data_needed: website_url, region/service area, competitor list, confirmed services, pricing page, claims/proof, persona validation, known strengths/risks.
```

## Caveat

Sample prompts are not evidence that a brand appears, is cited, is ranked, or is recommended. Always run measurement before making visibility, citation, or recommendation claims.
