# Recora Documentation Map

このディレクトリには、開発ライフサイクル、製品・運用アーキテクチャ、実装設計、Phase別runbook、ローカル作業手順が含まれる。

正本は競合する一つの順位ではなく、対象領域ごとに分ける。判断を記録するときは、該当領域の正本を更新する。

## 対象領域別の正本

| 文書 | 担当領域 |
|---|---|
| [`recora-agentic-sdlc.md`](./recora-agentic-sdlc.md) | **開発ライフサイクルとAIエージェント運用の正本**。Risk、Spec level、Execution lane、Ready、承認ゲート、タスク状態、Git・外部作用の境界を定義する |
| [`recora-development-domains.md`](./recora-development-domains.md) | **Recora全体の開発領域・進捗分類の正本**。9つの最上位開発領域、Phase・画面内分類・内部層との関係、Issueの主領域・関連領域の記録方法を定義する |
| [`exec-plans/README.md`](./exec-plans/README.md) | **Exec Plan運用の正本**。適用基準、Issueとの役割分担、命名、active / completedの移動、更新責任を定義する |
| [`recora-prompt-measurement-contract-v1.md`](./recora-prompt-measurement-contract-v1.md) | **プロンプト設計・固定運用・指標適格性・測定・集計の正式契約**。既存Persona / Topic / Prompt基盤、Intent grouping、Core / Robustness / Diagnostic、metric eligibility、実行・分母境界を定義する |
| [`recora-measurement-design-existing-foundation-v1.md`](./recora-measurement-design-existing-foundation-v1.md) | **Measurement Designの物理方針**。既存`public.personas`、`public.topics`、`public.prompts`、run/item/conversation証跡を正式な土台とし、固定Prompt運用に不足する項目だけを最小追加する。新しいidentity/revision・Prompt Set DBは初期要件ではない |
| [`recora-post-launch-operations-architecture.md`](./recora-post-launch-operations-architecture.md) | **顧客公開、測定、運用制御、DB境界の参照資料**。対象Issueと最新OWNER決定で未承認の商品・運用判断は自動継承しない |
| [`recora-data-tenant-security-privacy.md`](./recora-data-tenant-security-privacy.md) | **Issue #102工程3のデータ・tenant security・privacy実装契約**。tenant ownership、entitlement基盤、顧客/管理者境界、外部AI payload検査基盤、retention/deletion状態、security testを定義する |
| [`recora-customer-lifecycle-account-contract-billing.md`](./recora-customer-lifecycle-account-contract-billing.md) | **Phase 4 customer lifecycle / account / contract / billing approved Stage 1 baseline** - authority order, Phase 3 contracts, transition/recovery contract, provider-neutral boundary, and customer-safe allowlists; Stage 2 child Execute remains unapproved. |
| [`recora-dev-workflow.md`](./recora-dev-workflow.md) | **ローカルで実際に実行する具体コマンドと安全手順**。New Worktreeの開始確認、検証、DB・measurement・commit・push・Vercelの手順を定義する |
| [`.agents/skills/RECORA-SKILL-STACK.md`](../.agents/skills/RECORA-SKILL-STACK.md) | **Recora専門Skillの役割分担**。親Skill、専門Skill、品質ゲート、実装アーキテクトの責務を定義する |

これらは互いを無条件に上書きする文書ではない。現在のIssueで確定した原則と最新OWNER決定が最優先であり、既存のアーキテクチャ文書、PR、未merge branchは、その決定と一致する範囲の参考資料として扱う。

`recora-development-domains.md`の9分類は「何を開発しているか」を示す最上位分類である。Phaseは実装順、顧客画面・管理画面の領域は画面内の下位構成、`api / publication / measurement / control / audit`は技術配置として別軸で維持する。9分類の番号をPhase番号として扱わない。

PR #71は、未mergeのコード実装、デザイン値、モック値を再設計・修正可能な参考資料として扱う。一方、OWNERが採用した10の主要顧客画面と主要詳細画面の情報構成は正式な製品基準であり、Phase 3はこれを削除・変更せず安全なtenant / RLS / grant / classification境界を定義し、実際の画面実装とデータ接続はPhase 8が所有する。

同じ対象領域について内容が異なる場合は、次の順で扱う。

