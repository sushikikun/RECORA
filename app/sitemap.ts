import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/recora/marketing-site";
const publicPaths = ["/", "/product", "/sample", "/pricing", "/contact"];
export default function sitemap(): MetadataRoute.Sitemap { const siteUrl = getPublicSiteUrl(); if (!siteUrl) return []; return publicPaths.map((pathname) => ({ url: new URL(pathname, siteUrl).toString(), lastModified: new Date() })); }
