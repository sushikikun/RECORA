import assert from "node:assert/strict";

import {
  RECORA_GENERATION_CUSTOMER_SIDES,
  RECORA_GENERATION_STRUCTURE_SIGNALS,
  RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
  RECORA_PROMPT_GENERATION_SEMANTICS_VERSION
} from "../lib/recora/prompt-generation-input";
import type {
  RecoraAudiencePriority,
  RecoraAudienceScope,
  RecoraBusinessDomain,
  RecoraCustomerAction,
  RecoraGenerationCustomerSide,
  RecoraGenerationStructureSignal,
  RecoraOfferingModel,
  RecoraPromptGenerationInputV1
} from "../lib/recora/prompt-generation-input";
import {
  RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
  RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION,
  RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
  RECORA_PERSONA_COMPILATION_CONTRACT_VERSION
} from "../lib/recora/measurement-persona-contract";
import type {
  RecoraPersonaCompilationV3,
  RecoraSelectedPersonaV3
} from "../lib/recora/measurement-persona-contract";
import { RECORA_PERSONA_BLUEPRINT_CATALOG_V3 } from "../lib/recora/measurement-persona-catalog";
import {
  RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1,
  RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION,
  RECORA_TOPIC_COVERAGE_DIMENSIONS,
  RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1,
  RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3,
  RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1
} from "../lib/recora/measurement-topic-contract";
import {
  RECORA_TOPIC_BLUEPRINT_CATALOG_V3,
  validateRecoraMeasurementTopicCatalogV3
} from "../lib/recora/measurement-topic-catalog";
import {
  RECORA_TOPIC_RECIPE_KEYS_V3,
  RECORA_TOPIC_SELECTION_RECIPES_V3,
  validateRecoraTopicSelectionRecipesV3
} from "../lib/recora/measurement-topic-selection-rules";
import type {
  RecoraTopicRecipeKeyV3,
  RecoraTopicSelectionRecipeV3
} from "../lib/recora/measurement-topic-selection-rules";
import {
  RECORA_MEASUREMENT_TOPIC_SELECTED_COUNT,
  RECORA_TOPIC_BLOCKER_CODES_V3,
  RECORA_TOPIC_CATALOG_GAP_CODES_V3,
  RECORA_TOPIC_REVIEW_CODES_V3,
  compileRecoraMeasurementTopicsV3
} from "../lib/recora/measurement-topic-compiler";
import type {
  RecoraReadyTopicCompilationV3,
  RecoraTopicCompilationV3,
  RecoraTopicCompilerInputV3
} from "../lib/recora/measurement-topic-compiler";
import {
  RECORA_MEASUREMENT_TOPIC_GOLD_FIXTURES_V3,
  RECORA_TOPIC_BLOCKED_GOLD_CASES_V3,
  RECORA_TOPIC_CATALOG_GAP_GOLD_CASES_V3,
  RECORA_TOPIC_GOLD_EXPECTED_COUNTS_V3,
  RECORA_TOPIC_INVARIANCE_TRANSFORMS_V3,
  RECORA_TOPIC_MEANING_CHANGE_TRANSFORMS_V3,
  RECORA_TOPIC_NEEDS_REVIEW_GOLD_CASES_V3,
  RECORA_TOPIC_READY_GOLD_CASES_V3
} from "./fixtures/recora-measurement-topic-gold-fixtures";

const ALL_PERSONA_COVERAGE = unique(
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3.flatMap(
    (item) => item.coverageDimensions
  )
);
const ALL_PERSONA_ROLES = unique(
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map((item) => item.roleFamily)
);
const ALL_PERSONA_INFLUENCES = unique(
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3.flatMap(
    (item) => item.topicInfluenceDimensions
  )
);
const ALL_CUSTOMER_SIDES = [...RECORA_GENERATION_CUSTOMER_SIDES];

type RecipeScenario = {
  audienceScope: RecoraAudienceScope;
  audiencePriority: RecoraAudiencePriority | null;
  domain: RecoraBusinessDomain;
  offering: RecoraOfferingModel;
  action: RecoraCustomerAction;
  signals: readonly RecoraGenerationStructureSignal[];
  trust: "standard" | "high_trust" | "regulated";
};

const B2B: RecipeScenario = {
  audienceScope: "b2b",
  audiencePriority: null,
  domain: "it_software",
  offering: "saas_software",
  action: "inquiry",
  signals: ["b2b_buying_group"],
  trust: "standard"
};

