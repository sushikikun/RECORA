# Recora Evidence-Based Recommendation Program

Status: Phase 0 — foundation
Canonical start date: 2026-06-22

## North Star

Recoraで観測したSEO・GEO・AI検索のシグナルを、根拠に接続され、実装可能で、再測定可能な改善提案へ変換する。

このプロジェクトの成果は、記事や論文を大量に保存することではない。最終成果は次の連鎖を安定して実行できること。

```text
Observed signal
→ evidence classification
→ multiple diagnosis hypotheses
→ required checks
→ recommendation card selection
→ implementation target
→ verification plan
→ quality gate
→ client-facing recommendation
```

## Project Purpose

1. SEO / GEO / AIO / AI-searchに関する公式文書、研究、実験、ケーススタディ、競合サービス、公開スキルを体系的に調査する。
2. 情報を記事単位ではなく、検証可能な主張単位でEvidence Ledgerへ登録する。
3. Recoraのレポート項目に適用できる知識だけをRecommendation Cardへ変換する。
4. Recoraの実測結果から、原因を決め打ちせず改善候補を生成する標準契約を作る。
5. `recora-recommendation-quality-gate-auditor` を通過した候補だけを顧客向けに表示できる構造にする。

## Non-goals

このプロジェクトは以下を目的にしない。

- SEO/GEO記事の巨大な要約集を作ること。
- 一つの万能スキルへ全責務を集約すること。
- 単発のAI回答観測から原因や効果を断定すること。
- schema、robots、sitemap、llms.txt、bot accessをAI引用保証として扱うこと。
- ベンダー記事、README、公開スキルを効果の証拠として扱うこと。
- AI表示、引用、推奨順位、トラフィック、売上を保証すること。
- 調査段階でアプリ、DB、production、secretを変更すること。

## Operating Principle

採用方式は次のハイブリッド方式とする。

```text
Recora-backward
× Research-driven
× Experiment-validated
```

大量リサーチを先に無制限で行わない。先にRecoraの暫定出力契約と研究質問を置き、その判断に必要な証拠を収集する。調査結果はRecoraの実データとGold Setで検証し、検証済みルールだけをスキルへ蒸留する。

## Five-layer Architecture

### Layer 1: Research Corpus

公式資料、論文、実験、ケーススタディ、競合サービス、公開スキルの原資料とメタデータを保持する。

- 原資料は知識候補であり、そのままRecoraのルールにはしない。
- プラットフォーム、発行日、更新日、調査方法、適用範囲を保持する。
- 取得できない本文や未確認の主張を補完しない。

### Layer 2: Evidence Ledger

原資料から原子的な主張を抽出し、支持・反証・制約・鮮度・適用範囲を管理する。

- 一つのclaimには一つの検証可能な命題を置く。
- source tierとclaim confidenceを分離する。
- Google固有、OpenAI固有、Microsoft固有、一般SEO、研究環境を混同しない。
- 矛盾する証拠を削除せず、conflict groupとして残す。

### Layer 3: Recommendation Card Library

Evidence Ledgerで採用または条件付き採用された知識を、Recoraで利用できる条件付きの改善カードへ変換する。

各カードは最低限、次を持つ。

- trigger
- exclusions
- required checks
- possible causes
- action variants
- implementation targets
- expected mechanism
- evidence requirements
- verification method
- failure criteria
- do-not-claim

### Layer 4: `recora-report-recommendation-engine`

将来新設するRecommendation Engineは、戦略を独占する万能スキルではない。観測、専門スキル出力、Evidence Ledger、Recommendation Cardを標準化されたrecommendation candidateへ組み立てるcompiler / orchestration layerとする。

責務:

- レポート項目と観測証拠を正規化する。
- 原因仮説を複数保持する。
- 不足チェックを明示する。
- 適用可能なRecommendation Cardを選ぶ。
- 実装対象、優先度、検証方法、禁止表現を揃える。
- publication decisionは行わない。

### Layer 5: Quality Gate

`recora-recommendation-quality-gate-auditor` が唯一のpublication authorityである。

- `auto_publish`
- `hold`
- `suppress`

Recommendation Engine、親戦略スキル、専門スキルはこの判断を行わない。

## Skill Ownership

既存のRECORA Skill Stack Contractを維持し、次の境界で運用する。

| Owner | Responsibility |
|---|---|
| `georader-ai-search-auditor` | 親戦略、診断方針、evidence interpretation、roadmap-level priority、recommendation intent |
| `recora-persona-discovery` | persona / ICP / decision role |
| `recora-prompt-topic-designer` | topic-first prompt design、metric eligibility、branded/non-branded separation |
| `recora-ai-citation-analysis` | citation、source text、source-to-claim、Source Intelligence |
| `recora-competitor-benchmark` | competitor normalization、SOV、rank、threat、benchmark |
| `recora-schema-seo-aio` | technical SEO、page structure、schema、extractability、owned-page/source-gap action |
| `recora-report-recommendation-engine` | specialist outputとevidenceをcandidate contractへ標準化・組み立て |
| `recora-recommendation-quality-gate-auditor` | publication decision、quality score、safe rewrite、blocking reason |
| `recora-geo-implementation-architect` | data model、pipeline、storage、tests、observability、rollout |

境界上の重要な決定:

- `georader-ai-search-auditor` はrecommendationの戦略的意図を所有する。
- Recommendation Engineはその意図と専門スキルの出力を標準candidateへcompileする。
- Recommendation Engineは不足証拠を発明せず、独自にpublication approvalを付けない。
- この境界を実装する段階で共有stack contractを更新する。

## Research Domains

調査は以下の領域へ分解する。

