import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/about", "/services", "/repairs", "/technicians", "/marketplace", "/learn", "/ai-assist", "/contact", "/privacy", "/terms"];
  return routes.map((route) => ({ url: `${siteUrl}${route}`, lastModified: new Date(), changeFrequency: "weekly", priority: route === "/" ? 1 : 0.7 }));
}