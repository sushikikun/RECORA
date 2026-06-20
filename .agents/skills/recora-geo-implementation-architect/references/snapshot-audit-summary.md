# Snapshot Audit Summary

## CONFIRMED_FROM_FILES

- Read-only snapshot root exists at `tmp/recora-code-snapshot/`.
- Inventory CSV exists at `tmp/recora-code-snapshot-inventory.csv`.
- Snapshot contains `package.json`, `tsconfig.json`, `scripts/generate-recommendation-candidates.ts`, `output/recommendation-candidates/recommendation-candidates.json`, `output/recommendation-candidates/recommendation-candidates.md`, `supabase/config.toml`, `supabase/seed.sql`, and three Supabase migration files.
- Snapshot contains `supabase/migrations/0001_recora_v01_schema.sql`, `0002_recora_ai_output_fields.sql`, and `0003_recora_metric_snapshot_metadata.sql`.
- Snapshot does not contain `database.types.ts` or another obvious generated Supabase TypeScript type file.
- Snapshot does not contain a separate schema or db directory beyond `supabase/migrations` and `supabase/seed.sql`.
- Snapshot file-name scan found no secret-like filenames such as `.env`, credential, cookie, token, private key, `.pem`, `.p12`, `.pfx`, `.npmrc`, or `.netrc`.
- Migration 0001 creates these public tables: `projects`, `brands`, `personas`, `topics`, `prompts`, `ai_models`, `measurement_runs`, `run_items`, `ai_conversations`, `source_domains`, `brand_mentions`, `citations`, `metric_snapshots`, and `recommendations`.
- Migration 0001 creates enum types for brand type, priority, run status, run item status, recommendation status, sentiment, source type, metric scope type, recommendation type, and recommendation state.
- Migration 0002 adds provider/output fields to `ai_conversations`, extraction fields to `brand_mentions`, citation normalization fields to `citations`, and indexes for provider response IDs, citation status, mention confidence, canonical URLs, brand relatedness, and citation spans.
- Migration 0003 adds `metadata jsonb` to `measurement_runs` and `metric_snapshots`.
- RLS is explicitly not enabled in the inspected migrations; no `create policy` statements were found.
- Candidate output has 3 candidates and top-level keys including `generated_at`, `measurement_run_id`, `candidate_count`, `candidates`, `db_write_status`, and `db_write_check`.
- Candidate output lacks explicit top-level `schema_version`, `generator_version`, `parser_version`, and `review_version`.
- Candidate output uses `display_decision: "show"` and `should_save_to_recommendations: "review_required"` for all three inspected candidates.

## USER_PROVIDED_CONTEXT

- The requested target package is `skill-patches/recora-geo-implementation-architect-v0.4-real-db-schema-calibration/`.
- The work is read-only inspection and patch creation only.
- Existing skills, RECORA app code, backend, database, migrations, LP, CLI, production files, secrets, and login/session artifacts are out of scope for edits or access.

## NEEDS_VERIFICATION

- `database.types.ts` and generated Supabase types were not present in the snapshot.
- Runtime database state was not inspected and no database command was run.
- Applied migration order, drift, grants, production RLS, and actual tenant isolation remain unverified.
- Existing application code outside the copied snapshot was not inspected for persistence behavior.
- `supabase/seed.sql` was treated as fixture data, not as authoritative schema.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Treat inspected migrations as the only confirmed schema source in this patch.
- Treat candidate JSON fields as output payload fields, not DB columns, unless a migration confirms the persistence target.
- Separate raw evidence storage from candidate drafts, quality-gate reviews, and published recommendations.
- Add explicit persistence targets for source-to-claim reviews, quality-gate reviews, idempotent candidate generation, provider execution state, version fields, and remeasurement tasks before production use.
- Require policy inspection before any claim that Recora persistence is tenant-safe.

## DO_NOT_ASSUME

- Do not assume generated Supabase types exist.
- Do not assume RLS or policies are active.
- Do not assume `display_decision` is quality-gate approval.
- Do not assume `recommendations` is the correct table for draft candidates, gate decisions, rejections, or published recommendations.
- Do not assume candidate JSON field names are database columns.
- Do not assume `provider_status` or `citation_status` proves evidence quality.
