# Recora Admin DB Design

Last updated: 2026-06-28

Status: design document only. This document does not create a migration, write to any database, implement RLS, implement `/internal`, change `/dashboard`, or run OpenAI / external APIs.

## 1. Purpose

Recora の管理用DBは、Recora 内部が顧客、契約、診断予定、一括調査 batch、レポート公開確認、操作履歴、内部メモを管理するためのDB領域である。

この設計書の目的は、管理用DBの境界、責務、P0/P1/P2分割、RLS / grant 方針、既存DBとの関係を固定し、将来の migration や `/internal` 実装で言葉と責務が混ざらないようにすること。

今回作るもの:

- 管理用DBの設計方針。
- `recora_admin` schema を想定した P0 テーブル案。
- 既存 `public` テーブルとの関係。
- RLS / grant、read/write actor、一括調査 batch、prompt snapshot、report公開確認の方針。
- 後続PRの推奨順、リスク、未決定事項。

今回作らないもの:

- migration。
- DB write。
- RLS実装。
- `/internal` の画面実装。
- `/dashboard` の顧客向け画面実装。
- 顧客用DB/read model。
- OpenAI計測や外部API実行。
- plan別の具体的な表示範囲、prompt数、競合数、料金、上限値の確定。

用語を次のように分ける。

| Term | Meaning | Customer-visible |
|---|---|---|
| 管理用DB | Recora内部が顧客、契約、診断予定、batch、公開確認、操作履歴を管理するDB領域。推奨 schema は `recora_admin`。 | No |
| 管理用画面 | Recora内部担当者が管理用DBや既存run状態を見て、将来的に batch 作成や公開確認を行う画面。現ルートは `/internal`。 | No |
| 顧客用画面 | 顧客がログインして自社レポートを見る画面。現ルートは `/dashboard`。 | Yes |
| 顧客用DB/read model | 将来的に顧客画面へ安全に見せるための read model / snapshot / view。今回は作らない。 | Yes |

既存 docs には `/dashboard/admin/operations` 表記が残っているが、現行実装上の内部コンソールのルートは `/internal` として扱う。今後の docs / UI / route 名は `/internal` に寄せる。

## 2. Current State

管理用DB専用テーブルはまだ未実装である。次のようなテーブルは存在しない前提で扱う。

- `recora_admin.customer_profiles`
- `recora_admin.plan_configs`
- `recora_admin.customer_subscriptions`
- `recora_admin.diagnostic_intakes`
- `recora_admin.measurement_schedules`
- `recora_admin.measurement_batches`
- `recora_admin.measurement_batch_items`
- `recora_admin.prompt_change_events`
- `recora_admin.report_publication_reviews`
- `recora_admin.operation_events`
- `recora_admin.internal_notes`

一方で、管理用途に流用できる既存DB要素はある。

- `public.organizations`: `organization_type`, `data_environment`, `is_internal`, `is_demo` による顧客 / demo / local の境界。
- `public.organization_members`: 将来の RLS / メンバー認可の土台。`anon` は revoke、`authenticated` のみを前提とする。
- `public.projects`: 顧客案件単位。`organization_id` を持つ。
- `public.measurement_runs.metadata`: `run_kind`, `data_source`, `source_run_id`, `measurement_profile_id`, `search_mode` などを暫定運用状態として使用している。
- `public.metric_snapshots.metadata`: aggregate / read model 文脈を持つ。
- `public.recommendations.metadata`: `publication_state`, `quality_gate_decision`, `display_decision`, `candidate_id` などを持つ。

`/internal` は既に存在する read-only 管理コンソールである。現状の `/internal` は、projects 一覧、run history、report-ready、recommendation 状態、計画確認を表示する。`/internal` から DB write、OpenAI 実行、子プロセス実行はしない。

`/internal` のアクセス制御は現時点では durable internal auth ではない。`RECORA_ENABLE_PHASE1_ADMIN_UI=true`、非production、非Vercel、localhost 限定であり、条件外は 404 とする。

既存 `public` テーブルは RLS 有効である。`anon` / `authenticated` には SELECT grant があるが、policy で demo/local org または membership に制限する。`INSERT` / `UPDATE` / `DELETE` は `anon` / `authenticated` から revoke する。`recommendations` は customer-visible predicate を通すため、`pre_quality_gate` / `review_required` / `hidden_internal` は顧客向け SELECT から落とす。

## 3. Core Policy

管理用DBは、当面は同一 Supabase / Postgres 内で schema により論理的に分ける。推奨 schema は `recora_admin`。物理DB分割は今はしない。

基本方針:

