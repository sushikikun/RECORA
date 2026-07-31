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

-- P4-A intentionally preserves existing Phase 3 schema grants.

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
revoke all on recora_private.p4_command_receipts,recora_private.p4_business_lifecycle_episodes,recora_private.p4_business_lifecycle_current,recora_private.p4_business_lifecycle_events,recora_private.p4_invitations,recora_private.p4_invitation_events,recora_private.p4_contract_projections,recora_private.p4_contract_events,recora_private.p4_billing_receipts,recora_private.p4_billing_receipt_events,recora_private.p4_normalized_payment_facts,recora_private.p4_downstream_checkpoints,recora_private.p4_durable_outbox from public,anon,authenticated;revoke all on function public.recora_p4_resolve_checkpoint_gate(uuid,uuid)from public,anon,authenticated;revoke all on function public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)from public,anon,authenticated;grant execute on function public.recora_p4_resolve_checkpoint_gate(uuid,uuid)to service_role;grant execute on function public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)to service_role;

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

-- OWNER remediation: invitation/membership foundation, recovery, and object-local privileges.
create type recora_private.p4_membership_episode_state as enum ('invited','active','revoked');
create table recora_private.p4_membership_episodes (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 invitation_id uuid not null references recora_private.p4_invitations(id) on delete restrict, membership_id uuid references public.organization_members(id) on delete restrict,
 accepted_user_id uuid references auth.users(id) on delete restrict, intended_role public.recora_organization_member_role not null,
 episode_number bigint not null check(episode_number>0), state recora_private.p4_membership_episode_state not null default 'invited',
 command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict, request_id uuid not null, correlation_id uuid not null, created_at timestamptz not null default now(),
 unique(organization_id,episode_number), unique(invitation_id), unique(id,organization_id),
 check((state='invited' and membership_id is null and accepted_user_id is null)or(state='active' and membership_id is not null and accepted_user_id is not null)or(state='revoked' and membership_id is not null and accepted_user_id is not null))
);
create table recora_private.p4_membership_episode_events (
 id uuid primary key default gen_random_uuid(), episode_id uuid not null references recora_private.p4_membership_episodes(id) on delete restrict, organization_id uuid not null references public.organizations(id) on delete restrict,
 event_sequence bigint not null check(event_sequence>0), previous_state recora_private.p4_membership_episode_state,next_state recora_private.p4_membership_episode_state not null,
 command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,created_at timestamptz not null default now(),
 unique(episode_id,event_sequence),check((event_sequence=1 and previous_state is null and next_state='invited')or(event_sequence>1 and previous_state is not null))
);
alter table recora_private.p4_invitations add column intended_role public.recora_organization_member_role not null default 'member', add column accepted_user_id uuid references auth.users(id) on delete restrict, add column accepted_membership_id uuid references public.organization_members(id) on delete restrict;
create unique index p4_single_pending_invitation_per_recipient on recora_private.p4_invitations(organization_id,recipient_binding_hash) where state='pending';
create or replace function recora_private.p4_validate_invitation_supersession() returns trigger language plpgsql set search_path='' as $$
declare target recora_private.p4_invitations%rowtype; receipt recora_private.p4_command_receipts%rowtype;
begin
 select * into receipt from recora_private.p4_command_receipts where id=new.last_command_receipt_id;
 if not found or receipt.organization_id is distinct from new.organization_id or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 invitation causal pair mismatch'; end if;
 if new.state='accepted' and (new.accepted_user_id is null or new.accepted_membership_id is null) then raise exception 'P4 invitation acceptance requires verified user and membership'; end if;
 if new.state='superseded' then select * into target from recora_private.p4_invitations where id=new.superseded_by_invitation_id; if not found or target.id=new.id or target.organization_id is distinct from new.organization_id or target.recipient_binding_hash is distinct from new.recipient_binding_hash or target.state<>'pending' or target.created_at<=new.created_at then raise exception 'P4 invitation supersession target invalid'; end if; end if;
 return new; end; $$;
create trigger p4_invitation_supersession_integrity before insert or update on recora_private.p4_invitations for each row execute function recora_private.p4_validate_invitation_supersession();
create trigger p4_membership_episode_append_only before update or delete on recora_private.p4_membership_episodes for each row execute function recora_private.p4_reject_history_mutation();
create trigger p4_membership_episode_event_append_only before update or delete on recora_private.p4_membership_episode_events for each row execute function recora_private.p4_reject_history_mutation();

alter table recora_private.p4_downstream_checkpoints add column blocks_customer_access boolean not null default false, add column superseded_by_checkpoint_id uuid references recora_private.p4_downstream_checkpoints(id) on delete restrict;
alter table recora_private.p4_durable_outbox add column exhausted_at timestamptz, add column resolved_at timestamptz;
create table recora_private.p4_checkpoint_events (id uuid primary key default gen_random_uuid(),checkpoint_id uuid not null references recora_private.p4_downstream_checkpoints(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,previous_state recora_private.p4_checkpoint_state,next_state recora_private.p4_checkpoint_state not null,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,created_at timestamptz not null default now());
create table recora_private.p4_outbox_events (id uuid primary key default gen_random_uuid(),outbox_id uuid not null references recora_private.p4_durable_outbox(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,previous_state recora_private.p4_outbox_state,next_state recora_private.p4_outbox_state not null,command_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,request_id uuid not null,correlation_id uuid not null,created_at timestamptz not null default now());
create trigger p4_checkpoint_event_append_only before update or delete on recora_private.p4_checkpoint_events for each row execute function recora_private.p4_reject_history_mutation();
create trigger p4_outbox_event_append_only before update or delete on recora_private.p4_outbox_events for each row execute function recora_private.p4_reject_history_mutation();
create or replace function public.recora_p4_resolve_checkpoint_gate(p_organization_id uuid,p_project_id uuid default null) returns table(customer_access_allowed boolean,reason_code text) language plpgsql stable security definer set search_path='' as $$ begin
 if p_organization_id is null or not exists(select 1 from public.organizations where id=p_organization_id)or(p_project_id is not null and not exists(select 1 from public.projects where id=p_project_id and organization_id=p_organization_id))then return query select false,'invalid_scope'::text;return;end if;
 if exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and(project_id is not distinct from p_project_id)and blocks_customer_access and superseded_by_checkpoint_id is null and state='reconciliation_required')then return query select false,'reconciliation_required'::text;return;end if;
 if exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and(project_id is not distinct from p_project_id)and blocks_customer_access and superseded_by_checkpoint_id is null and state in('pending','applying','failed'))then return query select false,case when exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and(project_id is not distinct from p_project_id)and blocks_customer_access and superseded_by_checkpoint_id is null and state='failed') then 'checkpoint_failed' else 'checkpoint_pending' end;return;end if;
 return query select true,'ok'::text;end;$$;

create or replace function recora_private.p4_assert_current_immutable() returns trigger language plpgsql set search_path='' as $$
declare protected text[]; key text; begin
 protected:=case tg_table_name when 'p4_invitations' then array['organization_id','recipient_binding_hash','issuer_command_receipt_id','expires_at','accepted_user_id','accepted_membership_id','superseded_by_invitation_id','intended_role'] when 'p4_contract_projections' then array['organization_id','project_id','contract_reference','source_namespace','plan_policy_version_id','entitlement_snapshot_id'] when 'p4_billing_receipts' then array['organization_id','project_id','contract_id','source_kind','source_namespace','source_reference','source_sequence','payload_fingerprint'] when 'p4_downstream_checkpoints' then array['organization_id','project_id','command_receipt_id','required_effect','phase3_lifecycle_id','expected_lifecycle_version','blocks_customer_access'] else array['checkpoint_id','command_receipt_id','organization_id','project_id','effect_kind','ordering_key','idempotency_key'] end;
 if tg_op='UPDATE' then foreach key in array protected loop if to_jsonb(old)->key is distinct from to_jsonb(new)->key then raise exception 'P4 immutable identity field changed: %',key; end if; end loop; end if; return new; end; $$;
create trigger p4_invitation_immutable before update on recora_private.p4_invitations for each row execute function recora_private.p4_assert_current_immutable();
create trigger p4_contract_immutable before update on recora_private.p4_contract_projections for each row execute function recora_private.p4_assert_current_immutable();
create trigger p4_receipt_immutable before update on recora_private.p4_billing_receipts for each row execute function recora_private.p4_assert_current_immutable();
create trigger p4_checkpoint_immutable before update on recora_private.p4_downstream_checkpoints for each row execute function recora_private.p4_assert_current_immutable();
create trigger p4_outbox_immutable before update on recora_private.p4_durable_outbox for each row execute function recora_private.p4_assert_current_immutable();
drop trigger if exists p4_outbox_integrity on recora_private.p4_durable_outbox;create trigger p4_outbox_integrity before insert or update on recora_private.p4_durable_outbox for each row execute function recora_private.p4_validate_outbox();
alter table recora_private.p4_membership_episodes enable row level security;alter table recora_private.p4_membership_episode_events enable row level security;alter table recora_private.p4_checkpoint_events enable row level security;alter table recora_private.p4_outbox_events enable row level security;
revoke all on recora_private.p4_membership_episodes,recora_private.p4_membership_episode_events,recora_private.p4_checkpoint_events,recora_private.p4_outbox_events from public,anon,authenticated;
revoke all on function recora_private.p4_validate_invitation_supersession(),recora_private.p4_assert_current_immutable() from public,anon,authenticated;create table recora_private.p4_command_conflicts (id uuid primary key default gen_random_uuid(),prior_receipt_id uuid not null references recora_private.p4_command_receipts(id) on delete restrict,organization_id uuid not null references public.organizations(id) on delete restrict,command_type text not null,source_namespace text not null,source_reference text not null,source_sequence bigint not null,payload_fingerprint text not null,request_id uuid not null,correlation_id uuid not null,created_at timestamptz not null default now());
create trigger p4_command_conflicts_append_only before update or delete on recora_private.p4_command_conflicts for each row execute function recora_private.p4_reject_history_mutation();alter table recora_private.p4_command_conflicts enable row level security;revoke all on recora_private.p4_command_conflicts from public,anon,authenticated;
create or replace function public.recora_p4_record_command_receipt(p_organization_id uuid,p_project_id uuid,p_command_type text,p_source_kind recora_private.p4_source_kind,p_source_namespace text,p_source_reference text,p_source_sequence bigint,p_payload_fingerprint text,p_request_id uuid,p_correlation_id uuid,p_idempotency_key text,p_operator_audit_event_id uuid default null,p_operator_command_receipt_id uuid default null) returns table(command_receipt_id uuid,outcome recora_private.p4_command_outcome,stable_reason recora_private.p4_reason) language plpgsql security definer set search_path='' as $$ declare prior recora_private.p4_command_receipts%rowtype; scope text; created_id uuid; begin
 if p_organization_id is null or not exists(select 1 from public.organizations where id=p_organization_id)or(p_project_id is not null and not exists(select 1 from public.projects where id=p_project_id and organization_id=p_organization_id))then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_scope'::recora_private.p4_reason;return;end if;
 begin perform recora_private.p4_assert_legacy_inventory(); exception when raise_exception then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_legacy_inventory'::recora_private.p4_reason;return; end;
 scope:='organization:'||p_organization_id::text||coalesce(':project:'||p_project_id::text,'');perform pg_advisory_xact_lock(hashtextextended(scope||':'||p_command_type||':'||p_idempotency_key,0));select * into prior from recora_private.p4_command_receipts where scope_key=scope and command_type=p_command_type and idempotency_key=p_idempotency_key;
 if found then if prior.source_kind=p_source_kind and prior.source_namespace=p_source_namespace and prior.source_reference=p_source_reference and prior.source_sequence=p_source_sequence and prior.payload_fingerprint=p_payload_fingerprint then return query select prior.id,'replayed'::recora_private.p4_command_outcome,'duplicate_command'::recora_private.p4_reason;else insert into recora_private.p4_command_conflicts(prior_receipt_id,organization_id,project_id,command_type,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id)values(prior.id,p_organization_id,p_project_id,p_command_type,p_source_namespace,p_source_reference,p_source_sequence,p_payload_fingerprint,p_request_id,p_correlation_id);return query select prior.id,'rejected'::recora_private.p4_command_outcome,'idempotency_conflict'::recora_private.p4_reason;end if;return;end if;
 begin insert into recora_private.p4_command_receipts(organization_id,project_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key,operator_audit_event_id,operator_command_receipt_id)values(p_organization_id,p_project_id,p_command_type,p_source_kind,p_source_namespace,p_source_reference,p_source_sequence,p_payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key,p_operator_audit_event_id,p_operator_command_receipt_id)returning id into created_id; exception when unique_violation then select * into prior from recora_private.p4_command_receipts where scope_key=scope and command_type=p_command_type and idempotency_key=p_idempotency_key;if found and prior.source_kind=p_source_kind and prior.source_namespace=p_source_namespace and prior.source_reference=p_source_reference and prior.source_sequence=p_source_sequence and prior.payload_fingerprint=p_payload_fingerprint then return query select prior.id,'replayed'::recora_private.p4_command_outcome,'duplicate_command'::recora_private.p4_reason;else return query select coalesce(prior.id,null::uuid),'rejected'::recora_private.p4_command_outcome,'idempotency_conflict'::recora_private.p4_reason;end if;return;when foreign_key_violation or check_violation then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_reference'::recora_private.p4_reason;return;when raise_exception then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_reference'::recora_private.p4_reason;return;end;return query select created_id,'accepted'::recora_private.p4_command_outcome,'ok'::recora_private.p4_reason;end;$$;
