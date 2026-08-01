-- Issue #122 / P4-B account invitation and membership command RPCs.
-- OWNER comment 5149714147 authorizes the minimal actor-evidence DDL below
-- inside this unmerged P4-B migration; all remaining changes stay RPC/helper-only.

set search_path = public, extensions;

alter type recora_private.p4_source_kind add value if not exists 'customer_session';

alter table recora_private.p4_command_receipts
  add column if not exists customer_auth_user_id uuid references auth.users(id) on delete restrict,
  drop constraint if exists p4_command_receipt_actor_shape,
  add constraint p4_command_receipt_actor_shape check (
    (
      source_kind::text = 'manual'
      and operator_audit_event_id is not null
      and operator_command_receipt_id is not null
      and customer_auth_user_id is null
    )
    or (
      source_kind::text = 'customer_session'
      and customer_auth_user_id is not null
      and operator_audit_event_id is null
      and operator_command_receipt_id is null
    )
    or (
      source_kind::text = 'provider_fixture'
      and operator_audit_event_id is null
      and operator_command_receipt_id is null
      and customer_auth_user_id is null
    )
  );

comment on column recora_private.p4_command_receipts.customer_auth_user_id is
  'Verified Auth user actor for customer-session Phase 4 commands.';
comment on constraint p4_command_receipt_actor_shape on recora_private.p4_command_receipts is
  'Fail-closed actor evidence shape for manual, customer_session, and provider_fixture Phase 4 command receipts.';

create or replace function recora_private.p4b_source_sequence(p_value text)
returns bigint language plpgsql immutable security definer set search_path = '' as $$
declare hashed_value bigint;
begin
  hashed_value := pg_catalog.hashtextextended(coalesce(p_value, ''), 122);
  return pg_catalog.abs(hashed_value % 9000000000000000000::bigint) + 1;
end;
$$;

create or replace function recora_private.p4b_payload_fingerprint(p_payload jsonb)
returns text language sql immutable security definer set search_path = '' as $$
  select pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(coalesce(p_payload, '{}'::jsonb)::text, 'utf8'), 'sha256'),
    'hex'
  );
$$;

create or replace function recora_private.p4b_revoked_membership_email(p_membership_id uuid)
returns text language sql immutable security definer set search_path = '' as $$
  select 'revoked.' || pg_catalog.replace(p_membership_id::text, '-', '') || '@recora.invalid';
$$;

create or replace function recora_private.p4b_try_p4_command_replay(
  p_organization_id uuid,
  p_command_type text,
  p_source_kind recora_private.p4_source_kind,
  p_source_namespace text,
  p_source_reference text,
  p_source_sequence bigint,
  p_payload_fingerprint text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,audit_event_id uuid,operator_command_receipt_id uuid,should_apply boolean)
language plpgsql security definer set search_path = '' as $$
declare effective_scope_key text; prior_receipt recora_private.p4_command_receipts%rowtype;
begin
  if p_organization_id is null or p_request_id is null or p_correlation_id is null
    or not recora_private.p4_opaque(p_command_type)
    or not recora_private.p4_opaque(p_source_namespace)
    or not recora_private.p4_opaque(p_source_reference)
    or not recora_private.p4_opaque(p_idempotency_key)
    or p_source_sequence is null or p_source_sequence <= 0
    or p_payload_fingerprint !~ '^[0-9a-f]{64}$' then
    return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::uuid,false;
    return;
  end if;

  effective_scope_key := 'organization:' || p_organization_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(effective_scope_key || ':' || p_command_type || ':' || p_idempotency_key, 0));

  select receipt_row.* into prior_receipt
  from recora_private.p4_command_receipts receipt_row
  where receipt_row.scope_key = effective_scope_key
    and receipt_row.command_type = p_command_type
    and receipt_row.idempotency_key = p_idempotency_key;

  if found then
    if prior_receipt.source_kind = p_source_kind
      and prior_receipt.source_namespace = p_source_namespace
      and prior_receipt.source_reference = p_source_reference
      and prior_receipt.source_sequence = p_source_sequence
      and prior_receipt.payload_fingerprint = p_payload_fingerprint then
      return query select prior_receipt.id,'replayed'::text,'duplicate_command'::text,prior_receipt.operator_audit_event_id,prior_receipt.operator_command_receipt_id,false;
      return;
    end if;

    insert into recora_private.p4_command_conflicts(prior_receipt_id,organization_id,project_id,command_type,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id)
    values(prior_receipt.id,p_organization_id,null,p_command_type,p_source_namespace,p_source_reference,p_source_sequence,p_payload_fingerprint,p_request_id,p_correlation_id);
    return query select prior_receipt.id,'rejected'::text,'idempotency_conflict'::text,prior_receipt.operator_audit_event_id,prior_receipt.operator_command_receipt_id,false;
    return;
  end if;

  return query select null::uuid,'accepted'::text,'ok'::text,null::uuid,null::uuid,true;
end;
$$;

create or replace function recora_private.p4b_execute_operator_command(
  p_operator_auth_user_id uuid,
  p_organization_id uuid,
  p_permission text,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_before_summary jsonb default '{}'::jsonb,
  p_after_summary jsonb default '{}'::jsonb
)
returns table(audit_event_id uuid,operator_command_receipt_id uuid,outcome text,failure_reason_code text)
language plpgsql security definer set search_path = '' as $$
declare
  resolved_operator_id uuid;
  resolved_operator_status recora_operator.operator_status;
  resolved_failure text;
  safe_before_summary jsonb := coalesce(p_before_summary, '{}'::jsonb);
  safe_after_summary jsonb := coalesce(p_after_summary, '{}'::jsonb);
  created_audit_event_id uuid;
  created_receipt_id uuid;
