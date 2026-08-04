# Exec Plan: Issue #152 Fixed Prompt Materialization and Project Finalization

この文書は、Unit Aで追加した既存`projects` / `prompts`の固定Prompt schemaへ、現在の`ProjectSetupDraft`を安全にmaterializeし、ProjectのPrompt群を一括確定するためのliving documentである。

現在は**Planのみ**である。TypeScript製品コード、Local Supabase、DB write、Project finalization、migration、runtime、production操作を承認しない。

## Metadata

| Field | Value |
|---|---|
| Issue | `#152` |
| Parent Plan | `#146` / merged PR `#147` |
| Schema dependency | `#148` / merged PR `#150` |
| Product decision | `#144` / merged PR `#145` |
| Risk | `R2` |
| Spec level | `Full` |
| Current execution | `Cloud Codex / docs-only Plan` |
| Future execution | `Local Codex` after separate OWNER Execute approval |
| Approval | OWNERの2026-08-04「つぎ」を本Planとdocs-only Draft PRまでのPlan承認として記録 |
| Owner | `sushikikun` |
| Planning baseline | `adf675cb40c2030d54ba7bd4e04bb9e513cf160b` |
| Status | `Plan drafted / Human review pending` |
| Updated | `2026-08-04` |

---

## 1. Objective

新しいPrompt database、Prompt Set、identity/revision階層を作らず、現在のonboarding draftを既存基盤へ完全かつ決定的に保存する。

```text
approved ProjectSetupDraft
→ deterministic materialization plan
→ existing personas / topics / promptsへinsert
→ persisted Prompt群からhash / count再計算
→ Projectの4 finalization fieldsをall-at-once設定
```

Unit B完了後に説明できること:

- どのapproved draftからPersona / Topic / Promptを作ったか
- 各Promptの`intent_key`と`panel_role`
- 各Promptが9分析用途のどれへ使えるか
- 互換用`prompt_type` / `measurement_purpose`
- Projectの固定Prompt集合の件数・contract version・SHA-256
- 途中失敗時に部分保存や部分確定が残らないこと

### 非目標

- provider実行
- measurement run開始時のhash照合（Unit C）
- intent-key集計（Unit D）
- UI / public API
- production onboarding command
- remote / production Supabase
- existing row backfill
- Prompt変更workflow

---

## 2. Confirmed repository facts

### 2.1 `ProjectSetupDraft`

現在の`PromptDraft`は次を持つ。

```text
promptId / topicId / personaId / text
rawUserIntent / languageMode
category / intent / intentType / buyerStage
brandingMode / brandMentionRule / competitorMentionRule
responseShape
candidateMentionOpportunity
rankingOpportunity
qualityScore / gateDecision / gateReason
sourceStatus / seedTerms / seedContaminationRisk
confidenceScore / reviewStatus / riskFlags
```

不足:

```text
intentKey
panelRole
Unit A形式の9 metric eligibility
```

### 2.2 Existing validators

- `validateProjectSetupDraft()`はseed、Persona、Topic、Prompt参照、重複、最低品質を検証する。
- `getProjectSetupDraftMaterializationDecision()`はdraftと各itemのapproved状態、confidence、Prompt readinessを確認する。
- `derivePromptMetricEligibility()`は現行6用途を返すが、Unit Aの9-key JSONとは異なる。

### 2.3 Generator

- generatorはtopicごとに複数`variantKey`を生成する。
- `variantKey`は生成時点で既知だが、完成`PromptDraft`には保存されない。
- 一つのtopic内でもcandidate shortlist、criteria、risk、citation等は意味が異なるため、topic IDだけを`intent_key`にしてはいけない。

### 2.4 Existing writer

`scripts/prepare-recora-client-project.ts`は:

- dry-run default
- local-only write
- existing slug overwrite拒否
- transaction内でorganization / project / brand / persona / topic / promptをinsert

するが、ProjectSetupDraft専用ではなく、Unit A metadataとProject finalizationを保存しない。

### 2.5 Unit A schema

`projects`:

