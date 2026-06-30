# Recora Report Metric Contracts

Status: Development draft / initial proposal
Scope: Metric definitions for the 7-tab Recora report proposal
Last updated: 2026-07-01

## Overview

このドキュメントは、Recoraレポート7タブで使う主要指標の定義、分子、分母、対象prompt scope、除外ルールを整理する初期案です。実装前にDB項目、既存read model、既存集計ロジックとの照合が必要です。

重要な原則は、visibility / ranking / Share of Voice と、sentiment / brand_perception を混ぜないことです。AI表示率やSOVは主にnon-branded promptを対象にし、branded promptはブランド認識、感情、注意書き、語られ方の確認に寄せます。

このdocsは `docs/recora-metric-contract.md` を置き換えるものではありません。7タブ仕様に必要な指標を、実装前の検討単位として拡張整理するものです。

## Prompt scope rules

### `prompt_type` 初期案

| prompt_type | 用途 | 主な利用 |
|---|---|---|
| `non_branded` | 対象ブランド名やaliasを含まない発見・比較前の質問 | visibility / ranking / SOV |
| `branded` | 対象ブランド名やaliasを含む確認質問 | sentiment / brand_perception / caveat |
| `comparison_generic` | ブランド名を指定しない一般比較質問 | visibility / ranking / SOV候補 |
| `comparison_named` | 対象ブランドや特定ブランドを含む比較質問 | ranking/SOVからは原則除外 |
| `competitor_named` | 競合名を起点にした質問 | 競合分析・証拠確認 |
| `citation_check` | 引用や参照元確認用の質問 | citation_validation |

### `measurement_purpose` 初期案

| measurement_purpose | 用途 |
|---|---|
| `visibility` | AI回答内に自社が出るかを見る |
| `ranking` | 回答内で自社・競合がどの順序で出るかを見る |
| `sov` | 自社と競合を含む露出シェアを見る |
| `sentiment` | ブランド言及の評価トーンを見る |
| `brand_perception` | ブランドの語られ方、印象、誤解を確認する |
| `citation_validation` | 引用元、参照URL、source-to-claim確認に使う |
| `recommendation_input` | 改善候補生成の入力として使う |

### 重要ルール

- visibility / ranking / SOV は `non_branded` promptを主対象にする。
- branded prompt は sentiment / brand_perception / caveat / narrative 用に扱う。
- `comparison_named` / `competitor_named` は visibility / ranking / SOV に混ぜない。
- comparison promptに対象ブランド名やaliasが含まれる場合は visibility / ranking / SOV対象外にする。
- knownCompetitors がある時だけ競合名入りcomparison promptを検討する。
- 根拠なしに競合名を生成しない。
- `citation_check` は引用確認用として分離し、ranking evidenceには混ぜない。
- 未承認のproject setup draftはmeasurement readyにしない。
- provider error、timeout、blocked、failed run itemをブランド非表示の根拠にしない。

## Metric contracts

### 1. AI表示率 / AI presence rate

- Definition: 有効promptのうち、自社ブランドがAI回答に言及された割合。
- Numerator: 自社ブランドが言及された有効prompt数。
- Denominator: 対象scope内の有効prompt数。
- Prompt scope: 原則 `non_branded` + `visibility` purpose。
- Required data: valid prompt/run item、AI回答、brand mention判定。
- Exclusions: `branded`、`comparison_named`、`competitor_named`、`citation_check`、failed/partial/error observations。
- UI usage: T01 KPI、T03/T04詳細。
- Notes / open questions: prompt-level presenceで数える。言及回数とは分ける。

### 2. Share of Voice / SOV

- Definition: 自社と競合を含むブランド露出全体のうち、自社露出が占める割合。
- Numerator: 自社ブランド露出量。
- Denominator: 自社 + 対象競合ブランド露出量。
- Prompt scope: 原則 `non_branded` + `sov` purpose。
- Required data: 自社・競合のbrand mention、対象brand set、valid observation。
- Exclusions: branded prompt、対象ブランド名入りcomparison、citation_check、failed/partial/error observations。
- UI usage: T01 KPI、T02比較、T04 prompt別。
- Notes / open questions: 露出量をmention countで数えるかprompt-level presenceで数えるかは要確認。初期案ではprompt-level presenceの方が説明しやすい。

