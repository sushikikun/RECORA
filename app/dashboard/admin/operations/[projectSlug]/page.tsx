import { redirect } from "next/navigation";

import { requireInternalAccess } from "@/lib/recora/internal-admin-access";

type AdminOperationDetailPageProps = {
  params: {
    projectSlug: string;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminOperationProjectPage({ params }: AdminOperationDetailPageProps) {
  requireInternalAccess();
  redirect(`/internal/projects/${encodeURIComponent(params.projectSlug)}`);
}
