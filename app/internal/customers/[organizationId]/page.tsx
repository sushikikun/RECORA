import { AdminCustomerDetailPage } from "@/components/recora/admin-customer-detail";
import { buildAdminCustomerDetailSnapshot } from "@/lib/recora/admin-customer-detail";
import {
  getRecoraAdminOperationsData,
  type RecoraAdminOperationsData
} from "@/lib/recora/db/admin-operations";

export const dynamic = "force-dynamic";

export default async function InternalCustomerDetailPage({
  params
}: {
  params: { organizationId: string };
}) {
  let data: RecoraAdminOperationsData | null = null;
  let loadError: string | null = null;

  try {
    data = await getRecoraAdminOperationsData();
  } catch (error) {
    console.warn("Failed to load Recora customer detail compatibility read.", {
      type: error instanceof Error ? error.name : typeof error
    });
    loadError = "Project compatibility readを読み取れませんでした。未接続値や取得失敗を0件として表示していません。";
  }

  return (
    <AdminCustomerDetailPage
      snapshot={buildAdminCustomerDetailSnapshot(params.organizationId, data)}
      loadError={loadError}
    />
  );
}
