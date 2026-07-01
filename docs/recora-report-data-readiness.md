# Recora Report Data Readiness

Status: Development draft / initial proposal
Scope: Data readiness inventory for the 7-tab Recora report proposal
Last updated: 2026-07-01

## Customer DB readiness audit update

Customer DB overall readiness is tracked in `docs/recora-customer-db-readiness-audit.md`. That audit organizes P0/P1/P2 priorities across organization/project boundaries, prompt metadata, measurement snapshots, RLS, publication state, source metadata, recommendation workflow, and plan linkage.

Prompt scope backfill remains paused at review-record state because `safe_explicit_candidate = 0` and `apply_candidate = 0`.

## Overview

このドキュメントは、Recoraレポート7タブ表示項目を実装する前に、どのデータが既存で使える可能性があるか、どれが派生可能か、どれが新規抽出・DB項目追加・将来連携を必要とするかを整理する棚卸しです。

今回はdocs-onlyです。remote DB write、migration、Supabase db push、本番DB write、外部API実行は対象外です。

このdocsでの「available」は、repo内docs、seed、コード上で概念やtable名を確認できたという意味です。live DB schemaやproduction dataの確認ではありません。実装前には実際のDB schema、RLS、read model、画面コード、集計ロジックとの照合が必要です。

## Readiness categories

| Category | 意味 |
|---|---|
| Existing likely available | repo内docs/seed/codeから存在または利用可能性を確認できる。live DB確認は別途必要。 |
| Derivable from existing data | 既存観測データからread modelや集計で出せる可能性がある。 |
| New metadata needed | prompt、topic、personaなどに追加metadataが必要。 |
| New extraction needed | AI回答本文や引用元から新しく抽出が必要。 |
| DB field likely needed | 継続運用やUI安定化にはfirst-class DB field化が必要になりそう。 |
| Future integration | 外部サービス、crawler、analytics、CMSなどの連携が必要。 |
| Internal only / needs decision | 顧客向け表示前にレビュー、品質ゲート、法務/表現確認が必要。 |

## Existing data likely available

repo内の既存docs、seed、read model、script参照から、以下のtable/概念は利用可能性が高いものとして扱います。ただし、live DB schemaの確定ではありません。

| Data | Readiness | 使える可能性があるタブ | Notes |
|---|---|---|---|
| `projects` | Existing likely available | T01 | project slug、表示対象、report scopeの基礎。 |
| `brands` | Existing likely available | T01/T02/T05 | 自社/競合は `brand_type` やmetadataで分ける想定。 |
| `personas` | Existing likely available | T03 | 既存概念はあるが、T03用の承認済みpersona metadataは要確認。 |
| `topics` | Existing likely available | T03/T04 | topic coverageの基礎。categoryとの関係は要確認。 |
| `prompts` | Existing likely available | T03/T04 | prompt textやtopic/persona紐づけの基礎。 |
| `ai_models` | Existing likely available | T05 | モデル別表示の基礎。 |
| `measurement_runs` | Existing likely available | T01 | run status、period、aggregate/source runの基礎。 |
| `run_items` | Existing likely available | T04/T05 | prompt x model x personaの実行単位。 |
| `ai_conversations` | Existing likely available | T05 | AI回答本文、prompt snapshot、model snapshotの基礎。 |
| `brand_mentions` | Existing likely available | T01/T02/T03/T04/T05 | mention、position、sentiment候補の基礎。 |
| `citations` | Existing likely available | T02/T05/T06/T07 | URL/domain、occurrence count、supports_claim候補の基礎。 |
| `source_domains` | Existing likely available | T06 | domain正規化と分類候補。 |
| `metric_snapshots` | Existing likely available | T01/T02/T03/T04 | dashboard/report表示用集計値。 |
| `recommendations` | Existing likely available | T01/T07 | 改善候補。承認済み施策ではなく候補として扱う。 |

`competitors` はfirst-class tableとしては要確認です。既存docsでは `brands` の `brand_type = primary | competitor` や競合config/sample dataとして扱われる可能性があります。T02では、実装前に競合の正本を `brands`、設定、または将来の `project_competitors` のどれに置くか確認します。

## Derivable from existing data

以下は、既存観測データからread modelまたは集計で出せる可能性がある項目です。docs段階では「実装済み」とは断定しません。

