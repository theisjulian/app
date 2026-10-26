# daje auf theisapps.de freischalten

Dieser Branch (`daje-vorbereitet`) enthält die fertige Einbindung von daje in die Website.
Solange er nicht in `main` übernommen ist, sieht niemand etwas davon: GitHub Pages veröffentlicht nur `main`.

## Was der Branch enthält

- **Programmseite** `daje/index.html` im Aufbau der anderen Programmseiten (Klar, Neon und Schulheft, hell und dunkel, Handy).
  Knopf „daje öffnen“ führt nach `https://daje.theisapps.de/`.
- **Bilder** in `assets/img/`: `daje-icon.png` (aus `portal/dist/assets/daje-icon-512.png`), Bildschirmfotos
  `daje-start`, `daje-katalog`, `daje-uebung`, `daje-unterricht`, `daje-wortschatz`, `daje-karte`, `daje-blatt`
  (1440 × 900) und `daje-handy-start`, `daje-handy-aufgabe` (786 × 1600, für den iPhone-Rahmen).
- **Startseite**: „Sieben Programme …“, daje in der Symbolzeile, in der Liste links und als eigener Abschnitt.
- **Alle Seiten**: daje in der Programmleiste oben, in der Leiste unten am Handy (jetzt sieben Symbole) und in der Fußzeile.
- **’namo.** zeigt als „Nächstes Programm“ auf daje, daje auf Libretto.
- **Farben** `.a-daje` / `.n-daje` in `assets/site.css`, Sitemap-Eintrag `https://theisapps.de/daje/`.
- **Datenschutz Nr. 5**: Absatz zu daje (lokaler Speicher, YouTube erst nach Antippen über youtube-nocookie,
  Vorlesestimme des Browsers, Bildsuche über Openverse nur beim Erstellen eigener Übungen).

## Freischalten

1. `main` in diesen Branch holen, falls sich die Website inzwischen geändert hat
   (`git merge origin/main`), Konflikte lösen. Danach die Versionsnummern `?v=` von `assets/site.css`
   und `assets/site.js` in allen Seiten auf die ersten 8 Zeichen des MD5-Werts der Datei setzen.
2. Prüfen:
   - `https://daje.theisapps.de/` ist erreichbar (CNAME im daje-Repo, DNS-Eintrag gesetzt).
   - Den Datenschutz-Absatz zu daje lesen und freigeben.
   - Ob die Angaben noch stimmen: „In Erprobung“, Lehrbücher (Ecco più 1 und 2), Sprachen.
3. Pull Request `daje-vorbereitet` → `main` anlegen und mergen. Nach ca. einer Minute ist daje auf theisapps.de sichtbar.

## Bildschirmfotos neu machen

daje lokal starten (`python3 -m http.server -d portal/dist`) und mit Playwright aufnehmen:
Rechner 1440 × 900, Handy 393 × 800 mit doppelter Pixeldichte. Als WebP (Qualität 82) unter denselben Namen ablegen.

## Hinweis zum daje-Repo (nicht Teil dieser Website)

`portal/dist` wird komplett veröffentlicht, also auch `imports/` (Backend-Konzept, KI-Kommandodateien) und
`review-data.js` („Owner-private working catalogue“ mit Transkripten). Die eigene Übergabe in
`uebergabe/04-STATUS-UND-OFFENE-PUNKTE.md` empfiehlt, interne Daten vor dem öffentlichen Betrieb aus dem
veröffentlichten Ordner zu entfernen.
