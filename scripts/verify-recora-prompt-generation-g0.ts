import assert from "node:assert/strict";

import {
  RECORA_ACTOR_RELATIONS,
  RECORA_AUDIENCE_PRIORITIES,
  RECORA_AUDIENCE_SCOPES,
  RECORA_BUSINESS_DOMAINS,
  RECORA_COMMERCE_CHANNELS,
  RECORA_COMMERCE_ROLES,
  RECORA_CUSTOMER_ACTIONS,
  RECORA_DECISION_IMPACT_FLAGS,
  RECORA_DELIVERY_MODES,
  RECORA_GENERATION_CUSTOMER_SIDES,
  RECORA_GENERATION_STRUCTURE_SIGNALS,
  RECORA_GEOGRAPHIC_BINDINGS,
  RECORA_LIFECYCLE_SIGNALS,
  RECORA_LOCATION_STRUCTURES,
  RECORA_OFFERING_MODELS,
  RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
  RECORA_PROMPT_GENERATION_LOCALE,
  RECORA_REGULATORY_FLAGS,
  RECORA_SENSITIVE_CONTEXTS,
  RECORA_SERVICE_COVERAGES,
  RECORA_SUBJECT_TYPES,
  type RecoraPromptGenerationDraftInputV1
} from "../lib/recora/prompt-generation-input";
import {
  adaptProjectSetupSeedInputToPromptGenerationInput,
  deriveRecoraTrustProfileV1,
  normalizeRecoraPromptGenerationInput
} from "../lib/recora/prompt-generation-input-normalizer";
import {
  RECORA_PROMPT_GENERATION_PROFILE_SIZES,
  deriveRecoraPromptProfileMembership,
  isNestedRecoraPromptMembership,
  selectRecoraPromptGenerationProfile
} from "../lib/recora/prompt-generation-profiles";
import {
  RECORA_G0_BLOCKED_FIXTURES,
  RECORA_G0_LEGACY_SEED_FIXTURES,
  RECORA_G0_NEEDS_REVIEW_FIXTURES,
  RECORA_G0_PROFILE_FIXTURES,
  RECORA_G0_READY_FIXTURES
} from "./fixtures/recora-prompt-generation-g0-fixtures";

const enumCollections = [
  RECORA_SUBJECT_TYPES,
  RECORA_AUDIENCE_SCOPES,
  RECORA_AUDIENCE_PRIORITIES,
  RECORA_BUSINESS_DOMAINS,
  RECORA_OFFERING_MODELS,
  RECORA_COMMERCE_CHANNELS,
  RECORA_COMMERCE_ROLES,
  RECORA_CUSTOMER_ACTIONS,
  RECORA_DELIVERY_MODES,
  RECORA_SERVICE_COVERAGES,
  RECORA_LOCATION_STRUCTURES,
  RECORA_GEOGRAPHIC_BINDINGS,
  RECORA_DECISION_IMPACT_FLAGS,
  RECORA_REGULATORY_FLAGS,
  RECORA_SENSITIVE_CONTEXTS,
  RECORA_GENERATION_STRUCTURE_SIGNALS,
  RECORA_GENERATION_CUSTOMER_SIDES,
  RECORA_ACTOR_RELATIONS,
  RECORA_LIFECYCLE_SIGNALS
] as const;

for (const values of enumCollections) {
  assert.ok(values.length > 0);
  assert.equal(new Set(values).size, values.length);
}

assert.equal(
  RECORA_PROMPT_GENERATION_INPUT_CONTRACT_VERSION,
  "recora_prompt_generation_input_v1"
);
assert.equal(RECORA_PROMPT_GENERATION_LOCALE, "ja-JP");
assert.deepEqual(RECORA_PROMPT_GENERATION_PROFILE_SIZES, [50, 100, 200]);

