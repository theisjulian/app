/* Foliva – Gedichte und Elfchen für den Baustein „Gedicht“ · © 2026 theis
   Nur gemeinfreie Gedichte (Verfasser vor über 70 Jahren gestorben, Erstveröffentlichung vor 1929) in heutiger Rechtschreibung,
   dazu selbst geschriebene kurze Gedichte und Elfchen (ohne Verfasserangabe). Ergänzt FolivaPools, ohne Vorhandenes zu ändern.
   Felder: id, title, author, text (Strophen durch Leerzeile getrennt), theme, stufe ('12' = Klasse 1/2, '34' = Klasse 3/4), elfchen */
(function (root) {
  'use strict';
  const P = root.FolivaPools || (typeof require !== 'undefined' ? require('./pools3.js') : {});

  const GEDICHTTHEMEN = { fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter', weihnachten: 'Weihnachten', tiere: 'Tiere', natur: 'Natur und Wetter', lustig: 'Lustiges', alltag: 'Schule und Freunde' };

  const G = (id, title, author, theme, stufe, text) => ({ id, title, author, theme, stufe, text: text.trim().split('\n').map(l => l.trim()).join('\n') });
  const GEDICHTE = [
    /* ---------- gemeinfrei ---------- */
    G('moerike-er-ists', 'Er ist’s', 'Eduard Mörike', 'fruehling', '34', `
Frühling lässt sein blaues Band
wieder flattern durch die Lüfte;
süße, wohlbekannte Düfte
streifen ahnungsvoll das Land.
Veilchen träumen schon,
wollen balde kommen.
Horch, von fern ein leiser Harfenton!
Frühling, ja du bist’s!
Dich hab ich vernommen!`),
    G('fallersleben-voegel', 'Alle Vögel sind schon da', 'Hoffmann von Fallersleben', 'fruehling', '12', `
Alle Vögel sind schon da,
alle Vögel, alle!
Welch ein Singen, Musiziern,
Pfeifen, Zwitschern, Tireliern!
Frühling will nun einmarschiern,
kommt mit Sang und Schalle.`),
    G('fallersleben-winter-ade', 'Winter ade', 'Hoffmann von Fallersleben', 'winter', '12', `
Winter ade!
Scheiden tut weh.
Aber dein Scheiden macht,
dass mir das Herze lacht.
Winter ade!
Scheiden tut weh.`),
    G('fallersleben-kuckuck', 'Kuckuck, Kuckuck', 'Hoffmann von Fallersleben', 'fruehling', '12', `
Kuckuck, Kuckuck, ruft’s aus dem Wald.
Lasset uns singen,
tanzen und springen!
Frühling, Frühling wird es nun bald.`),
    G('fallersleben-maennlein', 'Ein Männlein steht im Walde', 'Hoffmann von Fallersleben', 'herbst', '12', `
Ein Männlein steht im Walde
ganz still und stumm,
es hat von lauter Purpur
ein Mäntlein um.
Sagt, wer mag das Männlein sein,
das da steht im Wald allein
mit dem purpurroten Mäntelein?

Das Männlein steht im Walde
auf einem Bein
und hat auf seinem Haupte
schwarz Käpplein klein.
Sagt, wer mag das Männlein sein,
das da steht im Wald allein
mit dem kleinen schwarzen Käppelein?`),
    G('fallersleben-bienchen', 'Summ, summ, summ', 'Hoffmann von Fallersleben', 'tiere', '12', `
Summ, summ, summ!
Bienchen, summ herum!
Ei, wir tun dir nichts zuleide,
flieg nur aus in Wald und Heide!
Summ, summ, summ!
Bienchen, summ herum!`),
    G('fallersleben-fruehling', 'Der Frühling hat sich eingestellt', 'Hoffmann von Fallersleben', 'fruehling', '12', `
Der Frühling hat sich eingestellt,
wohlan, wer will ihn sehn?
Der muss mit mir ins freie Feld,
ins grüne Feld nun gehn.`),
    G('fallersleben-schaefchen', 'Wer hat die schönsten Schäfchen?', 'Hoffmann von Fallersleben', 'natur', '12', `
Wer hat die schönsten Schäfchen?
Die hat der goldne Mond,
der hinter unsern Bäumen
am Himmel droben wohnt.`),
    G('goethe-gefunden', 'Gefunden', 'Johann Wolfgang von Goethe', 'natur', '34', `
Ich ging im Walde
so für mich hin,
und nichts zu suchen,
das war mein Sinn.

Im Schatten sah ich
ein Blümchen stehn,
wie Sterne leuchtend,
wie Äuglein schön.

Ich wollt es brechen,
da sagt’ es fein:
Soll ich zum Welken
gebrochen sein?

Ich grub’s mit allen
den Würzlein aus,
zum Garten trug ich’s
am hübschen Haus.

Und pflanzt es wieder
am stillen Ort;
nun zweigt es immer
und blüht so fort.`),
    G('heine-leise', 'Leise zieht durch mein Gemüt', 'Heinrich Heine', 'fruehling', '34', `
Leise zieht durch mein Gemüt
liebliches Geläute.
Klinge, kleines Frühlingslied,
kling hinaus ins Weite.

Kling hinaus bis an das Haus,
wo die Blumen sprießen.
Wenn du eine Rose schaust,
sag, ich lass sie grüßen.`),
    G('morgenstern-wiesel', 'Das ästhetische Wiesel', 'Christian Morgenstern', 'lustig', '34', `
Ein Wiesel
saß auf einem Kiesel
inmitten Bachgeriesel.

Wisst ihr
weshalb?

Das Mondkalb
verriet es mir
im Stillen:

Das raffinier-
te Tier
tat’s um des Reimes willen.`),
    G('morgenstern-schnupfen', 'Der Schnupfen', 'Christian Morgenstern', 'lustig', '34', `
Ein Schnupfen hockt auf der Terrasse,
auf dass er sich ein Opfer fasse

und stürzt alsbald mit großem Grimm
auf einen Menschen namens Schrimm.

Paul Schrimm erwidert prompt: Pitschü!
und hat ihn drauf bis Montag früh.`),
    G('morgenstern-spatzen', 'Die drei Spatzen', 'Christian Morgenstern', 'winter', '12', `
In einem leeren Haselstrauch,
da sitzen drei Spatzen, Bauch an Bauch.

Der Erich rechts und links der Franz
und mittendrin der freche Hans.

Sie haben die Augen zu, ganz zu,
und obendrüber, da schneit es, hu!

Sie rücken zusammen dicht an dicht.
So warm wie der Hans hat’s niemand nicht.

Sie hör’n alle drei ihrer Herzlein Gepoch.
Und wenn sie nicht weg sind, so sitzen sie noch.`),
    G('ringelnatz-ameisen', 'Die Ameisen', 'Joachim Ringelnatz', 'lustig', '34', `
In Hamburg lebten zwei Ameisen,
die wollten nach Australien reisen.
Bei Altona auf der Chaussee,
da taten ihnen die Beine weh,
und da verzichteten sie weise
dann auf den letzten Teil der Reise.`),
    G('busch-vogel', 'Es sitzt ein Vogel auf dem Leim', 'Wilhelm Busch', 'tiere', '34', `
Es sitzt ein Vogel auf dem Leim,
er flattert sehr und kann nicht heim.
Ein schwarzer Kater schleicht herzu,
die Krallen scharf, die Augen gluh.
Am Baum hinauf und immer höher
kommt er dem armen Vogel näher.

Der Vogel denkt: Weil das so ist
und weil mich doch der Kater frisst,
so will ich keine Zeit verlieren,
will noch ein wenig quinquilieren
und lustig pfeifen wie zuvor.
Der Vogel, scheint mir, hat Humor.`),
    G('busch-max-moritz', 'Max und Moritz (Vorwort, Anfang)', 'Wilhelm Busch', 'lustig', '34', `
Ach, was muss man oft von bösen
Kindern hören oder lesen!
Wie zum Beispiel hier von diesen,
welche Max und Moritz hießen;
die, anstatt durch weise Lehren
sich zum Guten zu bekehren,
oftmals noch darüber lachten
und sich heimlich lustig machten.`),
    G('guell-bueblein', 'Vom Büblein auf dem Eis', 'Friedrich Güll', 'winter', '34', `
Gefroren hat es heuer
noch gar kein festes Eis.
Das Büblein steht am Weiher
und spricht zu sich ganz leis:
Ich will es einmal wagen,
das Eis, es muss doch tragen.
Wer weiß?

Das Büblein stapft und hacket
mit seinem Stiefelein.
Das Eis auf einmal knacket,
und krach! schon bricht’s hinein.
Das Büblein platscht und krabbelt
als wie ein Krebs und zappelt
mit Arm und Bein.

O helft, ich muss versinken
in lauter Eis und Schnee!
O helft, ich muss ertrinken
im tiefen, tiefen See!
Wär nicht ein Mann gekommen,
der sich ein Herz genommen,
o weh!

Der packt es bei dem Schopfe
und zieht es dann heraus,
vom Fuße bis zum Kopfe
wie eine Wassermaus.
Das Büblein hat getropfet,
der Vater hat’s geklopfet
zu Haus.`),
    G('eichendorff-weihnachten', 'Weihnachten', 'Joseph von Eichendorff', 'weihnachten', '34', `
Markt und Straßen stehn verlassen,
still erleuchtet jedes Haus,
sinnend geh ich durch die Gassen,
alles sieht so festlich aus.

An den Fenstern haben Frauen
buntes Spielzeug fromm geschmückt,
tausend Kindlein stehn und schauen,
sind so wunderstill beglückt.

Und ich wandre aus den Mauern
bis hinaus ins freie Feld,
hehres Glänzen, heil’ges Schauern!
Wie so weit und still die Welt!

Sterne hoch die Kreise schlingen,
aus des Schnees Einsamkeit
steigt’s wie wunderbares Singen –
o du gnadenreiche Zeit!`),
    G('hebbel-herbstbild', 'Herbstbild', 'Friedrich Hebbel', 'herbst', '34', `
Dies ist ein Herbsttag, wie ich keinen sah!
Die Luft ist still, als atmete man kaum,
und dennoch fallen raschelnd, fern und nah,
die schönsten Früchte ab von jedem Baum.

O stört sie nicht, die Feier der Natur!
Dies ist die Lese, die sie selber hält,
denn heute löst sich von den Zweigen nur,
was vor dem milden Strahl der Sonne fällt.`),
    G('moerike-september', 'Septembermorgen', 'Eduard Mörike', 'herbst', '34', `
Im Nebel ruhet noch die Welt,
noch träumen Wald und Wiesen:
Bald siehst du, wenn der Schleier fällt,
den blauen Himmel unverstellt,
herbstkräftig die gedämpfte Welt
in warmem Golde fließen.`),
    G('claudius-abendlied', 'Abendlied (erste Strophe)', 'Matthias Claudius', 'natur', '34', `
Der Mond ist aufgegangen,
die goldnen Sternlein prangen
am Himmel hell und klar;
der Wald steht schwarz und schweiget,
und aus den Wiesen steiget
der weiße Nebel wunderbar.`),
    G('claudius-winter', 'Ein Lied hinterm Ofen zu singen (erste Strophe)', 'Matthias Claudius', 'winter', '34', `
Der Winter ist ein rechter Mann,
kernfest und auf die Dauer;
sein Fleisch fühlt sich wie Eisen an
und scheut nicht süß noch sauer.`),

    /* ---------- selbst geschrieben ---------- */
    G('f-igel', 'Der Igel', '', 'herbst', '12', `
Im Laub, da raschelt es ganz sacht,
der Igel ist schon aufgewacht.
Er sucht sich Käfer, Wurm und Schnecke
und schläft dann tief in seiner Hecke.`),
    G('f-schneeflocken', 'Schneeflocken', '', 'winter', '12', `
Schneeflocken tanzen leise,
sie drehen sich im Kreise.
Sie fallen auf das Dach,
da werden alle wach.

Wir bauen einen Mann aus Schnee
und trinken drinnen heißen Tee.`),
    G('f-sommertag', 'Sommertag', '', 'sommer', '12', `
Die Sonne scheint, der Tag ist lang,
im Baum erklingt der Vogelsang.
Wir springen in den kühlen See
und essen dann ein Eis – juchhe!`),
    G('f-krokus', 'Frühling ist da', '', 'fruehling', '12', `
Die Krokusse sind aufgewacht,
die Sonne hat sie angelacht.
Die Vögel bauen schon ihr Nest,
der Frühling feiert jetzt sein Fest.`),
    G('f-maus', 'Die kleine Maus', '', 'tiere', '12', `
Eine kleine graue Maus
wohnt in unserm alten Haus.
Nachts, da knabbert sie am Speck,
morgens ist der Käse weg!`),
    G('f-herbstwind', 'Herbstwind', '', 'herbst', '12', `
Der Herbstwind pustet kräftig los,
die Blätter fliegen, klein und groß.
Sie tanzen rot und gelb und braun
bis über unsern Gartenzaun.`),
    G('f-regen', 'Regentag', '', 'natur', '12', `
Es tropft und plätschert auf das Dach,
im Garten rauscht ein kleiner Bach.
Ich zieh die Gummistiefel an
und hüpfe, so weit ich nur kann.`),
    G('f-weihnachtszeit', 'Weihnachtszeit', '', 'weihnachten', '12', `
Draußen ist es kalt und dunkel,
drinnen Kerzen und Gefunkel.
Plätzchen duften durch das Haus –
bald packen wir Geschenke aus.`),
    G('f-freunde', 'Freunde', '', 'alltag', '12', `
Wenn ich einmal traurig bin,
gehst du mit mir dorthin,
wo wir zusammen lachen –
das sind die schönsten Sachen.`),
    G('f-loewe', 'Der Löwe hat Zahnweh', '', 'lustig', '12', `
Der Löwe hat heut Zahnweh,
drum trinkt er ganz viel Kräutertee.
Er brüllt nicht mehr, er flüstert nur:
„Ich mache eine Zahnweh-Kur.“`),
    G('f-schulweg', 'Mein Schulweg', '', 'alltag', '12', `
Ich packe meinen Ranzen ein,
die Hefte und die Stifte klein.
An der Ampel bleib ich stehn,
erst bei Grün darf ich gehn.`),
    G('f-sternenhimmel', 'Sternenhimmel', '', 'natur', '34', `
Wenn abends still die Sonne sinkt
und hoch ein erster Stern schon blinkt,
dann zählt der Mond die Sterne leise
und geht auf seine lange Reise.

Er wandert über Wald und Feld,
er leuchtet hell für alle Welt,
und wenn der Morgen kommt herbei,
dann ist auch seine Reise vorbei.`),
    G('f-ferien', 'Endlich Ferien', '', 'sommer', '34', `
Die Ranzen fliegen in die Ecke,
wir rennen um die nächste Hecke.
Sechs Wochen lang kein Wecker schrillt,
der Tag ist bunt und froh und wild.

Wir baden, klettern, spielen Ball
und toben lachend überall,
und abends sitzen wir am Feuer
und denken uns ein Abenteuer.`),
  ];

  /* Elfchen: 1 – 2 – 3 – 4 – 1 Wörter */
  const E = (id, theme, stufe, text) => ({ id, title: 'Elfchen', author: '', theme, stufe, elfchen: true, text: text.trim().split('\n').map(l => l.trim()).join('\n') });
  const ELFCHEN = [
    E('e-herbst', 'herbst', '12', 'Bunt\nDie Blätter\nfallen vom Baum\nich sammle sie ein\nHerbst'),
    E('e-winter', 'winter', '12', 'Weiß\nDer Schnee\nliegt im Garten\nich baue einen Schneemann\nWinter'),
    E('e-fruehling', 'fruehling', '12', 'Grün\nDie Wiese\nvoller kleiner Blumen\nich lege mich hinein\nFrühling'),
    E('e-sommer', 'sommer', '12', 'Heiß\nDie Sonne\nscheint am Strand\nwir springen ins Meer\nSommer'),
    E('e-sonne', 'sommer', '34', 'Gelb\nDie Sonne\nwärmt mein Gesicht\nich schließe die Augen\nGlück'),
    E('e-katze', 'tiere', '12', 'Weich\nMeine Katze\nschnurrt ganz leise\nich streichle ihr Fell\nKuschelzeit'),
    E('e-hund', 'tiere', '12', 'Fröhlich\nMein Hund\nwedelt vor Freude\ner holt den Ball\nFreund'),
    E('e-regen', 'natur', '12', 'Grau\nDer Regen\ntropft ans Fenster\nich bleibe heute drinnen\nGemütlich'),
    E('e-weihnachten', 'weihnachten', '12', 'Golden\nDie Kerzen\nleuchten am Baum\nalle singen ein Lied\nWeihnachten'),
    E('e-meer', 'sommer', '34', 'Blau\nDas Meer\nrauscht am Strand\nich baue eine Sandburg\nFerien'),
    E('e-apfel', 'herbst', '12', 'Rot\nEin Apfel\nhängt am Baum\nich beiße kräftig hinein\nLecker'),
    E('e-freundin', 'alltag', '34', 'Warm\nMeine Freundin\nhält meine Hand\nwir lachen über alles\nFreundschaft'),
    E('e-nacht', 'natur', '34', 'Dunkel\nDie Nacht\nSterne funkeln hell\nich träume von Drachen\nSchlaf'),
    E('e-kalt', 'winter', '12', 'Kalt\nMeine Nase\nist ganz rot\nich trinke heißen Tee\nBrrr'),
    E('e-schule', 'alltag', '12', 'Spannend\nDer Schultag\nbeginnt mit Lesen\ndann rechnen wir zusammen\nPause'),
    E('e-igel', 'tiere', '34', 'Stachelig\nDer Igel\nschläft im Laub\nbis der Frühling kommt\nWinterschlaf'),
    E('e-wald', 'natur', '34', 'Grün\nDer Wald\nriecht nach Moos\nein Specht klopft laut\nStille'),
    E('e-schmetterling', 'fruehling', '34', 'Bunt\nEin Schmetterling\nfliegt zur Blume\ner trinkt süßen Nektar\nSommer'),
    E('e-kuerbis', 'herbst', '34', 'Orange\nDer Kürbis\nlacht im Fenster\nmit einer Kerze drin\nHerbstabend'),
    E('e-wind', 'herbst', '34', 'Stark\nDer Wind\npustet meinen Drachen\nhoch in den Himmel\nFreiheit'),
    E('e-erdbeeren', 'sommer', '12', 'Süß\nDie Erdbeeren\nsind endlich reif\nwir pflücken einen Korb\nSommerglück'),
    E('e-geburtstag', 'alltag', '12', 'Bunt\nDie Luftballons\nhängen im Zimmer\nheute habe ich Geburtstag\nHurra'),
    E('e-mond', 'natur', '34', 'Silbern\nDer Mond\nschaut ins Zimmer\ner wünscht gute Nacht\nTräume'),
    E('e-ostern', 'fruehling', '12', 'Bunt\nDie Eier\nliegen im Gras\nwir suchen das Nest\nOstern'),
    E('e-lustig', 'lustig', '34', 'Komisch\nMein Kater\ntanzt im Regen\ner trägt einen Hut\nQuatsch'),
  ];

  const API = { GEDICHTE, ELFCHEN, GEDICHTTHEMEN };
  Object.assign(P, API);
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.FolivaPools = P;
})(typeof window !== 'undefined' ? window : globalThis);
