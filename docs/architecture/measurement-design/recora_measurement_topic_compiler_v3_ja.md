# Recora Measurement Topic Compiler v3

## 1. 目的

本Compilerは、確定済みのPrompt Generation Input v1、Persona Compilation v3、Topic Blueprint Catalog v3を入力として、後続のIntent Cell Compilerが使用する日本語の測定Topicを決定論的に6件生成する。

```text
RecoraPromptGenerationInputV1
+
RecoraPersonaCompilationV3（ready / selected = 5）
+
recora_topic_blueprint_catalog_ja_v3（332 Blueprint）
        ↓
Persona RecipeからTopic Recipeを一意に解決
        ↓
Applicability・Action・Domain・Persona authorityを検証
        ↓
T1〜T6を各1件選定
        ↓
PersonaTopicEdge・Stable ID・Observation Overlayを生成
```

TopicはPrompt本文でもPersonaでもない。複数の質問行為へ展開できる、確認・比較・判断領域の意味単位である。

## 2. 固定version

```text
Selection input      recora_topic_selection_input_v3
Selected Topic       recora_measurement_topic_v3
Compilation          recora_topic_compilation_v3
Compiler             recora_measurement_topic_compiler_v1
Catalog              recora_topic_blueprint_catalog_ja_v3
Selection semantics  recora_topic_selection_semantics_v1
Recipe mapping       recora_topic_recipe_mapping_ja_v1
Gold Fixture         recora_topic_gold_fixtures_ja_v3
Overlay policy       recora_natural_citation_overlay_policy_v1
```

実装基準はChild A merge commit `98833cb33021e69bb8ac88e35e63c3af63776257`である。

## 3. Child A authorityの不変条件

Child Bは、Child Aで凍結した次のauthorityを読み取り専用として消費する。

```text
332 Topic Blueprint
44 Topic Pack Policy
Catalog Source Row
fixedOrder
Applicability
canonical semantic group / semantic variant
review済みSecondary Coverage
Measurement Lane / metric boundary
14 Primary Action binding
Domain / offering T6 binding
Prompt Subject Label binding
Alias registry
Natural Citation Observation Overlay
```

CompilerはBlueprint key、日本語表示文、pack名から隠れた条件を推測しない。条件判定には凍結済みのtyped applicabilityを使用する。

## 4. 入力契約

```ts
type RecoraTopicCompilerInputV3 = {
  contractVersion: "recora_topic_selection_input_v3";
  generationInput: RecoraPromptGenerationInputV1;
  personaCompilation: RecoraPersonaCompilationV3;
};
```

Profile sizeは入力へ含めない。

```text
TopicSet(50) = TopicSet(100) = TopicSet(200) = 6件
```

プラン差は後続のIntent・Persona視点・比較条件・Prompt配分で付ける。

## 5. 入力ゲート

選定前に次をfail-closedで検証する。

```text
Topic input contract version
G0 input contract / country / locale
Persona Compilation contract / compiler / catalog version
Persona Compilation status
selected Persona = 5
personaId一意
selectionSemanticKey一意
sortOrder一意
各PersonaのtopicInfluenceDimensions >= 2
Topic Catalog validator = valid
Topic Recipe authority = valid
```

Persona statusは次のように伝播する。

```text
needs_review → Topic needs_review
catalog_gap  → Topic catalog_gap
blocked      → Topic blocked
ready        → Topic選定へ進む
```

ready以外ではselected Topic、PersonaTopicEdge、alternative、Observation Overlayを返さない。

## 6. Topic Recipe authority

Topic RecipeをG0から独立に再推定しない。

```text
personaCompilation.recipeKey
        ↓
1対1のTopic Recipe mapping
```

全35 Persona Recipeに対応する35 Topic Recipeを固定する。各RecipeはT1〜T6の6slot、構造signal、必須market sideを持つ。

各slotのPrimary authorityは次のいずれかに限定する。

```text
fixed_blueprint
primary_action_binding
domain_offering_binding
```

T1、T2、T3、T5はreview済みatomic Blueprintを固定する。T4は14 Primary Action binding、T6はspecific BlueprintまたはDomain / offering bindingを使用する。固定候補がApplicabilityを満たさない場合でも、Recipe内に明示されたfallback keyまたはfallback packの範囲外へ自由探索しない。

Catalog全体から単純なscore上位6件を選ぶ方式は採用しない。

## 7. T1〜T6

選定Topicは必ず6件で、Primary Coverageは各1件とする。

