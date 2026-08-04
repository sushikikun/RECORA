# レコラ管理画面 P0 測定管理画面仕様書

- 文書ID: `RECORA-ADMIN-P0-MEASUREMENT-MANAGEMENT`
- 版: `1.1`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 前提仕様:
  - `RECORA-ADMIN-P0-STATE-MODEL v2.1`
  - `RECORA-ADMIN-P0-READ-MODEL v2.0`
  - `RECORA-ADMIN-P0-AUTHZ-AUDIT v2.0`
  - `RECORA-ADMIN-P0-COMMON-LAYOUT v1.1`
  - `RECORA-ADMIN-P0-OPERATIONS-HOME v1.1`
  - `RECORA-ADMIN-P0-CUSTOMER-MANAGEMENT v1.1`
- 対象: レコラ管理画面P0の測定管理領域
- 優先順位: 本仕様は、過去の測定一覧案、手動実行案、バッチ操作案、画面単位の仮ステータスより優先する

---

## 0A. v1.1 最終横断統合更新

測定管理の画面責任・P0範囲はv1.0から変更しない。最終横断レビューにより、前提基盤を正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0へ更新する。

- 状態enumとcommand state effectは正式状態モデルv2.1を正とする。
- 表示code、件数、badge、facet、available command入力はread model v2.0を正とする。
- capability、scope、risk、command code、auditは権限・監査仕様v2.0を正とする。
- 正式routeと採用文書はcanonical manifest v1.0を正とする。

---

## 0. 正式決定

1. 測定管理は、正式日次対象、サイクル、論理測定項目、実行試行、統合revision、実行batchを管理する。
2. 測定管理では品質判断、公開可否判断、公開版編集を行わない。測定後工程は状態と遷移先だけを表示する。
3. 正式日次は1プロジェクト・1業務日につき最大1サイクルとする。管理者による手動正式測定でも2件目を作らない。
4. その日の正式サイクルがない場合だけ新規作成し、既にある場合は同じサイクルの正式な再処理を開始する。
5. 完了済みサイクルの再処理は許可するが、過去の採用結果を上書きしない。新attempt、新revision、新batchを作り、旧revisionと現在公開版を維持したまま進める。
6. `measurement_cycle.current_revision_id` と `measurement_cycle_revision_item` を、現在採用中の統合結果と各項目の採用attemptの唯一の正式情報源とする。
7. `measurement_item.selected_attempt_id` を正式な保存元として使用しない。採用attemptはrevisionごとの不変mappingで保持する。
8. batchは実行単位、cycleは業務結果単位である。1batchは複数project・cycleを含められ、1cycleは複数batchにまたがり得る。
9. batchの正式種別は `scheduled_daily / manual_formal / additional_validation / retry_failed_items / incident_recovery` とする。
10. 自動再試行は同じassignment内で新attemptを追加する。管理者再測定は新しい`retry_failed_items` batchを作る。
11. batch一時停止は新規assignment取得だけを止め、実行中attemptは安全に完了させる。安全停止は未開始assignmentを取消し、実行中attemptへ取消要求を出す。
12. 一時停止中batchは同じbatchを再開できる。`failed`または`stopped` batchは再開せず、新しいretry/recovery batchを作る。
13. 追加検証は現在有効な設定内の既存prompt・AIモデルだけを対象にし、解析完了で終了する。公開候補、公開版、正式指標への直接昇格は行わない。
14. 一括正式測定は現在業務日のprojectだけを対象とし、確認画面で `新規正式サイクル / 既存サイクル再処理 / 実行不可` をproject単位に確定する。
15. `CreateMeasurementBatch`はシステム内部コマンドとする。管理者は正式測定、追加検証、再測定などの業務コマンドを要求し、その副作用としてbatchを作る。
16. 日次対象判定が`intentionally_excluded`または`precheck_exception`のprojectを、測定管理から強制的に通常測定へ進めない。
17. 日次対象判定runの失敗や欠落は、業務上の事前例外へ偽装しない。再試行または障害対応へ委譲する。
18. measurement attemptは追記型であり、`failed / timed_out / cancelled`を成功へ書き換えない。timeout後の遅延結果は診断記録に残しても採用しない。
19. 同じ項目を複数の非終端batchで同時実行しない。worker取得、attempt作成、結果採用は排他制御する。
20. 一覧、facet、サイドバーバッジ、ホーム件数は同じread model predicateとread snapshotを使用する。

---

## 1. 目的

測定管理の目的は、管理者が次を正確に判断し、安全に操作できるようにすることである。

- 本日の正式日次対象が正しく確定したか
- 正式サイクルが期待どおり作成されたか
- 現在どのbatch、cycle、item、attemptが進行しているか
- 自動再試行で回復しているか、人の操作が必要か
- 失敗項目だけを再測定すべきか、正式サイクル全体を再処理すべきか
- 追加検証が正式結果と混ざっていないか
- batchを一時停止または安全停止した場合の影響は何か
- 過去の正式日次、追加検証、batch、再処理を追跡できるか

画面の主目的は「測定実行の可視化と安全な再実行」であり、AI回答の品質判断や顧客への公開判断ではない。

---

## 2. 責任範囲

### 2.1 測定管理で行うこと

- `daily_target_evaluation_run` の現在状態表示
- `daily_target_decision` の対象、対象外、事前例外表示
- 正式日次cycleの作成状況と進行表示
- 手動正式測定要求
- 一括正式測定要求
- 追加検証cycle作成
- batch進捗、assignment、attemptの表示
- 失敗項目だけの再測定
- 完了済みまたは例外中の正式サイクル再処理
- batch一時停止、再開、安全停止
- revisionの統合・採用履歴表示
- 測定payload、エラー、latency、使用量の権限付き確認
- 関連する品質例外、公開処理、障害への遷移

### 2.2 測定管理で行わないこと

- 日次対象判定の確定済み結果の直接書き換え
- `intentionally_excluded` の強制上書き
- precheck例外を無視した測定開始
- AI回答内容の品質承認
- `quality_decision` の作成
- 公開候補本文の編集
- 公開候補の強制公開
- 公開版pointerの切り替え
- 追加検証の正式結果への昇格
- 過去attempt、revision、batch、audit logの直接編集
- arbitraryなpromptを追加検証へ直接入力
- batch workerやqueue内部状態の低レベル設定変更

### 2.3 専門領域への委譲

| 状況 | 正式な遷移先 |
|---|---|
| 契約・設定・利用権限の事前例外 | 品質・例外レビューまたは顧客管理 |
| 測定結果の品質判断 | 品質・例外レビュー |
| 公開候補、公開失敗、前回版維持 | 公開管理 |
| AIモデル広範囲障害、scheduler障害 | 障害・監査 |
| 原価・利用量 | 利用量・コスト |
| 日次処理時刻、AIモデル制御 | 管理設定 |

