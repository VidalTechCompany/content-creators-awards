import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Strip trailing slash if present to avoid accidental double slashes (//)
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://molocontentcreatorsawards.co.ke";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Secure both the base paths and any nested pages inside them
      disallow: [
        "/admin/", 
        "/admin", 
        "/auth/account/", 
        "/auth/account", 
        "/api/"
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}