revoke all on function public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)from public,anon,authenticated;grant execute on function public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid)to service_role;
-- OWNER 5145117131: defer only resend linkage; all final states remain fail-closed.
do $drop_invitation_check$ declare constraint_name text; begin
 for constraint_name in select conname from pg_constraint where conrelid='recora_private.p4_invitations'::regclass and contype='c' and pg_get_constraintdef(oid) like '%superseded_by_invitation_id%' loop execute format('alter table recora_private.p4_invitations drop constraint %I',constraint_name); end loop;
end $drop_invitation_check$;
alter table recora_private.p4_invitations add constraint p4_invitation_state_shape check ((state='pending' and accepted_at is null and terminal_at is null and superseded_by_invitation_id is null and accepted_user_id is null and accepted_membership_id is null)or(state='accepted' and accepted_at is not null and terminal_at is null and superseded_by_invitation_id is null and accepted_user_id is not null and accepted_membership_id is not null)or(state in('expired','revoked')and accepted_at is null and terminal_at is not null and superseded_by_invitation_id is null)or(state='superseded'and accepted_at is null and terminal_at is not null));
create or replace function recora_private.p4_validate_invitation_supersession() returns trigger language plpgsql set search_path='' as $$ declare receipt recora_private.p4_command_receipts%rowtype; begin
 select * into receipt from recora_private.p4_command_receipts where id=new.last_command_receipt_id;
 if not found or receipt.organization_id is distinct from new.organization_id or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 invitation causal pair mismatch'; end if;
 return new; end; $$;
create or replace function recora_private.p4_validate_invitation_final() returns trigger language plpgsql set search_path='' as $$ declare invitation recora_private.p4_invitations%rowtype; member_row public.organization_members%rowtype; begin
 select * into invitation from recora_private.p4_invitations where id=new.id;
 if invitation.state='accepted' then select * into member_row from public.organization_members where id=invitation.accepted_membership_id; if not found or member_row.organization_id is distinct from invitation.organization_id or member_row.user_id is distinct from invitation.accepted_user_id or member_row.role is distinct from invitation.intended_role or member_row.membership_status<>'active' then raise exception 'P4 invitation acceptance membership mismatch'; end if; end if;
 if invitation.state='superseded' then select * into invitation from recora_private.p4_invitations where id=new.superseded_by_invitation_id; if not found or invitation.id=new.id or invitation.organization_id is distinct from new.organization_id or invitation.recipient_binding_hash is distinct from new.recipient_binding_hash or invitation.state<>'pending' or invitation.created_at<=new.created_at then raise exception 'P4 invitation supersession target invalid'; end if; end if;
 return null; end; $$;
drop trigger if exists p4_invitations_final_integrity on recora_private.p4_invitations;create constraint trigger p4_invitations_final_integrity after insert or update on recora_private.p4_invitations deferrable initially deferred for each row execute function recora_private.p4_validate_invitation_final();
create or replace function recora_private.p4_assert_current_immutable() returns trigger language plpgsql set search_path='' as $$ declare o jsonb:=to_jsonb(old);n jsonb:=to_jsonb(new); key text; protected text[]; begin
 if tg_table_name='p4_invitations' then
  foreach key in array array['organization_id','recipient_binding_hash','issuer_command_receipt_id','expires_at','intended_role'] loop if o->key is distinct from n->key then raise exception 'P4 immutable invitation field changed: %',key; end if; end loop;
  if o->>'state'='pending' and n->>'state'='accepted' then if o->>'accepted_user_id' is not null or o->>'accepted_membership_id' is not null then raise exception 'P4 invitation acceptance already bound'; end if; elsif o->>'state'='pending' and n->>'state'='superseded' then if o->>'superseded_by_invitation_id' is not null then raise exception 'P4 invitation supersession already bound'; end if; elsif o->>'state'='superseded' and n->>'state'='superseded' and o->>'superseded_by_invitation_id' is null and n->>'superseded_by_invitation_id' is not null then null; elsif o->'accepted_user_id' is distinct from n->'accepted_user_id' or o->'accepted_membership_id' is distinct from n->'accepted_membership_id' or o->'superseded_by_invitation_id' is distinct from n->'superseded_by_invitation_id' then raise exception 'P4 invitation causal fields are immutable'; end if;
  return new;
 end if;
 protected:=case tg_table_name when 'p4_contract_projections' then array['organization_id','project_id','contract_reference','source_namespace'] when 'p4_billing_receipts' then array['organization_id','project_id','contract_id','source_kind','source_namespace','source_reference','source_sequence','payload_fingerprint'] when 'p4_downstream_checkpoints' then array['organization_id','project_id','command_receipt_id','required_effect','phase3_lifecycle_id','expected_lifecycle_version','blocks_customer_access'] else array['checkpoint_id','command_receipt_id','organization_id','project_id','effect_kind','ordering_key','idempotency_key'] end;
 foreach key in array protected loop if o->key is distinct from n->key then raise exception 'P4 immutable identity field changed: %',key; end if; end loop;return new;end; $$;

drop trigger if exists p4_membership_episode_append_only on recora_private.p4_membership_episodes;
create or replace function recora_private.p4_validate_membership_episode() returns trigger language plpgsql set search_path='' as $$ declare invitation recora_private.p4_invitations%rowtype; member_row public.organization_members%rowtype; receipt recora_private.p4_command_receipts%rowtype; begin
 select * into invitation from recora_private.p4_invitations where id=new.invitation_id;select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
 if not found or invitation.organization_id is distinct from new.organization_id or receipt.organization_id is distinct from new.organization_id or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id or invitation.intended_role is distinct from new.intended_role then raise exception 'P4 membership episode causal mismatch'; end if;
 if new.state in('active','revoked') then select * into member_row from public.organization_members where id=new.membership_id; if not found or member_row.organization_id is distinct from new.organization_id or member_row.user_id is distinct from new.accepted_user_id or member_row.role is distinct from new.intended_role then raise exception 'P4 membership episode membership mismatch'; end if; end if;
 if tg_op='UPDATE' and not((old.state='invited' and new.state='active')or(old.state='active' and new.state='revoked')or(old.state=new.state)) then raise exception 'P4 membership episode transition invalid'; end if;return new;end;$$;
create trigger p4_membership_episode_integrity before insert or update on recora_private.p4_membership_episodes for each row execute function recora_private.p4_validate_membership_episode();

-- Organization checkpoints are a hard ceiling; project checkpoints add a narrower restriction.
create or replace function public.recora_p4_resolve_checkpoint_gate(p_organization_id uuid,p_project_id uuid default null) returns table(customer_access_allowed boolean,reason_code text) language plpgsql stable security definer set search_path='' as $$ begin
 if p_organization_id is null or not exists(select 1 from public.organizations where id=p_organization_id)or(p_project_id is not null and not exists(select 1 from public.projects where id=p_project_id and organization_id=p_organization_id))then return query select false,'invalid_scope'::text;return;end if;
 if exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and (project_id is null or project_id=p_project_id) and blocks_customer_access and superseded_by_checkpoint_id is null and state='reconciliation_required')then return query select false,'reconciliation_required'::text;return;end if;
 if exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and (project_id is null or project_id=p_project_id) and blocks_customer_access and superseded_by_checkpoint_id is null and state in('pending','applying','failed'))then return query select false,case when exists(select 1 from recora_private.p4_downstream_checkpoints where organization_id=p_organization_id and (project_id is null or project_id=p_project_id) and blocks_customer_access and superseded_by_checkpoint_id is null and state='failed')then 'checkpoint_failed' else 'checkpoint_pending'end;return;end if;return query select true,'ok'::text;end;$$;
create or replace function recora_private.p4_validate_checkpoint() returns trigger language plpgsql set search_path='' as $$ declare receipt recora_private.p4_command_receipts%rowtype; target recora_private.p4_downstream_checkpoints%rowtype; lifecycle recora_private.data_lifecycle_current%rowtype; begin
 select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;if not found or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from new.project_id then raise exception 'P4 checkpoint command scope mismatch';end if;
 if new.phase3_lifecycle_id is not null then select * into lifecycle from recora_private.data_lifecycle_current where id=new.phase3_lifecycle_id;if not found or lifecycle.organization_id is distinct from new.organization_id or lifecycle.project_id is distinct from new.project_id or lifecycle.version is distinct from new.expected_lifecycle_version then raise exception 'P4 checkpoint lifecycle mismatch';end if;end if;
 if new.superseded_by_checkpoint_id is not null then select * into target from recora_private.p4_downstream_checkpoints where id=new.superseded_by_checkpoint_id;if not found or target.organization_id is distinct from new.organization_id or target.project_id is distinct from new.project_id or target.required_effect is distinct from new.required_effect or target.command_receipt_id is distinct from new.command_receipt_id or target.state<>'completed' then raise exception 'P4 checkpoint supersession mismatch';end if;end if;return new;end;$$;
