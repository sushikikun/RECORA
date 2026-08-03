# レコラ管理画面 P0 顧客管理画面仕様書

- 文書ID: `RECORA-ADMIN-P0-CUSTOMER-MANAGEMENT`
- 版: `1.1`
- 基準日: `2026-08-01`
- 状態: 正式採用
- 対象領域: 顧客管理
- 前提仕様:
  - `RECORA-ADMIN-P0-STATE-MODEL v2.1`
  - `RECORA-ADMIN-P0-READ-MODEL v2.0`
  - `RECORA-ADMIN-P0-AUTHZ-AUDIT v2.0`
  - `RECORA-ADMIN-P0-COMMON-LAYOUT v1.1`
- 優先順位: 本仕様は、顧客・契約・プロジェクト・初期設定・問い合わせについての過去の画面案、仮ステータス、個別フォーム案より優先する

---

## 0A. v1.1 最終横断統合更新

顧客管理の画面責任・P0範囲はv1.0から変更しない。最終横断レビューにより、前提基盤を正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0へ更新する。

- 状態enumとcommand state effectは正式状態モデルv2.1を正とする。
- 表示code、件数、badge、facet、available command入力はread model v2.0を正とする。
- capability、scope、risk、command code、auditは権限・監査仕様v2.0を正とする。
- 正式routeと採用文書はcanonical manifest v1.0を正とする。

- 顧客導入表示codeをread modelの単一9値へ統一し、アクセス・契約・初回公開状態は別fieldへ分離した。

---

## 0. 正式決定

顧客管理P0について、次を正式に固定する。

1. 顧客管理は、領域内ローカルナビゲーションを `顧客 / プロジェクト / 契約 / お問い合わせ` の4項目に固定する。
2. `customer` は顧客マスタとし、P0では顧客status、削除、統合、アーカイブを追加しない。
3. 顧客の「導入準備中」「運用中」「契約停止」「要対応」は、契約・プロジェクト・初期設定・問い合わせの正式状態からread modelで導出する。
4. `customer.access_control` は顧客ログイン・顧客APIアクセスだけを制御し、契約、測定、候補生成、現在公開版pointerを変更しない。
5. 顧客アクセス停止はW3、`suspended_by_admin` からの通常再開はW2とする。停止時は既存セッションをfail-closedで無効化し、system blockは通常再開で解除しない。
6. 顧客ユーザーは顧客単位のmembershipとし、P0ではproject別scope、顧客側カスタム役割、細かな権限編集を作らない。
7. 顧客作成は顧客マスタだけを作る。契約とプロジェクトを暗黙に同時作成しない。
8. 契約作成は顧客詳細から行い、`contract` と初回draft `contract_version` を同一transactionで作る。
9. `/admin/contracts/new` はP0の独立routeとして追加しない。契約作成の起点は必ず対象顧客とする。
10. 契約versionは、draftだけ編集可能とする。scheduledまたはactiveになった内容を直接編集しない。
11. 契約versionの即時適用、適用予約、予約取消を明示的なcommandとして分ける。
12. 契約停止ではproject entitlementを一括更新しない。正式日次判定がactive contractとactive entitlementの両方を評価する。
13. 契約終了ではactive entitlementをexpired、未適用scheduled versionをcancelledにするが、projectを自動的にclosedへ変更しない。
14. プロジェクト作成にはactive contract version、利用可能project枠、許可AIモデル、prompt tierが必要である。
15. `CreateProject` は通常の導入操作としてW1とする。ただし作成内容、自動初期設定、品質ゲート通過後に正式日次・自動公開・内部原価発生の対象になり得ることを送信前に要約表示する。
16. プロジェクト作成時に、project、active entitlement、building configuration revision、queued setup run、必要なoutboxを原子的に作成する。
17. プロジェクト作成フォームで顧客運用担当が入力するのは、project名、対象サイトURL、対象ブランド名、対象地域、言語、許可されたAIモデル、許可されたprompt tierだけとする。
18. カテゴリ、競合候補12件、ペルソナ、トピック、50・100・200件のプロンプトは自動生成する。顧客運用担当が初期値を手入力しない。
19. 自動生成されたカテゴリ・競合・ペルソナ・トピック・prompt setを一覧内で直接編集しない。
20. 初期設定中の入力誤りは、新configuration revisionと新setup runを作る `RetryProjectSetupWithInputCorrection` で訂正する。
21. active projectの測定条件変更は、直接編集ではなくW2の `CreateProjectConfigurationRevision` としてP0へ含める。旧active revision、進行中cycle、現在公開版を維持したまま新revisionを自動検査し、通過後だけ切り替える。
22. 初期設定の進行は `site_fetch / site_analysis / category_generation / competitor_generation / persona_topic_generation / prompt_generation / quality_check / activation` の8工程で表示する。
23. 初期設定が失敗しても正式日次cycleを作らず、顧客画面は準備中のままとする。
24. プロジェクト詳細には現在公開版の要約を表示するが、公開、復元、停止などの強い操作は公開管理へ委譲する。
25. 測定再実行、batch停止、品質decision、公開版編集を顧客管理から実行しない。
26. 問い合わせは顧客ポータルから受信した不変メッセージとして表示し、受信本文を編集しない。
27. 問い合わせstatusは `new / in_progress / resolved` に固定し、担当者、内部メモ、解決note、再開理由を管理する。
28. 問い合わせの担当者割当だけではstatusを自動変更しない。対応開始は別commandとする。
29. 問い合わせ解決にはresolution note、再開にはreopen reasonを必須とする。
30. 問い合わせ内部メモは追記型とし、編集・削除ではなくcorrection noteで訂正する。
31. P0では管理画面からのメール送信、チャット、顧客への返信スレッド、外部返信記録を作らない。
32. 顧客管理の一覧・詳細・サイドバーバッジは、同じread model、scope、read snapshotから生成する。
33. 顧客管理の主要entityは独立URLを持ち、主要操作を一覧行のinline編集だけで完結させない。
34. 顧客管理固有の操作履歴テーブルを作らず、`audit_log + system_event + 対象固有状態遷移` からtimelineを構成する。
35. 画面がstale、権限不明、row version不一致の場合、W2・W3操作をfail-closedで停止する。

---

## 1. 目的

顧客管理は、顧客の登録から正式運用開始までの導入業務と、運用中の契約・アクセス・問い合わせ管理を担う。

管理者がこの領域で判断する内容は次である。

- 顧客マスタが正しく登録されているか
- 有効な契約versionと利用可能project枠があるか
- プロジェクトを作成できる状態か
- 自動初期設定がどこまで進んでいるか
- 初期設定で人の訂正が必要か
- 顧客ユーザーが安全にアクセスできるか
- 現在の契約・entitlementで顧客表示が可能か
- 顧客から新しい問い合わせが届いているか
- 問い合わせの担当・対応状態・内部記録が明確か

顧客管理は通常の測定運用や品質承認を代替しない。顧客単位の文脈を確認し、必要な専門領域へ正しく遷移させることを重視する。

---

## 2. 責任範囲

| 対象 | 顧客管理の責任 | 顧客管理では行わないこと |
|---|---|---|
| 顧客 | 顧客名、主連絡先、顧客アクセス、顧客ユーザー | 顧客削除、merge、archive、顧客側カスタム役割 |
| 契約 | 契約本体、version、適用予定、利用枠、停止・終了 | 請求、粗利、会計、原価単価編集 |
| プロジェクト | 作成、metadata、初期設定、契約・entitlement関連 | 日次batch詳細、品質decision、公開pointer操作 |
| 初期設定 | サイト取得、分析、生成物、品質ゲート進行 | 正常案件の手動承認、生成物のinline編集 |
| 顧客ユーザー | 招待、停止、再開、取消、主連絡先 | project別scope、顧客ユーザーrole設計 |
| 問い合わせ | 受信確認、担当、内部メモ、status、通知状態 | 顧客へのメール送信、チャット、返信スレッド |
| 履歴 | 対象に関連する監査・イベントの統合表示 | 履歴の直接編集、別操作履歴への二重保存 |

### 2.1 専門領域への委譲

顧客管理から次へ遷移できる。

| 状況 | 遷移先 |
|---|---|
| 正式日次・item・attemptを確認 | 測定管理 |
| 設定例外・品質例外を処理 | 品質・例外レビュー |
| 候補・現在公開版・公開失敗を処理 | 公開管理 |
| 共通原因・Critical障害を処理 | 障害・監査 |
| 利用量・内部変動原価を確認 | 利用量・コスト |
| 標準プラン・AIモデル・通知設定を確認 | 管理設定 |

顧客管理内に専門領域のwrite commandを複製しない。

---

## 3. 正式entity関係

```text
customer
├ contract
│  ├ contract_version
│  └ project_entitlement
├ project
│  ├ project_configuration_revision
│  │  ├ site_analysis_snapshot
│  │  ├ category_set
│  │  ├ competitor_set
│  │  ├ persona_topic_set
│  │  └ prompt_set
│  ├ project_setup_run
│  ├ measurement_cycle
│  ├ quality_exception_case
│  ├ publication_candidate
│  ├ project_publication_pointer
│  └ incident_scope
├ customer_user
└ customer_inquiry
   └ customer_inquiry_note
```

### 3.1 不変条件

