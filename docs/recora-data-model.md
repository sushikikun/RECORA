# Recora v0.1 Data Model

## Scope And Evidence

- Target: Recora / レコラ の `/dashboard` 配下AI検索分析ダッシュボード
- Mode: implementation-plan-only / ai-citation-strategy
- Confirmed facts: 現在の画面構成、サンプルデータ、ユーザー指定のv0.1テーブル候補
- Industry practice: 測定条件、AI回答、抽出結果、集計値を分けて保存する
- Recora assumptions: 本文書のテーブル設計とスコア集計方針はRecora独自の設計案
- Needs verification: 実AI回答の取得仕様、各AIモデルのレスポンス形式、引用URLの抽出方法
- Not inspected: DB実装、API実装、本番データ、LP、課金

## v0.1 の中心データ構造

Recora v0.1では、まず「AI回答を保存して、AI表示率・AI言及数・参照回数・AI内シェア・競合差分を出せる状態」を優先する。

中心になる流れは次の通り。

```text
projects
  ├─ brands
  │   ├─ primary brand
  │   └─ competitor brands
  ├─ personas
  ├─ topics
  │   └─ prompts
  ├─ ai_models
  └─ measurement_runs
      └─ run_items
          └─ ai_conversations
              ├─ brand_mentions
              └─ citations

source_domains
metric_snapshots
recommendations
```

v0.1では `brands` に自社と競合を同居させ、`brand_type = primary | competitor` で分ける。`project_competitors` はv0.1では作らず、v0.2以降の候補に回す。

## v0.1 最小テーブル

| Table | Role | Priority |
|---|---|---|
| `projects` | 分析対象プロジェクト。ダッシュボード全体の単位。 | P1 |
| `brands` | 自社ブランドと競合ブランド。`brand_type` で分類する。 | P1 |
| `personas` | AI回答を取得する購買ペルソナ。 | P1 |
| `topics` | 調査テーマ、検索意図、改善対象領域。 | P1 |
| `prompts` | AIモデルに投げる質問文。 | P1 |
| `ai_models` | ChatGPT、Gemini、Perplexity、Claudeなどの測定対象。 | P1 |
| `measurement_runs` | 測定実行のまとまり。期間、地域、状態を持つ。 | P1 |
| `run_items` | `prompt x persona x ai_model` の実行単位。 | P1 |
| `ai_conversations` | 生のAI回答ログと要約。 | P1 |
| `brand_mentions` | 回答内での自社・競合の出現、順位、扱われ方。 | P1 |
| `citations` | AI回答内で参照されたURL、ドメイン、参照理由。 | P1 |
| `source_domains` | 参照元ドメインの正規化と分類。 | P1 |
| `metric_snapshots` | ダッシュボード表示用の集計値。 | P1 |
| `recommendations` | 改善提案。v0.1では自動生成前提ではなく保存先として用意する。 | P1 |

## Main Columns

### `projects`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | プロジェクトID |
| `name` | text | 例: Recora AI検索分析レポート |
| `workspace_name` | text | 表示用ワークスペース名 |
| `language` | text | 例: `ja` |
| `region` | text | 例: `JP` |
| `default_period` | text/date range | 初期表示期間 |
| `created_at` | timestamp | 作成日時 |
| `updated_at` | timestamp | 更新日時 |

### `brands`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | ブランドID |
| `project_id` | fk | `projects.id` |
| `brand_type` | enum | `primary` or `competitor` |
| `name` | text | Recora、架空競合名など |
| `reading` | text nullable | 日本語読み |
| `domain` | text nullable | 代表ドメイン |
| `aliases` | json/text[] | 表記ゆれ、略称 |
| `category` | text | ブランドカテゴリ |
| `description` | text | AI回答抽出や画面表示に使う説明 |
| `is_active` | boolean | 測定対象に含めるか |

### `personas`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | ペルソナID |
| `project_id` | fk | `projects.id` |
| `name` | text | 例: マーケティング責任者 |
| `segment` | text | 例: BtoB SaaS |
| `weight` | number | 集計重み。初期値は1でもよい |
| `jobs` | json/text[] | 期待する業務 |
| `pain_points` | json/text[] | 課題 |
| `is_active` | boolean | 測定対象に含めるか |

### `topics`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | トピックID |
| `project_id` | fk | `projects.id` |
| `name` | text | 例: AI検索での表示状況 |
| `intent` | text | 調査意図 |
| `priority` | enum | `high`, `medium`, `low` |
| `weight` | number | 改善優先度計算に使う |
| `is_active` | boolean | 測定対象に含めるか |

### `prompts`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | プロンプトID |
| `project_id` | fk | 冗長だが検索しやすくするため保持可 |
| `topic_id` | fk | `topics.id` |
| `persona_id` | fk nullable | ペルソナ固定でない場合はnull |
| `text` | text | 実際にAIへ投げる質問文 |
| `intent` | text | ツール探索、比較、選定基準など |
| `buyer_stage` | text nullable | 認知、比較、選定、稟議など |
| `priority` | enum | `high`, `medium`, `low` |
| `is_active` | boolean | 測定対象に含めるか |

