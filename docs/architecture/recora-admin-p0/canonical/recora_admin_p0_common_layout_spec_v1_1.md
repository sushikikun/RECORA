# レコラ管理画面 P0 共通レイアウト仕様書

- 文書ID: `RECORA-ADMIN-P0-COMMON-LAYOUT`
- 版: `1.1`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 前提仕様:
  - `RECORA-ADMIN-P0-STATE-MODEL v2.1`
  - `RECORA-ADMIN-P0-READ-MODEL v2.0`
  - `RECORA-ADMIN-P0-AUTHZ-AUDIT v2.0`
- 対象: レコラ管理画面P0の共通shell、共通部品、共通操作
- 優先順位: 本仕様は、ページごとに作られた独自ナビゲーション、独自ステータス色、独自確認ダイアログ、独自テーブル、旧管理画面案より優先する

---

## 0A. v1.1 最終横断統合更新

共通レイアウトの画面責任・P0範囲はv1.0から変更しない。最終横断レビューにより、前提基盤を正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0へ更新する。

- 状態enumとcommand state effectは正式状態モデルv2.1を正とする。
- 表示code、件数、badge、facet、available command入力はread model v2.0を正とする。
- capability、scope、risk、command code、auditは権限・監査仕様v2.0を正とする。
- 正式routeと採用文書はcanonical manifest v1.0を正とする。

- 権限仕様の文書IDを`RECORA-ADMIN-P0-AUTHZ-AUDIT`へ統一した。

---

## 0. 今回の正式決定

共通レイアウトでは、次を正式に固定する。

1. 左サイドバーへ常時表示するのは、正式な8領域だけとする。
2. 顧客・プロジェクト・契約・お問い合わせなどの領域内移動は、サイドバーの常設階層ではなく、ページ内のローカルナビゲーションで行う。
3. scope selectorは権限を変更する機能ではなく、現在の閲覧権限内を絞り込む表示フィルターとする。
4. サイドバーバッジは選択中scopeと同じread snapshotから生成し、専門ページの件数と一致させる。
5. 全体Critical障害は、権限がある管理者に限り、選択中scopeとは別に上部バーへ表示できる。
6. `business_date`、タイムゾーン、read modelの鮮度を共通上部バーとページ内状態で明示する。
7. 権限のないnavigation・commandは無効表示ではなく、原則として返さず表示しない。
8. W2・W3操作はページごとの独自モーダルを作らず、共通確認フローを使用する。
9. W3操作は、直近15分以内のstep-up、影響表示、理由、明示確認、row version、idempotencyを共通部品で必須化する。
10. primary entityの詳細は独立URL、監査ログ・system event・finding・attemptなどの補助詳細はdrawerを基本とする。
11. 表の行内編集、公開候補・公開版の直接編集、read modelからの書き戻しは行わない。
12. P0ではグローバル全文検索、通知センター、保存済みビュー、ダッシュボード自由配置、表示密度切替、カスタムテーマを作らない。
13. 管理画面はデスクトップ運用を前提とし、正式な視覚確認対象を `1366×768` と `1440×900` に固定する。
14. MFA登録とCritical操作のstep-upは業務ページではなく、共通セキュリティフローとして扱う。サイドバー項目へは追加しない。

---

## 1. 目的

本仕様の目的は、8領域すべてで次を一貫させることである。

- 情報の位置
- scopeの見え方
- 業務日と現在時刻の区別
- 状態・注意度・安全な代替表示の表現
- 一覧、詳細、drawer、timelineの使い分け
- `available_commands` の表示方法
- W1・W2・W3操作の安全な実行
- loading、empty、stale、denied、errorの表現
- 1366×768でも判断と操作を阻害しない情報密度
- 権限外情報や件数を漏らさない表示境界

見た目を揃えるだけではなく、正式状態モデル、read model、権限・監査仕様をUIから破らないことを最優先とする。

---

## 2. 共通レイアウトの不変条件

### 2.1 正式状態をUIで再解釈しない

- 状態ラベル、tone、attention、safe fallbackはread modelのcodeを利用する。
- React component内でwrite modelの複数fieldを組み合わせて独自判定しない。
- raw enumをそのまま画面へ表示しない。
- 「要対応」「前回版維持」などをフォームから更新しない。

### 2.2 navigationは認可結果に従う

- role名でメニュー表示を決めない。
- routeの最低capabilityとeffective scopeで表示を決める。
- 子ページのいずれにも閲覧権限がない領域は、トップレベル項目ごと表示しない。
- UI非表示をセキュリティ境界にせず、routeとAPIでも再認可する。

### 2.3 同じ件数は同じsnapshotを使う

- タブ件数、一覧行、total、サイドバーバッジは、同じpredicate、scope、`read_snapshot_at` を使用する。
- サイドバーだけ別API・別SQLで独自集計しない。
- 未取得・集計不能を0件として表示しない。

### 2.4 危険操作はread freshnessへ依存する

- W2・W3の操作表示には、最新の `available_commands` と `expected_row_version` が必要。
- 対象詳細のfreshnessが `stale` または `unknown` の場合、W2・W3を実行開始しない。
- command endpointは、UI表示時の情報を信頼せずwrite modelを再検査する。

### 2.5 通常処理を承認待ちにしない

- 正常案件に承認ボタンを表示しない。
- 運用ホームへ正常案件の大量一覧を置かない。
- 人の対応画面は `AttentionWorkItem` または正式な領域別例外を基準にする。

### 2.6 ページ全体の横スクロールを作らない

- 1366×768と1440×900では、shellとmain pageに横スクロールを発生させない。
- 列数が多い表はtable container内だけ横スクロールを許可する。
- preview payloadは専用split layoutまたはfullscreen previewで表示する。

---

## 3. デザイン方針

### 3.1 画面の性格

管理画面は、顧客向けダッシュボードより少し高密度にする。ただし、監視ツールのように全情報を詰め込まず、次の優先順で表示する。

```text
1. いま危険か
2. 人の対応が必要か
3. 顧客への安全な表示は維持されているか
4. 自動処理はどこまで進んでいるか
5. 詳細な根拠・履歴
```

視覚方針:

- 白と淡いグレーを基本とする
- Recoraの深緑をブランド・active navigation・主要操作へ限定する
- danger、warning、info、success、neutralのsemantic toneを使用する
- 正常状態を大きな緑カードで過剰強調しない
- 影、グラデーション、装飾的なチャートを増やさない
- 重要な状態は色だけでなく、iconと文言でも示す
- 1画面のカード数を必要最小限にする

