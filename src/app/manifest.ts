import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boxtop", short_name: "Boxtop", description: "Gift boxes delivered across Sri Lanka",
    start_url: "/", display: "standalone", background_color: "#F7F6FB", theme_color: "#3C2894",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
