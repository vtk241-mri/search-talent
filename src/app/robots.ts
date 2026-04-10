import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", getMetadataBase()).toString(),
    host: getMetadataBase().toString(),
  };
}
