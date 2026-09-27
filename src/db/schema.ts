// Boxtop phase 1 data model (MySQL). Prices are whole LKR.
import { relations } from "drizzle-orm";
import {
  mysqlTable, int, varchar, text, boolean, datetime, date, json, mysqlEnum,
  primaryKey, uniqueIndex, index,
} from "drizzle-orm/mysql-core";

const now = () => datetime("created_at", { mode: "date" }).notNull().$defaultFn(() => new Date());

// ---------- Settings ----------
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// ---------- Back office ----------
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("owner"),
  totpSecret: varchar("totp_secret", { length: 64 }),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
  createdAt: now(),
});

// ---------- Catalogue ----------
export const boxStatus = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const boxes = mysqlTable("boxes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  code: varchar("code", { length: 20 }).unique(), // "P15" package short code
  summary: varchar("summary", { length: 255 }), // contents line on cards
  description: text("description"),
  price: int("price").notNull(),
  compareAtPrice: int("compare_at_price"),
  status: mysqlEnum("status", boxStatus).notNull().default("DRAFT"),
  badge: varchar("badge", { length: 40 }),
  featured: boolean("featured").notNull().default(false),
  sameDay: boolean("same_day").notNull().default(true),
  leadDays: int("lead_days").notNull().default(0),
  stock: int("stock"), // null = not tracked
  seoTitle: varchar("seo_title", { length: 190 }),
  seoDescription: varchar("seo_description", { length: 300 }),
  tags: varchar("tags", { length: 500 }), // comma separated, used by the gift finder
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: now(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => [index("boxes_status_idx").on(t.status)]);

export const boxImages = mysqlTable("box_images", {
  id: int("id").autoincrement().primaryKey(),
  boxId: int("box_id").notNull().references(() => boxes.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 255 }).notNull(),
  alt: varchar("alt", { length: 190 }),
  sortOrder: int("sort_order").notNull().default(0),
});

export const makers = mysqlTable("makers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  place: varchar("place", { length: 120 }),
  story: text("story"),
  photo: varchar("photo", { length: 255 }),
});

export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  size: varchar("size", { length: 60 }),
  cost: int("cost"),
  stock: int("stock"),
  makerId: int("maker_id").references(() => makers.id, { onDelete: "set null" }),
  // build-your-own pool
  builderEnabled: boolean("builder_enabled").notNull().default(false),
  builderPrice: int("builder_price"),
  image: varchar("image", { length: 255 }),
  category: varchar("category", { length: 60 }),
  sortOrder: int("sort_order").notNull().default(0),
});

export const builderSizes = mysqlTable("builder_sizes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 255 }),
  capacity: int("capacity").notNull(), // max number of items
  basePrice: int("base_price").notNull(), // the box, wrapping and card
  image: varchar("image", { length: 255 }),
  allowedItems: text("allowed_items"), // comma separated item ids; empty = every builder item
  active: boolean("active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
});

export const priceTiers = mysqlTable("price_tiers", {
  id: int("id").autoincrement().primaryKey(),
  boxId: int("box_id").notNull().references(() => boxes.id, { onDelete: "cascade" }),
  minQty: int("min_qty").notNull(),
  unitPrice: int("unit_price").notNull(),
});