create or replace function recora_private.p4_validate_outbox() returns trigger language plpgsql set search_path='' as $$ declare checkpoint recora_private.p4_downstream_checkpoints%rowtype; receipt recora_private.p4_command_receipts%rowtype; begin select * into checkpoint from recora_private.p4_downstream_checkpoints where id=new.checkpoint_id;select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;if not found or checkpoint.organization_id is distinct from new.organization_id or checkpoint.project_id is distinct from new.project_id or checkpoint.command_receipt_id is distinct from new.command_receipt_id or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from new.project_id then raise exception 'P4 outbox causal mismatch';end if;if new.state='failed' and(new.next_attempt_at is null or new.exhausted_at is not null)then raise exception 'P4 outbox retry state invalid';end if;if new.state='delivered' and new.resolved_at is null then raise exception 'P4 outbox delivered state requires resolution';end if;return new;end;$$;
-- permit safe retry transitions, never terminal revival.
create or replace function recora_private.p4_validate_current() returns trigger language plpgsql set search_path='' as $$ declare o jsonb:=to_jsonb(old);n jsonb:=to_jsonb(new);old_state text:=coalesce(o->>'state',o->>'processing_state');new_state text:=coalesce(n->>'state',n->>'processing_state'); begin if tg_op='UPDATE' then if o->>'organization_id'is distinct from n->>'organization_id'or o->>'project_id'is distinct from n->>'project_id' then raise exception 'P4 current scope immutable';end if;if (n->>'version')::bigint=(o->>'version')::bigint then new.version:=(o->>'version')::bigint+1;elsif(n->>'version')::bigint<>(o->>'version')::bigint+1 then raise exception 'P4 version invalid';end if;if tg_table_name='p4_downstream_checkpoints' and not((old_state='pending' and new_state in('applying','failed','reconciliation_required'))or(old_state='applying'and new_state in('completed','failed','reconciliation_required'))or(old_state='failed' and new_state in('pending','reconciliation_required'))or(old_state='reconciliation_required'and new_state='pending')or old_state=new_state) then raise exception 'P4 checkpoint transition invalid';end if;if tg_table_name='p4_durable_outbox' and not((old_state='pending'and new_state in('delivered','failed','reconciliation_required'))or(old_state='failed' and new_state in('pending','reconciliation_required'))or(old_state='reconciliation_required'and new_state='pending')or old_state=new_state)then raise exception 'P4 outbox transition invalid';end if;new.updated_at=now();end if;return new;end;$$;

-- Contract pointer may advance only to the newest matching append-only event.
create or replace function recora_private.p4_validate_contract_pointer() returns trigger language plpgsql set search_path='' as $$ declare event_row recora_private.p4_contract_events%rowtype; begin if tg_op='UPDATE' and(old.plan_policy_version_id is distinct from new.plan_policy_version_id or old.entitlement_snapshot_id is distinct from new.entitlement_snapshot_id)then select * into event_row from recora_private.p4_contract_events where contract_id=new.id order by event_sequence desc limit 1;if not found or event_row.command_receipt_id is distinct from new.last_command_receipt_id or event_row.plan_policy_version_id is distinct from new.plan_policy_version_id or event_row.entitlement_snapshot_id is distinct from new.entitlement_snapshot_id or event_row.next_state is distinct from new.state then raise exception 'P4 contract pointer requires matching current event';end if;end if;return new;end;$$;create trigger p4_contract_pointer_integrity before update on recora_private.p4_contract_projections for each row execute function recora_private.p4_validate_contract_pointer();

alter table recora_private.p4_command_conflicts add column project_id uuid, add constraint p4_command_conflicts_project_scope foreign key(project_id,organization_id) references public.projects(id,organization_id) on delete restrict, add constraint p4_command_conflicts_opaque check(recora_private.p4_opaque(command_type)and recora_private.p4_opaque(source_namespace)and recora_private.p4_opaque(source_reference)and payload_fingerprint~'^[0-9a-f]{64}$');
create or replace function recora_private.p4_validate_payment_fact() returns trigger language plpgsql set search_path='' as $$ declare receipt recora_private.p4_billing_receipts%rowtype; prior recora_private.p4_normalized_payment_facts%rowtype; command recora_private.p4_command_receipts%rowtype;begin select * into receipt from recora_private.p4_billing_receipts where id=new.receipt_id;select * into command from recora_private.p4_command_receipts where id=new.command_receipt_id;if not found or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from new.project_id or receipt.contract_id is distinct from new.contract_id or receipt.source_namespace is distinct from new.source_namespace or receipt.source_reference is distinct from new.source_reference or receipt.source_sequence is distinct from new.source_sequence or command.organization_id is distinct from new.organization_id or command.project_id is distinct from new.project_id or command.request_id is distinct from new.request_id or command.correlation_id is distinct from new.correlation_id then raise exception 'P4 payment causal mismatch';end if;if new.corrects_fact_id is not null then select * into prior from recora_private.p4_normalized_payment_facts where id=new.corrects_fact_id;if not found or prior.id=new.id or prior.organization_id is distinct from new.organization_id or prior.project_id is distinct from new.project_id or prior.contract_id is distinct from new.contract_id or prior.source_namespace is distinct from new.source_namespace or prior.source_reference is distinct from new.source_reference or prior.corrects_fact_id is not null then raise exception 'P4 payment correction lineage mismatch';end if;end if;return new;end;$$;
revoke all on function recora_private.p4_validate_invitation_final(),recora_private.p4_validate_membership_episode(),recora_private.p4_validate_contract_pointer() from public,anon,authenticated;
-- OWNER 5145421314: the final definitions retain every P4-A current, event,
-- causal, and browser-execution boundary. Current projections are mutable only
-- as projections of append-only evidence recorded in the same transaction.
alter table recora_private.p4_downstream_checkpoints
  add column correction_of_checkpoint_id uuid references recora_private.p4_downstream_checkpoints(id) on delete restrict;
alter table recora_private.p4_durable_outbox
  add column superseded_by_outbox_id uuid references recora_private.p4_durable_outbox(id) on delete restrict,
  add column correction_of_outbox_id uuid references recora_private.p4_durable_outbox(id) on delete restrict;
alter table recora_private.p4_checkpoint_events add column event_sequence bigint not null default 1 check(event_sequence>0);
alter table recora_private.p4_outbox_events add column event_sequence bigint not null default 1 check(event_sequence>0);
alter table recora_private.p4_normalized_payment_facts add column payment_chain_key text not null check(recora_private.p4_opaque(payment_chain_key));
create unique index p4_one_checkpoint_correction on recora_private.p4_downstream_checkpoints(correction_of_checkpoint_id) where correction_of_checkpoint_id is not null;
create unique index p4_one_outbox_correction on recora_private.p4_durable_outbox(correction_of_outbox_id) where correction_of_outbox_id is not null;
create unique index p4_one_payment_fact_correction on recora_private.p4_normalized_payment_facts(corrects_fact_id) where corrects_fact_id is not null;
alter table recora_private.p4_checkpoint_events add constraint p4_checkpoint_event_sequence_unique unique(checkpoint_id,event_sequence);
alter table recora_private.p4_outbox_events add constraint p4_outbox_event_sequence_unique unique(outbox_id,event_sequence);

create or replace function recora_private.p4_validate_business_episode()
returns trigger language plpgsql set search_path='' as $$
declare receipt recora_private.p4_command_receipts%rowtype;
begin
  select * into receipt from recora_private.p4_command_receipts where id=new.start_command_receipt_id;
  if not found or receipt.organization_id is distinct from new.organization_id or receipt.project_id is not null
    or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id
    or new.initial_state <> 'lead' then raise exception 'P4 business episode causal mismatch'; end if;
  return new;
end; $$;
create trigger p4_business_episode_integrity before insert on recora_private.p4_business_lifecycle_episodes for each row execute function recora_private.p4_validate_business_episode();
create trigger p4_business_episode_append_only before update or delete on recora_private.p4_business_lifecycle_episodes for each row execute function recora_private.p4_reject_history_mutation();

create or replace function recora_private.p4_validate_membership_episode()
returns trigger language plpgsql set search_path='' as $$
declare invitation recora_private.p4_invitations%rowtype; member_row public.organization_members%rowtype; receipt recora_private.p4_command_receipts%rowtype;
begin
  select * into invitation from recora_private.p4_invitations where id=new.invitation_id;
  select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or invitation.organization_id is distinct from new.organization_id
    or receipt.organization_id is distinct from new.organization_id or receipt.project_id is not null
    or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id
    or invitation.intended_role is distinct from new.intended_role then raise exception 'P4 membership episode causal mismatch'; end if;
  if tg_op='INSERT' and new.state <> 'invited' then raise exception 'P4 membership episode must start invited'; end if;
  if new.state='invited' and invitation.state <> 'pending' then raise exception 'P4 invited episode requires pending invitation'; end if;
  if new.state in('active','revoked') then
    select * into member_row from public.organization_members where id=new.membership_id;
    if invitation.state <> 'accepted' or invitation.accepted_user_id is distinct from new.accepted_user_id
      or invitation.accepted_membership_id is distinct from new.membership_id or not found
      or member_row.organization_id is distinct from new.organization_id or member_row.user_id is distinct from new.accepted_user_id
      or member_row.role is distinct from new.intended_role
      or (new.state='active' and member_row.membership_status <> 'active')
      or (new.state='revoked' and member_row.membership_status <> 'revoked') then raise exception 'P4 membership episode acceptance mismatch'; end if;
  end if;
  if tg_op='UPDATE' then
    if old.organization_id is distinct from new.organization_id or old.invitation_id is distinct from new.invitation_id
      or old.episode_number is distinct from new.episode_number or old.intended_role is distinct from new.intended_role then raise exception 'P4 membership episode identity immutable'; end if;
    if not((old.state='invited' and new.state='active') or (old.state='active' and new.state='revoked') or old.state=new.state) then raise exception 'P4 membership episode transition invalid'; end if;
    if old.state <> 'invited' and (old.membership_id is distinct from new.membership_id or old.accepted_user_id is distinct from new.accepted_user_id) then raise exception 'P4 membership episode acceptance immutable'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists p4_membership_episode_integrity on recora_private.p4_membership_episodes;
create trigger p4_membership_episode_integrity before insert or update on recora_private.p4_membership_episodes for each row execute function recora_private.p4_validate_membership_episode();
create trigger p4_membership_episode_delete_protected before delete on recora_private.p4_membership_episodes for each row execute function recora_private.p4_reject_history_mutation();

create or replace function recora_private.p4_validate_membership_episode_event()
returns trigger language plpgsql set search_path='' as $$
declare episode recora_private.p4_membership_episodes%rowtype; receipt recora_private.p4_command_receipts%rowtype; predecessor text;
begin
  select * into episode from recora_private.p4_membership_episodes where id=new.episode_id;
  select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or episode.organization_id is distinct from new.organization_id
    or receipt.organization_id is distinct from new.organization_id or receipt.project_id is not null
    or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 membership episode event causal mismatch'; end if;
  if new.event_sequence=1 then
    if new.previous_state is not null or new.next_state <> 'invited' then raise exception 'P4 membership episode initial event invalid'; end if;
  else
    select next_state::text into predecessor from recora_private.p4_membership_episode_events where episode_id=new.episode_id and event_sequence=new.event_sequence-1;
    if predecessor is null or predecessor is distinct from new.previous_state::text
      or not((new.previous_state='invited' and new.next_state='active') or (new.previous_state='active' and new.next_state='revoked')) then raise exception 'P4 membership episode event transition invalid'; end if;
  end if;
  return new;
end; $$;
create trigger p4_membership_episode_event_integrity before insert on recora_private.p4_membership_episode_events for each row execute function recora_private.p4_validate_membership_episode_event();

create or replace function recora_private.p4_validate_lifecycle_event()
returns trigger language plpgsql set search_path='' as $$
declare parent_org uuid; parent_project uuid; parent_reference text; parent_namespace text;
  receipt recora_private.p4_command_receipts%rowtype; predecessor text; state_before text:=new.previous_state::text; state_after text:=new.next_state::text;
  snapshot_org uuid; snapshot_project uuid; snapshot_policy uuid;