- `customer` は削除しない。
- `contract` は必ず1顧客に属する。
- `contract_version` は必ず1契約に属する。
- 同一契約のactive versionは最大1件、scheduled versionも最大1件とする。
- `project` は必ず1顧客に属する。
- active `project_entitlement` は1projectにつき最大1件とする。
- `CreateProject` 時のcontract version、entitlement、configuration revisionは同じ契約文脈でなければならない。
- `customer_user` は必ず1顧客に属する。
- 同一顧客・正規化emailで、revoked以外のcustomer userを重複作成しない。
- `customer_inquiry.project_id` は任意だが、設定する場合はinquiryと同一customerのprojectだけを許可する。
- 現在公開版は `project_publication_pointer` だけを正とする。
- 顧客へ版を表示できるのは、active customer user、customer access enabled、active contract、active entitlement、active project、publication enabled、current pointerをすべて満たす場合だけとする。

### 3.2 顧客の導入状態

顧客の導入状態を保存しない。次から導出する。

```text
customer
＋ active contractの有無
＋ project数
＋ setup進行
＋ initial publication pointer
＋ open setup exception
＝ 顧客導入表示
```

正式な `customer_onboarding_state_code`:

```text
attention_required
new_inquiry
contract_required
project_required
setup_attention
setup_running
contract_excluded
operational
record_only
```

`access_suspended`、`access_blocked`、`contract_suspended`、`contract_ended`、`initial_publication_preparing`はonboarding codeへ混ぜず、顧客アクセス、契約summary、project summary、secondary flagとして表示する。

複数projectを持つ顧客では、顧客全体の主表示とproject別状態を分ける。1projectの異常だけで顧客全体を「停止」と断定しない。

---

## 4. Route・template・最低権限

### 4.1 Route一覧

| Route | 画面 | 共通template | 最低read capability |
|---|---|---|---|
| `/admin/customers` | 顧客一覧 | T2 Standard List | `customer.summary.read` |
| `/admin/customers/new` | 顧客作成 | T6 Form | `customer.create` |
| `/admin/customers/[customerId]` | 顧客詳細 | T4 Entity Detail | `customer.detail.read` |
| `/admin/projects` | プロジェクト一覧 | T2 Standard List | `project.read` |
| `/admin/projects/[projectId]` | プロジェクト詳細 | T4 Entity Detail | `project.read` |
| `/admin/customers/[customerId]/projects/new` | プロジェクト作成 | T6 Form + T7 Confirm | `project.manage` |
| `/admin/contracts` | 契約一覧 | T2 Standard List | `contract.read` |
| `/admin/contracts/[contractId]` | 契約詳細 | T4 Entity Detail | `contract.read` |
| `/admin/inquiries` | 問い合わせ一覧 | T3 Work Queue | `inquiry.read` |
| `/admin/inquiries/[inquiryId]` | 問い合わせ詳細 | T4 Entity Detail | `inquiry.read` |

### 4.2 P0で追加しないroute

```text
/admin/contracts/new
/admin/customer-users
/admin/customer-users/[id]
/admin/inquiries/new
/admin/inquiries/[id]/reply
/admin/projects/[id]/edit-configuration
```

契約作成と顧客ユーザー管理は顧客詳細から開始する。問い合わせは受信専用であり、新規作成routeを持たない。

### 4.3 Entity IDの扱い

- URLのIDはopaque IDとする。
- 権限外IDと不存在IDを必要以上に区別しない。
- 顧客名、project名、emailをURL queryへ機微情報として埋め込まない。
- 一覧から詳細へ遷移しても、詳細queryでscopeとcapabilityを再評価する。

---

## 5. 顧客導入の正式フロー

### 5.1 正常フロー

```text
CreateCustomer
  ↓
customer作成
  ↓
CreateContract
  ↓
contract draft + 初回contract_version draft
  ↓
ActivateContractVersion または ScheduleContractVersion
  ↓
contract active + active version + 利用可能枠
  ↓
CreateProject
  ↓
project + active entitlement + building revision + queued setup
  ↓
自動初期設定
  ├ site fetch
  ├ site analysis
  ├ category generation
  ├ competitor candidates 12件
  ├ persona / topic generation
  └ prompt generation 50 / 100 / 200件
  ↓
設定品質ゲート
  ↓
project active
  ↓
同日初回正式日次cycle
  ↓
解析・候補Generation・品質検査・自動公開
  ↓
current publication pointer
  ↓
顧客表示
```

### 5.2 顧客ユーザー招待の位置

customer user招待は、契約・project作成と独立して行える。

```text
InviteCustomerUser
  ↓
customer_user invited
  ↓
招待outbox
  ↓
配送system event
  ↓
本人確認
  ↓
customer_user active
```

customer userがactiveでも、customer accessが停止中、契約・entitlementが無効、公開可能版がない場合は対象projectを表示しない。

### 5.3 初期設定例外

```text
setup run exception
  ↓
quality_exception_case.case_type = setup
  ↓
project remains setup_in_progress
  ↓
formal daily cycleは作らない
  ↓
顧客画面は準備中
```

顧客管理は原因と入力・生成物を確認し、次のいずれかを実行する。

```text
RetryProjectSetup
RetryProjectSetupWithInputCorrection
品質・例外レビューへ移動
```

### 5.4 運用中プロジェクトの設定更新

```text
CreateProjectConfigurationRevision
  ↓
新しいbuilding revision + queued setup run
  ↓
旧active revision・進行中cycle・current pointerを維持
  ↓
サイト取得・分析・生成・設定品質ゲート
  ├ 通過
  │  ↓
  │ 契約・entitlement・AIモデル・prompt tierを再検査
  │  ↓
  │ 新revisionをactive、旧revisionをsuperseded
  │  ↓
  │ 以後に作るcycleだけ新revisionを参照
  └ 失敗
     ↓
     新revisionをinvalid
     ↓
     現行設定・現在公開版を継続
```

1projectで同時に進められる非終端revisionは最大1件とする。新revisionのactive化後、旧revisionを参照する未公開candidateは新規公開不可とするが、既に公開済みのcurrent versionは次の安全な公開まで維持する。

### 5.5 契約停止

```text
contract active -> suspended
  ↓
翌回または同日再評価の日次対象判定でintentionally_excluded
  ↓
project entitlementはactiveのまま保持可能
  ↓
current publication pointerは保持
  ↓
顧客表示は不可
```

契約再開では、active entitlementを再検査する。expiredまたはrevoked entitlementを自動復活させない。

### 5.6 顧客アクセス停止

```text
customer.access_control enabled -> suspended_by_admin
  ↓
顧客セッション無効化
  ↓
顧客ログイン・顧客API拒否
  ↓
測定・解析・候補生成・pointerは継続または維持
```

顧客アクセス停止を、契約停止、project測定停止、公開停止として扱わない。

---

## 6. 顧客管理ローカルナビゲーション

顧客管理の全routeで、ページタイトル直下に次を表示する。

```text
顧客
プロジェクト
契約
お問い合わせ [new件数]
```

### 6.1 表示規則

- サイドバーは「顧客管理」1項目のままとする。
- ローカルナビゲーションは44px高を基本とする。
- 現在routeに対応する項目をactive表示する。
- 問い合わせだけ、scope内 `status = new` の件数を小さく表示できる。
- 顧客・project・契約の全件数をbadgeとして常時表示しない。
- capabilityがない項目は非表示とする。
- 非表示項目の件数、余白、tooltipから存在を推測できないようにする。
- customer detail、project detail、contract detail、inquiry detailでもローカルナビゲーションを維持する。

### 6.2 Scope selectorとの関係

- global/customer/project scopeは共通context barを使用する。
- customer detailでは対象customerを固定contextとして表示するが、認可scopeを拡大しない。
- project detailでは対象projectと親customerを表示する。
- inquiryがproject未関連の場合、customer scopeだけを表示する。
- scope変更時は一覧、facet、件数、ローカル問い合わせbadgeを同じread snapshotで更新する。

---

## 7. 共通画面動作

### 7.1 Page header

各一覧のheaderは次で構成する。

```text
ページタイトル
短い責任説明
主要作成action 0〜1件
補助action menu
更新時刻・freshness
```

例:

```text
顧客
顧客、契約、プロジェクト、アクセス状況を確認します。
[顧客を追加]
```

### 7.2 Filter bar

- 検索、主要facet、追加filter、並び順、clearを1行に置く。
- 1366pxで収まらない追加filterはpopoverに入れる。
- filter変更中も既存一覧を保持し、全面skeletonへ戻さない。
- URL queryへ非機微filterを反映する。
- email検索値を共有可能URLへ残さない。
- facet countはitemsと同じscope・snapshotで計算する。

### 7.3 Table

- 行全体クリックで詳細へ遷移する。
- 行末はkebab menuとし、W1の限定操作だけを置ける。
- W2・W3は詳細または共通確認画面を経由する。
- table内inline編集を行わない。
- statusは1つの主表示と最大2つの補助flagに抑える。
- 内部IDを主列へ常時表示しない。copy actionは権限に応じて提供できる。
- 行高は48pxを基本とし、問い合わせ本文excerptを持つ行だけ64pxまで許可する。

### 7.4 Freshness

- 一覧はbackground refreshを使用する。
- setup進行中のproject detailは通常一覧より短い間隔で更新できる。
- `freshness_state = stale / unknown` の場合、正常件数や完了を推測しない。
- stale中のW1はcommandごとに再読込を要求できる。
- stale中のW2・W3は実行前に最新readを取得し、取得できなければ停止する。
- background refreshで管理者が入力中のformを上書きしない。

### 7.5 Timeline

詳細ページの「履歴」は次を統合する。