### 3.2 情報密度

P0では1種類の標準密度だけを提供する。

- 本文: 14px相当
- 補助情報: 12〜13px相当
- 表行: 48pxを基本
- filter control: 36〜40px
- navigation item: 40px
- 操作button: 36〜40px
- touch専用の大型UIにはしないが、keyboardとpointerの双方で操作可能にする

表示密度切替はP1以降とする。

---

## 4. 共通shell構造

### 4.1 component階層

```text
AdminRootLayout
├ AdminSessionBoundary
├ AdminMfaBoundary
├ AdminNavigationResolver
├ AdminShell
│  ├ AdminSidebar
│  ├ AdminWorkspace
│  │  ├ AdminContextBar
│  │  └ AdminPageFrame
│  │     ├ AdminPageHeader
│  │     ├ AdminLocalNavigation optional
│  │     ├ AdminPageNoticeArea
│  │     └ page content
│  ├ AdminOverlayHost
│  │  ├ AdminDetailDrawer
│  │  ├ AdminActionDialog
│  │  └ AdminStepUpDialog
│  └ AdminToastHost
└ route error boundary
```

### 4.2 shellの責任

`AdminShell` が管理するもの:

- 8領域サイドバー
- 現在routeとactive領域
- capabilityに基づくnavigation
- 選択中scope
- 現在の業務日・タイムゾーン
- ページ鮮度の共通表示領域
- 管理者メニュー
- 環境表示
- drawer、dialog、toastの重なり順

ページ固有componentが管理するもの:

- ページタイトルと説明
- local navigation
- filter・sort・pagination
- query data
- entity固有のsummary、table、detail
- ページで利用可能なcommand

---

## 5. 寸法とviewport

### 5.1 正式確認viewport

| viewport | 用途 |
|---|---|
| `1366×768` | 最低限の標準業務画面 |
| `1440×900` | 標準推奨画面 |

P0の管理業務はdesktopを前提とする。mobile専用UIは作らない。

### 5.2 shell寸法

| 部位 | 寸法 |
|---|---:|
| sidebar | 224px固定 |
| context bar | 56px |
| main horizontal padding at 1366 | 24px |
| main horizontal padding at 1440以上 | 32px |
| page max width | 原則なし。main幅を使用 |
| form max width | 920px |
| settings content max width | 1180px |
| right drawer | 520px、最大42vw |
| wide inspector drawer | 640px、最大52vw |

原則:

- sidebarのP0折りたたみ機能は作らない。
- mainには `min-width: 0` を必須とする。
- list/tableページはmain幅を使い切る。
- 長文フォームを画面幅いっぱいへ広げない。
- overlayはsidebarを覆わず、workspace上へ表示する。

### 5.3 縦方向

1366×768で次を同時に表示できることを目標とする。

- context bar
- page header
- local navigationまたはtab
- filter bar
- table header
- 7行以上の標準table row
- pagination control

固定ヘッダーを増やしすぎない。常時stickyにするのは次だけとする。

- sidebar
- context bar
- 長いtableのtable header
- 長いdetail pageで必要なcommand rail

---

## 6. サイドバー

### 6.1 正式な8項目

表示順を固定する。

1. 運用ホーム
2. 顧客管理
3. 測定管理
4. 品質・例外レビュー
5. 公開管理
6. 障害・監査
7. 利用量・コスト
8. 管理設定

sidebarへ顧客数、全プロジェクト数、正常件数は表示しない。

### 6.2 sidebar構造

```text
Recoraロゴ / 管理
環境badge

運用ホーム
顧客管理                 [問い合わせ件数]
測定管理                 [稼働中バッチ数]
品質・例外レビュー       [人の対応件数]
公開管理                 [公開固有件数]
障害・監査               [Critical/High障害数]
利用量・コスト           [重大未算定数]
管理設定                 [設定異常数]

管理者表示名
役割要約
ユーザーメニュー
```

### 6.3 領域内ページを常設展開しない

sidebarには次を常時展開しない。

- 顧客 / プロジェクト / 契約 / お問い合わせ
- 障害 / システム状態 / イベント / 監査ログ
- 管理者 / 通知 / AIモデルなどの設定項目

これらはlocal navigationで表示する。理由は次のとおり。

- 正式な8領域を維持する
- sidebarを長くしない
- capabilityによる子項目の出入りでnavigationが不安定にならない
- 1366×768でユーザー領域を常に表示できる

### 6.4 active状態

- active領域は左border、淡いbrand背景、太字の3要素で示す。
- 色だけでactiveを示さない。
- detail routeでも所属領域をactiveにする。
- `/admin/operations/*` はすべて「障害・監査」をactiveにする。
- `/admin/settings/*` はすべて「管理設定」をactiveにする。

### 6.5 capabilityによる表示

トップレベル領域は、その領域の最低1つのpage read capabilityがある場合だけ表示する。

例:

```text
顧客管理
= customer / project / contract / inquiry のread capabilityが1つ以上

障害・監査
= incident / system status / system event / audit のread capabilityが1つ以上

管理設定
= settings配下のreadまたはmanage capabilityが1つ以上
```

role名を直接参照しない。

### 6.6 badge

badgeは `SidebarBadge` を使用する。

| 状態 | 表示 |
|---|---|
| `display_count > 0` | 数字pill。99超は `99+` |
| `display_count = 0` | 非表示 |
| 集計unknown | `?` のneutral outline badge |
| staleかつcountあり | countをoutline表示し、tooltipで更新遅延を示す |

badge tone:

- 品質、公開、設定、問い合わせ: warningを基本
- Critical/High障害: danger
- 稼働中バッチ: infoまたはneutral
- 重大未算定: warning

正常を示すgreen badgeは使用しない。

---

## 7. 上部context bar

### 7.1 配置

context barはworkspace上部へ56px固定表示する。

左から次を配置する。

```text
Scope selector
現在の業務日
Timezone
Page freshness

右側:
全体Critical alert optional
環境表示 optional
管理者menu
```

sidebarの環境badgeと重複する場合、productionではsidebarだけ、非productionではcontext barにも強調表示してよい。

### 7.2 業務日表示

標準表示:

```text
業務日 2026/08/01
JST
```

原則:

- ブラウザ現在日ではなくread metadataの `business_date` を使用する。
- historical page filterで別日を選んでも、context barは「現在の業務日」として維持する。
- ページ固有の日付filterは「表示対象日」「期間」と明記する。
- timestamp tooltipは `YYYY/MM/DD HH:mm:ss JST` で表示する。

