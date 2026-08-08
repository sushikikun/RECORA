# Evidence Ledger Schema

Project: Recora Evidence-Based Recommendation Program
Status: v0.1 foundation

## 1. Purpose

Research Corpus、Recora実測、専門スキルの分析結果を、recommendation candidateへ追跡可能な形で接続するためのデータ契約。

Evidence Ledgerは記事要約の保管庫ではない。次を答えられることが目的。

- この改善提案はどの観測から生まれたか。
- どのclaimがその判断を支えるか。
- claimはどのsourceに基づくか。
- 適用platform、期間、locale、metricは何か。
- 何が反証し、何が不明か。
- source更新や再測定時に、どのカード・提案を再評価するべきか。

## 2. Core Entities

```text
Source
  └─ SourceSnapshot
       └─ EvidenceLink ── Claim
                            ├─ ConflictGroup
                            ├─ OperationalRule
                            ├─ RecommendationCard
                            └─ RecommendationCandidate

RecoraObservation
  ├─ EvidenceLink ── Claim / DiagnosisHypothesis
  └─ RecommendationCandidate

Experiment
  ├─ Claim
  ├─ RecommendationCard
  └─ RecoraObservation
```

## 3. Identifier Convention

Use stable, human-readable prefixes.

- `SRC-000001`: source
- `SNAP-000001`: immutable source snapshot or retrieval record
- `CLM-000001`: atomic claim
- `EVL-000001`: evidence relationship
- `CFL-000001`: conflict group
- `OBS-000001`: Recora observation
- `HYP-000001`: diagnosis hypothesis
- `OPR-000001`: operational rule
- `RCD-000001`: Recommendation Card
- `EXP-000001`: experiment
- `CAN-000001`: recommendation candidate

IDs must not encode mutable status, priority, platform, or customer secrets.

## 4. Source Record

```json
{
  "source_id": "SRC-000001",
  "title": "",
  "publisher": "",
  "authors": [],
  "source_type": "official_documentation | standard | peer_reviewed_research | preprint | dataset | reproducible_experiment | case_study | vendor_analysis | competitor_documentation | skill | readme | social | other",
  "source_tier": "A | B | C | D | E | F | G",
  "canonical_url": "",
  "published_at": null,
  "updated_at": null,
  "retrieved_at": "2026-06-22T00:00:00Z",
  "language": "en",
  "platform_scope": [],
  "locale_scope": [],
  "product_or_model_version": null,
  "commercial_interest": "none | disclosed | likely | unknown",
  "access_status": "accessible | partial | paywalled | login_required | blocked | removed | unknown",
  "license_or_usage_notes": null,
  "source_score": {
    "identity_provenance": 0,
    "claim_directness": 0,
    "method_transparency": 0,
    "data_adequacy": 0,
    "scope_match": 0,
    "recency_version_fit": 0,
    "independence_bias_control": 0,
    "replication_corroboration": 0,
    "total": 0
  },
  "screening_status": "included | reference_only | excluded | needs_review",
  "exclusion_reason": null,
  "notes": ""
}
```

Rules:

- `canonical_url`はsource identity用。本文を読んだ証拠にはならない。
- `access_status != accessible`の場合、本文未確認のclaimを作らない。
- source tierはclaim statusを自動決定しない。
- official sourceでもplatform scopeを空にしない。

## 5. Source Snapshot Record

sourceが更新される可能性があるため、取得時点を分離する。

```json
{
  "snapshot_id": "SNAP-000001",
  "source_id": "SRC-000001",
  "retrieved_at": "2026-06-22T00:00:00Z",
  "content_hash": null,
  "content_location": "",
  "visible_version_or_date": null,
  "access_status": "accessible",
  "inspected_sections": [],
  "quoted_excerpt": null,
  "reviewer": "",
  "notes": ""
}
```

Rules:

- source本文を大量複製しない。必要最小限のexcerptと位置情報を保持する。
- copyright、license、利用条件を尊重する。
- contentが更新されたら新しいsnapshotを作り、過去snapshotを上書きしない。