const SCENARIOS: Readonly<Record<RecoraTopicRecipeKeyV3, RecipeScenario>> = {
  standard_b2b: B2B,
  standard_b2c: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "consumer_services",
    offering: "consumer_service",
    action: "purchase",
    signals: [],
    trust: "standard"
  },
  standard_both_b2b_first: {
    ...B2B,
    audienceScope: "both",
    audiencePriority: "b2b_first"
  },
  standard_both_b2c_first: {
    ...B2B,
    audienceScope: "both",
    audiencePriority: "b2c_first"
  },
  standard_both_balanced: {
    ...B2B,
    audienceScope: "both",
    audiencePriority: "balanced"
  },
  enterprise_it_security: {
    ...B2B,
    signals: ["enterprise_it_security"],
    trust: "high_trust"
  },
  agency_delivery: {
    ...B2B,
    domain: "professional_consulting",
    offering: "managed_service",
    signals: ["agency_delivery"]
  },
  b2b2c_corporate_training: {
    ...B2B,
    audienceScope: "both",
    audiencePriority: "b2b_first",
    domain: "education",
    offering: "managed_service",
    action: "contract",
    signals: ["b2b2c", "corporate_training"]
  },
  commerce_gift: commerceScenario("commerce_gift", "purchase"),
  commerce_subscription: commerceScenario(
    "commerce_subscription",
    "start_subscription"
  ),
  commerce_single_purchase: commerceScenario(
    "commerce_single_purchase",
    "purchase"
  ),
  urgent_home_service: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "construction_home_service",
    offering: "physical_location_service",
    action: "request_quote",
    signals: ["urgent_service"],
    trust: "high_trust"
  },
  adult_healthcare: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "healthcare",
    offering: "professional_advisory",
    action: "reservation",
    signals: ["adult_healthcare"],
    trust: "regulated"
  },
  care_welfare: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "care_welfare",
    offering: "consumer_service",
    action: "consultation",
    signals: ["care_welfare"],
    trust: "high_trust"
  },
  child_education: educationScenario("child_education", "high_trust"),
  adult_education: educationScenario("adult_education", "standard"),
  multi_location_consumer_brand: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "consumer_services",
    offering: "physical_location_service",
    action: "reservation",
    signals: ["multi_location_consumer_brand"],
    trust: "standard"
  },
  multi_location_customer_organization: {
    ...B2B,
    offering: "managed_service",
    action: "contract",
    signals: ["multi_location_customer_organization"]
  },
  franchise_consumer_brand: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "consumer_services",
    offering: "physical_location_service",
    action: "visit",
    signals: ["franchise_consumer_brand"],
    trust: "standard"
  },
  franchise_recruitment: {
    ...B2B,
    domain: "consumer_services",
    offering: "physical_location_service",
    action: "inquiry",
    signals: ["franchise_recruitment"]
  },
  marketplace_brand: {
    audienceScope: "both",
    audiencePriority: "balanced",
    domain: "consumer_services",
    offering: "marketplace_platform",
    action: "purchase",
    signals: ["marketplace_brand"],
    trust: "standard"
  },
  marketplace_operator_customer: {
    ...B2B,
    offering: "managed_service",
    action: "contract",
    signals: ["marketplace_operator_customer"],
    trust: "high_trust"
  },
  recruiting_employer_saas: {
    ...B2B,
    domain: "recruiting_hr",
    action: "demo_or_trial",
    signals: ["recruiting_employer_saas"],
    trust: "high_trust"
  },
  real_estate_rental: realEstateScenario(
    "real_estate_rental",
    "application"
  ),
  real_estate_purchase_residential: realEstateScenario(
    "real_estate_purchase_residential",
    "application"
  ),
  real_estate_sale: realEstateScenario(
    "real_estate_sale",
    "consultation"
  ),
  insurance: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "finance_insurance",
    offering: "professional_advisory",
    action: "application",
    signals: ["insurance"],
    trust: "regulated"
  },
  manufacturing_capex: {
    ...B2B,
    domain: "manufacturing_industrial",
    offering: "product",
    action: "request_quote",
    signals: ["manufacturing_capex"],
    trust: "high_trust"
  },
  logistics_shipper_buying: {
    ...B2B,
    domain: "logistics_supply_chain",
    offering: "managed_service",
    action: "contract",
    signals: ["logistics_shipper_buying"]
  },
  group_or_business_travel: {
    audienceScope: "both",
    audiencePriority: "b2b_first",
    domain: "travel_hospitality",
    offering: "consumer_service",
    action: "reservation",
    signals: ["group_or_business_travel"],
    trust: "standard"
  },
  individual_travel: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "travel_hospitality",
    offering: "consumer_service",
    action: "reservation",
    signals: ["individual_travel"],
    trust: "standard"
  },
  public_nonprofit_customer: {
    ...B2B,
    domain: "public_nonprofit",
    offering: "managed_service",
    action: "request_quote",
    signals: ["public_nonprofit_customer"],
    trust: "high_trust"
  },
  media_brand: {
    audienceScope: "both",
    audiencePriority: "balanced",
    domain: "media_content",
    offering: "publisher_content",
    action: "content_subscription",
    signals: ["media_brand"],
    trust: "standard"
  },
  professional_service_b2b: {
    ...B2B,
    domain: "professional_consulting",
    offering: "professional_advisory",
    action: "consultation",
    signals: ["professional_service_b2b"],
    trust: "high_trust"
  },
  local_facility: {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "consumer_services",
    offering: "physical_location_service",
    action: "reservation",
    signals: ["local_facility"],
    trust: "standard"
  }
};

