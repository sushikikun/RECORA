# Recora v0.1 Checkpoint

作成日: 2026-06-18

このドキュメントは、Recora / レコラ v0.1 の「測定できる、保存できる、表示できる」大枠到達点を記録するためのチェックポイントです。

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

`recommendations` と `metric_snapshots` は、測定スクリプトからは直接作成しない。`metric_snapshots` は再集計スクリプトで作成する。

### AI回答ログ表示

- `/dashboard/reports/recora-kenzai-q2/conversations` で、実測したAI回答ログを確認できる。
- no-search / web-search の観測回答を、回答ログとして確認できる。

### 参照元分析表示

- `/dashboard/reports/recora-kenzai-q2/sources` で、web-search由来の引用元を確認できる。
- `citations` と `source_domains` に保存されたURL、domain、source type を参照元分析に反映できる。

### metric_snapshots再集計

- `scripts/recalculate-metric-snapshots.ts` で、OpenAI実測runをsourceとして集計できる。
- aggregate run を作成し、dashboard / leaderboard 用の `metric_snapshots` を保存できる。
- project scope と brand scope のsnapshotを分けて保存できる。
- seed由来の既存 `metric_snapshots` を残したまま、OpenAI実測aggregateを追加できる。

### dashboard KPI反映

- `/dashboard` は最新のaggregate run由来の project scope snapshot を参照できる。
- dashboard KPIは、aggregate `metric_snapshots` の値を表示できる。
- 現在のKPI:
  - AI表示率: 0%
  - AI言及数: 0
  - 参照回数: 13

### leaderboard反映

- `/dashboard/reports/recora-kenzai-q2/leaderboard` は、最新aggregate runの brand scope snapshots を参照できる。
- 5ブランド分のbrand scope snapshotを表示できる。
- 現在のaggregate runでは、全ブランドの visibility rate は 0%。

## 2. 主要スクリプト

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
| `measurement_runs` | 7 |
| `run_items` | 22 |
| `ai_conversations` | 22 |
| `brand_mentions` | 86 |
| `citations` | 46 |
| `source_domains` | 32 |
| `recommendations` | 6 |
| `metric_snapshots` | 23 |

直近のOpenAI実測source run:

| Item | Value |
|---|---:|
| source run id | `16d82d58-46cd-4e3f-94f3-f8e564a21e5d` |
| run_items | 6 |
| ai_conversations | 6 |
| no-search conversations | 3 |
| web-search conversations | 3 |
| brand_mentions | 30 |
| citations | 13 |
| unique source domains in citations | 13 |

## 4. 重要なaggregate run

| Item | Value |
|---|---|
| aggregate run id | `df785776-e493-46f0-be07-eca7c71ff6e9` |
| source_run_id | `16d82d58-46cd-4e3f-94f3-f8e564a21e5d` |
| status | `completed` |
| metadata.run_kind | `aggregate` |
| metadata.data_source | `openai_measurement` |
| metric_snapshots | 6 |
| project scope snapshots | 1 |
| brand scope snapshots | 5 |
| project scope citation_count | 13 |
| project scope ai_visibility | 0 |
| project scope ai_mention_count | 0 |

seed由来の `metric_snapshots` は17件残っている。OpenAI実測aggregateはseed集計runを置き換えるのではなく、別runとして追加されている。

## 5. 現在の表示確認

| Page | Status | Notes |
|---|---:|---|
| `/dashboard` | 200 | dashboard KPIを表示できる |
| `/dashboard/reports/recora-kenzai-q2/conversations` | 200 | 実測AI回答ログを確認できる |
| `/dashboard/reports/recora-kenzai-q2/sources` | 200 | web-search由来の引用元を確認できる |
| `/dashboard/reports/recora-kenzai-q2/leaderboard` | 200 | aggregate run由来のbrand scope snapshotsを確認できる |

dashboard KPI:

| KPI | Value | Source |
|---|---:|---|
| AI表示率 | 0% | project scope `metric_snapshots.ai_visibility` |
| AI言及数 | 0 | project scope `metric_snapshots.ai_mention_count` |
| 参照回数 | 13 | project scope `metric_snapshots.citation_count` |

## 6. 注意点

- このDB状態はローカルSupabase DB上の状態。
- `supabase db reset` を実行すると、OpenAI実測データ、aggregate run、追加snapshotは消える。
- `output/` 配下はGit管理外。
- `.env.local` とAPIキーはGit管理しない。
- Recora指標はAIプラットフォーム公式評価ではない。
- 観測数が少ないため、強い結論や顧客向けの断定表現には使わない。
- `metric_snapshots` は表示用の集計値であり、正本は `ai_conversations`、`brand_mentions`、`citations`、`source_domains` などの実測データ。
- 未レビューの改善提案候補は、顧客向けrecommendations画面には表示しない。
- ローカルNext開発サーバーで `.next` cache由来の表示エラーが出る場合は、コードやDBではなく実行中サーバーのキャッシュ状態を先に疑う。

## 7. 次にやるべきこと

v0.1の大枠は、以下の一本線が通った状態です。

1. OpenAI測定を実行する
2. DBに保存する
3. AI回答ログと参照元分析で実測データを見る
4. metric_snapshotsを再集計する
5. dashboard KPIとleaderboardに反映する

次の候補:

- 測定実行をUI化する
- metric集計の表示改善に進む
- run履歴や測定状態の見え方を整える
- dashboardとleaderboardで、観測数が少ないことをより明示する
- 参照元分析でsource typeやdomain分類の精度を改善する

まだ後回し:

- Auth / RLS
- 課金
- PDF export
- LP
- 改善提案の承認フロー
- 自動スケジュール実行
- 複数AIプラットフォーム比較の本格化
