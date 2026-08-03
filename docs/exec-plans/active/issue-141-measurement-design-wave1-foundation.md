# Exec Plan: Issue #141 Measurement Design Wave 1 Foundation

このファイルは、Recora Measurement Design Stage 2 Wave 1の実装計画を記録するliving documentである。

現在は**Planのみ**であり、migration、DB操作、Local Supabase実行、実装用子Issueの開始を承認しない。

## Metadata

| Field | Value |
|---|---|
| Issue | `#141` — `https://github.com/sushikikun/RECORA/issues/141` |
| Parent | `#136` — new Canonical Measurement Design |
| Risk | `R2` |
| Spec level | `Full` |
| Current execution | `Cloud Codex / docs-only Plan` |
| Future execution | `Local Codex` after separate Execute approval |
| Approval | OWNERの2026-08-04「すすめて」をIssue・Exec Plan・docs-only Draft PRまでのPlan承認として記録 |
| Owner | `sushikikun` |
| Planning baseline | `f518ea201eea45459d8ad538e6a09983ab888a58` |
| Status | `Plan drafted / Human review pending` |
| Updated | `2026-08-04` |

Exec Planの記載はDB Execute承認を付与しない。実装・migration・Local Supabase操作へ進むには、Issue #141への別のOWNER Execute承認が必要である。

---

## 1. Objective / expected outcome

Stage 1で採用したCanonical Measurement Designのうち、Wave 1を安全に実装できる単位へ分解する。

Wave 1の完成形は、次を実現する基盤である。

```text
Measurement Design stable identity
├─ Persona identity / immutable revision
├─ Topic identity / immutable revision
├─ Intent Cell identity / immutable revision
├─ Prompt identity / immutable revision
├─ Prompt metric eligibility
└─ Prompt Set / frozen version / immutable membership
```

Wave 1は、実際のAI測定を動かさない。次はWave 2以降へ残す。

```text
Execution Profile Set
Measurement Design Version finalization / activation
Measurement Item / Attempt
Execution-time contract snapshot
provider call / queue / retry
analysis / quality / publication / UI
```

### 利用者から見た意味

Wave 1が完成すると、レコラは将来、次を壊さず保存できる。

- 誰の視点で測るか
- どの顧客課題を測るか
- どの質問文を使ったか
- その質問がどの指標に使えるか
- Core、Robustness、Diagnosticのどこに属するか
- 前回から何が変わったか

ただし、Wave 1だけではまだAIへ質問を送らない。

---

## 2. Recora全体構造での位置

```text
顧客・プロジェクト管理
        ↓
顧客オンボーディング / setup draft
        ↓
プロンプト・測定設計
   └─ Wave 1 Canonical semantic foundation  ← 今回
        ↓
Wave 2 Measurement Design Version / Execution Profile Set
        ↓
測定実行
        ↓
AI回答・引用分析
        ↓
品質・例外判定
        ↓
公開・レポート
```

Wave 1は、オンボーディング候補や編集途中のdraftを、そのままCanonical完成データとして保存しない。

Canonical rowは、検証済みの意味と履歴を固定するために使う。

---

## 3. Authoritative inputs

優先順:

1. Issue #141の最新OWNER決定
2. `docs/recora-measurement-design-canonical-data-model-v1.md`
3. `docs/recora-prompt-measurement-contract-v1.md`
4. `lib/recora/prompt-measurement-contract.ts`
5. `docs/recora-data-tenant-security-privacy.md`
6. `docs/recora-post-launch-operations-architecture.md`
7. Recora Admin P0 Canonicalのstate / authorization-audit / measurement-management契約
8. 最新masterのschema、migration、verifierは競合確認用の実装事実

Legacy `public.personas/topics/prompts`は新しいtable grainを決める正本ではない。

---

## 4. Planning decisions

### D1. Wave 1をW1AとW1Bへ分ける

巨大な単一migrationにしない。

