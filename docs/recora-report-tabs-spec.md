# Recora Report Tabs Specification

Status: Development draft / initial proposal
Scope: Recora report screen tab architecture and display item candidates
Last updated: 2026-07-01

## Overview

このドキュメントは、Recoraレポート画面の7タブ構成を実装前の開発仕様たたき台として整理するものです。顧客向け公開仕様の最終決定ではありません。

Phase 1の管理者運用型デモとレポート改善に向けて、海外GEO / AEO / AI visibilityサービス調査で拾った表示項目をRecoraのレポート体験に合わせて再整理します。文中の項目は「初期案」「MVP候補」「将来候補」「要確認」を分けて扱います。

この仕様は、今後のUI実装、read model設計、DB項目追加判断、品質ゲート整理の参照資料です。UI実装、DB migration、remote DB write、本番DB write、外部API実行、認証、課金、法務対応、顧客向けセルフサーブSaaS化は今回の対象外です。

関連する既存docs:

- `docs/recora-dashboard-report-experience.md`
- `docs/recora-display-contract.md`
- `docs/recora-metric-contract.md`
- `docs/recora-data-model.md`

## Scope

- レポート画面の7タブ構成を定義する。
- 各タブの目的、ユーザーが答えたい問い、初期表示項目、二次表示項目、将来候補、UI部品案、注意点を整理する。
- 指標定義やデータ準備状況の詳細は、別docsの `docs/recora-report-metric-contracts.md` と `docs/recora-report-data-readiness.md` に分ける。
- 既存DBで利用可能な可能性がある項目と、新規抽出・DB項目追加・将来連携が必要な項目を混ぜない。
- 顧客向け表示可能な項目と、内部向けまたは要確認の項目を分ける。

## Non-goals

- UI実装はしない。
- DB migrationはしない。
- Supabase db push、remote DB write、本番DB writeはしない。
- OpenAIなど外部API実行はしない。
- LP/Auth/handoff/public/package-lockは変更しない。
- 顧客向け公開仕様として確定した表現にはしない。
- AI検索での引用、推薦、順位、流入、売上改善を保証する表現にはしない。

## Tab architecture

| ID | タブ | 役割 | 主な問い |
|---|---|---|---|
| T01 | レポート概要 | レポート全体の結論と次の判断を見る | 今どういう状態か、次に何をすべきか |
| T02 | ブランド・競合 | 自社と競合の勝ち負けを比較する | どの競合に、どの指標で負けているか |
| T03 | ペルソナ・用途・トピック | 顧客像、用途、検討フェーズ、topic別の強弱を見る | どの文脈で弱いか |
| T04 | プロンプト・質問 | prompt単位の可視性、順位、引用、差分を見る | どの質問で負けているか |
| T05 | AI回答・ランキング | 実際のAI回答本文と扱われ方を確認する | 本当にどう答えられているか |
| T06 | 参照元・引用 | URL、domain、所有者分類、引用差分を見る | AIは何を根拠にしているか |
| T07 | 改善候補・施策 | 分析結果から次に直すものを決める | 何を作る、直す、確認するべきか |

## T01 レポート概要

### 目的

レポート全体の結論を最初に見るタブです。細かい分析ではなく、営業デモや初回確認で「今どういう状態か」「何が問題か」「次に何をすべきか」が一瞬で伝わる場所にします。

### ユーザーが答えたい問い

- AI上で自社は見えているか。
- 競合と比べて強いか弱いか。
- 今回の一番大きな問題は何か。
- 次に何をすべきか。
- このレポートはどの範囲、いつの実行結果か。

### 初期表示項目

- 総合AI可視性スコア / overall AI visibility score
- AI表示率 / AI presence rate
- Share of Voice / SOV
- ブランド順位 / brand ranking
- 重要インサイト / key insight
- 次の改善アクション / next action
- レポート範囲・実行状態 / report scope and run status

### 二次表示項目

- 感情サマリー / sentiment summary
- 注意書きサマリー / caveat summary
- 主要な勝ち/負け / key wins and losses
- プラットフォーム別サマリー / platform summary
- 前回比・主要変化 / trend and main changes

### 将来候補

