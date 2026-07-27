# Recora 開発ワークフロー

最終更新: 2026-07-28

このドキュメントは、Recora Agentic SDLC v2をローカルで実行するための標準運用手順です。開発ライフサイクルと承認境界は`docs/recora-agentic-sdlc.md`、ここではCodex作業、DB作業、本番計測、dashboard / read model修正、commit / push前確認、Vercel deploy確認の具体手順を扱います。

## 1. Recora 開発の基本ルール

- 正式repoは `C:\Users\nakan\work\recora-main` とする。Local Codexは、そこから作られたCodex管理Worktree内で作業してよい。
- 新規作業はChatGPT project `recora-main`、start mode `New Worktree`、environment `recora-main-local`、base branch `master`から開始する。
- Risk、Execution、Spec level、Ready、承認ゲートは`docs/recora-agentic-sdlc.md`に従う。
- `git add .` と無条件の `git add -A` は禁止。stage する場合は明示的なファイル指定、または `npm run recora:safe-commit -- --message "..."` を使う。
- `.env`, `.env.local`, `.env.*`, private key, API key, backup env file は表示しない、貼らない、commit しない。
- env は「存在する / しない」だけ確認する。値はログ、スクリーンショット、ChatGPT/Codex への貼り付けに含めない。
- Recora 作業中は `geo-baseline-tracker` を触らない。明示的に対象指定された場合だけ扱う。
- `.agents/skills/*` の変更と製品コードの変更を混ぜない。skill 整備と `app/`, `components/`, `lib/`, `scripts/`, `supabase/` の変更は原則別作業・別commitにする。
- `supabase/migrations` は気軽に変更しない。migration 作業は専用の計画、検証、レビューを分ける。
- Codex は原則 commit しない。commit する場合もユーザーの明示指示が必要。
- Codex は push しない。push は必ず人間が対象を確認してから行う。

## 2. 作業開始時の手順

Local Codexは、人間に状態出力の全文転送を要求せず、Issueとrepoを読んで開始チェックを自ら実行・報告する。

作業開始前にIssue本文、OWNERによる開始判定、指定された正本文書を読み、次を確認する。

- Issue番号と一つの目的
- Risk / Execution / Spec level / Approval / Ready状態
- 許可範囲、禁止範囲、停止条件
- 受け入れ条件、指定検証、Human reviewへ渡す内容
- 依存Issue、blocker、既存差分の所有者

続いて、対象Worktree内で次を実行する。

```powershell
git fetch origin
npm run recora:whereami
git rev-parse --show-toplevel
git rev-parse --path-format=absolute --git-common-dir
git branch --show-current
git rev-parse --short HEAD
git rev-parse --short origin/master
git status --short
npm run recora:before-codex
```

Local Codexは、repo root、`git-common-dir`、current branchまたはdetached `HEAD`、短い`HEAD`、短い`origin/master`、dirty stateを報告する。

`git-common-dir`がOneDriveを指す場合は編集せず停止する。Codex管理Worktreeがdetached `HEAD`で開始した場合は、`HEAD == origin/master`かつworking treeがcleanなときだけtask branchを作る。detached `HEAD`が`origin/master`と異なる場合、`master`が`origin/master`より古い場合、既存差分の所有者や扱いが不明な場合は編集しない。

`npm run recora:human-check`は、必要時に人間が安全な状態スナップショットを取得するため残す。

```powershell
npm run recora:human-check
```

`human-check`の全文を毎回ChatGPT / Codexへ貼ることは標準義務にしない。共有が必要な場合もsecret値を含めず、状態だけを扱う。

## 3. IssueからHuman reviewまでの手順

