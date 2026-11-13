/* Foliva – Arbeitsblätter und Proben gestalten · © 2026 theis
   Oberfläche: Startseite/Meine Materialien und Editor (Gestaltung A: Einfügen · Blatt · Einstellungen). */
'use strict';
const N = window.native, G = window.FolivaGen, RD = window.FolivaRender, C = window.FolivaCatalog;
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = RD.esc;
const MM = 96 / 25.4;
const SUBJECTS = ['Mathematik', 'Deutsch', 'Heimat- und Sachunterricht (HSU)', 'Englisch', 'Italienisch', 'Französisch', 'Spanisch', 'Latein', 'Deutsch als Zweitsprache (DaZ)', 'Biologie', 'Chemie', 'Physik', 'Natur und Technik', 'Geschichte', 'Geographie', 'Politik und Gesellschaft', 'Wirtschaft und Recht', 'Wirtschaft und Beruf', 'Informatik', 'Ethik', 'Katholische Religionslehre', 'Evangelische Religionslehre', 'Islamischer Unterricht', 'Kunst', 'Musik', 'Sport', 'Werken und Gestalten'];
const SOLCOLORS = [['#C8102E', 'Rot'], ['#1D4ED8', 'Blau'], ['#15803D', 'Grün'], ['#7C3AED', 'Violett']];

/* ---------- Zustand ---------- */
const docs = new Map();
let ST = {}, VERSION = '', view = 'library', cur = null, sel = null, banners = [], zone = null, msel = new Set();
const UI = Object.assign({ left: true, right: true, zoom: 'fit', sol: false, closed: {}, libTab: 'alle', subject: '', grade: '', kind: '', q: '' }, (() => { try { return JSON.parse(localStorage.getItem('foliva-ui') || '{}'); } catch (e) { return {}; } })());
const saveUI = () => { try { localStorage.setItem('foliva-ui', JSON.stringify(UI)); } catch (e) {} };
const profile = () => C.profile(ST.schools);
const now = () => new Date().toISOString();
const rid = (p, n = 8) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return p + [...a].map(b => b.toString(16).padStart(2, '0')).join(''); };
const newDocId = () => rid('m-', 8);
const fmtTime = t => { const d = new Date(t); return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); };
const fmtDate = t => { const d = new Date(t); const today = new Date(); return d.toDateString() === today.toDateString() ? 'heute, ' + fmtTime(t) : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + fmtTime(t); };
const T = type => C.TYPES[type];
const MOD = navigator.platform && /Mac/.test(navigator.platform) ? '⌘' : 'Strg';
const canFill = it => !!(G.FILL[it.type] && it.source && it.source !== 'eigene');
const canNew = it => canFill(it) || !!(T(it.type) && T(it.type).gen) || (['text', 'sachtext'].includes(it.type) && ['luecke', 'schuetteln', 'saetze'].includes(it.ex));

function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms); }

/* ---------- Material-Modell ---------- */
/* Voreinstellungen getrennt für Grundschule/Förderschule (Jg. 1–4) und weiterführende Schulen.
   Sie gelten nur für NEUE Materialien – gespeicherte Materialien werden nie nachträglich verändert. */
const PRESET_BASE = {
  primar: { font: 'grundschrift', fontI: 'theis', fontC: 'grundschrift', fontT: '', size: 14, assess: 'Probe' },
  sek: { font: 'system', fontI: '', fontC: '', fontT: '', size: 12, assess: 'Schulaufgabe' },
};
function stageDefault() { const p = profile(); const sek = p.schools.some(s => ['ms', 'rs', 'gy'].includes(s)); if (UI.stage && (UI.stage === 'primar' || UI.stage === 'sek')) return (p.primary && sek) ? UI.stage : (p.primary ? 'primar' : 'sek'); return p.primary ? 'primar' : 'sek'; }
function presetFor(stage) {
  const L = ST.layout || {}, P = (ST.presets || {})[stage] || {};
  const base = { ...PRESET_BASE[stage] };
  /* ältere Einstellung (0.2): eine Standardschrift für alles */
  if (!ST.presets && L.font) { base.font = L.font; if (stage === 'primar' && L.font !== 'grundschrift') { base.fontI = ''; base.fontC = ''; } }
  return { ...base, ...P, header: L.header !== false, numbering: L.numbering !== false, solColor: L.solColor || '#C8102E', size: +P.size || +L.size || base.size };
}
function layoutDefaults() { return presetFor(stageDefault()); }
function newDoc(kind = 'arbeitsblatt', stage = stageDefault()) {
  const L = presetFor(stage);
  return { id: newDocId(), schema: 1, rev: 0, fontsV: 2, stage, title: kind === 'probe' ? 'Neue ' + L.assess : 'Neues Arbeitsblatt', kind, assess: L.assess, subject: '', grades: [], topic: '', tags: '', fav: false, deleted: null, created: now(), modified: now(),
    settings: { header: L.header, showTitle: true, numbering: L.numbering, font: L.font, fontI: L.fontI || '', fontC: L.fontC || '', fontT: L.fontT || '', size: L.size, solColor: L.solColor, headStyle: kind === 'probe' && stage === 'sek' ? 'leistung' : 'linie', frame: 'none' }, items: [] };
}
function newDocWithLayout(kind, stage) { const d = newDoc(kind, stage); const L = presetFor(d.stage); if (L.layout && kind !== 'probe') applyLayout(d, L.layout); return d; }
function applyPreset(stage) {
  const L = presetFor(stage);
  change(() => { Object.assign(cur.settings, { font: L.font, fontI: L.fontI || '', fontC: L.fontC || '', fontT: L.fontT || '', size: L.size }); cur.stage = stage; cur.fontsV = 2; }, null, { panel: true });
  toast(`Voreinstellung ${stage === 'primar' ? 'Grundschule' : 'Sekundarstufe'} übernommen – Rückgängig mit ${MOD}+Z.`);
}
/* Daten nur ergänzen, nie entfernen */
const REPAIRED = new Map();
function migrate(d) {
  d.items = Array.isArray(d.items) ? d.items : []; d.settings = { header: true, showTitle: true, numbering: true, font: 'grundschrift', size: 14, solColor: '#C8102E', ...(d.settings || {}) };
  d.kind = d.kind === 'probe' ? 'probe' : 'arbeitsblatt'; d.grades = Array.isArray(d.grades) ? d.grades : []; ['subject', 'topic', 'tags', 'title'].forEach(k => { if (typeof d[k] !== 'string') d[k] = d[k] == null ? '' : String(d[k]); });
  /* Titel ist reiner Text (Tab, Dateiname). Formatzeichen im Titel (aus 0.9.6) → Formatierung nach titleRich */
  if (/\*\*|\/\/|__|\{\{|\^\{|_\{/.test(d.title)) {
    const runs = RD.RT.parse(d.title); let p = RD.RT.plain(runs, { oneLine: true });
    p = p.replace(/\*\*|__/g, '').replace(/(^|[^:])\/\//g, '$1').replace(/\s+/g, ' ').trim();
    if (p && p !== d.title) { if (!d.titleRich && RD.RT.hasFormat(runs) && RD.RT.plain(runs, { oneLine: true }) === p) d.titleRich = RD.RT.serialize(runs); d.title = p; }
  }
  if (d.titleRich != null && typeof d.titleRich !== 'string') delete d.titleRich;
  if (d.settings.pnFmt === undefined) { d.settings.pnFmt = d.settings.pageNums === true ? 'seite-von' : ''; }
  { const fix = o => { if (!o) return; ['font', 'fontI', 'fontC', 'fontT', 'pfont'].forEach(k => { if (typeof o[k] === 'string' && /^(sys:|custom:)theis druck 02$/i.test(o[k])) o[k] = 'theis'; }); }; fix(d.settings); d.items.forEach(fix); }
  d.items.forEach(it => {
    if (!it.id) it.id = rid('i', 6);
    /* bis 0.2 wurde die Vorgabe zum Nachspuren immer in der Grundschrift gezeigt – so bleibt es für ältere Materialien */
    if (it.type === 'lineatur' && !d.fontsV && it.pfont == null) it.pfont = 'grundschrift';
    if (T(it.type) && T(it.type).gen && !it.data) regen(it);
  });
  if (d.kind === 'probe' && !d.assess) d.assess = 'Probe';
  try { const n = repairPositions(d); if (n) REPAIRED.set(d.id, n); } catch (e) { }
  return d;
}
function makeItem(type) {
  const p = profile(); const st = cur && cur.stage ? cur.stage : stageDefault();
  const it = { id: rid('i', 6), type, seed: G.newSeed(), ...T(type).make({ ...p, primary: st === 'primar' }) };
  /* Klassenstufe aus den Jahrgangsstufen des Materials übernehmen (nur Grundschule) */
  if (C.STUFE_TYPES && C.STUFE_TYPES.has(type) && it.stufe == null && cur && Array.isArray(cur.grades) && cur.grades.length) { const g = cur.grades; if (g.every(x => x <= 2)) it.stufe = '12'; else if (g.every(x => x >= 3 && x <= 4)) it.stufe = '34'; }
  G.fill(it); regen(it); return it;
}
/* Neue Aufgaben: neuer Zufallsstartwert, Inhalte aus der Sammlung neu ziehen (falls gewählt), dann Aufgaben/Lösungen berechnen */
function renew(it) { it.seed = G.newSeed(); G.fill(it); regen(it); }
/* Leere Zeilen zählen nicht – bei Texteingaben nur neu berechnen, wenn sich die Anzahl ändert */
function regenLight(it) { const g = T(it.type) && T(it.type).gen; if (!g) return; const before = JSON.stringify(it.data || {}).length; regen(it); }
function regen(it) { const g = T(it.type) && T(it.type).gen; if (g && G[g]) { try { it.data = G[g](it); } catch (e) { it.data = { error: 'Fehler beim Erzeugen: ' + e.message }; } } }
function searchText(d) { return [d.title, d.subject, d.topic, d.tags, JSON.stringify(d.items, (k, v) => (k === 'data' || k === 'src' || k === 'seed' || k === 'id') ? undefined : v)].join(' ').toLowerCase(); }

/* ---------- Speichern (Arbeitsstand) ---------- */
const SV = { dirty: new Set(), timer: null, saving: false, again: false, state: 'saved', at: null, err: null, retry: null };
function markDirty(d) { SV.dirty.add(d.id); setSaveState('dirty'); clearTimeout(SV.timer); SV.timer = setTimeout(flush, 900); }
async function flush() {
  clearTimeout(SV.timer);
  if (SV.saving) { SV.again = true; return SV.running; }
  if (!SV.dirty.size) return true;
  SV.saving = true; setSaveState('saving');
  SV.running = (async () => {
    let ok = true;
    for (const id of [...SV.dirty]) {
      const d = docs.get(id); SV.dirty.delete(id); if (!d) continue;
      try {
        const r = await N.save(d);
        if (r.conflict) { migrate(r.copy); docs.set(r.copy.id, r.copy); addBanner('info', `„${d.title}“ wurde inzwischen an anderer Stelle geändert. Deine Fassung ist als „${r.copy.title}“ gesichert.`); }
        else { d.rev = r.rev; d.modified = r.modified; }
      } catch (e) { SV.dirty.add(id); ok = false; SV.err = e.message || String(e); }
    }
    SV.saving = false;
    if (!ok) { setSaveState('error'); clearTimeout(SV.retry); SV.retry = setTimeout(flush, 5000); return false; }
    if (SV.again || SV.dirty.size) { SV.again = false; return flush(); }
    SV.at = Date.now(); SV.err = null; setSaveState('saved'); return true;
  })();
  return SV.running;
}
function setSaveState(s) {
  SV.state = s; const el = $('#saveState'); if (!el) return;
  el.className = 'status ' + s;
  el.innerHTML = s === 'error' ? `<i class="dot"></i>Speichern fehlgeschlagen` : s === 'saving' ? `<i class="dot"></i>Speichert …` : s === 'dirty' ? `<i class="dot"></i>Ungespeicherte Änderungen` : `<i class="dot"></i>${SV.at ? 'Gespeichert um ' + fmtTime(SV.at) : 'Gespeichert'}`;
  el.title = s === 'error' ? 'Fehler: ' + (SV.err || '') + ' – Foliva versucht es weiter. Zur Sicherheit: Material exportieren.' : 'Jede Änderung wird automatisch auf diesem Computer gespeichert.';
  const b = $('#saveErr'); if (b) b.hidden = s !== 'error';
  if (b && s === 'error') $('#saveErrMsg').textContent = SV.err || '';
}
window.addEventListener('beforeunload', () => { if (SV.dirty.size) for (const id of SV.dirty) { const d = docs.get(id); if (d) N.saveSync(d); } });

/* ---------- Rückgängig ---------- */
const newUndo = () => ({ stack: [], redo: [], key: null, at: 0 });
let UNDO = newUndo();
const SNAP_KEYS = ['title', 'titleRich', 'kind', 'assess', 'subject', 'grades', 'topic', 'tags', 'notes', 'settings', 'items'];
const snap = d => JSON.stringify(Object.fromEntries(SNAP_KEYS.map(k => [k, d[k] === undefined ? null : d[k]])));
function change(fn, key = null, opts = {}) {
  if (!cur) return;
  const t = Date.now();
  if (!(key && key === UNDO.key && t - UNDO.at < 1500)) { UNDO.stack.push(snap(cur)); if (UNDO.stack.length > 150) UNDO.stack.shift(); UNDO.redo = []; }
  UNDO.key = key; UNDO.at = t;
  fn(); try { repairPositions(cur); } catch (e) { } markDirty(cur); updateUndoBtns();
  if (opts.panel) renderRight();
  if (opts.top) renderTop();
  renderPages();
}
function undoRedo(dir) {
  if (!cur) return;
  const from = dir < 0 ? UNDO.stack : UNDO.redo, to = dir < 0 ? UNDO.redo : UNDO.stack;
  if (!from.length) return;
  to.push(snap(cur)); const o = JSON.parse(from.pop()); SNAP_KEYS.forEach(k => { if (o[k] === null || o[k] === undefined) delete cur[k]; else cur[k] = o[k]; }); UNDO.key = null;
  if (sel && !cur.items.some(i => i.id === sel)) sel = null;
  markDirty(cur); renderEditor();
}
function updateUndoBtns() { const u = $('#undoBtn'), r = $('#redoBtn'); if (u) u.disabled = !UNDO.stack.length; if (r) r.disabled = !UNDO.redo.length; }

/* ---------- Seiten berechnen ---------- */
let fontsReady = null;
function ensureFonts() { if (!fontsReady) fontsReady = Promise.all(['20px GSRegular', '300 20px GSRegular', 'bold 20px GSRegular', '20px GSPunkt', '20px GSKontur', '20px "theis Schuldruck Süd"', 'bold 20px "theis Schuldruck Süd"', '20px "Playwrite DE VA"', '20px "Playwrite DE VA Guides"'].map(f => document.fonts.load(f, 'Aa'))).then(() => document.fonts.ready).catch(() => true); return fontsReady; }
const pageVars = d => RD.pageVars(d);
/* Umbruch nacheinander berechnen (ein gemeinsamer Messbereich; Bilder werden abgewartet) */
let PAG = Promise.resolve();
function paginate(d, opts = {}) { const run = PAG.then(() => paginate0(d, opts)); PAG = run.catch(() => {}); return run; }
async function paginate0(d, opts = {}) {
  await ensureFonts();
  const bl = RD.blocks(d, { variant: opts.variant, editor: !!opts.editor });
  /* gemessen wird ohne Verschiebungen: von Hand verschobene Bausteine ändern den Seitenumbruch nie */
  const bm = RD.blocks(d, { variant: opts.variant, editor: !!opts.editor, noOffsets: true });
  let M = $('#measure'); if (!M) { M = document.createElement('div'); M.id = 'measure'; document.body.appendChild(M); }
  M.dataset.pv = pageVars(d); M.dataset.cw = RD.dims(d).cw;
  M.innerHTML = `<div class="page ${d.fontsV ? '' : 'v1'}" style="${pageVars(d)};height:auto;position:static"><div class="pc" style="position:static;width:${RD.dims(d).cw}mm">${(bm.length === bl.length ? bm : bl).map(RD.wrap).join('')}</div></div>`;
  /* Bilder erst laden lassen: ihre Höhe bestimmt den Umbruch (sonst rutscht ein Baustein später in den Fuß) */
  const imgs = [...M.querySelectorAll('img')].filter(i => !i.complete);
  if (imgs.length) await Promise.all(imgs.map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 3000); })));
  const blks = $$('.blk', M);
  /* zu breit (z. B. viele Spalten mit großen Kästchen): Inhalt des Bausteins auf die Satzbreite verkleinern statt rechts abschneiden */
  blks.forEach((e, i) => {
    if (e.classList.contains('free') || bm.length !== bl.length) return; const ib = e.querySelector(':scope > section.it > .ib'); if (!ib) return;
    if (ib.scrollWidth - ib.clientWidth < 2) return;
    let z = 1;
    for (let k = 0; k < 6 && ib.scrollWidth - ib.clientWidth >= 1 && z > .5; k++) { z = Math.max(.5, Math.floor(z * ib.clientWidth / ib.scrollWidth * 1000) / 1000 - .005); ib.style.zoom = z; }
    bl[i].html = bl[i].html.replace('<div class="ib">', `<div class="ib" style="zoom:${z}">`); bl[i].zoomW = z;
  });
  const hs = blks.map(e => e.getBoundingClientRect().height);
  /* frei schwebende Bausteine: eigene Höhe messen, damit sie nicht über den unteren Seitenrand hinausragen */
  const fhs = blks.map(e => { if (!e.classList.contains('free')) return 0; const it = e.querySelector('.it'); return it ? it.getBoundingClientRect().height : 0; });
  const max = RD.dims(d).ch * MM; const pages = [[]]; let h = 0;
  lineGutters(bl, blks);
  /* „Inhalt“ einer Seite: Kopf oder Unterschriftszeile allein zählen nicht – ein Seitenumbruch direkt nach dem Kopf erzeugt keine leere Seite */
  const filled = () => pages[pages.length - 1].some(x => !x.brk && !x.head);
  const any = () => pages[pages.length - 1].some(x => !x.brk);
  const place = (b, bh, i) => {
    /* nicht teilbar und höher als eine Seite: verkleinert drucken statt abschneiden (höchstens auf die Hälfte) */
    delete b.zoom;
    if (!b.free && bh > max + 1) { const z = Math.max(.5, Math.floor((max - 2 * MM) / bh * 1000) / 1000); b.zoom = z; bh = bh * z; }
    b.tall = bh > max + 1;
    if (h + bh > max + 0.5 && any()) { pages.push([]); h = 0; }
    b.h = bh; delete b.lift;
    if (b.free && fhs[i]) { let fh = fhs[i]; if (fh > max) { b.zoom = Math.max(.4, Math.floor((max - 2 * MM) / fh * 1000) / 1000); fh *= b.zoom; } const it = d.items.find(x => x.id === b.id); const top = h + (it && +it.dy || 0) * MM; const over = top + fh - max; if (over > .5) b.lift = Math.min(over, Math.max(0, top)) / MM; }
    pages[pages.length - 1].push(b); h += bh;
  };
  bl.forEach((b, i) => {
    if (b.brk) { if (opts.editor) pages[pages.length - 1].push(b); if (filled()) { pages.push([]); h = 0; } return; }
    /* von Hand verschobene Bausteine zählen mit ihrer ursprünglichen Höhe: Verschieben erzeugt nie eine neue Seite */
    const bh = b.free ? 0 : (bm.length === bl.length ? hs[i] : Math.max(0, hs[i] - (b.dy || 0) * MM));
    /* höher als eine Seite: zeilenweise auf mehrere Seiten verteilen, statt unten abzuschneiden */
    if (!b.free && !b.head && filled() && h + bh > max + 0.5 && max - h > 25 * MM && /t-(text|sachtext)\b/.test(b.html.slice(0, 200))) {
      const parts = flowText(b, blks[i], max - h, max);
      if (parts) { parts.forEach(([pb, ph], k) => { if (k) { pages.push([]); h = 0; } place(pb, ph, -1); }); return; }
      /* nicht teilbar und unter dem Kopf knapp zu hoch: etwas verkleinern, statt den Kopf allein auf der Seite zu lassen */
      if (!filled() && any() && bh <= max + 1) { const z = Math.floor((max - h - 1 * MM) / bh * 1000) / 1000; if (z >= .72) { b.zoom = z; b.tall = false; b.h = bh * z; delete b.lift; pages[pages.length - 1].push(b); h += b.h; return; } }
    }
    if (!b.free && !b.head && (bh > max + 1 || (!filled() && any() && h + bh > max + 0.5))) {
      const parts = splitTall(b, blks[i], any() ? max - h : max, max, M) || flowText(b, blks[i], any() ? max - h : max, max);
      if (parts) { parts.forEach(([pb, ph], k) => { if (k) { pages.push([]); h = 0; } place(pb, ph, -1); }); return; }
      /* nicht teilbar und unter dem Kopf knapp zu hoch: etwas verkleinern, statt den Kopf allein auf der Seite zu lassen */
      if (!filled() && any() && bh <= max + 1) { const z = Math.floor((max - h - 1 * MM) / bh * 1000) / 1000; if (z >= .72) { b.zoom = z; b.tall = false; b.h = bh * z; delete b.lift; pages[pages.length - 1].push(b); h += b.h; return; } }
    }
    place(b, bh, i);
  });
  if (pages.length > 1 && !pages[pages.length - 1].length) pages.pop();
  M.innerHTML = '';
  return pages;
}
/* Einen zu hohen Baustein an Zeilengrenzen teilen (Raster, Listen, Lineaturen). Liefert [[Block, Höhe], …] oder null.
   Die Teile tragen dieselbe data-id; nur der erste Teil hat Nummer und Aufgabentext. */
function splitTall(b, el, room, max, M) {
  const sec = el && el.querySelector(':scope > section.it'); if (!sec) return null;
  const ibI = [...sec.children].findIndex(k => k.classList.contains('ib')); if (ibI < 0) return null;
  const top0 = el.getBoundingClientRect().top; const units = [];
  const shown = k => getComputedStyle(k).display !== 'none';
  /* Teilbare Einheiten sammeln: Kinder untereinander; ein sehr hohes Kind mit untereinander liegenden Kindern wird weiter zerlegt */
  const walk = (e, path) => [...e.children].forEach((k, j) => {
    if (!shown(k)) return; const p = [...path, j];
    if (getComputedStyle(k).display === 'contents') { walk(k, p); return; }
    const q = k.getBoundingClientRect(); if (q.height < .5) return;
    const kk = [...k.children].filter(x => shown(x) && getComputedStyle(x).display !== 'contents');
    const stacked = kk.length >= 2 && k.namespaceURI !== 'http://www.w3.org/2000/svg' && kk[0].getBoundingClientRect().height < q.height * .9 && kk.every((x, i) => { if (!i) return true; const pq = kk[i - 1].getBoundingClientRect(); return x.getBoundingClientRect().top >= pq.top - pq.height * .5; });
    const single = kk.length === 1 && k.namespaceURI !== 'http://www.w3.org/2000/svg' && kk[0].namespaceURI !== 'http://www.w3.org/2000/svg';
    if (q.height > max * .6 && (stacked || single)) walk(k, p); else units.push({ p, tt: q.top - top0, b: q.bottom - top0 });
  });
  walk(sec.children[ibI], [ibI]);
  /* Einheiten zu Zeilen bündeln (nebeneinander liegende Rasterzellen bleiben zusammen) */
  const rows = [];
  units.forEach((u, j) => { const r = rows[rows.length - 1]; if (r && u.tt < r.b - 1) { r.e = j; r.b = Math.max(r.b, u.b); r.tt = Math.min(r.tt, u.tt); } else rows.push({ s: j, e: j, tt: u.tt, b: u.b }); });
  if (rows.length < 2) return null;
  const tail = el.getBoundingClientRect().height - rows[rows.length - 1].b + 2;
  const tpl = document.createElement('div'); tpl.innerHTML = b.html; const s0 = tpl.querySelector('section.it'); if (!s0) return null;
  let M2 = $('#measure2'); if (!M2) { M2 = document.createElement('div'); M2.id = 'measure2'; M.after(M2); }
  const build = groups => groups.map(([a, z], k) => {
    const sc = s0.cloneNode(true); const lo = rows[a].s, hi = rows[z].e;
    const at = p => p.reduce((e, i) => e && e.children[i], sc);
    const nodes = units.map(u => at(u.p)); if (nodes.some(x => !x)) return null;
    nodes.forEach((n, j) => { if (j >= lo && j <= hi) return; let par = n.parentElement; n.remove();
      /* leer gewordene Hüllen mit entfernen */
      while (par && par !== sc && !par.classList.contains('ib') && !par.children.length && !par.textContent.trim()) { const up = par.parentElement; par.remove(); par = up; } });
    if (k === 0) sc.classList.add('part0');
    else {
      [...sc.children].forEach(ch => { if (!ch.classList.contains('ib')) ch.remove(); });
      sc.classList.add('cont'); sc.dataset.part = k; sc.dataset.pdx = 0; sc.dataset.pdy = 0;
      sc.style.removeProperty('margin-top'); sc.style.removeProperty('left'); sc.style.removeProperty('position');
    }
    return { ...b, html: sc.outerHTML, part: k, dy: k ? 0 : b.dy };
  });
  const measure = out => {
    M2.innerHTML = `<div class="${M.firstElementChild ? M.firstElementChild.className : 'page'}" style="${M.dataset.pv || ''};height:auto;position:static"><div class="pc" style="position:static;width:${M.dataset.cw}mm">${out.map(RD.wrap).join('')}</div></div>`;
    const hs = $$('.blk', M2).map(e => e.getBoundingClientRect().height); M2.innerHTML = ''; return hs;
  };
  /* Zeilen gierig auf Seiten verteilen; passt ein Teil gemessen nicht, mit mehr Reserve neu verteilen */
  const firstCap = room >= rows[0].b + tail + 2 * MM ? room : max;
  let safety = 2 * MM;
  for (let tries = 0; tries < 6; tries++) {
    const groups = []; let start = 0, base = 0, cap = firstCap;
    for (let r = 0; r < rows.length; r++) {
      const used = rows[r].b - base + safety + (r === rows.length - 1 ? tail : 0);
      if (used > cap && r > start) { groups.push([start, r - 1]); start = r; base = rows[r].tt; cap = max; }
    }
    groups.push([start, rows.length - 1]);
    if (groups.length < 2) return null;
    const out = build(groups); if (out.some(x => !x)) return null;
    const hs = measure(out);
    const over = Math.max(...hs.map((v, k) => (groups[k][1] > groups[k][0]) ? v - (k ? max : firstCap) : 0));
    if (over <= 0 || tries === 5) return out.map((x, k) => [x, hs[k]]);
    safety += over + 1 * MM;
  }
  return null;
}
/* Fließtext über Seiten (wie in einer Textverarbeitung): ein langer Textblock wird an Zeilengrenzen geteilt.
   Jeder Teil zeigt ein Fenster des vollständigen Texts – dadurch bleibt jede Zeile genau so, wie sie gesetzt ist. */
function flowText(b, el, room, max) {
  const sec = el && el.querySelector(':scope > section.it'); if (!sec) return null;
  const tx = [...sec.querySelectorAll('.ib .tx')].filter(t => !t.closest('.tclip')).sort((a, c) => c.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]; if (!tx) return null;
  const T0 = tx.getBoundingClientRect(), E0 = el.getBoundingClientRect();
  /* Zeilen ermitteln */
  const lines = []; const w = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT); const rg = document.createRange();
  for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; rg.selectNodeContents(n); for (const q of rg.getClientRects()) { if (q.height < 2) continue; const t = q.top - T0.top, bt = q.bottom - T0.top; const L = lines.find(l => t < l.b - 1 && bt > l.t + 1); if (L) { L.t = Math.min(L.t, t); L.b = Math.max(L.b, bt); } else lines.push({ t, b: bt }); } }
  lines.sort((a, c) => a.t - c.t); if (lines.length < 4) return null;
  const pre = T0.top - E0.top, post = E0.bottom - T0.bottom + 2 * MM;
  /* Schnittstellen: zwischen zwei Zeilen; mindestens zwei Zeilen je Teil */
  const firstRoom = room - pre >= lines[1].b + post ? room : max;
  let safety = 0, result = null;
  for (let tries = 0; tries < 5 && !result; tries++) {
  const cuts = [0]; let cap = firstRoom - pre - safety, base = 0, k0 = 0;
  for (let i = 0; i < lines.length; i++) {
    const need = lines[i].b - base + post;
    if (need > cap && i - k0 >= 2 && lines.length - i >= 2) { const y = (lines[i - 1].b + lines[i].t) / 2; cuts.push(y); base = y; k0 = i; cap = max - post - safety; }
  }
  if (cuts.length < 2) return null;
  cuts.push(T0.height);
  const tpl = document.createElement('div'); tpl.innerHTML = b.html; const s0 = tpl.querySelector('section.it');
  const txs = [...s0.querySelectorAll('.ib .tx')]; const idx = [...sec.querySelectorAll('.ib .tx')].indexOf(tx); if (!s0 || !txs[idx]) return null;
  const px = v => (v / MM).toFixed(2) + 'mm';
  const out = cuts.slice(0, -1).map((a, k) => {
    const z = cuts[k + 1]; const sc = s0.cloneNode(true); const t = [...sc.querySelectorAll('.ib .tx')][idx];
    const first = k === 0, last = k === cuts.length - 2;
    if (!first) { t.removeAttribute('data-edit'); t.title = 'Fortsetzung von der vorigen Seite – zum Bearbeiten den Anfang des Texts doppelklicken.'; }
    const wrap = document.createElement('div'); wrap.className = 'tclip' + (first ? '' : ' tclipC') + (last ? '' : ' tclipO');
    wrap.style.cssText = `height:${px(z - a)};overflow:hidden`;
    const inner = document.createElement('div'); inner.style.marginTop = px(-a); t.replaceWith(wrap); wrap.appendChild(inner); inner.appendChild(t);
    if (!first) {
      /* alles vor dem Text weglassen (Kopf, frühere Absätze) */
      [...sc.children].forEach(ch => { if (!ch.classList.contains('ib')) ch.remove(); });
      let n = wrap; while (n && !n.classList.contains('ib')) { let p = n.previousElementSibling; while (p) { const q = p.previousElementSibling; p.remove(); p = q; } n = n.parentElement; }
      sc.classList.add('cont'); sc.dataset.part = k; sc.dataset.pdx = 0; sc.dataset.pdy = 0; sc.style.removeProperty('margin-top'); sc.style.removeProperty('left'); sc.style.removeProperty('position');
    } else sc.classList.add('part0');
    if (!last) { let n = wrap; while (n && !n.classList.contains('ib')) { let x = n.nextElementSibling; while (x) { const q = x.nextElementSibling; x.remove(); x = q; } n = n.parentElement; } }
    return { ...b, html: sc.outerHTML, part: (b.part || 0) * 100 + k, dy: first ? b.dy : 0 };
  });
  let M2 = $('#measure2'); if (!M2) { M2 = document.createElement('div'); M2.id = 'measure2'; document.body.appendChild(M2); }
  const M = $('#measure');
  M2.innerHTML = `<div class="${M.firstElementChild ? M.firstElementChild.className : 'page'}" style="${M.dataset.pv || ''};height:auto;position:static"><div class="pc" style="position:static;width:${M.dataset.cw}mm">${out.map(RD.wrap).join('')}</div></div>`;
  const hs = $$('.blk', M2).map(e => e.getBoundingClientRect().height); M2.innerHTML = '';
  const over = Math.max(...hs.map((v, k) => v - (k ? max : firstRoom)));
  if (over <= 0 || tries === 4) result = out.map((x, k) => [x, hs[k]]); else safety += over + 1 * MM;
  }
  return result;
}
/* Zeilennummern nach den gedruckten Zeilen: nach dem Messen jede 5. Zeile beschriften, über Seiten hinweg fortlaufend */
function lineGutters(bl, blks) {
  const run = new Map();
  bl.forEach((b, i) => {
    const el = blks[i]; if (!el || !b.html.includes('<span class="lng"></span>')) return;
    let html = b.html;
    el.querySelectorAll('.lnw').forEach(w => {
      const cs = getComputedStyle(w); let lh = parseFloat(cs.lineHeight); if (!(lh > 0)) lh = (parseFloat(cs.fontSize) || 16) * 1.35;
      const n = Math.max(1, Math.round(w.clientHeight / lh)); const S = run.get(b.id) || 0; let g = '';
      for (let k = S + 1; k <= S + n; k++) if (k % 5 === 0) g += `<i style="top:${((k - S - 1) * lh / MM).toFixed(2)}mm;height:${(lh / MM).toFixed(2)}mm">${k}</i>`;
      html = html.replace('<span class="lng"></span>', `<span class="lng" aria-hidden="true">${g}</span>`); run.set(b.id, S + n);
    });
    b.html = html;
  });
}
function pagesHTML(d, pages, sol) { return pages.map((p, i) => RD.page(p.map(RD.wrap).join(''), i + 1, pages.length, d, { sol })).join(''); }
async function outputHTML(d, which) {
  const parts = [];
  if (which !== 'loesung') parts.push(pagesHTML(d, await paginate(d), false));
  if (which !== 'blatt') parts.push(pagesHTML(d, await paginate(d), true));
  return parts.join('');
}

