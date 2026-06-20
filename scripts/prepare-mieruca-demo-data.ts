import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import net from "node:net";
import process from "node:process";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const DEFAULT_PROJECT_SLUG = "mieruca-seo-demo";
const DEFAULT_MAX_PAGES = 5;
const TARGET_DOMAIN = "mieru-ca.com";
const USER_AGENT = "RecoraDemoDataPreparer/0.1 (+https://recora.local; public-page-preview)";

type Row = Record<string, string | null>;
type Priority = "high" | "medium" | "low";
type BrandType = "primary" | "competitor";
type SourceType = "owned" | "competitor" | "media" | "review" | "technical" | "unknown";

type CliOptions = {
  apply: boolean;
  projectSlug: string;
  databaseUrl: string;
  maxPages: number;
  fetchPublicPages: boolean;
  allowNonLocalDb: boolean;
};

type PublicPageSeed = {
  url: string;
  label: string;
  purpose: string;
};

type PublicPagePreview = PublicPageSeed & {
  status: "fetched" | "skipped" | "failed";
  title: string | null;
  description: string | null;
  headings: string[];
  error: string | null;
};

type ProjectSeed = {
  organizationSlug: string;
  organizationName: string;
  slug: string;
  name: string;
  workspaceName: string;
  language: "ja";
  region: "JP";
  defaultPeriod: string;
};

type BrandSeed = {
  id: string;
  brandType: BrandType;
  name: string;
  reading: string | null;
  domain: string | null;
  aliases: string[];
  category: string;
  description: string;
};

type PersonaSeed = {
  id: string;
  name: string;
  segment: string;
  weight: number;
  jobs: string[];
  painPoints: string[];
};

type TopicSeed = {
  id: string;
  name: string;
  intent: string;
  priority: Priority;
  weight: number;
};

type PromptSeed = {
  id: string;
  topicName: string;
  personaName: string;
  text: string;
  intent: string;
  buyerStage: string;
  priority: Priority;
};

type SourceDomainSeed = {
  domain: string;
  sourceType: SourceType;
  trustLabel: string;
};

type DemoSeed = {
  project: ProjectSeed;
  brands: BrandSeed[];
  personas: PersonaSeed[];
  topics: TopicSeed[];
  prompts: PromptSeed[];
  sourceDomains: SourceDomainSeed[];
  publicPages: PublicPageSeed[];
  manualNeedsVerification: string[];
};

type ApplySummary = {
  organizationId: string;
  projectId: string;
  organizationsUpserted: number;
  projectUpserted: number;
  brandsUpserted: number;
  personasUpserted: number;
  topicsUpserted: number;
  promptsUpserted: number;
  sourceDomainsUpserted: number;
  measurementRowsWritten: 0;
};

type PgMessage = {
  type: string;
  payload: Buffer;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const seed = buildDemoSeed(options.projectSlug);
  const publicPages = await previewPublicPages(seed.publicPages, options);

  const payload = renderPreviewPayload(seed, publicPages, options);
  console.log(JSON.stringify(payload, null, 2));

  if (!options.apply) {
    console.log("Dry-run complete. DB writes: 0");
    return;
  }

  assertLocalDatabaseUrl(options.databaseUrl, options.allowNonLocalDb);
  const db = new LocalPostgresClient(options.databaseUrl);
  await db.connect();
  try {
    const applySummary = await applySeed(db, seed);
    console.log(JSON.stringify({ mode: "apply", applySummary }, null, 2));
  } finally {
    db.end();
  }
}

