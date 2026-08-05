# Recora Admin P0 Database Authority Map

## 現在の正本

| 対象 | 正本 |
|---|---|
| M00〜M04 | 実装済みmigration、各unit spec、verifier |
| M05〜M23 | [`recora_admin_p0_m05_m23_implementation_authority_v1.md`](./recora_admin_p0_m05_m23_implementation_authority_v1.md) |
| M05〜M23 machine-readable sequence | [`recora_admin_p0_m05_m23_authority_manifest_v1.json`](./recora_admin_p0_m05_m23_authority_manifest_v1.json) |
| v1.3 bundle | M00〜M04のHash固定基準、および新正本に反しない物理設計の参考 |

## v1.3 bundleの扱い

次のファイルはM00のHash固定対象であるため、上書きしない。

- `recora_admin_p0_database_bundle_manifest_v1_3.json`
- `recora_admin_p0_database_schema_spec_v1_3.md`
- `recora_admin_p0_migration_plan_v1_3.md`
- `recora_admin_p0_physical_schema_manifest_v1_3.json`
- `recora_admin_p0_database_design_validation_v1_3.md`

`M05`〜`M23`について内容が衝突する場合は、新しいM05〜M23正本を優先する。

## 実装状態

```text
M00〜M04
= implemented on master

M05〜M23
= revised authority accepted
  implementation not started under the revised authority
```

旧Issue #164のM05 scopeは、新正本へ差し替えるまで実行しない。
