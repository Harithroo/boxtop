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

**The running build is never touched.** Each deploy uploads into a new folder and the server switches to it in one restart. (Until November 2026 deploys uploaded over the live `app/` folder, and the site broke for the several minutes the upload took: the running server lazily loaded chunks from a half-new build.)

Layout on the server (FTP root = `/home/harithroo/boxtop`):

| Path | What |
|---|---|
| `app/server.js` | the cPanel startup file: a small launcher (`scripts/deploy-launcher.cjs`), not the Next server |
| `app/DEPLOYED_SHA` | the commit that should run |
| `releases/nm-<hash>/node_modules/` | dependencies, one folder per distinct set (named by content hash), uploaded only when they change |
| `releases/nm-<hash>/<sha>/` | one complete build per deploy: `server.js`, `.next`, `public`, `drizzle` |

1. Build with the test `NEXT_PUBLIC_*` values and `NEXT_PUBLIC_BUILD_SHA` = the commit SHA (built into the bundle).
2. Assemble the release (standalone + static + public + `drizzle/`). Turbopack's symlinks for `sharp`/`mysql2` (`.next/node_modules/<pkg>-<hash>`) are replaced by copies of the packages, because node_modules sits one level up on the server and FTP can't be relied on to make symlinks.
3. Ask the server what it already has: `NM_COMPLETE` / `RELEASE_COMPLETE` are uploaded after their folder, so their presence means the folder is whole.
4. Upload `node_modules` (29 MB) to `releases/nm-<hash>/` only if that folder isn't complete there yet. To force it: Actions → Run workflow → tick `full_upload`.
5. Upload the release (~13 MB) to `releases/nm-<hash>/<sha>/`, a folder nothing is running from. Every file gets a fresh mtime; never use content-derived mtimes or `--ignore-time` (lftp then skips changed files). A re-run of an already complete release skips this, so it can't rewrite the build that is running. If a pass fails part way (the connection drops and lftp gives up on a file), the workflow runs the mirror again, up to three passes: it only sends what is missing, and `RELEASE_COMPLETE` goes up after a clean pass. node_modules is uploaded the same way.
6. Upload the launcher, then `app/DEPLOYED_SHA` **last**. It means "this release is completely on disk".
7. **The server applies it itself:** the every-minute cron calls `/api/cron`, which (`src/lib/self-update.ts`) sees `DEPLOYED_SHA` differ from its own built-in SHA, applies the **new release's** migrations, then exits. LiteSpeed runs the launcher on the next request; it reads `DEPLOYED_SHA` and starts that release. The site is unavailable only for that restart (a few seconds; requests wait rather than fail).
8. The launcher also copies the previous build's `/_next/static` files (under a week old) into the new release, so pages already open in a browser keep working, and a minute after start deletes old releases, keeping the running one and the two before it.
9. Best-effort check from GitHub: poll `/api/health` for up to 5 minutes. New SHA + home page 200 means ✅. Still the old SHA after 5 min means ❌ (check the cron). Unreadable (bot challenge) means ⚠️ warning only; check `/api/health` in a browser.

**Rollback:** File Manager → `boxtop/app/DEPLOYED_SHA` → replace the SHA with one of the folders under `releases/nm-*/` → save. Within a minute the cron switches to it. A SHA with no folder is refused (`deploy.status` = `failed`, the site keeps running). Migrations are not rolled back.

Why it works this way: this host has no SSH, and **both Cloudflare and the host's own firewall bot-challenge GitHub's runner IPs**, unpredictably. So nothing in the deploy depends on GitHub reaching the site over HTTP. Migration and restart are triggered from the server's own cron.

Deploys queue rather than cancel each other, and the job times out after 45 minutes.

**First deploy with the releases layout:** nothing to do by hand. The build running at that moment reads the same `app/DEPLOYED_SHA`, so it restarts onto the launcher as usual. Two differences that one time only: it applies migrations from the old `app/drizzle`, so any new migration in that deploy is applied by the new build's first cron tick a minute later; and the full upload includes `node_modules`. After the second deploy, everything in `app/` except `server.js` and `DEPLOYED_SHA` is the old build and can be deleted in File Manager.

