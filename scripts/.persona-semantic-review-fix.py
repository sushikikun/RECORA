from pathlib import Path

CONTRACT = Path("lib/recora/measurement-persona-contract.ts")
COMMON = Path("lib/recora/measurement-persona-catalog-common.ts")
RULES = Path("lib/recora/measurement-persona-selection-rules.ts")
COMPILER = Path("lib/recora/measurement-persona-compiler.ts")
VERIFY = Path("scripts/verify-recora-measurement-persona-compiler.ts")
DOC = Path("docs/architecture/measurement-design/recora_measurement_persona_compiler_v3_ja.md")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8", newline="\n")


def replace_once(path: Path, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"{path}: expected one match, got {count}\nTARGET:\n{old[:600]}"
        )
    write(path, text.replace(old, new, 1))


replace_once(
    CONTRACT,
    '''  fallback?: boolean;
  supersedesRecipeKeys?: readonly string[];
  matchSignalsAll?: readonly RecoraGenerationStructureSignal[];''',
    '''  fallback?: boolean;
  supersedesRecipeKeys?: readonly string[];
  exclusionReasonOverrides?: Readonly<
    Record<string, RecoraPersonaExclusionReasonCode>
  >;
  matchSignalsAll?: readonly RecoraGenerationStructureSignal[];'''
)

replace_once(
    COMMON,
    '["agency_consultant_partner", "agency.external_advisor", "顧客へ第三者として候補を推薦する専門家", ["C5"], "advisor", "influencer_or_referrer", "conditional", ["agency_delivery"]]',
    '["agency_consultant_partner", "agency.external_advisor", "顧客へ第三者として候補を推薦する専門家", ["C5"], "advisor", "influencer_or_referrer", "conditional", ["agency_delivery", "real_estate_sale"]]'
)

overrides = {
    "care_welfare": '''    exclusionReasonOverrides: {
      "care.frontline_care_worker": "subject_internal"
    },''',
    "multi_location_consumer_brand": '''    exclusionReasonOverrides: {
      "multilocation.hq_strategy_owner": "subject_internal",
      "multilocation.hq_operations_owner": "subject_internal",
      "multilocation.hq_procurement_owner": "subject_internal",
      "multilocation.hq_brand_reputation_owner": "subject_internal",
      "branch.local_manager": "subject_internal",
      "branch.local_operator": "subject_internal",
      "branch.local_marketing_reputation_owner": "subject_internal",
      "branch.local_customer_service_owner": "subject_internal"
    },''',
    "franchise_consumer_brand": '''    exclusionReasonOverrides: {
      "franchise.hq_decision_owner": "subject_internal",
      "franchise.franchisee_owner": "subject_internal",
      "franchise.location_operator": "subject_internal",
      "franchise.brand_compliance_reviewer": "subject_internal"
    },''',
    "marketplace_brand": '''    exclusionReasonOverrides: {
      "marketplace.operator_business_owner": "subject_internal",
      "marketplace.demand_growth_owner": "subject_internal",
      "marketplace.supply_growth_owner": "subject_internal",
      "marketplace.trust_safety_owner": "subject_internal",
      "marketplace.support_dispute_owner": "subject_internal"
    },''',
    "media_brand": '''    exclusionReasonOverrides: {
      "media.internal_content_operator": "subject_internal",
      "media.publisher_editorial_owner": "subject_internal"
    },'''
}
for recipe_key, override in overrides.items():
    replace_once(
        RULES,
        f'''    recipeKey: "{recipe_key}",
    matchSignalsAll:''',
        f'''    recipeKey: "{recipe_key}",
{override}
    matchSignalsAll:'''
    )

replace_once(
    COMPILER,
    '''  if (
    blueprint.blueprintKey === "agency.external_advisor" &&
    recipeKey === "real_estate_sale"
  ) {
    return true;
  }
''',
    ''
)

replace_once(
    COMPILER,
    '''  const excluded = buildExcluded(
    catalog,
    selected,
    alternatives,
    selectionInput,
    recipe.recipeKey
  );''',
    '''  const excluded = buildExcluded(
    catalog,
    selected,
    alternatives,
    selectionInput,
    recipe
  );'''
)

