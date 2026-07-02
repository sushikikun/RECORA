import {
  PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
  derivePromptMetricEligibility,
  getBrandIdentityFromDraft,
  getProjectSetupDraftMaterializationDecision,
  getPromptMeasurementReadiness,
  promptTextContainsBrandSignal,
  validateProjectSetupDraft,
  validateProjectSetupSeedInput
} from "./project-setup-draft";
import type {
  BrandIdentityForDraft,
  BuyerStage,
  DraftReviewStatus,
  InputCompletionItem,
  MetricEligiblePromptIds,
  PersonaDraft,
  PersonaPromptReadiness,
  PersonaRoleType,
  ProjectSetupDraft,
  ProjectSetupDraftValidation,
  ProjectSetupSeedInput,
  PromptBrandMentionRule,
  PromptCandidateMentionOpportunity,
  PromptCategory,
  PromptCompetitorMentionRule,
  PromptDraft,
  PromptGateDecision,
  PromptIntent,
  PromptIntentType,
  PromptLanguageMode,
  PromptRankingOpportunity,
  PromptResponseShape,
  PromptSeedContaminationRisk,
  SourceStatus,
  TopicDraft,
  TopicMetricTarget,
  TopicType
} from "./project-setup-draft";

export const PROJECT_SETUP_DRAFT_GENERATOR_VERSION = "project_setup_draft_generator_v1" as const;

const GENERATED_DRAFT_REVIEW_STATUS: DraftReviewStatus = "needs_review";
const GENERATED_ITEM_REVIEW_STATUS: DraftReviewStatus = "needs_review";
const DEFAULT_GENERATED_AT: string | null = null;
const MAX_GENERATED_PERSONAS = 5;
const MAX_PROMPTS_PER_TOPIC = 4;
const MAX_GENERATED_PROMPTS = 18;

type BusinessModelKind =
  | "b2b_software"
  | "b2b_service"
  | "b2c_service"
  | "local_service"
  | "ecommerce"
  | "education"
  | "healthcare"
  | "professional_service"
  | "real_estate"
  | "recruiting_hr"
  | "unknown";

export type ServiceEvidenceTerm = {
  term: string;
  normalized: string;
  source:
    | "brand"
    | "url_metadata"
    | "service_description"
    | "category"
    | "audience"
    | "goal"
    | "competitor"
    | "region";
  weight: number;
};

export type CategoryCandidateProfile =
  | "seo_ai_search"
  | "marketing_seo"
  | "b2b_saas_tool"
  | "recruiting_hr"
  | "professional_service"
  | "healthcare_clinic"
  | "school_education"
  | "local_service"
  | "ecommerce_product"
  | "real_estate"
  | "finance_investment"
  | "other";

export type CategoryCandidate = {
  label: string;
  profile: CategoryCandidateProfile;
  score: number;
  reasons: readonly string[];
};

export type QuestionAreaMetricHint =
  | "visibility"
  | "comparison"
  | "evidence"
  | "risk"
  | "reputation"
  | "local"
  | "sentiment";

export type QuestionAreaCandidate = {
  label: string;
  description: string;
  sourceTopicType?: TopicType;
  score: number;
  reasons: readonly string[];
  metricHint: QuestionAreaMetricHint;
};

type GeneratedTopicKey =
  | "category-discovery"
  | "problem-solution"
  | "selection-criteria"
  | "alternative-search"
  | "pricing-reputation"
  | "regulated-risk"
  | "citation-check"
  | "branded-sentiment"
  | "local-regional";

type GenerationContext = {
  seed: ProjectSetupSeedInput;
  seedHash: string;
  isJapanese: boolean;
  isB2B: boolean;
  isLocal: boolean;
  isRegulatedOrHighTrust: boolean;
  businessModel: BusinessModelKind;
  industryAdapter: string;
  categoryLabel: string;
  serviceEvidenceTerms: readonly ServiceEvidenceTerm[];
  categoryCandidate: CategoryCandidate;
  categoryCandidates: readonly CategoryCandidate[];
  questionAreaCandidates: readonly QuestionAreaCandidate[];
  targetCustomerLabel: string;
  regionLabel: string;
  warnings: string[];
  riskFlags: string[];
};

type PersonaSpec = {
  key: string;
  displayName: string;
  roleType: PersonaRoleType;
  detailedDecisionRole: string;
  roleMappingReason: string;
  buyerStage: BuyerStage;
  promptReadiness: PersonaPromptReadiness;
  confidenceOffset: number;
};

type PromptSpec = {
  text: string;
  rawUserIntent: string;
  languageMode: PromptLanguageMode;
  category: PromptCategory;
  intent: PromptIntent;
  intentType: PromptIntentType;
  brandingMode: PromptDraft["brandingMode"];
  brandMentionRule: PromptBrandMentionRule;
  competitorMentionRule: PromptCompetitorMentionRule;
  responseShape: PromptResponseShape;
  candidateMentionOpportunity: PromptCandidateMentionOpportunity;
  rankingOpportunity: PromptRankingOpportunity;
  qualityScore: number;
  gateDecision: PromptGateDecision;
  gateReason: string;
  seedTerms: readonly string[];
  seedContaminationRisk: PromptSeedContaminationRisk;
  confidenceScore: number;
  riskFlags: readonly string[];
};

type PromptVariantSpec = PromptSpec & {
  variantKey: string;
};

type CategoryScoringRule = {
  label: string;
  profile: CategoryCandidateProfile;
  businessModel: BusinessModelKind;
  industryAdapter: string;
  weightedTerms: readonly { term: string; weight: number }[];
  audienceTerms?: readonly { term: string; weight: number }[];
};

const CATEGORY_SCORING_RULES: readonly CategoryScoringRule[] = [
  {
    label: "AI search / GEO support",
    profile: "seo_ai_search",
    businessModel: "b2b_software",
    industryAdapter: "b2b_saas",
    weightedTerms: [
      { term: "ai search", weight: 5 },
      { term: "ai visibility", weight: 5 },
      { term: "ai answer", weight: 4 },
      { term: "geo", weight: 4 },
      { term: "llmo", weight: 4 },
      { term: "aio", weight: 3 },
      { term: "citation", weight: 3 },
      { term: "chatgpt", weight: 3 },
      { term: "perplexity", weight: 3 },
      { term: "ai検索", weight: 6 },
      { term: "ai回答", weight: 5 },
      { term: "ai露出", weight: 5 },
      { term: "生成ai", weight: 4 },
      { term: "引用", weight: 3 },
      { term: "llm", weight: 2 },
      { term: "seo", weight: 2 }
    ],
    audienceTerms: [
      { term: "marketing", weight: 2 },
      { term: "seo", weight: 2 },
      { term: "マーケティング", weight: 2 },
      { term: "seo担当", weight: 2 }
    ]
  },
  {
    label: "SEO / marketing support",
    profile: "marketing_seo",
    businessModel: "b2b_service",
    industryAdapter: "b2b_service",
    weightedTerms: [
      { term: "seo", weight: 4 },
      { term: "content marketing", weight: 4 },
      { term: "marketing", weight: 3 },
      { term: "traffic", weight: 2 },
      { term: "conversion", weight: 2 },
      { term: "検索順位", weight: 4 },
      { term: "コンテンツ", weight: 3 },
      { term: "マーケティング", weight: 3 },
      { term: "流入", weight: 2 },
      { term: "広告", weight: 2 }
    ]
  },
  {
    label: "BtoB SaaS / business tool",
    profile: "b2b_saas_tool",
    businessModel: "b2b_software",
    industryAdapter: "b2b_saas",
    weightedTerms: [
      { term: "saas", weight: 5 },
      { term: "software", weight: 4 },
      { term: "platform", weight: 4 },
      { term: "workflow", weight: 3 },
      { term: "crm", weight: 3 },
      { term: "automation", weight: 3 },
      { term: "system", weight: 2 },
      { term: "tool", weight: 2 },
      { term: "クラウド", weight: 4 },
      { term: "システム", weight: 4 },
      { term: "ツール", weight: 3 },
      { term: "業務", weight: 3 },
      { term: "管理", weight: 2 },
      { term: "導入", weight: 2 }
    ],
    audienceTerms: [
      { term: "b2b", weight: 3 },
      { term: "btob", weight: 3 },
      { term: "法人", weight: 3 },
      { term: "企業", weight: 2 }
    ]
  },
  {
    label: "Recruiting / HR support",
    profile: "recruiting_hr",
    businessModel: "recruiting_hr",
    industryAdapter: "recruiting_hr",
    weightedTerms: [
      { term: "recruiting", weight: 5 },
      { term: "recruitment", weight: 5 },
      { term: "ats", weight: 5 },
      { term: "hr", weight: 4 },
      { term: "hiring", weight: 4 },
      { term: "staffing", weight: 3 },
      { term: "採用", weight: 6 },
      { term: "人事", weight: 4 },
      { term: "候補者", weight: 4 },
      { term: "求人", weight: 3 },
      { term: "面接", weight: 3 },
      { term: "hr", weight: 3 }
    ]
  },
  {
    label: "Professional service / consulting",
    profile: "professional_service",
    businessModel: "professional_service",
    industryAdapter: "professional_services",
    weightedTerms: [
      { term: "consulting", weight: 5 },
      { term: "agency", weight: 4 },
      { term: "advisory", weight: 4 },
      { term: "professional service", weight: 4 },
      { term: "law firm", weight: 3 },
      { term: "accounting", weight: 3 },
      { term: "consultant", weight: 3 },
      { term: "コンサル", weight: 5 },
      { term: "支援", weight: 3 },
      { term: "代行", weight: 3 },
      { term: "士業", weight: 4 },
      { term: "専門", weight: 2 }
    ]
  },
  {
    label: "Clinic / healthcare",
    profile: "healthcare_clinic",
    businessModel: "healthcare",
    industryAdapter: "clinic_healthcare",
    weightedTerms: [
      { term: "clinic", weight: 5 },
      { term: "hospital", weight: 5 },
      { term: "healthcare", weight: 4 },
      { term: "medical", weight: 4 },
      { term: "dental", weight: 4 },
      { term: "treatment", weight: 3 },
      { term: "クリニック", weight: 6 },
      { term: "病院", weight: 5 },
      { term: "医療", weight: 5 },
      { term: "歯科", weight: 4 },
      { term: "美容医療", weight: 4 },
      { term: "治療", weight: 3 }
    ]
  },
  {
    label: "School / education",
    profile: "school_education",
    businessModel: "education",
    industryAdapter: "education_school",
    weightedTerms: [
      { term: "school", weight: 5 },
      { term: "course", weight: 4 },
      { term: "lesson", weight: 4 },
      { term: "education", weight: 4 },
      { term: "english conversation", weight: 4 },
      { term: "スクール", weight: 6 },
      { term: "教室", weight: 5 },
      { term: "講座", weight: 4 },
      { term: "教育", weight: 4 },
      { term: "英会話", weight: 4 },
      { term: "学習", weight: 3 },
      { term: "塾", weight: 3 },
      { term: "講師", weight: 2 }
    ]
  },
  {
    label: "Local service",
    profile: "local_service",
    businessModel: "local_service",
    industryAdapter: "local_service",
    weightedTerms: [
      { term: "local", weight: 4 },
      { term: "nearby", weight: 4 },
      { term: "restaurant", weight: 3 },
      { term: "salon", weight: 3 },
      { term: "booking", weight: 3 },
      { term: "area", weight: 2 },
      { term: "地域", weight: 5 },
      { term: "近く", weight: 4 },
      { term: "店舗", weight: 4 },
      { term: "予約", weight: 3 },
      { term: "整体", weight: 3 },
      { term: "サロン", weight: 3 },
      { term: "飲食", weight: 3 }
    ]
  },
  {
    label: "EC / product purchase",
    profile: "ecommerce_product",
    businessModel: "ecommerce",
    industryAdapter: "ecommerce_product",
    weightedTerms: [
      { term: "ecommerce", weight: 5 },
      { term: "online shop", weight: 5 },
      { term: "d2c", weight: 5 },
      { term: "product", weight: 2 },
      { term: "cart", weight: 2 },
      { term: "shop", weight: 2 },
      { term: "通販", weight: 5 },
      { term: "ecサイト", weight: 5 },
      { term: "ec", weight: 4 },
      { term: "d2c", weight: 4 },
      { term: "商品", weight: 3 },
      { term: "購入", weight: 3 },
      { term: "返品", weight: 3 },
      { term: "定期購入", weight: 3 },
      { term: "マットレス", weight: 3 },
      { term: "化粧品", weight: 3 },
      { term: "スキンケア", weight: 3 }
    ]
  },
  {
    label: "Real estate",
    profile: "real_estate",
    businessModel: "real_estate",
    industryAdapter: "real_estate",
    weightedTerms: [
      { term: "real estate", weight: 5 },
      { term: "property", weight: 4 },
      { term: "rent", weight: 3 },
      { term: "mortgage", weight: 3 },
      { term: "不動産", weight: 6 },
      { term: "賃貸", weight: 4 },
      { term: "売買", weight: 4 },
      { term: "住宅", weight: 3 },
      { term: "物件", weight: 3 }
    ]
  },
  {
    label: "Finance / investment",
    profile: "finance_investment",
    businessModel: "b2c_service",
    industryAdapter: "minimum_input_generic",
    weightedTerms: [
      { term: "finance", weight: 5 },
      { term: "investment", weight: 5 },
      { term: "insurance", weight: 4 },
      { term: "loan", weight: 3 },
      { term: "金融", weight: 6 },
      { term: "投資", weight: 5 },
      { term: "保険", weight: 4 },
      { term: "ローン", weight: 3 }
    ]
  }
] as const;

const OTHER_CATEGORY_CANDIDATE: CategoryCandidate = {
  label: "Other service",
  profile: "other",
  score: 1,
  reasons: ["fallback:no_strong_service_evidence"]
};

export type ProjectSetupDraftGenerationOptions = {
  generatedAt?: string | null;
  projectSlug?: string | null;
  promptSetVersion?: string | null;
};

export type ProjectSetupDraftGenerationSummary = {
  seedHash: string;
  inputMode: "minimum_input" | "blocked";
  businessModel: BusinessModelKind;
  generatedCounts: {
    personas: number;
    topics: number;
    prompts: number;
    competitors: number;
    citationAngles: number;
    pageImprovementAngles: number;
  };
  metricEligiblePromptIds: MetricEligiblePromptIds;
  materializationReady: boolean;
  notes: string[];
};

export type ProjectSetupDraftGenerationResult = {
  draft: ProjectSetupDraft;
  blockers: string[];
  warnings: string[];
  generatorVersion: typeof PROJECT_SETUP_DRAFT_GENERATOR_VERSION;
  generatedAt: string | null;
  generationSummary: ProjectSetupDraftGenerationSummary;
};

export function generateProjectSetupDraft(
  seed: ProjectSetupSeedInput,
  options: ProjectSetupDraftGenerationOptions = {}
): ProjectSetupDraftGenerationResult {
  const normalizedSeed = normalizeSeedInput(seed);
  const context = buildGenerationContext(normalizedSeed);
  const seedBlockers = validateProjectSetupSeedInput(normalizedSeed);

  if (seedBlockers.length > 0) {
    const draft = buildProjectSetupDraft({
      context,
      inputCompletion: buildInputCompletion(normalizedSeed, context),
      personas: [],
      topics: [],
      prompts: [],
      options
    });
    const validation = validateGeneratedProjectSetupDraft(draft);
    return buildGenerationResult({
      context,
      draft,
      blockers: uniqueStrings([...seedBlockers, ...validation.blockers]),
      warnings: uniqueStrings([...context.warnings, ...validation.warnings]),
      generatedAt: options.generatedAt ?? DEFAULT_GENERATED_AT
    });
  }

  const personas = generatePersonaDrafts(normalizedSeed);
  const topics = generateTopicDrafts(normalizedSeed, personas);
  const prompts = generatePromptDrafts(normalizedSeed, personas, topics);
  const draft = deduplicateProjectSetupDraft(
    buildProjectSetupDraft({
      context,
      inputCompletion: buildInputCompletion(normalizedSeed, context),
      personas,
      topics,
      prompts,
      options
    })
  );
  const validation = validateGeneratedProjectSetupDraft(draft);

  return buildGenerationResult({
    context,
    draft,
    blockers: validation.blockers,
    warnings: uniqueStrings([...context.warnings, ...validation.warnings]),
    generatedAt: options.generatedAt ?? DEFAULT_GENERATED_AT
  });
}

export function generatePersonaDrafts(seed: ProjectSetupSeedInput): PersonaDraft[] {
  const normalizedSeed = normalizeSeedInput(seed);
  if (validateProjectSetupSeedInput(normalizedSeed).length > 0) return [];

  const context = buildGenerationContext(normalizedSeed);
  const builders = buildPersonaSpecs(context);
  const uniqueSpecs = uniqueBy(builders, (spec) => `${spec.key}:${spec.roleType}:${spec.buyerStage}`);

  return uniqueSpecs.slice(0, MAX_GENERATED_PERSONAS).map((spec) => createPersonaDraft(context, spec));
}

export function generateTopicDrafts(seed: ProjectSetupSeedInput, personas: readonly PersonaDraft[]): TopicDraft[] {
  const normalizedSeed = normalizeSeedInput(seed);
  if (validateProjectSetupSeedInput(normalizedSeed).length > 0 || personas.length === 0) return [];

  const context = buildGenerationContext(normalizedSeed);
  const promptReadyPersonas = personas.filter((persona) =>
    persona.promptReadiness === "ready_for_prompt_design" || persona.promptReadiness === "usable_with_caution"
  );
  if (promptReadyPersonas.length === 0) return [];

  const topicKeys = selectGeneratedTopicKeys(context, normalizedSeed);
  const topics = topicKeys.map((key) =>
    createTopicDraft(context, key, selectPersonaForTopic(key, promptReadyPersonas))
  );

  return uniqueBy(topics, (topic) => `${topic.topicType}:${normalizeForDedupe(topic.topicName)}`).slice(0, 6);
}

export function generatePromptDrafts(
  seed: ProjectSetupSeedInput,
  personas: readonly PersonaDraft[],
  topics: readonly TopicDraft[]
): PromptDraft[] {
  const normalizedSeed = normalizeSeedInput(seed);
  if (validateProjectSetupSeedInput(normalizedSeed).length > 0 || personas.length === 0 || topics.length === 0) return [];

  const context = buildGenerationContext(normalizedSeed);
  const personaById = new Map(personas.map((persona) => [persona.personaId, persona]));
  const prompts = topics
    .flatMap((topic) =>
      generatePromptVariantsForTopic(
        context,
        topic,
        personas,
        personaById.get(topic.targetPersonaId ?? "")
      )
    );

  return uniqueBy(prompts, (prompt) => normalizePromptTextForDeduplication(prompt.text))
    .slice(0, MAX_GENERATED_PROMPTS);
}

