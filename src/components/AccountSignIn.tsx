"use client";
import { useActionState } from "react";
import { sendCode, checkCode, completeProfile, type AState } from "@/app/actions/account";

export function AccountSignIn() {
  const [s1, send, p1] = useActionState<AState, FormData>(sendCode, {});
  const [s2, check, p2] = useActionState<AState, FormData>(checkCode, {});
  const [s3, finish, p3] = useActionState<AState, FormData>(completeProfile, {});
  const step = s3.step ?? s2.step ?? s1.step;
  const target = s2.target ?? s1.target ?? "";

  if (step === "profile" || s3.error)
    return (
      <form action={finish} className="card max-w-md space-y-3 p-5">
        <h2 className="h2">Welcome to Boxtop</h2>
        <div><label className="label">Your name</label><input name="name" className="input" required /></div>
        {target.includes("@") ? <div><label className="label">Mobile number</label><input name="phone" className="input" inputMode="tel" required /></div>
          : <div><label className="label">Email <span className="font-normal text-ink-muted">(for reminders)</span></label><input name="email" type="email" className="input" /></div>}
        {s3.error && <p role="alert" className="text-sm text-accent-text">{s3.error}</p>}
        <button className="btn-primary w-full" disabled={p3}>Create account</button>
      </form>
    );

  if (step === "code")
    return (
      <form action={check} className="card max-w-md space-y-3 p-5">
        <input type="hidden" name="target" value={target} />
        <p className="text-sm">We sent a 6-digit code to <b>{target.includes("@") ? target : `+${target}`}</b>.</p>
        <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input text-center text-xl tracking-[0.3em]" aria-label="Code" required autoFocus />
        {s2.error && <p role="alert" className="text-sm text-accent-text">{s2.error}</p>}
        <button className="btn-primary w-full" disabled={p2}>Sign in</button>
      </form>
    );

  return (
    <form action={send} className="card max-w-md space-y-3 p-5">
      <label className="label" htmlFor="target">Email or mobile number</label>
      <input id="target" name="target" className="input" placeholder="you@example.com or 077 123 4567" required />
      {s1.error && <p role="alert" className="text-sm text-accent-text">{s1.error}</p>}
      <button className="btn-primary w-full" disabled={p1}>Send me a code</button>
      <p className="hint">No password needed. Use the email or number you ordered with to see your orders.</p>
    </form>
  );
}
