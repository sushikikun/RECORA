# レコラ管理画面 P0 管理設定画面仕様書

- 文書ID: `RECORA-ADMIN-P0-SETTINGS`
- 版: `1.1`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 対象route:
  - `/admin/settings`
  - `/admin/settings/admins`
  - `/admin/settings/roles`
  - `/admin/settings/notifications`
  - `/admin/settings/daily-automation`
  - `/admin/settings/ai-models`
  - `/admin/settings/plans`
  - `/admin/settings/change-history`
  - `/admin/settings/quality-publication-rules`
  - `/admin/settings/pricing`
- 前提仕様:
  - 正式状態モデル v2.1
  - 管理画面用read model v2.0
  - 権限・監査仕様 v2.0
  - 共通レイアウト仕様 v1.1
- 優先順位: 本仕様は、過去の管理設定案、画面ごとの独自設定状態、直接上書き型の設定変更案より優先する

---

## 0A. v1.1 最終横断統合更新

管理設定の画面責任・P0範囲はv1.0から変更しない。最終横断レビューにより、前提基盤を正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0へ更新する。

- 状態enumとcommand state effectは正式状態モデルv2.1を正とする。
- 表示code、件数、badge、facet、available command入力はread model v2.0を正とする。
- capability、scope、risk、command code、auditは権限・監査仕様v2.0を正とする。
- 正式routeと採用文書はcanonical manifest v1.0を正とする。

---

## 0. 正式決定

管理設定P0は、**全体運用に必要な少数の共通設定を安全に変更し、適用中・適用予定・適用失敗を区別して確認する領域**とする。

編集可能な対象は次である。

```text
管理者
標準roleの割当
管理対象scope
通知先
日次処理時刻・日次処理control
AIモデルcontrol
標準plan version
適用予定変更
```

読み取り中心の対象は次である。

```text
現在の品質rule version
現在の公開rule version
原価単価の適用状況
```

設定変更の原則は次である。

```text
現在activeな設定を直接上書きしない
↓
必要な設定は新versionを作る
↓
即時または将来時刻のscheduled changeを作る
↓
systemが適用条件を再検査する
├ 成功
│  ↓
│ 新versionをactive
│  ↓
│ 旧versionをsuperseded
│
└ 失敗
   ↓
   旧active versionを維持
   ↓
   設定異常として表示
```

次の設定はversion activationではなく、明示的なcontrol commandとして扱う。

```text
管理者停止・再開
通知先の停止・再開
日次自動処理停止・再開
AIモデル制御変更
```

管理設定トップでは強い操作を行わず、各専門ページで正式状態と影響を確認してから実行する。

---

## 1. 目的

管理者が次を判断・実行できるようにする。

1. 管理画面へアクセス可能な管理者は誰か。
2. MFA未設定、停止中、無効化済みの管理者は誰か。
3. 各標準roleが何を担当し、誰にどのscopeで割り当てられているか。
4. Critical障害、日次失敗、公開失敗、問い合わせなどの通知先が有効か。
5. 日次処理が何時に開始され、現在停止されていないか。
6. 各AIモデルのhealthとcontrolがどうなっているか。
7. 標準planの現在versionと適用予定versionは何か。
8. いつ、どの設定変更が適用予定か。
9. 品質・公開ruleの現在versionは何か。
10. 原価単価がどのモデル・利用単位へ適用されているか。
11. 設定変更の成功・拒否・失敗を追跡できるか。
12. 設定sourceがstaleまたは不明なとき、安全側に判断できるか。

---

## 2. 責任範囲

### 2.1 この領域で行うこと

- 管理者の招待、停止、再開、無効化
- 標準roleの割当・取消
- role assignment単位のscope割当・取消
- 通知先の作成、確認、停止、再開、無効化
- 日次開始時刻のversion作成、即時・予約適用
- 日次自動処理全体の停止・再開
- AIモデル単位のplanned control変更
- 標準plan draftの作成・編集・ready化・即時・予約適用
- 適用予定変更の確認・取消
- 品質・公開rule versionの読み取り
- pricing definitionの適用状況の読み取り
- 設定変更履歴の確認

### 2.2 この領域で行わないこと

- 個別顧客・projectの設定変更
- 顧客別の測定schedule
- 実行中batchの一時停止・安全停止
- 品質decision
- 公開candidate・versionの編集
- incident recovery clearanceの手動発行
- provider credentialやAPI keyの管理
- カスタムrole・capability編集
- 高度なrule editor・simulation
- pricing rate編集・原価調整・請求
- 二名承認

### 2.3 専門領域との境界

| 対象 | 管理設定 | 専門領域 |
|---|---|---|
| projectの測定停止 | 全体日次controlだけ | project単位は測定管理 |
| 実行中batch停止 | 行わない | 測定管理 |
| AIモデル障害 | controlの現在状態を表示 | incident対応は障害・監査 |
| 品質rule | active versionを表示 | 品質case処理は品質・例外 |
| 公開rule | active versionを表示 | candidate・versionは公開管理 |
| pricing不足 | 適用状況を表示 | 原価影響は利用量・コスト |
| 管理者操作履歴 | 設定対象だけを表示 | 全体監査は障害・監査 |

---

## 3. Routeと領域内navigation

### 3.1 正式route

```text
/admin/settings
/admin/settings/admins
/admin/settings/roles
/admin/settings/notifications
/admin/settings/daily-automation
/admin/settings/ai-models
/admin/settings/plans
/admin/settings/change-history
/admin/settings/quality-publication-rules
/admin/settings/pricing
```

P0では次の独立routeを作らない。

```text
/admin/settings/admins/[adminId]
/admin/settings/roles/[roleId]
/admin/settings/notifications/[destinationId]
/admin/settings/plans/[planCode]
/admin/settings/scheduled-changes
```

