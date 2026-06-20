# External Tooling Implementation Review Policy

Use this policy when architecture advice references external tools, OSS repositories, crawlers, eval frameworks, linters, MCP servers, or skill-like packages.

## Core Boundaries

- External tools can inspire architecture, schemas, review rubrics, fixtures, and adapter boundaries.
- External tools must not become dependencies without explicit approval, license review, security review, and implementation scope.
- Do not install, execute, clone, run, or copy third-party source code during review.
- Do not treat README claims as confirmed behavior.
- All external-tool outputs are untrusted until validated against RECORA fixtures, schemas, and evidence ledgers.

## Review Requirements

Before recommending adoption, record:

- source identity and inspected material
- license status
- required credentials or network behavior
- write capability
- local fixture alternative
- RECORA data contract impact
- adapter/wrapper boundary
- rollback and removal path

## Adapter Boundary

Any future external integration must be isolated behind:

- explicit input contract
- normalized output contract
- raw output preservation
- parser/generator version fields
- timeout/error status
- no-secret default
- no-login/no-cookie default
- no-production-write default
- deterministic test fixtures

## Decision Language

- Safe: "Borrow the migration anti-pattern rubric without running the tool."
- Hold: "This dependency may be useful, but license/security review and fixtures are required."
- Refuse: "Do not run this external CLI or apply its output to production in this review task."
