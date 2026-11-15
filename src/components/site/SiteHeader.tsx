"use client";
// The store header: announcement ticker, pill navigation with two mega menus, and the full-screen menu.
// On the home page its links scroll to sections and talk to them over the home bus; elsewhere they are plain links.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, ShoppingBag, User } from "lucide-react";
import gsap from "gsap";
import { homeBus } from "@/lib/home-bus";
import { Chevron, WaIcon } from "./icons";
import { coarsePointer, lockScroll, reducedMotion, scrollToEl, siteEl } from "./scroll";

export type NavData = {
  wa: string; waDisplay: string; instagram: string; igHandle: string; facebook: string; payLine: string;
  announcements: string[]; abroad: boolean; cartCount: number; shelfCount: number;
  chapters: { slug: string; name: string; href: string; count: number }[];
  featured: { id: number; slug: string; name: string; priceText: string; img: string }[];
  occasions: { slug: string; name: string; when: string; dateShort: string; img: string | null; href: string }[];
  menuPics: Record<"shop" | "build" | "occasions" | "abroad" | "delivery", { img: string; cap: string } | null>;
};

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;
const HOME_PIC = { img: "/home/cafe-treat.webp", cap: "The café box" };

const HELP: [string, string][] = [
  ["About us", "/about"], ["Contact us", "/contact"], ["FAQ", "/faq"], ["Delivery & returns", "/delivery"],
  ["Track my order", "/track"], ["Bulk & corporate", "/corporate"], ["Gift vouchers", "/vouchers"], ["Gift finder", "/gift-finder"],
  ["Custom orders", "/custom"], ["My account", "/account"], ["Search", "/search"], ["Terms & privacy", "/terms"],
];

