# Backend contract

What each static page needs from the real backend (Next.js App Router, server actions, Drizzle) at conversion time. Update whenever a page, form or param changes.

## Catalogue and config (static stand-ins)

`tools/catalogue.json` and `tools/site-config.json` are static JSON standing in for real API / DB calls. `sync-shell` publishes them to `assets/js/catalogue-data.js` (`window.BOXTOP_CATALOGUE`) and `assets/js/site-config.js` (`window.BOXTOP_CONFIG`). At conversion these become server-side reads of the boxes, occasions, recipients, add-ons and settings tables (`getSettings()`), rendered by React Server Components. All values are placeholders; see `docs/content/site-config-todos.md`.

## Pages

| Route | File | Shell variant | Backend calls |
|---|---|---|---|
| `/` | `html/index.html` | full | no backend calls yet |
| `/shop` | `html/shop.html` | full | no backend calls yet |
| `/box/[slug]` | `html/box/sample-hamper.html` | full | no backend calls yet |
| `/occasion/[slug]` | `html/occasion/sample-occasion.html` | full | no backend calls yet |
| `/for/[slug]` | `html/for/sample-recipient.html` | full | no backend calls yet |
| `/search` | `html/search.html` | full | no backend calls yet |
| `/build` | `html/build.html` | full | no backend calls yet |
| `/gift-finder` | `html/gift-finder.html` | full | no backend calls yet |
| `/cart` | `html/cart.html` | full | no backend calls yet |
| `/checkout` | `html/checkout.html` | checkout | no backend calls yet |
| `/order/[number]` | `html/order/sample-order.html` | full | no backend calls yet |
| `/track` | `html/track.html` | full | no backend calls yet |
| `/account` | `html/account.html` | full | no backend calls yet |
| `/account/reminders` | `html/account/reminders.html` | full | no backend calls yet |
| `/vouchers` | `html/vouchers.html` | full | no backend calls yet |
| `/vouchers/[token]` | `html/vouchers/sample-token.html` | full | no backend calls yet |
| `/corporate` | `html/corporate.html` | full | no backend calls yet |
| `/corporate/bulk` | `html/corporate/bulk.html` | full | no backend calls yet |
| `/quote/[token]` | `html/quote/sample-token.html` | full | no backend calls yet |
| `/bulk/[ref]` | `html/bulk/sample-ref.html` | full | no backend calls yet |
| `/custom` | `html/custom.html` | full | no backend calls yet |
| `/review/[token]` | `html/review/sample-token.html` | full | no backend calls yet |
| `/makers` | `html/makers.html` | full | no backend calls yet |
| `/delivery` | `html/delivery.html` | full | no backend calls yet |
| `/faq` | `html/faq.html` | full | no backend calls yet |
| `/contact` | `html/contact.html` | full | no backend calls yet |
| `/about` | `html/about.html` | full | no backend calls yet |
| `/terms` | `html/terms.html` | full | no backend calls yet |
| `/privacy` | `html/privacy.html` | full | no backend calls yet |
| `/refunds` | `html/refunds.html` | full | no backend calls yet |
| `/delivery-policy` | `html/delivery-policy.html` | full | no backend calls yet |
| `not-found` | `html/404.html` | error | no backend calls yet |

Dynamic routes are represented by one sample file each (`sample-*`); the real app resolves `[slug]`, `[number]`, `[token]` and `[ref]` at request time. `not-found` is `html/404.html`.
