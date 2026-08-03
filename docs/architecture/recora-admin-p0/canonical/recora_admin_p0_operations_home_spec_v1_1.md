# レコラ管理画面 P0 運用ホーム画面仕様書

- 文書ID: `RECORA-ADMIN-P0-OPERATIONS-HOME`
- 版: `1.1`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 対象route: `/admin`
- 前提仕様:
  - `RECORA-ADMIN-P0-STATE-MODEL v2.1`
  - `RECORA-ADMIN-P0-READ-MODEL v2.0`
  - `RECORA-ADMIN-P0-AUTHZ-AUDIT v2.0`
  - `RECORA-ADMIN-P0-COMMON-LAYOUT v1.1`
- 優先順位: 本仕様は、旧ダッシュボード案、運用ホーム内の独自集計、画面側での独自状態判定、正常案件の全件一覧より優先する

---

## 0A. v1.1 最終横断統合更新

運用ホームの画面責任・P0範囲はv1.0から変更しない。最終横断レビューにより、前提基盤を正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0へ更新する。

- 状態enumとcommand state effectは正式状態モデルv2.1を正とする。
- 表示code、件数、badge、facet、available command入力はread model v2.0を正とする。
- capability、scope、risk、command code、auditは権限・監査仕様v2.0を正とする。
- 正式routeと採用文書はcanonical manifest v1.0を正とする。

---

## 0. 今回の正式決定

運用ホームについて、次を正式に固定する。

1. 運用ホームは分析ダッシュボードではなく、管理者が「今日の自動運用は正常か」「人が何を対応するか」を短時間で判断する画面とする。
2. 最上部に、正式状態から導出した1つの運用判定を表示する。判定結果は保存せず、read modelで導出する。
3. 主要表示順は「今日の結論」「本日の自動処理」「人の対応」「自動公開」「システム状態」「最近の重要履歴」とする。
4. 運用ホームから、再測定、公開、停止、復元、例外decisionなどのwrite操作を直接実行しない。専門ページへの導線に限定する。
5. 正常案件の全件一覧を置かない。正常件数は進捗の分母・完了数としてだけ表示する。
6. 日次処理の開始前と処理欠落を区別するため、`daily_target_evaluation_run` を正式な処理単位として使用する。
7. SLA内のdecision待ち・cycle作成待ちは異常として扱わず、SLA超過後だけ欠落または遅延として扱う。
8. scheduled母集団と、日中に運用開始したprojectの初回正式cycleを分けて表示する。
9. 「人の対応が必要な例外」は `AttentionWorkItem` のうち、品質、公開、障害の3domainだけを対象にする。
10. 問い合わせは顧客管理、原価問題は利用量・コスト、設定問題は管理設定を主導線とし、運用ホームの主例外件数へ混ぜない。
11. 同じincidentに関連する品質caseとincidentは、責任が異なるため別の対応単位として残す。画面上では関連を明示するが、1つへ統合しない。
12. 顧客画面への安全な代替表示を、内部エラー説明より先に表示する。
13. 公開済み件数はoperation数ではなく、当日に公開切り替えが完了したdistinct project数とする。
14. システムcomponent詳細は `system_status.read` を持つ管理者だけへ表示する。scoped incident権限だけの場合は、選択scopeへの影響だけを表示する。
15. 主要sectionは同じ `read_snapshot_id` から返し、数字の更新時点を揃える。
16. 1366×768では、最上部の結論、本日の自動処理、人の対応の主要部分を最初の画面内で確認できる構成とする。
17. 円グラフ、ドーナツ、時系列の装飾グラフ、大量の独立KPIカードは使用しない。
18. P0では自動更新を15秒間隔のpollingとし、WebSocketやリアルタイム通知センターは作らない。

---

## 1. 目的

運用ホームは、管理者が画面を開いて短時間で次へ回答できることを目的とする。

1. 今日の日次対象判定は開始済みか。
2. 判定対象となるprojectを漏れなく評価できているか。
3. 作成すべき正式日次cycleはすべて作成されているか。
4. 現在どの工程が動いているか。
5. 遅延、例外、安全停止はあるか。
6. 人が今対応すべき項目はいくつあるか。
7. 未割当または長時間未対応の項目はあるか。
8. 顧客画面は最新、前回版維持、準備中、公開停止のどれか。
9. 複数projectへ共通影響する障害はあるか。
10. 直近に何が変化したか。

運用ホームだけで例外を解決することは目的としない。原因調査と操作は、測定管理、品質・例外レビュー、公開管理、障害・監査などの専門ページで行う。

---

## 2. 責任範囲

| 運用ホームで行うこと | 運用ホームで行わないこと |
|---|---|
| 今日の自動運用の結論を示す | 測定結果やAI回答本文を詳細分析する |
| 正式日次の対象・作成・進行・完了を要約する | 正常projectを全件表示する |
| 人の対応が必要な例外を優先順で示す | 例外へdecisionを直接記録する |
| 顧客表示の安全状態を示す | 公開候補や公開版を編集する |
| システム影響と重要障害を示す | AIモデルや日次処理を停止・復旧する |
| 重要な状態変化を示す | 監査ログの全文調査を完結させる |
| 専門ページへ正確に遷移する | 問い合わせ、原価、設定問題を1つの万能queueへ混ぜる |

運用ホームにはpage-levelの業務commandを置かない。表示更新ボタンはread操作であり、監査対象の業務commandではない。

---

## 3. Route・認可・scope

### 3.1 Route

```text
/admin
```

最低capability:

```text
admin.home.read
```

### 3.2 `admin.home.read` の範囲