- AI対応度サマリー / AI readiness summary
- AI流入サマリー / AI referral summary
- CV/売上サマリー / conversion or revenue summary
- アラートサマリー / alert summary

### UI部品案

- KPI card
- Summary hero
- Insight card
- Next action list
- Run metadata chip
- Warning badge
- Compact trend sparkline

### 注意点

AI対応度は有用ですが、初期概要の上段に置きすぎると技術監査ツールに見えやすくなります。初期案ではT07の技術改善候補に寄せ、T01では顧客がすぐ判断できるAI可視性、競合差分、改善候補を優先します。

## T02 ブランド・競合

### 目的

自社と競合の勝ち負けを比較するタブです。単なるブランド一覧ではなく、どの競合に、どの指標で、どの程度負けているかを見せます。

### ユーザーが答えたい問い

- 自社はカテゴリ内で何位か。
- 競合と比べてSOVは高いか低いか。
- どの競合が先に推薦されているか。
- どの競合が引用面で強いか。
- AIは自社と競合をどう語り分けているか。

### 初期表示項目

- ブランドランキング / brand ranking
- 競合SOV比較 / competitor SOV comparison
- 競合順位差分 / competitor ranking gap
- 競合引用差分 / competitor citation gap
- 競合優位・自社弱点 / competitor advantage and own weakness
- ブランドの語られ方比較 / brand narrative comparison
- 感情比較 / sentiment comparison

### 二次表示項目

- 競合可視性比較 / competitor visibility comparison
- 競合先行推薦 / competitor-first recommendation
- 競合共起・同時言及 / competitor co-mention
- Head-to-head比較
- 真の競合検出 / discovered competitor
- 新規競合検出 / new competitor detection
- 競合変化 / competitor change
- AI想起候補集合 / AI recalled brand set

### 将来候補

- 新規出現ブランド検知 / new brand detection
- 競合変化アラート / competitor change alert
- 競合別改善シミュレーション / competitor-specific improvement simulation

### UI部品案

- Ranking table
- Comparison bar
- SOV stacked bar
- Gap table
- Competitor gap card
- Brand narrative comparison table
- Sentiment comparison chip

### 注意点

T02では「集計・比較」を主に見せます。実際の回答本文や証拠はT05 AI回答・ランキングに誘導します。競合先行推薦はT02では集計、T05では証拠として扱います。

## T03 ペルソナ・用途・トピック

### 目的

どの顧客像、用途、検討フェーズ、topicで強い/弱いかを見るタブです。カテゴリ推移は表示項目の一例であり、T03の主役は persona、use_case、funnel_stage、topic の強弱分析です。

### ユーザーが答えたい問い

- どのペルソナで自社が出ていないか。
- どの用途・検討軸で競合に負けているか。
- 導入判断、料金、評判、比較など、どの文脈で弱いか。
- どのトピックでカバレッジが不足しているか。
- どのペルソナ x トピックの組み合わせが改善優先か。

### 初期表示項目

- ペルソナ別強弱 / persona performance
- 用途別強弱 / use-case performance
- 検討フェーズ別強弱 / funnel-stage performance
- トピックカバレッジ / topic coverage
- トピックギャップ / topic gap
- ペルソナ x トピックヒートマップ / persona x topic heatmap

### 二次表示項目

- カテゴリ別可視性 / category visibility
- カテゴリ別SOV / category SOV
- カテゴリ推移 / category trend
- プラットフォーム別差分 / platform difference
- モデル別差分 / model difference
- 国・地域別強弱 / region performance
- トピック別引用 / topic citation
- トピック別感情 / topic sentiment

### 将来候補

- ペルソナ自動発見 / persona discovery
- 未開拓ペルソナ検出 / untapped persona detection
- 市場/地域別ローカライズ / market or region localization
- intent / demographics / region 連携

### UI部品案

- Persona scorecard
- Use-case matrix
- Funnel stage table
- Persona x Topic heatmap
- Topic coverage bar
- Topic gap list
- Filter chip
- Drilldown card

### 注意点

T03ではカテゴリを残しますが、主役にはしません。カテゴリ推移は補助チャートとして扱います。

Recoraのprompt設計では、BtoBとBtoCで文体・判断軸が異なるため、persona/use_case/funnel_stage/topicを明示的に扱える設計にします。

