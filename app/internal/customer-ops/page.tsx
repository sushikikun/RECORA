import {
  AdminCustomerOpsPage,
  AdminCustomerOpsUnavailablePage
} from "@/components/recora/admin-customer-ops-page";
import { getRecoraAdminCustomerOps } from "@/lib/recora/internal-customer-ops";

export const dynamic = "force-dynamic";

export default async function InternalCustomerOpsPage() {
  try {
    const data = await getRecoraAdminCustomerOps();
    return <AdminCustomerOpsPage data={data} />;
  } catch (error) {
    console.error("[recora-admin-customer-ops] failed to load read-only customer ops", {
      errorName: error instanceof Error ? error.name : "unknown"
    });

    return (
      <AdminCustomerOpsUnavailablePage message="顧客運用情報を読み込めませんでした。サーバー側の読み取り設定を確認してください。" />
    );
  }
}