---

## 3. 正式entity関係

```text
daily_target_evaluation_run
  └─ daily_target_decision
       └─ measurement_cycle (formal_daily)
            ├─ measurement_item
            │    └─ measurement_attempt
            ├─ measurement_cycle_revision
            │    └─ measurement_cycle_revision_item
            ├─ batch_item_assignment
            │    └─ measurement_batch
            ├─ quality_exception_case
            └─ publication_candidate

measurement_cycle (additional_validation)
  ├─ measurement_item
  ├─ measurement_attempt
  ├─ measurement_cycle_revision
  ├─ measurement_cycle_revision_item
  └─ measurement_batch
```

### 3.1 粒度

| entity | 正式な粒度 |
|---|---|
| `daily_target_evaluation_run` | 1業務日につき1件 |
| `daily_target_decision` | 1project・1業務日につき最大1件 |
| `measurement_cycle` formal daily | 1project・1業務日につき最大1件 |
| `measurement_cycle` additional validation | 1要求につき1件 |
| `measurement_item` | cycle内の正規化済み論理測定項目1件 |
| `measurement_attempt` | itemを1回実行した試行1件 |
| `measurement_cycle_revision` | 統合・解析結果の1世代 |
| `measurement_cycle_revision_item` | revision内で採用したitemとattemptのmapping1件 |
| `measurement_batch` | queueへ投入する実行単位1件 |
| `batch_item_assignment` | batchへ割り当てられたitem1件 |

### 3.2 不変条件

```text
formal_daily cycleは同一project・business_dateで最大1件
additional_validationからpublication_candidateを作らない
revisionはfinalized後に内容を変更しない
current_revision_idは同じcycleのfinalized revisionだけを参照
revision item mappingはfinalized後に変更しない
attemptは終端状態から別の終端状態へ変更しない
failed/stopped batchを再開しない
同じitemを複数の非終端batchへ同時割当しない
```

---

## 4. Route・template・最低権限

| route | 用途 | template | 最低capability |
|---|---|---|---|
| `/admin/measurements` | 本日の測定・実行中・実行履歴 | T2 | `measurement.read` |
| `/admin/measurements/bulk` | 一括正式測定の対象選択 | T2 | `measurement.formal.trigger` |
| `/admin/measurements/bulk/confirm` | 一括正式測定の確認・実行 | T7 | `measurement.formal.trigger` |
| `/admin/measurements/cycles/[cycleId]` | cycle詳細 | T4 | `measurement.read`＋対象scope |
| `/admin/measurements/batches/[batchId]` | batch詳細 | T4 | `measurement.read`＋全対象scope |

P0では次の独立routeを追加しない。

```text
/admin/measurements/attempts/[attemptId]
/admin/measurements/items/[itemId]
/admin/measurements/revisions/[revisionId]
/admin/measurements/additional-validation/new
```

item、attempt、revisionはcycle detail内のtabまたはdrawerで表示する。追加検証は共通dialogから作成する。

IDが存在しない場合とscope外の場合は、外部応答を同じ`not found or unavailable`として扱う。

---

## 5. 正式な測定フロー

### 5.1 通常の正式日次

```text
日次対象判定run
  ↓
daily_target_decision = eligible
  ↓
formal_daily cycleを冪等作成
  ↓
論理measurement item生成
  ↓
scheduled_daily batchへassignment
  ↓
initial attempt
  ↓
必要に応じてautomatic retry
  ↓
採用可能attemptを統合
  ↓
新しいcycle revisionをfinalize
  ↓
cycle.current_revision_idを原子的に切替
  ↓
解析
  ↓
公開候補Generation生成
  ↓
品質・公開工程
```

### 5.2 事前例外

```text
daily_target_decision = precheck_exception
  ↓
formal_daily cycleを作成
  ↓
cycle.status = exception
cycle.current_stage = precheck
  ↓
quality exception case
```

測定管理では原因と遷移先を表示する。`測定を開始`操作は返さない。

### 5.3 意図した対象外

```text
daily_target_decision = intentionally_excluded
  ↓
formal_daily cycleは作成しない
```

理由、制御元、再開方法を表示する。確定済みdecisionを測定管理から`eligible`へ変更しない。

### 5.4 手動正式測定

単一projectのW2操作である。

```text
同日のformal_daily cycleがない
AND decision = eligible
AND cycle_creation_state in (awaiting, overdue_missing)
  ↓
同日のformal_daily cycleを作成
  ↓
manual_formal batchを作成
```

```text
同日のformal_daily cycleがある
AND 再処理可能
  ↓
既存cycleを再処理状態へ移行
  ↓
新attempt・新building revision・manual_formal batchを作成
```

次の場合は実行不可とする。

- 業務日の正式開始前
- `intentionally_excluded`
- `precheck_exception`
- decisionが未確定またはsystem failed
- 日次処理全体が`skipped_by_control`
- projectがactiveでない
- contractまたはentitlementがactiveでない
- `automation_control = blocked_by_system`
- 同じcycleに非終端の正式再処理がある
- 同じitemが別の非終端batchで実行中
- tenant境界、入力revision、AIモデル制御の安全再検査に失敗

### 5.5 完了済みcycleの再処理

完了済みcycleを直接書き換えない。

```text
completed cycle
  ↓
ReprocessFormalDailyCycleを受理
  ↓
旧current revisionを保持
旧公開版を保持
  ↓
cycle.status = running
cycle.current_stage = measurement または integration
  ↓
新attempt
  ↓
新building revision
  ↓
新revision finalize成功
  ↓
current_revision_idを新revisionへ切替
旧revisionをsuperseded
  ↓
候補生成から再検査
```

再処理に失敗した場合は、新revisionを`failed`にし、旧`current_revision_id`を維持する。画面表示は「再処理失敗・前回結果保持」とする。

### 5.6 追加検証

```text
CreateAdditionalValidation
  ↓
追加検証cycle作成
  ↓
additional_validation batch作成
  ↓
測定・自動再試行
  ↓
統合revision finalize
  ↓
解析完了
  ↓
cycle.completed
```

追加検証では次を生成しない。

```text
publication_candidate
publication_version
project_publication_pointer更新
正式日次のdaily_target_decision
```

### 5.7 自動再試行

- 同じ`batch_item_assignment`を`retry_wait`へ移す。
- 新しい`measurement_attempt`を`attempt_kind = automatic_retry`で追加する。
- 過去attemptを上書きしない。
- retry budgetとbackoffは適用中ルールversionから決める。
- budget超過時にassignmentを`failed`へ終端化する。
- 一部項目の最終失敗は測定例外へ接続する。

