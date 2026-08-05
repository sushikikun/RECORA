import { AdminOperatorHome } from "@/components/recora/admin-operator-home";
import { getRecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";

export const dynamic = "force-dynamic";

export default async function InternalHomePage() {
  try {
    const data = await getRecoraAdminOperationsData();
    return <AdminOperatorHome data={data} />;
  } catch (error) {
    console.warn("Failed to load Recora admin control room data.", getSafeErrorMessage(error));
    return (
      <AdminOperatorHome
        data={{ projects: [] }}
        loadError="Supabase read設定が未設定、またはread modelの取得に失敗しました。架空の代替データは表示していません。"
      />
    );
  }
}

function getSafeErrorMessage(error: unknown) {
  return { type: error instanceof Error ? error.name : typeof error };
}
