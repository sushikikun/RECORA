# Research Protocol

Project: Recora Evidence-Based Recommendation Program
Status: v0.1 foundation

## 1. Objective

SEO、GEO、AIO、AI-searchに関する情報を、Recoraの改善提案へ安全に変換できる形で収集・評価・統合する。

調査の単位は「記事」ではなく「検証可能なclaim」である。収集件数を成果指標にせず、Recoraの研究質問に対する証拠充足度、矛盾管理、適用範囲、再現可能性を成果とする。

## 2. Research Model

このプロジェクトは一度限りの文献レビューではなく、`living evidence synthesis` として運用する。

```text
Research question
→ source discovery
→ source screening
→ claim extraction
→ source/claim evaluation
→ conflict mapping
→ Evidence Ledger
→ operational rule candidate
→ Recommendation Card
→ Gold Set evaluation
→ accepted skill rule
→ freshness review / invalidation
```

## 3. Research Questions

調査は以下の研究質問から逆算する。新しいsourceを見つけても、どの質問へ寄与するか不明な場合はResearch Corpusには保存できるが、運用ルールへは採用しない。

### RQ-A: Discovery, Crawl, and Eligibility

- 各プラットフォームは公開Webコンテンツをどのように発見・取得・利用対象化するか。
- robots.txt、robots meta、X-Robots-Tag、canonical、status code、sitemap、internal link、JS renderingは何に影響するか。
- search index eligibilityとAI answer inclusionはどこまで同じで、どこから異なるか。
- bot accessの許可・拒否から何を推論でき、何を推論できないか。

### RQ-B: Retrieval and Query Expansion

- original prompt以外の関連query、fan-out、grounding queryはretrievalへどう関係するか。
- persona、buyer stage、locale、language、freshness、search intentはretrieval結果へどう影響するか。
- topical coverage、entity/category alignment、passage relevanceをどのように観測できるか。

### RQ-C: Citation Selection

- retrieved candidateのうち、どのようなsource/page/passageがcitationとして選択されるか。
- citation frequency、citation diversity、citation placement、source typeをどう分離するか。
- first-party、neutral third-party、competitor-owned、directory、review、forum、researchをどう分類するか。
- citation countからranking、authority、answer contributionを推論できるか。

### RQ-D: Answer Absorption and Claim Support

- cited pageの情報が回答本文へ実際に反映されたかをどう測るか。
- answer claimとsource textのsupport、partial support、contradiction、unverifiableをどう判定するか。
- citationが存在してもclaimを裏付けていないケースをどう扱うか。
- brand differentiator、limitations、pricing、audience、featuresが回答へ吸収されたかをどう評価するか。

### RQ-E: Brand and Entity Understanding

- brand、company、product、service、category、audience、region、competitor relationshipが正しく理解されているか。
- entity ambiguity、outdated fact、hallucinated fact、generic descriptionをどう分類するか。
- branded promptとnon-branded promptをどのmetricsへ使うべきか。

### RQ-F: Content and Evidence Quality

- unique first-party information、methodology、data、case study、comparison、pricing、limitations、author/date/sourceは何を支援するか。
- content clarity、heading、table、FAQ、summary、definition block等の効果をどこまで示せるか。
- people-first valueとAI-specific formattingをどう区別するか。
- thin content、scaled low-value content、inauthentic mention等のriskをどう扱うか。

### RQ-G: Structured Data and Machine-readable Support

- schema.org vocabularyと各検索プラットフォームの利用要件をどう区別するか。
- JSON-LD、Organization、SoftwareApplication、Product、Service、Article、FAQPage、BreadcrumbList等はどのページで適切か。
- visible contentとの不一致、unsupported review/rating、over-markupをどう防ぐか。
- structured dataからAI citationやrankingを推論できるか。

### RQ-H: Third-party Source Ecosystem