```text
W1A
Canonical identity / revision / metric eligibility
        ↓
W1B
Panel Profile / Prompt Set / membership / validation evidence
```

理由:

- identity・revision制約だけで独立検証できる
- Prompt Setの集合制約を別に検証できる
- migration failure時の原因範囲が小さい
- #139などの並行migrationとの競合を減らせる
- W1Aが通らない状態でpanel compiler基盤へ進まない

W1AとW1Bは、それぞれ別の子Issue、New Worktree、branch、Draft PR、Execute承認を推奨する。

### D2. Canonical revisionはmutable draftではない

第一候補は次である。

```text
setup draft / generation candidate
        ↓ validation
canonical immutable revision row
```

Canonical revision tableを編集用workspaceとして使わない。

物理revision rowは、原則として作成時から内容不変とする。

- typo修正でも測定解釈へ影響する場合はsuccessor revision
- 旧revisionをUPDATEして過去の意味を変えない
- 旧revisionをDELETEしない
- supersessionは新revision側の参照で表す

### D3. Prompt Set Versionは完成済みpanelだけを保存する

```text
候補生成・cluster・coverage評価
        ↓
validation evidence
        ↓
frozen Prompt Set Version + memberships
```

`prompt_set_versions`やmembershipをdraft編集用に使わない。

### D4. DBとfinalization validatorの責任を分ける

DBは、単純かつ絶対に壊してはいけない整合性を担当する。

Finalization validatorは、集合・意味・coverageに関する判定を担当する。

### D5. Wave 1ではbrowser/runtime write pathを公開しない

- customer browser: direct accessなし
- admin browser: direct accessなし
- service role: actor identityではない
- Wave 1 migration後も、正式なserver commandはまだ接続しない
- local fixtureとverifierでのみ作成・検査する

---

## 5. Physical table plan

### 5.1 W1Aで作るtable

| Table | Grain / responsibility | Canonical behavior |
|---|---|---|
| `control.measurement_designs` | project内の一つの測定プログラムのstable identity | display metadata以外の意味を持たせすぎない。version activationはWave 2 |
| `control.persona_identities` | 同じ意思決定役割の継続identity | 別の役割へ意味が変わる場合は新identity |
| `control.persona_revisions` | Personaの検証済み不変定義 | insert-only。複雑な定義はversioned JSON + scalar key |
| `control.topic_identities` | 一つの診断Topicの継続identity | display nameをidentity keyにしない |
| `control.topic_revisions` | Topicの検証済み不変定義 | buyer stageやsignalをPromptへ強制しない |
| `control.intent_cell_identities` | 一つの意味上の顧客ニーズ | trend continuityが切れる場合は新identity |
| `control.intent_cell_revisions` | Persona・主要Topic・段階・localeを含む意味定義 | insert-only。tracking / improvement scopeを分離 |
| `control.intent_cell_revision_topics` | Intent Cell Revisionと副Topic Revisionの対応 | immutable mapping |
| `control.prompt_identities` | 一つのPrompt系列。1 Intent Cell identity配下 | unrelated Intent Cellへ再利用しない |
| `control.prompt_revisions` | 質問文と分類を固定した不変版 | text・scope・shape・buyer stage・opportunity変更は新revision |
| `control.prompt_revision_metric_eligibilities` | Prompt Revision × metric key | 単一`measurement_purpose`ではなく正式適格性を保存 |

### 5.2 W1Bで作るtable

| Table | Grain / responsibility | Canonical behavior |
|---|---|---|
| `control.panel_profile_versions` | panel構成ルールの不変版 | structureのみ作成し、migrationで商品値を無断seedしない |
| `control.measurement_policy_bundle_versions` | metric / valid-response / aggregation / repeat等のversion registry | Wave 1では参照基盤のみ。runtime interpretationはWave 2以降 |
| `control.prompt_sets` | 一つのsemantic panel系列 | Measurement Design stable identity配下 |
| `control.prompt_set_versions` | 完成・検証済みsemantic panelの不変版 | frozen rowのみCanonicalへ保存 |
| `control.prompt_set_memberships` | Set Version × Prompt Revision | Core / Robustness / Diagnostic等を固定 |
| `control.prompt_set_validation_runs` | 一回のversioned validation結果 | append-only。validator version・input hash・outcomeを保存 |
| `control.prompt_set_validation_findings` | Validation Run × finding | blocker / warning / reason codeをappend-only保存 |

