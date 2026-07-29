# Recora Exec Plan Operations

Exec Planは、複数段階または高Riskの変更について、実行手順、進捗、判断、検証、rollbackをリポジトリ内で追跡するliving documentである。

GitHub Issueを置き換えない。Issue / Projectはタスク契約、状態、Risk、Execution、Spec level、Approval、依存関係、PRの正本とし、Exec PlanはIssueへリンクして使う。承認はIssue本文またはOWNERによるIssueコメントへ記録し、Exec Planの作成や更新を承認の代わりにしない。

開発ライフサイクルと承認ゲートは[`docs/recora-agentic-sdlc.md`](../recora-agentic-sdlc.md)を正本とする。

## 適用基準

| Spec level | Exec Planの扱い |
|---|---|
| `None` | 独立したExec Planを作らない。目的、範囲、受け入れ条件、検証、停止条件はIssueへ記録する |
| `Light` | 原則としてIssue本文で足りる。複数段階、長期作業、引継ぎ、またはrollbackの記録が必要な場合はExec Planを追加できる |
| `Full` | 原則としてExec Planを必須とする。Issueからactive planへリンクし、実装前から完了時の実績反映まで更新する |

Spec levelにかかわらず、次の変更はExec Planの対象とする。

- R2またはR3
- 移行または段階的な切替
- 複数システムにまたがる変更
- 重要なデータ契約、公開契約、権限境界の変更
- rollbackまたはrecovery手順を事前に定義する必要がある変更

対象か判断できない場合は、Issueで適用有無を決定する。必要なExec Planがないまま`Ready`または実装へ進めない。

## ディレクトリと命名

- テンプレート: [`templates/exec-plan-template.md`](./templates/exec-plan-template.md)
- 進行中: [`active/`](./active/README.md)
- 完了・中止・置換済み: [`completed/`](./completed/README.md)

ファイル名は次の形式にする。

```text
docs/exec-plans/active/issue-<番号>-<slug>.md
docs/exec-plans/completed/issue-<番号>-<slug>.md
```

`<slug>`は短いkebab-caseとし、同じIssueではactiveとcompletedで同じファイル名を使う。

原則として1 Issueにつき1つのactive planを置く。複数planへ分割する必要がある場合は、Issue本文またはOWNERコメントに理由、各planの責任範囲、実行順序、相互関係を記録する。

## 作成と接続

1. Issueで目的、Risk、Execution、Spec level、Approval、許可・禁止範囲、受け入れ条件、依存関係、停止条件を確定する。
2. テンプレートを`active/issue-<番号>-<slug>.md`へコピーし、未確定事項を推測で埋めずに明示する。
3. Issueからactive planへリンクし、planからIssueへリンクする。
4. Full SpecまたはIssueで指定されたplanをCodexが作業前に読み、Issueおよび正本文書と矛盾しないことを確認する。
5. 実行中はmilestone、検証結果、判断、進捗、逸脱、残存リスクを更新する。

## 更新責任

- Issueのownerは、Exec Planのownerと更新責任者をMetadataで明確にする。
- 実行担当者は、各milestoneの開始・完了時、前提や依存関係の変更時、重要な判断時、停止・引継ぎ時にplanを更新する。
- 判断を変更した場合は古い記録を黙って消さず、Decision logへ理由と影響を残す。
- 検証結果は実行したコマンド、結果、未実施項目を区別して記録し、未検証事項を成功扱いしない。
- Human reviewへ渡す前に、ownerまたは実行担当者がplanとIssue、実際の差分、検証結果の整合を確認する。

## 完了・中止・置換

- 完了時は計画形の記述を実績へ直し、結果、検証、未実施事項、逸脱、残存リスクを記録する。
- 完了したplanは削除せず、同じファイル名で`completed/`へ移して履歴を残す。
- 中止または別planへ置換した場合も削除しない。最終status、実施済み範囲、結果、中止・置換理由、recovery状況、後継Issueまたはplanを記録して`completed/`へ移す。
- 移動後にIssueのリンクをcompleted planへ更新し、Issueの完了記録と一致させる。

## 安全境界

- Exec Planの存在はPlan、Execute、Production、commit、push、PR、merge、deployの承認を付与しない。
- secret、credential、`.env`の値、private URL、個人情報を記録しない。
- Issueの許可範囲を広げる必要がある場合はplanだけを変更して続行せず、Issueの再分類と承認を得る。
- R2/R3、DB、migration、Auth、production、external writeに関する境界はAgentic SDLCと対象領域の正本文書に従う。