```text
audit_log
＋ system_event
＋ contract version適用
＋ setup run状態遷移
＋ inquiry status遷移
```

同じ管理操作を重複表示しない。管理者要求と、その後の非同期処理完了は別事実として表示する。

---

## 8. 顧客一覧 `/admin/customers`

### 8.1 目的

顧客一覧は、顧客数を眺める画面ではなく、導入停滞、アクセス停止、契約不足、初期設定例外、新規問い合わせを見つける入口とする。

### 8.2 使用read model

```text
ListCustomers
CustomerAdminSummary
SidebarBadge
```

必ず次を同じresponseで返す。

```text
items[]
facet_counts
pagination
read_snapshot_id
read_snapshot_at
freshness_state
scope_context
redacted_sections[]
```

### 8.3 標準列

| 列 | 内容 |
|---|---|
| 顧客 | 顧客名、主連絡先名。emailは権限に応じてmask |
| 導入・運用状態 | read modelで導出した顧客主表示 |
| プロジェクト | 合計、運用中、初期設定中、設定例外 |
| 契約 | active / suspended / ended / 契約なし、適用予定の有無 |
| 顧客アクセス | 利用可能 / 管理者停止 / システム停止 |
| お問い合わせ | new、対応中。resolvedは主列に常時出さない |
| 最終活動 | scope内の重要な最終活動時刻 |
| 行操作 | 詳細、限定W1 action |

### 8.4 顧客主表示の優先順位

```text
1. access blocked_by_system
2. access suspended_by_admin
3. setup exceptionあり
4. active contractなし、かつended contractあり
5. active contractなし、かつsuspended contractあり
6. active contractなし
7. projectなし
8. setup_in_progressあり
9. operational attentionあり
10. active projectがあり、顧客内active projectのcurrent pointer数が0
11. active projectあり
12. 状態不明
```

複数projectの一部だけが要対応の場合は、主表示を「要対応」としつつ、補助文に対象数を示す。

例:

```text
要対応
1 / 3プロジェクトで初期設定例外
```

### 8.5 Facet

```text
すべて
顧客アクセス停止
初期設定の要対応
契約の要対応
プロジェクト未作成
新規問い合わせあり
```

filter:

```text
customer access
contract status
project lifecycle
setup status
has open inquiry
created date
last activity range
```

### 8.6 検索

検索対象:

```text
顧客名
主連絡先名
許可時のみ主連絡先emailのexact/prefix
project名
site host
```

- 部分一致を顧客IDの列挙手段にしない。
- scope外の一致件数を返さない。
- 0件時はfilter 0件と顧客未登録を分ける。

### 8.7 標準sort

```text
要対応あり
→ access停止
→ new inquiryあり
→ last_activity_at desc
→ customer_id desc
```

任意sort:

```text
顧客名
作成日
最終活動
新規問い合わせ数
```

### 8.8 行操作

一覧行に置けるもの:

```text
詳細を開く
プロジェクトを追加（条件を満たす場合）
問い合わせを見る（open inquiryあり）
```

次は一覧行から直接実行しない。

```text
顧客アクセス停止・再開
契約停止・終了
customer user取消
project終了
```

### 8.9 Empty state

顧客未登録:

```text
顧客はまだ登録されていません。
顧客を追加し、契約とプロジェクトの準備を始めます。
[顧客を追加]
```

filter 0件:

```text
条件に一致する顧客はありません。
[条件を解除]
```

権限なしを0件empty stateとして表示しない。

---

## 9. 顧客作成 `/admin/customers/new`

### 9.1 目的

顧客を識別し、後続の契約・project・customer userを関連付ける最小の顧客マスタを作成する。

### 9.2 入力項目

| 項目 | 必須 | 規則 |
|---|---:|---|
| 顧客名 | 必須 | 1〜200文字。前後空白を除去 |
| 主連絡先名 | 任意 | 1〜120文字 |
| 主連絡先メール | 任意 | 正規化・形式検証。顧客ユーザーを自動作成しない |
| 管理用メモ | P0では作らない | 顧客マスタへ自由記述欄を増やさない |

保存時の初期値:

```text
customer.access_control = enabled
```

### 9.3 重複候補

顧客名一致だけをhard rejectにしない。入力中または確認前に、次の候補を表示できる。

```text
類似顧客名
同じメールdomain
同じsite hostを持つ既存project
```

表示は警告であり、別法人・別部門として作成可能とする。

機微情報の表示は `customer.sensitive.read` に従う。

### 9.4 Submit

`CreateCustomer` はW1。

request:

```text
customer_name
primary_contact_name?
primary_contact_email?
expected_reference_version
idempotency_key
```

成功:

```text
/admin/customers/[customerId]
```

へ遷移し、次の導入stepを表示する。

```text
顧客を登録しました。
次に契約を作成します。
[契約を作成]
```

### 9.5 禁止事項

- 顧客作成と同時に自動でcontractを作らない。
- 主連絡先emailからcustomer userを暗黙作成しない。
- 重複候補があるだけで既存customerへmergeしない。
- 作成後に「顧客作成完了」を運用開始と表現しない。

---

## 10. 顧客詳細 `/admin/customers/[customerId]`

### 10.1 Header

```text
顧客名
顧客アクセス状態
導入・運用状態
主連絡先
最終更新
主要action
補助action menu
```

主要actionは現在状態に応じて最大1件。

例:

```text
active contractなし  → 契約を作成
project枠あり・projectなし → プロジェクトを追加
new inquiryあり → 問い合わせを確認
```

W3操作は補助action menuの下部に分離する。

### 10.2 顧客詳細内タブ

```text
概要
プロジェクト
契約・利用権限
顧客ユーザー
お問い合わせ
履歴
```

query parameterで表現できる。

```text
/admin/customers/[customerId]?tab=projects
```

URLを分けてもread modelは `GetCustomerDetail` の同一snapshotを基礎にする。

### 10.3 概要タブ

12カラム:

```text
導入・運用状況             8カラム
顧客アクセス               4カラム

プロジェクト               8カラム
契約・利用可能枠           4カラム

新しいお問い合わせ         8カラム
最近の重要履歴             4カラム
```

#### 導入・運用状況

保存したprogress率を表示しない。正式事実を順に表示する。

```text
顧客登録
契約適用
プロジェクト作成
初期設定
初回正式測定
初回公開
```

状態:

```text
未開始
処理中
完了
要対応
対象外
状態不明
```

顧客ユーザー招待は運用開始の必須条件ではないため、同じ直列progressへ混ぜず、顧客アクセスcardで扱う。

#### 顧客アクセス

表示:

```text
customer access control
active customer user数
invited customer user数
last access control change
実効アクセス説明
```

例:

```text
顧客アクセスは停止中です。
測定と公開版生成は継続し、現在公開版pointerも保持しています。
```

#### プロジェクト

最大5件の要約を表示する。

```text
project名
主状態
setup/current stage
契約・entitlement
顧客表示安全状態
```

#### 契約・利用可能枠

```text
active plan
有効期間
project capacity
allocated project count
available slots
scheduled change
```

金額、請求、粗利は表示しない。

#### 新しいお問い合わせ

newを優先し、最大3件。

```text
subject
sender
received_at
assignee
```

### 10.4 プロジェクトタブ

顧客に属するprojectを `ProjectCurrentOperationalSummary` で表示する。

標準列:

```text
project
状態
初期設定または当日工程
契約・entitlement
prompt tier / AI models
現在公開版
最終活動
```

projectごとの強い操作は詳細へ移動する。

### 10.5 契約・利用権限タブ

```text
active contract
scheduled contract version
version history要約
project capacity
project entitlement一覧
```

各entitlement:

```text
project
status
contract version
prompt tier
AI models
valid from/to
```

contractとentitlementを同じstatus列へ合成しない。

### 10.6 顧客ユーザータブ

後述の顧客アクセス・customer user仕様を使用する。

### 10.7 お問い合わせタブ

顧客に属するnew/in_progressを優先し、resolvedも期間filterで閲覧できる。

### 10.8 履歴タブ

対象:

```text
顧客情報更新
顧客アクセス停止・再開
customer user招待・停止・取消
contract作成・version適用・停止・終了
project作成・setup開始・activation
inquiry status変更
```

raw payload、token、メール本文全文をtimelineへ複製しない。

---

## 11. 顧客アクセスと顧客ユーザー

### 11.1 顧客アクセス制御

状態:

```text
enabled
suspended_by_admin
blocked_by_system
```

表示label:

```text
利用可能
管理者により停止
システムにより停止
```

#### SuspendCustomerAccess

W3。

確認画面に表示する。

```text
対象顧客
active customer user数
表示可能project数
現在公開版pointer数
影響: 顧客ログイン・顧客APIを停止
維持: 測定、解析、候補生成、契約、pointer
理由
customer名の再入力
```

成功後:

- 既存顧客セッションを無効化する。
- customer accessを `suspended_by_admin` にする。
- project automation、publication control、contract、pointerを変更しない。

#### ResumeCustomerAccess

W2。

対象は `suspended_by_admin` だけ。

確認画面に表示する。

```text
active customer user数
再表示可能になるproject数
契約・entitlement・publication条件を満たさず引き続き非表示のproject数
理由
最新の契約・entitlement・publication条件
```

`blocked_by_system` は通常resumeを表示しない。障害回復と安全再検査を経由する。

### 11.2 Customer user一覧

標準列:

```text
氏名・email
status
実効アクセス
主連絡先
招待・最終ログイン
最終活動
操作
```

