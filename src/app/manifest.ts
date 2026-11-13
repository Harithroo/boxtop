import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boxtop", short_name: "Boxtop", description: "Gift boxes delivered across Sri Lanka",
    start_url: "/", display: "standalone", background_color: "#110a1c", theme_color: "#110a1c",
    icons: [
      { src: "/brand/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