export function SiteHeader({ nav }: { nav: NavData }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const hd = useRef<HTMLElement>(null);
  const [mega, setMegaState] = useState<"shop" | "occ" | null>(null);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuOn, setMenuOn] = useState(false);
  const megaRef = useRef(mega);
  const menuRef = useRef(false);
  const megaT = useRef(0);
  const menuT = useRef(0);
  const megaY = useRef(0);
  const moPic = useRef<HTMLImageElement>(null);
  const moCap = useRef<HTMLElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const waHref = nav.wa ? `https://wa.me/${nav.wa}` : "/contact";

  const setMega = useCallback((k: "shop" | "occ" | null) => {
    if (k === megaRef.current) return;
    megaRef.current = k;
    megaY.current = window.scrollY;
    setMegaState(k);
  }, []);

  const setMenu = useCallback((open: boolean) => {
    window.clearTimeout(menuT.current);
    menuRef.current = open;
    siteEl()?.classList.toggle("menu-open", open);
    lockScroll(open);
    if (open) {
      setMega(null);
      setMenuMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setMenuOn(true)));
      hd.current?.classList.remove("is-hidden");
    } else {
      setMenuOn(false);
      menuT.current = window.setTimeout(() => setMenuMounted(false), 700);
    }
  }, [setMega]);

  // a mega menu's columns rise in, one after another
  useEffect(() => {
    if (!mega || reducedMotion() || !hd.current) return;
    const cols = hd.current.querySelectorAll(`#${mega === "shop" ? "megaShop" : "megaOcc"} .mega-in > *`);
    gsap.fromTo(cols, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power2.out", overwrite: true });
  }, [mega]);

  // the header tucks away on the way down and returns on the way up
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY, el = hd.current;
      if (!el) return;
      el.classList.toggle("is-scrolled", y > 40);
      if (megaRef.current && Math.abs(y - megaY.current) > 90) setMega(null);
      if (!megaRef.current && !menuRef.current) {
        if (y > lastY + 6 && y > 320) el.classList.add("is-hidden");
        else if (y < lastY - 6 || y < 320) el.classList.remove("is-hidden");
      }
      lastY = y;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (megaRef.current) {
        const b = el()?.querySelector<HTMLElement>(`.hd-dd[data-mega="${megaRef.current}"]`);
        setMega(null); b?.focus();
      }
      if (menuRef.current) { setMenu(false); burger.current?.focus(); }
    };
    const el = () => hd.current;
    const onDocClick = (e: MouseEvent) => { if (megaRef.current && !(e.target as Element).closest(".hd")) setMega(null); };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onDocClick);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
    };
  }, [setMega, setMenu]);

  // moving to another page closes whatever was open
  useEffect(() => {
    setMega(null);
    if (menuRef.current) setMenu(false);
    hd.current?.classList.remove("is-hidden");
  }, [pathname, setMega, setMenu]);
  useEffect(() => () => { window.clearTimeout(menuT.current); window.clearTimeout(megaT.current); siteEl()?.classList.remove("menu-open"); lockScroll(false); }, []);

  /** On the home page, glide to a section instead of following the link. */
  const toSection = (id: string, after?: () => void) => (e: React.MouseEvent) => {
    if (!onHome) return;
    const t = document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    setMega(null);
    if (menuRef.current) { setMenu(false); window.setTimeout(() => scrollToEl(t), 80); } else scrollToEl(t);
    after?.();
  };
  const openSoon = (k: "shop" | "occ") => { if (coarsePointer()) return; window.clearTimeout(megaT.current); megaT.current = window.setTimeout(() => setMega(k), 90); };
  const closeSoon = (ms: number) => { if (coarsePointer()) return; window.clearTimeout(megaT.current); megaT.current = window.setTimeout(() => setMega(null), ms); };
  const cur = (on: boolean) => (on ? { className: "is-cur", "aria-current": "page" as const } : {});
  const inShop = /^\/(shop|box|for|occasion|collection|search)(\/|$)/.test(pathname);

  const menu: { sec: string; href: string; label: string; hint: string; pic: { img: string; cap: string } | null }[] = [
    { sec: "top", href: "/", label: "Home", hint: "start here", pic: HOME_PIC },
    { sec: "collection", href: "/shop", label: "Shop boxes", hint: `${nav.shelfCount} real ones`, pic: nav.menuPics.shop },
    { sec: "build", href: "/build", label: "Build a box", hint: "your way", pic: nav.menuPics.build },
    { sec: "year", href: "/#year", label: "Occasions", hint: "what’s next", pic: nav.menuPics.occasions },
    ...(nav.abroad ? [{ sec: "abroad", href: "/#abroad", label: "Send from abroad", hint: "we’ll fly it", pic: nav.menuPics.abroad }] : []),
    { sec: "order", href: "/delivery", label: "Delivery & order", hint: "how it works", pic: nav.menuPics.delivery },
  ];
  const showPic = (p: { img: string; cap: string } | null) => () => {
    const img = moPic.current;
    if (!p || !img || img.getAttribute("src") === p.img) return;
    img.style.opacity = "0";
    window.setTimeout(() => { img.src = p.img; if (moCap.current) moCap.current.textContent = p.cap; img.style.opacity = "1"; }, 160);
  };

  const ticker = nav.announcements.map((b, i) => <span key={i}>{b}</span>);

  return (
    <>
      <header className={`hd${mega ? " mega-open" : ""}`} id="hd" ref={hd} onMouseLeave={() => closeSoon(220)} onMouseEnter={() => window.clearTimeout(megaT.current)}>
        <div className="annc" aria-label="Announcements">
          <div className="annc-track">{ticker}<span aria-hidden="true" style={{ display: "contents" }}>{ticker}</span></div>
        </div>
        <div className="hd-bar">
          <Link className="logo" href="/" aria-label="BOXTOP home" onClick={toSection("top")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-96.webp" alt="" width={36} height={36} />BOXTOP
          </Link>
          <nav className="hd-links" aria-label="Pages">
            <Link href="/" onClick={toSection("top")} onMouseEnter={() => closeSoon(120)} {...cur(onHome)}>Home</Link>
            <button type="button" className={`hd-dd${inShop ? " is-cur" : ""}`} data-mega="shop" aria-expanded={mega === "shop"} aria-controls="megaShop"
              onClick={() => setMega(mega === "shop" ? null : "shop")} onMouseEnter={() => openSoon("shop")}>Shop boxes<Chevron /></button>
            <Link href="/build" onClick={toSection("build")} onMouseEnter={() => closeSoon(120)} {...cur(pathname === "/build")}>Build a box</Link>
            <button type="button" className="hd-dd" data-mega="occ" aria-expanded={mega === "occ"} aria-controls="megaOcc"
              onClick={() => setMega(mega === "occ" ? null : "occ")} onMouseEnter={() => openSoon("occ")}>Occasions<Chevron /></button>
            {nav.abroad && <Link href="/#abroad" onClick={toSection("abroad")} onMouseEnter={() => closeSoon(120)}>Send from abroad</Link>}
            <Link href="/delivery" className={`hd-opt${pathname === "/delivery" ? " is-cur" : ""}`} onClick={toSection("order")} onMouseEnter={() => closeSoon(120)}>Delivery</Link>
          </nav>
          <div className="hd-act">
            <Link className="hd-ic hd-ic-opt" href="/search" aria-label="Search boxes"><Search strokeWidth={1.8} /></Link>
            <Link className="hd-ic hd-ic-opt" href="/account" aria-label="Your account"><User strokeWidth={1.8} /></Link>
            <Link className="hd-ic" href="/cart" aria-label={`Cart, ${nav.cartCount} ${nav.cartCount === 1 ? "item" : "items"}`}>
              <ShoppingBag strokeWidth={1.8} />{nav.cartCount > 0 && <b className="hd-count">{nav.cartCount}</b>}
            </Link>
            {/* the word is hidden on narrow phones, so the name is given here */}
            <a className="hd-wa" href={waHref} target="_blank" rel="noopener" aria-label="Order on WhatsApp"><WaIcon /><span>Order</span></a>
            <button type="button" className="hd-burger" id="burger" ref={burger} aria-expanded={menuOn} aria-controls="menuOv" aria-label={menuOn ? "Close menu" : "Open menu"}
              onClick={() => setMenu(!menuRef.current)}><i /><i /></button>
          </div>
        </div>

        <div className="mega" id="megaShop" hidden={mega !== "shop"}>
          <div className="mega-in">
            <div className="mega-cats">
              <p className="mega-k">Shop by who it&apos;s for</p>
              <ul>
                {nav.chapters.map((c) => (
                  <li key={c.slug}>
                    {onHome
                      ? <button type="button" onClick={() => { setMega(null); homeBus.emit("chapter", c.slug); }}>{c.name}<i>{pad2(c.count)}</i></button>
                      : <Link className="mega-cat" href={c.href}>{c.name}<i>{pad2(c.count)}</i></Link>}
                  </li>
                ))}
              </ul>
              <Link className="mega-all" href="/shop">See all {nav.shelfCount} real boxes →</Link>
            </div>
            <div className="mega-feat">
              {nav.featured.map((p) => {
                const inner = (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt="" loading="lazy" />
                    <b>{p.name}</b>
                    <small><em>{p.priceText}</em> · {onHome ? "tweak this box" : "see this box"} →</small>
                  </>
                );
                return onHome
                  ? <button key={p.id} type="button" className="mf" onClick={() => { setMega(null); homeBus.emit("preset", p.id); }}>{inner}</button>
                  : <Link key={p.id} className="mf" href={`/box/${p.slug}`}>{inner}</Link>;
              })}
            </div>
            <Link className="mega-build" href="/build" onClick={toSection("build")}>
              <span className="mega-k">Or start from scratch</span><b>Build your own box</b>
              <small>Pick the box, the budget and every item inside.</small><i aria-hidden="true">→</i>
            </Link>
          </div>
        </div>

        <div className="mega" id="megaOcc" hidden={mega !== "occ"}>
          <div className="mega-in mega-in-occ">
            <div className="mega-cats">
              <p className="mega-k">Coming up, counted from today</p>
              <p className="mega-note">Every date is the next one on Sri Lanka&apos;s calendar. Pick one to see what we&apos;d send.</p>
              <Link className="mega-all" href="/#year" onClick={toSection("year")}>Open the gifting year →</Link>
            </div>
            <ul className="mega-occs">
              {nav.occasions.map((o) => {
                const inner = (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {o.img ? <img src={o.img} alt="" loading="lazy" /> : <span className="mo-occ-ph" aria-hidden="true" />}
                    <span><b>{o.name}</b><small><em>{o.when}</em> · {o.dateShort}</small></span>
                  </>
                );
                return (
                  <li key={o.slug}>
                    {onHome
                      ? <button type="button" className="mo-occ" onClick={() => { setMega(null); homeBus.emit("occ", o.slug); }}>{inner}</button>
                      : <Link className="mo-occ" href={o.href}>{inner}</Link>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </header>

      <div className={`menu-ov${menuOn ? " is-open" : ""}`} id="menuOv" hidden={!menuMounted} data-lenis-prevent>
        <div className="mo-in">
          <ol className="mo-links">
            {menu.map((m, i) => (
              <li key={m.sec}>
                <Link href={m.href} style={{ transitionDelay: `${(0.18 + i * 0.05).toFixed(2)}s` }} onMouseEnter={showPic(m.pic)}
                  onClick={(e) => { if (onHome && document.getElementById(m.sec)) toSection(m.sec)(e); else setMenu(false); }}>
                  <small>{pad2(i + 1)}</small>{m.label}<em>{m.hint}</em>
                </Link>
              </li>
            ))}
          </ol>
          <div className="mo-aside">
            <figure className="mo-pic" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={moPic} src={HOME_PIC.img} alt="" />
              <figcaption ref={moCap}>{HOME_PIC.cap}</figcaption>
            </figure>
            <nav className="mo-help" aria-label="Help and info">
              <p className="mo-k">Help &amp; info</p>
              <ul>{HELP.map(([label, href]) => <li key={href}><Link href={href} onClick={() => setMenu(false)}>{label}</Link></li>)}</ul>
            </nav>
          </div>
        </div>
        <div className="mo-foot">
          {nav.wa && <a href={waHref} target="_blank" rel="noopener">WhatsApp {nav.waDisplay}</a>}
          {nav.instagram && <a href={nav.instagram} target="_blank" rel="noopener">Instagram {nav.igHandle}</a>}
          {nav.facebook && <a href={nav.facebook} target="_blank" rel="noopener">Facebook</a>}
          <span>{nav.payLine}</span>
        </div>
      </div>
    </>
  );
}
