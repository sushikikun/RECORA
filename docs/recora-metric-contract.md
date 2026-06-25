# Recora Metric Contract

最終更新: 2026-06-25

この文書は、Recora 顧客向けレポートで使う主要指標の表示契約です。今回は計算式、eligibility、scope、snapshot key、DBロジックは変更しません。現在のコードで算出できないものは、画面で捏造せず `NEEDS_READ_MODEL` または `NEEDS_ANALYSIS` として扱います。

## 共通ルール

- 顧客向け名称は、画面とドキュメントで揃えます。
- `平均掲載順位` は `平均表示位置` と表示します。
- `言及比率` は `言及シェア` と表示します。
- 欠損時は `未計測`、`データなし`、`比較データなし`、`要確認` を使います。
- 品質状態は `sufficient`、`limited`、`insufficient`、`unavailable`、`incomparable` を内部候補として扱います。
- `参考値です`、`断定しません`、`正確とは限りません`、`可能性があります` は顧客画面の常用文にしません。

## 指標一覧

| 指標 | 顧客向け名称 | 一文定義 | 分子 | 分母 | 対象prompt | 対象AIモデル | 除外条件 | 欠損時表示 | 品質状態 | 主に表示するページ | 表示しないページ | 現在の実装可否 | NEEDS事項 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ai_visibility | AI表示率 | 観測AI回答のうち、対象ブランドが表示された回答の割合 | 対象ブランド表示回答数 | 有効観測数 | non-branded中心。brandedはブランド認知へ分離 | 計測対象モデル | failed / partial / error、比較scope外、無効観測 | データなし | sufficient / limited / unavailable | 概要、ブランド比較、ダッシュボード | ブランド認知の主指標としては表示しない | SUPPORTED_NOW | 比較可能推移は NEEDS_READ_MODEL |
| average_position | 平均表示位置 | 対象ブランドが表示された回答内での平均位置 | 表示された回答のposition合計 | 対象ブランドが表示された回答数 | non-branded中心 | 計測対象モデル | 未表示回答、positionなし、比較scope外 | 未計測 | sufficient / limited / unavailable | 概要、ブランド比較 | ブランド認知、改善候補の主KPI | SUPPORTED_NOW | label変更のみ |
| share_of_voice | 言及シェア | 同じ観測scope内のブランド言及全体に占める対象ブランドの比率 | 対象ブランド言及数 | 比較対象ブランドを含むブランド言及数 | non-branded中心 | 計測対象モデル | ブランド確認prompt、scope未分離、無効観測 | データなし | sufficient / limited / unavailable | 概要、ブランド比較 | ブランド認知の主KPI | SUPPORTED_NOW | label変更のみ |
| valid_observation_count | 有効観測数 | 集計対象として扱えるAI回答または観測の件数 | 有効なrun item / conversation | 実行された観測候補 | 全対象prompt | 全対象モデル | failed / partial / error、除外run、無効回答 | データなし | sufficient / insufficient / unavailable | 概要、一覧、ダッシュボード、tooltip | 独立した成果指標としての強調 | SUPPORTED_NOW | read modelの除外条件は変更しない |
| owned_citation_rate | 自社サイト引用率 | 参照出現または参照URLのうち自社サイトに紐づく比率 | 自社ドメイン参照出現数 | 全参照出現数 | citation check / non-branded | Web検索・引用取得対象モデル | citationなし、domain未正規化、source type不明 | 未計測 | sufficient / limited / unavailable | 概要、参照元 | AI回答ページの主KPI | SUPPORTED_WITH_UI_ONLY | source分類精度は NEEDS_VERIFICATION |
| citation_share | 引用シェア | 参照元domainまたはbrand別の引用出現比率 | 対象domainまたは対象source groupの参照出現数 | 全参照出現数 | citation check / non-branded | Web検索・引用取得対象モデル | URLなし、domain未正規化、重複未処理 | データなし | sufficient / limited / unavailable | 参照元、ブランド比較 | ブランド認知 | SUPPORTED_WITH_UI_ONLY | domain分類と重複排除は NEEDS_READ_MODEL |
| brand_perception | ブランド認知 | branded観測で、対象ブランドがどの表現・印象・誤認識で語られたか | 該当するbranded回答数 | branded有効観測数 | branded / reputation / sentiment | branded観測対象モデル | branded観測0件、sentiment未判定、品質metadataなし | 未計測 | sufficient / limited / insufficient / unavailable | ブランド認知 | 概要、ブランド比較の主KPI | SUPPORTED_WITH_UI_ONLY | 品質metadataと属性分類は NEEDS_READ_MODEL / NEEDS_ANALYSIS |