BtoBの例:

- 導入判断
- 比較検討
- 費用対効果
- 運用負荷
- セキュリティ
- 社内承認
- 既存ツール連携
- ベンダー選定

BtoCの例:

- 日常の悩み
- 自分に合うか
- 失敗したくない
- 口コミ・評判
- 料金
- 通いやすさ
- 初めて選ぶ不安
- 家族や子どもに合うか
- 近くで探す
- まず何を見るか

## T04 プロンプト・質問

### 目的

どの質問で勝ち負けが起きているかを見るタブです。T03より細かい粒度で、prompt単位の可視性、順位、引用、競合差分を確認します。

### ユーザーが答えたい問い

- どの質問で自社が出ているか。
- どの質問で競合だけが出ているか。
- どの質問で自社は出るが弱いか。
- どのpromptがvisibility/ranking/SOV対象か。
- どのpromptがsentiment/brand perception用か。
- どのpromptを改善候補に紐づけるべきか。

### 初期表示項目

- プロンプト一覧 / prompt list
- prompt type フィルタ
- measurement purpose フィルタ
- プロンプト別可視性 / prompt visibility
- プロンプト別SOV / prompt SOV
- プロンプト別順位 / prompt rank
- プロンプト別引用 / prompt citation
- 競合は出るが自社が出ない質問 / competitor-only prompt
- 自社は出るが弱い質問 / weak own-brand prompt

### 二次表示項目

- branded / non_branded 分類
- comparison分類
- citation_check分類
- プロンプト別感情 / prompt sentiment
- プロンプト別注意書き / prompt caveat
- プロンプト別回答詳細 / prompt answer detail
- 高意図プロンプト / high-intent prompt
- 購買・比較プロンプト / purchase or comparison prompt

### 将来候補

- 未追跡プロンプト発見 / untracked prompt discovery
- 競合起点プロンプト発見 / competitor-origin prompt discovery
- prompt search volume
- prompt demand
- prompt density
- prompt gap discovery

### UI部品案

- Prompt table
- Scope filter chip
- Purpose filter chip
- Prompt status badge
- Prompt gap card
- Query detail drawer
- Sortable metric column
- Evidence link

### 注意点

visibility / ranking / SOV の対象にできるpromptと、sentiment / brand perception用promptを混ぜません。現在のbranded判定がprompt text内のブランド名有無に依存している場合、正式には `prompt_type` / `measurement_purpose` のDB項目化またはread-model contract化が必要です。

## T05 AI回答・ランキング

### 目的

実際のAI回答本文と、回答内での自社・競合の扱われ方を確認する証拠タブです。集計ではなく、ユーザーが「本当にそう答えられているのか」を確認する場所にします。

### ユーザーが答えたい問い

- AIは実際に何と答えたか。
- 自社は回答内に出たか。
- どの位置で出たか。
- 競合より先に推薦されたか。
- どんな語られ方をしたか。
- 注意書きや制約が付いていないか。
- 感情は positive / neutral / negative / mixed のどれか。
- 根拠となる本文はどこか。

### 初期表示項目

- AI回答一覧 / AI answer list
- 回答内掲載有無 / answer presence
- 回答内掲載位置 / answer position
- 推薦順・推薦ランキング / recommendation order
- 回答本文確認 / answer text review
- エビデンスハイライト / evidence highlight
- ブランドの語られ方 / brand narrative
- 注意書き・制約 / caveat
- 感情ラベル / sentiment label

### 二次表示項目

- 強み・弱み抽出 / strength and weakness extraction
- AIモデル別回答 / model-specific answer
- プラットフォーム別回答 / platform-specific answer
- 回答比較 / answer comparison
- 回答の揺れ / answer volatility
- 競合先行推薦の本文確認 / competitor-first answer evidence
- 代表的なAI説明文 / representative AI description

### 将来候補

- claim確認 / claim validation
- 事実性確認 / factuality review
- source-to-claim判定
- hallucination risk
- answer volatility
- factual truth

### UI部品案

- Answer card
- Brand mention highlight
- Competitor mention highlight
- Position badge
- Recommendation rank badge
- Sentiment chip
- Caveat warning badge
- Evidence drawer
- Source-linked answer view

### 注意点

