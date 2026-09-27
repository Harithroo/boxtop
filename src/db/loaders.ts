// Plain-SQL loaders for nested data.
// Don't use Drizzle's db.query...{ with } API in this project: it generates LATERAL joins,
// which MariaDB (common on cPanel hosts) does not support.
import "server-only";
import { asc, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db, schema } from "./index";

type Box = typeof schema.boxes.$inferSelect;
type Img = typeof schema.boxImages.$inferSelect;

export async function attachImages<T extends Pick<Box, "id">>(boxes: T[], firstOnly = false): Promise<(T & { images: Img[] })[]> {
  if (!boxes.length) return [];
  const imgs = await db.select().from(schema.boxImages).where(inArray(schema.boxImages.boxId, boxes.map((b) => b.id))).orderBy(asc(schema.boxImages.sortOrder), asc(schema.boxImages.id));
  return boxes.map((b) => {
    const mine = imgs.filter((i) => i.boxId === b.id);
    return { ...b, images: firstOnly ? mine.slice(0, 1) : mine };
  });
}

export async function loadBoxes(where: SQL | undefined, orderBy: SQL[], limit?: number, firstImageOnly = true) {
  const q = db.select().from(schema.boxes).where(where).orderBy(...orderBy);
  const rows = limit ? await q.limit(limit) : await q;
  return attachImages(rows, firstImageOnly);
}

export async function loadBoxFull(where: SQL) {
  const [box] = await db.select().from(schema.boxes).where(where).limit(1);
  if (!box) return null;
  const [withImgs] = await attachImages([box]);
  const contentRows = await db
    .select({ c: schema.boxContents, item: schema.items, maker: schema.makers })
    .from(schema.boxContents)
    .innerJoin(schema.items, eq(schema.items.id, schema.boxContents.itemId))
    .leftJoin(schema.makers, eq(schema.makers.id, schema.items.makerId))
    .where(eq(schema.boxContents.boxId, box.id));
  const colRows = await db
    .select({ bc: schema.boxCollections, collection: schema.collections })
    .from(schema.boxCollections)
    .innerJoin(schema.collections, eq(schema.collections.id, schema.boxCollections.collectionId))
    .where(eq(schema.boxCollections.boxId, box.id));
  return {
    ...withImgs,
    contents: contentRows.map((r) => ({ ...r.c, item: { ...r.item, maker: r.maker } })),
    collections: colRows.map((r) => ({ ...r.bc, collection: r.collection })),
  };
}

export async function loadOrder(where: SQL) {
  const [o] = await db.select().from(schema.orders).where(where).limit(1);
  if (!o) return null;
  const [[customer], [recipient], lines, payments, events, [del]] = await Promise.all([
    db.select().from(schema.customers).where(eq(schema.customers.id, o.customerId)),
    db.select().from(schema.recipients).where(eq(schema.recipients.id, o.recipientId)),
    db.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, o.id)).orderBy(asc(schema.orderLines.id)),
    db.select().from(schema.payments).where(eq(schema.payments.orderId, o.id)).orderBy(asc(schema.payments.id)),
    db.select().from(schema.orderEvents).where(eq(schema.orderEvents.orderId, o.id)).orderBy(desc(schema.orderEvents.id)),
    db.select({ d: schema.deliveries, slot: schema.deliverySlots, zone: schema.deliveryZones })
      .from(schema.deliveries)
      .leftJoin(schema.deliverySlots, eq(schema.deliverySlots.id, schema.deliveries.slotId))
      .leftJoin(schema.deliveryZones, eq(schema.deliveryZones.id, schema.deliveries.zoneId))
      .where(eq(schema.deliveries.orderId, o.id)),
  ]);
  return {
    ...o, customer, recipient, lines, payments, events,
    delivery: del ? { ...del.d, slot: del.slot, zone: del.zone } : null,
  };
}
