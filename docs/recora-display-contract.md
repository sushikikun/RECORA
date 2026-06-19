# Recora Display Contract v0.1

Status: Draft for UI implementation  
Scope: Recora dashboard, reports, measurement management, and client-facing AI search monitoring views

## 1. Purpose

このドキュメントは、Recora のAI検索モニタリング画面で「顧客に表示してよい情報」「内部運用に留める情報」「将来追加する情報」を固定する表示契約です。

Recora はAI検索での自社ブランド表示、競合との差分、参照元、改善候補を観測するBtoB SaaSです。画面では以下を分離します。

- クライアント向けレポート: 顧客に説明可能な snapshot
- 運用実行履歴: failed / partial / QA / aggregate run を含む運用ログ
- 内部レビュー: raw metadata、provider error、品質確認、保存判定のための内部情報

本契約はUI実装前の安全ラインであり、schema / pipeline / metric計算の仕様変更ではありません。

## 2. Information Architecture

サイドバーは以下を推奨します。

- 顧客 / プロジェクト
- ホーム
- レポート（未選択時は単体リンクで `/dashboard/reports` へ移動）
- 選択中reportIdがある時だけ、以下を折りたたまず表示
  - レポート概要
  - AI回答
  - ブランド比較
  - 参照元
  - 改善候補
  - ペルソナ
  - トピック・プロンプト
  - 比較ブランド
  - AIモデル
  - 実行履歴

用語ルール:

- 「全体 > 概要」と「全体 > 推移」は「ホーム」に統合する。サイドバーでは「概要」「推移」を分けない。
- ホームはレポート横断の数字、推移、全体傾向を見る場所とする。
- レポートは過去レポート一覧から1レポートを選択し、その詳細を見る場所とする。
- レポート未選択時は「レポート」単体リンクで一覧へ移動する。
- レポート概要 / AI回答 / ブランド比較 / 参照元 / 改善候補は、選択中reportIdがある時だけ折りたたまず表示する。
- ペルソナ / トピック・プロンプト / 比較ブランド / AIモデルは、レポート解釈・改善の設定項目として改善候補の下に表示する。
- citation count は根拠確認済み数ではない。
- 改善候補は承認済み施策ではない。
- 「インサイト」は使わず、「改善候補」を使う。
- 「測定条件」「根拠確認」は専用route作成後にレポート配下へ追加する。現時点のnavには出さない。
- 「新しい測定」「測定プロファイル」は現時点のnavには出さない。
- レポート一覧と実行履歴は分ける。
- データ品質は独立ページにせず、レポート概要と実行履歴内の section にする。

## 3. P0 / P1 / P2 の定義

### P0

初期リリースで必ず必要な表示契約です。顧客向け画面で誤解なく出せる情報に限定します。

- latest completed aggregate に基づくプロジェクトKPI
- report化済み snapshot
- valid observation のみから作るレポート表示
- ホームでのレポート横断の数字、推移、全体傾向
- 選択した1レポートに閉じたAI回答、ブランド比較、参照元、改善候補
- failed / partial run を trend / absence に混ぜない制御
- citation count と根拠確認を混同しない表示
- small sample warning

### P1

初期リリース後に追加する管理・精度改善領域です。

- 測定プロファイル管理画面
- レポート配下の測定条件専用route
- レポート配下の根拠確認専用route
- report entity / report snapshots の明示schema
- observation validity flags の永続化
- supports_claim のレビューworkflow
- comparability_key / prompt_set_version / profile_version
- data quality summary の構造化

### P2

将来の高度化です。

- 顧客別ベンチマーク
- 複数AI provider横断の品質比較
- 自動異常検知
- 改善候補の進捗管理
- content inventory / sitemap / CMS連携
- cost / usage の内部分析ダッシュボード

## 4. 表示権限

### client

顧客向け閲覧権限です。表示は report 化済み、または顧客説明可能な最新snapshotに限定します。

表示可:

- AI可視性（RECORA独自の観測指標）
- 観測上の差分
- AI回答 excerpt
- 参照として出現したURL/domain
- supports_claim の確認状態
- 改善候補
- small sample warning

表示不可:

- raw IDs
- raw metadata
- raw display_decision
- raw quality_score
- raw provider errors
- raw response payloads
- API usage / cost

### client_admin

顧客側の管理権限です。client 表示に加え、測定条件と実行状況を一部確認できます。

表示可:

- 測定条件
- prompt / topic / persona の表示用名称
- 実行履歴の成功/失敗/partial概要
- report化されていないrunの存在

表示不可:

- provider raw payload
- API keys / env values
- cost details
- internal QA comments

### internal

Recora運用者向けです。debug / QA / pipeline確認のために raw に近い情報を扱えます。

表示可:

- raw run IDs
- raw metadata
- raw provider errors
- response payload references
- API usage / cost
- display_decision / quality_score / risk_flags
- failed / partial の詳細

ただし、internal 情報を client 画面へ流用してはいけません。

## 5. run と report の違い

### run

run は測定や集計の実行ログです。運用品質のために failed / partial / QA / aggregate run も保持します。

run に含むもの:

- measurement run
- run items
- ai conversations
- citations
- brand mentions
- aggregate run
- metric snapshots
- failed items
- provider / pipeline metadata

run は運用ログであり、そのまま顧客向けレポートではありません。

### report

report は顧客に提示できるように整理された snapshot です。valid observation と completed aggregate を基準に構成します。

report に含むもの:

- report period
- measurement profile / prompt set
- valid observation count
- project KPI
- brand comparison
- AI answers
- sources
- evidence review
- improvement candidates
- caveats

### P0の暫定report view

現行DBには正式な report schema がありません。そのためP0では、正式な report schema ができるまで、latest completed openai_measurement aggregate を「暫定report view」として扱います。

暫定report view は正式な report entity ではなく、UI表示用の view model です。completed measurement run や completed aggregate は report 表示の必要条件ですが、十分条件ではありません。

顧客向けに表示するには、以下のgateを通す必要があります。

- valid observation gate
- small sample warning gate
- comparability gate
- data quality gate
- seed / sample / .example 除外gate
- failed / partial / parse error 除外gate

暫定report view は、P1で正式な report schema が導入された時点で report entity / report snapshot へ移行します。

## 6. report化条件

P0 では以下を満たす run だけを report 化できます。

- project が明確である
- measurement profile または測定条件が識別できる
- metadata.data_source = openai_measurement
- run_kind = aggregate
- status = completed
- completed measurement run である
- aggregate run が completed である
- source measurement run と aggregate run の対応が確認できる
- valid observation が1件以上ある
- failed run item が absence / trend の根拠から除外されている
- failed / partial / parse error が absence / trend の根拠から除外されている
- seed / sample / .example が通常表示対象から除外されている
- seedを含む測定の場合、organic discoveryの証拠として扱わない注意文を出す
- report period が明確である
- small sample warning が必要な場合に表示される

report化しないもの:

- failed run
- partial runのみ
- QA run
- seed run
- sample fallback
- aggregateのみで source measurement run が不明なもの

## 7. valid observation の定義

valid observation は、顧客向けmetricやreport表示に使える観測単位です。

P0条件:

- run_item.status が completed 相当
- ai_conversation が存在する
- provider response が保存されている
- prompt / topic / persona が解決できる
- search_mode が明確
- seed / sample 由来ではない
- .example URLを通常表示対象に含まない
- 対象projectに紐づく

valid observation から除外:

- failed run item
- cancelled / timeout
- empty response
- provider errorのみ
- seed/sample run
- promptやprojectが解決できないもの

## 8. 指標の安全な表示ルール

### AI visibility

表示名:

- AI可視性（RECORA独自の観測指標）

表示可:

- valid observation における対象ブランドの明示出現割合
- report period / measurement profile / observation count

禁止:

- 公式GEOスコア
- AIプラットフォーム公式評価
- 「AIに評価されていない」
- failed item を absence として混ぜる

### mention count

表示名:

- AI言及数

表示可:

- valid observation 内のブランド言及数
- ブランド別内訳

注意:

- 言及数は好意的評価を意味しない
- provider success を品質保証扱いしない

### citation count

表示名:

- 参照回数

表示可:

- web-search observation で取得されたURL/domain数
- 参照として出現

禁止:

- citation count を根拠確認済み扱いする
- URL取得だけで supports_claim=true と表示する

### share of voice

表示名:

- AI回答内シェア

表示可:

- valid observation 内のブランド言及割合
- 同一profile / 同一prompt set の比較

注意:

- prompt set が違う比較では「比較注意」を表示する

### competitive gap

表示名:

- 観測上の差分

表示可:

- 対象ブランドと比較ブランドのAI可視性差分
- 同一report内の比較

禁止:

- 勝ち / 負け
- 競合に負けています
- 断定的な優劣表現

## 9. supports_claim の扱い

supports_claim は引用URLがAI回答内容の根拠として妥当かを示す確認状態です。

- `true`: 根拠として確認
- `false`: 根拠不十分
- `null`: 根拠確認は未確認

表示ルール:

- `null` を `false` 扱いしない。
- citation count と supports_claim は別の概念として表示する。
- 未確認の場合は「根拠確認は未確認」と表示する。
- supports_claim=true の場合も、公式保証や成果保証の表現はしない。

表示文言例:

- true: 根拠として確認
- false: 根拠不十分
- null: 根拠確認は未確認

## 10. failed / partial run を混ぜないルール

failed / partial run は、運用実行履歴には表示します。ただし、顧客向けの absence / trend / gap には混ぜません。

禁止:

- failed item を「ブランド非表示」と数える
- partial run を前回比較に混ぜる
- aggregate未完了のrunをreport KPIに使う
- QA runを通常reportに混ぜる

表示:

- 実行履歴では failed / partial / completed を明示する
- レポート概要では「除外された観測がある場合」の注意を出す

## 11. small sample warning のルール

以下の場合は small sample warning を表示します。

- valid observation が20件未満
- prompt数が5件未満
- search_modeが片方のみ
- topic / persona が限定的
- report同士のprompt setが異なる

推奨文言:

- 「今回の観測範囲では」
- 「少数観測のため、追加測定で傾向が変わる可能性があります」
- 「比較注意」

禁止文言:

- 「確実に改善します」
- 「必ず引用されます」
- 「公式に低評価」

## 12. comparability のルール

比較可能とみなす条件:

- 同一project
- 同一measurement profile
- 同一prompt set version
- 同一search mode構成
- 同一brand set
- 同等のvalid observation count
- report period が明確

比較注意を表示する条件:

- profileが違う
- prompt setが違う
- brand setが違う
- observation countの差が大きい
- failed / partialが多い
- supports_claim確認状態が大きく異なる

## 13. ページ別表示フィールド一覧

### 顧客/プロジェクト選択

Purpose:

- 表示対象の顧客/プロジェクトを明確にする。

P0 fields:

- 顧客名
- プロジェクト名
- 対象ブランド
- 比較ブランド数
- 最新report period
- 最新更新日時

P1 fields:

- プロジェクトステータス
- 権限ロール
- active measurement profile

internal-only fields:

- project_id
- client_id
- raw metadata

Safety notes:

- 顧客/プロジェクトセレクターは維持する。
- raw IDs は顧客画面に出さない。

Source candidates:

- clients
- projects
- brands
- latest report snapshot

### ホーム

Purpose:

- レポート横断の全体傾向、数字、推移を短時間で把握する。
- route は `/dashboard` とする。
- 旧「全体 > 概要」と「全体 > 推移」はここに統合し、サイドバーでは分けない。
- レポート詳細タブは表示しない。

P0 fields:

- AI可視性
- AI言及数
- 参照回数
- 観測上の差分
- 改善候補数
- 最新report period
- report化済みsnapshotの推移グラフ
- AI可視性推移
- AI言及数推移
- 参照回数推移
- 観測上の差分推移
- comparability warning
- small sample warning

P1 fields:

- 前回reportとの差分
- report化済み回数
- comparison confidence
- prompt set version
- profile version
- confidence band

internal-only fields:

- aggregate run id
- raw metric snapshot id
- raw quality_score
- failed run count by period
- raw aggregate ids

Safety notes:

- ホームは正式評価や成果保証ではなく、Recora独自の観測範囲における全体傾向として表示する。
- 選択した1レポートに閉じた内容はレポート詳細側で扱う。
- failed / partial run は混ぜない。
- 条件が違うreportを単純なtrendとして表示しない。
- partial runをtrendに混ぜない。

