import { redirect } from "next/navigation";
import { loadCart } from "@/lib/cart";
import { getZones } from "@/lib/delivery";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function Checkout() {
  const cart = await loadCart();
  if (cart.empty) redirect("/cart");
  const [zones, s] = await Promise.all([getZones(), getSettings()]);
  return (
    <div className="container-bt py-8">
      <h1 className="h1 mb-6">Checkout</h1>
      <CheckoutForm
        zones={zones.map((z) => ({ id: z.id, name: z.name, cities: z.cities, fee: z.fee, codAllowed: z.codAllowed }))}
        subtotal={cart.subtotal} lead={cart.leadDays} sameDay={cart.sameDayOk}
        initial={{ zoneId: cart.cookie.zoneId, date: cart.cookie.date, slotId: cart.cookie.slotId }}
        cod={s.payments.cod} bank={{ enabled: s.payments.bank.enabled }}
        channels={[...new Set(Object.values(s.notifications.events).flatMap((e) => e.customer))]}
      />
    </div>
  );
}
