import { notFound } from "next/navigation";

import {
  AdminDomainPage,
  isAdminDomainSlug
} from "@/components/recora/admin-control-room-pages";
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
  const needsProjectData = ["customers", "measurements", "quality", "publication"].includes(params.domain);

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

  return <AdminDomainPage domain={params.domain} data={data} loadError={loadError} />;
}
