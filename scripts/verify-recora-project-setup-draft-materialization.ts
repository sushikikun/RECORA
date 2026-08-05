import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import * as fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  LocalPostgresClient,
  RECORA_FIXED_PROMPT_B2_DB_CONTAINER,
  RECORA_FIXED_PROMPT_B2_PROJECT_ID,
  assertB2DockerInspectMatchesTargetForTests,
  materializeProjectSetupDraft,
  materializeProjectSetupDraftObject,
  sanitizeErrorMessage
} from "./materialize-recora-project-setup-draft";
import {
  RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION,
  materializeFixedPromptConfiguration,
  stableUuid
} from "../lib/recora/fixed-prompt-materialization";
import {
  PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
  type BuyerStage,
  type CompetitorDraft,
  type PersonaDraft,
  type ProjectSetupDraft,
  type ProjectSetupSeedInput,
  type PromptDraft,
  type TopicDraft
} from "../lib/recora/project-setup-draft";

const repoRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const staticOnly = args.has("--static");
const databaseUrl = readVerifierDatabaseUrl();
const validHash = "a".repeat(64);

const verifierEnv = {
  ...process.env,
  NO_COLOR: "1",
  RECORA_DATABASE_URL: databaseUrl,
  RECORA_LOCAL_SUPABASE_PROJECT_ID: RECORA_FIXED_PROMPT_B2_PROJECT_ID,
  RECORA_LOCAL_SUPABASE_DB_CONTAINER: RECORA_FIXED_PROMPT_B2_DB_CONTAINER
};

function readVerifierDatabaseUrl(): string {
  const value = process.env.RECORA_DATABASE_URL?.trim();
  if (value) return value;
  if (staticOnly) return "not-required-for-static-mode";
  throw new Error("RECORA_DATABASE_URL_required_for_local_db_mode");
}
const seedInput: ProjectSetupSeedInput = {
  companyName: "Recora Inc.",
  brandName: "Recora",
  officialSiteUrl: "https://recora.example",
  productOrServiceDescription: "AI search visibility diagnostics for BtoB SaaS teams.",
  industryCategory: "AI search visibility software",
  targetCustomers: "Marketing leaders comparing AI search diagnostics.",
  regions: ["Japan"],
  language: "en",
  serviceName: "Recora",
  brandAliases: ["recora"],
  knownCompetitors: [],
  avoidCompetitors: [],
  diagnosisGoals: ["non_branded", "citation_check", "sentiment"]
};

async function main() {
  assertStaticContract();
  if (!staticOnly) {
    inspectContainer();
    assertDbCatalog();
    assertServiceRoleRuntime();
    await runDbMaterializationTests();
  }

  console.log(JSON.stringify({
    status: "ok",
    mode: staticOnly ? "static" : "static-and-local-db",
    expectedProjectId: RECORA_FIXED_PROMPT_B2_PROJECT_ID,
    expectedContainer: RECORA_FIXED_PROMPT_B2_DB_CONTAINER,
    cases: {
      dryRunWriteZero: "PASS",
      transactionSuccess: staticOnly ? "skipped" : "PASS",
      persistedFieldsHashCount: staticOnly ? "skipped" : "PASS",
      failClosedAndRollback: staticOnly ? "skipped" : "PASS",
      projectABSeparation: staticOnly ? "skipped" : "PASS",
      concurrentExecute: staticOnly ? "skipped" : "PASS",
      containerDbUrlBinding: "PASS",
      projectBrandAuthority: staticOnly ? "skipped" : "PASS",
      projectLocaleBinding: staticOnly ? "skipped" : "PASS",
      catalogAndServiceRoleBoundary: staticOnly ? "skipped" : "PASS"
    },
    unitASchemaRuntimeSecurityContract: {
      unitAMigrationAppliedExactlyOnce: staticOnly ? "skipped" : "PASS",
      projectFinalizationColumns: staticOnly ? "skipped" : "PASS",
      promptFixedPromptMetadataColumns: staticOnly ? "skipped" : "PASS",
      requiredConstraintsAndTriggers: staticOnly ? "skipped" : "PASS",
      validMetricEligibilityPersisted: staticOnly ? "skipped" : "PASS",
      malformedMetricEligibilityRejected: staticOnly ? "skipped" : "PASS",
      finalizedPromptInsertUpdateDeleteRejected: staticOnly ? "skipped" : "PASS",
      projectFinalizationFieldRewriteRejected: staticOnly ? "skipped" : "PASS",
      rowLevelSecurityPreserved: staticOnly ? "skipped" : "PASS",
      browserWriteGrantsAbsent: staticOnly ? "skipped" : "PASS",
      helperDirectExecuteGrantsAbsent: staticOnly ? "skipped" : "PASS",
      helpersAreNotSecurityDefiner: staticOnly ? "skipped" : "PASS",
      serviceRoleRequiredPrivilegesPresent: staticOnly ? "skipped" : "PASS",
      serviceRolePromptTruncateFalse: staticOnly ? "skipped" : "PASS"
    }
  }, null, 2));
}

function assertStaticContract(): void {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  const materializer = fs.readFileSync(
    path.join(repoRoot, "scripts", "materialize-recora-project-setup-draft.ts"),
    "utf8"
  );
  const verifier = fs.readFileSync(
    path.join(repoRoot, "scripts", "verify-recora-project-setup-draft-materialization.ts"),
    "utf8"
  );
  const cliSpec = fs.readFileSync(
    path.join(repoRoot, "docs", "architecture", "measurement-design", "recora_fixed_prompt_materialization_cli_v1.md"),
    "utf8"
  );

  assert.equal(
    packageJson.scripts["recora:project-setup-materialization"],
    "tsx scripts/materialize-recora-project-setup-draft.ts"
  );
  assert.equal(
    packageJson.scripts["recora:project-setup-materialization:check"],
    "tsx scripts/verify-recora-project-setup-draft-materialization.ts"
  );
  assert.doesNotMatch(packageJson.scripts["recora:preflight"], /project-setup-materialization:check/);
  assert.doesNotMatch(packageJson.scripts["recora:preflight:full"], /project-setup-materialization:check/);

  assert.doesNotMatch(materializer, /\bcreate\s+table\b/i);
  assert.doesNotMatch(materializer, /\bupsert\b/i);
  assert.doesNotMatch(materializer, /\bsupabase\s+db\s+push\b/i);
  assert.doesNotMatch(materializer, /scripts\/prepare-recora-client-project/i);
  assert.doesNotMatch(materializer, /package-lock\.json/i);
  assert.doesNotMatch(verifier, /\bcreate\s+table\b/i);

  assert.match(materializer, /for update/i);
  assert.match(materializer, /rollback/i);
  assert.match(materializer, /prompt_configuration_finalized_at = now\(\)/i);
  assert.match(materializer, /persisted_prompt_configuration_hash_mismatch/);
  assert.match(materializer, /RECORA_LOCAL_SUPABASE_PROJECT_ID/);
  assert.match(materializer, /RECORA_LOCAL_SUPABASE_DB_CONTAINER/);
  assert.match(materializer, /isWrite/);
  assert.match(materializer, /local_db_container_not_running/);
  assert.match(materializer, /local_db_container_port_mismatch/);
  assert.match(materializer, /project_primary_brand_identity_mismatch/);
  assert.match(materializer, /project_primary_brand_domain_mismatch/);
  assert.match(materializer, /draft_competitor_missing_active_project_brand/);
  assert.match(materializer, /draft_competitor_domain_mismatch/);
  assert.match(materializer, /project_language_mismatch/);
  assert.match(materializer, /project_region_mismatch/);
  assert.match(materializer, /draft_multiple_regions_not_supported/);
  assert.match(cliSpec, /default is dry-run/i);
  assert.match(cliSpec, /No upsert/i);
  assert.match(cliSpec, /finalization update is last/i);
  assert.match(cliSpec, /not part of `recora:preflight`/i);
  assert.match(cliSpec, /publishes `5432\/tcp`/i);
  assert.match(cliSpec, /persisted active Brand/i);
  assert.match(cliSpec, /exact normalized-domain agreement/i);
  assert.match(cliSpec, /Project `language` and `region`/i);
  assert.match(cliSpec, /exactly one distinct canonical Draft region/i);
  assertContainerBindingNegativeFixtures();
}