### 5.8 管理者による失敗項目再測定

```text
RetryFailedItems
  ↓
対象itemをserverで再検査
  ↓
新しいretry_failed_items batch
  ↓
新assignment
  ↓
新attempt attempt_kind = manual_retry
```

元batchを再開したり、元assignmentをqueuedへ戻したりしない。

---

## 6. 測定管理ローカルナビゲーション

`/admin/measurements`内は次の3tabに固定する。

```text
本日の測定
実行中
実行履歴
```

- 「一括正式測定」はtabではなくpage command。
- 「追加検証」はpage command。
- tab件数は同じread snapshotのfacet countを使用する。
- URL queryでtab、filter、sortを保持する。

推奨query:

```text
?tab=today
?tab=running
?tab=history&record=cycles
```

---

## 7. 共通画面動作

### 7.1 Page header

```text
測定管理
正式日次の対象、実行、再測定、追加検証を管理します
```

右側command:

```text
追加検証
一括正式測定
```

表示条件:

- `追加検証`: `measurement.validation.create`を持つ場合だけ表示
- `一括正式測定`: `measurement.formal.trigger`を持つ場合だけ表示
- state上候補が0件でも権限があれば表示してよいが、遷移先で理由を示す
- staleまたはunknown時はW2の一括正式測定開始を一時停止し、更新を要求する

### 7.2 Business date

- 「今日」は共通context barの`business_date`を使う。
- ブラウザの日付を正式判定へ使わない。
- 本日の測定tabは現在業務日に固定する。
- 過去業務日の正式再処理は、品質actionまたはincident recoveryから開始し、通常の一括正式測定では扱わない。

### 7.3 Filter bar

共通項目:

```text
検索
顧客
project
状態
AIモデル
担当scope
```

historyだけ追加:

```text
期間
記録単位
purpose
trigger source
result
```

### 7.4 Freshness

- run、decision、cycle、batch、item集計の`refreshed_at`を表示する。
- sectionごとのfreshnessが異なる場合は最も古い状態をページfreshnessに採用する。
- stale値を0件や正常へ変換しない。
- W2/W3操作開始前に最新write modelを再取得する。

### 7.5 Polling

- 実行中tab、cycle detail、batch detailだけを自動更新する。
- background refreshでは既存行を消さず、更新中indicatorを表示する。
- dialog入力中にページ全体を再描画しない。
- batch terminal後は高頻度pollingを停止する。

---

## 8. 本日の測定tab

### 8.1 目的

1業務日の対象判定から正式サイクル作成、測定・解析、後続工程までをproject単位で確認する。

### 8.2 Response

`GetMeasurementOverview(tab=today)`は同じsnapshotで次を返す。

```text
daily_target_run_summary
summary_counts
facet_counts
items: DailyMeasurementStatus[]
available_commands
read_snapshot
```

### 8.3 上部compact summary

カードを大量に並べず、1行のsummary stripへ固定する。

```text
予定対象
正式サイクル作成済み
測定・解析中
事前例外
意図した対象外
未作成・要確認
```

正式式:

```text
予定対象 = eligible + precheck_exception
正式サイクル作成済み = formal_cycle_id is not null
未作成・要確認 = cycle_creation_state = overdue_missing
```

`intentionally_excluded`は予定対象へ含めない。

### 8.4 日次対象判定run表示

summary stripの下にcompactなrun rowを置く。

表示:

- business date
- run status
- scheduled start
- population snapshot
- finalized / total decision
- SLA state
- failed decision count
- late activation count
- refresh time

runが`failed`またはSLA超過の場合だけ、障害・監査への遷移を強調する。測定管理からdecisionを直接修正しない。

### 8.5 Facet

```text
すべて
対象・作成待ち
測定中
解析以降
完了
事前例外
意図した対象外
未作成・要確認
整合性異常
```

facet predicateはread model v2.0に固定し、画面独自に再計算しない。

### 8.6 標準列

| 列 | 内容 |
|---|---|
| 顧客・project | 顧客名、project名、対象ドメイン |
| 対象判定 | eligible / intentionally excluded / precheck exception / 判定中 |
| 正式サイクル | 未作成、planned、running、exception、completed |
| 現在工程 | precheck、measurement、integration、analysis、測定後工程 |
| 測定進捗 | 採用成功 / 論理項目、最終失敗、実行中 |
| batch | 稼働中batch数、主要batch ID |
| 安全状態 | 前回結果保持、公開後工程へ移行などの要約 |
| 最終更新 | 最新event時刻 |
| 操作 | 詳細、手動正式測定、遷移先 |

1366pxでは次を優先して残す。

```text
顧客・project
対象判定
正式サイクル・工程
測定進捗
最終更新
操作
```

batch ID、補助flagは省略または「ほかN件」にまとめる。

### 8.7 Primary state優先順位

```text
read inconsistency
重大system block
precheck exception
cycle overdue missing
measurement exception
batch stopping/stopped with incomplete items
running
waiting
completed
intentionally excluded
```

表示用stateは保存しない。

### 8.8 Sort

標準sort:

```text
attention level DESC
cycle_creation_state priority
customer name ASC
project name ASC
project_id ASC
```

`intentionally_excluded`だけが上位へ並ばないよう、注意が必要な行を優先する。

### 8.9 Row action

| 状態 | 操作 |
|---|---|
| cycleあり | cycle詳細 |
| eligible・cycle awaiting/overdue | 手動正式測定 W2 |
| completed・再処理可能 | 正式サイクル再処理 W2 |
| precheck exception | 品質例外へ移動 |
| intentionally excluded | 制御元の詳細へ移動 |
| run/decision failed | 障害またはsystem eventへ移動 |
| active batchあり | batch詳細 |

### 8.10 整合性異常

次を通常の空状態へ変換しない。

```text
run_membership_mismatch
unexpected_cycle
multiple_cycle_detected
invalid_decision_cycle_pair
revision_pointer_mismatch
multiple_active_batch_assignment
```

整合性異常ではW2/W3操作を返さず、system eventと必要に応じてincidentを作る。

### 8.11 Empty state

- 開始前: 「本日の対象判定はまだ開始前です」
- 対象0件: 「本日の正式日次対象はありません」
- filter 0件: 「この条件に一致するprojectはありません」
- 権限なし: 0件表示にせずroute accessを拒否
- stale: empty stateにせず状態不明表示

---

## 9. 実行中tab

### 9.1 目的

現在workerが処理しているbatchと、batch外の統合・解析処理を運用単位で確認する。

### 9.2 上部summary

```text
稼働中batch
一時停止中
停止処理中
実行中attempt
retry待ち
失敗assignment
```

サイドバーバッジの稼働中batch数は、同じpredicateを使う。

### 9.3 Primary section: active batch