function buildDemoSeed(projectSlug: string): DemoSeed {
  const today = toTokyoDateOnly(new Date());
  const project: ProjectSeed = {
    organizationSlug: "recora-internal-demo",
    organizationName: "Recora Internal Demo",
    slug: projectSlug,
    name: "ミエルカSEO AI検索分析デモ",
    workspaceName: "ミエルカSEO Demo Workspace",
    language: "ja",
    region: "JP",
    defaultPeriod: today
  };

  const brands: BrandSeed[] = [
    {
      id: stableUuid(projectSlug, "brand:mieruca-seo"),
      brandType: "primary",
      name: "ミエルカSEO",
      reading: "ミエルカエスイーオー",
      domain: TARGET_DOMAIN,
      aliases: ["ミエルカ", "ミエルカSEO", "MIERUCA", "mieruca", "mieru-ca"],
      category: "SEO・GEO/AIO/LLMOツール",
      description: "公開ページを起点にしたRecoraデモ用の主対象ブランド。実測評価ではなく計測入力の準備データです。"
    },
    {
      id: stableUuid(projectSlug, "brand:keywordmap"),
      brandType: "competitor",
      name: "Keywordmap",
      reading: "キーワードマップ",
      domain: null,
      aliases: ["Keywordmap", "キーワードマップ"],
      category: "SEO・コンテンツマーケティング支援",
      description: "比較対象候補。競合範囲・正式名称・対象プランはNEEDS_VERIFICATIONです。"
    },
    {
      id: stableUuid(projectSlug, "brand:search-write"),
      brandType: "competitor",
      name: "SEARCH WRITE",
      reading: "サーチライト",
      domain: null,
      aliases: ["SEARCH WRITE", "サーチライト"],
      category: "SEO・記事制作支援",
      description: "比較対象候補。競合範囲・正式名称・対象プランはNEEDS_VERIFICATIONです。"
    },
    {
      id: stableUuid(projectSlug, "brand:tact-seo"),
      brandType: "competitor",
      name: "TACT SEO",
      reading: "タクトエスイーオー",
      domain: null,
      aliases: ["TACT SEO", "TACT", "タクトSEO"],
      category: "SEO分析・改善支援",
      description: "比較対象候補。競合範囲・正式名称・対象プランはNEEDS_VERIFICATIONです。"
    },
    {
      id: stableUuid(projectSlug, "brand:emmatools"),
      brandType: "competitor",
      name: "EmmaTools",
      reading: "エマツールズ",
      domain: null,
      aliases: ["EmmaTools", "Emma Tools", "エマツールズ"],
      category: "SEOコンテンツ制作支援",
      description: "比較対象候補。競合範囲・正式名称・対象プランはNEEDS_VERIFICATIONです。"
    }
  ];

  const personas: PersonaSeed[] = [
    {
      id: stableUuid(projectSlug, "persona:b2b-marketing-lead"),
      name: "BtoBマーケティング責任者",
      segment: "BtoBマーケティング",
      weight: 1.2,
      jobs: ["SEOとAI検索の投資判断", "競合比較", "施策優先度の整理"],
      painPoints: ["AI検索でのブランド表示状況が見えにくい", "SEO施策の比較材料が分散している"]
    },
    {
      id: stableUuid(projectSlug, "persona:seo-operator"),
      name: "SEO担当者",
      segment: "SEO運用",
      weight: 1.1,
      jobs: ["キーワード調査", "記事改善", "AI回答内の参照元確認"],
      painPoints: ["AI回答で参照される情報源が把握しにくい", "改善候補の根拠確認に時間がかかる"]
    },
    {
      id: stableUuid(projectSlug, "persona:content-editor"),
      name: "コンテンツ編集責任者",
      segment: "コンテンツ制作",
      weight: 1,
      jobs: ["記事企画", "品質確認", "ファクトチェック導線の整備"],
      painPoints: ["AI回答に使われやすい情報構造が分かりにくい", "記事更新の優先順位を決めにくい"]
    },
    {
      id: stableUuid(projectSlug, "persona:business-owner"),
      name: "事業責任者",
      segment: "事業企画",
      weight: 0.9,
      jobs: ["導入候補の比較", "支援体制の確認", "費用対効果の検討材料整理"],
      painPoints: ["GEO/AIOの投資判断材料が不足している", "公式情報と第三者情報の切り分けが難しい"]
    }
  ];

  const topics: TopicSeed[] = [
    {
      id: stableUuid(projectSlug, "topic:ai-search-geo"),
      name: "AI検索・GEO対応",
      intent: "GEO/LLMO/AIO対応機能、AI検索流入、AI回答内での表示状況を確認する",
      priority: "high",
      weight: 1.3
    },
    {
      id: stableUuid(projectSlug, "topic:seo-content"),
      name: "SEOコンテンツ制作",
      intent: "SEO記事制作、AI生成、ファクトチェック、コンテンツ改善の検討材料を確認する",
      priority: "high",
      weight: 1.1
    },
    {
      id: stableUuid(projectSlug, "topic:competitive-keyword"),
      name: "競合分析・キーワード戦略",
      intent: "競合比較、キーワード戦略、AI回答内の比較文脈を確認する",
      priority: "high",
      weight: 1.2
    },
    {
      id: stableUuid(projectSlug, "topic:cases-proof"),
      name: "導入事例・実績",
      intent: "導入社数、事例、公開実績を確認する",
      priority: "medium",
      weight: 0.9
    },
    {
      id: stableUuid(projectSlug, "topic:consulting-support"),
      name: "支援体制・コンサルティング",
      intent: "GEOコンサルティング、運用支援、導入前の確認事項を整理する",
      priority: "medium",
      weight: 0.9
    }
  ];

  const prompts: PromptSeed[] = [
    {
      id: stableUuid(projectSlug, "prompt:geo-tool-comparison"),
      topicName: "AI検索・GEO対応",
      personaName: "BtoBマーケティング責任者",
      text: "SEOとAI検索（GEO/LLMO/AIO）をまとめて分析できるツール候補を比較してください。",
      intent: "比較検討",
      buyerStage: "比較",
      priority: "high"
    },
    {
      id: stableUuid(projectSlug, "prompt:mieruca-vs-competitors"),
      topicName: "競合分析・キーワード戦略",
      personaName: "BtoBマーケティング責任者",
      text: "ミエルカSEO、Keywordmap、SEARCH WRITEをBtoB企業のSEO運用で比較してください。",
      intent: "競合比較",
      buyerStage: "比較",
      priority: "high"
    },
    {
      id: stableUuid(projectSlug, "prompt:geo-source-check"),
      topicName: "AI検索・GEO対応",
      personaName: "SEO担当者",
      text: "ミエルカSEOのAI検索・GEO対応機能を確認できる信頼できる情報源を教えてください。",
      intent: "参照元確認",
      buyerStage: "調査",
      priority: "high"
    },
    {
      id: stableUuid(projectSlug, "prompt:case-proof"),
      topicName: "導入事例・実績",
      personaName: "事業責任者",
      text: "ミエルカSEOの導入事例や実績を確認できる情報源はありますか？",
      intent: "実績確認",
      buyerStage: "調査",
      priority: "medium"
    },
    {
      id: stableUuid(projectSlug, "prompt:geo-consulting-fit"),
      topicName: "支援体制・コンサルティング",
      personaName: "事業責任者",
      text: "GEOコンサルティングやAI検索支援を検討する場合、ミエルカSEOはどのような企業に向いていますか？",
      intent: "適合条件確認",
      buyerStage: "導入前確認",
      priority: "medium"
    },
    {
      id: stableUuid(projectSlug, "prompt:seo-ai-writing-tools"),
      topicName: "SEOコンテンツ制作",
      personaName: "コンテンツ編集責任者",
      text: "SEO記事制作を効率化できるAI機能を持つツール候補を比較してください。",
      intent: "代替候補比較",
      buyerStage: "比較",
      priority: "medium"
    },
    {
      id: stableUuid(projectSlug, "prompt:pre-adoption-cautions"),
      topicName: "支援体制・コンサルティング",
      personaName: "BtoBマーケティング責任者",
      text: "ミエルカSEOを導入検討する前に確認すべき条件や注意点を整理してください。",
      intent: "導入前確認",
      buyerStage: "導入前確認",
      priority: "medium"
    },
    {
      id: stableUuid(projectSlug, "prompt:owned-source-readiness"),
      topicName: "AI検索・GEO対応",
      personaName: "SEO担当者",
      text: "AI回答の参照元として使われやすいミエルカSEO公式ページはどれですか？",
      intent: "引用・参照候補確認",
      buyerStage: "調査",
      priority: "medium"
    }
  ];

  const sourceDomains: SourceDomainSeed[] = [
    {
      domain: TARGET_DOMAIN,
      sourceType: "owned",
      trustLabel: "ミエルカSEO公式公開ページ（demo setup）"
    }
  ];

  const publicPages: PublicPageSeed[] = [
    {
      url: "https://mieru-ca.com/",
      label: "公式トップ",
      purpose: "主な価値訴求、導入社数、AI検索/GEO対応訴求の確認"
    },
    {
      url: "https://mieru-ca.com/a-flow/",
      label: "SEO PDCA機能",
      purpose: "SEO運用・キーワード戦略・改善サイクルの確認"
    },
    {
      url: "https://mieru-ca.com/a-flow/ai-geo-feature-overview/",
      label: "AI検索・GEO機能一覧",
      purpose: "GEO/LLMO/AEO/AIO、AI検索流入、AI検索シェア監視などの確認"
    },
    {
      url: "https://mieru-ca.com/case/",
      label: "導入事例",
      purpose: "公開事例・実績訴求の確認"
    },
    {
      url: "https://mieru-ca.com/solution/ai-seo/",
      label: "GEOコンサルティング",
      purpose: "AI検索支援、診断、ギャップ分析、提案レポートの確認"
    }
  ];

  const manualNeedsVerification = [
    "比較ブランド候補は初期スコープです。正式な競合範囲、ブランド表記、比較対象サービスは顧客確認が必要です。",
    "公開ページから取得した訴求はデモ入力の根拠であり、AI回答で引用されることや表示率向上を保証しません。",
    "source_domainsへの登録は公式ドメインの分類だけです。citation_countやsource-to-claim supportは実測後に別途確認します。",
    "改善候補は実測データから生成・品質ゲート確認後に扱います。この準備スクリプトでは承認済み施策を作成しません。",
    "AI検索/GEOの業界表現・対象プロンプトはデモ用の初期案です。商談・公開レポート前に表現基準の確認が必要です。"
  ];

  return { project, brands, personas, topics, prompts, sourceDomains, publicPages, manualNeedsVerification };
}

