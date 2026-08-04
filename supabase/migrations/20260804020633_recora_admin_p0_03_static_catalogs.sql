-- Recora Admin P0 / M03 static role, capability, and notification catalogs.
--
-- M03 seeds only the approved immutable static catalog. It does not create
-- admin accounts, role/scope assignments, notification destinations, or UI/API
-- surfaces.

set search_path = public, extensions;

do $m03_inventory$
begin
  if not exists (
    select 1
    from recora_private.admin_p0_schema_versions
    where schema_version = 'recora_admin_p0_design_v1_3'
      and canonical_manifest_sha256 = 'f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a'
      and repository_baseline_commit = '2c2a6fba70b75e858abc71a7447840bf32f3507d'
      and migration_set_digest = 'd6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a'
  ) then
    raise exception 'Recora Admin P0 M03 failed: approved M00 schema pin is missing';
  end if;

  if to_regclass('recora_operator.admin_roles') is null
    or to_regclass('recora_operator.admin_capabilities') is null
    or to_regclass('recora_operator.admin_role_capabilities') is null then
    raise exception 'Recora Admin P0 M03 failed: required M02 catalog tables are missing';
  end if;
end;
$m03_inventory$;

create table if not exists recora_private.admin_notification_categories (
  id uuid primary key,
  category_code text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint admin_notification_categories_code_check
    check (category_code ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint admin_notification_categories_name_check
    check (btrim(display_name) <> ''),
  constraint admin_notification_categories_identifier_check
    check (octet_length(category_code) <= 63)
);

alter table recora_private.admin_notification_categories enable row level security;

revoke all on schema recora_private from public, anon, authenticated, service_role;
revoke all on table recora_private.admin_notification_categories
from public, anon, authenticated, service_role;

do $m03_catalog$
declare
  m03_catalog_semantic_sha256 constant text := 'ae383267eb2758a5cf8e867ee198bcf00686a16375c92eb179f81858b553cfab';
  expected_roles jsonb := $m03_roles$[{"id":"83000000-0000-4000-8000-000000000001","role_code":"platform_admin","display_name":"プラットフォーム管理者","description":"全領域、管理者・権限管理、最終的な運用管理","allowed_scope_types":["global"]},{"id":"83000000-0000-4000-8000-000000000002","role_code":"customer_operator","display_name":"顧客運用担当","description":"顧客、契約、プロジェクト、初期設定、問い合わせ","allowed_scope_types":["global","customer","project"]},{"id":"83000000-0000-4000-8000-000000000003","role_code":"measurement_operator","display_name":"測定運用担当","description":"正式測定、追加検証、バッチ、再試行、安全停止","allowed_scope_types":["global","customer","project"]},{"id":"83000000-0000-4000-8000-000000000004","role_code":"quality_reviewer","display_name":"品質レビュー担当","description":"品質例外、finding、再処理、品質decision","allowed_scope_types":["global","customer","project"]},{"id":"83000000-0000-4000-8000-000000000005","role_code":"publication_operator","display_name":"公開運用担当","description":"候補確認、公開処理、復元、公開停止・再開","allowed_scope_types":["global","customer","project"]},{"id":"83000000-0000-4000-8000-000000000006","role_code":"system_operator","display_name":"システム運用担当","description":"障害、システム状態、AIモデル、日次自動処理","allowed_scope_types":["global"]},{"id":"83000000-0000-4000-8000-000000000007","role_code":"cost_analyst","display_name":"原価閲覧担当","description":"利用量・内部変動原価・CSV","allowed_scope_types":["global","customer","project"]},{"id":"83000000-0000-4000-8000-000000000008","role_code":"auditor","display_name":"監査担当","description":"監査ログ、変更履歴、業務状態の読み取り監査","allowed_scope_types":["global","customer","project"]}]$m03_roles$::jsonb;
  expected_capabilities jsonb := $m03_capabilities$[{"id":"83000000-0000-4000-8100-000000000001","capability_code":"admin.home.read","domain_code":"operations_home","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000002","capability_code":"customer.summary.read","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000003","capability_code":"customer.detail.read","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000004","capability_code":"customer.sensitive.read","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000005","capability_code":"customer.create","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000006","capability_code":"customer.manage","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000007","capability_code":"customer.access.manage","domain_code":"customer_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000008","capability_code":"customer_user.manage","domain_code":"customer_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000009","capability_code":"contract.read","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000010","capability_code":"contract.manage","domain_code":"customer_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000011","capability_code":"project.read","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000012","capability_code":"project.manage","domain_code":"customer_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000013","capability_code":"project.configuration.manage","domain_code":"customer_management","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000014","capability_code":"project.setup.retry","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000015","capability_code":"project.setup.correct","domain_code":"customer_management","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000016","capability_code":"project.automation.manage","domain_code":"customer_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000017","capability_code":"inquiry.read","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000018","capability_code":"inquiry.internal_note.read","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000019","capability_code":"inquiry.manage","domain_code":"customer_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000020","capability_code":"measurement.read","domain_code":"measurement_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000021","capability_code":"measurement.formal.trigger","domain_code":"measurement_management","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000022","capability_code":"measurement.validation.create","domain_code":"measurement_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000023","capability_code":"measurement.batch.manage","domain_code":"measurement_management","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000024","capability_code":"measurement.batch.stop","domain_code":"measurement_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000025","capability_code":"measurement.retry","domain_code":"measurement_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000026","capability_code":"quality.read","domain_code":"quality_exception_review","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000027","capability_code":"quality.payload.read","domain_code":"quality_exception_review","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000028","capability_code":"quality.assign","domain_code":"quality_exception_review","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000029","capability_code":"quality.reprocess","domain_code":"quality_exception_review","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000030","capability_code":"quality.decide","domain_code":"quality_exception_review","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000031","capability_code":"publication.read","domain_code":"publication_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000032","capability_code":"publication.payload.read","domain_code":"publication_management","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000033","capability_code":"publication.candidate.manage","domain_code":"publication_management","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000034","capability_code":"publication.publish_ready","domain_code":"publication_management","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000035","capability_code":"publication.restore","domain_code":"publication_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000036","capability_code":"publication.control","domain_code":"publication_management","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000037","capability_code":"incident.read.scoped","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000038","capability_code":"incident.read.global","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000039","capability_code":"incident.sensitive.read","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000040","capability_code":"incident.manage","domain_code":"operations_incident_audit","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000041","capability_code":"incident.recovery.manage","domain_code":"operations_incident_audit","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000042","capability_code":"incident.resolve","domain_code":"operations_incident_audit","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000043","capability_code":"system_status.read","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000044","capability_code":"system_health_check.run","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000045","capability_code":"system_event.read","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000046","capability_code":"notification.read","domain_code":"settings","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000047","capability_code":"notification.manage","domain_code":"settings","sensitivity":"W2"},{"id":"83000000-0000-4000-8100-000000000048","capability_code":"daily_automation.read","domain_code":"settings","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000049","capability_code":"daily_automation.manage","domain_code":"settings","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000050","capability_code":"ai_model_control.read","domain_code":"settings","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000051","capability_code":"ai_model_control.manage","domain_code":"settings","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000052","capability_code":"usage_cost.read","domain_code":"usage_cost","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000053","capability_code":"usage_cost.export","domain_code":"usage_cost","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000054","capability_code":"pricing.read","domain_code":"usage_cost","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000055","capability_code":"plan.read","domain_code":"settings","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000056","capability_code":"plan.manage","domain_code":"settings","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000057","capability_code":"rule_version.read","domain_code":"settings","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000058","capability_code":"admin_directory.read","domain_code":"settings","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000059","capability_code":"admin_directory.manage","domain_code":"settings","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000060","capability_code":"admin_access.manage","domain_code":"settings","sensitivity":"W3"},{"id":"83000000-0000-4000-8100-000000000061","capability_code":"audit.read.scoped","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000062","capability_code":"audit.read.global","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000063","capability_code":"audit.detail.read","domain_code":"operations_incident_audit","sensitivity":"W1"},{"id":"83000000-0000-4000-8100-000000000064","capability_code":"settings.change_history.read","domain_code":"settings","sensitivity":"W1"}]$m03_capabilities$::jsonb;
  expected_role_capabilities jsonb := $m03_role_capabilities$[{"role_code":"platform_admin","capability_code":"admin.home.read"},{"role_code":"platform_admin","capability_code":"customer.summary.read"},{"role_code":"platform_admin","capability_code":"customer.detail.read"},{"role_code":"platform_admin","capability_code":"customer.sensitive.read"},{"role_code":"platform_admin","capability_code":"customer.create"},{"role_code":"platform_admin","capability_code":"customer.manage"},{"role_code":"platform_admin","capability_code":"customer.access.manage"},{"role_code":"platform_admin","capability_code":"customer_user.manage"},{"role_code":"platform_admin","capability_code":"contract.read"},{"role_code":"platform_admin","capability_code":"contract.manage"},{"role_code":"platform_admin","capability_code":"project.read"},{"role_code":"platform_admin","capability_code":"project.manage"},{"role_code":"platform_admin","capability_code":"project.configuration.manage"},{"role_code":"platform_admin","capability_code":"project.setup.retry"},{"role_code":"platform_admin","capability_code":"project.setup.correct"},{"role_code":"platform_admin","capability_code":"project.automation.manage"},{"role_code":"platform_admin","capability_code":"inquiry.read"},{"role_code":"platform_admin","capability_code":"inquiry.internal_note.read"},{"role_code":"platform_admin","capability_code":"inquiry.manage"},{"role_code":"platform_admin","capability_code":"measurement.read"},{"role_code":"platform_admin","capability_code":"measurement.formal.trigger"},{"role_code":"platform_admin","capability_code":"measurement.validation.create"},{"role_code":"platform_admin","capability_code":"measurement.batch.manage"},{"role_code":"platform_admin","capability_code":"measurement.batch.stop"},{"role_code":"platform_admin","capability_code":"measurement.retry"},{"role_code":"platform_admin","capability_code":"quality.read"},{"role_code":"platform_admin","capability_code":"quality.payload.read"},{"role_code":"platform_admin","capability_code":"quality.assign"},{"role_code":"platform_admin","capability_code":"quality.reprocess"},{"role_code":"platform_admin","capability_code":"quality.decide"},{"role_code":"platform_admin","capability_code":"publication.read"},{"role_code":"platform_admin","capability_code":"publication.payload.read"},{"role_code":"platform_admin","capability_code":"publication.candidate.manage"},{"role_code":"platform_admin","capability_code":"publication.publish_ready"},{"role_code":"platform_admin","capability_code":"publication.restore"},{"role_code":"platform_admin","capability_code":"publication.control"},{"role_code":"platform_admin","capability_code":"incident.read.scoped"},{"role_code":"platform_admin","capability_code":"incident.read.global"},{"role_code":"platform_admin","capability_code":"incident.sensitive.read"},{"role_code":"platform_admin","capability_code":"incident.manage"},{"role_code":"platform_admin","capability_code":"incident.recovery.manage"},{"role_code":"platform_admin","capability_code":"incident.resolve"},{"role_code":"platform_admin","capability_code":"system_status.read"},{"role_code":"platform_admin","capability_code":"system_health_check.run"},{"role_code":"platform_admin","capability_code":"system_event.read"},{"role_code":"platform_admin","capability_code":"notification.read"},{"role_code":"platform_admin","capability_code":"notification.manage"},{"role_code":"platform_admin","capability_code":"daily_automation.read"},{"role_code":"platform_admin","capability_code":"daily_automation.manage"},{"role_code":"platform_admin","capability_code":"ai_model_control.read"},{"role_code":"platform_admin","capability_code":"ai_model_control.manage"},{"role_code":"platform_admin","capability_code":"usage_cost.read"},{"role_code":"platform_admin","capability_code":"usage_cost.export"},{"role_code":"platform_admin","capability_code":"pricing.read"},{"role_code":"platform_admin","capability_code":"plan.read"},{"role_code":"platform_admin","capability_code":"plan.manage"},{"role_code":"platform_admin","capability_code":"rule_version.read"},{"role_code":"platform_admin","capability_code":"admin_directory.read"},{"role_code":"platform_admin","capability_code":"admin_directory.manage"},{"role_code":"platform_admin","capability_code":"admin_access.manage"},{"role_code":"platform_admin","capability_code":"audit.read.scoped"},{"role_code":"platform_admin","capability_code":"audit.read.global"},{"role_code":"platform_admin","capability_code":"audit.detail.read"},{"role_code":"platform_admin","capability_code":"settings.change_history.read"},{"role_code":"customer_operator","capability_code":"admin.home.read"},{"role_code":"customer_operator","capability_code":"customer.summary.read"},{"role_code":"customer_operator","capability_code":"customer.detail.read"},{"role_code":"customer_operator","capability_code":"customer.sensitive.read"},{"role_code":"customer_operator","capability_code":"customer.create"},{"role_code":"customer_operator","capability_code":"customer.manage"},{"role_code":"customer_operator","capability_code":"customer.access.manage"},{"role_code":"customer_operator","capability_code":"customer_user.manage"},{"role_code":"customer_operator","capability_code":"contract.read"},{"role_code":"customer_operator","capability_code":"contract.manage"},{"role_code":"customer_operator","capability_code":"project.read"},{"role_code":"customer_operator","capability_code":"project.manage"},{"role_code":"customer_operator","capability_code":"project.configuration.manage"},{"role_code":"customer_operator","capability_code":"project.setup.retry"},{"role_code":"customer_operator","capability_code":"project.setup.correct"},{"role_code":"customer_operator","capability_code":"inquiry.read"},{"role_code":"customer_operator","capability_code":"inquiry.internal_note.read"},{"role_code":"customer_operator","capability_code":"inquiry.manage"},{"role_code":"customer_operator","capability_code":"measurement.read"},{"role_code":"customer_operator","capability_code":"publication.read"},{"role_code":"customer_operator","capability_code":"incident.read.scoped"},{"role_code":"measurement_operator","capability_code":"admin.home.read"},{"role_code":"measurement_operator","capability_code":"customer.summary.read"},{"role_code":"measurement_operator","capability_code":"project.read"},{"role_code":"measurement_operator","capability_code":"measurement.read"},{"role_code":"measurement_operator","capability_code":"measurement.formal.trigger"},{"role_code":"measurement_operator","capability_code":"measurement.validation.create"},{"role_code":"measurement_operator","capability_code":"measurement.batch.manage"},{"role_code":"measurement_operator","capability_code":"measurement.batch.stop"},{"role_code":"measurement_operator","capability_code":"measurement.retry"},{"role_code":"measurement_operator","capability_code":"project.automation.manage"},{"role_code":"measurement_operator","capability_code":"quality.read"},{"role_code":"measurement_operator","capability_code":"publication.read"},{"role_code":"measurement_operator","capability_code":"incident.read.scoped"},{"role_code":"measurement_operator","capability_code":"daily_automation.read"},{"role_code":"measurement_operator","capability_code":"ai_model_control.read"},{"role_code":"measurement_operator","capability_code":"rule_version.read"},{"role_code":"quality_reviewer","capability_code":"admin.home.read"},{"role_code":"quality_reviewer","capability_code":"customer.summary.read"},{"role_code":"quality_reviewer","capability_code":"project.read"},{"role_code":"quality_reviewer","capability_code":"measurement.read"},{"role_code":"quality_reviewer","capability_code":"quality.read"},{"role_code":"quality_reviewer","capability_code":"quality.payload.read"},{"role_code":"quality_reviewer","capability_code":"quality.assign"},{"role_code":"quality_reviewer","capability_code":"quality.reprocess"},{"role_code":"quality_reviewer","capability_code":"quality.decide"},{"role_code":"quality_reviewer","capability_code":"publication.read"},{"role_code":"quality_reviewer","capability_code":"incident.read.scoped"},{"role_code":"quality_reviewer","capability_code":"rule_version.read"},{"role_code":"publication_operator","capability_code":"admin.home.read"},{"role_code":"publication_operator","capability_code":"customer.summary.read"},{"role_code":"publication_operator","capability_code":"project.read"},{"role_code":"publication_operator","capability_code":"measurement.read"},{"role_code":"publication_operator","capability_code":"quality.read"},{"role_code":"publication_operator","capability_code":"publication.read"},{"role_code":"publication_operator","capability_code":"publication.payload.read"},{"role_code":"publication_operator","capability_code":"publication.candidate.manage"},{"role_code":"publication_operator","capability_code":"publication.publish_ready"},{"role_code":"publication_operator","capability_code":"publication.restore"},{"role_code":"publication_operator","capability_code":"publication.control"},{"role_code":"publication_operator","capability_code":"incident.read.scoped"},{"role_code":"publication_operator","capability_code":"rule_version.read"},{"role_code":"system_operator","capability_code":"admin.home.read"},{"role_code":"system_operator","capability_code":"customer.summary.read"},{"role_code":"system_operator","capability_code":"project.read"},{"role_code":"system_operator","capability_code":"measurement.read"},{"role_code":"system_operator","capability_code":"quality.read"},{"role_code":"system_operator","capability_code":"publication.read"},{"role_code":"system_operator","capability_code":"incident.read.scoped"},{"role_code":"system_operator","capability_code":"incident.read.global"},{"role_code":"system_operator","capability_code":"incident.sensitive.read"},{"role_code":"system_operator","capability_code":"incident.manage"},{"role_code":"system_operator","capability_code":"incident.recovery.manage"},{"role_code":"system_operator","capability_code":"incident.resolve"},{"role_code":"system_operator","capability_code":"system_status.read"},{"role_code":"system_operator","capability_code":"system_health_check.run"},{"role_code":"system_operator","capability_code":"system_event.read"},{"role_code":"system_operator","capability_code":"notification.read"},{"role_code":"system_operator","capability_code":"notification.manage"},{"role_code":"system_operator","capability_code":"daily_automation.read"},{"role_code":"system_operator","capability_code":"daily_automation.manage"},{"role_code":"system_operator","capability_code":"ai_model_control.read"},{"role_code":"system_operator","capability_code":"ai_model_control.manage"},{"role_code":"system_operator","capability_code":"plan.read"},{"role_code":"system_operator","capability_code":"rule_version.read"},{"role_code":"system_operator","capability_code":"settings.change_history.read"},{"role_code":"cost_analyst","capability_code":"admin.home.read"},{"role_code":"cost_analyst","capability_code":"customer.summary.read"},{"role_code":"cost_analyst","capability_code":"project.read"},{"role_code":"cost_analyst","capability_code":"usage_cost.read"},{"role_code":"cost_analyst","capability_code":"usage_cost.export"},{"role_code":"cost_analyst","capability_code":"pricing.read"},{"role_code":"cost_analyst","capability_code":"plan.read"},{"role_code":"auditor","capability_code":"admin.home.read"},{"role_code":"auditor","capability_code":"customer.summary.read"},{"role_code":"auditor","capability_code":"customer.detail.read"},{"role_code":"auditor","capability_code":"customer.sensitive.read"},{"role_code":"auditor","capability_code":"contract.read"},{"role_code":"auditor","capability_code":"project.read"},{"role_code":"auditor","capability_code":"inquiry.read"},{"role_code":"auditor","capability_code":"inquiry.internal_note.read"},{"role_code":"auditor","capability_code":"measurement.read"},{"role_code":"auditor","capability_code":"quality.read"},{"role_code":"auditor","capability_code":"quality.payload.read"},{"role_code":"auditor","capability_code":"publication.read"},{"role_code":"auditor","capability_code":"publication.payload.read"},{"role_code":"auditor","capability_code":"incident.read.scoped"},{"role_code":"auditor","capability_code":"incident.read.global"},{"role_code":"auditor","capability_code":"incident.sensitive.read"},{"role_code":"auditor","capability_code":"system_status.read"},{"role_code":"auditor","capability_code":"system_event.read"},{"role_code":"auditor","capability_code":"notification.read"},{"role_code":"auditor","capability_code":"daily_automation.read"},{"role_code":"auditor","capability_code":"ai_model_control.read"},{"role_code":"auditor","capability_code":"plan.read"},{"role_code":"auditor","capability_code":"rule_version.read"},{"role_code":"auditor","capability_code":"admin_directory.read"},{"role_code":"auditor","capability_code":"audit.read.scoped"},{"role_code":"auditor","capability_code":"audit.read.global"},{"role_code":"auditor","capability_code":"audit.detail.read"},{"role_code":"auditor","capability_code":"settings.change_history.read"}]$m03_role_capabilities$::jsonb;
  expected_notification_categories jsonb := $m03_notification_categories$[{"id":"83000000-0000-4000-8200-000000000001","category_code":"critical_incident","display_name":"重大障害"},{"id":"83000000-0000-4000-8200-000000000002","category_code":"automation_failure","display_name":"日次自動処理失敗"},{"id":"83000000-0000-4000-8200-000000000003","category_code":"publication_failure","display_name":"公開失敗"},{"id":"83000000-0000-4000-8200-000000000004","category_code":"quality_attention","display_name":"品質要確認"},{"id":"83000000-0000-4000-8200-000000000005","category_code":"customer_inquiry","display_name":"顧客問い合わせ"},{"id":"83000000-0000-4000-8200-000000000006","category_code":"cost_attention","display_name":"原価要確認"},{"id":"83000000-0000-4000-8200-000000000007","category_code":"admin_security","display_name":"管理者セキュリティ"},{"id":"83000000-0000-4000-8200-000000000008","category_code":"daily_summary","display_name":"日次サマリー"}]$m03_notification_categories$::jsonb;
  role_count integer;
  capability_count integer;
  role_capability_count integer;
  notification_category_count integer;
begin
  if m03_catalog_semantic_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Recora Admin P0 M03 failed: catalog semantic digest is malformed';
  end if;

  select count(*) into role_count from recora_operator.admin_roles;
  select count(*) into capability_count from recora_operator.admin_capabilities;
  select count(*) into role_capability_count from recora_operator.admin_role_capabilities;
  select count(*) into notification_category_count from recora_private.admin_notification_categories;

  if role_count = 0
    and capability_count = 0
    and role_capability_count = 0
    and notification_category_count = 0 then
    insert into recora_operator.admin_roles (
      id,
      role_code,
      display_name,
      description,
      is_system_defined,
      is_editable
    )
    select
      expected.id,
      expected.role_code,
      expected.display_name,
      expected.description,
      true,
      false
    from jsonb_to_recordset(expected_roles) as expected(
      id uuid,
      role_code text,
      display_name text,
      description text,
      allowed_scope_types jsonb
    );

    insert into recora_operator.admin_capabilities (
      id,
      capability_code,
      domain_code,
      sensitivity
    )
    select
      expected.id,
      expected.capability_code,
      expected.domain_code,
      expected.sensitivity
    from jsonb_to_recordset(expected_capabilities) as expected(
      id uuid,
      capability_code text,
      domain_code text,
      sensitivity text
    );

    insert into recora_operator.admin_role_capabilities (
      role_id,
      capability_id
    )
    select
      role_row.id,
      capability_row.id
    from jsonb_to_recordset(expected_role_capabilities) as expected(
      role_code text,
      capability_code text
    )
    join recora_operator.admin_roles role_row
      on role_row.role_code = expected.role_code
    join recora_operator.admin_capabilities capability_row
      on capability_row.capability_code = expected.capability_code;

    insert into recora_private.admin_notification_categories (
      id,
      category_code,
      display_name
    )
    select
      expected.id,
      expected.category_code,
      expected.display_name
    from jsonb_to_recordset(expected_notification_categories) as expected(
      id uuid,
      category_code text,
      display_name text
    );
  elsif role_count <> jsonb_array_length(expected_roles)
    or capability_count <> jsonb_array_length(expected_capabilities)
    or role_capability_count <> jsonb_array_length(expected_role_capabilities)
    or notification_category_count <> jsonb_array_length(expected_notification_categories) then
    raise exception 'Recora Admin P0 M03 failed: partial or unexpected catalog inventory';
  end if;

  if exists (
    (
      select id, role_code, display_name, description, is_system_defined, is_editable
      from recora_operator.admin_roles
    )
    except
    (
      select id, role_code, display_name, description, true, false
      from jsonb_to_recordset(expected_roles) as expected(
        id uuid,
        role_code text,
        display_name text,
        description text,
        allowed_scope_types jsonb
      )
    )
  )
  or exists (
    (
      select id, role_code, display_name, description, true, false
      from jsonb_to_recordset(expected_roles) as expected(
        id uuid,
        role_code text,
        display_name text,
        description text,
        allowed_scope_types jsonb
      )
    )
    except
    (
      select id, role_code, display_name, description, is_system_defined, is_editable
      from recora_operator.admin_roles
    )
  )
  or exists (
    (
      select id, capability_code, domain_code, sensitivity
      from recora_operator.admin_capabilities
    )
    except
    (
      select id, capability_code, domain_code, sensitivity
      from jsonb_to_recordset(expected_capabilities) as expected(
        id uuid,
        capability_code text,
        domain_code text,
        sensitivity text
      )
    )
  )
  or exists (
    (
      select id, capability_code, domain_code, sensitivity
      from jsonb_to_recordset(expected_capabilities) as expected(
        id uuid,
        capability_code text,
        domain_code text,
        sensitivity text
      )
    )
    except
    (
      select id, capability_code, domain_code, sensitivity
      from recora_operator.admin_capabilities
    )
  )
  or exists (
    (
      select role_row.role_code, capability_row.capability_code
      from recora_operator.admin_role_capabilities map_row
      join recora_operator.admin_roles role_row on role_row.id = map_row.role_id
      join recora_operator.admin_capabilities capability_row on capability_row.id = map_row.capability_id
    )
    except
    (
      select role_code, capability_code
      from jsonb_to_recordset(expected_role_capabilities) as expected(
        role_code text,
        capability_code text
      )
    )
  )
  or exists (
    (
      select role_code, capability_code
      from jsonb_to_recordset(expected_role_capabilities) as expected(
        role_code text,
        capability_code text
      )
    )
    except
    (
      select role_row.role_code, capability_row.capability_code
      from recora_operator.admin_role_capabilities map_row
      join recora_operator.admin_roles role_row on role_row.id = map_row.role_id
      join recora_operator.admin_capabilities capability_row on capability_row.id = map_row.capability_id
    )
  )
  or exists (
    (
      select id, category_code, display_name
      from recora_private.admin_notification_categories
    )
    except
    (
      select id, category_code, display_name
      from jsonb_to_recordset(expected_notification_categories) as expected(
        id uuid,
        category_code text,
        display_name text
      )
    )
  )
  or exists (
    (
      select id, category_code, display_name
      from jsonb_to_recordset(expected_notification_categories) as expected(
        id uuid,
        category_code text,
        display_name text
      )
    )
    except
    (
      select id, category_code, display_name
      from recora_private.admin_notification_categories
    )
  ) then
    raise exception 'Recora Admin P0 M03 failed: catalog contents differ from the approved static catalog';
  end if;

  if (select count(*) from recora_operator.admin_roles) <> jsonb_array_length(expected_roles)
    or (select count(*) from recora_operator.admin_capabilities) <> jsonb_array_length(expected_capabilities)
    or (select count(*) from recora_operator.admin_role_capabilities) <> jsonb_array_length(expected_role_capabilities)
    or (select count(*) from recora_private.admin_notification_categories) <> jsonb_array_length(expected_notification_categories) then
    raise exception 'Recora Admin P0 M03 failed: catalog post-check count mismatch';
  end if;
end;
$m03_catalog$;

drop trigger if exists admin_notification_categories_prevent_mutation
on recora_private.admin_notification_categories;
create trigger admin_notification_categories_prevent_mutation
before update or delete on recora_private.admin_notification_categories
for each row execute function recora_operator.admin_p0_prevent_catalog_mutation();

do $m03_verify$
begin
  if not exists (
    select 1
    from pg_class relation_row
    where relation_row.oid = 'recora_private.admin_notification_categories'::regclass
      and relation_row.relrowsecurity is true
  ) then
    raise exception 'Recora Admin P0 M03 verification failed: notification category RLS is missing';
  end if;

  if has_table_privilege('anon', 'recora_private.admin_notification_categories', 'SELECT')
    or has_table_privilege('authenticated', 'recora_private.admin_notification_categories', 'SELECT')
    or has_table_privilege('service_role', 'recora_private.admin_notification_categories', 'SELECT')
    or has_table_privilege('service_role', 'recora_private.admin_notification_categories', 'INSERT')
    or has_table_privilege('service_role', 'recora_private.admin_notification_categories', 'UPDATE')
    or has_table_privilege('service_role', 'recora_private.admin_notification_categories', 'DELETE') then
    raise exception 'Recora Admin P0 M03 verification failed: protected notification category privilege remains';
  end if;

  if exists (
    select 1
    from pg_proc function_row
    join pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname in ('recora_operator', 'recora_private')
      and function_row.proname like 'admin_p0_%'
      and function_row.prosecdef is true
  ) then
    raise exception 'Recora Admin P0 M03 verification failed: private helper uses elevated execution';
  end if;
end;
$m03_verify$;
