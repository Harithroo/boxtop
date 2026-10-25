/* Display formatters. money(5800) -> "LKR 5,800": whole rupees, thousands separator, no cents; never hand-type a formatted price.
   prettyTime("14:00") -> "2:00 PM". tools/sync-shell.mjs loads this same file to format generated markup. */
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
  // prettyTime("14:00") -> "2:00 PM". Display only; config keeps the 24-hour "HH:MM" value.
  function prettyTime(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
    if (!m || +m[1] > 23 || +m[2] > 59) return '';
    return ((+m[1] % 12) || 12) + ':' + m[2] + ' ' + (+m[1] >= 12 ? 'PM' : 'AM');
  }
  global.money = money;
  global.prettyTime = prettyTime;
})(typeof window !== 'undefined' ? window : this);
