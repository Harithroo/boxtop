import "server-only";
import path from "node:path";

/** Where uploaded images live on disk. Kept apart from uploads.ts so reading a file never loads sharp. */
export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./uploads");

/** Folders anyone may read: these images are shown on the public site. */
export const PUBLIC_UPLOADS = new Set(["boxes", "items", "content", "reviews", "deliveries"]);
/** Folders only the owner may read: bank slips and enquiry photos are private documents. */
export const PRIVATE_UPLOADS = new Set(["slips", "enquiries"]);
