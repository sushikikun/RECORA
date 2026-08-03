# レコラ管理画面 P0 物理データベーススキーマ仕様書

**文書ID:** RECORA-ADMIN-P0-DB-SCHEMA  
**Version:** 1.3  
**日付:** 2026-08-02  
**状態:** 正式設計・未実装  

## 0. 結論


Canonical Package v1.0を物理DBへ変換する正式方針は、次で固定する。

```text
public
  既存の顧客・project・顧客membership・測定evidence

recora_private
  P0管理運用の正式write model、immutable history、control、system event、cost

recora_operator
  管理者account、固定role、capability、role単位scope

recora_audit
  重要操作を1回だけ保存するappend-only audit log

admin_read
  管理画面専用view・materialized view。ブラウザへ直接公開しない

recora_admin
  旧P0-A/B/Cのcompatibility inventory。新しい正式状態は保存しない
```

既存のPhase 3/4基盤を削除・改名せず、Canonical P0をadditiveに積み上げる。旧`recora_admin`へ新規の正式データを追加する案は不採用とする。


## 0.1 v1.1横断修正

M01の詳細化で、既存Phase 3の`recora_operator.operator_command_receipts.organization_id`が必須である一方、Canonical P0には管理者・日次設定などのglobal commandが存在することを確認した。

正式な解決は次とする。

```text
admin_command_receipts
  global / organization / projectを扱うP0共通receipt

operator_events
  人間管理者操作の単一audit保存元

operator_command_receipts
  既存Phase 3のorganization/project commandだけを追加bridge
```

既存`operator_command_receipts`のorganization境界をglobal対応のために緩めない。M02でrole assignmentとauthorization scopeをauditへ固定し、global commandも`admin_command_receipts + operator_events`で完全な因果証跡を持たせる。

また、固定relation inventoryにoutbox attempt専用tableはないため、M01は`admin_outbox_messages`の現在delivery projectionと単調増加する`attempt_count`だけを保持する。M08の`system_event`作成後は、個々のclaim・delivery・failureをappend-only eventとして記録する。


### 0.1.1 Idempotency fingerprint補足

`idempotency_key`だけでは、同じkeyを異なる対象値・設定値へ誤用した場合と正当な再送を区別できない。そのためM01の正式receiptへ`request_fingerprint`を追加する。

```text
serverでcommand入力を正規化
↓
SHA-256を計算
↓
同じactor・scope・command・idempotency keyを検索
├ fingerprint一致
│  → 既存receiptをreplayとして返す
└ fingerprint不一致
   → idempotency_conflict
```

fingerprintをbrowserが信頼値として指定することは禁止する。raw入力や機密payloadそのものはreceiptへ保存しない。

### 0.1.2 v1.3 current master / P4-B再固定

`master`は前回baselineから次へ進んだ。

```text
commit: 2c2a6fba70b75e858abc71a7447840bf32f3507d
change: P4-B account invitation / membership / customer access RPC foundation
```

既存基盤として次を正式に再利用する。

- `recora_private.p4_source_kind`の`customer_session`
- `p4_command_receipts.customer_auth_user_id`
- validated `p4_command_receipt_actor_shape`
- `p4_invitations` / `p4_invitation_events`
- `p4_membership_episodes` / `p4_membership_episode_events`
- invitation create/resend/revoke/accept、membership suspend/reactivate/revoke、customer access resolver

actor evidenceは次の責任を持つ。

```text
manual
→ operator audit + operator command receiptの完全なpair

customer_session
→ verified customer auth user
→ operator evidenceなし

provider_fixture
→ operator pairが完全に揃うか、両方とも存在しない
```

顧客ユーザー招待の正本はP4 invitationである。したがって、旧案の`public.organization_members.invitation_expires_at`は追加しない。

```text
P4 invitation
→ recipient binding、role、expiry、pending/accepted/revoked/superseded

public.organization_members
→ 現在のcustomer membership

P4 membership episode/event
→ invitationからmembershipへのimmutable因果履歴
```

M00はこの基盤を存在・制約・権限まで検査し、M04は互換性のある顧客ユーザー操作でP4-B RPCを使用する。別の招待tableや招待期限fieldを新設しない。

## 1. 正式な前提と優先順位


実装時の優先順位は次とする。

1. Canonical Manifest v1.0
2. 正式状態モデル v2.1
3. read model仕様 v2.0
4. 権限・監査仕様 v2.0
5. 本物理スキーマ仕様 v1.3
6. 現在のrepository実装事実

設計時に確認したrepository baselineは次である。

```text
repository: sushikikun/RECORA
branch: master
commit: 2c2a6fba70b75e858abc71a7447840bf32f3507d
```

実装開始時に`master`が変わっている場合、この文書を暗黙に適用せず、migration 00のinventoryを再実行して差分を確認する。

## 2. 横断設計ルール


### 2.1 Tenant key

物理DBではCanonicalの`customer_id`を既存tenant rootの`organization_id`へ対応させる。project配下の全正式テーブルは、可能な限り`organization_id`と`project_id`を併記し、次のcomposite FKを使用する。

```sql
foreign key (project_id, organization_id)
references public.projects (id, organization_id)
on delete restrict
```

### 2.2 状態列

新規P0テーブルの状態は、PostgreSQL enumを大量追加せず、`text + named CHECK constraint`で固定する。理由は、P0後の状態追加をadditive migrationで扱いやすくし、既存enumの互換性を壊さないためである。既に存在するmembership/P4 enumは変更せず再利用する。

### 2.3 Mutable currentとimmutable history

- current/control/workflow行: `row_version bigint NOT NULL DEFAULT 1`、`created_at`、`updated_at`を持つ。
- updateは`row_version = old.row_version + 1`を必須とする。
- append-only/history/payload行: `updated_at`を持たず、UPDATE/DELETE拒否triggerを付ける。
- draftだけ編集可能なversionは、draft離脱後にidentity/content列の変更を拒否する。
- P0では業務データの物理DELETEを行わない。FKは原則`ON DELETE RESTRICT`。

### 2.4 Idempotencyと相関

全管理者/system commandは`recora_private.admin_command_receipts`を通す。これはglobal・organization・projectの全P0 commandに共通する正式receiptである。人間管理者commandは必ず既存`operator_events`の1件へ因果接続する。既存`operator_command_receipts`はorganization/project scopeの既存Phase 3 commandとの互換bridgeとして利用できるが、`organization_id NOT NULL`であるためglobal commandの証跡へ転用しない。M02でrole assignment・authorization scopeを`operator_events`へ追加し、globalを含む人間commandの成功証跡を閉じる。非同期処理は`admin_outbox_messages`へ同一transactionで書く。

### 2.5 Payload境界

- raw AI回答・citation・metric本体は既存public evidenceを正とする。
- admin DBへは正式reference、digest、safe summaryだけを保存する。
- publication candidate/versionだけは顧客delivery用のimmutable payloadを保持する。
- audit/system eventへprompt全文、AI回答、raw provider payload、token、cookie、Authorization headerを保存しない。

### 2.6 Read境界

`admin_read`はprivate/unexposed schemaとし、`anon`と`authenticated`へUSAGE/SELECT/EXECUTEを与えない。viewはscope keyを保持し、scope filterをcount・facet・aggregateより先に適用できる形にする。

## 3. 既存オブジェクトの正式な扱い

| 物理object | Canonical責任 | 扱い | 用途 |
|---|---|---|---|
| public.organizations | customer identity | reuse+extend | Tenant/customer identity and customer name. |
| public.projects | project identity | reuse+extend | Project identity, name and tenant ownership. |
| public.organization_members | customer_user | reuse+extend | Customer membership used by customer RLS and customer-user administration. |
| public.ai_models | AI model identity | reuse | Stable AI model identifier referenced by configuration, attempts, cost and controls. |
| public measurement evidence tables | measurement evidence | reuse | Raw runs, run items, conversations, mentions, citations, metrics and recommendations remain existing evidence. |
| recora_operator.operator_identities | verified admin identity | reuse | Verified auth.users mapping for active administrators. |
| recora_operator.operator_action_grants | legacy action grant substrate | reuse/freeze-for-legacy | Existing Phase 3 explicit action grants used by legacy commands during convergence. |
| recora_operator.operator_command_receipts | legacy scoped human command receipt evidence | reuse | Existing immutable organization/project-scoped receipt. P0 global commandの正式receiptにはせず、対応可能なscoped commandだけ`admin_command_receipts`からbridgeする。 |
| recora_audit.operator_events | audit_log | reuse+extend | Single audit storage for important administrator/system control operations. |
| recora_private.plan_policy_versions | immutable effective plan policy | reuse | Effective entitlement policy generated from an active admin plan version. |
| recora_private.entitlement_snapshots | immutable entitlement content | reuse | Resolved capability/limit snapshot pinned by project entitlements and cycles. |
| recora_private.current_entitlement_snapshots | technical current entitlement pointer | reuse | Current immutable entitlement snapshot pointer used by existing resolver. |
| recora_private.p4_contract_projections | contract | reuse+canonical-normalization | Provider-neutral current contract projection; canonical status is normalized in admin_read. |
| recora_private.p4_contract_events | contract lifecycle history | reuse | Immutable contract transition evidence. |
| recora_private.p4 command/invitation/membership/checkpoint/outbox | Phase 4 causal and account-access infrastructure | reuse | P4-B customer-session actor evidence、invitation/membership lifecycle、customer-safe accessと既存P4-A causal/recoveryを再利用する。 |