### 5.3 Wave 2へ延期するtable

- `control.measurement_design_versions`
- `control.measurement_design_current_versions`
- Design VersionとPersona / Topic / Intent Cell Revisionのmembership
- Execution Profile / Profile Set / Membership
- Measurement Design activation command / validation
- `measurement.measurement_items`
- execution contract snapshots
- measurement attempts

理由: 完全なDesign Versionは、Prompt SetだけでなくExecution Profile Set、Policy Bundle、Entitlement、Analysis Target、Brand Identityを結合するため。

### 5.4 Wave 3へ延期するtable

- legacy import batches
- legacy import candidates / decisions
- shadow comparison
- cutover / writer switch evidence
- legacy freeze / retirement evidence

---

## 6. Column and data-shape policy

### 6.1 Common tenant keys

project-scoped rootは原則として次を持つ。

```text
id uuid
organization_id uuid not null
project_id uuid not null
created_at timestamptz not null
```

必要な親tableには、childがcross-project参照できないよう次のunique keyを用意する。

```text
unique (id, organization_id, project_id)
```

project参照は、既存Phase 3 foundationの正式keyを確認した上で、次の形を使う。

```text
foreign key (project_id, organization_id)
  references projects (id, organization_id)
```

正確なschema名はExecute開始時のrepository inventoryで確認し、tenant foundationを再作成しない。

### 6.2 Identity common fields

候補:

```text
id
organization_id
project_id
measurement_design_id
stable_key
display_name
created_at
created_by_actor_type
created_by_actor_id
```

`stable_key`はproject/design内のopaque keyであり、表示名や質問文を使わない。

### 6.3 Revision common fields

候補:

```text
id
organization_id
project_id
<identity_id>
revision_number
schema_version
content_hash
supersedes_revision_id
created_at
source_status
confidence_score
risk_flags
```

複雑なPersona / Topic定義は、主要検索・制約列をscalarで持ち、リスト型の定義をversioned JSONBとして持つ案を採用候補とする。

JSONBを使用する場合は必ず次を持つ。

- `definition_schema_version`
- deterministic canonicalization
- `content_hash`
- TypeScript schema validator
- DB側の最低限の型・必須key check

### 6.4 Hash

- SHA-256 hexを第一候補
- length / lowercase hex check
- secret、tenant ID、raw provider payloadをhash inputへ混ぜない
- hash algorithm/versionを曖昧にしない

### 6.5 Revision number

```text
unique (<identity_id>, revision_number)
revision_number >= 1
```

`revision_number > 1`は、同identity内の過去revisionを`supersedes_revision_id`で参照する。

旧revisionのstatusをUPDATEしてsupersededにすることを必須としない。successor relationと利用側のpointerで履歴を解決する。

---

## 7. Foreign-key and integrity plan

### 7.1 Ownership chain

```text
Organization
└─ Project
   └─ Measurement Design
      ├─ Persona Identity → Revisions
      ├─ Topic Identity → Revisions
      ├─ Intent Cell Identity → Revisions
      ├─ Prompt Identity → Revisions
      └─ Prompt Set → Versions → Memberships
```

全chainでorganization / projectが一致することをcomposite FKで保証する。

### 7.2 Intent Cell

- Persona Revisionは同じorganization / project / Measurement Design scope
- Primary Topic Revisionも同じscope
- secondary topic mappingも同じscope
- primary Topicと同じrevisionをsecondaryへ重複登録しない

### 7.3 Prompt

Prompt IdentityはIntent Cell Identityへ属する。

