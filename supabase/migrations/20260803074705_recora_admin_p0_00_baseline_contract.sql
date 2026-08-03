-- Recora Admin P0 / M00 baseline contract.
--
-- Purpose:
-- - Fail closed when the current database no longer matches the approved baseline.
-- - Inventory legacy recora_admin rows without converting them into Canonical state.
-- - Pin the Canonical package, physical schema plan, ordered migration set, and
--   repository baseline in one append-only private record.
--
-- Boundary:
-- - This migration creates only recora_private.admin_p0_schema_versions.
-- - It does not alter customer, project, contract, measurement, publication,
--   incident, entitlement, operator, audit, or legacy operational rows.
-- - It grants no browser access and performs no remote/production operation.

set search_path = public, extensions;

-- Inventory must run before the first persistent write in this migration.
do $admin_p0_baseline_inventory$
declare
  required_schema text;
  required_relation text;
  required_function text;
  required_p4b_function text;
  missing_columns text[];
  invalid_count bigint;
  legacy_counts jsonb;
begin
  foreach required_schema in array array[
    'public',
    'recora_private',
    'recora_operator',
    'recora_audit',
    'recora_admin'
  ] loop
    if not exists (
      select 1
      from pg_namespace namespace_row
      where namespace_row.nspname = required_schema
    ) then
      raise exception 'Recora Admin P0 M00 baseline failed: required schema % is missing', required_schema;
    end if;
  end loop;

  foreach required_relation in array array[
    'public.organizations',
    'public.organization_members',
    'public.projects',
    'public.brands',
    'public.personas',
    'public.topics',
    'public.prompts',
    'public.ai_models',
    'public.measurement_runs',
    'public.run_items',
    'public.ai_conversations',
    'public.source_domains',
    'public.brand_mentions',
    'public.citations',
    'public.metric_snapshots',
    'public.recommendations',
    'recora_private.plan_policy_versions',
    'recora_private.entitlement_snapshots',
    'recora_private.current_entitlement_snapshots',
    'recora_private.p4_command_receipts',
    'recora_private.p4_command_conflicts',
    'recora_private.p4_invitations',
    'recora_private.p4_invitation_events',
    'recora_private.p4_membership_episodes',
    'recora_private.p4_membership_episode_events',
    'recora_private.p4_contract_projections',
    'recora_private.p4_contract_events',
    'recora_private.p4_downstream_checkpoints',
    'recora_operator.operator_identities',
    'recora_operator.operator_action_grants',
    'recora_operator.operator_command_receipts',
    'recora_audit.operator_events',
    'recora_admin.plan_configs',
    'recora_admin.customer_profiles',
    'recora_admin.customer_subscriptions',
    'recora_admin.diagnostic_intakes',
    'recora_admin.measurement_schedules',
    'recora_admin.operation_events',
    'recora_admin.measurement_batches',
    'recora_admin.measurement_batch_items',
    'recora_admin.report_publication_reviews',
    'recora_admin.prompt_change_events',
    'recora_admin.internal_notes'
  ] loop
    if to_regclass(required_relation) is null then
      raise exception 'Recora Admin P0 M00 baseline failed: required relation % is missing', required_relation;
    end if;
  end loop;

  foreach required_function in array array[
    'public.set_updated_at()',
    'recora_private.is_organization_member(uuid)',
    'recora_private.resolve_unambiguous_organization_id()',
    'recora_private.p4_assert_legacy_inventory()',
    'recora_private.p4_reject_history_mutation()',
    'public.recora_resolve_current_entitlement_snapshot(uuid,uuid)',
    'public.recora_p4_resolve_checkpoint_gate(uuid,uuid)'
  ] loop
    if to_regprocedure(required_function) is null then
      raise exception 'Recora Admin P0 M00 baseline failed: required function % is missing', required_function;
    end if;
  end loop;

  foreach required_p4b_function in array array[
    'recora_private.p4b_try_p4_command_replay',
    'public.recora_p4b_invitation_create',
    'public.recora_p4b_invitation_resend',
    'public.recora_p4b_invitation_revoke',
    'public.recora_p4b_invitation_accept',
    'public.recora_p4b_membership_suspend',
    'public.recora_p4b_membership_reactivate',
    'public.recora_p4b_membership_revoke',
    'public.recora_p4b_resolve_customer_access'
  ] loop
    if not exists (
      select 1
      from pg_proc function_row
      join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
      where namespace_row.nspname = split_part(required_p4b_function, '.', 1)
        and function_row.proname = split_part(required_p4b_function, '.', 2)
    ) then
      raise exception 'Recora Admin P0 M00 baseline failed: required P4-B function % is missing', required_p4b_function;
    end if;
  end loop;

  select array_agg(format('%I.%I.%I', required.schema_name, required.table_name, required.column_name))
  into missing_columns
  from (
    values
      ('public', 'organizations', 'id'),
      ('public', 'organizations', 'slug'),
      ('public', 'organizations', 'name'),
      ('public', 'organizations', 'data_environment'),
      ('public', 'organizations', 'is_demo'),
      ('public', 'projects', 'id'),
      ('public', 'projects', 'organization_id'),
      ('public', 'projects', 'slug'),
      ('public', 'organization_members', 'id'),
      ('public', 'organization_members', 'organization_id'),
      ('public', 'organization_members', 'user_id'),
      ('public', 'organization_members', 'role'),
      ('public', 'organization_members', 'accepted_at'),
      ('public', 'organization_members', 'membership_status'),
      ('public', 'prompts', 'prompt_type'),
      ('public', 'prompts', 'measurement_purpose'),
      ('public', 'ai_models', 'id'),
      ('public', 'ai_models', 'provider'),
      ('public', 'ai_models', 'model_name'),
      ('public', 'measurement_runs', 'id'),
      ('public', 'measurement_runs', 'project_id'),
      ('public', 'measurement_runs', 'metadata'),
      ('recora_private', 'plan_policy_versions', 'id'),
      ('recora_private', 'plan_policy_versions', 'policy_key'),
      ('recora_private', 'plan_policy_versions', 'policy_schema_version'),
      ('recora_private', 'plan_policy_versions', 'policy_hash'),
      ('recora_private', 'entitlement_snapshots', 'id'),
      ('recora_private', 'entitlement_snapshots', 'organization_id'),
      ('recora_private', 'entitlement_snapshots', 'project_id'),
      ('recora_private', 'entitlement_snapshots', 'plan_policy_version_id'),
      ('recora_private', 'entitlement_snapshots', 'resolved_document'),
      ('recora_private', 'entitlement_snapshots', 'document_hash'),
      ('recora_private', 'current_entitlement_snapshots', 'organization_id'),
      ('recora_private', 'current_entitlement_snapshots', 'project_id'),
      ('recora_private', 'current_entitlement_snapshots', 'snapshot_id'),
      ('recora_private', 'p4_command_receipts', 'organization_id'),
      ('recora_private', 'p4_command_receipts', 'project_id'),
      ('recora_private', 'p4_command_receipts', 'source_kind'),
      ('recora_private', 'p4_command_receipts', 'operator_audit_event_id'),
      ('recora_private', 'p4_command_receipts', 'operator_command_receipt_id'),
      ('recora_private', 'p4_command_receipts', 'customer_auth_user_id'),
      ('recora_private', 'p4_invitations', 'id'),
      ('recora_private', 'p4_invitations', 'organization_id'),
      ('recora_private', 'p4_invitations', 'recipient_binding_hash'),
      ('recora_private', 'p4_invitations', 'state'),
      ('recora_private', 'p4_invitations', 'intended_role'),
      ('recora_private', 'p4_invitations', 'expires_at'),
      ('recora_private', 'p4_invitations', 'accepted_user_id'),
      ('recora_private', 'p4_invitations', 'accepted_membership_id'),
      ('recora_private', 'p4_membership_episodes', 'id'),
      ('recora_private', 'p4_membership_episodes', 'organization_id'),
      ('recora_private', 'p4_membership_episodes', 'invitation_id'),
      ('recora_private', 'p4_membership_episodes', 'membership_id'),
      ('recora_private', 'p4_membership_episodes', 'accepted_user_id'),
      ('recora_private', 'p4_membership_episodes', 'intended_role'),
      ('recora_private', 'p4_membership_episodes', 'state'),
      ('recora_private', 'p4_contract_projections', 'id'),
      ('recora_private', 'p4_contract_projections', 'organization_id'),
      ('recora_private', 'p4_contract_projections', 'project_id'),
      ('recora_private', 'p4_contract_projections', 'state'),
      ('recora_private', 'p4_contract_projections', 'plan_policy_version_id'),
      ('recora_private', 'p4_contract_projections', 'entitlement_snapshot_id'),
      ('recora_private', 'p4_contract_projections', 'version'),
      ('recora_operator', 'operator_identities', 'auth_user_id'),
      ('recora_operator', 'operator_identities', 'status'),
      ('recora_operator', 'operator_action_grants', 'operator_id'),
      ('recora_operator', 'operator_action_grants', 'permission'),
      ('recora_operator', 'operator_action_grants', 'organization_id'),
      ('recora_operator', 'operator_action_grants', 'project_id'),
      ('recora_operator', 'operator_action_grants', 'revoked_at'),
      ('recora_audit', 'operator_events', 'id'),
      ('recora_audit', 'operator_events', 'actor_operator_id'),
      ('recora_audit', 'operator_events', 'organization_id'),
      ('recora_audit', 'operator_events', 'project_id'),
      ('recora_audit', 'operator_events', 'action'),
      ('recora_audit', 'operator_events', 'request_id'),
      ('recora_audit', 'operator_events', 'correlation_id'),
      ('recora_audit', 'operator_events', 'outcome')
  ) as required(schema_name, table_name, column_name)
  left join information_schema.columns actual
    on actual.table_schema = required.schema_name
   and actual.table_name = required.table_name
   and actual.column_name = required.column_name
  where actual.column_name is null;

  if missing_columns is not null then
    raise exception 'Recora Admin P0 M00 baseline failed: required columns are missing: %', array_to_string(missing_columns, ', ');
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'organization_id'
      and is_nullable <> 'NO'
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: public.projects.organization_id must be NOT NULL';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'membership_status'
      and is_nullable <> 'NO'
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: organization membership status must be NOT NULL';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.projects'::regclass
      and constraint_row.conname = 'projects_id_organization_id_unique'
      and constraint_row.convalidated is true
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: project tenant candidate key is missing or unvalidated';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.organization_members'::regclass
      and constraint_row.conname = 'organization_members_status_consistency_check'
      and constraint_row.convalidated is true
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: membership status consistency constraint is missing or unvalidated';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    where constraint_row.conrelid = 'public.organization_members'::regclass
      and constraint_row.conname = 'organization_members_acceptance_identity_check'
      and constraint_row.convalidated is true
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: membership acceptance identity constraint is missing or unvalidated';
  end if;



  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organization_members'
      and column_name = 'invitation_expires_at'
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: invitation expiry must remain in P4 invitation authority, not organization_members';
  end if;

  if not exists (
    select 1
    from pg_enum enum_row
    join pg_type type_row on type_row.oid = enum_row.enumtypid
    join pg_namespace namespace_row on namespace_row.oid = type_row.typnamespace
    where namespace_row.nspname = 'recora_private'
      and type_row.typname = 'p4_source_kind'
      and enum_row.enumlabel = 'customer_session'
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: P4-B customer_session source kind is missing';
  end if;

  foreach required_function in array array[
    'p4_command_receipt_actor_shape',
    'p4_command_receipts_customer_auth_user_id_fkey',
    'p4_invitation_state_shape'
  ] loop
    if not exists (
      select 1
      from pg_constraint constraint_row
      where constraint_row.conrelid = case required_function
        when 'p4_invitation_state_shape' then 'recora_private.p4_invitations'::regclass
        else 'recora_private.p4_command_receipts'::regclass
      end
        and constraint_row.conname = required_function
        and constraint_row.convalidated is true
    ) then
      raise exception 'Recora Admin P0 M00 baseline failed: P4-B constraint % is missing or unvalidated', required_function;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_indexes index_row
    where index_row.schemaname = 'recora_private'
      and index_row.indexname = 'p4_single_pending_invitation_per_recipient'
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: P4 pending invitation uniqueness index is missing';
  end if;

  select count(*)
  into invalid_count
  from recora_private.p4_command_receipts receipt_row
  where not (
    (
      receipt_row.source_kind::text = 'manual'
      and receipt_row.operator_audit_event_id is not null
      and receipt_row.operator_command_receipt_id is not null
      and receipt_row.customer_auth_user_id is null
    )
    or (
      receipt_row.source_kind::text = 'customer_session'
      and receipt_row.customer_auth_user_id is not null
      and receipt_row.operator_audit_event_id is null
      and receipt_row.operator_command_receipt_id is null
    )
    or (
      receipt_row.source_kind::text = 'provider_fixture'
      and receipt_row.customer_auth_user_id is null
      and (
        (receipt_row.operator_audit_event_id is null and receipt_row.operator_command_receipt_id is null)
        or (receipt_row.operator_audit_event_id is not null and receipt_row.operator_command_receipt_id is not null)
      )
    )
  );

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % P4 command receipt(s) violate actor evidence shape', invalid_count;
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.proname = any(array[
        'recora_p4b_invitation_create',
        'recora_p4b_invitation_resend',
        'recora_p4b_invitation_revoke',
        'recora_p4b_invitation_accept',
        'recora_p4b_membership_suspend',
        'recora_p4b_membership_reactivate',
        'recora_p4b_membership_revoke',
        'recora_p4b_resolve_customer_access'
      ])
      and (
        function_row.prosecdef is false
        or not (function_row.proconfig @> array['search_path=""']::text[])
        or has_function_privilege('anon', function_row.oid, 'EXECUTE')
        or (
          function_row.proname = 'recora_p4b_invitation_accept'
          and (
            not has_function_privilege('authenticated', function_row.oid, 'EXECUTE')
            or has_function_privilege('service_role', function_row.oid, 'EXECUTE')
          )
        )
        or (
          function_row.proname <> 'recora_p4b_invitation_accept'
          and (
            has_function_privilege('authenticated', function_row.oid, 'EXECUTE')
            or not has_function_privilege('service_role', function_row.oid, 'EXECUTE')
          )
        )
      )
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: P4-B public RPC security/grant boundary is not hardened';
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname like 'p4b\_%' escape '\'
      and (
        has_function_privilege('anon', function_row.oid, 'EXECUTE')
        or has_function_privilege('authenticated', function_row.oid, 'EXECUTE')
      )
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: a private P4-B helper is browser-executable';
  end if;

  if exists (
    select 1
    from pg_class relation_row
    join pg_namespace namespace_row on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = 'public'
      and relation_row.relname = any(array[
        'organizations',
        'organization_members',
        'projects',
        'brands',
        'personas',
        'topics',
        'prompts',
        'ai_models',
        'measurement_runs',
        'run_items',
        'ai_conversations',
        'source_domains',
        'brand_mentions',
        'citations',
        'metric_snapshots',
        'recommendations'
      ])
      and relation_row.relkind = 'r'
      and relation_row.relrowsecurity is false
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: one or more exposed public tables do not have RLS enabled';
  end if;

  if exists (
    select 1
    from (
      values
        ('recora_private', 'plan_policy_versions'),
        ('recora_private', 'entitlement_snapshots'),
        ('recora_private', 'current_entitlement_snapshots'),
        ('recora_private', 'p4_command_receipts'),
        ('recora_private', 'p4_command_conflicts'),
        ('recora_private', 'p4_invitations'),
        ('recora_private', 'p4_invitation_events'),
        ('recora_private', 'p4_membership_episodes'),
        ('recora_private', 'p4_membership_episode_events'),
        ('recora_private', 'p4_contract_projections'),
        ('recora_private', 'p4_contract_events'),
        ('recora_private', 'p4_downstream_checkpoints'),
        ('recora_operator', 'operator_identities'),
        ('recora_operator', 'operator_action_grants'),
        ('recora_operator', 'operator_command_receipts'),
        ('recora_audit', 'operator_events'),
        ('recora_admin', 'plan_configs'),
        ('recora_admin', 'customer_profiles'),
        ('recora_admin', 'customer_subscriptions'),
        ('recora_admin', 'diagnostic_intakes'),
        ('recora_admin', 'measurement_schedules'),
        ('recora_admin', 'operation_events'),
        ('recora_admin', 'measurement_batches'),
        ('recora_admin', 'measurement_batch_items'),
        ('recora_admin', 'report_publication_reviews'),
        ('recora_admin', 'prompt_change_events'),
        ('recora_admin', 'internal_notes')
    ) as private_relation(schema_name, table_name)
    where has_table_privilege(
      'anon',
      format('%I.%I', private_relation.schema_name, private_relation.table_name),
      'SELECT'
    )
      or has_table_privilege(
        'authenticated',
        format('%I.%I', private_relation.schema_name, private_relation.table_name),
        'SELECT'
      )
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: a private baseline table is browser-readable';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = 'is_organization_member'
      and function_row.prosecdef is true
      and function_row.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: effective membership predicate is not hardened';
  end if;

  if not exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'recora_private'
      and function_row.proname = 'resolve_unambiguous_organization_id'
      and function_row.prosecdef is true
      and function_row.proconfig @> array['search_path=""']::text[]
  ) then
    raise exception 'Recora Admin P0 M00 baseline failed: implicit tenant resolver is not hardened';
  end if;

  select count(*)
  into invalid_count
  from public.projects project_row
  left join public.organizations organization_row
    on organization_row.id = project_row.organization_id
  where project_row.organization_id is null
     or organization_row.id is null;

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % project row(s) have missing or orphan tenant ownership', invalid_count;
  end if;

  select count(*)
  into invalid_count
  from (
    select project_row.id, project_row.organization_id
    from public.projects project_row
    group by project_row.id, project_row.organization_id
    having count(*) > 1
  ) duplicate_project;

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % duplicate project tenant candidate key(s) found', invalid_count;
  end if;

  select count(*)
  into invalid_count
  from public.organization_members member_row
  left join public.organizations organization_row
    on organization_row.id = member_row.organization_id
  where organization_row.id is null
     or (member_row.accepted_at is not null and member_row.user_id is null)
     or (
       member_row.membership_status::text in ('active', 'suspended')
       and (member_row.user_id is null or member_row.accepted_at is null)
     )
     or (
       member_row.membership_status::text = 'invited'
       and member_row.accepted_at is not null
     );

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % contradictory or orphan membership row(s) found', invalid_count;
  end if;

  select count(*)
  into invalid_count
  from recora_private.current_entitlement_snapshots pointer_row
  left join recora_private.entitlement_snapshots snapshot_row
    on snapshot_row.id = pointer_row.snapshot_id
  where snapshot_row.id is null
     or snapshot_row.organization_id is distinct from pointer_row.organization_id
     or snapshot_row.project_id is distinct from pointer_row.project_id;

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % current entitlement pointer(s) have mismatched scope', invalid_count;
  end if;

  select count(*)
  into invalid_count
  from recora_private.p4_contract_projections contract_row
  left join public.projects project_row
    on project_row.id = contract_row.project_id
   and project_row.organization_id = contract_row.organization_id
  left join recora_private.entitlement_snapshots snapshot_row
    on snapshot_row.id = contract_row.entitlement_snapshot_id
   and snapshot_row.organization_id = contract_row.organization_id
  where (
      contract_row.project_id is not null
      and project_row.id is null
    )
    or (
      contract_row.entitlement_snapshot_id is not null
      and (
        snapshot_row.id is null
        or snapshot_row.project_id is distinct from contract_row.project_id
      )
    )
    or (
      (contract_row.plan_policy_version_id is null)
      <> (contract_row.entitlement_snapshot_id is null)
    );

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % P4 contract projection(s) have contradictory scope or entitlement binding', invalid_count;
  end if;

  select count(*)
  into invalid_count
  from recora_operator.operator_action_grants grant_row
  left join public.projects project_row
    on project_row.id = grant_row.project_id
   and project_row.organization_id = grant_row.organization_id
  where grant_row.project_id is not null
    and (
      grant_row.organization_id is null
      or project_row.id is null
    );

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % operator action grant(s) have invalid project scope', invalid_count;
  end if;

  select count(*)
  into invalid_count
  from recora_audit.operator_events audit_row
  left join public.projects project_row
    on project_row.id = audit_row.project_id
   and project_row.organization_id = audit_row.organization_id
  where audit_row.project_id is not null
    and (
      audit_row.organization_id is null
      or project_row.id is null
    );

  if invalid_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: % operator audit event(s) have invalid project scope', invalid_count;
  end if;

  -- Reuse the existing P4 fail-closed legacy contract. This reads only; it does
  -- not convert mutable legacy rows into Canonical contract or entitlement state.
  perform recora_private.p4_assert_legacy_inventory();

  select jsonb_build_object(
    'plan_configs', (select count(*) from recora_admin.plan_configs),
    'customer_profiles', (select count(*) from recora_admin.customer_profiles),
    'customer_subscriptions', (select count(*) from recora_admin.customer_subscriptions),
    'diagnostic_intakes', (select count(*) from recora_admin.diagnostic_intakes),
    'measurement_schedules', (select count(*) from recora_admin.measurement_schedules),
    'operation_events', (select count(*) from recora_admin.operation_events),
    'measurement_batches', (select count(*) from recora_admin.measurement_batches),
    'measurement_batch_items', (select count(*) from recora_admin.measurement_batch_items),
    'report_publication_reviews', (select count(*) from recora_admin.report_publication_reviews),
    'prompt_change_events', (select count(*) from recora_admin.prompt_change_events),
    'internal_notes', (select count(*) from recora_admin.internal_notes)
  )
  into legacy_counts;

  raise notice 'Recora Admin P0 M00 legacy inventory only; no conversion performed: %', legacy_counts::text;
end;
$admin_p0_baseline_inventory$;

create table if not exists recora_private.admin_p0_schema_versions (
  id uuid primary key default gen_random_uuid(),
  schema_version text not null,
  canonical_package_id text not null,
  canonical_version text not null,
  canonical_manifest_sha256 text not null,
  repository_baseline_commit text not null,
  applied_at timestamptz not null default now(),
  migration_set_digest text not null,
  constraint admin_p0_schema_versions_schema_version_unique unique (schema_version),
  constraint admin_p0_schema_versions_schema_version_not_blank check (btrim(schema_version) <> ''),
  constraint admin_p0_schema_versions_canonical_package_not_blank check (btrim(canonical_package_id) <> ''),
  constraint admin_p0_schema_versions_canonical_version_not_blank check (btrim(canonical_version) <> ''),
  constraint admin_p0_schema_versions_canonical_manifest_hash_format check (
    canonical_manifest_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint admin_p0_schema_versions_repository_commit_format check (
    repository_baseline_commit ~ '^[0-9a-f]{40}$'
  ),
  constraint admin_p0_schema_versions_migration_set_digest_format check (
    migration_set_digest ~ '^[0-9a-f]{64}$'
  )
);

do $admin_p0_schema_contract_verify$
declare
  required_constraint text;
  missing_column_count bigint;
begin
  select count(*)
  into missing_column_count
  from (
    values
      ('id', 'uuid', 'NO'),
      ('schema_version', 'text', 'NO'),
      ('canonical_package_id', 'text', 'NO'),
      ('canonical_version', 'text', 'NO'),
      ('canonical_manifest_sha256', 'text', 'NO'),
      ('repository_baseline_commit', 'text', 'NO'),
      ('applied_at', 'timestamp with time zone', 'NO'),
      ('migration_set_digest', 'text', 'NO')
  ) as required(column_name, data_type, is_nullable)
  left join information_schema.columns actual
    on actual.table_schema = 'recora_private'
   and actual.table_name = 'admin_p0_schema_versions'
   and actual.column_name = required.column_name
   and actual.data_type = required.data_type
   and actual.is_nullable = required.is_nullable
  where actual.column_name is null;

  if missing_column_count > 0 then
    raise exception 'Recora Admin P0 M00 baseline failed: pre-existing schema-version table conflicts with the approved column contract';
  end if;

  foreach required_constraint in array array[
    'admin_p0_schema_versions_pkey',
    'admin_p0_schema_versions_schema_version_unique',
    'admin_p0_schema_versions_schema_version_not_blank',
    'admin_p0_schema_versions_canonical_package_not_blank',
    'admin_p0_schema_versions_canonical_version_not_blank',
    'admin_p0_schema_versions_canonical_manifest_hash_format',
    'admin_p0_schema_versions_repository_commit_format',
    'admin_p0_schema_versions_migration_set_digest_format'
  ] loop
    if not exists (
      select 1
      from pg_constraint constraint_row
      where constraint_row.conrelid = 'recora_private.admin_p0_schema_versions'::regclass
        and constraint_row.conname = required_constraint
        and constraint_row.convalidated is true
    ) then
      raise exception 'Recora Admin P0 M00 baseline failed: schema-version constraint % is missing or unvalidated', required_constraint;
    end if;
  end loop;
end;
$admin_p0_schema_contract_verify$;

comment on table recora_private.admin_p0_schema_versions is
  'Append-only Recora Admin P0 schema-contract evidence. M00 pins approved design inputs; later validation migrations insert successor records instead of updating this row.';
comment on column recora_private.admin_p0_schema_versions.canonical_manifest_sha256 is
  'SHA-256 of the exact raw recora_admin_p0_canonical_manifest_v1.json bytes.';
comment on column recora_private.admin_p0_schema_versions.repository_baseline_commit is
  'Git commit reviewed by the M00 inventory. It is evidence, not a runtime authorization source.';
comment on column recora_private.admin_p0_schema_versions.migration_set_digest is
  'SHA-256 of the exact raw recora_admin_p0_physical_schema_manifest_v1_3.json bytes; that manifest contains the ordered M00-M23 migration set and physical object catalog.';

alter table recora_private.admin_p0_schema_versions enable row level security;
revoke all on table recora_private.admin_p0_schema_versions from public, anon, authenticated, service_role;
grant usage on schema recora_private to service_role;
grant select on table recora_private.admin_p0_schema_versions to service_role;

-- Reuse the existing private append-only guard; M00 already proved it exists.
drop trigger if exists admin_p0_schema_versions_append_only
on recora_private.admin_p0_schema_versions;
create trigger admin_p0_schema_versions_append_only
before update or delete on recora_private.admin_p0_schema_versions
for each row execute function recora_private.p4_reject_history_mutation();

insert into recora_private.admin_p0_schema_versions (
  schema_version,
  canonical_package_id,
  canonical_version,
  canonical_manifest_sha256,
  repository_baseline_commit,
  migration_set_digest
)
values (
  'recora_admin_p0_design_v1_3',
  'RECORA-ADMIN-P0-CANONICAL',
  '1.0',
  'f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a',
  '2c2a6fba70b75e858abc71a7447840bf32f3507d',
  'd6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a'
)
on conflict (schema_version) do nothing;

-- Idempotent replay may keep the existing row, but it may never silently accept
-- a different manifest, migration set, or repository baseline under the same ID.
do $admin_p0_baseline_pin_verify$
declare
  pinned_row recora_private.admin_p0_schema_versions%rowtype;
begin
  select *
  into pinned_row
  from recora_private.admin_p0_schema_versions
  where schema_version = 'recora_admin_p0_design_v1_3';

  if not found then
    raise exception 'Recora Admin P0 M00 baseline failed: pinned schema version row was not created';
  end if;

  if pinned_row.canonical_package_id is distinct from 'RECORA-ADMIN-P0-CANONICAL'
    or pinned_row.canonical_version is distinct from '1.0'
    or pinned_row.canonical_manifest_sha256 is distinct from 'f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a'
    or pinned_row.repository_baseline_commit is distinct from '2c2a6fba70b75e858abc71a7447840bf32f3507d'
    or pinned_row.migration_set_digest is distinct from 'd6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a' then
    raise exception 'Recora Admin P0 M00 baseline failed: existing schema-version pin conflicts with the approved design';
  end if;
end;
$admin_p0_baseline_pin_verify$;
