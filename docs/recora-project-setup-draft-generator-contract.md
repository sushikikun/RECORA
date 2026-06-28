# Recora 案件設定下書き生成器契約

作成日: 2026-06-24

この契約は、最小限の案件情報から `ProjectSetupDraft` の下書きを決定的に生成する TypeScript 生成器を説明する。対象実装は `lib/recora/project-setup-draft-generator.ts` と `scripts/verify-recora-project-setup-draft-generator.ts`。

## 目的

会社名、ブランド名、公式URL、サービス説明、業種、対象顧客、地域、言語などの `ProjectSetupSeedInput` から、内部レビュー用の `PersonaDraft`、`TopicDraft`、`PromptDraft` を作る。

生成結果は計測対象ではなく、未承認の下書きとして扱う。DB保存、Supabase migration、UI、OpenAI/API呼び出し、Webクロール、計測実行、自動承認、自動公開は行わない。

## 無料診断後の初期設定ウィザード

`app/onboarding/project-setup/page.tsx` は、無料診断 / 新規登録後に続く初期設定導線として `generateProjectSetupDraft` を画面内で利用する。会社情報からカテゴリ判定、persona / topic / prompt 下書き確認までを行う。

- 各ステップの下書きは画面内で編集できるが、保存・承認・materialize は未実装。
- DB write、Supabase write、外部API呼び出し、Webクロール、計測実行は行わない。
- 入力値と編集内容は React state のみで保持し、ページ reload で消えてよい。
- prompt 詳細は初期状態で畳み、「プロンプトを確認・変更する」で表示する。
- 「入れてほしいプロンプト」は優先採用候補として上部に表示するが、metric eligibility は Recora の既存方針に従う。
- brand / alias / domain を含む prompt は branded / brand perception 用として扱い、visibility / ranking / SOV 対象外候補として表示する。
- knownCompetitors / avoidCompetitors を含む prompt は実名競合入り prompt として扱い、visibility / ranking / SOV 対象外候補として表示する。
- 公開用サンプルJSONは追加しない。

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
- 未承認promptがmeasurement readyにならない
- 重複persona/topic/promptがない
- 入力不足時にblockerが返る
- 未承認draftをmaterialize判定が拒否する
- 生成結果が既存 `validateProjectSetupDraft` を通る

実行:

```powershell
npm run recora:project-setup-draft-generator:check
```
