export const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-LK")}`;

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

export function waLink(phone: string, text: string) {
  return `https://wa.me/${lkPhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Placed", CONFIRMED: "Confirmed", PACKED: "Packed", DISPATCHED: "On the way",
  DELIVERED: "Delivered", CANCELLED: "Cancelled", REFUNDED: "Refunded",
};