Source candidates:

- report snapshot
- report snapshots
- metric_snapshots
- recommendations
- measurement profile metadata

### レポート一覧

Purpose:

- 過去レポート一覧から1レポートを選択し、詳細閲覧へ進む。
- レポート未選択時のサイドバーでは「レポート」単体リンクとして表示する。
- レポート詳細メニューは、ここでレポートを選択した後に折りたたまず表示する。

P0 fields:

- report title
- period
- status
- measurement profile
- valid observation count
- summary KPI
- published/created date

P1 fields:

- report owner
- approval status
- report notes

internal-only fields:

- raw run ids
- raw metadata
- internal QA flags

Safety notes:

- 実行履歴と混ぜない。
- failed / partial run をreport一覧に出さない。
- ホームの全体傾向とは分け、個別report snapshotの一覧として扱う。
- レポート未選択状態では、レポート概要 / AI回答 / ブランド比較 / 参照元 / 改善候補をサイドバーに出さない。
- レポート未選択状態で「レポート > レポート一覧」のような一項目だけの折りたたみを作らない。

Source candidates:

- report snapshots
- completed aggregate runs

### レポート概要

Purpose:

- 選択した1レポートの結論、KPI、注意点を表示する。
- route は `/dashboard/reports/[id]` とする。
- サイドバーでは、選択中reportIdがある時だけ折りたたまず表示する。

P0 fields:

- report period
- measurement profile
- valid observation count
- AI可視性
- AI言及数
- 参照回数
- 観測上の差分
- 改善候補数
- data quality section
- small sample warning

P1 fields:

- comparability summary
- excluded observation count
- supports_claim coverage

internal-only fields:

- raw snapshot ids
- raw display_decision
- raw quality_score

Safety notes:

- RECORA独自の観測指標であることを明記する。
- 少数観測を強い結論にしない。

Source candidates:

- report snapshot
- metric_snapshots
- recommendations
- valid observation summary

### 測定条件

Purpose:

- reportがどの条件で作られたかを説明する。
- 専用route作成まではnavに出さない。必要な情報はレポート概要内のsectionとして扱う。

P0 fields:

- measurement profile label
- prompt count
- observation count
- search mode
- topics
- personas
- target brand
- comparison brands

P1 fields:

- prompt set version
- profile version
- model/provider summary

internal-only fields:

- raw prompt ids
- raw run item ids
- provider request payloads

Safety notes:

- prompt本文を出す場合は顧客に見せてよい表現だけにする。
- provider success を品質保証扱いしない。

Source candidates:

- prompts
- topics
- personas
- measurement_runs metadata
- run_items

### AI回答

Purpose:

- AI回答の観測内容を確認する。

P0 fields:

- prompt
- topic
- persona
- search mode
- AI回答 excerpt
- target brand mention status
- related brands
- citation count

P1 fields:

- answer classification
- misinformation risk label
- excerpt highlight

internal-only fields:

- raw response payload
- provider response id
- token usage
- raw errors

Safety notes:

- 回答excerptは必要最小限にする。
- failed responseをabsenceとして扱わない。

Source candidates:

- ai_conversations
- run_items
- brand_mentions
- citations

### ブランド比較

Purpose:

- 自社ブランドと比較ブランドの観測上の差分を表示する。

P0 fields:

- brand name
- brand type
- AI可視性
- AI言及数
- 参照回数
- 観測上の差分

P1 fields:

- share of voice
- topic別比較
- prompt別比較

internal-only fields:

- raw brand ids
- metric snapshot ids

Safety notes:

- 勝ち / 負け表現を使わない。
- 比較条件が違う場合は「比較注意」を表示する。

Source candidates:

- brands
- metric_snapshots
- brand_mentions

### 参照元

Purpose:

- AI回答に参照として出現したURL/domainを確認する。

P0 fields:

- domain
- URL
- title
- citation status
- search mode
- related prompt
- occurrence count

P1 fields:

- unique domain trend
- source category
- official / third-party label

internal-only fields:

- raw citation id
- raw source domain id
- .example domains

Safety notes:

- citation count を根拠確認済み扱いしない。
- .example は通常表示しない。

