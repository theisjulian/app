/* Notenblatt des Infoportals (PDF) einlesen – für den Einstieg mitten im Schuljahr.
   parse(pages): pages = [{ items: [{ s, x, y, w }] }] (Textstücke mit Position, wie pdf.js sie liefert; y wächst nach oben)
   plan(parsed, course, deps): erzeugt daraus Leistungsnachweise, Einzelnoten und ggf. neue Schüler – ohne etwas zu überschreiben. */
(function (root) {
  'use strict';
  const GRADE = /^([1-6])\s*([+-])?$/;
  const DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})?$/;
  const CODE = /^[A-ZÄÖÜ]{1,4}$/;
  const TOL = 2.2; /* Zeilentoleranz in pt */

  const deburr = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const nameKey = (last, first) => deburr(last) + '|' + deburr(first);

  /* Bruchstücke wie „Ani“ + „ć“ + „,“ zu einem Wort verbinden */
  function mergeFragments(items) {
    const out = [];
    const sorted = items.slice().sort((a, b) => (Math.abs(b.y - a.y) > TOL ? b.y - a.y : a.x - b.x));
    for (const it of sorted) {
      const last = out[out.length - 1];
      if (last && Math.abs(last.y - it.y) <= TOL && it.x - (last.x + last.w) < 1.4 && it.x - (last.x + last.w) > -2) { last.s += it.s; last.w = it.x + it.w - last.x; }
      else out.push({ s: it.s, x: it.x, y: it.y, w: it.w || 0 });
    }
    return out.map(i => ({ ...i, s: i.s.trim() })).filter(i => i.s);
  }
  const rowsOf = items => { /* Zeilen von oben nach unten, links nach rechts */
    const rows = [];
    items.slice().sort((a, b) => b.y - a.y).forEach(it => { let r = rows.find(q => Math.abs(q.y - it.y) <= TOL); if (!r) { r = { y: it.y, items: [] }; rows.push(r); } r.items.push(it); });
    rows.forEach(r => r.items.sort((a, b) => a.x - b.x)); rows.sort((a, b) => b.y - a.y); return rows;
  };

  function schoolYearOf(text) { const m = /(\d{4})\s*\/\s*(\d{2,4})/.exec(text); return m ? +m[1] : null; }
  function isoDate(txt, startYear, fallbackYear) {
    const m = DATE.exec(String(txt).trim()); if (!m) return null;
    const d = +m[1], mo = +m[2]; let y = m[3] ? +m[3] : null;
    if (y != null && y < 100) y += 2000;
    if (y == null) y = startYear ? (mo >= 8 ? startYear : startYear + 1) : fallbackYear;
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const dist = (it, col) => Math.min(Math.abs(it.x - col.x), Math.abs(it.x + it.w / 2 - (col.x + col.w / 2)));

  function parse(pages) {
    const warnings = [];
    const P = pages.map(p => ({ items: mergeFragments((p.items || []).filter(i => i && String(i.s).trim())) }));
    if (!P.length || !P[0].items.length) return { ok: false, error: 'Die Datei enthält keinen Text (vielleicht ein Foto oder Scan).' };
    /* Kopf: „Schuljahr 2023/2024 · 10E · Italienisch · 25.01.2024“ */
    let head = '';
    for (const r of rowsOf(P[0].items)) { const t = r.items.map(i => i.s).join(' '); if (/Schuljahr/i.test(t)) { head = t; break; } }
    if (!head) return { ok: false, error: 'Das sieht nicht nach einem Notenblatt aus (Zeile „Schuljahr · Klasse · Fach · Datum“ fehlt).' };
    const parts = head.split(/\s*[·•|]\s*/).map(x => x.trim()).filter(Boolean);
    const startYear = schoolYearOf(head);
    const dateTxt = (parts.find(x => /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(x)) || '');
    const out = { ok: true, year: (/(\d{4}\s*\/\s*\d{2,4})/.exec(head) || [])[1] || '', startYear, cls: parts[1] && !/^\d{1,2}\.\d{1,2}\./.test(parts[1]) ? parts[1] : '', subject: parts[2] && !/^\d{1,2}\.\d{1,2}\./.test(parts[2]) ? parts[2] : '', date: isoDate(dateTxt, startYear, startYear), cols: [], students: [], warnings, head };

    /* Spaltenkopf (nur Seite 1) */
    const p0 = P[0].items;
    const nameH = p0.filter(i => /^Name$/i.test(i.s)).sort((a, b) => b.y - a.y)[0];
    if (!nameH) return { ok: false, error: 'Die Spalte „Name“ wurde nicht gefunden – ist das ein Notenblatt des Infoportals?' };
    const oralH = p0.find(i => /^Mündliche/i.test(i.s) && Math.abs(i.y - nameH.y) < 40);
    const sumH = p0.filter(i => /^Ø/.test(i.s) && i.y < nameH.y + 4 && i.y > nameH.y - 70).sort((a, b) => a.x - b.x)[0];
    if (!oralH) return { ok: false, error: 'Die Spalte „Mündliche Leistungen“ wurde nicht gefunden.' };
    const sumX = sumH ? sumH.x - 8 : Infinity;
    const numItems = p0.filter(i => /^\d{1,3}$/.test(i.s) && Math.abs(i.x - nameH.x) <= 8 && i.y < nameH.y - 2);
    if (!numItems.length) return { ok: false, error: 'Auf dem Notenblatt wurden keine Schüler gefunden.' };
    const firstNumY = Math.max(...numItems.map(i => i.y));
    const headerItems = p0.filter(i => i.y < nameH.y + 4 && i.y > firstNumY + 5 && i.x > nameH.x + 20 && i.x < sumX);
    const dateCols = headerItems.filter(i => DATE.test(i.s)).sort((a, b) => a.x - b.x);
    if (!dateCols.length) warnings.push('Im Kopf des Notenblatts wurden keine Daten von Leistungsnachweisen gefunden.');
    dateCols.forEach((d, k) => out.cols.push({ idx: k, x: d.x, w: d.w, y: d.y, rawDate: d.s, date: isoDate(d.s, startYear, startYear), typ: '', factor: null, kind: 'small' }));
    headerItems.filter(i => !DATE.test(i.s)).forEach(i => {
      const below = out.cols.filter(c => i.y < c.y - 1); if (!below.length) return;
      const col = below.slice().sort((a, b) => dist(i, a) - dist(i, b))[0];
      if (dist(i, col) > 16) return;
      col.tail = (col.tail || []).concat(i);
    });
    out.cols.forEach(c => {
      const t = (c.tail || []).sort((a, b) => b.y - a.y || a.x - b.x).map(i => i.s).join(' ');
      const ty = /Typ:?\s*([A-Za-z])\b/.exec(t), fa = /Faktor:?\s*([\d.,]+)/.exec(t);
      if (ty) { c.typ = ty[1].toUpperCase(); c.kind = 'big'; }
      if (fa) c.factor = parseFloat(fa[1].replace(',', '.'));
      delete c.tail;
    });
    if (out.cols.some(c => c.kind === 'big' && !'SMN'.includes(c.typ))) warnings.push('Unbekannter Typ bei einem Leistungsnachweis – bitte nach dem Einlesen prüfen.');
    const firstDataX = out.cols.length ? Math.min(...out.cols.map(c => c.x)) : oralH.x - 40;

    /* Schüler, Seite für Seite */
    P.forEach((pg, pi) => {
      const items = pg.items;
      const nums = items.filter(i => /^\d{1,3}$/.test(i.s) && Math.abs(i.x - nameH.x) <= 8 && (pi > 0 || i.y < nameH.y - 2)).sort((a, b) => b.y - a.y);
      const endMark = items.find(i => /^Klassendurchschnitt/i.test(i.s));
      nums.forEach((n, k) => {
        const top = n.y + 5, bottom = k + 1 < nums.length ? nums[k + 1].y + 5 : (endMark ? endMark.y + 5 : -Infinity);
        const blk = items.filter(i => i !== n && i.y < top && i.y >= bottom);
        out.students.push(readStudent(+n.s, blk));
      });
    });
    function readStudent(num, blk) {
      const st = { n: num, last: '', first: '', cls: '', cells: {}, orals: [], bad: [] };
      const nameIt = blk.filter(i => i.x < firstDataX - 2);
      const text = rowsOf(nameIt).map(r => r.items.map(i => i.s).join(' ')).join(' ').replace(/\s+/g, ' ').trim();
      const cm = /\(([^)]{1,12})\)\s*$/.exec(text); if (cm) st.cls = cm[1].trim();
      const base = text.replace(/\(([^)]{1,12})\)\s*$/, '').trim();
      const ci = base.indexOf(',');
      if (ci >= 0) { st.last = base.slice(0, ci).trim(); st.first = base.slice(ci + 1).trim(); } else st.last = base;
      /* Noten in den Spalten der großen und kleinen LN */
      const oral = [];
      blk.filter(i => i.x >= firstDataX - 2 && i.x < sumX).forEach(i => {
        const col = out.cols.length ? out.cols.slice().sort((a, b) => dist(i, a) - dist(i, b))[0] : null;
        if (col && dist(i, col) <= 9 && !DATE.test(i.s)) { if (i.s !== '-' && i.s !== '–') st.cells[col.idx] = i.s; } else oral.push(i);
      });
      /* Mündliche Leistungen: Werte, Daten und Kürzel der Reihe nach zuordnen */
      const rows = rowsOf(oral);
      const values = [], dates = [], codes = [];
      rows.forEach(r => r.items.forEach(i => {
        if (GRADE.test(i.s)) values.push(i); else if (DATE.test(i.s)) dates.push(i); else if (CODE.test(i.s)) codes.push(i); else if (i.s !== '-') st.bad.push(i.s);
      }));
      values.forEach((v, k) => {
        const d = values.length === dates.length ? dates[k] : dates.filter(x => x.y < v.y + 1).sort((a, b) => Math.abs(a.x - v.x) - Math.abs(b.x - v.x))[0];
        const dx = d ? d.x : v.x;
        const c = values.length === codes.length ? codes[k] : codes.filter(x => x.y <= (d ? d.y + 1 : v.y)).sort((a, b) => Math.abs(a.x - dx) - Math.abs(b.x - dx))[0];
        st.orals.push({ raw: v.s, rawDate: d ? d.s : '', date: d ? isoDate(d.s, startYear, startYear) : null, code: c ? c.s : '' });
      });
      return st;
    }
    if (!out.students.length) return { ok: false, error: 'Auf dem Notenblatt wurden keine Schüler gefunden.' };
    out.students = out.students.filter(s => s.last || s.first);
    return out;
  }

  /* ---------- Übernahme in einen Kurs ---------- */
  const ORAL = { RA: 'ra', UB: 'ub', RF: 'ref', PN: 'prak' };
  const ORAL_NAMES = { GR: 'Grammatik', WZ: 'Wortschatz', WS: 'Workshop', EP: 'Ersatzprüfung', PF: 'Portfolio', LN: 'Lesenote', KSL: 'kleine sonstige Leistung' };
  /* deps: { R (rules.js), uid, up (Oberstufe?) } – gibt zurück, was neu entsteht; der Kurs selbst bleibt unverändert */
  function plan(p, c, deps) {
    const { R, uid } = deps; const up = R.isUpper(c);
    const rep = { newStudents: [], matched: 0, assessments: [], entries: 0, skipped: [], unknown: [], warnings: p.warnings.slice() };
    if (up) { rep.error = 'Notenblätter der Oberstufe (Q12/Q13, Punkte) kann Libretto noch nicht einlesen.'; return { rep }; }
    const byKey = new Map(), byLast = new Map();
    c.students.forEach(s => { byKey.set(nameKey(s.last, s.first), s); const k = deburr(s.last); byLast.set(k, byLast.has(k) ? null : s); });
    const sidOf = new Map(); const students = [];
    p.students.forEach(ps => {
      let s = byKey.get(nameKey(ps.last, ps.first)) || (byLast.get(deburr(ps.last)) && !ps.first ? byLast.get(deburr(ps.last)) : null);
      if (!s) { s = { id: uid(), last: ps.last, first: ps.first, name: ps.last && ps.first ? `${ps.last}, ${ps.first}` : (ps.last || ps.first) }; if (ps.cls) s.cls = ps.cls; students.push(s); rep.newStudents.push(s.name); byKey.set(nameKey(ps.last, ps.first), s); }
      else rep.matched++;
      sidOf.set(ps, s);
    });
    const assessments = [], entries = [], xfer = {};
    const sig = r => (!r || r.status === 'ent' || r.status === 'bef') ? '' : R.cellText(r, false); /* wie xSig in app.js */
    const tr = c.xfer || {};
    p.cols.forEach(col => {
      if (!col.date) { rep.warnings.push('Ein Leistungsnachweis ohne lesbares Datum wurde übersprungen.'); return; }
      const big = col.kind === 'big';
      const typ = big ? 'sa' : 'stex';
      const exist = c.assessments.find(a => a.type === typ && a.date === col.date);
      const title = big ? (col.typ === 'M' ? 'Mündliche Schulaufgabe' : col.typ === 'N' ? 'Nachschrift' : '') : '';
      const a = exist ? null : { id: uid(), type: typ, title, date: col.date, term: null, results: {} };
      if (a && !big && col.factor != null && col.factor !== 1) a.weight = col.factor;
      let n = 0;
      p.students.forEach(ps => {
        const raw = ps.cells[col.idx]; if (raw == null) return;
        const r = raw.toUpperCase() === 'N' ? { status: 'ent' } : R.parseCell(raw, false); /* „N“ auf dem Notenblatt = Nachschrift, also Nachtermin offen (nicht Note 6) */
        if (!r || r.error) { rep.unknown.push(`${ps.last}: „${raw}“ (${big ? 'SA' : 'Ex'} ${col.date.slice(8)}.${col.date.slice(5, 7)}.)`); return; }
        if (r.status === 'ent') rep.nachtermin = (rep.nachtermin || 0) + 1;
        if (!a) return;
        const s = sidOf.get(ps); a.results[s.id] = r; if (sig(r)) xfer[a.id + '|' + s.id] = sig(r); n++;
      });
      if (a) { assessments.push(a); rep.assessments.push({ id: a.id, kind: big ? 'sa' : 'stex', label: (big ? 'Schulaufgabe' : 'Stegreifaufgabe/Kurzarbeit') + (col.typ === 'M' ? ' (mündlich)' : col.typ === 'N' ? ' (Nachschrift)' : ''), date: col.date, factor: col.factor, n }); }
      else rep.skipped.push(`${big ? 'Schulaufgabe' : 'Leistungsnachweis'} vom ${col.date.slice(8)}.${col.date.slice(5, 7)}. ist schon in Libretto – nicht verändert`);
    });
    p.students.forEach(ps => {
      const s = sidOf.get(ps);
      ps.orals.forEach(o => {
        const r = R.parseCell(o.raw, false); if (!r || r.error) { rep.unknown.push(`${ps.last}: „${o.raw}“`); return; }
        const date = o.date || p.date || null; const code = (o.code || '').toUpperCase();
        const type = ORAL[code] || 'sonst';
        const dup = (c.entries || []).some(e => e.sid === s.id && e.date === date && e.type === type && sig(e) === sig(r));
        if (dup) return;
        const e = { id: uid(), sid: s.id, type, date, ...r };
        if (!ORAL[code] && code) e.note = (ORAL_NAMES[code] ? ORAL_NAMES[code] + ' (' + code + ')' : code);
        entries.push(e); xfer['e|' + e.id] = sig(r); rep.entries++;
      });
    });
    return { rep, students, assessments, entries, xfer };
  }

  /* Ist das PDF ein Notenblatt? (Kopfzeile „Schuljahr …“, Spalten „Name“ und „Mündliche Leistungen“) */
  function looksLike(pages) {
    const t = (pages[0] && pages[0].items || []).map(i => i.s).join(' ');
    return /Schuljahr\s*\d{4}/.test(t) && /Mündliche\s+Leistungen/.test(t) && /\bName\b/.test(t) && /Typ:|Faktor:/.test(t);
  }
  const API = { parse, plan, nameKey, looksLike };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Notenblatt = API;
})(typeof window !== 'undefined' ? window : globalThis);