```text
T1 need_and_candidate_discovery
   課題・目的から候補を発見する領域

T2 comparison_and_alternatives
   候補の違い、比較、代替を確認する領域

T3 fit_and_selection
   利用目的・業務適合・選定基準を確認する領域

T4 action_readiness
   購入、予約、問い合わせ、相談、申込、契約等の直前条件

T5 trust_evidence_and_risk
   口コミ、実績、公式情報、引用、資格、リスクを確認する領域

T6 service_specific
   その事業で特に重要な固有領域
```

T1〜T6は顧客向け固定表示名ではない。表示名は選定されたBlueprint bundleから生成する。

### T4

G0のprimary actionを14件のPrimary Action bindingへ解決する。入力actionと一致しないBlueprintへ置換しない。

### T6

Specific Recipeでは、その事業構造に対応する固定Blueprintを優先する。Generic RecipeではDomain / offering bindingを使用する。安全な候補または対象ラベルを確定できない場合は自由推定せず停止する。

## 8. Applicability

Applicabilityは次の規則で評価する。

```text
Any   入力と1件以上交差する
All   指定値をすべて保持する
None  指定値と交差しない
null  その軸では制約なし
```

対象軸:

```text
audience scope / priority
primary / secondary subject
primary / secondary business domain
primary / secondary offering model
commerce channel / role
primary / secondary action
structure signal Any / All / None
geographic binding / service coverage / location structure
trust class / decision impact / regulation / sensitive context
Persona influence / role family / market side
lifecycle
resolved subtype
```

Blueprint上位の`personaInfluencesAny`、`personaRoleFamiliesAny`、`marketSidesAny`もeligibilityとEdge authorityとして使用する。

## 9. Focus・Diagnosis・Subtype

自由文を直接scoreまたはFingerprintへ入れない。

```text
NFKC
trim
空白正規化
review済みalias registryへmapping
mapping keyを固定順へ正規化
```

```text
optional focus未解決
→ warning

required focus未解決
→ needs_review

同じCoverageで必須テーマが競合
→ needs_review

地域必須テーマ + 地域contextなし
→ needs_review

lifecycle必須テーマ + Persona lifecycle状態なし
→ needs_review

food / beauty同時一致
→ needs_review
```

`business.summary`の全文はFingerprintへ含めず、解決後のsubtype keyだけを含める。

## 10. Prompt Subject Label

顧客向けTopic名称とPrompt本文の対象ラベルを分離する。

```text
primary_subject_name
→ self_branded_perceptionだけ

structure_signal
→ Recipeで確定したstructure signalの固定label

domain_offering
→ frozen bindingの最具体一致

fixed_catalog_label
→ Catalogで承認済みのlabel key
```

non-branded Laneへ分析対象固有名を挿入しない。安全な対象ラベルを作れない場合は`needs_review`で停止する。

## 11. PersonaTopicEdge

EdgeはTopicとPersonaの意味のある関係を後続へ渡す。

```ts
type RecoraPersonaTopicEdgeV3 = {
  personaId: string;
  topicId: string;
  edgeRole: "primary" | "supporting";
  matchedBlueprintKeys: readonly string[];
  matchedInfluenceDimensions: readonly RecoraPersonaTopicInfluenceDimension[];
  matchedRoleFamilies: readonly RecoraPersonaRoleFamily[];
  matchedMarketSides: readonly RecoraGenerationCustomerSide[];
  reasons: readonly string[];
};
```

primary Edgeは各Recipe slotのreview済みPersona sort-order selectorとCatalogのPersona authorityの両方を満たすPersonaだけから選ぶ。supporting EdgeもRecipe selectorとCatalog authorityのAND条件で生成する。

必須条件:

```text
各Topicに最低1 primary Edge
各Topicに最低1 Persona
全5Personaが最低2 Topicへ接続
1Personaだけを全6Topicの唯一のprimaryにしない
同じPersona・TopicのEdgeを重複生成しない
Recipeで要求されたmarket sideを維持
```

## 12. Measurement Lane

bundleへまとめてもBlueprintごとのLaneを保持し、一つのLaneへ潰さない。

主要境界:

```text
market discovery / comparison
→ visibility・ranking・SOVの候補

criteria explanation / action readiness / trust risk
→ 原則としてrecommendation・risk診断

self-branded perception
→ sentiment・brandPerception
→ visibility・ranking・SOV禁止

forced citation validation
→ forcedCitationValidation
→ naturalCitationObservation禁止

named entity comparison diagnostic
→ 自然市場発見として集計しない
```

最終metric eligibilityは後続Intent / Prompt契約が確定するが、Compilerは越えてはいけないLane境界を返す。

## 13. Natural Citation Observation Overlay

自然引用はselected Topicに数えない。

```text
selected Topic       6件
Observation Overlay  1件
```

