# レコラ管理画面 P0 利用量・コスト画面仕様書

- 文書ID: `RECORA-ADMIN-P0-USAGE-COST`
- 版: `1.1`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 対象route: `/admin/usage-costs`
- 前提仕様:
  - 正式状態モデル v2.1
  - 管理画面用read model v2.0
  - 権限・監査仕様 v2.0
  - 共通レイアウト仕様 v1.1
- 優先順位: 本仕様は過去の利用量・原価画面案、請求・粗利・予算を含む将来案より優先する

---

## 0A. v1.1 最終横断統合更新

利用量・コストの画面責任・P0範囲はv1.0から変更しない。最終横断レビューにより、前提基盤を正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0へ更新する。

- 状態enumとcommand state effectは正式状態モデルv2.1を正とする。
- 表示code、件数、badge、facet、available command入力はread model v2.0を正とする。
- capability、scope、risk、command code、auditは権限・監査仕様v2.0を正とする。
- 正式routeと採用文書はcanonical manifest v1.0を正とする。

---

## 0. 正式決定

利用量・コスト領域のP0は、**実際に発生した利用量と内部変動原価を、運用上の原因まで追跡できる読み取り中心の画面**とする。

正式な責任は次である。

```text
利用事実を追記型で記録
↓
適用時点の原価単価を照合
↓
原価を追記型で算定
↓
顧客・プロジェクト・AIモデル・サイクル・バッチへ帰属
↓
管理画面とCSVで同じsnapshotを表示
```

P0で管理者が行える書き込み操作は、原価CSVの生成要求だけである。

次は行わない。

```text
usage recordの手動追加・編集・削除
cost recordの手動調整
pricing definitionの画面編集
未算定問題の担当者設定・解決workflow
顧客請求額の作成
売上・粗利・予算の計算
請求書・会計データとの照合
通貨換算ルールの管理
```

未算定や算定失敗は隠さず表示するが、P0では独立した原価異常ケースを作らない。共通障害なら`incident`、単純な単価不足なら利用量・コスト画面の警告として扱う。

---

## 1. 目的

管理者が次を確認できるようにする。

1. 指定期間にどれだけの論理測定項目を処理したか。
2. AIへの実行試行が何回発生したか。
3. 再試行や障害補填による追加利用がどの程度か。
4. 現在の正式revisionへ採用された成功項目はいくつか。
5. 算定済みの内部変動原価はいくらか。
6. 未算定・推定・暫定・確定の内訳はどうなっているか。
7. 原価がどの顧客・プロジェクト・AIモデル・サイクル・バッチで発生したか。
8. 原価発生日と業務日帰属を切り替えると、どのように見えるか。
9. 未算定の理由が、usage不足、単価不足、通貨不一致、算定失敗のどれか。
10. 画面と同じ条件・同じ時点の明細をCSVで取得できるか。

---

## 2. 責任範囲

### 2.1 この領域で行うこと

- 利用量の集計
- 内部変動原価の集計
- 論理測定項目、実行試行、追加試行、採用成功の表示
- 正式日次と追加検証の分離
- 通常処理、再試行、障害補填の分離
- 顧客・プロジェクト別表示
- AIモデル別表示
- サイクル・バッチ別表示
- 原価発生日と業務日帰属の切り替え
- 未算定理由と算定品質の表示
- 同一filter・snapshotによるCSV出力
- 原価算定基盤のfreshness表示

### 2.2 この領域で行わないこと

- 測定の再実行
- batchの停止・再開
- 品質判断
- 公開判断
- 障害の解決
- pricing definitionの変更
- usage/costの手動補正
- 顧客請求・請求書作成
- 売上、粗利、予算、予実管理
- 為替レート入力・換算
- 原価異常の担当・状態・内部メモ管理

### 2.3 他領域との境界

| 状況 | 正式な解決先 |
|---|---|
| 測定attemptが過剰に失敗している | 測定管理または品質・例外レビュー |
| AIモデル障害で補填実行が増えた | 障害・監査 |
| 単価定義が存在しない | 管理設定のpricing適用状況。P0では読み取りのみ |
| 原価算定componentが停止 | 障害・監査 |
| usageは存在するがcostが未算定 | 利用量・コストの警告。共通障害ならincidentへ接続 |
| 顧客へ請求する金額 | P1以降。P0の内部原価とは別 |

---

## 3. 正式routeとページ構成

P0の独立routeは1つだけとする。

```text
/admin/usage-costs
```

ページ内のローカル表示は次で切り替える。

```text
概要
顧客・プロジェクト
AIモデル
サイクル・バッチ
```

原価record、usage record、pricing definitionの詳細はdrawerで表示する。P0では個別詳細routeを必須としない。

---

## 4. 正式データ単位

P0では次を正式データ単位とする。

```text
usage_record
cost_record
pricing_definition
cost_calculation_run
usage_cost_export_job
```

役割は次のとおりである。

| データ単位 | 責任 |
|---|---|
| `usage_record` | 1回の利用eventに含まれる1利用componentの不変事実 |
| `cost_record` | 1usage recordに対する1回の原価算定結果 |
| `pricing_definition` | provider・AIモデル・利用単位・適用期間ごとの不変単価定義 |
| `cost_calculation_run` | 原価算定処理1回の実行状態と集計結果 |
| `usage_cost_export_job` | filter・scope・snapshotを固定したCSV生成要求 |

`usage_record`と`cost_record`は会計仕訳、請求明細、売上明細ではない。

---

## 5. Usage record

### 5.1 記録単位

`usage_record`は、1回のprovider利用eventに含まれる**1利用componentにつき1行**とする。

例:

```text
1回のAI応答
├ input_tokens  4,200
├ output_tokens   820
└ request_count      1
```

上記は3件の`usage_record`になる。同じ呼び出しであることは`usage_event_key`で関連付ける。