- `recora_admin` は顧客用画面から読ませない。
- `recora_admin` は Supabase Data API の公開対象 schema にしない方針とする。
- `anon` に grant しない。
- `authenticated` にも原則 grant しない。
- 初期方針は RLS enabled + `anon` / `authenticated` revoke。
- `/internal` の server-side read model だけが読む。
- 管理用DBに AI回答、引用本文、ブランド出現、集計値、改善提案本体を複製しない。
- 診断結果そのものは既存の測定・集計テーブルに保存し、管理用DBはそれらを参照する。
- API key、service role、DB URL、OpenAI key、token、cookie、private key などの secrets は保存しない。
- 変更されやすい数値や表示範囲は schema に焼き込まず、`plan_code` + `jsonb` config / entitlement 的な設計に逃がす。
- 顧客用DB/read model、顧客用画面の大改修、plan別表示制御の本実装は別PRに分ける。

`recora_admin` の名前は内部運用のための schema 名であり、顧客向け feature 名や pricing 名ではない。

## 4. Diagnostic Data Ownership

診断データと管理データの保存先は次のように分ける。

| Data | Owner |
|---|---|
| 無料診断受付 | `recora_admin.diagnostic_intakes` |
| 週1/週2の予定 | `recora_admin.measurement_schedules` |
| 一括調査 batch | `recora_admin.measurement_batches`, `recora_admin.measurement_batch_items` |
| 実際の診断 run | `public.measurement_runs` |
| prompt ごとの実行 | `public.run_items` |
| AI回答 | `public.ai_conversations` |
| ブランド出現 | `public.brand_mentions` |
| 引用 | `public.citations`, `public.source_domains` |
| 集計 | `public.metric_snapshots` |
| 改善提案 | `public.recommendations` |
| 公開確認 | `recora_admin.report_publication_reviews` |
| 内部メモ / 操作ログ | `recora_admin.internal_notes`, `recora_admin.operation_events` |

管理用DBは「いつ、誰が、どの顧客 / project / run / report を、どの状態として扱ったか」を管理する。AI回答や集計値の正本は `public` 側の測定系テーブルに残す。

## 5. ERD-Level Relationship

```text
public.organizations
  -> recora_admin.customer_profiles
  -> recora_admin.customer_subscriptions
  -> recora_admin.diagnostic_intakes
  -> recora_admin.operation_events
  -> recora_admin.internal_notes

public.projects
  -> recora_admin.measurement_schedules
  -> recora_admin.measurement_batch_items
  -> recora_admin.report_publication_reviews
  -> recora_admin.prompt_change_events
  -> recora_admin.operation_events
  -> recora_admin.internal_notes

public.measurement_runs
  -> recora_admin.measurement_batch_items.measurement_run_id
  -> recora_admin.report_publication_reviews.measurement_run_id

public.prompts
  -> recora_admin.prompt_change_events.prompt_id

recora_admin.plan_configs
  -> recora_admin.customer_subscriptions.plan_config_id
```

`organization_id` と `project_id` は管理用DBでも必ず保持し、customer boundary を追えるようにする。`measurement_run_id` は実行済みの診断runへの参照であり、管理用DB側にrun結果を複製するためのキーではない。

### Tenant Consistency Requirements

P0-A migration 前に、`organization_id` / `project_id` の整合性制約を明文化する。

`customer_profiles`, `customer_subscriptions`, `diagnostic_intakes`, `measurement_schedules` などで `organization_id` と `project_id` の両方を持つ場合、`project_id` が同じ `organization_id` に属することをDB制約または同等の検証で保証する。現案で `project_id` を持たないテーブルに後から project scope を足す場合も同じ扱いにする。

実装方式は migration PR で既存schemaと実DBを確認して決める。候補は次の通り。

- `public.projects` に `unique(id, organization_id)` 相当の補助 unique index / constraint を置き、管理用テーブルから `(project_id, organization_id)` の composite FK を張る。
- 管理用テーブル側に補助 unique index を置き、FK と check を組み合わせる。
- Postgres の通常FKだけで表現しづらい参照、たとえば `measurement_run_id` / `aggregate_run_id` が指す run の `project_id` と `organization_id` 検証は constraint trigger で担保する。

P0-B / P0-C で `measurement_run_id` や `aggregate_run_id` を持つ場合も、参照先 run が同じ `project_id` に属し、その project が同じ `organization_id` に属することを検証する。管理用DBは cross-tenant な参照を持たない。

## 6. P0 / P1 / P2 Split

P0 は、無料診断受付、顧客状態、契約状態、調査予定、batch、公開確認、prompt変更履歴、内部メモを最低限管理できる状態を目指す。

### P0-A

- `recora_admin.plan_configs`
- `recora_admin.customer_profiles`
- `recora_admin.customer_subscriptions`
- `recora_admin.diagnostic_intakes`
- `recora_admin.measurement_schedules`
- `recora_admin.operation_events`

### P0-B

- `recora_admin.measurement_batches`
- `recora_admin.measurement_batch_items`

### P0-C

- `recora_admin.report_publication_reviews`
- `recora_admin.prompt_change_events`
- `recora_admin.internal_notes`

### P1