## 6. Atomic Claim Record

```json
{
  "claim_id": "CLM-000001",
  "claim": "",
  "claim_type": "definition | platform_rule | metric_definition | observational_association | causal_effect | mechanism_hypothesis | best_practice | risk_or_failure_mode | recora_policy | unknown",
  "status": "accepted | conditional | disputed | stale | superseded | rejected",
  "confidence": "high | medium | low",
  "platform_scope": [],
  "locale_scope": [],
  "temporal_scope": {
    "valid_from": null,
    "valid_to": null,
    "as_of": null
  },
  "metric_scope": [],
  "research_question_ids": [],
  "source_statement": "",
  "recora_inference": "",
  "operational_rule_candidate": "",
  "limitations": [],
  "do_not_infer": [],
  "required_verification": [],
  "conflict_group_ids": [],
  "supersedes_claim_ids": [],
  "superseded_by_claim_ids": [],
  "created_at": "2026-06-22T00:00:00Z",
  "last_reviewed_at": "2026-06-22T00:00:00Z",
  "reviewer": ""
}
```

### Claim Atomicity Rules

A claim must be:

- one proposition
- falsifiable or scope-testable
- bounded by platform and time where relevant
- free of recommendation language unless the claim itself is a documented best practice
- separate from Recora inference

Bad:

```text
FAQ、schema、llms.txtを入れれば全AI検索で引用が増える。
```

Good claims:

```text
Google SearchはGoogleの生成AI検索表示のためにllms.txtを必要とせず、Google Searchはllms.txtを利用しないと公式に説明している。
```

```text
Bing AI Performanceのcitation countはsupported AI surfaceでsourceとして表示された回数を表し、placement、ranking、authority、individual answerでの役割を示さない。
```

## 7. Evidence Link Record

Sourceとclaim、observationとhypothesis等の関係を明示する。

```json
{
  "evidence_link_id": "EVL-000001",
  "from_type": "source_snapshot | source | recora_observation | experiment | claim",
  "from_id": "SNAP-000001",
  "to_type": "claim | diagnosis_hypothesis | operational_rule | recommendation_card | recommendation_candidate",
  "to_id": "CLM-000001",
  "relationship": "supports | partially_supports | contradicts | contextualizes | defines | does_not_test | supersedes",
  "directness": "direct | partial | indirect | none",
  "evidence_label": "CONFIRMED_FACT | OFFICIAL_SOURCE | RESEARCH_BACKED | INDUSTRY_PRACTICE | RECORA_ASSUMPTION | NEEDS_VERIFICATION",
  "source_location": "",
  "extracted_statement": "",
  "reviewer_interpretation": "",
  "limitations": [],
  "created_at": "2026-06-22T00:00:00Z",
  "reviewer": ""
}
```

Rules:

- `relationship=does_not_test`を積極的に使い、誤引用を防ぐ。
- `directness=none`のlinkはclaim supportとして数えない。
- 一つのsourceがclaimを支持し、別claimを反証することは可能。
- evidence labelはrelationshipごとに付ける。

## 8. Conflict Group Record

```json
{
  "conflict_group_id": "CFL-000001",
  "title": "",
  "claim_ids": [],
  "conflict_type": "platform_scope | temporal_change | metric_definition | method_difference | direct_contradiction | interpretation | unknown",
  "summary": "",
  "likely_resolution": "narrow_scope | split_claim | prefer_current_official | require_replication | unresolved",
  "resolution_status": "open | conditionally_resolved | resolved",
  "resolution_notes": "",
  "reviewed_at": null,
  "reviewer": ""
}
```

Do not delete inconvenient evidence. Preserve why a claim became conditional, disputed, stale, or superseded.

## 9. Recora Observation Record

Recoraの測定結果は外部sourceとは別のfirst-party evidenceとして扱う。

