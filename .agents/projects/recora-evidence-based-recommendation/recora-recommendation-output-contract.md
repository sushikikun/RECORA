# Recora Recommendation Output Contract

Project: Recora Evidence-Based Recommendation Program
Status: v0.1 foundation

## 1. Purpose

Recoraの観測結果、専門スキル出力、Evidence Ledger、Recommendation Cardを、品質監査可能なrecommendation candidateへ変換する共通契約。

このcontractは顧客向け文章だけを定義するものではない。観測、診断、実装、検証、禁止表現まで保持し、`recora-recommendation-quality-gate-auditor`へ安全にhandoffする。

## 2. Ownership Boundary

- `georader-ai-search-auditor`: strategic recommendation intent、diagnosis direction、roadmap framingを所有する。
- specialist skills: citation、competitor、schema/page、persona、prompt等の詳細artifactを所有する。
- `recora-report-recommendation-engine`: evidenceとspecialist outputをこのcontractへcompileする。
- `recora-recommendation-quality-gate-auditor`: `auto_publish | hold | suppress`を決定する唯一のauthority。
- `recora-geo-implementation-architect`: schema/data/pipeline/runtime implementationを所有する。

Recommendation Engineは次をしてはいけない。

- missing evidenceを発明する。
- specialist verificationを実施済みとみなす。
- client publicationを承認する。
- AI citation、ranking、traffic、conversionを保証する。
- app/DB/production/secretへ勝手に変更を加える。

## 3. Required Candidate Schema

```json
{
  "candidate_id": "CAN-000001",
  "candidate_version": "0.1.0",
  "created_at": "2026-06-22T00:00:00Z",
  "source_skill": "",
  "strategic_owner": "georader-ai-search-auditor",
  "report_item": "",
  "recommendation_type": "",
  "observation_scope": {
    "observation_ids": [],
    "project_id": "",
    "provider": [],
    "surface": [],
    "locale": [],
    "measurement_period": null,
    "prompt_class": "non_branded | branded | mixed | not_applicable | unknown",
    "topic_ids": [],
    "persona_ids": [],
    "buyer_stages": [],
    "run_count": null,
    "sample_size": null,
    "measurement_definition": "",
    "data_quality": "high | medium | low | invalid | unknown"
  },
  "observed_signals": [
    {
      "signal": "",
      "evidence_label": "CONFIRMED_FACT | OFFICIAL_SOURCE | RESEARCH_BACKED | INDUSTRY_PRACTICE | RECORA_ASSUMPTION | NEEDS_VERIFICATION",
      "evidence_refs": [],
      "limitations": []
    }
  ],
  "diagnosis_hypotheses": [
    {
      "hypothesis_id": "HYP-000001",
      "hypothesis": "",
      "mechanism_stage": "",
      "supporting_evidence_refs": [],
      "contradicting_evidence_refs": [],
      "required_checks": [],
      "alternative_hypothesis_ids": [],
      "confidence": "high | medium | low",
      "status": "open | supported | weakened | rejected | needs_verification"
    }
  ],
  "selected_recommendation_cards": [
    {
      "card_id": "RCD-000001",
      "card_version": "0.1.0",
      "selection_reason": "",
      "trigger_match": [],
      "exclusion_checks": [],
      "evidence_refs": []
    }
  ],
  "recommended_action": {
    "title": "",
    "summary": "",
    "action_type": "",
    "implementation_target": {
      "target_type": "page | page_section | sitewide | schema | robots | sitemap | internal_link | content_asset | third_party_source | measurement_pipeline | monitoring | other",
      "url_or_route": null,
      "section_or_component": null,
      "owner_control": "owned | shared | third_party | unknown"
    },
    "implementation_steps": [],
    "dependencies": [],
    "non_actions": [],
    "expected_mechanisms": [],
    "expected_effect_wording": "",
    "evidence_refs": []
  },
  "priority": {
    "proposed_priority": "P0 | P1 | P2 | P3 | hold",
    "impact": "high | medium | low | unknown",
    "evidence_strength": "high | medium | low",
    "urgency_or_harm": "high | medium | low",
    "effort": "high | medium | low | unknown",
    "reversibility": "high | medium | low | unknown",
    "rationale": ""
  },
  "verification_plan": {
    "baseline": "",
    "preconditions": [],
    "implementation_evidence": [],
    "remeasurement_method": "",
    "primary_metrics": [],
    "secondary_metrics": [],
    "comparison_scope": "",
    "success_criteria": [],
    "failure_criteria": [],
    "confounders": [],
    "minimum_required_evidence": [],
    "result_interpretation_limits": []
  },
  "client_facing_draft": {
    "headline": "",
    "finding": "",
    "recommendation": "",
    "why_it_may_help": "",
    "how_to_verify": "",
    "confidence_wording": "",
    "caveat": ""
  },
  "risk_and_safety": {
    "needs_verification": [],
    "do_not_claim": [],
    "seed_risk": "none | low | medium | high | unknown",
    "citation_misuse_risk": "none | low | medium | high | unknown",
    "stale_evidence_risk": "none | low | medium | high | unknown",
    "duplicate_risk": "none | low | medium | high | unknown",
    "client_display_risk": "low | medium | high | unknown",
    "quality_gate_required": true
  },
  "traceability": {
    "claim_ids": [],
    "evidence_link_ids": [],
    "source_ids": [],
    "observation_ids": [],
    "hypothesis_ids": [],
    "recommendation_card_ids": []
  },
  "publication_decision": null
}
```