標準列:

| 列 | 内容 |
|---|---|
| batch | batch ID、batch type |
| 対象 | 顧客数、project数、cycle数 |
| 状態 | queued / running / pausing / paused / stopping |
| 進捗 | succeeded / total、running、retry_wait、failed |
| AIモデル | 主要モデルまたは複数 |
| 開始・経過 | started_at、duration |
| 最終進捗 | last_progress_at、stalled判定 |
| 起点 | scheduler、admin、quality action、incident |
| 操作 | 詳細、pause、resume、stop |

### 9.4 Secondary section: batch外の進行

次を表示する。

- precheck後のitem生成待ち
- integration中
- analysis中
- batch完了後にrevision finalize待ち
- 測定再処理action受理後、batch作成待ち

品質、候補生成、公開工程は簡潔な「測定後工程へ移行」とし、専門ページへのリンクを表示する。

### 9.5 stalled判定

保存statusではなく次から導出する。

```text
batch.status in (queued, running, pausing, stopping)
AND now - last_progress_at > configured threshold
AND running/retry_wait/queued assignment exists
```

stalledを自動でfailedへ変換しない。system eventとincident判定へ接続する。

---

## 10. 実行履歴tab

### 10.1 表示単位

filter bar内のsegmentで切り替える。

```text
サイクル
バッチ
```

defaultは`サイクル`。

### 10.2 サイクル履歴

対象:

```text
formal_daily
additional_validation
```

標準列:

| 列 | 内容 |
|---|---|
| 業務日・日時 | business date、開始時刻 |
| 種別 | 正式日次 / 追加検証 |
| 顧客・project | 名称、domain |
| 起点 | scheduler / admin / incident recovery |
| 結果 | completed / exception / stopped / running |
| revision | current revision、revision数、再処理回数 |
| 項目・試行 | logical item、attempt、追加試行、最終失敗 |
| 所要時間 | latest execution duration |
| 最終更新 | event時刻 |

### 10.3 バッチ履歴

標準列:

| 列 | 内容 |
|---|---|
| 作成日時 | created_at |
| 種別 | scheduled daily等 |
| 状態 | completed / failed / stopped |
| 対象 | customer/project/cycle/item件数 |
| 結果 | succeeded / failed / cancelled |
| 起点 | scheduler/admin/quality/incident |
| 親batch | retry/recoveryの場合 |
| 所要時間 | startedからterminal |
| 関連障害 | incident ID |

### 10.4 期間

- default: 直近7業務日
- P0の画面取得上限: 90日
- それより古い履歴は日付範囲を狭めるよう案内する
- cursor paginationを使用する

### 10.5 再処理履歴

再処理を独立したcycleとして重複表示しない。cycle detailのrevision履歴と、サイクル一覧の`再処理N回`で示す。

---

## 11. 一括正式測定 対象選択 `/admin/measurements/bulk`

### 11.1 目的

現在業務日の複数projectについて、正式サイクルの新規作成または既存正式サイクルの再処理を安全に準備する。

### 11.2 候補母集団

- 管理者のeffective scope内
- project active
- active contractとactive entitlementあり
- current configuration revisionあり
- `automation_control != blocked_by_system`
- 現在業務日
- read consistencyが正常

`intentionally_excluded`、`precheck_exception`、decision未確定は一覧へ表示してよいが、選択不可とし理由を示す。

### 11.3 標準列

```text
選択
顧客・project
対象判定
現在の正式サイクル
予定command
推定論理項目数
現在の競合処理
実行可否
```

### 11.4 planned command

```text
create_formal_daily
reprocess_existing_cycle
not_allowed
```

### 11.5 Selection

- P0は現在取得済みpageの選択を基本とする。
- serverが返す`max_selectable_projects`と`max_estimated_logical_items`を超えられない。
- UIへ固定値を埋め込まない。
- disabled rowをcheckbox選択できない。
- 「全件選択」は現在page内であることを明記する。

### 11.6 次へ進む条件

- 1件以上の実行可能projectを選択
- selection snapshot tokenが有効
- read dataがstale/unknownでない
- 管理者が全対象scopeを持つ

---

## 12. 一括正式測定 確認 `/admin/measurements/bulk/confirm`

### 12.1 Preview response

```text
selection_token
read_snapshot_id
business_date
rows[]
create_count
reprocess_count
blocked_count
estimated_logical_item_count
estimated_initial_attempt_count
max_limits
expires_at
expected_versions
```

### 12.2 画面構成

```text
対象と影響の要約
新規正式サイクル
既存サイクル再処理
実行不可・除外
理由入力
最終確認
```

推定原価金額はP0で必須にしない。論理項目数と初回attempt数を表示する。

### 12.3 W2確認

必須:

- business date
- 対象project数
- create/reprocess内訳
- 前回結果・現在公開版を維持したまま再処理すること
- 追加原価が発生し得ること
- reason code
- reason text
- idempotency key
- selection token
- expected row versions

button:

```text
一括正式測定を開始
```

### 12.4 実行時再検査

serverは全projectについて次を再検査する。

- capabilityとscope
- project/contract/entitlement/configuration
- daily decision
- existing formal cycle
- active reprocessing
- active batch assignment
- AI model control
- tenant boundary
- row version
- token expiry

scope違反が1件でも含まれる場合は、対象の存在を漏らさずcommand全体を拒否する。

state driftだけが発生した場合は、認可済み範囲内でproject単位に`accepted / skipped_conflict / blocked`を返せる。acceptedが0件ならbatchを作らない。

### 12.5 成功後

```text
要求を受け付けました
新規正式サイクル N件
再処理 N件
状態変更により除外 N件
```

1つ以上のbatchが作成された場合は、代表batchまたは実行中tabへのリンクを表示する。

同じidempotency keyの再送では同じ受理結果を返し、cycle・revision・batchを増やさない。

---

## 13. Cycle詳細 `/admin/measurements/cycles/[cycleId]`

### 13.1 Header

表示:

```text
顧客名 / project名
正式日次 または 追加検証
business date
cycle ID
status / current stage
trigger source
使用configuration revision
使用contract version
使用entitlement
read freshness
```

主command:

- 正式サイクル再処理 W2
- 失敗項目を再測定 W1
- 追加検証では同じ追加検証の再実行ではなく、必要なら新しい追加検証を作成

関連リンク:

- project詳細
- 関連品質例外
- 公開候補または公開版
- 関連incident

### 13.2 Tabs

```text
概要
測定項目・試行
統合・解析
関連バッチ
履歴
```

### 13.3 概要tab

12カラム:

```text
工程・現在状態                 8
主要件数                       4
安全な前回結果                 8
関連例外・後続工程             4
```

主要件数:

