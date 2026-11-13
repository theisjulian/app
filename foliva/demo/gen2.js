/* Foliva – weitere Aufgabengeneratoren (ab 0.3) · © 2026 theis
   Wie gen.js: deterministisch (seed), jede Aufgabe mit Lösung, bei unerfüllbaren Regeln eine verständliche Meldung. */
(function (root) {
  'use strict';
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen.js') : null);
  const { rng, shuffle } = G;
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const clampN = (v, lo, hi, d) => { v = Math.floor(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const fail = msg => ({ error: msg });
  const P = () => root.FolivaPools || (typeof require !== 'undefined' ? require('./pools3.js') : {});
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const de = (x, dec) => { const s = dec == null ? String(+x.toFixed(6)) : x.toFixed(dec); return s.replace('-', '−').replace('.', ','); };   /* deutsche Schreibweise */
  const sgn = n => n < 0 ? '−' + Math.abs(n) : String(n);
  const par = n => n < 0 ? '(−' + Math.abs(n) + ')' : String(n);
  const uniq = (r, n, make, key = JSON.stringify, tries = 4000) => { const out = [], seen = new Set(); for (let k = 0; k < tries && out.length < n; k++) { const t = make(); if (!t) continue; const kk = key(t); if (seen.has(kk) && k < tries * .8) continue; seen.add(kk); out.push(t); } return out; };

  /* ---------- Zehner- und Zwanzigerfeld ---------- */
  function tenframe(o) {
    const size = +o.size === 20 ? 20 : 10, count = clampN(o.count, 1, 12, 4); const r = rng(o.seed || 1);
    const pool = shuffle(r, Array.from({ length: size + (o.zero ? 1 : 0) }, (_, i) => i + (o.zero ? 0 : 1)));
    const nums = Array.from({ length: count }, (_, i) => pool[i % pool.length]);
    return { size, nums };
  }

  /* ---------- Rechendreieck: außen steht die Summe der beiden angrenzenden Innenfelder ---------- */
  function triangle(o) {
    const range = clampN(o.range, 6, 100000, 20), count = clampN(o.count, 1, 6, 3); const r = rng(o.seed || 1); const lo = o.zero ? 0 : 1;
    if (2 * lo > range) return fail('Zahlenraum zu klein.');
    const tris = uniq(r, count, () => {
      const a = int(r, lo, Math.floor(range / 2)), b = int(r, lo, range - a), c = int(r, lo, Math.min(range - a, range - b));
      const ab = a + b, bc = b + c, ca = c + a; if (Math.max(ab, bc, ca) > range) return null;
      const mode = o.mode === 'gemischt' ? pick(r, ['innen', 'aussen']) : (o.mode || 'innen');
      return { inner: [a, b, c], outer: [ab, bc, ca], mode };
    });
    if (tris.length < count) return fail('Mit diesen Einstellungen lassen sich nicht genug Rechendreiecke bilden.');
    return { tris };
  }

  /* ---------- Rechentabelle (Plus- oder Maltabelle) ---------- */
  function calctable(o) {
    const op = o.op === '·' ? '·' : o.op === '−' ? '−' : '+', rows = clampN(o.rows, 2, 6, 3), cols = clampN(o.cols, 2, 6, 4), range = clampN(o.range, 10, 100000, 20), hidePct = clampN(o.hide, 10, 100, 100);
    const r = rng(o.seed || 1);
    let rh, ch;
    for (let k = 0; k < 500; k++) {
      if (op === '·') { const m = Math.max(2, Math.floor(Math.sqrt(range))); rh = shuffle(r, Array.from({ length: Math.min(10, m) }, (_, i) => i + 1)).slice(0, rows); ch = shuffle(r, Array.from({ length: Math.min(10, Math.max(cols, Math.floor(range / Math.max(...rh)))) }, (_, i) => i + 1)).slice(0, cols); }
      else if (op === '+') { const h = Math.floor(range / 2); rh = shuffle(r, Array.from({ length: h }, (_, i) => i + 1)).slice(0, rows); ch = shuffle(r, Array.from({ length: h }, (_, i) => i + 1)).slice(0, cols); }
      else { rh = shuffle(r, Array.from({ length: range - Math.floor(range / 3) }, (_, i) => i + Math.floor(range / 3) + 1)).slice(0, rows); ch = shuffle(r, Array.from({ length: Math.floor(range / 3) }, (_, i) => i + 1)).slice(0, cols); }
      if (rh.length < rows || ch.length < cols) return fail('Zahlenraum zu klein für so viele Zeilen und Spalten.');
      const cells = rh.map(a => ch.map(b => op === '+' ? a + b : op === '−' ? a - b : a * b));
      if (cells.flat().every(v => v >= 0 && v <= range)) {
        const all = cells.flatMap((row, i) => row.map((v, j) => i + ':' + j));
        const hide = shuffle(r, all).slice(0, Math.max(1, Math.round(all.length * hidePct / 100)));
        return { op, rh, ch, cells, hide };
      }
    }
    return fail('Mit diesen Einstellungen lässt sich keine Rechentabelle bilden. Zahlenraum vergrößern.');
  }

  /* ---------- Rechenkette / Pfeilbild ---------- */
  function chain(o) {
    const range = clampN(o.range, 10, 1000000, 100), steps = clampN(o.steps, 2, 8, 4), count = clampN(o.count, 1, 8, 3);
    const ops = String(o.ops || '+−').split('').filter(c => '+−·:'.includes(c)); if (!ops.length) ops.push('+');
    const r = rng(o.seed || 1); const chains = [];
    for (let c = 0; c < count; c++) {
      let ch = null;
      for (let k = 0; k < 3000 && !ch; k++) {
        let v = int(r, 1, Math.max(2, Math.floor(range / 2))); const start = v; const st = [];
        for (let s = 0; s < steps; s++) {
          const op = pick(r, ops); let n;
          if (op === '+') { n = int(r, 1, Math.max(1, Math.min(range - v, Math.ceil(range / 4)))); if (v + n > range) break; v += n; }
          else if (op === '−') { if (v < 2) break; n = int(r, 1, Math.min(v - 1, Math.ceil(range / 4))); v -= n; }
          else if (op === '·') { n = int(r, 2, 5); if (v * n > range) break; v *= n; }
          else { const ds = [2, 3, 4, 5, 10].filter(d => v % d === 0 && v / d >= 1); if (!ds.length) break; n = pick(r, ds); v /= n; }
          st.push({ op, n, res: v });
        }
        if (st.length === steps) ch = { start, steps: st };
      }
      if (!ch) return fail('Mit diesen Rechenarten lassen sich keine passenden Rechenketten bilden.');
      chains.push(ch);
    }
    return { chains };
  }

  /* ---------- Stellenwerttafel ---------- */
  const PV = ['E', 'Z', 'H', 'T', 'ZT', 'HT', 'M'];
  function placevalue(o) {
    const digits = clampN(o.digits, 2, 7, 3), count = clampN(o.count, 1, 10, 4); const r = rng(o.seed || 1);
    const nums = uniq(r, count, () => int(r, 10 ** (digits - 1), 10 ** digits - 1), x => x);
    return { cols: PV.slice(0, digits).reverse(), rows: nums.map(n => ({ n, d: String(n).split('').map(Number), mode: o.mode === 'gemischt' ? pick(r, ['eintragen', 'ablesen']) : (o.mode || 'eintragen') })) };
  }

  /* ---------- Halbschriftlich rechnen (Schritt für Schritt) ---------- */
  function halbschriftlich(o) {
    const op = o.op || '+', range = clampN(o.range, 20, 1000000, 100), count = clampN(o.count, 1, 12, 4); const r = rng(o.seed || 1);
    const tasks = uniq(r, count, () => {
      if (op === '+') { const a = int(r, 11, range - 11), b = int(r, 11, range - a); if (b % 10 === 0 || a + b > range) return null; const t = b - b % 10, e = b % 10; return { q: `${a} + ${b}`, res: a + b, steps: [`${a} + ${t} = ${a + t}`, `${a + t} + ${e} = ${a + b}`] }; }
      if (op === '−') { const a = int(r, 30, range), b = int(r, 11, a - 1); if (b % 10 === 0) return null; const t = b - b % 10, e = b % 10; return { q: `${a} − ${b}`, res: a - b, steps: [`${a} − ${t} = ${a - t}`, `${a - t} − ${e} = ${a - b}`] }; }
      if (op === '·') { const a = int(r, 11, Math.min(99, Math.floor(range / 2))), b = int(r, 2, 9); if (a % 10 === 0 || a * b > range) return null; const t = a - a % 10, e = a % 10; return { q: `${a} · ${b}`, res: a * b, steps: [`${t} · ${b} = ${t * b}`, `${e} · ${b} = ${e * b}`, `${t * b} + ${e * b} = ${a * b}`] }; }
      const b = int(r, 2, 9), q = int(r, 11, Math.max(12, Math.floor(range / b))); const a = q * b; if (a > range) return null; const big = (Math.floor(q / 10) * 10) * b, rest = a - big; if (!big || !rest) return null;
      return { q: `${a} : ${b}`, res: q, steps: [`${big} : ${b} = ${big / b}`, `${rest} : ${b} = ${rest / b}`, `${big / b} + ${rest / b} = ${q}`] };
    }, t => t.q);
    if (tasks.length < count) return fail('Mit diesen Einstellungen lassen sich nicht genug Aufgaben bilden. Zahlenraum vergrößern.');
    return { tasks };
  }

  /* ---------- Geld (Euro): Beträge zählen oder legen ---------- */
  const MONEY = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
  function money(o) {
    const max = clampN(o.range, 1, 500, 20) * 100, count = clampN(o.count, 1, 8, 4), cents = !!o.cents; const r = rng(o.seed || 1);
    const avail = MONEY.filter(v => v <= max && (cents || v >= 100));
    const tasks = uniq(r, count, () => {
      let total = cents ? int(r, 1, max) : int(r, 1, max / 100) * 100; let rest = total; const items = [];
      for (const v of avail) { while (rest >= v) { /* gelegentlich kleinere Stücke statt des größten nehmen */ if (v > 1 && r() < .25 && items.length < 9) break; items.push(v); rest -= v; } }
      while (rest > 0) { const v = avail.find(x => x <= rest); if (!v) return null; items.push(v); rest -= v; }
      if (items.length > 12) return null;
      return { total, items: items.sort((a, b) => b - a) };
    }, t => t.total);
    if (!tasks.length) return fail('Zahlenraum zu klein.');
    return { tasks, mode: o.mode || 'zaehlen' };
  }
  const euro = c => c % 100 === 0 ? `${c / 100} €` : c < 100 ? `${c} ct` : `${Math.floor(c / 100)},${String(c % 100).padStart(2, '0')} €`;

  /* ---------- Größen umrechnen ---------- */
  const UNITS = {
    laengen: { name: 'Längen', u: [['km', 1000000], ['m', 1000], ['dm', 100], ['cm', 10], ['mm', 1]], gs: ['km', 'm', 'cm', 'mm'] },
    gewichte: { name: 'Gewichte', u: [['t', 1000000], ['kg', 1000], ['g', 1]], gs: ['t', 'kg', 'g'] },
    zeit: { name: 'Zeit', u: [['h', 3600], ['min', 60], ['s', 1]], gs: ['h', 'min', 's'] },
    geld: { name: 'Geld', u: [['€', 100], ['ct', 1]], gs: ['€', 'ct'] },
    hohl: { name: 'Hohlmaße', u: [['l', 1000], ['ml', 1]], gs: ['l', 'ml'] },
  };
  function units(o) {
    const kind = UNITS[o.kind] ? o.kind : 'laengen', U = UNITS[kind], count = clampN(o.count, 1, 20, 8), level = o.level || 'gs'; const r = rng(o.seed || 1);
    const list = (level === 'gs' ? U.u.filter(([n]) => U.gs.includes(n)) : U.u);
    const tasks = uniq(r, count, () => {
      const i = int(r, 0, list.length - 2); const [big, fb] = list[i], [small, fs] = list[i + 1]; const f = fb / fs;
      if (kind === 'zeit' && level === 'sek' && r() < .3) { /* Zeit mit Komma vermeiden: gemischte Angabe */ }
      const style = level === 'gs' ? pick(r, ['ganz', 'ganz', 'gemischt', 'zurueck']) : pick(r, ['komma', 'komma', 'zurueckKomma', 'ganz']);
      if (kind === 'zeit' && /omma/.test(style)) return null;
      if (style === 'ganz') { const a = int(r, 1, f >= 100 ? 9 : 12); return { q: `${a} ${big} = `, a: `${a * f}`, u: small }; }
      if (style === 'zurueck') { const a = int(r, 1, 9); return { q: `${a * f} ${small} = `, a: `${a}`, u: big }; }
      if (style === 'gemischt') { const a = int(r, 1, 9), b = int(r, 1, f - 1); return { q: `${a} ${big} ${b} ${small} = `, a: `${a * f + b}`, u: small }; }
      const steps = f >= 1000 ? 3 : f >= 100 ? 2 : 1; const k = int(r, 1, steps);
      const val = int(r, 1, 9 * 10 ** k) / 10 ** k;
      if (style === 'komma') return { q: `${de(val)} ${big} = `, a: de(Math.round(val * f * 1e6) / 1e6), u: small };
      return { q: `${de(Math.round(val * f * 1e6) / 1e6)} ${small} = `, a: de(val), u: big };
    }, t => t.q);
    if (!tasks.length) return fail('Mit diesen Einstellungen lassen sich keine Aufgaben bilden.');
    return { tasks };
  }

  /* ---------- Geobrett: Figur abzeichnen oder spiegeln ---------- */
  function geoboard(o) {
    const n = clampN(o.n, 4, 9, 5), count = clampN(o.count, 1, 4, 1), mode = o.mode === 'spiegeln' ? 'spiegeln' : 'abzeichnen', corners = clampN(o.corners, 3, 7, 4); const r = rng(o.seed || 1);
    const figs = [];
    for (let f = 0; f < count; f++) {
      let pts = null;
      for (let k = 0; k < 2000 && !pts; k++) {
        const maxX = mode === 'spiegeln' ? Math.floor((n - 1) / 2) : n - 1;
        const set = new Map(); while (set.size < corners) { const x = int(r, 0, maxX), y = int(r, 0, n - 1); set.set(x + ':' + y, [x, y]); }
        let p = [...set.values()]; const cx = p.reduce((s, q) => s + q[0], 0) / p.length, cy = p.reduce((s, q) => s + q[1], 0) / p.length;
        p.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
        /* keine drei Punkte auf einer Linie, Fläche nicht zu klein */
        let area = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; area += x1 * y2 - x2 * y1; }
        if (Math.abs(area) / 2 < Math.max(1.5, n / 2)) continue;
        const col = p.some((q, i) => { const a = p[(i + p.length - 1) % p.length], b = p[(i + 1) % p.length]; return (q[0] - a[0]) * (b[1] - a[1]) === (q[1] - a[1]) * (b[0] - a[0]); });
        if (col) continue;
        pts = p;
      }
      if (!pts) return fail('Es ließ sich keine passende Figur bilden.');
      figs.push({ pts, mirror: mode === 'spiegeln' ? pts.map(([x, y]) => [n - 1 - x, y]) : null });
    }
    return { n, mode, figs };
  }

  /* ---------- Muster (Bandornament) auf Karopapier fortsetzen ---------- */
  function pattern(o) {
    const w = clampN(o.w, 2, 5, 3), h = clampN(o.h, 2, 5, 3), reps = clampN(o.reps, 3, 12, 6), shown = clampN(o.shown, 1, reps - 1, 2), count = clampN(o.count, 1, 4, 2); const r = rng(o.seed || 1);
    const rows = uniq(r, count, () => { const cells = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (r() < .45) cells.push([x, y]); if (cells.length < 2 || cells.length > w * h - 1) return null; return { cells }; }, t => JSON.stringify(t.cells));
    return { w, h, reps, shown, rows };
  }

  /* ---------- Mengen zählen (mit Bildern) ---------- */
  function countpics(o) {
    const range = clampN(o.range, 2, 30, 10), count = clampN(o.count, 1, 9, 6); const r = rng(o.seed || 1);
    const words = Object.keys(P().PICS || {}).filter(w => /^(Apfel|Birne|Banane|Erdbeere|Kirsche|Fußball|Stern|Blume|Hund|Katze|Maus|Fisch|Ente|Biene|Käfer|Schmetterling|Auto|Bus|Pilz|Baum|Ei|Keks|Kerze|Geschenk|Ballon|Würfel|Schnecke|Igel|Frosch|Huhn|Küken|Karotte|Tomate|Zitrone|Stift|Buch|Glocke|Schneeflocke|Sonne|Wolke)$/.test(w));
    const pics = shuffle(r, words.length ? words : ['Apfel']);
    const tasks = Array.from({ length: count }, (_, i) => ({ w: pics[i % pics.length], n: int(r, o.zero ? 0 : 1, range) }));
    return { tasks };
  }

  /* ---------- Brüche ---------- */
  const red = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  function fractions(o) {
    const op = o.op || '+', maxD = clampN(o.maxD, 2, 30, 10), count = clampN(o.count, 1, 20, 8); const r = rng(o.seed || 1);
    const tasks = uniq(r, count, () => {
      const kind = op === 'gemischt' ? pick(r, ['+', '−', '·', ':']) : op;
      if (kind === 'kuerzen') { const d = int(r, 2, maxD), n = int(r, 1, d - 1), k = int(r, 2, 6); const [a, b] = red(n, d); return { kind, a: [n * k, d * k], r: [a, b] }; }
      if (kind === 'erweitern') { const d = int(r, 2, maxD), n = int(r, 1, d - 1), k = int(r, 2, 5); return { kind, a: [n, d], k, r: [n * k, d * k] }; }
      const d1 = int(r, 2, maxD), d2 = o.same ? d1 : int(r, 2, maxD); const n1 = int(r, 1, d1 * (o.improper ? 2 : 1) - 1), n2 = int(r, 1, d2 * (o.improper ? 2 : 1) - 1);
      let rn, rd;
      if (kind === '+') { rn = n1 * d2 + n2 * d1; rd = d1 * d2; }
      else if (kind === '−') { rn = n1 * d2 - n2 * d1; rd = d1 * d2; if (rn <= 0 && !o.negative) return null; }
      else if (kind === '·') { rn = n1 * n2; rd = d1 * d2; }
      else { rn = n1 * d2; rd = d1 * n2; }
      if (lcm(d1, d2) > 60 && (kind === '+' || kind === '−')) return null;
      return { kind, a: [n1, d1], b: [n2, d2], r: red(rn, rd) };
    }, t => JSON.stringify([t.kind, t.a, t.b, t.k]));
    if (tasks.length < count) return fail('Mit diesen Einstellungen lassen sich nicht genug Aufgaben bilden.');
    return { tasks };
  }
  /* Bruchteile darstellen */
  function fracpict(o) {
    const count = clampN(o.count, 1, 12, 6), dens = String(o.dens || '2,3,4,5,6,8,10,12').split(/[ ,;]+/).map(Number).filter(d => d >= 2 && d <= 24); const r = rng(o.seed || 1);
    const tasks = uniq(r, count, () => { const d = pick(r, dens.length ? dens : [4]), n = int(r, 1, d - 1); const shape = o.shape === 'gemischt' ? pick(r, ['kreis', 'rechteck']) : (o.shape || 'kreis'); return { n, d, shape }; }, t => t.n + '/' + t.d + t.shape);
    return { tasks, mode: o.mode || 'ablesen' };
  }

  /* ---------- Lineare Gleichungen (ganzzahlige Lösungen) ---------- */
  const term = (a, v, first) => { if (a === 0) return ''; const abs = Math.abs(a); const c = v ? (abs === 1 ? v : abs + v) : String(abs); return first ? (a < 0 ? '−' + c : c) : (a < 0 ? ' − ' + c : ' + ' + c); };
  const side = parts => { let s = ''; parts.forEach(([a, v]) => { if (!a) return; s += term(a, v, !s); }); return s || '0'; };
  function equation(o) {
    const level = clampN(o.level, 1, 5, 2), range = clampN(o.range, 5, 100, 10), count = clampN(o.count, 1, 16, 6), neg = !!o.negative; const r = rng(o.seed || 1);
    const tasks = uniq(r, count, () => {
      const x = neg ? int(r, -range, range) : int(r, 1, range); if (x === 0) return null;
      const c = () => int(r, 2, 9) * (neg && r() < .3 ? -1 : 1); const k = () => int(r, 1, range) * (neg && r() < .3 ? -1 : 1);
      let L, R;
      if (level === 1) { const b = k(); L = side([[1, 'x'], [b, '']]); R = String(sgn(x + b)); }
      else if (level === 2) { const a = c(); L = side([[a, 'x']]); R = sgn(a * x); }
      else if (level === 3) { const a = c(), b = k(); L = side([[a, 'x'], [b, '']]); R = sgn(a * x + b); }
      else if (level === 4) { const a = c(), cc = c(); if (a === cc) return null; const b = k(); const d = a * x + b - cc * x; L = side([[a, 'x'], [b, '']]); R = side([[cc, 'x'], [d, '']]); }
      else { const a = c(), b = k(), cc = c(); if (a === cc) return null; const d = a * (x + b) - cc * x; L = `${a < 0 ? '−' : ''}${Math.abs(a)}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)})`; R = side([[cc, 'x'], [d, '']]); }
      return { q: `${L} = ${R}`, x };
    }, t => t.q);
    if (tasks.length < count) return fail('Mit diesen Einstellungen lassen sich nicht genug Gleichungen bilden.');
    return { tasks };
  }

  /* ---------- Prozentrechnung ---------- */
  const PCT = [1, 2, 4, 5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 120, 150];
  function percent(o) {
    const count = clampN(o.count, 1, 16, 6), ask = o.ask || 'gemischt'; const r = rng(o.seed || 1);
    const tasks = uniq(r, count, () => {
      const p = pick(r, PCT); const G = int(r, 1, 20) * pick(r, [5, 10, 20, 25, 50, 100]); const W = G * p / 100;
      if (Math.round(W * 100) !== W * 100 || W * 10 % 5 !== 0) return null;
      const a = ask === 'gemischt' ? pick(r, ['W', 'G', 'p']) : ask;
      if (a === 'W') return { q: `${de(p)} % von ${de(G)} = `, a: de(W), u: '' };
      if (a === 'G') return { q: `${de(p)} % sind ${de(W)}. Grundwert = `, a: de(G), u: '' };
      return { q: `${de(W)} von ${de(G)} sind `, a: de(p), u: '%' };
    }, t => t.q);
    return { tasks };
  }

  /* ---------- Rechenpäckchen Sekundarstufe ---------- */
  function sekpacket(o) {
    const kind = o.kind || 'ganz', range = clampN(o.range, 5, 100000, 20), count = clampN(o.count, 1, 30, 10); const r = rng(o.seed || 1);
    const tasks = uniq(r, count, () => {
      if (kind === 'ganz') {
        const op = pick(r, String(o.ops || '+−·:').split('').filter(c => '+−·:'.includes(c)) || ['+']); const a = int(r, -range, range), b = int(r, -range, range); if (!a || !b) return null;
        if (op === '+') return { q: `${sgn(a)} + ${par(b)}`, a: sgn(a + b) }; if (op === '−') return { q: `${sgn(a)} − ${par(b)}`, a: sgn(a - b) };
        const s = Math.max(2, Math.round(Math.sqrt(range))); const x = int(r, -s, s), y = int(r, -s, s); if (!x || !y || Math.abs(y) === 1) return null;
        if (op === '·') return { q: `${sgn(x)} · ${par(y)}`, a: sgn(x * y) }; return { q: `${sgn(x * y)} : ${par(y)}`, a: sgn(x) };
      }
      if (kind === 'dezimal') {
        const op = pick(r, String(o.ops || '+−·:').split('').filter(c => '+−·:'.includes(c)) || ['+']); const dec = clampN(o.dec, 1, 3, 1); const f = 10 ** dec;
        const A = int(r, 1, range * f), B = int(r, 1, range * f);
        if (op === '+') return { q: `${de(A / f, dec)} + ${de(B / f, dec)}`, a: de((A + B) / f) };
        if (op === '−') { if (B > A) return null; return { q: `${de(A / f, dec)} − ${de(B / f, dec)}`, a: de((A - B) / f) }; }
        if (op === '·') { const m = int(r, 2, 9); return { q: `${de(A / f, dec)} · ${m}`, a: de(A * m / f) }; }
        const m = int(r, 2, 9); const q = int(r, 1, range * f); return { q: `${de(q * m / f, dec)} : ${m}`, a: de(q / f) };
      }
      if (kind === 'potenz') {
        const t = pick(r, ['quadrat', 'kubik', 'zehner', 'wurzel', 'zwei']);
        if (t === 'quadrat') { const a = int(r, 2, 20); return { q: `${a}²`, a: String(a * a) }; }
        if (t === 'kubik') { const a = int(r, 2, 10); return { q: `${a}³`, a: String(a ** 3) }; }
        if (t === 'zehner') { const n = int(r, 2, 6); return { q: `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]}`, a: String(10 ** n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }; }
        if (t === 'zwei') { const n = int(r, 2, 10); return { q: `2${n === 10 ? '¹⁰' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[n]}`, a: String(2 ** n) }; }
        const a = int(r, 2, 20); return { q: `√${a * a}`, a: String(a) };
      }
      if (kind === 'runden') {
        const places = [['Zehner', 10], ['Hunderter', 100], ['Tausender', 1000], ['Zehntausender', 10000]].filter(([, p]) => p * 10 <= Math.max(100, range * 10));
        const n = int(r, 11, Math.max(120, range * 10)); const [name, p] = pick(r, places.length ? places : [['Zehner', 10]]); if (n < p) return null;
        return { q: `${n.toLocaleString('de-DE')} auf ${name}`, a: (Math.round(n / p) * p).toLocaleString('de-DE') };
      }
      if (kind === 'klammer') {
        const a = int(r, 2, 12), b = int(r, 2, 12), c = int(r, 2, 9); const t = int(r, 0, 4);
        if (t === 0) return { q: `${a} + ${b} · ${c}`, a: String(a + b * c) };
        if (t === 1) return { q: `(${a} + ${b}) · ${c}`, a: String((a + b) * c) };
        if (t === 2) { if (a * c - b < 0) return null; return { q: `${a} · ${c} − ${b}`, a: String(a * c - b) }; }
        if (t === 3) { if (a - b <= 0) return null; return { q: `${(a - b) * c} : (${a} − ${b})`, a: String(c) }; }
        return { q: `${a * c} : ${c} + ${b} · 2`, a: String(a + b * 2) };
      }
      if (kind === 'terme') {
        const v = pick(r, [['a', 'b'], ['x', 'y'], ['m', 'n']]); const k = () => int(r, -9, 9) || 1;
        const t1 = k(), t2 = k(), t3 = k(), t4 = k(); const s1 = t1 + t3, s2 = t2 + t4;
        const q = side([[t1, v[0]], [t2, v[1]], [t3, v[0]], [t4, v[1]]]); const a = side([[s1, v[0]], [s2, v[1]]]);
        return { q, a };
      }
      return null;
    }, t => t.q);
    if (tasks.length < Math.min(count, 3)) return fail('Mit diesen Einstellungen lassen sich nicht genug Aufgaben bilden.');
    return { tasks };
  }

  /* ---------- Koordinatensystem ---------- */
  function coord(o) {
    const n = clampN(o.n, 4, 12, 8), count = clampN(o.count, 1, 12, 5), quad = o.quad === 4 || o.quad === '4' ? 4 : 1; const r = rng(o.seed || 1);
    const lo = quad === 4 ? -n : 0;
    const pts = uniq(r, count, () => [int(r, lo, n), int(r, lo, n)], p => p.join(':')).map((p, i) => ({ x: p[0], y: p[1], l: String.fromCharCode(65 + i) }));
    return { n, quad, pts, mode: o.mode || 'ablesen' };
  }

  /* ---------- Winkel ---------- */
  function angles(o) {
    const count = clampN(o.count, 1, 9, 4), step = clampN(o.step, 1, 45, 5), max = clampN(o.max, 30, 360, 180); const r = rng(o.seed || 1);
    const tasks = uniq(r, count, () => { const deg = int(r, Math.ceil(10 / step), Math.floor((max - 1) / step)) * step; if (deg <= 0 || deg >= 360) return null; return { deg, rot: o.mode === 'zeichnen' ? 0 : int(r, 0, 11) * 30 }; }, t => t.deg);
    const kind = d => d < 90 ? 'spitzer Winkel' : d === 90 ? 'rechter Winkel' : d < 180 ? 'stumpfer Winkel' : d === 180 ? 'gestreckter Winkel' : 'überstumpfer Winkel';
    tasks.forEach(t => { t.kind = kind(t.deg); });
    return { tasks, mode: o.mode || 'messen' };
  }

  /* ---------- Flächen und Umfang auf Karopapier ---------- */
  function area(o) {
    const size = clampN(o.size, 3, 30, 8), count = clampN(o.count, 1, 6, 3); const r = rng(o.seed || 1);
    const figs = uniq(r, count, () => {
      const W = 7, H = 6; const set = new Set(['3:2']); const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (set.size < size) { const [x, y] = pick(r, [...set]).split(':').map(Number); const [dx, dy] = pick(r, nb); const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) set.add(nx + ':' + ny); }
      const cells = [...set].map(s => s.split(':').map(Number));
      let per = 0; cells.forEach(([x, y]) => nb.forEach(([dx, dy]) => { if (!set.has((x + dx) + ':' + (y + dy))) per++; }));
      /* keine Löcher */
      const minX = Math.min(...cells.map(c => c[0])), minY = Math.min(...cells.map(c => c[1]));
      return { cells: cells.map(([x, y]) => [x - minX, y - minY]), area: cells.length, per };
    }, t => JSON.stringify(t.cells.sort()));
    return { figs };
  }

  /* ---------- Bild-Wort-Aufgaben ---------- */
  function pictureword(o) {
    const r = rng(o.seed || 1); const mode = o.mode || 'anlaut';
    const words = String(o.words || '').split(/[\n,;]+/).map(w => w.trim()).filter(Boolean).slice(0, 30);
    const PICS = P().PICS || {}; const nouns = P().allNouns ? P().allNouns() : [];
    const items = words.map(w => {
      const n = nouns.find(x => x.w === w) || {}; const f = PICS[w] || null; const L = [...w];
      const cand = L.map((c, i) => i).filter(i => i > 0 && /[a-zäöüß]/i.test(L[i])); const k = Math.max(1, Math.round(cand.length * (+o.hidePct || 40) / 100));
      return { w, f, s: n.s || '', a: n.a || '', hide: shuffle(r, cand).slice(0, k).sort((a, b) => a - b) };
    });
    return { items, mode };
  }

  /* ---------- Kreuzworträtsel ---------- */
  function crossword(o) {
    const r = rng(o.seed || 1);
    const entries = String(o.words || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [w, ...c] = l.split('|'); return { w: w.trim(), clue: c.join('|').trim() }; })
      .filter(e => e.w && /^[A-Za-zÄÖÜäöü]+$/.test(e.w) && e.w.length >= 2).slice(0, 20);
    if (entries.length < 2) return fail('Bitte mindestens zwei Wörter eingeben (nur Buchstaben, ohne ß und Leerzeichen).');
    let best = null;
    for (let attempt = 0; attempt < 80; attempt++) {
      const order = shuffle(r, entries).sort((a, b) => b.w.length - a.w.length + (r() - .5) * 2);
      const cells = new Map(); const placed = [];
      const at = (x, y) => cells.get(x + ':' + y);
      const can = (W, x, y, dir) => {
        let cross = 0; const dx = dir === 'h' ? 1 : 0, dy = dir === 'h' ? 0 : 1;
        if (at(x - dx, y - dy) || at(x + dx * W.length, y + dy * W.length)) return -1;
        for (let i = 0; i < W.length; i++) {
          const cx = x + dx * i, cy = y + dy * i, c = at(cx, cy);
          if (c) { if (c.ch !== W[i] || c.dirs.has(dir)) return -1; cross++; }
          else if (at(cx + dy, cy + dx) || at(cx - dy, cy - dx)) return -1;
        }
        return cross;
      };
      const put = (e, W, x, y, dir) => { const dx = dir === 'h' ? 1 : 0, dy = dir === 'h' ? 0 : 1; for (let i = 0; i < W.length; i++) { const k = (x + dx * i) + ':' + (y + dy * i); const c = cells.get(k) || { ch: W[i], dirs: new Set() }; c.dirs.add(dir); cells.set(k, c); } placed.push({ ...e, W, x, y, dir }); };
      const W0 = order[0].w.toUpperCase(); put(order[0], W0, 0, 0, 'h');
      for (const e of order.slice(1)) {
        const W = e.w.toUpperCase(); let opts = [];
        for (const [k, c] of cells) { const [cx, cy] = k.split(':').map(Number); for (let i = 0; i < W.length; i++) { if (W[i] !== c.ch) continue; for (const dir of ['h', 'v']) { if (c.dirs.has(dir)) continue; const x = dir === 'h' ? cx - i : cx, y = dir === 'h' ? cy : cy - i; const s = can(W, x, y, dir); if (s > 0) opts.push({ x, y, dir, s }); } } }
        if (!opts.length) continue; opts = shuffle(r, opts).sort((a, b) => b.s - a.s); const o2 = opts[0]; put(e, W, o2.x, o2.y, o2.dir);
      }
      /* kompakt bevorzugen: alle Wörter untergebracht, dann möglichst niedrig (Blatt im Hochformat, Hinweise daneben) */
      { const ks = [...cells.keys()].map(k => k.split(':').map(Number)); const bw = Math.max(...ks.map(k => k[0])) - Math.min(...ks.map(k => k[0])) + 1, bh = Math.max(...ks.map(k => k[1])) - Math.min(...ks.map(k => k[1])) + 1;
        const score = placed.length * 1000 - bh * 2 - bw - Math.max(0, bw - 18) * 4; if (!best || score > best.score) best = { placed, cells, score }; }
      if (placed.length === entries.length && attempt >= 39) break;
    }
    const xs = [...best.cells.keys()].map(k => +k.split(':')[0]), ys = [...best.cells.keys()].map(k => +k.split(':')[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys), w = Math.max(...xs) - minX + 1, h = Math.max(...ys) - minY + 1;
    const starts = new Map(); let num = 0;
    const pl = best.placed.map(p => ({ ...p, x: p.x - minX, y: p.y - minY })).sort((a, b) => a.y - b.y || a.x - b.x);
    pl.forEach(p => { const k = p.x + ':' + p.y; if (!starts.has(k)) starts.set(k, ++num); p.num = starts.get(k); });
    const grid = []; for (const [k, c] of best.cells) { const [x, y] = k.split(':').map(Number); grid.push({ x: x - minX, y: y - minY, ch: c.ch }); }
    const missing = entries.filter(e => !pl.some(p => p.w === e.w)).map(e => e.w);
    return { w, h, grid, placed: pl.map(p => ({ w: p.w, clue: p.clue, x: p.x, y: p.y, dir: p.dir, num: p.num })), missing, nums: [...starts.entries()].map(([k, n]) => ({ x: +k.split(':')[0], y: +k.split(':')[1], n })) };
  }

  /* ---------- Geheimschrift ---------- */
  function secret(o) {
    const r = rng(o.seed || 1); const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const words = String(o.words || '').split('\n').map(w => w.trim().toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS')).filter(Boolean).slice(0, 12);
    const SYM = ['●', '■', '▲', '★', '◆', '♥', '♣', '♠', '☀', '☁', '☂', '✿', '✚', '◐', '◇', '□', '△', '○', '✦', '❖', '☾', '⚑', '✎', '✂', '☎', '✈'];
    const key = o.code === 'symbole' ? Object.fromEntries(alpha.map((a, i) => [a, shuffle(r, SYM)[0] && SYM[i]])) : o.code === 'verschoben' ? Object.fromEntries(alpha.map((a, i) => [a, alpha[(i + (+o.shift || 3)) % 26]])) : Object.fromEntries(alpha.map((a, i) => [a, String(i + 1)]));
    if (o.code === 'symbole') { const s = shuffle(r, SYM); alpha.forEach((a, i) => { key[a] = s[i]; }); }
    return { key, items: words.map(w => ({ w, enc: [...w].map(c => key[c] || c) })) };
  }

  /* ---------- Konjugation (Präsens) ---------- */
  const CONJ = (() => {
    const PR = { de: ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'], en: ['I', 'you', 'he/she/it', 'we', 'you', 'they'], it: ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'], fr: ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'], es: ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas'] };
    const T = s => Object.fromEntries(s.trim().split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [v, f] = l.split(':'); return [v.trim(), f.trim().split(/\s+/)]; }));
    const IRR = {
      de: T(`sein: bin bist ist sind seid sind
        haben: habe hast hat haben habt haben
        werden: werde wirst wird werden werdet werden
        wissen: weiß weißt weiß wissen wisst wissen
        können: kann kannst kann können könnt können
        müssen: muss musst muss müssen müsst müssen
        wollen: will willst will wollen wollt wollen
        dürfen: darf darfst darf dürfen dürft dürfen
        sollen: soll sollst soll sollen sollt sollen
        mögen: mag magst mag mögen mögt mögen
        tun: tue tust tut tun tut tun`),
      it: T(`essere: sono sei è siamo siete sono
        avere: ho hai ha abbiamo avete hanno
        fare: faccio fai fa facciamo fate fanno
        andare: vado vai va andiamo andate vanno
        venire: vengo vieni viene veniamo venite vengono
        stare: sto stai sta stiamo state stanno
        dare: do dai dà diamo date danno
        dire: dico dici dice diciamo dite dicono
        uscire: esco esci esce usciamo uscite escono
        potere: posso puoi può possiamo potete possono
        volere: voglio vuoi vuole vogliamo volete vogliono
        dovere: devo devi deve dobbiamo dovete devono
        sapere: so sai sa sappiamo sapete sanno
        bere: bevo bevi beve beviamo bevete bevono
        rimanere: rimango rimani rimane rimaniamo rimanete rimangono
        tenere: tengo tieni tiene teniamo tenete tengono
        scegliere: scelgo scegli sceglie scegliamo scegliete scelgono
        salire: salgo sali sale saliamo salite salgono`),
      fr: T(`être: suis es est sommes êtes sont
        avoir: ai as a avons avez ont
        aller: vais vas va allons allez vont
        faire: fais fais fait faisons faites font
        prendre: prends prends prend prenons prenez prennent
        venir: viens viens vient venons venez viennent
        pouvoir: peux peux peut pouvons pouvez peuvent
        vouloir: veux veux veut voulons voulez veulent
        devoir: dois dois doit devons devez doivent
        savoir: sais sais sait savons savez savent
        dire: dis dis dit disons dites disent
        mettre: mets mets met mettons mettez mettent
        partir: pars pars part partons partez partent
        sortir: sors sors sort sortons sortez sortent
        dormir: dors dors dort dormons dormez dorment
        lire: lis lis lit lisons lisez lisent
        écrire: écris écris écrit écrivons écrivez écrivent
        voir: vois vois voit voyons voyez voient
        boire: bois bois boit buvons buvez boivent
        connaître: connais connais connaît connaissons connaissez connaissent
        manger: mange manges mange mangeons mangez mangent
        commencer: commence commences commence commençons commencez commencent`),
      es: T(`ser: soy eres es somos sois son
        estar: estoy estás está estamos estáis están
        tener: tengo tienes tiene tenemos tenéis tienen
        ir: voy vas va vamos vais van
        hacer: hago haces hace hacemos hacéis hacen
        poder: puedo puedes puede podemos podéis pueden
        querer: quiero quieres quiere queremos queréis quieren
        venir: vengo vienes viene venimos venís vienen
        decir: digo dices dice decimos decís dicen
        salir: salgo sales sale salimos salís salen
        poner: pongo pones pone ponemos ponéis ponen
        dormir: duermo duermes duerme dormimos dormís duermen
        jugar: juego juegas juega jugamos jugáis juegan
        pedir: pido pides pide pedimos pedís piden
        saber: sé sabes sabe sabemos sabéis saben
        dar: doy das da damos dais dan
        ver: veo ves ve vemos veis ven
        conocer: conozco conoces conoce conocemos conocéis conocen
        empezar: empiezo empiezas empieza empezamos empezáis empiezan
        pensar: pienso piensas piensa pensamos pensáis piensan
        volver: vuelvo vuelves vuelve volvemos volvéis vuelven`),
      en: T(`be: am are is are are are
        have: have have has have have have
        can: can can can can can can
        must: must must must must must must`),
    };
    /* starke deutsche Verben: du-Form | er-Form */
    const DE_STRONG = T(`fahren: fährst fährt
      laufen: läufst läuft
      lesen: liest liest
      sehen: siehst sieht
      essen: isst isst
      geben: gibst gibt
      nehmen: nimmst nimmt
      sprechen: sprichst spricht
      schlafen: schläfst schläft
      helfen: hilfst hilft
      tragen: trägst trägt
      werfen: wirfst wirft
      treffen: triffst trifft
      vergessen: vergisst vergisst
      waschen: wäschst wäscht
      halten: hältst hält
      fallen: fällst fällt
      fangen: fängst fängt
      wachsen: wächst wächst
      schlagen: schlägst schlägt
      stehlen: stiehlst stiehlt
      messen: misst misst
      sterben: stirbst stirbt
      brechen: brichst bricht
      treten: trittst tritt
      raten: rätst rät
      lassen: lässt lässt`);
    const DE_E = new Set(['rechnen', 'atmen', 'öffnen', 'zeichnen', 'regnen', 'trocknen']);
    const REG = {
      de: 'spielen malen lachen kaufen bauen lernen machen hören kochen tanzen wohnen zeigen suchen holen putzen turnen rechnen basteln klettern hüpfen reisen warten arbeiten sagen fragen antworten erzählen besuchen gehen kommen schreiben singen springen trinken finden schwimmen fliegen rufen bleiben sitzen stehen fahren laufen lesen sehen essen geben nehmen sprechen schlafen helfen tragen werfen treffen waschen halten fallen fangen sein haben werden wissen können müssen wollen dürfen sollen mögen tun',
      it: 'parlare abitare ascoltare cantare guardare lavorare comprare studiare mangiare giocare pagare cominciare arrivare tornare aspettare chiamare prendere leggere scrivere vedere vivere correre mettere chiedere rispondere credere dormire partire sentire aprire offrire finire capire preferire pulire spedire essere avere fare andare venire stare dare dire uscire potere volere dovere sapere bere rimanere tenere scegliere salire',
      fr: 'parler aimer habiter jouer regarder écouter chanter danser travailler manger commencer chercher trouver donner porter arriver entrer rester finir choisir réussir vendre attendre répondre entendre être avoir aller faire prendre venir pouvoir vouloir devoir savoir dire mettre partir sortir dormir lire écrire voir boire connaître',
      es: 'hablar trabajar estudiar escuchar cantar bailar comprar tomar llegar mirar comer beber leer aprender correr vender vivir escribir abrir subir decidir ser estar tener ir hacer poder querer venir decir salir poner dormir jugar pedir saber dar ver conocer empezar pensar volver',
      en: 'play like live work read write swim run eat drink go do watch wash fly study cry carry try listen help walk jump sing dance cook be have can must',
    };
    function de_(v) {
      if (IRR.de[v]) return IRR.de[v];
      const stem = /[lr]n$/.test(v) && /e[lr]n$/.test(v) ? v.slice(0, -1) : v.slice(0, -2);
      const el = /e[lr]n$/.test(v); const eIns = /[td]$/.test(stem) || DE_E.has(v); const sS = /(s|ß|z|x)$/.test(stem);
      const st = DE_STRONG[v];
      const ich = el && /eln$/.test(v) ? stem.slice(0, -2) + 'le' : el ? stem + 'e' : stem + 'e';
      const du = st ? st[0] : el ? stem + 'st' : eIns ? stem + 'est' : sS ? stem + 't' : stem + 'st';
      const er = st ? st[1] : el ? stem + 't' : eIns ? stem + 'et' : stem + 't';
      const ihr = el ? stem + 't' : eIns ? stem + 'et' : stem + 't';
      return [ich, du, er, v, ihr, v];
    }
    function it_(v) {
      if (IRR.it[v]) return IRR.it[v];
      const end = v.slice(-3), st = v.slice(0, -3);
      if (end === 'are') {
        if (/[cg]$/.test(st)) return [st + 'o', st + 'hi', st + 'a', st + 'hiamo', st + 'ate', st + 'ano'];
        if (/i$/.test(st)) { const s2 = st.slice(0, -1); return [st + 'o', s2 + 'i', st + 'a', s2 + 'iamo', st + 'ate', st + 'ano']; }
        return [st + 'o', st + 'i', st + 'a', st + 'iamo', st + 'ate', st + 'ano'];
      }
      if (end === 'ere') return [st + 'o', st + 'i', st + 'e', st + 'iamo', st + 'ete', st + 'ono'];
      if (['finire', 'capire', 'preferire', 'pulire', 'spedire'].includes(v)) return [st + 'isco', st + 'isci', st + 'isce', st + 'iamo', st + 'ite', st + 'iscono'];
      return [st + 'o', st + 'i', st + 'e', st + 'iamo', st + 'ite', st + 'ono'];
    }
    function fr_(v) {
      if (IRR.fr[v]) return IRR.fr[v];
      const end = v.slice(-2), st = v.slice(0, -2);
      if (end === 'er') return [st + 'e', st + 'es', st + 'e', st + 'ons', st + 'ez', st + 'ent'];
      if (end === 'ir') return [st + 'is', st + 'is', st + 'it', st + 'issons', st + 'issez', st + 'issent'];
      return [st + 's', st + 's', st, st + 'ons', st + 'ez', st + 'ent'];
    }
    function es_(v) {
      if (IRR.es[v]) return IRR.es[v];
      const end = v.slice(-2), st = v.slice(0, -2);
      if (end === 'ar') return [st + 'o', st + 'as', st + 'a', st + 'amos', st + 'áis', st + 'an'];
      if (end === 'er') return [st + 'o', st + 'es', st + 'e', st + 'emos', st + 'éis', st + 'en'];
      return [st + 'o', st + 'es', st + 'e', st + 'imos', st + 'ís', st + 'en'];
    }
    function en_(v) {
      if (IRR.en[v]) return IRR.en[v];
      const s3 = /(s|sh|ch|x|o)$/.test(v) ? v + 'es' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ies' : v + 's';
      return [v, v, s3, v, v, v];
    }
    const F = { de: de_, it: it_, fr: fr_, es: es_, en: en_ };
    /* Pronomen mit Elision (frz. j') */
    const pron = (lang, i, form) => lang === 'fr' && i === 0 && /^[aeiouéèêhâ]/i.test(form) && !/^h(a|o)(ï|ch|r|u)/.test(form) ? "j'" : PR[lang][i];
    return { forms: (lang, v) => (F[lang] || F.de)(v), PR, REG, pron, IRR };
  })();
  function conj(o) {
    const lang = CONJ.PR[o.lang] ? o.lang : 'de'; const r = rng(o.seed || 1);
    const verbs = String(o.verbs || '').split(/[\n,;]+/).map(v => v.trim()).filter(Boolean).slice(0, 8);
    if (!verbs.length) return fail('Bitte mindestens ein Verb eingeben.');
    const blanks = o.blanks || 'alle';
    const tables = verbs.map(v => { const f = CONJ.forms(lang, v); const hide = blanks === 'alle' ? [0, 1, 2, 3, 4, 5] : shuffle(r, [0, 1, 2, 3, 4, 5]).slice(0, clampN(o.n, 1, 6, 3)); return { v, f, hide, pron: f.map((x, i) => CONJ.pron(lang, i, x)) }; });
    return { lang, tables };
  }

  /* ---------- Wörter alphabetisch ordnen ---------- */
  function abc(o) {
    const r = rng(o.seed || 1); const words = String(o.words || '').split(/[\n,;]+/).map(w => w.trim()).filter(Boolean).slice(0, 16);
    const sorted = words.slice().sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
    const shown = shuffle(r, words); return { shown, rank: shown.map(w => sorted.indexOf(w) + 1) };
  }

  /* ---------- Richtig oder falsch: Reihenfolge mischen ---------- */
  function truefalse(o) { const r = rng(o.seed || 1); const n = (o.items || []).length; return { order: o.shuffle ? shuffle(r, Array.from({ length: n }, (_, i) => i)) : Array.from({ length: n }, (_, i) => i) }; }
  /* Zeitleiste/Mindmap/Beschriften: welche Felder leer bleiben */
  function blanksOf(o, n) { const r = rng(o.seed || 1); const k = o.blankMode === 'alle' ? n : o.blankMode === 'keine' ? 0 : Math.max(1, Math.round(n * (+o.blankPct || 50) / 100)); return { hide: shuffle(r, Array.from({ length: n }, (_, i) => i)).slice(0, k).sort((a, b) => a - b) }; }
  const timeline = o => blanksOf(o, (o.events || []).filter(e => String(e.l || '').trim() || String(e.r || '').trim()).length);
  const mindmap = o => blanksOf(o, String(o.btext || '').split('\n').map(b => b.trim()).filter(Boolean).length);
  const label = o => blanksOf(o, (o.labels || []).filter(l => String(l.t || '').trim()).length);

  /* ---------- Wortarten: Sätze mit Markierung [N:…] [V:…] [A:…] ---------- */
  function wordtypes(o) { return { lines: String(o.text || '').split('\n').map(l => l.trim()).filter(Boolean) }; }

  /* ---------- Inhalte aus Sammlungen ---------- */
  const pickN = (r, arr, n) => shuffle(r, arr).slice(0, Math.max(0, Math.min(arr.length, n)));
  const themeNouns = key => { const p = P(); const t = p.NOUNS[key]; return G.byLevel(t ? t.list : p.allNouns(), 'NOUNS', G.level()); };
  const LETTERS = /^[A-Za-zÄÖÜäöüß]+$/;
  Object.assign(G.FILL, {
    pictureword(it, r) { const pw = P().PICS || {}; const list = themeNouns(it.theme).filter(x => pw[x.w] && (it.mode !== 'silben' || x.s) && x.w.length <= (+it.maxLen || 12)); it.words = pickN(r, list.length ? list : Object.keys(pw).map(w => ({ w })), clampN(it.n, 1, 16, 6)).map(x => x.w).join('\n'); },
    crossword(it, r) {
      const n = clampN(it.n, 3, 15, 7); const p = P();
      if (it.source === 'bilder') it.words = pickN(r, themeNouns(it.theme).filter(x => p.PICS[x.w] && /^[A-Za-zÄÖÜäöü]+$/.test(x.w) && x.w.length <= 10), n).map(x => `${x.w}|img:${p.PICS[x.w]}`).join('\n');
      else if (it.source === 'vokabeln') { const L = p.VOCAB[it.lang] || p.VOCAB.en; const th = L.themes[it.vtheme] || Object.values(L.themes)[0]; it.words = pickN(r, th.list.filter(x => /^[A-Za-zÀ-ÿ]+$/.test(x.r.replace(/^(the|to|il|la|lo|le|gli|i|l'|el|los|las|un|une|les)\s+/i, ''))), n).map(x => `${x.r.replace(/^(the|to|il|la|lo|le|gli|i|l'|el|los|las|un|une|les)\s+/i, '').replace(/^l'/, '')}|${x.l}`).join('\n'); }
      else if (it.source === 'raetsel') { const CL = p.CLUES || {}; let L = themeNouns(it.theme).filter(x => CL[x.w] && LETTERS.test(x.w) && x.w.length <= 12); if (L.length < 3) L = p.allNouns().filter(x => CL[x.w] && LETTERS.test(x.w) && x.w.length <= 12); it.words = pickN(r, L, n).map(x => `${x.w}|${CL[x.w]}`).join('\n'); }
      else if (it.source === 'artikel') it.words = pickN(r, themeNouns(it.theme).filter(x => /^[A-Za-zÄÖÜäöü]+$/.test(x.w) && x.w.length <= 10 && x.p && x.p !== '-' && /^[A-Za-zÄÖÜäöü]+$/.test(x.p)), n).map(x => `${x.p}|Mehrzahl von „${x.a} ${x.w}“`).join('\n');
    },
    sachtext(it, r) {
      const all = P().SACHTEXTE || []; const lv = it.stufe === '12' || it.stufe === '34' ? it.stufe : '';
      let L = all.filter(x => (!lv || x.stufe === lv) && (!it.stheme || it.stheme === 'alle' || x.theme === it.stheme)); if (!L.length) L = all.filter(x => !lv || x.stufe === lv); if (!L.length) L = all;
      const other = L.filter(x => x.id !== it.sid); const x = pick(r, other.length ? other : L); if (!x) return;
      it.sid = x.id; it.text = `**${x.title}**\n${x.text}`; it.questions = x.q;
    },
    wordtypes(it, r) { it.text = pickN(r, P().TAGGED, clampN(it.n, 1, 12, 5)).join('\n'); },
    secret(it, r) { it.words = pickN(r, themeNouns(it.theme).filter(x => x.w.length <= 9 && LETTERS.test(x.w)), clampN(it.n, 1, 10, 4)).map(x => x.w).join('\n'); },
    abc(it, r) { const list = themeNouns(it.theme); let pick2 = pickN(r, list, clampN(it.n, 3, 16, 6)).map(x => x.w); if (it.same) { const first = pick2[0] ? pick2[0][0] : 'B'; const same = list.filter(x => x.w[0] === first).map(x => x.w); if (same.length >= 3) pick2 = pickN(r, same, clampN(it.n, 3, 16, 6)); } it.words = pick2.join('\n'); },
    wordlist(it, r) { it.words = pickN(r, themeNouns(it.theme), clampN(it.n, 3, 20, 8)).map(x => it.article ? `${x.a} ${x.w}` : x.w).join('\n'); },
    conj(it, r) { const L = CONJ.REG[it.lang] ? CONJ.REG[it.lang].split(' ') : CONJ.REG.de.split(' '); it.verbs = pickN(r, L, clampN(it.nv, 1, 6, 2)).join('\n'); },
    truefalse(it, r) {
      const n = clampN(it.n, 2, 12, 6), p = P();
      if (it.source === 'sachwissen') { const T = p.TF || {}; const th = T[it.tftheme] || T[Object.keys(T)[0]] || { list: [] };
        /* höchstens eine Aussage je Satzanfang, damit nicht „Der Pinguin kann fliegen“ und „…nicht fliegen“ nebeneinanderstehen */
        const want = Math.max(1, Math.min(n - 1, Math.round(n / 2 + (r() - .5) * 2))); const seen = new Set(), out = []; const key = x => x.t.split(' ').slice(0, 3).join(' ');
        const take = (list, k) => { for (const x of list) { if (out.length >= n || k <= 0) break; if (seen.has(key(x))) continue; seen.add(key(x)); out.push({ t: x.t, ok: x.ok }); k--; } };
        take(shuffle(r, th.list.filter(x => x.ok)), want); take(shuffle(r, th.list.filter(x => !x.ok)), n - out.length); take(shuffle(r, th.list), n - out.length);
        it.items = shuffle(r, out); return; }
      if (it.source === 'rechnen') { const res = G.packet({ op: it.mop || '+', range: it.range || 20, count: n * 2, transition: 'mixed', seed: Math.floor(r() * 1e9) + 1 }); if (res.error) return;
        const seen = new Set(), out = []; for (const t of res.tasks) { const key = t.a + t.op + t.b; if (seen.has(key)) continue; seen.add(key); const ok = r() < .5; let c = t.c; if (!ok) { const d = shuffle(r, [1, 2, 10, -1, -2, -10]).find(d => c + d >= 0); c += d; } out.push({ t: `${t.a} ${t.op} ${t.b} = ${c}${t.rest ? ` R ${t.rest}` : ''}`, ok }); if (out.length >= n) break; } it.items = out; return; }
      if (it.source === 'artikel') { const AMB = new Set(['Joghurt', 'Paprika', 'Triangel', 'Keks', 'Radiergummi', 'Ostern', 'Weihnachten', 'Eltern', 'Kräuter']);
        it.items = pickN(r, themeNouns(it.theme).filter(x => /^(der|die|das)$/.test(x.a) && !AMB.has(x.w)), n).map(x => { const ok = r() < .5; return { t: `${ok ? x.a : pick(r, ['der', 'die', 'das'].filter(a => a !== x.a))} ${x.w}`, ok }; }); return; }
      const ADJ = p.ADJ || []; if (it.source === 'steigerung') it.items = pickN(r, ADJ, clampN(it.n, 2, 12, 6)).map(a => { const ok = r() < .5; return ok ? { t: `${a.g} – ${a.k} – ${a.s}`, ok: true } : { t: `${a.g} – ${a.g}er – am ${a.g}sten`, ok: a.k === a.g + 'er' && a.s === 'am ' + a.g + 'sten' }; }); },
  });

  /* Zuordnen: Bild – Wort */
  const oldMatch = G.FILL.match;
  G.FILL.match = (it, r) => { if (it.source === 'raetsel') { const p = P(), CL = p.CLUES || {}; let L = themeNouns(it.theme).filter(x => CL[x.w]); if (L.length < 2) L = p.allNouns().filter(x => CL[x.w]); it.pairs = pickN(r, L, clampN(it.n, 2, 12, 5)).map(x => ({ l: CL[x.w], r: `${x.a} ${x.w}` })); if (!(+it.rowH >= 15)) it.rowH = 15; return; }
    if (it.source === 'bildwort') { const p = P(); it.pairs = pickN(r, themeNouns(it.theme).filter(x => p.PICS[x.w]), clampN(it.n, 2, 12, 5)).map(x => ({ l: 'img:' + p.PICS[x.w], r: x.w })); if (!it.pairs.length) it.pairs = pickN(r, Object.entries(p.PICS), 5).map(([w, f]) => ({ l: 'img:' + f, r: w })); } else oldMatch(it, r); };
  const API = { tenframe, triangle, calctable, chain, placevalue, halbschriftlich, money, euro, MONEY, units, UNITS, geoboard, pattern, countpics, fractions, fracpict, red, gcd, equation, percent, sekpacket, coord, angles, area, pictureword, crossword, secret, conj, CONJ, abc, truefalse, timeline, mindmap, label, wordtypes, de };
  Object.assign(G, API);
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
