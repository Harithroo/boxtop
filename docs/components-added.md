# Components added

Every component class defined in `html/assets/css/components.css`. Names and values come from `design/boxtop-final-design-system.html` unless marked **(shell)**, which are new for the site shell.

| Class | Defined in | Purpose |
|---|---|---|
| `.icon` | components.css | Sprite icon (`<svg class="icon"><use href="#i-name"/></svg>`), 24px, thin stroke |
| `.btn`, `.btn-sm` | components.css | Base pill button, 44px tap target; `-sm` is 40px on desktop only |
| `.btn-primary` | components.css | Purple CTA with hover lift (hover-capable devices only) |
| `.btn-secondary` | components.css | Outlined purple button |
| `.btn-ghost` | components.css | Quiet secondary-colour button |
| `.btn-disabled` | components.css | Disabled / sold-out button |
| `.link-arrow` | components.css | Text link with chevron that nudges on hover |
| `.badge`, `.badge-primary`, `.badge-accent`, `.badge-outline` | components.css | Pill badges |
| `.alert`, `.alert-success`, `.alert-danger` | components.css | Inline status messages with icon |
| `.form-grid` | components.css | One column, two from 600px |
| `.field`, `.field .hint`, `.field .err`, `.field.has-error` | components.css | Labelled form field, hint and error text |
| `.check-row` | components.css | Checkbox / radio row |
| `.pv-grid` | components.css | Product card grid: 2 columns, 4 from 900px |
| `.pv-card` (+ `--flat`, `--list`, `--oos`) | components.css | Hamper product card and its states |
| `.pv-thumb` (+ `--sm`), `.pv-badge` (+ `--oos`), `.pv-info` (+ `--list`), `.pv-name`, `.pv-row`, `.pv-price` | components.css | Card parts |
| `.pv-quickadd` | components.css | Quick-add pill centred on the standard card (dark ink, cream text). With a mouse (`(hover: hover) and (pointer: fine)`) it is hidden and scaled to .85, then fades and scales in on card hover or keyboard focus (`:focus-within`). On touch it is always visible, full opacity, no animation |
| `.skip-link` **(shell)** | components.css | Skip to main content link |
| `.site-header`, `.site-header__inner`, `.wordmark`, `.primary-nav`, `.header-actions`, `.nav-toggle` **(shell)** | components.css | Header: wordmark, nav (from 900px), actions, hamburger trigger (below 900px) |
| `.icon-btn`, `.cart-count` **(shell)** | components.css | 44px icon button, cart badge |
| `.nav-drawer`, `.nav-drawer__panel`, `.nav-drawer__head`, `.nav-drawer__list` **(shell)** | components.css | Mobile menu drawer, below 900px only. Opened by `[data-nav-toggle]`; `app.js` handles focus trap, ESC, click-outside and focus return |
| `.tab-bar` **(shell)** | components.css | Bottom tab bar (Shop, Search, Hamper, Account), below 900px only; the active item gets `aria-current` from `app.js` |
| `.site-footer`, `.site-footer__cols`, `.site-footer__legal` **(shell)** | components.css | Footer shell |

Heading weights: every heading (h1-h6, including the footer column headings) is SemiBold 600; hierarchy comes from size and spacing.

Other shared classes outside `components.css`: `.sprite`, `.visually-hidden` (base.css); `.wrap`, `.section`, `.cta-row` (layout.css).

Design-system documentation-only classes (swatches, type rows, `.block`, motion columns, etc.) were not extracted.

## app.js behaviours (html/assets/js/app.js)

- **Current page:** `document.body.dataset.page` and `[data-nav]` are both space-separated token lists. Any `[data-nav]` link sharing a token gets `aria-current="page"`, which covers the header nav, drawer and tab bar. `data-nav="shop box"` lets the Shop links light up on hamper detail pages.
- **Drawer:** the `[data-nav-toggle]` button opens `#nav-drawer`. Focus moves to the close button; Tab and Shift+Tab are trapped inside; ESC, the close button and a click on the dim overlay all close it, and focus returns to the trigger. Body scroll is locked while open (`body.nav-open`). Resizing to 900px or wider closes it. Links that point at `#` close it too.
- **Config filling:** `data-cfg="key"` sets text from `window.BOXTOP_CONFIG` (dotted paths work; add `data-cfg-format="money"` to run it through `money()`). `data-cfg-attr="href:whatsapp_url;title:other_key"` sets attributes.
- **Not wired yet:** `[data-quickadd]` buttons and `[data-cart-count]` do nothing until the cart prompt.

