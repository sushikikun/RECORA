# Recora project setup draft generator quality evaluation

作成日: 2026-06-24

## 目的

`lib/recora/project-setup-draft-generator.ts` が、最小限の案件情報から `PersonaDraft` / `TopicDraft` / `PromptDraft` を作るときに、既存 Recora スキルの最低限の品質基準へどこまで近づけているかを機械的に確認する。

この評価はスキル実行ではない。`recora-persona-discovery`、`recora-prompt-topic-designer`、`recora-competitor-benchmark`、`recora-ai-citation-analysis`、`recora-schema-seo-aio`、`recora-recommendation-quality-gate-auditor` のドキュメントを、設計・評価基準として参照する。

## 評価前の弱点

- Persona は BtoB / BtoC の大枠に寄り、BtoB SaaS の意思決定者・実務利用者・比較評価者・技術確認者の分離が弱かった。
- 専門サービス、クリニック/学校、地域サービスのような業種別のロールや不安が十分に表現されていなかった。
- Topic はカテゴリ発見、課題解決、選定基準、地域、引用、ブランド感情に偏り、代替検索、料金/評判、規制・高信頼リスクの観測点が不足していた。
- Prompt は branded / non-branded の分離は保てていたが、比較・代替・料金/評判・不安のような実際の検索語に近い角度が薄かった。
- fixture が BtoB SaaS、地域サービス、入力不足に限られ、専門サービスやクリニック/学校の安全性を落とせなかった。
- BtoB高単価導入検討では、意思決定者や技術確認者は出ても、予算・稟議・契約条件を確認する `economic_buyer` が明示されにくかった。
- BtoC/EC商品比較では、BtoB寄りの「サービス/会社」「内製/外注」語彙が混ざりやすく、商品、ブランド、口コミ、返品条件、素材や品質の確認軸をfixtureで落とせなかった。

## 改善内容

- 業種アダプタを deterministic に推定し、`industryAdapter` として input completion に残す。
- BtoB SaaS は `decision_maker`、`end_user`、`evaluator`、`technical_reviewer` を分離する。
- 専門サービスは相談判断者、専門性比較、費用/リスク確認、初回相談の役割に分ける。
- クリニック系は地域比較者、初回相談者、家族/紹介者を慎重な仮説として扱い、`regulated_risk_topic` を追加する。
- 地域サービスは近隣比較、予約/申込判断、初回利用、継続/再利用を分ける。
- 高単価・稟議・セキュリティ確認が重いBtoB SaaS/クラウドでは `economic_buyer` を追加し、費用対効果、移行負荷、セキュリティ、運用体制を確認軸に含める。
- EC/商品比較では `repeat_user` を追加し、商品/ブランド、価格、口コミ、返品条件、素材や品質の語彙へ切り替える。
- `alternative_search_topic`、`pricing_reputation_topic`、`regulated_risk_topic` を追加し、最大6件の topic に収まるよう優先度を固定した。
- 代替検索 prompt は non-branded の比較候補として visibility/ranking 対象になり得る。
- 料金/評判・規制リスク prompt は評価基準やリスク確認として扱い、visibility/ranking から除外する。
- 競合、引用角度、ページ改善角度は引き続き生成しない。実名競合・引用URL・改善施策は未測定のため空配列を維持する。

## 機械評価

追加スクリプト:

```powershell
npm run recora:project-setup-draft-generator:eval
```

評価 fixture:

- Japanese BtoB SaaS
- Professional services / consulting
- Clinic or school: 今回は美容医療クリニック
- Regional service
- BtoB high-ticket adoption: 今回は製造業向け高単価クラウド
- BtoC comparison product: 今回はD2C寝具/EC商品
- Insufficient-input seed

評価観点:

- blocker がないこと、入力不足は blocker で止まること
- persona / topic / prompt の件数が契約範囲に収まること
- draft と生成 item が `needs_review` のままであること
- persona role split が業種別に満たされること
- persona が `usable_with_caution`、`sourceStatus: inferred`、`needsVerification: true` であること
- 必要 topic type が出ること
- branded sentiment / citation / regulated risk が visibility/ranking に混ざらないこと
- non-branded prompt にブランド名、alias、domain が混入しないこと
- non-branded prompt に known competitor / avoid competitor 名が混入しないこと
- BtoB prompt に「近く」「家族」「子ども」「口コミだけ」「初めてで不安」のようなBtoC色が強い語彙が不自然に混ざらないこと
- BtoC prompt に「導入」「稟議」「ROI」「費用対効果」「ベンダー選定」「SaaS」「セキュリティ」「既存ツール連携」のようなBtoB色が強い語彙が不自然に混ざらないこと
- non-branded prompt が「おすすめは？」「どこがいい？」だけに近い抽象文やキーワード羅列にならないこと
- candidate/recommendation/comparative-set の prompt だけが market metrics 対象になること
- competitor / citation angle / page improvement angle を生成しないこと
- regulated case で危険な診断・保証・結果断定の wording を避けること
- 高単価BtoBで `economic_buyer`、費用対効果、移行負荷、セキュリティ確認が含まれること
- BtoC/EC比較で `repeat_user`、raw-search-like/anxious/comparison-shortcut、返品条件/口コミ/素材確認軸が含まれること

現時点の deterministic eval は、6つの有効 fixture で最低スコアを超え、入力不足 fixture は blocker と空 draft を返す。

