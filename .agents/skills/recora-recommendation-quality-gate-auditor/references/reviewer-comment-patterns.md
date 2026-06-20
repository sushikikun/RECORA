# Reviewer Comment Patterns From Real Candidates

Use these comments when reviewing candidates that resemble the actual copied payloads.

## Brand Visibility Gap

Auto-publish comment:

- "Auto-publish with observed-scope wording. This is based on direct Recora measurement across 10 absent observations, 5 prompt types, and both search modes. Do not turn it into a total AI invisibility claim."

Hold comment:

- "Hold if the wording says the brand is absent from AI search generally. The evidence only supports absence within the tested query set."

Missing evidence:

- "Add measurement IDs, query set, platform, and observation excerpts if this is separated from the generated report."

## Citation Evidence Review

Hold comment:

- "Hold because citation URLs are present but all supports_claim values are unknown. The candidate is a source validation task, not an improvement recommendation."

Source verification comment:

- "Open each citation and verify whether it supports the exact answer claim. Do not use URL existence as proof."

Suppress comment:

- "Suppress if the candidate claims the 26 URLs prove the recommendation before source-to-claim review."

## Case Study Evidence Gap

Hold comment:

- "Hold as an internal verification item. The candidate has only 1 observation and 1 matched clue, so it cannot prove a case-study or proof-asset gap."

Wording softening:

- "Replace confirmed gap language with 'may need additional confirmation' and request site evidence."

Suppress comment:

- "Suppress if the candidate says the site lacks case studies or that adding case studies will produce AI citation."

## General Patterns

- "The original generator marks all actual candidates as `review_required`; the quality gate can auto-publish only when evidence is direct and client-facing wording is already safe."
- "A `show` display decision is not the same as `auto_publish`."
- "A high evidence score does not override citation misuse, seed contamination, or overclaim risk."
- "Low-sample candidates should remain review items unless more measurements are supplied."
