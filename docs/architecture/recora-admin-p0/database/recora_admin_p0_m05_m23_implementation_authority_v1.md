# Recora Admin P0 M05–M23 実装正本

- 文書ID: `RECORA-ADMIN-P0-M05-M23-AUTHORITY`
- Version: **1.0**
- 決定日: **2026-08-06**
- 状態: **Accepted by OWNER / repository integration pending**
- 対象: Recora Admin P0 のうち、未実装の Migration Unit `M05`〜`M23`
- 実装済み基準: `M00`〜`M04`
- 主領域: `8. 顧客・契約・権限` / `9. 共通基盤`
- 関連領域: `4. 管理画面` / `5. プロンプト・測定設計` / `6. AI測定・分析` / `7. 品質・公開・レポート`

## 0. 結論

この文書を、Recora Admin P0 の未実装範囲 `M05`〜`M23`についての正式な実装順・責務境界・停止条件の正本とする。

既存の次のv1.3文書は、`M00`〜`M04`の実装済み基準と、本文書に反しない物理設計の参考として保持する。

- `recora_admin_p0_migration_plan_v1_3.md`
- `recora_admin_p0_database_schema_spec_v1_3.md`
- `recora_admin_p0_physical_schema_manifest_v1_3.json`
- `recora_admin_p0_database_design_validation_v1_3.md`
- `recora_admin_p0_database_bundle_manifest_v1_3.json`

v1.3 bundleはM00のHash固定対象であるため、上書き・改変しない。`M05`〜`M23`について内容が衝突する場合は、本書を優先する。

```text
M00〜M04
= 実装済み・既存migrationと各unit specが正本

M05〜M23
= 本書が実装順と責務境界の正本

既存v1.3 physical detail
= 本書に反しない範囲だけ再利用
```

## 1. M05〜M23とは何か

`M05`〜`M23`は、画面、開発領域、Phase番号ではない。Recoraの正式な運用DBを段階的に構築するための**Migration Unit**である。

```text
9開発領域
= 何を開発するか

Phase
= いつ・どの工程で開発するか

M00〜M23
= DBをどの依存順で拡張・検証するか
```

M05〜M23だけで、領域8・9のアプリケーション実装全体が完成するわけではない。

含むもの:

- 正式な業務状態
- 不変な履歴と証跡
- Project単位の契約・利用権限
- 日次処理の対象判定と実行記録
- 品質・公開・障害・原価の状態
- RLS、制約、Command、Read Model

含まないもの:

- 顧客ログイン画面
- Project選択画面
- Next.jsの顧客専用API実装
- Inngest本体、Cron、Function、Worker
- Stripe本接続、Webhook受信
- メール配信Worker
- 外部監視SaaSやAlert delivery
- 管理画面UI

外部Runtimeは、各Migration WaveがDB契約を確定した後、別Issueで接続する。

## 2. 今回の正式な訂正

### 2.1 顧客認証

顧客は次で認証する。

```text
メールアドレス
＋
パスワード
```

Project IDは秘密情報・認証資格として使用しない。ログイン後に利用可能Projectを取得し、1件なら自動選択、複数なら選択する。

DBは次を別々に管理する。

```text
顧客企業への所属
≠
Projectごとの利用許可
```

顧客側の個別RoleはP0で導入しない。

### 2.2 契約とProject

顧客企業を契約相手とし、1つの契約が1つ以上のProjectを対象にできる。

```text
顧客企業
└─ 契約
   ├─ Project Aの利用条件
   └─ Project Bの利用条件
```

利用開始、利用終了、利用権限、契約終了後の閲覧期間はProject単位で判定する。Project Aの終了を理由に、同じアカウントのProject Bを停止しない。

### 2.3 契約終了後

対象Projectは次の3状態を導出する。

```text
normal
= 通常利用

published_reports_only
= 契約終了後6か月以内
  過去の公開済みレポートだけ閲覧可能

unavailable
= 6か月経過後、またはProject利用許可なし
```

この表示状態を人が直接書き換える単一列にはしない。Membership、Project access、契約期間、Entitlement、公開版の存在からfail-closedで導出する。

### 2.4 データ保持

契約終了から6か月経過しても、全データを即時一括削除しない。一方、永久保存を標準方針にしない。

保存期間は少なくとも次のカテゴリごとに分離する。

