import Link from "next/link";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { totpUri } from "@/lib/totp";
import { saveStore, savePayments, changePassword, startTotp, confirmTotp, disableTotp } from "@/app/actions/admin-settings";
import { SForm, ActionButton } from "@/components/admin/SForm";
import { BankAccountsEditor } from "@/components/admin/BankAccountsEditor";

export const dynamic = "force-dynamic";

const F = ({ label, name, v, type = "text", ph, hint }: { label: string; name: string; v?: string | number; type?: string; ph?: string; hint?: string }) => (
  <div><label className="label" htmlFor={name}>{label}</label><input id={name} name={name} type={type} defaultValue={v} placeholder={ph} className="input" />{hint && <p className="hint mt-1">{hint}</p>}</div>
);

export default async function Settings() {
  const sess = await requireAdmin();
  const s = await getSettings();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, sess.uid));
  const qr = u?.totpSecret && !u.totpEnabled ? await QRCode.toDataURL(totpUri(u.totpSecret, u.email), { margin: 1, width: 180 }) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1 mr-auto">Settings</h1>
        <Link href="/admin/settings/delivery" className="btn-outline btn-sm">Delivery zones and slots</Link>
        <Link href="/admin/settings/notifications" className="btn-outline btn-sm">Notifications</Link>
      </div>

      <section className="card p-5">
        <h2 className="h2 mb-3">Store</h2>
        <SForm action={saveStore}>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Store name" name="name" v={s.store.name} />
            <F label="Email" name="email" v={s.store.email} type="email" />
            <F label="Phone (shown on the site)" name="phone" v={s.store.phone} ph="077 123 4567" />
            <F label="WhatsApp number" name="whatsapp" v={s.store.whatsapp} ph="077 123 4567" hint="Used for every Order on WhatsApp button. Use one number everywhere." />
            <F label="Address" name="address" v={s.store.address} />
            <F label="Opening hours" name="hours" v={s.store.hours} />
          </div>
          <F label="Announcement bar" name="announcement" v={s.store.announcement} hint="Leave empty to hide." />
          <div className="grid gap-3 sm:grid-cols-3">
            <F label="Facebook link" name="facebook" v={s.store.facebook} />
            <F label="Instagram link" name="instagram" v={s.store.instagram} />
            <F label="TikTok link" name="tiktok" v={s.store.tiktok} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="sameDayEnabled" defaultChecked={s.delivery.sameDayEnabled} className="h-4 w-4" /> Same-day delivery on (switch off on busy days)</label>
            <F label="How many days ahead customers can book" name="maxDaysAhead" v={s.delivery.maxDaysAhead} type="number" />
          </div>
        </SForm>
      </section>

      <section className="card p-5">
        <h2 className="h2 mb-3">Payments</h2>
        <SForm action={savePayments}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="cod" defaultChecked={s.payments.cod.enabled} className="h-4 w-4" /> Cash on delivery</label>
            <F label="COD up to (Rs., 0 = no limit)" name="codMax" v={s.payments.cod.maxOrder} type="number" hint="Which areas allow COD is set per delivery zone." />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="bank" defaultChecked={s.payments.bank.enabled} className="h-4 w-4" /> Bank transfer</label>
          <BankAccountsEditor initial={s.payments.bank.accounts} />
          <div><label className="label" htmlFor="instructions">Instructions shown to the customer</label><textarea id="instructions" name="instructions" defaultValue={s.payments.bank.instructions} rows={2} className="input" /></div>
        </SForm>
      </section>

      <section className="card p-5">
        <h2 className="h2 mb-3">Your account</h2>
        <p className="mb-3 text-sm">Signed in as <b>{u?.email}</b></p>
        <SForm action={changePassword} label="Change password" className="max-w-sm">
          <input name="current" type="password" placeholder="Current password" className="input" autoComplete="current-password" required />
          <input name="next" type="password" placeholder="New password (10+ characters)" className="input" autoComplete="new-password" required />
        </SForm>
        <div className="mt-6 border-t border-line pt-4">
          <h3 className="font-bold">Two-step sign-in</h3>
          {u?.totpEnabled ? (
            <div className="mt-2 flex items-center gap-3 text-sm"><span className="text-success">On. You&apos;ll need a code from your authenticator app to sign in.</span><ActionButton action={disableTotp} label="Turn off" /></div>
          ) : qr ? (
            <div className="mt-2 flex flex-wrap items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code for your authenticator app" className="h-44 w-44 rounded border border-line" />
              <div className="max-w-sm space-y-2 text-sm">
                <p>Scan with Google Authenticator or Microsoft Authenticator, then enter the 6-digit code.</p>
                <p className="hint break-all">Key: {u!.totpSecret}</p>
                <SForm action={confirmTotp} label="Turn on"><input name="code" inputMode="numeric" placeholder="123456" className="input w-40" required /></SForm>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3 text-sm"><span className="hint">Protects the back office if your password leaks.</span><ActionButton action={startTotp} label="Set up" /></div>
          )}
        </div>
      </section>
    </div>
  );
}
