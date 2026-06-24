# Recora 案件設定下書きモデル契約

作成日: 2026-06-24

この契約は、案件設定をDB保存・UI実装・計測実行へ進める前のTypeScript下書きモデルを説明する。対象実装は `lib/recora/project-setup-draft.ts` と `scripts/verify-recora-project-setup-draft.ts`。

## 目的

顧客に persona、topic、prompt を細かく入力させず、Recora が生成する下書きを内部運用者が確認・承認してから計測用データへ昇格できるようにする。

今回の実装は純粋な型と判定ルールだけを扱う。Supabase migration、DB書き込み、UI、OpenAI/API呼び出し、計測実行は含めない。

## 主な型

- `ProjectSetupSeedInput`: 顧客または内部担当者が最小限入力する会社名、ブランド名、公式URL、サービス説明、業種、対象顧客、地域、言語。
- `ProjectSetupDraft`: Recora が作る下書き全体。persona、topic、prompt、competitor、citation angle、page improvement angle を分けて保持する。
- `PersonaDraft`: persona は確定顧客セグメントではなく、prompt 設計のための仮説として扱う。
- `TopicDraft`: topic は prompt より先に作る。metric target、brand mention policy、expected signal を必須の契約にする。
- `PromptDraft`: prompt 文面、intent、category、brand mention rule、response shape、candidate/ranking opportunity、review status、confidence、quality gate を持つ。
- `CompetitorDraft`: 競合は確定値ではなく候補として扱い、Direct / Adjacent / Aspirational / Substitute を内部レビュー対象にする。
- `CitationAngleDraft`: 実測前の citation correctness ではなく、後で観測すべき source / claim 観点を表す。
- `PageImprovementAngleDraft`: 改善候補ではなく、source gap や page opportunity になり得る内部レビュー用仮説を表す。

## branded / non-branded 分離

`derivePromptMetricEligibility` は prompt 文面、brand mention rule、response shape、candidate/ranking opportunity から metric eligibility を導く。

- `visibilityRate`、`ranking`、`shareOfVoice` は、brand excluded かつ candidate/ranking opportunity がある non-branded prompt のみ eligible にできる。
- ブランド名、alias、domain、branded response shape を含む prompt は、visibility/ranking/SOV から除外する。
- branded sentiment / brand perception prompt は sentiment / brandPerception 専用にする。
- citation_check / evidence prompt は citationCheck 専用にし、ranking evidence として扱わない。
- brand_optional prompt は、計測前に branded 版と non-branded 版へ分割する前提にする。

## readiness と materialize

`getPromptMeasurementReadiness` は prompt が計測準備済みかを判定する。

measurement ready には少なくとも以下が必要:

- review status が `approved`
- confidence score がしきい値以上
- quality score が `ready_for_measurement` 相当
- seed contamination risk が中・高ではない
- persona / topic / text が揃っている
- visibility/ranking/SOV、sentiment、brand perception、citation check のいずれかの用途に eligible

`getProjectSetupDraftMaterializationDecision` は、既存 personas / topics / prompts へ反映できるかを判定する。draft 本体と各 draft item が `approved` でない場合は materialize できない。

## fixture 検証

`scripts/verify-recora-project-setup-draft.ts` は以下を検証する。

- ブランド名入り prompt が visibility/ranking/SOV 対象にならない
- ブランド名なしの buyer intent prompt が visibility/ranking/SOV 対象になり得る
- branded sentiment prompt が sentiment / brand perception 用として扱われる
- review 未承認 prompt が measurement ready にならない
- persona / topic / prompt の最低限の整合性が検証される
- seed input の不足が blocker として返る

実行:

```powershell
npx tsx scripts/verify-recora-project-setup-draft.ts
```