### 3. ブランドランキング / brand ranking

- Definition: 対象ブランド群をSOVまたはAI可視性スコアで順位化したもの。
- Numerator: ブランドごとのSOVまたはvisibility score。
- Denominator: なし。
- Prompt scope: `non_branded`。
- Required data: target brand、competitor brand set、SOVまたはvisibility score。
- Exclusions: scope不一致、brand set不一致、branded-only prompt。
- UI usage: T01、T02。
- Notes / open questions: UI上でranking basisを明示する。SOV rankとvisibility rankを混同しない。

### 4. プロンプト別順位 / prompt-level rank

- Definition: 特定promptのAI回答内で、自社ブランドが何番目に言及または推薦されたか。
- Numerator: なし。
- Denominator: なし。
- Prompt scope: `ranking` purpose。
- Required data: answer text、brand mention spans、competitor mention spans、extracted position。
- Exclusions: branded promptを通常のranking KPIに混ぜない。failed/partial/error回答は除外。
- UI usage: T04 prompt table、T05 position/recommendation badge。
- Notes / open questions: 回答内の単純な言及順と、推薦順位は異なる可能性がある。初期は言及順ベース、将来はrecommendation order抽出を検討する。

### 5. 回答内掲載位置 / answer position

- Definition: AI回答内でのブランド掲載位置。
- Values: `top` / `middle` / `bottom` / `missing` / `unknown`
- Numerator: なし。
- Denominator: なし。
- Prompt scope: `visibility` / `ranking` purpose。
- Required data: answer text position、mention offset。
- Exclusions: provider error、empty answer、prompt echoのみの一致。
- UI usage: T05 position badge。
- Notes / open questions: 数値順位より、営業デモでは `top` / `middle` / `bottom` / `missing` の方が伝わりやすい。

### 6. 引用シェア / citation share

- Definition: 全引用のうち、特定所有者タイプまたは自社ドメイン引用が占める割合。
- Numerator: 対象 `owner_type` またはdomainのcitation count。
- Denominator: 全citation count。
- Prompt scope: `citation_validation` / visibility補助。
- Required data: citation URL、domain、owner_typeまたはdomain mapping。
- Exclusions: URLなし、domain未正規化、example/sample/local-only source。
- UI usage: T06、T02引用差分。
- Notes / open questions: 引用数ベースかprompt presenceベースかをUIで明示する。

### 7. 自社ドメイン引用率 / owned domain citation rate

- Definition: AI回答で引用されたソースのうち、自社ドメインが含まれる割合。
- Numerator: 自社ドメインが引用されたprompt数またはcitation数。
- Denominator: 有効prompt数または全citation数。
- Prompt scope: `citation_validation` / `non_branded` visibility補助。
- Required data: citation URL、domain、owned domain mapping。
- Exclusions: domain不明、URLなし、source owner未確認。
- UI usage: T01補助、T06、T07。
- Notes / open questions: prompt-level と citation-level の2種類があるため、初期はprompt-levelを推奨する。

### 8. 競合ドメイン引用 / competitor domain citation

- Definition: 競合所有ドメインがAI回答の引用元として使われた数または割合。
- Numerator: competitor owner_type/domainのcitation countまたはprompt count。
- Denominator: 全citation countまたは有効prompt数。
- Prompt scope: `citation_validation` / `non_branded`。
- Required data: citation URL、domain owner mapping、competitor brand/domain mapping。
- Exclusions: owner不明を競合扱いしない。
- UI usage: T02、T06。
- Notes / open questions: competitor domain mappingの管理方法が必要。

### 9. 所有者タイプ分類 / owner type classification

