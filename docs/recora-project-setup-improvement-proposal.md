# Recora 案件設定改善仕様案

作成日: 2026-06-24

## 目的

Recora の案件設定を、顧客がペルソナ、トピック、プロンプトを直接設計しなくても進められる形にする。

顧客入力は最小限にし、Recora が下書きを生成し、内部運用者が確認・修正・承認してから計測対象に昇格する。Codex skill は runtime 機能として扱わず、スキルに書かれている判断軸、品質基準、データ契約を Recora アプリの仕様へ翻訳する。

## 調査した現状

確認した主な現行ファイル:

- `scripts/prepare-recora-client-project.ts`
- `scripts/run-recora-phase1-operator-flow.ts`
- `scripts/plan-recora-report-cycle.ts`
- `scripts/recalculate-metric-snapshots.ts`
- `lib/recora/phase1-admin-plan.ts`
- `lib/recora/db/admin-operations.ts`
- `lib/recora/measurement-profiles.ts`
- `lib/recora/report-eligibility.ts`
- `components/recora/admin-operations-pages.tsx`
- `components/recora/admin-operation-plan-client.tsx`
- `components/recora/topics-prompts-page.tsx`
- `components/recora/report-pages.tsx`
- `lib/recora/db/topics-prompts.ts`
- `supabase/migrations/0001_recora_v01_schema.sql`
- `supabase/migrations/20260620181714_recora_tenant_foundation.sql`
- `supabase/migrations/0004_recora_measurement_analysis_read_model_fields.sql`
- `supabase/migrations/20260622140243_restrict_public_recommendations_to_customer_visible.sql`
- `docs/recora-phase1-admin-demo-launch.md`
- `docs/recora-phase1-admin-measurement-cycle.md`
- `docs/recora-measurement-analysis-read-model.md`

## 現状の問題点

1. `prepare-recora-client-project.ts` の client config は、competitors / personas / topics / prompts を必須入力にしている。これは内部運用者にも重く、顧客に見せるとさらに難しい。
2. 現在の `personas`、`topics`、`prompts` は計測用の確定データに近く、生成下書き、レビュー待ち、却下、承認済みの状態を表す一次データがない。
3. `prompts` には `intent` と `buyer_stage` はあるが、`prompt_category`、`brand_mention_rule`、`response_shape`、`candidate_mention_opportunity`、`ranking_opportunity`、`metric_eligibility`、`prompt_set_version` がない。
4. AI表示率やランキングから branded prompt を除外する方針はあるが、現行集計は主にブランド名トークン検出で branded prompt を除外している。構造化された prompt taxonomy による除外ではない。
5. 内部コンソールは `/internal`、`/internal/projects`、`/internal/operations` で read model と実行計画を確認できるが、案件設定の生成下書きレビュー画面はまだない。
6. dashboard の設定画面は persona/topic/prompt/competitor をDBから確認できるが、編集は次フェーズ扱いで、生成・承認ワークフローはない。
7. recommendation は `publication_state` や `quality_gate_decision` を metadata で扱い、顧客表示 gate がある。一方、案件設定の persona/topic/prompt には同等の gate がない。
8. prompt taxonomy version、seed risk、prompt echo risk、生成根拠、内部レビュー履歴が第一級に永続化されていない。
9. 既存の Phase 1 runbook は「内部運用者が prompt taxonomy を確認する」前提だが、その確認対象を作るUIとデータ構造が未整備。

## 改良後の案件設定フロー

1. 顧客または内部運用者が最小項目を入力する。
2. Recora が入力情報、公式サイト、既知のブランド情報、必要に応じた公開ページ抽出からセットアップ下書きを生成する。
3. 下書きは `draft` / `needs_review` として内部だけに保存する。ここでは計測しない。
4. 内部運用者が persona、topic、prompt、competitor、citation/source 観点、page improvement 観点を確認・修正する。
5. 内部運用者が prompt taxonomy、metric eligibility、branded / non-branded 分離、競合候補の tier、seed risk を承認する。
6. 承認済みの persona/topic/prompt/brand だけを現在の計測用テーブルへ materialize する。
7. prompt set version を freeze し、Phase 1 operator の計測計画に渡す。
8. 計測、集計、recommendation candidate 生成、quality gate、report-ready gate は既存 Phase 1 フローに接続する。

## 顧客入力項目

必須は最小限にする。

- 会社名または組織名
- ブランド名またはサービス名
- 公式サイトURL
- 商品・サービスの一文説明
- 業種またはカテゴリ
- 主な対象顧客の短い説明
- 対象地域と言語

任意入力:

- 既知の競合名、競合URL
- 顧客が避けたい比較対象
- 主要な売り・強み
- 不安な点、誤解されやすい点
- 重点的に見たい市場、地域、顧客層
- 計測目的: AI表示率、競合比較、引用元確認、ブランド認識、ページ改善など

