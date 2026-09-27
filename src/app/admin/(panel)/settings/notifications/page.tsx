import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings, CHANNELS, EVENTS, type NotifyEvent } from "@/lib/settings";
import { saveNotifications, testSend, generatePushKeys } from "@/app/actions/admin-settings";
import { SForm, ActionButton } from "@/components/admin/SForm";
import { PushEnable } from "@/components/admin/PushEnable";

export const dynamic = "force-dynamic";
const LABEL = { email: "Email", sms: "SMS", push: "Push", whatsapp: "WhatsApp" } as const;
const CUSTOMER_EVENTS: NotifyEvent[] = ["order_placed", "order_confirmed", "order_packed", "order_dispatched", "order_delivered", "order_cancelled", "quote_sent", "voucher_issued", "reminder"];

export default async function Notifications() {
  await requireAdmin();
  const s = await getSettings();
  const n = s.notifications;
  const log = await db.select().from(schema.notificationJobs).orderBy(desc(schema.notificationJobs.id)).limit(15);
  const mask = (v: string) => (v ? "••••••" : "");

  return (
    <div className="space-y-5">
      <h1 className="h1">Notifications</h1>
      <p className="hint max-w-2xl">Choose which messages go out on which channel. Several at once is fine. Messages queue and send every minute, so a failed SMS never blocks an order. Automatic WhatsApp needs the WhatsApp Cloud API (phase 2); until then use the &ldquo;Send update on WhatsApp&rdquo; button on each order.</p>
      <SForm action={saveNotifications}>
        <section className="card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Owner email (alerts)</label><input name="ownerEmail" type="email" defaultValue={n.ownerEmail} className="input" /></div>
            <div><label className="label">Owner mobile (SMS alerts)</label><input name="ownerPhone" defaultValue={n.ownerPhone} className="input" /></div>
          </div>
        </section>
        <section className="card overflow-x-auto p-5">
          <h2 className="h2 mb-3">Who gets what</h2>
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="text-left"><th className="pb-2">Event</th><th className="pb-2">To you</th><th className="pb-2">To the customer</th></tr></thead>
            <tbody className="divide-y divide-line">
              {(Object.keys(EVENTS) as NotifyEvent[]).map((ev) => (
                <tr key={ev}>
                  <td className="py-2 pr-3 font-medium">{EVENTS[ev]}</td>
                  {(["owner", "customer"] as const).map((aud) => aud === "owner" && ev === "reminder" ? <td key={aud} className="py-2"><span className="hint">–</span></td> : (
                    <td key={aud} className="py-2">
                      {aud === "customer" && !CUSTOMER_EVENTS.includes(ev) ? <span className="hint">–</span> : (
                        <div className="flex flex-wrap gap-3">{CHANNELS.filter((c) => !(c === "whatsapp")).map((c) => (
                          <label key={c} className="flex items-center gap-1"><input type="checkbox" name={`${ev}.${aud}.${c}`} defaultChecked={n.events[ev][aud].includes(c)} />{LABEL[c]}</label>
                        ))}</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="h2">Customer message wording</h2>
          <p className="hint">Leave empty for the default. Placeholders: {"{name} {number} {total} {date} {slot} {track} {review} {link} {code} {amount} {text}"}</p>
          {CUSTOMER_EVENTS.map((ev) => (
            <div key={ev}><label className="label">{EVENTS[ev]}</label><input name={`tpl.${ev}`} defaultValue={n.templates[ev] ?? ""} className="input text-sm" /></div>
          ))}
        </section>
        <section className="card grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="h2 sm:col-span-2">Email (SMTP from your cPanel mailbox)</h2>
          <div><label className="label">Server</label><input name="smtpHost" defaultValue={n.email.host} className="input" placeholder="mail.box-top.lk" /></div>
          <div><label className="label">Port</label><input name="smtpPort" type="number" defaultValue={n.email.port} className="input" /></div>
          <div><label className="label">Username</label><input name="smtpUser" defaultValue={n.email.user} className="input" placeholder="hello@box-top.lk" /></div>
          <div><label className="label">Password</label><input name="smtpPass" type="password" defaultValue={mask(n.email.pass)} className="input" /></div>
          <div className="sm:col-span-2"><label className="label">From</label><input name="smtpFrom" defaultValue={n.email.from} className="input" /></div>
        </section>
        <section className="card grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="h2 sm:col-span-2">SMS gateway</h2>
          <div><label className="label">Provider</label><select name="smsProvider" defaultValue={n.sms.provider} className="input"><option value="none">None</option><option value="notify.lk">Notify.lk</option><option value="text.lk">Text.lk</option></select></div>
          <div><label className="label">Sender ID</label><input name="smsSenderId" defaultValue={n.sms.senderId} className="input" placeholder="BOXTOP (after approval)" /></div>
          <div><label className="label">User ID (Notify.lk)</label><input name="smsUserId" defaultValue={n.sms.userId} className="input" /></div>
          <div><label className="label">API key</label><input name="smsApiKey" type="password" defaultValue={mask(n.sms.apiKey)} className="input" /></div>
        </section>
      </SForm>

      <section className="card space-y-3 p-5">
        <h2 className="h2">Push alerts on your phone</h2>
        <p className="hint">Install the back office on your phone (browser menu → Add to Home Screen), then turn alerts on. On iPhone this only works from the Home Screen app.</p>
        {n.push.publicKey ? <PushEnable publicKey={n.push.publicKey} /> : <ActionButton action={generatePushKeys} label="Create push keys" />}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="h2">Send a test</h2>
        <div className="flex flex-wrap gap-4">
          {["email", "sms", "push"].map((c) => <SForm key={c} action={testSend} label={`Test ${c}`}><input type="hidden" name="channel" value={c} /></SForm>)}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="h2 mb-3">Recent messages</h2>
        <ul className="divide-y divide-line text-sm">
          {log.map((j) => (
            <li key={j.id} className="flex flex-wrap gap-2 py-2">
              <span className={`font-bold ${j.status === "FAILED" ? "text-accent-text" : j.status === "SENT" ? "text-success" : ""}`}>{j.status.toLowerCase()}</span>
              <span>{j.channel.toLowerCase()} → {j.to}</span><span className="hint">{j.subject}</span>
              {j.error && <span className="hint w-full text-accent-text">{j.error} (tries: {j.attempts})</span>}
            </li>
          ))}
          {!log.length && <li className="hint">Nothing sent yet.</li>}
        </ul>
      </section>
    </div>
  );
}
