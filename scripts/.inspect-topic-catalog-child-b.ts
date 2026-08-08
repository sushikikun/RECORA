import { RECORA_TOPIC_BLUEPRINT_CATALOG_V3 } from "../lib/recora/measurement-topic-catalog";

for (const item of RECORA_TOPIC_BLUEPRINT_CATALOG_V3) {
  if (item.kind === "observation_overlay") continue;
  console.log([
    item.pack,
    item.primaryCoverage,
    item.measurementLane,
    item.blueprintKey,
    item.semanticGroupKey,
    item.customerFacingNameTemplate
  ].join("\t"));
}