顧客には入力させない項目:

- persona の詳細設計
- topic taxonomy
- prompt 文面
- metric eligibility
- prompt quality score
- source-to-claim や citation audit の判定
- recommendation quality gate

## Recora 自動生成項目

Recora は以下を下書きとして生成する。

- 入力補完表: provided / inferred / missing / needs_confirmation
- persona candidates: 3から7件、role、buyer stage、prompt readiness、confidence、needs verification 付き
- topic set: topic first、metric target、expected signal、minimum prompt count 付き
- prompt candidates: topic_id、persona_id、category、brand mention rule、response shape、metric eligibility 付き
- branded sentiment prompts: ブランド認識、評判、懸念、価格感など
- non-branded discovery prompts: AI表示率、ranking、Share of Voice、competitor gap 用
- citation_check prompts: source / citation / evidence を観測するための質問
- competitor candidates: supplied / inferred / unknown discovery / substitute を区別
- source gap 観点: own site、competitor site、third party、review、directory、media など
- page improvement 観点: FAQ、比較、価格、事例、用語集、調査レポート、構造化データ候補
- risk flags: seed contamination、overclaim、regulated/high-trust、unsupported competitor、missing source text など

## 内部レビュー項目

内部運用者は以下を確認する。

- 顧客入力の不足と assumptions
- 公式サイトURL、ブランド名、aliases、domain の正規化
- persona が顧客セグメントとして断定されていないか
- persona の role_type と detailed_decision_role が分離されているか
- topic が prompt より先に設計されているか
- prompt が topic に紐づいているか
- prompt が leading / too branded / too generic になっていないか
- non-branded prompt が candidate mention opportunity または ranking opportunity を持つか
- branded prompt が visibility/ranking に混ざっていないか
- citation_check prompt が citation occurrence を ranking evidence と誤認させないか
- 競合候補が Direct / Adjacent / Aspirational / Substitute に分かれているか
- 未計測の競合visibilityやShare of Voiceを断定していないか
- ページ改善観点が「AI citationを保証する」表現になっていないか
- 計測前に prompt_set_version、profile、search_mode、expected run items が確定しているか

## ペルソナ生成仕様

persona は顧客セグメントの確定値ではなく、計測設計のための仮説として扱う。

生成項目:

- `persona_key`
- `display_name`
- `segment`
- `business_type`
- `industry_category`
- `industry_subtype`
- `role_type`
- `detailed_decision_role`
- `role_mapping_reason`
- `buyer_stage`
- `jobs`
- `pain_points`
- `trigger_events`
- `switching_forces`
- `alternatives_considered`
- `comparison_axis`
- `proof_needed`
- `trust_requirement`
- `prompt_angle`
- `prompt_readiness`: `ready_for_prompt_design` / `usable_with_caution` / `needs_more_evidence` / `do_not_handoff`
- `research_sufficiency`: `site_only_hypothesis` など
- `confidence`
- `needs_verification`
- `risk_flags`
- `source_status`: provided / inferred / missing / needs_confirmation

通常の prompt 生成へ渡せるのは `ready_for_prompt_design` または `usable_with_caution` のみ。`needs_more_evidence` と `do_not_handoff` は内部レビューまたは保留にする。

## トピック生成仕様

topic は prompt より先に生成する。

生成項目:

- `topic_id`
- `topic_name`
- `topic_type`
- `diagnosis_goal`
- `target_persona`
- `buyer_stage`
- `metric_target`
- `brand_mention_policy`
- `expected_signal`
- `minimum_prompt_count`
- `risk_or_bias`
- `handoff_skill`
- `topic_quality_decision`
- `coverage_status`

topic type は以下を基本にする。

- `market_discovery_topic`
- `problem_solution_topic`
- `category_discovery_topic`
- `competitor_comparison_topic`
- `alternative_search_topic`
- `pricing_reputation_topic`
- `citation_evidence_topic`
- `branded_sentiment_topic`
- `persona_specific_topic`
- `local_regional_topic`
- `regulated_risk_topic`

## プロンプト生成仕様

prompt は必ず topic に紐づける。可能なら persona にも紐づける。計測実行時の `run_items.persona_id` は必須なので、persona なし prompt を許す場合は fallback persona の扱いを設計する。

生成項目:

- `prompt_id`
- `topic_id`
- `persona_id`
- `text`
- `raw_user_intent`
- `language_mode`
- `category`
- `intent_type`
- `buyer_stage`
- `brand_mention_rule`
- `competitor_mention_rule`
- `response_shape`
- `candidate_mention_opportunity`
- `ranking_opportunity`
- `metric_eligibility`
- `expected_signal`
- `quality_score`
- `gate_decision`
- `gate_reason`
- `source_status`
- `seed_terms`
- `seed_contamination_risk`
- `needs_verification`

