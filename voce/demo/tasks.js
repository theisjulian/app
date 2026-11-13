/* Aufgabenblätter: je Prüfling eine Karte (Monolog + Dialog) und ein Prüferblatt je Gruppe.
   Word und PDF entstehen aus demselben Modell, damit beide gleich aussehen. · © 2026 theisapps */
'use strict';
const Tasks = (() => {
  const LETTERS = ['A', 'B', 'C', 'D'];
  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* Beschriftungen der Karten in der Prüfungssprache */
  const T = {
    de: { card: 'Karte', mono: 'Monolog', dia: 'Dialog', part: 'Teil', approx: 'ca.', min: 'Min.', total: 'Gesamtdauer', noDict: 'Wörterbücher sind nicht erlaubt.', situation: 'Situation', role: 'Deine Rolle', choose: 'Wähle eines der Themen.', topic: 'Thema', group: 'Gruppe', source: 'Quelle', c: ':' },
    en: { card: 'Card', mono: 'Monologue', dia: 'Dialogue', part: 'Part', approx: 'approx.', min: 'min.', total: 'Total time', noDict: 'Dictionaries are not allowed.', situation: 'Situation', role: 'Your role', choose: 'Choose one of the topics.', topic: 'Topic', group: 'Group', source: 'Source', c: ':' },
    it: { card: 'Carta', mono: 'Monologo', dia: 'Dialogo', part: 'Parte', approx: 'circa', min: 'min.', total: 'Durata complessiva', noDict: 'Non è permesso usare il dizionario.', situation: 'Situazione', role: 'Il tuo ruolo', choose: 'Scegli uno dei temi.', topic: 'Tema', group: 'Gruppo', source: 'Fonte', c: ':' },
    fr: { card: 'Carte', mono: 'Monologue', dia: 'Dialogue', part: 'Partie', approx: 'environ', min: 'min', total: 'Durée totale', noDict: 'Les dictionnaires ne sont pas autorisés.', situation: 'Situation', role: 'Ton rôle', choose: 'Choisis l’un des sujets.', topic: 'Sujet', group: 'Groupe', source: 'Source', c: ' :' },
    es: { card: 'Tarjeta', mono: 'Monólogo', dia: 'Diálogo', part: 'Parte', approx: 'aprox.', min: 'min.', total: 'Duración total', noDict: 'No está permitido usar el diccionario.', situation: 'Situación', role: 'Tu papel', choose: 'Elige uno de los temas.', topic: 'Tema', group: 'Grupo', source: 'Fuente', c: ':' },
  };
  /* Das Prüferblatt ist für die Lehrkraft und immer deutsch */
  const TX = { sheet: 'Prüferblatt', cands: 'Prüflinge und Ablauf', name: 'Name', card: 'Karte', mono: 'Monolog', dia: 'Dialog (Rolle)', expect: 'Erwartungen', notes: 'Notizen', only: 'Nur für die Prüferin / den Prüfer', group: 'Gruppe', min: 'Min.', topic: 'Thema' };

  /* ---------- Daten ---------- */
  const newMono = () => ({ id: uid(), title: '', text: '', img: null, credit: '', expect: '' });
  const newDia = () => ({ id: uid(), title: '', situation: '', roles: ['', '', '', ''], expect: '' });
  const defaults = () => ({ mono: { on: true, min: 2, choice: 1, items: [] }, dia: { on: true, min: 4, items: [] }, noDict: true });
  /* Legt fehlende Felder an, ohne vorhandene Daten zu verändern (auch für ältere Sicherungen) */
  function ensure(ex) {
    const d = defaults(); const k = (ex.task ||= d);
    k.mono ||= d.mono; k.dia ||= d.dia;
    if (typeof k.mono.on !== 'boolean') k.mono.on = true; if (typeof k.dia.on !== 'boolean') k.dia.on = true;
    if (!(k.mono.min > 0)) k.mono.min = 2; if (!(k.dia.min > 0)) k.dia.min = 4;
    if (![1, 2, 3, 4].includes(k.mono.choice)) k.mono.choice = 1;
    k.mono.items ||= []; k.dia.items ||= [];
    for (const it of k.dia.items) { it.roles ||= ['', '', '', '']; while (it.roles.length < 4) it.roles.push(''); }
    if (typeof k.noDict !== 'boolean') k.noDict = true;
    for (const g of ex.groups || []) { g.task ||= { mono: {}, dia: '' }; g.task.mono ||= {}; g.task.dia ||= ''; }
    return k;
  }
  const monoOf = (ex, id) => ex.task.mono.items.find(i => i.id === id);
  const diaOf = (ex, id) => ex.task.dia.items.find(i => i.id === id);
  const short = (s, n = 38) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const itemName = (it, i, lang) => it.title || short(it.text || it.situation) || `${(T[lang] || T.de).topic} ${i + 1}`;

  /* Aufgaben reihum auf alle Gruppen verteilen (neben jedem Prüfling wechselt das Thema) */
  function autoAssign(ex) {
    ensure(ex); const k = ex.task; let c = 0;
    const m = k.mono.items, d = k.dia.items; const choice = Math.min(k.mono.choice, m.length);
    ex.groups.forEach((g, gi) => {
      g.task = { mono: {}, dia: d.length ? d[gi % d.length].id : '' };
      g.members.forEach(id => {
        if (!m.length) return;
        g.task.mono[id] = Array.from({ length: choice }, (_, j) => m[(c * choice + j) % m.length].id);
        c++;
      });
    });
  }
  /* Was fehlt noch? Gibt Text für den Hinweis zurück oder '' */
  function missing(ex) {
    ensure(ex); const k = ex.task;
    if (!ex.groups.length) return 'Es gibt noch keine Gruppen.';
    if (!k.mono.on && !k.dia.on) return 'Bitte mindestens einen Teil (Monolog oder Dialog) einschalten.';
    if (k.mono.on && !k.mono.items.length) return 'Bitte zuerst mindestens eine Monolog-Aufgabe anlegen.';
    if (k.dia.on && !k.dia.items.length) return 'Bitte zuerst mindestens eine Dialog-Aufgabe anlegen.';
    for (let i = 0; i < ex.groups.length; i++) {
      const g = ex.groups[i];
      if (k.dia.on && g.members.length && !diaOf(ex, g.task.dia)) return `Gruppe ${i + 1}: Dialog-Aufgabe fehlt. „Automatisch verteilen“ ergänzt alles.`;
      if (k.mono.on) for (const id of g.members) { const a = (g.task.mono[id] || []).filter(x => monoOf(ex, x)); if (a.length < Math.min(k.mono.choice, k.mono.items.length)) return `Gruppe ${i + 1}: Monolog-Aufgabe fehlt. „Automatisch verteilen“ ergänzt alles.`; }
    }
    return '';
  }

  /* ---------- Text → Blöcke ---------- */
  function rich(text) {
    const out = []; let ul = null;
    for (const raw of String(text || '').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) { ul = null; continue; }
      const m = line.match(/^[-•*]\s+(.*)$/);
      if (m) { if (!ul) { ul = { t: 'ul', items: [] }; out.push(ul); } ul.items.push(m[1]); }
      else { ul = null; out.push({ t: 'p', text: line }); }
    }
    return out;
  }

  /* ---------- Modell ---------- */
  function levelLabel(ex) { const sc = SCHEMES[ex.scheme]; return sc.type === 'np' ? 'Q 12/13' : sc.type === 'bep' ? 'B1' : sc.label; }
  function headerModel(ex, settings, L, title, lastCell) {
    const isOS = SCHEMES[ex.scheme].type !== 'be';
    const date = ex.date ? new Date(ex.date + 'T12:00').toLocaleDateString(L.locale || 'de-DE') : '';
    return { title, logo: settings.logo || null,
      rows: [[`${L.examiner}: ${settings.examiner || ''}`, `${L.school}: ${settings.school || ''}`],
        [`${isOS ? L.course : L.year}: ${isOS ? ex.cls : (settings.year || '')}`, `${isOS ? L.section : L.cls}: ${isOS ? (settings.year || '') : ex.cls}`],
        [`${L.date}: ${date}`, lastCell]] };
  }
  const subjectName = (ex, L) => (L.subj && L.subj[ex.subject]) || ex.subject;

  function cardModel(ex, settings, g, gi, mi, kit) {
    const L = kit.LBL[ex.wlang] || kit.LBL.de; const X = T[ex.wlang] || T.de; const k = ex.task; const id = g.members[mi];
    const sections = []; let n = 0;
    if (k.mono.on) {
      n++; const items = (g.task.mono[id] || []).map(x => monoOf(ex, x)).filter(Boolean); const multi = items.length > 1; const blocks = [];
      if (multi) blocks.push({ t: 'p', text: X.choose, bold: true });
      items.forEach((it, i) => {
        const head = multi ? `${X.topic} ${i + 1}${it.title ? ': ' + it.title : ''}` : it.title;
        if (head) blocks.push({ t: 'h', text: head });
        if (it.img) blocks.push({ t: 'img', img: it.img, small: multi, tiny: items.length >= 3, credit: it.credit ? `${X.source}${X.c} ${it.credit}` : '' });
        blocks.push(...rich(it.text));
        if (multi && i < items.length - 1) blocks.push({ t: 'gap' });
      });
      sections.push({ kind: 'mono', n, title: `${X.part} ${n} · ${X.mono}`, right: `${X.approx} ${k.mono.min} ${X.min}`, blocks });
    }
    if (k.dia.on) {
      n++; const it = diaOf(ex, g.task.dia); const blocks = [];
      if (it) {
        if (it.title) blocks.push({ t: 'h', text: it.title });
        const sit = rich(it.situation);
        if (sit.length) { sit[0] = { ...sit[0], label: X.situation + X.c }; blocks.push(...sit); }
        const role = rich(it.roles[mi]);
        if (role.length) blocks.push({ t: 'role', label: `${X.role} (${LETTERS[mi]})`, blocks: role });
      }
      sections.push({ kind: 'dia', n, title: `${X.part} ${n} · ${X.dia}`, right: `${X.approx} ${k.dia.min} ${X.min}`, blocks });
    }
    const total = (k.mono.on ? +k.mono.min : 0) + (k.dia.on ? +k.dia.min : 0);
    return { kind: 'card', level: levelLabel(ex),
      header: headerModel(ex, settings, L, L.hs(subjectName(ex, L)), `${X.group}: ${gi + 1}`),
      tag: `${X.card} ${LETTERS[mi]}`, subBy: { mono: k.noDict ? X.noDict : '', dia: k.noDict ? X.noDict : '' },
      sub: [`${X.total}${X.c} ${X.approx} ${total} ${X.min}`, k.noDict ? X.noDict : ''].filter(Boolean).join(' · '),
      sections };
  }

  function examinerModel(ex, settings, g, gi, slot, students, kit) {
    const L = kit.LBL.de; const k = ex.task; const hm = x => `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
    const rows = g.members.map((id, mi) => {
      const s = students.find(x => x.id === id); const monos = (g.task.mono[id] || []).map(x => monoOf(ex, x)).filter(Boolean);
      return [s ? `${s.first} ${s.last}`.trim() : '?', `${TX.card} ${LETTERS[mi]}`,
        k.mono.on ? monos.map(it => itemName(it, k.mono.items.indexOf(it))).join(' / ') : '–',
        k.dia.on ? `${LETTERS[mi]}` : '–'];
    });
    const dia = diaOf(ex, g.task.dia);
    const sections = [{ title: TX.cands, right: `${ex.dur} ${TX.min}`, blocks: [{ t: 'table', head: [TX.name, TX.card, TX.mono, TX.dia], widths: [30, 12, 42, 16], rows },
      ...(k.dia.on && dia ? [{ t: 'p', text: `${TX.dia.replace(' (Rolle)', '')}: ${itemName(dia, k.dia.items.indexOf(dia))}`, bold: true, gapBefore: true }] : [])] }];
    const exp = [];
    const used = new Set(g.members.flatMap(id => g.task.mono[id] || []));
    if (k.mono.on) k.mono.items.forEach((it, i) => { if (used.has(it.id) && it.expect.trim()) exp.push({ t: 'labelp', label: `${TX.mono} – ${itemName(it, i)}:`, text: it.expect }); });
    if (k.dia.on && dia && dia.expect.trim()) exp.push({ t: 'labelp', label: `${TX.dia.replace(' (Rolle)', '')} – ${itemName(dia, k.dia.items.indexOf(dia))}:`, text: dia.expect });
    if (exp.length) sections.push({ title: TX.expect, right: '', blocks: exp });
    sections.push({ title: TX.notes, right: '', blocks: [{ t: 'lines', n: 7 }] });
    const when = slot ? `${TX.group} ${gi + 1} · ${hm(slot.start)}–${hm(slot.end)}` : `${TX.group} ${gi + 1}`;
    return { kind: 'examiner', level: levelLabel(ex), header: headerModel(ex, settings, L, `${TX.sheet} · ${L.hs(subjectName(ex, L))}`, when), tag: '', sub: TX.only, sections, compact: true };
  }

  /* alle Karten bzw. Prüferblätter einer Prüfung */
  function build(ex, settings, students, sch, kit, what) {
    ensure(ex); const out = [];
    ex.groups.forEach((g, gi) => {
      if (!g.members.length) return;
      if (what === 'cards') g.members.forEach((id, mi) => out.push(cardModel(ex, settings, g, gi, mi, kit)));
      else out.push(examinerModel(ex, settings, g, gi, sch[gi], students, kit));
    });
    return out;
  }

  /* ---------- HTML (PDF) ---------- */
  const CSS = `@page{size:A4;margin:15mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,'Liberation Sans',Helvetica,sans-serif;font-size:10.5pt;color:#000}
.page{page-break-after:always;position:relative;min-height:266mm;display:flex;flex-direction:column}.page:last-child{page-break-after:auto}
.badge{display:flex;justify-content:flex-end;margin-bottom:5mm}.badge span{background:#000;color:#fff;font-weight:bold;padding:2mm 9mm;font-size:11pt}
table{border-collapse:collapse;width:100%}td,th{border:.5pt solid #000;padding:1.6mm 2.4mm;text-align:left;vertical-align:middle;font-weight:normal}
.hd .logo{width:34%;padding:2mm;text-align:center}.hd .logo img{max-width:100%;max-height:22mm}.title{font-weight:bold}
.card{display:flex;align-items:center;gap:4mm;margin:6mm 0 0}.tag{font-size:20pt;font-weight:bold;border:1.2pt solid #000;padding:1mm 6mm}.sub{font-size:10pt;color:#333}
h2{margin:6mm 0 0;font-size:11pt;background:#d9d9d9;border:.5pt solid #000;border-bottom:0;padding:1.8mm 2.4mm;display:flex;justify-content:space-between;font-weight:bold}h2 span{font-weight:normal}
.box{border:.5pt solid #000;padding:3.2mm 3.6mm}.box p{margin:0 0 2mm}.box ul{margin:1mm 0 2mm;padding-left:5mm}.box li{margin-bottom:1.4mm}.box h3{margin:0 0 2mm;font-size:11pt}
.cardbody p,.cardbody li{font-size:11pt}.img{margin:0 0 3mm;text-align:center}.img img{max-width:100%;max-height:72mm;border:.5pt solid #000}.img.small img{max-height:48mm}.img.tiny img{max-height:34mm}.cap{font-size:7.5pt;color:#444;margin-top:1mm}
.role{border:1.2pt solid #000;padding:3mm 3.6mm;margin-top:2.5mm}.role b{display:inline-block;background:#000;color:#fff;padding:.6mm 3mm;margin-bottom:2mm}.role p:last-child,.role ul:last-child{margin-bottom:0}
.lines div{border-bottom:.5pt solid #888;height:7.5mm}.grey{background:#d9d9d9;font-weight:bold}.gapb{margin-top:3mm!important}
.page>.box:last-of-type{margin-bottom:6mm}.foot{margin-top:auto;flex:none;font-size:7.5pt;color:#555;display:flex;justify-content:center;align-items:center;border-top:.5pt solid #999;padding-top:1.5mm}.foot img{height:3.5mm;vertical-align:middle;margin:0 .6mm}.only{font-size:8pt;color:#555}`;

  function blockHtml(b) {
    if (b.t === 'p') return `<p${b.gapBefore ? ' class="gapb"' : ''}>${b.label ? `<b>${esc(b.label)}</b> ` : ''}${b.bold ? `<b>${esc(b.text)}</b>` : esc(b.text)}</p>`;
    if (b.t === 'labelp') return `<p><b>${esc(b.label)}</b></p>` + rich(b.text).map(blockHtml).join('');
    if (b.t === 'h') return `<h3>${esc(b.text)}</h3>`;
    if (b.t === 'ul') return `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
    if (b.t === 'img') return `<div class="img${b.tiny ? ' tiny' : b.small ? ' small' : ''}"><img src="${b.img.data}">${b.credit ? `<div class="cap">${esc(b.credit)}</div>` : ''}</div>`;
    if (b.t === 'gap') return '<div style="height:4mm"></div>';
    if (b.t === 'role') return `<div class="role"><b>${esc(b.label)}</b>${b.blocks.map(blockHtml).join('')}</div>`;
    if (b.t === 'lines') return `<div class="lines">${'<div></div>'.repeat(b.n)}</div>`;
    if (b.t === 'table') return `<table style="margin:0"><tr class="grey">${b.head.map((h, i) => `<th style="width:${b.widths[i]}%">${esc(h)}</th>`).join('')}</tr>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    return '';
  }
  function pageHtml(m, wordmark) {
    const h = m.header;
    return `<div class="page"><div class="badge"><span>${esc(m.level)}</span></div>
<table class="hd"><tr><td class="title" colspan="2">${esc(h.title)}</td><td class="logo" rowspan="4">${h.logo ? `<img src="${h.logo.data}">` : ''}</td></tr>
${h.rows.map(r => `<tr><td style="width:33%">${esc(r[0])}</td><td style="width:33%">${esc(r[1])}</td></tr>`).join('')}</table>
${m.tag ? `<div class="card"><div class="tag">${esc(m.tag)}</div><div class="sub">${esc(m.sub)}</div></div>` : (m.sub ? `<div class="only" style="margin-top:3mm">${esc(m.sub)}</div>` : '')}
${m.sections.map(s => `<h2>${esc(s.title)}<span>${esc(s.right || '')}</span></h2><div class="box${m.kind === 'card' ? ' cardbody' : ''}">${s.blocks.map(blockHtml).join('')}</div>`).join('')}
<div class="foot"><span>${wordmark ? `© 2026 <img src="${wordmark.data}"> · Voce` : '© 2026 theisapps · Voce'}</span><span></span></div></div>`;
  }
  function html(models, title) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || 'Voce')}</title><style>${CSS}</style></head><body>${models.map(m => pageHtml(m, window.THEIS_WORDMARK)).join('')}</body></html>`;
  }

  /* ---------- Word ---------- */
  function docxChildren(m, kit) {
    const { D, t, p, cell, table, gap, W, GREY, NONE, FONT } = kit; const { TableRow, AlignmentType, VerticalAlign, ImageRun, TextRun, ShadingType, BorderStyle, Paragraph } = D;
    const b1 = { style: BorderStyle.SINGLE, size: 4, color: '000000' }; const ALL = { top: b1, bottom: b1, left: b1, right: b1 };
    const bytesOf = img => { const bin = atob(img.data.split(',')[1]); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; };
    const out = []; const h = m.header; const lw = 2800, a = 3703, b = 3703;
    out.push(table([new TableRow({ children: [cell(p(t(m.level, { bold: true, size: 24, color: 'FFFFFF' }), { align: AlignmentType.CENTER }), { w: 1300, fill: '000000', borders: NONE })] })], [1300], { align: AlignmentType.RIGHT }), gap(80));
    let logo = null;
    if (h.logo) { const s = Math.min(175 / h.logo.w, 115 / h.logo.h); logo = new ImageRun({ type: 'png', data: bytesOf(h.logo), transformation: { width: Math.round(h.logo.w * s), height: Math.round(h.logo.h * s) } }); }
    out.push(table([
      new TableRow({ children: [cell(p(t(h.title, { bold: true })), { w: a + b, span: 2 }), cell(logo ? p(logo, { align: AlignmentType.CENTER }) : p(t('')), { w: lw, rowSpan: 4 })] }),
      ...h.rows.map(r => new TableRow({ children: [cell(p(t(r[0])), { w: a }), cell(p(t(r[1])), { w: b })] })),
    ], [a, b, lw]));
    if (m.tag) {
      out.push(gap(100), table([new TableRow({ children: [
        cell(p(t(m.tag, { bold: true, size: 40 }), { align: AlignmentType.CENTER }), { w: 2300, borders: { top: { style: BorderStyle.SINGLE, size: 12, color: '000000' }, bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' }, left: { style: BorderStyle.SINGLE, size: 12, color: '000000' }, right: { style: BorderStyle.SINGLE, size: 12, color: '000000' } } }),
        cell(p(t(m.sub, { size: 19, color: '333333' })), { w: W - 2300 - 200, borders: NONE }),
      ] })], [2300, W - 2300 - 200]));
    } else if (m.sub) out.push(p(t(m.sub, { size: 16, color: '555555' }), { before: 100 }));
    const size = m.kind === 'card' ? 22 : 20;
    const inner = (blocks, width) => {
      const c = [];
      for (const bl of blocks) {
        if (bl.t === 'p') c.push(p([...(bl.label ? [t(bl.label + ' ', { bold: true, size })] : []), t(bl.text, { bold: bl.bold, size })], { after: 80, before: bl.gapBefore ? 120 : 0 }));
        else if (bl.t === 'labelp') { c.push(p(t(bl.label, { bold: true, size }), { after: 40 })); c.push(...inner(rich(bl.text), width)); }
        else if (bl.t === 'h') c.push(p(t(bl.text, { bold: true, size: size + 2 }), { after: 80, keepNext: true }));
        else if (bl.t === 'ul') bl.items.forEach(i => c.push(p(t(i, { size }), { bullet: { level: 0 }, after: 60 })));
        else if (bl.t === 'gap') c.push(p(t(''), { after: 120 }));
        else if (bl.t === 'img') {
          const mw = bl.tiny ? 260 : bl.small ? 330 : 520, mh = bl.tiny ? 130 : bl.small ? 170 : 260; const s = Math.min(mw / bl.img.w, mh / bl.img.h, 1.5);
          c.push(p(new ImageRun({ type: bl.img.data.startsWith('data:image/png') ? 'png' : 'jpg', data: bytesOf(bl.img), transformation: { width: Math.round(bl.img.w * s), height: Math.round(bl.img.h * s) } }), { align: AlignmentType.CENTER, after: bl.credit ? 20 : 120 }));
          if (bl.credit) c.push(p(t(bl.credit, { size: 14, color: '555555' }), { align: AlignmentType.RIGHT, after: 120 }));
        } else if (bl.t === 'role') {
          const th = { style: BorderStyle.SINGLE, size: 12, color: '000000' };
          c.push(table([new TableRow({ children: [cell([
            new Paragraph({ children: [new TextRun({ text: ' ' + bl.label + ' ', font: FONT, size: 20, bold: true, color: 'FFFFFF', shading: { type: ShadingType.CLEAR, color: 'auto', fill: '000000' } })], spacing: { after: 100 } }),
            ...inner(bl.blocks, width - 300)], { w: width - 300, borders: { top: th, bottom: th, left: th, right: th }, v: VerticalAlign.TOP })] })], [width - 300]));
          c.push(p(t(''), { after: 0 }));
        } else if (bl.t === 'lines') {
          const ln = { style: BorderStyle.SINGLE, size: 4, color: '888888' }; const no = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
          c.push(table(Array.from({ length: bl.n }, () => new TableRow({ height: { value: 440, rule: D.HeightRule.EXACT }, children: [cell(p(t('')), { w: width - 40, borders: { top: no, left: no, right: no, bottom: ln } })] })), [width - 40]));
          c.push(p(t(''), { after: 0 }));
        } else if (bl.t === 'table') {
          const ws = bl.widths.map(x => Math.round((width - 40) * x / 100));
          c.push(table([new TableRow({ tableHeader: true, children: bl.head.map((x, i) => cell(p(t(x, { bold: true, size: 19 })), { w: ws[i], fill: GREY })) }),
            ...bl.rows.map(r => new TableRow({ cantSplit: true, children: r.map((x, i) => cell(p(t(x, { size: 19, bold: i === 0 })), { w: ws[i] })) }))], ws));
          c.push(p(t(''), { after: 0 }));
        }
      }
      if (!c.length) c.push(p(t('')));
      return c;
    };
    for (const s of m.sections) {
      out.push(gap(m.kind === 'card' ? 160 : 140));
      out.push(table([new TableRow({ cantSplit: true, children: [cell(p(t(s.title, { bold: true })), { w: W - 2400, fill: GREY }), cell(p(t(s.right || ''), { align: AlignmentType.RIGHT }), { w: 2400, fill: GREY })] })], [W - 2400, 2400]));
      out.push(table([new TableRow({ children: [cell(inner(s.blocks, W), { w: W, v: VerticalAlign.TOP })] })], [W]));
    }
    return out;
  }
  const rich2 = rich;

  return { LETTERS, T, TX, newMono, newDia, ensure, autoAssign, missing, monoOf, diaOf, itemName, build, html, blockHtml, docxChildren, rich: rich2, defaults, short };
})();
if (typeof module !== 'undefined') module.exports = Tasks;
