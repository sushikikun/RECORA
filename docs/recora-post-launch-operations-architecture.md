# Recora Post-Launch Operations Architecture

Status: **Accepted**  
Decision date: **2026-07-26**  
Scope: Recoraのローンチ後に使用する顧客表示、測定、公開、契約、再実行、管理者操作の正式アーキテクチャ

## 1. この文書の位置づけ

この文書は、Recoraのローンチ後運用構造に関する正本である。

`docs/recora-phase1-admin-demo-launch.md`および`docs/recora-phase1-admin-measurement-cycle.md`は、Phase 1の管理者運用型デモを安全に実行するための暫定runbookであり、本番ローンチ後の完成形を定義するものではない。

両者が矛盾する場合は、この文書を優先する。ただし、既存Phase 1処理は一括削除せず、後方互換を維持しながら本構造へ段階的に移行する。

## 2. 目的

Recoraは、AI回答の測定結果をそのまま顧客へ見せるのではなく、測定事実、集計結果、公開判断を分離する。

この構造の目的は次のとおり。

- 生回答、失敗、未審査データ、内部診断の誤公開を防ぐ
- 新しい測定に失敗しても、前回の正常な顧客レポートを維持する
- 顧客が見たレポートを後から再現できるようにする
- 契約、プラン制限、測定、再実行、承認、公開を一貫して制御する
- OpenAI以外のAIプロバイダーも同じ運用モデルで扱う
- 管理者による重要操作を監査可能にする
- 既存のPhase 1実装から破壊的変更なしで移行する

## 3. 全体構造

Recoraは、**2つの画面、3つの内部層、横断機能**に分ける。

```text
顧客向け画面
    │
    │ 読み取りのみ
    ▼
公開レポート層 ────── 現在公開版ポインタ
    ▲
    │ 公開候補生成・承認・切替
    │
運用制御層 ───────── 契約・プラン・Schedule・Queue・再実行
    │
    │ Job作成・状態制御
    ▼
測定・証跡層 ─────── 生回答・解析・引用・失敗・費用

管理者向け画面
    │
    └─ サーバー側の認可済み操作を通じて各内部層を管理

横断機能
    └─ 監査ログ・権限管理・通知・障害管理
```

### 3.1 顧客向け画面

顧客向け画面は、現在公開中のレポート版だけを読み取る。

次を直接参照してはならない。

- 生のAI回答保存テーブル
- provider request / response
- 測定失敗、timeout、parse error
- API費用、token使用量
- 内部run IDや診断reason code
- 未審査の改善提案
- 管理者向け契約・Queue・再実行データ
- demo、local、sample、seedデータ

### 3.2 管理者向け画面

管理者向け画面は、次の運用を行う。

- 顧客、組織、案件、契約、プランの確認
- 測定scheduleとrunの確認
- 失敗項目の再実行
- 公開候補レポートの検証
- 改善提案の承認、保留、非表示
- レポートの公開、差し替え、公開停止
- 障害、通知、監査ログの確認

管理者ブラウザへSupabaseの`service_role`またはsecret keyを渡してはならない。書き込み操作はVercelのサーバー処理または安全なworkerを経由し、管理者認可と監査記録を必須とする。

## 4. Supabase内の論理分離

初期段階ではSupabaseプロジェクトを物理的に分割しない。一つの本番Supabaseプロジェクト内で、次の責務へ論理分離する。

```text
api
publication
measurement
control
audit
```

| Schema | 責務 |
|---|---|
| `api` | 顧客向け画面が参照できる安全なread model、view、RPC |
| `publication` | 品質ゲート通過後に生成される版管理済み公開レポート |
| `measurement` | 生回答、観測、解析、言及、順位、引用、失敗、費用 |
| `control` | 契約、entitlement、schedule、run、Queue、retry、公開制御 |
| `audit` | 管理者操作、公開、再実行、権限、契約変更などの履歴 |

原則として顧客向けData APIには`api`だけを公開する。`measurement`、`control`、`audit`を顧客のブラウザから直接参照させない。

既存の`public`スキーマからの移行は追加型で行い、顧客経路の切替と検証が完了するまで既存テーブルを削除しない。

## 5. 公開レポートの版管理

顧客へ表示するレポートは、現在のDB状態を直接集計した画面ではなく、確定した公開版として保存する。

### 5.1 公開レポート単位

推奨する親エンティティは`report_publications`である。

最低限、次を保持する。

