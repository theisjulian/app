/* Foliva – Bausteine und Einstellungen ab 0.9.5 (Funktionsumfang wie Worksheet Crafter und mehr) · © 2026 theis */
(function (root) {
  'use strict';
  const C = root.FolivaCatalog || (typeof require !== 'undefined' ? require('./catalog2.js') : null);
  const t = (k, label, extra) => ({ k, label, ...extra });
  const sec = label => ({ k: '_sec_' + label, label, type: 'sec' });

  /* ---------- Text und Sachtext: Übungen auf den Text anwenden ---------- */
  const EX = [
    sec('Übung auf den Text anwenden'),
    t('syl', 'Silben', { type: 'seg', opts: [['aus', 'aus'], ['farbig', 'färben'], ['boegen', 'Bögen'], ['beides', 'beides']] }),
    t('vow', 'Selbstlaute hervorheben', { type: 'toggle' }),
    t('mark', 'Buchstaben farbig markieren (z. B. ie, ei, sch)', { type: 'text' }),
    t('ex', 'Übung', { type: 'select', opts: [['aus', 'keine – Text normal'], ['luecke', 'Lückentext (Wörter weglassen)'], ['schuetteln', 'Wörter schütteln (Buchstabensalat)'], ['saetze', 'Sätze schütteln (Wörter ordnen)'], ['rueckwaerts', 'Text rückwärts'], ['woerter', 'Wörterschlange (ohne Leerzeichen)'], ['gross', 'Nur Großbuchstaben'], ['klein', 'Nur Kleinbuchstaben']] }),
    t('gapEvery', 'Jedes …-te passende Wort wird zur Lücke', { type: 'number', min: 2, max: 12, when: it => it.ex === 'luecke' }),
    t('gapMin', 'Nur Wörter ab … Buchstaben', { type: 'number', min: 1, max: 12, when: it => it.ex === 'luecke' }),
    t('gapBank', 'Wörterkasten anzeigen', { type: 'toggle', inv: true, when: it => it.ex === 'luecke' }),
    t('keepFirst', 'Ersten Buchstaben behalten', { type: 'toggle', inv: true, when: it => it.ex === 'schuetteln' }),
    t('exLines', 'Schreiblinien darunter (Lösung im Lösungsblatt)', { type: 'toggle', inv: true, when: it => ['schuetteln', 'saetze', 'rueckwaerts', 'woerter', 'gross', 'klein'].includes(it.ex) }),
    t('exRows', 'Anzahl Schreiblinien (leer = passend)', { type: 'number', min: 1, max: 30, empty: true, when: it => it.exLines !== false && ['schuetteln', 'saetze', 'rueckwaerts', 'woerter', 'gross', 'klein'].includes(it.ex) }),
  ];
  const FRAME = [
    t('frameStyle', 'Rahmen-Linie', { type: 'select', when: it => it.box, opts: [['', 'Standard'], ['dick', 'Dick'], ['gestrichelt', 'Gestrichelt'], ['gepunktet', 'Gepunktet'], ['doppelt', 'Doppelt'], ['eckig', 'Eckig'], ['rund', 'Stark gerundet']] }),
    t('frameColor', 'Rahmenfarbe', { type: 'color', when: it => it.box }),
    t('frameFill', 'Hintergrund', { type: 'color', def: '#fff7e0', palette: ['#fff7e0', '#eef4fb', '#eaf6ec', '#fdecef', '#f2ecfa', '#f1f1f1'], noneLabel: 'ohne', when: it => it.box }),
  ];
  const tx = C.TYPES.text;
  { const a = tx.props.find(p => p.k === 'align'); if (a) a.opts = [['left', 'Links'], ['center', 'Mitte'], ['right', 'Rechts'], ['justify', 'Block']]; }
  { const i = tx.props.findIndex(p => p.k === 'boxStyle'); tx.props.splice(i + 1, 0, ...FRAME); }
  tx.props.push(t('lh', 'Zeilenabstand (1 = eng, 2 = doppelt; leer = Standard)', { type: 'number', min: 1, max: 3, step: .1, empty: true }), ...EX);
  tx.props.find(p => p.k === 'text').hint = 'Formatieren mit der Leiste oben (Schrift, Größe, Farbe, F/K/U …). Formeln: [[3/4]] Bruch, x^2 hoch, H_{2}O tief, √{16} – Silben von Hand: Haus|auf|ga|be';
  tx.words += ' silben silbenbögen selbstlaute vokale lückentext schütteln rückwärts wörterschlange großbuchstaben formel bruch';
  const st = C.TYPES.sachtext;
  { const i = st.props.findIndex(p => p.k === 'box'); st.props.splice(i + 1, 0, ...FRAME); }
  { const i = st.props.findIndex(p => p.k === 'sources'); st.props.splice(i, 0, ...EX); }


  /* Bild: Darstellung je Bild (sonst wie im Material eingestellt) */
  { const im = C.TYPES.image; im.props.push(t('look', 'Darstellung', { type: 'seg', opts: [['', 'wie Blatt'], ['farbig', 'farbig'], ['sw', 'schwarz-weiß'], ['umriss', 'Umriss']] })); im.words += ' ausmalen umriss schwarz weiß'; }

  /* ---------- neue Mathe-Bausteine ---------- */
  const I = p => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  Object.assign(C.ICON, {
    rechenrad: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21"/>'),
    magic: I('<rect x="4" y="4" width="16" height="16"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/>'),
    opsquare: I('<rect x="3" y="3" width="5" height="4"/><rect x="16" y="3" width="5" height="4"/><rect x="3" y="17" width="5" height="4"/><rect x="16" y="17" width="5" height="4"/><path d="M8 5h8M18.5 7v10M16 19H8M5.5 17V7"/>'),
    zerlegung: I('<rect x="2" y="4" width="5" height="4"/><rect x="17" y="4" width="5" height="4"/><rect x="9.5" y="16" width="5" height="4"/><path d="M7 6h10M6 9l4 6M14 15l4-6"/>'),
    wdiv: I('<path d="M4 6h6M14 6h2M18 6h2M5 10h4M4 13h6M7 17h4M6 20h6"/><path d="M12 4v4" stroke-width="1.2"/>'),
    kaestchen: I('<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><path d="M3 15h18" stroke-width="2.6"/>'),
  });
  const TT = t('title', 'Arbeitsanweisung', { type: 'text' });
  const COLS = (max = 4) => t('cols', 'Nebeneinander', { type: 'number', min: 1, max });
  const OPS = t('ops', 'Rechenarten', { type: 'select', regen: true, opts: [['+', 'nur +'], ['−', 'nur −'], ['+−', '+ und −'], ['·', 'nur ·'], [':', 'nur :'], ['·:', '· und :'], ['+−·:', 'alle vier']] });
  const prim = p => !p || p.primary;
  const add = (k, def) => { C.TYPES[k] = def; };
  add('rechenrad', { name: 'Rechenrad', group: 'mathe', task: true, gen: 'rechenrad', words: 'rechenrad rad kreis ring segmente einmaleins plus mal', make: p => ({ title: 'Rechne im Rechenrad.', ops: '+', range: prim(p) ? 20 : 100, seg: 8, count: 2, mode: 'aussen', cols: 2, size: 52, points: 3 }),
    props: [TT, OPS, t('range', 'Zahlenraum bis', { type: 'number', min: 10, max: 100000, regen: true }), t('seg', 'Felder im Ring', { type: 'number', min: 4, max: 12, regen: true }), t('count', 'Anzahl Räder', { type: 'number', min: 1, max: 4, regen: true }), t('mode', 'Auszufüllen', { type: 'seg', regen: true, opts: [['aussen', 'außen'], ['innen', 'innen'], ['gemischt', 'gemischt']] }), COLS(4), t('size', 'Größe (mm)', { type: 'number', min: 35, max: 90 })] });
  add('magic', { name: 'Magisches Quadrat', group: 'mathe', task: true, gen: 'magic', words: 'magisches quadrat zauberquadrat zauberzahl summe knobeln', make: p => ({ title: 'Ergänze die Zauberquadrate. Jede Reihe, Spalte und Diagonale ergibt die Zauberzahl.', size: 3, range: prim(p) ? 20 : 100, count: 2, hide: 4, showSum: true, cols: 3, points: 3 }),
    props: [TT, t('size', 'Größe', { type: 'seg', regen: true, opts: [[3, '3 × 3'], [4, '4 × 4']] }), t('range', 'Zahlenraum bis', { type: 'number', min: 9, max: 100000, regen: true }), t('count', 'Anzahl', { type: 'number', min: 1, max: 4, regen: true }), t('hide', 'Leere Felder', { type: 'number', min: 1, max: 12, regen: true }), t('showSum', 'Zauberzahl angeben', { type: 'toggle', inv: true }), COLS(4)] });
  add('opsquare', { name: 'Operator-Quadrat', group: 'mathe', task: true, gen: 'opsquare', words: 'operator quadrat rechenquadrat pfeilbild operatoren viereck', make: p => ({ title: 'Ergänze Zahlen und Rechenzeichen.', range: prim(p) ? 20 : 100, count: 2, mode: 'zahlen', diag: false, cols: 2, points: 3 }),
    props: [TT, t('range', 'Zahlenraum bis', { type: 'number', min: 10, max: 100000, regen: true }), t('count', 'Anzahl', { type: 'number', min: 1, max: 6, regen: true }), t('mode', 'Auszufüllen', { type: 'seg', regen: true, opts: [['zahlen', 'Zahlen'], ['operatoren', 'Operatoren'], ['gemischt', 'gemischt']] }), t('diag', 'Mit Diagonalen', { type: 'toggle', regen: true }), COLS(3)] });
  add('zerlegung', { name: 'Zerlegungsaufgabe (Zehnerübergang)', group: 'mathe', task: true, gen: 'zerlegung', words: 'zerlegung zerlegen zehnerübergang schrittweise über den zehner rechenweg', make: () => ({ title: 'Rechne über den Zehner.', op: '+', range: 20, count: 4, hide: 'alles', cols: 2, points: 4 }),
    props: [TT, t('op', 'Rechenart', { type: 'seg', regen: true, opts: [['+', 'plus'], ['−', 'minus'], ['+−', 'gemischt']] }), t('range', 'Zahlenraum bis', { type: 'number', min: 20, max: 1000, regen: true }), t('count', 'Anzahl', { type: 'number', min: 1, max: 12, regen: true }), t('hide', 'Auszufüllen', { type: 'seg', opts: [['alles', 'Zerlegung und Ergebnis'], ['zerlegung', 'nur Zerlegung'], ['ergebnis', 'nur Ergebnis']] }), COLS(3)] });
  add('wdiv', { name: 'Schriftlich dividieren', group: 'mathe', task: true, gen: 'wdiv', words: 'schriftlich dividieren division geteilt teilen schriftliche division rest karo', make: () => ({ title: 'Dividiere schriftlich.', digits: 3, dmax: 9, rest: 'ohne', count: 4, cols: 2, cell: 6, points: 4 }),
    props: [TT, t('digits', 'Stellen der Zahl', { type: 'number', min: 2, max: 5, regen: true }), t('dmax', 'Teiler bis', { type: 'number', min: 2, max: 9, regen: true }), t('rest', 'Rest', { type: 'seg', regen: true, opts: [['ohne', 'ohne'], ['gemischt', 'gemischt'], ['mit', 'mit']] }), t('count', 'Anzahl Aufgaben', { type: 'number', min: 1, max: 8, regen: true }), COLS(3), t('cell', 'Kästchengröße (mm)', { type: 'number', min: 4, max: 9 })] });
  add('kaestchen', { name: 'Kästchenrechnung (Karofeld beschriften)', group: 'mathe', task: true, words: 'karofeld kästchen rechenkästchen eigene rechnung beschriften schriftlich frei untereinander karo', make: () => ({ title: 'Rechne in den Kästchen.', text: '  345\n+ 123\n-----\n  [468]', cell: 5, colsMin: 8, rowsMin: 6, extra: 0, karo: true, points: 2 }),
    props: [TT, t('text', 'Inhalt – Zeichen für Zeichen; [Lösung] in eckigen Klammern; Zeile aus --- = Strich', { type: 'textarea', rows: 7 }), t('cell', 'Kästchengröße (mm)', { type: 'number', min: 4, max: 12 }), t('colsMin', 'Mindestens … Kästchen breit', { type: 'number', min: 1, max: 40 }), t('rowsMin', 'Mindestens … Zeilen', { type: 'number', min: 1, max: 40 }), t('karo', 'Karos zeigen', { type: 'toggle', inv: true })] });

  /* ---------- Optionen bestehender Bausteine ---------- */
  { const pk = C.TYPES.packet; const i = pk.props.findIndex(p => p.k === 'op');
    const toOwn = it => { const d = it.data; if (it.pform !== 'eigene' || String(it.own || '').trim() || !d || !Array.isArray(d.tasks)) return; it.own = d.tasks.map(x => `${x.miss === 'a' ? '_' : x.a} ${x.op} ${x.miss === 'b' ? '_' : x.b}${x.miss === 'c' ? '' : ' = ' + x.c}`).join('\n'); };
    pk.props.splice(i, 0, t('pform', 'Päckchenart', { type: 'select', regen: true, onSet: toOwn, opts: [['zufall', 'Zufällige Aufgaben'], ['schoen', 'Schöne Päckchen (mit Muster)'], ['tausch', 'Tauschaufgaben'], ['umkehr', 'Umkehraufgaben'], ['nachbar', 'Nachbaraufgaben'], ['eigene', 'Eigene Aufgaben eintippen']] }));
    pk.props.push(t('glen', 'Aufgaben je Päckchen', { type: 'number', min: 2, max: 8, regen: true, when: it => it.pform === 'schoen' }), t('own', 'Eigene Aufgaben – je Zeile eine, z. B. 7 + 5 · 12 − _ = 4 · 3 · 4', { type: 'textarea', rows: 6, regen: true, when: it => it.pform === 'eigene' }));
    pk.props.forEach(p => { if (['range', 'count', 'transition', 'rows', 'rest', 'zero'].includes(p.k)) { const w = p.when; p.when = it => it.pform !== 'eigene' && (!w || w(it)); } if (p.k === 'op') { const w = p.when; p.when = it => it.pform !== 'eigene' && (!w || w(it)); } if (p.k === 'missing') { p.when = it => it.pform !== 'eigene'; } });
    pk.words += ' schöne päckchen tauschaufgabe umkehraufgabe nachbaraufgabe eigene aufgaben muster'; }
  { const ch = C.TYPES.chain; ch.props.push(t('look', 'Darstellung', { type: 'seg', opts: [['kaesten', 'Kästen'], ['operator', 'Operatoren in Ellipsen'], ['kreise', 'Kreise']] }), t('gaps', 'Auszufüllen', { type: 'seg', opts: [['ergebnisse', 'Zahlen'], ['operatoren', 'Operatoren'], ['gemischt', 'gemischt']] }), t('both', 'Pfeile in beide Richtungen (Umkehroperator)', { type: 'toggle' })); ch.words += ' operator beide richtungen umkehr'; }
  { const sq = C.TYPES.sequence; sq.props.push(t('look', 'Darstellung', { type: 'seg', opts: [['kaesten', 'Kästchen'], ['kreise', 'Zahlenkette (Kreise)']] })); sq.words += ' zahlenkette kreise'; }
  { const tf = C.TYPES.tenframe; const s = tf.props.find(p => p.k === 'size'); s.opts = [[10, 'Zehnerfeld'], [20, 'Zwanzigerfeld'], [100, 'Hunderterfeld']]; const m = tf.props.find(p => p.k === 'mode'); m.opts = [['zaehlen', 'Anzahl aufschreiben'], ['plus', 'Plusaufgabe (zwei Farben)'], ['malen', 'Punkte malen']]; m.regen = true;
    tf.props.push(t('dcol', 'Farbig (rot/blau je 5)', { type: 'toggle', when: it => it.mode !== 'plus' })); tf.name = 'Zehner-, Zwanziger-, Hunderterfeld'; tf.words += ' hunderterfeld hunderter punkte 100'; }
  { const w = C.TYPES.written; const ix = w.props.findIndex(p => p.k === 'digits');
    w.props.splice(ix + 1, 0, t('mform', 'Zweiter Faktor', { type: 'seg', regen: true, when: it => it.op === '·', opts: [['einstellig', 'einstellig (· 4)'], ['zehner', 'Zehnerzahl (· 40, · 300)'], ['mehrstellig', 'mehrstellig (· 24)']] }),
      t('mdigits', 'Stellen des zweiten Faktors', { type: 'seg', regen: true, when: it => it.op === '·' && it.mform === 'mehrstellig', opts: [[2, '2'], [3, '3']] }));
    w.props.push(t('pv', 'Stellenwerte darüber (E, Z, H …)', { type: 'toggle' }), t('karo', 'Karofeld zeigen', { type: 'toggle', inv: true }), t('lineColor', 'Farbe der Karolinien', { type: 'color', def: '#c3ccd6', palette: ['#c3ccd6', '#8fb3d9', '#9bc59d', '#888888'], when: it => it.karo !== false })); }
  { const c = C.TYPES.clock; const m = c.props.find(p => p.k === 'mode'); m.opts = [['ablesen', 'Uhrzeit ablesen'], ['einzeichnen', 'Zeiger einzeichnen'], ['spanne', 'Zeitspanne (zwei Uhren)']]; m.regen = true;
    c.props.push(t('handCol', 'Zeiger farbig (Stunde rot, Minute blau)', { type: 'toggle' })); c.props.forEach(p => { if (p.k === 'cols') p.when = it => it.mode !== 'spanne'; }); c.words += ' zeitspanne dauer'; }
  { const sc = C.TYPES.selfcheck;
    sc.props.push(t('wrong', 'Falsche Lösungen dazumischen (Anzahl)', { type: 'number', min: 0, max: 20 }),
      t('scope', 'Welche Aufgaben?', { type: 'seg', opts: [['alle', 'ganzes Blatt'], ['davor', 'nur davor'], ['nummern', 'Auswahl']] }),
      t('nums', 'Aufgaben-Nummern (z. B. 1-3, 5)', { type: 'text', plain: true, when: it => it.scope === 'nummern' }),
      t('_info', 'Einbezogen', { type: 'info', html: it => { const doc = typeof cur !== 'undefined' ? cur : null; if (!doc || !root.FolivaRender.selfcheckValues) return ''; const r = root.FolivaRender.selfcheckValues(doc, it); const max = +it.max || 40;
        return r.used.length ? `<b>Einbezogen:</b><br>${r.used.map(u => `${u.num ? 'Aufgabe ' + u.num : 'ohne Nummer'} – ${(C.TYPES[u.type] || {}).name || u.type}: ${u.count} Ergebnis${u.count === 1 ? '' : 'se'}`).join('<br>')}${r.vals.length > max ? `<br><b>Achtung:</b> ${r.vals.length} Ergebnisse, gezeigt werden nur die ersten ${max} („Höchstens … Zahlen“ erhöhen).` : ''}` : 'Noch keine passenden Aufgaben gefunden. Einbezogen werden Rechen- und Wortaufgaben mit eindeutigen Ergebnissen (nicht: Ankreuzen, Zuordnen, Texte).'; } }));
    sc.hint = 'Sammelt automatisch die Ergebnisse der Aufgaben (ganzes Blatt, nur davor oder eine Auswahl) und mischt sie. Unten steht, welche Aufgaben einbezogen sind.'; }
  /* Kreuzworträtsel: Wörter und Hinweise als Liste (Text oder Bild), keine Formatierung in Wortlisten */
  { const cw = C.TYPES.crossword; const wp = cw.props.find(p => p.k === 'words'); wp.type = 'wordhints'; wp.label = 'Wörter und Hinweise'; wp.hint = 'Die Wörter setzt Foliva automatisch ins Gitter. Gut sind 6–10 Wörter. Wer hier etwas ändert, arbeitet mit eigenen Wörtern weiter.'; }
  Object.values(C.TYPES).forEach(T => (T.props || []).forEach(p => { if (['words', 'own', 'verbs', 'mark'].includes(p.k) || (p.k === 'text' && ['kaestchen'].includes(T.name && Object.keys(C.TYPES).find(k => C.TYPES[k] === T)))) p.plain = true; }));
  C.TYPES.kaestchen.props.find(p => p.k === 'text').plain = true;
  /* neue Bausteine auch in „Mathematik ab Klasse 5“ zeigen, wo sinnvoll */
  C.ALSO.mathesek = (C.ALSO.mathesek || []).concat(['magic', 'opsquare', 'kaestchen']);

  { const h = C.TYPES.hundred; const pp = h.props.find(p => p.k === 'pattern'); pp.opts = pp.opts.concat([['ausschnitte', 'Ausschnitte (Puzzleteile)']]);
    h.props.splice(h.props.indexOf(pp) + 1, 0, t('count', 'Anzahl Ausschnitte', { type: 'number', min: 1, max: 12, regen: true, when: it => it.pattern === 'ausschnitte' }), t('cols', 'Nebeneinander', { type: 'number', min: 1, max: 6, when: it => it.pattern === 'ausschnitte' }));
    h.modeTitles = { prop: 'pattern', titles: { zufall: 'Ergänze die Hundertertafel.', reihe: 'Ergänze die Hundertertafel.', diagonale: 'Ergänze die Hundertertafel.', ausschnitte: 'Ergänze die Ausschnitte aus der Hundertertafel.' } }; }

  /* Arbeitsanweisung passt sich der gewählten Aufgabenart an – solange sie nicht selbst geändert wurde */
  const MT = {
    pictureword: ['mode', { anlaut: 'Schreibe den Anfangsbuchstaben.', wort: 'Schreibe das Wort.', luecke: 'Ergänze die fehlenden Buchstaben.', silben: 'Sprich, klatsche und male die Silbenbögen.', artikel: 'Schreibe den Artikel dazu.' }],
    scramble: ['mode', { buchstaben: 'Ordne die Buchstaben.', saetze: 'Ordne die Wörter zu einem Satz.' }],
    clock: ['mode', { ablesen: 'Wie spät ist es?', einzeichnen: 'Zeichne die Zeiger ein.', spanne: 'Wie viel Zeit ist vergangen?' }],
    tenframe: ['mode', { zaehlen: 'Wie viele Punkte sind es?', malen: 'Male die Punkte.', plus: 'Schreibe die Plusaufgabe.' }],
    money: ['mode', { zaehlen: 'Wie viel Geld ist es?', legen: 'Lege den Betrag. Male die Münzen und Scheine.' }],
    geoboard: ['mode', { abzeichnen: 'Zeichne die Figur ab.', spiegeln: 'Spiegle die Figur an der roten Linie.' }],
    fracpict: ['mode', { ablesen: 'Welcher Bruchteil ist gefärbt?', faerben: 'Färbe den Bruchteil.' }],
    placevalue: ['mode', { eintragen: 'Trage in die Stellenwerttafel ein.', ablesen: 'Schreibe die Zahl.', gemischt: 'Ergänze die Stellenwerttafel.' }],
    angles: ['mode', { messen: 'Miss die Winkel.', zeichnen: 'Zeichne die Winkel.' }],
    compare: ['mode', { zahlen: 'Setze ein: <, > oder =.', terme: 'Rechne und vergleiche. Setze ein: <, > oder =.' }],
  };
  Object.entries(MT).forEach(([k, v]) => { if (C.TYPES[k]) C.TYPES[k].modeTitles = { prop: v[0], titles: v[1] }; });

  /* Mathematik (Grundschule) in überschaubare Bereiche teilen – nach den Lernbereichen des LehrplanPLUS */
  const MSPLIT = [
    ['m_zahlen', 'Mathe: Zahlen und Darstellungen', ['countpics', 'tenframe', 'numberline', 'hundred', 'placevalue', 'sequence']],
    ['m_kopf', 'Mathe: Rechnen und Rechenformate', ['packet', 'zerlegung', 'compare', 'wall', 'house', 'triangle', 'chain', 'calctable', 'rechenrad', 'magic', 'opsquare']],
    ['m_schrift', 'Mathe: Halbschriftlich und schriftlich', ['halbschriftlich', 'written', 'wdiv', 'kaestchen']],
    ['m_groessen', 'Mathe: Größen, Sachrechnen, Raum und Form', ['money', 'units', 'clock', 'sachaufgabe', 'geoboard', 'pattern']],
  ];
  { const i = C.GROUPS.findIndex(g => g.id === 'mathe'); C.GROUPS.splice(i < 0 ? 1 : i, i < 0 ? 0 : 1, ...MSPLIT.map(([id, name]) => ({ id, name })));
    MSPLIT.forEach(([id, , ks]) => ks.forEach(k => { if (C.TYPES[k]) C.TYPES[k].group = id; }));
    Object.values(C.TYPES).forEach(t => { if (t.group === 'mathe') t.group = 'm_kopf'; }); }
  /* Reihenfolge der Bereiche je Schulstufe (Einfügen-Leiste und Menü „Einfügen“) */
  C.groupOrder = prim => {
    const ids = prim ? ['basis', 'm_zahlen', 'm_kopf', 'm_schrift', 'm_groessen', 'deutsch', 'raetsel', 'sach', 'gestalten', 'sprachen', 'weitere', 'mathesek'] : ['basis', 'sprachen', 'mathesek', 'weitere', 'sach', 'raetsel', 'gestalten', 'deutsch', 'm_kopf', 'm_schrift', 'm_zahlen', 'm_groessen'];
    return ids.map(id => C.GROUPS.find(g => g.id === id)).filter(Boolean).concat(C.GROUPS.filter(g => !ids.includes(g.id)));
  };
  C.groupKeys = g => Object.keys(C.TYPES).filter(k => C.TYPES[k].group === g.id).concat((C.ALSO[g.id] || []).filter(k => C.TYPES[k] && C.TYPES[k].group !== g.id));

  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.FolivaCatalog = C;
})(typeof window !== 'undefined' ? window : globalThis);
