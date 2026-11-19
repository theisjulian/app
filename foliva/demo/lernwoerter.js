/* Foliva – Lernwortschatz für die Grundschule (eigene Zusammenstellung) · © 2026 theis
   Geordnet nach Rechtschreibbereichen wie im Deutschunterricht üblich (lautgetreu, Mitlautverdopplung, ie, ck/tz, h,
   ableiten, ß, Sp/St, V, Merkwörter, häufige Wörter), getrennt für die Jahrgangsstufen 1/2 und 3/4.
   Das ist NICHT die amtliche Liste des ISB. Eine eigene Schulliste (z. B. den Grundwortschatz aus dem LehrplanPLUS)
   kann jede Lehrkraft in Foliva einfügen; sie wird dann überall statt bzw. neben dieser Liste verwendet.
   Nomen stehen mit Artikel. */
(function (root) {
  'use strict';
  const BEREICHE = {
    haeufig: 'Häufige Wörter',
    lautgetreu: 'Lautgetreue Wörter (mitsprechen)',
    doppel: 'Doppelte Mitlaute (Mitlautverdopplung)',
    ie: 'Wörter mit ie',
    ck_tz: 'Wörter mit ck und tz',
    h: 'Wörter mit h (Dehnungs-h und silbentrennendes h)',
    ableiten: 'Ableiten (b/p, d/t, g/k, ä/e, äu/eu)',
    ss: 'Wörter mit ß',
    sp_st: 'Wörter mit Sp/sp und St/st',
    v: 'Wörter mit V/v',
    merk: 'Merkwörter (besondere Schreibungen)',
  };
  const L = {
    '12': {
      haeufig: 'der die das ein eine und oder aber ich du er sie es wir ihr mein dein ist sind hat haben war kann will mag nicht nein ja auch noch schon dann jetzt hier dort da was wer wie wo wann mit auf in im an am zu von bei für aus nach vor heute gern sehr viel alle',
      lautgetreu: 'die Oma der Opa die Mama der Papa die Hose die Nase die Rose die Dose der Hase die Lupe die Tomate die Banane der Esel die Ameise das Sofa die Gabel die Nudel der Igel das Kino das Auto die Maus das Haus der Bus der Ast die Ente der Wal malen rufen raten turnen baden lesen gut rot grün blau lila klug alt rund',
      doppel: 'die Mutter die Sonne die Puppe die Tanne die Kanne der Ball das Wasser der Löffel die Pfanne die Klasse die Tasse die Suppe der Schlüssel die Wolle kommen rennen schwimmen bellen fallen sollen hoffen essen alle dann denn wann wenn immer dünn',
      ie: 'die Biene die Wiese das Tier das Lied der Brief das Spiel die Ziege das Knie die Fliege spielen fliegen liegen schieben siegen lieb tief vier sieben viel wieder die sie wie hier nie',
      ck_tz: 'die Jacke die Decke der Zucker die Schnecke der Rücken die Brücke das Stück die Katze die Mütze die Pfütze der Platz der Witz backen lecken drücken pflücken sitzen putzen schützen dick jetzt',
      h: 'die Uhr die Kuh der Schuh der Zahn das Huhn das Ohr die Bahn der Stuhl die Zahl gehen sehen stehen fahren wohnen zählen fehlen ihr ihn ihm mehr sehr froh früh',
      ableiten: 'der Hund das Kind der Wald das Bild der Berg der Zug der Tag das Rad das Kleid der Korb gelb lieb rund der Baum die Bäume das Haus die Häuser die Hand die Hände der Apfel die Äpfel',
      ss: 'der Fuß der Spaß der Kloß die Straße groß heiß weiß süß fleißig draußen',
      sp_st: 'der Stern der Stift der Stuhl der Stein die Stadt der Stock der Sport der Spiegel spielen springen sprechen stehen stellen still stark spitz',
      v: 'der Vogel der Vater vier viel voll von vor vorbei',
      merk: 'der Clown das Baby der Computer die Pizza das Handy der Teddy die Party',
    },
    '34': {
      haeufig: 'als also bis damit dass dein deinem deinen dich dir durch etwas euch gegen ihm ihn ihnen ihre jeder jede jedes kein keine man manchmal mich mir nichts nun ohne seit sich solch sondern über um unter vielleicht während warum weil welche wieder ziemlich zwischen',
      lautgetreu: 'die Banane die Tomate die Limonade der Salat der Kalender das Gemüse die Rakete der Pirat der Planet die Gitarre die Familie die Natur das Paket die Tulpe die Melone der Elefant die Erde der Garten der Kater rasen reden bauen kaufen tauschen antworten erzählen bunt fern gesund',
      doppel: 'die Brille der Sommer das Zimmer die Flamme die Rolle der Teller der Keller das Messer der Pass die Mannschaft der Schlitten das Kissen die Gruppe die Treppe das Wetter die Nummer der Himmel kennen können müssen wissen vergessen treffen schaffen sammeln klettern füllen hell nass satt fett glatt doppelt',
      ie: 'die Familie der Riese die Miete das Papier die Batterie die Energie das Gebiet das Ziel die Wiese der Dieb verlieren frieren schießen gießen probieren telefonieren niemand ziemlich wieder schief',
      ck_tz: 'der Bäcker die Ecke der Fleck das Glück der Rucksack der Zucker die Hitze die Spitze die Pfütze der Blitz das Netz der Schatz die Glocke zwicken schmecken erschrecken verstecken blitzen kratzen schwitzen setzen trotzdem glücklich schmutzig plötzlich',
      h: 'die Fahne der Lehrer die Lehrerin der Föhn das Jahr die Bühne die Sahne der Draht die Gefahr die Wahrheit die Ruhe das Reh die Mühe kühl drehen blühen glühen nähen mähen sprühen wählen erzählen ehrlich ähnlich ungefähr fröhlich zehn',
      ableiten: 'der Dieb das Grab der Stab das Lob das Feld das Geld der Abend der Mond das Pferd der Freund die Burg der Weg der Zwerg das Gebirge kräftig ärgerlich gefährlich die Kälte die Wärme die Länge die Räuber die Bäuerin er läuft er fährt er trägt er fällt',
      ss: 'der Gruß das Maß der Strauß die Soße die Größe der Spaß außen grüßen beißen fließen genießen gießen schließen heißen stoßen bloß außerdem',
      sp_st: 'der Spaziergang die Spur das Spielzeug der Sprung die Stimme der Stiefel der Stempel der Stoff die Strecke die Stunde der Streit spannend spät sparen spazieren springen stolpern streiten stricken steigen sterben stumm',
      v: 'der Vers der Verkehr das Volk das Klavier die Vase der Pullover der Vulkan voll vielleicht vorsichtig vergessen verlieren verstecken vorher davon',
      merk: 'die Stadt der Rhythmus das Theater der Chor der Charakter das Handy die Jeans der Computer das Sweatshirt der Clown das Restaurant die Toilette der Ingenieur das Pony der Fotograf die Physik das Mädchen ein bisschen',
    },
  };
  /* Einträge: { w: 'der Hund', wort: 'Hund', art: 'der', b: 'ableiten', stufe: '12' } */
  const ART = new Set(['der', 'die', 'das']);
  function parse(s) { const t = s.split(/\s+/).filter(Boolean); const out = []; for (let i = 0; i < t.length; i++) { if (ART.has(t[i]) && t[i + 1] && /^[A-ZÄÖÜ]/.test(t[i + 1])) { out.push({ art: t[i], wort: t[i + 1] }); i++; } else if ((t[i] === 'er' || t[i] === 'ein') && t[i + 1] && /^[a-zäöüß]/.test(t[i + 1]) && !['er', 'ein'].includes(t[i + 1]) && ['läuft', 'fährt', 'trägt', 'fällt', 'bisschen'].includes(t[i + 1])) { out.push({ art: '', wort: t[i] + ' ' + t[i + 1] }); i++; } else out.push({ art: '', wort: t[i] }); } return out; }
  const LIST = [];
  Object.entries(L).forEach(([stufe, B]) => Object.entries(B).forEach(([b, s]) => parse(s).forEach(x => LIST.push({ ...x, w: (x.art ? x.art + ' ' : '') + x.wort, b, stufe }))));
  /* eigene Schulliste (vom Nutzer eingefügt) – ein Wort je Zeile oder durch Komma getrennt; Artikel erlaubt */
  let OWN = { '12': [], '34': [] };
  function setOwn(o) { OWN = { '12': parseOwn(o && o['12']), '34': parseOwn(o && o['34']) }; }
  function parseOwn(s) { return String(s || '').split(/[\n,;]+/).map(x => x.trim().replace(/\s+/g, ' ')).filter(x => x && x.length < 40).map(x => { const m = /^(der|die|das)\s+(.+)$/.exec(x); return m ? { art: m[1], wort: m[2], w: x, b: 'eigen' } : { art: '', wort: x, w: x, b: 'eigen' }; }); }
  const hasOwn = () => OWN['12'].length + OWN['34'].length > 0;
  /* Wörter für eine Klassenstufe und einen Bereich; Quelle: 'foliva', 'eigen' oder 'beide' */
  function words(stufe, b, src = 'beide') {
    const st = stufe === '12' || stufe === '34' ? [stufe] : ['12', '34'];
    let out = [];
    if (src !== 'eigen') out = out.concat(LIST.filter(x => st.includes(x.stufe) && (!b || b === 'alle' || x.b === b)));
    if (src !== 'foliva') out = out.concat(st.flatMap(s => OWN[s].map(x => ({ ...x, stufe: s }))));
    const seen = new Set(); return out.filter(x => { const k = x.w; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  /* alle Wortformen für die Suche „enthaltene Lernwörter“ */
  const allWords = () => [...new Set(LIST.concat(OWN['12'], OWN['34']).map(x => x.wort.toLowerCase()))];
  const API = { BEREICHE, LIST, words, setOwn, hasOwn, allWords, own: () => OWN };
  root.FolivaLernwoerter = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
