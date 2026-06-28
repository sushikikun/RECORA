-- Recora admin DB P0-C report publication, prompt change, and internal notes tables.
-- Scope:
-- - Add internal report publication review, prompt change event, and internal note metadata tables.
-- - Keep raw measurement results, AI answers, aggregate metric values, prompt snapshots,
--   and recommendation bodies in existing public measurement tables.
-- - Do not create customer-facing read models, dashboard publication gates, worker write
--   paths, /internal write paths, sample data, or remote DB changes.

set search_path = public, extensions;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prompts'::regclass
      and conname = 'prompts_id_project_id_unique'
  ) then
    alter table public.prompts
      add constraint prompts_id_project_id_unique unique (id, project_id);
  end if;
end;
$$;

create table recora_admin.report_publication_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null,
  measurement_run_id uuid not null references public.measurement_runs(id) on delete restrict,
  status text not null default 'pending_review',
  review_type text not null default 'manual',
  reviewed_by_type text,
  reviewed_by_id text,
  reviewer_note text,
  blocker_snapshot jsonb not null default '{}'::jsonb,
  decision_metadata jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_publication_reviews_project_organization_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint report_publication_reviews_measurement_run_project_fkey
    foreign key (measurement_run_id, project_id) references public.measurement_runs(id, project_id) on delete restrict,
  constraint report_publication_reviews_status_check check (
    status in ('pending_review', 'approved', 'published', 'needs_fix', 'rejected', 'unpublished')
  ),
  constraint report_publication_reviews_review_type_check check (
    review_type in ('manual', 'automated_gate', 'migration', 'system')
  ),
  constraint report_publication_reviews_reviewed_by_type_check check (
    reviewed_by_type is null or reviewed_by_type in ('operator', 'script', 'system')
  ),
  constraint report_publication_reviews_reviewer_note_not_blank check (
    reviewer_note is null or btrim(reviewer_note) <> ''
  ),
  constraint report_publication_reviews_blocker_snapshot_is_object check (jsonb_typeof(blocker_snapshot) = 'object'),
  constraint report_publication_reviews_decision_metadata_is_object check (jsonb_typeof(decision_metadata) = 'object'),
  constraint report_publication_reviews_reviewed_at_required check (
    status = 'pending_review' or reviewed_at is not null
  ),
  constraint report_publication_reviews_published_at_status check (
    published_at is null or status in ('published', 'unpublished')
  ),
  constraint report_publication_reviews_published_requires_timestamp check (
    status <> 'published' or published_at is not null
  ),
  constraint report_publication_reviews_published_after_reviewed check (
    published_at is null
    or reviewed_at is null
    or published_at >= reviewed_at
  )
);

comment on table recora_admin.report_publication_reviews is
  'Internal report publication review history. This is DB groundwork for a future publication gate; customer dashboard visibility conditions are out of scope and must be implemented in a separate read model/dashboard PR. Raw AI answers, aggregate values, prompt snapshots, and recommendation bodies remain in public measurement tables.';

comment on column recora_admin.report_publication_reviews.measurement_run_id is
  'References the existing public.measurement_runs row being reviewed. The composite FK keeps the run in the same project; this table must not duplicate measurement result bodies or aggregate metric values.';

comment on column recora_admin.report_publication_reviews.status is
  'Internal review state only. approved and published are admin gate states, not final customer-facing dashboard visibility rules.';

comment on column recora_admin.report_publication_reviews.reviewer_note is
  'Short internal review summary only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate metric values, prompt text bodies, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.report_publication_reviews.blocker_snapshot is
  'JSON object for short blocker summaries only. Must not store secrets, raw AI answers, aggregate metric copies, prompt text bodies, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.report_publication_reviews.decision_metadata is
  'JSON object for internal decision metadata only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate metric copies, prompt text bodies, recommendation bodies, or unnecessary PII.';

