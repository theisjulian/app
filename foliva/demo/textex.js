/* Foliva – Übungen direkt auf einen Text anwenden (wie im Deutschunterricht üblich)
   Silben färben, Silbenbögen, Selbstlaute hervorheben, Buchstaben markieren,
   Lückentext, Wörter/Sätze schütteln, rückwärts, Wörterschlange, nur Groß-/Kleinbuchstaben.
   Der Originaltext bleibt immer unverändert gespeichert – die Übung wird nur beim Darstellen angewendet. */
(function (root) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function rng(seed) { let v = (seed >>> 0) || 1; return () => { v = (Math.imul(v ^ (v >>> 15), 2246822519) + 1013904223) >>> 0; v ^= v >>> 13; return (v >>> 0) / 4294967296; }; }
  function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---------- Silbentrennung (Regeln der Grundschule, ohne Wörterbuch) ----------
     Handtrennung im Text ist jederzeit möglich: Haus|auf|ga|be  */
  const V = 'aeiouyäöüAEIOUYÄÖÜ';
  const isV = c => !!c && V.includes(c);
  const NUC = ['eau', 'äu', 'Äu', 'au', 'Au', 'ei', 'Ei', 'ai', 'Ai', 'eu', 'Eu', 'ie', 'Ie', 'ou', 'Ou', 'aa', 'Aa', 'ee', 'Ee', 'oo', 'Oo'];
  const KEEP = ['sch', 'ch', 'ck', 'ph', 'th', 'qu', 'gh'];      /* werden nicht getrennt */
  const PREFIX = ['haus', 'über', 'unter', 'ver', 'zer', 'ent', 'auf', 'aus', 'ein', 'un', 'miss', 'vor', 'her', 'hin', 'weg', 'zu'];
  /* Konsonant + l/r gehört zusammen in die nächste Silbe: Ze-bra, Zi-tro-ne, Fe-bru-ar, Kno-blauch */
  const CL2 = /^(bl|br|dr|fl|fr|gl|gr|kl|kr|pl|pr|tr)$/;
  /* „ie“ vor n als zwei Laute (Fe-ri-en, Fa-mi-li-en) – nur in diesen Wortteilen, sonst ein langes i (Bie-ne, Fa-mi-lie, Bat-te-rie) */
  const IE2 = ['famili', 'lilie', 'linie', 'ferien', 'kastanie', 'petersilie', 'geranie', 'serie', 'studie', 'prämie', 'folie', 'italien', 'spanien', 'belgien', 'asien', 'marien', 'tragödie', 'komödie', 'aktie', 'arie', 'begonie', 'dahlie', 'pinie', 'ingenieur', 'australien', 'brasilien', 'kolumbien', 'indien', 'serbien', 'kroatien', 'albanien', 'tunesien', 'arabien', 'oktobermärchen'];
  /* Nachsilben, vor denen getrennt wird, wenn ein Mitlaut davorsteht: Lieb-ling, fröh-lich, Seg-ler, Zeug-nis */
  const SUF = ['ling', 'lich', 'ler', 'nis'];
  function nuclei(w) {
    const out = []; let i = 0; const lw = w.toLowerCase();
    const ie2 = new Set(); IE2.forEach(st => { let k = lw.indexOf(st); while (k >= 0) { const j = lw.indexOf('ie', k); if (j >= 0 && j < k + st.length && lw[j + 2] === 'n') ie2.add(j); k = lw.indexOf(st, k + 1); } });
    while (i < w.length) {
      if (isV(w[i]) && !((w[i] === 'u' || w[i] === 'U') && i > 0 && /q/i.test(w[i - 1]))) { let n = NUC.find(d => w.startsWith(d, i)); if (n && /^ie$/i.test(n) && (i === 0 || ie2.has(i))) n = null; const len = n ? n.length : 1; out.push([i, i + len]); i += len; }
      else i++;
    }
    return out;
  }
  function splitCluster(c) {
    /* Konsonantenfolge zwischen zwei Vokalen: der letzte (untrennbare) Laut geht zur nächsten Silbe */
    if (!c.length) return 0;
    if (CL2.test(c.toLowerCase())) return 0;
    for (const k of KEEP) if (c.toLowerCase().endsWith(k)) { if (c.length === k.length) return 0; return c.length - k.length; }
    if (c.length >= 3 && /(bl|br|fl|fr|gl|gr|kl|kr|pl|pr|dr|tr)$/i.test(c)) return c.length - 2;   /* Aus-flug, Zen-trum */
    if (c.endsWith('ß') && c.length === 1) return 0;
    return c.length - 1;
  }
  function sylPlain(w) {
    if (w.length < 3) return [w];
    const lw = w.toLowerCase();
    for (const p of PREFIX) if (lw.length > p.length + 2 && lw.startsWith(p) && isV(lw[p.length]) && !(p === 'ein' || p === 'un' && lw.startsWith('uni'))) return [...sylPlain(w.slice(0, p.length)), ...sylPlain(w.slice(p.length))];
    const nu = nuclei(w); if (nu.length < 2) return [w];
    const cuts = [];
    for (let k = 0; k < nu.length - 1; k++) {
      const a = nu[k][1], b = nu[k + 1][0]; const cl = w.slice(a, b);
      if (!cl.length) { cuts.push(a); continue; }               /* zwei Vokale nebeneinander: Ru-ine, Mu-se-um */
      if (cl === 'h' && k === nu.length - 2 && /^e[nlr]?$|^e(n|l|r)$/.test(w.slice(b))) { cuts.push(a); continue; } /* seh-en → se-hen */
      cuts.push(a + splitCluster(cl));
    }
    /* Nachsilbe nach Mitlaut: dort trennen (statt Lie-bling) */
    for (const s of SUF) { const at = lw.length - s.length; if (at >= 2 && lw.endsWith(s) && !isV(lw[at - 1]) && nu[0][1] <= at - 1) { for (let k = cuts.length - 1; k >= 0; k--) if (cuts[k] > at - 3 && cuts[k] !== at) { cuts[k] = at; break; } break; } }
    const parts = []; let s = 0; cuts.sort((x, y) => x - y).forEach(c => { if (c > s) { parts.push(w.slice(s, c)); s = c; } }); parts.push(w.slice(s));
    return parts.filter(Boolean);
  }
  /* ---------- Zusammengesetzte Wörter: an der Wortfuge trennen (Blei-stift, Schnee-flo-cke, Mit-tag-es-sen) ----------
     Wortschatz: Nomen der Sammlung (mit geprüften Silben) und häufige Wortteile. */
  const STEMS = ('blei stift früh stück hub schrauber zebra streifen blümchen blume mittag essen eis zeug tag nacht morgen abend haus tür schlüssel spiel platz wagen bahn hof straße feuer wehr wasser hahn ball fuß not ruf hand schuh schuhe kopf tuch bett decke kissen schrank tisch stuhl lampe licht kerze baum blatt blätter wald wiese feld berg see meer strand sand burg schloss turm stadt dorf land weg brücke schule klasse heft buch tafel kreide uhr zeit jahr monat woche ferien sommer winter herbst frühling regen schnee flocke wind sturm sonne mond stern sterne himmel wolke erde stein gold silber apfel birne kirsche beere erdbeere torte kuchen brot milch käse saft tee suppe nudel obst gemüse salat kohl rose garten gras kind kinder mann frau vater mutter freund katze hund maus vogel fisch pferd kuh schwein schaf ziege hase igel fuchs bär wolf löwe tiger affe ente gans gänse huhn käfer biene raupe wurm schnecke frosch eule rabe specht taube storch stall zaun tor fenster dach keller boden wand zimmer küche bad flur treppe auto bus zug rad roller boot schiff flug anzug schlaf gummi stiefel halt halte stelle tank wild tier ärztin arzt oster ostern ei eier back wasch schreib lese spiel mal turn kletter rechen zahn bürste pasta seife spiegel arm bein knie ohr nase mund auge augen haar brille mütze schal jacke hose kleid socke socken pulli rock gürtel tasche ranzen mappe kasten farbe stifte pinsel kleber schere lineal papier karton kiste dose flasche glas becher teller gabel messer löffel topf pfanne herd ofen kühl schrank korb nest ast zweig wurzel stamm rinde moos pilz nuss hasel eichel blüte knospe samen beet hecke teich fluss bach quelle insel küste welle hafen dampf post brief karte paket bank geld münze schein laden markt kauf haus fahr karte koffer reise urlaub zelt lager feuer grill wurst fleisch ketchup senf salz zucker mehl butter sahne quark honig marmelade schokolade bonbon keks eis creme stern stunde minute sekunde wecker kalender geburt geburts party fest geschenk kerze ballon luft ballon musik lied geige flöte trommel gitarre klavier bühne theater kino film bild foto kamera handy computer maus tasten spiel zeug puppe teddy bär bau stein klötze sport halle platz feld matte seil reck kasten tore torwart pfeife trikot medaille pokal sieg').split(' ');
  let LEX = null, SYL = null;
  function lex() {
    if (LEX) return LEX;
    LEX = new Set(STEMS); SYL = new Map();
    let P = root.FolivaPools; if (!P && typeof require !== 'undefined') { try { P = require('./pools3.js'); } catch (e) { P = null; } }
    try { if (P && P.allNouns) P.allNouns().forEach(x => { const w = String(x.w || '').toLowerCase(); if (/^[a-zäöüß]{3,}$/.test(w)) LEX.add(w); const p = String(x.p || '').toLowerCase(); if (/^[a-zäöüß]{3,}$/.test(p)) LEX.add(p); if (x.s && /^[A-Za-zÄÖÜäöüß-]+$/.test(x.s) && x.s.replace(/-/g, '') === x.w) SYL.set(w, x.s.split('-')); }); } catch (e) { }
    return LEX;
  }
  const FIRST_CUT = ['en', 'e', 'n'], LINK = ['', 's', 'n', 'en', 'es', 'er', 'e'], END = ['', 'e', 'n', 'en', 's', 'es', 'er', 'ern'];
  const known = (x, ends) => ends.some(e => x.length - e.length >= 3 && x.endsWith(e) && LEX.has(x.slice(0, x.length - e.length)));
  const firstOk = x => x.length >= 3 && (LEX.has(x) || LINK.some(l => l && x.endsWith(l) && x.length - l.length >= 3 && LEX.has(x.slice(0, -l.length))) || FIRST_CUT.some(c => LEX.has(x + c)));
  /* Zerlegung in Wortteile; [] wenn kein Kompositum erkannt */
  function compound(lw, depth = 0) {
    if (depth > 3 || lw.length < 6) return null;
    for (let k = 3; k <= lw.length - 3; k++) {
      const a = lw.slice(0, k), b = lw.slice(k);
      if (!firstOk(a)) continue;
      if (known(b, END)) return [k];
      const rest = compound(b, depth + 1); if (rest) return [k, ...rest.map(x => x + k)];
    }
    return null;
  }
  const sylPart = w => { const lw = w.toLowerCase(); lex(); const s = SYL.get(lw); if (s) { let i = 0; return s.map(p => { const o = w.slice(i, i + p.length); i += p.length; return o; }); } return sylPlain(w); };
  const EXC = { museum: 'Mu-se-um', museen: 'Mu-se-en', jubiläum: 'Ju-bi-lä-um', linoleum: 'Li-no-le-um', petroleum: 'Pe-tro-le-um', puzzle: 'Puz-zle', englisch: 'Eng-lisch', engländer: 'Eng-län-der' };
  function sylWord(w) {
    lex(); const lw = w.toLowerCase();
    if (EXC[lw]) { let i = 0; return EXC[lw].split('-').map(p => { const o = w.slice(i, i + p.length); i += p.length; return o; }); }
    if (SYL.has(lw)) return sylPart(w);
    const cuts = /^[a-zäöüß]+$/.test(lw) ? compound(lw) : null;
    if (!cuts) return sylPlain(w);
    const out = []; let s = 0; [...cuts, w.length].forEach(c => { out.push(...sylPart(w.slice(s, c))); s = c; });
    return out;
  }
  function syllables(w) {
    if (w.includes('|')) return w.split('|').filter(Boolean);
    if (w.includes('-')) { const ps = w.split('-'); return ps.flatMap((p, i) => { const s = p ? sylWord(p) : []; if (i < ps.length - 1) { if (s.length) s[s.length - 1] += '-'; else s.push('-'); } return s; }); }
    return sylWord(w);
  }

  /* ---------- Text zerlegen (Markierungen wie **fett** werden für Übungen entfernt) ---------- */
  const plain = s => String(s || '').replace(/\{\{[^|{}\n]{1,90}\|([\s\S]*?)\}\}/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
  const WORD = /[A-Za-zÄÖÜäöüßẞ|]+(?:-[A-Za-zÄÖÜäöüß|]+)*/g;
  function tokens(s) { const out = []; let last = 0; s.replace(WORD, (m, i) => { if (i > last) out.push({ t: s.slice(last, i) }); out.push({ w: m }); last = i + m.length; return m; }); if (last < s.length) out.push({ t: s.slice(last) }); return out; }
  const clean = w => w.replace(/\|/g, '');

  /* Selbstlaute bzw. markierte Buchstabenfolgen hervorheben */
  function markLetters(s, o) {
    let pats = (o.mark || '').split(/[,;\s]+/).map(x => x.trim()).filter(Boolean);
    let out = '', i = 0;
    const vowelUnits = o.vow ? ['äu', 'Äu', 'au', 'Au', 'ei', 'Ei', 'ai', 'Ai', 'eu', 'Eu', 'ie', 'Ie', ...V.split('')] : [];
    while (i < s.length) {
      const p = pats.find(p => s.substr(i, p.length).toLowerCase() === p.toLowerCase());
      if (p) { out += `<span class="mkL">${esc(s.substr(i, p.length))}</span>`; i += p.length; continue; }
      const v = vowelUnits.find(u => s.startsWith(u, i));
      if (v) { out += `<span class="vwL">${esc(v)}</span>`; i += v.length; continue; }
      out += esc(s[i]); i++;
    }
    return out;
  }
  function wordHTML(w, o, st) {
    const syl = o.syl && o.syl !== 'aus';
    if (!syl) return markLetters(clean(w), o);
    return syllables(w).map(p => { const c = st.n++ % 2; return `<span class="sy sy${c}">${markLetters(p, o)}</span>`; }).join('');
  }
  function isActive(it) { return !!((it.syl && it.syl !== 'aus') || it.vow || (it.mark || '').trim() || (it.ex && it.ex !== 'aus')); }
  const sylClass = it => (it.syl && it.syl !== 'aus') ? ` syl-${esc(it.syl)}` : '';

  /* Hauptfunktion: liefert HTML des Texts (Übung angewendet) und – falls nötig – Schreiblinien mit der Lösung */
  function render(it, opts = {}) {
    const src = plain(it.text || ''); const r = rng((it.seed || 7) * 31 + 5);
    const ex = it.ex && it.ex !== 'aus' ? it.ex : ''; const o = { syl: it.syl, vow: !!it.vow, mark: it.mark || '' };
    const st = { n: 0 }; let body = '', bank = [], needLines = false;
    const lines = src.split('\n');
    const solText = lines.map(l => l.replace(/\|/g, '')).join('\n');
    if (ex === 'luecke') {
      const every = Math.max(2, Math.min(12, +it.gapEvery || 4)), minLen = Math.max(1, +it.gapMin || 4); let k = 0;
      body = lines.map(l => tokens(l).map(tk => {
        if (tk.t != null) return esc(tk.t);
        const w = clean(tk.w);
        if (w.length >= minLen && (++k % every === 0)) { bank.push(w); const wd = Math.max(14, Math.min(60, w.length * 3.2)); return `<span class="gapw" style="min-width:${wd}mm"><span class="s">${esc(w)}</span></span>`; }
        return wordHTML(tk.w, o, st);
      }).join('')).join('<br>');
      if (it.gapBank !== false && bank.length) body += `<div class="wbank">${shuffle(r, bank).map(esc).join('<span class="wsep"> · </span>')}</div>`;
    } else if (ex === 'schuetteln') {
      needLines = true;
      body = lines.map(l => tokens(l).map(tk => { if (tk.t != null) return esc(tk.t); const w = clean(tk.w); if (w.length < 3) return esc(w); const keep = it.keepFirst !== false; const head = keep ? w[0] : ''; const rest = (keep ? w.slice(1) : w).split(''); let m = rest; for (let t = 0; t < 8 && m.join('') === rest.join(''); t++) m = shuffle(r, rest); return esc(head + m.join('').toLowerCase().replace(/^./, c => keep ? c : c)); }).join('')).join('<br>');
    } else if (ex === 'saetze') {
      needLines = true;
      const sents = solText.replace(/\n/g, ' ').match(/[^.!?]+[.!?]*/g) || [];
      body = sents.map(s => { const ws = s.trim().replace(/[.!?]+$/, '').split(/\s+/).filter(Boolean); if (ws.length < 2) return esc(s.trim()); let m = ws; for (let t = 0; t < 8 && m.join(' ') === ws.join(' '); t++) m = shuffle(r, ws); return `<span class="sbox">${m.map(w => `<span class="wcard">${esc(w)}</span>`).join(' ')}</span>`; }).join('');
    } else if (ex === 'rueckwaerts') {
      needLines = true;
      body = lines.map(l => esc(l.replace(/\|/g, '').split('').reverse().join(''))).join('<br>');
    } else if (ex === 'woerter') {
      needLines = true;
      body = lines.map(l => { const wsx = l.replace(/\|/g, '').replace(/[.,;:!?„“"()«»–-]/g, ' ').split(/\s+/).filter(Boolean); return esc(wsx.join('')); }).join('<br>');
    } else if (ex === 'gross' || ex === 'klein') {
      needLines = true;
      body = lines.map(l => esc(ex === 'gross' ? l.replace(/\|/g, '').toUpperCase().replace(/ß/g, 'ẞ') : l.replace(/\|/g, '').toLowerCase())).join('<br>');
    } else {
      body = lines.map(l => tokens(l).map(tk => tk.t != null ? esc(tk.t) : wordHTML(tk.w, o, st)).join('')).join('<br>');
    }
    let after = '';
    if (needLines && it.exLines !== false) {
      const sp = Math.max(7, Math.min(16, +it.exSp || 10));
      const est = Math.max(1, Math.ceil(solText.length / (opts.cpl || 55)) + solText.split('\n').length - 1);
      const n = Math.max(1, Math.min(30, Math.floor(220 / sp), +it.exRows || est)); /* höchstens eine Seite hoch */
      after = `<div class="exln" style="--sp:${sp}mm;min-height:${n * sp}mm"><span class="s">${esc(solText).replace(/\n/g, '<br>')}</span></div>`;
    }
    return { html: body, after, active: true };
  }
  const API = { syllables, render, isActive, sylClass, plain, _syl: () => (lex(), SYL) };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.FolivaTextEx = API;
})(typeof window !== 'undefined' ? window : globalThis);