for (const fixture of RECORA_G0_READY_FIXTURES) {
  const result = normalizeRecoraPromptGenerationInput(fixture.input);
  assert.equal(result.status, "ready", fixture.caseKey);
  assert.ok(result.value, fixture.caseKey);
  assert.equal(result.blockers.length, 0, fixture.caseKey);
  assert.equal(result.reviewQuestions.length, 0, fixture.caseKey);
  assert.equal(result.value.market.country, "JP", fixture.caseKey);
  assert.equal(result.value.market.locale, "ja-JP", fixture.caseKey);
  assert.equal(
    result.value.trust.derived.derivedClass,
    fixture.expectedTrustClass,
    fixture.caseKey
  );
  assert.match(
    result.value.generationIdentity.fingerprint,
    /^[0-9a-f]{64}$/,
    fixture.caseKey
  );

  for (const signal of fixture.expectedStructureSignals) {
    assert.ok(
      result.value.generationContext.structureSignals.includes(signal as never),
      `${fixture.caseKey}: expected structure signal ${signal}`
    );
  }

  for (const signal of fixture.unexpectedStructureSignals ?? []) {
    assert.equal(
      result.value.generationContext.structureSignals.includes(signal as never),
      false,
      `${fixture.caseKey}: unexpected structure signal ${signal}`
    );
  }

  const repeated = normalizeRecoraPromptGenerationInput(fixture.input);
  assert.deepEqual(repeated, result, `${fixture.caseKey}: repeated execution`);

  const permuted = normalizeRecoraPromptGenerationInput(
    permuteOrderAndDuplicate(fixture.input)
  );
  assert.equal(permuted.status, "ready", `${fixture.caseKey}: permutation`);
  assert.ok(permuted.value, `${fixture.caseKey}: permutation value`);
  assert.equal(
    permuted.value.generationIdentity.fingerprint,
    result.value.generationIdentity.fingerprint,
    `${fixture.caseKey}: fingerprint must be order invariant`
  );
  assert.deepEqual(
    permuted.value,
    result.value,
    `${fixture.caseKey}: normalized value must be order invariant`
  );
}

for (const fixture of RECORA_G0_NEEDS_REVIEW_FIXTURES) {
  const result = normalizeRecoraPromptGenerationInput(fixture.input);
  assert.equal(result.status, "needs_review", fixture.caseKey);
  assert.equal(result.value, null, fixture.caseKey);
  assert.equal(result.blockers.length, 0, fixture.caseKey);
  const codes = result.reviewQuestions.map((item) => item.code);
  for (const code of fixture.expectedReviewCodes) {
    assert.ok(codes.includes(code), `${fixture.caseKey}: missing ${code}`);
  }
  for (const question of result.reviewQuestions) {
    assert.notEqual(question.message, question.code, fixture.caseKey);
    assert.ok(question.allowedAnswers.length > 0, fixture.caseKey);
  }
}

for (const fixture of RECORA_G0_BLOCKED_FIXTURES) {
  const result = normalizeRecoraPromptGenerationInput(fixture.input);
  assert.equal(result.status, "blocked", fixture.caseKey);
  assert.equal(result.value, null, fixture.caseKey);
  for (const code of fixture.expectedBlockerCodes) {
    assert.ok(
      result.blockers.includes(code),
      `${fixture.caseKey}: missing blocker ${code}`
    );
  }
}

for (const fixture of RECORA_G0_PROFILE_FIXTURES) {
  const result = selectRecoraPromptGenerationProfile(fixture.questionLimit);
  assert.equal(result.status, fixture.expectedStatus);
  if (fixture.expectedStatus === "ready") {
    assert.ok(result.value);
    assert.equal(result.value.targetTotal, fixture.expectedTotal);
    assert.equal(
      result.value.coreCount +
        result.value.robustnessCount +
        result.value.diagnosticCount,
      fixture.expectedTotal
    );
  } else {
    assert.equal(result.value, null);
    assert.ok(result.blockers.includes("unsupported_question_limit"));
  }
}

