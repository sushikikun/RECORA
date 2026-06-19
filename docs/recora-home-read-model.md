# Recora Home Read Model Contract v0.1

Status: Draft for read model implementation  
Scope: `/dashboard` home read models only  
Out of scope: UI design, UI implementation, DB query implementation, schema changes, package changes

## 1. Purpose

`/dashboard` ホームは、選択した1レポートの詳細ではなく、Recora全体の通算状態と、安全に比較できる推移を見る場所です。

この仕様書では、ホームに表示する値を以下に分けます。

- `latestAggregateSummary`: 最新集計runに基づく最新状態。通算ではありません。
- `cumulativeHomeSummary`: 完了済みの有効観測を足し上げる通算集計。
- `trendHomeSummary`: 同一条件、または比較注意付きで比較可能な測定間の推移。

ホーム実装では、latest aggregate の値を通算値として表示してはいけません。比較条件が揃っていない値を1本の推移として表示してはいけません。通算として安全なもの、推移として安全なもの、レポート詳細に残すものを分けます。

## 2. Evidence Basis

この仕様は、以下の確認に基づきます。

- `lib/recora/db/dashboard.ts`: 現行のホーム取得は latest completed aggregate と latest standard-v01 measurement run に寄っています。
- `components/recora/report-pages.tsx`: 現行ホームViewModelは `metricSnapshots`、`counts`、`recommendations` からKPIを構成しています。
- `lib/recora/report-view-model.ts`: citation count と根拠確認、改善候補と承認済み施策を分ける注意文があります。
- `lib/recora/report-eligibility.ts`: valid observation、temporary report view、seed / failed / partial / parse error の扱いがあります。
- `lib/recora/db/runs.ts`: run履歴とrun単位のcount候補がありますが、現在は履歴上限があります。
- `lib/recora/db/sources.ts`: completed runをまたぐ参照元候補がありますが、ホーム用通算read modelではありません。
- `lib/recora/db/recommendations.ts`: 改善候補は latest standard-v01 measurement run 由来です。

現行コードで参照されているテーブルや列は `CONFIRMED_CODE` として扱います。ライブDB上の完全性、全期間性、RLS、index、実データの品質は `NEEDS_VERIFICATION` です。

## 3. Terms

### latestAggregateSummary

最新集計runに基づく値です。

- Source: latest completed `measurement_runs` where `metadata.run_kind = aggregate` and `metadata.data_source = openai_measurement`
- Usage: 最新レポート詳細、または「最新状態」の表示向き
- Not for: 通算表示、全期間の推移、条件不一致の比較

`latestAggregateSummary` は現在の状態を説明できますが、通算値ではありません。

### cumulativeHomeSummary

`completed + openai_measurement + valid observation` に基づく通算集計です。

- Source: completed measurement runs and valid observations across the selected aggregation period
- Usage: `/dashboard` ホーム
- Includes: 足し上げても意味が壊れにくい観測量
- Excludes: rate、順位、競合差分など、条件が混ざると意味が変わる値

`cumulativeHomeSummary` は、AI可視性や競合差分を通算化するものではありません。

### trendHomeSummary

同一条件または比較可能条件を満たす測定間の推移です。

- Source: comparable measurement buckets or snapshots
- Usage: `/dashboard` ホーム
- Required: comparability check、comparison caution、small sample warning
- Excludes: 条件が揃わない測定を1本の線として結ぶ表示

`trendHomeSummary` は、比較条件が揃わない場合は表示しないか、比較注意として扱います。

## 4. Read Model Boundary

ホーム用read modelは、現行 `getRecoraDashboardData` から責務を分離します。

```ts
type RecoraHomeReadModel = {
  latestAggregateSummary: LatestAggregateSummary | null;
  cumulativeHomeSummary: CumulativeHomeSummary | null;
  trendHomeSummary: TrendHomeSummary | null;
};
```

- `latestAggregateSummary` は最新状態です。通算ではありません。
- `cumulativeHomeSummary` は通算ホームの数値です。
- `trendHomeSummary` は比較可能な推移だけです。

既存のlatest aggregate KPIをそのまま `cumulativeHomeSummary` に流用してはいけません。

## 5. P0 cumulativeHomeSummary Fields

P0の通算ホームでは、足し上げても意味が壊れにくい観測量だけを扱います。