async function previewPublicPages(pages: PublicPageSeed[], options: CliOptions): Promise<PublicPagePreview[]> {
  const selectedPages = pages.slice(0, options.maxPages);
  if (!options.fetchPublicPages) {
    return selectedPages.map((page) => ({
      ...page,
      status: "skipped",
      title: null,
      description: null,
      headings: [],
      error: "--no-fetch was specified"
    }));
  }

  const previews: PublicPagePreview[] = [];
  for (const page of selectedPages) {
    previews.push(await fetchPublicPagePreview(page));
  }
  return previews;
}

async function fetchPublicPagePreview(page: PublicPageSeed): Promise<PublicPagePreview> {
  if (!isAllowedPublicPage(page.url)) {
    return {
      ...page,
      status: "failed",
      title: null,
      description: null,
      headings: [],
      error: "URL is outside the public Mieruca page allowlist"
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(page.url, {
      method: "GET",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml"
      },
      signal: controller.signal
    });
    if (!response.ok) {
      return {
        ...page,
        status: "failed",
        title: null,
        description: null,
        headings: [],
        error: `HTTP ${response.status}`
      };
    }
    const html = await response.text();
    return {
      ...page,
      status: "fetched",
      title: firstText(matchTag(html, "title")),
      description: firstText(matchMetaDescription(html)),
      headings: extractHeadings(html).slice(0, 8),
      error: null
    };
  } catch (error) {
    return {
      ...page,
      status: "failed",
      title: null,
      description: null,
      headings: [],
      error: sanitizeErrorMessage(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function renderPreviewPayload(seed: DemoSeed, publicPages: PublicPagePreview[], options: CliOptions) {
  const publicFetchedInfo = {
    targetSite: "ミエルカSEO公式サイト",
    targetUrl: "https://mieru-ca.com/",
    publicPages,
    extractionPolicy: [
      "公開ページだけをGETします。",
      "ログインページ、フォーム送信、reCAPTCHA回避、認証領域の取得はしません。",
      "取得内容は計測入力の参考であり、AI回答の実測結果とは混ぜません。"
    ]
  };

  const aiMeasurementInputs = {
    project: seed.project,
    primaryBrand: seed.brands.find((brand) => brand.brandType === "primary"),
    competitorSeeds: seed.brands.filter((brand) => brand.brandType === "competitor").map((brand) => ({
      name: brand.name,
      aliases: brand.aliases,
      needsVerification: brand.domain === null
    })),
    personas: seed.personas.map(({ name, segment, jobs }) => ({ name, segment, jobs })),
    topics: seed.topics.map(({ name, intent, priority }) => ({ name, intent, priority })),
    prompts: seed.prompts.map(({ text, topicName, personaName, intent, buyerStage, priority }) => ({
      text,
      topicName,
      personaName,
      intent,
      buyerStage,
      priority
    })),
    sourceDomains: seed.sourceDomains,
    safetyNotes: [
      "プロンプトはAI回答計測の入力です。AI回答・順位・引用・改善効果を保証しません。",
      "比較ブランドはseeded comparison scopeであり、organic discoveryとは扱いません。",
      "引用元の出現数はsource-to-claim supportの証明ではありません。"
    ]
  };

  const dashboardConnection = {
    home: "実測後のlatest aggregate / home read modelにより、最新レポート中心の表示へ接続します。",
    reportOverview: "実測runとmetric_snapshots作成後、AI表示率・主要数字・上位ブランド・参照元・改善候補数へ接続します。",
    aiAnswers: "run-openai-measurement.tsがai_conversationsを作成した後に表示します。",
    brandComparison: "brand_mentionsとmetric_snapshotsの生成後に表示します。",
    sources: "web-search計測でcitations/source_domainsが作成された後に表示します。",
    recommendations: "generate/save recommendation scriptsと品質ゲート確認後に表示します。"
  };

  const commands = {
    dryRun: `npx tsx scripts/prepare-mieruca-demo-data.ts --project-slug ${seed.project.slug}`,
    dryRunNoFetch: `npx tsx scripts/prepare-mieruca-demo-data.ts --project-slug ${seed.project.slug} --no-fetch`,
    applyLocalSetup: `npx tsx scripts/prepare-mieruca-demo-data.ts --project-slug ${seed.project.slug} --apply`,
    runMeasurement: `npx tsx scripts/run-openai-measurement.ts --project-slug ${seed.project.slug} --prompt-limit 8 --search-mode both`,
    recalculateMetricsDryRun: `npx tsx scripts/recalculate-metric-snapshots.ts --project-slug ${seed.project.slug} --source-run-id <measurementRunId> --search-mode combined`,
    recalculateMetricsApply: `npx tsx scripts/recalculate-metric-snapshots.ts --project-slug ${seed.project.slug} --source-run-id <measurementRunId> --search-mode combined --apply`,
    generateRecommendationCandidates: `npx tsx scripts/generate-recommendation-candidates.ts --project-slug ${seed.project.slug} --measurement-run-id <measurementRunId>`,
    saveRecommendationCandidatesLocal: `npx tsx scripts/save-recommendation-candidates.ts --input output/recommendation-candidates/recommendation-candidates.json --apply`
  };

  return {
    mode: options.apply ? "apply-preview-before-write" : "dry-run",
    projectSlug: seed.project.slug,
    dbWritePolicy: {
      writesOnDryRun: 0,
      writesOnApply: ["organizations", "projects", "brands", "personas", "topics", "prompts", "source_domains"],
      neverWritesHere: [
        "measurement_runs",
        "run_items",
        "ai_conversations",
        "brand_mentions",
        "citations",
        "metric_snapshots",
        "recommendations"
      ]
    },
    publicFetchedInfo,
    aiMeasurementInputs,
    manualNeedsVerification: seed.manualNeedsVerification,
    dashboardConnection,
    commands,
    productionSafety: [
      "本番DBへ直接applyしません。まずdry-runのJSONをレビューします。",
      "本番投入が必要な場合は、対象projectSlug、投入先DB、バックアップ、ロールバック手順を明示して承認後に実行します。",
      "非ローカルDBへのapplyはデフォルトで拒否します。承認済みの接続先だけ --allow-non-local-db を使います。",
      "実測データはrun-openai-measurement.tsで作成し、準備データとは分けます。"
    ]
  };
}

async function applySeed(db: LocalPostgresClient, seed: DemoSeed): Promise<ApplySummary> {
  await db.query("begin");
  try {
    const organizationId = await upsertOrganization(db, seed.project);
    const projectId = await upsertProject(db, organizationId, seed.project);
    const brandIds = new Map<string, string>();

    for (const brand of seed.brands) {
      const brandId = await upsertBrand(db, projectId, brand);
      brandIds.set(brand.name, brandId);
    }
    for (const persona of seed.personas) {
      await upsertPersona(db, projectId, persona);
    }
    for (const topic of seed.topics) {
      await upsertTopic(db, projectId, topic);
    }
    for (const prompt of seed.prompts) {
      await upsertPrompt(db, projectId, seed, prompt);
    }
    for (const sourceDomain of seed.sourceDomains) {
      await upsertSourceDomain(db, projectId, sourceDomain, brandIds.get("ミエルカSEO") ?? null);
    }

    await db.query("commit");
    return {
      organizationId,
      projectId,
      organizationsUpserted: 1,
      projectUpserted: 1,
      brandsUpserted: seed.brands.length,
      personasUpserted: seed.personas.length,
      topicsUpserted: seed.topics.length,
      promptsUpserted: seed.prompts.length,
      sourceDomainsUpserted: seed.sourceDomains.length,
      measurementRowsWritten: 0
    };
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  }
}

async function upsertOrganization(db: LocalPostgresClient, project: ProjectSeed): Promise<string> {
  const rows = await db.query<{ id: string }>(`
    insert into public.organizations (
      slug, name, organization_type, data_environment, is_internal, is_demo
    )
    values (
      ${lit(project.organizationSlug)},
      ${lit(project.organizationName)},
      'internal',
      'demo',
      true,
      true
    )
    on conflict (slug)
    do update set
      name = excluded.name,
      organization_type = excluded.organization_type,
      data_environment = excluded.data_environment,
      is_internal = excluded.is_internal,
      is_demo = excluded.is_demo
    returning id::text as id
  `);
  return single(rows, `upsert organization ${project.organizationSlug}`).id;
}

async function upsertProject(db: LocalPostgresClient, organizationId: string, project: ProjectSeed): Promise<string> {
  const rows = await db.query<{ id: string }>(`
    insert into public.projects (organization_id, slug, name, workspace_name, language, region, default_period)
    values (
      ${uuid(organizationId)},
      ${lit(project.slug)},
      ${lit(project.name)},
      ${lit(project.workspaceName)},
      ${lit(project.language)},
      ${lit(project.region)},
      ${lit(project.defaultPeriod)}
    )
    on conflict (slug)
    do update set
      organization_id = excluded.organization_id,
      name = excluded.name,
      workspace_name = excluded.workspace_name,
      language = excluded.language,
      region = excluded.region,
      default_period = excluded.default_period
    returning id::text as id
  `);
  return single(rows, `upsert project ${project.slug}`).id;
}

async function upsertBrand(db: LocalPostgresClient, projectId: string, brand: BrandSeed): Promise<string> {
  const rows = await db.query<{ id: string }>(`
    insert into public.brands (
      id, project_id, brand_type, name, reading, domain, aliases, category, description, is_active
    )
    values (
      ${uuid(brand.id)},
      ${uuid(projectId)},
      ${lit(brand.brandType)},
      ${lit(brand.name)},
      ${nullable(brand.reading)},
      ${nullable(brand.domain)},
      ${jsonb(brand.aliases)},
      ${lit(brand.category)},
      ${lit(brand.description)},
      true
    )
    on conflict (id)
    do update set
      project_id = excluded.project_id,
      brand_type = excluded.brand_type,
      name = excluded.name,
      reading = excluded.reading,
      domain = excluded.domain,
      aliases = excluded.aliases,
      category = excluded.category,
      description = excluded.description,
      is_active = true
    returning id::text as id
  `);
  return single(rows, `upsert brand ${brand.name}`).id;
}

async function upsertPersona(db: LocalPostgresClient, projectId: string, persona: PersonaSeed) {
  await db.query(`
    insert into public.personas (
      id, project_id, name, segment, weight, jobs, pain_points, is_active
    )
    values (
      ${uuid(persona.id)},
      ${uuid(projectId)},
      ${lit(persona.name)},
      ${lit(persona.segment)},
      ${num(persona.weight)},
      ${jsonb(persona.jobs)},
      ${jsonb(persona.painPoints)},
      true
    )
    on conflict (id)
    do update set
      project_id = excluded.project_id,
      name = excluded.name,
      segment = excluded.segment,
      weight = excluded.weight,
      jobs = excluded.jobs,
      pain_points = excluded.pain_points,
      is_active = true
  `);
}

async function upsertTopic(db: LocalPostgresClient, projectId: string, topic: TopicSeed) {
  await db.query(`
    insert into public.topics (id, project_id, name, intent, priority, weight, is_active)
    values (
      ${uuid(topic.id)},
      ${uuid(projectId)},
      ${lit(topic.name)},
      ${lit(topic.intent)},
      ${lit(topic.priority)},
      ${num(topic.weight)},
      true
    )
    on conflict (id)
    do update set
      project_id = excluded.project_id,
      name = excluded.name,
      intent = excluded.intent,
      priority = excluded.priority,
      weight = excluded.weight,
      is_active = true
  `);
}

async function upsertPrompt(db: LocalPostgresClient, projectId: string, seed: DemoSeed, prompt: PromptSeed) {
  const topic = seed.topics.find((item) => item.name === prompt.topicName);
  const persona = seed.personas.find((item) => item.name === prompt.personaName);
  if (!topic || !persona) {
    throw new Error(`Missing topic or persona for prompt: ${prompt.text}`);
  }

  await db.query(`
    insert into public.prompts (
      id, project_id, topic_id, persona_id, text, intent, buyer_stage, priority, is_active
    )
    values (
      ${uuid(prompt.id)},
      ${uuid(projectId)},
      ${uuid(topic.id)},
      ${uuid(persona.id)},
      ${lit(prompt.text)},
      ${lit(prompt.intent)},
      ${lit(prompt.buyerStage)},
      ${lit(prompt.priority)},
      true
    )
    on conflict (id)
    do update set
      project_id = excluded.project_id,
      topic_id = excluded.topic_id,
      persona_id = excluded.persona_id,
      text = excluded.text,
      intent = excluded.intent,
      buyer_stage = excluded.buyer_stage,
      priority = excluded.priority,
      is_active = true
  `);
}

async function upsertSourceDomain(
  db: LocalPostgresClient,
  projectId: string,
  sourceDomain: SourceDomainSeed,
  ownerBrandId: string | null
) {
  await db.query(`
    insert into public.source_domains (project_id, domain, source_type, owner_brand_id, trust_label)
    values (
      ${uuid(projectId)},
      ${lit(sourceDomain.domain)},
      ${lit(sourceDomain.sourceType)},
      ${nullableUuid(ownerBrandId)},
      ${lit(sourceDomain.trustLabel)}
    )
    on conflict (project_id, domain)
    do update set
      source_type = excluded.source_type,
      owner_brand_id = excluded.owner_brand_id,
      trust_label = excluded.trust_label
  `);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    apply: false,
    projectSlug: DEFAULT_PROJECT_SLUG,
    databaseUrl: process.env.RECORA_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
    maxPages: DEFAULT_MAX_PAGES,
    fetchPublicPages: true,
    allowNonLocalDb: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.apply = false;
      continue;
    }
    if (arg === "--project-slug") {
      options.projectSlug = readNext(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--project-slug=")) {
      options.projectSlug = arg.slice("--project-slug=".length);
      continue;
    }
    if (arg === "--database-url") {
      options.databaseUrl = readNext(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--database-url=")) {
      options.databaseUrl = arg.slice("--database-url=".length);
      continue;
    }
    if (arg === "--max-pages") {
      options.maxPages = parsePositiveInt(readNext(args, index, arg), arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--max-pages=")) {
      options.maxPages = parsePositiveInt(arg.slice("--max-pages=".length), "--max-pages");
      continue;
    }
    if (arg === "--no-fetch") {
      options.fetchPublicPages = false;
      continue;
    }
    if (arg === "--allow-non-local-db") {
      options.allowNonLocalDb = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(options.projectSlug)) {
    throw new Error("--project-slug must be lowercase kebab-case.");
  }
  options.maxPages = Math.min(Math.max(options.maxPages, 0), DEFAULT_MAX_PAGES);
  return options;
}

function readNext(args: string[], index: number, arg: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
  return value;
}

function parsePositiveInt(value: string, arg: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${arg} must be a non-negative integer.`);
  return parsed;
}

function assertLocalDatabaseUrl(databaseUrl: string, allowNonLocalDb: boolean) {
  const url = new URL(databaseUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (localHosts.has(url.hostname)) return;
  if (allowNonLocalDb) return;
  throw new Error(
    "Refusing to apply to a non-local database. Review the dry-run output first, then pass --allow-non-local-db only for an explicitly approved target."
  );
}

function stableUuid(namespace: string, name: string) {
  const hash = createHash("sha256").update(`recora:mieruca-demo:${namespace}:${name}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function toTokyoDateOnly(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function isAllowedPublicPage(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") return false;
  if (url.hostname !== TARGET_DOMAIN) return false;
  if (url.search || url.hash) return false;
  const deniedFragments = ["/login", "/signin", "/contact", "/form", "/wp-admin", "/mypage"];
  return !deniedFragments.some((fragment) => url.pathname.includes(fragment));
}

function matchTag(html: string, tag: string) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(html);
  return match?.[1] ?? null;
}

function matchMetaDescription(html: string) {
  const match = /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i.exec(html);
  if (match?.[1]) return match[1];
  const reverseMatch = /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i.exec(html);
  return reverseMatch?.[1] ?? null;
}

function extractHeadings(html: string) {
  const headings: string[] = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = firstText(match[1]);
    if (text && !headings.includes(text)) headings.push(text);
  }
  return headings;
}

function firstText(value: string | null) {
  if (!value) return null;
  const stripped = decodeHtmlEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  const normalized = stripped.replace(/\s+/g, " ").trim();
  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function nullable(value: string | null | undefined) {
  return value ? lit(value) : "null";
}

function num(value: number) {
  return Number.isFinite(value) ? String(value) : "null";
}

function uuid(value: string) {
  return `${lit(value)}::uuid`;
}

function nullableUuid(value: string | null | undefined) {
  return value ? uuid(value) : "null";
}

function jsonb(value: unknown) {
  return `${lit(JSON.stringify(value))}::jsonb`;
}

function single<T>(rows: T[], label: string): T {
  if (rows.length !== 1) throw new Error(`${label} returned ${rows.length} rows.`);
  return rows[0]!;
}

function sanitizeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.replace(/postgres:\/\/[^@\s]+@/gi, "postgres://***@");
  return String(error).replace(/postgres:\/\/[^@\s]+@/gi, "postgres://***@");
}

class LocalPostgresClient {
  private socket: net.Socket | null = null;
  private buffer = Buffer.alloc(0);
  private waiters: Array<() => void> = [];
  private readonly url: URL;

  constructor(databaseUrl: string) {
    this.url = new URL(databaseUrl);
  }

  async connect() {
    const socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port || 5432) });
    this.socket = socket;
    socket.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      for (const waiter of this.waiters.splice(0)) waiter();
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    this.sendStartup();
    await this.authenticate();
  }

  end() {
    if (!this.socket || this.socket.destroyed) return;
    this.sendMessage("X", Buffer.alloc(0));
    this.socket.end();
  }

  async query<T extends Row = Row>(queryText: string): Promise<T[]> {
    this.sendMessage("Q", Buffer.from(`${queryText}\0`, "utf8"));
    const fields: string[] = [];
    const rows: T[] = [];
    while (true) {
      const message = await this.readMessage();
      if (message.type === "T") fields.splice(0, fields.length, ...parseRowDescription(message.payload));
      else if (message.type === "D") rows.push(parseDataRow<T>(message.payload, fields));
      else if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      else if (message.type === "Z") return rows;
    }
  }

  private sendStartup() {
    const params = Buffer.from(`user\0${this.user}\0database\0${this.database}\0client_encoding\0UTF8\0\0`, "utf8");
    const protocol = Buffer.alloc(4);
    protocol.writeInt32BE(196608, 0);
    this.sendRaw(Buffer.concat([int32(8 + params.length), protocol, params]));
  }

  private async authenticate() {
    while (true) {
      const message = await this.readMessage();
      if (message.type === "R") {
        const code = message.payload.readInt32BE(0);
        if (code === 0 || code === 11 || code === 12) continue;
        if (code === 3) {
          this.sendPassword(this.password);
          continue;
        }
        if (code === 5) {
          this.sendPassword(buildMd5Password(this.user, this.password, message.payload.subarray(4, 8)));
          continue;
        }
        if (code === 10) {
          await this.handleScram(message.payload.subarray(4));
          continue;
        }
        throw new Error(`Unsupported PostgreSQL authentication request: ${code}`);
      }
      if (message.type === "E") throw new Error(parseErrorResponse(message.payload));
      if (message.type === "Z") return;
    }
  }

  private async handleScram(payload: Buffer) {
    const mechanisms = payload.toString("utf8").split("\0").filter(Boolean);
    if (!mechanisms.includes("SCRAM-SHA-256")) throw new Error(`Unsupported SASL mechanisms: ${mechanisms.join(", ")}`);

    const clientNonce = randomBytes(18).toString("base64url");
    const clientFirstBare = `n=*,r=${clientNonce}`;
    this.sendSaslInitial("SCRAM-SHA-256", `n,,${clientFirstBare}`);

    const serverFirstMessage = await this.readMessage();
    if (serverFirstMessage.type === "E") throw new Error(parseErrorResponse(serverFirstMessage.payload));
    if (serverFirstMessage.type !== "R" || serverFirstMessage.payload.readInt32BE(0) !== 11) {
      throw new Error("Unexpected PostgreSQL SASL first response.");
    }

    const serverFirst = serverFirstMessage.payload.subarray(4).toString("utf8");
    const attributes = parseScramAttributes(serverFirst);
    const serverNonce = attributes.r;
    const salt = attributes.s ? Buffer.from(attributes.s, "base64") : null;
    const iterations = Number(attributes.i);
    if (!serverNonce || !serverNonce.startsWith(clientNonce) || !salt || !Number.isFinite(iterations)) {
      throw new Error("Invalid PostgreSQL SCRAM challenge.");
    }

    const clientFinalWithoutProof = `c=biws,r=${serverNonce}`;
    const authMessage = `${clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
    const saltedPassword = pbkdf2Sync(this.password, salt, iterations, 32, "sha256");
    const clientKey = createHmac("sha256", saltedPassword).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const signature = createHmac("sha256", storedKey).update(authMessage).digest();
    this.sendSaslResponse(`${clientFinalWithoutProof},p=${xorBuffers(clientKey, signature).toString("base64")}`);
  }

  private sendPassword(password: string) {
    this.sendMessage("p", Buffer.from(`${password}\0`, "utf8"));
  }

  private sendSaslInitial(mechanism: string, response: string) {
    const mechanismBuffer = Buffer.from(`${mechanism}\0`, "utf8");
    const responseBuffer = Buffer.from(response, "utf8");
    this.sendMessage("p", Buffer.concat([mechanismBuffer, int32(responseBuffer.length), responseBuffer]));
  }

  private sendSaslResponse(response: string) {
    this.sendMessage("p", Buffer.from(response, "utf8"));
  }

  private sendMessage(type: string, payload: Buffer) {
    this.sendRaw(Buffer.concat([Buffer.from(type, "utf8"), int32(payload.length + 4), payload]));
  }

  private sendRaw(payload: Buffer) {
    if (!this.socket || this.socket.destroyed) throw new Error("PostgreSQL socket is not connected.");
    this.socket.write(payload);
  }

  private async readMessage(): Promise<PgMessage> {
    await this.waitForBytes(5);
    const type = this.buffer.subarray(0, 1).toString("utf8");
    const length = this.buffer.readInt32BE(1);
    const totalLength = length + 1;
    await this.waitForBytes(totalLength);
    const payload = this.buffer.subarray(5, totalLength);
    this.buffer = this.buffer.subarray(totalLength);
    return { type, payload };
  }

  private async waitForBytes(size: number) {
    while (this.buffer.length < size) {
      await new Promise<void>((resolve, reject) => {
        const socket = this.socket;
        if (!socket) {
          reject(new Error("PostgreSQL socket is not connected."));
          return;
        }
        const cleanup = () => {
          socket.off("error", onError);
          socket.off("close", onClose);
          const index = this.waiters.indexOf(onData);
          if (index >= 0) this.waiters.splice(index, 1);
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const onClose = () => {
          cleanup();
          reject(new Error("PostgreSQL socket closed before response was complete."));
        };
        const onData = () => {
          cleanup();
          resolve();
        };
        this.waiters.push(onData);
        socket.once("error", onError);
        socket.once("close", onClose);
      });
    }
  }

  private get user() {
    return decodeURIComponent(this.url.username || "postgres");
  }

  private get password() {
    return decodeURIComponent(this.url.password || "");
  }

  private get database() {
    return decodeURIComponent(this.url.pathname.replace(/^\//, "") || "postgres");
  }
}

function int32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function parseRowDescription(payload: Buffer) {
  const fieldCount = payload.readInt16BE(0);
  const names: string[] = [];
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const end = payload.indexOf(0, offset);
    names.push(payload.subarray(offset, end).toString("utf8"));
    offset = end + 19;
  }
  return names;
}

function parseDataRow<T extends Row>(payload: Buffer, fields: string[]) {
  const row: Row = {};
  const fieldCount = payload.readInt16BE(0);
  let offset = 2;
  for (let index = 0; index < fieldCount; index += 1) {
    const length = payload.readInt32BE(offset);
    offset += 4;
    if (length === -1) {
      row[fields[index] ?? `column_${index}`] = null;
      continue;
    }
    row[fields[index] ?? `column_${index}`] = payload.subarray(offset, offset + length).toString("utf8");
    offset += length;
  }
  return row as T;
}

function parseErrorResponse(payload: Buffer) {
  const fields: Record<string, string> = {};
  let offset = 0;
  while (offset < payload.length && payload[offset] !== 0) {
    const code = String.fromCharCode(payload[offset]!);
    offset += 1;
    const end = payload.indexOf(0, offset);
    fields[code] = payload.subarray(offset, end).toString("utf8");
    offset = end + 1;
  }
  return fields.M || "PostgreSQL returned an error.";
}

function parseScramAttributes(value: string) {
  const attributes: Record<string, string> = {};
  for (const part of value.split(",")) attributes[part.slice(0, 1)] = part.slice(2);
  return attributes;
}

function buildMd5Password(user: string, password: string, salt: Buffer) {
  const inner = createHash("md5").update(`${password}${user}`).digest("hex");
  return `md5${createHash("md5").update(Buffer.concat([Buffer.from(inner), salt])).digest("hex")}`;
}

function xorBuffers(left: Buffer, right: Buffer) {
  const result = Buffer.alloc(Math.min(left.length, right.length));
  for (let index = 0; index < result.length; index += 1) result[index] = left[index]! ^ right[index]!;
  return result;
}

main().catch((error: unknown) => {
  console.error(sanitizeErrorMessage(error));
  process.exitCode = 1;
});