begin
  select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or receipt.organization_id is distinct from new.organization_id or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 event command receipt causal mismatch'; end if;
  if tg_table_name='p4_business_lifecycle_events' then
    select organization_id into parent_org from recora_private.p4_business_lifecycle_episodes where id=new.episode_id; parent_project:=null;
    select next_state::text into predecessor from recora_private.p4_business_lifecycle_events where episode_id=new.episode_id and event_sequence=new.event_sequence-1;
  elsif tg_table_name='p4_invitation_events' then
    select organization_id into parent_org from recora_private.p4_invitations where id=new.invitation_id; parent_project:=null;
    select next_state::text into predecessor from recora_private.p4_invitation_events where invitation_id=new.invitation_id and event_sequence=new.event_sequence-1;
  elsif tg_table_name='p4_contract_events' then
    select organization_id,project_id,contract_reference,source_namespace into parent_org,parent_project,parent_reference,parent_namespace from recora_private.p4_contract_projections where id=new.contract_id;
    select next_state::text into predecessor from recora_private.p4_contract_events where contract_id=new.contract_id and event_sequence=new.event_sequence-1;
    if exists(select 1 from recora_private.p4_contract_events where contract_id=new.contract_id and source_sequence>=new.source_sequence) then raise exception 'P4 contract source ordering conflict'; end if;
    if new.source_namespace is distinct from parent_namespace or new.source_reference is distinct from parent_reference then raise exception 'P4 contract event source identity mismatch'; end if;
    if (new.plan_policy_version_id is null) <> (new.entitlement_snapshot_id is null) then raise exception 'P4 contract event policy snapshot pair invalid'; end if;
    if new.entitlement_snapshot_id is not null then
      select organization_id,project_id,plan_policy_version_id into snapshot_org,snapshot_project,snapshot_policy from recora_private.entitlement_snapshots where id=new.entitlement_snapshot_id;
      if not found or snapshot_org is distinct from parent_org or snapshot_project is distinct from parent_project or snapshot_policy is distinct from new.plan_policy_version_id then raise exception 'P4 contract event snapshot scope mismatch'; end if;
    end if;
  else
    select organization_id,project_id into parent_org,parent_project from recora_private.p4_billing_receipts where id=new.receipt_id;
    select next_state::text into predecessor from recora_private.p4_billing_receipt_events where receipt_id=new.receipt_id and event_sequence=new.event_sequence-1;
  end if;
  if parent_org is null or parent_org is distinct from new.organization_id or receipt.project_id is distinct from parent_project then raise exception 'P4 event parent scope mismatch'; end if;
  if new.event_sequence=1 then
    if state_before is not null or (tg_table_name='p4_business_lifecycle_events' and state_after<>'lead')
      or (tg_table_name='p4_invitation_events' and state_after<>'pending')
      or (tg_table_name='p4_contract_events' and state_after<>'draft')
      or (tg_table_name='p4_billing_receipt_events' and state_after<>'received') then raise exception 'P4 initial event state invalid'; end if;
  elsif predecessor is null or predecessor is distinct from state_before then raise exception 'P4 event predecessor mismatch';
  elsif (tg_table_name='p4_business_lifecycle_events' and not((state_before='lead' and state_after in('onboarding','rejected'))or(state_before='onboarding' and state_after in('serving','paused','closed','rejected'))or(state_before='serving' and state_after in('paused','closed'))or(state_before='paused' and state_after in('serving','closed'))))
    or (tg_table_name='p4_invitation_events' and not(state_before='pending' and state_after in('accepted','expired','revoked','superseded')))
    or (tg_table_name='p4_contract_events' and not((state_before='draft' and state_after in('pending_activation','canceled'))or(state_before='pending_activation' and state_after in('active','paused','canceled','ended'))or(state_before='active' and state_after in('paused','canceled','ended'))or(state_before='paused' and state_after in('active','canceled','ended'))))
    or (tg_table_name='p4_billing_receipt_events' and not((state_before='received' and state_after in('validated','rejected','reconciliation_required'))or(state_before='validated' and state_after in('applying','rejected','reconciliation_required'))or(state_before='applying' and state_after in('applied','ignored_duplicate','rejected','reconciliation_required')))) then raise exception 'P4 event transition is not allowed'; end if;
  return new;
end; $$;
create or replace function recora_private.p4_validate_checkpoint_event()
returns trigger language plpgsql set search_path='' as $$
declare checkpoint recora_private.p4_downstream_checkpoints%rowtype; receipt recora_private.p4_command_receipts%rowtype; predecessor text;
begin
  select * into checkpoint from recora_private.p4_downstream_checkpoints where id=new.checkpoint_id;
  select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or checkpoint.organization_id is distinct from new.organization_id or checkpoint.command_receipt_id is distinct from new.command_receipt_id
    or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from checkpoint.project_id
    or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 checkpoint event causal mismatch'; end if;
  if new.event_sequence=1 then
    if new.previous_state is not null or new.next_state<>'pending' then raise exception 'P4 checkpoint initial event invalid'; end if;
  else
    select next_state::text into predecessor from recora_private.p4_checkpoint_events where checkpoint_id=new.checkpoint_id and event_sequence=new.event_sequence-1;
    if predecessor is null or predecessor is distinct from new.previous_state::text
      or not((new.previous_state='pending' and new.next_state in('applying','failed','reconciliation_required'))or(new.previous_state='applying' and new.next_state in('completed','failed','reconciliation_required'))or(new.previous_state='failed' and new.next_state in('pending','reconciliation_required'))or(new.previous_state='reconciliation_required' and new.next_state='pending')) then raise exception 'P4 checkpoint event transition invalid'; end if;
  end if;
  return new;
end; $$;
create or replace function recora_private.p4_validate_outbox_event()
returns trigger language plpgsql set search_path='' as $$
declare outbox recora_private.p4_durable_outbox%rowtype; receipt recora_private.p4_command_receipts%rowtype; predecessor text;
begin
  select * into outbox from recora_private.p4_durable_outbox where id=new.outbox_id;
  select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or outbox.organization_id is distinct from new.organization_id or outbox.command_receipt_id is distinct from new.command_receipt_id
    or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from outbox.project_id
    or receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 outbox event causal mismatch'; end if;
  if new.event_sequence=1 then
    if new.previous_state is not null or new.next_state<>'pending' then raise exception 'P4 outbox initial event invalid'; end if;
  else
    select next_state::text into predecessor from recora_private.p4_outbox_events where outbox_id=new.outbox_id and event_sequence=new.event_sequence-1;
    if predecessor is null or predecessor is distinct from new.previous_state::text
      or not((new.previous_state='pending' and new.next_state in('delivered','failed','reconciliation_required'))or(new.previous_state='failed' and new.next_state in('pending','reconciliation_required'))or(new.previous_state='reconciliation_required' and new.next_state='pending')) then raise exception 'P4 outbox event transition invalid'; end if;
  end if;
  return new;
end; $$;
create trigger p4_checkpoint_event_integrity before insert on recora_private.p4_checkpoint_events for each row execute function recora_private.p4_validate_checkpoint_event();
create trigger p4_outbox_event_integrity before insert on recora_private.p4_outbox_events for each row execute function recora_private.p4_validate_outbox_event();

create or replace function recora_private.p4_validate_current()
returns trigger language plpgsql set search_path='' as $$
declare o jsonb:=to_jsonb(old); n jsonb:=to_jsonb(new); old_state text:=coalesce(o->>'state',o->>'processing_state'); new_state text:=coalesce(n->>'state',n->>'processing_state');
  receipt recora_private.p4_command_receipts%rowtype; episode recora_private.p4_business_lifecycle_episodes%rowtype; snapshot recora_private.entitlement_snapshots%rowtype; receipt_id uuid;
begin
  if tg_op='INSERT' then
    if (tg_table_name='p4_business_lifecycle_current' and (new_state<>'lead' or new.version<>1))
      or (tg_table_name='p4_invitations' and (new_state<>'pending' or new.version<>1))
      or (tg_table_name='p4_contract_projections' and (new_state<>'draft' or new.version<>1))
      or (tg_table_name='p4_billing_receipts' and (new_state<>'received' or new.version<>1))
      or (tg_table_name='p4_downstream_checkpoints' and (new_state<>'pending' or new.version<>1))
      or (tg_table_name='p4_durable_outbox' and (new_state<>'pending' or new.version<>1)) then raise exception 'P4 current initial state invalid'; end if;
  else
    if o->>'organization_id' is distinct from n->>'organization_id' or o->>'project_id' is distinct from n->>'project_id' then raise exception 'P4 current scope immutable'; end if;
    if (n->>'version')::bigint=(o->>'version')::bigint then new.version:=(o->>'version')::bigint+1; elsif (n->>'version')::bigint<>(o->>'version')::bigint+1 then raise exception 'P4 version invalid'; end if;
    if old_state is distinct from new_state and (
      (tg_table_name='p4_business_lifecycle_current' and not((old_state='lead' and new_state in('onboarding','rejected'))or(old_state='onboarding' and new_state in('serving','paused','closed','rejected'))or(old_state='serving' and new_state in('paused','closed'))or(old_state='paused' and new_state in('serving','closed'))))
      or (tg_table_name='p4_invitations' and not(old_state='pending' and new_state in('accepted','expired','revoked','superseded')))
      or (tg_table_name='p4_contract_projections' and not((old_state='draft' and new_state in('pending_activation','canceled'))or(old_state='pending_activation' and new_state in('active','paused','canceled','ended'))or(old_state='active' and new_state in('paused','canceled','ended'))or(old_state='paused' and new_state in('active','canceled','ended'))))
      or (tg_table_name='p4_billing_receipts' and not((old_state='received' and new_state in('validated','rejected','reconciliation_required'))or(old_state='validated' and new_state in('applying','rejected','reconciliation_required'))or(old_state='applying' and new_state in('applied','ignored_duplicate','rejected','reconciliation_required'))))
      or (tg_table_name='p4_downstream_checkpoints' and not((old_state='pending' and new_state in('applying','failed','reconciliation_required'))or(old_state='applying' and new_state in('completed','failed','reconciliation_required'))or(old_state='failed' and new_state in('pending','reconciliation_required'))or(old_state='reconciliation_required' and new_state='pending')))
      or (tg_table_name='p4_durable_outbox' and not((old_state='pending' and new_state in('delivered','failed','reconciliation_required'))or(old_state='failed' and new_state in('pending','reconciliation_required'))or(old_state='reconciliation_required' and new_state='pending')))) then raise exception 'P4 current transition invalid'; end if;
    new.updated_at=now();
  end if;
  receipt_id:=coalesce(nullif(n->>'last_command_receipt_id','')::uuid,nullif(n->>'command_receipt_id','')::uuid);
  select * into receipt from recora_private.p4_command_receipts where id=receipt_id;
  if not found or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from nullif(n->>'project_id','')::uuid then raise exception 'P4 current command receipt scope mismatch'; end if;
  if tg_table_name='p4_business_lifecycle_current' then
    select * into episode from recora_private.p4_business_lifecycle_episodes where id=(n->>'episode_id')::uuid;
    if not found or episode.organization_id is distinct from (n->>'organization_id')::uuid or episode.start_command_receipt_id is distinct from (n->>'last_command_receipt_id')::uuid then raise exception 'P4 business current episode mismatch'; end if;
  elsif tg_table_name='p4_invitations' then
    if receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 invitation receipt causal mismatch'; end if;
    select * into receipt from recora_private.p4_command_receipts where id=new.issuer_command_receipt_id;
    if not found or receipt.organization_id is distinct from new.organization_id or receipt.project_id is not null then raise exception 'P4 invitation issuer scope mismatch'; end if;
  elsif tg_table_name='p4_contract_projections' then
    if (n->>'entitlement_snapshot_id') is not null then
      select * into snapshot from recora_private.entitlement_snapshots where id=(n->>'entitlement_snapshot_id')::uuid;
      if not found or snapshot.organization_id is distinct from (n->>'organization_id')::uuid or snapshot.project_id is distinct from nullif(n->>'project_id','')::uuid or snapshot.plan_policy_version_id is distinct from nullif(n->>'plan_policy_version_id','')::uuid then raise exception 'P4 contract snapshot scope mismatch'; end if;
    end if;
  elsif tg_table_name='p4_billing_receipts' then
    if receipt.request_id is distinct from new.request_id or receipt.correlation_id is distinct from new.correlation_id then raise exception 'P4 billing receipt causal mismatch'; end if;
  end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_checkpoint()
