"use client";
import { useActionState } from "react";
import { saveReminder } from "@/app/actions/account";

export function ReminderForm({ hasEmail }: { hasEmail: boolean }) {
  const [s, action, pending] = useActionState(saveReminder, {});
  return (
    <form action={action} key={s.ok} className="card grid gap-3 p-5 sm:grid-cols-2">
      <div><label className="label">Whose day?</label><input name="name" className="input" placeholder="Amma" required /></div>
      <div><label className="label">Occasion</label><input name="occasion" className="input" placeholder="Birthday" list="occasions" /><datalist id="occasions"><option>Birthday</option><option>Anniversary</option><option>Graduation</option></datalist></div>
      <div><label className="label">Date</label><input name="date" type="date" className="input" required /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Remind me</label><select name="daysBefore" className="input" defaultValue="7"><option value="3">3 days before</option><option value="7">A week before</option><option value="14">2 weeks before</option></select></div>
        <div><label className="label">By</label><select name="channel" className="input" defaultValue={hasEmail ? "EMAIL" : "SMS"}><option value="EMAIL">Email</option><option value="SMS">SMS</option></select></div>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending}>Save reminder</button>
        {s.error && <span role="alert" className="text-sm text-accent-text">{s.error}</span>}
        {s.ok && <span className="text-sm text-success">Saved. We&apos;ll remind you every year.</span>}
      </div>
    </form>
  );
}
