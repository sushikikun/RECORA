-- RECORA ADMIN P0 CRITICAL CONSTRAINT BLUEPRINT v1.0
-- DESIGN REFERENCE ONLY. This is NOT a Supabase migration and must not be applied directly.
-- Create actual files with: supabase migration new <migration_stem>

-- Private read schema: browser roles receive no access.
create schema if not exists admin_read;
revoke all on schema admin_read from public, anon, authenticated;

-- Examples of canonical partial uniqueness. Object creation order is defined
-- in recora_admin_p0_migration_plan_v1.md.

create unique index <name_contract_active>
on recora_private.admin_contract_versions (contract_id)
where status = 'active';

create unique index <name_contract_scheduled>
on recora_private.admin_contract_versions (contract_id)
where status = 'scheduled';

create unique index <name_project_active_entitlement>
on recora_private.admin_project_entitlements (project_id)
where status = 'active';

create unique index <name_project_active_configuration>
on recora_private.admin_project_configuration_revisions (project_id)
where status = 'active';

create unique index <name_project_nonterminal_configuration>
on recora_private.admin_project_configuration_revisions (project_id)
where status in ('building','quality_checking','ready');

create unique index <name_formal_cycle_per_business_date>
on recora_private.admin_measurement_cycles (project_id, business_date)
where purpose = 'formal_daily';

create unique index <name_cycle_building_revision>
on recora_private.admin_measurement_cycle_revisions (measurement_cycle_id)
where status = 'building';

create unique index <name_project_nonterminal_generation_run>
on recora_private.admin_publication_candidate_generation_runs (project_id)
where status in ('queued','running');

create unique index <name_unresolved_quality_case>
on recora_private.admin_quality_exception_cases (project_id, deduplication_key)
where status <> 'resolved';

create unique index <name_project_nonterminal_publication_operation>
on recora_private.admin_publication_operations (project_id)
where status in ('queued','running');

create unique index <name_unresolved_incident_fingerprint>
on recora_private.admin_incidents (incident_fingerprint)
where status <> 'resolved';

create unique index <name_nonterminal_recovery_plan>
on recora_private.admin_incident_recovery_plans (incident_id)
where status in ('draft','ready','running','verifying');

-- Current publication must be a pointer, never a duplicated is_current flag.
-- Version creation + candidate consumed + pointer switch belongs in one command transaction.

-- All new private tables:
--   alter table ... enable row level security;
--   revoke all on ... from public, anon, authenticated;
-- SECURITY DEFINER functions must use SET search_path = '' and explicit grants.
