import type { MetadataRoute } from "next";
import { getMetadataBase } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", getMetadataBase()).toString(),
    host: getMetadataBase().toString(),
  };
}
