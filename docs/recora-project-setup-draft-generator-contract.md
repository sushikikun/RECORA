# Recora 案件設定下書き生成器契約

作成日: 2026-06-24

この契約は、最小限の案件情報から `ProjectSetupDraft` の下書きを決定的に生成する TypeScript 生成器を説明する。対象実装は `lib/recora/project-setup-draft-generator.ts` と `scripts/verify-recora-project-setup-draft-generator.ts`。

## 目的

会社名、ブランド名、公式URL、サービス説明、業種、対象顧客、地域、言語などの `ProjectSetupSeedInput` から、内部レビュー用の `PersonaDraft`、`TopicDraft`、`PromptDraft` を作る。

生成結果は計測対象ではなく、未承認の下書きとして扱う。DB保存、Supabase migration、OpenAI/API呼び出し、Webクロール、計測実行、自動承認、自動公開は行わない。

## 無料診断後の初期設定ウィザード

`app/onboarding/project-setup/page.tsx` は、無料診断 / 新規登録後に続くAPI前の測定条件確認画面として `generateProjectSetupDraft` を画面内で利用する。顧客が詳細な persona / topic / prompt / category を作成する画面ではなく、Recoraが測定設計に入る前提を確認する画面である。

画面は5ステップ構成とする:

1. ブランド確認
2. サービス理解・市場・顧客層・競合
3. 見たいこと
4. プロンプト例
5. 最終確認

画面で顧客に確認する項目:

- 正式なブランド名 / サービス名、表記ゆれ・別名、公式URL
- サービス説明、サービスカテゴリ、対象市場・地域、測定する言語、BtoB / BtoC、ペルソナ
- 比較したい競合、競合未定 / Recoraで候補抽出
- 特に見たいこと、今回知りたいこと
- Recoraが生成したプロンプト例、顧客が追加したいプロンプト
- 最終確認としてブランド情報、サービス理解、市場・言語、ペルソナ、競合、見たいこと、プロンプト例

画面の役割:

- 入力値は React state のみで保持し、ページ reload で消えてよい。
- Step1の次へ進行時に、ユーザーが入力した公式URLだけを対象に単一ページ確認を行ってよい。確認対象は title、meta description、og:site_name、h1、canonical、hostname に限定する。
- 公式URL確認はサービス説明・カテゴリの候補作成とブランド名 / 別名がページ情報に含まれるかの確認にだけ使う。確認できない場合も、Step2の手入力をブロックしない。
- Step2では公式URL確認結果としてページタイトル、説明文、ブランド確認結果を表示し、「公式URLを開いて確認」リンクを置いてよい。
- Step2に競合入力を統合し、除外系 / NG系の顧客入力は置かない。
- Step3は「見たいこと」だけに絞り、除外・NG系の入力を置かない。
- Step4で、画面内の同期処理として `generateProjectSetupDraft` を呼び、Recoraが生成した質問領域とプロンプト例を表示する。
- Step1からStep3までの入力から `ProjectSetupSeedInput` を作り、`generateProjectSetupDraft` が作るカテゴリ / persona / topic / prompt 下書きを顧客向け表示へ変換する。
- 顧客向け表示では、カテゴリは「サービスカテゴリ」、personaは「ペルソナ」、topicは「質問領域」、promptは「プロンプト例」として扱う。
- Step4ではプロンプト例を直接編集・削除でき、追加したプロンプトはStep5の最終確認に反映する。
- Step5は最終確認のみとし、計測設計、計測量、利用モデル、頻度、費用感を顧客が決める項目として扱わない。
- 顧客には詳細personaや細かいtopicの作成を要求しない。内部の persona / topic / prompt は raw generator output としてそのまま表示しない。
- UIには `businessModel`、`industryAdapter`、`topicType`、`roleType`、blocker ID、warning ID などの内部IDや生の内部分類を出さない。
- 顧客向けUIではStep4/Step5のラベルとして「プロンプト例」を使うが、内部IDや `promptId` は表示しない。
- 競合が未定でも進行できる。`knownCompetitors` は空配列、画面状態は `competitor_discovery_needed` とする。
- 競合未定時、AI表示率、自社サイト引用率、AI回答、参照元、ブランド認知は確認対象にできる。Share of Voice は制限付き、ブランド比較、競合に取られている質問、競合に取られている参照元は自動検出候補扱いとする。正式な比較には後続の承認が必要。
- 新しい永続fieldやDB schemaは追加しない。
- 公開用サンプルJSONは追加しない。

