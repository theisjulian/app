/* Libretto · Ausdrucke (PDF über HTML, Word über docx.js) – ein Modell, zwei Ausgaben · © 2026 theis */
'use strict';
const Print = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DISCLAIMER = 'Libretto ersetzt nicht die Notendokumentation der Schule. Noten bitte zeitnah ins Infoportal bzw. Schulprogramm übertragen. Berechnung nach GSO ohne Gewähr – die Verantwortung für die Notengebung liegt bei der Lehrkraft.';
  const today = () => new Date().toLocaleDateString('de-DE');

  /* Modell:
     { title, subtitle, meta: [[Label, Wert], …], blocks: [ {h:'Überschrift'} | {p:'Text'} | {table:{head:[…], rows:[[…] | {group:'Zwischenüberschrift über die ganze Breite'}], align:['l','c',…], widths:[…], bold:[colIdx], small:true}} | {pagebreak:true} ], landscape } */

  /* ---------- HTML / PDF ---------- */
  function html(m, settings) {
    const css = `
      *{box-sizing:border-box} body{margin:0;font:10pt/1.4 -apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;color:#16171a}
      .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:1.5pt solid #16171a;padding-bottom:8px;margin-bottom:12px}
      .hd h1{margin:0;font-size:17pt;letter-spacing:-.02em;line-height:1.15} .hd .sub{color:#555;font-size:10pt;margin-top:3px}
      .hd .who{text-align:right;font-size:9pt;color:#444;line-height:1.35;flex:none;max-width:45%}
      .meta{display:flex;flex-wrap:wrap;gap:4px 22px;font-size:9pt;color:#444;margin:0 0 12px} .meta b{color:#16171a;font-weight:600}
      h2{font-size:11.5pt;margin:16px 0 6px;break-after:avoid}
      p{margin:4px 0 8px}
      table{width:calc(100% - 2px);margin-left:1px;border-collapse:collapse;font-size:9pt;font-variant-numeric:tabular-nums;margin:2px 0 10px;page-break-inside:auto}
      table.small{font-size:8pt}
      th{background:#eef0f4;font-weight:600;font-size:8pt;text-transform:none;border:.5pt solid #b9bec8;padding:4px 5px;text-align:center}
      td{border:.5pt solid #c9cdd5;padding:3.5px 5px;text-align:center}
      tr{page-break-inside:avoid} thead{display:table-header-group}
      td.l,th.l{text-align:left} td.b{font-weight:700} td.big{font-size:12pt;font-weight:700}
      tr:nth-child(even) td{background:#fafbfc}
      tr.grp td{background:#eef0f4;font-weight:700;text-align:left;font-size:8.5pt;padding:4px 6px;break-after:avoid}
      .pb{page-break-after:always;height:0}
      .sig{display:flex;gap:30px;margin-top:28px} .sig div{flex:1;border-top:.5pt solid #16171a;padding-top:3px;font-size:8pt;color:#555}`;
    const who = [settings.school, settings.teacher].filter(Boolean);
    const head = (mm) => `<div class="hd"><div><h1>${esc(mm.title)}</h1>${mm.subtitle ? `<div class="sub">${esc(mm.subtitle)}</div>` : ''}</div>${who.length ? `<div class="who">${who.map(esc).join('<br>')}</div>` : ''}</div>
      ${mm.meta && mm.meta.length ? `<div class="meta">${mm.meta.map(([k, v]) => `<span>${esc(k)}: <b>${esc(v)}</b></span>`).join('')}</div>` : ''}`;
    const block = b => {
      if (b.h) return `<h2>${esc(b.h)}</h2>`;
      if (b.p) return `<p>${esc(b.p)}</p>`;
      if (b.pagebreak) return '<div class="pb"></div>';
      if (b.head) return head(b.head);
      if (b.sig) return `<div class="sig">${b.sig.map(s => `<div>${esc(s)}</div>`).join('')}</div>`;
      if (b.table) {
        const t = b.table, al = i => (t.align && t.align[i]) === 'l' ? 'l' : '';
        return `<table class="${t.small ? 'small' : ''}"><thead><tr>${t.head.map((h, i) => `<th class="${al(i)}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${
          t.rows.map(r => r.group != null ? `<tr class="grp"><td colspan="${t.head.length}">${esc(r.group)}</td></tr>` : `<tr>${r.map((c, i) => `<td class="${al(i)} ${(t.bold || []).includes(i) ? 'b' : ''} ${(t.big || []).includes(i) ? 'big' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      }
      return '';
    };
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${css}</style></head><body>
      ${head(m)}${m.blocks.map(block).join('')}</body></html>`;
  }

  /* Fußzeile für jede PDF-Seite (Chromium-Fußzeilenvorlage) */
  function footer(settings) {
    const logo = window.THEIS_LOGO.replace('<svg ', '<svg style="height:9px;width:auto;vertical-align:-1px" ');
    return `<div style="width:100%;font:6.5px -apple-system,Helvetica,Arial,sans-serif;color:#888;padding:0 12.7mm;display:flex;align-items:flex-end;justify-content:space-between;gap:14px;-webkit-print-color-adjust:exact">
      <div style="flex:1;border-top:.5px solid #ccc;padding-top:3px;line-height:1.35">Erstellt am ${today()} · ${esc(DISCLAIMER)}</div>
      <div style="border-top:.5px solid #ccc;padding-top:3px;white-space:nowrap;text-align:right;line-height:1.35">Seite <span class="pageNumber"></span> / <span class="totalPages"></span><br>Libretto · ${logo} · theisapps.de</div></div>`;
  }

  /* ---------- Word ---------- */
  async function docx(m, settings) {
    const X = window.docx;
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, ImageRun, PageBreak, TableLayoutType, Footer, PageOrientation, VerticalAlign } = X;
    const land = !!m.landscape;
    const W = land ? 15136 : 10206;
    const FONT = 'Arial';
    const t = (text, o = {}) => new TextRun({ text: String(text ?? ''), font: FONT, size: o.size || 18, bold: !!o.bold, color: o.color });
    const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], alignment: o.align, spacing: { before: o.before || 0, after: o.after ?? 60 }, keepNext: o.keepNext });
    const bd = { style: BorderStyle.SINGLE, size: 4, color: 'B9BEC8' };
    const B = { top: bd, bottom: bd, left: bd, right: bd };
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const NB = { top: none, bottom: none, left: none, right: none };
    const bin = atob(window.THEIS_LOGO_PNG.split(',')[1]); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const logo = () => new ImageRun({ type: 'png', data: bytes, transformation: { width: 84, height: 26 } });
    const headBlock = mm => {
      const out = [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W - 3400, 3400], layout: TableLayoutType.FIXED, rows: [new TableRow({ children: [
        new TableCell({ borders: { ...NB, bottom: { style: BorderStyle.SINGLE, size: 12, color: '16171A' } }, width: { size: W - 3400, type: WidthType.DXA }, children: [p(t(mm.title, { size: 32, bold: true }), { after: 20 }), ...(mm.subtitle ? [p(t(mm.subtitle, { size: 19, color: '555555' }), { after: 80 })] : [])] }),
        new TableCell({ borders: { ...NB, bottom: { style: BorderStyle.SINGLE, size: 12, color: '16171A' } }, width: { size: 3400, type: WidthType.DXA }, children: [settings.school, settings.teacher].filter(Boolean).map(x => p(t(x, { size: 16, color: '444444' }), { align: AlignmentType.RIGHT, after: 0 })).concat([p(t(''), { after: 0 })]) }),
      ] })] })];
      if (mm.meta && mm.meta.length) out.push(p(mm.meta.flatMap(([k, v], i) => [t((i ? '     ' : '') + k + ': ', { color: '555555' }), t(v, { bold: true })]), { before: 120, after: 160 }));
      return out;
    };
    const kids = [...headBlock(m)];
    for (const b of m.blocks) {
      if (b.h) kids.push(p(t(b.h, { size: 22, bold: true }), { before: 220, after: 80, keepNext: true }));
      else if (b.p) kids.push(p(t(b.p)));
      else if (b.pagebreak) kids.push(new Paragraph({ children: [new PageBreak()] }));
      else if (b.head) kids.push(...headBlock(b.head));
      else if (b.sig) kids.push(p(t(''), { after: 500 }), p(b.sig.map((s, i) => t((i ? '                              ' : '') + '______________________________')), {}), p(b.sig.map((s, i) => t((i ? '                                                       ' : '') + s, { size: 15, color: '555555' }))));
      else if (b.table) {
        const tb = b.table, n = tb.head.length;
        const nameW = tb.align && tb.align[0] === 'l' ? Math.min(3200, Math.round(W * 0.3)) : Math.round(W / n);
        const rest = n > 1 ? Math.floor((W - nameW) / (n - 1)) : W;
        const widths = tb.head.map((_, i) => i === 0 ? nameW : rest);
        const sz = tb.small || n > 14 ? 14 : 17;
        const mk = (txt, i, head, rowIdx) => new TableCell({
          borders: B, width: { size: widths[i], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
          shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF0F4' } : (rowIdx % 2 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'FAFBFC' } : undefined),
          margins: { top: 40, bottom: 40, left: 70, right: 70 },
          children: [p(t(txt, { size: head ? sz - 1 : ((tb.big || []).includes(i) ? 22 : sz), bold: head || (tb.bold || []).includes(i) || (tb.big || []).includes(i) }), { align: (tb.align && tb.align[i] === 'l') ? AlignmentType.LEFT : AlignmentType.CENTER, after: 0 })] });
        kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: [
          new TableRow({ tableHeader: true, children: tb.head.map((h, i) => mk(h, i, true)) }),
          ...tb.rows.map((r, ri) => r.group != null
            ? new TableRow({ cantSplit: true, children: [new TableCell({ borders: B, columnSpan: n, width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF0F4' }, margins: { top: 50, bottom: 50, left: 70, right: 70 }, children: [p(t(r.group, { size: sz, bold: true }), { after: 0, keepNext: true })] })] })
            : new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false, ri)) }))] }));
        kids.push(p(t(''), { after: 120 }));
      }
    }
    const who = [settings.teacher, settings.school].filter(Boolean).join(' · ');
    const footer = new Footer({ children: [p(t(`Erstellt am ${today()} · ${DISCLAIMER}`, { size: 12, color: '888888' }), { after: 40 }), p([t('Libretto · ', { size: 13, color: '888888' }), new ImageRun({ type: 'png', data: bytes, transformation: { width: 32, height: 10 } }), t(' · theisapps.de', { size: 13, color: '888888' })], { align: AlignmentType.RIGHT, after: 0 })] });
    const doc = new Document({ creator: 'Libretto (theis)', title: m.title, styles: { default: { document: { run: { font: FONT } } } },
      sections: [{ properties: { page: { size: land ? { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 } : { width: 11906, height: 16838 }, margin: { top: 850, bottom: 1000, left: 850, right: 850 } } }, footers: { default: footer }, children: kids }] });
    return new Uint8Array(await (await Packer.toBlob(doc)).arrayBuffer());
  }

  /* CSV (Excel, Semikolon, UTF-8 mit BOM) */
  function csv(m) {
    const q = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [];
    m.blocks.forEach(b => { if (b.h) lines.push(q(b.h)); if (b.table) { lines.push(b.table.head.map(q).join(';')); b.table.rows.forEach(r => lines.push(r.group != null ? q(r.group) : r.map(q).join(';'))); lines.push(''); } });
    return new TextEncoder().encode('﻿' + lines.join('\r\n'));
  }
  return { html, footer, docx, csv, DISCLAIMER };
})();