- 顧客アカウント・連絡先等の個人情報
- Project設定
- 測定証跡
- 公開レポート
- 契約・請求事実
- 監査証跡
- 一時データ・生成物
- Legal hold対象

### 2.5 プランと料金

次は未決定のため、M05で固定しない。

- 正式な商品プラン名
- 料金
- 月払い・年払い
- 返金
- 50 / 100 / 200を商品プランとして固定すること
- 固定5プランを正式販売プランとしてseedすること

機能・上限の判定は、既存のversioned plan policyとEntitlement snapshotを再利用する。画面やRuntimeはPlan名ではなく、確定済みEntitlementを参照する。

### 2.6 日次測定

測定頻度は**毎日のみ**とする。frequency列や週次・月次設定を追加しない。

Inngestは日次処理を起動・実行する外部Runtime候補であり、管理DBのMigrationには含めない。DBは次を保存する。

- 日次自動処理の有効・停止
- 実行時刻Version
- 日次対象判定
- Cycle / Item / Attempt / Result
- Retryと最終失敗
- Runtime correlation

### 2.7 既存基盤の再利用

次を優先し、同じ責任の並行DBを作らない。

- `public.organizations`
- `public.projects`
- `public.organization_members`
- Supabase Authの`auth.users`
- `public.personas`
- `public.topics`
- `public.prompts`
- `public.measurement_runs`
- `public.run_items`
- `public.ai_conversations`
- `public.ai_models`
- Phase 3 tenant / RLS / entitlement / audit基盤
- Phase 4 contract / billing fact基盤
- M01 command receipt / outbox
- M02/M03 admin RBAC
- M04 customer/project/inquiry write model

## 3. 実装原則

1. 各unitは専用Issue、専用Worktree、専用Local Supabase、Draft PRで実装する。
2. Remote / linked / production DBへ適用しない。
3. `supabase db push`を使用しない。
4. 既存migrationを編集しない。
5. 永続DDL前にinventoryをfail-closedで実行する。
6. 推測backfillを行わない。
7. Browserへprivate tableの直接権限を与えない。
8. `service_role`を人間または顧客のactor identityとして扱わない。
9. 同じ責任のlegacy / admin / core tableを並行して増やさない。
10. 各unitの実装前に、物理Schema差分をunit specで固定する。
11. DB unitとRuntime/UI integrationを同じIssueへ混ぜない。
12. M05〜M23の番号を開発領域番号やPhase番号として扱わない。

## 4. 正式Migration Sequence

### M05 `customer_project_access`

**目的:** 顧客アカウントとProjectの利用許可を正式管理する。

**主な責務:**

- 有効なorganization membershipを前提にする
- `auth.users`の1アカウントを複数Projectへ紐づける
- Project accessのgrant/revoke履歴
- 同一ユーザー・同一Projectの有効grant重複禁止
- revoked rowの非復活
- Project accessをRLS判定へ利用可能にする
- 顧客Roleは導入しない

**禁止:**

- Projectごとの別パスワード
- Project IDを認証資格として保存
- 組織MembershipをProject accessの代用にする
- 顧客ブラウザからgrant tableを直接更新する

**終了条件:**

- 1アカウントが複数Projectへアクセス可能
- 同一組織の未許可Projectを取得不可
- 別組織Projectを取得不可
- revokeが即時にfail-closedで反映される

### M06 `contract_project_entitlement_access_window`

**目的:** 顧客企業契約、対象Project、Entitlement、終了後6か月の閲覧範囲を結ぶ。

**主な責務:**

- immutable contract version
- contractと対象Projectの明示的な関係
- Projectごとのservice start/end
- Projectごとの`published_reports_access_until`
- Project-scoped Entitlement current pointer
- P4 contract/billing factsの再利用
- `normal / published_reports_only / unavailable`を導出するresolver contract

**禁止:**

- 料金、請求周期、返金ルールの確定
- Stripeの状態を直接アクセス権限にする
- 1つのProject終了で顧客アカウント全体を停止する
- Project access modeを人が自由に設定する

**終了条件:**

- Project A終了後もProject Bは通常利用可能
- Project Aは終了後6か月だけ公開済みレポートを閲覧可能
- 6か月後はProject Aだけ利用不可
- access resolverがmissing/ambiguous stateを許可しない