```json
{
  "observation_id": "OBS-000001",
  "project_id": "",
  "report_item": "ai_visibility | recommendation_rank | citation | source_intelligence | answer_accuracy | persona_gap | buyer_stage_gap | sentiment | technical_seo | structured_data | page_opportunity | entity_clarity | measurement_quality | other",
  "observed_at": "2026-06-22T00:00:00Z",
  "provider": "",
  "surface": "",
  "model_or_version": null,
  "locale": "ja-JP",
  "prompt_id": "",
  "prompt_version": "",
  "prompt_class": "non_branded | branded | mixed | unknown",
  "topic_id": null,
  "persona_id": null,
  "buyer_stage": null,
  "run_id": "",
  "run_count": 1,
  "observed_signal": "",
  "raw_artifact_reference": "",
  "source_urls": [],
  "measurement_definition": "",
  "denominator": null,
  "data_quality": "high | medium | low | invalid",
  "seed_risk": "none | low | medium | high | unknown",
  "known_limitations": [],
  "evidence_label": "CONFIRMED_FACT | NEEDS_VERIFICATION"
}
```

Rules:

- visibility、ranking、SOV、competitor gapで`prompt_class=branded`を使わない。
- mixed/unknown prompt classはmetric eligibilityをholdする。
- raw answer、citation URL、source text等がない場合、確認できない内容を補完しない。
- one runはone observationであり、trendではない。

## 10. Diagnosis Hypothesis Record

観測結果から原因を一つに固定しない。

```json
{
  "hypothesis_id": "HYP-000001",
  "observation_ids": [],
  "hypothesis": "",
  "mechanism_stage": "discovery | crawl | index_eligibility | retrieval_relevance | citation_selection | answer_absorption | entity_understanding | trust_evidence | third_party_ecosystem | measurement_reliability | unknown",
  "supporting_evidence_link_ids": [],
  "contradicting_evidence_link_ids": [],
  "required_checks": [],
  "alternative_hypothesis_ids": [],
  "confidence": "high | medium | low",
  "status": "open | supported | weakened | rejected | needs_verification",
  "do_not_claim": []
}
```

Example for “brand was not cited”:

- page not eligible/crawlable
- relevant page absent
- page retrieved but not selected
- source selected but omitted from visible citation UI
- source used indirectly but not cited
- competitor/third-party source better matched the prompt
- run variation / sample insufficiency

## 11. Operational Rule Record

ClaimをRecora運用へ変換する中間層。

```json
{
  "operational_rule_id": "OPR-000001",
  "name": "",
  "rule": "",
  "claim_ids": [],
  "applies_when": [],
  "does_not_apply_when": [],
  "required_checks": [],
  "platform_scope": [],
  "confidence": "high | medium | low",
  "status": "draft | accepted | conditional | deprecated",
  "validation_method": "",
  "do_not_claim": [],
  "last_reviewed_at": "2026-06-22T00:00:00Z"
}
```

Operational RuleはまだRecommendation Cardではない。複数ruleが一つのcardへ入ることがある。

## 12. Recommendation Card Reference

完全なcard contractは別ファイルで定義するが、Ledgerとの最低接続は次。

```json
{
  "recommendation_card_id": "RCD-000001",
  "name": "",
  "operational_rule_ids": [],
  "claim_ids": [],
  "trigger_observation_types": [],
  "required_evidence_labels": [],
  "platform_scope": [],
  "version": "0.1.0",
  "status": "draft | eval | accepted | deprecated",
  "last_evaluated_at": null
}
```

## 13. Experiment Record

Evidence不足を一般論で埋めず、実験へ送る。

```json
{
  "experiment_id": "EXP-000001",
  "title": "",
  "hypothesis_ids": [],
  "claim_ids": [],
  "recommendation_card_ids": [],
  "platform_scope": [],
  "baseline_definition": "",
  "intervention": "",
  "control_or_comparator": "",
  "prompt_set": [],
  "run_plan": "",
  "primary_metrics": [],
  "secondary_metrics": [],
  "confounders": [],
  "success_criteria": [],
  "failure_criteria": [],
  "status": "proposed | approved | running | completed | inconclusive | rejected",
  "results": null,
  "limitations": []
}
```

