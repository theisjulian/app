/* Foliva – Darstellung der Arbeitsblätter (Bildschirm und PDF identisch) · © 2026 theis
   blocks(doc, ctx) liefert die Bausteine eines Materials als HTML; die App misst sie und verteilt sie auf A4-Seiten.
   Lösungen stehen immer an ihrem Platz und werden ohne Lösungsansicht unsichtbar geschaltet – so ist das Lösungsblatt deckungsgleich.
   Schriften kennen Rollen: Anweisung (--fI), Inhalt (--fC), Titel/Kopf (--fT). Spezifischere Wahl hat Vorrang:
   Textstelle > Baustein (Rolle) > Baustein (beide) > Blatt (Rolle) > Blatt. */
(function (root) {
  'use strict';
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen.js') : null);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Schriften ---------- */
  /* Mitgelieferte Schriften (Lizenzen siehe fonts/ und „Über Foliva“). bold:false = es gibt keinen echten Fett-Schnitt. */
  const FONTS = {
    grundschrift: { label: 'Grundschrift (Christian Urff)', css: 'GSRegular', bundled: true, bold: true, punkt: 'GSPunkt', kontur: 'GSKontur', x: .43, group: 'Schulschriften' },
    theis: { label: 'theis Schuldruck Süd', css: '"theis Schuldruck Süd"', bundled: true, bold: true, x: .5, group: 'Schulschriften' },
    va: { label: 'Vereinfachte Ausgangsschrift (Playwrite DE VA)', css: '"Playwrite DE VA"', bundled: true, bold: false, x: .5, script: true, group: 'Schulschriften' },
    vaguides: { label: 'VA mit Hilfslinien (Playwrite DE VA Guides)', css: '"Playwrite DE VA Guides"', bundled: true, bold: false, x: .5, script: true, guides: true, group: 'Schulschriften' },
    system: { label: 'Arial', css: 'Arial, "Helvetica Neue", Helvetica', bold: true, x: .519, group: 'Standard' },
    serif: { label: 'Times New Roman', css: '"Times New Roman", Times, "Liberation Serif"', bold: true, x: .448, group: 'Standard' },
  };
  const cleanName = n => String(n || '').replace(/["\\<>;{}|\n\r]/g, '').trim().slice(0, 80);
  /* sys:Name = auf dem Computer installierte Schrift (wird nicht mitgeliefert); custom:Name = ältere Schreibweise (0.2) */
  const sysName = key => { const k = String(key || ''); return k.startsWith('sys:') ? cleanName(k.slice(4)) : k.startsWith('custom:') ? cleanName(k.slice(7)) : ''; };
  function fontCss(key) {
    if (!key) return '';
    const f = FONTS[key]; if (f) return f.css + ', var(--sysfont)';
    const n = sysName(key); if (n) return `"${n}", var(--sysfont)`;
    return FONTS.grundschrift.css + ', var(--sysfont)';
  }
  function fontLabel(key) { if (!key) return ''; const f = FONTS[key]; if (f) return f.label; return sysName(key) || String(key); }
  /* Schriftschlüssel aus Name oder Schlüssel (für {{Schrift|Text}} in Texten) */
  function fontKeyFromName(n) {
    n = cleanName(n); if (!n) return '';
    if (FONTS[n]) return n;
    const lo = n.toLowerCase();
    if (/^(sys:|custom:)?theis druck 02$/.test(lo)) return 'theis';   /* frühere theis-Schrift → jetzt theis Schuldruck Süd */
    for (const [k, f] of Object.entries(FONTS)) if (f.label.toLowerCase() === lo || f.label.toLowerCase().startsWith(lo + ' (') || f.css.replace(/"/g, '').split(',')[0].trim().toLowerCase() === lo) return k;
    if (/^(sys|custom):/.test(n)) return 'sys:' + sysName(n);
    return 'sys:' + n;
  }
  /* x-Höhe je Schrift (Anteil der Schriftgröße) – mitgelieferte aus den Fontdateien, sonst im Browser gemessen */
  const XCACHE = {};
  function xHeight(key) {
    if (FONTS[key]) return FONTS[key].x;
    if (XCACHE[key]) return XCACHE[key];
    try {
      if (typeof document === 'undefined') return .5;
      const c = document.createElement('canvas').getContext('2d'); c.font = `100px ${fontCss(key).replace('var(--sysfont)', 'sans-serif')}`;
      const m = c.measureText('x'); const v = m.actualBoundingBoxAscent / 100; if (v > .25 && v < .8) return (XCACHE[key] = v);
    } catch (e) {}
    return .5;
  }

  /* Textauszeichnung (fett, kursiv, Farbe, Größe, Formeln …) – siehe rt.js */
  const RT = root.FolivaRT || (typeof require !== 'undefined' ? require('./rt.js') : null);
  RT.setFontCss(f => fontCss(fontKeyFromName(f)));
  const md = s => RT.md(s);
  /* Titel des Materials: der Name bleibt reiner Text (Tabs, Dateinamen); die Formatierung liegt in titleRich */
  function titleMarkup(doc) {
    const t = doc.title || '', r = doc.titleRich;
    if (!r) return t;
    const runs = RT.parse(r);
    if (RT.plain(runs, { oneLine: true }) === t) return r;
    const u = RT.uniform(runs); return u ? RT.serialize([{ ...u, t }]) : t;
  }
  const S = (v) => `<span class="s">${esc(v)}</span>`;   /* Lösungstext */

  /* Seitenmaße in mm */
  const PAGE = { w: 210, h: 297, ml: 16, mr: 16, mt: 14, mb: 16, foot: 7 };
  PAGE.cw = PAGE.w - PAGE.ml - PAGE.mr; PAGE.ch = PAGE.h - PAGE.mt - PAGE.mb - PAGE.foot; PAGE.iw = PAGE.cw - 7.2;

  /* Lineaturen (mm): Oberlänge a · Mittelband m · Unterlänge d · Abstand gap.
     outer: Art der äußeren Linien; box: seitlich geschlossene Kastenzeile; only: welche Bänder Linien bekommen. */
  const LINEATUR = {
    l1: { name: 'Lineatur 1 (Klasse 1)', a: 6, m: 6, d: 6, gap: 5 },
    l2: { name: 'Lineatur 2 (Klasse 2)', a: 5, m: 5, d: 5, gap: 5 },
    l3: { name: 'Lineatur 3 (Klasse 3)', a: 4, m: 4, d: 4, gap: 4 },
    l4: { name: 'Lineatur 4 (Klasse 4)', a: 3.5, m: 3.5, d: 3.5, gap: 4 },
    line: { name: 'Einfache Linien', line: 9 },
    line7: { name: 'Enge Linien (Sekundarstufe)', line: 7.5 },
    karo: { name: 'Kariert 5 mm', karo: 5 },
    karo7: { name: 'Kariert 7 mm (groß)', karo: 7 },
    la0: { name: 'Lineatur 0 · Klasse 1 (6 mm)', a: 6, m: 6, d: 6, gap: 6 },
    la1: { name: 'Lineatur 1 · Klasse 1 (5 mm)', a: 5, m: 5, d: 5, gap: 5 },
    la2: { name: 'Lineatur 2 · Klasse 2 (4 mm)', a: 4, m: 4, d: 4, gap: 4 },
    la3: { name: 'Lineatur 3 · Klasse 3 (3,5 mm, 2 Linien)', a: 3.5, m: 3.5, d: 3.5, gap: 1.5, two: true },
    la4: { name: 'Lineatur 4/9 · ab Klasse 4 (10 mm)', line: 10 },
    li9: { name: 'Lineatur 21/27 · ab Klasse 5 (9 mm)', line: 9 },
    k5: { name: 'Kariert 5 mm (Lineatur 5/26/28)', karo: 5 },
    k7: { name: 'Kariert 7 mm (Lineatur 7)', karo: 7 },
    k10: { name: 'Kariert 10 mm (Lineatur R)', karo: 10 },
    /* ab 0.3: nach „Empfohlene Lineaturen“ (ISB, Ergänzende Informationen zum LehrplanPLUS Grundschule).
       Maße aus der ISB-Vorlage abgegriffen (ca.); die Vorlage nennt selbst keine Millimeter. */
    /* ab 0.9.11: schlichte Schreiblineaturen wie im Worksheet Crafter – alle Linien gleich dünn, ohne Farbband */
    g1: { name: 'Klasse 1 (Kastenzeile 3 × 5 mm)', a: 5, m: 5, d: 5, gap: 6, box: true, plain: true },
    g2: { name: 'Klasse 2 (Kastenzeile 3 × 4 mm)', a: 4, m: 4, d: 4, gap: 4, box: true, plain: true },
    g3: { name: 'Klasse 3 (Mittelband 4 mm)', a: 0, m: 4, d: 0, gap: 10, box: true, only: 'mid', plain: true },
    g4: { name: 'Klasse 4 (Linien)', line: 14, plain: true },
    isb1: { name: 'ISB Jg. 1/2 · Vierlinien, außen gepunktet', a: 4, m: 5, d: 4, gap: 5, outer: 'dot' },
    isb2: { name: 'ISB Jg. 1/2 · Kastenzeile mit drei Bändern', a: 4.6, m: 4.6, d: 4.6, gap: 5, box: true },
    isb3: { name: 'ISB Jg. 1/2 · Kastenzeile, nur Mittelband (5 mm)', a: 4, m: 5, d: 4, gap: 3, box: true, only: 'mid' },
    isb4: { name: 'ISB Jg. 1/2 · Farbiges Zeilenband', a: 4.5, m: 4.5, d: 4.5, gap: 5, box: true, only: 'outer', bandOn: true },
    isb5: { name: 'ISB Jg. 3/4 · Kastenzeile, nur Mittelband (4,7 mm)', a: 3.5, m: 4.7, d: 3.5, gap: 2, box: true, only: 'mid' },
    isb6: { name: 'ISB Jg. 3/4 · Zwei Linien mit Farbband (10,5 mm)', a: 3, m: 4.5, d: 3, gap: 2, only: 'outer', bandOn: true, tint: 'all' },
    ohne: { name: 'Keine Linien (z. B. für VA mit Hilfslinien)', a: 5, m: 5, d: 5, gap: 4, only: 'none' },
  };
  const isTraceKind = k => { const L = LINEATUR[k]; return !!(L && L.m); };

  /* Seitenmaße je Ausrichtung */
  /* Seitenränder: schmal · normal · breit (links/rechts, oben). Unten bleibt Platz für die Fußzeile. */
  const MARGINS = { schmal: [10, 9], normal: [16, 14], breit: [22, 18] };
  function dims(doc) {
    const s = (doc && doc.settings) || {}; const q = s.orient === 'quer';
    const [m, mt] = MARGINS[s.margin] || MARGINS.normal;
    const w = q ? 297 : 210, h = q ? 210 : 297, cw = w - 2 * m;
    return { q, w, h, cw, m, mt, iw: cw - 7.2, ch: h - mt - 23 };
  }

  /* Welche Bausteine sind „Aufgaben“ (nummeriert, mit Punkten) – weitere melden sich über register() an */
  const TASK = new Set(['choice', 'lines', 'lineatur', 'packet', 'wall', 'house', 'compare', 'numberline', 'sequence', 'hundred', 'written', 'clock', 'wordsearch', 'scramble', 'gap', 'match', 'vocab', 'table', 'sachaufgabe', 'space', 'image']);
  /* Bausteine ohne Aufgabenkopf, deren Text die Rolle „Titel“ bzw. „Inhalt“ hat */
  const TITLE_ROLE = new Set(['heading']);

  function head(it, ctx) {
    if (!TASK.has(it.type)) return '';
    const showNum = ctx.num != null, title = (it.title || '').trim();
    const pc = ctx.doc && ctx.doc.settings && ctx.doc.settings.pointsCol;
    const pts = ctx.probe && +it.points > 0 ? (pc ? `<span class="ipts ptsbox"><i></i>/ ${fmtPts(it.points)} P.</span>` : `<span class="ipts">${fmtPts(it.points)} P.</span>`) : '';
    if (!showNum && !title && !pts) return '';
    return `<div class="ihead">${showNum ? `<span class="inum">${ctx.num}.</span>` : ''}<span class="ititle" data-edit="title">${md(title)}</span>${pts}</div>`;
  }
  const fmtPts = p => String(+p).replace('.', ',');
  const box = (val, cls = '') => `<span class="bx ${cls}">${S(val)}</span>`;

  /* ---------- Schreiblineatur mit Vorgabe zum Nachspuren ----------
     Die Vorgabe ist SVG-Text mit exakter Grundlinie; die Größe richtet sich nach der x-Höhe der gewählten Übungsschrift. */
  function traceInfo(it, fallbackKey) {
    const key = it.pfont || fallbackKey || 'grundschrift'; const f = FONTS[key] || {};
    let mode = it.trace || 'punkt', fam = fontCss(key), note = '';
    if (mode === 'punkt') { if (f.punkt) fam = f.punkt; else { mode = 'umriss'; note = `Für „${fontLabel(key)}“ gibt es keine gepunktete Fassung – die Vorgabe wird als Umriss gezeigt.`; } }
    else if (mode === 'kontur') { if (f.kontur) fam = f.kontur; else mode = 'umriss'; }
    return { key, mode, fam, note };
  }
  function lineaturHTML(it, ctx, fallbackKey) {
    const L = { ...(LINEATUR[it.kind] || LINEATUR.la2) }; const rows = Math.max(1, Math.min(30, +it.rows || 4));
    if (L.karo) return `<div class="karos">${Array.from({ length: rows }, () => `<div class="karo" style="--k:${L.karo}mm;height:${L.karo * 2}mm"></div>`).join('')}</div>`; /* je Zeile ein Streifen: lässt sich über Seiten teilen */
    if (L.line) return `<div class="lns${L.plain ? ' lplain' : ''}" style="--sp:${L.line}mm">${Array.from({ length: rows }, () => '<div class="ln"></div>').join('')}</div>`;
    if (L.plain && !String(it.text || '').trim()) {
      const tot = L.a + L.m + L.d;
      const row = () => `<div class="lin lplain" style="height:${tot}mm;margin-bottom:${L.gap}mm">${L.only === 'mid' ? `<i class="kbox" style="top:${L.a}mm;height:${L.m}mm"></i>` : `<i class="kbox" style="top:0;height:${tot}mm"></i><i class="l" style="top:${L.a}mm"></i><i class="l" style="top:${L.a + L.m}mm"></i>`}</div>`;
      return `<div class="lins">${Array.from({ length: rows }, row).join('')}</div>`;
    }
    if (+it.m > 0) { const f = +it.m / L.m; L.m = +it.m; L.a = +(L.a * f).toFixed(2); L.d = +(L.d * f).toFixed(2); }
    const tr = traceInfo(it, fallbackKey); const F = L.m / xHeight(tr.key); const total = L.a + L.m + L.d; const W = ctx.dim.iw;
    const lines = String(it.text || '').split('\n');
    const paint = tr.mode === 'grau' ? 'fill="#b9bec6"' : tr.mode === 'umriss' ? 'fill="none" stroke="#5d6570" stroke-width=".13"' : 'fill="#222"';
    const ln = (y, cls, dot) => `<i class="l ${cls || ''} ${dot ? 'dot' : ''}" style="top:${y}mm"></i>`;
    const row = i => {
      let t = lines[i] != null ? lines[i] : (it.repeat && lines[0] ? lines[0] : '');
      if (it.fill && t) t = Array(14).fill(t).join('   ');
      const txt = t ? `<svg class="lt" viewBox="0 0 ${W} ${total}" width="${W}mm" height="${total}mm" preserveAspectRatio="xMinYMin slice"><text x="1" y="${(L.a + L.m).toFixed(2)}" font-size="${F.toFixed(3)}" style="font-family:${esc(tr.fam)}" ${paint} xml:space="preserve">${esc(t)}</text></svg>` : '';
      const bandOn = !L.plain && (L.bandOn || it.band !== false);
      const band = bandOn && L.only !== 'none' ? (L.tint === 'all' ? `<i class="band" style="top:0;height:${total}mm"></i>` : `<i class="band" style="top:${L.a}mm;height:${L.m}mm"></i>`) : '';
      let ls = '';
      if (L.only === 'none') ls = '';
      else if (L.only === 'mid') ls = `<i class="kbox" style="top:${L.a}mm;height:${L.m}mm"></i>`;
      else if (L.only === 'outer') ls = L.box ? `<i class="kbox" style="top:0;height:${total}mm"></i>` : ln(0, '') + ln(total, 'base');
      else if (L.two) ls = ln(L.a) + ln(L.a + L.m, 'base');
      else ls = (L.box ? `<i class="kbox" style="top:0;height:${total}mm"></i>` : ln(0, '', L.outer === 'dot') + ln(total, '', L.outer === 'dot')) + ln(L.a) + ln(L.a + L.m, L.plain ? '' : 'base');
      return `<div class="lin${L.plain ? ' lplain' : ''}" style="height:${total}mm;margin-bottom:${L.gap}mm">${band}${ls}${txt}</div>`;
    };
    return `<div class="lins">${Array.from({ length: rows }, (_, i) => row(i)).join('')}</div>`;
  }

  /* ---------- einzelne Bausteine ---------- */
  const R = {
    heading: it => `<h2 class="hd" data-edit="text" style="font-size:${+it.size || 20}pt;text-align:${it.align || 'left'}">${md(it.text || 'Überschrift')}</h2>`,
    text(it) {
      const body = md(it.text || '');
      if (it.lineNums) { const parts = body.split('<br>'); return `<div class="tx lnum ${it.box ? 'boxed' : ''}" style="${it.size ? `font-size:${+it.size}pt;` : ''}text-align:${it.align || 'left'}">${parts.map((p, i) => `<div class="tl"><span class="tn">${(i + 1) % 5 === 0 ? i + 1 : ''}</span><span>${p || '&nbsp;'}</span></div>`).join('')}</div>`; }
      return `<div class="tx ${it.box ? 'boxed' : ''} ${it.box && it.boxStyle ? 'bs-' + esc(it.boxStyle) : ''}" data-edit="text" data-multi="1" style="${it.size ? `font-size:${+it.size}pt;` : ''}text-align:${it.align || 'left'}">${body || '&nbsp;'}</div>`;
    },
    break: () => `<div class="pbreak">Seitenumbruch</div>`,

    choice(it) {
      const opts = it.options || [], d = it.data || {}, order = d.order && d.order.length === opts.length ? d.order : opts.map((o, i) => i);
      const mark = it.form === 'circle' ? 'ci' : 'sq';
      return `${it.question ? `<div class="q">${md(it.question)}</div>` : ''}<div class="opts" style="grid-template-columns:repeat(${Math.max(1, Math.min(6, +it.cols || 2))},minmax(0,1fr))">${order.map(i => opts[i]).filter(Boolean).map(o =>
        `<div class="opt"><span class="mk ${mark}">${o.ok ? '<span class="s">✗</span>' : ''}</span><span>${md(o.t)}</span></div>`).join('')}</div>`;
    },

    lines(it) {
      const n = Math.max(1, Math.min(40, +it.count || 3)), sp = Math.max(6, Math.min(20, +it.spacing || 9));
      const ans = String(it.answer || '').split('\n');
      return `<div class="lns" style="--sp:${sp}mm">${Array.from({ length: n }, (_, i) => `<div class="ln">${ans[i] ? S(ans[i]) : ''}</div>`).join('')}</div>`;
    },

    lineatur: (it, ctx) => lineaturHTML(it, ctx, ctx.fC),

    packet(it) {
      const d = it.data; if (!d || d.error) return err(d);
      const cols = Math.max(1, Math.min(5, +it.cols || 2));
      const cell = (t) => {
        const part = (k, v) => t.miss === k ? box(v, 'w') : `<span class="nm">${v}</span>`;
        const rest = t.op === ':' && t.rest ? ` <span class="rt">R</span> ${t.miss === 'c' ? box(t.rest, 'n') : `<span class="nm">${t.rest}</span>`}` : (t.op === ':' && it.rest ? ` <span class="rt">R</span> ${box(0, 'n')}` : '');
        return `<div class="pk">${part('a', t.a)} <span class="op">${t.op}</span> ${part('b', t.b)} <span class="op">=</span> ${part('c', t.c)}${rest}</div>`;
      };
      return `<div class="pks" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${d.tasks.map(cell).join('')}</div>`;
    },

    wall(it) {
      const d = it.data; if (!d || d.error) return err(d);
      return `<div class="walls">${d.walls.map(w => `<div class="wall">${w.rows.slice().reverse().map((row, ri) => { const i = w.rows.length - 1 - ri; return `<div class="wr">${row.map((v, k) => w.shown[i][k] ? `<span class="br">${v}</span>` : `<span class="br e">${S(v)}</span>`).join('')}</div>`; }).join('')}</div>`).join('')}</div>`;
    },

    house(it) {
      const d = it.data; if (!d || d.error) return err(d);
      return `<div class="houses">${d.houses.map(h => `<div class="house"><div class="roof"><svg viewBox="0 0 28 13" width="28mm" height="13mm" preserveAspectRatio="none"><path d="M.2 12.8 14 .4 27.8 12.8Z" fill="#fff" stroke="#3a3a3a" stroke-width=".35" stroke-linejoin="round"/></svg><span>${h.roof}</span></div>${h.floors.map(f => `<div class="fl"><span>${f.hide === 'a' ? S(f.a) : f.a}</span><span>${f.hide === 'b' ? S(f.b) : f.b}</span></div>`).join('')}</div>`).join('')}</div>`;
    },

    compare(it) {
      const d = it.data; if (!d || d.error) return err(d);
      return `<div class="pks" style="grid-template-columns:repeat(${Math.max(1, Math.min(5, +it.cols || 3))},minmax(0,1fr))">${d.tasks.map(t => `<div class="pk cmp"><span class="nm">${esc(t.L)}</span><span class="cc">${S(t.sol)}</span><span class="nm">${esc(t.R)}</span></div>`).join('')}</div>`;
    },

    numberline(it, ctx) {
      const d = it.data; if (!d || d.error) return err(d);
      const IW = ctx.dim.iw, n = d.vals.length - 1, W = IW - 10, x0 = 4, dx = W / n, ask = new Set(d.ask);
      let s = `<svg class="nl" viewBox="0 0 ${IW} 24" width="${IW}mm" height="24mm"><line x1="0" y1="8" x2="${IW - .5}" y2="8" stroke="#222" stroke-width=".35"/><path d="M${IW - 2.5} 6.3 L${IW} 8 L${IW - 2.5} 9.7" fill="none" stroke="#222" stroke-width=".35"/>`;
      d.vals.forEach((v, i) => {
        const x = x0 + i * dx, big = i % d.label === 0;
        s += `<line x1="${x}" y1="${big ? 4.5 : 6}" x2="${x}" y2="${big ? 11.5 : 10}" stroke="#222" stroke-width="${big ? .4 : .25}"/>`;
        if (big && !ask.has(i)) s += `<text x="${x}" y="17" text-anchor="middle" class="nlt">${v}</text>`;
        if (ask.has(i)) s += `<rect x="${x - Math.max(4, dx * .45)}" y="12.5" width="${Math.max(8, dx * .9)}" height="7" fill="none" stroke="#777" stroke-width=".25"/><text x="${x}" y="17.6" text-anchor="middle" class="nlt s">${v}</text>`;
      });
      return s + '</svg>';
    },

    sequence(it) {
      const d = it.data; if (!d || d.error) return err(d);
      return `<div class="seqs">${d.rows.map(r => `<div class="seq">${r.v.map((v, i) => `<span class="sq2">${r.hide.includes(i) ? S(v) : v}</span>`).join('<span class="ar">›</span>')}${it.askRule ? `<span class="rule">Regel: <span class="bx wide">${S(r.rule)}</span></span>` : ''}</div>`).join('')}</div>`;
    },

    hundred(it) {
      const d = it.data; if (!d || d.error) return err(d); const hide = new Set(d.hide);
      return `<div class="hund">${d.cells.map((v, i) => `<span>${hide.has(i) ? S(v) : v}</span>`).join('')}</div>`;
    },

    written(it) {
      const d = it.data; if (!d || d.error) return err(d);
      return `<div class="wrs" style="grid-template-columns:repeat(${Math.max(1, Math.min(4, +it.cols || 3))},max-content)">${d.tasks.map(t => {
        const width = Math.max(String(t.res).length, ...t.ns.map(n => String(n).length)) + 1;
        const row = (txt, cls = '', sol = false, sign = '') => { const s = String(txt).padStart(width - 1, ' '); return `<div class="wrow ${cls}"><span class="c sg">${sign}</span>${[...s].map(ch => `<span class="c">${sol ? (ch.trim() ? S(ch) : '') : esc(ch.trim())}</span>`).join('')}</div>`; };
        let h = '';
        if (t.op === '·') h += `<div class="wrow"><span class="c sg"></span>${[...String(t.ns[0])].map(ch => `<span class="c">${ch}</span>`).join('')}<span class="c">·</span><span class="c">${t.ns[1]}</span></div>`;
        else t.ns.forEach((n, i) => { h += row(n, '', false, i === t.ns.length - 1 ? t.op : ''); });
        h += `<div class="wrow carry"><span class="c sg"></span>${Array.from({ length: width - 1 }, () => '<span class="c"></span>').join('')}</div>`;
        h += row(t.res, 'res', true);
        return `<div class="wr1">${h}</div>`;
      }).join('')}</div>`;
    },

    clock(it) {
      const d = it.data; if (!d || d.error) return err(d); const draw = it.mode === 'einzeichnen';
      const face = (h, m) => {
        let s = `<svg viewBox="-22 -22 44 44" width="36mm" height="36mm"><circle r="20" fill="#fff" stroke="#222" stroke-width=".7"/>`;
        for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0, r1 = big ? 17 : 18.6; s += `<line x1="${(Math.sin(a) * r1).toFixed(2)}" y1="${(-Math.cos(a) * r1).toFixed(2)}" x2="${(Math.sin(a) * 19.5).toFixed(2)}" y2="${(-Math.cos(a) * 19.5).toFixed(2)}" stroke="#222" stroke-width="${big ? .7 : .25}"/>`; }
        for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += `<text x="${(Math.sin(a) * 13.6).toFixed(2)}" y="${(-Math.cos(a) * 13.6 + 1.6).toFixed(2)}" text-anchor="middle" class="ck">${i}</text>`; }
        const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
        const hands = `<line x1="0" y1="0" x2="${(Math.sin(ha) * 9).toFixed(2)}" y2="${(-Math.cos(ha) * 9).toFixed(2)}" stroke-width="1.6" stroke-linecap="round"/><line x1="0" y1="0" x2="${(Math.sin(ma) * 15).toFixed(2)}" y2="${(-Math.cos(ma) * 15).toFixed(2)}" stroke-width="1" stroke-linecap="round"/>`;
        s += draw ? `<g class="s sh">${hands}</g>` : `<g stroke="#222">${hands}</g>`;
        return s + '<circle r="1.1" fill="#222"/></svg>';
      };
      const tt = t => `${t.h}:${String(t.m).padStart(2, '0')} Uhr`;
      return `<div class="clocks" style="grid-template-columns:repeat(${Math.max(2, Math.min(4, +it.cols || 3))},minmax(0,1fr))">${d.times.map(t => `<div class="clk">${face(t.h, t.m)}<div class="ctime">${draw ? esc(tt(t)) : `<span class="bx wide">${S(tt(t))}</span>`}</div></div>`).join('')}</div>`;
    },

    wordsearch(it) {
      const d = it.data; if (!d || d.error) return err(d);
      const hit = new Set(); d.placed.forEach(p => { for (let i = 0; i < p.len; i++) hit.add((p.r + p.dr * i) + ':' + (p.c + p.dc * i)); });
      const words = d.placed.map(p => p.w);
      return `<div class="wsx"><div class="ws" style="grid-template-columns:repeat(${d.n},7.5mm)">${d.grid.map((row, r) => row.map((ch, c) => `<span class="${hit.has(r + ':' + c) ? 'hit' : ''}">${esc(ch)}</span>`).join('')).join('')}</div>${it.hideList ? '' : `<div class="wl">${words.map(w => `<span>${esc(w)}</span>`).join('')}</div>`}</div>${d.missing && d.missing.length ? err({ error: 'Nicht untergebracht: ' + d.missing.join(', ') + ' (Gitter vergrößern).' }) : ''}`;
    },

    scramble(it) {
      const d = it.data; if (!d || d.error) return err(d);
      return `<div class="scr">${d.items.map(x => `<div class="sc"><span class="mix">${esc(x.mix)}</span><span class="ln1">${S(x.src)}</span></div>`).join('')}</div>`;
    },

    gap(it) {
      const d = it.data || {}; const same = it.width === 'gleich'; let maxL = 0;
      String(it.text || '').replace(/\[([^\]]+)\]/g, (m, w) => { maxL = Math.max(maxL, w.length); return m; });
      const body = md(it.text || '').replace(/\[([^\]]+)\]/g, (m, w) => `<span class="gp" style="min-width:${((same ? maxL : w.length) * .62 + 1.6).toFixed(1)}em">${S(w)}</span>`);
      const bank = it.bank && d.bank && d.bank.length ? `<div class="bank">${d.bank.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : '';
      return `${bank}<div class="gtx">${body}</div>`;
    },

    match(it, ctx) {
      const pairs = (it.pairs || []).filter(p => (p.l || '').trim() || (p.r || '').trim()); const d = it.data || {};
      const order = d.order && d.order.length === pairs.length ? d.order : pairs.map((p, i) => i);
      const W = ctx.dim.iw, gap = 40, colW = (W - gap) / 2;
      /* Zeilenhöhe: mindestens so hoch, dass der längste Text (z. B. Rätselfragen) ganz hineinpasst */
      const fs = (+((ctx.doc || {}).settings || {}).size || 14) * .3528, plain = t => /^img:/.test(t || '') ? '' : String(t || '').replace(/[*_]/g, '');
      const need = Math.max(...pairs.map(p => Math.max(plain(p.l).length, plain(p.r).length)).map(n => Math.ceil(n * .55 * fs / Math.max(10, colW - 6)) * 1.15 * fs + 2.5), 0);
      const rh = Math.max(8, Math.min(30, +it.rowH || 11), Math.min(40, need)), H = pairs.length * rh;
      let lines = '';
      order.forEach((li, j) => { lines += `<line x1="${colW - 1.3}" y1="${li * rh + rh / 2}" x2="${colW + gap + 1.3}" y2="${j * rh + rh / 2}"/>`; });
      const cellT = t => /^img:/.test(t || '') ? `<img class="mimg" src="${esc(imgSrc(/^(lib:|data:)/.test(t.slice(4)) ? t.slice(4) : "lib:" + t.slice(4)))}" alt="">` : `<span>${md(t)}</span>`;
      return `<div class="mt" style="height:${H}mm;width:${W}mm;--rh:${rh}mm;--cw:${colW}mm"><div class="mcol l">${pairs.map(p => `<div class="mi">${cellT(p.l)}<i></i></div>`).join('')}</div>
        <div class="mcol r">${order.map(i => `<div class="mi"><i></i>${cellT(pairs[i].r)}</div>`).join('')}</div>
        <svg class="mlines s" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">${lines}</svg></div>`;
    },

    vocab(it) {
      const pairs = it.pairs || [], d = it.data || {}, order = d.order && d.order.length === pairs.length ? d.order : pairs.map((p, i) => i), ask = d.ask || [];
      return `<table class="tbl voc"><thead><tr><th>${esc(it.left || 'Deutsch')}</th><th>${esc(it.right || 'Englisch')}</th></tr></thead><tbody>${order.map(i => { const p = pairs[i] || {}, a = ask[i] || 'r'; return `<tr><td>${a === 'l' ? S(p.l) : md(p.l)}</td><td>${a === 'r' ? S(p.r) : md(p.r)}</td></tr>`; }).join('')}</tbody></table>`;
    },

    table(it) {
      const cells = it.cells || [[]], h = Math.max(6, Math.min(40, +it.rowH || 9));
      const cell = (c, tag) => `<${tag} style="height:${h}mm">${md(c || '').replace(/\[([^\]]+)\]/g, (m, w) => S(w))}</${tag}>`;
      return `<table class="tbl" style="${it.small ? 'font-size:.88em' : ''}">${cells.map((row, ri) => `<tr>${row.map(c => cell(c, ri === 0 && it.headRow ? 'th' : 'td')).join('')}</tr>`).join('')}</table>`;
    },

    image(it) {
      if (!it.src) return `<div class="imgph"><span class="imgphT">Bild auswählen …</span></div>`;
      return `<figure class="img" style="text-align:${it.align || 'center'}"><img class="${it.look ? 'lk-' + esc(it.look) : ''}" src="${esc(imgSrc(it.src))}" style="width:${Math.max(3, Math.min(100, +it.width || 60))}%" alt="">${it.caption ? `<figcaption>${md(it.caption)}</figcaption>` : ''}</figure>`;
    },

    space(it) {
      const h = Math.max(5, Math.min(250, +it.height || 40));
      return `<div class="space ${it.style || 'rahmen'}" style="height:${h}mm">${it.answer ? `<div class="spa">${S(it.answer)}</div>` : ''}</div>`;
    },

    sachaufgabe(it) {
      const f = (lab, sol, kind) => `<div class="fra"><b>${lab}</b>${kind === 'karo' ? `<div class="karo" style="--k:5mm;height:${Math.max(10, +it.calcH || 25)}mm">${sol ? `<span class="spa">${S(sol)}</span>` : ''}</div>` : `<div class="lns" style="--sp:9mm"><div class="ln">${sol ? S(sol) : ''}</div>${kind === 2 ? '<div class="ln"></div>' : ''}</div>`}</div>`;
      return `<div class="sach">${md(it.text || '')}</div>${it.frage !== false ? f('F:', it.solF, 1) : ''}${f('R:', it.solR, 'karo')}${f('A:', it.solA, 2)}`;
    },
  };
  function err(d) { return `<div class="gerr">⚠ ${esc((d && d.error) || 'Noch keine Aufgaben erzeugt.')}</div>`; }
  /* Bilder aus der mitgelieferten Bibliothek: „lib:<datei>“ */
  function imgSrc(src) { const s = String(src || ''); if (s.startsWith('lib:')) return 'bilder/' + s.slice(4).replace(/[^a-z0-9_.-]/gi, ''); return s; }

  /* Weitere Bausteine (render2.js usw.) melden sich hier an */
  function register(type, fn, opts = {}) { R[type] = fn; if (opts.task) TASK.add(type); if (opts.titleRole) TITLE_ROLE.add(type); }

  /* ---------- Kopf des Blatts ---------- */
  const HEAD_FIELDS = { name: ['Name', 62], datum: ['Datum', 32], klasse: ['Klasse', 16], fach: ['Fach', 30], note: ['Note', 14], punkte: ['Punkte', 16] };
  const ASSESS = ['Probe', 'Probearbeit', 'Lernzielkontrolle', 'Schulaufgabe', 'Stegreifaufgabe', 'Kurzarbeit', 'Test'];
  function assessLabel(doc) { return doc.kind === 'probe' ? (ASSESS.includes(doc.assess) ? doc.assess : 'Probe') : 'Arbeitsblatt'; }
  const fieldLine = (label, wgt, box) => box ? `<span class="hf hfb" style="flex:${wgt} 1 0"><small>${esc(label)}</small></span>` : `<span class="hf" style="flex:${wgt} 1 0"><b>${esc(label)}:</b><i></i></span>`;
  /* Breite eines Elements der selbst gestalteten Kopfzeile: automatisch (nach Art und Beschriftung), schmal, mittel, breit – ältere Kopfzeilen behalten ihre Verhältniszahl */
  const HC_AUTO_W = { art: 4, titel: 4, fach: 2, jg: 2.5, thema: 3, punkte: 2, heute: 1.6 };
  function hcLabelW(l) { const x = String(l || '').trim().toLowerCase(); if (/^name/.test(x)) return 4; if (/vorname|nachname/.test(x)) return 3; if (/datum/.test(x)) return 2; if (/klasse|gruppe/.test(x)) return 1.2; if (/note/.test(x)) return 1; if (/punkt/.test(x)) return 1.2; if (/fach/.test(x)) return 2; if (/unterschrift/.test(x)) return 3.5; return Math.max(1.2, Math.min(4, x.length / 4)); }
  function hcWeight(c) {
    const k = c.wk; if (k === 's') return 1; if (k === 'm') return 2; if (k === 'b') return 4;
    if (k !== 'auto' && +c.w > 0) return Math.max(.2, +c.w);
    if (c.t === 'field') return hcLabelW(c.label); if (c.t === 'box') return /note|punkt/i.test(c.label || '') ? 1 : hcLabelW(c.label) * .8;
    if (c.t === 'auto') return HC_AUTO_W[c.what] || 2; if (c.t === 'logo') return 1.2; if (c.t === 'space') return 1;
    return Math.max(1.5, Math.min(6, String(c.text || '').length / 8));
  }
  /* Selbst gestaltete Kopfzeile: Zeilen aus Bausteinen (Feld mit Linie, Text, Kästchen, Logo, automatische Angaben) */
  const AUTO = {
    titel: d => md(titleMarkup(d)), fach: d => esc(d.subject || ''), jg: d => (d.grades || []).length ? 'Jahrgangsstufe ' + d.grades.join('/') : '',
    art: d => esc(assessLabel(d) + ((d.settings || {}).assessNo ? ' Nr. ' + d.settings.assessNo : '') + (d.subject ? ' in ' + d.subject : '')),
    thema: d => esc(d.topic || ''), punkte: d => { const t = totalPoints(d); return t ? `Punkte: <i class="pl"></i> / ${fmtPts(t)}` : ''; },
    heute: () => { const x = new Date(); return x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); },
  };
  function customHead(doc) {
    const s0 = doc.settings || {}; const H = s0.headCustom || {}; let rows = Array.isArray(H.rows) ? H.rows : [];
    if (!rows.length) { const f = (Array.isArray(s0.headFields) && s0.headFields.length ? s0.headFields : ['name', 'datum', 'klasse']).filter(k => HEAD_FIELDS[k]); rows = [{ cells: f.map(k => ({ t: s0.headLook === 'kaestchen' || k === 'note' ? 'box' : 'field', label: HEAD_FIELDS[k][0], wk: 'auto' })) }]; }
    const cell = c => {
      const w = hcWeight(c), al = c.align ? `text-align:${esc(c.align)};justify-content:${c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start'};` : '';
      const st = `flex:${w} 1 0;${al}${c.size ? `font-size:${+c.size}em;` : ''}${c.bold ? 'font-weight:700;' : ''}`;
      if (c.t === 'field') return `<span class="hc hf" style="${st}"><b>${esc(c.label || '')}${c.label ? ':' : ''}</b><i></i></span>`;
      if (c.t === 'box') return `<span class="hc hbox" style="${st}"><small>${esc(c.label || '')}</small></span>`;
      if (c.t === 'logo') return `<span class="hc hlogo" style="${st}">${c.src ? `<img src="${esc(imgSrc(c.src))}" style="height:${Math.max(5, Math.min(40, +c.h || 12))}mm" alt="">` : ''}</span>`;
      if (c.t === 'auto') return `<span class="hc htxt" style="${st}">${(AUTO[c.what] || (() => ''))(doc)}</span>`;
      if (c.t === 'space') return `<span class="hc" style="${st}"></span>`;
      return `<span class="hc htxt" style="${st}">${md(c.text || '')}</span>`;
    };
    return `<div class="hcust hb-${esc(H.border || 'none')}">${rows.map(r => `<div class="hrow">${(r.cells || []).map(cell).join('')}</div>`).join('')}</div>`;
  }
  function sheetHead(doc, ctx) {
    const s = doc.settings || {}; let h = ''; const style = s.headStyle || 'linie';
    const fields = Array.isArray(s.headFields) && s.headFields.length ? s.headFields.filter(f => HEAD_FIELDS[f]) : ['name', 'datum', 'klasse'];
    const tasks = (doc.items || []).filter(it => TASK.has(it.type) && +it.points > 0);
    if (s.header !== false && style === 'eigen') h += customHead(doc);
    else if (style === 'leistung' && s.header !== false && s.headLook === 'kaestchen') {
      const sub = (doc.subject || '').trim(); const no = (s.assessNo || '').toString().trim();
      const fs = ['name', ...fields.filter(f => f !== 'name' && f !== 'note' && f !== 'fach' && f !== 'punkte'), ...(ctx.probe || fields.includes('note') ? ['note'] : [])];
      h += `<div class="lhead"><div class="lh1"><b>${esc(assessLabel(doc))}${no ? ' Nr. ' + esc(no) : ''}${sub ? ' in ' + esc(sub) : ''}</b></div><div class="lh2 lhb">${fs.map(f => fieldLine(HEAD_FIELDS[f][0], HEAD_FIELDS[f][1], true)).join('')}</div></div>`;
    } else if (style === 'leistung' && s.header !== false) {
      const sub = (doc.subject || '').trim(); const no = (s.assessNo || '').toString().trim();
      h += `<div class="lhead"><div class="lh1"><b>${esc(assessLabel(doc))}${no ? ' Nr. ' + esc(no) : ''}${sub ? ' in ' + esc(sub) : ''}</b><span>${fields.filter(f => f !== 'name' && f !== 'note' && f !== 'punkte' && f !== 'fach').map(f => `${HEAD_FIELDS[f][0]}: <i style="width:${HEAD_FIELDS[f][1] * .7}mm"></i>`).join('')}</span></div>
        <div class="lh2"><span>Name: <i></i></span>${ctx.probe || fields.includes('note') ? `<span class="lnote">Note: <i></i></span>` : ''}</div></div>`;
    } else if (s.header !== false && fields.length) {
      const bx = s.headLook === 'kaestchen';
      h += `<div class="nh ${style === 'kasten' ? 'box' : ''} ${bx ? 'nhb' : ''}">${fields.map(f => fieldLine(HEAD_FIELDS[f][0], HEAD_FIELDS[f][1], bx)).join('')}</div>`;
    }
    if (ctx.probe && tasks.length && s.pointsTable !== false && (style === 'leistung' || style === 'eigen')) {
      const tot = totalPoints(doc);
      /* Viele Aufgaben: Tabelle auf mehrere gleich lange Zeilen verteilen, damit nichts über den Rand ragt */
      const cw = (ctx.dim && ctx.dim.cw) || 180, maxC = Math.max(4, Math.floor((cw - 46) / 8.8));
      const parts = Math.ceil(tasks.length / maxC), per = Math.ceil(tasks.length / parts);
      for (let pI = 0; pI < parts; pI++) {
        const sl = tasks.slice(pI * per, (pI + 1) * per), off = pI * per, last = pI === parts - 1;
        h += `<table class="ptab${parts > 1 ? ' ptx' + (last ? '' : ' ptm') : ''}"><tr><th>Aufgabe</th>${sl.map((t, i) => `<td>${off + i + 1}</td>`).join('')}${last ? '<th class="pg">Gesamt</th>' : ''}</tr><tr><th>mögliche Punkte</th>${sl.map(t => `<td>${fmtPts(t.points)}</td>`).join('')}${last ? `<td class="pg"><b>${fmtPts(tot)}</b></td>` : ''}</tr><tr class="got"><th>erreichte Punkte</th>${sl.map(() => '<td></td>').join('')}${last ? '<td class="pg"></td>' : ''}</tr></table>`;
      }
    }
    if (s.showTitle !== false && (doc.title || '').trim()) h += `<h1 class="dt ${s.titleStyle ? 'ts-' + esc(s.titleStyle) : ''}" data-edit="doctitle"${['left', 'center', 'right'].includes(s.titleAlign) ? ` style="text-align:${s.titleAlign}"` : ''}>${md(titleMarkup(doc))}</h1>`;
    if (ctx.probe && style !== 'leistung' && style !== 'eigen') { const tot = totalPoints(doc); if (tot > 0) h += `<div class="pbox">Punkte: <i></i> von ${fmtPts(tot)}</div>`; }
    if (ctx.probe && s.gradeKey) h += `<table class="gkey"><tr><th>Note</th>${[1, 2, 3, 4, 5, 6].map(n => `<td>${n}</td>`).join('')}</tr><tr><th>Punkte</th>${[1, 2, 3, 4, 5, 6].map(() => '<td></td>').join('')}</tr></table>`;
    if (ctx.variant) h += `<div class="varmark">${esc(ctx.variant)}</div>`;
    return h ? `<div class="shead" data-zone="head" title="Kopf und Titel – anklicken zum Einstellen, Titel doppelklicken zum Ändern">${h}</div>` : '';
  }
  /* Fertige Layouts: setzen nur Gestaltungs-Einstellungen, nie Inhalte */
  const LAYOUTS = [
    { id: 'schlicht', name: 'Schlicht', set: { headStyle: 'linie', headFields: ['name', 'datum', 'klasse'], frame: 'none', titleStyle: '', margin: 'normal', header: true } },
    { id: 'kasten', name: 'Kopf im Kasten', set: { headStyle: 'kasten', headFields: ['name', 'datum', 'klasse'], frame: 'none', titleStyle: '', margin: 'normal', header: true } },
    { id: 'gs-freundlich', name: 'Grundschule freundlich', set: { headStyle: 'kasten', headFields: ['name', 'datum'], frame: 'round', titleStyle: 'band', margin: 'normal', header: true } },
    { id: 'gs-sterne', name: 'Grundschule mit Sternenrand', set: { headStyle: 'linie', headFields: ['name', 'datum'], frame: 'stars', titleStyle: 'band', margin: 'breit', header: true } },
    { id: 'sek-klar', name: 'Sachlich mit Linie', set: { headStyle: 'linie', headFields: ['name', 'klasse', 'datum'], frame: 'none', titleStyle: 'line', margin: 'normal', header: true } },
    { id: 'leistung', name: 'Leistungsnachweis', set: { headStyle: 'leistung', headFields: ['datum', 'klasse'], frame: 'none', titleStyle: '', margin: 'normal', header: true, pointsTable: true } },
    { id: 'schulaufgabe', name: 'Schulaufgabe mit Logo-Feld', set: { headStyle: 'eigen', frame: 'none', titleStyle: '', margin: 'normal', header: true, pointsTable: true, sign: true, headCustom: { border: 'box', rows: [{ cells: [{ t: 'logo', w: 1 }, { t: 'auto', what: 'art', w: 4, bold: true, size: 1.15 }, { t: 'field', label: 'Datum', w: 2 }] }, { cells: [{ t: 'field', label: 'Name', w: 4 }, { t: 'field', label: 'Klasse', w: 1.4 }, { t: 'box', label: 'Note', w: 1 }] }] } } },
    { id: 'minimal', name: 'Ohne Kopfzeile', set: { header: false, frame: 'none', titleStyle: 'left', margin: 'normal' } },
  ];
  function totalPoints(doc) { return (doc.items || []).filter(it => TASK.has(it.type)).reduce((s, it) => s + (+it.points > 0 ? +it.points : 0), 0); }

  /* Schriften eines Blatts nach Rollen */
  function sheetFonts(s) { const base = s.font || 'grundschrift'; const fI = s.fontI || base, fC = s.fontC || base; return { base, fI, fC, fT: s.fontT || fI }; }
  const cssVar = (k, key) => key ? `${k}:${fontCss(key).replace(/"/g, "'")};` : '';

  /* Alle Bausteine in Lesereihenfolge (mit Nummerierung) */
  function blocks(doc, ctx = {}) {
    const out = []; const s = doc.settings || {}; const probe = doc.kind === 'probe'; const SF = sheetFonts(s);
    const c = { ...ctx, probe, dim: dims(doc), fC: SF.fC, fI: SF.fI, doc };
    const hd = sheetHead(doc, c); if (hd) out.push({ id: '_head', html: hd, head: true });
    let n = 0;
    for (const it of doc.items || []) {
      const f = R[it.type]; if (!f) continue;
      const numbered = TASK.has(it.type) && s.numbering !== false && it.numbered !== false && !(it.type === 'image' && !(it.title || '').trim());
      const num = numbered ? ++n : null;
      if (it.type === 'break') { out.push({ id: it.id, brk: true, html: `<section class="it brk" data-id="${it.id}">${f(it, c)}</section>` }); continue; }
      const fI = it.fontI || it.font || '', fC = it.fontC || it.font || '';
      const ic = { ...c, num, fC: fC || c.fC, fI: fI || c.fI };
      let body; try { body = f(it, ic); } catch (e) { body = err({ error: 'Darstellungsfehler: ' + e.message }); }
      const tcol = typeof it.tcol === 'string' && /^#[0-9a-f]{3,8}$/i.test(it.tcol) ? it.tcol : '';
      const ca = (it.calign === 'center' || it.calign === 'right' ? ' ca-' + it.calign : '') + (it.type === 'lineatur' && it.numbered === false && !(it.title || '').trim() ? ' bare' : '');
      let st = cssVar('--fI', fI) + cssVar('--fC', fC) + (tcol ? `--tcol:${tcol};` : '');
      if (TITLE_ROLE.has(it.type) && it.font) st += cssVar('--fT', it.font);
      const free = !!it.free, dm = c.dim, cl = (v, a, b) => isFinite(v) ? Math.max(a, Math.min(b, v)) : 0;
      const dx = ctx.noOffsets ? 0 : cl(+it.dx || 0, -25, dm.cw - 15), dy = ctx.noOffsets ? 0 : free ? cl(+it.dy || 0, -dm.ch, dm.ch) : cl(+it.dy || 0, -25, Math.round(dm.ch * .6));
      if (free) { const room = Math.max(15, dm.cw - Math.max(0, cl(+it.dx || 0, -25, dm.cw - 15))); /* auch beim Messen (ohne Verschiebung) dieselbe Breite */ st += `position:absolute;left:${dx}mm;top:${dy}mm;${+it.fw ? `width:${Math.min(+it.fw, room)}mm;` : it.type === 'shape' ? `width:max-content;max-width:${room}mm;` : `width:${room}mm;`}`; } /* frei verschoben: nie über den rechten Rand */
      else { if (dx) st += `position:relative;left:${dx}mm;`; if (dy) st += `margin-top:${dy}mm;`; }
      if (it.rot) st += `transform:rotate(${+it.rot}deg);`;
      /* Lange Bausteine dürfen in Teilen geliefert werden (Array) – so fließen sie über mehrere Seiten statt eine Seite leer zu lassen */
      if (Array.isArray(body) && !free && body.length > 1) {
        const st2 = cssVar('--fI', fI) + cssVar('--fC', fC) + (tcol ? `--tcol:${tcol};` : '');
        body.forEach((part, k) => out.push({ id: it.id, dy: k ? 0 : dy, part: k, html: k === 0
          ? `<section class="it t-${it.type} part0${tcol ? ' tcol' : ''}${ca}" data-id="${it.id}" data-pdx="${dx}" data-pdy="${dy}"${st ? ` style="${st}"` : ''}>${head(it, ic)}<div class="ib">${part}</div></section>`
          : `<section class="it t-${it.type} cont${tcol ? ' tcol' : ''}${ca}" data-id="${it.id}" data-part="${k}" data-pdx="0" data-pdy="0"${st2 ? ` style="${st2}"` : ''}><div class="ib">${part}</div></section>` }));
        continue;
      }
      if (Array.isArray(body)) body = body.join('');
      out.push({ id: it.id, free, dy: free ? 0 : dy, html: `<section class="it t-${it.type}${free ? ' free' : ''}${tcol ? ' tcol' : ''}${ca}" data-id="${it.id}" data-pdx="${dx}" data-pdy="${dy}"${st ? ` style="${st}"` : ''}>${head(it, ic)}<div class="ib">${body}</div></section>` });
    }
    if (probe && s.sign) out.push({ id: '_sign', html: `<div class="signrow"><span>Kenntnis genommen:</span><i></i><small>Unterschrift einer/eines Erziehungsberechtigten</small></div>`, head: true });
    return out;
  }
  /* Hülle eines Bausteins auf der Seite (frei schwebende Bausteine nehmen keinen Platz ein) */
  const wrap = b => b.free ? `<div class="blk free"${b.lift > 0 || b.zoom ? ` style="${b.lift > 0 ? `top:-${b.lift.toFixed(2)}mm;` : ''}${b.zoom ? `zoom:${b.zoom}` : ''}"` : ''}>${b.html}</div>` : `<div class="blk" style="display:flow-root${b.zoom ? `;zoom:${b.zoom}` : ''}">${b.html}</div>`;

  /* Eine Seite: Inhalt + Fußzeile „© 2026“ + theis-Logo (nie abgeschnitten) und ggf. Seitenzahl */
  const FRAMES = [['none', 'Kein Rahmen'], ['thin', 'Dünne Linie'], ['thick', 'Kräftige Linie'], ['double', 'Doppellinie'], ['round', 'Abgerundet'], ['dash', 'Gestrichelt'], ['dots', 'Punktiert'], ['deko', 'Schmuckrand Punkte'], ['wave', 'Schmuckrand Wellen'], ['stars', 'Schmuckrand Sterne']];
  function pageVars(doc) { const s = doc.settings || {}; const SF = sheetFonts(s); return `--sf:${fontCss(SF.base).replace(/"/g, "'")};${cssVar('--fI', SF.fI)}${cssVar('--fC', SF.fC)}${cssVar('--fT', SF.fT)}--fs:${+s.size || 14}pt;--solc:${s.solColor || '#C8102E'}`; }
  /* Bilder als Umriss zum Ausmalen: Außenkontur + Farbkanten, schwarz auf weiß */
  const UMRISS = `<svg class="fdefs" width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="fUmriss" color-interpolation-filters="sRGB" x="-2%" y="-2%" width="104%" height="104%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="dil"/><feComposite in="dil" in2="SourceAlpha" operator="out" result="ring"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0" result="g"/>
    <feConvolveMatrix in="g" order="3" kernelMatrix="1 1 1 1 -8 1 1 1 1" divisor="1" preserveAlpha="true" result="e1"/>
    <feConvolveMatrix in="g" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" divisor="1" preserveAlpha="true" result="e2"/>
    <feComposite in="e1" in2="e2" operator="arithmetic" k2="1" k3="1" result="e"/>
    <feColorMatrix in="e" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 5 5 0 -0.35" result="ea"/>
    <feComposite in="ea" in2="SourceAlpha" operator="in" result="eb"/>
    <feMerge result="lines"><feMergeNode in="ring"/><feMergeNode in="eb"/></feMerge>
    <feComponentTransfer in="lines" result="lt"><feFuncA type="discrete" tableValues="0 1 1 1"/></feComponentTransfer>
    <feFlood flood-color="#111"/><feComposite in2="lt" operator="in"/></filter>
    <filter id="fUmrissK" color-interpolation-filters="sRGB" x="-4%" y="-4%" width="108%" height="108%"><feMorphology in="SourceAlpha" operator="dilate" radius=".7" result="dil"/><feComposite in="dil" in2="SourceAlpha" operator="out" result="ring"/><feFlood flood-color="#111"/><feComposite in2="ring" operator="in"/></filter></svg>`;
  /* Seitenzahl-Formate; Voreinstellung: keine Seitenzahl, kein theis-Zeichen (Fußzeile bleibt dann leer) */
  const PN_FORMATS = [['', 'keine'], ['seite-von', 'Seite 1 von 3'], ['seite', 'Seite 1'], ['slash', '1 / 3'], ['strich', '– 1 –'], ['zahl', '1']];
  function pnText(f, no, total) { return { 'seite-von': `Seite ${no} von ${total}`, seite: `Seite ${no}`, slash: `${no} / ${total}`, strich: `– ${no} –`, zahl: String(no) }[f] || ''; }
  function footer(s, no, total, opts, logo, D) {
    const pn = pnText(s.pnFmt || '', no, total); const brand = !!s.brandFoot; const ft = s.footText || '';
    const empty = !pn && !brand && !ft && !opts.sol;
    return `<div class="pf${empty ? ' pfEmpty' : ''}" data-zone="foot" style="left:${D.m}mm;right:${D.m}mm">${brand ? `<span class="cp">© 2026 ${logo}</span>` : '<span></span>'}${ft ? `<span class="ft">${esc(ft)}</span>` : ''}${opts.sol ? '<span class="lsg">Lösung</span>' : ''}<span class="pn">${esc(pn)}</span></div>`;
  }
  /* Schmuckränder als SVG: Zeichen gleichmäßig entlang der Kanten, Ecken immer belegt */
  function edgePoints(W, H, r, step) {
    const nx = Math.max(2, Math.round((W - 2 * r) / step)), ny = Math.max(2, Math.round((H - 2 * r) / step)); const pts = [];
    for (let k = 0; k <= nx; k++) { const x = r + k * (W - 2 * r) / nx; pts.push([x, r], [x, H - r]); }
    for (let k = 1; k < ny; k++) { const y = r + k * (H - 2 * r) / ny; pts.push([r, y], [W - r, y]); }
    return pts;
  }
  const f2 = v => v.toFixed(2);
  function starPath(cx, cy, R) { let d = ''; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * .45 : R; d += (k ? 'L' : 'M') + f2(cx + Math.cos(a) * rr) + ' ' + f2(cy + Math.sin(a) * rr); } return d + 'Z'; }
  function wavePath(x0, y0, x1, y1, amp, period) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / period)), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux; const seg = L / n;
    let d = `M${f2(x0)} ${f2(y0)}`;
    for (let k = 0; k < n; k++) { const sx = x0 + ux * seg * k, sy = y0 + uy * seg * k; const sgn = 1;
      d += `Q${f2(sx + ux * seg / 4 + nx * amp * sgn)} ${f2(sy + uy * seg / 4 + ny * amp * sgn)} ${f2(sx + ux * seg / 2)} ${f2(sy + uy * seg / 2)}`;
      d += `T${f2(sx + ux * seg)} ${f2(sy + uy * seg)}`; }
    return d;
  }
  const svgBox = (W, H, inner) => `<svg viewBox="0 0 ${f2(W)} ${f2(H)}" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;inset:0;overflow:visible">${inner}</svg>`;
  const DECO = {
    stars: (W, H) => svgBox(W, H, `<path fill="#5a6070" d="${edgePoints(W, H, 1.8, 6.2).map(([x, y]) => starPath(x, y, 1.7)).join('')}"/>`),
    deko: (W, H) => svgBox(W, H, `<g fill="#5a6070">${edgePoints(W, H, 1.3, 4.2).map(([x, y]) => `<circle cx="${f2(x)}" cy="${f2(y)}" r=".95"/>`).join('')}</g>`),
    wave: (W, H) => { const r = 1.5, a = 1.1, p = 6; return svgBox(W, H, `<path fill="none" stroke="#556070" stroke-width=".45" stroke-linecap="round" d="${wavePath(r, r, W - r, r, a, p)} ${wavePath(W - r, r, W - r, H - r, a, p)} ${wavePath(W - r, H - r, r, H - r, a, p)} ${wavePath(r, H - r, r, r, a, p)}"/>`); },
  };
  function page(inner, no, total, doc, opts = {}) {
    const s = doc.settings || {};
    const logo = (root.THEIS_LOGO || '').replace('<svg ', '<svg class="flogo" ');
    const D = dims(doc); const inset = Math.max(4, D.m - 9);
    const fi = Math.min(7, inset + 2);
    const fr = s.frame && s.frame !== 'none' ? (DECO[s.frame] ? `<div class="frame" style="inset:${fi}mm" aria-hidden="true">${DECO[s.frame](D.w - 2 * fi, D.h - 2 * fi, s)}</div>` : `<div class="frame fr-${esc(s.frame)}" style="inset:${fi}mm" aria-hidden="true"></div>`) : '';
    const look = s.imgLook && s.imgLook !== 'farbig' ? ' img-' + esc(s.imgLook) : '';
    return `<div class="page ${doc.fontsV ? '' : 'v1'} ${D.q ? 'land' : ''} ${opts.sol ? 'showsol' : ''}${look}" style="${pageVars(doc)}">${UMRISS}${fr}<div class="pc" style="left:${D.m}mm;right:${D.m}mm;top:${D.mt}mm">${inner}</div>
      ${footer(s, no, total, opts, logo, D)}</div>`;
  }

  /* Alle in einem Material verwendeten Schriften (für „fehlende Schrift“) */
  function usedFonts(doc) {
    const set = new Set(); const s = doc.settings || {};
    ['font', 'fontI', 'fontC', 'fontT'].forEach(k => s[k] && set.add(s[k]));
    const scan = v => { if (typeof v === 'string') { if (v.includes('{{')) RT.parse(v).forEach(r => { if (r.f) set.add(fontKeyFromName(r.f)); }); } else if (v && typeof v === 'object') Object.values(v).forEach(scan); };
    scan(doc.titleRich);
    for (const it of doc.items || []) { ['font', 'fontI', 'fontC', 'pfont'].forEach(k => it[k] && set.add(it[k])); scan(it.text); scan(it.title); scan(it.question); scan(it.caption); }
    return [...set];
  }

  const API = { DECO, edgePoints, starPath, RT, titleMarkup, PN_FORMATS, pnText, LAYOUTS, MARGINS, AUTO, blocks, page, wrap, pageVars, PAGE, LINEATUR, isTraceKind, traceInfo, TASK, TITLE_ROLE, FONTS, fontCss, fontLabel, fontKeyFromName, sysName, xHeight, dims, totalPoints, esc, md, S, box, err, R, register, imgSrc, usedFonts, sheetFonts, FRAMES, ASSESS, assessLabel, HEAD_FIELDS, fmtPts, hcWeight };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.FolivaRender = API;
})(typeof window !== 'undefined' ? window : globalThis);