- logical item
- current revision採用成功
- final failed
- excluded
- total attempt
- additional attempt
- running assignment

### 13.4 Stage progress

formal daily:

```text
事前判定
測定
統合
解析
候補生成
品質
公開
表示検証
```

additional validation:

```text
事前判定
測定
統合
解析
完了
```

追加検証に候補生成以降をdisabled工程として表示しない。工程自体を出さない。

### 13.5 前回結果保持

再処理中で`current_revision_id`が存在する場合、次を明示する。

```text
前回確定結果を保持したまま再処理しています
```

新revisionが失敗した場合:

```text
再処理は完了できませんでした。前回確定結果を維持しています
```

### 13.6 State action

commandは`available_commands`から生成する。UI独自条件で表示しない。

- active batchがある間は同じ対象の再処理commandを返さない
- open human quality caseが再処理方法を決める状態では、品質ページへの遷移だけを返す
- stale/unknownではW2を返さない

---

## 14. 測定項目・試行tab

### 14.1 Item table

標準列:

```text
prompt要約
AIモデル
言語・地域
item状態
current revision採用attempt
attempt数
最新結果
latency
最終error
操作
```

prompt全文は`measurement_payload`閲覧権限がある場合だけdrawerで表示する。listではexcerptとprompt IDを使う。

### 14.2 Item状態

```text
pending
running
succeeded
failed
excluded
cancelled
```

`succeeded`表示は、current revisionのmappingが成功attemptを参照する場合に限る。過去revisionだけで採用されているattemptを現在成功として数えない。

### 14.3 Attempt drawer

表示:

- attempt ID / number
- attempt kind
- batch / assignment
- AI model
- request start / end
- status
- latency
- HTTP/provider要約
- token・usage要約
- result arrival state
- error codeと安全なmessage
- payloadまたはpayload summary
- correlation ID
- related system events

表示禁止:

- API key
- Authorization header
- cookie
- provider secret
- internal queue credential

### 14.4 遅延結果

`timed_out`または`cancelled`後に結果が到着しても、attempt statusと採用mappingを変更しない。

表示:

```text
遅延到着・採用対象外
```

診断用metadataは表示してよいが、正式結果へ採用するcommandは作らない。

### 14.5 失敗項目再測定

checkboxは、serverが`retryable = true`を返したfailed itemだけに表示する。

- running、pending、excludedは選択不可
- current revisionで既に成功採用済みのitemは通常選択不可
- quality actionまたはincident recoveryが明示した場合だけ例外的に再測定候補となる

---

## 15. 統合・解析tab

### 15.1 Revision list

標準列:

```text
revision number
status
作成理由
採用item数
欠損item数
analysis status
created_at
finalized_at
current / superseded
```

### 15.2 正式なcurrent判定

```text
measurement_cycle.current_revision_id = revision.id
```

最大revision numberを自動的にcurrentとみなさない。

### 15.3 Revision detail

表示:

- source attempt mapping count
- missing/excluded count
- input configuration revision
- integration rule version
- analysis rule version
- result digest
- related candidate ID（formal dailyのみ）
- failure reason

mappingは読み取り専用。attempt差し替えUIを作らない。

### 15.4 Finalize原則

revision finalizeはsystem-only。

```text
building revision
  ↓
全mappingとintegrated resultをtransactionで確定
  ↓
revision finalized
  ↓
cycle.current_revision_id更新
```

途中失敗でcurrent pointerだけが変わることを禁止する。

---

## 16. 関連batch tab

cycleに関連する全batchを時系列で表示する。

```text
scheduled_daily
manual_formal
additional_validation
retry_failed_items
incident_recovery
```

各行:

- batch ID
- type
- status
- parent batch
- assignment count
- succeeded / failed / cancelled
- started / terminal time
- trigger actor要約
- incident / quality action

同じcycleが複数batchに含まれてもcycle件数を増やさない。

---

## 17. Batch詳細 `/admin/measurements/batches/[batchId]`

### 17.1 Header

```text
batch type
batch ID
status
business date
作成起点
対象customer/project/cycle/item件数
親batch
関連incident
freshness
```

command:

```text
一時停止
再開
安全停止
失敗項目を再測定
```

stateとcapabilityに応じて表示する。

### 17.2 Progress summary

```text
queued
running
retry_wait
succeeded
failed
cancelled
```

進捗率:

```text
(succeeded + failed + cancelled) / assignment_count
```

failedやcancelledを成功として見せない。色だけで判別させず件数とlabelを表示する。

### 17.3 Assignment table

| 列 | 内容 |
|---|---|
| project・cycle | 対象識別 |
| item | prompt要約、AI model |
| state | queued等 |
| attempt | 現在/最新attempt番号 |
| auto retry | 使用回数 / 上限 |
| latency | 最新attempt |
| error | code要約 |
| 最終更新 | timestamp |
| 操作 | attempt drawer、cycle詳細 |

### 17.4 PauseMeasurementBatch W2

受理条件:

```text
status in (queued, running)
```

正式動作:

```text
status = pausing
新しいassignment claimを停止
実行中attemptは原則完了させる
runningが0件になったらstatus = paused
```

pauseはcycleをexceptionやstoppedへ変更しない。

確認dialog:

- 実行中attempt数
- queued/retry_wait数
- 完了済み結果を保持すること
- 再開まで新しいattemptを開始しないこと
- reason

### 17.5 ResumeMeasurementBatch W2

受理条件:

```text
status = paused
```

再開時にscope、AI model control、project automation、incident制御、assignmentの重複を再検査する。

```text
paused -> running
```

`failed`または`stopped`は再開対象外。新retry/recovery batchを作る。

### 17.6 StopMeasurementBatch W3

受理条件:

```text
status in (queued, running, pausing, paused)
```

正式動作:

```text
status = stopping
新しいclaimを停止
queued/retry_wait assignmentをcancelled
running attemptへ取消要求
worker drain
status = stopped
```

- 完了済みattemptは削除しない。
- 取消要求より先に成功したattemptは成功事実として保存する。
- timeout/cancelled後の遅延結果は採用しない。
- 未完了の必須itemが残るcycleは`exception / measurement`へ移し、必要ならquality caseを作る。
- batch停止だけでcycleを`stopped`へ一括変更しない。

W3必須:

- step-up
- batch ID typed confirmation
- 対象project/cycle/item件数
- 実行中attempt数
- 顧客画面は前回安全版を維持すること
- cycleが例外化する可能性
- reason

### 17.7 terminal batch

```text
completed
failed
stopped
```

terminal batchへpause/resume/stopを返さない。

- `failed`: retryable itemがあれば`RetryFailedItems`
- `stopped`: incident recoveryまたは明示的なretry batch
- `completed`: 読み取りのみ

---

## 18. 追加検証dialog

