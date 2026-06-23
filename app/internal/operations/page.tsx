import {
  AdminOperationsIndexPage,
  AdminOperationsUnavailablePage
} from "@/components/recora/admin-operations-pages";
import { getRecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";

export const dynamic = "force-dynamic";

export default async function InternalOperationsPage() {
  let data;
  try {
    data = await getRecoraAdminOperationsData();
  } catch (error) {
    console.warn("Failed to load Recora internal operations data.", getSafeErrorMessage(error));
    return (
      <AdminOperationsUnavailablePage
        message="Supabase read設定が未設定、またはread modelの取得に失敗しました。秘密値は表示していません。"
      />
    );
  }

  return <AdminOperationsIndexPage data={data} variant="operations" />;
}

function getSafeErrorMessage(error: unknown) {
  return { type: error instanceof Error ? error.name : typeof error };
}