export function deduplicateProjectSetupDraft(draft: ProjectSetupDraft): ProjectSetupDraft {
  const personas = uniqueBy(draft.personas, (persona) =>
    normalizeForDedupe(`${persona.displayName}|${persona.segment}|${persona.roleType}|${persona.buyerStage}`)
  );
  const topics = uniqueBy(draft.topics, (topic) => normalizeForDedupe(`${topic.topicName}|${topic.topicType}`));
  const prompts = uniqueBy(draft.prompts, (prompt) => normalizeForDedupe(prompt.text));

  return {
    ...draft,
    personas,
    topics,
    prompts
  };
}

export function validateGeneratedProjectSetupDraft(draft: ProjectSetupDraft): ProjectSetupDraftValidation {
  const baseValidation = validateProjectSetupDraft(draft);
  const blockers = [...baseValidation.blockers];
  const warnings = [...baseValidation.warnings];
  const brandIdentity = getBrandIdentityFromDraft(draft);
  const generationContext = buildGenerationContext(draft.seedInput);

  if (draft.generatorVersion !== PROJECT_SETUP_DRAFT_GENERATOR_VERSION) {
    warnings.push("generated_draft_generator_version_is_not_current");
  }
  if (draft.reviewStatus === "approved") {
    blockers.push("generated_draft_must_not_be_approved_automatically");
  }
  if (draft.competitors.length > 0) {
    blockers.push("generated_draft_must_not_create_competitor_drafts");
  }
  if (draft.citationAngles.length > 0) {
    blockers.push("generated_draft_must_not_create_citation_angle_drafts");
  }
  if (draft.pageImprovementAngles.length > 0) {
    blockers.push("generated_draft_must_not_create_page_improvement_angle_drafts");
  }

  addDuplicateValueBlockers(
    blockers,
    draft.personas.map((persona) => normalizeForDedupe(`${persona.displayName}|${persona.segment}|${persona.roleType}`)),
    "generated_persona_content"
  );
  addDuplicateValueBlockers(
    blockers,
    draft.topics.map((topic) => normalizeForDedupe(`${topic.topicName}|${topic.topicType}`)),
    "generated_topic_content"
  );
  addDuplicateValueBlockers(
    blockers,
    draft.prompts.map((prompt) => normalizeForDedupe(prompt.text)),
    "generated_prompt_text"
  );

  for (const prompt of draft.prompts) {
    const eligibility = derivePromptMetricEligibility(prompt, brandIdentity);
    const readiness = getPromptMeasurementReadiness(prompt, brandIdentity);
    const containsBrandSignal = promptTextContainsBrandSignal(prompt.text, brandIdentity);

    if (prompt.reviewStatus === "approved") {
      blockers.push(`prompt ${prompt.promptId} generated_prompt_must_not_be_approved_automatically`);
    }
    if (readiness.measurementReady) {
      blockers.push(`prompt ${prompt.promptId} generated_prompt_must_not_be_measurement_ready`);
    }
    if (prompt.brandMentionRule === "brand_excluded" && containsBrandSignal) {
      blockers.push(`prompt ${prompt.promptId} non_branded_prompt_contains_brand_signal`);
    }
    if (prompt.brandMentionRule === "brand_excluded" && promptTextContainsKnownCompetitorSignal(prompt.text, draft.seedInput)) {
      blockers.push(`prompt ${prompt.promptId} non_branded_prompt_contains_known_competitor_signal`);
    }
    if (prompt.brandMentionRule === "brand_excluded") {
      for (const issue of getNonBrandedPromptNaturalnessIssues(prompt.text, generationContext)) {
        blockers.push(`prompt ${prompt.promptId} ${issue}`);
      }
    }
    if (containsBrandSignal && hasMarketMetricEligibility(eligibility)) {
      blockers.push(`prompt ${prompt.promptId} branded_prompt_must_not_be_visibility_ranking_or_sov_eligible`);
    }
    if (prompt.intent === "citation_check" && hasMarketMetricEligibility(eligibility)) {
      blockers.push(`prompt ${prompt.promptId} citation_check_prompt_must_not_be_market_metric_eligible`);
    }
    if (prompt.brandMentionRule === "brand_included" && prompt.responseShape !== "branded_sentiment_answer") {
      warnings.push(`prompt ${prompt.promptId} branded_prompt_should_use_branded_sentiment_response_shape`);
    }
  }

  for (const topic of draft.topics) {
    const topicPrompts = draft.prompts.filter((prompt) => prompt.topicId === topic.topicId);
    if (topicPrompts.length < topic.minimumPromptCount) {
      blockers.push(`topic ${topic.topicId} generated_topic_under_minimum_prompt_count`);
    }
    if (topicPrompts.length > MAX_PROMPTS_PER_TOPIC) {
      blockers.push(`topic ${topic.topicId} generated_topic_over_prompt_count_cap`);
    }
  }
  if (draft.prompts.length > MAX_GENERATED_PROMPTS) {
    blockers.push("generated_prompt_count_exceeds_cap");
  }

  return {
    ...baseValidation,
    blockers: uniqueStrings(blockers),
    warnings: uniqueStrings(warnings)
  };
}

function buildGenerationResult(input: {
  context: GenerationContext;
  draft: ProjectSetupDraft;
  blockers: string[];
  warnings: string[];
  generatedAt: string | null;
}): ProjectSetupDraftGenerationResult {
  const validation = validateProjectSetupDraft(input.draft);
  const materializationDecision = getProjectSetupDraftMaterializationDecision(input.draft);

  return {
    draft: input.draft,
    blockers: uniqueStrings(input.blockers),
    warnings: uniqueStrings(input.warnings),
    generatorVersion: PROJECT_SETUP_DRAFT_GENERATOR_VERSION,
    generatedAt: input.generatedAt,
    generationSummary: {
      seedHash: input.context.seedHash,
      inputMode: input.blockers.length > 0 ? "blocked" : "minimum_input",
      businessModel: input.context.businessModel,
      generatedCounts: {
        personas: input.draft.personas.length,
        topics: input.draft.topics.length,
        prompts: input.draft.prompts.length,
        competitors: input.draft.competitors.length,
        citationAngles: input.draft.citationAngles.length,
        pageImprovementAngles: input.draft.pageImprovementAngles.length
      },
      metricEligiblePromptIds: validation.metricEligiblePromptIds,
      materializationReady: materializationDecision.materializationReady,
      notes: uniqueStrings([
        "deterministic_rule_based_generator",
        "generated_items_require_internal_review",
        "no_database_write_no_api_call_no_measurement_execution"
      ])
    }
  };
}

function buildProjectSetupDraft(input: {
  context: GenerationContext;
  inputCompletion: readonly InputCompletionItem[];
  personas: readonly PersonaDraft[];
  topics: readonly TopicDraft[];
  prompts: readonly PromptDraft[];
  options: ProjectSetupDraftGenerationOptions;
}): ProjectSetupDraft {
  const confidenceScore = input.personas.length > 0 && input.topics.length > 0 && input.prompts.length > 0
    ? clampScore(74 - input.context.riskFlags.length * 2)
    : 0;

  return {
    schemaVersion: PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
    draftId: `setup-draft-${input.context.seedHash}`,
    projectSlug: input.options.projectSlug ?? null,
    promptSetVersion: input.options.promptSetVersion ?? null,
    generatorVersion: PROJECT_SETUP_DRAFT_GENERATOR_VERSION,
    seedInput: input.context.seed,
    inputCompletion: input.inputCompletion,
    reviewStatus: GENERATED_DRAFT_REVIEW_STATUS,
    confidenceScore,
    personas: input.personas,
    topics: input.topics,
    prompts: input.prompts,
    competitors: [],
    citationAngles: [],
    pageImprovementAngles: [],
    riskFlags: input.context.riskFlags
  };
}

function buildGenerationContext(seed: ProjectSetupSeedInput): GenerationContext {
  const seedHash = stableHash(stableSeedString(seed));
  const isJapanese = isJapaneseLanguage(seed.language);
  const serviceEvidenceTerms = buildServiceEvidenceTerms(seed);
  const categoryCandidates = scoreCategoryCandidates(serviceEvidenceTerms, seed);
  const categoryCandidate = categoryCandidates[0] ?? OTHER_CATEGORY_CANDIDATE;
  const businessModel = mapCategoryCandidateToBusinessModel(categoryCandidate, seed);
  const isB2B = isB2BBusinessModel(seed, businessModel);
  const isLocal = businessModel === "local_service" || isLocalIntent(seed);
  const isRegulatedOrHighTrust = isRegulatedOrHighTrustIndustry(seed);
  const industryAdapter = mapCategoryCandidateToIndustryAdapter(categoryCandidate, businessModel);
  const categoryLabel = buildCategoryLabel(seed, isJapanese, categoryCandidate);
  const questionAreaCandidates = scoreQuestionAreaCandidates(categoryCandidate, serviceEvidenceTerms, seed);
  const targetCustomerLabel = sanitizeForPrompt(seed.targetCustomers, seed) || (isJapanese ? "対象顧客" : "target customers");
  const normalizedTargetCustomerLabel = hasText(seed.targetCustomers)
    ? targetCustomerLabel
    : isJapanese ? "対象顧客" : "target customers";
  const regionLabel = buildRegionLabel(seed, isJapanese);
  const warnings = buildContextWarnings(seed, {
    isLocal,
    isRegulatedOrHighTrust,
    businessModel,
    industryAdapter,
    categoryLabel,
    targetCustomerLabel: normalizedTargetCustomerLabel
  });
  const riskFlags = uniqueStrings([
    "generated_from_minimum_input",
    "needs_internal_review",
    ...(isRegulatedOrHighTrust ? ["regulated_or_high_trust_review_required"] : []),
    ...(isLocal && seed.regions.length === 0 ? ["region_required_for_local_intent"] : [])
  ]);

  return {
    seed,
    seedHash,
    isJapanese,
    isB2B,
    isLocal,
    isRegulatedOrHighTrust,
    businessModel,
    industryAdapter,
    categoryLabel,
    serviceEvidenceTerms,
    categoryCandidate,
    categoryCandidates,
    questionAreaCandidates,
    targetCustomerLabel: normalizedTargetCustomerLabel,
    regionLabel,
    warnings,
    riskFlags
  };
}

function buildPersonaSpecs(context: GenerationContext): PersonaSpec[] {
  if (context.businessModel === "b2b_software") return buildB2BSoftwarePersonaSpecs(context);
  if (context.businessModel === "professional_service") return buildProfessionalServicePersonaSpecs(context);
  if (context.businessModel === "healthcare") return buildHealthcarePersonaSpecs(context);
  if (context.businessModel === "education") return buildEducationPersonaSpecs(context);
  if (context.businessModel === "local_service") return buildLocalServicePersonaSpecs(context);
  if (context.isB2B) return buildB2BPersonaSpecs(context);
  return buildB2CPersonaSpecs(context);
}

function buildB2BSoftwarePersonaSpecs(context: GenerationContext): PersonaSpec[] {
  const label = context.targetCustomerLabel;
  return [
    personaSpec(context, {
      key: "executive-sponsor",
      jaName: `${label}の導入判断者`,
      enName: `${label} adoption decision maker`,
      roleType: "decision_maker",
      detailedDecisionRole: "decision_maker",
      roleMappingReason: "Approves adoption fit and business risk, so maps to decision_maker.",
      buyerStage: "comparison"
    }),
    personaSpec(context, {
      key: "workflow-owner",
      jaName: `${label}の実務利用者`,
      enName: `${label} workflow owner`,
      roleType: "end_user",
      detailedDecisionRole: "operations_manager",
      roleMappingReason: "Daily workflow pain and rollout friction map to end_user.",
      buyerStage: "exploration",
      confidenceOffset: -2
    }),
    personaSpec(context, {
      key: "vendor-evaluator",
      jaName: `${label}の比較評価担当者`,
      enName: `${label} vendor evaluator`,
      roleType: "evaluator",
      detailedDecisionRole: "evaluator",
      roleMappingReason: "Compares options, proof, and shortlist fit before handoff, so maps to evaluator.",
      buyerStage: "comparison",
      confidenceOffset: -3
    }),
    ...(isHighConsiderationB2BContext(context) ? [
      personaSpec(context, {
        key: "economic-buyer",
        jaName: `${label}の予算・稟議確認者`,
        enName: `${label} budget and approval owner`,
        roleType: "economic_buyer",
        detailedDecisionRole: "economic_buyer",
        roleMappingReason: "High-ticket or approval-heavy adoption needs budget, ROI, contract, and approval-risk review.",
        buyerStage: "decision",
        confidenceOffset: -4
      })
    ] : []),
    personaSpec(context, {
      key: "technical-reviewer",
      jaName: `${label}の技術・運用確認者`,
      enName: `${label} technical and operations reviewer`,
      roleType: "technical_reviewer",
      detailedDecisionRole: "technical_reviewer",
      roleMappingReason: "Software adoption usually needs security, data, integration, or operations review.",
      buyerStage: "validation",
      confidenceOffset: -5
    })
  ];
}

function buildProfessionalServicePersonaSpecs(context: GenerationContext): PersonaSpec[] {
  const label = context.targetCustomerLabel;
  return [
    personaSpec(context, {
      key: "client-decision-maker",
      jaName: `${label}の相談・依頼判断者`,
      enName: `${label} service decision maker`,
      roleType: context.isB2B ? "decision_maker" : "purchaser",
      detailedDecisionRole: context.isB2B ? "decision_maker" : "purchaser",
      roleMappingReason: "Owns whether to contact or hire the professional service provider.",
      buyerStage: "comparison"
    }),
    personaSpec(context, {
      key: "expert-evaluator",
      jaName: `${label}の専門性比較担当者`,
      enName: `${label} expertise evaluator`,
      roleType: "evaluator",
      detailedDecisionRole: "client_side_evaluator",
      roleMappingReason: "Checks expertise, case fit, fee clarity, and consultation process, so maps to evaluator.",
      buyerStage: "validation",
      confidenceOffset: -2
    }),
    personaSpec(context, {
      key: "fee-risk-buyer",
      jaName: `${label}の費用・リスク確認者`,
      enName: `${label} fee and risk buyer`,
      roleType: context.isB2B ? "economic_buyer" : "comparator",
      detailedDecisionRole: context.isB2B ? "economic_buyer" : "high_ticket_evaluator",
      roleMappingReason: "Fee, scope, and risk reduction drive the decision, so this role checks economics and proof.",
      buyerStage: "decision",
      confidenceOffset: -4
    }),
    personaSpec(context, {
      key: "first-consulter",
      jaName: `${label}の初回相談者`,
      enName: `${label} first-time consulter`,
      roleType: context.isB2B ? "end_user" : "user",
      detailedDecisionRole: "first_time_consulter",
      roleMappingReason: "First-contact anxiety and process clarity change the search intent.",
      buyerStage: "exploration",
      confidenceOffset: -5
    })
  ];
}

function buildHealthcarePersonaSpecs(context: GenerationContext): PersonaSpec[] {
  const label = context.targetCustomerLabel;
  return [
    personaSpec(context, {
      key: "local-comparator",
      jaName: `${label}の地域比較者`,
      enName: `${label} local option comparator`,
      roleType: "comparator",
      detailedDecisionRole: "local_comparator",
      roleMappingReason: "Location, reviews, price, qualifications, and appointment flow drive comparison.",
      buyerStage: "comparison"
    }),
    personaSpec(context, {
      key: "first-time-user",
      jaName: `${label}の初回相談者`,
      enName: `${label} first-time consulter`,
      roleType: "user",
      detailedDecisionRole: "user",
      roleMappingReason: "The service recipient needs safe general information and consultation-preparation checks.",
      buyerStage: "exploration",
      confidenceOffset: -3
    }),
    personaSpec(context, {
      key: "family-sponsor",
      jaName: `${label}の家族・紹介者`,
      enName: `${label} family or referral influencer`,
      roleType: "recommender_influencer",
      detailedDecisionRole: "family_decision_maker",
      roleMappingReason: "Family or referral involvement is plausible in healthcare, but remains a cautious hypothesis.",
      buyerStage: "validation",
      confidenceOffset: -8
    })
  ];
}

function buildEducationPersonaSpecs(context: GenerationContext): PersonaSpec[] {
  const label = context.targetCustomerLabel;
  return [
    personaSpec(context, {
      key: "learner-comparator",
      jaName: `${label}の学習先比較者`,
      enName: `${label} education option comparator`,
      roleType: "comparator",
      detailedDecisionRole: "comparator",
      roleMappingReason: "Compares curriculum, support, schedule, price, and reputation before choosing.",
      buyerStage: "comparison"
    }),
    personaSpec(context, {
      key: "payer-or-guardian",
      jaName: `${label}の支払い・保護者判断者`,
      enName: `${label} payer or guardian decision maker`,
      roleType: "purchaser",
      detailedDecisionRole: "purchaser",
      roleMappingReason: "Pays, approves, or books the learning option, so maps to purchaser.",
      buyerStage: "decision",
      confidenceOffset: -2
    }),
    personaSpec(context, {
      key: "learner-user",
      jaName: `${label}の受講者`,
      enName: `${label} learner user`,
      roleType: "user",
      detailedDecisionRole: "user",
      roleMappingReason: "The learner's fit, anxiety, and outcome evidence needs differ from the payer.",
      buyerStage: "exploration",
      confidenceOffset: -4
    })
  ];
}

function buildLocalServicePersonaSpecs(context: GenerationContext): PersonaSpec[] {
  const label = context.targetCustomerLabel;
  return [
    personaSpec(context, {
      key: "local-comparator",
      jaName: `${label}の近隣比較者`,
      enName: `${label} local comparator`,
      roleType: "comparator",
      detailedDecisionRole: "local_comparator",
      roleMappingReason: "Nearby availability, access, reviews, price, and trust signals drive comparison.",
      buyerStage: "comparison"
    }),
    personaSpec(context, {
      key: "booking-purchaser",
      jaName: `${label}の予約・申込判断者`,
      enName: `${label} booking purchaser`,
      roleType: "purchaser",
      detailedDecisionRole: "purchaser",
      roleMappingReason: "Books, pays, or chooses the provider, so maps to purchaser.",
      buyerStage: "decision",
      confidenceOffset: -2
    }),
    personaSpec(context, {
      key: "first-time-user",
      jaName: `${label}の初回利用者`,
      enName: `${label} first-time user`,
      roleType: "user",
      detailedDecisionRole: "user",
      roleMappingReason: "First-use concerns and experience risk change the prompt angle.",
      buyerStage: "exploration",
      confidenceOffset: -4
    }),
    personaSpec(context, {
      key: "repeat-user",
      jaName: `${label}の継続・再利用者`,
      enName: `${label} repeat user`,
      roleType: "repeat_user",
      detailedDecisionRole: "repeat_buyer",
      roleMappingReason: "Repeat use or switching decisions require different retention and trust checks.",
      buyerStage: "validation",
      confidenceOffset: -6
    })
  ];
}

