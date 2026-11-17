# Meerjungfrauen-Alphabet

- **Kategorie:** Deutsch
- **Alter:** 6–7 Jahre

## Inhalt

Eine Meerjungfrau schwimmt durch das Meer und sammelt Muscheln. Nach jeder Strecke wartet eine
Schatztruhe mit einer Buchstaben-Aufgabe. Zehn Aufgaben pro Runde, abwechselnd zwei Arten:

- **Buchstabe finden:** „Wo ist das M?“ wird angesagt, das Kind tippt auf den richtigen Buchstaben.
- **Anlaut hören:** Ein Bild erscheint (🐟), das Wort wird vorgelesen: „Womit fängt Fisch an?“

Geübt werden 20 Buchstaben mit klarem Anfangslaut (A, B, D, E, F, G, H, I, K, L, M, N, O, P, R, S,
T, U, W, Z). Jede Runde zieht zehn davon zufällig. Lesen muss man nicht können.

Es gibt keine Gegner, keinen Zeitdruck und kein „Verloren“. Verpasste Muscheln kosten nichts.

## Steuerung

- ⬆️ ⬇️ gedrückt halten: Die Meerjungfrau schwimmt hoch oder runter. Das Meer zieht von selbst vorbei.
- Tastatur: Pfeiltasten hoch/runter oder W und S.
- In der Aufgabe: Buchstaben antippen. Tastatur: 1 bis 3 oder die Buchstabentaste selbst.
- 🔊 liest die Aufgabe noch einmal vor.
- Falsche Antwort: freundlicher Hinweis, die Antwort wird gesperrt, neuer Versuch.
- Richtige Antwort: kurze Erklärung, dann „Weiter“. Die Truhe geht auf und schenkt 5 Muscheln.
- Am Ende: Zahl der Muscheln und ein Stern für jede Aufgabe, die beim ersten Versuch richtig war.

## Besonderheiten

- Selbst entwickelt, eine Datei, keine Bibliothek. Das Meer wird auf einer Zeichenfläche (`canvas`) gemalt.
- Speicherstand: `localStorage`-Schlüssel `lernspiele.meerjungfrau-alphabet` (die meisten Muscheln).
- Vorlesen nutzt die Sprachausgabe des Geräts (`speechSynthesis`, Deutsch). Der Bildschirm zeigt bei
  „Buchstabe finden“ absichtlich nur ein Ohr 👂, damit man hinhören muss. Meldet das Gerät, dass es
  nicht sprechen kann, erscheint stattdessen der kleine Buchstabe (m) und man sucht den großen dazu.
- Töne entstehen im Browser (Web Audio), es werden keine Dateien geladen.
- Bei „Bewegung reduzieren“ im Gerät schwanken Seegras, Haare und Flosse nicht.