- Definition: 引用元URL/domainを `owned` / `competitor` / `third_party` / `unknown` に分類する。
- Numerator: なし。
- Denominator: なし。
- Prompt scope: citation関連全般。
- Required data: domain mapping、brand/domain ownership。
- Exclusions: unknownを無理に分類しない。
- UI usage: T06 owner type chips、T07 source action。
- Notes / open questions: 既存の `source_type` と新しい `owner_type` の関係は要確認。

### 10. ソース鮮度 / source freshness

- Definition: 引用元ページがどれくらい新しい/古いか、または更新日が確認できるか。
- Numerator: 鮮度条件を満たすsource count。
- Denominator: 鮮度確認対象source count。
- Prompt scope: citation関連全般。
- Required data: page metadata、observed published/updated date、crawl/extraction timestamp。
- Exclusions: 日付未取得を古いと断定しない。
- UI usage: T06 freshness badge、T07 source freshness improvement。
- Notes / open questions: 新規抽出が必要。初期は「取得不可」「不明」「古い可能性」程度でもよい。確定日付を捏造しない。

### 11. 感情ラベル / sentiment label

- Definition: AI回答内でのブランド言及の感情・評価トーン。
- Values: `positive` / `neutral` / `negative` / `mixed` / `unknown`
- Numerator: sentiment別のブランド言及回答数。
- Denominator: sentiment判定対象のブランド言及回答数。
- Prompt scope: `branded`、`brand_perception`、`sentiment` purpose。
- Required data: sentiment extraction、evidence span。
- Exclusions: visibility / ranking / SOVには混ぜない。
- UI usage: T01 summary、T02 comparison、T05 evidence、T07 improvement。
- Notes / open questions: 根拠本文ハイライトを必須に近づける。

### 12. 注意書き率 / caveat rate

- Definition: ブランド言及回答のうち、注意書き・制約・要確認表現が含まれる割合。
- Numerator: 注意書き付きブランド言及回答数。
- Denominator: ブランド言及回答数。
- Prompt scope: `brand_perception` / `branded` / ranking detail。
- Required data: caveat labels、evidence spans。
- Exclusions: provider warningやUI警告をAI回答内caveatとして混ぜない。
- UI usage: T01 warning summary、T05 caveat badge、T07 caveat improvement。
- Notes / open questions: 注意書き分類の粒度は要確認。

### 13. ブランドの語られ方 / brand narrative

- Definition: AI回答内でブランドがどの特徴・文脈・印象で説明されているか。
- Numerator: narrative label別の回答数または代表phrase count。
- Denominator: narrative判定対象のブランド言及回答数。
- Prompt scope: `branded` / `brand_perception` / ranking detail。
- Required data: narrative labels、key phrases、evidence spans。
- Exclusions: 根拠spanなしの断定。
- UI usage: T02 narrative comparison、T05 answer evidence、T07 narrative improvement。
- Notes / open questions: スコア化より、初期はキーフレーズと代表文で見せる。

### 14. ペルソナ別強弱 / persona performance

- Definition: persona単位でのvisibility / SOV / rank / gapを比較したもの。
- Numerator: persona内の対象metric値。
- Denominator: persona内の有効promptまたは対象brand set。
- Prompt scope: visibility/SOV/rankingでは `non_branded`。
- Required data: prompt persona metadata。
- Exclusions: personaが未承認draft由来ならmeasurement readyにしない。
- UI usage: T03 persona scorecard。
- Notes / open questions: persona metadataの保存場所は要確認。

### 15. 用途別強弱 / use-case performance

- Definition: use_case単位でのvisibility / SOV / rank / gap。
- Numerator: use_case内の対象metric値。
- Denominator: use_case内の有効promptまたは対象brand set。
- Prompt scope: visibility/SOV/rankingでは `non_branded`。
- Required data: prompt use_case metadata。
- Exclusions: 未承認draft、scope不明prompt。
- UI usage: T03 use-case matrix。
- Notes / open questions: use_caseをprompt metadataとして持つか、topic taxonomyとして持つか要確認。

### 16. 検討フェーズ別強弱 / funnel-stage performance