Prompt Revisionは次を同時に固定する。

```text
prompt_identity
intent_cell_identity
intent_cell_revision
organization
project
```

Prompt IdentityのIntent CellとPrompt RevisionのIntent Cell Revisionが別identityになる組み合わせをDBで拒否する。

### 7.4 Metric eligibility

```text
unique (prompt_revision_id, metric_key)
```

metric keyはcontract enumへ限定する。

Canonical Prompt Revisionが正式測定候補となるには、少なくとも一つのeligible analysis用途とversioned reason codeを必要とする。

### 7.5 Prompt Set membership

DB制約候補:

```text
unique (prompt_set_version_id, sort_order)
unique (prompt_set_version_id, prompt_revision_id)
```

さらに、次のpartial unique indexを使う。

```text
one core + canonical per
(prompt_set_version_id, intent_cell_revision_id)
```

Membershipの`intent_cell_revision_id`は、Prompt Revisionが参照するIntent Cell Revisionとcomposite FKで一致させる。

---

## 8. Immutability plan

### 8.1 Insert-only targets

次は原則UPDATE / DELETE禁止。

- Persona Revision
- Topic Revision
- Intent Cell Revision
- Intent Cell secondary-topic mapping
- Prompt Revision
- Prompt Revision Metric Eligibility
- Panel Profile Version
- Measurement Policy Bundle Version
- frozen Prompt Set Version
- Prompt Set Membership
- Prompt Set Validation Run / Finding

### 8.2 Stable identity rows

Identity rowは内容定義を持たない。

許可する変更は最小限にする。

- non-semantic display label
- lifecycle marker
- row version

意味の変更はrevisionで表現する。

### 8.3 Trigger placement

immutable trigger helperは、既存private helper conventionをread-only inventoryで確認する。

第一候補:

- helperはData API非公開schema
- fixed `search_path`
- fully-qualified object reference
- direct execution grantなし
- existing private/audit helperを不必要に改変しない

### 8.4 Canonical insert timing

第一候補は、validation完了後の一transactionでCanonical rowを作成する方式である。

Canonical table内でdraftを何度もUPDATEする方式は採用しない。

---

## 9. DB constraint vs finalization validator

### 9.1 DBで保証する

- not null / enum / range / hash shape
- organization / project composite ownership
- parent / child identity consistency
- duplicate revision number rejection
- successorが同identity / tenant / projectに属すること
- revision / frozen rowのUPDATE・DELETE拒否
- metric key重複拒否
- duplicate membership / sort order拒否
- Core canonical partial uniqueness
- browser role grant拒否

### 9.2 Finalization validatorで保証する

- Robustness Intent CellにCoreがある
- selected profileのCore / Robustness / Diagnostic count
- Topic / Persona / buyer-stage coverage
- unresolved semantic duplicateがない
- paraphraseがheadline weightを増やしていない
- brand / competitor contamination
- natural citation / forced citation分離
- criteria-onlyのmarket metric除外
- source evidence / quality / confidence threshold

### 9.3 Validation evidence

Prompt Setをfrozenとして作成する前に、versioned validator resultを必須とする。

第一候補:

```text
validation_run
├─ validator_version
├─ contract_version
├─ input_hash
├─ result: passed / failed
├─ blocker_count
├─ warning_count
└─ findings
```

DB write pathが未実装のWave 1では、local fixtureでこの順序を再現する。

---

## 10. RLS, grants and access boundary

### 10.1 Schema

accepted logical schema `control`を使用する方針を第一候補とする。

Execute開始時に、最新masterとlocal DBで次を確認する。

- schemaの存在
- owner
- PostgREST exposed schema設定
- default privileges
- existing functions / grantsとの衝突

accepted architectureの変更が必要なら停止し、Architecture Decisionを別承認にする。

### 10.2 Direct access

新規tableはすべてRLSを有効化する。

Wave 1の完了時点では、次へ直接table accessを与えない。

```text
PUBLIC
anon
authenticated
service_role
```