## 4. Legacy凍結対象

次は削除しないが、新P0の正式情報源にはしない。


- `recora_admin.plan_configs`
- `recora_admin.customer_profiles`
- `recora_admin.customer_subscriptions`
- `recora_admin.diagnostic_intakes`
- `recora_admin.measurement_schedules`
- `recora_admin.operation_events`
- `recora_admin.measurement_batches`
- `recora_admin.measurement_batch_items`
- `recora_admin.report_publication_reviews`
- `recora_admin.prompt_change_events`
- `recora_admin.internal_notes`


原則:

- migration内でmutable JSONから契約・entitlement・公開履歴を推測しない。
- 新しい管理画面writerはこれらへ書かない。
- P0ではdrop/renameしない。
- 既存customer dashboardを切り替えるまで、旧customer read pathは維持する。
- 明示的なsource identityを確認できるprojectだけ、後続bootstrap commandでCanonical行を作る。

## 5. Canonical logical entityから物理objectへの対応

| Logical unit | Physical authority |
|---|---|
| customer | public.organizations + recora_private.admin_customer_profiles |
| project | public.projects + recora_private.admin_project_states |
| customer_user | public.organization_members + P4 invitation/membership history |

`customer_user`の招待中状態と期限はP4 invitationから読み、`organization_members`へ複製しない。
| contract | recora_private.p4_contract_projections/events |
| contract_version | recora_private.admin_contract_versions |
| project_entitlement | recora_private.admin_project_entitlements + entitlement_snapshots/current pointer |
| admin_user | recora_operator.admin_accounts + operator_identities |
| audit_log | recora_audit.operator_events |
| audit_log_scope | recora_audit.operator_event_scopes |

その他のCanonical unitは、以下の新規object catalogの`logical_entity`列に従う。

## 6. 新規物理object catalog

### 6.1 `recora_operator`

#### `recora_operator.admin_accounts`

- **Canonical責任:** admin_user
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** mutable current
- **scope:** global
- **目的:** Invited/active/suspended/deactivated admin directory record.

**必須field**

- `id uuid PK`
- `email text`
- `normalized_email text generated`
- `display_name text`
- `status text`
- `operator_identity_id uuid nullable`
- `invited_at`
- `activated_at nullable`
- `suspended_at nullable`
- `deactivated_at nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- status invited/active/suspended/deactivated
- deactivated terminal
- UNIQUE(normalized_email) for non-deactivated
- active requires active operator identity
- no auth secrets

#### `recora_operator.admin_identity_security_projections`

- **Canonical責任:** admin identity security projection
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** mutable system projection
- **scope:** global
- **目的:** Current MFA/security observation sourced from the identity provider without credentials.

**必須field**

- `admin_account_id uuid PK`
- `mfa_state text`
- `observed_at timestamptz`
- `source_version text`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- mfa_state unknown/not_enrolled/enrolled
- system-only writer
- stale/unknown is never treated as enrolled
- no credential/session/token fields

#### `recora_operator.admin_roles`

- **Canonical責任:** admin_role
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** immutable seeded catalog
- **scope:** global
- **目的:** Eight fixed P0 standard roles.

**必須field**

- `id uuid PK`
- `role_code text UNIQUE`
- `display_name text`
- `description text`
- `is_system_defined boolean`
- `is_editable boolean`
- `created_at`

**重要constraint**

- role_code fixed catalog
- no UI mutation

#### `recora_operator.admin_capabilities`

- **Canonical責任:** capability catalog
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** immutable seeded catalog
- **scope:** global
- **目的:** Canonical capability registry from permissions v2.0.

**必須field**

- `id uuid PK`
- `capability_code text UNIQUE`
- `domain_code text`
- `sensitivity text`
- `created_at`

**重要constraint**

- 64 canonical capabilities
- no UI mutation

#### `recora_operator.admin_role_capabilities`

- **Canonical責任:** role capability map
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** immutable seeded catalog
- **scope:** global
- **目的:** Maps fixed roles to capabilities.

**必須field**

- `role_id uuid`
- `capability_id uuid`
- `created_at`

**重要constraint**

- PK(role_id,capability_id)
- no direct admin edits

#### `recora_operator.admin_role_assignments`

- **Canonical責任:** admin_role_assignment
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** mutable history
- **scope:** global
- **目的:** Role assignment to an admin account.

**必須field**

- `id`
- `admin_account_id`
- `role_id`
- `status text`
- `assigned_by_admin_account_id`
- `assigned_at`
- `expires_at nullable`
- `revoked_at nullable`
- `revoked_reason_code nullable`
- `row_version`

**重要constraint**

- status active/revoked/expired
- one active assignment per admin+role
- revoked/expired assignment not revived
- last platform-admin protection

#### `recora_operator.admin_scope_assignments`

- **Canonical責任:** admin_scope_assignment
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** mutable history
- **scope:** global/organization/project
- **目的:** Scope attached to one role assignment.

**必須field**

- `id`
- `role_assignment_id`
- `scope_type text`
- `organization_id nullable`
- `project_id nullable`
- `status text`
- `assigned_at`
- `expires_at nullable`
- `revoked_at nullable`
- `row_version`

**重要constraint**

- scope_type global/customer/project
- status active/revoked/expired
- exact target columns by scope
- one active equivalent scope
- project belongs to organization
- revoked/expired scope not revived

### 6.2 `recora_audit`

#### `recora_audit.operator_event_scopes`

- **Canonical責任:** audit_log_scope
- **作成migration:** 02 `recora_admin_p0_02_operator_rbac_audit`
- **性質:** append-only
- **scope:** organization/project
- **目的:** Multi-scope search/authorization relation for one audit event.

**必須field**

- `audit_event_id uuid`
- `organization_id uuid nullable`
- `project_id uuid nullable`
- `scope_type text`
- `created_at`

**重要constraint**

- PK with NULL-safe scope key
- append-only
- project requires matching organization

### 6.3 `recora_private`

#### `recora_private.admin_p0_schema_versions`

- **Canonical責任:** schema contract
- **作成migration:** 00 `recora_admin_p0_00_baseline_contract`
- **性質:** append-only
- **scope:** global
- **目的:** Pins Canonical package, physical schema and migration-set identity.

**必須field**

- `id uuid PK`
- `schema_version text`
- `canonical_package_id text`
- `canonical_version text`
- `canonical_manifest_sha256 text`
- `repository_baseline_commit text`
- `applied_at timestamptz`
- `migration_set_digest text`

**重要constraint**

- UNIQUE(schema_version)
- append-only
- hash fields are lowercase SHA-256

#### `recora_private.admin_command_receipts`

- **Canonical責任:** P0 command idempotency
- **作成migration:** 01 `recora_admin_p0_01_common_infrastructure`
- **性質:** append-only
- **scope:** global/organization/project
- **目的:** Idempotency and causal receipt for all P0 administrator/system commands.

**必須field**

- `id uuid PK`
- `actor_type text`
- `admin_account_id uuid nullable`
- `system_component_code text nullable`
- `command_name text`
- `organization_id uuid nullable`
- `project_id uuid nullable`
- `target_type text`
- `target_id uuid nullable`
- `idempotency_key text`
- `request_fingerprint text`
- `request_id uuid`
- `correlation_id uuid`
- `outcome text`
- `stable_reason_code text`
- `operator_command_receipt_id uuid nullable`
- `audit_event_id uuid nullable`
- `created_at timestamptz`

**重要constraint**

- exactly one admin/system actor
- project requires matching organization
- UNIQUE(actor scope, command_name, idempotency_key)
- 同じidempotency keyで既存receiptを返せるのは、serverが正規化入力から計算した`request_fingerprint`が一致する場合だけ
- fingerprint不一致は`idempotency_conflict`として拒否
- append-only
- 人間commandは成功・拒否・失敗を問わず1件の`operator_events`へ接続
- organization/project scopedの既存Phase 3 commandは`operator_command_receipts`へ追加bridge可能
- globalを含む成功commandの最終authorization evidenceは、M02で`operator_events.role_assignment_id`とscope証跡を検証して閉じる
- M01時点では`admin_account_id` FKを張らず、M02で`admin_accounts`作成後に追加する

#### `recora_private.admin_outbox_messages`

- **Canonical責任:** async outbox
- **作成migration:** 01 `recora_admin_p0_01_common_infrastructure`
- **性質:** mutable current + append attempts
- **scope:** global/organization/project
- **目的:** Durable handoff for accepted asynchronous work.

**必須field**

- `id uuid PK`
- `command_receipt_id uuid`
- `message_type text`
- `organization_id/project_id nullable`
- `aggregate_type/id`
- `payload_reference jsonb`
- `status text`
- `attempt_count int`
- `available_at`
- `locked_at`
- `delivered_at`
- `last_error_code`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- payload contains opaque references only
- status pending/processing/delivered/failed/reconciliation_required
- UNIQUE(command_receipt_id,message_type,aggregate_type,aggregate_id)
- `attempt_count`はclaim開始時だけ単調増加
- delivered/failed/reconciliation_requiredはterminal
- M01では別のattempt履歴tableを追加しない。M08以降は各attemptを`system_event`へ追記
- no raw prompt/answer/provider payload

#### `recora_private.admin_read_refreshes`

- **Canonical責任:** read refresh metadata
- **作成migration:** 01 `recora_admin_p0_01_common_infrastructure`
- **性質:** append-only runs
- **scope:** global
- **目的:** Records materialized read-model refresh and source watermarks.

**必須field**

- `id`
- `read_model_code`
- `status`
- `source_watermark jsonb`
- `started_at`
- `completed_at nullable`
- `row_count nullable`
- `error_code nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- one running refresh per model
- runningからcompleted/failed/cancelledへのみ遷移可能
- terminal rows immutable