compiler_text = read(COMPILER)
start = compiler_text.index("function buildAlternatives(")
end = compiler_text.index("\nfunction buildDescription(", start)
new_functions = r'''function buildAlternatives(
  recipe: RecoraPersonaSelectionRecipeV3,
  byKey: ReadonlyMap<string, RecoraPersonaBlueprintV3>,
  input: RecoraPersonaSelectionInputV3,
  selected: readonly RecoraSelectedPersonaV3[]
): RecoraPersonaAlternativeV3[] {
  const selectedKeys = new Set(
    selected.flatMap((item) => [
      item.primaryBlueprintKey,
      ...item.supportingBlueprintKeys,
      ...item.modifierKeys
    ])
  );

  return recipe.alternativeBlueprintKeys
    .map((key) => byKey.get(key))
    .filter((item): item is RecoraPersonaBlueprintV3 => Boolean(item))
    .filter((item) => !selectedKeys.has(item.blueprintKey))
    .filter((item) => item.kind !== "modifier")
    .filter((item) =>
      isConditionalBlueprintApplicable(item, input, recipe.recipeKey)
    )
    .map((item) => {
      const replaceableSelectionIndexes = selected
        .map((selection, selectionIndex) => {
          const replacement = buildAlternativeReplacement(
            selection,
            item,
            selectionIndex
          );
          const hypothetical = selected.map((current, currentIndex) =>
            currentIndex === selectionIndex ? replacement : current
          );
          return validateSelected(
            hypothetical,
            recipe,
            input,
            byKey
          ).length === 0
            ? selectionIndex
            : -1;
        })
        .filter((selectionIndex) => selectionIndex >= 0);

      return {
        blueprintKey: item.blueprintKey,
        label: item.label,
        replaceableSelectionIndexes,
        reasons: ["recipe_alternative_contract_preserved"]
      };
    })
    .filter((item) => item.replaceableSelectionIndexes.length > 0)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
}

function buildAlternativeReplacement(
  source: RecoraSelectedPersonaV3,
  blueprint: RecoraPersonaBlueprintV3,
  selectionIndex: number
): RecoraSelectedPersonaV3 {
  return {
    ...source,
    personaId: `alternative:${blueprint.blueprintKey}:${selectionIndex}`,
    selectionSemanticKey: buildRecoraPersonaSelectionSemanticKey({
      primaryBlueprintKey: blueprint.blueprintKey,
      supportingBlueprintKeys: [],
      modifierKeys: []
    }),
    primaryBlueprintKey: blueprint.blueprintKey,
    supportingBlueprintKeys: [],
    modifierKeys: [],
    coverageDimensions: blueprint.coverageDimensions,
    marketSides: [blueprint.marketSide],
    roleFamilies: [blueprint.roleFamily],
    topicInfluenceDimensions: blueprint.topicInfluenceDimensions,
    displayName: blueprint.label,
    description: blueprint.description,
    primaryGoal: buildPrimaryGoal(blueprint.coverageDimensions),
    selectionEvidence: ["recipe_alternative_contract_check"]
  };
}

function buildExcluded(
  catalog: readonly RecoraPersonaBlueprintV3[],
  selected: readonly RecoraSelectedPersonaV3[],
  alternatives: readonly RecoraPersonaAlternativeV3[],
  input: RecoraPersonaSelectionInputV3,
  recipe: RecoraPersonaSelectionRecipeV3
): RecoraPersonaExcludedV3[] {
  const used = new Set([
    ...selected.flatMap((item) => [
      item.primaryBlueprintKey,
      ...item.supportingBlueprintKeys,
      ...item.modifierKeys
    ]),
    ...alternatives.map((item) => item.blueprintKey)
  ]);
  const selectedGroups = new Set<string>(
    selected
      .flatMap((item) => [
        item.primaryBlueprintKey,
        ...item.supportingBlueprintKeys
      ])
      .map(
        (key) =>
          catalog.find((item) => item.blueprintKey === key)?.semanticGroupKey
      )
      .filter((key): key is string => Boolean(key))
  );

  return catalog
    .filter((item) => !used.has(item.blueprintKey))
    .map((item) => {
      const reasonCodes: RecoraPersonaExcludedV3["reasonCodes"][number][] = [];
      if (item.kind === "modifier") {
        reasonCodes.push("modifier_not_standalone");
        return { blueprintKey: item.blueprintKey, reasonCodes };
      }

      const override = recipe.exclusionReasonOverrides?.[item.blueprintKey];
      if (override) reasonCodes.push(override);

      if (
        input.audience.scope === "b2b" &&
        item.blueprintKey.startsWith("b2c.")
      ) {
        reasonCodes.push("wrong_customer_scope");
      }
      if (
        input.audience.scope === "b2c" &&
        item.blueprintKey.startsWith("b2b.")
      ) {
        reasonCodes.push("wrong_customer_scope");
      }
      if (!input.customerSides.includes(item.marketSide)) {
        reasonCodes.push("wrong_market_side");
      }
      if (
        item.requiredSignalsAny.length > 0 &&
        !item.requiredSignalsAny.some((signal) =>
          input.structureSignals.includes(signal)
        )
      ) {
        reasonCodes.push("wrong_business_motion");
      }
      if (
        item.kind === "conditional" &&
        !isConditionalBlueprintApplicable(item, input, recipe.recipeKey)
      ) {
        reasonCodes.push("conditional_side_not_customer");
      }
      if (selectedGroups.has(item.semanticGroupKey)) {
        reasonCodes.push("semantic_duplicate");
      }
      reasonCodes.push("not_required_by_selected_recipe");

      return {
        blueprintKey: item.blueprintKey,
        reasonCodes: unique(reasonCodes)
      };
    });
}
'''
compiler_text = compiler_text[:start] + new_functions + compiler_text[end:]
write(COMPILER, compiler_text)

replace_once(
    VERIFY,
    '''verifyRecipeCoverage();
verifyUpstreamInvariantFailure();''',
    '''verifyRecipeCoverage();
verifyDataDrivenConditionalApplicability();
verifySemanticExclusionReasons();
verifyAlternativesPreserveContract();
verifyUpstreamInvariantFailure();'''
)

