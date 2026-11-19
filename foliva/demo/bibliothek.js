/* Foliva – Text-Bibliothek: alle Lesetexte an einer Stelle, mit Filtern wie im Worksheet Crafter · © 2026 theis
   Quellen: kleine Geschichten (bib1/bib2, selbst geschrieben), Märchen und Fabeln (bib3, frei nacherzählt nach gemeinfreien
   Vorlagen), Sachtexte (pools3 SACHTEXTE, inhalte.js mit Quellen), Gedichte und Elfchen (gedichte.js). */
(function (root) {
  'use strict';
  const QUELLEN = { geschichten: 'Kleine Geschichten', maerchen: 'Märchen', fabeln: 'Fabeln', sachtexte: 'Sachtexte', gedichte: 'Gedichte', elfchen: 'Elfchen', aufgaben: 'Textaufgaben' };
  const AUFG_THEMA = { geld: 'alltag', zeit: 'alltag', tiere: 'tiere', schule: 'schule', freizeit: 'sport', groessen: 'alltag' };
  const THEMEN = { abenteuer: 'Abenteuer und Spannung', alltag: 'Alltag und Verkehr', familie: 'Familie', fantasie: 'Fantasie und Märchen', feste: 'Feste und Feiern', freundschaft: 'Freundschaft', gefuehle: 'Gefühle', jahreszeiten: 'Jahreszeiten und Wetter', koerper: 'Körper und Gesundheit', lustig: 'Lustiges', natur: 'Natur und Umwelt', schule: 'Schule', sport: 'Sport und Freizeit', tiere: 'Tiere' };
  const WORT_BEREICHE = [['bis20', 'Bis zu 20 Wörter', 0, 20], ['20-40', '20 – 40 Wörter', 20, 40], ['40-80', '40 – 80 Wörter', 40, 80], ['80-120', '80 – 120 Wörter', 80, 120], ['ueber120', 'Mehr als 120 Wörter', 120, 1e9]];
  const GED_THEMA = { fruehling: 'jahreszeiten', sommer: 'jahreszeiten', herbst: 'jahreszeiten', winter: 'jahreszeiten', weihnachten: 'feste', tiere: 'tiere', natur: 'natur', lustig: 'lustig', alltag: 'schule' };
  const SACH_THEMA = { tiere: 'tiere', pflanzen: 'natur', wasser: 'natur', umwelt: 'natur', koerper: 'koerper', feuerwehr: 'alltag' };
  const INH_THEMA = { feuerwehr: 'alltag', wald: 'natur', koerper: 'koerper', igel: 'tiere', biene: 'tiere', zaehne: 'koerper' };
  const plain = s => String(s || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/\{\{[^|{}\n]{1,90}\|([\s\S]*?)\}\}/g, '$1');
  const wordsOf = s => plain(s).match(/[A-Za-zÄÖÜäöüßẞ]+(?:-[A-Za-zÄÖÜäöüß]+)*/g) || [];
  const stufeJg = jg => { const a = (jg || []).filter(n => n >= 1 && n <= 4); if (!a.length) return ''; if (a.every(n => n <= 2)) return '12'; if (a.every(n => n >= 3)) return '34'; return ''; };

  let CACHE = null;
  function all() {
    if (CACHE) return CACHE;
    const out = []; const P = root.FolivaPools || {}; const B = root.FolivaBib || { texte: [] }; const I = (root.FolivaInhalte && root.FolivaInhalte.TEXTE) || [];
    B.texte.forEach(x => out.push({ ...x, author: x.author || '', kind: 'prosa' }));
    (P.SACHTEXTE || []).forEach(x => out.push({ id: 'sach-' + x.id, quelle: 'sachtexte', title: x.title, author: '', stufe: x.stufe || '', theme: SACH_THEMA[x.theme] || 'natur', tags: (P.SACHTHEMEN || {})[x.theme] || '', text: x.text, fragen: x.q || '', kind: 'sach' }));
    I.forEach(x => { const k = (x.id.split('-')[1] || ''); out.push({ id: 'inh-' + x.id, quelle: 'sachtexte', title: x.titel, author: '', stufe: stufeJg(x.jg), theme: INH_THEMA[k] || 'natur', tags: x.thema, text: x.text, fragen: x.fragen || '', kind: 'sach', status: x.status, sources: (x.quellen || []).map(q => `${q.titel} (abgerufen ${String(q.abruf || '').split('-').reverse().join('.')})`).join('; ') }); });
    (P.GEDICHTE || []).forEach(x => out.push({ id: 'ged-' + x.id, quelle: 'gedichte', title: x.title, author: x.author || '', stufe: x.stufe, theme: GED_THEMA[x.theme] || 'natur', tags: (P.GEDICHTTHEMEN || {})[x.theme] || '', text: x.text, fragen: '', kind: 'gedicht' }));
    (P.ELFCHEN || []).forEach(x => out.push({ id: 'elf-' + x.id, quelle: 'elfchen', title: 'Elfchen: ' + x.text.split('\n').pop(), author: '', stufe: x.stufe, theme: GED_THEMA[x.theme] || 'natur', tags: (P.GEDICHTTHEMEN || {})[x.theme] || '', text: x.text, fragen: '', kind: 'gedicht' }));
    (P.TEXTAUFGABEN || []).forEach(x => out.push({ id: 'auf-' + x.id, quelle: 'aufgaben', title: x.title, author: '', stufe: x.stufe, theme: AUFG_THEMA[x.theme] || 'alltag', tags: 'Mathematik, Sachrechnen, ' + x.tags, text: x.text, fragen: '', kind: 'aufgabe', F: x.F, R: x.R, A: x.A }));
    out.forEach(x => { x.words = wordsOf(x.text).length; x.lc = wordsOf(x.text).map(w => w.toLowerCase()); });
    CACHE = out; return out;
  }
  /* Lernwörter: Wortformen; ein Lernwort zählt, wenn ein Wort im Text gleich ist oder (ab 4 Buchstaben) damit beginnt: Hund → Hunde */
  const lwParse = s => [...new Set(String(s || '').split(/[\s,;\n]+/).map(w => w.trim().toLowerCase()).filter(w => w && !/^(der|die|das)$/.test(w)))];
  const lwHits = (x, lws) => lws.filter(l => x.lc.some(w => w === l || (l.length >= 4 && w.startsWith(l))));
  /* Filter: { quelle, stufe, q, themen:[], laengen:[], lernwoerter } */
  function filter(f = {}) {
    const lws = lwParse(f.lernwoerter); const q = String(f.q || '').trim().toLowerCase();
    let L = all().filter(x => (!f.quelle || f.quelle === 'alle' || x.quelle === f.quelle) && (!f.stufe || !x.stufe || x.stufe === f.stufe)
      && (!f.themen || !f.themen.length || f.themen.includes(x.theme))
      && (!f.laengen || !f.laengen.length || f.laengen.some(k => { const b = WORT_BEREICHE.find(z => z[0] === k); return b && x.words > b[2] - (b[2] ? 0 : 1) && x.words <= b[3]; }))
      && (!q || (x.title + ' ' + x.tags + ' ' + x.author + ' ' + plain(x.text)).toLowerCase().includes(q)));
    L = L.map(x => ({ x, hits: lws.length ? lwHits(x, lws) : [] }));
    if (lws.length) L = L.filter(o => o.hits.length).sort((a, b) => b.hits.length - a.hits.length || a.x.title.localeCompare(b.x.title, 'de'));
    else L.sort((a, b) => Object.keys(QUELLEN).indexOf(a.x.quelle) - Object.keys(QUELLEN).indexOf(b.x.quelle) || a.x.title.localeCompare(b.x.title, 'de'));
    return L;
  }
  const byId = id => all().find(x => x.id === id);
  const API = { QUELLEN, THEMEN, WORT_BEREICHE, all, filter, byId, lwParse, lwHits, plain, wordsOf, reset: () => { CACHE = null; } };
  root.FolivaBibliothek = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
