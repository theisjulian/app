/* Libretto · Klassenlisten einlesen (PDF, Excel, CSV, eingefügter Text) – übernommen aus Viva/Gruppen · © 2026 theis */
'use strict';
const Importer = (() => {
let importHead = [];
/* Klasse je Schüler (Kurse aus mehreren Klassen, z. B. „8A“ und „8B“): „08 a“ → „8a“ */
let tableCls = new Map();
const CLS = /^0?(\d{1,2})\s?([A-Za-zÄÖÜäöü]{1,2})$/;
const normCls = v => { const t = String(v ?? '').trim(); const m = CLS.exec(t); return m ? m[1] + m[2] : ''; };
const clsKey = (last, first) => (String(last || '') + '|' + String(first || '')).toLowerCase().replace(/\s+/g, ' ');
/* Spalte, in der fast überall eine Klasse steht (ab Spalte „from“) */
function classColumn(rows, from) {
  const n = Math.max(0, ...rows.map(r => r.length));
  for (let i = from; i < n; i++) { const hit = rows.filter(r => normCls(r[i]) && +CLS.exec(String(r[i]).trim())[1] >= 5 && +CLS.exec(String(r[i]).trim())[1] <= 13).length; if (rows.length >= 2 && hit >= rows.length * .8) return i; }
  return -1;
}
/* PDF → Zeilen; bei Tabellen mit Kopfzeile werden die Spalten über die x-Positionen erkannt */
/* Rohe Textstücke mit Position je Seite (auch für das Notenblatt, siehe notenblatt.js) */
async function pdfRaw(buf) {
  const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
  const pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise; const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p); const tc = await page.getTextContent();
    pages.push({ items: tc.items.filter(it => it.str && it.str.trim()).map(it => ({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0 })) });
  }
  return pages;
}
async function pdfLines(pages) {
  const allRows = [];
  for (const pg of pages) {
    const rows = [];
    for (const it of pg.items) { const y = it.y, x = it.x;
      let row = rows.find(r => Math.abs(r.y - y) < 3); if (!row) { row = { y, items: [] }; rows.push(row); } row.items.push({ x, s: it.s.trim(), w: it.w || 0 }); }
    rows.sort((a, b) => b.y - a.y); rows.forEach(r => r.items.sort((a, b) => a.x - b.x)); allRows.push(...rows);
  }
  importHead = allRows.slice(0, 3).map(r => r.items.map(i => i.s).join(' '));
  const isHead = r => r.items.some(i => /^(nach)?name$|^familienname|^vorname|^rufname/i.test(i.s));
  const hi = allRows.findIndex(isHead);
  if (hi >= 0) {
    const data = allRows.slice(hi + 1).filter(r => r.items.length >= 2 && !isHead(r));
    const xs = data.flatMap(r => r.items.map(i => i.x)).sort((a, b) => a - b); const cl = [];
    for (const x of xs) { const c = cl[cl.length - 1]; if (c && x - c.max <= 4) { c.max = x; c.n++; } else cl.push({ min: x, max: x, n: 1, end: x }); }
    const cols = cl.filter(c => c.n >= Math.max(2, data.length * .3));
    if (cols.length >= 2) {
      const colOf = x => { let k = 0; cols.forEach((c, i) => { if (c.min <= x + 4) k = i; }); return k; };
      data.forEach(r => r.items.forEach(i => { const c = cols[colOf(i.x)]; c.end = Math.max(c.end, i.x + i.w); }));
      const head = cols.map(() => '');
      for (const h of allRows[hi].items) { const mid = h.x + h.w / 2; let best = 0, bd = Infinity;
        cols.forEach((c, i) => { const d = mid < c.min ? c.min - mid : mid > c.end ? mid - c.end : 0; if (d < bd) { bd = d; best = i; } });
        head[best] = (head[best] ? head[best] + ' ' : '') + h.s; }
      const table = [head, ...data.map(r => { const cells = cols.map(() => ''); r.items.forEach(i => { const k = colOf(i.x); cells[k] = (cells[k] ? cells[k] + ' ' : '') + i.s; }); return cells; })];
      const viaTable = namesFromRows(table, true);
      if (viaTable.length) { viaTable.forEach(s => { if (s.cls) tableCls.set(clsKey(s.last, s.first), s.cls); }); return viaTable.map(s => `${s.last}, ${s.first}${s.g ? ` (${s.g})` : ''}`); }
    }
  }
  return allRows.map(r => r.items.map(i => i.s).join(' '));
}

function sheetRows(buf) {
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
}

