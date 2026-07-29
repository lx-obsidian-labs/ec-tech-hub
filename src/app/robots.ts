import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-data";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/account", "/admin", "/business", "/technician", "/onboarding", "/auth"] }, sitemap: `${siteUrl}/sitemap.xml` };
}