| Field | Label | P0 decision | Rule |
|---|---|---|---|
| `aggregationPeriod` | 集計対象期間 | P0 | 対象にしたcompleted measurementの最小開始日から最大終了日、または明示された期間 |
| `completedMeasurementCount` | 完了済み測定数 | P0 | `status = completed` かつ `data_source = openai_measurement` |
| `validObservationCount` | 有効観測数 | P0 | ai_conversation_id があり、failed / partial / parse error / provider error を除外 |
| `aiConversationCount` | AI回答観測数 | P0 | valid observation に紐づくAI回答数 |
| `brandDisplayObservationCount` | ブランド表示観測数 | P0 | valid observation 内で対象ブランドが表示された観測数。organic discoveryとは別扱い |
| `citationOccurrenceCount` | 参照として出現した数 | P0 | citation row または `occurrence_count` の扱いを固定してから集計。根拠確認済み数ではない |
| `citationUrlCount` | 参照URL数 | P0 | displayable URLを重複排除。canonical URLが使える場合は正規化後 |
| `sourceDomainCount` | 参照ドメイン数 | P0 | displayable domainを重複排除 |
| `recommendationCandidateCount` | 改善候補数 | P0 | 表示可能な改善候補数。承認済み施策数ではない |
| `dataCautionFlags` | データ注意 | P0 | seedあり、少数観測、比較注意、parse error除外など |

P0での `recommendationCandidateCount` は、承認済み施策数ではありません。`review_required`、`machine_generated`、`open`、`display_decision=show` は「確認中」または「表示候補」として扱います。

## 6. P0 trendHomeSummary Fields

P0の推移は、count系のみを優先します。現行 `db/dashboard.ts` からは安全な推移として直接出せないため、専用read functionで比較可能条件を満たすbucketだけを返します。

| Candidate | Decision | Current implementation status | Safety rule |
|---|---|---|---|
| `completedMeasurementCountTrend` | P0 | NEEDS_VERIFICATION | 完了済み測定数の期間別count。比較条件が違っても「測定量の推移」としては表示可 |
| `validObservationCountTrend` | P0 | NEEDS_VERIFICATION | valid observation gateを各bucketに適用 |
| `brandDisplayObservationCountTrend` | P0 | NEEDS_VERIFICATION | 表示観測数の推移。率やorganic discovery断定にはしない |
| `citationOccurrenceCountTrend` | P0 | NEEDS_VERIFICATION | 参照出現数の推移。根拠確認済み数ではない |
| `citationUrlCountTrend` | P0 | NEEDS_VERIFICATION | 参照URL数の推移。URL正規化と重複排除が必要 |
| `sourceDomainCountTrend` | P0 | NEEDS_VERIFICATION | 参照ドメイン数の推移。`.example` を除外 |
| `recommendationCandidateCountTrend` | P1 | NEEDS_VERIFICATION | generatorやquality gateの条件変更で増減し得るためP0では出さない |
| `aiVisibilityTrend` | P1 | NEEDS_VERIFICATION | 同一measurement profile / prompt set / search mode / provider条件で比較可能な場合のみ |
| `competitiveGapTrend` | P2 | NEEDS_VERIFICATION | 条件正規化または同一比較ブランド集合が確認できる場合のみ |

P0推移は「観測量の推移」を中心にします。AI visibilityやcompetitive gapは、条件不一致ならP0に入れません。

## 7. P0 Home Exclusions

以下はP0ホームに出しません。

- 通算AI可視性
- 通算AI表示率
- 通算競合差分
- 通算平均順位
- 通算参照率
- 条件不一致のAI visibility推移
- 条件不一致の競合差分推移
- 根拠確認済み引用数
- 承認済み改善施策数
- 売上、CV、検索順位改善への効果
- latest aggregate由来のKPIを通算と見せる表示
- 比較条件が違うrunを1本の推移としてつなぐ表示

## 8. P1 Fields

P1では、比較条件の管理と状態別集計を追加します。

- 同一measurement profile内のAI可視性推移
- 同一prompt set内のブランド表示観測数推移
- 参照URL/ドメインの推移
- 改善候補の状態別件数
- profile / prompt set version別の比較可能性表示
- comparability status
- seed contamination risk
- trend pointごとのdata quality badge

## 9. P2 Fields

P2では、正式report schemaやreview workflowを前提にした高度な集計を扱います。

- 正式report schemaベースの通算レポート数
- source-to-claim review済み件数
- evidence review状態別の根拠確認数
- non-seed discovery queryだけに限定した organic visibility
- 条件正規化済みの競合差分トレンド
- 業界ベンチマーク
- 施策効果推定

## 10. Aggregation Rules

P0集計条件は以下です。

- `metadata.data_source = openai_measurement`
- `measurement_runs.status = completed`
- failed / partial / cancelled / error / timeout を除外
- parse error を除外
- provider error を除外
- `ai_conversation_id` がある観測だけを valid observation とする
- seedされたブランド/競合は organic discovery として扱わない
- `.example` domain / URL は通常表示対象から除外する
- citation count は source-to-claim support の証明ではない
- provider status は証拠品質ではない
- raw response、raw IDs、raw metadata、provider errorをホーム表示に出さない

`validObservationCount` の判定は `lib/recora/report-eligibility.ts` の `isValidObservation` と整合させます。ただし、実DBのどの列から `parse_status` と `provider_error` を読むかは `NEEDS_VERIFICATION` です。

## 11. Trend Comparability Rules

推移表示条件は以下です。