Gotchas this host has shown:
- Cloudflare gives runner IPs a "Just a moment…" 403, and the origin firewall serves them an obfuscated-JS challenge page with **HTTP 200**. Never treat a 200 as success without checking the body.
- The origin's LiteSpeed firewall 403s a POST with no body.
- More than ~6 FTP connections can trigger `421 Too many connections`.
- Next 16 standalone output already contains a **partial** `public/` (only traced files). Copy with `cp -r public/. dest/public/`; `cp -r public dest/public` nests the full copy at `public/public/` and the untraced images 404. The assemble step now fails if any public file is missing from the deploy.
- Next scans `public/` and `.next/static` only at startup, so files added while it runs need a restart. Each release starts fresh, so this is covered.
- Never upload into a folder a running process uses. Node loads server chunks lazily, so a half-replaced build fails on whichever page is visited first (`module factory is not available`, 500s).
- In PowerShell, `curl` means `Invoke-WebRequest`; use `curl.exe` for the commands in this doc.

### Checking / fixing a deploy by hand

- `https://<site>/api/health` shows the running commit SHA.
- `https://<site>/api/cron?key=CRON_SECRET` shows `"deploy": {"status": …}`: `current`, `updating` (migrating + restarting now), or `failed` with the error (a migration that failed, or a `DEPLOYED_SHA` with no release folder; it retries every minute and keeps the old build running until it succeeds).
- If stuck: cPanel → Setup Node.js App → Restart.
- `POST /api/deploy/migrate` with header `X-Deploy-Token` (= `DEPLOY_TOKEN` in cPanel) runs migrations manually. It's optional; the route is off when `DEPLOY_TOKEN` isn't set.

Only ever add new migrations with `npm run db:generate`; never edit one that already ran on test/prod.

## Pictures in `public/` (cache rule)

Everything under `/catalog`, `/home` and `/brand` is sent with a one-year browser cache (`next.config.ts`). So **a changed picture needs a new file name**; replacing a file under its old name leaves returning visitors with the old one. After adding or replacing a photo there, run `node scripts/thumbs.mjs`: it writes the smaller copies the pages ask for (`-400.webp` beside each box photo, plus the hero and logo sizes) and commit them with the photo. Photos uploaded in the back office already get random names and are not affected.

## Dev

1. Install MariaDB (or run `scripts/setup-db.ps1` from an admin PowerShell, which also writes `.env`).
2. `copy .env.example .env` and fill it in.
3. `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`.
4. After pulling or switching branches, run `npm run db:migrate` again. A `Failed query: select … from boxes` error usually means a migration in `drizzle/` hasn't been applied yet.

## Test (boxtop.harithroowijayawardhana.com)

- Files: `/home/harithroo/boxtop/app/server.js` (launcher) + `app/DEPLOYED_SHA`, and the builds under `/home/harithroo/boxtop/releases/` (see "What a deploy does"). The app restarts itself after a deploy; cPanel → Restart does it by hand (it starts whatever `DEPLOYED_SHA` names).
- Push to `master` → Actions builds standalone output and uploads it over FTPS. Nothing else to do unless env vars changed.
- cPanel Node.js app: Application root `boxtop`, startup file `app/server.js`. **Application mode must be Production** (it sets `NODE_ENV`).
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
- Migrations/seed: run from the cPanel terminal in the running release's folder, or from your PC with `DATABASE_URL` pointing at the host (needs Remote MySQL access for your IP).
- Cron (**required**: it sends notifications *and* applies deploys and migrations): cPanel → Cron Jobs, Once Per Minute (`* * * * *`):
  `curl -s --max-time 50 --resolve boxtop.harithroowijayawardhana.com:443:104.255.169.49 -o /home/harithroo/boxtop/cron-last.json "https://boxtop.harithroowijayawardhana.com/api/cron?key=CRON_SECRET" > /dev/null 2>&1`
  `--resolve` calls the server directly (no Cloudflare). `cron-last.json` (File Manager, `boxtop/`) always holds the latest result: `deploy.status` is `current` / `updating` / `failed` + error.

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
