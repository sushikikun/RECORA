-- Register additional active AI models for measurement selection.
-- This migration only updates the model catalog; it does not execute
-- external APIs, create measurement schedules, or enqueue batches.

set search_path = public, extensions;

insert into public.ai_models (
  provider,
  model_name,
  display_name,
  is_active,
  created_at,
  updated_at
)
values
  (
    'Google',
    'gemini-2.0-flash',
    'Gemini',
    true,
    now(),
    now()
  ),
  (
    'Perplexity',
    'sonar',
    'Perplexity',
    true,
    now(),
    now()
  )
on conflict (provider, model_name) do update
set
  display_name = excluded.display_name,
  is_active = true,
  updated_at = now();
