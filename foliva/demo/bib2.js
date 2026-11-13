/* Foliva – Bibliothek: Geschichten für Klasse 3/4 · © 2026 theis
   Alle Geschichten sind für Foliva selbst geschrieben, alle Namen erfunden. */
(function (root) {
  'use strict';
  const B = root.FolivaBib = root.FolivaBib || { texte: [] };
  const g = (id, title, theme, tags, text, fragen) => B.texte.push({ id, quelle: 'geschichten', title, theme, stufe: '34', tags, text: text.trim().replace(/\n\s+/g, '\n'), fragen: fragen.trim().replace(/\n\s+/g, '\n') });

  g('g34-schatzkarte', 'Die Schatzkarte', 'abenteuer', 'Schatz, Karte, Dachboden, Geheimnis', `
    Auf dem Dachboden von Opas Haus findet Clara eine alte Kiste. Darin liegt ein vergilbtes Papier. Es ist eine Karte! Ein rotes Kreuz ist neben einem Baum eingezeichnet.
    „Das ist die große Eiche hinter dem Haus“, ruft ihr Bruder Felix. Mit einer Schaufel laufen die beiden in den Garten. Sie graben und graben. Nach einer Weile stößt die Schaufel auf etwas Hartes.
    Es ist eine kleine Blechdose. Darin liegen Murmeln, ein Taschenmesser und ein Zettel. Darauf steht: „Mein Schatz, versteckt im Sommer 1972. Paul.“ Paul – das ist Opa! Am Abend erzählt Opa lachend, wie er als Junge die Dose vergraben hat.`, `
    Wo findet Clara die Kiste?|Auf dem Dachboden von Opas Haus.
    Was ist auf der Karte eingezeichnet?|Ein rotes Kreuz neben einem Baum.
    Was liegt in der Blechdose?|Murmeln, ein Taschenmesser und ein Zettel.
    Wer hat den Schatz versteckt?|Opa (Paul) hat ihn als Junge versteckt.`);
  g('g34-nachtwanderung', 'Die Nachtwanderung', 'abenteuer', 'Nacht, Wald, Angst, Klassenfahrt, Taschenlampe', `
    Auf der Klassenfahrt macht die 4c eine Nachtwanderung. Jedes Kind hat eine Taschenlampe. Der Weg führt durch einen dunklen Wald.
    Plötzlich knackt es im Gebüsch. Leonie bleibt stehen und greift nach der Hand ihrer Freundin Zoe. Zwei leuchtende Augen schauen sie an. „Ein Wolf!“, flüstert jemand.
    Herr Ludwig leuchtet mit seiner großen Lampe ins Gebüsch. Dort sitzt ein Fuchs. Er blinzelt ins Licht und verschwindet dann zwischen den Bäumen. Alle atmen auf und lachen. Später, am Lagerfeuer, erzählt jeder, wie sehr er erschrocken ist.`, `
    Was hat jedes Kind dabei?|Eine Taschenlampe.
    Was hört die Klasse im Wald?|Es knackt im Gebüsch.
    Welches Tier sitzt wirklich im Gebüsch?|Ein Fuchs.
    Was machen die Kinder später am Lagerfeuer?|Sie erzählen, wie sehr sie erschrocken sind.`);
  g('g34-erfinder', 'Hannas Erfindung', 'schule', 'Erfindung, Idee, Müll, Projekt', `
    Hanna ärgert sich jeden Tag über den Müll auf dem Schulhof. Bonbonpapier, Brottüten und Flaschen liegen herum. Da hat sie eine Idee.
    Sie bastelt aus einem alten Karton einen Mülleimer mit einem Maul. Wenn man etwas hineinwirft, ertönt ein lustiges Geräusch. Ihr Bruder hat dafür eine kleine Klingel eingebaut.
    Hanna stellt den Mülleimer in der Pause auf. Zuerst schauen alle nur neugierig. Dann probiert es ein Junge aus. Es klingelt! Bald stehen die Kinder Schlange, um ihren Müll wegzuwerfen. Die Schulleiterin ist begeistert und bestellt drei weitere Mülleimer.`, `
    Worüber ärgert sich Hanna?|Über den Müll auf dem Schulhof.
    Woraus baut Hanna den Mülleimer?|Aus einem alten Karton.
    Was passiert, wenn man etwas hineinwirft?|Es ertönt ein lustiges Geräusch, eine Klingel klingelt.
    Wie reagiert die Schulleiterin?|Sie ist begeistert und bestellt drei weitere Mülleimer.`);
  g('g34-wettlauf', 'Der Staffellauf', 'sport', 'Sport, Staffel, Sportfest, Team', `
    Beim Sportfest läuft Jakobs Klasse in der Staffel. Jakob ist der letzte Läufer. Er ist aufgeregt, denn die anderen Klassen sind schnell.
    Als Mila ihm den Stab gibt, liegt die Klasse auf dem dritten Platz. Jakob rennt los, so schnell er kann. Er überholt einen Jungen aus der 4a. Doch kurz vor dem Ziel rutscht ihm fast der Stab aus der Hand.
    Jakob hält ihn fest und läuft weiter. Am Ende wird die Klasse Zweite. Jakob ist ein bisschen enttäuscht. Aber seine Lehrerin sagt: „Ihr habt als Team toll zusammengehalten. Darauf kommt es an.“`, `
    Wann läuft die Klasse die Staffel?|Beim Sportfest.
    Auf welchem Platz liegt die Klasse, als Jakob den Stab bekommt?|Auf dem dritten Platz.
    Welchen Platz erreicht die Klasse am Ende?|Den zweiten Platz.
    Was sagt die Lehrerin?|Ihr habt als Team toll zusammengehalten. Darauf kommt es an.`);
  g('g34-oma-handy', 'Oma lernt chatten', 'familie', 'Oma, Handy, Nachricht, Generationen', `
    Oma Gerda hat ein neues Handy bekommen. Doch sie weiß nicht, wie man Nachrichten schreibt. Ihre Enkelin Lena erklärt es ihr.
    „Hier tippst du die Buchstaben, und mit diesem Pfeil schickst du die Nachricht ab“, sagt Lena. Oma tippt langsam: „Hallo Lena, wie geht es dir?“ Dann drückt sie auf den Pfeil.
    Am nächsten Tag bekommt Lena eine Nachricht mit zwanzig Herzen und einem Kuchenbild. Darunter steht: „Morgen gibt es Apfelkuchen. Kommst du?“ Lena muss lachen. Oma hat schnell gelernt!`, `
    Was kann Oma Gerda am Anfang nicht?|Nachrichten schreiben.
    Wer erklärt es ihr?|Ihre Enkelin Lena.
    Was steht in Omas Nachricht am nächsten Tag?|Morgen gibt es Apfelkuchen. Kommst du?`);
  g('g34-stadtmaus', 'Ein Fuchs in der Stadt', 'natur', 'Fuchs, Stadt, Wildtiere, Beobachten', `
    Jeden Morgen geht Tarek an einem kleinen Park vorbei. Eines Tages sieht er dort einen Fuchs. Er schnüffelt an einem Mülleimer und läuft dann unter eine Hecke.
    Tarek erzählt es in der Schule. Seine Lehrerin erklärt: „Füchse leben heute auch in vielen Städten. Dort finden sie genug Futter und viele Verstecke.“ Sie warnt aber auch: „Man darf Füchse nicht füttern und nicht anfassen. Sie sind wilde Tiere.“
    Von da an hält Tarek jeden Morgen Ausschau. Manchmal sieht er den Fuchs, manchmal nicht. Er schreibt alles in ein kleines Heft: Datum, Uhrzeit und was der Fuchs gemacht hat.`, `
    Wo sieht Tarek den Fuchs?|In einem kleinen Park.
    Warum leben Füchse auch in Städten?|Sie finden dort genug Futter und viele Verstecke.
    Was darf man mit Füchsen nicht machen?|Man darf sie nicht füttern und nicht anfassen.
    Was schreibt Tarek in sein Heft?|Datum, Uhrzeit und was der Fuchs gemacht hat.`);
  g('g34-zeitmaschine', 'Die Zeitmaschine', 'fantasie', 'Zeitmaschine, Ritter, Burg, Fantasie', `
    In Moritz' Keller steht ein alter Schrank mit vielen Knöpfen. Als Moritz einen roten Knopf drückt, beginnt der Schrank zu summen. Alles dreht sich.
    Als Moritz die Tür öffnet, steht er im Hof einer Burg. Ritter in glänzenden Rüstungen laufen herum. Ein Junge in seinem Alter schaut ihn mit großen Augen an. „Was trägst du denn für seltsame Schuhe?“, fragt er. Moritz schaut auf seine Turnschuhe und muss grinsen.
    Die beiden verbringen den Nachmittag zusammen. Der Junge zeigt ihm die Pferde und den hohen Turm. Dann ruft Mama von weit her: „Moritz, Abendessen!“ Schnell springt Moritz zurück in den Schrank. War das alles nur ein Traum?`, `
    Was steht in Moritz' Keller?|Ein alter Schrank mit vielen Knöpfen.
    Wo landet Moritz?|Im Hof einer Burg.
    Worüber wundert sich der Junge?|Über Moritz' Turnschuhe.
    Was zeigt der Junge Moritz?|Die Pferde und den hohen Turm.`);
  g('g34-backtag', 'Der Kuchenbasar', 'schule', 'Kuchen, Basar, Spende, Klasse, Geld', `
    Die Klasse 3b möchte Geld für neue Spielgeräte sammeln. Deshalb veranstaltet sie einen Kuchenbasar. Jedes Kind bringt etwas mit: Muffins, Zitronenkuchen, Kekse und eine riesige Schokotorte.
    In der großen Pause bauen die Kinder einen Tisch vor dem Klassenzimmer auf. Ein Stück Kuchen kostet einen Euro, ein Keks fünfzig Cent. Schnell bildet sich eine lange Schlange.
    Am Ende zählen die Kinder das Geld. Es sind 143 Euro und 50 Cent! Davon kaufen sie ein Springseil, drei Bälle und ein Federballspiel.`, `
    Wofür sammelt die Klasse Geld?|Für neue Spielgeräte.
    Was kostet ein Stück Kuchen?|Einen Euro.
    Wie viel Geld kommt zusammen?|143 Euro und 50 Cent.
    Was kaufen die Kinder?|Ein Springseil, drei Bälle und ein Federballspiel.`);
  g('g34-verlaufen', 'Verlaufen im Kaufhaus', 'gefuehle', 'Angst, verlaufen, Hilfe, Kaufhaus', `
    Samstags ist das Kaufhaus voller Menschen. Mila schaut sich bei den Spielsachen um. Als sie sich umdreht, ist ihr Papa verschwunden. Ihr Herz klopft schnell.
    Mila erinnert sich an das, was Papa ihr gesagt hat: „Wenn du mich verlierst, bleib stehen oder geh zu einer Verkäuferin.“ Sie geht zur Kasse und erklärt einer Verkäuferin, was passiert ist.
    Die Verkäuferin sagt durch das Mikrofon: „Mila wartet an der Kasse bei den Spielwaren.“ Wenige Minuten später kommt Papa angelaufen. Er nimmt Mila fest in den Arm. „Das hast du ganz richtig gemacht“, sagt er.`, `
    Wo schaut sich Mila um?|Bei den Spielsachen.
    Was hat Papa ihr für so eine Situation geraten?|Stehen bleiben oder zu einer Verkäuferin gehen.
    Was sagt die Verkäuferin durch das Mikrofon?|Mila wartet an der Kasse bei den Spielwaren.`);
  g('g34-garten', 'Das Gemüsebeet', 'natur', 'Garten, Gemüse, Schulgarten, pflanzen, Geduld', `
    Im Frühling bekommt die Klasse 4a ein eigenes Beet im Schulgarten. Die Kinder lockern die Erde und säen Radieschen, Möhren und Salat. Jeden Tag gießt eine andere Gruppe.
    Nach einer Woche ist noch nichts zu sehen. „Das wächst nie“, schimpft Elias. Doch dann sprießen die ersten grünen Spitzen aus der Erde. Die Radieschen wachsen am schnellsten.
    Im Juni ernten die Kinder ihr Gemüse. Sie waschen es und machen einen großen Salat. „So gut hat Salat noch nie geschmeckt“, sagt Elias und nimmt sich ein zweites Mal.`, `
    Was säen die Kinder?|Radieschen, Möhren und Salat.
    Was sagt Elias nach einer Woche?|Das wächst nie.
    Welches Gemüse wächst am schnellsten?|Die Radieschen.
    Was machen die Kinder aus dem Gemüse?|Einen großen Salat.`);
  g('g34-hamster', 'Wo ist Hamster Hugo?', 'tiere', 'Hamster, suchen, Haustier, Detektiv', `
    Am Morgen ist der Käfig leer. Hamster Hugo ist ausgebüxt! Paula sucht unter dem Bett, hinter dem Schrank und in allen Schuhen. Nichts.
    Dann hat sie eine Idee. Sie legt auf den Boden jedes Zimmers ein paar Sonnenblumenkerne. Daneben streut sie ein wenig Mehl. Am nächsten Morgen sieht sie nach. In der Küche sind die Kerne weg, und im Mehl sind winzige Pfotenabdrücke!
    Die Spur führt zum Küchenschrank. Ganz hinten, in einer Tüte mit Haferflocken, sitzt Hugo. Seine Backen sind dick und voll. Paula bringt ihn vorsichtig zurück in seinen Käfig.`, `
    Wo sucht Paula zuerst?|Unter dem Bett, hinter dem Schrank und in allen Schuhen.
    Was legt Paula in jedes Zimmer?|Sonnenblumenkerne und daneben etwas Mehl.
    Wie findet sie heraus, wo Hugo ist?|Durch Pfotenabdrücke im Mehl in der Küche.
    Wo sitzt Hugo?|In einer Tüte mit Haferflocken im Küchenschrank.`);
  g('g34-regenwald-ref', 'Das Referat', 'schule', 'Referat, Angst, vortragen, Mut', `
    Morgen soll Yusuf ein Referat über Wale halten. Er hat Bilder ausgedruckt und ein Plakat gestaltet. Trotzdem kann er abends nicht einschlafen. Was, wenn er alles vergisst?
    Seine große Schwester hilft ihm. Er übt das Referat dreimal vor ihr. Sie sagt: „Schreib dir die wichtigsten Wörter auf kleine Karten. Dann kannst du immer nachschauen.“
    Am nächsten Tag zittern Yusufs Hände ein bisschen. Doch mit den Karten klappt alles. Die Klasse stellt viele Fragen, und Yusuf kann alle beantworten. Am Ende klatschen alle.`, `
    Worüber hält Yusuf ein Referat?|Über Wale.
    Warum kann Yusuf nicht einschlafen?|Er hat Angst, dass er alles vergisst.
    Welchen Tipp gibt ihm seine Schwester?|Die wichtigsten Wörter auf kleine Karten schreiben.
    Wie reagiert die Klasse am Ende?|Alle klatschen.`);
  g('g34-schneesturm', 'Eingeschneit', 'jahreszeiten', 'Winter, Schnee, Sturm, Familie, Spiele', `
    In der Nacht hat es so viel geschneit, dass die Haustür kaum aufgeht. Die Straßen sind gesperrt, und die Schule fällt aus. Auch der Strom ist weg.
    Zuerst ist Lukas enttäuscht, denn ohne Strom gibt es kein Fernsehen. Doch Mama holt Kerzen und eine alte Spielesammlung aus dem Schrank. Papa kocht auf dem Gasherd heiße Schokolade.
    Den ganzen Tag spielen sie Karten und Brettspiele. Am Abend erzählt Papa Geschichten aus seiner Kindheit. Als der Strom zurückkommt, sagt Lukas: „Schade eigentlich.“`, `
    Warum fällt die Schule aus?|Es hat so viel geschneit, dass die Straßen gesperrt sind.
    Was holt Mama aus dem Schrank?|Kerzen und eine alte Spielesammlung.
    Was macht die Familie den ganzen Tag?|Sie spielt Karten und Brettspiele.
    Was sagt Lukas, als der Strom zurückkommt?|Schade eigentlich.`);
  g('g34-flohmarkt', 'Der Flohmarkt', 'alltag', 'Flohmarkt, verkaufen, Geld, Spielzeug', `
    Annika und ihr Freund Jonte wollen auf dem Flohmarkt alte Spielsachen verkaufen. Sie packen Bücher, Puzzles, Kuscheltiere und ein ferngesteuertes Auto in eine Kiste.
    Am Samstag stehen sie früh auf und bauen ihren Stand auf. Die ersten Kunden handeln. „Zwei Euro für das Puzzle?“, fragt eine Frau. „Einverstanden“, sagt Annika.
    Gegen Mittag ist fast alles verkauft. Mit dem Geld kaufen sich die beiden ein Eis. Den Rest sparen sie für einen gemeinsamen Ausflug in den Kletterpark.`, `
    Was wollen Annika und Jonte verkaufen?|Alte Spielsachen.
    Wie viel bezahlt die Frau für das Puzzle?|Zwei Euro.
    Wofür sparen die beiden den Rest?|Für einen Ausflug in den Kletterpark.`);
  g('g34-baumhaus', 'Das Baumhaus', 'freundschaft', 'Baumhaus, bauen, Freunde, Streit, Versöhnung', `
    Mats und Elif bauen im Garten ein Baumhaus. Mats will ein Dach aus Brettern, Elif will lieber eine Plane. Sie streiten so heftig, dass Elif wütend nach Hause geht.
    Am nächsten Tag arbeitet Mats allein. Doch ohne Elif macht es keinen Spaß. Er kann die schweren Bretter auch kaum allein hochheben. Am Nachmittag klingelt er bei ihr.
    „Wir könnten beides nehmen“, schlägt Mats vor, „Bretter für das Dach und die Plane für die Seite, damit es nicht hineinregnet.“ Elif grinst. Eine Woche später ist das Baumhaus fertig. Über der Tür hängt ein Schild: „Für Mats und Elif – Eintritt nur für Freunde“.`, `
    Worüber streiten Mats und Elif?|Über das Dach: Bretter oder Plane.
    Warum macht Mats das Bauen allein keinen Spaß?|Ohne Elif ist es langweilig und die Bretter sind zu schwer.
    Welche Lösung schlägt Mats vor?|Bretter für das Dach und die Plane für die Seite.
    Was steht auf dem Schild?|Für Mats und Elif – Eintritt nur für Freunde.`);
  g('g34-bienen', 'Ein Hotel für Insekten', 'natur', 'Insektenhotel, Bienen, bauen, Natur', `
    Im Sachunterricht lernt die Klasse 3a, dass es immer weniger Wildbienen gibt. Viele finden keinen Platz mehr für ihre Eier. Die Kinder wollen helfen und bauen ein Insektenhotel.
    Sie sammeln Schilfrohr, Tannenzapfen und Holzstücke. In die Holzstücke bohrt der Hausmeister kleine Löcher. Alles kommt in einen Holzkasten mit einem kleinen Dach.
    Das Insektenhotel hängt an einer sonnigen Stelle im Schulgarten. Schon nach zwei Wochen sind einige Löcher mit Lehm verschlossen. „Da hat eine Wildbiene ihre Eier hineingelegt“, erklärt die Lehrerin.`, `
    Warum bauen die Kinder ein Insektenhotel?|Viele Wildbienen finden keinen Platz mehr für ihre Eier.
    Was sammeln die Kinder?|Schilfrohr, Tannenzapfen und Holzstücke.
    Wo hängt das Insektenhotel?|An einer sonnigen Stelle im Schulgarten.
    Was bedeuten die mit Lehm verschlossenen Löcher?|Eine Wildbiene hat ihre Eier hineingelegt.`);
  g('g34-fussball', 'Das wichtige Spiel', 'sport', 'Fußball, Mannschaft, Fairness, Verletzung', `
    Am Wochenende spielt Linas Fußballmannschaft im Finale. Es steht eins zu eins. Kurz vor Schluss stürmt Lina auf das Tor zu. Da stolpert ein Junge aus der anderen Mannschaft und bleibt liegen.
    Lina könnte jetzt allein aufs Tor schießen. Doch sie schießt den Ball ins Aus, damit der Junge versorgt werden kann. Zum Glück ist nichts Schlimmes passiert.
    Das Spiel endet unentschieden, und es gibt ein Elfmeterschießen. Linas Mannschaft verliert knapp. Trotzdem bekommt Lina am Ende einen Pokal: den Fairnesspreis des Turniers.`, `
    Wie steht es kurz vor Schluss?|Eins zu eins.
    Warum schießt Lina den Ball ins Aus?|Ein Junge der anderen Mannschaft ist gestürzt und soll versorgt werden.
    Wer gewinnt das Elfmeterschießen?|Die andere Mannschaft.
    Welchen Preis bekommt Lina?|Den Fairnesspreis.`);
  g('g34-weihnachten', 'Ein Geschenk für Herrn Klein', 'feste', 'Weihnachten, Nachbar, allein, schenken', `
    Herr Klein wohnt im Erdgeschoss. Er ist schon sehr alt und bekommt selten Besuch. Im Dezember fällt Johanna auf, dass in seinem Fenster kein einziger Weihnachtsstern hängt.
    Mit ihrem Bruder bastelt sie Sterne aus Goldpapier. Mama backt Plätzchen. Am Heiligabend klingeln die Kinder bei Herrn Klein. Sie singen ein Lied und überreichen ihm die Sterne und eine Dose Plätzchen.
    Herr Klein hat Tränen in den Augen. „Ihr habt mir das schönste Geschenk gemacht“, sagt er. Seitdem besuchen ihn die Kinder jeden Sonntag. Er erzählt ihnen Geschichten von früher.`, `
    Was fällt Johanna im Dezember auf?|In Herrn Kleins Fenster hängt kein Weihnachtsstern.
    Was bringen die Kinder Herrn Klein?|Sterne aus Goldpapier und eine Dose Plätzchen.
    Wie reagiert Herr Klein?|Er hat Tränen in den Augen und freut sich sehr.
    Was passiert seitdem jeden Sonntag?|Die Kinder besuchen Herrn Klein.`);
  g('g34-detektiv', 'Wer hat die Kreide genommen?', 'abenteuer', 'Detektiv, Rätsel, Klasse, Spuren', `
    Seit drei Tagen verschwindet in der Klasse 4b jeden Morgen die Kreide. Frau Sommer ist ratlos. Die Kinder gründen einen Detektivclub.
    Ole schaut sich den Tafelrand genau an. Dort findet er kleine weiße Krümel und eine Feder. Mia bemerkt, dass das Fenster morgens immer gekippt ist. „Vielleicht war es kein Mensch“, überlegt sie.
    Am nächsten Morgen verstecken sich die Detektive hinter dem Schrank. Kurz vor acht landet eine Elster auf dem Fensterbrett. Sie hüpft zur Tafel, schnappt sich ein Stück Kreide und fliegt davon. Die Kinder lachen. Ab jetzt bleibt das Fenster geschlossen.`, `
    Was verschwindet jeden Morgen?|Die Kreide.
    Was findet Ole am Tafelrand?|Weiße Krümel und eine Feder.
    Wer ist der Dieb?|Eine Elster.
    Was wird ab jetzt anders gemacht?|Das Fenster bleibt geschlossen.`);
  g('g34-ferien-meer', 'Sommer am Meer', 'jahreszeiten', 'Ferien, Meer, Sandburg, Flut', `
    In den Sommerferien fährt Familie Novak an die Nordsee. Am ersten Tag baut Sofie mit ihrem kleinen Bruder eine riesige Sandburg mit Türmen, Mauern und einem Graben.
    Am Nachmittag kommt das Wasser näher. „Das ist die Flut“, erklärt Papa. „Zweimal am Tag steigt das Meer, und zweimal sinkt es wieder.“ Die Kinder bauen schnell eine dicke Mauer vor ihre Burg.
    Doch das Wasser ist stärker. Welle um Welle frisst sich in die Mauer. Am Ende bleibt nur ein kleiner Hügel übrig. Sofie ist nicht traurig. „Morgen bauen wir eine noch größere“, sagt sie.`, `
    Wohin fährt Familie Novak?|An die Nordsee.
    Was baut Sofie mit ihrem Bruder?|Eine riesige Sandburg.
    Was erklärt Papa über die Flut?|Zweimal am Tag steigt das Meer und zweimal sinkt es wieder.
    Was plant Sofie für morgen?|Eine noch größere Sandburg zu bauen.`);
  g('g34-roboter', 'Robbi räumt auf', 'lustig', 'Roboter, aufräumen, Zimmer, Chaos', `
    Theo hasst Aufräumen. Deshalb baut er sich aus Bausteinen, einem Motor und zwei Greifarmen einen Roboter. Er nennt ihn Robbi.
    Robbi soll Theos Zimmer aufräumen. Theo drückt auf den Startknopf. Robbi rollt los, schnappt sich die Socken – und wirft sie ins Aquarium. Die Bücher landen im Papierkorb, die Legosteine im Bett.
    Als Mama ins Zimmer kommt, ist es unordentlicher als je zuvor. Theo seufzt und räumt alles selbst auf. Robbi bekommt einen neuen Job: Er darf jetzt Theos Wecker sein.`, `
    Warum baut Theo einen Roboter?|Weil er Aufräumen hasst.
    Wohin wirft Robbi die Socken?|Ins Aquarium.
    Welchen neuen Job bekommt Robbi?|Er darf Theos Wecker sein.`);
  g('g34-umzug', 'Die neue Stadt', 'gefuehle', 'Umzug, neu, Heimweh, Freundschaft', `
    Nach dem Umzug fühlt sich Jasmin fremd. Die Straßen sehen anders aus, und in der neuen Schule kennt sie niemanden. Abends vermisst sie ihre alte Freundin Merle.
    In der ersten Woche sitzt sie in der Pause allein auf einer Bank. Dann setzt sich ein Mädchen mit einem Zeichenblock neben sie. Es zeichnet Pferde. „Ich zeichne auch gern Pferde“, sagt Jasmin leise.
    Das Mädchen heißt Ronja. Die beiden zeichnen jetzt jede Pause zusammen. Mit Merle telefoniert Jasmin trotzdem jeden Sonntag. „Man kann zwei beste Freundinnen haben“, sagt Mama.`, `
    Warum fühlt sich Jasmin fremd?|Sie ist umgezogen und kennt niemanden.
    Wen vermisst Jasmin?|Ihre alte Freundin Merle.
    Was zeichnet Ronja?|Pferde.
    Was sagt Mama am Ende?|Man kann zwei beste Freundinnen haben.`);
  g('g34-wetter', 'Das Gewitter', 'jahreszeiten', 'Gewitter, Blitz, Donner, zählen, Sicherheit', `
    Nach einem heißen Tag ziehen am Abend dunkle Wolken auf. Bald zuckt der erste Blitz über den Himmel. Felix zuckt zusammen. Kurz danach grollt der Donner.
    Opa zeigt ihm einen Trick: „Zähl die Sekunden zwischen Blitz und Donner. Teile die Zahl durch drei. Dann weißt du ungefähr, wie viele Kilometer das Gewitter entfernt ist.“
    Felix zählt: neun Sekunden. Das Gewitter ist also etwa drei Kilometer weit weg. Beim nächsten Blitz sind es nur sechs Sekunden. „Es kommt näher“, sagt Felix. Er ist froh, dass sie gemütlich im Haus sitzen.`, `
    Was zeigt Opa Felix?|Wie man ausrechnet, wie weit ein Gewitter entfernt ist.
    Wie viele Sekunden zählt Felix beim ersten Mal?|Neun Sekunden.
    Wie weit ist das Gewitter dann ungefähr entfernt?|Etwa drei Kilometer.
    Woran merkt Felix, dass das Gewitter näher kommt?|Die Zeit zwischen Blitz und Donner wird kürzer.`);
  g('g34-bibliothek', 'Das verschwundene Buch', 'schule', 'Buch, Bücherei, lesen, Verantwortung', `
    Lea hat sich in der Schulbücherei ein Buch über Pferde ausgeliehen. Nach zwei Wochen soll sie es zurückbringen. Doch es ist nicht mehr da.
    Lea sucht überall. Sie hat Angst, es der Büchereifrau zu sagen. Schließlich erzählt sie ihrer Mutter davon. „Am besten sagst du es ehrlich“, rät die Mutter. „Gemeinsam finden wir eine Lösung.“
    Lea geht in die Bücherei und erklärt alles. Die Büchereifrau ist gar nicht böse. „Danke, dass du ehrlich bist.“ Am Abend findet Lea das Buch doch noch: Es lag im Auto unter dem Sitz. Am nächsten Morgen bringt sie es stolz zurück.`, `
    Worüber ist das Buch?|Über Pferde.
    Was rät Leas Mutter?|Es ehrlich zu sagen.
    Wie reagiert die Büchereifrau?|Sie ist nicht böse und bedankt sich für die Ehrlichkeit.
    Wo lag das Buch?|Im Auto unter dem Sitz.`);
  g('g34-papagei', 'Der sprechende Papagei', 'lustig', 'Papagei, sprechen, lustig, Haustier', `
    Tante Rosa hat einen Papagei namens Coco. Coco kann sprechen. Er sagt „Hallo“, „Tschüss“ und „Wo ist mein Keks?“.
    Als Mats die Tante besucht, klingelt das Telefon. „Ja, bitte?“, ruft Coco. Die Tante muss lachen. Später klopft der Briefträger. „Herein!“, krächzt Coco. Der Briefträger öffnet die Tür und wundert sich, dass niemand da ist.
    Am Abend fragt Mats: „Wie hat Coco das alles gelernt?“ Tante Rosa zwinkert. „Er hört einfach immer gut zu. Genau wie du.“`, `
    Wie heißt der Papagei?|Coco.
    Was ruft Coco, als das Telefon klingelt?|Ja, bitte?
    Warum wundert sich der Briefträger?|Niemand ist da, obwohl jemand „Herein!“ gerufen hat.`);
  g('g34-wolkenkratzer', 'Ganz oben', 'abenteuer', 'Höhe, Turm, Angst, Aussicht, Mut', `
    In den Ferien besucht Can mit seiner Familie einen hohen Aussichtsturm. Bis zur Spitze führen 286 Stufen. Can zählt mit, doch bei Stufe 150 bekommt er weiche Knie. Durch die Gitter sieht er, wie hoch sie schon sind.
    „Schau nicht nach unten, schau auf die nächste Stufe“, sagt seine Mutter. Can atmet tief durch. Stufe für Stufe geht er weiter.
    Oben pfeift der Wind. Doch die Aussicht ist wunderbar. Can sieht Felder, Dörfer, einen Fluss und am Horizont die Berge. „Gut, dass ich nicht umgekehrt bin“, denkt er stolz.`, `
    Wie viele Stufen hat der Turm?|286 Stufen.
    Was rät die Mutter Can?|Nicht nach unten zu schauen, sondern auf die nächste Stufe.
    Was sieht Can von oben?|Felder, Dörfer, einen Fluss und die Berge.`);
  g('g34-kochen', 'Das Überraschungsessen', 'familie', 'kochen, Überraschung, Mama, Küche', `
    Mama hat Geburtstag. Lars und seine Schwester Pia wollen sie mit einem Essen überraschen. Papa hilft ihnen. Es soll Nudeln mit Tomatensoße und einen Obstsalat geben.
    Pia schneidet Äpfel, Bananen und Trauben in kleine Stücke. Lars rührt die Soße. Plötzlich riecht es angebrannt! Die Soße klebt am Topfboden. Papa bleibt ruhig: „Wir retten den oberen Teil und würzen nach.“
    Als Mama nach Hause kommt, ist der Tisch gedeckt, und überall stehen Blumen. Die Soße schmeckt ein klein wenig rauchig. „Das ist das beste Essen seit Jahren“, sagt Mama und lacht.`, `
    Warum wollen Lars und Pia kochen?|Mama hat Geburtstag.
    Was soll es zu essen geben?|Nudeln mit Tomatensoße und einen Obstsalat.
    Was passiert mit der Soße?|Sie brennt an.
    Was sagt Mama über das Essen?|Das ist das beste Essen seit Jahren.`);
  g('g34-wal', 'Die Walbeobachtung', 'tiere', 'Wal, Meer, Boot, Natur', `
    Im Urlaub in Norwegen fährt Malte mit einem Boot aufs Meer hinaus. Die Kapitänin erzählt, dass hier im Sommer Wale nach Futter suchen.
    Lange passiert nichts. Malte ist schon ein bisschen enttäuscht. Plötzlich schießt neben dem Boot eine Wasserfontäne in die Höhe. Ein riesiger dunkler Rücken taucht auf. Dann hebt der Wal seine Schwanzflosse aus dem Wasser und taucht ab.
    „Jeder Wal hat ein anderes Muster auf der Schwanzflosse“, erklärt die Kapitänin. „Daran kann man ihn erkennen, so wie einen Menschen am Fingerabdruck.“ Malte macht schnell ein Foto.`, `
    Wo ist Malte im Urlaub?|In Norwegen.
    Was sieht Malte zuerst?|Eine Wasserfontäne.
    Woran kann man einen Wal erkennen?|Am Muster auf seiner Schwanzflosse.`);
  g('g34-fasching', 'Die Verkleidung', 'feste', 'Fasching, Verkleidung, Kostüm, Idee', `
    Am Faschingsdienstag gibt es in der Schule ein Fest. Alle verkleiden sich. Nur Ida hat noch kein Kostüm. Ihr altes Prinzessinnenkleid ist zu klein.
    Am Abend vorher hat sie eine Idee. Sie klebt Zeitungsseiten auf ein altes T-Shirt und schreibt mit dickem Stift Schlagzeilen darauf: „Ida erfindet fliegende Schuhe!“, „Schule heute ohne Hausaufgaben!“. Dazu setzt sie eine Papiermütze auf.
    In der Schule bleiben alle vor ihr stehen und lesen ihr Kostüm. „Was bist du denn?“, fragt ein Junge. Ida grinst: „Die Nachrichten von morgen!“ Beim Kostümwettbewerb gewinnt sie den ersten Preis.`, `
    Warum hat Ida kein Kostüm?|Ihr altes Prinzessinnenkleid ist zu klein.
    Woraus macht Ida ihr Kostüm?|Aus Zeitungsseiten auf einem alten T-Shirt.
    Was ist Ida?|Die Nachrichten von morgen.
    Was gewinnt Ida?|Den ersten Preis beim Kostümwettbewerb.`);
  g('g34-strom', 'Die Stromdetektive', 'natur', 'Strom, sparen, Umwelt, Familie, Detektiv', `
    In der Schule hat Leni gelernt, wie man Strom sparen kann. Zu Hause gründet sie mit ihrem Bruder die „Stromdetektive“. Eine Woche lang suchen sie nach Stromfressern.
    Sie finden einiges: Im Wohnzimmer leuchtet die ganze Nacht ein kleines rotes Licht am Fernseher. Im Flur brennt Licht, obwohl niemand dort ist. Und das Ladegerät steckt in der Steckdose, auch wenn kein Handy daran hängt.
    Die Detektive kleben kleine Zettel an jeden Schalter: „Licht aus!“. Für den Fernseher kauft Papa eine Steckerleiste mit Schalter. Nach einem Monat zeigt die Stromrechnung: Die Familie hat wirklich gespart.`, `
    Was haben Leni und ihr Bruder gegründet?|Die „Stromdetektive“.
    Welche Stromfresser finden sie?|Das rote Licht am Fernseher, Licht im leeren Flur und ein Ladegerät ohne Handy.
    Was kauft Papa?|Eine Steckerleiste mit Schalter.
    Was zeigt die Stromrechnung?|Die Familie hat Strom gespart.`);
})(typeof window !== 'undefined' ? window : globalThis);