/* Tabellen ohne Kopfzeile (ASV-/Kurslisten-Export): Spalte 1 = Nachname, Spalte 2 = Vorname */
function headerlessTable(rows) {
  const norm = v => String(v ?? '').trim();
  const nameLike = v => /^[A-Za-zÀ-ÿĀ-žḀ-ỿ'’.\- ]{2,}$/.test(v) && !/^\d/.test(v);
  const data = rows.map(r => r.map(norm)).filter(r => r.filter(Boolean).length >= 2);
  const ok = data.filter(r => nameLike(r[0]) && nameLike(r[1]));
  if (ok.length < Math.max(2, data.length * .6)) return [];
  // Geschlechtsspalte: überwiegend M/W
  let gc = -1;
  for (let i = 2; i < Math.max(...ok.map(r => r.length)); i++) { const v = ok.map(r => (r[i] || '').toLowerCase()); if (v.filter(x => /^(m|w|d|männlich|weiblich|divers)$/.test(x)).length >= ok.length * .8) { gc = i; break; } }
  const HEADISH = /belegart|jahrgangsstufe|klasse|kurs|schuljahr|\bstr\b|\bostr\b|\bstd\b|lehrkraft|name/i;
  const kc = classColumn(ok, 2);
  const out = [];
  data.forEach((r, i) => {
    if (!(nameLike(r[0]) && nameLike(r[1]))) return;
    if (i === 0 && (HEADISH.test(r.join(' ')) || /\d/.test(r[0]))) return;
    const gv = gc >= 0 ? (r[gc] || '').toLowerCase() : '';
    out.push({ last: r[0], first: r[1], g: /^w/.test(gv) ? 'w' : /^m/.test(gv) ? 'm' : /^d/.test(gv) ? 'd' : '', cls: kc >= 0 ? normCls(r[kc]) : '' });
  });
  return out;
}

/* Tabellen mit Kopfzeile (Name/Nachname, Vorname, Geschlecht) */
function namesFromRows(rows, strict) {
  const norm = v => String(v ?? '').trim();
  let hi = -1, cL = -1, cF = -1, cG = -1, cFull = -1, cK = -1;
  for (let i = 0; i < Math.min(rows.length, 40) && hi < 0; i++) {
    const r = rows[i].map(x => norm(x).toLowerCase());
    const L = r.findIndex(x => /^(nach)?name$|^familienname|^schüler.*name|^name,? vorname$|^name des schülers/.test(x));
    const F = r.findIndex(x => /^vorname|^rufname/.test(x));
    if (L >= 0 || F >= 0) { hi = i; cL = L; cF = F; cG = r.findIndex(x => /^geschl|^g$|^m\/w|^w\/m|^sex/.test(x)); cK = r.findIndex(x => /^(stamm)?klasse$|^kl\.?$|^klasse[ /(-]/.test(x)); if (L >= 0 && F < 0) cFull = L; }
  }
  if (hi < 0) { if (strict) return []; const t = headerlessTable(rows); return t.length ? t : recognizeNames(rows.map(r => r.map(norm).filter(Boolean).join(' '))); }
  const out = [];
  for (const r of rows.slice(hi + 1)) {
    let first = '', last = '';
    if (cFull >= 0) { const v = norm(r[cFull]); if (v.includes(',')) { [last, first] = v.split(',').map(x => x.trim()); } else { const p = v.split(/\s+/); first = p.pop() || ''; last = p.join(' '); } }
    else { last = norm(r[cL]); first = norm(r[cF]); }
    first = first.replace(/\(.*?\)/g, '').trim(); last = last.replace(/^\d+[.)]?\s*/, '').trim();
    if (!first || !/[A-Za-zÀ-ÿ]/.test(first + last) || /^(summe|gesamt|anzahl)/i.test(last)) continue;
    const gv = cG >= 0 ? norm(r[cG]).toLowerCase() : '';
    out.push({ first, last, g: /^w|weibl|^f/.test(gv) ? 'w' : /^m|männ/.test(gv) ? 'm' : /^d/.test(gv) ? 'd' : '', cls: cK >= 0 ? normCls(r[cK]) : '' });
  }
  return out;
}

/* Freitext-Zeilen (PDF ohne Kopfzeile, eingefügter Text) */
function recognizeNames(lines) {
  const out = [];
  const HEAD = /\b(klasse|klassenliste|schuljahr|seite|lehrkraft|klassenleit|datum|stand|gymnasium|schule|anzahl|geburtsdatum|konfession|religion|ausbildungsrichtung|nachname|vorname|schüler(innen)?liste)\b/i;
  const numbered = lines.filter(l => /^\s*\d+[.)]?\s+\S/.test(l)).length >= 3;
  /* Kurslisten des Infoportals: je Klasse ein Abschnitt mit der Zeile „8A, KL: …“ (oder „Klasse 8A“) – gilt für die folgenden Namen */
  let section = '';
  for (let raw of lines) {
    let l = String(raw || '').replace(/\s+/g, ' ').trim(); if (!l) continue;
    const sm = l.match(/^(0?(?:[5-9]|1[0-3]) ?[A-Za-zÄÖÜäöü]{1,2}) ?, ?KL\b/) || l.match(/^Klasse:? (0?(?:[5-9]|1[0-3]) ?[A-Za-zÄÖÜäöü]{1,2})$/i);
    if (sm) { section = normCls(sm[1]); continue; }
    if (numbered && !/^\d+[.)]?\s+/.test(l)) continue;
    l = l.replace(/^\d+[.)]?\s+/, '');
    if (HEAD.test(l) && !/,/.test(l)) continue;
    let g = ''; const gm = l.match(/(?:\(|\s|^)(w|m|d|weiblich|männlich|divers)(?:\)|\s|$)/i);
    if (gm) { const v = gm[1].toLowerCase(); g = v[0] === 'w' ? 'w' : v[0] === 'm' ? 'm' : 'd'; l = l.replace(gm[0], ' '); }
    /* Klasse in der Zeile („8A“, „10 c“) – zählt nur, wenn sie in fast allen Zeilen steht (siehe unten) */
    const km = l.match(/(?<![\p{L}\p{N}.])0?((?:[5-9]|1[0-3]) ?[A-Za-zÄÖÜäöü])(?![\p{L}\p{N}])/u); const cls = section || (km ? km[1].replace(' ', '') : '');
    l = l.replace(/\b\d{1,2}\.\d{1,2}\.(\d{2}|\d{4})\b/g, ' ').replace(/\b\d+[a-z]?\b/gi, ' ').replace(/(?<![\p{L}\p{N}])(ev|rk|ak|eth|isl|ohne|RK|EV|K|E)(?![\p{L}\p{N}])\.?/gu, ' ').replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!l || !/[A-Za-zÀ-ÿ]{2}/.test(l)) continue;
    let first, last;
    if (l.includes(',')) { const p = l.split(',').map(x => x.trim()).filter(Boolean); last = p[0]; first = (p[1] || '').split(' ').filter(Boolean).join(' '); }
    else { const p = l.split(' '); if (p.length > 5) continue; first = p.shift(); last = p.join(' '); }
    if (!first || first.length < 2) continue;
    out.push({ first, last: last || '', g, cls });
  }
  if (out.filter(x => x.cls).length < Math.max(2, out.length * .8)) out.forEach(x => { x.cls = ''; });
  return out;
}


