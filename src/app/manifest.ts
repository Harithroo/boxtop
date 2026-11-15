import type { MetadataRoute } from "next";
import { getSiteTheme } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // the installed app's splash and bar follow the site theme
  const bg = (await getSiteTheme()) === "dark" ? "#110a1c" : "#f5efe3";
  return {
    name: "Boxtop", short_name: "Boxtop", description: "Gift boxes delivered across Sri Lanka",
    start_url: "/", display: "standalone", background_color: bg, theme_color: bg,
    icons: [
      { src: "/brand/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
