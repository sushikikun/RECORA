# Exec Plan: Issue #146 Measurement Design Minimal Prompt Retrofit

この文書は、Recoraの既存Persona・Topic・Prompt・測定証跡基盤を利用し、固定Prompt運用に必要な最小改修を実装可能な単位へ落とすliving documentである。

現在は**Planのみ**である。migration、Local Supabase、DB write、runtime変更、backfill、production操作を承認しない。

## Metadata

| Field | Value |
|---|---|
| Issue | `#146` — `https://github.com/sushikikun/RECORA/issues/146` |
| Parent decision | `#144` / merged PR `#145` |
| Superseded exploration | `#136`, `#141`, `#143` |
| Risk | `R2` |
| Spec level | `Full` |
| Current execution | `Cloud Codex / docs-only Plan` |
| Future execution | `Local Codex` after separate OWNER Execute approval |
| Approval | OWNERの2026-08-04「すすめて」をIssue・本Plan・docs-only Draft PRまでのPlan承認として記録 |
| Owner | `sushikikun` |
| Planning baseline | `21043ccc9c74add07bcd6a239bb6682f7a95e8a7` |
| Status | `Plan drafted / Human review pending` |
| Updated | `2026-08-04` |

本Planの記載はDB Execute承認を付与しない。実装Issue、migration、Local Supabase操作、commit、push、PR、merge、production適用は、それぞれの承認境界に従う。

---

## 1. Objective / expected outcome

新しいプロンプトDBやidentity/revision階層を作らず、現在の基盤へ必要な情報だけを追加する。

正式な通常フローは次である。

```text
オンボーディング
→ Persona / Topic / Prompt候補を生成・確認
→ 一つのProjectのPrompt群を確定
→ Prompt群を変更不能にする
→ 以後の通常測定は同じPrompt群を利用
```

今回の計画が実装された後、レコラは次を説明できる。

- このProjectで正式に使うPrompt群は何か
- Prompt群がいつ確定したか
- 確定後に集合や質問文が変わっていないか
- 同じ意味の言い換えはどのグループか
- Core / Robustness / Diagnosticのどれか
- 各Promptがどの指標へ使えるか
- 測定時にどの固定Prompt構成を使ったか
- AI model・provider・検索条件は何だったか

### 非目標

- Persona / Topic / Promptの新しいidentity/revision table
- Prompt Set table、Version、Membership
- Measurement Design aggregate
- Execution Profile Set
- legacy import / cutover
- Promptの通常変更workflow
- AI provider実行、分析、品質、公開、UI

---

## 2. Authority and confirmed repository facts

### 2.1 Authority order

1. Issue #146の最新OWNER記録
2. `docs/recora-measurement-design-existing-foundation-v1.md`
3. `docs/recora-prompt-measurement-contract-v1.md`
4. `docs/recora-data-tenant-security-privacy.md`
5. adopted Recora Admin P0 contracts
6. current repository implementation facts

### 2.2 Confirmed current tables

```text
public.projects
public.personas
public.topics
public.prompts
public.measurement_runs
public.run_items
public.ai_conversations
public.ai_models
```

### 2.3 Confirmed current Prompt fields

