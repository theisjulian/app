# theisapps – Regeln für jeden Chat

Diese Datei liest Claude Code automatisch. **Sie ist die einzige verbindliche Stelle für Regeln.**
Ändert Julian eine Regel, wird sie *hier* geändert – nicht nur im Chat.
Andere Werkzeuge (claude.ai-Projekte, ChatGPT) bekommen diese Datei als Wissen/Anhang.

Repository öffentlich (GitHub Pages → theisapps.de). Alles hier ist für jeden lesbar,
auch „unverlinkte“ Ordner. Keine Passwörter, Tokens, echten Schülerdaten.

## Vor jeder Arbeit
1. `git pull` (mehrere Chats schreiben in dieses Repository).
2. Diese Datei lesen. Bei Widerspruch zu einer Übergabe: nachfragen, nicht raten.
3. Prüfen, ob Dateiname **und Inhalt** einer Übergabe zum angekündigten Programm passen.

## Sprache und Formulierungen
- Website: „Sie“. Apps: „du“.
- Nicht: „amtlich“, „zertifiziert“, „rechtssicher“, „für immer kostenlos“.
  Stattdessen: „nach GSO“, „nach den Vorgaben“, „kostenlos“ (Foliva: „während der Beta kostenlos“).
- Touch ID nur „am Mac“ nennen.
- Nicht jede Kleinigkeit als Neuerung hervorheben. Prominent bleiben: Libretto W-Seminar, Fristen.

## Versionen
- Website zeigt nur **x.x** („Libretto 1.1“, „Foliva Beta 0.9“).
- Genaue Nummer **x.x.x** nur in `versions.json` und im Release-Text.
- `versions.json`: die Schlüssel `gruppen` (= Aula) und `viva` (= Voce) **nicht löschen oder umbenennen** –
  ältere installierte Versionen fragen sie ab. Bei Aula/Voce-Updates beide Schlüssel mitpflegen.
- Für macOS 11/12 bleibt je eine ältere Version verlinkt (Libretto 1.0.12, Voce 1.10.0).

## Veröffentlichen
- Libretto/Voce: `release/<app>.json` ändern → GitHub Actions baut. Zuerst `"dry": true`.
  `versions.json` erst nach erfolgreichem Build.
- Aula/Foliva: noch von Hand ins Release. Foliva-Beta als Pre-Release, Tag = Versionsnummer.
- Danach prüfen: Dateien wirklich herunterladen, Prüfsummen und Version im Programm kontrollieren,
  Website und Statistik-Seite abgleichen.
- Grundsatz: „Wenn alles passt, geh live“ (Pull Request + Merge in `main`, nach ~1 Min. live).
- Aufträge bündeln: ein Pull Request pro Auftrag, nicht pro Kleinigkeit.

## Gestaltung
- Jede neue Seite/jedes Element prüfen in allen fünf Stilen
  (Glas, Neon, Heft, Datenblatt, Terminal) × hell/dunkel × Rechner/Handy.
- Bildschirmfotos im Laptop-Rahmen immer **16:10**. Bilder gleich in doppelter Auflösung.
- Eingabefelder auf Touch-Geräten mind. 16 px (sonst zoomt das iPhone).

## Daten und Datenschutz
- Demos/Bildschirmfotos: nur erfundene, vielfältige Namen.
- Private Seiten: `noindex`, nicht verlinkt, nicht in `sitemap.xml`.
- Passwortschutz nur per JavaScript-Vergleich schützt **nichts** (Dateien bleiben direkt abrufbar).
  Was wirklich vertraulich ist, wird verschlüsselt abgelegt (wie `ovmg-konzepte/*.bin`) oder gar nicht hier.

## Gemeinsame Dateien
Ändert ein Chat Dateien, die ein anderer Chat „besitzt“ (z. B. Rück-Knopf in Sportivo),
muss das unten unter „Fremde Änderungen“ eingetragen werden, damit es beim nächsten Update nicht verloren geht.

### Fremde Änderungen (beim nächsten Update der App übernehmen!)
- Sportivo (`sportwahl/app.html`): Knopf „theisapps.de“ zurück zur Website (oben und im Beispiel-Hinweis).

## Übergaben
Vorlage: `.claude/uebergabe-vorlage.md`. Jede Übergabe hat „SCHON ERLEDIGT“ und „NOCH ZU TUN“.
