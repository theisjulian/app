/* Foliva – Aufgabengeneratoren ab 0.9.9 · © 2026 theis
   Mehr Aufgabenmöglichkeiten für die Grundschul-Mathematik: Ergänzen, Verdoppeln/Halbieren, Rechnen mit Zehner- und
   Hunderterzahlen, Malmauern, Vergleichen mit Termen und Größen, Zahlen am Zahlenstrahl markieren, Uhrzeiten am Tag und
   am Abend, gemischte Rechendreiecke, Rückgeld, Zahlen zerlegen, Rechenstrategien, zweischrittige Sachaufgaben.
   Bisherige Einstellungen erzeugen genau dieselben Aufgaben wie vorher. Alles deterministisch über „seed“. */
(function (root) {
  'use strict';
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen3.js') : null);
  const { rng, shuffle } = G;
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const clampN = (v, lo, hi, d) => { v = Math.floor(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const fail = msg => ({ error: msg, tasks: [] });
  const P = () => root.FolivaPools || (typeof require !== 'undefined' ? require('./pools3.js') : {});

  /* ---------- Rechenpäckchen: Ergänzen, Verdoppeln/Halbieren, Zehner- und Hunderterzahlen ---------- */
  const basePacket = G.packet;
  function packet(o) {
    const form = o.pform || 'zufall';
    if (form === 'ergaenzen') return ergaenzen(o);
    if (form === 'verdoppeln' || form === 'halbieren' || form === 'dophalb') return doppelt(o);
    const u = +o.unit === 10 || +o.unit === 100 ? +o.unit : 1;
    if (u === 1 || form !== 'zufall') return basePacket(o);
    const range = clampN(o.range, 5, 1000000, 100);
    if (range / u < 2) return fail(`Für ${u === 10 ? 'Zehnerzahlen' : 'Hunderterzahlen'} ist der Zahlenraum zu klein (mindestens bis ${2 * u}).`);
    if (o.op === '·' || o.op === ':' || o.op === '·:') {
      /* Malnehmen und Teilen mit Zehner-/Hunderterzahlen: 3 · 40 = 120, 120 : 4 = 30 – ohne · 1 und : 1 */
      const r = rng(o.seed || 1), count = clampN(o.count, 1, 40, 8), miss = o.missing || 'ergebnis'; const tasks = [], seen = new Set();
      for (let i = 0; i < count; i++) {
        let t = null;
        for (let k = 0; k < 600 && !t; k++) {
          const op = o.op === '·:' ? pick(r, ['·', ':']) : o.op; const f = int(r, 2, 9), g = int(r, 1, 9) * u; if (f * g > range) continue;
          const m = miss === 'gemischt' ? pick(r, ['a', 'b', 'c']) : miss === 'erste' ? 'a' : miss === 'zweite' ? 'b' : 'c';
          const c = op === '·' ? (r() < .5 ? { a: f, op, b: g, c: f * g } : { a: g, op, b: f, c: f * g }) : { a: f * g, op, b: f, c: g };
          const key = c.a + op + c.b; if (seen.has(key) && k < 500) continue; seen.add(key); t = { ...c, rest: 0, miss: m };
        }
        if (!t) return fail('Mit diesen Einstellungen lassen sich nicht genug Aufgaben bilden. Bitte den Zahlenraum vergrößern.');
        tasks.push(t);
      }
      return { tasks };
    }
    const res = basePacket({ ...o, range: Math.floor(range / u), rest: false });
    if (res.error) return fail(o.transition === 'required' ? `Mit ${u === 10 ? 'Zehnerzahlen' : 'Hunderterzahlen'} bis ${range} gibt es kaum Übergänge – bitte den Zahlenraum vergrößern oder „Übergang: gemischt“ wählen.` : res.error);
    const r = rng((o.seed || 1) * 31 + 7);
    res.tasks = res.tasks.map(t => {
      if (t.op === '+' || t.op === '−') return { ...t, a: t.a * u, b: t.b * u, c: t.c * u };
      if (t.op === '·') return r() < .5 ? { ...t, a: t.a * u, c: t.c * u } : { ...t, b: t.b * u, c: t.c * u };
      return { ...t, a: t.a * u, c: t.c * u };
    });
    return res;
  }
  /* Ergänzen: bis zur Zielzahl (z. B. 10, 20, 100), bis zum nächsten Zehner oder Hunderter */
  function ergaenzen(o) {
    const range = clampN(o.range, 5, 1000000, 20), count = clampN(o.count, 1, 40, 8), r = rng(o.seed || 1), art = o.eart || 'ziel';
    const target = art === 'ziel' ? clampN(o.target || range, 2, 1000000, range) : 0;
    const ops = o.op === '−' ? ['−'] : o.op === '+−' ? ['+', '−'] : ['+'];
    const tasks = [], seen = new Set();
    for (let i = 0; i < count; i++) {
      let t = null;
      for (let k = 0; k < 400 && !t; k++) {
        let a, T;
        const step = art === 'zehner' ? 10 : art === 'hunderter' ? 100 : 0; const op = pick(r, ops);
        if (art === 'hunderter' && range < 101) return fail('Zum Hunderter: Zahlenraum mindestens bis 1000 wählen.');
        if (step) {
          /* Plus: bis zum nächsten Zehner/Hunderter ergänzen (27 + _ = 30). Minus: bis zum Zehner/Hunderter zurück (47 − _ = 40). */
          a = int(r, step === 100 ? 101 : 11, Math.max(12, range - 1)); if (a % step === 0) continue;
          T = op === '+' ? Math.ceil(a / step) * step : Math.floor(a / step) * step; if (T > range || T <= 0) continue;
        } else { T = target; a = int(r, o.zero ? 0 : 1, T - 1); }
        const b = Math.abs(T - a); if (b <= 0) continue;
        const key = op + a + '/' + T;
        if (seen.has(key) && k < 300) continue; seen.add(key);
        t = op === '+' ? { a, op: '+', b, c: T, rest: 0, miss: 'b' } : step ? { a, op: '−', b, c: T, rest: 0, miss: 'b' } : { a: T, op: '−', b, c: a, rest: 0, miss: 'b' };
      }
      if (!t) return fail('Mit diesen Einstellungen lassen sich nicht genug Aufgaben zum Ergänzen bilden.');
      tasks.push(t);
    }
    return { tasks };
  }
  /* Verdoppeln (7 + 7) und Halbieren (14 : 2) */
  function doppelt(o) {
    const range = clampN(o.range, 4, 1000000, 20), count = clampN(o.count, 1, 40, 8), r = rng(o.seed || 1); const form = o.pform;
    const maxN = Math.floor(range / 2); if (maxN < 1) return fail('Zahlenraum zu klein.');
    const nums = shuffle(r, Array.from({ length: maxN }, (_, i) => i + 1)); const tasks = [];
    for (let i = 0; i < count; i++) {
      const n = nums[i % nums.length]; const kind = form === 'dophalb' ? (r() < .5 ? 'v' : 'h') : form === 'verdoppeln' ? 'v' : 'h';
      tasks.push(kind === 'v' ? { a: n, op: '+', b: n, c: 2 * n, rest: 0, miss: 'c' } : { a: 2 * n, op: ':', b: 2, c: n, rest: 0, miss: 'c' });
    }
    return { tasks };
  }

  /* ---------- Zahlenmauer: auch als Malmauer ---------- */
  const baseWall = G.wall;
  function wall(o) {
    if (o.wop !== '·') return baseWall(o);
    const levels = clampN(o.levels, 2, 5, 3), count = clampN(o.count, 1, 8, 2), range = clampN(o.range, 4, 100000, 100), mode = o.mode || 'unten'; const r = rng(o.seed || 1); const walls = [];
    for (let w = 0; w < count; w++) {
      let rowsV = null;
      for (let tries = 0; tries < 3000 && !rowsV; tries++) {
        const maxB = levels >= 5 ? 2 : levels === 4 ? 3 : levels === 3 ? 5 : 10;
        const base = Array.from({ length: levels }, () => int(r, 1, maxB));
        if (base.filter(v => v === 1).length > (levels >= 4 ? 2 : 1)) continue;
        const rs = [base]; while (rs[rs.length - 1].length > 1) { const p = rs[rs.length - 1]; rs.push(p.slice(1).map((v, i) => p[i] * v)); }
        const top = rs[rs.length - 1][0]; if (top > range || top < Math.min(range, 6)) continue;
        rowsV = rs;
      }
      if (!rowsV) return fail('Mit diesen Einstellungen lassen sich keine Malmauern bilden. Zahlenraum vergrößern (z. B. bis 100 oder 1000).');
      const shown = rowsV.map(row => row.map(() => false));
      const variant = mode === 'gemischt' ? pick(r, ['links', 'rechts', 'spitze']) : mode;
      if (variant === 'unten') shown[0].fill(true);
      else if (variant === 'links') rowsV.forEach((row, i) => { shown[i][0] = true; });
      else if (variant === 'rechts') rowsV.forEach((row, i) => { shown[i][row.length - 1] = true; });
      else { shown[0].fill(true); const hide = int(r, 0, levels - 1); shown[0][hide] = false; shown[levels - 1][0] = true; }
      walls.push({ rows: rowsV, shown });
    }
    return { walls, op: '·' };
  }

  /* ---------- Vergleichen: Terme mit allen Rechenarten, Terme auf beiden Seiten, Größen ---------- */
  const baseCompare = G.compare;
  const termOf = (r, op, range) => {
    for (let k = 0; k < 200; k++) {
      if (op === '+') { const a = int(r, 0, Math.floor(range / 2)), b = int(r, 0, Math.floor(range / 2)); if (a + b <= range) return { s: `${a} + ${b}`, v: a + b }; }
      else if (op === '−') { const a = int(r, 1, range), b = int(r, 0, a); return { s: `${a} − ${b}`, v: a - b }; }
      else if (op === '·') { const a = int(r, 2, 10), b = int(r, 1, 10); if (a * b <= range) return r() < .5 ? { s: `${a} · ${b}`, v: a * b } : { s: `${b} · ${a}`, v: a * b }; }
      else { const b = int(r, 2, 10), q = int(r, 1, 10); if (b * q <= range) return { s: `${b * q} : ${b}`, v: q }; }
    }
    return { s: '1 + 1', v: 2 };
  };
  const GRU = { laengen: [['m', 'cm', 100, 9], ['cm', 'mm', 10, 20], ['km', 'm', 1000, 9]], gewichte: [['kg', 'g', 1000, 9]], geld: [['€', 'ct', 100, 20]], zeit: [['h', 'min', 60, 5], ['min', 's', 60, 5]], hohl: [['l', 'ml', 1000, 5]] };
  function compare(o) {
    const mode = o.mode || 'zahlen';
    if (mode === 'zahlen' || (mode === 'terme' && (!o.cop || o.cop === '+'))) return baseCompare(o);
    const range = clampN(o.range, 3, 1000000, 20), count = clampN(o.count, 1, 40, 8); const r = rng(o.seed || 1); const tasks = []; const seen = new Set();
    const ops = { '+': ['+'], '−': ['−'], '+−': ['+', '−'], '·': ['·'], '·:': ['·', ':'], alle: ['+', '−', '·', ':'] }[o.cop || '+'] || ['+'];
    for (let i = 0; i < count; i++) {
      let t = null;
      for (let k = 0; k < 300 && !t; k++) {
        let L, R, lv, rv;
        if (mode === 'groessen') {
          const kinds = o.gkind && GRU[o.gkind] ? [o.gkind] : Object.keys(GRU); const [big, small, f, mx] = pick(r, GRU[pick(r, kinds)]);
          const a = int(r, 1, mx); const u = r();
          const deltas = [f / 10, f / 2, f / 4, f, 2 * f / 10].filter(d => Number.isInteger(d) && d > 0);
          let b = u < .25 ? a * f : a * f + (r() < .5 ? -1 : 1) * pick(r, deltas); if (b <= 0) b = a * f + pick(r, deltas);
          lv = a * f; rv = b; L = `${a} ${big}`; R = `${b} ${small}`;
          if (r() < .5) { [L, R] = [R, L]; [lv, rv] = [rv, lv]; }
        } else {
          const A = termOf(r, pick(r, ops), range); L = A.s; lv = A.v;
          if (mode === 'terme2') { let B = termOf(r, pick(r, ops), range); if (r() < .25) for (let q = 0; q < 80 && (B.v !== lv || B.s === L); q++) B = termOf(r, pick(r, ops), range); if (B.s === L) continue; R = B.s; rv = B.v; }
          else { rv = r() < .25 ? lv : Math.max(0, Math.min(range, lv + pick(r, [-3, -2, -1, 1, 2, 3, -10, 10]))); R = String(rv); if (r() < .3) { [L, R] = [R, L]; [lv, rv] = [rv, lv]; } }
        }
        const key = L + '|' + R; if (seen.has(key) && k < 250) continue; seen.add(key);
        t = { L, R, sol: lv < rv ? '<' : lv > rv ? '>' : '=' };
      }
      tasks.push(t);
    }
    return { tasks };
  }

  /* ---------- Zahlenstrahl: Zahlen markieren ---------- */
  const baseNl = G.numberline;
  function numberline(o) { const d = baseNl(o); if (o.nmode === 'markieren' && !d.error) d.mode = 'markieren'; return d; }

  /* ---------- Uhrzeiten: am Tag und am Abend (z. B. 7:30 Uhr und 19:30 Uhr) ---------- */
  const baseClock = G.clock;
  function clock(o) {
    const d = baseClock(o); if (!o.daynight || d.error || o.mode === 'spanne') return d;
    const r = rng((o.seed || 1) * 13 + 5); d.times = d.times.map(t => ({ ...t, pm: r() < .5 })); d.daynight = true; return d;
  }

  /* ---------- Rechendreieck: Innen- und Außenfelder gemischt (eindeutig lösbar) ---------- */
  const baseTri = G.triangle;
  /* Felder 0–2 innen, 3–5 außen (3 = 0+1, 4 = 1+2, 5 = 2+0). Lösbar, wenn die gegebenen Gleichungen Rang 3 haben. */
  const ROWS = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [0, 1, 1], [1, 0, 1]];
  function rank(rows) { const m = rows.map(x => x.slice()); let rk = 0; for (let c = 0; c < 3; c++) { const p = m.findIndex((x, i) => i >= rk && Math.abs(x[c]) > 1e-9); if (p < 0) continue; [m[rk], m[p]] = [m[p], m[rk]]; for (let i = 0; i < m.length; i++) if (i !== rk && Math.abs(m[i][c]) > 1e-9) { const f = m[i][c] / m[rk][c]; for (let j = 0; j < 3; j++) m[i][j] -= f * m[rk][j]; } rk++; } return rk; }
  function triangle(o) {
    if (o.mode !== 'mix') return baseTri(o);
    const d = baseTri({ ...o, mode: 'innen' }); if (d.error) return d;
    const r = rng((o.seed || 1) * 17 + 3);
    d.tris = d.tris.map(t => { let show; for (let k = 0; k < 100; k++) { const idx = shuffle(r, [0, 1, 2, 3, 4, 5]).slice(0, 3); if (!idx.some(i => i < 3) || !idx.some(i => i >= 3)) continue; if (rank(idx.map(i => ROWS[i])) === 3) { show = [0, 1, 2, 3, 4, 5].map(i => idx.includes(i)); break; } } return { ...t, mode: 'mix', show: show || [true, true, true, false, false, false] }; });
    return d;
  }

  /* ---------- Geld: keine Aufgaben mit nur einem Schein/einer Münze; Rückgeld ---------- */
  /* alle aktuellen Scheine der Europa-Serie bis 200 € (der 500-€-Schein wird nicht mehr ausgegeben) */
  const MONEY = [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
  const baseMoney = G.money;
  function money(o) {
    const mode = o.mode || 'zaehlen';
    if (mode === 'rueckgeld') return rueckgeld(o);
    const max = clampN(o.range, 1, 500, 20) * 100, count = clampN(o.count, 1, 8, 4), cents = !!o.cents; const r = rng(o.seed || 1);
    const avail = MONEY.filter(v => v <= max && (cents || v >= 100)); if (!avail.length) return baseMoney(o);
    const out = [], seen = new Set();
    for (let k = 0; k < 4000 && out.length < count; k++) {
      let total = cents ? int(r, 1, max) : int(r, 1, max / 100) * 100; let rest = total; const items = [];
      for (const v of avail) { while (rest >= v) { if (v > 1 && r() < .25 && items.length < 9) break; items.push(v); rest -= v; } }
      let ok = true; while (rest > 0) { const v = avail.find(x => x <= rest); if (!v) { ok = false; break; } items.push(v); rest -= v; }
      if (!ok || items.length > 12) continue;
      if (items.length < 2 && k < 3000) continue;
      if (seen.has(total) && k < 3200) continue; seen.add(total);
      out.push({ total, items: items.sort((a, b) => b - a) });
    }
    if (!out.length) return fail('Zahlenraum zu klein.');
    return { tasks: out, mode };
  }
  function rueckgeld(o) {
    const max = clampN(o.range, 1, 500, 20) * 100, count = clampN(o.count, 1, 8, 4), cents = !!o.cents; const r = rng(o.seed || 1);
    const pays = [100, 200, 500, 1000, 2000, 5000, 10000].filter(v => v <= Math.max(max, 200) && v >= 200);
    if (!pays.length) return fail('Für Rückgeld bitte einen Zahlenraum ab 2 € wählen.');
    const tasks = [], seen = new Set();
    for (let k = 0; k < 3000 && tasks.length < count; k++) {
      const paid = pick(r, pays); const step = cents ? (paid <= 500 ? 10 : 50) : 100;
      const price = step * int(r, Math.max(1, Math.ceil(paid * .25 / step)), Math.floor((paid - 1) / step));
      if (price >= paid || price <= 0 || seen.has(price + '/' + paid)) continue; seen.add(price + '/' + paid);
      tasks.push({ price, paid, change: paid - price, item: pick(r, price <= 150 ? ['Radiergummi', 'Bleistift', 'Brezel', 'Apfel', 'Lineal', 'Spitzer'] : price <= 600 ? ['Heft', 'Kleber', 'Ball', 'Malkasten', 'Brotdose', 'Trinkflasche', 'Taschenlampe'] : price <= 2000 ? ['Buch', 'Puzzle', 'Kuscheltier', 'Federmäppchen', 'Spiel', 'Füller'] : ['Rucksack', 'Fußball', 'Spiel', 'Inliner-Helm', 'Gesellschaftsspiel']) });
    }
    if (!tasks.length) return fail('Mit diesen Einstellungen lassen sich keine Rückgeld-Aufgaben bilden.');
    return { tasks, mode: 'rueckgeld' };
  }

  /* ---------- Stellenwerte: Zahlen zerlegen und zusammensetzen ---------- */
  const basePv = G.placevalue;
  function placevalue(o) {
    const d = basePv(o); if (d.error || !['zerlegen', 'zusammen', 'plus'].includes(o.mode)) return d;
    d.list = o.mode; return d;
  }

  /* ---------- Halbschriftlich: Rechenstrategien ---------- */
  const baseHs = G.halbschriftlich;
  function halbschriftlich(o) {
    const strat = o.strat || 'schritt', op = o.op || '+';
    if (strat === 'schritt' || op === '·' || op === ':') return baseHs(o);
    const range = clampN(o.range, 20, 1000000, 100), count = clampN(o.count, 1, 12, 4); const r = rng(o.seed || 1);
    const tasks = [], seen = new Set();
    for (let k = 0; k < 4000 && tasks.length < count; k++) {
      let t = null;
      if (strat === 'stellen') {
        const big = range > 100 ? 100 : 10;
        if (op === '+') { const a = int(r, 11, range - 11), b = int(r, 11, range - a); if (a + b > range || a % 10 === 0 || b % 10 === 0) continue;
          const ah = a - a % big, bh = b - b % big, ae = a % big, be = b % big; if (!ah || !bh) continue;
          t = { q: `${a} + ${b}`, res: a + b, steps: [`${ah} + ${bh} = ${ah + bh}`, `${ae} + ${be} = ${ae + be}`, `${ah + bh} + ${ae + be} = ${a + b}`] }; }
        else { const a = int(r, 21, range), b = int(r, 11, a - 10); if (a % 10 === 0 || b % 10 === 0) continue; const ah = a - a % big, bh = b - b % big, ae = a % big, be = b % big; if (ae < be || !bh || ah <= bh) continue;
          t = { q: `${a} − ${b}`, res: a - b, steps: [`${ah} − ${bh} = ${ah - bh}`, `${ae} − ${be} = ${ae - be}`, `${ah - bh} + ${ae - be} = ${a - b}`] }; }
      } else { /* Hilfsaufgabe: mit dem nächsten Zehner rechnen und ausgleichen */
        const a = int(r, 11, range - 11); const e = pick(r, [8, 9]); const b = 10 * int(r, 0, Math.max(0, Math.floor((range - a) / 10) - 1)) + e; const k10 = 10 - e, bb = b + k10;
        if (b < 8) continue;
        if (op === '+') { if (a + bb > range) continue; t = { q: `${a} + ${b}`, res: a + b, steps: [`${a} + ${bb} = ${a + bb}`, `${a + bb} − ${k10} = ${a + b}`] }; }
        else { if (a - bb < 0 || a < 20) continue; t = { q: `${a} − ${b}`, res: a - b, steps: [`${a} − ${bb} = ${a - bb}`, `${a - bb} + ${k10} = ${a - b}`] }; }
      }
      if (!t || seen.has(t.q)) continue; seen.add(t.q); tasks.push(t);
    }
    if (tasks.length < count) return fail('Mit diesen Einstellungen lassen sich nicht genug Aufgaben bilden. Zahlenraum vergrößern.');
    return { tasks, strat };
  }

  /* ---------- Sachaufgaben in zwei Schritten ---------- */
  const ZWEI = [
    (r, R) => { const n = int(r, 2, 6), p = int(r, 2, 5), have = n * p + int(r, 1, Math.min(30, Math.max(1, R - n * p))); if (have > R) return null; return { t: `{A} hat ${have} Euro. {A} kauft ${n} Hefte zu je ${p} Euro.`, f: 'Wie viel Geld hat {A} danach noch?', r: `${n} · ${p} = ${n * p}; ${have} − ${n * p} = ${have - n * p}`, ans: `{A} hat noch ${have - n * p} Euro.` }; },
    (r, R) => { const a = int(r, 5, Math.floor(R / 3)), b = int(r, 5, Math.floor(R / 3)), c = int(r, 2, Math.min(a + b - 1, Math.floor(R / 3))); return { t: `Im Bus sitzen ${a} Kinder. An der ersten Haltestelle steigen ${b} Kinder ein, an der zweiten steigen ${c} Kinder aus.`, f: 'Wie viele Kinder sitzen jetzt im Bus?', r: `${a} + ${b} = ${a + b}; ${a + b} − ${c} = ${a + b - c}`, ans: `Jetzt sitzen ${a + b - c} Kinder im Bus.` }; },
    (r, R) => { const k = int(r, 2, 6), e = int(r, 2, 6), g = int(r, 2, 9); if (k * e + g > R) return null; return { t: `{A} kauft ${k} Packungen mit je ${e} Muffins. {B} bringt noch ${g} Muffins mit.`, f: 'Wie viele Muffins haben sie zusammen?', r: `${k} · ${e} = ${k * e}; ${k * e} + ${g} = ${k * e + g}`, ans: `Sie haben zusammen ${k * e + g} Muffins.` }; },
    (r, R) => { const kids = int(r, 2, 6), each = int(r, 2, 8), total = kids * each, rest = int(r, 1, 9); if (total + rest > R) return null; return { t: `{A} hat ${total + rest} Sticker. {A} behält ${rest} Sticker und verteilt den Rest gerecht an ${kids} Kinder.`, f: 'Wie viele Sticker bekommt jedes Kind?', r: `${total + rest} − ${rest} = ${total}; ${total} : ${kids} = ${each}`, ans: `Jedes Kind bekommt ${each} Sticker.` }; },
    (r, R) => { const rows = int(r, 3, 8), per = int(r, 3, 9), empty = int(r, 2, Math.max(2, rows * per - 2)); if (rows * per > R || empty >= rows * per) return null; return { t: `Im Kino gibt es ${rows} Reihen mit je ${per} Plätzen. ${empty} Plätze sind noch frei.`, f: 'Wie viele Plätze sind besetzt?', r: `${rows} · ${per} = ${rows * per}; ${rows * per} − ${empty} = ${rows * per - empty}`, ans: `Es sind ${rows * per - empty} Plätze besetzt.` }; },
    (r, R) => { const a = int(r, 10, Math.floor(R / 2)), b = int(r, 5, a - 1), c = int(r, 5, Math.floor(R / 2)); if (a - b + c > R) return null; return { t: `In der Schulbücherei stehen ${a} Bücher. Am Montag werden ${b} Bücher ausgeliehen. Am Dienstag kommen ${c} neue Bücher dazu.`, f: 'Wie viele Bücher stehen jetzt in der Bücherei?', r: `${a} − ${b} = ${a - b}; ${a - b} + ${c} = ${a - b + c}`, ans: `Jetzt stehen ${a - b + c} Bücher in der Bücherei.` }; },
    (r, R) => { const p1 = int(r, 2, 9), n1 = int(r, 2, 5), p2 = int(r, 2, 9); if (p1 * n1 + p2 > R) return null; return { t: `{A} kauft ${n1} Bücher zu je ${p1} Euro und ein Spiel für ${p2} Euro.`, f: 'Wie viel muss {A} bezahlen?', r: `${n1} · ${p1} = ${n1 * p1}; ${n1 * p1} + ${p2} = ${n1 * p1 + p2}`, ans: `{A} muss ${n1 * p1 + p2} Euro bezahlen.` }; },
    (r, R) => { const w = int(r, 2, 4), d = 7 * w, x = int(r, 1, 6); return { t: `Die Lehrerin sagt: „In ${w} Wochen ist unser Schulfest.“ Seitdem sind ${x} Tage vergangen.`, f: 'Wie viele Tage dauert es noch bis zum Schulfest?', r: `${w} · 7 = ${d}; ${d} − ${x} = ${d - x}`, ans: `Es dauert noch ${d - x} Tage bis zum Schulfest.` }; },
  ];
  const baseSach = G.FILL.sachaufgabe;
  G.FILL.sachaufgabe = (it, r) => {
    if (it.sop !== 'zwei') return baseSach(it, r);
    const R = clampN(it.range, 20, 10000, 100); const names = shuffle(r, P().NAMES || ['Mia', 'Ben']); let x = null;
    for (let k = 0; k < 200 && !x; k++) x = pick(r, ZWEI)(r, R);
    if (!x) return;
    const f = s => s.replace(/\{A\}/g, names[0]).replace(/\{B\}/g, names[1]);
    it.text = f(x.t); it.solF = f(x.f); it.solR = x.r; it.solA = f(x.ans);
  };

  /* ---------- Zahlenhaus: auch als Malhaus (Zerlegungen in Malaufgaben) ---------- */
  const baseHouse = G.house;
  function house(o) {
    if (o.hop !== '·') return baseHouse(o);
    const range = clampN(o.range, 4, 1000, 100), count = clampN(o.count, 1, 6, 2), floors = clampN(o.floors, 1, 12, 4); const r = rng(o.seed || 1);
    /* bis 100: nur Einmaleins-Zerlegungen (beide Faktoren höchstens 10), darüber alle Zerlegungen */
    const small = range <= 100;
    const pairs = n => { const out = []; for (let a = 1; a * a <= n; a++) if (n % a === 0 && (small ? n / a <= 10 : a >= 2 && a <= 10)) out.push(a); return out.map(a => ({ a, b: n / a })); };
    const cand = []; for (let n = 6; n <= range; n++) { const p = pairs(n); if (p.length >= (small ? 2 : 3) && (small || n % 10 === 0 || n % 12 === 0)) cand.push(n); }
    if (!cand.length) return fail('Für Malhäuser bitte einen Zahlenraum bis mindestens 12 wählen.');
    const houses = []; const used = new Set();
    for (let h = 0; h < count; h++) {
      let roof = pick(r, cand); for (let k = 0; k < 30 && used.has(roof); k++) roof = pick(r, cand); used.add(roof);
      const ps = pairs(roof); const chosen = o.complete ? ps : shuffle(r, ps).slice(0, Math.min(floors, ps.length)).sort((x, y) => x.a - y.a);
      houses.push({ roof, floors: chosen.map(f => ({ a: f.a, b: f.b, hide: r() < .5 ? 'a' : 'b' })) });
    }
    return { houses, op: '·' };
  }

  /* ---------- Größen: Kommaschreibweise in Klasse 4 (Geld und Längen) ---------- */
  const baseUnits = G.units;
  function units(o) {
    if (o.level !== 'gs4') return baseUnits(o);
    const kind = { laengen: 1, geld: 1 }[o.kind] ? o.kind : null; if (!kind) return baseUnits({ ...o, level: 'gs' });
    const count = clampN(o.count, 1, 20, 8); const r = rng(o.seed || 1); const big = kind === 'geld' ? '€' : 'm', small = kind === 'geld' ? 'ct' : 'cm';
    const fmt = v => (v / 100).toFixed(2).replace('.', ','); const tasks = [], seen = new Set();
    for (let k = 0; k < 2000 && tasks.length < count; k++) {
      const v = int(r, 101, kind === 'geld' ? 2999 : 999); if (v % 100 === 0) continue;
      const style = pick(r, ['k2s', 's2k', 'gem']); let t;
      if (style === 'k2s') t = { q: `${fmt(v)} ${big} = `, a: String(v), u: small };
      else if (style === 's2k') t = { q: `${v} ${small} = `, a: fmt(v), u: big };
      else t = { q: `${Math.floor(v / 100)} ${big} ${v % 100} ${small} = `, a: fmt(v), u: big };
      if (seen.has(t.q)) continue; seen.add(t.q); tasks.push(t);
    }
    return { tasks };
  }

  /* ---------- Bild und Wort: Mehrzahl ergänzen ---------- */
  const basePw = G.pictureword;
  function pictureword(o) {
    const d = basePw(o); if (d.error) return d;
    const nouns = (P().allNouns ? P().allNouns() : []);
    d.items = d.items.map(x => { const n = nouns.find(y => y.w === x.w); return n && n.p && n.p !== '-' ? { ...x, p: n.p } : x; });
    if (o.mode === 'mehrzahl') d.items = d.items.filter(x => x.p && x.p !== x.w);
    return d;
  }

  Object.assign(G, { pictureword, house, units, packet, wall, compare, numberline, clock, triangle, money, placevalue, halbschriftlich, rankTri: rank });
  if (typeof module !== 'undefined' && module.exports) module.exports = G; else root.FolivaGen = G;
})(typeof window !== 'undefined' ? window : globalThis);