status:

```text
invited
active
suspended
revoked
```

表示用flag:

```text
招待期限切れ
配送失敗
customer access停止の影響
```

これらをcustomer user statusとして保存しない。

### 11.3 InviteCustomerUser

W2。

入力:

```text
display_name
email
is_primary_contact
```

確認:

```text
送信先email
対象顧客
customer access現在状態
招待後のアクセス範囲: 顧客単位
```

transaction:

```text
customer_user invited
＋ invitation outbox
＋ audit log accepted
```

配送結果はsystem event。

### 11.4 ResendCustomerUserInvite

- `status = invited` のみ。
- 旧tokenを無効化する。
- 新しい期限と新tokenでoutboxを作る。
- 平文tokenをresponse、DB、auditへ返さない。
- 連打によるメール大量送信をrate limitする。

### 11.5 SuspendCustomerUser

W2。

- invitedまたはactiveからsuspendedへ変更できる。
- 対象userのsessionを無効化する。
- 顧客全体のaccess controlや他userへ影響させない。

### 11.6 ResumeCustomerUser

W2。

- suspendedからactiveへ戻す。
- customer accessが停止中の場合、user statusはactiveでも実効アクセスはblockedのままと表示する。

### 11.7 RevokeCustomerUser

W3。

- invited、active、suspendedからrevokedへ変更する。
- emailまたは表示名のtyped confirmationを要求する。
- revokedは終端状態。
- 同じmembership行を再有効化しない。
- 再招待時は新しいcustomer_userを作成する。

### 11.8 主連絡先

`SetPrimaryCustomerContact` はW1。

- customer userを主連絡先に設定できる。
- customer userを作らず、顧客マスタ上の連絡先だけを保持することも許可する。
- revoked userを主連絡先として新規設定しない。
- 主連絡先変更はcustomer userのアクセス権を変更しない。

---

## 12. 契約一覧 `/admin/contracts`

### 12.1 目的

契約一覧は、契約本文を管理するだけでなく、projectを作成・継続できる利用権限の現在状態と、適用予定変更を確認する画面とする。

### 12.2 使用read model

```text
ListContracts
ContractAdminSummary
```

### 12.3 標準列

| 列 | 内容 |
|---|---|
| 契約・顧客 | 契約short ID、顧客名 |
| 状態 | draft / active / suspended / ended |
| 現在のプラン | active plan version、version番号 |
| 有効期間 | effective from/to |
| プロジェクト枠 | allocated / capacity、available slots |
| 適用予定 | scheduled plan、適用日時 |
| 利用権限の問題 | entitlement issue count |
| 最終変更 | last changed at |

### 12.4 Facet・filter

```text
すべて
draft
active
suspended
ended
適用予定あり
project枠あり
entitlement要確認
```

filter:

```text
customer
plan version
status
effective date
scheduled effective date
available project slots
```

### 12.5 Sort

標準:

```text
entitlement issueあり
→ suspended
→ scheduled changeが近い
→ last_changed_at desc
```

### 12.6 Action

一覧からは詳細遷移だけを基本とする。

- 新規契約作成のglobal buttonを置かない。
- 顧客を選ばずに契約を作成しない。
- 契約停止・終了を一覧行で即時実行しない。

empty stateでは顧客一覧への遷移を示す。

---

## 13. 契約詳細 `/admin/contracts/[contractId]`

### 13.1 Header

```text
契約識別
顧客
contract status
active version
有効期間
主要action
```

主要action例:

```text
draft contract → draftを編集
active contract・draft versionあり → versionを適用
active contract・枠あり → 顧客のproject作成へ
suspended contract → 契約を再開
```

### 13.2 タブ

```text
概要
契約version
利用権限
関連プロジェクト
履歴
```

### 13.3 概要

12カラム:

```text
現在の契約内容          8
project枠               4
適用予定変更            8
影響要約                4
関連project             12
```

表示する契約内容:

```text
plan version
prompt tier
allowed AI models
project capacity
effective from/to
```

表示しない内容:

```text
請求額
粗利
原価
通貨換算
請求照合
```

### 13.4 CreateContract

顧客詳細から640px drawerまたはdedicated form stateで開く。独立routeは持たない。

入力:

```text
plan version
initial effective from
initial effective to optional
```

結果:

```text
contract.status = draft
contract_version.status = draft
```

作成だけではprojectを作れない。初回versionの適用が必要である。

### 13.5 CreateContractVersion

- active、suspended、draft contractに新しいdraft versionを作れる。
- 現在versionの値を初期値として複製できる。
- 新versionは独立した不変化前のdraftである。

### 13.6 UpdateDraftContractVersion

W1。

編集可能:

```text
plan version
project capacity
prompt tier
allowed AI models
effective period proposal
```

実際の値はplan versionの正式定義に従い、画面側で自由な数値を作らない。

禁止:

```text
scheduled / active / superseded / cancelledの直接編集
active version上書き
過去version削除
```

### 13.7 ActivateContractVersion

W2。

impact preview:

```text
現在version
新version
対象project数
project capacity差分
prompt tier差分
AIモデル差分
新しいentitlement set
失効するentitlement set
running cycle数
current pointer数
customer access will change = false
```

適用は原子的に行う。

```text
new version -> active
old version -> superseded
new entitlement set -> active
old entitlement set -> expired
contract -> active
```

既存cycleが参照するcontract versionとconfiguration revisionは差し替えない。

### 13.8 ScheduleContractVersion

W2。

入力:

```text
scheduled effective at
business timezone
```

- 過去日時を許可しない。
- 同一契約のscheduled versionは最大1件。
- 適用時に契約・capacity・entitlementを再検査する。
- 適用失敗時はscheduledのまま保持し、契約・公開例外を作る。

### 13.9 CancelContractVersion

W2。

対象:

```text
draft
scheduled
```

active、superseded、cancelledは対象外。

scheduled取消では適用予定だけを取消し、現在active version・entitlement・pointerを変更しない。

### 13.10 SuspendContract

W3。

確認画面:

```text
対象顧客
active project数
翌回日次で対象外になるproject数
running cycle数
current pointer数
顧客表示が停止するproject数
customer access自体は変わらない
理由
```

- 契約をsuspendedへ変更する。
- entitlementを一括status変更しない。
- 既にrunningのcycleを自動停止するかは測定安全規則で判断し、契約画面だけで強制停止しない。
- 新しい正式日次は対象外となる。
- current pointerは保持するが、契約がactiveでないため顧客表示は不可。

### 13.11 ResumeContract

W3。

- suspendedだけを対象とする。
- endedは再開不可。
- active version、entitlement、期限、AIモデルcontrolを再検査する。
- expired/revoked entitlementを復活させない。
- 再開後もcustomer accessやpublication controlが停止中なら顧客表示は再開しない。

### 13.12 EndContract

W3、契約short IDまたは指定確認文を再入力する。

結果:

```text
contract -> ended
active entitlement -> expired
scheduled version -> cancelled
project lifecycleは維持
current pointerは保持
```

project終了は別commandとする。

---

## 14. プロジェクト一覧 `/admin/projects`

### 14.1 目的

project一覧は、各projectの初期設定、契約・entitlement、当日運用、顧客表示の安全状態を横断して確認する入口とする。

### 14.2 標準列

| 列 | 内容 |
|---|---|
| プロジェクト | project名、顧客、site host |
| 主状態 | `ProjectCurrentOperationalSummary.primary_display_state` |
| 初期設定・現在工程 | setup stageまたは当日cycle stage |
| 契約・利用権限 | contract status、entitlement status |
| 測定条件 | prompt tier、AI model要約 |
| 顧客表示 | 準備中、現在版、前回版維持、公開停止、access停止 |
| 最終活動 | last operational activity |

### 14.3 Facet

```text
すべて
初期設定中
初期設定の要対応
運用中
測定停止中
契約・利用権限の対象外
顧客アクセス停止
公開停止
終了
```

filter:

```text
customer
lifecycle status
primary display state
setup stage
contract status
entitlement status
prompt tier
AI model
has open inquiry
```

### 14.4 主表示と補助flag

主表示は状態モデルの優先順位を使う。補助flagとして次を最大2件返せる。

```text
new inquiryあり
Critical/High incident関連
scheduled contract changeあり
stale
```

同じ異常を主表示と補助flagへ重複表示しない。

### 14.5 行操作

```text
詳細を開く
初期設定例外を見る
現在公開版を見る
```

CreateProjectのglobal buttonは置かず、顧客を選択する導線を使う。

```text
[プロジェクトを追加]
  ↓
顧客選択
  ↓
/admin/customers/[customerId]/projects/new
```

対象顧客がscope外、active契約なし、枠なしの場合はcreate commandを返さない。

---

## 15. プロジェクト作成 `/admin/customers/[customerId]/projects/new`

### 15.1 前提検査

form表示時に `GetProjectCreateReference` を取得する。

必須条件:

```text
customerがscope内
customer.access_controlは作成可否へ直接使用しない
active contractあり
active contract versionあり
available project slot > 0
allowed AI modelが1件以上
prompt tierが50 / 100 / 200のいずれか
```

customer accessが停止中でもproject作成自体は可能だが、確認画面へ「顧客アクセス停止中」と表示する。

### 15.2 入力項目

