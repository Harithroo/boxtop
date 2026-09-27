import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boxtop", short_name: "Boxtop", description: "Gift boxes delivered across Sri Lanka",
    start_url: "/", display: "standalone", background_color: "#F7F6FB", theme_color: "#3C2894",
    icons: [
      { src: "/brand/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
