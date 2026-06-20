# Client-Facing Language

Use this reference when writing Japanese report sections, executive summaries, sales-ready excerpts, or safer wording for GEORADER.

## Tone

- Clear, calm, specific.
- Avoid fear-based wording.
- Avoid pretending certainty when evidence is limited.
- Explain AI-search and SEO visibility as improvement opportunities.
- Use "確認できた範囲では" when scope is limited.
- Use evidence labels internally; convert them into natural client-safe explanations when needed.

## Safe Phrases

- "確認できた範囲では、現時点でAI回答内の推薦理由として使える公開情報が不足しています。"
- "競合が表示される一方で、自社名が候補に入らないクエリがありました。"
- "AIが引用しやすい形で、実績・対象顧客・選ばれる理由を整理する余地があります。"
- "本レポートは提供された回答結果と確認範囲に基づく診断です。"
- "追加のAI回答取得、SERP確認、ブラウザ確認を行うことで、精度を高められます。"
- "GEORADER独自の評価フレームワークでは、優先改善領域として扱います。"

## Avoid Or Qualify

Avoid unless properly qualified and evidence-backed:

- "AIに必ず引用されます。"
- "上位表示できます。"
- "これがGEOの公式基準です。"
- "この施策で確実に推薦されます。"
- "診断は完了しています。" unless verified.
- "送信を受け付けました。" unless backend/email/storage handling is verified.
- "支払い済みです。" unless payment state is verified.
- "自動で改善されます。" unless automation is verified.

## Client-Facing Finding Format

Use:

```md
### 課題
[確認できた事実、または確認範囲に基づく見立て]

### 影響
[AI検索・SEO・競合比較・問い合わせへの影響]

### 改善方針
[具体的だが実装に踏み込みすぎない次アクション]
```

## Internal-To-Client Rewrite Rule

Convert internal blunt language into client-safe language:

- Internal: "The form is fake."
- Client-facing: "現状の表示は、ユーザーに送信完了と受け取られる可能性があります。バックエンド処理が未確定の場合は、受付状態を明確にする必要があります。"

- Internal: "No evidence supports this claim."
- Client-facing: "この訴求をAIや検索エンジンが理解・引用しやすくするには、実績・事例・根拠ページを追加する必要があります。"

- Internal: "This framework is made up."
- Client-facing: "この評価軸はGEORADER独自の診断フレームワークです。公式な検索エンジン基準ではなく、改善優先度を整理するために使用します。"
