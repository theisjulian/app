/* Bewertungslogik: Schemata nach ISB-Rechentabellen, Notenberechnung, Worturteil-Bausteine.
   Läuft im Browser und in Node (für Tests). */
(function (root) {

const CATS = {
  pron:    { label: 'Aussprache / Intonation', short: 'Aussprache' },
  lang:    { label: 'Sprachliche Mittel / Sprachrichtigkeit', short: 'Sprache' },
  inter:   { label: 'Gesprächsfähigkeit / Strategie', short: 'Gespräch' },
  content: { label: 'Aufgabenerfüllung / Inhalt', short: 'Inhalt' },
  npLang:  { label: 'Sprachliche Leistung', short: 'Sprache' },
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
const MAXBE = { pron: 6, lang: 6, inter: 6, content: 4 };

function catsOf(scheme) {
  const s = SCHEMES[scheme];
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
   Notenpunkte: Notenstufe 1–6 → Baustein (Inhalt direkt, sonst 1,2,3,4,6,7). */
function step(scheme, cat, score) {
  const s = SCHEMES[scheme];
  if (s.type === 'np') { const g = npToGrade(roundHalfUp(score)); return cat === 'content' ? g : [1, 2, 3, 4, 6, 7][g - 1]; }
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
const BANK = {
  de: {
    pron: [
      '{S} spricht sehr gut verständlich; Aussprache und Intonation sind durchweg korrekt.',
      '{S} ist gut verständlich; Aussprache und Intonation sind meist korrekt, kleinere Fehler stören die Kommunikation nicht.',
      '{S} ist in der Regel gut verständlich, auch wenn einzelne Aussprache- und Intonationsfehler auftreten.',
      '{S} ist mit gewissen Einschränkungen verständlich; in Aussprache und Intonation zeigen sich erkennbare Schwächen.',
      '{S} macht viele Aussprachefehler, sodass die Verständlichkeit deutlich eingeschränkt ist.',
      'Aufgrund sehr vieler Aussprachefehler und massiver Schwächen in der Intonation ist {s} kaum mehr verständlich.',
      'Aufgrund grob fehlerhafter Aussprache ist {s} nicht mehr verständlich.'],
    lang: [
      '{S} verwendet ein breites Spektrum sprachlicher Mittel sicher und nahezu fehlerfrei.',
      '{S} drückt sich meist sicher und treffend aus; die wenigen Fehler beeinträchtigen die Verständlichkeit nicht.',
      '{S} verfügt über einen angemessenen Wortschatz; einige Verstöße gegen die Sprachrichtigkeit beeinträchtigen die Verständlichkeit kaum.',
      '{S} verwendet überwiegend einfache sprachliche Mittel; mehrere, teils gravierende Fehler treten auf, die Verständlichkeit bleibt aber insgesamt gewährleistet.',
      '{S} verfügt nur über ein begrenztes Repertoire sprachlicher Mittel; zahlreiche Fehler beeinträchtigen die Verständlichkeit stellenweise.',
      '{S} verwendet nur sehr einfache sprachliche Mittel; sehr viele, häufig gravierende Fehler beeinträchtigen die Verständlichkeit deutlich.',
      '{S} macht so viele elementare Fehler, dass die Verständlichkeit nicht mehr gegeben ist.'],
    inter: [
      'Im Gespräch reagiert {s} flexibel und spontan, geht geschickt auf die Gesprächspartner ein und äußert sich flüssig.',
      'Im Gespräch beteiligt {s} sich aktiv, geht meist gut auf die Beiträge der anderen ein und spricht weitgehend flüssig.',
      '{S} beteiligt sich angemessen am Gespräch und geht auf die Gesprächspartner ein, zögert aber gelegentlich.',
      '{S} beteiligt sich eher zurückhaltend am Gespräch; wiederholtes Zögern erschwert es, das Gespräch fortzuführen.',
      '{S} beteiligt sich wenig am Gespräch, geht wenig auf andere Beiträge ein, zögert häufig und hat wiederholt Schwierigkeiten, das Gespräch fortzuführen.',
      '{S} beteiligt sich kaum am Gespräch und hat große Schwierigkeiten, auf andere Beiträge einzugehen.',
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
      '{S} makes many pronunciation errors, which clearly limits how well {s} can be understood.',
      'Because of very many pronunciation errors and major weaknesses in intonation, {s} can hardly be understood.',
      'Because of seriously flawed pronunciation, {s} can no longer be understood.'],
    lang: [
      '{S} uses a wide range of language confidently and almost without errors.',
      '{S} expresses ideas confidently and accurately for the most part; the few errors do not affect comprehension.',
      '{S} has an adequate range of vocabulary; some errors in accuracy hardly affect comprehension.',
      '{S} mostly relies on simple language; several errors, some of them serious, occur, but the message still comes across.',
      '{S} has only a limited range of language; frequent errors affect comprehension in places.',
      '{S} only uses very simple language; very many, often serious errors clearly affect comprehension.',
      '{S} makes so many basic errors that the message no longer comes across.'],
    inter: [
      'In conversation, {s} responds flexibly and spontaneously, engages skilfully with the other speakers and speaks fluently.',
      'In conversation, {s} takes an active part, mostly responds well to the others and speaks fairly fluently.',
      '{S} takes an appropriate part in the conversation and responds to the other speakers, but hesitates at times.',
      '{S} is rather reserved in the conversation; repeated hesitation makes it difficult to keep the conversation going.',
      '{S} takes little part in the conversation, responds little to the others, hesitates often and repeatedly finds it difficult to keep the conversation going.',
      '{S} hardly takes part in the conversation and finds it very difficult to respond to others.',
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
      '{S} commette molti errori di pronuncia, per cui la comprensibilità risulta chiaramente limitata.',
      'A causa di moltissimi errori di pronuncia e di gravi debolezze nell’intonazione, {s} si fa capire a malapena.',
      'A causa di una pronuncia gravemente scorretta, {s} non si fa più capire.'],
    lang: [
      '{S} usa con sicurezza un’ampia gamma di strutture e lessico, quasi senza errori.',
      '{S} si esprime per lo più con sicurezza e precisione; i pochi errori non compromettono la comprensione.',
      '{S} dispone di un lessico adeguato; alcuni errori di correttezza linguistica compromettono appena la comprensione.',
      '{S} usa prevalentemente mezzi linguistici semplici; compaiono diversi errori, anche gravi, ma il messaggio resta nel complesso comprensibile.',
      '{S} dispone solo di un repertorio linguistico limitato; numerosi errori compromettono in parte la comprensione.',
      '{S} usa solo mezzi linguistici molto semplici; moltissimi errori, spesso gravi, compromettono chiaramente la comprensione.',
      '{S} commette così tanti errori elementari che il messaggio non risulta più comprensibile.'],
    inter: [
      'Nel dialogo {s} reagisce in modo flessibile e spontaneo, interagisce abilmente con gli interlocutori e si esprime con scioltezza.',
      'Nel dialogo {s} partecipa attivamente, reagisce per lo più bene agli interventi degli altri e parla con discreta scioltezza.',
      '{S} partecipa in modo adeguato alla conversazione e interagisce con gli interlocutori, pur esitando talvolta.',
      '{S} partecipa in modo piuttosto riservato alla conversazione; le ripetute esitazioni rendono difficile portare avanti il dialogo.',
      '{S} partecipa poco alla conversazione, fa poco riferimento agli interventi degli altri, esita spesso e ha ripetutamente difficoltà a portare avanti il dialogo.',
      '{S} partecipa appena alla conversazione e ha grandi difficoltà a reagire agli interventi degli altri.',
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
      '{S} fait beaucoup d’erreurs de prononciation, ce qui limite nettement la compréhension.',
      'En raison de très nombreuses erreurs de prononciation et de faiblesses importantes dans l’intonation, {s} se fait à peine comprendre.',
      'En raison d’une prononciation gravement fautive, {s} ne se fait plus comprendre.'],
    lang: [
      '{S} utilise avec aisance une large palette de moyens linguistiques, presque sans erreur.',
      '{S} s’exprime le plus souvent avec aisance et précision ; les quelques erreurs ne gênent pas la compréhension.',
      '{S} dispose d’un vocabulaire adapté ; quelques erreurs de correction linguistique gênent à peine la compréhension.',
      '{S} utilise surtout des moyens linguistiques simples ; plusieurs erreurs, parfois graves, apparaissent, mais le message reste compréhensible dans l’ensemble.',
      '{S} ne dispose que d’un répertoire linguistique limité ; de nombreuses erreurs gênent par endroits la compréhension.',
      '{S} n’utilise que des moyens linguistiques très simples ; de très nombreuses erreurs, souvent graves, gênent nettement la compréhension.',
      '{S} fait tant d’erreurs élémentaires que le message n’est plus compréhensible.'],
    inter: [
      'Dans l’échange, {s} réagit de manière souple et spontanée, interagit habilement avec ses interlocuteurs et s’exprime avec aisance.',
      'Dans l’échange, {s} participe activement, réagit le plus souvent bien aux interventions des autres et parle de façon assez fluide.',
      '{S} participe de manière appropriée à la conversation et réagit aux interlocuteurs, mais hésite parfois.',
      '{S} participe de façon plutôt réservée à la conversation ; des hésitations répétées rendent difficile la poursuite de l’échange.',
      '{S} participe peu à la conversation, réagit peu aux interventions des autres, hésite souvent et a régulièrement du mal à poursuivre l’échange.',
      '{S} ne participe presque pas à la conversation et a beaucoup de mal à réagir aux interventions des autres.',
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
      '{S} comete muchos errores de pronunciación, por lo que la comprensibilidad queda claramente limitada.',
      'A causa de muchísimos errores de pronunciación y de claras debilidades en la entonación, apenas se le entiende.',
      'A causa de una pronunciación muy defectuosa, ya no se le entiende.'],
    lang: [
      '{S} utiliza con seguridad una amplia gama de recursos lingüísticos y casi sin errores.',
      '{S} se expresa en su mayoría con seguridad y precisión; los pocos errores no afectan a la comprensión.',
      '{S} dispone de un vocabulario adecuado; algunos errores de corrección lingüística apenas afectan a la comprensión.',
      '{S} utiliza sobre todo recursos lingüísticos sencillos; aparecen varios errores, algunos de ellos graves, pero el mensaje sigue siendo comprensible en conjunto.',
      '{S} dispone solo de un repertorio lingüístico limitado; numerosos errores afectan en parte a la comprensión.',
      '{S} solo utiliza recursos lingüísticos muy sencillos; muchísimos errores, a menudo graves, afectan claramente a la comprensión.',
      '{S} comete tantos errores elementales que el mensaje ya no resulta comprensible.'],
    inter: [
      'En el diálogo {s} reacciona con flexibilidad y espontaneidad, interactúa con habilidad con los interlocutores y se expresa con fluidez.',
      'En el diálogo {s} participa activamente, reacciona en su mayoría bien a las intervenciones de los demás y habla con bastante fluidez.',
      '{S} participa de forma adecuada en la conversación y responde a los interlocutores, aunque vacila de vez en cuando.',
      '{S} participa de forma bastante reservada en la conversación; las vacilaciones repetidas dificultan continuar el diálogo.',
      '{S} participa poco en la conversación, apenas se refiere a las intervenciones de los demás, vacila a menudo y tiene repetidas dificultades para continuar el diálogo.',
      '{S} participa apenas en la conversación y tiene grandes dificultades para responder a las intervenciones de los demás.',
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

function fillSubject(tpl, subj, name, lang) {
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
function worturteil(scheme, student, scores, lang, notes, customKey) {
  const ev = evaluate(scheme, scores, customKey);
  if (!ev.complete) return '';
  const B = BANK[lang]; const name = student.first;
  const known = student.g === 'w' || student.g === 'm';
  const later = known ? PRON[lang][student.g] : name;
  const cats = catsOf(scheme);
  const order = cats.includes('pron') ? ['content', 'inter', 'lang', 'pron'] : ['content', 'inter', 'npLang'];
  const parts = [fillSubject(OPEN[lang](ev.grade), '', name, lang)];
  order.forEach((c, i) => {
    const bank = B[c === 'npLang' ? 'lang' : c];
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
const API = { ISB, CATS, SCHEMES, SCHEME_ORDER, MAXBE, GRADE_WORD, BANK, catsOf, maxOf, totalMax, evaluate, npToGrade, keyRanges, keyFromPercent, descriptor, band, step, worturteil, roundHalfUp, titleIn };
if (typeof module !== 'undefined') module.exports = API; else Object.assign(root, API);
})(typeof window !== 'undefined' ? window : globalThis);
