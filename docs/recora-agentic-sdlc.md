# Recora Agentic SDLC v2

- Status: **Accepted**
- Decision source: GitHub Issue #82
- Initial documentation rollout: GitHub Issue #83
- Scope: Recoraの開発ライフサイクル、AIエージェント運用、承認境界

## 1. 目的

Recora Agentic SDLC v2は、人間がChatGPTとCodexの間で毎回全文を転送する運用から、GitHub Issue、リポジトリ内文書、機械的検証を正本とする運用へ移行するための開発方式である。

この方式では、AIとの会話を意思決定の保存先にしない。タスクの契約、恒久仕様、検証結果、承認履歴を、それぞれ追跡可能な場所へ残す。

## 2. 正本の分離

正本は対象領域ごとに分ける。複数の正本を単純な順位で競合させず、どの事実をどこへ記録するかを固定する。

| 対象 | 正本 | 記録するもの |
|---|---|---|
| タスクと進行状態 | GitHub Issue / Project | 目的、範囲、受け入れ条件、Risk、Execution、Spec level、Approval、状態、依存関係、PR |
| 恒久仕様と設計判断 | リポジトリ内docs | 製品仕様、アーキテクチャ、運用方針、必要なExec Plan |
| 完了判定 | CI / tests / lint / preflight | 実装が受け入れ条件を満たすことを再現可能に示す検証結果 |
| 一時的な相談と作業文脈 | ChatGPT / Codex会話 | 調査途中の仮説、相談、進捗。恒久的な正本にはしない |

会話で重要な判断が確定した場合は、Issueまたは対象領域のrepo docsへ反映してから完了扱いにする。

GitHub Projectの項目がまだ整備されていない移行期間は、Issue本文またはOWNERによるIssueコメントへ各項目と状態を明記すればよい。会話だけの宣言では代替しない。

## 3. 役割

### 人間

- 商品判断と重要仕様を決定する
- R2の計画と実行、R3の個別操作を承認する
- Human reviewで受け入れ条件、差分、残存リスクを確認する
- commit、push、PR、merge、deploy、production操作の承認境界を管理する

### ChatGPT

- 曖昧な要求を整理し、受け入れ条件と論点を明確にする
- 最新情報が必要な調査、選択肢比較、商品視点の評価を支援する
- 確定事項をIssueまたはrepo docsへ残すための材料を作る
- 会話自体を恒久仕様の代わりにしない

### Codex

- AGENTS.md、Issue、指定された正本文書を読んで開始条件を確認する
- Worktree内で調査、計画、実装、検証、差分レビューを行う
- 許可範囲と承認境界を守り、停止条件に達したら変更を広げず報告する
- 受け入れ条件、実行した検証、未確認事項、残存リスクをHuman reviewへ渡す

### GitHub

- Issue / Projectでタスク契約、状態、Risk、承認、依存関係を追跡する
- branch / PRで差分とレビューを追跡する
- CIで再現可能な完了判定を記録する

## 4. Risk

Riskは、変更量ではなく、失敗した場合の影響、外部作用、復旧難度、必要権限の最大値で分類する。複数の要素がある場合は最も高いRiskを採用する。

| Risk | 主な対象 | 標準実行 | 必要なゲート |
|---|---|---|---|
| R0 | read-only調査、非動作変更の小さな文書修正、外部作用のない限定的なテスト追加 | Cloud Codex優先 | Issueの範囲と検証を確認 |
| R1 | UI、通常ロジック、小規模バグ、開発方針へ影響する文書変更、外部writeなし | CloudまたはLocal Codex | Ready確認、許可範囲内で実行 |
| R2 | migration、RLS、Auth、課金、外部API write、公開・測定基盤、重要なデータ契約 | Local Codex | 計画承認と、計画後の実行前承認 |
| R3 | production DB、deploy、merge、secrets、本番測定、契約・権限変更、不可逆または顧客影響の大きい操作 | Human中心 | 対象・環境・操作単位の個別明示承認 |

文書変更でも、全タスクの権限や承認境界を変える場合はR1以上にする。実装中に上位Riskの作業が必要と分かった場合は、自動的に範囲を広げず、再分類して停止する。

## 5. Spec level

