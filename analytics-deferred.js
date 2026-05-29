/**
 * Deferred analytics loader — GTM, GA4, Google Ads, Mixpanel.
 * Loaded after page load to keep critical path clean.
 */
(function () {
  'use strict';

  function loadScript(src, async) {
    var s = document.createElement('script');
    s.src = src;
    if (async !== false) s.async = true;
    document.head.appendChild(s);
    return s;
  }

  function initGTM() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=GTM-PWPTLLHZ');
  }

  function initGA() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-T3T0PES8C0');
    window.gtag('config', 'AW-17614436696', { allow_enhanced_conversions: true });
    window.gtag('event', 'conversion_event_page_view', {});
    loadScript('https://www.googletagmanager.com/gtag/js?id=G-T3T0PES8C0');
  }

  async function hashEmail(email) {
    if (!email || !window.crypto || !window.crypto.subtle) return null;
    try {
      var normalized = email.toLowerCase().trim();
      var data = new TextEncoder().encode(normalized);
      var hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    } catch (_) {
      return null;
    }
  }
  window.hashEmail = hashEmail;

  function initMixpanel() {
    (function (e, c) {
      if (c.__SV) return;
      var l, h;
      window.mixpanel = c;
      c._i = [];
      c.init = function (q, r, f) {
        function t(d, a) {
          var g = a.split('.');
          if (g.length === 2) { d = d[g[0]]; a = g[1]; }
          d[a] = function () { d.push([a].concat(Array.prototype.slice.call(arguments, 0))); };
        }
        var b = c;
        if (typeof f !== 'undefined') b = c[f] = [];
        else f = 'mixpanel';
        b.people = b.people || [];
        l = 'disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking people.set people.set_once'.split(' ');
        for (h = 0; h < l.length; h++) t(b, l[h]);
        c._i.push([q, r, f]);
      };
      c.__SV = 1.2;
      var k = e.createElement('script');
      k.type = 'text/javascript';
      k.async = true;
      k.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
      e.getElementsByTagName('script')[0].parentNode.insertBefore(k, e);
    })(document, window.mixpanel || []);

    mixpanel.init('bcf2edbf4f718b186314825c2d961256', {
      autocapture: false,
      record_sessions_percent: 0,
      track_pageview: false,
      persistence: 'localStorage',
      batch_requests: true
    });
  }

  function initWebVitals() {
    if (typeof webVitals === 'undefined') return;
    var send = function (metric) {
      if (typeof gtag === 'function') {
        gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true
        });
      }
    };
    webVitals.onLCP(send);
    webVitals.onINP(send);
    webVitals.onCLS(send);
  }

  function boot() {
    initGTM();
    initGA();
    initMixpanel();
    if (typeof webVitals !== 'undefined') initWebVitals();
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(boot, { timeout: 3000 });
  } else {
    window.addEventListener('load', boot);
  }
})();