- Definition: funnel_stage単位でのvisibility / SOV / rank / gap。
- Example values: `awareness` / `consideration` / `comparison` / `decision` / `retention`
- Numerator: funnel_stage内の対象metric値。
- Denominator: funnel_stage内の有効promptまたは対象brand set。
- Prompt scope: visibility/SOV/rankingでは `non_branded`。
- Required data: prompt funnel_stage metadata。
- Exclusions: branded-only prompt。
- UI usage: T03 funnel stage table。
- Notes / open questions: buyer_stageとの用語統一が必要。

### 17. トピックカバレッジ / topic coverage

- Definition: 対象topicのうち、計測promptが存在し、有効回答があるtopicの割合または一覧。
- Numerator: 有効回答があるtopic数。
- Denominator: 対象topic数。
- Prompt scope: topic coverage全般。
- Required data: topic metadata、prompt mapping、valid observation。
- Exclusions: 未承認topic、measurement対象外topic。
- UI usage: T03 topic coverage bar。
- Notes / open questions: topicの粒度とcategoryとの関係は要確認。

### 18. トピックギャップ / topic gap

- Definition: topic内で、競合は出ているが自社が出ていない、または自社順位が弱いprompt群。
- Numerator: gap条件を満たすprompt数。
- Denominator: topic内の有効prompt数。
- Prompt scope: `non_branded` / `visibility` / `ranking`。
- Required data: topic metadata、brand mentions、competitor mentions、ranking。
- Exclusions: branded prompt、failed/partial/error observations。
- UI usage: T03 topic gap list、T07 recommendations。
- Notes / open questions: gap条件をpresence basisにするかrank basisにするか要確認。

### 19. 競合は出るが自社が出ない質問 / competitor-only prompt

- Definition: 有効promptで対象競合が言及され、自社ブランドが言及されない質問。
- Numerator: competitor-only prompt数。
- Denominator: 対象scope内の有効prompt数。
- Prompt scope: `non_branded` / `visibility` / `ranking`。
- Required data: brand mention、competitor mention、prompt scope。
- Exclusions: competitor_named、comparison_named、failed/partial/error observations。
- UI usage: T04 prompt gap cards、T07 action input。
- Notes / open questions: knownCompetitors外のブランドはdiscovered competitor候補として分ける。

### 20. 自社は出るが弱い質問 / weak own-brand prompt

- Definition: 自社ブランドは言及されるが、競合より下位、注意書き付き、引用が弱いなどの弱点がある質問。
- Numerator: weak conditionを満たすprompt数。
- Denominator: 自社ブランドが言及された有効prompt数。
- Prompt scope: `non_branded` / `ranking` / citation補助。
- Required data: brand mention、competitor mention、position、caveat、citation。
- Exclusions: caveatやcitationが未抽出の場合に断定しない。
- UI usage: T04、T07。
- Notes / open questions: 弱さの条件をUIで説明できる粒度にする。

### 21. AI対応度スコア / AI readiness score

- Definition: AIがサイトを取得・理解・引用しやすい状態かを示す補助スコア。
- Numerator: readiness条件を満たすcheck数。
- Denominator: readiness対象check数。
- Prompt scope: prompt scopeではなくsite/page audit scope。
- Required data: crawler audit、page accessibility、technical checks、content completeness。
- Exclusions: AI visibility / citation proofとして直接扱わない。
- UI usage: T07 technical improvement。
- Notes / open questions: 将来候補 / 別PR。初期では概要トップKPIにしない。

### 22. ブロックされたAIクローラー / blocked AI crawler

- Definition: 重要ページがAI bot / crawler / retrieval systemから取得できない可能性を示す項目。
- Numerator: blockedまたはblocked可能性のあるURL数。
- Denominator: 重要URL数。
- Prompt scope: site/page audit scope。
- Required data: crawler logs、robots、HTTP status checks、WAF/CDN behavior。
- Exclusions: 取得できないことを未確認で断定しない。
- UI usage: T07 technical issue card。
- Notes / open questions: 将来候補 / 別PR。確認済み/可能性/未確認を分ける。

## Exclusion rules

