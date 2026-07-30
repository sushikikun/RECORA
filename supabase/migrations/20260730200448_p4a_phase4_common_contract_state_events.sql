-- Issue #121 / P4-A: additive private lifecycle, contract, billing, and recovery primitives.
-- This migration creates neither product decisions nor customer access authority.
set search_path = public, extensions;

do $types$
begin
  create type recora_private.p4_business_state as enum ('lead','onboarding','serving','paused','closed','rejected');
  create type recora_private.p4_invitation_state as enum ('pending','accepted','expired','revoked','superseded');
  create type recora_private.p4_contract_state as enum ('draft','pending_activation','active','paused','canceled','ended');
  create type recora_private.p4_receipt_state as enum ('received','validated','applying','applied','ignored_duplicate','rejected','reconciliation_required');
  create type recora_private.p4_payment_fact_kind as enum ('payment_succeeded','payment_failed','payment_reversed','payment_disputed','payment_unknown');
  create type recora_private.p4_source_kind as enum ('manual','provider_fixture');
  create type recora_private.p4_command_outcome as enum ('accepted','replayed','rejected','reconciliation_required');
  create type recora_private.p4_reason as enum ('ok','invalid_scope','invalid_reference','invalid_legacy_inventory','duplicate_command','idempotency_conflict','ordering_conflict','checkpoint_pending','checkpoint_failed','reconciliation_required','command_unavailable');
  create type recora_private.p4_checkpoint_state as enum ('pending','applying','completed','failed','reconciliation_required');
  create type recora_private.p4_outbox_state as enum ('pending','delivered','failed','reconciliation_required');
end;
$types$;

revoke all on schema recora_private from public, anon, authenticated;

create or replace function recora_private.p4_opaque(p_value text)
returns boolean language sql immutable set search_path = '' as $$
  select p_value is not null and char_length(p_value) between 3 and 128
    and p_value ~ '^[a-z][a-z0-9_.:-]*$'
    and lower(p_value) !~ '(^|[_.:-])(token|secret|password|credential|authorization|cookie|session|email|phone|jwt|claim|access|refresh|payload|webhook|signature|payment_method|database|private|api)([_.:-]|$)';
$$;
create or replace function recora_private.p4_reject_history_mutation()
returns trigger language plpgsql set search_path = '' as $$ begin raise exception '% is append-only',tg_table_name; end; $$;
create or replace function recora_private.p4_assert_legacy_inventory()
returns void language plpgsql set search_path = '' as $$
begin
  if exists(select 1 from recora_admin.plan_configs where plan_code is null or btrim(plan_code)='')
    or exists(select 1 from recora_admin.plan_configs group by plan_code having count(*)>1) then raise exception 'P4 legacy inventory has null or duplicate plan config'; end if;
  if exists(select 1 from recora_admin.customer_profiles c left join public.organizations o on o.id=c.organization_id left join public.projects p on p.id=c.project_id and p.organization_id=c.organization_id where c.organization_id is null or o.id is null or(c.project_id is not null and p.id is null)) then raise exception 'P4 legacy inventory has null or orphan profile'; end if;
  if exists(select 1 from recora_admin.customer_subscriptions c left join public.organizations o on o.id=c.organization_id left join public.projects p on p.id=c.project_id and p.organization_id=c.organization_id left join recora_admin.plan_configs pc on pc.id=c.plan_config_id and pc.plan_code=c.plan_code where c.organization_id is null or c.plan_config_id is null or c.plan_code is null or o.id is null or pc.id is null or(c.project_id is not null and p.id is null)) then raise exception 'P4 legacy inventory has null or orphan subscription'; end if;
  if exists(select 1 from recora_admin.customer_subscriptions group by organization_id,coalesce(project_id,'00000000-0000-0000-0000-000000000000'::uuid) having count(*)>1 or count(distinct status)>1) then raise exception 'P4 legacy inventory has duplicate or contradictory subscription'; end if;
end; $$;

