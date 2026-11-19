/* ISB-Bewertungsraster Sprechen (monologisch) A1–B1+ – für Referate (kleiner monologischer mündlicher Leistungsnachweis).
   Deskriptoren wörtlich aus den ISB-Dateien „a1…b1+_sprechen_monologisch_bewertungsraster.pdf“ (Stand der Dateien 2026).
   A1 = A1+, A2 = A2+, B1 = B1+ (die ISB-Raster sind jeweils gleich). Einzige Abweichung von der Vorlage: In B1/B1+,
   Stufe 4 (Aussprache) ist im ISB-PDF ein Aufzählungspunkt mitten im Satz umgebrochen („wenige Aussprachefehler, welche“ /
   „die Kommunikation nicht wesentlich beeinträchtigen“) – hier als ein Punkt, Wortlaut unverändert.
   Eigene Datei, damit die bestehenden Raster (raster.js) und ihre Übersetzungen (desc_i18n.js) unverändert bleiben. · © 2026 theisapps */
(function (root) {
  const MONO = {
 "A1M": {
  "flu": {
   "6": [
    "stets verständlich trotz merklichem Akzent",
    "korrekte Aussprache eines bekannten Repertoires an Wörtern",
    "zusammenhängende Äußerungen"
   ],
   "5": [
    "meist verständlich trotz deutlichem Akzent",
    "meist korrekte Aussprache eines bekannten Repertoires an Wörtern",
    "kleinere Aussprache- und Intonationsfehler, welche die Kommunikation nicht beeinträchtigen",
    "meist zusammenhängende Äußerungen"
   ],
   "4": [
    "in der Regel verständlich",
    "im Allgemeinen korrekte Aussprache eines bekannten Repertoires an Wörtern",
    "wenige Aussprache- und Intonationsfehler, welche die Kommunikation nur geringfügig beeinträchtigen",
    "gelegentliches Zögern"
   ],
   "3": [
    "Verständlichkeit mit gewissen Einschränkungen gegeben",
    "erkennbare Schwächen in der Aussprache",
    "einige Aussprachefehler, welche die Kommunikation nicht wesentlich beeinträchtigen",
    "wiederholtes Zögern"
   ],
   "2": [
    "Verständlichkeit stark eingeschränkt",
    "deutliche Schwächen in der Aussprache",
    "viele Aussprachefehler, welche die Kommunikation teilweise beeinträchtigen",
    "häufiges Zögern"
   ],
   "1": [
    "Verständlichkeit kaum noch gegeben",
    "massive Schwächen in der Aussprache",
    "sehr viele Aussprachefehler, welche die Kommunikation erheblich erschweren",
    "stockend"
   ],
   "0": [
    "Verständlichkeit nicht mehr gegeben",
    "grob fehlerhafte Aussprache",
    "sehr stockend"
   ]
  },
  "lang": {
   "6": [
    "nur einzelne, leichte Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit nicht beeinträchtigen",
    "durchgehend sichere Verwendung eines der Lernstufe entsprechenden, einfachen Spektrums sprachlicher Mittel"
   ],
   "5": [
    "nur einige, überwiegend leichte Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit nicht wesentlich beeinträchtigen",
    "meist sichere Verwendung eines der Lernstufe entsprechenden, einfachen Spektrums sprachlicher Mittel"
   ],
   "4": [
    "mehrere, in der Regel leichte Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit nur geringfügig beeinträchtigen",
    "im Allgemeinen sichere Verwendung eines der Lernstufe entsprechenden, einfachen Spektrums sprachlicher Mittel"
   ],
   "3": [
    "mehrere, gelegentlich auch gravierende Verstöße gegen die Sprachrichtigkeit, wobei die Verständlichkeit insgesamt noch gewährleistet ist",
    "nur teilweise sichere Verwendung eines der Lernstufe noch entsprechenden, einfachen Spektrums sprachlicher Mittel"
   ],
   "2": [
    "viele, auch gravierende Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit stellenweise beeinträchtigen",
    "deutlich eingeschränkte Verwendung eines der Lernstufe nur teilweise entsprechenden, deutlich begrenzten Spektrums sprachlicher Mittel"
   ],
   "1": [
    "sehr viele, häufig auch gravierende Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit deutlich beeinträchtigen",
    "unzulängliche Verwendung eines der Lernstufe nicht mehr entsprechenden Spektrums sprachlicher Mittel"
   ],
   "0": [
    "Häufung elementarer Verstöße in allen Bereichen; die Verständlichkeit ist nicht mehr gegeben"
   ]
  },
  "content": {
   "4": [
    "Aufgabenstellung vollständig erfüllt",
    "durchgehend sachgerechte und ggf. ideenreiche Umsetzung",
    "überzeugende Darstellung bzw. Darlegung der eigenen Meinung in einfacher Form"
   ],
   "3": [
    "Aufgabenstellung im Allgemeinen erfüllt",
    "meist sachgerechte und ggf. ideenreiche Umsetzung; allenfalls geringe Abweichungen vom Thema bzw. von der Rolle",
    "weitgehend überzeugende Darstellung bzw. Darlegung der eigenen Meinung in einfacher Form"
   ],
   "2": [
    "Aufgabenstellung insgesamt noch erfüllt",
    "noch sachgerechte Umsetzung; gelegentliche Abweichungen vom Thema bzw. von der Rolle",
    "nur teilweise überzeugende Darstellung bzw. Darlegung der eigenen Meinung in einfacher Form"
   ],
   "1": [
    "Aufgabenstellung nur in Ansätzen erfüllt",
    "kaum noch sachgerechte Umsetzung; häufige Abweichungen vom Thema bzw. von der Rolle",
    "nur eingeschränkt nachvollziehbare Darstellung bzw. Darlegung der eigenen Meinung in einfacher Form"
   ],
   "0": [
    "Aufgabenstellung nicht erfüllt",
    "keine sachgerechte Umsetzung; Themaverfehlung",
    "nicht nachvollziehbare Darstellung bzw. Darlegung der eigenen Meinung in einfacher Form"
   ]
  }
 },
 "A2M": {
  "flu": {
   "6": [
    "stets verständlich trotz merklichem Akzent",
    "korrekte Aussprache und Intonation",
    "flüssige Äußerungen"
   ],
   "5": [
    "gut verständlich",
    "meist korrekte Aussprache und Intonation",
    "kleinere Aussprache- und Intonationsfehler, welche die Kommunikation nicht beeinträchtigen",
    "meist flüssige Äußerungen"
   ],
   "4": [
    "in der Regel verständlich",
    "im Allgemeinen korrekte Aussprache und Intonation",
    "wenige Aussprache- und Intonationsfehler, welche die Kommunikation nur geringfügig beeinträchtigen",
    "gelegentliches Zögern"
   ],
   "3": [
    "Verständlichkeit mit gewissen Einschränkungen gegeben",
    "erkennbare Schwächen in Aussprache und Intonation",
    "einige Aussprachefehler, welche die Kommunikation nicht wesentlich beeinträchtigen",
    "wiederholtes Zögern"
   ],
   "2": [
    "Verständlichkeit stark eingeschränkt",
    "deutliche Schwächen in Aussprache und Intonation",
    "viele Aussprachefehler, welche die Kommunikation teilweise beeinträchtigen",
    "häufiges Zögern"
   ],
   "1": [
    "Verständlichkeit kaum mehr gegeben",
    "massive Schwächen in Aussprache und Intonation",
    "sehr viele Aussprachefehler, welche die Kommunikation erheblich erschweren",
    "stockend"
   ],
   "0": [
    "Verständlichkeit nicht mehr gegeben",
    "grob fehlerhafte Aussprache",
    "sehr stockend"
   ]
  },
  "lang": {
   "6": [
    "nur vereinzelte, leichte Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit nicht beeinträchtigen",
    "durchgehend sichere Verwendung eines der Lernstufe entsprechenden, grundlegenden Spektrums sprachlicher Mittel"
   ],
   "5": [
    "nur einige, überwiegend leichte Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit nicht wesentlich beeinträchtigen",
    "meist sichere Verwendung eines der Lernstufe entsprechenden, grundlegenden Spektrums sprachlicher Mittel"
   ],
   "4": [
    "mehrere Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit nur geringfügig beeinträchtigen",
    "im Allgemeinen sichere Verwendung eines der Lernstufe entsprechenden, grundlegenden Spektrums sprachlicher Mittel"
   ],
   "3": [
    "mehrere, gelegentlich auch gravierende Verstöße gegen die Sprachrichtigkeit, wobei die Verständlichkeit insgesamt noch gewährleistet ist",
    "nur teilweise sichere Verwendung eines der Lernstufe noch entsprechenden, grundlegenden Spektrums sprachlicher Mittel"
   ],
   "2": [
    "viele, auch gravierende Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit stellenweise beeinträchtigen",
    "deutlich eingeschränkte Verwendung eines der Lernstufe nur teilweise entsprechenden, einfachen Spektrums sprachlicher Mittel"
   ],
   "1": [
    "sehr viele, häufig auch gravierende Verstöße gegen die Sprachrichtigkeit, welche die Verständlichkeit deutlich beeinträchtigen",
    "unzulängliche Verwendung eines der Lernstufe nicht mehr entsprechenden, sehr einfachen Spektrums sprachlicher Mittel"
   ],
   "0": [
    "äußerst gravierende Mängel in allen sprachlichen Bereichen; die Verständlichkeit ist nicht mehr gegeben"
   ]
  },
  "content": {
   "4": [
    "Aufgabenstellung vollständig erfüllt",
    "durchgehend sachgerechte und ggf. ideenreiche Umsetzung",
    "überzeugende Darstellung bzw. Darlegung der eigenen Meinung"
   ],
   "3": [
    "Aufgabenstellung im Allgemeinen erfüllt",
    "meist sachgerechte und ggf. ideenreiche Umsetzung; allenfalls geringe Abweichungen vom Thema bzw. von der Rolle",
    "weitgehend überzeugende Darstellung bzw. Darlegung der eigenen Meinung"
   ],
   "2": [
    "Aufgabenstellung insgesamt noch erfüllt",
    "noch sachgerechte Umsetzung; gelegentliche Abweichungen vom Thema bzw. von der Rolle",
    "nur teilweise überzeugende Darstellung bzw. Darlegung der eigenen Meinung"
   ],
   "1": [
    "Aufgabenstellung nur in Ansätzen erfüllt",
    "kaum noch sachgerechte Umsetzung; häufige Abweichungen vom Thema bzw. von der Rolle",
    "nur eingeschränkt nachvollziehbare Darstellung bzw. Darlegung der eigenen Meinung"
   ],
   "0": [
    "Aufgabenstellung nicht erfüllt",
    "keine sachgerechte Umsetzung; Themaverfehlung",
    "nicht nachvollziehbare Darstellung bzw. Darlegung der eigenen Meinung"
   ]
  }
 },
 "B1M": {
  "flu": {
   "6": [
    "sehr gute Verständlichkeit",
    "korrekte Aussprache und Intonation",
    "flüssige Äußerungen"
   ],
   "5": [
    "gute Verständlichkeit",
    "meist korrekte Aussprache und Intonation",
    "kleinere Aussprache- und Intonationsfehler, welche die Kommunikation nicht beeinträchtigen",
    "insgesamt flüssige Äußerungen"
   ],
   "4": [
    "in der Regel problemlose Verständlichkeit",
    "im Allgemeinen korrekte Aussprache und Intonation",
    "wenige Aussprachefehler, welche die Kommunikation nicht wesentlich beeinträchtigen",
    "gelegentliches Zögern"
   ],
   "3": [
    "Verständlichkeit mit gewissen Einschränkungen gegeben",
    "erkennbare Schwächen in Aussprache und Intonation",
    "einige Aussprachefehler, welche die Kommunikation teilweise beeinträchtigen",
    "wiederholtes Zögern"
   ],
   "2": [
    "Verständlichkeit stark eingeschränkt",
    "deutliche Schwächen in Aussprache und Intonation",
    "viele Aussprachefehler, welche die Kommunikation teilweise beeinträchtigen",
    "häufiges Zögern"
   ],
   "1": [
    "Verständlichkeit kaum mehr gegeben",
    "massive Schwächen in Aussprache und Intonation",
    "sehr viele Aussprachefehler, welche die Kommunikation erheblich erschweren",
    "stockend"
   ],
   "0": [
    "Verständlichkeit nicht mehr gegeben",
    "grob fehlerhafte Aussprache",
    "sehr stockend"
   ]
  },
  "lang": {
   "6": [
    "in hohem Maße korrekter Gebrauch grammatischer und syntaktischer Strukturen",
    "breites Repertoire an lexikalischen Mitteln",
    "abwechslungsreiche, im Ausdruck sehr treffende Gestaltung"
   ],
   "5": [
    "meist korrekter Gebrauch grammatischer und syntaktischer Strukturen",
    "gefestigtes Repertoire an lexikalischen Mitteln",
    "meist abwechslungsreiche, im Ausdruck treffende Gestaltung"
   ],
   "4": [
    "mehrere, zumeist leichte Verstöße in den Bereichen Wortschatz und Grammatik, welche die Verständlichkeit jedoch kaum beeinträchtigen",
    "angemessenes Repertoire an lexikalischen Mitteln",
    "insgesamt ansprechende sprachliche Ausgestaltung"
   ],
   "3": [
    "mehrere, gelegentlich auch gravierende Verstöße in den Bereichen Wortschatz und Grammatik, wobei die Verständlichkeit insgesamt noch gewährleistet ist",
    "einfaches Repertoire an lexikalischen Mitteln",
    "noch angemessene sprachliche Ausgestaltung"
   ],
   "2": [
    "viele, auch gravierende Verstöße in den Bereichen Wortschatz und Grammatik, welche die Verständlichkeit an einigen Stellen beeinträchtigen",
    "eingeschränktes Repertoire an lexikalischen Mitteln",
    "keine angemessene sprachliche Ausgestaltung"
   ],
   "1": [
    "sehr viele, häufig auch gravierende Verstöße in den Bereichen Wortschatz und Grammatik, welche die Verständlichkeit insgesamt beeinträchtigen",
    "unzureichendes Repertoire an lexikalischen Mitteln",
    "unzureichendes sprachliches Ausdrucksvermögen"
   ],
   "0": [
    "Häufung elementarer Verstöße in allen Bereichen; die Verständlichkeit ist nicht mehr gegeben",
    "schwerwiegende Wortschatzlücken"
   ]
  },
  "content": {
   "4": [
    "Aufgabenstellung vollumfänglich erfüllt",
    "durchgehend sachgerechte und ggf. ideenreiche Umsetzung",
    "überzeugende Darstellung bzw. Argumentation"
   ],
   "3": [
    "Aufgabenstellung im Allgemeinen erfüllt",
    "meist sachgerechte und ggf. ideenreiche Umsetzung",
    "weitgehend überzeugende Darstellung bzw. Argumentation"
   ],
   "2": [
    "Aufgabenstellung insgesamt noch erfüllt",
    "noch sachgerechte Umsetzung; gelegentliche Abweichungen vom Thema",
    "nur teilweise überzeugende Darstellung bzw. Argumentation"
   ],
   "1": [
    "Aufgabenstellung nur ansatzweise erfüllt",
    "kaum noch sachgerechte Umsetzung; häufige Abweichungen vom Thema",
    "nur eingeschränkt nachvollziehbare Darstellung bzw. Argumentation"
   ],
   "0": [
    "Aufgabenstellung nicht erfüllt",
    "keine sachgerechte Umsetzung; Themaverfehlung",
    "nicht nachvollziehbare Darstellung bzw. Argumentation"
   ]
  }
 }
};
  const I18N = {
 "wiederholtes Zögern": {
  "en": "repeated hesitation",
  "it": "esitazioni ripetute",
  "fr": "hésitations répétées",
  "es": "vacilaciones repetidas"
 },
 "häufiges Zögern": {
  "en": "frequent hesitation",
  "it": "esitazioni frequenti",
  "fr": "hésitations fréquentes",
  "es": "vacilaciones frecuentes"
 },
 "stockend": {
  "en": "halting",
  "it": "eloquio stentato",
  "fr": "débit hésitant",
  "es": "discurso entrecortado"
 },
 "sehr stockend": {
  "en": "very halting",
  "it": "eloquio molto stentato",
  "fr": "débit très hésitant",
  "es": "discurso muy entrecortado"
 },
 "meist flüssige Äußerungen": {
  "en": "mostly fluent utterances",
  "it": "enunciati per lo più scorrevoli",
  "fr": "énoncés le plus souvent fluides",
  "es": "intervenciones en su mayoría fluidas"
 }
};
  root.DESC = root.DESC || {}; for (const k of Object.keys(MONO)) if (!root.DESC[k]) root.DESC[k] = MONO[k];
  if (root.DESC_I18N) for (const k of Object.keys(I18N)) if (!root.DESC_I18N[k]) root.DESC_I18N[k] = I18N[k];
  if (typeof module !== 'undefined') module.exports = { MONO, I18N };
})(typeof window !== 'undefined' ? window : globalThis);
