/* Einfacher Zugangsschutz für die Entwurfsseite.
   Hinweis: Das ist ein Sichtschutz, keine echte Sicherheit – die Dateien
   liegen öffentlich auf dem Server. Passwort ändern: README.md lesen. */
(function () {
  var SCHLUESSEL = 'fvg-entwuerfe-zugang';
  var HASH = '2539ae4820c45c692055fd1bb769c571596bff0481bd948c8e96b9b2f3162737';
  var root = document.documentElement;

  function gespeichert() {
    try {
      return sessionStorage.getItem(SCHLUESSEL) === HASH || localStorage.getItem(SCHLUESSEL) === HASH;
    } catch (e) { return false; }
  }

  function hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  var ok = gespeichert();
  if (ok) root.classList.add('zugang-ok');

  // Logo-Variante für den One-Pager (?logo=A … E)
  try {
    var logo = (new URLSearchParams(location.search).get('logo') || 'A').toUpperCase();
    root.setAttribute('data-logo', /^[A-E]$/.test(logo) ? logo : 'A');
  } catch (e) { root.setAttribute('data-logo', 'A'); }

  var istKonzept = /\/konzepte\//.test(location.pathname);
  if (istKonzept && !ok) {
    location.replace('../index.html#anmelden');
  }

  window.FVG = {
    ok: ok,
    pruefen: function (passwort, merken) {
      if (!window.crypto || !crypto.subtle) {
        return Promise.reject(new Error('Dieser Browser unterstützt die Anmeldung nicht. Bitte die Seite über https öffnen.'));
      }
      var daten = new TextEncoder().encode(String(passwort).trim());
      return crypto.subtle.digest('SHA-256', daten).then(function (h) {
        var richtig = hex(h) === HASH;
        if (richtig) {
          try {
            sessionStorage.setItem(SCHLUESSEL, HASH);
            if (merken) localStorage.setItem(SCHLUESSEL, HASH);
          } catch (e) {}
          root.classList.add('zugang-ok');
          window.FVG.ok = true;
        }
        return richtig;
      });
    },
    abmelden: function () {
      try { sessionStorage.removeItem(SCHLUESSEL); localStorage.removeItem(SCHLUESSEL); } catch (e) {}
      root.classList.remove('zugang-ok');
      window.FVG.ok = false;
    }
  };
})();