- neutral source footprint、media、partner、industry directory、review、research、forumはどの観測項目に関係するか。
- legitimate outreachとspam/manipulationをどう分離するか。
- owned-site fixでは解決できないsource gapをどう判定するか。

### RQ-I: Measurement Reliability

- 同じpromptのrun-to-run variationをどう扱うか。
- provider、model/surface、locale、login state、date、prompt version、temperature-like variationをどこまで記録するか。
- sample size、repeat count、paraphrase set、time-windowをどう設計するか。
- visibility、mention、citation、ranking、sentiment、answer accuracyのdenominatorをどう定義するか。

### RQ-J: Recommendation Effectiveness

- 観測から原因を決め打ちせず、どのdiagnosis hypothesesを保持するべきか。
- recommendationのimpact、evidence strength、effort、risk、reversibilityをどう優先順位化するか。
- 実装前baseline、実装内容、再測定、success/failure criteriaをどう定義するか。
- 一般的best practiceとRecora固有の測定根拠をどう区別するか。

## 4. Platform Scope

sourceとclaimには必ず適用範囲を付ける。

Allowed platform scope examples:

- `google_search`
- `google_ai_overviews`
- `google_ai_mode`
- `chatgpt_search`
- `openai_oai_searchbot`
- `bing_search`
- `microsoft_copilot`
- `bing_ai_performance`
- `perplexity`
- `schema_org`
- `general_web_search`
- `general_rag_research`
- `unknown`

Rules:

- Google公式ガイドをChatGPT Searchの仕様として扱わない。
- OpenAI crawler controlをGoogleのindexing ruleとして扱わない。
- 一般RAG研究を特定商用サービスのproduction behaviorとして断定しない。
- platform surfaceが不明な観測は`unknown`にし、推定で埋めない。

## 5. Locale and Temporal Scope

各claimは可能な限り以下を保持する。

- country / region
- language
- device or interface context
- publication date
- last updated date
- observation period
- retrieval date
- version or product surface

古いsourceは自動的に無効ではないが、現在仕様を説明する用途では再確認が必要。特にcrawler、AI search UI、measurement dashboard、structured-data eligibilityは変更されやすいものとして扱う。

## 6. Source Discovery Order

同じ研究質問では、原則として次の順に探索する。

1. 現行の公式product/documentation/policy
2. primary standards or vocabulary documentation
3. peer-reviewed primary research
4. relevant preprints with inspectable methods
5. reproducible experiments, datasets, benchmark code
6. method-rich independent studies and case studies
7. vendor/agency articles
8. competitor product documentation and outputs
9. public/local skills, prompts, templates
10. social posts, summaries, reposts

下位sourceは上位sourceが存在しない場合の仮説生成やpattern discoveryに使えるが、単独で強いcausal ruleにしない。

## 7. Search Strategy

### 7.1 Query Families

研究質問ごとに以下のquery familiesを用意する。

- exact platform terminology
- official-domain constrained queries
- academic terminology
- synonym and historical terminology
- metric terminology
- failure-mode terminology
- criticism / replication / contradiction terminology
- Japanese and English variants

Example:

```text
site:developers.google.com/search AI features website optimization
site:help.openai.com OAI-SearchBot publisher search
site:blogs.bing.com/webmaster AI Performance citations
"generative engine optimization" citation experiment
"AI search" citation faithfulness source support
"query fan-out" search retrieval
GEO 再現実験 引用 AI検索
```

### 7.2 Search Log

各research sessionで次を記録する。

- search_session_id
- research_question_ids
- query
- engine/database
- executed_at
- filters
- result count if available
- selected source IDs
- exclusion reasons
- reviewer

同じqueryを繰り返しても、実行日やindex変化を追跡できるようにする。

## 8. Inclusion Criteria

sourceをclaim extraction対象に含める条件:

- Recoraの研究質問へ直接または補助的に関係する。
- source identityと取得位置が確認できる。
- publication/update date、または少なくとも取得日を記録できる。
- claimの本文または公式説明を確認できる。
- 適用platform、method、data、scopeのいずれかを評価できる。
- commercial sourceの場合、主張とmarketing languageを分離できる。

