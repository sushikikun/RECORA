# Recora Admin P0 M03 Static Catalogs

- Package: `RECORA-ADMIN-P0-M03-STATIC-CATALOGS`
- Version: `1.0`
- Implementation baseline: `dc5cad4e3a2946b6993716b1d66bc0ef5c5ed8f3`
- Canonical manifest SHA-256: `f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a`
- Physical manifest SHA-256: `d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a`
- M03 semantic SHA-256: `ae383267eb2758a5cf8e867ee198bcf00686a16375c92eb179f81858b553cfab`

## Scope

M03 seeds only the fixed P0 role, capability, role-capability, and notification-category catalogs. It does not create admin or Auth users, role assignments, scope assignments, notification destinations or subscriptions, UI, routes, server actions, RPCs, or M04 objects.

The complete machine-readable authority is [recora_admin_p0_m03_static_catalogs_manifest_v1.json](recora_admin_p0_m03_static_catalogs_manifest_v1.json). Its semantic payload is UTF-8 compact JSON with exactly these top-level keys, in order:

`package_id`, `version`, `implementation_baseline`, `canonical_manifest_sha256`, `physical_manifest_sha256`, `roles`, `capabilities`, `role_capabilities`, `notification_categories`.

## Exact Counts

| Catalog | Count |
|---|---:|
| Roles | 8 |
| Capabilities | 64 |
| Role-capability mappings | 185 |
| Notification categories | 8 |

## Roles

| Role code | Display name | Description | Allowed scope | Deterministic UUID |
|---|---|---|---|---|
| `platform_admin` | プラットフォーム管理者 | 全領域、管理者・権限管理、最終的な運用管理 | `global` | `83000000-0000-4000-8000-000000000001` |
| `customer_operator` | 顧客運用担当 | 顧客、契約、プロジェクト、初期設定、問い合わせ | `global/customer/project` | `83000000-0000-4000-8000-000000000002` |
| `measurement_operator` | 測定運用担当 | 正式測定、追加検証、バッチ、再試行、安全停止 | `global/customer/project` | `83000000-0000-4000-8000-000000000003` |
| `quality_reviewer` | 品質レビュー担当 | 品質例外、finding、再処理、品質decision | `global/customer/project` | `83000000-0000-4000-8000-000000000004` |
| `publication_operator` | 公開運用担当 | 候補確認、公開処理、復元、公開停止・再開 | `global/customer/project` | `83000000-0000-4000-8000-000000000005` |
| `system_operator` | システム運用担当 | 障害、システム状態、AIモデル、日次自動処理 | `global` | `83000000-0000-4000-8000-000000000006` |
| `cost_analyst` | 原価閲覧担当 | 利用量・内部変動原価・CSV | `global/customer/project` | `83000000-0000-4000-8000-000000000007` |
| `auditor` | 監査担当 | 監査ログ、変更履歴、業務状態の読み取り監査 | `global/customer/project` | `83000000-0000-4000-8000-000000000008` |

`platform_admin` receives all 64 explicitly listed capabilities. No wildcard capability is used.

## Capability Rules

Capability rows contain deterministic UUID, `capability_code`, `domain_code`, and `sensitivity`, all exactly as represented in the manifest.

### Role Map Counts

- `platform_admin`: 64
- `customer_operator`: 21
- `measurement_operator`: 16
- `quality_reviewer`: 12
- `publication_operator`: 13
- `system_operator`: 24
- `cost_analyst`: 7
- `auditor`: 28

### Domain Distribution

- `operations_home`: 1
- `customer_management`: 18
- `measurement_management`: 6
- `quality_exception_review`: 5
- `publication_management`: 6
- `operations_incident_audit`: 12
- `settings`: 13
- `usage_cost`: 3

### Sensitivity Distribution

- `W1`: 39
- `W2`: 10
- `W3`: 15

The 10 `W2` and 15 `W3` capability codes are fixed by the Issue #151 formal input. All remaining 39 capabilities are `W1`. The `auditor` map contains no write capability. `system_operator` contains no customer, contract, or usage-cost write capability.

## Notification Categories

| Category code | Display name | Deterministic UUID |
|---|---|---|
| `critical_incident` | 重大障害 | `83000000-0000-4000-8200-000000000001` |
| `automation_failure` | 日次自動処理失敗 | `83000000-0000-4000-8200-000000000002` |
| `publication_failure` | 公開失敗 | `83000000-0000-4000-8200-000000000003` |
| `quality_attention` | 品質要確認 | `83000000-0000-4000-8200-000000000004` |
| `customer_inquiry` | 顧客問い合わせ | `83000000-0000-4000-8200-000000000005` |
| `cost_attention` | 原価要確認 | `83000000-0000-4000-8200-000000000006` |
| `admin_security` | 管理者セキュリティ | `83000000-0000-4000-8200-000000000007` |
| `daily_summary` | 日次サマリー | `83000000-0000-4000-8200-000000000008` |

`critical_incident` and `admin_security` are reserved for M05 active-subscription rules. M03 creates no destination or subscription table or row.

## Migration Contract

The M03 migration requires the M00 schema pin and the M02 role/capability/map tables. It creates `recora_private.admin_notification_categories` with fixed identifiers, RLS, direct-access revocations, and update/delete rejection through the existing M02 catalog-mutation trigger helper.

For all four catalogs:

1. All-empty state seeds the exact deterministic rows.
2. Fully matching state is a replay no-op.
3. Partial state, count mismatch, unknown/extra row, UUID mismatch, metadata mismatch, or map mismatch fails closed.
4. Post-checks compare all catalog rows and map edges against the embedded formal data.
5. The migration, manifest, and verifier share semantic digest `ae383267eb2758a5cf8e867ee198bcf00686a16375c92eb179f81858b553cfab`.

## Security Contract

- RLS is enabled on `recora_private.admin_notification_categories`.
- `PUBLIC`, `anon`, `authenticated`, and `service_role` retain no schema/table direct access.
- Role, capability, and notification-category update/delete are rejected.
- M03 adds no `SECURITY DEFINER` helper.
- Existing M00/M01/M02 receipt, MFA, RBAC, scope, audit, append-only, and private-helper contracts remain intact.

## Verification Contract

The M03 verifier checks manifest schema and digest, static source invariants, exact database rows, protected-role ACLs, immutable-catalog rejection, replay behavior, and the absence of M03-forbidden account/assignment/destination/subscription objects. The M02 verifier accepts either the pre-M03 empty catalog or the post-M03 exact catalog, and rejects partial or divergent catalog states.