assert.deepEqual(deriveRecoraPromptProfileMembership(50), [50, 100, 200]);
assert.deepEqual(deriveRecoraPromptProfileMembership(100), [100, 200]);
assert.deepEqual(deriveRecoraPromptProfileMembership(200), [200]);
assert.equal(
  isNestedRecoraPromptMembership({
    minimumProfileSize: 50,
    memberships: [200, 50, 100, 100]
  }),
  true
);
assert.equal(
  isNestedRecoraPromptMembership({
    minimumProfileSize: 100,
    memberships: [100]
  }),
  false
);

const standardTrust = deriveRecoraTrustProfileV1({
  decisionImpactFlags: [],
  regulatoryFlags: [],
  sensitiveContexts: []
});
assert.equal(standardTrust.decisionImpactLevel, "standard");
assert.equal(standardTrust.derivedClass, "standard");

const regulatedTrust = deriveRecoraTrustProfileV1({
  decisionImpactFlags: ["safety_or_health"],
  regulatoryFlags: ["regulated_service"],
  sensitiveContexts: ["health"]
});
assert.equal(regulatedTrust.decisionImpactLevel, "critical");
assert.equal(regulatedTrust.derivedClass, "regulated");

for (const fixture of RECORA_G0_LEGACY_SEED_FIXTURES) {
  const result = adaptProjectSetupSeedInputToPromptGenerationInput(fixture.seed);
  assert.equal(result.status, fixture.expectedStatus, fixture.caseKey);
  assert.equal(result.value, null, fixture.caseKey);
  assert.ok(
    result.warnings.includes(
      "legacy_known_competitors_are_ignored_for_classification"
    )
  );
  assert.ok(
    result.reviewQuestions.some(
      (question) => question.code === "legacy_primary_action_required"
    )
  );
}

verifyGenerationIdentityMeaning();
verifyActorRelationKeyNormalization();

console.log(
  JSON.stringify(
    {
      status: "PASS",
      readyFixtures: RECORA_G0_READY_FIXTURES.length,
      needsReviewFixtures: RECORA_G0_NEEDS_REVIEW_FIXTURES.length,
      blockedFixtures: RECORA_G0_BLOCKED_FIXTURES.length,
      profileFixtures: RECORA_G0_PROFILE_FIXTURES.length,
      legacyFixtures: RECORA_G0_LEGACY_SEED_FIXTURES.length
    },
    null,
    2
  )
);

function verifyGenerationIdentityMeaning() {
  const source = RECORA_G0_READY_FIXTURES[0].input;
  const baseline = normalizeRecoraPromptGenerationInput(source);
  assert.equal(baseline.status, "ready");
  assert.ok(baseline.value);

  const focusChanged = normalizeRecoraPromptGenerationInput(
    setGenerationContext(source, { focusThemes: ["導入負荷"] })
  );
  assert.equal(focusChanged.status, "ready");
  assert.ok(focusChanged.value);
  assert.notEqual(
    focusChanged.value.generationIdentity.fingerprint,
    baseline.value.generationIdentity.fingerprint,
    "focus theme values must affect generation identity"
  );

  const goalChanged = normalizeRecoraPromptGenerationInput(
    setGenerationContext(source, { diagnosisGoals: ["リスク確認"] })
  );
  assert.equal(goalChanged.status, "ready");
  assert.ok(goalChanged.value);
  assert.notEqual(
    goalChanged.value.generationIdentity.fingerprint,
    baseline.value.generationIdentity.fingerprint,
    "diagnosis goal values must affect generation identity"
  );
}