### 7.3 freshness表示

標準表示:

```text
更新 02:14:32
更新遅延
再計算中
状態不明
```

対応:

| freshness | 表示 |
|---|---|
| `fresh` | 更新時刻。neutral |
| `delayed` | 「更新遅延」。warning |
| `stale` | 「古い情報を表示中」。warning強調 |
| `unknown` | 「状態を確認できません」。dangerまたはneutral error |

ページが複数read modelを合成する場合、page headerには最も悪いfreshnessを表示し、個別sectionで原因を示す。

### 7.4 全体Critical alert

`system_status.read` またはglobal incident閲覧権限がある管理者に限り表示する。

- 選択中customer/project scopeとは別に、全体Critical障害を見落とさないための表示である。
- Criticalが0なら表示しない。
- clickで `/admin/operations/incidents` のCritical filterへ遷移する。
- 権限がない管理者には件数も存在も返さない。

P0では通知bellや通知センターを追加しない。

---

## 8. Scope selector

### 8.1 目的

scope selectorは、管理者が現在のpageで閲覧可能な範囲を絞り込むための共通filterである。

```text
認可scopeを拡張する機能ではない
role・scope assignmentを変更する機能ではない
```

### 8.2 選択値

```text
all_assigned
customer:<customer_id>
project:<project_id>
```

表示文言:

- `all_assigned`: すべての担当範囲
- customer: 顧客名
- project: 顧客名 / プロジェクト名

global scopeがあっても、UI文言は「全顧客」ではなく、対象領域に応じて「すべての対象」としてよい。

### 8.3 routeごとの候補

候補は現在routeの最低read capabilityと、そのcapabilityを付与したrole assignmentのeffective scopeから生成する。

例:

```text
顧客管理では顧客閲覧scopeが候補
品質画面では品質閲覧scopeが候補
原価画面では原価閲覧scopeが候補
```

ある領域で選べたprojectが、別領域で必ず選べるとは限らない。

### 8.4 route遷移時

- 遷移先でも選択scopeが有効なら維持する。
- 遷移先capabilityでは無効なら `all_assigned` へ安全に戻す。
- 戻した場合は「この画面では選択中の対象を表示できないため、担当範囲全体へ戻しました」とneutral noticeを出す。
- 権限外entity名はnoticeへ表示しない。

### 8.5 URL状態

推奨query:

```text
?scope=all
?scope=customer:<id>
?scope=project:<id>
```

要件:

- server側で毎回検証する。
- 不正または権限外scopeはfail-closedまたは `all_assigned` へ安全に正規化する。
- scope selectionをcache keyと `scope_fingerprint` へ含める。
- 別管理者のscope URLを開いても、権限を継承しない。

### 8.6 global control page

日次自動処理、AIモデル制御、管理者管理などglobal control pageでは、selectorを次のいずれかにする。

- 「全体設定」として固定表示
- context barからselector自体を非操作状態で表示

hiddenにしてcontextが急にずれるより、固定contextを表示する方を優先する。

### 8.7 badgeとの関係

sidebar badgeは、原則として選択中scopeを適用する。

これにより次を一致させる。

```text
sidebar count
= page tab count
= page list predicate
```

全体Critical障害だけは、権限がある場合にcontext barの別alertとして扱う。

---

## 9. Page frameとpage header

### 9.1 Page frame

```text
AdminPageFrame
├ breadcrumb optional
├ page header
├ local navigation optional
├ notice area
└ content
```

### 9.2 Page header構造

左側:

- breadcrumb
- page title
- 1行の補助説明
- entity ID、site URLなどの補助metadata optional

右側:

- primary command 最大1件
- secondary command 最大2件
- overflow menu

### 9.3 titleサイズ

| 種類 | 表示 |
|---|---|
| 領域トップ | 24px相当、semibold |
| entity detail | 22〜24px相当 |
| form / confirm | 22px相当 |
| section heading | 16〜18px相当 |

大きなmarketing見出しは使用しない。

### 9.4 entity detail header

最低限次を表示する。

```text
entity name
primary display state
customer / project context
stable short ID + copy
last activity
safe fallback label if applicable
available commands
```

主状態の横へsecondary flagを最大3件まで表示し、それ以上は「ほかN件」にまとめる。

### 9.5 command配置

- pageの主要目的に直結するW1/W2 commandをprimaryにできる。
- danger/W3 commandを通常のprimary buttonにしない。
- W3はoverflow内の「重要操作」groupへ分離する。
- 権限がないcommandをdisabled表示しない。
- state上利用不可のcommandも、原則として表示しない。
- step-upだけ不足しているcommandは表示してよく、click後にstep-upへ進める。

---

## 10. Local navigation

### 10.1 顧客管理

横tabまたはsegment navigation:

```text
顧客
プロジェクト
契約
お問い合わせ
```

### 10.2 測定管理

`/admin/measurements` 内のtab:

```text
本日の測定
実行中
実行履歴
```

「一括正式測定」はnavigation tabではなく、page commandとする。

### 10.3 品質・例外レビュー

```text
未対応
対応中
再処理中
解決済み
自動通過履歴
```

件数は同じsnapshotのfacet countを使用する。

### 10.4 公開管理

```text
要対応
保留中
現在公開中
公開停止中
公開履歴
```

### 10.5 障害・監査

```text
障害
システム状態
システムイベント
監査ログ
```

閲覧capabilityがない項目は表示しない。

### 10.6 利用量・コスト

ページ内tab:

```text
概要
顧客・プロジェクト
AIモデル
サイクル・バッチ
```

### 10.7 管理設定

項目数が多いため、設定ページ内だけlocal vertical navigationを使用する。

```text
設定トップ
管理者
標準役割
通知先
日次処理
AIモデル
標準プラン
変更履歴
品質・公開ルール
原価単価
```

- 幅200pxを基本とする。
- capabilityがない項目は表示しない。
- 右側contentは `min-width: 0`。
- 1366×768でもpage全体横スクロールを作らない。

---

## 11. 正式なpage template

### 11.1 `T1 Operations Home`

対象:

```text
/admin
```

構成:

```text
page header
scope/freshness notice
本日の自動処理
人の対応が必要な例外
自動公開状況
システム状態 optional
最近の重要履歴
```

独自操作を増やさず、専門ページへの導線を中心とする。

### 11.2 `T2 Standard List`

対象例:

- 顧客一覧
- プロジェクト一覧
- 契約一覧
- 問い合わせ一覧
- 障害一覧
- イベント一覧

