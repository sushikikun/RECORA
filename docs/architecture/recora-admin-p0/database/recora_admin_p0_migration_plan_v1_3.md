# レコラ管理画面 P0 migration実装順仕様書

**文書ID:** RECORA-ADMIN-P0-MIGRATION-PLAN  
**Version:** 1.3  
**日付:** 2026-08-02  
**状態:** 正式設計・未実装  

## 0. 結論


P0 DBは24個のmigration unitで、**baseline guard → private write model → cross-domain constraints → security → compatibility → read model → final validation**の順に実装する。

実際のtimestamp付きファイル名は固定文字列を手入力しない。各unitを実装する直前にrepository rootで次を使い、CLIが生成したtimestampへ本書のstemを付ける。

```powershell
supabase migration new <migration_stem>
```

1 migrationへ全P0を詰め込まない。各unitは依存関係、責任、検証を明確に分ける。ただし、1つの業務原子性を成立させるtable・trigger・functionを不自然に別releaseへ分断しない。

## 1. 実装原則


- 作業開始baselineは`C:\Users\nakan\work\recora-main`の最新`master`。
- 旧`recora_admin` migrationを書き換えない。
- migrationはadditive。P0 release内でdrop/renameしない。
- remote/linked/production DBへ適用しない。最初は専用local Supabase stackだけ。
- schema変更の試行はlocal DBで行い、最終SQLだけmigrationへ固定する。
- migration適用前にinventoryをfail-closedで行う。
- large/semantic backfillをDDL transactionへ混ぜない。
- browser grantは最後のsecurity migrationでも付与しない。
- write modelが完成してもUIを接続せず、command/read contractとテストを先に完成させる。


## 1.1 M01/M02監査因果境界

- M01の`admin_command_receipts`をglobal・organization・project共通のP0 receiptとする。
- M01では人間commandに`operator_events`を必須化するが、M02より前には存在しないadmin account・role assignmentを推測しない。
- 既存`operator_command_receipts`はorganization/project scopeの互換bridgeに限定する。
- M02で`admin_account_id` FK、role assignment、authorization scope、成功commandの最終整合triggerを追加する。
- global対応を理由に既存Phase 3 receiptのtenant制約を緩めない。
- outboxの詳細attempt履歴は新tableを増やさず、M08以降`system_event`へ記録する。


### 1.1.1 Idempotency conflict rule

M01は`admin_command_receipts.request_fingerprint`を必須化する。future command RPCは、同じactor・scope・command・idempotency keyを受けた場合、fingerprint一致なら既存receiptを返し、不一致なら新しいwriteを行わず`idempotency_conflict`を返す。raw command payloadは保存しない。

### 1.1.2 P4-B-aware current baseline

現行`master` `2c2a6fba70b75e858abc71a7447840bf32f3507d`には、P4-B account access migrationが含まれる。M00は次をbaseline gateへ追加する。

- `customer_session` source kind
- `p4_command_receipts.customer_auth_user_id`
- validated actor-shape constraint
- P4 invitation/membership relations
- P4-B account RPC inventoryとbrowser/service grant boundary

M04はP4-B invitation/membershipを再利用し、`organization_members.invitation_expires_at`を追加しない。顧客ユーザーの現在membership拡張だけを行う。

## 2. 正式migration sequence

### 00. `recora_admin_p0_00_baseline_contract` — Baseline inventory and Canonical contract

**依存:** なし

**作成**

- `recora_private.admin_p0_schema_versions`

**目的**

- Assert required public/recora_private/recora_operator/recora_audit baseline objects
- Pin Canonical manifest hash and repository baseline
- Inventory legacy recora_admin rows without converting them

**migration単体のexit criteria**

- Fail before persistent writes on missing/orphan/contradictory tenant data
- Verify current master baseline or require explicit rebase review

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 01. `recora_admin_p0_01_common_infrastructure` — Private command/outbox/read-refresh infrastructure

**依存:** 0

**作成**

- `recora_private.admin_command_receipts`
- `recora_private.admin_outbox_messages`
- `recora_private.admin_read_refreshes`
- `admin_read schema`

