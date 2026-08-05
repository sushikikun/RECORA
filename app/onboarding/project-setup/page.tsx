import type { Metadata } from "next";

import { ProjectSetupWizardV2 } from "@/components/recora/onboarding/project-setup-wizard-v2";

export const metadata: Metadata = {
  title: "初期設定 | Recora",
  description:
    "分析対象、事業内容、ペルソナ、トピック、測定質問を順番に確認するRecoraの初期設定画面です。"
};

export default function ProjectSetupOnboardingPage() {
  return <ProjectSetupWizardV2 />;
}
