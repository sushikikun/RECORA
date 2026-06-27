import "server-only";

import { headers } from "next/headers";

type AuthRedirectOriginResult =
  | {
      ok: true;
      origin: string;
    }
  | {
      ok: false;
      reason: "missing_origin" | "invalid_origin";
    };

export async function getRecoraAuthRedirectOrigin(): Promise<AuthRedirectOriginResult> {
  const configuredOrigin = getConfiguredSiteOrigin();
  if (configuredOrigin) return { ok: true, origin: configuredOrigin };

  if (process.env.NODE_ENV === "production") {
    return { ok: false, reason: "missing_origin" };
  }

  const headerOrigin = await getDevelopmentRequestHeaderOrigin();
  if (headerOrigin) return { ok: true, origin: headerOrigin };

  return { ok: false, reason: "invalid_origin" };
}

function getConfiguredSiteOrigin() {
  return parseHttpOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? parseHttpOrigin(process.env.NEXT_PUBLIC_APP_URL);
}

async function getDevelopmentRequestHeaderOrigin() {
  const headerList = await headers();
  const host = getFirstHeaderValue(headerList.get("x-forwarded-host") ?? headerList.get("host"));
  if (!host || host.includes("/") || host.includes("\\")) return undefined;

  const protocol = getFirstHeaderValue(headerList.get("x-forwarded-proto")) ?? getDevelopmentProtocol(host);
  return parseHttpOrigin(`${protocol}://${host}`);
}

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

function getDevelopmentProtocol(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]") ? "http" : "https";
}

function parseHttpOrigin(value: string | undefined) {
  const trimmedValue = value?.trim();
  if (!trimmedValue || trimmedValue.startsWith("//")) return undefined;

  try {
    const url = new URL(trimmedValue);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (!url.hostname) return undefined;

    return url.origin;
  } catch {
    return undefined;
  }
}