begin
  if p_operator_auth_user_id is null then
    resolved_failure := 'operator_identity_required';
  elsif p_organization_id is null or not exists(select 1 from public.organizations organization_row where organization_row.id = p_organization_id) then
    resolved_failure := 'target_organization_not_found';
  elsif p_request_id is null or p_correlation_id is null or p_target_id is null then
    resolved_failure := 'invalid_reference';
  elsif p_target_type not in ('invitation','membership') then
    resolved_failure := 'target_type_not_supported';
  elsif p_action !~ '^[a-z][a-z0-9_.:-]{2,127}$' or p_permission !~ '^[a-z][a-z0-9_.:-]{2,127}$' then
    resolved_failure := 'action_invalid';
  elsif p_reason is null or pg_catalog.btrim(p_reason) = '' then
    resolved_failure := 'reason_required';
  elsif not recora_audit.is_safe_audit_reason(p_reason) then
    resolved_failure := 'reason_unsafe';
  elsif not recora_audit.is_safe_audit_summary(safe_before_summary) or not recora_audit.is_safe_audit_summary(safe_after_summary) then
    resolved_failure := 'summary_unsafe';
  end if;

  if resolved_failure is null then
    select identity_row.id, identity_row.status
    into resolved_operator_id, resolved_operator_status
    from recora_operator.operator_identities identity_row
    where identity_row.auth_user_id = p_operator_auth_user_id;

    if resolved_operator_id is null then
      resolved_failure := 'operator_not_registered';
    elsif resolved_operator_status <> 'active'::recora_operator.operator_status then
      resolved_failure := 'operator_not_active';
    elsif p_target_type = 'membership' and not exists(
      select 1 from public.organization_members member_row
      where member_row.id = p_target_id and member_row.organization_id = p_organization_id
    ) then
      resolved_failure := 'target_scope_mismatch';
    elsif p_target_type = 'invitation' and p_action in ('account.invitation.revoke') and not exists(
      select 1 from recora_private.p4_invitations invitation_row
      where invitation_row.id = p_target_id and invitation_row.organization_id = p_organization_id
    ) then
      resolved_failure := 'target_scope_mismatch';
    elsif not exists(
      select 1
      from recora_operator.operator_action_grants grant_row
      where grant_row.operator_id = resolved_operator_id
        and grant_row.permission = p_permission
        and grant_row.revoked_at is null
        and (grant_row.organization_id is null or grant_row.organization_id = p_organization_id)
        and grant_row.project_id is null
    ) then
      resolved_failure := 'permission_denied';
    end if;
  end if;

  if resolved_failure is not null then
    insert into recora_audit.operator_events(
      actor_operator_id,organization_id,project_id,action,target_type,target_id,permission_used,reason,before_summary,after_summary,request_id,correlation_id,outcome,failure_reason_code
    ) values(
      resolved_operator_id,p_organization_id,null,p_action,p_target_type,coalesce(p_target_id, '00000000-0000-0000-0000-000000000000'::uuid),p_permission,
      case when p_reason is not null and recora_audit.is_safe_audit_reason(p_reason) then p_reason else null end,
      case when recora_audit.is_safe_audit_summary(safe_before_summary) then safe_before_summary else '{}'::jsonb end,
      case when recora_audit.is_safe_audit_summary(safe_after_summary) then safe_after_summary else '{}'::jsonb end,
      coalesce(p_request_id, extensions.gen_random_uuid()),coalesce(p_correlation_id, extensions.gen_random_uuid()),'denied'::recora_audit.operator_audit_outcome,resolved_failure
    ) returning id into created_audit_event_id;
    return query select created_audit_event_id,null::uuid,'denied'::text,resolved_failure;
    return;
  end if;

  begin
    insert into recora_audit.operator_events(
      actor_operator_id,organization_id,project_id,action,target_type,target_id,permission_used,reason,before_summary,after_summary,request_id,correlation_id,outcome,failure_reason_code
    ) values(
      resolved_operator_id,p_organization_id,null,p_action,p_target_type,p_target_id,p_permission,p_reason,safe_before_summary,safe_after_summary,
      p_request_id,p_correlation_id,'success'::recora_audit.operator_audit_outcome,null
    ) returning id into created_audit_event_id;

    insert into recora_operator.operator_command_receipts(
      audit_event_id,operator_id,organization_id,project_id,action,target_type,target_id,request_id,correlation_id
    ) values(
      created_audit_event_id,resolved_operator_id,p_organization_id,null,p_action,p_target_type,p_target_id,p_request_id,p_correlation_id
    ) returning id into created_receipt_id;
  exception
    when unique_violation then
      return query select null::uuid,null::uuid,'failed'::text,'operator_receipt_conflict'::text;
      return;
    when others then
      insert into recora_audit.operator_events(
        actor_operator_id,organization_id,project_id,action,target_type,target_id,permission_used,reason,before_summary,after_summary,request_id,correlation_id,outcome,failure_reason_code
      ) values(
        resolved_operator_id,p_organization_id,null,p_action,p_target_type,p_target_id,p_permission,p_reason,safe_before_summary,safe_after_summary,
        p_request_id,p_correlation_id,'failed'::recora_audit.operator_audit_outcome,'operator_command_failed'
      ) returning id into created_audit_event_id;
      return query select created_audit_event_id,null::uuid,'failed'::text,'operator_command_failed'::text;
      return;
  end;

  return query select created_audit_event_id,created_receipt_id,'success'::text,null::text;
end;
$$;
create or replace function recora_private.p4b_record_operator_p4_command(
  p_operator_auth_user_id uuid,
  p_organization_id uuid,
  p_permission text,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text,
  p_source_reference text,
  p_source_sequence bigint,
  p_payload_fingerprint text,
  p_before_summary jsonb default '{}'::jsonb,
  p_after_summary jsonb default '{}'::jsonb
)
returns table(command_receipt_id uuid,outcome text,reason_code text,audit_event_id uuid,operator_command_receipt_id uuid,should_apply boolean)
language plpgsql security definer set search_path = '' as $$
declare replay_result record; operator_result record; p4_result record;
begin
  select * into replay_result
  from recora_private.p4b_try_p4_command_replay(
    p_organization_id,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',p_source_reference,p_source_sequence,p_payload_fingerprint,
    p_request_id,p_correlation_id,p_idempotency_key
  );
  if not replay_result.should_apply then
    return query select replay_result.command_receipt_id,replay_result.outcome,replay_result.reason_code,replay_result.audit_event_id,replay_result.operator_command_receipt_id,false;
    return;
  end if;

  select * into operator_result
  from recora_private.p4b_execute_operator_command(p_operator_auth_user_id,p_organization_id,p_permission,p_action,p_target_type,p_target_id,p_reason,p_request_id,p_correlation_id,p_before_summary,p_after_summary);
  if operator_result.outcome <> 'success' then
    return query select null::uuid,'rejected'::text,coalesce(operator_result.failure_reason_code, 'operator_authorization_denied')::text,operator_result.audit_event_id,operator_result.operator_command_receipt_id,false;
    return;
  end if;

  select * into p4_result
  from public.recora_p4_record_command_receipt(
    p_organization_id,null,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',p_source_reference,p_source_sequence,p_payload_fingerprint,
    p_request_id,p_correlation_id,p_idempotency_key,operator_result.audit_event_id,operator_result.operator_command_receipt_id
  );

  return query select p4_result.command_receipt_id,p4_result.outcome::text,p4_result.stable_reason::text,operator_result.audit_event_id,operator_result.operator_command_receipt_id,p4_result.outcome = 'accepted'::recora_private.p4_command_outcome;
end;
$$;
create or replace function recora_private.p4b_confirmed_auth_email_hash(p_auth_user_id uuid)
returns text
language plpgsql stable security definer set search_path = '' as $$
declare normalized_email text;
begin
  select pg_catalog.lower(pg_catalog.btrim(user_row.email))
  into normalized_email
  from auth.users user_row
  where user_row.id = p_auth_user_id
    and user_row.email is not null
    and pg_catalog.btrim(user_row.email) <> ''
    and (user_row.email_confirmed_at is not null or user_row.confirmed_at is not null);

  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    return null;
  end if;

  return pg_catalog.encode(extensions.digest(pg_catalog.convert_to(normalized_email, 'utf8'), 'sha256'), 'hex');
end;
$$;

