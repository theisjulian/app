/* Foliva – eigene Inhaltssammlungen für „Neue Aufgaben erzeugen“ · © 2026 theis
   Alles selbst geschrieben (keine fremden Texte). Namen sind erfunden.
   Fremdsprachen: Grundwortschatz; vor Veröffentlichung von Fachlehrkräften gegenlesen lassen. */
(function (root) {
  'use strict';
  /* Nomen: [Wort, Artikel, Mehrzahl] */
  const N = (s) => s.trim().split('\n').map(l => l.trim().split('|')).map(([w, a, p]) => ({ w, a, p }));
  const NOUNS = {
    tiere: { name: 'Tiere', list: N(`Hund|der|Hunde
      Katze|die|Katzen
      Maus|die|Mäuse
      Pferd|das|Pferde
      Kuh|die|Kühe
      Schaf|das|Schafe
      Igel|der|Igel
      Fuchs|der|Füchse
      Hase|der|Hasen
      Vogel|der|Vögel
      Fisch|der|Fische
      Ente|die|Enten
      Schwein|das|Schweine
      Ziege|die|Ziegen
      Bär|der|Bären
      Eule|die|Eulen
      Biene|die|Bienen
      Käfer|der|Käfer
      Frosch|der|Frösche
      Löwe|der|Löwen`) },
    essen: { name: 'Obst, Gemüse und Essen', list: N(`Apfel|der|Äpfel
      Birne|die|Birnen
      Banane|die|Bananen
      Kirsche|die|Kirschen
      Pflaume|die|Pflaumen
      Erdbeere|die|Erdbeeren
      Tomate|die|Tomaten
      Gurke|die|Gurken
      Karotte|die|Karotten
      Kartoffel|die|Kartoffeln
      Zwiebel|die|Zwiebeln
      Brot|das|Brote
      Ei|das|Eier
      Nudel|die|Nudeln
      Kuchen|der|Kuchen
      Keks|der|Kekse
      Saft|der|Säfte
      Suppe|die|Suppen`) },
    schule: { name: 'Schule', list: N(`Heft|das|Hefte
      Buch|das|Bücher
      Stift|der|Stifte
      Lineal|das|Lineale
      Schere|die|Scheren
      Tafel|die|Tafeln
      Tisch|der|Tische
      Stuhl|der|Stühle
      Ranzen|der|Ranzen
      Kleber|der|Kleber
      Pinsel|der|Pinsel
      Radiergummi|der|Radiergummis
      Spitzer|der|Spitzer
      Klasse|die|Klassen
      Pause|die|Pausen
      Lehrerin|die|Lehrerinnen
      Mappe|die|Mappen`) },
    koerper: { name: 'Körper', list: N(`Kopf|der|Köpfe
      Arm|der|Arme
      Bein|das|Beine
      Hand|die|Hände
      Fuß|der|Füße
      Auge|das|Augen
      Ohr|das|Ohren
      Nase|die|Nasen
      Mund|der|Münder
      Zahn|der|Zähne
      Finger|der|Finger
      Knie|das|Knie
      Bauch|der|Bäuche
      Haar|das|Haare`) },
    kleidung: { name: 'Kleidung', list: N(`Hose|die|Hosen
      Jacke|die|Jacken
      Mütze|die|Mützen
      Schal|der|Schals
      Schuh|der|Schuhe
      Socke|die|Socken
      Kleid|das|Kleider
      Rock|der|Röcke
      Hemd|das|Hemden
      Pulli|der|Pullis
      Handschuh|der|Handschuhe
      Stiefel|der|Stiefel
      Gürtel|der|Gürtel`) },
    verkehr: { name: 'Fahrzeuge und Verkehr', list: N(`Auto|das|Autos
      Bus|der|Busse
      Zug|der|Züge
      Fahrrad|das|Fahrräder
      Roller|der|Roller
      Schiff|das|Schiffe
      Boot|das|Boote
      Flugzeug|das|Flugzeuge
      Traktor|der|Traktoren
      Ampel|die|Ampeln
      Straße|die|Straßen
      Brücke|die|Brücken
      Helm|der|Helme`) },
    natur: { name: 'Natur, Wetter, Jahreszeiten', list: N(`Baum|der|Bäume
      Blume|die|Blumen
      Blatt|das|Blätter
      Wiese|die|Wiesen
      Wald|der|Wälder
      Berg|der|Berge
      See|der|Seen
      Fluss|der|Flüsse
      Wolke|die|Wolken
      Sonne|die|Sonnen
      Stern|der|Sterne
      Mond|der|Monde
      Schneemann|der|Schneemänner
      Pilz|der|Pilze
      Stein|der|Steine`) },
    haus: { name: 'Haus und Wohnung', list: N(`Tür|die|Türen
      Fenster|das|Fenster
      Bett|das|Betten
      Lampe|die|Lampen
      Schrank|der|Schränke
      Sofa|das|Sofas
      Küche|die|Küchen
      Treppe|die|Treppen
      Teller|der|Teller
      Tasse|die|Tassen
      Löffel|der|Löffel
      Gabel|die|Gabeln
      Kissen|das|Kissen
      Uhr|die|Uhren`) },
  };
  /* Gegensätze (Adjektive) */
  const ANTONYMS = `groß|klein
    alt|jung
    hell|dunkel
    laut|leise
    schnell|langsam
    warm|kalt
    dick|dünn
    lang|kurz
    nass|trocken
    voll|leer
    hart|weich
    süß|sauer
    früh|spät
    oben|unten
    leicht|schwer
    hoch|tief
    breit|schmal
    sauber|schmutzig
    fröhlich|traurig
    stark|schwach
    neu|alt
    viel|wenig
    links|rechts
    innen|außen`.split('\n').map(l => l.trim().split('|')).map(([l, r]) => ({ l, r }));
  /* Verben: Grundform | er/sie (Präsens) | Präteritum */
  const VERBS = `gehen|geht|ging
    laufen|läuft|lief
    sehen|sieht|sah
    lesen|liest|las
    schreiben|schreibt|schrieb
    singen|singt|sang
    springen|springt|sprang
    essen|isst|aß
    trinken|trinkt|trank
    fahren|fährt|fuhr
    schlafen|schläft|schlief
    spielen|spielt|spielte
    malen|malt|malte
    lachen|lacht|lachte
    rufen|ruft|rief
    finden|findet|fand
    kommen|kommt|kam
    nehmen|nimmt|nahm
    geben|gibt|gab
    helfen|hilft|half
    sprechen|spricht|sprach
    fliegen|fliegt|flog
    schwimmen|schwimmt|schwamm
    bauen|baut|baute
    kaufen|kauft|kaufte`.split('\n').map(l => l.trim().split('|')).map(([g, p, v]) => ({ g, p, v }));

  /* Sätze für Lückentexte: das Wort in [Klammern] ist die Lücke */
  const S = s => s.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const SENTENCES = {
    tiere: { name: 'Tiere', list: S(`Der [Igel] hat viele Stacheln.
      Im Winter hält der Igel [Winterschlaf].
      Die [Katze] fängt eine Maus.
      Der Hund [bellt] laut.
      Die Kuh gibt [Milch].
      Die [Biene] sammelt Nektar.
      Der Vogel baut ein [Nest].
      Das Pferd frisst [Heu].
      Der Fuchs lebt im [Wald].
      Die Ente schwimmt auf dem [Teich].
      Der Frosch [springt] ins Wasser.
      Die Eule jagt in der [Nacht].
      Der Hase hat lange [Ohren].
      Das Schaf hat ein dickes [Fell].`) },
    jahr: { name: 'Jahreszeiten und Wetter', list: S(`Im [Frühling] blühen die ersten Blumen.
      Im Sommer scheint oft die [Sonne].
      Im [Herbst] fallen die Blätter von den Bäumen.
      Im Winter liegt oft [Schnee].
      Bei Regen brauchen wir einen [Schirm].
      Nach dem Regen sehen wir einen [Regenbogen].
      Im Winter bauen die Kinder einen [Schneemann].
      Der Wind lässt den [Drachen] steigen.
      Im Sommer gehen wir ins [Schwimmbad].
      Im Herbst sammeln wir [Kastanien].`) },
    schule: { name: 'Schule', list: S(`Lisa packt ihren [Ranzen].
      Ben spitzt seinen [Stift].
      In der [Pause] spielen die Kinder auf dem Hof.
      Die Lehrerin schreibt an die [Tafel].
      Mia schneidet mit der [Schere].
      Wir lesen ein spannendes [Buch].
      Tom klebt das Bild in sein [Heft].
      Mit dem [Lineal] ziehen wir gerade Linien.
      Nach der Schule machen die Kinder [Hausaufgaben].
      Im Sportunterricht [rennen] wir um die Wette.`) },
    alltag: { name: 'Familie und Alltag', list: S(`Am Morgen putzt Emma ihre [Zähne].
      Zum Frühstück isst Paul ein [Brot].
      Finn fährt mit dem [Fahrrad] zur Schule.
      Oma backt einen leckeren [Kuchen].
      Am Abend gehen die Kinder ins [Bett].
      Lea gießt die [Blumen].
      Papa kocht eine [Suppe].
      Wir decken den [Tisch].
      Noah räumt sein [Zimmer] auf.
      Ida füttert die [Katze].`) },
  };
  /* Vokabeln: Deutsch | Fremdsprache */
  const V = s => s.trim().split('\n').map(l => l.trim().split('|')).map(([l, r]) => ({ l, r }));
  const VOCAB = {
    en: { name: 'Englisch', themes: {
      schule: { name: 'Schule', list: V(`das Buch|the book
        das Heft|the exercise book
        der Stift|the pen
        der Bleistift|the pencil
        das Lineal|the ruler
        der Radiergummi|the rubber
        die Tafel|the board
        der Tisch|the desk
        der Stuhl|the chair
        die Schultasche|the school bag
        das Klassenzimmer|the classroom
        die Lehrerin|the teacher
        die Pause|the break
        die Hausaufgabe|the homework`) },
      tiere: { name: 'Tiere', list: V(`der Hund|the dog
        die Katze|the cat
        die Maus|the mouse
        das Pferd|the horse
        die Kuh|the cow
        das Schwein|the pig
        das Schaf|the sheep
        der Vogel|the bird
        der Fisch|the fish
        das Kaninchen|the rabbit
        die Ente|the duck
        der Frosch|the frog
        der Bär|the bear
        der Löwe|the lion`) },
      farben: { name: 'Farben', list: V(`rot|red
        blau|blue
        grün|green
        gelb|yellow
        schwarz|black
        weiß|white
        braun|brown
        orange|orange
        rosa|pink
        lila|purple
        grau|grey`) },
      familie: { name: 'Familie', list: V(`die Mutter|the mother
        der Vater|the father
        die Schwester|the sister
        der Bruder|the brother
        die Großmutter|the grandmother
        der Großvater|the grandfather
        die Tante|the aunt
        der Onkel|the uncle
        die Eltern|the parents
        das Baby|the baby
        der Cousin|the cousin
        die Familie|the family`) },
      essen: { name: 'Essen und Trinken', list: V(`der Apfel|the apple
        die Banane|the banana
        das Brot|the bread
        der Käse|the cheese
        das Ei|the egg
        die Milch|the milk
        das Wasser|the water
        der Saft|the juice
        der Kuchen|the cake
        die Nudeln|the pasta
        der Reis|the rice
        das Frühstück|the breakfast
        das Abendessen|the dinner`) },
      koerper: { name: 'Körper und Kleidung', list: V(`der Kopf|the head
        die Hand|the hand
        der Fuß|the foot
        das Auge|the eye
        das Ohr|the ear
        die Nase|the nose
        der Mund|the mouth
        die Hose|the trousers
        das T-Shirt|the T-shirt
        die Jacke|the jacket
        die Mütze|the cap
        die Schuhe|the shoes`) },
      verben: { name: 'Verben', list: V(`spielen|to play
        lesen|to read
        schreiben|to write
        singen|to sing
        schwimmen|to swim
        laufen|to run
        essen|to eat
        trinken|to drink
        schlafen|to sleep
        gehen|to go
        sehen|to see
        sprechen|to speak
        helfen|to help
        kaufen|to buy`) },
    } },
    it: { name: 'Italienisch', themes: {
      schule: { name: 'Schule', list: V(`das Buch|il libro
        das Heft|il quaderno
        der Kugelschreiber|la penna
        der Bleistift|la matita
        das Lineal|il righello
        der Radiergummi|la gomma
        die Tafel|la lavagna
        der Tisch|il banco
        der Stuhl|la sedia
        die Schultasche|lo zaino
        das Klassenzimmer|l'aula
        die Lehrerin|l'insegnante
        die Pause|l'intervallo
        die Hausaufgaben|i compiti`) },
      tiere: { name: 'Tiere', list: V(`der Hund|il cane
        die Katze|il gatto
        die Maus|il topo
        das Pferd|il cavallo
        die Kuh|la mucca
        das Schwein|il maiale
        das Schaf|la pecora
        der Vogel|l'uccello
        der Fisch|il pesce
        das Kaninchen|il coniglio
        die Ente|l'anatra
        der Frosch|la rana
        der Bär|l'orso
        der Löwe|il leone`) },
      farben: { name: 'Farben', list: V(`rot|rosso
        blau|blu
        grün|verde
        gelb|giallo
        schwarz|nero
        weiß|bianco
        braun|marrone
        orange|arancione
        rosa|rosa
        lila|viola
        grau|grigio`) },
      familie: { name: 'Familie', list: V(`die Mutter|la madre
        der Vater|il padre
        die Schwester|la sorella
        der Bruder|il fratello
        die Großmutter|la nonna
        der Großvater|il nonno
        die Tante|la zia
        der Onkel|lo zio
        die Eltern|i genitori
        der Sohn|il figlio
        die Tochter|la figlia
        die Familie|la famiglia`) },
      essen: { name: 'Essen und Trinken', list: V(`der Apfel|la mela
        die Banane|la banana
        das Brot|il pane
        der Käse|il formaggio
        das Ei|l'uovo
        die Milch|il latte
        das Wasser|l'acqua
        der Saft|il succo
        der Kuchen|la torta
        die Nudeln|la pasta
        der Reis|il riso
        das Frühstück|la colazione
        das Abendessen|la cena`) },
      koerper: { name: 'Körper und Kleidung', list: V(`der Kopf|la testa
        die Hand|la mano
        der Fuß|il piede
        das Auge|l'occhio
        das Ohr|l'orecchio
        die Nase|il naso
        der Mund|la bocca
        die Hose|i pantaloni
        das T-Shirt|la maglietta
        die Jacke|la giacca
        die Mütze|il cappello
        die Schuhe|le scarpe`) },
      verben: { name: 'Verben', list: V(`spielen|giocare
        lesen|leggere
        schreiben|scrivere
        singen|cantare
        schwimmen|nuotare
        laufen|correre
        essen|mangiare
        trinken|bere
        schlafen|dormire
        gehen|andare
        sehen|vedere
        sprechen|parlare
        helfen|aiutare
        kaufen|comprare`) },
    } },
    fr: { name: 'Französisch', themes: {
      schule: { name: 'Schule', list: V(`das Buch|le livre
        das Heft|le cahier
        der Stift|le stylo
        der Bleistift|le crayon
        das Lineal|la règle
        der Radiergummi|la gomme
        die Tafel|le tableau
        der Stuhl|la chaise
        die Schultasche|le cartable
        der Lehrer|le professeur
        die Pause|la récréation`) },
      tiere: { name: 'Tiere', list: V(`der Hund|le chien
        die Katze|le chat
        die Maus|la souris
        das Pferd|le cheval
        die Kuh|la vache
        das Schwein|le cochon
        der Vogel|l'oiseau
        der Fisch|le poisson
        das Kaninchen|le lapin
        der Frosch|la grenouille`) },
      farben: { name: 'Farben', list: V(`rot|rouge
        blau|bleu
        grün|vert
        gelb|jaune
        schwarz|noir
        weiß|blanc
        grau|gris
        orange|orange`) },
      familie: { name: 'Familie', list: V(`die Mutter|la mère
        der Vater|le père
        die Schwester|la sœur
        der Bruder|le frère
        die Großmutter|la grand-mère
        der Großvater|le grand-père
        die Tante|la tante
        der Onkel|l'oncle
        die Eltern|les parents`) },
    } },
    es: { name: 'Spanisch', themes: {
      schule: { name: 'Schule', list: V(`das Buch|el libro
        das Heft|el cuaderno
        der Kugelschreiber|el bolígrafo
        der Bleistift|el lápiz
        das Lineal|la regla
        der Radiergummi|la goma
        die Tafel|la pizarra
        der Stuhl|la silla
        die Schultasche|la mochila
        die Pause|el recreo`) },
      tiere: { name: 'Tiere', list: V(`der Hund|el perro
        die Katze|el gato
        die Maus|el ratón
        das Pferd|el caballo
        die Kuh|la vaca
        das Schwein|el cerdo
        der Vogel|el pájaro
        der Fisch|el pez
        das Kaninchen|el conejo
        der Frosch|la rana`) },
      farben: { name: 'Farben', list: V(`rot|rojo
        blau|azul
        grün|verde
        gelb|amarillo
        schwarz|negro
        weiß|blanco
        grau|gris`) },
      familie: { name: 'Familie', list: V(`die Mutter|la madre
        der Vater|el padre
        die Schwester|la hermana
        der Bruder|el hermano
        die Großmutter|la abuela
        der Großvater|el abuelo
        die Tante|la tía
        der Onkel|el tío
        die Eltern|los padres`) },
    } },
  };
  /* Sachaufgaben-Vorlagen (erfundene Namen) */
  const NAMES = ['Lisa', 'Ben', 'Mia', 'Tom', 'Lea', 'Finn', 'Emma', 'Paul', 'Ida', 'Noah', 'Jana', 'Elias'];
  const THINGS = ['Murmeln', 'Sticker', 'Äpfel', 'Bonbons', 'Stifte', 'Karten', 'Perlen', 'Muscheln', 'Kastanien', 'Luftballons'];
  const SACH = {
    '+': [
      { t: '{A} hat {a} {o}. {B} schenkt {A} noch {b} {o}.', f: 'Wie viele {o} hat {A} jetzt?', ans: '{A} hat jetzt {c} {o}.' },
      { t: 'Im Bus sitzen {a} Kinder. An der Haltestelle steigen {b} Kinder ein.', f: 'Wie viele Kinder sitzen jetzt im Bus?', ans: 'Jetzt sitzen {c} Kinder im Bus.' },
      { t: '{A} sammelt am Montag {a} {o} und am Dienstag {b} {o}.', f: 'Wie viele {o} hat {A} insgesamt gesammelt?', ans: '{A} hat insgesamt {c} {o} gesammelt.' },
    ],
    '−': [
      { t: '{A} hat {a} {o}. {A} verschenkt {b} {o} an {B}.', f: 'Wie viele {o} hat {A} noch?', ans: '{A} hat noch {c} {o}.' },
      { t: 'In der Bibliothek stehen {a} Bücher im Regal. Die Kinder leihen {b} Bücher aus.', f: 'Wie viele Bücher stehen noch im Regal?', ans: 'Es stehen noch {c} Bücher im Regal.' },
      { t: '{A} hat {a} Euro gespart und kauft ein Spiel für {b} Euro.', f: 'Wie viel Geld hat {A} noch?', ans: '{A} hat noch {c} Euro.' },
    ],
    '·': [
      { t: '{A} kauft {a} Packungen mit je {b} {o}.', f: 'Wie viele {o} sind das insgesamt?', ans: 'Das sind insgesamt {c} {o}.' },
      { t: 'In der Turnhalle stehen {a} Reihen mit je {b} Stühlen.', f: 'Wie viele Stühle stehen in der Turnhalle?', ans: 'In der Turnhalle stehen {c} Stühle.' },
    ],
    ':': [
      { t: '{a} Kinder werden auf {b} gleich große Gruppen verteilt.', f: 'Wie viele Kinder sind in jeder Gruppe?', ans: 'In jeder Gruppe sind {c} Kinder.' },
      { t: '{A} verteilt {a} {o} gerecht an {b} Kinder.', f: 'Wie viele {o} bekommt jedes Kind?', ans: 'Jedes Kind bekommt {c} {o}.' },
    ],
  };
  const API = { NOUNS, ANTONYMS, VERBS, SENTENCES, VOCAB, NAMES, THINGS, SACH };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.FolivaPools = API;
})(typeof window !== 'undefined' ? window : globalThis);
