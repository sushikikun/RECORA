# Recora v0.1 Checkpoint

作成日: 2026-06-18
更新日: 2026-06-18

このドキュメントは、Recora / レコラ v0.1 の「測定できる、保存できる、集計できる、表示できる」大枠到達点を記録するためのチェックポイントです。

Recora の指標は、Recora 独自の観測指標です。OpenAI、Google、Perplexity、Gemini などのAIプラットフォームによる公式評価ではありません。現在の観測数はまだ少ないため、1回または少数回の測定結果を強い結論として扱わないでください。

## 1. 現在できていること

### OpenAI測定実行

- `scripts/run-openai-measurement.ts` で、対象project slugを指定したOpenAI測定を実行できる。
- DB上の `prompts`、`topics`、`brands`、`ai_models` を読み、prompt x model x search mode の観測を作れる。
- no-search と web-search の両方を扱える。
- OpenAI APIキーや `.env.local` の内容は出力しない方針。

### DB保存

OpenAI測定結果は、以下のテーブルに保存できる。

- `measurement_runs`
- `run_items`
- `ai_conversations`
- `brand_mentions`
- `citations`
- `source_domains`

`recommendations` は測定サイクルでは作成しない。`metric_snapshots` は、測定後の再集計処理で作成する。

### AI回答ログ表示

- `/dashboard/reports/recora-kenzai-q2/conversations` で、実測したAI回答ログを確認できる。
- no-search / web-search の観測回答を、回答ログとして確認できる。
- 最新UI実行後の測定run由来のOpenAI実測2件も画面上で確認できている。

### 参照元分析表示

- `/dashboard/reports/recora-kenzai-q2/sources` で、web-search由来の引用元を確認できる。
- `citations` と `source_domains` に保存されたURL、domain、source type を参照元分析に反映できる。
- 最新UI実行後のweb-search由来の引用元も画面上で確認できている。

### metric_snapshots再集計

- `scripts/recalculate-metric-snapshots.ts` で、OpenAI実測runをsourceとして集計できる。
- aggregate run を作成し、dashboard / leaderboard 用の `metric_snapshots` を保存できる。
- project scope と brand scope のsnapshotを分けて保存できる。
- seed由来の既存 `metric_snapshots` を残したまま、OpenAI実測aggregateを追加できる。

### RunCycle UI

- `/dashboard/reports/recora-kenzai-q2/runs` から小規模測定を実行できる。
- RunCycle UI により、画面から dry-run と小規模測定実行を扱える。
- `POST /api/recora/run-cycle` が追加され、サーバー側で `scripts/run-recora-cycle.ts` を呼び出せる。
- 画面から以下の流れが通っている。
  - OpenAI測定
  - DB保存
  - `metric_snapshots` 集計
  - dashboard反映
  - conversations反映
  - sources反映
  - leaderboard反映

### dashboard KPI反映

- `/dashboard` は最新のaggregate run由来の project scope snapshot を参照できる。
- dashboard KPIは、aggregate `metric_snapshots` の値を表示できる。
- 最新のKPI:
  - AI表示率: 0%
  - AI言及数: 0
  - 参照回数: 8

### leaderboard反映

- `/dashboard/reports/recora-kenzai-q2/leaderboard` は、最新aggregate runの brand scope snapshots を参照できる。
- 5ブランド分のbrand scope snapshotを表示できる。
- 最新aggregate runでは、全ブランドの visibility rate は 0%。

## 2. 主要スクリプト / UI / API

### `scripts/run-openai-measurement.ts`

OpenAI APIでAI検索測定を実行し、実測結果をDBへ保存するスクリプト。

主な責務:

- project slug から対象projectを読む
- DB上の prompts / topics / brands / ai_models を読む
- prompt-limit と search mode を指定して測定する
- OpenAI回答を `ai_conversations` に保存する
- ブランド言及を `brand_mentions` に保存する
- web-search時の引用URLを `citations` / `source_domains` に保存する
- `measurement_runs` / `run_items` を作成する
- `recommendations` / `metric_snapshots` には書き込まない

### `scripts/recalculate-metric-snapshots.ts`

OpenAI実測runをsourceとして、dashboard / leaderboard 用の集計snapshotを作るスクリプト。

主な責務:

