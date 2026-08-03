# レコラ管理画面 P0 最終横断統合レビュー

- 文書ID: `RECORA-ADMIN-P0-FINAL-INTEGRATION-REVIEW`
- 版: `1.0`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 対象: 管理画面P0の基盤3仕様、共通レイアウト、8領域の画面仕様

---

## 1. 最終結論

レコラ管理画面P0は、次の一貫した運用モデルとして実装へ移行できる。

```text
通常処理は自動
初回設定も自動
正式日次も自動
品質検査も自動
公開も自動

人が行うのは例外処理、意図した停止、復旧、設定変更だけ
```

全8領域の責任分離、状態モデル、read model、権限・監査、route、P0/P1境界は成立している。最終横断レビューで見つかった不整合は、後述の8件を正式版へ反映して解消した。

**最終判定: PASS。新しい画面・業務領域を追加せず、実装設計へ進む。**

---

## 2. 正式な仕様レイヤー

関心ごとの単一情報源を次へ固定する。

| 関心 | 唯一の正式情報源 |
|---|---|
| 永続データ、状態enum、状態遷移、system safety | 正式状態モデル v2.1 |
| 表示code、一覧値、badge、facet、timeline、freshness | read model v2.0 |
| capability、role、scope、command、risk、audit、system actor | 権限・監査仕様 v2.0 |
| shell、sidebar、context bar、table、drawer、W2/W3 UI | 共通レイアウト v1.1 |
| 各領域の画面構成・業務責任 | 各画面仕様 v1.1 |
| 正式文書・route・除外文書 | canonical manifest v1.0 |

同じ事項が複数文書に現れる場合、上表の担当文書を優先する。画面側で状態、権限、件数、公開可否を再計算しない。

---

## 3. 横断レビューで修正した8件

### 3.1 顧客導入表示codeの二系統

顧客画面仕様に残っていた別code setを廃止し、次の9値へ統一した。

```text
attention_required
new_inquiry
contract_required
project_required
setup_attention
setup_running
contract_excluded
operational
record_only
```

顧客アクセス停止、契約停止、初回公開準備は別field・secondary flagで表示する。

### 3.2 測定管理badge predicateの不一致

稼働中batchを次へ統一した。

```text
queued
running
pausing
paused
stopping
```

distinct batch IDで数え、project数やassignment数による重複計上を行わない。

### 3.3 管理設定badgeの旧定義

MFA未設定と適用失敗だけを数える旧定義を廃止した。正式には`SettingsHealthSummary`のうち、settings-owned、human attention、Critical/High相当のissueを数える。

意図した停止・制限は異常へ含めない。incident-owned、usage-cost-owned問題も二重計上しない。

### 3.4 復旧batch commandの主体混同

管理者要求とsystem作成を分離した。

```text
RequestRecoveryBatch
→ 管理者command・audit_log・ACCEPTED_ASYNC

CreateRecoveryBatch
→ system-only command・system_event・incident_recovery batch作成
```

### 3.5 system safety command名の揺れ

正式名を次へ統一した。

```text
BlockCustomerAccessBySystem
BlockProjectAutomationBySystem
BlockPublicationBySystem
BlockDailyAutomationBySystem
```

旧名と`ApplyPublicationSystemBlock`は使用しない。管理者停止commandは`paused_by_admin`だけを作り、`blocked_by_system`を作れない。

### 3.6 日次・scheduled apply・recovery command registryの不足

次をstate・authzの正式registryへ追加・補完した。

```text
StartDailyTargetEvaluationRun
CreateActivationDayTargetDecision
ApplyScheduledContractVersion
ResumeProjectAutomation
MarkIncidentScopeNotAffected
CancelIncidentRecoveryPlan
AdvanceRecoveryStep
CompleteRecoveryPlanVerification
CompletePublicationOperation
SupersedePricingDefinition
ActivateAdminFromIdentityProvider
RecordAdminMfaProjection
```