## Catalogue card pattern (generated)

`<!-- gen: hamper-preview -->` (first 3 in-stock hampers, featured first) and `<!-- gen: hampers-all -->` are filled by `sync-shell` with the standard `.pv-card`: optional `.pv-badge` (Sold out beats New beats Featured), `.pv-thumb` with `data-placeholder`, `.pv-quickadd` (omitted when sold out), a name link, and a price from the same `money()` the browser uses. Other regions: `occasion-list`, `recipient-list`, `addon-list`. Never edit between gen markers.

## Home page additions (Prompt 4)

Extended from the nearest existing pattern unless noted. All in `html/assets/css/components.css`.

| Class | Purpose |
|---|---|
| `.eyebrow` | Small uppercase label above a heading. From the design file, but coloured `--primary-deep` instead of `--accent`: magenta on the cream background measures about 4.4:1, under AA for 12.5px text. Flag, not a token change |
| `.lede` | Larger intro paragraph (18px, 500) from the design file's hero |
| `.intro` | Muted section intro paragraph |
| `.media` | Image placeholder (`data-placeholder`, aspect ratio from `--ratio`, default 4/5) with a centred icon, until photography exists |
| `.hero`, `.hero__inner`, `.hero__text`, `.hero__media` | Home hero: one column on mobile; text plus decorative media from 900px (media is hidden below 900px) |
| `.trust`, `.trust-strip` | Four icon-and-text items: 2x2 on mobile, 4 across from 900px |
| `.pv-grid--3` | Card grid: 2 columns, 3 from 900px (6 occasion cards) |
| `.pv-card--occasion` | `.pv-card` as a single link with a 4/3 thumbnail, name only, no quick-add |
| `.pv-meta` | Muted contents line under a hamper name (first two catalogue `contents`) |
| `.pv-name a::after` | Stretched link: the whole hamper card is the click target (quick-add stays above it) |
| `.block`, `.block--center`, `.teaser-grid` | Surface panel from the design file's `.block` (h3 at 21px), centred variant, and a 1-to-2 column grid for the teasers |
| `.section__cta` | Spacing for the call-to-action row under a grid |

`.wordmark` now has a 44px minimum height. The tab bar moved from the header partial to the end of the footer partial, so keyboard order reaches page content before it.

New gen regions in `tools/shell-data.mjs`: `hamper-featured` (featured and in stock) and `occasion-cards` (from `catalogue.occasions`, using each occasion's optional `icon`, validated against the sprite).

## Display formatters (html/assets/js/format.js)

- `money(n)` -> `"LKR 5,800"` (unchanged).
- `prettyTime("HH:MM")` -> `"2:00 PM"`: 24-hour string to 12-hour with AM/PM (`"00:30"` -> `"12:30 AM"`, `"12:00"` -> `"12:00 PM"`). Returns `""` for anything that isn't a valid time. Display only; `site-config.json` keeps `"14:00"`.
- Used through `data-cfg-format="time"` (and `"money"`) on any `[data-cfg]` element. `app.js` maps format names to functions in its `FORMATS` object; documented in CLAUDE.md.

## Path convention (do not regress)

`html/` is the whole published site. GitHub Pages serves its contents as the site root (`https://harithroo.github.io/boxtop/` is `html/index.html`), so `assets/` lives at `html/assets/`, never at the repo root.
- `{{root}}` is the relative path back to `html/`: `./` for `html/index.html`, `../` for `html/box/sample-hamper.html` or `html/account/reminders.html`. `html/404.html` overrides it with `<!-- sync-root: /boxtop/ -->`.
- In partials write `{{root}}assets/css/tokens.css` and `{{root}}shop.html`, with no `html/` segment.
- Tools resolve the site from `path.join(ROOT, 'html')` (`SITE`) in `sync-shell.mjs` and `check-links.mjs`; generated data files are written to `html/assets/js/`.
- Deployment: `.github/workflows/nextjs.yml` ("Preview site (GitHub Pages)") uploads `path: html` on every push to `boxtop-frontend`.