`admin.home.read` は、選択scopeにおける運用集計の閲覧を許可する。

ただし、次の詳細閲覧権限を自動的に付与しない。

- 品質case本文
- 公開候補・公開版本文
- AI回答・プロンプト
- incidentのglobal詳細
- system component内部情報
- audit log詳細
- 顧客の機微情報
- 内部原価

### 3.3 Section別の表示権限

| section | 集計表示 | row・詳細導線 |
|---|---|---|
| 今日の結論 | `admin.home.read` | 理由ごとのrouteは対象domain権限がある場合だけ |
| 本日の自動処理 | `admin.home.read` | `/admin/measurements`への導線は `measurement.read` がある場合だけ |
| 品質の対応項目 | `quality.read` | case routeも `quality.read` |
| 公開固有の対応項目 | `publication.read` | candidate/operation routeも `publication.read` |
| incident対応項目 | `incident.read.scoped` または `incident.read.global` | 許可scope内のincident routeだけ |
| 公開状況の集計 | `admin.home.read` | project名・公開詳細は `publication.read` がある場合だけ |
| system component | `system_status.read` | `/admin/operations/system-status` |
| scope影響incident | incident read capability | 許可scope内だけ |
| system event履歴 | `system_event.read` | event drawerまたはroute |
| 管理者・権限変更履歴 | audit/admin directory権限 | 認可済みの場合だけ |

### 3.4 Scope selector

選択可能scopeは共通レイアウト仕様に従う。

```text
すべての担当範囲
特定顧客
特定project
```

運用ホームの全件数、一覧、理由、遷移先は、選択scopeとeffective scopeの積集合から生成する。

```text
表示対象
=
role assignment scope
∩ scope selector
∩ section capability
```

scopeを変更した際、次は同じrequestで更新する。

- 最上部の運用判定
- 正式日次件数
- 人の対応件数
- 公開状況
- scope影響incident
- 重要履歴
- サイドバーバッジ

### 3.5 Global componentと選択scope

`system_status.read` を持つ場合、component stateはglobalなシステム状態として表示する。顧客scopeまたはproject scopeを選択していても、component自体を局所状態へ変換しない。

ただし、次を明確に分けて表示する。

```text
システム全体の状態
選択範囲への影響
```

global incident詳細を持たない管理者へ、scope外の顧客数、project数、名称を返さない。

---

## 4. Read snapshot・更新・鮮度

### 4.1 正式query

```text
GetOperationsHomeSnapshot
```

responseの主要構造:

```text
operations_home
├ page_context
├ operational_verdict
├ today_automation
├ human_attention
├ publication_status
├ system_health
├ recent_important_timeline
└ section_errors
```

### 4.2 共通context

```text
business_date
timezone
scope_type
scope_id
read_snapshot_id
read_snapshot_at
freshness_state
source_watermark
```

`business_date` はブラウザの日付から計算しない。serverが正式業務タイムゾーンと日次設定をもとに返す。

### 4.3 同一snapshot

最低限次は同じ `read_snapshot_id` を使用する。

- `operational_verdict`
- `today_automation`
- `human_attention`
- `publication_status`
- 表示対象である場合の `system_health` の集計値

最近の重要履歴だけが別queryで遅延した場合は、履歴sectionをpartial errorにし、主要件数を消さない。

### 4.4 自動更新

P0の正式動作:

```text
表示中: 15秒ごとに再取得
非表示tab: polling停止
再度focus: 即時再取得
scope変更: 即時再取得
手動更新: 即時再取得
```

background refresh中は既存内容を保持し、section全体をskeletonへ戻さない。

### 4.5 鮮度

状態重要度Aの基準に従い、60秒超を `stale` とする。

```text
fresh
delayed
stale
unknown
```

画面上の日本語表示:

| code | 表示 |
|---|---|
| `fresh` | 最新 |
| `delayed` | 更新に遅れ |
| `stale` | 更新が遅れています |
| `unknown` | 更新状態を確認できません |

`stale` または `unknown` の値を0件や正常として扱わない。

---

## 5. ページ構成

### 5.1 正式な表示順

```text
Page header
  ↓
鮮度・partial error notice
  ↓
今日の運用判定
  ↓
本日の自動処理 ＋ 人の対応が必要な例外
  ↓
自動公開状況 ＋ システム状態
  ↓
最近の重要履歴
```

### 5.2 Page header

左側:

```text
運用ホーム
本日の自動処理、例外、公開状況、システム状態を確認します。
```

右側:

```text
最終更新時刻
更新ボタン
```

page-levelのprimary commandは置かない。

### 5.3 12column grid

| section | column | 目安 |
|---|---:|---:|
| 今日の運用判定 | 12 | 全幅 |
| 本日の自動処理 | 8 | 約3分の2 |
| 人の対応 | 4 | 約3分の1 |
| 自動公開状況 | 8 | 約3分の2 |
| システム状態 | 4 | 約3分の1 |
| 最近の重要履歴 | 12 | 全幅 |

section間gapは20pxを基本とする。

`system_health.visibility_mode = hidden` の場合、自動公開状況を12columnへ拡張する。空の権限notice用columnを残さない。

### 5.4 1366×768

共通shellを除いたcontent幅は約1094pxを想定する。

推奨高さ:

```text
page header                64〜72px
notice area                0〜40px
運用判定panel             128〜144px
第一row                   292〜320px
```

最初のviewport内で最低限次を確認できるようにする。

- 今日の結論
- 正式日次の作成進捗
- 人の対応件数
- 人の対応上位3件以上

### 5.5 1440×900

