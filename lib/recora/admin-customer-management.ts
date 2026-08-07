import type { RecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";

export type AdminCustomerSourceState = "compatibility" | "not_connected";

export type AdminCustomerSourceKey =
  | "projects"
  | "customerProfiles"
  | "projectStates"
  | "memberships"
  | "projectAccess"
  | "inquiries"
  | "contracts";

export type AdminCustomerSourceStatus = {
  key: AdminCustomerSourceKey;
  label: string;
  authority: string;
  state: AdminCustomerSourceState;
  note: string;
};

export type AdminCustomerProjectCompatibilityItem = {
  projectSlug: string;
  projectName: string;
  brandName: string;
  targetUrl: string;
  measurementStatus: string;
  aggregateStatus: string;
  reportReadyStatus: string;
  reportReadyStatusLabel: string;
};

export type AdminCustomerManagementSnapshot = {
  projectCount: number | null;
  customerCount: number | null;
  customerUserCount: number | null;
  openInquiryCount: number | null;
  sources: AdminCustomerSourceStatus[];
  projects: AdminCustomerProjectCompatibilityItem[];
};

const disconnectedSources: Omit<AdminCustomerSourceStatus, "state">[] = [
  {
    key: "customerProfiles",
    label: "顧客情報",
    authority: "M04 / M22",
    note: "顧客profileの正式read modelは未接続です。"
  },
  {
    key: "projectStates",
    label: "Project運用状態",
    authority: "M04 / M22",
    note: "管理用Project stateの正式read modelは未接続です。"
  },
  {
    key: "memberships",
    label: "顧客ユーザー",
    authority: "P4-B / M22",
    note: "membershipの管理画面用read modelは未接続です。"
  },
  {
    key: "projectAccess",
    label: "Projectアクセス",
    authority: "M05 / M22",
    note: "明示Project accessの正式read modelは未接続です。"
  },
  {
    key: "inquiries",
    label: "問い合わせ",
    authority: "M04 / M22",
    note: "問い合わせの正式read modelは未接続です。"
  },
  {
    key: "contracts",
    label: "契約・利用権限",
    authority: "M06 / M22",
    note: "契約・Project entitlementの正式read modelは未接続です。"
  }
];

export function buildAdminCustomerManagementSnapshot(
  data: RecoraAdminOperationsData | null
): AdminCustomerManagementSnapshot {
  const projectReadAvailable = data !== null;

  return {
    projectCount: projectReadAvailable ? data.projects.length : null,
    customerCount: null,
    customerUserCount: null,
    openInquiryCount: null,
    sources: [
      {
        key: "projects",
        label: "Project",
        authority: "既存Project compatibility read",
        state: projectReadAvailable ? "compatibility" : "not_connected",
        note: projectReadAvailable
          ? "既存Project readだけを暫定表示に使用しています。顧客accessや契約状態の代用にはしません。"
          : "既存Project readを読み取れません。"
      },
      ...disconnectedSources.map((source) => ({
        ...source,
        state: "not_connected" as const
      }))
    ],
    projects: projectReadAvailable
      ? data.projects.map((project) => ({
          projectSlug: project.projectSlug,
          projectName: project.projectName,
          brandName: project.brandName,
          targetUrl: project.targetUrl,
          measurementStatus: project.measurementStatus,
          aggregateStatus: project.aggregateStatus,
          reportReadyStatus: project.reportReadyStatus,
          reportReadyStatusLabel: project.reportReadyStatusLabel
        }))
      : []
  };
}