理由:

- customer/admin browserへ直接公開しない
- Wave 1では正式server commandをまだ実装しない
- service roleをoperator identityとして扱わない
- Wave 2以降で承認済みprivate command boundaryを追加できる

### 10.3 Future server writes

将来のwrite pathは次を要求する。

- verified actor or system component
- organization / project scope
- command receipt / idempotency
- expected row version where mutable pointer is involved
- reason / audit evidence
- private server boundary

Wave 1 migrationだけでgeneric mutation RPCを作らない。

---

## 11. Migration decomposition

## W1A: identity / revision / eligibility

予定object:

```text
control schema inventory/create if approved
measurement_designs
persona_identities
persona_revisions
topic_identities
topic_revisions
intent_cell_identities
intent_cell_revisions
intent_cell_revision_topics
prompt_identities
prompt_revisions
prompt_revision_metric_eligibilities
private immutable helpers
```

Exit:

- tenant A/B・project A/Bのcross-referenceが全て拒否
- revision insert / successor / immutable contractがPASS
- legacy tableにDML・ALTER・FKなし
- browser rolesにdirect accessなし

## W1B: panel / validation foundation

予定object:

```text
panel_profile_versions
measurement_policy_bundle_versions
prompt_sets
prompt_set_versions
prompt_set_memberships
prompt_set_validation_runs
prompt_set_validation_findings
panel finalization verifier fixtures
```

Exit:

- 50件fixtureを含むpanel compileがlocalでPASS
- Core重複、orphan Robustness、profile count不一致がFAIL
- Prompt Set VersionとMembershipがimmutable
- no runtime / no execution matrix / no writer cutover

### Migration naming

正式filenameはExecute時にSupabase CLIで生成する。

候補stem:

```text
recora_measurement_design_w1a_semantic_identity_revision
recora_measurement_design_w1b_prompt_panel_foundation
```

既存migrationを編集しない。

---

## 12. Future implementation file scopes

実装用子Issueで個別に確定する。第一候補は各子Issue5ファイル以内とする。

### W1A候補

1. new migration SQL
2. W1A verifier TypeScript
3. Wave 1 physical spec
4. Prompt Contract verifierの互換追加が必要な場合のみ1ファイル
5. `package.json`

### W1B候補

1. new migration SQL
2. W1B verifier TypeScript
3. Wave 1B physical spec
4. W1A verifierの回帰接続が必要な場合のみ1ファイル
5. `package.json`

`package-lock.json`、existing migration、seedは変更しない。

---

## 13. Dedicated Local Supabase plan

### W1A

```text
project_id: recora-measurement-design-w1a
expected container: supabase_db_recora-measurement-design-w1a
```

### W1B

```text
project_id: recora-measurement-design-w1b
expected container: supabase_db_recora-measurement-design-w1b
```

### Environment rules

- 正式repoの最新masterからNew Worktree
- repo外の専用Supabase workdir
- 実測した未使用port群
- linked-project markerなし
- 他Issue containerを停止・削除しない
- main worktreeを変更しない
- remote / linked / productionへ接続しない

---

## 14. Validation plan

### 14.1 Static and repository

| Validation | Expected result |
|---|---|
| exact changed-file scope | 子Issueで承認されたfilesのみ |
| TypeScript typecheck | PASS |
| contract verifier | PASS |
| `npm run recora:preflight:full` | PASS |
| lint | PASS |
| build | PASS |
| `git diff --check` | PASS |
| identifier UTF-8 byte length | PostgreSQL 63 bytes以内 |
| secret/env/DB URL value scan | 0件 |
| package-lock / seed / existing migration diff | 0件 |

### 14.2 Migration replay

- migration-only reset
- seeded reset
- second reset/replay
- migration list
- object inventory
- constraint / trigger inventory
- security advisor
- performance advisor

### 14.3 Tenant isolation

最低限、organization A/B、project A1/A2/B1を使う。

拒否する例:

- AのidentityへBのrevisionを接続
- A1のPromptをA2のIntent Cellへ接続
- BのPrompt RevisionをAのPrompt Setへ追加
- caller-supplied organization差替え
- browser role direct select/insert/update/delete

### 14.4 Revision immutability

- duplicate revision number: FAIL
- revision UPDATE: FAIL
- revision DELETE: FAIL
- self-supersession: FAIL
- cross-identity supersession: FAIL
- successor作成後も旧hash不変: PASS

### 14.5 Prompt eligibility

- metric key重複: FAIL
- market metric + self branded: validator FAIL
- market metric + known competitor seed: validator FAIL
- natural + forced citation同時eligible: validator FAIL
- criteria-only + ranking: validator FAIL
- risk/recommendation-only: PASS

### 14.6 Prompt Set

- duplicate prompt membership: FAIL
- duplicate sort order: FAIL
- Core canonical重複: FAIL
- Robustness without Core: finalization FAIL
- profile count mismatch: finalization FAIL
- valid 50 fixture: PASS
- same Intent Cell paraphrasesがheadline countを増やさない: PASS

### 14.7 Existing regressions

Execute開始時のmasterに存在する正式verifierをinventoryし、最低限次を回帰する。

- Phase 3 tenant/security
- entitlement snapshot
- operator/audit foundation
- Recora Admin P0 merged milestones
- prompt measurement contract verifier
- project setup draft verifier

#139がmerge済みの場合はM02回帰も含める。未mergeの場合は、Wave 1 Execute開始前に依存順を再判断する。

---

## 15. Rollback / recovery

### Plan phase

- Trigger: 正本との矛盾、scope drift、CI failure
- Action: docs branchだけを修正または閉じる
- Preserved evidence: Issue、PR、commit、CI
- DB impact: なし

### Future W1A/W1B local Execute

- Trigger: reset、verifier、security、regressionの失敗
- Preconditions: dedicated local environmentであること
- Steps:
  1. 追加変更を停止
  2. 失敗証跡を保存
  3. constraintを弱めずroot causeを特定
  4. 承認範囲内で修正できなければHuman reviewへ戻る
  5. 他Issue stackやcontainerへ触れない
- Preserved evidence: migration、verifier output、inventory、advisor、logs
- Production rollback: 不要。production操作は禁止

### Production boundary

Wave 1 PRのmergeは、production DB適用を意味しない。

linked / remote / productionへの適用は、対象environment、migration、inventory、rollbackを特定した別R3 Issueと個別承認を必要とする。

---

## 16. Dependencies and concurrency

| Dependency | Current state | Wave 1 impact |
|---|---|---|
| #133 Prompt & Measurement Contract | merged | authority |
| #135 TypeScript Contract | merged | validator/type authority |
| #137 Canonical Data Model | merged | physical target authority |
| #136 parent | open | Wave tracking |
| #139 Admin P0 M02 | in progress at planning time | Plan並行可。Execute前にmaster/migration/package/verifier競合を再確認 |
| Phase 3 tenant/security | merged | consume without redefinition |

Wave 1はAdmin P0のoperator RBACを作らない。将来のoperator commandが既存Admin command receipt / auditへ接続できるように境界だけ維持する。

---

## 17. Stop conditions

次の場合はExecute計画をReadyにしない。

- accepted `control` schema責任を変更する必要がある
- tenant foundationの再設計が必要
- Canonical tableからlegacy tableへFKが必要
- mutable draftをCanonical revision tableへ保存しないと成立しない
- analysis target / brand identity source contractがW1Aに必須となる
- #139または最新masterとmigration順・package・verifier競合を解消できない
- existing migration / seed / lockfile変更が必要
- remote/linked DBが必要
- direct browser writeを許可しないと成立しない
- 2 migrationへ分割しても独立検証できない

---

## 18. Milestones