## スキル基準への近さ

近づいた点:

- Persona は shallow label ではなく、業種別の decision role と prompt handoff 可能な仮説に近づいた。
- 高単価BtoBでは、決裁・評価・技術確認に加えて、予算/稟議の確認roleを分けられるようになった。
- BtoC/ECでは、商品比較、口コミ、返品条件、素材や品質のような消費者語彙へ寄せられるようになった。
- BtoB/BtoC別に non-branded prompt の自然文テンプレートを分け、BtoBは導入判断、社内承認、費用対効果、運用負荷、既存ツール連携に寄せた。
- BtoC/地域/クリニック/スクール/ECでは、失敗回避、口コミ、料金、自分に合うか、通いやすさ、初めて選ぶ不安に寄せた。
- `knownCompetitors` / `avoidCompetitors` がseedにあっても、non-branded prompt には競合名を混ぜない検証を追加した。
- Topic-first で metric target / expected signal / brand mention policy を保てている。
- Branded sentiment と non-branded visibility/ranking の分離は維持できている。
- Regulated / high-trust では、診断・治療・成果保証ではなく、資格・費用・リスク・相談前確認へ変換できる。

まだスキル同等ではない点:

- topicごとの prompt variant は増えたが、site text や customer evidence に基づく標準診断の prompt set 密度にはまだ届かない。
- persona は site/customer evidence ではなく最小入力からの仮説で、validated customer segment ではない。
- 実競合、実引用URL、source-to-claim、ページ改善候補は生成しない。
- raw search-like / anxious wording は一部に入ったが、業界ごとの語彙はまだ固定ルール中心。
- citation / competitor / schema skill への本格 handoff payload は未実装。

## prompt variation policy

今回のgeneratorは、`1 topic -> 1 prompt` の薄い設計から、topicごとに複数の `PromptDraft` を作る設計へ広げる。

基本方針:

- 通常topicは2件前後、selection/localのようにbuyer intentや意思決定が濃いtopicは3件前後、citation/brandedは1から2件に抑える。
- 全体は最大18件、topic単位では最大4件に抑え、標準診断の下書きとして過剰生成しない。
- 追加promptは、同じ意味の言い換えではなく、buyer journey、persona role、language mode、response shape、metric eligibility のいずれかが変わることを条件にする。
- `persona_specific_topic` は、criteria確認だけでなく、候補が自然に出るnon-branded shortlist promptも持つ。ただしcriteria-only promptはvisibility/ranking/SOVに入れない。
- `citation_evidence_topic` は citation/source 確認専用で、ranking evidence として扱わない。
- `branded_sentiment_topic` は sentiment / brand perception 専用で、visibility/ranking/SOVから除外する。
- non-branded promptにはbrand name、alias、domain、known competitor、avoid competitorを混ぜない。比較promptにtarget brandや実名競合が入る場合は市場metric対象にしない。
- BtoB SaaS、BtoB高単価導入、professional services、clinic/school、regional service、BtoC/EC商品比較では、文体と確認軸を変える。BtoBでは導入判断・比較検討・社内承認・運用負荷・既存ツール連携、高単価BtoBでは費用対効果・移行負荷・セキュリティ・契約前確認、専門サービスでは費用・実績・相談前確認、clinic/schoolでは初めて選ぶ不安・口コミ・資格・リスク、地域サービスでは通いやすさ・予約・口コミ・料金、BtoC/ECでは料金・口コミ・返品条件・自分に合うかを重視する。
- 不十分seedではprompt数を無理に増やさず、blocker/warningと空draftを返す。
- 生成promptはすべて `needs_review` / `revise_before_measurement` のままにし、`derivePromptMetricEligibility` と `getPromptMeasurementReadiness` で既存のmetric/readiness判定を通す。

## 次のPR候補

- site text / customer evidence を受け取れるようになった後、prompt variant の語彙を実データで段階的に上げる。
- seed に `knownCompetitors` がある場合だけ competitor comparison prompt を安全に分離する。
- site text / customer evidence を受け取れるようになった後、persona confidence と sourceStatus を段階的に上げる。
- `recora-ai-citation-analysis` 向けの source observation placeholder を、生成ではなく handoff plan として設計する。

## Service Evidence Scoring Evaluation

The eval now checks the category/topic inference layer added for service-evidence based setup drafts.

- `service_evidence_category_scoring` confirms that the generated draft records the same winning category as `scoreCategoryCandidates`.
- `question_area_specificity` confirms that scored question-area candidates are reflected in generated topic names and input completion.
- A Recora-like brand name is explicitly guarded so the `ec` fragment in `Recora` does not trigger ecommerce/product classification.
- Recruiting SaaS evidence is checked so hiring/candidate-management topics beat generic SaaS defaults.
- UTF-8 file-based regression fixtures cover BtoB SEO/AI search, recruiting SaaS, beginner English school, kids English school, beauty clinic, mattress EC, cosmetics EC, local service, and professional service.
- The regression fixtures assert that customer-facing question areas do not expose English/raw labels, non-branded prompts do not leak brand/alias/domain/competitor signals, and thin BtoC price/cost wording does not trigger `finance_investment`.
- These checks remain deterministic and local. They do not fetch URL content, crawl pages, call OpenAI/external APIs, write to DB/Supabase, run measurement, save, approve, or materialize.
