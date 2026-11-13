# Mitgelieferte Schriften – Register (Foliva 0.3.0)

| Datei | Familie / Schnitt | Quelle | Version | Abruf | SHA-256 | Lizenz | Änderungen |
|---|---|---|---|---|---|---|---|
| Grundschrift-Regular.otf | Grundschrift Regular | github.com/christianurff/grundschrift (Commit 0545c85, 08.09.2026) | 3.000 | 2026-10-10 | 42a785f81da5ebdd5000518067567639160cb6a16988e8f42b4778684f74e363 | CC BY 3.0 | keine |
| Theis-Schuldruck-Sued-Regular.woff2 | theis Schuldruck Süd Regular | theis (Lieferung Julian, Paket 0.105 vom 12.10.2026) | 0.105 | 2026-10-12 | 8ece509df43db7ccbf299f17d3ae5d2db91208bdbb36d1de067eb2e1135cb235 | © theis | keine |
| Theis-Schuldruck-Sued-Bold.woff2 | theis Schuldruck Süd Bold | dito | 0.105 | 2026-10-12 | b5b55050edc541857cf73bcafe7c7e111c2a7753b04e37872524855c7a26bec0 | © theis | keine |
| Grundschrift-Bold.otf | Grundschrift Bold | dito | 3.000 | 2026-10-10 | c8331352af8c68b34e82acbe92a3a85adf5ee8d714695e84a723bd498aa03902 | CC BY 3.0 | keine |
| Grundschrift-Light.otf | Grundschrift Light | dito | 3.000 | 2026-10-10 | 6ad29023363df7c2c1898e8f3bedc4a1718d0ffd03391e9b5601cc516b809dd2 | CC BY 3.0 | keine |
| Grundschrift-Punkt.otf | Grundschrift Punkt | dito | 1.000 | 2026-10-10 | 827b8cf0a3593c1d28a4991882160478cdfbfb78fdf610dc3c5c8b3973d4ba5f | CC BY 3.0 | keine |
| Grundschrift-Kontur.otf | Grundschrift Kontur | dito | 1.000 | 2026-10-10 | 51d474ef25541e3e6ac4da2ff3afc89d9e762e246d81cdaebeaa99fc51f84196 | CC BY 3.0 | keine |
| PlaywriteDEVA-wght.ttf | Playwrite DE VA (variabel 100–400) | github.com/google/fonts ofl/playwritedeva (Upstream TypeTogether/Playwrite, Commit 02e4e15) | 1.003 | 2026-10-11 | 065c4685e85d16299620f76e8abbf67a5e250c7641e4806566747b26a474e1cb | SIL OFL 1.1 | nur umbenannt (Original: PlaywriteDEVA[wght].ttf) |
| PlaywriteDEVAGuides-Regular.ttf | Playwrite DE VA Guides | github.com/google/fonts ofl/playwritedevaguides | 1.003 | 2026-10-11 | 863ae1ed69e58f9fdd25a21efaf219b01a82ab1417b817664311bf4f5a1ca9cf | SIL OFL 1.1 | keine |

Grundschrift: bytegenau gleich mit dem offiziellen Repository (geprüft 2026-10-11) und mit Julians Kopie in ~/Downloads/Grundschrift.
Playwrite: freie Lizenz ≠ pädagogische Freigabe – VA-Formen, Verbindungen, Umlaute, ß und Druck durch eine Grundschullehrkraft prüfen lassen.
Keine Punkt-/Kontur-/Pfeilvarianten für theis Schuldruck Süd und Playwrite vorhanden; Foliva zeigt stattdessen „Umriss“ bzw. „Hellgrau“ und sagt das an.


Ab Foliva 0.9.6 ersetzt theis Schuldruck Süd (0.103) die frühere theis Druck 02 (0.212). Interner Schlüssel bleibt „theis“; ältere Materialien zeigen automatisch die neue Schrift.
Ab Foliva 0.9.8: Fassung 0.105 (12.10.2026) – regelmäßige Höhen und Abstände, N/M/K/k korrigiert. Breiten ändern sich gegenüber 0.103; Umbrüche bestehender Materialien können sich leicht verschieben.

## Ab 0.9.12: Grundschrift als TrueType

Foliva verwendet die Grundschrift (Regular, Light, Bold, Punkt, Kontur) zusätzlich als TrueType-Datei (`Grundschrift-*.ttf`),
umgewandelt aus den OTF-Dateien oben mit fontTools (kubische in quadratische Kurven, Abweichung höchstens 1 Einheit, Laufweiten und
alle Metriken unverändert). Grund: Im PDF wird die Schrift so als echter, durchsuchbarer Text eingebettet statt als Bildzeichen.
Die Lizenz (CC BY 3.0, Christian Urff) erlaubt die Bearbeitung; die Namensnennung bleibt. Die OTF-Dateien bleiben zum Vergleich erhalten.
