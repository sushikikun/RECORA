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

## 改善内容

- 業種アダプタを deterministic に推定し、`industryAdapter` として input completion に残す。
- BtoB SaaS は `decision_maker`、`end_user`、`evaluator`、`technical_reviewer` を分離する。
- 専門サービスは相談判断者、専門性比較、費用/リスク確認、初回相談の役割に分ける。
- クリニック系は地域比較者、初回相談者、家族/紹介者を慎重な仮説として扱い、`regulated_risk_topic` を追加する。
- 地域サービスは近隣比較、予約/申込判断、初回利用、継続/再利用を分ける。
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
- candidate/recommendation/comparative-set の prompt だけが market metrics 対象になること
- competitor / citation angle / page improvement angle を生成しないこと
- regulated case で危険な診断・保証・結果断定の wording を避けること

現時点の deterministic eval は、4つの有効 fixture で最低スコアを超え、入力不足 fixture は blocker と空 draft を返す。

## スキル基準への近さ

近づいた点:

- Persona は shallow label ではなく、業種別の decision role と prompt handoff 可能な仮説に近づいた。
- Topic-first で metric target / expected signal / brand mention policy を保てている。
- Branded sentiment と non-branded visibility/ranking の分離は維持できている。
- Regulated / high-trust では、診断・治療・成果保証ではなく、資格・費用・リスク・相談前確認へ変換できる。

まだスキル同等ではない点:

- 1 topic につき prompt は最小1件なので、標準診断の prompt set 密度には届かない。
- persona は site/customer evidence ではなく最小入力からの仮説で、validated customer segment ではない。
- 実競合、実引用URL、source-to-claim、ページ改善候補は生成しない。
- raw search-like / anxious wording は一部に入ったが、業界ごとの語彙はまだ固定ルール中心。
- citation / competitor / schema skill への本格 handoff payload は未実装。

## 次のPR候補

- topic ごとの prompt variant を2-3件に増やし、buyer stage と language mode の coverage を広げる。
- seed に `knownCompetitors` がある場合だけ competitor comparison prompt を安全に分離する。
- site text / customer evidence を受け取れるようになった後、persona confidence と sourceStatus を段階的に上げる。
- `recora-ai-citation-analysis` 向けの source observation placeholder を、生成ではなく handoff plan として設計する。