create table recora_private.p4_command_receipts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, project_id uuid,
  command_type text not null check(recora_private.p4_opaque(command_type)), source_kind recora_private.p4_source_kind not null,
  source_namespace text not null check(recora_private.p4_opaque(source_namespace)), source_reference text not null check(recora_private.p4_opaque(source_reference)), source_sequence bigint not null check(source_sequence>0), payload_fingerprint text not null check(payload_fingerprint~'^[0-9a-f]{64}$'),
  request_id uuid not null, correlation_id uuid not null, idempotency_key text not null check(recora_private.p4_opaque(idempotency_key)),
  outcome recora_private.p4_command_outcome not null default 'accepted', stable_reason recora_private.p4_reason not null default 'ok',
  operator_audit_event_id uuid references recora_audit.operator_events(id) on delete restrict, operator_command_receipt_id uuid references recora_operator.operator_command_receipts(id) on delete restrict,
  scope_key text generated always as ('organization:'||organization_id::text||coalesce(':project:'||project_id::text,'')) stored, created_at timestamptz not null default now(),
  foreign key(project_id,organization_id) references public.projects(id,organization_id) on delete restrict, unique(scope_key,command_type,idempotency_key),
  check((operator_audit_event_id is null)=(operator_command_receipt_id is null)), check(source_kind<>'manual' or operator_command_receipt_id is not null),
  check((outcome='accepted' and stable_reason='ok')or(outcome='replayed' and stable_reason='duplicate_command')or(outcome='rejected' and stable_reason<>'ok')or(outcome='reconciliation_required' and stable_reason='reconciliation_required'))
);
create or replace function recora_private.p4_validate_command_receipt()
returns trigger language plpgsql set search_path='' as $$ declare r recora_operator.operator_command_receipts%rowtype; begin
  perform recora_private.p4_assert_legacy_inventory();
  if new.operator_command_receipt_id is not null then select * into r from recora_operator.operator_command_receipts where id=new.operator_command_receipt_id;
    if not found or r.audit_event_id is distinct from new.operator_audit_event_id or r.organization_id is distinct from new.organization_id or r.project_id is distinct from new.project_id or r.request_id is distinct from new.request_id or r.correlation_id is distinct from new.correlation_id then raise exception 'P4 command receipt audit causal pair mismatch'; end if;
  end if; return new; end; $$;
create trigger p4_command_receipt_validate before insert on recora_private.p4_command_receipts for each row execute function recora_private.p4_validate_command_receipt();
create trigger p4_command_receipt_append_only before update or delete on recora_private.p4_command_receipts for each row execute function recora_private.p4_reject_history_mutation();

