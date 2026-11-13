/* Foliva – Aufgabengeneratoren ab 0.9.5 · © 2026 theis
   Rechenrad, Magisches Quadrat, Operator-Quadrat, Zerlegungsaufgabe, Päckchenarten (schöne Päckchen, Tausch-,
   Umkehr-, Nachbaraufgaben, eigene Aufgaben), Hunderterfeld, Zeitspannen. Alles deterministisch über „seed“. */
(function (root) {
  'use strict';
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen2.js') : null);
  const { rng, shuffle } = G;
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const clampN = (v, lo, hi, d) => { v = Math.floor(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const fail = msg => ({ error: msg, tasks: [] });
  const calc = (a, op, b) => op === '+' ? a + b : op === '−' ? a - b : op === '·' ? a * b : b ? a / b : NaN;

  /* ---------- Rechenrad: innen eine Zahl, im Ring die Zahlen, außen das Ergebnis ---------- */
  function rechenrad(o) {
    const range = clampN(o.range, 10, 100000, 20), seg = clampN(o.seg, 4, 12, 8), count = clampN(o.count, 1, 4, 2);
    const ops = String(o.ops || '+').split('').filter(c => '+−·:'.includes(c)); if (!ops.length) ops.push('+');
    const r = rng(o.seed || 1); const wheels = [];
    for (let w = 0; w < count; w++) {
      let wh = null;
      for (let k = 0; k < 2000 && !wh; k++) {
        const op = pick(r, ops); let c, ins = [], outs = [];
        if (op === '+') { c = int(r, 1, Math.max(1, Math.floor(range / 2))); ins = Array.from({ length: seg }, () => int(r, 0, range - c)); }
        else if (op === '−') { c = int(r, 1, Math.max(1, Math.floor(range / 2))); ins = Array.from({ length: seg }, () => int(r, c, range)); }
        else if (op === '·') { c = int(r, 2, 10); const mx = Math.min(10, Math.floor(range / c)); if (mx < 1) continue; ins = Array.from({ length: seg }, () => int(r, 0, mx)); }
        else { c = int(r, 2, 10); const mx = Math.min(10, Math.floor(range / c)); if (mx < 1) continue; ins = Array.from({ length: seg }, () => int(r, 0, mx) * c); }
        if (new Set(ins).size < Math.min(seg, 4)) continue;
        outs = ins.map(v => calc(v, op, c));
        const mode = o.mode || 'aussen';
        const hideOut = [], hideIn = [];
        ins.forEach((_, i) => { if (mode === 'aussen') hideOut.push(i); else if (mode === 'innen') hideIn.push(i); else (r() < .5 ? hideOut : hideIn).push(i); });
        wh = { c, op, ins, outs, hideIn, hideOut };
      }
      if (!wh) return fail('Mit diesen Einstellungen lassen sich keine Rechenräder bilden.');
      wheels.push(wh);
    }
    return { wheels };
  }

  /* ---------- Magisches Quadrat (3×3 oder 4×4) ---------- */
  const LO = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
  const D4 = [[16, 3, 2, 13], [5, 10, 11, 8], [9, 6, 7, 12], [4, 15, 14, 1]];
  function transform(m, r) { let a = m.map(x => x.slice()); const rot = q => q[0].map((_, i) => q.map(row => row[i]).reverse()); for (let i = int(r, 0, 3); i > 0; i--) a = rot(a); if (r() < .5) a = a.map(row => row.slice().reverse()); return a; }
  function magic(o) {
    const n = +o.size === 4 ? 4 : 3, count = clampN(o.count, 1, 4, 2), range = clampN(o.range, 9, 100000, 100); const r = rng(o.seed || 1);
    const base = n === 3 ? LO : D4; const maxB = n * n;
    const squares = [];
    for (let q = 0; q < count; q++) {
      let sq = null;
      for (let k = 0; k < 500 && !sq; k++) {
        const f = int(r, 1, Math.max(1, Math.floor((range - 1) / maxB))), add = int(r, 0, Math.max(0, range - f * maxB));
        const m = transform(base, r).map(row => row.map(v => v * f + add)); if (Math.max(...m.flat()) > range) continue;
        const cells = m.flat(); const sum = m[0].reduce((s, v) => s + v, 0);
        const nh = clampN(o.hide, 1, n * n - n, n === 3 ? 4 : 7);
        /* so verbergen, dass jede Lücke über eine Reihe bestimmbar bleibt: schrittweise füllen */
        let hide = [];
        for (let t = 0; t < 200; t++) { const h = shuffle(r, cells.map((_, i) => i)).slice(0, nh); if (solvable(n, h)) { hide = h; break; } }
        if (!hide.length) continue;
        sq = { n, cells, hide, sum };
      }
      if (!sq) return fail('Magisches Quadrat: Zahlenraum zu klein.');
      squares.push(sq);
    }
    return { squares };
  }
  function solvable(n, hide) {
    const h = new Set(hide); const lines = [];
    for (let i = 0; i < n; i++) { lines.push(Array.from({ length: n }, (_, j) => i * n + j)); lines.push(Array.from({ length: n }, (_, j) => j * n + i)); }
    lines.push(Array.from({ length: n }, (_, j) => j * n + j)); lines.push(Array.from({ length: n }, (_, j) => j * n + (n - 1 - j)));
    let changed = true; while (changed && h.size) { changed = false; for (const L of lines) { const miss = L.filter(i => h.has(i)); if (miss.length === 1) { h.delete(miss[0]); changed = true; } } }
    return h.size === 0;
  }

  /* ---------- Operator-Quadrat: vier Zahlen, an den Seiten (und Diagonalen) die Rechenoperatoren ---------- */
  const opText = d => (d >= 0 ? '+' : '−') + Math.abs(d);
  function opsquare(o) {
    const range = clampN(o.range, 10, 100000, 20), count = clampN(o.count, 1, 6, 2); const r = rng(o.seed || 1);
    const diag = !!o.diag; const sqs = [];
    for (let q = 0; q < count; q++) {
      const edges = [[0, 1], [1, 2], [2, 3], [3, 0]]; if (diag) edges.push([0, 2], [1, 3]);
      /* keine „+ 0“-Pfeile: alle Zahlen verschieden */
      let v; for (let k = 0; k < 200; k++) { v = Array.from({ length: 4 }, () => int(r, 0, range)); if (new Set(v).size === 4) break; }
      const ops = edges.map(([a, b]) => opText(v[b] - v[a]));
      const mode = o.mode || 'zahlen'; let hideV = [], hideO = [];
      if (mode === 'zahlen') hideV = shuffle(r, [1, 2, 3]).slice(0, 3);
      else if (mode === 'operatoren') hideO = edges.map((_, i) => i);
      else { hideV = shuffle(r, [1, 2, 3]).slice(0, 2); hideO = shuffle(r, edges.map((_, i) => i)).slice(0, Math.ceil(edges.length / 2)); }
      sqs.push({ v, edges, ops, hideV, hideO });
    }
    return { sqs };
  }

  /* ---------- Zerlegungsaufgabe: über den Zehner (8 + 5 = 8 + 2 + 3) ---------- */
  function zerlegung(o) {
    const range = clampN(o.range, 20, 1000, 20), count = clampN(o.count, 1, 12, 4), op = o.op === '−' ? '−' : o.op === '+−' ? 'mix' : '+'; const r = rng(o.seed || 1);
    const tasks = []; const seen = new Set();
    for (let i = 0; i < count; i++) {
      let t = null;
      for (let k = 0; k < 2000 && !t; k++) {
        const p = op === 'mix' ? pick(r, ['+', '−']) : op;
        if (p === '+') { const a = int(r, 1, range - 2); if (a % 10 === 0) continue; const ten = Math.ceil(a / 10) * 10; const x = ten - a; const b = int(r, x + 1, Math.min(9, range - a)); if (b <= x || a + b > range) continue; t = { a, op: '+', b, x, ten, y: b - x, res: a + b }; }
        else { const a = int(r, 11, range); if (a % 10 === 0) continue; const ten = Math.floor(a / 10) * 10; const x = a - ten; const b = int(r, x + 1, 9); if (b <= x || a - b < 0) continue; t = { a, op: '−', b, x, ten, y: b - x, res: a - b }; }
        if (t && seen.has(t.a + t.op + t.b) && k < 1500) t = null;
      }
      if (!t) return fail('Für Zerlegungsaufgaben mit Zehnerübergang ist der Zahlenraum zu klein.');
      seen.add(t.a + t.op + t.b); tasks.push(t);
    }
    return { tasks };
  }

  /* ---------- Rechenpäckchen: Päckchenarten und eigene Aufgaben ---------- */
  const basePacket = G.packet;
  function parseOwn(text) {
    const tasks = [], bad = [];
    String(text || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(line => {
      const s = line.replace(/\*/g, '·').replace(/x(?=\s*\d)/gi, '·').replace(/-/g, '−').replace(/\//g, ':').replace(/÷/g, ':').replace(/\s+/g, '');
      const m = s.match(/^(\d+|_|\?|□)([+−·:])(\d+|_|\?|□)(?:=(\d+|_|\?|□)?)?$/);
      if (!m) { bad.push(line); return; }
      const isGap = x => x == null || /^[_?□]$/.test(x);
      let [, A, op, B, Cc] = m; let miss = isGap(A) ? 'a' : isGap(B) ? 'b' : 'c';
      let a = isGap(A) ? null : +A, b = isGap(B) ? null : +B, c = isGap(Cc) ? null : +Cc;
      if (miss === 'a') { if (b == null || c == null) { bad.push(line); return; } a = op === '+' ? c - b : op === '−' ? c + b : op === '·' ? (b ? c / b : NaN) : c * b; }
      else if (miss === 'b') { if (a == null || c == null) { bad.push(line); return; } b = op === '+' ? c - a : op === '−' ? a - c : op === '·' ? (a ? c / a : NaN) : (c ? a / c : NaN); }
      else { c = calc(a, op, b); }
      let rest = 0; if (op === ':' && miss === 'c' && b && a % b) { rest = a % b; c = Math.floor(a / b); }
      if (![a, b, c].every(v => Number.isFinite(v) && v >= 0 && Number.isInteger(v))) { bad.push(line); return; }
      tasks.push({ a, op, b, c, rest, miss });
    });
    return { tasks, bad };
  }
  function packet(o) {
    const form = o.pform || 'zufall';
    if (form === 'zufall') return basePacket(o);
    if (form === 'eigene') { const p = parseOwn(o.own); if (!p.tasks.length) return fail('Bitte unten eigene Aufgaben eintragen, je Zeile eine, z. B. 7 + 5 oder 12 − _ = 4.'); return { tasks: p.tasks, bad: p.bad }; }
    const range = clampN(o.range, 5, 1000000, 20), r = rng(o.seed || 1); const ops = o.op === '+−' ? ['+', '−'] : o.op === '·:' ? ['·', ':'] : [o.op || '+'];
    const glen = form === 'schoen' ? clampN(o.glen, 2, 8, 5) : 2, groups = Math.max(1, Math.ceil(clampN(o.count, 1, 40, 8) / glen));
    const miss = o.missing || 'ergebnis'; const mk = (a, op, b) => { const c = calc(a, op, b); const m = miss === 'gemischt' ? pick(r, ['a', 'b', 'c']) : miss === 'erste' ? 'a' : miss === 'zweite' ? 'b' : 'c'; return { a, op, b, c, rest: 0, miss: m }; };
    const ok = t => [t.a, t.b, t.c].every(v => Number.isInteger(v) && v >= 0 && v <= range) && (o.zero || (t.a > 0 && t.b > 0 && t.c > 0));
    const out = [];
    for (let g = 0; g < groups; g++) {
      let grp = null;
      for (let k = 0; k < 3000 && !grp; k++) {
        const op = pick(r, ops); const list = [];
        if (form === 'schoen') {
          const da = pick(r, op === '·' || op === ':' ? [1, 0] : [1, -1, 2, 0, 10]), db = pick(r, op === '·' || op === ':' ? [1, -1] : [1, -1, 0, 2]);
          if (da === 0 && db === 0) continue;
          let a, b;
          if (op === '·') { a = int(r, 1, 10); b = int(r, 1, 10); }
          else if (op === ':') { b = int(r, 2, 10); a = b * int(r, 1, 10); }
          else { a = int(r, 1, Math.max(1, range - 10)); b = int(r, 1, Math.max(1, Math.floor(range / 3))); }
          for (let i = 0; i < glen; i++) {
            const t = op === ':' ? mk(a + i * b * da, op, b) : mk(a + i * da, op, b + i * db);
            list.push(t);
          }
        } else if (form === 'tausch') {
          const op2 = op === '−' ? '+' : op === ':' ? '·' : op; const a = int(r, 1, range), b = int(r, 1, range); const t1 = mk(a, op2, b), t2 = mk(b, op2, a); list.push(t1, t2);
        } else if (form === 'umkehr') {
          const base = op === '−' || op === '+' ? '+' : '·'; const a = int(r, 1, base === '+' ? range : 10), b = int(r, 1, base === '+' ? range : 10); const c = calc(a, base, b);
          list.push(mk(a, base, b), mk(c, base === '+' ? '−' : ':', b));
        } else if (form === 'nachbar') {
          const a = int(r, 1, op === '·' || op === ':' ? 10 : range), b = int(r, 1, op === '·' || op === ':' ? 10 : range);
          if (op === ':') list.push(mk(a * b, ':', b), mk(a * b + b, ':', b)); else list.push(mk(a, op, b), mk(a, op, b + 1));
        }
        if (list.length && list.every(ok)) grp = list;
      }
      if (!grp) return fail('Mit diesen Einstellungen lassen sich keine passenden Päckchen bilden. Bitte den Zahlenraum vergrößern.');
      out.push(grp);
    }
    return { tasks: out.flat(), groups: out.map(g => g.length) };
  }

  /* ---------- Zehner-/Zwanziger-/Hunderterfeld, auch „Plusaufgabe“ mit zwei Farben ---------- */
  const baseTen = G.tenframe;
  function tenframe(o) {
    const size = +o.size === 100 ? 100 : +o.size === 20 ? 20 : 10;
    if (size !== 100 && o.mode !== 'plus') return baseTen(o);
    const count = clampN(o.count, 1, 12, size === 100 ? 1 : 4), r = rng(o.seed || 1); const nums = [], parts = [];
    for (let i = 0; i < count; i++) {
      const n = int(r, o.mode === 'plus' ? 2 : o.zero ? 0 : 1, size); nums.push(n);
      if (o.mode === 'plus') { const a = n >= 2 ? int(r, 1, n - 1) : n; parts.push([a, n - a]); }
    }
    return { size, nums, parts };
  }

  /* ---------- Uhr: Zeitspannen (zwei Uhren) ---------- */
  /* ---------- Schriftliche Division (einstelliger Teiler, Karo-Schreibweise) ---------- */
  function wdiv(o) {
    const digits = clampN(o.digits, 2, 5, 3), dmax = clampN(o.dmax, 2, 9, 9), count = clampN(o.count, 1, 8, 4), rest = o.rest || 'ohne';
    const r = rng(o.seed || 1); const tasks = []; const seen = new Set(); const lo = 10 ** (digits - 1), hi = 10 ** digits - 1;
    for (let i = 0; i < count; i++) {
      let t = null;
      for (let k = 0; k < 3000 && !t; k++) {
        const b = int(r, 2, dmax); const withRest = rest === 'mit' || (rest === 'gemischt' && r() < .5);
        const q = int(r, Math.ceil(lo / b), Math.floor(hi / b)); const rr = withRest ? int(r, 1, b - 1) : 0; const a = q * b + rr;
        if (a < lo || a > hi || a < b * 2 || seen.has(a + ':' + b)) continue;
        seen.add(a + ':' + b); t = { a, b, q, r: rr };
      }
      if (!t) return fail('Mit diesen Einstellungen lassen sich keine Aufgaben bilden.');
      t.rows = wdivRows(t); tasks.push(t);
    }
    return { tasks };
  }
  function wdivRows({ a, b, q, r: rr }) {
    const s = String(a), n = s.length, off = 1; const rows = []; const put = (row, col, ch, sol, line) => { while (rows.length <= row) rows.push([]); rows[row][col] = { ch, sol: !!sol, line: !!line }; };
    s.split('').forEach((c, i) => put(0, off + i, c, false));
    let c0 = off + n; [':', ...String(b), '='].forEach(ch => put(0, c0++, ch, false)); String(q).split('').forEach(ch => put(0, c0++, ch, true));
    if (rr) { put(0, c0++, 'R', true); String(rr).split('').forEach(ch => put(0, c0++, ch, true)); }
    let pos = 0, cur = +s[0]; while (cur < b && pos < n - 1) { pos++; cur = cur * 10 + +s[pos]; }
    let row = 1;
    for (;;) {
      const p = Math.floor(cur / b) * b, rem = cur - p; const ps = String(p); const end = off + pos;
      put(row, end - ps.length, '−', true); ps.split('').forEach((ch, i) => put(row, end - ps.length + 1 + i, ch, true));
      row++;
      const rs = String(rem); const from = Math.min(end - ps.length, end - String(cur).length + 1);
      for (let col = Math.max(0, from); col <= end; col++) put(row, col, '', false, true);
      rs.split('').forEach((ch, i) => put(row, end - rs.length + 1 + i, ch, true, true));
      if (pos >= n - 1) break;
      pos++; put(row, off + pos, s[pos], true); cur = rem * 10 + +s[pos]; row++;
    }
    return rows.map(r => Array.from({ length: r.length }, (_, i) => r[i] || null));
  }

  /* ---------- Schriftlich multiplizieren mit Zehnerzahl oder mehrstelligem Faktor (Teilprodukte) ---------- */
  const baseWritten = G.written;
  function written(o) {
    const mform = o.mform || 'einstellig';
    if ((o.op || '+') !== '·' || mform === 'einstellig') return baseWritten(o);
    const digits = clampN(o.digits, 2, 5, 3), count = clampN(o.count, 1, 12, 4), md = clampN(o.mdigits, 2, 3, 2);
    const r = rng(o.seed || 1); const tasks = []; const seen = new Set(); const lo = 10 ** (digits - 1), hi = 10 ** digits - 1;
    for (let i = 0; i < count; i++) {
      let t = null;
      for (let k = 0; k < 3000 && !t; k++) {
        const a = int(r, lo, hi); let b;
        if (mform === 'zehner') b = int(r, 2, 9) * 10 ** int(r, 1, Math.min(2, 7 - digits));
        else { b = int(r, 10 ** (md - 1), 10 ** md - 1); if (b % 10 === 0 && r() < .7) continue; }
        const res = a * b; if (String(res).length > 8 || seen.has(a + '·' + b)) continue; seen.add(a + '·' + b);
        const bs = String(b); const parts = [];
        [...bs].forEach((ch, j) => { if (+ch) parts.push({ v: a * +ch, end: j }); });
        t = { op: '·', ns: [a, b], res, parts };
      }
      if (!t) return fail('Mit diesen Einstellungen lassen sich keine passenden Aufgaben bilden.');
      tasks.push(t);
    }
    return { rules: 1, tasks };
  }

  /* ---------- Hundertertafel-Ausschnitte: kleine Teile der Tafel, eine Zahl ist vorgegeben ---------- */
  const baseHundred = G.hundred;
  const SHAPES_H = [[[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1], [1, 0], [1, 2], [0, 0]]];
  function hundred(o) {
    if (o.pattern !== 'ausschnitte') return baseHundred(o);
    const start = o.start === 0 ? 0 : 1, count = clampN(o.count, 1, 12, 6); const r = rng(o.seed || 1); const pieces = []; const used = new Set();
    for (let i = 0; i < count; i++) {
      let p = null;
      for (let k = 0; k < 500 && !p; k++) {
        const sh = pick(r, SHAPES_H); const h = Math.max(...sh.map(c => c[0])) + 1, w = Math.max(...sh.map(c => c[1])) + 1;
        const r0 = int(r, 0, 10 - h), c0 = int(r, 0, 10 - w); const key = r0 * 10 + c0 + ':' + SHAPES_H.indexOf(sh); if (used.has(key)) continue; used.add(key);
        const cells = sh.map(([dr, dc]) => ({ dr, dc, v: start + (r0 + dr) * 10 + (c0 + dc) }));
        const given = int(r, 0, cells.length - 1);
        p = { h, w, cells: cells.map((c, j) => ({ ...c, show: j === given })) };
      }
      if (p) pieces.push(p);
    }
    return { rules: 1, pieces };
  }

  const baseClock = G.clock;
  function clock(o) {
    if (o.mode !== 'spanne') return baseClock(o);
    const count = clampN(o.count, 1, 8, 3), step = { voll: 60, halb: 30, viertel: 15, '5': 5, '1': 1 }[o.step || 'viertel'] || 15; const r = rng(o.seed || 1);
    const pairs = [];
    for (let i = 0; i < count; i++) { const h = int(r, 1, 11), m = step * int(r, 0, 60 / step - 1); const d = step * int(r, 1, Math.max(1, Math.floor(180 / step))); const t2 = h * 60 + m + d; pairs.push({ a: { h, m }, b: { h: ((Math.floor(t2 / 60) - 1) % 12) + 1, m: t2 % 60 }, d }); }
    return { pairs, times: [] };
  }

  Object.assign(G, { hundred, written, wdiv, wdivRows, rechenrad, magic, opsquare, zerlegung, packet, tenframe, clock, parseOwn, solvableMagic: solvable });
  if (typeof module !== 'undefined' && module.exports) module.exports = G; else root.FolivaGen = G;
})(typeof window !== 'undefined' ? window : globalThis);
