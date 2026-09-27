// Field specs for the small admin lists edited with <CrudTable>. Shared by server action and UI.
export type Field = { name: string; label: string; type: "text" | "number" | "bool" | "date" | "time" | "select" | "textarea" | "datetime" | "image"; options?: string[]; required?: boolean; width?: string; placeholder?: string };

export const SPECS = {
  collections: {
    title: "Collections", fields: [
      { name: "kind", label: "Type", type: "select", options: ["OCCASION", "RECIPIENT", "CURATED"], required: true, width: "8rem" },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address", type: "text", placeholder: "from name" },
      { name: "intro", label: "Intro text", type: "textarea" },
      { name: "sortOrder", label: "Order", type: "number", width: "5rem" },
      { name: "showOnHome", label: "Home", type: "bool" },
    ],
  },
  addOns: {
    title: "Add-ons", fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "price", label: "Price", type: "number", required: true, width: "7rem" },
      { name: "stock", label: "Stock", type: "number", width: "6rem", placeholder: "–" },
      { name: "sortOrder", label: "Order", type: "number", width: "5rem" },
      { name: "active", label: "On", type: "bool" },
    ],
  },
  coupons: {
    title: "Coupons", fields: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "type", label: "Type", type: "select", options: ["PERCENT", "FIXED", "FREE_DELIVERY"], width: "9rem" },
      { name: "value", label: "Value", type: "number", width: "6rem" },
      { name: "minSpend", label: "Min spend", type: "number", width: "7rem" },
      { name: "startsAt", label: "Starts", type: "datetime" },
      { name: "endsAt", label: "Ends", type: "datetime" },
      { name: "usageLimit", label: "Limit", type: "number", width: "5rem", placeholder: "∞" },
      { name: "active", label: "On", type: "bool" },
    ],
  },
  deliveryZones: {
    title: "Delivery zones", fields: [
      { name: "name", label: "Zone", type: "text", required: true },
      { name: "cities", label: "Cities (comma separated)", type: "textarea", required: true },
      { name: "fee", label: "Fee", type: "number", required: true, width: "6rem" },
      { name: "leadDays", label: "Lead days", type: "number", width: "5rem" },
      { name: "sameDay", label: "Same day", type: "bool" },
      { name: "codAllowed", label: "COD", type: "bool" },
      { name: "sortOrder", label: "Order", type: "number", width: "5rem" },
      { name: "active", label: "On", type: "bool" },
    ],
  },
  deliverySlots: {
    title: "Time slots", fields: [
      { name: "label", label: "Label", type: "text", required: true },
      { name: "startTime", label: "From", type: "time", required: true },
      { name: "endTime", label: "To", type: "time", required: true },
      { name: "cutoff", label: "Same-day order by", type: "time", required: true },
      { name: "capacity", label: "Capacity", type: "number", width: "6rem" },
      { name: "sortOrder", label: "Order", type: "number", width: "5rem" },
      { name: "active", label: "On", type: "bool" },
    ],
  },
  blackoutDates: {
    title: "No-delivery dates", fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "reason", label: "Reason", type: "text", required: true, placeholder: "Poya day" },
    ],
  },
  pages: {
    title: "Pages", fields: [
      { name: "slug", label: "Address", type: "select", options: ["about", "terms", "privacy", "refunds", "delivery-policy"], required: true, width: "10rem" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Text (blank line between paragraphs, ## for headings)", type: "textarea", required: true },
    ],
  },
  builderSizes: {
    title: "Box sizes", fields: [
      { name: "name", label: "Size", type: "text", required: true, placeholder: "Medium" },
      { name: "capacity", label: "Max items", type: "number", required: true, width: "6rem" },
      { name: "basePrice", label: "Base price (box, wrap, card)", type: "number", required: true },
      { name: "description", label: "Short description", type: "text" },
      { name: "allowedItems", label: "Only these item IDs (comma separated, empty = all)", type: "text" },
      { name: "sortOrder", label: "Order", type: "number", width: "5rem" },
      { name: "active", label: "On", type: "bool" },
    ],
  },
  items: {
    title: "Items", fields: [
      { name: "name", label: "Item", type: "text", required: true },
      { name: "size", label: "Size", type: "text", placeholder: "100g" },
      { name: "category", label: "Category", type: "text", placeholder: "Tea, Sweets, Keepsakes" },
      { name: "builderPrice", label: "Builder price", type: "number" },
      { name: "cost", label: "Cost", type: "number" },
      { name: "stock", label: "Stock", type: "number", placeholder: "–" },
      { name: "makerId", label: "Maker ID", type: "number", placeholder: "–" },
      { name: "sortOrder", label: "Order", type: "number", width: "5rem" },
      { name: "builderEnabled", label: "In the builder", type: "bool" },
      { name: "image", label: "Photo", type: "image" },
    ],
  },
  makers: {
    title: "Makers", fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address", type: "text", placeholder: "from name" },
      { name: "place", label: "Place", type: "text", placeholder: "Kandy" },
      { name: "story", label: "Story", type: "textarea" },
      { name: "photo", label: "Photo", type: "image" },
    ],
  },
  faqs: {
    title: "FAQ", fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Answer", type: "textarea", required: true },
      { name: "sortOrder", label: "Order", type: "number", width: "5rem" },
    ],
  },
} satisfies Record<string, { title: string; fields: Field[] }>;

export type Entity = keyof typeof SPECS;