export const finderQuestions = mysqlTable("finder_questions", {
  id: int("id").autoincrement().primaryKey(),
  question: varchar("question", { length: 160 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

export const finderAnswers = mysqlTable("finder_answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("question_id").notNull().references(() => finderQuestions.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 80 }).notNull(),
  tags: varchar("tags", { length: 300 }).notNull().default(""), // box tags to match; "price:0-5000" filters by price
  sortOrder: int("sort_order").notNull().default(0),
});

export const boxContents = mysqlTable("box_contents", {
  boxId: int("box_id").notNull().references(() => boxes.id, { onDelete: "cascade" }),
  itemId: int("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull().default(1),
}, (t) => [primaryKey({ columns: [t.boxId, t.itemId] })]);

export const collectionKind = ["OCCASION", "RECIPIENT", "CURATED"] as const;

export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", collectionKind).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  intro: text("intro"),
  image: varchar("image", { length: 255 }),
  sortOrder: int("sort_order").notNull().default(0),
  showOnHome: boolean("show_on_home").notNull().default(false),
}, (t) => [uniqueIndex("collections_kind_slug").on(t.kind, t.slug)]);

export const boxCollections = mysqlTable("box_collections", {
  boxId: int("box_id").notNull().references(() => boxes.id, { onDelete: "cascade" }),
  collectionId: int("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.boxId, t.collectionId] })]);

export const addOns = mysqlTable("add_ons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  price: int("price").notNull(),
  image: varchar("image", { length: 255 }),
  active: boolean("active").notNull().default(true),
  stock: int("stock"),
  sortOrder: int("sort_order").notNull().default(0),
});

// ---------- Delivery ----------
export const deliveryZones = mysqlTable("delivery_zones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  cities: text("cities").notNull(), // comma separated
  fee: int("fee").notNull(),
  sameDay: boolean("same_day").notNull().default(true),
  leadDays: int("lead_days").notNull().default(0),
  codAllowed: boolean("cod_allowed").notNull().default(true),
  active: boolean("active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
});

export const deliverySlots = mysqlTable("delivery_slots", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 80 }).notNull(), // "Morning, 9am to 12pm"
  startTime: varchar("start_time", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("end_time", { length: 5 }).notNull(),
  capacity: int("capacity").notNull().default(20),
  cutoff: varchar("cutoff", { length: 5 }).notNull(), // same-day order-by, "07:00"
  active: boolean("active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
});

export const blackoutDates = mysqlTable("blackout_dates", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  reason: varchar("reason", { length: 120 }).notNull(),
});

// ---------- Customers & orders ----------
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 190 }),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  createdAt: now(),
});

export const recipients = mysqlTable("recipients", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").references(() => customers.id, { onDelete: "set null" }),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  notes: text("notes"),
});

export const orderStatus = ["PENDING", "CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
export const orderSource = ["WEB", "WHATSAPP", "MESSENGER", "PHONE", "INSTAGRAM", "QUOTE", "BULK"] as const;
export type OrderStatus = (typeof orderStatus)[number];

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(), // BX-10234
  status: mysqlEnum("status", orderStatus).notNull().default("PENDING"),
  source: mysqlEnum("source", orderSource).notNull().default("WEB"),
  customerId: int("customer_id").notNull().references(() => customers.id),
  recipientId: int("recipient_id").notNull().references(() => recipients.id),
  subtotal: int("subtotal").notNull(),
  deliveryFee: int("delivery_fee").notNull(),
  discount: int("discount").notNull().default(0),
  total: int("total").notNull(),
  couponCode: varchar("coupon_code", { length: 40 }),
  giftMessage: text("gift_message"),
  surprise: boolean("surprise").notNull().default(false),
  callToArrange: boolean("call_to_arrange").notNull().default(false),
  customerNote: text("customer_note"),
  internalNote: text("internal_note"),
  contactEmail: varchar("contact_email", { length: 190 }), // email given on this order (email sign-in shows only these)
  voucherCode: varchar("voucher_code", { length: 40 }),
  voucherAmount: int("voucher_amount").notNull().default(0),
  notifyChannels: json("notify_channels").$type<string[]>(), // customer opt-ins; null = all switched-on channels
  bulkRef: varchar("bulk_ref", { length: 20 }), // groups the orders of one bulk order
  quoteId: int("quote_id"),
  reviewToken: varchar("review_token", { length: 40 }),
  createdAt: now(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => [index("orders_status_idx").on(t.status)]);

export const orderLines = mysqlTable("order_lines", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  boxId: int("box_id").references(() => boxes.id, { onDelete: "set null" }),
  addOnId: int("add_on_id").references(() => addOns.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(), // snapshot at sale
  unitPrice: int("unit_price").notNull(),
  quantity: int("quantity").notNull(),
  builderSizeId: int("builder_size_id"),
  meta: json("meta").$type<{ items?: { id: number; name: string; qty: number; price: number }[] }>(), // build-your-own contents
});

export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  slotId: int("slot_id").references(() => deliverySlots.id, { onDelete: "set null" }),
  zoneId: int("zone_id").references(() => deliveryZones.id, { onDelete: "set null" }),
  fee: int("fee").notNull(),
  carrier: varchar("carrier", { length: 80 }),
  tracking: varchar("tracking", { length: 80 }),
  photo: varchar("photo", { length: 255 }),
}, (t) => [index("deliveries_date_idx").on(t.date)]);