### 5.2 必須属性

```text
usage_record_id
usage_event_key
usage_component_code
provider_code
provider_usage_event_id nullable
source_invocation_key
source_entity_type
source_entity_id
customer_id nullable
project_id nullable
ai_model_id nullable
service_tier_code nullable
usage_unit_code
usage_quantity nullable
usage_capture_status
unavailable_reason_code nullable
occurred_at
cost_incurred_date
business_date
workload_category
cycle_purpose nullable
attempt_reason_category
measurement_cycle_id nullable
measurement_batch_id nullable
measurement_item_id nullable
measurement_attempt_id nullable
incident_id nullable
correction_of_usage_record_id nullable
recorded_at
correlation_id
```

### 5.3 `usage_capture_status`

```text
reported
derived
unavailable
```

| 状態 | 意味 |
|---|---|
| `reported` | providerまたは実行基盤が実量を返した |
| `derived` | 正式な算定規則から数量を推定した |
| `unavailable` | 利用eventは確認できるが数量を確定・推定できない |

制約:

- `reported / derived`では`usage_quantity >= 0`を必須にする。
- `unavailable`では`usage_quantity`をNULLにし、理由codeを必須にする。
- 数量0は、providerが明示的に0を返した場合だけ記録できる。
- 取得できなかった数量を0へ変換してはならない。

### 5.4 Source entity

P0の`source_entity_type` allowlistは次とする。

```text
measurement_attempt
project_setup_run
measurement_cycle_revision
publication_candidate_generation_run
quality_check_run
publication_delivery_verification
incident_recovery_step
```

measurement関連では可能な限り、cycle、batch、item、attemptのIDを固定する。

### 5.5 Workload category

```text
project_setup
formal_daily
additional_validation
quality_reprocessing
publication_generation
publication_delivery
incident_recovery
other_automation
```

画面の主要比較では次の3群にまとめてよい。

```text
正式日次
追加検証
その他の自動処理
```

ただし、元の`workload_category`を失わない。

### 5.6 Attempt reason category

```text
normal
retry
incident_compensation
```

導出優先順位:

```text
incident recoveryまたはincident-linked compensation
→ incident_compensation

それ以外のautomatic/manual retry
→ retry

それ以外
→ normal
```

`incident_compensation`を通常retryへ混ぜない。

### 5.7 日付

```text
cost_incurred_date
→ occurred_atをP0の原価基準timezoneで日付化

business_date
→ sourceとなる正式業務処理のbusiness date
```

P0の原価基準timezoneはプラットフォーム設定値を使用し、初期値は`Asia/Tokyo`とする。

両日付はrecord作成時に固定し、後日のtimezone設定変更で過去recordを再帰属しない。

### 5.8 不変性と訂正

`usage_record`はappend-onlyとする。

誤ったprovider usageの訂正が必要な場合は、system actorが新recordを作り、`correction_of_usage_record_id`で関連付ける。元recordを更新・削除しない。

read modelは、訂正chainで最新の有効recordだけをcurrent factへ採用する。

P0では管理者によるusage訂正UIを作らない。

### 5.9 重複防止

provider usage IDがある場合:

```text
UNIQUE(provider_code, provider_usage_event_id, usage_component_code)
```

provider usage IDがない場合:

```text
UNIQUE(provider_code, source_invocation_key, usage_component_code)
```

同じprovider responseの再送でusageを二重計上しない。

---

## 6. Pricing definition

### 6.1 責任

`pricing_definition`は、内部変動原価を算定するための単価定義である。

顧客向け価格、契約料金、請求単価ではない。

### 6.2 必須属性

```text
pricing_definition_id
pricing_key
provider_code
ai_model_id nullable
service_tier_code nullable
usage_unit_code
unit_size
rate_amount
currency_code
rate_confidence
application_status
effective_from
effective_to nullable
source_reference
version_number
supersedes_pricing_definition_id nullable
created_at
activated_at nullable
```

### 6.3 Application status

```text
scheduled
active
superseded
cancelled
invalid
```

P0では管理画面からstatusを変更しない。

### 6.4 Rate confidence

```text
estimated
provisional
final
```

| 値 | 意味 |
|---|---|
| `estimated` | 正式価格が未確定で、内部推定単価を使用 |
| `provisional` | provider公開価格等に基づくが、適用確認が暫定 |
| `final` | P0の内部原価計算基準として確定済み |

`final`は請求書照合済み、会計確定済みという意味ではない。

### 6.5 適用期間

```text
effective_from <= usage_record.occurred_at
AND
(effective_to IS NULL OR usage_record.occurred_at < effective_to)
```

現在時刻ではなく、利用発生時刻で単価を選ぶ。

同じmatch keyで有効期間が重なる`active / scheduled` definitionを作らない。

match key:

```text
provider_code
ai_model_id
service_tier_code
usage_unit_code
currency_code
```

### 6.6 単価変更

active definitionを直接編集しない。

```text
新definition作成
↓
適用検証
↓
新definitionをactive
↓
旧definitionをsuperseded
↓
対象usageを新しいcost calculation runで再算定
```

P0ではこの変更UIを作らず、管理設定では適用状況を読み取るだけとする。

### 6.7 通貨

P0では、1つの内部原価表示通貨だけをサポートする。

```text
pricing_definition.currency_code
=
platform reporting currency
```

一致しない場合、画面内で自動換算せず`currency_mismatch`として未算定にする。

為替レート、換算履歴、複数通貨集計UIはP1へ送る。

---

## 7. Cost calculation run

### 7.1 Status

```text
queued
running
completed
completed_with_uncomputed
failed
cancelled
```

### 7.2 意味