```text
prompt_configuration_finalized_at
prompt_configuration_hash
prompt_configuration_contract_version
prompt_configuration_count
```

`prompts`:

```text
intent_key
panel_role
response_shape
candidate_mention_opportunity
ranking_opportunity
metric_eligibility
```

Project確定後、Prompt insert / update / deleteはDB triggerで拒否される。

---

## 3. Final decomposition

Unit Bは一つのPRへまとめない。

```text
B1. Pure fixed-Prompt materialization contract
↓
B2. Local transactional materializer
↓
B3. Production onboarding / Admin command integration（future）
```

### B1

DBに接続しないpure code。

責務:

- `PromptDraft`のexplicit `intentKey` / `panelRole`
- generatorの明示metadata生成
- Unit A形式の9 metric eligibility
- compatibility `prompt_type` / `measurement_purpose`
- DB UUID mapping plan
- canonical JSON / SHA-256
- Project Prompt collection validation

### B2

専用Local Supabaseだけを使うdry-run default CLI。

責務:

- existing empty Projectをlock
- approved draftをB1 libraryでplan化
- Persona / Topic / Prompt insert
- persisted rowsのhash / count再確認
- Project finalization
- transaction rollback

### B3

productionのonboarding / operator command。

- Admin M01/M02以降のcommand receipt / authz / auditを消費する
- service roleをactor identityとして扱わない
- public generic mutation RPCを作らない
- B1/B2採用後に別R2/R3 Plan / Executeを作る

---

## 4. B1: Pure materialization contract

## 4.1 `PromptDraft` explicit fields

次を正式fieldとして追加する。

```ts
intentKey: string
panelRole: "core" | "robustness" | "diagnostic"
```

### Rules

- approved materializationでは両方必須
- `intentKey`はlowercase kebab-case
- manually provided Promptは明示値が必要
- materialization時にPrompt textから推測して補わない
- generatorは生成時点のsemantic planから値を埋める

Draft schema versionは、互換性評価後に次のどちらかを採用する。

1. additive optional field + materialization時必須
2. `project_setup_draft_v2`へ明示version up

第一候補は**additive field + materialization時必須**。既存fixture / draft readerを壊さず、正式確定だけをfail closedにできるため。

## 4.2 Generator intent grouping

`intentKey`はtopic IDやPrompt textだけから作らない。

Generator内部の`variantKey`を、明示的なsemantic groupへmappingする。

例:

```text
category-ranked-shortlist    → category-shortlist
category-comparison-axes     → category-comparison
criteria-check               → selection-criteria
candidate-shortlist          → persona-shortlist
implementation-approval      → implementation-risk
citation-source-check        → citation-source-validation
citation-evidence-types      → citation-source-validation
brand-reputation             → brand-reputation
brand-perception-fit         → brand-perception
```

最終keyはProject内でcollisionしないよう、少なくとも次を含む。

```text
topic stable key
persona stable key when semantic intent differs by persona
semantic group key
buyer stage when needed
```

形式例:

```text
category-discovery-vendor-evaluator-category-shortlist
```

ID / textのhashだけを人向けkeyにしない。

## 4.3 Generator panel role

roleはresponse shapeだけで決めず、variant planで明示する。

### `core`

- headlineの基準となるcanonical question
- 一つの`intentKey`につき1件
- market Coreはapproved / ready / explicit eligibilityが必要

### `robustness`

- 同じ`intentKey`の同じ問いを異なる自然表現で確認する
- 同じ`intentKey`にCore必須
- semantic actやexpected signalが異なるPromptをrobustnessにしない

### `diagnostic`

- branded sentiment / brand perception
- forced citation / evidence request
- criteria-only / risk-only / implementation confirmation
- headline market denominatorへ入れない

初期generatorに真のparaphrase pairがない場合、無理にrobustnessを作らずCoreまたはDiagnosticだけにする。

## 4.4 Collection invariants

B1 validatorで次をfail closedにする。

