/* Foliva – Werkzeuge im Editor: Wortfinder, Suchen und Ersetzen, Seite duplizieren · © 2026 theis
   Nutzt die globalen Editor-Funktionen aus app.js (cur, change, dialog, insertItem, …) erst beim Aufruf. */
'use strict';

/* ---------- Wortfinder ---------- */
function wordFinderPool() {
  const P = window.FolivaPools || {}, WS = window.FolivaWortschatz;
  const out = new Map();
  const add = (w, kind) => { w = String(w || '').trim(); if (!w || /\s/.test(w) || w.length > 24) return; if (!out.has(w)) out.set(w, kind); };
  (P.allNouns ? P.allNouns() : []).forEach(n => add(n.w, 'Nomen'));
  (P.VERBS || []).forEach(v => add(v.g, 'Verb'));
  (P.ADJ || []).forEach(a => add(a.g, 'Adjektiv'));
  if (WS) { WS.list('nomen').forEach(w => add(w, 'Nomen')); WS.list('verben').forEach(w => add(w, 'Verb')); WS.list('adjektive').forEach(w => add(w, 'Adjektiv')); WS.list('klein').forEach(w => add(w, 'Weitere')); }
  return [...out.entries()].map(([w, k]) => ({ w, k })).sort((a, b) => a.w.localeCompare(b.w, 'de'));
}
function wordFinderFilter(pool, o) {
  const low = s => s.toLocaleLowerCase('de');
  /* „nur diese Buchstaben“: Buchstaben, Umlaute und Mehrgraphe wie sch, ch, ei, au, ie als Einheit erlaubt */
  const allowed = String(o.only || '').split(/[\s,;]+/).map(low).filter(Boolean);
  const units = allowed.filter(x => x.length > 1).sort((a, b) => b.length - a.length), singles = new Set(allowed.filter(x => x.length === 1));
  const onlyOk = w => {
    if (!allowed.length) return true; let s = low(w);
    while (s.length) { const u = units.find(x => s.startsWith(x)); if (u) { s = s.slice(u.length); continue; } if (singles.has(s[0])) { s = s.slice(1); continue; } return false; }
    return true;
  };
  const st = low(o.start || ''), en = low(o.end || ''), co = low(o.contains || '');
  const min = +o.min || 1, max = +o.max || 99;
  return pool.filter(x => {
    const w = low(x.w);
    if (o.kind && o.kind !== 'alle' && x.k !== o.kind) return false;
    if (st && !w.startsWith(st)) return false; if (en && !w.endsWith(en)) return false; if (co && !w.includes(co)) return false;
    if (x.w.length < min || x.w.length > max) return false;
    return onlyOk(x.w);
  });
}
function wordFinderDialog() {
  if (!cur) return;
  const pool = wordFinderPool();
  const html = `<p class="hint" style="margin-top:0">Findet Wörter, die zum Lernstand passen – zum Beispiel nur aus den Buchstaben, die die Klasse schon kennt. ${pool.length} Wörter in der Sammlung.</p>
    <div class="grid2"><label class="field"><span>Nur diese Buchstaben (leer = alle; auch sch, ei, au …)</span><input type="text" id="wfOnly" placeholder="z. B. m a l i o s e n r t"></label>
    <label class="field"><span>Wortart</span><select id="wfKind"><option value="alle">alle</option><option>Nomen</option><option>Verb</option><option>Adjektiv</option><option>Weitere</option></select></label></div>
    <div class="grid3"><label class="field"><span>Beginnt mit</span><input type="text" id="wfStart"></label><label class="field"><span>Enthält</span><input type="text" id="wfCont" placeholder="z. B. ie"></label><label class="field"><span>Endet mit</span><input type="text" id="wfEnd"></label></div>
    <div class="grid2"><label class="field"><span>Mindestens … Buchstaben</span><input type="number" id="wfMin" min="1" max="20" value="2"></label><label class="field"><span>Höchstens … Buchstaben</span><input type="number" id="wfMax" min="1" max="24" value="10"></label></div>
    <div class="wfHead"><b id="wfCount"></b><span class="sp"></span><button class="tb mini" type="button" id="wfAll">Alle auswählen</button><button class="tb mini" type="button" id="wfNone">Keine</button></div>
    <div class="wfList" id="wfList"></div>
    <div class="dlgBtns"><button class="tb" type="button" id="wfCopy">Kopieren</button><button class="tb" type="button" id="wfList2">Als Lernwörter-Baustein</button><button class="tb primary" type="button" id="wfText">Als Text einfügen</button></div>`;
  dialog({ title: 'Wortfinder', html, wide: true, onOpen: (d, close) => {
    const q = id => d.querySelector('#' + id); let res = [];
    const run = () => {
      res = wordFinderFilter(pool, { only: q('wfOnly').value, kind: q('wfKind').value, start: q('wfStart').value, end: q('wfEnd').value, contains: q('wfCont').value, min: q('wfMin').value, max: q('wfMax').value });
      q('wfCount').textContent = `${res.length} Wörter gefunden`;
      q('wfList').innerHTML = res.slice(0, 600).map((x, i) => `<label class="wfW"><input type="checkbox" data-i="${i}" checked><span>${esc(x.w)}</span></label>`).join('') + (res.length > 600 ? `<p class="hint">… und ${res.length - 600} weitere. Filter enger stellen.</p>` : '') || '<p class="hint">Keine passenden Wörter. Filter lockern.</p>';
    };
    ['wfOnly', 'wfStart', 'wfEnd', 'wfCont', 'wfMin', 'wfMax'].forEach(id => q(id).oninput = run); q('wfKind').onchange = run; run();
    const chosen = () => [...d.querySelectorAll('#wfList input:checked')].map(i => res[+i.dataset.i].w);
    q('wfAll').onclick = () => d.querySelectorAll('#wfList input').forEach(i => i.checked = true);
    q('wfNone').onclick = () => d.querySelectorAll('#wfList input').forEach(i => i.checked = false);
    q('wfCopy').onclick = async () => { const w = chosen(); if (!w.length) return toast('Keine Wörter ausgewählt.'); try { await navigator.clipboard.writeText(w.join(', ')); toast(`${w.length} Wörter kopiert.`); } catch (e) { toast('Kopieren nicht möglich.'); } };
    q('wfText').onclick = () => { const w = chosen(); if (!w.length) return toast('Keine Wörter ausgewählt.'); close(true); insertWithProps('text', { text: w.join(', ') }); };
    q('wfList2').onclick = () => { const w = chosen(); if (!w.length) return toast('Keine Wörter ausgewählt.'); close(true); insertWithProps('wordlist', { source: 'eigene', words: w.slice(0, 20).join('\n') }); if (w.length > 20) toast('Der Lernwörter-Baustein nimmt höchstens 20 Wörter – die ersten 20 sind eingefügt.', 4000); };
  } });
}
/* Baustein einfügen und gleich mit Inhalt füllen (hinter der Auswahl bzw. am Ende) */
function insertWithProps(type, props) {
  if (!cur || !T(type)) return;
  let it; const at = sel ? cur.items.findIndex(x => x.id === sel) + 1 : cur.items.length;
  zone = null;
  change(() => { it = makeItem(type); Object.assign(it, props); if (T(type).gen) regen(it); cur.items.splice(at < 0 ? cur.items.length : at, 0, it); sel = it.id; msel.clear(); });
  renderRight(); scrollToSel = true; return it;
}