```text
id
organization_id
project_id
status
period_start
period_end
measured_at
computed_at
validated_at
approved_at
published_at
withdrawn_at
source_measurement_run_id
aggregate_run_id
prompt_set_version
measurement_profile_version
metric_definition_version
parser_version
quality_gate_version
report_template_version
supersedes_publication_id
created_at
updated_at
```

公開版配下には、顧客向けに必要な列だけを持つ専用データを保存する。

```text
published_metrics
published_competitor_comparisons
published_prompt_results
published_answer_excerpts
published_citations
published_recommendations
published_data_quality_warnings
```

公開済み版は原則immutableとする。内容を修正する場合は既存版を直接更新せず、新しい版を生成する。

### 5.2 現在公開版ポインタ

顧客画面は、最新のmeasurement runやaggregate runを自動選択しない。

プロジェクトごとに現在公開中の版を明示する。

```text
project_current_publications
- project_id
- current_publication_id
- updated_at
```

新しい測定、集計、公開候補の検証に失敗した場合も、このポインタは変更しない。前回の正常な公開版を維持する。

新しい公開版が完全に準備できた時点で、公開版の状態変更とポインタ切替を一つの整合した処理として実行する。

## 6. 公開状態モデル

技術的に公開可能であることと、実際に顧客へ公開されていることを分離する。

```text
draft
  ↓
validating
  ↓
ready
  ↓
approved
  ↓
published
  ↓
superseded または withdrawn
```

| State | 意味 |
|---|---|
| `draft` | 集計または公開候補生成の途中 |
| `validating` | 品質ゲート確認中 |
| `ready` | 技術的に公開可能 |
| `approved` | 自動承認または人間承認済み |
| `published` | 現在顧客へ公開中 |
| `superseded` | 新しい公開版に置き換え済み |
| `withdrawn` | 問題により公開停止 |

`customer_ready`は移行期間中の互換判定として残してよいが、最終的な公開状態を兼ねてはならない。

## 7. 測定・証跡層

測定・証跡層は、測定事実を失わないことを優先する。

### 7.1 保存対象

```text
provider_requests
provider_responses
ai_conversations
observations
brand_mentions
ranking_occurrences
citations
citation_occurrences
source_urls
source_domains
parse_results
provider_errors
token_usage
provider_costs
```

### 7.2 履歴方針

次を上書きで一つにまとめず、追跡可能な別結果として残す。

- 元のprovider回答
- 最初の解析結果
- parser更新後の再解析結果
- timeoutなどによる再測定結果
- 管理者が実行した限定再実行

測定項目には最低限、次の識別情報を保持する。

```text
organization_id
project_id
measurement_run_id
run_item_id
prompt_id
prompt_set_version
provider
requested_model
actual_model
search_mode
parser_version
observed_at
attempt_number
idempotency_key
```

## 8. 四段階の公開品質ゲート

公開候補は、次の四段階を通過させる。

### 8.1 Gate 1: 測定完全性

確認項目:

- 予定件数と成功件数
- 全体成功率
- provider / model別カバレッジ
- prompt type別カバレッジ
- topic別カバレッジ
- 主要promptの成功
- timeout、partial、parse error、provider errorの割合
- 再実行対象の残存有無

`validObservationCount > 0`だけでは通過させない。measurement profileごとに必要成功率と必須範囲を定義する。

### 8.2 Gate 2: 指標成立

確認項目:

- `non_branded`だけでAI表示率、順位、Share of Voice、競合差を算出している
- `branded`をAI表示率、順位、Share of Voiceへ混ぜていない
- `citation_check`を通常の候補順位へ混ぜていない
- 必須metric snapshotが揃っている
- 分母、対象model、対象prompt数が明示できる
- 前回比較が同一または互換条件である
- 比較不能な場合に前回比を出していない

`metricSnapshotCount > 0`だけでは通過させない。レポート構成とプランに応じた必須指標集合を確認する。

### 8.3 Gate 3: 顧客表示安全性

確認項目:

- demo、local、sample、seed、placeholderが混在していない
- 内部エラー、stack trace、secret、API費用が含まれていない
- 他顧客のデータが含まれていない
- 顧客向けに許可された回答本文または抜粋だけである
- 引用発生と主張裏付けを混同していない
- 未確認の根拠を確認済みとして表現していない
- 内部run ID、reason code、管理メモを公開していない

### 8.4 Gate 4: 改善提案品質

