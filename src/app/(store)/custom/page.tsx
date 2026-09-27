import { EnquiryForm } from "@/components/EnquiryForm";
export const metadata = { title: "Custom gift box", description: "Tell us who it's for and we'll build a custom gift box, with a photo before it goes out." };
export default function Custom() {
  return (
    <div className="container-bt grid gap-8 py-8 md:grid-cols-[1fr_1.3fr]">
      <div>
        <p className="eyebrow">Custom order</p>
        <h1 className="h1">Tell us who it&apos;s for</h1>
        <p className="mt-3 text-ink-muted">Share the occasion, your budget and what they love. We&apos;ll reply on WhatsApp with ideas and a price, and send a photo of the packed box before it goes out.</p>
        <ol className="mt-6 space-y-3 text-sm">
          {["Send the details here", "We suggest a box and a price on WhatsApp", "You approve, pay, and we deliver on your date"].map((t, i) => (
            <li key={i} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent font-bold text-white">{i + 1}</span>{t}</li>
          ))}
        </ol>
      </div>
      <EnquiryForm kind="CUSTOM" />
    </div>
  );
}