1. Discovery / crawl / eligibility
2. Retrieval and query fan-out
3. Citation selection
4. Answer absorption and claim support
5. Brand / entity understanding
6. Content quality and first-party evidence
7. Third-party source ecosystem
8. Structured data and machine-readable support
9. Measurement reliability and repeatability
10. Recommendation prioritization and validation

## Recora Report Item Families

最終的なRecommendation Cardは少なくとも以下を扱う。

- AI visibility
- recommendation rank / prominence
- citations
- Source Intelligence
- answer accuracy
- persona and buyer-stage gaps
- branded sentiment / brand perception
- technical SEO and crawlability
- structured data
- page brief / new page opportunity
- entity clarity
- evidence and trust gaps
- measurement quality

## Measurement Boundaries

- visibility、ranking、Share of Voice、competitor gapはnon-branded promptsのみを基本対象とする。
- branded promptsはsentiment、brand perception、answer accuracy、entity understanding用に分離する。
- citation countをranking、authority、answer contributionと同一視しない。
- page eligibility、retrieval、citation selection、answer absorptionを別段階として扱う。
- 同じpromptの単発実行を安定した傾向として扱わない。
- provider、locale、date、prompt version、run count、source availabilityを保持する。

## Project Phases

### Phase 0 — Foundation

- project charter
- research protocol
- source evaluation rubric
- evidence ledger schema
- recommendation output contract

Exit condition: 調査対象、責務、証拠基準、出力契約が固定されている。

### Phase 1 — Primary-source Baseline

- Google Search公式資料
- OpenAI Search / crawler公式資料
- Microsoft/Bing公式資料
- schema.org / W3C関連資料
- provider-specific control and measurement documentation

Exit condition: プラットフォーム固有の公式ルールと「不明」が分離されている。

### Phase 2 — Research and Reproducible Evidence

- peer-reviewed research
- relevant preprints
- benchmark / dataset
- reproducible experiments
- citation faithfulness and answer-grounding research

Exit condition: 主要研究質問ごとに支持、制約、反証がLedgerへ登録されている。

### Phase 3 — Industry, Competitor, and Skill Research

- method-rich SEO/GEO studies
- competitor product outputs and taxonomies
- public/local skill patterns
- vendor claims and case studies

Exit condition: 証拠とpattern inspirationが混同されずに整理されている。

### Phase 4 — Recommendation Card Synthesis

- trigger and exclusion rules
- diagnosis trees
- action variants
- mechanism classification
- verification and failure criteria

Exit condition: 各主要report itemに利用可能なカードが存在する。

### Phase 5 — Gold Set and Evaluation

- real Recora-like observations
- difficult and adversarial cases
- human-authored gold recommendations
- scoring rubric
- false-positive / false-causality tests

Exit condition: candidate generationが実測整合性、具体性、安全性、検証可能性を満たす。

### Phase 6 — Skill and Pipeline Implementation

- `recora-report-recommendation-engine`
- shared skill contract update
- specialist handoff contract update
- candidate schema and validation
- quality-gate integration

Exit condition: recommendation candidateが一貫したschemaでquality gateへ渡る。

### Phase 7 — Living Evidence Maintenance

- freshness review
- source invalidation
- platform change monitoring
- card versioning
- regression evals

Exit condition: 古いルールが自動的に現行ルールとして残らない。

## Success Criteria

成功は収集件数ではなく、以下で評価する。

1. Traceability: 各提案が観測、claim、sourceへ遡れる。
2. Specificity: 対象ページ、対象箇所、実装内容が明確。
3. Evidence discipline: 事実、研究、業界慣行、Recora仮説が分離される。
4. Diagnostic humility: 原因を決め打ちせず、反証条件を持つ。
5. Actionability: 実装担当が追加解釈なしで着手できる。
6. Verifiability: baseline、再測定、成功指標、失敗条件を持つ。
7. Platform scope: Google/OpenAI/Microsoft等の適用範囲を誤らない。
8. Safety: guarantee、citation misuse、seed contamination、fabricated evidenceを排除する。
9. Non-genericness: 観測と関係のない一般SEO提案を抑制する。
10. Quality-gate compatibility: candidateがそのまま監査可能。

## Canonical Documents

- `README.md`: 目的、全体構造、責務、ロードマップのsingle source of truth
- `research-protocol.md`: 調査の実行ルール
- `source-evaluation-rubric.md`: sourceとclaimの評価ルール
- `evidence-ledger-schema.md`: Evidence Ledgerのデータ契約
- `recora-recommendation-output-contract.md`: recommendation candidateの出力契約

方針変更時は、まずこのREADMEのNorth Star、Architecture、Skill Ownership、Project Phasesとの整合を確認する。

## Non-negotiable Rules

- 生の大量記事を直接スキルへ投入しない。
- source tierだけでclaimを自動採用しない。
- 公式文書の適用範囲を他プラットフォームへ拡張しない。
- correlationをcausationとして書かない。
- missing evidenceを補完しない。
- `NEEDS_VERIFICATION` を失敗ではなく正しい判断として扱う。
- quality gateの独立性を崩さない。
- client-facing recommendationはquality gate通過後のみ。

## Decision Log

### 2026-06-22

- プロジェクト名を `Recora Evidence-Based Recommendation Program` とする。
- 大量リサーチ先行ではなく、仮契約 → 指向性リサーチ → Ledger → Card → Gold Set → skillの順で進める。
- `recora-schema-seo-aio` に全改善ロジックを集中させない。
- `recora-report-recommendation-engine` を将来のcompiler / orchestration layerとして設計する。
- 生のResearch Corpusと、スキルに蒸留する運用ルールを分離する。
- `recora-recommendation-quality-gate-auditor` を唯一のpublication authorityとして維持する。
