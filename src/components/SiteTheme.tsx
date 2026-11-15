"use client";
import { createContext, useContext } from "react";
import type { SiteTheme } from "@/lib/settings";

// The admin's site theme, for client code that draws colours itself (canvas, SVG strings, inline styles).
// Everything styled by CSS follows <html data-theme> on its own and doesn't need this.
const Ctx = createContext<SiteTheme>("light");

export function SiteThemeProvider({ theme, children }: { theme: SiteTheme; children: React.ReactNode }) {
  return <Ctx.Provider value={theme}>{children}</Ctx.Provider>;
}

export const useSiteTheme = () => useContext(Ctx);
