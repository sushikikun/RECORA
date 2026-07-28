# Completed Exec Plans

このディレクトリは、完了・中止・置換済みのExec Planを履歴として保存する。運用全体は[`docs/exec-plans/README.md`](../README.md)を参照する。

## ルール

- `active/`で使った`issue-<番号>-<slug>.md`の名前を変えずに移す。
- planは削除せず、結果、検証、逸脱、残存リスクを実績として残す。
- 中止または置換した場合も、最終status、実施済み範囲、結果、理由、recovery状況、後継Issueまたはplanを記録する。
- Issueからcompleted planへリンクし、Issueの完了・中止記録と一致させる。
- 移動後に事実訂正が必要な場合は、履歴を黙って書き換えず、訂正理由と日付をProgress logまたはDecision logへ追記する。

このディレクトリのplanは新しい作業のactive planとして再利用しない。追加作業は新しいIssueとactive planで追跡する。
