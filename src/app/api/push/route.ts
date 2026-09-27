import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { sub, audience, orderNumber } = (await req.json()) as { sub: { endpoint: string; keys: unknown }; audience: "OWNER" | "CUSTOMER"; orderNumber?: string };
  if (!sub?.endpoint || !sub.keys) return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  let orderId: number | null = null;
  if (audience === "OWNER") {
    if (!(await getSession())) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  } else {
    if (!orderNumber || (await cookies()).get(`bt_o_${orderNumber}`)?.value !== "1") return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    const [o] = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.number, orderNumber));
    orderId = o?.id ?? null;
  }
  await db.insert(schema.pushSubscriptions).values({ endpoint: sub.endpoint, keys: sub.keys, audience, orderId })
    .onDuplicateKeyUpdate({ set: { keys: sub.keys, audience, orderId } });
  return NextResponse.json({ ok: true });
}
