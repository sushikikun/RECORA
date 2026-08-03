# レコラ管理画面 P0 障害・監査画面仕様書

- 文書ID: `RECORA-ADMIN-P0-OPERATIONS-INCIDENT-AUDIT`
- 版: `1.1`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 対象: レコラ管理画面P0
- 前提仕様:
  - `RECORA-ADMIN-P0-STATE-MODEL v2.1`
  - `RECORA-ADMIN-P0-READ-MODEL v2.0`
  - `RECORA-ADMIN-P0-AUTHZ-AUDIT v2.0`
  - `RECORA-ADMIN-P0-COMMON-LAYOUT v1.1`
  - `RECORA-ADMIN-P0-MEASUREMENT-MANAGEMENT v1.1`
  - `RECORA-ADMIN-P0-QUALITY-EXCEPTION v1.1`
  - `RECORA-ADMIN-P0-PUBLICATION-MANAGEMENT v1.1`
- 優先順位: 本仕様は、障害を品質ケースへまとめる案、system eventを操作履歴として扱う案、componentの健康状態と意図的停止を同一statusへ保存する案、管理者がsystem blockを直接解除する案より優先する

---

## 0A. v1.1 最終横断統合更新

障害・監査の画面責任・P0範囲はv1.0から変更しない。最終横断レビューにより、前提基盤を正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0へ更新する。

- 状態enumとcommand state effectは正式状態モデルv2.1を正とする。
- 表示code、件数、badge、facet、available command入力はread model v2.0を正とする。
- capability、scope、risk、command code、auditは権限・監査仕様v2.0を正とする。
- 正式routeと採用文書はcanonical manifest v1.0を正とする。

- 管理者の回復batch要求を`RequestRecoveryBatch`、systemによる実体作成を`CreateRecoveryBatch`へ分離した。

---

## 0. 正式決定

障害・監査領域のP0を、次の原則で固定する。

1. `incident`は複数の顧客・プロジェクト・処理へ共通する原因または共通の復旧責任を表す。
2. 各プロジェクト固有の品質影響は`quality_exception_case`へ保持し、incidentと品質ケースを同一entityへ統合しない。
3. 同じincidentに関連する品質ケースは`incident_id`で視覚的にまとめるが、独立した障害作業グループを作らない。
4. 1件のsystem eventをそのまま1件のincidentにせず、検知rule、fingerprint、時間窓、影響scopeからincident化を判断する。
5. 未解決incidentの重複防止には安定した`incident_fingerprint`を使用する。
6. 解決済みincidentと同じ障害が再発した場合、過去incidentを再openせず、新incidentを作り`recurrence_of_incident_id`で関連付ける。
7. incidentの重大度とsystem eventのlevelを分離する。
8. incidentのstatusと、個別action・recovery plan・recovery stepのstatusを分離する。
9. affected customer・project数は`incident_scope`の確認済みscopeから導出し、globalな潜在影響を全顧客数として数えない。
10. scoped管理者には許可scope内の影響だけを返し、全体影響件数、全component evidence、global recovery controlを返さない。
11. Critical・High incidentのsidebar badgeは、未解決incidentをincident単位で数える。
12. incidentが品質ケースや公開異常を伴っても、各専門領域の責任単位は維持する。
13. 自動安全処理は、検知、incident関連、control変更、audit、system eventを相関IDで接続する。
14. `blocked_by_system`は管理者が直接通常状態へ書き戻せない。
15. system block解除は、正式なrecovery plan、検証済みstep、system発行のrecovery clearanceを必要とする。
16. recovery clearanceは対象controlと許可遷移を限定し、別対象や別状態へ流用できない。
17. clearanceの消費とcontrol解除は同一transactionで行う。
18. incident recovery planはdraftだけを編集可能とし、ready以降の内容を直接編集しない。
19. ready以降の計画変更は新しいplan versionを作る。
20. 段階的復旧はordered recovery stepで表現し、失敗stepの再試行では同じterminal rowを再openしない。
21. AIモデルの健康状態と利用制御を分ける。
22. AIモデルの健康状態は`system_component_state.health_state`、利用制御は`ai_model_control.control_state`を正とする。
23. `system_component_state`の健康状態に「paused」を含めない。
24. 意図した停止・制限はcontrolとして表示し、障害によるdegraded・unavailableと混同しない。
25. staleなcomponent観測を`operational`として扱わず、`unknown`としてfail-closed表示する。
26. 管理者はcomponentを直接「正常」に変更できず、health checkを要求できるだけとする。
27. system eventはappend-onlyで、既読・未読・解決statusを持たない。
28. eventの一覧上の集約はread modelで行い、永続的なevent groupを作らない。
29. `audit_log`は管理者操作とsystemによる重要control変更の唯一の監査保存元とする。
30. `system_event`は自動処理・検知・失敗・復旧の事実保存元とする。
31. 管理者要求を`audit_log`、後続のsystem処理を`system_event`へ分離する。
32. audit logとsystem eventを同じテーブルへ統合しない。
33. audit log、audit scope、system eventは追記型とし、アプリケーションから更新・削除しない。
34. audit detailの閲覧自体を敏感なreadとして監査する。
35. auditのbefore/afterへraw request、AI回答全文、公開payload、HTML、cookie、token、Authorization headerを保存しない。
36. system eventへ外部レスポンス本文やsecretを保存せず、安全化したsummaryと参照IDだけを保存する。
37. incident detail timelineはaudit log、system event、incident action、recovery step、control state changeを統合する。
38. 同じ管理者要求とその後続system eventを1行へ潰さず、相関を保った別の事実として表示する。
39. 同じcontrol変更をaudit、system event、state transitionの3行へ重複表示せず、代表行と展開情報へまとめる。
40. incident一覧から品質decision、公開復元、測定retryなどの専門操作を直接実行しない。
41. incident recovery planから作る回復batchは`incident_recovery` batchとし、通常日次や追加検証へ偽装しない。
42. failedまたはstopped recovery batchを直接resumeせず、新しいrecovery batchまたはstep attemptを作る。
43. Critical incidentではrecovery planを必須とする。
44. system block、AIモデルincident制御、global daily control、複数project回復batchを伴うHigh incidentでもrecovery planを必須とする。
45. incident resolvedは、未完了action、未完了plan、確認済み未回復scope、未処理clearanceが残る場合に許可しない。
46. Criticalまたはsystem blockを伴うincidentのresolvedはW3とする。
47. Medium・Lowの単純なincident resolvedはW2とする。
48. incidentをresolvedにしても、品質ケース、測定cycle、publication operationを暗黙解決しない。
49. quality caseが解決してもincidentを自動resolvedにしない。
50. P0では高度なincident postmortem editor、外部status page、pager duty roster、任意script実行、二名承認を作らない。

---

## 1. 目的

障害・監査領域は、レコラ全体で発生する共通原因、システム状態、復旧過程、管理者操作の証跡を扱う専門領域である。

管理者がこの領域で判断することは次である。

```text
いま共通障害が発生しているか
どのcomponent・AIモデル・顧客・projectへ影響しているか
自動安全処理は適用済みか
人が追加で行うべき緩和策はあるか
回復計画はどこまで進んでいるか
system blockを安全に解除できるか
システムの現在状態は新鮮で信頼できるか
どの自動処理イベントが発生したか
誰が何を実行し、成功・拒否・失敗したか
```

目標フローは次である。

```text
異常検知
  ↓
system event記録
  ↓
既存incident fingerprint照合
  ├ 一致する未解決incidentあり
  │  ↓
  │ scope・evidence・activity更新
  │
  └ 一致なし
     ↓
     新incident作成
  ↓
自動安全処理
  ↓
影響scope確認
  ↓
緩和・回復計画
  ↓
段階的復旧と検証
  ↓
recovery clearance
  ↓
system block解除
  ↓
監視
  ↓
解決
```

---

## 2. 責任範囲

### 2.1 障害・監査で行うこと

- 共通障害の一覧・詳細
- incident重大度・status・担当者
- component、AIモデル、顧客、projectへの影響scope
- 自動安全処理の確認
- 緩和actionの記録
- recovery planの作成・開始・失敗時の再試行
- incident recovery batchの作成
- 段階的なAIモデル復旧
- system block解除用clearanceの確認
- system component healthの確認
- system eventの検索・詳細確認
- audit logの検索・詳細確認
- 成功・拒否・失敗操作の確認
- correlation IDによる横断追跡

