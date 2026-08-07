import type { AdminCustomerSourceState } from "@/lib/recora/admin-customer-management";
import type { RecoraAdminOperationsData } from "@/lib/recora/db/admin-operations";

export type AdminCustomerDetailSourceKey =
  | "customerProfile"
  | "projects"
  | "memberships"
  | "projectAccess"
  | "contracts"
  | "inquiries"
  | "audit";

export type AdminCustomerDetailSourceStatus = {
  key: AdminCustomerDetailSourceKey;
  label: string;
  authority: string;
  state: AdminCustomerSourceState;
  note: string;
};

export type AdminCustomerDetailProjectItem = {
  organizationId: string;
  projectSlug: string;
  projectName: string;
  brandName: string;
  targetUrl: string;
  measurementStatus: string;
  reportReadyStatus: string;
  reportReadyStatusLabel: string;
  customerAccessLabel: string | null;
  contractAccessLabel: string | null;
};

export type AdminCustomerDetailSnapshot = {
  organizationId: string;
  customer: {
    name: string | null;
    status: string | null;
    primaryContact: string | null;
  };
  projectCount: number | null;
  customerUserCount: number | null;
  openInquiryCount: number | null;
  contractStatus: string | null;
  sources: AdminCustomerDetailSourceStatus[];
  projects: AdminCustomerDetailProjectItem[];
  customerUsers: [];
  contracts: [];
  inquiries: [];
  auditEntries: [];
};

export function buildAdminCustomerDetailSnapshot(
  organizationId: string,
  data: RecoraAdminOperationsData | null
): AdminCustomerDetailSnapshot {
  const normalizedOrganizationId = organizationId.trim();
  const projectReadAvailable = data !== null;
  const projects = projectReadAvailable
    ? data.projects
        .filter((project) => project.organizationId === normalizedOrganizationId)
        .map((project) => ({
          organizationId: project.organizationId,
          projectSlug: project.projectSlug,
          projectName: project.projectName,
          brandName: project.brandName,
          targetUrl: project.targetUrl,
          measurementStatus: project.measurementStatus,
          reportReadyStatus: project.reportReadyStatus,
          reportReadyStatusLabel: project.reportReadyStatusLabel,
          customerAccessLabel: null,
          contractAccessLabel: null
        }))
    : [];

  return {
    organizationId: normalizedOrganizationId,
    customer: {
      name: null,
      status: null,
      primaryContact: null
    },
    projectCount: projectReadAvailable ? projects.length : null,
    customerUserCount: null,
    openInquiryCount: null,
    contractStatus: null,
    sources: [
      {
        key: "customerProfile",
        label: "顧客情報",
        authority: "M04 / M22",
        state: "not_connected",
        note: "顧客名、顧客状態、主担当者の正式read modelは未接続です。"
      },
      {
        key: "projects",
        label: "Projects",
        authority: "既存Project compatibility read",
        state: projectReadAvailable ? "compatibility" : "not_connected",
        note: projectReadAvailable
          ? "organization_idが一致するProjectだけを互換表示しています。"
          : "既存Project readを読み取れません。"
      },
      {
        key: "memberships",
        label: "顧客ユーザー",
        authority: "P4-B / M22",
        state: "not_connected",
        note: "organization membershipの管理画面用read modelは未接続です。"
      },
      {
        key: "projectAccess",
        label: "Projectアクセス",
        authority: "M05 / M22",
        state: "not_connected",
        note: "明示Project access grantの正式read modelは未接続です。"
      },
      {
        key: "contracts",
        label: "契約・利用権限",
        authority: "M06 / M22",
        state: "not_connected",
        note: "契約、Project entitlement、six-month access windowは未接続です。"
      },
      {
        key: "inquiries",
        label: "問い合わせ",
        authority: "M04 / M22",
        state: "not_connected",
        note: "問い合わせと内部対応履歴の正式read modelは未接続です。"
      },
      {
        key: "audit",
        label: "監査履歴",
        authority: "M02 / M22",
        state: "not_connected",
        note: "管理者・システム操作の顧客scope監査readは未接続です。"
      }
    ],
    projects,
    customerUsers: [],
    contracts: [],
    inquiries: [],
    auditEntries: []
  };
}
