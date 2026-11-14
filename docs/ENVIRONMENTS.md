# Environments

| | Dev | Test | Prod |
|---|---|---|---|
| URL | http://localhost:3000 | https://boxtop.harithroowijayawardhana.com | https://box-top.lk |
| Status | in use | live | **not set up yet** |
| Runs on | your PC, `npm run dev` | PeekHosting cPanel (user `harithroo`), Passenger | TBD |
| Database | local MariaDB 13 (Windows service `MariaDB`) | cPanel MySQL/MariaDB | TBD (own DB, never share with test) |
| Env vars live in | `.env` file (git-ignored) | cPanel → Setup Node.js App → Environment variables | same as test, on the prod app |
| Deployed by | — | GitHub Actions `deploy.yml` on push to `master` | TBD |
| Search engines | — | blocked (`NEXT_PUBLIC_NOINDEX=1`) | allowed |

Each environment has its **own database and its own admin accounts**. Changing a password in one does not change it in another.

## Variables

| Name | Needed | Read when | Dev | Test | Prod |
|---|---|---|---|---|---|
| `DATABASE_URL` | yes | runtime | `.env` | cPanel | cPanel |
| `SESSION_SECRET` | yes (32+ chars) | runtime | `.env` | cPanel | cPanel, different value |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | only for `db:seed` | seed script | `.env` | wherever you run the seed | same |
| `UPLOAD_DIR` | no (default `./uploads`) | runtime | leave unset | cPanel: `/home/harithroo/uploads` | same idea |
| `CRON_SECRET` | for notifications/reminders | runtime | optional | cPanel + cron job URL | same |
| `NEXT_PUBLIC_SITE_URL` | yes | **build time** | `.env` | `deploy.yml` build step | prod build step |
| `NEXT_PUBLIC_NOINDEX` | test only | **build time** | unset | `deploy.yml` = `"1"` | **unset** |

`NEXT_PUBLIC_*` values are compiled into the bundle by `npm run build`. Setting them in cPanel does nothing; change them in the workflow and redeploy.

