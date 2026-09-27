"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db";
import { createSession, destroySession, throttle, clearThrottle } from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";

export type LoginState = { error?: string; needCode?: boolean };

export async function login(_: LoginState, fd: FormData): Promise<LoginState> {
  if ((process.env.SESSION_SECRET ?? "").length < 32) {
    console.error("[login] SESSION_SECRET is missing or shorter than 32 characters");
    return { error: "The server isn't fully set up yet: SESSION_SECRET is missing. Add it in the hosting settings and restart the app." };
  }
  try {
    return await loginInner(fd);
  } catch (e) {
    // redirect() throws on purpose after a successful sign-in; let it through
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("[login] failed:", e);
    return { error: "Sign-in failed on the server. The reason is in the app's error log (stderr.log)." };
  }
}

async function loginInner(fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const code = String(fd.get("code") ?? "").replace(/\s/g, "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  const key = `${ip}|${email}`;
  if (!throttle(key)) return { error: "Too many attempts. Try again in 15 minutes." };
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return { error: "Wrong email or password." };
  if (u.totpEnabled && u.totpSecret) {
    if (!code) return { needCode: true };
    if (!verifyTotp(u.totpSecret, code)) return { needCode: true, error: "That code didn't match. Try the newest one." };
  }
  clearThrottle(key);
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, u.id));
  await createSession({ uid: u.id, name: u.name, role: u.role });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