/* ---------- Suchen und Ersetzen (alle Texte des Materials) ---------- */
const FR_SKIP = new Set(['id', 'type', 'seed', 'data', 'src', 'font', 'fontI', 'fontC', 'pfont', 'kind', 'trace', 'source', 'theme', 'lang', 'mode', 'op', 'ops', 'look', 'ex', 'syl', 'align', 'shape', 'style', 'pform', 'frameStyle', 'frameColor', 'frameFill', 'color', 'fill', 'boxStyle', 'status']);
function frWalk(obj, fn, key) {
  if (typeof obj === 'string') return fn(obj);
  if (Array.isArray(obj)) { for (let i = 0; i < obj.length; i++) { const v = frWalk(obj[i], fn); if (v !== undefined) obj[i] = v; } return undefined; }
  if (obj && typeof obj === 'object') { for (const k of Object.keys(obj)) { if (FR_SKIP.has(k) || /^(dx|dy|fw|rot|points|size|width|height|cols|count|range|n)$/.test(k)) continue; if (k.startsWith('img') || (typeof obj[k] === 'string' && /^(lib:|img:|data:)/.test(obj[k]))) continue; const v = frWalk(obj[k], fn, k); if (v !== undefined) obj[k] = v; } }
  return undefined;
}
function frRegex(find, o) { const e = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return new RegExp(o.whole ? `(?<![\\p{L}\\p{N}])${e}(?![\\p{L}\\p{N}])` : e, 'gu' + (o.cs ? '' : 'i')); }
function frCount(d, find, o) {
  if (!find) return 0; const re = frRegex(find, o); let n = 0;
  const cnt = s => { const m = s.match(re); if (m) n += m.length; return undefined; };
  cnt(d.title || ''); d.items.forEach(it => frWalk(it, cnt)); return n;
}
function findReplaceDialog() {
  if (!cur) return;
  const html = `<label class="field"><span>Suchen nach</span><input type="text" id="frFind" autofocus></label>
    <label class="field"><span>Ersetzen durch</span><input type="text" id="frRep"></label>
    <label class="trow"><span>Groß- und Kleinschreibung beachten</span><input type="checkbox" class="sw" id="frCs"></label>
    <label class="trow"><span>Nur ganze Wörter</span><input type="checkbox" class="sw" id="frWhole"></label>
    <p class="hint" id="frInfo">Durchsucht Titel, Arbeitsanweisungen und alle Texte dieses Materials.</p>`;
  dialog({ title: 'Suchen und Ersetzen', html, closeLabel: 'Abbrechen', buttons: [{ label: 'Abbrechen', value: false }, { label: 'Alle ersetzen', primary: true, value: 'go' }], onOpen: d => {
    const q = id => d.querySelector('#' + id);
    const upd = () => { const n = frCount(cur, q('frFind').value, { cs: q('frCs').checked, whole: q('frWhole').checked }); q('frInfo').textContent = q('frFind').value ? `${n} Fundstelle${n === 1 ? '' : 'n'} in diesem Material.` : 'Durchsucht Titel, Arbeitsanweisungen und alle Texte dieses Materials.'; };
    ['frFind', 'frCs', 'frWhole'].forEach(id => q(id).addEventListener('input', upd)); ['frCs', 'frWhole'].forEach(id => q(id).addEventListener('change', upd));
    findReplaceDialog.dl = d;
  } }).then(v => {
    if (v !== 'go') return; const d = findReplaceDialog.dl; const find = d.querySelector('#frFind').value, rep = d.querySelector('#frRep').value; const o = { cs: d.querySelector('#frCs').checked, whole: d.querySelector('#frWhole').checked };
    const n = frCount(cur, find, o); if (!n) return toast('Nichts gefunden.');
    const re = frRegex(find, o);
    change(() => {
      const r = s => s.replace(re, () => rep);
      cur.title = r(cur.title || '');
      cur.items.forEach(it => { const before = JSON.stringify(it); frWalk(it, s => { const t = r(s); return t !== s ? t : undefined; }); if (before !== JSON.stringify(it) && T(it.type) && T(it.type).gen) regen(it); });
    }, null, { panel: true, top: true });
    toast(`${n} Stelle${n === 1 ? '' : 'n'} ersetzt. Rückgängig mit ⌘Z.`, 3600);
  });
}