補助詳細はdrawerまたは同一page内inspectorで扱う。

### 3.2 領域内navigation

表示順は次に固定する。

```text
概要
管理者
役割
通知先
日次自動処理
AIモデル
標準プラン
品質・公開ルール
原価単価
変更履歴
```

閲覧capabilityがない項目は表示しない。無効表示で存在を知らせない。

---

## 4. 管理設定トップ

### 4.1 役割

`/admin/settings`は、設定値を編集するdashboardではなく、全体の設定健全性と次の変更を判断するindexである。

### 4.2 レイアウト

```text
設定健全性・重大警告                    12カラム

管理者・MFA                            4カラム
通知先                                 4カラム
日次自動処理                           4カラム

AIモデル                               4カラム
標準プラン                             4カラム
ルール・原価単価                       4カラム

適用予定変更                           8カラム
最近の設定変更                         4カラム
```

権限のないcardは空欄を残さず、残りを再配置する。

### 4.3 設定健全性

保存済みの`settings_status`は使用しない。次から導出する。

```text
管理者・MFA
通知先
日次設定versionとcontrol
scheduled configuration change
AIモデルhealth・control
plan active version
rule active version
pricing application coverage
```

表示code:

```text
normal
attention
critical
restricted
unknown
```

`restricted`は、日次停止やAIモデル停止などの意図したcontrolが存在するが、設定自体は整合している状態である。

### 4.4 適用予定変更

最大5件を次の順で表示する。

```text
effective_at ASC
同時刻ならcriticality DESC
change_id ASC
```

表示内容:

- 対象領域
- 対象version
- 適用予定日時
- 現在active version
- 作成者
- 理由
- 取消可否

### 4.5 最近の変更

最大8件。対象は次である。

- 管理者・role・scope変更
- 通知先変更
- 日次設定version適用
- 日次control変更
- AIモデルcontrol変更
- plan version適用
- scheduled change失敗・取消
- rule/pricing deployment event

通常readや一覧閲覧は表示しない。

---

## 5. 管理者管理

### 5.1 一覧

`/admin/settings/admins`

主な列:

```text
管理者
状態
MFA
標準role
管理scope
最終ログイン
招待・更新日時
操作
```

初期sort:

```text
要対応
→ invited
→ active
→ suspended
→ deactivated
→ updated_at DESC
```

### 5.2 管理者状態

```text
invited
active
suspended
deactivated
```

`deactivated`は終端である。

MFA状態は別sourceから返す。

```text
not_enrolled
enrolled
unknown
```

`admin_user.status = active`でもMFA未設定なら、通常管理画面を利用できない。

### 5.3 招待

正式command:

```text
InviteAdmin
```

入力:

```text
email
display_name
initial_role_assignments[]
  role_code
  scopes[]
invitation_reason
idempotency_key
```

成功transaction:

```text
admin_user = invited
＋
role assignment
＋
scope assignment
＋
audit log
＋
invite delivery outbox
```

roleまたはscopeを持たない招待は作成しない。

招待tokenは認証基盤だけが保持し、管理画面・audit log・system eventへ保存しない。

### 5.4 招待再送

```text
ResendAdminInvite
```

- `invited`だけが対象
- rate limitを適用
- 新しい認証provider invitationを要求
- 管理者要求はaudit log
- 配送結果はsystem event

### 5.5 停止・再開・無効化

```text
SuspendAdmin
ResumeAdmin
DeactivateAdmin
```

すべてW3とする。

停止・無効化時:

```text
新規request拒否
既存session失効
権限cache失効
保留中human commandは開始前にactor再検査
```

最後の有効なplatform adminを失う操作は拒否する。

### 5.6 管理者詳細drawer

表示内容:

- 基本情報
- status・MFA
- role assignment
- scope assignment
- assignmentの開始・終了
- last login
- session revoke状態の要約
- 最近の管理操作
- available commands

返さないもの:

- password
- MFA secret
- recovery code
- session token
- invitation token
- raw IP履歴

---

## 6. 標準role・scope

### 6.1 Role page

`/admin/settings/roles`

P0の8roleを表示する。

```text
platform_admin
customer_operator
measurement_operator
quality_reviewer
publication_operator
system_operator
cost_analyst
auditor
```

role定義は固定seedであり、作成・編集・削除できない。

### 6.2 表示内容

各roleについて次を表示する。

- 日本語名
- 主責任
- 主要capability要約
- 許可scope
- active assignment数
- MFA未設定assignment数
- 期限付きassignment数
- 担当管理者

capabilityの内部実装名はinspectorで確認できるが、編集checkboxにはしない。

### 6.3 Role割当

```text
AssignAdminRole
RevokeAdminRole
```

W3。

有効assignmentには最低1件のscopeが必要である。role割当作成と初期scope作成は同一transactionで行う。

### 6.4 Scope割当

```text
global
customer
project
```

```text
AssignAdminScope
RevokeAdminScope
```

W3。

正式なeffective scope:

```text
effective_scope(admin, capability)
=
そのcapabilityを付与する有効role assignmentに属するscopeの和集合
```

管理者が持つ全scopeを、すべてのroleへ流用しない。

### 6.5 最後の管理者保護

有効なplatform adminとして数える条件:

```text
admin_user.status = active
MFA enrolled
platform_admin role assignmentが有効
global scopeが有効
assignment期限内
```

招待中、停止中、MFA未設定、scope欠落、期限切れは数えない。

---

## 7. 通知先

### 7.1 P0 channel

P0はemailだけを扱う。

```text
channel_type = email
```

Slack、Teams、SMS、Webhook、PagerDuty連携はP1以降とする。

### 7.2 `notification_destination`

主な属性:

```text
notification_destination_id
channel_type
normalized_address
display_name
status
category_codes[]
minimum_severity
verified_at nullable
last_test_requested_at nullable
last_test_result_code nullable
created_by_admin_id
created_at
updated_at
row_version
```

