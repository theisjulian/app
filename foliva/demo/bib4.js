/* Foliva – Bibliothek, Ergänzung 0.9.13: weitere kleine Geschichten (selbst geschrieben, Namen erfunden) sowie
   Fabeln nach Äsop und Märchen der Brüder Grimm, frei nacherzählt (Stoffe gemeinfrei) · © 2026 theis */
(function (root) {
  'use strict';
  const B = root.FolivaBib = root.FolivaBib || { texte: [] };
  const T = [
 {
  "id": "g4-mila-malt",
  "quelle": "geschichten",
  "title": "Mila malt ein Bild",
  "theme": "familie",
  "stufe": "12",
  "tags": "malen, Bild, Oma, schenken, Farben",
  "text": "Mila malt ein Bild. Sie malt eine Sonne, ein Haus und einen Baum.\nDann malt sie ihre Oma. Die Oma hat einen blauen Hut.\nMila schenkt Oma das Bild.\nOma freut sich sehr. Sie hängt das Bild in die Küche.",
  "fragen": "Was malt Mila zuerst?|Eine Sonne, ein Haus und einen Baum.\nWelche Farbe hat Omas Hut?|Blau.\nWo hängt Oma das Bild auf?|In der Küche."
 },
 {
  "id": "g4-schwimmbad",
  "quelle": "geschichten",
  "title": "Im Schwimmbad",
  "theme": "sport",
  "stufe": "12",
  "tags": "Schwimmbad, Wasser, Mut, springen, Papa",
  "text": "Tom geht mit Papa ins Schwimmbad.\nDas Wasser ist kalt. Tom friert ein bisschen.\nPapa springt vom Rand. Platsch!\nTom traut sich nicht. Dann hält er sich die Nase zu und springt.\nDas Wasser spritzt hoch. Tom ist stolz.",
  "fragen": "Mit wem geht Tom ins Schwimmbad?|Mit Papa.\nWie ist das Wasser?|Kalt.\nWie fühlt sich Tom am Ende?|Er ist stolz."
 },
 {
  "id": "g4-pfuetzen",
  "quelle": "geschichten",
  "title": "Pfützen springen",
  "theme": "jahreszeiten",
  "stufe": "12",
  "tags": "Regen, Pfütze, Gummistiefel, nass, springen",
  "text": "Es regnet den ganzen Morgen.\nNach dem Mittagessen hört der Regen auf.\nEmma zieht ihre gelben Gummistiefel an.\nDraußen gibt es viele Pfützen. Emma springt in jede Pfütze.\nPlatsch, platsch, platsch!\nIhre Hose wird ganz nass. Mama schimpft nicht. Sie springt mit.",
  "fragen": "Wann hört der Regen auf?|Nach dem Mittagessen.\nWelche Farbe haben Emmas Gummistiefel?|Gelb.\nWas macht Mama?|Sie springt mit in die Pfützen."
 },
 {
  "id": "g4-schnecke-susi",
  "quelle": "geschichten",
  "title": "Die Schnecke Susi",
  "theme": "tiere",
  "stufe": "12",
  "tags": "Schnecke, Salat, Garten, langsam, Haus",
  "text": "Susi ist eine Schnecke. Sie wohnt im Garten.\nSusi trägt ihr Haus auf dem Rücken.\nSie kriecht ganz langsam zum Salat.\nDer Salat ist frisch und grün. Susi frisst ein großes Loch.\nDa kommt eine Amsel. Schnell zieht Susi sich in ihr Haus zurück.\nDie Amsel fliegt weiter. Susi frisst weiter.",
  "fragen": "Wo wohnt Susi?|Im Garten.\nWas frisst Susi?|Salat.\nWas macht Susi, als die Amsel kommt?|Sie zieht sich in ihr Haus zurück."
 },
 {
  "id": "g4-nudeln",
  "quelle": "geschichten",
  "title": "Paul kocht mit",
  "theme": "familie",
  "stufe": "12",
  "tags": "kochen, Nudeln, Küche, Soße, helfen",
  "text": "Heute kocht Paul mit Papa.\nEs gibt Nudeln mit Tomatensoße.\nPaul wäscht die Tomaten. Papa schneidet sie klein.\nDas Wasser kocht. Die Nudeln kommen in den Topf.\nPaul rührt die Soße um.\nDann essen alle zusammen. Paul sagt: „Das schmeckt super!“",
  "fragen": "Was gibt es zu essen?|Nudeln mit Tomatensoße.\nWas macht Paul mit den Tomaten?|Er wäscht sie.\nWer schneidet die Tomaten?|Papa."
 },
 {
  "id": "g4-nicht-schlafen",
  "quelle": "geschichten",
  "title": "Lisa kann nicht schlafen",
  "theme": "gefuehle",
  "stufe": "12",
  "tags": "Nacht, schlafen, Angst, Geräusch, Mama",
  "text": "Es ist Nacht. Lisa liegt im Bett.\nPlötzlich hört sie ein Geräusch: Tock, tock, tock.\nLisa zieht die Decke über den Kopf.\nDann ruft sie leise nach Mama.\nMama kommt und macht das Licht an.\nEs ist nur ein Ast, der ans Fenster klopft.\nMama gibt Lisa einen Kuss. Jetzt kann Lisa schlafen.",
  "fragen": "Was hört Lisa?|Ein Geräusch: Tock, tock, tock.\nWas macht Lisa zuerst?|Sie zieht die Decke über den Kopf.\nWas klopft ans Fenster?|Ein Ast."
 },
 {
  "id": "g4-kuchen-weg",
  "quelle": "geschichten",
  "title": "Wer hat den Kuchen genascht?",
  "theme": "abenteuer",
  "stufe": "12",
  "tags": "Detektiv, Kuchen, Spuren, Hund, Krümel",
  "text": "Auf dem Tisch stand ein Kuchen. Jetzt fehlt ein großes Stück!\nAnna spielt Detektivin. Sie sucht nach Spuren.\nAuf dem Boden liegen Krümel. Die Krümel führen in den Flur.\nIm Flur liegt Sahne auf dem Teppich.\nDie Spur endet im Körbchen von Hund Bruno.\nBruno hat Sahne an der Schnauze. Er wedelt mit dem Schwanz.",
  "fragen": "Was fehlt auf dem Tisch?|Ein großes Stück Kuchen.\nWohin führen die Krümel?|In den Flur.\nWer hat den Kuchen genascht?|Der Hund Bruno."
 },
 {
  "id": "g4-drache-blubb",
  "quelle": "geschichten",
  "title": "Der kleine Drache Blubb",
  "theme": "fantasie",
  "stufe": "12",
  "tags": "Drache, Feuer, Seifenblasen, Fantasie, anders sein",
  "text": "Blubb ist ein kleiner Drache.\nAlle Drachen können Feuer speien. Blubb kann das nicht.\nWenn er pustet, kommen Seifenblasen heraus.\nDie anderen Drachen lachen ihn aus. Blubb ist traurig.\nDann kommen Kinder zur Drachenhöhle.\nSie jubeln: „Mach noch mehr Seifenblasen!“\nJetzt ist Blubb der beliebteste Drache im ganzen Land.",
  "fragen": "Was kommt heraus, wenn Blubb pustet?|Seifenblasen.\nWie fühlt sich Blubb, als die anderen lachen?|Traurig.\nWer jubelt über die Seifenblasen?|Die Kinder."
 },
 {
  "id": "g4-einkaufen",
  "quelle": "geschichten",
  "title": "Einkaufen mit Liste",
  "theme": "alltag",
  "stufe": "12",
  "tags": "einkaufen, Supermarkt, Liste, Geld, Brot",
  "text": "Mama schreibt einen Einkaufszettel: Brot, Milch, Äpfel und Käse.\nJan darf den Zettel halten.\nIm Supermarkt sucht Jan alles zusammen.\nEr findet das Brot, die Milch und die Äpfel.\nNur den Käse vergisst er fast.\nAn der Kasse bezahlt Mama. Jan trägt die Tasche nach Hause.",
  "fragen": "Was steht auf dem Einkaufszettel?|Brot, Milch, Äpfel und Käse.\nWas vergisst Jan fast?|Den Käse.\nWas macht Jan am Ende?|Er trägt die Tasche nach Hause."
 },
 {
  "id": "g4-opa-fahrrad",
  "quelle": "geschichten",
  "title": "Opa repariert das Fahrrad",
  "theme": "familie",
  "stufe": "12",
  "tags": "Fahrrad, Reifen, Opa, reparieren, Werkzeug",
  "text": "Hannas Fahrrad hat einen Platten.\nOpa holt seinen Werkzeugkasten.\nEr nimmt den Reifen ab und sucht das Loch.\nHanna hält eine Schüssel mit Wasser. Dort, wo Blasen aufsteigen, ist das Loch.\nOpa klebt einen Flicken darauf.\nJetzt pumpt Hanna den Reifen wieder auf. Sie fährt gleich eine Runde.",
  "fragen": "Was ist mit Hannas Fahrrad los?|Es hat einen Platten.\nWoran erkennen sie das Loch?|An den Blasen im Wasser.\nWas klebt Opa auf das Loch?|Einen Flicken."
 },
 {
  "id": "g4-zoo",
  "quelle": "geschichten",
  "title": "Im Zoo",
  "theme": "tiere",
  "stufe": "12",
  "tags": "Zoo, Tiere, Affen, Giraffe, Ausflug",
  "text": "Die Klasse 2a macht einen Ausflug in den Zoo.\nZuerst sehen die Kinder die Affen. Die Affen klettern und schaukeln.\nDann gehen sie zu den Giraffen. Die Giraffen fressen Blätter von hohen Bäumen.\nBeim Eisbären bleiben alle lange stehen. Er schwimmt im Becken.\nZum Schluss gibt es Pommes. Alle sind müde, aber froh.",
  "fragen": "Welche Tiere sehen die Kinder zuerst?|Die Affen.\nWas fressen die Giraffen?|Blätter von hohen Bäumen.\nWas macht der Eisbär?|Er schwimmt im Becken."
 },
 {
  "id": "g4-vogelhaus",
  "quelle": "geschichten",
  "title": "Das Vogelhaus",
  "theme": "tiere",
  "stufe": "12",
  "tags": "Winter, Vögel, füttern, Meise, Futterhaus",
  "text": "Im Winter finden die Vögel wenig Futter.\nOle und Opa bauen ein Vogelhaus aus Holz.\nSie hängen es an den Apfelbaum.\nOle streut Körner hinein.\nAm nächsten Morgen sitzt eine Meise im Vogelhaus.\nBald kommen auch ein Spatz und eine Amsel.\nOle beobachtet sie jeden Tag vom Fenster aus.",
  "fragen": "Woraus bauen Ole und Opa das Vogelhaus?|Aus Holz.\nWo hängt das Vogelhaus?|Am Apfelbaum.\nWelche Vögel kommen?|Eine Meise, ein Spatz und eine Amsel."
 },
 {
  "id": "g4-dachboden",
  "quelle": "geschichten",
  "title": "Das Geheimnis auf dem Dachboden",
  "theme": "abenteuer",
  "stufe": "34",
  "tags": "Dachboden, Kiste, Geheimnis, Brief, Großvater",
  "text": "Bei Regen ist es im Haus von Oma Gerda langweilig. Darum steigen Jakob und seine Cousine Lea auf den Dachboden. Dort ist es staubig und ein bisschen dunkel.\nIn einer Ecke steht eine alte Holzkiste. Sie ist mit einem Lederband verschnürt. Neugierig öffnen die beiden die Kiste. Darin liegen ein Kompass, eine Landkarte und ein Bündel Briefe.\nLea liest einen Brief vor. Er ist von ihrem Urgroßvater. Er schreibt von einer langen Reise mit dem Schiff über das Meer. Auf der Landkarte hat er seinen Weg mit roter Tinte eingezeichnet.\nDie Kinder bringen die Kiste nach unten. Oma Gerda staunt. „Die habe ich seit vielen Jahren gesucht!“, sagt sie. An diesem Nachmittag erzählt sie die ganze Geschichte der Reise.",
  "fragen": "Warum steigen die Kinder auf den Dachboden?|Weil es bei Regen im Haus langweilig ist.\nWas finden sie in der Kiste?|Einen Kompass, eine Landkarte und ein Bündel Briefe.\nVon wem sind die Briefe?|Vom Urgroßvater.\nWie reagiert Oma Gerda?|Sie staunt und erzählt die Geschichte der Reise."
 },
 {
  "id": "g4-klassensprecher",
  "quelle": "geschichten",
  "title": "Die Wahl zur Klassensprecherin",
  "theme": "schule",
  "stufe": "34",
  "tags": "Klassensprecher, Wahl, Schule, Mut, Rede",
  "text": "In der 3b wird eine Klassensprecherin oder ein Klassensprecher gewählt. Aylin möchte sich aufstellen lassen. Aber vor der ganzen Klasse zu sprechen, macht sie nervös.\nAm Abend übt sie ihre kleine Rede vor dem Spiegel. „Ich möchte, dass alle in der Pause mitspielen dürfen. Und ich möchte, dass wir einen Briefkasten für Wünsche bekommen.“\nAm nächsten Tag zittern ihre Knie. Trotzdem sagt sie ihre Rede auf. Danach schreibt jedes Kind einen Namen auf einen Zettel. Frau Wagner zählt die Stimmen an der Tafel.\nAylin bekommt elf Stimmen, Max bekommt neun. Aylin ist Klassensprecherin, Max wird ihr Vertreter. Schon in der nächsten Woche hängt ein Wunschbriefkasten neben der Tür.",
  "fragen": "Warum ist Aylin nervös?|Weil sie vor der ganzen Klasse sprechen muss.\nWas wünscht sich Aylin für die Klasse?|Dass alle in der Pause mitspielen dürfen und einen Briefkasten für Wünsche.\nWie viele Stimmen bekommt Aylin?|Elf.\nWelche Aufgabe bekommt Max?|Er wird Vertreter."
 },
 {
  "id": "g4-nachbarn",
  "quelle": "geschichten",
  "title": "Neue Nachbarn",
  "theme": "freundschaft",
  "stufe": "34",
  "tags": "Nachbarn, Umzug, Sprache, Freundschaft, Fußball",
  "text": "Im Haus gegenüber ist eine neue Familie eingezogen. Der Junge heißt Dario und ist so alt wie Felix. Dario spricht noch nicht viel Deutsch, denn die Familie kommt aus Italien.\nFelix sieht, wie Dario allein im Hof gegen die Wand kickt. Er nimmt seinen Ball und geht hinüber. „Spielen?“, fragt er und zeigt auf den Ball. Dario grinst und nickt.\nBeim Fußball braucht man nicht viele Wörter. „Tor!“ heißt auf Italienisch „gol“. Dario bringt Felix bei, bis zehn auf Italienisch zu zählen. Felix zeigt Dario, wie man „Elfmeter“ sagt.\nNach ein paar Wochen sprechen die beiden eine eigene Mischung aus Deutsch und Italienisch. Die Mütter verstehen kein Wort, aber die Jungen verstehen sich prima.",
  "fragen": "Woher kommt Darios Familie?|Aus Italien.\nWie lernen sich Felix und Dario kennen?|Beim Fußballspielen im Hof.\nWas bringt Dario Felix bei?|Bis zehn auf Italienisch zu zählen.\nWie sprechen die beiden nach ein paar Wochen?|In einer Mischung aus Deutsch und Italienisch."
 },
 {
  "id": "g4-schluessel",
  "quelle": "geschichten",
  "title": "Der verschwundene Schlüssel",
  "theme": "abenteuer",
  "stufe": "34",
  "tags": "Schlüssel, Detektiv, suchen, Spuren, Elster",
  "text": "„Wo ist nur mein Schlüssel?“, ruft Frau Kaya, die Hausmeisterin. Ohne Schlüssel kann sie die Turnhalle nicht aufsperren. Die 4a will helfen und bildet ein Detektivteam.\nPaula fragt: „Wo hatten Sie den Schlüssel zuletzt?“ Frau Kaya überlegt. „Auf der Bank im Schulhof. Ich habe dort kurz gefrühstückt.“\nDie Kinder suchen den ganzen Schulhof ab. Unter der Bank liegt nur ein Brotkrümel. Da entdeckt Kian etwas Glänzendes oben in der Kastanie. Ein großes Nest! Eine Elster sitzt daneben und schimpft laut.\nElstern sammeln manchmal glänzende Dinge, das hat Kian in einem Buch gelesen. Der Hausmeister von nebenan holt eine Leiter. Tatsächlich: Im Nest liegen der Schlüssel, ein Kronkorken und ein silberner Knopf. Am Nachmittag hat die 4a Sport, wie geplant.",
  "fragen": "Warum braucht Frau Kaya den Schlüssel?|Um die Turnhalle aufzusperren.\nWo hatte Frau Kaya den Schlüssel zuletzt?|Auf der Bank im Schulhof.\nWer hat den Schlüssel genommen?|Eine Elster.\nWas liegt außer dem Schlüssel noch im Nest?|Ein Kronkorken und ein silberner Knopf."
 },
 {
  "id": "g4-turnier",
  "quelle": "geschichten",
  "title": "Das Fußballturnier",
  "theme": "sport",
  "stufe": "34",
  "tags": "Fußball, Turnier, verlieren, Mannschaft, fair",
  "text": "Am Samstag findet das große Schulturnier statt. Die Mannschaft der 4b hat wochenlang trainiert. Lukas steht im Tor.\nDie ersten beiden Spiele gewinnt die 4b. Im Finale treffen sie auf die 4a. Es steht lange null zu null. Zwei Minuten vor Schluss schießt die 4a ein Tor. Lukas springt, aber der Ball ist zu schnell.\nNach dem Abpfiff sitzt Lukas enttäuscht auf dem Rasen. Da kommt Jule aus der 4a zu ihm. „Du hast heute so viele Bälle gehalten. Ohne dich hätten wir viel höher gewonnen“, sagt sie und reicht ihm die Hand.\nLukas steht auf. Die Mannschaften stellen sich auf und klatschen sich ab. Der zweite Platz fühlt sich auf einmal gar nicht mehr so schlecht an.",
  "fragen": "Auf welcher Position spielt Lukas?|Er steht im Tor.\nWie geht das Finale aus?|Die 4a gewinnt mit einem Tor.\nWas sagt Jule zu Lukas?|Dass er viele Bälle gehalten hat.\nWie fühlt sich Lukas am Ende?|Der zweite Platz fühlt sich nicht mehr so schlecht an."
 },
 {
  "id": "g4-post-paula",
  "quelle": "geschichten",
  "title": "Post für Paula",
  "theme": "familie",
  "stufe": "34",
  "tags": "Brief, Opa, schreiben, Post, Briefmarke",
  "text": "Paulas Opa wohnt weit weg an der Nordsee. Telefonieren mag er nicht so gern. Darum schreiben sich die beiden Briefe.\nHeute liegt ein dicker Umschlag im Briefkasten. Paula erkennt sofort Opas krakelige Schrift. Im Brief erzählt er von einem Sturm. Die Wellen waren so hoch wie ein Haus. Außerdem hat er ein getrocknetes Seepferdchen beigelegt und eine Zeichnung von seinem Kutter.\nPaula setzt sich gleich an den Schreibtisch. Sie schreibt von ihrem Schwimmabzeichen und von der Klassenfahrt. Dazu malt sie ein Bild von ihrer Klasse. Mama gibt ihr eine Briefmarke.\nAuf dem Weg zum Briefkasten denkt Paula: Ein Brief ist viel schöner als eine Nachricht auf dem Handy. Man kann ihn anfassen und aufheben.",
  "fragen": "Wo wohnt Paulas Opa?|An der Nordsee.\nWovon erzählt Opa im Brief?|Von einem Sturm mit sehr hohen Wellen.\nWas legt Opa dem Brief bei?|Ein getrocknetes Seepferdchen und eine Zeichnung von seinem Kutter.\nWarum findet Paula Briefe schöner als Nachrichten auf dem Handy?|Man kann sie anfassen und aufheben."
 },
 {
  "id": "g4-lampenfieber",
  "quelle": "geschichten",
  "title": "Lampenfieber",
  "theme": "gefuehle",
  "stufe": "34",
  "tags": "Theater, Aufführung, Angst, Mut, Bühne, Text vergessen",
  "text": "Die Klasse führt beim Schulfest ein Theaterstück auf. Mira spielt die Königin. Sie hat ihren Text jeden Abend geübt und kann ihn auswendig.\nKurz vor der Aufführung hat Mira Bauchweh. Hinter dem Vorhang hört sie, wie die Eltern im Saal reden und lachen. Ihr Herz klopft laut. Was ist, wenn ich alles vergesse?, denkt sie.\nDann geht der Vorhang auf. Mira betritt die Bühne und sagt ihren ersten Satz. Plötzlich ist ihr Kopf leer. Doch Ben, der den Diener spielt, flüstert ihr das nächste Wort zu. Sofort weiß Mira wieder weiter.\nAm Ende verbeugen sich alle Kinder. Der Applaus ist riesig. „Das nennt man Lampenfieber“, sagt Frau Huber. „Das haben sogar berühmte Schauspieler.“",
  "fragen": "Welche Rolle spielt Mira?|Die Königin.\nWas passiert nach Miras erstem Satz?|Ihr Kopf ist plötzlich leer.\nWie hilft Ben ihr?|Er flüstert ihr das nächste Wort zu.\nWas ist Lampenfieber?|Die Aufregung vor einem Auftritt."
 },
 {
  "id": "g4-bach",
  "quelle": "geschichten",
  "title": "Der Bach im Wald",
  "theme": "natur",
  "stufe": "34",
  "tags": "Umwelt, Müll, Bach, Wald, Tiere schützen",
  "text": "Hinter der Schule fließt ein kleiner Bach durch den Wald. Die 3c geht dorthin, um Wasserlebewesen zu beobachten. Mit Becherlupen fangen sie Bachflohkrebse und Köcherfliegenlarven.\nDoch am Ufer entdecken die Kinder auch Plastikflaschen, Dosen und eine alte Tüte. In der Tüte hat sich ein Frosch verfangen. Vorsichtig befreit ihn Jana. Der Frosch hüpft ins Wasser.\nDie Kinder sind empört. „Wer wirft denn so etwas in den Wald?“, fragt Ilias. Die Lehrerin schlägt vor, eine Sammelaktion zu machen.\nAm Freitag kommen die Kinder mit Handschuhen und Müllsäcken. Nach zwei Stunden haben sie fünf Säcke gefüllt. Die Gemeinde stellt am Waldweg einen neuen Mülleimer auf. Und die Kinder malen Schilder: „Unser Bach ist kein Mülleimer!“",
  "fragen": "Was wollen die Kinder am Bach beobachten?|Wasserlebewesen.\nWas finden die Kinder am Ufer?|Plastikflaschen, Dosen und eine alte Tüte.\nWie viele Säcke Müll sammeln sie?|Fünf.\nWas steht auf den Schildern?|Unser Bach ist kein Mülleimer!"
 },
 {
  "id": "g4-huehner",
  "quelle": "geschichten",
  "title": "Die Hühner von Familie Berger",
  "theme": "tiere",
  "stufe": "34",
  "tags": "Hühner, Eier, Tiere versorgen, Verantwortung, Fuchs",
  "text": "Familie Berger hat vier Hühner. Sie heißen Frieda, Henni, Lotte und Gackerine. Jeden Morgen öffnet Simon die Klappe des Hühnerstalls. Er streut Körner und füllt frisches Wasser nach.\nJeden Tag findet Simon drei oder vier Eier im Nest. Die Eier von Frieda sind braun, die von Lotte fast grün. Mama sagt: „Die Farbe hängt von der Hühnerrasse ab.“\nEines Abends vergisst Simon, die Klappe zu schließen. In der Nacht hört er lautes Gackern. Papa rennt hinaus und sieht gerade noch einen Fuchs davonhuschen. Zum Glück sind alle Hühner da, nur Henni hat ein paar Federn verloren.\nSeit diesem Abend hängt neben der Tür ein Zettel: „Hühnerklappe zu?“ Simon schaut jeden Abend darauf. Verantwortung für Tiere heißt, jeden Tag an sie zu denken.",
  "fragen": "Welche Aufgaben hat Simon am Morgen?|Er öffnet die Klappe, streut Körner und füllt Wasser nach.\nWovon hängt die Farbe der Eier ab?|Von der Hühnerrasse.\nWas passiert in der Nacht?|Ein Fuchs kommt an den Hühnerstall.\nWozu hängt der Zettel neben der Tür?|Damit Simon nicht vergisst, die Klappe zu schließen."
 },
 {
  "id": "g4-weihnachtsmarkt",
  "quelle": "geschichten",
  "title": "Auf dem Weihnachtsmarkt",
  "theme": "feste",
  "stufe": "34",
  "tags": "Weihnachten, Markt, Geschenk, Taschengeld, schenken",
  "text": "Malte hat sein Taschengeld gespart. Zwölf Euro sind in seiner Spardose. Damit will er auf dem Weihnachtsmarkt ein Geschenk für seine Schwester kaufen.\nDer Markt duftet nach gebrannten Mandeln und Lebkuchen. An einem Stand gibt es geschnitzte Holztiere. Ein kleines Pferd kostet acht Euro. Malte überlegt. Seine Schwester liebt Pferde.\nEr kauft das Pferd und behält vier Euro übrig. Dafür kauft er sich eine Tüte gebrannte Mandeln. Doch auf dem Heimweg teilt er die Mandeln mit Mama.\nAm Heiligen Abend packt seine Schwester das Pferd aus. Sie umarmt Malte so fest, dass er kaum Luft bekommt. Malte findet: Schenken macht mindestens genauso viel Freude wie beschenkt werden.",
  "fragen": "Wie viel Geld hat Malte gespart?|Zwölf Euro.\nWas kostet das Holzpferd?|Acht Euro.\nWas kauft Malte von dem übrigen Geld?|Eine Tüte gebrannte Mandeln.\nWas findet Malte am Ende?|Schenken macht genauso viel Freude wie beschenkt werden."
 },
 {
  "id": "g4-baeckerin",
  "quelle": "geschichten",
  "title": "Ein Morgen in der Backstube",
  "theme": "alltag",
  "stufe": "34",
  "tags": "Bäckerin, Beruf, Brot, früh aufstehen, Backstube",
  "text": "Frau Leitner ist Bäckerin. Ihr Arbeitstag beginnt um drei Uhr in der Nacht, wenn fast alle noch schlafen. Heute darf Tim, ihr Neffe, einmal zuschauen.\nIn der Backstube ist es warm. Frau Leitner mischt Mehl, Wasser, Salz und Hefe in einer riesigen Rührmaschine. Der Teig muss ruhen, damit er aufgeht. In der Zwischenzeit formt sie Brezeln. Tim versucht es auch. Seine Brezel sieht eher aus wie eine Schlange.\nUm fünf Uhr kommen die ersten Bleche aus dem Ofen. Die Semmeln duften herrlich. Um sechs Uhr öffnet der Laden, und schon stehen die ersten Kunden vor der Tür.\nAm Mittag ist Tim todmüde. „Jetzt weißt du, warum ich früh ins Bett gehe“, lacht Frau Leitner.",
  "fragen": "Wann beginnt der Arbeitstag der Bäckerin?|Um drei Uhr in der Nacht.\nWelche Zutaten kommen in den Teig?|Mehl, Wasser, Salz und Hefe.\nWie sieht Tims Brezel aus?|Wie eine Schlange.\nWann öffnet der Laden?|Um sechs Uhr."
 },
 {
  "id": "g4-tieraerztin",
  "quelle": "geschichten",
  "title": "Bei der Tierärztin",
  "theme": "tiere",
  "stufe": "34",
  "tags": "Tierärztin, Beruf, Katze, krank, Pflege",
  "text": "Kater Mauzi frisst seit zwei Tagen nichts mehr. Er liegt nur noch in seinem Korb. Lara macht sich Sorgen. Mit Papa bringt sie Mauzi zur Tierärztin.\nIm Wartezimmer sitzen ein Hund mit Verband und ein Kaninchen in einer Kiste. Dann ist Mauzi an der Reihe. Frau Dr. Yilmaz hört sein Herz ab und tastet seinen Bauch. Sie schaut ihm auch ins Maul.\n„Da ist das Problem“, sagt sie. „Ein Zahn ist entzündet. Deshalb tut ihm das Fressen weh.“ Mauzi bekommt eine Spritze und Tabletten für die nächsten Tage.\nLara fragt die Tierärztin, wie man Tierärztin wird. „Man muss viele Jahre studieren“, antwortet sie. „Und man darf keine Angst vor Krallen haben.“ Lara lacht. Vielleicht wird sie auch einmal Tierärztin.",
  "fragen": "Warum bringt Lara Mauzi zur Tierärztin?|Weil er seit zwei Tagen nichts frisst.\nWer sitzt noch im Wartezimmer?|Ein Hund mit Verband und ein Kaninchen.\nWas ist Mauzis Problem?|Ein Zahn ist entzündet.\nWas muss man tun, um Tierärztin zu werden?|Viele Jahre studieren."
 },
 {
  "id": "g4-stromausfall",
  "quelle": "geschichten",
  "title": "Stromausfall",
  "theme": "gefuehle",
  "stufe": "34",
  "tags": "Stromausfall, Dunkelheit, Kerzen, Familie, Spiele",
  "text": "Mitten beim Abendessen geht plötzlich das Licht aus. Auch der Kühlschrank brummt nicht mehr. „Stromausfall“, sagt Papa. Draußen sind auch die Straßenlaternen dunkel.\nDie kleine Ida fängt an zu weinen. Sie mag die Dunkelheit nicht. Mama holt Kerzen und Streichhölzer aus der Schublade. Bald flackern vier Kerzen auf dem Tisch. Der Raum sieht gemütlich aus.\nWeil der Fernseher nicht geht, holt Papa ein Kartenspiel. Danach erzählt Oma, wie es früher ohne Computer und Handy war. Ida sitzt auf ihrem Schoß und hört gespannt zu.\nNach zwei Stunden geht das Licht wieder an. Alle blinzeln. „Schade“, sagt Ida. „Können wir morgen wieder Stromausfall machen?“",
  "fragen": "Woran merkt die Familie den Stromausfall?|Das Licht geht aus und der Kühlschrank brummt nicht mehr.\nWarum weint Ida?|Sie mag die Dunkelheit nicht.\nWas macht die Familie ohne Fernseher?|Sie spielen Karten und Oma erzählt von früher.\nWie findet Ida den Stromausfall am Ende?|Sie möchte am nächsten Tag wieder einen."
 },
 {
  "id": "g4-mutprobe",
  "quelle": "geschichten",
  "title": "Die Mutprobe",
  "theme": "freundschaft",
  "stufe": "34",
  "tags": "Mutprobe, Nein sagen, Freundschaft, Gefahr, Mut",
  "text": "Auf dem Spielplatz am Bahndamm treffen sich die größeren Kinder. Sie sagen zu Marlon: „Wenn du zu uns gehören willst, musst du eine Mutprobe machen. Klettere über den Zaun und lauf über die Gleise.“\nMarlon spürt, wie sein Magen sich zusammenzieht. Er weiß: Das ist verboten und sehr gefährlich. Züge sind schnell und leise. Aber er möchte so gern dazugehören.\nDa sagt seine Freundin Hira: „Ich mache da nicht mit. Das ist keine Mutprobe, das ist dumm.“ Marlon schluckt. Dann sagt auch er: „Ich auch nicht.“\nDie anderen lachen und nennen sie Angsthasen. Doch Marlon fühlt sich gut. Auf dem Heimweg sagt Hira: „Weißt du was? Nein zu sagen, war viel mutiger.“",
  "fragen": "Welche Mutprobe sollen die Kinder machen?|Über den Zaun klettern und über die Gleise laufen.\nWarum ist das gefährlich?|Züge sind schnell und leise.\nWer sagt zuerst Nein?|Hira.\nWas meint Hira am Ende?|Nein zu sagen, war viel mutiger."
 },
 {
  "id": "g4-radfahren",
  "quelle": "geschichten",
  "title": "Die Fahrradprüfung",
  "theme": "alltag",
  "stufe": "34",
  "tags": "Fahrrad, Prüfung, Verkehr, Polizei, Helm",
  "text": "In der vierten Klasse machen alle Kinder die Fahrradprüfung. Zwei Polizisten kommen in die Schule. Im Verkehrsgarten üben die Kinder Abbiegen, Vorfahrt und Handzeichen.\nVor der Prüfung kontrolliert Polizeihauptmeister Roth jedes Fahrrad. Hat es eine Klingel? Funktionieren beide Bremsen? Leuchten die Lichter vorne und hinten? An Johannas Rad fehlt ein Rückstrahler. Ihr Vater bringt am nächsten Tag einen neuen.\nAm Prüfungstag fahren die Kinder eine Runde durch das Wohngebiet. An jeder Ecke steht ein Elternteil und schaut genau hin. Vor dem Linksabbiegen muss man sich umschauen und den Arm ausstrecken.\nAm Ende bekommen alle bis auf einen Jungen den Fahrradausweis. Er darf die Prüfung in zwei Wochen wiederholen. Und alle wissen: Ohne Helm fährt niemand los.",
  "fragen": "Wer kommt für die Fahrradprüfung in die Schule?|Zwei Polizisten.\nWas wird am Fahrrad kontrolliert?|Klingel, beide Bremsen und die Lichter.\nWas muss man vor dem Linksabbiegen tun?|Sich umschauen und den Arm ausstrecken.\nWas bekommen die Kinder nach der Prüfung?|Den Fahrradausweis."
 },
 {
  "id": "g4-brief-italien",
  "quelle": "geschichten",
  "title": "Ein Brief aus Italien",
  "theme": "familie",
  "stufe": "34",
  "tags": "Brief, Italien, Ferien, Brieffreundin, Sprache",
  "text": "Sofia hat eine Brieffreundin in Italien. Sie heißt Giulia und wohnt in einer kleinen Stadt am Meer. Die beiden haben sich im letzten Sommer im Urlaub kennengelernt.\nHeute ist ein Brief gekommen. Giulia schreibt halb auf Deutsch und halb auf Italienisch. „Ciao Sofia! Ich lerne jetzt Deutsch in der Schule. Es ist schwer, aber es macht Spaß.“ Sie erzählt von ihrem Hund Pepe und von der Eisdiele ihres Onkels.\nSofia holt das kleine Wörterbuch aus dem Regal. „Gelato“ heißt Eis, „cane“ heißt Hund und „amica“ heißt Freundin. Sie schreibt zurück und versucht dabei auch ein paar italienische Wörter.\nAm Ende malt sie unter den Brief zwei Mädchen, die sich an den Händen halten. Darunter schreibt sie: „Amiche per sempre – Freundinnen für immer.“",
  "fragen": "Wo wohnt Giulia?|In einer kleinen Stadt am Meer in Italien.\nWo haben sich die Mädchen kennengelernt?|Im letzten Sommer im Urlaub.\nWas heißt „gelato“ auf Deutsch?|Eis.\nWas schreibt Sofia unter ihr Bild?|Amiche per sempre – Freundinnen für immer."
 },
 {
  "id": "g4-schneckenrennen",
  "quelle": "geschichten",
  "title": "Das große Schneckenrennen",
  "theme": "lustig",
  "stufe": "34",
  "tags": "Schnecke, Rennen, lustig, Geduld, Wettbewerb",
  "text": "Im Garten von Familie Huber findet jedes Jahr das große Schneckenrennen statt. Die Teilnehmer sind sehr schnell – zumindest für Schnecken.\nAm Start stehen Turbo, Blitz und die alte Gertrud. Turbo ist eine junge Weinbergschnecke mit glänzendem Haus. Blitz ist eine Nacktschnecke ohne Haus. „Ohne Haus bin ich leichter“, prahlt er. Gertrud sagt gar nichts. Sie kaut an einem Salatblatt.\nDer Startschuss fällt. Turbo kriecht los. Blitz kriecht los. Gertrud kaut weiter. Nach einer halben Stunde haben Turbo und Blitz schon zehn Zentimeter geschafft. Doch dann entdecken sie eine Erdbeere am Wegrand und bleiben stehen.\nGertrud kriecht langsam und gleichmäßig an ihnen vorbei. Sie hält nicht an, sie schaut nicht zur Seite. Nach drei Stunden erreicht sie das Ziel. Die Zuschauer schlafen schon fast. Aber Gertrud hat gewonnen.",
  "fragen": "Wer nimmt am Rennen teil?|Turbo, Blitz und die alte Gertrud.\nWarum glaubt Blitz, dass er schneller ist?|Weil er ohne Haus leichter ist.\nWarum bleiben Turbo und Blitz stehen?|Sie entdecken eine Erdbeere.\nWarum gewinnt Gertrud?|Sie kriecht langsam und gleichmäßig und hält nicht an."
 },
 {
  "id": "g4-herbstferien",
  "quelle": "geschichten",
  "title": "Drachensteigen",
  "theme": "jahreszeiten",
  "stufe": "34",
  "tags": "Herbst, Drachen, Wind, basteln, Feld",
  "text": "In den Herbstferien basteln Elif und ihr Opa einen Drachen. Sie nehmen zwei dünne Holzstäbe, buntes Papier und eine lange Schnur. Der Schwanz bekommt viele kleine Schleifen aus Zeitungspapier.\nAm Sonntag ist das Wetter perfekt. Auf dem Stoppelfeld weht ein kräftiger Wind. Opa hält den Drachen hoch, Elif rennt mit der Schnur los. Beim ersten Versuch stürzt der Drachen kopfüber ins Feld. Beim zweiten Versuch verfängt er sich in einem Busch.\nBeim dritten Versuch packt ihn der Wind. Der Drachen steigt höher und höher. Elif muss die Schnur gut festhalten, so stark zieht er. Über ihnen tanzt der Drachen vor den grauen Wolken.\nAuf dem Heimweg sind Elifs Wangen rot vom Wind. „Nächstes Jahr bauen wir einen noch größeren“, sagt sie.",
  "fragen": "Was brauchen Elif und Opa zum Basteln?|Zwei Holzstäbe, buntes Papier und eine lange Schnur.\nWas passiert beim ersten Versuch?|Der Drachen stürzt kopfüber ins Feld.\nBeim wievielten Versuch fliegt der Drachen?|Beim dritten Versuch.\nWas möchte Elif nächstes Jahr?|Einen noch größeren Drachen bauen."
 },
 {
  "id": "g4-kraehe",
  "quelle": "geschichten",
  "title": "Die kluge Krähe",
  "theme": "tiere",
  "stufe": "34",
  "tags": "Krähe, klug, Tiere, Werkzeug, beobachten",
  "text": "Vor Jonas' Fenster steht eine große Linde. Jeden Morgen landet dort eine Krähe. Jonas nennt sie Rabea. Krähen sind sehr klug, hat er gelesen. Das will er selbst ausprobieren.\nEr legt eine Nuss auf das Fensterbrett. Rabea nimmt sie, aber die Schale ist zu hart. Da fliegt sie mit der Nuss hoch über die Straße und lässt sie fallen. Die Nuss zerspringt auf dem Asphalt. Rabea landet und frisst den Kern.\nAm nächsten Tag stellt Jonas ein Glas mit Wasser hin. Auf dem Wasser schwimmt ein Stück Brot, aber Rabeas Schnabel reicht nicht hinein. Rabea sammelt kleine Steine und wirft sie ins Glas. Das Wasser steigt, bis sie das Brot erreicht.\nJonas schreibt alles in ein Heft. Er nennt es „Forschungsbuch Rabea“. Vielleicht wird er später Vogelforscher.",
  "fragen": "Wie nennt Jonas die Krähe?|Rabea.\nWie knackt Rabea die Nuss?|Sie lässt sie aus der Luft auf die Straße fallen.\nWie kommt Rabea an das Brot im Glas?|Sie wirft Steine ins Glas, bis das Wasser steigt.\nWie heißt Jonas' Heft?|Forschungsbuch Rabea."
 },
 {
  "id": "m4-hund-spiegelbild",
  "quelle": "fabeln",
  "title": "Der Hund und sein Spiegelbild",
  "author": "nacherzählt nach Äsop",
  "theme": "tiere",
  "stufe": "12",
  "tags": "Fabel, Hund, Fleisch, Gier, Spiegelbild, Fluss",
  "text": "Ein Hund hat ein großes Stück Fleisch. Er trägt es im Maul über eine Brücke.\nUnten im Wasser sieht er einen anderen Hund. Der hat auch ein Stück Fleisch – und es sieht noch größer aus!\nDer Hund will auch dieses Stück haben. Er schnappt danach.\nDabei fällt ihm sein eigenes Fleisch ins Wasser. Es versinkt.\nDer andere Hund war nur sein Spiegelbild.\nLehre: Wer zu gierig ist, verliert am Ende alles.",
  "fragen": "Was trägt der Hund im Maul?|Ein großes Stück Fleisch.\nWen sieht der Hund im Wasser?|Sein Spiegelbild.\nWas passiert, als er schnappt?|Sein Fleisch fällt ins Wasser."
 },
 {
  "id": "m4-wind-sonne",
  "quelle": "fabeln",
  "title": "Der Wind und die Sonne",
  "author": "nacherzählt nach Äsop",
  "theme": "tiere",
  "stufe": "34",
  "tags": "Fabel, Wind, Sonne, Streit, Freundlichkeit, Wanderer",
  "text": "Der Wind und die Sonne streiten, wer von ihnen stärker ist. Da kommt ein Wanderer mit einem dicken Mantel des Weges. „Wer ihm den Mantel ausziehen kann, ist der Stärkere“, sagt die Sonne.\nDer Wind fängt an. Er bläst und stürmt, so fest er kann. Doch je stärker er bläst, desto fester hält der Wanderer seinen Mantel fest. Er wickelt sich sogar noch enger hinein.\nDann ist die Sonne an der Reihe. Sie scheint sanft und warm. Dem Wanderer wird es wärmer und wärmer. Schließlich knöpft er den Mantel auf und zieht ihn aus.\nLehre: Mit Freundlichkeit erreicht man oft mehr als mit Gewalt.",
  "fragen": "Worüber streiten der Wind und die Sonne?|Wer von ihnen stärker ist.\nWas macht der Wanderer, als der Wind bläst?|Er hält seinen Mantel noch fester.\nWarum zieht der Wanderer den Mantel aus?|Weil die Sonne warm scheint."
 },
 {
  "id": "m4-taube-ameise",
  "quelle": "fabeln",
  "title": "Die Taube und die Ameise",
  "author": "nacherzählt nach Äsop",
  "theme": "tiere",
  "stufe": "12",
  "tags": "Fabel, Taube, Ameise, helfen, Dankbarkeit",
  "text": "Eine Ameise will am Bach trinken. Da fällt sie ins Wasser. Sie zappelt und kann nicht schwimmen.\nEine Taube sieht das. Sie wirft ein Blatt ins Wasser. Die Ameise klettert darauf und treibt ans Ufer.\nSpäter kommt ein Jäger. Er zielt mit dem Bogen auf die Taube.\nDie Ameise sieht es und beißt den Jäger fest ins Bein. Der Jäger zuckt zusammen. Der Pfeil fliegt daneben. Die Taube fliegt davon.\nLehre: Wer anderen hilft, bekommt oft Hilfe zurück.",
  "fragen": "Wie rettet die Taube die Ameise?|Sie wirft ein Blatt ins Wasser.\nWer will die Taube fangen?|Ein Jäger.\nWie hilft die Ameise der Taube?|Sie beißt den Jäger ins Bein."
 },
 {
  "id": "m4-wichtel",
  "quelle": "maerchen",
  "title": "Die Wichtelmänner",
  "author": "nacherzählt nach den Brüdern Grimm",
  "theme": "fantasie",
  "stufe": "34",
  "tags": "Märchen, Schuster, Wichtel, Dankbarkeit, Schuhe, Grimm",
  "text": "Ein Schuster war so arm, dass er nur noch Leder für ein einziges Paar Schuhe hatte. Am Abend schnitt er es zu und ging schlafen. Am Morgen standen auf dem Tisch fertige Schuhe, so fein genäht, dass kein Stich schief war.\nEin Kunde kaufte sie für viel Geld. Davon kaufte der Schuster Leder für zwei Paar. Auch diese waren am Morgen fertig. So ging es weiter, und bald war der Schuster ein wohlhabender Mann.\nKurz vor Weihnachten blieb er mit seiner Frau in der Nacht wach. Um Mitternacht kamen zwei kleine, nackte Männlein und nähten flink die Schuhe. Die Frau sagte: „Die Wichtel haben uns reich gemacht. Sie frieren bestimmt. Ich nähe ihnen Kleider.“\nIn der nächsten Nacht lagen statt Leder kleine Hemden, Hosen und Schuhe auf dem Tisch. Die Wichtel zogen sich an, sprangen fröhlich herum und tanzten zur Tür hinaus. Sie kamen nie wieder. Dem Schuster aber ging es gut, solange er lebte.",
  "fragen": "Warum ist der Schuster so arm?|Er hat nur noch Leder für ein Paar Schuhe.\nWer näht die Schuhe in der Nacht?|Zwei kleine Wichtelmänner.\nWie bedankt sich das Ehepaar?|Die Frau näht den Wichteln Kleider.\nWas machen die Wichtel danach?|Sie tanzen hinaus und kommen nie wieder."
 },
 {
  "id": "m4-hans-glueck",
  "quelle": "maerchen",
  "title": "Hans im Glück",
  "author": "nacherzählt nach den Brüdern Grimm",
  "theme": "fantasie",
  "stufe": "34",
  "tags": "Märchen, Tausch, Glück, Gold, Grimm",
  "text": "Hans hatte sieben Jahre lang bei seinem Meister gearbeitet. Als Lohn bekam er einen Goldklumpen, so groß wie sein Kopf. Damit machte er sich auf den Weg nach Hause zu seiner Mutter.\nDoch das Gold war schwer. Da tauschte Hans es gegen ein Pferd. Das Pferd warf ihn ab, also tauschte er es gegen eine Kuh. Die Kuh gab keine Milch, also tauschte er sie gegen ein Schwein. Das Schwein tauschte er gegen eine Gans und die Gans gegen einen Schleifstein.\nJedes Mal freute sich Hans über den Tausch. Am Brunnen wollte er trinken. Dabei fiel der schwere Stein ins Wasser und war fort.\nDa sprang Hans vor Freude auf. „So glücklich wie ich ist kein Mensch auf der Welt!“, rief er. Ohne Last und mit leichtem Herzen lief er heim zu seiner Mutter.",
  "fragen": "Was bekommt Hans als Lohn?|Einen Goldklumpen, so groß wie sein Kopf.\nGegen welche Dinge tauscht Hans? Nenne drei.|Pferd, Kuh, Schwein (Gans, Schleifstein).\nWas passiert mit dem Schleifstein?|Er fällt in den Brunnen.\nIst Hans am Ende glücklich? Was meinst du?|(eigene Antwort)"
 }
];
  T.forEach(x => { if (!B.texte.some(y => y.id === x.id)) B.texte.push(x); });
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(typeof window !== 'undefined' ? window : globalThis);
