# Exec Plan: Issue #114 external-AI payload safety foundation

## Metadata

| Field | Value |
|---|---|
| Issue | `#114` — `https://github.com/sushikikun/RECORA/issues/114` |
| Risk | `R3` |
| Spec level | `Full` |
| Execution | `Local Codex` |
| Approval | `Execute` — Issue body is the OWNER approval |
| Owner | `sushikikun` |
| Status | `Completed` |
| Updated | `2026-07-30` |

## Objective / expected outcome

Create the Phase 3 `102-3G` server-only, provider-neutral boundary that accepts a
trusted internal execution context plus unknown request input and returns only a
validated, allowlisted `ProviderSafePayload`. The payload builder must fail closed on
tenant mismatch, entitlement absence, invalid limits, unsafe content, unsafe URLs, or
schema/size violations. No provider call, queue, worker, fetch, DNS lookup, DB access,
or migration is part of this Issue.

## Context and constraints

- Parent: Issue #102; dependencies `102-3B` and `102-3D` are merged on the base.
- Start base: `origin/master` at `a495e55`, including PR #115 merge
  `a495e55a820e41df6432d6479eab52021e02e6b5`.
- Worktree/branch: `C:/tmp/recora-issue-114-worktree` /
  `codex/issue-114-external-ai-payload-safety`; clean before this work.
- The authoritative boundary is `docs/recora-data-tenant-security-privacy.md` §8:
  typed allowlist DTO, denylist, safe logging/hash, and Phase 6 validation immediately
  before each provider call.
- `EntitlementResolution` is consumed as a type contract from
  `lib/recora/entitlement-snapshots.ts`. Its resolver is not invoked by this module;
  its snapshot remains internal.

### Read-only provider and URL inventory

| Path | Confirmed fact | 102-3G decision |
|---|---|---|
| `scripts/run-openai-measurement.ts` | Current legacy OpenAI measurement path reads environment configuration, calls the provider, and persists results. | Not imported, changed, or executed. Phase 6 must introduce its own adapter only after validating this DTO. |
| `scripts/inspect-openai-output.ts` | Direct OpenAI inspection path exists. | Not imported, changed, or executed. |
| `lib/recora/site-inspection.ts` | Existing site inspection owns `fetch` and DNS lookup. | Not imported or executed. Runtime fetch, DNS, SSRF, and rebinding controls remain Phase 6/fetch-layer work. |
| `lib/recora/entitlement-snapshots.ts` | Defines the immutable snapshot resolution union and named policy documents. | Type-only consumption; no resolver, Supabase client, RPC, or DB call. |

## Scope / non-goals

### In scope

- `lib/recora/external-ai-payload-safety.ts`: server-only allowlist builder, safe
  payload brand, entitlement gate, URL/text validation, canonical serialization, and
  SHA-256 hash.
- `scripts/verify-issue-114-external-ai-payload-safety.ts`: local negative verifier.
- This child Exec Plan.

### Non-goals

- DB migration, RLS, seed/reset, Supabase CLI/MCP, database query/write, or any `.env`
  read.
- Provider adapter implementation, OpenAI/external-AI call, queue/worker/retry/budget,
  provider response retention, or deployment.
- URL fetch, DNS resolution, SSRF/DNS-rebinding runtime mitigation, or scraping.
- Changes to `package.json`, lockfiles, the parent Exec Plan, `docs/README.md`, or any
  other Wave worktree/branch/container.
- Ready conversion, merge, deploy, Issue close, or worktree/branch deletion.

## Internal and provider-safe contracts

`ExternalAiExecutionContext` is server-only and retains:

- organization/project scope;
- resolved entitlement snapshot reference/document through `EntitlementResolution`;
- request and correlation IDs;
- payload policy/schema version; and
- public-classification evidence tied to the same organization/project.

The builder requires caller-supplied organization/project values to match both trusted
scope and the public-classification evidence. They, the snapshot ID/hash/document,
correlation ID, billing/contract detail, and any internal metadata are omitted from the
provider-safe DTO.

`ProviderSafePayload` permits only request/schema/policy identifiers, question text,
public target/competitor entities, locale/language, explicitly permitted tools, and
validated public page text. A nominal brand makes this the only payload type accepted by
the provider-neutral `ProviderSafePayloadAdapter<TOutput>` interface.

Public entities permit only `product`, `service`, `store`, `company`, or `brand`, with
bounded public name/domain/URL/aliases/category/description. Unknown keys, database-row
shapes, nested internal fields, and non-plain/accessor objects are rejected.

## Entitlement, privacy, size, and URL policy

The builder fails closed unless the snapshot has a valid reference/schema/hash and:

- `external_ai.execute` is `true`;
- all four limits are finite integers: `external_ai.prompt_bytes`,
  `external_ai.page_text_bytes`, `external_ai.total_payload_bytes`, and
  `external_ai.competitor_count`;
- `external_ai.web_search` is `true` before web search is requested; and
- `external_ai.public_page_text` is `true` before page text is included.

The implementation uses structural limits (depth, object keys, array entries, entity
aliases, and page count) in addition to entitlement byte limits. It scans every input
string and nested key before schema projection, rejects secret/auth/DB/PII/contract/
operator/provider-response patterns, and emits only a fixed error message plus a safe
reason code. It does not log input.