- completed measurement run をsourceとして読む
- project scope / brand scope の指標を再集計する
- aggregate run を作成する
- `metric_snapshots` に集計値を保存する
- project scope の `citation_count` は source run 内の総citation件数を使う
- brand scope の `citation_count` はブランド関連citationが確定できるものだけを使う
- seed由来snapshotを壊さない

### `scripts/run-recora-cycle.ts`

OpenAI測定から `metric_snapshots` 再集計までを1本で実行するスクリプト。

主な責務:

- `scripts/run-openai-measurement.ts` を呼び出して測定runを作成する
- 測定run IDをsourceとして `scripts/recalculate-metric-snapshots.ts` を呼び出す
- 測定件数、集計件数、recommendations件数、metric_snapshots件数を表示する
- dashboard / conversations / sources / leaderboard の確認URLを表示する
- デフォルトではOpenAI API実行もDB書き込みもしない安全設計にする

### RunCycle UI

`/dashboard/reports/recora-kenzai-q2/runs` の測定実行画面。

主な役割:

- project slug、prompt limit、search mode を確認できる
- dry-run確認を画面から実行できる
- 小規模測定を画面から実行できる
- 実行結果の概要を表示できる
- 実行後の確認URLを表示できる
- ローカル開発用のv0.1実行UIとして扱う

### `POST /api/recora/run-cycle`

RunCycle UI から測定サイクルを実行するためのAPI route。

主な役割:

- POSTのみ受け付ける
- `scripts/run-recora-cycle.ts` をサーバー側から呼び出す
- dry-run と小規模実行を切り替える
- prompt limit を小規模に制限する
- APIキーや `.env.local` の内容をレスポンスに含めない
- 実行結果をUIへ返す

### `scripts/generate-recommendation-candidates.ts`

OpenAI実測データから、改善提案候補JSON / Markdownを生成するスクリプト。

主な責務:

- 最新 `standard-v01` measurement runだけを根拠にする
- seed / sample / small-v01 / 過去runを混ぜない
- AI回答、ブランド言及、引用元、参照URLをもとに改善提案候補を作る
- 候補ごとに priority / confidence / display category / quality score / evidence / display decision を付与する
- `quality_score` は表示値であり、非表示判定には使わない
- `recommendations` テーブルには保存しない
- Recora独自観測であり、AIプラットフォーム公式評価ではないことを明記する

### `scripts/save-recommendation-candidates.ts`

改善提案候補JSONから `recommendations` テーブルへ保存するための安全ガード付きスクリプト。

主な責務:

- デフォルトはdry-run
- `--apply` 実行時だけDBに書き込む
- `display_decision = show` の候補だけを保存対象にする
- `measurement_profile_id = standard-v01` かつ `data_source = openai_measurement` の候補だけを保存対象にする
- seed / sample / `.example` がevidenceに混ざる候補は保存対象外にする
- 同じ `measurement_run_id + candidate_id` はduplicateとして扱う
- dry-run / apply の出力で `candidateCount`、`eligibleShowCandidateCount`、`insertTargetCount`、`skippedCount`、`duplicateCount`、`insertedCount` を分けて表示する

## 3. 現在のDB状態

この件数はローカルSupabase DB上の状態です。

| Table | Count |
|---|---:|
| `measurement_runs` | 13 |
| `run_items` | 28 |
| `ai_conversations` | 28 |
| `brand_mentions` | 116 |
| `citations` | 73 |
| `source_domains` | 46 |
| `recommendations` | 6 |
| `metric_snapshots` | 41 |

最新のOpenAI実測source run:

| Item | Value |
|---|---:|
| source run id | `28a39177-4144-4df7-8cd7-8ada6859ce07` |
| run_items | 2 |
| ai_conversations | 2 |
| no-search conversations | 1 |
| web-search conversations | 1 |
| brand_mentions | 10 |
| citations | 8 |

## 4. 重要なaggregate run

最新のaggregate run:

| Item | Value |
|---|---|
| aggregate run id | `cd0adfc5-bf85-4db0-b8bc-992925a60c16` |
| source_run_id | `28a39177-4144-4df7-8cd7-8ada6859ce07` |
| metadata.run_kind | `aggregate` |
| metadata.data_source | `openai_measurement` |
| metric_snapshots | 6 |
| project scope snapshots | 1 |
| brand scope snapshots | 5 |
| project scope citation_count | 8 |
| project scope ai_visibility | 0 |
| project scope ai_mention_count | 0 |