create table recora_private.p4_business_lifecycle_episodes (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, episode_number bigint not null check(episode_number>0), initial_state recora_private.p4_business_state not null default 'lead', start_command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict, request_id uuid not null, correlation_id uuid not null, opened_at timestamptz not null default now(), unique(organization_id,episode_number),unique(id,organization_id));
create table recora_private.p4_business_lifecycle_current (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null unique references public.organizations(id) on delete restrict,episode_id uuid not null,state recora_private.p4_business_state not null,version bigint not null default 1 check(version>0),last_command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(episode_id,organization_id) references recora_private.p4_business_lifecycle_episodes(id,organization_id) on delete restrict);
create table recora_private.p4_business_lifecycle_events (
 id uuid primary key default gen_random_uuid(),episode_id uuid not null references recora_private.p4_business_lifecycle_episodes(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,event_sequence bigint not null check(event_sequence>0),previous_state recora_private.p4_business_state,next_state recora_private.p4_business_state not null,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,occurred_at timestamptz not null default now(),unique(episode_id,event_sequence),check((event_sequence=1 and previous_state is null and next_state='lead')or(event_sequence>1 and previous_state is not null)));

create table recora_private.p4_invitations (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete restrict,recipient_binding_hash text not null check(recipient_binding_hash~'^[0-9a-f]{64}$'),state recora_private.p4_invitation_state not null default 'pending',issuer_command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,last_command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,expires_at timestamptz not null,accepted_at timestamptz,terminal_at timestamptz,superseded_by_invitation_id uuid,version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,organization_id),foreign key(superseded_by_invitation_id,organization_id) references recora_private.p4_invitations(id,organization_id) on delete restrict,check(expires_at>created_at),check((state='pending' and accepted_at is null and terminal_at is null and superseded_by_invitation_id is null)or(state='accepted' and accepted_at is not null and terminal_at is null and superseded_by_invitation_id is null)or(state in('expired','revoked')and accepted_at is null and terminal_at is not null and superseded_by_invitation_id is null)or(state='superseded'and accepted_at is null and terminal_at is not null and superseded_by_invitation_id is not null)));
create table recora_private.p4_invitation_events (
 id uuid primary key default gen_random_uuid(),invitation_id uuid not null references recora_private.p4_invitations(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,event_sequence bigint not null check(event_sequence>0),previous_state recora_private.p4_invitation_state,next_state recora_private.p4_invitation_state not null,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,occurred_at timestamptz not null default now(),unique(invitation_id,event_sequence),check((event_sequence=1 and previous_state is null and next_state='pending')or(event_sequence>1 and previous_state='pending' and next_state in('accepted','expired','revoked','superseded'))));

create table recora_private.p4_contract_projections (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete restrict,project_id uuid,contract_reference text not null check(recora_private.p4_opaque(contract_reference)),source_namespace text not null check(recora_private.p4_opaque(source_namespace)),state recora_private.p4_contract_state not null default 'draft',latest_source_sequence bigint not null check(latest_source_sequence>0),plan_policy_version_id uuid references recora_private.plan_policy_versions(id) on delete restrict,entitlement_snapshot_id uuid,last_command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(project_id,organization_id) references public.projects(id,organization_id) on delete restrict,foreign key(entitlement_snapshot_id,organization_id) references recora_private.entitlement_snapshots(id,organization_id) on delete restrict,unique(id,organization_id),unique(organization_id,contract_reference),check((plan_policy_version_id is null)=(entitlement_snapshot_id is null)));
create table recora_private.p4_contract_events (
 id uuid primary key default gen_random_uuid(),contract_id uuid not null references recora_private.p4_contract_projections(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,event_sequence bigint not null check(event_sequence>0),source_namespace text not null check(recora_private.p4_opaque(source_namespace)),source_reference text not null check(recora_private.p4_opaque(source_reference)),source_sequence bigint not null check(source_sequence>0),payload_fingerprint text not null check(payload_fingerprint~'^[0-9a-f]{64}$'),previous_state recora_private.p4_contract_state,next_state recora_private.p4_contract_state not null,plan_policy_version_id uuid references recora_private.plan_policy_versions(id) on delete restrict,entitlement_snapshot_id uuid,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,occurred_at timestamptz not null default now(),foreign key(entitlement_snapshot_id,organization_id) references recora_private.entitlement_snapshots(id,organization_id) on delete restrict,unique(contract_id,event_sequence),unique(contract_id,source_sequence),unique(organization_id,source_namespace,source_reference,payload_fingerprint),check((event_sequence=1 and previous_state is null and next_state='draft')or(event_sequence>1 and previous_state is not null)),check((plan_policy_version_id is null)=(entitlement_snapshot_id is null)));

create table recora_private.p4_billing_receipts (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete restrict,project_id uuid,contract_id uuid,source_kind recora_private.p4_source_kind not null,source_namespace text not null check(recora_private.p4_opaque(source_namespace)),source_reference text not null check(recora_private.p4_opaque(source_reference)),source_sequence bigint not null check(source_sequence>0),payload_fingerprint text not null check(payload_fingerprint~'^[0-9a-f]{64}$'),processing_state recora_private.p4_receipt_state not null default 'received',last_command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(project_id,organization_id) references public.projects(id,organization_id) on delete restrict,foreign key(contract_id,organization_id) references recora_private.p4_contract_projections(id,organization_id) on delete restrict,unique(organization_id,source_namespace,source_reference),unique(organization_id,source_namespace,source_sequence));
create table recora_private.p4_billing_receipt_events (
 id uuid primary key default gen_random_uuid(),receipt_id uuid not null references recora_private.p4_billing_receipts(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,event_sequence bigint not null check(event_sequence>0),previous_state recora_private.p4_receipt_state,next_state recora_private.p4_receipt_state not null,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,occurred_at timestamptz not null default now(),unique(receipt_id,event_sequence),check((event_sequence=1 and previous_state is null and next_state='received')or(event_sequence>1 and previous_state is not null)));
create table recora_private.p4_normalized_payment_facts (
 id uuid primary key default gen_random_uuid(),receipt_id uuid not null references recora_private.p4_billing_receipts(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,project_id uuid,contract_id uuid,source_namespace text not null check(recora_private.p4_opaque(source_namespace)),source_reference text not null check(recora_private.p4_opaque(source_reference)),source_sequence bigint not null check(source_sequence>0),fact_kind recora_private.p4_payment_fact_kind not null,corrects_fact_id uuid references recora_private.p4_normalized_payment_facts(id) on delete restrict,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,occurred_at timestamptz not null default now(),foreign key(project_id,organization_id) references public.projects(id,organization_id) on delete restrict,foreign key(contract_id,organization_id) references recora_private.p4_contract_projections(id,organization_id) on delete restrict,unique(organization_id,source_namespace,source_reference,fact_kind));

create table recora_private.p4_downstream_checkpoints (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete restrict,project_id uuid,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,required_effect text not null check(recora_private.p4_opaque(required_effect)),phase3_lifecycle_id uuid references recora_private.data_lifecycle_current(id) on delete restrict,expected_lifecycle_version bigint,state recora_private.p4_checkpoint_state not null default 'pending',stable_reason recora_private.p4_reason not null default 'checkpoint_pending',retry_after timestamptz,version bigint not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(project_id,organization_id) references public.projects(id,organization_id) on delete restrict,unique(command_receipt_id,required_effect),check((phase3_lifecycle_id is null and expected_lifecycle_version is null)or(phase3_lifecycle_id is not null and expected_lifecycle_version>0)),check((state in('pending','applying')and stable_reason='checkpoint_pending')or(state='completed'and stable_reason='ok')or(state='failed'and stable_reason='checkpoint_failed')or(state='reconciliation_required'and stable_reason='reconciliation_required')));
create table recora_private.p4_durable_outbox (
 id uuid primary key default gen_random_uuid(),checkpoint_id uuid not null references recora_private.p4_downstream_checkpoints(id) on delete restrict,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,project_id uuid,effect_kind text not null check(recora_private.p4_opaque(effect_kind)),ordering_key bigint not null check(ordering_key>0),idempotency_key text not null check(recora_private.p4_opaque(idempotency_key)),state recora_private.p4_outbox_state not null default 'pending',stable_reason recora_private.p4_reason not null default 'checkpoint_pending',attempt_count integer not null default 0 check(attempt_count>=0),next_attempt_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(project_id,organization_id) references public.projects(id,organization_id) on delete restrict,unique(command_receipt_id,effect_kind),unique(checkpoint_id,ordering_key),check((state='pending'and stable_reason='checkpoint_pending')or(state='delivered'and stable_reason='ok')or(state='failed'and stable_reason='checkpoint_failed')or(state='reconciliation_required'and stable_reason='reconciliation_required')));

create or replace function recora_private.p4_validate_current()
returns trigger language plpgsql set search_path='' as $$ declare o text:=coalesce(to_jsonb(old)->>'state',to_jsonb(old)->>'processing_state');n text:=coalesce(to_jsonb(new)->>'state',to_jsonb(new)->>'processing_state'); begin
 if tg_op='UPDATE' then
  if (tg_table_name='p4_business_lifecycle_current' and o in('closed','rejected')and n<>o)or(tg_table_name='p4_invitations'and o<>'pending'and n<>o)or(tg_table_name='p4_contract_projections'and o in('canceled','ended')and n<>o)or(tg_table_name='p4_billing_receipts'and o in('applied','ignored_duplicate','rejected','reconciliation_required')and n<>o)or(tg_table_name='p4_downstream_checkpoints'and o in('completed','reconciliation_required')and n<>o)or(tg_table_name='p4_durable_outbox'and o in('delivered','reconciliation_required')and n<>o) then raise exception 'P4 terminal state cannot be revived'; end if;
  new.updated_at=now();
 end if; return new; end; $$;
create trigger p4_business_current_validate before insert or update on recora_private.p4_business_lifecycle_current for each row execute function recora_private.p4_validate_current();
create trigger p4_invitation_current_validate before insert or update on recora_private.p4_invitations for each row execute function recora_private.p4_validate_current();
create trigger p4_contract_current_validate before insert or update on recora_private.p4_contract_projections for each row execute function recora_private.p4_validate_current();
create trigger p4_receipt_current_validate before insert or update on recora_private.p4_billing_receipts for each row execute function recora_private.p4_validate_current();
create trigger p4_checkpoint_current_validate before insert or update on recora_private.p4_downstream_checkpoints for each row execute function recora_private.p4_validate_current();
create trigger p4_outbox_current_validate before insert or update on recora_private.p4_durable_outbox for each row execute function recora_private.p4_validate_current();
create trigger p4_business_events_append_only before update or delete on recora_private.p4_business_lifecycle_events for each row execute function recora_private.p4_reject_history_mutation();
create trigger p4_invitation_events_append_only before update or delete on recora_private.p4_invitation_events for each row execute function recora_private.p4_reject_history_mutation();
create trigger p4_contract_events_append_only before update or delete on recora_private.p4_contract_events for each row execute function recora_private.p4_reject_history_mutation();
create trigger p4_receipt_events_append_only before update or delete on recora_private.p4_billing_receipt_events for each row execute function recora_private.p4_reject_history_mutation();
create trigger p4_facts_append_only before update or delete on recora_private.p4_normalized_payment_facts for each row execute function recora_private.p4_reject_history_mutation();

create or replace function public.recora_p4_resolve_checkpoint_gate(p_organization_id uuid,p_project_id uuid default null)
returns table(customer_access_allowed boolean,reason_code text) language plpgsql stable security definer set search_path='' as $$ begin
 if p_organization_id is null or not exists(select 1 from public.organizations where id=p_organization_id)or(p_project_id is not null and not exists(select 1 from public.projects where id=p_project_id and organization_id=p_organization_id))then return query select false,'invalid_scope'::text;return;end if;
 if exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and(project_id is null or project_id=p_project_id)and state='reconciliation_required')then return query select false,'reconciliation_required'::text;return;end if;
 if exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and(project_id is null or project_id=p_project_id)and state='failed')then return query select false,'checkpoint_failed'::text;return;end if;
 if exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and(project_id is null or project_id=p_project_id)and state in('pending','applying'))then return query select false,'checkpoint_pending'::text;return;end if;
 return query select true,'ok'::text;end;$$;
create or replace function public.recora_p4_record_command_receipt(p_organization_id uuid,p_project_id uuid,p_command_type text,p_source_kind recora_private.p4_source_kind,p_source_namespace text,p_source_reference text,p_source_sequence bigint,p_payload_fingerprint text,p_request_id uuid,p_correlation_id uuid,p_idempotency_key text,p_operator_audit_event_id uuid default null,p_operator_command_receipt_id uuid default null)
returns table(command_receipt_id uuid,outcome recora_private.p4_command_outcome,stable_reason recora_private.p4_reason) language plpgsql security definer set search_path='' as $$ declare prior recora_private.p4_command_receipts%rowtype;scope text;created_id uuid;begin
 if p_organization_id is null or not exists(select 1 from public.organizations where id=p_organization_id)or(p_project_id is not null and not exists(select 1 from public.projects where id=p_project_id and organization_id=p_organization_id))then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_scope'::recora_private.p4_reason;return;end if;
 scope:='organization:'||p_organization_id::text||coalesce(':project:'||p_project_id::text,'');select * into prior from recora_private.p4_command_receipts where scope_key=scope and command_type=p_command_type and idempotency_key=p_idempotency_key;
 if found then if prior.source_kind=p_source_kind and prior.source_namespace=p_source_namespace and prior.source_reference=p_source_reference and prior.source_sequence=p_source_sequence and prior.payload_fingerprint=p_payload_fingerprint and prior.request_id=p_request_id and prior.correlation_id=p_correlation_id then return query select prior.id,'replayed'::recora_private.p4_command_outcome,'duplicate_command'::recora_private.p4_reason;else return query select prior.id,'rejected'::recora_private.p4_command_outcome,'idempotency_conflict'::recora_private.p4_reason;end if;return;end if;
 insert into recora_private.p4_command_receipts(organization_id,project_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key,operator_audit_event_id,operator_command_receipt_id)values(p_organization_id,p_project_id,p_command_type,p_source_kind,p_source_namespace,p_source_reference,p_source_sequence,p_payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key,p_operator_audit_event_id,p_operator_command_receipt_id)returning id into created_id;return query select created_id,'accepted'::recora_private.p4_command_outcome,'ok'::recora_private.p4_reason;
 exception when check_violation or foreign_key_violation or raise_exception then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_reference'::recora_private.p4_reason;end;$$;

create index p4_command_scope_order_idx on recora_private.p4_command_receipts(organization_id,project_id,source_namespace,source_sequence);
create index p4_business_events_scope_idx on recora_private.p4_business_lifecycle_events(organization_id,occurred_at desc);
create index p4_invitation_binding_idx on recora_private.p4_invitations(organization_id,recipient_binding_hash,expires_at);
create index p4_contract_scope_idx on recora_private.p4_contract_projections(organization_id,project_id,state);
create index p4_contract_events_scope_idx on recora_private.p4_contract_events(organization_id,occurred_at desc);
create index p4_billing_scope_idx on recora_private.p4_billing_receipts(organization_id,project_id,processing_state);
create index p4_facts_scope_idx on recora_private.p4_normalized_payment_facts(organization_id,occurred_at desc);
create index p4_checkpoint_scope_idx on recora_private.p4_downstream_checkpoints(organization_id,project_id,state);
create index p4_outbox_pending_idx on recora_private.p4_durable_outbox(state,next_attempt_at,created_at)where state='pending';
alter table recora_private.p4_command_receipts enable row level security;alter table recora_private.p4_business_lifecycle_episodes enable row level security;alter table recora_private.p4_business_lifecycle_current enable row level security;alter table recora_private.p4_business_lifecycle_events enable row level security;alter table recora_private.p4_invitations enable row level security;alter table recora_private.p4_invitation_events enable row level security;alter table recora_private.p4_contract_projections enable row level security;alter table recora_private.p4_contract_events enable row level security;alter table recora_private.p4_billing_receipts enable row level security;alter table recora_private.p4_billing_receipt_events enable row level security;alter table recora_private.p4_normalized_payment_facts enable row level security;alter table recora_private.p4_downstream_checkpoints enable row level security;alter table recora_private.p4_durable_outbox enable row level security;
revoke all on all tables in schema recora_private from public,anon,authenticated;revoke all on all sequences in schema recora_private from public,anon,authenticated;revoke all on all functions in schema recora_private from public,anon,authenticated;revoke all on function public.recora_p4_resolve_checkpoint_gate(uuid,uuid)from public,anon,authenticated;revoke all on function public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)from public,anon,authenticated;grant execute on function public.recora_p4_resolve_checkpoint_gate(uuid,uuid)to service_role;grant execute on function public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)to service_role;