## 14. Recommendation Candidate Traceability

Candidateは最低限以下をLedgerへ接続する。

```json
{
  "candidate_id": "CAN-000001",
  "observation_ids": [],
  "hypothesis_ids": [],
  "recommendation_card_ids": [],
  "claim_ids": [],
  "evidence_link_ids": [],
  "source_skill": "",
  "created_at": "2026-06-22T00:00:00Z",
  "quality_gate_decision": null
}
```

`quality_gate_decision`はRecommendation Engineが埋めない。Quality Gateだけが後から設定する。

## 15. Lifecycle

### Source

```text
needs_review → included/reference_only/excluded
```

### Claim

```text
conditional → accepted
conditional → disputed
accepted → stale → superseded
any → rejected
```

### Recommendation Card

```text
draft → eval → accepted → deprecated
```

### Recommendation Candidate

```text
draft → quality_gate_review → auto_publish/hold/suppress
```

## 16. Invalidation Propagation

sourceやclaimがstale/superseded/rejectedになったら、次を再評価する。

1. linked operational rules
2. linked Recommendation Cards
3. unreviewed recommendation candidates
4. published recommendation wording and expiry policy
5. Gold Set expectations
6. specialist references containing the old rule

No silent invalidation. Record why and when the dependency changed.

## 17. Minimal Evidence Bundle for a Recommendation

実装recommendationを作る最低bundle:

- one or more valid `RecoraObservation`
- at least one open diagnosis hypothesis
- evidence links supporting the proposed mechanism or best practice
- exact platform/metric scope
- required checks
- Recommendation Card version
- verification method
- do-not-claim list

不足時はimplementation cardではなく、measurement refinement、monitoring、additional inspection、experiment cardを選ぶ。

## 18. Example Ledger Entry: Google llms.txt Scope

```json
{
  "claim_id": "CLM-GOOGLE-LLMS-001",
  "claim": "Google Search does not require or use llms.txt for visibility or ranking in Google Search, including its generative AI capabilities.",
  "claim_type": "platform_rule",
  "status": "accepted",
  "confidence": "high",
  "platform_scope": ["google_search", "google_ai_overviews", "google_ai_mode"],
  "source_statement": "Current Google Search guidance states that Google Search does not use llms.txt and that it neither helps nor harms Google Search visibility or rankings.",
  "recora_inference": "Do not recommend llms.txt as a Google AI-search visibility fix. Evaluate other services separately.",
  "limitations": ["This does not establish whether another service uses llms.txt."],
  "do_not_infer": ["llms.txt is unused by every AI service.", "adding or removing llms.txt changes ChatGPT Search behavior."],
  "required_verification": ["Recheck current Google Search documentation before client-facing use when stale."]
}
```

## 19. Example Ledger Entry: Bing Citation Metric Scope

```json
{
  "claim_id": "CLM-BING-CITATION-001",
  "claim": "Bing AI Performance citation counts do not indicate placement, ranking, authority, or a page's role in an individual answer.",
  "claim_type": "metric_definition",
  "status": "accepted",
  "confidence": "high",
  "platform_scope": ["bing_ai_performance", "microsoft_copilot"],
  "recora_inference": "Track citation frequency separately from prominence and answer absorption.",
  "do_not_infer": ["The most-cited page is the highest-ranked or most authoritative page."]
}
```

## 20. Required Validation Rules

Before persistence or use:

- every referenced ID exists.
- no accepted claim lacks at least one direct/partial evidence link.
- rejected/stale/superseded claims cannot silently support accepted cards.
- `causal_effect` claims require explicit method notes.
- branded observations cannot support visibility/ranking/SOV candidates.
- `quality_gate_decision` cannot be set by the recommendation engine.
- platform scope cannot default to all platforms.
- unknown evidence must remain unknown.
