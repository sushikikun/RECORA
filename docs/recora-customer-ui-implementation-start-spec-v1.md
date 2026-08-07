# Recora顧客画面 実装開始仕様 v1

- Decision source: GitHub Issue #183 / Plan v2
- Contract version: `recora_customer_report_contract_v2`
- Scope: 顧客画面C0（指標・route・query・Evidence・共通fixture）
- Status: 実装済み。runtime接続前のpure TypeScript契約

## 1. 目的

顧客画面01〜10が、同じ意味の指標・route・query・Evidence・fixtureを使って実装を開始できるようにする。C0は画面の見た目や実DB接続を所有せず、後続実装が依存する計算・安全境界を固定する。

## 2. 正本と互換境界

Promptの測定適格性は、最新の9種類の`metric_eligibility`を正本にする。

- `visibility`
- `ranking`
- `sov`
- `sentiment`
- `brand_perception`
- `natural_citation_observation`
- `forced_citation_validation`
- `risk_check`
- `recommendation_input`

`prompt_type`と`measurement_purpose`は互換表示・移行確認用であり、顧客指標の集計可否を決めない。C0は既存runtime/read modelへimportされず、旧metricの意味を上書きしない。

## 3. 顧客向け5指標

| key | 表示名 | 分子 | 分母 | 正式適格性 | 単位 |
|---|---|---|---|---|---|
| `ai_visibility_rate` | AI表示率 | 自社掲載有効回答数 | 対象有効回答数 | `visibility` | answer |
| `ai_share_of_voice` | AI内シェア | 自社ブランド言及数 | 承認済み対象ブランド総言及数 | `sov` | mention |
| `average_first_position` | 平均掲載位置 | 自社掲載回答の初出位置合計 | 自社掲載回答数 | `ranking` | answer |
| `owned_site_reference_rate` | 自社サイト参照率 | 自社承認domain URLを含む有効回答数 | 対象有効回答数 | `natural_citation_observation` | answer |
| `cited_answer_rate` | 引用付き回答率 | 参照URLを含む有効回答数 | 対象有効回答数 | `natural_citation_observation` | answer |

共通規則:

1. Prompt configurationがfinalized、Measurement Designがready、回答がvalid、metric-specific eligibilityがeligibleのときだけ集計する。
2. headlineはCore canonicalだけで作り、`intent_key × model`を1 weightとする。同一組み合わせの二重計上は拒否する。
3. Robustnessは感度確認、Diagnosticは診断用として保持し、headlineへ独立加重しない。
4. provider error、timeout、refusal、empty、invalid payload、cancelledをブランド不在として数えない。
5. branded回答をvisibility・ranking・SOVへ混ぜない。
6. `forced_citation_validation`を自然引用2指標へ混ぜない。
7. 同一回答に自社URLが複数あっても、自社サイト参照率の分子は1回答とする。
8. 分母0は`not_available`とし、0%へ変換しない。
9. rateとaverageは小数第1位へ丸める。

## 4. 感情とEvidence単位

感情構成はbranded valid answerだけを分母とし、`positive / neutral / negative / unclassified`を分離する。`unclassified`をneutralへ合算しない。

次のEvidence単位は別の数として保持し、横断合計しない。

- answer
- question
- citation occurrence
- normalized source URL page
- registrable domain
- source-to-claim correspondence check

Evidenceはorganization、project、measurement design version、prompt configuration version、publication versionへ束縛する。別project・別publication versionのEvidence混入はfail closedにする。

## 5. routeとquery

既存の10 pathをcanonical orderで維持する。

1. `/dashboard/reports/{id}`
2. `/trends`
3. `/leaderboard`
4. `/persona-topics`
5. `/prompts`
6. `/conversations`
7. `/brand-perception`
8. `/sources`
9. `/recommendations`
10. `/settings`

2〜10はすべて`/dashboard/reports/{id}`配下である。

正式query allowlist:

`metric / range / compare / questionGap / persona / topic / prompt / model / date / answer / expression / sentiment / owner / domain / sourceUrlId / recommendation / evidenceRef / guide_q`

各keyは値のenum・形式・最大長を検証する。未知key、重複key、空値、過長値、不正percent encoding、UUID、内部run/generation/measurement値、email、URLを拒否する。`return`やlegacy ID queryは追加しない。same-report遷移の保証は後続navigation/read-modelが所有する。

正式画面仕様で使用候補だがallowlist外の`view / q / sort / page / priority / area / section`は、C0で推測追加せずC1の判断事項とする。

## 6. synthetic共通fixture

fixtureはtest/design preview専用であり、production measurementやpublished reportへ使用しない。

- project: 勤怠クラウド
- period: 2026-07-07〜2026-08-05
- measured at: 2026-08-05
- models: 4
- eligible answers: 100
- target brands: 20
- AI表示率: `57 / 100 = 57.0%`
- AI内シェア: `57 / 190 = 30.0%`
- 平均掲載位置: `168 / 57 = 2.9位`
- 自社サイト参照率: `18 / 100 = 18.0%`
- 引用付き回答率: `76 / 100 = 76.0%`
- sentiment: `18 + 4 + 2 + 1 = 25`
- reference owner occurrences: `24 + 41 + 78 + 5 = 148`
- current URL pages: `16 + 48 = 64`
- recommendation evidence display: `質問7 · 回答12 · URL4`（合計しない）

fixtureにはRobustness、Diagnostic、強制引用、provider error、refusal、未finalized Prompt、not-ready designを含め、headline値が変わらないことを検証する。

## 7. 後続工程との境界

C0では次を実装しない。

- current publication pointerと公開版のDB保存
- customer-safe API / RPC / read model
- latest run read pathからcurrent publication readへの切替
- 顧客画面のvisual、navigation、sidebar、plan gate
- DB、migration、RLS、Supabase read/write
- Auth、LP、public、middleware

顧客画面は最終的にcurrent publicationだけを読み、raw measurement、内部control/audit、未公開データを直接参照しない。C0はその後続adapterが受け取る入力・計算・Evidence境界だけを固定する。

## 8. 機械検証

`npm run recora:customer-report-contract:check`は、最新Prompt契約との9 key整合、Core重複、自然/強制引用分離、branded混入、invalid answer、分母0、Evidence束縛、route/query、synthetic利用禁止、共通fixture算術を検証する。

Persona Compiler V3の既存verifierは`npm run recora:measurement-persona-compiler:check`として登録し、標準preflightへ接続する。
