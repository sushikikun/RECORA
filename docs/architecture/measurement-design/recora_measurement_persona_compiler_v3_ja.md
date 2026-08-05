# Recora Measurement Persona Compiler v3

## 目的

オンボーディング確定結果を正規化したG0入力から、その事業に合う日本語の測定Personaを5件選ぶ。

```text
G0 Generator共通入力
→ Persona Blueprint Catalog
→ 事業構造に合う候補を選別
→ 同一人物の兼任役割を統合
→ 必要な利用状態を付与
→ 測定Persona 5件
→ Topic Compilerへ渡す
```

50・100・200件の全プランで同じ5Personaを使う。上位プランではPersonaを増やさず、同じ5PersonaからTopic・Intent・Promptを深く展開する。

## PersonaとTopicの境界

```text
Persona
= 誰が質問するか
  立場、権限、分析対象との関係、利用・受益関係、経験状態

Topic
= その人が何を確認するか
  料金、口コミ、機能、配送、アクセス、資格、リスク等
```

次はPersonaではない。

```text
料金を確認する人
口コミを確認する人
返品条件を確認する人
アクセスを確認する人
```

単一の確認事項だけを人物化せず、各Personaは最低2つ以上のTopic領域を変えることを要求する。

## 固定version

```text
Catalog    recora_persona_blueprint_catalog_ja_v3
Compiler   recora_measurement_persona_compiler_v1
Fixture    recora_persona_gold_fixtures_ja_v3
出力件数   5
市場       JP
言語       ja-JP
```

## Persona Blueprint Catalog

Catalogは192項目で構成する。

```text
直接選択可能  152
条件付き       33
状態Modifier    7
合計           192
```

### 直接選択可能

分析対象の顧客、利用者、比較者、決定者、支払者、受益者など。

### 条件付き

分析対象によって、外部顧客にも提供会社内部にもなり得る役割。

例:

```text
Marketplace自体を分析
→ 運営会社のTrust & Safety担当者は内部人物なので除外

Marketplace運営会社向けSaaSを分析
→ Trust & Safety担当者はSaaSの顧客側なので選択可能
```

### 状態Modifier

単独のPersonaにはしない。

```text
初めて探す
試用・体験中
現在利用中
過去の選択失敗後
更新判断中
解約判断中
乗り換え比較中
```

役割へ付けることで、質問状況を具体化する。

## 8つのCoverage

最終5件は、事業に必要な視点を次からカバーする。

```text
C1 課題・目的・受益の当事者
C2 候補の比較・評価者
C3 最終決定者・支払者
C4 実際の利用者・運用者・受益者
C5 社内推進者・推薦者・影響者
C6 審査・承認・停止権限者
C7 家族・保護者・代理人・別支払者
C8 継続・更新・解約・乗り換え判断者
```

一般的な単一顧客側の事業ではC1〜C4を基本にし、5件目をC5〜C8から選ぶ。Marketplace、代理店、BtoBtoC等は市場側のCoverageを優先する。

## 選定方式

不透明な総合scoreだけで上位5件を選ばない。レビュー済みの事業別Recipeを使用する。

```text
1. G0のstatusを確認
2. Structure Signalから適用Recipeを決定
3. 必須5枠のBlueprint keyを取得
4. same actorとして扱うSupporting roleを統合
5. Lifecycle Signalに対応するModifierを付与
6. 条件付きBlueprintが顧客側か検証
7. Coverage・市場側・重複・Topic影響数を検証
8. Stable Persona IDを生成
9. 代替候補と除外理由を返す
```

同じ入力から同じRecipe、同じ5件、同じ順序、同じIDを返す。

## Supporting role

同じ人物が複数役割を兼ねる場合は、1Personaへまとめる。

```text
primary: b2b.strategic_decision_owner
supporting: b2b.economic_buyer

表示:
導入可否と予算を判断する責任者
```

別担当者であることが確認され、5件構成が変わる場合は`needs_review`で止める。自動的に1人へ統合しない。

## Stable identity

Persona Set用Fingerprintは、Persona選定に影響する意味情報から計算する。

含める:

```text
分析対象
顧客層
事業領域・提供モデル
顧客行動
提供方法・地域構造
信頼・規制
Structure Signal
Customer Side
Actor Relation
Lifecycle Signal
```

含めない:

```text
重点テーマ
確認目的
50 / 100 / 200件Profile
G0側のFingerprint文字列
入力配列の順序
```

重点テーマや確認目的はTopic・Prompt生成を変えるが、Persona Setは変えない。

```text
personaId = persona_v3_ +
  SHA-256(
    Persona選定Fingerprint
    + primary Blueprint
    + supporting Blueprint
    + Modifier
  )の先頭32hex
```

## 出力status

### ready

正しい5件を確定できた状態。Topic Compilerへ渡せる。

### needs_review

入力確認で解消できる曖昧さがある状態。

```text
同一人物としてまとめる予定の役割が別人物
G0入力自体がneeds_review
複数Recipeの優先判断が未確定
```

### catalog_gap

事業内容は明確だが、必要なBlueprintまたはCoverageがCatalogにない状態。自由生成で補完しない。

### blocked

G0入力が不正、条件付きBlueprintが顧客側ではない、Catalog自体が壊れている等の状態。

`ready`以外のselectedをTopic Compilerへ渡さない。

## Gold Fixture

```text
ready          31
needs_review   12
catalog_gap     3
blocked         8
合計           54
```

ready 31件では次を確認する。

```text
選定5件のprimary key
supporting key
Modifier key
表示順
Stable ID
Recipe key
代替候補
```

さらに入力配列の順序・重複、重点テーマ、確認目的、G0 Fingerprint文字列を変えてもPersona SetとPersona IDが変わらないことを確認する。

## 主なGold Case

```text
標準BtoB SaaS
エンタープライズIT・セキュリティ
代理店
BtoBtoC法人研修
単品EC
定期購入EC
ギフトEC
地域店舗
緊急住宅修理
成人医療
介護・福祉
成人教育
子ども教育
多拠点
フランチャイズ
Marketplace
専門サービス
採用管理SaaS
不動産賃貸・購入・売却
保険
製造
物流
団体旅行
公共・非営利
メディア・広告
```

## 実行

第1子PRでは`package.json`を変更しない。

```bash
npx --no-install tsx scripts/verify-recora-measurement-persona-compiler.ts
```

既存回帰として次も実施する。

```bash
npm run recora:prompt-generation-g0:check
npm run recora:project-setup-draft:check
npm run recora:project-setup-draft-generator:check
npm run recora:project-setup-draft-generator:eval
npm run recora:prompt-measurement-contract:check
npm run recora:preflight:full
npm run typecheck
npm run lint
npm run build
git diff --check
npm run recora:commit-check
```

## 対象外

```text
オンボーディングUI変更
Topic 6件の選定
Intent生成
Prompt本文生成
50 / 100 / 200件Panel編成
ProjectSetupDraftへのLegacy変換
DB・migration・Supabase
API・provider・Inngest
fixed Prompt materialization
```