1. ユーザーが現在のIssueまたはOWNER承認記録で明示した最新の決定
2. 対象領域の正本
3. 現在の製品・データモデルに対応する正式設計資料
4. Phase別runbook
5. 過去のhandoff、検証用メモ

会話で恒久的な判断が確定した場合は、該当するIssueまたは正本文書へ反映してから完了扱いにする。ChatGPT / Codex会話だけを正本にしない。

## Measurement Designの訂正履歴

Issue #136 / #141で検討したgreenfield Canonical Data ModelとW1A/W1B planは、固定Prompt運用の最新OWNER決定によって初期実装対象から外れた。

- 旧`recora-measurement-design-canonical-data-model-v1.md`はGit history上の設計探索として保持する
- Issue #141 planは`exec-plans/completed/`へsuperseded recordとして移動する
- Issue #143のDB Execute承認は撤回され、Issueはnot plannedでcloseする
- 現在の物理正本は`recora-measurement-design-existing-foundation-v1.md`である

## Exec Plan

- [Exec Plan運用](./exec-plans/README.md)
- [再利用可能なExec Planテンプレート](./exec-plans/templates/exec-plan-template.md)
- [進行中のplan](./exec-plans/active/README.md)
- [完了・中止・置換済みplan](./exec-plans/completed/README.md)

Issueはタスク契約と承認の正本、Exec Planは複数段階の実行計画と実績の正本として相互リンクする。適用基準と更新責任はExec Plan運用を参照する。

## 開発レビューの提出・CI契約

- [PRテンプレート](../.github/pull_request_template.md): Issue、分類、scope、検証証跡、未実施事項、影響範囲、残存リスクをHuman reviewへ渡す標準形式
- [Recora CI](../.github/workflows/ci.yml): PRと`master` pushでpreflight、lint、buildを実行し、PRではbase / head差分のwhitespace integrityも確認する

PRとCIは検証可能な証跡を揃えるための仕組みであり、Human approvalやmerge、deploy、production操作の承認を代替しない。開発ライフサイクルと承認境界は[`recora-agentic-sdlc.md`](./recora-agentic-sdlc.md)、具体的な作業手順は[`recora-dev-workflow.md`](./recora-dev-workflow.md)を正本とする。branch protectionの実設定は別Issue・別承認で扱う。

## Phase 1資料の扱い

次の文書は、管理者運用型デモを安全に動かすための暫定runbookである。

- `recora-phase1-admin-demo-launch.md`
- `recora-phase1-admin-measurement-cycle.md`

これらは既存Phase 1処理の実行、安全確認、移行元の理解には使用できる。ただし、ローンチ後の完成形、顧客公開モデル、最終的なDB境界、複数provider運用を決定する正本ではない。

Phase 1資料と正式アーキテクチャが矛盾する場合は、既存処理を破壊せず互換性を維持しながら、正式アーキテクチャへ移行する。

## 変更時のルール

- 開発方式またはAIエージェント運用を変更する場合は`recora-agentic-sdlc.md`を更新する
- 最上位の9開発領域、その責務、Issue分類方法を変更する場合は`recora-development-domains.md`と本READMEを同じIssueで更新する
- Exec Planの適用基準、テンプレート、保存先、更新責任を変更する場合は`exec-plans/README.md`と関連文書を更新する
- プロンプト設計、固定Prompt運用、Intent grouping、panel role、指標適格性、測定条件、集計契約を変更する場合は`recora-prompt-measurement-contract-v1.md`を更新する
- Persona / Topic / Promptと測定証跡の物理利用方針、最小追加項目を変更する場合はIssue #144と`recora-measurement-design-existing-foundation-v1.md`を更新する
- 顧客公開、測定、運用制御、DB境界の変更は対象Issueと最新OWNER決定を先に確認し、承認scopeに含まれる場合だけ関連文書を更新する
- ローカルの具体コマンドや安全手順を変更する場合は`recora-dev-workflow.md`を更新する
- Recora専門Skillの責務を変更する場合は、製品コード変更と分けてSkill Stackを更新する
- 新しいアーキテクチャ判断を過去のhandoffだけに追加しない
- 正式方針を変更する場合は正本文書も更新する
- Phase限定の例外には対象Phaseと終了条件を明記する
- 現在の実装と将来方針を同じ状態として記述しない
- 実装済み、部分実装、未実装を区別する
- 旧構造を廃止する前に移行経路とrollback条件を定義する
