/* Foliva – Darstellung der Erweiterungen ab 0.9.9 · © 2026 theis
   Zahlenstrahl „Zahlen markieren“, Uhrzeiten am Tag und am Abend, gemischte Rechendreiecke, Rückgeld, Zahlen zerlegen.
   Ohne die neuen Einstellungen bleibt die Darstellung wie bisher. */
(function (root) {
  'use strict';
  const RD = root.FolivaRender || (typeof require !== 'undefined' ? require('./render.js') : null);
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen4.js') : null);
  const { esc, S, box, err, register } = RD;
  const T = (type, fn) => register(type, fn, { task: true });
  const cols = (n, lo = 1, hi = 6) => Math.max(lo, Math.min(hi, +n || lo));
  const grid = (n, w = 'minmax(0,1fr)') => `grid-template-columns:repeat(${n},${w})`;
  const de = n => Number(n).toLocaleString('de-DE');

  /* ---------- Zahlenstrahl: Zahlen markieren ---------- */
  { const base = RD.R.numberline; T('numberline', (it, ctx) => {
    const d = it.data; if (!d || d.error || d.mode !== 'markieren') return base(it, ctx);
    const IW = ctx.dim.iw, n = d.vals.length - 1, W = IW - 10, x0 = 4, dx = W / n, ask = d.ask;
    let s = `<svg class="nl" viewBox="0 -9 ${IW} 29" width="${IW}mm" height="29mm"><line x1="0" y1="8" x2="${IW - .5}" y2="8" stroke="#222" stroke-width=".35"/><path d="M${IW - 2.5} 6.3 L${IW} 8 L${IW - 2.5} 9.7" fill="none" stroke="#222" stroke-width=".35"/>`;
    d.vals.forEach((v, i) => {
      const x = x0 + i * dx, big = i % d.label === 0;
      s += `<line x1="${x}" y1="${big ? 4.5 : 6}" x2="${x}" y2="${big ? 11.5 : 10}" stroke="#222" stroke-width="${big ? .4 : .25}"/>`;
      if (big) s += `<text x="${x}" y="17" text-anchor="middle" class="nlt">${v}</text>`;
    });
    /* Lösung: Pfeil über dem Strich und die Zahl darüber */
    ask.forEach(i => { const x = x0 + i * dx; s += `<g class="s"><path d="M${x} -1.5 V3.6 M${x - 1.3} 1.9 L${x} 3.8 L${x + 1.3} 1.9" fill="none" stroke="var(--solc)" stroke-width=".45"/><text x="${x}" y="-3" text-anchor="middle" class="nlt s">${d.vals[i]}</text></g>`; });
    const list = ask.map(i => d.vals[i]); const shuffled = list.slice().sort((a, b) => ((a * 7919) % 13) - ((b * 7919) % 13));
    return s + `</svg><div class="nlmark">Markiere: ${shuffled.map(v => `<b>${de(v)}</b>`).join('')}</div>`;
  }); }

  /* ---------- Uhrzeiten am Tag und am Abend ---------- */
  { const base = RD.R.clock; T('clock', (it, ctx) => {
    const d = it.data; if (!d || d.error || !d.daynight || d.pairs) return base(it, ctx);
    /* Zifferblatt aus der bisherigen Darstellung übernehmen, nur die Beschriftung darunter ändert sich */
    const html = base({ ...it, data: { ...d, daynight: false } }, ctx);
    const draw = it.mode === 'einzeichnen'; const mm = t => String(t.m).padStart(2, '0');
    const parts = html.split('<div class="ctime">');
    if (parts.length !== d.times.length + 1) return html;
    return parts.map((p, i) => { if (!i) return p; const t = d.times[i - 1]; const rest = p.slice(p.indexOf('</div>') + 6);
      const am = `${t.h === 12 ? 0 : t.h}:${mm(t)} Uhr`, pm = `${t.h === 12 ? 12 : t.h + 12}:${mm(t)} Uhr`;
      const lab = draw ? `<div class="ctime">${esc(t.pm ? pm : am)}</div>` : `<div class="ctime cdn"><span class="bx wide">${S(am)}</span><span class="cdo">oder</span><span class="bx wide">${S(pm)}</span></div>`;
      return lab + rest; }).join('');
  }); }

  /* ---------- Rechendreieck: Innen- und Außenfelder gemischt ---------- */
  { const base = RD.R.triangle; T('triangle', (it, ctx) => {
    const d = it.data; if (!d || d.error || !d.tris.some(t => t.show)) return base(it, ctx);
    const one = t => { const sh = t.show || (t.mode === 'innen' ? [1, 1, 1, 0, 0, 0] : [0, 0, 0, 1, 1, 1]);
      const V = (v, show) => show ? `<tspan>${v}</tspan>` : `<tspan class="s">${v}</tspan>`;
      const circ = (x, y, v, k) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#555" stroke-width=".35"/><text x="${x}" y="${y + 1.5}" class="trn">${V(v, sh[k])}</text>`;
      const bx = (x, y, v, k) => `<rect x="${x - 7}" y="${y - 4.5}" width="14" height="9" rx="1.2" fill="#fff" stroke="#555" stroke-width=".35"/><text x="${x}" y="${y + 1.5}" class="trn">${V(v, sh[k])}</text>`;
      return `<svg class="tri" viewBox="0 0 84 68" width="60mm" height="48.6mm"><path d="M42 3 74 58 10 58Z" fill="none" stroke="#333" stroke-width=".55" stroke-linejoin="round"/><path d="M42 26 30 47M42 26 54 47M30 47h24" fill="none" stroke="#9aa3ad" stroke-width=".3"/>
        ${circ(42, 19, t.inner[0], 0)}${circ(24, 50, t.inner[1], 1)}${circ(60, 50, t.inner[2], 2)}${bx(15, 27, t.outer[0], 3)}${bx(42, 63.5, t.outer[1], 4)}${bx(69, 27, t.outer[2], 5)}</svg>`; };
    return `<div class="flexw">${d.tris.map(one).join('')}</div>`;
  }); }

  /* ---------- Geld: echte Scheine und Münzen (Abbildungen der EZB; Scheine mit „SPECIMEN“, deutlich verkleinert) ---------- */
  const EURO_FILE = { 1: '1ct.png', 2: '2ct.png', 5: '5ct.png', 10: '10ct.png', 20: '20ct.png', 50: '50ct.png', 100: '1euro.png', 200: '2euro.png', 500: '5euro.jpg', 1000: '10euro.jpg', 2000: '20euro.jpg', 5000: '50euro.jpg', 10000: '100euro.jpg', 20000: '200euro.jpg' };
  const COIN_MM = { 1: 16.25, 2: 18.75, 5: 21.25, 10: 19.75, 20: 22.25, 50: 24.25, 100: 23.25, 200: 25.75 }, NOTE_MM = { 500: 120, 1000: 127, 2000: 133, 5000: 140, 10000: 147, 20000: 153 };
  const realMoney = v => { const f = EURO_FILE[v]; if (!f) return RD.moneySvg ? RD.moneySvg(v) : ''; const coin = v < 500;
    return coin ? `<img class="ecoin" src="bilder/euro/${f}" style="width:${(COIN_MM[v] * .42).toFixed(1)}mm;height:${(COIN_MM[v] * .42).toFixed(1)}mm" alt="${esc(G.euro(v))}">` : `<img class="enote" src="bilder/euro/${f}" style="width:${(NOTE_MM[v] * .24).toFixed(1)}mm" alt="${esc(G.euro(v))}">`; };
  RD.realMoney = realMoney;
  const moneyPic = (it, v) => it.mlook === 'echt' ? realMoney(v) : (RD.moneySvg ? RD.moneySvg(v) : esc(G.euro(v)));
  { const base = RD.R.money; T('money', (it, ctx) => {
    const d = it.data; if (!d || d.error) return base(it, ctx);
    if (d.mode !== 'rueckgeld' && it.mlook === 'echt') {
      const lay = it.mode === 'legen';
      return `<div class="mny real">${d.tasks.map(t => `<div class="mnr">${lay ? `<div class="mnq">${esc(G.euro(t.total))}</div><div class="mnf"><div class="s mnl">${t.items.map(realMoney).join('')}</div></div>` : `<div class="mnl">${t.items.map(realMoney).join('')}</div><div class="mna">= ${box(G.euro(t.total))}</div>`}</div>`).join('')}</div>`;
    }
    if (d.mode !== 'rueckgeld') return base(it, ctx);
    const pay = v => { const out = []; let rest = v; for (const x of [10000, 5000, 2000, 1000, 500, 200, 100]) while (rest >= x && out.length < 4) { out.push(x); rest -= x; } return out; };
    return `<div class="mny rg">${d.tasks.map(t => `<div class="mnr rgr"><div class="rgi"><span class="rgt">${esc(t.item)}</span><span class="rgp">${esc(G.euro(t.price))}</span></div><div class="rgpay"><small>Du bezahlst mit</small><div class="mnl">${pay(t.paid).map(v => moneyPic(it, v)).join('')}</div></div><div class="mna">Rückgeld: ${box(G.euro(t.change))}</div></div>`).join('')}</div>`;
  }); }

  /* ---------- Stellenwerte: Zahlen zerlegen, zusammensetzen, als Summe ---------- */
  { const base = RD.R.placevalue; T('placevalue', (it, ctx) => {
    const d = it.data; if (!d || d.error || !d.list) return base(it, ctx);
    const L = d.cols; /* z. B. ['H','Z','E'] */
    const row = r => {
      const parts = r.d.map((x, i) => ({ x, u: L[i], v: x * 10 ** (r.d.length - 1 - i) }));
      if (d.list === 'zerlegen') return `<div class="pk pvz"><span>${de(r.n)} =</span> ${parts.map(p => `${box(p.x)} ${p.u}`).join(' + ')}</div>`;
      const wb = v => `<span class="bx" style="min-width:${Math.max(12, 4 + String(v).length * 2.6)}mm">${S(v)}</span>`;
      if (d.list === 'zusammen') return `<div class="pk pvz">${parts.map(p => `${p.x} ${p.u}`).join(' + ')} = ${wb(de(r.n))}</div>`;
      return `<div class="pk pvz"><span>${de(r.n)} =</span> ${parts.filter(p => p.x).map(p => wb(de(p.v))).join(' + ')}</div>`;
    };
    return `<div class="pks" style="${grid(cols(it.cols || (d.list === 'zusammen' || L.length >= 4 ? 1 : 2), 1, 3))}">${d.rows.map(row).join('')}</div>${d.list !== 'plus' ? `<div class="shint">${L.map(u => ({ M: 'M = Millionen', HT: 'HT = Hunderttausender', ZT: 'ZT = Zehntausender', T: 'T = Tausender', H: 'H = Hunderter', Z: 'Z = Zehner', E: 'E = Einer' })[u]).join(' · ')}</div>` : ''}`;
  }); }

  /* ---------- Bild und Wort: Anlaut als Laut (Sch, Ei, Au …), Silben ohne vorgegebene Bögen, Mehrzahl ---------- */
  { const base = RD.R.pictureword; T('pictureword', (it, ctx) => {
    const d = it.data; if (!d || d.error || !['anlaut', 'silben', 'mehrzahl'].includes(d.mode)) return base(it, ctx);
    const libImg = f => `<img class="pwi" src="${esc(RD.imgSrc(String(f).startsWith('lib:') ? f : 'lib:' + f))}" alt="">`;
    const one = x => {
      const pic = x.f ? libImg(x.f) : `<div class="pwx">${esc(x.w)}</div>`; let a = '';
      if (d.mode === 'anlaut') { const m = /^(Sch|Ch|Qu|Pf|Ei|Au|Eu|Äu)/.exec(x.w); a = `<span class="bx n">${S(m ? m[1] : x.w[0])}</span>`; }
      else if (d.mode === 'silben') { const sy = (x.s || x.w).split('-'); a = it.sylask === 'zahl'
        ? `<div class="pwz">${[1, 2, 3, 4].map(k => `<span class="${k === sy.length ? 'pzk' : ''}">${k}</span>`).join('')}</div><div class="s pwsx">${esc(sy.join(' · '))}</div>`
        : `<div class="pws pwsb"><span class="pwsl"></span><span class="s pwsa">${sy.map(() => '<i></i>').join('')}</span><span class="s pwsx">${esc(sy.join(' · '))}</span></div>`; }
      else if (d.mode === 'mehrzahl') a = `<div class="pwm">${esc((x.a ? x.a + ' ' : '') + x.w)}<br>die <span class="bx">${S(x.p || '')}</span></div>`;
      return `<div class="pw">${pic}${a}</div>`;
    };
    return `<div class="pws1" style="${grid(cols(it.cols, 2, 6))}">${d.items.map(one).join('')}</div>`;
  }); }

  /* ---------- Strichliste ---------- */
  const tallySvg = n => { n = Math.max(0, Math.min(60, Math.round(n))); const g = Math.ceil(n / 5) || 0; let s = '', x = 1; for (let i = 0; i < g; i++) { const k = Math.min(5, n - i * 5); for (let j = 0; j < Math.min(4, k); j++) s += `<line x1="${x + j * 1.6}" y1="1" x2="${x + j * 1.6}" y2="7" />`; if (k === 5) s += `<line x1="${x - .8}" y1="6" x2="${x + 5.6}" y2="2" />`; x += 8.5; } return `<svg class="tly" viewBox="0 0 ${Math.max(10, x)} 8" width="${Math.max(10, x)}mm" height="8mm"><g stroke="currentColor" stroke-width=".35" stroke-linecap="round">${s}</g></svg>`; };
  { const base = RD.R.chart; register('chart', (it, ctx) => {
    if (it.kind !== 'strich') return base(it, ctx);
    const rows = (it.rows || []).filter(r => String(r.l || '').trim()); if (!rows.length) return err({ error: 'Noch keine Werte eingetragen (Beschriftung – Wert).' });
    const draw = it.tally === 'zeichnen';
    return `<table class="tbl tlyt"><tr><th>${esc('Was?')}</th><th>Strichliste</th><th>Anzahl</th></tr>${rows.map(r => { const n = parseInt(String(r.r), 10) || 0; return `<tr><td>${esc(r.l)}</td><td class="tlyc">${draw ? `<span class="s">${tallySvg(n)}</span>` : tallySvg(n)}</td><td class="tlyn">${draw ? n : S(n)}</td></tr>`; }).join('')}</table>`;
  }, { task: true }); }

  /* ---------- Formen: viele Flächen, Linien, gebogene Pfeile, Körper ---------- */
  const f2 = v => (+v).toFixed(2);
  const ah = (x, y, ang, s) => { const a1 = ang + Math.PI * .85, a2 = ang - Math.PI * .85; return `<path d="M${f2(x)} ${f2(y)} L${f2(x + s * Math.cos(a1))} ${f2(y + s * Math.sin(a1))} L${f2(x + s * Math.cos(a2))} ${f2(y + s * Math.sin(a2))}Z" class="ah"/>`; };
  const poly = (w, h, n, rot = -Math.PI / 2) => { const p = []; for (let i = 0; i < n; i++) { const a = rot + i * 2 * Math.PI / n; p.push(`${f2(w / 2 + w / 2 * Math.cos(a))} ${f2(h / 2 + h / 2 * Math.sin(a))}`); } return `<path d="M${p.join(' ')}Z"/>`; };
  const HID = 'stroke-dasharray="1.2 1"';
  const SH = {
    rect: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/>`, round: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="${Math.min(w, h) * .18}"/>`, ellipse: (w, h) => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>`,
    triangle: (w, h) => `<path d="M${w / 2} 0 ${w} ${h} 0 ${h}Z"/>`, rtriangle: (w, h) => `<path d="M0 0 ${w} ${h} 0 ${h}Z"/>`, diamond: (w, h) => `<path d="M${w / 2} 0 ${w} ${h / 2} ${w / 2} ${h} 0 ${h / 2}Z"/>`,
    trapez: (w, h) => `<path d="M${w * .22} 0 ${w * .78} 0 ${w} ${h} 0 ${h}Z"/>`, parallel: (w, h) => `<path d="M${w * .25} 0 ${w} 0 ${w * .75} ${h} 0 ${h}Z"/>`,
    pentagon: (w, h) => poly(w, h, 5), hexagon: (w, h) => `<path d="M${w * .25} 0 ${w * .75} 0 ${w} ${h / 2} ${w * .75} ${h} ${w * .25} ${h} 0 ${h / 2}Z"/>`, octagon: (w, h) => poly(w, h, 8, -Math.PI / 2 + Math.PI / 8),
    star: (w, h) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .4 : 1; p.push(`${f2(w / 2 + w / 2 * r * Math.cos(a))} ${f2(h / 2 + h / 2 * r * Math.sin(a))}`); } return `<path d="M${p.join(' ')}Z"/>`; },
    cross: (w, h) => { const a = w / 3, b = h / 3; return `<path d="M${a} 0 ${2 * a} 0 ${2 * a} ${b} ${w} ${b} ${w} ${2 * b} ${2 * a} ${2 * b} ${2 * a} ${h} ${a} ${h} ${a} ${2 * b} 0 ${2 * b} 0 ${b} ${a} ${b}Z"/>`; },
    arrowblock: (w, h) => `<path d="M0 ${h * .3} ${w * .65} ${h * .3} ${w * .65} 0 ${w} ${h / 2} ${w * .65} ${h} ${w * .65} ${h * .7} 0 ${h * .7}Z"/>`,
    heart: (w, h) => `<path d="M${w / 2} ${h} C${w * -.1} ${h * .55} ${w * .05} ${h * -.05} ${w / 2} ${h * .25} C${w * .95} ${h * -.05} ${w * 1.1} ${h * .55} ${w / 2} ${h}Z"/>`,
    cloud: (w, h) => `<path d="M${w * .25} ${h * .85} C${w * .02} ${h * .85} ${w * .02} ${h * .45} ${w * .22} ${h * .45} C${w * .2} ${h * .1} ${w * .55} ${h * .05} ${w * .6} ${h * .3} C${w * .75} ${h * .12} ${w} ${h * .3} ${w * .88} ${h * .55} C${w * 1.02} ${h * .7} ${w * .9} ${h * .9} ${w * .75} ${h * .85}Z"/>`,
    sector: (w, h) => `<path d="M0 ${h} L0 0 A${w} ${h} 0 0 1 ${w} ${h}Z"/>`,
    pie: (w, h, it) => { const n = Math.max(2, Math.min(24, +it.parts || 8)), k = Math.max(0, Math.min(n, +it.filled || 0)); const cx = w / 2, cy = h / 2; let s = '';
      for (let i = 0; i < k; i++) { const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n; s += `<path d="M${cx} ${cy} L${f2(cx + cx * Math.cos(a0))} ${f2(cy + cy * Math.sin(a0))} A${cx} ${cy} 0 0 1 ${f2(cx + cx * Math.cos(a1))} ${f2(cy + cy * Math.sin(a1))}Z" class="pief"/>`; }
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" fill="none"/>`; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; s += `<line x1="${cx}" y1="${cy}" x2="${f2(cx + cx * Math.cos(a))}" y2="${f2(cy + cy * Math.sin(a))}"/>`; } return s; },
    line: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>`,
    arrow: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w - 1.5}" y2="${h / 2}"/>` + ah(w, h / 2, 0, 4),
    darrow: (w, h) => `<line x1="1.5" y1="${h / 2}" x2="${w - 1.5}" y2="${h / 2}"/>` + ah(w, h / 2, 0, 4) + ah(0, h / 2, Math.PI, 4),
    arc: (w, h) => `<path d="M0 ${h} A${w / 2} ${h} 0 0 1 ${w} ${h}" fill="none"/>`,
    arcarrow: (w, h) => `<path d="M0 ${h} A${w / 2} ${h} 0 0 1 ${w} ${h - .6}" fill="none"/>` + ah(w, h, Math.PI / 2, 3.5),
    curve: (w, h) => `<path d="M0 ${h * .8} C${w * .3} ${-h * .3} ${w * .6} ${h * 1.3} ${w} ${h * .2}" fill="none"/>`,
    scurve: (w, h) => `<path d="M0 ${h} C${w * .5} ${h} ${w * .5} 0 ${w} 0" fill="none"/>`,
    scurvearrow: (w, h) => `<path d="M0 ${h} C${w * .5} ${h} ${w * .5} 0 ${w - 1.2} 0" fill="none"/>` + ah(w, 0, 0, 3.5),
    brace: (w, h) => `<path d="M0 0 Q${w / 2} 0 ${w / 2} ${h * .25} L${w / 2} ${h * .38} Q${w / 2} ${h / 2} ${w} ${h / 2} Q${w / 2} ${h / 2} ${w / 2} ${h * .62} L${w / 2} ${h * .75} Q${w / 2} ${h} 0 ${h}" fill="none"/>`,
    /* Körper mit gestrichelten verdeckten Kanten */
    cube: (w, h) => { const s = Math.min(w, h) * .74, d = Math.min(w, h) - s; return `<path d="M0 ${d} h${s} v${s} h${-s}Z"/><path d="M0 ${d} L${d} 0 h${s} v${s} L${s} ${d + s} M${s} ${d} L${s + d} 0" fill="none"/><path d="M${d} 0 v${s} h${s} M${d} ${s} L0 ${d + s}" fill="none" ${HID}/>`; },
    cuboid: (w, h) => { const dx = w * .28, dy = h * .3, fw = w - dx, fh = h - dy; return `<path d="M0 ${dy} h${fw} v${fh} h${-fw}Z"/><path d="M0 ${dy} L${dx} 0 h${fw} v${fh} L${fw} ${h} M${fw} ${dy} L${w} 0" fill="none"/><path d="M${dx} 0 v${fh} h${fw} M${dx} ${fh} L0 ${h}" fill="none" ${HID}/>`; },
    cylinder: (w, h) => { const ry = Math.min(h * .14, w * .25); return `<path d="M0 ${ry} V${h - ry} A${w / 2} ${ry} 0 0 0 ${w} ${h - ry} V${ry}" /><ellipse cx="${w / 2}" cy="${ry}" rx="${w / 2}" ry="${ry}"/><path d="M0 ${h - ry} A${w / 2} ${ry} 0 0 1 ${w} ${h - ry}" fill="none" ${HID}/>`; },
    cone: (w, h) => { const ry = Math.min(h * .14, w * .25); return `<path d="M${w / 2} 0 L${w} ${h - ry} A${w / 2} ${ry} 0 0 1 0 ${h - ry}Z"/><path d="M0 ${h - ry} A${w / 2} ${ry} 0 0 1 ${w} ${h - ry}" fill="none" ${HID}/>`; },
    pyramid: (w, h) => { const by = h * .78, dx = w * .3, dy = h * .22, ax = w * .5; return `<path d="M0 ${h} L${w - dx} ${h} L${w} ${by} L${ax} 0 Z" /><path d="M${ax} 0 L${w - dx} ${h}" fill="none"/><path d="M0 ${h} L${dx} ${by} L${w} ${by} M${dx} ${by} L${ax} 0" fill="none" ${HID}/>`; },
    sphere: (w, h) => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/><path d="M0 ${h / 2} A${w / 2} ${h * .14} 0 0 0 ${w} ${h / 2}" fill="none"/><path d="M0 ${h / 2} A${w / 2} ${h * .14} 0 0 1 ${w} ${h / 2}" fill="none" ${HID}/>`,
  };
  RD.SHAPE_KEYS = Object.keys(SH);
  const LINE_LIKE = new Set(['line', 'arrow', 'darrow']);
  RD.shapeLineLike = k => LINE_LIKE.has(k);
  register('shape', it => {
    const w = Math.max(2, +it.w || 40), h = LINE_LIKE.has(it.shape) ? 6 : Math.max(2, +it.h || 25); const sw = Math.max(.1, +it.sw || .5); const fill = it.fill && it.fill !== 'none' ? it.fill : 'none';
    const col = /^#[0-9a-f]{3,8}$/i.test(it.color || '') ? it.color : '#222'; const f = SH[it.shape] || SH.rect; const pad = sw;
    const pf = fill !== 'none' ? fill : '#c9d3e1';
    const body = f(w, h, it).replace(/class="ah"/g, `fill="${col}"`).replace(/class="pief"/g, `fill="${esc(pf)}" stroke="none"`);
    return `<div class="shp" style="text-align:${it.align || 'left'}"><svg viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" width="${w + 2 * pad}mm" height="${h + 2 * pad}mm" style="overflow:visible"><g fill="${esc(fill)}" stroke="${esc(col)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${it.dash ? `stroke-dasharray="${sw * 3} ${sw * 2}"` : ''}>${body}</g>${it.text ? `<foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="shpT">${RD.md(it.text)}</div></foreignObject>` : ''}</svg></div>`;
  }, { task: false });

  /* ---------- Malhaus: Malzeichen zwischen den Zahlen ---------- */
  { const base = RD.R.house; T('house', (it, ctx) => { const d = it.data; const h = base(it, ctx); return d && d.op === '·' ? h.replace(/class="house"/g, 'class="house mal"') : h; }); }

  if (typeof module !== 'undefined' && module.exports) module.exports = RD; else root.FolivaRender = RD;
})(typeof window !== 'undefined' ? window : globalThis);
