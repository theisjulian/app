/* Bewertungslogik: Schemata nach ISB-Rechentabellen, Notenberechnung, Worturteil-Bausteine.
   Läuft im Browser und in Node (für Tests). */
(function (root) {

const CATS = {
  pron:    { label: 'Aussprache / Intonation', short: 'Aussprache' },
  lang:    { label: 'Sprachliche Mittel / Sprachrichtigkeit', short: 'Sprache' },
  inter:   { label: 'Gesprächsfähigkeit / Strategie', short: 'Gespräch' },
  content: { label: 'Aufgabenerfüllung / Inhalt', short: 'Inhalt' },
  npLang:  { label: 'Sprachliche Leistung', short: 'Sprache' },
  /* nur monologische Raster (Referat): Aussprache mit Flüssigkeit, ohne Gesprächsfähigkeit */
  flu:     { label: 'Aussprache / Intonation / Flüssigkeit', short: 'Aussprache' },
};

/* Notenschlüssel = Mindest-BE für Note 1..5 (darunter 6), exakt aus den ISB-Rechentabellen */
const SCHEMES = {
  'A1':     { label: 'A1',      type: 'be', desc: 'A1',   f: { pron: 2, lang: 4, inter: 1, content: 3 }, key: [47.5, 40.5, 34, 27, 18] },
  'A1+':    { label: 'A1+',     type: 'be', desc: 'A1',   f: { pron: 2, lang: 4, inter: 1, content: 3 }, key: [47.5, 40.5, 34, 27, 18] },
  'A2':     { label: 'A2',      type: 'be', desc: 'A2',   f: { pron: 2, lang: 4, inter: 2, content: 4 }, key: [56, 48, 40, 32, 21.5] },
  'A2+':    { label: 'A2+',     type: 'be', desc: 'A2',   f: { pron: 2, lang: 4, inter: 2, content: 4 }, key: [56, 48, 40, 32, 21.5] },
  'B1':     { label: 'B1',      type: 'be', desc: 'B1',   f: { pron: 1, lang: 4, inter: 2, content: 5 }, key: [54.5, 46.5, 39, 31, 20.5] },
  'B1+':    { label: 'B1+',     type: 'be', desc: 'B1',   f: { pron: 1, lang: 4, inter: 2, content: 5 }, key: [54.5, 46.5, 39, 31, 20.5] },
  'B1+/B2': { label: 'B1+/B2',  type: 'be', desc: 'B1P2', f: { pron: 1, lang: 4, inter: 2, content: 6 }, key: [58, 49.5, 41.5, 33, 22] },
  'B1spb':  { label: 'B1 (spät beginnend, Notenpunkte)', type: 'bep', desc: 'B1', f: { pron: 1, lang: 4, inter: 2, content: 5 },
              npKey: [59.5, 57, 54.5, 51.5, 49, 46.5, 44.5, 41.5, 39, 36.5, 34, 31, 27.5, 24, 20.5] },
  'OS':     { label: 'Oberstufe 12/13 (Notenpunkte)', type: 'np', desc: 'NP', w: { npLang: 4, inter: 2, content: 4 }, cap4: false },
  'OSB1':   { label: 'B1 fortgeführt (Notenpunkte)', type: 'np', desc: 'NP', w: { npLang: 4, inter: 2, content: 4 }, cap4: true },
};
const SCHEME_ORDER = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B1+/B2', 'OS', 'OSB1', 'B1spb'];
/* Monologische Raster (ISB „Sprechen (monologisch)“, A1–B1+) – nur für die Prüfungsart Referat.
   Notenschlüssel exakt aus den ISB-Bewertungsbögen: A1–A2+ 26 BE (26–23 | 22,5–19,5 | 19–16 | 15,5–13 | 12,5–8,5 | 8–0),
   B1/B1+ 30 BE (30–26,5 | 26–22,5 | 22–18,5 | 18–15 | 14,5–10 | 9,5–0). Getrennt von SCHEME_ORDER, damit Prüfungen unverändert bleiben. */
const MONO = (label, desc, content, key) => ({ label: label + ' · monologisch', badge: label, type: 'be', mono: true, desc, f: { flu: 1, lang: 2, content }, key });
Object.assign(SCHEMES, {
  'A1m':  MONO('A1', 'A1M', 2, [23, 19.5, 16, 13, 8.5]),
  'A1+m': MONO('A1+', 'A1M', 2, [23, 19.5, 16, 13, 8.5]),
  'A2m':  MONO('A2', 'A2M', 2, [23, 19.5, 16, 13, 8.5]),
  'A2+m': MONO('A2+', 'A2M', 2, [23, 19.5, 16, 13, 8.5]),
  'B1m':  MONO('B1', 'B1M', 3, [26.5, 22.5, 18.5, 15, 10]),
  'B1+m': MONO('B1+', 'B1M', 3, [26.5, 22.5, 18.5, 15, 10]),
});
const MONO_ORDER = ['A1m', 'A1+m', 'A2m', 'A2+m', 'B1m', 'B1+m'];
const MAXBE = { pron: 6, lang: 6, inter: 6, content: 4, flu: 6 };

function catsOf(scheme) {
  const s = SCHEMES[scheme];
  if (s.mono) return ['flu', 'lang', 'content'];
  return s.type === 'np' ? ['npLang', 'inter', 'content'] : ['pron', 'lang', 'inter', 'content'];
}
function maxOf(scheme, cat) { return SCHEMES[scheme].type === 'np' ? 15 : MAXBE[cat]; }
function totalMax(scheme) {
  const s = SCHEMES[scheme]; if (s.type === 'np') return 15;
  return Object.entries(s.f).reduce((a, [c, f]) => a + f * MAXBE[c], 0);
}

/* Ergebnis: {complete, be, max, grade (1–6) | np (0–15), npRaw} */
function evaluate(scheme, scores, customKey) {
  const s = SCHEMES[scheme]; const cats = catsOf(scheme);
  const complete = cats.every(c => typeof scores[c] === 'number');
  if (s.type === 'np') {
    if (!complete) return { complete: false };
    const v = cats.map(c => scores[c]);
    let raw = (scores.npLang * s.w.npLang + scores.inter * s.w.inter + scores.content * s.w.content) / 10;
    let capped = raw;
    if (v.some(x => x <= 0)) capped = Math.min(raw, 3);
    else if (s.cap4 && v.some(x => x <= 3)) capped = Math.min(raw, 4);
    const np = roundHalfUp(capped);
    return { complete: true, npRaw: raw, npCapped: capped, np, grade: npToGrade(np), capNote: capped < raw };
  }
  let be = 0; for (const c of cats) if (typeof scores[c] === 'number') be += scores[c] * s.f[c];
  const max = totalMax(scheme);
  if (!complete) return { complete: false, be, max };
  if (s.type === 'bep') {
    const k = s.npKey; let np = 0;
    for (let i = 0; i < k.length; i++) if (be >= k[i]) { np = 15 - i; break; }
    return { complete: true, be, max, np, grade: npToGrade(np) };
  }
  const key = customKey || s.key; let grade = 6;
  for (let i = 0; i < 5; i++) if (be >= key[i]) { grade = i + 1; break; }
  return { complete: true, be, max, grade };
}
function roundHalfUp(x) { return Math.floor(x + 0.5 + 1e-9); }
function npToGrade(np) { return np >= 13 ? 1 : np >= 10 ? 2 : np >= 7 ? 3 : np >= 4 ? 4 : np >= 1 ? 5 : 6; }

/* Schlüssel-Tabelle für den Bogen: [{grade, from, to}] */
function keyRanges(scheme, customKey) {
  const s = SCHEMES[scheme]; const key = customKey || s.key; const max = totalMax(scheme);
  const out = []; let hi = max;
  for (let g = 1; g <= 6; g++) {
    const lo = g <= 5 ? key[g - 1] : 0;
    out.push({ grade: g, from: hi, to: lo });
    hi = lo - 0.5;
  }
  return out;
}
/* Schwellen aus Prozent erzeugen (für eigenen Schlüssel): lineare Aufteilung oberhalb der 4/5-Grenze wie ISB */
function keyFromPercent(scheme, pct) {
  const max = totalMax(scheme); const std = SCHEMES[scheme].key; const p = pct / 100;
  const four = Math.round(max * p * 2) / 2;
  const ratio = (v) => (v - std[3]) / (max - std[3]);
  const up = [0, 1, 2].map(i => Math.round((four + ratio(std[i]) * (max - four)) * 2) / 2);
  const five = Math.round((std[4] / std[3]) * four * 2) / 2;
  return [up[0], up[1], up[2], four, five];
}

/* Deskriptor zu einer Punktzahl */
function descriptor(scheme, cat, score) {
  const s = SCHEMES[scheme]; const D = root.DESC[s.desc];
  if (score == null) return [];
  if (s.type === 'np') { const g = npToGrade(Math.round(score)); return (D[cat === 'npLang' ? 'lang' : cat][g] || []); }
  /* Halbe Punkte (z. B. 1,5): es gelten die Beschreibungen der ganzen Punktzahl (1) – nicht beider Stufen */
  return D[cat][Math.floor(score)] || [];
}

/* Qualitätsband 1 (sehr gut) … 6 (ungenügend) je Kategorie */
function band(scheme, cat, score) {
  const s = SCHEMES[scheme];
  if (s.type === 'np') return npToGrade(roundHalfUp(score));
  const r = Math.floor(score + 1e-9);   /* ganze Punktzahl, passend zu den Beschreibungen (x,5 zählt wie x) */
  if (cat === 'content') return ({ 4: 1, 3: 2, 2: 4, 1: 5, 0: 6 })[r];
  return ({ 6: 1, 5: 2, 4: 3, 3: 4, 2: 5, 1: 5, 0: 6 })[r];
}

/* Baustein-Stufe für das Worturteil, eng an den ISB-Deskriptoren:
   Aussprache, Sprache, Gespräch haben 7 Stufen (BE 6 … 0 einzeln), Inhalt 6 Stufen (BE 4,3,2,1,0 → 1,2,4,5,6).
   Notenpunkte: Notenstufe 1–6 → Baustein 1–6 (eigene Sätze je Bereich, LEVEL.NP). */
function step(scheme, cat, score) {
  const s = SCHEMES[scheme];
  if (s.type === 'np') { const g = npToGrade(roundHalfUp(score)); return g; }   /* Notenpunkte: eigene 6 Sätze je Bereich (LEVEL.NP) */
  const r = Math.floor(score + 1e-9);
  if (cat === 'content') return ({ 4: 1, 3: 2, 2: 4, 1: 5, 0: 6 })[r];
  return 7 - r;
}

/* ---------------- Worturteil ---------------- */
const PRON = {
  de: { w: 'sie', m: 'er' }, en: { w: 'she', m: 'he' }, fr: { w: 'elle', m: 'il' }, it: { w: '', m: '' }, es: { w: '', m: '' },
};
const GRADE_WORD = {
  de: ['sehr gute', 'gute', 'befriedigende', 'ausreichende', 'mangelhafte', 'ungenügende'],
  en: ['a very good', 'a good', 'a satisfactory', 'an adequate', 'a poor', 'an insufficient'],
  it: ['ottima', 'buona', 'discreta', 'sufficiente', 'insufficiente', 'gravemente insufficiente'],
  fr: ['très bonne', 'bonne', 'satisfaisante', 'passable', 'insuffisante', 'très insuffisante'],
  es: ['muy buena', 'buena', 'satisfactoria', 'suficiente', 'insuficiente', 'muy deficiente'],
};
const OPEN = {
  de: g => `{N} zeigt in der mündlichen Prüfung eine insgesamt ${GRADE_WORD.de[g - 1]} Leistung.`,
  en: g => `In the oral exam, {N} gave ${GRADE_WORD.en[g - 1]} performance overall.`,
  it: g => `Nella prova orale {N} ha fornito una prestazione complessivamente ${GRADE_WORD.it[g - 1]}.`,
  fr: g => `Dans l’ensemble, la prestation de {N} à l’épreuve orale est ${GRADE_WORD.fr[g - 1]}.`,
  es: g => `En la prueba oral, {N} ha ofrecido una prestación globalmente ${GRADE_WORD.es[g - 1]}.`,
};
/* Referat (monologisch): Einleitung ohne „Prüfung“ */
const OPEN_REF = {
  de: g => `{N} zeigt im Referat eine insgesamt ${GRADE_WORD.de[g - 1]} Leistung.`,
  en: g => `In the presentation, {N} gave ${GRADE_WORD.en[g - 1]} performance overall.`,
  it: g => `Nella presentazione orale {N} ha fornito una prestazione complessivamente ${GRADE_WORD.it[g - 1]}.`,
  fr: g => `Dans l’ensemble, la prestation de {N} lors de l’exposé est ${GRADE_WORD.fr[g - 1]}.`,
  es: g => `En la presentación oral, {N} ha ofrecido una prestación globalmente ${GRADE_WORD.es[g - 1]}.`,
};
const BANK = {
  de: {
    pron: [
      '{S} spricht sehr gut verständlich; Aussprache und Intonation sind durchweg korrekt.',
      '{S} ist gut verständlich; Aussprache und Intonation sind meist korrekt, kleinere Fehler stören die Kommunikation nicht.',
      '{S} ist in der Regel gut verständlich, auch wenn einzelne Aussprache- und Intonationsfehler auftreten.',
      '{S} ist mit gewissen Einschränkungen verständlich; in Aussprache und Intonation zeigen sich erkennbare Schwächen.',
      '{S} macht viele Aussprachefehler, sodass die Verständlichkeit stark eingeschränkt ist.',
      'Aufgrund massiver Schwächen in Aussprache und Intonation mit sehr vielen Aussprachefehlern ist {s} kaum mehr verständlich.',
      'Aufgrund grob fehlerhafter Aussprache ist {s} nicht mehr verständlich.'],
    lang: [
      '{S} verwendet ein breites Spektrum sprachlicher Mittel sicher und nahezu fehlerfrei.',
      '{S} drückt sich meist sicher und treffend aus; die wenigen Fehler beeinträchtigen die Verständlichkeit nicht.',
      '{S} verfügt über einen angemessenen Wortschatz; mehrere, zumeist leichte Fehler beeinträchtigen die Verständlichkeit kaum.',
      '{S} verwendet überwiegend einfache sprachliche Mittel; mehrere, teils gravierende Fehler treten auf, die Verständlichkeit bleibt aber insgesamt gewährleistet.',
      '{S} verfügt nur über ein begrenztes Repertoire sprachlicher Mittel; zahlreiche Fehler beeinträchtigen die Verständlichkeit stellenweise.',
      '{S} verwendet nur sehr einfache sprachliche Mittel; sehr viele, häufig gravierende Fehler beeinträchtigen die Verständlichkeit deutlich.',
      '{S} macht so viele elementare Fehler, dass die Verständlichkeit nicht mehr gegeben ist.'],
    inter: [
      'Im Gespräch reagiert {s} flexibel und spontan, geht geschickt auf die Gesprächspartner ein und äußert sich flüssig.',
      'Im Gespräch beteiligt {s} sich aktiv, geht meist gut auf die Beiträge der anderen ein und spricht weitgehend flüssig.',
      '{S} beteiligt sich angemessen am Gespräch und geht auf die Gesprächspartner ein, zögert aber gelegentlich.',
      '{S} interagiert wenig flexibel mit den Gesprächspartnern, geht aber noch angemessen auf andere Beiträge ein; wiederholtes Zögern führt gelegentlich zu Schwierigkeiten, das Gespräch fortzuführen.',
      '{S} geht wenig auf andere Gesprächsbeiträge ein, zögert häufig und hat wiederholt Schwierigkeiten, das Gespräch fortzuführen.',
      '{S} geht kaum auf andere Gesprächsbeiträge ein, zögert häufig und hat große Schwierigkeiten, die Gesprächssituation zu bewältigen.',
      'Eine Interaktion mit den Gesprächspartnern kommt nicht zustande.'],
    content: [
      '{S} erfüllt die Aufgabenstellung vollständig, setzt die Inhalte sachgerecht und ideenreich um und vertritt die eigene Meinung überzeugend.',
      '{S} erfüllt die Aufgabenstellung weitgehend und stellt die Inhalte überwiegend sachgerecht und überzeugend dar.',
      '{S} erfüllt die Aufgabenstellung im Großen und Ganzen; die Darstellung ist in weiten Teilen sachgerecht, weicht aber stellenweise vom Thema ab.',
      '{S} erfüllt die Aufgabenstellung insgesamt noch, die Darstellung überzeugt jedoch nur teilweise.',
      '{S} erfüllt die Aufgabenstellung nur ansatzweise und weicht häufig vom Thema ab.',
      '{S} verfehlt die Aufgabenstellung.'],
    tip: {
      pron: 'Für die Weiterarbeit empfiehlt sich gezieltes Training von Aussprache und Intonation, etwa durch lautes Lesen und Nachsprechen.',
      lang: 'Für die Weiterarbeit empfiehlt sich die Festigung von Wortschatz und grammatischen Strukturen.',
      inter: 'Für die Weiterarbeit empfiehlt sich mehr Mut zu spontanen Gesprächsbeiträgen und der gezielte Einsatz von Redemitteln, um auf andere einzugehen.',
      content: 'Für die Weiterarbeit empfiehlt sich eine gründlichere inhaltliche Vorbereitung und eine klarere Struktur der eigenen Beiträge.' },
    top: 'Herzlichen Glückwunsch zu dieser Leistung!',
  },
  en: {
    pron: [
      '{S} is very easy to understand; pronunciation and intonation are consistently accurate.',
      '{S} is easy to understand; pronunciation and intonation are mostly accurate, and minor slips do not affect communication.',
      '{S} is generally easy to understand, although some errors in pronunciation and intonation occur.',
      '{S} can be understood with some limitations; there are noticeable weaknesses in pronunciation and intonation.',
      '{S} makes many pronunciation errors, which severely limits how well {s} can be understood.',
      'Because of major weaknesses in pronunciation and intonation, with very many errors, {s} can hardly be understood.',
      'Because of seriously flawed pronunciation, {s} can no longer be understood.'],
    lang: [
      '{S} uses a wide range of language confidently and almost without errors.',
      '{S} expresses ideas confidently and accurately for the most part; the few errors do not affect comprehension.',
      '{S} has an adequate range of vocabulary; several, mostly minor errors hardly affect comprehension.',
      '{S} mostly relies on simple language; several errors, some of them serious, occur, but the message still comes across.',
      '{S} has only a limited range of language; frequent errors affect comprehension in places.',
      '{S} only uses very simple language; very many, often serious errors clearly affect comprehension.',
      '{S} makes so many basic errors that the message no longer comes across.'],
    inter: [
      'In conversation, {s} responds flexibly and spontaneously, engages skilfully with the other speakers and speaks fluently.',
      'In conversation, {s} takes an active part, mostly responds well to the others and speaks fairly fluently.',
      '{S} takes an appropriate part in the conversation and responds to the other speakers, but hesitates at times.',
      '{S} interacts with little flexibility but still responds adequately to others; repeated hesitation occasionally makes it difficult to keep the conversation going.',
      '{S} responds little to the others, hesitates often and repeatedly finds it difficult to keep the conversation going.',
      '{S} hardly responds to others, hesitates often and finds it very difficult to cope with the conversation.',
      'There is no interaction with the other speakers.'],
    content: [
      '{S} fulfils the task completely, deals with the content in a relevant and imaginative way and presents a convincing personal opinion.',
      '{S} largely fulfils the task and presents the content in a mostly relevant and convincing way.',
      '{S} fulfils the task on the whole; the content is largely relevant, but drifts off topic in places.',
      '{S} still fulfils the task overall, but the presentation is only partly convincing.',
      '{S} fulfils the task only in part and often drifts off topic.',
      '{S} does not fulfil the task.'],
    tip: {
      pron: 'To improve further, focused practice of pronunciation and intonation is recommended, for example by reading aloud and repeating model texts.',
      lang: 'To improve further, consolidating vocabulary and grammatical structures is recommended.',
      inter: 'To improve further, contributing more spontaneously and using set phrases to respond to others is recommended.',
      content: 'To improve further, more thorough preparation of the content and a clearer structure of contributions are recommended.' },
    top: 'Congratulations on this performance!',
  },
  it: {
    pron: [
      '{S} si fa capire molto bene; pronuncia e intonazione sono sempre corrette.',
      '{S} si fa capire bene; pronuncia e intonazione sono per lo più corrette e i piccoli errori non disturbano la comunicazione.',
      '{S} si fa capire in genere bene, anche se compaiono alcuni errori di pronuncia e di intonazione.',
      '{S} si fa capire con qualche difficoltà; nella pronuncia e nell’intonazione si notano debolezze evidenti.',
      '{S} commette molti errori di pronuncia, per cui la comprensibilità risulta fortemente limitata.',
      'A causa di gravi debolezze nella pronuncia e nell’intonazione, con moltissimi errori, {s} si fa capire a malapena.',
      'A causa di una pronuncia gravemente scorretta, {s} non si fa più capire.'],
    lang: [
      '{S} usa con sicurezza un’ampia gamma di strutture e lessico, quasi senza errori.',
      '{S} si esprime per lo più con sicurezza e precisione; i pochi errori non compromettono la comprensione.',
      '{S} dispone di un lessico adeguato; diversi errori, per lo più lievi, compromettono appena la comprensione.',
      '{S} usa prevalentemente mezzi linguistici semplici; compaiono diversi errori, anche gravi, ma il messaggio resta nel complesso comprensibile.',
      '{S} dispone solo di un repertorio linguistico limitato; numerosi errori compromettono in parte la comprensione.',
      '{S} usa solo mezzi linguistici molto semplici; moltissimi errori, spesso gravi, compromettono chiaramente la comprensione.',
      '{S} commette così tanti errori elementari che il messaggio non risulta più comprensibile.'],
    inter: [
      'Nel dialogo {s} reagisce in modo flessibile e spontaneo, interagisce abilmente con gli interlocutori e si esprime con scioltezza.',
      'Nel dialogo {s} partecipa attivamente, reagisce per lo più bene agli interventi degli altri e parla con discreta scioltezza.',
      '{S} partecipa in modo adeguato alla conversazione e interagisce con gli interlocutori, pur esitando talvolta.',
      '{S} interagisce in modo poco flessibile con gli interlocutori, ma fa ancora riferimento in modo adeguato agli interventi degli altri; le ripetute esitazioni rendono talvolta difficile portare avanti il dialogo.',
      '{S} fa poco riferimento agli interventi degli altri, esita spesso e ha ripetutamente difficoltà a portare avanti il dialogo.',
      '{S} fa appena riferimento agli interventi degli altri, esita spesso e ha grandi difficoltà a gestire la situazione comunicativa.',
      'Non si realizza alcuna interazione con gli interlocutori.'],
    content: [
      '{S} svolge il compito in modo completo, sviluppa i contenuti in modo pertinente e ricco di idee ed esprime la propria opinione in modo convincente.',
      '{S} svolge il compito in gran parte e presenta i contenuti in modo per lo più pertinente e convincente.',
      '{S} svolge il compito nel complesso; la presentazione è in gran parte pertinente, ma a tratti si allontana dal tema.',
      '{S} svolge il compito ancora in modo sufficiente, ma la presentazione convince solo in parte.',
      '{S} svolge il compito solo in parte e si allontana spesso dal tema.',
      '{S} non svolge il compito richiesto.'],
    tip: {
      pron: 'Per migliorare si consiglia un allenamento mirato della pronuncia e dell’intonazione, ad esempio leggendo ad alta voce e ripetendo testi modello.',
      lang: 'Per migliorare si consiglia di consolidare il lessico e le strutture grammaticali.',
      inter: 'Per migliorare si consiglia di intervenire più spontaneamente e di usare espressioni utili per reagire agli interventi degli altri.',
      content: 'Per migliorare si consiglia una preparazione più accurata dei contenuti e una struttura più chiara dei propri interventi.' },
    top: 'Complimenti per questa prestazione!',
  },
  fr: {
    pron: [
      '{S} se fait très bien comprendre ; la prononciation et l’intonation sont toujours correctes.',
      '{S} se fait bien comprendre ; la prononciation et l’intonation sont le plus souvent correctes et les petites erreurs ne gênent pas la communication.',
      '{S} se fait en général bien comprendre, même si quelques erreurs de prononciation et d’intonation apparaissent.',
      '{S} se fait comprendre avec certaines difficultés ; la prononciation et l’intonation présentent des faiblesses visibles.',
      '{S} fait beaucoup d’erreurs de prononciation, ce qui limite fortement la compréhension.',
      'En raison de faiblesses importantes de prononciation et d’intonation, avec de très nombreuses erreurs, {s} se fait à peine comprendre.',
      'En raison d’une prononciation gravement fautive, {s} ne se fait plus comprendre.'],
    lang: [
      '{S} utilise avec aisance une large palette de moyens linguistiques, presque sans erreur.',
      '{S} s’exprime le plus souvent avec aisance et précision ; les quelques erreurs ne gênent pas la compréhension.',
      '{S} dispose d’un vocabulaire adapté ; plusieurs erreurs, le plus souvent légères, gênent à peine la compréhension.',
      '{S} utilise surtout des moyens linguistiques simples ; plusieurs erreurs, parfois graves, apparaissent, mais le message reste compréhensible dans l’ensemble.',
      '{S} ne dispose que d’un répertoire linguistique limité ; de nombreuses erreurs gênent par endroits la compréhension.',
      '{S} n’utilise que des moyens linguistiques très simples ; de très nombreuses erreurs, souvent graves, gênent nettement la compréhension.',
      '{S} fait tant d’erreurs élémentaires que le message n’est plus compréhensible.'],
    inter: [
      'Dans l’échange, {s} réagit de manière souple et spontanée, interagit habilement avec ses interlocuteurs et s’exprime avec aisance.',
      'Dans l’échange, {s} participe activement, réagit le plus souvent bien aux interventions des autres et parle de façon assez fluide.',
      '{S} participe de manière appropriée à la conversation et réagit aux interlocuteurs, mais hésite parfois.',
      '{S} interagit avec peu de souplesse avec ses interlocuteurs, mais réagit encore de manière appropriée aux interventions des autres ; des hésitations répétées rendent parfois difficile la poursuite de l’échange.',
      '{S} réagit peu aux interventions des autres, hésite souvent et a régulièrement du mal à poursuivre l’échange.',
      '{S} réagit à peine aux interventions des autres, hésite souvent et a beaucoup de mal à gérer la situation d’échange.',
      'Il n’y a pas d’interaction avec les interlocuteurs.'],
    content: [
      '{S} remplit entièrement la tâche, traite le contenu de manière pertinente et riche en idées et défend son opinion de façon convaincante.',
      '{S} remplit la tâche en grande partie et présente le contenu de manière le plus souvent pertinente et convaincante.',
      '{S} remplit la tâche dans l’ensemble ; la présentation est en grande partie pertinente, mais s’éloigne par endroits du sujet.',
      '{S} remplit encore la tâche dans l’ensemble, mais la présentation n’est que partiellement convaincante.',
      '{S} ne remplit la tâche qu’en partie et s’éloigne souvent du sujet.',
      '{S} ne remplit pas la tâche demandée.'],
    tip: {
      pron: 'Pour progresser, un entraînement ciblé de la prononciation et de l’intonation est recommandé, par exemple en lisant à voix haute et en répétant des textes modèles.',
      lang: 'Pour progresser, il est recommandé de consolider le vocabulaire et les structures grammaticales.',
      inter: 'Pour progresser, il est recommandé d’intervenir plus spontanément et d’utiliser des expressions utiles pour réagir aux autres.',
      content: 'Pour progresser, une préparation plus approfondie du contenu et une structure plus claire des interventions sont recommandées.' },
    top: 'Félicitations pour cette prestation !',
  },
  es: {
    pron: [
      '{S} se hace entender muy bien; la pronunciación y la entonación son siempre correctas.',
      '{S} se hace entender bien; la pronunciación y la entonación son en su mayoría correctas y los pequeños errores no afectan a la comunicación.',
      '{S} se hace entender por lo general bien, aunque aparecen algunos errores de pronunciación y entonación.',
      '{S} se hace entender con ciertas limitaciones; en la pronunciación y la entonación se aprecian debilidades claras.',
      '{S} comete muchos errores de pronunciación, por lo que la comprensibilidad queda muy limitada.',
      'A causa de graves debilidades en la pronunciación y la entonación, con muchísimos errores, apenas se le entiende.',
      'A causa de una pronunciación muy defectuosa, ya no se le entiende.'],
    lang: [
      '{S} utiliza con seguridad una amplia gama de recursos lingüísticos y casi sin errores.',
      '{S} se expresa en su mayoría con seguridad y precisión; los pocos errores no afectan a la comprensión.',
      '{S} dispone de un vocabulario adecuado; varios errores, en su mayoría leves, apenas afectan a la comprensión.',
      '{S} utiliza sobre todo recursos lingüísticos sencillos; aparecen varios errores, algunos de ellos graves, pero el mensaje sigue siendo comprensible en conjunto.',
      '{S} dispone solo de un repertorio lingüístico limitado; numerosos errores afectan en parte a la comprensión.',
      '{S} solo utiliza recursos lingüísticos muy sencillos; muchísimos errores, a menudo graves, afectan claramente a la comprensión.',
      '{S} comete tantos errores elementales que el mensaje ya no resulta comprensible.'],
    inter: [
      'En el diálogo {s} reacciona con flexibilidad y espontaneidad, interactúa con habilidad con los interlocutores y se expresa con fluidez.',
      'En el diálogo {s} participa activamente, reacciona en su mayoría bien a las intervenciones de los demás y habla con bastante fluidez.',
      '{S} participa de forma adecuada en la conversación y responde a los interlocutores, aunque vacila de vez en cuando.',
      '{S} interactúa con poca flexibilidad con los interlocutores, pero todavía responde de forma adecuada a las intervenciones de los demás; las vacilaciones repetidas dificultan a veces continuar el diálogo.',
      '{S} se refiere poco a las intervenciones de los demás, vacila a menudo y tiene repetidas dificultades para continuar el diálogo.',
      '{S} apenas se refiere a las intervenciones de los demás, vacila a menudo y tiene grandes dificultades para manejar la situación comunicativa.',
      'No se produce interacción con los interlocutores.'],
    content: [
      '{S} cumple la tarea por completo, desarrolla los contenidos de forma pertinente y rica en ideas y expone su opinión de manera convincente.',
      '{S} cumple la tarea en gran parte y presenta los contenidos de forma en su mayoría pertinente y convincente.',
      '{S} cumple la tarea en líneas generales; la exposición es en gran parte pertinente, pero en algunos puntos se aparta del tema.',
      '{S} todavía cumple la tarea en conjunto, pero la exposición convence solo en parte.',
      '{S} cumple la tarea solo en parte y se aparta con frecuencia del tema.',
      '{S} no cumple la tarea planteada.'],
    tip: {
      pron: 'Para seguir mejorando se recomienda un entrenamiento específico de la pronunciación y la entonación, por ejemplo leyendo en voz alta y repitiendo textos modelo.',
      lang: 'Para seguir mejorando se recomienda consolidar el vocabulario y las estructuras gramaticales.',
      inter: 'Para seguir mejorando se recomienda intervenir con más espontaneidad y utilizar expresiones útiles para responder a los demás.',
      content: 'Para seguir mejorando se recomienda una preparación más cuidadosa de los contenidos y una estructura más clara de las propias intervenciones.' },
    top: '¡Enhorabuena por este rendimiento!',
  },
};

/* Referat (monologisch): Aussprache / Intonation / Flüssigkeit – 7 Stufen wie Aussprache, eng an den ISB-Deskriptoren (inkl. Zögern/stockend) */
const FLU = {
  de: ['{S} spricht flüssig und sehr gut verständlich; Aussprache und Intonation sind durchweg korrekt.',
    '{S} spricht meist flüssig und ist gut verständlich; kleinere Aussprache- und Intonationsfehler stören die Kommunikation nicht.',
    '{S} ist in der Regel gut verständlich und spricht weitgehend flüssig, zögert aber gelegentlich; einzelne Aussprache- und Intonationsfehler treten auf.',
    '{S} ist mit gewissen Einschränkungen verständlich; in Aussprache und Intonation zeigen sich erkennbare Schwächen, und {s} zögert wiederholt.',
    '{S} macht viele Aussprachefehler und zögert häufig, sodass die Verständlichkeit stark eingeschränkt ist.',
    'Aufgrund sehr vieler Aussprachefehler und eines stockenden Vortrags ist {s} kaum mehr verständlich.',
    'Aufgrund grob fehlerhafter Aussprache und eines sehr stockenden Vortrags ist {s} nicht mehr verständlich.'],
  en: ['{S} speaks fluently and is very easy to understand; pronunciation and intonation are consistently accurate.',
    '{S} speaks mostly fluently and is easy to understand; minor slips in pronunciation and intonation do not affect communication.',
    '{S} is generally easy to understand and speaks largely fluently, but hesitates occasionally; some errors in pronunciation and intonation occur.',
    '{S} can be understood with some limitations; there are noticeable weaknesses in pronunciation and intonation, and {s} hesitates repeatedly.',
    '{S} makes many pronunciation errors and hesitates frequently, which severely limits how well {s} can be understood.',
    'Because of very many pronunciation errors and a halting delivery, {s} can hardly be understood.',
    'Because of seriously flawed pronunciation and a very halting delivery, {s} can no longer be understood.'],
  it: ['{S} parla in modo scorrevole e si fa capire molto bene; pronuncia e intonazione sono sempre corrette.',
    '{S} parla in modo per lo più scorrevole e si fa capire bene; i piccoli errori di pronuncia e di intonazione non disturbano la comunicazione.',
    '{S} si fa capire in genere bene e parla in modo abbastanza scorrevole, ma esita di tanto in tanto; compaiono alcuni errori di pronuncia e di intonazione.',
    '{S} si fa capire con qualche difficoltà; nella pronuncia e nell’intonazione si notano debolezze evidenti ed esita ripetutamente.',
    '{S} commette molti errori di pronuncia ed esita spesso, per cui la comprensibilità risulta fortemente limitata.',
    'A causa di moltissimi errori di pronuncia e di un eloquio stentato, {s} si fa capire a malapena.',
    'A causa di una pronuncia gravemente scorretta e di un eloquio molto stentato, {s} non si fa più capire.'],
  fr: ['{S} s’exprime avec aisance et se fait très bien comprendre ; la prononciation et l’intonation sont toujours correctes.',
    '{S} s’exprime le plus souvent avec aisance et se fait bien comprendre ; les petites erreurs de prononciation et d’intonation ne gênent pas la communication.',
    '{S} se fait en général bien comprendre et s’exprime de manière assez fluide, mais hésite parfois ; quelques erreurs de prononciation et d’intonation apparaissent.',
    '{S} se fait comprendre avec certaines difficultés ; la prononciation et l’intonation présentent des faiblesses visibles et {s} hésite à plusieurs reprises.',
    '{S} fait beaucoup d’erreurs de prononciation et hésite souvent, ce qui limite fortement la compréhension.',
    'En raison de très nombreuses erreurs de prononciation et d’un débit hésitant, {s} se fait à peine comprendre.',
    'En raison d’une prononciation gravement fautive et d’un débit très hésitant, {s} ne se fait plus comprendre.'],
  es: ['{S} habla con fluidez y se hace entender muy bien; la pronunciación y la entonación son siempre correctas.',
    '{S} habla en general con fluidez y se hace entender bien; los pequeños errores de pronunciación y entonación no afectan a la comunicación.',
    '{S} se hace entender por lo general bien y habla con bastante fluidez, aunque duda de vez en cuando; aparecen algunos errores de pronunciación y entonación.',
    '{S} se hace entender con ciertas limitaciones; en la pronunciación y la entonación se aprecian debilidades claras y vacila repetidamente.',
    '{S} comete muchos errores de pronunciación y duda con frecuencia, por lo que la comprensibilidad queda muy limitada.',
    'A causa de muchísimos errores de pronunciación y de un discurso entrecortado, apenas se le entiende.',
    'A causa de una pronunciación muy defectuosa y de un discurso muy entrecortado, ya no se le entiende.'],
};
const FLU_TIP = {
  de: 'Für die Weiterarbeit empfiehlt sich gezieltes Training von Aussprache und flüssigem Sprechen, etwa durch lautes Lesen und mehrmaliges Üben des Vortrags.',
  en: 'To improve further, focused practice of pronunciation and fluent speaking is recommended, for example by reading aloud and rehearsing the presentation several times.',
  it: 'Per migliorare si consiglia un allenamento mirato della pronuncia e della scorrevolezza, ad esempio leggendo ad alta voce e provando più volte la presentazione.',
  fr: 'Pour progresser, un entraînement ciblé de la prononciation et de l’aisance à l’oral est recommandé, par exemple en lisant à voix haute et en répétant plusieurs fois l’exposé.',
  es: 'Para seguir mejorando se recomienda un entrenamiento específico de la pronunciación y la fluidez, por ejemplo leyendo en voz alta y ensayando varias veces la presentación.',
};
/* Stufengenaue Fassungen je ISB-Raster: Wo die Deskriptoren eines Niveaus anders lauten als die Grundfassung (B1),
   ersetzt LEVEL einzelne Bausteine (Schlüssel = Baustein-Stufe − 1). Abgleich Satz für Satz mit raster.js / raster_mono.js:
   A1:  „stets verständlich trotz merklichem Akzent“, „korrekte Aussprache eines bekannten Repertoires an Wörtern“, „einfaches Spektrum“,
        Gespräch „zusammenhängende Äußerungen“ (nicht „flüssig“, nicht „flexibel/spontan“).
   A2:  „stets verständlich“, „in der Regel verständlich“, „grundlegendes Spektrum“, Gespräch „flüssige und auch längere, zusammenhängende Äußerungen“.
   NP (Q12/13): „Sprachliche Leistung“ umfasst Sprachrichtigkeit, Wortschatz UND Aussprache – eigener Satz je Notenstufe 1–6. */
const A_LANG = {   /* A1/A2 (Prüfung und Referat): Spektrum „der Lernstufe entsprechend“ (A1 einfach, A2 grundlegend) – nie „breit“ */
  de: { 0: '{S} verwendet die der Lernstufe entsprechenden sprachlichen Mittel durchgehend sicher und nahezu fehlerfrei.',
        1: '{S} verwendet die der Lernstufe entsprechenden sprachlichen Mittel meist sicher; die wenigen, überwiegend leichten Fehler beeinträchtigen die Verständlichkeit nicht wesentlich.',
        2: '{S} verwendet die der Lernstufe entsprechenden sprachlichen Mittel im Allgemeinen sicher; mehrere Fehler beeinträchtigen die Verständlichkeit nur geringfügig.',
        3: '{S} verwendet die sprachlichen Mittel der Lernstufe nur teilweise sicher; mehrere, gelegentlich auch gravierende Fehler treten auf, die Verständlichkeit bleibt aber insgesamt gewährleistet.' },
  en: { 0: '{S} uses the language appropriate to this level confidently and almost without errors throughout.',
        1: '{S} mostly uses the language appropriate to this level confidently; the few, mostly minor errors do not significantly affect comprehension.',
        2: '{S} generally uses the language appropriate to this level confidently; several errors affect comprehension only slightly.',
        3: '{S} uses the language of this level only partly confidently; several errors, occasionally serious ones, occur, but the message still comes across.' },
  it: { 0: '{S} usa con sicurezza e quasi senza errori i mezzi linguistici adeguati al livello.',
        1: '{S} usa per lo più con sicurezza i mezzi linguistici adeguati al livello; i pochi errori, per lo più lievi, non compromettono in modo rilevante la comprensione.',
        2: '{S} usa in genere con sicurezza i mezzi linguistici adeguati al livello; diversi errori compromettono la comprensione solo in minima parte.',
        3: '{S} usa i mezzi linguistici del livello solo in parte con sicurezza; compaiono diversi errori, talvolta anche gravi, ma il messaggio resta nel complesso comprensibile.' },
  fr: { 0: '{S} utilise avec assurance et presque sans erreur les moyens linguistiques correspondant à son niveau.',
        1: '{S} utilise le plus souvent avec assurance les moyens linguistiques correspondant à son niveau ; les quelques erreurs, surtout légères, ne gênent pas vraiment la compréhension.',
        2: '{S} utilise en général avec assurance les moyens linguistiques correspondant à son niveau ; plusieurs erreurs ne gênent que légèrement la compréhension.',
        3: '{S} n’utilise les moyens linguistiques de son niveau qu’en partie avec assurance ; plusieurs erreurs, parfois graves, apparaissent, mais le message reste compréhensible dans l’ensemble.' },
  es: { 0: '{S} utiliza con seguridad y casi sin errores los recursos lingüísticos propios de su nivel.',
        1: '{S} utiliza en su mayoría con seguridad los recursos lingüísticos propios de su nivel; los pocos errores, en su mayoría leves, no afectan de forma importante a la comprensión.',
        2: '{S} utiliza por lo general con seguridad los recursos lingüísticos propios de su nivel; varios errores afectan a la comprensión solo ligeramente.',
        3: '{S} utiliza los recursos lingüísticos de su nivel solo en parte con seguridad; aparecen varios errores, a veces graves, pero el mensaje sigue siendo comprensible en conjunto.' },
};
const A_PRON4 = {  /* A1/A2 Stufe 4: „in der Regel verständlich“, „wenige … nur geringfügig“ */
  de: '{S} ist in der Regel verständlich; wenige Aussprache- und Intonationsfehler beeinträchtigen die Kommunikation nur geringfügig.',
  en: '{S} can generally be understood; a few errors in pronunciation and intonation affect communication only slightly.',
  it: '{S} si fa in genere capire; pochi errori di pronuncia e di intonazione disturbano la comunicazione solo in minima parte.',
  fr: '{S} se fait en général comprendre ; quelques erreurs de prononciation et d’intonation ne gênent que légèrement la communication.',
  es: '{S} se hace entender por lo general; unos pocos errores de pronunciación y entonación afectan a la comunicación solo ligeramente.',
};
const A_FLU4 = {   /* Referat A1/A2 Stufe 4: zusätzlich „gelegentliches Zögern“ */
  de: '{S} ist in der Regel verständlich, zögert aber gelegentlich; wenige Aussprache- und Intonationsfehler beeinträchtigen die Kommunikation nur geringfügig.',
  en: '{S} can generally be understood but hesitates occasionally; a few errors in pronunciation and intonation affect communication only slightly.',
  it: '{S} si fa in genere capire, ma esita di tanto in tanto; pochi errori di pronuncia e di intonazione disturbano la comunicazione solo in minima parte.',
  fr: '{S} se fait en général comprendre, mais hésite parfois ; quelques erreurs de prononciation et d’intonation ne gênent que légèrement la communication.',
  es: '{S} se hace entender por lo general, aunque duda de vez en cuando; unos pocos errores de pronunciación y entonación afectan a la comunicación solo ligeramente.',
};
const LEVEL = {
  de: {
    A1: { pron: { 0: '{S} ist stets verständlich und spricht die bekannten Wörter korrekt aus.',
                  1: '{S} ist meist verständlich und spricht die bekannten Wörter meist korrekt aus; kleinere Aussprache- und Intonationsfehler beeinträchtigen die Kommunikation nicht.',
                  2: A_PRON4.de,
                  3: '{S} ist mit gewissen Einschränkungen verständlich; in der Aussprache zeigen sich erkennbare Schwächen.',
                  5: 'Aufgrund massiver Schwächen in der Aussprache mit sehr vielen Aussprachefehlern ist {s} kaum mehr verständlich.' },
          inter: { 0: '{S} beteiligt sich sehr gut am Gespräch, interagiert geschickt mit den Gesprächspartnern und äußert sich zusammenhängend.',
                   1: '{S} beteiligt sich gut am Gespräch, interagiert meist erfolgreich mit den Gesprächspartnern und äußert sich meist zusammenhängend.' } },
    A2: { pron: { 0: '{S} ist stets verständlich; Aussprache und Intonation sind korrekt.', 2: A_PRON4.de },
          inter: { 0: '{S} beteiligt sich sehr gut am Gespräch, interagiert stets erfolgreich mit den Gesprächspartnern und äußert sich flüssig und auch länger zusammenhängend.',
                   1: '{S} beteiligt sich gut am Gespräch, interagiert meist erfolgreich mit den Gesprächspartnern und äußert sich meist flüssig und zusammenhängend.' } },
    A1M: { flu: { 0: '{S} äußert sich zusammenhängend und ist stets verständlich; die bekannten Wörter spricht {s} korrekt aus.',
                  1: '{S} äußert sich meist zusammenhängend und ist meist verständlich; kleinere Aussprache- und Intonationsfehler beeinträchtigen die Kommunikation nicht.',
                  2: A_FLU4.de,
                  3: '{S} ist mit gewissen Einschränkungen verständlich; in der Aussprache zeigen sich erkennbare Schwächen, und {s} zögert wiederholt.' } },
    A2M: { flu: { 0: '{S} spricht flüssig und ist stets verständlich; Aussprache und Intonation sind korrekt.', 2: A_FLU4.de } },
    NP: { npLang: [
      '{S} verwendet auch komplexere Strukturen in hohem Maße korrekt, wählt die Worte besonders präzise, differenziert und idiomatisch und ist bei korrekter Aussprache und wirkungsvoller Intonation sehr gut verständlich.',
      '{S} verwendet auch komplexere Strukturen meist korrekt und verfügt über einen breiten, treffsicheren und meist idiomatischen Wortschatz; Aussprache und Intonation sind überwiegend korrekt, {s} ist gut verständlich.',
      '{S} macht mehrere Verstöße gegen die Sprachnorm, welche die Verständlichkeit nicht beeinträchtigen, und verwendet einen einfachen, aber themenadäquaten Wortschatz weitgehend sicher; kleinere Aussprache- und Intonationsfehler beeinträchtigen das Gespräch nicht wesentlich.',
      '{S} macht mehrere, vereinzelt auch gröbere Verstöße gegen die Sprachnorm, welche die Verständlichkeit stellenweise beeinträchtigen; der begrenzte Wortschatz ermöglicht noch eine angemessene Darstellung, einige Aussprachefehler beeinträchtigen die Kommunikation teilweise.',
      '{S} macht zahlreiche, auch grobe Verstöße gegen die Sprachnorm und verwendet einen sehr begrenzten, äußerst einfachen Wortschatz; zusammen mit vielen Aussprachefehlern beeinträchtigt dies die Verständlichkeit erheblich.',
      'Aufgrund elementarer Verstöße in allen Bereichen, erheblicher Wortschatzlücken und grob fehlerhafter Aussprache ist {s} meist nicht mehr verständlich.'] },
  },
  en: {
    A1: { pron: { 0: '{S} can always be understood and pronounces familiar words correctly.',
                  1: '{S} can mostly be understood and mostly pronounces familiar words correctly; minor slips in pronunciation and intonation do not affect communication.',
                  2: A_PRON4.en,
                  3: '{S} can be understood with some limitations; there are noticeable weaknesses in pronunciation.',
                  5: 'Because of major weaknesses in pronunciation, with very many errors, {s} can hardly be understood.' },
          inter: { 0: '{S} contributes very well to the conversation, interacts skilfully with the other speakers and speaks coherently.',
                   1: '{S} contributes well to the conversation, mostly interacts successfully with the other speakers and mostly speaks coherently.' } },
    A2: { pron: { 0: '{S} can always be understood; pronunciation and intonation are accurate.', 2: A_PRON4.en },
          inter: { 0: '{S} contributes very well to the conversation, always interacts successfully with the other speakers and speaks fluently and coherently, even at greater length.',
                   1: '{S} contributes well to the conversation, mostly interacts successfully with the other speakers and mostly speaks fluently and coherently.' } },
    A1M: { flu: { 0: '{S} speaks coherently and can always be understood; familiar words are pronounced correctly.',
                  1: '{S} mostly speaks coherently and can mostly be understood; minor slips in pronunciation and intonation do not affect communication.',
                  2: A_FLU4.en,
                  3: '{S} can be understood with some limitations; there are noticeable weaknesses in pronunciation, and {s} hesitates repeatedly.' } },
    A2M: { flu: { 0: '{S} speaks fluently and can always be understood; pronunciation and intonation are accurate.', 2: A_FLU4.en } },
    NP: { npLang: [
      '{S} uses even complex structures with a high degree of accuracy, chooses words very precisely, with nuance and idiomatically, and is very easy to understand thanks to accurate pronunciation and effective intonation.',
      '{S} mostly uses even complex structures accurately and has a wide, precise and mostly idiomatic vocabulary; pronunciation and intonation are largely accurate and {s} is easy to understand.',
      '{S} makes several errors that do not affect comprehension and uses a simple but topic-appropriate vocabulary largely confidently; minor slips in pronunciation and intonation do not significantly affect the conversation.',
      '{S} makes several errors, occasionally more serious ones, which affect comprehension in places; the limited vocabulary still allows an adequate presentation, and some pronunciation errors partly affect communication.',
      '{S} makes numerous, sometimes serious errors and uses a very limited, extremely simple vocabulary; together with many pronunciation errors, this seriously affects comprehension.',
      'Because of basic errors in all areas, considerable gaps in vocabulary and seriously flawed pronunciation, {s} can mostly no longer be understood.'] },
  },
  it: {
    A1: { pron: { 0: '{S} si fa sempre capire e pronuncia correttamente le parole note.',
                  1: '{S} si fa per lo più capire e pronuncia per lo più correttamente le parole note; i piccoli errori di pronuncia e di intonazione non disturbano la comunicazione.',
                  2: A_PRON4.it,
                  3: '{S} si fa capire con qualche difficoltà; nella pronuncia si notano debolezze evidenti.',
                  5: 'A causa di gravi debolezze nella pronuncia, con moltissimi errori, {s} si fa capire a malapena.' },
          inter: { 0: '{S} partecipa molto bene alla conversazione, interagisce abilmente con gli interlocutori e si esprime in modo coerente.',
                   1: '{S} partecipa bene alla conversazione, interagisce per lo più con successo con gli interlocutori e si esprime per lo più in modo coerente.' } },
    A2: { pron: { 0: '{S} si fa sempre capire; pronuncia e intonazione sono corrette.', 2: A_PRON4.it },
          inter: { 0: '{S} partecipa molto bene alla conversazione, interagisce sempre con successo con gli interlocutori e si esprime con scioltezza e in modo coerente, anche più a lungo.',
                   1: '{S} partecipa bene alla conversazione, interagisce per lo più con successo con gli interlocutori e si esprime per lo più con scioltezza e in modo coerente.' } },
    A1M: { flu: { 0: '{S} si esprime in modo coerente e si fa sempre capire; pronuncia correttamente le parole note.',
                  1: '{S} si esprime per lo più in modo coerente e si fa per lo più capire; i piccoli errori di pronuncia e di intonazione non disturbano la comunicazione.',
                  2: A_FLU4.it,
                  3: '{S} si fa capire con qualche difficoltà; nella pronuncia si notano debolezze evidenti ed esita ripetutamente.' } },
    A2M: { flu: { 0: '{S} parla in modo scorrevole e si fa sempre capire; pronuncia e intonazione sono corrette.', 2: A_FLU4.it } },
    NP: { npLang: [
      '{S} usa in modo altamente corretto anche strutture complesse, sceglie le parole in modo particolarmente preciso, differenziato e idiomatico e si fa capire molto bene grazie a una pronuncia corretta e a un’intonazione efficace.',
      '{S} usa per lo più correttamente anche strutture complesse e dispone di un lessico ampio, preciso e per lo più idiomatico; pronuncia e intonazione sono per lo più corrette e {s} si fa capire bene.',
      '{S} commette diversi errori che non compromettono la comprensione e usa con discreta sicurezza un lessico semplice ma adeguato al tema; i piccoli errori di pronuncia e di intonazione non disturbano in modo rilevante il dialogo.',
      '{S} commette diversi errori, talvolta anche più gravi, che compromettono in parte la comprensione; il lessico limitato consente ancora un’esposizione adeguata e alcuni errori di pronuncia disturbano in parte la comunicazione.',
      '{S} commette numerosi errori, anche gravi, e usa un lessico molto limitato ed estremamente semplice; insieme a molti errori di pronuncia, ciò compromette seriamente la comprensione.',
      'A causa di errori elementari in tutti gli ambiti, di gravi lacune lessicali e di una pronuncia gravemente scorretta, {s} per lo più non si fa più capire.'] },
  },
  fr: {
    A1: { pron: { 0: '{S} se fait toujours comprendre et prononce correctement les mots connus.',
                  1: '{S} se fait le plus souvent comprendre et prononce le plus souvent correctement les mots connus ; les petites erreurs de prononciation et d’intonation ne gênent pas la communication.',
                  2: A_PRON4.fr,
                  3: '{S} se fait comprendre avec certaines difficultés ; la prononciation présente des faiblesses visibles.',
                  5: 'En raison de faiblesses importantes de prononciation, avec de très nombreuses erreurs, {s} se fait à peine comprendre.' },
          inter: { 0: '{S} participe très bien à la conversation, interagit habilement avec ses interlocuteurs et s’exprime de manière cohérente.',
                   1: '{S} participe bien à la conversation, interagit le plus souvent avec succès avec ses interlocuteurs et s’exprime le plus souvent de manière cohérente.' } },
    A2: { pron: { 0: '{S} se fait toujours comprendre ; la prononciation et l’intonation sont correctes.', 2: A_PRON4.fr },
          inter: { 0: '{S} participe très bien à la conversation, interagit toujours avec succès avec ses interlocuteurs et s’exprime avec aisance et de manière cohérente, même plus longuement.',
                   1: '{S} participe bien à la conversation, interagit le plus souvent avec succès avec ses interlocuteurs et s’exprime le plus souvent avec aisance et de manière cohérente.' } },
    A1M: { flu: { 0: '{S} s’exprime de manière cohérente et se fait toujours comprendre ; les mots connus sont prononcés correctement.',
                  1: '{S} s’exprime le plus souvent de manière cohérente et se fait le plus souvent comprendre ; les petites erreurs de prononciation et d’intonation ne gênent pas la communication.',
                  2: A_FLU4.fr,
                  3: '{S} se fait comprendre avec certaines difficultés ; la prononciation présente des faiblesses visibles et {s} hésite à plusieurs reprises.' } },
    A2M: { flu: { 0: '{S} s’exprime avec aisance et se fait toujours comprendre ; la prononciation et l’intonation sont correctes.', 2: A_FLU4.fr } },
    NP: { npLang: [
      '{S} utilise avec une grande correction même des structures complexes, choisit ses mots de façon particulièrement précise, nuancée et idiomatique et se fait très bien comprendre grâce à une prononciation correcte et une intonation efficace.',
      '{S} utilise le plus souvent correctement même des structures complexes et dispose d’un vocabulaire riche, précis et le plus souvent idiomatique ; la prononciation et l’intonation sont en grande partie correctes et {s} se fait bien comprendre.',
      '{S} fait plusieurs erreurs qui ne gênent pas la compréhension et utilise avec une assez grande assurance un vocabulaire simple mais adapté au sujet ; les petites erreurs de prononciation et d’intonation ne gênent pas vraiment l’échange.',
      '{S} fait plusieurs erreurs, parfois plus graves, qui gênent par endroits la compréhension ; le vocabulaire limité permet encore une présentation appropriée, et quelques erreurs de prononciation gênent en partie la communication.',
      '{S} fait de nombreuses erreurs, parfois graves, et utilise un vocabulaire très limité et extrêmement simple ; avec de nombreuses erreurs de prononciation, cela gêne fortement la compréhension.',
      'En raison d’erreurs élémentaires dans tous les domaines, de lacunes lexicales importantes et d’une prononciation gravement fautive, {s} ne se fait le plus souvent plus comprendre.'] },
  },
  es: {
    A1: { pron: { 0: '{S} se hace entender siempre y pronuncia correctamente las palabras conocidas.',
                  1: '{S} se hace entender en general y pronuncia en general correctamente las palabras conocidas; los pequeños errores de pronunciación y entonación no afectan a la comunicación.',
                  2: A_PRON4.es,
                  3: '{S} se hace entender con ciertas limitaciones; en la pronunciación se aprecian debilidades claras.',
                  5: 'A causa de graves debilidades en la pronunciación, con muchísimos errores, apenas se le entiende.' },
          inter: { 0: '{S} participa muy bien en la conversación, interactúa con habilidad con los interlocutores y se expresa de forma coherente.',
                   1: '{S} participa bien en la conversación, interactúa en su mayoría con éxito con los interlocutores y se expresa en general de forma coherente.' } },
    A2: { pron: { 0: '{S} se hace entender siempre; la pronunciación y la entonación son correctas.', 2: A_PRON4.es },
          inter: { 0: '{S} participa muy bien en la conversación, interactúa siempre con éxito con los interlocutores y se expresa con fluidez y de forma coherente, también de manera más extensa.',
                   1: '{S} participa bien en la conversación, interactúa en su mayoría con éxito con los interlocutores y se expresa en general con fluidez y de forma coherente.' } },
    A1M: { flu: { 0: '{S} se expresa de forma coherente y se hace entender siempre; pronuncia correctamente las palabras conocidas.',
                  1: '{S} se expresa en general de forma coherente y se hace entender en general; los pequeños errores de pronunciación y entonación no afectan a la comunicación.',
                  2: A_FLU4.es,
                  3: '{S} se hace entender con ciertas limitaciones; en la pronunciación se aprecian debilidades claras y vacila repetidamente.' } },
    A2M: { flu: { 0: '{S} habla con fluidez y se hace entender siempre; la pronunciación y la entonación son correctas.', 2: A_FLU4.es } },
    NP: { npLang: [
      '{S} utiliza con gran corrección incluso estructuras complejas, elige las palabras de forma especialmente precisa, matizada e idiomática y se hace entender muy bien gracias a una pronunciación correcta y una entonación eficaz.',
      '{S} utiliza en su mayoría correctamente incluso estructuras complejas y dispone de un vocabulario amplio, preciso y en general idiomático; la pronunciación y la entonación son mayormente correctas y se le entiende bien.',
      '{S} comete varios errores que no afectan a la comprensión y utiliza con bastante seguridad un vocabulario sencillo pero adecuado al tema; los pequeños errores de pronunciación y entonación no afectan de forma importante al diálogo.',
      '{S} comete varios errores, a veces más graves, que afectan en parte a la comprensión; el vocabulario limitado permite todavía una exposición adecuada y algunos errores de pronunciación afectan en parte a la comunicación.',
      '{S} comete numerosos errores, algunos graves, y utiliza un vocabulario muy limitado y extremadamente sencillo; junto con muchos errores de pronunciación, esto afecta seriamente a la comprensión.',
      'A causa de errores elementales en todos los ámbitos, de grandes lagunas léxicas y de una pronunciación muy defectuosa, por lo general ya no se le entiende.'] },
  },
};
for (const l of Object.keys(LEVEL)) for (const d of ['A1', 'A2', 'A1M', 'A2M']) LEVEL[l][d].lang = A_LANG[l];

/* A1/A2: Gespräch Stufen 3–1 mit „Beteiligung“ (nur diese Raster nennen sie); Oberstufe: eigene Sätze für Gespräch und Inhalt */
const A_INTER = {
 "de": {
  "3": "{S} beteiligt sich zurückhaltend am Gespräch und interagiert wenig flexibel mit den Gesprächspartnern; wiederholtes Zögern führt gelegentlich zu Schwierigkeiten, das Gespräch fortzuführen.",
  "4": "{S} beteiligt sich wenig am Gespräch, geht wenig auf andere Beiträge ein, zögert häufig und hat wiederholt Schwierigkeiten, das Gespräch fortzuführen.",
  "5": "{S} beteiligt sich kaum am Gespräch, geht kaum auf andere Beiträge ein, zögert häufig und hat große Schwierigkeiten, die Gesprächssituation zu bewältigen."
 },
 "en": {
  "3": "{S} takes a reserved part in the conversation and interacts with little flexibility; repeated hesitation occasionally makes it difficult to keep the conversation going.",
  "4": "{S} takes little part in the conversation, responds little to the others, hesitates often and repeatedly finds it difficult to keep the conversation going.",
  "5": "{S} hardly takes part in the conversation, hardly responds to others, hesitates often and finds it very difficult to cope with the conversation."
 },
 "it": {
  "3": "{S} partecipa in modo riservato alla conversazione e interagisce in modo poco flessibile con gli interlocutori; le ripetute esitazioni rendono talvolta difficile portare avanti il dialogo.",
  "4": "{S} partecipa poco alla conversazione, fa poco riferimento agli interventi degli altri, esita spesso e ha ripetutamente difficoltà a portare avanti il dialogo.",
  "5": "{S} partecipa appena alla conversazione, fa appena riferimento agli interventi degli altri, esita spesso e ha grandi difficoltà a gestire la situazione comunicativa."
 },
 "fr": {
  "3": "{S} participe de façon réservée à la conversation et interagit avec peu de souplesse avec ses interlocuteurs ; des hésitations répétées rendent parfois difficile la poursuite de l’échange.",
  "4": "{S} participe peu à la conversation, réagit peu aux interventions des autres, hésite souvent et a régulièrement du mal à poursuivre l’échange.",
  "5": "{S} ne participe presque pas à la conversation, réagit à peine aux interventions des autres, hésite souvent et a beaucoup de mal à gérer la situation d’échange."
 },
 "es": {
  "3": "{S} participa de forma reservada en la conversación e interactúa con poca flexibilidad con los interlocutores; las vacilaciones repetidas dificultan a veces continuar el diálogo.",
  "4": "{S} participa poco en la conversación, apenas se refiere a las intervenciones de los demás, vacila a menudo y tiene repetidas dificultades para continuar el diálogo.",
  "5": "{S} apenas participa en la conversación, apenas se refiere a las intervenciones de los demás, vacila a menudo y tiene grandes dificultades para manejar la situación comunicativa."
 }
};
const NP_INTER = {
 "de": [
  "{S} reagiert auch in komplexeren Gesprächssituationen spontan, bringt den Dialog aktiv voran, geht sehr geschickt und souverän auf die Gesprächspartner ein und äußert sich sehr flüssig.",
  "{S} gestaltet das Gespräch positiv mit, bezieht die Gesprächspartner geschickt ein, geht weitgehend flexibel und spontan auf sie ein und äußert sich insgesamt flüssig.",
  "{S} beteiligt sich angemessen am Gespräch, interagiert meist flexibel, geht im Allgemeinen spontan und angemessen auf die Beiträge der anderen ein und äußert sich im Allgemeinen flüssig.",
  "{S} zeigt wenig Eigeninitiative im Gespräch und interagiert wenig flexibel, geht aber noch angemessen auf andere Beiträge ein; wiederholtes Zögern führt teils zu erkennbaren Schwierigkeiten, das Gespräch fortzuführen.",
  "{S} hat deutliche Schwierigkeiten, das Gespräch mitzugestalten, geht kaum auf andere Beiträge ein, zögert häufig und hat große Schwierigkeiten, etwas komplexere Gesprächssituationen zu bewältigen.",
  "Eine Interaktion mit den Gesprächspartnern kommt nicht zustande."
 ],
 "en": [
  "{S} responds spontaneously even in more complex situations, actively moves the dialogue forward, engages very skilfully and confidently with the other speakers and speaks very fluently.",
  "{S} has a positive influence on the conversation, skilfully involves the other speakers, responds to them largely flexibly and spontaneously and speaks fluently overall.",
  "{S} takes an appropriate part in the conversation, mostly interacts flexibly, generally responds spontaneously and appropriately to the others and generally speaks fluently.",
  "{S} shows little initiative in the conversation and interacts with little flexibility, but still responds adequately to others; repeated hesitation at times leads to noticeable difficulty in keeping the conversation going.",
  "{S} has clear difficulty in shaping the conversation, hardly responds to others, hesitates often and finds it very difficult to cope with somewhat more complex situations.",
  "There is no interaction with the other speakers."
 ],
 "it": [
  "{S} reagisce in modo spontaneo anche in situazioni comunicative più complesse, porta avanti attivamente il dialogo, interagisce con grande abilità e sicurezza con gli interlocutori e si esprime con grande scioltezza.",
  "{S} contribuisce positivamente alla conversazione, coinvolge abilmente gli interlocutori, reagisce in modo per lo più flessibile e spontaneo e si esprime nel complesso con scioltezza.",
  "{S} partecipa in modo adeguato alla conversazione, interagisce in modo per lo più flessibile, fa in genere riferimento in modo spontaneo e adeguato agli interventi degli altri e si esprime in genere con scioltezza.",
  "{S} mostra poca iniziativa nella conversazione e interagisce in modo poco flessibile, ma fa ancora riferimento in modo adeguato agli interventi degli altri; le ripetute esitazioni causano a tratti evidenti difficoltà a portare avanti il dialogo.",
  "{S} ha chiare difficoltà a contribuire alla conversazione, fa appena riferimento agli interventi degli altri, esita spesso e ha grandi difficoltà a gestire situazioni comunicative un po’ più complesse.",
  "Non si realizza alcuna interazione con gli interlocutori."
 ],
 "fr": [
  "{S} réagit spontanément même dans des situations d’échange plus complexes, fait avancer activement le dialogue, interagit avec beaucoup d’habileté et d’assurance avec ses interlocuteurs et s’exprime avec une grande aisance.",
  "{S} influence positivement l’échange, implique habilement ses interlocuteurs, réagit de manière le plus souvent souple et spontanée et s’exprime avec aisance dans l’ensemble.",
  "{S} participe de manière appropriée à la conversation, interagit le plus souvent avec souplesse, réagit en général de manière spontanée et appropriée aux interventions des autres et s’exprime en général avec aisance.",
  "{S} montre peu d’initiative dans la conversation et interagit avec peu de souplesse, mais réagit encore de manière appropriée aux interventions des autres ; des hésitations répétées entraînent parfois des difficultés visibles à poursuivre l’échange.",
  "{S} a nettement du mal à participer à l’échange, réagit à peine aux interventions des autres, hésite souvent et a beaucoup de mal à gérer des situations d’échange un peu plus complexes.",
  "Il n’y a pas d’interaction avec les interlocuteurs."
 ],
 "es": [
  "{S} reacciona con espontaneidad incluso en situaciones comunicativas más complejas, hace avanzar activamente el diálogo, interactúa con gran habilidad y seguridad con los interlocutores y se expresa con gran fluidez.",
  "{S} influye positivamente en la conversación, implica con habilidad a los interlocutores, reacciona de forma en su mayoría flexible y espontánea y se expresa en conjunto con fluidez.",
  "{S} participa de forma adecuada en la conversación, interactúa en su mayoría con flexibilidad, responde por lo general de forma espontánea y adecuada a las intervenciones de los demás y se expresa por lo general con fluidez.",
  "{S} muestra poca iniciativa en la conversación e interactúa con poca flexibilidad, pero todavía responde de forma adecuada a las intervenciones de los demás; las vacilaciones repetidas provocan a veces dificultades evidentes para continuar el diálogo.",
  "{S} tiene claras dificultades para contribuir a la conversación, apenas se refiere a las intervenciones de los demás, vacila a menudo y tiene grandes dificultades para manejar situaciones comunicativas algo más complejas.",
  "No se produce interacción con los interlocutores."
 ]
};
const NP_CONTENT = {
 "de": [
  "{S} erfüllt die Aufgabenstellung vollumfänglich, setzt die Inhalte durchgehend sachgerecht, differenziert und ideenreich um und argumentiert klar strukturiert und sehr überzeugend.",
  "{S} erfüllt die Aufgabenstellung nahezu vollständig, setzt die Inhalte meist sachgerecht und differenziert um und stellt sie meist kohärent, strukturiert und überzeugend dar.",
  "{S} erfüllt die Aufgabenstellung im Großen und Ganzen; die Umsetzung ist in weiten Teilen sachgerecht, die Darstellung weitgehend kohärent und im Großen und Ganzen überzeugend, mit allenfalls leichten Abweichungen vom Thema.",
  "{S} erfüllt die Aufgabenstellung insgesamt noch, weicht aber mehrfach vom Thema ab; die Darstellung ist nur ansatzweise kohärent und überzeugt nur teilweise.",
  "{S} erfüllt die Aufgabenstellung nur ansatzweise, weicht häufig vom Thema ab und stellt die Inhalte kaum noch kohärent und nur ansatzweise nachvollziehbar dar.",
  "{S} verfehlt die Aufgabenstellung; die Darstellung ist nicht nachvollziehbar."
 ],
 "en": [
  "{S} fulfils the task completely, deals with the content in a consistently relevant, differentiated and imaginative way and argues in a clearly structured and very convincing manner.",
  "{S} fulfils the task almost completely, deals with the content in a mostly relevant and differentiated way and presents it in a mostly coherent, structured and convincing manner.",
  "{S} fulfils the task on the whole; the content is largely relevant, and the presentation is largely coherent and convincing on the whole, with at most slight deviations from the topic.",
  "{S} still fulfils the task overall but drifts off topic several times; the presentation is only partly coherent and only partly convincing.",
  "{S} fulfils the task only in part, often drifts off topic and presents the content in a barely coherent and only partly comprehensible way.",
  "{S} does not fulfil the task; the presentation cannot be followed."
 ],
 "it": [
  "{S} svolge il compito in modo completo, sviluppa i contenuti in modo sempre pertinente, differenziato e ricco di idee e argomenta in modo chiaramente strutturato e molto convincente.",
  "{S} svolge il compito in modo quasi completo, sviluppa i contenuti in modo per lo più pertinente e differenziato e li presenta in modo per lo più coerente, strutturato e convincente.",
  "{S} svolge il compito nel complesso; lo sviluppo è in gran parte pertinente e la presentazione abbastanza coerente e nel complesso convincente, con al massimo lievi deviazioni dal tema.",
  "{S} svolge il compito ancora in modo sufficiente, ma si allontana più volte dal tema; la presentazione è coerente solo in parte e convince solo in parte.",
  "{S} svolge il compito solo in parte, si allontana spesso dal tema e presenta i contenuti in modo poco coerente e solo in parte comprensibile.",
  "{S} non svolge il compito richiesto; la presentazione non è comprensibile."
 ],
 "fr": [
  "{S} remplit entièrement la tâche, traite le contenu de manière toujours pertinente, nuancée et riche en idées et argumente de façon clairement structurée et très convaincante.",
  "{S} remplit la tâche presque entièrement, traite le contenu de manière le plus souvent pertinente et nuancée et le présente de façon le plus souvent cohérente, structurée et convaincante.",
  "{S} remplit la tâche dans l’ensemble ; le traitement est en grande partie pertinent et la présentation assez cohérente et globalement convaincante, avec tout au plus de légers écarts par rapport au sujet.",
  "{S} remplit encore la tâche dans l’ensemble, mais s’éloigne plusieurs fois du sujet ; la présentation n’est que partiellement cohérente et convaincante.",
  "{S} ne remplit la tâche qu’en partie, s’éloigne souvent du sujet et présente le contenu de façon peu cohérente et seulement en partie compréhensible.",
  "{S} ne remplit pas la tâche demandée ; la présentation n’est pas compréhensible."
 ],
 "es": [
  "{S} cumple la tarea por completo, desarrolla los contenidos de forma siempre pertinente, matizada y rica en ideas y argumenta de manera claramente estructurada y muy convincente.",
  "{S} cumple la tarea casi por completo, desarrolla los contenidos de forma en su mayoría pertinente y matizada y los presenta de manera en su mayoría coherente, estructurada y convincente.",
  "{S} cumple la tarea en líneas generales; el desarrollo es en gran parte pertinente y la exposición bastante coherente y convincente en conjunto, con, a lo sumo, ligeras desviaciones del tema.",
  "{S} todavía cumple la tarea en conjunto, pero se aparta varias veces del tema; la exposición es coherente y convincente solo en parte.",
  "{S} cumple la tarea solo en parte, se aparta con frecuencia del tema y presenta los contenidos de forma poco coherente y solo en parte comprensible.",
  "{S} no cumple la tarea planteada; la exposición no resulta comprensible."
 ]
};
for (const l of Object.keys(LEVEL)) { for (const d of ['A1', 'A2']) Object.assign(LEVEL[l][d].inter, A_INTER[l]); LEVEL[l].NP.inter = NP_INTER[l]; LEVEL[l].NP.content = NP_CONTENT[l]; }
for (const l of Object.keys(FLU)) { BANK[l].flu = FLU[l]; BANK[l].tip.flu = FLU_TIP[l]; }
/* Bausteine für Sprache, Raster (desc) und Bereich – Grundfassung mit den stufengenauen Ersetzungen */
function bankFor(lang, desc, cat) {
  const base = BANK[lang][cat === 'npLang' ? 'lang' : cat];
  const o = ((LEVEL[lang] || {})[desc] || {})[cat];
  if (!o) return base;
  return Array.isArray(o) ? o : base.map((t, i) => (o[i] != null ? o[i] : t));
}
function fillSubject(tpl, subj, name, lang) {
  /* Französisch: Elision vor Vokal oder stummem h („la prestation d’Alex“) */
  if (lang === 'fr' && /^[aeiouhàâäæéèêëîïôöœùûü]/i.test(name || '')) tpl = tpl.replace('de {N}', 'd’{N}');
  let s = tpl.replace('{N}', name);
  const pron = subj;                         // '' (it), Pronomen oder Name
  s = s.replace('{S}', pron ? cap(pron) : '').replace(/\{s\}/g, pron);
  s = s.replace(/\s{2,}/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
  if (lang === 'fr') s = s.replace(/\s*([;!?:])/g, ' $1');
  return cap(s);
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* student: {first, last, g}; scores: {cat: number}; lang: de|en|it|fr|es
   customKey: derselbe Notenschlüssel wie bei der Notenberechnung (eigene Prozentgrenze) – Note und Worturteil dürfen nie auseinanderfallen */
function worturteil(scheme, student, scores, lang, notes, customKey, opts) {
  const ev = evaluate(scheme, scores, customKey);
  if (!ev.complete) return '';
  const B = BANK[lang]; const name = student.first;
  const known = student.g === 'w' || student.g === 'm';
  const later = known ? PRON[lang][student.g] : name;
  const cats = catsOf(scheme);
  const order = SCHEMES[scheme].mono ? ['content', 'flu', 'lang'] : cats.includes('pron') ? ['content', 'inter', 'lang', 'pron'] : ['content', 'inter', 'npLang'];
  const parts = [fillSubject((SCHEMES[scheme].mono || (opts && opts.ref) ? OPEN_REF : OPEN)[lang](ev.grade), '', name, lang)];
  order.forEach((c, i) => {
    const bank = bankFor(lang, SCHEMES[scheme].desc, c);
    const b = step(scheme, c, scores[c]);
    // Name steht im ersten Satz; danach Pronomen (Italienisch: ohne Subjekt)
    const subj = later;
    parts.push(fillSubject(bank[b - 1], subj, name, lang));
    const n = notes && String(notes[c] || '').trim();
    if (n) parts.push(cap(n.replace(/\s+/g, ' ')) + (/[.!?…]$/.test(n) ? '' : '.'));
  });
  // Empfehlung: schwächste Kategorie (Band ≥ 3)
  let worst = null, wb = 0;
  for (const c of order) { const b = band(scheme, c, scores[c]); if (b > wb) { wb = b; worst = c; } }
  if (ev.grade === 1 && wb <= 2) parts.push(B.top);
  else if (wb >= 3) parts.push(B.tip[worst === 'npLang' ? 'lang' : worst]);
  return parts.join(' ');
}

/* Übliche Prüfungsbezeichnungen in der Sprache des Bogens */
const TITLES = [
  { re: /^m(ü|ue)ndliche\s+schulaufgabe$|^schulaufgabe\s*\(m(ü|ue)ndlich\)$/i, de: 'Mündliche Schulaufgabe', en: 'Oral Exam', it: 'Prova orale', fr: 'Épreuve orale', es: 'Prueba oral' },
  { re: /^m(ü|ue)ndliche\s+pr(ü|ue)fung$/i, de: 'Mündliche Prüfung', en: 'Oral Examination', it: 'Esame orale', fr: 'Examen oral', es: 'Examen oral' },
  { re: /^m(ü|ue)ndliche\s+ersatzpr(ü|ue)fung$|^ersatzpr(ü|ue)fung(\s*\(m(ü|ue)ndlich\))?$/i, de: 'Mündliche Ersatzprüfung', en: 'Oral Make-up Exam', it: 'Prova orale di recupero', fr: 'Épreuve orale de rattrapage', es: 'Examen oral de recuperación' },
  { re: /^m(ü|ue)ndlicher\s+leistungsnachweis$|^m(ü|ue)ndliche\s+leistungserhebung$/i, de: 'Mündlicher Leistungsnachweis', en: 'Oral Assessment', it: 'Verifica orale', fr: 'Évaluation orale', es: 'Evaluación oral' },
];
function titleIn(title, lang) {
  const raw = String(title || '').trim(); if (!raw || !lang || lang === 'de') return raw;
  const ord = raw.match(/^(\d)\s*\.\s*(?:m(?:ü|ue)ndliche\s+)?schulaufgabe(?:\s*\(m(?:ü|ue)ndlich\))?$/i);
  if (ord && /m(ü|ue)ndlich/i.test(raw)) {
    const n = +ord[1];
    if (lang === 'en') return `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} Oral Exam`;
    if (lang === 'it') return `${n}ª prova orale`;
    if (lang === 'fr') return `${n}${n === 1 ? 're' : 'e'} épreuve orale`;
    if (lang === 'es') return `${n}.ª prueba oral`;
  }
  for (const x of TITLES) if (x.re.test(raw) || [x.de, x.en, x.it, x.fr, x.es].some(v => v.toLowerCase() === raw.toLowerCase())) return x[lang] || raw;
  return raw;
}

/* Quelle der Raster, Deskriptoren und Notenschlüssel – Nutzung vom ISB erlaubt (Okt. 2026) mit Quellenangabe und Link zur Fundstelle */
const ISB = { name: 'Staatsinstitut für Schulqualität und Bildungsforschung München (ISB)',
  url: 'https://www.isb.bayern.de/schularten/gymnasium/faecher/moderne-fremdsprachen/leistungserhebungen-und-bewertungsraster/' };
const API = { ISB, CATS, SCHEMES, SCHEME_ORDER, MONO_ORDER, MAXBE, GRADE_WORD, BANK, LEVEL, bankFor, catsOf, maxOf, totalMax, evaluate, npToGrade, keyRanges, keyFromPercent, descriptor, band, step, worturteil, roundHalfUp, titleIn };
if (typeof module !== 'undefined') module.exports = API; else Object.assign(root, API);
})(typeof window !== 'undefined' ? window : globalThis);