verifier_functions = r'''
function verifyDataDrivenConditionalApplicability() {
  const advisor = RECORA_PERSONA_BLUEPRINT_CATALOG_V3.find(
    (item) => item.blueprintKey === "agency.external_advisor"
  );
  assert.ok(advisor);
  assert.deepEqual(advisor.requiredSignalsAny, [
    "agency_delivery",
    "real_estate_sale"
  ]);

  const compilerSource = readFileSync(
    "lib/recora/measurement-persona-compiler.ts",
    "utf8"
  );
  assert.equal(
    compilerSource.includes(
      'blueprint.blueprintKey === "agency.external_advisor"'
    ),
    false
  );
}

function verifySemanticExclusionReasons() {
  const cases = [
    {
      recipeKey: "care_welfare",
      blueprintKeys: ["care.frontline_care_worker"]
    },
    {
      recipeKey: "marketplace_brand",
      blueprintKeys: [
        "marketplace.operator_business_owner",
        "marketplace.trust_safety_owner"
      ]
    },
    {
      recipeKey: "media_brand",
      blueprintKeys: [
        "media.internal_content_operator",
        "media.publisher_editorial_owner"
      ]
    }
  ];

  for (const item of cases) {
    const fixture = RECORA_PERSONA_READY_GOLD_FIXTURES_V3.find(
      (candidate) => candidate.expectedRecipeKey === item.recipeKey
    );
    assert.ok(fixture, item.recipeKey);
    const result = compileReadyRecoraMeasurementPersonasV3(
      requireGenerationInput(fixture)
    );
    assert.equal(result.status, "ready", item.recipeKey);
    for (const blueprintKey of item.blueprintKeys) {
      const excluded = result.excluded.find(
        (candidate) => candidate.blueprintKey === blueprintKey
      );
      assert.ok(excluded, `${item.recipeKey}:${blueprintKey}`);
      assert.ok(
        excluded.reasonCodes.includes("subject_internal"),
        `${item.recipeKey}:${blueprintKey}:subject_internal`
      );
    }
  }
}

function verifyAlternativesPreserveContract() {
  for (const fixture of RECORA_PERSONA_READY_GOLD_FIXTURES_V3) {
    const result = compileReadyRecoraMeasurementPersonasV3(
      requireGenerationInput(fixture)
    );
    assert.equal(result.status, "ready", fixture.caseKey);
    for (const alternative of result.alternatives) {
      assert.ok(
        alternative.replaceableSelectionIndexes.length > 0,
        `${fixture.caseKey}:${alternative.blueprintKey}:replaceable`
      );
      const blueprint = RECORA_PERSONA_BLUEPRINT_CATALOG_V3.find(
        (item) => item.blueprintKey === alternative.blueprintKey
      );
      assert.ok(blueprint, alternative.blueprintKey);

      for (const selectionIndex of alternative.replaceableSelectionIndexes) {
        const coverage = new Set(
          result.selected.flatMap((selection, index) =>
            index === selectionIndex
              ? blueprint.coverageDimensions
              : selection.coverageDimensions
          )
        );
        for (const required of fixture.expectedRequiredCoverage ?? []) {
          assert.ok(
            coverage.has(required),
            `${fixture.caseKey}:${alternative.blueprintKey}:coverage:${required}`
          );
        }

        const marketSides = new Set(
          result.selected.flatMap((selection, index) =>
            index === selectionIndex
              ? [blueprint.marketSide]
              : selection.marketSides
          )
        );
        for (const required of fixture.expectedRequiredMarketSides ?? []) {
          assert.ok(
            marketSides.has(required),
            `${fixture.caseKey}:${alternative.blueprintKey}:side:${required}`
          );
        }
      }
    }
  }
}

'''
replace_once(
    VERIFY,
    'function verifyUpstreamInvariantFailure() {',
    verifier_functions + 'function verifyUpstreamInvariantFailure() {'
)

semantic_doc = '''## 除外理由と代替候補の安全性

除外候補は、単に「選ばれなかった」とするだけでなく、現在の分析対象に対する意味上の理由を保持する。

```text
subject_internal
wrong_customer_scope
wrong_market_side
wrong_business_motion
conditional_side_not_customer
semantic_duplicate
not_required_by_selected_recipe
```

Marketplaceブランドの運営担当者、媒体ブランドの内部編集担当者、消費者向け多拠点ブランドの本部・支店担当者などは、Recipe側の明示規則により`subject_internal`とする。個別Blueprint keyの例外をCompilerへ直接埋め込まず、CatalogとRecipeのデータで適用条件を表現する。

代替候補はCoverageが一つ重なるだけでは提示しない。各選択枠を実際に置換した仮想Persona Setを作り、件数、重複、Topic影響数、必須Coverage、必須市場側を再検証し、全契約を維持できる置換先が一つ以上ある候補だけを返す。

'''
replace_once(
    DOC,
    '## 出力status\n',
    semantic_doc + '## 出力status\n'
)
