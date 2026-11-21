/* Libretto · Ausdrucke (PDF über HTML, Word über docx.js) – ein Modell, zwei Ausgaben · © 2026 theis */
'use strict';
const Print = (() => {
  /* Zahl und Einheit nie trennen („50 %“, „12 P.“, „24 BE“) – geschütztes Leerzeichen */
  const nb = s => String(s ?? '').replace(/(\d) (%|P\.|BE\b|Min\.)/g, '$1\u00a0$2');
  const esc = s => nb(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DISCLAIMER = 'Libretto ersetzt nicht die Notendokumentation der Schule. Noten bitte zeitnah ins Infoportal bzw. Schulprogramm übertragen. Berechnung nach GSO ohne Gewähr – die Verantwortung für die Notengebung liegt bei der Lehrkraft.';
  const today = () => new Date().toLocaleDateString('de-DE');

  /* Modell:
     { title, subtitle, meta: [[Label, Wert], …], blocks: [ {h:'Überschrift'} | {p:'Text'} | {table:{head:[…], rows:[[…] | {group:'Zwischenüberschrift über die ganze Breite'}], align:['l','c',…], widths:[…], bold:[colIdx], small:true}} | {pagebreak:true} ], landscape } */

  /* ---------- HTML / PDF ---------- */

  /* Notenspiegel als Säulen: Zahl und Anteil über der Säule, Note darunter, Ø als kleine Marke. Farben gedämpft – auch schwarz-weiß gut lesbar.
     b = { labels, values, avg?, upper? } */
  const GR = ['#2f8f46', '#7aa83a', '#b59a1c', '#d07a1e', '#c4402f', '#7d2a20'];
  const grOf = (b, i) => { if (!b.upper) return GR[i] || '#4a5568'; const p = +b.labels[i]; return GR[p >= 13 ? 0 : p >= 10 ? 1 : p >= 7 ? 2 : p >= 4 ? 3 : p >= 1 ? 4 : 5]; };
  function barsSvg(b, w, h) {
    const n = b.labels.length, max = Math.max(1, ...b.values), tot = b.values.reduce((x, y) => x + y, 0) || 1;
    const padL = 4, padR = 4, padT = 30, padB = 22, bw = (w - padL - padR) / n, small = n > 8;
    let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="max-width:100%;height:auto" font-family="-apple-system,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif">`;
    o += `<line x1="${padL}" y1="${h - padB + .5}" x2="${w - padR}" y2="${h - padB + .5}" stroke="#9aa1ad" stroke-width="1"/>`;
    b.values.forEach((v, i) => {
      const bh = Math.max(v ? 2 : 0, (h - padT - padB) * v / max), x = padL + i * bw + bw * (small ? .12 : .16), wd = bw * (small ? .76 : .68), y = h - padB - bh, cx = x + wd / 2;
      if (v) o += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${wd.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${grOf(b, i)}" fill-opacity=".88"/>`;
      o += `<text x="${cx.toFixed(1)}" y="${(y - (small ? 4 : 13)).toFixed(1)}" text-anchor="middle" font-size="${small ? 9 : 11}" font-weight="700" fill="#1b1d22">${v}</text>`;
      if (!small && v) o += `<text x="${cx.toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" font-size="8" fill="#3f4552">${Math.round(v / tot * 100)} %</text>`;
      o += `<text x="${cx.toFixed(1)}" y="${h - 7}" text-anchor="middle" font-size="${small ? 9 : 10.5}" font-weight="600" fill="#1b1d22">${esc(b.labels[i])}</text>`;
    });
    return o + '</svg>';
  }
  const INK = '#1d2b4f';
  const CSS = `
      *{box-sizing:border-box}
      /* „Auf weniger Seiten“: nur wenn sonst ein fast leeres letztes Blatt entstünde (siehe fitHtml in app.js) */
      body.fit1 td{padding-top:1.6px!important;padding-bottom:1.6px!important} body.fit1 h2{margin-top:11px} body.fit1 .stats{margin-bottom:8px}
      body.fit2{font-size:8.9pt} body.fit2 table{font-size:8.5pt} body.fit2 .hd{margin-bottom:8px}
      body.fit3{font-size:8.5pt} body.fit3 table{font-size:8.1pt} body.fit3 td{padding-top:1.1px!important;padding-bottom:1.1px!important} body.fit3 h2{margin:8px 0 4px} body.fit3 .stats .v{font-size:14pt}
      body{margin:0;font:9.4pt/1.42 -apple-system,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;color:#1b1d22;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .hd{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding-bottom:9px;margin-bottom:10px;border-bottom:2pt solid ${INK}}
      .hd .eyebrow{font-size:7.5pt;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#3f4552;margin-bottom:3px}
      .hd h1{margin:0;font-size:19pt;letter-spacing:-.02em;line-height:1.1;color:${INK};font-weight:750}
      .hd .sub{color:#4b5160;font-size:10pt;margin-top:4px}
      .hd .who{text-align:right;font-size:8.6pt;color:#4b5160;line-height:1.4;flex:none;max-width:42%}
      .hd .who b{color:#1b1d22;font-weight:600}
      .meta{display:flex;flex-wrap:wrap;gap:4px 6px;margin:0 0 14px}
      .meta span{font-size:8pt;color:#4b5160;background:#f1f3f7;border-radius:4px;padding:2px 7px}
      .meta b{color:#1b1d22;font-weight:600}
      h2{font-size:8pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${INK};margin:16px 0 6px;padding-bottom:3px;border-bottom:.75pt solid #d5d9e0;break-after:avoid}
      .split > div > h2:first-child{margin-top:0}
      p{margin:4px 0 8px;white-space:pre-wrap}
      p.note{font-size:7.8pt;color:#3a3f4b;line-height:1.45}
      .stats{display:flex;gap:8px;margin:0 0 14px;break-inside:avoid}
      .stats div{flex:1;border:.75pt solid #d5d9e0;border-radius:6px;padding:7px 10px 6px;min-width:0}
      .stats div.key{border:1.5pt solid ${INK};background:#f3f5fa}
      .stats .l{display:block;font-size:7pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#3f4552;white-space:nowrap}
      .stats .v{display:block;font-size:17pt;font-weight:750;letter-spacing:-.02em;line-height:1.15;color:#1b1d22;font-variant-numeric:tabular-nums;white-space:nowrap}
      .stats div.key .v{font-size:22pt;color:${INK}}
      .stats .s{display:block;font-size:7.4pt;color:#3a3f4b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .split{display:grid;grid-template-columns:var(--cols,1.35fr 1fr);gap:22px;align-items:start;break-inside:avoid;page-break-inside:avoid}
      .split.long{break-inside:auto;page-break-inside:auto}
      table.keep, .note, .kv{break-inside:avoid;page-break-inside:avoid}
      h2{break-after:avoid;page-break-after:avoid}
      .split > div{min-width:0}
      table{width:100%;border-collapse:separate;border-spacing:0;font-size:9pt;font-variant-numeric:tabular-nums;margin:0 0 10px;page-break-inside:auto}
      table.small{font-size:7.8pt}
      th{font-size:7pt;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#4b5160;border-bottom:1.25pt solid ${INK};padding:5px 5px 4px;text-align:center;vertical-align:bottom;background:#fff}
      tr.hg th{border-bottom:.75pt solid #c3c9d4;color:${INK};padding-bottom:2px}
      tr.hg th.e{border-bottom:none}
      td{border-bottom:.5pt solid #e3e6ec;padding:3.6px 5px;text-align:center;vertical-align:middle;overflow-wrap:break-word}
      table.small td{padding:2.6px 4px}
      table.dense td{padding-top:1.9px;padding-bottom:1.9px} table.dense td.big{font-size:10.5pt}
      tbody tr:nth-child(even) td{background:#f7f8fa}
      thead{display:table-header-group} tr{page-break-inside:avoid}
      .gv{display:inline-block;white-space:nowrap} .gv b{display:inline-block;min-width:var(--d);text-align:right;font-weight:inherit} .gv u{display:inline-block;min-width:calc(var(--f) + .32em);text-align:left;text-decoration:none} .gv i{display:inline-block;width:.62em;text-align:left;font-style:normal}
      td.l,th.l{text-align:left} td.b{font-weight:700} td.big{font-size:11.5pt;font-weight:750}
      td.mut{color:#3f4552}
      td.nw{white-space:nowrap} tr.hg th{white-space:nowrap}
      tr.grp td{background:#eef1f6!important;color:${INK};font-weight:700;text-align:left;font-size:8pt;letter-spacing:.03em;padding:4px 6px;border-bottom:.75pt solid #c3c9d4;break-after:avoid}
      tr.sub td{background:#fafbfc!important;color:#3a3f4b;font-size:.92em}
      tr.up td{background:#e5f4ea!important} tr.down td{background:#fbe7e5!important}
      tr.foot td{background:#eef1f6!important;font-weight:700;color:${INK};border-top:1.25pt solid ${INK};border-bottom:none}
      tr.foot + tr.foot td{border-top:.5pt solid #c3c9d4;font-weight:600;color:#4b5160}
      td.gL{border-left:.75pt solid #c3c9d4} td.gR{border-right:.75pt solid #c3c9d4}
      .pb{page-break-after:always;height:0}
      .bars{margin:2px 0 6px;break-inside:avoid}
      table.kv th{width:27%;text-align:left;vertical-align:top;font-size:7.5pt;border-bottom:.5pt solid #e3e6ec;text-transform:none;letter-spacing:0} table.kv td{text-align:left;vertical-align:top;white-space:pre-wrap;background:none!important}
      .keepT{break-inside:avoid;page-break-inside:avoid}
      .crit{margin:0 0 10px}
      .ci{border:.75pt solid #d5d9e0;border-radius:6px;padding:6px 10px 7px;margin:0 0 6px;break-inside:avoid;page-break-inside:avoid}
      .cTop{display:grid;grid-template-columns:minmax(0,1fr) auto 58px;gap:14px;align-items:center}
      .cName{min-width:0} .cName b{font-size:9.6pt;color:${INK};font-weight:700;line-height:1.25} .cName span{display:block;font-size:7.6pt;color:#3a3f4b;line-height:1.36;margin-top:1px}
      .cName span.cW{display:inline-block;font-size:6.8pt;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#3f4552;background:#eef0f4;border-radius:3px;padding:1px 5px;margin-left:7px;vertical-align:1.5px;white-space:nowrap}
      .cV{text-align:right;font-size:13pt;font-weight:750;color:${INK};line-height:1.05;white-space:nowrap} .cV small{display:block;font-size:7pt;font-weight:600;color:#3f4552;margin-top:2px}
      .cScale{display:flex;gap:5px;flex-wrap:nowrap;align-items:flex-end}
      .cG{display:flex;flex-direction:column;align-items:center;gap:1.5px} .cG i{font-style:normal;font-size:6.2pt;font-weight:700;color:#3f4552;letter-spacing:.04em;line-height:1}
      .cG div{display:flex;gap:1.5px}
      .cB{min-width:16px;height:15px;padding:0 3px;border:.75pt solid #aab1bd;border-radius:3px;font-size:7.2pt;font-weight:600;color:#3a3f4b;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
      .cB.on{background:${INK};border-color:${INK};color:#fff}
      .cScale.wide{gap:4px} .cScale.wide .cB{min-width:30px;height:18px;font-size:8.6pt}
      .cNote{margin-top:5px;padding-top:4px;border-top:.5pt dotted #c3c9d4;font-size:8.4pt;line-height:1.4;white-space:pre-wrap} .cNote em{font-style:normal;font-size:6.6pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#3f4552;margin-right:6px}
      .cLines{margin-top:6px} .cLines div{border-bottom:.5pt solid #b9bec8;height:17px} .cLines.wr{margin:0 0 12px;break-inside:avoid} .cLines.wr div{height:22px}
      .sig{display:flex;gap:40px;margin-top:34px;break-inside:avoid} .split .sig{gap:18px;margin-top:30px} .sig div{flex:1;border-top:.75pt solid #1b1d22;padding-top:4px;font-size:7.6pt;color:#3a3f4b}`;
  /* Kopfbereich: Titel (+ kleine Zeile darüber), Untertitel, rechts Schule und Lehrkraft; darunter die Eckdaten als Marken (ohne die doppelte Lehrkraft) */
  function headHtml(mm, settings) {
    const who = [settings.school ? `<b>${esc(settings.school)}</b>` : '', settings.teacher ? esc(settings.teacher) : ''].filter(Boolean);
    const meta = (mm.meta || []).filter(([k]) => !(settings.teacher && /^Lehrkraft/.test(k)));
    return `<div class="hd"><div>${mm.eyebrow ? `<div class="eyebrow">${esc(mm.eyebrow)}</div>` : ''}<h1>${esc(mm.title)}</h1>${mm.subtitle ? `<div class="sub">${esc(mm.subtitle)}</div>` : ''}</div>${who.length ? `<div class="who">${who.join('<br>')}</div>` : ''}</div>
      ${meta.length ? `<div class="meta">${meta.map(([k, v]) => `<span>${esc(k)} <b>${esc(v)}</b></span>`).join('')}</div>` : ''}`;
  }
  /* Tabellenzeile: Array = normale Zeile, { group } = Zwischenüberschrift, { cells, cls } = besondere Zeile (foot = Durchschnitt, sub = Zusatzzeile) */
  const rowCells = r => Array.isArray(r) ? r : r.cells;
  /* Zahlen exakt untereinander: ganze Stellen rechtsbündig, Nachkommastellen am Komma ausgerichtet, Zeichen (+ – *) in eigenem Platz dahinter.
     Gilt je Spalte nur, wenn dort verschieden breite Einträge vorkommen (z. B. 2 und 2+, 9 und 12, 6 und 6*). */
  const GV = /^(\d{1,3})(?:,(\d{1,2}))?([+\-–−*]?)$/;
  function gvCols(t) {
    return t.head.map((_, i) => { if ((t.align && t.align[i]) === 'l') return null; let dig = 0, dec = 0, sign = false, n = 0; const lens = new Set(), decs = new Set();
      t.rows.forEach(r => { if (r.group != null || (!Array.isArray(r) && r.cls === 'foot')) return; const m = GV.exec(String(rowCells(r)[i] ?? '').trim()); if (!m) return; n++;
        dig = Math.max(dig, m[1].length); lens.add(m[1].length); const d = m[2] ? m[2].length : 0; dec = Math.max(dec, d); decs.add(d); if (m[3]) sign = true; });
      return n && (sign || lens.size > 1 || decs.size > 1) ? { dig, dec, sign } : null; });
  }
  const gvHtml = (txt, g) => { const m = g && GV.exec(String(txt).trim()); if (!m) return null;
    return `<span class="gv" style="--d:${g.dig}ch;--f:${g.dec}ch"><b>${m[1]}</b>${g.dec ? `<u>${m[2] ? ',' + m[2] : ''}</u>` : ''}${g.sign ? `<i>${esc(m[3])}</i>` : ''}</span>`; };
  const gvDocx = (txt, g) => { const m = g && GV.exec(String(txt).trim()); if (!m) return txt; const F = ' ', P = ' ';
    return F.repeat(g.dig - m[1].length) + m[1] + (g.dec ? (m[2] ? ',' + m[2] + F.repeat(g.dec - m[2].length) : P + F.repeat(g.dec)) : '') + (g.sign ? (m[3] || F) : ''); };
  function tableHtml(t) {
    const n = t.head.length, al = i => (t.align && t.align[i]) === 'l' ? 'l' : '';
    const edge = i => (t.gEdge && t.gEdge[i]) || '';
    const nameCol = t.head.indexOf('Name'), gv = gvCols(t);
    const cellCls = (i, extra) => [al(i), i === nameCol ? 'nw' : '', (t.bold || []).includes(i) ? 'b' : '', (t.big || []).includes(i) ? 'big' : '', (t.muted || []).includes(i) ? 'mut' : '', edge(i), extra || ''].filter(Boolean).join(' ');
    const hg = t.headGroups ? `<tr class="hg">${t.headGroups.map(g => `<th colspan="${g.span || 1}" class="${g.label ? '' : 'e'}">${esc(g.label || '')}</th>`).join('')}</tr>` : '';
    const cg = t.pct && t.widths ? `<colgroup>${t.widths.map(x => `<col style="width:${x}%">`).join('')}</colgroup>` : '';
    /* lange Listen (ganze Klasse) etwas enger, damit bis gut 30 Namen auf eine Seite passen */
    return `<table class="${[t.small ? 'small' : '', t.keep ? 'keep' : '', t.dense || t.rows.length > 22 ? 'dense' : ''].join(' ')}"${cg ? ' style="table-layout:fixed"' : ''}>${cg}<thead>${hg}<tr>${t.head.map((h, i) => `<th class="${al(i)} ${edge(i)}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${
      t.rows.map(r => r.group != null ? `<tr class="grp"><td colspan="${n}">${esc(r.group)}</td></tr>`
        : `<tr class="${r.cls || ''}">${rowCells(r).map((c, i) => `<td class="${cellCls(i)}">${(r.cls !== 'foot' && gvHtml(c, gv[i])) || esc(c).replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  /* Bewertungsraster: je Kriterium eine Karte mit Beschreibung, Gewicht, Wert, Skala und Anmerkungen (leer: Linien zum Ausfüllen)
     c = { scale: [{ g?:'1', v:['15','14','13'] } …] oder ['++','+','–','––'], items: [{ l, d, w, v, vs, sel, note }], lines } */
  function critHtml(c) {
    const grouped = c.scale.length && typeof c.scale[0] === 'object';
    const sc = it => grouped ? `<div class="cScale">${c.scale.map(g => `<div class="cG"><i>${esc(g.g)}</i><div>${g.v.map(x => `<span class="cB ${String(it.sel) === String(x) ? 'on' : ''}">${esc(x)}</span>`).join('')}</div></div>`).join('')}</div>`
      : `<div class="cScale wide">${c.scale.map(x => `<span class="cB ${String(it.sel) === String(x) ? 'on' : ''}">${esc(x)}</span>`).join('')}</div>`;
    return `<div class="crit">${c.items.map(it => `<div class="ci"><div class="cTop"><div class="cName"><b>${esc(it.l)}</b>${it.w ? `<span class="cW">${esc(it.w)}</span>` : ''}${it.d ? `<span>${esc(it.d)}</span>` : ''}</div>${sc(it)}<div class="cV">${esc(it.v || '')}${it.vs ? `<small>${esc(it.vs)}</small>` : ''}</div></div>
      ${it.note ? `<div class="cNote"><em>Anmerkungen</em>${esc(it.note)}</div>` : (c.lines ? `<div class="cNote"><em>Anmerkungen</em></div><div class="cLines">${'<div></div>'.repeat(c.lines)}</div>` : '')}</div>`).join('')}</div>`;
  }
  /* Unterschriftsfeld nie allein auf einer neuen Seite: mit dem Block davor zusammenhalten (auch in Spalten und Gruppen) */
  const keepSig = list => { const out = []; list.forEach(b => { if (b.split) b = { ...b, split: b.split.map(keepSig) }; if (b.group) b = { group: keepSig(b.group) };
    if (b.sig && out.length && !out[out.length - 1].pagebreak && !out[out.length - 1].head) out.push({ group: [out.pop(), b] }); else out.push(b); }); return out; };
  function html(m, settings) {
    const block = b => {
      if (b.h) return `<h2>${esc(b.h)}</h2>`;
      if (b.p) return `<p>${esc(b.p)}</p>`;
      if (b.note) return `<p class="note">${esc(b.note)}</p>`;
      if (b.pagebreak) return '<div class="pb"></div>';
      if (b.bars) return `<div class="bars">${barsSvg(b.bars, b.bars.w || (b.bars.labels.length > 8 ? 470 : 330), b.bars.h || 128)}</div>`;
      if (b.head) return headHtml(b.head, settings);
      if (b.stats) return `<div class="stats">${b.stats.map(x => `<div class="${x.key ? 'key' : ''}"><span class="l">${esc(x.l)}</span><span class="v">${esc(x.v)}</span>${x.s ? `<span class="s">${esc(x.s)}</span>` : ''}</div>`).join('')}</div>`;
      if (b.split) return `<div class="split${b.long ? ' long' : ''}" style="${b.cols ? '--cols:' + b.cols : ''}">${b.split.map(col => `<div>${col.map(block).join('')}</div>`).join('')}</div>`;
      if (b.kv) return `<table class="kv"><tbody>${b.kv.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
      if (b.sig) return `<div class="sig">${b.sig.map(s => `<div>${esc(s)}</div>`).join('')}</div>`;
      if (b.table) return tableHtml(b.table);
      if (b.crit) return critHtml(b.crit);
      if (b.group) return `<div class="keepT">${b.group.map(block).join('')}</div>`;
      if (b.lines) return `<div class="cLines wr">${'<div></div>'.repeat(b.lines)}</div>`;
      return '';
    };
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
      ${headHtml(m, settings)}${keepSig(m.blocks).map(block).join('')}</body></html>`;
  }

  /* Fußzeile für jede PDF-Seite (Chromium-Fußzeilenvorlage) */
  function footer(settings) {
    const logo = window.THEIS_LOGO.replace('<svg ', '<svg style="height:10.5px;width:auto;vertical-align:-2.6px" ');
    return `<div style="width:100%;font:7.6px -apple-system,Helvetica,Arial,sans-serif;color:#222;padding:0 12.7mm;display:flex;align-items:flex-end;justify-content:space-between;gap:14px;-webkit-print-color-adjust:exact">
      <div style="flex:1;border-top:.6px solid #777;padding-top:3px;line-height:1.35">Erstellt am ${today()} · ${esc(DISCLAIMER)}</div>
      <div style="border-top:.6px solid #777;padding-top:3px;white-space:nowrap;text-align:right;line-height:1.35">Seite <span class="pageNumber"></span> / <span class="totalPages"></span><br>Libretto · ${logo} · theisapps.de</div></div>`;
  }

  /* ---------- Word ---------- */
  /* SVG → PNG (Canvas), doppelte Auflösung für scharfen Druck; null, wenn nicht möglich */
  async function barsPng(b, w, h) {
    try {
      const svg = barsSvg(b, w, h), img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
      const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
      const bin = atob(cv.toDataURL('image/png').split(',')[1]); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
    } catch (e) { return null; }
  }
  async function docx(m, settings) {
    const X = window.docx;
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, ImageRun, PageBreak, TableLayoutType, Footer, PageOrientation, VerticalAlign } = X;
    const land = !!m.landscape;
    const W = land ? 15136 : 10206;
    const FONT = 'Arial';
    const t = (text, o = {}) => new TextRun({ text: nb(text), font: FONT, size: o.size || 18, bold: !!o.bold, color: o.color });
    /* mehrzeiliger Zellentext (\n = neue Zeile, z. B. Link unter dem Titel im Quellenverzeichnis) */
    const tl = (text, o = {}) => String(text ?? '').split('\n').map((ln, k) => new TextRun({ text: nb(ln), font: FONT, size: o.size || 18, bold: !!o.bold, color: o.color, break: k ? 1 : 0 }));
    /* Text mit Zeilenumbrüchen (z. B. Protokolle) */
    const lines = (text, o = {}) => String(text ?? '').split(/\r?\n/).map((ln, i) => new TextRun({ text: ln, font: FONT, size: o.size || 18, bold: !!o.bold, color: o.color, break: i ? 1 : 0 }));
    const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], alignment: o.align, spacing: { before: o.before || 0, after: o.after ?? 60 }, keepNext: o.keepNext });
    const bd = { style: BorderStyle.SINGLE, size: 4, color: 'B9BEC8' };
    const B = { top: bd, bottom: bd, left: bd, right: bd };
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const NB = { top: none, bottom: none, left: none, right: none };
    /* Linien zum Ausfüllen: eine Tabelle mit unterer Linie je Zeile (gleiche Absatzrahmen würde Word zusammenfassen) */
    const ruled = (n, w) => new Table({ width: { size: w, type: WidthType.DXA }, columnWidths: [w], layout: TableLayoutType.FIXED, rows: Array.from({ length: n }, () => new TableRow({ cantSplit: true, height: { value: 400, rule: 'atLeast' },
      children: [new TableCell({ borders: { ...NB, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B9BEC8' } }, width: { size: w, type: WidthType.DXA }, children: [new Paragraph({ keepNext: true, children: [t('')] })] })] })) });
    const bin = atob(window.THEIS_LOGO_PNG.split(',')[1]); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const logo = () => new ImageRun({ type: 'png', data: bytes, transformation: { width: 94, height: 22 } });
    const headBlock = mm => {
      const out = [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W - 3400, 3400], layout: TableLayoutType.FIXED, rows: [new TableRow({ children: [
        new TableCell({ borders: { ...NB, bottom: { style: BorderStyle.SINGLE, size: 16, color: '1D2B4F' } }, width: { size: W - 3400, type: WidthType.DXA }, children: [...(mm.eyebrow ? [p(t(mm.eyebrow.toUpperCase(), { size: 14, bold: true, color: '6B7280' }), { after: 20 })] : []), p(t(mm.title, { size: 34, bold: true, color: '1D2B4F' }), { after: 20 }), ...(mm.subtitle ? [p(t(mm.subtitle, { size: 19, color: '555555' }), { after: 80 })] : [])] }),
        new TableCell({ borders: { ...NB, bottom: { style: BorderStyle.SINGLE, size: 16, color: '1D2B4F' } }, width: { size: 3400, type: WidthType.DXA }, children: [settings.school, settings.teacher].filter(Boolean).map(x => p(t(x, { size: 16, color: '444444' }), { align: AlignmentType.RIGHT, after: 0 })).concat([p(t(''), { after: 0 })]) }),
      ] })] })];
      const meta = (mm.meta || []).filter(([k]) => !(settings.teacher && /^Lehrkraft/.test(k)));
      /* Umbruch nur zwischen den Angaben, nie innerhalb (z. B. „Kursleitung: J. Muster“) */
      const keep = x => String(x ?? '').replace(/ /g, '\u00a0');
      if (meta.length) out.push(p(meta.flatMap(([k, v], i) => [t((i ? '    ' : '') + keep(k + ': '), { color: '555555' }), t(keep(v), { bold: true })]), { before: 120, after: 160 }));
      return out;
    };
    const kids = [...headBlock(m)];
    /* split (zwei Spalten im PDF) wird in Word untereinander gesetzt */
    /* Word kennt keine zwei Spalten: lange Liste links → die rechte Spalte (Notenspiegel, Schlüssel, Unterschrift) geschlossen auf die nächste Seite,
       statt dass nur ein Rest davon überläuft */
    const longCol = col => col.some(x => x.table && x.table.rows && x.table.rows.length > 18);
    const flat = list => list.flatMap(b => b.split ? (b.split.length > 1 && longCol(b.split[0]) ? [...b.split[0], { pagebreak: true }, ...b.split.slice(1).flat()] : b.split.flat()) : b.group ? b.group : [b]);
    for (const b of flat(m.blocks)) {
      if (b.stats) {   /* Kennzahlen als eine Zeile Kästchen; die erste (Durchschnitt) hervorgehoben */
        const n = b.stats.length, cw = Math.floor(W / n);
        const kb = { style: BorderStyle.SINGLE, size: 6, color: 'D5D9E0' }, kk = { style: BorderStyle.SINGLE, size: 30, color: '1D2B4F' };
        kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: Array(n).fill(cw), layout: TableLayoutType.FIXED, rows: [new TableRow({ children: b.stats.map(x => new TableCell({
          borders: x.key ? { top: kb, bottom: kb, left: kk, right: kb } : { top: kb, bottom: kb, left: kb, right: kb },   /* Schwerpunkt: kräftiger Balken links – rundum dick würde in Word in die Nachbarzellen laufen */ width: { size: cw, type: WidthType.DXA }, shading: x.key ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F5FA' } : undefined, margins: { top: 70, bottom: 70, left: 120, right: 120 },
          children: [p(t(String(x.l).toUpperCase(), { size: 13, bold: true, color: '6B7280' }), { after: 0 }), p(t(x.v, { size: x.key ? 40 : 32, bold: true, color: x.key ? '1D2B4F' : '1B1D22' }), { after: 0 }), ...(x.s ? [p(t(x.s, { size: 14, color: '5B6271' }), { after: 0 })] : [])] })) })] }));
        kids.push(p(t(''), { after: 120 })); continue;
      }
      if (b.note) { kids.push(p(lines(b.note, { size: 15, color: '5B6271' }))); continue; }
      if (b.h) kids.push(p(t(b.h.toUpperCase(), { size: 16, bold: true, color: '1D2B4F' }), { before: 240, after: 80, keepNext: true }));
      else if (b.p) kids.push(p(lines(b.p)));
      else if (b.kv) {
        const w1 = Math.round(W * 0.27), w2 = W - w1;
        const cell = (txt, w, head) => new TableCell({ borders: B, width: { size: w, type: WidthType.DXA }, shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF0F4' } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 },
          children: [p(lines(txt, head ? { size: 16, bold: true } : {}), { after: 0 })] });
        kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [w1, w2], layout: TableLayoutType.FIXED, rows: b.kv.map(([k, v]) => new TableRow({ cantSplit: false, children: [cell(k, w1, true), cell(v, w2, false)] })) }));
        kids.push(p(t(''), { after: 120 }));
      }
      /* „Seitenumbruch davor“ statt Umbruchzeichen: füllt der vorige Bogen die Seite genau, entsteht so keine leere Seite */
      else if (b.pagebreak) kids.push(new Paragraph({ pageBreakBefore: true, spacing: { before: 0, after: 0, line: 20, lineRule: 'exact' }, children: [new TextRun({ text: '', size: 2 })] }));
      else if (b.bars) { const wpx = b.bars.labels.length > 8 ? 420 : 320, png = await barsPng(b.bars, wpx, 130); if (png) kids.push(new Paragraph({ keepNext: true, children: [new ImageRun({ type: 'png', data: png, transformation: { width: wpx * .75, height: 130 * .75 } })], spacing: { before: 40, after: 120 }, keepNext: false })); }
      else if (b.head) kids.push(...headBlock(b.head));
      else if (b.sig) {   /* Unterschriftsfelder: Linie und Beschriftung in einer Tabellenzeile – nie getrennt */
        const n = b.sig.length, gapW = 700, cw = Math.floor((W - gapW * (n - 1)) / n), line = { style: BorderStyle.SINGLE, size: 6, color: '1B1D22' };
        const cells = []; b.sig.forEach((sg, i) => { if (i) cells.push(new TableCell({ borders: NB, width: { size: gapW, type: WidthType.DXA }, children: [p(t(''), { after: 0 })] }));
          cells.push(new TableCell({ borders: { ...NB, top: line }, width: { size: cw, type: WidthType.DXA }, margins: { top: 50, left: 0, right: 0 }, children: [p(t(sg, { size: 15, color: '3A3F4B' }), { after: 0 })] })); });
        kids.push(new Paragraph({ spacing: { before: 0, after: 0, line: 620 }, keepNext: true, children: [new TextRun({ text: '', size: 8 })] }));
        kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cells.map((_, i) => i % 2 ? gapW : cw), layout: TableLayoutType.FIXED, rows: [new TableRow({ cantSplit: true, children: cells })] }));
      }
      else if (b.lines) { kids.push(ruled(b.lines, W)); kids.push(p(t(''), { after: 120 })); }
      else if (b.crit) {   /* Bewertungsraster: je Kriterium ein zusammenhängender Kasten, nie über einen Seitenumbruch getrennt */
        const c = b.crit, grouped = c.scale.length && typeof c.scale[0] === 'object';
        const w1 = Math.round(W * 0.66), w2 = Math.round(W * 0.14), w3 = W - w1 - w2;
        const kb = { style: BorderStyle.SINGLE, size: 6, color: 'D5D9E0' };
        const box = (x, on) => new TextRun({ text: ` ${x} `, font: FONT, size: 16, bold: on, color: on ? 'FFFFFF' : '3A3F4B', shading: on ? { type: ShadingType.CLEAR, color: 'auto', fill: '1D2B4F' } : { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF0F4' } });
        const gap = s2 => new TextRun({ text: s2, font: FONT, size: 16 });
        c.items.forEach((it, ii) => {
          const scaleRuns = grouped ? c.scale.flatMap((g, gi) => [gap(gi ? '   ' : ''), new TextRun({ text: 'Note ' + g.g + ' ', font: FONT, size: 13, bold: true, color: '1D2B4F' }), ...g.v.flatMap((x, xi) => [gap(xi ? ' ' : ''), box(x, String(it.sel) === String(x))])])
            : c.scale.flatMap((x, xi) => [gap(xi ? '    ' : ''), box(x, String(it.sel) === String(x))]);
          const cell = (children, w, span, o = {}) => new TableCell({ borders: { top: o.top ? kb : NB.top, bottom: o.bottom ? kb : NB.bottom, left: o.left ? kb : NB.left, right: o.right ? kb : NB.right }, width: { size: w, type: WidthType.DXA }, columnSpan: span, verticalAlign: VerticalAlign.TOP, margins: { top: o.mt ?? 60, bottom: o.mb ?? 30, left: 140, right: 140 }, children });
          const last = !(it.note || c.lines);
          const rows = [
            new TableRow({ cantSplit: true, children: [
              cell([p(t(it.l, { size: 20, bold: true, color: '1D2B4F' }), { after: 10, keepNext: true }), ...(it.d ? [p(t(it.d, { size: 15, color: '3A3F4B' }), { after: 0, keepNext: true })] : [])], w1, 1, { top: 1, left: 1, mt: 90 }),
              cell([p(t(it.w ? String(it.w).toUpperCase() : '', { size: 13, bold: true, color: '3F4552' }), { after: 0, keepNext: true })], w2, 1, { top: 1, mt: 100 }),
              cell([p(t(it.v || '', { size: 28, bold: true, color: '1D2B4F' }), { align: AlignmentType.RIGHT, after: 0, keepNext: true }), ...(it.vs ? [p(t(it.vs, { size: 14, color: '3F4552' }), { align: AlignmentType.RIGHT, after: 0, keepNext: true })] : [])], w3, 1, { top: 1, right: 1, mt: 80 })] }),
            new TableRow({ cantSplit: true, children: [cell([p(scaleRuns, { after: 0, keepNext: !last })], W, 3, { left: 1, right: 1, bottom: last, mt: 70, mb: last ? 100 : 40 })] })];
          if (!last) rows.push(new TableRow({ cantSplit: true, children: [cell([p([new TextRun({ text: 'ANMERKUNGEN  ', font: FONT, size: 13, bold: true, color: '3F4552' }), ...lines(it.note || '', { size: 17 })], { after: 0, keepNext: !!(!it.note && c.lines) }),
            ...(!it.note && c.lines ? [ruled(c.lines, W - 280), p(t(''), { after: 0 })] : [])], W, 3, { left: 1, right: 1, bottom: 1, mt: 60, mb: 110 })] }));
          kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [w1, w2, w3], layout: TableLayoutType.FIXED, rows }));
          kids.push(new Paragraph({ spacing: { before: 0, after: 0, line: ii === c.items.length - 1 ? 200 : 110 }, children: [new TextRun({ text: '', size: 8 })] }));
        });
      }
      else if (b.table) {
        const tb = b.table, n = tb.head.length;
        const nameW = tb.align && tb.align[0] === 'l' ? Math.min(n <= 4 ? 4400 : 3200, Math.round(W * (n <= 4 ? 0.42 : 0.3))) : Math.round(W / n);   /* wenige Spalten: Namen breiter, damit sie nicht umbrechen */
        const rest = n > 1 ? Math.floor((W - nameW) / (n - 1)) : W;
        const sumW = tb.widths ? tb.widths.reduce((a, x) => a + x, 0) : 0;
        const widths = tb.widths && tb.widths.length === n ? tb.widths.map(x => Math.floor(W * x / sumW)) : tb.head.map((_, i) => i === 0 ? nameW : rest);
        const sz = tb.small || n > 14 ? 14 : 17;
        const lastRow = tb.rows.length - 1, keepT = !!tb.keep, mv = tb.dense || tb.rows.length > 22 ? 18 : 40;   /* lange Listen enger (wie im PDF) */
        const mk = (txt, i, head, rowIdx) => new TableCell({
          borders: B, width: { size: widths[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
          shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF0F4' } : (rowIdx % 2 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'FAFBFC' } : undefined),
          margins: { top: mv, bottom: mv, left: 70, right: 70 },
          children: [p(tl(txt, { size: head ? sz - 1 : ((tb.big || []).includes(i) ? 22 : sz), bold: head || (tb.bold || []).includes(i) || (tb.big || []).includes(i) }), { align: (tb.align && tb.align[i] === 'l') ? AlignmentType.LEFT : AlignmentType.CENTER, after: 0, keepNext: keepT && (head || rowIdx < lastRow) })] });
        /* Kopfgruppen (z. B. „Schreiben“ über Inhalt und Sprache) als eigene Kopfzeile */
        const hgRow = tb.headGroups ? [new TableRow({ tableHeader: true, children: (() => { let col = 0; return tb.headGroups.map(g => { const span = g.span || 1, w = widths.slice(col, col + span).reduce((x, y) => x + y, 0); col += span;
          return new TableCell({ borders: B, columnSpan: span, width: { size: w, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF0F4' }, margins: { top: 30, bottom: 30, left: 70, right: 70 }, children: [p(t(g.label || '', { size: sz - 1, bold: true, color: '1D2B4F' }), { align: AlignmentType.CENTER, after: 0 })] }); }); })() })] : [];
        const gv = gvCols(tb);
        const mkRow = (r, ri) => { const foot0 = !Array.isArray(r) && r.cls === 'foot', cells = (Array.isArray(r) ? r : r.cells).map((c, i) => foot0 ? c : gvDocx(c, gv[i])), foot = !Array.isArray(r) && r.cls === 'foot', tint = !Array.isArray(r) && ({ up: 'E5F4EA', down: 'FBE7E5' })[r.cls];
          return new TableRow({ cantSplit: true, children: cells.map((c, i) => { const cell = mk(c, i, false, ri);
            if (tint) return new TableCell({ borders: B, width: { size: widths[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, shading: { type: ShadingType.CLEAR, color: 'auto', fill: tint }, margins: { top: mv, bottom: mv, left: 70, right: 70 },
              children: [p(t(c, { size: sz, bold: (tb.bold || []).includes(i) }), { align: (tb.align && tb.align[i] === 'l') ? AlignmentType.LEFT : AlignmentType.CENTER, after: 0 })] });
            if (!foot) return cell;
            return new TableCell({ borders: B, width: { size: widths[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF1F6' }, margins: { top: mv, bottom: mv, left: 70, right: 70 },
              children: [p(t(c, { size: sz, bold: true, color: '1D2B4F' }), { align: (tb.align && tb.align[i] === 'l') ? AlignmentType.LEFT : AlignmentType.CENTER, after: 0 })] }); }) }); };
        kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: [
          ...hgRow,
          new TableRow({ tableHeader: true, children: tb.head.map((h, i) => mk(h, i, true)) }),
          ...tb.rows.map((r, ri) => r.group != null
            ? new TableRow({ cantSplit: true, children: [new TableCell({ borders: B, columnSpan: n, width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF0F4' }, margins: { top: 50, bottom: 50, left: 70, right: 70 }, children: [p(t(r.group, { size: sz, bold: true }), { after: 0, keepNext: true })] })] })
            : mkRow(r, ri))] }));
        kids.push(p(t(''), { after: 120 }));
      }
    }
    const who = [settings.teacher, settings.school].filter(Boolean).join(' · ');
    const footer = new Footer({ children: [p(t(`Erstellt am ${today()} · ${DISCLAIMER}`, { size: 14, color: '222222' }), { after: 40 }), p([t('Libretto · ', { size: 15, color: '222222' }), new ImageRun({ type: 'png', data: bytes, transformation: { width: 47, height: 11 } }), t(' · theisapps.de', { size: 15, color: '222222' })], { align: AlignmentType.RIGHT, after: 0 })] });
    const doc = new Document({ creator: 'Libretto (theisapps)', title: m.title, styles: { default: { document: { run: { font: FONT } } } },
      sections: [{ properties: { page: { size: land ? { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 } : { width: 11906, height: 16838 }   /* docx tauscht Breite und Höhe bei LANDSCAPE selbst */, margin: { top: 850, bottom: 1000, left: 850, right: 850 } } }, footers: { default: footer }, children: kids }] });
    return new Uint8Array(await (await Packer.toBlob(doc)).arrayBuffer());
  }

  /* CSV (Excel, Semikolon, UTF-8 mit BOM) */
  function csv(m) {
    /* Text, den Excel als Formel lesen würde (= + - @ am Anfang), bekommt ein Hochkomma davor; Zahlen und ein einzelnes „-“ bleiben unverändert */
    const q = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s) && !/^[-+]?\d+([.,]\d+)?$/.test(s) && s !== '-') s = "'" + s; return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [];
    const all = m.blocks.flatMap(b => b.split ? b.split.flat() : b.group ? b.group : [b]);
    all.forEach(b => { if (b.crit) { b.crit.items.forEach(it => lines.push([q(it.l), q(it.w || ''), q(it.v || ''), q(it.sel ?? ''), q(it.note || '')].join(';'))); lines.push(''); } if (b.h) lines.push(q(b.h)); if (b.stats) { b.stats.forEach(x => lines.push([q(x.l), q(x.v), q(x.s || '')].join(';'))); lines.push(''); } if (b.table) { lines.push(b.table.head.map(q).join(';')); b.table.rows.forEach(r => lines.push(r.group != null ? q(r.group) : (Array.isArray(r) ? r : r.cells).map(q).join(';'))); lines.push(''); } });
    return new TextEncoder().encode('﻿' + lines.join('\r\n'));
  }
  return { html, footer, docx, csv, DISCLAIMER, barsSvg };
})();