-- Scope, transition, ordering, and Phase 3 causal invariants. These only constrain P4-A rows.
create or replace function recora_private.p4_validate_current()
returns trigger language plpgsql set search_path='' as $$
declare o jsonb; n jsonb; old_state text; new_state text; receipt_org uuid; receipt_project uuid; receipt_id uuid; snapshot_policy uuid; snapshot_org uuid; snapshot_project uuid;
begin
  if tg_op='UPDATE' then
    o:=to_jsonb(old); n:=to_jsonb(new); old_state:=coalesce(o->>'state',o->>'processing_state'); new_state:=coalesce(n->>'state',n->>'processing_state');
    if o->>'organization_id' is distinct from n->>'organization_id' or o->>'project_id' is distinct from n->>'project_id' then raise exception 'P4 current scope is immutable'; end if;
    if (n->>'version')::bigint=(o->>'version')::bigint then new.version:=(o->>'version')::bigint+1; elsif (n->>'version')::bigint<>(o->>'version')::bigint+1 then raise exception 'P4 current version must advance by one'; end if;
    if old_state is distinct from new_state then
      if (tg_table_name='p4_business_lifecycle_current' and not ((old_state='lead' and new_state in('onboarding','rejected'))or(old_state='onboarding' and new_state in('serving','paused','closed','rejected'))or(old_state='serving' and new_state in('paused','closed'))or(old_state='paused' and new_state in('serving','closed'))))
        or(tg_table_name='p4_invitations' and not(old_state='pending' and new_state in('accepted','expired','revoked','superseded')))
        or(tg_table_name='p4_contract_projections' and not((old_state='draft' and new_state in('pending_activation','canceled'))or(old_state='pending_activation' and new_state in('active','paused','canceled','ended'))or(old_state='active' and new_state in('paused','canceled','ended'))or(old_state='paused' and new_state in('active','canceled','ended'))))
        or(tg_table_name='p4_billing_receipts' and not((old_state='received' and new_state in('validated','rejected','reconciliation_required'))or(old_state='validated' and new_state in('applying','rejected','reconciliation_required'))or(old_state='applying' and new_state in('applied','ignored_duplicate','rejected','reconciliation_required'))))
        or(tg_table_name='p4_downstream_checkpoints' and not((old_state='pending' and new_state in('applying','failed','reconciliation_required'))or(old_state='applying' and new_state in('completed','failed','reconciliation_required'))or(old_state='failed' and new_state='reconciliation_required')))
        or(tg_table_name='p4_durable_outbox' and not(old_state='pending' and new_state in('delivered','failed','reconciliation_required'))) then raise exception 'P4 current transition is not allowed'; end if;
    end if;
    new.updated_at=now();
  end if;
  receipt_id:=coalesce(nullif(to_jsonb(new)->>'last_command_receipt_id','')::uuid,nullif(to_jsonb(new)->>'command_receipt_id','')::uuid);
  if receipt_id is not null then
    select organization_id,project_id into receipt_org,receipt_project from recora_private.p4_command_receipts where id=receipt_id;
    if not found or receipt_org is distinct from new.organization_id or receipt_project is distinct from nullif(to_jsonb(new)->>'project_id','')::uuid then raise exception 'P4 current command receipt scope mismatch'; end if;
  end if;
  if tg_table_name='p4_invitations' then
    select organization_id,project_id into receipt_org,receipt_project from recora_private.p4_command_receipts where id=(to_jsonb(new)->>'issuer_command_receipt_id')::uuid;
    if not found or receipt_org is distinct from new.organization_id or receipt_project is not null then raise exception 'P4 invitation issuer scope mismatch'; end if;
  elsif tg_table_name='p4_contract_projections' and (to_jsonb(new)->>'entitlement_snapshot_id') is not null then
    select plan_policy_version_id,organization_id,project_id into snapshot_policy,snapshot_org,snapshot_project from recora_private.entitlement_snapshots where id=(to_jsonb(new)->>'entitlement_snapshot_id')::uuid;
    if not found or snapshot_policy is distinct from new.plan_policy_version_id or snapshot_org is distinct from new.organization_id or snapshot_project is distinct from new.project_id then raise exception 'P4 immutable entitlement snapshot mismatch'; end if;
  end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_lifecycle_event()
