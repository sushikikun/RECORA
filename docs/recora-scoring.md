# Recora v0.1 Scoring Design

## Scope And Evidence

- Target: Recora / レコラ のAI検索分析ダッシュボード指標
- Mode: implementation-plan-only / ai-citation-strategy
- Confirmed facts: v0.1で扱う指標はAI表示率、AI言及数、参照回数、AI内シェア、競合差分、改善優先度
- Industry practice: 元データと集計スナップショットを分け、説明可能性を保つ
- Recora assumptions: 本文書のスコア式はRecora独自の測定設計案
- Needs verification: 実AI回答での抽出精度、モデルごとの引用形式、重みの妥当性
- Not inspected: 実AI回答、APIレスポンス、DB実装

## Important Principle

AI表示率、AI内シェア、改善優先度は、AIプラットフォーム公式指標ではない。

これらはRecoraが、指定したペルソナ、トピック、プロンプト、AIモデル、測定期間の中で、ブランドがどのように扱われたかを比較するための独自測定指標である。

そのため、画面やレポートでは次の考え方を守る。

- 「AIで必ず表示される」と言わない。
- 「公式ランキング」と誤解させない。
- 「指定した調査条件におけるAI回答内の表示状況」として説明する。
- スコアだけでなく、根拠となるAI回答ログ、プロンプト、AIモデル、測定日時を保存する。

## Source Data Required

v0.1のスコア計算に必要な元データは次の通り。

| Data | Table |
|---|---|
| 測定実行 | `measurement_runs` |
| 測定明細 | `run_items` |
| プロンプト文 | `prompts`, `ai_conversations.prompt_text_snapshot` |
| AIモデル | `ai_models`, `ai_conversations.model_snapshot` |
| 生のAI回答 | `ai_conversations.raw_answer` |
| ブランド言及 | `brand_mentions` |
| 参照URL/ドメイン | `citations`, `source_domains` |
| 集計結果 | `metric_snapshots` |
| 改善提案 | `recommendations` |

## Answer-Level Score

v0.1ではAI回答ごとに `brand_mentions.answer_score` を持つ。

| Score | Meaning | Storage |
|---:|---|---|
| 0 | 表示なし | `mentioned = false`, `recommendation_status = absent` |
| 1 | 弱い言及 | 名前だけ、または文脈が薄い |
| 2 | 候補に列挙 | 一覧にはあるが推薦ではない |
| 3 | 推薦あり | 推薦されるが根拠が弱い |
| 4 | 根拠付き推薦 | 特徴や適合理由が説明される |
| 5 | 参照元付きで強く推薦 | 明確な適合理由と参照元がある |

この0-5スコアはRecora独自の回答内評価であり、AIプラットフォーム側のスコアではない。

## Core Metrics

### AI表示率

指定された測定範囲で、対象ブランドがAI回答内に表示された割合。

```text
AI表示率 =
  対象ブランドが mentioned = true だった有効run_item数
  / 有効run_item数
  * 100
```

重み付きにする場合。

```text
weighted_visibility =
  sum(mentioned_score * prompt_weight * persona_weight * topic_weight)
  / sum(max_score * prompt_weight * persona_weight * topic_weight)
  * 100
```

v0.1ではまず単純出現率を採用し、`metric_snapshots` に保存する。重み付きスコアは後から追加できるよう、`personas.weight`, `topics.weight`, `prompts.priority` を残す。

### AI言及数

対象ブランドがAI回答内で言及された回数。

```text
AI言及数 =
  count(brand_mentions where brand_id = target_brand and mentioned = true)
```

将来的には `mention_text` の出現回数や回答内複数回言及も分ける。

### 参照回数

AI回答内で、対象ブランドや対象ドメインに関係するURLが参照された回数。

```text
参照回数 =
  sum(citations.occurrence_count)
  where citations.brand_id = target_brand
```

注意点。

- URL単位の数。
- ドメイン単位の数。
- 回答内での出現回数。

この3つは混同しない。v0.1では `citation_count` は表示用の代表値として持ち、詳細は `citations` から確認できるようにする。

### AI内シェア

指定された測定範囲における、自社と競合全体の中での表示ポイントの割合。

```text
brand_visibility_points =
  sum(answer_score) for each brand

AI内シェア =
  target_brand_visibility_points
  / sum(all_primary_and_competitor_visibility_points)
  * 100
```

単純出現数で計算する場合。

```text
AI内シェア =
  target_brand_mention_count
  / sum(all_brand_mention_count)
  * 100
```

v0.1では単純出現数ベースから始め、`answer_score` ベースのAI内シェアは次段階で検証する。

