# Copy Examples And Self Tests

## Good / Bad Examples

### LP Hero

Bad:
`AI時代に必須のRecoraで、AIに選ばれるサイトへ。導入するだけで競合に勝てます。`

Good:
`Recoraは、AI検索で自社や競合がどう説明され、どの情報源が参照されているかを実測します。回答傾向、引用元、改善候補を分けて整理し、次に直すべきページを判断しやすくします。`

Why:
Guarantees and fear framing are removed. The rewrite names the measured objects and the practical decision Recora supports.

### Dashboard Alert

Bad:
`危険です。AI検索での露出が落ちています。すぐ改善してください。`

Good:
`前回より引用数が減少しています。この変化は一時的な可能性があります。まず回答ログと引用元の差分を確認してください。`

Why:
The alert states the observed change, acknowledges uncertainty, and gives the next action.

### Report Finding

Bad:
`競合AはAIに強く、自社は選ばれていません。早急に対策が必要です。`

Good:
`事実: 今回の測定では、比較系プロンプト5件中3件で競合Aが言及されました。自社名の言及は1件でした。推論: 競合Aは第三者記事と事例ページが参照され、AI回答上で説明材料が見つかりやすい可能性があります。未検証: この傾向が他プロンプトでも続くかは追加測定が必要です。推奨: まず比較観点と導入事例ページの不足を確認してください。`

Why:
It separates fact, inference, unverified hypothesis, and recommendation.

### Sales One-Liner

Bad:
`RecoraはAI検索を完全攻略し、売上を最大化する次世代マーケティングツールです。`

Good:
`Recoraは、AI回答での自社・競合の見え方、引用元、改善候補を測定し、マーケティングチームが優先順位を付けて改善しやすくする診断・運用支援ツールです。`

Why:
The rewrite explains what becomes visible without promising commercial outcomes.

### Sales Deck

Bad:
`導入するだけでAIに引用される状態を作れます。`

Good:
`導入後は、AI回答での言及、引用元、競合との差分を継続的に確認できます。改善後の露出変化は、測定条件をそろえて確認します。`

Why:
The rewrite separates visibility measurement from outcome guarantees.

### Email Example

Bad:
`今すぐGEOを始めないと、AI時代に乗り遅れます。`

Good:
`AI検索で自社や競合がどう説明されているかは、通常の検索順位だけでは把握しにくくなっています。まずは主要な購買プロンプトでの回答傾向と引用元を確認しませんか。`

Why:
It removes fear pressure and replaces it with a concrete diagnostic reason and next step.

### Social Post

Bad:
`SEOは終わりました。これからはGEOを完全攻略できる企業だけが勝ちます。`

Good:
`SEOが不要になったわけではありません。ただ、AI検索では「どのページが上位か」だけでなく、「AIが何を引用し、どう比較しているか」も確認が必要です。GEOは、その見え方を測定して改善の優先度を決めるための考え方です。`

Why:
It is educational, does not declare SEO dead, and explains GEO in beginner-friendly terms.

### FAQ

Bad:
`Q. Recoraを使うとAIに引用されますか？ A. はい、AIに選ばれるサイト作りを完全サポートします。`

Good:
`Q. Recoraを使うとAIに引用されますか？ A. 引用を保証するものではありません。Recoraは、AI回答で現在どの情報源が参照されているかを測定し、引用されやすい可能性を高めるためのページ改善候補を整理します。`

Why:
It answers directly, avoids a guarantee, and explains the support mechanism.

### CTA

Bad:
`AIに選ばれるサイトへ`

Good:
`AI回答での見え方を診断する`

Why:
The CTA promises an action Recora can support, not an outcome AI systems control.

### Executive Summary

Bad:
`自社はAI検索で大きく遅れており、早急なGEO対策が必要です。`

Good:
`今回の測定では、比較系プロンプトで競合Aの言及が自社より多く観測されました。主な差分は、第三者記事の引用と比較観点の明確さです。まずは比較ページとFAQの不足を確認し、追加測定で傾向の継続性を見ます。`

Why:
It is internally shareable and grounded in observed evidence.

### Empty State Example

Bad:
`データがありません。今すぐ設定してください。`

