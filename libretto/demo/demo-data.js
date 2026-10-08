/* Libretto · Online-Demo: erfundene Beispieldaten (alle Namen frei erfunden) · © 2026 theis
   Die Daten entstehen bei jedem Laden neu und liegen nur im Arbeitsspeicher des Browsers.
   Die Termine richten sich nach dem laufenden Schuljahr, damit die Demo nicht veraltet. */
window.LibrettoDemoData = function (R, Cal) {
  'use strict';
  /* fester Zufall: jede Besucherin sieht dieselben Noten */
  let seed = 20260930;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 0.58;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  let n = 0; const id = p => p + (++n).toString(36).padStart(4, '0');

  /* Schuljahr und Schultage */
  const now = new Date(), Y = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ferien = (Cal && Cal.FERIEN) || [];
  const feiertage = new Set([Y, Y + 1].flatMap(y => Cal ? Cal.holidays(y).map(h => h.date) : []));
  const frei = d => { const s = iso(d), w = d.getDay(); return w === 0 || w === 6 || feiertage.has(s) || ferien.some(f => f.from <= s && s <= f.to); };
  /* Datum im Schuljahr (Monat, Tag); fällt es auf einen freien Tag, gilt der nächste Schultag */
  const sd = (m, day) => { const d = new Date(m >= 8 ? Y : Y + 1, m - 1, day, 12); let i = 0; while (frei(d) && i++ < 40) d.setDate(d.getDate() + 1); return iso(d); };

  /* „Nachname, Vorname“ – bei Kursen aus mehreren Klassen mit Klasse: „Nachname, Vorname | 8a“ */
  const students = list => list.map(s => { const [nm, cls] = s.split(' | '); const [last, first] = nm.split(', '); return { id: id('s'), last, first, name: `${last}, ${first}`, ...(cls ? { cls } : {}), lvl: clamp(2.9 + gauss() * 0.95, 1.2, 5.3) }; });
  const course = (o, list) => Object.assign({ id: id('c'), hours: '', hasSA: true, saPlanned: '', ratio: 'auto', smallMode: 'flat', typeWeights: {}, areaWeights: { schriftlich: 1, 'mündlich': 1, praktisch: 1 },
    lf: false, seminar: false, assessments: [], entries: [], overrides: {}, noGrade: {}, away: {}, notes: {}, seminarPaper: {} }, o, { students: students(list) });
  const grade = (s, spread = 0.75) => clamp(Math.round(s.lvl + gauss() * spread), 1, 6);
  const tend = v => { const r = rnd(); return v === 6 ? (r < 0.3 ? '+' : '') : r < 0.26 ? '+' : r < 0.5 ? '-' : ''; };
  const points = (s, spread = 1.6) => clamp(Math.round(17 - s.lvl * 3 + gauss() * spread), 0, 15);
  const away = (c, s, date) => { const a = c.away[s.id]; return !!(a && date >= a.from && date <= a.to); };

  /* Leistungsnachweis anlegen; fill(s) liefert das Ergebnis je Schüler oder nichts */
  function ln(c, o, fill) {
    const a = Object.assign({ id: id('a'), title: '', term: null, short: '', usePoints: false, note: '', results: {} }, o);
    if (fill) c.students.forEach(s => { if (away(c, s, a.date)) return; const r = fill(s, a); if (r) a.results[s.id] = r; });
    c.assessments.push(a); return a;
  }
  const noten = spread => s => { const v = grade(s, spread); return { v, tend: tend(v) }; };
  const glatt = spread => s => ({ v: grade(s, spread), tend: '' });
  /* Arbeit mit Rohpunkten und Notenschlüssel der Fachschaft (Note 4 ab p4 %, Note 5 ab p5 %) */
  const keyLower = (max, p4, p5) => Object.assign(R.suggestKey(max, R.pctFromAnchors(p4, p5), 0.5), { anchors: { p4, p5, step: 0.5 } });
  const roh = (max, key) => s => { const pct = clamp(1.07 - s.lvl * 0.155 + gauss() * 0.055, 0.08, 1); const raw = Math.round(max * pct * 2) / 2; return { raw, v: R.keyGrade(raw, key) }; };
  const keyUpper = (max, p5, p1) => Object.assign(R.suggestKey15(max, R.pct15FromAnchors(p5, p1), 0.5), { anchors: { p5, p1, step: 0.5 } });
  const roh15 = (max, key) => s => { const pct = clamp(1.04 - s.lvl * 0.15 + gauss() * 0.05, 0.05, 1); const raw = Math.round(max * pct * 2) / 2; return { raw, v: R.keyPoints(raw, key) }; };
  /* Einzelnoten (Unterrichtsbeiträge, Abfragen) für einen Teil der Klasse */
  function einzel(c, type, dates, share, upper, term) {
    dates.forEach(date => c.students.forEach(s => {
      if (rnd() > share || away(c, s, date)) return;
      const e = { id: id('e'), sid: s.id, type, date };
      if (upper) { e.term = term; e.v = points(s, 1.8); } else { e.v = grade(s, 0.9); e.tend = tend(e.v); }
      c.entries.push(e);
    }));
  }

  /* ---------- 9b Englisch: Fach mit Schulaufgaben, Rohpunkte, Abwesenheit, Nachtermin ---------- */
  const e9 = course({ name: '9b', subject: 'Englisch', grade: 9, hours: '3', saPlanned: '3' },
    ['Aksoy, Deniz', 'Bauer, Hannah', 'Berger, Jonas', 'Brandt, Mila', 'De Luca, Sara', 'Ebert, Paul', 'Fuchs, Leonie', 'Graf, Noah', 'von Hagen, Lukas', 'Huber, Emilia', 'Jansen, Finn', 'Kowalski, Maja',
      'Lang, Elias', 'Mayer, Sophie', 'Nguyen, Linh', 'Öztürk, Emre', 'Peters, Clara', 'Reiter, Moritz', 'Schmid, Lena', 'Seidel, Ben', 'Thoma, Ida', 'Vogl, Anton', 'Weber, Marie', 'Zimmermann, Felix']);
  e9.away[e9.students[11].id] = { from: sd(9, 15), to: sd(12, 18), reason: 'Auslandsaufenthalt' };
  const k9 = keyLower(60, 50, 25);
  const sa1 = ln(e9, { type: 'sa', title: '1. Schulaufgabe', date: sd(10, 15), usePoints: true, key: k9 }, roh(60, k9));
  sa1.results[e9.students[5].id] = { status: 'ent' };                      // entschuldigt gefehlt – Nachtermin offen
  ln(e9, { type: 'stex', title: 'Ex Unit 1', date: sd(11, 10) }, noten(0.9));
  ln(e9, { type: 'sa', title: 'Mündliche Schulaufgabe', date: sd(12, 3) }, glatt(0.7));
  ln(e9, { type: 'stex', title: 'Vokabeltest', date: sd(1, 14), weight: 0.5 }, noten(1.0));
  ln(e9, { type: 'sa', title: '3. Schulaufgabe', date: sd(5, 11) });
  einzel(e9, 'ub', [sd(10, 1), sd(11, 19), sd(1, 21)], 0.36);
  einzel(e9, 'ra', [sd(11, 26)], 0.2);
  e9.notes[e9.students[2].id] = 'Elterngespräch am Sprechtag: mündliche Beteiligung steigern.';

  /* ---------- 6a Englisch: vier Schulaufgaben, Verhältnis 2:1 ---------- */
  const e6 = course({ name: '6a', subject: 'Englisch', grade: 6, hours: '4', saPlanned: '4' },
    ['Albrecht, Emma', 'Aydin, Can', 'Becker, Theo', 'Böhm, Frieda', 'Dietrich, Leo', 'Engel, Lotta', 'Fischer, Oskar', 'Friedrich, Greta', 'Günther, Jakob', 'Hartmann, Ella', 'Horn, Mats', 'Kaiser, Nele', 'Keller, Henri',
      'Krüger, Lina', 'Lehmann, Emil', 'Marić, Ana', 'Neumann, Jonte', 'Pohl, Ronja', 'Richter, Luis', 'Roth, Amelie', 'Sauer, Milan', 'Schuster, Pia', 'Stein, Karl', 'Voigt, Paula', 'Wolf, Tim', 'Ziegler, Mara']);
  const k6 = keyLower(48, 50, 25);
  ln(e6, { type: 'sa', title: '1. Schulaufgabe', date: sd(10, 22), usePoints: true, key: k6 }, roh(48, k6));
  ln(e6, { type: 'stex', title: 'Ex Unit 1', date: sd(11, 12) }, noten(0.9));
  ln(e6, { type: 'sa', title: '2. Schulaufgabe', date: sd(12, 10), usePoints: true, key: k6 }, roh(48, k6));
  ln(e6, { type: 'stex', title: 'Vokabeltest', date: sd(1, 20), weight: 0.5 }, noten(1.0));
  einzel(e6, 'ub', [sd(10, 8), sd(12, 1)], 0.42);

  /* ---------- 10c Geschichte: Fach ohne Schulaufgaben, schriftlich und mündlich je zur Hälfte ---------- */
  const g10 = course({ name: '10c', subject: 'Geschichte', grade: 10, hours: '2', hasSA: false, smallMode: 'areas' },
    ['Arnold, Julia', 'Baumann, Niklas', 'Busch, Carla', 'Çelik, Elif', 'Dorn, Simon', 'Eder, Laura', 'Franke, Tobias', 'Gruber, Anna', 'Haas, David', 'Heinrich, Marlene', 'Hoffmann, Jan', 'Ivanov, Nikita', 'Jung, Katharina',
      'Kraus, Maximilian', 'Lindner, Johanna', 'Maier, Philipp', 'Moser, Lea', 'Novak, Tomas', 'Otto, Franziska', 'Pfeiffer, Luca', 'Rossi, Giulia', 'Schreiber, Fabian', 'Sommer, Nora', 'Wagner, Tim', 'Winter, Lara']);
  ln(g10, { type: 'stex', title: 'Ex Weimarer Republik', date: sd(10, 20) }, noten(0.9));
  ln(g10, { type: 'ka', title: 'Kurzarbeit', date: sd(12, 8), weight: 2 }, noten(0.8));
  let ref = 0; ln(g10, { type: 'ref', title: 'Referate', date: sd(11, 24) }, s => (ref++ % 3 === 0 ? { v: clamp(grade(s, 0.6) - 1, 1, 6), tend: '' } : null));
  einzel(g10, 'ub', [sd(10, 6), sd(11, 17), sd(1, 12)], 0.4);

  /* ---------- Q12 Englisch: Oberstufe in Notenpunkten, Halbjahresleistungen nach § 29 ---------- */
  const q12 = course({ name: '2e1', subject: 'Englisch', grade: 12 },
    ['Bachmann, Jana', 'Beck, Jonathan', 'Decker, Mia', 'Ernst, Paul', 'Frank, Alina', 'Hahn, Vincent', 'Koch, Sarah', 'König, Daniel', 'Lorenz, Antonia', 'Martin, Samuel', 'Möller, Luisa', 'Petrov, Alexej',
      'Scholz, Helena', 'Schwarz, Adrian', 'Stadler, Theresa', 'Ulrich, Marco', 'Yilmaz, Selin']);
  const k12 = keyUpper(60, 45, 20);
  ln(q12, { type: 'sa', title: 'Schulaufgabe', date: sd(11, 5), term: '12/1', usePoints: true, key: k12 }, roh15(60, k12));
  ln(q12, { type: 'stex', title: 'Ex', date: sd(12, 15), term: '12/1' }, s => ({ v: points(s) }));
  let r12 = 0; ln(q12, { type: 'ref', title: 'Referate', date: sd(1, 19), term: '12/1' }, s => (r12++ % 2 === 0 ? { v: clamp(points(s, 1.2) + 1, 0, 15) } : null));
  einzel(q12, 'ub', [sd(10, 13), sd(12, 2)], 0.5, true, '12/1');
  ln(q12, { type: 'sa', title: 'Schulaufgabe', date: sd(4, 22), term: '12/2', usePoints: true, key: k12 }, roh15(60, k12));
  ln(q12, { type: 'stex', title: 'Ex', date: sd(5, 20), term: '12/2' }, s => ({ v: points(s) }));
  einzel(q12, 'ub', [sd(3, 10), sd(6, 9)], 0.5, true, '12/2');

  /* ---------- 8ab Italienisch: Kurs aus zwei Klassen – die Liste ist nach Klassen unterteilt ---------- */
  const i8 = course({ name: '8ab', subject: 'Italienisch', grade: 8, hours: '4', saPlanned: '4' },
    ['Bianchi, Giulia | 8a', 'Demir, Selin | 8a', 'Hofer, Maximilian | 8a', 'Lindner, Johanna | 8a', 'Pfeiffer, Luca | 8a', 'Schubert, Antonia | 8a', 'Wagner, Samuel | 8a',
      'Bergmann, Mia | 8b', 'Ernst, Julian | 8b', 'Kraus, Helena | 8b', 'Meier, Fabian | 8b', 'Novak, Tereza | 8b', 'Sommer, Valentin | 8b']);
  const k8 = keyLower(50, 50, 25);
  ln(i8, { type: 'sa', title: '1. Schulaufgabe', date: sd(11, 5), usePoints: true, key: k8 }, roh(50, k8));
  ln(i8, { type: 'stex', title: 'Ex Lezione 2', date: sd(12, 3) }, noten(0.9));
  einzel(i8, 'ub', [sd(10, 14), sd(12, 15)], 0.45);

  /* ---------- W-Seminar (Q13, begonnen im Vorjahr): Betreuung, Termine mit Dateien, Abgabe ---------- */
  const sdp = (m, day) => { const x = sd(m, day); return (+x.slice(0, 4) - 1) + x.slice(4); };   /* Datum im Vorjahr (12/1, 12/2) */
  const w = course({ name: 'W-Sem 1', subject: 'W-Seminar', grade: 13, hasSA: false, seminar: true },
    ['Albers, Lea', 'Brunner, Konstantin', 'Ceylan, Defne', 'Dvořák, Ella', 'Eckert, Moritz', 'Ferrari, Chiara', 'Gerber, Luis', 'Hauser, Nina', 'Ilić, Marko', 'Jäger, Rosa', 'Kurz, Valentin', 'Ludwig, Hanna']);
  const nov = R.secondSchoolDayNov(Y, d => { const [yy, mm] = d.split('-'); return Cal ? !!Cal.freeDays(+yy, +mm - 1)[d] : false; });
  w.sem = { start: Y - 1, leit: 'Englisch', rahmen: 'Utopias and Dystopias', deadline: nov, deadlineTime: '12:00', st: {} };
  ln(w, { type: 'ref', title: 'Kurzreferat', date: sdp(11, 12), term: '12/1' }, s => ({ v: points(s, 1.4) }));
  ln(w, { type: 'proj', title: 'Literaturrecherche', date: sdp(1, 21), term: '12/1' }, s => ({ v: points(s, 1.4) }));
  ln(w, { type: 'ref', title: 'Zwischenpräsentation', date: sdp(4, 29), term: '12/2' }, s => ({ v: points(s, 1.2) }));
  ln(w, { type: 'sonst', title: 'Exposé', date: sdp(6, 17), term: '12/2' }, s => ({ v: points(s, 1.5) }));
  const themen = ['Surveillance in Orwell’s “Nineteen Eighty-Four” and Today’s Social Media', 'Climate Fiction as a Warning: Two Novels Compared', 'Utopian Communities in 19th-Century America',
    'Artificial Intelligence in Dystopian Film', 'The Role of Language in Dystopian Societies', 'Feminist Dystopias since 1985', 'Utopia in Architecture: Garden Cities', 'Young Adult Dystopias and Their Readers',
    'Thomas More’s “Utopia” – a Satire?', 'Dystopian Elements in Video Games', '', 'Eco-Utopias in Contemporary Fiction'];
  w.students.forEach((s, i) => {
    const st = w.sem.st[s.id] = { termine: [] };
    if (themen[i]) { st.thema = themen[i]; st.themaAm = sdp(1, 28 + (i % 3)); }
    st.termine.push({ id: id('t'), date: sdp(12, 2 + (i % 5)), term: '12/1', kind: 'beratung', inhalt: 'Themenideen besprochen, Fragestellung eingegrenzt.', vereinbart: 'Drei Quellen recherchieren, Arbeitstitel formulieren.', signed: true, files: [] });
    if (i !== 10) st.termine.push({ id: id('t'), date: sdp(5, 6 + (i % 6)), term: '12/2', kind: 'beratung', inhalt: 'Gliederungsentwurf und Zeitplan besprochen.', vereinbart: 'Gliederung überarbeiten, Kapitel 2 bis Ende Juli.', signed: true,
      files: [{ id: 'demo' + i + 'a', name: `Gliederung ${s.last}.pdf`, size: 96000 + i * 3100, added: sdp(5, 6) }] });
    if (i < 7) st.termine.push({ id: id('t'), date: sd(9, 22 + (i % 6)), term: '13/1', kind: i < 3 ? 'zwischen' : 'kurz', inhalt: 'Stand der Arbeit: Hauptteil weitgehend fertig; Zitierweise geprüft.', vereinbart: 'Fazit schreiben, Erklärung nicht vergessen.', next: sd(10, 20), files: i < 2 ? [{ id: 'demo' + i + 'b', name: `Entwurf Kapitel 1–3 ${s.last}.docx`, size: 412000 + i * 9000, added: sd(9, 22) }] : [] });
  });
  w.notes[w.students[10].id] = 'Thema noch offen – Gespräch mit Oberstufenkoordination vereinbart.';

  const courses = [e9, e6, i8, g10, q12, w];
  courses.forEach(c => c.students.forEach(s => delete s.lvl));

  /* Schulaufgaben anderer Fächer der 9b: zeigt die Terminprüfung nach § 22 GSO (höchstens zwei pro Woche) */
  const cls = R.classOf(e9.name);
  const woche = sd(5, 11), mo = new Date(woche + 'T12:00'); mo.setDate(mo.getDate() - ((mo.getDay() + 6) % 7));
  const tag = k => { const d = new Date(mo); d.setDate(d.getDate() + k); return iso(d); };
  const classDates = [
    { id: id('d'), cls, subject: 'Mathematik', date: sd(10, 27) }, { id: id('d'), cls, subject: 'Deutsch', date: sd(11, 17) },
    { id: id('d'), cls, subject: 'Mathematik', date: tag(0) === woche ? tag(1) : tag(0) }, { id: id('d'), cls, subject: 'Latein', date: tag(3) === woche ? tag(4) : tag(3) },
  ];
  const ev = (title, from, to, time = '') => ({ id: id('v'), title, from, to: to || from, time });
  const events = [
    ev('Klassenelternabend der Jgst. 5 bis 7', sd(9, 29), '', '19:00–20:30'), ev('Wandertag', sd(10, 8)), ev('Fachsitzungen', sd(10, 20), '', '13:30–15:30'),
    ev('1. Elternsprechtag', sd(11, 26), '', '16:00–19:00'), ev('Pädagogische Konferenz', sd(12, 9), '', '14:00–16:00'), ev('Weihnachtskonzert', sd(12, 17), '', '19:00'),
    ev('Notenschluss Zwischenzeugnis', sd(2, 19)), ev('Schüleraustausch: Besuch der Partnerschule', sd(3, 9), sd(3, 16)), ev('2. Elternsprechtag', sd(4, 28), '', '16:00–19:00'),
    ev('Projekttage', sd(7, 20), sd(7, 22)), ev('Sommerfest', sd(7, 23), '', '15:00'),
  ];
  return { v: 1, settings: { teacher: 'M. Beispiel', school: 'Gymnasium Musterstadt', year: `${Y}/${String((Y + 1) % 100).padStart(2, '0')}`, half1End: sd(2, 19), autoLock: 10, hues: {}, keyPresets: {}, lastTerm: {} },
    courses, classDates, events };
};