function verifyActorRelationKeyNormalization() {
  const source = RECORA_G0_READY_FIXTURES[0].input;
  const humanReadable = normalizeRecoraPromptGenerationInput(
    setGenerationContext(source, {
      actorRelations: [
        {
          leftRoleKey: "Decision Owner",
          rightRoleKey: "Payer-Role",
          relation: "same_actor"
        }
      ]
    })
  );
  const canonical = normalizeRecoraPromptGenerationInput(
    setGenerationContext(source, {
      actorRelations: [
        {
          leftRoleKey: "decision_owner",
          rightRoleKey: "payer_role",
          relation: "same_actor"
        }
      ]
    })
  );

  assert.equal(humanReadable.status, "ready");
  assert.equal(canonical.status, "ready");
  assert.ok(humanReadable.value);
  assert.ok(canonical.value);
  assert.deepEqual(
    humanReadable.value.generationContext.actorRelations,
    canonical.value.generationContext.actorRelations
  );
  assert.equal(
    humanReadable.value.generationIdentity.fingerprint,
    canonical.value.generationIdentity.fingerprint
  );
}

function setGenerationContext(
  input: RecoraPromptGenerationDraftInputV1,
  change: NonNullable<RecoraPromptGenerationDraftInputV1["generationContext"]>
): RecoraPromptGenerationDraftInputV1 {
  return {
    ...input,
    generationContext: {
      ...input.generationContext,
      ...change
    }
  };
}

function permuteOrderAndDuplicate(
  input: RecoraPromptGenerationDraftInputV1
): RecoraPromptGenerationDraftInputV1 {
  const clone = JSON.parse(
    JSON.stringify(input)
  ) as RecoraPromptGenerationDraftInputV1;

  return {
    ...clone,
    subject: clone.subject
      ? {
          ...clone.subject,
          primary: clone.subject.primary
            ? {
                ...clone.subject.primary,
                aliases: reverseAndDuplicate(clone.subject.primary.aliases)
              }
            : undefined,
          secondary: reverseAndDuplicate(clone.subject.secondary)
        }
      : undefined,
    business: clone.business
      ? {
          ...clone.business,
          secondaryDomains: reverseAndDuplicate(
            clone.business.secondaryDomains
          ),
          secondaryOfferingModels: reverseAndDuplicate(
            clone.business.secondaryOfferingModels
          ),
          commerceChannels: reverseAndDuplicate(
            clone.business.commerceChannels
          ),
          commerceRoles: reverseAndDuplicate(clone.business.commerceRoles)
        }
      : undefined,
    actions: clone.actions
      ? {
          ...clone.actions,
          secondary: reverseAndDuplicate(clone.actions.secondary)
        }
      : undefined,
    delivery: clone.delivery
      ? {
          ...clone.delivery,
          serviceAreas: reverseAndDuplicate(clone.delivery.serviceAreas),
          locations: reverseAndDuplicate(clone.delivery.locations)
        }
      : undefined,
    trust: clone.trust
      ? {
          ...clone.trust,
          decisionImpactFlags: reverseAndDuplicate(
            clone.trust.decisionImpactFlags
          ),
          regulatoryFlags: reverseAndDuplicate(clone.trust.regulatoryFlags),
          sensitiveContexts: reverseAndDuplicate(clone.trust.sensitiveContexts)
        }
      : undefined,
    generationContext: clone.generationContext
      ? {
          ...clone.generationContext,
          structureSignals: reverseAndDuplicate(
            clone.generationContext.structureSignals
          ),
          customerSides: reverseAndDuplicate(
            clone.generationContext.customerSides
          ),
          actorRelations: reverseAndDuplicate(
            clone.generationContext.actorRelations
          ),
          lifecycleSignals: reverseAndDuplicate(
            clone.generationContext.lifecycleSignals
          ),
          focusThemes: reverseAndDuplicate(
            clone.generationContext.focusThemes
          ),
          diagnosisGoals: reverseAndDuplicate(
            clone.generationContext.diagnosisGoals
          )
        }
      : undefined
  };
}

function reverseAndDuplicate<T>(
  values: readonly T[] | undefined
): readonly T[] {
  if (!values || values.length === 0) return [];
  return [...values].reverse().concat(values[0]);
}