画面が行わないこと:

- DB write、Supabase write、OpenAI API呼び出し、検索、AI計測、計測実行
- ユーザー入力URL以外への確認、複数ページ取得、サイトマップ取得、リンク探索、ページ内URLのクロール、大量HTML解析
- 保存、承認、materialize、レポート確定、認証本実装、middleware変更、`package-lock.json` 変更

公式URL単一ページ確認の安全境界:

- 入力URLは http / https のみ許可し、認証情報と fragment は使用しない。
- localhost、`.localhost`、127.0.0.0/8、10.0.0.0/8、172.16.0.0/12、192.168.0.0/16、link-local、loopback、private、documentation、multicast などのローカル / 非公開IPは拒否する。
- ホスト名はDNS解決後の全IPを検査し、非公開IPが含まれる場合は拒否する。
- リダイレクトは少数回だけ追跡し、各転送先URLも同じ条件で再検証する。
- レスポンスはHTML本文の先頭だけを上限付きで読み、title、meta description、og:site_name、h1、canonical 以外のページ解析に広げない。

## 主な関数

- `generateProjectSetupDraft(seed, options)`: 下書き、blocker、warning、生成summaryを返す。
- `generatePersonaDrafts(seed)`: 最小入力から persona 仮説を2から5件作る。通常は3から4件に抑え、高単価・稟議・セキュリティ確認が重いBtoBでは予算/稟議roleを追加できる。
- `generateTopicDrafts(seed, personas)`: topic-firstで3から6件の診断topicを作る。
- `generatePromptDrafts(seed, personas, topics)`: topic/personaに紐づく自然文promptを必要最小限作る。
- `deduplicateProjectSetupDraft(draft)`: persona/topic/promptの重複候補を安定的に落とす。
- `validateGeneratedProjectSetupDraft(draft)`: 生成器固有の安全条件を検証する。

`generateProjectSetupDraft` は日時を自動で入れない。既定の `generatedAt` は `null` なので、同じseedから同じ結果が返る。

## 生成対象

今回生成する:

- `PersonaDraft`
- `TopicDraft`
- `PromptDraft`

今回生成しない:

- `CompetitorDraft`
- `CitationAngleDraft`
- `PageImprovementAngleDraft`

生成しない項目は空配列として保持する。根拠のない競合、引用元、改善案は作らない。

## ペルソナ生成

persona は顧客セグメントの確定値ではなく、prompt設計のための仮説として扱う。

- BtoBでは導入判断者、比較評価担当者、技術/運用確認者または実務利用者を分ける。
- 高単価・稟議・セキュリティ確認が重いBtoBでは、予算、費用対効果、契約条件を確認する `economic_buyer` も分ける。
- BtoC/地域サービスでは比較検討者、購入/申込判断者、初回利用者を分ける。EC/商品比較では継続利用、返品条件、保証、購入後満足を確認する `repeat_user` も慎重な仮説として扱う。
- `reviewStatus` は `needs_review`。
- `promptReadiness` は原則 `usable_with_caution`。
- `sourceStatus` は `inferred`。
- customer dataや実測がないため `needsVerification` は `true`。

## トピック生成

topic は prompt より先に作る。

標準では次の観点を小さく生成する。

- 候補発見と比較
- 課題認識と解決方法
- 選定基準と導入前確認
- 地域性がある場合の地域比較
- citation確認が必要な場合の引用元・根拠確認
- sentiment確認が必要な場合のブランド認識・評判確認

branded sentiment topic は visibility/ranking/SOV に混ぜない。

## プロンプト生成

prompt は必ず `topicId` と `personaId` を持つ。

