/* Foliva – Grundwortschatz Bayern (LehrplanPLUS Grundschule, Deutsch, Lernbereich „Richtig schreiben“)
   Quelle: ISB / LehrplanPLUS, Ergänzende Informationen „Grundwortschatz für die Jahrgangsstufen 1 und 2“ und „3 und 4“
   (lehrplanplus.bayern.de, abgerufen am 13.10.2026). Gliederung nach Rechtschreibstrategien wie im Original.
   Einträge mit „–“ sind Wortfamilien bzw. Wortformen (z. B. „Baum – Bäume“). */
(function (root) {
  'use strict';
  const P = root.FolivaPools || (typeof require !== 'undefined' ? require('./bib-aufgaben.js') : {});
  const S = s => s.split(',').map(x => x.trim()).filter(Boolean);
  const GWS = {
    '12': [
      ['In Silben gegliedert mitsprechen', S('Aufgabe, Auge, Auto, blau, Blume, Blüte, böse, braun, Brot, Buch, bunt, Dose, Ende, Ente, Frau, Gemüse, grün, gut, Hase, Hose, Kiste, laut, Löwe, Name, Oma, Opa, Rabe, Raupe, rot, Salz, Schaf, Schere, schön, Schule, Tante, Telefon, Tomate, tun, weit, Wolf, Wolke')],
      ['Wörter mit er', S('Bruder, Feder, Fenster, Schwester, Winter')],
      ['Wörter mit el', S('dunkel, Esel, Gabel, Nadel, Nebel, Onkel, Pinsel, Wurzel')],
      ['Wörter mit en', S('baden, finden, haben, holen, hören, malen, rechnen, reden, Regen, rufen, suchen, wünschen')],
      ['Wörter mit Ei/ei', S('Ameise, Ei, Eis, fein, klein, leise, reisen, Seife, Zeit, zwei')],
      ['Wörter mit Eu/eu', S('Euro, Leute, neu')],
      ['Wörter mit ng', S('bringen, eng, Junge, Ring, singen')],
      ['Wörter mit nk', S('Bank, danken, denken, krank, trinken')],
      ['Wörter mit Sp/sp', S('sparen, spielen – spielt, Sport, sprechen – spricht')],
      ['Wörter mit St/st', S('Stein, Stern, Stunde')],
      ['Wörter mit ch', S('brauchen, hoch, leicht, machen, suchen, Woche')],
      ['Wörter mit Sch/sch', S('frisch, scheinen, schneiden, Tasche, Tisch')],
      ['Wörter mit Pf/pf', S('Kopf, Pflanze')],
      ['Wörter mit Qu', S('Quelle, Quadrat, Quatsch')],
      ['Wörter mit r nach Vokal', S('arbeiten, antworten, Birne, dürfen – darf, Garten, lernen, Partner, schwarz, turnen, warten, Wort')],
      ['Wörter mit ie', S('Biene, lieben, liegen, sieben, spielen, Wiese, Ziege')],
      ['Mitlautverdopplung', S('alle, Füller, Himmel, Klasse, können, müssen, Mutter, rollen, sollen, Sommer, Sonne, Wasser, wollen')],
      ['Umlautung', S('Apfel – Äpfel, Baum – Bäume, Gras – Gräser, Haus – Häuser, laufen – läuft, Maus – Mäuse, schlafen – schläft')],
      ['Verhärtung', S('Bild – Bilder, bleiben – bleibt, Bub – Buben, fragen – fragt, Freund – Freunde, geben – gibt, gelb – gelbe, gesund – gesunde, Hund – Hunde, Kind – Kinder, Kleid – Kleider, leben – lebt, legen – legt, Pferd – Pferde, sagen – sagt, schreiben – schreibt, Tag – Tage, üben – übt, Weg – Wege, Wind – Winde, zeigen – zeigt')],
      ['Häufigkeitswortschatz', S('aber, als, also, auf, aus, bei, da, das, der, des, dir, dich, die, doch, du, durch, er, es, für, her, hinter, ich, im, in, ist, ja, mit, nach, nein, nicht, nun, oder, schon, sie, sind, so, über, um, und, was, weil, weiter, wer, wir, wo')],
      ['ß, tz, ck', S('Fuß, groß, sitzen – sitzt, Katze, Satz – Sätze, dick, backen')],
      ['Besonderheiten (C, V, y, x, h, ä, ai)', S('Cent, Clown, Computer, viel, Vase, Vater, Vogel, vor, Baby, Hexe, Frühling, gehen – geht, Jahr, Uhr, Zahl, zahlen, zählen, Zahn – Zähne, Mädchen, Hai, Kaiser, Mai')],
    ],
    '34': [
      ['Trennung nach Schreibsilben', S('Boden, Ding, etwas, Finger, Fisch, Flasche, gegen, gehören, genau, gerade, Geschichte, Gesicht, gleich, Hals, helfen, heute, lachen, Licht, Loch, Luft, machen, Mensch, Milch, Nase, neben, neu, oben, reich, reiten, Sache, schenken, schlecht, Seite, sprechen, springen, Stein, tanken, Tasche, Wagen, weinen, Woche, Zeitung')],
      ['Vokalisiertes r', S('Arm, Dorf, dort, Eltern, Erde, erst, gern, gestern, kurz, merken, morgen, schwer, sofort, stark, Tür, werfen, Wurst')],
      ['Wörter mit ie', S('Beispiel, Brief – Briefe, geschrieben, lesen – liest, nie – niemals, riechen – riecht, schieben – schiebt, schwierig, tief – tiefer, Tier – Tiere, verlieren, ziehen – zieht, zielen – zielt, Zwiebel')],
      ['Mitlautverdopplung', S('dumm, essen, kommen, schlimm, schwimmen, schnell, stellen, vergessen, Zimmer, zusammen')],
      ['Wörter mit tz', S('Platz, Pfütze, plötzlich, schützen')],
      ['Wörter mit ck', S('Glück – glücklich, Schreck – erschrecken, Stück, verstecken, zurück')],
      ['Silbentrennendes h', S('blühen, drehen, gehen, Kuh – Kühe, Schuh – Schuhe, sehen, stehen, Zeh – Zehen')],
      ['Verhärtung', S('Abend – Abende – abends, Berg – Berge, erlauben – erlaubt, fremd – fremder, Geld – Gelder, lieben – liebt, liegen – liegt, rund – runder, steigen – steigt, werden – wird')],
      ['Umlautung', S('alt – älter, Ast – Äste, lang – länger, laufen – läuft, Nacht – Nächte, Saft – Säfte')],
      ['Flektierte Wörter im Satz', S('am – an, dein – deinem – deinen, dem – den, dies – diesem – diesen, ein – einem – einen, euer – eurem – euren, ganz – ganzem – ganzen, ihm – ihn – ihnen, ihr – ihre – ihrem – ihren, im – in, jede – jedem – jeden, kein – keinem – keinen, mein – meinem – meinen, mich – mir, sein – seinem – seinen, seit, uns – unserem – unseren, vom – von, welche – welchem – welchen, wem – wen, zu – zum – zur')],
      ['Umlautung und Verhärtung', S('Arzt – Ärzte, backen – Bäcker, Band – Bänder, Hand – Hände, kaufen – Verkäufer, Land – Länder, lassen – lässt, Mann – Männer, Rad – Räder, stark – stärker, Wald – Wälder')],
      ['Präteritum', S('bleiben – blieben, essen – aßen, fallen – fielen, geben – gaben, gehen – gingen, halten – hielten, heißen – hießen, kommen – kamen, können – konnten, lassen – ließen, laufen – liefen, lesen – liest – lasen, liegen – lagen, müssen – mussten, rufen – riefen, scheinen – schienen, schieben – schoben, singen – sangen, sitzen – saßen, schlafen – schliefen, schneiden – schnitten, schreiben – schrieben, steigen – stiegen, schwimmen – schwammen, tragen – trugen, trinken – tranken, vergessen – vergaßen, ziehen – zogen')],
      ['Häufigkeitswortschatz', S('ab, bin, bis, bist, dann, hier, hin, immer, ins, man, nicht – nichts, nie, nur, ob, oft, sehr, voll, wann, warum, wenig, wie, wieder, zu, zuletzt, zusammen')],
      ['Besonderheiten', S('außer, draußen, heißen, Straße, Christ, vielleicht, vier, Handy, Fuchs, links, Taxi, Text, sechs, Pizza, Skizze, Stadt, verwandt, erzählen, fahren, wahr, zehn, Haar, Meer, Schnee, See, Käfer, Käfig, Märchen, Tiger, Maschine, Familie, Laib')],
    ],
  };
  /* alle Wortformen (für die Suche in Texten): „lesen – liest – lasen“ → lesen, liest, lasen */
  const forms = st => [...new Set((GWS[st] || []).flatMap(([, ws]) => ws.flatMap(w => w.split(/\s+–\s+/).map(x => x.trim()))))];
  const GWS_QUELLE = 'Grundwortschatz LehrplanPLUS Bayern (ISB), Jahrgangsstufen 1/2 und 3/4';
  Object.assign(P, { GWS, GWS_QUELLE, gwsForms: forms });
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.FolivaPools = P;
})(typeof window !== 'undefined' ? window : globalThis);
