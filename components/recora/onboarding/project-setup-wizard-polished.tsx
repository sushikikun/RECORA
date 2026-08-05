"use client";

import { ProjectSetupWizardV2 } from "@/components/recora/onboarding/project-setup-wizard-v2";

export function ProjectSetupWizardPolished() {
  return (
    <div className="recora-onboarding-polish">
      <ProjectSetupWizardV2 />
      <style jsx global>{`
        .recora-onboarding-polish main {
          padding-bottom: 104px;
        }

        .recora-onboarding-polish main > div {
          max-width: 1280px !important;
        }

        .recora-onboarding-polish main > div > section {
          border-radius: 22px !important;
          box-shadow: 0 14px 36px rgba(33, 72, 51, 0.065) !important;
        }

        .recora-onboarding-polish main > div > section > div:first-child {
          padding-top: 20px !important;
          padding-bottom: 20px !important;
        }

        .recora-onboarding-polish
          main
          > div
          > section
          > div[class*="border-t"]:last-child {
          position: fixed;
          left: 50%;
          bottom: 0;
          z-index: 50;
          width: min(calc(100% - 32px), 1280px);
          transform: translateX(-50%);
          border: 1px solid #d9e2dc !important;
          border-bottom: 0 !important;
          border-radius: 18px 18px 0 0;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 -10px 30px rgba(28, 61, 43, 0.11);
          backdrop-filter: blur(16px);
        }

        .recora-onboarding-polish
          div:has(> article > div button[aria-expanded]) {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px !important;
        }

        .recora-onboarding-polish article:has(button[aria-expanded]) {
          min-width: 0;
          padding: 16px !important;
          border-color: #dbe4de !important;
          border-radius: 16px !important;
        }

        .recora-onboarding-polish article:has(button[aria-expanded]) dl {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 10px 14px !important;
          margin-top: 12px !important;
          padding-top: 12px !important;
        }

        .recora-onboarding-polish article:has(button[aria-expanded]) dd {
          line-height: 1.55 !important;
        }

        .recora-onboarding-polish:has(
            article button[aria-expanded="true"]
          )::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(15, 31, 23, 0.36);
          backdrop-filter: blur(2px);
        }

        body:has(
            .recora-onboarding-polish article button[aria-expanded="true"]
          ) {
          overflow: hidden;
        }

        .recora-onboarding-polish
          article:has(button[aria-expanded="true"])
          > div:last-child {
          position: fixed !important;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 80;
          width: min(520px, 92vw);
          max-height: none !important;
          margin: 0 !important;
          padding: 72px 24px 28px !important;
          overflow-y: auto;
          border: 0 !important;
          border-radius: 24px 0 0 24px !important;
          background: #f7faf8 !important;
          box-shadow: -18px 0 54px rgba(16, 40, 27, 0.18);
        }

        .recora-onboarding-polish
          article:has(button[aria-expanded="true"])
          > div:last-child
          > div:last-child {
          display: grid !important;
          grid-template-columns: 1fr !important;
          max-height: none !important;
          overflow: visible !important;
        }

        .recora-onboarding-polish
          article:has(button[aria-expanded="true"])
          > div:last-child
          > div:last-child
          > button {
          border-width: 0 0 1px !important;
          border-radius: 8px !important;
          padding: 14px 10px !important;
          background: transparent !important;
        }

        .recora-onboarding-polish
          article:has(button[aria-expanded="true"])
          > div:first-child
          button[aria-expanded="true"] {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 90;
          min-width: 76px;
          font-size: 0 !important;
          background: #ffffff !important;
          box-shadow: 0 5px 18px rgba(25, 53, 37, 0.12);
        }

        .recora-onboarding-polish
          article:has(button[aria-expanded="true"])
          > div:first-child
          button[aria-expanded="true"]::after {
          content: "閉じる";
          font-size: 12px;
          font-weight: 700;
        }

        .recora-onboarding-polish
          article:has(button[aria-expanded="true"])
          > div:first-child
          button[aria-expanded="true"]
          svg {
          display: none;
        }

        @media (min-width: 1024px) {
          .recora-onboarding-polish ol[aria-label="初期設定ステップ"] {
            position: relative;
            gap: 0 !important;
            margin-bottom: 18px !important;
            padding: 0 10px;
          }

          .recora-onboarding-polish
            ol[aria-label="初期設定ステップ"]::before {
            content: "";
            position: absolute;
            top: 21px;
            left: 6%;
            right: 6%;
            height: 1px;
            background: #d7e0da;
          }

          .recora-onboarding-polish
            ol[aria-label="初期設定ステップ"]
            button {
            position: relative;
            z-index: 1;
            flex-direction: column;
            justify-content: flex-start;
            gap: 6px !important;
            min-height: 64px;
            padding: 4px !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            text-align: center !important;
          }

          .recora-onboarding-polish
            ol[aria-label="初期設定ステップ"]
            button
            > span:first-child {
            width: 34px !important;
            height: 34px !important;
            border: 5px solid #f3f6f3;
            border-radius: 999px !important;
          }

          .recora-onboarding-polish
            ol[aria-label="初期設定ステップ"]
            button
            > span:last-child {
            max-width: 150px;
            font-size: 12px !important;
          }
        }

        @media (max-width: 767px) {
          .recora-onboarding-polish main {
            padding-bottom: 138px;
          }

          .recora-onboarding-polish
            main
            > div
            > section
            > div[class*="border-t"]:last-child {
            width: 100%;
            padding: 12px 16px calc(12px + env(safe-area-inset-bottom)) !important;
            border-right: 0 !important;
            border-left: 0 !important;
            border-radius: 16px 16px 0 0;
          }

          .recora-onboarding-polish
            div:has(> article > div button[aria-expanded]) {
            grid-template-columns: 1fr;
          }

          .recora-onboarding-polish article:has(button[aria-expanded]) dl {
            grid-template-columns: 1fr !important;
          }

          .recora-onboarding-polish
            article:has(button[aria-expanded="true"])
            > div:last-child {
            top: 10vh;
            left: 0;
            width: 100%;
            max-height: 90vh !important;
            padding: 68px 18px calc(24px + env(safe-area-inset-bottom)) !important;
            border-radius: 24px 24px 0 0 !important;
            box-shadow: 0 -18px 48px rgba(16, 40, 27, 0.22);
          }

          .recora-onboarding-polish
            article:has(button[aria-expanded="true"])
            > div:first-child
            button[aria-expanded="true"] {
            top: calc(10vh + 16px);
            right: 16px;
          }
        }
      `}</style>
    </div>
  );
}
