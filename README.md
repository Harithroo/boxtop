# Boxtop · box-top.lk

Gift-box store for Sri Lanka: storefront and owner back office in one Next.js app (App Router, TypeScript, Tailwind, Drizzle ORM, MySQL or MariaDB). Styled with the **Ribbon** design system (logo violet `#3C2894` and magenta `#C40D86`, Kanit and Karla).

## Run it on your computer

0. Quick way: in an admin PowerShell in this folder run `powershell -ExecutionPolicy Bypass -File .\scripts\setup-db.ps1`. It installs MariaDB if needed, creates the database and writes `.env`. Or by hand:
1. Install Node.js 20+ and **MariaDB** (Windows MSI from https://mariadb.org/download, the same database most cPanel hosts run):
   - In the installer, set a root password and leave "Install as service" ticked, so it starts with Windows.
   - Open **HeidiSQL** (installed with MariaDB), connect as `root`, and run `CREATE DATABASE boxtop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. `copy .env.example .env` and fill it in: `DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/boxtop"`, a long `SESSION_SECRET`, and the admin email and password.
3. `npm install`
4. `npm run db:migrate`: creates the tables (works on MySQL and MariaDB).
5. `npm run db:seed`: owner account, delivery zones and slots, occasions, add-ons, starter boxes, builder sizes, gift finder questions, pages, FAQ.

If you set the database up earlier with `db:push`, run `npm run db:reset` once (development only: deletes all data), then `npm run db:seed`.

Signing in to `/account` sends a code by email or SMS. Until SMTP or SMS is set up, `npm run dev` prints the code in the terminal.
6. `npm run dev` → shop at http://localhost:3000, back office at http://localhost:3000/admin

## Changing the database

1. Edit `src/db/schema.ts`.
2. `npm run db:generate` creates a new SQL file in `drizzle/`.
3. `npm run db:migrate` applies it (locally, then on the server).

Don't use `drizzle-kit push` on MariaDB: it can't read MariaDB's JSON column checks.

## What's built

**Storefront:** home, all boxes with budget filter and sort, occasion pages (`/occasion/birthday`), recipient pages (`/for/mum`), search (package numbers work: "15" finds P15), box page with city → date → slot picker and add-ons, **Order on WhatsApp** button, cart, one-page guest checkout (surprise and call-to-arrange options, card message, coupon), cash on delivery and bank transfer with slip upload, order page with status timeline, order tracking, custom order and corporate enquiry forms, delivery info, FAQ, contact, policy pages, 404, sitemap, robots, Product and FAQ schema.

**Also in v1:** build-your-own box (`/build`, sizes and item pool set in admin), gift finder (`/gift-finder`, questions and tags set in admin), reviews (delivered orders only, owner approves), bulk price tiers per box, corporate quotes (`/corporate` request → admin quote → customer accepts online → order), bulk orders to many addresses from a CSV (`/corporate/bulk`), gift vouchers (`/vouchers`, redeemable at checkout, partial balances), customer accounts with email/SMS code sign-in (`/account`), occasion reminders (`/account/reminders`), makers page, and several bank accounts for bank transfer.

**Back office (`/admin`, owner only, optional 2-step sign-in):** dashboard, orders (filters, status steps, confirm or reject slip, delivery date/slot/rider/tracking/photo, notes, resend notifications, one-tap WhatsApp update, printable packing slip without prices), manual orders for WhatsApp/Messenger/phone sales, delivery board by date and slot with pick list, boxes (photos resized to WebP, contents, package code, stock, lead days, collections), collections, add-ons, coupons, enquiries inbox, pages and FAQ, settings for store details, announcement bar, payments (COD limit, bank details), delivery zones, slots and capacity, no-delivery dates, and notifications.

**Notifications:** every event has on/off switches per channel for you and for the customer: email (cPanel SMTP), SMS (Notify.lk or Text.lk), push to your phone (PWA). Messages queue and send each minute, so checkout never waits; failures retry and show in a log. Automatic WhatsApp needs the Cloud API (phase 2); the WhatsApp buttons work now.

## Deploy to PeekHosting (cPanel)

1. On your computer: `npm run build`. This makes `.next/standalone`.
2. Copy `public` into `.next/standalone/public` and `.next/static` into `.next/standalone/.next/static`.
3. Upload the contents of `.next/standalone` to the app folder (e.g. `~/boxtop`).
4. cPanel → **Setup Node.js App**: Node 20+, application root `boxtop`, startup file `server.js`. Add the `.env` values as environment variables, with `UPLOAD_DIR` pointing outside the app folder (e.g. `/home/USER/boxtop-uploads`) so uploads survive redeploys.
5. Create the database in cPanel. Run `npm run db:migrate` and `npm run db:seed` once from your computer against it (use Remote MySQL), or from the cPanel terminal.
6. cPanel → **Cron Jobs**, every minute (sends notifications, and once a day sends reminders and expires old quotes): `curl -s "https://box-top.lk/api/cron?key=YOUR_CRON_SECRET" > /dev/null`
7. Set SPF and DKIM for box-top.lk (cPanel → Email Deliverability) so order emails don't land in spam.

Note: `sharp` downloads a Linux build during `npm install`. If you build on Windows, run `npm install --os=linux --cpu=x64 sharp` before building, or build on the server/GitHub Actions.

## Notes for developers

- Don't use Drizzle's `db.query…{ with }` API: it generates `LATERAL` joins that MariaDB can't run. Use the loaders in `src/db/loaders.ts`.
- All prices are whole rupees (LKR).
- `AGENTS.md`/`CLAUDE.md` are generated by Next.js 16.