create table recora_admin.prompt_change_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  project_id uuid not null,
  prompt_id uuid,
  event_type text not null,
  changed_by_type text not null default 'operator',
  changed_by_id text,
  old_prompt_hash text,
  new_prompt_hash text,
  old_prompt_preview text,
  new_prompt_preview text,
  change_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint prompt_change_events_project_organization_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint prompt_change_events_prompt_project_fkey
    foreign key (prompt_id, project_id) references public.prompts(id, project_id) on delete set null (prompt_id),
  constraint prompt_change_events_event_type_check check (
    event_type in ('created', 'updated', 'archived', 'restored', 'eligibility_changed', 'bulk_imported')
  ),
  constraint prompt_change_events_changed_by_type_check check (
    changed_by_type in ('operator', 'customer', 'script', 'worker', 'system')
  ),
  constraint prompt_change_events_old_prompt_hash_not_blank check (
    old_prompt_hash is null or btrim(old_prompt_hash) <> ''
  ),
  constraint prompt_change_events_new_prompt_hash_not_blank check (
    new_prompt_hash is null or btrim(new_prompt_hash) <> ''
  ),
  constraint prompt_change_events_old_prompt_preview_length check (
    old_prompt_preview is null or char_length(old_prompt_preview) <= 500
  ),
  constraint prompt_change_events_new_prompt_preview_length check (
    new_prompt_preview is null or char_length(new_prompt_preview) <= 500
  ),
  constraint prompt_change_events_change_reason_length check (
    change_reason is null or char_length(change_reason) <= 1000
  ),
  constraint prompt_change_events_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

comment on table recora_admin.prompt_change_events is
  'Internal prompt change history for audit and operations. It does not replace public.ai_conversations.prompt_text_snapshot, which remains the source of truth for prompts used by past runs. This table must not store raw AI answers, aggregate values, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.prompt_change_events.prompt_id is
  'Nullable prompt pointer. On prompt deletion, prompt_id is cleared so the event history remains without blocking prompt lifecycle changes.';

comment on column recora_admin.prompt_change_events.old_prompt_hash is
  'Hash of the previous prompt text when available. The prompt body itself should remain outside this table.';

comment on column recora_admin.prompt_change_events.new_prompt_hash is
  'Hash of the new prompt text when available. The prompt body itself should remain outside this table.';

comment on column recora_admin.prompt_change_events.old_prompt_preview is
  'Short human-readable preview only. Must not store long prompt bodies, secrets, raw AI answers, aggregate values, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.prompt_change_events.new_prompt_preview is
  'Short human-readable preview only. Must not store long prompt bodies, secrets, raw AI answers, aggregate values, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.prompt_change_events.change_reason is
  'Short internal reason for the change. Must not store secrets, raw AI answers, aggregate values, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.prompt_change_events.metadata is
  'JSON object for internal prompt-change metadata only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, long prompt bodies, aggregate metric copies, recommendation bodies, or unnecessary PII.';

create table recora_admin.internal_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  project_id uuid,
  note_type text not null default 'general',
  subject_type text not null,
  subject_id uuid,
  body text not null,
  visibility text not null default 'internal',
  author_type text not null default 'operator',
  author_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint internal_notes_project_requires_organization_check check (
    project_id is null or organization_id is not null
  ),
  constraint internal_notes_project_organization_fkey
    foreign key (project_id, organization_id) references public.projects(id, organization_id) on delete restrict,
  constraint internal_notes_note_type_check check (
    note_type in ('general', 'sales', 'onboarding', 'support', 'billing', 'measurement', 'report_review', 'risk')
  ),
  constraint internal_notes_subject_type_check check (
    subject_type in (
      'organization',
      'project',
      'subscription',
      'diagnostic_intake',
      'measurement_schedule',
      'measurement_batch',
      'measurement_run',
      'report_publication_review',
      'recommendation',
      'other'
    )
  ),
  constraint internal_notes_visibility_check check (visibility in ('internal')),
  constraint internal_notes_author_type_check check (
    author_type in ('operator', 'script', 'worker', 'system')
  ),
  constraint internal_notes_body_not_blank check (btrim(body) <> ''),
  constraint internal_notes_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint internal_notes_archived_after_created check (
    archived_at is null or archived_at >= created_at
  )
);

comment on table recora_admin.internal_notes is
  'Internal-only notes for Recora operations. Notes are not customer-facing and must not be read by customer dashboards. They must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate values, prompt text bodies, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.internal_notes.subject_type is
  'Polymorphic internal subject label for operations. It is not a customer-facing visibility model and does not grant access to the referenced subject.';

comment on column recora_admin.internal_notes.subject_id is
  'Optional opaque subject identifier paired with subject_type. Subject-specific FK enforcement may be added in future narrow migrations if needed.';

comment on column recora_admin.internal_notes.body is
  'Internal note body. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate metric values, prompt text bodies, recommendation bodies, or unnecessary PII.';

comment on column recora_admin.internal_notes.visibility is
  'Currently internal-only. Customer-facing notes or dashboard visibility must be designed in a separate read model and authorization PR.';

