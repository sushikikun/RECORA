# Recora Measurement Topic Blueprint Catalog v3

## 1. 目的

オンボーディング確定結果と、masterへ統合済みのPersona Compilation v3を入力にして、後続のTopic Compilerが日本語の測定Topicを6件選べるよう、実行時に自由生成しないTopic意味Catalogを凍結する。

```text
RecoraPromptGenerationInputV1
＋
RecoraPersonaCompilationV3（ready / 5 Persona）
＋
Topic Blueprint Catalog v3
        ↓
Child B Topic Compiler
        ↓
測定Topic 6件
```

本CatalogはTopic選定そのものを行わない。Child Aでは、候補の意味、適用条件、測定Lane、固定順、binding、alias、旧Topic移行だけを型付きデータとして確定する。

## 2. 固定version

```text
Catalog                         recora_topic_blueprint_catalog_ja_v3
Compiler（後続）                recora_measurement_topic_compiler_v1
Selection semantics（後続）     recora_topic_selection_semantics_v1
Pack policy                     recora_topic_pack_policy_ja_v1
Recipe mapping（後続）          recora_topic_recipe_mapping_ja_v1
Primary action binding          recora_topic_primary_action_binding_v1
Domain / offering binding       recora_topic_domain_offering_binding_v1
Prompt subject structure        recora_prompt_subject_structure_binding_v1
Prompt subject domain           recora_prompt_subject_domain_offering_binding_v1
Alias registry                  recora_topic_alias_registry_ja_v1
Natural citation overlay        recora_natural_citation_overlay_policy_v1
Measurement Lane policy         recora_topic_measurement_lane_policy_v1
```

市場は日本、localeは`ja-JP`。同じCatalog version内で既存Blueprint keyの意味を別用途へ変更しない。

## 3. Catalog規模

```text
Atomic Topic Blueprint  332
Pack                      44
Observation Overlay        1
最終Topic数                 6
```

Source Rowの配置は次のとおり。

```text
common                         69
customer / business structure 96
subject / offering / industry 167
合計                          332
```

332件はChild Aで凍結する初期Catalog件数である。実装時に同tierのexact duplicate、適用条件の矛盾、Lane境界の矛盾を発見した場合は、件数を勝手に変更せずIssue #169へPlan amendmentを記録する。

## 4. 44 pack

### 共通5 pack

```text
common_discovery
common_comparison
common_fit_action
common_trust_continuation
diagnostic_brand_citation
```

### 顧客・事業構造15 pack

```text
b2b_buying
b2c_decision
both_audience
family_proxy
agency_delivery
b2b2c
marketplace_demand
marketplace_supply
marketplace_operator
multi_location
franchise
subscription_membership
urgent_service
public_nonprofit
manufacturer_channel
```

### 分析対象・提供形態8 pack

```text
company_brand
offering_service
offering_product
location_facility
professional_person
saas_software
commerce_product
publisher_content
```

### 業種16 pack

```text
enterprise_it_security
healthcare_clinic
care_welfare
education_school
professional_service
recruiting_hr
real_estate
finance_insurance
travel_hospitality
restaurant_food_catering
beauty_wellness
construction_home_service
manufacturing_industrial
logistics_supply_chain
automotive_mobility
media_content_advertising
```

`marketplace_platform`は需要側・供給側・運営側へ分割する。`managed_service`、`professional_advisory`、`consumer_service`は`offering_service`内のrow subtypeとして扱い、packを重複作成しない。

## 5. TopicとPersonaの境界

```text
Persona
= 誰が質問するか
  立場、権限、利用・受益関係、経験状態

Topic
= 何について確認・比較・判断するか
  料金、口コミ、配送、返品、アクセス、資格、引用、
  セキュリティ、契約、リスク等
```

料金・口コミ・資格を確認することだけを理由にPersonaを増やさない。技術審査担当者はPersona、セキュリティ・連携・データ管理はTopicである。

## 6. 最終6TopicのPrimary Coverage

