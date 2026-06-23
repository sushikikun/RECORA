# Recora 開発ワークフロー

最終更新: 2026-06-22

このドキュメントは、Recora 開発で迷わないための標準運用手順です。Codex 作業、DB 作業、本番計測、dashboard / read model 修正、commit / push 前確認、Vercel deploy 確認で使います。

## 1. Recora 開発の基本ルール

- 作業ディレクトリは原則 `C:\Users\nakan\work\recora` に固定する。
- `git add .` と無条件の `git add -A` は禁止。stage する場合は明示的なファイル指定、または `npm run recora:safe-commit -- --message "..."` を使う。
- `.env`, `.env.local`, `.env.*`, private key, API key, backup env file は表示しない、貼らない、commit しない。
- env は「存在する / しない」だけ確認する。値はログ、スクリーンショット、ChatGPT/Codex への貼り付けに含めない。
- Recora 作業中は `geo-baseline-tracker` を触らない。明示的に対象指定された場合だけ扱う。
- `.agents/skills/*` の変更と製品コードの変更を混ぜない。skill 整備と `app/`, `components/`, `lib/`, `scripts/`, `supabase/` の変更は原則別作業・別commitにする。
- `supabase/migrations` は気軽に変更しない。migration 作業は専用の計画、検証、レビューを分ける。
- Codex は原則 commit しない。commit する場合もユーザーの明示指示が必要。
- Codex は push しない。push は必ず人間が対象を確認してから行う。

## 2. 作業開始時の手順

PowerShell で `C:\Users\nakan\work\recora` に移動してから実行する。

```powershell
npm run recora:whereami
npm run recora:human-check
npm run recora:before-codex
```

`recora:whereami` では、current directory、repo root、branch、latest commit、Node/npm、`.env.local` の存在を確認する。

`recora:human-check` は ChatGPT/Codex に貼るための作業状態スナップショット。secret 値は出さず、状態だけをまとめる。

`recora:before-codex` は Codex 投入前の安全確認。未コミット差分、重要領域、lock file、`git diff --check` を確認する。

## 3. Codex 投入前の手順

Codex に作業させる前に、最低限以下の出力を貼る。

```powershell
npm run recora:human-check
npm run recora:before-codex
```

依頼文には必ず以下を書く。

- 編集してよいファイル / ディレクトリ。
- 編集してはいけないファイル / ディレクトリ。
- DB、migration、`.agents/skills`、本番計測が対象に含まれるか。
- commit を許可するか。未指定なら commit 不可。
- push を許可するか。未指定でも push 不可。

既存の未コミット差分がある場合は、それが人間の作業か、Codex が触ってよいかを明記する。混ぜたくない場合は、先に commit / stash / 別ブランチ化する。

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