### 2.2 障害・監査で行わないこと

- 個別projectの品質decision
- 通常の測定retry判断
- publication candidateの本文修正
- publication versionの直接編集
- current pointerの任意ID指定
- 契約・entitlementの編集
- 顧客問い合わせ対応
- 原価調整・請求照合
- 通常の設定変更をincidentとして偽装すること
- system eventの既読化・削除・本文修正
- audit logの修正・削除
- 管理画面からの任意SQL、shell、script実行

### 2.3 専門領域との境界

| 状況 | 正式な主担当 |
|---|---|
| 1projectだけの測定項目失敗 | 測定管理または品質・例外 |
| 複数projectで同一AIモデルtimeout | 障害・監査 |
| candidateのoptional sectionだけ不適切 | 品質・例外 |
| publication engine全体の切り替え失敗 | 障害・監査 |
| 1projectの公開operation固有失敗 | 公開管理 |
| tenant mismatch・wrong project表示 | 障害・監査、Critical |
| 契約停止による日次対象外 | 顧客管理 |
| planned AIモデル停止 | 管理設定 |
| 障害対応の緊急AIモデル停止 | 障害・監査 |

---

## 3. 正式routeと領域内ナビゲーション

### 3.1 Route

```text
/admin/operations/incidents
/admin/operations/incidents/[incidentId]

/admin/operations/system-status
/admin/operations/events
/admin/operations/audit-logs
```

監査ログ詳細とsystem event詳細は、P0ではdrawerを正式方式とする。独立URLは必須としない。

### 3.2 ローカルナビゲーション

```text
障害
システム状態
システムイベント
監査ログ
```

### 3.3 Route責任

| Route | 責任 |
|---|---|
| `/admin/operations/incidents` | incident work queue・履歴 |
| `/admin/operations/incidents/[incidentId]` | 影響、action、recovery、evidence、timeline |
| `/admin/operations/system-status` | component health、AIモデルhealth/control、未解決incident |
| `/admin/operations/events` | append-only system eventの検索・集約表示 |
| `/admin/operations/audit-logs` | append-only audit logの検索・drawer詳細 |

---

## 4. 正式データ単位

P0の障害・監査領域で使用する正式データ単位は次である。

```text
incident
incident_scope
incident_action
incident_recovery_plan
incident_recovery_step
incident_recovery_clearance

system_component_state
ai_model_control
system_event

audit_log
audit_log_scope
```

関連する既存データ:

```text
quality_exception_case
quality_exception_finding
measurement_batch
publication_operation
publication_delivery_verification
project
customer
```

次は作らない。

```text
incident_work_group
quality_exception_group
system_event_group table
operation_history table
editable_audit_entry
```

---

## 5. Incidentの正式モデル

### 5.1 必須属性

```text
incident_id
incident_key
incident_fingerprint

source_type
source_rule_code nullable
source_system_event_id nullable

status
severity

title
summary
primary_component_code nullable
primary_ai_model_id nullable
owner_admin_id nullable

recurrence_of_incident_id nullable
duplicate_of_incident_id nullable

first_detected_at
opened_at
last_activity_at
monitoring_started_at nullable
resolved_at nullable
resolution_code nullable
resolution_summary nullable

row_version
created_at
updated_at
```

`incident_key`は管理画面表示用の安定IDとする。

例:

```text
INC-20260801-0042
```

### 5.2 Source type

```text
automatic_detection
manual_report
external_provider_signal
security_detection
```

`manual_report`であってもfingerprintとscope検査を省略しない。

### 5.3 Status

```text
open
mitigating
monitoring
resolved
```

許可遷移:

```text
open       -> mitigating
open       -> monitoring
open       -> resolved
mitigating -> monitoring
mitigating -> resolved
monitoring -> mitigating
monitoring -> resolved
```

`resolved`から他statusへ戻さない。再発時は新incidentを作る。

### 5.4 Severity

```text
critical
high
medium
low
```

代表的なCritical条件:

- tenant境界異常
- 別顧客・別projectへの誤表示
- current pointerの重大不整合
- rollback confirmation失敗
- 顧客データアクセス境界の重大異常
- 複数顧客へ誤った公開内容を配信し続ける可能性
- コア日次処理全体の長時間停止

severityは現在値を保存する正式状態である。変更履歴はaudit logとsystem eventへ残す。

### 5.5 Resolution code

```text
recovered
false_positive
duplicate
superseded
external_dependency_recovered
mitigated_with_restriction
```

`duplicate`では`duplicate_of_incident_id`を必須とする。

`mitigated_with_restriction`では、残るcontrol、対象scope、顧客影響、理由をresolution summaryへ明示する。

### 5.6 担当者

- incident担当者は有効な`system_operator`または`platform_admin`から選ぶ。
- scoped roleをincidentのglobal ownerにしない。
- 担当者変更だけでstatusを自動変更しない。
- owner未設定のCritical・High incidentは最優先の要対応とする。

---

## 6. Incident検知・重複防止・再発

### 6.1 Fingerprint

`incident_fingerprint`は少なくとも次からsystem側で生成する。

```text
normalized source_rule_code
primary_component_code
primary_ai_model_id nullable
failure_family
region or processing scope nullable
security boundary class nullable
```

管理者やbrowserからfingerprintを指定させない。

### 6.2 未解決incidentの重複防止

同じfingerprintの未解決incidentが存在する場合:

```text
新incidentを作らない
↓
既存incidentへsystem eventを関連付ける
↓
新しいincident scopeまたはevidenceを追加する
↓
last_activity_atを更新する
```

同じsystem eventを複数回受信しても、producer event IDによるdeduplicationでscopeやactionを重複作成しない。

### 6.3 解決済みincidentの再発

同じfingerprintの最新incidentが`resolved`の場合:

```text
新incidentを作成
recurrence_of_incident_id = 過去incident
```

過去incidentを再openしない。

### 6.4 Manual incident

管理者がmanual incidentを作成する場合も、作成前に候補incidentを表示する。

```text
同じcomponent
近いfailure family
直近の未解決incident
同じAIモデル
```

既存incidentへ関連付けるか、新規作成するかを明示する。

### 6.5 Incident化しないevent

次は通常、system eventだけで保持する。

- bounded retry内で回復した単発timeout
- 顧客影響のない短時間のwarning
- planned maintenanceに伴う意図したcontrol変更
- 正常な日次処理の開始・完了
- 一時的なrate limitで自動fallbackが成功したもの

incident化ruleはP0で読み取り表示できるが、高度な編集・シミュレーションはP1とする。

---

## 7. Incident scopeと顧客影響

### 7.1 Scope type

```text
global
system_component
ai_model
customer
project
daily_target_run
measurement_cycle
measurement_batch
publication_operation
```

### 7.2 Impact state

```text
potential
confirmed
contained
recovering
recovered
not_affected
```

意味:

| State | 意味 |
|---|---|
| `potential` | 影響可能性はあるが未確認 |
| `confirmed` | 現在の影響を確認済み |
| `contained` | 安全制御により拡大を止めたが通常状態ではない |
| `recovering` | 復旧処理中 |
| `recovered` | 影響終了を確認済み |
| `not_affected` | 調査の結果、影響なし |

### 7.3 Impact kind

```text
availability
latency
measurement_missing
analysis_incomplete
quality_check_unavailable
publication_blocked
incorrect_publication_risk
customer_access_blocked
notification_delivery
cost_calculation
security_boundary
other
```

### 7.4 Scopeの正式属性

```text
incident_scope_id
incident_id
scope_type
impact_kind
impact_state

component_code nullable
ai_model_id nullable
customer_id nullable
project_id nullable
daily_target_evaluation_run_id nullable
measurement_cycle_id nullable
measurement_batch_id nullable
publication_operation_id nullable

first_affected_at nullable
last_confirmed_at nullable
contained_at nullable
recovered_at nullable
source_system_event_id nullable
evidence_reference_id nullable
row_version
```

scope typeごとに、対応するtarget IDを1種類だけ必須とする。

### 7.5 件数の計算

```text
affected_customer_count
= impact_state in (confirmed, contained, recovering) のdistinct customer

affected_project_count
= impact_state in (confirmed, contained, recovering) のdistinct project
```

