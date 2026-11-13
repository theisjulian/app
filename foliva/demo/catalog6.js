/* Foliva – Bausteine ab 0.9.13 · © 2026 theis
   Einmaleins am Punktefeld (Malwinkel), Anlauttabelle, Lernwörter aus dem Lernwortschatz bzw. der eigenen Schulliste. */
(function (root) {
  'use strict';
  const C = root.FolivaCatalog || (typeof require !== 'undefined' ? require('./catalog5.js') : null);
  const LW = () => root.FolivaLernwoerter || null;
  const t = (k, label, extra) => ({ k, label, ...extra });
  const sec = label => ({ k: '_sec_' + label, label, type: 'sec' });
  const T = k => C.TYPES[k];
  const I = p => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const TT = t('title', 'Arbeitsanweisung', { type: 'text' });

  Object.assign(C.ICON, {
    malfeld: I('<circle cx="6" cy="6" r="1.3" fill="currentColor"/><circle cx="10" cy="6" r="1.3" fill="currentColor"/><circle cx="14" cy="6" r="1.3"/><circle cx="6" cy="10" r="1.3" fill="currentColor"/><circle cx="10" cy="10" r="1.3" fill="currentColor"/><circle cx="14" cy="10" r="1.3"/><circle cx="6" cy="14" r="1.3"/><circle cx="10" cy="14" r="1.3"/><circle cx="14" cy="14" r="1.3"/><path d="M12 3v9H3" stroke-width="2"/><path d="M17 17l4 4M21 17l-4 4"/>'),
    anlaut: I('<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M5.3 9.2 7 4.8l1.7 4.4M5.9 7.7h2.2M15.5 9.3V4.8h1.6a1.1 1.1 0 0 1 0 2.2h-1.6m1.6 0a1.1 1.1 0 0 1 0 2.3h-1.6"/>'),
  });

  /* ---------- Einmaleins am Punktefeld ---------- */
  C.TYPES.malfeld = {
    name: 'Einmaleins am Punktefeld (Malwinkel)', group: 'm_kopf', task: true, gen: 'malfeld',
    words: 'malifant malwinkel punktefeld hunderterpunktfeld hunderterfeld einmaleins 1x1 mal multiplikation kernaufgaben zerlegen punkte malaufgabe tauschaufgabe',
    make: () => ({ title: 'Welche Malaufgabe zeigt der Malwinkel? Rechne.', mode: 'winkel', rows: '', maxF: 10, count: 6, cols: 3, fives: true, tausch: false, points: 3 }),
    props: [TT,
      t('mode', 'Aufgabe', { type: 'select', regen: true, opts: [['winkel', 'Malwinkel am Hunderterpunktfeld: Aufgabe aufschreiben'], ['zeichnen', 'Malwinkel selbst einzeichnen'], ['punkte', 'Punktefeld: Malaufgabe aufschreiben'], ['zerlegen', 'Kernaufgaben: zerlegen in 5 · … + …']] }),
      t('rows', 'Nur diese Reihen (z. B. 2, 5, 10; leer = alle)', { type: 'text', plain: true, regen: true }),
      t('maxF', 'Größter Faktor', { type: 'number', min: 2, max: 10, regen: true }),
      t('count', 'Anzahl Aufgaben', { type: 'number', min: 1, max: 12, regen: true }),
      t('cols', 'Nebeneinander', { type: 'number', min: 1, max: 5 }),
      t('tausch', 'Tauschaufgabe dazu', { type: 'toggle', when: it => it.mode === 'winkel' || it.mode === 'punkte' }),
      t('fives', 'Fünfer-Lücke im Feld (Kraft der 5)', { type: 'toggle', inv: true })],
    modeTitles: { prop: 'mode', titles: { winkel: 'Welche Malaufgabe zeigt der Malwinkel? Rechne.', zeichnen: 'Zeichne den Malwinkel ein und rechne.', punkte: 'Schreibe die Malaufgabe zum Punktefeld und rechne.', zerlegen: 'Zerlege die Malaufgabe und rechne.' } },
  };

  /* ---------- Anlauttabelle ---------- */
  C.TYPES.anlaut = {
    name: 'Anlauttabelle', group: 'deutsch', task: true, gen: 'anlaut',
    words: 'anlaut anlauttabelle buchstabentabelle buchstaben abc alphabet laute lautieren erstlesen anfangsbuchstabe buchstabenhaus',
    make: () => ({ title: 'Meine Anlauttabelle', mode: 'tabelle', set: 'abcplus', letters: 'M, A, L, I, O', show: 'gk', cols: 6, word: true, vary: false, shuffle: false, points: 0 }),
    props: [TT,
      t('mode', 'Aufgabe', { type: 'select', regen: true, opts: [['tabelle', 'Anlauttabelle zum Nachschlagen'], ['ergaenzen', 'Anlaut zum Bild aufschreiben'], ['nachspuren', 'Buchstaben nachspuren']] }),
      t('set', 'Buchstaben', { type: 'select', regen: true, opts: [['abcplus', 'A–Z mit Ä, Ö, Ü, Au, Ei, Eu, Sch, Sp, St, Pf'], ['abc', 'A–Z'], ['ohne', 'nur mit eindeutigem Bild (ohne C, Q, V, X, Y)'], ['auswahl', 'Eigene Auswahl']] }),
      t('letters', 'Buchstaben (mit Komma getrennt, z. B. M, A, L, Au, Sch)', { type: 'text', plain: true, regen: true, when: it => it.set === 'auswahl' }),
      t('show', 'Schreibweise', { type: 'seg', opts: [['gk', 'A a'], ['gross', 'A'], ['klein', 'a']] }),
      t('cols', 'Spalten', { type: 'number', min: 3, max: 8 }),
      t('word', 'Wort unter dem Bild', { type: 'toggle', inv: true }),
      t('vary', 'Andere Bilder (mit „Neu mischen“)', { type: 'toggle', regen: true }),
      t('shuffle', 'Reihenfolge mischen', { type: 'toggle', regen: true, when: it => it.mode !== 'tabelle' })],
    modeTitles: { prop: 'mode', titles: { tabelle: 'Meine Anlauttabelle', ergaenzen: 'Wie fängt das Wort an? Schreibe den Anlaut.', nachspuren: 'Spure die Buchstaben nach.' } },
    hint: 'Bilder aus der Foliva-Bildersammlung. Buchstaben ohne passendes Bild (z. B. X, Y, Ö, Ü) bekommen ein Feld zum Selbstmalen.',
  };

  /* ---------- Lernwörter aus dem Lernwortschatz oder der Schulliste ---------- */
  const BER = () => [['alle', 'alle Bereiche'], ...Object.entries((LW() || {}).BEREICHE || {})];
  const isLW = it => it.source === 'lernwoerter';
  const LWP = [
    t('lwsrc', 'Lernwörter aus', { type: 'seg', regen: true, fill: true, when: isLW, opts: [['beide', 'Foliva + Schulliste'], ['foliva', 'Foliva'], ['eigen', 'Schulliste']] }),
    t('lwb', 'Rechtschreibbereich', { type: 'select', regen: true, fill: true, when: it => isLW(it) && it.lwsrc !== 'eigen', opts: BER() }),
    { k: '_lwinfo', type: 'info', when: isLW, html: () => { const L = LW(); return L && L.hasOwn() ? `Schulliste: ${L.own()['12'].length} Wörter (1/2) · ${L.own()['34'].length} Wörter (3/4) – <a href="#" data-lwedit>bearbeiten</a>` : 'Eigene Lernwörterliste der Schule (z. B. Grundwortschatz LehrplanPLUS) <a href="#" data-lwedit>einfügen …</a>'; } },
  ];
  ['wordlist', 'wordsearch', 'abc', 'scramble'].forEach(k => {
    const ty = T(k); if (!ty) return; const src = ty.props.find(p => p.k === 'source'); if (!src || src.opts.some(o => o[0] === 'lernwoerter')) return;
    const i = src.opts.findIndex(o => o[0] === 'eigene'); src.opts.splice(i < 0 ? src.opts.length : i, 0, ['lernwoerter', 'Lernwörter (Grundwortschatz)']);
    const j = ty.props.indexOf(src); ty.props.splice(j + 1, 0, ...LWP);
    /* Thema gilt nur für die Wortsammlung; Klassenstufe auch für Lernwörter */
    ty.props.forEach(p => { if (p.k === 'theme' && p.when) { const w0 = p.when; p.when = it => !isLW(it) && w0(it); } if (p.k === 'stufe' && p.when) { const w1 = p.when; p.when = it => isLW(it) || w1(it); } });
    ty.words = (ty.words || '') + ' lernwörter grundwortschatz rechtschreibung';
  });
  /* Buchstabensalat mit Lernwörtern nur im Modus „Buchstaben“ */
  { const sc = T('scramble'); if (sc) sc.props.forEach(p => { if (p.k === 'lwsrc' || p.k === 'lwb' || p.k === '_lwinfo') { const w = p.when; p.when = it => it.mode !== 'saetze' && w(it); } }); }
  { const wl = T('wordlist'); if (wl) { const mk = wl.make; wl.make = p => ({ ...mk(p), source: 'lernwoerter', lwsrc: 'beide', lwb: 'alle' }); } }

  /* ---------- Einfügen-Leiste: neue Bausteine an ihrem Platz ---------- */
  (C.SIDEBAR_PRIM || []).forEach(g => {
    if (g.id === 'g_deutsch' && !g.keys.includes('anlaut')) g.keys.splice(g.keys.indexOf('pictureword') + 1, 0, 'anlaut');
    if (g.id === 'g_mathe' && !g.keys.includes('malfeld')) g.keys.splice(g.keys.indexOf('hundred') + 1, 0, 'malfeld');
  });
  if (C.STUFE_TYPES) C.STUFE_TYPES.add('wordlist');

  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.FolivaCatalog = C;
})(typeof window !== 'undefined' ? window : globalThis);
