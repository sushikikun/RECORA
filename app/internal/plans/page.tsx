import {
  AdminPlanConfigsPage,
  AdminPlanConfigsUnavailablePage
} from "@/components/recora/admin-plan-configs-page";
import { getRecoraAdminPlanConfigs } from "@/lib/recora/internal-plan-configs";

export const dynamic = "force-dynamic";

export default async function InternalPlanConfigsPage() {
  try {
    const data = await getRecoraAdminPlanConfigs();
    return <AdminPlanConfigsPage data={data} />;
  } catch (error) {
    console.error("[recora-admin-plan-configs] failed to load read-only plan configs", {
      errorName: error instanceof Error ? error.name : "unknown"
    });

    return (
      <AdminPlanConfigsUnavailablePage message="料金プランを読み込めませんでした。サーバー側の読み取り設定を確認してください。" />
    );
  }
}