content幅は約1152pxを想定する。

第一row全体と、第二rowの見出し・主要件数までを初期viewportへ入れる。

### 5.6 正式wireframe

```text
┌──────────────────────────────────────────────────────────────────────┐
│ 運用ホーム                         最終更新 02:15:30   [更新]        │
│ 本日の自動処理、例外、公開状況、システム状態を確認します。          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ [要対応] 人の対応が必要な項目があります                             │
│ 正式日次48件中、35件完了・12件処理中・1件例外です。                  │
│                                                                      │
│ 正式日次 48/48   処理中 12   人の対応 3   本日公開 35               │
│ 前回の安全な公開版を2projectで継続表示しています。                   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┬───────────────────────────┐
│ 本日の自動処理                           │ 人の対応が必要な例外      │
│ 対象判定 → cycle作成 → 測定解析 → 公開 → 完了                       │
│ 50/50       48/48       12       1       35                          │
│ 対象外2・事前例外1・遅延0               │ Critical ...              │
│ [本日の測定を開く]                       │ High ...                  │
└──────────────────────────────────────────┴───────────────────────────┘

┌──────────────────────────────────────────┬───────────────────────────┐
│ 自動公開状況                             │ システム状態              │
│ 本日公開35 / 前回版維持2 / 準備中1       │ 一部低下 / 障害1          │
│ 顧客表示への安全状態                     │ component rows            │
└──────────────────────────────────────────┴───────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 最近の重要履歴                                                     │
│ timeline rows                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. 今日の運用判定

### 6.1 役割

最上部panelは、管理者が最初に読む結論である。

次を1つの判定へまとめる。

- 本日の日次処理状態
- 人の対応有無
- 顧客公開の安全性
- 重大障害
- read modelの信頼性

この判定をDBへ保存しない。

### 6.2 正式code

```text
scheduled
processing
normal
attention
critical
unknown
```

| code | 表示label | tone | 意味 |
|---|---|---|---|
| `scheduled` | 開始前 | neutral | 設定された開始時刻前で、異常は確認されていない |
| `processing` | 処理中 | info | 自動処理が進行中で、人の対応や重大異常はない |
| `normal` | 正常 | success | 当日の主要処理が完了し、対応対象や重大異常がない |
| `attention` | 要対応 | warning | 人の対応、例外、停止、遅延、安全な代替表示がある |
| `critical` | 重大 | danger | 顧客影響、全体停止、欠落、Critical障害などがある |
| `unknown` | 状態不明 | neutral | 主要sourceの鮮度・整合性不足で結論を確定できない |

### 6.3 判定優先順位

既知の重大事実を、単なるread遅延で弱めない。

```text
1. critical
2. unknown
3. attention
4. scheduled
5. processing
6. normal
```

#### `critical`

選択scopeと権限内で、次のいずれかが成立する。

- 未解決Critical incident
- `unavailable` component
- daily target evaluation runが `failed` かつ復旧処理が成立していない
- target decisionまたはformal cycleのSLA超過欠落
- formal cycleの整合性異常
- 公開rollback失敗
- `publication_control_state = blocked_by_system` かつ安全な公開版がない
- 顧客表示を確認できないprojectが存在し、重大attentionとして判定済み

#### `unknown`

既知のCriticalがなく、次のいずれかが成立する。

- 主要sectionのreadが `stale` または `unknown`
- scheduled開始時刻を過ぎてもrun事実を確認できない
- target run、decision、cycleのsnapshot整合性を確認できない
- `customer_display_unknown_count > 0`
- system healthを表示すべき権限者についてcomponent sourceが不明

#### `attention`

Critical・unknownではなく、次のいずれかが成立する。

- `human_attention_count > 0`
- 未解決High incident
- exception cycleまたはstopped cycleがある
- delayed cycleがある
- daily automationが意図的に停止されている
- 公開固有の要対応がある
- 前回版維持、初回準備中のSLA超過、公開停止がある

#### `scheduled`

設定された開始時刻前で、既知のattention・criticalがない。

#### `processing`

開始済みで、主要処理が未完了だが、attention・critical・unknownがない。

#### `normal`

当日の主要処理が完了し、人の対応、重大incident、公開異常、整合性異常がない。

### 6.4 表示内容

左側:

```text
status badge
結論title
1〜2行のsummary
理由最大3件
```

右側の固定metric:

| metric | 表示 |
|---|---|
| 正式日次 | `created_formal_cycle_count / expected_formal_cycle_count` |
| 処理中 | `running_cycle_count` |
| 人の対応 | `human_attention_count` |
| 本日公開 | `published_today_count` |

値が不明な場合は `—` とする。0へ置き換えない。

### 6.5 Summary文の例

`scheduled`:

```text
本日の自動処理は3:00に開始予定です。
```

`processing`:

```text
本日の自動運用は進行中です。正式日次48件のうち35件が完了しています。
```

`normal`:

```text
本日の自動運用は正常に完了しています。対応が必要な例外はありません。
```

`attention`:

```text
人の対応が必要な項目が3件あります。2projectでは前回版を安全に維持しています。
```

`critical`:

```text
顧客影響または処理欠落を確認してください。公開停止中のprojectが1件あります。
```

`unknown`:

```text
現在の運用状態を確定できません。データ更新と日次処理の状態を確認してください。
```

### 6.6 理由表示

`reason_items` は最大3件を表示する。

```text
severity
label
count
route optional
```

例:

```text
正式日次未作成 1件
Critical障害 1件
前回版維持 2件
```

route権限がない理由はclickableにしない。権限外の対象名称や件数を含めない。

### 6.7 Safe fallback summary

内部エラーより先に、顧客へ現在何が表示されているかを示す。

優先順位:

```text
1. 表示停止・安全版なし
2. system block
3. 前回版維持
4. 初回準備中
5. 現在版を表示中
```

表示例:

- `前回の安全な公開版を2projectで継続表示しています。`
- `1projectは初回公開前のため準備中です。`
- `公開を停止しています。測定と解析は継続しています。`
- `顧客画面は現在版を正常に表示しています。`

---

## 7. 本日の自動処理

### 7.1 情報源

```text
DailyTargetRunSummary
DailyMeasurementStatus
MeasurementCycleSummary
MeasurementBatchSummary
```

追加検証はこのpanelの正式日次progressへ含めない。

### 7.2 Business day phase

```text
before_start
target_evaluation
cycle_creation
measurement_analysis
quality_publication
completed
paused
failed
unknown
```

| phase | 表示 |
|---|---|
| `before_start` | 開始前 |
| `target_evaluation` | 対象判定中 |
| `cycle_creation` | 正式cycle作成中 |
| `measurement_analysis` | 測定・解析中 |
| `quality_publication` | 品質検査・公開中 |
| `completed` | 完了 |
| `paused` | 日次処理停止中 |
| `failed` | 日次処理失敗 |
| `unknown` | 状態不明 |

### 7.3 5段階表示

#### 1. 対象判定

主値:

```text
scheduled_finalized_decision_count / scheduled_population_count
```

補助値:

```text
eligible_count
intentionally_excluded_count
precheck_exception_count
scheduled_pending_decision_count
scheduled_failed_decision_count
late_activation_count
```

日本語label:

```text
対象
意図した対象外
事前例外
判定待ち
判定失敗
本日運用開始
```

scheduled run開始前は `0 / 0` ではなく、開始予定時刻を表示する。

#### 2. 正式cycle作成

主値:

```text
created_formal_cycle_count / expected_formal_cycle_count
```

補助値:

```text
awaiting_cycle_creation_count
overdue_missing_formal_cycle_count
planned_cycle_count
```

SLA内:

```text
作成待ち
```

SLA超過:

```text
未作成・要確認
```

#### 3. 測定・解析

対象stage group:

```text
cycle_preparation
measurement_analysis
```

主値:

```text
planned_cycle_count + measurement_analysis中のcycle数
```

補助値:

```text
running_batch_count
paused_batch_count
delayed_cycle_count
```

#### 4. 品質・公開

対象stage group:

```text
quality_publication
```

補助表示:

```text
候補生成中
品質検査中
公開処理中
表示検証中
```

工程別の数値は、各cycleを現在stageへ1回だけ割り当てる。

#### 5. 完了

主値:

```text
completed_cycle_count
```

補助値:

```text
exception_cycle_count
stopped_cycle_count
```

### 7.4 Stage表示方法

5段階を、横方向の簡潔なprocess rowとして表示する。

- 各stageにlabel、主値、補助textを表示する。
- 線や色だけで進捗を表現しない。
- 100%を装飾的なprogress barで強調しすぎない。
- countの意味が違うstage同士を、単一の割合として合算しない。
- 1366幅で1行に収まらない場合、補助値を2行目へ置く。

### 7.5 整合性異常

次は通常の例外数とは分け、panel上部へinline calloutとして表示する。

- run membership mismatch
- multiple formal cycle
- invalid decision-cycle pair
- overdue missing formal cycle
- run開始SLA超過
- decision完了SLA超過

最大3件を表示し、残りは「ほかN件」とする。

### 7.6 開始前

`run_status = scheduled` かつ開始時刻前では、次を表示する。

```text
本日の自動処理は3:00に開始予定です。
対象projectは開始時に確定します。
```

次を表示しない。

- 判定漏れ
- 正式cycle未作成
- 完了率0%
- 異常0件という断定

### 7.7 全体停止

`run_status = skipped_by_control`:

```text
本日の日次処理は設定により停止されています。
```

表示項目:

- 停止主体
- reason label
- 適用開始時刻
- 関連設定またはincidentへの導線

運用ホームから再開しない。

### 7.8 専門ページへの導線

`measurement.read` がある場合:

```text
本日の測定を開く
→ /admin/measurements?view=today&business_date={business_date}
```

scope queryを維持する。

`measurement.read` がない場合はlinkを表示しない。

---

## 8. 人の対応が必要な例外

### 8.1 情報源

```text
AttentionWorkItem
```

対象:

```text
navigation_domain in ('quality','publication','incident')
AND human_action_required = true
AND domain read capabilityあり
AND effective scope内
```

### 8.2 Summary

表示値:

```text
human_attention_count
critical_high_attention_count
unassigned_attention_count
system_processing_attention_count
oldest_attention_age_seconds
by_domain
```

主表示:

```text
3件
```

補助表示例:

```text
Critical・High 1件
未割当 2件
最長 4時間20分
自動再処理中 3件
```

`system_processing_attention_count` は主件数へ含めない。人が現在操作すべきではない項目として補助表示する。

### 8.3 上位row

最大5件を表示する。

row内容:

```text
attention level
source domain
タイトル
顧客・project context
検出からの経過時間
担当者または未割当
safe fallback
incident関連label optional
```

一覧内へエラー本文、AI回答全文、候補payloadを表示しない。

### 8.4 Sort

```text
attention_level: critical > high > medium > low
unassigned: trueを先
first_detected_at: 古い順
work_item_id: 安定順
```

severityは未割当より優先する。Criticalの割当済み項目をHighの未割当項目より下へ送らない。

### 8.5 Incident関連表示

品質caseが `incident_id` を持つ場合、次を小さく表示する。

```text
障害 INC-1234に関連
同じ障害の関連case N件
```

品質caseとincident rowを画面上で1件へ潰さない。

理由:

- incidentは共通原因の復旧責任
- quality caseは個別projectの品質・公開判断責任

### 8.6 Safe fallback

row内では次のような短いlabelを使用する。

- 前回版維持
- 初回準備中
- 顧客影響なし
- 公開停止中
- 測定結果未反映

内部処理状態より、顧客への現在影響を先に表示する。

### 8.7 0件時

```text
対応が必要な例外はありません。
```

自動再処理中がある場合:

```text
人の対応が必要な例外はありません。3件を自動再処理中です。
```

大きな緑色カードや祝賀表現は使用しない。

### 8.8 導線

rowはread modelが返す認可済み `route` へ遷移する。

section下部には、権限があるdomainだけを表示する。

```text
品質・例外を開く
公開管理を開く
障害を開く
```

混合queue用の新routeは作らない。

### 8.9 禁止する操作

運用ホームでは次を表示しない。

- 担当者変更
- 再測定
- 再解析
- 注記付き続行
- 一部非表示
- 公開
- 復元
- incident復旧

---

## 9. 自動公開状況

### 9.1 情報源

```text
PublicationProjectSummary
AttentionWorkItem
```

### 9.2 正式count

```text
published_today_count
publication_processing_count
publication_ready_waiting_count
publication_ready_over_sla_count
previous_version_maintained_count
initial_preparing_count
initial_preparing_over_sla_count
publication_stopped_count
publication_paused_by_admin_count
publication_blocked_by_system_count
publication_failed_attention_count
customer_display_unknown_count
```

すべてdistinct projectで数える。

### 9.3 Primary metrics

最上段へ次を配置する。

| label | 値 |
|---|---|
| 本日公開 | `published_today_count` |
| 公開処理中 | `publication_processing_count` |
| 公開準備完了 | `publication_ready_waiting_count` |
| 公開固有の要対応 | `publication_failed_attention_count` |

### 9.4 顧客表示の安全状態

Primary metricsの下に、顧客が現在何を見ているかを表示する。

```text
前回版維持
初回準備中
公開停止
状態不明
```

表示例:

```text
前回版維持 2
初回準備中 1
公開停止 0
```

#### 前回版維持

現在pointerがあり、最新候補・公開処理に例外があるが、旧版を安全に表示しているproject。

warningで表示するが、「顧客画面が壊れている」とは表現しない。

#### 初回準備中

現在pointerがない新規project。

SLA内はneutralまたはinfo、SLA超過時はwarningとする。

#### 公開停止

次を分ける。

```text
管理者停止
システム停止
```

システム停止は、incidentまたは安全検査への導線を優先する。

#### 状態不明

`customer_display_unknown_count > 0` は0へ変換せず、最上部運用判定を `unknown` または `critical` へ反映する。

### 9.5 Ready waiting

`publication_ready_waiting_count` は、品質通過後に公開queueで待機しているproject数である。

SLA内:

```text
公開待ち
```

SLA超過:

```text
公開待ちが遅延
```

SLA超過分だけ `publication_ready_over_sla_count` へ数える。

### 9.6 要対応row

公開固有の要対応を最大4件表示できる。

対象例:

- pointer切り替え失敗
- delivery verification失敗
- rollback要確認
- 手動保留後の判断待ち
- 公開制御解除前検査失敗

品質caseが原因解決の正式画面である場合、公開rowへ二重表示せず、人の対応sectionのquality itemへ寄せる。

### 9.7 導線

`publication.read` がある場合:

```text
公開管理を開く
→ /admin/publications?business_date={business_date}
```

運用ホームに顧客画面preview、公開button、候補再生成buttonを置かない。

---

## 10. システム状態

### 10.1 表示条件

`visibility_mode`:

```text
hidden
scope_impact_only
component_detail
```

| mode | 条件 | 表示 |
|---|---|---|
| `hidden` | system/incident閲覧権限なし | section自体を表示しない |
| `scope_impact_only` | scoped incident権限あり | 選択範囲へ影響する障害だけ |
| `component_detail` | `system_status.read` | global component状態とincident |

権限不足notice用の空sectionは表示しない。

### 10.2 Overall state

```text
critical
high
medium
normal
unknown
```

| state | 表示 |
|---|---|
| `critical` | 重大な障害 |
| `high` | 影響の大きい障害 |
| `medium` | 一部低下・停止 |
| `normal` | 正常 |
| `unknown` | 状態不明 |

### 10.3 Summary values

```text
critical_incident_count
high_incident_count
degraded_component_count
paused_component_count
unavailable_component_count
```

0件とunknownを区別する。

### 10.4 Component rows

`component_detail` の場合、最大5件を重要度順に表示する。

row:

```text
component label
state
最終確認時刻
関連incident数
影響scope summary
```

並び順:

```text
unavailable
degraded
paused
operational
unknown
```

同じstateでは最終変化時刻が新しい順とする。

component codeをUIへ直書きせず、registryが返すlabelを使用する。

想定category:

- サイト取得・初期設定
- 日次scheduler
- AIモデル実行
- 測定統合
- 解析・指標
- 候補生成・品質検査
- 公開・表示検証
- 管理画面read model

category追加時に運用ホームcomponentを変更する必要がない構造とする。

### 10.5 Incident rows

最大3件。

表示:

```text
severity
incident title
status
影響project数または「選択範囲に影響」
safe action summary
last_updated_at
```

global権限がない場合、scope外件数を返さない。

### 10.6 導線

権限に応じて次を表示する。

```text
システム状態を開く
障害一覧を開く
```

運用ホームからAIモデル停止、日次停止、回復batch作成を行わない。

---

## 11. 最近の重要履歴

### 11.1 情報源

```text
TimelineEntry
```

### 11.2 対象event

- Critical/High incidentの発生・状態変化
- 公開失敗・rollback・復元
- system block
- 日次target run失敗・復旧
- 管理者による測定・公開・モデル・日次処理の停止と再開
- 重要な品質decision
- 管理者・役割・scope変更。ただし権限がある場合だけ

問い合わせ受信、通常の成功attempt、正常公開の全件は表示しない。

### 11.3 件数とsort

最大8件。

```text
occurred_at DESC
origin_priority DESC
timeline_entry_id DESC
```

### 11.4 Row

```text
severity icon
タイトル
短いsummary
対象context
actor label
result label
相対時刻
絶対時刻
route optional
```

origin typeは補助labelとして次のように表示する。

```text
管理操作
システム
品質判断
公開処理
障害対応
```

### 11.5 Redaction

次を表示しない。

- AI prompt全文
- AI回答全文
- 公開payload全文
- secret
- token
- Authorization header
- 顧客の不要な個人情報
- 内部原価

### 11.6 Section link

権限に応じて次を表示する。

```text
システムイベントを開く
監査ログを開く
```

1つの「すべての履歴」routeを新設しない。

---

## 12. Loading・empty・stale・error

### 12.1 Initial loading

- page headerと主要panelのskeletonを表示する。
- 過去のscopeの数値を新scopeの値として残さない。
- skeletonでstatus色を推測しない。

### 12.2 Background refresh

- 現在値を保持する。
- 更新中labelを小さく表示する。
- focus位置を移動しない。
- rowの並びが変化しても、読み上げを過剰に行わない。

### 12.3 開始前

開始前はemptyではない。

```text
本日の処理は開始前です。
```

予定時刻を表示する。

### 12.4 人の対応0件

```text
対応が必要な例外はありません。
```

### 12.5 本日公開0件

0件だけではemptyにしない。

- 処理開始前
- まだ品質・公開工程へ到達していない
- 初回準備中
- 対象projectがない

を区別する。

### 12.6 Partial error

任意sectionだけが失敗した場合:

- 成功sectionを表示し続ける。
- 失敗section内に再取得導線を表示する。
- page header下へ「一部の情報を取得できません」を表示する。
- section error codeを管理者へ必要以上に露出しない。

### 12.7 Major section error

`today_automation`、`human_attention`、`publication_status` のいずれかを信頼できない場合:

- 既知Criticalがなければ運用判定を `unknown` とする。
- 正常、0件、完了と断定しない。
- 手動更新を提示する。

### 12.8 Denied

`admin.home.read` がない場合はroute boundaryで拒否する。

section単位で権限がない場合、そのsectionまたはrowを返さず、空件数として見せない。

### 12.9 State mismatch

read modelの整合性異常は、通常の品質例外と混ぜない。

```text
運用データの整合性を確認できません。
```

と表示し、測定管理または障害へ遷移する。

---

## 13. Navigation contract

### 13.1 Scope維持

専門ページへ遷移する際、次をURLへ維持する。

```text
scope_type
customer_id optional
project_id optional
business_date
```

### 13.2 正式導線

| 表示 | route |
|---|---|
| 本日の測定 | `/admin/measurements?view=today&business_date=...` |
| 品質・例外 | `/admin/quality-exceptions?attention_owner=human` |
| 公開管理 | `/admin/publications?business_date=...` |
| 障害一覧 | `/admin/operations/incidents` |
| システム状態 | `/admin/operations/system-status` |
| システムイベント | `/admin/operations/events` |
| 監査ログ | `/admin/operations/audit-logs` |

個別row routeはserverが認可後に返す。

### 13.3 Browserで禁止すること

- entity IDからrouteを推測して生成する
- capability名からdetail権限を独自推論する
- source enumから別領域へ勝手にrouteする
- scope外entityへ遷移できるlinkを残す

---

## 14. Component contract

### 14.1 Component構成

```text
OperationsHomePage
├ OperationsVerdictPanel
├ TodayAutomationPanel
│  └ DailyStageRow
├ HumanAttentionPanel
│  └ AttentionWorkItemRow
├ PublicationStatusPanel
│  └ PublicationSafetySummary
├ SystemHealthPanel optional
│  ├ ComponentStateRow
│  └ IncidentSummaryRow
└ ImportantTimelineSection
   └ TimelineEntryRow