構成:

```text
page header
local navigation optional
tab optional
filter bar
data table
cursor pagination
```

### 11.3 `T3 Work Queue`

対象:

- 品質・例外
- 公開要対応
- 人の対応が必要な問い合わせ

Standard Listとの差:

- attention levelを先頭近くへ表示
- assignee、age、safe fallbackを表示
- incident group headerを利用可能
- 正常行を混在させない

### 11.4 `T4 Entity Detail`

対象:

- customer
- project
- contract
- inquiry
- measurement cycle
- measurement batch
- quality case
- incident
- publication version

構成:

```text
breadcrumb
entity header
state/safe fallback banner optional
main column
context rail optional
section tabs or anchors
recent timeline
```

primary entityはdrawerだけで完結させず、独立URLを持つ。

### 11.5 `T5 Payload Inspector`

対象:

- publication candidate
- publication versionの本文・section
- 品質caseのcandidate preview

構成:

```text
entity header
left/main: customer preview or payload summary
right inspector: generation, rule version, findings, section visibility, diff
bottom or side: commands
```

- payloadはread-only。
- inline editを作らない。
- preview内リンクは無効化または安全な新規タブへ制限する。
- 顧客境界を示すcustomer/project名を常に表示する。

### 11.6 `T6 Form`

対象:

- customer作成
- project作成
- 管理設定の編集

構成:

```text
page header
form sections
validation summary
change impact optional
sticky action footer optional
```

- autosaveしない。
- 明示的な保存を使用する。
- W2/W3に該当する保存は共通確認フローへ接続する。

### 11.7 `T7 Preview / Confirm`

対象:

```text
/admin/measurements/bulk/confirm
```

構成:

```text
選択条件
対象件数
create / reprocess / not allowedの内訳
blocked理由
推定logical item数
影響確認
実行button
```

確認画面自体はwriteしない。実行時に再検査する。

### 11.8 `T8 Settings Index`

対象:

```text
/admin/settings
```

構成:

```text
local settings navigation
settings health
管理者・通知・日次・AIモデル・planのsummary
現在のrule version
pricing適用状況
recent change timeline
```

---

## 12. 共通status component

### 12.1 `AdminStatusBadge`

input:

```text
code
label
display_tone
icon optional
size
```

mapping:

| tone | 用途 |
|---|---|
| `danger` | Critical、system block、顧客影響を伴う失敗 |
| `warning` | 人の対応、保留、管理者停止、更新遅延 |
| `info` | 実行中、再処理中、ready、検証中 |
| `success` | 完了、現在公開中、運用中 |
| `neutral` | 終了、対象外、解決済み、unknown |

ルール:

- labelを必須とする。
- dangerとwarningはiconを基本とする。
- raw enumをlabelへしない。
- success badgeを大量表示しない。表では必要に応じてneutral textへ弱める。

### 12.2 `AdminFlagChip`

secondary flag用。最大3件まで直接表示し、それ以上はまとめる。

例:

- 前回版維持
- 契約停止
- 原価未算定
- 障害関連
- 候補保留

### 12.3 `AdminSafeFallbackBanner`

顧客影響の安全状態を明示する。

例:

```text
前回の安全な公開版を継続表示しています
初回公開前のため、顧客画面は準備中です
公開を停止しています。測定と解析は継続しています
顧客表示への影響はありません
```

このbannerはエラー内容より先に「現在顧客へ何が表示されているか」を示す。

---

## 13. Summary・card

### 13.1 `AdminMetric`

大量の独立カードではなく、summary panel内のmetricとして使う。

```text
label
value
unit optional
supporting label
state/tone optional
```

- 不明値は `—` とし、0へ置き換えない。
- monetary valueではknown amountと未算定を分ける。
- countの意味をlabelへ明記する。

### 13.2 card階層

| 種類 | 用途 |
|---|---|
| Primary panel | ページの最重要判断 |
| Standard section | tableやsummaryをまとめる |
| Inline callout | stale、safe fallback、partial error |
| No card | 単純なfield list、timeline row |

すべてをカードで囲まない。

---

## 14. Filter bar

### 14.1 構成

左から次を基本とする。

```text
search
主要filter
日付filter
その他filter
clear

右側:
表示件数 / export / page-specific secondary action
```

### 14.2 search

- 幅280pxを基本とする。
- 顧客・プロジェクト共通search対象はread model仕様に従う。
- debounceを使用してよいが、URLへ最終値を反映する。
- Enterでも確定できる。
- clear buttonを持つ。

### 14.3 filter状態

- filterはURL queryを正とする。
- active filterはchipで表示できる。
- 「すべて解除」を提供する。
- facet countは同じread snapshotから返す。
- P0では保存済みfilter viewを作らない。

### 14.4 日付

期間初期値:

- system event: 直近7日
- measurement history: 直近30日
- audit log: 直近30日
- cost: 当月

無制限期間をUIから選ばせない。

---

## 15. Data table

### 15.1 基本構造

```text
table header sticky
rows
row action
cursor pagination
```

標準row heightは48px。2行summaryを含む場合は56pxまで許可する。

### 15.2 column設計

優先順:

1. entity / customer / project識別
2. primary state
3. 人の対応・safe fallback
4. 進捗または主要件数
5. 担当者
6. 最終活動時刻
7. row action

列が多い場合、ID・補助countを優先して隠し、primary stateとcustomer contextを残す。

### 15.3 row navigation

- primary entity row clickはdetail URLへ遷移する。
- link、checkbox、action menuのclickではrow navigationを発火しない。
- keyboardでrow linkへ移動可能にする。
- row全体をbuttonにしない。

### 15.4 selection

checkboxはbulk commandが存在する画面だけ表示する。

P0の主対象:

- 一括正式測定候補
- measurement batch対象

品質caseの一括承認は作らない。

### 15.5 bulk selection

- 現在pageだけか、filter全件かを明確に区別する。
- P0の初期実装は現在取得済みpage selectionを基本とする。
- 全filter件選択を実装する場合は、server-side selection tokenを使用する。
- 選択対象の一部がscope外・state conflictになった場合、実行前previewで除外理由を表示する。

### 15.6 sort

- sort対象列だけheader controlを表示する。
- default sortはread model仕様に従う。
- stable sortとしてentity IDをtie breakerへ含める。

### 15.7 pagination

cursor paginationを使用する。

表示:

```text
1〜50件を表示 / 合計N件
前へ
次へ
```

ページ番号ジャンプはP0で必須にしない。