#### `recora_private.admin_customer_profiles`

- **Canonical責任:** customer private profile/control
- **作成migration:** 04 `recora_admin_p0_04_customer_project_inquiry`
- **性質:** mutable current
- **scope:** organization
- **目的:** Private contact and customer access control joined to public.organizations.

**必須field**

- `organization_id uuid PK`
- `primary_contact_name text nullable`
- `primary_contact_email text nullable`
- `access_control text`
- `blocked_incident_id uuid nullable`
- `row_version`
- `last_command_receipt_id`
- `created_at`
- `updated_at`

**重要constraint**

- access_control enabled/suspended_by_admin/blocked_by_system
- system block requires incident
- no customer lifecycle display status

#### `recora_private.admin_project_states`

- **Canonical責任:** project operational state
- **作成migration:** 04 `recora_admin_p0_04_customer_project_inquiry`
- **性質:** mutable current
- **scope:** organization+project
- **目的:** Canonical lifecycle, automation and publication controls.

**必須field**

- `project_id uuid PK`
- `organization_id uuid`
- `lifecycle_status text`
- `automation_control text`
- `publication_control_state text`
- `active_configuration_revision_id uuid nullable`
- `row_version`
- `last_command_receipt_id`
- `created_at`
- `updated_at`

**重要constraint**

- lifecycle setup_in_progress/active/closed
- automation running/paused_by_admin/blocked_by_system
- publication enabled/paused_by_admin/blocked_by_system
- closed terminal
- one row per project

#### `recora_private.admin_customer_inquiries`

- **Canonical責任:** customer_inquiry
- **作成migration:** 04 `recora_admin_p0_04_customer_project_inquiry`
- **性質:** mutable current
- **scope:** organization+optional project
- **目的:** Customer support inquiry received from customer settings.

**必須field**

- `id`
- `organization_id`
- `project_id nullable`
- `status text`
- `subject text`
- `body text`
- `received_at`
- `assigned_admin_account_id nullable`
- `notification_state text`
- `resolved_at nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- status new/in_progress/resolved
- project must belong to organization
- resolved requires resolution note
- body never copied to audit summaries

#### `recora_private.admin_customer_inquiry_notes`

- **Canonical責任:** customer_inquiry_note
- **作成migration:** 04 `recora_admin_p0_04_customer_project_inquiry`
- **性質:** append-only
- **scope:** organization+optional project
- **目的:** Internal, resolution, correction and reopen notes.

**必須field**

- `id`
- `inquiry_id`
- `organization_id`
- `project_id nullable`
- `note_type text`
- `body text`
- `author_admin_account_id`
- `created_at`
- `correlation_id`

**重要constraint**

- note_type internal/resolution/correction/reopen_reason
- append-only
- scope matches inquiry

#### `recora_private.admin_plan_definitions`

- **Canonical責任:** plan catalog
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** immutable seeded catalog
- **scope:** global
- **目的:** Registered plan codes; P0 cannot create new plan families in UI.

**必須field**

- `id`
- `plan_code text UNIQUE`
- `display_name text`
- `created_at`

**重要constraint**

- seeded/controlled only

#### `recora_private.admin_plan_versions`

- **Canonical責任:** plan_version
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** draft mutable then immutable
- **scope:** global
- **目的:** Administrative lifecycle for standard plan versions.

**必須field**

- `id`
- `plan_definition_id`
- `plan_code text`
- `version_number int`
- `status text`
- `display_name text`
- `project_limit int`
- `customer_user_limit int`
- `prompt_count_tier int`
- `daily_measurement_enabled boolean`
- `policy_document jsonb`
- `policy_hash text`
- `plan_policy_version_id nullable`
- `created_by_admin_account_id`
- `ready_at nullable`
- `activated_at nullable`
- `superseded_at nullable`
- `cancelled_at nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- status draft/ready/active/superseded/cancelled
- prompt tier 50/100/200
- UNIQUE(plan_definition_id,version_number)
- one active version per plan
- active content immutable

#### `recora_private.admin_plan_version_ai_models`

- **Canonical責任:** plan_version_ai_model
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** draft mutable then immutable
- **scope:** global
- **目的:** Allowed AI models for one plan version.

**必須field**

- `id uuid PK`
- `plan_version_id`
- `ai_model_id`
- `ordinal int`
- `created_at`

**重要constraint**

- PK(plan_version_id,ai_model_id)
- at least one model before ready
- cannot change after plan leaves draft

#### `recora_private.admin_contract_versions`

- **Canonical責任:** contract_version
- **作成migration:** 06 `recora_admin_p0_06_contract_entitlement_bridge`
- **性質:** draft mutable then immutable
- **scope:** organization
- **目的:** Versioned contract content linked to P4 contract projection.

**必須field**

- `id`
- `contract_id uuid`
- `organization_id`
- `version_number int`
- `status text`
- `plan_version_id`
- `terms_document jsonb`
- `content_hash text`
- `scheduled_for nullable`
- `effective_from nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- status draft/scheduled/active/superseded/cancelled
- UNIQUE(contract_id,version_number)
- one active and one scheduled per contract
- scheduled/active/superseded immutable

#### `recora_private.admin_project_entitlements`

- **Canonical責任:** project_entitlement
- **作成migration:** 06 `recora_admin_p0_06_contract_entitlement_bridge`
- **性質:** stateful immutable content
- **scope:** organization+project
- **目的:** Business entitlement assignment referencing an immutable entitlement snapshot.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `contract_id`
- `contract_version_id`
- `entitlement_snapshot_id`
- `status text`
- `prompt_count_tier int`
- `effective_from`
- `effective_until nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- status scheduled/active/suspended/expired/revoked
- one active entitlement per project
- prompt tier 50/100/200
- snapshot scope exact
- activation updates current_entitlement_snapshots atomically

#### `recora_private.admin_notification_categories`

- **Canonical責任:** notification category catalog
- **作成migration:** 03 `recora_admin_p0_03_static_catalogs`
- **性質:** immutable seeded catalog
- **scope:** global
- **目的:** Eight fixed notification categories.

**必須field**

- `id`
- `category_code UNIQUE`
- `display_name`
- `created_at`

**重要constraint**

- fixed catalog

#### `recora_private.admin_notification_destinations`

- **Canonical責任:** notification_destination
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** mutable current
- **scope:** global
- **目的:** Verified internal email destination.

**必須field**

- `id`
- `channel_type text`
- `address text`
- `normalized_address text generated`
- `display_name`
- `status text`
- `minimum_severity text`
- `verified_at nullable`
- `last_test_requested_at nullable`
- `last_test_result_code nullable`
- `created_by_admin_account_id`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- channel_type=email
- status pending_verification/active/paused/invalid/revoked
- address cannot change after creation
- revoked terminal

#### `recora_private.admin_notification_destination_categories`

- **Canonical責任:** notification subscriptions
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** mutable relation
- **scope:** global
- **目的:** Category subscriptions for a destination.

**必須field**

- `destination_id`
- `category_id`
- `enabled boolean`
- `updated_at`

**重要constraint**

- PK(destination_id,category_id)

#### `recora_private.admin_daily_automation_configurations`