returns trigger language plpgsql set search_path='' as $$
declare receipt recora_private.p4_command_receipts%rowtype; target recora_private.p4_downstream_checkpoints%rowtype; lifecycle recora_private.data_lifecycle_current%rowtype;
begin
  select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from new.project_id then raise exception 'P4 checkpoint command scope mismatch'; end if;
  if new.phase3_lifecycle_id is not null then
    select * into lifecycle from recora_private.data_lifecycle_current where id=new.phase3_lifecycle_id;
    if not found or lifecycle.organization_id is distinct from new.organization_id or lifecycle.project_id is distinct from new.project_id or lifecycle.version is distinct from new.expected_lifecycle_version then raise exception 'P4 checkpoint lifecycle mismatch'; end if;
  end if;
  if new.superseded_by_checkpoint_id is not null then
    select * into target from recora_private.p4_downstream_checkpoints where id=new.superseded_by_checkpoint_id;
    if not found or target.id=new.id or target.organization_id is distinct from new.organization_id or target.project_id is distinct from new.project_id or target.required_effect is distinct from new.required_effect or target.blocks_customer_access is distinct from new.blocks_customer_access or target.phase3_lifecycle_id is distinct from new.phase3_lifecycle_id or target.command_receipt_id=new.command_receipt_id then raise exception 'P4 checkpoint supersession causal root mismatch'; end if;
  end if;
  if new.correction_of_checkpoint_id is not null then
    select * into target from recora_private.p4_downstream_checkpoints where id=new.correction_of_checkpoint_id;
    if not found or target.id=new.id or target.organization_id is distinct from new.organization_id or target.project_id is distinct from new.project_id or target.required_effect is distinct from new.required_effect or target.blocks_customer_access is distinct from new.blocks_customer_access or target.phase3_lifecycle_id is distinct from new.phase3_lifecycle_id or target.command_receipt_id=new.command_receipt_id then raise exception 'P4 checkpoint correction causal root mismatch'; end if;
  end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_outbox()
returns trigger language plpgsql set search_path='' as $$
declare checkpoint recora_private.p4_downstream_checkpoints%rowtype; receipt recora_private.p4_command_receipts%rowtype; target recora_private.p4_durable_outbox%rowtype;
begin
  select * into checkpoint from recora_private.p4_downstream_checkpoints where id=new.checkpoint_id;
  select * into receipt from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or checkpoint.organization_id is distinct from new.organization_id or checkpoint.project_id is distinct from new.project_id or checkpoint.command_receipt_id is distinct from new.command_receipt_id or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from new.project_id then raise exception 'P4 outbox causal mismatch'; end if;
  if new.state='failed' and (new.next_attempt_at is null or new.exhausted_at is not null) then raise exception 'P4 outbox retry state invalid'; end if;
  if new.state='reconciliation_required' and (new.exhausted_at is null or new.next_attempt_at is not null) then raise exception 'P4 outbox exhaustion state invalid'; end if;
  if new.state='delivered' and (new.resolved_at is null or new.next_attempt_at is not null or new.exhausted_at is not null) then raise exception 'P4 outbox delivery state invalid'; end if;
  if tg_op='UPDATE' and old.state='pending' and new.state='failed' and new.attempt_count<>old.attempt_count+1 then raise exception 'P4 outbox failure must advance attempt count'; end if;
  if tg_op='UPDATE' and old.state='failed' and new.state='pending' and new.attempt_count<>old.attempt_count then raise exception 'P4 outbox retry may not rewrite attempt count'; end if;
  if new.superseded_by_outbox_id is not null then
    select * into target from recora_private.p4_durable_outbox where id=new.superseded_by_outbox_id;
    if not found or target.id=new.id or target.organization_id is distinct from new.organization_id or target.project_id is distinct from new.project_id or target.effect_kind is distinct from new.effect_kind or target.command_receipt_id=new.command_receipt_id then raise exception 'P4 outbox supersession causal root mismatch'; end if;
  end if;
  if new.correction_of_outbox_id is not null then
    select * into target from recora_private.p4_durable_outbox where id=new.correction_of_outbox_id;
    if not found or target.id=new.id or target.organization_id is distinct from new.organization_id or target.project_id is distinct from new.project_id or target.effect_kind is distinct from new.effect_kind or target.command_receipt_id=new.command_receipt_id then raise exception 'P4 outbox correction causal root mismatch'; end if;
  end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_payment_fact()
returns trigger language plpgsql set search_path='' as $$
declare receipt recora_private.p4_billing_receipts%rowtype; prior recora_private.p4_normalized_payment_facts%rowtype; command recora_private.p4_command_receipts%rowtype;
begin
  select * into receipt from recora_private.p4_billing_receipts where id=new.receipt_id;
  select * into command from recora_private.p4_command_receipts where id=new.command_receipt_id;
  if not found or receipt.organization_id is distinct from new.organization_id or receipt.project_id is distinct from new.project_id or receipt.contract_id is distinct from new.contract_id or receipt.source_namespace is distinct from new.source_namespace or receipt.source_reference is distinct from new.source_reference or receipt.source_sequence is distinct from new.source_sequence or command.organization_id is distinct from new.organization_id or command.project_id is distinct from new.project_id or command.request_id is distinct from new.request_id or command.correlation_id is distinct from new.correlation_id then raise exception 'P4 payment fact causal mismatch'; end if;
  if new.corrects_fact_id is not null then
    select * into prior from recora_private.p4_normalized_payment_facts where id=new.corrects_fact_id;
    if not found or prior.id=new.id or prior.organization_id is distinct from new.organization_id or prior.project_id is distinct from new.project_id or prior.contract_id is distinct from new.contract_id or prior.payment_chain_key is distinct from new.payment_chain_key or prior.corrects_fact_id is not null or prior.source_namespace is distinct from new.source_namespace or prior.source_reference=new.source_reference or prior.source_sequence>=new.source_sequence or new.fact_kind not in('payment_reversed','payment_disputed','payment_unknown') then raise exception 'P4 payment correction lineage mismatch'; end if;
  end if;
  return new;
end; $$;
create or replace function recora_private.p4_validate_current_event_alignment()
returns trigger language plpgsql set search_path='' as $$
declare e record; target record;
begin
  -- A deferred row trigger is queued for each projection version. Validate only
  -- the row that is still the authoritative current version at constraint time.
  if tg_table_name='p4_business_lifecycle_current' and not exists(select 1 from recora_private.p4_business_lifecycle_current where id=new.id and version=new.version) then return null;
  elsif tg_table_name='p4_invitations' and not exists(select 1 from recora_private.p4_invitations where id=new.id and version=new.version) then return null;
  elsif tg_table_name='p4_contract_projections' and not exists(select 1 from recora_private.p4_contract_projections where id=new.id and version=new.version) then return null;
  elsif tg_table_name='p4_billing_receipts' and not exists(select 1 from recora_private.p4_billing_receipts where id=new.id and version=new.version) then return null;
  elsif tg_table_name='p4_downstream_checkpoints' and not exists(select 1 from recora_private.p4_downstream_checkpoints where id=new.id and version=new.version) then return null;
  elsif tg_table_name='p4_durable_outbox' and not exists(select 1 from recora_private.p4_durable_outbox where id=new.id and version=new.version) then return null;
  end if;
  if tg_table_name='p4_business_lifecycle_current' then
    select * into e from recora_private.p4_business_lifecycle_events where episode_id=new.episode_id order by event_sequence desc limit 1;
    if not found or e.organization_id is distinct from new.organization_id or e.next_state is distinct from new.state or e.command_receipt_id is distinct from new.last_command_receipt_id then raise exception 'P4 business current requires matching event'; end if;
  elsif tg_table_name='p4_invitations' then
    select * into e from recora_private.p4_invitation_events where invitation_id=new.id order by event_sequence desc limit 1;
    if not found or e.organization_id is distinct from new.organization_id or e.next_state is distinct from new.state or e.command_receipt_id is distinct from new.last_command_receipt_id or e.request_id is distinct from new.request_id or e.correlation_id is distinct from new.correlation_id then raise exception 'P4 invitation current requires matching event'; end if;
  elsif tg_table_name='p4_contract_projections' then
    select * into e from recora_private.p4_contract_events where contract_id=new.id order by event_sequence desc limit 1;
    if not found or e.organization_id is distinct from new.organization_id or e.next_state is distinct from new.state or e.command_receipt_id is distinct from new.last_command_receipt_id or e.source_namespace is distinct from new.source_namespace or e.source_reference is distinct from new.contract_reference or e.source_sequence is distinct from new.latest_source_sequence or e.plan_policy_version_id is distinct from new.plan_policy_version_id or e.entitlement_snapshot_id is distinct from new.entitlement_snapshot_id then raise exception 'P4 contract projection requires matching event'; end if;
  elsif tg_table_name='p4_billing_receipts' then
    select * into e from recora_private.p4_billing_receipt_events where receipt_id=new.id order by event_sequence desc limit 1;
    if not found or e.organization_id is distinct from new.organization_id or e.next_state is distinct from new.processing_state or e.command_receipt_id is distinct from new.last_command_receipt_id or e.request_id is distinct from new.request_id or e.correlation_id is distinct from new.correlation_id then raise exception 'P4 billing receipt requires matching event'; end if;
  elsif tg_table_name='p4_downstream_checkpoints' then
    select * into e from recora_private.p4_checkpoint_events where checkpoint_id=new.id order by event_sequence desc limit 1;
    if not found or e.organization_id is distinct from new.organization_id or e.next_state is distinct from new.state or e.command_receipt_id is distinct from new.command_receipt_id then raise exception 'P4 checkpoint requires matching event'; end if;
    if new.superseded_by_checkpoint_id is not null then
      select * into target from recora_private.p4_downstream_checkpoints where id=new.superseded_by_checkpoint_id;
      if not found or target.correction_of_checkpoint_id is distinct from new.id or target.state<>'completed' then raise exception 'P4 checkpoint supersession final mismatch'; end if;
    end if;
    if new.correction_of_checkpoint_id is not null then
      select * into target from recora_private.p4_downstream_checkpoints where id=new.correction_of_checkpoint_id;
      if not found or target.superseded_by_checkpoint_id is distinct from new.id then raise exception 'P4 checkpoint correction final mismatch'; end if;
    end if;
  else
    select * into e from recora_private.p4_outbox_events where outbox_id=new.id order by event_sequence desc limit 1;
    if not found or e.organization_id is distinct from new.organization_id or e.next_state is distinct from new.state or e.command_receipt_id is distinct from new.command_receipt_id then raise exception 'P4 outbox requires matching event'; end if;
    if new.superseded_by_outbox_id is not null then
      select * into target from recora_private.p4_durable_outbox where id=new.superseded_by_outbox_id;
      if not found or target.correction_of_outbox_id is distinct from new.id or target.state<>'delivered' then raise exception 'P4 outbox supersession final mismatch'; end if;
    end if;
    if new.correction_of_outbox_id is not null then
      select * into target from recora_private.p4_durable_outbox where id=new.correction_of_outbox_id;
      if not found or target.superseded_by_outbox_id is distinct from new.id then raise exception 'P4 outbox correction final mismatch'; end if;
    end if;
  end if;
  return null;