| Milestone | Status | Actions | Exit criteria |
|---|---|---|---|
| M1: Authority and boundary | `Completed` | #133/#135/#137、tenant/security、全体構造を確認 | Wave 1責任と延期対象が明確 |
| M2: Physical table plan | `Completed` | W1A/W1Bのtable、grain、FK、不変性を定義 | 実装対象と延期対象が明確 |
| M3: Security and validation plan | `Completed` | RLS/grant、local stack、negative test、rollbackを定義 | R2 Planに必要な検証が明確 |
| M4: Docs-only review PR | `In progress` | 1-file Draft PR、CI、Issue報告 | CI PASS、Human reviewへ到達 |
| M5: Execute decision | `Pending` | W1A/W1B child Issueと個別Execute判断 | OWNERが実装可否と順番を決定 |

---

## 19. Validation plan for this Plan PR

| Validation | Expected result | Actual result / evidence |
|---|---|---|
| changed files | Exec Plan 1ファイルのみ | Pending |
| authority review | latest master docsと一致 | Completed by cross-review |
| Wave boundary review | Wave 2/3責任を取り込まない | Completed by cross-review |
| legacy-first review | legacy table shapeから逆算しない | Completed by cross-review |
| whitespace | error 0 | Pending CI |
| Recora preflight/typecheck | PASS | Pending CI |
| lint | PASS | Pending CI |
| production build | PASS | Pending CI |
| secret/env/token/DB URL value | 0件 | Pending final review |

---

## 20. Progress log

| Date | Milestone | Update / evidence | Next step |
|---|---|---|---|
| `2026-08-04` | M1 | Issue #141作成。PlanとExecuteを分離 | Physical plan作成 |
| `2026-08-04` | M2 | W1A identity/revision、W1B panel/validationへ分割 | Security/validation整理 |
| `2026-08-04` | M3 | tenant、immutability、RLS、local validation、rollbackを定義 | Draft PRとCI |

---

## 21. Decision log

| Date | Decision | Rationale | Impact |
|---|---|---|---|
| `2026-08-04` | Wave 1をW1A/W1Bへ分割する | migration・constraint・検証範囲を小さくする | 別Execute承認・別PRを推奨 |
| `2026-08-04` | Canonical revisionをdraft workspaceにしない | 過去の意味を変更しない | revisionはinsert-only第一候補 |
| `2026-08-04` | Prompt Set Versionはfrozen panelだけを保存 | 集合の再現性 | candidate編集はCanonical外 |
| `2026-08-04` | Wave 1でdirect runtime writeを公開しない | Auth/audit境界を先走らない | table/RLS/constraintのlocal基盤のみ |
| `2026-08-04` | Panel/Profile policy tableはstructureのみ、商品値を無断seedしない | 50/100/200は実験profile | fixtureで検証し正式bootstrapは別判断 |
| `2026-08-04` | Measurement Design Version activationはWave 2 | Execution Profile Set等が必要 | Wave 1はsemantic component foundationに限定 |

---

## 22. Results and remaining risks

### Planned result

- 実装対象tableと延期対象を分離した
- stable identityとimmutable revisionの物理方針を定めた
- tenant composite FK、不変性、RLS、grantの方針を定めた
- DB constraintとfinalization validatorを分離した
- W1A / W1Bのmigration順とlocal検証を定めた
- production操作を別R3へ分離した

### Known remaining risks

- `control` schemaの実際のowner/default privilegeはExecute時のlocal inventoryが必要
- #139 merge後の最新migration/package/verifier baselineは未確定
- Persona/Topic JSON schemaの最終field一覧はW1A physical specで固定が必要
- Panel Profile / Policy Bundleの正式bootstrap rowは別判断
- semantic clustering algorithmは未実装
- analysis target / brand identity integrationはWave 2 dependency

### Completion record

- Final status: `N/A — Plan PR作成中`
- Completed or closed at: N/A
- Follow-up: Issue #141 Human review後、W1A / W1B Execute child Issue
- Archive path: `docs/exec-plans/completed/issue-141-measurement-design-wave1-foundation.md`