### `ai_models`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | モデルID |
| `provider` | text | OpenAI、Google、Anthropicなど |
| `model_name` | text | API上のモデル名。v0.1ではサンプル可 |
| `display_name` | text | 画面表示名 |
| `is_active` | boolean | 測定対象に含めるか |

### `measurement_runs`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | 測定実行ID |
| `project_id` | fk | `projects.id` |
| `status` | enum | `draft`, `running`, `completed`, `failed` |
| `period_start` | date | 対象期間開始 |
| `period_end` | date | 対象期間終了 |
| `comparison_start` | date nullable | 比較期間開始 |
| `comparison_end` | date nullable | 比較期間終了 |
| `region` | text | 測定地域 |
| `language` | text | 測定言語 |
| `started_at` | timestamp | 実行開始 |
| `completed_at` | timestamp nullable | 実行完了 |

### `run_items`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | 実行明細ID |
| `run_id` | fk | `measurement_runs.id` |
| `prompt_id` | fk | `prompts.id` |
| `persona_id` | fk | 実行時のペルソナ |
| `model_id` | fk | `ai_models.id` |
| `status` | enum | `queued`, `completed`, `failed`, `skipped` |
| `error_message` | text nullable | 失敗理由 |
| `latency_ms` | number nullable | 将来の運用確認用 |
| `captured_at` | timestamp | 回答取得日時 |

### `ai_conversations`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | AI回答ログID |
| `run_item_id` | fk | `run_items.id` |
| `raw_answer` | text | 生のAI回答。必ず保存する |
| `answer_summary` | text nullable | 画面表示用要約 |
| `answer_hash` | text | 重複検知、差分確認 |
| `prompt_text_snapshot` | text | 実行時のプロンプト文を固定保存 |
| `model_snapshot` | text | 実行時のモデル表示名を固定保存 |
| `captured_at` | timestamp | 回答取得日時 |

生のAI回答、プロンプト、モデル、測定日時は必ず残す。スコアだけ保存する設計にはしない。

### `brand_mentions`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | 言及ID |
| `conversation_id` | fk | `ai_conversations.id` |
| `brand_id` | fk | `brands.id` |
| `mentioned` | boolean | 回答に出たか |
| `position` | number nullable | 出現順位。未出現ならnull |
| `recommendation_status` | enum | `strongly_recommended`, `recommended`, `listed`, `neutral`, `absent`, `discouraged` |
| `sentiment` | enum | `positive`, `neutral`, `negative`, `unclear` |
| `answer_score` | number | 0-5の回答内スコア |
| `mention_text` | text nullable | 該当箇所の抜粋 |

### `citations`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | 参照ID |
| `conversation_id` | fk | `ai_conversations.id` |
| `brand_id` | fk nullable | どのブランドの根拠として扱われたか |
| `url` | text nullable | 参照URL |
| `domain` | text | 正規化前でも保存 |
| `source_domain_id` | fk nullable | `source_domains.id` |
| `title` | text nullable | ページタイトル |
| `source_type` | enum | `owned`, `competitor`, `media`, `review`, `technical`, `unknown` |
| `supports_claim` | boolean nullable | 主張を支える参照か |
| `occurrence_count` | number | 回答内出現回数 |

### `source_domains`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | ドメインID |
| `project_id` | fk | `projects.id` |
| `domain` | text | 正規化済みドメイン |
| `source_type` | enum | 自社、競合、第三者メディアなど |
| `owner_brand_id` | fk nullable | 自社/競合ドメインの場合に紐づけ |
| `trust_label` | text nullable | v0.1では手入力ラベルで十分 |

### `metric_snapshots`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | 集計ID |
| `run_id` | fk | `measurement_runs.id` |
| `scope_type` | enum | `project`, `brand`, `topic`, `persona`, `model`, `prompt`, `source_domain` |
| `scope_id` | text nullable | 対象ID |
| `brand_id` | fk nullable | ブランド別集計の場合 |
| `ai_visibility` | number | Recora独自のAI表示率 |
| `ai_mention_count` | number | AI言及数 |
| `citation_count` | number | 参照回数 |
| `share_of_voice` | number | AI内シェア |
| `competitive_gap` | number nullable | 首位競合との差分 |
| `average_position` | number nullable | 平均掲載順位 |
| `calculated_at` | timestamp | 集計日時 |

### `recommendations`

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid/string | 改善提案ID |
| `project_id` | fk | `projects.id` |
| `run_id` | fk nullable | 根拠になった測定回 |
| `type` | enum | `content`, `source`, `technical`, `prompt`, `risk`, `competitive` |
| `priority` | enum | `high`, `medium`, `low` |
| `impact_score` | number | 改善インパクト |
| `effort_score` | number nullable | 実装負荷 |
| `title` | text | 提案タイトル |
| `reason` | text | 根拠 |
| `target_url` | text nullable | 対象ページ |
| `related_topic_id` | fk nullable | 関連トピック |
| `related_prompt_id` | fk nullable | 関連プロンプト |
| `status` | enum | `open`, `planned`, `done`, `dismissed` |

