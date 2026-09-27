import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/format";
import { EnquiryForm } from "@/components/EnquiryForm";
export const metadata = { title: "Contact" };
export default async function Contact() {
  const s = (await getSettings()).store;
  return (
    <div className="container-bt grid gap-8 py-8 md:grid-cols-2">
      <div>
        <h1 className="h1">Contact us</h1>
        <dl className="mt-6 space-y-3">
          {s.whatsapp && <div><dt className="label">WhatsApp</dt><dd><a className="font-bold text-brand" href={waLink(s.whatsapp, "Hi Boxtop")}>{s.whatsapp}</a></dd></div>}
          {s.phone && <div><dt className="label">Phone</dt><dd><a href={`tel:${s.phone}`}>{s.phone}</a></dd></div>}
          {s.email && <div><dt className="label">Email</dt><dd><a href={`mailto:${s.email}`}>{s.email}</a></dd></div>}
          <div><dt className="label">Shop</dt><dd>{s.address}</dd></div>
          <div><dt className="label">Hours</dt><dd>{s.hours}</dd></div>
        </dl>
      </div>
      <EnquiryForm kind="CONTACT" />
    </div>
  );
}