### M07 `minimal_settings_core`

**目的:** 日次運用、AIモデル制御、品質・公開に必要な最小設定だけをversion管理する。

**主な責務:**

- daily automation singleton
- daily start time version
- timezone `Asia/Tokyo`
- frequencyはdaily固定
- AI model enable/restrict/pause control
- notification destination/category
- quality rule version
- publication rule version
- scheduled activationは必要な設定種別だけ

**保留:**

- marketed plan definitions
- pricing
- billing cadence
- 50 / 100 / 200の商品プラン固定
- legacy 5 planの正式seed

**終了条件:**

- active daily version欠落時はscheduler対象をfail-closed
- incident safety blockを通常管理者が解除不可
- active quality/publication rule欠落時は公開不可
- 設定Versionはready以降immutable

### M08 `project_setup_finalization_evidence`

**目的:** オンボーディングと固定Prompt確定の業務証跡を保存する。

**主な責務:**

- Project setup run
- site analysis snapshot/evidence
- approved Project configuration revision
- 既存Persona / Topic / Promptの確定状態への参照
- prompt configuration hash/count/contract version
- setup失敗、再実行、訂正の証跡
- active configuration pointer

**禁止:**

- parallel Persona DB
- parallel Topic DB
- parallel Prompt Set DB
- 既存Prompt textからIntent/eligibilityを推測すること
- 生HTMLの無制限保存

**終了条件:**

- 1 Projectにactive configuration最大1件
- fixed Prompt materializationのhash/countと一致
- setup revisionが別ProjectのPersona/Topic/Promptを参照不可
- 旧configurationを新revision完成前に無効化しない

### M09 `incident_system_event_core`

**目的:** 障害、影響範囲、System Event、Component状態の共通基盤を作る。

**主な責務:**

- incident
- incident scope
- append-only system event
- component health observation
- common-cause dedupe
- customer/project/global scope
- automation/publication/model safety blockとの因果参照

**終了条件:**

- unresolved incident fingerprint重複禁止
- 古いhealth observationが新しい状態を上書きしない
- incident safety blockの解除はM15 clearanceまで禁止

### M10 `daily_targeting`

**目的:** 毎日どのProjectを測定するかを決定し、その判断根拠を固定する。

**主な責務:**

- business date単位のevaluation run
- Project単位のtarget decision
- contract/access/entitlement/configuration/rule/model control snapshot
- included / excluded / blocked / failed
- 同日二重判定防止
- activation day boundary
- Inngest correlation field

**禁止:**

- Inngest Function実装
- weekly/monthly frequency
- unknownをexcludedへ変換
- access unavailable Projectの測定開始

**終了条件:**

- 1 business dateに正式run最大1件
- 1 Project/dateにdecision最大1件
- 判定根拠を後の契約変更で書き換えない

### M11 `measurement_execution_bridge`

**目的:** 日次対象判定から既存の測定実行基盤へ安全に接続する。

**主な責務:**

- `measurement_runs / run_items / ai_conversations`の再利用・必要最小拡張
- target decisionとの因果参照
- logical itemとprovider attemptの分離
- provider/model evidence
- retry classification
- current accepted result revision
- runtime request/correlation/idempotency
- 同一Project/dateの正式Cycle重複防止

**禁止:**

- 同じ測定事実を`admin_*`へ丸ごと複製
- retry回数の全処理一律固定
- provider payloadの管理画面公開
- 失敗した1 itemのために成功itemを破棄すること

**終了条件:**

- temporary failureだけ再試行可能
- permanent failureは再試行しない
- 同じattemptを複数Workerが採用不可
- reprocess中も旧current resultを維持

### M12 `publication_candidate`

**目的:** 測定結果からcustomer-safeな公開候補を生成する。

**主な責務:**

- candidate generation run
- immutable candidate
- Project generation number
- source measurement/result revision
- customer-safe payload
- data quality warning候補
- recommendation optionality

**禁止:**

- 候補生成時点で顧客公開
- 生provider payloadを候補へ含める
- 改善提案がないことで他ページを非成立にする
- 新候補commit前に旧候補を無効化する

### M13 `quality_exception`

**目的:** 自動品質判定、Finding、例外Case、再処理、Decisionを管理する。

**主な責務:**