end; $$;
create constraint trigger p4_business_current_event_alignment after insert or update on recora_private.p4_business_lifecycle_current deferrable initially deferred for each row execute function recora_private.p4_validate_current_event_alignment();
create constraint trigger p4_invitation_current_event_alignment after insert or update on recora_private.p4_invitations deferrable initially deferred for each row execute function recora_private.p4_validate_current_event_alignment();
create constraint trigger p4_contract_current_event_alignment after insert or update on recora_private.p4_contract_projections deferrable initially deferred for each row execute function recora_private.p4_validate_current_event_alignment();
create constraint trigger p4_receipt_current_event_alignment after insert or update on recora_private.p4_billing_receipts deferrable initially deferred for each row execute function recora_private.p4_validate_current_event_alignment();
create constraint trigger p4_checkpoint_current_event_alignment after insert or update on recora_private.p4_downstream_checkpoints deferrable initially deferred for each row execute function recora_private.p4_validate_current_event_alignment();
create constraint trigger p4_outbox_current_event_alignment after insert or update on recora_private.p4_durable_outbox deferrable initially deferred for each row execute function recora_private.p4_validate_current_event_alignment();

create or replace function public.recora_p4_record_command_receipt(p_organization_id uuid,p_project_id uuid,p_command_type text,p_source_kind recora_private.p4_source_kind,p_source_namespace text,p_source_reference text,p_source_sequence bigint,p_payload_fingerprint text,p_request_id uuid,p_correlation_id uuid,p_idempotency_key text,p_operator_audit_event_id uuid default null,p_operator_command_receipt_id uuid default null)
returns table(command_receipt_id uuid,outcome recora_private.p4_command_outcome,stable_reason recora_private.p4_reason)
language plpgsql security definer set search_path='' as $$
declare prior recora_private.p4_command_receipts%rowtype; scope text; created_id uuid;
begin
  if p_organization_id is null or not exists(select 1 from public.organizations where id=p_organization_id) or (p_project_id is not null and not exists(select 1 from public.projects where id=p_project_id and organization_id=p_organization_id)) then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_scope'::recora_private.p4_reason; return; end if;
  if p_command_type is null or not recora_private.p4_opaque(p_command_type) or p_source_kind is null or not recora_private.p4_opaque(p_source_namespace) or not recora_private.p4_opaque(p_source_reference) or p_source_sequence is null or p_source_sequence<=0 or p_payload_fingerprint is null or p_payload_fingerprint !~ '^[0-9a-f]{64}$' or p_request_id is null or p_correlation_id is null or not recora_private.p4_opaque(p_idempotency_key) or (p_operator_audit_event_id is null) <> (p_operator_command_receipt_id is null) or (p_source_kind='manual' and p_operator_command_receipt_id is null) then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_reference'::recora_private.p4_reason; return; end if;
  begin perform recora_private.p4_assert_legacy_inventory(); exception when raise_exception then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_legacy_inventory'::recora_private.p4_reason; return; end;
  scope:='organization:'||p_organization_id::text||coalesce(':project:'||p_project_id::text,'');
  perform pg_advisory_xact_lock(hashtextextended(scope||':'||p_command_type||':'||p_idempotency_key,0));
  select * into prior from recora_private.p4_command_receipts where scope_key=scope and command_type=p_command_type and idempotency_key=p_idempotency_key;
  if found then
    if prior.source_kind=p_source_kind and prior.source_namespace=p_source_namespace and prior.source_reference=p_source_reference and prior.source_sequence=p_source_sequence and prior.payload_fingerprint=p_payload_fingerprint then return query select prior.id,'replayed'::recora_private.p4_command_outcome,'duplicate_command'::recora_private.p4_reason; return; end if;
    begin insert into recora_private.p4_command_conflicts(prior_receipt_id,organization_id,project_id,command_type,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id) values(prior.id,p_organization_id,p_project_id,p_command_type,p_source_namespace,p_source_reference,p_source_sequence,p_payload_fingerprint,p_request_id,p_correlation_id); exception when foreign_key_violation or check_violation or not_null_violation or raise_exception then null; end;
    return query select prior.id,'rejected'::recora_private.p4_command_outcome,'idempotency_conflict'::recora_private.p4_reason; return;
  end if;
  begin
    insert into recora_private.p4_command_receipts(organization_id,project_id,command_type,source_kind,source_namespace,source_reference,source_sequence,payload_fingerprint,request_id,correlation_id,idempotency_key,operator_audit_event_id,operator_command_receipt_id) values(p_organization_id,p_project_id,p_command_type,p_source_kind,p_source_namespace,p_source_reference,p_source_sequence,p_payload_fingerprint,p_request_id,p_correlation_id,p_idempotency_key,p_operator_audit_event_id,p_operator_command_receipt_id) returning id into created_id;
  exception when unique_violation then
    select * into prior from recora_private.p4_command_receipts where scope_key=scope and command_type=p_command_type and idempotency_key=p_idempotency_key;
    if found and prior.source_kind=p_source_kind and prior.source_namespace=p_source_namespace and prior.source_reference=p_source_reference and prior.source_sequence=p_source_sequence and prior.payload_fingerprint=p_payload_fingerprint then return query select prior.id,'replayed'::recora_private.p4_command_outcome,'duplicate_command'::recora_private.p4_reason; end if;
    return query select coalesce(prior.id,null::uuid),'rejected'::recora_private.p4_command_outcome,'idempotency_conflict'::recora_private.p4_reason;
  when foreign_key_violation or check_violation or not_null_violation or invalid_text_representation or raise_exception then return query select null::uuid,'rejected'::recora_private.p4_command_outcome,'invalid_reference'::recora_private.p4_reason;
  end;
  return query select created_id,'accepted'::recora_private.p4_command_outcome,'ok'::recora_private.p4_reason;
end; $$;

do $p4_object_local_exec_revoke$
declare fn record;
begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='recora_private' and p.proname like 'p4!_%' escape '!' loop
    execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
  end loop;
end $p4_object_local_exec_revoke$;
revoke all on function public.recora_p4_resolve_checkpoint_gate(uuid,uuid),public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.recora_p4_resolve_checkpoint_gate(uuid,uuid),public.recora_p4_record_command_receipt(uuid,uuid,text,recora_private.p4_source_kind,text,text,bigint,text,uuid,uuid,text,uuid,uuid) to service_role;
create or replace function recora_private.p4_assert_current_immutable()
returns trigger language plpgsql set search_path='' as $$
declare o jsonb:=to_jsonb(old); n jsonb:=to_jsonb(new); key text; protected text[];
begin
  if tg_table_name='p4_invitations' then
    foreach key in array array['organization_id','recipient_binding_hash','issuer_command_receipt_id','expires_at','intended_role'] loop if o->key is distinct from n->key then raise exception 'P4 immutable invitation field changed: %',key; end if; end loop;
    if o->>'state'='pending' and n->>'state'='accepted' then if o->>'accepted_user_id' is not null or o->>'accepted_membership_id' is not null then raise exception 'P4 invitation acceptance already bound'; end if;
    elsif o->>'state'='pending' and n->>'state'='superseded' then if o->>'superseded_by_invitation_id' is not null then raise exception 'P4 invitation supersession already bound'; end if;
    elsif o->>'state'='superseded' and n->>'state'='superseded' and o->>'superseded_by_invitation_id' is null and n->>'superseded_by_invitation_id' is not null then null;
    elsif o->'accepted_user_id' is distinct from n->'accepted_user_id' or o->'accepted_membership_id' is distinct from n->'accepted_membership_id' or o->'superseded_by_invitation_id' is distinct from n->'superseded_by_invitation_id' then raise exception 'P4 invitation causal fields are immutable'; end if;
    return new;
  end if;
  protected:=case tg_table_name when 'p4_contract_projections' then array['organization_id','project_id','contract_reference','source_namespace'] when 'p4_billing_receipts' then array['organization_id','project_id','contract_id','source_kind','source_namespace','source_reference','source_sequence','payload_fingerprint'] when 'p4_downstream_checkpoints' then array['organization_id','project_id','command_receipt_id','required_effect','phase3_lifecycle_id','expected_lifecycle_version','blocks_customer_access'] else array['checkpoint_id','command_receipt_id','organization_id','project_id','effect_kind','ordering_key','idempotency_key'] end;
  foreach key in array protected loop if o->key is distinct from n->key then raise exception 'P4 immutable identity field changed: %',key; end if; end loop;
  if tg_table_name='p4_downstream_checkpoints' then
    if o->'superseded_by_checkpoint_id' is distinct from n->'superseded_by_checkpoint_id' and (o->>'superseded_by_checkpoint_id' is not null or n->>'superseded_by_checkpoint_id' is null) then raise exception 'P4 checkpoint supersession pointer immutable'; end if;
    if o->'correction_of_checkpoint_id' is distinct from n->'correction_of_checkpoint_id' then raise exception 'P4 checkpoint correction pointer immutable'; end if;
  elsif tg_table_name='p4_durable_outbox' then
    if o->'superseded_by_outbox_id' is distinct from n->'superseded_by_outbox_id' and (o->>'superseded_by_outbox_id' is not null or n->>'superseded_by_outbox_id' is null) then raise exception 'P4 outbox supersession pointer immutable'; end if;
    if o->'correction_of_outbox_id' is distinct from n->'correction_of_outbox_id' then raise exception 'P4 outbox correction pointer immutable'; end if;
  end if;
  return new;
end; $$;

create or replace function recora_private.p4_validate_correction_chain()
returns trigger language plpgsql set search_path='' as $$
declare next_id uuid; seen uuid[]:=array[new.id];
begin
  if tg_table_name='p4_downstream_checkpoints' then
    next_id:=new.superseded_by_checkpoint_id;
    while next_id is not null loop
      if next_id=any(seen) then raise exception 'P4 checkpoint supersession cycle'; end if;
      seen:=array_append(seen,next_id);
      select superseded_by_checkpoint_id into next_id from recora_private.p4_downstream_checkpoints where id=next_id;
    end loop;
  else
    next_id:=new.superseded_by_outbox_id;
    while next_id is not null loop
      if next_id=any(seen) then raise exception 'P4 outbox supersession cycle'; end if;
      seen:=array_append(seen,next_id);
      select superseded_by_outbox_id into next_id from recora_private.p4_durable_outbox where id=next_id;
    end loop;
  end if;
  return null;
end; $$;
create constraint trigger p4_checkpoint_correction_chain after insert or update on recora_private.p4_downstream_checkpoints deferrable initially deferred for each row execute function recora_private.p4_validate_correction_chain();
create constraint trigger p4_outbox_correction_chain after insert or update on recora_private.p4_durable_outbox deferrable initially deferred for each row execute function recora_private.p4_validate_correction_chain();

