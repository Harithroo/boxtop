import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "bt_admin";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

export type AdminSession = { uid: number; name: string; role: string };

export async function createSession(s: AdminSession) {
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}

export async function verifyToken(token?: string): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { uid: Number(payload.uid), name: String(payload.name), role: String(payload.role) };
  } catch {
    return null;
  }
}

export async function getSession() {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const ADMIN_COOKIE = COOKIE;

// Simple in-memory login throttle (one Node process on cPanel).
const attempts = new Map<string, { n: number; until: number }>();
export function throttle(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (a && a.until > now && a.n >= 5) return false;
  if (!a || a.until < now) attempts.set(key, { n: 1, until: now + 15 * 60_000 });
  else a.n++;
  return true;
}
export const clearThrottle = (key: string) => attempts.delete(key);
