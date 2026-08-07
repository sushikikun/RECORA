import { notFound } from "next/navigation";

import { AdminCustomerManagementPage } from "@/components/recora/admin-customer-management";
import { AdminIncidentAuditManagementPage } from "@/components/recora/admin-incident-audit-management";
import { AdminMeasurementManagementPage } from "@/components/recora/admin-measurement-management";
import { AdminPublicationManagementPage } from "@/components/recora/admin-publication-management";
import { AdminQualityExceptionReviewPage } from "@/components/recora/admin-quality-exception-review";
import {
  AdminDomainPage,
  isAdminDomainSlug
} from "@/components/recora/admin-control-room-pages";
import { buildAdminCustomerManagementSnapshot } from "@/lib/recora/admin-customer-management";
import { buildAdminIncidentAuditSnapshot } from "@/lib/recora/admin-incident-audit-management";
import { buildAdminMeasurementManagementSnapshot } from "@/lib/recora/admin-measurement-management";
import { buildAdminPublicationManagementSnapshot } from "@/lib/recora/admin-publication-management";
import { buildAdminQualityExceptionSnapshot } from "@/lib/recora/admin-quality-exception-review";
import {
  getRecoraAdminOperationsData,
  type RecoraAdminOperationsData
} from "@/lib/recora/db/admin-operations";

export const dynamic = "force-dynamic";

export default async function InternalAdminDomainPage({
  params
}: {
  params: { domain: string };
}) {
  if (!isAdminDomainSlug(params.domain)) {
    notFound();
  }

  let data: RecoraAdminOperationsData | null = null;
  let loadError: string | null = null;
  const needsProjectData = [
    "customers",
    "measurements",
    "quality",
    "publication",
    "incidents"
  ].includes(params.domain);

  if (needsProjectData) {
    try {
      data = await getRecoraAdminOperationsData();
    } catch (error) {
      console.warn("Failed to load Recora admin domain data.", {
        domain: params.domain,
        type: error instanceof Error ? error.name : typeof error
      });
      loadError = "接続済みread modelを読み取れませんでした。未接続領域に架空データは表示していません。";
    }
  }

  if (params.domain === "customers") {
    return (
      <AdminCustomerManagementPage
        snapshot={buildAdminCustomerManagementSnapshot(data)}
        loadError={loadError}
      />
    );
  }

  if (params.domain === "measurements") {
    return (
      <AdminMeasurementManagementPage
        snapshot={buildAdminMeasurementManagementSnapshot(data)}
        loadError={loadError}
      />
    );
  }

  if (params.domain === "quality") {
    return (
      <AdminQualityExceptionReviewPage
        snapshot={buildAdminQualityExceptionSnapshot(data)}
        loadError={loadError}
      />
    );
  }

  if (params.domain === "publication") {
    return (
      <AdminPublicationManagementPage
        snapshot={buildAdminPublicationManagementSnapshot(data)}
        loadError={loadError}
      />
    );
  }

  if (params.domain === "incidents") {
    return (
      <AdminIncidentAuditManagementPage
        snapshot={buildAdminIncidentAuditSnapshot(data)}
        loadError={loadError}
      />
    );
  }

  return <AdminDomainPage domain={params.domain} data={data} loadError={loadError} />;
}
