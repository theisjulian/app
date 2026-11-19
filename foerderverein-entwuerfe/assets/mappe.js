/* Übersicht und Logo-Seite: Anmeldung, Vorschauen, Einblenden */
(function () {
  var form = document.getElementById('login-form');
  if (form) {
    var fehler = document.getElementById('fehler');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      fehler.textContent = '';
      FVG.pruefen(document.getElementById('pw').value, document.getElementById('merken').checked).then(function (ok) {
        if (ok) { history.replaceState(null, '', location.pathname); window.scrollTo(0, 0); start(); }
        else { fehler.textContent = 'Das Passwort stimmt leider nicht.'; document.getElementById('pw').select(); }
      }, function (err) { fehler.textContent = err.message; });
    });
    if (!FVG.ok) setTimeout(function () { var pw = document.getElementById('pw'); if (pw) pw.focus(); }, 60);
  }
  document.querySelectorAll('[data-abmelden]').forEach(function (b) {
    b.addEventListener('click', function () { FVG.abmelden(); location.href = 'index.html'; });
  });
  if (!FVG.ok && /\/logos\.html$/.test(location.pathname)) { location.replace('index.html#anmelden'); return; }

  function skalieren() {
    document.querySelectorAll('.schirm').forEach(function (s) {
      var f = s.querySelector('iframe'); if (!f) return;
      var basis = parseInt(f.getAttribute('data-breite') || '1440', 10);
      var k = s.clientWidth / basis;
      if (k > 0) { f.style.width = basis + 'px'; f.style.height = Math.ceil(s.clientHeight / k) + 'px'; f.style.transform = 'scale(' + k + ')'; }
    });
  }
  function laden() {
    document.querySelectorAll('iframe[data-src]').forEach(function (f) { if (!f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-src')); });
    skalieren();
  }
  function start() {
    laden();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('sichtbar'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
      document.querySelectorAll('.einblenden').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.einblenden').forEach(function (el) { el.classList.add('sichtbar'); });
    }
  }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(skalieren);
    document.querySelectorAll('.schirm').forEach(function (s) { ro.observe(s); });
  } else { window.addEventListener('resize', skalieren); }

  // gestaffeltes Einblenden, Fortschritt, Kopfzeile
  document.querySelectorAll('.einblenden').forEach(function (el) {
    var g = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList && c.classList.contains('einblenden'); });
    var i = g.indexOf(el); if (i > 0) el.style.transitionDelay = Math.min(i * 90, 360) + 'ms';
  });
  var balken = document.createElement('div'); balken.className = 'fortschritt'; document.body.appendChild(balken);
  var kopf = document.querySelector('.m-kopf'), tick = false;
  function scrollen() {
    tick = false;
    var y = window.scrollY || 0, h = document.documentElement.scrollHeight - window.innerHeight;
    balken.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (kopf) kopf.style.boxShadow = y > 8 ? '0 8px 30px -14px rgba(0,0,0,0.2)' : '';
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(scrollen); } }, { passive: true });
  scrollen();
  if (FVG.ok) start();
})();