| 項目 | 必須 | 入力規則 |
|---|---:|---|
| プロジェクト名 | 必須 | 1〜160文字 |
| 対象サイトURL | 必須 | `https`を優先。public HTTP(S) URL |
| 対象ブランド名 | 必須 | 1〜160文字 |
| 対象地域 | 必須 | 許可された地域option |
| 言語 | 必須 | 許可された言語option |
| 対象AIモデル | 必須 | contract/planで許可された中から1件以上 |
| prompt tier | 必須 | 50 / 100 / 200。planが固定ならread-only |
| 契約version | 必須 | active version。通常read-only |

### 15.3 入力しないもの

```text
競合企業名
カテゴリ
ペルソナ
トピック
個別prompt
測定スケジュール
公開承認者
顧客別原価予算
```

これらは自動生成またはP1以降とする。

### 15.4 URL安全検査

client側検証だけを信用しない。command transactionまたは事前安全serviceで次を検査する。

- schemeはHTTP(S)だけ。
- URL credentialを禁止する。
- localhost、loopback、private address、link-local、metadata endpointを禁止する。
- DNS解決後もprivate addressへ向かわないことを確認する。
- redirect先でも同じ検査を行う。
- port allowlistを適用する。
- URL fragmentを保存しない。
- normalized hostを保存する。
- tenant境界・既存project重複候補を検査する。

同じhostを持つprojectは警告できるが、複数ブランドや別地域の正当なprojectを一律拒否しない。

### 15.5 Form構成

```text
対象顧客・契約         読み取りsummary
基本情報               project名、URL、ブランド
測定範囲               地域、言語、AIモデル、prompt tier
自動生成される内容     カテゴリ、競合12件、persona/topic、prompt set
```

右側summary:

```text
plan
project枠 remaining
想定prompt数
対象AIモデル数
作成後の処理
```

### 15.6 作成内容の確認

確認画面へ次を表示する。

```text
顧客
プロジェクト名
対象site host
ブランド
地域・言語
AIモデル
prompt tier
使用contract version
project枠 before / after

作成後:
- 自動初期設定を開始
- 設定品質ゲート通過後にprojectをactive化
- 同日の正式日次cycleを自動作成し得る
- 自動品質検査・自動公開へ進み得る
- AI利用量と内部原価が発生し得る
```

ボタンlabel:

```text
プロジェクトを作成して初期設定を開始
```

### 15.7 Command

request:

```text
customer_id
contract_id
contract_version_id
project_name
target_site_url
target_brand_name
target_region
target_language
target_ai_models[]
prompt_count_tier
expected_customer_row_version
expected_contract_row_version
expected_capacity_version
idempotency_key
```

server側で再検査する。

### 15.8 原子的作成

```text
project
project_entitlement active
project_configuration_revision building
project_setup_run queued
setup start outbox
success audit_log
```

途中失敗時に孤立projectを残さない。

非同期開始後は次を表示する。

```text
プロジェクトを作成し、初期設定を受け付けました。
```

「初期設定が完了しました」とは表示しない。

成功後:

```text
/admin/projects/[projectId]?tab=setup
```

へ遷移する。

---

## 16. プロジェクト詳細 `/admin/projects/[projectId]`

### 16.1 Header

```text
project名
顧客
主状態
customer safe display
site host
prompt tier / AI models
last updated / freshness
主要action
```

主状態と顧客表示状態を分ける。

例:

```text
主状態: 要対応・初期設定
顧客表示: 準備中
```

```text
主状態: 顧客アクセス停止・測定継続
現在版: v12 pointer保持
```

### 16.2 タブ

```text
概要
初期設定
設定内容
関連・履歴
```

測定・品質・公開の全文タブを顧客管理内に複製しない。概要から専門詳細へ遷移する。

### 16.3 概要タブ

12カラム:

```text
現在状態・安全表示           8
契約・entitlement             4

初期設定または当日進行       8
現在公開版                    4

要対応・問い合わせ           8
最近の履歴                    4
```

#### 現在状態・安全表示

```text
project lifecycle
measurement automation control
publication control
customer access
contract status
entitlement status
current pointer
```

を別行で表示する。1つの「status」に潰さない。

#### 初期設定または当日進行

- setup_in_progressではsetup progressを表示する。
- activeでは当日のformal cycle要約を表示する。
- additional validationを正式日次として混ぜない。

#### 現在公開版

```text
current pointer version
customer visible true/false
非表示理由
last delivery verification
latest ready candidate
```

操作は公開管理へのlinkだけ。

### 16.4 初期設定タブ

後述する8工程と生成物を表示する。

### 16.5 設定内容タブ

表示する。

```text
project name
target site URL
target brand
target region
language
AI models
prompt tier
configuration revision
contract version
entitlement
```

P0のwrite:

```text
UpdateProjectMetadata
RetryProjectSetupWithInputCorrection（setup_in_progressのみ）
CreateProjectConfigurationRevision（activeのみ）
```

設定fieldを画面内で直接上書きしない。active projectでは、現在設定と変更後設定の差分をW2 dialogで確認し、新しいconfiguration revisionを作成する。

### 16.6 運用中の設定revision更新

表示条件:

```text
project.lifecycle_status = active
active contract versionあり
active entitlementあり
active configuration revisionあり
非終端configuration revisionなし
project.automation_control != blocked_by_system
project.configuration.manageあり
```

`GetProjectConfigurationRevisionReference` から次を取得する。

```text
現在設定
変更可能fieldと許可値
active contract・entitlement
進行中cycle要約
current publication safe state
expected row versions
available command
```

変更可能field:

```text
target site URL
target brand
target region
language
AI model selection
prompt tier
```

contract ID、contract version ID、entitlement IDはserverが正式状態から固定し、管理者入力で上書きさせない。

W2確認文:

```text
新設定の検査中も、現在の設定・測定・公開版は維持されます。
新設定は品質ゲート通過後だけ自動的に切り替わります。
```

実行中はactive revisionとbuilding revisionを分離して表示する。

```text
現在運用中 v3
構築中 v4 / 競合候補生成
顧客表示: 現在公開版を継続
```

失敗時:

```text
設定更新失敗・現行版継続
```

と表示し、projectをsetup_in_progressへ戻さない。

### 16.7 関連・履歴タブ

```text
open quality cases
linked incidents
open inquiries
measurement cycleへのlink
publication candidate/versionへのlink
setup run history
unified timeline
```

### 16.8 Project action

| Action | 条件 | Risk | 実行場所 |
|---|---|---:|---|
| `UpdateProjectMetadata` | closed以外 | W1 | 顧客管理 |
| `RetryProjectSetup` | setup exception等 | W1 | 顧客管理 |
| `RetryProjectSetupWithInputCorrection` | setup_in_progress | W2 | 顧客管理 |
| `CreateProjectConfigurationRevision` | active・非終端revisionなし | W2 | 顧客管理 |
| `CloseProject` | closed以外 | W3 | 顧客管理 |
| 測定停止・再開 | active | W3 | 測定管理へ遷移 |
| 品質decision | open case | W2 | 品質・例外へ遷移 |
| 公開停止・再開 | publication対象 | W3 | 公開管理へ遷移 |

### 16.9 CloseProject

W3、project名のtyped confirmationを要求する。

- project lifecycleをclosedへ変更する。
- 新しい正式日次対象から除外する。
- 現在pointerの保持・顧客表示の扱いは公開安全規則へ従う。
- 過去cycle、artifact、publication version、auditを削除しない。
- P0でclosedからactiveへ直接戻さない。

---

## 17. 自動初期設定と生成物表示

### 17.1 8工程

```text
1. サイト取得             site_fetch
2. サイト分析             site_analysis
3. カテゴリ生成           category_generation
4. 競合候補生成           competitor_generation
5. ペルソナ・トピック生成 persona_topic_generation
6. プロンプト生成         prompt_generation
7. 品質検査               quality_check
8. 運用開始               activation
```

各工程の表示state:

```text
pending
running
completed
exception
skipped
```

`configuration_assembly` など内部工程を独立した9工程目にしない。必要なら補助labelで表示する。

### 17.2 Progress UI

縦型stepperを標準とする。

各step:

```text
工程名
状態
開始・完了時刻
短い結果要約
例外reason
関連artifact
```

正常案件へ承認buttonを置かない。

### 17.3 Setup exception

exception stepを赤一色で過度に強調せず、次を明確に表示する。

```text
失敗した工程
安全状態: 顧客画面は準備中
正式日次: 未作成
自動再試行結果
関連quality case
```

利用可能action:

```text
同じ入力で再試行
入力を訂正して再試行
品質・例外レビューを開く
```

### 17.4 サイト分析

表示:

```text
analysis summary
service summary
source page count
captured at
analysis model version
```

要約文の根拠markerからevidence drawerを開ける。

### 17.5 根拠drawer

```text
source URL
page title
source type: description / heading / body
heading level
excerpt summary
captured at
used for
```

- raw HTMLを返さない。
- Authorization header、cookie、tokenを返さない。
- 長い本文全文を無制限に表示しない。
- 外部URLを開く場合は安全なlink処理を行う。

### 17.6 カテゴリ

```text
primary category
candidate categories
rank
rationale summary
source evidence count
```

- 初期値として「その他」を固定表示しない。
- 自動生成候補をinline編集しない。
- 重複、根拠不足、不正categoryはquality gateへ送る。

### 17.7 競合候補

必ず12件を期待する。

```text
rank
competitor name
candidate reason
evidence count
selection state
```

- 12件未満はquality finding。
- 同名・alias重複を検査する。
- 顧客運用担当が候補名を直接書き換えない。
- 問題がある場合は新generationの競合setまたは再setupを作る。

