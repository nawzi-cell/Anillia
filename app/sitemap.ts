import type { MetadataRoute } from "next";
import { journalPosts } from "@/content/journal";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

interface SlugItem {
  slug: string;
  updatedAt?: string;
}

async function fetchSlugs(path: string): Promise<SlugItem[]> {
  try {
    const res = await fetch(`${siteUrl}${path}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      success?: boolean;
      data?: unknown;
    };
    if (!json?.success) return [];
    const data: unknown = json.data;
    // Products-style endpoints return a paginated { items: [...] };
    // taxonomy endpoints return a bare array.
    const list: unknown[] = Array.isArray(data)
      ? data
      : data !== null && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : [];
    return list
      .filter(
        (x): x is SlugItem =>
          x !== null &&
          typeof x === "object" &&
          typeof (x as { slug?: unknown }).slug === "string"
      )
      .map((x) => ({
        slug: x.slug,
        updatedAt:
          typeof (x as { updatedAt?: unknown }).updatedAt === "string"
            ? (x as { updatedAt: string }).updatedAt
            : undefined,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/shop",
    "/collections",
    "/deals",
    "/journal",
    "/about",
    "/contact",
    "/cart",
    "/wishlist",
    "/checkout",
    "/login",
    "/register",
  ];

  const [products, categories, collections] = await Promise.all([
    fetchSlugs("/api/products?limit=100"),
    fetchSlugs("/api/categories"),
    fetchSlugs("/api/collections"),
  ]);

  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...products.map((p) => ({
      url: `${siteUrl}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...categories.map((c) => ({
      url: `${siteUrl}/shop/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...collections.map((c) => ({
      url: `${siteUrl}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...journalPosts.map((p) => ({
      url: `${siteUrl}/journal/${p.slug}`,
      lastModified: new Date(p.date + "T00:00:00"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
