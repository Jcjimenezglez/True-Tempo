/**
 * Minimal JS for pSEO landing pages — FAQ accordion, proof avatars, web vitals.
 */
(function () {
  'use strict';

  // FAQ accordion
  document.querySelectorAll('.content-faq-accordion .faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.parentElement.parentElement.querySelectorAll('.faq-question').forEach(function (b) {
        if (b !== btn) b.setAttribute('aria-expanded', 'false');
      });
      btn.setAttribute('aria-expanded', String(!isExpanded));
    });
  });

  // Proof avatars from public API
  var grid = document.getElementById('proofAvatarsGrid');
  if (grid) {
    fetch('/api/public/users-photos')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.photos)) return;
        data.photos.slice(0, 8).forEach(function (url) {
          var img = document.createElement('img');
          img.src = url;
          img.alt = '';
          img.width = 32;
          img.height = 32;
          img.loading = 'lazy';
          img.decoding = 'async';
          img.className = 'proof-avatar';
          grid.appendChild(img);
        });
      })
      .catch(function () {});
  }

  // Prefetch app on CTA hover
  document.querySelectorAll('.content-hero-cta').forEach(function (link) {
    link.addEventListener('mouseenter', function () {
      if (!document.querySelector('link[rel="prefetch"][href="/"]')) {
        var prefetch = document.createElement('link');
        prefetch.rel = 'prefetch';
        prefetch.href = '/';
        document.head.appendChild(prefetch);
      }
    }, { once: true });
  });

  // Core Web Vitals → GA4 (if gtag available after deferred load)
  function reportWebVitals() {
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

  if (document.readyState === 'complete') {
    reportWebVitals();
  } else {
    window.addEventListener('load', reportWebVitals);
  }
})();