/* ---------- Grundgerüst ---------- */
function shell(topHtml, mainHtml) {
  $('#app').innerHTML = `<header class="top" id="top">${topHtml}</header><nav class="tabbar" id="tabbar" role="tablist" aria-label="Geöffnete Materialien"></nav><div id="banners"></div>
    <div class="banner bad" id="saveErr" hidden><b>Speichern fehlgeschlagen.</b> <span id="saveErrMsg"></span><span class="sp"></span><button class="tb" id="saveErrExport">Material exportieren</button><button class="tb" id="saveErrRetry">Erneut versuchen</button></div>${mainHtml}`;
  $('#saveErrRetry').onclick = () => flush(); $('#saveErrExport').onclick = () => cur && exportDocs([cur]);
  renderBanners(); setSaveState(SV.state); renderTabs();
}
function addBanner(kind, html, action) { banners.push({ kind, html, action, id: rid('b', 3) }); renderBanners(); }
function renderBanners() {
  const el = $('#banners'); if (!el) return;
  el.innerHTML = banners.map(b => `<div class="banner ${b.kind}" data-b="${b.id}"><span>${b.html}</span><span class="sp"></span>${b.action ? `<button class="tb" data-act>${esc(b.action.label)}</button>` : ''}<button class="tb ghost" data-close aria-label="Hinweis schließen">✕</button></div>`).join('');
  $$('[data-b]', el).forEach(n => { const b = banners.find(x => x.id === n.dataset.b); n.querySelector('[data-close]').onclick = () => { banners = banners.filter(x => x !== b); renderBanners(); }; const a = n.querySelector('[data-act]'); if (a) a.onclick = () => b.action.run(); });
}
const ICO = {
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  undo: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  redo: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>',
  bulb: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/></svg>',
  pdf: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  print: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7Z"/></svg>',
  sheet: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
  probe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8.5 9 1.5 1.5L13 7.5M15 9h1M8.5 15l1.5 1.5 3-3M15 15h1"/></svg>',
  focus: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  side: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>',
  sideR: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>',
  search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  chev: '<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  up: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/></svg>',
  dots: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  home: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z"/></svg>',
  dice: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
};

/* =====================================================================
   Startseite und „Meine Materialien“
   ===================================================================== */