### 17.8 ペルソナ・トピック

```text
persona count
personas summary
topic count
topics summary
persona-topic links
```

P0では顧客運用担当向けに要約表示を基本とし、巨大payloadを初期描画へ含めない。

### 17.9 Prompt set

表示:

```text
prompt tier 50 / 100 / 200
actual prompt count
non-branded
branded
comparison
citation_check
other
version
status
```

- customer operatorにはmetadataとdistributionを返す。
- prompt全文は測定payload閲覧権限を持つ管理者だけ遅延取得する。
- brandedをAI表示率の主要集計へ混ぜないというtaxonomyを維持する。
- prompt本文を顧客管理から直接編集しない。

### 17.10 Setup history

過去runを削除しない。

```text
run number
trigger source
configuration revision
status
last stage
started/completed
linked case
```

最新runだけを「現在」とし、過去runは履歴として折りたたむ。

---

## 18. 問い合わせ一覧 `/admin/inquiries`

### 18.1 目的

顧客ポータルから届いた問い合わせを見落とさず、担当、対応中、解決済みを一貫して管理する。

### 18.2 タブ

```text
新規
対応中
解決済み
```

件数:

- サイドバーと顧客管理ローカルnavのbadgeはnewだけ。
- 顧客詳細の未解決件数はnew + in_progress。
- resolvedをbadgeへ含めない。

### 18.3 標準列

| 列 | 内容 |
|---|---|
| 状態 | new / in_progress / resolved |
| 問い合わせ | subject、body excerpt |
| 顧客・project | customer必須、project任意 |
| 送信者 | 氏名、許可時のみemail |
| 受信 | received at、経過時間 |
| 担当 | assigneeまたは未割当 |
| 内部記録 | note count、last note |
| 通知 | delivered / retrying / failed / unknown |

行高は64pxまで許可する。

### 18.4 Sort

new:

```text
未割当
→ received_at asc
→ inquiry_id asc
```

in_progress:

```text
未割当
→ last_activity_at asc
→ received_at asc
```

resolved:

```text
resolved_at desc
→ inquiry_id desc
```

### 18.5 Filter

```text
customer
project
assignee
received date
notification state
has internal note
```

P0で自由な優先度fieldを作らない。経過時間と受信日時で判断する。

### 18.6 行action

W1だけを限定して置ける。

```text
担当する
対応を開始
詳細を開く
```

解決、再開、project関連変更は詳細で行う。

### 18.7 Empty state

new 0件:

```text
新しいお問い合わせはありません。
```

これは正常状態として表示する。ただしread freshnessがstale/unknownなら0件と断定しない。

---

## 19. 問い合わせ詳細 `/admin/inquiries/[inquiryId]`

### 19.1 Header

```text
status
subject
customer / project
sender
received at
assignee
主要action
```

主要action:

```text
new・未割当 → 対応を開始
in_progress → 解決する
resolved → 再開する
```

### 19.2 Layout

12カラム:

```text
受信メッセージ             8
状態・担当                 4

内部メモ・対応記録         8
顧客・project context      4

通知イベント               8
最近の履歴                 4
```

### 19.3 受信メッセージ

不変表示:

```text
subject
body
sender name
sender email
received at
source channel = customer_portal
```

- 編集buttonを置かない。
- emailは権限に応じてmaskする。
- HTMLを受信する場合はsanitizeした表示を使う。
- 外部linkを安全に扱う。

### 19.4 担当者

`AssignInquiry` はW1。

- 担当変更だけではstatusを変更しない。
- 未割当に戻すことを許可できる。
- scope外adminを候補へ含めない。

`StartInquiryHandling` はW1。

```text
assignee設定または現在担当を維持
＋ status new -> in_progress
```

### 19.5 Project関連

`RelinkInquiryProject` はW1。

- projectなしへ戻せる。
- 同一customerのprojectだけを候補にする。
- 別customer project IDを直接送信されても拒否する。
- 関連変更は監査対象。

### 19.6 内部メモ

`AddInquiryInternalNote` はW1。

note type:

```text
internal
correction
```

- 既存noteを編集・削除しない。
- correctionは対象note IDを必須にする。
- 受信本文を内部メモへ複製しない。
- 内部メモを顧客画面へ返さない。

### 19.7 解決

`ChangeInquiryStatus` でresolvedへ変更する。

必須:

```text
resolution note
expected row version
idempotency key
```

result:

```text
customer_inquiry.status = resolved
customer_inquiry_note.note_type = resolution
```

同一transactionで保存する。

### 19.8 再開

`ReopenInquiry` はresolvedだけ。

必須:

```text
reopen reason
```

result:

```text
status = in_progress
note_type = reopen_reason
```

### 19.9 通知状態

表示:

```text
通知要求
配送成功
再試行
配送失敗
```

通知失敗でinquiry statusを変更しない。

P0の問い合わせ画面から通知先を編集しない。管理設定へ遷移する。

### 19.10 外部返信

画面上部またはメモ欄近くに明示する。

```text
P0ではこの画面から顧客への返信は送信されません。
内部メモは顧客には表示されません。
```

返信button、メールcomposer、chat inputを置かない。

---

## 20. 操作・risk・確認UI

### 20.1 顧客管理command matrix

| Command | Risk | 主な確認 |
|---|---:|---|
| `CreateCustomer` | W1 | 入力確認、duplicate warning |
| `UpdateCustomer` | W1 | row version |
| `SuspendCustomerAccess` | W3 | step-up、理由、影響、顧客名入力 |
| `ResumeCustomerAccess` | W2 | 理由、再表示影響、契約・entitlement再検査 |
| `InviteCustomerUser` | W2 | 顧客、email、顧客単位アクセス |
| `ResendCustomerUserInvite` | W1 | 送信先、rate limit |
| `SuspendCustomerUser` | W2 | user、session影響 |
| `ResumeCustomerUser` | W2 | user、customer access状態 |
| `RevokeCustomerUser` | W3 | step-up、emailまたは氏名入力 |
| `SetPrimaryCustomerContact` | W1 | 対象user |
| `CreateContract` | W1 | 顧客、draft作成 |
| `CreateContractVersion` | W1 | 複製元version |
| `UpdateDraftContractVersion` | W1 | draft、row version |
| `ActivateContractVersion` | W2 | entitlement差分、対象project |
| `ScheduleContractVersion` | W2 | 適用日時、差分 |
| `CancelContractVersion` | W2 | draft/scheduled、現行版維持 |
| `SuspendContract` | W3 | 日次対象外、顧客表示影響 |
| `ResumeContract` | W3 | entitlement再検査 |
| `EndContract` | W3 | entitlement失効、確認文 |
| `CreateProject` | W1 | 自動初期設定、正式日次、原価 |
| `UpdateProjectMetadata` | W1 | 非測定項目のみ |
| `RetryProjectSetup` | W1 | 新run・新revision |
| `RetryProjectSetupWithInputCorrection` | W2 | 入力差分、新run、旧履歴維持 |
| `CreateProjectConfigurationRevision` | W2 | 設定差分、現行版継続、active化条件 |
| `CloseProject` | W3 | 終了・履歴保持、project名入力 |
| `AssignInquiry` | W1 | 担当だけ変更 |
| `RelinkInquiryProject` | W1 | 同一customer内 |
| `AddInquiryInternalNote` | W1 | 内部のみ、追記型 |
| `StartInquiryHandling` | W1 | 担当・in_progress |
| `ChangeInquiryStatus` | W1 | 解決note必須 |
| `ReopenInquiry` | W1 | 再開理由必須 |

### 20.2 W2共通確認

```text
操作名
対象
現在状態
変更後または開始される自動処理
影響対象数
安全な代替
理由 optional/required by command
最新row version
実行button
```

### 20.3 W3共通確認

```text
step-up本人確認
対象
現在状態
影響
維持されるもの
理由
明示確認
対象名または指定文入力
idempotency key
row version
```

### 20.4 非同期結果

管理者要求が受理された時点では次を表示する。

```text
受け付けました
```

system eventで完了を確認するまで、完了toastを表示しない。

---

## 21. Read・write contract

### 21.1 Read query

| 画面 | Query |
|---|---|
| 顧客一覧 | `ListCustomers` |
| 顧客作成 | `GetCustomerCreateReference` |
| 顧客詳細 | `GetCustomerDetail` |
| project一覧 | `ListProjects` |
| project作成 | `GetProjectCreateReference` |
| project詳細 | `GetProjectDetail` |
| project設定更新dialog | `GetProjectConfigurationRevisionReference` |
| 契約一覧 | `ListContracts` |
| 契約詳細 | `GetContractDetail` |
| inquiry一覧 | `ListInquiries` |
| inquiry詳細 | `GetInquiryDetail` |

全response:

```text
read_snapshot_id
read_snapshot_at
freshness_state
scope_context
redacted_sections[]
available_commands[]
```

### 21.2 Write command envelope

```text
command_code
target_type
target_id
payload
expected_row_version
reference_row_versions{}
idempotency_key
reason?
confirmation_token?
step_up_proof?
request_id
```

clientはactor ID、role、scopeを指定しない。server sessionから解決する。

### 21.3 Available commands

read modelの状態候補だけでbuttonを出さない。

```text
state_action_candidate
× capability
× effective scope
× current write state
× safety precondition
＝ available_command
```

command endpointはavailable commandを信用せず、すべて再検査する。

### 21.4 Optimistic concurrency

