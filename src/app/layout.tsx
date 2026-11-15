import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Unbounded } from "next/font/google";
import "./globals.css";
import { getSiteTheme } from "@/lib/settings";
import { SiteThemeProvider } from "@/components/SiteTheme";

// Self-hosted at build time: no request to Google from the visitor's browser, and no layout shift while they load.
const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk"),
  title: { default: "Boxtop · Gift boxes delivered across Sri Lanka", template: "%s · Boxtop" },
  description: "Boxtop curates gift boxes in Sri Lanka from trusted brands and small makers, packed by hand in Piliyandala, Colombo. Tweak any box, order online or on WhatsApp, from Sri Lanka or abroad.",
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: "Boxtop", images: ["/brand/logo-512.png"] },
  ...(process.env.NEXT_PUBLIC_NOINDEX === "1" ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } } : {}),
};

// the browser bar takes the page colour of the theme the admin picked
export async function generateViewport(): Promise<Viewport> {
  const theme = await getSiteTheme();
  return { themeColor: theme === "dark" ? "#110a1c" : "#f5efe3", colorScheme: theme, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSiteTheme();
  return (
    <html lang="en-LK" data-theme={theme} className={`${unbounded.variable} ${figtree.variable} ${caveat.variable}`}>
      <body className="min-h-screen"><SiteThemeProvider theme={theme}>{children}</SiteThemeProvider></body>
    </html>
  );
}
