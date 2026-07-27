# Recora Documentation Map

このディレクトリには、開発ライフサイクル、製品・運用アーキテクチャ、実装設計、Phase別runbook、ローカル作業手順が含まれる。

正本は競合する一つの順位ではなく、対象領域ごとに分ける。判断を記録するときは、該当領域の正本を更新する。

## 対象領域別の正本

| 文書 | 担当領域 |
|---|---|
| [`recora-agentic-sdlc.md`](./recora-agentic-sdlc.md) | **開発ライフサイクルとAIエージェント運用の正本**。Risk、Spec level、Execution lane、Ready、承認ゲート、タスク状態、Git・外部作用の境界を定義する |
| [`recora-post-launch-operations-architecture.md`](./recora-post-launch-operations-architecture.md) | **顧客公開、測定、運用制御、DB境界の正本**。公開版、品質ゲート、Queue、監査、権限、段階移行を定義する |
| [`recora-dev-workflow.md`](./recora-dev-workflow.md) | **ローカルで実際に実行する具体コマンドと安全手順**。New Worktreeの開始確認、検証、DB・measurement・commit・push・Vercelの手順を定義する |
| [`.agents/skills/RECORA-SKILL-STACK.md`](../.agents/skills/RECORA-SKILL-STACK.md) | **Recora専門Skillの役割分担**。親Skill、専門Skill、品質ゲート、実装アーキテクトの責務を定義する |

これらは互いを上書きする文書ではない。例えば、タスクのRiskと承認はAgentic SDLC、顧客公開版の状態はpost-launch architecture、ローカルの確認コマンドはdev workflow、専門分析の担当はSkill Stackを参照する。

同じ対象領域について内容が異なる場合は、次の順で扱う。

1. ユーザーが現在のIssueまたは承認記録で明示した決定
2. 対象領域の正本
3. 現在の製品・データモデルに対応する正式設計資料
4. Phase別runbook
5. 過去のhandoff、検証用メモ

会話で恒久的な判断が確定した場合は、該当するIssueまたは正本文書へ反映する。ChatGPT / Codex会話だけを正本にしない。

## Phase 1資料の扱い

次の文書は、管理者運用型デモを安全に動かすための暫定runbookである。

- `recora-phase1-admin-demo-launch.md`
- `recora-phase1-admin-measurement-cycle.md`

これらは既存Phase 1処理の実行、安全確認、移行元の理解には使用できる。ただし、ローンチ後の完成形、顧客公開モデル、最終的なDB境界、複数provider運用を決定する正本ではない。

Phase 1資料と正式アーキテクチャが矛盾する場合は、既存処理を破壊せず互換性を維持しながら、正式アーキテクチャへ移行する。

## 変更時のルール

- 開発方式またはAIエージェント運用を変更する場合は`recora-agentic-sdlc.md`を更新する
- 顧客公開、測定、運用制御、DB境界を変更する場合は`recora-post-launch-operations-architecture.md`を更新する
- ローカルの具体コマンドや安全手順を変更する場合は`recora-dev-workflow.md`を更新する
- Recora専門Skillの責務を変更する場合は、製品コード変更と分けてSkill Stackを更新する
- 新しいアーキテクチャ判断を過去のhandoffだけに追加しない
- 正式方針を変更する場合は正本文書も更新する
- Phase限定の例外には対象Phaseと終了条件を明記する
- 現在の実装と将来方針を同じ状態として記述しない
- 実装済み、部分実装、未実装を区別する
- 旧構造を廃止する前に移行経路とrollback条件を定義する