- failed / partial / timeout / provider error / empty response は absence、ranking、gap の根拠にしない。
- branded prompt は AI表示率、SOV、平均順位、競合gapの主指標に混ぜない。
- `comparison_named`、`competitor_named` は発見系visibilityやSOVから除外する。
- citation count は source-to-claim確認済み数ではない。
- source freshness不明を「古い」と断定しない。
- sentiment、caveat、narrative は根拠spanが弱い場合、顧客向けには要確認として扱う。
- recommendation candidateを承認済み施策として見せない。
- internal raw IDs、raw metadata、provider raw payload、API usage/cost、env値、secretsは顧客向け表示しない。

## Prompt Scope First-Class Types (2026-07-01)

PR #45 added code-level prompt scope contracts in `lib/recora/prompt-scope.ts`.

The local schema PR adds `supabase/migrations/20260701044743_recora_prompt_scope_fields.sql`. The migration file adds nullable `prompt_type` and `measurement_purpose` fields to `public.prompts` only, with check constraints aligned to `RecoraPromptType` and `RecoraMeasurementPurpose`. It does not backfill existing prompts and does not run Supabase writes.

Remote DB application and backfill planning for these fields is tracked separately in `docs/recora-prompt-scope-db-migration-plan.md`. Until that migration is explicitly applied remotely and rows are backfilled or materialized in later approved PRs, `prompt_type` and `measurement_purpose` remain unavailable for existing deployed rows that do not carry explicit recognized metadata.

Local migration status:

- Migration file: `supabase/migrations/20260701044743_recora_prompt_scope_fields.sql`
- Target table: `public.prompts`
- Added columns: `prompt_type`, `measurement_purpose`
- Constraints: `prompts_prompt_type_check`, `prompts_measurement_purpose_check`
- Remote apply: not executed
- Backfill: not executed
- Existing rows: unchanged / expected to remain `null` until a separate approved backfill or materialization step

First-class `RecoraPromptType` values:

- `non_branded`: 非指名
- `branded`: 指名
- `comparison_generic`: 一般比較
- `comparison_named`: 指名比較
- `competitor_named`: 競合名入り
- `citation_check`: 引用確認

First-class `RecoraMeasurementPurpose` values:

- `visibility`: 表示率
- `ranking`: ランキング
- `sov`: Share of Voice
- `sentiment`: 感情
- `brand_perception`: ブランド認識
- `citation_validation`: 引用確認
- `recommendation_input`: 改善候補入力

Eligibility rules now live in code helpers:

- `isVisibilityEligiblePromptScope`
- `isRankingEligiblePromptScope`
- `isSovEligiblePromptScope`
- `isSentimentEligiblePromptScope`
- `isBrandPerceptionEligiblePromptScope`
- `isCitationValidationPromptScope`

Only `status: "explicit"` scope can become metric eligible. `status: "missing"` and `status: "inferred"` are not eligible for visibility/ranking/SOV. This keeps text-based branded inference separate from official prompt metadata.

For this PR, visibility/ranking/SOV helpers accept only explicit `non_branded` scope with the matching `measurement_purpose`. `branded`, `comparison_named`, `competitor_named`, and `citation_check` are excluded from visibility/ranking/SOV. `comparison_generic` remains a first-class display type, but is not automatically eligible until a later DB/read-model contract can prove it is generic and brand/alias-free.

## Open decisions

- SOVをmention countで数えるかprompt-level presenceで数えるか。
- brand rankingのbasisをSOVにするかAI visibility scoreにするか。
- prompt-level rankを言及順で扱うかrecommendation order抽出で扱うか。
- sentiment labelの抽出方法と根拠表示。
- caveat分類の粒度。
- persona/use_case/funnel_stage/topicをDBに持つかdraft schema/read modelに持つか。
- `prompt_type` / `measurement_purpose` をfirst-class DB fieldにする時期。
- `prompt_type` / `measurement_purpose` migration and backfill details are tracked in `docs/recora-prompt-scope-db-migration-plan.md`.
- `source_type` と `owner_type` の用語・責務分担。
- recommendation review statusを顧客向けに見せるか。
- AI対応度をいつ独立機能にするか。
