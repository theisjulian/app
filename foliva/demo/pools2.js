/* Foliva – erweiterte Inhaltssammlungen (ab 0.3) · © 2026 theis
   Selbst geschrieben, keine fremden Texte; Namen erfunden. Erweitert FolivaPools (pools.js), ohne Vorhandenes zu verändern.
   Silben (mit „-“ getrennt) = Sprechsilben für die Grundschule. Fremdsprachen: Grundwortschatz – vor Veröffentlichung gegenlesen lassen. */
(function (root) {
  'use strict';
  const P = root.FolivaPools || (typeof require !== 'undefined' ? require('./pools.js') : {});
  const lines = s => s.trim().split('\n').map(l => l.trim()).filter(Boolean);
  /* Nomen: Sil-ben-wort|Artikel|Mehrzahl */
  const N = s => lines(s).map(l => { const [w, a, p] = l.split('|'); return { w: w.replace(/-/g, ''), a, p, s: w.includes('-') ? w : w }; });
  const addNouns = (key, name, s) => {
    const list = N(s);
    if (!P.NOUNS[key]) P.NOUNS[key] = { name, list: [] };
    const have = new Map(P.NOUNS[key].list.map(x => [x.w, x]));
    list.forEach(x => { if (have.has(x.w)) { const o = have.get(x.w); if (!o.s) o.s = x.s; } else P.NOUNS[key].list.push(x); });
  };
  /* Silben für die Wörter aus 0.2 */
  const SYL0 = `Hund Kat-ze Maus Pferd Kuh Schaf I-gel Fuchs Ha-se Vo-gel Fisch En-te Schwein Zie-ge Bär Eu-le Bie-ne Kä-fer Frosch Lö-we
    Ap-fel Bir-ne Ba-na-ne Kir-sche Pflau-me Erd-bee-re To-ma-te Gur-ke Ka-rot-te Kar-tof-fel Zwie-bel Brot Ei Nu-del Ku-chen Keks Saft Sup-pe
    Heft Buch Stift Li-ne-al Sche-re Ta-fel Tisch Stuhl Ran-zen Kle-ber Pin-sel Ra-dier-gum-mi Spit-zer Klas-se Pau-se Leh-re-rin Map-pe
    Kopf Arm Bein Hand Fuß Au-ge Ohr Na-se Mund Zahn Fin-ger Knie Bauch Haar
    Ho-se Ja-cke Müt-ze Schal Schuh So-cke Kleid Rock Hemd Pul-li Hand-schuh Stie-fel Gür-tel
    Au-to Bus Zug Fahr-rad Rol-ler Schiff Boot Flug-zeug Trak-tor Am-pel Stra-ße Brü-cke Helm
    Baum Blu-me Blatt Wie-se Wald Berg See Fluss Wol-ke Son-ne Stern Mond Schnee-mann Pilz Stein
    Tür Fens-ter Bett Lam-pe Schrank So-fa Kü-che Trep-pe Tel-ler Tas-se Löf-fel Ga-bel Kis-sen Uhr`.split(/\s+/);
  const SYLMAP = new Map(SYL0.map(x => [x.replace(/-/g, ''), x]));
  Object.values(P.NOUNS).forEach(t => t.list.forEach(x => { if (!x.s && SYLMAP.has(x.w)) x.s = SYLMAP.get(x.w); }));

  addNouns('tiere', 'Tiere', `Hund|der|Hunde
    Pin-gu-in|der|Pinguine
    E-le-fant|der|Elefanten
    Gi-raf-fe|die|Giraffen
    Ze-bra|das|Zebras
    Af-fe|der|Affen
    Ti-ger|der|Tiger
    Schlan-ge|die|Schlangen
    Kro-ko-dil|das|Krokodile
    Schild-krö-te|die|Schildkröten
    Pa-pa-gei|der|Papageien
    Wal|der|Wale
    Del-fin|der|Delfine
    Hai|der|Haie
    Kra-ke|der|Kraken
    Schne-cke|die|Schnecken
    Spin-ne|die|Spinnen
    A-mei-se|die|Ameisen
    Schmet-ter-ling|der|Schmetterlinge
    Kän-gu-ru|das|Kängurus
    Ka-mel|das|Kamele
    Wolf|der|Wölfe
    Kat-ze|die|Katzen
    Hams-ter|der|Hamster
    Ka-nin-chen|das|Kaninchen`);
  addNouns('feuerwehr', 'Feuerwehr', `Feu-er-wehr|die|Feuerwehren
    Feu-er-wehr-au-to|das|Feuerwehrautos
    Feu-er|das|Feuer
    Brand|der|Brände
    Lei-ter|die|Leitern
    Schlauch|der|Schläuche
    Helm|der|Helme
    Si-re-ne|die|Sirenen
    Was-ser|das|-
    Feu-er-lö-scher|der|Feuerlöscher
    Rauch|der|-
    Not-ruf|der|Notrufe
    Ret-tung|die|Rettungen
    Mel-der|der|Melder
    Ein-satz|der|Einsätze
    Wa-che|die|Wachen
    Hy-drant|der|Hydranten
    Lösch-zug|der|Löschzüge
    A-tem-schutz|der|-
    U-ni-form|die|Uniformen
    Stie-fel|der|Stiefel
    Hand-schuh|der|Handschuhe
    Blau-licht|das|Blaulichter
    Rauch-mel-der|der|Rauchmelder`);
  addNouns('wald', 'Wald und Bäume', `Baum|der|Bäume
    Ei-che|die|Eichen
    Bu-che|die|Buchen
    Fich-te|die|Fichten
    Tan-ne|die|Tannen
    Kie-fer|die|Kiefern
    Bir-ke|die|Birken
    A-horn|der|Ahorne
    Lin-de|die|Linden
    Kas-ta-nie|die|Kastanien
    Ei-chel|die|Eicheln
    Zap-fen|der|Zapfen
    Na-del|die|Nadeln
    Rin-de|die|Rinden
    Ast|der|Äste
    Zweig|der|Zweige
    Wur-zel|die|Wurzeln
    Stamm|der|Stämme
    Kro-ne|die|Kronen
    Laub|das|-
    Moos|das|Moose
    Farn|der|Farne
    Pilz|der|Pilze
    Reh|das|Rehe
    Hirsch|der|Hirsche
    Wild-schwein|das|Wildschweine
    Specht|der|Spechte
    Eich-hörn-chen|das|Eichhörnchen
    Dachs|der|Dachse
    Förs-ter|der|Förster`);
  addNouns('koerper', 'Körper', `Hals|der|Hälse
    Schul-ter|die|Schultern
    Ell-bo-gen|der|Ellbogen
    Rü-cken|der|Rücken
    Brust|die|Brüste
    Ze-he|die|Zehen
    Fer-se|die|Fersen
    Stirn|die|Stirnen
    Wan-ge|die|Wangen
    Kinn|das|Kinne
    Lip-pe|die|Lippen
    Zun-ge|die|Zungen
    Herz|das|Herzen
    Lun-ge|die|Lungen
    Ma-gen|der|Mägen
    Kno-chen|der|Knochen
    Mus-kel|der|Muskeln
    Haut|die|Häute
    Ge-hirn|das|Gehirne
    Na-gel|der|Nägel
    Wim-per|die|Wimpern
    Au-gen-braue|die|Augenbrauen`);
  addNouns('bauernhof', 'Bauernhof', `Bau-er|der|Bauern
    Bäu-e-rin|die|Bäuerinnen
    Stall|der|Ställe
    Scheu-ne|die|Scheunen
    Trak-tor|der|Traktoren
    Huhn|das|Hühner
    Hahn|der|Hähne
    Kü-ken|das|Küken
    Kalb|das|Kälber
    Fer-kel|das|Ferkel
    Gans|die|Gänse
    E-sel|der|Esel
    Heu|das|-
    Stroh|das|-
    Feld|das|Felder
    Wei-de|die|Weiden
    Zaun|der|Zäune
    Ge-trei-de|das|Getreide
    Wei-zen|der|-
    Mais|der|-
    Milch|die|-
    Ei|das|Eier
    Mist-ga-bel|die|Mistgabeln
    Hund|der|Hunde`);
  addNouns('berufe', 'Berufe', `Ärz-tin|die|Ärztinnen
    Arzt|der|Ärzte
    Bä-cker|der|Bäcker
    Bä-cke-rin|die|Bäckerinnen
    Koch|der|Köche
    Kö-chin|die|Köchinnen
    Leh-rer|der|Lehrer
    Po-li-zist|der|Polizisten
    Po-li-zis-tin|die|Polizistinnen
    Feu-er-wehr-mann|der|Feuerwehrleute
    Feu-er-wehr-frau|die|Feuerwehrfrauen
    Pi-lot|der|Piloten
    Pi-lo-tin|die|Pilotinnen
    Ma-ler|der|Maler
    Gärt-ne-rin|die|Gärtnerinnen
    Gärt-ner|der|Gärtner
    Ver-käu-fe-rin|die|Verkäuferinnen
    Tisch-ler|der|Tischler
    Fri-seu-rin|die|Friseurinnen
    Bus-fah-rer|der|Busfahrer
    Tier-ärz-tin|die|Tierärztinnen
    Post-bo-tin|die|Postbotinnen
    Me-cha-ni-ker|der|Mechaniker
    Pfle-ge-rin|die|Pflegerinnen`);
  addNouns('familie', 'Familie und Menschen', `Mut-ter|die|Mütter
    Va-ter|der|Väter
    Bru-der|der|Brüder
    Schwes-ter|die|Schwestern
    O-ma|die|Omas
    O-pa|der|Opas
    Ba-by|das|Babys
    Kind|das|Kinder
    Tan-te|die|Tanten
    On-kel|der|Onkel
    Cou-si-ne|die|Cousinen
    Cou-sin|der|Cousins
    Freun-din|die|Freundinnen
    Freund|der|Freunde
    Nach-bar|der|Nachbarn
    Nach-ba-rin|die|Nachbarinnen
    Fa-mi-lie|die|Familien
    Mäd-chen|das|Mädchen
    Jun-ge|der|Jungen
    El-tern|die|-`);
  addNouns('wetter', 'Wetter', `Re-gen|der|-
    Schnee|der|-
    Wind|der|Winde
    Sturm|der|Stürme
    Ge-wit-ter|das|Gewitter
    Blitz|der|Blitze
    Don-ner|der|-
    Ne-bel|der|-
    Ha-gel|der|-
    Frost|der|Fröste
    Re-gen-bo-gen|der|Regenbogen
    Wol-ke|die|Wolken
    Son-ne|die|Sonnen
    Schirm|der|Schirme
    Pfüt-ze|die|Pfützen
    Tem-pe-ra-tur|die|Temperaturen
    Ther-mo-me-ter|das|Thermometer
    Schnee-flo-cke|die|Schneeflocken
    Tau|der|-`);
  addNouns('jahr', 'Jahreszeiten und Feste', `Früh-ling|der|-
    Som-mer|der|-
    Herbst|der|-
    Win-ter|der|-
    Os-tern|das|-
    Weih-nach-ten|das|-
    Ge-burts-tag|der|Geburtstage
    Fa-sching|der|-
    Ad-vent|der|-
    Ker-ze|die|Kerzen
    Ge-schenk|das|Geschenke
    Tor-te|die|Torten
    Bal-lon|der|Ballons
    La-ter-ne|die|Laternen
    Dra-chen|der|Drachen
    Kür-bis|der|Kürbisse
    Schlit-ten|der|Schlitten
    Os-ter-ei|das|Ostereier
    Weih-nachts-baum|der|Weihnachtsbäume
    Ka-len-der|der|Kalender`);
  addNouns('sport', 'Sport und Spiel', `Ball|der|Bälle
    Tor|das|Tore
    Fuß-ball|der|Fußbälle
    Schlä-ger|der|Schläger
    Netz|das|Netze
    Seil|das|Seile
    Rei-fen|der|Reifen
    Turn-hal-le|die|Turnhallen
    Schwimm-bad|das|Schwimmbäder
    Ski|der|Skier
    Schlitt-schuh|der|Schlittschuhe
    Pup-pe|die|Puppen
    Ted-dy|der|Teddys
    Wür-fel|der|Würfel
    Spiel|das|Spiele
    Puz-zle|das|Puzzles
    Krei-sel|der|Kreisel
    Rut-sche|die|Rutschen
    Schau-kel|die|Schaukeln
    Me-dail-le|die|Medaillen
    Po-kal|der|Pokale
    Lauf|der|Läufe`);
  addNouns('musik', 'Musik', `Gi-tar-re|die|Gitarren
    Kla-vier|das|Klaviere
    Flö-te|die|Flöten
    Trom-mel|die|Trommeln
    Gei-ge|die|Geigen
    Trom-pe-te|die|Trompeten
    Lied|das|Lieder
    No-te|die|Noten
    Chor|der|Chöre
    Glo-cke|die|Glocken
    Xy-lo-fon|das|Xylofone
    Ras-sel|die|Rasseln
    Mu-sik|die|-
    Kon-zert|das|Konzerte
    Har-fe|die|Harfen
    Tri-an-gel|der|Triangel`);
  addNouns('meer', 'Meer und Wasser', `Meer|das|Meere
    Strand|der|Strände
    Wel-le|die|Wellen
    Mu-schel|die|Muscheln
    Sand|der|-
    In-sel|die|Inseln
    Ha-fen|der|Häfen
    Leucht-turm|der|Leuchttürme
    Seg-ler|der|Segler
    Mö-we|die|Möwen
    Krab-be|die|Krabben
    Qual-le|die|Quallen
    See-stern|der|Seesterne
    Rob-be|die|Robben
    Ka-pi-tän|der|Kapitäne
    An-ker|der|Anker
    Bach|der|Bäche
    Teich|der|Teiche`);
  addNouns('garten', 'Garten und Pflanzen', `Gar-ten|der|Gärten
    Ro-se|die|Rosen
    Tul-pe|die|Tulpen
    Son-nen-blu-me|die|Sonnenblumen
    Gän-se-blüm-chen|das|Gänseblümchen
    Lö-wen-zahn|der|-
    Gras|das|Gräser
    Beet|das|Beete
    Sa-men|der|Samen
    Knos-pe|die|Knospen
    Blü-te|die|Blüten
    Gieß-kan-ne|die|Gießkannen
    Schau-fel|die|Schaufeln
    Har-ke|die|Harken
    Ei-mer|der|Eimer
    Re-gen-wurm|der|Regenwürmer
    He-cke|die|Hecken
    Strauch|der|Sträucher
    Kak-tus|der|Kakteen
    Kräu-ter|die|-`);
  addNouns('essen', 'Obst, Gemüse und Essen', `Me-lo-ne|die|Melonen
    Zi-tro-ne|die|Zitronen
    O-ran-ge|die|Orangen
    Trau-be|die|Trauben
    Pfir-sich|der|Pfirsiche
    A-na-nas|die|Ananas
    Ki-wi|die|Kiwis
    Pa-pri-ka|der|Paprikas
    Sa-lat|der|Salate
    Brok-ko-li|der|Brokkolis
    Erb-se|die|Erbsen
    Boh-ne|die|Bohnen
    Mais|der|-
    Kä-se|der|-
    But-ter|die|-
    Wurst|die|Würste
    Reis|der|-
    Piz-za|die|Pizzas
    Ho-nig|der|-
    Müs-li|das|Müslis
    Jo-ghurt|der|Joghurts
    Bre-zel|die|Brezeln
    Sem-mel|die|Semmeln
    Scho-ko-la-de|die|Schokoladen
    Eis|das|-
    Was-ser|das|-
    Tee|der|Tees
    Ka-ka-o|der|-`);
  addNouns('schule', 'Schule', `Blei-stift|der|Bleistifte
    Fül-ler|der|Füller
    Mal-kas-ten|der|Malkästen
    Ta-sche|die|Taschen
    Map-pe|die|Mappen
    Fe-der-mäpp-chen|das|Federmäppchen
    Block|der|Blöcke
    Blatt|das|Blätter
    Schü-ler|der|Schüler
    Schü-le-rin|die|Schülerinnen
    Haus-auf-ga-be|die|Hausaufgaben
    Zeug-nis|das|Zeugnisse
    Bü-che-rei|die|Büchereien
    Schul-hof|der|Schulhöfe
    Glo-bus|der|Globen
    Land-kar-te|die|Landkarten
    Rech-ner|der|Rechner
    Com-pu-ter|der|Computer`);
  addNouns('verkehr', 'Fahrzeuge und Verkehr', `Last-wa-gen|der|Lastwagen
    Mo-tor-rad|das|Motorräder
    Kran-ken-wa-gen|der|Krankenwagen
    Po-li-zei-au-to|das|Polizeiautos
    Stra-ßen-bahn|die|Straßenbahnen
    U-Bahn|die|U-Bahnen
    Hub-schrau-ber|der|Hubschrauber
    Ra-ke-te|die|Raketen
    Kreu-zung|die|Kreuzungen
    Ze-bra-strei-fen|der|Zebrastreifen
    Geh-weg|der|Gehwege
    Rad-weg|der|Radwege
    Schild|das|Schilder
    Hal-te-stel-le|die|Haltestellen
    Bahn-hof|der|Bahnhöfe
    Tank-stel-le|die|Tankstellen
    Rei-fen|der|Reifen
    Klin-gel|die|Klingeln
    Brem-se|die|Bremsen`);
  addNouns('haus', 'Haus und Wohnung', `Zim-mer|das|Zimmer
    Bad|das|Bäder
    Dach|das|Dächer
    Kel-ler|der|Keller
    Wand|die|Wände
    Bo-den|der|Böden
    Tep-pich|der|Teppiche
    Spie-gel|der|Spiegel
    Re-gal|das|Regale
    O-fen|der|Öfen
    Herd|der|Herde
    Topf|der|Töpfe
    Pfan-ne|die|Pfannen
    Mes-ser|das|Messer
    Glas|das|Gläser
    Schlüs-sel|der|Schlüssel
    Vor-hang|der|Vorhänge
    De-cke|die|Decken
    Bal-kon|der|Balkone
    Hei-zung|die|Heizungen`);
  addNouns('kleidung', 'Kleidung', `T-Shirt|das|T-Shirts
    Klei-der-bü-gel|der|Kleiderbügel
    Schlaf-an-zug|der|Schlafanzüge
    Ba-de-ho-se|die|Badehosen
    Re-gen-ja-cke|die|Regenjacken
    Gum-mi-stie-fel|der|Gummistiefel
    Hut|der|Hüte
    Kap-pe|die|Kappen
    Bril-le|die|Brillen
    Knopf|der|Knöpfe
    Ruck-sack|der|Rucksäcke
    Turn-schuh|der|Turnschuhe`);

  /* Gegensätze ergänzen */
  const pairs = s => lines(s).map(l => l.split('|')).map(([l, r]) => ({ l, r }));
  const haveA = new Set(P.ANTONYMS.map(x => x.l + '|' + x.r));
  pairs(`arm|reich
    billig|teuer
    dumm|klug
    eckig|rund
    eng|weit
    faul|fleißig
    fern|nah
    gerade|krumm
    gesund|krank
    glatt|rau
    gut|schlecht
    heiß|kalt
    hungrig|satt
    krumm|gerade
    leer|voll
    müde|wach
    mutig|ängstlich
    offen|geschlossen
    richtig|falsch
    roh|gekocht
    ruhig|unruhig
    scharf|stumpf
    schön|hässlich
    sicher|gefährlich
    spitz|stumpf
    still|laut
    trüb|klar
    vorne|hinten
    wild|zahm
    zuerst|zuletzt
    flach|steil
    feucht|trocken
    ehrlich|unehrlich
    freundlich|unfreundlich
    leicht|schwierig
    gleich|verschieden
    dick|schlank
    hell|finster
    froh|traurig
    sauer|süß`).forEach(x => { if (!haveA.has(x.l + '|' + x.r)) { haveA.add(x.l + '|' + x.r); P.ANTONYMS.push(x); } });

  /* Verben: Grundform | er/sie | Präteritum | Perfekt (er/sie …) */
  const PERF0 = { gehen: 'ist gegangen', laufen: 'ist gelaufen', sehen: 'hat gesehen', lesen: 'hat gelesen', schreiben: 'hat geschrieben', singen: 'hat gesungen', springen: 'ist gesprungen', essen: 'hat gegessen', trinken: 'hat getrunken', fahren: 'ist gefahren', schlafen: 'hat geschlafen', spielen: 'hat gespielt', malen: 'hat gemalt', lachen: 'hat gelacht', rufen: 'hat gerufen', finden: 'hat gefunden', kommen: 'ist gekommen', nehmen: 'hat genommen', geben: 'hat gegeben', helfen: 'hat geholfen', sprechen: 'hat gesprochen', fliegen: 'ist geflogen', schwimmen: 'ist geschwommen', bauen: 'hat gebaut', kaufen: 'hat gekauft' };
  P.VERBS.forEach(v => { if (!v.pf && PERF0[v.g]) v.pf = PERF0[v.g]; });
  const haveV = new Set(P.VERBS.map(v => v.g));
  lines(`backen|backt|backte|hat gebacken
    beißen|beißt|biss|hat gebissen
    bitten|bittet|bat|hat gebeten
    bleiben|bleibt|blieb|ist geblieben
    brechen|bricht|brach|hat gebrochen
    bringen|bringt|brachte|hat gebracht
    denken|denkt|dachte|hat gedacht
    fallen|fällt|fiel|ist gefallen
    fangen|fängt|fing|hat gefangen
    fressen|frisst|fraß|hat gefressen
    frieren|friert|fror|hat gefroren
    gewinnen|gewinnt|gewann|hat gewonnen
    gießen|gießt|goss|hat gegossen
    graben|gräbt|grub|hat gegraben
    halten|hält|hielt|hat gehalten
    hängen|hängt|hing|hat gehangen
    heben|hebt|hob|hat gehoben
    heißen|heißt|hieß|hat geheißen
    kennen|kennt|kannte|hat gekannt
    klingen|klingt|klang|hat geklungen
    lassen|lässt|ließ|hat gelassen
    leiden|leidet|litt|hat gelitten
    liegen|liegt|lag|hat gelegen
    lügen|lügt|log|hat gelogen
    messen|misst|maß|hat gemessen
    pfeifen|pfeift|pfiff|hat gepfiffen
    raten|rät|riet|hat geraten
    reiten|reitet|ritt|ist geritten
    riechen|riecht|roch|hat gerochen
    scheinen|scheint|schien|hat geschienen
    schieben|schiebt|schob|hat geschoben
    schießen|schießt|schoss|hat geschossen
    schlagen|schlägt|schlug|hat geschlagen
    schließen|schließt|schloss|hat geschlossen
    schneiden|schneidet|schnitt|hat geschnitten
    schreien|schreit|schrie|hat geschrien
    sitzen|sitzt|saß|hat gesessen
    stehen|steht|stand|hat gestanden
    stehlen|stiehlt|stahl|hat gestohlen
    steigen|steigt|stieg|ist gestiegen
    sterben|stirbt|starb|ist gestorben
    tragen|trägt|trug|hat getragen
    treffen|trifft|traf|hat getroffen
    treten|tritt|trat|hat getreten
    tun|tut|tat|hat getan
    vergessen|vergisst|vergaß|hat vergessen
    verlieren|verliert|verlor|hat verloren
    wachsen|wächst|wuchs|ist gewachsen
    waschen|wäscht|wusch|hat gewaschen
    werfen|wirft|warf|hat geworfen
    wissen|weiß|wusste|hat gewusst
    ziehen|zieht|zog|hat gezogen
    rennen|rennt|rannte|ist gerannt
    sagen|sagt|sagte|hat gesagt
    fragen|fragt|fragte|hat gefragt
    antworten|antwortet|antwortete|hat geantwortet
    lernen|lernt|lernte|hat gelernt
    machen|macht|machte|hat gemacht
    hören|hört|hörte|hat gehört
    kochen|kocht|kochte|hat gekocht
    tanzen|tanzt|tanzte|hat getanzt
    wohnen|wohnt|wohnte|hat gewohnt
    zeigen|zeigt|zeigte|hat gezeigt
    suchen|sucht|suchte|hat gesucht
    holen|holt|holte|hat geholt
    putzen|putzt|putzte|hat geputzt
    turnen|turnt|turnte|hat geturnt
    rechnen|rechnet|rechnete|hat gerechnet
    basteln|bastelt|bastelte|hat gebastelt
    klettern|klettert|kletterte|ist geklettert
    hüpfen|hüpft|hüpfte|ist gehüpft
    reisen|reist|reiste|ist gereist
    warten|wartet|wartete|hat gewartet
    arbeiten|arbeitet|arbeitete|hat gearbeitet
    erzählen|erzählt|erzählte|hat erzählt
    besuchen|besucht|besuchte|hat besucht`).forEach(l => { const [g, p, v, pf] = l.split('|'); if (!haveV.has(g)) { haveV.add(g); P.VERBS.push({ g, p, v, pf }); } });

  /* Adjektive mit Steigerung: Grundform | Komparativ | Superlativ */
  P.ADJ = lines(`groß|größer|am größten
    klein|kleiner|am kleinsten
    alt|älter|am ältesten
    jung|jünger|am jüngsten
    lang|länger|am längsten
    kurz|kürzer|am kürzesten
    schnell|schneller|am schnellsten
    langsam|langsamer|am langsamsten
    warm|wärmer|am wärmsten
    kalt|kälter|am kältesten
    hoch|höher|am höchsten
    gut|besser|am besten
    viel|mehr|am meisten
    gern|lieber|am liebsten
    nah|näher|am nächsten
    stark|stärker|am stärksten
    schwach|schwächer|am schwächsten
    laut|lauter|am lautesten
    leise|leiser|am leisesten
    hell|heller|am hellsten
    dunkel|dunkler|am dunkelsten
    schwer|schwerer|am schwersten
    leicht|leichter|am leichtesten
    klug|klüger|am klügsten
    dick|dicker|am dicksten
    dünn|dünner|am dünnsten
    nett|netter|am nettesten
    schön|schöner|am schönsten
    breit|breiter|am breitesten
    tief|tiefer|am tiefsten`).map(l => { const [g, k, s] = l.split('|'); return { g, k, s }; });

  /* Lückensätze ergänzen */
  const addSent = (key, name, s) => { if (!P.SENTENCES[key]) P.SENTENCES[key] = { name, list: [] }; const have = new Set(P.SENTENCES[key].list); lines(s).forEach(x => { if (!have.has(x)) { have.add(x); P.SENTENCES[key].list.push(x); } }); };
  addSent('tiere', 'Tiere', `Das [Eichhörnchen] sammelt Nüsse für den Winter.
    Die Schnecke trägt ihr [Haus] auf dem Rücken.
    Der Specht klopft an den [Baum].
    Die Spinne baut ein [Netz].
    Der Elefant hat einen langen [Rüssel].
    Die Giraffe hat einen langen [Hals].
    Der Pinguin kann nicht [fliegen].
    Der Maulwurf gräbt unter der [Erde].
    Die Henne legt ein [Ei].
    Das Küken schlüpft aus dem [Ei].`);
  addSent('jahr', 'Jahreszeiten und Wetter', `Im Herbst bauen wir einen bunten [Drachen].
    Im Dezember zünden wir die [Kerzen] am Adventskranz an.
    An Ostern suchen die Kinder bunte [Eier].
    Im Winter fahren wir mit dem [Schlitten].
    Bei einem Gewitter sieht man [Blitze].
    Im Sommer essen wir gern ein [Eis].
    Im Frühling bauen die Vögel ihre [Nester].
    Wenn es friert, wird Wasser zu [Eis].`);
  addSent('schule', 'Schule', `In der Bücherei leihen wir [Bücher] aus.
    Mit dem [Pinsel] malen wir ein Bild.
    Vor dem Unterricht packen wir unser [Mäppchen] aus.
    Am Ende des Schuljahres bekommen wir ein [Zeugnis].
    In der Turnhalle ziehen wir [Turnschuhe] an.
    Die Kinder melden sich mit der [Hand].`);
  addSent('alltag', 'Familie und Alltag', `Nach dem Essen spülen wir das [Geschirr].
    Oma liest uns eine [Geschichte] vor.
    Am Wochenende besuchen wir unsere [Großeltern].
    Vor dem Essen waschen wir unsere [Hände].
    Mama kauft im Supermarkt [Milch] und Brot.
    Mein Bruder hat heute [Geburtstag].`);
  addSent('feuerwehr', 'Feuerwehr', `Die [Feuerwehr] kommt, wenn es brennt.
    Den Notruf der Feuerwehr erreicht man unter der Nummer [112].
    Das Feuerwehrauto hat ein [Blaulicht].
    Mit der [Leiter] kommt die Feuerwehr hoch hinauf.
    Durch den [Schlauch] fließt das Löschwasser.
    Ein [Rauchmelder] warnt, wenn es in der Wohnung raucht.
    Die Feuerwehrleute tragen einen [Helm].
    Die Feuerwehr hilft auch bei [Unfällen].
    Viele Feuerwehrleute arbeiten [freiwillig] und ohne Lohn.
    Bei Rauch kriechen wir [gebückt] aus dem Raum.`);
  addSent('wald', 'Wald und Bäume', `Die Eiche trägt [Eicheln].
    Die Tanne hat [Nadeln] statt Blätter.
    Im Herbst färben sich die [Blätter] bunt.
    Der Förster kümmert sich um den [Wald].
    An den Jahresringen kann man das [Alter] eines Baumes erkennen.
    Die [Wurzeln] halten den Baum im Boden fest.
    Der Specht sucht unter der [Rinde] nach Insekten.
    Im Wald wachsen viele [Pilze].
    Ein Baum besteht aus Wurzeln, Stamm und [Krone].
    Das Reh ist ein scheues [Waldtier].`);
  addSent('koerper', 'Körper und Gesundheit', `Mit den [Augen] sehen wir.
    Mit den [Ohren] hören wir.
    Mit der [Nase] riechen wir.
    Mit der [Zunge] schmecken wir.
    Das [Herz] pumpt das Blut durch den Körper.
    Mit der [Lunge] atmen wir.
    Unser Körper hat viele [Knochen].
    Nach dem Essen putzen wir die [Zähne].
    Obst und Gemüse halten uns [gesund].
    Beim Sport bewegen wir unsere [Muskeln].`);
  addSent('verkehr', 'Verkehr', `Bei Rot bleiben wir an der [Ampel] stehen.
    Am [Zebrastreifen] dürfen Fußgänger über die Straße gehen.
    Beim Radfahren tragen wir einen [Helm].
    Vor dem Überqueren schauen wir nach links und nach [rechts].
    Der [Bus] hält an der Haltestelle.
    Das Fahrrad braucht eine gute [Bremse].
    Im Dunkeln hilft helle [Kleidung], damit man uns sieht.
    Die [Polizei] regelt manchmal den Verkehr.`);
  addSent('essen', 'Essen und Trinken', `Zum Frühstück esse ich gern [Müsli].
    Die [Banane] ist gelb.
    Aus Milch macht man [Käse].
    Die Bäckerin backt [Brot].
    Im Sommer essen wir gern [Erdbeeren].
    Wenn wir Durst haben, trinken wir [Wasser].
    Kartoffeln wachsen in der [Erde].
    Aus Äpfeln kann man [Saft] pressen.`);
  addSent('sport', 'Sport und Freizeit', `Beim Fußball schießen wir ein [Tor].
    Im Schwimmbad springen wir ins [Wasser].
    Im Winter fahren wir [Ski].
    Auf dem Spielplatz rutschen wir die [Rutsche] hinunter.
    Beim Seilspringen brauchen wir ein [Seil].
    Wer gewinnt, bekommt einen [Pokal].`);
  addSent('zeit', 'Zeit und Kalender', `Eine Woche hat sieben [Tage].
    Ein Jahr hat zwölf [Monate].
    Nach dem Montag kommt der [Dienstag].
    Eine Stunde hat sechzig [Minuten].
    Der erste Monat im Jahr heißt [Januar].
    Am [Wochenende] haben wir keine Schule.`);

  /* Wortarten: [N:Nomen] [V:Verb] [A:Adjektiv] – übrige Wörter ohne Markierung */
  P.TAGGED = lines(`Der [N:Hund] [V:bellt] [A:laut].
    Die [A:kleine] [N:Katze] [V:schläft].
    [N:Lisa] [V:liest] ein [A:spannendes] [N:Buch].
    Der [N:Ball] [V:rollt] über die [A:grüne] [N:Wiese].
    Die [N:Sonne] [V:scheint] [A:hell].
    Das [N:Pferd] [V:läuft] [A:schnell].
    [N:Ben] [V:malt] ein [A:buntes] [N:Bild].
    Die [A:alte] [N:Eule] [V:sitzt] auf dem [N:Ast].
    Im [N:Garten] [V:blühen] [A:rote] [N:Rosen].
    Der [A:kalte] [N:Wind] [V:weht].
    [N:Mia] [V:trinkt] [A:warmen] [N:Tee].
    Die [N:Kinder] [V:spielen] im [A:großen] [N:Park].
    Der [N:Igel] [V:frisst] [A:kleine] [N:Käfer].
    [N:Oma] [V:backt] einen [A:leckeren] [N:Kuchen].
    Die [A:fleißige] [N:Biene] [V:sammelt] [N:Nektar].
    Das [N:Baby] [V:lacht] [A:fröhlich].
    Der [N:Zug] [V:fährt] [A:pünktlich] ab.
    [N:Paul] [V:baut] eine [A:hohe] [N:Burg].
    Die [A:müden] [N:Kinder] [V:gehen] ins [N:Bett].
    Der [N:Regen] [V:prasselt] auf das [N:Dach].
    Die [N:Feuerwehr] [V:löscht] das [N:Feuer].
    Ein [A:bunter] [N:Schmetterling] [V:fliegt] zur [N:Blume].
    [N:Emma] [V:schreibt] einen [A:langen] [N:Brief].
    Die [N:Lehrerin] [V:erklärt] die [A:neue] [N:Aufgabe].
    Der [A:hungrige] [N:Fuchs] [V:schleicht] durch den [N:Wald].
    [N:Finn] [V:isst] einen [A:sauren] [N:Apfel].
    Die [N:Schnecke] [V:kriecht] [A:langsam].
    Im [N:Winter] [V:fällt] [A:weißer] [N:Schnee].
    Der [N:Bäcker] [V:verkauft] [A:frische] [N:Brötchen].
    Die [N:Vögel] [V:singen] [A:früh] am [N:Morgen].`);

  /* Vokabeln ergänzen – Deutsch | Fremdsprache */
  const addVoc = (lang, key, name, s) => { const L = P.VOCAB[lang]; if (!L.themes[key]) L.themes[key] = { name, list: [] }; const have = new Set(L.themes[key].list.map(x => x.l)); pairs(s).forEach(x => { if (!have.has(x.l)) { have.add(x.l); L.themes[key].list.push(x); } }); };
  /* Englisch */
  addVoc('en', 'zahlen', 'Zahlen', `eins|one
    zwei|two
    drei|three
    vier|four
    fünf|five
    sechs|six
    sieben|seven
    acht|eight
    neun|nine
    zehn|ten
    elf|eleven
    zwölf|twelve
    dreizehn|thirteen
    zwanzig|twenty
    dreißig|thirty
    fünfzig|fifty
    hundert|a hundred`);
  addVoc('en', 'zeit', 'Wochentage und Monate', `Montag|Monday
    Dienstag|Tuesday
    Mittwoch|Wednesday
    Donnerstag|Thursday
    Freitag|Friday
    Samstag|Saturday
    Sonntag|Sunday
    Januar|January
    Februar|February
    März|March
    April|April
    Mai|May
    Juni|June
    Juli|July
    August|August
    September|September
    Oktober|October
    November|November
    Dezember|December
    der Tag|the day
    die Woche|the week
    der Monat|the month
    das Jahr|the year`);
  addVoc('en', 'wetter', 'Wetter und Jahreszeiten', `die Sonne|the sun
    der Regen|the rain
    der Schnee|the snow
    der Wind|the wind
    die Wolke|the cloud
    sonnig|sunny
    regnerisch|rainy
    windig|windy
    bewölkt|cloudy
    kalt|cold
    heiß|hot
    warm|warm
    der Frühling|spring
    der Sommer|summer
    der Herbst|autumn
    der Winter|winter`);
  addVoc('en', 'haus', 'Haus und Wohnung', `das Haus|the house
    die Wohnung|the flat
    das Zimmer|the room
    die Küche|the kitchen
    das Badezimmer|the bathroom
    das Schlafzimmer|the bedroom
    das Wohnzimmer|the living room
    der Garten|the garden
    die Tür|the door
    das Fenster|the window
    der Tisch|the table
    der Stuhl|the chair
    das Bett|the bed
    der Schrank|the cupboard
    die Treppe|the stairs`);
  addVoc('en', 'stadt', 'In der Stadt', `die Stadt|the town
    die Straße|the street
    der Bahnhof|the station
    die Bücherei|the library
    der Supermarkt|the supermarket
    das Krankenhaus|the hospital
    die Kirche|the church
    das Kino|the cinema
    der Park|the park
    die Brücke|the bridge
    links abbiegen|to turn left
    rechts abbiegen|to turn right
    geradeaus|straight on
    neben|next to
    gegenüber|opposite`);
  addVoc('en', 'freizeit', 'Freizeit und Hobbys', `Fußball spielen|to play football
    schwimmen|to swim
    Rad fahren|to ride a bike
    tanzen|to dance
    singen|to sing
    lesen|to read
    malen|to paint
    kochen|to cook
    Musik hören|to listen to music
    fernsehen|to watch TV
    Freunde treffen|to meet friends
    das Hobby|the hobby
    das Spiel|the game
    der Verein|the club`);
  addVoc('en', 'adjektive', 'Adjektive', `groß|big
    klein|small
    alt|old
    neu|new
    jung|young
    lang|long
    kurz|short
    schnell|fast
    langsam|slow
    glücklich|happy
    traurig|sad
    müde|tired
    hungrig|hungry
    schön|beautiful
    lustig|funny
    nett|nice
    laut|loud
    leise|quiet`);
  addVoc('en', 'kleidung', 'Kleidung', `die Hose|the trousers
    das T-Shirt|the T-shirt
    der Pullover|the jumper
    die Jacke|the jacket
    das Kleid|the dress
    der Rock|the skirt
    die Schuhe|the shoes
    die Socken|the socks
    die Mütze|the cap
    der Schal|the scarf
    das Hemd|the shirt
    die Stiefel|the boots`);
  /* Italienisch */
  addVoc('it', 'zahlen', 'Zahlen', `eins|uno
    zwei|due
    drei|tre
    vier|quattro
    fünf|cinque
    sechs|sei
    sieben|sette
    acht|otto
    neun|nove
    zehn|dieci
    elf|undici
    zwölf|dodici
    dreizehn|tredici
    zwanzig|venti
    einundzwanzig|ventuno
    dreißig|trenta
    fünfzig|cinquanta
    hundert|cento`);
  addVoc('it', 'zeit', 'Wochentage und Monate', `Montag|lunedì
    Dienstag|martedì
    Mittwoch|mercoledì
    Donnerstag|giovedì
    Freitag|venerdì
    Samstag|sabato
    Sonntag|domenica
    Januar|gennaio
    Februar|febbraio
    März|marzo
    April|aprile
    Mai|maggio
    Juni|giugno
    Juli|luglio
    August|agosto
    September|settembre
    Oktober|ottobre
    November|novembre
    Dezember|dicembre
    der Tag|il giorno
    die Woche|la settimana
    der Monat|il mese
    das Jahr|l'anno`);
  addVoc('it', 'wetter', 'Wetter und Jahreszeiten', `die Sonne|il sole
    der Regen|la pioggia
    der Schnee|la neve
    der Wind|il vento
    die Wolke|la nuvola
    es ist sonnig|c'è il sole
    es regnet|piove
    es schneit|nevica
    es ist kalt|fa freddo
    es ist heiß|fa caldo
    der Frühling|la primavera
    der Sommer|l'estate
    der Herbst|l'autunno
    der Winter|l'inverno`);
  addVoc('it', 'haus', 'Haus und Wohnung', `das Haus|la casa
    die Wohnung|l'appartamento
    das Zimmer|la stanza
    die Küche|la cucina
    das Badezimmer|il bagno
    das Schlafzimmer|la camera da letto
    das Wohnzimmer|il soggiorno
    der Garten|il giardino
    die Tür|la porta
    das Fenster|la finestra
    der Tisch|il tavolo
    der Stuhl|la sedia
    das Bett|il letto
    der Schrank|l'armadio
    die Treppe|le scale`);
  addVoc('it', 'stadt', 'In der Stadt', `die Stadt|la città
    die Straße|la strada
    der Platz|la piazza
    der Bahnhof|la stazione
    die Bücherei|la biblioteca
    der Supermarkt|il supermercato
    das Krankenhaus|l'ospedale
    die Kirche|la chiesa
    das Kino|il cinema
    der Park|il parco
    die Brücke|il ponte
    die Bar|il bar
    die Eisdiele|la gelateria
    links|a sinistra
    rechts|a destra
    geradeaus|dritto`);
  addVoc('it', 'freizeit', 'Freizeit und Hobbys', `Fußball spielen|giocare a calcio
    schwimmen|nuotare
    Rad fahren|andare in bicicletta
    tanzen|ballare
    singen|cantare
    lesen|leggere
    malen|dipingere
    kochen|cucinare
    Musik hören|ascoltare la musica
    fernsehen|guardare la TV
    Freunde treffen|incontrare gli amici
    ins Kino gehen|andare al cinema
    das Hobby|l'hobby
    die Freizeit|il tempo libero`);
  addVoc('it', 'adjektive', 'Adjektive', `groß|grande
    klein|piccolo
    alt|vecchio
    neu|nuovo
    jung|giovane
    schön|bello
    hässlich|brutto
    schnell|veloce
    langsam|lento
    glücklich|felice
    traurig|triste
    müde|stanco
    sympathisch|simpatico
    nett|gentile
    lustig|divertente
    leicht|facile
    schwierig|difficile`);
  addVoc('it', 'kleidung', 'Kleidung', `die Hose|i pantaloni
    das T-Shirt|la maglietta
    der Pullover|il maglione
    die Jacke|la giacca
    das Kleid|il vestito
    der Rock|la gonna
    die Schuhe|le scarpe
    die Socken|i calzini
    die Mütze|il berretto
    der Schal|la sciarpa
    das Hemd|la camicia
    die Stiefel|gli stivali`);
  /* Französisch */
  addVoc('fr', 'zahlen', 'Zahlen', `eins|un
    zwei|deux
    drei|trois
    vier|quatre
    fünf|cinq
    sechs|six
    sieben|sept
    acht|huit
    neun|neuf
    zehn|dix
    elf|onze
    zwölf|douze
    zwanzig|vingt
    dreißig|trente
    fünfzig|cinquante
    hundert|cent`);
  addVoc('fr', 'zeit', 'Wochentage und Monate', `Montag|lundi
    Dienstag|mardi
    Mittwoch|mercredi
    Donnerstag|jeudi
    Freitag|vendredi
    Samstag|samedi
    Sonntag|dimanche
    Januar|janvier
    Februar|février
    März|mars
    April|avril
    Mai|mai
    Juni|juin
    Juli|juillet
    August|août
    September|septembre
    Oktober|octobre
    November|novembre
    Dezember|décembre`);
  addVoc('fr', 'essen', 'Essen und Trinken', `der Apfel|la pomme
    das Brot|le pain
    der Käse|le fromage
    die Milch|le lait
    das Wasser|l'eau
    das Ei|l'œuf
    der Kuchen|le gâteau
    die Banane|la banane
    die Tomate|la tomate
    der Saft|le jus
    das Frühstück|le petit-déjeuner
    das Mittagessen|le déjeuner`);
  addVoc('fr', 'verben', 'Verben', `spielen|jouer
    sprechen|parler
    essen|manger
    trinken|boire
    gehen|aller
    machen|faire
    sein|être
    haben|avoir
    lesen|lire
    schreiben|écrire
    hören|écouter
    sehen|voir
    kommen|venir
    wohnen|habiter
    lieben|aimer`);
  addVoc('fr', 'adjektive', 'Adjektive', `groß|grand
    klein|petit
    schön|beau
    neu|nouveau
    alt|vieux
    jung|jeune
    gut|bon
    lustig|drôle
    nett|gentil
    müde|fatigué
    glücklich|heureux
    traurig|triste`);
  /* Spanisch */
  addVoc('es', 'zahlen', 'Zahlen', `eins|uno
    zwei|dos
    drei|tres
    vier|cuatro
    fünf|cinco
    sechs|seis
    sieben|siete
    acht|ocho
    neun|nueve
    zehn|diez
    elf|once
    zwölf|doce
    zwanzig|veinte
    dreißig|treinta
    fünfzig|cincuenta
    hundert|cien`);
  addVoc('es', 'zeit', 'Wochentage und Monate', `Montag|lunes
    Dienstag|martes
    Mittwoch|miércoles
    Donnerstag|jueves
    Freitag|viernes
    Samstag|sábado
    Sonntag|domingo
    Januar|enero
    Februar|febrero
    März|marzo
    April|abril
    Mai|mayo
    Juni|junio
    Juli|julio
    August|agosto
    September|septiembre
    Oktober|octubre
    November|noviembre
    Dezember|diciembre`);
  addVoc('es', 'essen', 'Essen und Trinken', `der Apfel|la manzana
    das Brot|el pan
    der Käse|el queso
    die Milch|la leche
    das Wasser|el agua
    das Ei|el huevo
    der Kuchen|el pastel
    die Banane|el plátano
    die Tomate|el tomate
    der Saft|el zumo
    das Frühstück|el desayuno
    das Mittagessen|la comida`);
  addVoc('es', 'verben', 'Verben', `spielen|jugar
    sprechen|hablar
    essen|comer
    trinken|beber
    gehen|ir
    machen|hacer
    sein|ser
    haben|tener
    lesen|leer
    schreiben|escribir
    hören|escuchar
    sehen|ver
    kommen|venir
    wohnen|vivir
    lernen|aprender`);
  addVoc('es', 'adjektive', 'Adjektive', `groß|grande
    klein|pequeño
    schön|bonito
    neu|nuevo
    alt|viejo
    jung|joven
    gut|bueno
    lustig|divertido
    nett|simpático
    müde|cansado
    glücklich|feliz
    traurig|triste`);

  /* Sachaufgaben ergänzen (erfundene Namen) */
  const SA = P.SACH;
  SA['+'].push(
    { t: 'In der Klasse sind {a} Mädchen und {b} Jungen.', f: 'Wie viele Kinder sind in der Klasse?', ans: 'In der Klasse sind {c} Kinder.' },
    { t: '{A} liest am Samstag {a} Seiten und am Sonntag {b} Seiten.', f: 'Wie viele Seiten hat {A} gelesen?', ans: '{A} hat {c} Seiten gelesen.' },
    { t: 'Auf dem Parkplatz stehen {a} Autos. Dann kommen noch {b} Autos dazu.', f: 'Wie viele Autos stehen jetzt auf dem Parkplatz?', ans: 'Jetzt stehen {c} Autos auf dem Parkplatz.' },
    { t: 'Ein Buch kostet {a} Euro, ein Heft {b} Euro.', f: 'Wie viel kostet beides zusammen?', ans: 'Beides zusammen kostet {c} Euro.' },
    { t: 'Im Garten blühen {a} rote und {b} gelbe Tulpen.', f: 'Wie viele Tulpen blühen im Garten?', ans: 'Im Garten blühen {c} Tulpen.' });
  SA['−'].push(
    { t: 'Im Korb liegen {a} Äpfel. {A} nimmt {b} Äpfel heraus.', f: 'Wie viele Äpfel liegen noch im Korb?', ans: 'Im Korb liegen noch {c} Äpfel.' },
    { t: 'Ein Zug hat {a} Plätze. {b} Plätze sind besetzt.', f: 'Wie viele Plätze sind noch frei?', ans: 'Es sind noch {c} Plätze frei.' },
    { t: '{A} ist {a} cm groß, {B} ist {b} cm groß.', f: 'Wie viel cm ist {A} größer als {B}?', ans: '{A} ist {c} cm größer als {B}.' },
    { t: 'Das Fest dauert {a} Minuten. {b} Minuten sind schon vorbei.', f: 'Wie lange dauert das Fest noch?', ans: 'Das Fest dauert noch {c} Minuten.' });
  SA['·'].push(
    { t: 'Ein Heft kostet {b} Euro. {A} kauft {a} Hefte.', f: 'Wie viel muss {A} bezahlen?', ans: '{A} muss {c} Euro bezahlen.' },
    { t: 'Ein Eierkarton hat {b} Eier. Im Laden stehen {a} Kartons.', f: 'Wie viele Eier sind das?', ans: 'Das sind {c} Eier.' },
    { t: '{A} übt jeden Tag {b} Minuten Flöte, und zwar {a} Tage lang.', f: 'Wie viele Minuten übt {A} insgesamt?', ans: '{A} übt insgesamt {c} Minuten.' });
  SA[':'].push(
    { t: '{a} Muffins werden auf {b} Teller verteilt. Auf jedem Teller liegen gleich viele.', f: 'Wie viele Muffins liegen auf einem Teller?', ans: 'Auf jedem Teller liegen {c} Muffins.' },
    { t: 'Ein Seil ist {a} m lang. Es wird in {b} gleich lange Stücke geschnitten.', f: 'Wie lang ist ein Stück?', ans: 'Ein Stück ist {c} m lang.' },
    { t: 'Für einen Ausflug zahlen {b} Kinder zusammen {a} Euro. Jedes Kind zahlt gleich viel.', f: 'Wie viel zahlt ein Kind?', ans: 'Jedes Kind zahlt {c} Euro.' });
  P.NAMES.push('Mila', 'Jonas', 'Sofia', 'Luca', 'Hannah', 'Leon', 'Clara', 'Anton', 'Nele', 'Malik', 'Yara', 'Samuel', 'Aylin', 'Theo', 'Zoe', 'David');
  P.THINGS.push('Nüsse', 'Glitzersteine', 'Bauklötze', 'Postkarten', 'Radiergummis', 'Hefte', 'Bälle', 'Blumen');

  /* Geprüfte Bildzuordnungen (Bildbibliothek bilder/): Wort → Datei. Nur eindeutige Motive. */
  P.PICS = {'Hund':'emoji_u1f415.svg','Katze':'emoji_u1f408.svg','Maus':'emoji_u1f401.svg','Pferd':'emoji_u1f40e.svg','Kuh':'emoji_u1f404.svg','Schaf':'emoji_u1f411.svg','Igel':'emoji_u1f994.svg','Fuchs':'emoji_u1f98a.svg','Hase':'emoji_u1f407.svg','Vogel':'emoji_u1f426.svg','Fisch':'emoji_u1f41f.svg','Ente':'emoji_u1f986.svg','Schwein':'emoji_u1f416.svg','Ziege':'emoji_u1f410.svg','Bär':'emoji_u1f43b.svg','Eule':'emoji_u1f989.svg','Biene':'emoji_u1f41d.svg','Käfer':'emoji_u1f41e.svg','Frosch':'emoji_u1f438.svg','Löwe':'emoji_u1f981.svg','Pinguin':'emoji_u1f427.svg','Elefant':'emoji_u1f418.svg','Giraffe':'emoji_u1f992.svg','Zebra':'emoji_u1f993.svg','Affe':'emoji_u1f412.svg','Tiger':'emoji_u1f405.svg','Schlange':'emoji_u1f40d.svg','Krokodil':'emoji_u1f40a.svg','Schildkröte':'emoji_u1f422.svg','Papagei':'emoji_u1f99c.svg','Wal':'emoji_u1f40b.svg','Delfin':'emoji_u1f42c.svg','Hai':'emoji_u1f988.svg','Krake':'emoji_u1f419.svg','Schnecke':'emoji_u1f40c.svg','Spinne':'emoji_u1f577.svg','Ameise':'emoji_u1f41c.svg','Schmetterling':'emoji_u1f98b.svg','Känguru':'emoji_u1f998.svg','Kamel':'emoji_u1f42b.svg','Wolf':'emoji_u1f43a.svg','Hamster':'emoji_u1f439.svg','Apfel':'emoji_u1f34e.svg','Birne':'emoji_u1f350.svg','Banane':'emoji_u1f34c.svg','Kirsche':'emoji_u1f352.svg','Erdbeere':'emoji_u1f353.svg','Tomate':'emoji_u1f345.svg','Gurke':'emoji_u1f952.svg','Karotte':'emoji_u1f955.svg','Kartoffel':'emoji_u1f954.svg','Zwiebel':'emoji_u1f9c5.svg','Brot':'emoji_u1f35e.svg','Ei':'emoji_u1f95a.svg','Kuchen':'emoji_u1f967.svg','Keks':'emoji_u1f36a.svg','Melone':'emoji_u1f349.svg','Zitrone':'emoji_u1f34b.svg','Orange':'emoji_u1f34a.svg','Traube':'emoji_u1f347.svg','Pfirsich':'emoji_u1f351.svg','Ananas':'emoji_u1f34d.svg','Kiwi':'emoji_u1f95d.svg','Paprika':'emoji_u1fad1.svg','Salat':'emoji_u1f957.svg','Brokkoli':'emoji_u1f966.svg','Erbse':'emoji_u1fadb.svg','Bohne':'emoji_u1fad8.svg','Mais':'emoji_u1f33d.svg','Käse':'emoji_u1f9c0.svg','Butter':'emoji_u1f9c8.svg','Reis':'emoji_u1f35a.svg','Pizza':'emoji_u1f355.svg','Honig':'emoji_u1f36f.svg','Brezel':'emoji_u1f968.svg','Schokolade':'emoji_u1f36b.svg','Eis':'emoji_u1f366.svg','Tee':'emoji_u1f375.svg','Milch':'emoji_u1f95b.svg','Saft':'emoji_u1f9c3.svg','Buch':'emoji_u1f4d5.svg','Stift':'emoji_u270f.svg','Bleistift':'emoji_u270f.svg','Lineal':'emoji_u1f4cf.svg','Schere':'emoji_u2702.svg','Stuhl':'emoji_u1fa91.svg','Ranzen':'emoji_u1f392.svg','Rucksack':'emoji_u1f392.svg','Pinsel':'emoji_u1f58c.svg','Füller':'emoji_u1f58b.svg','Block':'emoji_u1f5d2.svg','Globus':'emoji_u1f30d.svg','Landkarte':'emoji_u1f5fa.svg','Computer':'emoji_u1f4bb.svg','Lehrerin':'emoji_u1f469_200d_1f3eb.svg','Lehrer':'emoji_u1f468_200d_1f3eb.svg','Bein':'emoji_u1f9b5.svg','Fuß':'emoji_u1f9b6.svg','Auge':'emoji_u1f441.svg','Ohr':'emoji_u1f442.svg','Nase':'emoji_u1f443.svg','Mund':'emoji_u1f444.svg','Zahn':'emoji_u1f9b7.svg','Zunge':'emoji_u1f445.svg','Hand':'emoji_u270b.svg','Knochen':'emoji_u1f9b4.svg','Hose':'emoji_u1f456.svg','Jacke':'emoji_u1f9e5.svg','Kappe':'emoji_u1f9e2.svg','Schal':'emoji_u1f9e3.svg','Schuh':'emoji_u1f45f.svg','Turnschuh':'emoji_u1f45f.svg','Socke':'emoji_u1f9e6.svg','Kleid':'emoji_u1f457.svg','Hemd':'emoji_u1f454.svg','Handschuh':'emoji_u1f9e4.svg','Stiefel':'emoji_u1f97e.svg','Hut':'emoji_u1f452.svg','Brille':'emoji_u1f453.svg','T-Shirt':'emoji_u1f455.svg','Auto':'emoji_u1f697.svg','Bus':'emoji_u1f68c.svg','Zug':'emoji_u1f686.svg','Fahrrad':'emoji_u1f6b2.svg','Roller':'emoji_u1f6f4.svg','Schiff':'emoji_u1f6a2.svg','Boot':'emoji_u26f5.svg','Flugzeug':'emoji_u2708.svg','Traktor':'emoji_u1f69c.svg','Ampel':'emoji_u1f6a6.svg','Motorrad':'emoji_u1f3cd.svg','Krankenwagen':'emoji_u1f691.svg','Polizeiauto':'emoji_u1f693.svg','Lastwagen':'emoji_u1f69a.svg','Straßenbahn':'emoji_u1f68a.svg','Hubschrauber':'emoji_u1f681.svg','Rakete':'emoji_u1f680.svg','Bahnhof':'emoji_u1f689.svg','Haltestelle':'emoji_u1f68f.svg','Tankstelle':'emoji_u26fd.svg','Reifen':'emoji_u1f6de.svg','Baum':'emoji_u1f333.svg','Blume':'emoji_u1f33c.svg','Berg':'emoji_u26f0.svg','Wolke':'emoji_u2601.svg','Sonne':'emoji_u2600.svg','Stern':'emoji_u2b50.svg','Mond':'emoji_u1f319.svg','Schneemann':'emoji_u26c4.svg','Pilz':'emoji_u1f344.svg','Stein':'emoji_u1faa8.svg','Regenbogen':'emoji_u1f308.svg','Schneeflocke':'emoji_u2744.svg','Blitz':'emoji_u26a1.svg','Regen':'emoji_u1f327.svg','Wind':'emoji_u1f32c.svg','Nebel':'emoji_u1f32b.svg','Thermometer':'emoji_u1f321.svg','Tanne':'emoji_u1f332.svg','Kastanie':'emoji_u1f330.svg','Blatt':'emoji_u1f341.svg','Laub':'emoji_u1f342.svg','Kaktus':'emoji_u1f335.svg','Rose':'emoji_u1f339.svg','Tulpe':'emoji_u1f337.svg','Sonnenblume':'emoji_u1f33b.svg','Kräuter':'emoji_u1f33f.svg','Regenwurm':'emoji_u1fab1.svg','Schaufel':'emoji_u1fa8f.svg','Eimer':'emoji_u1faa3.svg','Insel':'emoji_u1f3dd.svg','Welle':'emoji_u1f30a.svg','Qualle':'emoji_u1fabc.svg','Krabbe':'emoji_u1f980.svg','Robbe':'emoji_u1f9ad.svg','Anker':'emoji_u2693.svg','Leiter':'emoji_u1fa9c.svg','Feuerwehrauto':'emoji_u1f692.svg','Feuer':'emoji_u1f525.svg','Feuerlöscher':'emoji_u1f9ef.svg','Feuerwehrmann':'emoji_u1f468_200d_1f692.svg','Feuerwehrfrau':'emoji_u1f469_200d_1f692.svg','Hirsch':'emoji_u1f98c.svg','Wildschwein':'emoji_u1f417.svg','Dachs':'emoji_u1f9a1.svg','Bauer':'emoji_u1f468_200d_1f33e.svg','Bäuerin':'emoji_u1f469_200d_1f33e.svg','Huhn':'emoji_u1f414.svg','Hahn':'emoji_u1f413.svg','Küken':'emoji_u1f424.svg','Gans':'emoji_u1fabf.svg','Esel':'emoji_u1facf.svg','Arzt':'emoji_u1f468_200d_2695.svg','Ärztin':'emoji_u1f469_200d_2695.svg','Koch':'emoji_u1f468_200d_1f373.svg','Köchin':'emoji_u1f469_200d_1f373.svg','Polizist':'emoji_u1f46e_200d_2642.svg','Polizistin':'emoji_u1f46e_200d_2640.svg','Pilot':'emoji_u1f468_200d_2708.svg','Pilotin':'emoji_u1f469_200d_2708.svg','Mechaniker':'emoji_u1f468_200d_1f527.svg','Oma':'emoji_u1f475.svg','Opa':'emoji_u1f474.svg','Baby':'emoji_u1f476.svg','Kind':'emoji_u1f9d2.svg','Mädchen':'emoji_u1f467.svg','Junge':'emoji_u1f466.svg','Familie':'emoji_u1f46a.svg','Kerze':'emoji_u1f56f.svg','Geschenk':'emoji_u1f381.svg','Torte':'emoji_u1f370.svg','Ballon':'emoji_u1f388.svg','Drachen':'emoji_u1fa81.svg','Kürbis':'emoji_u1f383.svg','Schlitten':'emoji_u1f6f7.svg','Weihnachtsbaum':'emoji_u1f384.svg','Kalender':'emoji_u1f4c5.svg','Fußball':'emoji_u26bd.svg','Tor':'emoji_u1f945.svg','Ski':'emoji_u1f3bf.svg','Schlittschuh':'emoji_u26f8.svg','Puzzle':'emoji_u1f9e9.svg','Rutsche':'emoji_u1f6dd.svg','Medaille':'emoji_u1f3c5.svg','Pokal':'emoji_u1f3c6.svg','Würfel':'emoji_u1f3b2.svg','Gitarre':'emoji_u1f3b8.svg','Klavier':'emoji_u1f3b9.svg','Flöte':'emoji_u1fa88.svg','Trommel':'emoji_u1f941.svg','Geige':'emoji_u1f3bb.svg','Trompete':'emoji_u1f3ba.svg','Glocke':'emoji_u1f514.svg','Harfe':'emoji_u1fa89.svg','Rassel':'emoji_u1fa87.svg','Note':'emoji_u1f3b5.svg','Teddy':'emoji_u1f9f8.svg','Tür':'emoji_u1f6aa.svg','Fenster':'emoji_u1fa9f.svg','Bett':'emoji_u1f6cf.svg','Sofa':'emoji_u1f6cb.svg','Löffel':'emoji_u1f944.svg','Messer':'emoji_u1f52a.svg','Schlüssel':'emoji_u1f511.svg','Spiegel':'emoji_u1fa9e.svg','Uhr':'emoji_u23f0.svg','Tasse':'emoji_u2615.svg','Haus':'emoji_u1f3e0.svg','Schule':'emoji_u1f3eb.svg','Zahnbürste':'emoji_u1faa5.svg','Seife':'emoji_u1f9fc.svg','Kran':'emoji_u1f3d7.svg','Burg':'emoji_u1f3f0.svg','Zelt':'emoji_u26fa.svg'};
  /* Wörter für Kreuzworträtsel/Geheimschrift: aus allen Nomen */
  P.allNouns = () => Object.values(P.NOUNS).flatMap(t => t.list);
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.FolivaPools = P;
})(typeof window !== 'undefined' ? window : globalThis);