### 15.8 horizontal overflow

- table container内だけ許可する。
- 横幅が大きいtableは識別列をstickyにしてよい。
- row action列は右端stickyにしてよい。
- main page全体へoverflowを伝播させない。

### 15.9 禁止

- table内inline edit
- raw JSON表示
- 状態labelの独自色
- attempt数を論理進捗として表示
- finding数をcase数として表示
- 未算定原価を0円として表示

---

## 16. Detail drawer

### 16.1 drawerを使用する対象

- audit log詳細
- system event詳細
- measurement attempt詳細
- quality finding詳細
- site analysis evidence
- timeline entryの補助情報
- source evidence

### 16.2 独立URLを使用する対象

- customer
- project
- contract
- inquiry
- measurement cycle
- measurement batch
- quality case
- incident
- publication candidate
- publication version

### 16.3 drawer仕様

- 標準幅520px
- payload・diff inspectorは640pxまで
- title、context、close、content、footerの順
- URL queryでdrawer stateを持たせてよい
- browser backで閉じられるようにする
- drawer内でもscopeとredactionを再適用する
- W3 commandをdrawer内だけで完結させない。共通dialogへ移行する

### 16.4 audit drawer

最低限表示:

```text
日時
actor
操作
結果
対象
理由要約
before / after allowed summary
request_id
correlation_id
関連scope
```

secretや権限外before/afterは表示しない。

---

## 17. Timeline

### 17.1 正式情報源

`TimelineEntry` だけを使用する。

```text
audit_log
system_event
対象固有の追記型状態遷移
```

ページごとに別履歴を保存しない。

### 17.2 row構造

```text
source icon
occurred_at
summary
actor / component
result or state
related entity links
expand detail optional
```

### 17.3 表示順

```text
occurred_at DESC
source priority
entry_id DESC
```

同じ管理操作をauditと擬似操作履歴で二重表示しない。

### 17.4 filter

詳細pageでは次の簡易filterを許可する。

```text
すべて
管理者操作
システム処理
状態変更
```

全文検索はP0で必須にしない。

### 17.5 初期件数

- 初期20件
- 「さらに表示」でcursor取得
- 大量のmeasurement attempt成功をentity topへ並べない

---

## 18. `available_commands` の表示

### 18.1 正式入力

frontendは、APIが返した次だけを使用する。

```text
command_code
target_type
target_id
risk_class
requires_reason
allowed_reason_codes
requires_confirmation
confirmation_mode
requires_step_up
step_up_state
idempotency_required
expected_row_version
```

role名や状態をfrontendで再判定してcommandを作らない。

### 18.2 command grouping

```text
主要操作
その他の操作
重要操作
```

- W1: 主要またはその他
- W2: 主要またはその他。確認必須
- W3: 重要操作だけ

### 18.3 非表示とdisabled

| 状況 | UI |
|---|---|
| capabilityなし | 表示しない |
| scopeなし | 表示しない |
| state上不可 | 原則表示しない |
| step-up不足 | 表示し、step-upへ誘導可能 |
| read stale/unknown | W2/W3を一時disabledし更新要求 |
| command送信中 | 同commandをdisabled |
| row version conflict | conflict message後に再取得 |

### 18.4 command label

raw command codeを表示しない。

例:

```text
RetryProjectSetup -> 初期設定を再試行
RecordQualityDecision -> 品質判断を記録
RestorePublicationVersion -> この版へ復元
StopPublication -> 顧客公開を停止
```

---

## 19. 操作リスク別フロー

### 19.1 W1

対象例:

- 担当者設定
- 内部メモ追加
- 初期設定再試行
- 追加検証
- 失敗項目再試行

UI:

- 単純な担当変更はpopoverまたはsmall dialog
- 再処理は確認dialogを使用してよい
- 非同期なら「受け付けました」と表示し、完了とは表示しない
- request IDまたはidempotencyを使用する

### 19.2 W2

共通dialog幅560pxを基本とする。

表示順:

```text
操作名
対象
現在状態
変更または影響
safe fallback
理由code
理由文 optional/required
確認checkbox optional
実行button
```

要件:

- expected row versionを保持
- idempotency key生成
- 理由を監査へ保存
- backdrop clickで誤確定しない
- 実行button文言を具体化する

例:

```text
「実行」ではなく「手動正式測定を開始」
「保存」ではなく「契約版を有効化」
```

### 19.3 W3

W3は次の2段階とする。

```text
1. step-up本人確認
2. Critical確認dialog
```

Critical確認dialog幅640pxを基本とする。

必須表示:

- Critical操作であること
- 対象名とstable ID
- 現在状態
- 変更後状態
- 影響する顧客・project・処理
- 顧客画面への影響
- 自動処理が継続するか
- safe fallback
- 通知される対象
- 理由code
- 具体的理由文
- typed confirmationまたは明示checkbox

W3ではdanger toneを使用するが、画面全体を赤くしない。

### 19.4 typed confirmation

対象:

- 契約終了
- project終了
- 全日次自動処理停止
- AIモデル全面停止
- 管理者無効化
- `platform_admin` 解除
- 過去公開版への復元

ルール:

- 対象名または指定確認文を完全一致させる。
- 前後空白は正規化してよいが、曖昧一致を使わない。
- copy buttonは提供しない。
- confirmation文字列をauditへ保存しない。

### 19.5 dialogの閉じ方

- submit前はclose可能。
- submit中は二重送信を防止する。
- W3 submit中はbackdrop・Escで閉じない。
- endpoint timeout時も、完了失敗を断定せずoperation状態を再照会する。

---

## 20. MFA・step-up共通フロー

### 20.1 MFA未登録

MFA未登録管理者には業務データを表示しない。

利用可能:

```text
MFA登録
サインアウト
```

業務sidebarは表示しない。

### 20.2 step-up

- 直近15分以内のstep-upをW3で要求する。
- `step_up_state = required` のcommand click時に共通flowを開始する。
- 成功後、元のcommand dialogへ戻る。
- 失敗・cancel時はcommandを実行しない。

### 20.3 utility route

実装上必要な場合、次を使用してよい。

```text
/admin/security/mfa
/admin/security/step-up
```

これらは業務領域ページではなく、サイドバーへ追加しない。modal実装で同等の安全性を満たす場合は専用URLを必須としない。

### 20.4 return path

- 同一originのallowlist済み `/admin/*` だけを許可する。
- 外部URLをreturn targetにしない。
- step-up前の対象ID、command code、row versionはserver側または署名済みstateで保持する。

