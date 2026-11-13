/* Voce · Online-Demo: Hinweise und Sperren von Datei-Funktionen · © 2026 theisapps
   Wird nach app.js geladen. Die App-Dateien bleiben unverändert – die Demo hängt sich nur an wenige Stellen:
   Word-Export, Dateiauswahl, Ziehen von Dateien, Hinweistext zur Speicherung. */
(function () {
  'use strict';
  const X = window.__voceDemo, LADEN = '../#laden';
  const h = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* Freundlicher Hinweis für alles, was es nur in der App gibt */
  const dlg = document.createElement('dialog'); dlg.className = 'demoDlg'; dlg.setAttribute('aria-labelledby', 'demoDlgT');
  document.body.appendChild(dlg);
  X.locked = function (what) {
    dlg.innerHTML = `<div class="demoDlgIn"><img src="icon.png" alt="" width="56" height="56"><h2 id="demoDlgT">Das gibt es in der App</h2>
      <p><b>${h(what)}</b> gehört zur richtigen App für Mac und Windows. Die Demo speichert nichts, liest keine Dateien und gibt keine Dateien aus – so bleibt sie ein reines Ausprobieren.</p>
      <p class="demoDlgSub">In Voce: Bewertungsbögen als Word, Pläne und Karten als PDF oder direkt gedruckt, Klassenlisten aus PDF und Excel, automatische Sicherungen.</p>
      <div class="demoDlgBtns"><button type="button" class="demoDlgClose">Weiter ausprobieren</button><a class="demoDlgGo" href="${LADEN}">Voce herunterladen</a></div></div>`;
    dlg.querySelector('.demoDlgClose').onclick = () => dlg.close();
    if (!dlg.open) dlg.showModal();
  };
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* Word-Ausgaben (Bewertungsbögen, Plan, Karten) */
  /* Export ist eine globale Konstante aus export.js (kein window-Eigenschaft) */
  ['sheets', 'plan', 'tasks'].forEach(k => { if (typeof Export !== 'undefined' && typeof Export[k] === 'function') Export[k] = () => { X.locked('Der Word-Export'); return Promise.resolve(); }; });

  /* Dateien auswählen (Klassenlisten, Logo, Bilder, Sicherungen): gesperrt – auch für Eingaben, die nicht im Dokument hängen */
  const clickApp = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function () { if (this.type === 'file') return X.locked('Das Einlesen von Dateien'); return clickApp.call(this); };
  if (HTMLInputElement.prototype.showPicker) { const sp = HTMLInputElement.prototype.showPicker; HTMLInputElement.prototype.showPicker = function () { if (this.type === 'file') return X.locked('Das Einlesen von Dateien'); return sp.call(this); }; }
  document.addEventListener('click', e => { const t = e.target; if (t && t.matches && t.matches('input[type="file"]')) { e.preventDefault(); e.stopPropagation(); X.locked('Das Einlesen von Dateien'); } }, true);
  ['dragenter', 'dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => {
    if (!e.dataTransfer || ![...(e.dataTransfer.types || [])].includes('Files')) return;
    e.preventDefault(); e.stopPropagation(); if (ev === 'drop') X.locked('Das Einlesen von Dateien');
  }, true));

  /* Einstellungen: ehrlicher Hinweis zur Speicherung */
  const info = document.getElementById('storeInfo');
  const TXT = 'Demo: Nichts wird gespeichert – nach dem Neuladen ist alles wie am Anfang. In der App liegen alle Daten nur auf deinem Gerät und werden bei jeder Änderung gespeichert; zusätzlich legt sie täglich eine Sicherung an.';
  if (info) new MutationObserver(() => { if (info.textContent !== TXT) info.textContent = TXT; }).observe(info, { childList: true, characterData: true, subtree: true });
  const ver = document.getElementById('appVersion'); if (ver) new MutationObserver(() => { if (!/Demo/.test(ver.textContent)) ver.textContent = ver.textContent + ' · Demo'; }).observe(ver, { childList: true });

  /* Unten in der Leiste: statt „Gesichert vor …“ */
  const bk = document.getElementById('sideBk');
  const BKT = 'Demo · nichts wird gespeichert';
  if (bk) { const TT = 'In der App sichert Voce automatisch bei Änderungen und beim Beenden';
    const fix = () => { if (bk.textContent !== BKT) bk.textContent = BKT; if (bk.title !== TT) bk.title = TT; if (bk.hidden) bk.hidden = false; if (bk.classList.contains('warn')) bk.classList.remove('warn'); };
    new MutationObserver(fix).observe(bk, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'title', 'class'] }); fix(); }

  /* Demo-Leiste und Hinweis für kleine Bildschirme */
  document.getElementById('demoReset').onclick = () => location.reload();
  const small = document.getElementById('demoSmallGo'); if (small) small.onclick = () => document.body.classList.add('demoForce');
})();