claim確認や事実性確認は重要ですが、source-to-claim判定が弱い間は強く出しすぎません。初期案では、本文ハイライトと引用元リンクで根拠確認できるUIに寄せます。

## T06 参照元・引用

### 目的

AI回答が何を根拠にしているか、どのURL・domainが引用されているかを見るタブです。単なるURL一覧ではなく、自社/競合/第三者の所有者分類、引用差分、ソース鮮度を見せます。

### ユーザーが答えたい問い

- AIはどのURLを参照しているか。
- 自社サイトは引用されているか。
- 競合サイトばかり引用されていないか。
- 第三者サイトで自社がどう扱われているか。
- 古い情報源が使われていないか。
- 競合だけが引用されるURLはどれか。
- どのソースを改善・獲得すべきか。

### 初期表示項目

- 参照元ドメインランキング / source domain ranking
- 参照元URL一覧 / source URL list
- 引用シェア / citation share
- 自社ドメイン引用率 / owned domain citation rate
- 競合ドメイン引用 / competitor domain citation
- 所有者タイプ分類 / owner type classification
- 競合だけ引用されるURL / competitor-only source
- ソース鮮度 / source freshness

### 二次表示項目

- 第三者ドメイン引用 / third-party domain citation
- 引用トピック / citation topic
- 引用一貫性 / citation consistency
- 所有者別引用 / owner type citation
- 所有者別時系列 / owner type trend
- URL/domain別グルーピング
- 監視対象URL・ページ / monitored URL or page
- 参照元取得可否 / source accessibility

### 将来候補

- 引用関係 / citation relationship
- ソース影響度 / source influence
- ソース品質・権威性 / source quality or authority
- source-to-claim
- crawler accessibility
- source freshness automation

### UI部品案

- Domain ranking table
- URL citation table
- Owner type chip
- Citation share chart
- Freshness badge
- Competitor-only source list
- Source detail drawer
- Citation topic tag

### 注意点

営業デモでは「弱い参照元」が一瞬で伝わることが重要です。URL一覧だけでなく、所有者タイプ分類を前に出します。

`owner_type` の初期案:

- `owned`
- `competitor`
- `third_party`
- `unknown`

`unknown` は無理に分類しません。citation countは根拠確認済み数ではなく、引用として観測されたURL/domainの出現情報として扱います。

## T07 改善候補・施策

### 目的

分析結果から、次に何を直すか、何を作るかを決めるタブです。単なるrecommendation一覧ではなく、Page Brief / Action Plan / Review Queue に近づけます。

### ユーザーが答えたい問い

- 次に何を改善すべきか。
- どのprompt / persona / topic / URLに効く施策か。
- 競合に負けている理由は何か。
- どのページを直すべきか。
- 新しく作るべきページやFAQは何か。
- 施策の優先度・インパクト・難易度はどうか。
- 施策を承認/却下/保留できるか。

### 構成ブロック

T07は初期案として4ブロックに分けます。

1. 改善提案一覧 / recommendation list
2. Page Brief
3. Action Plan
4. Review Queue

### 初期表示項目

- 改善提案一覧 / recommendation list
- 優先度付きアクション / prioritized action
- Page Brief
- Action Plan
- 施策インパクト / impact
- 実装難易度 / implementation effort
- 対象prompt / affected prompt
- 対象persona / affected persona
- 対象カテゴリ / affected category
- 対象URL / affected URL
- Review Queue

### 二次表示項目

- 施策レビュー状態 / review status
- 重複施策統合 / duplicate grouping
- 注意書き改善 / caveat improvement
- 語られ方改善 / narrative improvement
- ソース鮮度改善 / source freshness improvement
- 引用獲得アクション / citation acquisition action
- 競合差分起点の施策 / competitor-gap action
- 既存ページ改善 / existing page improvement
- 新規ページ作成 / new page creation

### 将来候補

- `approved` / `dismissed` / `pending` のDB保存
- task owner
- due date
- workflow
- CMS連携
- AI対応度スコア / AI readiness score
- ブロックされたAIクローラー / blocked AI crawler
- 技術改善 / technical improvement
- 構造化データ改善 / structured data improvement

### UI部品案