async function showLibrary() {
  if (cur) { await flush(); saveTabState(); }
  view = 'library'; cur = null; sel = null; ACTIVE = 'home'; UNDO = newUndo();
  shell(`<span class="appname">Foliva<small>Beta · Arbeitsblätter und Proben</small></span><span class="sp"></span>
    <span class="status" id="saveState"></span>
    <button class="tb" id="impBtn"><span class="lbl">Material oder Sicherung öffnen</span><span class="lbl2" hidden>Öffnen</span></button>
    <button class="tb" id="bakBtn">Sicherungen</button><button class="tb" id="setBtn">Einstellungen</button><button class="tb" id="helpBtn" aria-label="Hilfe">Hilfe</button>`,
    `<main class="lib" id="lib"><div class="libIn" id="libIn"></div></main>`);
  $('#impBtn').onclick = importFlow; $('#bakBtn').onclick = backupsDialog; $('#setBtn').onclick = settingsDialog; $('#helpBtn').onclick = () => helpDialog();
  renderLibrary();
}
function filtered() {
  const q = UI.q.trim().toLowerCase();
  return [...docs.values()].filter(d => {
    if (UI.libTab === 'papierkorb') return !!d.deleted;
    if (d.deleted) return false;
    if (UI.libTab === 'vorlagen') return !!d.tpl;
    if (d.tpl) return false;
    if (UI.libTab === 'favoriten' && !d.fav) return false;
    if (UI.subject && (UI.subject === '_none' ? d.subject : d.subject !== UI.subject)) return false;
    if (UI.grade && !(d.grades || []).map(String).includes(UI.grade)) return false;
    if (UI.kind && d.kind !== UI.kind) return false;
    if (q && !q.split(/\s+/).every(w => searchText(d).includes(w))) return false;
    return true;
  }).sort((a, b) => String(b.modified).localeCompare(String(a.modified)));
}
function renderLibrary() {
  const el = $('#libIn'); if (!el) return;
  const all = [...docs.values()].filter(d => !d.deleted);
  const subjects = [...new Set(all.map(d => d.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
  const list = filtered(); const trash = [...docs.values()].filter(d => d.deleted).length;
  el.innerHTML = `
    <div class="hero">
      <button class="newCard" id="nAB"><span class="ic">${ICO.sheet.replace(/16/g, '24')}</span><span><b>Neues Arbeitsblatt</b><span>Leeres A4-Blatt, sofort losgestalten</span></span></button>
      <button class="newCard" id="nPR"><span class="ic">${ICO.probe.replace(/16/g, '24')}</span><span><b>Neue ${esc(presetFor(stageDefault()).assess)}</b><span>Mit Punkten, Kopf und Lösungsblatt</span></span></button>
      <button class="newCard alt" id="nVL"><span class="ic">${C.ICON.packet.replace(/20/g, '24')}</span><span><b>Vorlagen</b><span>Nach Schulart, Fach und Jahrgangsstufe – sofort mit neuen Aufgaben</span></span></button>
    </div>
    ${stageSwitchHTML()}
    <div class="libHead"><h2>Meine Materialien</h2>
      <div class="segA" role="tablist">${[['alle', 'Alle'], ['favoriten', 'Favoriten'], ['vorlagen', 'Meine Vorlagen'], ['papierkorb', `Papierkorb${trash ? ' (' + trash + ')' : ''}`]].map(([k, l]) => `<button data-tab="${k}" aria-pressed="${UI.libTab === k}">${l}</button>`).join('')}</div></div>
    ${UI.libTab !== 'papierkorb' ? `<div class="filters"><div class="search">${ICO.search}<input type="search" id="q" placeholder="Suchen: Titel, Thema, Text …" value="${esc(UI.q)}" aria-label="Materialien durchsuchen"></div>
      <select id="fS" aria-label="Fach"><option value="">Alle Fächer</option>${subjects.map(s => `<option ${UI.subject === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}<option value="_none" ${UI.subject === '_none' ? 'selected' : ''}>Nicht zugeordnet</option></select>
      <select id="fG" aria-label="Jahrgangsstufe"><option value="">Alle Jahrgangsstufen</option>${Array.from({ length: 13 }, (_, i) => `<option value="${i + 1}" ${UI.grade === String(i + 1) ? 'selected' : ''}>Jahrgangsstufe ${i + 1}</option>`).join('')}</select>
      <select id="fK" aria-label="Art"><option value="">Alle Arten</option><option value="arbeitsblatt" ${UI.kind === 'arbeitsblatt' ? 'selected' : ''}>Nur Arbeitsblätter</option><option value="probe" ${UI.kind === 'probe' ? 'selected' : ''}>Nur Leistungsnachweise</option></select>
      ${UI.q || UI.subject || UI.grade || UI.kind ? '<button class="tb ghost" id="fX">Filter zurücksetzen</button>' : ''}</div>` : ''}
    <div id="libList"></div>`;
  $('#nAB').onclick = () => createAndOpen('arbeitsblatt'); $('#nPR').onclick = () => createAndOpen('probe'); $('#nVL').onclick = () => Vorlagen.open();
  $$('[data-stage]', el).forEach(b => b.onclick = () => { UI.stage = b.dataset.stage; saveUI(); renderLibrary(); });
  $$('[data-tab]', el).forEach(b => b.onclick = () => { UI.libTab = b.dataset.tab; saveUI(); renderLibrary(); });
  const q = $('#q'); if (q) { q.oninput = () => { UI.q = q.value; saveUI(); renderLibList(); }; }
  const bind = (id, k) => { const s = $(id); if (s) s.onchange = () => { UI[k] = s.value; saveUI(); renderLibrary(); }; };
  bind('#fS', 'subject'); bind('#fG', 'grade'); bind('#fK', 'kind');
  const fx = $('#fX'); if (fx) fx.onclick = () => { UI.q = UI.subject = UI.grade = UI.kind = ''; saveUI(); renderLibrary(); };
  renderLibList(list);
}
const thumbCache = new Map();
function renderLibList(list = filtered()) {
  const el = $('#libList'); if (!el) return;
  if (UI.libTab === 'papierkorb') {
    el.innerHTML = list.length ? `<p class="hint" style="margin:0 0 12px">Gelöschte Materialien bleiben hier, bis du sie endgültig löschst. Nichts wird automatisch entfernt.</p><div class="box2">${list.map(d => `<div class="trashRow" data-id="${d.id}"><b>${esc(d.title || 'Unbenanntes Material')}</b><small>gelöscht ${fmtDate(d.deleted)}</small><button class="tb" data-restore>Wiederherstellen</button><button class="tb" data-purge style="color:var(--bad)">Endgültig löschen</button></div>`).join('')}</div>` : `<div class="libEmpty"><b>Der Papierkorb ist leer.</b></div>`;
    $$('.trashRow', el).forEach(r => { const d = docs.get(r.dataset.id); r.querySelector('[data-restore]').onclick = () => { d.deleted = null; markDirty(d); flush(); renderLibrary(); toast('Wiederhergestellt.'); }; r.querySelector('[data-purge]').onclick = () => purgeDoc(d); });
    return;
  }
  if (!list.length) {
    const none = ![...docs.values()].some(d => !d.deleted);
    el.innerHTML = `<div class="libEmpty">${none ? '<b>Noch keine Materialien.</b>Lege oben ein neues Arbeitsblatt oder eine Probe an – oder schau dir zuerst die Beispiele an.' : '<b>Nichts gefunden.</b>Andere Suchbegriffe oder Filter versuchen.'}</div>`; return;
  }
  el.innerHTML = `<div class="grid">${list.map(d => `<div class="card2" data-id="${d.id}" tabindex="0" role="button" aria-label="${esc(d.title)} öffnen">
      <div class="thumb"><div class="tz" data-thumb="${d.id}"></div></div>
      <span class="kindTag ${d.kind}">${esc(RD.assessLabel(d))}</span>
      <button class="more" data-more aria-label="Weitere Aktionen">${ICO.dots}</button><button class="star ${d.fav ? 'on' : ''}" data-star aria-label="Favorit">${ICO.star}</button>
      <div class="cardBody"><span class="m">${esc([d.subject, d.grades && d.grades.length ? 'Jg. ' + d.grades.join('/') : '', d.topic].filter(Boolean).join(' · ') || 'Nicht zugeordnet')}</span><b>${esc(d.title || 'Unbenanntes Material')}</b><span class="d">Bearbeitet ${fmtDate(d.modified)}</span></div></div>`).join('')}</div>`;
  $$('.card2', el).forEach(c => {
    const d = docs.get(c.dataset.id);
    c.onclick = e => { if (e.target.closest('[data-star],[data-more]')) return; openDoc(d); };
    c.onkeydown = e => { if (e.key === 'Enter') openDoc(d); };
    c.querySelector('[data-star]').onclick = () => { d.fav = !d.fav; markDirty(d); renderLibList(); };
    c.querySelector('[data-more]').onclick = e => cardMenu(d, e.currentTarget);
  });
  fillThumbs(list);
}
async function fillThumbs(list) {
  for (const d of list) {
    const box = document.querySelector(`[data-thumb="${d.id}"]`); if (!box) continue;
    const key = d.id + ':' + d.rev + ':' + d.modified;
    let html = thumbCache.get(key);
    if (!html) { try { const pages = await paginate(d); html = pagesHTML(d, pages.slice(0, 1), false); thumbCache.set(key, html); } catch (e) { html = ''; } }
    const b2 = document.querySelector(`[data-thumb="${d.id}"]`); if (b2) b2.innerHTML = html;
  }
}
function popMenu(anchor, items) {
  closeMenu();
  const m = document.createElement('div'); m.className = 'menuPop'; m.id = 'menuPop';
  m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<button data-i="${i}" class="${it.danger ? 'danger2' : ''}">${esc(it.label)}</button>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(); m.style.left = Math.min(window.innerWidth - m.offsetWidth - 10, r.left) + 'px'; m.style.top = Math.min(window.innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
  $$('button', m).forEach(b => b.onclick = () => { closeMenu(); items[+b.dataset.i].run(); });
  setTimeout(() => document.addEventListener('mousedown', closeMenuOut), 0);
}
function closeMenuOut(e) { if (!e.target.closest('#menuPop')) closeMenu(); }
function closeMenu() { const m = $('#menuPop'); if (m) m.remove(); document.removeEventListener('mousedown', closeMenuOut); }
function cardMenu(d, anchor) {
  popMenu(anchor, [
    ...(d.tpl ? [{ label: 'Als neues Material verwenden', run: async () => { const c = useTemplate(d); docs.set(c.id, c); markDirty(c); await flush(); openDoc(c); } }, { label: 'Vorlage bearbeiten', run: () => openDoc(d) }] : [{ label: 'Öffnen', run: () => openDoc(d) }]),
    { label: 'Duplizieren (z. B. für eine neue Klasse)', run: () => duplicateDoc(d) },
    { label: 'Parallelversion mit neuen Zahlen', run: () => parallelDoc(d) },
    { label: d.fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten', run: () => { d.fav = !d.fav; markDirty(d); renderLibList(); } },
    { label: 'Exportieren …', run: () => exportDocs([d]) }, '-',
    { label: 'In den Papierkorb', danger: true, run: () => trashDoc(d) },
  ]);
}
async function createAndOpen(kind, stage) { const d = newDocWithLayout(kind, stage); docs.set(d.id, d); markDirty(d); await flush(); openDoc(d); }
/* Bei Grund- UND weiterführender Schule im Profil: welche Voreinstellung gilt für neue Materialien */
function stageSwitchHTML() {
  const p = profile(); const sek = p.schools.some(s => ['ms', 'rs', 'gy'].includes(s)); if (!(p.primary && sek)) return '';
  const st = stageDefault();
  return `<div class="stageSw"><span class="hint">Neue Materialien mit der Voreinstellung für</span><div class="segA">${[['primar', 'Grundschule (Jg. 1–4)'], ['sek', 'ab Jahrgangsstufe 5']].map(([k, l]) => `<button data-stage="${k}" aria-pressed="${st === k}">${l}</button>`).join('')}</div></div>`;
}
function cloneDoc(d, title) { const c = JSON.parse(JSON.stringify(d)); Object.assign(c, { id: newDocId(), rev: 0, title, created: now(), modified: now(), fav: false, deleted: null }); c.items.forEach(it => { it.id = rid('i', 6); }); return c; }
async function duplicateDoc(d) { const c = cloneDoc(d, d.title + ' (Kopie)'); docs.set(c.id, c); markDirty(c); await flush(); toast('Kopie angelegt – das Original bleibt unverändert.'); if (view === 'library') renderLibrary(); else openDoc(c); }
async function parallelDoc(d) {
  const c = cloneDoc(d, d.title.replace(/\s*\((A|B|C|D)\)\s*$/, '') + ' (B)');
  c.items.forEach(it => { if (T(it.type) && T(it.type).gen && T(it.type).props.some(p => p.regen) && !['choice', 'gaps', 'match', 'vocab'].includes(T(it.type).gen)) { it.seed = G.newSeed(); regen(it); } });
  c.variantOf = d.id; docs.set(c.id, c); markDirty(c); await flush();
  toast('Parallelversion angelegt: gleiches Blatt, neue Zahlen, eigene Lösungen.', 3600); openDoc(c);
}
async function trashDoc(d) { d.deleted = now(); markDirty(d); await flush(); toast('In den Papierkorb gelegt.'); if (TABS.includes(d.id)) { TABS = TABS.filter(x => x !== d.id); persistTabs(); } if (view === 'editor' && cur === d) { cur = null; showLibrary(); } else renderLibrary(); }
async function purgeDoc(d) {
  const ok = await ask({ title: 'Endgültig löschen?', html: `<p>„<b>${esc(d.title)}</b>“ wird mit allen Versionen von diesem Computer gelöscht. Das lässt sich nicht rückgängig machen.</p><p class="hint">Ältere Sicherungen können das Material noch enthalten.</p>`, ok: 'Endgültig löschen', danger: true });
  if (!ok) return; await N.purge(d.id); docs.delete(d.id); renderLibrary(); toast('Endgültig gelöscht.');
}

/* =====================================================================
   Editor
   ===================================================================== */
/* ---------- Tabs: mehrere Materialien gleichzeitig ---------- */
let TABS = [], ACTIVE = 'home'; const TABSTATE = new Map();
function tabState(id) { if (!TABSTATE.has(id)) TABSTATE.set(id, { undo: newUndo(), sel: null, scroll: 0 }); return TABSTATE.get(id); }
function saveTabState() { if (!cur) return; const t = tabState(cur.id); t.sel = sel; t.undo = UNDO; const dk = $('#desk'); if (dk) t.scroll = dk.scrollTop; }
function persistTabs() { UI.tabs = TABS.slice(); UI.active = ACTIVE; saveUI(); }
async function openDoc(d) {
  if (cur && cur !== d) { await flush(); saveTabState(); }
  migrate(d); if (!TABS.includes(d.id)) TABS.push(d.id);
  const t = tabState(d.id); cur = d; sel = t.sel; UNDO = t.undo; view = 'editor'; ACTIVE = d.id; zone = null; msel.clear(); editing = null; persistTabs();
  renderEditor();
  if (t.scroll) setTimeout(() => { const dk = $('#desk'); if (dk) dk.scrollTop = t.scroll; }, 120);
}
async function closeTab(id) {
  const i = TABS.indexOf(id); if (i < 0) return;
  await flush();
  TABS.splice(i, 1); TABSTATE.delete(id);
  if (ACTIVE === id) { cur = null; const next = TABS[i] || TABS[i - 1]; if (next && docs.get(next)) openDoc(docs.get(next)); else showLibrary(); }
  else renderTabs();
  persistTabs();
}
function cycleTab(dir) { const all = ['home', ...TABS]; let i = all.indexOf(ACTIVE); i = (i + dir + all.length) % all.length; const id = all[i]; if (id === 'home') showLibrary(); else openDoc(docs.get(id)); }
function renderTabs() {
  const el = $('#tabbar'); if (!el) return;
  el.innerHTML = `<button class="tab home ${ACTIVE === 'home' ? 'on' : ''}" data-tab="home" title="Meine Materialien">${ICO.home}<span>Meine Materialien</span></button>` +
    TABS.map(id => { const d = docs.get(id); if (!d) return ''; return `<div class="tab ${ACTIVE === id ? 'on' : ''}" data-tab="${id}" title="${esc(d.title)}" role="tab" tabindex="0"><span class="tk ${d.kind}"></span><span class="tt">${esc(d.title || 'Unbenanntes Material')}</span><button class="tx" data-close="${id}" aria-label="Tab schließen" title="Tab schließen (${MOD}+W)">✕</button></div>`; }).join('') +
    `<button class="tab plus" id="tabPlus" title="Neues Material (${MOD}+N)" aria-label="Neues Material">+</button>`;
  $$('[data-tab]', el).forEach(t => t.onclick = e => { if (e.target.closest('[data-close]')) return; const id = t.dataset.tab; if (id === ACTIVE) return; if (id === 'home') showLibrary(); else openDoc(docs.get(id)); });
  $$('[data-tab]', el).forEach(t => t.onauxclick = e => { if (e.button === 1 && t.dataset.tab !== 'home') closeTab(t.dataset.tab); });
  $$('[data-close]', el).forEach(b => b.onclick = () => closeTab(b.dataset.close));
  $('#tabPlus', el).onclick = () => newMaterialDialog();
  const on = el.querySelector('.tab.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
async function newMaterialDialog() { const k = await dialog({ title: 'Neues Material', html: '<p>Was möchtest du anlegen? Es öffnet sich in einem neuen Tab.</p>', buttons: [{ label: 'Arbeitsblatt', value: 'arbeitsblatt', primary: true }, { label: presetFor(stageDefault()).assess, value: 'probe' }, { label: 'Aus Vorlage …', value: 'vl' }, { label: 'Beispiel …', value: 'ex' }] }); if (k === 'ex') examplesDialog(); else if (k === 'vl') Vorlagen.open(); else if (k) createAndOpen(k); }
function renderEditor() {
  shell(`<div id="topIn" style="display:contents"></div>`, `<div class="fmtTop" id="fmtTop" role="toolbar" aria-label="Format"></div><div class="ed ${UI.left ? '' : 'noL'} ${UI.right ? '' : 'noR'}" id="ed">
    <aside class="side left" id="left" aria-label="Einfügen"></aside>
    <section class="desk" id="desk"><div class="pages" id="pages"></div><div class="zoomer" id="zoomer"></div></section>
    <aside class="side right" id="right" aria-label="Einstellungen"></aside></div>`);
  renderTop(); renderLeft(); renderRight(); renderPages(); bindDesk();
}
function renderTop() {
  const d = cur; const el = $('#top'); if (!el) return;
  el.innerHTML = `<button class="tb ghost" id="backBtn" title="Zu „Meine Materialien“">${ICO.back}<span class="lbl">Meine Materialien</span></button>
    <input class="titleIn" id="titleIn" value="${esc(d.title)}" aria-label="Titel des Materials" spellcheck="true">
    <div class="segA" aria-label="Art"><button data-kind="arbeitsblatt" aria-pressed="${d.kind !== 'probe'}">${ICO.sheet}<span class="lbl">Arbeitsblatt</span></button><button data-kind="probe" aria-pressed="${d.kind === 'probe'}" title="Leistungsnachweis mit Punkten und Lösungsblatt">${ICO.probe}<span class="lbl">${esc(d.kind === 'probe' ? RD.assessLabel(d) : presetFor(d.stage || stageDefault()).assess)}</span></button></div>
    ${d.kind === 'probe' ? `<button class="tb" id="probeBtn">${esc(RD.assessLabel(d))} zusammenstellen</button>` : ''}
    <button class="tb icon" id="undoBtn" title="Rückgängig (${MOD}+Z)" aria-label="Rückgängig">${ICO.undo}</button><button class="tb icon" id="redoBtn" title="Wiederholen (${MOD === '⌘' ? '⇧⌘Z' : 'Strg+Y'})" aria-label="Wiederholen">${ICO.redo}</button>
    <button class="tb ${UI.sol ? 'on' : ''}" id="solBtn" aria-pressed="${UI.sol}" title="Lösungen anzeigen (${MOD}+L)">${ICO.bulb}<span class="lbl">Lösungen</span></button>
    <button class="tb icon" id="regenAll" title="Ganzes Blatt: neue Aufgaben erzeugen" aria-label="Ganzes Blatt neu erzeugen">${ICO.dice}</button>
    <button class="tb icon" id="focusBtn" title="Mehr Platz fürs Blatt (${MOD}+.)" aria-label="Mehr Platz fürs Blatt">${ICO.focus}</button>
    <span class="sp"></span><span class="status" id="saveState"></span>
    <button class="tb" id="printBtn" title="Drucken (${MOD}+P)">${ICO.print}<span class="lbl">Drucken</span></button>
    <button class="tb primary" id="pdfBtn" title="Als PDF speichern (${MOD}+E)">${ICO.pdf}PDF</button>
    <button class="tb" id="helpBtn">Hilfe</button>`;
  $('#backBtn').onclick = showLibrary;
  const rg = $('#regenAll'); if (rg) rg.onclick = regenAllDialog;
  const ti = $('#titleIn'); ti.oninput = () => { change(() => { cur.title = ti.value; }, 'title'); const tt = $(`.tab[data-tab="${cur.id}"] .tt`); if (tt) tt.textContent = ti.value || 'Unbenanntes Material'; };
  ti.onkeydown = e => { if (e.key === 'Enter') ti.blur(); };
  $$('[data-kind]', el).forEach(b => b.onclick = () => { if (cur.kind === b.dataset.kind) return; change(() => { cur.kind = b.dataset.kind; if (cur.kind === 'probe' && !cur.assess) cur.assess = presetFor(cur.stage || stageDefault()).assess; }, null, { panel: true, top: true }); });
  const pb = $('#probeBtn'); if (pb) pb.onclick = probeDialog;
  $('#undoBtn').onclick = () => undoRedo(-1); $('#redoBtn').onclick = () => undoRedo(1);
  $('#solBtn').onclick = toggleSol; $('#focusBtn').onclick = toggleFocus;
  $('#pdfBtn').onclick = () => outputDialog('pdf'); $('#printBtn').onclick = () => outputDialog('print'); $('#helpBtn').onclick = () => helpDialog();
  updateUndoBtns(); setSaveState(SV.state);
}
function toggleSol() { UI.sol = !UI.sol; saveUI(); const b = $('#solBtn'); if (b) { b.classList.toggle('on', UI.sol); b.setAttribute('aria-pressed', UI.sol); } $$('#pages .page').forEach(p => p.classList.toggle('showsol', UI.sol)); }
function toggleFocus() { const both = UI.left || UI.right; UI.left = UI.right = !both; saveUI(); applySides(); }
function applySides() { const ed = $('#ed'); if (!ed) return; ed.classList.toggle('noL', !UI.left); ed.classList.toggle('noR', !UI.right); renderReopen(); if (UI.zoom === 'fit') applyZoom(); }
function renderReopen() {
  $$('.reopen').forEach(b => b.remove()); const desk = $('#ed'); if (!desk) return;
  if (!UI.left) { const b = document.createElement('button'); b.className = 'reopen l'; b.innerHTML = `${ICO.side} Einfügen`; b.onclick = () => { UI.left = true; saveUI(); applySides(); }; desk.appendChild(b); }
  if (!UI.right) { const b = document.createElement('button'); b.className = 'reopen r'; b.innerHTML = `Einstellungen ${ICO.sideR}`; b.onclick = () => { UI.right = true; saveUI(); applySides(); }; desk.appendChild(b); }
}

/* ---------- links: Einfügen ---------- */
function renderLeft() {
  const el = $('#left'); if (!el) return;
  el.innerHTML = `<div class="sideHead"><h2><span>Einfügen</span></h2><button class="collapse" id="hideL" title="Einfügen ausblenden" aria-label="Einfügen ausblenden">${ICO.side}</button></div>
    <div class="search">${ICO.search}<input type="search" id="insQ" placeholder="Aufgaben suchen …" aria-label="Aufgaben suchen"></div><div id="insList"></div>`;
  $('#hideL').onclick = () => { UI.left = false; saveUI(); applySides(); };
  const q = $('#insQ'); q.oninput = () => renderInsList(q.value); renderInsList('');
}
function renderInsList(q) {
  const el = $('#insList'); if (!el) return; q = (q || '').trim().toLowerCase(); const keep = el.scrollTop;
  const favs = new Set(UI.favs || []);
  const row = k => `<button class="ins" data-type="${k}">${C.ICON[k] || ''}<span>${esc(T(k).name)}</span><i class="fav${favs.has(k) ? ' on' : ''}" data-fav="${k}" role="button" tabindex="-1" title="${favs.has(k) ? 'Aus „Meine Bausteine“ entfernen' : 'Zu „Meine Bausteine“ hinzufügen'}" aria-label="${favs.has(k) ? 'Aus Meine Bausteine entfernen' : 'Zu Meine Bausteine hinzufügen'}">${favs.has(k) ? '★' : '☆'}</i></button>`;
  const pals = (C.PALETTES || []).map(p => ({ ...p, items: typeof p.items === 'function' ? p.items() : p.items }));
  const tile = (p, i) => { const x = p.items[i]; return `<button class="pt" data-pal="${p.id}" data-i="${i}" title="${esc(x.title || x.label)}">${x.icon}<span>${esc(x.label)}</span></button>`; };
  const isClosed = (id, def) => UI.closed[id] != null ? UI.closed[id] : def;
  const palGrp = p => { const closed = isClosed(p.id, true); return `<div class="grp pal ${closed ? 'closed' : ''}" data-g="${p.id}"><button class="grpHead" aria-expanded="${!closed}">${ICO.chev}<span>${esc(p.name)}</span></button><div class="grpBody palBody">${p.items.map((x, i) => tile(p, i)).join('')}</div></div>`; };
  if (q) {
    const hits = Object.keys(C.TYPES).filter(k => (T(k).name + ' ' + T(k).words).toLowerCase().includes(q));
    const ph = pals.flatMap(p => p.items.map((x, i) => (x.label + ' ' + (x.title || '') + ' ' + p.name).toLowerCase().includes(q) ? tile(p, i) : '').filter(Boolean));
    el.innerHTML = hits.length || ph.length ? `${ph.length ? `<div class="grpBody palBody" style="padding-top:2px">${ph.join('')}</div>` : ''}<div class="grpBody" style="padding-top:2px">${hits.map(row).join('')}</div>` : `<p class="noHit">Nichts gefunden. Andere Wörter versuchen, z. B. „plus“, „Lücke“, „Uhr“.</p>`;
  } else {
    const st = cur && cur.stage ? cur.stage : stageDefault(); const prim = st === 'primar';
    const order = C.groupOrder(prim);
    try { N.setInsertMenu && N.setInsertMenu(order.map(g => ({ label: g.name, items: C.groupKeys(g).map(k => ({ type: k, name: T(k).name })) }))); } catch (e) { }
    /* Meine Bausteine: mit Stern gemerkte, dann zuletzt eingefügte */
    const mine = [...favs].filter(k => C.TYPES[k]).concat((UI.recent || []).filter(k => C.TYPES[k] && !favs.has(k))).slice(0, 10);
    const mineH = mine.length ? (() => { const closed = isClosed('g_mine', false); return `<div class="grp mine ${closed ? 'closed' : ''}" data-g="g_mine"><button class="grpHead" aria-expanded="${!closed}">${ICO.chev}<span>Meine Bausteine</span><small>${mine.length}</small></button><div class="grpBody">${mine.map(row).join('')}<p class="mineHint">★ = immer hier · sonst die zuletzt eingefügten</p></div></div>`; })() : '';
    el.innerHTML = mineH + order.map(g => {
      const main = C.groupMain ? C.groupMain(g) : C.groupKeys(g); const more = C.groupMore ? C.groupMore(g) : null;
      const n = main.length + (more ? more.keys.length : 0);
      const closed = isClosed(g.id, g.keys ? !g.open : !(g.id === 'basis' || (prim ? g.id === 'm_kopf' : g.id === 'sprachen')));
      const sub = more && more.keys.length ? (() => { const c2 = isClosed(more.id, true); return `<div class="sub ${c2 ? 'closed' : ''}" data-g="${more.id}"><button class="subHead" aria-expanded="${!c2}">${ICO.chev}<span>${esc(more.name)}</span><small>${more.keys.length}</small></button><div class="subBody">${more.keys.map(row).join('')}</div></div>`; })() : '';
      const extra = pals.filter(p => (prim && p.afterPrim ? p.afterPrim : p.after) === g.id).map(palGrp).join('');
      const bibRow = g.id === 'g_deutsch' || g.id === 'deutsch' ? `<button class="ins insAct" type="button" data-bibopen="new" title="Kleine Geschichten, Märchen, Fabeln, Sachtexte und Gedichte">${BIB_ICO}<span>Text aus der Bibliothek …</span></button>` : '';
      return `<div class="grp ${closed ? 'closed' : ''}" data-g="${g.id}"><button class="grpHead" aria-expanded="${!closed}">${ICO.chev}<span>${esc(g.name)}</span><small>${n}</small></button><div class="grpBody">${bibRow}${main.map(row).join('')}${sub}</div></div>${extra}`;
    }).join('');
    $$('.grp', el).forEach(gr => gr.querySelector('.grpHead').onclick = () => { const c = !gr.classList.contains('closed'); gr.classList.toggle('closed', c); gr.querySelector('.grpHead').setAttribute('aria-expanded', !c); UI.closed[gr.dataset.g] = c; saveUI(); });
    $$('.sub', el).forEach(gr => gr.querySelector('.subHead').onclick = () => { const c = !gr.classList.contains('closed'); gr.classList.toggle('closed', c); gr.querySelector('.subHead').setAttribute('aria-expanded', !c); UI.closed[gr.dataset.g] = c; saveUI(); });
    el.scrollTop = keep;
  }
  $$('.pt', el).forEach(b => { b.onclick = () => insertPreset(b.dataset.pal, +b.dataset.i); b.draggable = true; b.title = (b.title ? b.title + ' – ' : '') + 'Klicken: einfügen · Ziehen: an eine Stelle auf dem Blatt'; b.ondragstart = e => { e.dataTransfer.setData('application/x-foliva-preset', b.dataset.pal + ':' + b.dataset.i); e.dataTransfer.effectAllowed = 'copy'; }; });
  $$('.ins[data-type]', el).forEach(b => { b.onclick = e => { if (e.target.closest('[data-fav]')) return; insertItem(b.dataset.type); }; b.draggable = true; b.title = 'Klicken: unter dem ausgewählten Baustein einfügen · Ziehen: an eine Stelle auf dem Blatt'; b.ondragstart = e => { e.dataTransfer.setData('application/x-foliva-type', b.dataset.type); e.dataTransfer.effectAllowed = 'copy'; }; });
  $$('[data-fav]', el).forEach(s => s.onclick = e => { e.preventDefault(); e.stopPropagation(); toggleFav(s.dataset.fav); });
}
const BIB_ICO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5.5 4 8.5 4 12 5.5 15.5 4 18.5 4 21 5.5V19c-2.5-1.5-5.5-1.5-9 0-3.5-1.5-6.5-1.5-9 0Z"/><path d="M12 5.5V19"/></svg>';
function toggleFav(k) { const f = new Set(UI.favs || []); if (f.has(k)) f.delete(k); else f.add(k); UI.favs = [...f]; saveUI(); renderInsList($('#insQ') ? $('#insQ').value : ''); }
/* zuletzt eingefügt: wird gemerkt und beim nächsten Öffnen oben gezeigt – die Leiste springt beim Arbeiten nicht */
function noteRecent(type) { if (!C.TYPES[type]) return; UI.recent = [type, ...(UI.recent || []).filter(k => k !== type)].slice(0, 6); saveUI(); }
/* Form oder Lineatur aus der Bildpalette: Form schwebt frei mittig auf dem Blatt, Lineatur reiht sich ein */
function insertPreset(pid, i, at) {
  const p = (C.PALETTES || []).find(x => x.id === pid); if (!p) return; const items = typeof p.items === 'function' ? p.items() : p.items; const x = items[i]; if (!x) return;
  const it = insertItem(x.type, at);
  change(() => { Object.assign(it, JSON.parse(JSON.stringify(x.props)));
    if (x.type === 'shape') { const cw = RD.dims(cur).cw; it.free = true; it.dx = Math.max(0, Math.round((cw - (+it.w || 40)) / 2)); it.dy = 0; it.text = ''; }
    if (x.type === 'lineatur') { it.title = ''; it.numbered = false; it.points = 0; delete it.pointsAuto; }
    regen(it); }, null, { panel: true });
  return it;
}
function insertItem(type, at) {
  let it;
  zone = null; $$('#pages [data-zone]').forEach(z => z.classList.remove('zsel'));
  change(() => { it = makeItem(type); if (cur.kind === 'probe' && RD.TASK.has(type)) { const p = suggestPoints(it, cur); if (p != null) { it.points = p; it.pointsAuto = true; } } const i = at != null ? at : sel ? cur.items.findIndex(x => x.id === sel) + 1 : cur.items.length; cur.items.splice(i < 0 ? cur.items.length : i, 0, it); sel = it.id; });
  renderRight(); scrollToSel = true; noteRecent(type); return it;
}

/* ---------- Mitte: Blatt ---------- */
let renderSeq = 0, scrollToSel = false, clickBlock = 0;
function renderPages() {
  const my = ++renderSeq;
  requestAnimationFrame(async () => {
    if (my !== renderSeq || !cur) return;
    const d = cur; const pages = await paginate(d, { editor: true });
    if (my !== renderSeq || d !== cur) return;
    const el = $('#pages'); if (!el) return;
    const deskEl = $('#desk'); const st = deskEl.scrollTop;
    LAST_PAGES = pages;
    el.innerHTML = pages.map((p, i) => `<div class="pwrap"><span class="plabel">Seite ${i + 1}${pages.length > 1 ? ' von ' + pages.length : ''}<button class="pdup" type="button" data-dup="${i}" title="Diese Seite mit allen Bausteinen dahinter noch einmal einfügen">Seite duplizieren</button></span>${RD.page(p.map(RD.wrap).join(''), i + 1, pages.length, d, { sol: UI.sol })}</div>`).join('');
    pages.flat().filter(b => b.tall || b.zoom || b.zoomW).forEach(b => { const s = el.querySelector(`.it[data-id="${b.id}"]${b.part ? `[data-part="${b.part}"]` : ''}`); if (!s) return;
      if (b.tall) { s.classList.add('tall'); s.title = 'Dieser Baustein ist viel höher als eine Seite und wird abgeschnitten. Bitte weniger Aufgaben oder Zeilen wählen.'; }
      else if (b.zoom) { s.classList.add('zoomed'); s.title = `Dieser Baustein passt nicht ganz auf die Seite und wird auf ${Math.round(b.zoom * 100)} % verkleinert gedruckt. Mit weniger Aufgaben oder Zeilen erscheint er wieder in voller Größe.`; }
      else { s.classList.add('zoomed'); s.title = `Dieser Baustein ist breiter als die Seite und wird auf ${Math.round(b.zoomW * 100)} % verkleinert. Mit weniger Spalten erscheint er wieder in voller Größe.`; } });
    if (!d.items.length) el.querySelector('.pc').insertAdjacentHTML('beforeend', `<div class="emptyDoc">Links unter „Einfügen“ einen Baustein anklicken oder aufs Blatt ziehen – zum Beispiel ein Rechenpäckchen oder einen Text.<br>Titel und Texte ändern: doppelklicken. Kopf oder Fußzeile anklicken für Layout-Einstellungen.</div>`);
    markSel(); if (zone) $$('[data-zone]', el).forEach(z => z.classList.toggle('zsel', z.dataset.zone === zone));
    deskEl.scrollTop = st;
    if (REPAIRED.has(d.id)) { const n = REPAIRED.get(d.id); REPAIRED.delete(d.id); markDirty(d); toast(`${n === 1 ? 'Ein Baustein lag' : n + ' Bausteine lagen'} außerhalb des Blatts und ${n === 1 ? 'wurde' : 'wurden'} an seinen Platz zurückgeholt.`, 5000); }
    if (rescueOffPage(d, el)) return;
    applyZoom(); placeSelbar();
    if (scrollToSel) { scrollToSel = false; const s = el.querySelector('.it.sel'); if (s) s.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    const after = AFTER_RENDER.splice(0); after.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    if (typeof FmtTop !== 'undefined') FmtTop.update();
  });
}
const AFTER_RENDER = [];
const onNextRender = fn => AFTER_RENDER.push(fn);
/* Sicherheitsnetz: ein Baustein, der (fast) nicht mehr auf seinem Blatt zu sehen ist, wird an seinen Platz zurückgeholt */
let rescuing = 0;
function rescueOffPage(d, el) {
  const bad = [];
  $$('.it[data-id]', el).forEach(s => { const pg = s.closest('.page'); if (!pg) return; const r = s.getBoundingClientRect(), P = pg.getBoundingClientRect(); if (r.height < 2 && r.width < 2) return;
    const vw = Math.min(r.right, P.right) - Math.max(r.left, P.left), vh = Math.min(r.bottom, P.bottom) - Math.max(r.top, P.top), need = 4 * MM * zoomValue();
    if (vw < Math.min(need, r.width * .5) || vh < Math.min(need, r.height * .5)) { const it = d.items.find(x => x.id === s.dataset.id); if (it && (it.dx != null || it.dy != null)) bad.push(it); } });
  /* ragt eine Seite unten über, weil Bausteine nach unten verschoben sind: Abstand so weit verringern, dass alles passt */
  const fit = [];
  $$('.page', el).forEach(pg => { const pc = pg.querySelector('.pc'); if (!pc) return; const C = pc.getBoundingClientRect(), k = 1 / zoomValue() / MM;
    const its = $$('.it[data-id]', pg).filter(x => !x.classList.contains('free') && !x.classList.contains('tall'));
    let over = (its.reduce((m, x) => Math.max(m, x.getBoundingClientRect().bottom), -1e9) - C.bottom) * k;
    for (let i = its.length - 1; i >= 0 && over > .5; i--) { const it = d.items.find(x => x.id === its[i].dataset.id), dy = +(it && it.dy) || 0; if (dy > 0) { const nd = Math.max(0, Math.floor((dy - over - .5) * 2) / 2); over -= dy - nd; if (nd) it.dy = nd; else delete it.dy; fit.push(it); } } });
  if (fit.length && rescuing <= 2) { rescuing++; markDirty(d); renderPages(); return true; }
  if (!bad.length || rescuing > 2) { rescuing = 0; return false; }
  rescuing++; bad.forEach(it => { delete it.dx; delete it.dy; }); markDirty(d);
  toast(`${bad.length === 1 ? 'Ein Baustein lag' : bad.length + ' Bausteine lagen'} außerhalb des Blatts und ${bad.length === 1 ? 'wurde' : 'wurden'} zurückgeholt.`, 4000);
  renderPages(); return true;
}
function zoomValue() { if (UI.zoom !== 'fit') return +UI.zoom; const desk = $('#desk'); if (!desk) return 1; return Math.max(.3, Math.min(1.35, (desk.clientWidth - 60) / ((cur ? RD.dims(cur).w : 210) * MM))); }
/* Stufenlos zoomen um einen Punkt (Trackpad: zwei Finger auseinander/zusammen, Maus: Strg/⌘ + Mausrad) */
function zoomAt(z, cx, cy) {
  const desk = $('#desk'), p = $('#pages'); if (!desk || !p) return;
  const old = zoomValue(); z = Math.max(.3, Math.min(3, z)); if (Math.abs(z - old) < .001) return;
  const r = desk.getBoundingClientRect(); const mx = cx - r.left, my = cy - r.top;
  const ux = (desk.scrollLeft + mx) / old, uy = (desk.scrollTop + my) / old;
  UI.zoom = Math.round(z * 1000) / 1000; p.style.zoom = UI.zoom;
  desk.scrollLeft = ux * UI.zoom - mx; desk.scrollTop = uy * UI.zoom - my;
  clearTimeout(zoomAt.t); zoomAt.t = setTimeout(() => { saveUI(); applyZoom(); }, 160);
  const zs = $('#zoomer span'); if (zs) zs.textContent = Math.round(UI.zoom * 100) + ' %';
}
function applyZoom() {
  const z = zoomValue(); const p = $('#pages'); if (p) p.style.zoom = z;
  const zm = $('#zoomer'); if (zm) {
    zm.innerHTML = `<button id="zOut" aria-label="Verkleinern">−</button><span>${Math.round(z * 100)} %</span><button id="zIn" aria-label="Vergrößern">+</button><button id="zFit">${UI.zoom === 'fit' ? 'Eingepasst' : 'Einpassen'}</button>`;
    $('#zOut').onclick = () => setZoom(-1); $('#zIn').onclick = () => setZoom(1); $('#zFit').onclick = () => setZoom(0);
  }
  placeSelbar();
}
function setZoom(dir) { const z = zoomValue(); UI.zoom = dir === 0 ? 'fit' : Math.max(.3, Math.min(3, Math.round((z + dir * .1) * 10) / 10)); saveUI(); applyZoom(); }
let resizing = false;
function placeSelbar() {
  if (resizing) return;
  $$('.selbar,.rszh').forEach(b => b.remove()); if (!sel || msel.size > 1) return;
  const desk = $('#desk'), s = desk && desk.querySelector(`.it[data-id="${sel}"]`); if (!s) return;
  const r = s.getBoundingClientRect(), dr = desk.getBoundingClientRect();
  const b = document.createElement('div'); b.className = 'selbar'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Baustein');
  const si = cur && cur.items.find(x => x.id === sel); const moved = si && (+si.dx || +si.dy);
  b.innerHTML = `${moved ? `<button data-a="home" title="Wieder an den Platz (magnetisch einrasten)" aria-label="Position zurücksetzen">⤺</button>` : ''}<button data-a="up" title="Nach oben (Alt+↑)" aria-label="Nach oben">${ICO.up}</button><button data-a="down" title="Nach unten (Alt+↓)" aria-label="Nach unten">${ICO.down}</button><button data-a="dup" title="Duplizieren (${MOD}+D)" aria-label="Duplizieren">${ICO.copy}</button><button data-a="more" title="Weitere Aktionen (Rechtsklick)" aria-label="Weitere Aktionen">${ICO.dots}</button><button data-a="del" class="del" title="Löschen (Entf)" aria-label="Löschen">${ICO.trash}</button>`;
  desk.appendChild(b);
  b.style.left = (r.right - dr.left + desk.scrollLeft - b.offsetWidth + 4) + 'px';
  b.style.top = Math.max(desk.scrollTop + 4, r.top - dr.top + desk.scrollTop - b.offsetHeight - 10) + 'px';
  $$('button', b).forEach(x => x.onclick = () => x.dataset.a === 'more' ? blockMenu(x) : itemAction(x.dataset.a));
  placeResize(s, si, desk, dr);
}
/* letzter sichtbarer Teil eines Bausteins (lange Lineaturen laufen über mehrere Seiten) */
function lastPartOf(it, q) { const parts = $$(`#pages .it[data-id="${it.id}"]`); for (let i = parts.length - 1; i >= 0; i--) { const e = parts[i].querySelector(q); if (e) return e; } return null; }
/* Größe ziehen: Bild (Breite %), Form (Breite/Höhe mm; Umschalttaste = Seitenverhältnis bleibt), QR-Code (Größe), Lineatur (ganze Zeilen dazu oder weg) */
const KEEP = { shift: false };
function placeResize(s, it, desk, dr) {
  $$('.rszh').forEach(x => x.remove()); if (!it || !['image', 'shape', 'qr', 'label', 'lineatur'].includes(it.type)) return;
  const tgt = it.type === 'image' ? s.querySelector('.img img') : it.type === 'shape' ? s.querySelector('.shp svg') : it.type === 'qr' ? s.querySelector('.qrw svg') : it.type === 'lineatur' ? lastPartOf(it, '.lins, .lns, .karo') : s.querySelector('.lbw img'); if (!tgt) return;
  const r = tgt.getBoundingClientRect(); const h = document.createElement('div'); h.className = 'rszh'; h.title = 'Ziehen, um die Größe zu ändern';
  h.style.left = (r.right - dr.left + desk.scrollLeft - 7) + 'px'; h.style.top = (r.bottom - dr.top + desk.scrollTop - 7) + 'px'; desk.appendChild(h);
  h.onpointerdown = e => {
    e.preventDefault(); e.stopPropagation(); resizing = true; h.setPointerCapture(e.pointerId); const x0 = e.clientX, y0 = e.clientY, z = zoomValue(); const st = JSON.parse(JSON.stringify(it)); const iw = RD.dims(cur).iw;
    const apply = (ex, ey) => { const dx = (ex - x0) / z / MM, dy = (ey - y0) / z / MM;
      if (it.type === 'image') it.width = Math.max(3, Math.min(100, Math.round((+st.width || 60) + dx / iw * 100)));
      else if (it.type === 'shape') { const w0 = +st.w || 40, h0 = +st.h || 25; it.w = Math.max(2, Math.round(w0 + dx)); if (!['line', 'arrow', 'darrow'].includes(it.shape)) { it.h = Math.max(2, Math.round(h0 + dy)); if (KEEP.shift) { const f = Math.max(it.w / w0, it.h / h0); it.w = Math.max(2, Math.round(w0 * f)); it.h = Math.max(2, Math.round(h0 * f)); } } }
      else if (it.type === 'qr') it.size = Math.max(15, Math.min(80, Math.round((+st.size || 30) + Math.max(dx, dy))));
      else if (it.type === 'label') it.imgH = Math.max(20, Math.min(200, Math.round((+st.imgH || 60) + dy)));
      else if (it.type === 'lineatur') { const L = RD.LINEATUR[it.kind] || RD.LINEATUR.la2; const pitch = L.karo ? L.karo * 2 : L.line ? L.line : (L.a + L.m + L.d + L.gap); const maxR = Math.max(1, Math.min(30, Math.floor((RD.dims(cur).ch - 15) / pitch))); it.rows = Math.max(1, Math.min(maxR, (+st.rows || 3) + Math.round(dy / pitch))); } };
    const hl = parseFloat(h.style.left), ht = parseFloat(h.style.top); h.onpointermove = ev => { KEEP.shift = ev.shiftKey; apply(ev.clientX, ev.clientY); renderPages(); h.style.left = (hl + ev.clientX - x0) + 'px'; h.style.top = (ht + ev.clientY - y0) + 'px'; };
    h.onpointerup = ev => { h.onpointermove = null; resizing = false; const fin = JSON.parse(JSON.stringify(it)); Object.assign(it, st); change(() => Object.assign(it, fin), null, { panel: true }); clickBlock = Date.now(); };
  };
}
/* ausgewählte Bausteine (Mehrfachauswahl oder der eine ausgewählte) in Blattreihenfolge */
const selectedItems = () => cur ? cur.items.filter(x => msel.size > 1 ? msel.has(x.id) : x.id === sel) : [];
function itemAction(a) {
  if (!cur) return;
  if (msel.size > 1 && ['dup', 'del', 'copy', 'cut', 'home', 'renew'].includes(a)) return multiAction(a);
  if (!sel) return; const i = cur.items.findIndex(x => x.id === sel); if (i < 0) return;
  if (a === 'home') change(() => { const it = cur.items[i]; delete it.dx; delete it.dy; }, null, { panel: true });
  if (a === 'up' && i > 0) change(() => { const [x] = cur.items.splice(i, 1); cur.items.splice(i - 1, 0, x); });
  if (a === 'down' && i < cur.items.length - 1) change(() => { const [x] = cur.items.splice(i, 1); cur.items.splice(i + 1, 0, x); });
  if (a === 'top' && i > 0) change(() => { const [x] = cur.items.splice(i, 1); cur.items.unshift(x); });
  if (a === 'bottom' && i < cur.items.length - 1) change(() => { const [x] = cur.items.splice(i, 1); cur.items.push(x); });
  if (a === 'dup') change(() => { const c = JSON.parse(JSON.stringify(cur.items[i])); c.id = rid('i', 6); cur.items.splice(i + 1, 0, c); sel = c.id; }, null, { panel: true });
  if (a === 'del') { const name = T(cur.items[i].type).name; change(() => { cur.items.splice(i, 1); sel = null; }, null, { panel: true }); toast(`„${name}“ gelöscht – ${MOD}+Z holt ihn zurück.`); }
  if (a === 'copy' || a === 'cut') { copyItems([cur.items[i]]); if (a === 'cut') change(() => { cur.items.splice(i, 1); sel = null; }, null, { panel: true }); toast(a === 'cut' ? 'Ausgeschnitten – mit Einfügen an anderer Stelle oder in einem anderen Tab einsetzen.' : 'Kopiert – mit Einfügen hier oder in einem anderen Tab einsetzen.'); }
  if (a === 'renew' && canNew(cur.items[i])) change(() => renew(cur.items[i]), null, { panel: true });
  if (a === 'break') change(() => { const b = makeItem('break'); cur.items.splice(i, 0, b); }, null, {});
}
function multiAction(a) {
  const list = selectedItems(); if (!list.length) return; const ids = new Set(list.map(x => x.id));
  if (a === 'del') { change(() => { cur.items = cur.items.filter(x => !ids.has(x.id)); sel = null; msel.clear(); }, null, { panel: true }); toast(`${list.length} Bausteine gelöscht – ${MOD}+Z holt sie zurück.`); }
  if (a === 'dup') change(() => { const last = Math.max(...list.map(x => cur.items.indexOf(x))); const copies = list.map(x => { const c = JSON.parse(JSON.stringify(x)); c.id = rid('i', 6); return c; }); cur.items.splice(last + 1, 0, ...copies); msel = new Set(copies.map(c => c.id)); sel = copies[0].id; }, null, { panel: true });
  if (a === 'copy' || a === 'cut') { copyItems(list); if (a === 'cut') change(() => { cur.items = cur.items.filter(x => !ids.has(x.id)); sel = null; msel.clear(); }, null, { panel: true }); toast(`${list.length} Bausteine ${a === 'cut' ? 'ausgeschnitten' : 'kopiert'}.`); }
  if (a === 'home') change(() => list.forEach(x => { delete x.dx; delete x.dy; }), null, { panel: true });
  if (a === 'renew') change(() => list.filter(canNew).forEach(renew), null, { panel: true });
}
/* Zwischenablage für Bausteine: über die System-Zwischenablage (auch zwischen Tabs) */
let CLIP = null; const CLIP_MARK = 'FOLIVA-BAUSTEINE:';
function copyItems(list) { CLIP = JSON.stringify(list); try { const ta = document.createElement('textarea'); ta.value = CLIP_MARK + CLIP; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } catch (e) {} }
function pasteItems(json) {
  let list; try { list = JSON.parse(json); } catch (e) { return false; } if (!Array.isArray(list) || !list.length || !cur) return false;
  const known = list.filter(x => x && T(x.type)); if (!known.length) return false;
  change(() => { const at = sel ? cur.items.findIndex(x => x.id === sel) + 1 : cur.items.length; const copies = known.map(x => { const c = JSON.parse(JSON.stringify(x)); c.id = rid('i', 6); return c; }); cur.items.splice(at < 0 ? cur.items.length : at, 0, ...copies); msel = new Set(copies.length > 1 ? copies.map(c => c.id) : []); sel = copies[copies.length - 1].id; }, null, { panel: true });
  scrollToSel = true; toast(known.length === 1 ? 'Baustein eingefügt.' : known.length + ' Bausteine eingefügt.'); return true;
}
document.addEventListener('copy', e => { if (view !== 'editor' || e.target.closest && e.target.closest('input,textarea,[contenteditable],dialog')) return; if (String(window.getSelection() || '').trim() && !sel) return; const list = selectedItems(); if (!list.length) return; e.preventDefault(); CLIP = JSON.stringify(list); e.clipboardData.setData('text/plain', CLIP_MARK + CLIP); toast(list.length === 1 ? 'Baustein kopiert.' : list.length + ' Bausteine kopiert.'); });
document.addEventListener('cut', e => { if (view !== 'editor' || e.target.closest && e.target.closest('input,textarea,[contenteditable],dialog')) return; const list = selectedItems(); if (!list.length) return; e.preventDefault(); e.clipboardData.setData('text/plain', CLIP_MARK + JSON.stringify(list)); CLIP = JSON.stringify(list); const ids = new Set(list.map(x => x.id)); change(() => { cur.items = cur.items.filter(x => !ids.has(x.id)); sel = null; msel.clear(); }, null, { panel: true }); toast('Ausgeschnitten.'); });
document.addEventListener('paste', e => {
  if (view !== 'editor' || e.target.closest && e.target.closest('input,textarea,[contenteditable],dialog')) return;
  const t = e.clipboardData.getData('text/plain') || '';
  if (t.startsWith(CLIP_MARK)) { e.preventDefault(); pasteItems(t.slice(CLIP_MARK.length)); return; }
  /* Bild aus der Zwischenablage als Bild-Baustein */
  const f = [...(e.clipboardData.files || [])].find(x => /^image\//.test(x.type));
  if (f) { e.preventDefault(); const rd = new FileReader(); rd.onload = async () => { const src = await shrinkImage(rd.result); const it = insertItem('image'); change(() => { it.src = src; }, null, { panel: true }); }; rd.readAsDataURL(f); return; }
  /* reiner Text wird ein Text-Baustein */
  if (t.trim()) { e.preventDefault(); const it = insertItem('text'); change(() => { it.text = t.trim(); }, null, { panel: true }); }
});
function blockMenu(anchor, x, y) {
  const it = cur && cur.items.find(i => i.id === sel); if (!it) return;
  const multi = msel.size > 1;
  const items = multi ? [
    { label: `${msel.size} Bausteine duplizieren`, run: () => itemAction('dup') }, { label: 'Kopieren', run: () => itemAction('copy') }, { label: 'Ausschneiden', run: () => itemAction('cut') },
    { label: 'Neue Aufgaben erzeugen', run: () => itemAction('renew') }, { label: 'Position zurücksetzen', run: () => itemAction('home') }, '-', { label: `${msel.size} Bausteine löschen`, danger: true, run: () => itemAction('del') },
  ] : [
    ...(canNew(it) ? [{ label: 'Neue Aufgaben erzeugen', run: () => itemAction('renew') }] : []),
    { label: 'Duplizieren', run: () => itemAction('dup') }, { label: 'Kopieren', run: () => itemAction('copy') }, { label: 'Ausschneiden', run: () => itemAction('cut') },
    ...(CLIP ? [{ label: 'Einfügen (darunter)', run: () => pasteItems(CLIP) }] : []), '-',
    { label: 'Nach ganz oben', run: () => itemAction('top') }, { label: 'Nach ganz unten', run: () => itemAction('bottom') }, { label: 'Seitenumbruch davor', run: () => itemAction('break') },
    ...((+it.dx || +it.dy) ? [{ label: 'Position zurücksetzen', run: () => itemAction('home') }] : []), '-',
    { label: 'Löschen', danger: true, run: () => itemAction('del') },
  ];
  if (anchor) popMenu(anchor, items); else { const a = document.createElement('span'); a.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:1px;height:1px`; document.body.appendChild(a); popMenu(a, items); setTimeout(() => a.remove(), 50); }
}
function select(id, opts = {}) {
  if (zone) { zone = null; $$('#pages [data-zone]').forEach(z => z.classList.remove('zsel')); }
  if (!opts.keepMulti) msel.clear();
  if (sel === id && !opts.force) { markSel(); return; }
  sel = id; markSel(); placeSelbar(); renderRight();
}
function markSel() { $$('#pages .it').forEach(s => { s.classList.toggle('sel', s.dataset.id === sel); s.classList.toggle('msel', msel.size > 1 && msel.has(s.dataset.id)); }); }
function selectZone(z) { sel = null; msel.clear(); zone = z; markSel(); $$('.selbar').forEach(b => b.remove()); $$('#pages [data-zone]').forEach(x => x.classList.toggle('zsel', x.dataset.zone === z)); if (!UI.right) { UI.right = true; saveUI(); applySides(); } renderRight(); }
/* ---------- Text direkt auf dem Blatt bearbeiten (Doppelklick) ---------- */
let editing = null;
/* Markup eines bearbeitbaren Feldes lesen/schreiben (Titel: Name als reiner Text + Formatierung in titleRich) */
function fieldMarkup(obj, prop) { return obj === cur && prop === 'title' ? RD.titleMarkup(cur) : (obj[prop] || ''); }
function setFieldMarkup(obj, prop, m, multi) {
  if (obj === cur && prop === 'title') {
    const runs = RD.RT.parse(m.replace(/\n/g, ' ')); cur.title = RD.RT.plain(runs, { oneLine: true }).replace(/\s+/g, ' ').trim();
    if (RD.RT.hasFormat(runs)) cur.titleRich = RD.RT.serialize(runs); else delete cur.titleRich; return;
  }
  obj[prop] = multi ? m : m.replace(/\n/g, ' ');
}
function startEdit(el, opts = {}) {
  if (editing) finishEdit(true);
  const sec = el.closest('.it'); const key = el.dataset.edit;
  const obj = key === 'doctitle' ? cur : sec && cur.items.find(i => i.id === sec.dataset.id); if (!obj) return;
  const prop = key === 'doctitle' ? 'title' : key;
  const markup = fieldMarkup(obj, prop);
  const pre = opts.keepSel ? RichEdit.selIndexIn(el) : opts.sel || null;
  editing = { el, obj, prop, key, id: sec && sec.dataset.id, before: markup, multi: !!el.dataset.multi };
  /* Text läuft über Seiten: zum Bearbeiten den ganzen Text zeigen (nach dem Übernehmen fließt er neu) */
  const clip = el.closest('.tclip'); if (clip) { clip.classList.add('tclipEdit'); clip.style.height = 'auto'; clip.style.overflow = 'visible'; clip.firstElementChild.style.marginTop = '0'; }
  RichEdit.start(el, markup, { multi: editing.multi, sel: pre });
  $$('.selbar').forEach(b => b.remove()); if (typeof FmtTop !== 'undefined') FmtTop.update();
  if (!opts.quiet) toast(editing.multi ? `Bearbeiten: ${MOD}+Enter oder Klick daneben übernimmt, Esc bricht ab. Formatieren mit der Leiste oben oder ${MOD}+B/I/U.` : `Bearbeiten: Enter übernimmt, Esc bricht ab. Formatieren mit der Leiste oben oder ${MOD}+B/I/U.`, 3000);
}
function finishEdit(keep) {
  if (!editing) return; const E = editing; editing = null;
  const v = RichEdit.finish();
  if (keep && v != null && v !== E.before) change(() => { setFieldMarkup(E.obj, E.prop, v, E.multi); }, null, { panel: true, top: E.obj === cur });
  else renderPages();
  if (E.obj === cur) { const tt = $(`.tab[data-tab="${cur.id}"] .tt`); if (tt) tt.textContent = cur.title || 'Unbenanntes Material'; }
  if (typeof FmtTop !== 'undefined') FmtTop.update();
}
/* Eine Änderung am ganzen Element (Ausrichtung, Aufzählung …) während der Bearbeitung: übernehmen, ändern, weiterbearbeiten */
function withEditPaused(fn) {
  if (!editing) { fn(); return; }
  const E = editing; const s = RichEdit.selIndexIn(E.el);
  finishEdit(true); fn();
  onNextRender(() => {
    const sel = E.key === 'doctitle' ? '#pages [data-edit="doctitle"]' : `#pages .it[data-id="${E.id}"] [data-edit="${E.key}"]`;
    const el = document.querySelector(sel); if (el) startEdit(el, { sel: s, quiet: true });
  });
}
document.addEventListener('keydown', e => {
  if (!editing || e.target !== editing.el) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finishEdit(false); }
  else if (e.key === 'Enter' && (!editing.multi || e.metaKey || e.ctrlKey)) { e.preventDefault(); e.stopPropagation(); finishEdit(true); }
}, true);
document.addEventListener('focusout', e => {
  if (!editing || e.target !== editing.el) return;
  const to = e.relatedTarget; if (to && to.closest && to.closest('#fmtTop,.clrPop,dialog')) { RichEdit.save(); return; }
  finishEdit(true);
});
/* Klick außerhalb (z. B. nach einer Auswahlliste in der Leiste) beendet die Bearbeitung */
document.addEventListener('pointerdown', e => { if (editing && !editing.el.contains(e.target) && !(e.target.closest && e.target.closest('#fmtTop,.clrPop,dialog'))) finishEdit(true); }, true);

/* ---------- Verschieben: Einreihen über alle Seiten, Feinverschieben nur innerhalb der Seite ----------
   Grundsatz: Kein Ziehen darf einen Baustein unsichtbar machen oder leere Seiten erzeugen. */
function dropPlan(cx, cy, dragEl, it) {
  const pages = $$('#pages .page'); if (!pages.length) return null;
  let pg = pages.find(p => { const r = p.getBoundingClientRect(); return cy >= r.top && cy <= r.bottom; });
  if (!pg) { let best = 1e9; for (const p of pages) { const r = p.getBoundingClientRect(); const d = cy < r.top ? r.top - cy : cy - r.bottom; if (d < best) { best = d; pg = p; } } }
  const own = dragEl.closest('.page');
  const all = $$('#pages .it[data-id]').filter(x => x !== dragEl && !x.classList.contains('free') && !x.closest('.measure'));
  const onPg = all.filter(x => x.closest('.page') === pg);
  let ref = null, after = false, line = null;
  const pc = pg.querySelector('.pc') || pg, pr = pc.getBoundingClientRect();
  if (onPg.length) {
    ref = onPg.find(x => { const r = x.getBoundingClientRect(); return cy < r.top + r.height / 2; });
    if (ref) { const r = ref.getBoundingClientRect(); line = { x: pr.left, w: pr.width, y: r.top }; }
    else { ref = onPg[onPg.length - 1]; after = true; const r = ref.getBoundingClientRect(); line = { x: pr.left, w: pr.width, y: r.bottom }; }
  } else {
    /* leere Seite: hinter den letzten Baustein davor */
    const pi = pages.indexOf(pg); const before = all.filter(x => pages.indexOf(x.closest('.page')) < pi);
    if (before.length) { ref = before[before.length - 1]; after = true; } else { ref = all[0] || null; after = false; }
    line = { x: pr.left, w: pr.width, y: pr.top + 4 };
  }
  if (it.free && own === pg) return { move: false };
  const ids = cur.items.filter(x => x !== it).map(x => x.id);
  let to = ref ? ids.indexOf(ref.dataset.id) + (after ? 1 : 0) : ids.length; if (to < 0) to = ids.length;
  const from = cur.items.indexOf(it);
  if (to === from) return { move: false };
  return { move: true, to, line };
}
function moveItemTo(it, plan) { const i = cur.items.indexOf(it); if (i < 0) return; cur.items.splice(i, 1); cur.items.splice(Math.max(0, Math.min(plan.to, cur.items.length)), 0, it); }
function showDropLine(l) {
  const desk = $('#desk'); let m = $('#dragMark');
  if (!l) { if (m) m.remove(); return; }
  if (!m) { m = document.createElement('div'); m.id = 'dragMark'; m.className = 'insMark'; desk.appendChild(m); }
  const dr = desk.getBoundingClientRect();
  m.style.left = (l.x - dr.left + desk.scrollLeft) + 'px'; m.style.width = l.w + 'px'; m.style.top = (l.y - dr.top + desk.scrollTop - 2) + 'px';
}
/* Erlaubter Bereich (mm) für dx/dy eines Bausteins, gemessen an seiner Seite */
/* Hilfslinien: Ziele einmal je Zug sammeln (Inhaltsbereich der Seite, andere frei schwebende Bausteine, Ober-/Unterkanten der Aufgaben) */
function guideTargets(el) {
  const pg = el.closest('.page'); if (!pg) return { xs: [], ys: [] }; const C = (pg.querySelector('.pc') || pg).getBoundingClientRect();
  const xs = [C.left, C.right, (C.left + C.right) / 2], ys = [C.top, (C.top + C.bottom) / 2];
  $$('.it[data-id]', pg).forEach(o => { if (o === el || o.dataset.id === el.dataset.id) return; const r = o.getBoundingClientRect(); if (r.width < 2) return;
    if (o.classList.contains('free')) { xs.push(r.left, r.right, (r.left + r.right) / 2); ys.push(r.top, r.bottom, (r.top + r.bottom) / 2); } else ys.push(r.top, r.bottom); });
  return { xs, ys, pr: pg.getBoundingClientRect() };
}
function guideSnap(D, dx, dy) {
  if (!D.r0) { D.r0 = D.el.getBoundingClientRect(); const t = D.el.style.transform; if (t) { /* Rechteck ohne laufende Verschiebung */ const m = /translate\(([-\d.]+)px,([-\d.]+)px\)/.exec(t); if (m) { const z = zoomValue(); D.r0 = { left: D.r0.left - m[1] * z, right: D.r0.right - m[1] * z, top: D.r0.top - m[2] * z, bottom: D.r0.bottom - m[2] * z, width: D.r0.width, height: D.r0.height }; } } D.gt = guideTargets(D.el); }
  const r = D.r0, T = 6; let bx = null, by = null;
  [[r.left, 'l'], [(r.left + r.right) / 2, 'c'], [r.right, 'r']].forEach(([v]) => D.gt.xs.forEach(x => { const d = x - (v + dx); if (Math.abs(d) <= T && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, x }; }));
  [[r.top], [(r.top + r.bottom) / 2], [r.bottom]].forEach(([v]) => D.gt.ys.forEach(y => { const d = y - (v + dy); if (Math.abs(d) <= T && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, y }; }));
  return { dx: dx + (bx ? bx.d : 0), dy: dy + (by ? by.d : 0), gx: bx ? bx.x : null, gy: by ? by.y : null, pr: D.gt.pr };
}
/* Eingereihte Bausteine: sichtbarer Inhalt (ohne Aufgabenkopf) – danach richtet sich „mittig“ */
function visBox(sec) {
  const root = sec.querySelector(':scope > .ib') || sec; const W = root.getBoundingClientRect().width; let L = 1e9, R = -1e9;
  const leaf = c => !c.children.length || /^(svg|SVG|TABLE|IMG|CANVAS|FIGURE)$/.test(c.tagName);
  const rec = (e, d) => { for (const c of e.children) { const r = c.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; if (!leaf(c) && d < 8) rec(c, d + 1); else { L = Math.min(L, r.left); R = Math.max(R, r.right); } } };
  rec(root, 0); return L < R ? { l: L, r: R } : null;
}
/* Magnetisch beim Feinverschieben eingereihter Bausteine: Inhalt mittig auf der Seite, bündig links/rechts, oder zurück an den Ausgangsplatz */
function flowSnap(D, it, dx, dy) {
  const z = zoomValue();
  if (!D.fb) { const pg = D.el.closest('.page'); const C = (pg.querySelector('.pc') || pg).getBoundingClientRect(); const v = visBox(D.el); D.fb = { C, v, pr: pg.getBoundingClientRect(), x0: -(+it.dx || 0) * MM * z, y0: -(+it.dy || 0) * MM * z, r0: D.el.getBoundingClientRect() }; }
  const F = D.fb, T = 8; let bx = null, by = null;
  const tryX = (off, gx) => { const d = off - dx; if (Math.abs(d) <= T && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, x: gx }; };
  tryX(F.x0, F.r0.left + F.x0);                                           /* Ausgangsplatz */
  if (F.v) { tryX((F.C.left + F.C.right) / 2 - (F.v.l + F.v.r) / 2, (F.C.left + F.C.right) / 2); tryX(F.C.left - F.v.l, F.C.left); tryX(F.C.right - F.v.r, F.C.right); }
  { const d = F.y0 - dy; if (Math.abs(d) <= T) by = { d, y: F.r0.top + F.y0 }; }
  return { dx: dx + (bx ? bx.d : 0), dy: dy + (by ? by.d : 0), gx: bx ? bx.x : null, gy: by ? by.y : null, pr: F.pr };
}
function showGuides(g) {
  const desk = $('#desk'); if (!desk) return; let gx = $('#guideX'), gy = $('#guideY');
  if (!g || g.gx == null) { if (gx) gx.remove(); } else { if (!gx) { gx = document.createElement('div'); gx.id = 'guideX'; gx.className = 'guide gv'; desk.appendChild(gx); } const dr = desk.getBoundingClientRect(); gx.style.left = (g.gx - dr.left + desk.scrollLeft) + 'px'; gx.style.top = (g.pr.top - dr.top + desk.scrollTop) + 'px'; gx.style.height = g.pr.height + 'px'; }
  if (!g || g.gy == null) { if (gy) gy.remove(); } else { if (!gy) { gy = document.createElement('div'); gy.id = 'guideY'; gy.className = 'guide gh'; desk.appendChild(gy); } const dr = desk.getBoundingClientRect(); gy.style.top = (g.gy - dr.top + desk.scrollTop) + 'px'; gy.style.left = (g.pr.left - dr.left + desk.scrollLeft) + 'px'; gy.style.width = g.pr.width + 'px'; }
}
function posBounds(it) {
  const el = $(`#pages .it[data-id="${it.id}"]`); if (!el) return null;
  const pg = el.closest('.page'); if (!pg) return null; const pc = pg.querySelector('.pc') || pg;
  const k = 1 / zoomValue() / MM, r = el.getBoundingClientRect(), P = pg.getBoundingClientRect(), C = pc.getBoundingClientRect();
  /* Werte, mit denen das Blatt gerade gezeichnet ist (nicht die evtl. schon neueren Daten) */
  const dx0 = +el.dataset.pdx || 0, dy0 = +el.dataset.pdy || 0;
  if (it.free) {
    const xmin = dx0 - (r.left - P.left) * k, xmax = Math.max(xmin, dx0 + (P.right - r.right) * k);
    const ymin = dy0 - (r.top - C.top) * k, ymax = Math.max(ymin, dy0 + (C.bottom - r.bottom) * k);
    return { xmin, xmax, ymin, ymax };
  }
  /* nach unten nur so weit, wie unten auf dieser Seite noch Platz ist – sonst würden andere Bausteine auf eine neue Seite rutschen */
  const last = $$('.it[data-id]', pg).filter(x => !x.classList.contains('free')).reduce((m, x) => Math.max(m, x.getBoundingClientRect().bottom), r.bottom);
  return { xmin: dx0 - (r.left - P.left) * k + 2, xmax: dx0 + (P.right - r.left) * k - 25, ymin: Math.min(dy0, dy0 - (r.top - C.top) * k), ymax: Math.max(Math.min(dy0, 0), dy0 + (C.bottom - last) * k - 1.5) };
}
function setPos(it, nx, ny, b) {
  if (b) { nx = Math.max(b.xmin, Math.min(b.xmax, nx)); ny = Math.max(b.ymin, Math.min(b.ymax, ny)); }
  const lim = posLimit(cur); nx = Math.max(lim.xmin, Math.min(lim.xmax, nx)); ny = Math.max(it.free ? lim.fymin : lim.ymin, Math.min(it.free ? lim.fymax : lim.ymax, ny));
  nx = Math.round(nx * 2) / 2; ny = Math.round(ny * 2) / 2;
  if (Math.abs(nx) >= .5) it.dx = nx; else delete it.dx; if (Math.abs(ny) >= .5) it.dy = ny; else delete it.dy;
}
/* Harte Grenzen unabhängig von der Darstellung (auch für alte oder beschädigte Materialien) */
function posLimit(d) { const m = RD.dims(d); return { xmin: -25, xmax: m.cw - 15, ymin: -25, ymax: Math.round(m.ch * .6), fymin: -m.ch, fymax: m.ch }; }
function repairPositions(d) {
  const lim = posLimit(d); let n = 0;
  d.items.forEach(it => {
    const dx = +it.dx || 0, dy = +it.dy || 0; let bad = false;
    if (it.dx != null && (!isFinite(+it.dx) || dx < lim.xmin || dx > lim.xmax)) { delete it.dx; bad = true; }
    if (it.dy != null && (!isFinite(+it.dy) || dy < (it.free ? lim.fymin : lim.ymin) || dy > (it.free ? lim.fymax : lim.ymax))) { delete it.dy; bad = true; }
    if (bad) n++;
  });
  return n;
}
function bindDesk() {
  const desk = $('#desk');
  desk.addEventListener('click', e => {
    if (Date.now() - clickBlock < 250 || editing) return; { const dp = e.target.closest('[data-dup]'); if (dp) { duplicatePage(+dp.dataset.dup); return; } } if (e.target.closest('.selbar,.zoomer,.reopen,.insMark')) return;
    const s = e.target.closest('.it');
    if (s && (e.shiftKey || e.metaKey || e.ctrlKey)) { /* Mehrfachauswahl */
      if (sel && !msel.size) msel.add(sel); msel.has(s.dataset.id) ? msel.delete(s.dataset.id) : msel.add(s.dataset.id);
      sel = msel.size ? [...msel][msel.size - 1] : null; if (msel.size <= 1) { msel.clear(); } markSel(); placeSelbar(); renderRight(); return;
    }
    if (!s) { const z = e.target.closest('[data-zone]'); if (z) return selectZone(z.dataset.zone); }
    select(s ? s.dataset.id : null);
  });
  desk.addEventListener('dblclick', e => {
    const ed = e.target.closest('[data-edit]');
    if (ed && !e.target.closest('.s')) { e.preventDefault(); const s = ed.closest('.it'); if (s) select(s.dataset.id); else selectZone('head'); startEdit(ed, { keepSel: true }); return; }
    const s = e.target.closest('.it'); if (!s) return; select(s.dataset.id); if (!UI.right) { UI.right = true; saveUI(); applySides(); } const f = $('#right input[type=text], #right textarea'); if (f) f.focus();
  });
  desk.addEventListener('contextmenu', e => { const s = e.target.closest('#pages .it'); if (!s || s.classList.contains('brk')) return; e.preventDefault(); if (!(msel.size > 1 && msel.has(s.dataset.id))) select(s.dataset.id); blockMenu(null, e.clientX, e.clientY); });
  /* Zoomen: zwei Finger auf dem Trackpad (kommt als Mausrad mit Strg) oder Strg/⌘ + Mausrad */
  desk.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomAt(zoomValue() * Math.exp(-Math.max(-25, Math.min(25, e.deltaY * (e.deltaMode ? 33 : 1))) * .01), e.clientX, e.clientY); }, { passive: false });
  /* Bausteine aus der linken Leiste aufs Blatt ziehen */
  let insMark = null; const insTarget = e => { const items = $$('#pages .it').filter(x => x.dataset.id && !x.classList.contains('free')); let best = null; for (const o of items) { const r = o.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { best = { id: o.dataset.id, after: false, r }; break; } best = { id: o.dataset.id, after: true, r }; } return best; };
  desk.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; return; } if (![...e.dataTransfer.types].includes('application/x-foliva-type') && ![...e.dataTransfer.types].includes('application/x-foliva-preset')) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; const t = insTarget(e); if (!insMark) { insMark = document.createElement('div'); insMark.className = 'insMark'; desk.appendChild(insMark); } const dr = desk.getBoundingClientRect(); if (t) { insMark.style.left = (t.r.left - dr.left + desk.scrollLeft) + 'px'; insMark.style.width = t.r.width + 'px'; insMark.style.top = ((t.after ? t.r.bottom : t.r.top) - dr.top + desk.scrollTop - 2) + 'px'; } });
  desk.addEventListener('dragleave', e => { if (insMark && !desk.contains(e.relatedTarget)) { insMark.remove(); insMark = null; } });
  desk.addEventListener('drop', e => {
    const files = [...(e.dataTransfer.files || [])].filter(f => /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/.test(f.type));
    if (files.length) { e.preventDefault(); const t = insTarget(e); let at = t ? cur.items.findIndex(x => x.id === t.id) + (t.after ? 1 : 0) : cur.items.length; files.slice(0, 10).forEach((f, k) => { const rd = new FileReader(); rd.onload = async () => { const src = await shrinkImage(rd.result); const it = insertItem('image', at + k); change(() => { it.src = src; }, null, { panel: true }); }; rd.readAsDataURL(f); }); return; }
    if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); toast('Nur Bilder (PNG, JPG, GIF, WebP, SVG) können aufs Blatt gezogen werden.'); return; }
    const pre = e.dataTransfer.getData('application/x-foliva-preset'); if (pre) { if (insMark) { insMark.remove(); insMark = null; } e.preventDefault(); const t = insTarget(e); const at = t ? cur.items.findIndex(x => x.id === t.id) + (t.after ? 1 : 0) : cur.items.length; const [pid, pi] = pre.split(':'); insertPreset(pid, +pi, at); return; }
    const type = e.dataTransfer.getData('application/x-foliva-type'); if (insMark) { insMark.remove(); insMark = null; } if (!type || !T(type)) return; e.preventDefault(); const t = insTarget(e); let at = cur.items.length; if (t) { at = cur.items.findIndex(x => x.id === t.id) + (t.after ? 1 : 0); } insertItem(type, at); });
  /* Ziehen mit der Maus: kleine Bewegung = Feinverschieben an Ort und Stelle (z. B. Überschrift etwas nach rechts),
     über die Mitte eines anderen Bausteins hinaus = magnetisch neu einreihen. Mit gedrückter Alt-/Wahltaste nur verschieben. */
  let D = null;
  desk.addEventListener('pointerdown', e => {
    if (e.button !== 0 || editing || e.shiftKey || e.metaKey || e.ctrlKey || e.target.closest('.selbar,.zoomer,.reopen,input,textarea,select,button,[contenteditable]')) return;
    const s = e.target.closest('#pages .it'); if (!s || s.classList.contains('brk')) return;
    { const st = $$('#pages .it.dragging'); if (st.length) { st.forEach(x => { x.classList.remove('dragging'); x.style.transform = ''; }); renderPages(); } }
    D = { id: s.dataset.id, el: s, x: e.clientX, y: e.clientY, on: false, pid: e.pointerId };
  });
  desk.addEventListener('pointermove', e => {
    if (!D || e.pointerId !== D.pid) return;
    const dx = e.clientX - D.x, dy = e.clientY - D.y;
    if (!D.on) { if (Math.hypot(dx, dy) < 5) return; D.on = true; select(D.id); D.el.classList.add('dragging'); desk.setPointerCapture(e.pointerId); $$('.selbar,.rszh').forEach(b => b.remove()); }
    const z = zoomValue();
    const it = cur.items.find(x => x.id === D.id);
    D.plan = it && !e.altKey ? dropPlan(e.clientX, e.clientY, D.el, it) : null;
    showDropLine(D.plan && D.plan.move ? D.plan.line : null);
    /* Hilfslinien wie in Präsentationsprogrammen: frei schwebende Bausteine rasten an Kanten und Mitten ein */
    let ax = dx, ay = dy; D.snap = null;
    if (it && !(D.plan && D.plan.move) && !e.shiftKey) { const g = it.free ? guideSnap(D, dx, dy) : flowSnap(D, it, dx, dy); ax = g.dx; ay = g.dy; D.snap = g; showGuides(g); } else showGuides(null);
    D.el.style.transform = `translate(${ax / z}px,${ay / z}px)`;
  });
  const endDrag = e => {
    if (!D) return; const d0 = D; D = null; showDropLine(null); showGuides(null); if (!d0.on) return;
    d0.el.style.transform = ''; d0.el.classList.remove('dragging');
    clickBlock = Date.now();
    const it = cur.items.find(x => x.id === d0.id); if (!it) return;
    const plan = e.altKey ? null : dropPlan(e.clientX, e.clientY, d0.el, it);
    if (plan && plan.move) {
      change(() => { moveItemTo(it, plan); delete it.dy; sel = it.id; }, null, { panel: true });
      toast('Eingereiht. Feiner verschieben: innerhalb des Platzes ziehen oder Pfeiltasten.', 2600);
      return;
    }
    /* Feinverschieben – immer so begrenzt, dass der Baustein auf seiner Seite sichtbar bleibt und keine neue Seite entsteht */
    const z = zoomValue(), mmx = ((d0.snap ? d0.snap.dx : e.clientX - d0.x)) / z / MM, mmy = ((d0.snap ? d0.snap.dy : e.clientY - d0.y)) / z / MM;
    const snap = v => { if (d0.snap && (d0.snap.gx != null || d0.snap.gy != null)) return Math.round(v * 10) / 10; v = Math.round(v * 2) / 2; return Math.abs(v) < 1.5 ? 0 : v; };
    const b = posBounds(it);
    change(() => { setPos(it, snap((+it.dx || 0) + mmx), snap((+it.dy || 0) + mmy), b); }, null, { panel: true });
  };
  desk.addEventListener('pointerup', endDrag);
  /* Abbruch (z. B. weil der Browser markierten Text ziehen will): das Ereignis kommt nicht immer beim Blatt an – darum am Fenster abfangen */
  const cancelDrag = () => { const was = D && D.on; if (was) { D.el.style.transform = ''; D.el.classList.remove('dragging'); showDropLine(null); showGuides(null); } D = null; if (was) renderPages(); };
  window.addEventListener('pointercancel', cancelDrag, true); window.addEventListener('blur', cancelDrag);
  /* Kein Ziehen von markiertem Text oder Bildern aus dem Blatt (würde das Verschieben abbrechen) */
  desk.addEventListener('dragstart', e => { const t = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement; if (t && t.closest && t.closest('#pages')) e.preventDefault(); });
  new ResizeObserver(() => { if (UI.zoom === 'fit') applyZoom(); }).observe(desk);
  renderReopen();
}