```text
T1 need_and_candidate_discovery
   課題・目的から候補を発見する

T2 comparison_and_alternatives
   候補の違い・比較・代替を確認する

T3 fit_and_selection
   利用目的・業務条件・選定基準への適合を確認する

T4 action_readiness
   購入・予約・問い合わせ・相談・申込・契約前を確認する

T5 trust_evidence_and_risk
   口コミ・実績・公式情報・資格・リスクを確認する

T6 service_specific
   その事業に固有の重要領域を確認する
```

T1〜T6は顧客向け固定名称ではなく選定枠である。Child Bでは各Primary Coverageを1件ずつ選び、出力順をT1→T6へ固定する。

## 7. Atomic Blueprintとapproved bundle

Blueprintは一つの確認領域を保持する。

```text
primary:
  b2b.technical_security

supporting:
  b2b.system_integration
  b2b.data_handling_migration
```

のような複合Topicは、後続Recipeで明示された組だけを許可する。6件へ収めるために無関係な料金・口コミ・引用・地域を動的に結合しない。

Child Aでは、各Blueprintを次の完全型へ展開する。

```text
key / pack / kind / specificity
family / primary coverage / semantic group
customer-facing template / internal summary
prompt subject label rule
typed applicability
Persona influence / role / market side
measurement goal / entity / comparison axis / answer shape / question act
measurement lane / fixed order
```

## 8. Applicability

`null`はその軸で制約しないことを表す。非空配列は許可値、空配列はCatalog不正である。

主要軸:

```text
audience scope / priority
primary・secondary subject
primary・secondary domain
primary・secondary offering
commerce channel / role
primary・secondary customer action
structure signal All / Any / None
geography / coverage / location
trust / regulation / sensitive context
Persona influence / role / market side
lifecycle
resolved food / beauty subtype
```

Topic名、説明文、Blueprint keyの文字列から適用条件を推測しない。Source Rowの省略値はPack Policyで明示的な完全値へ展開する。

## 9. Specificityと重複

優先順:

```text
structure_motion
> industry
> offering_subject
> audience
> common
```

重複は次へ分ける。

```text
exact duplicate
→ Catalogに共存させずvalidatorで拒否

specialization overlap
→ 共通候補と具体候補を保持し、後続Compilerが高いtierを優先

bundle complement
→ 異なるLane・測定行為として、approved bundle内だけ共存
```

同tier・同semantic group・同applicabilityの候補はCatalog不正とする。

## 10. Measurement Lane

```text
market_discovery
market_comparison
criteria_explanation
action_readiness
trust_risk_diagnostic
self_branded_perception
natural_citation_overlay
forced_citation_validation
named_entity_comparison_diagnostic
```

重要境界:

```text
non-branded候補発見
→ visibility / ranking / SOV候補

criteria-only
→ visibility / ranking / SOVへ自動投入しない

self-branded
→ sentiment / brand perception
→ visibility / ranking / SOVへ入れない

forced citation
→ forcedCitationValidationだけ
→ naturalCitationObservationへ入れない

named comparison
→ 自然市場発見として扱わない
```

最終metric eligibilityは後続Intent・Prompt契約が確定する。Topic Catalogは越えてはいけないLane境界を固定する。

## 11. Natural Citation Overlay

`diagnostic.natural_citation_observation`は唯一の`observation_overlay`である。

```text
selected Topic 6件へ数えない
primary / supporting Topicにしない
代替候補にしない
専用Promptを生成しない
通常Promptへ自然に付いた引用だけを観測
forced citationとは別集計
```

Child Bのready結果では、6Topicとは別にObservation Overlay 1件を返す。

## 12. Self-branded subject診断

指名Promptは分析対象がブランド型とは限らないため、正式keyは`brand_*`ではなく`subject_*`とする。

```text
diagnostic.subject_reputation_sentiment
diagnostic.subject_strengths_weaknesses
diagnostic.subject_fit_perception
diagnostic.subject_risk_concerns
diagnostic.subject_factual_accuracy
```

`subject`はcompany / brand / service / product / location_facility / professional_personを含む。旧`diagnostic.brand_*` keyは作成しない。

