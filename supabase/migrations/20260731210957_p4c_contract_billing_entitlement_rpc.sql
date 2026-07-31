
-- Issue #123 / P4-C: action-specific contract, billing, entitlement, and checkpoint command boundary.
-- Function-only additive migration: no schema/table/column/RLS changes.

create or replace function recora_private.p4c_payload_fingerprint(p_payload jsonb)
returns text language sql immutable set search_path = '' as $$
  select pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_payload::text, 'utf8'), 'sha256'), 'hex');
$$;

create or replace function recora_private.p4c_contract_transition_allowed(
  p_previous_state recora_private.p4_contract_state,
  p_next_state recora_private.p4_contract_state
)
returns boolean language sql immutable set search_path = '' as $$
  select (
    (p_previous_state is null and p_next_state = 'draft'::recora_private.p4_contract_state)
    or (p_previous_state = 'draft'::recora_private.p4_contract_state and p_next_state in ('pending_activation'::recora_private.p4_contract_state, 'canceled'::recora_private.p4_contract_state))
    or (p_previous_state = 'pending_activation'::recora_private.p4_contract_state and p_next_state in ('active'::recora_private.p4_contract_state, 'paused'::recora_private.p4_contract_state, 'canceled'::recora_private.p4_contract_state, 'ended'::recora_private.p4_contract_state))
    or (p_previous_state = 'active'::recora_private.p4_contract_state and p_next_state in ('paused'::recora_private.p4_contract_state, 'canceled'::recora_private.p4_contract_state, 'ended'::recora_private.p4_contract_state))
    or (p_previous_state = 'paused'::recora_private.p4_contract_state and p_next_state in ('active'::recora_private.p4_contract_state, 'canceled'::recora_private.p4_contract_state, 'ended'::recora_private.p4_contract_state))
  );
$$;

create or replace function recora_private.p4c_customer_safe_contract_result(p_organization_id uuid, p_project_id uuid)
returns table (schema_version smallint, customer_access_allowed boolean, reason_code text, effective_from timestamptz, effective_until timestamptz, capabilities jsonb, limits jsonb)
language plpgsql stable security definer set search_path = '' as $$
declare entitlement_row record; checkpoint_row record;
begin
  select * into entitlement_row from public.recora_resolve_current_entitlement_snapshot(p_organization_id, p_project_id);
  select * into checkpoint_row from public.recora_p4_resolve_checkpoint_gate(p_organization_id, p_project_id);
  if entitlement_row.reason_code is distinct from 'ok' then
    return query select 1::smallint,false,entitlement_row.reason_code::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;
  if checkpoint_row.reason_code is distinct from 'ok' then
    return query select 1::smallint,false,checkpoint_row.reason_code::text,entitlement_row.effective_from,entitlement_row.effective_until,coalesce(entitlement_row.capabilities,'{}'::jsonb),coalesce(entitlement_row.limits,'{}'::jsonb); return;
  end if;
  return query select 1::smallint,true,'ok'::text,entitlement_row.effective_from,entitlement_row.effective_until,coalesce(entitlement_row.capabilities,'{}'::jsonb),coalesce(entitlement_row.limits,'{}'::jsonb);
end;
$$;

create or replace function public.recora_p4c_apply_contract_billing_entitlement_command(
  p_organization_id uuid,
  p_project_id uuid,
  p_source_kind recora_private.p4_source_kind,
  p_source_namespace text,
  p_source_reference text,
  p_source_sequence bigint,
  p_contract_reference text,
  p_next_contract_state recora_private.p4_contract_state,
  p_payment_fact_kind recora_private.p4_payment_fact_kind,
  p_payment_chain_key text,
  p_authoritative_plan_policy_key text,
  p_idempotency_key text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_operator_audit_event_id uuid,
  p_operator_command_receipt_id uuid,
  p_payload_fingerprint text default null,
  p_corrects_payment_fact_id uuid default null,
  p_downstream_effect_result text default 'pending'
)
returns table (schema_version smallint, outcome text, stable_reason text, customer_access_allowed boolean, reason_code text, effective_from timestamptz, effective_until timestamptz, capabilities jsonb, limits jsonb)
language plpgsql security definer set search_path = '' as $$
declare
  v_policy_row recora_private.plan_policy_versions%rowtype;
  v_contract_row recora_private.p4_contract_projections%rowtype;
  v_contract_found boolean := false;
  v_lifecycle_row recora_private.data_lifecycle_current%rowtype;
  v_previous_checkpoint_row recora_private.p4_downstream_checkpoints%rowtype;
  v_previous_outbox_row recora_private.p4_durable_outbox%rowtype;
  v_receipt_command record; v_contract_command record; v_payment_command record; v_checkpoint_command record; v_customer_row record;
  v_canonical_payload jsonb; v_canonical_fingerprint text;
  v_contract_id uuid; v_projection_policy_id uuid; v_snapshot_id uuid; v_billing_receipt_id uuid; v_checkpoint_id uuid; v_outbox_id uuid;
  v_event_sequence bigint; v_next_receipt_state recora_private.p4_receipt_state := 'applied'::recora_private.p4_receipt_state;
  v_derived_checkpoint_effect text := null; v_checkpoint_stable_reason text := 'ok'; v_is_recovery boolean := false;
