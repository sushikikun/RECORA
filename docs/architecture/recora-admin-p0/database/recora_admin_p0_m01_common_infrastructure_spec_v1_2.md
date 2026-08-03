# レコラ管理画面 P0 M01 共通インフラ実装仕様

**文書ID:** RECORA-ADMIN-P0-M01-COMMON-INFRASTRUCTURE
**Version:** 1.5
**日付:** 2026-08-04
**状態:** safe payload fixture契約修正版・再検証待ち
**対象migration stem:** `recora_admin_p0_01_common_infrastructure`

## 0A. v1.5修正内容

M00とCanonical package本文がmasterへ反映されたため、M01実装入力を最新masterへ再固定した。

1. M01実装開始baselineを`49fd9007a4e93f80285660cf1f9e98c115d60a30`へ更新する。
2. M00 pinのrepository evidence `2c2a6fba70b75e858abc71a7447840bf32f3507d`は変更しない。
3. Canonical・physical manifestの検査はWindowsの`core.autocrlf`に依存しないHEAD Git blob基準とする。
4. M00 verifierもGit blob基準へ変更し、M00以降の専用migration containerで回帰実行できるようにする。
5. M02完了前の人間管理者receipt作成は明示的にfail-closedとする。
6. outboxは`accepted`の非同期command receiptだけから作成できる。
7. 初回outbox rowにerror codeを持たせず、read refreshの完了時刻は開始時刻以降とする。
8. M01 verifierを既存ES5・strict TypeScript設定へ適合させる。
9. post-DDLで必須column・constraint・triggerを再検査し、既存の不完全な同名tableを黙認しない。
10. M01 private helperは`SECURITY INVOKER`のまま保持し、`SECURITY DEFINER`を追加しない。
11. 初回local Supabase起動で、`has_function_privilege`によるeffective privilege検査がprivate helperを誤検出したため、post-DDL検査を`pg_proc.proacl`の明示ACL・PUBLIC・role継承検査へ変更する。
12. 構造検査の変更だけで安全性を弱めず、M01 verifierでは`anon`・`authenticated`・`service_role`へ実際に`SET LOCAL ROLE`してreplay helperの呼出し拒否を確認する。
13. 初回local bootstrapで、66-byteのconstraint名がPostgreSQLにより63-byteへ自動切り詰められ、post-DDL期待名と不一致になることを確認した。正式名を61-byteの`admin_command_receipts_denied_failed_no_success_receipt_check`へ短縮し、宣言とpost-DDL contractを一致させる。
14. M01 verifierはmigration内で宣言されるconstraint・index・trigger・function名を検査し、UTF-8で63 bytesを超えるidentifierがあればstatic段階でfail-closedとする。制約の意味・CHECK式は変更しない。
15. migration-only reset後のM01 positive fixtureで、UUID文字列を`payload_reference`へ重複保存していたため、既存`is_safe_audit_summary`の電話番号・PII防止規則により正しく拒否された。
16. UUIDの正式参照先は`aggregate_id`であり、`payload_reference`には`reference_code`や`operation_code`などの短い非機密コードだけを保存する。SQLの安全制約は変更しない。
17. M01 verifierは安全なreference objectのpositive caseに加え、UUIDのようなdigit-hyphen文字列を`payload_reference`へ入れるnegative caseが拒否されることを確認する。

## 0. 結論

M01では、管理画面の業務tableをまだ作らない。全P0領域が共通で使う次の4基盤だけを作る。

```text
recora_private.admin_command_receipts
recora_private.admin_outbox_messages
recora_private.admin_read_refreshes
admin_read schema
```

M01の責任は次である。

1. global・organization・project commandの共通idempotency receipt
2. 非同期処理を失わないprivate outbox
3. materialized read model refreshの状態・watermark
4. 管理画面専用read schemaの先行確保とbrowser非公開

顧客、契約、測定、品質、公開、障害、原価、設定の正式業務状態はM01では作らない。

## 1. 前提

M00が専用local Supabaseで成功し、次のpinが1行存在することを必須とする。

