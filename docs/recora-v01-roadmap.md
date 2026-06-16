# Recora v0.1 Implementation Roadmap

## Scope And Evidence

- Target: Recora / レコラ の `/dashboard` 配下AI検索分析ダッシュボード
- Mode: implementation-plan-only
- Confirmed facts: v0.1ではDB/API/画面実装をまだ行わず、設計ドキュメントを作る
- Industry practice: 実装ロードマップは、保存すべき正本データから順に積む
- Recora assumptions: 優先順位、フェーズ分け、実装難易度はRecora向けの内部設計案
- Needs verification: 実AI回答の取得方式、保存先DB、運用頻度、モデル別レスポンス差
- Not inspected: 本番DB、API、外部連携、課金、LP

## v0.1 Goal

v0.1の目的は、現在のサンプルデータを将来DB化し、次の指標を実データから出せる状態にすること。

- AI表示率
- AI言及数
- 参照回数
- AI内シェア
- 競合差分
- 改善優先度

v0.1では、完全自動実行、API連携、課金、チーム権限、エクスポート基盤は扱わない。

## v0.1 Product Principle

Recora v0.1は「スコアを作るアプリ」ではなく、「AI回答と根拠を保存し、説明可能なスコアにするアプリ」として設計する。

そのため、実装順は次を優先する。

1. 測定条件を保存する
2. 生のAI回答を保存する
3. 回答からブランド言及と参照元を抽出する
4. 集計値を `metric_snapshots` に保存する
5. ダッシュボードが集計値と元データを参照する

## v0.1 Adopted Tables

v0.1で採用するテーブル。

| Table | Reason |
|---|---|
| `projects` | ダッシュボードの分析単位 |
| `brands` | 自社と競合を同じテーブルで管理 |
| `personas` | ペルソナ別測定 |
| `topics` | トピック別測定 |
| `prompts` | AI回答取得の入力 |
| `ai_models` | AIモデル別比較 |
| `measurement_runs` | 測定実行単位 |
| `run_items` | `prompt x persona x ai_model` の実行明細 |
| `ai_conversations` | 生のAI回答ログ |
| `brand_mentions` | 回答内のブランド出現と扱われ方 |
| `citations` | 参照URLとドメイン |
| `source_domains` | 参照元ドメイン分類 |
| `metric_snapshots` | ダッシュボード表示用集計 |
| `recommendations` | 改善提案 |

## v0.1 Not Included

v0.1ではやらないこと。

| Area | Not included |
|---|---|
| DB/API | このドキュメント作成時点では実装しない |
| LP | 触らない |
| Billing | Stripe、課金、Upgrade表示は作らない |
| External integrations | 外部連携は設計のみ |
| Scheduled runs | 完全自動実行は作らない |
| Team management | 実ユーザー、権限、招待は作らない |
| Export jobs | CSV/PDF出力ジョブは作らない |
| Risk automation | 誤情報の完全自動判定は作らない |
| `extracted_claims` | 独立テーブルにしない。v0.1.5の `risk_findings.claim_text` で扱う |
| `project_competitors` | v0.1では作らない。`brands.brand_type` で管理する |

## Phase 0: Documentation And Fixture Alignment

Status: current docs task.

Purpose:

- サンプルデータを将来DB化できる形に整理する。
- 指標名と計算方針を固定する。
- v0.1とv0.1.5以降の境界を決める。

Deliverables:

- `docs/recora-data-model.md`
- `docs/recora-scoring.md`
- `docs/recora-v01-roadmap.md`

Done when:

- v0.1最小テーブルが明確。
- スコアがRecora独自指標であることが明記されている。
- 後回しにするテーブルが明確。

## Phase 1: Core Data Schema

Implementation difficulty: Medium.

Tables:

- `projects`
- `brands`
- `personas`
- `topics`
- `prompts`
- `ai_models`

Purpose:

- 現在の `lib/recora/sample-data.ts` にある project、brand、competitors、personas、topics、prompts、models をDB化できる状態にする。

Key decisions:

- `brands.brand_type = primary | competitor` を使う。
- 自社と競合を同じ構造で扱う。
- brand aliasesを持つ。
- プロンプトは編集されるため、測定時にはスナップショットを残す。

Risks:

- 競合を別テーブルにするとv0.1が重くなる。
- ペルソナやトピックの重みを早く複雑にしすぎると、スコア説明が難しくなる。

## Phase 2: Measurement Storage

Implementation difficulty: Medium to High.

Tables:

- `measurement_runs`
- `run_items`
- `ai_conversations`

Purpose:

- 測定実行、測定明細、生のAI回答を保存する。

Required fields:

- 実行期間
- 比較期間
- 地域
- 言語
- プロンプト
- AIモデル
- 生のAI回答
- 回答取得日時
- 実行時プロンプト文
- 実行時AIモデル名

Done when:

- 1回の測定が複数の `run_items` を持てる。
- 各 `run_item` にAI回答ログを紐づけられる。
- 生のAI回答を消さずに保持できる。

Risks:

- スコアだけ保存すると後で説明できない。
- AIモデル名やプロンプト文が変更された時、過去レポートの再現性が落ちる。

## Phase 3: Answer Extraction

Implementation difficulty: High.

Tables:

- `brand_mentions`
- `citations`
- `source_domains`

Purpose:

- AI回答から、ブランドが出たか、何番目に出たか、推薦されたか、どのURLが参照されたかを保存する。

Extraction output:

- brand mentioned yes/no
- mention position
- recommendation status
- sentiment
- answer score 0-5
- cited URLs
- cited domains
- source type
- supports claim

Done when:

- 自社と競合のAI言及数が出せる。
- 参照回数が出せる。
- 参照元分析画面に必要なドメイン分類ができる。

Risks:

- AI回答形式はモデルごとに違う。
- 引用URLがない回答もある。
- 参照元が主張を本当に支えているかは機械的に判定しすぎない。

## Phase 4: Metric Snapshots

Implementation difficulty: Medium.

Tables:

- `metric_snapshots`

Purpose:

- ダッシュボード表示用の集計値を保存する。

Metrics:

- AI表示率
- AI言及数
- 参照回数
- AI内シェア
- 競合差分
- 平均掲載順位

Scope:

- project
- brand
- topic
- persona
- model
- prompt
- source_domain

Done when:

- `/dashboard` のKPIを `metric_snapshots` から表示できる。
- `overview`, `leaderboard`, `sources`, `trends` が同じ集計テーブルを参照できる。
- 元データから再集計できる。

Risks:

- `metric_snapshots` を正本扱いしない。
- スコア式変更時に再集計できるよう、元データを残す。

## Phase 5: Recommendations

Implementation difficulty: Medium.

Tables:

- `recommendations`

Purpose:

- 改善提案、優先度、影響プロンプト、対象トピックを保存する。

v0.1 behavior:

- 完全自動生成ではなく、集計結果から作られた提案を保存できる状態にする。
- UIでは「改善提案」「改善プラン」「コンテンツ改善案」の土台として使う。

Done when:

- `/dashboard` の「次にやること」をDB由来にできる。
- `/recommendations` と `/action-plan` のベースになる。

Risks:

- 改善提案を断定表現にしない。
- 「必ずAIに表示される」のような表現を避ける。

## v0.1.5 Additions

v0.1.5では、v0.1の測定データを使って分析軸を増やす。

| Table | Purpose |
|---|---|
| `buyer_criteria` | 選定基準の定義 |
| `buyer_criteria_scores` | 選定基準ごとの勝ち負け |
| `brand_facts` | 誤情報判定の正解情報 |
| `risk_findings` | 誤情報、古い情報、競合混同の検知結果 |
| `content_opportunities` | コンテンツ改善案 |
| `page_briefs` | ページ改善案 |

Notes:

- `extracted_claims` は独立テーブルにしない。
- 誤情報リスクは `risk_findings.claim_text` にAI回答内の主張を保存する。
- `brand_facts` と照合して、`risk_findings.status = needs_review` を初期状態にする。

## v0.2 Additions

v0.2では運用機能を増やす。

| Table | Purpose |
|---|---|
| `project_competitors` | 競合設定の詳細管理 |
| `users` | ユーザー管理 |
| `teams` | チーム管理 |
| `roles` | 権限管理 |
| `integrations` | 外部連携 |
| `export_jobs` | CSV/PDF/共有リンク出力 |
| `scheduled_runs` | 定期測定 |
| `site_pages` | ページ単位診断 |
| `crawl_snapshots` | クロール・構造化データ診断 |
| `tasks` | 改善プランのタスク管理 |
| `cost_logs` | AIモデル実行コスト管理 |

## Dashboard Mapping Roadmap

| Screen | v0.1 data | v0.1.5+ data |
|---|---|---|
| `/dashboard` | `metric_snapshots`, `recommendations` | `risk_findings`, `content_opportunities` |
| `/dashboard/reports` | `projects`, `measurement_runs` | `export_jobs` |
| `overview` | `metric_snapshots`, `topics`, `personas`, `ai_models` | - |
| `leaderboard` | `brands`, `brand_mentions`, `metric_snapshots` | `project_competitors` |
| `conversations` | `ai_conversations`, `brand_mentions`, `citations` | `risk_findings` |
| `prompts` | `prompts`, `topics`, `metric_snapshots` | buyer intent refinements |
| `sources` | `citations`, `source_domains` | citation gap analysis |
| `trends` | `measurement_runs`, `metric_snapshots` | scheduled run history |
| `buyer-criteria` | placeholder/sample | `buyer_criteria`, `buyer_criteria_scores` |
| `brand-perception` | `brand_mentions` | `risk_findings`, `brand_facts` |
| `recommendations` | `recommendations` | score breakdown |
| `content-opportunities` | `recommendations` | `content_opportunities`, `page_briefs` |
| `technical-audit` | `recommendations` | `site_pages`, `crawl_snapshots` |
| `misinformation-risks` | placeholder/sample | `brand_facts`, `risk_findings` |
| `action-plan` | `recommendations` | `tasks` |

## Implementation Priority

| Priority | Work |
|---|---|
| P1 | v0.1 core schema |
| P1 | AI回答ログ保存 |
| P1 | brand_mentions extraction |
| P1 | citations extraction |
| P1 | metric_snapshots aggregation |
| P1 | dashboard data replacement from sample to DB |
| P2 | recommendations persistence |
| P2 | buyer criteria |
| P2 | misinformation risk |
| P2 | content opportunities |
| P3 | team, roles, external integrations, exports, scheduled runs |

## Design Warnings

- AI表示率はRecora独自の測定指標であり、AIプラットフォーム公式指標ではない。
- 回答ログ、プロンプト、AIモデル、測定日時を失う設計にしない。
- `metric_snapshots` は表示高速化用であり、正本ではない。
- 自社と競合を別構造にしすぎない。v0.1では `brands.brand_type` で十分。
- 誤情報リスクを自動断定しない。初期状態は `needs_review` が安全。
- 参照回数、参照URL数、参照ドメイン数を混同しない。
- v0.1では「データを保存して説明できる」ことを優先し、「完全自動で改善する」ことは後回しにする。