quality gate:

- `ready_for_measurement`: 75点以上目安
- `revise_before_measurement`: 60から74点目安
- `internal_only`: 40から59点目安
- `reject`: 39点以下、または安全上不可

## branded / non-branded の分離ルール

non-branded prompt:

- primary brand 名、読み、aliases、domain を含めない
- `brand_mention_rule = brand_excluded`
- category discovery、alternative search、competitor comparison、problem_solution を中心にする
- AI表示率、ranking、Share of Voice、average position、competitor gap の母数にできる
- ただし `candidate_mention_opportunity` が `direct` または `likely` でない prompt は visibility から除外する
- `ranking_opportunity` が `direct` または `comparable_set` でない prompt は ranking から除外する

branded prompt:

- primary brand 名、aliases、domain を含む、またはブランド評判・認識・懸念を尋ねる
- `brand_mention_rule = brand_included`
- sentiment、brand perception、misinformation、entity clarity の確認用
- AI表示率、ranking、Share of Voice、average position、competitor gap には使わない

citation_check prompt:

- citation/source evidence を観測するための prompt
- citation occurrence は ranking evidence ではない
- source-to-claim は `not_reviewed` / `unknown` / `supported` などを分ける

brand_optional prompt:

- 原則として non-branded 版と branded 版に分割する
- 1つの prompt に両方の metric 用途を持たせない

## 競合候補生成仕様

競合は「確定競合」ではなく候補として生成し、内部運用者が分類する。

生成項目:

- `raw_name`
- `normalized_name`
- `brand_aliases`
- `company_name`
- `product_name`
- `domain`
- `source`: provided / site_inferred / category_inferred / measured_ai_answer / citation_source / substitute_pattern
- `tier`: Direct / Adjacent / Aspirational / Substitute
- `market_region`
- `entity_confidence`
- `classification_confidence`
- `low_confidence_reasons`
- `evidence`
- `risk_flags`
- `review_state`

ルール:

- 顧客が名前を出した競合は `provided` とする
- AI回答や引用元で初めて出た競合は `measured_ai_answer` として計測後に追加候補にする
- SEO会社、代理店、社内運用、スプレッドシート、Notion、BI、既存ワークフローなどは Substitute として扱える
- 海外SaaSは国内購買代替の根拠がない限り Aspirational または Adjacent
- Share of Voice、recommendation rank、threat level は測定前に断定しない

## 引用元観点とページ改善観点の接続

案件設定時点では、実際の citation correctness は測定前なので判定しない。生成するのは「観測するべき citation/source 観点」と「後で source gap になり得る page 観点」までにする。

生成する source 観点:

- own site が引用されるべき候補ページ
- competitor site が引用される可能性のある領域
- third-party media / comparison / review / directory の有無
- source text が必要な claim
- freshness が問題になりやすい claim
- source-to-claim review が必要な claim

生成する page improvement 観点:

- FAQ / direct answer
- comparison page
- pricing clarity
- case study / proof
- glossary
- methodology / report page
- internal links
- body-aligned JSON-LD
- third-party profile correction
- earned evidence / partner proof

これらは改善候補ではなく、内部レビュー用の仮説として保存する。実測後、citation analysis と schema SEO/AIO 観点を経て recommendation candidate になり、quality gate を通って初めて顧客表示できる。

## 必要な画面

顧客または営業入力:

- 最小入力フォーム
- 入力不足の確認画面
- 個人情報や秘密情報を入れない注意表示

内部コンソール:

- 案件設定一覧: draft / needs_review / approved / ready_for_measurement
- 案件基本情報レビュー
- 入力補完表レビュー
- persona draft レビュー
- topic draft レビュー
- prompt draft レビュー
- branded / non-branded / citation_check 分離レビュー
- competitor candidate レビュー
- citation/source 観点レビュー
- page improvement 観点レビュー
- prompt set freeze 画面
- Phase 1 operator への接続画面

既存 `/internal/projects` と `/internal/operations` は、計測後・実行計画の画面として残す。新しい案件設定レビューは `/internal/projects/<projectSlug>/setup` または `/internal/setup/<setupId>` として分けるのが自然。

## 必要なデータ項目

既存テーブルを即変更しない場合の暫定案:

- operator JSON に `setupDraft` を持たせる
- `promptInventory` と `promptSetVersion` を `plan-recora-report-cycle.ts` に渡す
- 承認済みだけを既存 `brands`、`personas`、`topics`、`prompts` に入れる

恒久案:

- `project_setup_intakes`
  - minimal input、customer-provided facts、source_status、created_by
- `project_setup_generation_runs`
  - generator version、prompt/template version、status、started_at、completed_at、input hash