- `recora_admin.recommendation_review_events`
- `recora_admin.usage_events`
- `recora_admin.monthly_usage`
- `recora_admin.notification_events`
- `recora_admin.job_attempts`

### P2

- Stripe 連携。
- `recora_admin.billing_events`。
- `report_snapshots`。
- customer-facing read model。
- plan visibility rules の本実装。
- durable internal operator auth。

## 7. P0 Table Design

この章は設計案であり、migration ではない。型、制約、index、policy は後続PRで既存schemaと実DBを確認したうえで確定する。

### `recora_admin.plan_configs`

Purpose:

- Recora が販売 / 運用する plan の定義を保持する。
- plan ごとの機能、表示範囲、上限値を固定カラムに焼き込まず、config として扱う。
- 料金や prompt 数などの未決定値を schema に固定しない。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | plan config ID |
| `plan_code` | text not null | plan 識別子 |
| `plan_version` | text not null default `'v1'` | 同じ plan の版 |
| `display_name` | text not null | 内部表示名。顧客向けコピーとは分ける |
| `description` | text | 内部説明 |
| `billing_mode` | text not null default `'manual'` | manual / stripe / none など |
| `is_active` | boolean not null default true | 新規割当可能か |
| `config` | jsonb not null default `'{}'` | 汎用設定 |
| `feature_config` | jsonb not null default `'{}'` | 機能 entitlement |
| `visibility_config` | jsonb not null default `'{}'` | 表示範囲候補 |
| `limit_config` | jsonb not null default `'{}'` | prompt 数などの上限候補 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Constraints / candidates:

- `unique(plan_code, plan_version)` を検討する。
- `plan_code` 候補: `free_diagnostic`, `weekly_1`, `weekly_2`, `manual_enterprise`。

Notes:

- plan別表示範囲、prompt数、競合数、料金はここで確定しない。
- 顧客向け表示の最終判断は customer-facing read model / visibility rules 側で扱う。
- `config` に secrets を保存しない。

### `recora_admin.customer_profiles`

Purpose:

- `public.organizations` を Recora 内部運用上の顧客状態として補足する。
- 顧客ライフサイクル、内部担当、優先度、管理状態を保持する。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | customer profile ID |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `primary_project_id` | references `public.projects(id)` | 主 project |
| `lifecycle_status` | text not null default `'lead'` | 顧客ライフサイクル |
| `admin_status` | text not null default `'new'` | 内部運用状態 |
| `owner_label` | text | 内部担当者ラベル |
| `internal_priority` | text not null default `'normal'` | 内部優先度 |
| `status_config` | jsonb not null default `'{}'` | 状態補足 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Status candidates:

- `lifecycle_status`: `lead`, `free_diagnostic`, `trial`, `paid`, `paused`, `churned`, `rejected`。
- `admin_status`: `new`, `setup_pending`, `ready_to_measure`, `measuring`, `report_review`, `customer_visible`, `needs_followup`, `blocked`。

Notes:

- `organization_type`, `data_environment`, `is_internal`, `is_demo` の正本は `public.organizations` に残す。
- 顧客表示可否はこのテーブル単体で決めない。report readiness と customer-visible gate を併用する。

### `recora_admin.customer_subscriptions`

Purpose:

- 顧客組織ごとの plan 割当、課金状態、契約期間を管理する。
- Stripe 本実装前は manual billing を前提にする。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | subscription ID |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `plan_config_id` | references `recora_admin.plan_configs(id)` | plan 定義 |
| `plan_code` | text not null | plan snapshot / 検索用 |
| `plan_version` | text | plan 版 snapshot |
| `status` | text not null default `'free_diagnostic'` | 契約状態 |
| `billing_provider` | text not null default `'manual'` | 課金プロバイダ |
| `billing_provider_customer_id` | text | 外部顧客ID。必要時のみ |
| `billing_provider_subscription_id` | text | 外部契約ID。必要時のみ |
| `current_period_start` | timestamptz | 現期間開始 |
| `current_period_end` | timestamptz | 現期間終了 |
| `started_at` | timestamptz default now() | 開始日時 |
| `trial_ends_at` | timestamptz | trial 終了日時 |
| `canceled_at` | timestamptz | cancel 日時 |
| `ended_at` | timestamptz | 終了日時 |
| `subscription_config` | jsonb default `'{}'` | 顧客別例外設定 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Status / code candidates:

- `status`: `free_diagnostic`, `trialing`, `active`, `past_due`, `paused`, `canceled`, `suspended`, `ended`。
- `billing_provider`: `manual`, `stripe`, `none`。

Notes:

- Stripe 連携は P2。外部IDは secrets ではないが、扱いは最小限にする。
- plan変更履歴が必要になった場合は P1/P2 で event 化を検討する。
- 顧客向け entitlement 判定は後続の read model / visibility rules で扱う。

### `recora_admin.diagnostic_intakes`

Purpose:

- 無料診断や初回相談の受付情報を管理する。
- 受付から project / organization への変換状態を追う。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | intake ID |
| `organization_id` | references `public.organizations(id)` | 作成済みの場合に紐づけ |
| `project_id` | references `public.projects(id)` | 作成済みの場合に紐づけ |
| `company_name` | text | 会社名 |
| `website_url` | text | 公式URL |
| `contact_email` | text | 連絡先メール |
| `contact_name` | text | 連絡先名 |
| `primary_brand_name` | text | 主ブランド名 |
| `status` | text not null default `'submitted'` | 受付状態 |
| `source` | text not null default `'manual'` | 流入元 |
| `intake_payload` | jsonb default `'{}'` | 入力内容の補足 |
| `operator_notes` | text | 初期内部メモ |
| `submitted_at` | timestamptz default now() | 受付日時 |
| `converted_at` | timestamptz | 顧客 / project 化日時 |
| `rejected_at` | timestamptz | 見送り日時 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Status candidates:

- `submitted`, `setup_pending`, `ready_to_measure`, `measuring`, `free_report_review`, `free_report_ready`, `converted_to_paid`, `rejected`, `failed`。

Notes:

- `intake_payload` に API key、token、password、DB URL、service role は保存しない。
- 顧客が入力した URL やテキストは untrusted input として扱う。
- 診断結果はこのテーブルに保存しない。

### `recora_admin.measurement_schedules`

Purpose:

- 週1 / 週2 / manual など、次回計測予定と頻度を管理する。
- 実際の計測結果は `public.measurement_runs` に保存する。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | schedule ID |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `project_id` | references `public.projects(id)` | 対象 project |
| `subscription_id` | references `recora_admin.customer_subscriptions(id)` | 契約 |
| `frequency_code` | text not null default `'manual'` | 計測頻度 |
| `timezone` | text not null default `'Asia/Tokyo'` | schedule timezone |
| `schedule_config` | jsonb default `'{}'` | 例外設定 |
| `next_run_at` | timestamptz | 次回予定 |
| `last_run_at` | timestamptz | 前回実行 |
| `is_active` | boolean default true | 有効状態 |
| `paused_reason` | text | 停止理由 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Code candidates:

- `frequency_code`: `manual`, `free_diagnostic_once`, `weekly_1`, `weekly_2`, `custom`。

Notes:

- schedule は「予定」であり、OpenAI計測実行そのものではない。
- HTTP request 内で計測を直接走らせない。
- 次回実行対象の抽出は dry-run 可能にする。

### `recora_admin.operation_events`

Purpose:

- 内部運用の監査ログとして、顧客、契約、schedule、batch、公開確認、prompt変更、内部メモ追加などのイベントを残す。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | event ID |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `project_id` | references `public.projects(id)` | 対象 project |
| `event_type` | text not null | イベント種別 |
| `event_status` | text not null default `'recorded'` | 記録状態 |
| `actor_type` | text not null default `'operator'` | operator / script / worker など |
| `actor_id` | uuid | 将来の operator ID |
| `actor_label` | text | 内部担当者ラベル |
| `target_table` | text | 対象テーブル |
| `target_id` | uuid | 対象ID |
| `summary` | text not null | 短い要約 |
| `details` | jsonb default `'{}'` | 詳細 |
| `created_at` | timestamptz | 作成日時 |

Event type candidates:

- `diagnostic_intake_created`
- `subscription_updated`
- `schedule_updated`
- `batch_planned`
- `batch_queued`
- `measurement_run_linked`
- `report_reviewed`
- `report_published`
- `report_rejected`
- `prompt_changed`
- `internal_note_added`

Notes:

- `details` に secrets を保存しない。
- 大きなAI回答本文や引用本文を保存しない。必要なら `public.ai_conversations` / `public.citations` を参照する。
- customer-visible な説明文ではなく、内部監査ログとして扱う。

### `recora_admin.measurement_batches`

Purpose:

- 一括調査の親 batch を管理する。
- 対象抽出、dry-run 結果、queue 状態、進捗件数を保持する。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | batch ID |
| `batch_type` | text not null | batch 種別 |
| `target_plan_code` | text | 対象 plan |
| `target_frequency_code` | text | 対象頻度 |
| `status` | text not null default `'draft'` | batch 状態 |
| `triggered_by_type` | text not null default `'operator'` | operator / script など |
| `triggered_by_label` | text | 実行者ラベル |
| `triggered_at` | timestamptz default now() | 起票日時 |
| `selection_config` | jsonb default `'{}'` | 対象抽出条件 |
| `dry_run_summary` | jsonb default `'{}'` | dry-run 結果 |
| `target_count` | integer default 0 | 対象件数 |
| `queued_count` | integer default 0 | queued 件数 |
| `running_count` | integer default 0 | running 件数 |
| `completed_count` | integer default 0 | completed 件数 |
| `failed_count` | integer default 0 | failed 件数 |
| `excluded_count` | integer default 0 | 除外件数 |
| `started_at` | timestamptz | 開始日時 |
| `completed_at` | timestamptz | 完了日時 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Status / code candidates:

- `batch_type`: `free_diagnostic`, `weekly_1_manual`, `weekly_2_manual`, `selected_projects_manual`, `scheduled`, `retry_failed`。
- `status`: `draft`, `queued`, `running`, `partially_completed`, `completed`, `failed`, `canceled`。

Notes:

- `dry_run_summary` は対象件数、除外件数、推定run数、推定コストを保持できるようにする。
- 推定コストは正確な請求額ではなく、operator が実行前に確認するための見積りとして扱う。
- batch 作成と OpenAI 計測実行は分ける。

### `recora_admin.measurement_batch_items`

Purpose:

- 一括調査 batch 内の project / schedule 単位の実行候補を管理する。
- 実行済みになったら `public.measurement_runs` への参照を持つ。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | batch item ID |
| `batch_id` | references `recora_admin.measurement_batches(id)` | 親 batch |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `project_id` | references `public.projects(id)` | 対象 project |
| `schedule_id` | references `recora_admin.measurement_schedules(id)` | schedule |
| `subscription_id` | references `recora_admin.customer_subscriptions(id)` | subscription |
| `measurement_run_id` | references `public.measurement_runs(id)` | 実行済み run |
| `status` | text not null default `'queued'` | item 状態 |
| `excluded_reason` | text | 除外理由 |
| `error_message` | text | 失敗理由 |
| `run_window_start` | timestamptz | 対象期間開始 |
| `run_window_end` | timestamptz | 対象期間終了 |
| `idempotency_key` | text | 二重実行防止キー |
| `item_config` | jsonb default `'{}'` | item別補足 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Status candidates:

- `queued`, `skipped`, `running`, `completed`, `failed`, `canceled`, `excluded`。

Idempotency:

- 将来的に `unique(project_id, idempotency_key) where idempotency_key is not null` を検討する。
- `idempotency_key` 例:
  - `weekly_1:<project_id>:2026-W27`
  - `weekly_2:<project_id>:2026-W27:slot1`
  - `free_diagnostic:<diagnostic_intake_id>`

Notes:

- `measurement_run_id` は実行後に紐づく。実行前は null でよい。
- `error_message` に API key、raw credential、DB URL を含めない。
- excluded item も残すことで、dry-run と実行後の差分を説明できるようにする。

### `recora_admin.report_publication_reviews`

Purpose:

- レポート単位の内部公開確認を保存する。
- recommendation の customer-visible gate とは別に、レポート全体の readiness / publication を扱う。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | review ID |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `project_id` | references `public.projects(id)` | 対象 project |
| `measurement_run_id` | references `public.measurement_runs(id)` | source run |
| `aggregate_run_id` | references `public.measurement_runs(id)` | aggregate run |
| `report_key` | text | report 識別子 |
| `report_url` | text | 共有候補URL |
| `readiness_status` | text not null default `'unknown'` | readiness gate 状態 |
| `decision` | text not null default `'pending_review'` | 公開判断 |
| `reviewer_type` | text not null default `'operator'` | reviewer 種別 |
| `reviewer_id` | uuid | 将来の operator ID |
| `reviewer_label` | text | 内部担当者ラベル |
| `reason` | text | 判断理由 |
| `blocker_snapshot` | jsonb default `'{}'` | blocker の snapshot |
| `diagnostic_snapshot` | jsonb default `'{}'` | 診断状態の要約 |
| `reviewed_at` | timestamptz | review 日時 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Decision candidates:

- `pending_review`, `approved`, `needs_fix`, `rejected`, `published`, `unpublished`。

Notes:

- `approved` / `published` のみ顧客表示対象に進める。
- `needs_fix` / `rejected` / `pending_review` は顧客表示しない。
- `diagnostic_snapshot` は表示判断に必要な要約であり、AI回答本文や集計値の複製先ではない。

### `recora_admin.prompt_change_events`

Purpose:

- 顧客または内部運用者による prompt 変更履歴を保存する。
- prompt は即時反映しつつ、実行済みレポートの根拠が変わらないようにする。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | change event ID |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `project_id` | references `public.projects(id)` | 対象 project |
| `prompt_id` | references `public.prompts(id)` | 変更対象 prompt |
| `actor_type` | text not null default `'customer'` | customer / operator / script など |
| `actor_id` | uuid | actor ID |
| `actor_label` | text | 表示ラベル |
| `change_source` | text not null default `'dashboard'` | 変更経路 |
| `previous_text` | text | 変更前 text |
| `next_text` | text | 変更後 text |
| `previous_config` | jsonb default `'{}'` | 変更前補足 |
| `next_config` | jsonb default `'{}'` | 変更後補足 |
| `created_at` | timestamptz | 作成日時 |

Code candidates:

- `change_source`: `dashboard`, `internal`, `script`, `migration`。

Notes:

- 顧客が prompt を変更したら `public.prompts` は即時更新する。
- 次回以降の `measurement_run` で新 prompt を使う。
- 実行済み `measurement_run` は `public.ai_conversations.prompt_text_snapshot` を見る。
- 過去レポートの根拠を壊さない。
- 後続PRで `public.prompts.prompt_type`, `metric_eligibility`, `prompt_set_version`, `public.measurement_runs.prompt_set_version` の first-class column 化を検討する。
- branded prompt を visibility / ranking / SOV に混ぜない既存方針を壊さない。

### `recora_admin.internal_notes`

Purpose:

- 顧客 / project に紐づく内部メモを保存する。
- sales、support、billing、measurement、report review、risk などの運用文脈を残す。

Main columns:

| Column | Type idea | Notes |
|---|---|---|
| `id` | uuid primary key | note ID |
| `organization_id` | references `public.organizations(id)` | 顧客組織 |
| `project_id` | references `public.projects(id)` | 対象 project |
| `note_type` | text not null default `'general'` | note 種別 |
| `body` | text not null | 本文 |
| `created_by_type` | text not null default `'operator'` | 作成者種別 |
| `created_by_id` | uuid | 将来の operator ID |
| `created_by_label` | text | 作成者ラベル |
| `is_pinned` | boolean default false | 固定表示 |
| `visibility` | text not null default `'internal'` | 表示範囲 |
| `created_at` | timestamptz | 作成日時 |
| `updated_at` | timestamptz | 更新日時 |

Type candidates:

- `general`, `sales`, `support`, `billing`, `measurement`, `report_review`, `prompt`, `risk`。

Notes:

- `visibility` は初期値 `internal` のみを前提とする。顧客向け note にはしない。
- メモ本文に secrets を保存しない。
- 顧客に見せるべき説明は customer-facing read model / report copy 側で別に設計する。

## 8. RLS / Grant Policy

`recora_admin` schema は顧客用画面から読ませない。`/dashboard` からも読まない。

Initial policy:

- `recora_admin` schema は Supabase Data API の公開対象にしない。
- `anon` に grant しない。
- `authenticated` にも原則 grant しない。
- private schema でも defense in depth として RLS enabled を前提にする。
- `/internal` の server-side read model だけが読む。
- durable internal auth が未接続の現時点では、一般 `authenticated` にも見せない。

Future operator auth options:

- `recora_admin.operator_members` を追加し、内部operator membership を明示管理する。
- または `recora_admin.is_internal_operator(auth.uid())` のような helper を検討する。
- helper function を作る場合も、`SECURITY DEFINER` の公開範囲、`EXECUTE` grant、RLS bypass、Data API exposure をレビューする。

Migration 時の確認事項:

- 全 multi-tenant table で `organization_id` / `project_id` の境界が明示されていること。
- `anon` / `authenticated` が管理用テーブルを SELECT できないこと。
- `/dashboard` が `recora_admin` を参照していないこと。
- service role は server-side の承認済み処理に限定し、client component や public env に出さないこと。

## 9. Read / Write Actor Policy

Read actors:

- `/internal` server-side read model。
- local + explicit env flag 限定。
- 顧客用画面からは読まない。

Write actors:

- migration。
- operator script。
- 明示承認された server-side action。

`/internal` write 操作は、durable internal operator auth と per-action authorization が入るまで出さない。現状の `/internal` は local flag 限定かつ read-only であり、DB write、OpenAI実行、子プロセス実行はしない。

将来の write 操作は別PRで分離する。write PR では、operator identity、required role、action-level permission、audit event、rollback / retry、rate limit、対象DBを明示してから実装する。

Forbidden actors and actions:

- 顧客用画面から write。
- `/dashboard` から write。
- 顧客用画面から `recora_admin` read。
- 画面ボタンから OpenAI 計測を直接実行。
- HTTP request 内で長時間の計測 job を直接実行。
- secrets を `details` / `config` / `payload` 系 jsonb に保存。
- DB接続情報や service role をログ、画面、operation event に出す。

## 10. Batch Safety Design

一括調査 batch は、画面操作、対象抽出、queue 作成、実行を分離する。

Recommended flow:

1. `/internal` で operator がボタンを押す。
2. 対象 project / schedule を抽出する。
3. `recora_admin.measurement_batches` を作成する。
4. `recora_admin.measurement_batch_items` を作成する。
5. item status を `queued` にする。
6. 実行は script / worker / operator command が処理する。
7. 実行後に `measurement_batch_items.measurement_run_id` へ `public.measurement_runs.id` を紐づける。

Safety rules:

- HTTP request 内で OpenAI 計測を直接実行しない。
- OpenAI API や外部APIを UI event handler から直接呼ばない。
- 二重実行防止のため `idempotency_key` を検討する。
- `dry_run_summary` で対象件数、除外件数、推定run数、推定コストを保持できるようにする。
- `excluded_reason` を残し、なぜ対象外になったかを後で説明できるようにする。
- `failed` item の retry は別 batch または明示的な retry flow で扱う。

