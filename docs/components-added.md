# Components added

Every component class defined in `assets/css/components.css`. Names and values come from `design/boxtop-final-design-system.html` unless marked **(shell)**, which are new for the site shell.

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

Other shared classes outside `components.css`: `.sprite`, `.visually-hidden` (base.css); `.wrap`, `.section`, `.cta-row` (layout.css).

Design-system documentation-only classes (swatches, type rows, `.block`, motion columns, etc.) were not extracted.

## app.js behaviours (assets/js/app.js)

- **Current page:** `document.body.dataset.page` and `[data-nav]` are both space-separated token lists. Any `[data-nav]` link sharing a token gets `aria-current="page"`, which covers the header nav, drawer and tab bar. `data-nav="shop box"` lets the Shop links light up on hamper detail pages.
- **Drawer:** the `[data-nav-toggle]` button opens `#nav-drawer`. Focus moves to the close button; Tab and Shift+Tab are trapped inside; ESC, the close button and a click on the dim overlay all close it, and focus returns to the trigger. Body scroll is locked while open (`body.nav-open`). Resizing to 900px or wider closes it. Links that point at `#` close it too.
- **Config filling:** `data-cfg="key"` sets text from `window.BOXTOP_CONFIG` (dotted paths work; add `data-cfg-format="money"` to run it through `money()`). `data-cfg-attr="href:whatsapp_url;title:other_key"` sets attributes.
- **Not wired yet:** `[data-quickadd]` buttons and `[data-cart-count]` do nothing until the cart prompt.

## Catalogue card pattern (generated)

`<!-- gen: hamper-preview -->` (first 3 in-stock hampers, featured first) and `<!-- gen: hampers-all -->` are filled by `sync-shell` with the standard `.pv-card`: optional `.pv-badge` (Sold out beats New beats Featured), `.pv-thumb` with `data-placeholder`, `.pv-quickadd` (omitted when sold out), a name link, and a price from the same `money()` the browser uses. Other regions: `occasion-list`, `recipient-list`, `addon-list`. Never edit between gen markers.
