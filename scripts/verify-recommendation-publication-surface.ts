import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  getRecommendationPublicationState,
  isCustomerVisibleRecommendation,
  type RecoraRecommendationPublicationState
} from "../lib/recora/report-eligibility";

type PublicationCase = {
  name: string;
  status?: string;
  metadata: Record<string, unknown>;
  expectedState: RecoraRecommendationPublicationState;
  expectedVisible: boolean;
};

const publicationCases: PublicationCase[] = [
  {
    name: "pre-quality-gate display candidate is internal",
    metadata: {
      display_decision: "show",
      publication_state: "pre_quality_gate"
    },
    expectedState: "pre_quality_gate",
    expectedVisible: false
  },
  {
    name: "review-required saved candidate is internal",
    metadata: {
      display_decision: "show",
      should_save_to_recommendations: "review_required",
      publication_state: "pre_quality_gate"
    },
    expectedState: "review_required",
    expectedVisible: false
  },
  {
    name: "show without quality decision stays pre-gate",
    metadata: {
      display_decision: "show"
    },
    expectedState: "pre_quality_gate",
    expectedVisible: false
  },
  {
    name: "auto-publish gate with show is customer visible",
    metadata: {
      display_decision: "show",
      quality_gate_decision: "auto_publish"
    },
    expectedState: "customer_visible",
    expectedVisible: true
  },
  {
    name: "explicit published state is customer visible",
    metadata: {
      publication_state: "published"
    },
    expectedState: "customer_visible",
    expectedVisible: true
  },
  {
    name: "hold decision overrides published state",
    metadata: {
      publication_state: "published",
      quality_gate_decision: "hold"
    },
    expectedState: "review_required",
    expectedVisible: false
  },
  {
    name: "suppress decision is hidden",
    metadata: {
      display_decision: "show",
      quality_gate_decision: "suppress"
    },
    expectedState: "hidden_internal",
    expectedVisible: false
  },
  {
    name: "candidate-only state is internal",
    metadata: {
      publication_state: "candidate_only"
    },
    expectedState: "candidate_only",
    expectedVisible: false
  },
  {
    name: "dismissed rows stay hidden even when marked published",
    status: "dismissed",
    metadata: {
      publication_state: "published"
    },
    expectedState: "hidden_internal",
    expectedVisible: false
  }
];

for (const item of publicationCases) {
  const state = getRecommendationPublicationState({
    status: item.status ?? "open",
    metadata: item.metadata
  });
  const visible = isCustomerVisibleRecommendation({
    status: item.status ?? "open",
    metadata: item.metadata
  });

  assert.equal(state, item.expectedState, item.name);
  assert.equal(visible, item.expectedVisible, item.name);
}

const migration = findPublicationSurfaceMigration();
const compactSql = migration.sql.replace(/\s+/g, " ").trim();

assert.match(
  compactSql,
  /create or replace function recora_private\.is_customer_visible_recommendation\(/i,
  "migration must define the RLS publication predicate"
);
assert.match(
  compactSql,
  /drop policy if exists "recora_demo_or_member_recommendations_select" on public\.recommendations/i,
  "migration must replace the previous broad recommendations SELECT policy"
);
assert.ok(
  compactSql.includes(
    "recora_private.can_read_project(project_id) and recora_private.is_customer_visible_recommendation(status, metadata)"
  ),
  "recommendations SELECT policy must require both project readability and customer-visible publication"
);
assert.match(
  compactSql,
  /revoke all on function recora_private\.is_customer_visible_recommendation\(public\.recora_recommendation_state, jsonb\) from public/i,
  "publication predicate function must not keep broad PUBLIC execute grants"
);
assert.match(
  compactSql,
  /grant execute on function recora_private\.is_customer_visible_recommendation\(public\.recora_recommendation_state, jsonb\) to anon, authenticated/i,
  "anon/authenticated roles need narrow execute on the predicate used by RLS"
);

console.log(JSON.stringify({
  status: "ok",
  checkedCases: publicationCases.length,
  migration: migration.fileName
}, null, 2));

function findPublicationSurfaceMigration() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const fileNames = fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  for (const fileName of [...fileNames].reverse()) {
    const sql = fs.readFileSync(path.join(migrationsDir, fileName), "utf8");
    if (sql.includes("recora_private.is_customer_visible_recommendation")) {
      return { fileName, sql };
    }
  }

  throw new Error("No migration defines recora_private.is_customer_visible_recommendation.");
}
