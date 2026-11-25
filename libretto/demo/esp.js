/* Libretto · Elternsprechtag: Ausdrucke des Infoportals einlesen · © 2026 theis
   Drei Sorten PDF (erkannt am Inhalt, nicht am Dateinamen):
   1. Terminliste   „Termine am Elternsprechtag TT.MM.JJJJ für …“ – Uhrzeit, Schüler/in (Klasse/Fach), Erziehungsberechtigte/r
   2. Belegungsplan „Elternsprechtag am Di., den TT.MM.JJJJ“ – Raster der Uhrzeiten mit GEBUCHT / PAUSE (ohne Namen)
   3. Bericht Leistungsstand (Klassenleitung, „Alle erzeugen“) – je Schüler alle Fächer mit großen/kleinen Noten, Gewichten und Durchschnitten.
      Jede Person steht dreimal darin (Elternexemplar, Rücklauf, Kopie für den Schülerakt) – gelesen wird sie einmal.
   Alles bleibt auf diesem Computer; die Funktionen hier rechnen nur und speichern nichts. */
'use strict';
const Esp = (() => {
  const deburr = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
  const isoOf = d => { const m = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(d || ''); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };
  const TIME = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/;
  const hhmm = s => { const m = TIME.exec(String(s).trim()); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; };

  /* PDF → Textstücke je Seite: Text, x, y (Grundlinie, von unten), Schriftgröße, fett/kursiv */
  async function readPdf(buf) {
    const lib = window.pdfjsLib || await import('./pdf.min.mjs'); lib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';
    const pdf = await lib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise; const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p); const tc = await page.getTextContent(); const vp = page.getViewport({ scale: 1 });
      pages.push({ w: vp.width, h: vp.height, items: tc.items.filter(it => it.str && it.str.trim()).map(it => ({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0,
        size: Math.round(Math.hypot(it.transform[0], it.transform[1]) * 10) / 10, f: (tc.styles[it.fontName] || {}).fontFamily || it.fontName || '' })) });
    }
    return pages;
  }
  /* Zeilen: Stücke mit (fast) gleicher Grundlinie, von oben nach unten, je Zeile von links nach rechts */
  function lines(items, tol = 2.2) {
    const rows = [];
    for (const it of items.slice().sort((a, b) => b.y - a.y)) { let r = rows.find(r => Math.abs(r.y - it.y) <= tol); if (!r) { r = { y: it.y, items: [] }; rows.push(r); } r.items.push(it); }
    rows.forEach(r => { r.items.sort((a, b) => a.x - b.x); r.text = r.items.map(i => i.s.trim()).join(' ').replace(/\s+/g, ' ').trim(); });
    return rows.sort((a, b) => b.y - a.y);
  }
  const allText = pages => pages.map(p => p.items.map(i => i.s).join(' ')).join(' ');
  function kind(pages) {
    const t = allText(pages.slice(0, 3)).replace(/\s+/g, ' ');
    if (/Termine am Elternsprechtag/i.test(t)) return 'list';
    if (/Elternsprechtag am\b/i.test(t) && /GEBUCHT|PAUSE|FREI/i.test(t)) return 'grid';
    if (/Information über das Notenbild/i.test(t) && /Leistungsnachweise/i.test(t)) return 'report';
    return '';
  }

  /* „Albers, Lea (9F/E)“ · „Hier eintragen (-/)“ · „Lorenz, Mara (12 G9/)“ */
  function splitStudent(txt) {
    const t = String(txt || '').replace(/\s+/g, ' ').trim();
    const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(t); const nm = (m ? m[1] : t).trim(), tag = m ? m[2] : '';
    const [c, ...sub] = tag.split('/'); const cls = String(c || '').replace(/^-$/, '').replace(/\s+/g, ' ').trim(); const subj = sub.join('/').trim();
    if (!nm || /^hier eintragen$/i.test(nm)) return { open: true, last: '', first: '', cls, subj };
    const k = nm.indexOf(','); return { last: (k < 0 ? nm : nm.slice(0, k)).trim(), first: (k < 0 ? '' : nm.slice(k + 1)).trim(), cls, subj };
  }
  const cleanParent = s => String(s || '').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim();

  /* 1. Terminliste: Spalten über die Kopfzeile „Termin · Schüler/in · Erziehungsberechtigte/r“ */
  function parseList(pages) {
    const out = { kind: 'list', date: '', room: '', teacher: '', slots: [], warnings: [] };
    for (const pg of pages) {
      const rows = lines(pg.items);
      const head = rows.find(r => /Termine am Elternsprechtag/i.test(r.text));
      if (head) {
        const m = /Elternsprechtag\s+(\d{1,2}\.\d{1,2}\.\d{4})(?:\s+für\s+(.*?))?(?:\s+in\s+(.*))?$/i.exec(head.text);
        if (m) { out.date = out.date || isoOf(m[1]); out.teacher = out.teacher || (m[2] || '').trim(); out.room = out.room || (m[3] || '').trim(); }
      }
      const hr = rows.find(r => r.items.some(i => /^Termin$/i.test(i.s.trim())) && r.items.some(i => /Schüler/i.test(i.s)));
      if (!hr) continue;
      const xs = { t: hr.items.find(i => /^Termin$/i.test(i.s.trim())).x, s: hr.items.find(i => /Schüler/i.test(i.s)).x, p: (hr.items.find(i => /Erziehungs|Eltern/i.test(i.s)) || { x: 1e9 }).x };
      for (const r of rows.filter(r => r.y < hr.y - 2)) {
        const ti = r.items.find(i => hhmm(i.s) && i.x < xs.s - 2); if (!ti) continue;
        const stu = r.items.filter(i => i.x >= xs.s - 4 && i.x < xs.p - 4).map(i => i.s.trim()).join(' ');
        const par = r.items.filter(i => i.x >= xs.p - 4).map(i => i.s.trim()).join(' ');
        out.slots.push({ t: hhmm(ti.s), st: 'booked', ...splitStudent(stu), parent: cleanParent(par) });
      }
    }
    out.slots.sort((a, b) => a.t.localeCompare(b.t));
    if (!out.slots.length) out.error = 'In der Terminliste wurden keine Termine gefunden.';
    return out;
  }
  /* 2. Belegungsplan: Uhrzeit, darunter (in derselben Spalte) GEBUCHT / PAUSE / FREI – fehlt der Eintrag, ist der Termin frei */
  function parseGrid(pages) {
    const out = { kind: 'grid', date: '', slots: [] };
    for (const pg of pages) {
      const rows = lines(pg.items);
      const head = rows.find(r => /Elternsprechtag am/i.test(r.text)); if (head) out.date = out.date || isoOf(head.text);
      const times = pg.items.filter(i => hhmm(i.s)).map(i => ({ t: hhmm(i.s), x: i.x, y: i.y }));
      const xsCol = [...new Set(times.map(t => Math.round(t.x)))].sort((a, b) => a - b);
      const colW = xsCol.length > 1 ? Math.min(...xsCol.slice(1).map((x, k) => x - xsCol[k])) : pg.w;
      const st = pg.items.filter(i => /^(GEBUCHT|PAUSE|FREI|BELEGT)$/i.test(i.s.trim()));
      for (const t of times) {
        const hit = st.find(s => s.x >= t.x - 2 && s.x < t.x + colW - 2 && t.y - s.y > 0 && t.y - s.y < 22);
        const w = hit ? hit.s.trim().toUpperCase() : '';
        out.slots.push({ t: t.t, st: w === 'PAUSE' ? 'pause' : w === 'GEBUCHT' || w === 'BELEGT' ? 'booked' : 'free' });
      }
    }
    const seen = new Set(); out.slots = out.slots.filter(s => !seen.has(s.t) && seen.add(s.t)).sort((a, b) => a.t.localeCompare(b.t));
    if (!out.slots.length) out.error = 'Im Belegungsplan wurden keine Uhrzeiten gefunden.';
    return out;
  }
  /* Terminliste und Belegungsplan zusammenführen: Raster aus dem Belegungsplan, Namen aus der Liste */
  function mergeSlots(list, grid) {
    const by = new Map();
    (grid || []).forEach(g => by.set(g.t, { t: g.t, st: g.st }));
    (list || []).forEach(l => { const g = by.get(l.t); by.set(l.t, { ...(g || {}), ...l, st: 'booked' }); });
    /* nur Terminliste: Lücken im gleichmäßigen Takt als „frei oder Pause“ zeigen */
    if (!grid || !grid.length) {
      const ts = [...by.keys()].sort(), mins = t => +t.slice(0, 2) * 60 + +t.slice(3);
      const steps = ts.slice(1).map((t, k) => mins(t) - mins(ts[k])).filter(d => d > 0), step = steps.length ? Math.min(...steps) : 0;
      if (step >= 3 && step <= 30) for (let k = 0; k < ts.length - 1; k++) for (let m = mins(ts[k]) + step; m < mins(ts[k + 1]); m += step) {
        const t = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); if (!by.has(t)) by.set(t, { t, st: 'gap' });
      }
    }
    return [...by.values()].sort((a, b) => a.t.localeCompare(b.t));
  }

  /* 3. Bericht Leistungsstand: je Seite eine Person. Spalten: Fach (+ Lehrkraft kursiv, kleiner) · GL/KL · Noten · Ø GL/Ø KL · Gesamt Ø.
     Noten: „S: 2  M: 3₁ 2-₀.₅  ksL: x“ – tiefgestellte (kleinere) Zahl = Gewicht, „x“ = nicht mitgeschrieben. */
  const GRADE = /^(?:[1-6][+-]?|x)$/i, AVG = /^\d,\d{1,2}$/;
  function parseReport(pages) {
    const out = { kind: 'report', cls: '', stand: '', year: '', school: '', students: [], warnings: [] };
    const seen = new Map();
    pages.forEach((pg, pi) => {
      const rows = lines(pg.items);
      const info = rows.findIndex(r => /Information über das Notenbild/i.test(r.text)); if (info < 0) return;
      const m = /bis zum\s+(\d{1,2}\.\d{1,2}\.\d{4})/.exec(rows[info].text); if (m) out.stand = out.stand || isoOf(m[1]);
      const cm = rows.map(r => /\bKlasse\s+(\S+)\s*$/.exec(r.text)).find(Boolean); if (cm) out.cls = out.cls || cm[1];
      const ym = rows.map(r => /Schuljahr\s+(\d{4}\/\d{2,4})/.exec(r.text)).find(Boolean); if (ym) out.year = out.year || ym[1];
      if (!out.school && rows[0]) out.school = rows[0].text;
      const name = (rows[info + 1] || {}).text || ''; if (!name) return;
      const copy = rows.slice(info + 1, info + 4).map(r => r.text).join(' ');
      const primary = /Verbleib bei den Erziehungsberechtigten/i.test(copy);
      const key = deburr(name);
      if (seen.has(key) && !primary) return;   /* Rücklauf und Kopie für den Schülerakt: dieselben Noten */
      /* Spaltengrenzen aus der Kopfzeile */
      const hdr = rows.find(r => r.items.some(i => /^Fach$/.test(i.s.trim())) && r.items.some(i => /Leistungsnachweise/.test(i.s)));
      if (!hdr) { out.warnings.push(`Seite ${pi + 1}: Kopfzeile der Tabelle nicht gefunden.`); return; }
      const xLN = hdr.items.find(i => /Leistungsnachweise/.test(i.s)).x;
      const avgHead = pg.items.filter(i => /^Ø$/.test(i.s.trim()) || /^Ø\s?(GL|KL)$/.test(i.s.trim()) || /^Gesamt/.test(i.s.trim()));
      const xAvg = Math.min(...avgHead.filter(i => i.y > hdr.y - 14).map(i => i.x).concat([xLN + 120]));
      const xTot = (pg.items.find(i => /^Gesamt/.test(i.s.trim())) || { x: xAvg + 40 }).x;
      const yTop = Math.min(hdr.y, ...avgHead.map(i => i.y)) - 6;
      const foot = rows.find(r => r.y < yTop && (/^(München|.*,\s*den\s+\d)/.test(r.text) || /Schulleitung/.test(r.text)));
      const yBot = foot ? foot.y + 4 : 0;
      const body = pg.items.filter(i => i.y < yTop && i.y > yBot);
      const labs = body.filter(i => /^(GL|KL)$/.test(i.s.trim())).sort((a, b) => b.y - a.y);
      if (!labs.length) { seen.set(key, true); out.students.push({ name, remarks: [], subjects: [] }); return; }
      const xLab = Math.min(...labs.map(l => l.x));
      /* Fächer: links von GL/KL; Normalschrift = Fach, kleinere Schrift = Lehrkraft */
      const left = body.filter(i => i.x < xLab - 4);
      /* Schriftgröße der Fachnamen: die der Stücke auf Höhe der GL-Zeilen (Bemerkungen können größer gesetzt sein) */
      const szs = labs.filter(l => /GL/.test(l.s)).map(l => Math.max(0, ...left.filter(i => Math.abs(i.y - l.y) < 4).map(i => i.size))).filter(Boolean).sort((a, b) => a - b);
      const mainSize = szs.length ? szs[Math.floor(szs.length / 2)] : Math.max(...left.map(i => i.size));
      const subjRows = lines(left.filter(i => i.size >= mainSize - .3 || i.x + i.w > xLab)), tchRows = lines(left.filter(i => i.size < mainSize - .3 && i.x + i.w <= xLab));
      const subjects = subjRows.map(r => ({ subj: r.text, y: r.y, teacher: '', big: [], small: [], avgBig: '', avgSmall: '', avg: '' }));
      /* Fachnamen über zwei Zeilen („Kath. / Religionslehre“): Zeilen ohne eigenes GL zusammenfassen */
      for (let k = subjects.length - 1; k > 0; k--) { const a = subjects[k - 1], b = subjects[k];
        const between = labs.filter(l => l.y <= a.y + 3 && l.y > b.y + 3 && /GL/.test(l.s)).length;
        if (!between && a.y - b.y < 12) { a.subj = a.subj + ' ' + b.subj; subjects.splice(k, 1); } }
      /* Bereich je Fach: von der GL-Zeile bis vor das nächste GL */
      const gls = labs.filter(l => /GL/.test(l.s)).sort((a, b) => b.y - a.y);
      /* Zeilen ohne eigenes GL sind keine Fächer, sondern Bemerkungen („… Ziel der Jahrgangsstufe gefährdet“, „Auf die Bewertung des Rechtschreibens …“) */
      const notes = [];
      for (let k = subjects.length - 1; k >= 0; k--) { const s = subjects[k]; const g = gls.filter(l => Math.abs(l.y - s.y) < 14).sort((a, b) => Math.abs(a.y - s.y) - Math.abs(b.y - s.y))[0];
        if (g && s.subj.length <= 40) s.yGL = g.y; else { notes.unshift({ y: s.y, text: s.subj }); subjects.splice(k, 1); } }
      /* mehrzeilige Bemerkung zusammenfassen */
      const remarks = []; notes.forEach(n => { const last = remarks[remarks.length - 1]; if (last && last.y - n.y < 12 && !/[.!]$/.test(last.text)) { last.text += ' ' + n.text; last.y = n.y; } else remarks.push({ ...n }); });
      subjects.sort((a, b) => b.yGL - a.yGL);
      const yRem = remarks.length ? Math.max(...remarks.map(r => r.y)) + 4 : yBot;
      subjects.forEach((s, k) => { s.yEnd = k < subjects.length - 1 ? subjects[k + 1].yGL + 4 : Math.max(yBot, yRem); s.top = s.yGL + 6; });
      tchRows.forEach(r => { const s = subjects.find(s => r.y <= s.top + 8 && r.y > s.yEnd); if (s && !s.teacher) s.teacher = r.text; });
      for (const s of subjects) {
        const own = body.filter(i => i.y <= s.top && i.y > s.yEnd);
        const kl = labs.find(l => /KL/.test(l.s) && l.y <= s.top && l.y > s.yEnd);
        const yKL = kl ? kl.y + 3 : -1e9;
        /* Durchschnitte */
        own.filter(i => AVG.test(i.s.trim()) && i.x >= xAvg - 6).forEach(i => {
          if (i.x >= xTot - 6) s.avg = i.s.trim(); else if (i.y >= yKL) s.avgBig = i.s.trim(); else s.avgSmall = i.s.trim(); });
        /* Noten: Stücke zwischen GL/KL und den Durchschnitten; Art („S:“), Note (Normalschrift), Gewicht (kleiner, tiefer) */
        const gi = own.filter(i => i.x > xLab + 6 && i.x < xAvg - 6);
        const bySize = Math.max(...gi.map(i => i.size), 0);
        const rowsG = lines(gi.filter(i => i.size >= bySize - .3), 1.5);
        const subs = gi.filter(i => i.size < bySize - .3);
        for (const r of rowsG) {
          const list = r.y >= yKL ? s.big : s.small; let typ = '';
          /* Stücke können mehrere Wörter enthalten („S: 2 3“) – in Wörter mit Position zerlegen */
          const toks = []; r.items.forEach(i => { const ws = i.s.split(/(\s+)/); let x = i.x; const cw = i.w && i.s.length ? i.w / i.s.length : 4.4; ws.forEach(w => { if (w.trim()) toks.push({ s: w.trim(), x, x2: x + w.length * cw }); x += w.length * cw; }); });
          const gt = [];
          toks.forEach(t => {
            if (/^[A-Za-zÄÖÜäöü]+:$/.test(t.s)) { typ = t.s.slice(0, -1); return; }
            if (!GRADE.test(t.s)) return;
            const e = { t: typ, g: t.s.toLowerCase() === 'x' ? 'x' : t.s, w: 1 }; list.push(e); gt.push({ e, x: t.x });
          });
          /* Gewicht: kleinere, tiefer gesetzte Zahl direkt rechts neben einer Note → gehört zur nächsten Note links davon */
          subs.filter(u => r.y - u.y > 0 && r.y - u.y < 6).forEach(u => {
            const g = gt.filter(q => q.x < u.x - .5).sort((a, b) => b.x - a.x)[0]; const wv = parseFloat(u.s.trim().replace(',', '.'));
            if (g && isFinite(wv)) g.e.w = wv; });
        }
      }
      const rec = { name, remarks: remarks.map(r => r.text), subjects: subjects.map(({ subj, teacher, big, small, avgBig, avgSmall, avg }) => ({ subj, teacher, big, small, avgBig, avgSmall, avg })) };
      if (seen.has(key)) out.students[out.students.findIndex(x => deburr(x.name) === key)] = rec; else out.students.push(rec);
      seen.set(key, true);
    });
    if (!out.students.length) out.error = 'Im Bericht wurden keine Schülerinnen und Schüler gefunden.';
    return out;
  }
  function parse(pages) {
    const k = kind(pages);
    if (k === 'list') return parseList(pages);
    if (k === 'grid') return parseGrid(pages);
    if (k === 'report') return parseReport(pages);
    return { kind: '', error: pages.length && pages[0].items.length ? 'Das ist weder eine Terminliste, ein Belegungsplan noch ein Bericht „Leistungsstand“ aus dem Infoportal.' : 'Die Datei enthält keinen Text (vielleicht ein Foto oder Scan).' };
  }

  /* Zuordnung Termin → Schüler in den eigenen Kursen. Bei Zweifel lieber keine Zuordnung (dann wählt man selbst). */
  const ABBR = { e: 'englisch', it: 'italienisch', f: 'französisch', l: 'latein', d: 'deutsch', m: 'mathematik', g: 'geschichte', geo: 'geographie', b: 'biologie', c: 'chemie', ph: 'physik',
    k: 'katholische', ev: 'evangelische', eth: 'ethik', mu: 'musik', ku: 'kunst', s: 'spanisch', sp: 'sport', gr: 'griechisch', inf: 'informatik', wr: 'wirtschaft', pug: 'politik', smw: 'sport' };
  const subjHit = (abbr, subject) => { const a = deburr(abbr), s = deburr(subject); if (!a || !s) return false; return s.startsWith(deburr(ABBR[a] || a)) || s.startsWith(a); };
  const nameHit = (slot, st) => {
    const l1 = deburr(slot.last), f1 = deburr(slot.first), l2 = deburr(st.last), f2 = deburr(st.first);
    if (!l1 || l1 !== l2) return false;
    if (!f1 || !f2) return !f1 && !f2 ? true : false;
    return f1 === f2 || f1.split(' ')[0] === f2.split(' ')[0];
  };
  /* gibt [{ c, s }] zurück – alle eigenen Kurse, in denen die Person steht; der passendste zuerst */
  function matchStudent(slot, courses, opts = {}) {
    if (!slot || slot.open || !slot.last) return [];
    const cls = String(slot.cls || '').replace(/\s+/g, '').toUpperCase();
    let hits = [];
    courses.forEach(c => (c.students || []).forEach(s => { if (nameHit(slot, s)) hits.push({ c, s }); }));
    const clsOk = h => { const k = String(h.s.cls || (opts.classOf ? opts.classOf(h.c) : '') || '').replace(/\s+/g, '').toUpperCase(); return !cls || !k || k === cls || /^(Q?1[123])/.test(cls); };
    hits = hits.filter(clsOk);
    /* derselbe Name zweimal in verschiedenen Personen eines Kurses → unsicher */
    const per = new Map(); hits.forEach(h => per.set(h.c.id, (per.get(h.c.id) || 0) + 1));
    if ([...per.values()].some(n => n > 1)) return [];
    const score = h => (subjHit(slot.subj, h.c.subject) ? 2 : 0) + (cls && opts.classOf && String(opts.classOf(h.c) || '').toUpperCase() === cls ? 1 : 0);
    return hits.sort((a, b) => score(b) - score(a));
  }
  /* Termin → Person im Bericht Leistungsstand („Vorname Nachname“) */
  function matchReport(slot, report) {
    if (!report || !slot || slot.open || !slot.last) return null;
    const cls = String(slot.cls || '').replace(/\s+/g, '').toUpperCase(), rc = String(report.cls || '').replace(/\s+/g, '').toUpperCase();
    if (cls && rc && cls !== rc) return null;
    const l = deburr(slot.last), f = deburr(slot.first).split(' ')[0];
    const hits = report.students.filter(st => { const n = ' ' + deburr(st.name) + ' '; return n.endsWith(' ' + l + ' ') && (!f || n.startsWith(' ' + f + ' ')); });
    return hits.length === 1 ? hits[0] : null;
  }
  return { readPdf, kind, parse, parseList, parseGrid, parseReport, mergeSlots, matchStudent, matchReport, splitStudent, lines, deburr };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Esp;