- W1でも対象row versionを可能な範囲で送る。
- W2・W3はrow version必須。
- contract version適用とproject枠消費ではrow lockまたは同等の排他制御を使用する。
- stale conflictでは入力値を失わず、最新差分を表示して再確認させる。

### 21.5 Idempotency

必須対象:

```text
CreateCustomer
InviteCustomerUser
CreateContract
CreateContractVersion
ActivateContractVersion
ScheduleContractVersion
CreateProject
RetryProjectSetup
RetryProjectSetupWithInputCorrection
CreateProjectConfigurationRevision
ChangeInquiryStatus
ReopenInquiry
```

同じkeyの再送で別entityや別runを増やさない。

---

## 22. 表示状態マッピング

### 22.1 Customer access

| 正式状態 | UI |
|---|---|
| `enabled` | 利用可能 |
| `suspended_by_admin` | 顧客アクセス停止・管理者 |
| `blocked_by_system` | 顧客アクセス停止・システム |

### 22.2 Customer user

| 正式状態 | UI | 補助表示 |
|---|---|---|
| `invited` | 招待中 | 期限切れ、配送失敗をflag |
| `active` | 利用中 | customer access停止なら実効アクセス不可 |
| `suspended` | 一時停止 | 再開可能 |
| `revoked` | 取消済み | 終端 |

### 22.3 Contract

| 正式状態 | UI |
|---|---|
| `draft` | 下書き |
| `active` | 有効 |
| `suspended` | 停止中・正式日次対象外 |
| `ended` | 終了 |

### 22.4 Contract version

| 正式状態 | UI |
|---|---|
| `draft` | 編集可能な下書き |
| `scheduled` | 適用予定 |
| `active` | 現在適用中 |
| `superseded` | 過去版 |
| `cancelled` | 取消済み |

### 22.5 Project safe display

```text
preparing
current_version
previous_version_maintained
publication_stopped
customer_access_stopped
contract_inactive
entitlement_inactive
closed
unknown
```

`current_version` はcurrent pointerだけでなく、customer access、contract、entitlement、project lifecycle、publication controlを満たす場合だけ使用する。

### 22.6 Inquiry

| 正式状態 | UI |
|---|---|
| `new` | 新規 |
| `in_progress` | 対応中 |
| `resolved` | 解決済み |

「未割当」はstatusではなくassigneeの欠落から表示する。

---

## 23. Loading・empty・error・stale

### 23.1 Loading

- 初回はpage skeletonを表示する。
- table headerと列幅を固定し、読み込み後のlayout shiftを抑える。
- detailの遅延payloadはsection単位skeletonを使用する。

### 23.2 Partial error

例:

```text
顧客概要は取得できた
site evidenceだけ失敗
```

顧客概要を消さず、該当sectionに再試行を表示する。失敗sectionを0件と表示しない。

### 23.3 State unknown

次の場合は状態不明。

```text
read snapshot欠落
関連contract解決失敗
entitlement競合
複数active version検出
複数active entitlement検出
current pointer整合性失敗
```

- 「正常」「運用中」と推測しない。
- W2・W3を停止する。
- read consistency errorとcorrelation IDを表示する。

### 23.4 Stale

```text
最新状態を確認できません。
表示内容は [時刻] 時点です。
```

- filter・詳細閲覧は可能。
- W2・W3はrefresh成功後だけ許可。
- setup進行をstale値のまま「停止」と断定しない。
- inquiry new 0件を正常と断定しない。

### 23.5 Permission denied

- 権限不足sectionを0件cardにしない。
- `redacted_sections` により「表示権限がありません」と明示できる。
- 対象不存在との外部response方針は統一する。

### 23.6 Row version conflict

```text
この内容は別の操作で更新されました。
最新状態を確認してから、もう一度実行してください。
```

差分:

```text
表示時
現在
入力内容
```

を安全な項目だけ表示する。

---

## 24. Security・privacy・redaction

### 24.1 Field分類

| 情報 | 分類 | 標準扱い |
|---|---|---|
| 顧客名 | 業務情報 | scope内表示 |
| 主連絡先・customer user email | customer sensitive | capability必須、mask可 |
| 問い合わせ本文 | customer sensitive | inquiry read + scope |
| 問い合わせ内部メモ | internal sensitive | `inquiry.internal_note.read` |
| site analysis要約 | project業務情報 | project read |
| site evidence excerpt | controlled | customer operator等 |
| prompt metadata | project業務情報 | project read |
| prompt全文 | measurement payload | 遅延・追加権限 |
| publication payload | publication payload | 顧客管理では要約 |
| password/token/session/MFA secret | secret | 誰にも返さない |

### 24.2 Audit redaction

`audit_log`へ保存してよい。

```text
対象ID
操作code
before/afterの安全な要約
件数差分
status差分
理由
```

保存しない。

```text
招待token
password
session ID
Authorization header
cookie
問い合わせ本文全文
prompt全文
publication payload全文
```

### 24.3 Session invalidation

次で対象sessionを無効化する。

```text
SuspendCustomerAccess
BlockCustomerAccessBySystem
SuspendCustomerUser
RevokeCustomerUser
```

fail-closedな次request検査を必須とし、session無効化処理の一時失敗時も顧客API側の正式状態検査で拒否する。

### 24.4 SSRF・site fetch

project create URLの安全検査は、画面validationだけでなくserver-side fetch境界で毎回実施する。

### 24.5 Tenant boundary

- project、contract、inquiry、customer userの親customerをserverで解決する。
- clientが別customer IDをpayloadへ混ぜても拒否する。
- inquiry project候補、contract project一覧、customer user一覧をscope適用後に集計する。

---

## 25. Accessibility・responsive・visual

### 25.1 対象viewport

正式確認:

```text
1366 × 768
1440 × 900
```

mobile専用管理画面はP0対象外。

### 25.2 1366 × 768

共通shell:

```text
sidebar 224px
context bar 56px
content horizontal padding 24px
```

顧客一覧では初期viewportに次を表示する。

```text
page title
local navigation
filter bar
column header
少なくとも6行
```

顧客詳細では次を表示する。

```text
entity header
inner tabs
主状態・導入状況
顧客アクセスcard
projectまたは契約summaryの先頭
```

### 25.3 1440 × 900

- content padding 32px。
- 12カラムdetail layoutを維持する。
- 右side cardが過度に細くならないよう4カラムを最低300px相当確保する。

### 25.4 Table horizontal overflow

- ページ全体の横scrollを禁止する。
- contract・project一覧で列が増える場合、table container内だけ横scrollを許可する。
- 顧客名、project名、subjectは適切に省略し、tooltipまたは詳細で全文を確認できる。

### 25.5 Keyboard・focus

- tab、filter、row、menu、drawer、dialogをkeyboard操作できる。
- table row全体クリックだけに依存せず、詳細linkをfocus可能にする。
- drawer/dialogを閉じた後、起点へfocusを戻す。
- W3 typed confirmationはlabelとerrorを関連付ける。
- statusを色だけで伝えない。

### 25.6 Screen reader

- new inquiry badgeに意味のあるaccessible labelを付ける。
- setup stepperは現在工程、完了、例外を読み上げる。
- masked emailは読み上げても誤解しない表記にする。
- timelineのactor、操作、時刻、結果を順序立てて読む。

---

## 26. P0で作らないもの

```text
顧客削除
顧客merge
顧客archive
顧客statusの手動選択
顧客側カスタムrole
顧客ユーザーのproject別scope
顧客ユーザー権限matrix
顧客別測定スケジュール
顧客全体のprompt配分
active project設定のinline直接編集（安全なconfiguration revision更新はP0に含む）
競合候補のinline編集
カテゴリのinline編集
persona/topicのinline編集
prompt本文editor
正常setupの手動承認
契約請求・粗利・予算
高度な通貨換算
管理画面からの問い合わせ返信
メールthread同期
チャット
問い合わせpriorityの自由設定
問い合わせ一括解決
顧客向けガイドCMS
履歴の編集・削除
```

---

## 27. 受け入れ条件

顧客管理P0は、最低限次を自動テスト、integration test、E2E、visual regressionで証明する。

### 27.1 Navigation・scope

1. 顧客管理のローカルnavが顧客・project・契約・問い合わせの4項目である。
2. capabilityのない項目と件数が表示されない。
3. inquiry badgeがscope内new件数と一致する。
4. 顧客・project・契約の全件数をsidebar badgeへ表示しない。
5. scope変更後に一覧、facet、badgeが同じsnapshotで更新される。
6. scope外customer IDを直接開いても情報が返らない。

### 27.2 Customer list・create

7. 顧客一覧の主表示が保存statusではなく関連状態から導出される。
8. 同名customerを警告付きで別IDとして作成できる。
9. 顧客作成でcontract、project、customer userが暗黙作成されない。
10. CreateCustomer再送で同じidempotency keyからcustomerが増えない。
11. 主連絡先emailの閲覧権限がない管理者へ全文を返さない。
12. filter 0件と顧客未登録を区別する。
13. 権限不足を0件empty stateとして表示しない。
14. 顧客一覧のproject行集計がproject一覧と一致する。
15. new inquiry数がinquiry一覧facetと一致する。

### 27.3 Customer access

16. SuspendCustomerAccessがW3 step-up、理由、顧客名入力なしでは実行できない。
17. customer access停止でactive customer userの既存sessionが拒否される。
18. customer access停止でproject automation、contract、candidate生成、current pointerが変わらない。
19. customer access停止中のprojectを「現在顧客表示中」と表示しない。
20. ResumeCustomerAccessがW2確認、理由、最新の契約・entitlement再検査なしでは実行できない。
21. ResumeCustomerAccessがblocked_by_systemを直接enabledにできない。
22. access再開後もinactive contractまたはentitlementのprojectを顧客表示しない。

