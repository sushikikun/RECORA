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

- AI回答、ブランド言及、引用元、参照URLをもとに改善提案候補を作る
- 候補ごとに priority / confidence / evidence / save decision を付与する
- `recommendations` テーブルには保存しない
- Recora独自観測であり、AIプラットフォーム公式評価ではないことを明記する

### `scripts/save-recommendation-candidates.ts`

改善提案候補JSONから `recommendations` テーブルへ保存するための安全ガード付きスクリプト。

主な責務:

- デフォルトはdry-run
- `--apply`、`--candidate-ids`、`--confirm-reviewed` が揃わない限りDBに書き込まない
- `candidate_only` は保存対象外にする
- `review_required` の候補だけ保存候補にできる
- 現時点では未レビュー候補を顧客向け画面に表示しない方針

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
- 未レビュー候補、`review_required`、`candidate_only` のrecommendations

seed recommendations は通常表示から除外される。
そのため、実データ由来かつ reviewed / approved 相当で表示対象になるrecommendationsがない場合、改善提案は0件として表示される。

### 最新の画面別表示方針

| Page | 最新表示方針 |
|---|---|
| `/dashboard` | `metadata.run_kind = aggregate` かつ `metadata.data_source = openai_measurement` のaggregate run由来KPIを表示する |
| `/dashboard/reports/recora-kenzai-q2/conversations` | `provider = openai` または `response_id` があるOpenAI実測回答だけを通常表示する |
| `/dashboard/reports/recora-kenzai-q2/sources` | OpenAI実測回答に紐づく参照元だけを表示し、`.example` ドメイン/URLは除外する |
| `/dashboard/reports/recora-kenzai-q2/leaderboard` | `openai_measurement` aggregate のbrand scope snapshotsを表示する |
| `/dashboard/reports/recora-kenzai-q2/recommendations` | 未レビュー候補とseed提案を通常表示しない。表示対象がなければ空状態にする |

この方針により、seed.sqlに開発初期化用データが残っていても、通常画面は実測データ中心のプロダクト画面として扱える。

### 直近の重要コミット

| Commit | 内容 |
|---|---|
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