function commerceScenario(
  signal: Extract<
    RecoraGenerationStructureSignal,
    "commerce_gift" | "commerce_subscription" | "commerce_single_purchase"
  >,
  action: RecoraCustomerAction
): RecipeScenario {
  return {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "retail_product_sales",
    offering: "product",
    action,
    signals: [signal],
    trust: "standard"
  };
}

function educationScenario(
  signal: Extract<
    RecoraGenerationStructureSignal,
    "child_education" | "adult_education"
  >,
  trust: RecipeScenario["trust"]
): RecipeScenario {
  return {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "education",
    offering: "physical_location_service",
    action: "application",
    signals: [signal],
    trust
  };
}

function realEstateScenario(
  signal: Extract<
    RecoraGenerationStructureSignal,
    | "real_estate_rental"
    | "real_estate_purchase_residential"
    | "real_estate_sale"
  >,
  action: RecoraCustomerAction
): RecipeScenario {
  return {
    audienceScope: "b2c",
    audiencePriority: null,
    domain: "real_estate",
    offering: "professional_advisory",
    action,
    signals: [signal],
    trust: "high_trust"
  };
}

function generationInputFor(
  recipeKey: RecoraTopicRecipeKeyV3
): RecoraPromptGenerationInputV1 {
  const scenario = SCENARIOS[recipeKey];
  const isCommerce = scenario.domain === "retail_product_sales";
  const isLocal = scenario.offering === "physical_location_service";
  const secondaryDomains = [
    "other",
    "media_content",
    "education"
  ].filter((item) => item !== scenario.domain).slice(0, 2) as RecoraBusinessDomain[];
  const secondaryOfferings = [
    "other",
    "managed_service",
    "consumer_service"
  ].filter((item) => item !== scenario.offering).slice(0, 2) as RecoraOfferingModel[];
  const secondaryActions = [
    "request_material",
    "consultation",
    "inquiry"
  ].filter((item) => item !== scenario.action).slice(0, 2) as RecoraCustomerAction[];
  return {
    contractVersion: RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
    market: { country: "JP", locale: "ja-JP" },
    subject: {
      operatorCompanyName: "Example Operator",
      primary: {
        type:
          scenario.offering === "product"
            ? "product"
            : isLocal
              ? "location_facility"
              : "service",
        name: `Example ${recipeKey}`,
        aliases: [],
        officialUrl: "https://example.com"
      },
      secondary: []
    },
    audience: {
      scope: scenario.audienceScope,
      priority: scenario.audiencePriority
    },
    business: {
      primaryDomain: scenario.domain,
      secondaryDomains,
      primaryOfferingModel: scenario.offering,
      secondaryOfferingModels: secondaryOfferings,
      commerceChannels: isCommerce ? ["ecommerce"] : [],
      commerceRoles: isCommerce ? ["brand_owner", "direct_seller"] : [],
      summary: `${recipeKey}の測定対象`
    },
    actions: { primary: scenario.action, secondary: secondaryActions },
    delivery: {
      mode: isLocal ? "in_person" : "online",
      serviceCoverage: isLocal ? "local" : "nationwide",
      locationStructure: isLocal ? "single_location" : "none",
      geographicBinding: isLocal ? "physical_location" : "none",
      serviceAreas: [],
      locations: isLocal
        ? [
            {
              type: "location_facility",
              name: "Example Location",
              aliases: [],
              officialUrl: null
            }
          ]
        : []
    },
    trust: {
      decisionImpactFlags:
        scenario.trust === "standard" ? [] : ["long_term_commitment"],
      regulatoryFlags:
        scenario.trust === "regulated" ? ["regulated_service"] : [],
      sensitiveContexts:
        scenario.domain === "healthcare"
          ? ["health"]
          : scenario.domain === "finance_insurance"
            ? ["financial"]
            : [],
      derived: {
        decisionImpactLevel:
          scenario.trust === "regulated"
            ? "critical"
            : scenario.trust === "high_trust"
              ? "elevated"
              : "standard",
        derivedClass: scenario.trust,
        derivationVersion: "recora_trust_derivation_v1",
        reasons: ["gold_fixture"]
      }
    },
    generationContext: {
      structureSignals: [...scenario.signals],
      customerSides: [...ALL_CUSTOMER_SIDES],
      actorRelations: [
        {
          leftRoleKey: "fixture.role.a",
          rightRoleKey: "fixture.role.b",
          relation: "same_actor"
        },
        {
          leftRoleKey: "fixture.role.c",
          rightRoleKey: "fixture.role.d",
          relation: "distinct_actors"
        }
      ],
      lifecycleSignals: [
        "first_time_explorer",
        "active_user",
        "switching_evaluator"
      ],
      focusThemes: [],
      diagnosisGoals: []
    },
    generationIdentity: {
      semanticsVersion: RECORA_PROMPT_GENERATION_SEMANTICS_VERSION,
      hashAlgorithm: "sha256",
      fingerprint: `fixture-${recipeKey}`
    }
  };
}