status:

```text
pending_verification
active
paused
invalid
revoked
```

`revoked`は終端である。

### 7.3 Notification category

P0の固定category:

```text
critical_incident
automation_failure
publication_failure
quality_attention
customer_inquiry
cost_attention
admin_security
daily_summary
```

categoryごとの複雑な条件式や自由なworkflowは作らない。

### 7.4 作成・確認

```text
CreateNotificationDestination
SendNotificationDestinationTest
```

作成直後は`pending_verification`とする。

```text
pending_verification
↓
test delivery成功
↓
active
```

test失敗では`invalid`へ移す。再test時は新しいdelivery attemptを作る。

### 7.5 更新

```text
UpdateNotificationDestinationPreferences
PauseNotificationDestination
ResumeNotificationDestination
RevokeNotificationDestination
```

変更可能:

- display name
- category
- minimum severity

宛先addressは変更しない。変更が必要なら新destinationを作り、旧destinationをrevokedにする。

### 7.6 必須通知先

次を満たさない場合は設定異常とする。

```text
active destination subscribed to critical_incident >= 1
active destination subscribed to admin_security >= 1
```

意図的にpausedの宛先はactive件数に含めない。

### 7.7 配送履歴

通常画面では次だけを表示する。

- 最終test時刻
- 最終結果
- 直近の連続失敗有無
- last successful delivery

本文全文や全配送明細は返さない。詳細な処理事実はsystem eventで追跡する。

---

## 8. 日次自動処理設定

### 8.1 データ構造

```text
daily_automation_configuration
├ active_version_id
├ control_state
└ control_origin

 daily_automation_configuration_version
 ├ version_number
 ├ business_timezone
 ├ daily_start_local_time
 └ status
```

stable controlとimmutable configuration versionを分離する。

### 8.2 P0の設定項目

編集可能:

```text
daily_start_local_time
```

読み取り固定:

```text
business_timezone = Asia/Tokyo
frequency = daily
```

曜日別schedule、顧客別schedule、休日calendarはP1以降である。

### 8.3 Version状態

```text
draft
ready
active
superseded
cancelled
```

編集できるのはdraftだけである。

### 8.4 設定変更

```text
CreateDailyAutomationConfigurationVersion
UpdateDailyAutomationConfigurationDraft
ReadyDailyAutomationConfigurationVersion
ScheduleDailyAutomationConfigurationChange
CancelScheduledConfigurationChange
```

ready化では次を検査する。

- 時刻形式
- 許容時間帯
- active versionとの比較
- 同一非終端draft不存在
- 競合scheduled change不存在

### 8.5 適用境界

日次runは作成時点のversionをpinする。

```text
daily_target_evaluation_run.daily_automation_configuration_version_id
```

新versionは進行中runへ遡及適用しない。

開始時刻を当日の過去時刻へ変更する場合、最短でも次の安全な業務日境界へ適用する。

### 8.6 Control

```text
enabled
paused_by_admin
blocked_by_system
```

control origin:

```text
planned_admin
incident_safety
system_policy
```

操作:

```text
PauseDailyAutomation
ResumeDailyAutomation
```

W3。

日次停止は、新しいtarget evaluation runを停止する。既に実行中のmeasurement batchを暗黙停止しない。

`blocked_by_system`解除はincident recovery clearanceを消費するsystem commandだけが実行できる。

### 8.7 次回実行表示

画面へ次を表示する。

- current active version
- 開始時刻
- timezone
- control state
- 次回business date
- 次回開始予定時刻
- 当日run状態
- scheduled change
- 最終成功run
- 最終失敗run
- freshness

---

## 9. AIモデル設定

### 9.1 目的

AIモデルpageは、model registryの編集ではなく、登録済みモデルのhealthと運用controlを扱う。

### 9.2 表示単位

1登録AIモデル1行。

主な列:

```text
provider
model
health
control
control origin
通常処理可否
影響project数
実行中assignment
最終観測
操作
```

### 9.3 Health

```text
operational
degraded
unavailable
unknown
```

healthはsystem観測を正とし、管理者が直接更新できない。

### 9.4 Control

```text
enabled
restricted
paused
```

意味:

| control | 通常処理 | recovery・probe |
|---|---|---|
| `enabled` | 許可 | 許可 |
| `restricted` | 新規通常callを停止 | canary・incident recovery・health probeだけ許可 |
| `paused` | 新規provider callを停止 | health probeだけ許可 |

control origin:

```text
planned_admin
incident_safety
system_policy
```

### 9.5 Planned control変更

```text
ChangeAiModelControl
```

W3。

入力:

- target model
- current state
- desired state
- reason
- impact summary acknowledgement
- expected row version
- idempotency key

既存plan、project configuration、measurement historyを変更しない。

### 9.6 Incident safety境界

`control_origin = incident_safety`の制御を通常commandで解除できない。

```text
recovery plan
↓
verification
↓
recovery clearance
↓
ConsumeClearanceAndReleaseControl
```

### 9.7 P0で行わないこと

- model registryへの新規モデル登録
- provider credential編集
- API key表示
- model endpoint編集
- 顧客別model control
- workloadごとの自由なrestriction rule editor

---

## 10. 標準plan

### 10.1 Plan identity

P0の`plan_code`はseedされたstable identityとする。

新しいplan codeは管理画面から作らない。既存plan codeに新versionを作る。

### 10.2 `plan_version`

主な属性:

```text
plan_version_id
plan_code
version_number
status
display_name
project_limit
customer_user_limit
prompt_count_tier
daily_measurement_enabled
created_by_admin_id
created_at
ready_at nullable
activated_at nullable
superseded_at nullable
row_version
```