`potential`なglobal scopeを全顧客・全projectとして数えない。

`not_affected`と`recovered`は現在影響件数へ含めない。

### 7.6 Global incident

広範囲の異常を検知した段階では、次を許可する。

```text
scope_type = global
impact_state = potential
```

影響が確認できたcustomer・projectだけ個別scopeを追加する。

### 7.7 Scope修正

- systemが自動確認したscopeはsystem actorが更新する。
- 管理者によるscope確認・訂正は理由とevidenceを必須とする。
- scope行を削除しない。
- 誤検知は`not_affected`へ変更する。
- `recovered`から`confirmed`へ戻さず、再影響は新scope rowまたは新incidentとして記録する。

---

## 8. Incident status・重大度・Attention

### 8.1 Open

- 異常の原因・影響・安全処理を確認中
- owner未設定または初動判断待ちを含む

### 8.2 Mitigating

- 安全制御、停止、制限、回復batchなどの緩和処理中
- 少なくとも1つの非終端incident actionまたはrecovery planがある

### 8.3 Monitoring

次を満たした場合に移行できる。

```text
必要な緩和actionがcompleted
主要scopeがrecoveredまたはcontained
新規重大eventが一定時間発生していない
monitoring windowが設定済み
```

### 8.4 Resolved

解決には次を必須とする。

```text
非終端incident action = 0
非終端recovery plan = 0
impact_state in (confirmed, recovering) = 0
未消費の有効clearance = 0
resolution code・summaryあり
Critical/Highは回復evidenceあり
```

system blockを伴ったincidentでは、対象blockがclearanceにより解除済み、または意図的に継続する理由が明示されていなければならない。

### 8.5 Attention owner

read modelで次のように導出する。

| 条件 | Owner |
|---|---|
| resolved | none |
| plan・step・health checkが自動実行中 | system |
| failed step、clearance不足、判断待ち | human |
| open/mitigatingで自動処理なし | human |
| monitoring window中で新規異常なし | system |
| monitoringで新規重大eventあり | human |

sidebar badgeはattention ownerに関係なく、未解決Critical・High incident数を表示する。

---

## 9. 自動安全処理

### 9.1 原則

重大異常時は、顧客被害の拡大防止を人の確認より先に行える。

代表的な処理:

```text
AIモデルrestricted / paused
project automation blocked_by_system
publication blocked_by_system
customer access blocked_by_system
batch安全停止
candidate generation停止
current pointer rollback
```

### 9.2 必須関連

systemによる重要control変更では、次を同じcorrelationで関連付ける。

```text
検知system_event
incident
incident_scope
incident_action
audit_log
control state change
後続system_event
```

### 9.3 原子性

安全control変更と、最低限のincident・audit記録は同一transactionまたはtransactional outboxで保証する。

次は禁止する。

```text
controlだけblocked_by_system
incidentなし
auditなし
correlationなし
```

### 9.4 失敗時

incident作成や監査記録に失敗した場合は、安全側へ倒す。

- 既に適用済みのsystem blockを勝手に解除しない
- 管理画面へ「正常」と返さない
- security monitoringへ失敗を送る
- recovery clearanceを発行しない

### 9.5 専門状態への影響

incidentを作成しても、次を一括で同じstatusへ変更しない。

- quality case
- measurement cycle
- publication operation
- customer inquiry

各entityは自身の正式状態を維持し、incident IDで関連付ける。

---

## 10. Incident action

### 10.1 Action category

```text
investigation
mitigation
safety_control
recovery
verification
communication
annotation
```

### 10.2 Status

```text
requested
running
completed
failed
cancelled
```

terminal actionを再openしない。再試行は新actionを作り`retry_of_incident_action_id`を保持する。

### 10.3 正式属性

```text
incident_action_id
incident_id
action_category
operation_code
target_type
target_id
status
requested_by_type
requested_by_id
initiated_by_admin_id nullable
retry_of_incident_action_id nullable
recovery_plan_id nullable
recovery_step_id nullable
reason_code
reason_text nullable
failure_code nullable
failure_summary nullable
started_at nullable
completed_at nullable
correlation_id
idempotency_key
```

### 10.4 Operation code例

```text
collect_evidence
confirm_customer_impact
restrict_ai_model
pause_ai_model
stop_measurement_batch
block_project_automation
block_publication
block_customer_access
run_health_check
create_recovery_batch
verify_customer_route
external_provider_escalation
record_operator_note
```

P0では任意のoperation code、shell command、script本文を入力させない。

### 10.5 Annotation

調査メモ・外部providerへの連絡記録は`annotation`または`communication` actionとして追記する。

既存action本文を編集・削除しない。訂正は新actionから元actionを参照する。

---

## 11. Recovery planと段階的復旧

### 11.1 Plan status

```text
draft
ready
running
verifying
completed
failed
cancelled
superseded
```

### 11.2 Plan原則

- draftだけ編集可能
- ready以降は不変
- ready以降の変更は新plan versionを作る
- incidentごとに非終端planは最大1件
- Critical incidentはplan必須
- planには成功条件、失敗時rollback条件、monitoring windowを必須化する

### 11.3 Plan属性

```text
incident_recovery_plan_id
incident_id
plan_version
status
recovery_mode
supersedes_plan_id nullable
created_by_admin_id nullable
success_criteria_summary
rollback_criteria_summary
monitoring_window_seconds
ready_at nullable
started_at nullable
verification_started_at nullable
completed_at nullable
failure_code nullable
row_version
```

`recovery_mode`:

```text
automatic
staged
manual_assisted
```

### 11.4 Recovery step

step type:

```text
health_check
canary_execution
limited_enablement
recovery_batch
publication_verification
customer_route_verification
observation_window
issue_clearance
restore_full_capacity
```

step status:

```text
pending
queued
running
verifying
completed
failed
skipped
cancelled
```

### 11.5 Step属性

```text
incident_recovery_step_id
incident_recovery_plan_id
logical_step_key
sequence_number
attempt_number
retry_of_step_id nullable
step_type
target_type
target_id nullable
depends_on_logical_step_key nullable
status
success_condition_code
rollback_condition_code nullable
measurement_batch_id nullable
started_at nullable
completed_at nullable
failure_code nullable
evidence_reference_id nullable
correlation_id
```

同じlogical stepの再試行では、terminal step rowを更新せず、attempt numberを増やした新rowを作る。

### 11.6 Step実行順

```text
health check
  ↓
canaryまたは限定的enablement
  ↓
recovery batch
  ↓
顧客route・publication verification
  ↓
observation window
  ↓
clearance発行
  ↓
full capacityまたはcontrol解除
```

すべてのincidentで全stepを要求するわけではない。対象controlと障害種別に応じ、allowlist済みtemplateから必要stepを選ぶ。

### 11.7 Recovery batch

- batch typeは`incident_recovery`
- incident ID、recovery plan ID、recovery step IDを必須化する
- 対象scopeとAIモデルをplanから解決する
- arbitrary promptを入力できない
- failed/stopped batchを直接resumeしない
- retryでは新batchと新step attemptを作る
- recovery結果を通常日次cycleへ直接昇格させない

### 11.8 Plan失敗

planまたは必須stepが安全に継続できない場合:

```text
plan = failed
incident = mitigatingのまま
system block・restrictionを維持
新plan versionを作成可能
```

failed planをrunningへ戻さない。

---

## 12. Recovery clearance

### 12.1 目的

`blocked_by_system`やincident-linked AIモデル制御を、管理者判断だけで解除しないためのsystem発行証跡である。

### 12.2 Clearance status

```text
issued
consumed
revoked
expired
```

### 12.3 正式属性

```text
incident_recovery_clearance_id
incident_id
incident_recovery_plan_id
source_recovery_step_id

target_control_type
target_customer_id nullable
target_project_id nullable
target_ai_model_id nullable
target_component_code nullable

permitted_from_state
permitted_to_state
expected_target_row_version
status
issued_by_component_code
issued_at
expires_at
consumed_at nullable
consumed_by_action_id nullable
evidence_hash
correlation_id
```

### 12.4 発行条件

systemだけが発行できる。

```text
plan status = verifyingまたはrunning
必須step completed
verification passed
対象state・row version一致
未解決の重大evidenceなし
```

