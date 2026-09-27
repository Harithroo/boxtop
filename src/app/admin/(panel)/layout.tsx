import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Truck, Package, Inbox, Settings, Tag, FileText, LogOut, Blocks, Sparkles, Star, Briefcase, Gift } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export const metadata = { title: "Back office", robots: { index: false } };

const NAV = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/orders", "Orders", ShoppingBag],
  ["/admin/deliveries", "Deliveries", Truck],
  ["/admin/boxes", "Boxes", Package],
  ["/admin/builder", "Builder and items", Blocks],
  ["/admin/finder", "Gift finder", Sparkles],
  ["/admin/quotes", "Quotes", Briefcase],
  ["/admin/reviews", "Reviews", Star],
  ["/admin/vouchers", "Vouchers", Gift],
  ["/admin/enquiries", "Enquiries", Inbox],
  ["/admin/marketing", "Coupons", Tag],
  ["/admin/content", "Content", FileText],
  ["/admin/settings", "Settings", Settings],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAdmin();
  return (
    <div className="min-h-screen bg-page md:flex">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto bg-brand-deep text-on-brand md:flex">
        <div className="p-5"><p className="wordmark">BOXTOP</p><p className="text-xs opacity-75">Back office · {s.name}</p></div>
        <nav className="flex-1 space-y-1 px-2 text-sm">
          {NAV.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10"><Icon size={18} strokeWidth={1.75} />{label}</Link>
          ))}
        </nav>
        <form action={logout} className="p-3"><button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/10"><LogOut size={18} />Sign out</button></form>
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <header className="border-b border-line bg-surface md:hidden">
          <div className="flex items-center justify-between px-4 py-3"><span className="wordmark text-brand">BOXTOP</span><form action={logout}><button className="text-sm font-bold text-brand">Sign out</button></form></div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-2 text-sm">
            {NAV.filter(([h]) => !["/admin", "/admin/orders", "/admin/deliveries", "/admin/boxes", "/admin/settings"].includes(h)).map(([href, label]) => <Link key={href} href={href} className="chip shrink-0">{label}</Link>)}
          </nav>
        </header>
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface text-[11px] md:hidden">
        {NAV.filter(([h]) => ["/admin", "/admin/orders", "/admin/deliveries", "/admin/boxes", "/admin/settings"].includes(h)).map(([href, label, Icon]) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-2"><Icon size={20} strokeWidth={1.75} />{label}</Link>
        ))}
      </nav>
    </div>
  );
}
