# Recora Fixed Prompt Materialization CLI v1

Issue: #159
Source plan: `docs/exec-plans/active/issue-152-fixed-prompt-materialization-finalization.md`
Pure contract: `docs/architecture/measurement-design/recora_fixed_prompt_materialization_v1.md`
Contract version: `recora_fixed_prompt_configuration_v1`

## Scope

The B2 CLI is a Local-only transactional materializer for an approved `ProjectSetupDraft`.

```text
approved ProjectSetupDraft
-> B1 pure materialization plan
-> existing empty Project lock
-> Persona / Topic / Prompt inserts
-> persisted Prompt canonical reconstruction
-> hash and count comparison
-> Project finalization update
```

It does not create Organization, Project, Brand, application tables, migrations, seed data, RPCs, UI, API, provider calls, measurement runtime integration, bootstrap writer integration, or Admin command integration.

## Command

```text
npm run recora:project-setup-materialization -- --input <approved ProjectSetupDraft JSON> --project-slug <existing target slug>
npm run recora:project-setup-materialization -- --input <approved ProjectSetupDraft JSON> --project-slug <existing target slug> --execute
```

The default is dry-run. `--execute` is required for writes. `--dry-run` and `--execute` are mutually exclusive.

## Local Boundary

The command accepts only a local PostgreSQL `RECORA_DATABASE_URL`; connection string values are never printed. Execute and DB-backed dry-run require the dedicated Unit B2 local identity:

```text
RECORA_LOCAL_SUPABASE_PROJECT_ID=recora-fixed-prompt-unit-b2
RECORA_LOCAL_SUPABASE_DB_CONTAINER=supabase_db_recora-fixed-prompt-unit-b2
```

The command rejects a linked Supabase marker in the repo worktree and verifies that the expected Docker DB container exists, is running, and publishes `5432/tcp` on the exact effective port in `RECORA_DATABASE_URL`. If Docker exposes a Supabase project or Compose project label, the label must match `recora-fixed-prompt-unit-b2`. `--execute` also passes `isWrite: true` into the shared Recora DB write guard before any database connection is opened, so another local PostgreSQL port fails closed before connect. Remote, linked, and production Supabase are out of scope.

## Target Project

The target must already exist and must already have Organization, ownership membership, and persisted active Brand rows. B2 never creates those rows.

The active primary Brand must be exactly one row. Its `name`, `domain`, and `aliases` are read after the Project row is locked and must match the Draft brand identity (`brandName`, `serviceName`, `officialSiteUrl`, and aliases) using the same conservative separator-insensitive identity rules as B1. A mismatch fails with `project_primary_brand_identity_mismatch`.

When both Draft and persisted primary Brand provide a domain or official hostname, B2 requires exact normalized-domain agreement. Domain normalization is closed and deterministic: NFKC, trim, lowercase, URL-to-hostname extraction, no scheme/path/query/fragment/port, trailing dot removal, and leading `www.` equivalence only. It does not remove arbitrary subdomains. A primary domain conflict fails with `project_primary_brand_domain_mismatch` even when `name` or `aliases` overlap.

Active competitor Brands are authority too. Their `name`, `domain`, and `aliases` are conservatively merged into the B1 `knownCompetitors` / `knownCompetitorAliases` context before materialization. An approved Draft competitor must correspond to an active Project competitor Brand; otherwise B2 fails closed with `draft_competitor_missing_active_project_brand`. When both the approved Draft competitor and matched active Project competitor provide domains, the same exact normalized-domain agreement is required; a shared name or alias cannot override a domain conflict, which fails with `draft_competitor_domain_mismatch`.

Project `language` and `region` are bound to the Draft. `language` must match exactly after normalization. `draft.seedInput.regions` must canonicalize and deduplicate to exactly one distinct canonical Draft region. The closed mapping includes `JP` / `Japan` / `JPN` -> `JP` and `US` / `USA` / `United States` -> `US`; zero or multiple distinct Draft regions fail with `draft_multiple_regions_not_supported`, and a Project mismatch fails with `project_region_mismatch`.

The Project must be unfinalized and empty:

```text
prompt_configuration_finalized_at = null
prompt_configuration_hash = null
prompt_configuration_contract_version = null
prompt_configuration_count = null
Persona count = 0
Topic count = 0
Prompt count = 0
```

Already finalized Projects, partial finalization state, missing target, slug mismatch, missing ownership/primary Brand, or any existing Persona/Topic/Prompt row fail closed.

## Transaction

`--execute` runs on one PostgreSQL connection inside one transaction.

1. `begin`
2. read target Project by slug `FOR UPDATE`
3. verify Project exists, slug matches, finalization fields are all null, and target counts are all zero
4. regenerate the B1 plan using the DB Project ID
5. insert deterministic Persona rows from B1 source mappings
6. insert deterministic Topic rows from B1 source mappings
7. insert deterministic Prompt rows with core fields, compatibility fields, and Unit A metadata fields
8. read persisted Prompt rows back from the DB
9. reconstruct the B1 canonical payload from persisted rows
10. compare persisted prompt count and lowercase SHA-256 hash to expected B1 values
11. compare persisted Prompt fields to the expected B1 canonical Prompt objects
12. update the Project finalization 4 columns in one statement
13. re-read finalized Project and persisted Prompt hash
14. `commit`

The finalization update is last. No upsert, automatic overwrite, cleanup, partial retry, or post-finalization Prompt mutation is used.

## Output

Success output is safe JSON containing only mode, project slug/id, local target identity, planned counts, contract version, hash, source mappings, write counts, and finalization summary. It does not include DB URLs, passwords, tokens, provider responses, or external measurement data.

## Verification

The DB-dependent B2 verifier is:

```text
npm run recora:project-setup-materialization:check
```

It is not part of `recora:preflight` or `recora:preflight:full`, because ordinary Cloud CI does not have the dedicated Local Supabase DB. The verifier covers dry-run write 0, success, persisted Prompt field/hash/count checks, rerun failure, finalized/non-empty failure, UUID conflict rollback, halfway Prompt rollback, test-only trigger hash mismatch rollback, Project A/B separation, concurrent execute, container stopped and port mismatch negative tests, persisted primary Brand mismatch, primary Brand domain conflict, DB-only competitor contamination, Draft competitor missing DB registration, Draft competitor domain conflict, valid Brand authority match, one-sided domain identity match, Project language mismatch, Project region mismatch, multi-region Draft rejection, canonical region synonym match, matching locale, RLS/grant/helper inventory, and service_role TRUNCATE=false.