### 競合差分

自社と首位競合、または特定競合との差。

```text
競合差分 =
  primary_brand.ai_visibility - leading_competitor.ai_visibility
```

表示では、負の値なら「首位競合に対して何pt不足しているか」を示す。

```text
競合差分 = -14pt
```

画面では「首位との差」「競合差分」として扱う。

### 平均掲載順位

対象ブランドが表示された回答の中で、何番目に出たかの平均。

```text
平均掲載順位 =
  avg(brand_mentions.position)
  where mentioned = true and position is not null
```

未表示の回答を含めるかどうかで意味が変わるため、v0.1では「表示された回答内の平均順位」として扱う。

### 改善優先度

改善優先度は、Recora独自の優先度スコア。公式なAI評価ではない。

v0.1では、完全な自動最適化ではなく、改善提案の並び順を決めるための内部スコアとして使う。

```text
改善優先度 =
  競合差分の大きさ
  + トピック重要度
  + 参照不足
  + AI表示率低下
  + 影響プロンプト数
  - 実装負荷
```

初期式の例。

```text
priority_score =
  gap_score * 0.30
  + topic_weight_score * 0.20
  + citation_gap_score * 0.20
  + trend_drop_score * 0.15
  + affected_prompt_score * 0.15
```

v0.1では `recommendations.impact_score` と `recommendations.priority` に保存する。式の細かい重みは実データを見て調整する。

## Metric Snapshot Strategy

`metric_snapshots` と元データを両方保存する理由。

### 元データを保存する理由

- AI回答ログから、なぜそのスコアになったか説明できる。
- スコア計算式を変えた時に再集計できる。
- 顧客や社内レビューで根拠を確認できる。
- 誤情報リスク、参照元分析、改善提案に横展開できる。

### `metric_snapshots` を保存する理由

- ダッシュボード表示を高速化できる。
- 週次推移やレポート履歴を固定できる。
- 測定当時の数値を保存できる。
- 重い集計を毎回走らせずに済む。

### 保存方針

```text
raw data = 正本
metric_snapshots = 表示・履歴用の集計結果
```

スコアだけを正本にしない。

## Scope Types In `metric_snapshots`

| `scope_type` | Meaning | Example |
|---|---|---|
| `project` | プロジェクト全体 | `/dashboard` |
| `brand` | ブランド別 | 競合ランキング |
| `topic` | トピック別 | トピック別AI表示率 |
| `persona` | ペルソナ別 | ペルソナヒートマップ |
| `model` | AIモデル別 | AIモデル別表示率 |
| `prompt` | プロンプト別 | プロンプト分析 |
| `source_domain` | 参照元別 | 参照元分析 |

## Risk And Accuracy Notes

v0.1では `risk_findings` はまだ最小テーブルに含めない。ただし、スコア設計上は次を意識する。

- `brand_mentions.sentiment` は誤情報判定ではない。
- `answer_score` が高くても、内容が正しいとは限らない。
- 参照元がある回答でも、参照元が主張を支えているとは限らない。
- 誤情報リスクはv0.1.5で `brand_facts` と `risk_findings.claim_text` を使って扱う。

## Screens And Metrics

| Screen | Metrics |
|---|---|
| `/dashboard` | AI表示率、AI言及数、参照回数、競合差分、改善優先度 |
| `overview` | AI表示率、トピック別AI表示率、AIモデル別表示率、参照カバレッジ |
| `leaderboard` | ブランド別AI表示率、AI内シェア、平均掲載順位、競合差分 |
| `conversations` | 回答別の言及、順位、感情、参照元 |
| `sources` | 参照回数、参照元ドメイン、参照シェア |
| `trends` | 指標の時系列推移 |
| `recommendations` | 改善優先度、改善インパクト、影響プロンプト |

## v0.1 Does Not Need

- AIプラットフォーム公式スコアのような表現。
- 完全自動の改善提案生成。
- 誤情報の完全自動判定。
- 課金、外部連携、定期実行、エクスポートジョブ。
- `extracted_claims` 独立テーブル。

## Implementation Notes

- `answer_score` の算出ルールはテストデータで調整する。
- `metric_snapshots` は `run_id`, `scope_type`, `scope_id`, `brand_id` の組み合わせで一意に近い形にする。
- 同じAI回答を再処理できるよう、`ai_conversations.raw_answer` と `answer_hash` を保存する。
- プロンプト文は編集されるため、実行時の `prompt_text_snapshot` を残す。
- AIモデル名も変わる可能性があるため、実行時の `model_snapshot` を残す。
- 表示用の日本語ラベルと内部enumは分ける。