**目的**

- Provide P0-wide idempotency, correlation and async durability
- Create the universal P0 command receipt without fabricating M02 role evidence
- Revoke browser and direct service-role table access from new schemas immediately

**migration単体のexit criteria**

- Idempotent receipt replay
- Idempotency fingerprint conflict rejection
- Append-only receipt guard
- Human audit linkage and staged M02 causal closure
- Outbox payload safety and monotonic claim attempts
- Read-refresh single-running and terminal immutability

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 02. `recora_admin_p0_02_operator_rbac_audit` — Admin accounts, fixed RBAC and audit convergence

**依存:** 1

**作成**

- `recora_audit.operator_event_scopes`
- `recora_operator.admin_accounts`
- `recora_operator.admin_capabilities`
- `recora_operator.admin_identity_security_projections`
- `recora_operator.admin_role_assignments`
- `recora_operator.admin_role_capabilities`
- `recora_operator.admin_roles`
- `recora_operator.admin_scope_assignments`

**変更**

- recora_audit.operator_events: actor/risk/outcome/idempotency/correction and role-assignment authorization fields
- recora_private.admin_command_receipts: `admin_account_id` FK and final human authorization evidence trigger

**目的**

- Represent invited admins without fabricating auth identities
- Make role-assignment scope authoritative for P0
- Keep operator_events as the one audit store
- Close global human command authorization without weakening or repurposing the legacy organization-scoped operator receipt

**migration単体のexit criteria**

- Last platform-admin protections
- Scope exactness
- Sensitive summary rejection
- Global and organization/project human success carry role-assignment audit evidence
- No role inference from legacy action grants

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 03. `recora_admin_p0_03_static_catalogs` — Seed fixed role/capability/notification catalogs

**依存:** 2

**作成**

- `recora_private.admin_notification_categories`

**固定データ**

- `8 role rows`
- `64 capability rows`
- `role-capability map`
- `8 notification category rows`

**目的**

- Seed only Canonical registries
- Make catalog replay idempotent and hash-checked

**migration単体のexit criteria**

- Catalog counts and digests match permissions v2.0

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 04. `recora_admin_p0_04_customer_project_inquiry` — Customer/project controls, membership extensions and inquiries

**依存:** 3

**作成**

- `recora_private.admin_customer_inquiries`
- `recora_private.admin_customer_inquiry_notes`
- `recora_private.admin_customer_profiles`
- `recora_private.admin_project_states`

**変更**

- public.organizations row_version
- public.projects row_version
- public.organization_members normalized_email/row_version

**目的**

- Separate customer access, automation and publication controls
- Keep customer/project identity in public tenant roots
- Add support inquiry intake/notes

**migration単体のexit criteria**

- Customer/project composite ownership
- Revoked membership non-revival
- No duplicate non-revoked normalized email

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 05. `recora_admin_p0_05_settings_core` — Plan, notification, daily, AI-model and rule settings

**依存:** 4

**作成**

- `recora_private.admin_ai_model_controls`
- `recora_private.admin_daily_automation_configuration_versions`
- `recora_private.admin_daily_automation_configurations`
- `recora_private.admin_notification_destination_categories`
- `recora_private.admin_notification_destinations`
- `recora_private.admin_plan_definitions`
- `recora_private.admin_plan_version_ai_models`
- `recora_private.admin_plan_versions`
- `recora_private.admin_publication_rule_versions`
- `recora_private.admin_quality_rule_versions`
- `recora_private.admin_scheduled_configuration_changes`

**目的**

- Version active settings instead of overwriting
- Separate AI model health from control
- Prepare fail-closed quality/publication rules

**migration単体のexit criteria**

- Singleton daily configuration
- 50/100/200 tier constraints
- One active plan/rule version
- No incident-safety direct release

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 06. `recora_admin_p0_06_contract_entitlement_bridge` — Canonical contract versions and project entitlement bridge

**依存:** 5

**作成**