AIモデル許可は`plan_version_ai_model`で保持する。

### 10.3 Version状態

```text
draft
ready
active
superseded
cancelled
```

編集可能なのはdraftだけである。

### 10.4 Prompt tier

```text
50
100
200
```

それ以外の任意件数を標準planへ設定しない。

### 10.5 Plan draft

```text
CreatePlanVersionDraft
UpdatePlanVersionDraft
ReadyPlanVersion
CancelPlanVersion
```

draft ready化条件:

- required fieldが揃う
- prompt tierが50・100・200
- project limitが正数
- 1件以上の登録済みAIモデル
- duplicate AI modelなし
- 同じplan codeの非終端draftなし

AIモデルが一時停止中でも、登録自体が有効ならready化を拒否しない。ただし影響warningを表示する。

### 10.6 適用

```text
SchedulePlanVersionChange
```

即時適用も同じcommandで`effective_at = now`を使用する。

適用成功transaction:

```text
new version ready -> active
old active version -> superseded
scheduled change -> applied
```

既存contract versionの`plan_version_id`は変更しない。

### 10.7 影響表示

ready・scheduled versionには次を表示する。

- 現activeとの差分
- 新規契約へ適用される内容
- 既存契約は自動移行しないこと
- 利用可能AIモデル
- prompt tier
- project limit
- scheduled effective time

### 10.8 P0で作らないもの

- plan code作成・削除
- 顧客別custom plan editor
- 価格・請求額
- 粗利・予算
- 既存契約の一括移行
- plan simulation

---

## 11. 適用予定変更

### 11.1 対象

P0の`scheduled_configuration_change`は次だけを扱う。

```text
daily_automation_configuration_version_activation
plan_version_activation
```

通知先、管理者、role、scope、AIモデルcontrolはscheduled changeへ入れない。

### 11.2 状態

```text
scheduled
applying
applied
failed
cancelled
```

`applied`、`failed`、`cancelled`は終端である。

### 11.3 正式属性

```text
scheduled_configuration_change_id
change_type
target_domain_key
target_daily_automation_configuration_version_id nullable
target_plan_version_id nullable
expected_daily_automation_configuration_version_id nullable
expected_plan_version_id nullable
effective_at
status
requested_by_admin_id
request_reason
retry_of_change_id nullable
failure_code nullable
failure_summary nullable
row_version
created_at
started_at nullable
completed_at nullable
```

任意JSON patchは保存しない。

`change_type`ごとに、対応するtarget FKとexpected active FKだけを必須にし、もう一方のdomainのFKはNULLにする。これをDBのCHECK制約で保証する。画面用の`target_version_id`と`expected_active_version_id`はread modelで導出し、永続化しない。

### 11.4 適用処理

system actor:

```text
settings_change_applier
```

正式処理:

```text
scheduled
↓ effective_at到達
applying
↓
target version・expected active version・row version・domain constraint再検査
├ 成功
│  ↓
│ 新active pointer切り替え
│  ↓
│ 旧version superseded
│  ↓
│ applied
│
└ 失敗
   ↓
   旧active維持
   ↓
   failed
```

### 11.5 取消

```text
CancelScheduledConfigurationChange
```

W2。

`scheduled`だけを取消できる。`applying`以降は取消できない。

### 11.6 再試行

failed changeを戻さない。

```text
failed change
↓
新scheduled change
＋ retry_of_change_id
```

---

## 12. 品質・公開rule version

### 12.1 Route

```text
/admin/settings/quality-publication-rules
```

P0は読み取り専用である。

### 12.2 表示内容

品質rule:

- active version
- version code
- activated at
- rule count
- blocking policy summary
- schema/hash
- 参照中のcheck run数
- previous version
- freshness

公開rule:

- active version
- version code
- activated at
- auto publish policy summary
- required verification summary
- render compatibility
- 参照中candidate・version数
- previous version
- freshness

### 12.3 不変条件

- rule versionはimmutable
- active versionは各種類1件
- quality check runとcandidateはversion IDをpin
- active version不足時は自動処理をfail-closed
- 管理画面からedit・activate・simulateしない

rule deploymentは管理画面外の正式なsystem release processが行い、system event・auditへ記録する。

---

## 13. 原価単価の適用状況

### 13.1 Route

```text
/admin/settings/pricing
```

読み取り専用。

### 13.2 表示内容

- provider
- AIモデル
- service tier
- usage unit
- currency
- active definition
- scheduled definition
- effective period
- rate confidence
- usage coverage
- missing・ambiguous count
- last calculation usage
- freshness

### 13.3 Redaction

`pricing.read`がない場合、次を返さない。

- rate amount
- unit size
- effective periodの機密詳細
- source reference

customer/project scopeでは、許可scopeのusageへ実際に適用されたdefinitionだけを返す。

### 13.4 対応owner

pricing不足がusage-costの未算定として扱われる場合、設定画面にも状態を表示できるが、設定サイドバーバッジへ重複加算しない。

共通pricing engine障害がincidentで管理される場合も、incidentを正式ownerとする。

---

## 14. 設定変更履歴

### 14.1 Route

```text
/admin/settings/change-history
```

専用の変更履歴tableは作らない。

```text
audit_log
＋ system_event
＋ 対象固有の状態遷移
↓
TimelineEntry
```

### 14.2 Filter

```text
domain
actor
action
result
risk class
date range
correlation ID
```

初期期間は直近30日、P0の最大期間は180日とする。

### 14.3 表示domain

```text
admin
role_scope
notification
daily_automation
ai_model
plan
scheduled_change
quality_rule
publication_rule
pricing
```

### 14.4 重複防止

管理者がplan changeを予約した事実はaudit logで1件表示する。

その後の適用開始・完了・失敗はsystem eventとして表示する。同じ管理者要求を完了時に再度auditへ書かない。

---