/* ---------- rechts: Einstellungen ---------- */
function renderRight() {
  if (typeof FmtTop !== 'undefined') FmtTop.update();
  const el = $('#right'); if (!el || !cur) return;
  const it = sel && cur.items.find(x => x.id === sel);
  if (msel.size > 1) return renderMultiPanel(el);
  if (zone && it) zone = null;
  if (zone === 'head') return renderHeadPanel(el);
  if (zone === 'foot') return renderFootPanel(el);
  if (!it) { sel = null; return renderDocPanel(el); }
  const t = T(it.type);
  let h = `<div class="sideHead"><h2>${C.ICON[it.type] || ''}<span>${esc(t.name)}</span></h2><button class="collapse" id="delIt" title="Baustein löschen" aria-label="Baustein löschen">${ICO.trash}</button><button class="collapse" id="hideR" title="Einstellungen ausblenden" aria-label="Einstellungen ausblenden">${ICO.sideR}</button></div><div class="props">`;
  if (it.data && it.data.error) h += `<div class="genErr" role="alert">${esc(it.data.error)}</div>`;
  if (it.data && it.data.missing && it.data.missing.length) h += `<p class="hint warn">Nicht im Rätsel untergebracht: ${esc(it.data.missing.join(', '))}. „Neu mischen“ versuchen, das Gitter vergrößern oder Wörter ändern.</p>`;
  const regenable = canNew(it);
  const pooled = canFill(it) || (t.gen && !['choice', 'match', 'vocab', 'gaps'].includes(t.gen));
  /* Eigene Inhalte bei einem Baustein mit Sammlung: neu anordnen – oder mit einem Klick wieder Inhalte aus einem Thema erzeugen */
  const srcP = t.props.find(p => p.k === 'source'); const poolOpt = G.FILL[it.type] && it.source === 'eigene' && srcP && srcP.opts ? (srcP.opts.find(o => o[0] === it.poolSrc) || srcP.opts.find(o => o[0] !== 'eigene')) : null;
  const ownPool = !!poolOpt && !canFill(it) && (!!it.poolSrc || ['crossword', 'truefalse', 'sachtext', 'gap', 'scramble', 'wordsearch', 'abc', 'wordlist', 'secret', 'pictureword', 'wordtypes'].includes(it.type));
  if (regenable) h += `<div class="regen"><button class="tb" id="regenBtn" title="${pooled && !ownPool ? 'Neue Aufgaben nach denselben Einstellungen (zufällig)' : 'Eigene Inhalte neu mischen bzw. neu anordnen'}">${ICO.dice} ${pooled && !ownPool ? 'Neue Aufgaben erzeugen' : 'Neu mischen'}</button>${ownPool ? `<button class="tb" id="poolBtn" title="Inhalt: ${esc(poolOpt[1])}">Neue Inhalte erzeugen</button>` : ''}</div>`;
  else if (ownPool) h += `<div class="regen"><button class="tb" id="poolBtn" title="Inhalt: ${esc(poolOpt[1])}">${ICO.dice} Neue Inhalte erzeugen</button></div>`;
  t.props.forEach(p => { if (p.when && !p.when(it)) return; h += fieldHTML(p, it[p.k], it); });
  if (t.hint) h += `<p class="hint">${esc(t.hint)}</p>`;
  if (['text', 'sachtext', 'gedicht'].includes(it.type)) h += `<div class="btnCol" style="margin:4px 0 10px"><button class="tb" type="button" data-bibopen="item">${BIB_ICO} Text aus der Bibliothek …</button></div>`;
  if (C.TYPES[it.type] && RD.TASK.has(it.type)) {
    h += `<div class="sec">Aufgabe</div>`;
    if (cur.kind === 'probe') h += fieldHTML({ k: 'points', label: 'Punkte', type: 'number', min: 0, max: 100, step: .5 }, it.points, it);
    h += fieldHTML({ k: 'numbered', label: 'Nummerieren', type: 'toggle', inv: true }, it.numbered !== false, it);
  }
  if (it.type !== 'break') h += fontSectionHTML(it);
  if (it.type !== 'break') h += posSectionHTML(it);
  if (regenable) h += `<p class="hint">Die Aufgaben und Lösungen werden mit dem Material gespeichert und ändern sich nur mit „Neue Aufgaben erzeugen“.</p>`;
  h += '</div>';
  el.innerHTML = h;
  $('#hideR').onclick = () => { UI.right = false; saveUI(); applySides(); };
  $('#delIt').onclick = () => itemAction('del');
  const pb = $('#poolBtn'); if (pb) pb.onclick = async () => { try { await flush(); await N.snapshot(cur, 'vor Neu erzeugen'); } catch (e) {} change(() => { it.source = poolOpt[0]; renew(it); }, null, { panel: true }); toast('Inhalt: ' + poolOpt[1] + ' – deine eigenen Wörter sind mit ' + MOD + '+Z zurückzuholen.', 3600); };
  const rb = $('#regenBtn'); if (rb) rb.onclick = async () => { try { await flush(); await N.snapshot(cur, 'vor Neu erzeugen'); } catch (e) {} change(() => { renew(it); }, null, { panel: true }); };
  bindFields(el, it, true);
  const pr = $('#posReset', el); if (pr) pr.onclick = () => change(() => { delete it.dx; delete it.dy; }, null, { panel: true });
}
/* Schriften eines Bausteins: Anweisung und Aufgabeninhalt getrennt (spezifischere Wahl hat Vorrang) */
function fontSectionHTML(it) {
  const SF = RD.sheetFonts(cur.settings); const L = k => RD.fontLabel(k);
  let h = `<div class="sec">Schrift</div>`;
  if (RD.TASK.has(it.type)) {
    h += fieldHTML({ k: 'fontI', label: 'Arbeitsanweisung', type: 'font', inheritLabel: 'Wie das Blatt: ' + L(SF.fI) }, it.fontI || it.font || '', it);
    h += fieldHTML({ k: 'fontC', label: 'Aufgabeninhalt (Wörter, Zahlen, Texte)', type: 'font', inheritLabel: 'Wie das Blatt: ' + L(SF.fC) }, it.fontC || it.font || '', it);
  } else if (RD.TITLE_ROLE.has(it.type)) h += fieldHTML({ k: 'font', label: 'Schrift dieser Überschrift', type: 'font', inheritLabel: 'Wie Titel des Blatts: ' + L(SF.fT) }, it.font || '', it);
  else h += fieldHTML({ k: 'font', label: 'Schrift dieses Bausteins', type: 'font', inheritLabel: 'Wie das Blatt: ' + L(SF.fC) }, it.font || '', it);
  if (it.type === 'lineatur' && RD.isTraceKind(it.kind)) {
    const fall = it.fontC || it.font || SF.fC; const ti = RD.traceInfo(it, fall);
    h += fieldHTML({ k: 'pfont', label: 'Übungsschrift der Vorgabe (Nachspuren)', type: 'font', inheritLabel: 'Wie der Aufgabeninhalt: ' + L(fall) }, it.pfont || '', it);
    if (ti.note) h += `<p class="hint warn">${esc(ti.note)}</p>`;
    if (RD.FONTS[ti.key] && RD.FONTS[ti.key].guides && it.kind !== 'ohne') h += `<p class="hint warn">Diese Schrift bringt eigene Hilfslinien mit. Für eine einfache Lineatur „Keine Linien“ wählen.</p>`;
  }
  const missing = [it.font, it.fontI, it.fontC, it.pfont].filter(k => k && !FontUI.available(k));
  if (missing.length) h += `<p class="hint warn">Fehlt auf diesem Computer: ${missing.map(k => '„' + esc(L(k)) + '“').join(', ')}. Angezeigt wird ersatzweise die Standardschrift – bitte eine vorhandene Schrift wählen.</p>`;
  return h;
}
/* Position: fein verschieben oder frei schweben lassen */
function posSectionHTML(it) {
  const moved = +it.dx || +it.dy;
  let h = `<div class="sec">Position</div><div class="grid2">${fieldHTML({ k: 'dx', label: 'nach rechts (mm)', type: 'number', min: -150, max: 250, step: .5, empty: true }, it.dx ?? '', it)}${fieldHTML({ k: 'dy', label: it.free ? 'nach unten (mm)' : 'Abstand oben (mm)', type: 'number', min: -150, max: 250, step: .5, empty: true }, it.dy ?? '', it)}</div>`;
  if (it.type === 'note') { h += `<div class="grid2">${fieldHTML({ k: 'fw', label: 'Breite (mm)', type: 'number', min: 20, max: 280, empty: true }, it.fw ?? '', it)}</div>`; }
  else if (['image', 'text', 'shape', 'bubble', 'heading', 'lineatur', 'qr', 'space'].includes(it.type)) {
    h += fieldHTML({ k: 'free', label: 'Frei schweben (über dem Blatt, verschiebt nichts)', type: 'toggle' }, !!it.free, it);
    if (it.free) h += `<div class="grid2">${fieldHTML({ k: 'fw', label: 'Breite (mm, leer = ganze Breite)', type: 'number', min: 5, max: 280, empty: true }, it.fw ?? '', it)}${fieldHTML({ k: 'rot', label: 'Drehen (Grad)', type: 'number', min: -180, max: 180, empty: true }, it.rot ?? '', it)}</div>`;
  }
  h += `<p class="hint">Auf dem Blatt ziehen: an eine andere Stelle ziehen = einreihen (eine blaue Linie zeigt, wo). Am Platz kurz ziehen = fein verschieben, nur innerhalb der Seite. Pfeiltasten: 1 mm, mit Umschalt 5 mm.${moved ? '' : ''}</p>`;
  if (moved) h += `<button class="tb" id="posReset" type="button">⤺ Wieder einrasten (Versatz entfernen)</button>`;
  return h;
}
function fieldHTML(p, v, obj) {
  const id = 'f_' + p.k;
  const lab = (extra = '') => `<span>${esc(p.label)}${extra}</span>`;
  switch (p.type) {
    case 'wordhints': {
      const rows = String(v || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [w, ...c] = l.split('|'); return { w: w.trim(), h: c.join('|').trim() }; });
      const img = h => { const f = h.slice(4); return RD.imgSrc(/^(lib:|data:)/.test(f) ? f : 'lib:' + f); };
      return `<div class="field">${lab()}<div class="lst whl" data-wh="${p.k}">${rows.map((r, i) => `<div class="lrow whr" data-i="${i}" data-himg="${/^img:/.test(r.h) ? esc(r.h) : ''}"><input type="text" class="whw" value="${esc(r.w)}" placeholder="Wort" aria-label="Wort ${i + 1}">${/^img:/.test(r.h) ? `<span class="whimg"><img class="pairImg" src="${esc(img(r.h))}" alt=""><button type="button" class="x" data-whnoimg title="Bild entfernen" aria-label="Bild entfernen">×</button></span>` : `<input type="text" class="whh" value="${esc(r.h)}" placeholder="Hinweis (z. B. Er bellt.)" aria-label="Hinweis ${i + 1}"><button type="button" class="tb mini" data-whimg title="Bild als Hinweis" aria-label="Bild als Hinweis">Bild</button>`}<button type="button" class="x" data-whrm title="Wort entfernen" aria-label="Wort entfernen">×</button></div>`).join('')}
        <div class="linkrow"><button type="button" class="tb mini" data-whadd>+ Wort</button><button type="button" class="tb mini" data-whaddimg>+ Wort mit Bild</button></div></div>${p.hint ? `<small class="h">${esc(p.hint)}</small>` : ''}</div>`;
    }
    case 'sec': return `<div class="sec">${esc(p.label)}</div>`;
    case 'info': { let h = ''; try { h = p.html(obj); } catch (e) { h = ''; } return h ? `<div class="field"><div class="infoBox">${h}</div></div>` : ''; }
    case 'color': return `<div class="field">${lab()}<span class="clrRow"><input type="color" id="${id}" data-k="${p.k}" value="${esc(/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : (p.def || '#000000'))}" aria-label="${esc(p.label)}"><span class="clrSw">${(p.palette || ['#222222', '#c8102e', '#1d5fbf', '#2e8b57', '#e0b84a', '#7a4fb5']).map(c => `<button type="button" data-clrset="${p.k}" data-c="${c}" style="background:${c}" title="${c}" aria-label="Farbe ${c}"></button>`).join('')}</span>${v ? `<button type="button" class="tb mini" data-clr="${p.k}">${esc(p.noneLabel || 'Standard')}</button>` : `<small class="h">${esc(p.noneLabel || 'Standard')}</small>`}</span></div>`;
    case 'text': if (!p.plain) return `<div class="field"><div class="fmtRow">${lab()}</div><div class="rtf" id="${id}" data-k="${p.k}" data-rt="1" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="false" aria-label="${esc(p.label)}">${RD.RT.toHtml(String(v == null ? '' : v), { edit: true })}</div></div>`;
      return `<div class="field"><div class="fmtRow">${lab()}</div><input type="text" id="${id}" data-k="${p.k}" value="${esc(v)}" spellcheck="true" aria-label="${esc(p.label)}"></div>`;
    case 'textarea': if (!p.plain) return `<div class="field"><div class="fmtRow">${lab()}</div><div class="rtf ml" id="${id}" data-k="${p.k}" data-rt="1" data-multi="1" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" aria-label="${esc(p.label)}" style="min-height:${(p.rows || 3) * 1.45 + .9}em">${RD.RT.toHtml(String(v == null ? '' : v), { edit: true })}</div>${p.hint ? `<small class="h">${esc(p.hint)}</small>` : ''}</div>`;
      return `<div class="field"><div class="fmtRow">${lab()}</div><textarea id="${id}" data-k="${p.k}" rows="${p.rows || 3}" spellcheck="true" aria-label="${esc(p.label)}">${esc(v)}</textarea>${p.hint ? `<small class="h">${esc(p.hint)}</small>` : ''}</div>`;
    case 'number': return `<label class="field">${lab()}<input type="number" id="${id}" data-k="${p.k}" data-num="1" value="${v == null || v === '' ? '' : esc(v)}" ${p.min != null ? `min="${p.min}"` : ''} ${p.max != null ? `max="${p.max}"` : ''} step="${p.step || 1}"></label>`;
    case 'select': { let opts = p.dyn ? p.dyn(obj) : p.opts; if (p.legacy && p.legacy[v]) opts = [[v, p.legacy[v]], ...opts]; return `<label class="field">${lab()}<select id="${id}" data-k="${p.k}" data-sel="1">${opts.map(([a, b]) => `<option value="${esc(a)}" ${String(a) === String(v) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></label>`; }
    case 'font': return `<div class="field">${lab()}${FontUI.button(id, v, { k: p.k, inheritLabel: p.inheritLabel || (p.inherit ? 'Wie das Blatt' : null) })}${p.hint ? `<small class="h">${p.hint}</small>` : ''}</div>`;
    case 'seg': return `<div class="field">${lab()}<div class="segP" data-seg="${p.k}">${p.opts.map(([a, b]) => `<button type="button" data-v="${esc(a)}" data-num="${typeof a === 'number' ? 1 : ''}" aria-pressed="${String(a) === String(v ?? '')}">${esc(b)}</button>`).join('')}</div></div>`;
    case 'toggle': return `<label class="trow"><span>${esc(p.label)}</span><input type="checkbox" class="sw" data-k="${p.k}" data-tog="1" ${p.inv ? 'data-inv="1"' : ''} ${(p.inv ? v !== false : v) ? 'checked' : ''}></label>`;
    case 'options': return `<div class="field">${lab()}<div class="lst" data-list="options" data-lk="${p.k}">${(v || []).map((o, i) => `<div class="lrow"><button type="button" class="okb" data-ok="${i}" aria-pressed="${!!o.ok}" title="Richtige Antwort" aria-label="Richtige Antwort">${ICO.check}</button><input type="text" data-opt="${i}" value="${esc(o.t)}"><button type="button" class="collapse" data-rm="${i}" aria-label="Antwort entfernen">${ICO.trash}</button></div>`).join('')}<button type="button" class="addRow" data-add>+ ${esc(p.addLabel || 'Antwort hinzufügen')}</button></div><small class="h">${esc(p.hint || 'Häkchen = richtige Antwort (im Lösungsblatt angekreuzt).')}</small></div>`;
    case 'pairs': return `<div class="field">${lab()}<div class="lst" data-list="pairs" data-lk="${p.k}">${(v || []).map((o, i) => `<div class="lrow">${/^img:/.test(o.l || '') ? `<img class="pairImg" src="${esc(RD.imgSrc(/^(lib:|data:)/.test(o.l.slice(4)) ? o.l.slice(4) : 'lib:' + o.l.slice(4)))}" alt="" title="Bild aus der Bibliothek">` : ''}<input type="text" data-pl="${i}" value="${esc(o.l)}" aria-label="${esc(p.lLabel || 'links')}" placeholder="${esc(p.lLabel || '')}"><input type="text" data-pr="${i}" value="${esc(o.r)}" aria-label="${esc(p.rLabel || 'rechts')}" placeholder="${esc(p.rLabel || '')}"><button type="button" class="collapse" data-rm="${i}" aria-label="Zeile entfernen">${ICO.trash}</button></div>`).join('')}<button type="button" class="addRow" data-add>+ ${esc(p.addLabel || 'Paar hinzufügen')}</button>${p.k === 'pairs' ? `<button type="button" class="addRow" data-addimg>+ Bild-Paar (Bild links)</button>` : ''}</div><small class="h">${esc(p.hint || ((v || []).some(o => /^img:/.test(o.l || '')) ? '„img:…“ steht für ein Bild aus der Bibliothek.' : ''))}</small></div>`;
    case 'labels': return `<div class="field">${lab()}${obj.src ? `<div class="lbPrev" data-lbprev title="Ins Bild klicken: neue Beschriftung an dieser Stelle"><img src="${esc(RD.imgSrc(obj.src))}" alt="">${(v || []).map((o, i) => `<i style="left:${+o.x || 0}%;top:${+o.y || 0}%">${i + 1}</i>`).join('')}</div><small class="h">Ins Bild klicken setzt einen neuen Punkt. Punkte links der Mitte werden links beschriftet, sonst rechts.</small>` : '<small class="h">Zuerst ein Bild wählen.</small>'}<div class="lst" data-list="labels">${(v || []).map((o, i) => `<div class="lrow lb3"><b>${i + 1}</b><input type="text" data-lt="${i}" value="${esc(o.t)}" aria-label="Beschriftung"><input type="number" data-lx="${i}" value="${esc(o.x)}" min="0" max="100" aria-label="x in %" title="waagrecht (%)"><input type="number" data-ly="${i}" value="${esc(o.y)}" min="0" max="100" aria-label="y in %" title="senkrecht (%)"><button type="button" class="collapse" data-rm="${i}" aria-label="Entfernen">${ICO.trash}</button></div>`).join('')}</div></div>`;
    case 'cells': { const cells = v || [[]]; return `<div class="field">${lab()}<div class="cellsEd"><table>${cells.map((row, r) => `<tr>${row.map((c, k) => `<td><input type="text" data-cell="${r},${k}" value="${esc(c)}"></td>`).join('')}</tr>`).join('')}</table></div><div class="cellsBtns"><button type="button" class="mini" data-cadd="row">+ Zeile</button><button type="button" class="mini" data-cadd="col">+ Spalte</button><button type="button" class="mini" data-cdel="row">− Zeile</button><button type="button" class="mini" data-cdel="col">− Spalte</button></div></div>`; }
    case 'image': return `<div class="field">${lab()}<div class="imgPick">${v ? `<img src="${esc(RD.imgSrc(v))}" alt="">` : ''}<button type="button" class="tb" data-img>${v ? 'Anderes Bild wählen …' : 'Bild auswählen …'}</button></div>${String(v || '').startsWith('lib:') ? `<small class="h">Aus der Bildbibliothek: ${esc((BildUI.byFile(v.slice(4)) || {}).n || '')}</small>` : ''}</div>`;
  }
  return '';
}
/* Kleine Formatleiste über Textfeldern: Fett, Unterstrichen, Schrift für die markierte Stelle */
function fmtBar(id, labHtml) {
  return `<div class="fmtRow">${labHtml}<span class="fmtBar" data-for="${id}"><button type="button" data-fmt="b" title="Markierung fett (**…**)" aria-label="Fett"><b>F</b></button><button type="button" data-fmt="u" title="Markierung unterstreichen (__…__)" aria-label="Unterstreichen"><u>U</u></button><button type="button" data-fmt="f" title="Andere Schrift nur für die markierte Stelle" aria-label="Schrift für Markierung">Aa</button></span></div>`;
}
function wrapSel(inp, a, b) {
  const s0 = inp.selectionStart, s1 = inp.selectionEnd; const v = inp.value;
  if (s0 === s1) { toast('Erst im Textfeld eine Stelle markieren, dann formatieren.'); inp.focus(); return; }
  inp.value = v.slice(0, s0) + a + v.slice(s0, s1) + b + v.slice(s1); inp.focus(); inp.setSelectionRange(s0 + a.length, s1 + a.length);
  inp.dispatchEvent(new Event('input'));
}
function bindFmt(el) {
  $$('.fmtBar', el).forEach(bar => {
    const inp = () => document.getElementById(bar.dataset.for);
    $$('[data-fmt]', bar).forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => {
      const i = inp(); if (!i) return; const f = b.dataset.fmt;
      if (f === 'b') wrapSel(i, '**', '**'); else if (f === 'u') wrapSel(i, '__', '__');
      else { if (i.selectionStart === i.selectionEnd) { toast('Erst im Textfeld eine Stelle markieren, dann die Schrift wählen.'); i.focus(); return; } const s0 = i.selectionStart, s1 = i.selectionEnd; FontUI.open(b, '', null, key => { if (!key) return; i.setSelectionRange(s0, s1); const name = RD.FONTS[key] ? key : RD.sysName(key); wrapSel(i, `{{${name}|`, '}}'); }); }
    }; });
  });
}
/* Eingaben im rechten Bereich übernehmen. obj = Baustein oder Material (bei isItem=false) */
const NUMP = { dx: { min: -150, max: 250, empty: true }, dy: { min: -150, max: 250, empty: true }, fw: { min: 5, max: 280, empty: true }, rot: { min: -180, max: 180, empty: true } };
/* Wort zu einem Bibliotheksbild (geprüfte Zuordnung, sonst erstes Wort des Bildnamens) */
function wordForImg(src) { const f = String(src || '').startsWith('lib:') ? src.slice(4) : ''; if (!f) return ''; const P = (window.FolivaPools || {}).PICS || {}; const w = Object.keys(P).find(k => P[k] === f); if (w) return w.replace(/[^A-Za-zÄÖÜäöü]/g, ''); const it = BildUI.byFile(f); return it && it.n ? String(it.n).split(/[ ,]/)[0].replace(/[^A-Za-zÄÖÜäöü]/g, '') : ''; }
function bindFields(el, obj, isItem, target = () => obj) {
  bindFmt(el);
  FontUI.bind(el, (k, key) => change(() => {
    const o = target();
    if (isItem && (k === 'fontI' || k === 'fontC') && o.font) { const other = k === 'fontI' ? 'fontC' : 'fontI'; if (!o[other]) o[other] = o.font; delete o.font; }
    if (key) o[k] = key; else if (isItem) delete o[k]; else o[k] = '';
  }, null, { panel: true }));
  const prop = k => isItem ? T(obj.type).props.find(p => p.k === k) || {} : {};
  const after = (k) => { const p = prop(k); if (isItem && p.onSet) { try { p.onSet(obj); } catch (e) { } } if (isItem && p.fill) { if (p.k === 'lang' && T(obj.type)) { const th = T(obj.type).props.find(q => q.dyn); if (th) { const o = th.dyn(obj); if (!o.some(([a]) => a === obj.theme)) obj.theme = o[0] && o[0][0]; } } G.fill(obj); } if (isItem && p.regen) regen(obj); if (isItem) { if (k === 'points') obj.pointsAuto = false; else autoPoints(obj); const mts = [].concat((T(obj.type) && T(obj.type).modeTitles) || []); const mt = mts.find(m => m.prop === k); if (mt && mt.titles[obj[k] ?? ''] != null) { const def = (T(obj.type).make({}) || {}).title; const known = mts.flatMap(m => Object.values(m.titles)).filter(v => typeof v === 'string').concat(def ? [def] : []); const v = mt.titles[obj[k] ?? '']; const nt = typeof v === 'function' ? v(obj) : v; if (nt && (!obj.title || known.includes(obj.title))) obj.title = nt; } } };
  $$('[data-k]', el).forEach(inp => {
    const k = inp.dataset.k;
    if (inp.dataset.rt) {
      const se = isItem && obj.id ? document.querySelector(`#pages .it[data-id="${obj.id}"] [data-edit="${k}"]`) : null;
      const defBold = se ? (parseInt(getComputedStyle(se).fontWeight, 10) || 400) >= 600 : false; if (defBold) inp.classList.add('defb');
      RichField.bind(inp, { multi: !!inp.dataset.multi, defBold, onChange: m => { if (m === (target()[k] || '')) return; change(() => { target()[k] = m; after(k); }, 'rt' + k + (obj.id || '')); } });
      return;
    }
    if (inp.dataset.tog) inp.onchange = () => change(() => { const o = target(); o[k] = inp.checked; if (k === 'free') { delete o.dx; delete o.dy; } after(k); }, null, { panel: true });
    else if (inp.dataset.sel) inp.onchange = () => change(() => { target()[k] = inp.value; after(k); }, null, { panel: true });
    else if (inp.dataset.num) {
      const apply = final => { let v = inp.value === '' ? '' : +inp.value; const p = { ...(NUMP[k] || {}), ...prop(k) }; if (v !== '' && final) { if (p.min != null) v = Math.max(p.min, v); if (p.max != null) v = Math.min(p.max, v); inp.value = v; } if (v === '' && !p.empty && final) { inp.value = target()[k] ?? ''; return; } if (v === '' && !p.empty) return; change(() => { target()[k] = v; const wasErr = !!(obj.data && obj.data.error); after(k); if (isItem && (wasErr !== !!(obj.data && obj.data.error))) setTimeout(renderRight, 0); }, 'n:' + k); };
      inp.oninput = () => apply(false); inp.onchange = () => apply(true);
    } else inp.oninput = () => change(() => { target()[k] = inp.value; const wasErr = !!(obj.data && obj.data.error); after(k); if (isItem && (wasErr !== !!(obj.data && obj.data.error))) setTimeout(() => { const f = document.activeElement && document.activeElement.id; renderRight(); if (f) { const n = $('#' + f); if (n) { n.focus(); n.setSelectionRange && n.setSelectionRange(n.value.length, n.value.length); } } }, 0); }, 't:' + k);
  });
  /* Wort-und-Hinweis-Liste (Kreuzworträtsel): jede Änderung = eigene Wörter */
  $$('[data-wh]', el).forEach(box => {
    const K = box.dataset.wh;
    const collect = () => [...box.querySelectorAll('.whr')].map(r => { const w = (r.querySelector('.whw').value || '').replace(/ß/g, 'ss').replace(/[^A-Za-zÄÖÜäöü]/g, ''); const hi = r.querySelector('.whh'); const h = hi ? hi.value.replace(/\|/g, '/') : (r.dataset.himg || ''); return w || h ? `${w}|${h}` : ''; }).filter(Boolean).join('\n');
    const commit = (panel, keyBase) => { const wasPool = obj.source && obj.source !== 'eigene'; change(() => { obj[K] = collect(); if (wasPool) { obj.poolSrc = obj.source; obj.source = 'eigene'; } regen(obj); }, panel || wasPool ? null : keyBase, { panel: panel || wasPool }); if (wasPool) toast('Eigene Wörter – „Neu mischen“ ordnet sie neu im Gitter an.', 3000); };
    box.querySelectorAll('.whw,.whh').forEach(inp => { inp.oninput = () => { const pos = inp.selectionStart, cls = inp.className, i = inp.closest('.whr').dataset.i; const wasPool = obj.source && obj.source !== 'eigene'; commit(false, 'wh' + K + i + cls); if (wasPool) { const n = $(`#right [data-wh="${K}"] .whr[data-i="${i}"] .${cls}`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } } }; });
    box.querySelectorAll('[data-whrm]').forEach(b => b.onclick = () => { b.closest('.whr').remove(); commit(true); });
    box.querySelectorAll('[data-whnoimg]').forEach(b => b.onclick = () => { const r = b.closest('.whr'); delete r.dataset.himg; const sp = b.closest('.whimg'); sp.outerHTML = '<input type="text" class="whh" value="">'; commit(true); });
    box.querySelectorAll('[data-whimg]').forEach(b => b.onclick = async () => { const src = await BildUI.pick(); if (!src) return; const r = b.closest('.whr'); r.dataset.himg = 'img:' + (String(src).startsWith('lib:') ? src.slice(4) : src); const hi = r.querySelector('.whh'); if (hi) hi.remove(); const ww = r.querySelector('.whw'); if (!ww.value.trim()) { ww.value = wordForImg(src); } commit(true); });
    const add = async withImg => { let line = 'Wort|'; if (withImg) { const src = await BildUI.pick(); if (!src) return; const w = wordForImg(src); line = `${w || 'Wort'}|img:${String(src).startsWith('lib:') ? src.slice(4) : src}`; } const wasPool = obj.source && obj.source !== 'eigene'; change(() => { obj[K] = (String(obj[K] || '').trim() ? String(obj[K]).trim() + '\n' : '') + line; if (wasPool) obj.source = 'eigene'; regen(obj); }, null, { panel: true }); const ins = $$(`#right [data-wh="${K}"] .whw`); if (ins.length) { const l = ins[ins.length - 1]; l.focus(); l.select(); } };
    const a1 = box.querySelector('[data-whadd]'); if (a1) a1.onclick = () => add(false);
    const a2 = box.querySelector('[data-whaddimg]'); if (a2) a2.onclick = () => add(true);
  });
  $$('[data-clr]', el).forEach(b => b.onclick = () => change(() => { delete target()[b.dataset.clr]; }, null, { panel: true }));
  $$('[data-clrset]', el).forEach(b => b.onclick = () => change(() => { target()[b.dataset.clrset] = b.dataset.c; }, null, { panel: true }));
  $$('[data-seg]', el).forEach(sg => $$('button', sg).forEach(b => b.onclick = () => change(() => { target()[sg.dataset.seg] = b.dataset.num ? +b.dataset.v : b.dataset.v; after(sg.dataset.seg); }, null, { panel: true })));
  /* Antworten (Ankreuzaufgabe) */
  $$('[data-list="options"]', el).forEach(ol => {
    const K = ol.dataset.lk || 'options'; if (!Array.isArray(obj[K])) obj[K] = [];
    $$('[data-opt]', ol).forEach(i => i.oninput = () => change(() => { obj[K][+i.dataset.opt].t = i.value; }, 'opt' + K + i.dataset.opt));
    $$('[data-ok]', ol).forEach(b => b.onclick = () => change(() => { const o = obj[K][+b.dataset.ok]; o.ok = !o.ok; }, null, { panel: true }));
    $$('[data-rm]', ol).forEach(b => b.onclick = () => change(() => { obj[K].splice(+b.dataset.rm, 1); regen(obj); }, null, { panel: true }));
    $('[data-add]', ol).onclick = () => { change(() => { obj[K].push({ t: '', ok: false }); regen(obj); }, null, { panel: true }); const ins = $$(`[data-lk="${K}"] [data-opt]`, $('#right')); if (ins.length) ins[ins.length - 1].focus(); };
  });
  $$('[data-list="pairs"]', el).forEach(pl => {
    const K = pl.dataset.lk || 'pairs'; if (!Array.isArray(obj[K])) obj[K] = [];
    $$('[data-pl],[data-pr]', pl).forEach(i => i.oninput = () => change(() => { const idx = +(i.dataset.pl ?? i.dataset.pr); obj[K][idx][i.dataset.pl != null ? 'l' : 'r'] = i.value; regenLight(obj); }, 'pair' + K + (i.dataset.pl ?? 'r' + i.dataset.pr)));
    $$('[data-rm]', pl).forEach(b => b.onclick = () => change(() => { obj[K].splice(+b.dataset.rm, 1); regen(obj); }, null, { panel: true }));
    $('[data-add]', pl).onclick = () => { change(() => { obj[K].push({ l: '', r: '' }); regen(obj); }, null, { panel: true }); const ins = $$(`[data-lk="${K}"] [data-pl]`, $('#right')); if (ins.length) ins[ins.length - 1].focus(); };
    const ai = $('[data-addimg]', pl); if (ai) ai.onclick = async () => { const src = await BildUI.pick(); if (!src) return; const v = String(src).startsWith('lib:') ? src.slice(4) : src; const f = String(src).startsWith('lib:') ? BildUI.byFile(src.slice(4)) : null; change(() => { obj[K].push({ l: 'img:' + v, r: f ? f.n : '' }); regen(obj); }, null, { panel: true }); };
  });
  const lbl = $('[data-list="labels"]', el);
  if (lbl) {
    if (!Array.isArray(obj.labels)) obj.labels = [];
    $$('[data-lt]', lbl).forEach(i => i.oninput = () => change(() => { obj.labels[+i.dataset.lt].t = i.value; regenLight(obj); }, 'lt' + i.dataset.lt));
    $$('[data-lx],[data-ly]', lbl).forEach(i => i.onchange = () => change(() => { const k = i.dataset.lx != null ? 'x' : 'y'; obj.labels[+(i.dataset.lx ?? i.dataset.ly)][k] = Math.max(0, Math.min(100, +i.value || 0)); }, null, { panel: true }));
    $$('[data-rm]', lbl).forEach(b => b.onclick = () => change(() => { obj.labels.splice(+b.dataset.rm, 1); regen(obj); }, null, { panel: true }));
    const pv = $('[data-lbprev]', el); if (pv) pv.onclick = e => { const r = pv.querySelector('img').getBoundingClientRect(); const x = Math.round((e.clientX - r.left) / r.width * 100), y = Math.round((e.clientY - r.top) / r.height * 100); if (x < 0 || x > 100 || y < 0 || y > 100) return; change(() => { obj.labels.push({ t: '', x, y }); regen(obj); }, null, { panel: true }); const ins = $$('[data-lt]', $('#right')); if (ins.length) ins[ins.length - 1].focus(); };
  }
  $$('[data-cell]', el).forEach(i => i.oninput = () => change(() => { const [r, k] = i.dataset.cell.split(',').map(Number); obj.cells[r][k] = i.value; }, 'cell' + i.dataset.cell));
  $$('[data-cadd]', el).forEach(b => b.onclick = () => change(() => { const c = obj.cells; if (b.dataset.cadd === 'row') c.push(Array((c[0] || ['']).length).fill('')); else c.forEach(r => r.push('')); }, null, { panel: true }));
  $$('[data-cdel]', el).forEach(b => b.onclick = () => change(() => { const c = obj.cells; if (b.dataset.cdel === 'row') { if (c.length > 1) c.pop(); } else if ((c[0] || []).length > 1) c.forEach(r => r.pop()); }, null, { panel: true }));
  const ib = $('[data-img]', el); if (ib) ib.onclick = async () => {
    const src = await BildUI.pick(); if (!src) return;
    change(() => { obj.src = src; if (!obj.caption) obj.caption = ''; }, null, { panel: true });
  };
}
/* große Bilder verkleinern (max. 1800 px), damit Materialien und Sicherungen handlich bleiben */
function shrinkImage(url) {
  return new Promise(res => { const img = new Image(); img.onload = () => { const max = 1800, s = Math.min(1, max / Math.max(img.width, img.height)); if (s >= 1 && url.length < 2.5e6) return res(url); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); const x = c.getContext('2d'); const png = /^data:image\/(png|gif)/.test(url); if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); } x.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL(png ? 'image/png' : 'image/jpeg', .88)); }; img.onerror = () => res(url); img.src = url; });
}
function renderDocPanel(el) {
  const d = cur, s = d.settings; const SF = RD.sheetFonts(s); const L = k => RD.fontLabel(k);
  const probe = d.kind === 'probe';
  const fields = Array.isArray(s.headFields) && s.headFields.length ? s.headFields : ['name', 'datum', 'klasse'];
  const missing = RD.usedFonts(d).filter(k => !FontUI.available(k));
  el.innerHTML = `<div class="sideHead"><h2><span>Material</span></h2><button class="collapse" id="hideR" title="Einstellungen ausblenden" aria-label="Einstellungen ausblenden">${ICO.sideR}</button></div><div class="props">
    <p class="hint" style="margin:0 0 12px">Einen Baustein auf dem Blatt anklicken, um ihn einzustellen.</p>
    ${d.items.some(x => +x.dx || +x.dy) ? `<div class="hint" style="margin:0 0 12px;display:flex;gap:8px;align-items:center">${d.items.filter(x => +x.dx || +x.dy).length} Baustein(e) sind von Hand verschoben. <button class="tb" id="resetAllPos" type="button">Alle Positionen zurücksetzen</button></div>` : ''}
    ${missing.length ? `<div class="genErr" role="alert">Auf diesem Computer fehlt: ${missing.map(k => '„' + esc(L(k)) + '“').join(', ')}. Ersatzweise wird die Standardschrift gezeigt. <button class="tb" id="fixFonts" type="button">Ersatz wählen …</button></div>` : ''}
    <div class="sec first">Einordnen</div>
    <label class="field"><span>Fach</span><input type="text" data-m="subject" value="${esc(d.subject)}" list="subjList" placeholder="z. B. Mathematik"></label><datalist id="subjList">${SUBJECTS.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
    <div class="field"><span>Jahrgangsstufe(n)</span><div class="chipsG" id="grades">${Array.from({ length: 13 }, (_, i) => `<button type="button" data-g="${i + 1}" aria-pressed="${d.grades.includes(i + 1)}">${i + 1}</button>`).join('')}</div></div>
    <label class="field"><span>Thema</span><input type="text" data-m="topic" value="${esc(d.topic)}" placeholder="z. B. Schriftliche Subtraktion"></label>
    <label class="field"><span>Schlagwörter</span><input type="text" data-m="tags" value="${esc(d.tags)}" placeholder="z. B. Wiederholung, Förderung"></label>
    ${probe ? `<div class="sec">Leistungsnachweis</div>
    <label class="field"><span>Art</span><select id="assessSel">${RD.ASSESS.map(a => `<option ${a === RD.assessLabel(d) ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
    ${fieldHTML({ k: 'assessNo', label: 'Nummer (z. B. 1 für „Schulaufgabe Nr. 1“, leer = ohne)', type: 'text' }, s.assessNo || '')}
    ${fieldHTML({ k: 'pointsTable', label: 'Punktetabelle je Aufgabe im Kopf', type: 'toggle' }, s.pointsTable !== false)}
    ${fieldHTML({ k: 'gradeKey', label: 'Notenschlüssel zum Ausfüllen', type: 'toggle' }, !!s.gradeKey)}
    ${fieldHTML({ k: 'pointsCol', label: 'Punktekästchen rechts je Aufgabe (erreicht / möglich)', type: 'toggle' }, !!s.pointsCol)}
    ${fieldHTML({ k: 'sign', label: 'Unterschrift Erziehungsberechtigte am Ende', type: 'toggle' }, !!s.sign)}
    <p class="hint">Gesamtpunkte: <b>${String(RD.totalPoints(d)).replace('.', ',')}</b> · Foliva berechnet keine Noten; den Maßstab legst du fest.</p>
    <div class="btnCol"><button class="tb" type="button" id="ptsSuggest">Punkte für alle Aufgaben vorschlagen</button></div>
    <p class="hint">Vorschlag: ½ Punkt je einfacher Lücke, mehr für aufwendigere Teile (z. B. Sachaufgabe 3 P., schriftliche Division 2 P. je Aufgabe). Neue Aufgaben bekommen ihn automatisch; er passt sich an, bis du die Punkte selbst änderst.</p>` : ''}
    <div class="sec">Bilder auf dem Blatt</div>
    ${fieldHTML({ k: 'imgLook', label: 'Darstellung aller Bilder', type: 'seg', opts: [['farbig', 'farbig'], ['sw', 'schwarz-weiß'], ['umriss', 'Umriss zum Ausmalen']] }, s.imgLook || 'farbig')}
    <div class="sec">Werkzeuge</div>
    <div class="linkrow" style="margin:0 0 10px"><button class="tb" type="button" id="toolFind">Suchen und Ersetzen …</button><button class="tb" type="button" id="toolWords">Wortfinder …</button><button class="tb" type="button" data-bibopen="new">Text-Bibliothek …</button><button class="tb" type="button" data-lwedit>Lernwörter der Schule …</button></div>
    <div class="sec">Schriften</div>
    ${fieldHTML({ k: 'font', label: 'Grundschrift des Blatts', type: 'font' }, SF.base)}
    ${fieldHTML({ k: 'fontI', label: 'Arbeitsanweisungen', type: 'font', inheritLabel: 'Wie das Blatt: ' + L(SF.base) }, s.fontI || '')}
    ${fieldHTML({ k: 'fontC', label: 'Aufgabeninhalte (Wörter, Zahlen, Texte)', type: 'font', inheritLabel: 'Wie das Blatt: ' + L(SF.base) }, s.fontC || '')}
    ${fieldHTML({ k: 'fontT', label: 'Titel und Kopfzeile', type: 'font', inheritLabel: 'Wie die Anweisungen: ' + L(SF.fI) }, s.fontT || '')}
    ${fieldHTML({ k: 'size', label: 'Schriftgröße (pt)', type: 'number', min: 9, max: 24, step: .5 }, s.size)}
    <div class="linkrow" style="margin:-2px 0 10px"><button class="tb" type="button" id="prGS">Voreinstellung Grundschule</button><button class="tb" type="button" id="prSek">Voreinstellung ab Kl. 5</button></div>
    <div class="sec">Seite gestalten</div>
    ${layoutFieldHTML(s)}
    <div class="btnCol" style="margin:-2px 0 12px"><button class="tb" type="button" id="headBtn">Kopf und Titel einstellen …</button><button class="tb ghost" type="button" id="hbBtn">Kopfzeile frei gestalten (erweitert) …</button><button class="tb" type="button" id="laySave">Dieses Layout speichern …</button></div>
    ${fieldHTML({ k: 'orient', label: 'Format', type: 'seg', opts: [['hoch', 'A4 hoch'], ['quer', 'A4 quer']] }, s.orient || 'hoch')}
    ${fieldHTML({ k: 'margin', label: 'Seitenränder', type: 'seg', opts: [['schmal', 'schmal'], ['normal', 'normal'], ['breit', 'breit']] }, s.margin || 'normal')}
    ${fieldHTML({ k: 'frame', label: 'Seitenrahmen', type: 'select', opts: RD.FRAMES }, s.frame || 'none')}
    ${fieldHTML({ k: 'numbering', label: 'Aufgaben nummerieren', type: 'toggle' }, s.numbering !== false)}
    ${fieldHTML({ k: 'footText', label: 'Text in der Fußzeile (optional)', type: 'text' }, s.footText || '')}
    ${fieldHTML({ k: 'pnFmt', label: 'Seitenzahlen', type: 'select', opts: RD.PN_FORMATS }, s.pnFmt || '')}
    ${fieldHTML({ k: 'brandFoot', label: '„© 2026 theisapps“ in der Fußzeile', type: 'toggle' }, !!s.brandFoot)}
    ${fieldHTML({ k: 'solColor', label: 'Farbe der Lösungen', type: 'select', opts: SOLCOLORS }, s.solColor)}
    <div class="sec">Weiteres</div>
    <label class="field"><span>Hinweise für Lehrkräfte (werden nicht gedruckt)</span><textarea data-m="notes" rows="3" placeholder="z. B. Differenzierung, Material, Zeitbedarf">${esc(d.notes || '')}</textarea></label>
    <div class="btnCol"><button class="tb" id="tplBtn">Als eigene Vorlage speichern …</button><button class="tb" id="parBtn">${ICO.dice} Parallelversion (B) mit neuen Zahlen</button><button class="tb" id="verBtn">Versionen …</button><button class="tb" id="dupBtn">${ICO.copy} Duplizieren</button><button class="tb" id="expBtn">Exportieren …</button><button class="tb" id="trBtn" style="color:var(--bad)">${ICO.trash} In den Papierkorb</button></div>
    <p class="hint">Angelegt ${fmtDate(d.created)} · bearbeitet ${fmtDate(d.modified)}</p></div>`;
  $('#hideR').onclick = () => { UI.right = false; saveUI(); applySides(); };
  $$('[data-m]', el).forEach(i => i.oninput = () => change(() => { d[i.dataset.m] = i.value; }, 'm:' + i.dataset.m));
  $$('#grades button', el).forEach(b => b.onclick = () => change(() => { const g = +b.dataset.g; d.grades = d.grades.includes(g) ? d.grades.filter(x => x !== g) : [...d.grades, g].sort((a, b) => a - b); }, null, { panel: true }));
  bindHeadFields(el, d);
  const as = $('#assessSel', el); if (as) as.onchange = () => change(() => { const old = RD.assessLabel(d); d.assess = as.value; if (d.title === 'Neue ' + old) d.title = 'Neue ' + as.value; }, null, { panel: true, top: true });
  bindFields(el, d, false, () => d.settings);
  $('#prGS').onclick = () => applyPreset('primar'); $('#prSek').onclick = () => applyPreset('sek');
  bindLayoutField(el); $('#headBtn').onclick = () => selectZone('head'); $('#hbBtn').onclick = headBuilderDialog; $('#laySave').onclick = saveLayoutDialog; $('#tplBtn').onclick = saveTemplateDialog;
  const ff = $('#fixFonts', el); if (ff) ff.onclick = () => replaceFontsDialog(missing);
  const tf = $('#toolFind', el); if (tf) tf.onclick = () => findReplaceDialog();
  const tw = $('#toolWords', el); if (tw) tw.onclick = () => wordFinderDialog();
  const psg = $('#ptsSuggest', el); if (psg) psg.onclick = () => { let n = 0; change(() => cur.items.forEach(it => { if (!RD.TASK.has(it.type)) return; const p = suggestPoints(it, cur); if (p != null) { it.points = p; it.pointsAuto = true; n++; } }), null, { panel: true }); toast(`Punkte für ${n} Aufgaben vorgeschlagen – Gesamt: ${String(RD.totalPoints(cur)).replace('.', ',')}. Rückgängig mit ⌘Z.`, 3500); };
  const rap = $('#resetAllPos', el); if (rap) rap.onclick = () => { change(() => cur.items.forEach(x => { delete x.dx; delete x.dy; }), null, { panel: true }); toast('Alle Bausteine stehen wieder an ihrem Platz. Rückgängig mit ⌘Z.', 3000); };
  $('#parBtn').onclick = async () => { await flush(); parallelDoc(d); };
  $('#verBtn').onclick = versionsDialog; $('#dupBtn').onclick = async () => { await flush(); duplicateDoc(d); };
  $('#expBtn').onclick = () => exportDocs([d]); $('#trBtn').onclick = () => trashDoc(d);
}
/* Fehlende Schrift bewusst ersetzen (nie unbemerkt) */
async function replaceFontsDialog(missing) {
  const choice = {};
  await dialog({ title: 'Fehlende Schriften ersetzen', html: `<p>Diese Schriften sind in dem Material gewählt, aber auf diesem Computer nicht installiert. Wähle je eine Ersatzschrift – Foliva ändert dann alle Stellen im Material. (Rückgängig ist möglich.)</p>
    ${missing.map((k, i) => `<div class="field"><span>„${esc(RD.fontLabel(k))}“ ersetzen durch</span>${FontUI.button('rf' + i, '', { k: String(i), inheritLabel: 'Nicht ersetzen' })}</div>`).join('')}`,
    buttons: [{ label: 'Abbrechen', value: false }, { label: 'Ersetzen', primary: true, value: true }],
    onOpen: dl => { const pick = (k, key, btn) => { choice[missing[+k]] = key; btn.outerHTML = FontUI.button(btn.id, key, { k, inheritLabel: 'Nicht ersetzen' }); FontUI.bind(dl, pick); }; FontUI.bind(dl, pick); } }).then(ok => {
      if (!ok) return; const map = Object.fromEntries(Object.entries(choice).filter(([a, b]) => b));
      if (!Object.keys(map).length) return;
      change(() => {
        const s = cur.settings; ['font', 'fontI', 'fontC', 'fontT'].forEach(k => { if (map[s[k]]) s[k] = map[s[k]]; });
        const swapTxt = t => typeof t === 'string' ? t.replace(/\{\{([^|{}\n]{1,90})\|/g, (m, f) => { const k = RD.fontKeyFromName(f); if (!map[k]) return m; const n = RD.FONTS[map[k]] ? map[k] : RD.sysName(map[k]); return `{{${n}|`; }) : t;
        for (const it of cur.items) { ['font', 'fontI', 'fontC', 'pfont'].forEach(k => { if (map[it[k]]) it[k] = map[it[k]]; }); ['text', 'title', 'question', 'caption'].forEach(k => { if (it[k]) it[k] = swapTxt(it[k]); }); }
        cur.title = swapTxt(cur.title);
      }, null, { panel: true });
      toast('Schriften ersetzt.');
    });
}

/* ---------- Schriften ---------- */
/* Installierte Schriften (Liste über die Plattform) im Hintergrund laden; danach Bedienfelder auffrischen */
function detectFonts() { FontUI.loadLocal(true).then(() => { if (view === 'editor' && cur) renderRight(); }).catch(() => {}); }

/* ---------- Ganzes Blatt neu erzeugen ---------- */
async function regenAllDialog() {
  if (!cur) return;
  const n = cur.items.filter(canNew).length;
  if (!n) return toast('Auf diesem Blatt gibt es keine Bausteine, die neu erzeugt werden können.', 3600);
  const ok = await ask({ title: 'Ganzes Blatt neu erzeugen?', ok: 'Neu erzeugen', html: `<p>${n} Baustein${n === 1 ? '' : 'e'} bekomm${n === 1 ? 't' : 'en'} neue, zufällige Aufgaben nach ihren Einstellungen. Bausteine mit eigenen Inhalten werden nur neu gemischt; Texte, Überschriften und Bilder bleiben.</p><p class="hint">Vorher wird eine Version gesichert; außerdem geht es mit Rückgängig zurück.</p>` });
  if (!ok) return;
  try { await flush(); await N.snapshot(cur, 'vor Neu erzeugen'); } catch (e) {}
  change(() => { cur.items.filter(canNew).forEach(renew); }, null, { panel: true });
  toast('Neue Aufgaben erzeugt.');
}

/* =====================================================================
   Dialoge
   ===================================================================== */
function dialog({ title, html, wide, buttons = [], onOpen, closeLabel = 'Schließen' }) {
  return new Promise(res => {
    const d = document.createElement('dialog'); if (wide) d.className = 'wide';
    d.innerHTML = `<div class="sheethead"><span></span><h2>${esc(title)}</h2><span><button class="tbtn" data-x>${esc(closeLabel)}</button></span></div><div class="dlgBody">${html}${buttons.length ? `<div class="dlgBtns">${buttons.map((b, i) => `<button class="tb ${b.primary ? 'primary' : ''}" data-b="${i}" ${b.danger ? 'style="background:var(--bad);border-color:var(--bad);color:#fff"' : ''}>${esc(b.label)}</button>`).join('')}</div>` : ''}</div>`;
    document.body.appendChild(d); d.showModal();
    let done = false; const close = v => { if (done) return; done = true; d.close(); d.remove(); res(v); };
    d.querySelector('[data-x]').onclick = () => close(null); d.addEventListener('cancel', e => { e.preventDefault(); close(null); });
    $$('[data-b]', d).forEach(b => b.onclick = () => close(buttons[+b.dataset.b].value !== undefined ? buttons[+b.dataset.b].value : true));
    if (onOpen) onOpen(d, close);
  });
}
const ask = ({ title, html, ok = 'OK', danger }) => dialog({ title, html, closeLabel: 'Abbrechen', buttons: [{ label: 'Abbrechen', value: false }, { label: ok, primary: !danger, danger, value: true }] });

/* Gruppe B: gleiche Aufgaben, neue Zahlen. Immer dieselbe B-Fassung (Startwert aus A abgeleitet) – ein zweiter Druck passt zur ersten Lösung. */
const seedB = s => ((Math.abs(Math.floor(+s || 1)) * 7919 + 104729) % 2147483629) + 1;
function variantB(d) {
  const b = JSON.parse(JSON.stringify(d));
  b.items.forEach(it => { if (!abItem(it)) return; it.seed = seedB(it.seed); if (['rechnen', 'generator'].includes(it.source)) G.fill(it); regen(it); });
  return b;
}
/* B betrifft Rechenaufgaben (alle Mathe-Bausteine und „Rechnungen“ in anderen Bausteinen); Texte und Wörter bleiben gleich */
const abItem = it => { const ty = T(it.type); if (!ty) return false; if (['rechnen', 'generator'].includes(it.source)) return !!(ty.gen || G.FILL[it.type]); return !!ty.gen && /^(m_|mathe)/.test(ty.group || '') && ty.props.some(p => p.regen) && it.pform !== 'eigene'; };
const canAB = d => d.items.some(abItem);
async function outputHTMLAB(d, which) {
  const b = variantB(d); const parts = [];
  const pa = await paginate(d, { variant: 'A' }), pb = await paginate(b, { variant: 'B' });
  if (which !== 'loesung') parts.push(pagesHTML(d, pa, false), pagesHTML(b, pb, false));
  if (which !== 'blatt') parts.push(pagesHTML(d, await paginate(d, { variant: 'A' }), true), pagesHTML(b, await paginate(b, { variant: 'B' }), true));
  return parts.join('');
}
async function outputDialog(mode) {
  await flush();
  const abOk = canAB(cur); let ab = abOk && !!UI.ab;
  /* Hinweis auf Bausteine, denen noch das Bild fehlt (auf dem Blatt bleibt sonst nur der leere Rahmen) */
  const noImg = []; { let n = 0; const s = cur.settings || {}; cur.items.forEach(it => { const ty = T(it.type); const num = RD.TASK && RD.TASK.has ? (RD.TASK.has(it.type) && s.numbering !== false && it.numbered !== false && !(it.type === 'image' && !(it.title || '').trim()) ? ++n : 0) : 0; if ((it.type === 'image' || it.type === 'label') && !it.src) noImg.push(num ? 'Aufgabe ' + num : (ty ? ty.name : it.type)); }); }
  const which = await dialog({ title: mode === 'pdf' ? 'Als PDF speichern' : 'Drucken', html: `<p>Was soll ${mode === 'pdf' ? 'ins PDF' : 'gedruckt werden'}?</p>${noImg.length ? `<p class="hint warnHint">Noch ohne Bild: ${esc(noImg.join(', '))}. Dort erscheint nur ein leerer Rahmen.</p>` : ''}${abOk ? `<label class="abRow"><input type="checkbox" id="abChk" ${ab ? 'checked' : ''}><span><b>Gruppe A und B</b><small>Zwei Fassungen mit anderen Zahlen – gleiche Aufgaben, gleiche Schwierigkeit. Oben rechts steht A bzw. B; jede Fassung bekommt ihre eigene Lösung.</small></span></label>` : ''}`,
    buttons: [{ label: 'Arbeitsblatt', value: 'blatt', primary: true }, { label: 'Lösungsblatt', value: 'loesung' }, { label: 'Beides', value: 'beides' }],
    onOpen: dl => { const c = $('#abChk', dl); if (c) c.onchange = () => { ab = c.checked; UI.ab = ab; saveUI(); }; } });
  if (!which) return;
  toast(mode === 'pdf' ? 'PDF wird erstellt …' : 'Druck wird vorbereitet …');
  const html = (RD.dims(cur).q ? '<style>@page{size:A4 landscape}</style>' : '') + (ab ? await outputHTMLAB(cur, which) : await outputHTML(cur, which));
  const name = (cur.title || 'Material') + (ab ? ' – Gruppe A und B' : '') + (which === 'loesung' ? ' – Lösung' : which === 'beides' ? ' – mit Lösung' : '');
  try { const r = mode === 'pdf' ? await N.pdf(name, html) : await N.print(html); if (mode === 'pdf' && r && r.ok) toast('Gespeichert: ' + r.name, 3200); }
  catch (e) { toast('Fehler: ' + e.message, 5000); }
}

async function versionsDialog() {
  await flush();
  const list = await N.versions(cur.id);
  dialog({ title: 'Versionen', wide: true, html: `<p class="hint" style="margin-top:0">Foliva hebt automatisch Zwischenstände auf (die letzten 24 und einen je Tag für 30 Tage). Benannte Versionen bleiben dauerhaft.</p>
      <div class="inline" style="margin:10px 0 14px"><input type="text" id="vName" placeholder="Name, z. B. „Probe vor Druck“" style="flex:1;border:1px solid var(--hairline);border-radius:10px;padding:8px 11px;background:var(--panel-2)"><button class="tb primary" id="vSave">Version jetzt sichern</button></div>
      <div class="box2">${list.length ? list.map(v => `<div class="verRow" data-f="${esc(v.file)}"><b>${v.date.split('-').reverse().join('.')} · ${v.time}</b><span>${v.label ? '„' + esc(v.label) + '“' : 'automatisch'}</span><button class="tb" data-copy>Als Kopie öffnen</button><button class="tb" data-restore>Wiederherstellen</button></div>`).join('') : '<div class="verRow"><span>Noch keine Versionen – die erste entsteht beim nächsten Speichern.</span></div>'}</div>`,
    onOpen: (dl, close) => {
      $('#vSave', dl).onclick = async () => { await flush(); await N.snapshot(cur, $('#vName', dl).value || 'gesichert'); close(); toast('Version gesichert.'); };
      $$('.verRow[data-f]', dl).forEach(r => {
        r.querySelector('[data-copy]').onclick = async () => { const v = migrate(await N.version(cur.id, r.dataset.f)); const c = cloneDoc(v, v.title + ' (Version ' + r.querySelector('b').textContent + ')'); docs.set(c.id, c); markDirty(c); await flush(); close(); openDoc(c); };
        r.querySelector('[data-restore]').onclick = async () => {
          const v = migrate(await N.version(cur.id, r.dataset.f)); await flush(); await N.snapshot(cur, 'vor Wiederherstellung');
          change(() => { Object.assign(cur, { title: v.title, kind: v.kind, subject: v.subject, grades: v.grades, topic: v.topic, tags: v.tags, settings: v.settings, items: v.items }); }, null, { panel: true, top: true });
          close(); toast('Version wiederhergestellt. Der vorherige Stand ist als Version gesichert.', 3600);
        };
      });
    } });
}

async function probeDialog() {
  const render = (dl) => {
    const tasks = cur.items.filter(it => RD.TASK.has(it.type));
    $('#pList', dl).innerHTML = tasks.length ? tasks.map((it, i) => `<div class="pRow" data-id="${it.id}"><span class="n">${i + 1}.</span><span><b>${esc(it.title || T(it.type).name)}</b><small>${esc(T(it.type).name)}</small></span><label><input type="number" min="0" max="100" step=".5" value="${esc(it.points ?? '')}" aria-label="Punkte"></label><span style="display:flex;gap:2px"><button class="collapse" data-up aria-label="Nach oben">${ICO.up}</button><button class="collapse" data-dn aria-label="Nach unten">${ICO.down}</button><button class="collapse" data-ed aria-label="Bearbeiten" title="Im Editor bearbeiten">✎</button></span></div>`).join('') : '<p class="hint">Noch keine Aufgaben. Unten eine Aufgabe hinzufügen.</p>';
    $('#pSum', dl).textContent = 'Gesamt: ' + String(RD.totalPoints(cur)).replace('.', ',') + ' Punkte';
    $$('.pRow', dl).forEach(r => {
      const it = cur.items.find(x => x.id === r.dataset.id);
      r.querySelector('input').oninput = e => { change(() => { it.points = e.target.value === '' ? '' : +e.target.value; }, 'pp' + it.id); $('#pSum', dl).textContent = 'Gesamt: ' + String(RD.totalPoints(cur)).replace('.', ',') + ' Punkte'; };
      const mv = dir => { const list = cur.items.filter(x => RD.TASK.has(x.type)); const k = list.indexOf(it), other = list[k + dir]; if (!other) return; change(() => { const a = cur.items.indexOf(it), b = cur.items.indexOf(other); [cur.items[a], cur.items[b]] = [cur.items[b], cur.items[a]]; }); render(dl); };
      r.querySelector('[data-up]').onclick = () => mv(-1); r.querySelector('[data-dn]').onclick = () => mv(1);
      r.querySelector('[data-ed]').onclick = () => { dl.close(); dl.remove(); sel = it.id; renderRight(); renderPages(); scrollToSel = true; };
    });
  };
  const types = Object.keys(C.TYPES).filter(k => RD.TASK.has(k));
  await dialog({ title: 'Probe zusammenstellen', wide: true, closeLabel: 'Fertig', html: `
    <p class="hint" style="margin-top:0">1 · Aufgaben und Punkte festlegen und ordnen &nbsp; 2 · Kopf prüfen &nbsp; 3 · Ausgabe – alles bleibt mit dem Editor verbunden.</p>
    <div class="steplist" id="pList"></div><div class="sum" id="pSum"></div>
    <div class="inline" style="margin-top:12px"><select id="pAdd" style="flex:1;border:1px solid var(--hairline);border-radius:10px;padding:8px 10px;background:var(--panel-2)">${types.map(k => `<option value="${k}">${esc(T(k).name)}</option>`).join('')}</select><button class="tb" id="pAddB">Aufgabe hinzufügen</button></div>
    <div class="subhead">Kopf der Probe</div>
    <label class="trow"><span>Name · Datum · Klasse</span><input type="checkbox" class="sw" id="pHead" ${cur.settings.header !== false ? 'checked' : ''}></label>
    <label class="trow"><span>Titel „${esc(cur.title)}“ oben</span><input type="checkbox" class="sw" id="pTitle" ${cur.settings.showTitle !== false ? 'checked' : ''}></label>
    <p class="hint">Oben auf der Probe steht „Punkte: ___ von …“. Foliva berechnet keine Note – Bewertungsmaßstab und Notenschlüssel legst du fest.</p>
    <div class="dlgBtns"><button class="tb" id="pSol">Lösungsblatt ansehen</button><button class="tb" id="pPdf">${ICO.pdf} PDF speichern …</button></div>`,
    onOpen: (dl, close) => {
      render(dl);
      $('#pAddB', dl).onclick = () => { insertItem($('#pAdd', dl).value, cur.items.length); render(dl); };
      $('#pHead', dl).onchange = e => change(() => { cur.settings.header = e.target.checked; }, null, { panel: true });
      $('#pTitle', dl).onchange = e => change(() => { cur.settings.showTitle = e.target.checked; }, null, { panel: true });
      $('#pSol', dl).onclick = () => { close(); if (!UI.sol) toggleSol(); };
      $('#pPdf', dl).onclick = () => { close(); outputDialog('pdf'); };
    } });
}

async function exportDocs(list) {
  await flush();
  const r = await N.exportDocs(list, list.length === 1 ? list[0].title || 'Material' : 'Foliva-Materialien');
  if (r && r.ok) toast('Exportiert: ' + r.name, 3200);
}
/* Material oder Sicherung einlesen: nie überschreiben – Abweichendes kommt als Kopie dazu */
async function importFlow(pre) {
  const r = pre || await N.pickArchive(); if (!r) return;
  if (!r.ok) return dialog({ title: 'Datei kann nicht gelesen werden', html: `<p>${esc(r.name)}: ${esc(r.error)}</p><p class="hint">Vorhandene Materialien wurden nicht verändert.</p>` });
  const content = d => JSON.stringify({ ...d, rev: 0, modified: '', fav: false });
  const plan = r.docs.map(d => { const ex = docs.get(d.id); return { d, kind: !ex ? 'neu' : content(ex) === content(d) ? 'gleich' : 'anders' }; });
  const n = k => plan.filter(p => p.kind === k).length;
  const ok = await ask({ title: r.kind === 'material' ? 'Material einlesen' : 'Aus Sicherung einlesen', ok: 'Übernehmen', html: `
    <p><b>${esc(r.name)}</b>${r.created ? ' vom ' + fmtDate(r.created) : ''}: ${r.docs.length} Material${r.docs.length === 1 ? '' : 'ien'}.</p>
    <ul><li>${n('neu')} neu – werden hinzugefügt</li><li>${n('anders')} mit anderem Stand als hier – kommen als <b>Kopie</b> dazu, dein jetziger Stand bleibt</li><li>${n('gleich')} schon genau so vorhanden – werden übersprungen</li></ul>
    <p class="hint">Es wird nichts überschrieben oder gelöscht.</p>` });
  if (!ok) return;
  let added = 0;
  for (const p of plan) {
    if (p.kind === 'gleich') continue;
    const d = migrate(JSON.parse(JSON.stringify(p.d)));
    if (p.kind === 'anders') { d.id = newDocId(); d.title = (d.title || 'Material') + ' (eingelesen)'; }
    d.rev = 0; docs.set(d.id, d); markDirty(d); added++;
  }
  await flush(); toast(added ? `${added} Material${added === 1 ? '' : 'ien'} übernommen.` : 'Nichts Neues gefunden.', 3200);
  if (view === 'library') renderLibrary();
}

async function backupsDialog() {
  await flush();
  const st = ST = await N.backupStatus(); const list = await N.backupList();
  const dot = (ok, err) => err ? 'bad' : ok ? '' : 'no';
  dialog({ title: 'Sicherungen und Geräte', wide: true, html: `
    <div class="box2">
      <div class="stat2"><i class="d2"></i><div><b>Arbeitsstand: automatisch gespeichert</b><small>Jede Änderung wird sofort geprüft auf diesem Computer gespeichert (mit vorherigem Stand als Rückfallebene).<br><code style="font-size:11.5px">${esc(st.dataDir)}</code></small></div></div>
      <div class="stat2"><i class="d2 ${dot(st.lastLocal, st.lastLocalError)}"></i><div><b>Sicherung auf diesem Computer</b><small>${st.lastLocalError ? 'Fehler: ' + esc(st.lastLocalError) : st.lastLocal ? 'Zuletzt ' + fmtDate(st.lastLocal) : 'Noch keine'} · automatisch alle 10 Minuten bei Änderungen, beim Beenden und vor Updates</small></div></div>
      <div class="stat2"><i class="d2 ${dot(st.lastExternal, st.lastExternalError)}"></i><div><b>Sicherungsordner ${st.backupDir ? '' : '(empfohlen)'}</b><small>${st.backupDir ? esc(st.backupDir) + '<br>' + (st.lastExternalError ? '<b style="color:var(--bad)">Fehler: ' + esc(st.lastExternalError) + '</b>' : st.lastExternal ? 'Zuletzt ' + fmtDate(st.lastExternal) : 'Noch keine') : 'Noch nicht gewählt. Ein Ordner auf USB-Stick, externer Festplatte oder in deinem Cloud-Ordner schützt auch, wenn dieser Computer ausfällt.'}</small>
        <div class="linkrow"><button class="tb" id="bDir">${st.backupDir ? 'Ordner ändern …' : 'Ordner wählen …'}</button>${st.backupDir ? '<button class="tb" id="bOpenX">Ordner zeigen</button><button class="tb ghost" id="bClear">Nicht mehr verwenden</button>' : ''}</div></div></div>
    </div>
    <div class="linkrow" style="margin-top:12px"><button class="tb primary" id="bNow">Jetzt sichern</button><button class="tb" id="bOpen">Lokale Sicherungen zeigen</button><button class="tb" id="bPick">Sicherung oder Material einlesen …</button></div>
    <div class="subhead">Letzte Sicherungen</div>
    <div class="box2">${list.slice(0, 8).map(b => `<div class="verRow"><b>${fmtDate(b.time)}</b><span>${esc(b.where)} · ${(b.size / 1024).toFixed(0)} KB</span><button class="tb" data-file="${esc(b.path)}">Einlesen …</button></div>`).join('') || '<div class="verRow"><span>Noch keine Sicherung.</span></div>'}</div>
    <div class="subhead">Anderes Gerät</div>
    <p class="hint" style="margin-top:0">Jetzt: Materialien exportieren und auf dem anderen Gerät einlesen, oder eine Sicherung aus dem Sicherungsordner einlesen – Abweichendes kommt immer als Kopie dazu.<br><span class="plan">Geplant</span> Austauschordner (z. B. OneDrive, Google Drive, iCloud) mit automatischem Bereitstellen neuer Stände zwischen deinen Geräten.</p>`,
    onOpen: (dl, close) => {
      $('#bDir', dl).onclick = async () => { ST = await N.chooseBackupDir(); close(); backupsDialog(); };
      const x = $('#bClear', dl); if (x) x.onclick = async () => { ST = await N.clearBackupDir(); close(); backupsDialog(); };
      const ox = $('#bOpenX', dl); if (ox) ox.onclick = () => N.openBackupDir('external');
      $('#bOpen', dl).onclick = () => N.openBackupDir('local');
      $('#bNow', dl).onclick = async () => { const r = await N.backupNow(); ST = r.status; toast(r.ok ? `Gesichert: ${r.count} Materialien${r.external ? ' (auch im Sicherungsordner)' : ''}.` : 'Sicherung fehlgeschlagen: ' + (r.localError || r.externalError), 4200); close(); backupsDialog(); };
      $('#bPick', dl).onclick = () => { close(); importFlow(); };
      $$('[data-file]', dl).forEach(b => b.onclick = async () => { close(); importFlow(await N.readArchive(b.dataset.file)); });
    } });
}

async function settingsDialog() {
  ST = await N.backupStatus(); let schools = (ST.schools || []).slice();
  const P = { primar: presetFor('primar'), sek: presetFor('sek') }; const L = presetFor(stageDefault());
  const col = (st, title) => `<div class="presetCol"><b>${title}</b>
      <div class="field"><span>Grundschrift des Blatts</span>${FontUI.button('ps_' + st + '_font', P[st].font, { k: st + ':font' })}</div>
      <div class="field"><span>Arbeitsanweisungen</span>${FontUI.button('ps_' + st + '_fontI', P[st].fontI, { k: st + ':fontI', inheritLabel: 'Wie das Blatt' })}</div>
      <div class="field"><span>Aufgabeninhalte</span>${FontUI.button('ps_' + st + '_fontC', P[st].fontC, { k: st + ':fontC', inheritLabel: 'Wie das Blatt' })}</div>
      <label class="field"><span>Schriftgröße (pt)</span><input type="number" min="9" max="24" step=".5" data-ps="${st}:size" value="${P[st].size}"></label>
      <label class="field"><span>Leistungsnachweis heißt</span><select data-ps="${st}:assess">${RD.ASSESS.map(a => `<option ${a === P[st].assess ? 'selected' : ''}>${a}</option>`).join('')}</select></label></div>`;
  dialog({ title: 'Einstellungen', wide: true, html: `
    <div class="subhead first">Schularten</div>
    <p class="hint" style="margin-top:0">Setzt nur Voreinstellungen (Schrift, Zahlenraum, Lineatur, Reihenfolge der Bausteine). Kein Werkzeug wird gesperrt.</p>
    <div class="schoolPick" id="sp">${C.SCHOOLS.map(([k, l]) => `<button type="button" data-s="${k}" aria-pressed="${schools.includes(k)}">${l}</button>`).join('')}</div>
    <div class="subhead">Voreinstellungen für neue Materialien</div>
    <p class="hint" style="margin-top:0">Gilt nur für neue Materialien; vorhandene bleiben genau so, wie sie sind. Jedes Blatt, jede Aufgabe und jede markierte Textstelle kann abweichen.</p>
    <div class="grid2">${col('primar', 'Grundschule und Förderschule (Jg. 1–4)')}${col('sek', 'Ab Jahrgangsstufe 5 (Mittelschule, Realschule, Gymnasium)')}</div>
    <div class="grid2" style="margin-top:6px">
      <label class="field"><span>Farbe der Lösungen</span><select id="lC">${SOLCOLORS.map(([a, b]) => `<option value="${a}" ${a === L.solColor ? 'selected' : ''}>${b}</option>`).join('')}</select></label></div>
    <label class="trow"><span>Kopfzeile Name · Datum · Klasse</span><input type="checkbox" class="sw" id="lH" ${L.header ? 'checked' : ''}></label>
    <label class="trow"><span>Aufgaben nummerieren</span><input type="checkbox" class="sw" id="lN" ${L.numbering ? 'checked' : ''}></label>
    <div class="subhead">Schriften auf diesem Computer</div>
    <p class="hint" style="margin-top:0">Foliva zeigt alle installierten Schriften in der Schriftauswahl. Gekaufte Schulschriften (z. B. Druckschrift Bayern) einfach normal installieren und danach in der Schriftauswahl „Liste aktualisieren“ wählen. Foliva gibt installierte Schriften nicht weiter.</p>
    <div class="linkrow"><button class="tb" id="vaBtn" type="button">Hinweise zu Schulschriften …</button></div>
    <div class="subhead">Updates</div>
    <label class="trow"><span>Beim Start nach einer neuen Version fragen<br><small class="hint">Fragt nur die Versionsnummer bei theisapps.de ab; dabei sieht der Server technisch deine IP-Adresse.</small></span><input type="checkbox" class="sw" id="uC" ${ST.updateCheck ? 'checked' : ''}></label>
    <div class="linkrow"><button class="tb" id="abBtn">Über Foliva</button></div>`,
    buttons: [{ label: 'Abbrechen', value: false }, { label: 'Übernehmen', primary: true, value: true }],
    onOpen: dl => {
      $$('#sp button', dl).forEach(b => b.onclick = () => { const k = b.dataset.s; schools = schools.includes(k) ? schools.filter(x => x !== k) : [...schools, k]; b.setAttribute('aria-pressed', schools.includes(k)); });
      $('#abBtn', dl).onclick = aboutDialog; $('#vaBtn', dl).onclick = schoolFontsInfo;
      const pick = (k, key, btn) => { const [st, f] = k.split(':'); P[st][f] = key; btn.outerHTML = FontUI.button(btn.id, key, { k, inheritLabel: f === 'font' ? null : 'Wie das Blatt' }); FontUI.bind(dl, pick); };
      FontUI.bind(dl, pick);
      dl._get = () => {
        $$('[data-ps]', dl).forEach(i => { const [st, f] = i.dataset.ps.split(':'); P[st][f] = f === 'size' ? (+i.value || P[st].size) : i.value; });
        const strip = x => ({ font: x.font || 'grundschrift', fontI: x.fontI || '', fontC: x.fontC || '', fontT: x.fontT || '', size: x.size, assess: x.assess, layout: x.layout || '' });
        return { schools, presets: { primar: strip(P.primar), sek: strip(P.sek) }, layout: { ...(ST.layout || {}), solColor: $('#lC', dl).value, header: $('#lH', dl).checked, numbering: $('#lN', dl).checked }, updateCheck: $('#uC', dl).checked };
      };
      settingsDialog.dl = dl;
    } }).then(async ok => {
      if (!ok) return; const v = settingsDialog.dl._get();
      ST = await N.setCfg(v); toast('Einstellungen übernommen. Sie gelten für neue Materialien.');
      if (view === 'editor') renderLeft(); else renderLibrary();
    });
}
/* Hinweise zur Vereinfachten Ausgangsschrift und zu gekauften Schulschriften – verständlich für Lehrkräfte */
function schoolFontsInfo() {
  dialog({ title: 'Schulschriften in Foliva', wide: true, html: `
    <p><b>Mitgeliefert und sofort nutzbar</b></p>
    <ul><li><b>theis Schuldruck Süd</b> – Druckschrift von theis (Normal und Fett), für Überschriften und Arbeitsanweisungen.</li>
    <li><b>Grundschrift</b> von Christian Urff – mit gepunkteter und Kontur-Fassung zum Nachspuren (Lizenz CC BY 3.0).</li>
    <li><b>Vereinfachte Ausgangsschrift (VA)</b> – als „Playwrite DE VA“ (freie Lizenz SIL OFL 1.1), auch mit eingebauten Hilfslinien. Die Buchstabenverbindungen entstehen automatisch beim Schreiben.</li></ul>
    <p class="hint">Hinweis: Playwrite DE VA ist eine freie Umsetzung der VA. Bitte die Buchstabenformen vor dem breiten Einsatz mit der in deiner Schule verwendeten Vorlage vergleichen.</p>
    <p><b>Andere Schulschriften (z. B. Druckschrift Bayern 2001, Schulausgangsschrift, Lateinische Ausgangsschrift)</b></p>
    <p>Diese Schriften sind urheberrechtlich geschützt und dürfen nicht mit Foliva mitgeliefert werden. Wenn deine Schule eine Lizenz hat oder du sie gekauft hast:</p>
    <ol><li>Schriftdatei (.ttf oder .otf) vom Anbieter herunterladen.</li><li>Doppelklicken und „Installieren“ wählen (Mac: Schriftsammlung).</li><li>In Foliva in einer Schriftauswahl auf „Liste aktualisieren“ klicken – die Schrift erscheint unter „Auf diesem Computer“.</li></ol>
    <p class="hint">Achtung beim Weitergeben: Ein PDF zeigt die Schrift überall richtig. Öffnet jemand dein Material in Foliva auf einem Computer ohne diese Schrift, zeigt Foliva das deutlich an und bietet einen Ersatz an.</p>` });
}

async function welcomeDialog() {
  let schools = [];
  await dialog({ title: 'Willkommen bei Foliva', wide: true, closeLabel: 'Überspringen', html: `
    <div class="aboutTop"><img src="icon.png" alt=""><div><b>Foliva</b><br><span class="hint">Arbeitsblätter und Proben gestalten · Beta, kostenlos während der Beta</span></div></div>
    <p>Für welche Schularten erstellst du Material? (Mehrfachwahl, jederzeit in den Einstellungen änderbar.)</p>
    <div class="schoolPick" id="sp">${C.SCHOOLS.map(([k, l]) => `<button type="button" data-s="${k}" aria-pressed="false">${l}</button>`).join('')}</div>
    <p class="hint">Die Auswahl setzt nur passende Voreinstellungen – alle Werkzeuge bleiben verfügbar. Deine Materialien bleiben auf diesem Computer; es gibt kein Konto.</p>`,
    buttons: [{ label: 'Los geht’s', primary: true, value: true }],
    onOpen: dl => $$('#sp button', dl).forEach(b => b.onclick = () => { const k = b.dataset.s; schools = schools.includes(k) ? schools.filter(x => x !== k) : [...schools, k]; b.setAttribute('aria-pressed', schools.includes(k)); }) });
  ST = await N.setCfg({ schools: schools.length ? schools : ['gs'] });
}

async function aboutDialog() {
  const LOGO = (window.THEIS_LOGO || '').replace('<svg ', '<svg class="theislogo" ').replace(/fill="#16171a"/g, 'fill="currentColor"');
  dialog({ title: 'Über Foliva', html: `
    <div class="aboutTop"><img src="icon.png" alt=""><div><b>Foliva</b><br>Version ${esc(VERSION)} · Beta<br><span class="hint">Arbeitsblätter und Proben gestalten</span></div></div>
    <div class="maker"><span class="by">Eine App von</span>${LOGO}<div class="mk-meta">Apps für die Schule · <a class="linkA" data-ext="https://theisapps.de/">theisapps.de</a><br>Foliva ${esc(VERSION)} · © 2026 theis. Alle Rechte vorbehalten.<br>Kostenlos während der Beta · <a class="linkA" data-ext="https://buy.stripe.com/3cI3cv0i8eLk31g4mNgw000" style="font-weight:600">☕ Einen Kaffee ausgeben</a> · freiwillig</div></div>
    <p class="hint"><b>Mitgelieferte Schriften:</b> theis Schuldruck Süd © 2026 theis · Grundschrift von Christian Urff, lizenziert unter <a class="linkA" data-ext="https://creativecommons.org/licenses/by/3.0/de/">CC BY 3.0</a> (<a class="linkA" data-ext="https://urff.app/grundschrift/">urff.app/grundschrift</a>) · Playwrite DE VA, Copyright 2023 The Playwrite Project Authors, <a class="linkA" data-ext="https://openfontlicense.org/">SIL Open Font License 1.1</a> (<a class="linkA" data-ext="https://github.com/TypeTogether/Playwrite">github.com/TypeTogether/Playwrite</a>)</p>
    <p class="hint"><b>Bilder:</b> Noto Emoji © Google, <a class="linkA" data-ext="https://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</a> (<a class="linkA" data-ext="https://github.com/googlefonts/noto-emoji">github.com/googlefonts/noto-emoji</a>); Flaggen gemeinfrei (Wikimedia Commons über Noto). Deutsche Bildnamen: emojibase-data (MIT) auf Grundlage von Unicode CLDR. QR-Codes: qrcode-generator von Kazuhiko Arase (MIT).</p>
    <p class="hint"><b>Inhalte:</b> Aufgaben, Wortlisten und Vorlagen sind eigenständig erstellt. Sachtexte nennen ihre Quellen und sind als Entwurf gekennzeichnet, bis sie fachlich freigegeben sind.</p>
    <p class="hint">Fehler oder Wünsche? hallo@theisapps.de</p>
    <div class="linkrow"><button class="tb" id="licBtn">Lizenzen der verwendeten Open-Source-Software</button></div>`,
    onOpen: dl => { $$('[data-ext]', dl).forEach(a => a.onclick = () => N.openExternal(a.dataset.ext)); $('#licBtn', dl).onclick = async () => { const t = await N.licenses(); dialog({ title: 'Lizenzen', wide: true, html: `<pre class="lic">${esc(t)}</pre><div class="linkrow"><button class="tb" id="chr">Lizenzen der Chromium-Komponenten</button></div>`, onOpen: d2 => { $('#chr', d2).onclick = () => N.chromiumLicenses(); } }); }; } });
}

function helpDialog(q0 = '') {
  /* Tastenkürzel passend zum Rechner zeigen (Mac: ⌘, sonst Strg) */
  const keyfix = h => h.replace(/<span class="kbd">(?:⌘\/Strg|Strg\/⌘|Strg|⌘)<\/span>/g, `<span class="kbd">${MOD}</span>`);
  const H = (window.FolivaHelp || []).map(s => ({ ...s, html: keyfix(s.html) }));
  dialog({ title: 'Foliva – Hilfe', wide: true, html: `<div class="search" style="margin:0 0 14px">${ICO.search}<input type="search" id="hq" placeholder="Hilfe durchsuchen …" value="${esc(q0)}"></div><div class="helpWrap"><nav class="helpToc" id="htoc"></nav><div id="hbody"></div></div>`,
    onOpen: dl => {
      const draw = () => {
        const q = $('#hq', dl).value.trim().toLowerCase();
        const secs = H.filter(s => !q || (s.title + ' ' + s.html.replace(/<[^>]+>/g, ' ')).toLowerCase().includes(q));
        $('#htoc', dl).innerHTML = secs.map(s => `<button data-h="${s.id}">${esc(s.title)}</button>`).join('');
        const mark = h => !q ? h : h.replace(/>([^<]+)</g, (m, t) => '>' + t.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>') + '<');
        $('#hbody', dl).innerHTML = secs.length ? secs.map(s => `<section class="helpSec" id="h-${s.id}"><h3>${esc(s.title)}</h3>${mark(s.html)}</section>`).join('') : '<p>Nichts gefunden.</p>';
        $$('[data-h]', dl).forEach(b => b.onclick = () => { const t = $('#h-' + b.dataset.h, dl); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      };
      $('#hq', dl).oninput = draw; draw(); $('#hq', dl).focus();
    } });
}

/* ---------- Beispiele (erfundene Inhalte) ---------- */
function exampleDocs() {
  const mk = (kind, title, meta, items) => { const d = newDoc(kind); Object.assign(d, { title, ...meta }); d.items = items.map(([type, props]) => { const it = makeItem(type); if (!props.source && ['text', 'pairs', 'words', 'options'].some(k => k in props)) it.source = 'eigene'; Object.assign(it, props); if (props.source) G.fill(it); regen(it); return it; }); if (meta.font) d.settings.font = meta.font; return d; };
  return [
    () => mk('arbeitsblatt', 'Rechnen bis 20', { subject: 'Mathematik', grades: [1, 2], topic: 'Addition und Subtraktion', tags: 'Beispiel', font: 'grundschrift' }, [
      ['packet', { title: 'Rechne.', op: '+−', range: 20, count: 10, transition: 'mixed', cols: 2 }], ['wall', { title: 'Fülle die Zahlenmauern aus.', range: 20, count: 3 }], ['house', { title: 'Ergänze das Zahlenhaus.', range: 10, count: 3, floors: 4 }], ['compare', { title: 'Setze ein: <, > oder =.', range: 20, count: 6, cols: 3 }]]),
    () => mk('probe', 'Matheprobe: Zahlen bis 100', { subject: 'Mathematik', grades: [2], topic: 'Zahlenraum bis 100', tags: 'Beispiel' }, [
      ['packet', { title: 'Rechne.', op: '+', range: 100, count: 6, transition: 'none', points: 3 }], ['numberline', { title: 'Trage die fehlenden Zahlen ein.', start: 0, step: 5, ticks: 20, label: 4, blanks: 4, points: 2 }],
      ['choice', { title: 'Kreuze das richtige Ergebnis an.', question: '45 + 30 =', options: [{ t: '65', ok: false }, { t: '75', ok: true }, { t: '85', ok: false }], points: 1 }],
      ['sachaufgabe', { title: 'Löse die Sachaufgabe.', text: 'Ben hat 35 Sticker. Er schenkt Mia 12 Sticker.', solF: 'Wie viele Sticker hat Ben noch?', solR: '35 − 12 = 23', solA: 'Ben hat noch 23 Sticker.', points: 3 }],
      ['lines', { title: 'Erkläre, wie du 47 + 8 rechnest.', count: 2, answer: 'Erst 47 + 3 = 50, dann 50 + 5 = 55.', points: 2 }]]),
    () => mk('arbeitsblatt', 'Buchstaben üben: M m', { subject: 'Deutsch', grades: [1], topic: 'Buchstabe M', tags: 'Beispiel, Schreiben', font: 'grundschrift', size: 16 }, [
      ['lineatur', { title: 'Spure nach und schreibe weiter.', kind: 'l1', rows: 3, text: 'M m', trace: 'punkt', fill: true, repeat: true }],
      ['scramble', { title: 'Ordne die Buchstaben.', words: 'Maus\nMama\nMond\nMilch', keepFirst: true }],
      ['gap', { title: 'Setze die passenden Wörter ein.', text: 'Die [Maus] isst Käse. Am Himmel steht der [Mond]. [Mama] trinkt Tee.', bank: true }],
      ['wordsearch', { title: 'Finde die Wörter mit M.', words: 'Maus, Mond, Mama, Milch, Mut', size: 8 }]]),
    () => mk('arbeitsblatt', 'Uhrzeiten und Zahlenfolgen', { subject: 'Mathematik', grades: [3], topic: 'Größen und Muster', tags: 'Beispiel' }, [
      ['clock', { title: 'Wie spät ist es?', step: 'viertel', count: 6, cols: 3 }], ['sequence', { title: 'Setze die Zahlenfolgen fort.', kind: 'gemischt', range: 200, count: 3, askRule: true }],
      ['written', { title: 'Rechne schriftlich.', op: '+', digits: 3, count: 4, carry: 'required', cols: 4 }], ['hundred', { title: 'Färbe die Fünferreihe und ergänze.', pattern: 'reihe', row: 5 }]]),
    () => mk('arbeitsblatt', 'At school – vocabulary', { subject: 'Englisch', grades: [5], topic: 'School things', tags: 'Beispiel, Sekundarstufe', font: 'system', size: 12 }, [
      ['vocab', { title: 'Übersetze.', left: 'Deutsch', right: 'Englisch', pairs: [{ l: 'das Lineal', r: 'the ruler' }, { l: 'der Radiergummi', r: 'the rubber' }, { l: 'die Tafel', r: 'the board' }, { l: 'das Klassenzimmer', r: 'the classroom' }, { l: 'die Pause', r: 'the break' }], dir: 'gemischt' }],
      ['match', { title: 'Match the questions and answers.', pairs: [{ l: 'What’s your name?', r: 'I’m Tom.' }, { l: 'How old are you?', r: 'I’m eleven.' }, { l: 'Where are you from?', r: 'I’m from Leeds.' }, { l: 'What’s your hobby?', r: 'Football.' }] }],
      ['gap', { title: 'Fill in the gaps.', text: 'My [school] is big. I have got a new [pencil case]. Our [teacher] is very nice.', bank: true }],
      ['choice', { title: 'Tick the right word.', question: 'She ___ a pen.', options: [{ t: 'has got', ok: true }, { t: 'have got', ok: false }, { t: 'is got', ok: false }] }]]),
  ];
}
const EX_NAMES = ['Rechnen bis 20 (Klasse 1/2)', 'Matheprobe: Zahlen bis 100 (Klasse 2)', 'Buchstaben üben: M m (Klasse 1)', 'Uhrzeiten und Zahlenfolgen (Klasse 3)', 'At school – vocabulary (Englisch 5)'];
function examplesDialog() {
  dialog({ title: 'Beispiele', html: `<p class="hint" style="margin-top:0">Ein Beispiel wird als eigene Kopie in „Meine Materialien“ gelegt. Alle Inhalte sind erfunden.</p><div class="btnCol">${EX_NAMES.map((n, i) => `<button class="tb" data-ex="${i}">${esc(n)}</button>`).join('')}</div>`,
    onOpen: (dl, close) => $$('[data-ex]', dl).forEach(b => b.onclick = async () => { close(); const d = exampleDocs()[+b.dataset.ex](); docs.set(d.id, d); markDirty(d); await flush(); openDoc(d); }) });
}

/* ---------- Tastatur und Menü ---------- */
document.addEventListener('keydown', e => {
  if (view !== 'editor' || document.querySelector('dialog[open]')) return;
  const inField = e.target.closest('input,textarea,select,[contenteditable]');
  if (e.key === 'Escape' && !inField) { msel.clear(); zone = null; select(null, { force: true }); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !inField && cur.items.length) { e.preventDefault(); msel = new Set(cur.items.map(i => i.id)); sel = cur.items[cur.items.length - 1].id; markSel(); placeSelbar(); renderRight(); return; }
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !inField && ['b', 'i', 'u'].includes(e.key.toLowerCase()) && (sel || zone === 'head') && typeof FmtTop !== 'undefined') { e.preventDefault(); FmtTop.cmd(e.key.toLowerCase()); return; }
  if (e.key === 'Enter' && !inField && sel && msel.size <= 1) { const ed = document.querySelector(`#pages .it[data-id="${sel}"] [data-edit]`); if (ed) { e.preventDefault(); startEdit(ed); return; } }
  if (inField) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && (sel || msel.size)) { e.preventDefault(); itemAction('del'); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && sel) { e.preventDefault(); itemAction('dup'); }
  else if (e.altKey && e.key === 'ArrowUp' && sel) { e.preventDefault(); itemAction('up'); }
  else if (e.altKey && e.key === 'ArrowDown' && sel) { e.preventDefault(); itemAction('down'); }
  else if (sel && /^Arrow(Left|Right|Up|Down)$/.test(e.key) && !e.metaKey && !e.ctrlKey) {
    e.preventDefault(); const it = cur.items.find(x => x.id === sel); if (!it) return; const st = e.shiftKey ? 5 : 1;
    const b = posBounds(it), h = /Left|Right/.test(e.key), d = /Left|Up/.test(e.key) ? -st : st;
    change(() => { setPos(it, (+it.dx || 0) + (h ? d : 0), (+it.dy || 0) + (h ? 0 : d), b); }, 'nudge' + sel, { panel: true });
  }
});
N.onMenu(async cmd => {
  const inField = document.activeElement && document.activeElement.closest && document.activeElement.closest('input,textarea,.rtf');
  if (cmd === 'flush') { await flush(); N.flushed(); return; }
  if (cmd === 'undo' || cmd === 'redo') {
    const dir = cmd === 'undo' ? -1 : 1;
    if (editing) { if (dir < 0) RichEdit.undo(); else RichEdit.redo(); return; }
    /* In den Feldern rechts gilt das Rückgängig des Materials (die Felder werden neu gezeichnet), danach bleibt der Cursor im selben Feld */
    if (inField && view === 'editor' && cur && inField.closest('#right') && (inField.dataset.k || inField.dataset.m || inField.closest('[data-wh],[data-list]'))) {
      const key = inField.id ? '#' + inField.id : null; const wh = inField.closest('.whr'); const whSel = wh ? `[data-wh] .whr[data-i="${wh.dataset.i}"] .${inField.classList[0]}` : null;
      undoRedo(dir); requestAnimationFrame(() => { const n = (key && $('#right ' + key)) || (whSel && $('#right ' + whSel)); if (n) { if (n.classList.contains('rtf')) { RichField.focusEnd(n); return; } n.focus(); try { const L = n.value.length; n.setSelectionRange(L, L); } catch (e) { } } });
      return;
    }
    if (inField) document.execCommand(dir < 0 ? 'undo' : 'redo'); else undoRedo(dir); return;
  }
  if (cmd === 'help') return helpDialog();
  if (cmd === 'about') return aboutDialog();
  if (cmd === 'settings') return settingsDialog();
  if (cmd === 'backups') return backupsDialog();
  if (cmd === 'backup') { await flush(); const r = await N.backupNow(); ST = r.status; return toast(r.ok ? `Gesichert: ${r.count} Materialien.` : 'Sicherung fehlgeschlagen.', 3200); }
  if (cmd === 'import') return importFlow();
  if (cmd === 'library') return showLibrary();
  if (cmd === 'new') return newMaterialDialog();
  if (cmd === 'templates') return Vorlagen.open();
  if (cmd === 'closeTab') { if (view === 'editor' && cur) closeTab(cur.id); return; }
  if (cmd === 'nextTab') return cycleTab(1);
  if (cmd === 'prevTab') return cycleTab(-1);
  if (view !== 'editor' || !cur) return;
  if (cmd === 'pdf') outputDialog('pdf'); if (cmd === 'print') outputDialog('print'); if (cmd === 'export') exportDocs([cur]);
  if (cmd === 'find') return findReplaceDialog(); if (cmd === 'wordfinder') return wordFinderDialog();
  if (cmd.startsWith('insert:')) { const t = cmd.slice(7); if (T(t)) { if (editing) finishEdit(true); insertItem(t); } return; }
  if (cmd === 'pageSetup') { if (editing) finishEdit(true); return pageSetupDialog(); }
  if (cmd === 'headSetup') { if (editing) finishEdit(true); return selectZone('head'); }
  if (cmd.startsWith('orient:')) { const o = cmd.slice(7); return change(() => { cur.settings.orient = o; }, null, { panel: true }); }
  if (cmd.startsWith('fmt:')) return FmtTop.cmd(cmd.slice(4));
  if (cmd === 'regenAll') return regenAllDialog();
  if (cmd === 'parallel') { await flush(); return parallelDoc(cur); }
  if (cmd === 'resetPos') { change(() => cur.items.forEach(x => { delete x.dx; delete x.dy; }), null, { panel: true }); return toast('Alle Bausteine stehen wieder an ihrem Platz. Rückgängig mit ⌘Z.', 3000); }
  if (cmd === 'solutions') toggleSol(); if (cmd === 'focus') toggleFocus();
  if (cmd === 'zoomIn') setZoom(1); if (cmd === 'zoomOut') setZoom(-1); if (cmd === 'zoomFit') setZoom(0);
});

/* ---------- Start ---------- */
(async () => {
  try { if (await N.platform() === 'darwin') document.body.classList.add('mac'); } catch (e) {}
  VERSION = await N.appVersion(); ST = await N.backupStatus();
  try { await loadOwnLernwoerter(); } catch (e) { }
  const r = await N.list(); r.docs.forEach(d => docs.set(d.id, migrate(d)));
  if (r.problems && r.problems.length) addBanner('bad', r.problems.map(p => esc((p.title ? '„' + p.title + '“: ' : '') + p.msg)).join('<br>'));
  if (ST.prevVersion && ST.prevVersion !== VERSION && !sessionStorage.getItem('upd')) { sessionStorage.setItem('upd', 1); }
  ensureFonts(); detectFonts();
  TABS = (UI.tabs || []).filter(id => docs.get(id) && !docs.get(id).deleted);
  const last = UI.active && TABS.includes(UI.active) ? docs.get(UI.active) : null;
  if (last) openDoc(last); else showLibrary();
  if (!ST.schools) await welcomeDialog();
  if (view === 'library') renderLibrary(); else renderLeft();
  N.updateCheck().then(u => { if (u) addBanner('info', `Neue Version <b>${esc(u.version)}</b> verfügbar. Deine Materialien bleiben beim Aktualisieren erhalten.`, { label: 'Jetzt laden', run: () => N.openExternal(u.url) }); }).catch(() => {});
})();