- `recora_private.admin_contract_versions`
- `recora_private.admin_project_entitlements`

**変更**

- none: reuse p4_contract_projections/events and entitlement snapshots/pointers

**目的**

- Map canonical contract lifecycle onto existing P4 projection
- Create immutable contract versions
- Atomically activate entitlement status and snapshot pointer

**migration単体のexit criteria**

- One active/scheduled contract version
- One active project entitlement
- P4 projection/event alignment
- Snapshot scope exactness

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 07. `recora_admin_p0_07_setup_configuration_artifacts` — Project configuration revisions, setup runs and generated artifacts

**依存:** 6

**作成**

- `recora_private.admin_category_set_items`
- `recora_private.admin_category_sets`
- `recora_private.admin_competitor_set_items`
- `recora_private.admin_competitor_sets`
- `recora_private.admin_persona_topic_personas`
- `recora_private.admin_persona_topic_sets`
- `recora_private.admin_persona_topic_topics`
- `recora_private.admin_project_configuration_ai_models`
- `recora_private.admin_project_configuration_revisions`
- `recora_private.admin_project_setup_runs`
- `recora_private.admin_prompt_set_items`
- `recora_private.admin_prompt_sets`
- `recora_private.admin_site_analysis_evidence`
- `recora_private.admin_site_analysis_snapshots`

**目的**

- Preserve immutable setup input and artifacts
- Support current-active revision while replacement builds
- Preserve site evidence without raw HTML

**migration単体のexit criteria**

- One active and one nonterminal revision per project
- Prompt count tier exactness
- Competitor expected count 12
- Artifact scope consistency

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 08. `recora_admin_p0_08_incident_event_core` — Incident, scope, system event and component health core

**依存:** 4

**作成**

- `recora_private.admin_incident_scopes`
- `recora_private.admin_incidents`
- `recora_private.admin_system_component_states`
- `recora_private.admin_system_events`

**目的**

- Create common-cause incident authority before quality/publication links
- Provide append-only system event dedupe
- Separate health observation from controls

**migration単体のexit criteria**

- One unresolved incident fingerprint
- NULL-safe scope uniqueness
- Older health observation cannot win

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 09. `recora_admin_p0_09_daily_targeting` — Daily target evaluation and project decisions

**依存:** 5, 6, 7, 8

**作成**

- `recora_private.admin_daily_target_decisions`
- `recora_private.admin_daily_target_evaluation_runs`

**目的**

- Distinguish before-start, pending, finalized and failed targeting
- Pin contract/entitlement/configuration facts for each project/day

**migration単体のexit criteria**

- One run per business date
- One decision per project/date
- Activation-day source rules
- No unknown converted to excluded

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 10. `recora_admin_p0_10_measurement_execution` — Cycles, items, attempts, batches and result revisions

**依存:** 9

**作成**

- `recora_private.admin_batch_item_assignments`
- `recora_private.admin_measurement_attempts`
- `recora_private.admin_measurement_batches`
- `recora_private.admin_measurement_cycle_revision_items`
- `recora_private.admin_measurement_cycle_revisions`
- `recora_private.admin_measurement_cycles`
- `recora_private.admin_measurement_items`

**目的**

- Separate logical item, provider attempt, execution batch and adopted result revision
- Keep old current revision during reprocessing

**migration単体のexit criteria**

- One formal cycle per project/date
- One building revision per cycle
- One nonterminal assignment per item
- Attempt/result terminality
- Finalize transaction atomicity

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 11. `recora_admin_p0_11_publication_candidate` — Candidate generation runs and immutable candidate payloads

**依存:** 10, 5

**作成**

- `recora_private.admin_publication_candidate_generation_runs`
- `recora_private.admin_publication_candidates`

**目的**

- Generate candidate before quality inspection
- Provide cycle and project generation numbers
- Never invalidate old candidate before new generation commits

**migration単体のexit criteria**

- One nonterminal generation run per project
- Project generation uniqueness
- Payload immutability
- Additional validation cannot generate candidate

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 12. `recora_admin_p0_12_quality_exception` — Automatic quality runs, cases, findings, actions and decisions

