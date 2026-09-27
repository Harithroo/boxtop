import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://box-top.lk"),
  title: { default: "Boxtop · Gift boxes delivered across Sri Lanka", template: "%s · Boxtop" },
  description: "Gift boxes for birthdays, anniversaries and every occasion, packed in Piliyandala and delivered across Colombo and Sri Lanka. Taste for gift.",
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: "Boxtop", images: ["/brand/logo-512.png"] },
  ...(process.env.NEXT_PUBLIC_NOINDEX === "1" ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } } : {}),
};

export const viewport: Viewport = { themeColor: "#3C2894", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-LK">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600&family=Karla:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
