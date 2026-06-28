import type { Metadata } from "next";

import { ProjectSetupWizard } from "@/components/recora/onboarding/project-setup-wizard";

export const metadata: Metadata = {
  title: "無料診断の初期設定 | Recora",
  description: "無料診断後に会社情報、カテゴリ判定、ペルソナ、トピック、プロンプト下書きを確認する初期設定画面です。"
};

export default function ProjectSetupOnboardingPage() {
  return <ProjectSetupWizard />;
}