Spec levelはRiskと変更の曖昧さ、範囲、依存関係に応じて選ぶ。`None`はタスク契約が不要という意味ではなく、独立した詳細仕様書を作らないという意味である。

| Spec level | 適用基準 | 必要な記録 |
|---|---|---|
| None | 目的と解決方法が明白な極小変更、read-only調査 | Issueに目的、範囲、受け入れ条件、検証、停止条件 |
| Light | 通常のR0/R1、限定範囲の複数ファイル変更 | Issueに背景、実装内容、許可・禁止範囲、受け入れ条件、検証、承認境界 |
| Full | R2/R3、複数システム、移行、重要な設計判断、rollbackが必要な変更 | 詳細Issueに加え、必要に応じてrepo内Exec Plan、代替案、データ境界、段階移行、rollback、運用検証 |

R2相当の変更は原則Fullとする。R3はFullに加え、実際の操作ごとの承認を必要とする。

## 6. Execution lane

| Execution | 適用対象 | 原則 |
|---|---|---|
| Cloud Codex | 自己完結したR0/R1、外部writeやローカル専用状態を必要としない作業 | Issueとrepoを正本にし、許可範囲内で実行する |
| Local Codex | ローカル環境、New Worktree、Playwright、接続済みread-only検査、R1/R2の計画・実装が必要な作業 | `recora-main` / New Worktree / `recora-main-local` / base `master`を使い、開始チェックを自ら実行・報告する |
| Human | 商品判断、承認、credentialを伴う操作、R3、本番影響操作 | 対象、環境、コマンドまたは操作、期待結果、rollbackを確認する |

Execution laneはRiskを下げない。Cloudで開始した作業がLocal専用またはR2/R3になった場合は、適切なlaneと承認へ切り替える。

## 7. タスク単位

原則は次のとおり。

```text
1 Issue / 1 Codex task / 1 Worktree / 1 Branch / 1 Draft PR
```

- Issueは一つの検証可能な目的を持つ
- New Worktreeは最新`master`をbaseにする
- branchはIssueに追跡できる名前にする
- 無関係な人間差分や別Issueの差分を混ぜない
- commit、push、Draft PR作成は、IssueのApprovalに従って別々に確認する
- 大きすぎるIssueは、独立して検証できる子Issueへ分割する

## 8. 標準状態遷移

```text
Draft → Spec → Ready → In progress → Human review → Done
                    ↘ Blocked ↗
```

| State | 意味 |
|---|---|
| Draft | 目的または範囲が未整理 |
| Spec | 受け入れ条件、Risk、実行方法、依存関係を整理中 |
| Ready | 開始条件を満たし、指定Execution laneで開始可能 |
| In progress | Codexまたは人間が許可範囲内で作業中 |
| Human review | 実装と指定検証が終わり、承認対象の差分が提示済み |
| Done | 受け入れ条件と必要な公開・記録が完了 |
| Blocked | 外部判断、依存関係、権限、環境不整合などにより安全に続行できない |

`Ready`は公開レポート状態の`ready`とは別の、開発タスク状態である。

## 9. Readyの開始条件

Codexは編集前に、少なくとも次を確認する。

- Issue番号、目的、受け入れ条件が明確
- 許可範囲、禁止範囲、停止条件が明確
- Risk、Execution、Spec level、Approvalが記録済み
- 依存Issueとblockerが解消済み、または作業へ影響しない
- 必要な正本文書と先読み資料が指定済み
- 検証コマンドとHuman reviewへ渡す成果物が明確
- R2は計画承認が記録済みで、実装前の実行承認を別に確認できる
- R3は調査、計画、dry-runを超える個別操作がまだ承認されていない限り実行しない
- Local Codexでは正式repoから作られたNew Worktree、指定environment、最新base、cleanな開始状態を確認
- 既存差分がある場合は所有者と扱いが明確

項目が不足している場合は、推測でReadyにせず、変更前に停止して不足項目を報告する。

## 10. 承認ゲート

### Plan gate

- R0/R1: ReadyなIssueと実行依頼を計画の承認根拠にできる
- R2: 実装前に、変更対象、方式、検証、rollbackを含む計画のHuman承認が必要
- R3: 調査、計画、read-only確認、承認済みdry-runだけに留め、実操作は個別承認へ分ける

