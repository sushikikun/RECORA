# Client-Facing Evidence Vs Eval Score Boundary

Purpose: prevent internal eval/rubric signals from being presented as client-facing AI visibility proof.

## Core Rule

Client-facing recommendations require RECORA measurement evidence. Eval, benchmark, rubric, scanner, and external tool scores are internal quality signals unless RECORA has separately defined, measured, and disclosed them with proper scope.

## Client-Facing Evidence Requires

- RECORA observation or supplied client artifact.
- evidence ID or inspected source.
- source-to-claim support status.
- query family or measurement context when AI visibility is discussed.
- freshness or inspection date where relevant.
- safe wording without guarantees.

## Internal-Only Signals

| Signal | Allowed use |
|---|---|
| OpenAI Evals-style pass/fail case | Regression test shape. |
| Ragas-like faithfulness/source score | Internal source-support review idea. |
| Garak-style scanner category | Red-team fixture category. |
| Lighthouse-style category | Technical readiness heuristic. |
| Schema validator result | Payload validity check, not evidence truth. |

## Disallowed Client Claims

- "AI visibility score" based on an external benchmark.
- "Official GEO score."
- "This eval proves the client will be cited."
- "This tool certifies the recommendation is safe."
- "This score proves ranking impact."

## Gate Actions

| Candidate wording | Decision |
|---|---|
| Eval score used as client proof | `hold` or `suppress` |
| Eval pattern used to create internal fixture | allowed internal-only |
| External benchmark used for guaranteed outcome | `suppress` |
| RECORA measurement evidence with safe wording | eligible if all other gates pass |
