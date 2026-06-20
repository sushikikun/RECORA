# Claim Safety And Overclaim Rules

Use this reference to detect dangerous wording in recommendation candidates.

## Dangerous Claims

These should trigger `hold` or `suppress` depending on severity and whether they can be safely rewritten:

- "AIに必ず引用される"
- "AI回答に表示される"
- "Google公式GEO基準"
- "Schemaを入れればAIに出る"
- "Botを許可すればChatGPTに引用される"
- "GEO研究で40%改善すると証明済み"
- "SERP上位だからAI回答にも出る"
- "競合より必ず推薦される"
- "この施策で売上が上がる"

## Suppress-Level Overclaims

Suppress when a candidate:

- guarantees AI citation, AI display, recommendation, ranking, traffic, conversion, or sales.
- claims official Google GEO standards without verified official source support.
- treats schema, crawler access, FAQ content, source additions, or comparison pages as guarantees.
- turns research findings into commercial promises.
- treats SERP ranking as proof of AI answer visibility.
- says competitors or the client will definitely be recommended.
- makes financial outcome claims without supplied measurement.

## Hold-Level Wording

Use `hold` when the direction is usable but wording needs softening:

- strong but unverified "likely" claims.
- causal claims inferred from partial evidence.
- client-facing language that is too certain.
- source-backed claims missing current source status.
- generic claims that can be tied to measurement with edits.

## Safer Wording

Use safer phrasing such as:

- "引用される可能性を高めるための準備"
- "アクセス条件を確認する"
- "AI回答で判断材料として扱われやすい情報を揃える"
- "実測で再確認する"
- "Recora内部の評価フレームであり、公式標準ではありません"
- "検索結果とAI回答の両方で確認する必要があります"
- "現時点では仮説であり、追加測定が必要です"

## Rewrite Pattern

Risky:

- "Schemaを入れればAIに出る"

Safe:

- "構造化データはページ内容の理解や対応する検索機能の適格性を支える可能性があります。ただし、AI回答への表示や引用は保証されないため、実測で確認します。"

Risky:

- "SERP上位だからAI回答にも出る"

Safe:

- "通常検索での可視性は重要な前提ですが、AI回答での言及・推薦・引用は別途測定します。"
