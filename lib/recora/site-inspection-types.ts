export type SiteInspectionWarning =
  | "brand_name_not_found"
  | "non_html_response"
  | "response_truncated"
  | "empty_page_metadata"
  | "site_inspection_failed";

export type SiteInspectionResult = {
  normalizedUrl: string;
  hostname: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  h1: string | null;
  canonicalUrl: string | null;
  brandNameFound: boolean;
  aliasFound: string[];
  suggestedServiceDescription: string | null;
  suggestedCategory: string | null;
  warnings: SiteInspectionWarning[];
};

export type SiteInspectionApiResponse =
  | {
      ok: true;
      result: SiteInspectionResult;
    }
  | {
      ok: false;
      code: string;
      error: string;
      warnings?: SiteInspectionWarning[];
    };
