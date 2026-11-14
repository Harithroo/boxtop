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

GitHub repo secrets used by the deploy: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, plus `DEPLOY_URL` (e.g. `https://boxtop.harithroowijayawardhana.com`, no trailing slash) and `DEPLOY_TOKEN`.

### Automatic migrations

The host has no SSH, so after the FTP upload the workflow POSTs to `/api/deploy/migrate` with header `X-Deploy-Token`. The app applies any pending `drizzle/*.sql` files to its own database (the folder is copied into the deploy). The route 404s if the token is wrong or `DEPLOY_TOKEN` isn't set in cPanel. Then a smoke test checks the home page returns 200.

Setup per environment: generate a long random token → put it in cPanel env vars as `DEPLOY_TOKEN` (restart the app) **and** in GitHub secrets as `DEPLOY_TOKEN`, along with `DEPLOY_URL`. Without both secrets the step is skipped.

Only ever add new migrations with `npm run db:generate`; never edit one that already ran on test/prod.

## Dev

1. Install MariaDB (or run `scripts/setup-db.ps1` from an admin PowerShell, which also writes `.env`).
2. `copy .env.example .env` and fill it in.
3. `npm install` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`.
4. After pulling or switching branches, run `npm run db:migrate` again. A `Failed query: select … from boxes` error usually means a migration in `drizzle/` hasn't been applied yet.

## Test (boxtop.harithroowijayawardhana.com)

- Files: `/home/harithroo/boxtop/app` (`server.js`, `.next`, `node_modules`, `public`). `tmp/restart.txt` restarts the app.
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
- Cron: cPanel → Cron Jobs, every minute: `curl -s "https://boxtop.harithroowijayawardhana.com/api/cron?key=CRON_SECRET" > /dev/null`

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