returns trigger language plpgsql set search_path='' as $$
declare parent_org uuid; receipt_org uuid; receipt_request uuid; receipt_correlation uuid; predecessor text; state_before text:=new.previous_state::text; state_after text:=new.next_state::text;
begin
  select organization_id,request_id,correlation_id into receipt_org,receipt_request,receipt_correlation from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or receipt_org is distinct from new.organization_id or receipt_request is distinct from new.request_id or receipt_correlation is distinct from new.correlation_id then raise exception 'P4 event command receipt causal mismatch'; end if;
  if tg_table_name='p4_business_lifecycle_events' then
    select organization_id into parent_org from recora_private.p4_business_lifecycle_episodes where id=new.episode_id;
    select next_state::text into predecessor from recora_private.p4_business_lifecycle_events where episode_id=new.episode_id and event_sequence=new.event_sequence-1;
  elsif tg_table_name='p4_invitation_events' then
    select organization_id into parent_org from recora_private.p4_invitations where id=new.invitation_id;
    select next_state::text into predecessor from recora_private.p4_invitation_events where invitation_id=new.invitation_id and event_sequence=new.event_sequence-1;
  elsif tg_table_name='p4_contract_events' then
    select organization_id into parent_org from recora_private.p4_contract_projections where id=new.contract_id;
    select next_state::text into predecessor from recora_private.p4_contract_events where contract_id=new.contract_id and event_sequence=new.event_sequence-1;
    if exists(select 1 from recora_private.p4_contract_events where contract_id=new.contract_id and source_sequence>=new.source_sequence) then raise exception 'P4 contract source ordering conflict'; end if;
  else
    select organization_id into parent_org from recora_private.p4_billing_receipts where id=new.receipt_id;
    select next_state::text into predecessor from recora_private.p4_billing_receipt_events where receipt_id=new.receipt_id and event_sequence=new.event_sequence-1;
  end if;
  if parent_org is null or parent_org is distinct from new.organization_id then raise exception 'P4 event parent scope mismatch'; end if;
  if new.event_sequence>1 and (predecessor is null or predecessor is distinct from state_before) then raise exception 'P4 event predecessor mismatch'; end if;
  if (tg_table_name='p4_business_lifecycle_events' and new.event_sequence>1 and not((state_before='lead' and state_after in('onboarding','rejected'))or(state_before='onboarding' and state_after in('serving','paused','closed','rejected'))or(state_before='serving' and state_after in('paused','closed'))or(state_before='paused' and state_after in('serving','closed'))))
    or(tg_table_name='p4_contract_events' and new.event_sequence>1 and not((state_before='draft' and state_after in('pending_activation','canceled'))or(state_before='pending_activation' and state_after in('active','paused','canceled','ended'))or(state_before='active' and state_after in('paused','canceled','ended'))or(state_before='paused' and state_after in('active','canceled','ended'))))
    or(tg_table_name='p4_billing_receipt_events' and new.event_sequence>1 and not((state_before='received' and state_after in('validated','rejected','reconciliation_required'))or(state_before='validated' and state_after in('applying','rejected','reconciliation_required'))or(state_before='applying' and state_after in('applied','ignored_duplicate','rejected','reconciliation_required')))) then raise exception 'P4 event transition is not allowed'; end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_payment_fact()
