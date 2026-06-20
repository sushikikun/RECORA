# Expert Evidence Grading

Use this reference to grade the evidence behind Recora recommendation candidates before deciding `auto_publish`, `hold`, or `suppress`.

## Evidence Levels

| Level | Definition | Typical Decision |
|---|---|---|
| `DIRECT_MEASUREMENT` | Candidate is based on actual Recora measurement data, such as AI answer logs, brand mentions, citations, source domains, run items, or SERP evidence. | Can support `auto_publish` when wording is safe and no critical flags exist. |
| `SUPPORTED_INFERENCE` | Candidate is inferred from multiple measured signals, but the exact causal claim is not directly proven. | Usually `hold`, unless phrased narrowly and supported by strong evidence. |
| `INDUSTRY_PRACTICE` | Candidate is based on common SEO, GEO, CRO, or content practice, but not directly proven for this client. | Usually `hold`; suppress if generic or disconnected from Recora evidence. |
| `RESEARCH_BACKED` | Candidate is supported by research concepts such as GEO, RAG, hallucination/factuality, or AI search empirical studies, but not guaranteed in current commercial platforms. | Usually `hold`; can support rationale but not commercial outcome claims. |
| `OFFICIAL_SOURCE_BACKED` | Candidate follows official platform guidance, such as Google Search Central, OpenAI crawler docs, structured data guidelines, robots.txt standards, or platform crawler documentation. | Can support `auto_publish` when source-to-claim mapping is exact and wording is safe. |
| `UNSUPPORTED` | Candidate lacks evidence or makes claims beyond the data. | `suppress` when misleading; otherwise `hold` only if it can be reframed as a verification task. |

## Decision Mapping

`auto_publish` requires:

- `DIRECT_MEASUREMENT`, or
- strong `OFFICIAL_SOURCE_BACKED` support for a narrow guidance claim, plus safe wording.

`hold` is appropriate for:

- `SUPPORTED_INFERENCE`.
- `INDUSTRY_PRACTICE`.
- `RESEARCH_BACKED`.
- partial official-source support that needs source-status review.
- direct measurement with wording or duplicate risk.

`suppress` is appropriate for:

- `UNSUPPORTED` claims.
- invented evidence.
- hallucinated sources.
- overclaims.
- fake official claims.
- seed-contaminated claims presented as natural discovery.
- citation misuse.
- secret access or implementation drift.

## Grading Questions

- What exact observation, source, or research supports the candidate?
- Does the evidence directly support the recommendation, or only a weaker inference?
- Is the candidate making a causal claim that was not measured?
- Does the wording imply certainty that the evidence does not support?
- Would the client reasonably believe this is a confirmed finding?

## Output Pattern

Use:

| Claim | Evidence level | Evidence basis | Decision impact |
|---|---|---|---|

When evidence level is unclear, mark it `UNSUPPORTED` or `NEEDS_VERIFICATION` and avoid `auto_publish`.
