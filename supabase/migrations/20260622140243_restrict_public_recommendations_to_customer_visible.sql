-- Restrict customer-facing recommendation reads to rows that have passed the
-- publication gate. Internal candidate/review rows remain stored in
-- public.recommendations for service-role and direct database review workflows.

set search_path = public, extensions;

create or replace function recora_private.is_customer_visible_recommendation(
  recommendation_status public.recora_recommendation_state,
  recommendation_metadata jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with tokens as (
    select
      lower(btrim(coalesce(recommendation_status::text, ''))) as status_token,
      lower(btrim(coalesce(recommendation_metadata->>'display_decision', ''))) as display_decision,
      lower(btrim(coalesce(recommendation_metadata->>'should_save_to_recommendations', ''))) as should_save,
      lower(btrim(coalesce(
        recommendation_metadata->>'quality_gate_decision',
        recommendation_metadata->>'gate_decision',
        recommendation_metadata->>'decision',
        ''
      ))) as quality_decision,
      lower(btrim(coalesce(
        recommendation_metadata->>'publication_state',
        recommendation_metadata->>'customer_visibility',
        recommendation_metadata->>'display_stage',
        ''
      ))) as publication_state
  )
  select
    not (
      status_token in ('dismiss', 'dismissed', 'reject', 'rejected', 'hide', 'hidden', 'suppress')
      or display_decision in ('hide', 'hidden', 'suppress')
      or quality_decision = 'suppress'
      or publication_state in ('hidden_internal', 'hide', 'hidden', 'suppress')
      or quality_decision = 'hold'
      or should_save = 'review_required'
      or status_token in ('hold', 'review_required')
      or should_save = 'candidate_only'
      or status_token = 'candidate_only'
      or publication_state in ('review_required', 'candidate_only', 'pre_quality_gate')
      or publication_state not in ('', 'customer_visible', 'published', 'client_visible')
    )
    and (
      publication_state in ('customer_visible', 'published', 'client_visible')
      or (quality_decision = 'auto_publish' and display_decision = 'show')
    )
  from tokens;
$$;

comment on function recora_private.is_customer_visible_recommendation(public.recora_recommendation_state, jsonb) is
  'Returns true only for recommendation rows that are safe for customer-facing Data API reads. Pre-quality-gate, review-required, held, candidate-only, suppressed, hidden, and dismissed rows are internal.';

revoke all on function recora_private.is_customer_visible_recommendation(public.recora_recommendation_state, jsonb) from public;
grant execute on function recora_private.is_customer_visible_recommendation(public.recora_recommendation_state, jsonb) to anon, authenticated;

drop policy if exists "recora_demo_or_member_recommendations_select" on public.recommendations;
create policy "recora_demo_or_member_recommendations_select"
on public.recommendations
for select
to anon, authenticated
using (
  recora_private.can_read_project(project_id)
  and recora_private.is_customer_visible_recommendation(status, metadata)
);
