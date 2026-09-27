"use client";
import { useActionState } from "react";
import { submitEnquiry } from "@/app/actions/enquiry";

export function EnquiryForm({ kind }: { kind: "CUSTOM" | "CORPORATE" | "CONTACT" }) {
  const [s, action, pending] = useActionState(submitEnquiry, {});
  if (s.ok)
    return (
      <div className="card p-6">
        <h2 className="h2">Thank you, we&apos;ve got it</h2>
        <p className="mt-2 text-ink-muted">We&apos;ll reply on WhatsApp{kind === "CUSTOM" ? " with ideas and a price, and send a photo of the packed box before it goes out" : " soon"}.</p>
      </div>
    );
  return (
    <form action={action} className="card space-y-3 p-5" encType="multipart/form-data">
      <input type="hidden" name="kind" value={kind} />
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="e-name">Your name</label><input id="e-name" name="name" className="input" required /></div>
        <div><label className="label" htmlFor="e-phone">WhatsApp / mobile</label><input id="e-phone" name="phone" className="input" inputMode="tel" required /></div>
      </div>
      {kind === "CORPORATE" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="e-company">Company</label><input id="e-company" name="company" className="input" /></div>
          <div><label className="label" htmlFor="e-qty">How many boxes?</label><input id="e-qty" name="quantity" type="number" min={1} className="input" /></div>
        </div>
      )}
      {kind !== "CONTACT" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label" htmlFor="e-occ">Occasion</label><input id="e-occ" name="occasion" className="input" placeholder={kind === "CORPORATE" ? "Staff Avurudu gifts" : "Birthday"} /></div>
          <div>
            <label className="label" htmlFor="e-budget">Budget {kind === "CORPORATE" && "per box"}</label>
            <select id="e-budget" name="budget" className="input">
              <option value="">Choose</option><option>Under Rs. 5,000</option><option>Rs. 5,000–10,000</option><option>Rs. 10,000–20,000</option><option>Rs. 20,000+</option>
            </select>
          </div>
          <div><label className="label" htmlFor="e-date">Needed by</label><input id="e-date" name="date" type="date" className="input" /></div>
        </div>
      )}
      <div><label className="label" htmlFor="e-email">Email <span className="font-normal text-ink-muted">(optional)</span></label><input id="e-email" name="email" type="email" className="input" /></div>
      <div>
        <label className="label" htmlFor="e-msg">{kind === "CUSTOM" ? "Tell us about them: what they love, colours, anything to include" : kind === "CORPORATE" ? "What do you have in mind? Logo, delivery to one or many addresses…" : "Message"}</label>
        <textarea id="e-msg" name="message" rows={4} className="input" required />
      </div>
      {kind !== "CONTACT" && <div><label className="label" htmlFor="e-photo">Reference photo <span className="font-normal text-ink-muted">(optional)</span></label><input id="e-photo" name="photo" type="file" accept="image/*" className="input py-2" /></div>}
      {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Send"}</button>
    </form>
  );
}