- **Canonical責任:** daily_automation_configuration
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** mutable singleton/current
- **scope:** global
- **目的:** Current control and active-version pointer for daily automation.

**必須field**

- `id singleton`
- `control_state text`
- `control_origin text`
- `control_reason_code nullable`
- `incident_id nullable`
- `active_version_id uuid nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- exactly one row
- control enabled/paused_by_admin/blocked_by_system
- origin planned_admin/incident_safety/system_policy
- system block requires incident

#### `recora_private.admin_daily_automation_configuration_versions`

- **Canonical責任:** daily_automation_configuration_version
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** draft mutable then immutable
- **scope:** global
- **目的:** Versioned daily start time.

**必須field**

- `id`
- `version_number int`
- `status text`
- `business_timezone text`
- `daily_start_local_time time`
- `created_by_admin_account_id`
- `ready_at nullable`
- `activated_at nullable`
- `superseded_at nullable`
- `cancelled_at nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- timezone Asia/Tokyo
- frequency daily
- status draft/ready/active/superseded/cancelled
- one active
- non-draft immutable

#### `recora_private.admin_ai_model_controls`

- **Canonical責任:** ai_model_control
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** mutable current
- **scope:** global
- **目的:** Planned/system safety control for each AI model.

**必須field**

- `id uuid PK`
- `ai_model_id uuid UNIQUE`
- `control_state text`
- `control_origin text`
- `restriction_reason_code nullable`
- `incident_id nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- control enabled/restricted/paused
- origin planned_admin/incident_safety/system_policy
- incident_safety release requires clearance

#### `recora_private.admin_scheduled_configuration_changes`

- **Canonical責任:** scheduled_configuration_change
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** mutable current to terminal
- **scope:** global
- **目的:** Applies daily configuration or plan version at an immediate/future time.

**必須field**

- `id`
- `change_type text`
- `target_domain_key text`
- `target_daily_automation_configuration_version_id nullable`
- `target_plan_version_id nullable`
- `expected_daily_automation_configuration_version_id nullable`
- `expected_plan_version_id nullable`
- `effective_at`
- `status text`
- `requested_by_admin_account_id`
- `request_reason text`
- `retry_of_change_id nullable`
- `failure_code nullable`
- `failure_summary nullable`
- `started_at nullable`
- `completed_at nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- change type daily_automation_configuration_version_activation/plan_version_activation
- status scheduled/applying/applied/failed/cancelled
- exactly one target and expected-active FK pair by change_type
- terminal not reopened
- one nonterminal change per target_domain_key

#### `recora_private.admin_quality_rule_versions`

- **Canonical責任:** quality_rule_version
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** append-only/system-managed
- **scope:** global
- **目的:** Immutable quality rule package.

**必須field**

- `id`
- `version_code UNIQUE`
- `status text`
- `schema_version int`
- `rule_document jsonb`
- `document_hash`
- `compatibility_code`
- `effective_from`
- `status_changed_at`
- `row_version`
- `created_at`

**重要constraint**

- status active/superseded/retired
- one active
- immutable

#### `recora_private.admin_publication_rule_versions`

- **Canonical責任:** publication_rule_version
- **作成migration:** 05 `recora_admin_p0_05_settings_core`
- **性質:** append-only/system-managed
- **scope:** global
- **目的:** Immutable publication safety rule package.

**必須field**

- `id`
- `version_code UNIQUE`
- `status text`
- `schema_version int`
- `rule_document jsonb`
- `document_hash`
- `compatibility_code`
- `effective_from`
- `status_changed_at`
- `row_version`
- `created_at`

**重要constraint**

- status active/superseded/retired
- one active
- immutable

#### `recora_private.admin_project_configuration_revisions`

- **Canonical責任:** project_configuration_revision
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** building mutable then immutable
- **scope:** organization+project
- **目的:** Immutable measurement/setup input snapshot plus accepted artifact pointers.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `revision_number`
- `base_revision_id nullable`
- `status text`
- `target_site_url`
- `target_brand_name`
- `target_region`
- `language`
- `prompt_count_tier`
- `contract_version_id`
- `project_entitlement_id`
- `ai_model_selection_version`
- `input_hash`
- `site_analysis_snapshot_id nullable`
- `category_set_id nullable`
- `competitor_set_id nullable`
- `persona_topic_set_id nullable`
- `prompt_set_id nullable`
- `row_version`
- `created_at`
- `updated_at`
- `activated_at nullable`

**重要constraint**

- status building/quality_checking/ready/active/superseded/invalid
- UNIQUE(project_id,revision_number)
- one active and one nonterminal per project
- content frozen after quality_checking

#### `recora_private.admin_project_configuration_ai_models`

- **Canonical責任:** configuration AI model snapshot
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only per revision
- **scope:** organization+project
- **目的:** Selected AI models pinned by configuration revision.

**必須field**

- `configuration_revision_id`
- `organization_id`
- `project_id`
- `ai_model_id`
- `ordinal`
- `created_at`

**重要constraint**

- PK(configuration_revision_id,ai_model_id)
- same revision scope
- immutable

#### `recora_private.admin_project_setup_runs`

- **Canonical責任:** project_setup_run
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** mutable current to terminal
- **scope:** organization+project
- **目的:** One setup/reconfiguration execution.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `configuration_revision_id`
- `run_number`
- `run_kind text`
- `status text`
- `current_stage text`
- `started_at nullable`
- `completed_at nullable`
- `error_code nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- status queued/running/quality_checking/completed/exception/cancelled
- stage allowlist
- UNIQUE(configuration_revision_id,run_number)
- terminal not reopened

#### `recora_private.admin_site_analysis_snapshots`

- **Canonical責任:** site_analysis_snapshot
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Immutable analyzed-site summary and source digest.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `setup_run_id`
- `source_url`
- `summary_document jsonb`
- `source_digest`
- `captured_at`
- `created_at`

**重要constraint**

- append-only
- no raw HTML/cookies/authorization data

#### `recora_private.admin_site_analysis_evidence`

- **Canonical責任:** site analysis evidence
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Evidence segments for description, heading and body.

**必須field**

- `id`
- `site_analysis_snapshot_id`
- `organization_id`
- `project_id`
- `evidence_type text`
- `source_url`
- `locator text nullable`
- `excerpt text`
- `content_hash`
- `ordinal`
- `created_at`

**重要constraint**

- evidence_type meta_description/heading/body
- excerpt bounded
- no raw page body

#### `recora_private.admin_category_sets`

- **Canonical責任:** category_set
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Immutable generated category set header.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `setup_run_id`
- `set_number`
- `document_hash`
- `item_count`
- `created_at`

**重要constraint**

- UNIQUE(project_id,set_number)
- append-only

#### `recora_private.admin_category_set_items`

- **Canonical責任:** category set item
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Normalized categories in one set.

**必須field**

- `id`
- `category_set_id`
- `category_code`
- `display_name`
- `confidence numeric`
- `ordinal`
- `evidence_reference jsonb`
- `created_at`

**重要constraint**

- UNIQUE(category_set_id,category_code)
- immutable

#### `recora_private.admin_competitor_sets`

- **Canonical責任:** competitor_set
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Immutable generated competitor candidate set header.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `setup_run_id`
- `set_number`
- `expected_count int`
- `actual_count int`
- `document_hash`
- `created_at`

**重要constraint**

- expected_count=12 for completed setup
- UNIQUE(project_id,set_number)
- append-only

#### `recora_private.admin_competitor_set_items`

- **Canonical責任:** competitor candidate
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Ranked competitor candidates.

**必須field**

- `id`
- `competitor_set_id`
- `rank int`
- `name`
- `domain nullable`
- `reason_summary`
- `confidence numeric`
- `created_at`

**重要constraint**

- UNIQUE(competitor_set_id,rank)
- rank 1..12
- immutable

#### `recora_private.admin_persona_topic_sets`

- **Canonical責任:** persona_topic_set
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Immutable persona/topic generation set header.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `setup_run_id`
- `set_number`
- `document_hash`
- `created_at`

**重要constraint**

- UNIQUE(project_id,set_number)
- append-only

#### `recora_private.admin_persona_topic_personas`

- **Canonical責任:** persona artifact
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Generated personas in one set.

**必須field**

- `id`
- `persona_topic_set_id`
- `persona_key`
- `display_name`
- `description`
- `ordinal`
- `created_at`

**重要constraint**

- UNIQUE(persona_topic_set_id,persona_key)
- immutable

#### `recora_private.admin_persona_topic_topics`

- **Canonical責任:** topic artifact
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Generated topics in one set.

**必須field**

- `id`
- `persona_topic_set_id`
- `topic_key`
- `display_name`
- `description`
- `ordinal`
- `created_at`

**重要constraint**

- UNIQUE(persona_topic_set_id,topic_key)
- immutable

#### `recora_private.admin_prompt_sets`

- **Canonical責任:** prompt_set
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Immutable prompt set header for 50/100/200 prompts.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `setup_run_id`
- `set_number`
- `prompt_count_tier`
- `actual_count`
- `document_hash`
- `created_at`

**重要constraint**

- prompt_count_tier 50/100/200
- actual_count equals tier when complete
- UNIQUE(project_id,set_number)
- append-only

#### `recora_private.admin_prompt_set_items`

- **Canonical責任:** prompt set item
- **作成migration:** 07 `recora_admin_p0_07_setup_configuration_artifacts`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Immutable prompt text and taxonomy used to materialize active public prompts.

**必須field**

- `id`
- `prompt_set_id`
- `prompt_key`
- `prompt_text`
- `prompt_type`
- `persona_key nullable`
- `topic_key nullable`
- `buyer_stage nullable`
- `language`
- `region`
- `ordinal`
- `eligibility_document jsonb`
- `text_hash`
- `created_at`

**重要constraint**

- UNIQUE(prompt_set_id,prompt_key)
- UNIQUE(prompt_set_id,ordinal)
- immutable
- prompt text never copied to audit/system events

#### `recora_private.admin_incidents`

- **Canonical責任:** incident
- **作成migration:** 08 `recora_admin_p0_08_incident_event_core`
- **性質:** mutable current to terminal
- **scope:** global/organization/project
- **目的:** Common-cause operational incident.

**必須field**

- `id`
- `incident_key text UNIQUE`
- `incident_fingerprint text`
- `recurrence_of_incident_id nullable`
- `status text`
- `severity text`
- `title`
- `summary`
- `owner_admin_account_id nullable`
- `resolution_code nullable`
- `resolution_summary nullable`
- `opened_at`
- `resolved_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- status open/mitigating/monitoring/resolved
- severity critical/high/medium/low
- one unresolved fingerprint
- resolved terminal
- resolution requirements