function personaSpec(
  context: GenerationContext,
  input: {
    key: string;
    jaName: string;
    enName: string;
    roleType: PersonaRoleType;
    detailedDecisionRole: string;
    roleMappingReason: string;
    buyerStage: BuyerStage;
    confidenceOffset?: number;
  }
): PersonaSpec {
  return {
    key: input.key,
    displayName: context.isJapanese ? input.jaName : input.enName,
    roleType: input.roleType,
    detailedDecisionRole: input.detailedDecisionRole,
    roleMappingReason: input.roleMappingReason,
    buyerStage: input.buyerStage,
    promptReadiness: "usable_with_caution",
    confidenceOffset: input.confidenceOffset ?? 0
  };
}

function buildB2BPersonaSpecs(context: GenerationContext): PersonaSpec[] {
  const label = context.targetCustomerLabel;
  return [
    {
      key: "decision-maker",
      displayName: context.isJapanese ? `${label}の導入判断者` : `${label} adoption decision maker`,
      roleType: "decision_maker" as const,
      detailedDecisionRole: "decision_maker",
      roleMappingReason: "Approves adoption fit and business risk, so maps to decision_maker.",
      buyerStage: "comparison" as const,
      promptReadiness: "usable_with_caution" as const,
      confidenceOffset: 0
    },
    {
      key: "evaluator",
      displayName: context.isJapanese ? `${label}の比較評価担当者` : `${label} vendor evaluator`,
      roleType: "evaluator" as const,
      detailedDecisionRole: "evaluator",
      roleMappingReason: "Compares options and proof before shortlist handoff, so maps to evaluator.",
      buyerStage: "exploration" as const,
      promptReadiness: "usable_with_caution" as const,
      confidenceOffset: -2
    },
    {
      key: context.businessModel === "b2b_software" ? "technical-reviewer" : "end-user",
      displayName: context.businessModel === "b2b_software"
        ? context.isJapanese
          ? `${label}の技術・運用確認者`
          : `${label} technical and operations reviewer`
        : context.isJapanese
          ? `${label}の実務利用者`
          : `${label} practical end user`,
      roleType: context.businessModel === "b2b_software" ? "technical_reviewer" as const : "end_user" as const,
      detailedDecisionRole: context.businessModel === "b2b_software" ? "technical_reviewer" : "end_user",
      roleMappingReason: context.businessModel === "b2b_software"
        ? "Software adoption usually needs security, data, integration, or operations review."
        : "Daily workflow pain and adoption friction map to end_user.",
      buyerStage: "validation" as const,
      promptReadiness: "usable_with_caution" as const,
      confidenceOffset: -4
    }
  ];
}

function buildB2CPersonaSpecs(context: GenerationContext): PersonaSpec[] {
  const label = context.targetCustomerLabel;
  return [
    {
      key: "comparator",
      displayName: context.isJapanese ? `${label}の比較検討者` : `${label} option comparator`,
      roleType: "comparator" as const,
      detailedDecisionRole: context.isLocal ? "local_comparator" : "comparator",
      roleMappingReason: context.isLocal
        ? "Local availability, reviews, and fit drive comparison behavior, so maps to comparator."
        : "Compares alternatives before choosing, so maps to comparator.",
      buyerStage: "comparison" as const,
      promptReadiness: "usable_with_caution" as const,
      confidenceOffset: 0
    },
    {
      key: "purchaser",
      displayName: context.isJapanese ? `${label}の申込・購入判断者` : `${label} purchaser`,
      roleType: "purchaser" as const,
      detailedDecisionRole: "purchaser",
      roleMappingReason: "Pays, subscribes, books, or chooses the purchase path, so maps to purchaser.",
      buyerStage: "decision" as const,
      promptReadiness: "usable_with_caution" as const,
      confidenceOffset: -2
    },
    {
      key: "first-time-user",
      displayName: context.isJapanese ? `${label}の初回利用者` : `${label} first-time user`,
      roleType: "user" as const,
      detailedDecisionRole: "user",
      roleMappingReason: "Uses or receives the service and cares about fit, safety, convenience, and experience.",
      buyerStage: "exploration" as const,
      promptReadiness: "usable_with_caution" as const,
      confidenceOffset: -4
    },
    ...(context.businessModel === "ecommerce" ? [
      {
        key: "repeat-or-return-risk-user",
        displayName: context.isJapanese ? `${label}の継続・返品条件確認者` : `${label} repeat or return-risk checker`,
        roleType: "repeat_user" as const,
        detailedDecisionRole: "repeat_buyer",
        roleMappingReason: "E-commerce comparison often depends on repeat use, return policy, warranty, and post-purchase satisfaction.",
        buyerStage: "validation" as const,
        promptReadiness: "usable_with_caution" as const,
        confidenceOffset: -6
      }
    ] : [])
  ];
}

function createPersonaDraft(
  context: GenerationContext,
  spec: PersonaSpec
): PersonaDraft {
  const confidenceScore = clampScore(72 + spec.confidenceOffset - (context.isRegulatedOrHighTrust ? 6 : 0));
  const roleSpecificConcern = buildRoleSpecificConcern(context, spec.roleType);

  return {
    personaId: buildScopedId("persona", context.seedHash, spec.key),
    displayName: spec.displayName,
    segment: context.targetCustomerLabel,
    businessType: context.isB2B ? "BtoB" : context.isLocal ? "local_or_BtoC" : "BtoC",
    industryCategory: context.seed.industryCategory,
    industrySubtype: context.businessModel,
    roleType: spec.roleType,
    detailedDecisionRole: spec.detailedDecisionRole,
    roleMappingReason: spec.roleMappingReason,
    buyerStage: spec.buyerStage,
    jobs: [
      context.isJapanese
        ? `${context.categoryLabel}の候補を把握し、比較の観点を整理する`
        : `Understand candidate options for ${context.categoryLabel} and organize comparison criteria`
    ],
    painPoints: [
      context.isJapanese
        ? `${context.categoryLabel}の違いや信頼できる根拠が見えにくい`
        : `Differences and trustworthy evidence for ${context.categoryLabel} are unclear`,
      roleSpecificConcern
    ],
    triggerEvents: [
      context.isJapanese
        ? "新しい選択肢を調べる必要が出た"
        : "A new option needs to be researched",
      context.isJapanese
        ? "既存の方法や候補との比較が必要になった"
        : "Existing approaches or candidates need comparison"
    ],
    switchingForces: [
      context.isJapanese
        ? "現状のやり方では判断材料や比較軸が不足している"
        : "The current approach lacks decision evidence and comparison axes"
    ],
    alternativesConsidered: [
      context.isJapanese ? "既存の運用や手作業" : "current workflow or manual process",
      context.isJapanese ? "カテゴリ内の他サービス" : "other services in the category"
    ],
    comparisonAxis: [
      context.isJapanese ? "価格や導入負荷" : "price and adoption effort",
      context.isJapanese ? "実績や信頼できる根拠" : "proof and trustworthy evidence",
      context.isJapanese ? "対象顧客や利用場面との適合" : "fit with target users and use cases"
    ],
    proofNeeded: [
      context.isJapanese ? "導入前に確認できる具体的な根拠" : "specific pre-adoption proof",
      context.isJapanese ? "比較可能な評価軸" : "comparable evaluation criteria"
    ],
    trustRequirement: context.isRegulatedOrHighTrust
      ? context.isJapanese
        ? "高信頼領域として、効果や安全性を断定せず根拠確認が必要"
        : "High-trust context; avoid outcome guarantees and verify evidence"
      : context.isJapanese
        ? "根拠付きの説明と比較軸が必要"
        : "Needs evidence-labeled explanations and comparison criteria",
    promptAngle: context.isJapanese
      ? `${spec.displayName}が${context.categoryLabel}を検討するとき、候補、比較軸、根拠、導入前の不安をAIに自然に尋ねる角度。`
      : `${spec.displayName} asks AI about candidates, comparison axes, evidence, and pre-adoption concerns for ${context.categoryLabel}.`,
    promptReadiness: spec.promptReadiness,
    researchSufficiency: "minimum_input_hypothesis_needs_confirmation",
    confidenceScore,
    needsVerification: true,
    riskFlags: uniqueStrings([
      "minimum_input_hypothesis",
      "not_validated_customer_segment",
      ...(context.isRegulatedOrHighTrust ? ["regulated_or_high_trust_review_required"] : [])
    ]),
    sourceStatus: "inferred",
    reviewStatus: GENERATED_ITEM_REVIEW_STATUS
  };
}

function createTopicDraft(context: GenerationContext, key: GeneratedTopicKey, persona: PersonaDraft): TopicDraft {
  const topic = getTopicSpec(context, key);
  const questionArea = getQuestionAreaForGeneratedTopic(context, key);
  return {
    topicId: buildScopedId("topic", context.seedHash, key),
    topicName: questionArea?.label ?? topic.topicName,
    topicType: topic.topicType,
    diagnosisGoal: questionArea?.description ?? topic.diagnosisGoal,
    targetPersonaId: persona.personaId,
    buyerStage: topic.buyerStage,
    metricTarget: topic.metricTarget,
    brandMentionPolicy: topic.brandMentionPolicy,
    expectedSignal: questionArea?.description ?? topic.expectedSignal,
    minimumPromptCount: getMinimumPromptCountForTopic(topic.topicType),
    riskOrBias: topic.riskOrBias,
    handoffSkill: topic.handoffSkill,
    topicQualityDecision: "topic_ready",
    coverageStatus: "covered",
    confidenceScore: clampScore(72 - (context.isRegulatedOrHighTrust ? 5 : 0)),
    reviewStatus: GENERATED_ITEM_REVIEW_STATUS
  };
}

function getMinimumPromptCountForTopic(topicType: TopicType) {
  if (topicType === "persona_specific_topic") return 3;
  if (topicType === "local_regional_topic") return 3;
  if (topicType === "citation_evidence_topic") return 1;
  if (topicType === "branded_sentiment_topic") return 1;
  return 2;
}

function getQuestionAreaForGeneratedTopic(context: GenerationContext, key: GeneratedTopicKey) {
  const topicTypeByKey: Record<GeneratedTopicKey, TopicType> = {
    "category-discovery": "category_discovery_topic",
    "problem-solution": "problem_solution_topic",
    "selection-criteria": "persona_specific_topic",
    "alternative-search": "alternative_search_topic",
    "pricing-reputation": "pricing_reputation_topic",
    "regulated-risk": "regulated_risk_topic",
    "citation-check": "citation_evidence_topic",
    "branded-sentiment": "branded_sentiment_topic",
    "local-regional": "local_regional_topic"
  };
  const topicType = topicTypeByKey[key];
  return context.questionAreaCandidates.find((candidate) => candidate.sourceTopicType === topicType);
}

function getTopicSpec(context: GenerationContext, key: GeneratedTopicKey): {
  topicName: string;
  topicType: TopicType;
  diagnosisGoal: string;
  buyerStage: BuyerStage;
  metricTarget: TopicMetricTarget;
  brandMentionPolicy: PromptBrandMentionRule;
  expectedSignal: string;
  riskOrBias: string | null;
  handoffSkill: TopicDraft["handoffSkill"];
} {
  const eligibleMarket: TopicMetricTarget = {
    visibilityRate: "eligible",
    ranking: "eligible",
    sentiment: "excluded",
    citationCheck: "excluded",
    riskCheck: "excluded"
  };
  const nonMarketSupport: TopicMetricTarget = {
    visibilityRate: "excluded",
    ranking: "excluded",
    sentiment: "excluded",
    citationCheck: "excluded",
    riskCheck: context.isRegulatedOrHighTrust ? "eligible" : "excluded"
  };
  const citationOnly: TopicMetricTarget = {
    visibilityRate: "excluded",
    ranking: "excluded",
    sentiment: "excluded",
    citationCheck: "eligible",
    riskCheck: "excluded"
  };
  const sentimentOnly: TopicMetricTarget = {
    visibilityRate: "excluded",
    ranking: "excluded",
    sentiment: "eligible",
    citationCheck: "excluded",
    riskCheck: "excluded"
  };

  if (key === "problem-solution") {
    return {
      topicName: context.isJapanese ? `${context.categoryLabel}の課題認識と解決方法` : `${context.categoryLabel} problem and solution discovery`,
      topicType: "problem_solution_topic",
      diagnosisGoal: context.isJapanese
        ? "課題から候補カテゴリや解決手段がどう提示されるかを観測する。"
        : "Observe how AI answers move from the problem to solution categories and candidates.",
      buyerStage: "exploration",
      metricTarget: { ...eligibleMarket, ranking: "excluded" },
      brandMentionPolicy: "brand_excluded",
      expectedSignal: context.isJapanese
        ? "候補カテゴリ、解決手段、比較軸がAI回答に現れるか。"
        : "Candidate categories, solution approaches, and comparison axes appear in the AI answer.",
      riskOrBias: context.isJapanese
        ? "候補名が出ない説明型回答はvisibility/ranking母数から外す。"
        : "Explanatory answers without candidate mentions stay out of visibility/ranking denominators.",
      handoffSkill: "recora-prompt-topic-designer"
    };
  }

  if (key === "selection-criteria") {
    return {
      topicName: context.isJapanese ? `${context.categoryLabel}の選定基準と導入前確認` : `${context.categoryLabel} selection criteria and validation`,
      topicType: "persona_specific_topic",
      diagnosisGoal: context.isJapanese
        ? "導入前に必要な比較軸、根拠、不安点がどう整理されるかを観測する。"
        : "Observe how AI organizes pre-adoption criteria, evidence needs, and concerns.",
      buyerStage: "validation",
      metricTarget: nonMarketSupport,
      brandMentionPolicy: "brand_excluded",
      expectedSignal: context.isJapanese
        ? "価格、実績、サポート、運用負荷、確認すべき根拠が出るか。"
        : "Price, proof, support, effort, and evidence requirements appear in the answer.",
      riskOrBias: context.isRegulatedOrHighTrust
        ? "効果・安全性・法的/金融的結果の保証に見える表現を避ける。"
        : "Do not turn criteria prompts into unsupported outcome claims.",
      handoffSkill: context.isRegulatedOrHighTrust ? "recora-recommendation-quality-gate-auditor" : "none"
    };
  }

  if (key === "alternative-search") {
    return {
      topicName: context.isJapanese ? `${context.categoryLabel}の代替手段と比較候補` : `${context.categoryLabel} alternatives and comparable options`,
      topicType: "alternative_search_topic",
      diagnosisGoal: context.isJapanese
        ? "ブランド名を含めずに、代替手段・周辺サービス・内製/外注/他カテゴリの選択肢がAI回答にどう出るかを観測する。"
        : "Observe which alternatives, adjacent services, or build-vs-buy paths appear without seeding the brand.",
      buyerStage: "comparison",
      metricTarget: eligibleMarket,
      brandMentionPolicy: "brand_excluded",
      expectedSignal: context.isJapanese
        ? "代替手段、候補カテゴリ、比較軸、推奨順または候補セットがAI回答に現れるか。"
        : "Alternative paths, candidate categories, comparison axes, and a comparable set appear in the answer.",
      riskOrBias: context.isJapanese
        ? "既知競合が未入力の場合は実名競合を発明せず、未知競合・カテゴリ候補の発見として扱う。"
        : "When competitors are missing, do not invent named competitors; treat the prompt as unknown competitor/category discovery.",
      handoffSkill: "recora-competitor-benchmark"
    };
  }

  if (key === "pricing-reputation") {
    return {
      topicName: context.isJapanese ? `${context.categoryLabel}の料金・評判・信頼確認` : `${context.categoryLabel} price, reputation, and trust checks`,
      topicType: "pricing_reputation_topic",
      diagnosisGoal: context.isJapanese
        ? "料金、口コミ、実績、相談/申込前の確認事項が、AI回答でどの程度慎重に整理されるかを観測する。"
        : "Observe how AI answers handle price, reviews, proof, and pre-contact checks without inventing current facts.",
      buyerStage: "validation",
      metricTarget: nonMarketSupport,
      brandMentionPolicy: "brand_excluded",
      expectedSignal: context.isJapanese
        ? "料金確認、口コミの扱い、実績・資格・相談フローなどの確認軸が出るか。"
        : "Price checks, review caveats, proof needs, credentials, and consultation flow appear.",
      riskOrBias: context.isJapanese
        ? "未測定の料金・口コミ・実績を事実として断定しない。評価基準プロンプトとしてvisibility/rankingからは除外する。"
        : "Do not assert unmeasured prices, reviews, or results. Criteria prompts stay excluded from visibility/ranking.",
      handoffSkill: context.isRegulatedOrHighTrust
        ? "recora-recommendation-quality-gate-auditor"
        : "recora-prompt-topic-designer"
    };
  }

  if (key === "regulated-risk") {
    return {
      topicName: context.isJapanese ? `${context.categoryLabel}の安全・資格・リスク確認` : `${context.categoryLabel} safety, qualification, and risk checks`,
      topicType: "regulated_risk_topic",
      diagnosisGoal: context.isJapanese
        ? "医療・法律・金融・不動産・採用などの高信頼領域で、AI回答が断定や保証を避け、確認事項へ安全に変換できるかを観測する。"
        : "Observe whether AI avoids guarantees or direct advice in high-trust categories and converts risky intent into verification checks.",
      buyerStage: "validation",
      metricTarget: {
        visibilityRate: "excluded",
        ranking: "excluded",
        sentiment: "excluded",
        citationCheck: "excluded",
        riskCheck: "eligible"
      },
      brandMentionPolicy: "brand_excluded",
      expectedSignal: context.isJapanese
        ? "資格、説明範囲、費用、リスク、専門家への相談前に確認すべき点が慎重に出るか。"
        : "Qualifications, scope, fees, risks, and pre-specialist questions appear with cautious language.",
      riskOrBias: context.isJapanese
        ? "診断・治療・法律判断・投資助言・結果保証を求める文言にしない。"
        : "Do not ask for diagnosis, treatment, legal judgment, investment advice, or guaranteed outcomes.",
      handoffSkill: "recora-recommendation-quality-gate-auditor"
    };
  }

  if (key === "citation-check") {
    return {
      topicName: context.isJapanese ? `${context.categoryLabel}の引用元・根拠確認` : `${context.categoryLabel} citation and evidence behavior`,
      topicType: "citation_evidence_topic",
      diagnosisGoal: context.isJapanese
        ? "AI回答がどのような情報源や根拠を扱うかを、rankingとは分けて観測する。"
        : "Observe source and evidence behavior separately from ranking.",
      buyerStage: "validation",
      metricTarget: citationOnly,
      brandMentionPolicy: "brand_excluded",
      expectedSignal: context.isJapanese
        ? "情報源の種類、根拠確認の必要性、未確認事項がAI回答に現れるか。"
        : "Source types, evidence needs, and verification gaps appear in the answer.",
      riskOrBias: context.isJapanese
        ? "citation occurrenceをranking evidenceとして扱わない。"
        : "Do not treat citation occurrence as ranking evidence.",
      handoffSkill: "recora-ai-citation-analysis"
    };
  }

  if (key === "branded-sentiment") {
    return {
      topicName: context.isJapanese ? `${context.seed.brandName}のブランド認識と評判確認` : `${context.seed.brandName} brand perception and sentiment`,
      topicType: "branded_sentiment_topic",
      diagnosisGoal: context.isJapanese
        ? "ブランド名を含む自然な質問で、評判・懸念・認識をvisibility/rankingとは分けて観測する。"
        : "Observe brand reputation, concerns, and perception separately from visibility/ranking.",
      buyerStage: "validation",
      metricTarget: sentimentOnly,
      brandMentionPolicy: "brand_included",
      expectedSignal: context.isJapanese
        ? "ブランドに対する評価、懸念、比較前の確認点が出るか。"
        : "Brand sentiment, concerns, and pre-comparison checks appear.",
      riskOrBias: context.isJapanese
        ? "branded promptはAI表示率、ranking、Share of Voiceから除外する。"
        : "Branded prompts are excluded from visibility, ranking, and Share of Voice.",
      handoffSkill: "recora-prompt-topic-designer"
    };
  }

  if (key === "local-regional") {
    return {
      topicName: context.isJapanese ? `${context.regionLabel}での${context.categoryLabel}比較` : `${context.categoryLabel} comparison in ${context.regionLabel}`,
      topicType: "local_regional_topic",
      diagnosisGoal: context.isJapanese
        ? "地域性、近さ、利用しやすさ、信頼材料が候補提示にどう影響するかを観測する。"
        : "Observe how locality, convenience, access, and trust signals affect candidate presentation.",
      buyerStage: "comparison",
      metricTarget: eligibleMarket,
      brandMentionPolicy: "brand_excluded",
      expectedSignal: context.isJapanese
        ? "地域条件つきの候補、比較軸、注意点がAI回答に現れるか。"
        : "Regional candidates, comparison criteria, and cautions appear in the AI answer.",
      riskOrBias: context.isJapanese
        ? "地域優位や実在候補を未測定で断定しない。"
        : "Do not assert regional superiority or real candidate strength before measurement.",
      handoffSkill: "recora-competitor-benchmark"
    };
  }

  return {
    topicName: context.isJapanese ? `${context.categoryLabel}の候補発見と比較` : `${context.categoryLabel} candidate discovery and comparison`,
    topicType: "category_discovery_topic",
    diagnosisGoal: context.isJapanese
      ? "non-brandedな質問で候補提示、推薦順、比較理由がどう出るかを観測する。"
      : "Observe candidate mentions, recommendation order, and comparison rationale from non-branded questions.",
    buyerStage: "comparison",
    metricTarget: eligibleMarket,
    brandMentionPolicy: "brand_excluded",
    expectedSignal: context.isJapanese
      ? "候補名、推薦順、比較理由、カテゴリ表現がAI回答に現れるか。"
      : "Candidate names, recommendation order, comparison rationale, and category framing appear.",
    riskOrBias: context.isJapanese
      ? "対象ブランド名やaliasをpromptに含めない。"
      : "Do not include the target brand or aliases in the prompt.",
    handoffSkill: "recora-competitor-benchmark"
  };
}