- `project_setup_draft_items`
  - item_type: persona / topic / prompt / competitor / source_opportunity / page_opportunity
  - payload jsonb
  - review_state: draft / needs_review / approved / rejected / superseded
  - evidence_labels
  - confidence
  - risk_flags
  - reviewer_comment
- `prompt_set_versions`
  - project_id、version、status、frozen_at、approved_by、source_generation_run_id
- `prompt_taxonomy_annotations`
  - prompt_id または draft_prompt_id
  - category、brand_mention_rule、competitor_mention_rule、response_shape
  - candidate_mention_opportunity、ranking_opportunity
  - metric_eligibility、language_mode、raw_user_intent
  - quality_score、gate_decision、seed_contamination_risk
- `competitor_candidates`
  - normalized entity、tier、source、confidence、review_state
- `setup_review_events`
  - append-only review history

将来の候補:

- evidence ledger
- quality gate review history
- rejection records
- remeasurement task

## 既存DB / read model への影響

短期では既存 `brands`、`personas`、`topics`、`prompts` を確定済み計測設定として使う。下書きは別データ構造に分離する。

追加が必要な理由:

- 下書きと計測対象を混ぜないため
- branded / non-branded の metric eligibility を構造化するため
- prompt set version を report-ready gate と measurement metadata に明示するため
- seed contamination と prompt echo risk を review できるようにするため
- 内部レビュー履歴を残すため

read model 追加候補:

- setup status read model
- prompt taxonomy coverage read model
- internal review queue read model
- measurement readiness read model

既存 `recalculate-metric-snapshots.ts` は、最終的にブランド名トークン検出だけでなく、構造化された prompt eligibility を優先して metric denominator を決めるべき。

## 実装PR分割案

1. 仕様PR
   - この仕様案を追加し、画面・DB・operator の分割方針を合意する。
2. データモデルPR
   - setup intake、generation run、draft item、review event、prompt set version、prompt taxonomy annotation の migration を追加する。RLSと内部read境界も同時に設計する。
3. 生成下書きPR
   - 最小入力から setup draft JSON を生成する internal-only plan script または server action を追加する。DB書き込みと計測は行わない。
4. 内部レビューUI PR
   - `/internal` 配下に setup review 画面を追加し、draft item の approve / reject / edit を扱う。OpenAI計測や外部API実行はしない。
5. materialize PR
   - approved draft だけを既存 `brands`、`personas`、`topics`、`prompts` に反映する operator-only 処理を追加する。dry-run と local-only write guard を必須にする。
6. prompt taxonomy / metric eligibility PR
   - `prompts` または annotation から category と eligibility を読み、集計で non-branded の母数を構造化する。
7. Phase 1 operator 接続PR
   - prompt_set_version、prompt inventory、measurement profile、search mode を setup approval から Phase 1 plan に渡す。
8. competitor / citation / page opportunity PR
   - 競合候補、引用元観点、ページ改善観点を内部レビューに出し、recommendation candidate 生成へ接続する。
9. quality gate history PR
   - recommendation review history を append-only または supersession-safe に永続化する。
10. 顧客向け最小入力PR
   - 顧客が触る画面を出す場合のみ実装する。persona/topic/prompt の詳細入力欄は出さない。

## リスクと未決定事項

- 顧客公式サイトの取得・解析をどこまで自動化するか。クロール、robots、利用規約、更新頻度、失敗時の扱いが未決定。
- 生成下書きに使うモデル、プロンプト、バージョン管理、コスト管理が未決定。
- 生成結果の保存先を metadata で始めるか、最初から専用テーブルにするか未決定。
- 既存 `run_items.persona_id` は必須なので、persona なし prompt の扱いを決める必要がある。
- `measurementProfiles` は固定 prompt IDs を持つため、顧客別 prompt set version との接続方針が必要。
- prompt eligibility を既存 prompt text から後付け分類する移行方針が必要。
- 競合候補の自動生成で実在しない競合や海外aspirationalを direct 扱いするリスクがある。
- brand alias、表記ゆれ、domain、URLのみ一致による seed contamination / prompt echo risk がある。
- 下書きが顧客に表示されると、未検証のpersonaや競合を事実のように受け取られるリスクがある。
- source gap や page improvement を、AI citation保証のように誤解させない文言設計が必要。
- 内部レビュー者の権限、監査ログ、承認者の保存方法が未決定。
- DB migration はUIや計測変更と分ける必要がある。

## 人間が次に判断すること

- 顧客入力を本当に顧客にさせるのか、当面は営業・内部運用者が代行入力するのか。
- 初回実装で専用DBテーブルを作るか、operator JSON + docs + manual review で始めるか。
- 顧客別 prompt set version を既存 measurement profile とどう対応させるか。
- 内部レビューで必須にする承認項目と、任意確認にする項目。
- どのタイミングで `/internal` に setup review 画面を追加するか。
