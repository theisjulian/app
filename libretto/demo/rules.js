/* Libretto · Regeln für das bayerische Gymnasium (GSO)
   Rechtsgrundlagen (Stand GSO, G9):
   § 22 große LN · § 23 kleine LN · § 26 Bewertung · § 27 Nachholung · § 28 Jahresfortgangsnote 5–11
   § 29 Bewertung in 12/13 · § 30 Vorrücken · § 40 Zwischenzeugnis / Information über das Notenbild
   © 2026 theis */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Rules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Arten von Leistungsnachweisen ---------- */
  const TYPES = {
    sa:   { label: 'Schulaufgabe',          short: 'SA',  big: true,  area: 'schriftlich' },
    jst:  { label: 'Jahrgangsstufentest',   short: 'JST', big: false, area: 'schriftlich', choose: true },
    stex: { label: 'Stegreifaufgabe',       short: 'Ex',  big: false, area: 'schriftlich' },
    ka:   { label: 'Kurzarbeit',            short: 'KA',  big: false, area: 'schriftlich' },
    flt:  { label: 'Fachlicher Leistungstest', short: 'LT', big: false, area: 'schriftlich' },
    ra:   { label: 'Rechenschaftsablage',   short: 'RA',  big: false, area: 'mündlich' },
    ub:   { label: 'Unterrichtsbeitrag',    short: 'UB',  big: false, area: 'mündlich' },
    ref:  { label: 'Referat',               short: 'Ref', big: false, area: 'mündlich' },
    prak: { label: 'Praktische Leistung',   short: 'Pr',  big: false, area: 'praktisch' },
    proj: { label: 'Projekt',               short: 'Proj',big: false, area: 'schriftlich' },
    sonst:{ label: 'Sonstiger kleiner LN',  short: 'kLN', big: false, area: 'schriftlich' },
  };
  const AREAS = ['schriftlich', 'mündlich', 'praktisch'];
  /* Zählt ein Nachweis als großer LN? Jahrgangsstufentest: je nach Entscheidung der Schule (countAs: 'big' | 'small') */
  const isBig = a => !!a && (a.type === 'sa' || (a.type === 'jst' && a.countAs === 'big'));
  const areaOf = a => a.area || (TYPES[a.type] || TYPES.sonst).area;

  /* Sonderstatus einer Leistung */
  const STATUS = {
    n6:   { label: 'Note 6 – versäumt ohne Entschuldigung / verweigert (§ 26 Abs. 4 GSO)', short: '6*', counts: true },
    us:   { label: 'Unterschleif', short: 'U', counts: true },
    ent:  { label: 'Entschuldigt gefehlt – Nachtermin offen (§ 27 GSO)', short: 'E', counts: false, open: true },
    bef:  { label: 'Befreit / entfällt', short: 'B', counts: false },
  };

  /* ---------- Fächer ---------- */
  const LANGS = ['Englisch', 'Französisch', 'Italienisch', 'Latein', 'Spanisch', 'Griechisch', 'Russisch', 'Chinesisch', 'Tschechisch', 'Türkisch', 'Japanisch', 'Polnisch', 'Portugiesisch', 'Arabisch'];
  const SUBJECTS = ['Deutsch', 'Mathematik', ...LANGS.slice(0, 7), 'Biologie', 'Chemie', 'Physik', 'Informatik', 'Natur und Technik', 'Geschichte', 'Geographie', 'Politik und Gesellschaft', 'Wirtschaft und Recht', 'Religionslehre (ev.)', 'Religionslehre (kath.)', 'Ethik', 'Kunst', 'Musik', 'Sport', 'Wirtschaftsinformatik', 'Sozialkunde', 'W-Seminar', 'P-Seminar'];
  const isLang = s => LANGS.some(l => (s || '').toLowerCase().startsWith(l.toLowerCase()));

  /* Mindestzahl Schulaufgaben (§ 22 Abs. 2 GSO) – nur, wo die GSO sie festlegt */
  function minSA(course) {
    const g = +course.grade, s = (course.subject || '').toLowerCase();
    if (g < 5 || g > 11 || !course.hasSA) return null;
    if (s.startsWith('deutsch')) return 3;
    if (s.startsWith('mathe')) return g <= 7 ? 4 : 3;
    if (isLang(course.subject)) return (+course.hours || 0) >= 4 ? 4 : 3;
    return null;
  }

  /* ---------- Noten & Punkte ---------- */
  const isUpper = c => +c.grade >= 12;
  /* Eingabe einer Zelle verstehen. Noten: 1–6 mit +/-; Punkte: 0–15; Kürzel: e (entschuldigt), b (befreit), n (Note 6 versäumt/verweigert), u (Unterschleif) */
  function parseCell(txt, upper) {
    const t = String(txt == null ? '' : txt).trim().toLowerCase().replace(',', '.').replace('–', '-');
    if (!t) return null;
    if (t === 'e' || t === 'a') return { status: 'ent' };
    if (t === 'b') return { status: 'bef' };
    if (t === 'n') return { status: 'n6' };
    if (t === 'u') return { status: 'us' };
    if (upper) {
      if (!/^\d{1,2}$/.test(t)) return { error: 'Punkte 0–15' };
      const p = +t; if (p < 0 || p > 15) return { error: 'Punkte 0–15' };
      return { v: p };
    }
    const m = /^([1-6])([+-]?)$/.exec(t);
    if (!m) return { error: 'Note 1–6 (auch 2+ / 2-)' };
    if (m[1] === '1' && m[2] === '+') return { v: 1, tend: '+' };
    if (m[1] === '6' && m[2] === '-') return { v: 6 };
    return { v: +m[1], tend: m[2] || '' };
  }
  function cellText(r, upper) {
    if (!r) return '';
    if (r.status) return { ent: 'E', bef: 'B', n6: upper ? '0*' : '6*', us: 'U' }[r.status];
    if (r.v == null) return '';
    return upper ? String(r.v) : String(r.v) + (r.tend || '');
  }
  /* Zahlwert, der in die Berechnung eingeht (Tendenzen zählen nicht) */
  function valueOf(r, upper) {
    if (!r) return null;
    if (r.status === 'n6' || r.status === 'us') return upper ? 0 : 6;
    if (r.status) return null;
    return r.v == null ? null : +r.v;
  }

  const POINT_GRADE = p => p >= 13 ? 1 : p >= 10 ? 2 : p >= 7 ? 3 : p >= 4 ? 4 : p >= 1 ? 5 : 6;
  const POINT_LABEL = p => ['6', '5-', '5', '5+', '4-', '4', '4+', '3-', '3', '3+', '2-', '2', '2+', '1-', '1', '1+'][p];

  /* Notenschlüssel: Punkte -> Note. thresholds = Mindestpunktzahl für Note 1..5 (Note 6 darunter) */
  function keyGrade(points, key) {
    if (points == null || !key || !key.thresholds) return null;
    for (let n = 1; n <= 5; n++) if (points >= key.thresholds[n - 1]) return n;
    return 6;
  }
  /* Vorschlag für einen Notenschlüssel (Prozent je Note, anpassbar) */
  const DEFAULT_PCT = [87.5, 75, 62.5, 50, 25];
  function suggestKey(max, pct = DEFAULT_PCT, step = 0.5) {
    const r = v => Math.ceil(v / step) * step;
    return { max, thresholds: pct.map(p => r(max * p / 100)), pct: pct.slice() };
  }
  /* Prozentgrenzen aus „Ankern“: Note 4 ab p4 %, Note 5 ab p5 %; Noten 1–3 gleichmäßig zwischen p4 und 100 % */
  function pctFromAnchors(p4, p5) { const st = (100 - p4) / 4; return [p4 + 3 * st, p4 + 2 * st, p4 + st, p4, p5].map(x => Math.round(x * 10) / 10); }
  /* Oberstufe: 5 Punkte ab p5 %, 1 Punkt ab p1 %; 6–15 gleichmäßig zwischen p5 und 100 %, 2–4 zwischen p1 und p5 */
  function pct15FromAnchors(p5, p1) {
    const out = [];
    for (let p = 15; p >= 1; p--) out.push(Math.round((p >= 5 ? p5 + (100 - p5) * (p - 5) / 11 : p1 + (p5 - p1) * (p - 1) / 4) * 10) / 10);
    return out;
  }
  /* Oberstufe: Punkte aus Rohpunkten */
  function keyPoints(points, key) {
    if (points == null || !key || !key.pointThresholds) return null;
    for (let p = 15; p >= 1; p--) if (points >= key.pointThresholds[15 - p]) return p;
    return 0;
  }
  const DEFAULT_PCT15 = [95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 33, 27, 20];
  function suggestKey15(max, pct = DEFAULT_PCT15, step = 0.5) {
    const r = v => Math.ceil(v / step) * step;
    return { max, pointThresholds: pct.map(p => r(max * p / 100)), pct15: pct.slice() };
  }

  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  function wmean(items) { // [{v,w}]
    const it = items.filter(i => i.v != null && i.w > 0);
    const W = it.reduce((s, i) => s + i.w, 0);
    return W ? it.reduce((s, i) => s + i.v * i.w, 0) / W : null;
  }

  /* Gewicht eines kleinen LN: individuelles Gewicht > Gewicht der Art (Kurseinstellung) > 1 */
  function weightOf(a, course) {
    if (a.weight != null && a.weight !== '') return +a.weight;
    const w = course.typeWeights && course.typeWeights[a.type];
    return w != null ? +w : 1;
  }

  /* Gesamtnote der großen LN: gewichteter Schnitt (Gewicht je Arbeit, Standard 1 = volle Schulaufgabe) */
  function bigAverage(list, sid, upper) {
    return wmean(list.map(a => ({ v: valueOf(a.results && a.results[sid], upper), w: a.bigWeight != null && a.bigWeight !== '' ? +a.bigWeight : 1 })));
  }
  /* Gesamtnote der kleinen LN eines Schülers */
  function smallAverage(course, list, sid, upper) {
    const items = list.map(a => ({ a, v: valueOf(a.results && a.results[sid], upper), w: weightOf(a, course) }));
    if (course.smallMode === 'areas') {
      const aw = course.areaWeights || { schriftlich: 1, 'mündlich': 1, praktisch: 1 };
      const parts = AREAS.map(ar => ({ v: wmean(items.filter(i => areaOf(i.a) === ar)), w: +(aw[ar] ?? 1) }));
      return wmean(parts);
    }
    return wmean(items);
  }

  /* Verhältnis große : kleine LN (§ 28 Abs. 1 GSO): 2 SA -> 1:1, mehr als 2 -> 2:1 */
  function saRatio(course) {
    if (course.ratio === '1:1') return 1;
    if (course.ratio === '2:1') return 2;
    const n = Math.max(+course.saPlanned || 0, (course.assessments || []).filter(a => a.type === 'sa').length);
    return n > 2 ? 2 : 1;
  }

  /* Rundung in 5–11: Vorschlag für die Zeugnisnote. Genau x,5 = pädagogische Entscheidung der Lehrkraft */
  function gradeSuggestion(x) {
    if (x == null) return null;
    const v = Math.round(x * 100) / 100, base = Math.floor(v), fr = +(v - base).toFixed(2);
    if (Math.abs(fr - 0.5) < 0.005) return { grade: null, borderline: true, options: [base, base + 1], text: base + '/' + (base + 1) };
    const g = Math.min(6, Math.max(1, fr < 0.5 ? base : base + 1));
    return { grade: g, borderline: fr >= 0.4 && fr <= 0.6, text: String(g) };
  }
  /* Rundung in 12/13 (§ 29 GSO): kaufmännisch; Aufrundung auf 1 Punkt nicht zulässig */
  function roundPoints(x) {
    if (x == null) return null;
    if (x < 1) return 0;
    return Math.min(15, Math.floor(x + 0.5 + 1e-9));
  }

  /* Leistungsnachweise filtern (Stichtag / Halbjahr / Abschnitt) */
  function inScope(a, scope) {
    if (!scope) return true;
    if (scope.term) return a.term === scope.term;
    if (scope.until && a.date && a.date > scope.until) return false;
    return true;
  }

  /* ---------- Einzelnoten (z. B. Unterrichtsbeiträge, Rechenschaftsablagen einzelner Schüler) ----------
     course.entries = [{ id, sid, type, date, v, tend, status, note, weight, term }]
     Jede Einzelnote zählt als eigener kleiner Leistungsnachweis (Gewicht nach Art bzw. individuell). */
  function entryItems(course, sid, scope) {
    return (course.entries || []).filter(e => e.sid === sid && inScope(e, scope)).map(e => ({ id: e.id, type: e.type, weight: e.weight, area: e.area, date: e.date, term: e.term, results: { [sid]: e }, single: true }));
  }

  /* ---------- Berechnung 5–11 ---------- */
  function computeLower(course, sid, scope) {
    const as = (course.assessments || []).filter(a => inScope(a, scope));
    const big = as.filter(a => TYPES[a.type] && isBig(a));
    const small = as.filter(a => TYPES[a.type] && !isBig(a)).concat(entryItems(course, sid, scope));
    const saVals = big.map(a => valueOf(a.results && a.results[sid], false)).filter(v => v != null);
    const saAvg = course.hasSA ? bigAverage(big, sid, false) : null;
    const smAvg = smallAverage(course, small, sid, false);
    const r = saRatio(course);
    let total = null, note = '';
    if (course.hasSA && saAvg != null && smAvg != null) total = (saAvg * r + smAvg) / (r + 1);
    else if (course.hasSA && saAvg != null) { total = saAvg; note = 'nur große LN'; }
    else if (smAvg != null) { total = smAvg; if (course.hasSA) note = 'nur kleine LN'; }
    const open = as.filter(a => a.results && a.results[sid] && a.results[sid].status === 'ent').map(a => a.id);
    return { saAvg, smAvg, ratio: r, total, suggestion: gradeSuggestion(total), note, open, nSA: saVals.length };
  }

  /* ---------- Berechnung 12/13 ---------- */
  /* W-Seminar (§ 20, § 29 Abs. 2 GSO): Halbjahresleistungen nur in 12/1 und 12/2 – unabhängig von der eingestellten Jahrgangsstufe.
     Ältere Einträge in 13/1 oder 13/2 (aus Libretto ≤ 0.9.5) bleiben sichtbar, damit nichts verschwindet. */
  function termsOf(course) {
    if (course.seminar) {
      const base = ['12/1', '12/2'];
      const used = new Set([...(course.assessments || []).map(a => a.term), ...(course.entries || []).map(e => e.term)]);
      return base.concat(['13/1', '13/2'].filter(t => used.has(t)));
    }
    return +course.grade === 12 ? ['12/1', '12/2'] : ['13/1', '13/2'];
  }
  /* Gibt es in diesem Halbjahr eine Schulaufgabe? (§ 29 GSO; 13/2: nur Deutsch, Mathematik, Leistungsfach) */
  function termHasSA(course, term) {
    if (course.seminar) return false;
    if (term === '13/2') {
      const s = (course.subject || '').toLowerCase();
      return !!course.lf || s.startsWith('deutsch') || s.startsWith('mathe');
    }
    return true;
  }
  function computeTerm(course, sid, term) {
    const as = (course.assessments || []).filter(a => a.term === term);
    const big = as.filter(a => TYPES[a.type] && isBig(a));
    const small = as.filter(a => TYPES[a.type] && !isBig(a)).concat(entryItems(course, sid, { term }));
    const saV = bigAverage(big, sid, true);
    const smV = smallAverage(course, small, sid, true);
    let raw = null, note = '';
    if (termHasSA(course, term)) {
      if (saV != null && smV != null) raw = (saV + smV) / 2;
      else if (saV != null) { raw = saV; note = 'nur Schulaufgabe'; }
      else if (smV != null) { raw = smV; note = 'Schulaufgabe fehlt'; }
    } else raw = smV;
    const pts = roundPoints(raw);
    const open = as.filter(a => a.results && a.results[sid] && a.results[sid].status === 'ent').map(a => a.id);
    return { term, sa: saV, small: smV, raw, points: pts, note, open, zero: pts === 0, under5: pts != null && pts < 5 };
  }
  /* Seminararbeit (§ 29 GSO): (Arbeit × 2 + Prüfungsgespräch) × 2/3, gerundet */
  function seminarPaper(arbeit, gespraech) {
    if (arbeit == null || gespraech == null || arbeit === '' || gespraech === '') return null;
    return Math.round(((+arbeit) * 2 + (+gespraech)) * 2 / 3);
  }

  /* ---------- W-Seminar (Wissenschaftspropädeutisches Seminar) ----------
     § 20 GSO: belegt in 12/1 bis 13/1, mit Seminararbeit · § 21 Abs. 3: in 12/1 und 12/2 je mindestens zwei kleine LN
     § 24: Thema bis Ende 12/1; Abgabe spätestens am zweiten Unterrichtstag im November der Jgst. 13 (Uhrzeit und Verlängerung legt die Schule fest)
     § 29 Abs. 2: Halbjahresleistung 12/1, 12/2 = Durchschnitt der kleinen LN, gerundet, keine Aufrundung auf 1 Punkt
     § 29 Abs. 6: Gesamtleistung Seminararbeit = (2 × Arbeit + Prüfungsgespräch) × 2/3, gerundet (höchstens 30 Punkte)
     § 44 Abs. 2: Zulassung nur, wenn abgegeben, weder Arbeit noch Prüfungsgespräch 0 Punkte und Gesamtleistung mindestens 9 Punkte;
     § 44 Abs. 1: unter 9 Punkten schriftliche Information bis Ende 13/1. Libretto dokumentiert nur – über die Zulassung entscheidet die Schule. */
  const SEM_MID = '02-15';   /* Halbjahreswechsel, falls kein Stichtag eingestellt ist (nur für Vorschläge und Hinweise) */
  const pad2 = n => String(n).padStart(2, '0');
  /* Ausbildungsabschnitt zu einem Datum; start = Kalenderjahr, in dem die Jgst. 12 beginnt */
  function semTermAt(start, date, mid = SEM_MID) {
    start = +start; if (!start || !date) return '12/1';
    if (date < `${start + 1}-${mid}`) return '12/1';
    if (date < `${start + 1}-08-01`) return '12/2';
    if (date < `${start + 2}-${mid}`) return '13/1';
    return '13/2';
  }
  /* Ist ein Abschnitt (12/1, 12/2, 13/1) am Tag „today“ schon vorbei? */
  function semTermOver(start, term, today, mid = SEM_MID) {
    start = +start; if (!start || !today) return false;
    const end = { '12/1': `${start + 1}-${mid}`, '12/2': `${start + 1}-08-01`, '13/1': `${start + 2}-${mid}` }[term];
    return !!end && today >= end;
  }
  /* Vorschlag Abgabetermin: zweiter Unterrichtstag im November (§ 24 Abs. 2 GSO). isFree(iso) = Ferien/Feiertag */
  function secondSchoolDayNov(year, isFree = () => false) {
    let n = 0;
    for (let d = 1; d <= 30; d++) {
      const iso = `${year}-11-${pad2(d)}`, wd = new Date(Date.UTC(year, 10, d)).getUTCDay();
      if (wd === 0 || wd === 6 || isFree(iso)) continue;
      if (++n === 2) return iso;
    }
    return null;
  }
  const semNum = v => v === '' || v == null || isNaN(+v) ? null : +v;
  /* Zahl der kleinen LN mit Wert eines Schülers in einem Halbjahr (Nachtermin offen und befreit zählen nicht) */
  function countSmall(course, sid, term) {
    const as = (course.assessments || []).filter(a => a.term === term && TYPES[a.type] && !isBig(a));
    const n1 = as.filter(a => valueOf(a.results && a.results[sid], true) != null).length;
    const n2 = (course.entries || []).filter(e => e.sid === sid && e.term === term && valueOf(e, true) != null).length;
    return n1 + n2;
  }
  /* Stand eines Schülers im W-Seminar: Gesamtleistung und Hinweise (level: red | warn | info) */
  function semStatus(course, sid, today, mid = SEM_MID) {
    const cfg = course.sem || {}, st = (cfg.st || {})[sid] || {}, sp = (course.seminarPaper || {})[sid] || {};
    const a = semNum(sp.arbeit), p = semNum(sp.gespraech), g = seminarPaper(sp.arbeit, sp.gespraech);
    const out = [];
    if (a === 0 || p === 0) out.push({ level: 'red', key: 'zero', text: `${a === 0 ? 'Seminararbeit' : 'Prüfungsgespräch'} mit 0 Punkten – damit ist keine Zulassung zur Abiturprüfung möglich (§ 44 Abs. 2 Nr. 6 GSO).` });
    if (g != null && g < 9) out.push({ level: 'red', key: 'u9', text: `Gesamtleistung ${g} von 30 Punkten – mindestens 9 Punkte sind für die Zulassung nötig (§ 44 Abs. 2 Nr. 3 GSO). Schriftliche Information bis Ende 13/1 (§ 44 Abs. 1 GSO).` });
    const due = st.verl || cfg.deadline;
    if (!st.abgabe && due && today && today > due) out.push({ level: 'red', key: 'late', text: `Seminararbeit nicht als abgegeben vermerkt – Frist ${fmtDate(due)}${st.verl ? ' (verlängert)' : ''}. Abgabe ist Voraussetzung für die Zulassung (§ 44 Abs. 2 Nr. 6 GSO).` });
    else if (st.abgabe && due && st.abgabe > due) out.push({ level: 'warn', key: 'after', text: `Abgegeben am ${fmtDate(st.abgabe)} – nach der Frist (${fmtDate(due)}). Über die Folgen entscheidet die Schule.` });
    if (!(st.thema || '').trim() && (cfg.themeDue ? today > cfg.themeDue : semTermOver(cfg.start, '12/1', today, mid))) out.push({ level: 'warn', key: 'thema', text: 'Thema noch nicht eingetragen – es ist bis zum Ende von 12/1 festzulegen (§ 24 Abs. 1 GSO).' });
    ['12/1', '12/2'].forEach(t => {
      const r = computeTerm(course, sid, t);
      if (r.zero) out.push({ level: 'red', key: 'hj0', text: `Halbjahresleistung ${t}: 0 Punkte.` });
      if (semTermOver(cfg.start, t, today, mid)) { const n = countSmall(course, sid, t); if (n < 2) out.push({ level: 'info', key: 'n' + t, text: `${t}: ${n === 0 ? 'kein' : 'nur ein'} kleiner Leistungsnachweis eingetragen – vorgeschrieben sind mindestens zwei (§ 21 Abs. 3 GSO).` }); }
    });
    ['12/1', '12/2', '13/1'].forEach(t => {
      if (semTermOver(cfg.start, t, today, mid) && !(st.termine || []).some(x => x.term === t)) out.push({ level: 'info', key: 'b' + t, text: `${t}: kein Betreuungstermin vermerkt (Empfehlung des ISB: mindestens ein Beratungsgespräch je Halbjahr).` });
    });
    return { arbeit: a, gespraech: p, gesamt: g, flags: out, worst: out.some(f => f.level === 'red') ? 'red' : out.some(f => f.level === 'warn') ? 'warn' : out.length ? 'info' : '' };
  }

  /* ---------- Warnungen ---------- */
  function courseWarnings(course) {
    const w = [];
    const m = minSA(course);
    const nSA = (course.assessments || []).filter(a => a.type === 'sa').length;
    const planned = Math.max(+course.saPlanned || 0, nSA);
    if (m && planned < m) w.push({ level: 'warn', text: `Mindestens ${m} Schulaufgaben vorgeschrieben (§ 22 GSO) – geplant/eingetragen: ${planned}.` });
    return w;
  }
  function studentWarnings(course, sid, res) {
    const w = [];
    if (!isUpper(course)) {
      if (res.open.length) w.push({ level: 'info', text: `${res.open.length} Nachtermin(e) offen (§ 27 GSO)` });
      if (res.suggestion && (res.suggestion.grade >= 5 || (res.suggestion.borderline && res.suggestion.options && res.suggestion.options[1] >= 5)))
        w.push({ level: 'warn', text: 'Note 5 oder 6 möglich – Gefährdung des Vorrückens prüfen, ggf. Mitteilung (§ 30, § 40 GSO)' });
      if (res.suggestion && res.suggestion.borderline) w.push({ level: 'info', text: 'Grenzfall – pädagogische Entscheidung' });
    }
    return w;
  }

  /* Terminprüfung große schriftliche LN (§ 22 Abs. 3 GSO): höchstens 1 pro Tag, 2 pro Woche je Klasse */
  function isoWeek(d) {
    const t = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-' + Math.ceil(((t - y0) / 864e5 + 1) / 7);
  }
  function dateConflicts(dates) { // dates: [{date, label}]
    const out = [], byDay = {}, byWeek = {};
    dates.filter(d => d.date).forEach(d => { (byDay[d.date] = byDay[d.date] || []).push(d); (byWeek[isoWeek(d.date)] = byWeek[isoWeek(d.date)] || []).push(d); });
    Object.entries(byDay).forEach(([k, v]) => { if (v.length > 1) out.push({ kind: 'day', key: k, items: v, text: `Mehr als eine Schulaufgabe am ${fmtDate(k)}: ${v.map(x => x.label).join(', ')}` }); });
    Object.entries(byWeek).forEach(([k, v]) => { if (v.length > 2) out.push({ kind: 'week', key: k, items: v, text: `Mehr als zwei Schulaufgaben in einer Woche (KW ${k.split('-')[1]}): ${v.map(x => x.label).join(', ')}` }); });
    return out;
  }
  function fmtDate(d) { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${+dd}.${+m}.${y}`; }
  /* Klasse aus Kursnamen ableiten („9F Englisch“ -> „9F“) */
  function classOf(name) { const m = /^\s*(\d{1,2}\s*[A-Za-zÄÖÜäöü]{0,3})/.exec(name || ''); return m ? m[1].replace(/\s+/g, '').toUpperCase() : (name || '').trim(); }

  /* Notenspiegel einer Arbeit */
  function distribution(a, students, upper) {
    const vals = students.map(s => valueOf(a.results && a.results[s.id], upper)).filter(v => v != null);
    const counts = upper ? Array(16).fill(0) : Array(6).fill(0);
    vals.forEach(v => { if (upper) counts[v]++; else counts[v - 1]++; });
    const n = vals.length, avg = mean(vals);
    const weak = upper ? vals.filter(v => v < 5).length : vals.filter(v => v >= 5).length;
    return { counts, n, avg, weak, weakShare: n ? weak / n : 0 };
  }

  /* Schuljahr aus Datum ("2026/27") */
  function schoolYearOf(d = new Date()) { const y = d.getFullYear(), m = d.getMonth() + 1; const s = m >= 8 ? y : y - 1; return `${s}/${String((s + 1) % 100).padStart(2, '0')}`; }

  return { entryItems, pctFromAnchors, pct15FromAnchors, isBig, areaOf, bigAverage, TYPES, AREAS, STATUS, LANGS, SUBJECTS, isLang, minSA, isUpper, parseCell, cellText, valueOf, POINT_GRADE, POINT_LABEL,
    keyGrade, suggestKey, keyPoints, suggestKey15, DEFAULT_PCT, DEFAULT_PCT15, mean, wmean, weightOf, smallAverage, saRatio, gradeSuggestion,
    roundPoints, computeLower, termsOf, termHasSA, computeTerm, seminarPaper, semTermAt, semTermOver, secondSchoolDayNov, countSmall, semStatus, SEM_MID, courseWarnings, studentWarnings, dateConflicts, isoWeek,
    fmtDate, classOf, distribution, schoolYearOf, inScope };
});