#### `recora_private.admin_incident_scopes`

- **Canonical責任:** incident_scope
- **作成migration:** 08 `recora_admin_p0_08_incident_event_core`
- **性質:** mutable impact projection
- **scope:** typed scope
- **目的:** Affected/potential scope for an incident.

**必須field**

- `id`
- `incident_id`
- `scope_type text`
- `organization_id/project_id nullable`
- `daily_target_run_id/cycle_id/batch_id/publication_operation_id nullable`
- `component_code/ai_model_id nullable`
- `impact_kind text`
- `impact_state text`
- `evidence_summary jsonb`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- impact potential/confirmed/contained/recovering/recovered/not_affected
- exact target columns by scope
- NULL-safe unique logical scope

#### `recora_private.admin_system_events`

- **Canonical責任:** system_event
- **作成migration:** 08 `recora_admin_p0_08_incident_event_core`
- **性質:** append-only
- **scope:** global/organization/project
- **目的:** Immutable system processing/security/delivery/cost events.

**必須field**

- `id`
- `producer_component_code`
- `producer_event_id`
- `event_class text`
- `event_level text`
- `event_code`
- `organization_id/project_id nullable`
- `target_type/id nullable`
- `incident_id nullable`
- `correlation_id`
- `request_id nullable`
- `safe_summary jsonb`
- `occurred_at`
- `recorded_at`

**重要constraint**

- UNIQUE(producer_component_code,producer_event_id)
- append-only
- safe summary contract
- event level distinct from incident severity

#### `recora_private.admin_system_component_states`

- **Canonical責任:** system_component_state
- **作成migration:** 08 `recora_admin_p0_08_incident_event_core`
- **性質:** mutable current observation
- **scope:** global/instance
- **目的:** Latest component health observation.

**必須field**

- `id`
- `component_code`
- `component_instance_key`
- `health_state text`
- `observed_at`
- `fresh_until`
- `source_event_id`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- health operational/degraded/unavailable/unknown
- UNIQUE(component_code,component_instance_key)
- older observation cannot overwrite newer

#### `recora_private.admin_daily_target_evaluation_runs`

- **Canonical責任:** daily_target_evaluation_run
- **作成migration:** 09 `recora_admin_p0_09_daily_targeting`
- **性質:** mutable current to terminal
- **scope:** global
- **目的:** One official daily population evaluation.

**必須field**

- `id`
- `business_date date`
- `daily_automation_configuration_version_id`
- `status text`
- `scheduled_at`
- `started_at nullable`
- `population_snapshot_at nullable`
- `completed_at nullable`
- `failure_reason_code nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(business_date)
- status scheduled/snapshotting/evaluating/completed/failed/skipped_by_control
- failed may retry on the same row
- completed/skipped_by_control are terminal

#### `recora_private.admin_daily_target_decisions`

- **Canonical責任:** daily_target_decision
- **作成migration:** 09 `recora_admin_p0_09_daily_targeting`
- **性質:** mutable until finalized
- **scope:** organization+project
- **目的:** One project/day target decision.

**必須field**

- `id`
- `evaluation_run_id nullable`
- `organization_id`
- `project_id`
- `business_date`
- `evaluation_status text`
- `decision_source text`
- `decision text nullable`
- `reason_code nullable`
- `contract_id nullable`
- `contract_version_id nullable`
- `project_entitlement_id nullable`
- `configuration_revision_id nullable`
- `finalized_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(project_id,business_date)
- evaluation pending/evaluating/finalized/failed
- source scheduled_daily/project_activation
- decision eligible/intentionally_excluded/precheck_exception
- activation source may omit run

#### `recora_private.admin_measurement_cycles`

- **Canonical責任:** measurement_cycle
- **作成migration:** 10 `recora_admin_p0_10_measurement_execution`
- **性質:** mutable current
- **scope:** organization+project
- **目的:** Formal daily or additional-validation workflow container.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `business_date`
- `purpose text`
- `trigger_source text`
- `daily_target_decision_id nullable`
- `configuration_revision_id`
- `contract_version_id`
- `project_entitlement_id`
- `status text`
- `current_stage text`
- `current_revision_id nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`
- `completed_at nullable`

**重要constraint**

- purpose formal_daily/additional_validation
- trigger scheduler/admin/incident_recovery
- status planned/running/exception/completed/stopped
- formal UNIQUE(project_id,business_date)
- current revision same cycle+finalized

#### `recora_private.admin_measurement_items`

- **Canonical責任:** measurement_item
- **作成migration:** 10 `recora_admin_p0_10_measurement_execution`
- **性質:** mutable execution summary
- **scope:** organization+project
- **目的:** Logical prompt×model×language×region item.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `measurement_cycle_id`
- `logical_item_key`
- `prompt_set_item_id nullable`
- `public_prompt_id nullable`
- `ai_model_id`
- `language`
- `region`
- `measurement_mode`
- `is_required boolean`
- `ordinal`
- `status text`
- `reason_code nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(cycle,logical_item_key)
- status pending/running/succeeded/failed/excluded/cancelled
- no selected_attempt_id

#### `recora_private.admin_measurement_batches`

- **Canonical責任:** measurement_batch
- **作成migration:** 10 `recora_admin_p0_10_measurement_execution`
- **性質:** mutable current to terminal
- **scope:** multi-scope
- **目的:** Execution batch that can span projects/cycles.

**必須field**

- `id`
- `batch_type text`
- `status text`
- `parent_batch_id nullable`
- `trigger_source text`
- `quality_exception_action_id nullable`
- `incident_recovery_plan_id nullable`
- `requested_command_receipt_id nullable`
- `queued_at`
- `started_at nullable`
- `finished_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- type scheduled_daily/manual_formal/additional_validation/retry_failed_items/incident_recovery
- status queued/running/pausing/paused/stopping/completed/failed/stopped
- terminal not restarted

#### `recora_private.admin_batch_item_assignments`

- **Canonical責任:** batch_item_assignment
- **作成migration:** 10 `recora_admin_p0_10_measurement_execution`
- **性質:** mutable current to terminal
- **scope:** organization+project
- **目的:** Assignment of one logical item to a batch.

**必須field**

- `id`
- `measurement_batch_id`
- `measurement_item_id`
- `organization_id`
- `project_id`
- `status text`
- `attempt_budget int`
- `claim_token_hash nullable`
- `worker_reference nullable`
- `queued_at`
- `started_at nullable`
- `finished_at nullable`
- `last_error_code nullable`
- `row_version`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(batch,item)
- one nonterminal assignment per item across batches
- status queued/running/retry_wait/succeeded/failed/cancelled

#### `recora_private.admin_measurement_attempts`

