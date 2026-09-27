import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for cPanel "Setup Node.js App": build locally, upload .next/standalone
  output: "standalone",
  // Images are resized to WebP once on upload, so no on-request optimisation on the shared host
  images: { unoptimized: true },
  serverExternalPackages: ["sharp", "mysql2"],
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  poweredByHeader: false,
  // test sites (NEXT_PUBLIC_NOINDEX=1 at build time) tell search engines to stay away
  async headers() {
    return process.env.NEXT_PUBLIC_NOINDEX === "1" ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }] : [];
  },
};

export default nextConfig;