Source candidates:

- citations
- source_domains
- ai_conversations

### 根拠確認

Purpose:

- 引用URLが回答内容を支持しているかを確認する。
- 専用route作成まではnavに出さない。citation count とは別概念として扱う。

P0 fields:

- citation URL
- domain
- related prompt
- answer excerpt
- supports_claim status
- brand_related status
- review note

P1 fields:

- reviewer
- reviewed_at
- claim excerpt
- evidence excerpt

internal-only fields:

- raw review payload
- internal reviewer comments

Safety notes:

- supports_claim=null は「未確認」。
- false と null を混同しない。

Source candidates:

- citations
- ai_conversations
- evidence review metadata

### 改善候補

Purpose:

- 実測から見えた改善余地を、顧客に実行可能な単位で表示する。

P0 fields:

- title
- display category
- priority label
- confidence label
- status
- customer-facing caution
- evidence summary
- suggested next action

P1 fields:

- owner
- due date
- progress status
- linked content item

internal-only fields:

- raw display_decision
- raw quality_score
- raw risk_flags
- raw metadata

Safety notes:

- display_decision=show を承認扱いしない。
- 「インサイト」ではなく「改善候補」を使う。
- review_required / machine_generated / open は確定施策ではない。
- 顧客向けには「改善候補」「確認中」「根拠確認が必要」と表示する。
- 「推奨施策として確定」「承認済み」「実施すれば改善する」とは表示しない。
- display_decision=show は表示候補であって承認ではない。

Source candidates:

- recommendations
- recommendation metadata
- report snapshot

### レポート解釈・改善の設定項目

Purpose:

- ペルソナ / トピック・プロンプト / 比較ブランド / AIモデルを、選択レポートの解釈と改善候補の確認に使う設定導線として表示する。
- 新規routeは作らず、既存の `/dashboard/config/personas`、`/dashboard/config/topics-prompts`、`/dashboard/config/competitors`、`/dashboard/config/models` を使う。
- サイドバーでは改善候補の下、実行履歴の前に表示する。

P0 fields:

- persona labels
- topic / prompt labels
- comparison brand labels
- AI model labels

internal-only fields:

- raw prompt ids
- provider request payloads
- API keys / env values

Safety notes:

- これらはレポート解釈と観測条件の確認導線であり、改善候補の承認や成果保証ではない。
- provider success を品質保証扱いしない。
- prompt本文を出す場合は顧客に見せてよい表現だけにする。

Source candidates:

- personas
- topics
- prompts
- brands
- model configuration

### 新しい測定

Purpose:

- 新しい測定を設定する。
- 現時点ではnavに出さない。主導線は ホーム → レポート一覧 → 選択レポート詳細 とする。

P0 fields:

- project
- target brand
- comparison brands
- topics
- prompts
- personas
- search mode
- estimated observation count
- small sample warning

P1 fields:

- measurement profile selector
- profile version
- prompt set version
- dry-run preview

internal-only fields:

- raw prompt ids
- raw profile definition
- API execution details

Safety notes:

- 初期リリースではトピック/プロンプトをこの画面内に置く。
- 測定プロファイル管理はP1。

Source candidates:

- projects
- brands
- topics
- prompts
- personas

### 実行履歴

Purpose:

- 運用runを監査できるようにする。
- サイドバーでは、選択中reportIdがある時だけ表示する。

P0 fields:

- run type
- status
- started_at
- completed_at
- measurement profile
- prompt count
- run item count
- failed item count
- aggregate status
- report化有無

P1 fields:

- data quality summary
- excluded observation count
- retry action

internal-only fields:

- raw provider errors
- raw metadata
- API usage / cost
- raw response payload links

Safety notes:

- レポート一覧と混ぜない。
- failed / partial / QA / aggregate run は運用ログとして表示する。

Source candidates:

- measurement_runs
- run_items
- metric_snapshots

### 測定プロファイル P1

Purpose:

- 再現可能な測定構成を管理する。
- 現時点ではnavに出さない。P1で専用管理画面を作る。

P0 fields:

- 初期リリースでは独立ページにしない。

P1 fields:

- profile id
- display label
- prompt count
- expected observation count
- search mode
- prompt set version
- active status