```

共通部品:

```text
AdminPageFrame
AdminPageHeader
AdminStatusBadge
AdminFlagChip
AdminSafeFallbackBanner
AdminMetric
AdminFreshnessNotice
```

### 14.2 Response contract

概念型:

```ts
type OperationsHomeSnapshot = {
  pageContext: OperationsHomePageContext;
  operationalVerdict: OperationalVerdict;
  todayAutomation: TodayAutomationSummary;
  humanAttention: HumanAttentionSummary;
  publicationStatus: PublicationHomeSummary;
  systemHealth?: SystemHealthHomeSummary;
  recentImportantTimeline: TimelineEntry[];
  sectionErrors: SectionError[];
};
```

frontendはこのresponseから正式判定を再計算しない。

### 14.3 `OperationsVerdictPanel`

必須prop:

```text
code
label
title
summary
display_tone
reason_items
metrics
safe_fallback_summary
```

### 14.4 `TodayAutomationPanel`

必須prop:

```text
business_day_phase
run_status
schedule timestamps
5 stage summaries
consistency issues
measurement route optional
```

### 14.5 `HumanAttentionPanel`

必須prop:

```text
summary counts
items max 5
domain routes
system processing count
```

### 14.6 `PublicationStatusPanel`

必須prop:

```text
publication counts
customer safety counts
attention items max 4
publication route optional
```

### 14.7 `SystemHealthPanel`

`visibility_mode = hidden` の場合はcomponentをrenderしない。

---

## 15. Security・redaction

1. APIは認証、capability、scopeを適用してから集計する。
2. 集計後にscope外rowだけを削除する方式は禁止する。
3. 人の対応件数は、管理者がそのdomainを閲覧できる行だけを数える。
4. incidentのglobal影響件数をscoped管理者へ返さない。
5. payload権限があっても、運用ホームへ本文を返さない。
6. 顧客名・project名は、その対象のsummary read権限がある場合だけ返す。
7. routeは認可済みの場合だけ返す。
8. secret、credential、外部response全文をerrorやtimelineへ含めない。
9. home aggregateの通常閲覧をaudit logへ大量記録しない。
10. sensitive detailへの遷移後は、権限・監査仕様に従って必要なread auditを行う。

---

## 16. Visual・accessibility

### 16.1 情報階層

1. 結論
2. 人が動く必要性
3. 自動処理の進捗
4. 顧客表示の安全性
5. 共通障害
6. 履歴

数値の大きさより、判断の重要度を優先する。

### 16.2 Color

- `danger`、`warning`、`info`、`success`、`neutral` のsemantic tokenだけを使用する。
- 色だけでstatusを表現しない。
- success colorを大量の正常数値へ適用しない。
- 前回版維持はwarningだが、顧客表示が保護されていることを文面で示す。

### 16.3 Typography

- page title: 24px相当
- verdict title: 18〜20px相当
- section title: 16〜18px相当
- primary metric: 22〜28px相当
- row text: 13〜14px相当

marketing dashboardのような巨大数値は使用しない。

### 16.4 Keyboard

- 更新button、section link、row linkをTabで操作できる。
- row全体をlinkにする場合、内部に競合するbuttonを置かない。
- focus ringを消さない。
- route遷移後は遷移先page titleへfocusする。

### 16.5 Screen reader

- 5段階progressはordered listとして読み上げ可能にする。
- status iconへaccessible labelを付ける。
- 相対時刻には絶対時刻を併記する。
- 自動更新は全画面を毎回読み上げない。
- Criticalへの変化だけ、polite live regionで1回通知できる。

### 16.6 Zoom・長文

- 200% zoomでも主要sectionとlinkを利用できる。
- 長い顧客名・project名は2行まで表示し、それ以上は省略する。
- tooltipだけに重要情報を置かない。
- 1366×768でpage全体横scrollを発生させない。

---

## 17. Performance・query実装

### 17.1 Server composition

運用ホームはserver側で合成する。

```text
認証・scope解決
  ↓
