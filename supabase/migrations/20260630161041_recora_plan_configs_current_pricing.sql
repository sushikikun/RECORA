-- Current Recora pricing plan configs.
-- This seeds/upserts internal plan definitions only.
-- It does not assign customers to plans.
-- It does not implement billing, Stripe, dashboard visibility, or measurement execution.
-- Mutable plan values live in config jsonb.

set search_path = public, extensions;

insert into recora_admin.plan_configs (
  plan_code,
  display_name,
  status,
  config,
  created_at,
  updated_at
)
values
  (
    'free_preview',
    'Free Preview',
    'active',
    '{
      "price_jpy": 0,
      "currency": "JPY",
      "billing_type": "free",
      "plan_family": "preview",
      "plan_kind": "free",
      "question_limit": 50,
      "model_limit": 1,
      "run_mode": "one_time",
      "cadence": "once",
      "recommendations_enabled": false,
      "customer_recommendations_visible": false,
      "notes": "Free preview: 50 AI questions, 1 model, one-time diagnostic, no customer-facing recommendations."
    }'::jsonb,
    now(),
    now()
  ),
  (
    'trial_audit',
    'Trial Audit',
    'active',
    '{
      "price_jpy": 9800,
      "currency": "JPY",
      "billing_type": "one_time",
      "plan_family": "audit",
      "plan_kind": "paid_trial",
      "question_limit": 100,
      "model_limit": 2,
      "run_mode": "one_time",
      "cadence": "once",
      "recommendations_enabled": false,
      "customer_recommendations_visible": false,
      "notes": "Trial audit: 100 AI questions, 2 models, one-time diagnostic, no customer-facing recommendations."
    }'::jsonb,
    now(),
    now()
  ),
  (
    'monitor_basic',
    'Monitor Basic',
    'active',
    '{
      "price_jpy": 12800,
      "currency": "JPY",
      "billing_type": "monthly",
      "plan_family": "monitor",
      "plan_kind": "subscription",
      "question_limit": 50,
      "model_limit": 2,
      "run_mode": "daily_all_questions",
      "cadence": "daily",
      "recommendations_enabled": false,
      "customer_recommendations_visible": false,
      "notes": "Monitor Basic: 50 AI questions, 2 models, daily all-question monitoring, no customer-facing recommendations."
    }'::jsonb,
    now(),
    now()
  ),
  (
    'monitor_standard',
    'Monitor Standard',
    'active',
    '{
      "price_jpy": 29800,
      "currency": "JPY",
      "billing_type": "monthly",
      "plan_family": "monitor",
      "plan_kind": "subscription",
      "question_limit": 100,
      "model_limit": 2,
      "run_mode": "daily_all_questions",
      "cadence": "daily",
      "recommendations_enabled": true,
      "customer_recommendations_visible": true,
      "notes": "Monitor Standard: 100 AI questions, 2 models, daily all-question monitoring, customer-facing recommendations enabled."
    }'::jsonb,
    now(),
    now()
  ),
  (
    'monitor_growth',
    'Monitor Growth',
    'active',
    '{
      "price_jpy": 69800,
      "currency": "JPY",
      "billing_type": "monthly",
      "plan_family": "monitor",
      "plan_kind": "subscription",
      "question_limit": 200,
      "model_limit": 3,
      "run_mode": "daily_all_questions",
      "cadence": "daily",
      "recommendations_enabled": true,
      "customer_recommendations_visible": true,
      "notes": "Monitor Growth: 200 AI questions, 3 models, daily all-question monitoring, customer-facing recommendations enabled."
    }'::jsonb,
    now(),
    now()
  )
on conflict (plan_code) do update
set
  display_name = excluded.display_name,
  status = excluded.status,
  config = excluded.config,
  updated_at = now();