seed由来の `metric_snapshots` は残っている。OpenAI実測aggregateはseed集計runを置き換えるのではなく、別runとして追加されている。

## 5. 現在の表示確認

| Page | Status | Notes |
|---|---:|---|
| `/dashboard` | 200 | 最新aggregate run由来のdashboard KPIを表示できる |
| `/dashboard/reports/recora-kenzai-q2/conversations` | 200 | 最新測定run由来の実測AI回答ログ2件を確認できる |
| `/dashboard/reports/recora-kenzai-q2/sources` | 200 | 最新web-search由来の引用元を確認できる |
| `/dashboard/reports/recora-kenzai-q2/leaderboard` | 200 | 最新aggregate run由来のbrand scope snapshotsを確認できる |

dashboard KPI:

| KPI | Value | Source |
|---|---:|---|
| AI表示率 | 0% | project scope `metric_snapshots.ai_visibility` |
| AI言及数 | 0 | project scope `metric_snapshots.ai_mention_count` |
| 参照回数 | 8 | project scope `metric_snapshots.citation_count` |

スクリーンショット保存先:

- `C:\Users\nakan\work\recora\output\playwright\v01-dashboard-after-run-ui.png`
- `C:\Users\nakan\work\recora\output\playwright\v01-conversations-after-run-ui.png`
- `C:\Users\nakan\work\recora\output\playwright\v01-sources-after-run-ui.png`
- `C:\Users\nakan\work\recora\output\playwright\v01-leaderboard-after-run-ui.png`

## 6. 注意点

- このDB状態はローカルSupabase DB上の状態。
- `supabase db reset` を実行すると、OpenAI実測データ、aggregate run、追加snapshotは消える。
- `output/` 配下はGit管理外。
- `.env.local` とAPIキーはGit管理しない。
- Recora指標はAIプラットフォーム公式評価ではない。
- 観測数が少ないため、強い結論や顧客向けの断定表現には使わない。
- `metric_snapshots` は表示用の集計値であり、正本は `ai_conversations`、`brand_mentions`、`citations`、`source_domains` などの実測データ。
- 未レビューの改善提案候補は、顧客向けrecommendations画面には表示しない。
- recommendations / 承認フロー / 課金 / Auth / RLS / PDF / LP はまだ後回し。
- ローカルNext開発サーバーで `.next` cache由来の表示エラーが出る場合は、コードやDBではなく実行中サーバーのキャッシュ状態を先に疑う。

## 7. 次にやるべきこと

v0.1の大枠は、以下の一本線が画面から通った状態です。

1. `/runs` 画面から小規模測定を実行する
2. OpenAI測定を実行する
3. DBに保存する
4. `metric_snapshots` を再集計する
5. dashboard KPIに反映する
6. conversationsでAI回答ログを見る
7. sourcesでweb-search由来の引用元を見る
8. leaderboardでbrand scope snapshotsを見る

次の候補:

- 測定履歴ページの強化
- 測定実行UIの使いやすさ改善
- プロンプト管理
- 実測 / サンプル表示切り替え
- 観測数が少ないことの表示改善
- その後に改善提案候補や承認フローへ進む

まだ後回し:

- Auth / RLS
- 課金
- PDF export
- LP
- 改善提案の承認フロー
- 自動スケジュール実行
- 複数AIプラットフォーム比較の本格化

## 8. 2026-06-18 表示データ方針の更新

Recora v0.1 では、通常画面に seed / sample 由来データを混ぜない方針に更新した。
sample fallback は廃止済みであり、DB取得失敗時や実データなしの場合に `sample-data.ts` の内容へ戻さない。

DB内に開発初期化用のseedデータが残っていても、通常画面では `openai_measurement` aggregate または OpenAI実測由来のデータを優先表示する。
`.example` ドメイン、`.example` を含むURL、seed runに紐づく表示データは通常表示対象から除外する。

### 通常表示で除外するもの