| 項目 | 値 |
|---|---|
| schema version | `recora_admin_p0_design_v1_3` |
| Canonical manifest SHA-256 | `f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a` |
| physical manifest SHA-256 | `d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a` |
| repository baseline | `2c2a6fba70b75e858abc71a7447840bf32f3507d` |

M01をM00より先に適用してはならない。M00が旧`recora_admin_p0_design_v1`、`v1_1`、`v1_2`、または別hashをpinしている場合も停止する。

## 1.1 P4-B-aware baseline

M01 v1.5の実装開始baselineは`master` `49fd9007a4e93f80285660cf1f9e98c115d60a30`とする。M00のschema pinに保存されたrepository evidenceは`2c2a6fba70b75e858abc71a7447840bf32f3507d`のままであり、両者を混同しない。P4-Bが追加したcustomer-session actor、invitation/membership RPCとP4 command receiptを変更・置換しない。

```text
P4-B account command
→ P4専用receipt / invitation / membership boundary

P0 general admin command
→ admin_command_receipts / admin_outbox_messages
```

両者は競合させず、後続の明示的command serviceが業務責任に応じて選ぶ。M01はP4-B table・function・grantを変更しない。

## 2. M01/M02の正式境界

### 2.1 発見した既存基盤との不整合

既存`recora_operator.operator_command_receipts.organization_id`は必須である。一方、P0には次のglobal操作がある。

- 管理者招待・停止
- role・scope変更
- 全体日次設定
- AIモデル全体制御
- 標準plan適用

既存receiptをglobal対応のためにnullable化すると、Phase 3で確立したtenant境界を不用意に緩める。

### 2.2 正式解決

```text
admin_command_receipts
  P0全commandの共通receipt

operator_events
  人間管理者操作の単一audit保存元

operator_command_receipts
  既存organization/project commandの互換bridge
```

M01では次を行う。

- 人間commandは必ず`operator_events`へ接続
- 既存receiptへの接続は任意のscoped bridge
- `admin_account_id`は保持するがFKはまだ張らない
- global scopeを既存receiptへ偽装しない

M02では次を追加する。

- `admin_account_id -> admin_accounts.id` FK
- role assignment・authorization scopeをauditへ固定
- globalとscopedの両方について、成功commandの最終因果整合trigger

M01完了だけで人間管理者write APIを公開してはならない。M01のinsert triggerは`actor_type = admin`を明示的に拒否し、M02がadmin account FK、role/scope authorization evidence、audit action convergenceを追加するときに正式triggerへ置き換える。

## 3. `admin_command_receipts`

### 3.1 責任

全管理者・system commandの一意な受付事実をappend-onlyで保存する。

```text
command要求
↓
actor・scope・command・idempotency keyを固定
↓
正規化入力のrequest fingerprintを固定
↓
同期変更またはoutbox作成と同一transaction
```

### 3.2 主なfield

```text
id
actor_type
admin_account_id nullable
system_component_code nullable
command_name
organization_id nullable
project_id nullable
target_type
target_id nullable
idempotency_key
request_fingerprint
request_id
correlation_id
outcome
stable_reason_code
operator_command_receipt_id nullable
audit_event_id nullable
actor_identity_key generated
scope_key generated
created_at
```

### 3.3 actor

```text
admin
→ admin_account_idあり
→ system_component_codeなし
→ audit_event_id必須

system
→ admin_account_idなし
→ system_component_codeあり
→ legacy operator receipt禁止
```

同時に両方を持つことも、どちらも持たないことも禁止する。

### 3.4 scope

```text
organization_id NULL / project_id NULL
→ global

organization_idあり / project_id NULL
→ organization

organization_idあり / project_idあり
→ project
```

projectは必ず同じorganizationへ属するcomposite FKで検証する。

### 3.5 idempotency

正式な一意単位は次である。

```text
actor_identity_key
＋ scope_key
＋ command_name
＋ idempotency_key
```

ただし、一意keyだけでは異なる入力の誤用を検知できないため、serverが正規化command入力から次を計算する。

```text
request_fingerprint = lowercase SHA-256
```

処理は次へ固定する。

```text
既存receiptなし
→ 新規command処理へ進む

既存receiptあり・fingerprint一致
→ 既存receiptをidempotent replayとして返す
→ 新しい業務writeを行わない

既存receiptあり・fingerprint不一致
→ idempotency_conflict
→ 新しい業務writeを行わない
```