comment on column recora_admin.internal_notes.metadata is
  'JSON object for internal note metadata only. Must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate metric copies, prompt text bodies, recommendation bodies, or unnecessary PII.';

create trigger set_recora_admin_report_publication_reviews_updated_at
before update on recora_admin.report_publication_reviews
for each row execute function public.set_updated_at();

create trigger set_recora_admin_internal_notes_updated_at
before update on recora_admin.internal_notes
for each row execute function public.set_updated_at();

create index report_publication_reviews_organization_id_idx
on recora_admin.report_publication_reviews (organization_id);

create index report_publication_reviews_project_organization_idx
on recora_admin.report_publication_reviews (project_id, organization_id);

create index report_publication_reviews_status_created_at_idx
on recora_admin.report_publication_reviews (status, created_at desc);

create index report_publication_reviews_measurement_run_project_idx
on recora_admin.report_publication_reviews (measurement_run_id, project_id);

create index report_publication_reviews_updated_at_idx
on recora_admin.report_publication_reviews (updated_at desc);

create index prompt_change_events_organization_id_idx
on recora_admin.prompt_change_events (organization_id);

create index prompt_change_events_project_organization_idx
on recora_admin.prompt_change_events (project_id, organization_id);

create index prompt_change_events_prompt_project_idx
on recora_admin.prompt_change_events (prompt_id, project_id)
where prompt_id is not null;

create index prompt_change_events_event_type_created_at_idx
on recora_admin.prompt_change_events (event_type, created_at desc);

create index prompt_change_events_created_at_idx
on recora_admin.prompt_change_events (created_at desc);

create index internal_notes_organization_id_idx
on recora_admin.internal_notes (organization_id)
where organization_id is not null;

create index internal_notes_project_organization_idx
on recora_admin.internal_notes (project_id, organization_id)
where project_id is not null;

create index internal_notes_note_type_idx
on recora_admin.internal_notes (note_type);

create index internal_notes_subject_idx
on recora_admin.internal_notes (subject_type, subject_id)
where subject_id is not null;

create index internal_notes_created_at_idx
on recora_admin.internal_notes (created_at desc);

create index internal_notes_updated_at_idx
on recora_admin.internal_notes (updated_at desc);

alter table recora_admin.report_publication_reviews enable row level security;
alter table recora_admin.prompt_change_events enable row level security;
alter table recora_admin.internal_notes enable row level security;

revoke all on table recora_admin.report_publication_reviews from public;
revoke all on table recora_admin.report_publication_reviews from anon;
revoke all on table recora_admin.report_publication_reviews from authenticated;
revoke all on table recora_admin.prompt_change_events from public;
revoke all on table recora_admin.prompt_change_events from anon;
revoke all on table recora_admin.prompt_change_events from authenticated;
revoke all on table recora_admin.internal_notes from public;
revoke all on table recora_admin.internal_notes from anon;
revoke all on table recora_admin.internal_notes from authenticated;

grant usage on schema recora_admin to service_role;
grant select on table recora_admin.report_publication_reviews to service_role;
grant select on table recora_admin.prompt_change_events to service_role;
grant select on table recora_admin.internal_notes to service_role;

comment on table recora_admin.report_publication_reviews is
  'Internal report publication review history. This table is read-only to service_role in P0-C; future /internal write paths must add durable operator auth, per-action authorization, write grants, and RLS policies in a separate PR. Customer dashboard publication conditions are out of scope. Raw AI answers, aggregate values, prompt snapshots, and recommendation bodies remain in public measurement tables.';

comment on table recora_admin.prompt_change_events is
  'Internal prompt change history for audit and operations. This table is read-only to service_role in P0-C; future /internal write paths must add durable operator auth, per-action authorization, write grants, and RLS policies in a separate PR. It does not replace public.ai_conversations.prompt_text_snapshot for past runs and must not store raw AI answers, aggregate values, recommendation bodies, long prompt bodies, or unnecessary PII.';

comment on table recora_admin.internal_notes is
  'Internal-only notes for Recora operations. This table is read-only to service_role in P0-C; future /internal write paths must add durable operator auth, per-action authorization, write grants, RLS policies, JSONB/body validators, size limits, and PII retention rules in a separate PR. It must not store secrets, API keys, tokens, DB URLs, raw AI answers, aggregate values, prompt text bodies, recommendation bodies, or unnecessary PII.';