- **Canonical責任:** measurement_attempt
- **作成migration:** 10 `recora_admin_p0_10_measurement_execution`
- **性質:** mutable until terminal then immutable
- **scope:** organization+project
- **目的:** One provider execution attempt.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `measurement_item_id`
- `assignment_id`
- `attempt_number int`
- `attempt_kind text`
- `status text`
- `reason_code nullable`
- `configuration_revision_id`
- `prompt_set_item_id nullable`
- `ai_model_id`
- `language`
- `region`
- `source_invocation_key`
- `public_run_item_id nullable`
- `ai_conversation_id nullable`
- `started_at nullable`
- `completed_at nullable`
- `latency_ms nullable`
- `error_code nullable`
- `late_result_received_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(item,attempt_number)
- kind initial/automatic_retry/manual_retry/incident_recovery
- status queued/running/succeeded/failed/timed_out/cancelled
- terminal result never changed

#### `recora_private.admin_measurement_cycle_revisions`

- **Canonical責任:** measurement_cycle_revision
- **作成migration:** 10 `recora_admin_p0_10_measurement_execution`
- **性質:** building mutable then immutable
- **scope:** organization+project
- **目的:** Integrated/analysed result revision.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `measurement_cycle_id`
- `revision_number int`
- `status text`
- `build_reason_code`
- `analysis_method_version`
- `result_digest`
- `metrics_digest nullable`
- `recommendations_digest nullable`
- `started_at`
- `finalized_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(cycle,revision_number)
- one building per cycle
- status building/finalized/failed/superseded
- finalized content immutable

#### `recora_private.admin_measurement_cycle_revision_items`

- **Canonical責任:** measurement_cycle_revision_item
- **作成migration:** 10 `recora_admin_p0_10_measurement_execution`
- **性質:** append-only
- **scope:** organization+project
- **目的:** Selected attempt mapping for one finalized cycle revision.

**必須field**

- `measurement_cycle_revision_id`
- `measurement_item_id`
- `selected_attempt_id`
- `selection_reason_code`
- `result_digest`
- `created_at`

**重要constraint**

- PK(revision,item)
- selected succeeded attempt belongs to item
- created only in finalize transaction
- append-only

#### `recora_private.admin_publication_candidate_generation_runs`

- **Canonical責任:** publication_candidate_generation_run
- **作成migration:** 11 `recora_admin_p0_11_publication_candidate`
- **性質:** mutable to terminal
- **scope:** organization+project
- **目的:** One immutable-input candidate generation execution.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `measurement_cycle_id`
- `measurement_cycle_revision_id`
- `project_configuration_revision_id`
- `trigger_source text`
- `generation_reason text`
- `run_number`
- `status text`
- `quality_rule_version_id`
- `publication_rule_version_id`
- `render_schema_version`
- `candidate_id nullable`
- `retry_of_run_id nullable`
- `failure_code nullable`
- `started_at nullable`
- `completed_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(cycle,run_number)
- UNIQUE(generation_run_id) on candidate
- one nonterminal run per project
- status queued/running/completed/failed/cancelled
- trigger cycle_completion/quality_action/publication_operator/system_recovery
- reason canonical seven values
- formal cycle only

#### `recora_private.admin_publication_candidates`

- **Canonical責任:** publication_candidate
- **作成migration:** 11 `recora_admin_p0_11_publication_candidate`
- **性質:** immutable payload + mutable lifecycle
- **scope:** organization+project
- **目的:** Generated customer-display candidate Generation.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `measurement_cycle_id`
- `generation_run_id`
- `source_cycle_revision_id`
- `source_configuration_revision_id`
- `generation_number`
- `project_generation_number`
- `status text`
- `hold_origin nullable`
- `hold_reason_code nullable`
- `quality_rule_version_id`
- `publication_rule_version_id`
- `payload_schema_version`
- `payload jsonb`
- `section_manifest jsonb`
- `payload_hash`
- `row_version`
- `generated_at`
- `consumed_at nullable`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(project,cycle,generation_number)
- UNIQUE(project,project_generation_number)
- status generated/checking/ready/held/invalidated/superseded/consumed
- payload immutable
- only latest project generation publishable

#### `recora_private.admin_quality_check_runs`

- **Canonical責任:** quality_check_run
- **作成migration:** 12 `recora_admin_p0_12_quality_exception`
- **性質:** mutable to terminal
- **scope:** organization+project
- **目的:** Automatic check of a configuration revision or publication candidate.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `check_scope text`
- `configuration_revision_id nullable`
- `publication_candidate_id nullable`
- `subject_type`
- `subject_id`
- `run_number`
- `status text`
- `quality_rule_version_id`
- `input_digest`
- `engine_version`
- `started_at nullable`
- `completed_at nullable`
- `warning_count`
- `blocking_finding_count`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- scope setup_configuration/publication_candidate
- exactly one subject
- UNIQUE(subject_type,subject_id,run_number)
- one queued/running per subject
- status queued/running/passed/passed_with_warnings/exception/failed/cancelled

#### `recora_private.admin_quality_exception_cases`

- **Canonical責任:** quality_exception_case
- **作成migration:** 12 `recora_admin_p0_12_quality_exception`
- **性質:** mutable current to terminal
- **scope:** organization+project
- **目的:** Human/system work unit for a stable quality subject.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `case_type text`
- `stable_subject_type`
- `stable_subject_id`
- `normalized_section_key`
- `rule_code`
- `deduplication_key`
- `incident_id nullable`
- `contract_version_id nullable`
- `configuration_revision_id nullable`
- `measurement_batch_id nullable`
- `ai_model_id nullable`
- `status text`
- `assignee_admin_account_id nullable`
- `row_version`
- `opened_at`
- `resolved_at nullable`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- case type setup/measurement/analysis/metric/customer_display/recommendation/contract_publication
- status open/in_progress/reprocessing/resolved
- UNIQUE(project,deduplication_key) WHERE unresolved
- resolved terminal
- severity derived

#### `recora_private.admin_quality_exception_findings`

- **Canonical責任:** quality_exception_finding
- **作成migration:** 12 `recora_admin_p0_12_quality_exception`
- **性質:** append fact + system disposition
- **scope:** organization+project
- **目的:** Specific detected rule/evidence fact.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `quality_case_id nullable`
- `quality_check_run_id`
- `rule_code`
- `severity text`
- `blocking_scope text`
- `status text`
- `source_entity_type`
- `source_entity_id`
- `evidence_summary jsonb`
- `policy_snapshot jsonb`
- `detected_at`
- `status_changed_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- severity critical/high/medium/low
- blocking candidate_generation/publication/optional_section/none
- status open/cleared/accepted_with_note/superseded
- no admin direct-status command
- critical requires incident/correlation

#### `recora_private.admin_quality_exception_actions`

- **Canonical責任:** quality_exception_action
- **作成migration:** 12 `recora_admin_p0_12_quality_exception`
- **性質:** mutable to terminal
- **scope:** organization+project
- **目的:** Requested reprocessing connected to one case.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `quality_case_id`
- `action_type text`
- `action_mode nullable`
- `parameter_snapshot jsonb`
- `status text`
- `requested_by_command_receipt_id nullable`
- `started_at nullable`
- `completed_at nullable`
- `result_reference_type/id nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- action types canonical seven
- status requested/running/completed/failed/cancelled
- one nonterminal action per case
- completed does not resolve case

#### `recora_private.admin_quality_decisions`

- **Canonical責任:** quality_decision
- **作成migration:** 12 `recora_admin_p0_12_quality_exception`
- **性質:** append-only decision with mutable application projection
- **scope:** organization+project
- **目的:** Formal human quality decision.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `quality_case_id`
- `decision_type text`
- `controlled_note_template_code nullable`
- `excluded_section_codes text[] nullable`
- `application_status text`
- `supersedes_decision_id nullable`
- `recorded_by_admin_account_id`
- `recorded_at`
- `applied_at nullable`
- `failure_code nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- decision continue_with_note/exclude_optional_sections/maintain_previous_version/publication_blocked/resolved_no_action
- application recorded/applying/applied/failed/superseded
- decision content append-only

#### `recora_private.admin_publication_versions`

- **Canonical責任:** publication_version
- **作成migration:** 13 `recora_admin_p0_13_publication_delivery`
- **性質:** append-only except revocation projection
- **scope:** organization+project
- **目的:** Immutable customer-delivery version created from one candidate.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `version_number`
- `source_candidate_id`
- `source_cycle_revision_id`
- `publication_rule_version_id`
- `payload_schema_version`
- `payload jsonb`
- `payload_hash`
- `render_schema_version`
- `row_version`
- `created_at`
- `updated_at`
- `revoked_at nullable`
- `revocation_incident_id nullable`

**重要constraint**

- UNIQUE(project,version_number)
- UNIQUE(source_candidate_id)
- payload immutable
- revocation irreversible

#### `recora_private.admin_project_publication_pointers`

- **Canonical責任:** project_publication_pointer
- **作成migration:** 13 `recora_admin_p0_13_publication_delivery`
- **性質:** mutable pointer
- **scope:** organization+project
- **目的:** Only source of the current publication version.

**必須field**