function generatePromptVariantsForTopic(
  context: GenerationContext,
  topic: TopicDraft,
  personas: readonly PersonaDraft[],
  primaryPersona: PersonaDraft | undefined
): PromptDraft[] {
  if (!primaryPersona) return [];

  const variantKeys = selectPromptVariantKeysForTopic(topic);
  const variantPersonas = selectPromptVariantPersonas(topic, personas, primaryPersona, variantKeys.length);
  const prompts = variantKeys
    .map((variantKey, index) => {
      const persona = variantPersonas[index] ?? primaryPersona;
      const spec = getPromptVariantSpecForTopic(context, topic, persona, variantKey);
      return createPromptDraftForTopicVariant(context, topic, persona, spec);
    })
    .filter((prompt): prompt is PromptDraft => prompt !== null);

  return uniqueBy(prompts, (prompt) => normalizePromptTextForDeduplication(prompt.text))
    .slice(0, MAX_PROMPTS_PER_TOPIC);
}

function createPromptDraftForTopicVariant(
  context: GenerationContext,
  topic: TopicDraft,
  persona: PersonaDraft | undefined,
  spec: PromptVariantSpec
): PromptDraft | null {
  if (!persona) return null;

  const topicKey = topic.topicId.replace(/^topic-[^-]+-/, "");
  const promptId = buildScopedId("prompt", context.seedHash, `${topicKey}-${spec.variantKey}`);

  return {
    promptId,
    topicId: topic.topicId,
    personaId: persona.personaId,
    text: spec.text,
    rawUserIntent: spec.rawUserIntent,
    languageMode: spec.languageMode,
    category: spec.category,
    intent: spec.intent,
    intentType: spec.intentType,
    buyerStage: topic.buyerStage,
    brandingMode: spec.brandingMode,
    brandMentionRule: spec.brandMentionRule,
    competitorMentionRule: spec.competitorMentionRule,
    responseShape: spec.responseShape,
    candidateMentionOpportunity: spec.candidateMentionOpportunity,
    rankingOpportunity: spec.rankingOpportunity,
    expectedSignal: topic.expectedSignal,
    qualityScore: spec.qualityScore,
    gateDecision: spec.gateDecision,
    gateReason: spec.gateReason,
    sourceStatus: "inferred",
    seedTerms: spec.seedTerms,
    seedContaminationRisk: spec.seedContaminationRisk,
    needsVerification: true,
    confidenceScore: spec.confidenceScore,
    reviewStatus: GENERATED_ITEM_REVIEW_STATUS,
    riskFlags: spec.riskFlags
  };
}

function selectPromptVariantKeysForTopic(topic: TopicDraft): string[] {
  if (topic.topicType === "persona_specific_topic") {
    return ["criteria-check", "candidate-shortlist", "implementation-approval"];
  }
  if (topic.topicType === "local_regional_topic") {
    return ["local-ranked", "local-review-price", "local-first-visit"];
  }
  if (topic.topicType === "citation_evidence_topic") {
    return ["citation-source-check", "citation-evidence-types"];
  }
  if (topic.topicType === "branded_sentiment_topic") {
    return ["brand-reputation", "brand-perception-fit"];
  }
  if (topic.topicType === "regulated_risk_topic") {
    return ["risk-verification", "qualification-source-check"];
  }
  if (topic.topicType === "alternative_search_topic") {
    return ["alternative-comparable-set", "build-buy-substitute"];
  }
  if (topic.topicType === "pricing_reputation_topic") {
    return ["price-review-check", "trust-proof-check"];
  }
  if (topic.topicType === "problem_solution_topic") {
    return ["problem-aware-candidate", "solution-category-comparison"];
  }
  return ["category-ranked-shortlist", "category-comparison-axes"];
}

function getPromptVariantSpecForTopic(
  context: GenerationContext,
  topic: TopicDraft,
  persona: PersonaDraft,
  variantKey: string
): PromptVariantSpec {
  if (variantKey === "criteria-check" ||
    variantKey === "local-ranked" ||
    variantKey === "citation-source-check" ||
    variantKey === "brand-reputation" ||
    variantKey === "risk-verification" ||
    variantKey === "alternative-comparable-set" ||
    variantKey === "price-review-check" ||
    variantKey === "problem-aware-candidate" ||
    variantKey === "category-ranked-shortlist"
  ) {
    return withVariantKey(variantKey, getPromptSpecForTopic(context, topic));
  }

  const category = context.categoryLabel;
  const region = context.regionLabel;
  const brand = context.seed.brandName;
  const personaLead = buildPersonaPromptLead(context, persona);
  const personaConcern = buildRoleSpecificConcern(context, persona.roleType);
  const decisionChecks = buildDecisionCheckItems(context);
  const candidateLabel = buildCandidateEntityLabel(context);
  const alternativeOptions = buildAlternativeOptionLabel(context);
  const baseRiskFlags = uniqueStrings([
    "generated_prompt_needs_review",
    "prompt_variant_generated_from_topic",
    ...(context.isRegulatedOrHighTrust ? ["regulated_or_high_trust_review_required"] : [])
  ]);

  if (variantKey === "candidate-shortlist") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${personaLead}、${category}の導入候補を比較するなら、条件に合いそうな${candidateLabel}を3つほど挙げ、${decisionChecks}の観点で社内説明しやすい順に整理してください。`
          : `${personaLead}、自分に合う${category}を選ぶなら、候補になりそうな${candidateLabel}を3つほど挙げ、${decisionChecks}の観点で失敗しにくい順に整理してください。`
        : context.isB2B
          ? `${personaLead}, when comparing adoption candidates for ${category}, list about three suitable ${candidateLabel} and order them by ${decisionChecks} for internal decision-making.`
          : `${personaLead}, when choosing ${category}, list about three suitable ${candidateLabel} and order them by ${decisionChecks} to avoid a poor fit.`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 導入候補 比較 ${decisionChecks}`
          : `${category} 自分に合う 失敗しない 比較 ${decisionChecks}`
        : context.isB2B
          ? `${category} adoption shortlist comparison ${decisionChecks}`
          : `${category} fit avoid bad choice comparison ${decisionChecks}`,
      languageMode: "comparison_shortcut",
      category: "persona_based",
      intent: "buyer_intent",
      intentType: "commercial_investigation",
      responseShape: "ranked_recommendation",
      candidateMentionOpportunity: "direct",
      rankingOpportunity: "direct",
      qualityScore: 76,
      gateReason: "Selection shortlist prompt can expose candidate mentions while staying non-branded and review-gated.",
      seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
      riskFlags: baseRiskFlags
    }));
  }

  if (variantKey === "implementation-approval") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${personaLead}、${category}を導入する前に、${decisionChecks}と契約前の確認点をどう整理すれば社内承認を通しやすいですか。`
          : `${personaLead}、初めて${category}を選ぶ前に、${decisionChecks}と失敗しやすい点をどう確認すべきですか。`
        : context.isB2B
          ? `${personaLead}, before adopting ${category}, how should they organize ${decisionChecks} and pre-contract checks for internal approval?`
          : `${personaLead}, before choosing ${category} for the first time, what should they check about ${decisionChecks} and common failure points?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 導入前 社内承認 ${decisionChecks}`
          : `${category} 初めて 失敗したくない ${decisionChecks}`
        : context.isB2B
          ? `${category} before adoption internal approval ${decisionChecks}`
          : `${category} first time avoid failure ${decisionChecks}`,
      languageMode: context.isB2B ? "professional_research" : "anxious_user",
      category: "persona_based",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "weak",
      rankingOpportunity: "weak",
      qualityScore: 76,
      gateReason: "Implementation and approval prompt supports decision quality but remains excluded from visibility/ranking.",
      seedTerms: [context.seed.industryCategory],
      riskFlags: baseRiskFlags
    }));
  }

  if (variantKey === "local-review-price") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${region}で${category}を探す人は、料金、口コミ、予約しやすさ、アクセスをどう比べると失敗を避けやすいですか。`
        : `When looking for ${category} in ${region}, how should someone compare price, reviews, booking ease, and access to avoid a poor choice?`,
      rawUserIntent: context.isJapanese ? `${region} ${category} 口コミ 料金 予約しやすい` : `${region} ${category} reviews price booking`,
      languageMode: "anxious_user",
      category: "pricing_reputation",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "weak",
      rankingOpportunity: "weak",
      qualityScore: 76,
      gateReason: "Local price and review prompt keeps consumer anxiety while excluding criteria-only answers from market metrics.",
      seedTerms: [context.seed.industryCategory, ...context.seed.regions],
      riskFlags: uniqueStrings([...baseRiskFlags, "local_review_price_claims_need_verification"])
    }));
  }

  if (variantKey === "local-first-visit") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${region}で初めて${category}を利用するなら、近くの候補や代替手段をどう探し、問い合わせ前に何を確認すべきですか。`
        : `For a first-time user in ${region}, how should they find nearby ${category} options or substitutes, and what should they check before contacting one?`,
      rawUserIntent: context.isJapanese ? `${region} ${category} 初めて 近く 代替 問い合わせ前` : `${region} ${category} first time nearby alternatives before contact`,
      languageMode: "raw_search_like",
      category: "alternative_search",
      intent: "comparison",
      intentType: "comparison",
      responseShape: "comparative_set",
      candidateMentionOpportunity: "likely",
      rankingOpportunity: "comparable_set",
      qualityScore: 76,
      gateReason: "Local first-visit prompt broadens nearby and substitute discovery without naming the target brand.",
      seedTerms: [context.seed.industryCategory, ...context.seed.regions],
      riskFlags: uniqueStrings([...baseRiskFlags, "local_market_claims_not_measured"])
    }));
  }

  if (variantKey === "citation-evidence-types") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${category}を比較するAI回答では、公式ページ、事例、料金、口コミ、専門家情報など、どの種類の情報源を確認すると判断しやすいですか。`
        : `When an AI answer compares ${category}, which source types such as official pages, case studies, pricing, reviews, or expert information should be checked?`,
      rawUserIntent: context.isJapanese ? `${category} AI回答 情報源 公式 事例 料金 口コミ` : `${category} AI answer source types official case pricing reviews`,
      languageMode: "professional_research",
      category: "citation_check",
      intent: "citation_check",
      intentType: "evidence_seeking",
      responseShape: "evidence_answer",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      qualityScore: 75,
      gateReason: "Citation evidence prompt is source-analysis only and must not be treated as ranking evidence.",
      seedTerms: [context.seed.industryCategory],
      riskFlags: uniqueStrings([...baseRiskFlags, "citation_check_not_ranking_evidence"])
    }));
  }

  if (variantKey === "brand-perception-fit") {
    return {
      variantKey,
      text: context.isJapanese
        ? `${brand}は${category}を検討している人に向いていますか。利用前に確認したい強み、不安、注意点を教えてください。`
        : `Is ${brand} a fit for someone considering ${category}? Explain strengths, concerns, and cautions to check before using it.`,
      rawUserIntent: context.isJapanese ? `${brand} 向いている 不安 注意点` : `${brand} fit concerns cautions`,
      languageMode: "natural_conversation",
      category: "branded",
      intent: "brand_perception",
      intentType: "reputational",
      brandingMode: "branded",
      brandMentionRule: "brand_included",
      competitorMentionRule: "no_competitor",
      responseShape: "branded_sentiment_answer",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      qualityScore: 74,
      gateDecision: "revise_before_measurement",
      gateReason: "Generated brand-perception prompt is sentiment-only and excluded from visibility/ranking.",
      seedTerms: [brand, ...(context.seed.brandAliases ?? [])],
      seedContaminationRisk: "low",
      confidenceScore: clampScore(68 - (context.isRegulatedOrHighTrust ? 5 : 0)),
      riskFlags: uniqueStrings([...baseRiskFlags, "branded_prompt_excluded_from_market_metrics"])
    };
  }

  if (variantKey === "qualification-source-check") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${category}を慎重に比較する人は、資格、説明範囲、費用、リスク、相談前に見るべき情報源をどの順で確認するとよいですか。`
        : `When carefully comparing ${category}, in what order should someone verify qualifications, scope, fees, risks, and sources before consulting a provider?`,
      rawUserIntent: context.isJapanese ? `${category} 資格 費用 リスク 情報源 相談前` : `${category} qualification fee risk source before consultation`,
      languageMode: "anxious_user",
      category: "persona_based",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      qualityScore: 78,
      gateReason: "High-trust source-check prompt converts risky intent into verification steps and stays out of market metrics.",
      seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
      riskFlags: uniqueStrings([...baseRiskFlags, "risky_intent_safely_transformed", "outcome_guarantee_language_forbidden"])
    }));
  }

  if (variantKey === "build-buy-substitute") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${personaLead}、${category}を導入する前に、${alternativeOptions}をどの観点で比較すべきですか。候補カテゴリも含めて整理してください。`
          : `${personaLead}、${category}を探すとき、${alternativeOptions}をどう比べれば自分に合う選択肢を見つけやすいですか。`
        : context.isB2B
          ? `${personaLead}, before adopting ${category}, which criteria should they use to compare ${alternativeOptions}? Include candidate categories.`
          : `${personaLead}, when looking for ${category}, how should they compare ${alternativeOptions} to find a good fit?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 導入前 代替 比較`
          : `${category} 自分に合う 代替 比較`
        : context.isB2B
          ? `${category} before adoption alternatives compare`
          : `${category} good fit alternatives compare`,
      languageMode: context.isB2B ? "professional_research" : "comparison_shortcut",
      category: "alternative_search",
      intent: "comparison",
      intentType: "comparison",
      responseShape: "comparative_set",
      candidateMentionOpportunity: "likely",
      rankingOpportunity: "comparable_set",
      qualityScore: 77,
      gateReason: "Build-vs-buy variant supports unknown competitor and substitute discovery without inventing named competitors.",
      seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
      riskFlags: uniqueStrings([...baseRiskFlags, "unknown_competitor_discovery_not_named_competitor_evidence"])
    }));
  }

  if (variantKey === "trust-proof-check") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${personaLead}、${category}の費用対効果や評判を社内に説明する場合、${decisionChecks}と契約前の確認点をどう切り分けるべきですか。`
          : `${personaLead}、料金や口コミを見て${category}で迷う場合、${decisionChecks}をどう確認すると自分に合うか判断しやすいですか。`
        : context.isB2B
          ? `${personaLead}, when explaining the ROI and reputation of ${category} internally, how should they separate ${decisionChecks} from pre-contract checks?`
          : `${personaLead}, when price or reviews make ${category} hard to choose, how should they check ${decisionChecks} to judge fit?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 費用対効果 評判 社内説明 ${decisionChecks}`
          : `${category} 料金 口コミ 自分に合う ${decisionChecks}`
        : context.isB2B
          ? `${category} ROI reputation internal explanation ${decisionChecks}`
          : `${category} price reviews fit ${decisionChecks}`,
      languageMode: context.isB2B ? "professional_research" : "anxious_user",
      category: "pricing_reputation",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "weak",
      rankingOpportunity: "weak",
      qualityScore: 76,
      gateReason: "Trust-proof prompt checks pricing and reputation risk without asserting unmeasured facts.",
      seedTerms: [context.seed.industryCategory],
      riskFlags: uniqueStrings([...baseRiskFlags, "price_review_claims_need_verification"])
    }));
  }

  if (variantKey === "solution-category-comparison") {
    return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${personaLead}、${personaConcern}という状況なら、${category}以外も含めてどんな解決策カテゴリを比較検討すべきですか。`
          : `${personaLead}、${personaConcern}という状況なら、${category}以外にどんな選択肢や探し方も比べるとよいですか。`
        : context.isB2B
          ? `${personaLead}, if the issue is that ${personaConcern.toLowerCase()}, which solution categories should be evaluated, including options beyond ${category}?`
          : `${personaLead}, if the issue is that ${personaConcern.toLowerCase()}, which options or search paths beyond ${category} should they compare?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 業務課題 解決策カテゴリ 比較`
          : `${category} 悩み 自分に合う 選択肢 比較`
        : context.isB2B
          ? `${category} business problem solution categories compare`
          : `${category} concern fit options compare`,
      languageMode: context.isB2B ? "professional_research" : "natural_conversation",
      category: "problem_solution",
      intent: "solution_aware",
      intentType: "informational",
      responseShape: "candidate_list",
      candidateMentionOpportunity: "likely",
      rankingOpportunity: "weak",
      qualityScore: 75,
      gateReason: "Solution-category variant observes candidate categories without forcing ranking.",
      seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
      riskFlags: baseRiskFlags
    }));
  }

  return withVariantKey(variantKey, makeNonBrandedPromptSpec(context, {
    text: context.isJapanese
      ? context.isB2B
        ? `${personaLead}、${category}を比較検討するとき、候補を絞る前にどの評価軸、運用負荷、代替カテゴリを確認すべきですか。`
        : `${personaLead}、${category}を選ぶとき、候補を絞る前に料金、口コミ、自分に合うか、代替手段をどう比べるべきですか。`
      : context.isB2B
        ? `${personaLead}, when evaluating ${category}, which criteria, operating effort, and alternative categories should be checked before narrowing the shortlist?`
        : `${personaLead}, when choosing ${category}, how should they compare price, reviews, fit, and alternatives before narrowing options?`,
    rawUserIntent: context.isJapanese
      ? context.isB2B
        ? `${category} 比較検討 評価軸 運用負荷 代替`
        : `${category} 料金 口コミ 自分に合う 代替`
      : context.isB2B
        ? `${category} evaluation criteria operating effort alternatives`
        : `${category} price reviews fit alternatives`,
    languageMode: context.isB2B ? "professional_research" : "natural_conversation",
    category: "non_branded",
    intent: "comparison",
    intentType: "comparison",
    responseShape: "comparative_set",
    candidateMentionOpportunity: "likely",
    rankingOpportunity: "comparable_set",
    qualityScore: 76,
    gateReason: "Category comparison-axis prompt broadens non-branded discovery without naming the target brand.",
    seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
    riskFlags: baseRiskFlags
  }));
}