/* ---------- Seite duplizieren / Seite löschen ---------- */
let LAST_PAGES = [];
function pageItemIds(i) { const ids = []; (LAST_PAGES[i] || []).forEach(b => { if (b.head || !b.id || b.id[0] === '_') return; if (!ids.includes(b.id)) ids.push(b.id); }); return ids; }
function duplicatePage(i) {
  const ids = pageItemIds(i).filter(id => { const it = cur.items.find(x => x.id === id); return it && it.type !== 'break'; });
  if (!ids.length) return toast('Auf dieser Seite gibt es nichts zu duplizieren.');
  /* ein Baustein, der schon auf der vorigen Seite beginnt, gehört nicht zu dieser Seite */
  const prev = new Set(i > 0 ? pageItemIds(i - 1) : []); const own = ids.filter(id => !prev.has(id)); if (!own.length) return toast('Auf dieser Seite gibt es nichts zu duplizieren.');
  const lastIdx = Math.max(...pageItemIds(i).map(id => cur.items.findIndex(x => x.id === id)));
  change(() => {
    const clones = own.map(id => { const c = JSON.parse(JSON.stringify(cur.items.find(x => x.id === id))); c.id = rid('i', 6); return c; });
    const brk = { id: rid('i', 6), type: 'break' };
    cur.items.splice(lastIdx + 1, 0, brk, ...clones); sel = clones[0].id; msel.clear();
  }, null, { panel: true });
  scrollToSel = true; toast(`Seite ${i + 1} dupliziert (${own.length} Bausteine). Neue Zahlen: rechts „Neue Aufgaben erzeugen“.`, 3800);
}

