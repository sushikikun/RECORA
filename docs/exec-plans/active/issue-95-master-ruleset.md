# Exec Plan: Issue #95 master branch ruleset

このファイルは実行中に更新する living document である。将来の設定変更を許可するものではなく、Issue に記録された承認境界を正本とする。

## Metadata

| Field | Value |
|---|---|
| Issue | [#95 `[Phase D2] masterブランチ保護ルールセットを導入する`](https://github.com/sushikikun/RECORA/issues/95) |
| Risk | `R3` |
| Spec level | `Full` |
| Execution | `Human` |
| Approval | Final activation + smoke-test Draft PRのR3 Execute: [OWNER comment](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5103829680) |
| Owner | `@sushikikun` |
| Status | `Active` |
| Updated | `2026-07-28` |

Issue #95本文にはこのplanのpath `docs/exec-plans/active/issue-95-master-ruleset.md`が指定されており、このplanからIssueへリンクしている。最新OWNERコメントID `5103829680`はruleset ID `19883059`の最終Active化、2段階gate、必要時rollback、このplan 1ファイルの記録、commit / push、smoke-test Draft PR作成を個別承認した。Smoke-test PRのmerge、Issue close、追加settings変更、deploy、production操作は承認していない。

## Objective / expected outcome

`master`への変更をPull Requestと成功したRecora CIの証跡に限定し、force push、branch削除、未解決conversationを伴うmergeを防ぐ。solo-owner運用を停止させず、誤設定時にownerが速やかに無効化して復旧できる契約を、GitHub設定変更前に確定する。

Stage 2ではrulesetを作成して一時Active化した後にDisabledへrollbackし、その後のretryでもcontrol-plane成功後のローカル集約処理エラーを安全側でrollback triggerとして扱った。最終Active化では改訂契約に従い、Active PUT、全8 poll、ruleset detail、branch metadata、raw evidence、SHA-256 inventoryの両gateが成功したため、rulesetをActiveのまま維持した。次の成果物はsmoke-test Draft PRであり、mergeとIssue closeは別承認まで実行しない。

## Context and constraints

### Task state

| Field | Current value |
|---|---|
| Project | `sushikikun` / Project #1 `Recora Development` |
| Status | `Human review` |
| Risk | `R3` |
| Execution | `Human` |
| Spec level | `Full` |
| Approval | `Execute` |
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

### Stage 2 execution start

- Stage 2 OWNER approval: [Issue #95 comment `#issuecomment-5101677065`](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5101677065)
- Approval scope: exact payloadによるDisabled ruleset作成、完全一致read-back後のActive化、post-write validation、rollback trigger時の緊急Disabled化
- UI selector代替承認: Windows ACLエラーによりGitHub UI selectorを確認できないため、今回に限り実行直前のAPI実測証跡で代替する
- Execution branch: `issue-95-master-ruleset-execute`
- Execution base: `origin/master` at `b017e2be670a467ddb7c8af5d8631076d5bbae5b`
- Execution started: `2026-07-28T17:22:36+09:00`（`2026-07-28T08:22:36Z`）
- UI unavailable reason: browser接続実行基盤がWindows ACL適用時に失敗し、GitHub Settingsのselectorを安全に取得できない
- API substitution conditions:
  - exact contextが`Recora checks`
  - sourceがGitHub Actions、integration IDが`15368`
  - 同repositoryのmaster SHAと直近PR headで過去7日以内に成功済み
  - 同名legacy commit statusが存在しない
  - GitHub Rulesets REST schemaが`context`とoptional `integration_id`を受け付ける
  - いずれかが不一致、取得不能、またはschema変更ならrepository settings write前に停止する
- Project #1: `Status: In Progress`、`Approval: Execute`へ更新し、`Risk: R3`、`Execution: Human`、`Spec level: Full`、`Priority: P1`、`Area: Development process`を再取得確認

### Rollback Human review / Plan-only investigation

- Latest OWNER decision: [Issue #95 comment `#issuecomment-5102363862`](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5102363862)
- Decision: emergency rollbackは承認済み。ruleset ID `19883059`をDisabledで保持し、再Active化は未承認
- Current approval scope: read-only GitHub API調査と、このExec Plan 1ファイルの更新だけ
- Project #1 read-back: `Status: Human review`、`Approval: Plan`、`Risk: R3`、`Execution: Human`、`Spec level: Full`、`Priority: P1`、`Area: Development process`
- Project field writes in this review: `2`（Status / Approvalのみ）。repository settings write: `0`
- Audit time: `2026-07-28T18:38:15+09:00`
- Audit branch / base: `issue-95-master-ruleset-execute` / `b017e2be670a467ddb7c8af5d8631076d5bbae5b`
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
| Historical Stage 2 Execute approval was consumed | [rollback OWNER comment](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5102363862) | Create / Active / rollbackは実施済み。現在の再Active化は未承認で、repository settings writeを停止 |
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
  - Historical Stage 2 create / activate / emergency-disable: 実施とrollbackを完了。最新OWNER commentにより再Active化は未承認で、次回は新たなR3 Execute承認が必要
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

この節は過去の[Stage 2 OWNER comment](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5101677065)で個別Execute承認され、その実行とrollbackは`Stage 2 execution record`へ記録した。現在は再Active化未承認であり、`Next activation retry contract`は次回承認のためのPlan-only契約である。

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
| M1: Project and start gate | `Completed` | Project #1分類、latest approval、branch、SHA、clean stateを確認 | In Progress / R3 / Human / Full / Execute、expected SHA、clean |
| M2: Read-only audit | `Completed` | Rulesets、classic protection、checks、merge methods、default branch、OpenAPI schemaをGET | Current stateとsource evidenceを確定、write前precondition全件一致 |
| M3: Exec Plan | `Completed` | exact payload、validation、smoke、rollbackを記録しlocal validation | planをmasterへ保存済み |
| M4: Persist reviewed plan | `Completed` | PR #96をSquash merge | planが`origin/master` `b017e2be670a467ddb7c8af5d8631076d5bbae5b`へ保存済み |
| M5: Stage 2 settings execution | `Human review` | normalization承認後にActive化し、active rules即時照合不一致で緊急Disabled rollback | Active化・rollback証跡と最終Disabled状態をHuman reviewへ提示 |
| M6: Smoke test | `Pending` | 次の実PRでmerge gateとintegration impactを確認 | CI、conversation、PR gateが期待どおり |
| M7: Complete or rollback | `Completed` | active rules検証失敗後に緊急Disabled化 | ruleset detail `disabled`、master active rules `[]`、classic未設定を再取得確認 |
| M8: Retry control-plane validation | `Completed` | Active PUT、全8 poll、detail、branch metadataを完全保存して意味比較 | GitHub settingsと適用は全件一致。後段tooling failureで安全側rollback |
| M9: Retry evidence finalization | `Human review` | Node.jsで151 hashを再検証し、failure分類と次回契約を改訂 | Exec Plan 1ファイルと検証結果をHuman reviewへ提示 |
| M10: Final activation | `Completed` | OWNER comment `5103829680`に基づきActive化、全8 poll、2段階gateを実行 | ruleset `active`、master protected、evidence完全性確認、rollback不要 |
| M11: Smoke-test Draft PR | `Human review` | Exec Plan 1ファイルだけをbranch + Draft PR経路へ送る | PRはDraft / unmerged、Issue OPEN、Human reviewへ停止 |

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
| `2026-07-28` | M4 | PR #96をSquash mergeし、planをmaster `b017e2be670a467ddb7c8af5d8631076d5bbae5b`へ保存 | Stage 2個別承認 |
| `2026-07-28` | M5 | Stage 2 OWNER承認とAPIによるUI selector代替承認を確認。ProjectをIn Progress / Executeへ更新 | 実行直前snapshot |
| `2026-07-28` | M5 | 全preconditionとOpenAPI schemaを照合後、ruleset ID `19883059`をHTTP 201でDisabled作成 | full read-back |
| `2026-07-28` | M5 | read-backに未指定`required_reviewers: []`が追加され完全一致しないため、Active PUTを実施せずDisabledで停止 | Human review |
| `2026-07-28` | M5 | OWNERが空配列normalizationだけを限定承認。再GETで他の差分なし・semantic complete matchを確認 | Active化 |
| `2026-07-28` | M5 / M7 | Active PUTはHTTP 200。直後のmaster active rules照合不一致を検出し、emergency Disabled PUTをHTTP 200で実施 | Human reviewへ停止 |
| `2026-07-28` | Plan-only follow-up | OWNERがrollbackを承認し再Active化を未承認。ProjectをHuman review / Planへ戻し、history・schema・比較処理をread-only調査 | 改訂planをHuman review |
| `2026-07-28` | M8 | Active PUT HTTP 200、全8 poll HTTP 200 / exact match、Active時master protected true。最終集約のPowerShell `List[object]` errorで安全側rollback | control-plane成功とreporting failureを分離 |
| `2026-07-28` | M9 | OWNER Plan承認を確認。Node.jsで両JSON parseと151 hashを再検証し、missing / size / hash mismatch 0 | 改訂planをHuman review |

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
| `2026-07-28` | ruleset ID `19883059`をDisabledのまま保持 | API read-backが未指定`required_reviewers: []`を追加し、exact payloadと完全一致しなかった | Active化、delete、rollback PUTを行わずHuman reviewへ停止 |
| `2026-07-28` | `required_reviewers: []`だけをserver-side normalizationとして許容 | OWNER comment `#issuecomment-5102029137`。要素数0で追加reviewer要件なし | 他の追加・欠落・値変更は引き続き不許容 |
| `2026-07-28` | Active化後に緊急Disabled rollback | ruleset detailは承認設定と一致したが、master active rules即時GETが期待4ルールとの照合に失敗 | rulesetを削除せずDisabledへ戻し、active rules空を確認して停止 |
| `2026-07-28` | 原因を未確定のまま再試行契約を強化 | 当時のactive-rules本文が未保存。PowerShell 5.1の配列ラップ再現は比較処理仮説を支持するが、実responseを復元できない | 全response保存、60秒bounded polling、type-based semantic comparisonを次回必須化 |
| `2026-07-28` | Retryのruleset設定・適用検証を成功と評価 | 全8 poll、detail、branch metadataが承認値と一致し、raw evidenceと151 hashを再検証できた | Control-planeとEvidence captureの両gate成功をsettings判定とする |
| `2026-07-28` | 後段reporting failureだけではrollbackしない | 完全証跡とhash検証後の`List[object]`集約エラーはGitHub settingsを変えない | Active維持、追加writeなし、Human reviewへ停止する契約へ改訂 |

## Stage 2 execution record

### Execution window and approval

- OWNER Execute approval: [Issue #95 comment `#issuecomment-5101677065`](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5101677065)
- Execution branch: `issue-95-master-ruleset-execute`
- `HEAD` / `origin/master`: `b017e2be670a467ddb7c8af5d8631076d5bbae5b`
- Started: `2026-07-28T17:22:36+09:00`（`2026-07-28T08:22:36Z`）
- Disabled create: `2026-07-28T17:35:30+09:00`
- Stage 2-A stop decision: `2026-07-28T17:37:00+09:00`
- Normalization review and activation approval: [Issue #95 OWNER comment `#issuecomment-5102029137`](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5102029137)
- Pre-activation semantic comparison: `2026-07-28T18:00:13+09:00`、許容した空配列normalization以外は完全一致
- Active update: ruleset history version `44645383` at `2026-07-28T18:03:48.987+09:00`
- Emergency rollback: ruleset history version `44645395` at `2026-07-28T18:03:58.389+09:00`

### Sanitized pre-execution snapshot

| Check | Result |
|---|---|
| REST API / OpenAPI | API version `2026-03-10`; OpenAPI `3.0.3`; official description SHA `e15e4401c5dfb6001130462c87929fb43ec753ca` |
| Required-check schema | `context` is required string; `integration_id` is optional integer |
| Repository | public, archived `false`, authenticated `admin=true` |
| Default branch / SHA | `master` / `b017e2be670a467ddb7c8af5d8631076d5bbae5b` |
| Merge methods | merge / squash / rebase enabled; auto merge / update branch / delete branch disabled |
| Rulesets / active rules | `0` / `0` |
| Classic protection / protected | HTTP 404 not configured / `false` |
| Master check | check ID `90215681592`, `Recora checks`, GitHub Actions, integration ID `15368`, `completed/success`, completed `2026-07-28T08:04:34Z` |
| Recent PR check | PR #96 head `28060446a46c5e54089bbdee83d03273a99a3d60`, check ID `90213323411`, same context/source/integration, `completed/success`, completed `2026-07-28T07:53:08Z` |
| Same-name legacy status | master `0`; PR head `0` |
| Payload dry-run | parsed and all exact values matched; SHA-256 `0da1959df030c02e593a642084414da1d46f788705d31fcf72c2b009e05d548a` |
| Repo scope | Exec Plan 1ファイルだけがmodified、untracked `0`、staged `0`、`git diff --check`成功 |

UI selectorはWindows ACLエラーで取得できず、OWNER承認に基づき上記API実測へ代替した。全preconditionは`2026-07-28T17:34:30+09:00`に機械検証で一致した。

### Settings writes

| Sequence | Operation | HTTP result | Outcome |
|---|---|---|---|
| Project 1 | Issue #95 Statusを`In Progress`へ更新 | success | read-back一致 |
| Project 2 | Issue #95 Approvalを`Execute`へ更新 | success | read-back一致 |
| Project 3 | Issue #95 Statusを`Human review`へ更新 | success | Plan-only read-back一致 |
| Project 4 | Issue #95 Approvalを`Plan`へ更新 | success | Plan-only read-back一致 |
| Repository settings 1 | `POST /repos/sushikikun/RECORA/rulesets` with exact payload | HTTP 201 Created | ruleset ID `19883059`、`disabled` |
| Repository settings 2 | `PUT .../rulesets/19883059` with `enforcement: active` | HTTP 200 OK | 一時的に`active`、history version `44645383` |
| Repository settings 3 / emergency rollback | `PUT .../rulesets/19883059` with `enforcement: disabled` | HTTP 200 OK | 最終`disabled`、history version `44645395` |
| Repository settings 4 / retry activation | `PUT .../rulesets/19883059` with `enforcement: active` | HTTP 200 OK | 全8 poll exact match、history version `44652111` |
| Repository settings 5 / retry rollback | `PUT .../rulesets/19883059` with `enforcement: disabled` | HTTP 200 OK | 後段tooling failureで安全側rollback、history version `44652249` |
| Repository settings 6 / final activation | `PUT .../rulesets/19883059` with `enforcement: active` | HTTP 200 OK | 全8 pollと両gate成功、history version `44660497`、Active維持 |
| Delete | ruleset delete | prohibited / not executed | Disabledのまま保持 |

Repository settings write countは累計`6`（Disabled create、最初のActive update / rollback、retry Active update / rollback、最終Active update）で、最終Active化では承認済みPUT `1`件だけを実行した。Rollbackとruleset deleteは実施していない。token、credential、secret、private値はpayload、出力、planへ保存していない。

### Disabled read-back comparison

- Matched: name `master-pr-ci-protection`
- Matched: source type `Repository` / source `sushikikun/RECORA`
- Matched: target `branch`、enforcement `disabled`、bypass actors `[]`
- Matched: include `refs/heads/master`のみ、exclude `[]`
- Matched: rule types `deletion`、`non_fast_forward`、`pull_request`、`required_status_checks`
- Matched: approvals `0`、conversation resolution `true`、merge / squash / rebase、その他指定boolean
- Matched: `Recora checks` / integration ID `15368` / strict `true` / do-not-enforce-on-create `false`
- Mismatch: API response added `pull_request.parameters.required_reviewers: []`; this property is absent from the approved exact payload
- Complete match: `false`

値の変更、追加rule、bypass、source mismatchはなかったが、pull request parametersのキー集合が完全一致しない。承認契約に従いActive化しなかった。

### Stage 2-A normalization review and activation approval

- Stage 2-A stop result: ruleset ID `19883059` was created Disabled by `POST /repos/sushikikun/RECORA/rulesets`, HTTP 201 Created. Raw exact comparison stopped because the server added `pull_request.parameters.required_reviewers: []`.
- Human normalization review and activation approval: [Issue #95 OWNER comment `#issuecomment-5102029137`](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5102029137)
- Server-side normalization: the approved payload omitted `required_reviewers`; GitHub read-back supplied an empty array with element count `0`. No file-pattern reviewer, team reviewer, or other reviewer requirement was added.
- Limited comparison rule: only a missing `pull_request.parameters.required_reviewers` property in the approved payload and an actual `required_reviewers: []` are treated as semantically equivalent for ruleset ID `19883059` in this activation review.
- Normalization precondition: the read-back property must be an array with exactly `0` elements. Any element, non-array value, or other representation is not equivalent.
- No other normalization is allowed. Any other added or missing property, rule, actor, branch target, reviewer, or changed value is a mismatch and blocks activation or triggers emergency Disabled rollback.
- After applying only this normalization, the Stage 2-A Disabled read-back is considered a complete semantic match and Active化 may proceed under the OWNER approval.

### Activation and emergency rollback

- Active PUT: `PUT /repos/sushikikun/RECORA/rulesets/19883059` with body `{"enforcement":"active"}`、HTTP 200 OK
- Active history evidence: version `44645383`、`2026-07-28T18:03:48.987+09:00`
- Active ruleset detail / history state matched all approved settings:
  - name `master-pr-ci-protection`、source `Repository sushikikun/RECORA`、target `branch`、enforcement `active`
  - include `refs/heads/master` only、exclude `[]`、bypass actors `[]`
  - rules `deletion`、`non_fast_forward`、`pull_request`、`required_status_checks`
  - approvals `0`、conversation resolution `true`、required reviewers `[]`
  - allowed merge methods `merge` / `squash` / `rebase`
  - required check `Recora checks`、integration ID `15368`、strict `true`
- Active rulesets listはID `19883059`を`active`として返し、master branch metadataは`protected: true`、SHA不変、classic protectionはHTTP 404、default branch / merge methodsも不変だった。
- Rollback trigger: `GET /repos/sushikikun/RECORA/rules/branches/master`自体は成功したが、即時responseが期待する4 rule typesとの完全照合に失敗した。承認条件に従い、他の不一致を待たず緊急rollbackを実施した。
- Emergency rollback PUT: same ruleset with body `{"enforcement":"disabled"}`、HTTP 200 OK
- Rollback history evidence: version `44645395`、`2026-07-28T18:03:58.389+09:00`
- Ruleset delete、classic protection変更、default branch変更、merge method変更は実施していない。

### Final post-rollback validation

- Repository rulesets: `1`（ID `19883059`、`disabled`）
- Ruleset detail: target `refs/heads/master`のみ、bypass `0`、承認済み4 rules、`required_reviewers: []`、`Recora checks` / integration ID `15368` / strict `true`
- `GET /repos/sushikikun/RECORA/rules/branches/master`: `[]`、取得成功
- `master` protected: `false`、SHA `b017e2be670a467ddb7c8af5d8631076d5bbae5b`
- Classic branch protection: HTTP 404、未設定
- Default branch: `master`、変更なし
- Merge methods: merge / squash / rebase enabled、変更なし
- Repository contents: remote master変更なし。local差分はこのExec Plan 1ファイルだけ
- Rollback executed: `true`。再度のemergency Disabled PUTは実行可能だが、最終状態が既にDisabledのため不要。deleteは行わない

### Plan-only read-only findings

| Check | Result |
|---|---|
| Ruleset detail | HTTP 200、ID `19883059`、`master-pr-ci-protection`、`disabled`、source `Repository sushikikun/RECORA`、target `refs/heads/master`のみ、bypass 0、承認済み4 rules |
| Repository rulesets | HTTP 200、1件のみ。ID `19883059`、`disabled` |
| Master active rules | HTTP 200、完全なsanitized responseは`[]` |
| Master branch metadata | HTTP 200、`protected: false`、SHA `b017e2be670a467ddb7c8af5d8631076d5bbae5b` |
| Classic protection | HTTP 404、未設定 |
| Repository settings | default branch `master`、merge / squash / rebaseすべて有効 |
| Ruleset history | HTTP 200。Disabled create version `44642418`、Active version `44645383`、rollback version `44645395` |
| Active version | HTTP 200、`2026-07-28T18:03:48.987+09:00`、enforcement `active`、承認設定と一致 |
| Rollback version | HTTP 200、`2026-07-28T18:03:58.389+09:00`、enforcement `disabled`、同じrule設定 |
| Rule suites for master | HTTP 200、現在`[]`。過去Active時のbranch-rules本文は復元できない |

GitHub公式の`Get rules for a branch`はHTTP 200でJSON arrayを返し、各active rule objectは少なくとも`type`、`ruleset_source_type`、`ruleset_source`、`ruleset_id`を持ち、ruleに応じて`parameters`を持つ。repositoryまたはorganizationなど複数level由来のactive rulesが同じ配列へ現れ得る。`disabled`または`evaluate` enforcementのrulesは返らない。公式exampleは配列順を契約としていないため、文字列一致や配列順一致をvalidation条件にしない。

### Cause investigation

原因は未確定である。当時のActive ruleset detail、rulesets一覧、master metadata `protected: true`は期待どおりだったが、master active rulesの完全なresponse本文を保持していないため、次を区別できない。

- GitHub APIのeventual consistencyにより、Active化直後のbranch-rules endpointがまだ期待状態へ収束していなかった
- response shapeまたは配列順、PowerShell配列ラップを含む比較方法が誤判定した
- 実際に1件以上のruleが欠落していた

比較方法仮説については、実行環境のWindows PowerShell `5.1.22621.6133`で、4要素JSON arrayを`@($json | ConvertFrom-Json)`へ渡すとouter countが`1`、first object typeが`System.Object[]`になる一方、projected `type`は4件になることを固定sampleで再現した。前回validatorの`$postActive.Count -ne 4`を単独でtrueにし得るため誤判定と整合するが、当時のraw responseがない以上、これを確定原因とはしない。

## Retry evidence finalization record

### Plan-only approval and scope

- OWNER Plan approval: [Issue #95 comment `#issuecomment-5103034116`](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5103034116)
- Approval scope: local retry evidenceのread-only確認、SHA-256再検証、このExec Plan 1ファイルの更新
- Execution branch: `issue-95-ruleset-finalization-plan`
- Execution base: `origin/master` at `1fef10b3961c34969523210bf0db8a6696025126`
- Project start state: `Ready / Plan / R3 / Human / Full / P1 / Development process`
- Project final state after validation: `Human review / Plan / R3 / Human / Full / P1 / Development process`
- Project field writes in this Plan-only task: Statusを`Ready`へ設定し、完了時に`Human review`へ戻した。repository settings writeは`0`。
- Repository settings write in this Plan-only update: `0`
- Prohibited in this update: ruleset Active化・更新・削除、classic protection変更、repository settings変更、commit、push、PR、merge、deploy、production操作

### Retry execution result

- Ruleset ID: `19883059`
- Active PUT: HTTP `200`
- Active history version: `44652111` at `2026-07-28T19:19:54.617+09:00`
- Ruleset source: `Repository` / `sushikikun/RECORA`
- Target: include `refs/heads/master`のみ、exclude `[]`
- Bypass actors: `0`
- Active時のmaster protected: `true`
- Required check: `Recora checks` / integration ID `15368`
- Strict required status checks: `true`
- Required approvals: `0`
- Server-side normalization: `required_reviewers: []`

| Requested offset | Response timestamp | Observed elapsed | HTTP | Semantic result |
|---:|---|---:|---:|---|
| `0s` | `2026-07-28T19:19:56.1342049+09:00` | `1.219s` | `200` | exact match |
| `2s` | `2026-07-28T19:19:58.3128996+09:00` | `3.036s` | `200` | exact match |
| `5s` | `2026-07-28T19:20:00.9085955+09:00` | `5.637s` | `200` | exact match |
| `10s` | `2026-07-28T19:20:06.0670882+09:00` | `10.792s` | `200` | exact match |
| `20s` | `2026-07-28T19:20:16.4678647+09:00` | `21.191s` | `200` | exact match |
| `30s` | `2026-07-28T19:20:25.9575720+09:00` | `30.682s` | `200` | exact match |
| `45s` | `2026-07-28T19:20:40.9437810+09:00` | `45.669s` | `200` | exact match |
| `60s` | `2026-07-28T19:20:55.9857216+09:00` | `60.718s` | `200` | exact match |

全8 responseで、ruleset ID `19883059`、source type `Repository`、source `sushikikun/RECORA`と、次の4 ruleが各1件、未承認ruleなしで一致した。

- `deletion`
- `non_fast_forward`
- `pull_request`
- `required_status_checks`

`pull_request` parametersはapprovals `0`、conversation resolution `true`、merge / squash / rebase、`required_reviewers: []`を含む承認値と一致した。`required_status_checks` parametersは`Recora checks`、integration ID `15368`、strict `true`、do-not-enforce-on-create `false`と一致した。Active ruleset detail、rulesets一覧、master branch metadata、classic protection、default branch、merge methodsも期待値と一致し、GitHub control-planeの不一致または取得不能はなかった。したがって、rulesetの設定・適用検証は成功と評価する。

### Rollback result

- 全8 pollとActive時の最終read-back完了後、Human向け最終証跡を集約するPowerShell 5.1処理で`System.Collections.Generic.List[object]`の変換エラー`Argument types do not match`が発生した。
- エラーはGitHub設定、active rules、source、target、parametersの不一致ではなく、raw evidence保存後のローカルreporting / aggregation tooling failureである。
- 当時の契約が後段tooling failureを独立分類していなかったため、安全側判断でDisabled rollbackを実行した。
- Disabled PUT: HTTP `200`
- Rollback history version: `44652249` at `2026-07-28T19:20:59.506+09:00`
- Final enforcement: `disabled`
- Final master active rules: `[]`
- Final master protected: `false`
- Classic branch protection: HTTP `404`、未設定
- Default branch: `master`
- Merge / squash / rebase: enabled、変更なし
- Repository settings write: retryで`2`件、累計`5`件
- Ruleset delete: 未実施

### Current read-only state after retry rollback

Read-only recheck: `2026-07-28T19:42:33.2495299+09:00`。

- Ruleset ID `19883059`: `disabled`
- Master active rules: `[]`
- Master protected: `false`
- Classic branch protection: HTTP `404`、未設定
- Default branch: `master`
- Merge / squash / rebase: すべてenabled
- Master SHA: `1fef10b3961c34969523210bf0db8a6696025126`
- Repository settings write in this Plan-only update: `0`

### Evidence manifest

- Evidence directory: `C:/tmp/recora-issue95-ruleset-retry-20260728T191542992+0900`
- `result.json`: `58,989` bytes、SHA-256 `516eecb9ba932653b5c4c3426ec78d83fbbfb7fe11b95192d29b6afcefc4dbcc`
- `evidence-sha256.json`: `27,566` bytes、SHA-256 `c8f78487b4fe5795acf09a6ea8078e4ed9af1945614a45d9316ec439ecdee980`
- Hash inventory entries: `151`
- Hash re-verification: `2026-07-28T19:42:11.195+09:00`
- Method: Node.js `v24.18.0`で両JSONをparseし、`fs.readFileSync`で各ファイルのraw bytesを読み、`crypto.createHash("sha256")`で全151 entryのsizeとSHA-256を再計算
- Result: 両JSON parse成功、missing `0`、size mismatch `0`、hash mismatch `0`、Issue指定の必須evidence全項目が存在

Raw evidenceはローカル監査証跡であり、repositoryの正本ではない。repositoryへコピーせず、Issue #95が完了するまで変更、移動、削除しない。

### Failure classification

1. **Control-plane failure**
   - GitHub ruleset detail、active rules、source、target、parametersの不一致
   - 必須ruleの欠落・重複、未承認ruleの追加、bypass actor追加
   - GitHub API responseの取得不能または非200
2. **Evidence capture failure**
   - sanitized raw responseを保存できない、または保存済みresponseを読めない
   - 必須poll、ruleset detail、branch metadata、PUT responseの証跡欠落
   - SHA-256 inventoryを生成または再検証できない
   - 保存ファイルのsizeまたはSHA-256不一致
3. **Reporting / aggregation failure**
   - 完全なraw evidenceと検証済みhash inventoryの保存後に発生する要約、表、Human向け最終JSONの生成失敗
   - PowerShellの配列wrapper、`List[object]`変換、表示処理のエラー

Control-plane failureとEvidence capture failureはsettingsの安全性または監査可能性を損なう。Reporting / aggregation failureは、前二つのgateが完了した後の非破壊工程として扱い、それ単独ではGitHub settingsの成功判定を覆さない。

## Next activation retry contract

この契約はIssue #95 OWNER comment ID `5103829680`でR3 Execute承認され、最終Active化に使用した。実行結果は`Final activation execution record`へ記録する。

### Active化後の証跡保存

Active PUT後、secretやcredentialを除外したうえで、次を実行単位ごとに完全保存する。

- PUTのHTTP statusとsanitized response本文
- ruleset detail GETのHTTP statusと完全なsanitized response本文
- master branch metadata GETのHTTP statusと完全なsanitized response本文
- master active rules GETのHTTP statusと完全なsanitized response本文

active-rules responseは要約だけで済ませない。各pollの比較入力となった本文全体を保存し、parse前の本文とparse後のnormalized representationを対応付ける。responseを保存できない場合は成功扱いせずrollbackする。

各raw responseを保存した直後にSHA-256を生成し、ファイル名、size、hashをinventoryへ追加する。60秒pollと最終read-back後にinventoryを別processで再検証し、control-plane gateとevidence capture gateの両方を確定してからreporting工程へ進む。

### Bounded polling

Active PUT直後の1回だけで判定せず、PUT成功を`0秒`として次のoffsetで`GET /repos/sushikikun/RECORA/rules/branches/master?per_page=100`を取得する。

| Offset | Required evidence |
|---:|---|
| 0秒 | 取得時刻、HTTP status、完全なsanitized response、normalized result |
| 2秒 | 同上 |
| 5秒 | 同上 |
| 10秒 | 同上 |
| 20秒 | 同上 |
| 30秒 | 同上 |
| 45秒 | 同上 |
| 60秒 | 同上 |

各responseのruleごとに`ruleset_id`、`ruleset_source_type`、`ruleset_source`、`type`、完全な`parameters`を記録する。期待状態へ収束した時点でも残りpollを省略した理由と最終確認時刻を記録し、少なくとも収束を確認したresponse本文を保持する。60秒時点で期待状態へ収束しなければrollbackする。

### Semantic normalization and comparison

JSON全体の文字列一致、object property順、配列順、PowerShell wrapperのouter countを比較条件にしない。parse後にarrayを明示的にflattenし、次の意味比較を行う。

1. `ruleset_id == 19883059`かつ`ruleset_source_type == Repository`、`ruleset_source == sushikikun/RECORA`のruleだけを対象rulesetとして抽出する。
2. 対象rulesetのrulesを`type`でsortし、`deletion`、`non_fast_forward`、`pull_request`、`required_status_checks`が各1件、合計4件存在することを確認する。
3. 対象ruleset由来の未承認typeが0件であることを確認する。
4. `pull_request.parameters`を承認値と比較する。
   - `required_approving_review_count: 0`
   - `dismiss_stale_reviews_on_push: false`
   - `require_code_owner_review: false`
   - `require_last_push_approval: false`
   - `required_review_thread_resolution: true`
   - `allowed_merge_methods`: merge / squash / rebaseを順不同で完全一致
   - `required_reviewers: []`は既承認のserver-side normalizationとしてのみ許容し、要素追加は不一致
5. `required_status_checks.parameters`を承認値と比較する。
   - `strict_required_status_checks_policy: true`
   - `do_not_enforce_on_create: false`
   - required checksは`context: Recora checks` / `integration_id: 15368`の1件のみ
6. response内に別ruleset ID、別source、organization rulesetまたはclassic protection由来と疑われるruleがあれば、既存設定との競合として停止する。
7. ruleset detailのconditionがinclude `refs/heads/master`のみ、exclude `[]`であり、master以外へ適用されていないことを別GETで確認する。
8. ruleset detail、branch metadata、branch-rules responseの3者が整合した場合だけ収束成功とする。

### Two-stage activation gate

1. **Control-plane gate**
   - ruleset detail、branch metadata、全8 active-rules responseが承認値と意味的一致
   - ruleset ID、source、target、4 rule types、全parameters、bypassが一致
   - API取得不能、必須rule欠落、未承認rule追加がない
2. **Evidence capture gate**
   - Active PUT、ruleset detail、branch metadata、全8 pollのsanitized raw responseを完全保存
   - 各raw responseのSHA-256 inventoryを生成
   - inventory全entryを実ファイルから再計算し、missing、size mismatch、hash mismatchが0

両gateが成功した場合はActive状態を維持する。その後の要約、表、Human向けreporting JSON生成はsettings判定後の非破壊工程として扱う。

### Revised rollback conditions and evidence

次のいずれかでruleset ID `19883059`を直ちにDisabledへ戻す。

- Control-plane gate failure
- Evidence capture gate failure
- 60秒以内に承認済み4ルールを確認できない
- PUTまたはGETのHTTP status / sanitized response本文を保存・読取できない
- active rules取得不能または非200
- ruleset ID、source type、sourceが不一致
- 必須rule欠落または重複
- 未承認rule追加
- pull requestまたはrequired status check parameters不一致
- bypass actor追加
- `master`以外へ適用
- default branchまたはmerge methods変化
- ruleset detail、branch metadata、branch-rules responseが矛盾
- raw evidenceまたはSHA-256 inventoryを生成・再検証できない
- 保存ファイルのmissing、size mismatch、hash mismatch

次をすべて満たした後のReporting / aggregation failureだけではrollbackしない。

- 全8 pollの意味的一致が完了
- ruleset detailとbranch metadataが期待値
- sanitized raw responseが完全保存済み
- SHA-256 inventoryが生成・再検証済み
- control-plane gateとevidence capture gateがともに成功

後段のreporting / aggregation failureだけの場合は、rulesetをActiveのまま維持し、追加settings writeを行わない。証跡directory、主要ファイルのsize / hash、失敗した非破壊工程を記録し、Projectを`Human review / Execute`へ戻し、Issue #95をOPENのままHuman reviewで停止する。

Rollback後は次のHTTP statusと完全なsanitized responseを必ず保存し、rulesetを削除しない。

- Disabled PUT response
- ruleset detailが`disabled`
- master active rulesが`[]`
- master branch metadataが`protected: false`
- classic protectionがHTTP 404 / 未設定
- default branch `master`、merge / squash / rebase有効、master SHA不変

### Next real-PR smoke test

両activation gate成功後も、Issue #95は次の実PRによるsmoke test完了までOPENを維持する。実PRで`Recora checks`のrequired表示、GitHub Actions source、strict / up-to-date、conversation resolution、PR必須、通常feature branch pushとActions起動を確認し、merge自体は別のR3承認まで実行しない。

## Final activation execution record

Issue #95の[OWNER comment ID `5103829680`](https://github.com/sushikikun/RECORA/issues/95#issuecomment-5103829680)に基づき、`origin/master` `392bcc482a55a88038870302f4c2a73c8f66de87`から実行した。設定書き込み前にProjectを`In progress / Execute`へ変更し、ruleset、active rules、branch metadata、classic protection、repository metadata、check runs、commit statuses、Issue / approvalをsanitized raw responseとして保存した。実行時のpreconditionはruleset `disabled`、master active rules `[]`、master `protected: false`、classic protection HTTP 404、default branch `master`、merge / squash / rebase有効、required check `Recora checks` / GitHub Actions integration ID `15368`で、すべて一致した。

### Activation and bounded polling

- Active PUT: HTTP `200`, `2026-07-28T12:06:05.367Z`
- Active version: `44660497`
- Settings write: この実行ではActive PUT `1`件、累計`6`件
- Ruleset ID / name: `19883059` / `master-pr-ci-protection`
- Rollback: 未実施。Control-plane gateとEvidence capture gateがともに成功したため`active`を維持

| Planned offset | Observed offset (seconds) | HTTP | Semantic comparison |
| --- | ---: | ---: | --- |
| `0s` | `0.577` | `200` | match |
| `2s` | `2.498` | `200` | match |
| `5s` | `5.604` | `200` | match |
| `10s` | `10.774` | `200` | match |
| `20s` | `20.493` | `200` | match |
| `30s` | `30.558` | `200` | match |
| `45s` | `45.528` | `200` | match |
| `60s` | `60.550` | `200` | match |

全8 pollで、JSON文字列や配列順ではなく、ruleset ID、source、target、rule type、parametersをNode.jsで正規化して比較した。各responseはruleset ID `19883059`、source `sushikikun/RECORA`、target `refs/heads/master`だけ、type `deletion` / `non_fast_forward` / `pull_request` / `required_status_checks`の4件だけを含み、未承認rule、別ruleset、classic protection由来ruleはなかった。

### Active read-back and control-plane gate

- Enforcement: `active`
- Target: branch / `refs/heads/master`のみ
- Bypass actors: `0`
- Pull Request: required、approvals `0`、conversation resolution `true`、required reviewers `[]`、allowed merge methods `merge` / `squash` / `rebase`
- Required status check: context `Recora checks`、integration ID `15368`、strict required status checks `true`
- Force push: `non_fast_forward` ruleにより禁止
- Deletion: `deletion` ruleにより禁止
- Master active rules: 上記4 ruleを意味的一致で確認
- Master branch metadata: `protected: true`
- Classic branch protection: HTTP `404` / 未設定
- Default branch: `master`のまま
- Repository merge methods: merge / squash / rebaseはすべて有効のまま
- Master SHA: `392bcc482a55a88038870302f4c2a73c8f66de87`のまま

Ruleset detail、branch metadata、全8回のmaster active rules本文を完全なsanitized raw responseとして保存し、Control-plane gateは成功した。対象外branchへの適用、bypass actor、未承認rule、parameter不一致、取得不能、default branch / merge method変化はなかった。

### Evidence capture gate

Evidence directoryはrepo外の`C:/tmp/recora-issue95-final-activation-20260728T120359044Z`で、credential、token、cookie、private値を含めていない。Active PUT response、ruleset detail、branch metadata、全8 poll、最終snapshot、比較結果を保存し、SHA-256 inventory `30`件を生成した。

| Artifact | Size (bytes) | SHA-256 |
| --- | ---: | --- |
| `result.json` | `2030` | `c67cbf26d03d5bcf841d0685aebce2c1f60fa9b4e9952102ed756250762dd2c1` |
| `evidence-sha256.json` | `5136` | `88f005cfe36f7f3e0c5daa84e348d495c324f6e28b6d7a9d05aa3e8fbc7625b9` |

別Node.js processで`2026-07-28T12:07:30.891Z`にinventoryを再検証し、entry `30`、missing `0`、size mismatch `0`、hash mismatch `0`、JSON parse error `0`だった。Control-plane gateとEvidence capture gateはともに成功し、後段reporting / aggregation failureは発生していない。契約どおりrollbackせずActive状態を維持した。

### Smoke-test handoff

最終証跡は`issue-95-ruleset-active-smoke`でこのExec Plan 1ファイルだけに記録し、Draft PRで通常のfeature branch / PR / Actions経路を確認する。Draft PRでは`Recora checks`のrequired表示、GitHub Actions source、strict / up-to-date、conversation resolution、PR必須、Vercel Git連携の初期状態をHuman reviewする。PRのmerge、Issue #95 close、追加ruleset更新、明示的deploy、production操作は別承認まで実行しない。
### Not executed and remaining risk

- 最終状態はActiveであり、smoke-test Draft PR上のrequired check、strict / up-to-date、conversation / PR gateの実表示とCI初期状態をHuman reviewで確認する
- 過去の最初のActive化直後responseだけは未保存だが、最終Active化の全raw responseと30件のinventoryは完全保存・独立再検証済み
- GitHub UI selectorはWindows ACL問題で未確認。API control-plane evidenceとsmoke-test PRの実表示を正式証跡とする
- Smoke-test PRのmerge、Issue #95 close、追加settings変更、明示的deploy、production操作は未承認
- lint / buildは製品コード・workflow変更がなくMarkdown 1ファイルだけのため未実施

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
- GitHub repository settings write countは累計`6`: Disabled create、最初のActive / rollback、retry Active / rollback、最終Active。最終実行のwriteは承認済みActive PUT `1`件で、両gate成功によりrollbackせず最終enforcementは`active`。

### Validation results

- Stage 1 local validation passed. 初回はPowerShell PATHに`npm`がなく起動できず、既存fnmのNode `v24.18.0` / npm `11.16.0`を当該検証プロセスのPATHへ追加して再実行した。repository、package、lockfileへの変更はない。
- `recora:preflight:full`と`recora:commit-check`のWARNは、plan 1ファイルがuntracked、`.env.local`がない、既存migration命名形式、既存mock/static data参照であり、FAILは0だった。
- `git diff --name-only`はuntracked fileを列挙しないため空だった。`git status --short --untracked-files=all`と`git ls-files --others --exclude-standard`で許可されたplan 1ファイルだけを確認した。
- Stage 2-Aのraw exact matchは`required_reviewers: []`により停止したが、OWNER承認の限定normalization適用後は他の差分なしでsemantic complete matchとなった。Active PUTはHTTP 200、ruleset detailは全承認設定と一致した。master active rules即時照合だけが失敗し、緊急Disabled rollbackをHTTP 200で完了した。
- Post-rollback local validation passed with existing fnm Node `v24.18.0` / npm `11.16.0`: `npm run recora:preflight:full`、`git diff --check`、`npm run recora:commit-check`、`git diff --name-only`、`git status --short --untracked-files=all`。変更はこのExec Plan 1ファイルだけ、staged 0、package / lockfile変更なし。
- Plan-only investigation local validation passed with Node `v24.18.0` / npm `11.16.0`: `npm run recora:preflight:full`、`git diff --check`、`npm run recora:commit-check`、`git diff --name-only`、`git status --short --untracked-files=all`。変更はExec Plan 1ファイルのみ、staged 0。lint / buildはMarkdownだけのため未実施。
- Retry evidence finalization validation passed with Node `v24.18.0` / npm `11.16.0`: 両evidence JSON parse成功、151 hash再検証一致、`npm run recora:preflight:full`、`git diff --check`、`npm run recora:commit-check`、`git diff --name-only`、`git status --short --untracked-files=all`が成功。変更はExec Plan 1ファイルのみ、staged 0。lint / buildはMarkdown 1ファイルのみのため未実施。
- Final activation local validation passed with Node `v24.18.0` / npm `11.16.0`: `npm run recora:preflight:full`、`git diff --check`、`npm run recora:commit-check`、`git diff --name-only`、`git status --short --untracked-files=all`が成功。変更はExec Plan 1ファイルのみ、staged 0、package / lockfile変更なし。lint / buildはMarkdown 1ファイルのみでruntime、workflow、deploymentへ影響しないため未実施。

### Deviations from plan

- GitHub REST 2026-03-10のread-backがapproved payloadにない`required_reviewers: []`を追加したため一度停止し、その後OWNER承認でこの空配列だけをnormalizationとして許容した。Active化後、master active rules即時responseが期待4ルールとの照合に失敗したため、rollback contractどおりDisabledへ戻した。
- Retryでは全8 pollとActive時read-backが成功した後、PowerShell 5.1のHuman向け最終集約で`Argument types do not match`が発生した。当時の契約に従い安全側rollbackしたが、再検証したraw evidenceはcontrol-plane成功を示すため、後段reporting failureを独立分類して次回rollback条件から除外した。

### Remaining risks

- GitHub UI selectorはWindows ACLエラーで未確認。OWNER承認により今回のpreconditionはAPI evidenceで代替済みだが、UI追加確認は残る。
- Collaborator availabilityは未確認であり、approvals 0を前提とする。
- Strict modeの実際の更新頻度とChatGPT / Codex連携への影響は次の実PRまで未確認。
- 最終Active化では全8 pollと両gateが成功しrulesetをActiveで維持した。Active状態の実PR smoke test、strict modeの更新loop、conversation / PR gate、通常ChatGPT / Codex branch経路への影響はDraft PR上のHuman reviewまで未確認。
- GitHub API schemaはrequired check契約を維持し、responseへ`required_reviewers: []`を追加した。この空配列だけはOWNER承認に基づきsemantic matchとして扱い、他のnormalizationは行っていない。

### Completion record

- Final status: `Active`
- Completed or closed at: not completed
- Follow-up: smoke-test Draft PRでrequired check、strict / up-to-date、conversation / PR gate、通常branch経路をHuman reviewする。PR mergeとIssue #95 closeには別承認が必要
- Archive path after completion: `docs/exec-plans/completed/issue-95-master-ruleset.md`
