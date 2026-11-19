/* Foliva – Sachtexte mit Quellen (Entwürfe) · © 2026 theis
   Jeder Text nennt die Quellen seiner Sachaussagen. Status „entwurf“ = recherchiert und belegt, aber noch nicht von einer
   Fachlehrkraft fachlich und didaktisch freigegeben. Erst nach Freigabe status: 'freigegeben' mit geprueft.von/am setzen.
   Ein neuer Zeitstempel allein ist keine erneute Prüfung. */
(function (root) {
  'use strict';
  const TEXTE = [
    {
      id: 'hsu-feuerwehr-1', thema: 'Feuerwehr', fach: 'Heimat- und Sachunterricht (HSU)', jg: [2, 3, 4], status: 'entwurf', geprueft: { von: '', am: '' }, recherche: '2026-10-11',
      titel: 'Die Feuerwehr hilft',
      text: `Die Feuerwehr hilft, wenn es brennt. Sie hilft aber auch bei Unfällen, bei Unwettern und wenn Tiere in Not sind.
In Deutschland gibt es mehr als eine Million Mitglieder in Freiwilligen Feuerwehren. Sie haben meistens einen anderen Beruf. Wenn ihr Melder piept, eilen sie zum Feuerwehrhaus und fahren zum Einsatz. In großen Städten gibt es außerdem Berufsfeuerwehren.
Wenn es brennt, wählst du den Notruf **112**. Der Anruf ist kostenlos und funktioniert in allen Ländern der Europäischen Union. Am Telefon beantwortest du diese Fragen: Wo ist es passiert? Was ist passiert? Wie viele Verletzte gibt es? Welche Verletzungen haben sie? Dann wartest du auf Rückfragen und legst nicht einfach auf.
Rauchmelder warnen früh, wenn es in der Wohnung brennt. In Bayern müssen in Schlafzimmern und Kinderzimmern Rauchmelder hängen und auch in den Fluren, die zu den Wohnräumen führen.`,
      fragen: `Welche Nummer wählst du, wenn es brennt?|112
Nenne zwei Aufgaben der Feuerwehr.|Sie löscht Brände und hilft bei Unfällen.
Was machen Mitglieder der Freiwilligen Feuerwehr, wenn ihr Melder piept?|Sie eilen zum Feuerwehrhaus und fahren zum Einsatz.
Welche Fragen beantwortest du beim Notruf?|Wo? Was? Wie viele Verletzte? Welche Verletzungen?`,
      quellen: [
        { aussage: 'Mitglieder Freiwillige Feuerwehren 2022: 1.014.953; Berufsfeuerwehren 116', titel: 'Deutscher Feuerwehrverband: Feuerwehr-Statistik (Stand 31.12.2022)', url: 'https://www.feuerwehrverband.de/app/uploads/2025/11/251103_Statistik-Webseite.pdf', abruf: '2026-10-11' },
        { aussage: '112 kostenlos in allen EU-Mitgliedstaaten', titel: 'Innenministerium Baden-Württemberg: Notruf 112 – europaweiter Aktionstag (09.02.2018)', url: 'https://im.baden-wuerttemberg.de/de/service/presse-und-oeffentlichkeitsarbeit/pressemitteilung/pid/notruf-112-am-112-ist-europaweiter-aktionstag', abruf: '2026-10-11' },
        { aussage: 'Fragen beim Notruf (Wo, Was, Wie viele, Welche, Warten)', titel: 'Stadt Braunschweig, Feuerwehr: Flyer Notruf 112', url: 'https://www.braunschweig.de/leben/gesundheit/feuerwehr/112-flyer-de.pdf', abruf: '2026-10-11' },
        { aussage: 'Rauchwarnmelderpflicht Bayern (Art. 46 Abs. 4 BayBO): Schlafräume, Kinderzimmer, Flure zu Aufenthaltsräumen', titel: 'Bayerisches Staatsministerium für Wohnen, Bau und Verkehr: Rauchwarnmelderpflicht – Fragen und Antworten', url: 'https://www.bauministerium.bayern.de/assets/stmi/buw/baurechtundtechnik/rauchmeldepflicht_fragen_und_antworten_neu.pdf', abruf: '2026-10-11' },
      ],
      hinweis: 'Im Text vereinfacht: „Flure, die zu Aufenthaltsräumen führen“ → „Flure, die zu den Wohnräumen führen“.',
    },
    {
      id: 'hsu-wald-1', thema: 'Wald und Bäume', fach: 'Heimat- und Sachunterricht (HSU)', jg: [3, 4], status: 'entwurf', geprueft: { von: '', am: '' }, recherche: '2026-10-11',
      titel: 'Unser Wald',
      text: `Ungefähr ein Drittel von Deutschland ist mit Wald bedeckt. In Bayern ist es sogar etwas mehr als ein Drittel der Fläche. Das hat die Bundeswaldinventur 2022 gemessen.
Im Wald wachsen Laubbäume und Nadelbäume. Laubbäume wie die Buche und die Eiche haben breite Blätter. Im Herbst färben sich die Blätter und fallen ab. Nadelbäume wie die Fichte und die Kiefer haben schmale Nadeln. Die meisten Nadelbäume behalten ihre Nadeln auch im Winter.
Die häufigsten Bäume in Deutschland sind die Kiefer, die Fichte, die Buche und die Eiche.
Ein Baum hat drei Teile: Mit den Wurzeln hält er sich im Boden fest und nimmt Wasser auf. Der Stamm trägt die Krone. In der Krone wachsen die Äste, die Zweige und die Blätter. An den Jahresringen im Stamm kann man erkennen, wie alt ein Baum ist.`,
      fragen: `Wie viel von Deutschland ist ungefähr mit Wald bedeckt?|ungefähr ein Drittel
Nenne zwei Laubbäume und zwei Nadelbäume.|Buche, Eiche – Fichte, Kiefer
Welche drei Teile hat ein Baum?|Wurzeln, Stamm, Krone
Woran erkennt man das Alter eines Baumes?|an den Jahresringen`,
      quellen: [
        { aussage: 'Waldfläche Deutschland 32 %, Bayern 37 %; häufigste Baumarten Kiefer 22 %, Fichte 21 %, Buche 17 %, Eiche 12 %', titel: 'Thünen-Institut / BMEL: Der Wald in Deutschland – Ausgewählte Ergebnisse der vierten Bundeswaldinventur (BWI 2022)', url: 'https://www.thuenen.de/media/institute/wo/Waldmonitoring/THG/Dokumente/BWI-2022_Broschuere_bf-neu.pdf', abruf: '2026-10-11' },
      ],
      hinweis: 'Baumteile, Laub/Nadel und Jahresringe sind Grundwissen des Sachunterrichts; bitte bei der Freigabe mit dem eingeführten Lehrwerk abgleichen. Ausnahme Lärche (verliert Nadeln) bewusst mit „die meisten“ berücksichtigt.',
    },
    {
      id: 'hsu-koerper-1', thema: 'Mein Körper', fach: 'Heimat- und Sachunterricht (HSU)', jg: [3, 4], status: 'entwurf', geprueft: { von: '', am: '' }, recherche: '2026-10-11',
      titel: 'Knochen und Sinne',
      text: `Unser Körper wird von einem Skelett gestützt. Ein erwachsener Mensch hat ungefähr 206 Knochen. Ein neugeborenes Baby hat sogar mehr als 300 Knochen und Knorpel. Viele davon wachsen später zusammen.
Der größte Knochen ist der Oberschenkelknochen. Der kleinste Knochen sitzt im Ohr. Er heißt Steigbügel und ist nur etwa drei Millimeter lang.
Muskeln bewegen die Knochen. So können wir laufen, springen und greifen.
Mit unseren Sinnen nehmen wir die Welt wahr: Wir sehen mit den Augen, hören mit den Ohren, riechen mit der Nase, schmecken mit der Zunge und fühlen mit der Haut.`,
      fragen: `Wie viele Knochen hat ein erwachsener Mensch ungefähr?|ungefähr 206
Wie heißt der größte Knochen?|Oberschenkelknochen
Wo sitzt der kleinste Knochen?|im Ohr (Steigbügel)
Mit welchem Sinnesorgan riechen wir?|mit der Nase`,
      quellen: [
        { aussage: 'etwa 206 Knochen; Neugeborene mehr als 300 Knochen und Knorpel; Oberschenkelknochen größter, Steigbügel kleinster (ca. 3 mm)', titel: 'BARMER: Gesundheit im Blick – Knochen (letzte Aktualisierung 09.02.2016)', url: 'https://www.barmer.de/presse/presseinformationen/newsletter-gesundheit-im-blick/knochen-1070640', abruf: '2026-10-11' },
      ],
      hinweis: 'Fünf Sinne vereinfacht dargestellt (Grundschulniveau). Quelle zu Knochen ist eine Krankenkassen-Information; bei der Freigabe ggf. durch ein Fachbuch ergänzen.',
    },
    {
      id: 'hsu-igel-1', thema: 'Igel', fach: 'Heimat- und Sachunterricht (HSU)', jg: [2, 3, 4], status: 'entwurf', geprueft: { von: '', am: '' }, recherche: '2026-10-11',
      titel: 'Der Igel',
      text: `Der Igel ist ein Säugetier. Ein erwachsener Igel hat 5000 bis 8000 Stacheln. Die Stacheln sind umgewandelte Haare. Wenn Gefahr droht, rollt sich der Igel zu einer stacheligen Kugel zusammen.
Der Igel ist nachtaktiv. Er frisst vor allem Insekten und ihre Larven. Milch verträgt er nicht.
Im Winter hält der Igel Winterschlaf. Wann er damit beginnt, hängt von der Temperatur ab. Im Winterschlaf sinkt seine Körpertemperatur von etwa 35 Grad auf bis zu 5 Grad. Sein Herz schlägt dann nur noch etwa neunmal in der Minute. Im März oder April wacht er wieder auf.
Igel leben heute vor allem in Gärten und Parks in der Nähe von Menschen. Sie brauchen Hecken und Laubhaufen als Versteck.`,
      fragen: `Wie viele Stacheln hat ein erwachsener Igel?|5000 bis 8000
Was frisst der Igel vor allem?|Insekten und ihre Larven
Was passiert im Winterschlaf mit der Körpertemperatur?|Sie sinkt von etwa 35 Grad auf bis zu 5 Grad.
Warum soll man einem Igel keine Milch geben?|Er verträgt keine Milch.`,
      quellen: [
        { aussage: 'Stachelanzahl, Nahrung, keine Milch, nachtaktiv, Winterschlaf temperaturabhängig, 35 → 5 °C, Herzschlag ca. 9/min, Aufwachen März/April, Lebensraum Siedlungen', titel: 'Bayerische Akademie für Naturschutz und Landschaftspflege (ANL), Projekt „Tiere live“: Igel (Unterrichtsmaterial)', url: 'https://www.anl.bayern.de/projekte/tierelive/doc/003_igel_ges_ba.pdf', abruf: '2026-10-11' },
      ],
      hinweis: 'Zusammenrollen bei Gefahr ist Grundwissen und steht nicht ausdrücklich in der Quelle; bei der Freigabe prüfen.',
    },
    {
      id: 'hsu-biene-1', thema: 'Honigbiene', fach: 'Heimat- und Sachunterricht (HSU)', jg: [3, 4], status: 'entwurf', geprueft: { von: '', am: '' }, recherche: '2026-10-11',
      titel: 'Das Bienenvolk',
      text: `Honigbienen leben in einem Bienenvolk zusammen. Im Sommer gehören bis zu 50 000 Arbeiterinnen zu einem Volk.
In jedem Volk gibt es nur eine Königin. Sie legt im Sommer bis zu 2000 Eier am Tag und kann etwa fünf Jahre alt werden.
Die Arbeiterinnen haben viele Aufgaben: Sie putzen, füttern die Larven, bauen Waben aus Wachs und bewachen den Eingang. Ältere Arbeiterinnen fliegen hinaus und sammeln Nektar, Pollen und Wasser. Aus dem Nektar entsteht Honig. Eine Arbeiterin lebt im Sommer nur etwa sechs Wochen.
Die männlichen Bienen heißen Drohnen. Es gibt sie nur im Sommerhalbjahr.`,
      fragen: `Wie viele Königinnen gibt es in einem Bienenvolk?|eine
Was sammeln die Arbeiterinnen?|Nektar, Pollen und Wasser
Woraus entsteht Honig?|aus Nektar
Wie heißen die männlichen Bienen?|Drohnen`,
      quellen: [
        { aussage: 'Arbeiterinnen 5000–50 000 je nach Jahreszeit; 1 Königin, bis 2000 Eier täglich, ca. 5 Jahre; Aufgaben der Arbeiterinnen; Sommerbienen ca. 42 Tage; Drohnen im Sommerhalbjahr; Nektar Grundlage für Honig', titel: 'Bayerische Landesanstalt für Weinbau und Gartenbau (LWG), Fachzentrum Bienen: Biologie der Bienen (Foliensatz)', url: 'https://lwg.bayern.de/mam/cms06/bienen/dateien/biologie_der_bienen.pdf', abruf: '2026-10-11' },
      ],
      hinweis: '„etwa sechs Wochen“ = gerundet aus ca. 42 Tagen.',
    },
    {
      id: 'hsu-zaehne-1', thema: 'Zahngesundheit', fach: 'Heimat- und Sachunterricht (HSU)', jg: [1, 2, 3], status: 'entwurf', geprueft: { von: '', am: '' }, recherche: '2026-10-11',
      titel: 'Zähne putzen',
      text: `Gesunde Zähne brauchen Pflege. Zahnärztinnen und Zahnärzte empfehlen: zweimal am Tag Zähne putzen.
Kleine Kinder bis zum zweiten Geburtstag nehmen dafür nur so viel Kinderzahnpasta wie ein Reiskorn. Danach nimmt man so viel wie eine Erbse.
Ab dem sechsten Geburtstag sollen Kinder eine Juniorzahnpasta benutzen.`,
      fragen: `Wie oft am Tag sollst du Zähne putzen?|zweimal
Wie viel Zahnpasta nimmt ein Kind nach dem zweiten Geburtstag?|so viel wie eine Erbse
Welche Zahnpasta empfehlen Zahnärzte ab sechs Jahren?|Juniorzahnpasta`,
      quellen: [
        { aussage: 'zweimal täglich; bis 2. Geburtstag reiskorngroß, danach erbsengroß; ab 6. Lebensjahr Juniorzahnpasta (gemeinsame Empfehlung DGPZM, DGZ, DGKiZ, BZÖG, BZÄK, Sept. 2018)', titel: 'zm online: „Goldene Regel für Kinderzahnpasta: zweimal täglich, erst Reiskorn, dann Erbse“ (11.03.2019)', url: 'https://www.zm-online.de/news/detail/goldene-regel-fuer-kinderzahnpasta-zweimal-taeglich-erst-reiskorn-dann-erbse', abruf: '2026-10-11' },
      ],
      hinweis: 'Empfehlung von 2018; vor Freigabe prüfen, ob die Fachgesellschaften inzwischen eine neuere Empfehlung veröffentlicht haben.',
    },
  ];
  /* Offene Themen: bewusst NICHT mitgeliefert, bis fachlich geprüfte Materialien vorliegen */
  const OFFEN = [{ thema: 'Körper und Sexualerziehung', grund: 'Nur mit fachlich und schulrechtlich geprüften Materialien (Richtlinien für die Familien- und Sexualerziehung in den bayerischen Schulen) und Freigabe durch eine Fachlehrkraft.' }];
  const API = { TEXTE, OFFEN };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.FolivaInhalte = API;
})(typeof window !== 'undefined' ? window : globalThis);