export const paymentMethod = ["COD", "BANK_TRANSFER", "VOUCHER"] as const;
export const paymentStatus = ["PENDING", "SLIP_UPLOADED", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentMethod = (typeof paymentMethod)[number];

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  method: mysqlEnum("method", paymentMethod).notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", paymentStatus).notNull().default("PENDING"),
  slip: varchar("slip", { length: 255 }),
  reference: varchar("reference", { length: 120 }),
  createdAt: now(),
});

export const orderEvents = mysqlTable("order_events", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 30 }).notNull(),
  message: text("message").notNull(),
  createdAt: now(),
});

export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  type: mysqlEnum("type", ["PERCENT", "FIXED", "FREE_DELIVERY"]).notNull(),
  value: int("value").notNull().default(0),
  minSpend: int("min_spend").notNull().default(0),
  startsAt: datetime("starts_at", { mode: "date" }),
  endsAt: datetime("ends_at", { mode: "date" }),
  usageLimit: int("usage_limit"),
  used: int("used").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ---------- Leads ----------
// ---------- Reviews ----------
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  boxId: int("box_id").references(() => boxes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  rating: int("rating").notNull(),
  body: text("body"),
  photo: varchar("photo", { length: 255 }),
  approved: boolean("approved").notNull().default(false),
  reply: text("reply"),
  createdAt: now(),
}, (t) => [index("reviews_box_idx").on(t.boxId, t.approved)]);

// ---------- Corporate quotes ----------
export const quoteStatus = ["REQUESTED", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(), // QT-1001
  token: varchar("token", { length: 40 }).notNull().unique(),
  status: mysqlEnum("status", quoteStatus).notNull().default("REQUESTED"),
  company: varchar("company", { length: 160 }),
  contactName: varchar("contact_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 190 }),
  quantity: int("quantity"),
  budget: varchar("budget", { length: 40 }),
  neededBy: date("needed_by", { mode: "string" }),
  branding: varchar("branding", { length: 160 }),
  request: text("request").notNull(),
  photo: varchar("photo", { length: 255 }),
  deliveryFee: int("delivery_fee").notNull().default(0),
  discount: int("discount").notNull().default(0),
  notes: text("notes"), // shown to the customer on the quote
  expiresAt: date("expires_at", { mode: "string" }),
  orderId: int("order_id"),
  createdAt: now(),
});

export const quoteLines = mysqlTable("quote_lines", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  boxId: int("box_id").references(() => boxes.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(),
  unitPrice: int("unit_price").notNull(),
  quantity: int("quantity").notNull(),
});

// ---------- Gift vouchers ----------
export const vouchers = mysqlTable("vouchers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  token: varchar("token", { length: 40 }).notNull().unique(),
  amount: int("amount").notNull(),
  balance: int("balance").notNull(),
  status: mysqlEnum("status", ["PENDING", "ACTIVE", "USED", "CANCELLED"]).notNull().default("PENDING"),
  buyerName: varchar("buyer_name", { length: 120 }).notNull(),
  buyerPhone: varchar("buyer_phone", { length: 20 }).notNull(),
  buyerEmail: varchar("buyer_email", { length: 190 }),
  toName: varchar("to_name", { length: 120 }),
  toEmail: varchar("to_email", { length: 190 }),
  toPhone: varchar("to_phone", { length: 20 }),
  message: varchar("message", { length: 300 }),
  paymentMethod: mysqlEnum("payment_method", ["BANK_TRANSFER", "CASH", "FREE"]).notNull().default("BANK_TRANSFER"),
  slip: varchar("slip", { length: 255 }),
  expiresAt: date("expires_at", { mode: "string" }),
  createdAt: now(),
});

// ---------- Customer accounts & reminders ----------
export const otpCodes = mysqlTable("otp_codes", {
  id: int("id").autoincrement().primaryKey(),
  target: varchar("target", { length: 190 }).notNull(), // email or 94XXXXXXXXX
  codeHash: varchar("code_hash", { length: 100 }).notNull(),
  attempts: int("attempts").notNull().default(0),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  createdAt: now(),
}, (t) => [index("otp_target_idx").on(t.target)]);