1. Issueで目的、Risk、Execution、Spec level、Approval、受け入れ条件、許可・禁止範囲、停止条件を整理し、`Ready`を記録する。
2. ChatGPT project `recora-main`からNew Worktreeを作り、environment `recora-main-local`、base `master`を選ぶ。
3. Local CodexがAGENTS.md、Issue、指定文書を読み、開始チェックを実行・報告する。
4. 複数ファイル、DB、deployment、長時間作業では`/plan`を先に使い、実装範囲と検証を固定する。
5. R2は計画のHuman承認前に実装しない。計画承認後も、実装またはwrite-capable executionへ進む前に別の明示承認を得る。
6. R3は調査、計画、read-only確認、明示承認済みdry-runを超えない。productionまたはprivileged operationは対象ごとに個別承認を得る。
7. 開始ゲート通過後にtask branchを作り、Issueで許可された範囲だけを変更する。
8. 指定検証を実行し、`git diff --name-only`と差分内容を確認する。
9. 受け入れ条件、検証結果、未確認事項、残存リスクを報告し、Approvalで許可されていないcommit、push、PR作成の前でHuman reviewへ渡す。

Issueには最低限、次を記録する。

- 編集してよいファイル / ディレクトリ
- 編集してはいけないファイル / ディレクトリ
- DB、migration、`.agents/skills`、本番計測、外部API writeが対象に含まれるか
- commitを許可するか。未指定ならcommit不可
- pushを許可するか。未指定ならpush不可
- PR作成を許可するか。未指定ならPR作成不可

既存の未コミット差分がある場合は、それが人間の作業か、Codexが触ってよいかを明記する。混ぜたくない場合は、先にcommit / stash / 別branch化する。

## 4. 実装後の検証手順

まず Recora 標準の一括検証を実行する。

```powershell
npm run recora:preflight:full
```

変更内容に応じて以下も実行する。

```powershell
npm run lint
npm run build
git diff --check
```

`recora:preflight:full` には、whereami、before-codex、doctor、dashboard read model check、typecheck が含まれる。

`lint` と `build` は、production に影響する変更、dashboard 修正、リリース前、runtime に触る変更では必須扱いにする。

## 5. dashboard / read model を触った後の手順

対象例:

- `app/dashboard/**`
- `components/recora/**`
- `lib/recora/db/**`
- dashboard の Supabase `.from()` / `.select()`
- `metric_snapshots` の取得条件や表示条件
- report / leaderboard / sources / conversations / recommendations まわり

実行する。

```powershell
npm run recora:dashboard-read-model:check
npm run recora:preflight:full
```

localhost でも確認する。

```powershell
npm run dev
```

最低限見るページ:

- `/dashboard`
- `/dashboard/reports/mieruca-seo-demo`
- 変更した report subpage

本番 Supabase データを読む場合の注意:

- アプリがどの DB を読んでいるか先に確認する。
- service role key を REST 確認、ブラウザ確認、スクリーンショット、ログに使わない。
- Supabase key や credential 付き URL を ChatGPT/Codex に貼らない。
- 本番データ確認は read-only / narrow inspection を優先する。

## 6. Supabase / DB / migration を触る前の手順

原則: production DB への write は禁止。ユーザーが対象 DB、操作内容、実行コマンドを明示承認した場合だけ例外にする。

事前確認:

```powershell
npm run recora:before-codex
npm run recora:doctor
```

ルール:

- まず dry-run または read-only inspection を行う。
- write 前に DB host を確認する。
- non-local DB への write は、その script が用意している明示 confirm を必須にする。
- service role key を REST、ブラウザ、スクリーンショット、雑な疎通確認に使わない。
- migration は専用タスクとして扱う。ついでに作らない、ついでに直さない。
- migration が必要な場合は、ローカル Supabase または承認済み DB tooling で検証する。
- `.env`, `.env.local`, database URL, service role key, anon key, OpenAI key, private key は出力しない。

## 7. 本番計測前の手順

本番または本番相当の計測前は、DB の向き先を必ず確認する。

チェックリスト:

- `RECORA_DATABASE_URL` が意図した host を向いているか確認する。full URL は表示しない。
- 対応 script では `--expected-db-host` を使う。
- 小さく始める。`--prompt-limit 1` → `--prompt-limit 4` → `--prompt-limit 8` の順で進める。
- 実行後は read-only inspection で結果を確認してから拡大する。

read-only 確認例:

```powershell
npx tsx scripts/inspect-recora-measurement-runs.ts --project-slug mieruca-seo-demo --limit 5
```

