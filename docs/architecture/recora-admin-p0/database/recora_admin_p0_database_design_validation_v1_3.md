# レコラ管理画面 P0 DB設計 構造検証レポート v1.3

**日付:** 2026-08-02
**判定:** PASS（最新masterへの再固定後・実装前の静的設計検証）

## 1. v1.3で修正した内容

### 1.1 Repository baseline

`master`が旧baselineから1commit進み、P4-B account accessが追加されたため、設計baselineを次へ更新した。

```text
2c2a6fba70b75e858abc71a7447840bf32f3507d
```

M00を旧commitのまま実行する案は中止した。

### 1.2 P4-B actor evidence

既存baselineへ次を追加した。

- `p4_source_kind = customer_session`
- `p4_command_receipts.customer_auth_user_id`
- `p4_command_receipt_actor_shape`
- invitation/membership/customer-access RPC boundary

M00は存在確認だけでなく、actor shape constraint、function security、grant boundaryを検査する。

### 1.3 顧客ユーザー招待の単一情報源

旧案の`organization_members.invitation_expires_at`は削除した。

- invitation state・expiry・recipient binding: P4 invitation
- current membership: `public.organization_members`
- immutable invitation→membership causality: P4 membership episode/event

M04はP4-B RPCを再利用し、第二の招待authorityを作らない。

### 1.4 M01の既存修正を維持

- global commandは`admin_command_receipts + operator_events`で扱う
- legacy `operator_command_receipts`のtenant境界を緩めない
- `request_fingerprint`一致時だけidempotent replay
- outbox attempt詳細はM08 `system_event`へ記録

## 2. Manifest検証

| 項目 | 結果 |
|---|---:|
| Manifest version | 1.3 |
| Repository baseline | `2c2a6fba70b75e858abc71a7447840bf32f3507d` |
| Migration sequence | 00〜23、連番 |
| Migration stem重複 | 0 |
| 不正dependency | 0 |
| 新規relation | 77 |
| relation名重複 | 0 |
| migration未割当relation | 0 |
| relation重複割当 | 0 |
| P4-B invitation authority | 再利用・重複なし |
| organization_members invitation expiry追加 | 削除済み |
| M01 request fingerprint | あり |

物理Manifest SHA-256:

```text
d6d57dbadc341e4e1570e02fd22cd1f5ff8bc423c0740c97b8efbdb9c87a121a
```

Canonical Manifest SHA-256:

```text
f376867ccae596fdc5d8d66b12cbc16a9a95a1b4de464f34738088909859ed3a
```

## 3. M00 v1.3静的検証対象

- `schema_version = recora_admin_p0_design_v1_3`
- current repository baselineをpin
- P4-B enum・column・constraint・relations・RPCをinventory
- browser/service RPC grant boundaryをinventory
- inventoryが最初のpersistent writeより前
- public・legacy DML/ALTERなし
- destructive DDLなし

## 4. M01静的検証対象

- 作成table 3件、`admin_read` schema 1件
- global/scoped command receipt boundary
- request fingerprint replay/conflict
- append-only receipt
- outbox transition/安全payload
- read refresh single-running/terminal immutability

## 5. 未実施

- PostgreSQL 17での実migration適用
- migration-only / seeded reset
- RLS・grant・RPC実測
- P4-Bを含むPhase 3/4回帰
- Supabase advisors

本PASSは、最新baselineでM00/M01のlocal実装へ進める静的設計状態を示し、製品DB適用済みを意味しない。
