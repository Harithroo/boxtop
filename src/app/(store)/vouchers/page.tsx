import { BuyVoucherForm } from "@/components/VoucherForms";
export const metadata = { title: "Gift vouchers", description: "Let them choose: a Boxtop gift voucher for any box, delivered by email." };
export default function Vouchers() {
  return (
    <div className="container-bt grid gap-8 py-8 md:grid-cols-[1fr_1.3fr]">
      <div>
        <p className="eyebrow">Gift vouchers</p>
        <h1 className="h1">Let them choose their box</h1>
        <p className="mt-3 text-ink-muted">A Boxtop voucher works on any box, the box builder and extras. They can use it across several orders until the balance runs out.</p>
        <div className="ribbon-frame mt-6 p-8"><p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-soft">Gift voucher</p><p className="wordmark mt-2 text-3xl">BOXTOP</p><p className="mt-6 font-mono text-lg tracking-widest">BT-XXXX-XXXX</p></div>
      </div>
      <BuyVoucherForm />
    </div>
  );
}