Public page text requires HTTPS source URL, matching public host, explicit `public`
classification, retrieval timestamp, content version, and plain text. Credentials,
non-HTTPS URLs, localhost, `.local`, loopback, private, link-local, carrier-grade NAT,
and benchmarking IP literals are rejected syntactically. There is no fetch or DNS call.

Canonical JSON sorts object keys recursively and preserves array order; SHA-256 of that
canonical representation is deterministic for the same validated payload.

## Risk and safety boundaries

- Highest Risk: `R3` because the interface protects a later provider boundary.
- Allowed changes: only the three paths in Scope.
- Required Git effects: Issue #114 explicitly authorizes commit, normal push, and a
  master-targeted Draft PR after all required validation succeeds.
- Stop conditions: approval scope changes; a required change outside Scope; a merge
  conflict; a validation failure that cannot be resolved in Scope; or a required action
  needing Supabase/DB/provider/network access.
- Secret/data handling: no environment file, credential, token, database URL, prompt,
  or page text is printed. Secret-shaped verifier values are composed at runtime.

## Plan with milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Start gate and inventory | `Completed` | Confirm Issue #114 R3/Local/Full/Execute/Ready; fetch clean base; inspect authority docs and current master statically. | Scope, base, and prohibited operations recorded. |
| M2: Safe payload boundary | `Completed` | Add server-only typed builder and provider-neutral branded DTO. | Internal envelope cannot be the adapter argument; allowlist and hash exist. |
| M3: Negative verification | `Completed` | Dedicated verifier, preflight, typecheck, lint, build, scope, secret scan, lockfile, and commit checks passed. | All mandated commands passed without DB/network use. |
| M4: Handoff | `Completed` | Commit `dc4c809` pushed; Draft PR #116 created. | Draft remains Draft; Issue/parent completion record is next; no merge/close. |

## Validation plan

| Validation | When | Expected result | Actual result / evidence |
|---|---|---|---|
| Dedicated 102-3G verifier | M3 | allowlist, fail-closed entitlement, privacy, limits, URL, and adapter checks pass with no provider/DB/network call | Passed before full validation; repeat in final suite. |
| `npm run recora:preflight:full` | M3 | static Recora checks and typecheck pass; no DB/provider/network operation | Pending |
| `npm run typecheck`, `npm run lint`, `npm run build` | M3 | TypeScript, lint, and production build pass | Pending |
| `git diff --check` and exact changed/staged scope | M3/M4 | no whitespace error; exactly approved files | Pending |
| secret/env/DB URL/token literal scan and lockfile diff | M3 | no unintended sensitive literal or dependency change | Pending |
| `npm run recora:commit-check` | M3/M4 | commit safety gate passes | Pending |

## Phase 6 handoff

Phase 6 must call `buildProviderSafePayload` immediately before every provider call and
pass only `ProviderSafePayload` to its adapter. It must retain provider-specific options
(including any retention control), queue/worker/retry/idempotency/budget behavior, and
the real fetch layer in its own approved scope. This plan deliberately does not claim
runtime DNS-rebinding protection or provider integration.

## Rollback / recovery

- Trigger: a validator defect, unsafe field exposure, or failed required validation.
- Preconditions: stop before provider/DB integration; no persisted data or external
  effects exist in this Issue.
- Steps: revert this isolated commit in a separately approved follow-up, retain the
  existing Phase 6 stop condition, and rerun the local verifier before any replacement.
- Preserved evidence/data: no DB/provider data is created; only Git history and CI logs
  remain.
- Escalation: any request for fetch/DNS, provider call, schema migration, or real
  entitlement resolution needs a separate approved Issue scope.

## Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| 2026-07-30 | M1 | `origin/master` is `a495e55` and contains the specified PR #115 merge SHA; dedicated clean worktree/branch created. | Complete static implementation only. |
| 2026-07-30 | M2 | Added allowlist builder, branded provider DTO, entitlement gate, canonical hash, and local negative verifier. No DB/network/provider path imported or called. | Run full required validation. |

## Decision log

| Date | Decision | Rationale / evidence | Impact |
|---|---|---|---|
| 2026-07-30 | Keep entitlement resolution opaque and internal. | Issue #114 forbids snapshot ID/hash/document in provider payload and requires 102-3D consumption. | Provider payload cannot expose plan/contract/snapshot data. |
| 2026-07-30 | Validate URL syntax only. | Issue #114 explicitly assigns fetch/DNS/SSRF runtime work to Phase 6. | No URL/DNS/network operation is introduced. |
| 2026-07-30 | Use a branded DTO for the adapter boundary. | Adapter must receive validated payload only, not raw/internal/unknown input. | Phase 6 gets a provider-neutral compile-time contract. |

## Results and remaining risks

### Results

- Completed: `dc4c809` contains the dedicated module, verifier, and child Exec Plan;
  Draft PR #116 targets `master` and remains Draft.
- Dedicated verifier, `recora:preflight:full`, `typecheck`, `lint`, `build`, diff and
  staged-scope checks, literal scan, lockfile check, and `recora:commit-check` passed.
- No Supabase/DB, provider, URL/DNS, deploy, or production operation was used.

### Remaining risks

- The validator is a Phase 3 foundation only. Phase 6 must still integrate it at every
  real provider call and own fetch/DNS/SSRF runtime controls.
- No DB/Supabase/provider/network behavior is verified by design; this Issue does not
  authorize such verification.