- Recommendation list
- Priority badge
- Impact/difficulty matrix
- Page brief card
- Action plan checklist
- Review status control
- Evidence link
- Target prompt chip
- Target persona chip
- Target URL chip

### Page Briefに含める項目

- 対象ページ種別 / page type
- 誰向けか / target audience
- 狙う質問 / target prompt
- 現状の負け理由 / current loss reason
- 必要セクション / required section
- 追加すべきFAQ / FAQ to add
- 引用されたい根拠 / evidence to make citable
- 関連する競合・参照元 / related competitor and source
- 成功指標 / success metric

### Action Planに含める項目

- task
- owner
- status
- due
- expected impact
- implementation effort
- evidence link
- affected prompts
- affected persona
- affected topic
- affected URL

### 注意点

DBにreview statusを保存する場合は別PRです。今回のdocsでは仕様案として整理するだけです。

Recommendation candidate、quality-gate review、published recommendationは分けて扱います。候補生成は公開判断ではなく、顧客向け表示には品質ゲートまたは人間レビューの扱いを明示する必要があります。

## Restored cross-tab items

以下4つは、独立タブ化せず、7タブ内の表示項目として戻します。

### 1. ブランドの語られ方 / brand narrative

配置:

- T02 ブランド・競合
- T05 AI回答・ランキング
- T07 改善候補・施策

意味:

AI回答の中でブランドがどのような特徴、文脈、印象で説明されているかを見る項目です。

UI:

- key phrase chip
- narrative summary
- answer text highlight
- competitor narrative comparison
- narrative improvement card

### 2. 注意書き・制約 / caveat

配置:

- T01 レポート概要
- T04 プロンプト・質問
- T05 AI回答・ランキング
- T07 改善候補・施策

意味:

AIがブランドを紹介する際に添える「ただし」「要確認」「限定的」などの不安材料です。

UI:

- warning badge
- caveat card
- caveat type chip
- affected prompt list
- improvement action card

### 3. 感情 / sentiment

配置:

- T01 レポート概要
- T02 ブランド・競合
- T04 プロンプト・質問
- T05 AI回答・ランキング
- T07 改善候補・施策

意味:

AI回答内でのブランド言及が `positive` / `neutral` / `negative` / `mixed` / `unknown` のどれに近いかを表す補助項目です。

UI:

- sentiment chip
- sentiment breakdown bar
- sentiment comparison table
- answer evidence highlight
- sentiment trend compact chart

注意:

感情はvisibility / ranking / SOVには混ぜません。branded prompt や brand perception 用promptで扱います。

### 4. AI対応度スコア / ブロックされたAIクローラー

配置:

- T06 参照元・引用
- T07 改善候補・施策

将来:

- 技術監査・AI対応度タブ

意味:

AIがサイトを読み取りやすいか、重要ページがAI bot / crawler / retrieval systemから取得可能かを見る補助指標です。

UI:

- AI readiness score card
- crawler access badge
- blocked URL table
- technical issue card
- remediation checklist

注意:

初期7タブでは上段KPIにしません。技術監査色が強いため、最初はT07の技術改善候補に留めます。

## Items intentionally not promoted to top-level tabs

### 感情・認識

- 独立タブにはしません。
- T02/T05/T07を中心に分散します。

### 推移・アラート

- 独立タブにはしません。
- 各タブ内の小チャート、バッジ、前回比として扱います。

### 設定・連携

- 分析タブにはしません。
- プロジェクト設定、レポート右上メニュー、内部運用画面に分離します。

### AI流入・成果

- GA4/CV/売上連携が必要なため将来候補です。
- 初期7タブには入れません。

### 技術監査・AI対応度

- 将来的には独立候補です。
- 初期はT07技術改善内に留めます。

### 広告・商品推薦

- ChatGPT Shopping / observed ads / sponsored placements などは将来候補です。
- 現時点のRecora本線には入れません。

## UI component vocabulary