| Item | Derivation candidate | Main tabs | Notes |
|---|---|---|---|
| AI表示率 / AI presence rate | `brand_mentions.mentioned` distinct conversation/prompt count、または `metric_snapshots.ai_visibility` | T01/T03/T04 | non-branded scopeで再集計が必要。 |
| SOV | brand mention presence/count from target + competitors | T01/T02/T04 | mention countかprompt-level presenceか要確認。 |
| ブランドランキング / brand ranking | brand別SOVまたはvisibility score | T01/T02 | ranking basisをUIに表示。 |
| 競合SOV比較 | brand別SOV | T02 | brand setの一致が必要。 |
| 競合順位差分 | `brand_mentions.position` or aggregate rank | T02/T05 | 言及順と推薦順は分ける。 |
| プロンプト別可視性 | prompt/run itemごとのmention status | T04 | prompt metadataのscopeが必要。 |
| プロンプト別引用 | prompt/run itemごとのcitation count | T04/T06 | citation countは支持確認ではない。 |
| 参照元ドメインランキング | `citations.domain` aggregate | T06 | domain normalizationが必要。 |
| 参照元URL一覧 | `citations.url` / canonical URL | T06 | URLなし・example sourceは除外対象。 |
| 自社ドメイン引用率 | citation domain x owned domain mapping | T06 | owned domain mappingが必要。 |
| 競合ドメイン引用 | citation domain x competitor domain mapping | T02/T06 | competitor domain mappingが必要。 |
| 競合だけ引用されるURL | citation URL grouped by owner/brand relation | T06/T07 | owner_type分類が必要。 |
| 改善提案一覧 | `recommendations` with customer-visible/quality gate metadata | T01/T07 | 候補と承認済み施策を混同しない。 |

## New prompt metadata needed

T03/T04の精度を上げるには、prompt単位またはprompt set単位で以下のmetadataが必要です。一部は既存の `personas`、`topics`、`prompts` に近い概念がありますが、measurement readyな項目として扱えるかは要確認です。

| Metadata | 用途 | Tabs | Notes |
|---|---|---|---|
| `persona` | 顧客像別の強弱 | T03 | 未承認draft由来なら顧客向け表示は要確認。 |
| `use_case` | 用途・検討軸別の強弱 | T03 | BtoB/BtoCで分類粒度が変わる。 |
| `funnel_stage` | awareness/consideration/comparison/decisionなど | T03 | `buyer_stage` との用語統一が必要。 |
| `topic` | topic coverage/gap | T03/T04 | 既存topicとの粒度確認が必要。 |
| `category` | 補助軸 | T03 | 主役ではなく補助チャートとして扱う。 |
| `prompt_type` | branded/non_branded/comparison/citation_check分離 | T04 | visibility/SOV混入防止に重要。 |
| `measurement_purpose` | visibility/ranking/sov/sentimentなど | T04 | metric eligibilityの基礎。 |
| `prompt approval status` | draft/approved/retiredなど | T03/T04 | 未承認draftをmeasurement readyにしない。 |
| `measurement_ready` | 計測に使ってよいか | T03/T04 | operator contractかDB fieldか要確認。 |

## New extraction needed

以下はAI回答本文、引用元URL、source metadataなどから新しく抽出する必要があります。

| Extraction | 用途 | Tabs | Customer visibility |
|---|---|---|---|
| `sentiment_labels` | 感情比較、感情サマリー | T01/T02/T05/T07 | evidence span付きで要確認。 |
| `narrative_labels` | ブランドの語られ方 | T02/T05/T07 | inferred labelは顧客向け要確認。 |
| `caveat_labels` | 注意書き・制約 | T01/T04/T05/T07 | 表現リスクがあるため要確認。 |
| `position_labels` | top/middle/bottom/missing | T05 | mention offsetが必要。 |
| `recommendation_order` | 推薦順・ランキング | T05 | 単純言及順との違いに注意。 |
| `source_metadata` | title、published/updated、page type | T06/T07 | crawler/extractionが必要。 |
| `source_freshness` | ソース鮮度 | T06/T07 | 日付を断定しすぎない。 |
| `owner_type classification` | owned/competitor/third_party/unknown | T06 | unknownを無理に分類しない。 |
| `evidence_spans` | answer highlight、根拠確認 | T05/T07 | 顧客向けには重要。 |
| `claim/source relationship` | source-to-claim確認 | T05/T06/T07 | 未確認をfalse扱いしない。 |

