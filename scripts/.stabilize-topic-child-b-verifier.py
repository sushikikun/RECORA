from __future__ import annotations

from pathlib import Path

VERIFY = Path("scripts/verify-recora-measurement-topic-compiler.ts")
text = VERIFY.read_text(encoding="utf-8")

start = text.index("function verifyNonReadyFixtures(): void {")
end = text.index("function verifyConstrainedPairwiseMatrix(): void {", start)

replacement = r'''function verifyNonReadyFixtures(): void {
  const { fixture, persona } = readyBase();
  assert.equal(persona.status, "ready");
  if (persona.status !== "ready") return;

  const needsReviewResults = RECORA_TOPIC_NON_READY_GOLD_CASE_KEYS_V3.needsReview.map(
    () => compileFixture(
      fixture,
      fixture.generationInput,
      nonReadyPersona(persona, "needs_review")
    )
  );
  needsReviewResults.forEach((item, index) =>
    assert.equal(
      item.status,
      "needs_review",
      RECORA_TOPIC_NON_READY_GOLD_CASE_KEYS_V3.needsReview[index]
    )
  );

  const gapResults = RECORA_TOPIC_NON_READY_GOLD_CASE_KEYS_V3.catalogGap.map(
    () => compileFixture(
      fixture,
      fixture.generationInput,
      nonReadyPersona(persona, "catalog_gap")
    )
  );
  gapResults.forEach((item, index) =>
    assert.equal(
      item.status,
      "catalog_gap",
      RECORA_TOPIC_NON_READY_GOLD_CASE_KEYS_V3.catalogGap[index]
    )
  );

  const blockedResults: RecoraTopicCompilationV3[] = [];
  executions += 1;
  blockedResults.push(
    compileRecoraMeasurementTopicsV3({
      ...topicInput(fixture.generationInput, persona),
      contractVersion: "unsupported" as typeof RECORA_TOPIC_SELECTION_INPUT_CONTRACT_VERSION
    })
  );
  blockedResults.push(compileFixture(
    fixture,
    {
      ...fixture.generationInput,
      market: { ...fixture.generationInput.market, country: "US" as "JP" }
    },
    persona
  ));
  blockedResults.push(compileFixture(
    fixture,
    {
      ...fixture.generationInput,
      market: { ...fixture.generationInput.market, locale: "en-US" as "ja-JP" }
    },
    persona
  ));
  blockedResults.push(compileFixture(
    fixture,
    fixture.generationInput,
    { ...persona, contractVersion: "unsupported" as typeof persona.contractVersion }
  ));
  blockedResults.push(compileFixture(
    fixture,
    fixture.generationInput,
    { ...persona, catalogVersion: "unsupported" as typeof persona.catalogVersion }
  ));
  blockedResults.push(compileFixture(
    fixture,
    fixture.generationInput,
    { ...persona, compilerVersion: "unsupported" as typeof persona.compilerVersion }
  ));
  blockedResults.push(compileFixture(
    fixture,
    fixture.generationInput,
    nonReadyPersona(persona, "blocked")
  ));
  blockedResults.push(compileFixture(
    fixture,
    fixture.generationInput,
    { ...persona, selected: persona.selected.slice(0, 4) as typeof persona.selected }
  ));
  const duplicatePersona = clonePersona(persona);
  duplicatePersona.selected = [
    duplicatePersona.selected[0],
    duplicatePersona.selected[0],
    ...duplicatePersona.selected.slice(2)
  ] as typeof duplicatePersona.selected;
  blockedResults.push(compileFixture(
    fixture,
    fixture.generationInput,
    duplicatePersona
  ));
  blockedResults.push(compileFixture(
    fixture,
    fixture.generationInput,
    persona,
    { recipes: RECORA_TOPIC_SELECTION_RECIPES_V3.slice(1) }
  ));
  assert.equal(
    blockedResults.length,
    RECORA_TOPIC_NON_READY_GOLD_CASE_KEYS_V3.blocked.length
  );
  blockedResults.forEach((item, index) =>
    assert.equal(
      item.status,
      "blocked",
      `${RECORA_TOPIC_NON_READY_GOLD_CASE_KEYS_V3.blocked[index]}:${JSON.stringify(item)}`
    )
  );
}

function verifyIndependentBoundaries(): void {
  const { fixture, persona, result } = readyBase();
  assert.equal(result.status, "ready");
  if (result.status !== "ready" || persona.status !== "ready") return;

  const t3 = RECORA_TOPIC_BLUEPRINT_CATALOG_V3.find(
    (item) => item.blueprintKey === "common.use_case_fit"
  );
  assert.ok(t3);
  assert.equal(t3.primaryCoverage, "T3");
  assert.ok(t3.coverageDimensions.includes("T3"));

  assert.equal(
    new Set(result.selected.map((topic) => topic.selectionSemanticKey)).size,
    6
  );
  assert.equal(
    validateRecoraTopicSelectionRecipesV3().valid,
    true
  );

  const noAlternativeRecipes = replaceRecipe(
    fixture.expectedRecipeKey,
    (recipe) => ({
      ...recipe,
      slots: recipe.slots.map((slot) => ({
        ...slot,
        alternativeChoices: []
      })) as unknown as RecoraTopicSelectionRecipeV3["slots"]
    })
  );
  const emptyAlternativeReady = compileFixture(
    fixture,
    fixture.generationInput,
    persona,
    { recipes: noAlternativeRecipes }
  );
  assert.equal(emptyAlternativeReady.status, "ready");
  if (emptyAlternativeReady.status === "ready") {
    assert.deepEqual(emptyAlternativeReady.alternatives, []);
  }

  assert.ok(
    result.personaTopicEdges.every((edge) => edge.matchedBlueprintKeys.length > 0)
  );

  const enterpriseFixture = RECORA_TOPIC_READY_GOLD_FIXTURES_V3.find(
    (item) => item.expectedRecipeKey === "enterprise_it_security"
  );
  assert.ok(enterpriseFixture);
  const enterprisePersona = compilePersona(enterpriseFixture.generationInput);
  const enterpriseResult = compileFixture(
    enterpriseFixture,
    enterpriseFixture.generationInput,
    enterprisePersona
  );
  assert.equal(enterpriseResult.status, "ready");
  if (enterpriseResult.status === "ready") {
    const mixed = enterpriseResult.selected.find(
      (topic) => new Set(topic.laneBindings.map((lane) => lane.laneKey)).size > 1
    );
    assert.ok(mixed);
    assert.ok(
      mixed!.laneBindings.every((lane) => lane.promptSubjectLabelKey.length > 0)
    );
    assert.deepEqual(
      enterpriseResult.observationOverlays[0].excludedLaneKeys,
      ["forced_citation_validation"]
    );
    assert.ok(
      enterpriseResult.observationOverlays[0].targets.every(
        (target) => !target.includedLaneKeys.includes("forced_citation_validation")
      )
    );
  }

  const personaChanged = clonePersona(persona);
  const first = personaChanged.selected[0];
  personaChanged.selected = [
    { ...first, selectionSemanticKey: `${first.selectionSemanticKey}:changed` },
    ...personaChanged.selected.slice(1)
  ] as typeof personaChanged.selected;
  const changed = compileFixture(fixture, fixture.generationInput, personaChanged);
  assert.equal(changed.status, "ready");
  if (changed.status === "ready") {
    assert.notEqual(
      changed.selectionIdentity.fingerprint,
      result.selectionIdentity.fingerprint
    );
  }

  const displayChanged = clonePersona(persona);
  displayChanged.selected = displayChanged.selected.map((item) => ({
    ...item,
    displayName: `${item.displayName}x`,
    description: `${item.description}x`
  })) as typeof displayChanged.selected;
  const displayResult = compileFixture(
    fixture,
    fixture.generationInput,
    displayChanged
  );
  assert.equal(displayResult.status, "ready");
  if (displayResult.status === "ready") {
    assert.equal(
      displayResult.selectionIdentity.fingerprint,
      result.selectionIdentity.fingerprint
    );
  }

  assert.equal(
    canonicalizeTopicSelectionJsonV3({ b: 2, a: 1 }),
    canonicalizeTopicSelectionJsonV3({ a: 1, b: 2 })
  );

  const perPersona = new Map<string, number>();
  result.personaTopicEdges.forEach((edge) =>
    perPersona.set(edge.personaId, (perPersona.get(edge.personaId) ?? 0) + 1)
  );
  assert.equal(perPersona.size, 5);
  assert.ok([...perPersona.values()].every((count) => count >= 2));
  executions += 12;
}

'''

VERIFY.write_text(text[:start] + replacement + text[end:], encoding="utf-8", newline="\n")
print("Topic Compiler verifier failure fixtures stabilized")