create or replace function recora_private.p4b_record_customer_session_p4_command(
  p_customer_auth_user_id uuid,
  p_organization_id uuid,
  p_source_reference text,
  p_source_sequence bigint,
  p_payload_fingerprint text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,should_apply boolean)
language plpgsql security definer set search_path = '' as $$
declare replay_result record; created_id uuid;
begin
  if p_customer_auth_user_id is null then
    return query select null::uuid,'rejected'::text,'identity_unverified'::text,false;
    return;
  end if;

  select * into replay_result
  from recora_private.p4b_try_p4_command_replay(
    p_organization_id,'invitation.lifecycle','customer_session'::recora_private.p4_source_kind,'p4b.account',p_source_reference,p_source_sequence,p_payload_fingerprint,
    p_request_id,p_correlation_id,p_idempotency_key
  );
  if not replay_result.should_apply then
    return query select replay_result.command_receipt_id,replay_result.outcome,replay_result.reason_code,false;
    return;
  end if;

  begin
    insert into recora_private.p4_command_receipts(
      organization_id,project_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,
      request_id,correlation_id,idempotency_key,operator_audit_event_id,operator_command_receipt_id,customer_auth_user_id
    ) values(
      p_organization_id,null,'invitation.lifecycle','customer_session'::recora_private.p4_source_kind,'p4b.account',p_source_reference,p_source_sequence,p_payload_fingerprint,
      p_request_id,p_correlation_id,p_idempotency_key,null,null,p_customer_auth_user_id
    ) returning id into created_id;
  exception
    when unique_violation then
      return query select replay_result.command_receipt_id,'rejected'::text,'idempotency_conflict'::text,false;
      return;
    when check_violation or foreign_key_violation or raise_exception then
      return query select null::uuid,'rejected'::text,'invalid_reference'::text,false;
      return;
  end;

  return query select created_id,'accepted'::text,'ok'::text,true;