### 18.1 入力

```text
project
検証理由
対象AIモデル
prompt対象
  - active prompt set全件
  - 既存promptの選択
  - topic/persona/filterによる既存prompt subset
```

入力しないもの:

```text
新しい自由入力prompt
顧客公開設定
正式日次business dateの上書き
品質decision
```

### 18.2 Preview

表示:

- projectとactive configuration revision
- 対象prompt数
- AIモデル数
- 推定logical item数
- active entitlement
- 一時停止中modelの除外
- 正式結果へ反映されないこと
- 内部原価が発生すること

### 18.3 Command

`CreateAdditionalValidation`はW1だが、非同期処理である。

成功message:

```text
追加検証を受け付けました。正式日次と顧客公開には直接反映されません。
```

cycleとbatchを冪等に作り、cycle detailへ遷移する。

### 18.4 利用可能条件

- active project
- active contract/version/entitlement
- active configuration revision
- `automation_control != blocked_by_system`
- 対象AIモデルが利用可能
- 既存promptだけ
- 同じidempotency keyで重複cycleを作らない

`paused_by_admin`では、追加検証を許可できる。ただし「日次自動測定は停止中だが、この追加検証は実行される」と明示する。

---

## 19. 失敗項目再測定

### 19.1 対象

- item status = failed
- latest terminal attemptがfailedまたはtimed_out
- retry budget消化後
- 非終端assignmentなし
- current input revisionと一致
- retryable error code

### 19.2 実行単位

単一item、選択item、cycle内の全retryable failed itemを対象にできる。

P0では複数cycleを跨ぐ失敗項目一括再測定を通常UIへ置かない。incident recoveryは障害管理から作成する。

### 19.3 Command

`RetryFailedItems` W1。

副作用:

```text
retry_failed_items batch
batch item assignment
manual_retry attempt
必要ならbuilding revision
```

管理者要求はaudit logへ1回、batch作成・attempt開始・完了はsystem eventへ記録する。

### 19.4 実行後

cycleがexceptionの場合はrunningへ戻す。current revisionがある場合は保持する。新revision finalize後にだけ採用結果を切り替える。

---

## 20. Command availability

### 20.1 手動正式測定

返す条件:

```text
measurement.formal.trigger
AND scope内
AND today
AND fresh/consistent
AND decision = eligible
AND cycle absent or reprocessable
AND no conflicting active work
```

### 20.2 追加検証

返す条件:

```text
measurement.validation.create
AND active project/config/entitlement
AND not blocked_by_system
AND selectable prompt/model exists
```

### 20.3 retry

返す条件:

```text
measurement.retry
AND retryable failed item exists
AND no active assignment for target item
```

### 20.4 pause/resume/stop

```text
pause  -> measurement.batch.manage + queued/running
resume -> measurement.batch.manage + paused
stop   -> measurement.batch.stop + queued/running/pausing/paused + step-up
```

### 20.5 非表示規則

- capabilityなし: commandを返さない
- scope外: entity存在も示さない
- state不適合: commandを返さず、必要なら`unavailable_reason_code`だけを権限範囲内で返す
- stale/unknown: W2/W3を返さない
- system block: 通常resumeを返さず、incident recoveryへ遷移

---

## 21. Read model契約

### 21.1 基幹model

```text
DailyTargetRunSummary
DailyMeasurementStatus
MeasurementCycleSummary
MeasurementCycleRevisionSummary
MeasurementItemSummary
MeasurementAttemptSummary
MeasurementBatchSummary
MeasurementBatchAssignmentSummary
BulkMeasurementPreview
TimelineEntry
```

### 21.2 Snapshot

次を同じ`read_snapshot_id`で返す。

- summary counts
- facet counts
- list rows
- available commandsの前提version
- freshness

listとfacetを別時刻で読み、件数不一致を起こさない。

### 21.3 Current selected success count

```text
count(measurement_cycle_revision_item)
WHERE revision_id = measurement_cycle.current_revision_id
AND selected_attempt.status = succeeded
```

`measurement_item.selected_attempt_id`や最新attemptだけで数えない。

### 21.4 Additional attempt count

```text
sum(max(attempt_count_per_item - 1, 0))
```

追加検証cycleかどうかとは別の指標である。

### 21.5 Batch badge

```text
count distinct measurement_batch.id
WHERE status in (queued, running, pausing, paused, stopping)
AND effective scope intersects batch scope
```

同じbatchをproject数だけ重複計上しない。

---

## 22. 権限・scope・redaction

### 22.1 標準担当

主担当は`measurement_operator`。

- `customer_operator`は顧客・project詳細から測定summaryを閲覧できるが、batch操作はできない。
- `quality_reviewer`は測定payloadと結果を品質判断のため閲覧できる。
- `publication_operator`は測定summaryのみで、measurement payload全文は必要範囲に限定する。
- `system_operator`はoperational summaryと障害診断要約を閲覧できる。
- `cost_analyst`は測定payloadを閲覧できない。
- `auditor`は監査目的で閲覧できるがwrite commandは持たない。

### 22.2 Batch scope

batch詳細を閲覧・操作するには、batch内の全対象に対する必要scopeを持つことを原則とする。

部分scopeだけを持つ管理者には、次のいずれかとする。

- batch row自体を返さない
- `measurement.read`の監査用要約として、自scopeに属するassignmentだけを別queryで返す

P0のpause/resume/stopは全batchへ影響するため、部分scopeでは実行できない。

### 22.3 Measurement payload

- list: prompt excerpt、model、status、件数
- detail: capability/roleに応じてprompt、AI回答、解析根拠
- secret:常に省略
- customer sensitive: measurement operatorへ返さない
- publication payload: measurement operatorへ返さない

### 22.4 Bulk scope

一括正式測定では全選択projectが、同じ管理者の有効role assignment scope内であることをserver側で再検査する。

---

## 23. 監査・system event

### 23.1 Audit対象

```text
CreateFormalDailyCycle
ReprocessFormalDailyCycle
ExecuteBulkFormalMeasurement
CreateAdditionalValidation
RetryFailedItems
PauseMeasurementBatch
ResumeMeasurementBatch
StopMeasurementBatch
```

成功、拒否、失敗、idempotent replayを記録する。

### 23.2 非同期境界

管理者command受理:

```text
audit_log
result = success
outcome = ACCEPTED_ASYNC
```

その後:

```text
system_event
cycle created
batch created
attempt started
attempt completed
revision finalized
cycle advanced
```

管理者auditを処理完了時に重複保存しない。

### 23.3 Bulk audit

一括操作はaudit logをproject数だけ複製しない。

```text
audit_log 1行
  ├ audit_log_scope customer/project A
  ├ audit_log_scope customer/project B
  └ audit_log_scope customer/project C
```