`public.prompts`は少なくとも次を保持する。

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
created_at
updated_at
prompt_type
measurement_purpose
```

`prompt_type`と`measurement_purpose`はmigration
`20260701044743_recora_prompt_scope_fields.sql`によりnullable列として追加済みである。

### 2.4 Confirmed current evidence

`public.run_items`はrun、Prompt、Persona、AI modelを結ぶ。

`public.ai_conversations`は少なくとも次を保持する。

```text
prompt_text_snapshot
model_snapshot
provider
model_requested
model_returned
web_search_enabled
raw_answer
answer_hash
captured_at / measured_at
response_time_ms
```

Prompt text、provider、model、search evidenceを新tableへ重複保存しない。

### 2.5 Confirmed materialization gap

`ProjectSetupDraft.PromptDraft`は次を既に表現する。

```text
responseShape
candidateMentionOpportunity
rankingOpportunity
branding / competitor rules
quality and gate decision
```

しかし`prepare-recora-client-project.ts`の現在のPrompt insertは、主にtext、Topic、Persona、intent、buyer stage、priorityだけを保存する。

したがって問題は、新しいdomainを作ることではなく、**確定済みdraftの測定メタデータが既存Prompt行へ十分materializeされていないこと**である。

---

## 3. Final planning decisions

## D1. Existing foundation remains authoritative

物理正本は次とする。

```text
Persona definition  → public.personas
Topic definition    → public.topics
Prompt definition   → public.prompts
Measurement relation→ public.measurement_runs / run_items
Answer evidence     → public.ai_conversations
Model catalog       → public.ai_models
```

初期実装では新規tableを作らない。

## D2. Fixed set is finalized at Project level

Prompt一件ずつのrevision/finalized rowを作らず、ProjectのPrompt構成全体を一度に確定する。

第一候補のProject追加列は次の4件である。

```text
prompt_configuration_finalized_at timestamptz null
prompt_configuration_hash text null
prompt_configuration_contract_version text null
prompt_configuration_count integer null
```

### Meaning

- `finalized_at`: Prompt群が通常測定用として確定した時点
- `hash`: Prompt群の測定影響情報から作るdeterministic SHA-256
- `contract_version`: hashと保存メタデータを解釈する契約版
- `count`: 確定したPrompt件数

### Why Project-level

- 通常運用でPrompt群全体が固定される
- Prompt Set tableなしで集合の同一性を証明できる
- 個別Promptだけを固定しても、後から新Promptを追加できてしまう
- run開始時に一つのhash・countを確認できる

### Reduction rule

Execute planで同等の安全性を保ったまま列を削減できる場合は削減してよい。ただし、確定時点、集合fingerprint、契約版、件数を後から説明できなければならない。

## D3. Prompt receives only six new measurement fields

第一候補のPrompt追加列は次の6件である。

```text
intent_key text null
panel_role text null
response_shape text null
candidate_mention_opportunity text null
ranking_opportunity text null
metric_eligibility jsonb null
```

### Reused existing fields

```text
prompt_type
measurement_purpose
intent
buyer_stage
priority
is_active
topic_id
persona_id
text
```

### Explicitly omitted initially

```text
brand_scope
question_family
question_act
prompt_revision_id
prompt_set_version_id
eligibility child table
classification snapshot table
```

理由:

- brand投入状態は当面`prompt_type`で表現できる
- Topic、intent、response shapeで初期分析分類に足りる
- multi-metric eligibilityが最終の集計authorityとなる
- fixed Prompt群ではrevision / set / snapshot階層が不要

不足が実測で証明された場合だけ別Issueで追加する。

## D4. Existing scope fields become compatibility fields

### `prompt_type`

再利用する。finalization時に明示値を必須とする。

許可値は現在のcontractを維持する。

```text
non_branded
branded
comparison_generic
comparison_named
competitor_named
citation_check
```

### `measurement_purpose`

互換表示・代表用途のhintとして残す。

一つのPromptが複数指標へ使えるため、正式集計authorityにはしない。nullを許容するか代表用途を必須にするかはphysical Execute時に確認するが、metric eligibilityと矛盾する値はfinalizationを拒否する。

### `intent`

人が理解するintent labelとして再利用する。言い換えを束ねるstable keyとしては使わない。

### `buyer_stage`

再利用し、finalized Promptではrecognized valueを必須とする。

### `priority`

再利用する。business priorityであり、自動的なmetric weightにはしない。

### `is_active`

finalization時にtrueを必須とし、確定後は変更不能にする。

## D5. Intent grouping uses `intent_key`

`intent_key`はProject内で同じbuyer needを束ねるopaque keyである。

例:

```text
smb-attendance-tool-shortlist
```

同じkeyへ、次を置ける。

```text
Core canonical
Robustness raw-search wording
Robustness anxious wording
Diagnostic source request
```

### Rules

- finalized Promptはすべてnon-empty `intent_key`を持つ
- key formatはlowercase kebab-caseを第一候補とする
- CoreはProject + intent_keyで一つ
- Robustnessには同じintent_keyのCoreが必要
- Diagnosticはheadline denominatorへ入らない
- aggregationはPrompt平均より先にintent_key単位で行う

Core uniquenessとRobustness/Core集合整合はfinalization validatorで保証する。legacy rowsへの即時unique index追加でmigrationを壊さない。

## D6. Initial panel roles are three values

初期固定Prompt製品では次だけを使用する。

```text
core
robustness
diagnostic
```

Discovery、Seasonal、Event等は通常の固定Prompt集合へ初期導入しない。将来必要になれば別製品判断とする。

## D7. Multi-metric eligibility uses one checked JSONB object

新規tableや9個以上のboolean columnを避け、一つのfixed JSON objectを`public.prompts.metric_eligibility`へ保存する。

### Required top-level keys

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

### Required metric shape

各keyは次のobjectを持つ。

```json
{
  "state": "eligible",
  "reason_codes": ["brand_excluded", "candidate_opportunity_direct"]
}
```

`state`:

```text
eligible
excluded
```

`reason_codes`:

- non-empty string array
- lowercase snake_caseを第一候補
- text inferenceだけのreasonでofficial eligibleにしない

### Example

```json
{
  "visibility": {
    "state": "eligible",
    "reason_codes": ["brand_excluded", "candidate_opportunity_direct"]
  },
  "ranking": {
    "state": "eligible",
    "reason_codes": ["ranked_or_comparable_response"]
  },
  "sov": {
    "state": "eligible",
    "reason_codes": ["visibility_eligible"]
  },
  "sentiment": {
    "state": "excluded",
    "reason_codes": ["not_self_branded"]
  },
  "brand_perception": {
    "state": "excluded",
    "reason_codes": ["not_self_branded"]
  },
  "natural_citation_observation": {
    "state": "eligible",
    "reason_codes": ["citation_not_forced"]
  },
  "forced_citation_validation": {
    "state": "excluded",
    "reason_codes": ["citation_not_requested"]
  },
  "risk_check": {
    "state": "excluded",
    "reason_codes": ["not_risk_prompt"]
  },
  "recommendation_input": {
    "state": "eligible",
    "reason_codes": ["measured_market_prompt"]
  }
}
```

### Validation split

DB/check helper:

- JSON object
- required 9 keys
- no unsupported top-level keys
- state value range
- reason_codes array and non-empty strings

Application finalization validator:

- prompt_type / response shape / opportunitiesとの意味整合
- branded / named / competitor-only / forced citationのmarket metric除外
- natural citationとforced citationの分離
- criteria-onlyのranking / visibility除外

Projectの`prompt_configuration_contract_version`がこのJSON shapeとvalidation policyの版を表す。Prompt単位の追加policy-version列は初期実装では作らない。

## D8. No per-run classification snapshot initially

分類とeligibilityはProject finalization後に変更不能となるため、runごとに重複snapshotを作らない。

### Reuse

- exact Prompt text: `ai_conversations.prompt_text_snapshot`
- model display/evidence: `model_snapshot`
- provider/requested/actual model: existing columns
- search mode/evidence: existing columns

### Run metadata

run作成時に、既存`measurement_runs.metadata`へ次をコピーする。

```text
prompt_configuration_hash
prompt_configuration_contract_version
prompt_configuration_count
```

互換上`prompt_set_version`が必要な箇所では、次のようなderived identifierを使用できる。

```text
fixed-prompts:<hash>
```

これはPrompt Set tableの存在を意味しない。

### Reconsideration trigger

次のいずれかが判明した場合だけ、classification snapshotを別Issueで検討する。

- finalized Promptを後から変更できるpathが残る
- runが別configuration hashでも開始できる
- historical metricをcurrent Prompt rowなしで説明できない
- retention/deletionでPrompt rowがrun evidenceより先に失われる

## D9. Prompt configuration hash is deterministic

hash inputは、Project内の測定対象PromptをPrompt ID昇順で並べたcanonical JSON arrayとする。

少なくとも次を含める。

```text
prompt id
project id
topic id
persona id
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
canonical metric_eligibility JSON
prompt configuration contract version
```

含めないもの:

```text
created_at
updated_at
DB row order
runtime result
provider response
secret / credential
```

algorithm:

```text
SHA-256 lowercase hex
```

同じ有効Prompt構成は同じhashを生成しなければならない。

## D10. Project finalization is transactional

正式finalizationは一つのtransactionで次を行う。

1. Project ownership / entitlement / onboarding stateを確認
2. 対象Promptをlock/read
3. 必須fieldとsemantic validatorを確認
4. Core / Robustness / Diagnostic集合を確認
5. deterministic hash / countを計算
6. Projectのfinalization fieldsを保存
7. command receipt / audit evidenceを記録する将来境界へ接続

Wave 1のschema-only migrationでgeneric public RPCを作らない。materialization unitで、既存Phase 3 / Admin command基盤に沿う狭いserver boundaryを設計する。

## D11. Finalized Prompt set is immutable

Projectの`prompt_configuration_finalized_at`がnon-nullの場合、同ProjectのPromptについて次を拒否する。

```text
INSERT
UPDATE
DELETE
```

保護対象は全列でよい。少なくとも測定影響列は変更不能でなければならない。

Project側でも次のfinalization fieldsを任意更新できないよう保護する。

```text
prompt_configuration_finalized_at
prompt_configuration_hash
prompt_configuration_contract_version
prompt_configuration_count
```

### Project deletion / retention

Projectの正式な削除・retention処理によるcascadeは妨げない。

Prompt mutation guardは、親Projectが既に削除処理中または存在しないcascade pathを許容する設計とする。通常の直接Prompt deleteは拒否する。

### Correction

通常運用ではcorrection workflowを作らない。質問群の全面変更が必要な場合は、比較可能性と顧客表示を含む別Issue・別承認へ送る。

---

## 4. Field classification

| Current / proposed field | Decision | Rationale |
|---|---|---|
| `prompts.text` | Reuse + freeze | exact Prompt definition |
| `prompts.topic_id` | Reuse + freeze | Topic mapping |
| `prompts.persona_id` | Reuse + freeze | Persona mapping |
| `prompts.intent` | Reuse | human-readable intent label |
| `prompts.buyer_stage` | Reuse + require at finalization | segment aggregation |
| `prompts.priority` | Reuse + freeze | business priority, not automatic weight |
| `prompts.is_active` | Reuse + require true + freeze | measurement-enabled state |
| `prompts.prompt_type` | Reuse + require explicit | brand/citation compatibility classification |
| `prompts.measurement_purpose` | Compatibility only | not multi-metric authority |
| `prompts.intent_key` | Add | paraphrase grouping / denominator |
| `prompts.panel_role` | Add | Core / Robustness / Diagnostic |
| `prompts.response_shape` | Add | criteria-only and response semantics |
| `candidate_mention_opportunity` | Add | visibility eligibility evidence |
| `ranking_opportunity` | Add | ranking eligibility evidence |
| `metric_eligibility` | Add JSONB | official multi-metric authority |
| Prompt-level `finalized_at` | Omit | Project-level finalization is enough |
| Prompt revision table | Omit | fixed Prompt assumption |
| Prompt Set tables | Omit | finalized Project prompts are the set |
| `brand_scope` | Omit initially | `prompt_type` + eligibility is sufficient |
| `question_family` / `question_act` | Omit initially | Topic / intent / response shape is sufficient |
| classification snapshot table | Omit initially | immutability + existing text evidence |
| `ai_conversations.prompt_text_snapshot` | Reuse | exact executed text evidence |
| model/provider/search evidence | Reuse | already present |
| `measurement_runs.metadata` | Reuse | configuration hash/count/version evidence |

---

## 5. DB constraint versus application validation

## 5.1 DB / migration responsibility

- nullable additive columns for backward compatibility
- allowed scalar values
- JSON shape minimum contract
- Project configuration hash format and count range
- finalized configuration field consistency
- finalized Project Prompt mutation rejection
- finalization field mutation rejection
- existing RLS / grant preservation
- no browser direct write grant

Existing rows are not inferred or backfilled in the schema migration.

## 5.2 Application finalization responsibility

- PromptDraftから正式metadataへのdeterministic mapping
- target brand / competitor contamination
- candidate/ranking opportunity consistency
- criteria-only market metric exclusion
- natural / forced citation separation
- Core uniqueness
- Robustness requires Core
- intent coverage
- Prompt count and entitlement
- deterministic hash calculation
- finalization transaction request / audit

## 5.3 Measurement start responsibility

- Project is finalized
- current Prompt rows reproduce stored hash/count/version
- all expected Prompt rows are active and valid
- run metadata stores the same configuration evidence
- mismatch stops before creating or executing provider items

## 5.4 Aggregation responsibility

- valid observations only
- stored `metric_eligibility` only
- Prompt → intent_key → segments → overall order
- Robustness does not multiply headline weight
- Diagnostic excluded from headline market denominator
- failed/refused/empty/provider-error results are not absence zeros

---

## 6. Implementation decomposition

DBとruntimeを一つの巨大Issueへ混ぜない。

## Unit A: Schema and local contract

Purpose:

- projects / promptsへのadditive fields
- mutation guard
- JSON/scalar constraints
- local fixtures and verifier

Expected files, child Issueで確定:

1. new migration
2. schema verifier
3. physical spec
4. DB types if needed
5. `package.json`

Non-goals:

- existing row backfill
- prompt materialization
- run/aggregation runtime
- remote apply

Exit:

- migration-only / seeded reset PASS
- finalized fixture immutable
- legacy rows remain nullable and usable by legacy runtime
- no new table

## Unit B: Draft materialization and finalization

Purpose:

- ProjectSetupDraft / onboarding outputをexisting Persona/Topic/Promptへ保存
- prompt metadataを完全materialize
- configuration hash/count/versionを確定

Likely code areas:

- setup draft materialization adapter
- `prepare-recora-client-project.ts` or successor server command
- semantic validator adapter
- audit/command integration boundary

Non-goals:

- measurement provider calls
- aggregation

Exit:

- local full project creation produces one finalized fixed Prompt configuration
- invalid prompt set is rejected atomically

## Unit C: Measurement start verification

Purpose:

- run作成前にstored hash/count/versionを再計算・照合
- run metadataへ証跡をコピー
- mismatch時にprovider call前で停止

Non-goals:

- metric aggregation redesign

Exit:

- same configuration starts
- mutated / added / removed / incomplete configuration fails closed

## Unit D: Eligibility and intent aggregation

Purpose:

- single `measurement_purpose`依存を終了
- stored multi-metric eligibilityを使用
- intent_key単位のheadline denominator

Non-goals:

- customer UI redesign
- publication workflow redesign

Exit:

- visibility / ranking / SOV / sentiment / citation separationが正式metadataで再現
- paraphrase countがheadline weightを増やさない

### Required order

```text
Unit A
→ Unit B
→ Unit C
→ Unit D
```

各Unitは別Issue、別New Worktree、別branch、別Draft PR、別Execute承認を第一候補とする。

---

## 7. TypeScript contract decision

`lib/recora/prompt-measurement-contract.ts`は、現時点でruntime未接続のsemantic validator/referenceとして残す。

### Initial policy

- Unit Aでは変更しない
- Unit Bでfixed-foundation materialization adapterが必要なら限定追加する
- greenfield aggregate型を物理DBの必須設計として扱わない
-不要型の削除・大規模整理は別R1 Issueへ分離する
- preflightのsemantic negative testsは維持する

これにより、semantic rulesを失わず、DBを過剰設計しない。

---

## 8. Tenant, RLS, grants, and privacy

Phase 3 foundationを再定義しない。

Future Unit A開始時にlocal catalogで確認する。

- projects organization composite key
- prompts → topics / personas project integrity
- measurement_runs / run_items tenant chain
- current RLS policies
- browser role grants
- private helper conventions
- Admin P0 migrationとの競合

### Required boundary

- customer browser: Prompt table direct writeなし
- admin browser: Prompt table direct writeなし
- service role: actor identityではない
- finalization: server command + actor / scope / reason / audit境界
- generic mutation RPCなし
- secret、billing、audit、tenant IDをprovider payloadへ含めない

---

## 9. Local validation plan

Future Executeは専用Local Supabaseで行う。

Candidate project:

```text
project_id: recora-measurement-design-minimal-prompt
expected container: supabase_db_recora-measurement-design-minimal-prompt
```

### Repository and static

- latest master / clean New Worktree
- exact approved files
- PostgreSQL identifier 63-byte check
- prompt contract verifier
- new schema verifier
- preflight / typecheck / lint / build
- `git diff --check`
- package-lock / seed / existing migration unchanged
- secret / token / env / DB URL value 0

### Migration

- migration-only reset
- seeded reset
- repeat reset / replay
- migration list
- object / constraint / trigger inventory
- security advisor
- performance advisor

### Legacy compatibility

- old Prompt rows remain nullable
- no automatic classification/backfill
- existing read path does not crash before explicit finalization integration
- existing seed remains unchanged unless separately approved

### Finalization positive

- valid Project Prompt fixture finalizes
- hash deterministic across repeated calculation
- count matches
- all required fields recognized
- valid Core / Robustness / Diagnostic configuration PASS

### Finalization negative

- missing prompt_type
- missing intent_key
- unknown panel_role
- criteria-only + ranking eligible
- self branded + visibility eligible
- named competitor + SOV eligible
- natural and forced citation both eligible
- Robustness without Core
- duplicate Core for one intent_key
- malformed metric JSON
- empty reason codes

### Immutability

After finalization:

- Prompt INSERT: FAIL
- Prompt UPDATE text: FAIL
- Prompt UPDATE metadata: FAIL
- Prompt UPDATE is_active: FAIL
- Prompt DELETE: FAIL
- Project config hash/version/count mutation: FAIL
- Project official deletion/cascade fixture: PASS when approved deletion path is used

### Tenant isolation

- organization A / B
- project A1 / A2 / B1
- cross-project Topic/Persona/Prompt mapping: FAIL or already prevented
- caller-supplied tenant substitution: FAIL
- browser SELECT/INSERT/UPDATE/DELETE according to accepted current policy

### Measurement evidence

- same hash copied into run metadata
- mismatch blocks run creation
- exact Prompt text remains in conversation evidence
- provider/model/search evidence remains current source

### Regression

- Phase 3 tenant/security suite
- entitlement snapshot
- operator/audit
- merged Admin P0 milestones
- prompt contract
- project setup draft
- report readiness

---

## 10. Rollback and recovery

### Plan phase

- rollback: close docs branch/PR
- DB impact: none
- preserve Issue/PR/CI evidence

### Future local Unit A

- stop dedicated local stack
- preserve migration and verifier output
- do not weaken constraints to pass tests
- do not edit existing migration or seed
- do not touch other Issue containers/worktrees

### Production boundary

Unit PR merge does not authorize remote migration.

Remote/production apply requires a separate R3 Issue specifying:

- exact migration
- live schema inventory
- existing row counts/nulls
- backfill or no-backfill decision
- application deployment order
- rollback/forward correction
- monitoring and customer impact

---

## 11. Dependencies and concurrency

| Dependency | State | Impact |
|---|---|---|
| PR #145 | merged at `21043ccc...` | current authority |
| Issue #144 | completed | fixed-foundation decision |
| Issue #136 | superseded / closed | greenfield design is historical only |
| Issue #141 / #143 | superseded / closed | no W1A/W1B execution |
| Phase 3 tenant/security | merged | reuse without redefinition |
| Admin P0 #139 | may progress concurrently | Unit A must start from latest master and recheck migration/package/verifier conflicts |
| Prompt Contract TypeScript | merged, runtime-unconnected | semantic reference only initially |

---

## 12. Milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Current foundation inventory | `Completed` | schema, types, materializer, evidence chainをread-only確認 | reuse boundary documented |
| M2: Minimal field decision | `Completed` | projects 4 fields、prompts 6 fields、no new tableを選定 | exact first-choice target documented |
| M3: Integrity and snapshot decision | `Completed` | project-level freeze、hash、no new snapshotを決定 | historical interpretation path documented |
| M4: Implementation split | `Completed` | Unit A-Dへ分割 | separate Execute boundaries documented |
| M5: Docs-only PR and CI | `In progress` | one-file Draft PR、CI、Issue報告 | CI PASS / Human review |
| M6: Execute decision | `Pending` | Unit A child IssueのPlan/Execute判断 | OWNER decision |

---

## 13. Validation for this Plan PR

| Validation | Expected | Actual |
|---|---|---|
| changed files | this Exec Plan only | Pending final diff |
| PR #145 alignment | fixed Prompt / existing foundation | PASS by cross-review |
| new-table-first regression | no new table in initial target | PASS by cross-review |
| current schema/type/materializer evidence | references confirmed repository facts | PASS by read-only review |
| whitespace | 0 errors | Pending CI |
| Recora preflight/typecheck | PASS | Pending CI |
| lint | PASS | Pending CI |
| build | PASS | Pending CI |
| secret/env/token/DB URL value | 0 | Pending final review |

---

## 14. Progress log

| Date | Milestone | Update | Next step |
|---|---|---|---|
| `2026-08-04` | M1 | Issue #146 created after PR #145 merge | decide exact fields |
| `2026-08-04` | M2 | projects 4 + prompts 6, no new table selected | integrity/snapshot review |
| `2026-08-04` | M3 | project-level finalization and existing run evidence reuse selected | split implementation |
| `2026-08-04` | M4 | Unit A-D separated | Draft PR / CI |

---

## 15. Decision log

| Date | Decision | Rationale | Impact |
|---|---|---|---|
| `2026-08-04` | no new table initially | fixed Prompt set and existing evidence are sufficient | avoids duplicate domain |
| `2026-08-04` | Project-level finalization | prevents later Prompt additions/removals | 4 Project metadata fields candidate |
| `2026-08-04` | six Prompt metadata fields | minimum required for intent/panel/eligibility | keeps current Prompt table |
| `2026-08-04` | one fixed JSON eligibility object | multi-metric authority without child table/9 booleans | typed validator required |
| `2026-08-04` | no per-run classification snapshot initially | finalized metadata is immutable; text/model evidence exists | copy config hash into run metadata only |
| `2026-08-04` | implementation split A-D | schema, materialization, run, aggregation have different risk and tests | separate Issues/approvals |
| `2026-08-04` | keep semantic TypeScript contract for now | rules remain useful; physical aggregate is not mandatory | cleanup deferred |

---

## 16. Results and remaining risks

### Planned result

- current tables remain foundation
- initial implementation adds no table
- Project Prompt set is fixed with hash/count/version
- Prompt receives only intent/panel/response/opportunity/eligibility metadata
- run evidence is reused
- implementation is split into four small units

### Remaining risks

- local catalog may show existing composite FK or grant differences
- current seed/legacy rows may block a strict unique constraint; finalization validator avoids immediate legacy migration failure
- exact project deletion/cascade trigger behavior requires Local PostgreSQL test
- JSON validation helper design requires identifier/ACL review
- materialization command must integrate audit/actor boundary without generic RPC
- aggregation code path inventory remains Unit D work
- Admin P0 concurrent migrations may change the latest baseline

### Completion record

- Final status: `N/A — Plan PR pending Human review`
- Completed or closed at: N/A
- Follow-up: Unit A child Issue after separate OWNER Execute approval
- Archive path after completion: `docs/exec-plans/completed/issue-146-measurement-design-minimal-prompt-retrofit.md`