do $p4_object_local_exec_revoke_final$
declare fn record;
begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='recora_private' and p.proname like 'p4!_%' escape '!' loop
    execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
  end loop;
end $p4_object_local_exec_revoke_final$;
create or replace function recora_private.p4_validate_membership_episode_event_alignment()
returns trigger language plpgsql set search_path='' as $$
declare e recora_private.p4_membership_episode_events%rowtype;
begin
  if not exists(select 1 from recora_private.p4_membership_episodes where id=new.id and state=new.state and command_receipt_id=new.command_receipt_id and request_id=new.request_id and correlation_id=new.correlation_id) then return null; end if;
  select * into e from recora_private.p4_membership_episode_events where episode_id=new.id order by event_sequence desc limit 1;
  if not found or e.organization_id is distinct from new.organization_id or e.next_state is distinct from new.state or e.command_receipt_id is distinct from new.command_receipt_id or e.request_id is distinct from new.request_id or e.correlation_id is distinct from new.correlation_id then raise exception 'P4 membership episode requires matching event'; end if;
  return null;
end; $$;
create constraint trigger p4_membership_episode_event_alignment after insert or update on recora_private.p4_membership_episodes deferrable initially deferred for each row execute function recora_private.p4_validate_membership_episode_event_alignment();
do $p4_object_local_exec_revoke_membership_final$
declare fn record;
begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='recora_private' and p.proname like 'p4!_%' escape '!' loop
    execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
  end loop;
end $p4_object_local_exec_revoke_membership_final$;
-- OWNER 5146069373: DB command/source binding, authoritative delete protection, and payment receipt lineage.
create unique index p4_one_normalized_payment_fact_per_receipt on recora_private.p4_normalized_payment_facts(receipt_id);
create or replace function recora_private.p4_reject_authoritative_delete()
returns trigger language plpgsql set search_path='' as $$ begin
  raise exception 'P4 authoritative row may not be deleted: %',tg_table_name;
end; $$;
create trigger p4_business_current_delete_protected before delete on recora_private.p4_business_lifecycle_current for each row execute function recora_private.p4_reject_authoritative_delete();
create trigger p4_invitation_delete_protected before delete on recora_private.p4_invitations for each row execute function recora_private.p4_reject_authoritative_delete();
create trigger p4_contract_projection_delete_protected before delete on recora_private.p4_contract_projections for each row execute function recora_private.p4_reject_authoritative_delete();
create trigger p4_billing_receipt_delete_protected before delete on recora_private.p4_billing_receipts for each row execute function recora_private.p4_reject_authoritative_delete();
create trigger p4_checkpoint_delete_protected before delete on recora_private.p4_downstream_checkpoints for each row execute function recora_private.p4_reject_authoritative_delete();
create trigger p4_outbox_delete_protected before delete on recora_private.p4_durable_outbox for each row execute function recora_private.p4_reject_authoritative_delete();

create or replace function recora_private.p4_validate_domain_command_binding()
returns trigger language plpgsql set search_path='' as $$
declare j jsonb:=to_jsonb(new); r recora_private.p4_command_receipts%rowtype; b recora_private.p4_billing_receipts%rowtype;
  command_id uuid; org_id uuid:=(j->>'organization_id')::uuid; project_id uuid:=nullif(j->>'project_id','')::uuid; expected text;
begin
  command_id:=case when tg_table_name='p4_business_lifecycle_episodes' then (j->>'start_command_receipt_id')::uuid else (j->>'command_receipt_id')::uuid end;
  command_id:=coalesce(command_id,nullif(j->>'last_command_receipt_id','')::uuid);
  select * into r from recora_private.p4_command_receipts where id=command_id;
  expected:=case
    when tg_table_name in('p4_business_lifecycle_episodes','p4_business_lifecycle_current','p4_business_lifecycle_events') then 'business.lifecycle'
    when tg_table_name in('p4_invitations','p4_invitation_events','p4_membership_episodes','p4_membership_episode_events') then 'invitation.lifecycle'
    when tg_table_name in('p4_contract_projections','p4_contract_events') then 'contract.projection'
    when tg_table_name in('p4_billing_receipts','p4_billing_receipt_events') then 'billing.receipt'
    when tg_table_name='p4_normalized_payment_facts' then 'billing.payment_fact'
    else 'lifecycle.checkpoint' end;
  if not found or r.command_type is distinct from expected or r.organization_id is distinct from org_id or r.project_id is distinct from project_id then
    raise exception 'P4 domain command type or scope mismatch';
  end if;
  if expected in('business.lifecycle','invitation.lifecycle') and r.project_id is not null then raise exception 'P4 organization domain command project mismatch'; end if;
  if tg_table_name='p4_invitations' then
    select * into b from recora_private.p4_billing_receipts where false;
    if r.request_id is distinct from (j->>'request_id')::uuid or r.correlation_id is distinct from (j->>'correlation_id')::uuid
      or not exists(select 1 from recora_private.p4_command_receipts i where i.id=(j->>'issuer_command_receipt_id')::uuid and i.command_type='invitation.lifecycle' and i.organization_id=org_id and i.project_id is null) then
      raise exception 'P4 invitation command causal binding mismatch';
    end if;
  elsif tg_table_name in('p4_contract_projections','p4_contract_events') then
    if r.source_namespace is distinct from j->>'source_namespace' or r.source_reference is distinct from coalesce(j->>'contract_reference',j->>'source_reference') or r.source_sequence is distinct from (coalesce(j->>'latest_source_sequence',j->>'source_sequence'))::bigint or (tg_table_name='p4_contract_events' and r.payload_fingerprint is distinct from j->>'payload_fingerprint') then raise exception 'P4 contract command source semantic identity mismatch'; end if;
  elsif tg_table_name='p4_billing_receipts' then
    if r.source_kind::text is distinct from j->>'source_kind' or r.source_namespace is distinct from j->>'source_namespace' or r.source_reference is distinct from j->>'source_reference' or r.source_sequence is distinct from (j->>'source_sequence')::bigint or r.payload_fingerprint is distinct from j->>'payload_fingerprint' or r.request_id is distinct from (j->>'request_id')::uuid or r.correlation_id is distinct from (j->>'correlation_id')::uuid then raise exception 'P4 billing receipt command source semantic identity mismatch'; end if;
  elsif tg_table_name in('p4_billing_receipt_events','p4_normalized_payment_facts') then
    select * into b from recora_private.p4_billing_receipts where id=coalesce((j->>'receipt_id')::uuid,null);
    if not found or b.organization_id is distinct from org_id or b.project_id is distinct from project_id or r.source_kind is distinct from b.source_kind or r.source_namespace is distinct from b.source_namespace or r.source_reference is distinct from b.source_reference or r.source_sequence is distinct from b.source_sequence or r.payload_fingerprint is distinct from b.payload_fingerprint then raise exception 'P4 billing command source semantic identity mismatch'; end if;
    if tg_table_name='p4_normalized_payment_facts' and (b.contract_id is distinct from nullif(j->>'contract_id','')::uuid or b.source_namespace is distinct from j->>'source_namespace' or b.source_reference is distinct from j->>'source_reference' or b.source_sequence is distinct from (j->>'source_sequence')::bigint or b.request_id is distinct from (j->>'request_id')::uuid or b.correlation_id is distinct from (j->>'correlation_id')::uuid or r.request_id is distinct from (j->>'request_id')::uuid or r.correlation_id is distinct from (j->>'correlation_id')::uuid) then raise exception 'P4 payment fact command lineage mismatch'; end if;
  elsif j ? 'request_id' and (r.request_id is distinct from (j->>'request_id')::uuid or r.correlation_id is distinct from (j->>'correlation_id')::uuid) then
    raise exception 'P4 domain command causal binding mismatch';
  end if;
  return new;
end; $$;
create trigger p4_business_episode_command_binding before insert on recora_private.p4_business_lifecycle_episodes for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_business_current_command_binding before insert or update on recora_private.p4_business_lifecycle_current for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_business_event_command_binding before insert on recora_private.p4_business_lifecycle_events for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_invitation_command_binding before insert or update on recora_private.p4_invitations for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_invitation_event_command_binding before insert on recora_private.p4_invitation_events for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_membership_command_binding before insert or update on recora_private.p4_membership_episodes for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_membership_event_command_binding before insert on recora_private.p4_membership_episode_events for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_contract_command_binding before insert or update on recora_private.p4_contract_projections for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_contract_event_command_binding before insert on recora_private.p4_contract_events for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_billing_command_binding before insert or update on recora_private.p4_billing_receipts for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_billing_event_command_binding before insert on recora_private.p4_billing_receipt_events for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_payment_fact_command_binding before insert on recora_private.p4_normalized_payment_facts for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_checkpoint_command_binding before insert or update on recora_private.p4_downstream_checkpoints for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_checkpoint_event_command_binding before insert on recora_private.p4_checkpoint_events for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_outbox_command_binding before insert or update on recora_private.p4_durable_outbox for each row execute function recora_private.p4_validate_domain_command_binding();
create trigger p4_outbox_event_command_binding before insert on recora_private.p4_outbox_events for each row execute function recora_private.p4_validate_domain_command_binding();
-- A terminal business episode is immutable history. Renewal changes the sole current pointer to a new lead episode.
create or replace function recora_private.p4_validate_current()
returns trigger language plpgsql set search_path='' as $$
declare o jsonb:=to_jsonb(old); n jsonb:=to_jsonb(new); old_state text:=coalesce(o->>'state',o->>'processing_state'); new_state text:=coalesce(n->>'state',n->>'processing_state');
  episode recora_private.p4_business_lifecycle_episodes%rowtype; old_episode recora_private.p4_business_lifecycle_episodes%rowtype; snapshot recora_private.entitlement_snapshots%rowtype;
