# Actual DB Artifact Inventory

## CONFIRMED_FROM_FILES

| Artifact | Present | Evidence | Calibration note |
| --- | --- | --- | --- |
| `package.json` | yes | snapshot root | Next.js app metadata and scripts only; not schema evidence. |
| `scripts/generate-recommendation-candidates.ts` | yes | snapshot `scripts/` | Reads selected tables and writes JSON/MD output; not a migration. |
| `output/recommendation-candidates/` | yes | snapshot `output/` | Contains generated candidate payloads; not DB schema. |
| `supabase/migrations/` | yes | snapshot `supabase/migrations/` | Primary confirmed schema evidence. |
| `database.types.ts` | no | file inventory | Generated Supabase TS types unavailable. |
| generated Supabase types | no | file inventory | Type/schema drift cannot be checked. |
| schema/db files outside Supabase | no | file inventory | No separate ORM schema was found. |
| RLS policy definitions | no active policies found | migration search | Migrations state RLS is unchanged/not enabled; no `create policy` evidence. |
| recommendation-related types | partial | migrations | `recommendations` table and recommendation enums exist, but candidate/gate split is absent. |
| citation-related types | partial | migrations | `citations` exists with canonical URL, raw citation JSON, span, brand relatedness, and nullable support flag. |
| brand mention types | partial | migrations | `brand_mentions` exists with mention count, first index, evidence snippet, confidence, and matched alias. |
| secret-like files | none by filename scan | file inventory | No secret-like file names were found; secret contents were not searched in excluded files. |

## CONFIRMED_FROM_FILES

Snapshot files:

- `package.json` - 886 bytes.
- `tsconfig.json` - 616 bytes.
- `output/recommendation-candidates/recommendation-candidates.json` - 152771 bytes.
- `output/recommendation-candidates/recommendation-candidates.md` - 14851 bytes.
- `scripts/generate-recommendation-candidates.ts` - 86603 bytes.
- `supabase/.gitignore` - 72 bytes.
- `supabase/config.toml` - 15489 bytes.
- `supabase/seed.sql` - 43867 bytes.
- `supabase/.branches/_current_branch` - 4 bytes.
- `supabase/.temp/cli-latest` - 8 bytes.
- `supabase/migrations/0001_recora_v01_schema.sql` - 19623 bytes.
- `supabase/migrations/0002_recora_ai_output_fields.sql` - 10218 bytes.
- `supabase/migrations/0003_recora_metric_snapshot_metadata.sql` - 2171 bytes.

## USER_PROVIDED_CONTEXT

- Inspect the copied code snapshot before creating v0.4 DB/schema calibration.
- Write only to the v0.4 patch package.

## NEEDS_VERIFICATION

- Generated types are absent, so application type contracts cannot be compared to migrations.
- Runtime grants, publications, exposed API surface, and tenant context are not confirmed.
- Hidden Supabase local metadata files were listed only; they are not schema authority.
- DB schema not fully inspected. Exact tables, columns, constraints, policies, and indexes remain NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Treat migrations as authoritative for confirmed schema facts.
- Treat seed rows and candidate JSON as fixtures or observed outputs.
- Require a generated type artifact before approving code that depends on exact Supabase row shapes.

## DO_NOT_ASSUME

- Do not use `seed.sql` to infer missing constraints or policies.
- Do not use candidate output counts as proof of database completeness.
- Do not classify secret safety from content that was intentionally not opened.