## 4. Required Fields

A candidate is invalid when any of the following is absent.

- candidate identity and version
- report item
- source skill
- observation scope
- at least one observed signal
- evidence references or explicit `NEEDS_VERIFICATION`
- at least one diagnosis hypothesis
- required checks for unresolved hypotheses
- one concrete implementation target or a measurement/monitoring action
- expected mechanism
- priority rationale
- verification plan
- do-not-claim list
- traceability links
- `publication_decision: null`

## 5. Report Item Taxonomy

Use one primary report item and optional secondary items.

Primary values:

- `ai_visibility`
- `recommendation_rank`
- `citation_presence`
- `citation_quality`
- `answer_absorption`
- `source_intelligence`
- `answer_accuracy`
- `entity_clarity`
- `persona_gap`
- `buyer_stage_gap`
- `sentiment`
- `technical_seo`
- `crawlability`
- `index_eligibility`
- `structured_data`
- `content_evidence`
- `third_party_evidence`
- `page_opportunity`
- `internal_linking`
- `measurement_quality`
- `other`

Do not collapse `citation_presence`, `citation_quality`, and `answer_absorption` into one metric.

## 6. Recommendation Type Taxonomy

Use one primary type.

- `technical_eligibility_fix`
- `crawl_or_render_fix`
- `metadata_or_canonical_fix`
- `structured_data_support`
- `content_clarity_refresh`
- `entity_fact_clarification`
- `first_party_evidence_building`
- `new_owned_page`
- `existing_page_expansion`
- `internal_linking`
- `comparison_content`
- `persona_or_buyer_stage_content`
- `third_party_evidence`
- `legitimate_correction_or_outreach`
- `measurement_refinement`
- `additional_inspection`
- `monitoring`
- `experiment`
- `no_action_hold`

When evidence is insufficient, prefer `measurement_refinement`, `additional_inspection`, `monitoring`, `experiment`, or `no_action_hold` over generic implementation advice.

## 7. Mechanism Stage Taxonomy

Expected mechanisms must use one or more of:

- `discovery`
- `crawl_access`
- `render_access`
- `index_eligibility`
- `retrieval_relevance`
- `query_coverage`
- `citation_selection`
- `citation_faithfulness`
- `answer_absorption`
- `entity_understanding`
- `fact_freshness`
- `trust_and_evidence`
- `third_party_source_coverage`
- `user_decision_support`
- `measurement_reliability`

Rules:

- mechanism is not an outcome guarantee.
- schema normally maps to interpretation/eligibility support, not guaranteed citation selection.
- robots/bot access maps to access/discovery eligibility, not guaranteed visibility.
- content changes may target retrieval, selection, absorption, or user decision support; name which one.

## 8. Prompt Eligibility Rules

### 8.1 Non-branded Required

The following report items require non-branded prompts for metric conclusions:

- AI visibility
- recommendation rank
- Share of Voice
- competitor gap
- category discovery
- persona/category recommendation coverage

Brand name, domain, product name, or obvious alias seeded into the prompt invalidates or limits these metrics.

### 8.2 Branded-only Uses

Branded prompts may be used for:

- sentiment
- brand perception
- answer accuracy about the brand
- entity understanding
- outdated/hallucinated brand facts
- branded navigational support

### 8.3 Mixed or Unknown

`mixed` or `unknown` prompt class cannot support auto-publishable visibility/rank/SOV recommendations. Candidate should be `measurement_refinement` or `hold` unless other valid evidence exists.

## 9. Observation-to-Diagnosis Rules

An observed signal is not a cause.

Example:

```text
Observed: brand was not cited in one AI answer.
```

The candidate must consider alternatives such as:

- no relevant owned page exists.
- page is inaccessible or ineligible.
- page was not retrieved.
- page was retrieved but not selected.
- content was used without visible citation.
- citation interface omitted or grouped the source.
- third-party or competitor source better matched the query.
- run variation or sample insufficiency.
- prompt was seeded, ambiguous, or mismatched.

A strong implementation recommendation requires checks that narrow these hypotheses. Otherwise choose inspection, measurement refinement, monitoring, or experiment.

## 10. Evidence Rules

### 10.1 Evidence References

Each factual sentence in `observed_signals`, `diagnosis_hypotheses`, and `recommended_action` should map to one or more:

- Recora observation
- inspected page artifact
- source snapshot
- accepted/conditional claim
- operational rule
- Recommendation Card

### 10.2 Evidence Labels

Preserve the exact distinction:

- confirmed observation
- official platform rule
- research-backed concept
- industry practice
- Recora assumption
- needs verification

Do not merge these into a single generic “evidence” label.

### 10.3 Source Gaps

When third-party or citation source content was not inspected:

- do not state what the source says.
- do not recommend correcting a claim that was not verified.
- create an inspection or source-verification dependency.

## 11. Recommended Action Rules

Every implementation action should state:

1. exact target
2. exact change
3. reason/mechanism
4. dependencies
5. owner/control
6. expected effect wording
7. verification method
8. limitations

Bad:

```text
FAQを増やす。
```

Better:

```text
対象サービスページの「導入判断でよくある質問」セクションに、対象企業、非適合ケース、計測範囲、データ更新頻度、導入条件を1問1答のvisible textとして追加する。比較・意思決定promptに必要な事実を明確化する仮説であり、AI citationを保証しない。同じnon-branded prompt clusterで回答内容と引用元を再測定する。
```

## 12. Owned vs Third-party Separation

Never mix these in one undifferentiated action.

### Owned actions

- technical fixes
- metadata/canonical
- body content
- page creation
- internal links
- structured data
- methodology/evidence pages
- entity facts

### Third-party actions

- legitimate partner page correction
- verified directory profile correction
- earned media / research contribution
- real case study collaboration
- correcting outdated factual information
- monitoring independent coverage

Forbidden:

- buying links or citations
- fake reviews
- fabricated mentions
- disguised self-promotion
- mass low-quality directory submissions
- impersonating neutral research

## 13. Priority Model

Priority is not impact alone.

Recommended qualitative model:

```text
Priority = impact potential
         × evidence strength
         × urgency/harm reduction
         × feasibility
         × measurement readiness
```

Adjustment factors:

- lower priority when evidence is weak.
- use `hold` when metric validity is unknown.
- raise urgency for noindex, wrong canonical, body/schema mismatch, false claims, security/trust harm, or client misinformation.
- do not promote a speculative high-impact idea above a verified P0/P1 issue.

### Priority Definitions

- `P0`: material misinformation, invalid measurement, harmful technical block, unsupported schema/review claim, security/trust risk.
- `P1`: high-value observed gap with strong evidence and clear implementation target.
- `P2`: plausible supporting improvement with medium evidence or lower urgency.
- `P3`: polish, optional support, low-impact refinement.
- `hold`: evidence, scope, metric validity, or source verification is insufficient.

Quality Gate may change or suppress the proposed priority.

## 14. Verification Plan Rules

A valid verification plan includes:

- pre-change baseline
- implementation evidence
- unchanged prompt/query set where comparison is intended
- prompt version and classification
- provider/surface/locale
- repeated measurement or appropriate aggregation
- primary and secondary metrics
- success and failure criteria
- confounders
- interpretation limits

### Metrics by Mechanism