- `project_id uuid PK`
- `organization_id`
- `current_publication_version_id nullable`
- `pointer_version bigint`
- `last_operation_id nullable`
- `row_version`
- `updated_at`
- `created_at`

**重要constraint**

- one row per project
- current version same project
- pointer retained during access/contract/publication stop
- CAS pointer_version

#### `recora_private.admin_publication_operations`

- **Canonical責任:** publication_operation
- **作成migration:** 13 `recora_admin_p0_13_publication_delivery`
- **性質:** mutable workflow to terminal
- **scope:** organization+project
- **目的:** Publish, restore or resume operation.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `operation_type text`
- `status text`
- `current_stage text`
- `target_candidate_id nullable`
- `target_version_id nullable`
- `previous_version_id nullable`
- `expected_pointer_version`
- `retry_of_operation_id nullable`
- `requested_command_receipt_id nullable`
- `started_at nullable`
- `completed_at nullable`
- `failure_code nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- type publish_candidate/restore_version/resume_current_pointer
- status queued/running/completed/rolled_back/failed/cancelled
- one queued/running per project
- terminal not reopened

#### `recora_private.admin_publication_delivery_verifications`

- **Canonical責任:** publication_delivery_verification
- **作成migration:** 13 `recora_admin_p0_13_publication_delivery`
- **性質:** append-only attempt result
- **scope:** organization+project
- **目的:** Pre/post-switch, rollback and resume verification evidence.

**必須field**

- `id`
- `organization_id`
- `project_id`
- `publication_operation_id`
- `phase text`
- `phase_attempt_number int`
- `status text`
- `expected_project_id`
- `expected_organization_id`
- `expected_version_id nullable`
- `expected_payload_hash nullable`
- `observed_version_id nullable`
- `observed_payload_hash nullable`
- `failure_code nullable`
- `safe_result_summary jsonb`
- `started_at nullable`
- `completed_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(operation,phase,attempt_number)
- phase pre_switch_render/post_switch_route/rollback_confirmation/resume_precheck/post_resume_route
- status pending/running/passed/failed/cancelled
- terminal row immutable and retry creates a new attempt row

#### `recora_private.admin_incident_actions`

- **Canonical責任:** incident_action
- **作成migration:** 14 `recora_admin_p0_14_incident_recovery_clearance`
- **性質:** append-only activity
- **scope:** typed scope
- **目的:** Incident response action log.

**必須field**