確認項目:

- 観測事実と提案が追跡可能である
- 根拠件数とconfidenceが基準を満たす
- 原因と結果を断定しすぎていない
- 一般論だけではない
- 対象ページ、対象topic、対象promptなどの作用対象が明確である
- 顧客が実行可能な粒度である
- 掲載、引用、順位上昇、売上効果を保証していない

改善提案の公開状態はレポート全体の公開状態と分離する。

```text
customer_visible
review_required
pre_quality_gate
candidate_only
hidden_internal
```

改善提案なしのプランでは、顧客公開提案が0件でも数値レポートを止めない。改善提案ありのプランでも、原則として安全な数値レポートは公開し、改善提案欄だけを「準備中」または公開可能分のみにできる設計とする。

## 9. 運用制御層

運用制御層は、サービス上の許可と処理状態を管理する。

推奨エンティティ:

```text
organizations
organization_memberships
projects
subscriptions
plan_entitlements
measurement_profiles
prompt_sets
prompt_set_versions
measurement_schedules
measurement_runs
measurement_run_items
rerun_requests
publication_requests
publication_approvals
project_statuses
```

測定ジョブ作成前に、最低限次を検証する。

- subscriptionが有効である
- projectが有効である
- prompt数がplan上限内である
- provider / model数がplan上限内である
- 実行頻度がentitlement内である
- 日次または月次の費用上限を超えていない
- 同じ論理測定が既に登録されていない
- prompt setとmeasurement profileのversionが確定している

UI上の表示制限だけでplan entitlementを実装してはならない。ジョブ登録時とworker実行時にもサーバー側で確認する。

## 10. Schedule、Queue、Worker、再実行

Cronから長時間のAI測定を直接実行しない。

```text
Cron
  ↓
計測対象projectを抽出
  ↓
Queueへmeasurement run / run itemを登録
  ↓
Workerがrun item単位で処理
  ↓
成功、失敗、使用量、費用を保存
  ↓
失敗項目だけをretryまたは手動再実行
  ↓
集計
  ↓
公開候補生成
  ↓
品質ゲート
  ↓
承認・公開
```

Cronの責務は対象抽出とQueue登録までとする。

### 10.1 Idempotency

重複課金、重複保存、指標の二重集計を防ぐため、論理測定単位に一意な`idempotency_key`を持たせる。

少なくとも次を構成要素に含める。

```text
project_id
prompt_id
provider
model_id
measurement_window
search_mode
attempt_scope
prompt_set_version
measurement_profile_version
```

再試行は同じ論理測定のattemptとして追跡し、意図的な再測定とは区別する。

## 11. AIプロバイダー非依存

新規設計を`OpenAI measurement`専用にしてはならない。

次を同じrun / run itemモデルで扱えるようにする。

- OpenAI / ChatGPT
- Google / Gemini
- Perplexity
- Google AI Mode
- 将来追加するAI回答サービス

provider固有のrequest、response、error、citation形式はadapter内に閉じ込め、公開ゲートと運用状態は共通契約へ正規化する。

run itemには次を保持する。

```text
provider
requested_model
actual_model
provider_request_id
provider_response_status
provider_error_code
```

既存の`data_source=openai_measurement`判定は移行互換として扱い、正式判定はlive provider measurementかどうか、およびrun itemのprovider / model情報に基づく形へ移す。

## 12. 必須バージョン情報

正式な公開レポートには、最低限次を必須とする。

```text
prompt_set_version
measurement_profile_version
metric_definition_version
parser_version
quality_gate_version
report_template_version
```

比較対象間で条件が変わった場合は、単純な前回比を表示しない。互換性判定と顧客向け注記を持たせる。

## 13. 正式カラムとmetadata

公開、承認、品質状態を新たにmetadataだけへ追加してはならない。

正式カラムとして次を持つ。

```text
publication_state
quality_gate_status
reviewed_by
reviewed_at
approved_by
approved_at
published_by
published_at
quality_gate_version
suppression_reason
withdrawal_reason
```

既存metadataは移行互換と補足情報に限定する。新規処理では正式カラムを優先し、移行完了後にlegacy metadata fallbackを廃止する。

## 14. 監査ログ

次の操作は必ず監査対象にする。

- 手動測定
- run item再実行
- job停止または取消
- 公開候補の承認
- レポート公開
- 公開版の差し替え
- 公開停止
- 改善提案の承認、保留、却下、非表示
- 顧客データの修正
- plan、subscription、entitlementの変更
- 管理者権限の変更
- 顧客データのexport

