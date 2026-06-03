import type { MetadataRoute } from "next";
import { createClientOrNull } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Strip trailing slash if present to avoid accidental double slashes (//) in URLs
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://molocontentcreatorsawards.co.ke";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/categories",
    "/nominees",
    "/leaderboard",
    "/faq",
    "/contact",
    "/terms",
    "/privacy",
    "/auth/login",
    "/auth/signup",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const, // Added 'as const' to fix the TS compilation error
    priority: path === "" ? 1 : 0.7,
  }));

  const supabase = await createClientOrNull();
  if (!supabase) return staticRoutes;

  const [{ data: categories }, { data: nominees }] = await Promise.all([
    supabase.from("categories").select("slug"),
    supabase.from("nominees").select("id, updated_at").eq("status", "approved").limit(5000),
  ]);

  const categoryUrls =
    categories?.map((c) => ({
      url: `${base}/categories/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })) ?? [];

  const nomineeUrls =
    nominees?.map((n) => ({
      url: `${base}/nominees/${n.id}`,
      lastModified: n.updated_at ? new Date(n.updated_at) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })) ?? [];

  return [...staticRoutes, ...categoryUrls, ...nomineeUrls];
}