- seed run ID `70000000-0000-4000-8000-000000000001` に紐づく表示データ
- `source_domains.domain` が `.example` で終わる参照元
- `citations.domain` が `.example` で終わる引用
- `citations.url` に `.example` を含む引用
- `recommendations.target_url` に `.example` を含む改善提案
- seed runに紐づくrecommendations
- latest `standard-v01` 以外のmeasurement runに紐づくrecommendations
- `metadata.display_decision = show` ではないrecommendations

seed recommendations は通常表示から除外される。
recommendations画面では、人間レビュー前提の `review_required` / `reviewed` / `approved` ではなく、最新 `standard-v01` measurement run由来かつ `metadata.display_decision = show` の項目だけを通常表示する。

### 最新の画面別表示方針

| Page | 最新表示方針 |
|---|---|
| `/dashboard` | `metadata.run_kind = aggregate` かつ `metadata.data_source = openai_measurement` のaggregate run由来KPIを表示する |
| `/dashboard/reports/recora-kenzai-q2/conversations` | `provider = openai` または `response_id` があるOpenAI実測回答だけを通常表示する |
| `/dashboard/reports/recora-kenzai-q2/sources` | OpenAI実測回答に紐づく参照元だけを表示し、`.example` ドメイン/URLは除外する |
| `/dashboard/reports/recora-kenzai-q2/leaderboard` | `openai_measurement` aggregate のbrand scope snapshotsを表示する |
| `/dashboard/reports/recora-kenzai-q2/recommendations` | 最新 `standard-v01` measurement run由来かつ `metadata.display_decision = show` のrecommendationsだけを表示する。seed提案は通常表示しない |

この方針により、seed.sqlに開発初期化用データが残っていても、通常画面は実測データ中心のプロダクト画面として扱える。

### 直近の重要コミット

| Commit | 内容 |
|---|---|
| `e2b6efd` | `fix(recora): use latest aggregate for leaderboard` |
| `551a71a` | `feat(recora): add measurement profiles` |
| `ff9f749` | `docs(recora): document live-data display policy` |
| `ab258ad` | `fix(recora): exclude seed data from live dashboard views` |
| `fbb5e66` | `feat(recora): expand prompt library` |
| `b2f780a` | `feat(recora): add topics and prompts management page` |

### 現在のプロンプトライブラリ

| Item | Count |
|---|---:|
| topics | 6 |
| prompts | 12 |
| personas | 4 |
| active prompts | 12 |

### 運用上の注意

- `seed.sql` は開発初期化用として残す。
- `npx supabase db reset` を実行すると、ローカルのOpenAI実測データ、aggregate run、追加snapshot、非破壊upsert済みprompt library反映分は消える。
- 本番ではseed由来データを通常表示に混ぜない。
- Recora指標はRecora独自の観測指標であり、AIプラットフォーム公式評価ではない。
- 観測数が少ない場合、1回または少数回の測定結果を強い結論として扱わない。
- 表示対象がない場合はsample fallbackではなく空状態にする。

## 9. 2026-06-18 測定プロファイルと標準測定チェックポイント

Recora v0.1 では、測定対象promptを `prompt-limit` と priority / created_at 順に依存して選ぶ方式から、固定された測定プロファイルで明示的に選ぶ方式へ進めた。
これにより、prompt libraryを拡張しても、小規模測定と標準測定の対象promptを再現可能に保てる。

### 測定プロファイル

| Profile | 表示名 | prompts | search mode | expected run_items | 用途 |
|---|---|---:|---|---:|---|
| `small-v01` | 小規模測定 | 1 | both | 2 | OpenAI API / DB保存 / 集計フローの疎通確認 |
| `standard-v01` | 標準測定 | 10 | both | 20 | Recora v0.1の基本的なAI検索観測 |

`standard-v01` は20観測になるため、毎回気軽に連打しない。
`small-v01` は疎通確認用として扱う。

### small-v01 実動作確認

| Item | Value |
|---|---:|
| measurementRunId | `79743545-890c-4105-83e3-29cb22838312` |
| aggregateRunId | `1bbe606b-3939-40f6-9cfe-802c10bc4a4f` |
| run_items | 2 |
| ai_conversations | 2 |
| brand_mentions | 10 |
| citations | 10 |
| metric_snapshots | 47 -> 53 |
| recommendations | 6 -> 6 |
| failedItems | 0 |

### standard-v01 標準測定成功

