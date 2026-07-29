import type { Metadata } from "next";

import { ProjectSetupWizard } from "@/components/recora/onboarding/project-setup-wizard";

export const metadata: Metadata = {
  title: "プロジェクト設定 | Recora",
  description:
    "企業・ブランド・商品・サービス・店舗の分析対象、計測条件、確認したい質問を設定する画面です。"
};

export default function ProjectSetupOnboardingPage() {
  return <ProjectSetupWizard />;
}
