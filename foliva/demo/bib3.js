/* Foliva – Bibliothek: Märchen und Fabeln, für Foliva frei nacherzählt · © 2026 theis
   Vorlagen gemeinfrei: Kinder- und Hausmärchen der Brüder Grimm, Hans Christian Andersen, Fabeln nach Äsop.
   Die Nacherzählungen sind eigene, kindgerecht gekürzte Fassungen. */
(function (root) {
  'use strict';
  const B = root.FolivaBib = root.FolivaBib || { texte: [] };
  const m = (id, quelle, title, author, stufe, tags, text, fragen) => B.texte.push({ id, quelle, title, author, theme: quelle === 'fabeln' ? 'tiere' : 'fantasie', stufe, tags, text: text.trim().replace(/\n\s+/g, '\n'), fragen: fragen.trim().replace(/\n\s+/g, '\n') });

  /* ---------- Märchen ---------- */
  m('m-rotkaeppchen', 'maerchen', 'Rotkäppchen', 'nacherzählt nach den Brüdern Grimm', '12', 'Märchen, Wolf, Großmutter, Wald', `
    Es war einmal ein Mädchen, das trug immer eine rote Kappe. Darum nannten es alle Rotkäppchen.
    Eines Tages sollte Rotkäppchen der kranken Großmutter Kuchen und Saft bringen. Die Mutter sagte: „Bleib auf dem Weg!“ Doch im Wald traf Rotkäppchen den Wolf. Er zeigte ihm die schönen Blumen am Wegrand. Während Rotkäppchen Blumen pflückte, lief der Wolf zur Großmutter und verschluckte sie. Dann legte er sich in ihr Bett.
    Als Rotkäppchen kam, wunderte es sich: „Großmutter, was hast du für große Ohren!“ – „Damit ich dich besser hören kann.“ – „Was hast du für ein großes Maul!“ – „Damit ich dich besser fressen kann!“ Und schon hatte er auch Rotkäppchen verschluckt.
    Ein Jäger hörte den Wolf schnarchen. Er schnitt ihm den Bauch auf, und Rotkäppchen und die Großmutter sprangen heraus. Rotkäppchen nahm sich vor, nie wieder vom Weg abzugehen.`, `
    Warum heißt das Mädchen Rotkäppchen?|Es trägt immer eine rote Kappe.
    Was sagt die Mutter zu Rotkäppchen?|Bleib auf dem Weg!
    Wer rettet Rotkäppchen und die Großmutter?|Ein Jäger.
    Was nimmt sich Rotkäppchen am Ende vor?|Nie wieder vom Weg abzugehen.`);
  m('m-suesser-brei', 'maerchen', 'Der süße Brei', 'nacherzählt nach den Brüdern Grimm', '12', 'Märchen, Brei, Topf, Zauberspruch', `
    Es war einmal ein armes Mädchen. Es lebte mit seiner Mutter, und sie hatten nichts mehr zu essen. Im Wald schenkte eine alte Frau dem Mädchen ein Töpfchen. Sie sagte: „Wenn du sprichst: Töpfchen, koche!, dann kocht es süßen Hirsebrei. Und wenn du sagst: Töpfchen, steh!, dann hört es wieder auf.“
    Nun hatten Mutter und Tochter immer genug zu essen. Einmal war das Mädchen fort. Da sprach die Mutter: „Töpfchen, koche!“ Es kochte, und die Mutter aß sich satt. Doch sie wusste das Wort zum Aufhören nicht.
    Der Brei lief über den Herd, durch die Küche, in die Straße und bald durch die ganze Stadt. Erst als das Mädchen heimkam und sprach: „Töpfchen, steh!“, hörte es auf. Wer in die Stadt wollte, musste sich durchessen.`, `
    Was schenkt die alte Frau dem Mädchen?|Ein Töpfchen, das süßen Brei kocht.
    Wie lautet der Spruch zum Aufhören?|Töpfchen, steh!
    Warum läuft der Brei durch die Stadt?|Die Mutter kennt das Wort zum Aufhören nicht.`);
  m('m-sterntaler', 'maerchen', 'Die Sterntaler', 'nacherzählt nach den Brüdern Grimm', '12', 'Märchen, teilen, arm, Sterne', `
    Es war einmal ein kleines Mädchen. Es hatte keine Eltern mehr und war so arm, dass es nur noch die Kleider am Leib und ein Stückchen Brot besaß.
    Auf seinem Weg traf es einen hungrigen Mann. Das Mädchen gab ihm sein Brot. Dann kam ein Kind, das am Kopf fror. Das Mädchen schenkte ihm seine Mütze. Einem anderen Kind gab es sein Jäckchen und noch einem sein Röckchen.
    Am Abend kam es in einen Wald. Ein Kind bat um sein Hemdchen. Das Mädchen dachte: „Es ist dunkel, da sieht mich niemand.“ Und es gab auch sein Hemd weg.
    Da fielen plötzlich die Sterne vom Himmel. Es waren lauter blanke Taler aus Gold. Und das Mädchen hatte ein neues Hemd aus feinstem Stoff an. Es sammelte die Taler und war reich für sein Leben lang.`, `
    Was gibt das Mädchen dem hungrigen Mann?|Sein Brot.
    Warum gibt das Mädchen im Wald auch sein Hemd weg?|Es ist dunkel, da sieht es niemand.
    Was fällt am Ende vom Himmel?|Goldene Taler.`);
  m('m-geisslein', 'maerchen', 'Der Wolf und die sieben Geißlein', 'nacherzählt nach den Brüdern Grimm', '12', 'Märchen, Wolf, Ziege, List', `
    Eine alte Geiß hatte sieben junge Geißlein. Eines Tages musste sie in den Wald, um Futter zu holen. Sie warnte die Kinder: „Lasst den Wolf nicht herein! Ihr erkennt ihn an seiner rauen Stimme und an seinen schwarzen Pfoten.“
    Bald klopfte der Wolf. Doch die Geißlein hörten die raue Stimme. Da fraß der Wolf Kreide, damit seine Stimme fein wurde. Und er ließ sich vom Bäcker Teig und vom Müller Mehl auf die Pfoten streichen. Nun öffneten die Geißlein die Tür. Der Wolf verschluckte sechs von ihnen. Nur das jüngste versteckte sich im Uhrkasten.
    Als die Mutter heimkam, fanden sie den Wolf schlafend auf der Wiese. Die Geiß schnitt ihm den Bauch auf, und alle sechs Geißlein sprangen heraus. Sie füllten den Bauch mit Steinen. Als der Wolf am Brunnen trinken wollte, zogen ihn die Steine hinein.`, `
    Woran sollen die Geißlein den Wolf erkennen?|An seiner rauen Stimme und an seinen schwarzen Pfoten.
    Was macht der Wolf, damit seine Stimme fein wird?|Er frisst Kreide.
    Wo versteckt sich das jüngste Geißlein?|Im Uhrkasten.
    Womit füllen sie den Bauch des Wolfes?|Mit Steinen.`);
  m('m-bremer', 'maerchen', 'Die Bremer Stadtmusikanten', 'nacherzählt nach den Brüdern Grimm', '34', 'Märchen, Tiere, Räuber, Musik, Freundschaft', `
    Ein Esel war alt geworden und konnte keine schweren Säcke mehr tragen. Sein Herr wollte ihn nicht mehr füttern. Da lief der Esel fort. Er wollte nach Bremen gehen und dort Stadtmusikant werden.
    Unterwegs traf er einen alten Hund, eine Katze und einen Hahn. Alle hatten das gleiche Schicksal: Ihre Besitzer brauchten sie nicht mehr. „Kommt mit nach Bremen!“, rief der Esel. „Etwas Besseres als den Tod findet ihr überall.“
    In der Nacht kamen sie an ein Haus im Wald. Darin saßen Räuber an einem gedeckten Tisch. Die Tiere stellten sich übereinander: der Hund auf den Esel, die Katze auf den Hund und der Hahn ganz oben. Dann machten sie zusammen Musik: Der Esel schrie, der Hund bellte, die Katze miaute und der Hahn krähte. Sie stürzten durchs Fenster in die Stube.
    Die Räuber flohen voller Angst in den Wald. Die vier Tiere aßen sich satt. Und weil es ihnen in dem Haus so gut gefiel, blieben sie dort für immer.`, `
    Warum läuft der Esel fort?|Er ist alt und sein Herr will ihn nicht mehr füttern.
    Welche Tiere trifft der Esel unterwegs?|Einen Hund, eine Katze und einen Hahn.
    Wie vertreiben die Tiere die Räuber?|Sie stellen sich übereinander, machen laut Musik und stürzen durchs Fenster.
    Kommen die Tiere in Bremen an?|Nein, sie bleiben im Haus im Wald.`);
  m('m-haensel', 'maerchen', 'Hänsel und Gretel', 'nacherzählt nach den Brüdern Grimm', '34', 'Märchen, Hexe, Wald, Geschwister, Mut', `
    Hänsel und Gretel waren die Kinder eines armen Holzfällers. Als die Not groß war, ließen die Eltern sie im Wald zurück. Hänsel hatte heimlich Brotkrumen auf den Weg gestreut. Doch die Vögel pickten sie auf, und die Kinder fanden nicht mehr nach Hause.
    Nach drei Tagen kamen sie an ein Häuschen aus Brot, mit einem Dach aus Kuchen und Fenstern aus Zucker. Hungrig knabberten sie daran. Da trat eine alte Frau heraus. Sie war freundlich und gab ihnen zu essen. Doch in Wahrheit war sie eine böse Hexe.
    Sie sperrte Hänsel in einen Stall, um ihn zu mästen. Gretel musste kochen und putzen. Eines Tages sollte Gretel in den Ofen schauen, ob er heiß genug war. Gretel ahnte, was die Hexe vorhatte. „Ich weiß nicht, wie das geht“, sagte sie. Als die Hexe es ihr zeigen wollte und den Kopf hineinsteckte, stieß Gretel sie hinein und schlug die Tür zu.
    Sie befreite Hänsel. Im Haus fanden sie Perlen und Edelsteine. Mit ihnen fanden die Kinder den Weg nach Hause, wo der Vater sie glücklich in die Arme schloss.`, `
    Warum finden die Kinder nicht mehr nach Hause?|Die Vögel haben die Brotkrumen aufgepickt.
    Woraus ist das Häuschen?|Aus Brot, das Dach aus Kuchen und die Fenster aus Zucker.
    Wie überlistet Gretel die Hexe?|Sie tut so, als wüsste sie nicht, wie man in den Ofen schaut, und stößt die Hexe hinein.
    Was finden die Kinder im Haus der Hexe?|Perlen und Edelsteine.`);
  m('m-frau-holle', 'maerchen', 'Frau Holle', 'nacherzählt nach den Brüdern Grimm', '34', 'Märchen, Fleiß, Faulheit, Gold, Pech', `
    Eine Witwe hatte zwei Töchter. Die eine war fleißig, die andere faul. Die Fleißige musste alle Arbeit im Haus tun. Eines Tages fiel ihr die Spule in den Brunnen. Sie sprang hinterher und erwachte auf einer schönen Wiese.
    Sie kam an einen Backofen voller Brot. „Zieh uns heraus, sonst verbrennen wir!“, riefen die Brote. Das Mädchen holte sie heraus. Dann schüttelte es einen Apfelbaum, dessen Äpfel reif waren. Schließlich kam es zu Frau Holle. Bei ihr arbeitete es fleißig und schüttelte jeden Tag die Betten, dass die Federn flogen. Dann schneite es auf der Erde.
    Als das Mädchen nach Hause wollte, führte Frau Holle es durch ein Tor. Ein Goldregen fiel auf es herab. Da wollte auch die faule Schwester reich werden. Doch sie half weder den Broten noch dem Apfelbaum, und bei Frau Holle schüttelte sie die Betten nicht. Als sie durch das Tor ging, fiel ein Kessel Pech auf sie herab. Das Pech blieb an ihr hängen, solange sie lebte.`, `
    Was passiert, wenn das Mädchen die Betten schüttelt?|Auf der Erde schneit es.
    Wem hilft das fleißige Mädchen unterwegs?|Den Broten im Ofen und dem Apfelbaum.
    Was fällt auf das fleißige Mädchen herab?|Ein Goldregen.
    Was bekommt die faule Schwester?|Pech.`);
  m('m-rumpelstilzchen', 'maerchen', 'Rumpelstilzchen', 'nacherzählt nach den Brüdern Grimm', '34', 'Märchen, Name, Stroh, Gold, Rätsel', `
    Ein Müller prahlte vor dem König: „Meine Tochter kann Stroh zu Gold spinnen.“ Der König sperrte das Mädchen in eine Kammer voller Stroh. Bis zum Morgen sollte alles Gold sein. Das Mädchen weinte, denn es konnte das nicht.
    Da kam ein kleines Männchen herein. Für die Halskette des Mädchens spann es das Stroh zu Gold. In der zweiten Nacht bekam es einen Ring. In der dritten Nacht hatte das Mädchen nichts mehr. Da verlangte das Männchen das erste Kind, wenn sie Königin würde.
    Das Mädchen heiratete den König. Als ihr Kind geboren war, kam das Männchen. Die Königin bat und weinte. Da sagte es: „Wenn du in drei Tagen meinen Namen weißt, darfst du das Kind behalten.“
    Ein Bote hörte im Wald, wie ein Männchen ums Feuer sprang und sang: „Ach, wie gut, dass niemand weiß, dass ich Rumpelstilzchen heiß!“ Als die Königin den Namen sagte, stampfte das Männchen vor Wut so fest auf, dass es im Boden versank.`, `
    Was behauptet der Müller über seine Tochter?|Sie könne Stroh zu Gold spinnen.
    Was gibt das Mädchen dem Männchen in der ersten Nacht?|Ihre Halskette.
    Was muss die Königin herausfinden?|Den Namen des Männchens.
    Wie erfährt sie den Namen?|Ein Bote hört das Männchen im Wald singen.`);
  m('m-froschkoenig', 'maerchen', 'Der Froschkönig', 'nacherzählt nach den Brüdern Grimm', '34', 'Märchen, Frosch, Prinz, Versprechen', `
    Eine Königstochter spielte am Brunnen mit ihrer goldenen Kugel. Plötzlich fiel die Kugel ins Wasser. Die Prinzessin weinte. Da streckte ein Frosch seinen Kopf aus dem Brunnen. „Ich hole dir die Kugel“, sagte er, „wenn ich dein Freund sein darf, von deinem Teller essen und in deinem Bett schlafen darf.“
    Die Prinzessin versprach alles. Doch als sie die Kugel hatte, lief sie davon. Am nächsten Tag klopfte der Frosch an die Schlosstür. Der König sagte streng: „Was du versprochen hast, musst du auch halten.“
    Widerwillig ließ die Prinzessin den Frosch von ihrem Teller essen. Als er auch in ihrem Bett schlafen wollte, wurde sie wütend und warf ihn an die Wand. Da verwandelte er sich in einen Prinzen mit freundlichen Augen. Eine böse Hexe hatte ihn verzaubert. Bald darauf feierten die beiden Hochzeit.`, `
    Was fällt der Prinzessin in den Brunnen?|Ihre goldene Kugel.
    Was verlangt der Frosch?|Ihr Freund sein, von ihrem Teller essen und in ihrem Bett schlafen.
    Was sagt der König?|Was du versprochen hast, musst du auch halten.
    Was passiert, als die Prinzessin den Frosch an die Wand wirft?|Er verwandelt sich in einen Prinzen.`);
  m('m-entlein', 'maerchen', 'Das hässliche Entlein', 'nacherzählt nach Hans Christian Andersen', '34', 'Märchen, anders sein, Schwan, Mut', `
    Auf einem Bauernhof brütete eine Ente ihre Eier aus. Aus dem letzten, größten Ei schlüpfte ein graues, großes Küken. Es sah ganz anders aus als die anderen. „Wie hässlich!“, riefen die Hühner und die Enten. Sie hackten nach ihm und lachten es aus.
    Das Entlein war so traurig, dass es fortlief. Den ganzen Winter verbrachte es allein im Schilf. Es fror und hatte oft Hunger.
    Als der Frühling kam, sah es auf dem See wunderschöne weiße Vögel. Ängstlich schwamm es zu ihnen. Da sah es sein Spiegelbild im Wasser: Es war kein hässliches Entlein mehr, sondern selbst ein prächtiger Schwan! Die anderen Schwäne begrüßten es freundlich. Und Kinder am Ufer riefen: „Der Neue ist der schönste von allen!“`, `
    Warum wird das Küken ausgelacht?|Es sieht anders aus: grau und groß.
    Wo verbringt das Entlein den Winter?|Allein im Schilf.
    Was sieht es im Frühling in seinem Spiegelbild?|Dass es ein Schwan ist.`);
  m('m-kaiser', 'maerchen', 'Des Kaisers neue Kleider', 'nacherzählt nach Hans Christian Andersen', '34', 'Märchen, Ehrlichkeit, Kaiser, Betrug', `
    Es war einmal ein Kaiser, der liebte neue Kleider über alles. Eines Tages kamen zwei Betrüger in die Stadt. Sie behaupteten, sie könnten den schönsten Stoff der Welt weben. Das Besondere daran: Wer dumm sei oder für sein Amt nicht tauge, könne den Stoff nicht sehen.
    Der Kaiser gab ihnen viel Geld. Die Betrüger setzten sich an leere Webstühle und taten so, als würden sie arbeiten. Die Minister des Kaisers sahen nichts. Aber keiner wollte als dumm gelten. Darum lobten alle den herrlichen Stoff. Auch der Kaiser sah nichts und sagte trotzdem: „Wunderschön!“
    Bei einem großen Umzug zeigte sich der Kaiser in seinen neuen Kleidern. Alle Leute riefen: „Wie prächtig!“ Da sagte ein kleines Kind: „Aber er hat ja gar nichts an!“ Nun flüsterten es alle weiter, bis das ganze Volk rief: „Er hat ja gar nichts an!“`, `
    Was behaupten die Betrüger über den Stoff?|Wer dumm ist oder für sein Amt nicht taugt, kann ihn nicht sehen.
    Warum loben die Minister den Stoff?|Keiner will als dumm gelten.
    Wer sagt die Wahrheit?|Ein kleines Kind.`);
  m('m-hase-igel', 'maerchen', 'Der Hase und der Igel', 'nacherzählt nach den Brüdern Grimm', '34', 'Märchen, Wettlauf, List, Hase, Igel', `
    An einem Sonntagmorgen traf der Igel den Hasen auf dem Feld. Der Hase lachte über die krummen Beine des Igels. „Ich wette, ich bin schneller als du“, sagte der Igel. Der Hase lachte noch mehr, aber er nahm die Wette an.
    Der Igel lief schnell nach Hause und holte seine Frau. Sie sah genauso aus wie er. Er stellte sie unten an das Ende des Ackers. Er selbst ging zum Start.
    Der Hase rannte los, so schnell er konnte. Als er unten ankam, rief die Igelfrau: „Ich bin schon da!“ Der Hase konnte es nicht glauben. Er rannte zurück. Oben rief der Igel: „Ich bin schon da!“ So rannte der Hase dreiundsiebzigmal hin und her. Beim vierundsiebzigsten Mal brach er erschöpft zusammen. Der Igel aber hatte die Wette gewonnen.`, `
    Worüber lacht der Hase?|Über die krummen Beine des Igels.
    Wen holt der Igel zu Hilfe?|Seine Frau.
    Wie gewinnt der Igel die Wette?|Seine Frau steht am anderen Ende, und beide rufen „Ich bin schon da!“.`);

  /* ---------- Fabeln ---------- */
  m('f-rabe-fuchs', 'fabeln', 'Der Rabe und der Fuchs', 'nacherzählt nach Äsop', '34', 'Fabel, Schmeichelei, Käse, Lehre', `
    Ein Rabe hatte ein Stück Käse gestohlen. Er setzte sich damit auf einen hohen Ast. Ein Fuchs sah das und bekam Hunger. Er setzte sich unter den Baum und rief: „Was bist du für ein schöner Vogel! Deine Federn glänzen wie Seide. Wenn deine Stimme genauso schön ist, bist du der König aller Vögel.“
    Der Rabe fühlte sich geschmeichelt. Er wollte zeigen, wie schön er singen kann, und öffnete den Schnabel. Da fiel der Käse herunter. Der Fuchs schnappte ihn sich und lachte: „Schön bist du vielleicht. Aber klug bist du nicht.“
    Lehre: Wer sich gern schmeicheln lässt, wird leicht hereingelegt.`, `
    Was hat der Rabe im Schnabel?|Ein Stück Käse.
    Was sagt der Fuchs zum Raben?|Er lobt seine Federn und seine Stimme.
    Warum fällt der Käse herunter?|Der Rabe öffnet den Schnabel, um zu singen.
    Was ist die Lehre der Fabel?|Wer sich gern schmeicheln lässt, wird leicht hereingelegt.`);
  m('f-ameise-grille', 'fabeln', 'Die Ameise und die Grille', 'nacherzählt nach Äsop', '34', 'Fabel, Fleiß, Vorrat, Winter, Lehre', `
    Den ganzen Sommer über schleppte die Ameise Körner in ihren Bau. Die Grille saß in der Sonne und zirpte. „Warum arbeitest du bei diesem schönen Wetter?“, fragte sie. „Ich sammle Vorräte für den Winter“, antwortete die Ameise.
    Als der Winter kam, lag Schnee auf den Feldern. Die Grille fand nichts mehr zu essen. Hungrig klopfte sie bei der Ameise an. „Was hast du denn im Sommer gemacht?“, fragte die Ameise. „Ich habe gesungen“, sagte die Grille leise.
    Die Ameise gab ihr ein paar Körner. „Im nächsten Sommer hilfst du mir beim Sammeln“, sagte sie. Und die Grille nickte.
    Lehre: Wer rechtzeitig vorsorgt, muss später keine Not leiden.`, `
    Was macht die Ameise im Sommer?|Sie sammelt Körner als Vorrat für den Winter.
    Was macht die Grille im Sommer?|Sie sitzt in der Sonne und zirpt.
    Was verlangt die Ameise von der Grille?|Dass sie im nächsten Sommer beim Sammeln hilft.
    Was ist die Lehre?|Wer rechtzeitig vorsorgt, muss später keine Not leiden.`);
  m('f-loewe-maus', 'fabeln', 'Der Löwe und die Maus', 'nacherzählt nach Äsop', '12', 'Fabel, helfen, klein, groß, Lehre', `
    Ein Löwe schlief unter einem Baum. Eine kleine Maus lief über seine Nase. Der Löwe wachte auf und packte sie mit seiner Pranke. „Lass mich los“, bat die Maus. „Vielleicht kann ich dir einmal helfen.“ Der Löwe lachte, aber er ließ sie laufen.
    Einige Tage später geriet der Löwe in ein Netz von Jägern. Er brüllte laut. Die Maus hörte ihn. Sie lief zu ihm und nagte mit ihren scharfen Zähnen das Netz durch. Der Löwe war frei.
    Lehre: Auch die Kleinen können den Großen helfen.`, `
    Was macht die Maus, als der Löwe schläft?|Sie läuft über seine Nase.
    Wo gerät der Löwe hinein?|In ein Netz von Jägern.
    Wie hilft die Maus dem Löwen?|Sie nagt das Netz durch.
    Was ist die Lehre?|Auch die Kleinen können den Großen helfen.`);
  m('f-fuchs-trauben', 'fabeln', 'Der Fuchs und die Trauben', 'nacherzählt nach Äsop', '12', 'Fabel, Trauben, Ausrede, Lehre', `
    Ein hungriger Fuchs kam an einem Weinberg vorbei. Hoch oben hingen reife, süße Trauben. Der Fuchs sprang hoch, doch er erreichte sie nicht. Er sprang noch einmal und noch einmal. Es war zu hoch.
    Schließlich gab er auf. Er drehte sich um und sagte: „Die Trauben sind mir sowieso viel zu sauer.“ Dann ging er stolz davon.
    Lehre: Manche reden schlecht über das, was sie nicht bekommen können.`, `
    Was möchte der Fuchs haben?|Die Trauben.
    Warum bekommt er sie nicht?|Sie hängen zu hoch.
    Was sagt der Fuchs am Ende?|Die Trauben sind mir sowieso viel zu sauer.`);
  m('f-schildkroete-hase', 'fabeln', 'Die Schildkröte und der Hase', 'nacherzählt nach Äsop', '12', 'Fabel, Wettlauf, Ausdauer, Lehre', `
    Der Hase lachte über die langsame Schildkröte. Da sagte die Schildkröte: „Lass uns um die Wette laufen.“ Der Hase war einverstanden.
    Er rannte schnell davon. Bald war die Schildkröte weit hinter ihm. „Ich habe Zeit“, dachte der Hase und legte sich unter einen Baum. Er schlief ein.
    Die Schildkröte lief langsam, aber ohne Pause weiter. Sie lief am schlafenden Hasen vorbei. Als der Hase aufwachte, war die Schildkröte schon fast am Ziel. Er rannte los, doch es war zu spät. Die Schildkröte hatte gewonnen.
    Lehre: Wer langsam, aber stetig vorangeht, kommt auch ans Ziel.`, `
    Was schlägt die Schildkröte vor?|Ein Wettrennen.
    Warum legt sich der Hase unter den Baum?|Er glaubt, er hat genug Zeit.
    Wer gewinnt?|Die Schildkröte.
    Was ist die Lehre?|Wer langsam, aber stetig vorangeht, kommt auch ans Ziel.`);
  m('f-fuchs-storch', 'fabeln', 'Der Fuchs und der Storch', 'nacherzählt nach Äsop', '34', 'Fabel, Gast, Rache, Lehre', `
    Der Fuchs lud den Storch zum Essen ein. Er servierte eine Suppe auf einem flachen Teller. Der Fuchs schleckte die Suppe mit seiner Zunge auf. Der Storch aber konnte mit seinem langen Schnabel nichts aufnehmen. Hungrig ging er nach Hause.
    Ein paar Tage später lud der Storch den Fuchs ein. Er servierte das Essen in einer Vase mit einem langen, schmalen Hals. Der Storch steckte seinen Schnabel hinein und aß sich satt. Der Fuchs bekam nicht einen einzigen Bissen.
    „Ich habe dich so bewirtet, wie du mich bewirtet hast“, sagte der Storch.
    Lehre: Wie du mir, so ich dir.`, `
    Worauf serviert der Fuchs die Suppe?|Auf einem flachen Teller.
    Warum kann der Storch nichts essen?|Mit seinem langen Schnabel kann er vom flachen Teller nichts aufnehmen.
    Worin serviert der Storch das Essen?|In einer Vase mit langem, schmalem Hals.
    Was ist die Lehre?|Wie du mir, so ich dir.`);
  m('f-hirtenjunge', 'fabeln', 'Der Hirtenjunge und der Wolf', 'nacherzählt nach Äsop', '34', 'Fabel, Lüge, Wolf, Vertrauen, Lehre', `
    Ein Hirtenjunge hütete die Schafe in der Nähe eines Dorfes. Ihm war langweilig. Da rief er laut: „Hilfe, der Wolf kommt!“ Alle Leute aus dem Dorf rannten herbei. Doch da war kein Wolf. Der Junge lachte sie aus.
    Ein paar Tage später machte er es wieder. Wieder kamen alle angelaufen, und wieder war kein Wolf da.
    Eines Abends kam wirklich ein Wolf. Der Junge schrie: „Hilfe, der Wolf! Diesmal ist es wahr!“ Doch niemand kam. Die Leute dachten, er lüge wieder. Der Wolf riss viele Schafe.
    Lehre: Wer einmal lügt, dem glaubt man nicht, auch wenn er dann die Wahrheit spricht.`, `
    Warum ruft der Junge das erste Mal um Hilfe?|Ihm ist langweilig.
    Was passiert, als wirklich ein Wolf kommt?|Niemand kommt, weil die Leute denken, er lügt wieder.
    Was ist die Lehre?|Wer einmal lügt, dem glaubt man nicht, auch wenn er die Wahrheit spricht.`);
  m('f-stadtmaus', 'fabeln', 'Die Stadtmaus und die Feldmaus', 'nacherzählt nach Äsop', '34', 'Fabel, Stadt, Land, Zufriedenheit, Lehre', `
    Eine Stadtmaus besuchte ihre Freundin, die Feldmaus. Die Feldmaus bot ihr Körner, Wurzeln und Wasser an. „Wie langweilig du lebst!“, sagte die Stadtmaus. „Komm mit in die Stadt, da gibt es Käse, Kuchen und Speck.“
    In der Stadt schlichen die beiden in eine große Speisekammer. Gerade als sie zu essen begannen, ging die Tür auf. Die Köchin kam herein! Die Mäuse flüchteten in ein enges Loch. Kaum waren sie wieder draußen, schlich die Katze vorbei. Wieder mussten sie fliehen.
    Da sagte die Feldmaus: „Danke für die Einladung. Aber ich gehe lieber nach Hause. Lieber esse ich in Ruhe meine Körner, als in Angst Kuchen.“
    Lehre: Ein einfaches Leben in Ruhe ist mehr wert als Reichtum in Angst.`, `
    Was bietet die Feldmaus der Stadtmaus an?|Körner, Wurzeln und Wasser.
    Wer stört die Mäuse in der Stadt?|Die Köchin und die Katze.
    Warum geht die Feldmaus nach Hause?|Sie isst lieber in Ruhe ihre Körner als in Angst Kuchen.
    Was ist die Lehre?|Ein einfaches Leben in Ruhe ist mehr wert als Reichtum in Angst.`);
})(typeof window !== 'undefined' ? window : globalThis);