| UI component | 用途 | 使うタブ | 表示する主なデータ | 注意点 |
|---|---|---|---|---|
| KPI card | 主要指標を短く見せる | T01 | AI表示率、SOV、ブランド順位 | サンプル不足や比較不可は必ず明示 |
| Summary hero | レポート全体の結論をまとめる | T01 | 重要インサイト、次の判断 | 顧客向け確定表現にしない |
| Insight card | 観測から読み取れる示唆を見せる | T01/T07 | 勝ち/負け、要確認点 | 根拠リンクを持たせる |
| Warning badge | 注意・制約を短く示す | T01/T05/T07 | caveat、small sample | 不安を煽りすぎない |
| Ranking table | ブランドやdomainを順位で見る | T02/T06 | rank、SOV、citation count | ranking basisを明示 |
| Comparison bar | 自社と競合の差分を見る | T02/T03 | visibility、SOV、citation gap | 比較条件が違う場合は警告 |
| SOV stacked bar | ブランド露出シェアを見る | T02 | SOV | mention countかprompt presenceかを明示 |
| Persona scorecard | persona別の強弱を見る | T03 | visibility、rank、gap | draft personaは顧客向け要確認 |
| Persona x Topic heatmap | 改善優先の組み合わせを見る | T03 | persona、topic、gap | 色だけで意味を伝えない |
| Topic gap list | topic内の不足を見る | T03/T07 | topic、prompt、競合差分 | category推移を主役にしない |
| Prompt table | prompt単位の観測を一覧化する | T04 | prompt、type、purpose、metrics | prompt textの表示可否に注意 |
| Scope filter chips | prompt scopeを切り替える | T04 | non_branded、brandedなど | scope混在を防ぐ |
| Purpose filter chips | metric purposeを切り替える | T04 | visibility、ranking、sentimentなど | sentimentをSOVに混ぜない |
| Answer card | AI回答本文を確認する | T05 | prompt、answer excerpt、mentions | raw responseの出しすぎに注意 |
| Evidence drawer | 根拠本文を掘る | T05/T06/T07 | answer span、citation URL | source-to-claim未確認を明示 |
| Brand mention highlight | 自社言及箇所を示す | T05 | mention span | prompt echoとの誤検出に注意 |
| Competitor mention highlight | 競合言及箇所を示す | T05 | competitor span | competitor aliasの確認が必要 |
| Position badge | 回答内位置を示す | T05 | top/middle/bottom/missing | 単純な言及順と推薦順を混同しない |
| Sentiment chip | 感情を短く示す | T02/T05/T07 | sentiment label | 根拠spanなしの断定は避ける |
| Caveat card | 注意書きの種類と根拠を見る | T05/T07 | caveat label、evidence span | 事実性確認とは分ける |
| Domain ranking table | 引用domainを比較する | T06 | domain、owner_type、count | citation countは支持確認ではない |
| URL citation table | 引用URLを確認する | T06 | URL、domain、prompt、count | URLの正規化が必要 |
| Owner type chips | 所有者分類を示す | T06 | owned、competitor、third_party、unknown | unknownを無理に分類しない |
| Freshness badge | ソース鮮度を示す | T06/T07 | published/updated status | 日付を捏造しない |
| Recommendation card | 改善候補を見せる | T07 | title、priority、evidence | 承認済み施策に見せない |
| Page brief card | ページ改善案をまとめる | T07 | target page、sections、FAQ | DB保存は別PR |
| Action plan checklist | 実行タスクに落とす | T07 | task、owner、status、due | workflow実装とは分ける |
| Review queue | 候補の承認/保留/却下を整理する | T07 | review status、risk、evidence | quality gateと公開判断を分ける |
| Impact/difficulty matrix | 優先度を判断する | T07 | impact、effort | スコアは内部仮説として扱う |

## Open decisions

- 7タブを既存routesにどう対応させるか。
- T01に置く総合AI可視性スコアの計算basisをどうするか。
- T02のブランドランキングをSOV basisにするか、AI visibility score basisにするか。
- T03の persona/use_case/funnel_stage/topic をDB first-class fieldsにするか、draft schema/read modelで扱うか。
- T04の `prompt_type` / `measurement_purpose` をいつfirst-class DB fieldにするか。
- T05の推薦順を単純な言及順で扱うか、recommendation order抽出を行うか。
- T06のowner type分類を `source_domains` で持つか、read modelで持つか。
- source freshnessをどの粒度で顧客向け表示するか。
- T07のreview statusを顧客向けに見せるか、内部レビュー専用にするか。
- AI対応度スコアをいつ独立機能にするか。