function personaCompilationFor(
  recipeKey: RecoraTopicRecipeKeyV3
): RecoraPersonaCompilationV3 {
  const selected: RecoraSelectedPersonaV3[] = Array.from(
    { length: 5 },
    (_, index) => {
      const blueprint =
        RECORA_PERSONA_BLUEPRINT_CATALOG_V3[
          index % RECORA_PERSONA_BLUEPRINT_CATALOG_V3.length
        ];
      return {
        contractVersion: RECORA_MEASUREMENT_PERSONA_CONTRACT_VERSION,
        compilerVersion: RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
        catalogVersion: RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
        personaId: `persona_v3_${recipeKey}_${index + 1}`,
        selectionSemanticKey: `${recipeKey}|persona|${index + 1}`,
        primaryBlueprintKey: blueprint.blueprintKey,
        supportingBlueprintKeys: [],
        modifierKeys:
          index === 4 ? ["lifecycle.switching_evaluator"] : [],
        coverageDimensions: [...ALL_PERSONA_COVERAGE],
        marketSides: [...ALL_CUSTOMER_SIDES],
        roleFamilies: [...ALL_PERSONA_ROLES],
        topicInfluenceDimensions: [...ALL_PERSONA_INFLUENCES],
        displayName: `Persona ${index + 1}`,
        description: "Gold fixture persona",
        triggerSituation: "測定対象を比較する場面",
        primaryGoal: "候補を評価して判断する",
        selectionEvidence: ["fixture"],
        sortOrder: index + 1
      };
    }
  );
  return {
    contractVersion: RECORA_PERSONA_COMPILATION_CONTRACT_VERSION,
    compilerVersion: RECORA_MEASUREMENT_PERSONA_COMPILER_VERSION,
    catalogVersion: RECORA_PERSONA_BLUEPRINT_CATALOG_VERSION,
    status: "ready",
    selected,
    alternatives: [],
    excluded: [],
    reviewQuestions: [],
    blockers: [],
    warnings: [],
    recipeKey,
    personaSelectionFingerprint: `persona-fixture-${recipeKey}`
  };
}

function compilerInputFor(
  recipeKey: RecoraTopicRecipeKeyV3
): RecoraTopicCompilerInputV3 {
  return {
    contractVersion: "recora_topic_selection_input_v3",
    generationInput: generationInputFor(recipeKey),
    personaCompilation: personaCompilationFor(recipeKey)
  };
}

function readyFixtureFor(recipeKey: string) {
  return RECORA_MEASUREMENT_TOPIC_GOLD_FIXTURES_V3.find(
    (item) =>
      item.expectedStatus === "ready" &&
      item.expectedTopicRecipeKey === recipeKey
  );
}

function assertReady(
  value: RecoraTopicCompilationV3,
  recipeKey: RecoraTopicRecipeKeyV3
): asserts value is RecoraReadyTopicCompilationV3 {
  assert.equal(
    value.status,
    "ready",
    `${recipeKey}:${value.status}:${value.blockers.join(",")}`
  );
  assert.equal(value.topicRecipeKey, recipeKey);
  assert.equal(value.selected.length, RECORA_MEASUREMENT_TOPIC_SELECTED_COUNT);
  assert.deepEqual(
    value.selected.map((item) => item.primaryCoverage),
    RECORA_TOPIC_COVERAGE_DIMENSIONS
  );
  assert.equal(new Set(value.selected.map((item) => item.topicId)).size, 6);
  assert.ok(
    value.selected.every((item) => item.topicId.startsWith("topic_v3_"))
  );
  assert.ok(
    value.selected.every(
      (item) =>
        item.promptSubjectLabel.length > 0 &&
        item.measurementLanes.length > 0 &&
        value.personaTopicEdges.some(
          (edge) => edge.topicId === item.topicId && edge.edgeRole === "primary"
        )
    )
  );
  for (const persona of personaCompilationFor(recipeKey).selected) {
    assert.ok(
      new Set(
        value.personaTopicEdges
          .filter((item) => item.personaId === persona.personaId)
          .map((item) => item.topicId)
      ).size >= 2
    );
  }
  assert.equal(value.observationOverlays.length, 1);
  assert.equal(value.topicSelectionIdentity.fingerprint.length, 64);

  const fixture = readyFixtureFor(recipeKey);
  assert.ok(fixture);
  const expected = fixture.expectedPrimaryBlueprintAuthorities;
  assert.ok(expected);
  assert.equal(value.selected[0].primaryBlueprintKey, expected[0]);
  assert.equal(value.selected[1].primaryBlueprintKey, expected[1]);
  assert.equal(value.selected[2].primaryBlueprintKey, expected[2]);
  assert.equal(
    value.selected[3].primaryBlueprintKey,
    RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1[
      compilerInputFor(recipeKey).generationInput.actions.primary
    ]
  );
  assert.equal(value.selected[4].primaryBlueprintKey, expected[4]);
  if (expected[5] !== "@domain_offering") {
    assert.ok(
      value.selected[5].primaryBlueprintKey === expected[5] ||
        value.warnings.includes("specificity_fallback_used:T6")
    );
  }
  assert.ok(
    value.selected[4].supportingBlueprintKeys.includes(
      "diagnostic.subject_reputation_sentiment"
    )
  );
}

