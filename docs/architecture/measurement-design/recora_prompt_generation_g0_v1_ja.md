# Recora Prompt Generation G0 v1

## 目的

オンボーディングで顧客確認まで完了した情報を、Persona・Topic・Intent・Prompt生成が共通利用できる日本語専用の入力へ正規化する。

```text
オンボーディング確定結果
→ G0 Generator共通入力
→ Persona 5件
→ Topic 6件
→ Intent
→ Prompt本文
→ 50 / 100 / 200件Panel
```

G0はオンボーディングUIを変更せず、Prompt本文も生成しない。

## 固定version

```text
input contract     recora_prompt_generation_input_v1
draft contract     recora_prompt_generation_draft_input_v1
semantics version  recora_prompt_generation_semantics_v1
country            JP
locale             ja-JP
```

## 分類を分けて保持する

BtoB、EC、店舗、SaaS、医療等を一つの分類列へ混ぜない。

```text
分析対象
顧客層
事業領域
提供モデル
販売経路・販売上の役割
主・副顧客行動
提供方法
地域対応範囲・拠点構造・地域との結び付き
信頼・規制
Persona選定に必要な事業構造Signal
分析対象に対する顧客側・市場側
確認済みの同一人物・別人物関係
初回・利用中・更新・解約・乗り換え等の状態
重点テーマ・確認目的
```

## 正規化結果

### ready

必須情報が揃い、意味が一意に決まり、後続Persona Compilerへ渡せる状態。

### needs_review

入力確認で解消できる曖昧さがある状態。値を推測して後続へ渡さない。

代表例:

```text
BtoBとBtoCの両方だが優先方針がない
医療と介護のどちらか不明
成人教育・子ども教育・法人研修のどれか不明
不動産の賃貸・購入・売却が不明
保険・投資・融資等のmotionが不明
Marketplace自体か運営者向けSaaSか不明
多拠点ブランド自体か多拠点企業向けSaaSか不明
同一人物か別人物か未確認
対応地域・拠点情報が不足
```

### blocked

必須入力不足、値の不正、意味矛盾、未対応version等により正規化できない状態。

## Structure Signal

自由文をPersona Compilerが直接解析しない。G0は確定済み意味情報から、レビュー済みtokenを導出・正規化する。

例:

```text
b2b_buying_group
commerce_single_purchase
commerce_subscription
local_facility
adult_healthcare
child_education
marketplace_brand
marketplace_operator_customer
real_estate_rental
insurance
multi_location_consumer_brand
```

### 自動導出を限定する

単一の表面的な条件だけで、別の事業構造へ広げない。

```text
BtoB SaaSの定期契約
→ start_subscriptionだけでcommerce_subscriptionにしない

顧客先へ訪問するサービス
→ in_personだけでlocal_facilityにしない

規制された医療
→ 規制フラグだけでadult_healthcareにしない
```

成人医療・介護、Marketplaceブランド・運営者向けサービス等の意味が一つに決まらない場合は`needs_review`で止める。

### 分類との整合を検査する

入力済みSignalも無条件には信頼しない。

```text
education以外のchild_education
Marketplace以外のmarketplace_brand
finance以外のinsurance
単一拠点なのにmulti_location_consumer_brand
```

のような矛盾は`structure_signal_conflict`で拒否する。

## Customer Side

分析対象に対する顧客側・利用側・市場側を保持する。

```text
prospective_customer
current_customer
end_user_or_beneficiary
payer_or_sponsor
influencer_or_referrer
demand_side_participant
supply_side_participant
partner_or_intermediary
```

分析対象を提供する会社の内部社員は、この配列へ入れない。需要側・供給側はMarketplaceブランドでのみ使用し、非Marketplace入力へ付けた場合は拒否する。

## Actor Relation

同じ人物が複数役割を兼ねるか、別人物かを正規化する。

```text
same_actor
distinct_actors
unknown
```

`unknown`がPersona 5件の構成へ影響する可能性があるため、`needs_review`とする。

role keyは内部識別子として、次のように正規化する。

```text
Decision Owner
Decision-Owner
decision_owner
→ decision_owner
```