### 12.5 消費条件

```text
clearance.status = issued
expires_at > now
対象control一致
from state一致
row version一致
incident・plan一致
```

control変更と`consumed`化を同一transactionで行う。

### 12.6 無効化

次ではclearanceを使用できない。

- 期限切れ
- 新しい重大event発生
- target row version drift
- 別incidentのcontrol
- 別のfrom/to transition
- source planがcancelled・failed・superseded

管理者はclearanceを作成、延長、再有効化できない。

---

## 13. AIモデル制御と段階的復旧

### 13.1 Control state

```text
enabled
restricted
paused
```

### 13.2 Health state

AIモデルhealthは`system_component_state.health_state`から取得する。

```text
operational
degraded
unavailable
unknown
```

controlとhealthを同じlabelへまとめない。

例:

```text
health = operational
control = restricted
表示 = 正常応答・障害対応で利用制限中
```

### 13.3 Control origin

```text
planned_admin
incident_safety
system_policy
```

`incident_safety`では`incident_id`を必須とする。

### 13.4 Restricted policy

`restricted`ではallowlist済みschemaで制限内容を保持する。

```text
blocked_processing_purposes[]
blocked_regions[]
max_concurrency nullable
allowed_recovery_only boolean
policy_schema_version
```

自由形式の実行ruleを保存しない。

### 13.5 遷移

通常:

```text
enabled -> restricted
enabled -> paused
restricted -> enabled
restricted -> paused
paused -> restricted
paused -> enabled
```

incident-linked controlでは次を必須とする。

```text
paused -> restricted
restricted -> enabled
```

の段階的復旧を原則とする。

planが明示的に許可し、検証済みclearanceがある場合だけ`paused -> enabled`を許可できる。

### 13.6 Planned controlとの境界

- planned maintenanceや標準設定変更は管理設定を主導線とする
- 障害・監査ではincident-linked emergency controlを扱う
- 同じAIモデルのcontrol stateは1つの正式write modelを共有する
- 2画面が別々のcontrol状態を保存しない

---

## 14. System component state

### 14.1 Health state

```text
operational
degraded
unavailable
unknown
```

`paused`はhealth stateに含めない。

### 14.2 Component code

P0の主要component例:

```text
auth_service
customer_portal
database
queue_scheduler
setup_orchestrator
daily_targeting
measurement_orchestrator
analysis_engine
candidate_generator
quality_engine
publication_engine
delivery_verifier
notification_delivery
usage_cost_calculator
ai_model_provider
```

component codeは管理画面から自由作成しない。

### 14.3 正式属性

```text
system_component_state_id
component_code
component_instance_key
ai_model_id nullable
region_code nullable
health_state
health_reason_code nullable
observed_at
fresh_until
source_system_event_id nullable
evidence_summary nullable
row_version
updated_at
```

### 14.4 Freshness

```text
now <= fresh_until
→ 観測値を使用

now > fresh_until
→ read modelではunknown
```

DBに最後の`operational`が残っていても、staleなら正常表示しない。

### 14.5 更新主体

- health probe
- orchestrator
- provider monitor
- delivery verifier
- security detector

などのsystem actorだけが更新する。

管理者は`RunSystemHealthCheck`を要求できるが、結果を指定できない。

### 14.6 履歴

current rowは現在値として更新可能だが、変更前後をsystem eventへ追記する。

component history専用の別editable tableを作らない。

---

## 15. System event

### 15.1 正式属性

```text
system_event_id
producer_component_code
producer_event_id
event_code
event_class
event_level
event_summary

component_code nullable
ai_model_id nullable
customer_id nullable
project_id nullable
incident_id nullable
target_type nullable
target_id nullable

correlation_id
causation_id nullable
payload_schema_version
sanitized_payload nullable
occurred_at
recorded_at
```

### 15.2 Event class

```text
lifecycle
control
failure
recovery
security
delivery
notification
cost
```

### 15.3 Event level

```text
info
warning
error
critical
```

event levelはincident severityではない。

例:

```text
多数のwarning event
→ High incident

単発critical security detector event
→ Critical incident
```

### 15.4 Deduplication

```text
UNIQUE(producer_component_code, producer_event_id)
```

producer event IDがない外部eventは、安全化したdedup keyをserver側で生成する。

### 15.5 Payload

許可:

- error family
- HTTP status class
- provider code
- latency bucket
- count
- retry number
- internal entity ID
- checksum

禁止:

- prompt全文
- AI回答全文
- raw HTML
- Authorization header
- cookie
- token
- API key
- 顧客個人情報の不要な複製

### 15.6 一覧上の集約

画面では、同じevent code・component・correlation・短時間窓のeventをread modelでまとめられる。

```text
event group summary
  ├ occurrence count
  ├ first occurred
  ├ last occurred
  └ individual events
```

永続的な`system_event_group`は作らない。

### 15.7 既読・解決

system eventへ次を保存しない。

```text
is_read
acknowledged
resolved
owner
```

対応が必要ならincident、quality case、publication attentionなどの正式作業単位へ接続する。

---

## 16. Audit log

### 16.1 単一保存元

管理者・systemの重要操作は`audit_log`へ1回だけ保存する。

詳細ページ専用の操作履歴tableを作らない。

### 16.2 必須属性

```text
audit_log_id
occurred_at

actor_type
actor_id
actor_display_snapshot

action_code
risk_class
result
outcome_code

target_type
target_id
customer_id nullable
project_id nullable
scope_class

capability_code nullable
role_assignment_id nullable
authorization_scope_type nullable
authorization_scope_id nullable

before_summary nullable
after_summary nullable
reason_code nullable
reason_text nullable

request_id
correlation_id
idempotency_key nullable

auth_assurance
step_up_verified
session_id_hash nullable
source_ip_hash nullable
user_agent_class nullable

corrects_audit_log_id nullable
```

### 16.3 Result

```text
success
denied
failed
```

代表outcome:

```text
COMMITTED
ACCEPTED_ASYNC
IDEMPOTENT_REPLAY
CAPABILITY_DENIED
SCOPE_DENIED
STATE_CONFLICT
STEP_UP_REQUIRED
VALIDATION_FAILED
TRANSACTION_FAILED
DOWNSTREAM_ENQUEUE_FAILED
```

### 16.4 Append-only

- UPDATE禁止
- DELETE禁止
- 訂正は新audit rowを追加する
- 訂正rowは`corrects_audit_log_id`を保持する
- P0画面から任意のaudit訂正を作る機能は作らない

### 16.5 Audit scope

bulk・global操作でもaudit logを対象数だけ複製しない。

```text
audit_log 1行
＋
audit_log_scope N行
```

scoped audit検索は`audit_log_scope`を正とする。

### 16.6 Sensitive read

次の閲覧をauditする。

- audit log詳細
- incidentのsensitive system evidence
- candidate/version full payload
- delivery verification evidence
- 管理者role・scope詳細
- 問い合わせ内部メモ
- 原価CSV

read auditには内容を複製せず、対象IDとaccess typeだけを保存する。

### 16.7 Denied操作

scope不足や対象不存在を外部responseで必要以上に区別しない。

auditへは内部reasonを保存できるが、scope外target名や本文をbefore/afterへ保存しない。

---

## 17. Audit log・system event・状態遷移の境界

| 事象 | audit_log | system_event | Write state |
|---|---:|---:|---:|
| 管理者がincidentを作成 | 必須 | 通知・自動処理があれば記録 | incident |
| detectorがincidentを自動作成 | system control audit必須 | 検知・作成を記録 | incident |
| 管理者がrecovery planを開始 | 必須 | step開始・完了を記録 | plan/step |
| systemがAIモデルをpause | 必須 | 検知・control適用を記録 | ai_model_control |
| 管理者がhealth check要求 | 必須 | probe開始・結果 | component state |
| component healthが変化 | 通常不要 | 必須 | component state |
| scope不足でincident操作拒否 | 必須 | 不要 | 変更なし |
| system eventを閲覧 | 通常audit不要 | 不要 | 変更なし |
| audit detailを閲覧 | 必須 | 不要 | 変更なし |

タイムラインでは同じ事実を重複表示しない。

代表表示:

```text
管理者要求
  └ 展開: 後続system event、action、step
```

