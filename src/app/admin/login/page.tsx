"use client";
import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";

export default function Login() {
  const [s, action, pending] = useActionState(login, {});
  // controlled so the values survive React's form reset when the 2FA step appears
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="grid min-h-screen place-items-center bg-page px-4">
      <form action={action} className="card w-full max-w-sm space-y-4 p-6">
        <div className="text-center"><p className="wordmark text-brand">BOXTOP</p><p className="hint">Back office</p></div>
        <div className={s.needCode ? "hidden" : ""}>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="label mt-3" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {s.needCode && (
          <div>
            <label className="label" htmlFor="code">6-digit code from your authenticator app</label>
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" className="input text-center text-xl tracking-[0.3em]" autoFocus />
          </div>
        )}
        {s.error && <p role="alert" className="text-sm text-accent-text">{s.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
