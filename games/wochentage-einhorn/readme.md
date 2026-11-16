# Wochentage mit dem Einhorn

- **Kategorie:** Sachunterricht
- **Alter:** 6–7 Jahre

## Inhalt

Ein Einhorn läuft in einer 3D-Welt über sieben Inseln – eine Insel für jeden Wochentag.
Jeder Tag hat ein Merkbild (Montag 🌙 Mond, Dienstag 🦕 Dino, Mittwoch 🐱 Mieze, Donnerstag ⚡ Donner,
Freitag 🐸 Frosch, Samstag 🏖️ Sand, Sonntag ☀️ Sonne), eine eigene Farbe und einen eigenen Ton.
Alles wird vorgelesen, lesen muss man nicht können.

Drei Arten zu spielen (Knöpfe oben links):

- 🦄 **Frei laufen:** Insel antippen, das Einhorn läuft hin und sagt den Tag.
- 🌈 **Durch die Woche:** Das Einhorn läuft von Montag bis Sonntag und nennt jeden Tag.
- ⭐ **Quiz:** „Wo ist der Mittwoch?“ oder „Welcher Tag kommt nach Montag?“. Für jede richtige Antwort
  gibt es einen Stern. Bei sieben Sternen wird gefeiert.

## Steuerung

- Insel antippen oder anklicken.
- Pfeile ⬅️ ➡️ unten: einen Tag zurück oder vor.
- Sprechblase unten: noch einmal anhören.
- Tastatur: Pfeiltasten links/rechts, Zahlen 1 bis 7 für die Inseln, Leertaste zum Anhören,
  Enter startet das Spiel.

## Besonderheiten

- Hochgeladenes Spiel. Der Inhalt ist unverändert. Ergänzt wurden nur die Links „🏠 Alle Spiele“
  (Start-Bildschirm und im Spiel) mit einem eigenen kleinen Stil-Block.
- Das Spiel hat keinen End-Bildschirm: Nach dem Quiz geht es einfach weiter. Darum gibt es zwei
  statt drei Links zur Übersicht. Der Kommentar `<!-- check: kein End-Bildschirm -->` in der Datei
  sagt das der Prüfung.
- three.js r128 (MIT-Lizenz) ist direkt in die Datei eingebettet. Es wird nichts nachgeladen.
- Braucht WebGL. Sprache kommt von der Sprachausgabe des Geräts (`speechSynthesis`), Töne vom Browser.
- Kein Speicherstand (`localStorage` wird nicht benutzt).