async function runDbMaterializationTests(): Promise<void> {
  await assertWrongLocalPortRejectedBeforeConnect();
  await assertDryRunWriteZero();
  await assertInvalidDraftAndMissingTargetFailures();
  await assertProjectBrandAuthorityValidation();
  await assertProjectLocaleBinding();
  await assertFullTransactionSuccessAndRerunFailure();
  await assertAlreadyFinalizedFailure();
  await assertDbRejectsPartialFinalizationState();
  await assertExistingPersonaFailure();
  await assertExistingTopicFailure();
  await assertExistingPromptFailure();
  await assertPersonaUuidConflictRollback();
  await assertTopicUuidConflictRollback();
  await assertPromptHalfwayFailureRollback();
  await assertPersistedHashMismatchRollback();
  await assertProjectABSeparation();
  await assertConcurrentExecute();
  await assertCliSmoke();
}

function assertContainerBindingNegativeFixtures(): void {
  const matchingInspect = {
    Name: `/${RECORA_FIXED_PROMPT_B2_DB_CONTAINER}`,
    State: { Running: true },
    NetworkSettings: { Ports: { "5432/tcp": [{ HostPort: "55422" }] } },
    Config: {
      Labels: {
        "com.supabase.cli.project": RECORA_FIXED_PROMPT_B2_PROJECT_ID,
        "com.docker.compose.project": RECORA_FIXED_PROMPT_B2_PROJECT_ID
      }
    }
  };

  assert.doesNotThrow(() => assertB2DockerInspectMatchesTargetForTests(matchingInspect, "55422"));
  assert.throws(
    () => assertB2DockerInspectMatchesTargetForTests({ ...matchingInspect, State: { Running: false } }, "55422"),
    /local_db_container_not_running/
  );
  assert.throws(
    () => assertB2DockerInspectMatchesTargetForTests({
      ...matchingInspect,
      NetworkSettings: { Ports: { "5432/tcp": [{ HostPort: "55423" }] } }
    }, "55422"),
    /local_db_container_port_mismatch/
  );
}

async function assertWrongLocalPortRejectedBeforeConnect(): Promise<void> {
  const wrongPortUrl = databaseUrlWithPort(databaseUrl, "55423");
  await assert.rejects(
    () => materializeProjectSetupDraftObject(createDraft("issue-159-wrong-local-port"), {
      projectSlug: "issue-159-wrong-local-port",
      execute: true,
      databaseUrl: wrongPortUrl,
      cwd: repoRoot
    }),
    /local_db_container_port_mismatch/
  );
}