- quality check run
- finding
- exception case
- reprocess action
- quality decision
- critical findingとincidentの接続
- stable subject dedupe
- 通常自動、例外のみ人手

**禁止:**

- 人がcandidateを直接readyへ書き換える
- quality findingをmeasurement resultへ上書きする
- 同一問題の無制限Case重複

### M14 `publication_delivery`

**目的:** 不変な公開Versionと現在公開版Pointerを管理する。

**主な責務:**

- publication version
- project current publication pointer
- publish / withdraw / restore / stop / resume operation
- delivery verification
- candidate consumption
- pointer CAS
- 前回正常版維持

**終了条件:**

- 1 candidateからpublication version最大1件
- 新版が完全に確定するまでpointerを変更しない
- 公開失敗時に旧pointerを維持
- `published_reports_only`では過去のpublished versionだけ参照可能

### M15 `incident_recovery_clearance`

**目的:** 障害復旧とsystem safety block解除を厳密に管理する。

**主な責務:**

- recovery plan
- ordered step
- retry row
- canary/recovery batch reference
- one-time clearance
- exact row-version/expiry
- consume+release atomicity

**終了条件:**

- unresolved incidentにnonterminal plan最大1件
- clearance再利用不可
- 通常管理者操作だけでsystem blockを解除不可

### M16 `usage_cost`

**目的:** 利用量、内部変動原価、計算Version、CSV exportを管理する。

**主な責務:**

- provider/model/token/search/attempt usage
- immutable usage component
- pricing definition version
- cost calculation run/version
- correction chain
- scoped CSV export
- uncomputedとzeroの分離

**禁止:**

- 顧客請求額の確定
- Prompt全文・AI回答全文のCSV出力
- 料金未決定を内部原価記録の阻害要因にすること

### M17 `cross_domain_constraints`

**目的:** 両側のtableが揃った後に、領域横断FKとscope整合を追加する。

**対象例:**

- Project state → active configuration
- daily decision → contract/access/entitlement/configuration
- measurement → daily decision
- candidate → measurement result
- quality → candidate/incident
- publication pointer → publication operation/version
- recovery → incident/measurement/publication
- cost → usage source

**終了条件:**

- orphan typed reference 0
- same organization/project scope exact
- current pointerが有効なterminal rowだけを参照

### M18 `transition_immutability_guards`

**目的:** 不正な直接DML、履歴改ざん、terminal revivalをDBで拒否する。

**主な責務:**

- state transition matrix
- append-only trigger
- immutable payload/identity
- exact row_version +1
- terminal non-revival
- successor/correction方式

### M19 `indexes`

**目的:** concurrency invariantと管理read pathを支えるIndexを追加する。

**主な責務:**

- active/nonterminal partial unique
- Project/date uniqueness
- scope/filter/sort
- pointer lookup
- unresolved incident/case lookup
- current entitlement/access lookup
- duplicate/unused index review

### M20 `security_commands`

**目的:** RLS、Grant、明示Command、顧客/管理者/Worker境界を完成させる。

**主な責務:**

- private schemaのbrowser拒否
- customer-safe `api / publication` read path
- customer JWTによるProject access RLS
- admin role/capability/scope authorization
- service-role-only Worker command
- fixed search_path
- command receipt / audit / outbox causality
- BOLA / cross-Project negative tests
- generic mutation RPC禁止

**重要:**

顧客読み取りで`service_role`を利用してRLSを迂回しない。Worker・内部Commandだけに限定する。

### M21 `legacy_compatibility_cutover`

**目的:** 旧`recora_admin`とPhase 1経路を破壊せず、新authorityへProject単位で切り替える。

**主な責務:**

- legacy writer freeze
- explicit bootstrap registry
- no semantic inference
- Project単位cutover gate
- rollbackは旧path維持またはpointer戻し
- automatic dual-write禁止

**cutover条件:**

```text
Project access authority exists
AND active contract/project term exists
AND active entitlement exists
AND active configuration exists
AND publication pointer bootstrap is valid
AND read/security consistency passes
```

### M22 `read_models`

**目的:** 管理画面と顧客APIが読む正式Read Modelを作る。

**主な責務:**

- customer/project/contract/access summary
- daily targeting/measurement summary
- quality/case summary
- publication summary
- incident/timeline
- usage/cost
- settings health
- attention work item
- sidebar badge
- customer-safe publication projection
- unknown/staleをzeroにしない

