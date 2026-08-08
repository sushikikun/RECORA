import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/recora/marketing-site";
export default function robots(): MetadataRoute.Robots { const siteUrl = getPublicSiteUrl(); return { rules: { userAgent: "*", allow: "/" }, sitemap: siteUrl ? new URL("/sitemap.xml", siteUrl).toString() : undefined }; }