- duplicate Prompt ID
- duplicate Persona / Topic ID
- missing Persona / Topic reference
- missing / invalid `intentKey`
- missing / invalid `panelRole`
- Project + intentKeyにCoreが2件以上
- Robustness without same-intent Core
- Core / Robustnessなのにmaterialization readiness false
- brand_optional Prompt
- medium / high seed contamination
- no eligible analysis
- Prompt text / classificationとtarget brand / known competitor contextの矛盾

Diagnosticは同じintentKeyのCoreを必須としないが、独立した明示keyと分析用途を持つ。

---

## 5. Nine-metric materialization

Unit A JSONのexact keys:

```text
visibility
ranking
sov
sentiment
brand_perception
natural_citation_observation
forced_citation_validation
risk_check
recommendation_input
```

各key:

```json
{
  "state": "eligible | excluded",
  "reason_codes": ["deterministic_reason"]
}
```

## 5.1 Market metrics

`visibility` eligible:

- target brand excluded
- brand optionalではない
- forced citationではない
- response shapeがcandidate / ranked / comparative
- candidate opportunityがdirect / likely
- contamination riskがnone / low

`ranking` eligible:

- visibilityと同じmarket boundary
- ranking opportunityがdirect / comparable_set

`sov` eligible:

- visibility eligible

## 5.2 Brand metrics

`sentiment` eligible:

- explicit self-branded
- sentiment / reputation intentまたはbranded sentiment response

`brand_perception` eligible:

- explicit self-branded
- brand perception / branded / fit intent

## 5.3 Citation metrics

`forced_citation_validation` eligible:

- citation/evidence intent、category、または`evidence_answer`

`natural_citation_observation` eligible:

- forced citationではない
- brand_optionalではない
- valid answer時に自然なcitationを観測できるPrompt

両方を同時eligibleにしない。

## 5.4 Risk and recommendation

`risk_check` eligible:

- `intentType = risk_checking`
- またはregulated / implementation / pricing-riskの明示semantic group

`recommendation_input` eligible:

- market / brand / citation / riskのいずれかへ正式利用できる
- またはcriteria / explanatory Promptとして改善材料に使う

全metricはeligible / excludedのどちらにもnon-empty reason codeを持つ。

## 5.5 Implementation choice

現行`derivePromptMetricEligibility()`は既存verifierとgenerator reportの互換用途として維持する。

B1では新規pure functionを追加する。

```ts
materializeFixedPromptMetricEligibility(prompt, context)
```

返り値はUnit A DB typeと完全一致させる。

既存6指標functionを無理に9指標へ破壊的変更しない。

---

## 6. Compatibility classification

## 6.1 `prompt_type`

優先順で決定する。

1. forced citation → `citation_check`
2. target brand + named competitor → `comparison_named`
3. target brand / self-branded → `branded`
4. competitor-only / named competitor → `competitor_named`
5. non-branded comparison → `comparison_generic`
6. その他 → `non_branded`

Target brandとknown competitorのidentity contextは明示入力から判定する。未知entityをtextだけでnamed competitorへ昇格しない。

## 6.2 `measurement_purpose`

互換hintでありauthorityではない。

deterministic priority:

```text
forced_citation_validation → citation_validation
sentiment                  → sentiment
brand_perception           → brand_perception
ranking                    → ranking
visibility                 → visibility
sov                        → sov
recommendation_input       → recommendation_input
risk-only / natural-only   → null
```

Generic comparisonで旧scopeがmarket purposeを安全に表せない場合はnullにし、metric eligibilityだけをauthorityとする。

B1 validatorは、non-null hintがstored eligibilityでeligibleでない場合を拒否する。

---

## 7. DB identity mapping

`ProjectSetupDraft`のIDは任意stringであり、DB列はUUIDである。

B1はProject slugをnamespaceとしてdeterministic UUIDを作る。

```text
persona UUID = stableUuid(projectSlug, "persona:" + personaId)
topic UUID   = stableUuid(projectSlug, "topic:" + topicId)
prompt UUID  = stableUuid(projectSlug, "prompt:" + promptId)
```