最低限、次を記録する。

```text
actor_type
actor_id
action
organization_id
project_id
target_type
target_id
before_state
after_state
reason
request_id
created_at
```

監査イベントは通常の業務テーブル更新と分離し、後から誰が何を行ったかを再構成できるようにする。

## 15. セキュリティ境界

- 顧客ブラウザは`api`の自組織向けread modelだけを読む
- 管理者ブラウザはサーバーAPI経由で操作する
- `service_role`やsecret keyをブラウザへ公開しない
- `measurement`、`control`、`audit`を顧客向けData APIへ公開しない
- exposed schemaのtable / viewにはRLSと必要最小限のGRANTを設定する
- 公開viewは下位tableのRLSを適用する構成にする
- organization membershipとproject ownershipをすべての顧客向け読み取りで検証する
- 管理者操作は認可確認と監査ログ保存を一つの業務処理として扱う

管理者用の別ドメインや別Vercel projectは補助的な分離であり、認可、DB権限、RLS、非公開schema、監査ログの代わりにはならない。

## 16. 移行順序

一括置換は行わず、次の順番で移行する。

### Phase A: 正式方針と作業境界

- 本文書を正本として配置
- Phase 1 runbookを暫定資料として扱う
- Codexルールへ非交渉事項を追加
- 実装を依存関係付きIssueへ分割

### Phase B: 公開境界

- `report_publications`を追加
- 公開版配下の顧客向けデータモデルを追加
- `project_current_publications`を追加
- `ready`と`published`を分離
- 現在公開版だけを返すread modelを追加
- 新測定失敗時に前回公開版を維持する

### Phase C: 品質ゲートとversion

- 四段階品質ゲートを実装
- measurement profileごとの完全性基準を実装
- 必須metric集合を実装
- 正式versionカラムを必須化
- 公開状態とreview状態を正式カラム化

### Phase D: Providerと実行基盤

- provider-neutral run itemへ移行
- adapter契約を定義
- Queue、retry、idempotency、費用上限を実装
- Cronをenqueue専用にする

### Phase E: 権限、管理、監査

- 顧客向け`api`境界を完成
- 管理者サーバーAPIを実装
- audit eventを実装
- 運用管理コンソールをwrite-capableにする

### Phase F: Legacy廃止

- 顧客画面をpublication read modelへ完全切替
- legacy metadata fallbackの利用箇所を計測
- Phase 1専用判定を互換層へ閉じ込める
- 利用がなくなった旧read pathとmetadata fallbackを段階廃止

## 17. 非目標

この決定だけで、次を直ちに行うものではない。

- Supabase projectを複数へ物理分割する
- 既存Phase 1 tableやscriptを即時削除する
- 既存顧客データを破壊的に移行する
- 全provider adapterを同時に完成させる
- 管理者確認を無条件に廃止する
- 改善提案を根拠確認なしで全自動公開する

## 18. 非交渉事項

今後の実装は、次を守る。

1. 顧客画面から生のmeasurement / control / auditデータを直接読ませない。
2. 顧客画面は現在公開中のpublicationだけを読む。
3. 新しい測定が失敗しても既存の正常な公開版を維持する。
4. `ready`と`published`を同一視しない。
5. 公開済みレポートを直接更新しない。
6. 公開状態を新たにmetadataだけで管理しない。
7. 新規測定設計をOpenAI専用に固定しない。
8. 品質ゲートを有効観測1件またはsnapshot 1件だけで通過させない。
9. 管理者の重要操作には監査ログを残す。
10. schema変更は追加型migrationから始め、顧客経路切替前に旧構造を削除しない。

## 19. 完了条件

ローンチ後運用構造への移行が完了したと判断できるのは、少なくとも次が成立したときである。

- 顧客画面が現在公開版だけを参照している
- 公開レポートの履歴と差し替え履歴を追跡できる
- 新しいcycleが失敗しても前回公開版が維持される
- 四段階品質ゲートの結果を保存できる
- provider / modelごとのrun itemを追跡できる
- Queue、retry、idempotencyが動作する
- plan entitlementと費用上限がサーバー側で強制される
- 管理者操作を監査ログから再構成できる
- 顧客ブラウザから内部schemaを直接参照できない
- legacy Phase 1経路とmetadata fallbackの廃止条件が明確になっている