function semanticSignature(value: RecoraReadyTopicCompilationV3): unknown {
  return {
    status: value.status,
    recipe: value.topicRecipeKey,
    identity: value.topicSelectionIdentity,
    selected: value.selected.map((item) => ({
      primary: item.primaryBlueprintKey,
      supporting: item.supportingBlueprintKeys,
      coverage: item.primaryCoverage,
      semantic: item.selectionSemanticKey,
      id: item.topicId,
      labelKey: item.promptSubjectLabelKey,
      lanes: item.measurementLanes.map((lane) => [
        lane.blueprintKey,
        lane.laneKey
      ])
    })),
    edges: value.personaTopicEdges.map((item) => [
      item.personaId,
      item.topicId,
      item.edgeRole
    ]),
    alternatives: value.alternatives,
    overlays: value.observationOverlays
  };
}

function cloneInput(
  input: RecoraTopicCompilerInputV3
): RecoraTopicCompilerInputV3 {
  return JSON.parse(JSON.stringify(input)) as RecoraTopicCompilerInputV3;
}

function invarianceTransform(
  input: RecoraTopicCompilerInputV3,
  transform: typeof RECORA_TOPIC_INVARIANCE_TRANSFORMS_V3[number]
): RecoraTopicCompilerInputV3 {
  const next = cloneInput(input);
  const generation = next.generationInput as unknown as {
    business: {
      secondaryDomains: string[];
      secondaryOfferingModels: string[];
    };
    actions: { secondary: string[] };
    generationContext: {
      structureSignals: string[];
      customerSides: string[];
      actorRelations: unknown[];
      focusThemes: string[];
      diagnosisGoals: string[];
    };
    generationIdentity: { fingerprint: string };
  };
  const personas = next.personaCompilation as unknown as {
    selected: Array<{
      displayName: string;
      description: string;
      selectionEvidence: string[];
    }>;
  };

  if (transform === "secondary_domain_order") {
    generation.business.secondaryDomains.reverse();
  } else if (transform === "secondary_offering_order") {
    generation.business.secondaryOfferingModels.reverse();
  } else if (transform === "secondary_action_order") {
    generation.actions.secondary.reverse();
  } else if (transform === "structure_signal_order") {
    generation.generationContext.structureSignals.reverse();
  } else if (transform === "customer_side_order") {
    generation.generationContext.customerSides.reverse();
  } else if (transform === "actor_relation_order") {
    generation.generationContext.actorRelations.reverse();
  } else if (transform === "persona_array_order_preserving_sort_order") {
    personas.selected.reverse();
  } else if (transform === "duplicate_semantic_array_values") {
    generation.generationContext.customerSides.push(
      generation.generationContext.customerSides[0]
    );
  } else if (transform === "stored_generation_fingerprint") {
    generation.generationIdentity.fingerprint = "changed-storage-fingerprint";
  } else if (transform === "persona_display_text") {
    personas.selected[0].displayName = "Changed display only";
    personas.selected[0].description = "Changed description only";
  } else if (transform === "persona_selection_evidence") {
    personas.selected[0].selectionEvidence = ["changed evidence"];
  } else if (transform === "focus_diagnosis_order") {
    generation.generationContext.focusThemes.reverse();
    generation.generationContext.diagnosisGoals.reverse();
  }
  return next;
}

function meaningChangeTransform(
  input: RecoraTopicCompilerInputV3,
  transform: typeof RECORA_TOPIC_MEANING_CHANGE_TRANSFORMS_V3[number]
): RecoraTopicCompilerInputV3 {
  const next = cloneInput(input);
  const generation = next.generationInput as unknown as {
    audience: { priority: RecoraAudiencePriority | null };
    business: { primaryOfferingModel: RecoraOfferingModel };
    actions: { primary: RecoraCustomerAction };
    delivery: { geographicBinding: "none" | "service_area" };
    trust: {
      regulatoryFlags: string[];
      derived: { derivedClass: "standard" | "high_trust" | "regulated" };
    };
    generationContext: {
      structureSignals: RecoraGenerationStructureSignal[];
      focusThemes: string[];
    };
  };
  const personas = next.personaCompilation as unknown as {
    selected: Array<{
      modifierKeys: string[];
      marketSides: RecoraGenerationCustomerSide[];
    }>;
  };

  if (transform === "audience_priority") {
    generation.audience.priority =
      generation.audience.priority === "b2b_first"
        ? "balanced"
        : "b2b_first";
  } else if (transform === "primary_action") {
    generation.actions.primary =
      generation.actions.primary === "inquiry" ? "contract" : "inquiry";
  } else if (transform === "offering_model") {
    generation.business.primaryOfferingModel =
      generation.business.primaryOfferingModel === "saas_software"
        ? "managed_service"
        : "saas_software";
  } else if (transform === "structure_motion") {
    const replacement = generation.generationContext.structureSignals.includes(
      "media_brand"
    )
      ? "agency_delivery"
      : "media_brand";
    generation.generationContext.structureSignals.push(replacement);
  } else if (transform === "geographic_binding") {
    generation.delivery.geographicBinding =
      generation.delivery.geographicBinding === "none"
        ? "service_area"
        : "none";
  } else if (transform === "trust_or_regulation") {
    generation.trust.derived.derivedClass = "regulated";
    generation.trust.regulatoryFlags = ["regulated_service"];
  } else if (transform === "persona_modifier") {
    personas.selected[0].modifierKeys = ["lifecycle.renewal_decider"];
  } else if (transform === "required_focus_theme") {
    generation.generationContext.focusThemes = ["required:料金"];
  } else if (transform === "persona_market_side") {
    personas.selected[0].marketSides = ["partner_or_intermediary"];
  }
  return next;
}

