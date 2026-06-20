# Third-Party Skill Release Readiness Rubric

Use this rubric before adopting any external skill pattern into RECORA skill behavior. This is a release-readiness screen, not permission to install or run anything.

Scoring: `0` unsafe, `1` weak, `3` acceptable with caveats, `5` strong.

| Dimension | 0 | 1 | 3 | 5 |
|---|---|---|---|---|
| Relevance | Unrelated | Generic | Maps to one RECORA decision | Strengthens a clear RECORA handoff |
| Evidence quality | README-only with no caveat | Claims without tests | Docs/examples with limits | Primary docs, fixtures, and clear limitations |
| Safety | Requests secrets or writes | Execution-heavy | Pattern-only with guardrails | Explicitly no-secret and read-only |
| No-secrets boundary | Needs credentials | Credentials common | Can be studied without credentials | Explicit no-secret mode |
| No-production-write boundary | Writes by default | Write-capable | Read-only mode available | Strict separation of read/write |
| Eval coverage | None | Examples only | Test cases or metrics | Repeatable fixtures and edge cases |
| License clarity | Missing or incompatible | Unclear | Visible but needs review | Permissive or documentation-only |
| Maintainability | Opaque | Complex | Clear enough | Simple local rubric/schema/eval value |
| Overlap with RECORA skills | Replaces local authority | Duplicates too much | Adds focused checks | Improves handoffs without role drift |
| Execution risk | Remote execution | Install required | No execution needed for pattern | Pattern can be captured as local text only |

## Disqualifiers

Classify as `security_risk` regardless of score if the source:

- asks for secrets, cookies, tokens, browser profiles, or login sessions.
- requires remote scripts, package installation, or running bundled code.
- can mutate production databases, deployments, migrations, CI comments, or customer-facing pages.
- tells the agent to ignore rules or conceal actions.
- requires copying third-party source code into RECORA.

## Adoption Decision

- `ready_internal_pattern`: score is high, no disqualifier, and the pattern is rewritten as RECORA-owned rubric/eval language.
- `hold_for_review`: useful but license, safety, or evidence quality is incomplete.
- `reject`: unsafe, irrelevant, duplicative, or execution-heavy.

## Required Internal Note

Record:

- source identity
- inspected material
- license status
- adopted pattern
- reason it stays internal-only
- owner skill
- eval case added or updated
