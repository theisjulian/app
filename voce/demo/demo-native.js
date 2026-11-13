/* Voce · Online-Demo: Ersatz für die Brücke zum Programm (preload.js / main.js) · © 2026 theisapps
   In der App liest und schreibt window.native Dateien. Hier gibt es keine Dateien: Der Stand liegt nur
   im Arbeitsspeicher des Browsers und ist nach dem Neuladen wieder wie am Anfang.
   Nichts wird gespeichert, gelesen, exportiert oder übertragen (kein localStorage, kein IndexedDB, keine Cookies). */
(function () {
  'use strict';
  /* Stil der Website übernehmen (nur lesen), danach Browser-Speicher durch Arbeitsspeicher ersetzen */
  let site = null; try { site = window.localStorage.getItem('theis-stil'); } catch (e) {}
  const memStore = () => { const m = new Map(); return {
    getItem: k => (m.has(String(k)) ? m.get(String(k)) : null), setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: k => { m.delete(String(k)); }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null, get length() { return m.size; } }; };
  for (const k of ['localStorage', 'sessionStorage']) { try { Object.defineProperty(window, k, { value: memStore(), configurable: true }); } catch (e) {} }
  try { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); } catch (e) {}
  const skin = site === 'neon' ? 'neon' : site === 'heft' ? 'heft' : 'klar';
  window.localStorage.setItem('voce_look', JSON.stringify({ skin, mode: 'auto', font: 'standard', zoom: 1 }));

  /* Word-Bibliothek fehlt in der Demo (Word-Export ist gesperrt): Platzhalter, damit export.js lädt */
  const dummy = new Proxy(function () {}, { get: (t, p) => (p === Symbol.toPrimitive ? () => '' : dummy), construct: () => ({}), apply: () => dummy });
  window.docx = new Proxy({}, { get: () => dummy });

  let mem = null; const t0 = Date.now(), MIN = 60000, DAY = 864e5;
  const X = window.__voceDemo = { version: '1.9.3', locked: () => {} };
  const never = () => new Promise(() => {});
  const lock = (what, ret) => { X.locked(what); return ret; };
  const backups = () => [[4 * MIN, 'Dieser Computer'], [4 * MIN, 'Sicherungsordner'], [26 * 60 * MIN, 'Dieser Computer'], [3 * DAY, 'Dieser Computer'], [3 * DAY, 'Sicherungsordner']]
    .map(([ago, where]) => ({ name: 'voce-sicherung.json', where, time: t0 - ago }));

  window.native = {
    platform: 'web',
    load: async () => (mem = mem || (window.VoceDemoData ? window.VoceDemoData() : null)),
    save: async txt => { mem = txt; return true; },
    saveSync: txt => { mem = txt; return true; },
    version: async () => X.version,
    backup: {
      status: async () => ({ lastLocal: t0 - 4 * MIN, lastExternal: t0 - 4 * MIN, backupDir: 'USB-Stick „Schule“ (Beispiel)', lastLocalError: null, lastExternalError: null }),
      now: () => lock('Das Sichern', never()), list: async () => backups(),
      chooseDir: async () => lock('Der Sicherungsordner'), clearDir: async () => lock('Der Sicherungsordner'), openDir: async () => lock('Der Sicherungsordner'),
      read: async () => lock('Das Wiederherstellen einer Sicherung', { canceled: true }), beforeRestore: async () => true,
    },
    update: { check: async () => null, get: async () => ({ enabled: true }), set: async () => true },
    saveFile: async ({ name }) => lock(/\.docx$/.test(name) ? 'Der Word-Export' : /\.csv$/.test(name) ? 'Die Notenliste als Datei' : /\.json$/.test(name) ? 'Das Speichern als Datei' : 'Das Speichern von Dateien', { ok: false, canceled: true }),
    pdfFromHtml: async () => lock('Das Speichern als PDF', null),
    printHtml: async () => lock('Das Drucken', { ok: false, reason: 'cancelled' }),
    printViaPdf: async () => ({ ok: false }),
    openDoc: async which => { if (which === 'help') window.open('help.html?os=' + (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? 'mac' : 'win'), '_blank', 'noopener'); return true; },
    helpPdf: async () => lock('Die Anleitung als PDF'),
    licenses: async () => 'Voce verwendet Open-Source-Software (u. a. docx, pdf.js, SheetJS, Electron/Chromium). Die vollständigen Lizenztexte stehen in der installierten App.',
    onMenu: () => {},
  };
})();