/* ---------- Punkte für Leistungsnachweise vorschlagen ----------
   Grundsatz: halber Punkt je einfacher Lücke (Ergebnis, Zeichen, Feld), ganze Punkte für aufwendigere Teile.
   Vorschläge passen sich an, solange die Lehrkraft die Punkte nicht selbst geändert hat (pointsAuto). */
function blanksOf(it, doc) {
  try { const f = RD.R[it.type]; if (!f) return 0; const h = f(it, { num: 1, probe: true, dim: RD.dims(doc), doc, fC: '', fI: '' }); return (String(Array.isArray(h) ? h.join('') : h).match(/class="s[ "]/g) || []).length; } catch (e) { return 0; }
}
function suggestPoints(it, doc) {
  const d = it.data || {}; const len = a => Array.isArray(a) ? a.length : 0;
  const n = { written: () => len(d.tasks), wdiv: () => len(d.tasks) * 2, halbschriftlich: () => len(d.tasks), zerlegung: () => len(d.tasks), money: () => len(d.tasks), placevalue: () => len(d.rows), pattern: () => len(d.rows) || +it.count || 1, geoboard: () => len(d.figs) * 2,
    angles: () => len(d.tasks) * (it.askKind ? 2 : 1), crossword: () => len(d.placed) * .5, wordsearch: () => len(d.placed) * .5, secret: () => len(d.items), truefalse: () => len(d.order) || +it.n || 1,
    match: () => len(d.order) || +it.n || 1, gap: () => len(d.bank) || +it.n || 1, vocab: () => len(d.ask) || +it.n || 1, scramble: () => len(d.items) || +it.n || 1, choice: () => 1, lines: () => 2, sachaufgabe: () => 3,
    rechenrad: () => blanksOf(it, doc) * .25, hundred: () => len(d.hide) * .25, calctable: () => len(d.hide) * .25, numberline: () => len(d.ask) * .5, chart: () => 3,
    sachtext: () => Math.max(2, String(it.questions || '').split('\n').filter(x => x.trim()).length * 2) };
  if (['image', 'space', 'lineatur', 'wordlist', 'selfcheck', 'kaestchen', 'label'].includes(it.type)) return null;
  let p = n[it.type] ? n[it.type]() : blanksOf(it, doc) * .5;
  if (!p) return null;
  p = Math.round(p * 2) / 2; return Math.max(1, Math.min(60, p));
}
/* nach Änderungen an einer Aufgabe: Vorschlag nachführen (nur bei Leistungsnachweisen und automatischen Punkten) */
function autoPoints(it) { if (!cur || cur.kind !== 'probe' || it.pointsAuto !== true) return; const p = suggestPoints(it, cur); if (p == null || p === it.points) return; it.points = p; setTimeout(() => { const pi = document.querySelector('#right [data-k="points"]'); if (pi && document.activeElement !== pi) pi.value = p; }, 0); }