- 同一measurement profile
- 同一prompt setまたはprompt set version
- 同一search mode
- 同一provider / model、または比較注意付き
- 同一language / region
- 同一対象ブランド
- 競合差分の場合は同一比較ブランド集合
- 条件が違う場合は trend として結ばない
- 条件が一部違う場合は comparison caution を必ず表示
- valid observation が少ない場合は small sample warning を表示

count系の推移でも、測定条件の変更が数値の増減に影響する場合は comparison caution を表示します。

## 12. Source Candidates

現行コード上の候補ソースを以下に整理します。いずれもライブDB上の完全性と全期間集計可否は `NEEDS_VERIFICATION` です。

| Source | Candidate use | Confirmed from code | Needs verification |
|---|---|---|---|
| `measurement_runs` | 完了済み測定数、期間、profile、search mode、aggregate判定 | `dashboard.ts`, `runs.ts`, `sources.ts` が参照 | live schema、metadata keyの一貫性、全期間取得、RLS |
| `run_items` | valid observation母数、prompt/persona/model紐づけ、失敗除外 | `runs.ts`, `sources.ts` が参照 | parse statusの所在、error除外条件、skipped扱い |
| `ai_conversations` | AI回答観測数、provider/search mode、citation status | `runs.ts`, `sources.ts`, `types.ts` が参照 | response_id/providerの十分性、raw response非表示保証 |
| `brand_mentions` | ブランド表示観測数、表示位置、言及数候補 | `runs.ts`, `types.ts` が参照 | seed影響、mention_count列の利用可否、alias誤検出 |
| `citations` | 参照出現数、URL数、domain数、supports_claim状態 | `dashboard.ts`, `runs.ts`, `sources.ts` が参照 | occurrence_countの集計単位、URL正規化、supports_claim review状態 |
| `source_domains` | domain重複排除、source type候補 | `sources.ts`, `types.ts` が参照 | trust_labelを証拠品質に見せない制御、domain正規化 |
| `recommendations` | 改善候補数 | `dashboard.ts`, `recommendations.ts` が参照 | latest run限定の解除、状態別件数、quality gate状態 |
| `metric_snapshots` | latestAggregateSummary、P1以降の比較可能trend候補 | `dashboard.ts`, `runs.ts` が参照 | comparability key、profile version、prompt set version、同一条件判定 |

## 13. Report Detail Boundary

以下はホームではなく、選択した1レポートの詳細側に残します。

- AI回答の個別ログ
- レポート単位のAI可視性、AI表示率、AI言及数
- レポート単位のブランド比較
- レポート単位の競合差分
- 参照元のURL別詳細
- citationごとの根拠確認
- 改善候補の理由、根拠、次アクション
- 測定条件、prompt、topic、persona、modelの詳細
- failed / partial / QA / aggregate run の運用ログ

ホームは「全体の観測量」と「比較可能な推移」を見る場所です。レポート詳細は「選択した1レポートに閉じた解釈」を見る場所です。

## 14. Client-safe Wording

使える文言:

- 集計対象期間内の有効観測数
- 参照として出現した数です。根拠確認済み件数ではありません
- 改善候補数です。承認済み施策数ではありません
- 同一条件で比較可能な測定のみを推移として扱います
- 測定条件が異なるため、単純比較には注意が必要です
- この推移は観測上の変化であり、改善施策の効果を保証するものではありません
- seedを含む測定は、organic discoveryの証拠として扱いません
- 少数観測のため、追加測定で傾向が変わる可能性があります

## 15. Dangerous Wording

避ける文言:

- 通算AI表示率
- 根拠確認済み引用数
- AIに引用される保証
- 承認済み施策
- 競合に勝っています
- この改善でCVが上がります
- AI可視性が改善しました
- 通算順位
- 公式GEOスコア
- AIプラットフォーム公式評価
- provider success が確認できたため証拠品質が高い

特に、条件不一致なのに「AI可視性が改善しました」と断定する表現は禁止します。

## 16. Implementation Order

次に実装する場合は、以下の順序にします。

1. `latestAggregateSummary` / `cumulativeHomeSummary` / `trendHomeSummary` の型を作る。
2. DB read functionを `latestAggregateSummary` と分離して作る。
3. P0通算項目だけを返す。
4. P0推移項目は比較可能条件を満たすものだけ返す。
5. `/dashboard` ViewModelに接続する。
6. その後に `recora-visual-design-director` でホームデザインを一新する。

実装時は、最初にread modelのテストデータと除外条件を固定します。UI接続は、通算と推移の値がlatest aggregateと混ざらないことを確認してから行います。

## 17. Done Criteria

- `docs/recora-home-read-model.md` が作成されている
- 必要な場合のみ `docs/recora-display-contract.md` に参照追記されている
- UI、DB、schema、packageは未変更
- commit / push はしていない
- `npm run typecheck` が実行されている
- `npm run lint` が実行されている
