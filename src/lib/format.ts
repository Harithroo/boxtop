// "Rs 5,000". The locale is pinned so the server and the browser print the same string.
export const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-US")}`;

/** A box's price as shown to customers: boxes sold on request say so instead of a number. */
export const priceText = (b: { price: number; priceOnRequest?: boolean | null }) => (b.priceOnRequest ? "Ask for price" : rs(b.price));

/** "0743519426" or "94743519426" -> "074 351 9426" for display. Anything unexpected is returned as typed. */
export function prettyPhone(input: string) {
  const d = lkPhone(input);
  return /^94\d{9}$/.test(d) ? `0${d.slice(2, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : input.trim();
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

/** Normalise a Sri Lankan phone to 94XXXXXXXXX (used for wa.me and SMS). */
export function lkPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("94")) return d;
  if (d.startsWith("0")) return "94" + d.slice(1);
  if (d.length === 9) return "94" + d;
  return d;
}

export const isLkMobile = (input: string) => /^947\d{8}$/.test(lkPhone(input));

export function waLink(phone: string, text?: string) {
  return `https://wa.me/${lkPhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "@box.top_" from an Instagram profile link. */
export function igHandle(url: string) {
  const m = url.match(/instagram\.com\/([^/?#]+)/i);
  return m ? `@${m[1]}` : "";
}

export function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Placed", CONFIRMED: "Confirmed", PACKED: "Packed", DISPATCHED: "On the way",
  DELIVERED: "Delivered", CANCELLED: "Cancelled", REFUNDED: "Refunded",
};