**禁止:**

- display状態をwrite modelへ保存
- 生provider payloadの顧客Read Model公開
- 件数計算前のscope filter省略

### M23 `certification`

**目的:** M00〜M23の正式DB契約を最終検証し、Backend接続可能なReady markerを作る。

**必須検証:**

- migration-only fresh replay
- seeded fresh replay
- same-stack replay
- M00〜M04 regression
- M05〜M23 unit verifier
- RLS / ACL / Command inventory
- cross-tenant / cross-Project negatives
- state transition negatives
- catalog/object/constraint/index digest
- Security Advisor
- Performance Advisor
- read model consistency
- legacy no-new-write
- no remote/linked/production operation

M23のReady markerは、DBがBackend実装へ接続可能であることだけを示す。顧客画面、管理画面、Inngest、Stripe、メール、監視、Production rolloutの完成を意味しない。

## 5. Release Wave

| Wave | Migration | 完成するDB契約 | Runtime/UI側の別作業 |
|---|---|---|---|
| A | M05–M06 | Project access、契約、6か月閲覧、Entitlement | ログイン後Project選択、顧客API |
| B | M07–M10 | 最小設定、Setup証跡、Incident、日次対象判定 | Inngest Cron / Event起動 |
| C | M11–M14 | 測定、公開候補、品質、公開Version | Provider Worker、公開通知 |
| D | M15–M16 | 復旧、利用量・原価 | Alert delivery、運用Runbook |
| E | M17–M20 | 全体制約、状態遷移、Index、Security/Command | Backend application service |
| F | M21–M23 | Cutover、Read Model、最終認証 | 管理画面・顧客画面の正式接続 |

## 6. 実装順の変更禁止条件

次を飛ばして後続unitを実装しない。

- M05前にProject accessを組織Membershipだけで代用しない
- M06前に6か月閲覧判定を画面側だけで実装しない
- M07前に固定5プランを正式seedしない
- M08前にparallel Persona/Topic/Prompt DBを作らない
- M10前にInngestから測定Runを直接作らない
- M11前に並行する`admin_measurement_*`事実DBを作らない
- M12/M13を入れ替えない。候補を先に生成し、その候補を品質検査する
- M14前に顧客画面を最新measurementへ直接接続しない
- M17〜M20前にProduction writerを有効化しない
- M22前に管理画面の推測値を正式運用値として扱わない
- M23前にDB Readyを宣言しない

## 7. 既存Issue・PRの扱い

### Issue #164 / 旧M05

旧M05の次のscopeは実行停止とする。

- 固定5プランの正式seed
- 50 / 100 / 200の商品プラン固定
- 11tableを一括作成する旧settings core
- `Ready: true`
- 旧baselineからのExecute

Issue #164はcloseせず、`SUPERSEDED / DO NOT EXECUTE`へ更新し、新しいM05 Issueを別途作成する。

### PR #126 / P4-C

PR #126は本書の契約・Project scope・Entitlement・access windowと再照合するまでmergeしない。既存のprovider-neutral fact、receipt、outbox、snapshot基盤は再利用候補だが、旧商品判断を継承しない。

## 8. 各unitの開始契約

M05〜M23の各unit開始時に、Issue本文へ最低限次を記録する。

```text
Migration unit
主領域 / 関連領域
依存migration
再利用する既存table
新規table / 変更table
作らないもの
Backfill方針
RLS / grant / actor境界
Idempotency / transaction / audit
Positive / negative fixture
Local Supabase identity
変更可能ファイル
停止位置
```

各unitの物理Schemaは、実装前のunit specとmigrationで確定する。本書だけを根拠に、未定の列・enum・商品ルールを推測してはならない。

## 9. 完了の定義

M05〜M23完了とは、Recora運用DBの正式契約が完成した状態である。

```text
M05〜M23完了
= 管理・運用DB Ready

領域8・9完了
= DB Ready
  ＋ Supabase Auth実利用
  ＋ Project選択
  ＋ 顧客専用API
  ＋ Stripe接続
  ＋ Inngest
  ＋ メール
  ＋ 監視
  ＋ Backup/Recovery
```

したがって、M23完了だけを理由に領域8・9を100%と評価しない。