- `id`
- `incident_id`
- `action_category text`
- `operation_code text`
- `status text`
- `retry_of_incident_action_id nullable`
- `summary`
- `actor_type`
- `admin_account_id nullable`
- `system_component_code nullable`
- `started_at nullable`
- `completed_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- category investigation/mitigation/safety_control/recovery/verification/communication/annotation
- status requested/running/completed/failed/cancelled
- terminal action not reopened; retry creates a new action
- operation_code allowlist
- bounded safe summary

#### `recora_private.admin_incident_recovery_plans`

- **Canonical責任:** incident_recovery_plan
- **作成migration:** 14 `recora_admin_p0_14_incident_recovery_clearance`
- **性質:** draft mutable then controlled
- **scope:** typed scope
- **目的:** Versioned ordered recovery plan.

**必須field**

- `id`
- `incident_id`
- `plan_version int`
- `status text`
- `plan_document jsonb`
- `content_hash`
- `created_by_admin_account_id nullable`
- `started_at nullable`
- `completed_at nullable`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- status draft/ready/running/verifying/completed/failed/cancelled/superseded
- UNIQUE(incident,plan_version)
- one nonterminal plan
- only draft content editable

#### `recora_private.admin_incident_recovery_steps`

- **Canonical責任:** incident_recovery_step
- **作成migration:** 14 `recora_admin_p0_14_incident_recovery_clearance`
- **性質:** mutable to terminal per attempt
- **scope:** typed scope
- **目的:** Ordered/retried recovery step.

**必須field**

- `id`
- `recovery_plan_id`
- `logical_step_key`
- `step_sequence int`
- `attempt_number int`
- `dependency_step_keys text[]`
- `step_type text`
- `status text`
- `parameter_snapshot jsonb`
- `success_condition jsonb`
- `measurement_batch_id nullable`
- `started_at nullable`
- `completed_at nullable`
- `result_summary jsonb`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(plan,logical_step_key,attempt_number)
- failed retry creates new row
- status pending/queued/running/verifying/completed/failed/skipped/cancelled
- step type canonical nine values

#### `recora_private.admin_incident_recovery_clearances`

- **Canonical責任:** incident_recovery_clearance
- **作成migration:** 14 `recora_admin_p0_14_incident_recovery_clearance`
- **性質:** issued then terminal
- **scope:** typed control target
- **目的:** One-time release authority for a system-blocked control.

**必須field**

- `id`
- `incident_id`
- `recovery_plan_id`
- `source_recovery_step_id`
- `target_control_type`
- `organization_id/project_id/ai_model_id nullable`
- `permitted_from_state`
- `permitted_to_state`
- `expected_target_row_version`
- `status text`
- `evidence_hash`
- `issued_at`
- `expires_at`
- `consumed_at nullable`
- `revoked_at nullable`
- `correlation_id`
- `created_at`

**重要constraint**

- status issued/consumed/revoked/expired
- one issued equivalent transition
- consume and control release same transaction
- target/version/expiry exact

#### `recora_private.admin_pricing_definitions`

- **Canonical責任:** pricing_definition
- **作成migration:** 15 `recora_admin_p0_15_usage_cost`
- **性質:** append-only version lifecycle
- **scope:** global/model
- **目的:** Internal variable-cost rate definition.

**必須field**

- `id`
- `pricing_key`
- `provider_code`
- `ai_model_id nullable`
- `service_tier_code nullable`
- `usage_unit_code`
- `unit_size numeric`
- `rate_amount numeric`
- `currency_code`
- `rate_confidence text`
- `application_status text`
- `effective_from`
- `effective_to nullable`
- `source_reference`
- `version_number`
- `supersedes_pricing_definition_id nullable`
- `row_version`
- `created_at`
- `updated_at`
- `activated_at nullable`

**重要constraint**

- status scheduled/active/superseded/cancelled/invalid
- confidence estimated/provisional/final
- UNIQUE(pricing_key,version_number)
- active/scheduled effective ranges non-overlap
- immutable after activation

#### `recora_private.admin_usage_records`

- **Canonical責任:** usage_record
- **作成migration:** 15 `recora_admin_p0_15_usage_cost`
- **性質:** append-only
- **scope:** global/organization/project
- **目的:** One usage component from one provider invocation.

**必須field**

- `id`
- `usage_event_key`
- `usage_component_code`
- `provider_code`
- `provider_usage_event_id nullable`
- `source_invocation_key`
- `source_entity_type`
- `source_entity_id`
- `organization_id/project_id/ai_model_id nullable`
- `service_tier_code nullable`
- `usage_unit_code`
- `usage_quantity numeric nullable`
- `usage_capture_status text`
- `unavailable_reason_code nullable`
- `occurred_at`
- `cost_incurred_date`
- `business_date`
- `workload_category text`
- `cycle_purpose nullable`
- `attempt_reason_category text`
- `measurement_cycle_id/batch_id/item_id/attempt_id nullable`
- `incident_id nullable`
- `correction_of_usage_record_id nullable`
- `recorded_at`
- `correlation_id`

**重要constraint**

- capture reported/derived/unavailable
- unavailable quantity NULL + reason
- provider event/component or invocation/component uniqueness
- append-only
- correction chain acyclic

#### `recora_private.admin_cost_calculation_runs`

- **Canonical責任:** cost_calculation_run
- **作成migration:** 15 `recora_admin_p0_15_usage_cost`
- **性質:** mutable to terminal
- **scope:** global
- **目的:** One bounded cost calculation execution.

**必須field**

- `id`
- `status text`
- `calculator_version`
- `pricing_watermark`
- `usage_watermark`
- `retry_of_run_id nullable`
- `requested_at`
- `started_at nullable`
- `completed_at nullable`
- `record_count`
- `uncomputed_count`
- `row_version`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- status queued/running/completed/completed_with_uncomputed/failed/cancelled
- terminal not reopened

#### `recora_private.admin_cost_records`

- **Canonical責任:** cost_record
- **作成migration:** 15 `recora_admin_p0_15_usage_cost`
- **性質:** append-only
- **scope:** global/organization/project
- **目的:** One immutable calculation version for one usage record.

**必須field**

- `id`
- `usage_record_id`
- `cost_calculation_run_id`
- `calculation_version int`
- `calculation_status text`
- `cost_amount numeric nullable`
- `currency_code`
- `pricing_definition_id nullable`
- `quantity_used numeric nullable`
- `unit_size numeric nullable`
- `rate_amount numeric nullable`
- `calculation_method_version`
- `uncomputed_reason_code nullable`
- `supersedes_cost_record_id nullable`
- `calculated_at`
- `cost_incurred_date`
- `business_date`
- `organization_id/project_id nullable`
- `correlation_id`

**重要constraint**

- status uncomputed/estimated/provisional/final
- UNIQUE(usage,calculation_version)
- UNIQUE(run,usage)
- uncomputed amount NULL + reason
- append-only

#### `recora_private.admin_usage_cost_export_jobs`

- **Canonical責任:** usage_cost_export_job
- **作成migration:** 15 `recora_admin_p0_15_usage_cost`
- **性質:** mutable to terminal
- **scope:** admin effective scope
- **目的:** Asynchronous CSV export with a fixed read snapshot.

**必須field**

- `id`
- `requested_by_admin_account_id`
- `idempotency_key`
- `effective_scope_document jsonb`
- `filter_document jsonb`
- `date_axis text`
- `read_snapshot_id uuid`
- `usage_watermark`
- `cost_watermark`
- `current_revision_watermark`
- `schema_version`
- `status text`
- `artifact_reference nullable`
- `artifact_checksum nullable`
- `artifact_expires_at nullable`
- `row_version`
- `requested_at`
- `completed_at nullable`
- `correlation_id`
- `created_at`
- `updated_at`

**重要constraint**

- UNIQUE(requested_admin,idempotency_key)
- status queued/running/completed/failed/expired/cancelled
- terminal not reopened
- artifact contains no prompt/answer/raw provider payload

## 7. Cross-domain原子transaction


次の処理は、複数tableをまたいでも1transactionで確定する。

| 処理 | 同時に確定するもの |
|---|---|
| 顧客作成 | `public.organizations`、`admin_customer_profiles`、audit、command receipt |
| project作成 | `public.projects`、`admin_project_states`、`admin_project_entitlements`、building configuration、queued setup run |
| 契約version適用 | P4 contract projection/event、contract version、project entitlement、entitlement snapshot pointer、audit/event |
| configuration active化 | 新revision active、旧revision superseded、project active pointer、初回ならproject lifecycle active |
| cycle revision finalize | revision item mapping、revision finalized、cycle current revision pointer、旧revision superseded |
| candidate生成完了 | new candidate insert、project generation採番、旧未消費candidate supersede、generation run completed |
| 公開commit | publication version、candidate consumed、publication pointer切替 |
| rollback | pointerをprevious versionまたはNULLへ戻し、operation stageをrollback verificationへ進める |
| clearance解除 | clearance consumed、target control release、audit、system event |
| cost算定run完了 | immutable cost rowsの整合確認、run terminal化 |
| role revoke | role assignmentとactive scope assignmentsの同時revoke |

## 8. 必須partial unique・exclusion constraint

- one active admin role assignment per admin+role
- one active equivalent scope per role assignment
- one active and one scheduled contract version per contract
- one active project entitlement per project
- one active and one building/quality_checking/ready configuration revision per project
- one daily target evaluation run per business_date
- one daily target decision per project+business_date
- one formal_daily cycle per project+business_date
- one building cycle revision per cycle
- one nonterminal batch assignment per measurement item
- one nonterminal candidate generation run per project
- one unresolved quality case per project+deduplication_key
- one queued/running publication operation per project
- one unresolved incident per incident_fingerprint
- one nonterminal recovery plan per incident
- one issued recovery clearance per exact target transition
- pricing active/scheduled effective ranges must not overlap for the same match key

## 9. Index contract


最低限、read model v2.0のindex方向を実装する。特に次を必須とする。

```text
daily_target_decisions(project_id, business_date)
admin_measurement_cycles(project_id, business_date, purpose)
admin_measurement_cycles(status, current_stage, business_date)
admin_measurement_batches(status, updated_at)
admin_quality_check_runs(subject_type, subject_id, run_number DESC)
admin_quality_exception_cases(project_id, status, incident_id)
admin_quality_exception_cases(status, assignee_admin_account_id, updated_at)
admin_publication_candidates(project_id, measurement_cycle_id, generation_number DESC)
admin_publication_operations(project_id, created_at DESC)
admin_incidents(status, severity, updated_at)
admin_incident_scopes(incident_id, project_id)
admin_customer_inquiries(status, received_at DESC)
operator_events(target_type, target_id, occurred_at DESC)
operator_events(organization_id, project_id, occurred_at DESC)
admin_system_events(correlation_id, occurred_at DESC)
admin_usage_records(project_id, business_date, occurred_at)
admin_usage_records(ai_model_id, occurred_at)
admin_cost_records(usage_record_id, calculation_version DESC)
admin_pricing_definitions(provider_code, ai_model_id, service_tier_code, usage_unit_code, effective_from)
```

scope filterを先に適用できるよう、一覧・facet対象には`organization_id`と`project_id`を含むindexを追加する。

## 10. `admin_read` object contract

通常view:

- `admin_read.v_project_current_operational_summary`
- `admin_read.v_customer_admin_summary`
- `admin_read.v_contract_admin_summary`
- `admin_read.v_inquiry_admin_summary`
- `admin_read.v_daily_measurement_status`
- `admin_read.v_measurement_cycle_summary`
- `admin_read.v_measurement_batch_summary`
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


Materialized view:

- `admin_read.mv_usage_cost_daily_summary`


共通規則:

- 全viewは`organization_id`/`project_id`またはglobal scope codeを保持する。
- browser roleへ直接grantしない。
- `v_sidebar_badge`はscope適用後のpredicateを使う。
- `v_timeline_entry`はaudit、system event、状態遷移の代表行を重複排除する。
- `mv_usage_cost_daily_summary`以外をP0で先行materializeしない。
- refresh結果は`admin_read_refreshes`へ記録し、`refreshed_at`とwatermarkを返す。

## 11. RLS・grant・function security


1. `recora_private`、`recora_operator`、`recora_audit`、`admin_read`の新規objectはすべて`PUBLIC`、`anon`、`authenticated`からrevokeする。
2. private tableにもdefense-in-depthとしてRLSを有効化する。
3. browserから管理DBを直接select/updateしない。
4. 管理画面serverは、認証済みadmin identity、capability、role-assignment scope、row state、freshnessを再検査する。
5. `SECURITY DEFINER`が必要なfunctionはprivate schemaへ置き、`SET search_path = ''`、fully qualified name、default EXECUTE revokeを必須にする。
6. generic mutation RPCは作らず、Canonical commandごとの明示的command boundaryを使用する。
7. `service_role`をactorとして保存しない。
8. audit/detail/payloadのsensitive readも監査descriptorを返し、必要な閲覧をauditへ記録する。

## 12. Legacyからの移行規則


### 自動移行してよいもの

- `organizations`、`projects`、`organization_members`の既存正式ID。
- 既存operator identityとaudit evidence。
- 既存plan policy・entitlement snapshot・P4 contract eventの正式履歴。

### 自動移行しないもの

- `recora_admin.plan_configs.config`からのplan/contract推測。
- `customer_subscriptions.entitlement_config`からのentitlement history推測。
- legacy batchからのCanonical cycle/revision再構築。
- `report_publication_reviews`からのpublication candidate/version/pointer推測。
- `operation_events`からのCanonical audit再作成。

必要な既存projectについては、専用bootstrap commandがsource rows、customer/project、contract、current customer dashboard payloadを明示し、audit付きでCanonical初期行を作成する。migration SQLだけで推測しない。

## 13. P0で物理DBへ追加しないもの


- `display_status`、`attention_status`、`operational_status`、`customer_visibility_state`
- `quality_exception_group`
- editable timeline/history
- candidate/version本文の更新API
- 顧客別schedule、週次/月次schedule
- custom admin role editor
- quality/publication rule editor・simulation
- cost adjustment、billing、gross margin、budget、FX
- inquiry chat/email thread
- customer guide CMS

## 14. DB受け入れゲート


物理スキーマ完了は、次をすべて満たした時点とする。

1. fresh local reset（migration-only）成功
2. seeded local reset成功
3. 同一stackへの再play成功
4. tenant A/B、cross-project、scope漏洩negative test成功
5. invalid transition、terminal revival、append-only UPDATE/DELETE拒否
6. idempotency replayとconflictの収束
7. publication version/candidate/pointer transaction rollback証明
8. clearance consume/control releaseの部分成功なし
9. usage dedupe、uncomputed NULL、cost version current導出
10. role/scope/MFA/last platform-admin保護
11. `anon`/`authenticated`から全private object/RPCへの拒否
12. `supabase db advisors --local`で対象issueなし
13. Canonical object/constraint/index/catalog digest一致
14. 旧customer dashboard read pathの回帰なし

本仕様の完成はDB実装完了を意味しない。migration SQL、command service、read view、worker、テストは別工程で実装する。