Prompt textをUUID identityの唯一入力にしない。文言修正でIDが変わり、conflict検査が曖昧になるため。

B1 planにはsource IDとDB UUIDのmappingを含める。

---

## 8. Canonical hash contract

Contract version第一候補:

```text
recora_fixed_prompt_configuration_v1
```

## 8.1 Prompt order

- DB prompt UUID ascending
- array orderやinput JSON orderに依存しない

## 8.2 Canonical Prompt object

```text
id
project_id
topic_id
persona_id
text
intent
buyer_stage
priority
is_active
prompt_type
measurement_purpose
intent_key
panel_role
response_shape
candidate_mention_opportunity
ranking_opportunity
metric_eligibility
contract_version
```

## 8.3 JSON canonicalization

- object keyを再帰的にlexicographic sort
- metric keyをUnit A固定順
- reason codeをdedupeしてlexicographic sort
- undefinedを許可しない
- timestampsを含めない
- UnicodeはNFCまたはNFKCのどちらかへ固定し文書化する
- line endingはLFへnormalize

第一候補は文字意味を過剰に変えない**NFC**。

## 8.4 Hash

```text
SHA-256 lowercase hex
```

Tests:

- 同一planのinput order変更 → same hash
- JSON key order変更 → same hash
- Prompt text変更 → different hash
- Prompt追加 / 削除 → different hash / count
- metric state / reason変更 → different hash
- Persona / Topic mapping変更 → different hash

---

## 9. B1 exact candidate scope

B1 child Issueで最終固定するが、最大8 tracked filesを第一候補とする。

```text
lib/recora/project-setup-draft.ts
lib/recora/project-setup-draft-generator.ts
lib/recora/fixed-prompt-materialization.ts                (new)
scripts/verify-recora-project-setup-draft.ts
scripts/verify-recora-project-setup-draft-generator.ts
scripts/verify-recora-fixed-prompt-materialization.ts      (new)
docs/architecture/measurement-design/recora_fixed_prompt_materialization_v1.md (new)
package.json
```

禁止:

- `supabase/**`
- DB接続
- existing bootstrap writer変更
- UI / runtime / provider
- lockfile / dependency

B1はR1/R2境界をchild Issueで確認するが、測定契約に影響するためR2 Executeを第一候補とする。

---

## 10. B2 local transactional materializer

## 10.1 Target

- existing Projectが既に存在する
- Projectは未finalized
- ProjectにはPersona / Topic / Promptが0件
- brand / organization / ownershipは既存project creation flowが用意済み

B2でorganization / project / brand creationを再実装しない。

## 10.2 CLI

新規thin CLI第一候補:

```text
scripts/materialize-recora-project-setup-draft.ts
```

Input:

```text
--input <approved ProjectSetupDraft JSON>
--project-slug <target>
--dry-run (default)
--execute
```

Safety:

- `RECORA_DATABASE_URL`は既存local guardを使用
- non-local execute拒否
- connection string非表示
- no overwrite
- external AI callなし
- dry-run write 0

## 10.3 Transaction

1. begin
2. target Projectを`FOR UPDATE`
3. Project exists / unfinalized確認
4. Persona / Topic / Prompt count = 0を確認
5. B1 materialization planを再計算
6. Persona insert
7. Topic insert
8. Prompt insert（6 Unit A fields + compatibility fields含む）
9. persisted Prompt rowをread back
10. B1 canonicalizerでhash / count再計算
11. expected hash / countと一致しない場合rollback
12. Project 4 fieldsをall-at-once update
13. commit

DB triggerがfinalized後のPrompt mutationを拒否するため、Project finalization updateは最後に行う。

## 10.4 Conflict policy

次はすべてfail closed。

- project not found
- existing Project finalized
- existing Persona / Topic / Prompt row > 0
- DB UUID conflict
- draft source ID duplicate
- project slug mismatch
- persisted hash mismatch
- Prompt count mismatch
- any insert failure
- finalization update row count != 1

自動cleanupや部分retryはしない。transaction rollbackだけを使用する。

## 10.5 B2 exact candidate scope

