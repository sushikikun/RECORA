import { notFound } from "next/navigation";

import {
  AdminOperationDetailPage,
  AdminOperationsUnavailablePage
} from "@/components/recora/admin-operations-pages";
import { getRecoraAdminOperationDetail } from "@/lib/recora/db/admin-operations";
import { getRecoraInternalAdminAccess } from "@/lib/recora/internal-admin-access";

type AdminOperationDetailPageProps = {
  params: {
    projectSlug: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminOperationProjectPage({ params }: AdminOperationDetailPageProps) {
  const access = getRecoraInternalAdminAccess();
  if (!access.allowed) {
    notFound();
  }

  let detail;
  try {
    detail = await getRecoraAdminOperationDetail(params.projectSlug);
  } catch (error) {
    console.warn("Failed to load Recora internal operation detail.", getSafeErrorMessage(error));
    return (
      <AdminOperationsUnavailablePage
        access={access}
        message="対象案件のread model取得に失敗しました。秘密値は表示していません。"
      />
    );
  }

  if (!detail) {
    notFound();
  }

  return <AdminOperationDetailPage detail={detail} access={access} />;
}

function getSafeErrorMessage(error: unknown) {
  return { type: error instanceof Error ? error.name : typeof error };
}