### 3.7 route権限表の漏れ

次を正式route matrixへ追加した。

```text
/admin/customers/[customerId]/projects/new
```

必要条件は`project.manage`と対象customerへのeffective scopeである。

MFA・step-upは業務routeとは分離し、実装する場合は次のutility routeを使用できる。

```text
/admin/security/mfa
/admin/security/step-up
```

### 3.8 文書重複・版参照の整理

旧ドラフト`recora_admin_p0_quality_exception_review_spec_v1.md`は正式セットから除外した。共通レイアウトと運用ホームに残っていた旧文書ID、基盤仕様末尾の旧版番号、各画面の古い前提版を更新した。

---

## 4. 正式サイドバーと責任範囲

| 領域 | 主責任 | 禁止する越境 |
|---|---|---|
| 運用ホーム | 今日の正常・異常・安全状態の判断 | 強いwrite操作 |
| 顧客管理 | 顧客、契約、project、初期設定、問い合わせ | 測定実行詳細・品質判断 |
| 測定管理 | target decision、cycle、batch、attempt、再処理 | 品質decision・公開版編集 |
| 品質・例外レビュー | 個別品質例外の解決 | 通常案件の全件承認・pointer切替 |
| 公開管理 | candidate、version、pointer、公開失敗、復元、停止 | 品質ゲート上書き |
| 障害・監査 | 共通原因、system health、recovery、audit | 個別品質caseの一括判断 |
| 利用量・コスト | 実利用量と内部変動原価 | 請求、粗利、予算、手動調整 |
| 管理設定 | 管理者、通知、日次、AIモデル、標準plan | 個別案件操作・高度rule editor |

トップレベルはこの8領域から増やさない。

---

## 5. 正式route registry

### 5.1 業務route 37件

```text
/admin

/admin/customers
/admin/customers/new
/admin/customers/[customerId]
/admin/projects
/admin/projects/[projectId]
/admin/customers/[customerId]/projects/new
/admin/contracts
/admin/contracts/[contractId]
/admin/inquiries
/admin/inquiries/[inquiryId]

/admin/measurements
/admin/measurements/bulk
/admin/measurements/bulk/confirm
/admin/measurements/cycles/[cycleId]
/admin/measurements/batches/[batchId]

/admin/quality-exceptions
/admin/quality-exceptions/[caseId]

/admin/publications
/admin/publications/candidates/[candidateId]
/admin/publications/versions/[versionId]

/admin/operations/incidents
/admin/operations/incidents/[incidentId]
/admin/operations/system-status
/admin/operations/events
/admin/operations/audit-logs

/admin/usage-costs

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

### 5.2 P0で独立routeにしないもの

```text
/admin/contracts/new
/admin/customer-users
/admin/measurements/attempts/[attemptId]
/admin/measurements/items/[itemId]
/admin/measurements/revisions/[revisionId]
/admin/measurements/additional-validation/new
/admin/settings/scheduled-changes
各設定entityの詳細route
監査ログ・system eventの個別URL
```

これらは対象detail、dialog、drawer、inspectorで扱う。

---

## 6. 最終自動フローの接続確認

### 6.1 初期設定

```text
customer・contract・project作成
→ project setup
→ site analysis・category・competitor 12件・persona/topic・prompt 50/100/200
→ setup quality check
├ pass: project active、activation-day target decision、formal cycle
└ exception: setup exception、顧客画面は準備中
```

### 6.2 正式日次

```text
daily target evaluation run
→ target decision
→ formal daily cycle
→ measurement batch・attempt・retry
→ finalized current revision
→ analysis・metric
→ publication candidate Generation
→ quality check
→ publication operation
→ version・pointer atomic switch
→ delivery verification
```

### 6.3 失敗時

```text
個別品質問題
→ quality case
→ actionまたはdecision
→ 新revision / 新Generation / 再検査

