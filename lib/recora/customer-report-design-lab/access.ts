import "server-only";

import { headers } from "next/headers";

import {
  CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG,
  CUSTOMER_REPORT_DESIGN_LAB_SEARCH_VALUE
} from "./url";

const ENABLE_CUSTOMER_REPORT_DESIGN_LAB_ENV = "RECORA_ENABLE_CUSTOMER_REPORT_DESIGN_LAB";
const ENABLED_VALUE = "true";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type CustomerReportDesignLabSearchParams = {
  data?: string | string[];
};

export type CustomerReportDesignLabEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  RECORA_ENABLE_CUSTOMER_REPORT_DESIGN_LAB?: string;
};

export function canUseCustomerReportDesignLab(
  searchParams?: CustomerReportDesignLabSearchParams | null,
  env: CustomerReportDesignLabEnv = process.env
) {
  if (getCustomerReportDesignLabQueryValue(searchParams) !== CUSTOMER_REPORT_DESIGN_LAB_SEARCH_VALUE) {
    return false;
  }

  if (env.RECORA_ENABLE_CUSTOMER_REPORT_DESIGN_LAB?.trim().toLowerCase() !== ENABLED_VALUE) {
    return false;
  }

  if ((env.NODE_ENV?.trim().toLowerCase() ?? "") === "production") {
    return false;
  }

  if (env.VERCEL_ENV?.trim()) {
    return false;
  }

  return isLocalRequest();
}

export function canUseCustomerReportDesignLabReport(
  reportSlug: string,
  searchParams?: CustomerReportDesignLabSearchParams | null,
  env: CustomerReportDesignLabEnv = process.env
) {
  return reportSlug.trim() === CUSTOMER_REPORT_DESIGN_LAB_REPORT_SLUG && canUseCustomerReportDesignLab(searchParams, env);
}

export function getCustomerReportDesignLabQueryValue(searchParams?: CustomerReportDesignLabSearchParams | null) {
  const value = searchParams?.data;
  return Array.isArray(value) ? value[0] : value;
}

function isLocalRequest() {
  const host = normalizeHostname(headers().get("host"));
  return Boolean(host && LOCAL_HOSTS.has(host));
}

function normalizeHostname(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname.toLowerCase();
  } catch {
    return value.split(":")[0]?.trim().toLowerCase() || null;
  }
}