## Table Relationships

| Relationship | Meaning |
|---|---|
| `projects 1 -> many brands` | 1プロジェクトに自社と競合を持つ |
| `projects 1 -> many personas` | ペルソナはプロジェクトごとに定義 |
| `projects 1 -> many topics` | トピックはプロジェクトごとに定義 |
| `topics 1 -> many prompts` | 各トピックに複数プロンプト |
| `personas 1 -> many prompts` | ペルソナ別質問を持てる |
| `projects 1 -> many measurement_runs` | 期間ごとの測定実行 |
| `measurement_runs 1 -> many run_items` | プロンプト、モデル、ペルソナ単位の明細 |
| `run_items 1 -> 1 ai_conversations` | v0.1では1実行明細につき1回答を想定 |
| `ai_conversations 1 -> many brand_mentions` | 回答内の自社・競合の出現 |
| `ai_conversations 1 -> many citations` | 回答内で参照されたURL |
| `source_domains 1 -> many citations` | ドメイン単位に正規化 |
| `measurement_runs 1 -> many metric_snapshots` | 集計値を測定回ごとに保存 |

## Screens And Data Sources

| Screen | Main tables |
|---|---|
| `/dashboard` | `metric_snapshots`, `recommendations`, `brand_mentions`, `citations` |
| `/dashboard/reports` | `projects`, `measurement_runs`, `metric_snapshots` |
| `/dashboard/reports/[id]/overview` | `metric_snapshots`, `topics`, `personas`, `ai_models` |
| `/dashboard/reports/[id]/leaderboard` | `brands`, `brand_mentions`, `metric_snapshots` |
| `/dashboard/reports/[id]/conversations` | `ai_conversations`, `run_items`, `brand_mentions`, `citations` |
| `/dashboard/reports/[id]/prompts` | `prompts`, `topics`, `personas`, `brand_mentions`, `metric_snapshots` |
| `/dashboard/reports/[id]/sources` | `citations`, `source_domains`, `ai_conversations` |
| `/dashboard/reports/[id]/trends` | `metric_snapshots`, `measurement_runs` |
| `/dashboard/reports/[id]/buyer-criteria` | v0.1.5の `buyer_criteria`, `buyer_criteria_scores` |
| `/dashboard/reports/[id]/brand-perception` | `brand_mentions`; v0.1.5以降で `risk_findings` |
| `/dashboard/reports/[id]/recommendations` | `recommendations`, `metric_snapshots` |
| `/dashboard/reports/[id]/content-opportunities` | v0.1は `recommendations`、v0.1.5で `content_opportunities` |
| `/dashboard/reports/[id]/technical-audit` | v0.1は `recommendations`、v0.2で `site_pages`, `crawl_snapshots` |
| `/dashboard/reports/[id]/misinformation-risks` | v0.1.5の `brand_facts`, `risk_findings` |
| `/dashboard/reports/[id]/action-plan` | v0.1は `recommendations`、v0.2で `tasks` |

## v0.1.5 Later Tables

| Table | Reason |
|---|---|
| `buyer_criteria` | 選定基準分析を正式に持つ |
| `buyer_criteria_scores` | 選定基準ごとの勝ち負けを保存 |
| `brand_facts` | 誤情報リスク判定の正解データ |
| `risk_findings` | 誤情報・古い情報・競合混同の検知結果 |
| `content_opportunities` | コンテンツ改善案を独立管理 |
| `page_briefs` | ページ改善案を作成・管理 |

`extracted_claims` はv0.1では独立テーブルにしない。v0.1.5の `risk_findings.claim_text` で扱い、必要になった時点で分離する。

## v0.2 Later Tables

| Table | Reason |
|---|---|
| `project_competitors` | 競合の期間別有効化、カテゴリ別競合などを扱う時に追加 |
| `users` | ログイン・権限管理 |
| `teams` | チーム管理 |
| `roles` | 権限ロール |
| `integrations` | 外部連携 |
| `export_jobs` | CSV/PDF/共有リンク出力 |
| `scheduled_runs` | 定期測定 |
| `site_pages` | 自社ページ単位の診断 |
| `crawl_snapshots` | クロール・構造化データ診断 |
| `tasks` | 改善プランのタスク管理 |
| `cost_logs` | AIモデル実行コスト管理 |

## Implementation Notes

- AI表示率はAIプラットフォーム公式指標ではない。Recora独自の測定指標として画面とレポートに明記する。
- 生のAI回答、実行時のプロンプト文、AIモデル、測定日時は必ず保存する。
- `metric_snapshots` だけに依存しない。元データから再集計できる状態を保つ。
- ブランド名は表記ゆれが起きるため、`brands.aliases` をv0.1から持つ。
- 参照回数はURL数、ドメイン数、回答内出現回数を混同しない。
- v0.1の目的は完全自動化ではなく、サンプルデータをDB化できる土台を作ること。
