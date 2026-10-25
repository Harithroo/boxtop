# BoxTop - frontend prototype (branch `boxtop-frontend`)

Static prototype of the BoxTop gift-hamper storefront. Backend (Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Drizzle ORM on MySQL/MariaDB) is on `master`, already built — 36-table schema, server actions, a working admin back office (see HANDOFF.md). Every page here will be converted to React Server Components later, reusing that backend, rather than to Blade.

## Stack and rules
- Plain HTML + CSS (custom properties) + vanilla JS. No frameworks, no Tailwind, no build step, no npm deps in the repo.
- Must work via file:// and a static server: use RELATIVE asset paths. No root-absolute URLs, with ONE exception: html/404.html carries `<!-- sync-root: /boxtop/ -->` (match whatever the GitHub Pages path ends up being).
- Source of truth for design: `design/boxtop-design-system-final.html` — the Kraft & Ribbon direction, locked, retyped entirely in Montserrat. One typeface only (Montserrat 400-800); weight and size carry the hierarchy, not a second display face. Light mode only. Palette: cream/kraft background (#F5EFE3), deep purple CTA (#5B3A87), the brand's magenta (#D5136F) as an accent only — it never becomes the dominant colour of a page. Contrast is pre-calculated in that file's table; don't re-eyeball it, and don't silently "improve" a token — flag it instead.
- Mobile-first. Breakpoints: 420, 600, 900, 1100, 1200. At 900 the nav switches: below = hamburger drawer + bottom tab bar; above = full header nav.
- Never use emoji as UI. Icons come from `assets/icons/sprite.svg` (pulled from the design system file); each page inlines the sprite once (`<!-- partial: sprite -->`) and references icons as `<use href="#i-name">`. `node tools/sync-shell.mjs` refreshes every page.
- Prototype-only JS lives in `assets/js/proto-*.js` and is deleted at conversion. Production behaviour stays and must not depend on proto files.
- Scripts: the `scripts` partial loads `catalogue-data.js`, `site-config.js`, `format.js`, `search-core.js`, `search-suggest.js`, `proto-search.js`, then `app.js`; page scripts follow it (production file first, then the `proto-*` file that fakes the server).
- CSS: no app.css and no `@import`. The `styles` partial holds direct `<link>` tags for tokens, fonts, base, components, layout; page CSS is a separate `<link>` after it. `sync-shell` sets `?v=<first 8 hex of sha1>` on every local `.css`/`.js` reference; re-run it after editing any CSS or JS.
- Product images are 4:5. Use the `.media` placeholder (`data-placeholder`) until real photos exist — there are none yet; everything on the live site today is seed data.

## Conversion conventions
- Every page = shared shell + `<main>`. Shell regions are wrapped in `<!-- partial: NAME --> ... <!-- /partial: NAME -->`. Never hand-edit between markers: edit `tools/partials/*.html` and run `node tools/sync-shell.mjs` (`--check` lists out-of-date pages). New pages are copied from `tools/page-skeleton.html` and added to `tools/shell-map.json` and `tools/seo.json`.
- `<body data-page="home">` (space-separated tokens allowed); `app.js` marks matching `[data-nav]` links `aria-current="page"`. Partials use `{{root}}` for paths.
- Repeated data: several static items wrapped in `<!-- loop: NAME --> ... <!-- /loop -->`. Conditionals get `<!-- next: condition -->` hints (our name for Kayaa's `blade:` hint — same idea, pointed at the real conversion target).
- No inline styles (except `--tone` / `--ratio`), no inline event handlers. JS hooks are `data-*` attributes.
- Update `docs/backend-contract.md` whenever a page, form or param changes. Log new components in `docs/components-added.md`. Update `html/review.html` after each page.
- Money: `LKR ` prefix, whole rupees, thousands separator, no cents, one `money()` helper. Never hand-type a formatted price.
- UI wording: "Add to hamper" (not "Add to cart"), "View contents" (not "View details"), "Track order", "Gift note". A badge or status label can still say "Sold out" / "Out of stock" — the rule is about button/action labels.
- Order statuses: `PENDING, CONFIRMED, PACKED, DISPATCHED, DELIVERED, CANCELLED, REFUNDED` — one label map and one next-step map, matching the real app's `STATUS_LABEL` / `NEXT_STATUS`.
- Payment: cash on delivery and bank transfer with slip upload ONLY — no gateway, anywhere, by business decision. Never show a card-payment form, a "Pay now" button, or a gateway logo.
- Checkout is guest-only, one page. No forced account creation.
- Stock/cart timing rules (decrement at placement vs. confirmation, holds, restore on failure) are not yet settled — mark any page that would need one with `<!-- TODO: confirm with client --><span class="todo">...</span>` rather than guessing. Confirm against the real backend in the backend-alignment prompt.
- Do not invent policy or product facts. Use plausible placeholder text marked `<!-- TODO: confirm with client -->`.

## Shell variants
Every page uses the FULL shell except: `checkout` (reduced-exit header, no nav distractions), `error` (wordmark-only header, cannot depend on the database), `none` (mockups/experiments only, noindex). `tools/shell-map.json` lists every page and its variant; `tools/check-shell.mjs` verifies it (`sync-shell --check` runs it).

## Catalogue, site config, SEO (single sources)
- `tools/catalogue.json`: occasions (birthday, corporate, new baby, condolence, festive/seasonal, weddings — matches `/occasion/[slug]`), recipients (her, him, kids, colleagues... — matches `/for/[slug]`), hampers (slug, name, package no. like `P15` since search must match a bare number to its package — see HANDOFF.md's "15 → P15" rule, occasion/recipient tags, price, images, featured/new/oos flags), add-ons. `sync-shell` fills every `<!-- gen: NAME -->` region and writes `assets/js/catalogue-data.js`. Never hand-edit between `gen` markers.
- `tools/site-config.json`: shipping fee, free-delivery threshold, same-day cutoff time, delivery days (Colombo vs. islandwide), support hours, WhatsApp number, `cod_enabled`, bank account list (bank transfer is a real payment method here, not a toggle to hide), `currency_prefix: "LKR "`. Never type these values by hand: use `<span data-cfg="key">` and `data-cfg-attr="attr:key"`; scripts read `window.BOXTOP_CONFIG`.
- `tools/seo.json`: every page has an entry (title <= 60 chars, description 120-160, all unique); `"staging": true` forces `noindex,nofollow`.

## Content workflow
- Page text lives in `docs/content/*.md`. Edit the markdown, never the HTML. Markers: `[[TODO: ...]]` (a client fact), `[[PROPOSED: ...]]` (a default to approve), `{{cfg:key}}`, `[[TABLE: ...]]`. `node tools/list-todos.mjs` lists open markers; `--fail-on-open` before launch.
- Voice: warm, specific boutique tone — closer to how Silver Aisle reads than to Kapruka's marketplace voice (both are competitors covered in the Market & Launch Report). Name the actual tea, chocolate or craft item inside a hamper rather than "delightful assortment". The Sri Lankan gifting calendar (Avurudu, Vesak, Christmas, Valentine's, wedding season) drives the content calendar, not a generic retail calendar.

## Photography and illustrations
- Originals in `tools/image-source/` (git-ignored). `node tools/process-images.mjs` (needs `sharp` installed OUTSIDE the repo) writes WebP at the standard widths, enforces budgets, writes `docs/image-credits.md` and fills `<!-- photo: ID -->` regions. Never hand-edit between photo markers. It deletes only files listed in `tools/image-manifest.json`.
- Alt: one plain sentence for informative images, `alt=""` for decorative ones. Hero and first gallery image eager + `fetchpriority="high"`; everything else lazy.

## Accessibility and mobile definition of done
- Semantic landmarks, one h1, skip link, labelled fields, `aria-expanded`/`aria-controls` on toggles, dialogs with focus trap, ESC and focus return, `prefers-reduced-motion` honoured.
- Checked at 320, 360, 375, 390, 412, 430, landscape 667x375, 768/820. No horizontal scroll; tap targets >= 44x44 with >= 8px gaps; fixed chrome <= about a third of the portrait viewport; inputs >= 16px; drawers use `100dvh` with a `100vh` fallback, `overscroll-behavior: contain` and safe-area padding; hover only inside `(hover: hover) and (pointer: fine)`; media reserves space with `aspect-ratio`; body text >= 16px; nothing under 14px except 12.5px captions.

## Process
- Do not commit or push unless asked. Do not touch files outside `html/`, `docs/`, `design/`, `tools/`, `CLAUDE.md` and `.github/workflows/pages.yml`.
- Done = checked at 375, 768 and 1280, plus the release gate below.

## Release gate (before every push; all clean)
```
node tools/sync-shell.mjs && node tools/sync-shell.mjs --check
node tools/check-css.mjs          # 0 errors, 0 warnings
node tools/check-links.mjs
node tools/check-seo.mjs          # 0 warnings
node tools/check-copy.mjs         # no "Pay now"/gateway wording, no "Add to cart" (must read "Add to hamper")
node tools/check-shell.mjs
node tools/check-budget.mjs       # CSS 70 KB, JS 60 KB, fonts 120 KB gzip
node tools/list-todos.mjs         # report counts
```
Before a client review: the audits in `tools/qa/` (axe 0 violations, static-checks, keyboard, modes, engines, validate, hygiene, design-audit, lighthouse), then `docs/qa/real-device-checklist.md` on a real iPhone and Android phone; record in `docs/qa/qa-report.md`; read `docs/qa/known-issues.md`.
Before launch: `list-todos --fail-on-open` exits 0; `docs/seo/launch-checklist.md` done.