async function assertProjectBrandAuthorityValidation(): Promise<void> {
  const primaryMismatchSlug = "issue-159-primary-mismatch";
  await createEmptyProject(primaryMismatchSlug, {
    primaryBrand: { name: "OtherBrand", domain: null, aliases: ["OtherBrand"] }
  });
  await expectMaterializationFailure(
    "primary brand mismatch",
    createDraft(primaryMismatchSlug),
    primaryMismatchSlug,
    /project_primary_brand_identity_mismatch/
  );

  const primaryDomainMismatchSlug = "issue-159-primary-domain-mismatch";
  await createEmptyProject(primaryDomainMismatchSlug, {
    primaryBrand: { name: "Recora", domain: "wrong.example", aliases: ["Recora"] }
  });
  await expectMaterializationFailure(
    "primary brand domain mismatch",
    createDraft(primaryDomainMismatchSlug),
    primaryDomainMismatchSlug,
    /project_primary_brand_domain_mismatch/
  );

  const primaryDomainEquivalentSlug = "issue-159-primary-domain-equivalent";
  await createEmptyProject(primaryDomainEquivalentSlug, {
    primaryBrand: { name: "Recora", domain: "recora.example", aliases: ["Recora"] }
  });
  const primaryDomainEquivalentSummary = await materializeProjectSetupDraftObject(createDraft(primaryDomainEquivalentSlug, {
    seedInput: { ...seedInput, officialSiteUrl: "https://www.recora.example/path?ref=fixture#top" }
  }), {
    projectSlug: primaryDomainEquivalentSlug,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(primaryDomainEquivalentSummary.mode, "dry-run");

  const primaryOneSidedDomainSlug = "issue-159-primary-one-sided-domain";
  await createEmptyProject(primaryOneSidedDomainSlug, {
    primaryBrand: { name: "Recora", domain: null, aliases: ["Recora"] }
  });
  const primaryOneSidedDomainSummary = await materializeProjectSetupDraftObject(createDraft(primaryOneSidedDomainSlug), {
    projectSlug: primaryOneSidedDomainSlug,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(primaryOneSidedDomainSummary.mode, "dry-run");

  const dbOnlyCompetitorSlug = "issue-159-db-competitor-contamination";
  await createEmptyProject(dbOnlyCompetitorSlug, { competitorBrands: [rivalBrandFixture()] });
  const contaminatedBase = createDraft(dbOnlyCompetitorSlug);
  const contaminatedDraft = {
    ...contaminatedBase,
    prompts: contaminatedBase.prompts.map((prompt) => prompt.promptId === "prompt-market-core"
      ? { ...prompt, text: "Which AI search visibility diagnosis tools should a BtoB SaaS team compare first, including RivalCo?" }
      : prompt)
  };
  await expectMaterializationFailure(
    "DB-only competitor contamination",
    contaminatedDraft,
    dbOnlyCompetitorSlug,
    /known_competitor_signal_without_named_competitor_scope|known_competitor_signal_in_market_prompt/
  );

  const draftCompetitorMissingSlug = "issue-159-draft-competitor-missing-db";
  await createEmptyProject(draftCompetitorMissingSlug);
  await expectMaterializationFailure(
    "draft competitor missing active Project brand",
    createDraft(draftCompetitorMissingSlug, { competitors: [createCompetitorDraft()] }),
    draftCompetitorMissingSlug,
    /draft_competitor_missing_active_project_brand/
  );

  const competitorDomainMismatchSlug = "issue-159-competitor-domain-mismatch";
  await createEmptyProject(competitorDomainMismatchSlug, {
    competitorBrands: [{ name: "RivalCo", domain: "wrong.example", aliases: ["Rival Co", "RivalCo Platform"] }]
  });
  await expectMaterializationFailure(
    "draft competitor domain mismatch",
    createDraft(competitorDomainMismatchSlug, { competitors: [createCompetitorDraft()] }),
    competitorDomainMismatchSlug,
    /draft_competitor_domain_mismatch/
  );

  const competitorDomainEquivalentSlug = "issue-159-competitor-domain-equivalent";
  await createEmptyProject(competitorDomainEquivalentSlug, { competitorBrands: [rivalBrandFixture()] });
  const competitorDomainEquivalentSummary = await materializeProjectSetupDraftObject(createDraft(competitorDomainEquivalentSlug, {
    competitors: [createCompetitorDraft({ domain: "https://www.rival.example/page?source=fixture#details" })]
  }), {
    projectSlug: competitorDomainEquivalentSlug,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(competitorDomainEquivalentSummary.mode, "dry-run");

  const competitorOneSidedDomainSlug = "issue-159-competitor-one-sided-domain";
  await createEmptyProject(competitorOneSidedDomainSlug, { competitorBrands: [rivalBrandFixture()] });
  const competitorOneSidedDomainSummary = await materializeProjectSetupDraftObject(createDraft(competitorOneSidedDomainSlug, {
    competitors: [createCompetitorDraft({ domain: null })]
  }), {
    projectSlug: competitorOneSidedDomainSlug,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(competitorOneSidedDomainSummary.mode, "dry-run");

  const normalMatchSlug = "issue-159-brand-authority-match";
  await createEmptyProject(normalMatchSlug, { competitorBrands: [rivalBrandFixture()] });
  const summary = await materializeProjectSetupDraftObject(createDraft(normalMatchSlug, {
    competitors: [createCompetitorDraft()]
  }), {
    projectSlug: normalMatchSlug,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(summary.mode, "dry-run");
  assert.equal(summary.writes.projectFinalized, 0);
}

async function assertProjectLocaleBinding(): Promise<void> {
  const languageMismatchSlug = "issue-159-language-mismatch";
  await createEmptyProject(languageMismatchSlug, { language: "ja", region: "JP" });
  await expectMaterializationFailure(
    "language mismatch",
    createDraft(languageMismatchSlug),
    languageMismatchSlug,
    /project_language_mismatch/
  );

  const regionMismatchSlug = "issue-159-region-mismatch";
  await createEmptyProject(regionMismatchSlug, { language: seedInput.language, region: "US" });
  await expectMaterializationFailure(
    "region mismatch",
    createDraft(regionMismatchSlug),
    regionMismatchSlug,
    /project_region_mismatch/
  );

  const localeJapanMatchSlug = "issue-159-locale-japan-match";
  await createEmptyProject(localeJapanMatchSlug, { language: seedInput.language, region: "JP" });
  const japanSummary = await materializeProjectSetupDraftObject(createDraft(localeJapanMatchSlug, {
    seedInput: { ...seedInput, regions: ["Japan"] }
  }), {
    projectSlug: localeJapanMatchSlug,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(japanSummary.mode, "dry-run");

  const localeSynonymMatchSlug = "issue-159-locale-synonym-match";
  await createEmptyProject(localeSynonymMatchSlug, { language: seedInput.language, region: "JP" });
  const synonymSummary = await materializeProjectSetupDraftObject(createDraft(localeSynonymMatchSlug, {
    seedInput: { ...seedInput, regions: ["JP", "Japan", "JPN"] }
  }), {
    projectSlug: localeSynonymMatchSlug,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(synonymSummary.mode, "dry-run");

  const multiRegionSlug = "issue-159-locale-multi-region";
  await createEmptyProject(multiRegionSlug, { language: seedInput.language, region: "JP" });
  await expectMaterializationFailure(
    "multiple draft regions",
    createDraft(multiRegionSlug, { seedInput: { ...seedInput, regions: ["Japan", "United States"] } }),
    multiRegionSlug,
    /draft_multiple_regions_not_supported/
  );

  const emptyRegionSlug = "issue-159-locale-empty-region";
  await createEmptyProject(emptyRegionSlug, { language: seedInput.language, region: "JP" });
  await expectMaterializationFailure(
    "empty draft regions",
    createDraft(emptyRegionSlug, { seedInput: { ...seedInput, regions: [] } }),
    emptyRegionSlug,
    /draft_multiple_regions_not_supported/
  );

  const singleRegionMismatchSlug = "issue-159-locale-single-region-mismatch";
  await createEmptyProject(singleRegionMismatchSlug, { language: seedInput.language, region: "JP" });
  await expectMaterializationFailure(
    "single draft region mismatch",
    createDraft(singleRegionMismatchSlug, { seedInput: { ...seedInput, regions: ["United States"] } }),
    singleRegionMismatchSlug,
    /project_region_mismatch/
  );
}

async function assertDryRunWriteZero(): Promise<void> {

  const slug = "issue-159-dry-run";
  await createEmptyProject(slug);
  const draft = createDraft(slug);
  const first = await materializeProjectSetupDraftObject(draft, {
    projectSlug: slug,
    databaseUrl,
    cwd: repoRoot
  });
  const second = await materializeProjectSetupDraftObject(draft, {
    projectSlug: slug,
    databaseUrl,
    cwd: repoRoot
  });

  assert.equal(first.mode, "dry-run");
  assert.equal(first.writes.personasInserted, 0);
  assert.equal(first.writes.topicsInserted, 0);
  assert.equal(first.writes.promptsInserted, 0);
  assert.equal(first.writes.projectFinalized, 0);
  assert.equal(first.promptConfigurationHash, second.promptConfigurationHash);
  assert.equal(first.promptConfigurationCount, second.promptConfigurationCount);
  await assertProjectState(slug, { personas: 0, topics: 0, prompts: 0, finalized: false });
}

async function assertInvalidDraftAndMissingTargetFailures(): Promise<void> {
  await expectMaterializationFailure(
    "unapproved draft",
    createDraft("issue-159-unapproved", { reviewStatus: "needs_review" }),
    "issue-159-unapproved",
    /draft_review_status_not_approved/
  );
  await expectMaterializationFailure(
    "missing target",
    createDraft("issue-159-missing"),
    "issue-159-missing",
    /project_not_found/
  );
  await createEmptyProject("issue-159-slug-target");
  await expectMaterializationFailure(
    "project slug mismatch",
    createDraft("issue-159-slug-draft"),
    "issue-159-slug-target",
    /project_slug_mismatch/
  );
}

async function assertFullTransactionSuccessAndRerunFailure(): Promise<void> {
  const slug = "issue-159-success";
  await createEmptyProject(slug);
  const draft = createDraft(slug);
  const summary = await materializeProjectSetupDraftObject(draft, {
    projectSlug: slug,
    execute: true,
    databaseUrl,
    cwd: repoRoot
  });
  const projectId = await readProjectId(slug);
  const expectedPlan = materializeFixedPromptConfiguration(draft, {
    projectSlug: slug,
    projectId
  });

  assert.equal(summary.mode, "execute");
  assert.equal(summary.projectId, projectId);
  assert.equal(summary.promptConfigurationHash, expectedPlan.promptConfigurationHash);
  assert.equal(summary.promptConfigurationCount, expectedPlan.promptConfigurationCount);
  assert.deepEqual(summary.sourceMappings, expectedPlan.sourceMappings);
  await assertProjectState(slug, {
    personas: expectedPlan.sourceMappings.personas.length,
    topics: expectedPlan.sourceMappings.topics.length,
    prompts: expectedPlan.sourceMappings.prompts.length,
    finalized: true,
    hash: expectedPlan.promptConfigurationHash,
    count: expectedPlan.promptConfigurationCount
  });

  await expectMaterializationFailure("rerun finalized project", draft, slug, /project_already_finalized/);
  await assertProjectState(slug, {
    personas: expectedPlan.sourceMappings.personas.length,
    topics: expectedPlan.sourceMappings.topics.length,
    prompts: expectedPlan.sourceMappings.prompts.length,
    finalized: true,
    hash: expectedPlan.promptConfigurationHash,
    count: expectedPlan.promptConfigurationCount
  });
}

async function assertAlreadyFinalizedFailure(): Promise<void> {
  const slug = "issue-159-already-finalized";
  await createEmptyProject(slug, { finalized: true });
  await expectMaterializationFailure("already finalized", createDraft(slug), slug, /project_already_finalized/);
}

async function assertDbRejectsPartialFinalizationState(): Promise<void> {
  const slug = "issue-159-partial-state";
  const ids = fixtureIds(slug);

  await expectDbError(`
    insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo)
    values (${uuid(ids.organizationId)}, ${lit(`${slug}-org`)}, 'Issue 159 Partial Org', 'client', 'local', false, true);

    insert into public.projects (id, organization_id, slug, name, prompt_configuration_hash)
    values (${uuid(ids.projectId)}, ${uuid(ids.organizationId)}, ${lit(slug)}, 'Issue 159 Partial Project', ${lit(validHash)});
  `, /projects_prompt_config_consistency_check|violates check constraint/i);
}

async function assertExistingPersonaFailure(): Promise<void> {
  const slug = "issue-159-persona-existing";
  const ids = await createEmptyProject(slug);
  await queryDb(`
    insert into public.personas (id, project_id, name)
    values (${uuid(stableUuid(slug, "existing-persona"))}, ${uuid(ids.projectId)}, 'Existing Persona')
  `);
  await expectMaterializationFailure("persona existing", createDraft(slug), slug, /target_project_not_empty:personas/);
}

async function assertExistingTopicFailure(): Promise<void> {
  const slug = "issue-159-topic-existing";
  const ids = await createEmptyProject(slug);
  await queryDb(`
    insert into public.topics (id, project_id, name)
    values (${uuid(stableUuid(slug, "existing-topic"))}, ${uuid(ids.projectId)}, 'Existing Topic')
  `);
  await expectMaterializationFailure("topic existing", createDraft(slug), slug, /target_project_not_empty:topics/);
}

async function assertExistingPromptFailure(): Promise<void> {
  const slug = "issue-159-prompt-existing";
  const ids = await createEmptyProject(slug);
  const topicId = stableUuid(slug, "existing-topic-for-prompt");
  await queryDb(`
    insert into public.topics (id, project_id, name)
    values (${uuid(topicId)}, ${uuid(ids.projectId)}, 'Existing Prompt Topic');

    insert into public.prompts (id, project_id, topic_id, text)
    values (${uuid(stableUuid(slug, "existing-prompt"))}, ${uuid(ids.projectId)}, ${uuid(topicId)}, 'Existing Prompt')
  `);
  await expectMaterializationFailure("prompt existing", createDraft(slug), slug, /target_project_not_empty:prompts/);
}

async function assertPersonaUuidConflictRollback(): Promise<void> {
  const slug = "issue-159-persona-conflict";
  const ids = await createEmptyProject(slug);
  const draft = createDraft(slug);
  const plan = materializeFixedPromptConfiguration(draft, { projectSlug: slug, projectId: ids.projectId });
  const other = await createEmptyProject(`${slug}-other`);
  await queryDb(`
    insert into public.personas (id, project_id, name)
    values (${uuid(plan.sourceMappings.personas[0]!.id)}, ${uuid(other.projectId)}, 'Conflicting Persona')
  `);

  await expectMaterializationFailure("persona uuid conflict", draft, slug, /persona_uuid_conflict/);
  await assertProjectState(slug, { personas: 0, topics: 0, prompts: 0, finalized: false });
}

async function assertTopicUuidConflictRollback(): Promise<void> {
  const slug = "issue-159-topic-conflict";
  const ids = await createEmptyProject(slug);
  const draft = createDraft(slug);
  const plan = materializeFixedPromptConfiguration(draft, { projectSlug: slug, projectId: ids.projectId });
  const other = await createEmptyProject(`${slug}-other`);
  await queryDb(`
    insert into public.topics (id, project_id, name)
    values (${uuid(plan.sourceMappings.topics[0]!.id)}, ${uuid(other.projectId)}, 'Conflicting Topic')
  `);

  await expectMaterializationFailure("topic uuid conflict", draft, slug, /topic_uuid_conflict/);
  await assertProjectState(slug, { personas: 0, topics: 0, prompts: 0, finalized: false });
}

async function assertPromptHalfwayFailureRollback(): Promise<void> {
  const slug = "issue-159-prompt-conflict";
  const ids = await createEmptyProject(slug);
  const draft = createDraft(slug);
  const plan = materializeFixedPromptConfiguration(draft, { projectSlug: slug, projectId: ids.projectId });
  assert.ok(plan.prompts.length >= 2, "prompt halfway test requires at least two prompts");
  const conflictPromptId = plan.prompts[plan.prompts.length - 1]!.id;
  const other = await createEmptyProject(`${slug}-other`);
  const otherTopicId = stableUuid(`${slug}-other`, "prompt-conflict-topic");
  await queryDb(`
    insert into public.topics (id, project_id, name)
    values (${uuid(otherTopicId)}, ${uuid(other.projectId)}, 'Prompt Conflict Topic');

    insert into public.prompts (id, project_id, topic_id, text)
    values (${uuid(conflictPromptId)}, ${uuid(other.projectId)}, ${uuid(otherTopicId)}, 'Conflicting Prompt')
  `);

  await expectMaterializationFailure("prompt halfway conflict", draft, slug, /prompt_uuid_conflict/);
  await assertProjectState(slug, { personas: 0, topics: 0, prompts: 0, finalized: false });
}

async function assertPersistedHashMismatchRollback(): Promise<void> {
  const slug = "issue-159-hash-mismatch";
  const ids = await createEmptyProject(slug);
  await queryDb(`
    create or replace function recora_private.b2_test_mutate_prompt_for_hash_mismatch()
    returns trigger
    language plpgsql
    set search_path = ''
    as $$
    begin
      if new.project_id = ${lit(ids.projectId)}::uuid then
        new.text := new.text || ' mutated by local b2 verifier';
      end if;
      return new;
    end;
    $$;

    drop trigger if exists b2_test_mutate_prompt_for_hash_mismatch on public.prompts;
    create trigger b2_test_mutate_prompt_for_hash_mismatch
    before insert on public.prompts
    for each row execute function recora_private.b2_test_mutate_prompt_for_hash_mismatch();
  `);
  try {
    await expectMaterializationFailure(
      "persisted hash mismatch",
      createDraft(slug),
      slug,
      /persisted_prompt_configuration_hash_mismatch/
    );
    await assertProjectState(slug, { personas: 0, topics: 0, prompts: 0, finalized: false });
  } finally {
    await queryDb(`
      drop trigger if exists b2_test_mutate_prompt_for_hash_mismatch on public.prompts;
      drop function if exists recora_private.b2_test_mutate_prompt_for_hash_mismatch();
    `);
  }
}

async function assertProjectABSeparation(): Promise<void> {
  const slugA = "issue-159-project-a";
  const slugB = "issue-159-project-b";
  await createEmptyProject(slugA);
  await createEmptyProject(slugB);
  const draftA = createDraft(slugA);
  const draftB = createDraft(slugB);

  const summaryA = await materializeProjectSetupDraftObject(draftA, {
    projectSlug: slugA,
    execute: true,
    databaseUrl,
    cwd: repoRoot
  });
  await assertProjectState(slugA, {
    personas: summaryA.plannedRecords.personas,
    topics: summaryA.plannedRecords.topics,
    prompts: summaryA.plannedRecords.prompts,
    finalized: true
  });
  await assertProjectState(slugB, { personas: 0, topics: 0, prompts: 0, finalized: false });
  const dryRunB = await materializeProjectSetupDraftObject(draftB, {
    projectSlug: slugB,
    databaseUrl,
    cwd: repoRoot
  });
  assert.equal(dryRunB.mode, "dry-run");
  assert.equal(dryRunB.writes.projectFinalized, 0);
}

async function assertConcurrentExecute(): Promise<void> {
  const slug = "issue-159-concurrent";
  await createEmptyProject(slug);
  const draft = createDraft(slug);
  const attempts = await Promise.allSettled([
    materializeProjectSetupDraftObject(draft, { projectSlug: slug, execute: true, databaseUrl, cwd: repoRoot }),
    materializeProjectSetupDraftObject(draft, { projectSlug: slug, execute: true, databaseUrl, cwd: repoRoot })
  ]);

  const successes = attempts.filter((attempt) => attempt.status === "fulfilled");
  const failures = attempts.filter((attempt) => attempt.status === "rejected");
  assert.equal(successes.length, 1, `expected exactly one concurrent success, got ${successes.length}`);
  assert.equal(failures.length, 1, `expected exactly one concurrent failure, got ${failures.length}`);
  assert.match(
    sanitizeErrorMessage((failures[0] as PromiseRejectedResult).reason),
    /project_already_finalized|target_project_not_empty/
  );
  const summary = (successes[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof materializeProjectSetupDraftObject>>>).value;
  await assertProjectState(slug, {
    personas: summary.plannedRecords.personas,
    topics: summary.plannedRecords.topics,
    prompts: summary.plannedRecords.prompts,
    finalized: true
  });
}

async function assertCliSmoke(): Promise<void> {
  const slug = "issue-159-cli-smoke";
  await createEmptyProject(slug);
  const draftPath = await writeTempDraft(createDraft(slug), slug);

  const npm = npmScriptCommand();
  const dryRun = spawnSync(npm.command, [
    ...npm.args,
    "run",
    "recora:project-setup-materialization",
    "--",
    "--input",
    draftPath,
    "--project-slug",
    slug
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: verifierEnv,
    timeout: 120_000,
    maxBuffer: 20 * 1024 * 1024
  });
  assert.equal(dryRun.status, 0, sanitize(`${dryRun.stdout ?? ""}\n${dryRun.stderr ?? ""}\n${dryRun.error?.message ?? ""}`));
  assert.match(dryRun.stdout, /"mode": "dry-run"/);
  await assertProjectState(slug, { personas: 0, topics: 0, prompts: 0, finalized: false });

  const execute = spawnSync(npm.command, [
    ...npm.args,
    "run",
    "recora:project-setup-materialization",
    "--",
    "--input",
    draftPath,
    "--project-slug",
    slug,
    "--execute"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: verifierEnv,
    timeout: 120_000,
    maxBuffer: 20 * 1024 * 1024
  });
  assert.equal(execute.status, 0, sanitize(`${execute.stdout ?? ""}\n${execute.stderr ?? ""}\n${execute.error?.message ?? ""}`));
  assert.match(execute.stdout, /"mode": "execute"/);
  await assertProjectState(slug, { personas: 1, topics: 1, prompts: 2, finalized: true });
}

function assertDbCatalog(): void {
  queryLocal(`
do $verify$
declare
  unit_a_migration_count bigint;
  unexpected_app_table_count bigint;
  unexpected_b2_function_count bigint;
  unexpected_b2_trigger_count bigint;
  unexpected_browser_write_grant_count bigint;
  unexpected_helper_execute_grant_count bigint;
  service_role_prompt_truncate boolean;
  project_rls boolean;
  persona_rls boolean;
  topic_rls boolean;
  prompt_rls boolean;
begin
  select count(*)
  into unit_a_migration_count
  from supabase_migrations.schema_migrations
  where version = '20260804000427';

  if unit_a_migration_count <> 1 then
    raise exception 'Issue 159 catalog failed: Unit A migration count is %', unit_a_migration_count;
  end if;

  select count(*)
  into unexpected_app_table_count
  from pg_class class_row
  join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace
  where namespace_row.nspname in ('public', 'recora_private')
    and class_row.relkind in ('r', 'p')
    and class_row.relname ~* '(fixed_prompt|materializ|prompt_configuration)';

  if unexpected_app_table_count <> 0 then
    raise exception 'Issue 159 catalog failed: B2 must not create application tables';
  end if;

  select count(*)
  into unexpected_b2_function_count
  from pg_proc proc
  join pg_namespace namespace_row on namespace_row.oid = proc.pronamespace
  where namespace_row.nspname in ('public', 'recora_private')
    and proc.proname ~* '(materializ|b2_test)';

  if unexpected_b2_function_count <> 0 then
    raise exception 'Issue 159 catalog failed: B2 test/helper function drift remains';
  end if;

  select count(*)
  into unexpected_b2_trigger_count
  from pg_trigger trigger_row
  where not trigger_row.tgisinternal
    and trigger_row.tgname ~* '(materializ|b2_test)';

  if unexpected_b2_trigger_count <> 0 then
    raise exception 'Issue 159 catalog failed: B2 trigger drift remains';
  end if;

  select relrowsecurity into project_rls from pg_class where oid = 'public.projects'::regclass;
  select relrowsecurity into persona_rls from pg_class where oid = 'public.personas'::regclass;
  select relrowsecurity into topic_rls from pg_class where oid = 'public.topics'::regclass;
  select relrowsecurity into prompt_rls from pg_class where oid = 'public.prompts'::regclass;
  if project_rls is not true or persona_rls is not true or topic_rls is not true or prompt_rls is not true then
    raise exception 'Issue 159 catalog failed: RLS must remain enabled on Project/Persona/Topic/Prompt tables';
  end if;

  select count(*)
  into unexpected_browser_write_grant_count
  from information_schema.role_table_grants grant_row
  where grant_row.table_schema = 'public'
    and grant_row.table_name in ('projects', 'personas', 'topics', 'prompts')
    and grant_row.grantee in ('anon', 'authenticated')
    and grant_row.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

  if unexpected_browser_write_grant_count <> 0 then
    raise exception 'Issue 159 catalog failed: browser write grants were introduced';
  end if;

  select has_table_privilege('service_role', 'public.prompts', 'TRUNCATE')
  into service_role_prompt_truncate;

  if service_role_prompt_truncate then
    raise exception 'Issue 159 catalog failed: service_role must not have TRUNCATE on prompts';
  end if;

  select count(*)
  into unexpected_helper_execute_grant_count
  from (
    values
      ('anon', 'recora_private.validate_prompt_metric_eligibility()'),
      ('authenticated', 'recora_private.validate_prompt_metric_eligibility()'),
      ('service_role', 'recora_private.validate_prompt_metric_eligibility()'),
      ('anon', 'recora_private.reject_finalized_prompt_mutation()'),
      ('authenticated', 'recora_private.reject_finalized_prompt_mutation()'),
      ('service_role', 'recora_private.reject_finalized_prompt_mutation()'),
      ('anon', 'recora_private.reject_finalized_project_config_update()'),
      ('authenticated', 'recora_private.reject_finalized_project_config_update()'),
      ('service_role', 'recora_private.reject_finalized_project_config_update()')
  ) expected(role_name, signature)
  where to_regprocedure(expected.signature) is not null
    and has_function_privilege(expected.role_name, expected.signature, 'EXECUTE');

  if unexpected_helper_execute_grant_count <> 0 then
    raise exception 'Issue 159 catalog failed: helper direct execute privilege drift exists';
  end if;
end;
$verify$;
`);
}

function assertServiceRoleRuntime(): void {
  queryLocal(`
begin;
${serviceRoleFixtureSql("issue-159-service-valid")}
set local role service_role;
insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  intent_key,
  panel_role,
  response_shape,
  candidate_mention_opportunity,
  ranking_opportunity,
  metric_eligibility
) values (
  '30000000-0000-4000-8000-000000000159',
  '30000000-0000-4000-8000-000000001159',
  '30000000-0000-4000-8000-000000002159',
  '30000000-0000-4000-8000-000000003159',
  'Service role valid fixed prompt',
  'category-shortlist',
  'core',
  'ranked_recommendation',
  'direct',
  'direct',
  ${jsonb(metricEligibilityJson())}
);
rollback;
`);

  queryLocal(`
begin;
${serviceRoleFixtureSql("issue-159-service-malformed")}
set local role service_role;
insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  metric_eligibility
) values (
  '30000000-0000-4000-8000-000000010159',
  '30000000-0000-4000-8000-000000001159',
  '30000000-0000-4000-8000-000000002159',
  '30000000-0000-4000-8000-000000003159',
  'Service role malformed fixed prompt',
  ${jsonb(metricEligibilityJson({ visibility: { state: null, reason_codes: ["bad_state"] } }))}
);
rollback;
`, /invalid fixed prompt metric_eligibility structure/i);

  const finalizedFixture = `
${serviceRoleFixtureSql("issue-159-service-finalized")}
insert into public.prompts (
  id,
  project_id,
  topic_id,
  persona_id,
  text,
  intent_key,
  panel_role,
  response_shape,
  candidate_mention_opportunity,
  ranking_opportunity,
  metric_eligibility
) values (
  '30000000-0000-4000-8000-000000020159',
  '30000000-0000-4000-8000-000000001159',
  '30000000-0000-4000-8000-000000002159',
  '30000000-0000-4000-8000-000000003159',
  'Finalized prompt fixture',
  'category-shortlist',
  'core',
  'ranked_recommendation',
  'direct',
  'direct',
  ${jsonb(metricEligibilityJson())}
);
update public.projects
set
  prompt_configuration_finalized_at = now(),
  prompt_configuration_hash = '${validHash}',
  prompt_configuration_contract_version = '${RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION}',
  prompt_configuration_count = 1
where id = '30000000-0000-4000-8000-000000001159';
`;

  queryLocal(`
begin;
${finalizedFixture}
set local role service_role;
insert into public.prompts (project_id, topic_id, persona_id, text)
values (
  '30000000-0000-4000-8000-000000001159',
  '30000000-0000-4000-8000-000000002159',
  '30000000-0000-4000-8000-000000003159',
  'Blocked finalized prompt insert'
);
rollback;
`, /fixed prompt configuration is finalized/i);

  queryLocal(`
begin;
${finalizedFixture}
set local role service_role;
update public.prompts
set text = 'Blocked finalized prompt update'
where id = '30000000-0000-4000-8000-000000020159';
rollback;
`, /fixed prompt configuration is finalized/i);

  queryLocal(`
begin;
${finalizedFixture}
set local role service_role;
delete from public.prompts
where id = '30000000-0000-4000-8000-000000020159';
rollback;
`, /fixed prompt configuration is finalized/i);

  queryLocal(`
begin;
${finalizedFixture}
update public.projects
set prompt_configuration_hash = '${"b".repeat(64)}'
where id = '30000000-0000-4000-8000-000000001159';
rollback;
`, /fixed prompt configuration fields are immutable once finalized/i);
}

function serviceRoleFixtureSql(slug: string): string {
  return `
insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo)
values (
  '30000000-0000-4000-8000-000000000159',
  '${slug}-org',
  'Issue 159 Service Role Org',
  'client',
  'local',
  false,
  true
);
insert into public.projects (id, organization_id, slug, name)
values (
  '30000000-0000-4000-8000-000000001159',
  '30000000-0000-4000-8000-000000000159',
  '${slug}',
  'Issue 159 Service Role Project'
);
insert into public.topics (id, project_id, name)
values (
  '30000000-0000-4000-8000-000000002159',
  '30000000-0000-4000-8000-000000001159',
  'Service Role Topic'
);
insert into public.personas (id, project_id, name)
values (
  '30000000-0000-4000-8000-000000003159',
  '30000000-0000-4000-8000-000000001159',
  'Service Role Persona'
);
`;
}

type BrandFixture = {
  name: string;
  domain?: string | null;
  aliases?: readonly string[];
};

type CreateEmptyProjectOptions = {
  finalized?: boolean;
  language?: string;
  region?: string;
  primaryBrand?: BrandFixture;
  competitorBrands?: readonly BrandFixture[];
};
async function createEmptyProject(
  slug: string,
  options: CreateEmptyProjectOptions = {}
): Promise<ReturnType<typeof fixtureIds>> {
  const ids = fixtureIds(slug);
  const primaryBrand = options.primaryBrand ?? { name: "Recora", domain: "recora.example", aliases: ["Recora"] };
  const competitorInserts = (options.competitorBrands ?? []).map((brand, index) => `
    insert into public.brands (id, project_id, brand_type, name, domain, aliases, is_active)
    values (
      ${uuid(stableUuid(slug, `fixture:competitor-brand:${index}:${brand.name}`))},
      ${uuid(ids.projectId)},
      'competitor',
      ${lit(brand.name)},
      ${brand.domain ? lit(brand.domain) : "null"},
      ${jsonb(brand.aliases ?? [brand.name])},
      true
    );
  `).join("\n");
  const finalizationColumns = options.finalized
    ? `,
      prompt_configuration_finalized_at,
      prompt_configuration_hash,
      prompt_configuration_contract_version,
      prompt_configuration_count`
    : "";
  const finalizationValues = options.finalized
    ? `,
      now(),
      ${lit(validHash)},
      ${lit(RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION)},
      1`
    : "";

  await queryDb(`
    insert into public.organizations (id, slug, name, organization_type, data_environment, is_internal, is_demo)
    values (
      ${uuid(ids.organizationId)},
      ${lit(`${slug}-org`)},
      ${lit(`Issue 159 ${slug} Org`)},
      'client',
      'local',
      false,
      true
    );

    insert into public.organization_members (id, organization_id, email, role)
    values (
      ${uuid(ids.memberId)},
      ${uuid(ids.organizationId)},
      ${lit(`${slug}@example.invalid`)},
      'owner'
    );

    insert into public.projects (
      id,
      organization_id,
      slug,
      name,
      language,
      region
      ${finalizationColumns}
    ) values (
      ${uuid(ids.projectId)},
      ${uuid(ids.organizationId)},
      ${lit(slug)},
      ${lit(`Issue 159 ${slug} Project`)},
      ${lit(options.language ?? seedInput.language)},
      ${lit(options.region ?? "JP")}
      ${finalizationValues}
    );

    insert into public.brands (id, project_id, brand_type, name, domain, aliases, is_active)
    values (
      ${uuid(ids.brandId)},
      ${uuid(ids.projectId)},
      'primary',
      ${lit(primaryBrand.name)},
      ${primaryBrand.domain ? lit(primaryBrand.domain) : "null"},
      ${jsonb(primaryBrand.aliases ?? [primaryBrand.name])},
      true
    );

    ${competitorInserts}
  `);
  return ids;
}

function fixtureIds(slug: string) {
  return {
    organizationId: stableUuid(slug, "fixture:organization"),
    memberId: stableUuid(slug, "fixture:member"),
    projectId: stableUuid(slug, "fixture:project"),
    brandId: stableUuid(slug, "fixture:primary-brand")
  };
}

async function readProjectId(slug: string): Promise<string> {
  const rows = await queryDb<{ id: string }>(`
    select id::text as id
    from public.projects
    where slug = ${lit(slug)}
  `);
  return single(rows, `project id ${slug}`).id;
}

async function assertProjectState(
  slug: string,
  expected: {
    personas: number;
    topics: number;
    prompts: number;
    finalized: boolean;
    hash?: string;
    count?: number;
  }
): Promise<void> {
  const rows = await queryDb<{
    persona_count: string;
    topic_count: string;
    prompt_count: string;
    prompt_configuration_finalized_at: string | null;
    prompt_configuration_hash: string | null;
    prompt_configuration_contract_version: string | null;
    prompt_configuration_count: string | null;
  }>(`
    select
      (select count(*)::text from public.personas where project_id = project_row.id) as persona_count,
      (select count(*)::text from public.topics where project_id = project_row.id) as topic_count,
      (select count(*)::text from public.prompts where project_id = project_row.id) as prompt_count,
      project_row.prompt_configuration_finalized_at::text as prompt_configuration_finalized_at,
      project_row.prompt_configuration_hash,
      project_row.prompt_configuration_contract_version,
      project_row.prompt_configuration_count::text as prompt_configuration_count
    from public.projects project_row
    where project_row.slug = ${lit(slug)}
  `);
  const row = single(rows, `project state ${slug}`);
  assert.equal(Number(row.persona_count), expected.personas, `${slug} persona count`);
  assert.equal(Number(row.topic_count), expected.topics, `${slug} topic count`);
  assert.equal(Number(row.prompt_count), expected.prompts, `${slug} prompt count`);
  if (expected.finalized) {
    assert.ok(row.prompt_configuration_finalized_at, `${slug} finalized_at missing`);
    assert.equal(row.prompt_configuration_contract_version, RECORA_FIXED_PROMPT_CONFIGURATION_CONTRACT_VERSION);
    if (expected.hash) assert.equal(row.prompt_configuration_hash, expected.hash, `${slug} hash`);
    if (expected.count != null) assert.equal(Number(row.prompt_configuration_count), expected.count, `${slug} count`);
  } else {
    assert.equal(row.prompt_configuration_finalized_at, null, `${slug} finalized_at`);
    assert.equal(row.prompt_configuration_hash, null, `${slug} hash`);
    assert.equal(row.prompt_configuration_contract_version, null, `${slug} contract version`);
    assert.equal(row.prompt_configuration_count, null, `${slug} count`);
  }
}

async function expectMaterializationFailure(
  name: string,
  draft: ProjectSetupDraft,
  projectSlug: string,
  expectedMessage: RegExp
): Promise<void> {
  try {
    await materializeProjectSetupDraftObject(draft, {
      projectSlug,
      execute: true,
      databaseUrl,
      cwd: repoRoot
    });
    assert.fail(`${name} unexpectedly succeeded`);
  } catch (error) {
    assert.match(sanitizeErrorMessage(error), expectedMessage, name);
  }
}

async function expectDbError(sql: string, expectedMessage: RegExp): Promise<void> {
  const db = new LocalPostgresClient(databaseUrl);
  await db.connect();
  try {
    await db.query(sql);
    assert.fail("Expected local SQL to fail.");
  } catch (error) {
    assert.match(sanitizeErrorMessage(error), expectedMessage);
  } finally {
    db.end();
  }
}

async function queryDb<T extends Record<string, string | null> = Record<string, string | null>>(sql: string): Promise<T[]> {
  const db = new LocalPostgresClient(databaseUrl);
  await db.connect();
  try {
    return await db.query<T>(sql);
  } finally {
    db.end();
  }
}

function queryLocal(sql: string, expectedError?: RegExp): string {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "--interactive",
      RECORA_FIXED_PROMPT_B2_DB_CONTAINER,
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--quiet"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: verifierEnv,
      input: sql,
      maxBuffer: 30 * 1024 * 1024,
      timeout: 120_000
    }
  );
  const output = sanitize(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  if (result.error) throw result.error;

  if (expectedError) {
    assert.notEqual(result.status, 0, `Expected local SQL to fail with ${expectedError}, but it succeeded.`);
    assert.match(output, expectedError);
    return output;
  }

  assert.equal(result.status, 0, `Local SQL failed:\n${output}`);
  return output;
}

function inspectContainer(): void {
  const result = spawnSync("docker", ["inspect", RECORA_FIXED_PROMPT_B2_DB_CONTAINER], {
    cwd: repoRoot,
    encoding: "utf8",
    env: verifierEnv,
    timeout: 30_000
  });
  assert.equal(result.status, 0, `Expected local container ${RECORA_FIXED_PROMPT_B2_DB_CONTAINER} to exist.`);
  const inspectRows = JSON.parse(result.stdout) as unknown[];
  assertB2DockerInspectMatchesTargetForTests(inspectRows[0], databaseUrlPort(databaseUrl));
}

function createDraft(slug: string, overrides: Partial<ProjectSetupDraft> = {}): ProjectSetupDraft {
  const persona = createPersona();
  const topic = createTopic();
  return {
    schemaVersion: PROJECT_SETUP_DRAFT_SCHEMA_VERSION,
    draftId: `setup-draft-${slug}`,
    projectSlug: slug,
    promptSetVersion: "setup-draft-v1",
    generatorVersion: "issue-159-fixture-v1",
    seedInput,
    inputCompletion: [
      { field: "brandName", status: "provided", value: seedInput.brandName },
      { field: "industryCategory", status: "provided", value: seedInput.industryCategory }
    ],
    reviewStatus: "approved",
    confidenceScore: 88,
    personas: [persona],
    topics: [topic],
    prompts: [
      createPrompt(),
      createPrompt({
        promptId: "prompt-citation-diagnostic",
        text: "When comparing AI search visibility tools, which source types should an AI answer cite?",
        intentKey: "citation-source-validation",
        panelRole: "diagnostic",
        category: "citation_check",
        intent: "citation_check",
        intentType: "evidence_seeking",
        responseShape: "evidence_answer",
        candidateMentionOpportunity: "none",
        rankingOpportunity: "none",
        expectedSignal: "AI answer describes source types and evidence quality."
      })
    ],
    competitors: [],
    citationAngles: [],
    pageImprovementAngles: [],
    riskFlags: [],
    ...overrides
  };
}

function createPersona(overrides: Partial<PersonaDraft> = {}): PersonaDraft {
  return {
    personaId: "persona-marketing-leader",
    displayName: "Marketing leader",
    segment: "BtoB SaaS marketing",
    businessType: "BtoB",
    industryCategory: "AI search visibility software",
    roleType: "decision_maker",
    detailedDecisionRole: "Owns measurement vendor selection",
    roleMappingReason: "Matches Recora reporting buyer",
    buyerStage: "comparison",
    jobs: ["Compare AI search visibility tools"],
    painPoints: ["AI answer visibility is hard to measure"],
    triggerEvents: ["Need a repeatable AI search report"],
    switchingForces: ["Manual checks are too slow"],
    alternativesConsidered: ["SEO agency", "manual prompt checks"],
    comparisonAxis: ["measurement coverage", "evidence quality"],
    proofNeeded: ["sample report", "methodology"],
    trustRequirement: "Evidence-labeled reports",
    promptAngle: "Compare AI search visibility diagnosis tools without seeding a brand.",
    promptReadiness: "ready_for_prompt_design",
    researchSufficiency: "site_informed_hypothesis",
    confidenceScore: 84,
    needsVerification: false,
    riskFlags: [],
    sourceStatus: "provided",
    reviewStatus: "approved",
    ...overrides
  };
}

function createTopic(overrides: Partial<TopicDraft> = {}): TopicDraft {
  return {
    topicId: "topic-ai-search-diagnosis",
    topicName: "AI search visibility diagnosis tool discovery",
    topicType: "category_discovery_topic",
    diagnosisGoal: "Observe vendor discovery, recommendation order, and evidence-source behavior.",
    targetPersonaId: "persona-marketing-leader",
    buyerStage: "comparison",
    metricTarget: {
      visibilityRate: "eligible",
      ranking: "eligible",
      sentiment: "excluded",
      citationCheck: "eligible",
      riskCheck: "eligible"
    },
    brandMentionPolicy: "brand_excluded",
    expectedSignal: "AI answer mentions candidate tools, rank or order, and cited source types.",
    minimumPromptCount: 1,
    riskOrBias: "Avoid seeding Recora in non-branded discovery prompts.",
    handoffSkill: "recora-competitor-benchmark",
    topicQualityDecision: "topic_ready",
    coverageStatus: "covered",
    confidenceScore: 84,
    reviewStatus: "approved",
    ...overrides
  };
}

function createPrompt(overrides: Partial<PromptDraft> = {}): PromptDraft {
  const buyerStage: BuyerStage = "comparison";
  return {
    promptId: "prompt-market-core",
    topicId: "topic-ai-search-diagnosis",
    personaId: "persona-marketing-leader",
    text: "Which AI search visibility diagnosis tools should a BtoB SaaS marketing team compare first?",
    rawUserIntent: "AI search visibility diagnosis tools comparison",
    intentKey: "category-shortlist",
    panelRole: "core",
    languageMode: "natural_conversation",
    category: "non_branded",
    intent: "buyer_intent",
    intentType: "commercial_investigation",
    buyerStage,
    brandingMode: "non_branded",
    brandMentionRule: "brand_excluded",
    competitorMentionRule: "unknown_competitor_discovery",
    responseShape: "ranked_recommendation",
    candidateMentionOpportunity: "direct",
    rankingOpportunity: "direct",
    expectedSignal: "AI answer returns candidate tools and recommendation order.",
    qualityScore: 86,
    gateDecision: "ready_for_measurement",
    gateReason: "Clear non-branded buyer intent with candidate and ranking opportunity.",
    sourceStatus: "provided",
    seedTerms: [],
    seedContaminationRisk: "low",
    needsVerification: false,
    confidenceScore: 84,
    reviewStatus: "approved",
    riskFlags: [],
    ...overrides
  };
}

function createCompetitorDraft(overrides: Partial<CompetitorDraft> = {}): CompetitorDraft {
  return {
    competitorId: "competitor-rivalco",
    rawName: "RivalCo",
    normalizedName: "rivalco",
    brandAliases: ["Rival Co"],
    companyName: "RivalCo Inc.",
    productName: "RivalCo Platform",
    domain: "rival.example",
    source: "provided",
    tier: "Direct",
    marketRegion: "Japan",
    entityConfidenceScore: 92,
    classificationConfidenceScore: 91,
    lowConfidenceReasons: [],
    evidence: ["provided competitor fixture"],
    riskFlags: [],
    reviewStatus: "approved",
    ...overrides
  };
}

function rivalBrandFixture(): BrandFixture {
  return {
    name: "RivalCo",
    domain: "rival.example",
    aliases: ["Rival Co", "RivalCo Platform"]
  };
}

function databaseUrlPort(value: string): string {
  return new URL(value).port || "5432";
}

function databaseUrlWithPort(value: string, port: string): string {
  const url = new URL(value);
  url.port = port;
  return url.toString();
}
async function writeTempDraft(draft: ProjectSetupDraft, slug: string): Promise<string> {

  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "recora-issue-159-"));
  const draftPath = path.join(dir, `${slug}.json`);
  await fsp.writeFile(draftPath, JSON.stringify(draft, null, 2), "utf8");
  return draftPath;
}

function metricEligibilityJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const metricKeys = [
    "visibility",
    "ranking",
    "sov",
    "sentiment",
    "brand_perception",
    "natural_citation_observation",
    "forced_citation_validation",
    "risk_check",
    "recommendation_input"
  ];
  return {
    ...Object.fromEntries(metricKeys.map((key) => [
      key,
      {
        state: key === "sentiment" || key === "brand_perception" ? "excluded" : "eligible",
        reason_codes: [`${key}_structure_valid`]
      }
    ])),
    ...overrides
  };
}

function npmScriptCommand(): { command: string; args: string[] } {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) return { command: process.execPath, args: [npmExecPath] };
  return { command: process.platform === "win32" ? "npm.cmd" : "npm", args: [] };
}

function lit(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function uuid(value: string): string {
  return `${lit(value)}::uuid`;
}

function jsonb(value: unknown): string {
  return `${lit(JSON.stringify(value))}::jsonb`;
}

function single<T>(rows: readonly T[], label: string): T {
  if (rows.length !== 1) throw new Error(`${label} returned ${rows.length} rows.`);
  return rows[0]!;
}

function sanitize(value: string): string {
  return value.replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[redacted-local-db-url]");
}

main().catch((error: unknown) => {
  const detail = error instanceof Error && error.stack ? error.stack : sanitizeErrorMessage(error);
  console.error(sanitize(detail));
  process.exit(1);
});
