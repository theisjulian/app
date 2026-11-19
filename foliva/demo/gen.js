/* Foliva – Aufgabengeneratoren · © 2026 theis
   Jeder Generator ist deterministisch (Startwert „seed“) und liefert die konkreten Aufgaben MIT Lösungen.
   Die Aufgaben werden im Material gespeichert; neu gewürfelt wird nur auf ausdrücklichen Wunsch.
   Sind die Regeln nicht erfüllbar, gibt es eine verständliche Meldung (error) – keine stille Aufweichung.
   Läuft im Browser (window.FolivaGen) und in Node (require). */
(function (root) {
  'use strict';
  const RULES = 1; /* Regelversion – bei späteren Änderungen erhöhen, alte Dokumente behalten ihre gespeicherten Aufgaben */

  function rng(seed) {
    let v = (seed >>> 0) || 1;
    return () => { v = (Math.imul(v ^ (v >>> 15), 2246822519) + 1013904223) >>> 0; v ^= v >>> 13; return (v >>> 0) / 4294967296; };
  }
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));      /* ganze Zahl in [lo, hi] */
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function shuffle(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const newSeed = () => 1 + Math.floor(Math.random() * 2147483646);
  const clampN = (v, lo, hi, d) => { v = Math.floor(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const fail = msg => ({ error: msg, tasks: [] });

  /* Zehnerübergang bei Addition/Subtraktion (nur Einerstelle) */
  const crossAdd = (a, b) => (a % 10) + (b % 10) >= 10;
  const crossSub = (a, b) => (a % 10) < (b % 10);
  /* Übertrag an irgendeiner Stelle (schriftliches Rechnen) */
  function anyCarry(a, b, op) {
    if (op === '+') { let c = 0; while (a || b) { if ((a % 10) + (b % 10) + c >= 10) return true; c = 0; a = Math.floor(a / 10); b = Math.floor(b / 10); } return false; }
    while (b) { if (a % 10 < b % 10) return true; a = Math.floor(a / 10); b = Math.floor(b / 10); } return false;
  }

  /* ---------- Rechenpäckchen (M10, G02, G10) ---------- */
  const PACKET_OPS = { '+': 'Addition', '−': 'Subtraktion', '·': 'Multiplikation', ':': 'Division', '+−': 'Addition und Subtraktion gemischt', '·:': 'Einmaleins gemischt (· und :)' };
  function packet(o) {
    const range = clampN(o.range, 5, 1000000, 20), count = clampN(o.count, 1, 40, 8);
    const zero = !!o.zero, trans = o.transition || 'mixed', miss = o.missing || 'ergebnis';
    const rows = String(o.rows || '').split(/[ ,;]+/).map(Number).filter(n => n >= 1 && n <= 20);
    const r = rng(o.seed || 1); const tasks = [], seen = new Set();
    const lo = zero ? 0 : 1;
    if ((o.op === '+' || o.op === '−' || o.op === '+−') && trans === 'required' && range < 11) return fail(`Mit Zehnerübergang braucht der Zahlenraum mindestens bis 11 (eingestellt: bis ${range}).`);
    if ((o.op === ':' ) && o.rest && range < 3) return fail('Für Aufgaben mit Rest ist der Zahlenraum zu klein.');
    for (let i = 0; i < count; i++) {
      let t = null;
      for (let tries = 0; tries < 3000 && !t; tries++) {
        let op = o.op === '+−' ? pick(r, ['+', '−']) : o.op === '·:' ? pick(r, ['·', ':']) : (o.op || '+');
        let a, b, c, rest = 0;
        if (op === '+') { c = int(r, lo * 2, range); a = int(r, lo, c - lo); b = c - a; if (trans === 'none' && crossAdd(a, b)) continue; if (trans === 'required' && !crossAdd(a, b)) continue; }
        else if (op === '−') { a = int(r, lo, range); b = int(r, lo, a - lo < lo ? lo : a - lo); if (b > a) continue; c = a - b; if (!zero && c === 0) continue; if (trans === 'none' && crossSub(a, b)) continue; if (trans === 'required' && !crossSub(a, b)) continue; }
        else if (op === '·') {
          const f = rows.length ? pick(r, rows) : int(r, lo === 0 ? 0 : 1, 10);
          const maxOther = f === 0 ? 10 : Math.min(10, Math.floor(range / f)); if (maxOther < lo) continue;
          const g = int(r, lo === 0 ? 0 : 1, Math.max(lo, maxOther));
          if (r() < .5) { a = f; b = g; } else { a = g; b = f; } c = a * b; if (c > range) continue;
        } else {
          b = rows.length ? pick(r, rows) : int(r, 1, 10); const q = int(r, zero ? 0 : 1, Math.max(1, Math.min(rows.length ? 10 : Infinity, Math.floor(range / b)))); a = q * b; /* mit Reihen: Einmaleins, Ergebnis höchstens 10 */
          if (o.rest) { rest = int(r, 1, b - 1 || 1); if (b === 1) continue; a += rest; }
          if (a > range) continue; c = q;
        }
        if (a > range || b > range || c > range || a < 0 || b < 0 || c < 0) continue;
        const key = `${a}${op}${b}`;
        if (seen.has(key) && tries < 2500) continue;
        const m = miss === 'gemischt' ? pick(r, ['a', 'b', 'c']) : miss === 'erste' ? 'a' : miss === 'zweite' ? 'b' : 'c';
        t = { a, op, b, c, rest, miss: m }; seen.add(key);
      }
      if (!t) return fail('Mit diesen Einstellungen lassen sich nicht genug passende Aufgaben bilden. Bitte Zahlenraum vergrößern oder Regeln lockern.');
      tasks.push(t);
    }
    return { rules: RULES, tasks };
  }
  function checkPacket(t) {
    if (t.op === '+') return t.a + t.b === t.c;
    if (t.op === '−') return t.a - t.b === t.c;
    if (t.op === '·') return t.a * t.b === t.c;
    if (t.op === ':') return t.b > 0 && Math.floor(t.a / t.b) === t.c && t.a % t.b === (t.rest || 0);
    return false;
  }

  /* ---------- Zahlenmauer (M01) ---------- */
  function wall(o) {
    const levels = clampN(o.levels, 2, 5, 3), count = clampN(o.count, 1, 8, 2), range = clampN(o.range, 4, 100000, 20);
    const zero = !!o.zero, mode = o.mode || 'unten'; const r = rng(o.seed || 1); const walls = [];
    const coef = []; for (let i = 0; i < levels; i++) { let c = 1; for (let k = 0; k < i; k++) c = c * (levels - 1 - k) / (k + 1); coef.push(Math.round(c)); }
    const minTop = coef.reduce((s, c) => s + c * (zero ? 0 : 1), 0);
    if (minTop > range) return fail(`Für ${levels} Reihen braucht der Zahlenraum (Deckstein) mindestens ${minTop}.`);
    for (let w = 0; w < count; w++) {
      let rowsV = null;
      for (let tries = 0; tries < 2000 && !rowsV; tries++) {
        const top = int(r, Math.max(minTop, Math.floor(range * .45)), range);
        const base = []; let rest = top;
        for (let i = 0; i < levels; i++) {
          const remCoef = coef.slice(i + 1).reduce((s, c) => s + c * (zero ? 0 : 1), 0);
          if (i === levels - 1) { if (rest % coef[i]) { base.length = 0; break; } base.push(rest / coef[i]); break; }
          const max = Math.floor((rest - remCoef) / coef[i]); if (max < (zero ? 0 : 1)) { base.length = 0; break; }
          const v = int(r, zero ? 0 : 1, Math.min(max, Math.max(zero ? 0 : 1, Math.floor(max * .8))));
          base.push(v); rest -= v * coef[i];
        }
        if (base.length !== levels || base.some(v => v < (zero ? 0 : 1))) continue;
        const rs = [base]; while (rs[rs.length - 1].length > 1) { const p = rs[rs.length - 1]; rs.push(p.slice(1).map((v, i) => p[i] + v)); }
        if (rs[rs.length - 1][0] > range) continue;
        rowsV = rs;
      }
      if (!rowsV) return fail('Mit diesen Einstellungen lassen sich keine passenden Zahlenmauern bilden.');
      /* sichtbare Steine: eine eindeutig lösbare Auswahl */
      const shown = rowsV.map(row => row.map(() => false));
      const variant = mode === 'gemischt' ? pick(r, ['links', 'rechts', 'spitze']) : mode;
      if (variant === 'unten') shown[0].fill(true);
      else if (variant === 'links') rowsV.forEach((row, i) => { shown[i][0] = true; });
      else if (variant === 'rechts') rowsV.forEach((row, i) => { shown[i][row.length - 1] = true; });
      else { shown[0].fill(true); const hide = int(r, 0, levels - 1); shown[0][hide] = false; shown[levels - 1][0] = true; }
      walls.push({ rows: rowsV, shown });
    }
    return { rules: RULES, walls };
  }

  /* ---------- Zahlenhaus (M02) ---------- */
  function house(o) {
    const range = clampN(o.range, 2, 1000, 10), count = clampN(o.count, 1, 6, 2), floors = clampN(o.floors, 1, 12, 4);
    const zero = o.zero !== false; const r = rng(o.seed || 1); const houses = [];
    for (let h = 0; h < count; h++) {
      const roof = int(r, Math.max(2, Math.ceil(range / 3)), range);
      const opts = []; for (let a = zero ? 0 : 1; a <= roof - (zero ? 0 : 1); a++) opts.push(a);
      if (!opts.length) return fail('Zahlenraum zu klein.');
      const chosen = o.complete ? opts.slice(0, floors) : shuffle(r, opts).slice(0, Math.min(floors, opts.length));
      houses.push({ roof, floors: chosen.map(a => ({ a, b: roof - a, hide: r() < .5 ? 'a' : 'b' })) });
    }
    return { rules: RULES, houses };
  }

  /* ---------- Vergleichen (M12) ---------- */
  function compare(o) {
    const range = clampN(o.range, 3, 1000000, 20), count = clampN(o.count, 1, 40, 8); const r = rng(o.seed || 1); const tasks = [];
    for (let i = 0; i < count; i++) {
      let L, R, lv, rv;
      if (o.mode === 'terme') { const a = int(r, 0, Math.floor(range / 2)), b = int(r, 0, Math.floor(range / 2)), c = int(r, 0, range); L = `${a} + ${b}`; lv = a + b; R = String(c); rv = c; if (r() < .25) { R = String(lv); rv = lv; } }
      else { lv = int(r, 0, range); rv = r() < .15 ? lv : int(r, 0, range); L = String(lv); R = String(rv); }
      tasks.push({ L, R, sol: lv < rv ? '<' : lv > rv ? '>' : '=' });
    }
    return { rules: RULES, tasks };
  }

  /* ---------- Zahlenstrahl (M13) ---------- */
  function numberline(o) {
    const start = Math.floor(+o.start || 0), step = Math.max(1, Math.floor(+o.step || 1)), ticks = clampN(o.ticks, 4, 40, 20);
    const label = clampN(o.label, 1, 40, 5), blanks = clampN(o.blanks, 0, 20, 4); const r = rng(o.seed || 1);
    const vals = Array.from({ length: ticks + 1 }, (_, i) => start + i * step);
    const cand = vals.map((v, i) => i).filter(i => i % label !== 0);
    const pool = cand.length >= blanks ? cand : vals.map((v, i) => i);
    const ask = shuffle(r, pool).slice(0, blanks).sort((a, b) => a - b);
    return { rules: RULES, vals, label, ask };
  }

  /* ---------- Zahlenfolgen / Zahlenreihen (M14) ---------- */
  function sequence(o) {
    const count = clampN(o.count, 1, 12, 4), len0 = clampN(o.length, 4, 12, 7), range = clampN(o.range, 10, 1000000, 100), blanks = clampN(o.blanks, 1, 8, 3);
    const r = rng(o.seed || 1); const rows = []; const seenRows = new Set();
    for (let i = 0; i < count; i++) {
      let row = null;
      for (let tries = 0; tries < 500 && !row; tries++) {
        const kind = o.kind === 'gemischt' ? pick(r, ['+', '−']) : (o.kind || '+');
        const len = kind === '·' ? Math.min(len0, range <= 100 ? 5 : 6) : len0;
        const fixed = +o.step > 0 && kind !== '·' ? Math.floor(+o.step) : 0;
        const st = fixed || (kind === '·' ? (range >= 1000 ? int(r, 2, 4) : int(r, 2, 3)) : int(r, 1, Math.max(2, Math.floor(range / 10))));
        const start = fixed ? (kind === '−' ? st * int(r, len - 1, Math.max(len - 1, Math.floor(range / st))) : st * int(r, 0, Math.max(0, Math.floor(range / st) - len + 1))) : kind === '−' ? int(r, Math.floor(range / 2), range) : kind === '·' ? int(r, 1, Math.max(1, Math.min(12, Math.floor(range / st ** (len - 1))))) : int(r, 0, Math.floor(range / 2));
        const v = [start]; for (let k = 1; k < len; k++) v.push(kind === '+' ? v[k - 1] + st : kind === '−' ? v[k - 1] - st : v[k - 1] * st);
        if (v.some(x => x < 0 || x > range)) continue;
        if (seenRows.has(v.join()) && tries < 400) continue; seenRows.add(v.join());
        const hide = shuffle(r, Array.from({ length: len - 2 }, (_, k) => k + 2)).slice(0, Math.min(blanks, len - 2));
        row = { v, hide, rule: (kind === '·' ? '·' : kind) + ' ' + st };
      }
      if (!row) return fail('Mit diesen Einstellungen lassen sich keine passenden Zahlenfolgen bilden.');
      rows.push(row);
    }
    return { rules: RULES, rows };
  }

  /* ---------- Hundertertafel (M16) ---------- */
  function hundred(o) {
    const start = o.start === 0 ? 0 : 1, hidePct = clampN(o.hide, 0, 100, 30); const r = rng(o.seed || 1);
    const cells = Array.from({ length: 100 }, (_, i) => start + i);
    let hide;
    if (o.pattern === 'reihe') { const k = clampN(o.row, 2, 10, 5); hide = cells.map((v, i) => v % k === 0 ? i : -1).filter(i => i >= 0); }
    else if (o.pattern === 'diagonale') hide = cells.map((v, i) => (i % 10) === Math.floor(i / 10) || (i % 10) === 9 - Math.floor(i / 10) ? i : -1).filter(i => i >= 0);
    else hide = shuffle(r, cells.map((v, i) => i)).slice(0, Math.round(100 * hidePct / 100));
    return { rules: RULES, cells, hide: hide.sort((a, b) => a - b) };
  }

  /* ---------- Schriftlich rechnen (M08) – Addition, Subtraktion (Abziehverfahren), Multiplikation mit einstelligem Faktor ---------- */
  function written(o) {
    const digits = clampN(o.digits, 2, 7, 3), count = clampN(o.count, 1, 12, 4), op = o.op || '+', carry = o.carry || 'mixed', terms = clampN(o.terms, 2, 4, 2);
    const r = rng(o.seed || 1); const tasks = []; const lo = 10 ** (digits - 1), hi = 10 ** digits - 1;
    for (let i = 0; i < count; i++) {
      let t = null;
      for (let tries = 0; tries < 3000 && !t; tries++) {
        if (op === '+') {
          const ns = Array.from({ length: terms }, () => int(r, lo, hi)); const sum = ns.reduce((s, n) => s + n, 0);
          let has = false; { let acc = ns[0]; for (let k = 1; k < ns.length; k++) { if (anyCarry(acc, ns[k], '+')) has = true; acc += ns[k]; } }
          if (carry === 'none' && has) continue; if (carry === 'required' && !has) continue;
          t = { op, ns, res: sum };
        } else if (op === '−') {
          const a = int(r, lo, hi), b = int(r, Math.max(1, Math.floor(lo / 10)), a); const has = anyCarry(a, b, '−');
          if (b >= a) continue; if (carry === 'none' && has) continue; if (carry === 'required' && !has) continue;
          t = { op, ns: [a, b], res: a - b };
        } else {
          const a = int(r, lo, hi), b = int(r, 2, 9); t = { op: '·', ns: [a, b], res: a * b };
        }
      }
      if (!t) return fail('Mit diesen Einstellungen lassen sich keine passenden Aufgaben bilden.');
      tasks.push(t);
    }
    return { rules: RULES, tasks };
  }

  /* ---------- Uhrzeiten (M21) ---------- */
  function clock(o) {
    const count = clampN(o.count, 1, 12, 6), step = { voll: 60, halb: 30, viertel: 15, '5': 5, '1': 1 }[o.step || 'viertel'] || 15; const r = rng(o.seed || 1); const times = []; const seen = new Set();
    for (let i = 0; i < count; i++) { let h, m, k = 0; do { h = int(r, 1, 12); m = step * int(r, 0, 60 / step - 1); k++; } while (seen.has(h * 60 + m) && k < 50); seen.add(h * 60 + m); times.push({ h, m }); }
    return { rules: RULES, times };
  }

  /* ---------- Wortsuchgitter (S09) ---------- */
  function wordsearch(o) {
    const n = clampN(o.size, 6, 20, 10); const r = rng(o.seed || 1);
    const words = String(o.words || '').split(/[,;\n]+/).map(w => w.trim().toUpperCase().replace(/\s+/g, '')).filter(Boolean);
    const dirs = [[0, 1], [1, 0]]; if (o.diagonal) dirs.push([1, 1], [-1, 1]); if (o.backwards) dirs.push(...dirs.map(([a, b]) => [-a, -b]));
    const grid = Array.from({ length: n }, () => Array(n).fill('')); const placed = [], missing = [];
    for (const w of words.slice(0, 30)) {
      const ch = [...w]; let ok = false;
      if (ch.length <= n) for (let tries = 0; tries < 400 && !ok; tries++) {
        const [dr, dc] = pick(r, dirs); const r0 = int(r, 0, n - 1), c0 = int(r, 0, n - 1);
        const er = r0 + dr * (ch.length - 1), ec = c0 + dc * (ch.length - 1); if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        if (ch.every((x, i) => { const g = grid[r0 + dr * i][c0 + dc * i]; return !g || g === x; })) { ch.forEach((x, i) => { grid[r0 + dr * i][c0 + dc * i] = x; }); placed.push({ w, r: r0, c: c0, dr, dc, len: ch.length }); ok = true; }
      }
      if (!ok) missing.push(w);
    }
    const fill = o.umlaut ? 'ABCDEFGHIJKLMNOPRSTUVWZÄÖÜEEINRST' : 'ABCDEFGHIJKLMNOPRSTUVWZEEINRST';
    for (const row of grid) for (let i = 0; i < n; i++) if (!row[i]) row[i] = fill[Math.floor(r() * fill.length)];
    return { rules: RULES, n, grid, placed, missing };
  }

  /* ---------- Buchstaben- und Satzsalat (S08, S10) ---------- */
  function scramble(o) {
    const r = rng(o.seed || 1);
    const items = String(o.words || '').split(/\n|;|(?<=[^.!?]),(?=\s*\S)/).map(s => s.trim()).filter(Boolean).slice(0, 30);
    const out = items.map(w => {
      if (o.mode === 'saetze') { const parts = w.split(/\s+/); if (parts.length < 2) return { src: w, mix: w }; let m, k = 0; do { m = shuffle(r, parts); k++; } while (m.join(' ') === parts.join(' ') && k < 20); return { src: w, mix: m.join(' / ') }; }
      const letters = [...w]; if (letters.length < 2) return { src: w, mix: w };
      const keepFirst = !!o.keepFirst; const head = keepFirst ? letters.slice(0, 1) : [], body = keepFirst ? letters.slice(1) : letters;
      let m, k = 0; do { m = head.concat(shuffle(r, body)); k++; } while (m.join('') === letters.join('') && k < 20);
      const joined = m.join(o.spaced === false ? '' : ' ');
      return { src: w, mix: keepFirst ? joined : joined.toLowerCase() };
    });
    return { rules: RULES, items: out };
  }

  /* ---------- Zuordnen (Paare mischen) ---------- */
  function match(o) {
    const pairs = (o.pairs || []).filter(p => (p.l || '').trim() || (p.r || '').trim()); const r = rng(o.seed || 1);
    let order = pairs.map((p, i) => i); if (pairs.length > 1) { let k = 0; do { order = shuffle(r, order); k++; } while (order.every((v, i) => v === i) && k < 20); }
    return { rules: RULES, order };
  }
  /* Vokabeln: welche Seite ist gefragt */
  function vocab(o) {
    const r = rng(o.seed || 1); const n = (o.pairs || []).length;
    const ask = Array.from({ length: n }, () => o.dir === 'gemischt' ? (r() < .5 ? 'l' : 'r') : o.dir === 'links' ? 'l' : 'r');
    const order = o.shuffle ? shuffle(r, Array.from({ length: n }, (_, i) => i)) : Array.from({ length: n }, (_, i) => i);
    return { rules: RULES, ask, order };
  }
  /* Ankreuzaufgabe: Reihenfolge der Antworten mischen (optional) */
  function choice(o) { const r = rng(o.seed || 1); const n = (o.options || []).length; return { rules: RULES, order: o.shuffle ? shuffle(r, Array.from({ length: n }, (_, i) => i)) : Array.from({ length: n }, (_, i) => i) }; }
  /* Lückentext: Wortliste in gemischter Reihenfolge */
  function gaps(o) { const r = rng(o.seed || 1); const words = []; String(o.text || '').replace(/\[([^\]]+)\]/g, (m, w) => { words.push(w); return m; }); return { rules: RULES, bank: shuffle(r, words) }; }


  /* ---------- Inhalte aus den eigenen Sammlungen (pools.js) ----------
     fill(it) schreibt neue, zufällig gewählte Inhalte in die normalen (bearbeitbaren) Felder des Bausteins.
     Quelle „eigene“ = nichts überschreiben. */
  const P = () => root.FolivaPools || (typeof require !== 'undefined' ? require('./pools.js') : null);
  const pickN = (r, arr, n) => shuffle(r, arr).slice(0, Math.max(0, Math.min(arr.length, n)));
  /* Klassenstufe für Wort- und Satzsammlungen: '12' = kurze, lautgetreue Wörter bzw. kurze Sätze; '34' = längere. Reicht die Auswahl nicht, werden die passendsten ergänzt. */
  let LEVEL = '';
  const RARE = /[cqvxy]|ph/;
  const nounScore = x => { const w = String(x.w || ''); const pl = w.toLowerCase().replace(/sch|ch|ck/g, ''); return w.length + (RARE.test(pl) ? 3 : 0) + (/[^a-zäöüß]/i.test(w) ? 3 : 0); };
  const sentLen = x => String(x).replace(/[\[\]]/g, '').split(/\s+/).filter(Boolean).length;
  function byLevel(list, kind, lv = LEVEL) {
    if (!lv || !Array.isArray(list) || list.length < 7) return list;
    const sc = kind === 'SENTENCES' ? sentLen : nounScore;
    const ok = kind === 'SENTENCES' ? (lv === '12' ? x => sentLen(x) <= 6 : x => sentLen(x) >= 6)
      : (lv === '12' ? x => nounScore(x) <= 6 : x => String(x.w || '').length >= 5);
    const f = list.filter(ok); if (f.length >= 6) return f;
    return [...list].sort((a, b) => lv === '12' ? sc(a) - sc(b) : sc(b) - sc(a)).slice(0, Math.max(6, f.length));
  }
  function themeList(group, key) { const g = P()[group]; const l = (g[key] || g[Object.keys(g)[0]]).list; return group === 'NOUNS' || group === 'SENTENCES' ? byLevel(l, group) : l; }
  function mathPairs(r, o, n) {
    const res = packet({ op: o.mop || '+', range: o.range || 20, count: n * 3, transition: 'mixed', seed: Math.floor(r() * 1e9) + 1 });
    if (res.error) return [];
    const seen = new Set(), out = [];
    for (const t of res.tasks) { if (seen.has(t.c) || out.length >= n) continue; seen.add(t.c); out.push({ l: `${t.a} ${t.op} ${t.b}`, r: String(t.c) + (t.rest ? ` R ${t.rest}` : '') }); }
    return out;
  }
  const FILL = {
    gap(it, r) {
      const n = clampN(it.n, 1, 14, 5); const used = new Set(); const out = [];
      /* jedes Lösungswort nur einmal – sonst steht es doppelt im Wörterkasten */
      for (const x of shuffle(r, themeList('SENTENCES', it.theme))) { const ws = []; String(x).replace(/\[([^\]]+)\]/g, (m, w) => { ws.push(w.toLowerCase()); return m; }); if (ws.some(w => used.has(w))) continue; ws.forEach(w => used.add(w)); out.push(x); if (out.length >= n) break; }
      it.text = out.join('\n');
    },
    scramble(it, r) {
      const n = clampN(it.n, 1, 20, 5);
      if (it.mode === 'saetze') it.words = pickN(r, themeList('SENTENCES', it.theme in P().SENTENCES ? it.theme : 'tiere'), n).map(x => x.replace(/[\[\]]/g, '').replace(/[.!?]$/, '')).join('\n');
      else { const max = clampN(it.maxLen, 3, 15, 8); it.words = pickN(r, themeList('NOUNS', it.theme in P().NOUNS ? it.theme : 'tiere').filter(x => x.w.length <= max && /^[A-Za-zÄÖÜäöüß]+$/.test(x.w)), n).map(x => x.w).join('\n'); }
    },
    wordsearch(it, r) { const n = clampN(it.n, 2, 20, 6), size = clampN(it.size, 6, 20, 10); it.words = pickN(r, themeList('NOUNS', it.theme).filter(x => x.w.length <= size && /^[A-Za-zÄÖÜäöüß]+$/.test(x.w)), n).map(x => x.w).join(', '); },
    vocab(it, r) { const L = P().VOCAB[it.lang] || P().VOCAB.en; const th = L.themes[it.theme] || Object.values(L.themes)[0]; it.pairs = pickN(r, th.list, clampN(it.n, 1, 20, 6)).map(x => ({ ...x })); it.left = 'Deutsch'; it.right = L.name; },
    match(it, r) {
      const n = clampN(it.n, 2, 12, 5), pp = P();
      if (it.source === 'rechnen') it.pairs = mathPairs(r, it, n);
      else if (it.source === 'mehrzahl') it.pairs = pickN(r, themeList('NOUNS', it.theme).filter(x => x.p && x.p !== '-' && x.p !== x.w), n).map(x => ({ l: `${x.a} ${x.w}`, r: `die ${x.p}` }));
      else if (it.source === 'gegenteil') it.pairs = pickN(r, pp.ANTONYMS, n).map(x => ({ ...x }));
      else if (it.source === 'verben') it.pairs = pickN(r, pp.VERBS, n).map(x => ({ l: x.g, r: x.v }));
      else if (it.source === 'vokabeln') { const L = pp.VOCAB[it.lang] || pp.VOCAB.en; const th = L.themes[it.theme] || Object.values(L.themes)[0]; it.pairs = pickN(r, th.list, n).map(x => ({ ...x })); }
    },
    choice(it, r) {
      if (it.source === 'rechnen') {
        const res = packet({ op: it.mop || '+', range: it.range || 20, count: 1, transition: 'mixed', seed: Math.floor(r() * 1e9) + 1 }); if (res.error) return;
        const t = res.tasks[0], c = t.c; const d = new Set([c]); const cand = [c + 1, c - 1, c + 10, c - 10, c + 2, c - 2].filter(x => x >= 0);
        for (const x of shuffle(r, cand)) { if (d.size >= 3) break; d.add(x); }
        it.question = `${t.a} ${t.op} ${t.b} =`; it.options = shuffle(r, [...d]).map(x => ({ t: String(x), ok: x === c }));
      } else if (it.source === 'artikel') {
        const w = pickN(r, themeList('NOUNS', it.theme), 1)[0];
        it.question = `___ ${w.w}`; it.options = ['der', 'die', 'das'].map(a => ({ t: a, ok: a === w.a }));
      }
    },
    sachaufgabe(it, r) {
      const op = it.sop === 'gemischt' ? pick(r, ['+', '−', '·', ':']) : (it.sop || '+'), range = clampN(it.range, 10, 10000, 100);
      const tpl = pick(r, P().SACH[op]); const names = shuffle(r, P().NAMES), o = pick(r, P().THINGS);
      let a, b, c;
      for (let k = 0; k < 500; k++) {
        if (op === '+') { c = int(r, 5, range); a = int(r, 2, c - 2); b = c - a; }
        else if (op === '−') { a = int(r, 5, range); b = int(r, 2, a - 2); c = a - b; }
        else if (op === '·') { a = int(r, 2, 10); b = int(r, 2, 10); c = a * b; }
        else { b = int(r, 2, 10); c = int(r, 2, 10); a = b * c; }
        if (Math.max(a, b, c) <= range && Math.min(a, b, c) >= 2) break;
      }
      const f = s => s.replace(/\{A\}/g, names[0]).replace(/\{B\}/g, names[1]).replace(/\{o\}/g, o).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, c);
      it.text = f(tpl.t); it.solF = f(tpl.f); it.solR = `${a} ${op} ${b} = ${c}`; it.solA = f(tpl.ans);
    },
  };
  function fill(it) { if (!it.source || it.source === 'eigene' || !FILL[it.type]) return false; LEVEL = it.stufe === '12' || it.stufe === '34' ? it.stufe : ''; try { FILL[it.type](it, rng((it.seed || 1) * 7 + 3)); } finally { LEVEL = ''; } return true; }

  const API = { fill, FILL, byLevel, level: () => LEVEL, RULES, rng, shuffle, newSeed, PACKET_OPS, packet, checkPacket, wall, house, compare, numberline, sequence, hundred, written, clock, wordsearch, scramble, match, vocab, choice, gaps, anyCarry, crossAdd, crossSub };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.FolivaGen = API;
})(typeof window !== 'undefined' ? window : globalThis);