P0-B migration 前に、`measurement_batch_items.idempotency_key` の仕様を確定する。

検討事項:

- unique 制約の単位。候補は `unique(project_id, idempotency_key) where idempotency_key is not null`、または `batch_type` / `schedule_id` / `run_window_start` を含めた制約。
- status 遷移。`queued` -> `running` -> `completed` / `failed` / `canceled` / `excluded` / `skipped` のように、retry 可能状態と terminal 状態を分ける。
- worker retry 時に既存 `measurement_run_id` がある場合、新しい run を作らず既存 run を再利用する。
- run 作成後に `measurement_batch_items.measurement_run_id` の紐付け更新で失敗した場合、replay は同じ idempotency key / correlation を使って既存 run を探し、重複 run を作らず item へ再リンクする。
- retry は HTTP request 内で OpenAI 計測を直接実行しない方針を維持し、script / worker / operator command 側で扱う。

## 11. Prompt Immediate Update And Snapshot Policy

顧客prompt編集は即時反映する。ただし、過去レポートの根拠は壊さない。

Policy:

- 顧客が prompt を変更したら `public.prompts` は即時更新する。
- `recora_admin.prompt_change_events` に変更履歴を保存する。
- 次回以降の `measurement_run` で新 prompt を使用する。
- 実行済み `measurement_run` は `public.ai_conversations.prompt_text_snapshot` を見る。
- 過去レポートの根拠を、現在の `public.prompts.text` で上書き解釈しない。
- 後続PRで `public.prompts.prompt_type`, `public.prompts.metric_eligibility`, `public.prompts.prompt_set_version`, `public.measurement_runs.prompt_set_version` の first-class column 化を検討する。
- branded prompt を visibility / ranking / SOV に混ぜない既存方針を壊さない。

Prompt は顧客入力を含むため untrusted input として扱う。prompt text を SQL、HTML、ログ、外部API payload に渡す場所では、それぞれの境界で escape / validation / size limit を検討する。

## 12. Report Publication Review Flow

レポート公開は自動ではなく内部確認後とする。

Recommended flow:

1. 計測。
2. 集計。
3. レポート生成。
4. readiness gate。
5. `recora_admin.report_publication_reviews` に内部確認を保存。
6. `approved` / `published` のみ顧客表示対象。
7. `needs_fix` / `rejected` / `pending_review` は顧客表示しない。

`recommendations` の customer-visible gate と、`report_publication_reviews` は別の責務を持つ。

- recommendation gate: 改善提案単位の公開可否。
- report publication review: レポート単位の公開確認。

二重管理の混乱を避けるため、report が `published` でも、個別 recommendation が customer-visible gate を通っていない場合は表示しない。逆に recommendation が customer-visible でも、report が `pending_review` / `needs_fix` / `rejected` の場合は顧客に見せない。

## 13. Variable Items To Keep In JSONB

変わる数字、表示範囲、plan例外、dry-run結果、blocker snapshot は、初期段階では固定カラムにしすぎない。

JSONB candidates:

- `plan_configs.config`
- `plan_configs.feature_config`
- `plan_configs.visibility_config`
- `plan_configs.limit_config`
- `measurement_schedules.schedule_config`
- `measurement_batches.selection_config`
- `measurement_batches.dry_run_summary`
- `report_publication_reviews.blocker_snapshot`
- `prompt_change_events.previous_config`
- `prompt_change_events.next_config`

JSONB に逃がす理由:

- plan ごとの具体的な表示範囲、prompt数、競合数、料金、上限値が未決定。
- 週1 / 週2 / enterprise などで例外が発生しうる。
- 初期運用では schema churn を抑えたい。

ただし、検索や JOIN に常用するキーは後続PRで first-class column 化を検討する。`organization_id`, `project_id`, `status`, `plan_code`, `schedule_id`, `batch_id`, `measurement_run_id` のような境界 / 状態 / 参照キーは JSONB に閉じ込めない。

### JSONB / Notes / Snapshot Payload Safety

`diagnostic_snapshot`, `blocker_snapshot`, `operation_events.details`, `diagnostic_intakes.intake_payload`, `internal_notes.body` などは内部運用の補助情報であり、診断結果本体の保存先ではない。

これらの payload / note には、secrets、API key、token、cookie、private key、DB URL、service role、OpenAI key、AI回答本文、引用本文、集計値の完全コピー、recommendation 本体、不要なPIIを保存しない。

保存してよい候補は、ID参照、status token、短い operator summary、blocker code、件数、dry-run の要約、公開判断に必要な最小限の理由に限定する。migration 前に、許可する要約項目、禁止項目、サイズ上限、PII / retention / deletion 方針を具体化する。