returns trigger language plpgsql set search_path='' as $$
declare receipt_row recora_private.p4_billing_receipts%rowtype; command_row recora_private.p4_command_receipts%rowtype; corrected_org uuid;
begin
  select * into receipt_row from recora_private.p4_billing_receipts where id=new.receipt_id;
  select * into command_row from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or receipt_row.organization_id is distinct from new.organization_id or receipt_row.project_id is distinct from new.project_id or receipt_row.contract_id is distinct from new.contract_id or receipt_row.source_namespace is distinct from new.source_namespace or receipt_row.source_reference is distinct from new.source_reference or receipt_row.source_sequence is distinct from new.source_sequence or command_row.organization_id is distinct from new.organization_id or command_row.project_id is distinct from new.project_id or command_row.request_id is distinct from new.request_id or command_row.correlation_id is distinct from new.correlation_id then raise exception 'P4 payment fact causal scope mismatch'; end if;
  if new.corrects_fact_id is not null then select organization_id into corrected_org from recora_private.p4_normalized_payment_facts where id=new.corrects_fact_id; if not found or corrected_org is distinct from new.organization_id then raise exception 'P4 payment fact correction scope mismatch'; end if; end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_checkpoint()
returns trigger language plpgsql set search_path='' as $$
declare receipt_org uuid; receipt_project uuid; lifecycle_org uuid; lifecycle_project uuid; lifecycle_version bigint;
begin
  select organization_id,project_id into receipt_org,receipt_project from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or receipt_org is distinct from new.organization_id or receipt_project is distinct from nullif(to_jsonb(new)->>'project_id','')::uuid then raise exception 'P4 checkpoint command receipt scope mismatch'; end if;
  if new.phase3_lifecycle_id is not null then
    select organization_id,project_id,version into lifecycle_org,lifecycle_project,lifecycle_version from recora_private.data_lifecycle_current where id=new.phase3_lifecycle_id;
    if not found or lifecycle_org is distinct from new.organization_id or lifecycle_project is distinct from new.project_id or lifecycle_version is distinct from new.expected_lifecycle_version then raise exception 'P4 checkpoint Phase 3 lifecycle mismatch'; end if;
  end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_outbox()
