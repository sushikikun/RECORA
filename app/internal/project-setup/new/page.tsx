import type { Metadata } from "next";

import { ProjectSetupDraftReviewPage } from "@/components/recora/project-setup-draft-review";
import { requireInternalAccess } from "@/lib/recora/internal-admin-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "案件設定下書き | Recora 内部運用",
  description: "Recoraのローカル限定案件設定下書きレビュー画面。"
};

export default function InternalProjectSetupNewPage() {
  requireInternalAccess({ requiredRole: "reviewer" });

  return <ProjectSetupDraftReviewPage />;
}
