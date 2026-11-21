"use client";
import { scrollToEl } from "@/components/site/scroll";

/** A link to a section of this page that glides there instead of jumping, for server-drawn markup. */
export function JumpLink({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return <a className={className} href={`#${to}`} onClick={(e) => { e.preventDefault(); scrollToEl(document.getElementById(to)); }}>{children}</a>;
}
