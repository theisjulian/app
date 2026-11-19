/* Foliva – Darstellung: Text-Übungen und weitere Bausteine (ab 0.9.5) · © 2026 theis */
(function (root) {
  'use strict';
  const RD = root.FolivaRender || (typeof require !== 'undefined' ? require('./render.js') : null);
  const TX = root.FolivaTextEx || (typeof require !== 'undefined' ? require('./textex.js') : null);
  const { esc, md, S, box, err, register } = RD;
  const T = (type, fn, task = true, extra = {}) => register(type, fn, { task, ...extra });
  const cols = (n, lo = 1, hi = 6) => Math.max(lo, Math.min(hi, +n || lo));
  const grid = (n, w = 'minmax(0,1fr)') => `grid-template-columns:repeat(${n},${w})`;
  const hex = c => /^#[0-9a-fA-F]{3,8}$/.test(String(c || '')) ? c : '';

  /* ---------- Text mit Übungen, Rahmenfarbe und Rahmenart ---------- */
  function frameStyle(it) {
    if (!it.box) return '';
    let st = ''; const c = hex(it.frameColor); if (c) st += `border-color:${c};`;
    const fs = it.frameStyle || '';
    if (fs === 'gestrichelt') st += 'border-style:dashed;'; else if (fs === 'gepunktet') st += 'border-style:dotted;'; else if (fs === 'doppelt') st += 'border-style:double;border-width:1.2mm;'; else if (fs === 'dick') st += 'border-width:.8mm;'; else if (fs === 'eckig') st += 'border-radius:0;'; else if (fs === 'rund') st += 'border-radius:6mm;';
    const bg = hex(it.frameFill); if (bg) st += `background:${bg};`;
    return st;
  }
  function textBody(it) {
    if (TX && TX.isActive(it)) { const r = TX.render(it, { cpl: it.size ? Math.round(55 * 14 / +it.size) : 55 }); return { body: r.html, after: r.after, ex: true }; }
    return { body: md(it.text || ''), after: '', ex: false };
  }
  /* Zeilennummern: die App zählt nach dem Messen die gedruckten Zeilen und beschriftet jede 5. (siehe lineGutters) */
  const withNums = (html, on) => on ? `<div class="lnw"><span class="lng"></span>${html || '&nbsp;'}</div>` : html;
  /* Langen Text an Absätzen (Leerzeile) teilen, damit er über Seiten fließen kann */
  function splitParas(html) {
    const out = []; let cur = [];
    html.split('<br>').forEach(l => { cur.push(l); if (l.trim() === '' && cur.length > 1) { out.push(cur); cur = []; } });
    if (cur.length) out.push(cur);
    return out;
  }
  T('text', it => {
    const { body, after, ex } = textBody(it);
    const cls = `tx ${it.box ? 'boxed' : ''} ${it.box && it.boxStyle ? 'bs-' + esc(it.boxStyle) : ''} ${it.lineNums ? 'lnum' : ''}${TX ? TX.sylClass(it) : ''}${it.vow ? ' vow' : ''}`;
    const st = `${it.size ? `font-size:${+it.size}pt;` : ''}text-align:${esc(it.align || 'left')};${it.lh ? `line-height:${+it.lh};` : ''}${frameStyle(it)}`;
    /* Direkt bearbeiten nur ohne Übung (sonst würde die Übungsdarstellung zurückgeschrieben) */
    const edit = ex ? '' : ' data-edit="text" data-multi="1"';
    return `<div class="${cls}"${edit} style="${st}">${withNums(body, it.lineNums) || '&nbsp;'}</div>${after}`;
  }, false);

  T('sachtext', it => {
    const qs = String(it.questions || '').split('\n').map(q => q.trim()).filter(Boolean);
    const draft = it.status === 'entwurf' ? `<div class="draft">Entwurf – fachlich noch nicht freigegeben${it.sources ? ' · Quellen unten' : ''}</div>` : '';
    const { body, after } = textBody(it);
    const cls = `tx ${it.box ? 'boxed' : ''} ${it.lineNums ? 'lnum' : ''}${TX ? TX.sylClass(it) : ''}${it.vow ? ' vow' : ''}`;
    const qHTML = (q, i) => { const [qq, a] = q.split('|'); return `<ol class="sqs" start="${i + 1}"><li>${md(qq)}<div class="lns" style="--sp:9mm">${Array.from({ length: Math.max(1, +it.qLines || 2) }, (_, k) => `<div class="ln">${k === 0 && a ? S(a.trim()) : ''}</div>`).join('')}</div></li></ol>`; };
    const srcs = it.sources ? `<div class="srcs">Quellen: ${md(it.sources)}</div>` : '';
    /* Mit Rahmen bleibt der Text ein Stück; sonst Absätze und Fragen einzeln, damit nichts eine Seite leer lässt */
    if (it.box) return [`${draft}<div class="${cls}" style="${frameStyle(it)}">${withNums(body, it.lineNums)}</div>${after}`, ...qs.map(qHTML), ...(srcs ? [srcs] : [])];
    const paras = splitParas(body); let ln = 0;
    const textParts = paras.map((p, k) => { const h = `${k === 0 ? draft : ''}<div class="${cls}${k ? ' tcont' : ''}">${withNums(p.join('<br>'), it.lineNums, ln)}</div>`; ln += p.length; return h; });
    if (after) textParts[textParts.length - 1] += after;
    return [...textParts, ...qs.map(qHTML), ...(srcs ? [srcs] : [])];
  });


  /* ======================= Mathematik ======================= */
  const R0 = RD.R; const orig = { packet: R0.packet, chain: R0.chain, sequence: R0.sequence, tenframe: R0.tenframe, written: R0.written, clock: R0.clock };
  const fmt = v => typeof v === 'number' ? v.toLocaleString('de-DE') : esc(v);
  const tx = (x, y, v, sol, size = 4.2, extra = '') => `<text x="${x.toFixed(2)}" y="${(y + size * .36).toFixed(2)}" text-anchor="middle" font-size="${size}" class="${sol ? 's ' : ''}gt"${extra}>${fmt(v)}</text>`;

  /* Rechenrad */
  T('rechenrad', it => {
    const d = it.data; if (!d || d.error) return err(d);
    const wheel = w => {
      const n = w.ins.length, R1 = 9, R2 = 17, R3 = 25; let s = `<svg viewBox="-27 -27 54 54" width="${+it.size || 52}mm" height="${+it.size || 52}mm" class="rrad"><circle r="${R3}" class="ln"/><circle r="${R2}" class="ln"/><circle r="${R1}" class="ln"/>`;
      for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI - Math.PI / 2; s += `<line x1="${(Math.cos(a) * R1).toFixed(2)}" y1="${(Math.sin(a) * R1).toFixed(2)}" x2="${(Math.cos(a) * R3).toFixed(2)}" y2="${(Math.sin(a) * R3).toFixed(2)}" class="ln"/>`; }
      for (let i = 0; i < n; i++) { const a = ((i + .5) / n) * 2 * Math.PI - Math.PI / 2; const fs = n > 8 ? 3.4 : 4; s += tx(Math.cos(a) * (R1 + R2) / 2, Math.sin(a) * (R1 + R2) / 2, w.ins[i], w.hideIn.includes(i), fs) + tx(Math.cos(a) * (R2 + R3) / 2, Math.sin(a) * (R2 + R3) / 2, w.outs[i], w.hideOut.includes(i), fs); }
      s += tx(0, 0, `${w.op} ${w.c}`, false, 4.6, ' font-weight="700"');
      return s + '</svg>';
    };
    return `<div class="rrads" style="${grid(cols(it.cols, 1, 4), 'max-content')}">${d.wheels.map(wheel).join('')}</div>`;
  });

  /* Magisches Quadrat */
  T('magic', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<div class="mags" style="${grid(cols(it.cols, 1, 4), 'max-content')}">${d.squares.map(q => `<div class="mag"><div class="magg" style="grid-template-columns:repeat(${q.n},11mm)">${q.cells.map((v, i) => `<span>${q.hide.includes(i) ? S(fmt(v)) : fmt(v)}</span>`).join('')}</div>${it.showSum !== false ? `<div class="msum">Zauberzahl: <b>${fmt(q.sum)}</b></div>` : ''}</div>`).join('')}</div>`;
  });

  /* Operator-Quadrat (Rechenquadrat mit Operatoren) */
  T('opsquare', it => {
    const d = it.data; if (!d || d.error) return err(d);
    const P = [[8, 8], [52, 8], [52, 44], [8, 44]];
    const one = q => {
      let s = `<svg viewBox="-6 -2 72 56" width="62mm" height="48mm" class="opsq"><defs><marker id="oa" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 6 3 0 6Z" fill="#555"/></marker></defs>`;
      q.edges.forEach(([a, b], i) => {
        const [x1, y1] = P[a], [x2, y2] = P[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; const sh = a + b === 2 || a + b === 4 && (a === 1 || a === 3) ? 0 : 0;
        const pad = 9.5; s += `<line x1="${(x1 + ux * pad).toFixed(2)}" y1="${(y1 + uy * pad * .62).toFixed(2)}" x2="${(x2 - ux * pad).toFixed(2)}" y2="${(y2 - uy * pad * .62).toFixed(2)}" stroke="#555" stroke-width=".35" marker-end="url(#oa)"/>`;
        const tt = i === 4 ? .32 : i === 5 ? .68 : .5; const mx = x1 + (x2 - x1) * tt, my = y1 + (y2 - y1) * tt + sh;
        s += `<ellipse cx="${mx}" cy="${my}" rx="6.4" ry="3.6" fill="#fff" stroke="#333" stroke-width=".35"/>` + tx(mx, my, q.ops[i], q.hideO.includes(i), 3.6);
      });
      P.forEach(([x, y], i) => { s += `<rect x="${x - 8}" y="${y - 5}" width="16" height="10" fill="#fff" stroke="#222" stroke-width=".4"/>` + tx(x, y, q.v[i], q.hideV.includes(i), 4.2); });
      return s + '</svg>';
    };
    return `<div class="opsqs" style="${grid(cols(it.cols, 1, 3), 'max-content')}">${d.sqs.map(one).join('')}</div>`;
  });

  /* Zerlegungsaufgabe: oben direkt, unten über den Zehner */
  T('zerlegung', it => {
    const d = it.data; if (!d || d.error) return err(d); const H = it.hide || 'alles';
    const one = t => {
      const hid = k => H === 'ergebnis' ? k === 'res' : H === 'zerlegung' ? (k === 'x' || k === 'y') : !['a', 'b'].includes(k);
      const bx = (x, y, v, k) => `<rect x="${x - 7}" y="${y - 4.5}" width="14" height="9" fill="#fff" stroke="#222" stroke-width=".4"/>` + tx(x, y, v, hid(k), 4);
      const el = (x, y, v, k) => `<ellipse cx="${x}" cy="${y}" rx="5.8" ry="3.4" fill="#fff" stroke="#333" stroke-width=".35"/>` + tx(x, y, v, hid(k), 3.4);
      const ar = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#555" stroke-width=".35" marker-end="url(#za)"/>`;
      return `<svg viewBox="0 0 76 34" width="72mm" height="32mm" class="zerl"><defs><marker id="za" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 6 3 0 6Z" fill="#555"/></marker></defs>
        ${ar(16, 6, 58, 6)}${ar(14, 11, 32, 25)}${ar(46, 25, 62, 11)}
        ${bx(8, 6, t.a, 'a')}${bx(68, 6, t.res, 'res')}${bx(39, 28, t.ten, 'ten')}
        ${el(37, 6, t.op + t.b, 'b')}${el(17, 21, t.op + t.x, 'x')}${el(60, 21, t.op + t.y, 'y')}</svg>`;
    };
    return `<div class="zerls" style="${grid(cols(it.cols, 1, 3), 'max-content')}">${d.tasks.map(one).join('')}</div>`;
  });

  /* Rechenpäckchen: Päckchenarten in eigenen Kästen untereinander */
  T('packet', (it, ctx) => {
    const d = it.data; if (!d || d.error || !d.groups) return orig.packet(it, ctx);
    const cell = t => { const part = (k, v) => t.miss === k ? box(v, 'w') : `<span class="nm">${v}</span>`; return `<div class="pk">${part('a', t.a)} <span class="op">${t.op}</span> ${part('b', t.b)} <span class="op">=</span> ${part('c', t.c)}</div>`; };
    let i = 0; const groups = d.groups.map(n => { const g = d.tasks.slice(i, i + n); i += n; return g; });
    return `<div class="pkgs" style="--pc:${cols(it.cols, 1, 5)}">${groups.map(g => `<div class="pkg">${g.map(cell).join('')}</div>`).join('')}</div>`;
  });

  /* Rechenkette / Pfeilbild: Operatoren in Ellipsen, auch beide Richtungen */
  const inv = { '+': '−', '−': '+', '·': ':', ':': '·' };
  T('chain', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d);
    if ((it.look || 'kaesten') === 'kaesten' && !it.both && (it.gaps || 'ergebnisse') === 'ergebnisse') return orig.chain(it, ctx);
    const gaps = it.gaps || 'ergebnisse', showFinal = it.final === 'ziel';
    const one = c => {
      const vals = [c.start, ...c.steps.map(s => s.res)];
      const hideV = i => i > 0 && (gaps === 'ergebnisse' || gaps === 'gemischt' && i % 2 === 1) && !(showFinal && i === vals.length - 1);
      const hideO = i => gaps === 'operatoren' || gaps === 'gemischt' && i % 2 === 1;
      let h = `<span class="cb${it.look === 'kreise' ? ' rnd' : ''}">${vals[0]}</span>`;
      c.steps.forEach((s, i) => {
        h += `<span class="cop"><span class="oe">${hideO(i) ? S(s.op + ' ' + s.n) : esc(s.op + ' ' + s.n)}</span><svg viewBox="0 0 20 6" width="13mm" height="3.6mm"><path d="M1 3h17M15 1l3 2-3 2" fill="none" stroke="#333" stroke-width=".7"/></svg>${it.both ? `<svg viewBox="0 0 20 6" width="13mm" height="3.6mm"><path d="M19 3H2M5 1 2 3l3 2" fill="none" stroke="#333" stroke-width=".7"/></svg><span class="oe">${S(inv[s.op] + ' ' + s.n)}</span>` : ''}</span>`;
        h += `<span class="cb${it.look === 'kreise' ? ' rnd' : ''}">${hideV(i + 1) ? S(vals[i + 1]) : vals[i + 1]}</span>`;
      });
      return `<div class="chn">${h}</div>`;
    };
    return `<div class="chains">${d.chains.map(one).join('')}</div>`;
  });

  /* Zahlenfolge als Zahlenkette mit Kreisen */
  T('sequence', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d);
    if (it.look !== 'kreise') return orig.sequence(it, ctx);
    return `<div class="seqs">${d.rows.map(r => `<div class="seq kette">${r.v.map((v, i) => `<span class="kc">${r.hide.includes(i) ? S(v) : v}</span>`).join('<i class="kl"></i>')}${it.askRule ? `<span class="rule">Regel: <span class="bx wide">${S(r.rule)}</span></span>` : ''}</div>`).join('')}</div>`;
  });

  /* Zehner-, Zwanziger-, Hunderterfeld; „Plusaufgabe“ in zwei Farben */
  T('tenframe', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d);
    if (d.size !== 100 && it.mode !== 'plus' && !it.dcol) return orig.tenframe(it, ctx);
    const draw = it.mode === 'malen', plus = it.mode === 'plus';
    const field = (n, parts) => {
      const rows = d.size / 5 === 2 ? 2 : d.size === 20 ? 4 : 20; let s = '';
      const per = d.size === 100 ? 10 : 5, nrows = d.size === 100 ? 10 : d.size / 5;
      for (let rI = 0; rI < (d.size === 100 ? 10 : d.size / 10); rI++) {
        s += `<div class="hfr${d.size === 100 && rI === 4 ? ' gap' : ''}">`;
        for (let c = 0; c < (d.size === 100 ? 10 : 10); c++) {
          const k = d.size === 100 ? rI * 10 + c : rI * 10 + c; const on = k < n;
          const ab = parts ? (k < parts[0] ? 'a' : 'b') : (it.dcol ? (c < 5 ? 'a' : 'b') : '');
          s += `<span class="hfd${c === 4 ? ' hg5' : ''}">${on ? `<i class="dot ${draw ? 's' : ''} ${ab ? 'd' + ab : ''}"></i>` : ''}</span>`;
        }
        s += '</div>';
      }
      return `<div class="hfield">${s}</div>`;
    };
    return `<div class="tfs" style="${grid(cols(it.cols, 1, 2), 'max-content')}">${d.nums.map((n, i) => {
      const parts = plus && d.parts ? d.parts[i] : null;
      const ans = plus && parts ? `<div class="tfa">${box(parts[0], 'n')} + ${box(parts[1], 'n')} = ${box(n, 'n')}</div>` : draw ? '' : `<div class="tfa">${box(n, 'n')}</div>`;
      return `<div class="tfi col">${draw ? `<div class="tfn">${n}</div>` : ''}${field(n, parts)}${ans}</div>`;
    }).join('')}</div>`;
  });

  /* Schriftlich rechnen: Stellenwert-Kopf (H Z E) und Karofeld ein/aus */
  const PV = ['E', 'Z', 'H', 'T', 'ZT', 'HT', 'M', 'ZM'];
  /* Schriftlich rechnen: jede Aufgabe als festes Kästchenraster – alle Zeilen gleich breit, Ziffern stellengerecht,
     Strich genau über den Ergebnis-Kästchen. Multiplikation deutsch: a · b in einer Zeile, Teilprodukte enden unter
     der jeweiligen Ziffer des zweiten Faktors, darunter Übertrag, Strich und Summe. */
  function writtenGrid(t, opts) {
    const rows = []; const cell = (ch, sol, extra) => ({ ch: ch == null ? '' : String(ch), sol: !!sol, ...(extra || {}) });
    const put = (row, endCol, str, sol) => { const s = String(str); for (let i = 0; i < s.length; i++) { const c = endCol - (s.length - 1 - i); if (c >= 0) row[c] = cell(s[i], sol); } };
    let W;
    if (t.op === '·') {
      const as = String(t.ns[0]), bs = String(t.ns[1]), la = as.length, lb = bs.length;
      const parts = t.parts && t.parts.length ? t.parts : [{ v: t.res, end: lb - 1 }];
      const multi = parts.length > 1 || (t.parts && parts[0].end !== lb - 1);
      let o = 0;
      parts.forEach(p => { o = Math.max(o, String(p.v).length - (la + 1 + p.end + 1)); });
      if (multi) o = Math.max(o, String(t.res).length - (la + 1 + lb));
      W = o + la + 1 + lb;
      const top = Array.from({ length: W }, () => cell('')); [...as].forEach((ch, i) => { top[o + i] = cell(ch); }); top[o + la] = cell('·'); [...bs].forEach((ch, i) => { top[o + la + 1 + i] = cell(ch); });
      rows.push({ cells: top, cls: 'wtop' });
      const mark = (row, from) => { row.lineFrom = from; };
      if (!multi) {
        const res = Array.from({ length: W }, () => cell('')); put(res, W - 1, t.res, true); const r = { cells: res, cls: 'wres' }; mark(r, Math.min(o, W - String(t.res).length)); rows.push(r);
        rows.push({ cells: Array.from({ length: W }, () => cell('')), cls: 'wcarry' });
      } else {
        const firstPart = { cells: Array.from({ length: W }, () => cell('')), cls: 'wpart' };
        parts.forEach((p, k) => { const row = k === 0 ? firstPart : { cells: Array.from({ length: W }, () => cell('')), cls: 'wpart' }; put(row.cells, o + la + 1 + p.end, p.v, true); if (k === 0) mark(row, Math.min(o, W - String(t.res).length)); rows.push(row); });
        rows.push({ cells: Array.from({ length: W }, () => cell('')), cls: 'wcarry' });
        const res = Array.from({ length: W }, () => cell('')); put(res, W - 1, t.res, true); const r = { cells: res, cls: 'wres' }; mark(r, Math.min(o, W - String(t.res).length)); rows.push(r);
      }
    } else {
      W = Math.max(String(t.res).length, ...t.ns.map(n => String(n).length)) + 1;
      t.ns.forEach((n, i) => { const row = Array.from({ length: W }, () => cell('')); put(row, W - 1, n, false); if (i === t.ns.length - 1) row[0] = cell(t.op); rows.push({ cells: row, cls: 'wnum' }); });
      rows.push({ cells: Array.from({ length: W }, () => cell('')), cls: 'wcarry' });
      const res = Array.from({ length: W }, () => cell('')); put(res, W - 1, t.res, true); rows.push({ cells: res, cls: 'wres', lineFrom: 0 });
    }
    if (opts.pv && t.op !== '·') { const pv = Array.from({ length: W }, (_, c) => cell(c === 0 ? '' : PV[W - 1 - c] || '', false)); rows.unshift({ cells: pv, cls: 'wpvh' }); }
    return { W, rows };
  }
  T('written', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d);
    const st = `${it.lineColor ? `--wline:${hex(it.lineColor)};` : ''}grid-template-columns:repeat(${Math.max(1, Math.min(4, +it.cols || 3))},max-content)`;
    return `<div class="wrs wg${it.karo === false ? ' nokaro' : ''}" style="${st}">${d.tasks.map(t => {
      const g = writtenGrid(t, { pv: it.pv });
      return `<div class="wr1 wgrid" style="grid-template-columns:repeat(${g.W},7mm)">${g.rows.map(r => r.cells.map((c, i) => `<span class="c ${r.cls}${r.lineFrom != null && i >= r.lineFrom ? ' lnt' : ''}${c.ch === '·' || /^[+−-]$/.test(c.ch) ? ' wop' : ''}">${c.sol ? (c.ch ? S(c.ch) : '') : esc(c.ch)}</span>`).join('')).join('')}</div>`;
    }).join('')}</div>`;
  });

  /* Uhr: Zeiger farbig, Zeitspannen mit zwei Uhren */
  T('clock', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d);
    if (!d.pairs && !it.handCol) return orig.clock(it, ctx);
    const draw = it.mode === 'einzeichnen';
    const face = (h, m, solHands) => {
      let s = `<svg viewBox="-22 -22 44 44" width="${d.pairs ? 22 : 36}mm" height="${d.pairs ? 22 : 36}mm"><circle r="20" fill="#fff" stroke="#222" stroke-width=".7"/>`;
      for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0, r1 = big ? 17 : 18.6; s += `<line x1="${(Math.sin(a) * r1).toFixed(2)}" y1="${(-Math.cos(a) * r1).toFixed(2)}" x2="${(Math.sin(a) * 19.5).toFixed(2)}" y2="${(-Math.cos(a) * 19.5).toFixed(2)}" stroke="#222" stroke-width="${big ? .7 : .25}"/>`; }
      for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += `<text x="${(Math.sin(a) * 13.6).toFixed(2)}" y="${(-Math.cos(a) * 13.6 + 1.6).toFixed(2)}" text-anchor="middle" class="ck">${i}</text>`; }
      const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30; const hc = it.handCol ? '#c8102e' : '#222', mc = it.handCol ? '#1d5fbf' : '#222';
      const hands = `<line x1="0" y1="0" x2="${(Math.sin(ha) * 9).toFixed(2)}" y2="${(-Math.cos(ha) * 9).toFixed(2)}" stroke-width="1.6" stroke-linecap="round" stroke="${hc}"/><line x1="0" y1="0" x2="${(Math.sin(ma) * 15).toFixed(2)}" y2="${(-Math.cos(ma) * 15).toFixed(2)}" stroke-width="1" stroke-linecap="round" stroke="${mc}"/>`;
      s += solHands ? `<g class="s sh">${hands}</g>` : `<g>${hands}</g>`;
      return s + '<circle r="1.1" fill="#222"/></svg>';
    };
    const tt = t => `${t.h}:${String(t.m).padStart(2, '0')} Uhr`;
    const dur = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`;
    if (d.pairs) {
      return `<div class="cspans" style="grid-template-columns:repeat(${d.pairs.length > 1 ? 2 : 1},max-content)">${d.pairs.map(p => `<div class="cspan"><div class="clk">${face(p.a.h, p.a.m)}<div class="ctime">${esc(tt(p.a))}</div></div><div class="carr"><svg viewBox="0 0 30 8" width="14mm" height="4mm"><path d="M1 4h26M24 1l3 3-3 3" fill="none" stroke="#333" stroke-width=".7"/></svg><span class="bx wide">${S(dur(p.d))}</span></div><div class="clk">${face(p.b.h, p.b.m)}<div class="ctime">${esc(tt(p.b))}</div></div></div>`).join('')}</div>`;
    }
    return `<div class="clocks" style="grid-template-columns:repeat(${Math.max(2, Math.min(4, +it.cols || 3))},minmax(0,1fr))">${d.times.map(t => `<div class="clk">${face(t.h, t.m, draw)}<div class="ctime">${draw ? esc(tt(t)) : `<span class="bx wide">${S(tt(t))}</span>`}</div></div>`).join('')}</div>${it.handCol ? '<div class="shint">Kurzer Zeiger (Stunden) rot, langer Zeiger (Minuten) blau.</div>' : ''}`;
  });

  /* Hundertertafel-Ausschnitte */
  { const base = RD.R.hundred; T('hundred', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d);
    if (!d.pieces) return base(it, ctx);
    return `<div class="hpcs" style="${grid(cols(it.cols || 4, 1, 6), 'max-content')}">${d.pieces.map(p => `<div class="hpc" style="grid-template-columns:repeat(${p.w},9.5mm);grid-template-rows:repeat(${p.h},8.4mm)">${p.cells.map(c => `<span style="grid-row:${c.dr + 1};grid-column:${c.dc + 1}">${c.show ? c.v : S(c.v)}</span>`).join('')}</div>`).join('')}</div>`;
  }); }

  /* Kästchenrechnung: frei beschriftbares Karofeld; [Lösung] in eckigen Klammern, Zeile aus --- = Strich */
  /* Schriftliche Division im Karofeld */
  T('wdiv', it => {
    const d = it.data; if (!d || d.error) return err(d);
    const k = Math.max(4, Math.min(9, +it.cell || 6));
    const w = Math.max(...d.tasks.map(t => Math.max(...t.rows.map(r => r.length)))) + 1;
    const one = t => { const rows = [...t.rows, []]; return `<div class="kae wdv" style="--k:${k}mm;grid-template-columns:repeat(${w},var(--k))">${rows.map(r => Array.from({ length: w }, (_, i) => { const c = r[i]; const v = c && c.ch ? (c.sol ? S(c.ch) : esc(c.ch)) : ''; return `<span class="${c && c.line ? 'lt sl' : ''}">${v}</span>`; }).join('')).join('')}</div>`; };
    return `<div class="wdvs" style="${grid(cols(it.cols, 1, 3), 'max-content')}">${d.tasks.map(one).join('')}</div>`;
  });

  T('kaestchen', (it, ctx) => {
    const raw = String(it.text || '').replace(/\r/g, '').split('\n');
    const rows = []; let lineBefore = false;
    raw.forEach(l => { if (/[-–_=]{2,}/.test(l) && /^[\s\-–_=]+$/.test(l)) { lineBefore = new Set([...l].map((c, i) => c.trim() ? i : -1).filter(i => i >= 0)); return; } const cells = []; let sol = false; for (const ch of l) { if (ch === '[') { sol = true; continue; } if (ch === ']') { sol = false; continue; } cells.push({ ch, sol }); } rows.push({ cells, line: lineBefore }); lineBefore = false; });
    while (rows.length < (+it.rowsMin || 0)) rows.push({ cells: [], line: false });
    const k = Math.max(4, Math.min(12, +it.cell || 5));
    /* Mindestbreite höchstens so viele Kästchen, wie auf die Zeile passen (der eingegebene Inhalt bleibt immer vollständig) */
    const fit = ctx && ctx.dim ? Math.max(1, Math.floor(ctx.dim.iw / k)) : 99;
    const w = Math.max(Math.min(+it.colsMin || 0, fit), ...rows.map(r => r.cells.length), 1) + Math.max(0, Math.min(+it.extra || 0, fit - Math.max(...rows.map(r => r.cells.length), 1)));
    return `<div class="kae${it.karo === false ? ' nokaro' : ''}" style="--k:${k}mm;grid-template-columns:repeat(${w},var(--k))">${rows.map(r => Array.from({ length: w }, (_, i) => { const c = r.cells[i]; const v = c && c.ch.trim() ? (c.sol ? S(c.ch) : esc(c.ch)) : ''; return `<span class="${r.line && (r.line === true || r.line.has(i)) ? 'lt' : ''}">${v}</span>`; }).join('')).join('')}</div>`;
  });

  root.FolivaRender3 = { frameStyle, textBody };
})(typeof window !== 'undefined' ? window : globalThis);