**依存:** 7, 8, 10, 11

**作成**

- `recora_private.admin_quality_check_runs`
- `recora_private.admin_quality_decisions`
- `recora_private.admin_quality_exception_actions`
- `recora_private.admin_quality_exception_cases`
- `recora_private.admin_quality_exception_findings`

**目的**

- Separate check execution, work case, finding, reprocessing action and decision
- Deduplicate by stable subject across candidate generations

**migration単体のexit criteria**

- One running check per subject
- Unresolved case dedupe
- Critical finding incident requirement
- One nonterminal action per case
- Human cannot set candidate ready

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 13. `recora_admin_p0_13_publication_delivery` — Publication versions, pointer, operations and delivery verification

**依存:** 11, 12

**作成**

- `recora_private.admin_project_publication_pointers`
- `recora_private.admin_publication_delivery_verifications`
- `recora_private.admin_publication_operations`
- `recora_private.admin_publication_versions`

**目的**

- Make pointer the only current-publication source
- Atomically create version, consume candidate and switch pointer
- Support rollback/restore/stop/resume

**migration単体のexit criteria**

- One operation per project
- One version per candidate
- Pointer CAS
- Verification phase uniqueness
- Rollback to previous/NULL

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 14. `recora_admin_p0_14_incident_recovery_clearance` — Incident actions, recovery plans, steps and one-time clearances

**依存:** 8, 10, 13

**作成**

- `recora_private.admin_incident_actions`
- `recora_private.admin_incident_recovery_clearances`
- `recora_private.admin_incident_recovery_plans`
- `recora_private.admin_incident_recovery_steps`

**目的**

- Represent ordered recovery and canary/recovery batches
- Release blocked controls only with exact one-time clearance

**migration単体のexit criteria**

- One nonterminal plan
- Step retry adds row
- Clearance consume+release atomic
- Row-version/expiry exactness

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 15. `recora_admin_p0_15_usage_cost` — Usage, pricing, cost calculation and CSV export

**依存:** 5, 8, 10, 11, 12, 13, 14

**作成**

- `recora_private.admin_cost_calculation_runs`
- `recora_private.admin_cost_records`
- `recora_private.admin_pricing_definitions`
- `recora_private.admin_usage_cost_export_jobs`
- `recora_private.admin_usage_records`

**目的**

- Record one immutable usage component
- Keep uncomputed distinct from zero
- Version every calculation result
- Fix CSV scope/snapshot/watermarks

**migration単体のexit criteria**

- Usage dedupe
- Correction chain acyclic
- Pricing range non-overlap
- Current cost derives from max valid version
- No prompt/answer in CSV

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 16. `recora_admin_p0_16_cross_domain_constraints` — Deferred circular FKs and cross-domain integrity

**依存:** 6, 7, 8, 9, 10, 11, 12, 13, 14, 15

**変更**

- project state active configuration FK
- cycle current revision FK
- incident/quality/publication/recovery typed references
- control-to-incident checks

**目的**

- Add cyclic references only after both sides exist
- Use NOT VALID then VALIDATE for existing populated tables where needed

**migration単体のexit criteria**

- No orphan typed references
- All current pointers refer to same-scope terminal-valid rows

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 17. `recora_admin_p0_17_transition_immutability_guards` — State-transition, row-version and append-only guards

**依存:** 16

**作成**

- `domain transition trigger functions`
- `append-only triggers`
- `payload immutability triggers`

**目的**

- Reject invalid direct DML even through server credentials
- Require row_version increments and immutable identity fields

**migration単体のexit criteria**

- Negative transition matrix
- Update/delete rejection
- Terminal non-revival

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 18. `recora_admin_p0_18_indexes` — Partial unique, scope and read-path indexes

**依存:** 17

**作成**

- `all required unique/partial indexes`
- `scope/filter/sort indexes from read-model v2.0`

**目的**

- Enforce concurrency invariants
- Support scope-before-count queries

**migration単体のexit criteria**