begin
  if tg_op='INSERT' then
    if (tg_table_name='p4_business_lifecycle_current' and (new_state<>'lead' or new.version<>1))
      or (tg_table_name='p4_invitations' and (new_state<>'pending' or new.version<>1))
      or (tg_table_name='p4_contract_projections' and (new_state<>'draft' or new.version<>1))
      or (tg_table_name='p4_billing_receipts' and (new_state<>'received' or new.version<>1))
      or (tg_table_name='p4_downstream_checkpoints' and (new_state<>'pending' or new.version<>1))
      or (tg_table_name='p4_durable_outbox' and (new_state<>'pending' or new.version<>1)) then raise exception 'P4 current initial state invalid'; end if;
  else
    if o->>'organization_id' is distinct from n->>'organization_id' or o->>'project_id' is distinct from n->>'project_id' then raise exception 'P4 current scope immutable'; end if;
    if (n->>'version')::bigint=(o->>'version')::bigint then new.version:=(o->>'version')::bigint+1; elsif (n->>'version')::bigint<>(o->>'version')::bigint+1 then raise exception 'P4 version invalid'; end if;
    if tg_table_name='p4_business_lifecycle_current' and nullif(o->>'episode_id','')::uuid is distinct from nullif(n->>'episode_id','')::uuid then
      if old_state not in('closed','rejected') or new_state<>'lead' then raise exception 'P4 business renewal requires terminal old episode and new lead episode'; end if;
      select * into old_episode from recora_private.p4_business_lifecycle_episodes where id=(o->>'episode_id')::uuid;
      select * into episode from recora_private.p4_business_lifecycle_episodes where id=(n->>'episode_id')::uuid;
      if not found or old_episode.organization_id is distinct from (n->>'organization_id')::uuid or episode.organization_id is distinct from (n->>'organization_id')::uuid or episode.episode_number<=old_episode.episode_number or episode.initial_state<>'lead' or episode.start_command_receipt_id is distinct from (n->>'last_command_receipt_id')::uuid then raise exception 'P4 business renewal episode mismatch'; end if;
    elsif old_state is distinct from new_state and (
      (tg_table_name='p4_business_lifecycle_current' and not((old_state='lead' and new_state in('onboarding','rejected'))or(old_state='onboarding' and new_state in('serving','paused','closed','rejected'))or(old_state='serving' and new_state in('paused','closed'))or(old_state='paused' and new_state in('serving','closed'))))
      or (tg_table_name='p4_invitations' and not(old_state='pending' and new_state in('accepted','expired','revoked','superseded')))
      or (tg_table_name='p4_contract_projections' and not((old_state='draft' and new_state in('pending_activation','canceled'))or(old_state='pending_activation' and new_state in('active','paused','canceled','ended'))or(old_state='active' and new_state in('paused','canceled','ended'))or(old_state='paused' and new_state in('active','canceled','ended'))))
      or (tg_table_name='p4_billing_receipts' and not((old_state='received' and new_state in('validated','rejected','reconciliation_required'))or(old_state='validated' and new_state in('applying','rejected','reconciliation_required'))or(old_state='applying' and new_state in('applied','ignored_duplicate','rejected','reconciliation_required'))))
      or (tg_table_name='p4_downstream_checkpoints' and not((old_state='pending' and new_state in('applying','failed','reconciliation_required'))or(old_state='applying' and new_state in('completed','failed','reconciliation_required'))or(old_state='failed' and new_state in('pending','reconciliation_required'))or(old_state='reconciliation_required' and new_state='pending')))
      or (tg_table_name='p4_durable_outbox' and not((old_state='pending' and new_state in('delivered','failed','reconciliation_required'))or(old_state='failed' and new_state in('pending','reconciliation_required'))or(old_state='reconciliation_required' and new_state='pending')))) then raise exception 'P4 current transition invalid'; end if;
    new.updated_at=now();
  end if;
  if tg_table_name='p4_business_lifecycle_current' then
    select * into episode from recora_private.p4_business_lifecycle_episodes where id=(n->>'episode_id')::uuid;
    if not found or episode.organization_id is distinct from (n->>'organization_id')::uuid then raise exception 'P4 business current episode mismatch'; end if;
    if tg_op='INSERT' and episode.start_command_receipt_id is distinct from (n->>'last_command_receipt_id')::uuid then raise exception 'P4 business initial episode receipt mismatch'; end if;
  elsif tg_table_name='p4_contract_projections' and (n->>'entitlement_snapshot_id') is not null then
    select * into snapshot from recora_private.entitlement_snapshots where id=(n->>'entitlement_snapshot_id')::uuid;
    if not found or snapshot.organization_id is distinct from (n->>'organization_id')::uuid or snapshot.project_id is distinct from nullif(n->>'project_id','')::uuid or snapshot.plan_policy_version_id is distinct from nullif(n->>'plan_policy_version_id','')::uuid then raise exception 'P4 contract snapshot scope mismatch'; end if;
  end if;
  return new;
end; $$;

do $p4_object_local_exec_revoke_5146069373$
declare fn record;
begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='recora_private' and p.proname like 'p4!_%' escape '!' loop
    execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
  end loop;
end $p4_object_local_exec_revoke_5146069373$;

-- OWNER remediation 5146470423: event rows have no project column. Derive their
-- command scope only from the authoritative current parent, never from child JSON.
create or replace function recora_private.p4_validate_domain_command_binding()
returns trigger language plpgsql set search_path='' as $$
declare
  j jsonb := to_jsonb(new);
  r recora_private.p4_command_receipts%rowtype;
  b recora_private.p4_billing_receipts%rowtype;
  parent_organization_id uuid;
  effective_project_id uuid := nullif(j->>'project_id','')::uuid;
  invitation_issuer_id uuid;
  invitation_last_id uuid;
  invitation_state text;
  command_id uuid;
  org_id uuid := (j->>'organization_id')::uuid;
  expected text;
begin
  command_id := case
    when tg_table_name='p4_business_lifecycle_episodes' then (j->>'start_command_receipt_id')::uuid
    else (j->>'command_receipt_id')::uuid
  end;
  command_id := coalesce(command_id,nullif(j->>'last_command_receipt_id','')::uuid);

  if tg_table_name='p4_contract_events' then
    select organization_id,project_id into parent_organization_id,effective_project_id
    from recora_private.p4_contract_projections where id=(j->>'contract_id')::uuid;
    if not found or parent_organization_id is distinct from org_id then
      raise exception 'P4 child event parent scope mismatch';
    end if;
  elsif tg_table_name='p4_billing_receipt_events' then
    select organization_id,project_id into parent_organization_id,effective_project_id
    from recora_private.p4_billing_receipts where id=(j->>'receipt_id')::uuid;
    if not found or parent_organization_id is distinct from org_id then
      raise exception 'P4 child event parent scope mismatch';
    end if;
  elsif tg_table_name='p4_checkpoint_events' then
    select organization_id,project_id into parent_organization_id,effective_project_id
    from recora_private.p4_downstream_checkpoints where id=(j->>'checkpoint_id')::uuid;
    if not found or parent_organization_id is distinct from org_id then
      raise exception 'P4 child event parent scope mismatch';
    end if;
  elsif tg_table_name='p4_outbox_events' then
    select organization_id,project_id into parent_organization_id,effective_project_id
    from recora_private.p4_durable_outbox where id=(j->>'outbox_id')::uuid;
    if not found or parent_organization_id is distinct from org_id then
      raise exception 'P4 child event parent scope mismatch';
    end if;
  end if;

  select * into r from recora_private.p4_command_receipts where id=command_id;
  expected := case
    when tg_table_name in('p4_business_lifecycle_episodes','p4_business_lifecycle_current','p4_business_lifecycle_events') then 'business.lifecycle'
    when tg_table_name in('p4_invitations','p4_invitation_events','p4_membership_episodes','p4_membership_episode_events') then 'invitation.lifecycle'
    when tg_table_name in('p4_contract_projections','p4_contract_events') then 'contract.projection'
    when tg_table_name in('p4_billing_receipts','p4_billing_receipt_events') then 'billing.receipt'
    when tg_table_name='p4_normalized_payment_facts' then 'billing.payment_fact'
    else 'lifecycle.checkpoint'
  end;
  if not found or r.command_type is distinct from expected
    or r.organization_id is distinct from org_id
    or r.project_id is distinct from effective_project_id then
    raise exception 'P4 domain command type or scope mismatch';
  end if;
  if expected in('business.lifecycle','invitation.lifecycle') and r.project_id is not null then
    raise exception 'P4 organization domain command project mismatch';
  end if;

  if tg_table_name='p4_invitations' then
    if tg_op='INSERT' and j->>'state'='pending'
      and (j->>'issuer_command_receipt_id')::uuid is distinct from (j->>'last_command_receipt_id')::uuid then
      raise exception 'P4 pending invitation issuer must equal initial receipt';
    end if;
    if r.request_id is distinct from (j->>'request_id')::uuid
      or r.correlation_id is distinct from (j->>'correlation_id')::uuid
      or not exists(
        select 1 from recora_private.p4_command_receipts i
        where i.id=(j->>'issuer_command_receipt_id')::uuid
          and i.command_type='invitation.lifecycle'
          and i.organization_id=org_id
          and i.project_id is null
      ) then
      raise exception 'P4 invitation command causal binding mismatch';
    end if;
  elsif tg_table_name='p4_invitation_events' then
    if (j->>'event_sequence')::bigint=1 then
      select organization_id,state::text,issuer_command_receipt_id,last_command_receipt_id
      into parent_organization_id,invitation_state,invitation_issuer_id,invitation_last_id
      from recora_private.p4_invitations where id=(j->>'invitation_id')::uuid;
      if not found
        or parent_organization_id is distinct from org_id
        or invitation_state is distinct from 'pending'
        or invitation_issuer_id is distinct from invitation_last_id
        or command_id is distinct from invitation_issuer_id then
        raise exception 'P4 invitation initial event receipt mismatch';
      end if;
    end if;
    if r.request_id is distinct from (j->>'request_id')::uuid
      or r.correlation_id is distinct from (j->>'correlation_id')::uuid then
      raise exception 'P4 domain command causal binding mismatch';
    end if;
  elsif tg_table_name in('p4_contract_projections','p4_contract_events') then
    if r.source_namespace is distinct from j->>'source_namespace'
      or r.source_reference is distinct from coalesce(j->>'contract_reference',j->>'source_reference')
      or r.source_sequence is distinct from (coalesce(j->>'latest_source_sequence',j->>'source_sequence'))::bigint
      or (tg_table_name='p4_contract_events' and r.payload_fingerprint is distinct from j->>'payload_fingerprint') then
      raise exception 'P4 contract command source semantic identity mismatch';
    end if;
  elsif tg_table_name='p4_billing_receipts' then
    if r.source_kind::text is distinct from j->>'source_kind'
      or r.source_namespace is distinct from j->>'source_namespace'
      or r.source_reference is distinct from j->>'source_reference'
      or r.source_sequence is distinct from (j->>'source_sequence')::bigint
      or r.payload_fingerprint is distinct from j->>'payload_fingerprint'
      or r.request_id is distinct from (j->>'request_id')::uuid
      or r.correlation_id is distinct from (j->>'correlation_id')::uuid then
      raise exception 'P4 billing receipt command source semantic identity mismatch';
    end if;
  elsif tg_table_name in('p4_billing_receipt_events','p4_normalized_payment_facts') then
    select * into b from recora_private.p4_billing_receipts
    where id=(j->>'receipt_id')::uuid;
    if not found
      or b.organization_id is distinct from org_id
      or b.project_id is distinct from effective_project_id
      or r.source_kind is distinct from b.source_kind
      or r.source_namespace is distinct from b.source_namespace
      or r.source_reference is distinct from b.source_reference
      or r.source_sequence is distinct from b.source_sequence
      or r.payload_fingerprint is distinct from b.payload_fingerprint then
      raise exception 'P4 billing command source semantic identity mismatch';
    end if;
    if tg_table_name='p4_normalized_payment_facts'
      and (
        b.contract_id is distinct from nullif(j->>'contract_id','')::uuid
        or b.source_namespace is distinct from j->>'source_namespace'
        or b.source_reference is distinct from j->>'source_reference'
        or b.source_sequence is distinct from (j->>'source_sequence')::bigint
        or b.request_id is distinct from (j->>'request_id')::uuid
        or b.correlation_id is distinct from (j->>'correlation_id')::uuid
        or r.request_id is distinct from (j->>'request_id')::uuid
        or r.correlation_id is distinct from (j->>'correlation_id')::uuid
      ) then
      raise exception 'P4 payment fact command lineage mismatch';
    end if;
  elsif j ? 'request_id'
    and (r.request_id is distinct from (j->>'request_id')::uuid
      or r.correlation_id is distinct from (j->>'correlation_id')::uuid) then
    raise exception 'P4 domain command causal binding mismatch';
  end if;
  return new;
end; $$;
revoke all on function recora_private.p4_validate_domain_command_binding() from public,anon,authenticated;