または

```text
system safety control変更
  └ 展開: detector event、incident、audit
```

---

## 18. Incident一覧

### 18.1 Layout

Template T3 `Work Queue`を使用する。

### 18.2 View

```text
未対応
対応中
監視中
解決済み
```

正式predicate:

| View | Predicate |
|---|---|
| 未対応 | unresolved、human action required、ownerなしまたは判断待ち |
| 対応中 | open/mitigating、ownerあり、またはaction/plan進行中 |
| 監視中 | status=`monitoring` |
| 解決済み | status=`resolved` |

### 18.3 Compact summary

```text
未解決Critical
未解決High
影響確認済みproject
system block中の対象
復旧計画実行中
```

件数は同じsnapshot、同じscopeから返す。

### 18.4 主要列

```text
重大度
障害ID・タイトル
状態
主component / AIモデル
影響範囲
安全処理
担当者
復旧状況
最終更新
操作
```

### 18.5 Default sort

```text
unresolved first
critical -> high -> medium -> low
human action required first
ownerなし first
last_activity_at desc
incident_id desc
```

### 18.6 Filter

```text
status
severity
component
AI model
customer
project
owner
impact state
safety control
recovery plan status
date range
incident key exact
correlation ID exact
```

P0ではincident summaryの全文検索を必須としない。

### 18.7 Grouping

incident一覧ではquality caseを子行として大量表示しない。

行内に次を表示し、詳細へ遷移する。

```text
関連品質ケース 12件
影響project 8件
```

---

## 19. Incident詳細

### 19.1 Page structure

Template T4 `Entity Detail`を使用する。

```text
結論・重大度・status
現在の顧客影響と安全処理
主要操作

概要
影響範囲
対応・復旧
関連ケース
履歴
```

### 19.2 結論header

表示:

```text
incident key
severity
status
タイトル
主component / AI model
影響customer・project数
現在の安全control
owner
last activity
freshness
```

Criticalでは、最上部へ顧客安全状態を表示する。

例:

```text
公開をシステム停止しています。現在公開版pointerは保持されています。
```

```text
Geminiの正式日次利用を停止し、障害復旧検証だけ許可しています。
```

### 19.3 概要tab

```text
検知元
fingerprint要約
最初の検知時刻
現在の仮説・summary
主要evidence
自動安全処理
component health
AI model health/control
関連operation・batch
```

fingerprint内部値はglobal operatorだけへ返し、scoped roleには返さない。

### 19.4 影響範囲tab

列:

```text
scope type
顧客・project
impact kind
impact state
初回影響
最終確認
安全処理
関連quality case
```

scoped viewerには許可scope内の行だけを返す。

全体影響件数を残して行だけ隠すことは禁止する。

### 19.5 対応・復旧tab

```text
incident actions
current recovery plan
ordered recovery steps
recovery batches
clearances
monitoring window
```

plan editorはdraft時だけ表示する。

ready以降は読み取り専用とし、変更には新plan version作成を要求する。

### 19.6 関連ケースtab

```text
quality case
publication operation
measurement batch
measurement cycle
system event group
```

各専門entityのstatusをincident画面から直接変更しない。

### 19.7 履歴tab

```text
audit log
system event
incident action
recovery step
scope state change
component health change
control state change
```

correlation単位で展開可能にする。

### 19.8 操作

画面上部へ、現在状態で利用可能な操作だけを返す。

```text
担当者設定
summary更新
severity変更
調査・緩和action記録
recovery plan作成
plan開始
失敗step再試行
health check要求
recovery batch作成
incident解決
```

専門ページの操作はlinkだけを返す。

---

## 20. System status画面

### 20.1 目的

現在のcomponent health、意図したcontrol、未解決incident、データ鮮度を一画面で確認する。

### 20.2 Layout

```text
全体状態
重要component
AIモデル
未解決incident
整合性・鮮度警告
```

### 20.3 Overall state

```text
critical
high
degraded
restricted
normal
unknown
```

優先順位:

```text
Critical incidentまたはcore component unavailable
→ critical

High incident
→ high

degraded component
→ degraded

健康上の異常はないが意図した制限あり
→ restricted

必要componentが新鮮でoperational
→ normal

stale・欠損・不整合
→ unknown
```

planned restrictionを`degraded`へ変換しない。

### 20.4 Component row

```text
component
health state
control summary
last observed
freshness
関連incident
影響summary
health check
```

### 20.5 AI model row

```text
provider / model
health state
control state
restriction summary
last successful response
error rate bucket
related incident
recovery stage
```

内部単価や顧客promptは返さない。

### 20.6 操作境界

- system statusからcomponentを直接operationalへ設定できない
- `RunSystemHealthCheck`だけを提供できる
- incident-linked emergency AI model controlはincidentを必須とする
- planned controlは管理設定へ遷移する
- blocked_by_system解除はclearance経由だけとする

### 20.7 Consistency warning

例:

```text
AIモデルhealthはoperationalだがcontrolはincident pause中
component観測がfreshness SLAを超過
incident resolvedだがsystem blockが残存
clearance issued後にtarget row versionが変化
```

warningを自動的に正常へ丸めない。

---

## 21. System events画面

### 21.1 Layout

Template T2 `Standard List`を使用する。

デフォルトではread model上のevent groupを1行表示し、展開で個別eventを確認する。

### 21.2 主要列

```text
最終発生時刻
level
component
イベント
発生回数
顧客・project要約
関連incident
correlation ID
詳細
```

### 21.3 Filter

```text
date range
event class
event level
event code
component
AI model
customer
project
incident
correlation ID exact
producer event ID exact
```

標準期間は直近7日、API上限は90日とする。

### 21.4 Detail drawer

```text
event ID
occurred / recorded
producer
event code・class・level
安全化summary
sanitized fields
entity references
incident
correlation / causation
related events
```

raw provider payload、secret、AI回答全文を返さない。

### 21.5 Eventからの遷移

- incident関連あり: incident詳細
- project関連あり: project詳細
- batch関連あり: batch詳細
- publication operation関連あり: operation drawer

routeはserverが認可済みの場合だけ返す。

### 21.6 操作

system event自体へ既読、担当、解決、削除操作を置かない。

新incident作成が可能な管理者には、event contextを引き継いだ`CreateIncident`を返せる。ただしfingerprint候補照合を必須とする。

---

## 22. Audit logs画面

### 22.1 Layout

Template T2 `Standard List`を使用する。

### 22.2 主要列

```text
時刻
actor
操作
risk
result
対象
顧客・project
理由要約
correlation ID
詳細
```

### 22.3 Filter

```text
date range
result
outcome code
risk class
actor type
actor ID
action code
target type
customer
project
correlation ID exact
request ID exact
audit log ID exact
```

標準期間は直近30日、API上限は180日とする。

P0ではbefore/afterやreason本文の全文検索を必須としない。

### 22.4 Detail drawer

```text
audit log ID
occurred at
actor snapshot
action・risk・result・outcome
target
scope
capability・role assignment
authorization context
before / after summary
reason
request / correlation / idempotency
auth assurance・step-up
redacted security context
related system events
corrected entry relation
```

### 22.5 Scoped audit

scoped auditorには次だけを返す。

```text
許可されたcustomer/projectへ関連するaudit_log_scope
```

返さないもの:

- scope外の件数
- global管理者操作
- 全体設定変更
- 全体facet
- scope denialの対象名称

### 22.6 Global audit

`audit.read.global`とglobal scopeを持つ管理者だけが全体監査を閲覧できる。

### 22.7 Detail read監査

監査drawerを開くrequestは`READ_AUDIT_DETAIL`としてauditする。

新しく作られたread audit rowを自動的にdrawer表示しないため、無限再帰にはならない。

### 22.8 Export

P0では監査ログCSV exportを作らない。原価CSVとは分離する。

---

## 23. Command・Risk class

### 23.1 Incident command