before/after summaryにはID、command plan、件数、reason、accepted/skipped内訳だけを保存し、prompt・AI回答全文を含めない。

---

## 24. 同時実行・冪等性

### 24.1 必須制約

```text
UNIQUE(project_id, business_date) WHERE purpose = formal_daily
UNIQUE(measurement_cycle_id, revision_number)
UNIQUE(measurement_cycle_revision_id, measurement_item_id)
UNIQUE(measurement_item_id, attempt_number)
UNIQUE(measurement_batch_id, measurement_item_id)
UNIQUE(measurement_cycle_id, logical_item_key)
```

部分一意制約または同等の排他制御:

```text
1 cycleにつきbuilding revision最大1件
1 itemにつき非終端assignment最大1件
1 batchにつき非終端のpause/stop command最大1件
```

### 24.2 Row lock

- formal cycle作成: project・business date key
- cycle reprocessing開始: cycle row
- revision finalize: cycle row＋building revision
- assignment claim: assignment row
- attempt number採番: item rowまたはsequence
- batch control: batch row

### 24.3 Idempotency

- command endpointはidempotency key必須
- bulkはselection token＋idempotency key
- system retryはcorrelation IDとsource command IDを引き継ぐ
- replay時は既存cycle、batch、revisionを返す

### 24.4 Late result race

result arrivalとtimeout処理はattempt rowをロックして競合解決する。

- resultが先: succeeded
- timeoutが先: timed_out、遅延結果は採用不可
- cancelledが先: cancelled、遅延結果は採用不可

---

## 25. Error・安全表示

### 25.1 Command error code

```text
MEASUREMENT_DECISION_NOT_ELIGIBLE
FORMAL_CYCLE_ALREADY_EXISTS
FORMAL_CYCLE_NOT_REPROCESSABLE
ACTIVE_REPROCESSING_EXISTS
ACTIVE_ASSIGNMENT_CONFLICT
BATCH_NOT_PAUSABLE
BATCH_NOT_RESUMABLE
BATCH_NOT_STOPPABLE
NO_RETRYABLE_ITEMS
REVISION_POINTER_CONFLICT
SELECTION_TOKEN_EXPIRED
BULK_LIMIT_EXCEEDED
READ_MODEL_STALE
READ_MODEL_INCONSISTENT
AI_MODEL_UNAVAILABLE
PROJECT_AUTOMATION_BLOCKED
```

### 25.2 Row version競合

```text
状態が更新されました。最新状態を確認してください。
```

古い画面の入力を保持したまま再取得し、W2/W3は再確認を要求する。

### 25.3 Section failure

cycle detailでattempt section取得に失敗しても、headerと安全状態を残す。0件として表示しない。

### 25.4 Fail closed

次の場合、手動実行を開始しない。

- scope解決失敗
- tenant境界不明
- current configuration不明
- AI model control不明
- revision pointer不整合
- read snapshot stale/unknown

---

## 26. 具体レイアウト

### 26.1 `/admin/measurements` 1440×900

```text
context bar                                      56
page header + commands                           72
local tabs                                       44
summary strip                                    72
run/status or running summary                    56
filter bar                                       48
table header                                     40
table rows 6〜8行                               288〜384
pagination / footer                              40
```

page全体の横scrollは禁止。tableだけ内部横scrollを許可する。

### 26.2 1366×768

- page headerを64px以内
- summary stripを1行
- run rowをcompact表示
- filterを1行＋overflowへ集約
- table rowsを最低5行表示
- primary state、project、progress、actionを残す
- 補助ID、複数model詳細を省略可能

### 26.3 Cycle detail

desktop:

```text
header                                12 columns
stage + summary                        8 + 4
main tab content                       8
right related/safety panel             4
```

1366pxではright panelをmain下へ落とさず、compact cardとして4columnを維持する。内容が多い場合はdrawerへ送る。

### 26.4 Batch detail

上部にstatus・progress・commandを置き、assignment tableを主役にする。worker内部情報のカードを大量に並べない。

### 26.5 Dialog

- 追加検証: 640px、内容が多い場合内部scroll
- W2: 560px
- W3 stop: 640px
- confirm submit中は二重送信禁止
- W3 submit中はEscとbackdrop closeを無効化

---

## 27. P0で作らないもの

- 顧客別・project別の独自測定スケジュール
- 週次・月次plan
- 過去日を自由指定する通常の一括正式測定
- arbitraryな新規promptによる追加検証
- 追加検証から正式日次への昇格
- batch worker手動割当
- queue priorityの画面編集
- provider request payloadの直接再送
- attempt結果の手動採用・差し替え
- revision mapping editor
- completed/failed/stopped batchの直接再開
- 複数cycleを跨ぐ通常の失敗項目一括再測定
- 品質例外の一括承認
- 全件手動品質承認
- 全件手動公開
- 高度な原価見積り
- raw queue監視console
- mobile専用測定運用画面

---

## 28. 受け入れ条件

### 28.1 日次対象・正式サイクル

1. 本日の測定tabが共通`business_date`を使用する。
2. 日次開始前をcycle欠落として表示しない。
3. `eligible`を正式サイクル期待件数へ含める。
4. `precheck_exception`を正式サイクル期待件数へ含める。
5. `intentionally_excluded`を正式サイクル期待件数へ含めない。
6. `precheck_exception`でcycleが`exception/precheck`として表示される。
7. `intentionally_excluded`にcycle作成commandを返さない。
8. decision未確定に手動正式測定commandを返さない。
9. run/decision system failureをprecheck exceptionとして表示しない。
10. SLA内のcycle未作成を`awaiting`と表示する。
11. SLA超過後だけ`overdue_missing`と表示する。
12. 同一project・business dateのformal dailyを2件作れない。
13. schedulerと手動作成が競合しても1cycleへ収束する。
14. late activation cycleが本日の期待件数へ含まれる。
15. summary、facet、tableが同じsnapshotで一致する。

### 28.2 手動正式測定・一括正式測定

16. cycleなし・eligibleの場合に新規formal cycle planを返す。
17. 既存cycleの場合にreprocess planを返す。
18. 既存cycleがあると2件目のformal cycleを作らない。
19. precheck exceptionを通常のreprocessで開始できない。
20. system block中に手動正式測定を開始できない。
21. 一括previewがcreate/reprocess/not allowedをproject単位で返す。
22. 一括選択にscope外projectが混入した場合command全体を拒否する。
23. state driftだけの場合、認可済みprojectをaccepted/skippedに分けられる。
24. accepted 0件ではbatchを作らない。
25. selection token期限切れで実行できない。
26. server limit超過で実行できない。
27. 同じidempotency key再送でcycle・batchが増えない。
28. 一括操作のaudit logがproject数だけ複製されない。
29. audit_log_scopeから対象projectを検索できる。
30. confirm画面が推定logical itemとattempt数を表示する。