## DB fields likely needed

以下は、継続運用や安定したUI表示にはDB field化または明示的なread model contractが必要になりそうな項目です。migrationは今回対象外です。

| Field candidate | Why needed | Possible owner |
|---|---|---|
| `prompt_type` | branded/non_branded/comparison/citation_checkを安定分離する | `prompts` or prompt set metadata |
| `measurement_purpose` | metric eligibilityを明示する | `prompts` or prompt set metadata |
| prompt persona metadata | T03 persona performance | `prompts`, `personas`, or mapping table |
| prompt topic metadata | T03 topic coverage/gap | `prompts`, `topics`, or mapping table |
| `recommendation review status` | T07 review queue、customer-visible判定 | `recommendations` metadata or review table |
| `recommendation grouping key` | 重複施策統合、Page Brief生成 | `recommendations` metadata |
| `source owner type` | T06 owner type classification | `source_domains` or citation read model |
| `source freshness metadata` | freshness badge、source improvement | source metadata table or crawl snapshot |

## Future integrations

| Integration | 目的 | Tabs | Notes |
|---|---|---|---|
| `crawler_audit` | site/page accessibility確認 | T07 | AI visibility proofとは分ける。 |
| AI対応度スコア / AI readiness score | 技術改善候補 | T07 | 初期KPIにはしない。 |
| ブロックされたAIクローラー / blocked AI crawler | 取得不可の可能性確認 | T07 | 確認済み/可能性/未確認を分ける。 |
| GA4 / AI referral traffic | AI流入を見る | 将来 | 初期7タブには入れない。 |
| CV / demo request / revenue attribution | 成果接続 | 将来 | 外部連携と権限確認が必要。 |
| Slack notifications | アラート運用 | 将来 | 通知設計は別PR。 |
| CMS integration | Page Briefから実装へ接続 | T07将来 | CMS writeは別承認。 |
| PDF / shared link | レポート共有 | 将来 | 認証/権限/公開範囲が必要。 |

## Customer visibility review

以下は顧客向け表示前にレビューまたは明示的なガードが必要です。

| Item | Risk | Initial handling |
|---|---|---|
| recommendation review status | 承認済み施策に見える | 候補/確認中/要レビューを明示。 |
| AI対応度スコア | 技術監査の断定に見える | T07の将来候補に留める。 |
| ブロックされたAIクローラー | 取得不可を断定しやすい | 可能性/確認済み/未確認を分ける。 |
| source freshness | 日付や古さを誤表示しやすい | metadata取得済みのみ表示。 |
| negative sentiment | 表現が強くなりやすい | evidence span付きで要確認。 |
| caveat labels | 顧客不安を煽りやすい | 根拠と改善候補に接続。 |
| competitor-only sources | 競合優位を断定しやすい | 観測範囲内の差分として表示。 |
| inferred persona labels | 未承認の顧客像に見える | draft/approvedを分ける。 |
| inferred narrative labels | AIの印象を断定しやすい | 代表文・根拠spanを併記。 |

## Internal-only for now

- raw prompt generation details
- unapproved project setup draft
- internal measurement commands
- crawler audit debug details
- service role / environment details
- provider raw payload
- API usage / cost
- raw IDs and raw metadata
- internal QA comments
- pre-quality-gate recommendation candidates

## Suggested PR split

### PR 1: docs only

- report tabs spec
- metric contracts
- data readiness

### PR 2: report read model

- 既存DBから出せる項目だけ集約。
- UI skeletonやmigrationは混ぜない。

### PR 3: 7タブUI skeleton

- 既存データで表示可能なものだけ。
- 未実装データはsafe empty stateまたはfuture placeholderにする。

### PR 4: T03 metadata schema

- persona / use_case / funnel_stage / topic / category。
- draftとmeasurement readyの境界を明示。

### PR 5: `prompt_type` / `measurement_purpose`

- DB項目化が必要ならmigrationは別PRで明示確認。
- 既存heuristicからの移行条件を整理。

### PR 6: T05 evidence extraction

- position / narrative / sentiment / caveat labels。
- evidence spanと抽出versionを持つ。

### PR 7: T06 source owner / freshness

- owner_type / source freshness。
- unknown、不明、未取得を明示的に扱う。