end;
$$;
create or replace function public.recora_p4b_invitation_create(
  p_operator_auth_user_id uuid,
  p_organization_id uuid,
  p_recipient_binding_hash text,
  p_intended_role public.recora_organization_member_role,
  p_expires_at timestamptz,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,invitation_id uuid,invitation_state text,membership_id uuid,membership_status text,membership_episode_id uuid,membership_episode_state text,audit_event_id uuid,operator_command_receipt_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  command_result record;
  invitation_row recora_private.p4_invitations%rowtype;
  pending_invitation recora_private.p4_invitations%rowtype;
  source_reference text;
  source_sequence bigint;
  payload_fingerprint text;
  create_permission text;
  new_invitation_id uuid := extensions.gen_random_uuid();
  next_event_sequence bigint;
begin
  source_reference := 'invite.create.' || pg_catalog.substr(coalesce(p_recipient_binding_hash, ''), 1, 32);
  source_sequence := recora_private.p4b_source_sequence('invite.create:' || p_organization_id::text || ':' || coalesce(p_recipient_binding_hash, '') || ':' || p_idempotency_key);
  payload_fingerprint := recora_private.p4b_payload_fingerprint(pg_catalog.jsonb_build_object('action','create','organization_id',p_organization_id,'recipient_binding_hash',p_recipient_binding_hash,'intended_role',p_intended_role::text,'expires_at',p_expires_at,'reason',p_reason));

  select * into command_result from recora_private.p4b_try_p4_command_replay(p_organization_id,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  if not command_result.should_apply then
    select * into invitation_row from recora_private.p4_invitations current_row where current_row.issuer_command_receipt_id = command_result.command_receipt_id order by current_row.created_at desc limit 1;
    return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,invitation_row.id,invitation_row.state::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
    return;
  end if;

  if p_organization_id is null or not exists(select 1 from public.organizations organization_row where organization_row.id = p_organization_id) then
    return query select null::uuid,'rejected'::text,'invalid_scope'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;
  if p_recipient_binding_hash !~ '^[0-9a-f]{64}$' or p_expires_at is null or p_expires_at <= pg_catalog.clock_timestamp() then
    return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  if p_intended_role = 'admin'::public.recora_organization_member_role then
    create_permission := 'account.invitation.create.admin';
  elsif p_intended_role in ('member'::public.recora_organization_member_role,'viewer'::public.recora_organization_member_role) then
    create_permission := 'account.invitation.create';
  else
    return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('p4b:invite:' || p_organization_id::text || ':' || p_recipient_binding_hash, 0));
  select * into pending_invitation
  from recora_private.p4_invitations pending_row
  where pending_row.organization_id = p_organization_id
    and pending_row.recipient_binding_hash = p_recipient_binding_hash
    and pending_row.state = 'pending'::recora_private.p4_invitation_state
  order by pending_row.created_at
  for update
  limit 1;

  if found and pending_invitation.expires_at > pg_catalog.clock_timestamp() then
    return query select null::uuid,'rejected'::text,'pending_invitation_exists'::text,pending_invitation.id,pending_invitation.state::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  select * into command_result from recora_private.p4b_record_operator_p4_command(
    p_operator_auth_user_id,p_organization_id,create_permission,'account.invitation.create','invitation',new_invitation_id,p_reason,p_request_id,p_correlation_id,p_idempotency_key,source_reference,source_sequence,payload_fingerprint,
    case when pending_invitation.id is null then '{}'::jsonb else pg_catalog.jsonb_build_object('prior_state',pending_invitation.state::text) end,
    pg_catalog.jsonb_build_object('state','pending','role',p_intended_role::text)
  );
  if not command_result.should_apply then
    return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
    return;
  end if;

  if pending_invitation.id is not null then
    update recora_private.p4_invitations
    set state='expired'::recora_private.p4_invitation_state,terminal_at=pg_catalog.clock_timestamp(),last_command_receipt_id=command_result.command_receipt_id,request_id=p_request_id,correlation_id=p_correlation_id
    where id=pending_invitation.id
    returning * into pending_invitation;
    select coalesce(pg_catalog.max(event_row.event_sequence),0) + 1 into next_event_sequence from recora_private.p4_invitation_events event_row where event_row.invitation_id = pending_invitation.id;
    insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
    values(pending_invitation.id,pending_invitation.organization_id,next_event_sequence,'pending'::recora_private.p4_invitation_state,'expired'::recora_private.p4_invitation_state,command_result.command_receipt_id,p_request_id,p_correlation_id);
  end if;

  insert into recora_private.p4_invitations(id,organization_id,recipient_binding_hash,intended_role,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at,created_at)
  values(new_invitation_id,p_organization_id,p_recipient_binding_hash,p_intended_role,command_result.command_receipt_id,command_result.command_receipt_id,p_request_id,p_correlation_id,p_expires_at,pg_catalog.clock_timestamp())
  returning * into invitation_row;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(invitation_row.id,p_organization_id,1,null,'pending'::recora_private.p4_invitation_state,command_result.command_receipt_id,p_request_id,p_correlation_id);

  set constraints recora_private.p4_invitations_final_integrity, recora_private.p4_invitation_current_event_alignment immediate;
  set constraints recora_private.p4_invitations_final_integrity, recora_private.p4_invitation_current_event_alignment deferred;

  return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,invitation_row.id,invitation_row.state::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
end;
$$;
create or replace function public.recora_p4b_invitation_resend(
  p_operator_auth_user_id uuid,
  p_invitation_id uuid,
  p_recipient_binding_hash text,
  p_expires_at timestamptz,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,invitation_id uuid,invitation_state text,membership_id uuid,membership_status text,membership_episode_id uuid,membership_episode_state text,audit_event_id uuid,operator_command_receipt_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  command_result record;
  old_invitation recora_private.p4_invitations%rowtype;
  new_invitation recora_private.p4_invitations%rowtype;
  source_reference text;
  source_sequence bigint;
  payload_fingerprint text;
  new_invitation_id uuid := extensions.gen_random_uuid();
  transition_state recora_private.p4_invitation_state;
  next_event_sequence bigint;
  resend_permission text := 'account.invitation.resend';
begin
  select * into old_invitation from recora_private.p4_invitations invitation_row where invitation_row.id = p_invitation_id for update;
  if not found then return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  source_reference := 'invite.resend.' || p_invitation_id::text;
  source_sequence := recora_private.p4b_source_sequence('invite.resend:' || p_invitation_id::text || ':' || p_idempotency_key);
  payload_fingerprint := recora_private.p4b_payload_fingerprint(pg_catalog.jsonb_build_object('action','resend','organization_id',old_invitation.organization_id,'invitation_id',p_invitation_id,'recipient_binding_hash',p_recipient_binding_hash,'expires_at',p_expires_at,'reason',p_reason));

  select * into command_result from recora_private.p4b_try_p4_command_replay(old_invitation.organization_id,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  if not command_result.should_apply then
    select * into new_invitation from recora_private.p4_invitations invitation_row where invitation_row.issuer_command_receipt_id = command_result.command_receipt_id order by invitation_row.created_at desc limit 1;
    return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,new_invitation.id,new_invitation.state::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
    return;
  end if;

  if old_invitation.state <> 'pending'::recora_private.p4_invitation_state then return query select null::uuid,'rejected'::text,'invitation_not_pending'::text,old_invitation.id,old_invitation.state::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  if p_recipient_binding_hash is distinct from old_invitation.recipient_binding_hash then return query select null::uuid,'rejected'::text,'recipient_mismatch'::text,old_invitation.id,old_invitation.state::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  if p_expires_at is null or p_expires_at <= pg_catalog.clock_timestamp() then return query select null::uuid,'rejected'::text,'invalid_reference'::text,old_invitation.id,old_invitation.state::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  if old_invitation.intended_role = 'admin'::public.recora_organization_member_role then resend_permission := 'account.invitation.resend.admin'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('p4b:invite:' || old_invitation.organization_id::text || ':' || old_invitation.recipient_binding_hash, 0));
  transition_state := case when old_invitation.expires_at <= pg_catalog.clock_timestamp() then 'expired'::recora_private.p4_invitation_state else 'superseded'::recora_private.p4_invitation_state end;

  select * into command_result from recora_private.p4b_record_operator_p4_command(
    p_operator_auth_user_id,old_invitation.organization_id,resend_permission,'account.invitation.resend','invitation',new_invitation_id,p_reason,p_request_id,p_correlation_id,p_idempotency_key,source_reference,source_sequence,payload_fingerprint,
    pg_catalog.jsonb_build_object('prior_state',old_invitation.state::text),pg_catalog.jsonb_build_object('prior_state',transition_state::text,'state','pending')
  );
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;

  if transition_state = 'superseded'::recora_private.p4_invitation_state then
    with transitioned_invitation as (
      update recora_private.p4_invitations invitation_row
      set state=transition_state,
          terminal_at=pg_catalog.clock_timestamp(),
          superseded_by_invitation_id=new_invitation_id,
          last_command_receipt_id=command_result.command_receipt_id,
          request_id=p_request_id,
          correlation_id=p_correlation_id
      where invitation_row.id=old_invitation.id
      returning invitation_row.*
    ), inserted_invitation as (
      insert into recora_private.p4_invitations(id,organization_id,recipient_binding_hash,intended_role,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at,created_at)
      select new_invitation_id,transitioned_invitation.organization_id,transitioned_invitation.recipient_binding_hash,transitioned_invitation.intended_role,command_result.command_receipt_id,command_result.command_receipt_id,p_request_id,p_correlation_id,p_expires_at,pg_catalog.clock_timestamp()
      from transitioned_invitation
      returning *
    )
    select * into new_invitation from inserted_invitation;
    select * into old_invitation from recora_private.p4_invitations invitation_row where invitation_row.id = p_invitation_id;
  else
    update recora_private.p4_invitations
    set state=transition_state,terminal_at=pg_catalog.clock_timestamp(),last_command_receipt_id=command_result.command_receipt_id,request_id=p_request_id,correlation_id=p_correlation_id
    where id=old_invitation.id
    returning * into old_invitation;

    insert into recora_private.p4_invitations(id,organization_id,recipient_binding_hash,intended_role,issuer_command_receipt_id,last_command_receipt_id,request_id,correlation_id,expires_at,created_at)
    values(new_invitation_id,old_invitation.organization_id,old_invitation.recipient_binding_hash,old_invitation.intended_role,command_result.command_receipt_id,command_result.command_receipt_id,p_request_id,p_correlation_id,p_expires_at,pg_catalog.clock_timestamp())
    returning * into new_invitation;
  end if;

  select coalesce(pg_catalog.max(event_row.event_sequence),0) + 1 into next_event_sequence from recora_private.p4_invitation_events event_row where event_row.invitation_id = old_invitation.id;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(old_invitation.id,old_invitation.organization_id,next_event_sequence,'pending'::recora_private.p4_invitation_state,transition_state,command_result.command_receipt_id,p_request_id,p_correlation_id);

  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(new_invitation.id,new_invitation.organization_id,1,null,'pending'::recora_private.p4_invitation_state,command_result.command_receipt_id,p_request_id,p_correlation_id);

  set constraints recora_private.p4_invitations_final_integrity, recora_private.p4_invitation_current_event_alignment immediate;
  set constraints recora_private.p4_invitations_final_integrity, recora_private.p4_invitation_current_event_alignment deferred;

  return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,new_invitation.id,new_invitation.state::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
end;
$$;
create or replace function public.recora_p4b_invitation_revoke(
  p_operator_auth_user_id uuid,
  p_invitation_id uuid,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,invitation_id uuid,invitation_state text,membership_id uuid,membership_status text,membership_episode_id uuid,membership_episode_state text,audit_event_id uuid,operator_command_receipt_id uuid)
language plpgsql security definer set search_path = '' as $$
declare command_result record; invitation_row recora_private.p4_invitations%rowtype; source_reference text; source_sequence bigint; payload_fingerprint text;
begin
  select * into invitation_row from recora_private.p4_invitations current_row where current_row.id = p_invitation_id for update;
  if not found then return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  source_reference := 'invite.revoke.' || p_invitation_id::text;
  source_sequence := recora_private.p4b_source_sequence('invite.revoke:' || p_invitation_id::text || ':' || p_idempotency_key);
  payload_fingerprint := recora_private.p4b_payload_fingerprint(pg_catalog.jsonb_build_object('action','revoke','organization_id',invitation_row.organization_id,'invitation_id',p_invitation_id,'reason',p_reason));
  select * into command_result from recora_private.p4b_try_p4_command_replay(invitation_row.organization_id,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  if not command_result.should_apply then
    select * into invitation_row from recora_private.p4_invitations current_row where current_row.id = p_invitation_id;
    return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,invitation_row.id,invitation_row.state::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
    return;
  end if;
  if invitation_row.state <> 'pending'::recora_private.p4_invitation_state then return query select null::uuid,'rejected'::text,'invitation_not_pending'::text,invitation_row.id,invitation_row.state::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  if invitation_row.expires_at <= pg_catalog.clock_timestamp() then return query select null::uuid,'rejected'::text,'invitation_expired'::text,invitation_row.id,invitation_row.state::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  select * into command_result from recora_private.p4b_record_operator_p4_command(
    p_operator_auth_user_id,invitation_row.organization_id,'account.invitation.revoke','account.invitation.revoke','invitation',invitation_row.id,p_reason,p_request_id,p_correlation_id,p_idempotency_key,source_reference,source_sequence,payload_fingerprint,
    pg_catalog.jsonb_build_object('invitation_state',invitation_row.state::text),pg_catalog.jsonb_build_object('invitation_state','revoked')
  );
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,invitation_row.id,invitation_row.state::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;
  update recora_private.p4_invitations set state='revoked'::recora_private.p4_invitation_state,terminal_at=pg_catalog.clock_timestamp(),last_command_receipt_id=command_result.command_receipt_id,request_id=p_request_id,correlation_id=p_correlation_id where id=invitation_row.id returning * into invitation_row;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(invitation_row.id,invitation_row.organization_id,2,'pending'::recora_private.p4_invitation_state,'revoked'::recora_private.p4_invitation_state,command_result.command_receipt_id,p_request_id,p_correlation_id);
  return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,invitation_row.id,invitation_row.state::text,null::uuid,null::text,null::uuid,null::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
end;
$$;
drop function if exists public.recora_p4b_invitation_accept(uuid, uuid, text, uuid, uuid, text);

create or replace function public.recora_p4b_invitation_accept(
  p_invitation_id uuid,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,invitation_id uuid,invitation_state text,membership_id uuid,membership_status text,membership_episode_id uuid,membership_episode_state text,audit_event_id uuid,operator_command_receipt_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  command_result record;
  replay_result record;
  invitation_row recora_private.p4_invitations%rowtype;
  membership_row public.organization_members%rowtype;
  episode_row recora_private.p4_membership_episodes%rowtype;
  next_episode_number bigint;
  source_reference text;
  source_sequence bigint;
  payload_fingerprint text;
  customer_auth_user_id uuid := auth.uid();
  customer_recipient_binding_hash text;
begin
  if customer_auth_user_id is null then
    return query select null::uuid,'rejected'::text,'identity_unverified'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  customer_recipient_binding_hash := recora_private.p4b_confirmed_auth_email_hash(customer_auth_user_id);
  if customer_recipient_binding_hash is null then
    return query select null::uuid,'rejected'::text,'identity_unverified'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  select * into invitation_row from recora_private.p4_invitations current_row where current_row.id = p_invitation_id for update;
  if not found then
    return query select null::uuid,'rejected'::text,'invitation_unavailable'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  source_reference := 'invite.accept.' || p_invitation_id::text;
  source_sequence := recora_private.p4b_source_sequence('invite.accept:' || p_invitation_id::text || ':' || p_idempotency_key);
  payload_fingerprint := recora_private.p4b_payload_fingerprint(pg_catalog.jsonb_build_object('action','accept','organization_id',invitation_row.organization_id,'invitation_id',p_invitation_id,'customer_auth_user_id',customer_auth_user_id,'recipient_binding_hash',customer_recipient_binding_hash));

  select * into replay_result
  from recora_private.p4b_try_p4_command_replay(invitation_row.organization_id,'invitation.lifecycle','customer_session'::recora_private.p4_source_kind,'p4b.account',source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  if not replay_result.should_apply then
    select * into invitation_row from recora_private.p4_invitations current_row where current_row.id = p_invitation_id;
    select * into membership_row from public.organization_members member_current where member_current.id = invitation_row.accepted_membership_id;
    select * into episode_row from recora_private.p4_membership_episodes episode_current where episode_current.invitation_id = invitation_row.id;
    return query select replay_result.command_receipt_id,replay_result.outcome,replay_result.reason_code,invitation_row.id,invitation_row.state::text,membership_row.id,membership_row.membership_status::text,episode_row.id,episode_row.state::text,null::uuid,null::uuid;
    return;
  end if;

  if invitation_row.state <> 'pending'::recora_private.p4_invitation_state
    or invitation_row.expires_at <= pg_catalog.clock_timestamp()
    or customer_recipient_binding_hash is distinct from invitation_row.recipient_binding_hash then
    return query select null::uuid,'rejected'::text,'invitation_unavailable'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('p4b:member:' || invitation_row.organization_id::text || ':' || customer_auth_user_id::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('p4b:episode:' || invitation_row.organization_id::text, 0));
  if exists(select 1 from public.organization_members existing_member where existing_member.organization_id = invitation_row.organization_id and existing_member.user_id = customer_auth_user_id) then
    return query select null::uuid,'rejected'::text,'invitation_unavailable'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid;
    return;
  end if;

  select * into command_result from recora_private.p4b_record_customer_session_p4_command(customer_auth_user_id,invitation_row.organization_id,source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  if not command_result.should_apply then
    select * into invitation_row from recora_private.p4_invitations current_row where current_row.id = p_invitation_id;
    select * into membership_row from public.organization_members member_current where member_current.id = invitation_row.accepted_membership_id;
    select * into episode_row from recora_private.p4_membership_episodes episode_current where episode_current.invitation_id = invitation_row.id;
    return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,invitation_row.id,invitation_row.state::text,membership_row.id,membership_row.membership_status::text,episode_row.id,episode_row.state::text,null::uuid,null::uuid;
    return;
  end if;

  select coalesce(pg_catalog.max(existing_episode.episode_number), 0) + 1 into next_episode_number from recora_private.p4_membership_episodes existing_episode where existing_episode.organization_id = invitation_row.organization_id;
  insert into recora_private.p4_membership_episodes(organization_id,invitation_id,intended_role,episode_number,command_receipt_id,request_id,correlation_id)
  values(invitation_row.organization_id,invitation_row.id,invitation_row.intended_role,next_episode_number,command_result.command_receipt_id,p_request_id,p_correlation_id)
  returning * into episode_row;
  insert into recora_private.p4_membership_episode_events(episode_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(episode_row.id,invitation_row.organization_id,1,null,'invited'::recora_private.p4_membership_episode_state,command_result.command_receipt_id,p_request_id,p_correlation_id);

  insert into public.organization_members(organization_id,user_id,email,role,invited_at,accepted_at,membership_status)
  values(invitation_row.organization_id,customer_auth_user_id,null,invitation_row.intended_role,invitation_row.created_at,pg_catalog.clock_timestamp(),'active'::public.recora_organization_membership_status)
  returning * into membership_row;

  update recora_private.p4_invitations set state='accepted'::recora_private.p4_invitation_state,accepted_at=pg_catalog.clock_timestamp(),accepted_user_id=customer_auth_user_id,accepted_membership_id=membership_row.id,last_command_receipt_id=command_result.command_receipt_id,request_id=p_request_id,correlation_id=p_correlation_id where id=invitation_row.id returning * into invitation_row;
  insert into recora_private.p4_invitation_events(invitation_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(invitation_row.id,invitation_row.organization_id,2,'pending'::recora_private.p4_invitation_state,'accepted'::recora_private.p4_invitation_state,command_result.command_receipt_id,p_request_id,p_correlation_id);

  update recora_private.p4_membership_episodes set membership_id=membership_row.id,accepted_user_id=customer_auth_user_id,state='active'::recora_private.p4_membership_episode_state,command_receipt_id=command_result.command_receipt_id,request_id=p_request_id,correlation_id=p_correlation_id where id=episode_row.id returning * into episode_row;
  insert into recora_private.p4_membership_episode_events(episode_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(episode_row.id,invitation_row.organization_id,2,'invited'::recora_private.p4_membership_episode_state,'active'::recora_private.p4_membership_episode_state,command_result.command_receipt_id,p_request_id,p_correlation_id);

  set constraints recora_private.p4_invitations_final_integrity, recora_private.p4_invitation_current_event_alignment, recora_private.p4_membership_episode_event_alignment immediate;
  set constraints recora_private.p4_invitations_final_integrity, recora_private.p4_invitation_current_event_alignment, recora_private.p4_membership_episode_event_alignment deferred;

  return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,invitation_row.id,invitation_row.state::text,membership_row.id,membership_row.membership_status::text,episode_row.id,episode_row.state::text,null::uuid,null::uuid;
end;
$$;
create or replace function public.recora_p4b_membership_suspend(
  p_operator_auth_user_id uuid,
  p_membership_id uuid,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,invitation_id uuid,invitation_state text,membership_id uuid,membership_status text,membership_episode_id uuid,membership_episode_state text,audit_event_id uuid,operator_command_receipt_id uuid)
language plpgsql security definer set search_path = '' as $$
declare command_result record; member_row public.organization_members%rowtype; episode_row recora_private.p4_membership_episodes%rowtype; source_reference text; source_sequence bigint; payload_fingerprint text;
begin
  select * into member_row from public.organization_members current_member where current_member.id = p_membership_id for update;
  if not found then return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  source_reference := 'member.suspend.' || p_membership_id::text;
  source_sequence := recora_private.p4b_source_sequence('member.suspend:' || p_membership_id::text || ':' || p_idempotency_key);
  payload_fingerprint := recora_private.p4b_payload_fingerprint(pg_catalog.jsonb_build_object('action','suspend','organization_id',member_row.organization_id,'membership_id',p_membership_id,'reason',p_reason));
  select * into command_result from recora_private.p4b_try_p4_command_replay(member_row.organization_id,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  select * into episode_row from recora_private.p4_membership_episodes current_episode where current_episode.membership_id = p_membership_id order by current_episode.episode_number desc limit 1;
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;
  if member_row.membership_status <> 'active'::public.recora_organization_membership_status or member_row.user_id is null or member_row.accepted_at is null or episode_row.id is null or episode_row.state <> 'active'::recora_private.p4_membership_episode_state then
    return query select null::uuid,'rejected'::text,'membership_not_active'::text,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,null::uuid,null::uuid;
    return;
  end if;
  select * into command_result from recora_private.p4b_record_operator_p4_command(
    p_operator_auth_user_id,member_row.organization_id,'account.membership.suspend','account.membership.suspend','membership',member_row.id,p_reason,p_request_id,p_correlation_id,p_idempotency_key,source_reference,source_sequence,payload_fingerprint,
    pg_catalog.jsonb_build_object('membership_state',member_row.membership_status::text),pg_catalog.jsonb_build_object('membership_state','suspended')
  );
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;
  update public.organization_members set membership_status='suspended'::public.recora_organization_membership_status where id=member_row.id returning * into member_row;
  return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
end;
$$;

create or replace function public.recora_p4b_membership_reactivate(
  p_operator_auth_user_id uuid,
  p_membership_id uuid,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,invitation_id uuid,invitation_state text,membership_id uuid,membership_status text,membership_episode_id uuid,membership_episode_state text,audit_event_id uuid,operator_command_receipt_id uuid)
language plpgsql security definer set search_path = '' as $$
declare command_result record; member_row public.organization_members%rowtype; episode_row recora_private.p4_membership_episodes%rowtype; source_reference text; source_sequence bigint; payload_fingerprint text;
begin
  select * into member_row from public.organization_members current_member where current_member.id = p_membership_id for update;
  if not found then return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  source_reference := 'member.reactivate.' || p_membership_id::text;
  source_sequence := recora_private.p4b_source_sequence('member.reactivate:' || p_membership_id::text || ':' || p_idempotency_key);
  payload_fingerprint := recora_private.p4b_payload_fingerprint(pg_catalog.jsonb_build_object('action','reactivate','organization_id',member_row.organization_id,'membership_id',p_membership_id,'reason',p_reason));
  select * into command_result from recora_private.p4b_try_p4_command_replay(member_row.organization_id,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  select * into episode_row from recora_private.p4_membership_episodes current_episode where current_episode.membership_id = p_membership_id order by current_episode.episode_number desc limit 1;
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;
  if member_row.membership_status <> 'suspended'::public.recora_organization_membership_status or member_row.user_id is null or member_row.accepted_at is null or episode_row.id is null or episode_row.state <> 'active'::recora_private.p4_membership_episode_state then
    return query select null::uuid,'rejected'::text,'membership_not_suspended'::text,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,null::uuid,null::uuid;
    return;
  end if;
  select * into command_result from recora_private.p4b_record_operator_p4_command(
    p_operator_auth_user_id,member_row.organization_id,'account.membership.reactivate','account.membership.reactivate','membership',member_row.id,p_reason,p_request_id,p_correlation_id,p_idempotency_key,source_reference,source_sequence,payload_fingerprint,
    pg_catalog.jsonb_build_object('membership_state',member_row.membership_status::text),pg_catalog.jsonb_build_object('membership_state','active')
  );
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;
  update public.organization_members set membership_status='active'::public.recora_organization_membership_status where id=member_row.id returning * into member_row;
  return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
end;
$$;

create or replace function public.recora_p4b_membership_revoke(
  p_operator_auth_user_id uuid,
  p_membership_id uuid,
  p_reason text,
  p_request_id uuid,
  p_correlation_id uuid,
  p_idempotency_key text
)
returns table(command_receipt_id uuid,outcome text,reason_code text,invitation_id uuid,invitation_state text,membership_id uuid,membership_status text,membership_episode_id uuid,membership_episode_state text,audit_event_id uuid,operator_command_receipt_id uuid)
language plpgsql security definer set search_path = '' as $$
declare command_result record; member_row public.organization_members%rowtype; episode_row recora_private.p4_membership_episodes%rowtype; next_event_sequence bigint; source_reference text; source_sequence bigint; payload_fingerprint text;
begin
  select * into member_row from public.organization_members current_member where current_member.id = p_membership_id for update;
  if not found then return query select null::uuid,'rejected'::text,'invalid_reference'::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::text,null::uuid,null::uuid; return; end if;
  source_reference := 'member.revoke.' || p_membership_id::text;
  source_sequence := recora_private.p4b_source_sequence('member.revoke:' || p_membership_id::text || ':' || p_idempotency_key);
  payload_fingerprint := recora_private.p4b_payload_fingerprint(pg_catalog.jsonb_build_object('action','revoke','organization_id',member_row.organization_id,'membership_id',p_membership_id,'reason',p_reason));
  select * into command_result from recora_private.p4b_try_p4_command_replay(member_row.organization_id,'invitation.lifecycle','manual'::recora_private.p4_source_kind,'p4b.account',source_reference,source_sequence,payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key);
  select * into episode_row from recora_private.p4_membership_episodes current_episode where current_episode.membership_id = p_membership_id order by current_episode.episode_number desc limit 1;
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;
  if member_row.membership_status not in ('active'::public.recora_organization_membership_status,'suspended'::public.recora_organization_membership_status) or member_row.user_id is null or member_row.accepted_at is null or episode_row.id is null or episode_row.state <> 'active'::recora_private.p4_membership_episode_state then
    return query select null::uuid,'rejected'::text,'membership_not_revocable'::text,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,null::uuid,null::uuid;
    return;
  end if;
  select * into command_result from recora_private.p4b_record_operator_p4_command(
    p_operator_auth_user_id,member_row.organization_id,'account.membership.revoke','account.membership.revoke','membership',member_row.id,p_reason,p_request_id,p_correlation_id,p_idempotency_key,source_reference,source_sequence,payload_fingerprint,
    pg_catalog.jsonb_build_object('membership_state',member_row.membership_status::text),pg_catalog.jsonb_build_object('membership_state','revoked')
  );
  if not command_result.should_apply then return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id; return; end if;

  update public.organization_members set membership_status='revoked'::public.recora_organization_membership_status where id=member_row.id returning * into member_row;
  update recora_private.p4_membership_episodes set state='revoked'::recora_private.p4_membership_episode_state,command_receipt_id=command_result.command_receipt_id,request_id=p_request_id,correlation_id=p_correlation_id where id=episode_row.id returning * into episode_row;
  select coalesce(pg_catalog.max(event_row.event_sequence),0) + 1 into next_event_sequence from recora_private.p4_membership_episode_events event_row where event_row.episode_id = episode_row.id;
  insert into recora_private.p4_membership_episode_events(episode_id,organization_id,event_sequence,previous_state,next_state,command_receipt_id,request_id,correlation_id)
  values(episode_row.id,episode_row.organization_id,next_event_sequence,'active'::recora_private.p4_membership_episode_state,'revoked'::recora_private.p4_membership_episode_state,command_result.command_receipt_id,p_request_id,p_correlation_id);
  update public.organization_members set user_id=null,accepted_at=null,email=recora_private.p4b_revoked_membership_email(member_row.id),membership_status='revoked'::public.recora_organization_membership_status where id=member_row.id returning * into member_row;
  return query select command_result.command_receipt_id,command_result.outcome,command_result.reason_code,null::uuid,null::text,member_row.id,member_row.membership_status::text,episode_row.id,episode_row.state::text,command_result.audit_event_id,command_result.operator_command_receipt_id;
end;
$$;

create or replace function public.recora_p4b_resolve_customer_access(
  p_verified_auth_user_id uuid,
  p_organization_id uuid,
  p_project_id uuid default null,
  p_required_capability text default null
)
returns table(customer_access_allowed boolean,reason_code text,membership_role text,entitlement_capabilities jsonb,entitlement_limits jsonb,lifecycle_reason_code text,entitlement_reason_code text,checkpoint_reason_code text)
language plpgsql stable security definer set search_path = '' as $$
declare member_count integer; resolved_membership_role public.recora_organization_member_role; lifecycle_result record; entitlement_result record; checkpoint_result record;
begin
  if p_verified_auth_user_id is null or p_organization_id is null
    or not exists(select 1 from auth.users user_row where user_row.id = p_verified_auth_user_id)
    or not exists(select 1 from public.organizations organization_row where organization_row.id = p_organization_id)
    or (p_project_id is not null and not exists(select 1 from public.projects project_row where project_row.id = p_project_id and project_row.organization_id = p_organization_id)) then
    return query select false,'invalid_scope'::text,null::text,'{}'::jsonb,'{}'::jsonb,null::text,null::text,null::text;
    return;
  end if;
  if p_required_capability is not null and p_required_capability !~ '^[a-z][a-z0-9_.-]{0,127}$' then
    return query select false,'capability_unavailable'::text,null::text,'{}'::jsonb,'{}'::jsonb,null::text,null::text,null::text;
    return;
  end if;

  select pg_catalog.count(*) into member_count
  from public.organization_members member_row
  where member_row.organization_id = p_organization_id
    and member_row.user_id = p_verified_auth_user_id
    and member_row.accepted_at is not null
    and member_row.membership_status = 'active'::public.recora_organization_membership_status;
  if member_count = 0 then return query select false,'membership_required'::text,null::text,'{}'::jsonb,'{}'::jsonb,null::text,null::text,null::text; return; end if;
  if member_count <> 1 then return query select false,'ambiguous_membership'::text,null::text,'{}'::jsonb,'{}'::jsonb,null::text,null::text,null::text; return; end if;
  select member_row.role into resolved_membership_role
  from public.organization_members member_row
  where member_row.organization_id = p_organization_id and member_row.user_id = p_verified_auth_user_id and member_row.accepted_at is not null and member_row.membership_status = 'active'::public.recora_organization_membership_status
  limit 1;

  select * into lifecycle_result from recora_private.resolve_data_lifecycle_access(p_organization_id, p_project_id);
  if not coalesce(lifecycle_result.customer_access_allowed, false) then
    return query select false,'lifecycle_' || coalesce(lifecycle_result.reason_code, 'unavailable'),resolved_membership_role::text,'{}'::jsonb,'{}'::jsonb,lifecycle_result.reason_code::text,null::text,null::text;
    return;
  end if;

  select * into entitlement_result from public.recora_resolve_current_entitlement_snapshot(p_organization_id, p_project_id);
  if entitlement_result.reason_code is distinct from 'ok' then
    return query select false,'entitlement_' || coalesce(entitlement_result.reason_code, 'unavailable'),resolved_membership_role::text,'{}'::jsonb,'{}'::jsonb,lifecycle_result.reason_code::text,entitlement_result.reason_code::text,null::text;
    return;
  end if;
  if p_required_capability is not null and (entitlement_result.capabilities is null or entitlement_result.capabilities -> p_required_capability is null or coalesce((entitlement_result.capabilities ->> p_required_capability)::boolean, false) is not true) then
    return query select false,'capability_unavailable'::text,resolved_membership_role::text,entitlement_result.capabilities,entitlement_result.limits,lifecycle_result.reason_code::text,entitlement_result.reason_code::text,null::text;
    return;
  end if;

  select * into checkpoint_result from public.recora_p4_resolve_checkpoint_gate(p_organization_id, p_project_id);
  if not coalesce(checkpoint_result.customer_access_allowed, false) then
    return query select false,'checkpoint_' || coalesce(checkpoint_result.reason_code, 'unavailable'),resolved_membership_role::text,entitlement_result.capabilities,entitlement_result.limits,lifecycle_result.reason_code::text,entitlement_result.reason_code::text,checkpoint_result.reason_code::text;
    return;
  end if;

  return query select true,'ok'::text,resolved_membership_role::text,entitlement_result.capabilities,entitlement_result.limits,lifecycle_result.reason_code::text,entitlement_result.reason_code::text,checkpoint_result.reason_code::text;
end;
$$;

comment on function public.recora_p4b_invitation_create(uuid, uuid, text, public.recora_organization_member_role, timestamptz, text, uuid, uuid, text) is 'P4-B service-role-only invitation creation command with verified operator identity, action-specific permission, invitation-target audit evidence, P4 receipt, and current/event state.';
comment on function public.recora_p4b_invitation_resend(uuid, uuid, text, timestamptz, text, uuid, uuid, text) is 'P4-B service-role-only invitation resend command. It expires stale pending invitations or supersedes live pending invitations with superseded_by_invitation_id before creating the replacement invitation/event in one transaction.';
comment on function public.recora_p4b_invitation_revoke(uuid, uuid, text, uuid, uuid, text) is 'P4-B service-role-only invitation revoke command with invitation-target operator authorization and audit receipt.';
comment on function public.recora_p4b_invitation_accept(uuid, uuid, uuid, text) is 'P4-B authenticated-only invitation acceptance command. It uses auth.uid(), confirmed Auth email hashing, recipient binding, customer-session command receipt evidence, and performs no live Auth write or email send.';
comment on function public.recora_p4b_membership_suspend(uuid, uuid, text, uuid, uuid, text) is 'P4-B service-role-only membership suspend command. Suspension is represented in Phase 3 membership state with P4 command and membership-target operator audit evidence.';
comment on function public.recora_p4b_membership_reactivate(uuid, uuid, text, uuid, uuid, text) is 'P4-B service-role-only audited membership reactivation command. It only allows suspended active-episode memberships to return to active.';
comment on function public.recora_p4b_membership_revoke(uuid, uuid, text, uuid, uuid, text) is 'P4-B service-role-only membership revoke command. It terminally revokes the P4 membership episode and frees Phase 3 user identity only after P4 evidence is recorded.';
comment on function public.recora_p4b_resolve_customer_access(uuid, uuid, uuid, text) is 'P4-B service-role-only customer-safe access resolver. It returns membership role, capability/limit DTOs, and reason codes, never private ids or raw operational evidence.';

revoke all on function recora_private.p4b_source_sequence(text) from public, anon, authenticated, service_role;
revoke all on function recora_private.p4b_payload_fingerprint(jsonb) from public, anon, authenticated, service_role;
revoke all on function recora_private.p4b_revoked_membership_email(uuid) from public, anon, authenticated, service_role;
revoke all on function recora_private.p4b_try_p4_command_replay(uuid, text, recora_private.p4_source_kind, text, text, bigint, text, uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function recora_private.p4b_execute_operator_command(uuid, uuid, text, text, text, uuid, text, uuid, uuid, jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function recora_private.p4b_record_operator_p4_command(uuid, uuid, text, text, text, uuid, text, uuid, uuid, text, text, bigint, text, jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function recora_private.p4b_confirmed_auth_email_hash(uuid) from public, anon, authenticated, service_role;
revoke all on function recora_private.p4b_record_customer_session_p4_command(uuid, uuid, text, bigint, text, uuid, uuid, text) from public, anon, authenticated, service_role;

revoke all on function public.recora_p4b_invitation_create(uuid, uuid, text, public.recora_organization_member_role, timestamptz, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.recora_p4b_invitation_resend(uuid, uuid, text, timestamptz, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.recora_p4b_invitation_revoke(uuid, uuid, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.recora_p4b_invitation_accept(uuid, uuid, uuid, text) from public, anon, service_role;
revoke all on function public.recora_p4b_membership_suspend(uuid, uuid, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.recora_p4b_membership_reactivate(uuid, uuid, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.recora_p4b_membership_revoke(uuid, uuid, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.recora_p4b_resolve_customer_access(uuid, uuid, uuid, text) from public, anon, authenticated;

revoke all on function public.recora_p4b_invitation_create(uuid, uuid, text, public.recora_organization_member_role, timestamptz, text, uuid, uuid, text) from service_role;
revoke all on function public.recora_p4b_invitation_resend(uuid, uuid, text, timestamptz, text, uuid, uuid, text) from service_role;
revoke all on function public.recora_p4b_invitation_revoke(uuid, uuid, text, uuid, uuid, text) from service_role;
revoke all on function public.recora_p4b_membership_suspend(uuid, uuid, text, uuid, uuid, text) from service_role;
revoke all on function public.recora_p4b_membership_reactivate(uuid, uuid, text, uuid, uuid, text) from service_role;
revoke all on function public.recora_p4b_membership_revoke(uuid, uuid, text, uuid, uuid, text) from service_role;
revoke all on function public.recora_p4b_resolve_customer_access(uuid, uuid, uuid, text) from service_role;

revoke all on function public.recora_p4b_invitation_accept(uuid, uuid, uuid, text) from authenticated;

grant execute on function public.recora_p4b_invitation_create(uuid, uuid, text, public.recora_organization_member_role, timestamptz, text, uuid, uuid, text) to service_role;
grant execute on function public.recora_p4b_invitation_resend(uuid, uuid, text, timestamptz, text, uuid, uuid, text) to service_role;
grant execute on function public.recora_p4b_invitation_revoke(uuid, uuid, text, uuid, uuid, text) to service_role;
grant execute on function public.recora_p4b_membership_suspend(uuid, uuid, text, uuid, uuid, text) to service_role;
grant execute on function public.recora_p4b_membership_reactivate(uuid, uuid, text, uuid, uuid, text) to service_role;
grant execute on function public.recora_p4b_membership_revoke(uuid, uuid, text, uuid, uuid, text) to service_role;
grant execute on function public.recora_p4b_resolve_customer_access(uuid, uuid, uuid, text) to service_role;
grant execute on function public.recora_p4b_invitation_accept(uuid, uuid, uuid, text) to authenticated;