## 15. Settings healthとサイドバーバッジ

### 15.1 永続的な作業tableを作らない

`SettingsHealthSummary`は正式状態から導出するread modelである。

次を保存しない。

```text
settings_attention_status
settings_issue_status
settings_work_item
```

### 15.2 主なissue code

```text
admin_mfa_missing
admin_assignment_invalid
critical_notification_destination_missing
admin_security_notification_destination_missing
notification_destination_invalid
daily_automation_configuration_missing
daily_automation_configuration_invalid
scheduled_change_apply_failed
scheduled_change_overdue
ai_model_health_control_unknown
ai_model_recovery_check_failed
plan_active_version_missing
plan_version_apply_failed
quality_rule_version_missing
publication_rule_version_missing
rule_version_incompatible
```

pricing不足は原則としてusage-cost owner、共通engine障害はincident ownerとする。

### 15.3 Badge predicate

```text
attention_owner = settings
AND human_attention = true
AND attention_level IN (critical, high)
```

件数はdistinct issueで数える。

通常件数、全管理者数、全AIモデル数はバッジへ表示しない。

### 15.4 Intentional control

次は異常ではない。

```text
daily automation paused_by_admin
AI model planned_admin paused/restricted
notification destination paused
scheduled change awaiting effective time
```

ただし、画面では`restricted`または「停止中」と明示する。

---

## 16. CommandとRisk class

### 16.1 管理者

| Command | Risk | Capability | 主な実行者 |
|---|---:|---|---|
| `InviteAdmin` | W2 | `admin_directory.manage` | PA |
| `ResendAdminInvite` | W1 | `admin_directory.manage` | PA |
| `SuspendAdmin` | W3 | `admin_directory.manage` | PA |
| `ResumeAdmin` | W3 | `admin_directory.manage` | PA |
| `DeactivateAdmin` | W3 | `admin_directory.manage` | PA |
| `AssignAdminRole` | W3 | `admin_access.manage` | PA |
| `RevokeAdminRole` | W3 | `admin_access.manage` | PA |
| `AssignAdminScope` | W3 | `admin_access.manage` | PA |
| `RevokeAdminScope` | W3 | `admin_access.manage` | PA |
| `CreateNotificationDestination` | W2 | `notification.manage` | PA, SO |
| `UpdateNotificationDestinationPreferences` | W2 | `notification.manage` | PA, SO |
| `SendNotificationDestinationTest` | W1 | `notification.manage` | PA, SO |
| `PauseNotificationDestination` | W2 | `notification.manage` | PA, SO |
| `ResumeNotificationDestination` | W2 | `notification.manage` | PA, SO |
| `RevokeNotificationDestination` | W2 | `notification.manage` | PA, SO |
| `CreateDailyAutomationConfigurationVersion` | W2 | `daily_automation.manage` | PA, SO |
| `UpdateDailyAutomationConfigurationDraft` | W1 | `daily_automation.manage` | PA, SO |
| `ReadyDailyAutomationConfigurationVersion` | W2 | `daily_automation.manage` | PA, SO |
| `ScheduleDailyAutomationConfigurationChange` | W3 | `daily_automation.manage` | PA, SO |
| `PauseDailyAutomation` | W3 | `daily_automation.manage` | PA, SO |
| `ResumeDailyAutomation` | W3 | `daily_automation.manage` | PA, SO |
| `ChangeAiModelControl` | W3 | `ai_model_control.manage` | PA, SO |
| `CreatePlanVersionDraft` | W2 | `plan.manage` | PA |
| `UpdatePlanVersionDraft` | W1 | `plan.manage` | PA |
| `ReadyPlanVersion` | W2 | `plan.manage` | PA |
| `SchedulePlanVersionChange` | W3 | `plan.manage` | PA |
| `CancelPlanVersion` | W2 | `plan.manage` | PA |
| `CancelScheduledConfigurationChange` | W2 | 対象domainのmanage | PA, SO |

### 16.2 System-only

```text
ActivateAdminFromIdentityProvider
RecordAdminMfaProjection
RecordNotificationDeliveryResult
ApplyScheduledConfigurationChange
```

人間actorへ公開しない。

### 16.3 W2共通要件

- reason
- impact summary
- expected row version
- idempotency key
- latest available commands
- admin active・MFA

### 16.4 W3共通要件

W2に加えて次を必須とする。

- 直近15分以内のstep-up
- typed confirmationまたは明示的確認
- safety fallback
- affected count
- current control/version
- concurrency再検査

---

## 17. 権限・scope

### 17.1 Capability

```text
admin_directory.read
admin_directory.manage
admin_access.manage
notification.read
notification.manage
daily_automation.read
daily_automation.manage
ai_model_control.read
ai_model_control.manage
plan.read
plan.manage
rule_version.read
pricing.read
settings.change_history.read
```

### 17.2 Global write

管理設定のwriteはすべてglobal scopeを必要とする。

customer/project scopeだけのrole assignmentから、global設定を変更できない。

### 17.3 Read境界

- 管理者directoryはglobal scopeと`admin_directory.read`を要求する。
- role pageはglobal scopeと`admin_directory.read`を要求する。
- notification・daily automation・AI model・planの全社設定は対応するread capabilityを要求する。
- rule versionは`rule_version.read`で参照できる。
- pricing rate詳細は`pricing.read`と既存のpricing scope規則を要求する。
- change historyは`settings.change_history.read`を要求し、閲覧者のcapabilityに応じてdomainをredactする。

### 17.4 Platform adminも免除されない

次を実行できない。

- MFAなしの操作
- 最後のplatform admin喪失
- active versionの直接編集
- system blockのclearanceなし解除
- rule/pricingの直接編集
- audit log・system eventの更新・削除

---

## 18. Read contract

### 18.1 `GetSettingsOverview`