| 状態 | 意味 |
|---|---|
| `queued` | 算定待ち |
| `running` | 算定中 |
| `completed` | 対象recordをすべて算定できた |
| `completed_with_uncomputed` | runは完了したが未算定recordが残った |
| `failed` | run自体が完了できなかった |
| `cancelled` | 対象失効などにより開始・継続しなかった |

`completed_with_uncomputed`をsystem failureとして扱わない。一方、未算定recordは画面で明示する。

### 7.3 必須属性

```text
cost_calculation_run_id
trigger_type
status
scope_type
customer_id nullable
project_id nullable
usage_record_from nullable
usage_record_to nullable
pricing_definition_set_version
calculator_version
requested_at
started_at nullable
completed_at nullable
usage_record_count
calculated_record_count
uncomputed_record_count
failure_code nullable
retry_of_run_id nullable
correlation_id
```

`trigger_type`:

```text
usage_ingested
pricing_definition_activated
scheduled_reconciliation
manual_export_precheck
incident_recovery
```

管理者が任意のcost runを直接作るUIはP0では作らない。

### 7.4 Retry

failed runを`queued`へ戻さない。

```text
failed run
↓
新しいrun
＋ retry_of_run_id
```

---

## 8. Cost record

### 8.1 記録単位

1件の`usage_record`に対する、1回の算定結果を1件の`cost_record`として保存する。

同じusage recordを再算定する場合、既存recordを更新せず新しい`calculation_version`を作る。

### 8.2 必須属性

```text
cost_record_id
usage_record_id
cost_calculation_run_id
calculation_version
calculation_status
cost_amount nullable
currency_code
pricing_definition_id nullable
quantity_used nullable
unit_size nullable
rate_amount nullable
calculation_method_version
uncomputed_reason_code nullable
calculation_note_code nullable
supersedes_cost_record_id nullable
calculated_at
cost_incurred_date
business_date
correlation_id
```

### 8.3 Calculation status

```text
uncomputed
estimated
provisional
final
```

### 8.4 Status決定規則

```text
usage quantityを利用できない
または単価を一意に選べない
または通貨不一致
または算定処理失敗
→ uncomputed

usage_capture_status = derived
または rate_confidence = estimated
→ estimated

usage_capture_status = reported
かつ rate_confidence = provisional
→ provisional

usage_capture_status = reported
かつ rate_confidence = final
→ final
```

複数条件がある場合の不確実性優先順位は次である。

```text
uncomputed
> estimated
> provisional
> final
```

### 8.5 Uncomputed reason

```text
usage_unavailable
pricing_not_found
pricing_ambiguous
unsupported_usage_unit
currency_mismatch
source_scope_inconsistent
calculator_failed
```

`uncomputed`では`cost_amount`をNULLにし、reason codeを必須にする。

### 8.6 0円と未算定

有効な数量・単価から計算結果が0になった場合だけ、0円を保存できる。

```text
uncomputed
→ NULL

valid calculation result = 0
→ 0
```

両者を混同しない。

### 8.7 計算式と丸め

基本式:

```text
raw_cost_amount
=
usage_quantity / unit_size * rate_amount
```

- 計算途中は高精度decimalを維持する。
- record単位で表示桁へ早期丸めしない。
- 集計後に画面・CSVの表示規則へ丸める。
- 保存精度は最低でも通貨小数8桁相当を保持できるものとする。

### 8.8 Current cost result

現在採用するcost recordは、同じusage recordについて次を満たす最大`calculation_version`から導出する。

```text
関連run.status IN (completed, completed_with_uncomputed)
```

`is_current`フラグは保存しない。

### 8.9 不変性

cost recordの次を直接編集しない。

```text
amount
status
pricing definition
quantity
rate
currency
business date
cost incurred date
```

再算定時は新recordを作る。

---

## 9. 集計指標

### 9.1 論理測定項目

```text
count distinct measurement_item_id
```

measurement以外のusageは論理測定項目へ含めない。

### 9.2 実行試行

```text
count distinct measurement_attempt_id
```

1attemptにinput/output/requestの複数usage recordがあっても1試行として数える。

### 9.3 追加試行

指定snapshotとfilter内で、各measurement itemについて最初のattemptを超えた分を数える。

```text
sum(max(distinct_attempt_count_per_item - 1, 0))
```

### 9.4 採用成功

```text
measurement_cycle.current_revision_id
＋ measurement_cycle_revision_item
```

から、現在採用されている成功attemptを持つdistinct measurement itemを数える。

画面ラベルは誤解を避けるため、次とする。

```text
現在採用中の成功
```

過去時点の採用状態を表す指標ではない。CSV snapshotでは、そのsnapshot時点のcurrent revisionを固定する。

### 9.5 原価

```text
known_cost_amount
uncomputed_record_count
estimated_record_count
provisional_record_count
final_record_count
```

`known_cost_amount`へ含めるのは、amountが存在するcurrent cost recordだけである。

### 9.6 集計表示状態

| 条件 | 表示 |
|---|---|
| 全件final | `確定原価` |
| 未算定0、estimatedあり | `推定原価` |
| 未算定0、estimatedなし、provisionalあり | `暫定原価` |
| 算定済みと未算定が混在 | `算定済み小計`＋`一部未算定` |
| 全件未算定 | 金額を表示せず`未算定` |
| source staleまたは不明 | `状態不明`。0件・0円へ変換しない |

### 9.7 算定済み原価内シェア

AIモデル別などの構成比は、次のラベルで表示する。

```text
算定済み原価内シェア
```

未算定を分母へ0円として含めない。

---

## 10. Filter contract

### 10.1 共通filter

```text
date_axis
from_date
to_date
customer_id
project_id
provider_code
ai_model_id
workload_category
cycle_purpose
attempt_reason_category
calculation_status
measurement_cycle_id
measurement_batch_id
search
```

### 10.2 Date axis

```text
business_date
cost_incurred_date
```

