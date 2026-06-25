# Recora Customer Report Product Spec

最終更新: 2026-06-25

この文書は、Recora の顧客向けレポートを「ある1回の計測時点の監査結果」として扱うための正本です。レポート詳細は単一計測の証拠、比較、参照元、改善候補を確認する場所であり、時系列や期間比較はメインの `/dashboard` に集約します。

## 顧客向けレポートの定義

顧客向けレポートは、公開可否の確認が済んだ計測結果だけを、社内共有しやすい粒度で整理した画面です。DB、measurement、recommendation 生成、report ready gate、customer_ready 条件はこの仕様では変更しません。

fixture は development かつ `design-check` の確認用レポートだけで使います。production では確認用レポートを一覧や通常レポートに混ぜません。

## 通常表示する7タブ

1. 概要
2. ブランド比較
3. 質問別分析
4. AI回答
5. 参照元
6. ブランド認知
7. 改善候補

各タブの役割:

| タブ | 役割 | 主役情報 |
|---|---|---|
| 概要 | 1回の計測結果の要点を見る | AI表示率、有効観測数、平均表示位置、言及シェア、モデル別/カテゴリ別の横棒、競合スナップショット、参照元構成 |
| ブランド比較 | 競合と比べた強弱を見る | ブランド別のAI表示率、平均表示位置、言及シェア、引用シェア、強いカテゴリ |
| 質問別分析 | 質問とAIモデルの組み合わせを見る | 質問 x AIモデルの表示有無、表示位置、引用有無 |
| AI回答 | 集計値の根拠となった回答を見る | プロンプト単位のEvidence-first一覧、回答要約、証拠リンク |
| 参照元 | 引用・参照された情報源を見る | Domain-firstの参照元構成、ドメイン表、URL、根拠確認、情報の鮮度 |
| ブランド認知 | branded観測での語られ方を見る | ブランド印象、属性別評価、AIが使う表現、誤認識 |
| 改善候補 | 次に確認する改善点を見る | finding-firstの候補一覧、観測根拠、影響する質問、次に確認すること |

## ブランド認知

ブランド認知は条件付き導線ではなく、常時表示する通常タブです。

状態表示:

| 内部状態 | 顧客表示 | 表示方針 |
|---|---|---|
| sufficient | badgeなし | 通常表示 |
| limited / insufficient | サンプル不足です | 内容は表示し、短いbadgeだけを付ける |
| unavailable / branded観測0件 | 未計測 | タブは表示し、ページ内でcompact stateを出す |
| data error | データなし | 架空値を出さず、取得不可として扱う |

任意の閾値は今回新設しません。既存quality metadata、sample quality、confidence、branded有効観測数の順に利用し、判断できない場合は `NEEDS_READ_MODEL` として扱います。

## 推移

推移、前回比較、期間比較はレポート詳細の独立タブから外し、メインの `/dashboard` に集約します。

`/dashboard` で表示する条件:

- 比較可能な同条件計測が2回以上ある。
- prompt set、measurement profile、対象AIモデル、対象prompt、集計scopeの比較可能性が確認できる。
- 比較条件が違うデータを1本の推移としてつながない。

比較可能なデータがない場合は、`/dashboard` に小さく「比較データなし」を表示します。補足は「同じ条件で計測した結果が2回以上になると変化を表示します。」に留めます。

レポート詳細では以下を表示しません。

- 意味のない単一線グラフ
- 架空の前回値
- 単発数値に付ける装飾sparkline
- 同じKPIグリッドの全タブ反復

既存 `/dashboard/reports/[id]/trends` は削除せず、互換routeとして `/dashboard#trends` へredirectします。

## 顧客向けタブから外すroute

以下は顧客向け通常タブから外します。

| route / 項目 | 方針 |
|---|---|
| 改善プラン | 改善候補へ統合 |
| 実行履歴 | 管理者向け。顧客ナビから非表示 |
| 技術監査 | 管理者向け、または改善候補の詳細根拠 |
| 購買基準 | 顧客通常タブから非表示 |
| 誤情報リスク | ブランド認知の「誤認識」へ統合 |
| コンテンツ機会 | 改善候補へ統合 |
| エクスポート | 独立タブではなくレポートヘッダー操作 |

既存routeは互換性維持のため削除しません。直接URLアクセス時は、既存の権限、report ready gate、production guard を維持した上で、redirect、管理者導線、または利用不可表示にします。

## コピー方針

計測で確認できた事実は明確に表示します。品質上の注意は短いbadgeで示し、長い免責文は通常画面に出しません。

使用する状態表示:

- サンプル不足です
- 比較データなし
- 未計測
- データなし
- 要確認
- 一部モデルのみ
- 一部プロンプトのみ

使用しない表現:

- 参考値です
- 断定しません
- 正確とは限りません
- 条件付きの参考値です
- 判断できません
- 可能性があります
- 効果保証ではありません

内部用語、publication state、customer_visible、pre_quality_gate、review_required、source-to-claim などは顧客向け画面にそのまま出しません。

## サンプル品質表示

サンプル品質は短いbadgeで表示します。KPIの観測数、分母、対象scopeは指標名横の `?` tooltip に移します。

`design-check` fixture ではブランド認知を `limited` として扱い、「サンプル不足です」を表示します。branded観測数は保持しますが、架空の強い割合や独自スコアは作りません。

## 表・グラフの基本方針

- 概要: ドーナツ、横棒、競合スナップショット、参照元の100%積み上げ棒。
- ブランド比較: inline bar と小さな比較表。自社行は薄いミントで強調。
- 質問別分析: matrix と一覧。詳細はdrawerへ寄せる。
- AI回答: グラフなし。プロンプト単位のEvidence-first一覧。
- 参照元: Domain-first。100%積み上げ棒、ドメイン表、URL詳細。
- ブランド認知: 100%積み上げ棒、属性別評価、表現、誤認識。
- 改善候補: finding-first一覧。未検証の効果予測は表示しない。

表は横スクロール前提にしません。列数を減らし、関連情報は同じセルへ統合し、URLはtruncate、長文は2〜3行clampにします。

## Admin / Customer の責務境界

Customer:

- 公開可否確認済みのレポートを見る。
- 1回の計測結果の証拠、比較、参照元、改善候補を確認する。
- データ不足はsafe stateとして見る。

Admin:

- 実行履歴、技術監査、report ready gate、customer_ready、customer_data、recommendation publication 判定を確認する。
- production DB、measurement、aggregate、recommendation生成ロジックを管理する。
- 顧客画面に出せない候補や内部状態を扱う。

## 実装可能性メモ

| 領域 | 状態 | メモ |
|---|---|---|
| 7タブ導線 | SUPPORTED_NOW | 既存routeを残して顧客ナビだけ整理可能 |
| `/trends` redirect | SUPPORTED_NOW | route互換として `/dashboard#trends` に誘導 |
| ブランド認知の常時タブ | SUPPORTED_WITH_UI_ONLY | productionの品質判定は既存metadata依存 |
| 質問 x AIモデル matrix | NEEDS_READ_MODEL | productionに静的sampleを出さない |
| prompt grouping | NEEDS_READ_MODEL | AI回答の本番groupingは観測構造の追加整備が必要 |
| source-to-claim | NEEDS_VERIFICATION | productionでは「要確認」中心 |
| dashboardの同条件推移 | NEEDS_READ_MODEL | 比較可能性判定が整うまで「比較データなし」 |