```text
settings_health
admin_summary nullable
notification_summary nullable
daily_automation_summary nullable
ai_model_summary nullable
plan_summary nullable
rule_summary nullable
pricing_summary nullable
scheduled_changes[]
recent_changes[]
freshness_by_source
available_navigation[]
read_snapshot_at
```

権限のないsummaryは0値ではなくfield自体を返さない。

### 18.2 `GetAdminDirectory`

```text
items[]
facet_counts
settings_health_subset
page_info
read_snapshot_at
```

### 18.3 `GetAdminRoles`

```text
roles[]
assignment_counts
mfa_attention_counts
read_snapshot_at
```

### 18.4 `GetNotificationDestinations`

```text
items[]
required_category_coverage
recent_delivery_health
available_commands
read_snapshot_at
```

### 18.5 `GetDailyAutomationSettings`

```text
current_configuration
active_version
draft_version nullable
scheduled_change nullable
current_daily_run
next_run
recent_runs
settings_health_subset
available_commands
read_snapshot_at
```

### 18.6 `GetAiModelSettings`

```text
items[]
health_summary
control_summary
impact_summary
available_commands_by_model
read_snapshot_at
```

### 18.7 `GetPlanSettings`

```text
plans[]
active_versions
draft_versions
scheduled_changes
impact_preview_summary
available_commands
read_snapshot_at
```

### 18.8 `GetRuleVersionSettings`

```text
quality_rule
publication_rule
compatibility
reference_counts
freshness
```

### 18.9 `GetPricingApplicationSettings`

```text
application_summary
coverage_summary
definitions[]
redaction
freshness
```

### 18.10 `GetSettingsChangeHistory`

```text
items[]
facet_counts
page_info
read_snapshot_at
```

---

## 19. Audit・system event

### 19.1 Auditする管理者操作

- 管理者招待・再送・停止・再開・無効化
- role・scope割当・取消
- 通知先作成・変更・停止・再開・無効化
- 日次設定draft・ready・予約・停止・再開
- AIモデルcontrol変更
- plan draft・ready・予約・取消
- scheduled change取消
- sensitive admin・pricing detail閲覧

### 19.2 System event

- 招待配送結果
- notification test・配送結果
- scheduled change開始・成功・失敗
- active version切り替え
- 日次runが新versionをpinした事実
- rule deployment activation
- pricing activation
- cache invalidation
- session revocation結果

### 19.3 保存禁止

```text
password
MFA secret
recovery code
invite token
session token
API key
provider credential
Authorization header
cookie
notification本文全文
```

---

## 20. Concurrency・idempotency

### 20.1 Admin

- normalized emailの有効重複を一意制約で防止する。
- role・scope変更ではadmin、assignment、last platform admin候補をlockする。
- 同じidempotency keyの招待は既存adminを返す。

### 20.2 Notification

- active/pendingのnormalized addressを重複させない。
- test結果が古いrow versionへactive化しない。
- revoked destinationを再openしない。

### 20.3 Daily automation

- stable configuration rowをlockする。
- active version切り替えと旧version supersedeを同一transactionにする。
- 非終端scheduled changeは最大1件。

### 20.4 AI model

- control row versionをcompare-and-swapする。
- incident originとplanned admin originの競合をincident safety優先で解決する。

### 20.5 Plan

- plan code単位にversion numberを排他的採番する。
- active versionは最大1件。
- nonterminal draftは最大1件。
- contract pinを保持したままactive pointerだけを切り替える。

### 20.6 Scheduled change

- target domain keyごとに非終端change最大1件。
- terminal changeを再openしない。
- retryは新rowとretry referenceを作る。

---

## 21. Freshness・unknown・partial failure

設定sourceごとにfreshnessを返す。

```text
identity/MFA projection
admin access projection
notification delivery health
daily scheduler state
AI model health
AI model control
plan version
scheduled changes
rule version
pricing application
change history
```

安全規則:

```text
MFA source unknown
→ MFA済みと推測しない

daily configuration unknown
→ 次回実行時刻を確定表示しない

AI model health stale
→ operationalと表示しない

scheduled change source failure
→ 適用予定0件と表示しない

rule version source failure
→ active ruleありと推測しない
```

部分失敗では、取得できたsectionを維持し、失敗sectionだけをエラー表示する。

W2・W3commandは、必要sourceがstale・unknown・failedなら返さない。

---

## 22. UI・アクセシビリティ

- 共通layoutのT2、T4、T8 templateを使用する。
- 管理者・AIモデル・通知先はtableとdrawerを使用する。
- plan・日次設定はcurrent、draft、scheduledを同時に区別する。
- active、scheduled、failedを色だけで区別しない。
- control stateとhealth stateを別column・別labelで表示する。
- W3dialogでは対象名・影響・安全な代替状態を表示する。
- 長いメールアドレス、model名、plan名で横崩れしない。
- page全体の横scrollを発生させず、必要なtableだけ内部scrollとする。
- 1366×768と1440×900を正式visual regression対象とする。
- keyboardだけでdrawer、filter、確認dialogを操作できる。

---

## 23. P0で作らないもの

```text
カスタム管理者role
capability checkbox editor
明示deny policy
二名承認
Slack・Teams・SMS・Webhook通知
通知workflow builder
顧客別・曜日別日次schedule
休日calendar
AI provider・credential管理
モデルendpoint編集
新規plan code作成
顧客別custom plan
既存契約一括移行
品質・公開rule editor
rule simulation
pricing editor
為替換算
原価調整
請求・売上・粗利・予算
```

---

## 24. 受け入れ条件