| Command | Risk | 主な要件 |
|---|---:|---|
| `CreateIncident` | W1 | global、fingerprint候補照合 |
| `AssignIncident` | W1 | 有効なsystem operatorまたはplatform admin |
| `UpdateIncidentSummary` | W1 | row version、allowlist field |
| `ChangeIncidentSeverity` | W2 | 理由、影響summary、row version |
| `RecordIncidentAction` | W1 | operation code allowlist |
| `ConfirmIncidentScope` | W1 | evidence、scope整合 |
| `MarkIncidentScopeNotAffected` | W1 | 理由・evidence |
| `CreateIncidentRecoveryPlan` | W2 | plan template、影響・rollback確認 |
| `ReadyIncidentRecoveryPlan` | W2 | 全必須step・成功条件検査 |
| `StartIncidentRecoveryPlan` | W2 | state・control・scope再検査 |
| `RetryIncidentRecoveryStep` | W2 | terminal failed step、新attempt |
| `CancelIncidentRecoveryPlan` | W2 | safety control維持を確認 |
| `RequestRecoveryBatch` | W2 | incident/plan/step scope固定。受理後、systemが`CreateRecoveryBatch`を実行 |
| `RunSystemHealthCheck` | W1 | 非同期、結果指定不可 |
| `ResolveIncident` | W2/W3 | Critical・system blockありはW3 |

### 23.2 AI model command

| Command | Risk | 主な要件 |
|---|---:|---|
| `ChangeAiModelControl` | W3 | global、理由、impact、step-up |
| `ApplyIncidentAiModelRestriction` | system / W3 request | incident必須 |
| `ReleaseAiModelControlWithClearance` | system only | valid clearanceを原子的に消費 |

### 23.3 System-only command

```text
DetectOrCorrelateIncident
AddIncidentScopeFromEvent
ApplyAutomaticSafetyControl
UpdateSystemComponentHealth
IssueIncidentRecoveryClearance
ConsumeClearanceAndReleaseControl
AdvanceRecoveryStep
CompleteRecoveryPlanVerification
```

管理者はsystem-only endpointを直接呼べない。

### 23.4 Resolve risk

```text
Medium / Low、system blockなし
→ W2

Critical / Highでsystem block・AI model pause・global controlあり
→ W3 + step-up + typed confirmation
```

incident解決によってcontrolを暗黙解除しない。

---

## 24. 権限・Scope・Redaction

### 24.1 Capability

```text
incident.read.scoped
incident.read.global
incident.sensitive.read
incident.manage
incident.recovery.manage
incident.resolve

system_status.read
system_health_check.run
system_event.read

ai_model_control.read
ai_model_control.manage

audit.read.scoped
audit.read.global
audit.detail.read
```

### 24.2 標準役割

#### System operator

```text
incident.read.scoped
incident.read.global
incident.sensitive.read
incident.manage
incident.recovery.manage
incident.resolve
system_status.read
system_health_check.run
system_event.read
ai_model_control.read
ai_model_control.manage
```

#### Auditor

```text
incident.read.scoped
incident.read.global
incident.sensitive.read
system_status.read
system_event.read
audit.read.scoped
audit.read.global
audit.detail.read
```

write capabilityは付与しない。

#### Scoped quality・publication・measurement operator

```text
incident.read.scoped
```

許可scopeへの影響要約だけを返す。

### 24.3 Global write

incident管理、system control、recovery plan、health checkはglobal scopeを必要とする。

project scopeだけでglobal incidentを変更できない。

### 24.4 Scoped incident表示

返せるもの:

- incident key・title
- current severity・status
- 許可scope内の影響
- そのscopeへ適用された安全処理
- 関連quality case
- safe fallback

返さないもの:

- 全顧客・全project件数
- scope外の名称
- system fingerprint
- provider内部evidence
- global control command
- recovery planの機密条件
- security detector detail

### 24.5 Sensitive evidence

`incident.sensitive.read`を要求する例:

- tenant binding evidence
- security detector evidence
- provider failure detail
- rollback confirmation evidence
- component内部diagnostic

閲覧時にaudit descriptorを返し、serverで監査する。

### 24.6 Secret

どのroleにも返さない。

```text
API key
token
cookie
Authorization header
raw credential
full external provider payload
```

---

## 25. Read contract

### 25.1 `GetIncidentOverview`

```text
snapshot
scope
freshness
summary
view_facets
rows
section_errors
```

### 25.2 `IncidentSummary`

```text
incident_id
incident_key
title
summary_excerpt
severity
status
source_type
primary_component_code
primary_ai_model_id
owner_admin_id
owner_display

confirmed_customer_count
confirmed_project_count
potential_scope_count
contained_scope_count
recovering_scope_count
linked_quality_case_count

active_safety_control_codes[]
recovery_plan_status
recovery_stage_code
failed_recovery_step_count
valid_clearance_count

human_action_required
attention_owner
first_detected_at
last_activity_at
monitoring_started_at
resolved_at
row_version
route
available_commands
```

### 25.3 `GetIncidentDetail`

```text
snapshot
incident_summary
customer_project_impact_summary
system_evidence_section
affected_scopes[]
actions[]
recovery_plan
recovery_steps[]
recovery_batches[]
clearances[]
linked_quality_cases[]
linked_measurement_entities[]
linked_publication_entities[]
component_state_changes[]
recent_timeline[]
available_commands
section_errors
sensitive_read_audit_descriptor
```

### 25.4 `GetSystemStatus`

```text
snapshot
freshness
overall_state
summary
components[]
ai_models[]
unresolved_incidents[]
consistency_warnings[]
available_commands
section_errors
```

### 25.5 `SystemComponentHealthSummary`

```text
component_code
component_instance_key
ai_model_id
region_code
health_state
health_reason_code
observed_at
fresh_until
freshness_state
related_incident_count
control_summary
last_success_at
row_version
```

### 25.6 `AiModelOperationalSummary`

```text
ai_model_id
provider_name
model_name
health_state
control_state
control_origin
restriction_summary
incident_id
last_success_at
last_failure_at
freshness_state
recovery_stage
available_commands
```

### 25.7 `GetSystemEvents`

```text
snapshot
filters
facet_counts
grouped_rows[]
page_info
section_errors
```

### 25.8 `SystemEventSummary`

```text
system_event_id
event_code
event_class
event_level
event_summary
producer_component_code
component_code
ai_model_id
customer_id
project_id
incident_id
correlation_id
causation_id
occurred_at
recorded_at
route_descriptors
redaction_state
```

### 25.9 `GetAuditLogs`

```text
snapshot
filters
facet_counts
rows[]
page_info
section_errors
```

### 25.10 `AuditLogSummary`

```text
audit_log_id
occurred_at
actor_type
actor_display
actor_id

action_code
risk_class
result
outcome_code

target_type
target_id
target_display
customer_id
project_id
reason_summary
correlation_id
request_id
has_detail_access
```

### 25.11 Detail drawer

system event・audit logのdetailは親snapshotと対象versionを検査する。

```text
parent_snapshot_id
expected_event_id or audit_log_id
expected_visibility_scope
```

### 25.12 Count consistency

```text
sidebar badge
incident summary
view facet
list row predicate
```

は同じeffective scope・snapshotから計算する。

---

## 26. Concurrency・Idempotency

### 26.1 Incident

- 同じfingerprintの未解決incidentは最大1件
- incident row versionでsummary、severity、owner、status競合を検出
- resolvedとscope追加が競合した場合、scope側を再評価し、必要なら新incidentを作る

### 26.2 Recovery plan

- incidentごとに非終端plan最大1件
- plan versionはincident単位で排他的に採番
- ready以降のplan rowを更新しない
- step logical key・attempt numberを一意化

### 26.3 Clearance

- 同一target・from/toへ有効clearance最大1件
- clearance消費とcontrol state changeを同一transactionで実行
- idempotent replayで2回解除しない

### 26.4 Component health

- component instance単位でcurrent row最大1件
- 古いobserved_atの結果が新しいhealth stateを上書きしない
- freshness期限切れをDB updateなしでread modelがunknownへ変換する

### 26.5 System event

- producer component・producer event IDで一意
- duplicate eventは新rowを作らず既存IDを返す
- event groupはread modelだけで生成する

### 26.6 Command

すべてのW1/W2/W3 commandで次を使用する。

```text
idempotency key
row version
request ID
correlation ID
```

---

## 27. Freshness・Unknown・Error

### 27.1 Incident

incident rowが取得できても、scope・component・recoveryの主要sectionがstaleなら「正常」「影響なし」と表示しない。

### 27.2 System status