| Mechanism | Example verification |
|---|---|
| crawl/index eligibility | fetch/render/status/canonical/noindex/index evidence |
| retrieval relevance | grounding query, retrieved/cited URL pattern, topic coverage |
| citation selection | citation presence/frequency/source diversity with denominator |
| citation faithfulness | claim-to-source support classification |
| answer absorption | whether target facts appear accurately in answer text |
| entity understanding | product/category/audience/fact accuracy |
| measurement reliability | run variance, prompt eligibility, sample completeness |

Do not use a metric that cannot observe the proposed mechanism.

## 15. Success and Failure Criteria

Success criteria must be bounded and observable.

Better examples:

- target page becomes crawlable, canonical is self-referential, and rendered body contains the intended content.
- repeated non-branded comparison prompts begin mentioning the brand more consistently than baseline.
- previously incorrect product facts become accurate across the defined branded accuracy prompt set.
- citation source text supports the answer claim at a higher verified rate.

Failure criteria examples:

- implementation is live but target content is absent from rendered HTML.
- repeated measurements show no directional change within the defined sample.
- citation frequency changes but answer absorption/accuracy does not.
- observed change is explained by prompt set, provider, locale, or concurrent-site changes.
- technical fix succeeds, but no valid evidence supports an AI visibility claim.

A null result is valid evidence and should update cards/claims.

## 16. Safe Language

Preferred:

- “may improve discovery or extractability”
- “supports access, interpretation, or retrieval readiness”
- “provides a testable hypothesis”
- “should be remeasured after implementation”
- “the current sample suggests…”
- “requires additional source/page verification”
- “does not by itself establish…”
- `NEEDS_VERIFICATION`

Avoid:

- “will increase AI citations”
- “guarantees AI visibility”
- “ranking will improve”
- “schema makes AI cite this page”
- “llms.txt guarantees inclusion”
- “bot access means ChatGPT will show the site”
- “most cited means most authoritative”
- “one observation proves the trend”

## 17. Schema / Technical Support Rules

- schema must match visible content.
- schema is a support layer, not an independent source of truth.
- crawler access is an eligibility/access check, not an outcome.
- sitemap is discovery support, not guaranteed indexing or citation.
- canonical/noindex fixes can be required prerequisites without being direct GEO outcome proof.
- AI-specific files must be evaluated per platform; never generalize from one platform.

## 18. Client-facing Draft Rules

The client-facing draft should contain:

- what Recora observed
- what it may mean
- what to do
- why the action may help
- how Recora will verify it
- confidence/caveat

It should not expose internal IDs unless the product UI needs them. Internal traceability must remain available to the Quality Gate and reviewer.

## 19. Quality Gate Handoff

The engine sends the full candidate. It does not set publication status.

Quality Gate evaluates at least:

- evidence sufficiency
- observation validity
- branded/non-branded eligibility
- seed contamination
- citation misuse
- stale evidence
- unsupported causal language
- genericness
- implementation specificity
- duplicate recommendations
- client display risk
- secret/execution/production drift
- traceability completeness

Expected result:

```json
{
  "candidate_id": "CAN-000001",
  "decision": "auto_publish | hold | suppress",
  "quality_score": 0,
  "confidence": "high | medium | low",
  "client_display_risk": "low | medium | high",
  "blocking_issues": [],
  "required_edits_or_evidence": [],
  "safe_client_facing_wording": ""
}
```

## 20. Example Candidate

