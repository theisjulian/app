/* Foliva – Bibliothek: kleine Geschichten für Klasse 1/2 · © 2026 theis
   Alle Geschichten sind für Foliva selbst geschrieben, alle Namen erfunden.
   Felder: id, title, theme, stufe, tags, text, fragen ("Frage|Musterantwort" je Zeile) */
(function (root) {
  'use strict';
  const B = root.FolivaBib = root.FolivaBib || { texte: [] };
  const g = (id, title, theme, tags, text, fragen) => B.texte.push({ id, quelle: 'geschichten', title, theme, stufe: '12', tags, text: text.trim().replace(/\n\s+/g, '\n'), fragen: fragen.trim().replace(/\n\s+/g, '\n') });

  g('g12-ball', 'Der rote Ball', 'freundschaft', 'Ball, spielen, Freund, Garten', `
    Tom hat einen roten Ball. Er spielt im Garten. Der Ball rollt unter den Zaun. Tom kann ihn nicht holen.
    Da kommt Lea. Sie ist klein und dünn. Sie kriecht unter den Zaun und holt den Ball.
    Jetzt spielen Tom und Lea zusammen.`, `
    Welche Farbe hat der Ball?|Der Ball ist rot.
    Wohin rollt der Ball?|Der Ball rollt unter den Zaun.
    Wer holt den Ball?|Lea holt den Ball.`);
  g('g12-katze-mimi', 'Mimi will nach draußen', 'tiere', 'Katze, Regen, Tür, Haustier', `
    Die Katze Mimi sitzt an der Tür. Sie will nach draußen. Mama macht die Tür auf.
    Aber draußen regnet es. Mimi schaut in den Regen. Dann dreht sie sich um.
    Sie legt sich lieber auf das warme Sofa.`, `
    Wo sitzt Mimi am Anfang?|Mimi sitzt an der Tür.
    Wie ist das Wetter draußen?|Es regnet.
    Wohin legt sich Mimi?|Mimi legt sich auf das warme Sofa.`);
  g('g12-schnee', 'Der erste Schnee', 'jahreszeiten', 'Winter, Schnee, Schneemann, Freude', `
    Ali schaut aus dem Fenster. Alles ist weiß! Es hat geschneit.
    Schnell zieht Ali seine Jacke, die Mütze und die Stiefel an. Mit seiner Schwester baut er einen Schneemann.
    Der Schneemann bekommt eine Nase aus einer Möhre. Ali lacht.`, `
    Was sieht Ali, als er aus dem Fenster schaut?|Alles ist weiß, es hat geschneit.
    Was zieht Ali an?|Ali zieht Jacke, Mütze und Stiefel an.
    Woraus ist die Nase des Schneemanns?|Die Nase ist aus einer Möhre.`);
  g('g12-zahn', 'Der Wackelzahn', 'familie', 'Zahn, Milchzahn, Apfel, Familie', `
    Ella hat einen Wackelzahn. Er wackelt schon seit drei Tagen.
    Beim Frühstück beißt Ella in einen Apfel. Da ist der Zahn plötzlich weg! Er steckt im Apfel.
    Ella zeigt Papa die Lücke. Papa sagt: „Jetzt bist du schon groß.“`, `
    Was hat Ella?|Ella hat einen Wackelzahn.
    Wo steckt der Zahn am Ende?|Der Zahn steckt im Apfel.
    Was sagt Papa?|„Jetzt bist du schon groß.“`);
  g('g12-igel', 'Ein Igel im Garten', 'tiere', 'Igel, Herbst, Laub, Garten', `
    Im Herbst liegt viel Laub im Garten. Opa will es wegharken. Da raschelt es im Laubhaufen.
    Ein kleiner Igel schaut heraus. Opa lässt den Haufen liegen. „Hier kann der Igel im Winter schlafen“, sagt er.
    Mira freut sich.`, `
    Was liegt im Garten?|Im Garten liegt viel Laub.
    Wer schaut aus dem Laubhaufen?|Ein kleiner Igel schaut heraus.
    Warum lässt Opa den Haufen liegen?|Der Igel soll dort im Winter schlafen.`);
  g('g12-geburtstag', 'Ben hat Geburtstag', 'feste', 'Geburtstag, Kuchen, Kerzen, Geschenk', `
    Heute hat Ben Geburtstag. Er wird sieben Jahre alt.
    Auf dem Tisch steht ein Kuchen mit sieben Kerzen. Ben pustet alle Kerzen aus. Dann packt er sein Geschenk aus.
    Es ist ein blaues Fahrrad. Ben will sofort losfahren.`, `
    Wie alt wird Ben?|Ben wird sieben Jahre alt.
    Wie viele Kerzen sind auf dem Kuchen?|Auf dem Kuchen sind sieben Kerzen.
    Was bekommt Ben geschenkt?|Ben bekommt ein blaues Fahrrad.`);
  g('g12-schulweg', 'Auf dem Schulweg', 'alltag', 'Schulweg, Ampel, Verkehr, Schule', `
    Nora geht zur Schule. An der Ampel bleibt sie stehen. Die Ampel ist rot.
    Ein Auto fährt vorbei. Dann wird die Ampel grün. Nora schaut nach links und nach rechts. Erst dann geht sie über die Straße.
    Ihre Lehrerin winkt ihr schon zu.`, `
    Was macht Nora an der roten Ampel?|Sie bleibt stehen.
    Was tut Nora, bevor sie über die Straße geht?|Sie schaut nach links und nach rechts.
    Wer winkt Nora zu?|Ihre Lehrerin winkt ihr zu.`);
  g('g12-drache', 'Der Drache fliegt', 'jahreszeiten', 'Herbst, Wind, Drachen, Papa', `
    Es ist windig. Paul und Papa gehen auf die Wiese. Paul hat einen bunten Drachen.
    Papa hält die Schnur. Paul rennt los. Der Wind packt den Drachen. Er steigt hoch in den Himmel.
    Jetzt darf Paul die Schnur halten. Er muss gut festhalten!`, `
    Wie ist das Wetter?|Es ist windig.
    Wohin gehen Paul und Papa?|Sie gehen auf die Wiese.
    Wer hält am Ende die Schnur?|Paul hält die Schnur.`);
  g('g12-mut', 'Lina ist mutig', 'gefuehle', 'Mut, Angst, Schwimmbad, Sprungbrett', `
    Lina steht im Schwimmbad am Beckenrand. Sie hat ein bisschen Angst. Das Wasser ist tief.
    Ihr Bruder ist schon im Wasser. Er ruft: „Komm, du schaffst das!“
    Lina hält sich die Nase zu und springt. Platsch! Sie taucht auf und lacht. Das war toll!`, `
    Wo steht Lina?|Lina steht im Schwimmbad am Beckenrand.
    Warum hat Lina Angst?|Das Wasser ist tief.
    Wie fühlt sich Lina nach dem Sprung?|Sie lacht, sie findet es toll.`);
  g('g12-pizza', 'Wir backen Pizza', 'familie', 'Pizza, backen, Küche, Essen', `
    Am Samstag backen Emil und Mama eine Pizza. Emil rollt den Teig aus. Mama gibt Tomatensoße darauf.
    Emil legt Käse, Paprika und Mais auf die Pizza. Dann kommt sie in den Ofen.
    Es riecht sehr gut. Nach einer Weile ist die Pizza fertig. Lecker!`, `
    Wann backen Emil und Mama?|Am Samstag.
    Was legt Emil auf die Pizza?|Käse, Paprika und Mais.
    Wohin kommt die Pizza zum Backen?|In den Ofen.`);
  g('g12-maus-pip', 'Die Maus Pip', 'tiere', 'Maus, Käse, Katze, Versteck', `
    Pip ist eine kleine Maus. Sie wohnt in einem Loch in der Wand.
    Pip hat Hunger. Auf dem Tisch liegt ein Stück Käse. Leise läuft Pip los. Doch da sitzt die Katze!
    Pip wartet, bis die Katze schläft. Dann holt sie schnell den Käse.`, `
    Wo wohnt Pip?|In einem Loch in der Wand.
    Was liegt auf dem Tisch?|Ein Stück Käse.
    Wann holt Pip den Käse?|Als die Katze schläft.`);
  g('g12-regenbogen', 'Der Regenbogen', 'natur', 'Regen, Sonne, Regenbogen, Farben', `
    Es regnet. Dann kommt die Sonne heraus. Am Himmel steht ein großer Regenbogen.
    Ida zählt die Farben: rot, orange, gelb, grün, blau und lila.
    „Wo hört der Regenbogen auf?“, fragt sie. Oma lacht: „Das weiß niemand.“`, `
    Was kommt nach dem Regen?|Die Sonne kommt heraus.
    Welche Farben zählt Ida?|Rot, orange, gelb, grün, blau und lila.
    Was fragt Ida?|Wo hört der Regenbogen auf?`);
  g('g12-verloren', 'Wo ist Teddy?', 'gefuehle', 'Teddy, suchen, traurig, finden', `
    Jana kann ihren Teddy nicht finden. Sie sucht im Bett, unter dem Tisch und im Schrank. Jana ist traurig.
    Da bellt der Hund im Garten. Er hat etwas im Maul. Es ist der Teddy!
    Jana nimmt ihn und wäscht ihn. Dann darf der Teddy wieder mit ins Bett.`, `
    Wo sucht Jana ihren Teddy?|Im Bett, unter dem Tisch und im Schrank.
    Wer hat den Teddy?|Der Hund hat den Teddy im Maul.
    Was macht Jana mit dem Teddy?|Sie wäscht ihn.`);
  g('g12-zirkus', 'Im Zirkus', 'sport', 'Zirkus, Clown, Pferde, Zelt', `
    Heute geht Karl mit Papa in den Zirkus. Das Zelt ist rot und gelb.
    Zuerst kommen die Pferde. Sie laufen im Kreis. Dann kommt ein Clown. Er stolpert über seine großen Schuhe.
    Alle Kinder lachen. Karl lacht am lautesten.`, `
    Welche Farben hat das Zelt?|Das Zelt ist rot und gelb.
    Was machen die Pferde?|Sie laufen im Kreis.
    Worüber stolpert der Clown?|Über seine großen Schuhe.`);
  g('g12-fruehling', 'Der Frühling kommt', 'jahreszeiten', 'Frühling, Blumen, Vögel, Garten', `
    Die Sonne scheint schon warm. Im Garten blühen die ersten Blumen. Sie sind gelb und lila.
    Ein Vogel sitzt im Baum und singt. Er baut ein Nest.
    Moritz pflanzt mit Mama Samen in einen Topf. Bald wachsen dort Sonnenblumen.`, `
    Welche Farben haben die ersten Blumen?|Gelb und lila.
    Was macht der Vogel?|Er singt und baut ein Nest.
    Was pflanzt Moritz?|Samen für Sonnenblumen.`);
  g('g12-oma-besuch', 'Besuch bei Oma', 'familie', 'Oma, Kuchen, Besuch, Spiel', `
    Am Sonntag besucht Mia ihre Oma. Oma wohnt in einem kleinen Haus mit Garten.
    Oma hat einen Kuchen gebacken. Er ist mit Kirschen. Nach dem Kuchen spielen Mia und Oma ein Spiel.
    Mia gewinnt zweimal. Oma sagt: „Nächste Woche gewinne ich!“`, `
    Wann besucht Mia ihre Oma?|Am Sonntag.
    Was für einen Kuchen hat Oma gebacken?|Einen Kuchen mit Kirschen.
    Wie oft gewinnt Mia?|Mia gewinnt zweimal.`);
  g('g12-kaefer', 'Der kleine Käfer', 'natur', 'Käfer, Marienkäfer, Blatt, Wiese', `
    Ein Marienkäfer krabbelt über ein Blatt. Er ist rot und hat schwarze Punkte.
    Leon zählt die Punkte. Es sind sieben. Leon hält seine Hand hin. Der Käfer krabbelt auf seinen Finger.
    Dann klappt er seine Flügel auf und fliegt davon.`, `
    Welche Farbe hat der Käfer?|Er ist rot mit schwarzen Punkten.
    Wie viele Punkte zählt Leon?|Sieben Punkte.
    Was macht der Käfer am Ende?|Er fliegt davon.`);
  g('g12-sankt-martin', 'Laterne, Laterne', 'feste', 'Sankt Martin, Laterne, Licht, Herbst', `
    Heute ist der Martinsumzug. Es ist schon dunkel. Jede Laterne leuchtet.
    Selin hat eine Laterne gebastelt. Sie sieht aus wie ein Mond. Die Kinder gehen durch die Straßen und singen.
    Am Ende gibt es warmen Tee und Brezen.`, `
    Was ist heute?|Der Martinsumzug.
    Wie sieht Selins Laterne aus?|Wie ein Mond.
    Was gibt es am Ende?|Warmen Tee und Brezen.`);
  g('g12-bauernhof', 'Auf dem Bauernhof', 'tiere', 'Bauernhof, Kuh, Huhn, Ferien', `
    In den Ferien ist Finn auf einem Bauernhof. Am Morgen hilft er der Bäuerin.
    Er füttert die Hühner und sammelt die Eier ein. Im Stall stehen zehn Kühe. Eine Kuh heißt Berta.
    Finn darf ihr Heu geben. Berta muht laut.`, `
    Wo ist Finn in den Ferien?|Auf einem Bauernhof.
    Was macht Finn bei den Hühnern?|Er füttert sie und sammelt die Eier ein.
    Wie heißt eine Kuh?|Berta.`);
  g('g12-kranker-tag', 'Krank im Bett', 'alltag', 'krank, Bett, Fieber, Arzt', `
    Luis ist krank. Er hat Fieber und Halsweh. Er muss im Bett bleiben.
    Mama bringt ihm Tee mit Honig. Später kommt die Ärztin. Sie hört Luis ab und sagt: „Viel schlafen und viel trinken!“
    Nach drei Tagen geht es Luis wieder gut.`, `
    Was hat Luis?|Fieber und Halsweh.
    Was bringt Mama?|Tee mit Honig.
    Was sagt die Ärztin?|Viel schlafen und viel trinken.`);
  g('g12-hund-kruemel', 'Krümel geht spazieren', 'tiere', 'Hund, Nachbarin, helfen, spazieren', `
    Frau Berger wohnt neben Sami. Sie hat einen alten Hund. Er heißt Krümel.
    Frau Berger hat sich am Bein verletzt. Sie kann nicht laufen. Da hat Sami eine Idee: Er geht jeden Nachmittag mit Krümel in den Park.
    Krümel schnüffelt an jedem Baum. Frau Berger schenkt Sami zum Dank ein Buch über Hunde.`, `
    Wie heißt der Hund?|Krümel.
    Warum kann Frau Berger nicht laufen?|Sie hat sich am Bein verletzt.
    Was schenkt Frau Berger Sami?|Ein Buch über Hunde.`);
  g('g12-turnen', 'In der Turnhalle', 'sport', 'Turnen, Sport, Seil, Schule', `
    Heute hat die Klasse 1b Sport. In der Turnhalle hängt ein langes Seil.
    Die Kinder klettern am Seil hoch. Emma schafft es bis ganz oben. Sie klingelt an der Glocke.
    Alle klatschen. Danach spielen sie Fangen.`, `
    Was hängt in der Turnhalle?|Ein langes Seil.
    Wer klettert bis ganz oben?|Emma.
    Was spielen die Kinder danach?|Fangen.`);
  g('g12-traum', 'Der Traum', 'fantasie', 'Traum, Drache, fliegen, Nacht', `
    In der Nacht träumt Tim von einem Drachen. Der Drache ist grün und freundlich.
    Tim setzt sich auf seinen Rücken. Sie fliegen über Berge und Wälder bis zum Meer.
    Dann klingelt der Wecker. Tim wacht auf. Schade, denkt er.`, `
    Wovon träumt Tim?|Von einem Drachen.
    Wie ist der Drache?|Grün und freundlich.
    Wodurch wacht Tim auf?|Durch den Wecker.`);
  g('g12-eis', 'Ein Eis für alle', 'jahreszeiten', 'Sommer, Eis, teilen, heiß', `
    Es ist Sommer und sehr heiß. Jonas, Ayla und Max gehen zur Eisdiele.
    Jonas hat Geld für drei Kugeln. Er kauft eine Kugel Schokolade, eine Kugel Erdbeere und eine Kugel Zitrone.
    Jedes Kind bekommt eine Kugel. Das ist gerecht!`, `
    Wohin gehen die Kinder?|Zur Eisdiele.
    Wie viele Kugeln kauft Jonas?|Drei Kugeln.
    Was ist gerecht?|Jedes Kind bekommt eine Kugel.`);
  g('g12-baustelle', 'Die Baustelle', 'alltag', 'Bagger, Baustelle, Kran, Haus', `
    Neben der Schule ist eine Baustelle. Dort steht ein großer gelber Bagger. Er gräbt ein tiefes Loch.
    Ein Kran hebt schwere Steine. Die Kinder schauen in der Pause zu.
    Bald steht hier ein neues Haus.`, `
    Wo ist die Baustelle?|Neben der Schule.
    Was macht der Bagger?|Er gräbt ein tiefes Loch.
    Was steht hier bald?|Ein neues Haus.`);
  g('g12-quatsch', 'Der verkehrte Tag', 'lustig', 'Quatsch, lustig, verkehrt, Familie', `
    Heute ist bei Familie Rossi alles verkehrt. Papa trägt die Mütze am Fuß. Mama isst das Müsli mit der Gabel.
    Der Hund miaut und die Katze bellt. Lotta zieht die Socken über die Hände.
    Dann lachen alle. Heute ist nämlich der erste April!`, `
    Wo trägt Papa die Mütze?|Am Fuß.
    Was macht der Hund?|Er miaut.
    Warum ist alles verkehrt?|Heute ist der erste April.`);
  g('g12-freund-neu', 'Ein neues Kind', 'schule', 'Schule, neu, Freundschaft, Klasse', `
    In die Klasse 2a kommt ein neues Mädchen. Sie heißt Amira. Amira ist still und schaut auf den Boden.
    In der Pause steht sie allein. Da geht Noah zu ihr. „Willst du mit uns Ball spielen?“, fragt er.
    Amira lächelt und nickt.`, `
    Wie heißt das neue Mädchen?|Amira.
    Was macht Amira in der Pause?|Sie steht allein.
    Was fragt Noah?|Willst du mit uns Ball spielen?`);
  g('g12-ostern', 'Die Ostersuche', 'feste', 'Ostern, Eier, Nest, suchen', `
    Es ist Ostersonntag. Die Kinder laufen in den Garten. Sie suchen bunte Eier.
    Ole findet ein blaues Ei im Gras. Ronja findet zwei Eier unter dem Busch. Hinter dem Baum liegt ein Nest mit Schokolade.
    Zum Schluss teilen alle ihre Eier.`, `
    Was suchen die Kinder?|Bunte Eier.
    Wo findet Ronja zwei Eier?|Unter dem Busch.
    Was liegt hinter dem Baum?|Ein Nest mit Schokolade.`);
  g('g12-wald', 'Im Wald', 'natur', 'Wald, Reh, leise, Spaziergang', `
    Fabian geht mit Opa in den Wald. Die Bäume sind hoch. Es riecht nach Moos.
    Plötzlich bleibt Opa stehen. „Psst!“, flüstert er. Zwischen den Bäumen steht ein Reh.
    Es schaut die beiden an. Dann springt es davon.`, `
    Wonach riecht es im Wald?|Nach Moos.
    Was sieht Fabian zwischen den Bäumen?|Ein Reh.
    Was macht das Reh am Ende?|Es springt davon.`);
  g('g12-streit', 'Streit um die Schaukel', 'gefuehle', 'Streit, Schaukel, teilen, Spielplatz', `
    Auf dem Spielplatz gibt es nur eine Schaukel. Anna und Kemal wollen beide schaukeln. Sie streiten laut.
    Da hat Anna eine Idee: „Jeder darf zehnmal schaukeln, dann wechseln wir.“
    Kemal zählt mit. So haben beide Spaß.`, `
    Wie viele Schaukeln gibt es?|Nur eine Schaukel.
    Welche Idee hat Anna?|Jeder darf zehnmal schaukeln, dann wird gewechselt.
    Wie geht die Geschichte aus?|Beide haben Spaß.`);
})(typeof window !== 'undefined' ? window : globalThis);