- stale componentはunknown
- health source欠損はunknown
- control取得失敗をenabledとして扱わない
- incident取得失敗を未解決0件として扱わない
- overall stateの根拠が不足する場合はunknown

### 27.3 Events

- event取得失敗を0件へ変換しない
- partial producer failureをsection warningとして表示する
- recorded_at遅延を明示する

### 27.4 Audit

- audit source failure時に「操作なし」と表示しない
- scoped facet failure時に全体countを代用しない
- detail取得失敗時に一覧summaryだけを残し、before/afterを推測しない

### 27.5 Write command

次ではW2/W3 commandを返さない。

```text
incident row stale
recovery plan stale
component health unknown
control row stale
clearance不整合
scope section failure
role・scope不明
```

---

## 28. Audit要件

### 28.1 必須audit

- incident作成
- owner変更
- summary更新
- severity変更
- scopeの管理者確認・not affected化
- recovery plan作成・ready化・開始・取消
- recovery step再試行
- recovery batch要求
- health check要求
- AIモデルcontrol変更
- incident resolved
- sensitive incident evidence閲覧
- audit detail閲覧

### 28.2 before/after

保存するもの:

```text
incident status・severity・owner
scope impact state
plan ID・version・status
step ID・attempt・status
AI model control state
clearance ID・status
component code
```

保存しないもの:

```text
raw diagnostic
provider response body
prompt・AI answer
customer payload
secret
```

### 28.3 非同期境界

```text
管理者がplan開始
→ audit_log ACCEPTED_ASYNC

step実行・batch作成・health check・clearance発行
→ system_event
```

完了時に同じ管理者操作を再度auditしない。

### 28.4 System control audit

systemによるblocked_by_system、AIモデルpause、clearance消費でもaudit logを必須とする。

actor typeは`system`とし、管理者へ偽装しない。

---

## 29. UI・アクセシビリティ・Responsive

- 1366×768で未解決Critical・High、上位3incident、現在の安全処理を確認できる。
- 1440×900でincident概要、影響範囲、recovery progressを同時に確認できる。
- page全体の横スクロールを発生させない。
- 長いevent code、component key、incident titleは折り返しまたは省略＋tooltipを使用する。
- severity・health・controlを色だけで表現しない。
- `health=operational / control=paused`のような複合状態を2つのlabelで明示する。
- Critical操作のW3 dialogはfocus trap、keyboard、step-up、typed confirmationへ対応する。
- table、drawer、tabs、timelineはkeyboard操作可能とする。
- system event・audit detail drawerを閉じた後、元行へfocusを戻す。
- stale、unknown、partial failure、permission denied、emptyを別状態として表示する。
- scoped redactionを「0件」と誤表示しない。
- event groupを展開しても個別eventの順序を安定させる。
- timelineは同時刻にstable sequenceを使用する。

---

## 30. P0で作らないもの

- 独立した障害作業グループ
- incident同士の高度なmerge editor
- postmortem文書editor
- root cause analysis diagram builder
- on-call roster・pager scheduling
- SMS・電話によるpager機能
- 外部status page公開
- 顧客向けincident通知配信
- arbitrary shell・SQL・script実行
- recovery planの自由形式workflow builder
- custom recovery step type作成
- AIモデルtraffic percentageの高度なcanary UI
- system eventの既読・未読
- system eventの手動削除・編集
- audit logの編集・削除
- audit log CSV export
- 高度なSIEM連携UI
- 二名承認
- mobile専用管理画面

---

## 31. 受け入れ条件

障害・監査実装は、最低限次を自動テスト・画面検証で証明する。

### 31.1 Incident生成・重複防止

1. automatic detectionからincidentを作成できる。
2. manual reportからincidentを作成できる。
3. browserがincident fingerprintを指定できない。
4. 同じfingerprintの未解決incidentを2件作れない。
5. 同じfingerprintの新eventが既存incidentへ関連付く。
6. duplicate producer eventでscopeやactionが重複しない。
7. resolved incidentと同じfingerprintの再発で新incidentを作る。
8. 再発incidentが`recurrence_of_incident_id`を保持する。
9. resolved incidentを再openするcommandが存在しない。
10. manual incident作成時に近似する未解決incident候補を返す。
11. bounded retry内で回復した単発eventを必ずincident化しない。
12. planned maintenance eventを障害件数へ含めない。
13. incident keyが一意で表示可能である。
14. incident title・summary更新がrow version競合を検出する。
15. severity変更がW2理由を要求する。

### 31.2 Incident status・severity・owner

16. open、mitigating、monitoring、resolvedを区別できる。
17. resolvedから他statusへ戻せない。
18. owner設定だけでstatusが変化しない。
19. owner未設定Critical・Highが未対応上位へ表示される。
20. scoped operatorをglobal incident ownerへ設定できない。
21. Critical incidentにrecovery planなしでresolvedを実行できない。
22. 非終端actionがあるincidentをresolvedにできない。
23. 非終端planがあるincidentをresolvedにできない。
24. confirmedまたはrecovering scopeがあるincidentをresolvedにできない。
25. resolution codeとsummaryなしでresolvedにできない。
26. duplicate resolutionでduplicate targetを必須にする。
27. Criticalまたはsystem blockありのresolveがW3を要求する。
28. incident resolveでquality caseが暗黙resolvedにならない。
29. quality case resolveでincidentが暗黙resolvedにならない。
30. current severity変更履歴をtimelineで確認できる。

### 31.3 Incident scope・影響件数

31. scope typeごとに正しいtarget IDだけを受け付ける。
32. project scopeが別customer IDと矛盾する場合に拒否する。
33. global potential scopeを全顧客数として数えない。
34. confirmed・contained・recoveringだけを現在影響件数へ含める。
35. recovered・not_affectedを現在影響件数へ含めない。
36. customer countをdistinct customerで集計する。
37. project countをdistinct projectで集計する。
38. scope rowを物理削除できない。
39. 誤検知scopeをnot_affectedへ変更できる。
40. scope変更にreason・evidenceを要求する。
41. scoped viewerへ許可scope内のscopeだけを返す。
42. scoped viewerのcountへscope外影響を含めない。
43. global totalをscoped viewerへ返さない。
44. potentialとconfirmedを別表示できる。
45. 同一incident・target・impact kindの重複scopeを作れない。

### 31.4 自動安全処理

46. system blockにincident IDが必須である。
47. system blockにaudit logが必須である。
48. system blockにsystem eventが必須である。
49. incident・auditなしでcontrolだけblockedにならない。
50. tenant mismatchでCritical incidentとpublication blockが作られる。
51. rollback confirmation failureでCritical incidentが作られる。
52. AIモデル広範囲障害でincident-linked restrictionを適用できる。
53. 安全処理で品質case・cycle・operationのstatusを一括上書きしない。
54. 自動安全処理の全関連をcorrelation IDで追跡できる。
55. audit writer失敗時に正常responseを返さない。
56. system block適用後のincident作成失敗を正常状態として表示しない。
57. planned admin pauseとincident safety pauseを区別する。
58. system actorがadmin actorを偽装しない。
59. 管理者がsystem-only safety endpointを呼べない。
60. incident-owned blockerをpublication badgeへ二重計上しない。

### 31.5 Incident action

61. action categoryとoperation codeをallowlist検証する。
62. arbitrary shell・scriptをactionへ保存できない。
63. requested、running、completed、failed、cancelledを区別できる。
64. terminal actionをrunningへ戻せない。
65. action retryが新actionとretry referenceを作る。
66. actionの対象scopeがincident scopeと矛盾する場合に拒否する。
67. annotationを追記できる。
68. annotationを直接編集・削除できない。
69. 訂正annotationが元actionを参照できる。
70. 管理者action要求と後続system処理をaudit/eventへ分離できる。

### 31.6 Recovery plan・step