function withVariantKey(variantKey: string, spec: PromptSpec): PromptVariantSpec {
  return {
    ...spec,
    variantKey
  };
}

function buildPersonaPromptLead(context: GenerationContext, persona: PersonaDraft) {
  return context.isJapanese
    ? `${persona.displayName}の立場で`
    : `From the perspective of ${persona.displayName}`;
}

function getPromptSpecForTopic(context: GenerationContext, topic: TopicDraft): PromptSpec {
  const category = sanitizeForPrompt(topic.topicName, context.seed) || context.categoryLabel;
  const region = context.regionLabel;
  const brand = context.seed.brandName;
  const decisionChecks = buildDecisionCheckItems(context);
  const candidateLabel = buildCandidateEntityLabel(context);
  const alternativeOptions = buildAlternativeOptionLabel(context);
  const baseRiskFlags = uniqueStrings([
    "generated_prompt_needs_review",
    ...(context.isRegulatedOrHighTrust ? ["regulated_or_high_trust_review_required"] : [])
  ]);

  if (topic.topicType === "problem_solution_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${category}を導入する前に、どのような業務課題なら候補比較を始めるべきですか？`
          : `初めて${category}を選ぶとき、失敗しないためにまず何を比べればいいですか？`
        : context.isB2B
          ? `Before adopting ${category}, which business problems should trigger a comparison of candidate options?`
          : `When choosing ${category} for the first time, what should someone compare first to avoid a poor choice?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 導入前 業務課題 候補比較`
          : `${category} 初めて 失敗したくない 何を見る`
        : context.isB2B
          ? `${category} before adoption business problem shortlist`
          : `${category} first time avoid bad choice what to compare`,
      languageMode: "natural_conversation",
      category: "problem_solution",
      intent: "problem_aware",
      intentType: "informational",
      responseShape: "candidate_list",
      candidateMentionOpportunity: "likely",
      rankingOpportunity: "weak",
      qualityScore: 72,
      gateReason: "Generated problem-aware prompt needs human review before measurement.",
      seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
      riskFlags: baseRiskFlags
    });
  }

  if (topic.topicType === "persona_specific_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${category}を導入する前に、${decisionChecks}はどの順番で確認すべきですか？`
          : `${category}を選ぶ前に、${decisionChecks}をどう見れば自分に合うか判断しやすいですか？`
        : context.isB2B
          ? `Before adopting ${category}, in what order should ${decisionChecks} be checked?`
          : `Before choosing ${category}, how should someone review ${decisionChecks} to judge whether it fits them?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 導入前 ${decisionChecks}`
          : `${category} 自分に合う 選び方 ${decisionChecks}`
        : context.isB2B
          ? `${category} before adoption ${decisionChecks}`
          : `${category} fit selection criteria ${decisionChecks}`,
      languageMode: context.isB2B ? "professional_research" : context.businessModel === "ecommerce" ? "raw_search_like" : "natural_conversation",
      category: "persona_based",
      intent: "solution_aware",
      intentType: "commercial_investigation",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "weak",
      rankingOpportunity: "weak",
      qualityScore: 70,
      gateReason: "Criteria prompt is useful for review but excluded from market metrics until revised into a candidate prompt.",
      seedTerms: [context.seed.industryCategory],
      riskFlags: baseRiskFlags
    });
  }

  if (topic.topicType === "alternative_search_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${category}を導入する前に、代替手段や比較候補になり得る${alternativeOptions}を挙げ、違いを簡単に整理してください。`
          : `${category}を探すとき、口コミや料金だけでなく${alternativeOptions}も含めて、どんな選択肢を比べるとよいですか。`
        : context.isB2B
          ? `Before adopting ${category}, list comparable ${alternativeOptions} and briefly explain the differences.`
          : `When looking for ${category}, which options should someone compare beyond reviews and price, including ${alternativeOptions}?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 導入前 ${alternativeOptions} 比較候補`
          : `${category} 口コミ 料金 代替 選択肢`
        : context.isB2B
          ? `${category} before adoption alternatives comparison`
          : `${category} reviews price alternatives options`,
      languageMode: context.isB2B ? "professional_research" : "comparison_shortcut",
      category: "alternative_search",
      intent: "comparison",
      intentType: "comparison",
      responseShape: "comparative_set",
      candidateMentionOpportunity: "direct",
      rankingOpportunity: "comparable_set",
      qualityScore: 76,
      gateReason: "Alternative-search prompt is non-branded and can expose comparable sets, but needs review before measurement.",
      seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
      riskFlags: uniqueStrings([...baseRiskFlags, "unknown_competitor_discovery_not_named_competitor_evidence"])
    });
  }

  if (topic.topicType === "pricing_reputation_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? context.isB2B
          ? `${category}の費用対効果を社内承認で説明するには、${decisionChecks}と契約前の注意点をどのように確認すべきですか。`
          : `料金が安い${category}を選ぶ時、口コミだけで判断せずに${decisionChecks}と申込・購入前の注意点をどう確認すべきですか。`
        : context.isB2B
          ? `To explain the ROI of ${category} for internal approval, how should ${decisionChecks} and pre-contract cautions be checked?`
          : `When choosing a low-priced ${category}, how should someone check ${decisionChecks} and pre-purchase cautions instead of relying only on reviews?`,
      rawUserIntent: context.isJapanese
        ? context.isB2B
          ? `${category} 費用対効果 社内承認 ${decisionChecks}`
          : `${category} 料金 安い 口コミだけ 注意点`
        : context.isB2B
          ? `${category} ROI internal approval ${decisionChecks}`
          : `${category} cheap reviews cautions ${decisionChecks}`,
      languageMode: context.isJapanese && !context.isB2B ? "anxious_user" : "natural_conversation",
      category: "pricing_reputation",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "weak",
      rankingOpportunity: "weak",
      qualityScore: 76,
      gateReason: "Price and reputation prompt is useful for risk review but excluded from market metrics unless revised into candidate discovery.",
      seedTerms: [context.seed.industryCategory, ...context.seed.regions],
      riskFlags: uniqueStrings([...baseRiskFlags, "price_review_claims_need_verification"])
    });
  }

  if (topic.topicType === "regulated_risk_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${category}を検討するとき、効果や結果を断定せずに、資格、費用、説明範囲、リスク、専門家への相談前に確認すべき点を整理してください。`
        : `When considering ${category}, summarize what to verify about qualifications, fees, scope, risks, and pre-specialist questions without guaranteeing outcomes.`,
      rawUserIntent: context.isJapanese ? `${category} 不安 安全 資格 確認` : `${category} safety qualification risk check`,
      languageMode: context.isJapanese ? "anxious_user" : "natural_conversation",
      category: "persona_based",
      intent: "solution_aware",
      intentType: "risk_checking",
      responseShape: "evaluation_criteria",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      qualityScore: 78,
      gateReason: "Regulated-risk prompt safely transforms risky intent into verification criteria and remains excluded from market metrics.",
      seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
      riskFlags: uniqueStrings([...baseRiskFlags, "risky_intent_safely_transformed", "outcome_guarantee_language_forbidden"])
    });
  }

  if (topic.topicType === "citation_evidence_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${category}を比較するとき、AI回答ではどのような情報源や根拠を確認すべきですか？`
        : `When comparing ${category}, what sources and evidence should an AI answer check?`,
      rawUserIntent: context.isJapanese ? `${category} 比較 情報源 根拠` : `${category} comparison sources evidence`,
      languageMode: "professional_research",
      category: "citation_check",
      intent: "citation_check",
      intentType: "evidence_seeking",
      responseShape: "evidence_answer",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      qualityScore: 72,
      gateReason: "Citation check prompt is separated from ranking and needs source-analysis review.",
      seedTerms: [context.seed.industryCategory],
      riskFlags: uniqueStrings([...baseRiskFlags, "citation_check_not_ranking_evidence"])
    });
  }

  if (topic.topicType === "branded_sentiment_topic") {
    return {
      text: context.isJapanese
        ? `${brand}の評判や利用前に確認すべき注意点は？`
        : `What is ${brand}'s reputation, and what should someone check before using it?`,
      rawUserIntent: context.isJapanese ? `${brand} 評判 注意点` : `${brand} reputation concerns`,
      languageMode: context.isJapanese ? "natural_conversation" : "natural_conversation",
      category: "branded",
      intent: "sentiment",
      intentType: "reputational",
      brandingMode: "branded",
      brandMentionRule: "brand_included",
      competitorMentionRule: "no_competitor",
      responseShape: "branded_sentiment_answer",
      candidateMentionOpportunity: "none",
      rankingOpportunity: "none",
      qualityScore: 72,
      gateDecision: "revise_before_measurement",
      gateReason: "Generated branded sentiment prompt is for internal review and excluded from visibility/ranking.",
      seedTerms: [brand, ...(context.seed.brandAliases ?? [])],
      seedContaminationRisk: "low",
      confidenceScore: clampScore(68 - (context.isRegulatedOrHighTrust ? 5 : 0)),
      riskFlags: uniqueStrings([...baseRiskFlags, "branded_prompt_excluded_from_market_metrics"])
    };
  }

  if (topic.topicType === "local_regional_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${region}で${category}を探すとき、候補になるサービスや店舗をおすすめ順に比較してください。`
        : `When looking for ${category} in ${region}, compare recommended services or providers in order.`,
      rawUserIntent: context.isJapanese ? `${region} ${category} おすすめ 比較` : `${region} ${category} recommended comparison`,
      languageMode: context.isJapanese ? "comparison_shortcut" : "comparison_shortcut",
      category: "non_branded",
      intent: "buyer_intent",
      intentType: "commercial_investigation",
      responseShape: "ranked_recommendation",
      candidateMentionOpportunity: "direct",
      rankingOpportunity: "direct",
      qualityScore: 72,
      gateReason: "Generated local comparison prompt needs internal review before measurement.",
      seedTerms: [context.seed.industryCategory, ...context.seed.regions],
      riskFlags: uniqueStrings([...baseRiskFlags, "local_market_claims_not_measured"])
    });
  }

  return makeNonBrandedPromptSpec(context, {
    text: context.isJapanese
      ? context.isB2B
        ? `${category}を導入する前に、候補になる${candidateLabel}を3つほど挙げ、${decisionChecks}の観点で比較してください。`
        : `自分に合う${category}を探すとき、候補になる${candidateLabel}を3つほど挙げ、${decisionChecks}の観点で比較してください。`
      : context.isB2B
        ? `Before adopting ${category}, list about three candidate ${candidateLabel} and compare them by ${decisionChecks}.`
        : `When looking for ${category} that fits someone, list about three candidate ${candidateLabel} and compare them by ${decisionChecks}.`,
    rawUserIntent: context.isJapanese
      ? context.isB2B
        ? `${category} 導入候補 比較 ${decisionChecks}`
        : `${category} 自分に合う 比較 ${decisionChecks}`
      : context.isB2B
        ? `${category} adoption candidates compare ${decisionChecks}`
        : `${category} fit candidates compare ${decisionChecks}`,
    languageMode: context.isB2B ? "professional_research" : context.businessModel === "ecommerce" ? "raw_search_like" : "natural_conversation",
    category: "non_branded",
    intent: "buyer_intent",
    intentType: "commercial_investigation",
    responseShape: "ranked_recommendation",
    candidateMentionOpportunity: "direct",
    rankingOpportunity: "direct",
    qualityScore: 72,
    gateReason: "Generated non-branded buyer-intent prompt needs internal review before measurement.",
    seedTerms: [context.seed.industryCategory, context.seed.targetCustomers],
    riskFlags: baseRiskFlags
  });
}

function buildDecisionCheckItems(context: GenerationContext) {
  if (context.isJapanese) {
    if (context.businessModel === "ecommerce") return "料金、口コミ、返品条件、自分に合うか";
    if (context.businessModel === "healthcare") return "料金、口コミ、資格、リスク説明";
    if (context.businessModel === "education") return "料金、口コミ、通いやすさ、初心者に合うか";
    if (context.businessModel === "real_estate") return "初期費用、口コミ、契約前の注意点、家族に合うか";
    if (context.businessModel === "professional_service") {
      return context.isB2B
        ? "費用対効果、実績、専門性、相談前の確認点"
        : "料金、口コミ、専門性、相談前の不安";
    }
    if (context.businessModel === "local_service") return "料金、口コミ、通いやすさ、予約しやすさ";
    if (isHighConsiderationB2BContext(context)) return "費用対効果、移行負荷、セキュリティ、社内承認";
    if (context.isB2B) return "費用対効果、運用負荷、社内承認、既存ツール連携";
    return "料金、口コミ、自分に合うか、失敗しないための確認点";
  }

  if (context.businessModel === "ecommerce") return "price, reviews, return policy, and personal fit";
  if (context.businessModel === "healthcare") return "fees, reviews, qualifications, and risk explanations";
  if (context.businessModel === "education") return "fees, reviews, access, and beginner fit";
  if (context.businessModel === "real_estate") return "initial costs, reviews, pre-contract cautions, and family fit";
  if (context.businessModel === "professional_service") {
    return context.isB2B
      ? "ROI, track record, expertise, and pre-consultation checks"
      : "price, reviews, expertise, and first-consultation concerns";
  }
  if (context.businessModel === "local_service") return "price, reviews, access, and booking ease";
  if (isHighConsiderationB2BContext(context)) return "ROI, migration effort, security, and internal approval";
  if (context.isB2B) return "ROI, operating effort, internal approval, and existing-tool integration";
  return "price, reviews, personal fit, and failure-avoidance checks";
}

function buildCandidateEntityLabel(context: GenerationContext) {
  if (context.isJapanese) {
    if (context.businessModel === "ecommerce") return "商品やブランド";
    if (context.businessModel === "local_service" || context.businessModel === "healthcare" || context.businessModel === "education") {
      return "サービスや店舗";
    }
    if (context.businessModel === "professional_service") return "専門サービスや会社";
    return "サービスや会社";
  }

  if (context.businessModel === "ecommerce") return "products or brands";
  if (context.businessModel === "local_service" || context.businessModel === "healthcare" || context.businessModel === "education") {
    return "services or local providers";
  }
  if (context.businessModel === "professional_service") return "professional services or firms";
  return "services or companies";
}

function buildAlternativeOptionLabel(context: GenerationContext) {
  if (context.isJapanese) {
    if (context.businessModel === "ecommerce") return "別ブランド、低価格品、上位品、中古・レンタル、購入先";
    if (context.businessModel === "local_service" || context.businessModel === "healthcare" || context.businessModel === "education") {
      return "近隣候補、別エリア、オンライン相談、予約方法、代替サービス";
    }
    if (context.businessModel === "professional_service") return "専門会社、個人専門家、内製、ツール、初回相談";
    return "内製、外注、専門会社、ツール、既存のやり方";
  }

  if (context.businessModel === "ecommerce") return "other brands, budget options, premium options, used or rental options, and purchase channels";
  if (context.businessModel === "local_service" || context.businessModel === "healthcare" || context.businessModel === "education") {
    return "nearby providers, other areas, online consultation, booking paths, and substitute services";
  }
  if (context.businessModel === "professional_service") return "specialist firms, individual experts, in-house work, tools, and first consultations";
  return "in-house work, outsourcing, specialist providers, tools, and the current approach";
}

function makeNonBrandedPromptSpec(
  context: GenerationContext,
  input: {
    text: string;
    rawUserIntent: string;
    languageMode: PromptLanguageMode;
    category: PromptCategory;
    intent: PromptIntent;
    intentType: PromptIntentType;
    responseShape: PromptResponseShape;
    candidateMentionOpportunity: PromptCandidateMentionOpportunity;
    rankingOpportunity: PromptRankingOpportunity;
    qualityScore: number;
    gateReason: string;
    seedTerms: readonly string[];
    riskFlags: readonly string[];
  }
): PromptSpec {
  const brandIdentity = buildBrandIdentityFromSeed(context.seed);
  const text = ensureBrandExcludedPromptText(input.text, context, brandIdentity);
  const rawUserIntent = ensureBrandExcludedPromptText(input.rawUserIntent, context, brandIdentity);

  return {
    text,
    rawUserIntent,
    languageMode: input.languageMode,
    category: input.category,
    intent: input.intent,
    intentType: input.intentType,
    brandingMode: "non_branded" as const,
    brandMentionRule: "brand_excluded" as const,
    competitorMentionRule: "unknown_competitor_discovery" as const,
    responseShape: input.responseShape,
    candidateMentionOpportunity: input.candidateMentionOpportunity,
    rankingOpportunity: input.rankingOpportunity,
    qualityScore: input.qualityScore,
    gateDecision: "revise_before_measurement" as const,
    gateReason: input.gateReason,
    seedTerms: input.seedTerms.filter(hasText).map((term) => sanitizeForPrompt(term, context.seed)).filter(hasText),
    seedContaminationRisk: "low" as const,
    confidenceScore: clampScore(68 - (context.isRegulatedOrHighTrust ? 5 : 0)),
    riskFlags: input.riskFlags
  };
}

