# Third-Party Tool Adoption Safety Checklist

Purpose: checklist before any external tool, package, skill, benchmark, scanner, crawler, or eval framework influences RECORA beyond internal pattern borrowing.

## Required Checks

| Check | Required outcome before adoption |
|---|---|
| License | License file reviewed and compatible with intended use. |
| Maintenance | Maintainer activity, release cadence, and issue posture reviewed. |
| Execution behavior | Install, postinstall, CLI, scripts, Docker, and CI actions reviewed. |
| Network behavior | External calls, telemetry, crawling, provider calls, and data upload behavior reviewed. |
| Secret access | No `.env`, API key, cookie, browser profile, token, login, SSH key, or service-role dependency in the skill workflow. |
| Production write access | No DB write, migration, deploy, CI write, or customer-facing write without separate approval. |
| Data retention | Tool does not retain, transmit, or train on RECORA/client data without privacy approval. |
| Dependency risk | Transitive dependencies and supply-chain risks reviewed. |
| Local fixture alternative | A local, non-executing rubric or fixture can satisfy the immediate need. |
| RECORA role fit | Does not replace strategy, implementation, or quality-gate ownership. |

## Default Decision

If any check is unknown, use `hold` for internal review. If the candidate asks to execute, install, access secrets, or write production, use `suppress`.

## Recommended Safe Alternative

When adoption is not approved, rewrite the candidate as:

"Use this external pattern as an internal review heuristic only. Do not install, run, call, or cite the tool as RECORA evidence."
