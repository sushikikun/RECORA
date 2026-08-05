import type {
  RecoraGenerationCustomerSide,
  RecoraGenerationStructureSignal
} from "./prompt-generation-input";
import {
  personaTopicInfluencesForCoverage,
  type RecoraPersonaBlueprintKind,
  type RecoraPersonaBlueprintV3,
  type RecoraPersonaCoverageDimension,
  type RecoraPersonaRoleFamily
} from "./measurement-persona-contract";
import { RECORA_PERSONA_COMMON_BLUEPRINT_ROWS_V3 } from "./measurement-persona-catalog-common";
import { RECORA_PERSONA_INDUSTRY_BLUEPRINT_ROWS_V3 } from "./measurement-persona-catalog-industry";

export type RecoraPersonaBlueprintSourceRowV3 = readonly [
  pack: string,
  blueprintKey: string,
  label: string,
  coverageDimensions: readonly RecoraPersonaCoverageDimension[],
  roleFamily: RecoraPersonaRoleFamily,
  marketSide: RecoraGenerationCustomerSide,
  kind: RecoraPersonaBlueprintKind,
  requiredSignalsAny: readonly RecoraGenerationStructureSignal[]
];

const SOURCE_ROWS = [
  ...RECORA_PERSONA_COMMON_BLUEPRINT_ROWS_V3,
  ...RECORA_PERSONA_INDUSTRY_BLUEPRINT_ROWS_V3
] as const;

export const RECORA_PERSONA_BLUEPRINT_CATALOG_V3: readonly RecoraPersonaBlueprintV3[] =
  SOURCE_ROWS.map(
    (
      [
        pack,
        blueprintKey,
        label,
        sourceCoverageDimensions,
        roleFamily,
        marketSide,
        kind,
        requiredSignalsAny
      ],
      fixedOrder
    ) => {
      const coverageDimensions = normalizeReviewedCoverage(
        blueprintKey,
        sourceCoverageDimensions
      );

      return {
        catalogVersion: "recora_persona_blueprint_catalog_ja_v3",
        blueprintKey,
        pack,
        label,
        description: `${label}として、分析対象を探し、比較し、判断する際の質問状況を表します。`,
        kind,
        coverageDimensions,
        roleFamily,
        marketSide,
        semanticGroupKey: `${marketSide}:${roleFamily}:${coverageDimensions.join("+")}`,
        topicInfluenceDimensions:
          personaTopicInfluencesForCoverage(coverageDimensions),
        requiredSignalsAny,
        fixedOrder
      };
    }
  );

export const RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS = {
  total: RECORA_PERSONA_BLUEPRINT_CATALOG_V3.length,
  selectable: RECORA_PERSONA_BLUEPRINT_CATALOG_V3.filter(
    (item) => item.kind === "selectable"
  ).length,
  conditional: RECORA_PERSONA_BLUEPRINT_CATALOG_V3.filter(
    (item) => item.kind === "conditional"
  ).length,
  modifier: RECORA_PERSONA_BLUEPRINT_CATALOG_V3.filter(
    (item) => item.kind === "modifier"
  ).length
} as const;

export const RECORA_PERSONA_BLUEPRINT_BY_KEY = new Map(
  RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map(
    (item) => [item.blueprintKey, item] as const
  )
);

export function getRecoraPersonaBlueprintV3(
  blueprintKey: string
): RecoraPersonaBlueprintV3 | null {
  return RECORA_PERSONA_BLUEPRINT_BY_KEY.get(blueprintKey) ?? null;
}

export function validateRecoraPersonaBlueprintCatalogV3(): {
  valid: boolean;
  blockers: readonly string[];
} {
  const blockers: string[] = [];
  const keys = RECORA_PERSONA_BLUEPRINT_CATALOG_V3.map(
    (item) => item.blueprintKey
  );

  if (RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS.total !== 192) {
    blockers.push("catalog_total_mismatch");
  }
  if (RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS.selectable !== 152) {
    blockers.push("catalog_selectable_count_mismatch");
  }
  if (RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS.conditional !== 33) {
    blockers.push("catalog_conditional_count_mismatch");
  }
  if (RECORA_PERSONA_BLUEPRINT_CATALOG_COUNTS.modifier !== 7) {
    blockers.push("catalog_modifier_count_mismatch");
  }
  if (new Set(keys).size !== keys.length) {
    blockers.push("catalog_blueprint_key_duplicate");
  }

  for (const item of RECORA_PERSONA_BLUEPRINT_CATALOG_V3) {
    if (!item.blueprintKey || !item.label || !item.pack) {
      blockers.push(`catalog_required_field_missing:${item.blueprintKey}`);
    }
    if (
      item.kind !== "modifier" &&
      item.topicInfluenceDimensions.length < 2
    ) {
      blockers.push(`catalog_topic_effects_insufficient:${item.blueprintKey}`);
    }
    if (
      item.kind === "modifier" &&
      !item.blueprintKey.startsWith("lifecycle.")
    ) {
      blockers.push(`catalog_modifier_key_invalid:${item.blueprintKey}`);
    }
    if (item.kind === "conditional" && item.requiredSignalsAny.length === 0) {
      const allowedWithoutSignal = item.pack === "manufacturer_channel";
      if (!allowedWithoutSignal) {
        blockers.push(`catalog_conditional_signal_missing:${item.blueprintKey}`);
      }
    }
  }

  return {
    valid: blockers.length === 0,
    blockers: Array.from(new Set(blockers)).sort()
  };
}

function normalizeReviewedCoverage(
  blueprintKey: string,
  source: readonly RecoraPersonaCoverageDimension[]
): readonly RecoraPersonaCoverageDimension[] {
  const additions: Partial<
    Record<string, readonly RecoraPersonaCoverageDimension[]>
  > = {
    "b2c.group_occasion_planner": ["C1"]
  };

  return Array.from(new Set([...source, ...(additions[blueprintKey] ?? [])])).sort();
}