共通原因
→ incident
→ safety control
→ recovery plan・step・batch
→ clearance
→ 段階的解除
```

### 6.4 公開安全性

```text
pre-switch failure
→ pointer変更なし

post-switch failure
→ previous pointerまたはNULLへrollback

rollback verification failure
→ Critical incident
→ publication blocked_by_system
```

すべての経路で、前回安全版、準備中、公開停止のいずれかへfail-closedできる。

---

## 7. データと表示の単一情報源

| 表示・判断 | 正式情報源 |
|---|---|
| 本日の対象 | `daily_target_decision` |
| 本日の正式cycle | `measurement_cycle` |
| 採用測定結果 | `measurement_cycle.current_revision_id` + `measurement_cycle_revision_item` |
| 稼働batch | `measurement_batch` |
| 人の品質対応 | 未解決`quality_exception_case` |
| candidate最新性 | project単調増加Generation |
| 現在公開版 | `project_publication_pointer` |
| 公開結果 | `publication_operation` + delivery verification |
| 共通障害 | `incident` |
| system health | 新鮮なcomponent observation + control + incident |
| 利用量・原価 | current usage correction + current cost calculation version |
| 操作履歴 | `audit_log` |
| system処理履歴 | `system_event` |
| 表示用「要対応」 | `AttentionWorkItem` |
| sidebar badge | `SidebarBadge` |

`display_status`、`attention_status`、`is_current`などの重複した更新可能表示fieldは作らない。

---

## 8. P0/P1境界の最終確認

P0に含めないものは変更なし。

```text
顧客別・週次・月次schedule
全件手動品質承認・公開承認
品質例外の一括承認
独立した品質作業グループ
candidate・publication version・履歴の直接編集
追加検証から正式結果への直接昇格
custom admin role editor
二名承認
高度なrule editor・simulation
原価異常workflow・手動調整・為替・請求・粗利・予算
データ保持・削除UI
顧客向けガイドCMS
高度な問い合わせ返信・chat
```

---

## 9. 文書整合性の検証結果

canonical packageに対して、次の機械的検証を実施した。

| 検証 | 結果 |
|---|---:|
| 正式文書 | 13件 |
| bundle内ファイル | 15件 |
| 業務route | 37件・完全一致 |
| optional security utility route | 2件・完全一致 |
| 正式command | 147件 |
| 管理者command | 97件 |
| system-only command | 50件 |
| capability | 64件・重複なし |
| 画面command/risk行 | 90件・権限仕様と一致 |
| Markdown H1・code fence | 全件正常 |
| manifest SHA-256 | 全件一致 |
| ZIP整合性 | PASS |

state registryの147 commandと、権限仕様の97管理者command＋50 system-only commandは、差分0・重複0・actor overlap 0で一致した。

受け入れ条件は、基盤3仕様で1,169件、画面9仕様で1,201件、合計2,370件を連番・重複なしで定義している。これは**実装後に実行する検証条件が揃ったこと**を意味し、現時点で製品実装の2,370テストが通過したことを意味しない。

---

## 10. 実装開始ゲート

UIを先に大量実装しない。次を順に満たす。

1. canonical manifestとcommand registryをrepositoryへ固定
2. P0 DDL・foreign key・CHECK・partial unique index
3. state transition serviceとidempotency
4. audit writer・system event writer
5. capability・scope・route guard・MFA/step-up
6. read model view・snapshot・freshness
7. scheduler・measurement・quality・publication・incident orchestrator
8. 共通shell
9. 8領域UI
10. acceptance test・tenant境界・rollback・visual regression

実装中に仕様差分が必要になった場合、画面だけで吸収せず、担当する正式仕様を更新してから実装する。

---

## 11. 最終判定

業務の完全性、自動化との整合、責任分離、single source of truth、fail-closed、権限・監査、P0の実装可能性はいずれも合格である。

**このcanonical packageをレコラ管理画面P0の正式実装入力として採用する。**
