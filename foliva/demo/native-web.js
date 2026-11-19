/* Foliva-Web-Demo: ersetzt die Brücke zur Desktop-App (preload.js) im Browser · © 2026 theis
   Eingeschränkt: nichts wird gespeichert (nur bis zum Neuladen), kein Export und Import, kein Sicherungsordner,
   Drucken über den Browser mit Demo-Hinweis auf jeder Seite. */
(function () {
  'use strict';
  const DEMO_URL = 'https://theisapps.de/foliva/';
  const docs = new Map(); const cfg = { schools: null, layout: null, presets: null, layouts: [], customFonts: [] };
  let menuFn = null, insertGroups = [];
  const clone = o => JSON.parse(JSON.stringify(o));
  const status = () => ({ backupDir: null, lastLocal: null, lastLocalError: null, lastExternal: null, lastExternalError: null, updateCheck: false, dataDir: '(nur im Browser, wird nicht gespeichert)', schools: cfg.schools || null, layout: cfg.layout || null, presets: cfg.presets || null, layouts: cfg.layouts || [], customFonts: cfg.customFonts || [], prevVersion: null, demo: true });
  const send = cmd => { if (menuFn) menuFn(cmd); };

  /* kurzer Hinweis im Stil der App */
  function note(msg) {
    let t = document.getElementById('demoNote'); if (!t) { t = document.createElement('div'); t.id = 'demoNote'; document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add('on'); clearTimeout(note.t); note.t = setTimeout(() => t.classList.remove('on'), 4200);
  }
  const onlyApp = what => { note(`${what} gibt es in der kostenlosen Foliva-App. <a href="${DEMO_URL}" target="_blank" rel="noopener">Foliva laden</a>`); return { ok: false }; };

  /* Drucken: Seiten in einem unsichtbaren Rahmen setzen und den Druckdialog des Browsers öffnen */
  function printHTML(html) {
    return new Promise(res => {
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
      f.src = 'print.html'; document.body.appendChild(f);
      f.onload = async () => {
        const w = f.contentWindow, d = f.contentDocument;
        d.getElementById('pages').innerHTML = html;
        d.querySelectorAll('.page').forEach(p => p.insertAdjacentHTML('beforeend', '<div class="demoMk">Mit der Foliva-Demo erstellt · kostenlos: theisapps.de/foliva</div>'));
        const st = d.createElement('style'); st.textContent = '.demoMk{position:absolute;top:5mm;right:16mm;font:7pt/1 system-ui,sans-serif;color:#8a8f98;letter-spacing:.02em}'; d.head.appendChild(st);
        try { await d.fonts.ready; await Promise.all([...d.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))); } catch (e) { }
        setTimeout(() => { w.focus(); w.print(); setTimeout(() => { f.remove(); res({ ok: true }); }, 1500); }, 150);
      };
    });
  }

  window.native = {
    list: async () => ({ docs: [...docs.values()].map(clone), problems: [] }),
    save: async doc => { const prev = docs.get(doc.id); const next = { ...clone(doc), rev: (prev ? prev.rev || 0 : doc.rev || 0) + 1, modified: new Date().toISOString() }; docs.set(doc.id, next); return { ok: true, rev: next.rev, modified: next.modified }; },
    saveSync: doc => { docs.set(doc.id, clone(doc)); return { ok: true }; },
    versions: async () => [], version: async () => null, snapshot: async () => ({ ok: true }),
    purge: async id => { docs.delete(id); return { ok: true }; },
    backupNow: async () => ({ ok: true, demo: true, status: status() }),
    backupStatus: async () => status(), backupList: async () => [],
    chooseBackupDir: async () => { onlyApp('Ein Sicherungsordner'); return status(); },
    clearBackupDir: async () => status(), openBackupDir: async () => onlyApp('Sicherungen'),
    pickArchive: async () => { onlyApp('Das Öffnen von Foliva-Dateien'); return null; }, readArchive: async () => null,
    exportDocs: async () => onlyApp('Das Exportieren'),
    pickImage: () => new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/png,image/jpeg,image/gif,image/webp';
      i.onchange = () => { const f = i.files && i.files[0]; if (!f) return res(null); if (f.size > 8 * 1024 * 1024) return res({ error: 'In der Demo sind Bilder bis 8 MB möglich.' }); const r = new FileReader(); r.onload = () => res({ name: f.name, dataUrl: r.result }); r.onerror = () => res(null); r.readAsDataURL(f); };
      i.click();
    }),
    pdf: async (name, html) => { note('In der Demo: im Druckdialog „Als PDF speichern“ wählen.'); await printHTML(html); return { ok: false }; },
    pdfBuffer: async () => null,
    print: html => printHTML(html),
    setCfg: async patch => { Object.assign(cfg, clone(patch)); return status(); },
    getCfg: async key => key === 'lernwoerter' ? (cfg.lernwoerter ?? null) : null,
    listFonts: async () => [],
    appVersion: async () => window.FOLIVA_DEMO_VERSION || 'Demo',
    platform: async () => /Mac/.test(navigator.platform) ? 'darwin' : 'web',
    licenses: async () => { try { return await (await fetch('licenses/licenses.txt')).text(); } catch (e) { return 'Lizenzen: siehe theisapps.de/foliva'; } },
    chromiumLicenses: async () => { window.open('licenses/LICENSES.chromium.html', '_blank', 'noopener'); return true; },
    openExternal: async url => { if (/^https:\/\//.test(url)) window.open(url, '_blank', 'noopener'); return true; },
    updateCheck: async () => null,
    flushed: () => { },
    onMenu: fn => { menuFn = fn; },
    setInsertMenu: groups => { insertGroups = Array.isArray(groups) ? groups : []; },
  };

  /* Menüleiste (ersetzt das Programmmenü der Desktop-App) */
  const MAC = /Mac/.test(navigator.platform), K = MAC ? '⌘' : 'Strg+';
  const M = () => [
    ['Datei', [['Neues Material …', 'new', K + 'N'], ['Meine Materialien', 'library', K + 'O'], '-', ['Tab schließen', 'closeTab'], '-', ['Als PDF speichern …', 'pdf'], ['Drucken …', 'print', K + 'P'], '-', ['Einstellungen …', 'settings']]],
    ['Bearbeiten', [['Rückgängig', 'undo', K + 'Z'], ['Wiederholen', 'redo', MAC ? '⇧⌘Z' : 'Strg+Y'], '-', ['Suchen und Ersetzen …', 'find'], ['Wortfinder …', 'wordfinder']]],
    ['Ansicht', [['Lösungen ein/aus', 'solutions', K + 'L'], ['Mehr Platz fürs Blatt', 'focus'], '-', ['Blatt vergrößern', 'zoomIn'], ['Blatt verkleinern', 'zoomOut'], ['Blatt einpassen', 'zoomFit']]],
    ['Einfügen', insertGroups.length ? insertGroups.map(g => [String(g.label), (g.items || []).map(it => [String(it.name), 'insert:' + it.type])]).concat(['-', ['Seitenumbruch', 'insert:break']]) : [['Seitenumbruch', 'insert:break']]],
    ['Format', [['Seite einrichten …', 'pageSetup'], ['Kopf und Titel …', 'headSetup'], '-', ['Hochformat', 'orient:hoch'], ['Querformat', 'orient:quer']]],
    ['Werkzeuge', [['Alle Aufgaben neu erzeugen …', 'regenAll'], ['Parallelversion (B) mit neuen Zahlen', 'parallel'], ['Alle Positionen zurücksetzen', 'resetPos'], '-', ['Vorlagen …', 'templates']]],
    ['Hilfe', [['Foliva-Hilfe', 'help'], ['Über Foliva …', 'about']]],
  ];
  function closeMenus() { document.querySelectorAll('#demoBar .dm.open').forEach(x => x.classList.remove('open')); }
  function buildBar() {
    const bar = document.createElement('div'); bar.id = 'demoBar'; bar.setAttribute('role', 'menubar');
    const list = items => `<div class="dmList" role="menu">${items.map(x => x === '-' ? '<hr>' : Array.isArray(x[1]) ? `<div class="dmSub"><span>${x[0]}</span><b>›</b>${list(x[1])}</div>` : `<button type="button" role="menuitem" data-c="${x[1]}"><span>${x[0]}</span>${x[2] ? `<kbd>${x[2]}</kbd>` : ''}</button>`).join('')}</div>`;
    const render = () => { bar.innerHTML = `<span class="dmBrand">Foliva <em>Demo</em></span>${M().map(([l, items], i) => `<div class="dm" data-i="${i}"><button type="button" class="dmTop" aria-haspopup="true">${l}</button>${list(items)}</div>`).join('')}<span class="dmSp"></span><span class="dmInfo">Demo: Nichts wird gespeichert – nach dem Neuladen ist alles weg.</span><a class="dmGet" href="${DEMO_URL}" target="_blank" rel="noopener">Foliva kostenlos laden</a>`; };
    render();
    bar.addEventListener('mousedown', e => { const top = e.target.closest('.dmTop'); if (top) { e.preventDefault(); const m = top.parentElement; const was = m.classList.contains('open'); closeMenus(); if (!was) { if (m.dataset.i === '3') { render(); bar.querySelector('.dm[data-i="3"]').classList.add('open'); } else m.classList.add('open'); } } });
    bar.addEventListener('mouseover', e => { const m = e.target.closest('.dm'); if (m && bar.querySelector('.dm.open') && !m.classList.contains('open')) { closeMenus(); m.classList.add('open'); } });
    bar.addEventListener('click', e => { const b = e.target.closest('button[data-c]'); if (!b) return; closeMenus(); send(b.dataset.c); });
    document.addEventListener('mousedown', e => { if (!e.target.closest('#demoBar')) closeMenus(); }, true);
    document.body.prepend(bar);
  }
  /* Tastenkürzel, die in der Desktop-App das Programmmenü auslöst */
  const KEYS = { n: 'new', o: 'library', p: 'print', e: 'pdf', l: 'solutions', '.': 'focus', '0': 'zoomFit', '+': 'zoomIn', '=': 'zoomIn', '-': 'zoomOut', f: 'find' };
  document.addEventListener('keydown', e => {
    const mod = MAC ? e.metaKey : e.ctrlKey; if (!mod || e.altKey) return;
    const k = e.key.toLowerCase(); const inText = e.target.closest && e.target.closest('input,textarea,[contenteditable="true"]');
    if (k === 'z' && !inText) { e.preventDefault(); send(e.shiftKey ? 'redo' : 'undo'); return; }
    if (k === 'y' && !MAC && !inText) { e.preventDefault(); send('redo'); return; }
    if (k === 'f' && e.shiftKey) { e.preventDefault(); send('wordfinder'); return; }
    if (k === 'p' && e.shiftKey) { e.preventDefault(); send('pageSetup'); return; }
    if (k === 's') { e.preventDefault(); note('In der Demo wird nichts gespeichert. <a href="' + DEMO_URL + '" target="_blank" rel="noopener">Foliva laden</a>'); return; }
    if (KEYS[k] && !e.shiftKey) { e.preventDefault(); send(KEYS[k]); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildBar); else buildBar();
  window.addEventListener('beforeunload', e => { if (docs.size) { e.preventDefault(); e.returnValue = ''; } });
})();