returns trigger language plpgsql set search_path='' as $$
declare checkpoint_org uuid; checkpoint_project uuid; checkpoint_command uuid; receipt_org uuid; receipt_project uuid;
begin
  select organization_id,project_id,command_receipt_id into checkpoint_org,checkpoint_project,checkpoint_command from recora_private.p4_downstream_checkpoints where id=new.checkpoint_id;
  select organization_id,project_id into receipt_org,receipt_project from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or checkpoint_org is distinct from new.organization_id or checkpoint_project is distinct from new.project_id or checkpoint_command is distinct from new.command_receipt_id or receipt_org is distinct from new.organization_id or receipt_project is distinct from nullif(to_jsonb(new)->>'project_id','')::uuid then raise exception 'P4 outbox checkpoint scope mismatch'; end if;
  return new;
end; $$;

create trigger p4_business_events_integrity before insert on recora_private.p4_business_lifecycle_events for each row execute function recora_private.p4_validate_lifecycle_event();
create trigger p4_invitation_events_integrity before insert on recora_private.p4_invitation_events for each row execute function recora_private.p4_validate_lifecycle_event();
create trigger p4_contract_events_integrity before insert on recora_private.p4_contract_events for each row execute function recora_private.p4_validate_lifecycle_event();
create trigger p4_receipt_events_integrity before insert on recora_private.p4_billing_receipt_events for each row execute function recora_private.p4_validate_lifecycle_event();
create trigger p4_fact_integrity before insert on recora_private.p4_normalized_payment_facts for each row execute function recora_private.p4_validate_payment_fact();
create trigger p4_checkpoint_integrity before insert or update on recora_private.p4_downstream_checkpoints for each row execute function recora_private.p4_validate_checkpoint();
create trigger p4_outbox_integrity before insert on recora_private.p4_durable_outbox for each row execute function recora_private.p4_validate_outbox();
revoke all on function recora_private.p4_validate_lifecycle_event() from public,anon,authenticated;
revoke all on function recora_private.p4_validate_payment_fact() from public,anon,authenticated;
revoke all on function recora_private.p4_validate_checkpoint() from public,anon,authenticated;
revoke all on function recora_private.p4_validate_outbox() from public,anon,authenticated;
alter table recora_private.p4_durable_outbox add column version bigint not null default 1 check(version>0);
