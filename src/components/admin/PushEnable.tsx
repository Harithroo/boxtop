"use client";
import { useState } from "react";

function b64ToUint8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushEnable({ publicKey, audience = "OWNER", orderNumber }: { publicKey: string; audience?: "OWNER" | "CUSTOMER"; orderNumber?: string }) {
  const [msg, setMsg] = useState("");
  async function enable() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setMsg("This browser doesn't support push. On iPhone, add the site to your Home Screen first.");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setMsg("Notifications are blocked for this site in your browser settings.");
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(publicKey) });
      const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sub, audience, orderNumber }) });
      setMsg(r.ok ? "Alerts are on for this device." : "Couldn't save this device. Try again.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={enable} className="btn-primary btn-sm">{audience === "OWNER" ? "Turn on alerts on this device" : "Get updates on this phone"}</button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