初期値は`business_date`とする。

画面上では次のラベルを使用する。

```text
業務日帰属
原価発生日
```

### 10.3 初期期間

初期表示は、選択中scopeにおける直近7業務日とする。

API上のP0最大期間は180日とする。CSVも同じ上限を適用する。

### 10.4 Scope

filterを適用する前に、役割割当ごとのeffective scopeを適用する。

```text
認証・capability
↓
effective scope
↓
画面filter
↓
集計
```

scope外データを集計してから除外してはならない。

### 10.5 同一contract

次は同じfilter contractを使用する。

```text
compact summary
概要グラフ
各tabの表
facet count
未算定件数
CSV
```

---

## 11. 共通ページheader

headerには次を表示する。

```text
利用量・コスト
選択中scope
日付軸
期間
データ更新時刻
usage取込鮮度
原価算定鮮度
CSV出力
```

原価表示通貨を明示する。

```text
内部変動原価・JPY
```

P0では通貨selectorを表示しない。

### 11.1 Compact summary

```text
算定済み原価
論理測定項目
実行試行
追加試行
現在採用中の成功
未算定
```

金額カードには必ず算定状態を併記する。

例:

```text
¥124,830
算定済み小計・一部未算定 18件
```

### 11.2 警告banner

次の場合だけ表示する。

- 前業務日以前の未算定が存在
- cost calculation runがretry上限後もfailed
- pricing definitionのcoverage gap
- usage取込または原価集計がstale/unknown
- scope整合性異常

bannerから実行できるのは、filter適用と専門ページへの遷移だけである。原価recordを直接修正する操作は置かない。

---

## 12. 概要

### 12.1 構成

```text
compact summary
日別原価推移
処理区分別
実行理由別
算定状態
未算定理由
```

### 12.2 日別原価推移

- 選択中date axisで日別表示する。
- 金額は算定済み小計を表示する。
- 同じ日へ未算定件数を併記する。
- 未算定を0円の棒・線として描かない。
- sourceがstaleの日を正常な0円として描かない。

### 12.3 処理区分別

少なくとも次を分離する。

```text
正式日次
追加検証
その他の自動処理
```

詳細では元のworkload categoryを表示できる。

### 12.4 実行理由別

```text
通常
再試行
障害補填
```

各区分で次を表示する。

- 実行試行
- usage component数
- 算定済み原価
- 未算定件数

### 12.5 算定状態

```text
未算定
推定
暫定
確定
```

金額とrecord件数を混同せず、両方を表示する。

### 12.6 未算定理由

reason codeごとに次を表示する。

```text
理由
件数
影響プロジェクト数
最古のbusiness date
関連route
```

P0では担当者・解決status・メモ欄を追加しない。

---

## 13. 顧客・プロジェクト

### 13.1 表示単位

初期表示は1プロジェクト1行とする。顧客単位へ折りたたみ集計できる。

### 13.2 主要列

```text
顧客
プロジェクト
算定済み原価
算定状態
論理測定項目
実行試行
追加試行
現在採用中の成功
未算定
主なAIモデル
最終利用時刻
```

### 13.3 Sort

初期sort:

```text
未算定ありを先
↓
算定済み原価 DESC
↓
project_id ASC
```

### 13.4 顧客行

顧客行を展開した場合、顧客配下のprojectだけを表示する。

customer scopeを持たないproject限定管理者へ、同一顧客の別project名・件数を返さない。

### 13.5 Drawer

project行から次を表示できる。

```text
日別推移
AIモデル内訳
reason内訳
未算定理由
上位cycle・batch
usage/cost provenance
```

測定prompt、AI回答本文、provider raw responseは返さない。

---

## 14. AIモデル

### 14.1 表示単位

```text
provider
＋ AIモデル
＋ service tier
```

### 14.2 主要列

```text
Provider / AIモデル
service tier
算定済み原価
算定済み原価内シェア
算定状態
実行試行
input系usage
output系usage
request数
再試行
障害補填
未算定
最終利用時刻
```

### 14.3 Usage単位

異なるusage unitを無理に1つの数量へ合算しない。

```text
input_tokens
output_tokens
cached_input_tokens
request_count
image_count
その他provider固有単位
```

単位ごとの数量をdrawerで分けて表示する。

### 14.4 AIモデル状態との境界

AIモデルが停止・制限中でも、利用量・コスト画面では過去事実を表示する。

現在のhealth/controlは参考表示に留め、制御変更は管理設定または障害・監査で行う。

---

## 15. サイクル・バッチ

### 15.1 表示単位

表示切り替え:

```text
サイクル
バッチ
```

### 15.2 Cycle主要列

```text
業務日
顧客・プロジェクト
cycle ID
purpose
current revision
論理項目
実行試行
追加試行
現在採用中の成功
算定済み原価
算定状態
未算定
関連batch数
```

### 15.3 Batch主要列

```text
batch ID
batch type
状態
顧客・プロジェクト数
cycle数
実行試行
通常
再試行
障害補填
算定済み原価
算定状態
未算定
開始・完了時刻
```

### 15.4 同一attemptの二重計上防止

1attemptに複数usage componentがあっても、実行試行は1件とする。

同じattemptが複数batchへ関連し得る場合、正式な実行assignmentを持つbatchへだけ試行件数を帰属する。費用配賦のために同じcostを複製しない。

### 15.5 Additional validation

追加検証は正式日次と明確に区別する。

```text
cycle_purpose = additional_validation
```

追加検証から正式公開へ直接昇格しないという既存ルールを変更しない。

---

## 16. Usage・cost provenance drawer

### 16.1 表示内容

```text
usage event key
source entity
customer / project
cycle / batch / item / attempt
provider / AI model / tier
usage component
quantity
capture status
workload category
reason category
occurred at
cost incurred date
business date
current cost record
calculation status
amount / currency
pricing definition key
rate confidence
calculation version
uncomputed reason
calculation run
correlation ID
```