Good:
`まだ測定結果がありません。対象プロンプトを追加すると、AI回答での言及と引用元を確認できます。`

Why:
It explains why the state is empty and what action creates value.

### Comparison Page Example

Bad:
`Recoraなら競合を凌駕し、AI検索で優位に立てます。`

Good:
`Recoraでは、自社と競合がAI回答でどう説明されているか、どの情報源が引用されているかを同じ条件で比較できます。優位性の判断には、測定結果と外部引用の状況を確認します。`

Why:
It supports comparison without making unsupported superiority claims.

### Pricing / Plan Explanation

Bad:
`上位プランならAI検索に完全対応できます。`

Good:
`上位プランでは、測定プロンプト数、競合比較、引用元分析、改善候補のレビュー範囲が広がります。AI検索での露出改善を保証するものではありません。`

Why:
It clarifies plan differences and avoids exposure guarantees.

## Safer Rewrite Patterns

Use these transformations:

- `AIに必ず引用されます` -> `AI回答で参照されている情報源を確認し、引用されやすい可能性を高める改善候補を整理します。`
- `競合に勝てます` -> `競合との言及差、引用元差、説明内容の差分を比較できます。`
- `完全自動で改善します` -> `測定結果をもとに改善候補を整理し、公開前に根拠を確認します。`
- `未来のSEO` -> `SEOに加えて、AI回答上の見え方を確認するための取り組みです。`
- `放置すると危険` -> `現時点では引用元と説明内容に差分があります。影響範囲を確認してください。`
- `売上を最大化` -> `改善優先度を整理し、マーケティング施策の判断材料を増やします。`
- `誰でも簡単` -> `初回でも確認しやすいよう、回答傾向・引用元・改善候補を分けて表示します。`

## Self-Test Examples

### Test 1: LP Overclaim

Input:
`RecoraならAI検索を完全攻略し、競合に勝てます。`

Expected:
- Classification: `LP copy`
- Risk level: `BLOCK`
- Rewrite should mention measured AI answers, citations, competitor comparison, and improvement priority.
- Rewrite must not promise AI citation, ranking, traffic, or victory.

### Test 2: Dashboard Ambiguity

Input:
`スコアが悪化しました。対策してください。`

Expected:
- Classification: `Dashboard microcopy`
- Risk level: `REWRITE`
- Rewrite should state the observed metric and next inspection step.
- If the metric is unknown, say `NEEDS_VERIFICATION`.

### Test 3: Report Claim Without Evidence

Input:
`今回の改善でAIからの流入が増えます。`

Expected:
- Classification: `Report copy`
- Risk level: `BLOCK` unless measured data exists.
- Rewrite should separate recommendation from outcome guarantee.

### Test 4: Social Hype Reduction

Input:
`SEOは終わり。AI時代に乗り遅れないためにGEOを完全攻略しましょう。`

Expected:
- Classification: `Social / Article`
- Risk level: `BLOCK`
- Rewrite should explain that SEO remains important and that GEO adds AI-answer observation.
- Rewrite should avoid fear-only framing.

### Test 5: FAQ For GEO Beginners

Input:
`GEOとは何ですか？Recoraで必ずAIに選ばれますか？`

Expected:
- Classification: `FAQ`
- Risk level: `NEEDS_EVIDENCE` or `BLOCK` for the guarantee portion.
- Rewrite should explain GEO in beginner-friendly terms and clearly state that Recora does not guarantee AI selection or citation.

## Final Self-Check

Before returning any answer with this skill:

- Did you classify the input and audience?
- Did you label risky claims as `BLOCK`, `NEEDS_EVIDENCE`, `REWRITE`, or `OK`?
- Did you remove guarantees, AI-citation certainty, SEO-is-dead framing, fear-only hooks, and unsupported competitor superiority?
- Did you keep wording specific to Recora's AI search observations, citations, source gaps, competitor comparison, and improvement prioritization?
- Did you separate `事実`, `推論`, `未検証`, and `推奨` for report-style copy?
- Did you provide dashboard microcopy only when relevant, and keep it short enough for UI?
- Did you keep the seven-section output format?
- Did you avoid changing application files, `.env`, secrets, API keys, or unrelated skills?