export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(), // whose day
  occasion: varchar("occasion", { length: 80 }).notNull(),
  month: int("month").notNull(),
  day: int("day").notNull(),
  channel: mysqlEnum("channel", ["EMAIL", "SMS"]).notNull().default("EMAIL"),
  daysBefore: int("days_before").notNull().default(7),
  lastSentYear: int("last_sent_year"),
  createdAt: now(),
});

export const enquiries = mysqlTable("enquiries", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["CUSTOM", "CORPORATE", "CONTACT"]).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 190 }),
  company: varchar("company", { length: 160 }),
  occasion: varchar("occasion", { length: 80 }),
  budget: varchar("budget", { length: 40 }),
  date: date("date", { mode: "string" }),
  quantity: int("quantity"),
  message: text("message").notNull(),
  photo: varchar("photo", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: now(),
});

// ---------- Content ----------
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
});

export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  question: varchar("question", { length: 255 }).notNull(),
  answer: text("answer").notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

// ---------- Notifications ----------
export const notificationJobs = mysqlTable("notification_jobs", {
  id: int("id").autoincrement().primaryKey(),
  channel: mysqlEnum("channel", ["EMAIL", "SMS", "PUSH", "WHATSAPP"]).notNull(),
  to: varchar("to", { length: 600 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  body: text("body").notNull(),
  event: varchar("event", { length: 40 }).notNull(),
  orderId: int("order_id"),
  status: mysqlEnum("status", ["QUEUED", "SENT", "FAILED"]).notNull().default("QUEUED"),
  attempts: int("attempts").notNull().default(0),
  error: text("error"),
  runAfter: datetime("run_after", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  sentAt: datetime("sent_at", { mode: "date" }),
  createdAt: now(),
}, (t) => [index("jobs_status_idx").on(t.status, t.runAfter)]);

export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  endpoint: varchar("endpoint", { length: 500 }).notNull().unique(),
  keys: json("keys").notNull(),
  audience: mysqlEnum("audience", ["OWNER", "CUSTOMER"]).notNull(),
  orderId: int("order_id"),
  createdAt: now(),
});

// ---------- Relations ----------
export const boxesRelations = relations(boxes, ({ many }) => ({
  images: many(boxImages),
  contents: many(boxContents),
  collections: many(boxCollections),
}));
export const boxImagesRelations = relations(boxImages, ({ one }) => ({
  box: one(boxes, { fields: [boxImages.boxId], references: [boxes.id] }),
}));
export const boxContentsRelations = relations(boxContents, ({ one }) => ({
  box: one(boxes, { fields: [boxContents.boxId], references: [boxes.id] }),
  item: one(items, { fields: [boxContents.itemId], references: [items.id] }),
}));
export const itemsRelations = relations(items, ({ one, many }) => ({
  maker: one(makers, { fields: [items.makerId], references: [makers.id] }),
  inBoxes: many(boxContents),
}));
export const makersRelations = relations(makers, ({ many }) => ({ items: many(items) }));
export const collectionsRelations = relations(collections, ({ many }) => ({ boxes: many(boxCollections) }));
export const boxCollectionsRelations = relations(boxCollections, ({ one }) => ({
  box: one(boxes, { fields: [boxCollections.boxId], references: [boxes.id] }),
  collection: one(collections, { fields: [boxCollections.collectionId], references: [collections.id] }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  recipient: one(recipients, { fields: [orders.recipientId], references: [recipients.id] }),
  lines: many(orderLines),
  delivery: one(deliveries),
  payments: many(payments),
  events: many(orderEvents),
}));
export const orderLinesRelations = relations(orderLines, ({ one }) => ({
  order: one(orders, { fields: [orderLines.orderId], references: [orders.id] }),
}));
export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
  slot: one(deliverySlots, { fields: [deliveries.slotId], references: [deliverySlots.id] }),
  zone: one(deliveryZones, { fields: [deliveries.zoneId], references: [deliveryZones.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
export const customersRelations = relations(customers, ({ many }) => ({ orders: many(orders), recipients: many(recipients) }));
export const recipientsRelations = relations(recipients, ({ one }) => ({
  customer: one(customers, { fields: [recipients.customerId], references: [customers.id] }),
}));
