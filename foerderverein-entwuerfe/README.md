# Entwurfsmappe: Website der Freunde des OvMG e.V.

Passwortgeschützte Ansichtsseite für den Vorstand des Fördervereins des Oskar-von-Miller-Gymnasiums.
Fünf Website-Konzepte zum Durchklicken, eine Logo-Präsentation und die nächsten Schritte.

Reine statische Seite (HTML, CSS, JavaScript). Kein Build-Schritt, keine externen Abhängigkeiten,
keine Verbindung zu Google: Schriften liegen lokal in `assets/schriften/`.

## Aufbau

```
foerderverein-entwuerfe/
├── index.html              Anmeldung + Übersicht (Konzepte, Logos, nächste Schritte)
├── logos.html              Logo-Präsentation mit Anwendungsbeispielen
├── konzepte/
│   ├── one-pager.html      01 One-Pager (Empfehlung)
│   ├── klassisch.html      02 Klassisch
│   ├── mitmachen.html      03 Mitmachen
│   ├── bildstark.html      04 Bildstark
│   └── geschichte.html     05 Damals & heute
└── assets/
    ├── zugang.js           Passwortabfrage (SHA-256-Vergleich)
    ├── mappe.css / .js     Gestaltung und Logik von Übersicht und Logo-Seite
    ├── konzepte.css        gemeinsame Grundlage der fünf Konzepte
    ├── praesentation.*     Blätterleiste unten auf den Konzeptseiten, Logo-Umschalter
    ├── logos/              Logofamilie als SVG (schwarz/weiß), Schrift in Pfaden
    ├── bilder/             Fotos (Britta Mangold) und altes Schulhaus-Foto
    └── schriften/          Jost, Source Serif 4, Inter (SIL Open Font License)
```

Die Konzeptseiten lassen sich mit `?logo=modern|familie|siegel|wortmarke` aufrufen.
Die Auswahl in der Blätterleiste wird im Browser gemerkt.

## Veröffentlichen

Den Ordner `foerderverein-entwuerfe/` unverändert ins Repository legen, committen und pushen.
Alle Pfade sind relativ, die Seite funktioniert in jedem Unterordner.
Nicht in eine Sitemap aufnehmen.

Lokal testen:

```bash
python3 -m http.server 8000
# dann http://localhost:8000/foerderverein-entwuerfe/ öffnen
```

Die Anmeldung braucht https oder localhost. Per Doppelklick als Datei geöffnet, funktioniert sie nicht zuverlässig.

## Passwort

Ändern: SHA-256 des neuen Passworts erzeugen und in `assets/zugang.js` bei `HASH` eintragen.

```bash
printf '%s' 'neues-passwort' | shasum -a 256
```

Das ist ein Sichtschutz, keine echte Sicherheit. Alle Dateien liegen offen auf dem Server und,
bei einem öffentlichen Repository, auch dort. Die Seiten sind mit `noindex` markiert.

## Hinweise

- Fotos: Britta Mangold. Die Nutzung für den Förderverein ist noch nicht geklärt.
- Logo-Varianten 01–04 nutzen das historische Turmzeichen der Schule. Freigabe durch die Schulleitung nötig.
- Vorstand, Beiträge und Bankverbindung stammen von der bisherigen Website und sind noch zu bestätigen.
