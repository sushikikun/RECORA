# Trust Risk Checklist

Use this reference whenever forms, reports, diagnosis flows, payments, email, delivery, official-source claims, scoring, or provisional implementations are mentioned.

## P0 Trust Risks

Flag as P0 when UI/report/copy implies:

- form submission was received, but backend handling is absent or unverified.
- diagnosis has run, but no diagnosis pipeline evidence exists.
- report will be delivered, but email/storage/delivery is absent or unverified.
- payment succeeded, but payment state is absent or unverified.
- AI queries were executed, but answer data is sample/mock/provisional.
- data was sanitized, but no sanitize logic or review evidence exists.
- customer data is stored safely, but storage/security evidence is absent.
- a GEORADER framework is an official SEO/GEO/AI standard.
- a tactic guarantees ranking, AI citation, or recommendation.
- secrets are requested, exposed, logged, or pasted.

## Review Steps

1. Identify the user-facing claim.
2. Identify the backend/report/runtime/source evidence required to support it.
3. State whether that evidence was inspected.
4. Apply an evidence label.
5. If not verified, recommend safer wording or a blocked state.
6. Assign P0 when customer trust, money, delivery, privacy, official claims, or diagnosis accuracy is affected.

## Safer Wording Patterns

- Use "プレビュー" for sample or mock output.
- Use "仮受付" only when it is truly provisional and explained.
- Use "診断準備" rather than "診断完了" when no query run has occurred.
- Use "サンプルレポート" rather than "あなたの診断結果" for sample data.
- Use "確認後にご連絡します" only if there is a real follow-up process.
- Use "GEORADER独自の評価フレームワーク" rather than "公式基準".
- Use "引用される可能性を高める" rather than "必ず引用される".
