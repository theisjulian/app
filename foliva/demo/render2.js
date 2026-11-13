/* Foliva – Darstellung der weiteren Bausteine (ab 0.3) · © 2026 theis */
(function (root) {
  'use strict';
  const RD = root.FolivaRender || (typeof require !== 'undefined' ? require('./render.js') : null);
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen2.js') : null);
  const { esc, md, S, box, err, register, imgSrc } = RD;
  const cols = (n, lo = 1, hi = 6) => Math.max(lo, Math.min(hi, +n || lo));
  const grid = (n, w = 'minmax(0,1fr)') => `grid-template-columns:repeat(${n},${w})`;
  const libImg = (f, cls = '') => f ? `<img class="${cls}" src="${esc(imgSrc(String(f).startsWith('lib:') ? f : 'lib:' + f))}" alt="">` : '';
  const T = (type, fn, task = true, extra = {}) => register(type, fn, { task, ...extra });

  /* ---------- Mathematik Grundschule ---------- */
  T('tenframe', it => {
    const d = it.data; if (!d || d.error) return err(d); const draw = it.mode === 'malen';
    const frame = n => { let s = ''; for (let f = 0; f < d.size / 10; f++) { s += '<div class="tf">'; for (let i = 0; i < 10; i++) { const k = f * 10 + i, on = k < n; s += `<span>${on ? (draw ? '<i class="dot s"></i>' : '<i class="dot"></i>') : ''}</span>`; } s += '</div>'; } return s; };
    return `<div class="tfs" style="${grid(cols(it.cols, 1, 4))}">${d.nums.map(n => `<div class="tfi">${draw ? `<div class="tfn">${n}</div>` : ''}<div class="tfw">${frame(n)}</div>${draw ? '' : `<div class="tfa">${box(n, 'n')}</div>`}</div>`).join('')}</div>`;
  });
  T('triangle', it => {
    const d = it.data; if (!d || d.error) return err(d);
    /* Innenfelder in den Ecken, Außenfelder neben den Seiten: links = oben + unten links, unten = unten links + unten rechts, rechts = unten rechts + oben */
    const one = t => { const inn = t.mode === 'innen', V = (v, show) => show ? `<tspan>${v}</tspan>` : `<tspan class="s">${v}</tspan>`;
      const circ = (x, y, v) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#555" stroke-width=".35"/><text x="${x}" y="${y + 1.5}" class="trn">${V(v, inn)}</text>`;
      const box = (x, y, v) => `<rect x="${x - 7}" y="${y - 4.5}" width="14" height="9" rx="1.2" fill="#fff" stroke="#555" stroke-width=".35"/><text x="${x}" y="${y + 1.5}" class="trn">${V(v, !inn)}</text>`;
      return `<svg class="tri" viewBox="0 0 84 68" width="60mm" height="48.6mm"><path d="M42 3 74 58 10 58Z" fill="none" stroke="#333" stroke-width=".55" stroke-linejoin="round"/><path d="M42 26 30 47M42 26 54 47M30 47h24" fill="none" stroke="#9aa3ad" stroke-width=".3"/>
        ${circ(42, 19, t.inner[0])}${circ(24, 50, t.inner[1])}${circ(60, 50, t.inner[2])}${box(15, 27, t.outer[0])}${box(42, 63.5, t.outer[1])}${box(69, 27, t.outer[2])}</svg>`; };
    return `<div class="flexw">${d.tris.map(one).join('')}</div>`;
  });
  T('calctable', it => {
    const d = it.data; if (!d || d.error) return err(d); const hide = new Set(d.hide);
    return `<table class="tbl ctab"><tr><th class="op">${d.op}</th>${d.ch.map(c => `<th>${c}</th>`).join('')}</tr>${d.rh.map((a, i) => `<tr><th>${a}</th>${d.cells[i].map((v, j) => `<td>${hide.has(i + ':' + j) ? S(v) : v}</td>`).join('')}</tr>`).join('')}</table>`;
  });
  T('chain', it => {
    const d = it.data; if (!d || d.error) return err(d); const showFinal = it.final === 'ziel';
    return `<div class="chains">${d.chains.map(c => `<div class="chn"><span class="cb">${c.start}</span>${c.steps.map((s, i) => `<span class="ca"><small>${s.op} ${s.n}</small><svg viewBox="0 0 20 6" width="13mm" height="4mm"><path d="M1 3h17M15 1l3 2-3 2" fill="none" stroke="#333" stroke-width=".7"/></svg></span><span class="cb">${showFinal && i === c.steps.length - 1 ? s.res : S(s.res)}</span>`).join('')}</div>`).join('')}</div>`;
  });
  T('placevalue', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<table class="tbl pvt"><tr>${d.cols.map(c => `<th>${c}</th>`).join('')}<th class="pvn">Zahl</th></tr>${d.rows.map(r => `<tr>${r.d.map(x => `<td>${r.mode === 'ablesen' ? x : S(x)}</td>`).join('')}<td class="pvn">${r.mode === 'ablesen' ? S(r.n.toLocaleString('de-DE')) : r.n.toLocaleString('de-DE')}</td></tr>`).join('')}</table>`;
  });
  T('halbschriftlich', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<div class="hsr" style="${grid(cols(it.cols, 1, 3))}">${d.tasks.map(t => `<div class="hs"><div class="hsq">${esc(t.q)} = ${box(t.res)}</div><div class="lns" style="--sp:8mm">${t.steps.map(s => `<div class="ln">${S(s)}</div>`).join('')}</div></div>`).join('')}</div>`;
  });
  /* Geld: eigene, schlichte Darstellung (keine Nachbildung echter Münz- oder Scheinmotive) */
  const coin = v => { const big = v >= 100, d = v >= 200 ? 9.5 : v >= 100 ? 8.8 : v >= 50 ? 8.2 : v >= 10 ? 7.2 : 6.4; const col = v >= 100 ? '#d8c27a' : v >= 10 ? '#e5c86a' : '#c98a52'; return `<svg class="coin" viewBox="0 0 20 20" width="${d}mm" height="${d}mm"><circle cx="10" cy="10" r="9.3" fill="${col}" stroke="#7a6a3a" stroke-width=".7"/>${big ? '<circle cx="10" cy="10" r="6.4" fill="#ece6d6" stroke="#9a8a5a" stroke-width=".5"/>' : ''}<text x="10" y="${big ? 12.4 : 12.6}" text-anchor="middle" font-size="${v >= 100 ? 7 : 7.5}" font-weight="700" fill="#3a2f10">${v >= 100 ? v / 100 : v}</text><text x="10" y="17" text-anchor="middle" font-size="3" fill="#3a2f10">${v >= 100 ? 'EURO' : 'CENT'}</text></svg>`; };
  const note = v => { const col = { 500: '#9fb3a5', 1000: '#e2a39b', 2000: '#9fbad9', 5000: '#e6c08a', 10000: '#a9c99a', 20000: '#e3cf8f' }[v] || '#ccc'; return `<svg class="bnote" viewBox="0 0 40 21" width="24mm" height="12.6mm"><rect x=".4" y=".4" width="39.2" height="20.2" rx="1.4" fill="${col}" stroke="#555" stroke-width=".5"/><rect x="3" y="3" width="13" height="15" rx="1" fill="none" stroke="#fff" stroke-width=".7" opacity=".8"/><text x="28" y="13.6" text-anchor="middle" font-size="9" font-weight="700" fill="#222">${v / 100}</text><text x="28" y="18.4" text-anchor="middle" font-size="3.2" fill="#222">EURO</text></svg>`; };
  const money = v => v >= 500 ? note(v) : coin(v);
  RD.moneySvg = money;
  T('money', it => {
    const d = it.data; if (!d || d.error) return err(d); const lay = it.mode === 'legen';
    return `<div class="mny">${d.tasks.map(t => `<div class="mnr">${lay ? `<div class="mnq">${esc(G.euro(t.total))}</div><div class="mnf">${`<div class="s mnl">${t.items.map(money).join('')}</div>`}</div>` : `<div class="mnl">${t.items.map(money).join('')}</div><div class="mna">= ${box(G.euro(t.total))}</div>`}</div>`).join('')}</div>`;
  });
  T('units', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<div class="pks" style="${grid(cols(it.cols, 1, 4))}">${d.tasks.map(t => `<div class="pk">${esc(t.q)}${box(t.a)} ${esc(t.u)}</div>`).join('')}</div>`;
  });
  const dotGrid = (n, sz, inner) => { const s = sz / (n - 1); let h = `<svg viewBox="-2 -2 ${sz + 4} ${sz + 4}" width="${sz + 4}mm" height="${sz + 4}mm">`; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) h += `<circle cx="${x * s}" cy="${y * s}" r=".7" fill="#555"/>`; return h + inner(s) + '</svg>'; };
  const poly = (pts, s, cls = '', col = '#1D4ED8') => `<path class="${cls}" d="M${pts.map(([x, y]) => `${x * s} ${y * s}`).join(' L')}Z" fill="${cls ? 'none' : col + '22'}" stroke="${cls ? '' : col}" stroke-width=".7" stroke-linejoin="round"/>`;
  T('geoboard', it => {
    const d = it.data; if (!d || d.error) return err(d); const sz = (d.n - 1) * 8;
    return `<div class="geos">${d.figs.map(f => d.mode === 'spiegeln'
      ? `<div class="geo">${dotGrid(d.n, sz, s => `<line x1="${(d.n - 1) / 2 * s}" y1="-2" x2="${(d.n - 1) / 2 * s}" y2="${sz + 2}" stroke="#C8102E" stroke-width=".5" stroke-dasharray="1.5 1"/>${poly(f.pts, s)}<g class="sh">${poly(f.mirror, s, 's')}</g>`)}</div>`
      : `<div class="geo">${dotGrid(d.n, sz, s => poly(f.pts, s))}</div><div class="geo">${dotGrid(d.n, sz, s => `<g class="sh">${poly(f.pts, s, 's')}</g>`)}</div>`).join('')}</div>`;
  });
  T('pattern', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d); const k = 5, W = d.w * d.reps + d.reps - 1 + 2, H = d.h + 2;
    return `<div class="pats">${d.rows.map(row => { let s = ''; for (let rep = 0; rep < d.reps; rep++) row.cells.forEach(([x, y]) => { const X = 1 + rep * (d.w + 1) + x, Y = 1 + y; s += `<rect x="${X * k}" y="${Y * k}" width="${k}" height="${k}" class="${rep < d.shown ? 'pf1' : 'pf2 s'}"/>`; }); return `<svg class="pat" viewBox="0 0 ${W * k} ${H * k}" width="${Math.min(ctx.dim.iw, W * k)}mm" height="${H * k * Math.min(1, ctx.dim.iw / (W * k))}mm" preserveAspectRatio="xMinYMin meet"><defs><pattern id="kg" width="${k}" height="${k}" patternUnits="userSpaceOnUse"><path d="M${k} 0H0V${k}" fill="none" stroke="#b9c3cf" stroke-width=".2"/></pattern></defs><rect width="100%" height="100%" fill="url(#kg)"/>${s}</svg>`; }).join('')}</div>`;
  });
  T('countpics', it => {
    const d = it.data; if (!d || d.error) return err(d); const P = root.FolivaPools || {};
    return `<div class="cps" style="${grid(cols(it.cols, 1, 3))}">${d.tasks.map(t => { const f = (P.PICS || {})[t.w]; const imgs = Array.from({ length: t.n }, (_, i) => `${libImg(f, 'cpi')}${it.group && (i + 1) % 5 === 0 && i + 1 < t.n ? '<i class="cpg"></i>' : ''}`).join(''); return `<div class="cp"><div class="cpl">${imgs || '<span class="shint">(keins)</span>'}</div><div class="cpa">${box(t.n, 'n')}</div></div>`; }).join('')}</div>`;
  });

  /* ---------- Mathematik Sekundarstufe ---------- */
  const frac = (n, d, sol) => { const N = sol ? S(n) : esc(n), D = sol ? S(d) : esc(d); return `<span class="fr"><span>${N}</span><span>${D}</span></span>`; };
  const fracOut = (a, sol) => a[1] === 1 ? (sol ? S(a[0]) : a[0]) : frac(a[0], a[1], sol);
  T('fractions', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<div class="pks frs" style="${grid(cols(it.cols, 1, 4))}">${d.tasks.map(t => {
      if (t.kind === 'kuerzen') return `<div class="pk">${frac(t.a[0], t.a[1])} = <span class="frbox">${fracOut(t.r, true)}</span></div>`;
      if (t.kind === 'erweitern') return `<div class="pk">${frac(t.a[0], t.a[1])} <small>mit ${t.k} erweitern</small> = <span class="frbox">${frac(t.r[0], t.r[1], true)}</span></div>`;
      return `<div class="pk">${frac(t.a[0], t.a[1])} <span class="op">${t.kind}</span> ${frac(t.b[0], t.b[1])} = <span class="frbox">${fracOut(t.r, true)}</span></div>`;
    }).join('')}</div>`;
  });
  T('fracpict', it => {
    const d = it.data; if (!d || d.error) return err(d); const shade = it.mode === 'faerben';
    const pic = t => {
      if (t.shape === 'rechteck') { const w = 36, h = 18; let s = `<svg viewBox="-.5 -.5 ${w + 1} ${h + 1}" width="${w + 1}mm" height="${h + 1}mm">`; const c = t.d <= 6 ? t.d : t.d % 2 === 0 ? t.d / 2 : t.d, rws = t.d / c; for (let i = 0; i < t.d; i++) { const x = (i % c) * w / c, y = Math.floor(i / c) * h / rws; s += `<rect x="${x}" y="${y}" width="${w / c}" height="${h / rws}" class="${i < t.n ? (shade ? 'fpS s' : 'fpS') : ''}" fill="${i < t.n && !shade ? '#9ab4d6' : '#fff'}" stroke="#333" stroke-width=".35"/>`; } return s + '</svg>'; }
      const R = 13; let s = `<svg viewBox="-14 -14 28 28" width="28mm" height="28mm">`;
      for (let i = 0; i < t.d; i++) { const a0 = i / t.d * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / t.d * 2 * Math.PI - Math.PI / 2; const large = 1 / t.d > .5 ? 1 : 0; s += `<path d="M0 0 L${(R * Math.cos(a0)).toFixed(2)} ${(R * Math.sin(a0)).toFixed(2)} A${R} ${R} 0 ${large} 1 ${(R * Math.cos(a1)).toFixed(2)} ${(R * Math.sin(a1)).toFixed(2)}Z" class="${i < t.n && shade ? 'fpS s' : ''}" fill="${i < t.n && !shade ? '#9ab4d6' : '#fff'}" stroke="#333" stroke-width=".35"/>`; }
      return s + '</svg>';
    };
    return `<div class="fps" style="${grid(cols(it.cols, 2, 6))}">${d.tasks.map(t => `<div class="fp">${pic(t)}<div>${shade ? frac(t.n, t.d) : `<span class="frbox">${frac(t.n, t.d, true)}</span>`}</div></div>`).join('')}</div>`;
  });
  const qa = (it, list, opts = {}) => `<div class="pks" style="${grid(cols(it.cols, 1, 4))}">${list.map(t => `<div class="pk">${esc(t.q)}${opts.eq === false ? ' ' : ' = '}${box(t.a, opts.wide ? 'wide' : '')}${t.u ? ' ' + esc(t.u) : ''}</div>`).join('')}</div>`;
  T('equation', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<div class="eqs" style="${grid(cols(it.cols, 1, 3))}">${d.tasks.map(t => `<div class="eq"><div class="eqq">${esc(t.q)}</div>${+it.workLines ? `<div class="lns" style="--sp:8mm">${Array.from({ length: +it.workLines }, () => '<div class="ln"></div>').join('')}</div>` : ''}<div class="eqa">x = ${box(G.de(t.x))}</div></div>`).join('')}</div>`;
  });
  T('percent', it => { const d = it.data; if (!d || d.error) return err(d); return qa(it, d.tasks, { eq: false }); });
  T('sekpacket', it => { const d = it.data; if (!d || d.error) return err(d); return qa(it, d.tasks, { wide: it.kind === 'terme' }); });
  T('coord', (it, ctx) => {
    const d = it.data; if (!d || d.error) return err(d); const n = d.n, lo = d.quad === 4 ? -n : 0, span = n - lo; const u = Math.min(+it.unit || 6, (ctx.dim.iw * .62) / (span + 1)); const W = (span + 1.6) * u;
    const X = x => (x - lo + .8) * u, Y = y => (n - y + .8) * u;
    let s = `<svg class="crd" viewBox="0 0 ${W} ${W}" width="${W}mm" height="${W}mm">`;
    for (let i = lo; i <= n; i++) { s += `<line x1="${X(i)}" y1="${Y(lo)}" x2="${X(i)}" y2="${Y(n)}" stroke="#c5ccd5" stroke-width=".18"/><line x1="${X(lo)}" y1="${Y(i)}" x2="${X(n)}" y2="${Y(i)}" stroke="#c5ccd5" stroke-width=".18"/>`; }
    s += `<line x1="${X(lo)}" y1="${Y(0)}" x2="${X(n) + u * .6}" y2="${Y(0)}" stroke="#222" stroke-width=".35"/><line x1="${X(0)}" y1="${Y(lo)}" x2="${X(0)}" y2="${Y(n) - u * .6}" stroke="#222" stroke-width=".35"/>`;
    s += `<text x="${X(n) + u * .5}" y="${Y(0) + u * .9}" class="crt">x</text><text x="${X(0) - u * .7}" y="${Y(n) - u * .3}" class="crt">y</text>`;
    for (let i = lo; i <= n; i++) if (i) s += `<text x="${X(i)}" y="${Y(0) + u * .75}" text-anchor="middle" class="crt">${i < 0 ? '−' + -i : i}</text><text x="${X(0) - u * .25}" y="${Y(i) + u * .2}" text-anchor="end" class="crt">${i < 0 ? '−' + -i : i}</text>`;
    const show = d.mode === 'ablesen' || d.mode === 'figur';
    if (d.mode === 'figur') s += `<path d="M${d.pts.map(p => `${X(p.x)} ${Y(p.y)}`).join(' L')}Z" fill="none" stroke="var(--solc)" stroke-width=".4" class="s"/>`;
    d.pts.forEach(p => { s += `<g class="${d.mode === 'eintragen' ? 's' : ''}"><path d="M${X(p.x) - 1} ${Y(p.y) - 1}l2 2M${X(p.x) + 1} ${Y(p.y) - 1}l-2 2" stroke="${d.mode === 'eintragen' ? 'var(--solc)' : '#111'}" stroke-width=".45"/><text x="${X(p.x) + 1.4}" y="${Y(p.y) - 1.2}" class="crl" ${d.mode === 'eintragen' ? 'style="fill:var(--solc)"' : ''}>${p.l}</text></g>`; });
    s += '</svg>';
    const list = `<div class="crlist">${d.pts.map(p => `<div>${p.l} ( ${show && d.mode !== 'figur' ? box(p.x, 'n') : p.x} | ${show && d.mode !== 'figur' ? box(p.y, 'n') : p.y} )</div>`).join('')}</div>`;
    return `<div class="crw">${s}${d.mode === 'leer' ? '' : list}</div>`;
  });
  T('angles', it => {
    const d = it.data; if (!d || d.error) return err(d); const draw = d.mode === 'zeichnen';
    const one = t => { const L = 16, a0 = t.rot * Math.PI / 180, a1 = (t.rot + t.deg) * Math.PI / 180; const P = a => [(L * Math.cos(a)).toFixed(2), (-L * Math.sin(a)).toFixed(2)]; const r = 5, [x0, y0] = [(r * Math.cos(a0)).toFixed(2), (-r * Math.sin(a0)).toFixed(2)], [x1, y1] = [(r * Math.cos(a1)).toFixed(2), (-r * Math.sin(a1)).toFixed(2)];
      const rays = `<line x1="0" y1="0" x2="${P(a0)[0]}" y2="${P(a0)[1]}" stroke-width=".5"/>`, ray2 = `<line x1="0" y1="0" x2="${P(a1)[0]}" y2="${P(a1)[1]}" stroke-width=".5"/>`, arc = `<path d="M${x0} ${y0} A${r} ${r} 0 ${t.deg > 180 ? 1 : 0} 0 ${x1} ${y1}" fill="none" stroke-width=".35"/>`;
      return `<div class="ang"><svg viewBox="-18 -18 36 36" width="34mm" height="34mm"><g stroke="#222">${rays}${draw ? '' : ray2 + arc}</g>${draw ? `<g class="sh s" stroke="var(--solc)">${ray2}${arc}</g>` : ''}<circle r=".7" fill="#222"/></svg><div class="angq">${draw ? `${t.deg}° zeichnen` : `α = ${box(t.deg + '°')}`}${it.askKind ? `<br><span class="bx wide">${S(t.kind)}</span>` : ''}</div></div>`; };
    return `<div class="angs" style="${grid(cols(it.cols, 2, 4))}">${d.tasks.map(one).join('')}</div>`;
  });
  T('area', it => {
    const d = it.data; if (!d || d.error) return err(d); const k = 5;
    return `<div class="areas">${d.figs.map((f, i) => { const w = Math.max(...f.cells.map(c => c[0])) + 3, h = Math.max(...f.cells.map(c => c[1])) + 3; return `<div class="arf"><svg viewBox="0 0 ${w * k} ${h * k}" width="${w * k}mm" height="${h * k}mm"><defs><pattern id="ka${i}" width="${k}" height="${k}" patternUnits="userSpaceOnUse"><path d="M${k} 0H0V${k}" fill="none" stroke="#b9c3cf" stroke-width=".2"/></pattern></defs><rect width="100%" height="100%" fill="url(#ka${i})"/>${f.cells.map(([x, y]) => `<rect x="${(x + 1) * k}" y="${(y + 1) * k}" width="${k}" height="${k}" fill="#cfe0f3" stroke="#3a5a8a" stroke-width=".3"/>`).join('')}</svg><div>${it.ask !== 'umfang' ? `A = ${box(f.area, 'n')} ${esc(it.unitA || 'Kästchen')}` : ''}${it.ask === 'beides' ? '<br>' : ''}${it.ask !== 'flaeche' ? `u = ${box(f.per, 'n')} ${esc(it.unitU || 'Kästchenseiten')}` : ''}</div></div>`; }).join('')}</div>`;
  });

  /* ---------- Deutsch ---------- */
  T('pictureword', it => {
    const d = it.data; if (!d || d.error) return err(d);
    const one = x => {
      const pic = x.f ? libImg(x.f, 'pwi') : `<div class="pwx">${esc(x.w)}</div>`;
      let a = '';
      if (d.mode === 'anlaut') a = `<span class="bx n">${S(x.w[0])}</span>`;
      else if (d.mode === 'wort') a = `<div class="pwl">${S((it.article && x.a ? x.a + ' ' : '') + x.w)}</div>`;
      else if (d.mode === 'luecke') a = `<div class="pwg">${[...x.w].map((c, i) => x.hide.includes(i) ? `<span class="gc">${S(c)}</span>` : `<span>${esc(c)}</span>`).join('')}</div>`;
      else if (d.mode === 'silben') { const n = (x.s || x.w).split('-').length; a = `<div class="pws">${Array.from({ length: n }, () => '<i></i>').join('')}<span class="s">${esc((x.s || x.w).replace(/-/g, ' · '))}</span></div>`; }
      else if (d.mode === 'artikel') a = `<div class="pwl"><span class="bx">${S(x.a)}</span> ${esc(x.w)}</div>`;
      return `<div class="pw">${pic}${a}</div>`;
    };
    return `<div class="pws1" style="${grid(cols(it.cols, 2, 6))}">${d.items.map(one).join('')}</div>`;
  });
  T('crossword', it => {
    const d = it.data; if (!d || d.error) return err(d); const k = Math.min(+it.cell || 8, 9);
    const numAt = new Map(d.nums.map(n => [n.x + ':' + n.y, n.n]));
    let g = `<div class="cw" style="width:${d.w * k}mm;height:${d.h * k}mm">`;
    d.grid.forEach(c => { const n = numAt.get(c.x + ':' + c.y); g += `<span style="left:${c.x * k}mm;top:${c.y * k}mm;width:${k}mm;height:${k}mm">${n ? `<small>${n}</small>` : ''}${S(c.ch)}</span>`; });
    g += '</div>';
    const clue = p => /^img:/.test(p.clue) ? `<span class="cwc"><b>${p.num}</b>${libImg(p.clue.slice(4), 'cwi')}</span>` : `<span class="cwc"><b>${p.num}</b> ${esc(p.clue || '')}</span>`;
    const h = d.placed.filter(p => p.dir === 'h'), v = d.placed.filter(p => p.dir === 'v');
    return `<div class="cwx">${g}<div class="cwl"><div><b>Waagrecht →</b>${h.map(clue).join('')}</div><div><b>Senkrecht ↓</b>${v.map(clue).join('')}</div></div></div>`;
  });
  T('wordtypes', it => {
    const d = it.data || G.wordtypes(it); const C = { N: 'Nomen', V: 'Verb', A: 'Adjektiv' };
    const line = l => l.replace(/\[([NVA]):([^\]]+)\]|([^\s\[]+)/g, (m, t, w, plain) => t ? `<span class="wt"><span>${esc(w)}</span><span class="wtb ${t}">${S(C[t])}</span></span>` : `<span class="wt"><span>${esc(plain)}</span><span class="wtb"></span></span>`);
    return `<div class="wts">${d.lines.map(l => `<div class="wtl">${line(l)}</div>`).join('')}</div>${it.legend !== false ? `<div class="shint wtleg">${it.colors ? 'Nomen blau · Verben rot · Adjektive grün' : 'Schreibe unter jedes Wort: Nomen, Verb oder Adjektiv. Andere Wörter bleiben frei.'}</div>` : ''}`;
  });
  T('secret', it => {
    const d = it.data; if (!d || d.error) return err(d); const keyList = Object.entries(d.key);
    return `${it.showKey !== false ? `<div class="skey">${keyList.map(([a, c]) => `<span><b>${c}</b><i>${a}</i></span>`).join('')}</div>` : ''}<div class="sitems">${d.items.map(x => `<div class="sit"><div class="senc">${x.enc.map(c => `<span>${esc(c)}</span>`).join('')}</div><div class="sdec">${[...x.w].map(c => `<span>${S(c)}</span>`).join('')}</div></div>`).join('')}</div>`;
  });
  T('abc', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<div class="abcs" style="${grid(cols(it.cols, 1, 4))}">${d.shown.map((w, i) => `<div class="abcr"><span class="bx n">${S(d.rank[i])}</span> ${esc(w)}</div>`).join('')}</div>${it.writeLines ? `<div class="lns" style="--sp:9mm">${d.shown.map(() => '<div class="ln"></div>').join('')}</div>` : ''}`;
  });
  T('wordlist', it => {
    const words = String(it.words || '').split('\n').map(w => w.trim()).filter(Boolean); const cl = (it.cols2 || 'abschreiben,abdecken,kontrolle').split(',');
    const head = { wort: 'Lernwort', abschreiben: 'abschreiben', abdecken: 'abdecken und schreiben', kontrolle: '✓', satz: 'Schreibe einen Satz.' };
    return `<table class="tbl wlt"><tr><th>${head.wort}</th>${cl.map(c => `<th class="${c === 'kontrolle' ? 'ck1' : ''}">${head[c] || esc(c)}</th>`).join('')}</tr>${words.map(w => `<tr><td>${md(w)}</td>${cl.map(c => `<td class="${c === 'kontrolle' ? 'ck1' : ''}"></td>`).join('')}</tr>`).join('')}</table>`;
  });
  T('conj', it => {
    const d = it.data; if (!d || d.error) return err(d);
    return `<div class="cjs" style="${grid(cols(it.cols, 1, 3))}">${d.tables.map(t => `<table class="tbl cjt"><tr><th colspan="2">${esc(t.v)}</th></tr>${t.f.map((f, i) => `<tr><td class="cjp">${esc(t.pron[i])}</td><td>${t.hide.includes(i) ? S(f) : esc(f)}</td></tr>`).join('')}</table>`).join('')}</div>`;
  });

  /* ---------- Alle Fächer ---------- */
  T('truefalse', it => {
    const items = (it.items || []).filter(x => (x.t || '').trim()); const d = it.data || {}; const order = d.order && d.order.length === (it.items || []).length ? d.order : (it.items || []).map((x, i) => i);
    const L = it.labels === 'ja' ? ['ja', 'nein'] : it.labels === 'en' ? ['true', 'false'] : ['richtig', 'falsch'];
    return `<table class="tbl tft"><tr><th></th><th class="tfc">${L[0]}</th><th class="tfc">${L[1]}</th></tr>${order.map(i => it.items[i]).filter(x => x && (x.t || '').trim()).map(x => `<tr><td>${md(x.t)}</td><td class="tfc"><span class="mk sq">${x.ok ? '<span class="s">✗</span>' : ''}</span></td><td class="tfc"><span class="mk sq">${!x.ok ? '<span class="s">✗</span>' : ''}</span></td></tr>`).join('')}</table>${items.length ? '' : err({ error: 'Noch keine Aussagen eingetragen.' })}`;
  });
  T('timeline', (it, ctx) => {
    const ev = (it.events || []).filter(e => String(e.l || '').trim() || String(e.r || '').trim()); if (!ev.length) return err({ error: 'Noch keine Ereignisse eingetragen (Jahr – Ereignis).' });
    const hide = new Set((it.data || {}).hide || []); const W = ctx.dim.iw; const num = e => parseFloat(String(e.l).replace(/[^\d,.-]/g, '').replace(',', '.'));
    const vals = ev.map(num), ok = vals.every(Number.isFinite), lo = Math.min(...vals), hi = Math.max(...vals);
    const P0 = 16; /* Rand, damit Beschriftungen an den Enden nicht abgeschnitten werden */ const xs = ev.map((e, i) => ok && hi > lo ? P0 + (num(e) - lo) / (hi - lo) * (W - 2 * P0) : P0 + i * (W - 2 * P0) / Math.max(1, ev.length - 1));
    const hideWhat = it.hideWhat || 'text';
    let s = `<div class="tlw" style="height:${ev.length > 6 ? 46 : 38}mm"><svg viewBox="0 0 ${W} 10" width="${W}mm" height="10mm" class="tla"><line x1="0" y1="5" x2="${W - 2}" y2="5" stroke="#222" stroke-width=".5"/><path d="M${W - 4} 3 L${W} 5 L${W - 4} 7" fill="none" stroke="#222" stroke-width=".5"/>${xs.map(x => `<line x1="${x}" y1="2.5" x2="${x}" y2="7.5" stroke="#222" stroke-width=".5"/>`).join('')}</svg>`;
    ev.forEach((e, i) => { const up = i % 2 === 0; const h = hide.has(i); s += `<div class="tle ${up ? 'up' : 'dn'}" style="left:${xs[i]}mm"><b>${h && hideWhat === 'jahr' ? box(e.l) : esc(e.l)}</b><span>${h && hideWhat !== 'jahr' ? `<span class="bx wide">${S(e.r)}</span>` : md(e.r)}</span></div>`; });
    return s + '</div>';
  });
  T('mindmap', (it, ctx) => {
    const br = String(it.btext || '').split('\n').map(b => b.trim()).filter(Boolean); const hide = new Set((it.data || {}).hide || []); const W = ctx.dim.iw, H = Math.max(60, +it.height || 80);
    const cx = W / 2, cy = H / 2, rx = W / 2 - 24, ry = H / 2 - 8; let lines = '', boxes = '';
    br.forEach((b, i) => { const a = i / br.length * 2 * Math.PI - Math.PI / 2; const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a); lines += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#444" stroke-width=".4"/>`; boxes += `<div class="mmb" style="left:${x}mm;top:${y}mm">${hide.has(i) ? `<span class="mmh">${S(b)}</span>` : md(b)}</div>`; });
    return `<div class="mm" style="height:${H}mm;width:${W}mm"><svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">${lines}</svg>${boxes}<div class="mmc" style="left:${cx}mm;top:${cy}mm">${md(it.center || 'Thema')}</div></div>`;
  });
  T('label', (it, ctx) => {
    const src = it.src; if (!src) return `<div class="imgph"><span class="imgphT">Bild auswählen …</span></div>`;
    const labs = (it.labels || []).filter(l => String(l.t || '').trim()); const hide = new Set((it.data || {}).hide || []); const W = ctx.dim.iw, iw = Math.max(20, Math.min(W - 70, W * (+it.width || 50) / 100)), ih = +it.imgH || iw, side = 34;
    const left = labs.map((l, i) => ({ ...l, i })).filter(l => (+l.x || 0) < 50), right = labs.map((l, i) => ({ ...l, i })).filter(l => (+l.x || 0) >= 50);
    const x0 = (W - iw) / 2; const row = (arr, isL) => arr.sort((a, b) => a.y - b.y).map((l, k) => ({ ...l, ly: (k + .5) * ih / Math.max(arr.length, 1), lx: isL ? x0 - 4 : x0 + iw + 4 }));
    const L = row(left, true), R = row(right, false); let svg = '';
    [...L, ...R].forEach(l => { const px = x0 + iw * (+l.x || 0) / 100, py = ih * (+l.y || 0) / 100; svg += `<line x1="${l.lx}" y1="${l.ly}" x2="${px}" y2="${py}" stroke="#222" stroke-width=".3"/><circle cx="${px}" cy="${py}" r=".8" fill="#222"/>`; });
    const lab = (l, isL) => `<div class="lbt ${isL ? 'l' : 'r'}" style="top:${l.ly}mm;${isL ? `right:${W - x0 + 5}mm` : `left:${x0 + iw + 5}mm`};width:${side}mm">${hide.has(l.i) ? `<span class="bx wide">${S(l.t)}</span>` : md(l.t)}</div>`;
    return `<div class="lbw" style="height:${ih}mm;width:${W}mm"><img src="${esc(imgSrc(src))}" style="position:absolute;left:${x0}mm;top:0;width:${iw}mm;height:${ih}mm;object-fit:contain" alt=""><svg viewBox="0 0 ${W} ${ih}" width="${W}mm" height="${ih}mm" style="position:absolute;left:0;top:0;overflow:visible">${svg}</svg>${L.map(l => lab(l, true)).join('')}${R.map(l => lab(l, false)).join('')}</div>`;
  });
  T('chart', (it, ctx) => {
    const rows = (it.rows || []).filter(r => String(r.l || '').trim()); if (!rows.length) return err({ error: 'Noch keine Werte eingetragen (Beschriftung – Wert).' });
    const vals = rows.map(r => parseFloat(String(r.r).replace(',', '.')) || 0); const max = Math.max(1, +it.max || 0, ...vals); const step = +it.step || (max <= 10 ? 1 : max <= 20 ? 2 : max <= 50 ? 5 : max <= 100 ? 10 : Math.pow(10, Math.floor(Math.log10(max))) / 2);
    const top = Math.ceil(max / step) * step; const W = Math.min(ctx.dim.iw, +it.w || ctx.dim.iw), H = +it.h || 60, ml = 12, mb = 10, cw = W - ml - 2, ch = H - mb - 4; const empty = it.empty;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">`;
    for (let v = 0; v <= top + 1e-9; v += step) { const y = 4 + ch - v / top * ch; s += `<line x1="${ml}" y1="${y}" x2="${W - 2}" y2="${y}" stroke="#d5dae1" stroke-width=".2"/><text x="${ml - 1.5}" y="${y + 1}" text-anchor="end" class="cht">${String(+v.toFixed(4)).replace('.', ',')}</text>`; }
    s += `<line x1="${ml}" y1="4" x2="${ml}" y2="${4 + ch}" stroke="#222" stroke-width=".35"/><line x1="${ml}" y1="${4 + ch}" x2="${W - 2}" y2="${4 + ch}" stroke="#222" stroke-width=".35"/>`;
    const bw = cw / rows.length; const pts = [];
    rows.forEach((r, i) => { const x = ml + i * bw, h = vals[i] / top * ch; pts.push([x + bw / 2, 4 + ch - h]); if ((it.kind || 'saeulen') === 'saeulen') s += `<rect x="${x + bw * .2}" y="${4 + ch - h}" width="${bw * .6}" height="${h}" fill="#9ab4d6" stroke="#3a5a8a" stroke-width=".3" class="${empty ? 's chS' : ''}"/>`; s += `<text x="${x + bw / 2}" y="${H - 4}" text-anchor="middle" class="cht">${esc(r.l)}</text>`; });
    if (it.kind === 'linie') s += `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#3a5a8a" stroke-width=".5" class="${empty ? 's' : ''}"/>${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r=".9" fill="#3a5a8a" class="${empty ? 's' : ''}"/>`).join('')}`;
    s += '</svg>';
    const table = it.table !== false ? `<table class="tbl chtab"><tr>${rows.map(r => `<th>${esc(r.l)}</th>`).join('')}</tr><tr>${rows.map(r => `<td>${esc(r.r)}</td>`).join('')}</tr></table>` : '';
    return `${it.empty ? table : ''}${s}${!it.empty && it.tableBelow ? table : ''}`;
  });
  T('sachtext', it => {
    const qs = String(it.questions || '').split('\n').map(q => q.trim()).filter(Boolean);
    const draft = it.status === 'entwurf' ? `<div class="draft">Entwurf – fachlich noch nicht freigegeben${it.sources ? ' · Quellen unten' : ''}</div>` : '';
    return `${draft}<div class="tx ${it.box ? 'boxed' : ''} ${it.lineNums ? 'lnum' : ''}">${it.lineNums ? md(it.text || '').split('<br>').map((p, i) => `<div class="tl"><span class="tn">${(i + 1) % 5 === 0 ? i + 1 : ''}</span><span>${p || '&nbsp;'}</span></div>`).join('') : md(it.text || '')}</div>${qs.length ? `<ol class="sqs">${qs.map(q => { const [qq, a] = q.split('|'); return `<li>${md(qq)}<div class="lns" style="--sp:9mm">${Array.from({ length: Math.max(1, +it.qLines || 2) }, (_, k) => `<div class="ln">${k === 0 && a ? S(a.trim()) : ''}</div>`).join('')}</div></li>`; }).join('')}</ol>` : ''}${it.sources ? `<div class="srcs">Quellen: ${md(it.sources)}</div>` : ''}`;
  });
  /* Selbstkontrolle: Ergebnisse (Zahlen und einzelne Wörter) der gewählten Aufgaben gemischt als Lösungsschlange */
  const SC_SKIP = new Set(['selfcheck', 'image', 'space', 'lineatur', 'wordlist', 'kaestchen', 'hundred', 'choice', 'truefalse', 'match', 'table', 'chart', 'label', 'mindmap', 'timeline', 'sachtext', 'lines']);
  const parseNums = str => { const out = new Set(); String(str || '').split(',').forEach(p => { const m = /^\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*$/.exec(p); if (m) { const a = +m[1], b = m[2] ? +m[2] : a; for (let k = Math.min(a, b); k <= Math.max(a, b) && k < 200; k++) out.add(k); } }); return out; };
  function selfcheckValues(doc, sc) {
    const s = doc.settings || {}; let n = 0; const used = []; const vals = []; const scope = sc.scope || 'alle'; const pick = scope === 'nummern' ? parseNums(sc.nums) : null;
    let before = true;
    for (const x of doc.items || []) {
      if (x.id === sc.id) { before = false; continue; }
      const numbered = RD.TASK.has(x.type) && s.numbering !== false && x.numbered !== false && !(x.type === 'image' && !(x.title || '').trim());
      const num = numbered ? ++n : null;
      if (SC_SKIP.has(x.type) || !x.data || x.data.error) continue;
      if (scope === 'davor' && !before) continue;
      if (pick && (num == null || !pick.has(num))) continue;
      const got = [];
      const d = x.data;
      if (x.type === 'written') (d.tasks || []).forEach(t => { if (t.res != null) got.push(String(t.res)); });
      else if (x.type === 'wdiv') (d.tasks || []).forEach(t => got.push(t.r ? `${t.q} R ${t.r}` : String(t.q)));
      else if (x.type === 'sachaufgabe') { const m = /(-?\d[\d.,]*)\s*$/.exec(String(x.solR || '')); if (m) got.push(m[1]); }
      else {
        let h = ''; try { const f = RD.R[x.type]; h = f ? f(x, { num: 1, doc, dim: RD.dims(doc), fC: '', fI: '' }) : ''; } catch (e) { h = ''; }
        h = Array.isArray(h) ? h.join('') : String(h || '');
        const re = /<(span|text|div|td|b|tspan)[^>]*class="s[ "][^>]*>([^<]{1,30})<\//g; let m;
        while ((m = re.exec(h))) { const v = m[2].replace(/&nbsp;/g, ' ').trim(); if (/^-?\d+([.,]\d+)?$/.test(v) || /^[A-Za-zÄÖÜäöüß]{2,14}$/.test(v)) got.push(v); }
      }
      if (got.length) { used.push({ num, type: x.type, count: got.length }); vals.push(...got); }
    }
    return { vals, used };
  }
  RD.selfcheckValues = selfcheckValues;
  T('selfcheck', (it, ctx) => {
    const doc = ctx.doc; if (!doc) return '';
    const { vals } = selfcheckValues(doc, it);
    const r = G.rng(it.seed || 1); let base = vals.slice(0, +it.max || 40);
    /* falsche Lösungen dazumischen (Zahlen in der Nähe echter Ergebnisse) */
    const nw = Math.max(0, Math.min(20, +it.wrong || 0)); const have = new Set(base); const nums = base.map(v => Number(String(v).replace(',', '.'))).filter(Number.isFinite);
    for (let k = 0, t = 0; k < nw && nums.length && t < 400; t++) { const v = Math.round(nums[Math.floor(r() * nums.length)]) + (r() < .5 ? -1 : 1) * (1 + Math.floor(r() * 10)); if (v < 0 || have.has(String(v))) continue; have.add(String(v)); base.push(String(v)); k++; }
    const sh = G.shuffle(r, base);
    if (!sh.length) return `<div class="shint">Die Lösungsschlange sammelt die Ergebnisse der Aufgaben auf diesem Blatt. Noch keine gefunden.</div>`;
    return `<div class="snake">${sh.map(v => `<span>${esc(v)}</span>`).join('')}</div><div class="shint">${esc(it.note || 'Male jedes Ergebnis an, das du gefunden hast.')}</div>`;
  });

  /* ---------- Gestaltung ---------- */
  T('bubble', it => {
    const think = it.kind === 'denken', side = it.side || 'links', pic = it.src ? `<img class="bbp" src="${esc(imgSrc(it.src))}" alt="">` : '';
    return `<div class="bbw ${side}">${side === 'links' ? pic : ''}<div class="bb ${think ? 'think' : 'say'} ${side}"><div class="bbt">${md(it.text || '')}</div></div>${side === 'rechts' ? pic : ''}</div>`;
  }, false);
  const SHAPES = {
    rect: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/>`, round: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="${Math.min(w, h) * .18}"/>`, ellipse: (w, h) => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>`,
    triangle: (w, h) => `<path d="M${w / 2} 0 ${w} ${h} 0 ${h}Z"/>`, rtriangle: (w, h) => `<path d="M0 0 ${w} ${h} 0 ${h}Z"/>`, diamond: (w, h) => `<path d="M${w / 2} 0 ${w} ${h / 2} ${w / 2} ${h} 0 ${h / 2}Z"/>`,
    pentagon: (w, h) => { const p = []; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; p.push(`${(w / 2 + w / 2 * Math.cos(a)).toFixed(2)} ${(h / 2 + h / 2 * Math.sin(a)).toFixed(2)}`); } return `<path d="M${p.join(' ')}Z"/>`; },
    hexagon: (w, h) => `<path d="M${w * .25} 0 ${w * .75} 0 ${w} ${h / 2} ${w * .75} ${h} ${w * .25} ${h} 0 ${h / 2}Z"/>`,
    star: (w, h) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .4 : 1; p.push(`${(w / 2 + w / 2 * r * Math.cos(a)).toFixed(2)} ${(h / 2 + h / 2 * r * Math.sin(a)).toFixed(2)}`); } return `<path d="M${p.join(' ')}Z"/>`; },
    arrowblock: (w, h) => `<path d="M0 ${h * .3} ${w * .65} ${h * .3} ${w * .65} 0 ${w} ${h / 2} ${w * .65} ${h} ${w * .65} ${h * .7} 0 ${h * .7}Z"/>`,
    heart: (w, h) => `<path d="M${w / 2} ${h} C${w * -.1} ${h * .55} ${w * .05} ${h * -.05} ${w / 2} ${h * .25} C${w * .95} ${h * -.05} ${w * 1.1} ${h * .55} ${w / 2} ${h}Z"/>`,
    sector: (w, h) => `<path d="M0 ${h} L0 0 A${w} ${h} 0 0 1 ${w} ${h}Z"/>`,
    arc: (w, h) => `<path d="M0 ${h} A${w / 2} ${h} 0 0 1 ${w} ${h}" fill="none"/>`,
    line: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>`, arrow: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w - 1.5}" y2="${h / 2}"/><path d="M${w - 4} ${h / 2 - 2.2} ${w} ${h / 2} ${w - 4} ${h / 2 + 2.2}Z" class="ah"/>`,
    darrow: (w, h) => `<line x1="1.5" y1="${h / 2}" x2="${w - 1.5}" y2="${h / 2}"/><path d="M${w - 4} ${h / 2 - 2.2} ${w} ${h / 2} ${w - 4} ${h / 2 + 2.2}Z" class="ah"/><path d="M4 ${h / 2 - 2.2} 0 ${h / 2} 4 ${h / 2 + 2.2}Z" class="ah"/>`,
    curve: (w, h) => `<path d="M0 ${h * .8} C${w * .3} ${-h * .3} ${w * .6} ${h * 1.3} ${w} ${h * .2}" fill="none"/>`,
    cloud: (w, h) => `<path d="M${w * .25} ${h * .85} C${w * .02} ${h * .85} ${w * .02} ${h * .45} ${w * .22} ${h * .45} C${w * .2} ${h * .1} ${w * .55} ${h * .05} ${w * .6} ${h * .3} C${w * .75} ${h * .12} ${w} ${h * .3} ${w * .88} ${h * .55} C${w * 1.02} ${h * .7} ${w * .9} ${h * .9} ${w * .75} ${h * .85}Z"/>`,
  };
  T('shape', it => {
    const w = Math.max(2, +it.w || 40), lineLike = ['line', 'arrow', 'darrow'].includes(it.shape), h = lineLike ? 6 : Math.max(2, +it.h || 25); const sw = Math.max(.1, +it.sw || .5); const fill = it.fill && it.fill !== 'none' ? it.fill : 'none';
    const f = SHAPES[it.shape] || SHAPES.rect; const pad = sw;
    return `<div class="shp" style="text-align:${it.align || 'left'}"><svg viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" width="${w + 2 * pad}mm" height="${h + 2 * pad}mm" style="overflow:visible"><g fill="${esc(fill)}" stroke="${esc(it.color || '#222')}" stroke-width="${sw}" stroke-linejoin="round" ${it.dash ? `stroke-dasharray="${sw * 3} ${sw * 2}"` : ''}>${f(w, h).replace(/class="ah"/g, `fill="${esc(it.color || '#222')}"`)}</g>${it.text ? `<foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="shpT">${md(it.text)}</div></foreignObject>` : ''}</svg></div>`;
  }, false);
  T('qr', it => {
    const txt = String(it.text || '').trim(); if (!txt) return err({ error: 'Bitte einen Link oder Text eingeben.' });
    let svg = ''; try { const Q = root.qrcode; const q = Q(0, it.ecc || 'M'); q.addData(unescape(encodeURIComponent(txt))); q.make(); const n = q.getModuleCount(), sz = Math.max(15, +it.size || 30); let p = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) p += `M${x} ${y}h1v1h-1z`; svg = `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" width="${sz}mm" height="${sz}mm" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${p}" fill="#000"/></svg>`; }
    catch (e) { return err({ error: 'Der Text ist für einen QR-Code zu lang.' }); }
    return `<div class="qrw" style="text-align:${it.align || 'left'}">${svg}${it.caption ? `<div class="qrc">${md(it.caption)}</div>` : ''}</div>`;
  }, false);
  T('sign', it => `<div class="signrow"><span>${md(it.text || 'Kenntnis genommen:')}</span><i></i><small>${esc(it.sub || 'Unterschrift einer/eines Erziehungsberechtigten')}</small></div>`, false);
  T('divider', it => `<div class="divd ${esc(it.style || 'linie')}"></div>`, false);
})(typeof window !== 'undefined' ? window : globalThis);