function resultForNeedsReview(
  code: string,
  base: RecoraTopicCompilerInputV3
): RecoraTopicCompilationV3 {
  const next = cloneInput(base);
  if (code === "persona_compilation_needs_review") {
    const persona = next.personaCompilation as unknown as {
      status: string;
      selected: unknown[];
      reviewQuestions: Array<{
        code: string;
        message: string;
        allowedAnswers: string[];
      }>;
    };
    persona.status = "needs_review";
    persona.selected = [];
    persona.reviewQuestions = [
      {
        code: "fixture_review",
        message: "fixture",
        allowedAnswers: ["confirm"]
      }
    ];
  } else if (code === "multiple_topic_recipes_match") {
    const duplicate: RecoraTopicSelectionRecipeV3 = {
      ...RECORA_TOPIC_SELECTION_RECIPES_V3[1],
      personaRecipeKey: "standard_b2b"
    };
    return compileRecoraMeasurementTopicsV3(next, {
      recipes: [RECORA_TOPIC_SELECTION_RECIPES_V3[0], duplicate]
    });
  } else if (code === "required_focus_theme_unmapped") {
    mutableFocus(next).push("required:未登録の必須テーマ");
  } else if (code === "required_focus_themes_conflict") {
    mutableFocus(next).push("required:口コミ", "required:引用確認");
  } else if (code === "prompt_subject_label_too_broad") {
    const generation = next.generationInput as unknown as {
      business: {
        primaryDomain: RecoraBusinessDomain;
        primaryOfferingModel: RecoraOfferingModel;
      };
      generationContext: { structureSignals: string[] };
    };
    generation.business.primaryDomain = "other";
    generation.business.primaryOfferingModel = "other";
    generation.generationContext.structureSignals = [];
  } else if (code === "food_beauty_subtype_conflict") {
    const generation = next.generationInput as unknown as {
      business: { summary: string };
    };
    generation.business.summary = "飲食店と美容サロンの両方";
  } else if (code === "required_geographic_focus_without_context") {
    mutableFocus(next).push("required:地域");
    const delivery = next.generationInput.delivery as unknown as {
      geographicBinding: string;
    };
    delivery.geographicBinding = "none";
  } else if (code === "required_lifecycle_focus_without_persona_state") {
    mutableFocus(next).push("required:更新");
    const context = next.generationInput.generationContext as unknown as {
      lifecycleSignals: string[];
    };
    context.lifecycleSignals = [];
  } else {
    mutableFocus(next).push("required:未登録の必須テーマ");
  }
  return compileRecoraMeasurementTopicsV3(next);
}

function resultForCatalogGap(
  code: string,
  base: RecoraTopicCompilerInputV3
): RecoraTopicCompilationV3 {
  const next = cloneInput(base);
  if (code === "approved_topic_bundle_incomplete") {
    return compileRecoraMeasurementTopicsV3(next, {
      catalog: RECORA_TOPIC_BLUEPRINT_CATALOG_V3.filter(
        (item) =>
          item.blueprintKey !== "diagnostic.subject_reputation_sentiment"
      )
    });
  }
  if (
    code === "topic_primary_edge_missing" ||
    code === "persona_topic_coverage_missing"
  ) {
    const personas = next.personaCompilation.selected as unknown as Array<{
      topicInfluenceDimensions: string[];
      roleFamilies: string[];
      marketSides: string[];
    }>;
    const targets =
      code === "topic_primary_edge_missing" ? personas : [personas[4]];
    for (const persona of targets) {
      persona.topicInfluenceDimensions = [
        "fixture_unmatched_a",
        "fixture_unmatched_b"
      ];
      persona.roleFamilies = ["fixture_unmatched"];
      persona.marketSides = [];
    }
    return compileRecoraMeasurementTopicsV3(next);
  }
  if (code === "required_market_side_coverage_missing") {
    const marketplace = compilerInputFor("marketplace_brand");
    for (const persona of marketplace.personaCompilation.selected as unknown as Array<{
      marketSides: RecoraGenerationCustomerSide[];
    }>) {
      persona.marketSides = ["demand_side_participant"];
    }
    return compileRecoraMeasurementTopicsV3(marketplace);
  }
  return compileRecoraMeasurementTopicsV3(next, {
    catalog: RECORA_TOPIC_BLUEPRINT_CATALOG_V3.filter(
      (item) => item.primaryCoverage !== "T1"
    )
  });
}

