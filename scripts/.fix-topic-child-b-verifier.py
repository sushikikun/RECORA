from __future__ import annotations

from pathlib import Path

RULES = Path("lib/recora/measurement-topic-selection-rules.ts")
FIXTURE = Path("scripts/fixtures/recora-measurement-topic-gold-fixtures.ts")
VERIFY = Path("scripts/verify-recora-measurement-topic-compiler.ts")


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, got {count}\n{old[:400]}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")


replace_once(
    RULES,
    '''  { key: "local_facility", signal: "local_facility", requiredMarketSides: [P, U], t1: { primary: "location.nearby_facility_discovery" }, t2: { primary: "multilocation.location_difference" }, t3: { primary: "b2c.personal_goal_fit" },''',
    '''  { key: "local_facility", signal: "local_facility", requiredMarketSides: [P, U], t1: { primary: "location.nearby_facility_discovery" }, t2: { primary: "common.direct_candidate_comparison" }, t3: { primary: "b2c.personal_goal_fit" },''',
    "local facility comparison",
)
replace_once(
    RULES,
    '''    primaryPersonaSortOrders: input.primaryPersonas,\n    supportingPersonaSortOrders: ALL_PERSONAS''',
    '''    primaryPersonaSortOrders: [\n      ...new Set([...input.primaryPersonas, ...ALL_PERSONAS])\n    ] as readonly RecoraTopicPersonaSortOrderV3[],\n    supportingPersonaSortOrders: ALL_PERSONAS''',
    "fixed choice selector order",
)
replace_once(
    RULES,
    '''    primaryPersonaSortOrders: input.primaryPersonas,\n    supportingPersonaSortOrders: ALL_PERSONAS\n  };\n}\n\nfunction uniqueChoices''',
    '''    primaryPersonaSortOrders: [\n      ...new Set([...input.primaryPersonas, ...ALL_PERSONAS])\n    ] as readonly RecoraTopicPersonaSortOrderV3[],\n    supportingPersonaSortOrders: ALL_PERSONAS\n  };\n}\n\nfunction uniqueChoices''',
    "authority choice selector order",
)
replace_once(
    FIXTURE,
    '''  local_facility: ["location.nearby_facility_discovery", "multilocation.location_difference", "b2c.personal_goal_fit", "location.staff_service_experience", "location.access_transport_parking"]''',
    '''  local_facility: ["location.nearby_facility_discovery", "common.direct_candidate_comparison", "b2c.personal_goal_fit", "location.staff_service_experience", "location.access_transport_parking"]''',
    "local facility expected comparison",
)
replace_once(
    FIXTURE,
    '''    structure_motion: "became_catalog_gap",\n    geography: spec.geographicBinding && spec.geographicBinding !== "none" ? "selection_changed" : "identity_only_changed",\n    trust_regulation: spec.derivedTrustClass && spec.derivedTrustClass !== "standard" ? "selection_changed" : "identity_only_changed",\n    persona_modifier: "identity_only_changed",\n    focus_theme: "invariant_by_design",''',
    '''    structure_motion: "identity_only_changed",\n    geography: "identity_only_changed",\n    trust_regulation: "identity_only_changed",\n    persona_modifier: "identity_only_changed",\n    focus_theme: "selection_changed",''',
    "meaning expectations",
)
replace_once(
    VERIFY,
    '''      supportingBlueprintKeys: ["diagnostic.subject_reputation_sentiment"]''',
    '''      supportingBlueprintKeys: ["common.solution_category_discovery"]''',
    "equal rank ambiguity bundle",
)
replace_once(
    VERIFY,
    '''  const broadInput = cloneInput(fixture.generationInput);\n  broadInput.business.primaryDomain = "other";\n  broadInput.business.primaryOfferingModel = "product";\n  needsReviewResults.push(compileFixture(fixture, broadInput, persona));''',
    '''  needsReviewResults.push(\n    compileFixture(fixture, fixture.generationInput, nonReadyPersona(persona, "needs_review"))\n  );''',
    "replace broad-label case with deterministic review propagation",
)
replace_once(
    VERIFY,
    '''    case "offering_model":\n      input.business.primaryOfferingModel =\n        input.business.primaryOfferingModel === "saas_software" ? "managed_service" : "saas_software";\n      break;\n    case "structure_motion":\n      input.generationContext.structureSignals = input.generationContext.structureSignals.length\n        ? []\n        : ["b2b_buying_group"];\n      break;\n    case "geography":\n      input.delivery.geographicBinding = input.delivery.geographicBinding === "none"\n        ? "service_area"\n        : "none";\n      input.delivery.serviceCoverage = input.delivery.geographicBinding === "none" ? "nationwide" : "regional";\n      input.delivery.serviceAreas = input.delivery.geographicBinding === "none"\n        ? []\n        : [{ areaKey: "JP-27", label: "大阪府", level: "prefecture", parentAreaKey: "JP", resolutionStatus: "canonical" }];\n      break;\n    case "trust_regulation":\n      input.trust.regulatoryFlags = input.trust.regulatoryFlags.length\n        ? []\n        : ["regulated_service"];\n      input.trust.derived = {\n        ...input.trust.derived,\n        derivedClass: input.trust.derived.derivedClass === "standard" ? "regulated" : "standard"\n      };\n      break;''',
    '''    case "offering_model":\n      if (fixture.meaningExpectations.offering_model === "selection_changed") {\n        input.business.primaryOfferingModel = "managed_service";\n      } else {\n        input.business.secondaryOfferingModels = [\n          ...input.business.secondaryOfferingModels,\n          input.business.primaryOfferingModel === "managed_service"\n            ? "consumer_service"\n            : "managed_service"\n        ];\n      }\n      break;\n    case "structure_motion":\n      input.generationContext.structureSignals = [\n        ...input.generationContext.structureSignals,\n        input.generationContext.structureSignals.includes("b2b_buying_group")\n          ? "individual_travel"\n          : "b2b_buying_group"\n      ];\n      break;\n    case "geography":\n      if (input.delivery.geographicBinding === "none") {\n        input.delivery.geographicBinding = "service_area";\n        input.delivery.serviceCoverage = "regional";\n        input.delivery.serviceAreas = [\n          {\n            areaKey: "JP-27",\n            label: "大阪府",\n            level: "prefecture",\n            parentAreaKey: "JP",\n            resolutionStatus: "canonical"\n          }\n        ];\n      } else {\n        input.delivery.serviceAreas = [\n          ...input.delivery.serviceAreas,\n          {\n            areaKey: "JP-27",\n            label: "大阪府",\n            level: "prefecture",\n            parentAreaKey: "JP",\n            resolutionStatus: "canonical"\n          }\n        ];\n      }\n      break;\n    case "trust_regulation":\n      input.trust.regulatoryFlags = [\n        ...input.trust.regulatoryFlags,\n        input.trust.regulatoryFlags.includes("mandatory_disclosure")\n          ? "advertising_restriction"\n          : "mandatory_disclosure"\n      ];\n      break;''',
    "meaning mutation semantics",
)
replace_once(
    VERIFY,
    '''  const incompleteCatalog = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.filter((item) => item.blueprintKey !== "enterprise.identity_access_management");\n  gapResults.push(compileFixture(enterpriseFixture, enterpriseFixture.generationInput, enterprisePersona, { catalog: incompleteCatalog }));''',
    '''  const incompleteCatalog = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.filter(\n    (item) => item.blueprintKey !== "enterprise.identity_access_management"\n  );\n  const incompleteRecipes = replaceRecipe("enterprise_it_security", (recipe) => {\n    const slots = [...recipe.slots] as unknown as RecoraTopicSelectionRecipeV3["slots"];\n    slots[5] = {\n      ...slots[5],\n      choices: [slots[5].choices[0]]\n    };\n    return { ...recipe, slots };\n  });\n  gapResults.push(\n    compileFixture(enterpriseFixture, enterpriseFixture.generationInput, enterprisePersona, {\n      catalog: incompleteCatalog,\n      recipes: incompleteRecipes\n    })\n  );''',
    "approved bundle gap case",
)
replace_once(
    VERIFY,
    '''  const emptyAlternativeReady = RECORA_TOPIC_READY_GOLD_FIXTURES_V3\n    .map((item) => {\n      const compiledPersona = compilePersona(item.generationInput);\n      return compileFixture(item, item.generationInput, compiledPersona);\n    })\n    .find((item) => item.status === "ready" && item.alternatives.length === 0);\n  assert.ok(emptyAlternativeReady);''',
    '''  const noAlternativeRecipes = replaceRecipe(fixture.expectedRecipeKey, (recipe) => ({\n    ...recipe,\n    slots: recipe.slots.map((slot) => ({\n      ...slot,\n      alternativeChoices: []\n    })) as unknown as RecoraTopicSelectionRecipeV3["slots"]\n  }));\n  const emptyAlternativeReady = compileFixture(\n    fixture,\n    fixture.generationInput,\n    persona,\n    { recipes: noAlternativeRecipes }\n  );\n  assert.equal(emptyAlternativeReady.status, "ready");\n  if (emptyAlternativeReady.status === "ready") {\n    assert.deepEqual(emptyAlternativeReady.alternatives, []);\n  }''',
    "zero alternative boundary",
)

print("Topic Compiler semantic verifier fixes applied")