function buildInputCompletion(seed: ProjectSetupSeedInput, context: GenerationContext): InputCompletionItem[] {
  return [
    requiredCompletion("companyName", seed.companyName),
    requiredCompletion("brandName", seed.brandName),
    requiredCompletion("officialSiteUrl", seed.officialSiteUrl),
    requiredCompletion("productOrServiceDescription", seed.productOrServiceDescription),
    requiredCompletion("industryCategory", seed.industryCategory),
    requiredCompletion("targetCustomers", seed.targetCustomers),
    requiredCompletion("regions", seed.regions),
    requiredCompletion("language", seed.language),
    optionalCompletion("serviceName", seed.serviceName ?? null),
    optionalCompletion("brandAliases", seed.brandAliases ?? []),
    optionalCompletion("knownCompetitors", seed.knownCompetitors ?? []),
    optionalCompletion("avoidCompetitors", seed.avoidCompetitors ?? []),
    optionalCompletion("strengths", seed.strengths ?? []),
    optionalCompletion("knownRisks", seed.knownRisks ?? []),
    optionalCompletion("diagnosisGoals", seed.diagnosisGoals ?? []),
    {
      field: "businessModel",
      status: context.businessModel === "unknown" ? "needs_confirmation" : "inferred",
      value: context.businessModel,
      note: "Deterministic inference from industry, service description, target customers, and regions."
    },
    {
      field: "industryAdapter",
      status: "inferred",
      value: context.industryAdapter,
      note: "Used only to shape draft personas, topics, and prompts; not treated as verified customer evidence."
    },
    {
      field: "serviceEvidenceCategory",
      status: "inferred",
      value: context.categoryCandidate.label,
      note: `Deterministic service-evidence category candidate. Reasons: ${context.categoryCandidate.reasons.slice(0, 4).join(", ")}.`
    },
    {
      field: "serviceEvidenceQuestionAreas",
      status: "inferred",
      value: context.questionAreaCandidates.map((candidate) => candidate.label).slice(0, 6),
      note: "Deterministic question-area candidates derived from service evidence; internal IDs are not customer-facing."
    },
    {
      field: "generationMode",
      status: "inferred",
      value: "deterministic_rule_based_draft",
      note: "No external AI, crawl, database write, measurement, or automatic approval is performed."
    }
  ];
}

function requiredCompletion(field: string, value: string | readonly string[]): InputCompletionItem {
  const missing = isMissingCompletionValue(value);
  return {
    field,
    status: missing ? "missing" : "provided",
    value: missing ? null : value,
    note: missing ? "Required for project setup draft generation." : undefined
  };
}

function optionalCompletion(field: string, value: string | readonly string[] | null): InputCompletionItem {
  const missing = isMissingCompletionValue(value);
  return {
    field,
    status: missing ? "missing" : "provided",
    value: missing ? null : value
  };
}

function isMissingCompletionValue(value: string | readonly string[] | null | undefined) {
  if (typeof value === "string") return !hasText(value);
  if (Array.isArray(value)) return value.length === 0;
  return true;
}

function normalizeSeedInput(seed: ProjectSetupSeedInput): ProjectSetupSeedInput {
  return {
    companyName: normalizeText(seed.companyName),
    brandName: normalizeText(seed.brandName),
    officialSiteUrl: normalizeText(seed.officialSiteUrl),
    productOrServiceDescription: normalizeText(seed.productOrServiceDescription),
    industryCategory: normalizeText(seed.industryCategory),
    targetCustomers: normalizeText(seed.targetCustomers),
    regions: normalizeStringArray(seed.regions),
    language: normalizeText(seed.language),
    serviceName: normalizeOptionalText(seed.serviceName),
    brandAliases: normalizeOptionalStringArray(seed.brandAliases),
    knownCompetitors: normalizeOptionalStringArray(seed.knownCompetitors),
    avoidCompetitors: normalizeOptionalStringArray(seed.avoidCompetitors),
    strengths: normalizeOptionalStringArray(seed.strengths),
    knownRisks: normalizeOptionalStringArray(seed.knownRisks),
    diagnosisGoals: seed.diagnosisGoals ? uniqueStrings(seed.diagnosisGoals) as readonly PromptIntent[] : undefined
  };
}

function isB2BBusinessModel(seed: ProjectSetupSeedInput, businessModel: BusinessModelKind) {
  if (businessModel === "b2b_software" || businessModel === "b2b_service" || businessModel === "recruiting_hr") return true;
  if (businessModel !== "professional_service") return false;
  const text = normalizeForMatch(`${seed.industryCategory} ${seed.productOrServiceDescription} ${seed.targetCustomers}`);
  return containsAny(text, [
    "b2b",
    "btob",
    "business",
    "company",
    "enterprise",
    "corporate",
    "法人",
    "企業",
    "事業者",
    "経営者",
    "部門",
    "マーケティング",
    "営業",
    "人事"
  ]);
}

function isHighConsiderationB2BContext(context: GenerationContext) {
  if (!context.isB2B) return false;
  const text = normalizeForMatch([
    context.seed.industryCategory,
    context.seed.productOrServiceDescription,
    context.seed.targetCustomers,
    ...(context.seed.knownRisks ?? [])
  ].join(" "));

  return containsAny(text, [
    "enterprise",
    "procurement",
    "budget",
    "contract",
    "roi",
    "security",
    "integration",
    "migration",
    "implementation",
    "approval",
    "high ticket",
    "high-ticket",
    "高単価",
    "基幹",
    "複数拠点",
    "全社",
    "大企業",
    "エンタープライズ",
    "予算",
    "稟議",
    "契約",
    "費用対効果",
    "セキュリティ",
    "連携",
    "移行",
    "導入費用",
    "導入負荷",
    "dx投資"
  ]);
}

export function buildServiceEvidenceTerms(seed: ProjectSetupSeedInput): ServiceEvidenceTerm[] {
  const terms: ServiceEvidenceTerm[] = [];
  const pushTerm = (
    term: string | null | undefined,
    source: ServiceEvidenceTerm["source"],
    weight: number
  ) => {
    const normalized = normalizeEvidenceTerm(term);
    if (!hasText(normalized)) return;
    terms.push({
      term: normalizeText(term ?? ""),
      normalized,
      source,
      weight
    });
  };
  const pushTerms = (
    values: readonly (string | null | undefined)[],
    source: ServiceEvidenceTerm["source"],
    weight: number
  ) => values.forEach((value) => pushTerm(value, source, weight));

  pushTerms([seed.productOrServiceDescription], "service_description", 5);
  pushTerms(splitEvidenceText(seed.productOrServiceDescription), "service_description", 2);
  pushTerms([seed.industryCategory], "category", 4);
  pushTerms(splitEvidenceText(seed.industryCategory), "category", 2);
  pushTerms([seed.targetCustomers], "audience", 3);
  pushTerms(splitEvidenceText(seed.targetCustomers), "audience", 1.5);
  pushTerms(seed.regions, "region", 1.2);
  pushTerms(seed.knownCompetitors ?? [], "competitor", 1.2);
  pushTerms(seed.avoidCompetitors ?? [], "competitor", 1.2);
  pushTerms(seed.strengths ?? [], "service_description", 3);
  pushTerms(seed.knownRisks ?? [], "goal", 2);
  pushTerms((seed.diagnosisGoals ?? []).map((goal) => goal.replace(/_/g, " ")), "goal", 2);
  pushTerms([seed.companyName, seed.brandName, seed.serviceName, ...(seed.brandAliases ?? [])], "brand", 0.7);
  pushTerm(extractSeedHostname(seed.officialSiteUrl), "url_metadata", 1.4);
  pushTerms(splitHostnameEvidence(extractSeedHostname(seed.officialSiteUrl)), "url_metadata", 0.8);

  return uniqueBy(terms, (term) => `${term.source}:${term.normalized}`)
    .filter((term) => !isLowSignalEvidenceTerm(term));
}

export function scoreCategoryCandidates(
  evidenceTerms: readonly ServiceEvidenceTerm[],
  seed: ProjectSetupSeedInput
): CategoryCandidate[] {
  const seedAudienceText = normalizeEvidenceTerm(`${seed.targetCustomers} ${seed.industryCategory}`);
  const legacyBusinessModel = classifyBusinessModel(seed);
  const allowLegacyEcommerce = hasExplicitEcommerceEvidence(evidenceTerms);
  const allowFinanceInvestment = hasExplicitFinanceEvidence(evidenceTerms);
  const scored = CATEGORY_SCORING_RULES.map((rule) => {
    const reasons: string[] = [];
    let score = 0;

    for (const evidence of evidenceTerms) {
      for (const weighted of rule.weightedTerms) {
        if (!evidenceMatchesTerm(evidence.normalized, weighted.term)) continue;
        const sourceMultiplier = getEvidenceSourceMultiplier(evidence.source);
        score += evidence.weight * weighted.weight * sourceMultiplier;
        reasons.push(`${evidence.source}:${weighted.term}`);
      }
      for (const weighted of rule.audienceTerms ?? []) {
        if (evidence.source !== "audience" && evidence.source !== "category") continue;
        if (!evidenceMatchesTerm(evidence.normalized, weighted.term)) continue;
        score += evidence.weight * weighted.weight * 1.2;
        reasons.push(`${evidence.source}:${weighted.term}`);
      }
    }

    if (isB2BAudience(seedAudienceText) && isB2BCategoryProfile(rule.profile)) {
      score += 8;
      reasons.push("audience:b2b_hint");
    }
    if (isB2CAudience(seedAudienceText) && isConsumerCategoryProfile(rule.profile) && (rule.profile !== "finance_investment" || allowFinanceInvestment)) {
      score += 8;
      reasons.push("audience:b2c_hint");
    }
    if (rule.profile === "ecommerce_product" && hasExplicitEcommerceEvidence(evidenceTerms)) {
      score += 8;
      reasons.push("category:explicit_ecommerce_signal");
    }
    if (rule.profile === "local_service" && seed.regions.length > 0 && !isNationalRegionOnly(seed.regions)) {
      score += 5;
      reasons.push("region:local_region_hint");
    }
    if (rule.profile === "seo_ai_search" && score > 0 && scoreCategoryKeyword(evidenceTerms, "seo") > 0) {
      score += 3;
      reasons.push("service_description:seo_supporting_signal");
    }
    if (rule.businessModel === legacyBusinessModel && (legacyBusinessModel !== "ecommerce" || allowLegacyEcommerce) && (rule.profile !== "finance_investment" || allowFinanceInvestment)) {
      score += 14;
      reasons.push(`legacy_classifier:${legacyBusinessModel}`);
    }

    return {
      label: rule.label,
      profile: rule.profile,
      score: Math.round(score),
      reasons: uniqueStrings(reasons)
    };
  })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  const candidates = scored.length > 0 ? scored : [OTHER_CATEGORY_CANDIDATE];
  return uniqueBy(candidates, (candidate) => candidate.profile).slice(0, 5);
}

export function scoreQuestionAreaCandidates(
  category: CategoryCandidate,
  evidenceTerms: readonly ServiceEvidenceTerm[],
  seed: ProjectSetupSeedInput
): QuestionAreaCandidate[] {
  const isJapanese = seed.language === "ja";
  const t = (ja: string, en: string) => isJapanese ? ja : en;
  const serviceText = evidenceTerms
    .filter((term) => term.source !== "brand" && term.source !== "competitor")
    .map((term) => term.normalized)
    .join(" ");
  const isKidsEducation = evidenceMatchesTerm(serviceText, "子ども") ||
    evidenceMatchesTerm(serviceText, "こども") ||
    evidenceMatchesTerm(serviceText, "保護者") ||
    evidenceMatchesTerm(serviceText, "kids");
  const isEnglishSchool = evidenceMatchesTerm(serviceText, "英会話") ||
    evidenceMatchesTerm(serviceText, "english conversation");
  const isMattress = evidenceMatchesTerm(serviceText, "マットレス") ||
    evidenceMatchesTerm(serviceText, "睡眠") ||
    evidenceMatchesTerm(serviceText, "mattress");
  const isCosmetics = evidenceMatchesTerm(serviceText, "化粧品") ||
    evidenceMatchesTerm(serviceText, "スキンケア") ||
    evidenceMatchesTerm(serviceText, "肌") ||
    evidenceMatchesTerm(serviceText, "cosmetics");

  const baseReasons = uniqueStrings([
    `category:${category.profile}`,
    ...category.reasons.slice(0, 3)
  ]);
  const makeCandidate = (
    label: string,
    description: string,
    sourceTopicType: TopicType | undefined,
    metricHint: QuestionAreaMetricHint,
    score: number,
    reasons: readonly string[] = []
  ): QuestionAreaCandidate => ({
    label,
    description,
    sourceTopicType,
    metricHint,
    score,
    reasons: uniqueStrings([...baseReasons, ...reasons])
  });

  const commonCitation = makeCandidate(
    t("公式サイトや第三者情報で根拠を確認できるか", "Source and evidence behavior"),
    t("AI回答で参照される情報源、根拠、確認不足の点を確認します。", "Check which sources, proof points, and verification gaps appear in AI answers."),
    "citation_evidence_topic",
    "evidence",
    64
  );
  const commonSentiment = makeCandidate(
    t("ブランド名で聞かれた時の見え方", "Brand perception summary"),
    t("ブランド名を含む質問で、評価・不安・認識がどう表れるかを確認します。", "Check how the brand is described when the customer asks directly about it."),
    "branded_sentiment_topic",
    "sentiment",
    60
  );

  if (category.profile === "seo_ai_search") {
    return [
      makeCandidate(t("AI検索で候補に出るか", "AI search visibility"), t("サービスカテゴリがAI検索回答で自然に候補として出るかを確認します。", "Check whether the service category appears naturally in AI search answers."), "category_discovery_topic", "visibility", 92),
      makeCandidate(t("競合や代替手段とどう比較されるか", "Comparison with alternatives"), t("ブランド名を出さない質問で、候補サービスや評価軸がどう比較されるかを確認します。", "Check how AI answers compare candidate services and evaluation axes without naming the brand."), "alternative_search_topic", "comparison", 88),
      makeCandidate(t("公式サイトが引用されやすいか", "Citation and source readiness"), t("公式ページや第三者情報が回答の根拠として使われそうかを確認します。", "Check whether official pages and third-party evidence are likely to support the answer."), "citation_evidence_topic", "evidence", 84),
      makeCandidate(t("導入前の不安に答えられるか", "Pre-adoption concerns"), t("問い合わせ前に出やすい証拠、対象範囲、運用面の不安を確認します。", "Check what proof, scope, and operational concerns appear before inquiry."), "persona_specific_topic", "risk", 76),
      commonSentiment
    ];
  }

  if (category.profile === "recruiting_hr") {
    return [
      makeCandidate(t("採用管理が候補に出るか", "Hiring workflow fit"), t("候補者管理、面接調整、採用業務の課題が回答に出るかを確認します。", "Check whether candidate management, interview coordination, and hiring workflow needs appear."), "category_discovery_topic", "visibility", 91),
      makeCandidate(t("採用ツールや外注と比較されるか", "Recruiting tool comparison"), t("ATS、採用管理ツール、外注、現行業務との比較軸を確認します。", "Check how AI answers compare ATS, recruiting tools, outsourcing, and current workflows."), "alternative_search_topic", "comparison", 88),
      makeCandidate(t("関係者ごとの確認点が出るか", "Stakeholder concerns"), t("人事、採用責任者、経営者、面接担当者が導入前に見る不安を確認します。", "Check concerns for HR owners, hiring managers, executives, and interviewers before adoption."), "persona_specific_topic", "risk", 84),
      makeCandidate(t("実績や運用上の信頼材料を確認できるか", "Evidence and trust checks"), t("導入実績、運用上の注意点、データ取り扱いの確認点を見ます。", "Check what proof, implementation cautions, and data handling points appear."), "regulated_risk_topic", "risk", 78),
      commonCitation,
      commonSentiment
    ];
  }

  if (category.profile === "school_education") {
    return [
      makeCandidate(
        isKidsEducation ? t("子どもに合うか、保護者の不安に答えられるか", "Child fit and guardian concerns") : isEnglishSchool ? t("初めて選ぶ時に失敗しないか", "Beginner fit and lesson choice") : t("講座や学び方が合うか", "Course fit and learning needs"),
        isKidsEducation
          ? t("講師、カリキュラム、安全性、子どもとの相性への不安が出るかを確認します。", "Check whether guardian concerns about teachers, curriculum, safety, and fit for the child appear.")
          : t("レベルの合い方、体験レッスン、料金、口コミ、続けやすさが出るかを確認します。", "Check whether level fit, trial lessons, price, reviews, and learning continuity appear."),
        "category_discovery_topic",
        "visibility",
        90,
        isKidsEducation ? ["service_description:kids_education"] : ["service_description:adult_or_general_education"]
      ),
      makeCandidate(
        isKidsEducation ? t("講師・カリキュラム・安全性を比較できるか", "Teacher, curriculum, and safety comparison") : t("料金・口コミ・体験レッスンを比較できるか", "Price, reviews, and trial lesson comparison"),
        isKidsEducation
          ? t("講師、カリキュラム、通いやすさ、安全性、体験の比較軸を確認します。", "Check how AI answers compare teachers, curriculum, commute, safety, and trial lessons.")
          : t("料金、口コミ、通いやすさ、体験レッスン、授業スタイルの比較軸を確認します。", "Check how AI answers compare price, reviews, access, trial lessons, and lesson style."),
        "alternative_search_topic",
        "comparison",
        86
      ),
      makeCandidate(t("申込前に何を確認すべきか", "Before-enrollment checks"), t("申込や体験前に確認すべき相性、費用、通いやすさ、注意点を見ます。", "Check what customers should confirm before applying or taking a trial lesson."), "persona_specific_topic", "risk", 80),
      makeCandidate(t("口コミや評判をどう見るか", "Reviews and reputation"), t("口コミ、成果、料金、サポートが誇張なく扱われるかを確認します。", "Check how reviews, outcomes, price, and support are handled without unsupported claims."), "pricing_reputation_topic", "reputation", 75),
      commonCitation,
      commonSentiment
    ];
  }

  if (category.profile === "ecommerce_product") {
    return [
      makeCandidate(
        isMattress ? t("睡眠悩みや寝心地に合うか", "Sleep concern and mattress fit") : isCosmetics ? t("肌に合うか、成分に不安がないか", "Skin fit and ingredient concerns") : t("商品が自分に合うか", "Product fit and purchase concerns"),
        isMattress
          ? t("睡眠悩み、寝心地、素材、価格、口コミ、返品条件が出るかを確認します。", "Check whether sleep concerns, comfort, materials, price, reviews, and return conditions appear.")
          : isCosmetics
            ? t("肌との相性、成分、口コミ、価格、定期購入条件が出るかを確認します。", "Check whether skin fit, ingredients, reviews, price, and subscription conditions appear.")
            : t("商品の合い方、品質、価格、口コミ、返品条件が出るかを確認します。", "Check whether product fit, quality, price, reviews, and return conditions appear."),
        "category_discovery_topic",
        "visibility",
        90,
        isMattress ? ["service_description:mattress"] : isCosmetics ? ["service_description:cosmetics"] : []
      ),
      makeCandidate(
        isMattress ? t("寝心地・素材・返品条件を比較できるか", "Comfort, materials, and return comparison") : isCosmetics ? t("成分・口コミ・定期購入条件を比較できるか", "Ingredients, reviews, and subscription comparison") : t("価格・品質・返品条件を比較できるか", "Price, quality, and return comparison"),
        isMattress
          ? t("寝心地、素材、体への合い方、保証、価格、返品条件の比較軸を確認します。", "Check how AI answers compare comfort, material, body fit, warranty, price, and return policy.")
          : isCosmetics
            ? t("成分、肌悩み、口コミ、価格、定期購入条件の比較軸を確認します。", "Check how AI answers compare ingredients, skin concerns, reviews, price, and subscription terms.")
            : t("商品、ブランド、品質、価格、口コミ、返品条件の比較軸を確認します。", "Check how AI answers compare products, brands, quality, price, reviews, and return policy."),
        "alternative_search_topic",
        "comparison",
        86
      ),
      makeCandidate(t("購入前の失敗を避けられるか", "Purchase risk checks"), t("口コミだけに頼らず、購入前に確認すべき条件を見ます。", "Check what customers should confirm before purchasing rather than relying only on reviews."), "persona_specific_topic", "risk", 80),
      makeCandidate(t("価格・口コミ・信頼材料を確認できるか", "Price, reviews, and trust"), t("価格、口コミ、根拠、配送、返品が整理されるかを確認します。", "Check how price, reviews, proof, delivery, and returns are organized."), "pricing_reputation_topic", "reputation", 77),
      commonCitation,
      commonSentiment
    ];
  }

  if (category.profile === "healthcare_clinic") {
    return [
      makeCandidate(t("初回相談前の不安に答えられるか", "First consultation concerns"), t("料金、医師情報、リスク、相談の流れが出るかを確認します。", "Check whether fees, doctor information, risks, and consultation flow appear."), "category_discovery_topic", "visibility", 90),
      makeCandidate(t("クリニック比較の注意点が出るか", "Clinic comparison cautions"), t("治療効果を断定せず、クリニックの比較軸が出るかを確認します。", "Check how AI answers compare clinics without making treatment guarantees."), "alternative_search_topic", "comparison", 86),
      makeCandidate(t("相談前に何を確認すべきか", "Pre-consultation checks"), t("相性、料金、対応範囲、リスクを相談前に確認できるかを見ます。", "Check what customers should confirm about fit, fees, scope, and risks before consulting."), "persona_specific_topic", "risk", 84),
      makeCandidate(t("資格やリスク説明を確認できるか", "Safety and qualification checks"), t("資格、料金、対応範囲、リスク、相談前の確認事項を見ます。", "Check qualifications, fees, scope, risks, and pre-consultation questions."), "regulated_risk_topic", "risk", 88),
      makeCandidate(t("口コミと料金を慎重に確認できるか", "Reviews and fee checks"), t("口コミ、料金、信頼材料が慎重に扱われるかを確認します。", "Check how reviews, fees, and trust points are handled cautiously."), "pricing_reputation_topic", "reputation", 78),
      commonCitation,
      commonSentiment
    ];
  }

  if (category.profile === "local_service") {
    return [
      makeCandidate(t("近くで候補に出るか", "Nearby provider discovery"), t("近くの候補、アクセス、予約しやすさ、料金、口コミが出るかを確認します。", "Check whether nearby options, access, booking, price, and reviews appear."), "category_discovery_topic", "local", 88),
      makeCandidate(t("エリアや予約しやすさで比較できるか", "Area and booking comparison"), t("エリア、予約しやすさ、空き状況、代替候補の比較軸を確認します。", "Check how AI answers compare area, booking ease, availability, and substitutes."), "local_regional_topic", "local", 86),
      makeCandidate(t("予約前に何を確認すべきか", "Pre-booking checks"), t("相性、料金、予約の流れ、注意点を予約前に確認できるかを見ます。", "Check what customers should confirm about fit, price, booking flow, and cautions before booking."), "persona_specific_topic", "risk", 80),
      makeCandidate(t("料金や口コミをどう見るか", "Price and review trust"), t("料金、口コミ、スタッフ、予約前の注意点が出るかを確認します。", "Check how price, reviews, staff, and pre-booking cautions appear."), "pricing_reputation_topic", "reputation", 78),
      commonCitation,
      commonSentiment
    ];
  }

  if (category.profile === "professional_service" || category.profile === "marketing_seo") {
    return [
      makeCandidate(t("相談したい課題に合うか", "Consultation need discovery"), t("顧客の課題、対応範囲、支援の進め方が出るかを確認します。", "Check whether customer problems, scope, and expected support paths appear."), "category_discovery_topic", "visibility", 88),
      makeCandidate(t("専門会社・内製・ツールと比較できるか", "Provider and in-house comparison"), t("支援会社、専門家、ツール、内製との比較軸を確認します。", "Check how AI answers compare agencies, experts, tools, and in-house work."), "alternative_search_topic", "comparison", 86),
      makeCandidate(t("相談前の確認点が出るか", "Before-consultation checks"), t("実績、対応範囲、費用、プロジェクト適性、リスクを確認します。", "Check proof, scope, fees, project fit, and risks before inquiry."), "persona_specific_topic", "risk", 82),
      commonCitation,
      commonSentiment
    ];
  }

  return [
    makeCandidate(t("カテゴリ候補に出るか", "Category discovery"), t("顧客課題と候補カテゴリがAI回答でどう説明されるかを確認します。", "Check how AI answers describe the customer problem and candidate category."), "category_discovery_topic", "visibility", 72),
    makeCandidate(t("代替手段と比較されるか", "Alternative comparison"), t("比較される選択肢と評価軸を確認します。", "Check which comparable options and evaluation axes appear."), "alternative_search_topic", "comparison", 68),
    makeCandidate(t("選ぶ前の確認点が出るか", "Selection criteria"), t("選ぶ前に確認すべき条件を確認します。", "Check what customers should verify before choosing."), "persona_specific_topic", "risk", 64),
    commonCitation,
    commonSentiment
  ];
}