browserがfingerprintを信頼値として指定することは禁止する。raw command payloadは保存しない。

M01はprivate lookup helperを作るが、競合のないinsertには将来command RPC側でtransaction advisory lockとunique indexを併用する。

### 3.6 outcome

```text
accepted
committed
denied
failed
reconciliation_required
```

`replayed`という新しいreceipt行は作らない。replayでは既存receiptを返し、必要な閲覧・監査情報だけを別途扱う。

### 3.7 不変性

receiptはUPDATE・DELETE不可である。訂正や再要求は新しいcommandとして記録する。

## 4. `admin_outbox_messages`

### 4.1 責任

管理者またはsystem commandで受理した非同期処理を、HTTP responseやworker processの寿命から切り離して保持する。

### 4.2 保存するもの

```text
command receiptへの参照
message type
organization/project scope
aggregate type/id
安全なreference object
現在のdelivery状態
claim回数
利用可能時刻
lock時刻
完了時刻
短いerror code
row version
```

### 4.3 保存しないもの

- prompt全文
- AI回答
- raw provider request/response
- cookie、token、Authorization
- メールアドレス、電話番号
- DB URL、secret、private key
- customer-facing payload本体

`payload_reference`は既存のbounded safe audit summary validatorを再利用する。UUIDなどの正式なentity参照は`aggregate_id`・`organization_id`・`project_id`へ保存し、`payload_reference`へ重複保存しない。`payload_reference`に許可するのは、`reference_code`、`operation_code`などの短い非機密コードと、同じ安全契約を満たすbounded metadataだけである。digitとhyphenが連続するUUID形式は電話番号・PII候補として拒否され得るため、positive fixtureにも使用しない。

安全な例:

```json
{
  "reference_code": "m01_cycle_fixture",
  "operation_code": "verify_m01"
}
```

### 4.4 状態

```text
pending
processing
delivered
failed
reconciliation_required
```

許可遷移は次である。

```text
pending
├ processing
├ failed
└ reconciliation_required

processing
├ pending        lease回復・再claim待ち
├ delivered
├ failed
└ reconciliation_required
```

`delivered`、`failed`、`reconciliation_required`はterminalである。

### 4.5 attempt

- insert時は`pending / attempt_count=0 / row_version=1`
- `pending -> processing`のclaim時だけ`attempt_count + 1`
- `processing -> pending`はattempt数を維持し、`available_at`を後方へ動かせる
- その他の遷移でattempt数・available時刻を変えない

固定relation inventoryにはoutbox attempt専用tableがない。M08で`system_event`が作られた後、claim・delivery・failureの詳細をappend-only eventとして保存する。

### 4.6 原子性

非同期commandの受付では次を同一transactionへ入れる。

```text
正式write/action作成
＋ admin_command_receipts
＋ admin_outbox_messages
＋ operator audit success(ACCEPTED_ASYNC)
```

outbox作成に失敗した場合、commandだけを成功させない。outboxへ接続できるreceiptは`outcome = accepted`だけとし、`denied`、`failed`、`committed`から非同期処理を開始しない。初回pending rowは`attempt_count = 0`かつ`last_error_code = NULL`でなければならない。

## 5. `admin_read_refreshes`

### 5.1 責任

日別原価などのmaterialized read modelについて、1回のrefreshとsource watermarkを記録する。

### 5.2 状態

```text
running
completed
failed
cancelled
```

insertは必ず`running`で開始する。許可遷移は次だけである。

```text
running -> completed
running -> failed
running -> cancelled
```

terminal行は更新・削除できない。

### 5.3 排他

```text
UNIQUE(read_model_code) WHERE status = running
```

同じread modelを同時に2回refreshしない。

### 5.4 watermark

`source_watermark`は安全なreference・timestamp・countだけを持つ。raw source dataを複製しない。

## 6. `admin_read` schema

M01ではschemaだけを作る。viewはM21・M22で作成する。

M01直後は次を全て拒否する。

```text
PUBLIC
anon
authenticated
service_role
→ USAGEなし
```

