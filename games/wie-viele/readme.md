# Wie viele sind es?

- **Kategorie:** Mathe
- **Alter:** 6–7 Jahre

## Inhalt

Die Kinder zählen Bilder (Äpfel, Enten, Sterne …) und tippen auf die passende Zahl.
Zehn Fragen, die Mengen gehen von 1 bis 10. Jede Frage wird vorgelesen, lesen muss man nicht können.

Das Spiel ist das Beispielspiel der Sammlung. Es ist aus `tools/vorlage/` entstanden und zeigt,
wie ein Spiel alle Regeln erfüllt.

## Steuerung

- Antwort antippen oder anklicken.
- Tastatur: Zahlen 1 bis 3 wählen die erste, zweite oder dritte Antwort. Mit Tab und Enter erreicht man alle Knöpfe.
- 🔊 liest die Frage noch einmal vor.
- Falsche Antwort: freundlicher Hinweis, die Antwort wird gesperrt, neuer Versuch.
- Richtige Antwort: kurze Erklärung, dann „Weiter“.
- Am Ende gibt es einen Stern für jede Frage, die beim ersten Versuch richtig war.

## Besonderheiten

- Speicherstand: `localStorage`-Schlüssel `lernspiele.wie-viele` (bester Durchgang).
- Vorlesen nutzt die Sprachausgabe des Geräts (`speechSynthesis`, Deutsch). Fehlt sie, läuft das Spiel stumm weiter.
- Töne entstehen im Browser (Web Audio), es werden keine Dateien geladen.