---

## 21. 非同期操作とfeedback

### 21.1 受理と完了を分ける

非同期command responseは、少なくとも次を区別する。

```text
completed
accepted_async
idempotent_replay
rejected
failed
```

`accepted_async` で「完了しました」と表示しない。

### 21.2 accepted表示

例:

```text
再測定を受け付けました。処理状況はこのページへ自動反映されます。
公開処理を受け付けました。現在版は切り替え完了まで維持されます。
```

### 21.3 追跡

可能な場合、responseへ次を含める。

```text
operation_id
correlation_id
audit_log_id
next_refresh_hint
```

UIはread modelとtimelineを再取得する。独自のclient-only完了状態を永続化しない。

### 21.4 toast

使用対象:

- simple W1成功
- command受理
- filter copyなど軽微な操作

使用しない対象:

- Critical失敗の唯一の通知
- stale・partial errorの唯一の通知
- 長時間処理完了の唯一の通知

重要状態はpage内bannerまたはstateへ反映する。

### 21.5 idempotent replay

同一要求が既に受理済みの場合:

```text
同じ操作はすでに受け付け済みです
```

error扱いにせず、既存operationへ誘導する。

---

## 22. Form共通仕様

### 22.1 基本

- labelをplaceholderで代用しない。
- 必須・任意を明示する。
- 送信前とserver側の両方で検証する。
- server validation errorをfieldとsummaryへ表示する。
- destructive設定をtoggleだけで即時保存しない。

### 22.2 form section

```text
section title
short description
fields
inline help
section error
```

### 22.3 保存

- 通常は明示的な保存button。
- dirty stateがある場合、page離脱確認を行う。
- 保存成功後にread modelを再取得する。
- 設定変更の実適用が非同期なら、保存完了と適用完了を分ける。

### 22.4 read-only設定

品質・公開ルール、pricingなどP0読み取り中心画面では、編集風controlを表示しない。

表示:

```text
現在version
適用日時
適用範囲
適用状態
変更履歴への導線
```

---

## 23. Loading・refreshing

### 23.1 初回loading

- shellとsidebarは維持する。
- page headerと主要sectionへskeletonを表示する。
- 実データに見えるダミー数値を表示しない。
- skeletonでaction buttonを有効にしない。

### 23.2 filter変更中

- 旧一覧を完全に消さず、tableを薄くしてprogressを表示してよい。
- 別scopeの旧データを表示し続けない。
- scope変更時はcontentをクリアして新scopeを読み込む。

### 23.3 background refresh

- fresh dataを表示しながら小さな更新indicatorを出す。
- W2/W3実行中は対象entityだけを過剰pollingしない。
- read modelの推奨refresh hintに従う。

---

## 24. Empty state

### 24.1 `first_empty`

正式にデータがまだ存在しない状態。

例:

```text
まだ問い合わせはありません
現在公開版はまだありません。初回公開の準備中です
この期間の測定履歴はありません
```

### 24.2 `filtered_empty`

```text
条件に一致する結果はありません
```

active filterとclear actionを表示する。

### 24.3 `resolved_empty`

例外queueで0件の場合:

```text
現在、人の対応が必要な例外はありません
```

大きな祝福表現やgreen illustrationは使わない。

### 24.4 forbiddenをemptyにしない

権限がないため0件に見える表示は禁止する。routeまたはsection単位でdeniedとして扱う。

---

## 25. Stale・partial・error

### 25.1 stale

stale dataを安全に表示できる場合:

- 既存内容を維持する
- 上部に「古い情報を表示中」banner
- `source_updated_at` を表示
- manual refreshを提供
- W2/W3を一時停止

### 25.2 unknown

状態を安全に断定できない場合:

- 状態値を `—` または「確認中」とする
- 0件、正常、公開中を推測しない
- 影響の大きいcommandを表示しない
- support correlation IDを表示可能にする

### 25.3 partial section error

ページの一部だけ失敗した場合:

- 成功sectionは表示可能
- 失敗section内へinline error
- page全体の主判断に必要ならpage-level warning
- 失敗sectionへ依存するcommandを表示しない

### 25.4 full page error

次の場合はfull page errorとする。

- scope解決不能
- entity canonical target解決不能
- pageの主read model取得不能
- セキュリティ境界異常
- write/read整合性を安全に判定できない

### 25.5 denied / not found

外部表示文言は必要以上に区別しない。

```text
このページを表示できません
対象が存在しないか、閲覧権限がありません
```

詳細reasonはauditへ記録する。

### 25.6 state conflict

`STALE_ROW_VERSION` または `STATE_CONFLICT`:

```text
対象の状態が更新されました。最新情報を再取得してください。
```

- 入力理由文は可能なら保持する。
- 自動再送信しない。
- refresh後にcommand可否を再計算する。

### 25.7 error code表示

通常利用者へraw codeだけを表示しない。support用に短いrequest/correlation IDを併記してよい。

---

## 26. Redaction表示

### 26.1 原則

APIがfieldを省略した場合、frontendが空欄やnullから推測しない。

`redacted_fields` を使って表示を決める。

### 26.2 sectionの扱い

| 状況 | UI |
|---|---|
| page自体のcapabilityなし | routeを表示しない / denied |
| detail metadataは可、payload不可 | metadataを表示し、payload領域に権限制限notice |
| customer sensitiveの一部不可 | fieldを省略。存在数を漏らさない |
| audit before/after不可 | action要約だけ表示 |
| secret | どのUIにも存在を表示しない |

### 26.3 権限制限notice

routeの存在自体が閲覧可能な場合だけ、次のようなnoticeを使える。

```text
本文は現在の権限では表示されません
詳細な監査内容は監査権限が必要です
```

権限外entityの名前・件数は表示しない。

---

## 27. Accessibility

### 27.1 基準

- WCAG 2.1 AA相当を目標とする。
- keyboardのみでnavigation、filter、table link、drawer、dialog、commandを操作可能にする。
- focus ringを消さない。
- 色だけで状態を示さない。
- semantic heading順を守る。
- tableは適切なheaderとcaptionを持つ。

### 27.2 focus管理

- drawer open時はdrawer titleへfocus。
- close時は元のtriggerへ戻す。
- dialog open時はdialog内へfocus trap。
- validation error時はerror summaryまたは最初のinvalid fieldへ移動する。
- route遷移後はpage titleへfocusする。

### 27.3 live region

使用対象:

- filter結果件数の更新
- async command受理
- form validation summary
- drawer open/close

大量のbackground refreshを逐次読み上げない。

