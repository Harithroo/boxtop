import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Guards the back office. Pages and actions also call requireAdmin() themselves.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const token = req.cookies.get("bt_admin")?.value;
  let ok = false;
  if (token) {
    try { await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET ?? "")); ok = true; } catch {}
  }
  if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