### 27.4 Customer user

23. 同一customer・正規化emailの有効membershipを重複招待できない。
24. InviteCustomerUserで管理者要求はaudit、配送結果はsystem eventへ分かれる。
25. 招待tokenの平文がDB、response、audit、timelineへ出ない。
26. ResendCustomerUserInviteで旧tokenが無効になる。
27. invited以外へ招待再送commandが表示されない。
28. SuspendCustomerUserが対象userだけを停止する。
29. customer access停止中にuserをactiveへ戻しても実効アクセス不可と表示する。
30. RevokeCustomerUserがW3 typed confirmationなしでは実行できない。
31. revoked userを同じ行でactiveへ戻せない。
32. customer userのproject別権限編集UIが存在しない。
33. password、session、MFA secretがread responseへ出ない。

### 27.5 Contract

34. CreateContractでcontractと初回draft versionが原子的に作成される。
35. `/admin/contracts/new` がP0主要routeとして存在しない。
36. UpdateDraftContractVersionがdraft以外を更新できない。
37. activeまたはsuperseded versionに編集formが表示されない。
38. 同一contractにactive versionを2件作れない。
39. 同一contractにscheduled versionを2件作れない。
40. ActivateContractVersionがW2 impact previewなしでは実行できない。
41. version適用で新entitlement setと旧entitlement失効が原子的に行われる。
42. ScheduleContractVersionが過去日時を拒否する。
43. scheduled適用失敗が現在active versionを破壊しない。
44. CancelContractVersionがactive versionを取消できない。
45. SuspendContractでentitlement statusを一括変更しない。
46. contract suspended projectが正式日次対象外になる。
47. contract suspendedでもcurrent pointerを保持する。
48. contract suspended中はcurrent pointerがあっても顧客表示しない。
49. ResumeContractがendedを再開できない。
50. ResumeContractでexpired/revoked entitlementが復活しない。
51. EndContractでactive entitlementがexpired、scheduled versionがcancelledになる。
52. EndContractでproject lifecycleが自動closedにならない。
53. 契約画面へ請求・粗利・原価編集が存在しない。

### 27.6 Project create

54. active contract versionがなければCreateProject commandを返さない。
55. available project slotが0ならCreateProject commandを返さない。
56. 許可外AIモデルをpayloadへ入れるとserverが拒否する。
57. 50/100/200以外のprompt tierを拒否する。
58. localhost、private IP、link-local、credential付きURLを拒否する。
59. redirect後にprivate addressへ到達するURLを拒否する。
60. CreateProjectの送信前summaryが自動初期設定、正式日次、自動公開、原価発生可能性を表示する。
61. CreateProjectがサーバー側の契約・枠・AIモデル・prompt tier再検査なしでは受理されない。
62. project、entitlement、revision、setup runの途中失敗で孤立行を残さない。
63. 同じidempotency keyの再送でprojectが増えない。
64. entitlement枠競合時に一方だけが成功する。
65. project作成後にqueued setup runが1件作られる。
66. project作成フォームに競合、category、persona、topic、個別prompt入力がない。
67. customer access停止中でも許可条件を満たせば作成でき、顧客非表示を明示する。

### 27.7 Project detail・setup

68. project詳細が主状態と顧客表示状態を分けて表示する。
69. setup progressが8工程の固定順で表示される。
70. exceptionが発生した工程を特定できる。
71. setup exception時に正式日次cycleが作成されない。
72. setup exception時に顧客画面準備中を表示する。
73. RetryProjectSetupが過去run・artifactを上書きしない。
74. RetryProjectSetupWithInputCorrectionがsetup_in_progress以外では利用できない。
75. 入力訂正後も過去configuration revisionを履歴で取得できる。
76. active projectの測定条件にinline editorを表示せず、安全なconfiguration revision更新dialogだけを表示する。
77. UpdateProjectMetadataでsite URL、ブランド、地域、言語、AIモデル、prompt tierを変更できない。
78. site analysis summaryからevidence drawerへ遷移できる。
79. evidence responseへraw HTML、cookie、Authorization headerが出ない。
80. competitor candidatesの期待件数が12で、不足を検出できる。
81. category、competitor、persona、topic、prompt setにinline editorがない。
82. customer operatorへprompt全文を標準responseで返さない。
83. current pointerがあってもcustomer access、contract、entitlement、publication controlのどれかが無効ならcustomer visibleをfalseにする。
84. project detailから品質・公開の強い操作を直接実行できない。
85. CloseProjectがW3 confirmationなしでは実行できない。
86. closed projectをP0 UIからactiveへ戻せない。

### 27.8 Inquiry

87. customer portal受信時にcustomer IDが必須で保存される。
88. projectを関連付ける場合、同一customer以外を拒否する。
89. inquiry受信本文を編集・削除するcommandが存在しない。
90. new inquiry badgeがnewだけを数える。
91. 顧客詳細のopen inquiry countがnew + in_progressになる。
92. AssignInquiryだけではstatusが変わらない。
93. StartInquiryHandlingで担当設定とnewからin_progressへの遷移を行える。
94. resolvedへの変更でresolution noteなしではcommitできない。
95. resolvedから再開する際にreopen reasonなしではcommitできない。
96. internal noteを編集・削除できず、correction noteで訂正する。
97. inquiry本文と内部メモを別sectionで表示する。
98. 内部メモが顧客向けresponseへ含まれない。
99. 通知配送失敗でinquiry statusが変更されない。
100. 管理画面にメール送信・chat・reply composerが存在しない。
101. stale時にnew inquiry 0件を正常と断定しない。
102. sender email権限なしでmaskまたはredactされる。

### 27.9 Audit・security・concurrency

103. 顧客管理W1/W2/W3の成功・拒否・失敗がaudit logへ1回だけ保存される。
104. 非同期setup・招待配送の完了がsystem eventへ保存され、admin auditを重複作成しない。
105. timelineへsecret、token、問い合わせ本文全文、prompt全文を複製しない。
106. W2・W3でstale row versionを拒否する。
107. contract capacityとproject createのTOCTOU競合を防止する。
108. scope外件数がfacet、badge、total countへ漏れない。
109. customer/project/contract/inquiryの親customer境界をserverで再検査する。
110. system blockを通常管理者が上書きできない。

### 27.10 Visual・accessibility

111. 1366×768でページ全体の横scrollがない。
112. 1366×768の顧客一覧でheader、filter、table header、6行以上を確認できる。
113. 1440×900でdetailの8/4カラム構成が崩れない。
114. 長い顧客名、project名、問い合わせsubjectで列が破綻しない。
115. setup stepperをkeyboardとscreen readerで操作・理解できる。
116. statusを色だけで表現しない。
117. drawer/dialogを閉じた後に起点へfocusが戻る。
118. W3 typed confirmationのerrorが入力fieldと関連付く。
119. redacted sectionを0件として表示しない。
120. visual regressionで顧客一覧、顧客詳細、project作成、project setup、contract detail、inquiry detailを確認する。

### 27.11 運用中configuration revision

121. active projectかつ有効契約・entitlementがある場合だけ設定更新commandを返す。
122. setup_in_progressではCreateProjectConfigurationRevisionを返さず、入力訂正commandへ分離する。
123. closedまたはblocked_by_systemのprojectへ設定更新commandを返さない。
124. 1projectへ非終端configuration revisionを2件同時作成できない。
125. 設定更新中も旧active revision、進行中cycle、current pointerが維持される。
126. 設定更新失敗時にproject lifecycleをactiveのまま維持し、「現行版継続」と表示する。
127. 新revision active化時にcontract、entitlement、AIモデル、prompt tier、row versionを再検査する。
128. 新revision active化後、旧revisionを参照する未公開candidateを新規公開できない。
129. 旧revisionから既に公開済みのversionを、次の安全な公開までcurrent pointerで維持できる。
130. project.configuration.manageがない管理者へ設定更新内容・command・候補値を返さない。

---

## 28. 実装順

顧客管理は次の順で実装する。

1. `customer.access_control` と顧客API fail-closed gate
2. `customer_user.status`、招待outbox、session invalidation
3. contract・contract version・entitlement制約
4. project create atomic commandとURL安全検査
5. project setup stage・configuration revision・artifact read model
6. inquiry status・append-only note・notification event
7. `CustomerAdminSummary`
8. `ContractAdminSummary`
9. `InquiryAdminSummary`
10. `GetCustomerCreateReference`
11. `GetProjectCreateReference`
12. 顧客一覧・作成
13. 顧客詳細・customer user
14. 契約一覧・詳細・version操作
15. project一覧・作成・詳細
16. setup progress・site evidence・生成物表示
17. active project configuration revision更新UI
18. inquiry一覧・詳細
19. 顧客管理timeline
20. 受け入れ条件1〜130の自動テスト
21. 1366×768・1440×900 visual regression

write commandと制約を先に実装し、formやbuttonだけを先行させない。

---

## 29. 最終統合後の位置づけ

本仕様v1.1は、canonical manifest v1.0に含まれる顧客管理の正式画面仕様である。

新しい画面仕様を追加する段階は完了した。実装時は、正式状態モデルv2.1、read model v2.0、権限・監査仕様v2.0、共通レイアウトv1.1から生成したAPI contractと`available_commands`だけを使用する。
