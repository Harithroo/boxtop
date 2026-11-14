import "@/styles/site.css";
import "@/styles/footer.css";
import { cartCount } from "@/lib/cart";
import { priceText, rs } from "@/lib/format";
import { getSiteData } from "@/lib/home-data";
import { SiteFooter, type FooterData } from "@/components/site/SiteFooter";
import { SiteHeader, type NavData } from "@/components/site/SiteHeader";
import { ToTop } from "@/components/site/ToTop";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [site, count] = await Promise.all([getSiteData(), cartCount()]);
  const nav: NavData = {
    wa: site.wa, waDisplay: site.waDisplay, instagram: site.instagram, igHandle: site.igHandle, facebook: site.facebook, payLine: site.payLine,
    announcements: site.announcements, abroad: site.abroad, cartCount: count, shelfCount: site.shelfCount, chapters: site.chapters,
    featured: site.featured.map((b) => ({ id: b.id, slug: b.slug, name: b.name, img: b.img!, priceText: priceText({ price: b.price ?? 0, priceOnRequest: b.price === null }) })),
    occasions: site.occasions.map((o) => ({ slug: o.slug, name: o.name, when: o.when, dateShort: o.dateShort, img: o.img, href: o.href })),
    menuPics: site.menuPics,
  };
  const footer: FooterData = {
    wa: site.wa, waDisplay: site.waDisplay, instagram: site.instagram, facebook: site.facebook,
    fromPrice: site.minPrice === null ? null : rs(site.minPrice), nextName: site.occasions[0]?.short ?? null, abroad: site.abroad,
    year: site.today.slice(0, 4),
    // occasions have their own column, so the shop column takes the other shelves
    shop: site.chapters.filter((c) => !c.href.startsWith("/occasion/")).slice(0, 3).map((c) => ({ name: c.name, href: c.href })),
  };
  return (
    // The home page's scripts park state classes on this element (intro-on, menu-open, cl-pin …), some before React
    // wakes up, so React is told not to mind the difference.
    <div id="site" className="site" suppressHydrationWarning>
      <SiteHeader nav={nav} />
      <main className="site-main">{children}</main>
      <SiteFooter data={footer} />
      <ToTop />
    </div>
  );
}
