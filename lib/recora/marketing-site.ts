import type { Metadata } from "next";

export function getPublicSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!rawUrl) return undefined;

  try {
    return new URL(rawUrl);
  } catch {
    return undefined;
  }
}

export function getAbsoluteSiteUrl(pathname: string, requestUrl?: string) {
  const configuredUrl = getPublicSiteUrl();
  const baseUrl = configuredUrl ?? (requestUrl ? new URL(requestUrl) : undefined);
  if (!baseUrl) return undefined;

  return new URL(pathname, baseUrl).toString();
}

export function createMarketingMetadata({
  title,
  description,
  pathname
}: {
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  const siteUrl = getPublicSiteUrl();

  return {
    metadataBase: siteUrl,
    title,
    description,
    alternates: siteUrl ? { canonical: pathname } : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ja_JP",
      ...(siteUrl
        ? {
            url: pathname,
            images: [{ url: "/og/recora-lp.png", width: 1200, height: 630, alt: "Recora" }]
          }
        : {})
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og/recora-lp.png"]
    }
  };
}