```json
{
  "candidate_id": "CAN-EXAMPLE-001",
  "candidate_version": "0.1.0",
  "source_skill": "recora-schema-seo-aio",
  "strategic_owner": "georader-ai-search-auditor",
  "report_item": "answer_accuracy",
  "recommendation_type": "entity_fact_clarification",
  "observation_scope": {
    "observation_ids": ["OBS-EXAMPLE-001", "OBS-EXAMPLE-002"],
    "provider": ["example_provider"],
    "surface": ["search_answer"],
    "locale": ["ja-JP"],
    "prompt_class": "branded",
    "run_count": 4,
    "sample_size": 4,
    "measurement_definition": "Share of repeated branded factual prompts containing an outdated plan description.",
    "data_quality": "medium"
  },
  "observed_signals": [
    {
      "signal": "Two of four inspected answers described an outdated plan structure.",
      "evidence_label": "CONFIRMED_FACT",
      "evidence_refs": ["OBS-EXAMPLE-001", "OBS-EXAMPLE-002"],
      "limitations": ["Single provider and locale."]
    }
  ],
  "diagnosis_hypotheses": [
    {
      "hypothesis_id": "HYP-EXAMPLE-001",
      "hypothesis": "Official pricing and plan facts may be fragmented or insufficiently explicit on the public site.",
      "mechanism_stage": "entity_understanding",
      "supporting_evidence_refs": [],
      "contradicting_evidence_refs": [],
      "required_checks": ["Inspect current pricing page and rendered HTML.", "Inspect cited source text."],
      "alternative_hypothesis_ids": ["HYP-EXAMPLE-002"],
      "confidence": "low",
      "status": "needs_verification"
    },
    {
      "hypothesis_id": "HYP-EXAMPLE-002",
      "hypothesis": "The provider may be relying on stale third-party information.",
      "mechanism_stage": "third_party_source_coverage",
      "supporting_evidence_refs": [],
      "contradicting_evidence_refs": [],
      "required_checks": ["Inspect cited and recurring third-party sources."],
      "alternative_hypothesis_ids": ["HYP-EXAMPLE-001"],
      "confidence": "low",
      "status": "needs_verification"
    }
  ],
  "selected_recommendation_cards": [],
  "recommended_action": {
    "title": "公開中のプラン情報と参照元を確認し、公式factsを一箇所へ集約する",
    "summary": "まず公式ページと引用元を確認し、古い情報の発生箇所を特定する。公式情報が分散している場合は、現行プラン、対象者、含有機能、更新日をvisible textで明示する。",
    "action_type": "additional_inspection",
    "implementation_target": {
      "target_type": "page",
      "url_or_route": null,
      "section_or_component": "pricing / plan facts",
      "owner_control": "owned"
    },
    "implementation_steps": [
      "Inspect current pricing page and rendered content.",
      "Verify cited source text and publication dates.",
      "Create one current official facts section if fragmentation is confirmed."
    ],
    "dependencies": ["Source-text verification"],
    "non_actions": ["Do not add unsupported schema-only facts."],
    "expected_mechanisms": ["fact_freshness", "entity_understanding"],
    "expected_effect_wording": "May reduce ambiguity around current plan facts; requires remeasurement.",
    "evidence_refs": ["OBS-EXAMPLE-001", "OBS-EXAMPLE-002"]
  },
  "priority": {
    "proposed_priority": "hold",
    "impact": "medium",
    "evidence_strength": "low",
    "urgency_or_harm": "medium",
    "effort": "unknown",
    "reversibility": "high",
    "rationale": "Observed factual risk exists, but the cause and source path are not yet verified."
  },
  "verification_plan": {
    "baseline": "2/4 inspected branded factual answers contained the outdated description.",
    "preconditions": ["Verify official page facts and cited sources."],
    "implementation_evidence": ["Rendered facts section and update date."],
    "remeasurement_method": "Repeat the same branded factual prompt set and inspect answer claims and citations.",
    "primary_metrics": ["answer fact accuracy"],
    "secondary_metrics": ["source-to-claim support"],
    "comparison_scope": "same provider, locale, prompt version",
    "success_criteria": ["Defined prompt set no longer repeats the outdated fact across repeated observations."],
    "failure_criteria": ["Outdated fact persists or source verification shows a different cause."],
    "confounders": ["provider/model changes", "third-party page updates"],
    "minimum_required_evidence": ["inspected current page", "inspected cited source text"],
    "result_interpretation_limits": ["Does not establish improvement across all providers."]
  },
  "risk_and_safety": {
    "needs_verification": ["cause", "source path", "current page clarity"],
    "do_not_claim": ["Adding schema will correct all AI answers.", "The provider will update immediately."],
    "seed_risk": "low",
    "citation_misuse_risk": "medium",
    "stale_evidence_risk": "medium",
    "duplicate_risk": "low",
    "client_display_risk": "medium",
    "quality_gate_required": true
  },
  "publication_decision": null
}
```

## 21. Candidate Validation Checklist

Before handoff:

- observed signal and diagnosis are separate.
- at least one alternative cause is considered where causality is uncertain.
- prompt classification is eligible for the metric.
- evidence labels and traceability are preserved.
- target and action are concrete.
- expected mechanism is named.
- priority reflects evidence strength, not excitement.
- verification measures the proposed mechanism.
- success and failure can both occur.
- owned and third-party actions are separated.
- no guarantee language appears.
- `publication_decision` remains null.
