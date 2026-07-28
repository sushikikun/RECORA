# Exec Plan: Issue #95 master branch ruleset

このファイルは実行中に更新する living document である。将来の設定変更を許可するものではなく、Issue に記録された承認境界を正本とする。

## Metadata

| Field | Value |
|---|---|
| Issue | [#95 `[Phase D2] masterブランチ保護ルールセットを導入する`](https://github.com/sushikikun/RECORA/issues/95) |
| Risk | `R3` |
| Spec level | `Full` |
| Execution | `Human` |
| Approval | Stage 1 Plan approval only: [OWNER comment](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5101045826) |
| Owner | `@sushikikun` |
| Status | `Active` |
| Updated | `2026-07-28` |

Issue #95本文にはこのplanのpath `docs/exec-plans/active/issue-95-master-ruleset.md`が指定されており、このplanからIssueへリンクしている。Issue本文の`Status: Spec`より、最新OWNERコメントのStage 1 `Status: Ready`を優先する。

## Objective / expected outcome

`master`への変更をPull Requestと成功したRecora CIの証跡に限定し、force push、branch削除、未解決conversationを伴うmergeを防ぐ。solo-owner運用を停止させず、誤設定時にownerが速やかに無効化して復旧できる契約を、GitHub設定変更前に確定する。

Stage 1の成果はread-only監査とこのExec Planだけである。rulesetの作成、有効化、更新、無効化、削除、classic branch protectionおよびrepository settingsの変更はStage 2の個別Execute承認まで実行しない。

## Context and constraints

### Task state

| Field | Current value |
|---|---|
| Project | `sushikikun` / Project #1 `Recora Development` |
| Status | `Ready` |
| Risk | `R3` |
| Execution | `Human` |
| Spec level | `Full` |
| Approval | `Plan` |
| Priority | `P1` |
| Area | `Development process` |
| Blocked by / Target | 空欄 |

### Audit scope and time

- Repository: `sushikikun/RECORA`
- Audit window: `2026-07-28T16:13:51+09:00`から`2026-07-28T16:19:04+09:00`（`2026-07-28T07:13:51Z`から`2026-07-28T07:19:04Z`）
- Audit method: GitHub REST APIおよびGitHub CLIによるGET/read-only取得
- Repository settings write count: `0`
- Audit base: `origin/master` at `811c786eded0f29af0338fc3dab9aa144ea5da7e`
- Local branch: `issue-95-master-ruleset-plan`
- Git common dir: `C:/Users/nakan/work/recora-main/.git`
- Secret handling: token、credential、cookie、secret、private値を出力または保存していない

## Current state

### Repository and merge settings

| Item | Observed value |
|---|---|
| Visibility | Public |
| Archived | `false` |
| Default branch | `master` |
| Default branch SHA | `811c786eded0f29af0338fc3dab9aa144ea5da7e` |
| Squash merge | Enabled |
| Merge commit | Enabled |
| Rebase merge | Enabled |
| Auto merge | Disabled |
| Update branch | Disabled |
| Delete head branch on merge | Disabled |
| Web commit signoff | Disabled |
| Authenticated access observed | `admin=true`, `maintain=true`, `push=true` |

Stage 2ではmerge methods、default branch、auto merge、head branch deletionの設定を変更しない。

### Rulesets and classic branch protection

| Read-only check | Result | Interpretation |
|---|---|---|
| `GET /repos/sushikikun/RECORA/rulesets` | HTTP 200, `[]` | Repository rulesetは0件 |
| `GET /repos/sushikikun/RECORA/rules/branches/master` | HTTP 200, `[]` | `master`へ適用中のactive ruleは0件 |
| `GET /repos/sushikikun/RECORA/branches/master` | `protected=false`, protection disabled | `master`は現在未保護 |
| `GET /repos/sushikikun/RECORA/branches/master/protection` | HTTP 404 | classic branch protectionは未設定 |

classic protection endpointの404だけでは未設定と権限不足を区別できないため、repository metadataの`permissions.admin=true`、branch metadataの`protected=false`、rulesets/rules endpointのHTTP 200空配列を併せて判定した。今回の404は権限不足ではなく未設定を示す。

既存rulesetとclassic protectionはいずれもないため、現在の重複・競合はない。Rulesetsは複数ruleおよびclassic protectionと積み上がり、競合時は最も厳しい結果になるため、Stage 2直前にも同じ3 endpointを再取得し、何か1件でも新規設定があれば停止してplanを再評価する。

### Check runs and status sources

| SHA / event | Exact check or status | Source | Result | Evidence time (UTC) |
|---|---|---|---|---|
| `811c786e…` / `push` to `master` | Check run `Recora checks` | GitHub Actions app, integration ID `15368`; workflow `Recora CI`; `.github/workflows/ci.yml` | `completed/success` | start `2026-07-28T06:55:54Z`, complete `2026-07-28T06:57:16Z` |
| `27ae309…` / `pull_request` | Check run `Recora checks` | GitHub Actions app, integration ID `15368`; workflow `Recora CI`; `.github/workflows/ci.yml` | `completed/success` | start `2026-07-28T06:38:33Z`, complete `2026-07-28T06:39:42Z` |
| `811c786e…` / `push` | Commit status `Vercel` | Legacy commit status; API responseにcreatorなし | `success` | `2026-07-28T06:56:34Z` |
| `27ae309…` / `pull_request` | Check run `Vercel Preview Comments` | Vercel GitHub App, integration ID `8329` | `completed/success` | recent PR run |
| `27ae309…` / `pull_request` | Commit status `Vercel` | Legacy commit status; API responseにcreatorなし | `success` | `2026-07-28T06:38:21Z` |

`Recora checks`は直近7日以内に同じrepositoryのPR headとmasterで成功しており、GitHub Actionsというexpected sourceとintegration IDも実データで特定できた。required check候補として利用可能である。API evidenceから必要条件を満たすが、Stage 2の保存前確認でGitHub UIのselectorにも`Recora checks` / GitHub Actionsが表示されることを確認し、表示されなければwriteせず停止する。

同じ`Recora checks`名のlegacy commit statusは観測されていない。GitHubではcheck runとcommit statusが同名の場合は両方がrequiredになるため、Stage 2直前にも同名statusがないことを確認する。

### Owner / admin and bypass

- Repositoryはpersonal account `sushikikun`のpublic repositoryであり、現在の認証主体にadmin権限がある。
- Rulesetの`bypass_actors`へactorを追加しなければ、owner/adminを含むすべてのref updateへrulesが適用される。推奨値は空配列である。
- REST APIが提示するbypass actor種別は`Integration`、`RepositoryRole`、`Team`、`DeployKey`、`User`であり、`OrganizationAdmin`はpersonal repositoryには適用されない。branch rulesetでは`always`、`pull_request`、`exempt`のmode候補がある。
- `always`や`exempt`はdirect pushまたは監査されない例外経路を作り、`pull_request` bypassもownerがCI gateを迂回できるため、初期導入ではいずれも設定しない。
- ownerはbranch update ruleの対象でもrepository Settingsからruleset自体をDisabledへ変更できる。この管理経路を緊急rollbackに使用する。
- collaborator一覧はStage 1で取得していない。Pull Request authorは自分のPRをapproveできないため、独立reviewerの存在を前提にしない初期値はrequired approvals `0`とする。

## Recommended target

### Rulesetsを選ぶ

Repository-level GitHub Rulesetsを第一候補とし、classic branch protectionは作成しない。

理由:

- 名前、enforcement status、branch condition、rules、expected check source、bypassを1つの設定単位としてGETし、実行前後の比較とrollbackを行える。
- Disabled状態で作成して内容をread-backしてからActiveへ切り替えられる。
- active rulesをbranch単位で取得し、適用結果を検証できる。
- public repositoryで利用できる。
- classic protectionを併設するとrulesが積み上がり、原因調査とrollbackが複雑になる。現状は両方式とも未設定なので、単一Rulesetで開始できる。

### Recommended values

| Setting | Recommended value | Rationale |
|---|---|---|
| Ruleset name | `master-pr-ci-protection` | 対象と目的が一意 |
| Target | Branch, exact `refs/heads/master` | default branch変更時に保護対象が暗黙移動しない |
| Initial enforcement | `disabled` | create直後にread-backしてから有効化 |
| Final enforcement | `active` | 検証後に保護を実効化 |
| Bypass actors | `[]` | owner/adminを含め例外なし |
| Require PR | Enabled | direct updateを禁止 |
| Allowed merge methods | `merge`, `squash`, `rebase` | 現在のrepository設定を狭めない |
| Required approvals | `0` | solo-ownerが自分のPRをapproveできず停止するのを防ぐ |
| Dismiss stale approvals | Disabled | approvals 0のため不要 |
| Code owner review | Disabled | CODEOWNER運用を今回導入しない |
| Last push approval | Disabled | solo-owner運用を停止させるため |
| Conversation resolution | Enabled | 未解決会話を伴うmergeを禁止 |
| Required status check | Exact context `Recora checks` | repository-controlled CIの実測名 |
| Expected source | GitHub Actions, integration ID `15368` | 同名checkを別sourceが偽装するのを防ぐ |
| Strict / up-to-date | Enabled (`true`) | 最新`master`との組合せでCIを成功させてからmergeする |
| Block force pushes | Enabled (`non_fast_forward`) | history rewriteを禁止 |
| Restrict deletions | Enabled (`deletion`) | `master`削除を禁止 |
| Linear history | Not enabled | 現在許可されているmerge commitを追加要件なしに無効化しない |
| Vercel required | Not included | deploy連携をmerge gateとせず、sourceが複数形態でありrepository CI契約外 |
| Signed commits | Not enabled | 署名準備とbot互換性の監査が未実施 |
| Merge queue | Not enabled | solo-owner規模で不要。専用workflow/eventの設計も未実施 |
| Required deployment | Not enabled | deploy/productionをこのdevelopment-process gateへ結合しない |

Strict modeではbase更新後に追加buildが必要になる。安全性を優先して`true`を推奨するが、次の実PRで過度な更新loopが発生した場合はrulesetをDisabledに戻し、`false`への変更案を別途Human reviewする。Stage 2中に独断でlooseへ変更しない。

## Scope / non-goals

### In scope

- Stage 1のread-only repository settings監査
- このExec Plan 1ファイルの作成
- Stage 2のexact setting、validation、smoke test、rollback契約の策定

### Non-goals

- Rulesetまたはclassic branch protectionの作成、更新、有効化、無効化、削除
- Repository settings、default branch、merge methods、permission、collaborator、GitHub Appの変更
- Direct push、merge、deploy、production操作
- `.github/**`、製品コード、DB、Auth、migration、package、lockfile、Skillsの変更
- Stage 1中のcommit、push、PR作成
- Branchまたはworktree削除

## Assumptions and dependencies

| Item | State / evidence | Impact if false |
|---|---|---|
| Stage 1 status is Ready | Latest OWNER comment | Readyでなければ停止 |
| Stage 1 Plan approval exists | Latest OWNER comment | read-only監査とplan作成を停止 |
| Stage 2 Execute approval does not exist | Issue #95 | GitHub settings writeを実行しない |
| `origin/master` is expected SHA | Confirmed at branch creation | 差分があればplan更新まで停止 |
| `Recora checks` remains exact CI context | Recent PR and master check runs | 名前/sourceが変わればactivation前に停止 |
| GitHub Actions remains installed and runnable | Recent success, integration ID `15368` | required checkを設定せず停止 |
| Ruleset availability remains unchanged | Public repository and successful ruleset GET | API/UIで作成不可ならclassicへ自動fallbackせず停止 |
| No new overlapping rule exists at Stage 2 | Currently none | 統合判断のためStage 2を停止 |
| Independent approving reviewer is available | Unconfirmed and not assumed | approvals 0を維持 |

## Risk and safety boundaries

- Highest Risk: `R3`
- Allowed Stage 1 changes: `docs/exec-plans/active/issue-95-master-ruleset.md`のみ
- Prohibited Stage 1 changes: Issue #95の禁止範囲すべて
- Required approvals:
  - Stage 1 read-only監査とplan作成: 承認済み
  - planのcommit / push / PR: 未承認
  - Rulesetのcreate-disabled、activate、update、emergency-disable: それぞれを含む個別Execute承認が必要
  - Ruleset delete: 推奨rollbackに含めず、必要時は別の明示承認が必要
  - Merge、deploy、production: 本planの承認対象外
- Stop conditions:
  - ruleset/classic protectionの新規存在または競合
  - `origin/master`、default branch、check context/source、merge methodsの変化
  - UI selectorにexpected source付き`Recora checks`がない
  - API payloadと承認済みplanが不一致
  - settings writeの権限またはrollback経路を確認できない
  - required checkが期待SHAで開始しない、または誤ったsourceから届く
- Secret and data handling: 認証情報をcommand、plan、Issue、snapshotへ保存しない。`gh`の既存認証を利用し、値は表示しない。

## Exact execution contract for Stage 2

この節は計画であり、現在のPlan approvalでは実行してはならない。

### Required individual Execute approval

Stage 2を開始するOWNERコメントは、少なくとも次を個別に承認する必要がある。

1. 下記exact payloadによるDisabled rulesetの作成
2. 作成結果のread-back後、`enforcement: active`への更新
3. validationと次の実PRでのsmoke test
4. rollback trigger発生時の`enforcement: disabled`への緊急更新
5. 実行者がHuman `@sushikikun`であること

Commit、push、PR、merge、deploy、production、ruleset deleteは必要に応じて別の承認として明示する。

### Pre-execution snapshot

Human executorはwrite前に次をread-onlyで再取得し、時刻、HTTP status、必要フィールドをsecretなしで記録する。

```powershell
gh api repos/sushikikun/RECORA
gh api repos/sushikikun/RECORA/rulesets
gh api repos/sushikikun/RECORA/rules/branches/master
gh api --include repos/sushikikun/RECORA/branches/master/protection
gh api repos/sushikikun/RECORA/branches/master
gh api repos/sushikikun/RECORA/commits/master/check-runs
gh api repos/sushikikun/RECORA/commits/master/status
gh run list --repo sushikikun/RECORA --workflow "Recora CI" --limit 10
```

Expected preconditions:

- default branch `master`
- rulesets `[]`
- rules for `master` `[]`
- classic protection 404と`protected=false`
- merge methodsはCurrent stateと一致
- recent successful `Recora checks` from GitHub Actions integration ID `15368`
- 同名legacy statusなし

1項目でも不一致ならwriteせず停止し、snapshotと差分をHuman reviewへ戻す。

### Exact create payload

Formal method: HumanがGitHub REST API `POST /repos/sushikikun/RECORA/rulesets`を使用する。API versionは実行時のGitHub REST current versionをheaderで明示し、payload schemaに差分があればwriteせずplanを更新する。

```json
{
  "name": "master-pr-ci-protection",
  "target": "branch",
  "enforcement": "disabled",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": [
        "refs/heads/master"
      ],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": [
          "merge",
          "squash",
          "rebase"
        ],
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 0,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {
            "context": "Recora checks",
            "integration_id": 15368
          }
        ],
        "strict_required_status_checks_policy": true
      }
    }
  ]
}
```

Dry-run equivalent before POST:

- JSON parseが成功すること
- exact payloadをこのplanと機械的または目視で比較すること
- `enforcement`が`disabled`であること
- `bypass_actors`が空であること
- targetが`refs/heads/master`だけであること
- rulesが`deletion`、`non_fast_forward`、`pull_request`、`required_status_checks`の4件だけであること
- context/sourceが`Recora checks` / integration ID `15368`であること
- tokenやcredentialがpayloadにないこと

POSTの期待結果はHTTP 201で、sourceがrepository `sushikikun/RECORA`、targetがbranch、enforcementがdisabledのruleset IDが返ること。201以外、validation warning、予期しないdefault、追加rule、bypass actorがあればactiveにせず停止する。

### Activation

1. 返却されたruleset IDを使い、`GET /repos/sushikikun/RECORA/rulesets/{ruleset_id}`で作成内容をfull read-backする。
2. exact payloadと一致した場合だけ、同じ個別Execute承認の範囲で`PUT /repos/sushikikun/RECORA/rulesets/{ruleset_id}`へ次を送る。

```json
{
  "enforcement": "active"
}
```

3. HTTP 200を確認し、直後にruleset detailと`GET /repos/sushikikun/RECORA/rules/branches/master`を再取得する。

UIを正式実行方法にしない理由は、REST payloadとresponseの方がexact value、source integration ID、snapshotとの差分を検証しやすいためである。GitHub UIはselectorのsave前確認とrollback経路に使用する。

## Plan with milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Project and start gate | `Completed` | Project #1分類、latest approval、branch、SHA、clean stateを確認 | Ready / R3 / Human / Full / Plan、expected SHA、clean |
| M2: Read-only audit | `Completed` | Rulesets、classic protection、checks、merge methods、default branchをGET | Current stateとsource evidenceを確定、write 0 |
| M3: Exec Plan | `Completed` | exact payload、validation、smoke、rollbackを記録しlocal validation | 許可1ファイルだけの差分、Human reviewへ停止 |
| M4: Persist reviewed plan | `Pending` | 別のGit承認後にcommit / push / PR | planがmasterへ保存される |
| M5: Stage 2 settings execution | `Pending` | 個別Execute承認後にHumanがDisabled作成、read-back、Active化 | active rulesetがexact contractと一致 |
| M6: Smoke test | `Pending` | 次の実PRでmerge gateとintegration impactを確認 | CI、conversation、PR gateが期待どおり |
| M7: Complete or rollback | `Pending` | 成功時Issue完了、失敗時Disabled化 | 証跡と最終状態を記録 |

## Validation plan

### Stage 1 local validation

| Validation | Expected result | Actual result / evidence |
|---|---|---|
| `npm run recora:preflight:full` | exit 0 | Passed with Node `v24.18.0` / npm `11.16.0`; expected local warnings only |
| `git diff --check` | no output, exit 0 | Passed; new untracked fileは別途scope確認 |
| `npm run recora:commit-check` | exit 0 | Passed: 1 changed file、lockfile/migration/secretなし、preflight passed |
| `git diff --name-only` | tracked diffのみを表示 | Passed, output empty because the only change is a new untracked file |
| `git status --short --untracked-files=all` | plan 1ファイルだけがuntracked | Passed: `?? docs/exec-plans/active/issue-95-master-ruleset.md` |
| `git diff --cached --name-only` | empty | Passed: staged files 0 |
| PlanとIssueのlink review | 双方向参照あり | PlanからIssue URL、Issue本文からplan path |
| Audit evidence review | 時刻、repository、check名/sourceあり | Completed |
| Settings write audit | write 0 | Completed |

### Stage 2 post-write validation

1. Ruleset detail GETでname、source、target、enforcement、condition、rules、bypassをexact payloadと比較する。
2. `GET /repos/sushikikun/RECORA/rules/branches/master`に次がactive ruleとして現れることを確認する。
   - deletion restriction
   - non-fast-forward / force-push block
   - pull request requirement
   - required status check
3. Required checkがexact `Recora checks`、expected source GitHub Actions integration ID `15368`、strict `true`であることを確認する。
4. `master`以外のbranchが対象になっていないことを確認する。
5. bypass actorが0件で、owner/adminにもruleが適用されることを確認する。
6. classic branch protectionが引き続き未設定で、重複ruleがないことを確認する。
7. default branchとmerge methodsが変更されていないことを確認する。
8. repository settings write historyが、承認されたcreate-disabledとactivateだけであることを確認する。

### Smoke test

次の実PRを使い、smoke test専用の不要なcode/settings変更は作成しない。

1. PR作成直後、merge boxに`Recora checks`がrequiredとして表示され、完了前はmerge不能であることを確認する。
2. Check detailsからsourceがGitHub Actions、workflowが`Recora CI`であることを確認する。
3. base `master`が進んだ場合、strict ruleによりhead更新までmerge不能になることを確認する。
4. 実review conversationがある場合、未解決中はmerge不能、解決後はそのblockが消えることを確認する。smokeのためだけに不要なconversationを作らない。
5. `Recora checks`成功、branch up-to-date、conversation解決後にmerge可能表示へ変わることを確認する。merge自体は別承認まで実行しない。
6. Feature branchへの通常push、GitHub Actions起動、PR作成が成功し、既存ChatGPT / Codex連携がbranch + PR経路で継続できることを確認する。
7. Direct repository contents writeや`master`へのdirect pushは失敗が期待値だが、危険な実書込試験は行わない。active rules GETとRule Insights / rule suitesで適用を確認する。
8. Branch deletionやforce pushの実試験は行わない。`deletion`と`non_fast_forward`のactive rules read-backを証跡とする。

## Rollback / recovery

### Rollback triggers

- `Recora checks`が正しいPR SHAで開始しない
- expected source mismatchで成功checkが認識されない
- strict modeにより正常なPRが合理的な更新後もmerge可能にならない
- 予期しないbranch、actor、merge methodへruleが適用される
- Feature branch push、Actions、PR作成など通常の開発経路が不当に停止する
- Read-backが承認済みpayloadと一致しない

### Preconditions

- Stage 2 Execute approvalにemergency disableを明記する。
- 作成したruleset IDとactivation直前/直後のsanitized GET snapshotを保持する。
- Rollback中もdirect push、bypass merge、ruleset deleteを行わない。

### Preferred rollback

1. GitHub UIで `sushikikun/RECORA` → `Settings` → `Rules` → `Rulesets` → `master-pr-ci-protection`を開く。
2. Enforcement statusを`Disabled`へ変更してsaveする。
3. または、承認済みHuman executorが`PUT /repos/sushikikun/RECORA/rulesets/{ruleset_id}`へ次を送る。

```json
{
  "enforcement": "disabled"
}
```

4. Ruleset detail GETで`disabled`を確認する。
5. `GET /repos/sushikikun/RECORA/rules/branches/master`が空になり、classic protectionが未設定のままであることを確認する。
6. Default branch、merge methods、repository contentsに変更がないことを確認する。
7. 原因、時刻、response、影響、再有効化条件をIssueとこのliving documentへ記録する。

Disabled状態を証跡として保持し、通常rollbackではdeleteしない。deleteが必要な場合は別のR3明示承認を得る。

### Wrong required check / merge unavailable recovery

1. Mergeを強行またはbypassせず、rulesetをDisabledへ戻す。
2. Blocked PRのhead SHAとGitHub Actions check runsをGETし、exact context、integration ID、workflow event、conclusionを確認する。
3. 同名legacy status、renamed job、skipped workflow、base更新、Actions incidentを切り分ける。
4. strictだけが原因ならbranchを最新`master`へ更新し、`Recora checks`を再実行する。
5. Context/source誤設定ならDisabledのままcorrect payloadを作り、Human reviewと新たなupdate/activate承認を得る。
6. Corrected rulesetをread-backしてからActiveへ戻し、次の実PRでsmoke testをやり直す。
7. 復旧できない場合はDisabledを維持し、classic protectionへ自動切替せずIssueをBlockedとしてownerへescalateする。

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| `2026-07-28` | M1 | Project #1をReady / R3 / Human / Full / Plan / P1 / Development processへ設定。branchとSHAを確認 | Read-only audit |
| `2026-07-28` | M2 | rulesets 0、active rules 0、classic protection未設定、merge methodsとcheck sourceを確認。settings write 0 | Plan作成 |
| `2026-07-28` | M3 | Recommended Rulesetとexact disabled-create / active-update契約、validation、smoke、rollbackを記載 | Stage 1 local validation後Human review |
| `2026-07-28` | M3 | 指定local validationがすべてexit 0。変更はnew untracked plan 1ファイル、staged 0 | Human reviewへ停止 |

## Decision log

| Date | Decision | Rationale / evidence | Impact |
|---|---|---|---|
| `2026-07-28` | Rulesetsをclassic protectionより優先 | 現在どちらも未設定。Rulesetsはnamed unit、Disabled rollout、read-back、rule insightsに適する | classicを併設しない |
| `2026-07-28` | Exact `refs/heads/master`をtarget | default branch変更による暗黙の対象移動を避ける | default branch変更時はplan再評価 |
| `2026-07-28` | Approvals 0 | PR authorは自己approve不可。独立reviewerを前提にしない | PR、CI、conversation gateは維持 |
| `2026-07-28` | Strict checksを採用 | 最新baseとの組合せを検証してからmerge | base更新時に再buildが必要 |
| `2026-07-28` | GitHub Actions sourceを固定 | Recent check runからcontextとintegration IDを特定 | 異なるsourceの同名checkを受理しない |
| `2026-07-28` | Bypassなし | owner/adminにもPRとCI gateを適用 | 復旧はSettingsからDisabled化 |
| `2026-07-28` | Linear historyを初期導入しない | 現在のmerge methodsを狭めることはIssueの必須目的でない | merge/squash/rebaseを維持 |
| `2026-07-28` | Vercelをrequiredにしない | deploy連携、複数status形態、repository CI契約外 | Vercel failure単独ではmergeをblockしない |
| `2026-07-28` | Disabled作成後にActive化 | payload誤設定をenforcement前に検出 | Stage 2は2段階のsettings write |

## References

- [Issue #95](https://github.com/sushikikun/RECORA/issues/95)
- [GitHub Docs: About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub Docs: Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub Docs: Managing rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [GitHub Docs: REST API endpoints for repository rules](https://docs.github.com/en/rest/repos/rules)
- [GitHub Docs: Troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [GitHub Docs: Approving a pull request with required reviews](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews)

## Results and remaining risks

### Results

- Stage 1 read-only audit completed.
- Recommended repository Ruleset and exact Stage 2 contract documented.
- GitHub repository settings write count remains `0`.

### Validation results

- Stage 1 local validation passed. 初回はPowerShell PATHに`npm`がなく起動できず、既存fnmのNode `v24.18.0` / npm `11.16.0`を当該検証プロセスのPATHへ追加して再実行した。repository、package、lockfileへの変更はない。
- `recora:preflight:full`と`recora:commit-check`のWARNは、plan 1ファイルがuntracked、`.env.local`がない、既存migration命名形式、既存mock/static data参照であり、FAILは0だった。
- `git diff --name-only`はuntracked fileを列挙しないため空だった。`git status --short --untracked-files=all`と`git ls-files --others --exclude-standard`で許可されたplan 1ファイルだけを確認した。
- Stage 2 settings validation and smoke test are not executed because Execute approval does not exist.

### Deviations from plan

- None at this stage.

### Remaining risks

- GitHub UI selectorでexpected source付き`Recora checks`をsave前に確認していない。API evidenceでは候補条件を満たす。
- Collaborator availabilityは未確認であり、approvals 0を前提とする。
- Strict modeの実際の更新頻度とChatGPT / Codex連携への影響は次の実PRまで未確認。
- Disabled create、Active update、emergency disableはいずれもrepository settings writeであり、Stage 2の個別Execute承認が必要。
- GitHub API schema、check context/source、既存rulesはStage 2までに変化し得るため、実行直前snapshotが必要。

### Completion record

- Final status: `Active`
- Completed or closed at: not completed
- Follow-up: Stage 1 Human review、plan保存のGit承認、Stage 2 individual Execute approval
- Archive path after completion: `docs/exec-plans/completed/issue-95-master-ruleset.md`