| Item | Value |
|---|---:|
| measurementRunId | `23677594-080c-424e-bff0-dc931d106b33` |
| aggregateRunId | `5f6e433f-dd09-4341-b2de-7240ff5ce042` |
| run_items | 20 |
| ai_conversations | 20 |
| brand_mentions | 100 |
| citations | 26 |
| sourceDomainsUpserted | 12 |
| metric_snapshots | 53 -> 59 |
| recommendations | 6 -> 6 |
| failedItems | 0 |
| skippedDuplicates | 0 |

### standard-v01 実行後の最新dashboard KPI

最新dashboard KPIは、aggregate run `5f6e433f-dd09-4341-b2de-7240ff5ce042` のproject scope snapshot由来。

| KPI | Value |
|---|---:|
| AI表示率 | 50% |
| AI言及数 | 76 |
| 参照回数 | 26 |
| 競合差分 | +40pt |
| 改善優先度 | 0 |

改善優先度は、当時のdashboard集計時点では実データ由来の表示対象recommendationsがなかったため0だった。
その後、最新 `standard-v01` 由来の機械生成インサイト3件をrecommendationsに保存済み。
seed recommendations は通常表示しない。
recommendations画面は、最新 `standard-v01` measurement run由来かつ `display_decision = show` の項目だけを表示する。

### leaderboard 最新aggregate表示修正

`/dashboard/reports/recora-kenzai-q2/leaderboard` は、`/dashboard` と同じ最新 `openai_measurement` aggregate runを基準に表示するよう修正済み。

取得方針:

- `measurement_runs.metadata.run_kind = aggregate`
- `measurement_runs.metadata.data_source = openai_measurement`
- `measurement_runs.status = completed`
- 対象projectの最新aggregate runを1件だけ解決する
- その `aggregateRunId` に紐づく `metric_snapshots.scope_type = brand` だけをleaderboardに使う
- 古いaggregateや、ブランドごとの個別最新snapshotを混ぜない
- `noStore()` を使って stale 表示を避ける
- seed aggregate / seed snapshots は通常表示から除外する
- sample fallback は復活させない

最新 `aggregateRunId` は `5f6e433f-dd09-4341-b2de-7240ff5ce042`。

最新leaderboard表示値:

| Brand | AI表示率 |
|---|---:|
| レコラ建材 | 50% |
| タイルワークス | 10% |
| マテリアルラボ | 10% |
| クラフト建材 | 0% |
| 住空間タイル | 0% |

### 現在のDB件数メモ

| Table | Count |
|---|---:|
| `measurement_runs` | 20 |
| `run_items` | 62 |
| `ai_conversations` | 60 |
| `brand_mentions` | 276 |
| `citations` | 120 |
| `source_domains` | 67 |
| `metric_snapshots` | 59 |
| `recommendations` | 9 |
| `topics` | 6 |
| `prompts` | 12 |
| `personas` | 4 |

### 運用上の追加注意

- Recora指標はAIプラットフォーム公式評価ではなく、観測ベースの自社指標である。
- 少数観測を強い結論として扱わない。
- `standard-v01` は20観測なので、毎回気軽に連打しない。
- `small-v01` は疎通確認用として扱う。
- recommendations画面は、顧客向けに出せる最新 `standard-v01` 由来の `display_decision = show` 項目だけを表示する。
- seed recommendationsは通常表示しない。
- 表示対象がない場合、recommendations画面はsample fallbackではなく空状態になる。

## 10. 2026-06-18 recommendations候補生成・保存・表示チェックポイント

最新 `standard-v01` 測定結果から、機械生成インサイトをrecommendationsとして扱う方針に更新した。
人間レビュー前提の `review_required` / `reviewed` / `approved` ではなく、顧客向けに出せる項目として `display_decision = show` の候補を保存・表示する。

### recommendations候補生成の最新仕様

- 最新 `standard-v01` measurement run のみを根拠にする。
- seed / sample / small-v01 / 過去run は根拠に混ぜない。
- candidates は `display_decision = show` として3件生成済み。
- `quality_score` は根拠の整い度を示す表示値であり、非表示判定には使わない。
- Recora独自観測であり、AIプラットフォーム公式評価ではない。
- `standard-v01` は固定し、プロンプト構成を変える場合は `standard-v02` を作る。