function resultForBlocked(
  code: string,
  base: RecoraTopicCompilerInputV3
): RecoraTopicCompilationV3 {
  const next = cloneInput(base);
  if (code === "unsupported_topic_input_version") {
    (next as unknown as { contractVersion: string }).contractVersion =
      "unsupported";
  } else if (code === "unsupported_country") {
    (next.generationInput.market as unknown as { country: string }).country =
      "US";
  } else if (code === "unsupported_locale") {
    (next.generationInput.market as unknown as { locale: string }).locale =
      "en-US";
  } else if (code === "persona_compilation_blocked") {
    (next.personaCompilation as unknown as { status: string }).status =
      "blocked";
  } else if (code === "unsupported_persona_contract_version") {
    (next.personaCompilation as unknown as { contractVersion: string })
      .contractVersion = "unsupported";
  } else if (code === "persona_selected_count_mismatch") {
    (next.personaCompilation as unknown as { selected: unknown[] }).selected =
      next.personaCompilation.selected.slice(0, 4);
  } else if (code === "persona_identity_duplicate") {
    const selected = next.personaCompilation.selected as unknown as Array<{
      personaId: string;
    }>;
    selected[1].personaId = selected[0].personaId;
  } else if (code === "persona_semantic_key_duplicate") {
    const selected = next.personaCompilation.selected as unknown as Array<{
      selectionSemanticKey: string;
    }>;
    selected[1].selectionSemanticKey = selected[0].selectionSemanticKey;
  } else if (code === "topic_catalog_invalid") {
    return compileRecoraMeasurementTopicsV3(next, {
      catalog: [
        RECORA_TOPIC_BLUEPRINT_CATALOG_V3[0],
        RECORA_TOPIC_BLUEPRINT_CATALOG_V3[0]
      ]
    });
  } else {
    const selected = next.personaCompilation.selected as unknown as Array<{
      sortOrder: number;
    }>;
    selected[1].sortOrder = selected[0].sortOrder;
  }
  return compileRecoraMeasurementTopicsV3(next);
}

function mutableFocus(input: RecoraTopicCompilerInputV3): string[] {
  return (
    input.generationInput.generationContext as unknown as {
      focusThemes: string[];
    }
  ).focusThemes;
}

function assertMatrix(): void {
  const catalog = validateRecoraMeasurementTopicCatalogV3();
  assert.equal(catalog.valid, true, catalog.blockers.join("\n"));
  const recipes = validateRecoraTopicSelectionRecipesV3();
  assert.equal(recipes.valid, true, recipes.blockers.join("\n"));
  assert.equal(RECORA_TOPIC_SELECTION_RECIPES_V3.length, 35);
  assert.deepEqual(
    [...RECORA_TOPIC_RECIPE_KEYS_V3].sort(),
    RECORA_TOPIC_SELECTION_RECIPES_V3.map(
      (item) => item.personaRecipeKey
    ).sort()
  );
  assert.equal(Object.keys(RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1).length, 14);
  assert.equal(
    Object.keys(RECORA_PROMPT_SUBJECT_STRUCTURE_BINDING_V1).length,
    RECORA_GENERATION_STRUCTURE_SIGNALS.length
  );
  assert.ok(RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1.length >= 9);
  assert.equal(RECORA_TOPIC_BLUEPRINT_CATALOG_V3.length, 332);
  assert.equal(
    RECORA_TOPIC_BLUEPRINT_CATALOG_V3.filter(
      (item) => item.kind === "observation_overlay"
    ).length,
    1
  );

  const catalogKeys = new Set(
    RECORA_TOPIC_BLUEPRINT_CATALOG_V3.map((item) => item.blueprintKey)
  );
  for (const recipe of RECORA_TOPIC_SELECTION_RECIPES_V3) {
    for (const slot of recipe.slots) {
      const authority = slot.primaryAuthority;
      if (authority.kind === "fixed_blueprint") {
        assert.ok(catalogKeys.has(authority.blueprintKey));
      }
      for (const key of [
        ...authority.fallbackBlueprintKeys,
        ...slot.supportingBlueprintKeys,
        ...slot.alternativeBlueprintKeys
      ]) {
        assert.ok(catalogKeys.has(key), `${recipe.recipeKey}:${key}`);
      }
    }
  }
  for (const [action, key] of Object.entries(
    RECORA_TOPIC_PRIMARY_ACTION_BINDING_V1
  )) {
    const item = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.find(
      (candidate) => candidate.blueprintKey === key
    );
    assert.equal(item?.primaryCoverage, "T4", `${action}:${key}`);
    assert.equal(item?.measurementLane, "action_readiness", `${action}:${key}`);
  }
  for (const binding of RECORA_TOPIC_DOMAIN_OFFERING_BINDINGS_V1) {
    const item = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.find(
      (candidate) => candidate.blueprintKey === binding.blueprintKey
    );
    assert.equal(item?.primaryCoverage, "T6", binding.blueprintKey);
  }
  assert.equal(
    RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.natural_citation_overlay
      .allowedMetricKeys.join(","),
    "naturalCitationObservation"
  );
  assert.equal(
    RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.forced_citation_validation
      .allowedMetricKeys.join(","),
    "forcedCitationValidation"
  );
  for (const metric of ["visibility", "ranking", "sov"] as const) {
    assert.ok(
      RECORA_TOPIC_MEASUREMENT_LANE_POLICIES_V3.self_branded_perception
        .forbiddenMetricKeys.includes(metric)
    );
  }
}