- No duplicate logical current rows
- EXPLAIN checks for top admin queries
- no unused duplicate index by catalog review

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 19. `recora_admin_p0_19_security_grants_rpc` — RLS, grants and explicit command boundaries

**依存:** 18

**変更**

- Enable RLS on every new table
- revoke PUBLIC/anon/authenticated
- grant service_role only where explicit
- create service-role-only command/read functions

**目的**

- Keep admin schemas outside browser Data API
- Use fixed search_path and explicit authorization
- No generic table mutation RPC

**migration単体のexit criteria**

- Browser role denied for every table/view/function
- SECURITY DEFINER inventory
- scope and BOLA negatives

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 20. `recora_admin_p0_20_legacy_compatibility_cutover` — Legacy freeze, explicit bootstrap registry and dual-read boundary

**依存:** 19

**作成**

- `optional compatibility views/explicit mapping records only where source identity is proven`

**変更**

- application writer flags, not destructive table drops

**目的**

- Freeze recora_admin P0-A/B/C as legacy inventory
- Do not infer contracts/entitlements/publications from mutable JSON
- Allow controlled per-project bootstrap

**migration単体のexit criteria**

- No new authoritative writes to legacy tables
- No automatic semantic backfill
- Customer dashboard legacy path remains unaffected until UI cutover

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 21. `recora_admin_p0_21_admin_read_core` — admin_read schema contract and core views

**依存:** 19, 20

**作成**

- `admin_read.v_project_current_operational_summary`
- `admin_read.v_customer_admin_summary`
- `admin_read.v_contract_admin_summary`
- `admin_read.v_inquiry_admin_summary`
- `admin_read.v_daily_measurement_status`
- `admin_read.v_measurement_cycle_summary`
- `admin_read.v_measurement_batch_summary`

**目的**

- Expose scope keys and source status without browser grants
- Never store display_status in write model

**migration単体のexit criteria**

- View/source consistency
- scope-before-aggregate
- stale/unknown not zero

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 22. `recora_admin_p0_22_admin_read_domains` — Quality, publication, incident, timeline, cost and settings views

**依存:** 21, 15

**作成**

- `admin_read.v_quality_check_run_summary`
- `admin_read.v_quality_case_summary`
- `admin_read.v_publication_project_summary`
- `admin_read.v_incident_summary`
- `admin_read.v_attention_work_item`
- `admin_read.v_sidebar_badge`
- `admin_read.v_timeline_entry`
- `admin_read.v_usage_cost_fact`
- `admin_read.v_usage_cost_entity_summary`
- `admin_read.v_usage_cost_ai_model_summary`
- `admin_read.v_usage_cost_cycle_batch_summary`
- `admin_read.v_usage_cost_coverage_summary`
- `admin_read.v_usage_cost_export_summary`
- `admin_read.v_settings_health_summary`
- `admin_read.mv_usage_cost_daily_summary`

**目的**

- Implement single formulas for attention, badges, timeline and current cost
- Materialize only daily cost summary

**migration単体のexit criteria**

- Badge/list/facet equality
- timeline dedupe
- current cost version rules
- refresh metadata

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

### 23. `recora_admin_p0_23_canonical_validation_marker` — Final schema contract validation and migration-set marker

**依存:** 22

**固定データ**

- `final recora_private.admin_p0_schema_versions ready marker row`

**目的**

- Validate all object/constraint/index/grant/catalog hashes
- Mark DB ready for backend implementation, not UI rollout

**migration単体のexit criteria**

- Unseeded+seeded fresh replay
- same-stack replay
- all baseline regressions
- Supabase advisors
- manifest/object digest equality

**rollback:** Roll forward; stop new writers and preserve evidence. No destructive down migration.

## 3. Release wave