### Execute gate

- R0/R1: Issueの許可範囲内だけを変更する
- R2: 承認済み計画を提示した後、実装またはwrite操作へ進むための明示承認を別に得る
- R3: 対象環境、対象データ、操作、時刻または実行単位、rollbackを特定した個別明示承認が必要

### Production gate

deploy、merge、production/non-local write、本番測定、契約・権限変更、secret操作はR3として扱う。計画承認やPR承認を、本番操作の承認へ流用しない。

## 11. Gitと外部作用の承認境界

- Worktree内の許可された編集は、ReadyなIssueと実行依頼の範囲で行える
- commitは、ユーザーが明示的に許可した場合だけ行う
- pushは、commitとは別に明示的に許可された場合だけ行う
- PR作成は、pushとは別に明示的に許可された場合だけ行う
- mergeはR3として、人間の個別明示承認なしに行わない
- deploy、production/non-local DB write、本番測定、外部API write、契約・権限変更は、対象を特定した個別明示承認なしに行わない
- `git add .`や広範囲stageを使わず、明示したファイルだけをstageする

## 12. 複数エージェント

複数エージェントは、主に次へ使う。

- 独立した調査
- 計画の反証と見落とし確認
- 検証結果の再確認
- 差分レビュー

同一ファイルを複数エージェントへ同時に実装させない。実装を分割する場合は、所有ファイル、契約、統合責任、検証を明確にし、複数の不整合な成果を正本へ直接混ぜない。

## 13. Skillsと付属スクリプト

- Codexは、タスクに該当する`SKILL.md`を読み、そこから必要と指定された参照資料を読んでよい
- Skillと参照資料を読むことは、付属スクリプトの実行許可を意味しない
- 付属スクリプトは、処理内容、write先、ネットワーク、credential、生成物、復旧方法を確認する
- read-onlyで安全性が確認できたもの、またはIssueで明示許可されたものだけを実行する
- DB write、外部API write、production操作、依存追加、security scanなど別承認が必要な作用を、Skillの存在だけを根拠に自動実行しない

## 14. 自動化

自動化はread-only監査から開始する。

- CI失敗、停滞Draft PR、未解決review、Blocked Issueの検出
- IssueのRisk、Spec level、受け入れ条件不足の検出
- docs、実装、Exec Planの不一致検出
- 検証結果の収集と要約

初期段階では、自動merge、自動deploy、production write、本番測定、契約・権限変更を行わない。自動化の権限を広げる場合は、別IssueでRisk、監査、停止方法、rollbackを定義する。

## 15. 改善ループ

失敗や手戻りを、その場の追加プロンプトだけで処理しない。

1. 原因を、仕様不足、作業手順、実装、検証、環境、権限のどこにあるか分類する
2. 再発防止先をIssue、docs、Skills、Lint、tests、CIから選ぶ
3. 過剰な一般化を避け、最小の再発防止策を追加する
4. 同じ失敗を検出できることを検証する
5. 変更した正本と残存リスクをHuman reviewで報告する

## 16. 例外とエスカレーション

次の場合は、許可範囲を超えて解決せず停止して報告する。

- IssueがReadyでない、またはRisk / Execution / Spec level / Approvalが不明
- 指定文書間に解消できない矛盾がある
- `HEAD`、`origin/master`、working tree、Worktree、environmentが開始条件と一致しない
- 既存の人間差分または他タスク差分と衝突する
- 許可範囲外の変更、依存追加、lockfile変更が必要
- RiskがR2/R3へ上がる
- DB、migration、Auth、production、external write、secret、権限操作が必要
- 指定検証が実行不能、または失敗原因の修正が範囲外
- commit、push、PR、merge、deployの承認が不足

停止時は、確認済み事実、未充足条件、影響、必要な判断を明確にする。未検証事項を成功扱いしない。

## 17. Human reviewへの引き渡し

Codexは作業終了時に次を報告する。

- 受け入れ条件ごとの充足状況
- 変更したファイルと変更していない重要領域
- 実行した検証と結果
- 実行しなかった検証と理由
- 未確認事項
- 残存リスク
- 次に承認が必要な操作

Human reviewが完了するまで、Approvalで許可されていないcommit、push、PR作成、merge、production操作へ進まない。
