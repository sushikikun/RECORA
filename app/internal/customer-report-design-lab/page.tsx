import { CustomerReportDesignLab } from "@/components/recora/customer-report-design-lab/customer-report-design-lab";
import { getCustomerReportDesignLabTab } from "@/lib/recora/customer-report-design-lab/fixture";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    tab?: string;
  };
};

export default function CustomerReportDesignLabPage({ searchParams }: PageProps) {
  return <CustomerReportDesignLab activeTab={getCustomerReportDesignLabTab(searchParams?.tab)} />;
}