## 13. Primary Action binding

G0の14 actionをT4へ明示対応させる。

```text
purchase             common.pre_purchase_checks
start_subscription   common.pre_subscription_checks
reservation          common.pre_reservation_checks
visit                common.pre_visit_checks
inquiry              common.pre_inquiry_checks
request_quote        common.pre_quote_request_checks
request_material     common.pre_material_request_checks
consultation         common.pre_consultation_checks
application          common.pre_application_checks
demo_or_trial        common.pre_demo_trial_checks
contract             common.pre_contract_checks
job_application      common.pre_job_application_checks
content_view         common.content_access_conditions
content_subscription common.pre_content_subscription_checks
```

具体Recipeは、医療相談、不動産申込、EC配送等のより具体的なT4を固定できる。

## 14. Domain / Offering binding

一般FallbackのT6でもprimary domainを無視しない。

```text
IT SaaS                  saas.feature_workflow_fit
専門サービス            professional_service.expertise_specialization
消費者サービス          consumer_service.experience_fit
商品                     product.spec_quality
自動車                   automotive.vehicle_use_ownership_fit
住宅・施工               home_service.work_scope_site_conditions
飲食                     food.menu_occasion_experience_fit
美容                     beauty.treatment_service_experience
その他生活               consumer_service.experience_fit
managed service          managed_service.operating_model
physical location        location.access_transport_parking
publisher content        media.audience_advertiser_creator_ecosystem
```

医療、教育、不動産、金融、旅行、製造、物流、公共、Marketplace等は具体motionが必要であり、一般bindingから推測しない。

## 15. Prompt Subject Label

顧客向けTopic名をPrompt対象カテゴリへ流用しない。

```text
customerFacingName:
  導入効果・費用対効果

promptSubjectLabel:
  SaaS・業務ソフトウェア
```

non-branded Laneは分析対象の固有名を使わず、structureまたはdomain/offeringの承認済みカテゴリラベルを使う。固有名は`self_branded_perception`だけで使用できる。

## 16. Commerce境界

G0の`commerceChannels`と`commerceRoles`を無視しない。

```text
自社EC
小売EC
Marketplace出品
Marketplace運営
実店舗併用
メーカー・販売店経路
```

をbindingで区別する。Marketplaceでは需要側、供給側、運営側のmarket sideを持たない汎用候補を作らない。

## 17. 旧9 Topic key移行

```text
category-discovery
problem-solution
selection-criteria
alternative-search
pricing-reputation
regulated-risk
citation-check
branded-sentiment
local-regional
```

は複数意味を持つため、atomic Blueprintへsplitまたはrenameする。旧keyをCatalog v3のBlueprint keyとして再利用しない。

## 18. Child A validator

専用Verifierは最低限次を検証する。

```text
total = 332
pack = 44
pack別件数一致
key重複なし
fixedOrder = 1..332
Observation Overlay = 1
T1〜T6 primary候補あり
必須文字・配列欠落なし
applicability空配列なし
Pack PolicyとLane整合
LaneのPrompt / purpose / act / shape / metric境界整合
exact duplicateなし
同tier semantic overlapなし
14 Primary Action binding整合
Domain / label / alias / commerce registry参照整合
旧9 key未再利用
diagnostic.brand_*未作成
追加15候補とPrimary Coverage修正を確認
```

実行:

```bash
npx --no-install tsx scripts/verify-recora-measurement-topic-catalog.ts
npm run typecheck
npm run lint
npm run build
git diff --check
```

## 19. Child Aの対象外

```text
Topic Recipe
Topic Compiler
PersonaTopicEdge実行
Observation Overlay実行
Alternative replacement実行
Gold Topic selection
Intent Cell
Prompt本文
Panel編成
ProjectSetupDraft / legacy TopicDraft
オンボーディングUI
顧客・管理画面
DB / migration / Supabase
API / provider / Inngest
measurement runtime
package.json / package-lock.json
```

Child AはDraft PRでHuman Reviewへ停止する。Ready化・merge・Issue #169 close・Child B開始は別承認まで行わない。
