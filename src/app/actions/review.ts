"use server";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveImage } from "@/lib/uploads";
import { notify } from "@/lib/notify";

export type ReviewState = { ok?: boolean; error?: string };

export async function submitReview(_: ReviewState, fd: FormData): Promise<ReviewState> {
  const token = String(fd.get("token") ?? "");
  const boxId = Number(fd.get("boxId")) || null;
  const rating = Number(fd.get("rating"));
  const body = String(fd.get("body") ?? "").trim().slice(0, 2000);
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  if (!(rating >= 1 && rating <= 5)) return { error: "Choose a star rating." };
  if (!name) return { error: "Add the name to show with your review." };
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.reviewToken, token));
  if (!o || o.status !== "DELIVERED") return { error: "Reviews open once your order is delivered." };
  const dup = await db.select({ id: schema.reviews.id }).from(schema.reviews)
    .where(and(eq(schema.reviews.orderId, o.id), boxId ? eq(schema.reviews.boxId, boxId) : isNull(schema.reviews.boxId)));
  if (dup.length) return { error: "You've already reviewed this one. Thank you!" };
  try {
    const photo = await saveImage(fd.get("photo") as File | null, "reviews", 1200);
    await db.insert(schema.reviews).values({ orderId: o.id, boxId, name, rating, body: body || null, photo });
  } catch (e) {
    return { error: (e as Error).message };
  }
  await notify("review_submitted", { enquiryKind: String(rating), enquiryName: name, orderId: o.id, number: o.number });
  return { ok: true };
}