対象run:

| Item | Value |
|---|---|
| measurementRunId | `23677594-080c-424e-bff0-dc931d106b33` |
| aggregateRunId | `5f6e433f-dd09-4341-b2de-7240ff5ce042` |
| profile | `standard-v01` |
| observations | 20 |
| citations | 26 |

### 生成済み候補3件

| candidate_id | display_category | quality_score | confidence | confidence_label |
|---|---|---:|---|---|
| `brand_visibility_gap` | 改善提案 | 85 | medium | 傾向あり |
| `citation_evidence_review` | 引用確認事項 | 76 | medium | 傾向あり |
| `case_study_evidence_gap` | サンプル不足 | 45 | low | 要確認 |

`citation_evidence_review` は改善提案ではなく、引用URLが回答内容を支持しているか確認するための引用確認事項として扱う。
`case_study_evidence_gap` は、1件の事例確認promptを根拠にしたサンプル不足として扱い、強い断定には使わない。

### recommendations保存

- `scripts/save-recommendation-candidates.ts` で `display_decision = show` の3件を保存可能にした。
- dry-runがデフォルト。
- `--apply` 実行時のみDBへ書き込む。
- 同じ `measurement_run_id + candidate_id` はduplicateとして扱う。
- save reporting の不整合を修正済み。
- recommendationsは `6 -> 9` になった。

保存済み3件は、metadataに以下を保持する。

- `measurement_run_id`
- `aggregate_run_id`
- `measurement_profile_id`
- `data_source`
- `candidate_id`
- `display_decision`
- `display_category`
- `quality_score`
- `confidence`
- `confidence_label`
- `customer_facing_caution`
- `score_explanation`
- `recora_metric_notice`
- `evidence`

### /recommendations 画面

`/dashboard/reports/recora-kenzai-q2/recommendations` は、最新 `standard-v01` measurement run由来の `display_decision = show` だけを表示する。
seed由来6件は通常表示しない。

表示件数:

| Source | Count |
|---|---:|
| seed由来recommendations | 6 |
| 最新standard-v01由来recommendations | 3 |
| 通常表示件数 | 3 |

表示項目:

- `display_category`
- 根拠スコア
- `confidence_label`
- `priority`
- `status`
- `customer_facing_caution`
- `score_explanation`

画面では、以下の3区分を分けて表示する。

- 改善提案
- 引用確認事項
- サンプル不足

### 直近コミット

| Commit | 内容 |
|---|---|
| `91bf5eb` | `feat(recora): show generated standard recommendations` |
| `328a08b` | `fix(recora): clarify recommendation save reporting` |
| `53ed518` | `feat(recora): dry-run save generated recommendations` |
| `1ada025` | `feat(recora): score generated recommendation candidates` |
| `a4bb9a1` | `feat(recora): scope recommendation candidates to measurement runs` |
| `e2b6efd` | `fix(recora): use latest aggregate for leaderboard` |
| `551a71a` | `feat(recora): add measurement profiles` |
| `ff9f749` | `docs(recora): document live-data display policy` |
| `ab258ad` | `fix(recora): exclude seed data from live dashboard views` |
| `fbb5e66` | `feat(recora): expand prompt library` |

### 現在のDB件数メモ

| Table | Count |
|---|---:|
| `measurement_runs` | 20 |
| `run_items` | 62 |
| `ai_conversations` | 60 |
| `brand_mentions` | 276 |
| `citations` | 120 |
| `source_domains` | 67 |
| `metric_snapshots` | 59 |
| `recommendations` | 9 |
| `topics` | 6 |
| `prompts` | 12 |
| `personas` | 4 |

### 注意点

- recommendations画面は、顧客向けに出せる項目だけ表示する。
- `quality_score` は成果保証ではなく、根拠の整い度を示す表示値。
- `citation_evidence_review` は改善提案ではなく引用確認事項として扱う。
- `case_study_evidence_gap` はサンプル不足として扱う。
- seed recommendationsは通常表示しない。
- Recora指標はRecora独自の観測指標であり、AIプラットフォーム公式評価ではない。
- 少数観測を強い結論として扱わない。
- `standard-v01` は固定し、プロンプト構成を変更する場合は `standard-v02` を作る。
