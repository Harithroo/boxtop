import Link from "next/link";
import { Search, ShoppingBag, MessageCircle, User } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { cartCount } from "@/lib/cart";
import { waLink } from "@/lib/format";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [s, count] = await Promise.all([getSettings(), cartCount()]);
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      {s.store.announcement && (
        <div className="bg-brand px-4 py-2 text-center text-sm font-medium text-on-brand">{s.store.announcement}</div>
      )}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-bt flex h-16 items-center gap-3">
          <Link href="/" className="flex items-center gap-2" aria-label="Boxtop home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-md" />
            <span className="wordmark text-brand">BOXTOP</span>
          </Link>
          <nav className="ml-6 hidden gap-5 text-sm font-bold md:flex">
            <Link href="/shop" className="hover:text-brand">All boxes</Link>
            <Link href="/build" className="hover:text-brand">Build your own</Link>
            <Link href="/gift-finder" className="hover:text-brand">Gift finder</Link>
            <Link href="/corporate" className="hover:text-brand">Corporate</Link>
            <Link href="/vouchers" className="hover:text-brand">Vouchers</Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <form action="/search" className="hidden sm:block">
              <label className="sr-only" htmlFor="q">Search boxes</label>
              <input id="q" name="q" placeholder="Search boxes or package no." className="input min-h-10 w-56 py-1.5 text-sm" />
            </form>
            <Link href="/search" className="grid h-11 w-11 place-items-center sm:hidden" aria-label="Search"><Search size={22} strokeWidth={1.75} /></Link>
            <Link href="/account" className="grid h-11 w-11 place-items-center" aria-label="Your account"><User size={22} strokeWidth={1.75} /></Link>
            <Link href="/cart" className="relative grid h-11 w-11 place-items-center" aria-label={`Cart, ${count} items`}>
              <ShoppingBag size={22} strokeWidth={1.75} />
              {count > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{count}</span>}
            </Link>
          </div>
        </div>
        <nav className="container-bt flex gap-2 overflow-x-auto pb-2 text-sm md:hidden">
          {[["All boxes", "/shop"], ["Build your own", "/build"], ["Gift finder", "/gift-finder"], ["Corporate", "/corporate"], ["Vouchers", "/vouchers"], ["Track", "/track"]].map(([l, h]) => (
            <Link key={h} href={h} className="chip shrink-0">{l}</Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      {s.store.whatsapp && (
        <a href={waLink(s.store.whatsapp, "Hi Boxtop, I'd like to order a gift box.")} target="_blank" rel="noopener"
          className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#1E7A4C] text-white shadow-[var(--shadow-raised)]" aria-label="Chat with us on WhatsApp">
          <MessageCircle size={26} strokeWidth={1.75} />
        </a>
      )}

      <footer className="mt-16 bg-brand-deep text-on-brand">
        <div className="container-bt grid gap-8 py-10 sm:grid-cols-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.webp" alt="Boxtop, taste for gift" width={120} height={120} className="h-28 w-28 rounded-lg" />
            <p className="mt-3 text-sm opacity-90">{s.store.address}<br />{s.store.hours}</p>
          </div>
          <div className="text-sm">
            <p className="mb-2 font-bold">Help</p>
            <ul className="space-y-1 opacity-90">
              <li><Link href="/delivery">Delivery</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/track">Track an order</Link></li>
              <li><Link href="/account">Your account</Link> · <Link href="/account/reminders">Reminders</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="mb-2 font-bold">Boxtop</p>
            <ul className="space-y-1 opacity-90">
              <li><Link href="/about">About us</Link> · <Link href="/makers">Makers</Link></li>
              <li><Link href="/vouchers">Gift vouchers</Link> · <Link href="/custom">Custom orders</Link></li>
              <li><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></li>
              <li><Link href="/refunds">Refunds</Link> · <Link href="/delivery-policy">Delivery policy</Link></li>
              {s.store.phone && <li>Call {s.store.phone}</li>}
            </ul>
          </div>
        </div>
        <p className="border-t border-white/15 py-4 text-center text-xs opacity-75">© {new Date().getFullYear()} Boxtop · box-top.lk</p>
      </footer>
    </div>
  );
}
