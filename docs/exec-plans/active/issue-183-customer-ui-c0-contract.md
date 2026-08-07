# Exec Plan: Issue #183 顧客画面C0 指標・route・共通fixture契約 v2

このファイルはIssue #183のPlan v2を実装実績へ更新するliving documentである。承認状態の正本はIssueコメントとする。

## Metadata

| Field | Value |
|---|---|
| Issue | [#183](https://github.com/sushikikun/RECORA/issues/183) |
| Risk | `R2` |
| Spec level | `Full` |
| Execution | `Local Codex` |
| Approval | Plan v2 / Execute v2 / 指定7ファイルcommit承認済み。push・PR・merge・deploy・production・DBは未承認 |
| Owner | `sushikikun` |
| Status | `Active` |
| Baseline | `origin/master@a374d92` |
| Branch | `feat/issue-183-customer-ui-c0-contract-v3` |
| Updated | 2026-08-08 |

## Objective / expected outcome

顧客画面01〜10が後続change setで同じ意味の指標・route・query・Evidence・fixtureを使えるよう、最新Prompt契約へ接続したpure TypeScript契約を追加する。

完了条件:

1. 5顧客指標が分子・分母・適格性・集計単位・丸め・分母0を必須化する。
2. 9種類の`metric_eligibility`、Core / Robustness / Diagnostic、`intent_key`と整合する。
3. 自然引用と強制引用、valid answerとprovider失敗を分離する。
4. Evidenceをorganization / project / measurement design / prompt configuration / publication versionへ束縛する。
5. 10 routeとquery key/value安全契約を機械検証する。
6. synthetic共通fixtureを決定論的に計算できる。

## Context and constraints

- Plan v1はsupersededで再利用しない。
- Execute v2は最新masterから同じ7ファイルを再実装・検証する範囲で承認済み。
- 前回worktreeの未commit差分は環境整理で失われ、Git objectにも残っていなかった。
- commit前の`git fetch origin`でmasterが`e4961ff`から`a374d92`へ進んだことを確認した。
- その差分は管理画面5ファイルだけで、C0の7ファイル・Prompt契約・preflight構成と重複しない。
- 最新`origin/master@a374d92`からv3 branch/worktreeを作成し、Plan v2から再構築した。

## Scope / non-goals

### In scope（exact 7 files）

1. `docs/recora-customer-ui-implementation-start-spec-v1.md`
2. `docs/exec-plans/active/issue-183-customer-ui-c0-contract.md`
3. `docs/README.md`
4. `lib/recora/customer-report-contract.ts`
5. `scripts/fixtures/recora-customer-report-contract-fixtures.ts`
6. `scripts/verify-recora-customer-report-contract.ts`
7. `package.json`

### Non-goals

- `app/**`、`components/**`、顧客UI、navigation、sidebar
- DB、migration、RLS、Supabase read/write、seed
- current publication pointer、customer-safe API / RPC、runtime adapter
- #73/#76の代替実装
- Auth、LP、public、middleware
- dependency / `package-lock.json`変更
- external API、production measurement、deploy、merge

## Risk and safety boundaries

- Highest Risk: `R2`
- Allowed changes: 上記7ファイルの編集・検証・commitのみ
- Prohibited changes: push、PR、merge、deploy、production、DB、UI、依存追加、secretアクセス
- Stop conditions: 8ファイル目、Prompt契約変更、DB/API/UI変更、lockfile変更、検証失敗の範囲外修正が必要
- Secret and data handling: `.env*`、token、DB URL、credentialを表示・保存・commitしない

## Plan with milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M0: latest start gate | `Completed` | fetch、repo/worktree/branch/HEAD/origin/master/dirty確認、上流差分監査 | `HEAD == origin/master == a374d92`、clean、OneDrive外 |
| M1: canonical docs | `Completed` | 開始仕様、Exec Plan、docs mapを追加 | Issue / Plan v2 / docsの境界一致 |
| M2: pure TypeScript contract | `Completed` | metric、Evidence、route、query、fail-closed計算を実装 | 既存runtime importなし、5 key一意 |
| M3: synthetic fixture | `Completed` | 勤怠クラウド100回答と除外ケースを追加 | `57/100`、`57/190`、`168/57`、`18/100`、`76/100` |
| M4: cross-contract verifier | `Completed` | Prompt/fixed contract import、退行fixture、Persona check接続 | 9 key・panel role・query値・Evidenceを検出 |
| M5: full validation / commit | `Completed` | 指定検証、差分監査、explicit stage、commit | 全PASS、指定7ファイルだけをcommit、pushなし |

## Validation plan

| Validation | Expected result | Actual result / evidence |
|---|---|---|
| C0専用checkを連続2回 | 同一出力でPASS | PASS。同一JSON。`57/100`、`57/190`、`168/57`、`18/100`、`76/100` |
| Prompt measurement / fixed materialization / Persona Compiler | PASS | PASS。Persona Compilerはminimum 364 cases |
| `npm run recora:preflight:full` | PASS | PASS。新しい2 checkを標準preflight内で実行 |
| `npm run typecheck` | PASS | PASS |
| `npm run lint` | PASS | PASS。warning 0 |
| `npm run build` | PASS | PASS。既存Supabase Edge Runtime / `metadataBase` warningのみ |
| `npm run recora:dashboard-read-model:check` | PASS（既知mock warning可） | PASS=8 / WARN=1 / FAIL=0。意図したmock/static参照のみ |
| `git diff --check` | PASS | PASS。新規ファイルの末尾空白検査もPASS |
| exact scope / lockfile / DB / UI / secret audit | 7ファイル限定、禁止差分0 | PASS。新規5・既存2、禁止領域差分0 |
| `npm run recora:commit-check` | FAIL 0 | PASS=8 / WARN=0 / FAIL=0 |

## Rollback / recovery

- Trigger: verifier失敗、scope逸脱、最新Prompt契約との矛盾、Human review却下
- Preconditions: rollback対象7ファイルを明示し、別のHuman承認を得る
- Steps: 承認済みpathだけを明示patchで開始状態へ戻す。`reset`、`clean`、広範囲checkoutを使わない
- Preserved evidence/data: Issue承認記録、検証ログ、commit hash
- Recovery verification: status、exact diff、preflight、commit-checkを再確認
- Escalation: 8ファイル目やDB/API/UI変更が必要ならIssue #183を止め、別Issue/承認へ送る

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| 2026-08-08 | M0 | latest `origin/master@a374d92`。上流5ファイルは管理画面のみでC0非重複 | v3 worktreeから再構築 |
| 2026-08-08 | M1-M4 | 指定7ファイルの初回再構築完了 | 全検証と差分監査 |
| 2026-08-08 | M5 | full preflight、type、lint、build、dashboard、commit-check、scope監査PASS | 7ファイルを明示stageしてcommit。pushしない |

## Decision log

| Date | Decision | Rationale / evidence | Impact |
|---|---|---|---|
| 2026-08-08 | v1差分を再利用しない | Plan v2の正式指示 | 最新9 eligibilityへ直接接続 |
| 2026-08-08 | `e4961ff`ではなく`a374d92`をbaseにする | commit前fetchでmaster更新を検出。対象責任との競合0 | 新しいv3 branchで履歴を保持 |
| 2026-08-08 | C0をpure contractに限定 | #73/#76とUIは未承認 | DB/runtime/UI差分0を維持 |

## Results and remaining risks

### Results

- 5顧客指標を最新9種類のPrompt eligibilityへ接続した。
- Coreを`intent_key × model`で一意化し、Robustness / Diagnosticをheadlineから分離した。
- invalid answer、自然/強制引用、branded市場指標、Evidence/publication、query値をfail closed検証する。
- synthetic fixtureの5指標・sentiment・Evidence単位を決定論的に検証する。
- Persona Compiler V3を標準preflightへ接続した。

### Validation results

- C0専用check連続2回: PASS・同一出力
- Prompt measurement / fixed materialization / Persona Compiler: PASS
- full preflight / typecheck / lint / build / dashboard check: PASS
- commit-check: `PASS=8 / WARN=0 / FAIL=0`
- exact 7-file scope、lockfile、DB、migration、seed、Auth、LP、UI、secret監査: PASS
- 未実施: 実DB、runtime、UI、external API、deploy（すべて対象外）

### Deviations from plan

- 前回Human review時のworktreeが消失したため、同一内容をcommitするのではなく、最新masterからPlan v2に基づき再構築した。
- 最新baseと失われた差分を区別するためbranch名をv3とした。

### Remaining risks

- C0は実DB/current publication/customer-safe API/顧客UIへ未接続。
- `view / q / sort / page / priority / area / section`はC1判断待ち。
- push・PR・merge・deploy・production・DBは未承認。

### Completion record

- Final status: `Active`
- Completed or closed at: 未完了
- Follow-up: C1および#73/#76または後続publication/read-model Issue
- Archive path: 完了後に別承認・後続作業で`docs/exec-plans/completed/issue-183-customer-ui-c0-contract.md`へ移動
