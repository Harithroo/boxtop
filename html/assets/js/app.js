/* App shell behaviour: current-page marking, mobile nav drawer, config filling. Production code, no proto dependencies. */
(function () {
  'use strict';

  // 1. aria-current on [data-nav] links. data-nav and body[data-page] are both space-separated token lists.
  function markCurrent() {
    var tokens = (document.body.dataset.page || '').split(/\s+/).filter(Boolean);
    if (!tokens.length) return;
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      var hit = el.dataset.nav.split(/\s+/).some(function (t) { return tokens.indexOf(t) !== -1; });
      if (hit) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  }

  // 2. Fill [data-cfg] / [data-cfg-attr] from window.BOXTOP_CONFIG.
  //    data-cfg="support_hours"                    -> textContent
  //    data-cfg="shipping_fee" data-cfg-format="money" -> textContent through money(); format="time" -> prettyTime()
  //    data-cfg-attr="href:whatsapp_url;title:support_hours" -> attributes
  function cfgValue(path) {
    var v = window.BOXTOP_CONFIG;
    path.split('.').forEach(function (k) { v = v == null ? v : v[k]; });
    return v;
  }
  var FORMATS = { money: 'money', time: 'prettyTime' };
  function fillConfig() {
    if (!window.BOXTOP_CONFIG) return;
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var v = cfgValue(el.dataset.cfg);
      if (v == null) return;
      var fmt = FORMATS[el.dataset.cfgFormat];
      el.textContent = fmt && window[fmt] ? window[fmt](v) : String(v);
    });
    document.querySelectorAll('[data-cfg-attr]').forEach(function (el) {
      el.dataset.cfgAttr.split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 1) return;
        var v = cfgValue(pair.slice(i + 1).trim());
        if (v != null) el.setAttribute(pair.slice(0, i).trim(), String(v));
      });
    });
  }

  // 3. Mobile nav drawer: focus trap, ESC, click-outside, focus returns to the trigger.
  function initDrawer() {
    var drawer = document.getElementById('nav-drawer');
    var trigger = document.querySelector('[data-nav-toggle]');
    if (!drawer || !trigger) return;
    var desktop = window.matchMedia('(min-width: 900px)');
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function focusables() {
      return Array.prototype.filter.call(drawer.querySelectorAll(FOCUSABLE), function (el) { return el.offsetParent !== null; });
    }
    function isOpen() { return !drawer.hidden; }
    function open() {
      if (isOpen() || desktop.matches) return;
      drawer.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      var f = focusables();
      if (f.length) f[0].focus();
      document.addEventListener('keydown', onKey);
    }
    function close() {
      if (!isOpen()) return;
      drawer.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      document.removeEventListener('keydown', onKey);
      trigger.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], active = document.activeElement;
      if (!drawer.contains(active)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }

    trigger.addEventListener('click', function () { if (isOpen()) close(); else open(); });
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer || e.target.closest('[data-nav-close]')) close();
      else { var a = e.target.closest('a[href^="#"]'); if (a) close(); }
    });
    // Resizing up to the desktop nav while the drawer is open closes it without stealing focus.
    var onChange = function () {
      if (desktop.matches && isOpen()) {
        drawer.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        document.removeEventListener('keydown', onKey);
      }
    };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else desktop.addListener(onChange);
  }

  function init() {
    markCurrent();
    fillConfig();
    initDrawer();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