### 27.4 icon

- icon-only buttonは `aria-label` 必須。
- status iconはlabelと併用する。
- decorative iconは読み上げ対象外にする。

---

## 28. Visual token方針

### 28.1 font

- 既存Recoraのfont stackを継承する。
- 管理画面だけ別fontを追加しない。
- 日本語と英数字でweight差が不自然にならないようにする。

### 28.2 semantic color token

```text
surface.canvas
surface.panel
surface.raised
border.default
border.strong
text.primary
text.secondary
text.muted
brand.primary
state.danger
state.warning
state.info
state.success
state.neutral
focus.ring
```

component内へ個別の色値を直書きしない。

### 28.3 radius・shadow

- panel: 8〜10px
- input/button: 6〜8px
- badge: full pill
- shadowはdrawer、dialog、popoverなどoverlayへ限定
- section cardへ強いshadowを付けない

### 28.4 spacing

4px単位を基本とする。

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40
```

page section間は24〜32px、card内部は16〜24pxを基本とする。

---

## 29. Routeとtemplate対応

| Route | Active領域 | Local nav | Template |
|---|---|---|---|
| `/admin` | 運用ホーム | なし | T1 |
| `/admin/customers` | 顧客管理 | 顧客 | T2 |
| `/admin/customers/new` | 顧客管理 | 顧客 | T6 |
| `/admin/customers/[customerId]` | 顧客管理 | 顧客 | T4 |
| `/admin/projects` | 顧客管理 | プロジェクト | T2 |
| `/admin/projects/[projectId]` | 顧客管理 | プロジェクト | T4 |
| `/admin/customers/[customerId]/projects/new` | 顧客管理 | プロジェクト | T6 |
| `/admin/contracts` | 顧客管理 | 契約 | T2 |
| `/admin/contracts/[contractId]` | 顧客管理 | 契約 | T4 |
| `/admin/inquiries` | 顧客管理 | お問い合わせ | T3 |
| `/admin/inquiries/[inquiryId]` | 顧客管理 | お問い合わせ | T4 |
| `/admin/measurements` | 測定管理 | 3tab | T2 |
| `/admin/measurements/bulk` | 測定管理 | 本日の測定 | T2 |
| `/admin/measurements/bulk/confirm` | 測定管理 | 本日の測定 | T7 |
| `/admin/measurements/cycles/[cycleId]` | 測定管理 | 実行履歴または実行中 | T4 |
| `/admin/measurements/batches/[batchId]` | 測定管理 | 実行中 | T4 |
| `/admin/quality-exceptions` | 品質・例外レビュー | 5tab | T3 |
| `/admin/quality-exceptions/[caseId]` | 品質・例外レビュー | 対応tab | T4 |
| `/admin/publications` | 公開管理 | 5tab | T2/T3 |
| `/admin/publications/candidates/[candidateId]` | 公開管理 | 対応tab | T5 |
| `/admin/publications/versions/[versionId]` | 公開管理 | 公開履歴 | T5 |
| `/admin/operations/incidents` | 障害・監査 | 障害 | T2/T3 |
| `/admin/operations/incidents/[incidentId]` | 障害・監査 | 障害 | T4 |
| `/admin/operations/system-status` | 障害・監査 | システム状態 | T4または専用summary |
| `/admin/operations/events` | 障害・監査 | システムイベント | T2 |
| `/admin/operations/audit-logs` | 障害・監査 | 監査ログ | T2 + drawer |
| `/admin/usage-costs` | 利用量・コスト | 4tab | T2/summary |
| `/admin/settings` | 管理設定 | 設定トップ | T8 |
| `/admin/settings/admins` | 管理設定 | 管理者 | T2 |
| `/admin/settings/roles` | 管理設定 | 標準役割 | T2/T4 |
| `/admin/settings/notifications` | 管理設定 | 通知先 | T6 |
| `/admin/settings/daily-automation` | 管理設定 | 日次処理 | T6 |
| `/admin/settings/ai-models` | 管理設定 | AIモデル | T2/T4 |
| `/admin/settings/plans` | 管理設定 | 標準プラン | T2/T4 |
| `/admin/settings/change-history` | 管理設定 | 変更履歴 | T2 + drawer |
| `/admin/settings/quality-publication-rules` | 管理設定 | 品質・公開ルール | read-only T4 |
| `/admin/settings/pricing` | 管理設定 | 原価単価 | read-only T4 |

`/admin/contracts/new` はP0正式routeへ追加しない。契約作成・version作成は、顧客詳細または契約detailの正式commandから開始する。

---

## 30. 共通component contract

### 30.1 Page context

```ts
interface AdminPageContext {
  activeDomain:
    | "home"
    | "customers"
    | "measurements"
    | "quality"
    | "publications"
    | "operations"
    | "usage_costs"
    | "settings";
  selectedScope: {
    type: "all_assigned" | "customer" | "project" | "global_control";
    id?: string;
    label: string;
  };
  businessDate: string;
  timezone: string;
  readSnapshotAt: string;
  sourceUpdatedAt: string | null;
  freshnessState: "fresh" | "delayed" | "stale" | "unknown";
  scopeFingerprint: string;
  redactedFields?: string[];
}
```

### 30.2 Page header

```ts
interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryStatus?: {
    code: string;
    label: string;
    tone: "danger" | "warning" | "info" | "success" | "neutral";
  };
  secondaryFlags?: Array<{ code: string; label: string; tone: string }>;
  metadata?: Array<{ label: string; value: string; copyable?: boolean }>;
  availableCommands?: AdminAvailableCommand[];
}
```

### 30.3 Command

```ts
interface AdminAvailableCommand {
  commandCode: string;
  targetType: string;
  targetId: string;
  label: string;
  riskClass: "W1" | "W2" | "W3";
  requiresReason: boolean;
  allowedReasonCodes: string[];
  requiresConfirmation: boolean;
  confirmationMode: "none" | "checkbox" | "typed_target" | "typed_phrase";
  requiresStepUp: boolean;
  stepUpState: "satisfied" | "required" | "not_applicable";
  idempotencyRequired: boolean;
  expectedRowVersion: string;
}
```

### 30.4 List response

UIは最低限次を同時に受け取る。

```ts
interface AdminListPageResult<T> {
  items: T[];
  pageInfo: {
    nextCursor: string | null;
    previousCursor: string | null;
  };
  totalCount: number | null;
  facetCounts: Record<string, number | null>;
  pageContext: AdminPageContext;
}
```

`totalCount = null` を0件として表示しない。

---

## 31. Security・監査上のUI規則

1. service role相当のcredentialをbrowserへ渡さない。
2. role definition全体をbrowserへ渡さない。
3. command endpoint URLだけを見て操作可能と判断しない。
4. target customer/projectはrequest bodyではなくserver側write modelで解決する。
5. ID直接入力によるscope bypassを防ぐ。
6. exportは画面と同じscope、filter、snapshotを使う。
7. export開始と取得を監査する。
8. secretをUI、error、timeline、drawerへ表示しない。
9. W2/W3の成功・拒否・失敗をauditする。
10. denied reasonの詳細を通常UIへ出しすぎない。
11. actor表示は権限に応じてIDを省略する。
12. candidate previewは顧客・project contextを常に固定表示する。
13. preview内で別tenantのassetを解決しない。
14. W3のstate changeとaudit appendは同一transactionの結果として扱う。
15. operation timeout時にUIだけで再実行せず、idempotencyとoperation状態を確認する。

---

## 32. P0で作らない共通UI

- sidebarの自由並び替え
- sidebarのユーザー別カスタマイズ
- グローバル全文検索
- command palette
- 通知センター
- 保存済みfilter view
- table columnの永続カスタマイズ
- 表示密度切替
- dark mode
- mobile専用管理画面
- drag and dropによる状態変更
- table inline edit
- card drag layout
- 一括品質承認
- 一括公開承認
- candidate/version本文編集editor
- raw SQL / raw JSON viewer
- 高度な監査ログexport
- 二名承認UI

---

## 33. 受け入れ条件

### 33.1 shell

1. 1366×768でpage全体の横スクロールが発生しない。
2. 1440×900でmainの余白が過剰にならない。
3. sidebar幅は224pxで一定。
4. sidebarへ8領域だけが常時表示される。
5. active detail routeで正しい領域がactiveになる。
6. context barは56pxで固定される。
7. nonproduction環境が明確に識別できる。

### 33.2 navigation・scope

8. capabilityのない領域はsidebarへ出ない。
9. 子pageの一部だけ権限がある場合、領域は表示されlocal navが絞られる。
10. scope selectorは現在routeのeffective scopeだけを候補にする。
11. 権限外scope queryを指定してもデータが漏れない。
12. route変更でscopeが無効になった場合、安全に正規化される。
13. sidebar badgeとpage list件数が同じscopeで一致する。
14. 全体Critical alertは権限のある管理者だけに表示される。

### 33.3 business date・freshness

15. browserの日付と業務日が異なる場合も、業務日が正しく表示される。
16. timezoneが明示される。
17. staleをfreshとして表示しない。
18. unknown countを0件として表示しない。
19. stale時にW2/W3が実行開始できない。
20. page内sectionのfreshness差を確認できる。

### 33.4 table・filter

21. filter、facet、items、totalが同一snapshotで一致する。
22. filter状態がURLへ反映される。
23. filtered emptyとfirst emptyを区別する。
24. cursor paginationで重複・欠落が発生しない。
25. row linkとcheckbox/actionが競合しない。
26. table内overflowがpageへ伝播しない。
27. logical item、attempt、case、incidentの件数粒度を混同しない。
28. 未算定原価を0円表示しない。

### 33.5 command

29. frontendがrole名からcommandを推測しない。
30. capability・scopeのないcommandを表示しない。
31. W2で理由、impact、row version、idempotencyが扱われる。
32. W3でstep-upが必須になる。
33. typed confirmation対象が完全一致しない限り実行できない。
34. W3 submit中に二重送信できない。
35. state conflict時に自動再送信しない。
36. idempotent replayを重複失敗として扱わない。
37. accepted asyncを完了表示しない。
38. command endpointで最新権限・stateを再検査する。

### 33.6 drawer・timeline

39. primary entityは独立URLを持つ。
40. audit log詳細をdrawerで確認できる。
41. drawer close後に元triggerへfocusが戻る。
42. timelineに同一操作が二重表示されない。
43. timelineのredactionが権限に従う。
44. correlation IDから関連処理へ遷移できる範囲が正しい。

### 33.7 error・redaction

45. deniedを空一覧として表示しない。
46. 権限外件数をbadge・facetから推測できない。
47. partial errorで成功sectionまで消えない。
48. 主read model失敗時はfull page errorになる。
49. secretがUI・error・drawerへ出ない。
50. payload権限がない場合、metadataだけが安全に表示される。

### 33.8 accessibility

51. keyboardだけでsidebar、scope、filter、table、drawer、dialogを操作できる。
52. focusがdrawer/dialog外へ漏れない。
53. route変更後にpage titleへfocusされる。
54. statusが色だけに依存しない。
55. icon-only buttonにaccessible nameがある。
56. 200% zoomでも主要commandと状態が利用可能である。

### 33.9 visual regression

57. 1366×768でsidebar、context、page header、filter、7行以上が確認できる。
58. 1440×900で12列gridとdetail railが崩れない。
59. 長い顧客名・project名・日本語statusで行高が破綻しない。
60. badgeが99+でもnavigation labelを押し潰さない。
61. W3 dialogが768px高で画面外へはみ出さず、内部scrollできる。
62. 520px drawerが1366幅でmainを完全に隠さない。

---

## 34. 実装順

1. semantic design token
2. `AdminRootLayout` と認証・MFA boundary
3. route capability descriptor
4. 8領域 `AdminSidebar`
5. `AdminScopeSelector` とserver-side scope resolver
6. `AdminContextBar`
7. `AdminPageFrame` と `AdminPageHeader`
8. local navigation component
9. status、flag、safe fallback、freshness component
10. filter contractとURL同期
11. standard data tableとcursor pagination
12. detail drawer
13. timeline
14. `available_commands` renderer
15. W1/W2/W3共通dialog
16. step-up flow
17. loading / empty / stale / denied / partial / full error
18. form shell
19. payload inspector shell
20. route template wrapper
21. 1366×768・1440×900 visual regression
22. keyboard・focus・accessible nameテスト
23. scope・redaction・command表示の統合テスト

個別領域画面は、この共通部品を利用し、独自のshell、dialog、status badge、table paginationを新設しない。

---

## 35. 最終統合後の位置づけ

本仕様v1.1は、canonical manifest v1.0に含まれる共通レイアウトの正式画面仕様である。

新しい画面仕様を追加する段階は完了した。実装時は、正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0、共通レイアウトv1.1から生成したAPI contractと`available_commands`だけを使用する。
