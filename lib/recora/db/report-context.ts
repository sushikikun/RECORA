import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { createRecoraSupabaseClient } from "@/lib/supabase/server";
import {
  getDefaultRecoraProjectSlug,
  getLatestRunWithMetricSnapshots,
  getRecoraMetricSnapshotsOrEmpty,
  getRecoraProject,
  getSourceMeasurementRunId
} from "./dashboard";
import type {
  RecoraMeasurementRunRow,
  RecoraMetricSnapshotRow,
  RecoraProjectRow
} from "./types";

const MEASUREMENT_RUN_COLUMNS =
  "id, project_id, status, period_start, period_end, comparison_start, comparison_end, region, language, started_at, completed_at, metadata, created_at, updated_at";

type RecoraSupabaseClient = SupabaseClient;

export type RecoraReportContext = {
  project: RecoraProjectRow | null;
  aggregateRun: RecoraMeasurementRunRow | null;
  sourceMeasurementRun: RecoraMeasurementRunRow | null;
  sourceMeasurementRunId: string | null;
  metricSnapshots: RecoraMetricSnapshotRow[];
};

export async function getLatestRecoraReportContext(
  projectSlug = getDefaultRecoraProjectSlug(),
  supabase: RecoraSupabaseClient = createRecoraSupabaseClient()
): Promise<RecoraReportContext> {
  noStore();

  const project = await getRecoraProject(projectSlug, supabase);
  if (!project) return emptyReportContext();

  const aggregateRun = await getLatestRunWithMetricSnapshots(project.id, supabase);
  const sourceMeasurementRunId = getSourceMeasurementRunId(aggregateRun);

  const [metricSnapshots, sourceMeasurementRun] = await Promise.all([
    aggregateRun
      ? getRecoraMetricSnapshotsOrEmpty(aggregateRun.id, supabase, "report_context_metric_snapshots")
      : Promise.resolve([]),
    sourceMeasurementRunId
      ? getMeasurementRunById(sourceMeasurementRunId, supabase)
      : Promise.resolve(null)
  ]);

  return {
    project,
    aggregateRun,
    sourceMeasurementRun,
    sourceMeasurementRunId,
    metricSnapshots
  };
}

function emptyReportContext(): RecoraReportContext {
  return {
    project: null,
    aggregateRun: null,
    sourceMeasurementRun: null,
    sourceMeasurementRunId: null,
    metricSnapshots: []
  };
}

async function getMeasurementRunById(runId: string, supabase: RecoraSupabaseClient) {
  const { data, error } = await supabase
    .from("measurement_runs")
    .select(MEASUREMENT_RUN_COLUMNS)
    .eq("id", runId)
    .eq("status", "completed")
    .maybeSingle();

  throwIfSupabaseError("measurement_runs", error);
  return (data as RecoraMeasurementRunRow | null) ?? null;
}

function throwIfSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  throw new Error(`Failed to load Recora report context ${context}: ${error.message}`);
}
