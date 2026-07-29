# Exec Plan: <title>

このファイルは実行中に更新するliving documentである。将来形の計画だけを残さず、進捗、判断、検証、逸脱を随時反映し、完了・中止・置換時に実績と残存リスクへ書き換える。

## Metadata

| Field | Value |
|---|---|
| Issue | `#<number>` — `<Issue URL>` |
| Risk | `R0 / R1 / R2 / R3` |
| Spec level | `None / Light / Full` |
| Execution | `Cloud Codex / Local Codex / Human` |
| Approval | `<Issue上の正式な承認記録>` |
| Owner | `<name or GitHub handle>` |
| Status | `Draft / Active / Blocked / Completed / Cancelled / Superseded` |
| Updated | `YYYY-MM-DD` |

Exec Planの記載は承認を付与しない。承認状態と承認境界はリンク先Issueの正式記録を正本とする。

## Objective / expected outcome

<完了時に実現する状態と、利用者または運用上の期待結果を記載する。>

## Context and constraints

<背景、現在状態、参照する正本文書、既存実装、期限、互換性、承認境界などを記載する。>

## Scope / non-goals

### In scope

- <変更対象>

### Non-goals

- <今回変更しない対象>

## Assumptions and dependencies

| Item | State / evidence | Impact if false |
|---|---|---|
| <assumption or dependency> | <confirmed / unconfirmed / link> | <停止、再計画、範囲変更など> |

## Risk and safety boundaries

- Highest Risk: `<R0 / R1 / R2 / R3>`
- Allowed changes: <Issueで許可された対象>
- Prohibited changes: <Issueで禁止された対象>
- Required approvals: <Plan / Execute / Production / Git操作ごとの承認>
- Stop conditions: <推測で進めず停止する条件>
- Secret and data handling: <表示・保存・外部送信を禁止する情報>

## Plan with milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: <name> | `Pending` | <実行内容> | <検証可能な完了条件> |
| M2: <name> | `Pending` | <実行内容> | <検証可能な完了条件> |

milestoneの状態は`Pending / In progress / Blocked / Completed / Cancelled`から選び、状態変更時にProgress logも更新する。

## Validation plan

| Validation | When | Expected result | Actual result / evidence |
|---|---|---|---|
| `<command or review>` | <milestone or completion> | <合格条件> | <未実施なら未実施と理由を記録> |

## Rollback / recovery

- Trigger: <rollbackまたはrecoveryを開始する条件>
- Preconditions: <実行前に必要な確認・承認>
- Steps: <安全な順序で記載>
- Preserved evidence/data: <保持するログ、履歴、成果物>
- Recovery verification: <復旧を確認する方法>
- Escalation: <rollback不能時の停止先と必要判断>

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| `YYYY-MM-DD` | <M1> | <実施内容、結果、blocker> | <次の行動> |

## Decision log

| Date | Decision | Rationale / evidence | Impact |
|---|---|---|---|
| `YYYY-MM-DD` | <決定内容> | <選択理由、代替案、根拠> | <scope、risk、plan、validationへの影響> |

## Results and remaining risks

### Results

- <実現した結果>

### Validation results

- <実行した検証と結果>
- <実行しなかった検証と理由>

### Deviations from plan

- <計画との差、理由、影響。なければ「なし」>

### Remaining risks

- <残存リスク、owner、follow-up Issue、期限。なければ「既知の残存リスクなし」>

### Completion record

- Final status: `<Completed / Cancelled / Superseded>`
- Completed or closed at: `YYYY-MM-DD`
- Follow-up: `<Issue or plan link / none>`
- Archive path: `docs/exec-plans/completed/issue-<number>-<slug>.md`