管理用DBは引き続き、診断結果本体、AI回答、集計値、recommendation 本体を複製しない。必要な場合は `public.measurement_runs`, `public.run_items`, `public.ai_conversations`, `public.metric_snapshots`, `public.recommendations` への参照で traceability を保つ。

## 14. Items To Separate From Existing Metadata

現状は一部の運用状態を既存 `metadata` や script manifest / log に持たせている。管理用DB導入後は、次の項目を段階的に分離したい。

`public.measurement_runs.metadata` から分離したいもの:

- `plan_code`
- `schedule_id`
- `batch_id`
- `batch_item_id`
- `execution_source`

`public.recommendations.metadata` から分離したいもの:

- review decision 履歴。
- reviewer。
- `reviewed_at`。
- `reason`。

script manifest / log から分離したいもの:

- batch 作成。
- dry-run 結果。
- 実行者。
- 対象件数。
- 除外理由。

分離後も、測定の正本と traceability は維持する。管理用DBに移すのは運用状態と参照関係であり、AI回答や集計値そのものではない。

## 15. Explicitly Out Of Scope For This PR

今回は次を作らない。

- migration。
- 顧客用DB/read model。
- 顧客用画面大改修。
- プランごとの具体的表示範囲。
- prompt数 / 競合数 / 料金などの固定上限。
- Stripe 本実装。
- 完全 worker。
- OpenAI を画面から直接実行する仕組み。
- report_snapshots 本実装。
- `recommendation_review_events`。
- usage / cost 本実装。
- `/internal` write 操作。
- durable internal operator auth。

## 16. Recommended Implementation Order

PR は責務ごとに分ける。

1. PR 1: `docs/recora-admin-db-design.md`
2. PR 2: `recora_admin` schema + P0-A migration
3. PR 3: batch系 migration
4. PR 4: publication / prompt / notes migration
5. PR 5: read model
6. PR 6: `/internal` read-only 画面
7. PR 7: `/internal` write 操作。durable internal operator auth と per-action authorization が入るまで出さない。

Migration PR では、対象DB、環境、DB host、dry-run、RLS、grant、rollback、existing data への影響を別途確認する。migration と UI 実装を同じPRに混ぜない。

## 17. Risks And Mitigations

| Risk | Mitigation |
|---|---|
| 管理用DBと顧客用画面を混同する | 用語を固定し、`recora_admin` は `/dashboard` から読まない。 |
| 管理用テーブルが顧客に見える | private schema、Data API 非公開、`anon` / `authenticated` revoke、RLS enabled を初期方針にする。 |
| AI回答や集計値を管理用DBに複製する | AI回答は `public.ai_conversations`、集計は `public.metric_snapshots` を正本にする。管理用DBは参照だけ持つ。 |
| prompt即時反映で過去レポート根拠が壊れる | 実行時に `prompt_text_snapshot` を見て、過去runを現在promptで再解釈しない。 |
| 一括調査が二重実行される | `idempotency_key`、dry-run、batch item status、operator confirmation を導入する。 |
| 画面からOpenAIを直接実行する | UI は batch / queue 作成まで。実行は script / worker / operator command に分離する。 |
| secrets が `operation_events.details` に保存される | secrets の保存禁止を schema / code review / tests で確認する。 |
| recommendation gate と report publication review が二重管理になる | recommendation は提案単位、report review はレポート単位と定義し、両方が通ったものだけ顧客表示する。 |
| durable internal auth 未接続のまま authenticated に見える | 現時点では一般 `authenticated` にも grant しない。operator auth は P2 で設計する。 |
| JSONB に重要キーを閉じ込める | 境界 / 状態 / 参照キーは first-class column にする。可変設定だけ JSONB に逃がす。 |

## 18. Open Questions

未決定事項:

- 無料診断で見せる範囲。
- 週1 / 週2プランの具体的な表示範囲。
- prompt数 / 競合数 / 料金。
- Stripe 導入時期。
- internal operator auth の方式。
- report snapshot をいつ first-class 化するか。
- `prompt_type` / `metric_eligibility` の DB column 化タイミング。
- `recora_admin.operator_members` を作るか、helper function を使うか。
- `/internal` write 操作をどの順番で解禁するか。

これらは本設計書では確定しない。後続PRでは、決定値を schema に焼き込む前に product / operation / security の観点で別途レビューする。

## 19. Acceptance Criteria For This Document

- 変更ファイルは `docs/recora-admin-db-design.md` のみ。
- migration、DB write、RLS実装、UI実装、OpenAI実行を含まない。
- 管理用DB、管理用画面、顧客用画面、顧客用DB/read model の言葉が分かれている。
- `recora_admin` と既存 `public` 測定系テーブルの責務が分かれている。
- P0/P1/P2 と後続PR順が明記されている。
- RLS / grant、read/write actor、一括調査 batch、prompt snapshot、report公開確認の安全方針が明記されている。