同一snapshot開始
  ↓
DailyTargetRunSummary
DailyMeasurementStatus aggregate
AttentionWorkItem aggregate + top rows
PublicationProjectSummary aggregate
SystemHealth authorized aggregate
TimelineEntry top rows
  ↓
verdict導出
  ↓
response
```

browserから各viewへ直接アクセスしない。

### 17.2 N+1禁止

top work item、publication attention、timelineに対して、rowごとに顧客名やproject名を追加取得しない。

必要な表示用名称は認可済みqueryでまとめて返す。

### 17.3 Payload上限

P0の初期目標:

```text
human attention items: 最大5
publication attention items: 最大4
components: 最大5
incidents: 最大3
timeline: 最大8
```

本文payloadを返さないため、通常responseは150KB未満を目標とする。

### 17.4 SLA判定

開始遅延、decision遅延、cycle作成遅延、公開待ち遅延の判定はserverで行う。

browser時刻から独自計算しない。

SLA値はP0では内部設定またはcode-managed configurationとし、画面から自由編集させない。

---

## 18. P0で作らないもの

- widgetの自由配置
- cardの表示・非表示カスタマイズ
- 保存済みdashboard view
- drag and drop
- 円グラフ、ドーナツ、装飾的な時系列グラフ
- AIによる将来完了時刻予測
- 全正常project一覧
- 全公開成功operation一覧
- 問い合わせqueueの統合
- 原価異常queueの統合
- 通知センター
- inline再測定
- inline品質decision
- inline公開
- inline復元
- inline停止・再開
- global全文検索
- mobile専用レイアウト
- WebSocketによるrealtime更新

---

## 19. 受け入れ条件

### 19.1 日次対象判定

1. 開始時刻前に「判定漏れ」や「正式cycle未作成」と表示されない。
2. `daily_target_evaluation_run.status = scheduled` で開始予定時刻が表示される。
3. scheduled母集団数がrunへ関連付いたdecision行数と一致する。
4. pending decisionがSLA内では処理中として表示される。
5. pendingまたはfailed decisionがSLA超過するとattentionまたはcriticalへ反映される。
6. `intentionally_excluded` がformal cycle期待件数へ含まれない。
7. `precheck_exception` がformal cycle期待件数へ含まれる。
8. late activationがscheduled母集団と別表示される。
9. late activationのformal cycleが当日の期待件数へ含まれる。
10. additional validationが正式日次progressへ混入しない。

### 19.2 Cycle・進捗

11. `created / expected` が測定管理の同一filter件数と一致する。
12. SLA内のcycle未作成が「作成待ち」になる。
13. SLA超過後だけ「未作成・要確認」になる。
14. formal cycleが5段階のいずれか1つへだけ割り当てられる。
15. planned、running、completed、exception、stoppedの合計が対象cycleと整合する。
16. multiple formal cycleが通常件数へ吸収されず、整合性異常になる。
17. stopped cycleが完了扱いされない。
18. paused batchがrunning batchと区別される。

### 19.3 運用判定

19. 既知Critical incidentがある場合、他sectionがstaleでも判定がCriticalより弱くならない。
20. 既知Criticalがなく主要sectionがunknownの場合、判定が正常にならない。
21. 開始前で異常がない場合、判定がscheduledになる。
22. 処理中で異常がない場合、判定がprocessingになる。
23. 全処理完了かつ対応対象なしの場合、判定がnormalになる。
24. human attentionがある場合、判定がattention以上になる。
25. system blockかつ安全版なしの場合、判定がcriticalになる。
26. verdict codeをfrontendがcountから再計算しない。

### 19.4 人の対応

27. 人の対応件数が `human_action_required = true` だけを数える。
28. system-owned再処理が主件数へ含まれない。
29. quality、publication、incident以外が主件数へ入らない。
30. 問い合わせが主例外件数へ入らない。
31. 権限のないdomainの件数が返らない。
32. severity、未割当、経過時間の順序規則が安定する。
33. top itemが最大5件である。
34. quality caseとincidentが別責任単位として保持される。
35. 同じincidentとの関連がrow上で確認できる。
36. rowから認可済み専門ページへ遷移できる。
37. 運用ホームに品質・公開・障害のwrite buttonが表示されない。

### 19.5 公開

38. 本日公開件数がdistinct projectで数えられる。
39. 同じprojectの複数operationで二重計上されない。
40. 前回版維持が公開失敗そのものと区別される。
41. 初回準備中がpointerなしの新規projectとして表示される。
42. 初回準備中のSLA内と超過が区別される。
43. 管理者停止とsystem blockが区別される。
44. quality caseへ責任が移った公開異常が公開固有itemへ二重表示されない。
45. customer display unknownが0へ変換されない。
46. 運用ホームから公開・復元・候補再生成を実行できない。

### 19.6 System・timeline

47. `system_status.read` がない管理者へcomponent detailが返らない。
48. scoped incident管理者へscope外件数が返らない。
49. system権限がない場合、空のsystem panelが表示されない。
50. component rowが最大5件、incident rowが最大3件である。
51. recent timelineが最大8件である。
52. 通常成功eventの全件がtimelineへ流れ込まない。
53. timelineにsecret、prompt全文、response全文が出ない。
54. 認可されていないrouteがtimeline rowへ付かない。
55. timelineだけの取得失敗で主要panelが消えない。

### 19.7 Scope・snapshot・security

56. scope変更時にverdict、各count、row、badgeが同じscopeへ更新される。
57. 主要sectionが同一 `read_snapshot_id` を使用する。
58. 権限外rowを集計後に除外して件数を残す実装になっていない。
59. project scopeで別project名を推測できない。
60. routeをbrowserがIDから独自生成しない。
61. stale値を0件または正常へ置き換えない。
62. home aggregate閲覧で不要なaudit logが大量生成されない。

### 19.8 Loading・error

63. initial loadingで過去scopeの値が表示されない。
64. background refreshで既存内容とfocusが維持される。
65. partial errorで成功sectionが残る。
66. 主要section失敗時にverdictがunknownになる。
67. deniedを0件表示にしない。
68. run開始前をempty stateとして扱わない。

### 19.9 Visual・accessibility

69. 1366×768で結論、正式日次進捗、人の対応上位3件以上が初期viewportに見える。
70. 1440×900で第一row全体と第二rowの主要値が確認できる。
71. page全体に横scrollが発生しない。
72. system panel非表示時にpublication panelが全幅へ広がる。
73. 5段階progressが色だけに依存しない。
74. keyboardだけで更新、section link、row linkを操作できる。
75. 200% zoomでも主要情報とlinkを利用できる。
76. 長い日本語の顧客名・project名でgridが破綻しない。
77. 自動更新ごとにscreen readerが全pageを読み上げない。
78. Criticalへの変化をaccessibleに通知できる。

---

## 20. 実装順

1. `daily_target_evaluation_run` migration
2. `daily_target_decision.evaluation_status`・`decision_source` migration
3. scheduled母集団確定transaction
4. project activationとの競合制御
5. `DailyTargetRunSummary`
6. `DailyMeasurementStatus` v1.1
7. OperationsHome server query composer
8. operational verdict導出関数
9. scope・capability filter
10. `OperationsVerdictPanel`
11. `TodayAutomationPanel`
12. `HumanAttentionPanel`
13. `PublicationStatusPanel`
14. `SystemHealthPanel`
15. `ImportantTimelineSection`
16. polling・focus refresh
17. loading・partial・stale・unknown状態
18. 受け入れ条件1〜68のdata・security test
19. 受け入れ条件69〜78のvisual・accessibility test
20. 1366×768・1440×900 visual regression

UI実装を先行せず、1〜9を固定・テストしてからcomponent実装へ進む。

---

## 21. 最終統合後の位置づけ

本仕様v1.1は、canonical manifest v1.0に含まれる運用ホームの正式画面仕様である。

新しい画面仕様を追加する段階は完了した。実装時は、正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0、共通レイアウトv1.1から生成したAPI contractと`available_commands`だけを使用する。