| Wave | Migration | 意味 | 外部writer |
|---|---|---|---|
| A: Expand | 00–08 | schema、identity、customer/settings/contract/setup/incident core | 禁止 |
| B: Operational write model | 09–15 | daily、measurement、candidate、quality、publication、recovery、cost | 専用local fixtureだけ |
| C: Contract hardening | 16–19 | cross-domain FK、transition、index、RLS/grant/RPC | 明示command fixtureだけ |
| D: Compatibility | 20 | legacy freezeとbootstrap境界 | legacy customer pathのみ維持 |
| E: Read model | 21–22 | admin_read views、materialized cost | server read fixtureだけ |
| F: Certification | 23 | object/catalog/digest検証 | UI接続禁止のままready marker |

## 4. 循環依存の解消順


次のFKはtable作成migrationで無理に張らず、migration 16で追加する。

```text
admin_project_states.active_configuration_revision_id
  -> admin_project_configuration_revisions.id

admin_measurement_cycles.current_revision_id
  -> admin_measurement_cycle_revisions.id

admin_quality_exception_cases.incident_id
  -> admin_incidents.id

admin_incident_recovery_steps.measurement_batch_id
  -> admin_measurement_batches.id

admin_project_publication_pointers.last_operation_id
  -> admin_publication_operations.id
```

作成時はnullable columnと同一scope列を先に用意し、両側のtable・一意keyが揃ってからFKを追加する。既存行がある場合は`NOT VALID`で追加し、inventory修正後に`VALIDATE CONSTRAINT`する。

## 5. Backfillとcutover


### 5.1 自動backfill

- public organizations/projectsへ`row_version=1`を設定する。
- organization_membersの`normalized_email`を既存emailから決定論的に生成する。
- existing operator identityへadmin accountを作る場合、role/scopeは推測せず未割当または明示fixtureだけにする。
- daily/AI control singleton rowは安全なdefaultを作るが、active version/ruleが欠ける間は処理をfail-closedにする。

### 5.2 明示bootstrapが必要

- 既存顧客のcontract/version/entitlement
- 既存projectのactive configuration revision
- 既存公開中dashboardを表すpublication version/pointer
- legacy schedule/batch/reviewのCanonical履歴

これらはmigration SQLで推測せず、対象IDとsourceを固定した別command/runbookで行う。

### 5.3 Cutover gate

```text
canonical project state exists
AND active configuration exists
AND active contract/version/entitlement exists
AND read model consistency passes
```

を満たしたprojectだけ、管理画面の正式write対象へ切り替える。customer dashboardの切替はpublication pointerのbootstrapと表示検証後に別途行う。

## 6. 各migrationの検証コマンド順


実装時は、利用可能なCLIの正確なsubcommand/flagを`--help`で確認してから実行する。標準順は次とする。

```text
1. supabase --version
2. supabase migration new <stem>
3. 専用local stackへmigration-only fresh reset
4. migration単体fixture
5. seeded fresh reset
6. migration単体fixture
7. 同一stack replay/idempotency fixture
8. Phase 3/4既存回帰fixture
9. migration list --local
10. db advisors --local
11. npm run recora:preflight:full
12. npm run typecheck
13. npm run lint
14. npm run build
15. git diff --check
16. explicit-scope/secret/env/lockfile検査
```

`supabase db push`、remote migration、production applyは、この設計固定作業の範囲外である。

## 7. Migration failure時の扱い


- inventory failure: データを推測修正せず停止する。
- DDL failure: 同じlocal stackで原因を修正し、正式migration historyへ不完全版を残さない。
- backfill failure: Canonical writerを開始せず、旧pathを維持する。
- read model failure: write stateを0件/正常として扱わない。UI接続を止める。
- security/advisor failure: merge不可。
- migration 23 digest mismatch: DB ready markerを作らない。

Remoteへ一度適用した後のrollbackはdropではなくroll-forwardを原則とし、immutable audit/event/historyを保存する。

## 8. 実装完了後の次工程


DB migrationの次は、次の順とする。

1. Canonical command registryをTypeScriptへ固定
2. commandごとのtransaction/RPC/application service
3. worker/outbox orchestrator
4. admin_read repositoryとscope filter
5. route guard、MFA、step-up
6. DB acceptance fixture
7. 共通管理画面shell
8. 8領域UI

UIを先に大量実装しない。
