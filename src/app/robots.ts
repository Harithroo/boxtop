import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/order", "/cart", "/checkout", "/account", "/quote", "/bulk/", "/review", "/vouchers/"] }], sitemap: `${site}/sitemap.xml` };
}