internal-only fields:

- raw prompt ids
- profile metadata
- migration notes

Safety notes:

- P0では「新しい測定」内に測定条件を表示する。
- profile変更時は standard-v02 のようにversionを分ける。

Source candidates:

- measurement profile definition
- prompts
- topics
- personas

## 14. 顧客に出してはいけない内部フィールド

- raw display_decision
- raw quality_score
- raw risk_flags
- raw provider errors
- raw response payloads
- API usage / cost
- raw IDs
- raw metadata
- supports_claim=null をfalse扱いする表示
- env values
- API keys
- provider request payloads
- internal QA comments

## 15. client-safe wording

使う:

- AI可視性（RECORA独自の観測指標）
- 観測上の差分
- 参照として出現
- 根拠確認は未確認
- 改善候補
- 確認中
- データ不足
- 比較注意
- 今回の観測範囲では
- 追加確認する余地があります
- 根拠確認が必要
- 表示候補

使わない:

- 公式GEOスコア
- 勝ち / 負け
- 確実に引用される
- guaranteed visibility
- display_decision=show を承認扱い
- citation count を根拠確認済み扱い
- provider success を品質保証扱い
- AIに評価されていない
- 公式に低評価
- 必ず改善します
- 推奨施策として確定
- 承認済み
- 実施すれば改善する

## 16. P1で追加すべきschema/pipeline

P1 schema candidates:

- reports
- report_snapshots
- report_snapshot_metrics
- report_observations
- measurement_profiles
- prompt_set_versions
- observation_validity_flags
- evidence_reviews
- recommendation_review_states

P1 pipeline candidates:

- report build job
- observation validation job
- comparability check
- supports_claim review workflow
- data quality summary generation
- report publish workflow
- prompt set versioning

## 17. 実装順序

1. 表示契約をUI設計に反映する。
2. 顧客/プロジェクトセレクターを維持する。
3. 「ホーム」にレポート横断の数字、推移、全体傾向を統合する。
4. レポート未選択時は「レポート」単体リンクで一覧へ移動する。
5. 選択中reportIdがある時だけ、レポート概要、AI回答、ブランド比較、参照元、改善候補、レポート解釈・改善の設定項目、実行履歴を折りたたまず表示する。
6. 「インサイト」を「改善候補」に置き換える。
7. 測定条件、根拠確認、新しい測定、測定プロファイルは専用route作成までnavに出さない。
8. 実行履歴には failed / partial / QA / aggregate run を含め、選択中reportIdがある時だけ表示する。
9. report化条件を満たすものだけを顧客向けreportにする。
10. P1で測定プロファイル管理、report schema、supports_claim reviewを追加する。

## 18. UI実装前の確認queue

UI実装前に以下を確認します。

- 顧客/プロジェクトセレクターが消えていないか
- 「通算」表記が残っていないか
- 「インサイト」表記が残っていないか
- /dashboard や /dashboard/reports でレポート詳細タブが出ていないか
- /dashboard や /dashboard/reports で「レポート > レポート一覧」の一項目折りたたみになっていないか
- /dashboard/reports/[id] 配下でレポート詳細タブ、レポート解釈・改善の設定項目、実行履歴が折りたたまず出るか
- レポート一覧と実行履歴が混ざっていないか
- 根拠確認がcitation countと混同されていないか
- 改善候補が承認済み施策に見えていないか
- 測定条件、根拠確認、新しい測定、測定プロファイルがP0 navに出ていないか
- 測定プロファイル管理がP1扱いになっているか
- データ品質が独立ページ化されていないか
- failed / partial run が absence / trend に混ざらないか
- supports_claim=null が未確認として表示されるか
- citation count が根拠確認済み扱いになっていないか
- raw IDs / raw metadata / provider errors が顧客画面に出ていないか
- small sample warning が必要時に表示されるか
- comparability warning が必要時に表示されるか
- client-safe wording に反していないか
- latest standard-v01 / latest aggregate の解決条件が明確か
- aggregate run と source measurement run の結合条件が明確か
- openai_measurement 以外のrunを顧客向けレポートに混ぜていないか
- 暫定report viewから正式report schemaへ移行する条件が明確か
