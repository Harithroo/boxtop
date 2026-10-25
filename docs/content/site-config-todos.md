# Site config and catalogue: placeholders awaiting the client

Everything below is placeholder data in `tools/site-config.json` and `tools/catalogue.json`. None of it is a confirmed client fact.
Each config key also carries a note under `_todo` in the JSON (not published to the browser).

[[TODO: confirm with client]] `shipping_fee` = 450. Flat placeholder; the real app prices delivery per zone.
[[TODO: confirm with client]] `free_delivery_threshold` = 10000.
[[TODO: confirm with client]] `same_day_cutoff` = "14:00" (Asia/Colombo). The 2 PM comes from the design system's sample copy, not from the client.
[[TODO: confirm with client]] `delivery_days` = Colombo "1 day", Islandwide "2 to 4 days". Generic split; real zone names and boundaries unknown.
[[TODO: confirm with client]] `support_hours` = "Mon to Sat, 9:00 AM to 6:00 PM".
[[TODO: confirm with client]] `whatsapp_number` = "+94 7X XXX XXXX" and `whatsapp_url` = "https://wa.me/947XXXXXXXX". Neither is a working number.
[[TODO: confirm with client]] `bank_accounts`: two entries, every field a placeholder (bank name, account name, "XXXX XXXX XXXX", branch).
[[TODO: confirm with client]] Catalogue: all 14 hamper names, contents, P-numbers, prices, tags and the featured / new / oos flags; the 6 occasions, 5 recipients and 5 add-ons with their prices (gift wrap at 350 comes from the design system's form example).
[[TODO: confirm with client]] Header and footer nav labels and the drawer / tab-bar labels (Shop, Occasions, Gifts for, Corporate, About, Track order; tab bar: Shop, Search, Hamper, Account).

Not placeholders, taken from HANDOFF.md: `cod_enabled: true` (cash on delivery and bank transfer are the only payment methods), `currency_prefix: "LKR "`, `timezone: "Asia/Colombo"`.