71. draft、ready、running、verifying、completed、failed、cancelled、supersededを区別できる。
72. ready以降のplan内容を直接編集できない。
73. plan変更が新plan versionを作る。
74. incidentごとに非終端planを2件作れない。
75. plan versionがincident単位で重複しない。
76. ready化前にsuccess criteriaを必須にする。
77. ready化前にrollback criteriaを必須にする。
78. ready化前にmonitoring windowを必須にする。
79. plan開始時にincident・control・scopeを再検査する。
80. recovery stepの依存順序を無視して開始できない。
81. failed stepを同じrowで再openできない。
82. step retryが新attempt numberとretry referenceを作る。
83. recovery batchがincident、plan、stepへ関連付く。
84. recovery batchへarbitrary promptを指定できない。
85. failed/stopped recovery batchをresumeできない。
86. retryで新recovery batchを作る。
87. recovery結果を通常日次へ直接昇格できない。
88. failed planをrunningへ戻せない。
89. failed plan後に新plan versionを作れる。
90. recovery stepとsystem eventをcorrelation IDで追跡できる。

### 31.7 Recovery clearance・system block解除

91. system actorだけがclearanceを発行できる。
92. 必須step未完了でclearanceを発行できない。
93. verification failureでclearanceを発行できない。
94. target state driftでclearanceを発行できない。
95. clearanceがtarget control・from/to stateを限定する。
96. 別projectのclearanceを流用できない。
97. 別AIモデルのclearanceを流用できない。
98. expired clearanceを使用できない。
99. revoked clearanceを使用できない。
100. failed/cancelled/superseded planのclearanceを使用できない。
101. clearance消費とcontrol解除が同一transactionになる。
102. control解除だけがcommitされclearanceが未消費になる部分成功を防ぐ。
103. clearanceだけconsumedになりcontrolが変わらない部分成功を防ぐ。
104. idempotent replayで2回control解除しない。
105. managerがclearanceを作成・延長・再有効化できない。
106. blocked_by_systemをclearanceなしで解除できない。
107. platform adminでもclearanceなしの直接解除を拒否する。
108. clearance発行後の新Critical eventでclearanceを無効化できる。
109. valid clearance数をincident detailで確認できる。
110. consumed clearanceを再利用できない。

### 31.8 AIモデルhealth・control

111. health stateとcontrol stateを別フィールドで返す。
112. health operational・control restrictedを同時表示できる。
113. health degraded・control enabledを同時表示できる。
114. health stateへpausedを保存できない。
115. incident safety controlでincident IDを必須にする。
116. restricted policyをallowlist schemaで検証する。
117. arbitrary policy expressionを保存できない。
118. pausedからrestrictedへの段階復旧を実行できる。
119. restrictedからenabledへの復旧にclearanceを要求する。
120. plan許可なしのincident-linked pausedからenabled直接遷移を拒否する。
121. planned admin controlとincident safety controlを区別する。
122. control変更でhealth stateを自動変更しない。
123. health回復だけでincident safety controlを自動解除しない。
124. system statusと管理設定が同じAI model control rowを読む。
125. AIモデルcontrol変更がW3・step-up・理由を要求する。

### 31.9 Component health・system status

126. operational、degraded、unavailable、unknownを区別できる。
127. staleなoperational観測をread modelでunknownへ変換する。
128. 古いhealth probe結果が新しい状態を上書きしない。
129. component instance単位でcurrent rowを1件に保つ。
130. 管理者がhealth stateを直接operationalへ設定できない。
131. 管理者はhealth checkだけを要求できる。
132. health check要求をaudit logへ保存する。
133. health check開始・結果をsystem eventへ保存する。
134. overall stateでCritical incidentを最優先できる。
135. core component unavailableをcritical表示できる。
136. planned restrictionだけの場合にdegradedではなくrestrictedを返せる。
137. component source欠損でoverall stateをunknownにする。
138. incident source取得失敗を未解決0件へ変換しない。
139. control取得失敗をenabledへ変換しない。
140. healthとcontrolの不整合warningを表示できる。

### 31.10 System event

141. system eventがappend-onlyである。
142. system eventを更新・削除できない。
143. producer component・producer event IDの重複を防ぐ。
144. event classとevent levelを区別する。
145. event levelをincident severityとして直接使用しない。
146. occurred_atとrecorded_atを区別する。
147. eventへcorrelation IDを保存できる。
148. eventへcausation IDを保存できる。
149. system eventへsecretを保存しない。
150. system eventへprompt・AI回答全文を保存しない。
151. event groupをread modelだけで生成する。
152. event group tableを作らない。
153. group rowから個別eventを展開できる。
154. system eventへis_readを保存しない。
155. system eventへresolved statusを保存しない。
156. eventからincident作成時にfingerprint候補照合を行う。
157. scope外event・件数をscoped viewerへ返さない。
158. event detailから認可済みrouteだけを返す。
159. event source failureを0件へ変換しない。
160. raw provider payloadをevent drawerへ返さない。

### 31.11 Audit log

161. audit logがappend-onlyである。
162. audit logを更新・削除できない。
163. audit correctionが新rowとcorrects referenceを作る。
164. W1/W2/W3成功を1件のaudit logへ保存する。
165. denied操作をaudit logへ保存する。
166. failed操作をaudit logへ保存する。
167. sync mutationとsuccess auditを同一transactionでcommitする。
168. audit追加失敗時に業務変更だけがcommitされない。
169. async要求をACCEPTED_ASYNCとして1件保存する。
170. async完了を同じ管理者auditとして複製しない。
171. system eventで後続完了・失敗を確認できる。
172. bulk操作がaudit logを対象数だけ複製しない。
173. audit_log_scopeで複数対象へ関連付ける。
174. scoped auditorがscope外audit rowを取得できない。
175. scoped auditorへglobal facetを返さない。
176. audit detail閲覧自体をauditする。
177. read auditへbefore/after本文を複製しない。
178. before/afterへraw requestを保存しない。
179. before/afterへprompt・AI回答・publication payloadを保存しない。
180. before/afterへsecret・token・cookieを保存しない。
181. source IPをraw値ではなくhashで扱う。
182. denied rowでscope外target名を漏らさない。
183. audit detailが関連system eventをcorrelation IDで表示できる。
184. audit log source failureを操作0件として表示しない。
185. P0にaudit CSV export endpointが存在しない。

### 31.12 Read model・UI・権限

186. incident sidebar badgeが未解決Critical・High incident数と一致する。
187. badge、facet、listを同じscope・snapshotから返す。
188. incident view内で同じincidentを重複行にしない。
189. quality caseとincidentを別work itemとして維持する。
190. 同じincident IDのquality caseを視覚的に関連表示できる。
191. incident groupという更新可能entityを返さない。
192. system operatorだけがglobal recovery commandを取得できる。
193. auditorへwrite commandを返さない。
194. scoped roleへglobal recovery plan detailを返さない。
195. incident sensitive read権限なしでsecurity evidenceを返さない。
196. sensitive evidence readをauditする。
197. role変更後の古い画面からincident writeを拒否する。
198. stale incident detailでW2/W3 commandを返さない。
199. stale clearanceでrelease commandを返さない。
200. section failureを「影響なし」「正常」へ変換しない。
201. 1366×768でCritical・High件数と上位3incidentを確認できる。
202. 1440×900で影響scopeとrecovery progressを確認できる。
203. status・severity・health・controlを色だけで伝えない。
204. keyboardだけでlist、tabs、drawer、dialogを操作できる。
205. drawer close後に元行へfocusが戻る。
206. page全体の横スクロールが発生しない。
207. 長いincident title・event codeでlayoutが崩れない。
208. permission deniedと0件を別表示する。
209. stale、unknown、partial failureを別表示する。
210. incident画面から品質decision・pointer切り替えを直接実行できない。

---

## 32. 実装順

1. 正式状態モデル v2.1のincident・scope・action定義
2. component healthとcontrol分離
3. system event append-only writerとdeduplication
4. incident fingerprint・correlation service
5. automatic safety control transaction
6. incident recovery plan・step
7. recovery clearance発行・消費
8. AIモデル段階的復旧
9. incident read model v2.0
10. system status read model
11. system event group query
12. audit log query・drawer redaction
13. capability・command validator v2.0
14. `/admin/operations/incidents`
15. incident detail
16. `/admin/operations/system-status`
17. `/admin/operations/events`
18. `/admin/operations/audit-logs`
19. 受け入れ条件1〜210の自動テストとvisual regression

---

## 33. 最終統合後の位置づけ

本仕様v1.1は、canonical manifest v1.0に含まれる障害・監査の正式画面仕様である。

新しい画面仕様を追加する段階は完了した。実装時は、正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0、共通レイアウトv1.1から生成したAPI contractと`available_commands`だけを使用する。
