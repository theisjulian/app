/* Foliva – Aufgaben ab 0.9.13 · © 2026 theis
   – Einmaleins am Punktefeld (Malwinkel am Hunderterpunktfeld, Punktefelder, Kernaufgaben)
   – Anlauttabelle (Buchstaben mit Bild aus der Foliva-Bildersammlung)
   – Lernwörter aus dem Foliva-Lernwortschatz oder der eigenen Schulliste für Lernwörter, Wortsuchgitter, ABC, Buchstabensalat
   Alles deterministisch über „seed“. */
(function (root) {
  'use strict';
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen5.js') : null);
  const LW = () => root.FolivaLernwoerter || (typeof require !== 'undefined' ? require('./lernwoerter.js') : null);
  const P = () => root.FolivaPools || (typeof require !== 'undefined' ? require('./gedichte.js') : {});
  const { rng, shuffle } = G;
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const clampN = (v, lo, hi, d) => { v = Math.floor(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };

  /* ---------- Einmaleins am Punktefeld ---------- */
  const parseRows = s => [...new Set(String(s || '').split(/[^0-9]+/).map(Number).filter(n => n >= 1 && n <= 10))];
  G.malfeld = function (it) {
    const r = rng((it.seed || 1) * 17 + 3); const mode = it.mode || 'winkel';
    const max = clampN(it.maxF, 2, 10, 10); const rows = parseRows(it.rows).filter(n => n <= max);
    const n = clampN(it.count, 1, 12, 6);
    const pool = [];
    for (let a = 1; a <= max; a++) for (let b = 1; b <= max; b++) {
      if (rows.length && !rows.includes(a) && !rows.includes(b)) continue;
      if (mode === 'zerlegen' && a <= 5) continue;               /* Kernaufgaben: erst ab 6 zerlegen */
      if (a * b < 2 || (mode !== 'zerlegen' && (a === 1 || b === 1) && max > 3)) continue;
      pool.push({ a, b });
    }
    if (!pool.length) return { error: 'Mit diesen Einstellungen gibt es keine Aufgaben. Bitte Reihen oder größten Faktor ändern.' };
    let tasks = shuffle(r, pool);
    /* möglichst keine Tauschaufgabe doppelt */
    const seen = new Set(); const out = [];
    for (const t of tasks) { const k = Math.min(t.a, t.b) + 'x' + Math.max(t.a, t.b); if (seen.has(k)) continue; seen.add(k); out.push(t); if (out.length >= n) break; }
    for (const t of tasks) { if (out.length >= n) break; if (!out.includes(t)) out.push(t); }
    return { mode, tasks: out.slice(0, n).map(t => ({ ...t, c: t.a * t.b })) };
  };

  /* ---------- Anlauttabelle ---------- */
  /* Anlautwörter mit Bild (nur eindeutige Anlaute: A wie Affe, nicht Auto) */
  const ANL = {
    A: ['Affe', 'Ameise', 'Ananas', 'Apfel', 'Anker', 'Ampel'], B: ['Banane', 'Biene', 'Buch', 'Boot', 'Birne', 'Bus'], C: ['Computer'], D: ['Dachs', 'Delfin', 'Drachen'],
    E: ['Esel', 'Ente', 'Elefant', 'Erdbeere'], F: ['Fisch', 'Fuchs', 'Frosch', 'Feuer'], G: ['Gans', 'Giraffe', 'Gurke', 'Geige', 'Gitarre'], H: ['Hund', 'Hase', 'Haus', 'Hut', 'Hahn'],
    I: ['Igel', 'Insel'], J: ['Jacke', 'Junge'], K: ['Katze', 'Kuh', 'Kerze', 'Käse', 'Kamel'], L: ['Löwe', 'Leiter', 'Löffel', 'Lineal'], M: ['Maus', 'Mond', 'Melone', 'Mais'],
    N: ['Nase', 'Note', 'Nebel'], O: ['Ohr', 'Oma', 'Opa', 'Orange'], P: ['Pinsel', 'Pilz', 'Pinguin', 'Papagei', 'Pizza'], Q: ['Qualle'], R: ['Rose', 'Regen', 'Rakete', 'Roller', 'Robbe'],
    S: ['Sonne', 'Sofa', 'Saft', 'Seife', 'Socke'], T: ['Tomate', 'Tiger', 'Tasse', 'Torte', 'Tulpe'], U: ['Uhr'], V: ['Vogel'], W: ['Wal', 'Wolke', 'Wolf', 'Würfel'], X: [], Y: [], Z: ['Zebra', 'Zug', 'Zahn', 'Zitrone', 'Ziege'],
    'Ä': ['Ärztin'], 'Ö': [], 'Ü': [], Au: ['Auto', 'Auge'], Ei: ['Eis', 'Eimer', 'Ei'], Eu: ['Eule'], Sch: ['Schaf', 'Schere', 'Schiff', 'Schuh', 'Schnecke'], Sp: ['Spinne', 'Spiegel'], St: ['Stern', 'Stuhl', 'Stiefel', 'Stein'], Pf: ['Pferd', 'Pfirsich'],
  };
  /* Wörter ohne Bild in der Sammlung: nur als Wort (Kinder malen selbst) */
  const ANL_TEXT = { X: 'Xylofon', Y: 'Yo-Yo', 'Ö': 'Öl', 'Ü': 'Überraschung', C: 'Clown' };
  /* Bilder aus der Bildbibliothek für Anlaute ohne Bild in der Wortsammlung */
  const ANL_IMG = { 'Öl': 'emoji_u1f6e2.svg', 'Yo-Yo': 'emoji_u1fa80.svg', 'Überraschung': 'emoji_u1f381.svg' };
  const SETS = {
    abc: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' '),
    abcplus: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Ä Ö Ü Au Ei Eu Sch Sp St Pf'.split(' '),
    ohne: 'A B D E F G H I J K L M N O P R S T U W Z Au Ei Eu Sch'.split(' '),
  };
  const normLetter = s => { const t = String(s || '').trim(); if (!t) return ''; const u = t[0].toUpperCase() + t.slice(1).toLowerCase(); return ANL[u] ? u : ''; };
  G.anlaut = function (it) {
    const r = rng((it.seed || 1) * 19 + 7); const pics = P().PICS || {};
    let letters = it.set === 'auswahl' ? String(it.letters || '').split(/[\s,;]+/).map(normLetter).filter(Boolean) : (SETS[it.set] || SETS.abc).slice();
    letters = [...new Set(letters)];
    if (!letters.length) return { error: 'Bitte Buchstaben angeben, z. B. „M, A, L, I, O“.' };
    if (it.shuffle) letters = shuffle(r, letters);
    const cells = letters.map(L => { const cand = (ANL[L] || []).filter(w => pics[w]); const w = cand.length ? cand[it.vary ? Math.floor(r() * cand.length) : 0] : ''; const tw = ANL_TEXT[L] || ''; return { L, w: w || tw, img: w ? pics[w] : (ANL_IMG[tw] || '') }; });
    return { cells };
  };
  G.ANLAUT = ANL;

  /* ---------- Lernwörter aus dem Lernwortschatz ---------- */
  const pickN = (r, a, n) => shuffle(r, a).slice(0, n);
  const lwList = it => { const L = LW(); if (!L) return []; return L.words(it.stufe, it.lwb || 'alle', it.lwsrc || 'beide'); };
  const singleWord = x => /^[A-Za-zÄÖÜäöüß]+$/.test(x.wort);
  const wrap = (type, fn) => { const base = G.FILL[type]; G.FILL[type] = (it, r) => it.source === 'lernwoerter' ? fn(it, r) : base && base(it, r); };
  wrap('wordlist', (it, r) => { const L = lwList(it); it.words = pickN(r, L, clampN(it.n, 3, 20, 8)).map(x => it.article === false || !x.art ? x.wort : x.w).join('\n'); });
  wrap('wordsearch', (it, r) => { const size = clampN(it.size, 6, 20, 10); it.words = pickN(r, lwList(it).filter(x => singleWord(x) && x.wort.length <= size && x.wort.length >= 3), clampN(it.n, 2, 20, 6)).map(x => x.wort).join(', '); });
  wrap('abc', (it, r) => { const L = lwList(it).filter(x => singleWord(x)); const seen = new Set(); it.words = pickN(r, L, 40).filter(x => { const k = x.wort.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, clampN(it.n, 3, 16, 6)).map(x => x.wort).join('\n'); });
  wrap('scramble', (it, r) => { if (it.mode === 'saetze') return; const max = clampN(it.maxLen, 3, 15, 8); it.words = pickN(r, lwList(it).filter(x => singleWord(x) && x.wort.length <= max && x.wort.length >= 3), clampN(it.n, 1, 20, 5)).map(x => x.wort).join('\n'); });

  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
