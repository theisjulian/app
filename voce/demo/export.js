/* Word-Export (Bewertungsbögen nach ISB-Vorlage, Prüfungsplan) mit docx.js */
'use strict';
const Export = (() => {
  const D = window.docx;
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, ImageRun, VerticalAlign, PageBreak, TableLayoutType, HeightRule, Footer } = D;
  const W = 10206; // nutzbare Breite A4 bei 1,5 cm Rand (twips)
  const FONT = 'Arial';
  const GREY = 'D9D9D9';
  const b1 = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const ALL = { top: b1, bottom: b1, left: b1, right: b1 };
  const NONE = { top: none, bottom: none, left: none, right: none };

  const t = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: FONT, size: o.size || 20, bold: !!o.bold, color: o.color, italics: !!o.italics });
  const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], alignment: o.align, spacing: { before: o.before || 0, after: o.after ?? 0, line: o.line }, keepNext: o.keepNext, bullet: o.bullet });
  const cell = (children, o = {}) => new TableCell({
    children: Array.isArray(children) ? children : [children], width: { size: o.w, type: WidthType.DXA }, borders: o.borders || ALL,
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined, verticalAlign: o.v || VerticalAlign.CENTER,
    rowSpan: o.rowSpan, columnSpan: o.span, margins: { top: o.m ?? 60, bottom: o.m ?? 60, left: 100, right: 100 } });
  const table = (rows, widths, o = {}) => new Table({ rows, width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, alignment: o.align });
  const fmt = n => String(Math.round(n * 10) / 10).replace('.', L.dec || ',');
  /* Beschriftungen des Bogens in der Prüfungssprache */
  const LBL = {
    de: { head: 'Großer mündlicher Leistungsnachweis im Fach', examiner: 'Prüfer/in', school: 'Schule', year: 'Schuljahr', cls: 'Klasse', course: 'Kurs', section: 'Ausbildungsabschnitt', date: 'Datum', name: 'Name',
      cats: { pron: 'Aussprache / Intonation', lang: 'Sprachliche Mittel / Sprachrichtigkeit', inter: 'Gesprächsfähigkeit / Strategie', content: 'Aufgabenerfüllung / Inhalt', npLang: 'Sprachliche Leistung' },
      np: 'Notenpunkte', npRounded: 'Notenpunkte (gerundet)', be: 'BE', of: 'von', remark: 'Bemerkung', verdict: 'Worturteil', total: 'Gesamtbewertung', reached: 'Erreichte BE', grade: 'Note',
      sigT: 'Datum, Unterschrift der Lehrkraft', sigP: 'Kenntnis genommen (Erziehungsberechtigte)', cap: 'Ein Bereich wurde mit 0 Notenpunkten bewertet; die Gesamtbewertung ist daher begrenzt.', cap4: 'Ein Bereich wurde mit höchstens 3 Notenpunkten bewertet; die Gesamtbewertung ist daher begrenzt.', dec: ',', locale: 'de-DE',
      subj: { Englisch: 'Englisch', Italienisch: 'Italienisch', Französisch: 'Französisch', Spanisch: 'Spanisch', Russisch: 'Russisch', Chinesisch: 'Chinesisch' } },
    en: { head: 'Oral examination in', examiner: 'Examiner', school: 'School', year: 'School year', cls: 'Class', course: 'Course', section: 'Semester', date: 'Date', name: 'Name',
      cats: { pron: 'Pronunciation / Intonation', lang: 'Range and accuracy of language', inter: 'Interaction / Strategies', content: 'Task fulfilment / Content', npLang: 'Language' },
      np: 'Points', npRounded: 'Points (rounded)', be: 'pts', of: 'of', remark: 'Comment', verdict: 'Overall comment', total: 'Overall assessment', reached: 'Points achieved', grade: 'Grade',
      sigT: 'Date, teacher’s signature', sigP: 'Seen by parent/guardian', cap: 'One area was awarded 0 points; the overall mark is therefore capped.', cap4: 'One area was awarded 3 points or fewer; the overall mark is therefore capped.', dec: '.', locale: 'en-GB',
      subj: { Englisch: 'English', Italienisch: 'Italian', Französisch: 'French', Spanisch: 'Spanish', Russisch: 'Russian', Chinesisch: 'Chinese' } },
    it: { head: 'Prova orale di', examiner: 'Docente', school: 'Scuola', year: 'Anno scolastico', cls: 'Classe', course: 'Corso', section: 'Semestre', date: 'Data', name: 'Nome',
      cats: { pron: 'Pronuncia / Intonazione', lang: 'Mezzi linguistici / Correttezza', inter: 'Interazione / Strategie', content: 'Svolgimento del compito / Contenuto', npLang: 'Competenza linguistica' },
      np: 'Punti', npRounded: 'Punti (arrotondati)', be: 'p.', of: 'su', remark: 'Osservazione', verdict: 'Giudizio', total: 'Valutazione complessiva', reached: 'Punti ottenuti', grade: 'Voto',
      sigT: 'Data, firma del docente', sigP: 'Per presa visione (genitori)', cap: 'Un ambito è stato valutato con 0 punti; la valutazione complessiva è quindi limitata.', cap4: 'Un ambito è stato valutato con al massimo 3 punti; la valutazione complessiva è quindi limitata.', dec: ',', locale: 'it-IT',
      subj: { Englisch: 'inglese', Italienisch: 'italiano', Französisch: 'francese', Spanisch: 'spagnolo', Russisch: 'russo', Chinesisch: 'cinese' } },
    fr: { head: 'Épreuve orale de', examiner: 'Enseignant(e)', school: 'Établissement', year: 'Année scolaire', cls: 'Classe', course: 'Cours', section: 'Semestre', date: 'Date', name: 'Nom',
      cats: { pron: 'Prononciation / Intonation', lang: 'Moyens linguistiques / Correction', inter: 'Interaction / Stratégies', content: 'Réalisation de la tâche / Contenu', npLang: 'Compétence linguistique' },
      np: 'Points', npRounded: 'Points (arrondis)', be: 'pts', of: 'sur', remark: 'Remarque', verdict: 'Appréciation', total: 'Évaluation globale', reached: 'Points obtenus', grade: 'Note',
      sigT: 'Date, signature de l’enseignant(e)', sigP: 'Vu par les parents', cap: 'Un domaine a été noté 0 point ; l’évaluation globale est donc plafonnée.', cap4: 'Un domaine a été noté 3 points au maximum ; l’évaluation globale est donc plafonnée.', dec: ',', locale: 'fr-FR',
      subj: { Englisch: 'anglais', Italienisch: 'italien', Französisch: 'français', Spanisch: 'espagnol', Russisch: 'russe', Chinesisch: 'chinois' } },
    es: { head: 'Prueba oral de', examiner: 'Docente', school: 'Centro', year: 'Curso escolar', cls: 'Clase', course: 'Curso', section: 'Semestre', date: 'Fecha', name: 'Nombre',
      cats: { pron: 'Pronunciación / Entonación', lang: 'Recursos lingüísticos / Corrección', inter: 'Interacción / Estrategias', content: 'Realización de la tarea / Contenido', npLang: 'Competencia lingüística' },
      np: 'Puntos', npRounded: 'Puntos (redondeados)', be: 'p.', of: 'de', remark: 'Observación', verdict: 'Valoración', total: 'Valoración global', reached: 'Puntos obtenidos', grade: 'Nota',
      sigT: 'Fecha, firma del docente', sigP: 'Enterado (padres o tutores)', cap: 'Un ámbito se ha valorado con 0 puntos; la valoración global queda por ello limitada.', cap4: 'Un ámbito se ha valorado con 3 puntos como máximo; la valoración global queda por ello limitada.', dec: ',', locale: 'es-ES',
      subj: { Englisch: 'inglés', Italienisch: 'italiano', Französisch: 'francés', Spanisch: 'español', Russisch: 'ruso', Chinesisch: 'chino' } },
  };
  /* Überschrift „Prüfung in/di/de …“ – im Französischen mit Elision (d’anglais, d’italien, d’espagnol) */
  for (const [k, l] of Object.entries(LBL)) l.hs = subj => k === 'fr' ? `Épreuve orale ${/^[aeiouyéèh]/i.test(subj) ? 'd’' : 'de '}${subj}` : `${l.head} ${subj}`;
  let L = LBL.de; let TIGHT = false;
  const tr = (d, lang) => lang === 'de' ? d : ((window.DESC_I18N || {})[d] || {})[lang] || d;
  const gap = (n = 120) => p(t(''), { after: n });

  function logoRun(settings, maxW = 175, maxH = 115) {
    const l = settings.logo; if (!l) return null;
    const bin = atob(l.data.split(',')[1]); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const s = Math.min(maxW / l.w, maxH / l.h); return new ImageRun({ type: 'png', data: bytes, transformation: { width: Math.round(l.w * s), height: Math.round(l.h * s) } });
  }

  /* Kopf wie ISB-Bogen: Fach/Prüfer/Schule/Schuljahr/Klasse/Datum/Name, rechts Logo */
  function header(ex, settings, student, levelLabel) {
    const lw = 2800, a = 3703, b = 3703;
    const logo = logoRun(settings);
    const dateTxt = ex.date ? new Date(ex.date + 'T12:00').toLocaleDateString(L.locale) : '';
    const isOS = SCHEMES[ex.scheme].type !== 'be';
    const rows = [
      new TableRow({ children: [cell(p(t(L.hs(L.subj[ex.subject] || ex.subject), { bold: true })), { w: a + b, span: 2 }),
        cell(logo ? p(logo, { align: AlignmentType.CENTER }) : p(t(''), {}), { w: lw, rowSpan: 4 })] }),
      new TableRow({ children: [cell(p([t(L.examiner + ': '), t(settings.examiner)]), { w: a }), cell(p([t(L.school + ': '), t(settings.school)]), { w: b })] }),
      new TableRow({ children: [cell(p([t((isOS ? L.course : L.year) + ': '), t(isOS ? ex.cls : settings.year)]), { w: a }), cell(p([t((isOS ? L.section : L.cls) + ': '), t(isOS ? (settings.year || '') : ex.cls)]), { w: b })] }),
      new TableRow({ children: [cell(p([t(L.date + ': '), t(dateTxt)]), { w: a }), cell(p([t(L.name + ': '), t(`${student.first} ${student.last}`.trim(), { bold: true })]), { w: b })] }),
    ];
    const badge = table([new TableRow({ children: [cell(p(t(levelLabel, { bold: true, size: 24, color: 'FFFFFF' }), { align: AlignmentType.CENTER }), { w: 1300, fill: '000000', borders: NONE })] })], [1300], { align: AlignmentType.RIGHT });
    return [badge, gap(80), table(rows, [a, b, lw]), p(t(titleIn(ex.title, ex.wlang), { color: '555555' }), { before: 60, after: 120 })];
  }

  function catBlock(ex, settings, c, r) {
    const sc = SCHEMES[ex.scheme]; const v = r.scores[c]; const isNP = sc.type === 'np';
    const label = L.cats[c];
    const w1 = 6000, w2 = 2606, w3 = 1600;
    const bar = isNP
      ? [cell(p(t(label, { bold: true })), { w: w1, fill: GREY }), cell(p([t(L.np + '  ', { bold: true }), t(String(v).padStart(2, '0'), { bold: true })], { align: AlignmentType.RIGHT }), { w: w2, fill: GREY }), cell(p(t(`${sc.w[c] * 10} %`, { bold: true }), { align: AlignmentType.CENTER }), { w: w3, fill: GREY })]
      : [cell(p(t(label, { bold: true })), { w: w1, fill: GREY }), cell(p(t(`${sc.f[c]} x ${fmt(v)} / ${maxOf(ex.scheme, c)} ${L.be}`, { bold: true }), { align: AlignmentType.RIGHT }), { w: w2, fill: GREY }), cell(p(t(`${fmt(v * sc.f[c])} ${L.be}`, { bold: true }), { align: AlignmentType.RIGHT }), { w: w3, fill: GREY })];
    const body = [];
    if (settings.showDesc) for (const d of descriptor(ex.scheme, c, v)) body.push(p([t('• '), t(tr(d, ex.wlang))], { after: 0 }));
    const note = String((r.notes || {})[c] || '').trim();
    if (note) body.push(p([t('• '), t(L.remark + ': ', { bold: true }), t(note)], { before: body.length ? 60 : 0, after: 0 }));
    if (!body.length) body.push(p(t('')), p(t('')));
    return [table([new TableRow({ cantSplit: true, children: bar })], [w1, w2, w3]),
      table([new TableRow({ children: [cell(body, { w: W, v: VerticalAlign.TOP, m: TIGHT ? 30 : 60 })] })], [W]), gap(TIGHT ? 30 : 70)];
  }

  function totals(ex, e) {
    const sc = SCHEMES[ex.scheme]; const out = [p(t(L.total, { bold: true }), { after: 80, keepNext: true })];
    if (sc.type === 'be') {
      const key = (ex.pct && ex.pct !== 50) ? keyFromPercent(ex.scheme, ex.pct) : sc.key;
      const rg = keyRanges(ex.scheme, key); const cw = Math.floor((W - 1600) / 6);
      const keyT = table([
        new TableRow({ children: [cell(p(t(sc.label, { bold: true, color: 'FFFFFF' })), { w: 1000, fill: '000000' }), cell(p(t(L.be)), { w: 600 }), ...rg.map(x => cell(p(t(`${fmt(x.from)}–${fmt(x.to)}`), { align: AlignmentType.CENTER }), { w: cw, fill: x.grade === e.grade ? GREY : undefined }))] }),
        new TableRow({ children: [cell(p(t(L.grade)), { w: 1000 }), cell(p(t('')), { w: 600 }), ...rg.map(x => cell(p(t(String(x.grade), { bold: x.grade === e.grade }), { align: AlignmentType.CENTER }), { w: cw, fill: x.grade === e.grade ? GREY : undefined }))] }),
      ], [1000, 600, ...rg.map(() => cw)]);
      const resT = table([
        new TableRow({ children: [cell(p(t(L.reached, { bold: true })), { w: 2000 }), cell(p(t(`${fmt(e.be)} / ${e.max}`, { bold: true }), { align: AlignmentType.CENTER }), { w: 1300 })] }),
        new TableRow({ children: [cell(p(t(L.grade, { bold: true })), { w: 2000 }), cell(p(t(String(e.grade), { bold: true }), { align: AlignmentType.CENTER }), { w: 1300 })] }),
      ], [2000, 1300], { align: AlignmentType.RIGHT });
      out.push(keyT, gap(80), resT);
    } else if (sc.type === 'bep') {
      out.push(table([
        new TableRow({ children: [cell(p(t(L.reached, { bold: true })), { w: 2600 }), cell(p(t(`${fmt(e.be)} ${L.of} ${e.max}`, { bold: true }), { align: AlignmentType.CENTER }), { w: 1600 })] }),
        new TableRow({ children: [cell(p(t(L.np, { bold: true })), { w: 2600 }), cell(p(t(String(e.np).padStart(2, '0'), { bold: true }), { align: AlignmentType.CENTER }), { w: 1600 })] }),
      ], [2600, 1600], { align: AlignmentType.RIGHT }));
    } else {
      out.push(table([
        new TableRow({ children: [cell(p(t(L.np, { bold: true })), { w: 8606, fill: GREY }), cell(p(t(fmt(e.npRaw)), { align: AlignmentType.CENTER }), { w: 1600 })] }),
        new TableRow({ children: [cell(p(t(L.npRounded, { bold: true })), { w: 8606, fill: GREY }), cell(p(t(String(e.np).padStart(2, '0'), { bold: true }), { align: AlignmentType.CENTER }), { w: 1600 })] }),
      ], [8606, 1600]));
      if (e.capNote) out.push(p(t(e.npCapped <= 3 ? L.cap : L.cap4, { italics: true }), { before: 60 }));
    }
    return out;
  }

  function verdictBlock(text) {
    return [table([new TableRow({ cantSplit: true, children: [cell(p(t(L.verdict, { bold: true })), { w: W, fill: GREY })] })], [W]),
      table([new TableRow({ children: [cell(p(t(text || '')), { w: W, v: VerticalAlign.TOP, m: TIGHT ? 40 : 60 })] })], [W]), gap(TIGHT ? 70 : 110)];
  }
  function signatures(settings) {
    /* Unterschriften bleiben immer zusammen (Linie und Beschriftung nie auf getrennten Seiten) */
    const line = () => p(t('________________________________'), { before: 220, keepNext: true });
    /* Absatz davor: sonst verschmilzt Word die Tabelle mit der Ergebnistabelle */
    const out = [gap(40), table([new TableRow({ cantSplit: true, children: [
      cell([line(), p(t(L.sigT))], { w: W / 2, borders: NONE }),
      cell(settings.parentSig ? [line(), p(t(L.sigP))] : [p(t(''))], { w: W / 2, borders: NONE }),
    ] })], [W / 2, W / 2])];
    return out;
  }

  function sheet(ex, settings, item) {
    const { s, r, e, verdict } = item; const sc = SCHEMES[ex.scheme];
    /* Viel Text (lange Notizen + Worturteil): etwas engere Abstände, damit der Bogen auf eine Seite passt */
    TIGHT = Object.values(r.notes || {}).join('').length + String(verdict || '').length > 650;
    const level = sc.type === 'np' ? 'Q 12/13' : sc.type === 'bep' ? 'B1' : sc.label;
    return [...header(ex, settings, s, level), ...catsOf(ex.scheme).flatMap(c => catBlock(ex, settings, c, r)), ...verdictBlock(verdict), ...totals(ex, e), ...signatures(settings)];
  }

  const PAGE = { page: { size: { width: 11906, height: 16838 }, margin: { top: 794, bottom: 794, left: 850, right: 850 } } };
  /* Fußzeile: theis-Wortmarke + Copyright (auf allen Word-Ausgaben) */
  const FOOT = () => {
    const wm = window.THEIS_WORDMARK; const runs = [];
    /* „© 2026“ + Logo + „· Voce“ (kein doppeltes „theis“); das Logo hat Rand ringsum und wird nicht angeschnitten */
    if (wm) { const bin = atob(wm.data.split(',')[1]); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      runs.push(t('© 2026 ', { size: 16, color: '888888' }), new ImageRun({ type: 'png', data: bytes, transformation: { width: 46, height: Math.round(46 * wm.h / wm.w) } }), t(' · Voce', { size: 16, color: '888888' })); }
    else runs.push(t('© 2026 theisapps · Voce', { size: 16, color: '888888' }));
    return { default: new Footer({ children: [p(runs, { align: AlignmentType.CENTER })] }) };
  };
  /* Bewertungsbögen: statt theis-Fußzeile die Quellenangabe des ISB (mit Link zur Fundstelle) */
  const SRC = { de: 'Bewertungsraster und Notenschlüssel:', en: 'Assessment grids and grading scale:', it: 'Griglie di valutazione e tabella dei voti:', fr: 'Grilles d’évaluation et barème :', es: 'Rúbricas de evaluación y baremo:' };
  const SRCFOOT = lang => ({ default: new Footer({ children: [
    p(t(`${SRC[lang] || SRC.de} ${ISB.name}`, { size: 13, color: '888888' }), { align: AlignmentType.CENTER }),
    p(new D.ExternalHyperlink({ link: ISB.url, children: [new TextRun({ text: ISB.url, font: FONT, size: 13, color: '5A6B8C' })] }), { align: AlignmentType.CENTER })] }) });
  /* foot === false: ohne theis-Fußzeile (Bewertungsbögen gehen an Schüler und Eltern – dort kein theis-Logo), dafür Quellenangabe ISB */
  function doc(children, many, foot) {
    const sections = (many || [children]).map(ch => ({ properties: PAGE, children: ch, footers: foot === false ? SRCFOOT(L === LBL.de ? 'de' : Object.keys(LBL).find(k => LBL[k] === L)) : FOOT() }));
    return new Document({ creator: 'Voce', styles: { default: { document: { run: { font: FONT, size: 20 } } } }, sections });
  }

  /* Einheitliche Dateinamen: „2026-11-12 10B Englisch – Prüfungsplan“ – sortieren sich im Ordner nach Datum */
  function fileBase(ex, what) {
    return [ex.date || '', ex.cls || '', ex.subject || ''].filter(x => String(x).trim()).join(' ') + ' – ' + what;
  }
  async function saveBytes(bytes, filename, ext) {
    filename = filename.replace(/[\/\\:*?"<>|]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/\s+(\.\w+)$/, '$1').trim();
    if (window.native && window.native.saveFile) {
      const r = await window.native.saveFile({ name: filename, data: bytes, ext });
      if (r && r.ok) toastMsg(`Gespeichert: ${r.name}`);
      return r;
    }
    const blob = new Blob([bytes]); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    toastMsg('Datei gespeichert');
  }
  function toastMsg(m) { const el = document.getElementById('toast'); if (!el) return; el.textContent = m; el.classList.add('show'); clearTimeout(toastMsg._t); toastMsg._t = setTimeout(() => el.classList.remove('show'), 2400); }

  async function sheets(ex, settings, items, all) {
    L = LBL[ex.wlang] || LBL.de;
    const blob = await Packer.toArrayBuffer(doc(null, items.map(it => sheet(ex, settings, it)), false));
    const name = fileBase(ex, all ? 'Bewertungsbögen' : `Bewertungsbogen ${items[0].s.last} ${items[0].s.first}`) + '.docx';
    return saveBytes(new Uint8Array(blob), name, 'docx');
  }

  async function plan(ex, settings, students) {
    L = LBL.de;
    const byId = id => students.find(s => s.id === id);
    const sch = (() => { const [h, m] = (ex.start || '08:00').split(':').map(Number); let tt = h * 60 + m; return ex.groups.map(g => { const st = tt, en = tt + (+ex.dur || 0); tt = en + (+ex.gap || 0) + (g.breakAfter ? Math.max(0, g.brk != null ? +g.brk || 0 : +ex.brk || 0) : 0); return { g, st, en }; }); })();
    const hm = x => `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
    const logo = logoRun(settings, 140, 60);
    const dateTxt = ex.date ? new Date(ex.date + 'T12:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const head = table([new TableRow({ children: [
      cell([p(t('Prüfungsplan', { bold: true, size: 36 })), p(t(`${ex.title} · ${ex.subject} · ${ex.cls}`, { size: 22 }), { before: 60 }), p(t([dateTxt, ex.room ? 'Raum ' + ex.room : ''].filter(Boolean).join(' · '), { size: 22 }), { before: 40 })], { w: 7606, borders: NONE, v: VerticalAlign.TOP }),
      cell(logo ? p(logo, { align: AlignmentType.RIGHT }) : p(t('')), { w: 2600, borders: NONE, v: VerticalAlign.TOP })] })], [7606, 2600]);
    const w = [900, 1900, 7406];
    const rows = [new TableRow({ tableHeader: true, children: [cell(p(t('Nr.', { bold: true })), { w: w[0], fill: GREY }), cell(p(t('Uhrzeit', { bold: true })), { w: w[1], fill: GREY }), cell(p(t('Schülerinnen und Schüler', { bold: true })), { w: w[2], fill: GREY })] })];
    sch.forEach(({ g, st, en }, i) => {
      rows.push(new TableRow({ cantSplit: true, children: [cell(p(t(String(i + 1), { bold: true }), { align: AlignmentType.CENTER }), { w: w[0] }), cell(p(t(`${hm(st)} – ${hm(en)}`)), { w: w[1] }),
        cell(p(t(g.members.map(byId).filter(Boolean).map(s => `${s.first} ${s.last}`.trim()).join(', '))), { w: w[2] })] }));
      if (g.breakAfter && i < sch.length - 1) rows.push(new TableRow({ children: [cell(p(t(`Pause · ${g.brk != null ? +g.brk : (+ex.brk || 0)} Min.`, { italics: true, size: 18 }), { align: AlignmentType.CENTER }), { w: W, span: 3, fill: 'F2F2F2' })] }));
    });
    const children = [head, gap(240), table(rows, w)];
    if (ex.parts) children.push(p([t('Ablauf: ', { bold: true }), t(`${ex.parts}, ${ex.dur} Minuten je Gruppe.`)], { before: 240 }));
    if (ex.planNote) children.push(p(t(ex.planNote), { before: 120 }));
    const buf = await Packer.toArrayBuffer(doc(children));
    return saveBytes(new Uint8Array(buf), fileBase(ex, 'Prüfungsplan') + '.docx', 'docx');
  }

  /* Aufgabenblätter: what = 'cards' | 'examiner', fmt = 'docx' | 'pdf' */
  async function tasks(ex, settings, students, sch, what, fmt) {
    const kit = { D, t, p, cell, table, gap, W, GREY, NONE, FONT, LBL };
    const models = Tasks.build(ex, settings, students, sch, kit, what);
    const base = fileBase(ex, what === 'cards' ? 'Prüfungskarten' : 'Prüferblätter');
    if (fmt === 'docx') {
      const buf = await Packer.toArrayBuffer(doc(null, models.map(m => Tasks.docxChildren(m, kit)), true));
      return saveBytes(new Uint8Array(buf), `${base}.docx`, 'docx');
    }
    const html = Tasks.html(models, base);
    if (fmt === 'html') return html;
    if (window.native && window.native.pdfFromHtml) { const pdf = await window.native.pdfFromHtml(html); return saveBytes(new Uint8Array(pdf), `${base}.pdf`, 'pdf'); }
    const w = window.open('', '_blank'); if (!w) { toastMsg('Das Fenster für den Ausdruck wurde blockiert.'); return; }
    w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400);
  }

  /* Modelle der Aufgabenblätter für den Druckdialog (print.js) */
  function taskModels(ex, settings, students, sch, what) { return Tasks.build(ex, settings, students, sch, { D, t, p, cell, table, gap, W, GREY, NONE, FONT, LBL }, what); }
  return { sheets, plan, tasks, saveBytes, fileBase, taskModels, LBL };
})();
