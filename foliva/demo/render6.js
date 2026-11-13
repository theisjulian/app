/* Foliva – Darstellung ab 0.9.13 · © 2026 theis
   Einmaleins am Punktefeld (Malwinkel), Anlauttabelle. */
(function (root) {
  'use strict';
  const RD = root.FolivaRender || (typeof require !== 'undefined' ? require('./render5.js') : null);
  const { esc, err, register, imgSrc } = RD;
  const T = (type, fn) => register(type, fn, { task: true });
  const f = v => (+v).toFixed(2);
  const cols = (n, lo = 1, hi = 6) => Math.max(lo, Math.min(hi, +n || lo));

  /* ---------- Einmaleins am Punktefeld ---------- */
  const D = 4.2, R = 1.35, GAP = 1.6, PAD = 1.2;
  const px = (i, five) => PAD + i * D + (five && i >= 5 ? GAP : 0) + D / 2;
  function field(rows, colsN, inside, opt = {}) {
    const five = opt.five !== false; const W = px(colsN - 1, five) + D / 2 + PAD, H = px(rows - 1, five) + D / 2 + PAD;
    let s = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < colsN; x++) {
      const inn = inside(y, x); const cx = px(x, five), cy = px(y, five);
      if (inn === 'on') s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${R}" fill="#222"/>`;
      else if (inn === 'sol') s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${R}" fill="none" stroke="#9a9a9a" stroke-width=".25"/><circle class="s mfs" cx="${f(cx)}" cy="${f(cy)}" r="${R}"/>`;
      else s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${R}" fill="none" stroke="#9a9a9a" stroke-width=".25"/>`;
    }
    if (opt.angle) { const [a, b, cls] = opt.angle; const xe = px(b - 1, five) + D / 2 + (five && b === 5 ? GAP / 2 : 0), ye = px(a - 1, five) + D / 2 + (five && a === 5 ? GAP / 2 : 0);
      s += `<path class="${cls || ''}" d="M${f(xe)} ${f(PAD * .3)}V${f(ye)}H${f(PAD * .3)}" fill="none" stroke="${cls ? 'var(--solc)' : '#c8102e'}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>`; }
    if (opt.split) { const ys = px(4, five) + D / 2 + (five ? GAP / 2 : 0); s += `<line x1="0" y1="${f(ys)}" x2="${f(W)}" y2="${f(ys)}" stroke="#222" stroke-width=".35" stroke-dasharray="1.2 1"/>`; }
    return `<svg class="mff" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}mm" height="${f(H)}mm">${s}</svg>`;
  }
  const bx = (v, show) => show ? `<b>${v}</b>` : `<span class="mfb"><span class="s">${v}</span></span>`;
  T('malfeld', it => {
    const d = it.data; if (!d) return ''; if (d.error) return err(d);
    const mode = d.mode || 'winkel', five = it.fives !== false;
    const cells = d.tasks.map(t => {
      let fig = '', q = '';
      if (mode === 'punkte') { fig = field(t.a, t.b, () => 'on', { five }); q = `${bx(t.a)} · ${bx(t.b)} = ${bx(t.c)}`; }
      else if (mode === 'winkel') { fig = field(10, 10, (y, x) => y < t.a && x < t.b ? 'on' : 'off', { five, angle: [t.a, t.b] }); q = `${bx(t.a)} · ${bx(t.b)} = ${bx(t.c)}`; }
      else if (mode === 'zeichnen') { fig = field(10, 10, (y, x) => y < t.a && x < t.b ? 'sol' : 'off', { five, angle: [t.a, t.b, 's'] }); q = `${bx(t.a, 1)} · ${bx(t.b, 1)} = ${bx(t.c)}`; }
      else if (mode === 'zerlegen') { fig = field(t.a, t.b, () => 'on', { five, split: t.a > 5 }); const r2 = t.a - 5; q = `${bx(t.a, 1)} · ${bx(t.b, 1)} = <span class="mfz">${bx(5, 1)} · ${bx(t.b, 1)} + ${bx(r2)} · ${bx(t.b, 1)}</span><br><span class="mfz2">= ${bx(5 * t.b)} + ${bx(r2 * t.b)} = ${bx(t.c)}</span>`; }
      const tausch = it.tausch && (mode === 'punkte' || mode === 'winkel') && t.a !== t.b ? `<div class="mfq">${bx(t.b)} · ${bx(t.a)} = ${bx(t.c)}</div>` : '';
      return `<div class="mfc">${fig}<div class="mfq">${q}</div>${tausch}</div>`;
    });
    const n = cols(it.cols, 1, 5);
    return `<div class="mfg" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${cells.join('')}</div>`;
  });

  /* ---------- Anlauttabelle ---------- */
  const two = L => L.length > 1 ? L : L;
  const letterText = (L, show) => { const lo = L.toLowerCase(); return show === 'gross' ? L : show === 'klein' ? lo : `${L} ${lo}`; };
  T('anlaut', (it, ctx) => {
    const d = it.data; if (!d) return ''; if (d.error) return err(d);
    const mode = it.mode || 'tabelle', show = it.show || 'gk', n = cols(it.cols, 3, 8);
    const punkt = mode === 'nachspuren' ? (RD.FONTS[ctx.fC] && RD.FONTS[ctx.fC].punkt) || 'GSPunkt' : '';
    const cells = d.cells.map(c => {
      const lt = esc(letterText(two(c.L), show));
      const long = c.L.length > 1 && show === 'gk' ? ' anlm' : '';
      const letter = mode === 'ergaenzen' ? `<div class="anl anle${long}"><span class="s">${lt}</span></div>` : `<div class="anl${long}"${punkt ? ` style="font-family:${punkt}"` : ''}>${lt}</div>`;
      const pic = c.img ? `<img class="anp" src="${esc(imgSrc('lib:' + c.img))}" alt="">` : `<div class="anp anx" data-nolh>${mode === 'tabelle' ? 'selbst malen' : ''}</div>`;
      const word = it.word !== false && c.w ? `<div class="anw">${mode === 'ergaenzen' ? `<span class="s">${esc(c.w)}</span>` : esc(c.w)}</div>` : '';
      return `<div class="anc">${letter}${pic}${word}</div>`;
    });
    return `<div class="ang" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${cells.join('')}</div>`;
  });

  /* ---------- Schmuckrahmen (Seitenrahmen-Assistent) ----------
     Farbig oder schwarz-weiß (settings.frameCol = 'sw'); Formen gleichmäßig entlang der Kanten, Ecken immer belegt. */
  const svgBox = (W, H, inner) => `<svg viewBox="0 0 ${f(W)} ${f(H)}" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;inset:0;overflow:visible">${inner}</svg>`;
  const EP = (W, H, r, step) => RD.edgePoints(W, H, r, step);
  const GREY = '#5a6070';
  const pal = (s, list) => s && s.frameCol === 'sw' ? [GREY] : list;
  const at = (L, i) => L[i % L.length];
  const rot = (x, y, a, inner) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${inner}</g>`;
  const flower = (c, r = 1) => { let p = ''; for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180; p += `<circle cx="${f(Math.cos(a) * 1.15 * r)}" cy="${f(Math.sin(a) * 1.15 * r)}" r="${f(.85 * r)}" fill="${c}"/>`; } return p + `<circle r="${f(.62 * r)}" fill="#f2c230"/>`; };
  const leaf = c => `<path d="M0 -2.2C1.6 -1.2 1.6 1 0 2.2C-1.6 1 -1.6 -1.2 0 -2.2Z" fill="${c}"/><path d="M0 -1.7V2.6" stroke="#6b4a2a" stroke-width=".22"/>`;
  const flake = c => { let p = ''; for (let k = 0; k < 3; k++) p += `<path d="M0 -2V2M-.55 -1.45L0 -.9L.55 -1.45M-.55 1.45L0 .9L.55 1.45" transform="rotate(${k * 60})" fill="none" stroke="${c}" stroke-width=".3" stroke-linecap="round"/>`; return p; };
  const heart = c => `<path d="M0 1.7C-2.2 .2 -2 -1.6 -.9 -1.7C-.4 -1.75 0 -1.3 0 -1C0 -1.3 .4 -1.75 .9 -1.7C2 -1.6 2.2 .2 0 1.7Z" fill="${c}"/>`;
  const sun = c => { let p = `<circle r="1.05" fill="${c}"/>`; for (let k = 0; k < 8; k++) p += `<path d="M0 -1.5V-2.2" transform="rotate(${k * 45})" stroke="${c}" stroke-width=".35" stroke-linecap="round"/>`; return p; };
  const shapes = (W, H, s, step, r, draw, cols, turn) => { const L = pal(s, cols); return svgBox(W, H, EP(W, H, r, step).map(([x, y], i) => rot(x, y, turn ? turn(i) : 0, draw(at(L, i), i))).join('')); };
  const zig = (x0, y0, x1, y1, a, p) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / p)), ux = (x1 - x0) / L, uy = (y1 - y0) / L; let d = `M${f(x0)} ${f(y0)}`; for (let k = 1; k <= n; k++) { const t = k / n * L, o = (k % 2 ? a : 0); d += `L${f(x0 + ux * t - uy * o)} ${f(y0 + uy * t + ux * o)}`; } return d; };
  const NEW = {
    flowers: { name: 'Blumen', draw: (W, H, s) => shapes(W, H, s, 6.4, 2, c => flower(c), ['#e85d8a', '#7d6bd6', '#ef8a2b', '#3fa0d8']) },
    leaves: { name: 'Herbstblätter', draw: (W, H, s) => shapes(W, H, s, 5.6, 2, c => leaf(c), ['#d9822b', '#c0392b', '#d4a017', '#8e5a2b'], i => (i * 47) % 360) },
    snow: { name: 'Schneeflocken', draw: (W, H, s) => shapes(W, H, s, 5.8, 2, c => flake(c), ['#3a8fd0', '#7fb6e6']) },
    hearts: { name: 'Herzen', draw: (W, H, s) => shapes(W, H, s, 5.6, 1.9, c => heart(c), ['#d63a55', '#ef7d95']) },
    suns: { name: 'Sonnen', draw: (W, H, s) => shapes(W, H, s, 6.6, 2.2, c => sun(c), ['#f0b323', '#ef8a2b']) },
    dotscol: { name: 'Bunte Punkte', draw: (W, H, s) => shapes(W, H, s, 4.4, 1.4, c => `<circle r="1.1" fill="${c}"/>`, ['#e85d8a', '#3fa0d8', '#f0b323', '#5bb56a', '#7d6bd6']) },
    zigzag: { name: 'Zickzack', draw: (W, H, s) => { const c = pal(s, ['#3fa0d8'])[0], r = 1.5, a = 1.6, p = 2.4; return svgBox(W, H, `<path fill="none" stroke="${c}" stroke-width=".5" stroke-linejoin="round" d="${zig(r, r, W - r, r, a, p)} ${zig(W - r, r, W - r, H - r, a, p)} ${zig(W - r, H - r, r, H - r, a, p)} ${zig(r, H - r, r, r, a, p)}"/>`); } },
    abc: { name: 'ABC', draw: (W, H, s) => { const L = pal(s, ['#d63a55', '#3fa0d8', '#e6a100', '#3e9b4f', '#7d6bd6']); const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return svgBox(W, H, `<g font-family="GSRegular, sans-serif" font-size="4.2" text-anchor="middle" dominant-baseline="central">${EP(W, H, 2.2, 6).map(([x, y], i) => `<text x="${f(x)}" y="${f(y)}" fill="${at(L, i)}">${A[i % 26]}</text>`).join('')}</g>`); } },
    numbers: { name: 'Zahlen', draw: (W, H, s) => { const L = pal(s, ['#3e9b4f', '#3fa0d8', '#d63a55', '#e6a100']); return svgBox(W, H, `<g font-family="GSRegular, sans-serif" font-size="4" text-anchor="middle" dominant-baseline="central">${EP(W, H, 2.2, 6).map(([x, y], i) => `<text x="${f(x)}" y="${f(y)}" fill="${at(L, i)}">${i % 10 + 1}</text>`).join('')}</g>`); } },
  };
  Object.entries(NEW).forEach(([k, v]) => { RD.DECO[k] = v.draw; if (!RD.FRAMES.some(x => x[0] === k)) RD.FRAMES.push([k, 'Schmuckrand ' + v.name]); });
  /* Galerie: Gruppen für den Seitenrahmen-Assistenten */
  RD.FRAME_GROUPS = [['Schlicht', ['none', 'thin', 'thick', 'double', 'round', 'dash', 'dots']], ['Schmuckränder', ['deko', 'wave', 'stars', 'dotscol', 'zigzag', 'hearts']], ['Jahreszeiten', ['flowers', 'suns', 'leaves', 'snow']], ['Schule', ['abc', 'numbers']]];

  if (typeof module !== 'undefined' && module.exports) module.exports = RD;
})(typeof window !== 'undefined' ? window : globalThis);
