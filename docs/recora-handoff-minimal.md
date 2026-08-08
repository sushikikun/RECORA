# Recora ローンチ引き継ぎマニフェスト

更新日: 2026-07-26

このファイルは「完成させたもののうち、ローンチに必要なもの」だけを別環境へ引き継ぐための一覧です。試作、生成物、会話履歴は引き継ぎません。

今回のGitHub引き継ぎは、公開サイトと問い合わせ中心のローンチに限定します。顧客用画面、顧客ダッシュボード、各種prototype、未完成のCheckoutは別作業とし、このブランチには含めません。

## 1. 現時点の判定

- 問い合わせ中心の公開ローンチ: コードは引き継ぎ可能。本番環境変数とブラウザ確認が必要。
- 顧客向けSaaSローンチ: 未完了。静的なダッシュボード値、認証強制、tenant境界、実データ接続の完了が必要。
- 有料セルフサービスローンチ: 未完了。Stripe Checkout後の検証、Webhook、契約反映、ユーザー紐付け、請求管理がない。
- Phase 1管理者運用: ローカル運用資産として引き継ぎ可能。本番の内部画面としては未完成。

初回ローンチは、LP、表示例、問い合わせ、認証入口を公開し、有料プランは問い合わせで受ける形を推奨する。Checkoutは公開しない。

## 2. ステータス

| ステータス | 意味 |
| --- | --- |
| `TRANSFER` | 完成したコード資産として引き継ぐ |
| `TRANSFER_WITH_GATE` | 必須資産として引き継ぐが、本番確認が終わるまで公開しない |
| `TRANSFER_AS_UI` | 完成したUI設計として引き継ぐが、実データ機能の完成とは扱わない |
| `HOLD` | 未完成。完成済み成果物として引き継がない |
| `DROP` | ローンチに不要。引き継がない |

## 3. `TRANSFER`: 公開ローンチで引き継ぐ

### 公開サイト

- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/product/**`
- `app/sample/**`
- `app/pricing/**`
- `app/contact/**`
- `app/api/contact/**`
- `app/robots.ts`
- `app/sitemap.ts`
- `components/recora/marketing/**`
- `lib/recora/marketing-site.ts`
- `lib/recora/public-pricing.ts`
- `public/brand/**`
- `public/og/**`

注意:

- 新LP、product、sample、pricing、contact、marketing部品、robots、sitemapは現在の作業ツリーでは未追跡ファイルを含む。現在のcommitだけを移しても再現できない。
- pricingの有料CTAは問い合わせ導線へ切り替え済み。未完成のCheckoutは含めない。
- contactの画面と送信処理は実装済みだが、Resendの本番送信確認前は `TRANSFER_WITH_GATE` として扱う。

### 基本設定と検証

- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `.eslintrc.json`
- `tsconfig.json`
- `next.config.mjs`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `components.json`
- `.gitignore`
- `supabase/config.toml`
- `.env.example`
- `.env.local.example`
- `scripts/recora-dev-checks.ts`
- `scripts/recora-safe-commit.ts`
- `scripts/recora-db-write-guard.ts`
- `scripts/verify-*.ts`
- `scripts/audit-recora-project-setup-draft-generator.ts`
- `scripts/fixtures/project-setup-draft-generator-regression.json`

## 4. `TRANSFER_WITH_GATE`: ローンチに必要だが本番確認が残る

### 認証

- `app/login/**`
- `app/signup/**`
- `app/forgot-password/**`
- `app/auth/**`
- `middleware.ts`
- `lib/supabase/**`
- `lib/recora/auth-access.ts`
- `lib/recora/auth-origin.ts`

実装済みの範囲:

- login、signup、メール確認、password reset、signout
- Supabase session refresh
- redirect先のallowlist

残るgate:

- Supabase Authの本番E2E
- メール確認とpassword resetの本番redirect
- `/dashboard/**` で未ログインユーザーを拒否する認証強制
- organization / project / user のtenant境界確認

### 案件設定

- `app/onboarding/project-setup/**`
- `components/recora/onboarding/**`
- `app/api/recora/site-inspect/**`
- `lib/recora/project-setup-draft.ts`
- `lib/recora/project-setup-draft-generator.ts`
- `lib/recora/site-inspection.ts`
- `lib/recora/site-inspection-types.ts`

deterministic generator、quality rubric、回帰fixtureは標準preflightで通過済み。公式サイト確認APIの本番通信、濫用対策、認証境界は別途確認する。

### DB・read model・計測

- `supabase/migrations/**`
- `lib/recora/db/**`
- `lib/recora/metric-definitions.ts`
- `lib/recora/report-eligibility.ts`
- `lib/recora/measurement-analysis-read-model.ts`
- `lib/recora/measurement-profiles.ts`
- `lib/recora/prompt-scope.ts`
- `scripts/plan-recora-report-cycle.ts`
- `scripts/run-recora-cycle.ts`
- `scripts/run-recora-report-cycle.ts`
- `scripts/run-recora-phase1-operator-flow.ts`
- `scripts/run-openai-measurement.ts`
- `scripts/generate-recommendation-candidates.ts`
- `scripts/save-recommendation-candidates.ts`
- `scripts/recalculate-metric-snapshots.ts`
- `scripts/inspect-recora-measurement-runs.ts`
- `scripts/prepare-recora-client-project.ts`
- `scripts/upsert-recora-prompt-library.ts`

引き継ぐ設計境界:

1. Admin Control DB: 契約、計測実行、再実行、公開判定などの内部運用状態。
2. Customer Measurement DB: 回答、prompt snapshot、mention、citation、metric、recommendation evidence。
3. Customer Published Read Model: 承認済みの顧客向け表示データ。

remote migration適用状態、production RLS、公開snapshot、計測時prompt snapshot、保持削除方針は完成済みとみなさない。DB writeや本番計測は別承認と事前確認が必要。

追加のP0:

- dashboard DB層はsession-awareな`createRecoraSupabaseServerClient()`ではなく、セッションなしclientを使う経路がある。anon公開demoは読めても、ログイン済み顧客organizationのmember読取はコード上成立しない。
- recommendation生成・保存は`pre_quality_gate` / `review_required`まで。`auto_publish` / `customer_visible`へ承認更新する操作は未実装。
- Gemini / Perplexityはモデル台帳だけで、実provider adapterは未実装。
- measurement schedule / batch / itemはschema中心で、worker、queue、cron、retry、stale job回収は未実装。
- Supabase型は自動生成型ではなく手書きのため、migration driftを別途確認する。

### Phase 1管理者運用

- `app/internal/**`
- `components/recora/admin-*.tsx`
- `components/recora/internal-console-shell.tsx`
- `lib/recora/internal-*.ts`
- `lib/recora/phase1-admin-plan.ts`
- `app/api/recora/run-cycle/**`
- `docs/recora-phase1-admin-demo-launch.md`
- `docs/recora-phase1-admin-measurement-cycle.md`

内部画面はlocalhost限定で、本番では404になる設計。durableな管理者認証ではないため、本番管理画面として公開しない。

## 5. `TRANSFER_AS_UI`: 今回は除外する顧客UI

次は別ページ・別作業で扱うため、今回のGitHubブランチには含めない。

- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/config/**`
- `app/dashboard/reports/**`
- `components/recora/customer-dashboard-v03.tsx`
- `components/recora/customer-dashboard-v03-analysis.ts`
- `components/recora/customer-dashboard-v03-analysis-visuals.tsx`
- `components/recora/customer-dashboard-v03-page-details.ts`
- `components/recora/customer-analysis/**`
- `components/recora/dashboard-shell.tsx`
- `components/recora/data-rich/**`
- `components/recora/report-ui/**`
- `components/recora/ui.tsx`
- `lib/recora/nav-config.ts`
- `lib/recora/dev-preview/**`
- `public/recora/model-logos/**`

重要:

- `customer-dashboard-v03.tsx` と `customer-analysis/**` は未追跡。
- 現在の本線routeがこれらを直接参照しているため、除外するとbuildできない。
- 現UIは多数の指標、競合、日付、回答、引用をコード内の静的値から表示している。
- `reportReadyGate` はDBを確認するが、gate通過後のv03画面は同じprojectのread modelを表示していない。
- したがって「UI完成資産」であり、「実測データで動く顧客プロダクト完成」ではない。

## 6. `HOLD`: 完成するまで引き継がない

### 有料Checkout

- `app/api/checkout/**`
- `app/checkout/**`

不足:

- Checkout Sessionの本番検証
- Webhook署名検証
- payment / subscriptionとユーザー・組織・projectの紐付け
- plan entitlement反映
- 解約、更新、失敗、返金、請求管理
- success pageの`session_id`検証
- 利用規約、プライバシーポリシー、特定商取引法表示

### 顧客向けSaaS公開

次が完了するまで、dashboardを顧客向け完成品として公開しない。

- `/dashboard/**` の認証強制
- tenant / project ownershipの検証
- v03 UIの静的値をCustomer Published Read Modelへ置換
- 顧客DB読取をsession-aware Supabase clientへ接続
- hardcoded `mieruca-seo-demo` の除去
- readiness判定と表示データのproject一致
- recommendationを品質審査後にcustomer-visibleへ昇格するwrite path
- production DB / RLS / migration適用確認
- 実際に提供するAIモデルのprovider adapter
- 「毎日計測」を提供する運用手順またはworker / scheduler
- 顧客データを使ったbrowser smoke

## 7. `DROP`: 引き継がない

- `app/dashboard-ui-prototype*/**`
- `components/recora/dashboard-ui-prototype*/**`
- `app/dashboard-production-prototype/**`
- `components/recora/dashboard-production-prototype/**`
- `components/recora/customer-analysis/topic-views.tsx`
- 使用されていない旧LP `components/recora/lp/**`
- 使用されていない旧LP部品 `components/recora/brand/**`
- `.next/**`
- `.next-codex-backup-*/**`
- `node_modules/**`
- `output/**`
- `tmp/**`
- `.tmp/**`
- `.codex-tmp/**`
- `.playwright-cli/**`
- `.playwright-mcp/**`
- `.hallmark/**`
- `.codex/artifacts/**`
- `tsconfig.tsbuildinfo`
- `*.log`
- ルート直下の検証用PNG / JPEG
- `.env.local`など実値入りenv
- `({w`、`window.scrollTo(0`などのブラウザ操作残骸
- 過去の会話ログ、試行錯誤のメモ

prototype routeは本番buildにも含まれ、直接アクセス・クロール可能になるため、ローンチ環境へコピーしない。

`supabase/seed.sql`はlocal専用で複数表をtruncateするため、本番へ適用しない。tenant foundation migrationを別環境へ適用する前に、全projectと実organizationの対応表を確認し、顧客projectをanon公開demo organizationへ誤分類しない。

## 8. 環境変数

値は引き継ぎファイルへ書かない。変数名と設定先だけ引き継ぐ。

公開サイト:

- `NEXT_PUBLIC_SITE_URL` または `NEXT_PUBLIC_APP_URL`

Supabase:

- `SUPABASE_URL` または `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` または `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` は承認済みのserver-side jobだけ
- `RECORA_DATABASE_URL`
- `RECORA_DEFAULT_PROJECT_SLUG`

問い合わせ:

- `RESEND_API_KEY`
- `RECORA_CONTACT_TO`
- `RECORA_CONTACT_FROM`

計測:

- `OPENAI_API_KEY`
- `RECORA_OPENAI_MODEL`

env exampleにはsite URLとResendの変数名を追加済み。実値はGitHubへ含めず、デプロイ先で設定する。Stripeと管理者運用用の変数は今回の公開範囲に含めない。

## 9. 現在のリポジトリ状態

- Repo: `C:\Users\nakan\work\recora-main`
- Branch: `codex/recora-public-launch-handoff`
- HEAD: `a83e9a3`
- 確認時点の `origin/master`: `a83e9a3`
- `git-common-dir`: `.git`
- 作業ツリー: modified 28、untracked 158、staged 0

未追跡の本線ファイルが多数あるため、`git add .` は使わない。今回の公開ローンチに必要なファイルだけを個別にstageし、顧客UIとprototypeを除外する。

## 10. 検証結果

2026-07-24の現作業ツリーで確認:

- `npm run recora:preflight:full`: PASS
- `npm run lint`: PASS、warning / errorなし
- `npm run build`: PASS、44 static pages生成完了
- `git diff --check`: PASS。ただし既存ファイルにLF→CRLF warningあり

build warning:

- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`がない状態では、一部metadataの基準URLが`http://localhost:3000`になる。

未確認:

- clean cloneでの再現
- Playwrightによる全route確認
- Vercel deployment
- Supabase Auth本番E2E
- Resend本番送信
- production DB / RLS / migration適用状態
- OpenAI本番計測
- Stripe本番E2E

## 11. 最初に読む正本

| 目的 | 正本 |
| --- | --- |
| 作業ルール | `AGENTS.md` |
| 開発・検証 | `docs/recora-dev-workflow.md` |
| 表示境界 | `docs/recora-display-contract.md` |
| 顧客レポート | `docs/recora-report-product-spec.md` |
| 指標 | `docs/recora-metric-contract.md` |
| DB責務 | `docs/recora-customer-vs-admin-db-boundary-design.md` |
| DB完成計画 | `docs/recora-operational-db-completion-plan.md` |
| DB readiness | `docs/recora-customer-db-readiness-audit.md` |
| 計測DB readiness | `docs/recora-customer-measurement-db-readiness-audit.md` |
| 案件設定 | `docs/recora-project-setup-draft-contract.md` |

## 12. 引き継ぎ後の最初の作業

1. `TRANSFER`対象だけでclean clone / clean worktreeを作る。
2. `npm ci`を実行する。
3. `npm run recora:preflight:full`、`npm run lint`、`npm run build`を実行する。
4. 問い合わせ中心の公開routeをブラウザ確認する。
5. prototype routeが存在しないことを確認する。
6. 本番環境変数を値を表示せず確認する。
7. 顧客SaaS、DB write、計測、Checkoutは各gate完了後に別々に公開する。
