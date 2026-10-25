# Home (`html/index.html`)

Section order: hero, trust strip, shop by occasion, bestsellers, maker story teaser, corporate teaser, trust close / contact.
Data comes from `tools/catalogue.json` (occasions, featured hampers) and `tools/site-config.json`; prices are never typed here.

## SEO
- Title: BoxTop | Hand-wrapped gift hampers in Sri Lanka
- Description: Hand-wrapped gift hampers with Ceylon tea, local honey and handloom wrapping from named Sri Lankan makers. Same-day delivery in Colombo.

## Hero
- Eyebrow: Hand-wrapped, delivered same day in Colombo
- H1: Gifts that feel like they were chosen, not ordered.
- Lede: Ceylon tea, local honey, handloom wrapping, and the actual names of the people who made them — hampers sourced across Sri Lanka and tied together by hand before they reach your door.
- Primary CTA: Shop hampers -> /shop
- Secondary CTA: Build your own -> /build

## Trust strip
- Same-day delivery in Colombo before {{cfg:same_day_cutoff}}
- Cash on delivery or bank transfer — no card needed  <!-- next: cod_enabled -->
- A handwritten gift note on every order
- Sourced from named local makers, not a warehouse

## Shop by occasion
- H2: Find the right hamper for the moment
- Intro: From a first baby to a condolence call, the occasion changes what belongs in the box.
- Grid: one card per `catalogue.occasions`, each -> /occasion/[slug]  (`gen: occasion-cards`)

## Bestsellers
- H2: What people are sending most
- Intro: The hampers that get reordered.
- Grid: `catalogue.hampers` where `featured` is true and not `oos`  (`gen: hamper-featured`)
- CTA: See every hamper -> /shop

## Maker story teaser
- H3: Sourced by hand, not by catalogue
- Body: Small-batch Ceylon tea, local honey, and handloom wrapping — from named partners, not a warehouse shelf. Every hamper tells you exactly where it came from.
- CTA: Meet the makers -> /makers

## Corporate teaser
- H3: Gifting at scale, without losing the personal touch
- Body: One enquiry, one delivery window, consistent hampers for the whole team or client list — built for the person approving the order, not browsing for one.
- CTA: Corporate gifting -> /corporate

## Trust close / contact
- Line: Trusted by families and businesses across Sri Lanka.  [[TODO: confirm with client — this is a general claim with no figure behind it; add a real number only if the client supplies one]]
- Contact: Questions before you order? WhatsApp us -> {{cfg:whatsapp_url}}

## Open items
[[TODO: confirm with client]] "Trusted by families and businesses across Sri Lanka" (no number invented).
[[TODO: confirm with client]] "A handwritten gift note on every order" and "Sourced from named local makers" are copy supplied for this page; confirm they are true commitments.
[[TODO: confirm with client]] Hero and occasion imagery: none exists, so the page shows `data-placeholder` blocks with sprite icons.
[[TODO: confirm with client]] The cut-off shows as the config value "14:00" (24-hour); confirm the display format.