### 16.2 Pricing詳細

`pricing.read`がある場合だけ、次を表示できる。

```text
unit size
rate amount
effective period
source reference
rate confidence
application status
```

`pricing.read`がない場合でも、算定済み原価金額の閲覧権限がある管理者には、pricing definition IDと適用有無だけを返してよい。

### 16.3 Redaction

次を返さない。

```text
prompt本文
AI回答本文
provider raw payload
Authorization header
cookie
token
secret
顧客向け請求情報
```

provider usage event IDは必要に応じて部分redactionする。

---

## 17. CSV出力

### 17.1 正式操作

```text
RequestUsageCostCsvExport
```

これはW1操作とする。

### 17.2 Export job status

```text
queued
running
completed
failed
expired
cancelled
```

terminal jobを再openしない。再出力は新jobを作る。

### 17.3 Job必須属性

```text
usage_cost_export_job_id
requested_by_admin_id
scope_snapshot
filter_snapshot
date_axis
read_snapshot_id
source_watermark
schema_version
status
requested_at
started_at nullable
completed_at nullable
row_count nullable
file_object_key nullable
file_checksum nullable
expires_at nullable
failure_code nullable
retry_of_export_job_id nullable
correlation_id
```

### 17.4 Snapshot固定

CSVは要求時に次を固定する。

```text
effective scope
filter
date axis
read snapshot ID
usage source watermark
cost source watermark
current revision watermark
```

生成中に新しいusage/costが到着しても、そのjobへ混ぜない。

### 17.5 CSV形式

P0では明細CSVを1種類提供する。

主要列:

```text
schema_version
read_snapshot_id
date_axis
customer_id
customer_name
project_id
project_name
business_date
cost_incurred_date
occurred_at
provider_code
ai_model
service_tier
workload_category
cycle_purpose
attempt_reason_category
measurement_cycle_id
measurement_batch_id
measurement_item_id
measurement_attempt_id
usage_event_key
usage_component_code
usage_unit_code
usage_quantity
usage_capture_status
cost_calculation_status
cost_amount
currency_code
pricing_definition_key
rate_confidence
uncomputed_reason_code
correlation_id
```

prompt、AI回答、raw provider payload、secretは含めない。

### 17.6 Encodingと安全性

- UTF-8 with BOMを標準とする。
- 改行はCRLFでよい。
- CSV formula injection対策を行う。
- ID列を表計算ソフトの指数表記で壊さない。
- 金額は通貨codeと分離する。
- NULLと0を区別する。

### 17.7 Download

- file URLは短時間の署名付きURLとする。
- download時に管理者状態、capability、scopeを再検査する。
- role・scopeを失った場合、未取得URLを無効化する。
- 要求者本人またはglobal platform admin以外へjobを返さない。
- export要求とdownloadをauditする。

### 17.8 失敗

export失敗はusage/cost本体を変更しない。

```text
job failed
↓
再要求で新job
```

---

## 18. サイドバーバッジと重大未算定

### 18.1 原則

通常時はバッジを表示しない。

### 18.2 Badge対象

次のいずれかを満たす場合だけ表示する。

```text
前業務日以前のcurrent cost recordがuncomputed
cost calculation runがretry exhaustedでfailed
usage/cost calculatorの状態がunavailableまたはstale
pricing coverage gapが前業務日以前のusageへ影響
```

### 18.3 Badge count

rawな未算定record件数ではなく、対応影響を示す次を数える。

```text
未算定の影響を受けるdistinct project数
＋ projectに帰属しないglobal重大問題の有無を最大1件
```

件数0では非表示にする。

### 18.4 Attention work item

`AttentionWorkItem`はread model上だけで生成する。

```text
cost:{reason_code}:{business_date}:{scope_type}:{scope_id}
```

担当者、status、解決操作を持たない。

共通原因がincidentとして存在する場合、costバッジへ二重計上せずincident ownerへ寄せることができる。ただし利用量・コスト画面には影響表示を残す。

---

## 19. Freshness・unknown・partial failure

### 19.1 別々に表示する鮮度

```text
usage ingestion freshness
cost calculation freshness
materialized summary freshness
```

### 19.2 Freshness状態

```text
fresh
delayed
stale
unknown
```

### 19.3 Fail-safe表示

- usage sourceがunknownなら利用量0と表示しない。
- cost sourceがunknownなら原価0円と表示しない。
- summary refreshがstaleでも、元factが利用可能なら「集計遅延」と表示する。
- 一部section失敗をpage全体の0件へ変換しない。
- 金額section失敗時も、利用件数が正常なら利用件数だけ表示できる。
- count section失敗時も、金額を推測して補完しない。

### 19.4 Write抑止

CSV要求時に、scope・snapshotを安全に固定できないほどsourceがunknownの場合は要求を拒否する。

単なるmaterialized view遅延では、fact queryで同一snapshotを構築できる場合に限りCSVを許可できる。

---

## 20. 権限・scope・機密性

### 20.1 Capability

```text
usage_cost.read
usage_cost.export
pricing.read
```

### 20.2 標準役割

`cost_analyst`は次を持つ。

```text
usage_cost.read
usage_cost.export
pricing.read
```

`platform_admin`も明示的に持つ。

`auditor`は標準では内部原価金額を閲覧できない。必要な場合は`cost_analyst`を追加付与する。

### 20.3 Scope

```text
global
customer
project
```

- globalは全顧客・全project。
- customerはその顧客配下だけ。
- projectは指定projectだけ。
- project scopeへ同一顧客の別project集計を返さない。
- scope外の未算定件数、facet、モデル名、金額を返さない。

### 20.4 Pricing

