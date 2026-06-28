import type { Metadata } from "next";

import { ProjectSetupWizard } from "@/components/recora/onboarding/project-setup-wizard";

export const metadata: Metadata = {
  title: "無料診断のAPI前確認 | Recora",
  description: "無料診断後に対象ブランド、測定範囲、市場、競合、目的、計測条件を確認するAPI前の下書き画面です。"
};

export default function ProjectSetupOnboardingPage() {
  return <ProjectSetupWizard />;
}