1. 管理設定トップが、閲覧可能な設定領域だけを表示する。
2. 管理設定トップに権限外カードの名称・件数・状態を返さない。
3. 管理設定トップの各カードが同じread snapshotを使用する。
4. 設定sourceがstaleまたはunknownのとき正常と表示しない。
5. 設定トップからW2・W3操作を直接実行せず、専門ページへ遷移する。
6. 管理設定サイドバーバッジと設定異常一覧が同じpredicateを使用する。
7. 意図した日次停止・AIモデル停止を設定異常件数へ含めない。
8. incident-ownedまたはusage-cost-owned問題を設定バッジへ二重計上しない。
9. 1366×768で設定全体の重大警告と主要8領域を確認できる。
10. 1440×900で適用予定変更と最近の変更を同時に確認できる。
11. 管理者一覧がinvited・active・suspended・deactivatedを区別する。
12. MFA状態を認証基盤または正式projectionから読み、admin_userへ重複保存しない。
13. MFA未設定のactive管理者を設定異常として表示できる。
14. 招待時に正規化済みメールアドレスの重複を拒否する。
15. 管理者招待と初期role・scope作成を同一transactionで行う。
16. roleまたはscopeを持たない利用可能管理者を作らない。
17. 招待配送の成功・失敗をsystem_eventへ記録する。
18. 招待要求をaudit_logへ1回だけ記録する。
19. 招待token・MFA secret・session情報を管理画面へ返さない。
20. 停止した管理者の既存セッションと権限cacheを失効できる。
21. deactivated管理者を通常操作で再有効化できない。
22. 最後の有効なplatform_adminを停止できない。
23. 最後の有効なplatform_adminをdeactivateできない。
24. 最後の有効なplatform_adminからroleまたはglobal scopeを外せない。
25. 自分自身へ新しいroleを付与できない。
26. 自分自身のscopeを拡大できない。
27. 自分自身をplatform_adminへ昇格できない。
28. 管理者停止・再開・無効化でstep-upと最新row versionを再検査する。
29. 管理者詳細drawerへrole assignmentとscope assignmentの履歴を表示できる。
30. 権限のない閲覧者へ管理者メールアドレスやMFA状態を返さない。
31. P0で標準roleを新規作成できない。
32. P0で標準roleのcapability定義を編集できない。
33. role pageがrole code・責任・capability要約・割当人数を返す。
34. role assignmentごとにscopeを計算する。
35. 異なるrole assignmentのscopeを先に合算しない。
36. platform_adminとsystem_operatorへglobal scopeを必須化する。
37. global scopeとcustomer/project scopeを同じassignmentへ併設できない。
38. customer scopeとその配下project scopeの冗長併設を拒否する。
39. role取消時に関連scopeを同一transactionで無効化する。
40. scopeのないactive role assignmentをfail-closedにする。
41. role・scope変更後、開いたままの画面からのwriteをendpoint再認可で拒否する。
42. role・scope変更のbefore/afterへsecretや全capability payloadを複製しない。
43. P0のnotification destinationをemail channelへ限定する。
44. notification destinationがpending_verification・active・paused・invalid・revokedを区別する。
45. activeまたはpendingの正規化済みメールアドレスを重複登録できない。
46. 作成後の宛先アドレスを直接変更できない。
47. 宛先変更時に新destinationを作成し旧destinationをrevoked化する。
48. 固定allowlistの通知categoryだけを選択できる。
49. minimum severityとcategory subscriptionをserverで検証する。
50. test delivery要求をW1、宛先の作成・設定変更をW2として扱う。
51. test delivery結果をsystem_eventへ記録する。
52. test成功前のdestinationをactiveとして扱わない。
53. invalid destinationを正常な通知先として数えない。
54. 最低1件のactive critical incident通知先が存在することを検査する。
55. 最低1件のactive admin security通知先が存在することを検査する。
56. 意図したpaused destinationを配送失敗として表示しない。
57. revoked destinationを再openできない。
58. 通知配送履歴へ本文全文・token・認証headerを保存しない。
59. 通知先の通常readで過去の全配送明細を返さない。
60. 日次設定のstable control rowとimmutable version rowを分離する。
61. 日次開始時刻を設定versionへ固定する。
62. P0のbusiness timezoneをAsia/Tokyoへ固定し、画面から変更できない。
63. draft以外の日次設定versionを直接編集できない。
64. 同時に複数の日次設定draftを作成できない。
65. 同時に複数の日次設定scheduled changeを作成できない。
66. 日次設定の適用をscheduled_configuration_change経由にする。
67. 即時適用もeffective_at=nowのscheduled changeとして処理する。
68. 現在実行中の日次runへ新しい開始時刻を遡及適用しない。
69. 日次runが作成時点のconfiguration versionをpinする。
70. 設定適用失敗時に旧active versionを維持する。
71. 設定適用失敗時に新versionをactiveにしない。
72. failed scheduled changeを同じrowで再openしない。
73. 再試行で新scheduled changeとretry referenceを作る。
74. 日次停止が新しい日次target runだけを停止し、実行中batchを暗黙停止しない。
75. paused_by_adminからの再開にW3とstep-upを要求する。
76. blocked_by_systemを通常の管理者操作で解除できない。
77. system block解除をincident recovery clearance経由にする。
78. 日次停止中の次回runをskipped_by_controlとして説明できる。
79. 日次設定sourceがunknownのとき変更・停止・再開commandを返さない。
80. AIモデルのhealthとcontrolを別field・別sourceとして表示する。
81. AIモデルcontrolをenabled・restricted・pausedで表示する。
82. control originをplanned_admin・incident_safety・system_policyで区別する。
83. restrictedを通常の新規provider call禁止・canary/recovery限定として扱う。
84. pausedをhealth unavailableと同義にしない。
85. health operational・control pausedを同時に表示できる。
86. planned admin制御変更をW3として扱う。
87. incident safety制御をplanned admin変更で上書きできない。
88. incident-linked control解除にtarget限定clearanceを要求する。
89. AIモデル停止でplan versionやproject configurationを直接書き換えない。
90. AIモデル停止で実行中attemptの結果を削除しない。
91. 影響するproject数・進行中assignment数をread modelから表示できる。
92. model registryへの新規モデル追加・provider credential編集UIをP0で作らない。
93. stale healthをoperationalとして表示しない。
94. plan_codeをseedされたstable identityとして扱う。
95. P0で新しいplan_codeを作成しない。
96. plan versionをdraft・ready・active・superseded・cancelledで管理する。
97. draftだけを編集可能にする。
98. ready以降のplan内容を直接編集できない。
99. plan内容変更で新versionを作成する。
100. prompt count tierを50・100・200だけに限定する。
101. plan versionに1件以上の許可AIモデルを必須化する。
102. 未登録または廃止済みAIモデルをready化できない。
103. 一時停止中AIモデルを含むplanを警告付きで表示できる。
104. 同じplan_codeにactive versionを2件作れない。
105. 同じplan_codeに非終端draftを複数作れない。
106. plan versionの適用をscheduled configuration change経由にする。
107. plan適用失敗時に旧active versionを維持する。
108. 新plan適用で既存contract_versionを書き換えない。
109. 既存contract_versionがpinした旧plan versionを削除しない。
110. 新active planを新規契約versionのdefaultとして使用できる。
111. plan version取消でactive versionを消さない。
112. plan changeの影響件数を契約・projectへ遡及変更せずpreviewできる。
113. 粗利・請求・価格シミュレーションをplan pageへ追加しない。
114. scheduled_configuration_changeをdaily automationとplan activationだけに限定する。
115. scheduled changeがscheduled・applying・applied・failed・cancelledを区別する。
116. scheduled changeへ任意JSON patchを保存しない。
117. change typeに対応する明示的なtarget FKとexpected active FKを固定し、polymorphicなversion IDだけへ依存しない。
118. 同じdomainに非終端scheduled changeを複数作れない。
119. scheduled change適用前にchange type・対応FK・target version・expected active version・row versionを再検査する。
120. 適用transactionが新active pointerと旧version supersedeを原子的に行う。
121. 部分成功で新旧active versionが同時に残らない。
122. applying状態のchangeを管理者が取消できない。
123. scheduled状態の取消をW2として理由付きで監査する。
124. failed changeをsettings healthへ表示する。
125. overdue scheduled changeを正常な予定として表示しない。
126. system actorだけがchangeをapplying・applied・failedへ変更できる。
127. quality rule versionとpublication rule versionを読み取り専用にする。
128. rule version payloadを生成後に編集できない。
129. 現在activeなquality rule versionを1件に限定する。
130. 現在activeなpublication rule versionを1件に限定する。
131. quality check runとcandidateが使用したrule version IDをpinする。
132. rule version不足・不整合を正常と表示しない。
133. rule version編集・シミュレーションcommandをP0で返さない。
134. pricing pageがactive・scheduled・superseded・missing coverageを表示する。
135. pricing.readなしでrate amount・unit size・effective periodを返さない。
136. pricing.readがあっても許可scopeで未使用の全社rate catalogを返さない。
137. pricing definition編集commandを管理設定pageから返さない。
138. pricing不足の正式対応ownerがusage-costまたはincidentの場合、settings badgeへ二重計上しない。
139. 設定変更履歴を専用のeditable history tableへ保存しない。
140. 設定変更履歴をaudit_log・system_event・対象状態遷移から構成する。
141. 管理者要求と後続のscheduled applyをaudit logとsystem eventへ分離する。
142. 同じ設定変更をtimelineへ重複代表表示しない。
143. 設定変更履歴でsuccess・denied・failed・idempotent replayを区別する。
144. sensitive設定detailの閲覧自体を必要に応じて監査する。
145. 監査before/afterへMFA secret・invite token・provider credentialを保存しない。
146. role・scope・notification addressのbefore/afterを必要最小限にredactする。
147. W2・W3操作でreason・row version・idempotency keyを必須にする。
148. W3操作で直近15分以内のstep-upを必須にする。
149. command実行時にadmin status・MFA・capability・global scopeを再検査する。
150. scope変更後の古いavailable_commandsを利用できない。
151. 同じidempotency keyの再送で管理者・destination・version・changeを重複作成しない。
152. 設定applyのsystem actorがadmin actorを偽装しない。
153. notification dispatcherが任意宛先やcategoryへscopeを拡張しない。
154. 設定画面へsecret・token・Authorization header・cookieを返さない。
155. P0でカスタム管理者roleを作成しない。
156. P0で二名承認を作成しない。
157. P0で高度なrule editor・simulation UIを作成しない。
158. P0でpricing editor・為替・原価調整を作成しない。
159. P0で通知workflow builderを作成しない。
160. P0で日次の曜日別・顧客別scheduleを作成しない。
161. P0で新規AI provider・credential管理を作成しない。
162. P0でplanの顧客請求・売上・粗利を管理しない。

---

## 25. 実装順

1. 管理者・role・scopeの正式DDLと最後の管理者保護
2. notification destinationとdelivery test
3. daily automation stable row・version・scheduled change
4. AI model health/control readとplanned control command
5. plan version・AI model relation・scheduled activation
6. rule/pricing read-only projection
7. SettingsHealthSummaryとSidebarBadge
8. settings overview・各route read contract
9. settings change history
10. W2・W3共通dialog接続
11. audit・system event・system actor allowlist
12. 受け入れ条件の自動テストとvisual regression

---

## 26. 最終統合後の位置づけ

本仕様v1.1は、canonical manifest v1.0に含まれる管理設定の正式画面仕様である。

新しい画面仕様を追加する段階は完了した。実装時は、正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0、共通レイアウトv1.1から生成したAPI contractと`available_commands`だけを使用する。