non-local DB で write する script が明示 confirm を求めた場合は、一度止めて DB host、project slug、prompt-limit、実行目的を確認する。

## 8. commit 前の手順

まず commit check を実行する。

```powershell
npm run recora:commit-check
```

`recora:commit-check` が見るもの:

- `git status --short`
- `git diff --check`
- `npm run recora:preflight:full`
- 変更ファイル分類: tooling / app / ui / logic / db / migration / env / generated / other
- env / secrets / generated の混入
- staged 済み危険ファイル
- `supabase/migrations` 変更
- 大量変更、大量削除、lock file 変更

安全に commit する場合:

```powershell
npm run recora:safe-commit -- --message "your commit message"
```

重要:

- `recora:safe-commit` は push しない。
- `git add .` は使わない。
- add 前に対象ファイル一覧を表示する。
- env / secrets / generated は add しない。
- `supabase/migrations` は今回は自動許可しない。将来 `--allow-migrations` を別設計する。

stage 内容を確認する。

```powershell
git diff --cached --name-only
```

手動 stage が必要な場合も explicit path だけにする。

```powershell
git add -- docs/recora-dev-workflow.md
```

## 9. push 前の手順

push は人間が最終確認して行う。

```powershell
git status
git log --oneline -5
```

確認すること:

- branch が正しい。
- 最新 commit hash と message が意図通り。
- 未意図の staged / dirty file がない。
- push 先 remote と branch が正しい。
- secrets、env backup、generated output、無関係な `.agents/skills` 変更が含まれていない。

確認後、人間が明示的な push コマンドを実行する。

## 10. Vercel deploy 時の注意

Vercel deploy 前後は、対象 project / environment の環境変数を確認する。ただし値は表示しない。

注意点:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` と `SUPABASE_ANON_KEY` は `eyJ...` で始まる anon public key であること。
- project ref、URL、service role secret を anon key 欄に入れない。
- full key は ChatGPT/Codex、ログ、スクリーンショットに出さない。
- service role key は browser に露出させない。
- production Supabase URL と anon key の存在は確認するが、値は表示しない。

Deploy 後に見るURL:

- Vercel の deployment URL
- `/dashboard`
- `/dashboard/reports/mieruca-seo-demo`

Deploy 後にデータが出ない場合は、まず Vercel env の存在、anon key の種類、Supabase URL の向き先を確認する。その後 dashboard/read model 側の条件を見る。

## 11. よくある事故と対処

### 本番のつもりが local DB に書く

実行を拡大しない。`RECORA_DATABASE_URL` の host、script 出力、対象 project slug を確認する。local と本番を read-only で別々に確認する。大きい prompt-limit で再実行しない。

### anon key が `Invalid API key`

`NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` が `eyJ...` で始まる anon public key か確認する。service role key を browser 確認に使わない。full key は貼らない。

### `metric_snapshots` の取得条件ズレ

まず実行する。

```powershell
npm run recora:dashboard-read-model:check
```

その後、dashboard が aggregate run / source run / project scope / brand scope / metadata filter のどれを期待しているか確認する。UIだけを先に直さず、read-only DB inspection で実データを確認する。

### `.env.local.backup` 系ファイル

secret file として扱う。add しない。必要性を確認した上で repo 外へ移すか削除する。`recora:commit-check` と `recora:safe-commit` は secret らしい path をブロックする前提。

### 進捗ログなしで長時間待つ

低い `--prompt-limit` から始める。長時間無音なら、範囲を広げずに read-only inspection で直近 run を確認する。進捗ログがないまま再実行を重ねない。

## Quick Command Reference

`npm run recora:phase1:operator` is an internal operator entry point only. Keep per-client input JSON in `tmp/` or another untracked path, and do not expose it as a customer-facing UI, public sample JSON, or self-serve operation.

```powershell
npm run recora:whereami
npm run recora:human-check
npm run recora:before-codex
npm run recora:doctor
npm run recora:dashboard-read-model:check
npm run recora:phase1:operator -- --client-config .\tmp\client-project.json
npm run recora:preflight
npm run recora:preflight:full
npm run recora:commit-check
npm run recora:safe-commit -- --message "your commit message"
```
