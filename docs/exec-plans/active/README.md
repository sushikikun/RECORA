# Active Exec Plans

このディレクトリには、実行中または一時停止中のExec Planを置く。運用全体は[`docs/exec-plans/README.md`](../README.md)、新規planは[テンプレート](../templates/exec-plan-template.md)を参照する。

## ルール

- ファイル名は`issue-<番号>-<slug>.md`とする。
- 原則として1 Issueにつき1つのactive planを置く。
- planとIssueを相互リンクし、IssueのRisk、Execution、Spec level、Approvalと一致させる。
- 実行担当者はmilestone、Progress log、Decision log、検証結果、残存リスクを作業中に更新する。
- blockerで一時停止してもactiveに残し、MetadataとProgress logへ停止理由、影響、再開条件を記録する。
- 完了・中止・置換したplanをここへ残さず、実績と理由を記録して`completed/`へ移す。

複数planへの分割が必要な場合は、Issue側に理由、責任範囲、実行順序、相互関係を記録する。
