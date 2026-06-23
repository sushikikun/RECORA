import { notFound } from "next/navigation";

import {
  AdminOperationDetailPage,
  AdminOperationsUnavailablePage
} from "@/components/recora/admin-operations-pages";
import { getRecoraAdminOperationDetail } from "@/lib/recora/db/admin-operations";

type InternalProjectPageProps = {
  params: {
    projectSlug: string;
  };
};

export const dynamic = "force-dynamic";

export default async function InternalProjectPage({ params }: InternalProjectPageProps) {
  let detail;
  try {
    detail = await getRecoraAdminOperationDetail(params.projectSlug);
  } catch (error) {
    console.warn("Failed to load Recora internal project detail.", getSafeErrorMessage(error));
    return (
      <AdminOperationsUnavailablePage
        message="対象案件のread model取得に失敗しました。秘密値は表示していません。"
      />
    );
  }

  if (!detail) {
    notFound();
  }

  return <AdminOperationDetailPage detail={detail} />;
}

function getSafeErrorMessage(error: unknown) {
  return { type: error instanceof Error ? error.name : typeof error };
}