begin
  if p_organization_id is null
    or p_source_kind is distinct from 'provider_fixture'::recora_private.p4_source_kind
    or not recora_private.p4_opaque(p_source_namespace)
    or not recora_private.p4_opaque(p_source_reference)
    or not recora_private.p4_opaque(p_contract_reference)
    or not recora_private.p4_opaque(p_payment_chain_key)
    or not recora_private.p4_opaque(p_authoritative_plan_policy_key)
    or not recora_private.p4_opaque(p_idempotency_key)
    or char_length(p_idempotency_key) > 96
    or p_source_sequence is null or p_source_sequence <= 0
    or p_next_contract_state is null or p_payment_fact_kind is null
    or p_request_id is null or p_correlation_id is null
    or p_operator_audit_event_id is null or p_operator_command_receipt_id is null
    or p_downstream_effect_result not in ('pending', 'completed', 'reconciliation_required')
    or (p_payload_fingerprint is not null and p_payload_fingerprint !~ '^[0-9a-f]{64}$') then
    return query select 1::smallint,'rejected'::text,'invalid_reference'::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;

  if not exists (select 1 from public.organizations organization_row where organization_row.id = p_organization_id)
    or (p_project_id is not null and not exists (select 1 from public.projects project_row where project_row.id = p_project_id and project_row.organization_id = p_organization_id)) then
    return query select 1::smallint,'rejected'::text,'invalid_scope'::text,false,'invalid_scope'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;

  if not exists (
    select 1 from recora_operator.operator_command_receipts operator_receipt
    where operator_receipt.id = p_operator_command_receipt_id
      and operator_receipt.audit_event_id = p_operator_audit_event_id
      and operator_receipt.organization_id = p_organization_id
      and operator_receipt.project_id is not distinct from p_project_id
      and operator_receipt.request_id = p_request_id
      and operator_receipt.correlation_id = p_correlation_id
      and operator_receipt.action = 'p4c.contract.billing.apply'
      and ((p_project_id is null and operator_receipt.target_type = 'organization' and operator_receipt.target_id = p_organization_id)
        or (p_project_id is not null and operator_receipt.target_type = 'project' and operator_receipt.target_id = p_project_id))
  ) then
    return query select 1::smallint,'rejected'::text,'invalid_reference'::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;

  select * into v_policy_row
  from recora_private.plan_policy_versions version_row
  where version_row.policy_key = p_authoritative_plan_policy_key
    and version_row.effective_from <= now()
    and (version_row.effective_until is null or version_row.effective_until > now())
  order by version_row.effective_from desc, version_row.created_at desc limit 1;
  if not found then
    return query select 1::smallint,'rejected'::text,'invalid_reference'::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;

  v_canonical_payload := pg_catalog.jsonb_build_object(
    'schemaVersion', 1,
    'organizationId', p_organization_id,
    'projectId', p_project_id,
    'sourceKind', p_source_kind::text,
    'sourceNamespace', p_source_namespace,
    'sourceReference', p_source_reference,
    'sourceSequence', p_source_sequence,
    'contractReference', p_contract_reference,
    'nextContractState', p_next_contract_state::text,
    'paymentFactKind', p_payment_fact_kind::text,
    'paymentChainKey', p_payment_chain_key,
    'correctsPaymentFactId', p_corrects_payment_fact_id,
    'authoritativePolicy', pg_catalog.jsonb_build_object('policyKey', v_policy_row.policy_key, 'policyVersionId', v_policy_row.id, 'policySchemaVersion', v_policy_row.policy_schema_version, 'policyHash', v_policy_row.policy_hash)
  );
  v_canonical_fingerprint := recora_private.p4c_payload_fingerprint(v_canonical_payload);
  if p_payload_fingerprint is not null and p_payload_fingerprint <> v_canonical_fingerprint then
    return query select 1::smallint,'rejected'::text,'invalid_reference'::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;

  perform pg_advisory_xact_lock(pg_catalog.hashtextextended('p4c:' || p_organization_id::text || coalesce(':project:' || p_project_id::text, '') || ':' || p_source_namespace || ':' || p_contract_reference,0));
  select * into v_contract_row
  from recora_private.p4_contract_projections projection_row
  where projection_row.organization_id = p_organization_id and projection_row.contract_reference = p_contract_reference
  for update;
  v_contract_found := found;

  select * into v_receipt_command from public.recora_p4_record_command_receipt(p_organization_id,p_project_id,'billing.receipt',p_source_kind,p_source_namespace,p_source_reference,p_source_sequence,v_canonical_fingerprint,p_request_id,p_correlation_id,p_idempotency_key || '.receipt',p_operator_audit_event_id,p_operator_command_receipt_id);
  if v_receipt_command.outcome = 'replayed'::recora_private.p4_command_outcome then
    set constraints all immediate;
  select * into v_customer_row from recora_private.p4c_customer_safe_contract_result(p_organization_id, p_project_id);
    return query select v_customer_row.schema_version,'replayed'::text,'duplicate_command'::text,v_customer_row.customer_access_allowed,v_customer_row.reason_code,v_customer_row.effective_from,v_customer_row.effective_until,v_customer_row.capabilities,v_customer_row.limits; return;
  end if;
  if v_receipt_command.outcome is distinct from 'accepted'::recora_private.p4_command_outcome then
    return query select 1::smallint,v_receipt_command.outcome::text,v_receipt_command.stable_reason::text,false,case when v_receipt_command.stable_reason::text = 'invalid_scope' then 'invalid_scope' else 'command_unavailable' end,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;
  if v_contract_found and (v_contract_row.project_id is distinct from p_project_id or v_contract_row.source_namespace is distinct from p_source_namespace) then
    return query select 1::smallint,'reconciliation_required'::text,'invalid_scope'::text,false,'reconciliation_required'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;
  if v_contract_found and p_source_sequence <= v_contract_row.latest_source_sequence then
    return query select 1::smallint,'reconciliation_required'::text,'ordering_conflict'::text,false,'reconciliation_required'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;
  if (not v_contract_found and p_next_contract_state is distinct from 'draft'::recora_private.p4_contract_state)
    or (v_contract_found and not recora_private.p4c_contract_transition_allowed(v_contract_row.state, p_next_contract_state)) then
    return query select 1::smallint,'reconciliation_required'::text,'reconciliation_required'::text,false,'reconciliation_required'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;

  select * into v_contract_command from public.recora_p4_record_command_receipt(p_organization_id,p_project_id,'contract.projection',p_source_kind,p_source_namespace,p_contract_reference,p_source_sequence,v_canonical_fingerprint,p_request_id,p_correlation_id,p_idempotency_key || '.contract',p_operator_audit_event_id,p_operator_command_receipt_id);
  if v_contract_command.outcome is distinct from 'accepted'::recora_private.p4_command_outcome then
    return query select 1::smallint,v_contract_command.outcome::text,v_contract_command.stable_reason::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;

  if p_next_contract_state = 'active'::recora_private.p4_contract_state then
    begin
      insert into recora_private.entitlement_snapshots (organization_id,project_id,source_contract_reference,plan_policy_version_id,entitlement_schema_version,resolved_document,effective_from,effective_until,resolver_version,idempotency_key)
      values (p_organization_id,p_project_id,p_contract_reference,v_policy_row.id,v_policy_row.policy_schema_version,v_policy_row.policy_document,now(),v_policy_row.effective_until,'p4c.rpc.v1',p_idempotency_key || '.entitlement')
      returning id into v_snapshot_id;
    exception when unique_violation then
      select snapshot_row.id into v_snapshot_id
      from recora_private.entitlement_snapshots snapshot_row
      where snapshot_row.organization_id = p_organization_id and snapshot_row.project_id is not distinct from p_project_id and snapshot_row.idempotency_key = p_idempotency_key || '.entitlement';
    end;
    if v_snapshot_id is null then raise exception 'P4-C entitlement snapshot could not be resolved'; end if;
    v_projection_policy_id := v_policy_row.id;
    update recora_private.current_entitlement_snapshots pointer_row
    set snapshot_id = v_snapshot_id
    where pointer_row.organization_id = p_organization_id and pointer_row.project_id is not distinct from p_project_id;
    if not found then
      insert into recora_private.current_entitlement_snapshots (organization_id,project_id,snapshot_id) values (p_organization_id,p_project_id,v_snapshot_id);
    end if;
  else
    v_snapshot_id := case when v_contract_found then v_contract_row.entitlement_snapshot_id else null::uuid end;
    v_projection_policy_id := case when v_contract_found then v_contract_row.plan_policy_version_id else null::uuid end;
  end if;

  if not v_contract_found then
    insert into recora_private.p4_contract_projections (organization_id,project_id,contract_reference,source_namespace,state,latest_source_sequence,plan_policy_version_id,entitlement_snapshot_id,last_command_receipt_id)
    values (p_organization_id,p_project_id,p_contract_reference,p_source_namespace,'draft'::recora_private.p4_contract_state,p_source_sequence,null::uuid,null::uuid,v_contract_command.command_receipt_id)
    returning id into v_contract_id;
    insert into recora_private.p4_contract_events (contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,plan_policy_version_id,entitlement_snapshot_id,command_receipt_id,request_id,correlation_id)
    values (v_contract_id,p_organization_id,1,p_source_namespace,p_contract_reference,p_source_sequence,v_canonical_fingerprint,null::recora_private.p4_contract_state,'draft'::recora_private.p4_contract_state,null::uuid,null::uuid,v_contract_command.command_receipt_id,p_request_id,p_correlation_id);
  else
    v_contract_id := v_contract_row.id;
    select coalesce(max(event_row.event_sequence), 0) + 1 into v_event_sequence from recora_private.p4_contract_events event_row where event_row.contract_id = v_contract_row.id;
    insert into recora_private.p4_contract_events (contract_id,organization_id,event_sequence,source_namespace,source_reference,source_sequence,payload_fingerprint,previous_state,next_state,plan_policy_version_id,entitlement_snapshot_id,command_receipt_id,request_id,correlation_id)
    values (v_contract_row.id,p_organization_id,v_event_sequence,p_source_namespace,p_contract_reference,p_source_sequence,v_canonical_fingerprint,v_contract_row.state,p_next_contract_state,v_projection_policy_id,v_snapshot_id,v_contract_command.command_receipt_id,p_request_id,p_correlation_id);
    update recora_private.p4_contract_projections projection_row
    set state = p_next_contract_state,
      latest_source_sequence = p_source_sequence,
      plan_policy_version_id = v_projection_policy_id,
      entitlement_snapshot_id = v_snapshot_id,
      last_command_receipt_id = v_contract_command.command_receipt_id
    where projection_row.id = v_contract_row.id;
  end if;
  insert into recora_private.p4_billing_receipts (organization_id,project_id,contract_id,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,processing_state,last_command_receipt_id,request_id,correlation_id)
  values (p_organization_id,p_project_id,v_contract_id,p_source_kind,p_source_namespace,p_source_reference,p_source_sequence,v_canonical_fingerprint,'received'::recora_private.p4_receipt_state,v_receipt_command.command_receipt_id,p_request_id,p_correlation_id)
  returning id into v_billing_receipt_id;
  insert into recora_private.p4_billing_receipt_events (receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values (v_billing_receipt_id,p_organization_id,1,null::recora_private.p4_receipt_state,'received'::recora_private.p4_receipt_state,v_receipt_command.command_receipt_id,p_request_id,p_correlation_id);
  update recora_private.p4_billing_receipts receipt_row set processing_state = 'validated'::recora_private.p4_receipt_state where receipt_row.id = v_billing_receipt_id;
  insert into recora_private.p4_billing_receipt_events (receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values (v_billing_receipt_id,p_organization_id,2,'received'::recora_private.p4_receipt_state,'validated'::recora_private.p4_receipt_state,v_receipt_command.command_receipt_id,p_request_id,p_correlation_id);

  select * into v_payment_command from public.recora_p4_record_command_receipt(p_organization_id,p_project_id,'billing.payment_fact',p_source_kind,p_source_namespace,p_source_reference,p_source_sequence,v_canonical_fingerprint,p_request_id,p_correlation_id,p_idempotency_key || '.payment',p_operator_audit_event_id,p_operator_command_receipt_id);
  if v_payment_command.outcome is distinct from 'accepted'::recora_private.p4_command_outcome then
    return query select 1::smallint,v_payment_command.outcome::text,v_payment_command.stable_reason::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
  end if;
  insert into recora_private.p4_normalized_payment_facts (receipt_id,organization_id,project_id,contract_id,source_namespace,source_reference,source_sequence,fact_kind,corrects_fact_id,command_receipt_id,request_id,correlation_id,payment_chain_key)
  values (v_billing_receipt_id,p_organization_id,p_project_id,v_contract_id,p_source_namespace,p_source_reference,p_source_sequence,p_payment_fact_kind,p_corrects_payment_fact_id,v_payment_command.command_receipt_id,p_request_id,p_correlation_id,p_payment_chain_key);

  update recora_private.p4_billing_receipts receipt_row set processing_state = 'applying'::recora_private.p4_receipt_state where receipt_row.id = v_billing_receipt_id;
  insert into recora_private.p4_billing_receipt_events (receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values (v_billing_receipt_id,p_organization_id,3,'validated'::recora_private.p4_receipt_state,'applying'::recora_private.p4_receipt_state,v_receipt_command.command_receipt_id,p_request_id,p_correlation_id);

  if p_next_contract_state in ('paused'::recora_private.p4_contract_state, 'canceled'::recora_private.p4_contract_state, 'ended'::recora_private.p4_contract_state)
    or p_payment_fact_kind in ('payment_failed'::recora_private.p4_payment_fact_kind, 'payment_reversed'::recora_private.p4_payment_fact_kind, 'payment_disputed'::recora_private.p4_payment_fact_kind) then
    v_derived_checkpoint_effect := 'lifecycle.suspend';
  elsif p_next_contract_state = 'active'::recora_private.p4_contract_state and p_payment_fact_kind = 'payment_succeeded'::recora_private.p4_payment_fact_kind then
    select * into v_previous_checkpoint_row
    from recora_private.p4_downstream_checkpoints checkpoint_row
    where checkpoint_row.organization_id = p_organization_id
      and checkpoint_row.project_id is not distinct from p_project_id
      and checkpoint_row.blocks_customer_access
      and checkpoint_row.superseded_by_checkpoint_id is null
      and checkpoint_row.state in ('failed'::recora_private.p4_checkpoint_state, 'reconciliation_required'::recora_private.p4_checkpoint_state)
    order by checkpoint_row.created_at desc limit 1 for update;
    if found then
      v_is_recovery := true;
      v_derived_checkpoint_effect := v_previous_checkpoint_row.required_effect;
      select * into v_previous_outbox_row
      from recora_private.p4_durable_outbox outbox_row
      where outbox_row.checkpoint_id = v_previous_checkpoint_row.id and outbox_row.superseded_by_outbox_id is null
      order by outbox_row.created_at desc limit 1 for update;
    end if;
  end if;
  if v_derived_checkpoint_effect is not null then
    select * into v_lifecycle_row
    from recora_private.data_lifecycle_current current_row
    where current_row.organization_id = p_organization_id and current_row.project_id is not distinct from p_project_id
    for share;
    if not found then raise exception 'P4-C checkpoint requires authoritative lifecycle state'; end if;

    select * into v_checkpoint_command from public.recora_p4_record_command_receipt(p_organization_id,p_project_id,'lifecycle.checkpoint',p_source_kind,p_source_namespace,p_source_reference,p_source_sequence,v_canonical_fingerprint,p_request_id,p_correlation_id,p_idempotency_key || '.checkpoint',p_operator_audit_event_id,p_operator_command_receipt_id);
    if v_checkpoint_command.outcome is distinct from 'accepted'::recora_private.p4_command_outcome then
      return query select 1::smallint,v_checkpoint_command.outcome::text,v_checkpoint_command.stable_reason::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb; return;
    end if;

    insert into recora_private.p4_downstream_checkpoints (organization_id,project_id,command_receipt_id,required_effect,phase3_lifecycle_id,expected_lifecycle_version,state,stable_reason,blocks_customer_access,correction_of_checkpoint_id)
    values (p_organization_id,p_project_id,v_checkpoint_command.command_receipt_id,v_derived_checkpoint_effect,v_lifecycle_row.id,v_lifecycle_row.version,'pending'::recora_private.p4_checkpoint_state,'checkpoint_pending'::recora_private.p4_reason,true,case when v_is_recovery then v_previous_checkpoint_row.id else null::uuid end)
    returning id into v_checkpoint_id;
    insert into recora_private.p4_checkpoint_events (checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values (v_checkpoint_id,p_organization_id,1,null::recora_private.p4_checkpoint_state,'pending'::recora_private.p4_checkpoint_state,v_checkpoint_command.command_receipt_id,p_request_id,p_correlation_id);

    insert into recora_private.p4_durable_outbox (checkpoint_id,command_receipt_id,organization_id,project_id,effect_kind,ordering_key,idempotency_key,state,stable_reason,correction_of_outbox_id)
    values (v_checkpoint_id,v_checkpoint_command.command_receipt_id,p_organization_id,p_project_id,v_derived_checkpoint_effect,p_source_sequence,p_idempotency_key || '.outbox','pending'::recora_private.p4_outbox_state,'checkpoint_pending'::recora_private.p4_reason,case when v_is_recovery and v_previous_outbox_row.id is not null then v_previous_outbox_row.id else null::uuid end)
    returning id into v_outbox_id;
    insert into recora_private.p4_outbox_events (outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values (v_outbox_id,p_organization_id,1,null::recora_private.p4_outbox_state,'pending'::recora_private.p4_outbox_state,v_checkpoint_command.command_receipt_id,p_request_id,p_correlation_id);

    if p_downstream_effect_result = 'completed' then
      update recora_private.p4_downstream_checkpoints checkpoint_row set state = 'applying'::recora_private.p4_checkpoint_state, stable_reason = 'checkpoint_pending'::recora_private.p4_reason where checkpoint_row.id = v_checkpoint_id;
      insert into recora_private.p4_checkpoint_events (checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
      values (v_checkpoint_id,p_organization_id,2,'pending'::recora_private.p4_checkpoint_state,'applying'::recora_private.p4_checkpoint_state,v_checkpoint_command.command_receipt_id,p_request_id,p_correlation_id);
      update recora_private.p4_downstream_checkpoints checkpoint_row set state = 'completed'::recora_private.p4_checkpoint_state, stable_reason = 'ok'::recora_private.p4_reason where checkpoint_row.id = v_checkpoint_id;
      insert into recora_private.p4_checkpoint_events (checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
      values (v_checkpoint_id,p_organization_id,3,'applying'::recora_private.p4_checkpoint_state,'completed'::recora_private.p4_checkpoint_state,v_checkpoint_command.command_receipt_id,p_request_id,p_correlation_id);
      update recora_private.p4_durable_outbox outbox_row set state = 'delivered'::recora_private.p4_outbox_state, stable_reason = 'ok'::recora_private.p4_reason, resolved_at = now() where outbox_row.id = v_outbox_id;
      insert into recora_private.p4_outbox_events (outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
      values (v_outbox_id,p_organization_id,2,'pending'::recora_private.p4_outbox_state,'delivered'::recora_private.p4_outbox_state,v_checkpoint_command.command_receipt_id,p_request_id,p_correlation_id);
      if v_is_recovery then
        update recora_private.p4_downstream_checkpoints checkpoint_row set superseded_by_checkpoint_id = v_checkpoint_id where checkpoint_row.id = v_previous_checkpoint_row.id;
        if v_previous_outbox_row.id is not null then
          update recora_private.p4_durable_outbox outbox_row set superseded_by_outbox_id = v_outbox_id where outbox_row.id = v_previous_outbox_row.id;
        end if;
      end if;
    elsif p_downstream_effect_result = 'reconciliation_required' then
      update recora_private.p4_downstream_checkpoints checkpoint_row set state = 'reconciliation_required'::recora_private.p4_checkpoint_state, stable_reason = 'reconciliation_required'::recora_private.p4_reason where checkpoint_row.id = v_checkpoint_id;
      insert into recora_private.p4_checkpoint_events (checkpoint_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
      values (v_checkpoint_id,p_organization_id,2,'pending'::recora_private.p4_checkpoint_state,'reconciliation_required'::recora_private.p4_checkpoint_state,v_checkpoint_command.command_receipt_id,p_request_id,p_correlation_id);
      update recora_private.p4_durable_outbox outbox_row set state = 'reconciliation_required'::recora_private.p4_outbox_state, stable_reason = 'reconciliation_required'::recora_private.p4_reason, exhausted_at = now() where outbox_row.id = v_outbox_id;
      insert into recora_private.p4_outbox_events (outbox_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
      values (v_outbox_id,p_organization_id,2,'pending'::recora_private.p4_outbox_state,'reconciliation_required'::recora_private.p4_outbox_state,v_checkpoint_command.command_receipt_id,p_request_id,p_correlation_id);
    end if;
  end if;
  if v_derived_checkpoint_effect is not null and p_downstream_effect_result <> 'completed' then
    v_next_receipt_state := 'reconciliation_required'::recora_private.p4_receipt_state;
    v_checkpoint_stable_reason := case when p_downstream_effect_result = 'reconciliation_required' then 'reconciliation_required' else 'checkpoint_pending' end;
  end if;

  update recora_private.p4_billing_receipts receipt_row set processing_state = v_next_receipt_state where receipt_row.id = v_billing_receipt_id;
  insert into recora_private.p4_billing_receipt_events (receipt_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values (v_billing_receipt_id,p_organization_id,4,'applying'::recora_private.p4_receipt_state,v_next_receipt_state,v_receipt_command.command_receipt_id,p_request_id,p_correlation_id);

  set constraints all immediate;
  select * into v_customer_row from recora_private.p4c_customer_safe_contract_result(p_organization_id, p_project_id);
  return query select v_customer_row.schema_version,
    case when v_next_receipt_state = 'applied'::recora_private.p4_receipt_state then 'applied' else 'reconciliation_required' end::text,
    v_checkpoint_stable_reason,
    v_customer_row.customer_access_allowed,
    v_customer_row.reason_code,
    v_customer_row.effective_from,
    v_customer_row.effective_until,
    v_customer_row.capabilities,
    v_customer_row.limits;
  return;
exception
  when foreign_key_violation or unique_violation or check_violation or not_null_violation or invalid_text_representation or raise_exception then
    return query select 1::smallint,'rejected'::text,'invalid_reference'::text,false,'command_unavailable'::text,null::timestamptz,null::timestamptz,'{}'::jsonb,'{}'::jsonb;
    return;
end;
$$;

comment on function public.recora_p4c_apply_contract_billing_entitlement_command(
  uuid, uuid, recora_private.p4_source_kind, text, text, bigint, text,
  recora_private.p4_contract_state, recora_private.p4_payment_fact_kind,
  text, text, text, uuid, uuid, uuid, uuid, text, uuid, text
) is
  'Issue #123 P4-C service-role-only command boundary. It locks authoritative contract state, computes canonical payload fingerprints, derives entitlement snapshots from plan policy versions, writes P4 receipt/payment/contract/checkpoint evidence atomically, and returns only customer-safe entitlement/access DTO fields.';

revoke all on function recora_private.p4c_payload_fingerprint(jsonb) from public, anon, authenticated;
revoke all on function recora_private.p4c_contract_transition_allowed(recora_private.p4_contract_state, recora_private.p4_contract_state) from public, anon, authenticated;
revoke all on function recora_private.p4c_customer_safe_contract_result(uuid, uuid) from public, anon, authenticated;

revoke all on function public.recora_p4c_apply_contract_billing_entitlement_command(
  uuid, uuid, recora_private.p4_source_kind, text, text, bigint, text,
  recora_private.p4_contract_state, recora_private.p4_payment_fact_kind,
  text, text, text, uuid, uuid, uuid, uuid, text, uuid, text
) from public, anon, authenticated;
grant execute on function public.recora_p4c_apply_contract_billing_entitlement_command(
  uuid, uuid, recora_private.p4_source_kind, text, text, bigint, text,
  recora_private.p4_contract_state, recora_private.p4_payment_fact_kind,
  text, text, text, uuid, uuid, uuid, uuid, text, uuid, text
) to service_role;
