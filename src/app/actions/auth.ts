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