- non-branded prompt はブランド名、alias、domainを含めない。
- non-branded prompt は `knownCompetitors` や `avoidCompetitors` が入力されていても、実名競合を含めない。比較候補は unknown competitor / category discovery として扱う。
- BtoB の non-branded prompt は、導入判断、比較検討、費用対効果、運用負荷、セキュリティ、社内承認、既存ツール連携、契約前確認のような実務文脈に寄せる。
- BtoC の non-branded prompt は、失敗回避、口コミ、料金、自分に合うか、初めて選ぶ不安、通いやすさ、家族への適合のような消費者文脈に寄せる。
- 「おすすめは？」「どこがいい？」だけに近い短すぎる文や、SEOキーワード羅列に近い文は生成しない。
- buyer intent prompt は候補や推薦順を自然に聞く形にし、market metric対象になり得る。
- selection criteria prompt は評価軸確認用で、visibility/ranking対象にしない。
- EC/商品比較では、サービス会社向け語彙ではなく、商品、ブランド、価格、口コミ、返品条件、素材や品質を確認軸にする。
- 高単価BtoBでは、価格だけでなく費用対効果、移行負荷、セキュリティ、運用体制を確認軸にする。
- citation_check prompt は citation確認用として分離し、ranking evidenceにしない。
- branded prompt は sentiment / brand perception確認用だけにする。
- 生成promptの `reviewStatus` は `needs_review`、`gateDecision` は `revise_before_measurement`。

指標判定は既存の `derivePromptMetricEligibility` と `getPromptMeasurementReadiness` を利用する。

## blocker / warning

必須seedが不足している場合は、無理にpersona/topic/promptを作らずblockerを返す。

warningは主に次を示す。

- 内部レビューが必要
- 競合未入力のため `unknown_competitor_discovery` を使う
- 強みやリスクが未入力
- 対象顧客が広すぎる
- 高信頼/規制領域として慎重なレビューが必要

## fixture検証

`scripts/verify-recora-project-setup-draft-generator.ts` は架空seedだけを使う。

- BtoBソフトウェア
- BtoB高単価導入検討
- BtoC比較検討/EC商品
- 地域サービス/BtoC寄りサービス
- 士業またはコンサル系
- クリニックまたはスクール系
- 最小入力不足seed

検証すること:

- 同じseedから同じ結果が返る
- persona/topic/promptの参照関係が壊れていない
- non-branded promptにブランド名やaliasが含まれない
- `knownCompetitors` が入力されても non-branded prompt に競合名が含まれない
- BtoB prompt に「近く」「家族」「子ども」「口コミだけ」「初めてで不安」のようなBtoC色が強い語彙が不自然に混ざらない
- BtoC prompt に「導入」「稟議」「ROI」「費用対効果」「ベンダー選定」「SaaS」「セキュリティ」「既存ツール連携」のようなBtoB色が強い語彙が不自然に混ざらない
- non-branded prompt が抽象的すぎる短文やキーワード羅列にならない
- branded promptがvisibility/ranking/SOV対象にならない
- branded sentiment promptがsentiment / brandPerception用になる
- buyer intentのnon-branded promptがmarket metric対象になり得る
- 高単価BtoBで `economic_buyer`、費用対効果、移行負荷、セキュリティ確認が出る
- BtoC/EC比較で `repeat_user`、raw-search-like/anxious/comparison-shortcutの文体、口コミ/返品条件/素材などの確認軸が出る
- 未承認promptが計測可能扱いにならない
- 重複persona/topic/promptがない
- 入力不足時にblockerが返る
- 未承認draftをmaterialize判定が拒否する
- 生成結果が既存 `validateProjectSetupDraft` を通る

実行:

```powershell
npm run recora:project-setup-draft-generator:check
```


## Onboarding UI suggestion profiles

`/onboarding/project-setup` builds `ProjectSetupSeedInput` from Step1 through Step3 customer inputs, then calls `generateProjectSetupDraft` before Step4. The generator output is converted into customer-facing labels instead of showing raw internal names.

- category -> service category support
- `PersonaDraft` -> customer-readable persona labels
- `TopicDraft` -> question areas
- `PromptDraft` -> prompt examples

The onboarding UI uses a screen-side suggestion profile helper equivalent to `deriveOnboardingSuggestionProfile`. It switches candidate chips and fallback examples based on service category, service description, BtoB/BtoC selection, and audience targets. It must not always show SaaS-first candidates.

Supported profile keys:

- b2bSaasOrSeo
- b2bProfessionalService
- b2cSchoolEducation
- healthcareClinic
- localService
- ecommerceProduct
- genericB2C
- genericB2B

Step2 and Step3 candidate chips, plus Step4 fallback prompt examples, should follow this profile. Step4 prioritizes generator output when it is available. For consumer-facing profiles such as school, clinic, local service, ecommerce, and generic B2C, obviously BtoB adoption terms such as internal approval, security review, ROI, operational burden, existing-tool integration, or SaaS procurement should be filtered from customer-facing prompt examples. If that leaves no suitable generated prompt, use the profile-specific fallback examples.