日本語の説明文や任意記号をrole keyとして受け入れず、左右を固定順へ並べ、入力順や表記差で結果を変えない。

## 地域・提供方法

提供方法と地域構造の矛盾を拒否する。

```text
onlineなのに物理拠点で提供
locationStructure = noneなのにphysical_location
拠点ありなのにgeographicBindingがnone / service_areaのみ
```

訪問型・対応エリア型サービスは、物理店舗と区別する。

```text
in_person + service_area + locationStructure none
→ 訪問型サービスとして成立
→ local_facilityにはしない
```

対応地域・拠点が必要なのに空の場合は、値を発明せず`needs_review`とする。

## Trust derivation

顧客へ「高信頼領域か」を自己判定させない。確定済みフラグから次を純粋関数で導出する。

```text
decisionImpactLevel
  standard / elevated / critical

derivedClass
  standard / high_trust / regulated
```

規制フラグがある場合は`regulated`。高額・長期・健康・金融・法律等の影響がある場合は`high_trust`以上とする。

## Stable fingerprint

Fingerprintは呼び出し側から受け取らず、正規化済み意味情報からSHA-256で計算する。

含める:

```text
顧客層と優先方針
主・副分析対象
事業領域
提供モデル
販売経路・販売役割
主・副顧客行動
提供方法・地域構造
信頼・規制
Structure Signal
Customer Side
Actor Relation
Lifecycle Signal
重点テーマの値
確認目的の値
JP / ja-JP
semantics version
```

含めない:

```text
入力配列の並び順
重複入力
表示上だけの順序
50 / 100 / 200件Profile
根拠文や理由文の順序
```

重点テーマ・確認目的はPersona Setを変えるためではなく、後続Topic・Prompt生成を変える意味入力である。そのため値はFingerprintへ含めるが、配列順は含めない。

## 50 / 100 / 200件Profile

件数は`prompt-measurement-contract.ts`を唯一のauthorityとして参照する。

```text
50  = Core 38 + Robustness 8  + Diagnostic 4
100 = Core 70 + Robustness 20 + Diagnostic 10
200 = Core 130 + Robustness 45 + Diagnostic 25
```

50・100・200以外は近い値へ丸めず、`unsupported_question_limit`で停止する。

Prompt membershipは次の入れ子を前提とする。

```text
minimumProfileSize = 50  → 50 / 100 / 200
minimumProfileSize = 100 → 100 / 200
minimumProfileSize = 200 → 200
```

## Legacy互換

`ProjectSetupSeedInput`からのadapterは、旧値をproduction-readyへ無理に昇格させない。

旧Seedだけでは通常、次が不足する。

```text
主な顧客行動
事業構造Signal
顧客側・市場側
家族・代理・支払関係
初回・更新・解約等の状態
```

そのため、明確な不正がない場合も原則`needs_review`を返す。`knownCompetitors`は新しい分類・Persona選定の根拠に使用しない。

## 検証Fixture

```text
ready          22
needs_review   11
blocked        12
Profile         4
Legacy          1
```

ready Fixtureでは、同じ入力の再実行に加え、次の配列順・重複を変えても正規化結果とFingerprintが同じことを確認する。

```text
副事業領域
副提供モデル
販売経路・販売役割
副顧客行動
地域・拠点
信頼フラグ
Structure Signal
Customer Side
Actor Relation
Lifecycle Signal
重点テーマ・確認目的
```

さらに、次を確認する。

```text
重点テーマの値を変更
→ Fingerprintは変わる

確認目的の値を変更
→ Fingerprintは変わる

BtoB SaaSでstart_subscription
→ commerce_subscriptionへ誤分類しない

訪問型サービス
→ local_facilityへ誤分類しない

規制されたhealthcareでmotion不明
→ adult_healthcareへ自動確定せずneeds_review
```

## 実行

第1子PRでは`package.json`を変更しないため、直接実行する。

```bash
npx --no-install tsx scripts/verify-recora-prompt-generation-g0.ts
```

既存回帰として、次も実施する。

```bash
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
Persona 5件の選定実装
Topic 6件の選定実装
Intent・Prompt本文生成
ProjectSetupDraft接続
DB・migration・Supabase
API・provider・Inngest
fixed Prompt materialization
```
