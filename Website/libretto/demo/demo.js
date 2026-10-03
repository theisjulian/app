/* Libretto · Online-Demo: Start, Hinweise und Sperren von Datei-Funktionen · © 2026 theis
   Wird nach app.js geladen. app.js bleibt unverändert – die Demo hängt sich nur an wenige Stellen:
   renderLock (Start ohne Passwort), exportModel (Word/Excel gesperrt), Datei-Eingaben (gesperrt). */
(function () {
  'use strict';
  const X = window.__librettoDemo, LADEN = '../#laden';

  /* Hinweis für alles, was es nur in der App gibt */
  X.locked = function (what) {
    sheet({ title: 'In der App verfügbar', small: true, ok: '', cancel: 'Schließen', body:
      `<p class="prose" style="margin-top:0"><b>${esc(what)}</b> gehört zur richtigen App. Die Demo speichert nichts, liest keine Dateien und gibt keine Dateien aus – so bleibt sie ein reines Ausprobieren.</p>
       <p class="hint">In Libretto für Mac und Windows: verschlüsselt speichern, automatische Sicherungen, Klassenlisten aus PDF, Excel und CSV, Ausdrucke als PDF, Word und Excel.</p>
       <div class="panelBtns"><a class="mini accent" href="${LADEN}">Libretto herunterladen</a></div>` });
  };

  /* Ausdrucke: nur ansehen (mit Wasserzeichen), nicht speichern oder drucken */
  X.preview = function (name, html, landscape) {
    const extra = `<style>html{background:#e7e9ee}body{position:relative;background:#fff;margin:18px auto!important;padding:14mm 12.7mm;width:${landscape ? '297mm' : '210mm'};max-width:calc(100% - 36px);min-height:${landscape ? '150mm' : '240mm'};box-shadow:0 2px 14px rgba(20,30,50,.18);overflow:hidden}
      body::after{content:"DEMO";position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) rotate(-28deg);font:800 120px/1 -apple-system,"Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;color:rgba(47,91,234,.09);pointer-events:none}
      @media print{html,body{display:none!important}}</style>`;
    const url = URL.createObjectURL(new Blob([String(html).replace('</head>', extra + '</head>')], { type: 'text/html' }));
    const s = sheet({ title: 'Vorschau', wide: true, ok: '', cancel: 'Schließen', body:
      `<p class="hint" style="margin-top:0">So sieht der Ausdruck aus. <b>Speichern und Drucken</b> (PDF, Word, Excel) gibt es in der App – <a href="${LADEN}">Libretto herunterladen</a>.</p>
       <iframe class="demoPrev" title="Vorschau des Ausdrucks" src="${url}"></iframe>` });
    s.dlg.classList.add('demoPrevDlg');
    s.dlg.addEventListener('close', () => URL.revokeObjectURL(url));
  };

  /* Word und Excel brauchen Bibliotheken, die in der Demo fehlen – vorher abfangen */
  const exportApp = exportModel;
  exportModel = function (m, kind) {
    if (kind === 'pdf') return exportApp(m, kind);
    X.locked(kind === 'docx' ? 'Der Word-Export' : 'Der Excel-Export'); return Promise.resolve();
  };

  /* Dateien einlesen (Klassenlisten, Notenlisten, Schultermine): gesperrt */
  document.addEventListener('click', e => {
    const t = e.target;
    if (t && t.matches && t.matches('input[type="file"]')) { e.preventDefault(); e.stopPropagation(); X.locked('Das Einlesen von Dateien'); }
  }, true);
  ['dragenter', 'dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => {
    if (!e.dataTransfer || ![...(e.dataTransfer.types || [])].includes('Files')) return;
    e.preventDefault(); e.stopPropagation();
    if (ev === 'drop') X.locked('Das Einlesen von Dateien');
  }, true));

  /* Start: gleich mit den Beispieldaten hinein. Die Sperre (Knopf oder nach 10 Minuten) zeigt den echten Sperrbildschirm. */
  const lockApp = renderLock; let first = true;
  renderLock = function (mode, info) {
    if (first) { first = false; D = window.LibrettoDemoData(window.Rules, window.Cal); migrate(); native.saveSync(D); enterApp(); return; }
    lockApp(mode, info);
    const pw = document.getElementById('pw'), err = document.getElementById('err');
    if (pw && mode !== 'code') pw.placeholder = 'Beliebiges Passwort';
    if (err) err.insertAdjacentHTML('beforebegin', '<p class="hint demoLockHint">Demo: Hier genügt ein beliebiges Passwort. In der App sind deine Noten damit verschlüsselt.</p>');
  };

  /* „Beta“ in der Kopfzeile durch „Demo“ ersetzen */
  const sub = document.getElementById('brandSub');
  const relabel = () => { if (sub.textContent.includes('· Beta')) sub.textContent = sub.textContent.replace('· Beta', '· Demo'); };
  new MutationObserver(relabel).observe(sub, { childList: true, characterData: true, subtree: true }); relabel();

  /* Demo-Leiste und Hinweis für kleine Bildschirme */
  document.getElementById('demoReset').onclick = () => location.reload();
  const small = document.getElementById('demoSmallGo'); if (small) small.onclick = () => document.body.classList.add('demoForce');

  X.start();
})();
