/* The one money formatter. money(5800) -> "LKR 5,800". Whole rupees, thousands separator, no cents.
   Never hand-type a formatted price; call this. tools/sync-shell.mjs loads this same file to format generated markup. */
(function (global) {
  'use strict';
  function money(amountInRupees) {
    var n = Math.round(Number(amountInRupees));
    if (!isFinite(n)) return '';
    var cfg = global.BOXTOP_CONFIG;
    var prefix = cfg && typeof cfg.currency_prefix === 'string' ? cfg.currency_prefix : 'LKR ';
    var digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '-' : '') + prefix + digits;
  }
  global.money = money;
})(typeof window !== 'undefined' ? window : this);