```ts
type RecoraTopicObservationOverlayV3 = {
  overlayKey: "diagnostic.natural_citation_observation";
  policyVersion: "recora_natural_citation_overlay_policy_v1";
  laneKey: "natural_citation_overlay";
  appliesToTopicIds: readonly string[];
  excludedLaneKeys: readonly RecoraTopicMeasurementLaneKeyV3[];
  metricKey: "naturalCitationObservation";
  reasons: readonly string[];
};
```

専用Promptは生成しない。通常Promptへ自然に付いた引用を6Topic横断で観測し、forced citation Laneは対象外にする。

## 14. FingerprintとStable ID

Fingerprintはstable canonical JSONのSHA-256とする。

含める:

```text
selection / catalog / compiler / recipe / overlay policy version
market / locale
subject type / semantic name / secondary subject type
resolved Prompt Subject Label key
resolved subtype key
audience
business / commerce
actions
delivery / geography
trust
structure signals
customer sides
actor relation
lifecycle
mapped focus / diagnosis key
5 Personaのsemantic情報とsortOrder
```

含めない:

```text
50 / 100 / 200 Profile
配列順序
重複値
raw business summary全文
raw focus / diagnosis文字列順序
G0保存fingerprint
Persona displayName / description / selectionEvidence
Topicの実際の日本語表示文
reasons / warnings / timestamp
```

Topic ID:

```text
topicId = topic_v3_ +
  SHA-256(topicSelectionFingerprint + Topic semantic projection)の先頭32hex
```

Topic semantic projectionにはPrimary Coverage、primary / supporting Blueprint key、表示template key、Prompt Subject Label key、Lane key、Persona semantic keyとEdge roleを含める。

## 15. Alternative

Recipeに明示されたreview済みalternative Blueprintだけを対象にする。候補ごとに仮想6Topic Setを作り、次を再検証する。

```text
exactly 6
T1〜T6各1
semantic重複なし
ID衝突なし
Applicability
Prompt Subject Label
Measurement Lane
各Topic primary Edge
全5Persona最低2Topic
required market side
geography / trust / action / lifecycle
```

安全な代替候補が0件でも`alternatives = []`でreadyを許可する。

## 16. Status

```text
ready
needs_review
catalog_gap
blocked
```

### needs_review

利用者または運用者が構造化情報を確認すれば安全に続行できる状態。

### catalog_gap

必要なBlueprint、bundle、Coverage、Edgeまたはmarket sideをCatalog authority内で成立させられない状態。

### blocked

入力version、Persona identity、Catalog validator、Stable ID等の契約違反または内部不変条件違反。

## 17. GoldとVerifier

Base Fixture:

```text
ready          35
needs_review   10
catalog_gap     7
blocked        10
合計           62
```

ready 35件は全Persona Recipeへ1対1で対応する。FixtureはTopic selection rules、Topic Catalog、Topic Compilerから期待値をimportせず、Recipe key、T1〜T6 authority、T5 supporting、status codeをliteral dataとして保持する。

```text
35 × 15 invariance     525
35 × 9 meaning-change  315
Base Fixture            62
最低合計               902
```

Invarianceでは配列順、重複、外部Profile、保存fingerprint、表示文、evidence等を変えてもTopic semantic outputが変わらないことを確認する。

Meaning-changeではaudience priority、primary action、offering model、structure motion、geography、trust、Persona modifier、required focus、market sideの変化がFingerprint、Topic、Edgeまたはstatusへ反映されることを確認する。

実行:

```bash
npx --no-install tsx scripts/verify-recora-measurement-topic-catalog.ts
npx --no-install tsx scripts/verify-recora-measurement-topic-compiler.ts
npx --no-install tsx scripts/verify-recora-measurement-persona-compiler.ts
npm run recora:prompt-generation-g0:check
npm run recora:prompt-measurement-contract:check
npm run recora:preflight:full
npm run typecheck
npm run lint
npm run build
git diff --check
npm run recora:commit-check
```

`package.json`へ専用scriptは追加しない。

## 18. 実装配置

Compiler固有のinput / output / status / identity型は`measurement-topic-compiler.ts`からexportする。これにより、Child Aで凍結したCatalog authoring authorityを変更せずに、Compiler contractを独立して追加する。

## 19. Scope境界

本実装は次を変更しない。

```text
package.json
package-lock.json
332 Topic Catalogの意味
44 Pack Policyの意味
G0契約
Persona Compiler
ProjectSetupDraft
legacy TopicDraft
UI
DB / migration / Supabase
API / provider / Inngest
measurement runtime
Intent Cell Compiler
Prompt本文生成
Panel Compiler
fixed Prompt materialization
```

## 20. PR停止位置

```text
専用branch
Child Bの指定範囲のみ
Draft PR
Human Review
Ready化しない
mergeしない
Issue #169を閉じない
```