`pricing.read`はglobal referenceだが、内部機密として扱う。

customer/project scopeの`cost_analyst`がpricing detailを読む場合も、対象scopeで実際に適用されたdefinitionだけを返す。未使用の全社pricing catalogを返さない。

### 20.5 Field分類

```text
usage_metadata
cost_sensitive
pricing_sensitive
provider_reference_sensitive
secret
```

通常のusage/cost page readは`cost_sensitive`を含む。pricing rateの詳細は`pricing_sensitive`とする。

### 20.6 存在秘匿

scope外IDを直接指定された場合、不存在と権限外を必要以上に区別しない。

---

## 21. Command・Risk class

### 21.1 管理者command

| Command | Risk | Capability |
|---|---:|---|
| `RequestUsageCostCsvExport` | W1 | `usage_cost.export`＋`usage_cost.read` |
| `DownloadUsageCostCsvExport` | Sensitive read | `usage_cost.export`＋`usage_cost.read` |
| `ReadAppliedPricingDetail` | Sensitive read | `pricing.read`＋`usage_cost.read` |

### 21.2 System-only command

```text
RecordUsageComponent
RecordUsageCorrection
StartCostCalculationRun
CompleteCostCalculationRun
RecordCostCalculationResult
ActivatePricingDefinition
SupersedePricingDefinition
BuildUsageCostExportArtifact
ExpireUsageCostExportArtifact
```

管理者credentialでsystem-only endpointを呼べない。

### 21.3 存在しないcommand

```text
EditUsageRecord
DeleteUsageRecord
AdjustCostRecord
MarkCostFinal
ResolveUncomputedCost
EditPricingRate
ConvertCurrency
PromoteCostToInvoice
```

---

## 22. Read contract

### 22.1 `GetUsageCostOverview`

```text
metadata
scope
filter
freshness
compact_summary
daily_series
workload_breakdown
reason_breakdown
calculation_status_breakdown
uncomputed_reason_breakdown
warnings
export_descriptor
section_errors
```

### 22.2 `GetUsageCostCustomerProjects`

```text
metadata
scope
filter
summary
rows
facets
pagination
section_errors
```

### 22.3 `GetUsageCostAiModels`

```text
metadata
scope
filter
summary
rows
usage_unit_facets
pagination
section_errors
```

### 22.4 `GetUsageCostCyclesBatches`

```text
metadata
scope
filter
view_mode
summary
rows
facets
pagination
section_errors
```

### 22.5 `GetUsageCostFactDrawer`

```text
usage_fact
cost_fact
source_links
pricing_descriptor
freshness
sensitive_read_audit_descriptor
```

### 22.6 Snapshot metadata

すべてのresponseは次を返す。

```text
read_snapshot_id
as_of
usage_source_watermark
cost_source_watermark
summary_refreshed_at
current_business_date
reporting_currency
```

### 22.7 Count consistency

同じresponseのcompact summary、facet、rows、badgeは、effective scopeとsnapshotを共有する。

---

## 23. Audit・system event

### 23.1 Auditする操作

- CSV生成要求
- CSV download
- pricing rate詳細の閲覧
- 大量明細drawerの機密readが必要な場合
- export denied / failed

### 23.2 Auditへ保存しないもの

```text
CSV本体
全usage明細
全cost明細
prompt
AI回答
provider raw payload
secret
```

filter、scope、snapshot ID、row count、file checksumの安全化した要約を保存する。

### 23.3 System event

次をsystem eventへ記録する。

- usage ingest遅延・復旧
- pricing coverage gap検出
- cost calculation run開始・完了・失敗
- export artifact生成・失敗・期限切れ
- cost calculator health変化

同じ原価問題をsystem eventごとに複数の永続work itemへ変換しない。

---

## 24. Concurrency・idempotency

### 24.1 Usage

同じprovider event再送は一意制約で1件へ収束する。

correction chainは循環できない。

### 24.2 Cost calculation

同じusage record・calculation versionを2件作れない。

```text
UNIQUE(usage_record_id, calculation_version)
```

同じrun内で同じusage recordへ2件のresultを作れない。

```text
UNIQUE(cost_calculation_run_id, usage_record_id)
```

### 24.3 Pricing

同じmatch keyの有効期間重複を禁止する。

### 24.4 Export

同じadmin、同じidempotency keyの再送でjobを重複作成しない。

同じfilterでも別idempotency keyなら新snapshotのjobとして作成できる。

### 24.5 Snapshot drift

CSV生成時にsource watermarkが保持不能またはscopeが変化した場合、古い条件で継続せずjobをfailedまたはcancelledにする。

---

## 25. UI・アクセシビリティ・responsive

- 共通shellとsidebarを変更しない。
- 1366×768でcompact summaryと未算定警告、概要上部を確認できる。
- 1440×900で日別推移と内訳を同時に確認できる。
- page全体の横スクロールを発生させない。
- tableだけを内部横スクロール可能にする。
- 金額の色だけで算定状態を表現しない。
- 未算定、推定、暫定、確定をtext labelで表示する。
- chartにはtableまたは要約値を併設する。
- keyboardでtab、filter、drawer、CSV操作を行える。
- drawer open時にfocusを移動し、close後に元rowへ戻す。
- 長い顧客名・project名・AIモデル名を省略表示し、全文を確認可能にする。
- 0、NULL、状態不明を視覚・読み上げ上で区別する。

---

## 26. P0で作らないもの

```text
原価異常専用workflow
原価問題の担当者・状態・内部メモ
usage/costの手動調整
pricing definition編集UI
通貨換算管理
為替レート履歴
顧客請求額
請求書・会計照合
売上
粗利
予算
予実比較
原価配賦ルールeditor
AIモデル価格シミュレーション
アラート閾値editor
監査用CSV
定期CSV配信
```

---

