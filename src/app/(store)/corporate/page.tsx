import Link from "next/link";
import { QuoteRequestForm } from "@/components/CorporateForms";
export const metadata = { title: "Corporate gifting", description: "Gift boxes for staff, clients and events: budget tiers, logo sleeves and delivery to many addresses across Sri Lanka." };
const TIERS = [["Essentials", "Under Rs. 5,000", "Tea, treats and a card with your logo."], ["Signature", "Rs. 5,000–10,000", "Curated boxes from Sri Lankan makers."], ["Premium", "Rs. 10,000+", "Hampers for key clients and leadership."]];
export default function Corporate() {
  return (
    <div className="container-bt py-8">
      <p className="eyebrow">Corporate gifting</p>
      <h1 className="h1 max-w-2xl">Gifts your team and clients will remember</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">For Avurudu, Christmas, staff milestones and client thank-yous. Your logo on the sleeve and card, and delivery to one office or many homes.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {TIERS.map(([n, p, d]) => <div key={n} className="card p-5"><p className="font-bold">{n}</p><p className="price mt-1">{p}</p><p className="hint mt-2">{d}</p></div>)}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div><h2 className="h2 mb-1">Ask for a quote</h2><p className="hint mb-3">We send a quote you can accept online.</p><QuoteRequestForm /></div>
        <aside className="card h-fit p-5">
          <h2 className="h2">Already know which box?</h2>
          <p className="mt-1 text-sm text-ink-muted">Order one box for many people in one go. Upload a list of addresses and bulk prices apply automatically.</p>
          <Link href="/corporate/bulk" className="btn-primary mt-4">Start a bulk order</Link>
        </aside>
      </div>
    </div>
  );
}
