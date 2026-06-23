import { notFound } from "next/navigation";

import {
  AdminOperationsIndexPage,
  AdminOperationsUnavailablePage
} from "@/components/recora/admin-operations-pages";
import { getRecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";
import { getRecoraInternalAdminAccess } from "@/lib/recora/internal-admin-access";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  const access = getRecoraInternalAdminAccess();
  if (!access.allowed) {
    notFound();
  }

  let data;
  try {
    data = await getRecoraAdminOperationsData();
  } catch (error) {
    console.warn("Failed to load Recora internal operations data.", getSafeErrorMessage(error));
    return (
      <AdminOperationsUnavailablePage
        access={access}
        message="Supabase read設定が未設定、またはread modelの取得に失敗しました。秘密値は表示していません。"
      />
    );
  }

  return <AdminOperationsIndexPage data={data} access={access} />;
}

function getSafeErrorMessage(error: unknown) {
  return { type: error instanceof Error ? error.name : typeof error };
}
