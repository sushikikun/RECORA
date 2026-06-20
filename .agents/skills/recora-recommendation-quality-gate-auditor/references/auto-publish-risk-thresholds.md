# Auto-Publish Risk Thresholds

Use this reference to enforce strict thresholds for `auto_publish`, `hold`, and `suppress`.

## auto_publish Threshold

`auto_publish` requires all of the following:

- `quality_score >= 85`.
- `risk_level` is low.
- confidence is medium or high.
- no critical flags.
- direct measurement or official-source-backed safe wording.
- no seed contamination.
- no citation misuse.
- no overclaim.
- client-facing wording is safe.

If any required condition is missing, do not use `auto_publish`.

## hold Threshold

Use `hold` when:

- `quality_score` is 50-84.
- risk is medium.
- confidence is low or medium.
- source or measurement gaps exist.
- duplicate risk exists.
- wording needs review.
- candidate is useful but needs human review or narrower phrasing.

## suppress Threshold

Use `suppress` when:

- `quality_score < 50`.
- risk is high or critical.
- hallucinated evidence is present.
- seed contamination is present and misrepresented.
- citation misuse is present.
- secret access or implementation drift appears.
- guarantee claims appear.
- recommendation is unsupported or misleading.

## Critical Flags

Critical flags block `auto_publish`:

- AI citation, ranking, recommendation, traffic, conversion, or revenue guarantee.
- fake official source or standard.
- invented measurement.
- hallucinated citation.
- seed contamination presented as natural discovery.
- secret request.
- production implementation instruction.
- client-harming factual claim.

## Score And Decision Consistency

The final decision must match the score:

- `auto_publish` below 85 needs explicit justification and should be rare.
- `hold` above 85 means a non-score blocker exists, such as duplicate risk or wording risk.
- `suppress` above 50 means a critical flag overrides the score.

Always explain override reasons.