### PR 8: T07 Page Brief / Action Plan

- recommendation grouping / review queue。
- DB保存は別判断。

## Prompt Scope Readiness Update (2026-07-01)

PR #45 added first-class code contracts for `prompt_type` and `measurement_purpose` in `lib/recora/prompt-scope.ts`.

The local schema PR adds `supabase/migrations/20260701044743_recora_prompt_scope_fields.sql`. It targets `public.prompts` only and adds nullable `prompt_type text` and `measurement_purpose text` columns with allowed-value check constraints. It does not backfill existing rows.

Current readiness rule:

- Existing prompt rows without explicit, recognized `prompt_type` remain `needs_metadata`.
- Existing prompt rows without explicit, recognized `measurement_purpose` remain `needs_metadata`.
- Unknown values are `partial` and cannot enter official metric eligibility until normalized.
- Text-based or heuristic inference is treated separately from official metadata and must not make a prompt eligible for visibility/ranking/SOV.

DB readiness after the local migration file:

- Local migration file added: `supabase/migrations/20260701044743_recora_prompt_scope_fields.sql`.
- Target table: `public.prompts` only.
- Added columns: `prompt_type`, `measurement_purpose`.
- Check constraints: `prompts_prompt_type_check`, `prompts_measurement_purpose_check`.
- No Supabase db push.
- No local or production DB write.
- No remote DB apply.
- No backfill.
- Existing remote rows remain unchanged. After a future remote apply, existing rows should remain `null` until a separate approved backfill or materialization step.
- T04 `needs_metadata` remains expected until remote apply and explicit metadata/backfill are handled in later PRs.
- Remote apply and backfill planning remains in `docs/recora-prompt-scope-db-migration-plan.md`; rows without explicit recognized metadata remain `needs_metadata`.

## Prompt Scope Backfill Dry-Run Update (2026-07-01)

The first customer DB completion PR adds a read-only operator check:

- `scripts/inspect-recora-prompt-scope-backfill.ts`
- `npm run recora:prompt-scope-backfill:dry-run`

This command inspects existing `public.prompts` rows and classifies them into:

- `already_explicit`
- `safe_explicit_candidate`
- `inferred_candidate`
- `manual_review`
- `leave_null`
- `invalid_existing_value`
- `missing_required_context`

Report readiness rule after this dry-run:

- `already_explicit` rows can be considered official only when both values are recognized.
- `safe_explicit_candidate` rows are candidates for a later human-approved backfill, not applied by this PR.
- `inferred_candidate` rows are review-only and must not enter visibility, ranking, or SOV eligibility.
- `manual_review`, `leave_null`, and `missing_required_context` rows remain `needs_metadata`.
- `invalid_existing_value` rows are blockers for automatic use until normalized.

The dry-run does not run UPDATE, INSERT, DELETE, migration, seed, repair, reset, or backfill apply. It does not change remote data and does not make any additional report tab customer-facing.

Review planning after PR #51 is tracked in `docs/recora-prompt-scope-backfill-review-plan.md`.

Readiness status after the dry-run:

- `public.prompts.prompt_type` and `public.prompts.measurement_purpose` exist, but the inspected rows remain null.
- `safe_explicit_candidate` is 0, so there is no automatic backfill path.
- `inferred_candidate` and `manual_review` rows require human review before any explicit values can be applied.
- Report UI should continue to expect `needs_metadata` for rows without explicit recognized values.

## Open questions

- 既存DB schema上、`ai_conversations` / `citations` / `brand_mentions` / `recommendations` がどの型で保持されているか。
- `competitors` をfirst-class tableにするか、`brands.brand_type = competitor` として扱うか。
- prompt metadataをどこに持たせるか。
- `prompt_type` / `measurement_purpose` persistence and backfill rules are planned in `docs/recora-prompt-scope-db-migration-plan.md`.
- draft generator出力とmeasurement ready dataの境界をどう切るか。
- source owner_typeの管理方法を `source_domains` に寄せるか、read modelに寄せるか。
- sentiment / caveat / narrativeをいつ抽出するか。
- source-to-claim確認をどのworkflowに置くか。
- AI対応度スコアをどのPhaseで扱うか。
- T07のreview queueを顧客向けにどこまで見せるか。
- 顧客向けPDF/shared linkで内部項目をどう落とすか。