function mapCategoryCandidateToBusinessModel(
  category: CategoryCandidate,
  seed: ProjectSetupSeedInput
): BusinessModelKind {
  const rule = CATEGORY_SCORING_RULES.find((candidate) => candidate.profile === category.profile);
  if (!rule) return "b2c_service";
  if (
    category.profile === "seo_ai_search" &&
    evidenceMatchesTerm(normalizeEvidenceTerm(seed.productOrServiceDescription), "consulting")
  ) {
    return "professional_service";
  }
  if (
    category.profile === "marketing_seo" &&
    isB2BAudience(normalizeEvidenceTerm(`${seed.targetCustomers} ${seed.industryCategory}`))
  ) {
    return "b2b_service";
  }
  return rule.businessModel;
}

function mapCategoryCandidateToIndustryAdapter(category: CategoryCandidate, businessModel: BusinessModelKind) {
  const rule = CATEGORY_SCORING_RULES.find((candidate) => candidate.profile === category.profile);
  return rule?.industryAdapter ?? getIndustryAdapter(businessModel);
}

function normalizeEvidenceTerm(value: string | null | undefined) {
  return normalizeText(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[、。・／/|()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitEvidenceText(value: string | null | undefined) {
  const normalized = normalizeText(value ?? "");
  if (!hasText(normalized)) return [];
  return normalized
    .split(/[\s、。・／/|()[\]{}"'`,:;]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && term.length <= 48)
    .slice(0, 32);
}

function extractSeedHostname(value: string | null | undefined) {
  if (!hasText(value)) return "";
  try {
    return new URL(value ?? "").hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function splitHostnameEvidence(hostname: string) {
  if (!hasText(hostname)) return [];
  return hostname
    .split(/[.\-_]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3 && part.length <= 32);
}

function isLowSignalEvidenceTerm(term: ServiceEvidenceTerm) {
  if (term.source === "brand" || term.source === "competitor") return false;
  if (term.normalized.length <= 1) return true;
  if (/^[a-z]{1,2}$/.test(term.normalized) && term.normalized !== "hr") return true;
  return false;
}

function evidenceMatchesTerm(value: string, needle: string) {
  const normalizedNeedle = normalizeEvidenceTerm(needle);
  if (!hasText(value) || !hasText(normalizedNeedle)) return false;
  if (/^[a-z0-9]{1,3}$/.test(normalizedNeedle)) {
    return new RegExp(`(^|[^a-z0-9])${escapeEvidenceRegExp(normalizedNeedle)}([^a-z0-9]|$)`, "i").test(value);
  }
  return value.includes(normalizedNeedle);
}

function escapeEvidenceRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getEvidenceSourceMultiplier(source: ServiceEvidenceTerm["source"]) {
  if (source === "service_description") return 1.25;
  if (source === "category") return 1.15;
  if (source === "audience") return 1;
  if (source === "goal") return 0.75;
  if (source === "url_metadata") return 0.65;
  if (source === "region") return 0.55;
  if (source === "competitor") return 0.45;
  return 0.25;
}

function isB2BAudience(value: string) {
  return ["b2b", "btob", "法人", "企業", "会社", "事業者", "マーケティング担当", "人事担当", "経営者"]
    .some((term) => evidenceMatchesTerm(value, term));
}

function isB2CAudience(value: string) {
  return ["b2c", "btoc", "個人", "一般消費者", "保護者", "家族", "購入", "料金を比較", "口コミ"]
    .some((term) => evidenceMatchesTerm(value, term));
}

function isB2BCategoryProfile(profile: CategoryCandidateProfile) {
  return profile === "seo_ai_search" ||
    profile === "marketing_seo" ||
    profile === "b2b_saas_tool" ||
    profile === "recruiting_hr" ||
    profile === "professional_service";
}

function isConsumerCategoryProfile(profile: CategoryCandidateProfile) {
  return profile === "school_education" ||
    profile === "local_service" ||
    profile === "ecommerce_product" ||
    profile === "healthcare_clinic" ||
    profile === "real_estate" ||
    profile === "finance_investment";
}

function hasExplicitEcommerceEvidence(evidenceTerms: readonly ServiceEvidenceTerm[]) {
  return evidenceTerms.some((term) =>
    (term.source === "service_description" || term.source === "category" || term.source === "audience") &&
    ["ecommerce", "online shop", "d2c", "通販", "ecサイト", "ec", "商品", "購入", "返品", "定期購入"]
      .some((needle) => evidenceMatchesTerm(term.normalized, needle))
  );
}

function hasExplicitFinanceEvidence(evidenceTerms: readonly ServiceEvidenceTerm[]) {
  const financeKeywords = [
    "finance",
    "investment",
    "insurance",
    "loan",
    "securities",
    "bank",
    "fx",
    "nisa",
    "ideco",
    "fintech",
    "mortgage",
    "金融",
    "投資",
    "資産運用",
    "保険",
    "ローン",
    "証券",
    "銀行",
    "仮想通貨",
    "暗号資産",
    "株式",
    "債券",
    "住宅ローン",
    "保険相談"
  ];
  return evidenceTerms.some((term) =>
    (term.source === "service_description" || term.source === "category" || term.source === "audience") &&
    financeKeywords.some((needle) => evidenceMatchesTerm(term.normalized, needle))
  );
}

function scoreCategoryKeyword(evidenceTerms: readonly ServiceEvidenceTerm[], keyword: string) {
  return evidenceTerms.reduce((score, term) => {
    return score + (evidenceMatchesTerm(term.normalized, keyword) ? term.weight : 0);
  }, 0);
}

function isNationalRegionOnly(regions: readonly string[]) {
  if (regions.length === 0) return true;
  return regions.every((region) => {
    const normalized = normalizeEvidenceTerm(region);
    return ["japan", "日本", "全国", "国内", "national"].some((term) => evidenceMatchesTerm(normalized, term));
  });
}

function getIndustryAdapter(businessModel: BusinessModelKind) {
  if (businessModel === "b2b_software") return "b2b_saas";
  if (businessModel === "professional_service") return "professional_services";
  if (businessModel === "healthcare") return "clinic_healthcare";
  if (businessModel === "education") return "education_school";
  if (businessModel === "local_service") return "local_service";
  if (businessModel === "ecommerce") return "ecommerce_product";
  if (businessModel === "real_estate") return "real_estate";
  if (businessModel === "recruiting_hr") return "recruiting_hr";
  if (businessModel === "b2b_service") return "b2b_service";
  return "minimum_input_generic";
}

function classifyBusinessModel(seed: ProjectSetupSeedInput): BusinessModelKind {
  const text = normalizeForMatch(
    `${seed.industryCategory} ${seed.productOrServiceDescription} ${seed.targetCustomers} ${seed.regions.join(" ")}`
  );

  if (containsAny(text, ["clinic", "hospital", "healthcare", "medical", "dental", "beauty clinic", "クリニック", "病院", "医療", "歯科", "美容医療", "整体", "治療院"])) {
    return "healthcare";
  }
  if (containsAny(text, ["real estate", "property", "不動産", "賃貸", "売買", "住宅"])) return "real_estate";
  if (containsAny(text, ["recruiting", "staffing", "hr", "採用", "人材", "求人"])) return "recruiting_hr";
  if (containsAny(text, ["school", "course", "education", "lesson", "スクール", "講座", "教育", "学習", "塾", "学校"])) return "education";
  if (containsAny(text, ["ecommerce", "online shop", "d2c", "通販", "オンラインショップ", "ecサイト"])) return "ecommerce";
  if (containsAny(text, ["consulting", "agency", "professional service", "law firm", "accounting", "士業", "コンサル", "制作会社", "代理店", "税理士", "弁護士", "会計", "社労士"])) {
    return "professional_service";
  }
  if (containsAny(text, ["saas", "software", "system", "tool", "platform", "ソフトウェア", "システム", "ツール", "プラットフォーム"])) {
    return "b2b_software";
  }
  if (containsAny(text, ["b2b", "btob", "business", "company", "enterprise", "法人", "企業", "事業者", "チーム"])) {
    return "b2b_service";
  }
  if (containsAny(text, ["local", "nearby", "regional", "area", "store", "salon", "restaurant", "予約", "店舗", "地域", "近く", "サロン", "飲食", "訪問", "出張"])) {
    return "local_service";
  }

  if (containsAny(text, ["clinic", "hospital", "healthcare", "medical", "dental", "beauty clinic", "クリニック", "医療", "歯科", "美容医療"])) {
    return "healthcare";
  }
  if (containsAny(text, ["real estate", "property", "不動産", "賃貸", "売買", "住宅"])) return "real_estate";
  if (containsAny(text, ["recruiting", "staffing", "hr", "採用", "人材", "求人"])) return "recruiting_hr";
  if (containsAny(text, ["school", "course", "education", "lesson", "スクール", "講座", "教育", "学習", "塾"])) return "education";
  if (containsAny(text, ["ec", "ecommerce", "online shop", "d2c", "通販", "ec", "オンラインショップ"])) return "ecommerce";
  if (containsAny(text, ["consulting", "agency", "professional service", "士業", "コンサル", "制作会社", "代理店"])) {
    return "professional_service";
  }
  if (containsAny(text, ["saas", "software", "system", "tool", "platform", "ソフトウェア", "システム", "ツール", "プラットフォーム"])) {
    return "b2b_software";
  }
  if (containsAny(text, ["b2b", "btob", "business", "company", "enterprise", "法人", "企業", "事業者", "チーム"])) {
    return "b2b_service";
  }
  if (containsAny(text, ["local", "nearby", "store", "salon", "restaurant", "予約", "店舗", "地域", "近く", "サロン", "飲食"])) {
    return "local_service";
  }

  return "b2c_service";
}

function isLocalIntent(seed: ProjectSetupSeedInput) {
  const text = normalizeForMatch(`${seed.industryCategory} ${seed.productOrServiceDescription} ${seed.targetCustomers} ${seed.regions.join(" ")}`);
  if (containsAny(text, ["local", "nearby", "regional", "area", "store", "clinic", "restaurant", "地域", "近く", "店舗", "通える", "来店", "予約", "訪問", "出張", "クリニック", "学校", "塾", "サロン"])) {
    return true;
  }
  if (containsAny(text, ["local", "nearby", "regional", "area", "store", "clinic", "restaurant", "地域", "近く", "店舗", "通える", "来店", "予約"])) {
    return true;
  }
  return seed.regions.some((region) => !containsAny(normalizeForMatch(region), ["japan", "national", "日本", "国内", "全国", "unspecified"]));
}

function isRegulatedOrHighTrustIndustry(seed: ProjectSetupSeedInput) {
  const text = normalizeForMatch(`${seed.industryCategory} ${seed.productOrServiceDescription} ${seed.targetCustomers} ${seed.knownRisks?.join(" ") ?? ""}`);
  if (containsAny(text, [
    "healthcare",
    "medical",
    "clinic",
    "finance",
    "insurance",
    "legal",
    "security",
    "real estate",
    "recruiting",
    "医療",
    "クリニック",
    "歯科",
    "金融",
    "保険",
    "法律",
    "弁護士",
    "税理士",
    "不動産",
    "採用",
    "セキュリティ"
  ])) return true;
  return containsAny(text, [
    "healthcare",
    "medical",
    "clinic",
    "finance",
    "insurance",
    "legal",
    "security",
    "real estate",
    "recruiting",
    "医療",
    "クリニック",
    "金融",
    "保険",
    "法律",
    "セキュリティ",
    "不動産",
    "採用"
  ]);
}

function buildCustomerFacingCategoryLabel(
  seed: ProjectSetupSeedInput,
  isJapanese: boolean,
  categoryCandidate: CategoryCandidate
) {
  const industry = sanitizeForPrompt(seed.industryCategory, seed);
  if (industry.length > 0 && industry.length <= 40) return industry;

  const jaLabels: Record<CategoryCandidateProfile, string> = {
    seo_ai_search: "AI検索・SEO支援サービス",
    marketing_seo: "マーケティング・SEO支援サービス",
    b2b_saas_tool: "BtoB SaaS・業務支援ツール",
    recruiting_hr: "採用・HR支援サービス",
    professional_service: "専門サービス・コンサルティング",
    healthcare_clinic: "クリニック・医療サービス",
    school_education: "スクール・教育サービス",
    local_service: "地域サービス",
    ecommerce_product: "EC・商品購入サービス",
    real_estate: "不動産サービス",
    finance_investment: "金融・投資サービス",
    other: ""
  };
  const enLabels: Record<CategoryCandidateProfile, string> = {
    seo_ai_search: "AI search / SEO support",
    marketing_seo: "marketing / SEO support",
    b2b_saas_tool: "B2B SaaS / business tool",
    recruiting_hr: "recruiting / HR support",
    professional_service: "professional service / consulting",
    healthcare_clinic: "clinic / healthcare service",
    school_education: "school / education service",
    local_service: "local service",
    ecommerce_product: "EC / product purchase",
    real_estate: "real estate service",
    finance_investment: "finance / investment service",
    other: ""
  };

  return isJapanese ? jaLabels[categoryCandidate.profile] : enLabels[categoryCandidate.profile];
}

function buildCategoryLabel(
  seed: ProjectSetupSeedInput,
  isJapanese: boolean,
  categoryCandidate: CategoryCandidate = OTHER_CATEGORY_CANDIDATE
) {
  const inferredCategory = buildCustomerFacingCategoryLabel(seed, isJapanese, categoryCandidate);
  if (hasText(inferredCategory)) return inferredCategory;

  const sanitizedDescription = sanitizeForPrompt(seed.productOrServiceDescription, seed);
  if (sanitizedDescription.length >= 8 && sanitizedDescription.length <= 72) return sanitizedDescription;
  if (sanitizedDescription.length > 72) return `${sanitizedDescription.slice(0, 72).trim()}...`;

  const sanitizedIndustry = sanitizeForPrompt(seed.industryCategory, seed);
  if (sanitizedIndustry.length > 0) {
    return isJapanese ? `${sanitizedIndustry}領域のサービス` : `${sanitizedIndustry} services`;
  }

  return isJapanese ? "このカテゴリのサービス" : "services in this category";
}

function buildRegionLabel(seed: ProjectSetupSeedInput, isJapanese: boolean) {
  if (seed.regions.length > 0) return seed.regions.join(isJapanese ? "・" : ", ");
  return isJapanese ? "対象地域" : "the target region";
}

function buildContextWarnings(
  seed: ProjectSetupSeedInput,
  context: {
    isLocal: boolean;
    isRegulatedOrHighTrust: boolean;
    businessModel: BusinessModelKind;
    industryAdapter: string;
    categoryLabel: string;
    targetCustomerLabel: string;
  }
) {
  const warnings: string[] = [
    "generated_draft_requires_internal_review",
    "generated_prompts_are_not_measurement_ready_until_approved"
  ];

  if ((seed.knownCompetitors ?? []).length === 0) {
    warnings.push("known_competitors_missing_use_unknown_competitor_discovery");
  }
  if ((seed.strengths ?? []).length === 0) {
    warnings.push("strengths_missing_use_general_proof_needs");
  }
  if ((seed.knownRisks ?? []).length === 0) {
    warnings.push("known_risks_missing_internal_review_required");
  }
  if (context.isLocal && seed.regions.length === 0) {
    warnings.push("local_intent_without_region_requires_confirmation");
  }
  if (context.isRegulatedOrHighTrust) {
    warnings.push("regulated_or_high_trust_context_requires_conservative_review");
  }
  if (context.businessModel === "unknown") {
    warnings.push("business_model_inference_needs_confirmation");
  }
  if (context.industryAdapter === "minimum_input_generic") {
    warnings.push("industry_adapter_generic_prompt_angles_need_review");
  }
  if (isBroadTargetCustomer(seed.targetCustomers)) {
    warnings.push("target_customers_broad_personas_need_confirmation");
  }
  if (seed.productOrServiceDescription.length < 16) {
    warnings.push("service_description_thin_prompt_angles_need_review");
  }
  if (context.categoryLabel === (isJapaneseLanguage(seed.language) ? "このカテゴリのサービス" : "services in this category")) {
    warnings.push("category_label_fallback_used");
  }

  return uniqueStrings(warnings);
}

function shouldGenerateCitationCheck(seed: ProjectSetupSeedInput) {
  const goals = seed.diagnosisGoals ?? [];
  return goals.length === 0 || goals.includes("citation_check");
}

function shouldGenerateBrandedSentiment(seed: ProjectSetupSeedInput) {
  const goals = seed.diagnosisGoals ?? [];
  return goals.length === 0 || goals.includes("sentiment") || goals.includes("brand_perception") || goals.includes("branded");
}

function shouldGenerateAlternativeSearch(seed: ProjectSetupSeedInput) {
  const goals = seed.diagnosisGoals ?? [];
  return goals.length === 0 || goals.includes("comparison") || goals.includes("buyer_intent") || goals.includes("non_branded");
}

function shouldGeneratePricingReputation(context: GenerationContext, seed: ProjectSetupSeedInput) {
  const goals = seed.diagnosisGoals ?? [];
  return context.isLocal ||
    context.businessModel === "healthcare" ||
    context.businessModel === "education" ||
    context.businessModel === "professional_service" ||
    context.businessModel === "ecommerce" ||
    context.businessModel === "real_estate" ||
    goals.includes("comparison") ||
    goals.includes("buyer_intent");
}

function selectGeneratedTopicKeys(context: GenerationContext, seed: ProjectSetupSeedInput): GeneratedTopicKey[] {
  const candidates: { key: GeneratedTopicKey; priority: number; enabled: boolean }[] = [
    { key: "category-discovery", priority: 100, enabled: true },
    { key: "branded-sentiment", priority: shouldGenerateBrandedSentiment(seed) ? 96 : 20, enabled: shouldGenerateBrandedSentiment(seed) },
    { key: "citation-check", priority: shouldGenerateCitationCheck(seed) ? 94 : 20, enabled: shouldGenerateCitationCheck(seed) },
    { key: "regulated-risk", priority: 92, enabled: context.isRegulatedOrHighTrust },
    { key: "local-regional", priority: 90, enabled: context.isLocal },
    { key: "selection-criteria", priority: 88, enabled: true },
    { key: "alternative-search", priority: 86, enabled: shouldGenerateAlternativeSearch(seed) },
    { key: "pricing-reputation", priority: 82, enabled: shouldGeneratePricingReputation(context, seed) },
    { key: "problem-solution", priority: 78, enabled: true }
  ];
  const selected = candidates
    .filter((candidate) => candidate.enabled)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)
    .map((candidate) => candidate.key);
  const outputOrder: GeneratedTopicKey[] = [
    "category-discovery",
    "problem-solution",
    "alternative-search",
    "selection-criteria",
    "local-regional",
    "pricing-reputation",
    "regulated-risk",
    "citation-check",
    "branded-sentiment"
  ];
  return outputOrder.filter((key) => selected.includes(key));
}

function selectPersonaForTopic(key: GeneratedTopicKey, personas: readonly PersonaDraft[]) {
  const preferredRolesByTopic: Record<GeneratedTopicKey, readonly PersonaRoleType[]> = {
    "category-discovery": ["evaluator", "comparator", "decision_maker", "purchaser"],
    "problem-solution": ["end_user", "user", "evaluator", "comparator"],
    "alternative-search": ["evaluator", "comparator", "agency_or_consultant", "decision_maker"],
    "selection-criteria": ["evaluator", "technical_reviewer", "economic_buyer", "comparator"],
    "local-regional": ["comparator", "purchaser", "user"],
    "pricing-reputation": ["economic_buyer", "purchaser", "comparator", "evaluator"],
    "regulated-risk": ["user", "recommender_influencer", "evaluator", "comparator"],
    "citation-check": ["evaluator", "technical_reviewer", "decision_maker", "comparator"],
    "branded-sentiment": ["decision_maker", "purchaser", "evaluator", "comparator"]
  };
  const preferredRoles = preferredRolesByTopic[key];
  return preferredRoles
    .map((role) => personas.find((persona) => persona.roleType === role))
    .find((persona): persona is PersonaDraft => persona != null) ?? personas[0];
}

function selectPromptVariantPersonas(
  topic: TopicDraft,
  personas: readonly PersonaDraft[],
  primaryPersona: PersonaDraft,
  count: number
) {
  const preferredRolesByTopic: Partial<Record<TopicType, readonly PersonaRoleType[]>> = {
    category_discovery_topic: ["evaluator", "comparator", "decision_maker", "purchaser"],
    problem_solution_topic: ["end_user", "user", "evaluator", "comparator"],
    alternative_search_topic: ["evaluator", "comparator", "decision_maker", "agency_or_consultant"],
    persona_specific_topic: ["evaluator", "technical_reviewer", "economic_buyer", "purchaser", "comparator"],
    local_regional_topic: ["comparator", "purchaser", "user", "repeat_user"],
    pricing_reputation_topic: ["economic_buyer", "purchaser", "comparator", "evaluator"],
    regulated_risk_topic: ["user", "recommender_influencer", "evaluator", "comparator"],
    citation_evidence_topic: ["evaluator", "technical_reviewer", "decision_maker", "comparator"],
    branded_sentiment_topic: ["decision_maker", "purchaser", "evaluator", "comparator"]
  };
  const preferredRoles = preferredRolesByTopic[topic.topicType] ?? [];
  const orderedPersonas = uniqueBy([
    primaryPersona,
    ...preferredRoles
      .map((role) => personas.find((persona) => persona.roleType === role))
      .filter((persona): persona is PersonaDraft => persona != null),
    ...personas
  ], (persona) => persona.personaId);

  return Array.from({ length: count }, (_, index) => orderedPersonas[index % orderedPersonas.length] ?? primaryPersona);
}

function buildRoleSpecificConcern(context: GenerationContext, roleType: PersonaRoleType) {
  if (context.isJapanese) {
    if (roleType === "economic_buyer") return "予算、費用対効果、契約条件、稟議リスクを確認したい";
    if (roleType === "technical_reviewer") return "セキュリティ、連携、データ管理、運用負荷を確認したい";
    if (roleType === "evaluator") return "候補の違いと比較軸を短時間で整理したい";
    if (roleType === "end_user" || roleType === "user") return "実際の使いやすさや失敗しやすい点を事前に知りたい";
    if (roleType === "purchaser") return "料金、信頼性、申込前の注意点を確認したい";
    if (roleType === "comparator") return "口コミ、価格、近さ、信頼材料を比較したい";
    return "費用対効果と導入判断の根拠を確認したい";
  }

  if (roleType === "technical_reviewer") return "Needs to check security, integrations, data handling, and operational effort.";
  if (roleType === "evaluator") return "Needs to organize candidate differences and comparison axes quickly.";
  if (roleType === "economic_buyer") return "Needs to verify budget, scope, ROI, contract risk, and hidden cost.";
  if (roleType === "agency_or_consultant") return "Needs client-safe evidence, repeatable reporting value, and clear support scope.";
  if (roleType === "recommender_influencer") return "Needs trust and caution points before recommending the option to someone else.";
  if (roleType === "repeat_user") return "Needs to decide whether continued use or switching is justified.";
  if (roleType === "end_user" || roleType === "user") return "Needs to understand usability and likely failure points before adopting.";
  if (roleType === "purchaser") return "Needs to check price, trust, and pre-purchase cautions.";
  if (roleType === "comparator") return "Needs to compare reviews, price, proximity, and trust signals.";
  return "Needs ROI and decision evidence before adoption.";
}

function ensureBrandExcludedPromptText(text: string, context: GenerationContext, brandIdentity: BrandIdentityForDraft) {
  if (!promptTextContainsBrandSignal(text, brandIdentity)) return text;
  const fallbackCategory = sanitizeForPrompt(context.seed.industryCategory, context.seed) || (context.isJapanese ? "このカテゴリのサービス" : "services in this category");
  const rewritten = context.isJapanese
    ? `${fallbackCategory}を検討するとき、候補になるサービスや会社を自然に比較してください。`
    : `When considering ${fallbackCategory}, compare candidate services or companies naturally.`;
  return promptTextContainsBrandSignal(rewritten, brandIdentity)
    ? context.isJapanese
      ? "このカテゴリのサービスを検討するとき、候補になる会社や選択肢を自然に比較してください。"
      : "When considering this category, compare candidate companies or options naturally."
    : rewritten;
}

function promptTextContainsKnownCompetitorSignal(text: string, seed: ProjectSetupSeedInput) {
  const normalizedText = normalizeForMatch(text);
  return getKnownCompetitorSignalsForGeneration(seed).some((signal) =>
    normalizedText.includes(normalizeForMatch(signal))
  );
}

function getKnownCompetitorSignalsForGeneration(seed: ProjectSetupSeedInput) {
  return uniqueStrings([
    ...(seed.knownCompetitors ?? []),
    ...(seed.avoidCompetitors ?? [])
  ]
    .map((value) => value.normalize("NFKC").trim())
    .filter((value) => value.length >= 2));
}

function getNonBrandedPromptNaturalnessIssues(text: string, context: GenerationContext) {
  const issues: string[] = [];
  const normalized = normalizeForMatch(text);

  if (isOverlyAbstractRecommendationPrompt(normalized)) {
    issues.push("non_branded_prompt_too_abstract");
  }
  if (looksLikeKeywordListPrompt(text)) {
    issues.push("non_branded_prompt_looks_like_keyword_list");
  }
  if (context.isB2B && containsAny(normalized, B2C_HEAVY_PROMPT_TERMS)) {
    issues.push("b2b_non_branded_prompt_contains_b2c_context_terms");
  }
  if (!context.isB2B && containsAny(normalized, B2B_HEAVY_PROMPT_TERMS)) {
    issues.push("b2c_non_branded_prompt_contains_b2b_context_terms");
  }

  return uniqueStrings(issues);
}

const B2B_HEAVY_PROMPT_TERMS = [
  "導入",
  "稟議",
  "roi",
  "費用対効果",
  "ベンダー選定",
  "saas",
  "セキュリティ",
  "既存ツール連携",
  "社内承認",
  "運用負荷"
] as const;

const B2C_HEAVY_PROMPT_TERMS = [
  "近く",
  "近隣",
  "家族",
  "子ども",
  "子供",
  "口コミだけ",
  "初めてで不安",
  "通いやす"
] as const;

function isOverlyAbstractRecommendationPrompt(normalizedText: string) {
  const compact = normalizedText.replace(/\s+/g, "");
  if (/^(おすすめは|どこがいい|何がいい|なにがいい|どれがいい)[?？。]*$/.test(compact)) return true;
  return compact.length <= 18 &&
    (compact.includes("おすすめ") || compact.includes("どこがいい")) &&
    !containsAny(compact, ["比較", "確認", "料金", "口コミ", "導入", "費用対効果", "自分に合う"]);
}

function looksLikeKeywordListPrompt(text: string) {
  const normalized = normalizeForMatch(text);
  const hasQuestionOrInstructionShape =
    /[?？。]$/.test(text.trim()) ||
    containsAny(normalized, [
      "どう",
      "どの",
      "どんな",
      "何",
      "なに",
      "比較",
      "確認",
      "整理",
      "選ぶ",
      "探す",
      "should",
      "how",
      "what",
      "which",
      "compare",
      "check",
      "choose",
      "find"
    ]);
  if (hasQuestionOrInstructionShape) return false;

  const separators =
    (text.match(/[、,・/|]/g) ?? []).length +
    (text.match(/\s+/g) ?? []).length;
  return separators >= 3 && text.trim().length <= 90;
}

function sanitizeForPrompt(value: string, seed: ProjectSetupSeedInput) {
  const stripped = stripBrandSignals(value, seed)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.replace(/^[、,.;:・\s]+|[、,.;:・\s]+$/g, "");
}

function stripBrandSignals(value: string, seed: ProjectSetupSeedInput) {
  let result = value.normalize("NFKC");
  for (const signal of getBrandSignalsForGeneration(seed).sort((a, b) => b.length - a.length)) {
    result = result.replace(new RegExp(escapeRegExp(signal), "gi"), "");
  }
  return result;
}

function getBrandSignalsForGeneration(seed: ProjectSetupSeedInput) {
  return uniqueStrings([
    seed.companyName,
    seed.brandName,
    seed.serviceName,
    seed.officialSiteUrl,
    extractHostname(seed.officialSiteUrl),
    ...(seed.brandAliases ?? []),
    ...(seed.knownCompetitors ?? []),
    ...(seed.avoidCompetitors ?? [])
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.normalize("NFKC").trim())
    .filter((value) => value.length >= 2));
}

function buildBrandIdentityFromSeed(seed: ProjectSetupSeedInput): BrandIdentityForDraft {
  return {
    brandName: seed.brandName,
    serviceName: seed.serviceName,
    aliases: seed.brandAliases,
    officialSiteUrl: seed.officialSiteUrl
  };
}

function stableSeedString(seed: ProjectSetupSeedInput) {
  return JSON.stringify({
    companyName: normalizeText(seed.companyName),
    brandName: normalizeText(seed.brandName),
    officialSiteUrl: normalizeText(seed.officialSiteUrl),
    productOrServiceDescription: normalizeText(seed.productOrServiceDescription),
    industryCategory: normalizeText(seed.industryCategory),
    targetCustomers: normalizeText(seed.targetCustomers),
    regions: normalizeStringArray(seed.regions),
    language: normalizeText(seed.language),
    serviceName: normalizeOptionalText(seed.serviceName),
    brandAliases: normalizeOptionalStringArray(seed.brandAliases),
    knownCompetitors: normalizeOptionalStringArray(seed.knownCompetitors),
    avoidCompetitors: normalizeOptionalStringArray(seed.avoidCompetitors),
    strengths: normalizeOptionalStringArray(seed.strengths),
    knownRisks: normalizeOptionalStringArray(seed.knownRisks),
    diagnosisGoals: seed.diagnosisGoals ? uniqueStrings(seed.diagnosisGoals) : undefined
  });
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0").slice(0, 8);
}

function buildScopedId(scope: "persona" | "topic" | "prompt", seedHash: string, key: string) {
  const slug = slugifyAscii(key) || stableHash(key);
  return `${scope}-${seedHash}-${slug}`;
}

function slugifyAscii(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeText(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value == null ? "" : normalizeText(value);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeStringArray(values: readonly string[]) {
  return uniqueStrings(values.map(normalizeText).filter(hasText));
}

function normalizeOptionalStringArray(values: readonly string[] | undefined) {
  const normalized = values ? normalizeStringArray(values) : [];
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeForMatch(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

function normalizeForDedupe(value: string) {
  return normalizeForMatch(value).replace(/\s+/g, "").trim();
}

function normalizePromptTextForDeduplication(value: string) {
  return normalizeForDedupe(value);
}

function containsAny(value: string, needles: readonly string[]) {
  return needles.some((needle) => value.includes(needle.toLowerCase()));
}

function isJapaneseLanguage(language: string) {
  const normalized = normalizeForMatch(language);
  return normalized === "ja" || normalized.startsWith("ja-") || normalized.includes("japanese") || normalized.includes("日本");
}

function isBroadTargetCustomer(targetCustomers: string) {
  const normalized = normalizeForMatch(targetCustomers);
  return containsAny(normalized, ["everyone", "all users", "all customers", "anyone", "全員", "すべて", "幅広い", "一般"]);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function extractHostname(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function hasMarketMetricEligibility(eligibility: ReturnType<typeof derivePromptMetricEligibility>) {
  return eligibility.visibilityRate === "eligible" || eligibility.ranking === "eligible" || eligibility.shareOfVoice === "eligible";
}

function addDuplicateValueBlockers(blockers: string[], values: readonly string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (!hasText(value)) continue;
    if (seen.has(value)) blockers.push(`${label}_must_be_unique`);
    seen.add(value);
  }
}

function uniqueBy<T>(items: readonly T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function uniqueStrings<T extends string>(values: readonly T[]) {
  return Array.from(new Set(values));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
