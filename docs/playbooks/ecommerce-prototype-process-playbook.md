# E-commerce prototype process playbook

Derived from the Kayaa project (baby clothing, Sri Lanka; Laravel + Filament backend built by another developer; frontend built by me as a static prototype, converted to Blade later). Use it to run the same routine on a new e-commerce site **in that site's own style**.

**How to use this file.** Give it to Claude at the start of the new project together with `ecommerce-prototype-technical-playbook.md` (mined from the Kayaa repo). This file covers the *process* (phases, prompt shape, lessons). The technical file covers the *repo* (folders, tools, checks, conventions). Everything brand-specific (palette, fonts, copy, categories, policies, payment) is **not** carried over: it comes from the discovery questions in section 6.

---

## 1. The approach in one page

1. Research first: competitor analysis, then the audience and constraints.
2. Lock the design system **before** any page: colours, type, buttons, cards, motion, contrast table.
3. Build a **static prototype** (plain HTML, CSS custom properties, vanilla JS, no framework, no build step) on its own git branch, hosted on GitHub Pages so the client can click it.
4. Build from shared pieces: partials for header/footer, one catalogue JSON, one site-config JSON, a sync tool that writes them into every page. Nothing hand-copied twice.
5. Build in **numbered prompts**, one concern each, run **sequentially** in Claude Code. Each prompt ends with checks and a written report. I read the report, then write the next prompt.
6. Mark every unknown fact as `[[TODO]]` or `[[PROPOSED]]` in the content and count them with a tool. Never invent brand facts, prices, certifications or policies.
7. Keep a **backend contract doc** current after every prompt: routes, forms, fields, params, states, open questions. The backend developer reads that, not the HTML.
8. Gate every release with automated checks (CSS, links, SEO, copy rules, budgets, axe, keyboard, three browsers, Lighthouse).
9. Hand the client a review page plus a decisions list. Convert to the real templating engine only after sign-off.

Roles: **I** = the user (commits and pushes with GitHub Desktop). **Claude (chat)** = plans and writes prompts, reads reports, writes content and design files. **Claude Code (VS Code)** = executes prompts in the repo and **never commits or pushes**.

---

## 2. Phase map