最大5 tracked filesを第一候補とする。

```text
scripts/materialize-recora-project-setup-draft.ts           (new)
scripts/verify-recora-project-setup-draft-materialization.ts (new)
docs/architecture/measurement-design/recora_fixed_prompt_materialization_cli_v1.md (new)
lib/recora/fixed-prompt-materialization.ts                   (B1 bugfixのみ)
package.json
```

既存`prepare-recora-client-project.ts`は変更しない。legacy/pilot bootstrapとして残す。

---

## 11. B3 production boundary

B3はB1/B2とは別Issue。

必要条件:

- accepted onboarding state
- operator/customer authz boundary
- M01 command receipt
- M02 capability / scope evidence
- audit log
- idempotency key
- outbox / refresh metadata when applicable

B3が行うのはB1 pure planと同じtransaction semanticsのserver command化であり、別のmaterialization logicを作らない。

---

## 12. Validation matrix

## 12.1 B1 pure tests

- generator Prompt全件にvalid intentKey / panelRole
- input order independent hash
- reason code order independent hash
- field mutation changes hash
- approved complete draft PASS
- unapproved draft FAIL
- low confidence FAIL
- gate not ready FAIL
- brand optional FAIL
- target brand contamination FAIL
- known competitor contamination FAIL
- Core duplicate FAIL
- Robustness without Core FAIL
- Diagnostic-only intent PASS
- risk-only eligibility PASS
- recommendation-only eligibility PASS
- natural / forced citation simultaneous eligible FAIL
- compatibility hint mismatch FAIL

## 12.2 B2 DB tests

専用Local Supabase project ID第一候補:

```text
recora-fixed-prompt-unit-b2
```

- migration-only reset
- seeded reset
- existing empty Project success
- dry-run write 0
- full transaction success
- persisted fields exact
- persisted hash / count exact
- already finalized FAIL
- non-empty Project FAIL
- mid-Prompt insert failure rollback
- hash mismatch rollback
- project A/B separation
- browser write grants unchanged
- service_role TRUNCATE false
- security advisor 0 blocking
- performance advisor 0 unexpected blocking

## 12.3 Repository regressions

- Project Setup draft verifier
- Project Setup generator verifier / eval
- Prompt contract verifier
- Unit A fixed schema verifier
- Phase 3 tenant regressions
- Admin P0 canonical / M01 / M02 static checks
- preflight / typecheck / lint / build
- exact scope / diff check / secret check

---

## 13. Rollback

### B1

pure codeだけなので、commit revertで戻せる。DB stateはない。

### B2 local

- transaction failureはrollback
- dedicated Local Supabaseのみ
- cleanupはHuman review後
- remote / production rollbackは対象外

Projectを一度finalizedにした成功fixtureを通常UPDATEで戻さない。local resetで環境全体を再構築する。

---

## 14. Implementation order and approval gates

```text
Issue #152 Plan merge
↓
B1 child Issue / Execute
↓ Human review / merge
B2 child Issue / Execute
↓ Human review / merge
B3 separate Plan / Execute when production integration is required
```

各child:

- latest masterからNew Worktree
- separate branch
- exact file scope
- Draft PR
- Ready / merge別承認

---

## 15. Acceptance criteria

Plan完了条件:

1. B1 / B2 / B3が分離されている
2. PromptDraft explicit intentKey / panelRole方針が確定
3. generator semantic mapping方針が確定
4. 9 metric eligibilityが決定的
5. compatibility fieldsのpriorityが確定
6. DB UUID mappingが確定
7. canonical hash contractが確定
8. B2はexisting empty Projectだけを対象にする
9. full transactionとrollbackが明確
10. production commandはB3へ分離
11. exact candidate filesと検証matrixが明確
12. DB / runtime未変更のdocs-only Draft PRでHuman reviewへ到達

---

## 16. Current stop position

本Plan、Issue、docs-only branch、commit、Draft PR、CI、Human reviewまで。

B1/B2の製品コード、Local Supabase、materialization、Project finalization、Ready化、merge、B3は未承認。
