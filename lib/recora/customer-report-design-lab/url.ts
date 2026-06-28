export const CUSTOMER_REPORT_DESIGN_LAB_SEARCH_PARAM = "data";
export const CUSTOMER_REPORT_DESIGN_LAB_SEARCH_VALUE = "design-lab";
export const CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG = "mieruca-seo-demo";
export const CUSTOMER_REPORT_DESIGN_LAB_PROJECT_NAME = "ミエルカSEO AI検索分析デモ";

export function withCustomerReportDesignLabSearchParam(href: string) {
  if (!href.startsWith("/dashboard")) return href;

  const [path, hash = ""] = href.split("#", 2);
  const [pathname, query = ""] = path.split("?", 2);
  const searchParams = new URLSearchParams(query);
  searchParams.set(CUSTOMER_REPORT_DESIGN_LAB_SEARCH_PARAM, CUSTOMER_REPORT_DESIGN_LAB_SEARCH_VALUE);

  const queryString = searchParams.toString();
  return `${pathname}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}