## 27. 受け入れ条件

### 27.1 Usage記録

1. 1回のprovider callにinput・output・requestの複数componentがある場合、componentごとにusage recordが作られる。
2. 複数componentが同じusage event keyで関連付く。
3. 同じprovider usage eventの再送でusage recordが重複しない。
4. provider usage IDがない場合もsource invocation keyで重複防止できる。
5. reported usageにquantity NULLを保存できない。
6. derived usageにquantity NULLを保存できない。
7. unavailable usageにquantity 0を代入できない。
8. unavailable usageにreason codeが必須である。
9. providerが明示した0と未取得を区別できる。
10. usage recordを管理者が更新・削除できない。
11. usage訂正が新recordとcorrection referenceを作る。
12. 訂正前recordが物理削除されない。
13. correction chainを循環させられない。
14. source entity typeがallowlist外なら記録を拒否する。
15. project IDとsource entityのprojectが不一致ならfail-closedになる。
16. customer IDとprojectのcustomerが不一致ならfail-closedになる。
17. measurement attempt usageがcycle・batch・item・attemptへ追跡できる。
18. usage recordのbusiness dateが後日のtimezone変更で変化しない。
19. cost incurred dateがoccurred atと原価基準timezoneから固定される。
20. incident recovery usageがincident compensationとして分類される。
21. automatic retryがretryとして分類される。
22. normal attemptがretryへ誤分類されない。
23. incident compensationが通常retryへ混在しない。
24. formal daily、additional validation、project setupを区別できる。
25. prompt本文とAI回答本文をusage recordへ保存しない。

### 27.2 Pricing・原価算定

26. pricing definitionがprovider・model・tier・unit・currencyのmatch keyを持つ。
27. 同じmatch keyのactive/scheduled有効期間を重複させられない。
28. usage発生時刻に有効なpricing definitionを選択する。
29. 現在時刻の単価を過去usageへ誤適用しない。
30. active pricing definitionを直接編集できない。
31. 単価変更が新definitionとsupersedes referenceを作る。
32. currency不一致を自動換算せずuncomputedにする。
33. P0で為替レートを入力できない。
34. rate confidenceのestimated・provisional・finalを区別できる。
35. finalが請求書照合済みを意味しないことを画面labelで明示できる。
36. cost calculation runがqueued/running/completed/completed_with_uncomputed/failed/cancelledを区別する。
37. completed_with_uncomputedをrun失敗として扱わない。
38. failed runを同じrowでqueuedへ戻せない。
39. run retryが新runとretry referenceを作る。
40. 同じrun・usage recordにcost resultを2件作れない。
41. 同じusage record・calculation versionを2件作れない。
42. 再算定で既存cost recordが更新されない。
43. current cost resultが最大の有効calculation versionから導出される。
44. cost recordへis_currentを保存しない。
45. usage unavailableでcost statusがuncomputedになる。
46. pricing not foundでcost statusがuncomputedになる。
47. pricing ambiguousでcost statusがuncomputedになる。
48. unsupported unitでcost statusがuncomputedになる。
49. currency mismatchでcost statusがuncomputedになる。
50. calculator failureでcost statusがuncomputedになる。
51. uncomputed cost amountがNULLになる。
52. uncomputedを0円へ変換しない。
53. 有効な式の結果が0の場合だけ0円を保存できる。
54. derived usageまたはestimated rateでcost statusがestimatedになる。
55. reported usageとprovisional rateでprovisionalになる。
56. reported usageとfinal rateでfinalになる。
57. 不確実性が混在する場合にuncomputed > estimated > provisional > finalの順で表示される。
58. raw costを高精度で計算する。
59. record単位の早期丸めでaggregateがずれない。
60. amount・rate・quantity・statusを管理者が直接変更できない。

### 27.3 集計・表示

61. 1attemptに複数usage componentがあっても実行試行を1件と数える。
62. 論理測定項目をdistinct measurement itemで数える。
63. measurement外usageを論理測定項目へ含めない。
64. 追加試行をitemごとのattempt数から算定する。
65. 現在採用中の成功をcurrent revision mappingから算定する。
66. adopted successをmeasurement item selected_attempt_idから直接算定しない。
67. 算定済み原価へamount NULLのrecordを含めない。
68. 全件finalなら確定原価と表示する。
69. estimated混在かつ未算定なしなら推定原価と表示する。
70. provisional混在かつestimated・未算定なしなら暫定原価と表示する。
71. 算定済みと未算定が混在する場合に算定済み小計と一部未算定を併記する。
72. 全件未算定の場合に金額を表示しない。
73. source unknownを0円または0件へ変換しない。
74. AIモデルshareの分母へ未算定を0円として含めない。
75. share labelを算定済み原価内シェアと表示する。
76. business dateとcost incurred dateを切り替えられる。
77. 2つの日付軸を同じseriesへ混在させない。
78. 初期表示が直近7業務日になる。
79. API期間上限180日を超える要求を拒否する。
80. compact summary、chart、tab、facetが同じfilterを使う。
81. scope filterをaggregate前に適用する。
82. scope外金額を集計後に隠す実装にならない。
83. 日別seriesで未算定を0円として描画しない。
84. staleな日を正常0円として描画しない。
85. 正式日次・追加検証・その他自動処理を分離できる。
86. 通常・retry・incident compensationを分離できる。
87. 計算状態を件数と金額の両方で表示できる。
88. 未算定理由ごとに件数・project数・最古日を返せる。
89. 未算定理由に担当者・解決statusを保存しない。

### 27.4 各tab・drawer

