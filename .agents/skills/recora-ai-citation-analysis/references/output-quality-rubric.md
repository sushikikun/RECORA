# Output Quality Rubric

Use this rubric to score Recora Source Intelligence / Citation Audit output before internal review, client reporting, or downstream handoff.

Score from 0 to 100. Apply deductions after category scoring. If a hard-fail condition is present, mark the output unsafe regardless of numeric score.

## Scoring Categories

| Category | Points | What Good Looks Like |
|---|---:|---|
| Input Handling | 10 | Detects missing inputs, preserves observation context, separates engine/model/persona/region/language, and reflects observation count. |
| Citation Classification | 15 | Correctly classifies own, competitor, third-party, comparison, review, directory, unknown; normalizes accessibility and source text status; never confirms from URL alone. |
| Claim Inventory / Atomicity | 15 | Breaks AI answers into minimal verifiable claims; labels factual, comparative, recommendation, pricing, feature, reputation, temporal, and high-risk claims. |
| Correctness / Faithfulness / Alignment | 15 | Separates correctness from faithfulness; uses supported, partially supported, contradicted, and unverifiable carefully; avoids overclaiming weak source support. |
| Evidence Ledger | 10 | Traces each claim to source evidence; includes evidence strength, confidence, finding status; keeps missing input separate from verified evidence. |
| Citation Risk | 10 | Detects outdated, broken, login-required, paywalled, affiliate bias, unsupported guarantees, P0/P1 risks, and low-quality sources without treating them as neutral. |
| Recommended Actions | 10 | Separates `own_site_fix`, `own_site_new_page`, `third_party_outreach`, `evidence_building`, `technical_support`, and `monitoring`; includes hypothesis, verification method, and handoff target; never guarantees AI citation lift. |
| Client-safe Language | 10 | Avoids overclaiming; uses confirmed, likely, hypothesis, advisory, unverified, contradicted, and blocked correctly; avoids phrases like "will be cited" or "schema guarantees AI visibility." |
| Report Readiness / Handoff | 5 | Distinguishes `ready_for_client_report`, `internal_only`, `needs_more_evidence`, and blocked states; creates useful handoff payloads. |

## Score Bands

- `90-100`: `production_ready`
- `75-89`: `report_draft_ready`
- `60-74`: `internal_review_only`
- `40-59`: `needs_major_revision`
- `0-39`: `unsafe_or_unusable`

## Required Deductions

Apply these deductions after category scoring:

- URL-only source marked `confirmed`: `-20`
- Strong competitor or own-site conclusion made without checked `source_text`: `-20`
- AI citation increase, ranking, traffic, or recommendation gain is guaranteed: `-30`
- schema, robots, sitemap, internal links, or `llms.txt` treated as a magic AI-citation lever: `-25`
- `observation_count: 1` treated as a stable pattern: `-20`
- Output marked `ready_for_client_report` while content is not client-safe or high-risk evidence is missing: `-25`
- Affiliate ranking treated as neutral third-party proof: `-15`
- Paywalled, login-required, broken, or app/dashboard URL used as confirmed evidence without source text: `-20`
- Cross-engine observations mixed without engine/model/interface/date caveat: `-20`
- Broken, stale, contradictory, or hallucinated source omitted from Citation Risk: `-15`

## Hard-fail Conditions

Mark the output `unsafe_or_unusable` if any of these occur:

- The output asks for, reads, or exposes `.env`, secrets, API keys, cookies, credentials, or login sessions.
- The output modifies Recora app files, production systems, or external services while performing citation analysis.
- The output claims guaranteed AI citation, Google AI Overview visibility, traffic, revenue, or model behavior.
- The output presents unchecked source text as verified evidence in a client-ready conclusion.
- The output ignores direct contradiction between AI answer and cited source.

## Output Quality Fields

When scoring an audit, include:

- `output_quality_score`
- `quality_rank`
- `major_deductions`
- `unsafe_for_client_report`
- `client_report_readiness`
- `internal_review_notes`
- `required_follow_up_evidence`

## Review Procedure

1. Confirm inputs and observation context.
2. Check source accessibility and source text status normalization.
3. Review classification and claim atomicity.
4. Check correctness, faithfulness, and alignment for material claims.
5. Verify Evidence Ledger traceability.
6. Inspect Citation Risk for stale, inaccessible, biased, low-quality, contradictory, and unsupported sources.
7. Check Recommended Actions for expected-effect hypotheses and verification methods.
8. Apply client-safe language rules.
9. Apply deductions and hard-fail rules.
10. Assign report readiness and handoff notes.

## Minimal Scored Output Example

```json
{
  "output_quality_score": 72,
  "quality_rank": "internal_review_only",
  "major_deductions": [
    {
      "deduction": -20,
      "reason": "Only one observation was treated too close to a stable pattern."
    }
  ],
  "unsafe_for_client_report": true,
  "client_report_readiness": "needs_more_evidence",
  "required_follow_up_evidence": [
    "Checked source text for login-required citations",
    "Same-condition repeat observations"
  ]
}
```
