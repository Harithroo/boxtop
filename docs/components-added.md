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
| `.skip-link` **(shell)** | components.css | Skip to main content link |
| `.site-header`, `.site-header__inner`, `.wordmark`, `.primary-nav`, `.header-actions`, `.nav-toggle` **(shell)** | components.css | Header: wordmark, nav (from 900px), actions, hamburger trigger (below 900px) |
| `.icon-btn`, `.cart-count` **(shell)** | components.css | 44px icon button, cart badge |
| `.site-footer`, `.site-footer__cols`, `.site-footer__legal` **(shell)** | components.css | Footer shell |

Other shared classes outside `components.css`: `.sprite`, `.visually-hidden` (base.css); `.wrap`, `.section`, `.cta-row` (layout.css).

Design-system documentation-only classes (swatches, type rows, `.block`, motion columns, etc.) were not extracted.