function assertFixtureInventory(): void {
  assert.equal(RECORA_TOPIC_READY_GOLD_CASES_V3.length, 35);
  assert.equal(RECORA_TOPIC_NEEDS_REVIEW_GOLD_CASES_V3.length, 10);
  assert.equal(RECORA_TOPIC_CATALOG_GAP_GOLD_CASES_V3.length, 7);
  assert.equal(RECORA_TOPIC_BLOCKED_GOLD_CASES_V3.length, 10);
  assert.equal(RECORA_MEASUREMENT_TOPIC_GOLD_FIXTURES_V3.length, 62);
  assert.equal(RECORA_TOPIC_INVARIANCE_TRANSFORMS_V3.length, 15);
  assert.equal(RECORA_TOPIC_MEANING_CHANGE_TRANSFORMS_V3.length, 9);
  for (const [, code] of RECORA_TOPIC_NEEDS_REVIEW_GOLD_CASES_V3) {
    assert.ok((RECORA_TOPIC_REVIEW_CODES_V3 as readonly string[]).includes(code));
  }
  for (const [, code] of RECORA_TOPIC_CATALOG_GAP_GOLD_CASES_V3) {
    assert.ok(
      (RECORA_TOPIC_CATALOG_GAP_CODES_V3 as readonly string[]).includes(code)
    );
  }
  for (const [, code] of RECORA_TOPIC_BLOCKED_GOLD_CASES_V3) {
    assert.ok((RECORA_TOPIC_BLOCKER_CODES_V3 as readonly string[]).includes(code));
  }
}

function main(): void {
  assertMatrix();
  assertFixtureInventory();

  let executions = 0;
  for (const [, recipeKey] of RECORA_TOPIC_READY_GOLD_CASES_V3) {
    const input = compilerInputFor(recipeKey);
    const baseline = compileRecoraMeasurementTopicsV3(input);
    assertReady(baseline, recipeKey);
    executions += 1;

    for (const transform of RECORA_TOPIC_INVARIANCE_TRANSFORMS_V3) {
      const transformed = invarianceTransform(input, transform);
      const result =
        transform === "topic_display_label_only"
          ? compileRecoraMeasurementTopicsV3(transformed, {
              catalog: RECORA_TOPIC_BLUEPRINT_CATALOG_V3.map((item) => ({
                ...item,
                customerFacingNameTemplate: `${item.customerFacingNameTemplate} 表示変更`
              }))
            })
          : compileRecoraMeasurementTopicsV3(transformed);
      assertReady(result, recipeKey);
      assert.deepEqual(semanticSignature(result), semanticSignature(baseline));
      executions += 1;
    }

    for (const transform of RECORA_TOPIC_MEANING_CHANGE_TRANSFORMS_V3) {
      const result = compileRecoraMeasurementTopicsV3(
        meaningChangeTransform(input, transform)
      );
      assert.ok(
        result.status !== "ready" ||
          result.topicSelectionIdentity.fingerprint !==
            baseline.topicSelectionIdentity.fingerprint,
        `${recipeKey}:${transform}:meaning_change_ignored`
      );
      executions += 1;
    }
  }

  const negativeBase = compilerInputFor("standard_b2b");
  for (const [, code] of RECORA_TOPIC_NEEDS_REVIEW_GOLD_CASES_V3) {
    const result = resultForNeedsReview(code, negativeBase);
    assert.equal(result.status, "needs_review", code);
    executions += 1;
  }
  for (const [, code] of RECORA_TOPIC_CATALOG_GAP_GOLD_CASES_V3) {
    const result = resultForCatalogGap(code, negativeBase);
    assert.equal(result.status, "catalog_gap", code);
    executions += 1;
  }
  for (const [, code] of RECORA_TOPIC_BLOCKED_GOLD_CASES_V3) {
    const result = resultForBlocked(code, negativeBase);
    assert.equal(result.status, "blocked", code);
    executions += 1;
  }

  assert.equal(executions, RECORA_TOPIC_GOLD_EXPECTED_COUNTS_V3.minimumExecutions);
  assert.equal(executions, 902);

  console.log("Recora Measurement Topic Compiler v3 verifier: PASS");
  console.log(`Base Gold: ${RECORA_MEASUREMENT_TOPIC_GOLD_FIXTURES_V3.length}`);
  console.log(
    `Ready invariance: ${RECORA_TOPIC_READY_GOLD_CASES_V3.length} x ${RECORA_TOPIC_INVARIANCE_TRANSFORMS_V3.length}`
  );
  console.log(
    `Meaning change: ${RECORA_TOPIC_READY_GOLD_CASES_V3.length} x ${RECORA_TOPIC_MEANING_CHANGE_TRANSFORMS_V3.length}`
  );
  console.log(`Executions: ${executions}`);
  console.log(`Catalog: ${RECORA_TOPIC_BLUEPRINT_CATALOG_VERSION}`);
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

main();
