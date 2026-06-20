# Semgrep / CodeQL Style Static Review Heuristics

Purpose: borrow rule-like and source/sink thinking for RECORA implementation reviews without running Semgrep, CodeQL, ESLint, or any scanner.

## Core Rule

Use static-review concepts as manual heuristics. Do not run scanners, upload code, add CI checks, or modify implementation unless separately approved.

## Rule-Like Finding Shape

| Field | Purpose |
|---|---|
| `rule_id` | Stable internal identifier for the review heuristic. |
| `category` | Example: secret handling, command execution, injection, source-to-claim, migration, parser. |
| `severity` | P0, P1, or P2. |
| `source` | Untrusted input, provider payload, external tool output, user text, migration SQL. |
| `sink` | Shell command, DB write, browser automation, client-facing recommendation, parser output. |
| `evidence` | File, payload, fixture, or inspected artifact. |
| `recommended_action` | Safe review action or implementation plan. |

## Heuristic Families

| Family | Review focus |
|---|---|
| Secret handling | Look for paths where secrets, cookies, tokens, or credentials could enter logs, prompts, fixtures, or client output. |
| Unsafe command execution | Look for external tool output becoming shell commands, installs, scripts, or CI actions. |
| Injection-like patterns | Look for untrusted provider/page/tool text becoming prompts, SQL, JSON, markdown, or UI without escaping/review. |
| Source/sink mismatch | Look for README claims or benchmark scores flowing into client-facing recommendations. |
| Production-write drift | Look for strategy or candidate text becoming DB writes, migrations, deploys, or customer-facing edits. |

## Output Boundary

Static-review heuristics can identify risks. They do not prove absence of risk and do not replace tests, runtime validation, RLS review, or quality-gate decisions.
