/* Foliva – Aufgaben zum Baustein „Gedicht“ ab 0.9.12 · © 2026 theis
   Reimwörter finden (ohne Wörterbuch, nach dem Klang der Wortenden), Verse mischen, Elfchen-Beispiel wählen,
   Gedicht aus der Sammlung nach Thema und Klassenstufe. Alles deterministisch über „seed“. */
(function (root) {
  'use strict';
  const G = root.FolivaGen || (typeof require !== 'undefined' ? require('./gen4.js') : null);
  const P = () => root.FolivaPools || (typeof require !== 'undefined' ? require('./gedichte.js') : {});
  const { rng, shuffle } = G;
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  const stanzas = text => { const out = [[]]; String(text || '').replace(/\r/g, '').split('\n').forEach(l => { const t = l.trim(); if (!t) { if (out[out.length - 1].length) out.push([]); } else out[out.length - 1].push(t); }); if (!out[out.length - 1].length) out.pop(); return out; };
  const lastWord = line => { const m = /([A-Za-zÄÖÜäöüßẞ]+(?:[-’'][A-Za-zÄÖÜäöüß]+)*)[^A-Za-zÄÖÜäöüßẞ]*$/.exec(line); return m ? m[1] : ''; };

  /* Klang des Wortendes: ab dem letzten betonten Vokal (bei Endungen wie -e, -en, -er, -el ab dem vorletzten) */
  const STRESSED_E = /(eh|ee|é)$/i;
  function rhymeKey(word) {
    const orig = String(word || '').toLowerCase().replace(/[’']/g, ''); if (!orig) return '';
    let s = orig.replace(/ß/g, 's').replace(/ck/g, 'k').replace(/ph/g, 'f').replace(/th/g, 't').replace(/v/g, 'f').replace(/dt$/, 't').replace(/tz/g, 'z').replace(/qu/g, 'kw')
      .replace(/äu|eu/g, 'ei').replace(/ai/g, 'ei').replace(/ä/g, 'e').replace(/ie/g, 'i').replace(/y/g, 'i').replace(/ü/g, 'i').replace(/ö/g, 'e')   /* unreine Reime zählen: Gemüt – Lied, Geläute – Weite */
      .replace(/([aeiou])h(?![aeiou])/g, '$1').replace(/([aeiou])\1/g, '$1').replace(/([bcdfgklmnprstz])\1/g, '$1')
      .replace(/b$/, 'p').replace(/d$/, 't').replace(/g$/, 'k');
    const groups = [...s.matchAll(/ei|au|[aeiou]/g)]; if (!groups.length) return s;
    let gi = groups.length - 1; const tail = s.slice(groups[gi].index);
    if (gi > 0 && /^e(n|r|l|m|s|t|rn|ln|nd)?$/.test(tail) && !STRESSED_E.test(orig) && !/^(ade|juchhe|hurra)$/.test(orig)) gi--;
    return s.slice(groups[gi].index);
  }
  /* Zeilen (fortlaufend gezählt), deren letztes Wort sich auf eine vorige Zeile derselben Strophe reimt */
  function rhymeLines(st) {
    const out = []; let n = 0;
    st.forEach(sz => {
      const keys = sz.map(l => { const w = lastWord(l); return { w: w.toLowerCase(), k: rhymeKey(w) }; });
      keys.forEach((x, j) => { if (!x.k || x.w.length < 2) return; for (let i = j - 1; i >= Math.max(0, j - 4); i--) { if (keys[i].k === x.k && keys[i].w !== x.w) { out.push(n + j); break; } } });
      n += sz.length;
    });
    return out;
  }
  const verseCount = st => st.reduce((s, x) => s + x.length, 0);
  const suits = (p, mode) => { const st = stanzas(p.text); if (mode === 'reime') { if (p.elfchen) return false; const g = rhymeLines(st), L = st.flat(); const words = g.map(i => lastWord(L[i]).toLowerCase()); return g.length >= 2 && new Set(words).size === words.length && new Set(L.map(l => l.toLowerCase())).size === L.length; } if (mode === 'ordnen') { const L = st.flat().slice(0, 8); return verseCount(st) >= 4 && new Set(L.map(l => l.toLowerCase())).size === L.length && L.every(l => l.split(/\s+/).length >= 3) && !p.elfchen; } if (mode === 'abschreiben') return verseCount(st) <= 14; return true; };

  /* Aufgabe aus dem Gedicht */
  G.gedicht = function (it) {
    const r = rng((it.seed || 1) * 13 + 5); const mode = it.mode || 'lesen'; const d = { mode };
    if (mode === 'elfchen') {
      const all = P().ELFCHEN || []; const lv = it.stufe === '12' || it.stufe === '34' ? it.stufe : '';
      let L = all.filter(x => (!it.gtheme || it.gtheme === 'alle' || x.theme === it.gtheme)); if (lv && L.some(x => x.stufe === lv)) L = L.filter(x => x.stufe === lv); if (!L.length) L = all;
      const x = pick(r, L); if (x) d.ex = x.text; return d;
    }
    const st = stanzas(it.text);
    if (mode === 'reime') {
      let g = rhymeLines(st);
      if (g.length < 1) { g = []; let n = 0; st.forEach(sz => { sz.forEach((l, j) => { if (j % 2 === 1 && lastWord(l)) g.push(n + j); }); n += sz.length; }); }
      d.gaps = g; d.bankOrder = shuffle(r, g.map((_, i) => i));
      if (d.bankOrder.length > 2 && d.bankOrder.every((v, i) => v === i)) d.bankOrder.push(d.bankOrder.shift());
    }
    if (mode === 'ordnen') {
      let lines = []; let more = false;
      for (const sz of st) { if (lines.length && lines.length + sz.length > 8) { more = true; break; } lines.push(...sz); }
      if (lines.length > 8) { lines = lines.slice(0, 8); more = true; }
      const idx = lines.map((_, i) => i); let order = idx;
      for (let t = 0; t < 12 && order.every((v, i) => v === i); t++) order = shuffle(r, idx);
      d.lines = lines; d.order = order; d.more = more;
    }
    return d;
  };

  /* Gedicht aus der Sammlung */
  G.FILL.gedicht = function (it, r) {
    const p = P(); const mode = it.mode || 'lesen'; if (mode === 'elfchen') return;
    const lv = G.level ? G.level() : (it.stufe || '');
    const all = (p.GEDICHTE || []).concat(mode === 'lesen' || mode === 'abschreiben' ? (p.ELFCHEN || []) : []);
    const th = x => !it.gtheme || it.gtheme === 'alle' || x.theme === it.gtheme;
    const tries = [x => th(x) && (!lv || x.stufe === lv) && suits(x, mode), x => th(x) && suits(x, mode), x => (!lv || x.stufe === lv) && suits(x, mode), x => suits(x, mode)];
    let L = []; for (const f of tries) { L = all.filter(f); if (L.length) break; }
    const other = L.filter(x => x.id !== it.pid); const x = pick(r, other.length ? other : L); if (!x) return;
    it.pid = x.id; it.ptitle = x.title; it.author = x.author || ''; it.text = x.text;
  };
  G.gedichtSuits = (it, mode) => suits({ text: it.text, elfchen: false }, mode);
  G.rhymeKey = rhymeKey; G.rhymeLines = rhymeLines; G.stanzas = stanzas;
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
