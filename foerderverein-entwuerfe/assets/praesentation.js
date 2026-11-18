/* Konzeptseiten: Blätterleiste, Logo-Auswahl, Menü, kleine Interaktionen */
(function () {
  var KONZEPTE = [
    { id: 'one-pager', datei: 'one-pager.html', titel: 'One-Pager' },
    { id: 'klassisch', datei: 'klassisch.html', titel: 'Klassisch' },
    { id: 'mitmachen', datei: 'mitmachen.html', titel: 'Mitmachen' },
    { id: 'bildstark', datei: 'bildstark.html', titel: 'Bildstark' },
    { id: 'geschichte', datei: 'geschichte.html', titel: 'Damals & heute' }
  ];
  var LOGOS = [
    { id: 'modern', titel: 'Modern' },
    { id: 'familie', titel: 'Familie' },
    { id: 'siegel', titel: 'Siegel' },
    { id: 'wortmarke', titel: 'Wortmarke' }
  ];
  var skript = document.currentScript;
  var id = skript && skript.getAttribute('data-konzept');
  var root = document.documentElement;
  var param = new URLSearchParams(location.search);
  var vorschau = param.has('vorschau');
  if (vorschau) root.classList.add('vorschau');

  /* ---------- Logo ---------- */
  function gueltig(l) { return LOGOS.some(function (x) { return x.id === l; }); }
  var logo = param.get('logo');
  if (!gueltig(logo)) { try { logo = localStorage.getItem('fvg-logo'); } catch (e) {} }
  if (!gueltig(logo)) logo = 'modern';
  function logoSetzen(l, merken) {
    logo = l;
    document.querySelectorAll('img[data-logo]').forEach(function (img) {
      var ton = img.getAttribute('data-ton') || 'schwarz';
      img.src = '../assets/logos/' + l + '-' + ton + '.svg';
      img.setAttribute('data-logo-art', l);
    });
    if (merken) { try { localStorage.setItem('fvg-logo', l); } catch (e) {} }
    document.querySelectorAll('[data-logo-wahl]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-logo-wahl') === l ? 'true' : 'false');
    });
  }
  logoSetzen(logo, false);

  /* ---------- Menü auf dem Handy ---------- */
  var mk = document.querySelector('.k-menue-knopf');
  var menue = document.querySelector('.k-menue');
  if (mk && menue) {
    mk.addEventListener('click', function () {
      var offen = menue.classList.toggle('offen');
      mk.setAttribute('aria-expanded', offen ? 'true' : 'false');
    });
    menue.addEventListener('click', function (e) {
      if (e.target.closest('a')) { menue.classList.remove('offen'); mk.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- Einblenden ---------- */
  if ('IntersectionObserver' in window && !vorschau) {
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('sichtbar'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.k-einblenden').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.k-einblenden').forEach(function (el) { el.classList.add('sichtbar'); });
  }

  /* ---------- Klicks ---------- */
  document.addEventListener('click', function (e) {
    var k = e.target.closest('[data-iban-kopieren]');
    if (k) {
      var fertig = function () { k.setAttribute('data-kopiert', ''); k.querySelector('span').textContent = 'IBAN kopiert'; toast('IBAN in die Zwischenablage kopiert'); };
      try { navigator.clipboard.writeText('DE69701500000111141818').then(fertig, fertig); } catch (err) { fertig(); }
      return;
    }
    var b = e.target.closest('[data-beitrag]');
    if (b) {
      document.querySelectorAll('[data-beitrag]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      return;
    }
    var a = e.target.closest('[data-ansicht]');
    if (a) {
      var v = a.getAttribute('data-ansicht');
      document.querySelectorAll('[data-ansicht]').forEach(function (x) { x.setAttribute('aria-selected', x === a ? 'true' : 'false'); });
      document.querySelectorAll('[data-ansicht-bild]').forEach(function (img) { img.classList.toggle('aktiv', img.getAttribute('data-ansicht-bild') === v); });
      document.querySelectorAll('[data-ansicht-text]').forEach(function (t) { t.hidden = t.getAttribute('data-ansicht-text') !== v; });
      return;
    }
    var p = e.target.closest('a[href="#"]');
    if (p) e.preventDefault();
  });
  document.addEventListener('submit', function (e) { e.preventDefault(); });


  /* ---------- Effekte ---------- */
  var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAKEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var toastEl;
  function toast(text) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'k-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = HAKEN + '<span></span>'; toastEl.querySelector('span').textContent = text;
    toastEl.classList.add('zeigen'); clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('zeigen'); }, 2200);
  }
  // gestaffeltes Einblenden
  document.querySelectorAll('.k-einblenden').forEach(function (el) {
    var geschwister = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList && c.classList.contains('k-einblenden'); });
    var i = geschwister.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i * 90, 360) + 'ms';
  });
  // Bilder sanft einblenden
  if (!vorschau && !ruhig) {
    document.querySelectorAll('main img').forEach(function (img) {
      if (img.complete && img.naturalWidth) return;
      img.classList.add('k-laedt');
      img.addEventListener('load', function () { img.classList.add('k-geladen'); }, { once: true });
    });
  }
  // Auftritt beim Laden
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('geladen'); }); });
  // Kopfzeile, Fortschritt, Parallaxe
  var kopf = document.querySelector('.k-kopf');
  var balken = null;
  if (document.body.hasAttribute('data-fortschritt')) { balken = document.createElement('div'); balken.className = 'k-fortschritt'; document.body.appendChild(balken); }
  var para = ruhig || vorschau ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var tick = false;
  function scrollen() {
    tick = false;
    var y = window.scrollY || 0, vh = window.innerHeight;
    if (kopf) kopf.classList.toggle('gescrollt', y > 8);
    if (balken) { var h = document.documentElement.scrollHeight - vh; balken.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')'; }
    para.forEach(function (el) {
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var max = r.height * 0.08;
      var d = Math.max(-max, Math.min(max, (r.top + r.height / 2 - vh / 2) * -f));
      el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0) scale(1.18)';
    });
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(scrollen); } }, { passive: true });
  window.addEventListener('resize', scrollen);
  scrollen();
  // Zahlen hochzählen
  function zaehlen(el) {
    var ziel = parseInt(el.getAttribute('data-zaehlen'), 10), start = performance.now(), dauer = 1400;
    (function schritt(t) { var p = Math.min(1, (t - start) / dauer); p = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(ziel * p); if (p < 1) requestAnimationFrame(schritt); })(start);
  }
  if ('IntersectionObserver' in window && !vorschau && !ruhig) {
    var zo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { zaehlen(e.target); zo.unobserve(e.target); } }); }, { threshold: 0.6 });
    document.querySelectorAll('[data-zaehlen]').forEach(function (el) { el.textContent = '0'; zo.observe(el); });
    var ch = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('gezeichnet'); ch.unobserve(e.target); } }); }, { threshold: 0.3 });
    document.querySelectorAll('[data-zeichnen]').forEach(function (el) { ch.observe(el); });
  } else {
    document.querySelectorAll('[data-zeichnen]').forEach(function (el) { el.classList.add('gezeichnet'); });
  }
  // Bildbetrachter
  var lb = document.querySelectorAll('[data-lightbox]');
  if (lb.length && !vorschau) {
    var box = document.createElement('div'); box.className = 'k-lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Bildbetrachter');
    var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
    var R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
    box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button class="zu" type="button" aria-label="Schließen">' + X + '</button><button class="zurueck" type="button" aria-label="Vorheriges Bild">' + L + '</button><button class="weiter" type="button" aria-label="Nächstes Bild">' + R + '</button>';
    document.body.appendChild(box);
    var liste = Array.prototype.slice.call(lb), akt = 0, bildEl = box.querySelector('img'), text = box.querySelector('figcaption');
    function zeigen(i) {
      akt = (i + liste.length) % liste.length;
      var q = liste[akt].querySelector('img') || liste[akt];
      bildEl.src = q.currentSrc || q.src; bildEl.alt = q.alt || '';
      var cap = liste[akt].querySelector('figcaption'); text.textContent = cap ? cap.textContent : (q.alt || '');
    }
    function auf(i) { zeigen(i); box.classList.add('offen'); box.querySelector('.zu').focus(); document.documentElement.style.overflow = 'hidden'; }
    function zu() { box.classList.remove('offen'); document.documentElement.style.overflow = ''; }
    liste.forEach(function (el, i) { el.setAttribute('tabindex', '0'); el.addEventListener('click', function () { auf(i); }); el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(i); } }); });
    box.querySelector('.zu').addEventListener('click', zu);
    box.querySelector('.zurueck').addEventListener('click', function () { zeigen(akt - 1); });
    box.querySelector('.weiter').addEventListener('click', function () { zeigen(akt + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) zu(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('offen')) return;
      if (e.key === 'Escape') zu(); if (e.key === 'ArrowLeft') zeigen(akt - 1); if (e.key === 'ArrowRight') zeigen(akt + 1);
      e.stopImmediatePropagation();
    }, true);
  }

  /* ---------- Blätterleiste ---------- */
  if (vorschau) return;
  var i = KONZEPTE.findIndex(function (k) { return k.id === id; });
  if (i < 0) return;
  var vor = KONZEPTE[(i - 1 + KONZEPTE.length) % KONZEPTE.length];
  var nach = KONZEPTE[(i + 1) % KONZEPTE.length];
  var ico = {
    links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    rechts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    raster: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>'
  };
  var nav = document.createElement('nav');
  nav.className = 'fvg-leiste';
  nav.setAttribute('aria-label', 'Entwürfe durchblättern');
  nav.innerHTML =
    '<a class="fvg-zurueck" href="../index.html#konzepte">' + ico.raster + '<span>Übersicht</span></a>' +
    '<span class="fvg-trenner" aria-hidden="true"></span>' +
    '<a href="' + vor.datei + '" aria-label="Vorheriges Konzept: ' + vor.titel + '">' + ico.links + '</a>' +
    '<span class="fvg-titel"><span class="fvg-nr">' + (i + 1) + '/' + KONZEPTE.length + '</span> ' + KONZEPTE[i].titel + '</span>' +
    '<a href="' + nach.datei + '" aria-label="Nächstes Konzept: ' + nach.titel + '">' + ico.rechts + '</a>' +
    '<span class="fvg-trenner" aria-hidden="true"></span>' +
    '<span class="fvg-logos" role="group" aria-label="Logo wählen"><span class="fvg-logos-label">Logo</span>' +
    LOGOS.map(function (l) { return '<button type="button" data-logo-wahl="' + l.id + '">' + l.titel + '</button>'; }).join('') +
    '</span>';
  document.body.appendChild(nav);
  root.classList.add('mit-leiste');
  logoSetzen(logo, false);
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('[data-logo-wahl]');
    if (b) logoSetzen(b.getAttribute('data-logo-wahl'), true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea, select, button')) return;
    if (e.key === 'ArrowLeft') location.href = vor.datei;
    if (e.key === 'ArrowRight') location.href = nach.datei;
  });
})();
