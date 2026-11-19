/* Foliva – Bibliothek: Textaufgaben mit Frage, Rechnung und Antwort · © 2026 theis
   Selbst geschrieben; alle Namen erfunden. Ergebnisse sind im Test nachgerechnet. */
(function (root) {
  'use strict';
  const P = root.FolivaPools || (typeof require !== 'undefined' ? require('./gedichte.js') : {});
  const A = (id, title, theme, stufe, tags, text, F, R, Ant) => ({ id: 'a-' + id, art: 'aufgabe', title, theme, stufe, tags, text, F, R, A: Ant });
  const TEXTAUFGABEN = [
    A('aepfel', 'Äpfel verschenken', 'geld', '12', 'minus, Äpfel, schenken', 'Mia hat 8 Äpfel. Sie schenkt ihrer Freundin 3 Äpfel.', 'Wie viele Äpfel hat Mia noch?', '8 − 3 = 5', 'Mia hat noch 5 Äpfel.'),
    A('bus', 'Im Bus', 'schule', '12', 'plus, Bus, einsteigen', 'Im Bus sitzen 12 Kinder. An der Haltestelle steigen 5 Kinder ein.', 'Wie viele Kinder sitzen jetzt im Bus?', '12 + 5 = 17', 'Jetzt sitzen 17 Kinder im Bus.'),
    A('murmeln', 'Murmeln', 'freizeit', '12', 'minus, Murmeln, verlieren', 'Tim hat 15 Murmeln. Beim Spielen verliert er 6 Murmeln.', 'Wie viele Murmeln hat Tim noch?', '15 − 6 = 9', 'Tim hat noch 9 Murmeln.'),
    A('nester', 'Drei Nester', 'tiere', '12', 'mal, Eier, Nest', 'In jedem der drei Nester liegen 4 Eier.', 'Wie viele Eier sind es zusammen?', '3 · 4 = 12', 'Es sind zusammen 12 Eier.'),
    A('kekse', 'Kekse verteilen', 'geld', '12', 'geteilt, Kekse, gerecht verteilen', 'Oma backt 20 Kekse. Sie verteilt sie gerecht an ihre 4 Enkel.', 'Wie viele Kekse bekommt jedes Enkelkind?', '20 : 4 = 5', 'Jedes Enkelkind bekommt 5 Kekse.'),
    A('stifte', 'Neue Stifte', 'schule', '12', 'mal, Stifte, Packung', 'Lea kauft 2 Packungen Buntstifte. In jeder Packung sind 6 Stifte.', 'Wie viele Stifte hat Lea gekauft?', '2 · 6 = 12', 'Lea hat 12 Stifte gekauft.'),
    A('buch', 'Ein Buch kaufen', 'geld', '12', 'Geld, Euro, zurück', 'Ben hat 10 Euro. Er kauft ein Buch für 7 Euro.', 'Wie viel Geld bekommt Ben zurück?', '10 € − 7 € = 3 €', 'Ben bekommt 3 Euro zurück.'),
    A('klasse', 'Unsere Klasse', 'schule', '12', 'plus, Klasse, Mädchen, Jungen', 'In der Klasse 2a sind 13 Mädchen und 11 Jungen.', 'Wie viele Kinder sind in der Klasse?', '13 + 11 = 24', 'In der Klasse sind 24 Kinder.'),
    A('turm', 'Der Turm fällt um', 'freizeit', '12', 'minus, Bausteine, Turm', 'Paul baut einen Turm aus 18 Bausteinen. 9 Steine fallen herunter.', 'Wie viele Steine stehen noch?', '18 − 9 = 9', 'Es stehen noch 9 Steine.'),
    A('kuehe', 'Auf der Weide', 'tiere', '12', 'minus, Kühe, Stall', 'Auf der Weide stehen 25 Kühe. 10 Kühe gehen in den Stall.', 'Wie viele Kühe sind noch auf der Weide?', '25 − 10 = 15', 'Es sind noch 15 Kühe auf der Weide.'),
    A('huehnerbeine', 'Hühnerbeine', 'tiere', '12', 'mal, Hühner, Beine', 'Im Stall sind 5 Hühner. Jedes Huhn hat 2 Beine.', 'Wie viele Beine haben die Hühner zusammen?', '5 · 2 = 10', 'Die Hühner haben zusammen 10 Beine.'),
    A('pause', 'Die große Pause', 'zeit', '12', 'Uhrzeit, Minuten, Pause', 'Die Pause beginnt um 10 Uhr. Sie dauert 20 Minuten.', 'Wann ist die Pause zu Ende?', '10:00 Uhr + 20 min = 10:20 Uhr', 'Die Pause ist um 10:20 Uhr zu Ende.'),
    A('brezeln', 'Beim Bäcker', 'geld', '34', 'Geld, Cent, Euro, zurück, zwei Schritte', 'Lena kauft 3 Brezeln. Eine Brezel kostet 80 Cent. Sie bezahlt mit einem 5-Euro-Schein.', 'Wie viel Geld bekommt Lena zurück?', '3 · 80 ct = 240 ct = 2,40 €; 5,00 € − 2,40 € = 2,60 €', 'Lena bekommt 2,60 € zurück.'),
    A('kleinbusse', 'Der Ausflug', 'schule', '34', 'geteilt, Bus, Kinder', 'Die 64 Kinder der dritten Klassen fahren mit Kleinbussen zum Waldtag. In jeden Kleinbus passen 8 Kinder.', 'Wie viele Kleinbusse brauchen sie?', '64 : 8 = 8', 'Sie brauchen 8 Kleinbusse.'),
    A('zug', 'Mit dem Zug', 'zeit', '34', 'Zeitspanne, Uhrzeit, Fahrt', 'Der Zug fährt um 9:45 Uhr ab und kommt um 11:20 Uhr an.', 'Wie lange dauert die Fahrt?', '9:45 Uhr → 10:45 Uhr = 1 h; 10:45 Uhr → 11:20 Uhr = 35 min', 'Die Fahrt dauert 1 Stunde und 35 Minuten.'),
    A('buecherei', 'Die Schulbücherei', 'schule', '34', 'plus, minus, Bücher, zwei Schritte', 'In der Schulbücherei stehen 348 Bücher. Die Schule kauft 75 neue Bücher. 26 alte Bücher werden aussortiert.', 'Wie viele Bücher stehen danach in der Bücherei?', '348 + 75 = 423; 423 − 26 = 397', 'Danach stehen 397 Bücher in der Bücherei.'),
    A('saft', 'Saft für das Klassenfest', 'groessen', '34', 'Liter, Milliliter, geteilt, Hohlmaße', 'Für das Klassenfest werden 6 Flaschen Apfelsaft gekauft. In jeder Flasche ist 1 Liter. Ein Becher fasst 200 ml.', 'Wie viele Becher kann man füllen?', '6 l = 6000 ml; 6000 ml : 200 ml = 30', 'Man kann 30 Becher füllen.'),
    A('radtour', 'Die Fahrradtour', 'freizeit', '34', 'Kilometer, plus, Längen', 'Familie Kurz macht eine Radtour. Am ersten Tag fährt sie 28 km, am zweiten Tag 35 km und am dritten Tag 19 km.', 'Wie viele Kilometer fährt die Familie insgesamt?', '28 km + 35 km + 19 km = 82 km', 'Die Familie fährt insgesamt 82 km.'),
    A('eintritt', 'Eintritt ins Schwimmbad', 'geld', '34', 'Geld, mal, plus, Eintritt', 'Der Eintritt ins Schwimmbad kostet für Kinder 3 € und für Erwachsene 5 €. Familie Öztürk geht mit zwei Erwachsenen und drei Kindern ins Bad.', 'Wie viel muss die Familie bezahlen?', '2 · 5 € = 10 €; 3 · 3 € = 9 €; 10 € + 9 € = 19 €', 'Die Familie muss 19 € bezahlen.'),
    A('zaun', 'Ein Zaun für das Beet', 'groessen', '34', 'Umfang, Meter, Rechteck', 'Ein rechteckiges Beet ist 6 m lang und 4 m breit. Rundherum soll ein kleiner Zaun stehen.', 'Wie lang wird der Zaun?', '6 m + 4 m + 6 m + 4 m = 20 m', 'Der Zaun wird 20 m lang.'),
    A('sparen', 'Sparen für ein Spiel', 'geld', '34', 'Taschengeld, sparen, geteilt, zwei Schritte', 'Jonas bekommt jede Woche 4 € Taschengeld. Er möchte ein Spiel für 30 € kaufen. 10 € hat er schon gespart.', 'Wie viele Wochen muss Jonas noch sparen?', '30 € − 10 € = 20 €; 20 € : 4 € = 5', 'Jonas muss noch 5 Wochen sparen.'),
    A('eierkartons', 'Eier verpacken', 'tiere', '34', 'geteilt, Eier, Karton', 'Ein Bauer hat 156 Eier. Er packt sie in Kartons zu je 6 Eiern.', 'Wie viele Kartons kann er füllen?', '156 : 6 = 26', 'Er kann 26 Kartons füllen.'),
    A('kino', 'Im Kino', 'freizeit', '34', 'mal, minus, Plätze, zwei Schritte', 'Im Kino gibt es 12 Reihen mit je 15 Plätzen. 143 Plätze sind besetzt.', 'Wie viele Plätze sind noch frei?', '12 · 15 = 180; 180 − 143 = 37', 'Es sind noch 37 Plätze frei.'),
    A('mehl', 'Kuchen backen', 'groessen', '34', 'Gramm, Kilogramm, Gewichte', 'Für einen Kuchen braucht man 250 g Mehl. Oma backt 3 Kuchen. Sie hat eine Packung mit 1 kg Mehl.', 'Wie viel Mehl bleibt übrig?', '3 · 250 g = 750 g; 1000 g − 750 g = 250 g', 'Es bleiben 250 g Mehl übrig.'),
  ];
  const AUFGABENTHEMEN = { geld: 'Geld und Einkaufen', zeit: 'Zeit', tiere: 'Tiere und Natur', schule: 'Schule und Klasse', freizeit: 'Freizeit und Sport', groessen: 'Längen, Gewichte, Hohlmaße' };
  Object.assign(P, { TEXTAUFGABEN, AUFGABENTHEMEN });
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.FolivaPools = P;
})(typeof window !== 'undefined' ? window : globalThis);