90. 顧客・project tabが初期状態で1project1行になる。
91. 同じprojectが同一tabへ重複行として出ない。
92. customer集計を展開してproject内訳を表示できる。
93. project scope viewerへ同じcustomerの別project名・件数を返さない。
94. 未算定ありのprojectを初期sortで先に表示できる。
95. AIモデルtabがprovider・model・service tierを分離する。
96. 異なるusage unitを1数量へ合算しない。
97. input/output/request等を単位別に確認できる。
98. AI model health/controlを過去原価と混同しない。
99. cycle viewがcurrent revisionを表示する。
100. batch viewがbatch typeとstatusを表示する。
101. 同じattemptのcostを複数batchへ複製しない。
102. additional validationをformal dailyと区別する。
103. usage/cost drawerがsource entityとcorrelation IDを返す。
104. drawerがcurrent cost calculation versionを返す。
105. pricing.readなしでrate amountを返さない。
106. pricing.readありでもscopeで未使用の全社pricing catalogを返さない。
107. drawerへprompt、AI回答、raw provider payloadを返さない。
108. provider usage event IDを必要に応じてredactできる。
109. 長い顧客名・project名・model名でtableが崩れない。

### 27.5 CSV

110. CSV要求がusage_cost.readとusage_cost.exportを要求する。
111. CSV要求がW1としてauditされる。
112. 同じidempotency keyの再送でexport jobが重複しない。
113. export jobがqueued/running/completed/failed/expired/cancelledを区別する。
114. terminal export jobを再openできない。
115. 再出力が新jobとretry referenceを作る。
116. export要求時にeffective scopeを固定する。
117. export要求時にfilterとdate axisを固定する。
118. export要求時にread snapshotとsource watermarkを固定する。
119. 生成中に到着した新usageを既存CSVへ混ぜない。
120. 生成中に再算定された新cost versionを既存CSVへ混ぜない。
121. CSVと画面が同じsnapshotで同じknown amountを返す。
122. CSVと画面が同じsnapshotで同じuncomputed countを返す。
123. CSVへprompt、AI回答、raw provider payload、secretを含めない。
124. CSVでNULLと0を区別する。
125. CSVがUTF-8 BOMで出力される。
126. CSV formula injection対策が適用される。
127. 長いIDが表計算ソフトで破損しない形式になる。
128. 署名URLが短時間で期限切れになる。
129. download時に管理者status・capability・scopeを再検査する。
130. roleまたはscope喪失後に未取得URLを利用できない。
131. 要求者本人またはglobal platform admin以外がjobを取得できない。
132. CSV downloadがauditされる。
133. audit logへCSV本体を保存しない。
134. export失敗がusage/cost recordを変更しない。

### 27.6 Badge・freshness・権限

135. 当日処理中の一時的未算定だけではsidebar badgeを表示しない。
136. 前業務日以前の未算定でbadgeを表示できる。
137. badge countがraw record数ではなく影響distinct project数になる。
138. project非帰属のglobal重大問題を最大1件としてbadgeへ加算できる。
139. 共通incidentへownerを寄せた問題をcost badgeへ二重計上しない。
140. cost attentionがread model上だけで生成される。
141. cost attentionへ担当者・status・解決commandが存在しない。
142. usage ingestion、cost calculation、summary refreshの鮮度を別表示できる。
143. usage source unknownで利用量0を返さない。
144. cost source unknownで原価0円を返さない。
145. summary staleでもfactから安全に再構築できる場合に明示して表示できる。
146. section failureをpage全体0件へ変換しない。
147. scope・snapshotを固定できないunknown状態でCSV要求を拒否する。
148. cost analystが許可scope内の原価だけを閲覧できる。
149. auditorがcost analyst roleなしで内部原価金額を閲覧できない。
150. scope外の未算定件数・facet・model名・金額を返さない。
151. platform adminでもusage/cost recordを直接編集できない。
152. system-only usage・cost・pricing commandをadmin credentialで呼べない。
153. pricing detail readが必要な場合にsensitive readとしてauditされる。
154. regular page readのauditへ全明細を複製しない。
155. cost calculation failureをsystem eventへ記録できる。
156. 同じcost failure eventから永続work itemを複数作らない。
157. 1366×768でsummaryと重大未算定警告を確認できる。
158. 1440×900で日別推移と内訳を同時に構成できる。
159. page全体ではなくtable内部だけが横スクロールする。
160. 色だけに依存せず未算定・推定・暫定・確定を識別できる。
161. keyboardでfilter、tab、drawer、CSV操作を完了できる。
162. drawer close後にfocusが元rowへ戻る。
163. 0、NULL、unknownを読み上げ上でも区別できる。
164. P0に請求、売上、粗利、予算、為替、手動調整workflowが存在しない。

---

## 28. 実装順

1. `usage_record` DDL・一意制約・append-only権限
2. usage source resolverとscope整合検査
3. `pricing_definition` DDL・有効期間排他制約
4. `cost_calculation_run` DDL・orchestrator
5. `cost_record` DDL・calculation version制約
6. current cost result query
7. business date・cost incurred date resolver
8. workload・reason category classifier
9. `UsageCostFact`
10. 日別materialized summary
11. 顧客・project集計
12. AIモデル・usage unit集計
13. cycle・batch集計
14. 重大未算定・badge query
15. freshness・source watermark
16. usage/cost page server query
17. provenance drawerとpricing redaction
18. `usage_cost_export_job` DDL
19. CSV snapshot exporter・署名URL
20. export request/download audit
21. React page、tab、filter、table、drawer
22. 1366×768・1440×900 visual regression
23. 受け入れ条件1〜164の自動テスト

UI実装は、少なくとも1〜17と該当する権限・read modelテストが完成してから行う。

---

## 29. 最終統合後の位置づけ

本仕様v1.1は、canonical manifest v1.0に含まれる利用量・コストの正式画面仕様である。

新しい画面仕様を追加する段階は完了した。実装時は、正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0、共通レイアウトv1.1から生成したAPI contractと`available_commands`だけを使用する。