### 28.3 Cycle・revision

31. 完了済みformal cycleを明示的なW2で再処理できる。
32. 再処理開始中も旧current revisionを維持する。
33. 再処理開始中も現在公開版を維持する。
34. cycleにbuilding revisionを同時に2件作れない。
35. revision finalize前にcurrent_revision_idを変更できない。
36. current_revision_idが同じcycleのfinalized revisionだけを参照する。
37. revision mappingがitemとselected attemptを不変に保持する。
38. 新revision採用後に旧revisionをsupersededとして取得できる。
39. 新revision失敗時に旧current revisionが維持される。
40. latest revision numberだけをcurrentと誤判定しない。
41. current selected success countがrevision mappingから算出される。
42. 過去revisionのselected attemptが後続retryで変化しない。
43. additional validation revisionからcandidateを生成できない。
44. additional validationがanalysis完了でcompletedになる。
45. formal cycleだけにpublication summaryを返す。

### 28.4 Item・attempt

46. logical itemをattempt数だけ重複計上しない。
47. attempt再試行で過去attemptを上書きしない。
48. attempt numberがitem内で一意になる。
49. initial、automatic retry、manual retry、incident recoveryを区別できる。
50. automatic retryが同じassignmentで新attemptを作る。
51. manual retryが新しいretry batchとassignmentを作る。
52. retry budget超過後にassignmentがfailedになる。
53. timed out attemptをsucceededへ書き換えない。
54. cancelled attemptをsucceededへ書き換えない。
55. timeout後の遅延結果をcurrent revisionへ採用できない。
56. secretがattempt drawerへ出ない。
57. measurement payload権限なしでprompt・AI回答全文を返さない。
58. failed itemだけをretry候補へ返す。
59. active assignmentがあるitemをretry選択できない。
60. excluded itemを通常retryできない。

### 28.5 Batch

61. batch typeが5種の正式codeだけになる。
62. scheduled daily batchとmanual formal batchを区別できる。
63. 1batchが複数project/cycleを持てる。
64. 1cycleが複数batch履歴を持てる。
65. 同じitemを複数の非終端batchへ同時割当できない。
66. pause要求でstatusがpausingになる。
67. pausing中に新しいassignmentをclaimしない。
68. 実行中attemptがdrainした後にpausedになる。
69. paused batchをW2で同じbatchへ再開できる。
70. failed batchへresume commandを返さない。
71. stopped batchへresume commandを返さない。
72. stop要求でstatusがstoppingになる。
73. stop時にqueued/retry_wait assignmentがcancelledになる。
74. stop時に実行中attemptへ取消要求が送られる。
75. stop完了後にbatchがstoppedになる。
76. batch停止だけで全cycleをstoppedへ変更しない。
77. 未完了必須itemのcycleがmeasurement exceptionになる。
78. 完了済みattemptがbatch stopで削除されない。
79. batch progressがterminal assignment / totalで計算される。
80. サイドバーバッジと実行中batch facetが一致する。
81. 同じbatchをproject数だけバッジへ重複計上しない。
82. partial scope管理者がbatch全体をpause/stopできない。
83. W3 stopにstep-up、typed confirmation、理由が必要になる。
84. terminal batchへpause/resume/stopを返さない。
85. retry batchからparent batchを追跡できる。

### 28.6 追加検証

86. active configurationの既存promptだけを選べる。
87. arbitraryな自由入力promptを追加できない。
88. entitlement外AIモデルを選べない。
89. paused_by_admin中は警告付きで追加検証を許可できる。
90. blocked_by_system中は追加検証を開始できない。
91. 追加検証がdaily target decisionを作らない。
92. 追加検証がformal daily件数へ混ざらない。
93. 追加検証に公開状態を表示しない。
94. 追加検証から正式反映commandを返さない。
95. 同じidempotency keyで追加検証cycleが重複しない。

### 28.7 UI・freshness・権限

96. 1366×768でsummaryとtable5行以上を確認できる。
97. 1440×900でtable6〜8行を確認できる。
98. page全体の横scrollが発生しない。
99. table内部だけ必要時に横scrollできる。
100. stale時にW2/W3を開始できない。
101. section failureを0件として表示しない。
102. scope外行だけでなくscope外facet countも返さない。
103. customer sensitive情報をmeasurement operatorへ返さない。
104. publication payloadをmeasurement operatorへ返さない。
105. auditorがwrite commandを受け取らない。
106. available commandとendpointが同じ正式条件を再検査する。
107. row version競合で古いcommandを実行しない。
108. running tabだけが高頻度pollingを行う。
109. terminal batch後に高頻度pollingを停止する。
110. dialog入力中のbackground refreshで入力が消えない。

### 28.8 監査・履歴

111. 手動正式測定の管理者要求がaudit logへ1回保存される。
112. batch作成とattempt開始がsystem eventへ保存される。
113. 管理者要求の完了時に同じaudit logを二重保存しない。
114. denied、failed、idempotent replayを監査できる。
115. cycle detail timelineがaudit、system event、revision遷移を統合表示する。
116. batch detail timelineがpause/resume/stopの要求と実処理を区別する。
117. historyのサイクル一覧が再処理回数を重複cycleとして数えない。
118. historyのbatch一覧がretry/recoveryの親子関係を表示する。
119. prompt・AI回答全文をaudit before/afterへ保存しない。
120. correlation IDでcommand、batch、attempt、revisionを追跡できる。

---

## 29. 実装順

1. 正式状態モデル v2.1のmigration設計
2. `measurement_cycle.current_revision_id`
3. `measurement_cycle_revision_item`
4. batch type・status・assignment retry state
5. attempt kindとlate result規則
6. cycle/batch/item/attemptのDB制約
7. formal cycle作成・再処理command service
8. additional validation command service
9. automatic retryとmanual retry batch service
10. batch pause/resume/stop service
11. read model v2.0のSQL view・query composer
12. measurement authorizationとscope resolver
13. audit writer・system event
14. `/admin/measurements` 3tab
15. bulk select・confirm
16. cycle detail
17. batch detail
18. drawer/dialog
19. 受け入れ条件1〜120の自動テスト
20. 1366×768・1440×900 visual regression

UI実装を先行させず、少なくとも1〜13を固定・テストしてから画面を接続する。

---

## 30. 最終統合後の位置づけ

本仕様v1.1は、canonical manifest v1.0に含まれる測定管理の正式画面仕様である。

新しい画面仕様を追加する段階は完了した。実装時は、正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0、共通レイアウトv1.1から生成したAPI contractと`available_commands`だけを使用する。
