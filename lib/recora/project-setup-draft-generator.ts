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

type GeneratedTopicKey =
  | "category-discovery"
  | "problem-solution"
  | "selection-criteria"
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
  categoryLabel: string;
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
  const builders: PersonaSpec[] = context.isB2B ? buildB2BPersonaSpecs(context) : buildB2CPersonaSpecs(context);
  const uniqueSpecs = uniqueBy(builders, (spec) => `${spec.key}:${spec.roleType}:${spec.buyerStage}`);

  return uniqueSpecs.slice(0, 4).map((spec) => createPersonaDraft(context, spec));
}

export function generateTopicDrafts(seed: ProjectSetupSeedInput, personas: readonly PersonaDraft[]): TopicDraft[] {
  const normalizedSeed = normalizeSeedInput(seed);
  if (validateProjectSetupSeedInput(normalizedSeed).length > 0 || personas.length === 0) return [];

  const context = buildGenerationContext(normalizedSeed);
  const promptReadyPersonas = personas.filter((persona) =>
    persona.promptReadiness === "ready_for_prompt_design" || persona.promptReadiness === "usable_with_caution"
  );
  if (promptReadyPersonas.length === 0) return [];

  const topics: TopicDraft[] = [
    createTopicDraft(context, "category-discovery", promptReadyPersonas[0]),
    createTopicDraft(context, "problem-solution", promptReadyPersonas[Math.min(1, promptReadyPersonas.length - 1)]),
    createTopicDraft(context, "selection-criteria", promptReadyPersonas[0])
  ];

  if (context.isLocal) {
    topics.push(createTopicDraft(context, "local-regional", promptReadyPersonas[0]));
  }

  if (shouldGenerateCitationCheck(normalizedSeed)) {
    topics.push(createTopicDraft(context, "citation-check", promptReadyPersonas[0]));
  }

  if (shouldGenerateBrandedSentiment(normalizedSeed)) {
    topics.push(createTopicDraft(context, "branded-sentiment", promptReadyPersonas[0]));
  }

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
    .map((topic) => createPromptDraftForTopic(context, topic, personaById.get(topic.targetPersonaId ?? "")))
    .filter((prompt): prompt is PromptDraft => prompt !== null);

  return uniqueBy(prompts, (prompt) => normalizeForDedupe(prompt.text));
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
  const businessModel = classifyBusinessModel(seed);
  const isB2B = businessModel === "b2b_software" || businessModel === "b2b_service";
  const isLocal = businessModel === "local_service" || isLocalIntent(seed);
  const isRegulatedOrHighTrust = isRegulatedOrHighTrustIndustry(seed);
  const categoryLabel = buildCategoryLabel(seed, isJapanese);
  const targetCustomerLabel = sanitizeForPrompt(seed.targetCustomers, seed) || (isJapanese ? "対象顧客" : "target customers");
  const regionLabel = buildRegionLabel(seed, isJapanese);
  const warnings = buildContextWarnings(seed, {
    isLocal,
    isRegulatedOrHighTrust,
    businessModel,
    categoryLabel,
    targetCustomerLabel
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
    categoryLabel,
    targetCustomerLabel,
    regionLabel,
    warnings,
    riskFlags
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
    }
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
  return {
    topicId: buildScopedId("topic", context.seedHash, key),
    topicName: topic.topicName,
    topicType: topic.topicType,
    diagnosisGoal: topic.diagnosisGoal,
    targetPersonaId: persona.personaId,
    buyerStage: topic.buyerStage,
    metricTarget: topic.metricTarget,
    brandMentionPolicy: topic.brandMentionPolicy,
    expectedSignal: topic.expectedSignal,
    minimumPromptCount: 1,
    riskOrBias: topic.riskOrBias,
    handoffSkill: topic.handoffSkill,
    topicQualityDecision: "topic_ready",
    coverageStatus: "covered",
    confidenceScore: clampScore(72 - (context.isRegulatedOrHighTrust ? 5 : 0)),
    reviewStatus: GENERATED_ITEM_REVIEW_STATUS
  };
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

function createPromptDraftForTopic(
  context: GenerationContext,
  topic: TopicDraft,
  persona: PersonaDraft | undefined
): PromptDraft | null {
  if (!persona) return null;

  const spec = getPromptSpecForTopic(context, topic);
  const promptId = buildScopedId("prompt", context.seedHash, topic.topicId.replace(/^topic-[^-]+-/, ""));

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

function getPromptSpecForTopic(context: GenerationContext, topic: TopicDraft): {
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
} {
  const category = context.categoryLabel;
  const region = context.regionLabel;
  const brand = context.seed.brandName;
  const baseRiskFlags = uniqueStrings([
    "generated_prompt_needs_review",
    ...(context.isRegulatedOrHighTrust ? ["regulated_or_high_trust_review_required"] : [])
  ]);

  if (topic.topicType === "problem_solution_topic") {
    return makeNonBrandedPromptSpec(context, {
      text: context.isJapanese
        ? `${category}を検討する前に、どのような課題ならサービスやツールの候補を比較すべきですか？`
        : `For ${category}, what problems should make someone compare service or tool options?`,
      rawUserIntent: context.isJapanese ? `${category} 課題 解決方法 候補` : `${category} problem solution options`,
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
        ? `${category}を選ぶ前に、価格、実績、サポート、運用負荷はどの順番で確認すべきですか？`
        : `Before choosing ${category}, how should price, proof, support, and adoption effort be checked?`,
      rawUserIntent: context.isJapanese ? `${category} 選び方 確認点` : `${category} selection criteria checks`,
      languageMode: context.isB2B ? "professional_research" : "natural_conversation",
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
      ? `${category}を検討するとき、候補になるサービスや会社をおすすめ順に3つほど挙げてください。選ぶ理由も簡単に教えてください。`
      : `When considering ${category}, list about three recommended services or companies in order and briefly explain why.`,
    rawUserIntent: context.isJapanese ? `${category} おすすめ 比較` : `${category} recommended comparison`,
    languageMode: context.isB2B ? "professional_research" : "natural_conversation",
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
) {
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

function classifyBusinessModel(seed: ProjectSetupSeedInput): BusinessModelKind {
  const text = normalizeForMatch(
    `${seed.industryCategory} ${seed.productOrServiceDescription} ${seed.targetCustomers} ${seed.regions.join(" ")}`
  );

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
  if (containsAny(text, ["local", "nearby", "regional", "area", "store", "clinic", "restaurant", "地域", "近く", "店舗", "通える", "来店", "予約"])) {
    return true;
  }
  return seed.regions.some((region) => !containsAny(normalizeForMatch(region), ["japan", "national", "全国", "国内", "unspecified"]));
}

function isRegulatedOrHighTrustIndustry(seed: ProjectSetupSeedInput) {
  const text = normalizeForMatch(`${seed.industryCategory} ${seed.productOrServiceDescription} ${seed.targetCustomers} ${seed.knownRisks?.join(" ") ?? ""}`);
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

function buildCategoryLabel(seed: ProjectSetupSeedInput, isJapanese: boolean) {
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

function buildRoleSpecificConcern(context: GenerationContext, roleType: PersonaRoleType) {
  if (context.isJapanese) {
    if (roleType === "technical_reviewer") return "セキュリティ、連携、データ管理、運用負荷を確認したい";
    if (roleType === "evaluator") return "候補の違いと比較軸を短時間で整理したい";
    if (roleType === "end_user" || roleType === "user") return "実際の使いやすさや失敗しやすい点を事前に知りたい";
    if (roleType === "purchaser") return "料金、信頼性、申込前の注意点を確認したい";
    if (roleType === "comparator") return "口コミ、価格、近さ、信頼材料を比較したい";
    return "費用対効果と導入判断の根拠を確認したい";
  }

  if (roleType === "technical_reviewer") return "Needs to check security, integrations, data handling, and operational effort.";
  if (roleType === "evaluator") return "Needs to organize candidate differences and comparison axes quickly.";
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
    ...(seed.brandAliases ?? [])
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