GitHub repo secrets used by the deploy: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (required); `DEPLOY_URL` (site root, e.g. `https://boxtop.harithroowijayawardhana.com`) and `DEPLOY_ORIGIN_IP` (the cPanel server's IP, cPanel home → General Information → Shared IP Address) are only used for the final best-effort check.

### What a deploy does (`.github/workflows/deploy.yml`)

1. Build with the test `NEXT_PUBLIC_*` values and `NEXT_PUBLIC_BUILD_SHA` = the commit SHA (built into the bundle).
2. Assemble `deploy/app` (standalone + static + public + `drizzle/`).
3. Stamp every file's mtime from its content hash, so lftp uploads only files whose content changed.
4. Upload `app/` over FTPS (3 connections, two passes so anything missed the first time is re-sent).
5. Upload `app/DEPLOYED_SHA` **last**. It means "the new code is completely on disk".
6. **The server applies it itself:** the every-minute cron calls `/api/cron`, which (`src/lib/self-update.ts`) sees `DEPLOYED_SHA` differ from its own built-in SHA, applies pending migrations, then exits. LiteSpeed starts the new build on the next request, and that fresh process scans `public/` with every file present.
7. Best-effort check from GitHub: poll `/api/health` for up to 5 minutes. New SHA + home page 200 means ✅. Still the old SHA after 5 min means ❌ (check the cron). Unreadable (bot challenge) means ⚠️ warning only; check `/api/health` in a browser.

Why it works this way: this host has no SSH, and **both Cloudflare and the host's own firewall bot-challenge GitHub's runner IPs**, unpredictably. So nothing in the deploy depends on GitHub reaching the site over HTTP. Migration and restart are triggered from the server's own cron.

Deploys queue rather than cancel each other, and the job times out after 45 minutes.

**First deploy after this change:** the app running at that moment predates the self-update code, so restart it once by hand (cPanel → Setup Node.js App → Restart). From then on it's automatic.

Gotchas this host has shown:
- Cloudflare gives runner IPs a "Just a moment…" 403, and the origin firewall serves them an obfuscated-JS challenge page with **HTTP 200**. Never treat a 200 as success without checking the body.
- The origin's LiteSpeed firewall 403s a POST with no body.
- More than ~6 FTP connections can trigger `421 Too many connections`.
- Next 16 standalone output already contains a **partial** `public/` (only traced files). Copy with `cp -r public/. dest/public/`; `cp -r public dest/public` nests the full copy at `public/public/` and the untraced images 404. The assemble step now fails if any public file is missing from the deploy.
- Next scans `public/` only at startup, so files added while it runs need a restart. The self-restart covers that.
- In PowerShell, `curl` means `Invoke-WebRequest`; use `curl.exe` for the commands in this doc.

### Checking / fixing a deploy by hand

- `https://<site>/api/health` shows the running commit SHA.
- `https://<site>/api/cron?key=CRON_SECRET` shows `"deploy": {"status": …}`: `current`, `updating` (migrating + restarting now), or `failed` with the migration error (it retries every minute and keeps the old build running until it succeeds).
- If stuck: cPanel → Setup Node.js App → Restart.
- `POST /api/deploy/migrate` with header `X-Deploy-Token` (= `DEPLOY_TOKEN` in cPanel) runs migrations manually. It's optional; the route is off when `DEPLOY_TOKEN` isn't set.

Only ever add new migrations with `npm run db:generate`; never edit one that already ran on test/prod.

## Dev

1. Install MariaDB (or run `scripts/setup-db.ps1` from an admin PowerShell, which also writes `.env`).
2. `copy .env.example .env` and fill it in.
3. `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`.
4. After pulling or switching branches, run `npm run db:migrate` again. A `Failed query: select … from boxes` error usually means a migration in `drizzle/` hasn't been applied yet.

## Test (boxtop.harithroowijayawardhana.com)

- Files: `/home/harithroo/boxtop/app` (`server.js`, `.next`, `node_modules`, `public`). The app restarts itself after a deploy (see above); cPanel → Restart does it by hand.
- Push to `master` → Actions builds standalone output and uploads it over FTPS. Nothing else to do unless env vars changed.
- Runtime variables: cPanel → Setup Node.js App → edit `boxtop` → Environment variables → save → Restart. Currently set there (values for secrets live only in cPanel):

  | Name | Test value |
  |---|---|
  | `DATABASE_URL` | `mysql://harithroo_boxtop:•••@localhost:3306/<db>` (cPanel DB user `harithroo_boxtop`) |
  | `SESSION_SECRET` | secret, cPanel only |
  | `CRON_SECRET` | secret, cPanel only |
  | `ADMIN_EMAIL` | the owner's Gmail |
  | `ADMIN_PASSWORD` | secret, cPanel only |
  | `UPLOAD_DIR` | `/home/harithroo/uploads` |
  | `NEXT_PUBLIC_SITE_URL` | `https://boxtop.harithroowijayawardhana.com` (no effect here, see above; the real one is in `deploy.yml`) |
- Migrations/seed: run from the cPanel terminal in the app folder, or from your PC with `DATABASE_URL` pointing at the host (needs Remote MySQL access for your IP).
- Cron (**required**: it sends notifications *and* applies deploys): cPanel → Cron Jobs, every minute: `curl -s "https://boxtop.harithroowijayawardhana.com/api/cron?key=CRON_SECRET" > /dev/null`

## Prod (box-top.lk) — checklist when setting up

- [ ] Separate Node.js app + database (do not reuse test's).
- [ ] New `SESSION_SECRET`, `CRON_SECRET`, admin password; nothing copied from test.
- [ ] Deploy workflow: copy `deploy.yml` to a prod variant (e.g. triggered by a tag or `workflow_dispatch`), with `NEXT_PUBLIC_SITE_URL=https://box-top.lk` and **without** `NEXT_PUBLIC_NOINDEX`; its own FTP secrets.
- [ ] `UPLOAD_DIR` outside the app folder.
- [ ] Cron job pointed at box-top.lk.
- [ ] SPF/DKIM for box-top.lk (cPanel → Email Deliverability).
- [ ] Fill in this table's Prod column.

## Lost access

- **Admin password:** passwords are bcrypt hashes and can't be recovered. Either set `ADMIN_EMAIL`/`ADMIN_PASSWORD` to a *new* email and run `npm run db:seed`, or generate a hash and update the row:
  `node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "NewPassword"` → `UPDATE users SET password_hash='…' WHERE email='…';`
- **Local MariaDB root password:** admin PowerShell → `Stop-Service MariaDB` → `& "C:\Program Files\MariaDB 13.0\bin\mariadbd.exe" --skip-grant-tables --console` → in a second admin window `mariadb.exe -u root`, `FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY '…';` → Ctrl+C the first → `Start-Service MariaDB`.
- **Host DB/env values:** visible in cPanel → Setup Node.js App (env vars) and MySQL Databases.
