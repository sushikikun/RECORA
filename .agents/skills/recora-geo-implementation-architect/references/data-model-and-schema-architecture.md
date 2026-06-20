# Data Model And Schema Architecture

## Recommended First-Class Concepts

- measurement run
- run item
- provider execution
- prompt
- prompt taxonomy
- persona
- buyer stage
- seed terms and seed risk
- raw AI response
- normalized conversation
- brand mention
- competitor mention
- citation
- source domain
- source-to-claim relation
- evidence ledger entry
- recommendation candidate
- quality-gate review
- published recommendation
- rejection record
- remeasurement task

## Design Principles

- Preserve immutable raw evidence where practical.
- Separate derived data from raw data.
- Use stable IDs and explicit foreign keys.
- Store timestamps and provenance.
- Store schema version and parser/generator versions.
- Represent `null`, `unknown`, `not_reviewed`, and `absent` explicitly.
- Avoid overloading one table with unrelated meanings.
- Do not infer publication decisions from candidate generation alone.
- Keep provider status separate from evidence quality.
- Keep technical readiness separate from AI-answer visibility proof.

## Review Checks

- Can each candidate trace back to raw measurement data?
- Can raw provider response be re-parsed without destroying the original?
- Can derived rows be recomputed or superseded without mutating raw evidence?
- Are source-to-claim statuses first-class records rather than citation-count proxies?
- Are rejected and held candidates preserved for audit?
- Does review history survive re-runs?

Do not prescribe a migration unless the real schema and migrations are inspected.
