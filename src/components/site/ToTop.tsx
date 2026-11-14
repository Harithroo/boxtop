"use client";
// Back to top, with a ring that fills as the page is read.
import { useEffect, useRef } from "react";
import { glideTo } from "./scroll";

export function ToTop() {
  const btn = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      // at the very end it steps aside: the poster's last line sits there, and the poster has its own arrow
      btn.current?.classList.toggle("show", y > window.innerHeight * 0.8 && h - y > 140);
      if (ring.current) ring.current.style.strokeDashoffset = (157.08 * (1 - (h > 0 ? Math.min(1, y / h) : 0))).toFixed(1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button className="to-top" type="button" ref={btn} aria-label="Back to top"
      onClick={() => { glideTo(0); document.querySelector<HTMLElement>(".hd .logo")?.focus({ preventScroll: true }); }}>
      <svg className="tt-ring" viewBox="0 0 54 54" aria-hidden="true"><circle className="bg" cx="27" cy="27" r="25" /><circle className="fg" ref={ring} cx="27" cy="27" r="25" /></svg>
      <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </button>
  );
}
