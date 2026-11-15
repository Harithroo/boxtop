import type { NextConfig } from "next";

/* Sent with every response.
   - HSTS: browsers that have seen the site over HTTPS refuse plain HTTP for a year. Own host only: it says
     nothing about subdomains (mail, cPanel), and it is ignored on http://localhost.
   - X-Frame-Options: nobody else may put the shop or the back office in a frame (clickjacking).
   - COOP: a page opened from here, or one that opened us, gets no handle on this window. The only pop-ups the
     site opens are WhatsApp chats, which never needed one.
   No Content-Security-Policy yet: a strict one needs a nonce on every script, which wants its own change and test. */
const SECURITY = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/* The photos and logos in public/ are served under fixed names, and browsers were keeping them for four hours
   (the CDN's default). They now keep them for a year, so THE RULE IS: a changed picture gets a new file name.
   Replace a file under its old name and returning visitors keep seeing the old picture. */
const KEEP = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  // Self-contained server for cPanel "Setup Node.js App": build locally, upload .next/standalone
  output: "standalone",
  // Images are resized to WebP once on upload, so no on-request optimisation on the shared host
  images: { unoptimized: true },
  serverExternalPackages: ["sharp", "mysql2"],
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY },
      { source: "/catalog/:path*", headers: KEEP },
      { source: "/home/:path*", headers: KEEP },
      { source: "/brand/:path*", headers: KEEP },
      // test sites (NEXT_PUBLIC_NOINDEX=1 at build time) tell search engines to stay away
      ...(process.env.NEXT_PUBLIC_NOINDEX === "1" ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }] : []),
    ];
  },
};

export default nextConfig;