/* Klassen- bzw. Kursname aus Kopfzeilen oder Dateiname */

function detectClassName(head, fname) {
  const txt = head.join('\n');
  const pats = [/\bKurs:?\s+([0-9]{0,2}[A-Za-zÄÖÜäöü]{1,4}\d{0,2})\b/, /(?:^|\n)\s*((?:[5-9]|1[0-3])\s?[A-Z]{1,3})\s*[,;]/, /(?:^|\n)\s*(\d[a-z]{1,3}\d{1,2})\s*[,;]/i, /\bKlasse:?\s+((?:[5-9]|1[0-3])\s?[A-Z]{1,3})\b/];
  for (const re of pats) { const m = txt.match(re); if (m) return m[1].replace(/\s+/g, ''); }
  // Spalte, in der überall dieselbe Klasse steht (z. B. ASV-Export „…;9F;…“)
  const col = head.map(l => String(l).split(/[;\t]/).map(x => x.trim())).filter(r => r.length > 2);
  if (col.length) for (let i = 0; i < col[0].length; i++) { const v = col[0][i]; if (/^(?:[5-9]|1[0-3])[A-Z]{1,3}$/.test(v) && col.every(r => r[i] === v)) return v; }
  const m = fname.match(/(?:^|[_\s-])((?:[5-9]|1[0-3])\s?[A-Za-z]{1,3}|\d[a-z]{1,3}\d{1,2})(?=[_\s.-]|$)/i); if (m) return m[1];
  return '';
}

async function readFile(f) {
  const name = f.name.toLowerCase(); let list = []; importHead = []; tableCls = new Map();
  if (name.endsWith('.pdf')) {
    const pages = await pdfRaw(await f.arrayBuffer());
    if (window.Notenblatt && Notenblatt.looksLike(pages)) return { notenblatt: pages, list: [], cls: '', head: [] };
    list = recognizeNames(await pdfLines(pages));
  }
  else if (/\.(xlsx|xls|ods)$/.test(name)) { const rows = sheetRows(await f.arrayBuffer()); importHead = rows.slice(0, 3).map(r => r.join(' ; ')); list = namesFromRows(rows); }
  else { const txt = await f.text(); const lines = txt.split(/\r?\n/); importHead = lines.slice(0, 3); list = /[;\t]/.test(txt) ? namesFromRows(lines.map(l => l.split(/[;\t]/))) : recognizeNames(lines); }
  if (tableCls.size) list.forEach(x => { if (!x.cls) x.cls = tableCls.get(clsKey(x.last, x.first)) || ''; });
  return { list, cls: detectClassName(importHead, f.name), head: importHead.slice() };
}
return { readFile, recognizeNames, namesFromRows, normCls };
})();