## Fixture 共通値

development `design-check` では、全ページで以下の値を統一します。

| 指標 | 値 |
|---|---:|
| AI表示率 | 57% |
| 有効観測数 | 1,200件 |
| 平均表示位置 | 2.4位 |
| 言及シェア | 36% |
| 自社サイト引用率 | 24% |
| 引用あり回答数 | 428件 |
| 改善候補数 | 3件 |
| 高優先度 | 1件 |

AI回答ページで一部だけ表示する場合は、「全1,200件中 1-50件を表示」のように表示件数として説明します。50件や100件を別のKPIとして扱いません。

## ページ別表示契約

| ページ | 表示する指標 | 表示しない指標 |
|---|---|---|
| レポート一覧 | レポート名、対象プロジェクト、測定期間、AI表示率、状態、最終更新 | 汎用4KPIグリッド |
| 概要 | AI表示率、有効観測数、平均表示位置、言及シェア、レポート状態 | 時系列グラフ、全AI回答、全参照元、全改善候補 |
| ブランド比較 | AI表示率、平均表示位置、言及シェア、引用シェア、強いカテゴリ | 自社サイト引用率の競合行表示、ブランド認知 |
| 質問別分析 | 表示有無、表示位置、引用有無、質問カテゴリ、AIモデル | branded / non-branded / citation check の内部名 |
| AI回答 | プロンプト、カテゴリ、対象AIモデル数、ブランド表示数、最良表示位置、引用有無、品質状態 | グラフ、参照元の詳細分析、ブランド感情分析 |
| 参照元 | 参照元構成、参照元ドメイン、種別、引用出現数、引用シェア、関連質問数、関連回答数、主なURL | 時系列グラフ、sparkline、未確認の「根拠確認済み」 |
| ブランド認知 | 印象構成、属性別評価、AIが使う表現、誤認識 | AI表示率、平均表示位置、競合順位 |
| 改善候補 | 改善候補数、高優先度、根拠確認、観測根拠、影響する質問、次に確認すること | publication state、customer_visible、効果予測 |

## 実装ギャップ

| 項目 | 状態 | 理由 |
|---|---|---|
| 質問 x AIモデル matrix | NEEDS_READ_MODEL | 現在の本番read modelではmatrix用の安定したprompt/model集約が不足 |
| prompt grouping | NEEDS_READ_MODEL | AI回答ページの本番Evidence-first groupingにはprompt単位の集約が必要 |
| AI回答drawer | NEEDS_READ_MODEL | 回答全文、参照URL、根拠確認をdrawer用に束ねる契約が不足 |
| 引用シェア | SUPPORTED_WITH_UI_ONLY | 参照出現ベースの表示は可能。厳密なURL正規化は追加確認 |
| source-to-claim | NEEDS_VERIFICATION | productionでは「要確認」を中心に表示 |
| 情報の鮮度 | NEEDS_READ_MODEL | source freshness metadataが揃うまで未計測または要確認 |
| ブランド属性別評価 | NEEDS_ANALYSIS | 独自スコアを作らず、該当回答数と割合が必要 |
| 誤認識 | NEEDS_ANALYSIS | risk finding / brand fact の紐づけが必要 |
| comparable run判定 | NEEDS_READ_MODEL | 同条件比較の確定条件が不足 |
| dashboardの推移 | NEEDS_READ_MODEL | 比較可能判定が整うまで「比較データなし」 |
| 対象ページ推定 | NEEDS_ANALYSIS | recommendation evidenceに対象URL根拠が必要 |
| recommendation evidence | SUPPORTED_NOW | 既存のcustomer_visible / publication判定を変更せず表示 |