## 9. Exclusion Criteria

次は運用ルールの根拠から除外する。Research Corpusへの参考保存は可。

- source本文を確認できず、他者の要約しかない。
- citation chainが循環している。
- 日付、対象platform、methodが特定不能で、重要主張を支えられない。
- fabricated citationまたは存在しないsourceの疑いがある。
- SEO効果、AI引用、ranking upliftを保証しているが検証方法がない。
- README、skill description、marketing landing pageだけを実証結果として使っている。
- sample size、prompt set、control、measurement definitionを隠した数値claim。
- link buying、fake reviews、fabricated mentions、spam、cloaking等を推奨する。
- 重要な利益相反を開示せず、自社製品だけを証拠としている。

## 10. Screening Process

### Pass 1: Relevance Screen

- どのRQへ関係するか。
- 公式仕様、empirical evidence、case study、opinion、patternのどれか。
- 重複sourceか。

### Pass 2: Method and Scope Screen

- 対象platform/surfaceは何か。
- methodを再説明できるか。
- sample、time range、prompt/query set、controlは何か。
- claimがsourceの結果を超えていないか。

### Pass 3: Claim Extraction Eligibility

- 原子的claimへ分割できるか。
- supports / contradicts / contextualizesを分類できるか。
- limitationとdo-not-inferを記録できるか。

最低1人のreviewerがscreeningし、高影響またはconflicting claimは再確認する。将来の運用ではsecond-reviewerまたはadversarial reviewを追加する。

## 11. Claim Extraction Rules

### 11.1 Atomicity

一つのclaimには一つの検証可能な命題だけを書く。

Bad:

```text
明確な見出し、FAQ、schema、llms.txtを追加するとAIに引用されやすくなり順位も上がる。
```

Good:

```text
MicrosoftのAI Performance公式説明は、明確な見出し、表、FAQが情報を参照しやすくする可能性があると案内している。
```

別claim:

```text
Googleの生成AI検索公式ガイドは、Google Searchでの表示にllms.txtは不要で、Google Searchはこれを利用しないとしている。
```

### 11.2 Separate Source Statement from Recora Inference

- `source_claim`: sourceが直接述べる内容
- `recora_inference`: Recoraがそこから条件付きで導く運用仮説
- `do_not_infer`: 導いてはいけない結論

### 11.3 Separate Correlation from Causation

観測研究やcase studyからは、原則としてassociationまたはhypothesisとして記録する。causal claimにはcontrol、intervention、alternative explanationへの対応が必要。

### 11.4 Preserve Negative and Null Findings

効果が見られなかった結果、再現できなかった結果、限定条件、プラットフォーム差を削除しない。

## 12. Evidence Relationship Types

Evidence Ledgerではsource-claim関係を次のいずれかにする。

- `supports`
- `partially_supports`
- `contradicts`
- `contextualizes`
- `defines`
- `does_not_test`
- `supersedes`

`does_not_test` は、よく引用されるが実際には対象効果を検証していないsourceを明示するために使う。

## 13. Conflict Handling

矛盾は平均化して消さない。

1. 同じclaimか、適用範囲が異なるclaimかを確認する。
2. platform、date、locale、method、sample、metric definitionを比較する。
3. official normative statementとempirical outcomeを分離する。
4. conflict groupを作り、各evidence linkを保持する。
5. resolveできない場合はclaim statusを`disputed`または`conditional`にする。
6. Recommendation Cardでは条件分岐または`NEEDS_VERIFICATION`にする。

## 14. Source Freshness and Invalidation

source/claimは以下で再確認または無効化候補になる。

- 公式documentが更新された。
- product surface、crawler、measurement dashboard、policyが変更された。
- source URLが消失または内容変更された。
- 後続研究が主要結果を反証した。
- method flaw、data leakage、seed contaminationが判明した。
- Recoraのmetric definitionが変わった。
- recommendation cardがGold Setや実測で繰り返し失敗した。

