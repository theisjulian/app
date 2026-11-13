/* Foliva – Bausteine und Einfügen-Leiste ab 0.9.12 · © 2026 theis
   – Neue Bausteine: Gedicht (mit Elfchen) und Notiz für die Lehrkraft (wird nicht gedruckt)
   – Lesehilfen (Silben, Selbstlaute, Großbuchstaben) für alle Textaufgaben
   – Einfügen-Leiste für die Grundschule nach Häufigkeit geordnet: jeder Baustein genau einmal */
(function (root) {
  'use strict';
  const C = root.FolivaCatalog || (typeof require !== 'undefined' ? require('./catalog4.js') : null);
  const P = root.FolivaPools || (typeof require !== 'undefined' ? require('./gedichte.js') : {});
  const G = () => root.FolivaGen || null;
  const t = (k, label, extra) => ({ k, label, ...extra });
  const sec = label => ({ k: '_sec_' + label, label, type: 'sec' });
  const T = k => C.TYPES[k];
  const I = p => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const isPool = it => it.source && it.source !== 'eigene';

  Object.assign(C.ICON, {
    gedicht: I('<path d="M6 4h12M6 8h9M6 12h12M6 16h8"/><path d="M17 17.5c1.2-.4 2-1.3 2-2.5"/><circle cx="17.5" cy="19" r="1.2"/>'),
    note: I('<path d="M5 4h14v11l-5 5H5Z"/><path d="M14 20v-5h5"/><path d="M8 9h8M8 12h5"/>'),
  });

  /* ---------- Lesehilfen ---------- */
  const LH_PROPS = (more = []) => [
    sec('Lesehilfen'),
    t('syl', 'Silben', { type: 'seg', opts: [['aus', 'aus'], ['farbig', 'färben'], ['boegen', 'Bögen'], ['beides', 'beides']] }),
    t('vow', 'Selbstlaute hervorheben', { type: 'toggle' }),
    t('caps', 'Nur Großbuchstaben (Blockschrift)', { type: 'toggle' }),
    t('lhTitle', 'Auch für die Arbeitsanweisung', { type: 'toggle', when: it => (it.syl && it.syl !== 'aus') || it.vow || it.caps }),
    ...more,
  ];
  ['gap', 'pictureword', 'wordlist', 'truefalse', 'choice', 'match', 'abc', 'sachaufgabe', 'wordtypes', 'table', 'lines', 'label'].forEach(k => { const ty = T(k); if (ty && !ty.props.some(p => p.k === 'caps')) { ty.props.push(...LH_PROPS()); ty.words = (ty.words || '') + ' silben silbenbögen selbstlaute vokale großbuchstaben lesehilfe'; } });
  /* Text und Sachtext haben Silben und Selbstlaute schon unter „Übung auf den Text anwenden“ */
  ['text', 'sachtext'].forEach(k => { const ty = T(k); if (!ty || ty.props.some(p => p.k === 'caps')) return; const i = ty.props.findIndex(p => p.k === 'vow'); ty.props.splice(i < 0 ? ty.props.length : i + 1, 0, t('caps', 'Nur Großbuchstaben (Blockschrift)', { type: 'toggle' }), t('lhTitle', 'Lesehilfen auch für die Arbeitsanweisung', { type: 'toggle', when: it => k === 'sachtext' && ((it.syl && it.syl !== 'aus') || it.vow || it.caps) })); });
  { const ln = T('text').props.find(p => p.k === 'lineNums'); if (!ln) T('text').props.push(t('lineNums', 'Zeilen nummerieren (jede 5. Zeile)', { type: 'toggle' })); else ln.label = 'Zeilen nummerieren (jede 5. Zeile)'; }
  { const ln = T('sachtext').props.find(p => p.k === 'lineNums'); if (ln) ln.label = 'Zeilen nummerieren (jede 5. Zeile)'; }

  /* ---------- Gedicht ---------- */
  const THEMES = () => [['alle', 'alle Themen'], ...Object.entries(P.GEDICHTTHEMEN || {})];
  const STUFE = when => t('stufe', 'Klassenstufe', { type: 'seg', regen: true, fill: true, when, opts: [['', 'alle'], ['12', '1/2'], ['34', '3/4']] });
  const notElf = it => it.mode !== 'elfchen';
  const toOwn = it => { if (it.source && it.source !== 'eigene') { it.poolSrc = it.source; it.source = 'eigene'; } };
  C.TYPES.gedicht = {
    name: 'Gedicht und Elfchen', group: 'deutsch', task: true, gen: 'gedicht',
    words: 'gedicht gedichte reim reime reimwörter elfchen vers verse strophe lyrik abschreiben vortragen auswendig lesen frühling herbst winter weihnachten',
    hint: 'Gedichte aus der Sammlung sind gemeinfrei (z. B. Goethe, Mörike, Morgenstern) oder selbst geschrieben. Eigene Gedichte einfach ins Textfeld schreiben – Strophen durch eine Leerzeile trennen.',
    make: () => ({ title: 'Lies das Gedicht.', mode: 'lesen', source: 'sammlung', gtheme: 'alle', ptitle: '', author: '', text: '', align: 'left', bank: true, lineNums: false, example: true, ehints: true, etopic: '', points: 2 }),
    props: [
      t('title', 'Arbeitsanweisung', { type: 'text' }),
      t('mode', 'Aufgabe', { type: 'select', regen: true, onSet: it => { const g = G(); if (it.mode !== 'elfchen' && isPool(it) && g && g.gedichtSuits && !g.gedichtSuits(it, it.mode)) g.fill(it); }, opts: [['lesen', 'Lesen (und vortragen)'], ['reime', 'Reimwörter einsetzen'], ['abschreiben', 'Abschreiben'], ['ordnen', 'Verse ordnen'], ['elfchen', 'Elfchen schreiben (Schreibrahmen)']] }),
      t('source', 'Gedicht', { type: 'select', regen: true, fill: true, opts: [['sammlung', 'Aus der Sammlung'], ['eigene', 'Eigenes Gedicht']], when: notElf }),
      t('gtheme', 'Thema', { type: 'select', regen: true, fill: true, opts: THEMES(), when: it => it.mode === 'elfchen' ? it.example !== false : isPool(it) }),
      STUFE(it => it.mode === 'elfchen' ? it.example !== false : isPool(it)),
      t('ptitle', 'Überschrift des Gedichts', { type: 'text', onSet: toOwn, when: notElf }),
      t('author', 'Verfasser (leer lassen bei eigenen Gedichten)', { type: 'text', plain: true, onSet: toOwn, when: notElf }),
      t('text', 'Gedicht – Strophen durch eine Leerzeile trennen', { type: 'textarea', plain: true, rows: 8, regen: true, onSet: toOwn, when: notElf }),
      t('bank', 'Wörterkasten mit den Reimwörtern', { type: 'toggle', inv: true, when: it => it.mode === 'reime' }),
      t('lin', 'Lineatur zum Abschreiben', { type: 'select', when: it => it.mode === 'abschreiben', opts: [['', 'passend zur Klassenstufe'], ['g1', 'Klasse 1'], ['g2', 'Klasse 2'], ['g3', 'Klasse 3'], ['g4', 'Klasse 4'], ['li9', 'Linien 9 mm']] }),
      t('lrows', 'Anzahl Schreibzeilen (leer = so viele wie Verse)', { type: 'number', min: 1, max: 30, empty: true, when: it => it.mode === 'abschreiben' }),
      t('etopic', 'Thema für das Elfchen (optional, z. B. Herbst)', { type: 'text', plain: true, when: it => it.mode === 'elfchen' }),
      t('example', 'Beispiel-Elfchen zeigen', { type: 'toggle', inv: true, regen: true, when: it => it.mode === 'elfchen' }),
      t('ehints', 'Hilfen je Zeile (z. B. „Zwei Wörter: Wer oder was?“)', { type: 'toggle', inv: true, when: it => it.mode === 'elfchen' }),
      sec('Darstellung'),
      t('align', 'Ausrichtung', { type: 'seg', when: it => it.mode !== 'elfchen' && it.mode !== 'ordnen', opts: [['left', 'Links'], ['center', 'Mitte']] }),
      t('size', 'Schriftgröße (pt, leer = Blatt)', { type: 'number', min: 8, max: 36, empty: true }),
      t('lineNums', 'Verse nummerieren (jeder 5. Vers)', { type: 'toggle', when: it => ['lesen', 'reime', 'abschreiben'].includes(it.mode || 'lesen') }),
      t('paint', 'Platz zum Malen darunter', { type: 'toggle', when: it => ['lesen', 'reime', 'abschreiben'].includes(it.mode || 'lesen') }),
      t('paintH', 'Höhe des Malfelds (mm)', { type: 'number', min: 20, max: 200, when: it => it.paint && ['lesen', 'reime', 'abschreiben'].includes(it.mode || 'lesen') }),
      ...LH_PROPS(),
    ],
    modeTitles: { prop: 'mode', titles: { lesen: 'Lies das Gedicht.', reime: 'Setze die Reimwörter ein.', abschreiben: 'Lies das Gedicht und schreibe es ab.', ordnen: 'Bringe die Verse in die richtige Reihenfolge. Nummeriere.', elfchen: 'Schreibe ein Elfchen.' } },
  };
  if (C.STUFE_TYPES) C.STUFE_TYPES.add('gedicht');

  /* ---------- Notiz für die Lehrkraft ---------- */
  C.TYPES.note = {
    name: 'Notiz (wird nicht gedruckt)', group: 'basis', words: 'notiz hinweis lehrkraft lehrer lehrerin merkzettel zettel kommentar erinnerung nicht drucken',
    hint: 'Nur für dich: Die Notiz schwebt über dem Blatt und erscheint nie im Druck, im PDF oder im Lösungsblatt.',
    make: () => ({ text: 'Notiz für mich: …', ncol: 'gelb', free: true, fw: 58, dx: 120, dy: 0 }),
    props: [t('text', 'Notiz', { type: 'textarea', rows: 4 }), t('ncol', 'Farbe', { type: 'seg', opts: [['gelb', 'Gelb'], ['gruen', 'Grün'], ['blau', 'Blau'], ['rosa', 'Rosa']] })],
  };

  /* ---------- Suchbegriffe (Fachwörter der Grundschule) ---------- */
  const W = (k, w) => { if (T(k)) T(k).words = (T(k).words || '') + ' ' + w; };
  W('wall', 'rechenpyramide pyramide mauer'); W('tenframe', 'punktefeld plättchen zehnerfeld zwanzigerfeld hunderterfeld wendeplättchen');
  W('hundred', 'hunderterbrett hunderterfeld'); W('packet', 'aufgaben kopfrechnen einspluseins einmaleins 1+1 1x1'); W('money', 'euro cent münzen scheine rückgeld');
  W('clock', 'uhrzeit stunde minute'); W('written', 'untereinander rechnen'); W('lineatur', 'lineatur schreiben schönschrift schreibschrift druckschrift');
  W('space', 'kasten rahmen malen'); W('image', 'clipart illustration'); W('pictureword', 'anlaut anlaute silben bildkarte'); W('chain', 'pfeilbild rechenkette');
  W('sachtext', 'lesetext leseverstehen lesen'); W('choice', 'quiz multiple'); W('heading', 'überschrift titel');

  /* ---------- Einfügen-Leiste der Grundschule ----------
     Häufiges zuerst; jeder Baustein steht genau einmal; seltene Formate eingeklappt. */
  C.SIDEBAR_PRIM = [
    { id: 'g_basis', name: 'Grundelemente', open: true, keys: ['heading', 'text', 'image', 'table', 'lines', 'lineatur', 'space', 'divider', 'break', 'note'] },
    { id: 'g_deutsch', name: 'Lesen und Schreiben', open: true, keys: ['gedicht', 'sachtext', 'gap', 'pictureword', 'scramble', 'wordlist', 'abc', 'wordtypes'] },
    { id: 'g_mathe', name: 'Rechnen', open: true, keys: ['packet', 'wall', 'house', 'compare', 'written', 'halbschriftlich', 'numberline', 'hundred', 'tenframe', 'clock', 'money', 'sachaufgabe', 'units'],
      more: { id: 'g_mathe_more', name: 'Mehr Rechenformate', keys: ['zerlegung', 'triangle', 'calctable', 'chain', 'rechenrad', 'magic', 'opsquare', 'sequence', 'placevalue', 'countpics', 'wdiv', 'kaestchen', 'geoboard', 'pattern'] } },
    { id: 'g_fragen', name: 'Fragen und Antworten', keys: ['choice', 'match', 'truefalse', 'selfcheck'] },
    { id: 'g_raetsel', name: 'Rätsel und Sachunterricht', keys: ['crossword', 'wordsearch', 'secret', 'label', 'timeline', 'mindmap', 'chart'] },
    { id: 'g_gestalten', name: 'Sprechblase, QR-Code, Unterschrift', keys: ['bubble', 'qr', 'sign'] },
    { id: 'g_sprachen', name: 'Fremdsprachen', keys: ['vocab', 'conj'] },
    { id: 'g_sek', name: 'Mathematik ab Klasse 5', keys: () => Object.keys(C.TYPES).filter(k => C.TYPES[k].group === 'mathesek') },
  ];
  /* Bildpaletten: in der Grundschule nach „Lesen und Schreiben“ bzw. „Sprechblase …“ */
  (C.PALETTES || []).forEach(p => { if (p.id === 'p_lineaturen') p.afterPrim = 'g_deutsch'; if (p.id === 'p_formen') p.afterPrim = 'g_gestalten'; });
  const keysOf = g => (typeof g.keys === 'function' ? g.keys() : g.keys).filter(k => C.TYPES[k]);
  const baseOrder = C.groupOrder, baseKeys = C.groupKeys;
  C.groupOrder = prim => prim ? C.SIDEBAR_PRIM : baseOrder(prim);
  C.groupKeys = g => g.keys ? keysOf(g).concat(g.more ? keysOf(g.more) : []) : baseKeys(g);
  C.groupMain = g => g.keys ? keysOf(g) : baseKeys(g);
  C.groupMore = g => g.more ? { ...g.more, keys: keysOf(g.more) } : null;

  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.FolivaCatalog = C;
})(typeof window !== 'undefined' ? window : globalThis);