M19でserver-side explicit read boundaryが完成するまで、直接利用を許可しない。

## 7. RLS・grant

3tableすべてにRLSを有効化する。次へtable権限を付与しない。

```text
PUBLIC
anon
authenticated
service_role
```

M01ではData API・browser・generic service-role table mutation pathを作らない。後続migrationのsecurity-definer command/read functionだけが、明示的な`EXECUTE` grantを受ける。

## 8. Migration内処理順

```text
1. M00 pin・既存object・partial M01 inventory
2. admin_read schema作成と即時revoke
3. admin_command_receipts
4. idempotency replay helper
5. receipt causal trigger・append-only trigger
6. admin_outbox_messages
7. outbox insert/transition guard
8. admin_read_refreshes
9. refresh insert/transition guard
10. RLS・table/function revoke
11. catalog・index・privilege post-verification
```

## 9. 適用順と専用環境

正式ファイルは次で生成する。

```powershell
npx supabase migration new recora_admin_p0_01_common_infrastructure
```

M00のtimestampより後であることを検証する。

専用local stackは次へ固定する。

```text
project_id: recora-admin-p0-m01
DB container: supabase_db_recora-admin-p0-m01
```

既存`supabase_db_recora`、M00 stack、linked project、remote projectを使わない。

## 10. 検証

### 10.1 Static

- Canonical・physical manifest hash
- M00→M01 migration順
- M00 pin checkが最初のDDLより前
- 作成tableが3件だけ
- public・legacy DMLなし
- public・legacy ALTERなし
- browser/service role grantなし
- request fingerprint必須
- M02前のadmin receipt fail-closed
- accepted receiptだけがoutboxを作成可能
- private helperの明示ACL・PUBLIC・role継承によるexecute grantなし
- `anon`・`authenticated`・`service_role`でreplay helperの実呼出しがpermission denied
- `SECURITY DEFINER` helperなし
- 必須column・constraint・triggerのpost-DDL contract確認
- PostgreSQL identifierがすべてUTF-8で63 bytes以下
- raw payload保存pathなし
- Canonical・physical manifestをHEAD Git blobで検査

### 10.2 Database positive

- system global receipt作成
- matching fingerprint replay
- safe outbox insert
- pending→processing→delivered
- read refresh running→completed
- 同一migration replay

### 10.3 Database negative

- duplicate idempotency insert
- fingerprint conflict
- receipt UPDATE/DELETE
- M02前のadmin receipt
- denied/failed receiptからのoutbox
- 初回outbox error code
- unsafe payload reference
- outbox direct pending→delivered
- terminal outbox update
- outbox scope mismatch
- refresh同時running重複
- terminal refresh update
- terminal refresh direct insert
- completed_at < started_at
- browser/service role access

### 10.4 Repository regression

- Canonical package verifier
- Git-blob対応M00 verifierをM01専用containerで実行
- Phase 3 tenant/RLS regression
- entitlement snapshot regression
- operator/audit regression
- P4-A regression
- `npm run recora:preflight:full`
- typecheck
- lint
- build
- `git diff --check`

## 11. M01で作らないもの

- admin account・role・capability
- human role authorization RPC
- business command RPC
- system event
- 顧客・project state
- contract・entitlement bridge
- setup、measurement、quality、publication、incident、cost
- read view・materialized view本体
- browser API
- remote migration

## 12. Exit criteria

M01完了は次を全て満たす場合だけとする。

1. M00 v1.3がmigration-only・seeded両方で成功
2. M01 migration-only・seeded reset成功
3. M01専用verifier成功
4. fingerprint一致replayと不一致conflictを実測
5. outbox payload・遷移negative test成功
6. read refresh排他・terminal不変性成功
7. RLS・revoke・private helperのSECURITY INVOKER境界を実測
8. 必須column・constraint・triggerのpost-DDL contractを実測
9. advisorsに未解決security errorなし
10. 既存Phase 3/P4回帰成功
11. Canonical packageとM00 verifierがWindows改行変換に依存せず成功
12. remote/production未接続

現時点ではv1.4 SQLテンプレート、M01 verifier、M00互換verifier、実装仕様の静的固定までであり、上記DB検証は未実施である。