Ledgerでは削除より`superseded`、`stale`、`rejected`を優先し、履歴を残す。

## 15. Research Waves

### Wave 1: Official Baseline

対象:

- Google Search Central
- OpenAI publisher/developer/search crawler guidance
- Bing Webmaster / Microsoft AI search guidance
- schema.org and relevant standards
- official webmaster controls and analytics

Output:

- platform-boundary matrix
- official do/do-not rules
- metrics and controls inventory
- unknowns list

### Wave 2: Academic and Reproducible Research

対象:

- GEO intervention studies
- RAG retrieval/citation research
- citation correctness / faithfulness
- generative search reproducibility
- source selection and answer grounding
- evaluation methodologies

Output:

- research claim ledger
- method-quality notes
- replication/contradiction map
- candidate measurement methods

### Wave 3: Industry and Case Studies

対象:

- method-rich SEO/GEO experiments
- agencies and vendors
- publisher case studies
- independent audits

Output:

- conditional hypotheses
- missing methodological details
- platform-specific practical observations
- experiment backlog

### Wave 4: Competitors and Skills

対象:

- competitor report item taxonomy
- UI/output patterns
- public/local skill workflows
- prompts, checklists, handoff contracts

Output:

- pattern library
- gaps in Recora workflow
- unsafe patterns to reject
- no direct effectiveness claims without external evidence

## 16. Saturation and Stop Rules

「大量」の目標件数は置かない。研究質問単位で次を満たしたら、そのwaveを一旦停止できる。

- authoritative baselineが確認できた。
- major supporting and conflicting viewsを把握した。
- operational rule候補の適用範囲と限界を書ける。
- additional sourcesが新しいclaimをほぼ増やさない。
- Recommendation Cardに必要なtrigger、checks、actions、verificationを作れる。

ただしplatform changesが多い領域はliving reviewとして継続する。

## 17. Translation into Recommendation Cards

sourceから直接cardを作らない。最低限次を満たす。

- claim statusが`accepted`または`conditional`
- platform scopeが明確
- triggerとexclusionが書ける
- required checksがある
- implementation actionが具体的
- expected mechanismが因果断定になっていない
- verification methodとfailure criteriaがある
- do-not-claimがある

## 18. Gold Set Validation

Recommendation CardとEngine contractは、次のようなケースで評価する。

- brandが表示されない
- mentionはあるがcitationがない
- citationはあるがanswer claimを支えていない
- competitorだけが推奨される
- sourceは第三者のみ
- pageがnoindex / canonical conflict / blocked
- schema/body mismatch
- branded sentimentがnegativeまたはgeneric
- prompt sampleが少なすぎる
- run-to-run variationが大きい
- vendor articleしか根拠がない
- official sourcesがplatformごとに異なる

評価軸:

- observation fidelity
- evidence traceability
- hypothesis quality
- alternative-cause handling
- action specificity
- implementation feasibility
- verification quality
- platform correctness
- safety and non-overclaiming
- duplicate/generic recommendation rate

## 19. Required Research Outputs

各waveは最低限次を残す。

- source register
- search log
- atomic claims
- evidence links
- conflict groups
- accepted / conditional / disputed / rejected decisions
- unknowns and experiment backlog
- candidate Recommendation Cards
- changes required to project contracts

## 20. Safety and Integrity Rules

- secret、credential、login sessionを要求しない。
- paywall、login、blocked sourceを読んだことにしない。
- source URLだけから本文を推測しない。
- AI生成の架空citationをLedgerへ入れない。
- competitor claimを未検証のまま顧客向けに出さない。
- research quantityをevidence qualityの代替にしない。
- public skillやREADMEを実証証拠に昇格させない。
- manipulation、spam、fabricated review/mentionをRecommendation Cardにしない。