Step5 final confirmation reflects generated persona labels, question areas, prompt examples, and any prompt examples added by the customer in Step4. Customer-facing UI must not expose raw generator output or internal fields/IDs such as `businessModel`, `industryAdapter`, `topicType`, `roleType`, `promptId`, `personaId`, or `topicId`.

### Customer-facing persona display

The onboarding UI must not show `PersonaDraft` raw fields directly.

- The onboarding persona model borrows the SPASM-style separation of persona schema, plausibility validation, and natural-language persona crafting, but it does not add an external dependency or copy external OSS code.
- Recora adapts that idea into a UI-only `OnboardingPersonaFrame` flow: propose persona frames from Step1-Step3 inputs, selected chips, and `PersonaDraft`; validate category / BtoB-BtoC fit; then render customer-facing labels and descriptions.
- `OnboardingPersonaFrame` is not a database schema and does not change `ProjectSetupDraft`; it exists only to make customer-facing onboarding personas more stable and useful for Step4/Step5 confirmation.
- Persona frames may use `PersonaDraft.displayName`, `promptAngle`, `painPoints`, `proofNeeded`, `comparisonAxis`, and `buyerStage` as material, but must not show raw `personaId`, `roleType`, `detailedDecisionRole`, `sourceStatus`, `confidenceScore`, `needsVerification`, `decision_maker`, `evaluator`, or `end_user`.
- Category profiles must validate persona fit before rendering: BtoC flows should remove BtoB/SaaS role labels, BtoB flows should remove stale consumer-only labels, EC should carry price/review/quality/return-condition concerns, clinic should carry fee/review/qualification/risk concerns, and school should carry first-time/fee/review/fit concerns.
- `targetCustomers` should be generated from the validated persona frames as natural context for the generator, not as raw chip concatenation or mechanically joined BtoB/BtoC role suffixes.
- Show customer-facing labels under `ペルソナ`, not `主に見たい相手`.
- Normalize `PersonaDraft.displayName` into short customer-readable persona labels.
- Do not mechanically combine BtoB/BtoC, audience chip text, and role suffixes into persona names.
- Do not expose `roleType`, `personaId`, `decision_maker`, `evaluator`, `end_user`, `sourceStatus`, confidence scores, or raw role mappings.
- Build `ProjectSetupSeedInput.targetCustomers` as natural context, not as a raw joined UI label list.
- Regenerate the customer-facing persona display when the persona source context changes: brand name, service description, service category, BtoB/BtoC selection, selected audience chips, regions, language, watch topics, report goals, competitor mode, or known competitors.
- Treat selected audience chips, generated `PersonaDraft`, and profile fallbacks as display candidates, then filter out candidates that do not match the current suggestion profile.
- For BtoC school, clinic, local-service, ecommerce, and generic BtoC flows, do not keep stale BtoB/SaaS persona labels such as SEO担当者, マーケティング責任者, 導入を判断する責任者, Web担当者, or 事業責任者.
- For BtoB flows, do not replace the intended business viewers with stale consumer-only labels such as 初めて選ぶ人, 料金を比較する人, 口コミを重視する人, 価格を比較する人, or 返品条件を確認したい人.
- For BtoB, use labels such as `SEO担当者`, `マーケティング責任者`, `導入を判断する責任者`, `比較検討する担当者`, or `実際に利用する担当者`.
- For BtoC, EC, school, clinic, and local-service flows, use labels such as `初めて選ぶ人`, `料金を比較する人`, `口コミを重視する人`, `品質を確認したい人`, `返品条件を確認したい人`, or `初めて相談する人`.

### Step4 and Step5 confirmation display

Step4 and Step5 are customer-facing confirmation screens, not raw generator management screens.

- Step4 shows prompt examples as a readable review list, grouped into generated prompt examples and customer-added prompt examples.
- Step4 allows editing, deleting, and adding prompt examples, and those changes must be reflected in Step5.
- Step5 starts with a compact summary, then shows customer-readable confirmation sections for brand, service, market/language, viewers, competitors, and question areas.
- Step5 summarizes generated prompt examples and customer-added prompt examples without exposing internal prompt IDs or generator internals.
- Step4 and Step5 must keep the no-save/no-approval/no-measurement boundary clear.