| # | Phase | Output | Notes |
|---|---|---|---|
| 0 | Discovery | Answers to section 6 | Do not skip; most rework came from assumed facts |
| 1 | Competitor analysis | Interactive HTML report: landscape, patterns, pitfalls, personas, checklist, links to each site | 5 to 6 competitors incl. one from the same niche abroad |
| 2 | Design directions | 4 to 7 themed directions (colour, type, CTA, card variants) | Client picks parts from each |
| 3 | Final design system | One HTML file, tokens, type scale, spacing, radius, icons, buttons, badges, forms, cards, motion, contrast table, do/don't | Calculate contrast, never eyeball it |
| 4 | Page inventory and plan | List of pages, states, routes, priorities | Include error pages, account, tracking |
| 5 | Foundation | Folder structure, tokens.css, base, components, layout, icon sprite, fonts, CLAUDE.md, page skeleton | Relative paths only; sprite inlined (external SVG `use` fails on file://) |
| 6 | Shell | Announcement bar, header, nav, mobile menu, tab bar, cart drawer, footer as partials | Variants: full, minimal (checkout), error, none |
| 7 | Hosting | GitHub Pages workflow on the frontend branch | Client link from day one |
| 8 | Tooling | sync-shell, catalogue.json, site-config.json, seo.json, shell-map.json | Single source of truth |
| 9 | Home | Hero, trust strip, category tiles, new arrivals, promos | Mobile-first |
| 10 | Listings | Shop, category, search, filters, sort, pagination, empty states | |
| 11 | Product | Gallery, variants, stock states, reviews, tags, related, sticky mobile add-to-cart | Use `?demo=` states |
| 12 | Cart and checkout | Cart, drawer, checkout, simulated gateway page, thank-you in every payment state | |
| 13 | Track and account | Track order, register, login, reset, verify, orders, order detail, profile, reviews | |
| 14 | Content and error pages | Delivery, returns, privacy, terms, about, contact, size guide, 404/419/429/500/503 | Content pack written separately |
| 15 | Backend alignment | Compare against the real staging site: categories, sizes, fields, formats | Fix prototype to match reality |
| 16 | Content and SEO wiring | Content pack into pages, per-page SEO, JSON-LD, indexing matrix | |
| 17 | QA and hardening | Full test pass, fixes, QA docs | |
| 18 | Enhancements | Size guide slider, search typeahead, tags, footer redesign, signature interaction mock-up | Experiments live in `mockups/` and are deleted before launch unless approved |
| 19 | Client review and Blade conversion | Review page, decisions list, read-only conversion audit first | Convert only after sign-off |

---

## 3. Anatomy of a good Claude Code prompt

Every prompt I wrote followed this order. Keep it.

1. **Title and one-line purpose.** "Prompt 12: content and SEO wiring."
2. **Read first.** Name the files to read before touching anything (CLAUDE.md, backend-contract.md, the relevant page and CSS, the content docs). Say "do not rely on memory of earlier sessions".
3. **Guards.** What must not change: other pages, shared partials unless stated, the design tokens, the rules in CLAUDE.md. State hard client rules here (for Kayaa: no green/yellow/peach, light mode only, no COD wording outside checkout).
4. **Decisions already made.** The answers from the user, client or backend dev, written as facts so Claude Code does not re-ask.
5. **Numbered goals.** Each goal is testable. Include exact behaviour: breakpoints, counts, states, keyboard behaviour, copy where it matters.
6. **Scope rule.** "If something outside the goals looks wrong, list it in the report; do not fix it."
7. **Quality bar.** The gate commands that must exit 0, accessibility rules, performance budgets, widths to test, browsers to test, "open the screenshots yourself after the last edit".
8. **Honesty clause.** "Report what you did not test. If a check cannot run, say so. Do not claim a pass you did not see. Do not commit or push."
9. **Docs.** Which docs to update (CLAUDE.md, components-added.md, backend-contract.md, tools README, review page).
10. **Report format.** Gate results table, what changed, what needs my attention, not tested.

Sequencing rules:

- Run prompts **one at a time**. Two overlapping sessions touched the same files and produced a confusing report.
- Small corrections go into an addendum or a "b" prompt (11b, 21b), not a rewrite.
- After each report I check claims against the live site or screenshots before writing the next prompt.
- When a design is subjective (footer, signature interaction), build a **mock-up in a separate file first**, then refine from screenshots and reference frames, then integrate.

---

## 4. Working agreement

- The human commits and pushes. Claude Code never does.
- The live Pages build lags a few minutes after a push; check the actual page before saying something is or is not deployed.
- Reports are claims, not proof. Open the page, read the screenshots, spot-check numbers.
- Keep one `CLAUDE.md` in the repo holding the standing rules (conventions, shell variants, release gate, illustration rules, footer rules). Every prompt can then say "follow CLAUDE.md" instead of repeating them.
- Content that is not final is marked, counted and listed for the client; it is never silently invented.

---

## 5. Mistakes and lessons (avoid repeating these)

1. **Assumed brand facts.** I wrote that products are "sized by weight and height"; the real brand sizes by age. Ask, or mark `[[TODO]]`.
2. **Assumed backend fields.** I said fabric and review-headline fields did not exist; they did. Inspect the staging site and API before writing the contract.
3. **Invented taxonomy.** Categories and sizes must come from the client or backend, not from competitors.
4. **Payment assumptions.** Payment rules (online-only, optional COD toggle, order reference format, stock decrement timing, guest handling) must be settled early; they touch cart, checkout, thank-you, emails, policies and copy.
5. **Wrong contrast claims.** My first design system claimed AA for two colours that failed (4.39:1 and 4.41:1). Axe then found hundreds of failures. Calculate every pair and publish the table.
6. **Client colour rules.** Client dropped green, then peach and yellow. Get the "colours you hate" list up front and enforce it in CLAUDE.md. Check that hexes labelled "blue" are not actually green.
7. **Icons on file://.** External SVG sprites fail when opened from disk; inline the sprite.
8. **Cached fetches.** I told the user the live site had not updated when it had. Re-fetch before claiming.
9. **AI-generated images.** Gemini output came with baked rounded white corners, huge file size and metadata. Crop, resize, compress to a budget, strip Content Credentials, check corners for watermarks, record credits.
10. **aria-label mismatch.** An aria-label that does not start with the visible text fails Label-in-Name. Let the visible text be the name.
11. **px breakpoints.** Use em breakpoints so zoom and large text reflow correctly.
12. **Fabricated policies.** Legal pages and certification claims need client evidence and lawyer review. Write drafts, mark them, list them.
13. **Parallel sessions.** Do not run two prompts that touch the same files.
14. **Stock photos.** Selecting images took too long; parked in favour of placeholders. Decide early who supplies imagery.
15. **Mock-up before page edits.** Signature interactions (wardrobe carousel) went wrong in the first draft (hooks under the rail, flat garments, card covering the item, half-empty wall). Iterate in a mock-up with reference screenshots before touching real pages.
16. **Consistency drift.** Auth and thank-you pages quietly lost the header and footer. A `shell-map.json` plus `check-shell` fixed it permanently.
17. **Copy rules need a checker.** A banned-wording check (`check-copy`) caught COD wording leaking into pages and even into reports.
18. **Dead code and tooling drift.** Pipelines that delete files must only delete files listed in a manifest.

---

## 6. Discovery questions for a new project

Ask these before Phase 1.

**Business**
- What is sold, to whom, in which country? Currency, tax, delivery area?
- Brand name, tagline, any existing logo, colours, tone of voice?
- Number of categories, sizes or variants, products at launch? Who names them?
- Who supplies photos, copy, legal text, certifications?

**Audience and style**
- Who are the shoppers (age, device, context)? Mobile share?
- Colours the client dislikes or cannot use. Light only or dark allowed?
- Three sites they like and one they hate.
- Any "signature" interaction they want (the Kayaa wardrobe carousel came from the client).

**Commerce rules**
- Payment gateway and methods; is cash on delivery allowed; who toggles it?
- Guest checkout? Email required or optional? Verification? Order reference format?
- Stock rules (decrement at placement or at payment, holds, restore on failure).
- Delivery fee, free threshold, per-region days, courier names.
- Returns, exchanges, refunds, faulty items, final-sale rules.
- Reviews: who can post, moderation, editable?
- Wishlist, tags, search suggestions, sale pricing, coupons?

**Backend**
- Framework and who builds it? Staging URL? Branch names? Can I read the routes?
- Which fields exist on product, order, review, contact?
- What will they confirm in writing (slugs, sort values, hex values, per-district days)?

**Delivery**
- Repo, branch, hosting for client review, who commits.
- Templating target (Blade, Twig, other) and when conversion happens.
- Launch date and legal review owner.

---

## 7. Prompt library (adapt, do not copy brand facts)

Each entry is a template for the numbered prompts used on Kayaa. Fill brackets from discovery.

**A. Foundation.** Create `html/` structure (pages, `assets/css/{tokens,base,components,layout}.css`, `assets/js`, `assets/icons/sprite.svg` inlined, `assets/fonts` self-hosted), `CLAUDE.md` (conventions, forbidden colours, relative paths, no inline styles or handlers, em breakpoints, 44px targets), `page-skeleton.html`, tokens from the design system. Guard: no page content yet.

**B. Shell and Home.** Build announcement bar (dismiss persists until refresh rules as agreed), header with search, nav and dropdown, mobile drawer, tab bar, cart drawer, footer, then Home sections. Mobile first. Guard: every shell piece is a `<!-- partial: NAME -->` pair.

**C. Partials and sync.** `tools/sync-shell.mjs` fills partials, injects `?v=<hash>` cache busting, writes `window.SITE_CONFIG`, handles `<!-- gen: NAME -->` regions, supports `--check`. Add `{{root}}` depth token so nested pages work.

**D. Single-source data.** `tools/catalogue.json` (categories, sizes, colours, products, tags) and `tools/site-config.json` (shipping fee, thresholds, hours, contact, toggles). Sync writes them into generated JS and into `data-cfg` hooks. Validate relationships (every tag used at least twice, etc.).

**E. Listing template.** Shop, category, search with filters, sort, pagination, empty combos, `?tag=`. Card spec from the design system. Indexing rules for filters.

**F. Product page.** Gallery, colour and size pickers, stock states (low, out), price and compare-at, accordions, reviews with form and success/error/throttle states, tags, related, sticky mobile bar, `?demo=` switches. Mark loops with `<!-- loop: -->` comments.

**G. Cart, checkout, payment.** Cart page and drawer, checkout with validation and error states, a clearly marked prototype gateway page with four outcome buttons, thank-you in every state (paid, pending, failed, cancelled, expired), resume payment, signed URL note in the contract.

**H. Track and accounts.** Track by reference plus mobile; register, login, forgot, reset, verify, orders, order detail with stepper and cancel dialog, reviews, profile. Each with `?demo=` states.

**I. Content and error pages.** Pages driven by the content pack in `docs/content/` (markdown with front matter and `{{cfg:key}}` tokens). Error pages 404, 419, 429, 500, 503 with the error shell variant.

**J. SEO.** `tools/seo.json` per page, canonical and robots rules (listings, filters, tags noindex rules), JSON-LD (Organization, BreadcrumbList, Product), sitemap notes. No FAQ schema (Google dropped FAQ rich results).

**K. QA gate.** Install Playwright (Chromium, Firefox, WebKit), axe-core, Lighthouse, html-validate **outside the repo**. Run axe over every page and state at 375 and 1280, keyboard, zoom 200 and 400 percent, text spacing, reduced motion, forced colours, width sweep 320 to 1920 over http and file://, Lighthouse mobile. Write `docs/qa/` report, design audit, known issues, real-device checklist. Add `check-budget`.

**L. Backend alignment.** Read the staging site and routes; produce a diff of prototype versus backend (categories, sizes, fields, formats, flows); fix the prototype; update `backend-contract.md` with open questions for the backend dev.

**M. Experiment mock-up.** Build the signature interaction in `mockups/NAME.html/.css/.js`, `noindex`, registered on the review page, with its own tests, no raster images, documented for deletion. Refine from screenshots and reference video frames. Only then propose integration.

**N. Conversion audit.** Read-only audit of every page for Blade (or other) conversion: partials map, loops, conditionals, config tokens, risk list. No code changes until client sign-off.

---

## 8. Client loop

1. Push to the frontend branch; Pages builds a link (`review.html` lists every page and state).
2. Send the client a short message plus the decisions list (table: decision, what the staging site or draft says, status Required/Confirm/Approve).
3. Collect answers into the next prompt as "Decisions already made".
4. Keep a checklist of pages and review items (this was `kayaa-review-checklist.md`): pages built, what to review, client-only items, backend items, prototype-only items to remove, pre-launch non-code items.
5. Before launch: remove prototype files, resolve all `[[TODO]]`/`[[PROPOSED]]` (`list-todos --fail-on-open` passes), swap staging noindex, set real canonicals and social links, lawyer review, real-device test, client sign-off.

---

## 9. Replicating "in its own style"

Keep: process, folder structure, tooling, gates, prompt anatomy, contract doc, content workflow.
Replace: palette, fonts, card and button personality, icon style, layout rhythm, footer art, signature interaction, copy voice, categories, sizes, policies, payment rules.
Procedure: run discovery, do competitor analysis for the **new** niche, produce 4 or more directions, let the client pick, then start at Phase 5 using the technical playbook for the repo skeleton.
