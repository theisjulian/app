/* Foliva – Inhalte ab 0.9.9 · © 2026 theis
   Selbst geschrieben, keine fremden Texte; Namen erfunden. Ergänzt FolivaPools (pools.js, pools2.js), ohne Vorhandenes zu entfernen.
   – CLUES: Rätselfragen (Umschreibungen) für Kreuzworträtsel, ohne das gesuchte Wort zu verraten
   – Weitere Lückensätze je Thema
   – TF: Aussagen zum Sachwissen (richtig/falsch) für „Richtig oder falsch“
   – SACHTEXTE: kurze Sachtexte mit Fragen und Musterantworten, Klassenstufe 1/2 und 3/4
   Fachlich bewusst einfach gehalten; vor Veröffentlichung gegenlesen lassen. */
(function (root) {
  'use strict';
  const P = root.FolivaPools || (typeof require !== 'undefined' ? require('./pools2.js') : {});
  const lines = s => s.trim().split('\n').map(l => l.trim()).filter(Boolean);

  /* Kleine Korrekturen an vorhandenen Wörtern (Schreibweise) */
  Object.values(P.NOUNS || {}).forEach(t => t.list.forEach(x => {
    if (x.w === 'TShirt') { x.w = 'T-Shirt'; x.s = 'T-Shirt'; }
    if (x.w === 'UBahn') { x.w = 'U-Bahn'; x.s = 'U-Bahn'; }
    if (x.w === 'Triangel') x.a = 'die';
  }));

  /* ---------- Rätselfragen: Wort|Hinweis ---------- */
  const CL = {};
  lines(`Hund|Er bellt und wedelt mit dem Schwanz.
    Katze|Sie miaut und fängt Mäuse.
    Maus|Ein kleines Tier mit langem Schwanz. Es piepst.
    Pferd|Auf diesem Tier kann man reiten.
    Kuh|Sie gibt Milch und frisst Gras.
    Schaf|Aus seiner Wolle strickt man Pullover.
    Igel|Er hat Stacheln und hält Winterschlaf.
    Fuchs|Ein schlaues Tier mit rotem Fell und buschigem Schwanz.
    Hase|Er hat lange Ohren und hoppelt über das Feld.
    Vogel|Er hat Federn und Flügel.
    Fisch|Er lebt im Wasser und atmet mit Kiemen.
    Ente|Sie schwimmt auf dem Teich und macht „quak“.
    Schwein|Es grunzt und wälzt sich gern im Schlamm.
    Ziege|Sie meckert und hat oft einen Bart.
    Bär|Ein großes, starkes Tier mit dickem Fell. Er mag Honig.
    Eule|Dieser Vogel jagt in der Nacht.
    Biene|Sie sammelt Nektar und macht Honig.
    Käfer|Ein Insekt mit sechs Beinen und harten Flügeldecken.
    Frosch|Er quakt und springt ins Wasser.
    Löwe|Er hat eine Mähne und brüllt laut.
    Pinguin|Ein Vogel, der nicht fliegen, aber gut schwimmen kann.
    Elefant|Das größte Landtier mit einem langen Rüssel.
    Giraffe|Sie hat einen sehr langen Hals.
    Zebra|Ein Tier mit schwarzen und weißen Streifen.
    Affe|Er klettert geschickt von Baum zu Baum.
    Tiger|Eine große Raubkatze mit Streifen.
    Schlange|Sie hat keine Beine und kriecht über den Boden.
    Krokodil|Ein Tier mit vielen spitzen Zähnen. Es lebt im und am Fluss.
    Schildkröte|Sie trägt einen harten Panzer und ist sehr langsam.
    Papagei|Ein bunter Vogel, der Wörter nachsprechen kann.
    Wal|Das größte Tier im Meer.
    Delfin|Ein kluges Tier im Meer, das hoch springen kann.
    Hai|Ein großer Fisch mit scharfen Zähnen.
    Krake|Ein Meerestier mit acht Armen.
    Schnecke|Sie trägt ihr Haus auf dem Rücken.
    Spinne|Sie hat acht Beine und baut ein Netz.
    Ameise|Ein kleines Insekt, das in großen Gruppen lebt.
    Schmetterling|Er hat bunte Flügel und war vorher eine Raupe.
    Känguru|Es springt und trägt sein Junges im Beutel.
    Kamel|Es hat Höcker und lebt in der Wüste.
    Wolf|Er heult und lebt im Rudel.
    Hamster|Ein Haustier, das Futter in seinen Backen sammelt.
    Kaninchen|Ein Haustier mit langen Ohren, das Möhren mag.
    Apfel|Ein rundes Obst, rot, gelb oder grün. Er wächst am Baum.
    Birne|Ein Obst, das unten dick und oben schmal ist.
    Banane|Ein gelbes, krummes Obst.
    Kirsche|Eine kleine rote Frucht mit einem Kern.
    Pflaume|Eine blaue Frucht mit Kern. Man backt Kuchen daraus.
    Erdbeere|Eine rote Frucht mit kleinen Nüsschen außen.
    Tomate|Ein rotes Gemüse. Man macht daraus Ketchup.
    Gurke|Ein langes, grünes Gemüse.
    Karotte|Ein orangefarbenes Gemüse. Hasen mögen es.
    Kartoffel|Sie wächst unter der Erde. Man macht Pommes daraus.
    Zwiebel|Beim Schneiden muss man oft weinen.
    Brot|Der Bäcker backt es aus Mehl.
    Nudel|Man kocht sie in Wasser und isst sie mit Soße.
    Kuchen|Man backt ihn zum Geburtstag.
    Keks|Ein kleines, süßes Gebäck.
    Saft|Ein Getränk aus Obst.
    Suppe|Man isst sie mit dem Löffel aus einem Teller.
    Melone|Eine große, runde Frucht mit vielen Kernen.
    Zitrone|Ein gelbes Obst. Es ist sehr sauer.
    Orange|Ein rundes Obst. Man presst daraus Saft.
    Traube|Viele kleine Beeren an einem Stiel. Man macht daraus Saft.
    Ananas|Eine Frucht mit stacheliger Schale und Blättern oben.
    Kiwi|Eine Frucht mit brauner, haariger Schale und grünem Inneren.
    Salat|Grüne Blätter, die man mit Soße isst.
    Erbse|Kleine, runde, grüne Kugeln in einer Schote.
    Mais|Er hat gelbe Körner. Man macht Popcorn daraus.
    Käse|Er wird aus Milch gemacht und hat manchmal Löcher.
    Butter|Man streicht sie aufs Brot. Sie wird aus Milch gemacht.
    Wurst|Man isst sie in Scheiben aufs Brot oder gegrillt.
    Reis|Kleine weiße Körner, die man kocht.
    Pizza|Ein flacher Teig mit Tomatensoße und Käse aus dem Ofen.
    Honig|Die Bienen machen ihn. Er ist süß und klebrig.
    Müsli|Man isst es zum Frühstück mit Milch.
    Brezel|Ein Gebäck mit Salz, das wie eine Schleife aussieht.
    Semmel|In Bayern sagt man so zum Brötchen.
    Schokolade|Sie ist süß, braun und schmilzt in der Sonne.
    Eis|Es ist kalt und süß. Man isst es im Sommer.
    Wasser|Ein Getränk ohne Farbe und ohne Geschmack.
    Tee|Ein heißes Getränk aus Blättern oder Kräutern.
    Kakao|Ein Getränk aus Milch und Schokoladenpulver.
    Heft|Darin schreibst du deine Aufgaben auf.
    Buch|Es hat viele Seiten zum Lesen.
    Stift|Damit kannst du schreiben oder malen.
    Lineal|Damit ziehst du gerade Striche.
    Schere|Damit schneidest du Papier.
    Tafel|Die Lehrerin schreibt mit Kreide darauf.
    Tisch|Daran sitzt du und schreibst.
    Stuhl|Darauf sitzt du.
    Ranzen|Darin trägst du deine Sachen zur Schule.
    Kleber|Damit klebst du Papier zusammen.
    Pinsel|Damit malst du mit Wasserfarben.
    Radiergummi|Damit machst du Bleistiftstriche weg.
    Spitzer|Damit machst du deinen Stift wieder spitz.
    Klasse|Die Kinder in deinem Raum gehören zu deiner …
    Pause|Die freie Zeit zwischen den Stunden.
    Lehrerin|Sie unterrichtet die Kinder.
    Bleistift|Damit schreibt man, und man kann es wegradieren.
    Füller|Ein Stift mit Tinte.
    Malkasten|Darin sind die Wasserfarben.
    Zeugnis|Das bekommst du am Ende des Schuljahres.
    Bücherei|Dort kann man Bücher ausleihen.
    Schulhof|Hier spielen die Kinder in der Pause.
    Globus|Eine Kugel, auf der man die ganze Erde sieht.
    Landkarte|Darauf sieht man Länder, Flüsse und Städte.
    Computer|Ein Gerät mit Bildschirm und Tastatur.
    Kopf|Darauf wachsen deine Haare.
    Arm|Er reicht von der Schulter bis zur Hand.
    Bein|Damit gehst und rennst du.
    Hand|Sie hat fünf Finger.
    Fuß|Er steckt im Schuh.
    Auge|Damit siehst du.
    Ohr|Damit hörst du.
    Nase|Damit riechst du.
    Mund|Damit isst und sprichst du.
    Zahn|Du putzt ihn morgens und abends.
    Finger|An jeder Hand hast du fünf davon.
    Knie|Das Gelenk in der Mitte des Beins.
    Bauch|Dort landet dein Essen.
    Haar|Es wächst auf dem Kopf. Man kann es kämmen.
    Hals|Er verbindet den Kopf mit dem Körper.
    Schulter|Dort fängt der Arm an.
    Ellbogen|Das Gelenk in der Mitte des Arms.
    Rücken|Die hintere Seite deines Körpers.
    Zehe|Davon hast du zehn an den Füßen.
    Stirn|Sie ist über den Augen.
    Kinn|Es ist ganz unten am Gesicht.
    Zunge|Damit schmeckst du.
    Herz|Es pumpt das Blut durch den Körper.
    Lunge|Damit atmest du.
    Magen|Dort wird dein Essen verdaut.
    Knochen|Viele davon bilden das Skelett.
    Haut|Sie bedeckt den ganzen Körper.
    Gehirn|Damit denkst du.
    Wimper|Kleines Haar am Rand des Augenlids.
    Hose|Sie hat zwei Beine.
    Jacke|Man zieht sie an, wenn es draußen kalt ist.
    Mütze|Sie wärmt den Kopf im Winter.
    Schal|Er wärmt den Hals.
    Schuh|Man trägt ihn am Fuß.
    Socke|Sie steckt im Schuh.
    Kleid|Mädchen und Frauen tragen es. Oberteil und Rock sind in einem Stück.
    Rock|Er wird um den Bauch getragen und hat keine Hosenbeine.
    Hemd|Es hat Knöpfe und einen Kragen.
    Pulli|Ein warmes Oberteil, das man über den Kopf zieht.
    Handschuh|Er wärmt die Hände.
    Stiefel|Ein hoher Schuh.
    Gürtel|Er hält die Hose fest.
    Schlafanzug|Den ziehst du zum Schlafen an.
    Badehose|Die trägt man im Schwimmbad.
    Hut|Er wird auf dem Kopf getragen und hat eine Krempe.
    Brille|Mit ihr kann man besser sehen.
    Knopf|Damit macht man die Jacke zu.
    Rucksack|Man trägt ihn auf dem Rücken.
    Auto|Es hat vier Räder und fährt auf der Straße.
    Bus|Viele Menschen fahren mit ihm. Er hält an der Haltestelle.
    Zug|Er fährt auf Schienen.
    Fahrrad|Es hat zwei Räder und Pedale.
    Roller|Man stellt einen Fuß darauf und stößt sich mit dem anderen ab.
    Schiff|Es fährt auf dem Meer.
    Boot|Ein kleines Fahrzeug auf dem Wasser.
    Flugzeug|Es fliegt hoch in der Luft.
    Traktor|Der Bauer fährt damit aufs Feld.
    Ampel|Sie ist rot, gelb oder grün.
    Straße|Darauf fahren die Autos.
    Brücke|Sie führt über einen Fluss.
    Helm|Er schützt den Kopf beim Radfahren.
    Lastwagen|Ein großes Auto, das schwere Sachen transportiert.
    Motorrad|Es hat zwei Räder und einen Motor.
    Krankenwagen|Er bringt kranke Menschen ins Krankenhaus.
    Straßenbahn|Sie fährt auf Schienen mitten durch die Stadt.
    Hubschrauber|Er fliegt mit Rotoren und kann in der Luft stehen bleiben.
    Rakete|Sie fliegt ins Weltall.
    Kreuzung|Hier treffen sich zwei Straßen.
    Zebrastreifen|Hier gehen Fußgänger über die Straße.
    Gehweg|Hier gehen die Fußgänger.
    Haltestelle|Hier steigst du in den Bus ein.
    Bahnhof|Hier halten die Züge.
    Tankstelle|Hier bekommt das Auto Benzin.
    Reifen|Er ist rund, aus Gummi und voller Luft.
    Klingel|Damit warnst du andere auf dem Fahrrad.
    Bremse|Damit hältst du das Fahrrad an.
    Baum|Er hat einen Stamm, Äste und Blätter.
    Blume|Sie blüht bunt und duftet.
    Wiese|Eine große Fläche mit Gras und Blumen.
    Wald|Hier stehen viele Bäume.
    Berg|Er ist sehr hoch. Man kann ihn hinaufwandern.
    See|Ein großes Wasser, umgeben von Land.
    Fluss|Fließendes Wasser, das ins Meer strömt.
    Wolke|Sie schwebt am Himmel. Aus ihr kann es regnen.
    Sonne|Sie scheint am Tag hell und warm.
    Stern|Er leuchtet nachts am Himmel.
    Mond|Er leuchtet nachts am Himmel und ist manchmal rund.
    Schneemann|Ihn bauen Kinder im Winter aus Schnee.
    Pilz|Er wächst im Wald und hat einen Hut.
    Stein|Er ist hart und liegt am Boden.
    Tür|Sie führt in ein Zimmer.
    Fenster|Durch das Glas kann man nach draußen schauen.
    Bett|Darin schläfst du.
    Lampe|Sie macht Licht.
    Schrank|Darin hängen deine Kleider.
    Sofa|Darauf sitzt man gemütlich im Wohnzimmer.
    Küche|Hier wird gekocht.
    Treppe|Mit ihr gehst du nach oben.
    Teller|Darauf liegt dein Essen.
    Tasse|Daraus trinkt man Tee oder Kakao.
    Löffel|Damit isst du Suppe.
    Gabel|Damit spießt du dein Essen auf.
    Kissen|Darauf liegt dein Kopf im Bett.
    Uhr|Sie zeigt dir die Zeit.
    Dach|Es ist ganz oben auf dem Haus.
    Keller|Der Raum ganz unten im Haus.
    Spiegel|Darin siehst du dich selbst.
    Ofen|Darin backt man Kuchen.
    Topf|Darin kocht man Nudeln.
    Messer|Damit schneidest du Brot.
    Glas|Daraus trinkst du Wasser.
    Schlüssel|Damit schließt du die Tür auf.
    Heizung|Sie macht das Zimmer warm.
    Feuer|Es ist heiß, brennt und gibt Licht.
    Leiter|Damit kommt man nach oben.
    Schlauch|Durch ihn fließt das Löschwasser.
    Sirene|Sie heult laut, damit alle Platz machen.
    Feuerlöscher|Ein Gerät, mit dem man kleine Brände löscht.
    Rauch|Er steigt auf, wenn etwas brennt.
    Notruf|Die Nummer 112 ist der …
    Hydrant|Hier holt die Feuerwehr Wasser.
    Uniform|Diese Kleidung tragen Polizisten und Feuerwehrleute.
    Blaulicht|Es blinkt auf dem Dach von Feuerwehr und Polizei.
    Rauchmelder|Er piept laut, wenn es in der Wohnung raucht.
    Eiche|Ein Laubbaum mit gelappten Blättern. Wildschweine fressen gern seine Früchte.
    Tanne|Ein Nadelbaum, der oft Weihnachtsbaum wird.
    Kastanie|Eine braune, glänzende Frucht mit stacheliger Hülle.
    Eichel|Die Frucht der Eiche.
    Zapfen|Daran hängen die Samen von Nadelbäumen.
    Rinde|Sie schützt den Stamm des Baumes.
    Ast|Daran wachsen die Zweige und Blätter.
    Wurzel|Damit hält sich der Baum in der Erde fest.
    Stamm|Der dicke Teil des Baumes zwischen Wurzel und Krone.
    Laub|Im Herbst fällt es von den Bäumen.
    Moos|Es wächst grün und weich auf dem Waldboden.
    Reh|Ein scheues Waldtier. Sein Junges heißt Kitz.
    Hirsch|Er hat ein großes Geweih.
    Wildschwein|Es lebt im Wald und wühlt mit der Schnauze im Boden.
    Specht|Dieser Vogel klopft Löcher in die Bäume.
    Eichhörnchen|Es sammelt Nüsse und hat einen buschigen Schwanz.
    Dachs|Ein Waldtier mit schwarz-weißem Kopf. Es wohnt in einem Bau.
    Förster|Er kümmert sich um den Wald.
    Bauer|Er hat Kühe, Hühner und Felder und fährt Traktor.
    Stall|Darin schlafen Kühe und Pferde.
    Scheune|Darin lagert der Bauer Heu und Stroh.
    Huhn|Es legt Eier.
    Hahn|Er kräht am Morgen.
    Küken|Ein junges Huhn, gelb und flauschig.
    Kalb|Das Junge der Kuh.
    Ferkel|Das Junge vom Schwein.
    Gans|Ein großer weißer Vogel, der schnattert.
    Esel|Er hat lange Ohren und schreit „I-A“.
    Heu|Getrocknetes Gras als Futter für Tiere.
    Stroh|Trockene Halme vom Getreide.
    Feld|Darauf wächst Getreide.
    Zaun|Er steht um eine Weide oder einen Garten.
    Weizen|Aus diesem Getreide macht man Mehl.
    Milch|Die Kuh gibt sie. Sie ist weiß.
    Arzt|Zu ihm gehst du, wenn du krank bist.
    Bäcker|Er backt Brot und Semmeln.
    Koch|Er bereitet im Restaurant das Essen zu.
    Lehrer|Er unterrichtet in der Schule.
    Polizist|Er sorgt für Sicherheit und regelt den Verkehr.
    Pilot|Er fliegt das Flugzeug.
    Maler|Er streicht die Wände an.
    Gärtner|Er kümmert sich um Pflanzen und Blumen.
    Tischler|Er baut Möbel aus Holz.
    Friseurin|Sie schneidet Haare.
    Busfahrer|Er fährt den Bus.
    Tierärztin|Sie hilft kranken Tieren.
    Postbotin|Sie bringt Briefe und Pakete.
    Mechaniker|Er repariert Autos.
    Mutter|Ein anderes Wort für Mama.
    Vater|Ein anderes Wort für Papa.
    Bruder|Ein Junge mit denselben Eltern wie du.
    Schwester|Ein Mädchen mit denselben Eltern wie du.
    Oma|Die Mutter von Mama oder Papa.
    Opa|Der Vater von Mama oder Papa.
    Baby|Ein ganz kleines Kind.
    Tante|Die Schwester von Mama oder Papa.
    Onkel|Der Bruder von Mama oder Papa.
    Nachbar|Er wohnt nebenan.
    Eltern|Mama und Papa zusammen.
    Regen|Wasser, das aus den Wolken fällt.
    Schnee|Im Winter fällt er weiß vom Himmel.
    Wind|Er bläst und lässt die Blätter tanzen.
    Sturm|Ein sehr starker Wind.
    Gewitter|Dabei blitzt und donnert es.
    Blitz|Ein heller Strahl am Himmel bei Gewitter.
    Donner|Das laute Krachen nach dem Blitz.
    Nebel|Dabei kann man kaum etwas sehen.
    Hagel|Kleine Eiskörner, die vom Himmel fallen.
    Frost|Wenn es so kalt ist, dass Wasser gefriert.
    Regenbogen|Er leuchtet bunt am Himmel, wenn Sonne und Regen zusammenkommen.
    Schirm|Er schützt dich vor dem Regen.
    Pfütze|Nach dem Regen springst du hinein.
    Thermometer|Damit misst man die Temperatur.
    Schneeflocke|Ein kleiner Stern aus Eis.
    Frühling|In dieser Jahreszeit blühen die ersten Blumen.
    Sommer|Die heißeste Jahreszeit.
    Herbst|In dieser Jahreszeit fallen die Blätter.
    Winter|Die kälteste Jahreszeit.
    Ostern|An diesem Fest sucht man bunte Eier.
    Weihnachten|An diesem Fest steht ein geschmückter Baum im Zimmer.
    Geburtstag|An diesem Tag wirst du ein Jahr älter.
    Fasching|An diesen Tagen verkleiden sich die Kinder.
    Advent|Die Zeit vor Weihnachten mit vier Kerzen am Kranz.
    Kerze|Sie hat einen Docht und brennt.
    Geschenk|Man bekommt es zum Geburtstag.
    Torte|Ein großer Kuchen mit Sahne oder Creme.
    Ballon|Man bläst ihn auf.
    Laterne|Sie leuchtet beim Martinsumzug.
    Drachen|Er steigt im Herbst am Wind in die Luft.
    Kürbis|Ein großes orangefarbenes Gemüse im Herbst.
    Schlitten|Damit fährst du im Schnee den Berg hinunter.
    Kalender|Darauf siehst du alle Tage des Jahres.
    Ball|Er ist rund und rollt.
    Tor|Beim Fußball muss der Ball hinein.
    Schläger|Damit schlägt man beim Tennis den Ball.
    Netz|Es hängt im Tor oder zwischen den Spielern beim Tennis.
    Seil|Darüber springt man in der Pause.
    Turnhalle|Hier hast du Sportunterricht.
    Schwimmbad|Hier kannst du schwimmen.
    Schlittschuh|Damit läuft man auf dem Eis.
    Puppe|Ein Spielzeug, das wie ein Mensch aussieht.
    Teddy|Ein weicher Bär zum Kuscheln.
    Würfel|Er hat sechs Seiten mit Punkten.
    Puzzle|Viele Teile ergeben zusammen ein Bild.
    Kreisel|Ein Spielzeug, das sich schnell dreht.
    Rutsche|Auf dem Spielplatz rutschst du darauf hinunter.
    Schaukel|Darauf schwingst du hin und her.
    Medaille|Die bekommt man als Gewinner umgehängt.
    Pokal|Ein Becher aus Metall für die Sieger.
    Gitarre|Ein Instrument mit sechs Saiten.
    Klavier|Ein Instrument mit schwarzen und weißen Tasten.
    Flöte|Ein Instrument, in das man hineinbläst.
    Trommel|Man schlägt mit Stöcken darauf.
    Geige|Ein Instrument mit Saiten, das man mit einem Bogen spielt.
    Trompete|Ein glänzendes Blasinstrument aus Blech.
    Lied|Man singt es.
    Glocke|Sie hängt im Kirchturm und läutet.
    Rassel|Man schüttelt sie, dann macht sie Geräusche.
    Harfe|Ein großes Instrument mit vielen Saiten.
    Meer|Ein riesiges Wasser mit Salz.
    Strand|Hier liegt man im Sand am Meer.
    Welle|Sie rollt am Meer an den Strand.
    Muschel|Man findet sie am Strand. Sie hat eine harte Schale.
    Sand|Daraus baust du eine Burg am Strand.
    Insel|Land, das ganz von Wasser umgeben ist.
    Hafen|Hier legen die Schiffe an.
    Leuchtturm|Ein hoher Turm am Meer mit hellem Licht für die Schiffe.
    Möwe|Ein Vogel am Meer.
    Krabbe|Ein Meerestier mit Scheren, das seitwärts läuft.
    Qualle|Ein durchsichtiges Meerestier ohne Knochen.
    Seestern|Ein Meerestier, das wie ein Stern aussieht.
    Robbe|Ein Meerestier, das auf dem Eis liegt und gut schwimmt.
    Kapitän|Er steuert das Schiff.
    Anker|Damit bleibt ein Schiff an seinem Platz.
    Bach|Ein kleines, fließendes Wasser.
    Teich|Ein kleiner See, oft mit Fröschen.
    Garten|Hier wachsen Blumen und Gemüse ums Haus.
    Rose|Eine duftende Blume mit Dornen.
    Tulpe|Eine Frühlingsblume. Viele kommen aus Holland.
    Sonnenblume|Eine sehr große, gelbe Blume.
    Gänseblümchen|Eine kleine weiße Blume mit gelber Mitte auf der Wiese.
    Löwenzahn|Seine Blüte wird zur Pusteblume.
    Gras|Es ist grün und wächst auf der Wiese.
    Beet|Hier pflanzt man Blumen oder Gemüse.
    Samen|Daraus wächst eine neue Pflanze.
    Knospe|Daraus öffnet sich bald eine Blüte.
    Gießkanne|Damit gießt man die Blumen.
    Schaufel|Damit gräbt man Löcher in die Erde.
    Eimer|Darin trägt man Wasser oder Sand.
    Regenwurm|Er lebt in der Erde und kommt bei Regen heraus.
    Hecke|Viele Sträucher in einer Reihe.
    Kaktus|Eine Pflanze mit Stacheln.`).forEach(l => { const i = l.indexOf('|'); CL[l.slice(0, i)] = l.slice(i + 1); });
  P.CLUES = CL;

  /* ---------- Lückensätze ergänzen: Satz mit [Lücke] ---------- */
  const addSent = (key, name, s) => { if (!P.SENTENCES[key]) P.SENTENCES[key] = { name, list: [] }; const have = new Set(P.SENTENCES[key].list); lines(s).forEach(x => { if (!have.has(x)) { have.add(x); P.SENTENCES[key].list.push(x); } }); };
  addSent('tiere', 'Tiere', `Der Hase frisst gern [Möhren].
    Die Kuh steht auf der [Weide].
    Die Maus hat einen langen [Schwanz].
    Der Bär hat ein dickes [Fell].
    Die Raupe wird zu einem [Schmetterling].
    Der Fisch lebt im [Wasser].
    Das Pferd steht im [Stall].
    Die Ameisen bauen einen großen [Haufen].`);
  addSent('feuerwehr', 'Feuerwehr', `Das Feuerwehrauto hat eine lange [Leiter].
    Die Feuerwehrleute tragen einen [Helm].
    Mit dem [Schlauch] löschen sie das Feuer.
    Wenn es brennt, heult die [Sirene].
    Der [Rauchmelder] piept, wenn es in der Wohnung raucht.
    Die Feuerwehr rettet auch [Tiere] aus Not.`);
  addSent('wald', 'Wald und Bäume', `Im Herbst fällt das [Laub] von den Bäumen.
    Das [Reh] lebt im Wald.
    Der Specht klopft mit seinem [Schnabel] an den Baum.
    Auf dem Waldboden wächst weiches [Moos].
    Die Tanne hat spitze [Nadeln].
    Der [Förster] kümmert sich um den Wald.`);
  addSent('koerper', 'Körper und Gesundheit', `Mit den [Ohren] hören wir.
    Mit der [Nase] riechen wir.
    Mit der [Zunge] schmecken wir.
    Zweimal am Tag putzen wir die [Zähne].
    Vor dem Essen waschen wir die [Hände].
    Das [Herz] pumpt das Blut durch den Körper.
    Wenn wir krank sind, gehen wir zum [Arzt].`);
  addSent('verkehr', 'Verkehr', `Beim Radfahren trage ich einen [Helm].
    Am [Zebrastreifen] gehen wir über die Straße.
    Bei Grün dürfen wir [gehen].
    Der Bus hält an der [Haltestelle].
    Der Zug fährt auf [Schienen].
    Mit der [Klingel] warne ich andere.`);
  addSent('essen', 'Essen und Trinken', `Die Banane ist [gelb].
    Aus Milch macht man [Käse].
    Der Bäcker backt frisches [Brot].
    Die Zitrone schmeckt [sauer].
    Im Sommer essen wir gern [Erdbeeren].
    Zum Trinken nehme ich am liebsten [Wasser].`);
  addSent('sport', 'Sport und Freizeit', `Im [Schwimmbad] springen wir ins Wasser.
    Beim Fußball muss der Ball ins [Tor].
    In der Pause springen wir [Seil].
    Auf dem Spielplatz gibt es eine hohe [Rutsche].
    Im Winter laufen wir [Schlittschuh].
    Die Siegerin bekommt eine [Medaille].`);
  addSent('zeit', 'Zeit und Kalender', `Ein Jahr hat zwölf [Monate].
    Ein Tag hat vierundzwanzig [Stunden].
    Eine Stunde hat sechzig [Minuten].
    Nach dem Montag kommt der [Dienstag].
    Der letzte Monat im Jahr heißt [Dezember].
    Am Morgen geht die [Sonne] auf.`);
  addSent('bauernhof', 'Bauernhof', `Die [Kuh] gibt Milch.
    Das [Huhn] legt Eier.
    Am Morgen kräht der [Hahn].
    Der Bauer fährt mit dem [Traktor] aufs Feld.
    Im Winter fressen die Kühe [Heu].
    Das Junge der Kuh heißt [Kalb].
    Das Junge vom Schwein heißt [Ferkel].
    In der [Scheune] liegt das Stroh.`);
  addSent('meer', 'Meer und Wasser', `Am [Strand] bauen wir eine Sandburg.
    Das Wasser im Meer schmeckt [salzig].
    Die [Möwe] fliegt über das Meer.
    Am Strand finden wir schöne [Muscheln].
    Der [Leuchtturm] zeigt den Schiffen den Weg.
    Die Krabbe hat zwei [Scheren].`);
  addSent('garten', 'Garten und Pflanzen', `Mit der [Gießkanne] gießen wir die Blumen.
    Aus dem [Samen] wächst eine neue Pflanze.
    Die Rose hat spitze [Dornen].
    Die Sonnenblume wird sehr [groß].
    Der [Regenwurm] lockert die Erde.
    Im Frühling blühen die [Tulpen].`);
  addSent('berufe', 'Berufe', `Der [Bäcker] backt Brot und Semmeln.
    Die [Ärztin] hilft kranken Menschen.
    Der [Koch] arbeitet in der Küche.
    Die [Friseurin] schneidet Haare.
    Der [Pilot] fliegt das Flugzeug.
    Die [Tierärztin] hilft kranken Tieren.`);
  addSent('schule', 'Schule', `Mit dem [Bleistift] schreibe ich ins Heft.
    Mit dem [Radiergummi] mache ich Fehler weg.
    In der Pause spielen wir auf dem [Schulhof].
    Auf dem [Globus] sehen wir die ganze Erde.`);

  /* ---------- Richtig oder falsch: Sachwissen. Thema|r oder f|Aussage ---------- */
  const TF = {};
  const TFN = { tiere: 'Tiere', koerper: 'Körper und Gesundheit', pflanzen: 'Pflanzen und Wald', jahr: 'Jahreszeiten und Wetter', verkehr: 'Verkehr', erde: 'Erde und Weltall', bayern: 'Bayern', zeit: 'Zeit und Kalender', wasser: 'Wasser' };
  lines(`tiere|r|Der Igel hält im Winter Winterschlaf.
    tiere|f|Der Pinguin kann gut fliegen.
    tiere|r|Die Spinne hat acht Beine.
    tiere|f|Ein Käfer hat acht Beine.
    tiere|r|Insekten haben sechs Beine.
    tiere|r|Die Biene sammelt Nektar.
    tiere|f|Der Wal ist ein Fisch.
    tiere|r|Der Wal ist ein Säugetier.
    tiere|r|Aus einer Raupe wird ein Schmetterling.
    tiere|f|Aus einer Kaulquappe wird ein Fisch.
    tiere|r|Aus einer Kaulquappe wird ein Frosch.
    tiere|r|Die Kuh frisst Gras.
    tiere|f|Die Kuh frisst Fleisch.
    tiere|r|Die Eule jagt in der Nacht.
    tiere|r|Das Eichhörnchen sammelt Vorräte für den Winter.
    tiere|f|Die Schnecke hat sechs Beine.
    tiere|r|Fische atmen mit Kiemen.
    tiere|r|Die Fledermaus ist ein Säugetier.
    tiere|f|Die Fledermaus ist ein Vogel.
    tiere|r|Das Junge der Kuh heißt Kalb.
    tiere|f|Das Junge vom Pferd heißt Ferkel.
    tiere|r|Das Junge vom Pferd heißt Fohlen.
    tiere|r|Störche fliegen im Herbst in den Süden.
    tiere|f|Der Regenwurm lebt im Wasser.
    tiere|r|Der Maulwurf gräbt Gänge unter der Erde.
    tiere|f|Hühner geben Milch.
    tiere|r|Der Specht klopft Löcher in Baumstämme.
    tiere|r|Säugetiere säugen ihre Jungen mit Milch.
    koerper|r|Mit den Ohren hören wir.
    koerper|f|Mit der Nase sehen wir.
    koerper|r|Das Herz pumpt das Blut durch den Körper.
    koerper|r|Mit der Lunge atmen wir.
    koerper|f|Ein Kind hat 32 Milchzähne.
    koerper|r|Ein Kind hat 20 Milchzähne.
    koerper|r|Wir sollen zweimal am Tag die Zähne putzen.
    koerper|f|Süßigkeiten sind gut für die Zähne.
    koerper|r|An jeder Hand haben wir fünf Finger.
    koerper|r|Das Skelett besteht aus Knochen.
    koerper|f|Die Zunge ist ein Knochen.
    koerper|r|Wir haben fünf Sinne: sehen, hören, riechen, schmecken und tasten.
    koerper|r|Wasser ist ein gutes Getränk für den Durst.
    koerper|f|Wer viel Sport macht, braucht keinen Schlaf.
    pflanzen|r|Pflanzen brauchen Licht und Wasser.
    pflanzen|f|Die Tanne verliert im Herbst ihre Nadeln.
    pflanzen|r|Die Lärche verliert im Herbst ihre Nadeln.
    pflanzen|r|Die Eiche trägt Eicheln.
    pflanzen|f|Die Buche trägt Kastanien.
    pflanzen|r|Mit den Wurzeln nimmt die Pflanze Wasser auf.
    pflanzen|r|Der Löwenzahn wird zur Pusteblume.
    pflanzen|f|Kartoffeln wachsen an Bäumen.
    pflanzen|r|Kartoffeln wachsen unter der Erde.
    pflanzen|r|Aus einem Samen kann eine neue Pflanze wachsen.
    pflanzen|f|Pilze sind Tiere.
    pflanzen|r|Im Frühling blühen viele Bäume.
    pflanzen|f|Die Rinde ist innen im Baumstamm.
    jahr|r|Es gibt vier Jahreszeiten.
    jahr|f|Der Sommer ist die kälteste Jahreszeit.
    jahr|r|Im Herbst fallen die Blätter von den Laubbäumen.
    jahr|r|Der Frühling beginnt im März.
    jahr|f|Der Winter beginnt im Juli.
    jahr|r|Nach dem Blitz hört man den Donner.
    jahr|f|Schnee ist warm.
    jahr|r|Bei Frost gefriert Wasser zu Eis.
    jahr|r|Einen Regenbogen sieht man, wenn die Sonne scheint und es gleichzeitig regnet.
    jahr|f|Einen Regenbogen sieht man nur in der Nacht.
    jahr|r|Ein Thermometer misst die Temperatur.
    verkehr|r|Bei Rot bleiben wir an der Ampel stehen.
    verkehr|f|Bei Rot dürfen Fußgänger über die Straße gehen.
    verkehr|r|Beim Radfahren schützt ein Helm den Kopf.
    verkehr|r|Am Zebrastreifen dürfen Fußgänger die Straße überqueren.
    verkehr|f|Ein Fahrrad braucht keine Bremsen.
    verkehr|r|Ein verkehrssicheres Fahrrad hat eine Klingel.
    verkehr|r|Bevor wir über die Straße gehen, schauen wir links, rechts und noch einmal links.
    verkehr|f|Beim Spielen darf man auf die Straße laufen.
    verkehr|r|Helle Kleidung hilft, im Dunkeln gesehen zu werden.
    erde|r|Die Erde ist eine Kugel.
    erde|r|Die Erde dreht sich um die Sonne.
    erde|f|Die Sonne dreht sich um die Erde.
    erde|r|Der Mond kreist um die Erde.
    erde|f|Der Mond ist größer als die Erde.
    erde|r|Die Sonne ist ein Stern.
    erde|f|Die Sonne geht im Westen auf.
    erde|r|Die Sonne geht im Osten auf.
    erde|r|Ein Tag hat 24 Stunden.
    erde|r|Auf der Erde gibt es mehr Wasser als Land.
    bayern|r|München ist die Landeshauptstadt von Bayern.
    bayern|f|Nürnberg ist die Landeshauptstadt von Bayern.
    bayern|r|Bayern hat sieben Regierungsbezirke.
    bayern|r|Die Zugspitze ist der höchste Berg Deutschlands.
    bayern|r|Die Donau fließt durch Bayern.
    bayern|f|Bayern liegt am Meer.
    bayern|r|Die Landesfarben von Bayern sind Weiß und Blau.
    bayern|f|Die Landesfarben von Bayern sind Rot und Grün.
    zeit|r|Eine Woche hat sieben Tage.
    zeit|f|Ein Jahr hat zehn Monate.
    zeit|r|Ein Jahr hat zwölf Monate.
    zeit|r|Eine Stunde hat 60 Minuten.
    zeit|f|Eine Minute hat 100 Sekunden.
    zeit|r|Eine Minute hat 60 Sekunden.
    zeit|r|Der Februar ist der kürzeste Monat.
    zeit|f|Der Mittwoch kommt vor dem Dienstag.
    zeit|r|Auf den Samstag folgt der Sonntag.
    zeit|r|Der erste Monat des Jahres ist der Januar.
    wasser|r|Wasser gefriert bei 0 Grad Celsius.
    wasser|f|Wasser kocht bei 50 Grad Celsius.
    wasser|r|Wasser kocht bei 100 Grad Celsius.
    wasser|r|Wenn Wasser verdunstet, wird es zu Wasserdampf.
    wasser|r|Aus Wolken kann Regen oder Schnee fallen.
    wasser|f|Eis ist schwerer als Wasser und geht unter.
    wasser|r|Eis schwimmt auf dem Wasser.
    wasser|r|Das Wasser im Meer ist salzig.
    wasser|f|Das Wasser im Meer kann man gut trinken.
    wasser|r|Wasser sparen hilft der Umwelt.`).forEach(l => { const [k, rf, t] = l.split('|'); (TF[k] = TF[k] || { name: TFN[k] || k, list: [] }).list.push({ t, ok: rf === 'r' }); });
  P.TF = TF;

  /* ---------- Sachtexte mit Fragen: Frage|Musterantwort ---------- */
  const ST = [
    { id: 'igel', stufe: '12', theme: 'tiere', title: 'Der Igel', text: `Der Igel hat viele Stacheln auf dem Rücken.
Am Tag schläft er. In der Nacht sucht er Futter.
Er frisst Käfer, Würmer und Schnecken.
Wenn Gefahr droht, rollt er sich zu einer Kugel zusammen.
Im Winter hält der Igel Winterschlaf.`, q: `Was hat der Igel auf dem Rücken?|Er hat viele Stacheln.
Wann sucht der Igel Futter?|In der Nacht.
Was frisst der Igel?|Käfer, Würmer und Schnecken.
Was macht der Igel bei Gefahr?|Er rollt sich zu einer Kugel zusammen.` },
    { id: 'biene', stufe: '12', theme: 'tiere', title: 'Die Biene', text: `Bienen leben in einem großen Volk zusammen.
Jedes Volk hat eine Königin. Sie legt die Eier.
Die Arbeiterinnen fliegen von Blüte zu Blüte.
Sie sammeln Nektar und Blütenstaub.
Aus dem Nektar machen die Bienen Honig.`, q: `Wer legt die Eier?|Die Königin.
Was sammeln die Arbeiterinnen?|Nektar und Blütenstaub.
Was machen die Bienen aus dem Nektar?|Honig.` },
    { id: 'loewenzahn', stufe: '12', theme: 'pflanzen', title: 'Der Löwenzahn', text: `Der Löwenzahn wächst auf vielen Wiesen.
Seine Blüte ist leuchtend gelb.
Später wird aus der Blüte eine Pusteblume.
An jedem Samen hängt ein kleiner Schirm.
Der Wind trägt die Samen weit fort.
Seine Blätter sind gezackt wie die Zähne eines Löwen.`, q: `Welche Farbe hat die Blüte?|Sie ist gelb.
Was wird aus der Blüte?|Eine Pusteblume.
Wer trägt die Samen fort?|Der Wind.
Woher hat der Löwenzahn seinen Namen?|Seine Blätter sind gezackt wie Löwenzähne.` },
    { id: 'pinguin', stufe: '12', theme: 'tiere', title: 'Der Pinguin', text: `Der Pinguin ist ein Vogel.
Er kann nicht fliegen, aber sehr gut schwimmen.
Seine Flügel sind wie Flossen.
Pinguine fressen Fische und kleine Krebse.
Die meisten Pinguine leben im Süden der Erde.
Der größte Pinguin ist der Kaiserpinguin.`, q: `Kann der Pinguin fliegen?|Nein, aber er schwimmt sehr gut.
Wie sehen seine Flügel aus?|Wie Flossen.
Was fressen Pinguine?|Fische und kleine Krebse.
Wie heißt der größte Pinguin?|Kaiserpinguin.` },
    { id: 'eichhoernchen', stufe: '12', theme: 'tiere', title: 'Das Eichhörnchen', text: `Das Eichhörnchen hat einen buschigen Schwanz.
Es klettert schnell auf die Bäume.
Im Herbst sammelt es Nüsse und Samen.
Es versteckt sie in der Erde.
Sein Nest heißt Kobel.
Im Winter ruht es viel, aber es hält keinen Winterschlaf.`, q: `Was sammelt das Eichhörnchen im Herbst?|Nüsse und Samen.
Wo versteckt es sein Futter?|In der Erde.
Wie heißt sein Nest?|Kobel.` },
    { id: 'regenwurm', stufe: '12', theme: 'tiere', title: 'Der Regenwurm', text: `Der Regenwurm lebt in der Erde.
Er hat keine Augen und keine Beine.
Er frisst alte Blätter und Pflanzenreste.
Dabei lockert er die Erde.
Das ist gut für die Pflanzen.
Bei Regen kommt er oft aus der Erde heraus.`, q: `Wo lebt der Regenwurm?|In der Erde.
Was frisst der Regenwurm?|Alte Blätter und Pflanzenreste.
Warum ist der Regenwurm gut für die Pflanzen?|Er lockert die Erde.` },
    { id: 'zaehne', stufe: '12', theme: 'koerper', title: 'Unsere Zähne', text: `Kinder haben zwanzig Milchzähne.
Ab etwa sechs Jahren fallen die Milchzähne aus.
Dann wachsen die bleibenden Zähne.
Wir putzen die Zähne morgens und abends.
Zu viel Zucker ist schlecht für die Zähne.
Einmal im Jahr gehen wir zur Zahnärztin.`, q: `Wie viele Milchzähne haben Kinder?|Zwanzig.
Wann putzen wir die Zähne?|Morgens und abends.
Was ist schlecht für die Zähne?|Zu viel Zucker.` },
    { id: 'feuerwehr', stufe: '12', theme: 'feuerwehr', title: 'Die Feuerwehr', text: `Wenn es brennt, rufen wir die Feuerwehr.
Die Nummer ist 112.
Die Feuerwehr kommt schnell mit Blaulicht und Sirene.
Sie löscht das Feuer mit Wasser.
Sie hilft auch bei Unfällen und rettet Tiere.
In vielen Orten arbeiten die Feuerwehrleute freiwillig.`, q: `Welche Nummer hat der Notruf?|112.
Womit löscht die Feuerwehr das Feuer?|Mit Wasser.
Wobei hilft die Feuerwehr noch?|Bei Unfällen, sie rettet Tiere.` },
    { id: 'fledermaus', stufe: '34', theme: 'tiere', title: 'Die Fledermaus', text: `Fledermäuse sind die einzigen Säugetiere, die richtig fliegen können. Ihre Flügel bestehen aus einer dünnen Haut, die zwischen den langen Fingern gespannt ist.
Am Tag schlafen sie kopfüber hängend in Höhlen, Dachböden oder Baumhöhlen. In der Dämmerung gehen sie auf Jagd. Unsere Fledermäuse fressen Insekten, zum Beispiel Mücken und Nachtfalter.
Im Dunkeln finden sie sich mit ihren Ohren zurecht: Sie stoßen sehr hohe Rufe aus, die wir nicht hören können. Das Echo verrät ihnen, wo ein Hindernis oder ein Insekt ist.
Im Winter gibt es kaum Insekten. Deshalb halten Fledermäuse Winterschlaf. Alle Fledermäuse in Deutschland stehen unter Schutz.`, q: `Woraus bestehen die Flügel der Fledermaus?|Aus einer dünnen Haut zwischen den langen Fingern.
Wo schlafen Fledermäuse am Tag?|Kopfüber hängend in Höhlen, Dachböden oder Baumhöhlen.
Wie finden sich Fledermäuse im Dunkeln zurecht?|Sie stoßen hohe Rufe aus und hören das Echo.
Warum halten Fledermäuse Winterschlaf?|Im Winter gibt es kaum Insekten als Futter.` },
    { id: 'wasserkreislauf', stufe: '34', theme: 'wasser', title: 'Der Kreislauf des Wassers', text: `Die Sonne erwärmt das Wasser in Meeren, Seen und Flüssen. Dabei verdunstet ein Teil des Wassers. Es wird zu unsichtbarem Wasserdampf und steigt mit der warmen Luft nach oben.
Hoch oben ist es kalt. Der Wasserdampf kühlt ab und es bilden sich winzige Tröpfchen. Viele Tröpfchen zusammen sehen wir als Wolke.
Werden die Tropfen zu schwer, fallen sie als Regen auf die Erde. Ist es sehr kalt, fällt Schnee oder Hagel.
Ein Teil des Wassers versickert im Boden und wird zu Grundwasser. Der Rest fließt über Bäche und Flüsse zurück ins Meer. Dann beginnt alles von vorn.`, q: `Was passiert, wenn die Sonne das Wasser erwärmt?|Ein Teil verdunstet und wird zu Wasserdampf.
Wie entsteht eine Wolke?|Der Wasserdampf kühlt oben ab und bildet viele winzige Tröpfchen.
Wann fällt Regen?|Wenn die Tropfen in der Wolke zu schwer werden.
Wohin fließt das Wasser am Ende zurück?|Über Bäche und Flüsse ins Meer.` },
    { id: 'kartoffel', stufe: '34', theme: 'pflanzen', title: 'Die Kartoffel', text: `Die Kartoffel stammt ursprünglich aus Südamerika. Seefahrer brachten sie vor etwa 450 Jahren nach Europa. Zuerst bewunderte man nur ihre hübschen Blüten.
Heute ist die Kartoffel bei uns ein wichtiges Nahrungsmittel. Im Frühling legt der Bauer Saatkartoffeln in die Erde. Daraus wächst eine grüne Pflanze. Unter der Erde bilden sich an den Wurzeln neue Knollen – das sind die Kartoffeln, die wir essen.
Im Spätsommer und Herbst werden die Kartoffeln geerntet. Die grünen Teile der Pflanze und die Beeren sind giftig. Auch grüne Stellen an der Kartoffel schneidet man weg.`, q: `Woher stammt die Kartoffel?|Aus Südamerika.
Wo wachsen die Kartoffeln, die wir essen?|Unter der Erde an den Wurzeln der Pflanze.
Wann werden Kartoffeln geerntet?|Im Spätsommer und Herbst.
Welche Teile der Pflanze sind giftig?|Die grünen Teile und die Beeren.` },
    { id: 'maulwurf', stufe: '34', theme: 'tiere', title: 'Der Maulwurf', text: `Der Maulwurf lebt fast immer unter der Erde. Mit seinen breiten Vorderpfoten gräbt er lange Gänge. Die Erde schiebt er nach oben. So entstehen die Maulwurfshügel auf der Wiese.
Seine Augen sind sehr klein. Er sieht schlecht, aber er kann sehr gut hören, riechen und tasten. Dabei helfen ihm feine Haare an der Schnauze.
Der Maulwurf frisst vor allem Regenwürmer und Insektenlarven. Er braucht jeden Tag viel Futter. Einen Winterschlaf hält er nicht. Im Winter gräbt er einfach tiefer, wo der Boden nicht gefroren ist.
Der Maulwurf steht unter Naturschutz.`, q: `Womit gräbt der Maulwurf seine Gänge?|Mit seinen breiten Vorderpfoten.
Wie entstehen Maulwurfshügel?|Der Maulwurf schiebt beim Graben die Erde nach oben.
Was frisst der Maulwurf?|Vor allem Regenwürmer und Insektenlarven.
Was macht der Maulwurf im Winter?|Er gräbt tiefer, wo der Boden nicht gefroren ist.` },
    { id: 'zugvoegel', stufe: '34', theme: 'tiere', title: 'Zugvögel', text: `Im Herbst sammeln sich viele Schwalben auf Stromleitungen. Bald fliegen sie fort. Auch der Storch verlässt uns im Spätsommer. Diese Vögel nennt man Zugvögel.
Sie fliegen in den Süden, viele bis nach Afrika. Dort ist es warm und sie finden genug Futter. Bei uns gibt es im Winter kaum Insekten, von denen sich Schwalben und Störche ernähren.
Im Frühling kehren die Zugvögel zurück und bauen ihre Nester. Andere Vögel wie die Amsel oder die Meise bleiben das ganze Jahr bei uns. Man nennt sie Standvögel.`, q: `Warum fliegen Schwalben und Störche im Herbst fort?|Bei uns gibt es im Winter kaum Insekten als Futter.
Wohin fliegen viele Zugvögel?|In den Süden, viele bis nach Afrika.
Wann kommen die Zugvögel zurück?|Im Frühling.
Nenne einen Standvogel.|Amsel oder Meise.` },
    { id: 'wald', stufe: '34', theme: 'pflanzen', title: 'Die Stockwerke des Waldes', text: `Ein Wald ist wie ein Haus mit mehreren Stockwerken.
Ganz unten liegt die Moosschicht. Dort wachsen Moose und Pilze, und viele kleine Tiere wie Käfer und Asseln leben dort.
Darüber folgt die Krautschicht mit Gräsern, Farnen und Blumen.
In der Strauchschicht wachsen Sträucher wie Holunder und Haselnuss. Hier bauen viele Vögel ihre Nester.
Ganz oben ist die Baumschicht mit den Kronen der hohen Bäume. Hier wohnen zum Beispiel Eichhörnchen und Spechte.
Unter der Erde liegt die Wurzelschicht. Dort leben Maulwurf und Regenwurm.`, q: `Wie heißt das unterste Stockwerk über der Erde?|Moosschicht.
Was wächst in der Krautschicht?|Gräser, Farne und Blumen.
Welche Tiere wohnen in der Baumschicht?|Zum Beispiel Eichhörnchen und Spechte.
Wer lebt in der Wurzelschicht?|Maulwurf und Regenwurm.` },
    { id: 'muell', stufe: '34', theme: 'umwelt', title: 'Müll richtig trennen', text: `Jeden Tag entsteht in einer Familie Müll. Damit viele Stoffe wiederverwertet werden können, trennen wir den Müll.
Papier und Pappe kommen in die Papiertonne. Daraus wird neues Papier.
Verpackungen aus Plastik und Metall kommen in den gelben Sack oder die gelbe Tonne. In manchen Orten bringt man sie zum Wertstoffhof.
Glasflaschen und Gläser wirft man in den Glascontainer – nach Farben getrennt: weiß, grün und braun.
Obstschalen, Essensreste und Gartenabfälle gehören in die Biotonne. Daraus kann Erde werden.
Alles andere kommt in den Restmüll. Am besten ist aber Müll, der gar nicht erst entsteht.`, q: `Warum trennen wir den Müll?|Damit viele Stoffe wiederverwertet werden können.
Wohin kommt ein leerer Joghurtbecher?|In den gelben Sack oder die gelbe Tonne (oder zum Wertstoffhof).
Wie wird Glas getrennt?|Nach Farben: weiß, grün und braun.
Was gehört in die Biotonne?|Obstschalen, Essensreste und Gartenabfälle.` },
    { id: 'sonnenblume', stufe: '34', theme: 'pflanzen', title: 'Die Sonnenblume', text: `Die Sonnenblume kann höher werden als ein Erwachsener. Manche Pflanzen sind über zwei Meter groß.
Was wie eine einzige große Blüte aussieht, besteht in Wirklichkeit aus vielen hundert kleinen Blüten. Die gelben Blätter am Rand locken Bienen und Hummeln an.
Junge Sonnenblumen drehen ihren Kopf im Laufe des Tages mit der Sonne. Ist die Blume ausgewachsen, schaut sie meistens nach Osten.
Aus den Blüten werden Kerne. Vögel fressen sie gern, besonders im Winter. Aus den Kernen presst man auch Sonnenblumenöl.`, q: `Wie hoch kann eine Sonnenblume werden?|Über zwei Meter.
Woraus besteht der große Blütenkopf?|Aus vielen hundert kleinen Blüten.
Was machen junge Sonnenblumen im Laufe des Tages?|Sie drehen ihren Kopf mit der Sonne.
Was macht man aus den Kernen?|Sonnenblumenöl; Vögel fressen sie gern.` },
  ];
  P.SACHTEXTE = ST;
  P.SACHTHEMEN = { tiere: 'Tiere', pflanzen: 'Pflanzen und Wald', koerper: 'Körper und Gesundheit', feuerwehr: 'Feuerwehr', wasser: 'Wasser', umwelt: 'Umwelt' };

  /* Wortarten: weitere markierte Sätze */
  const TG = lines(`Der [A:kleine] [N:Hase] [V:hoppelt] über das [N:Feld].
    [N:Lena] [V:spielt] mit ihrem [A:neuen] [N:Ball].
    Die [N:Ente] [V:schwimmt] auf dem [A:stillen] [N:Teich].
    Der [A:dicke] [N:Bär] [V:brummt].
    [N:Opa] [V:liest] eine [A:lustige] [N:Geschichte] vor.
    Die [A:gelbe] [N:Blume] [V:blüht].
    Der [N:Hund] [V:holt] den [A:roten] [N:Stock].
    [N:Jonas] [V:trägt] eine [A:warme] [N:Mütze].
    Die [N:Kinder] [V:bauen] einen [A:großen] [N:Schneemann].
    Der [N:Koch] [V:rührt] die [A:heiße] [N:Suppe].
    Das [A:kleine] [N:Küken] [V:piepst].
    [N:Mama] [V:kauft] [A:frisches] [N:Obst].
    Die [N:Eule] [V:fliegt] durch die [A:dunkle] [N:Nacht].
    Der [N:Fuchs] [V:hat] einen [A:buschigen] [N:Schwanz].
    Im [N:Herbst] [V:fallen] [A:bunte] [N:Blätter].`);
  if (Array.isArray(P.TAGGED)) TG.forEach(x => { if (!P.TAGGED.includes(x)) P.TAGGED.push(x); });

  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.FolivaPools = P;
})(typeof window !== 'undefined' ? window : globalThis);
