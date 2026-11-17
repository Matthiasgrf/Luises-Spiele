# Kleine Schildkröte

- **Kategorie:** Gemischt
- **Alter:** 6–7 Jahre

## Inhalt

Eine süße Babyschildkröte läuft über den sandigen Meeresboden. Sie sammelt Münzen, die wie kleine
goldene Delfine aussehen. Quallen und Krabben versperren den Weg – die muss die Schildkröte
aufessen. Immer wieder schwebt ein Herz am Weg. Läuft die Schildkröte hindurch, kommt eine Aufgabe.
Neun Herzen pro Runde, drei Arten im Wechsel:

- **Labyrinth:** Die Schildkröte muss durch ein Labyrinth zum Herz. Erst 4×4, dann 5×5, dann 6×6 Felder.
- **Äpfel zählen:** 3 bis 10 Äpfel, in Fünferreihen. Das Kind tippt auf die richtige Zahl.
- **Anfangsbuchstaben:** Ein Tier erscheint (🐻), das Wort wird vorgelesen: „Bär. Womit fängt Bär an?“
  Drei Buchstaben zur Auswahl. 18 Tiere mit klarem Anfangslaut.

Es gibt keinen Zeitdruck und kein „Verloren“. Verpasste Münzen kosten nichts. Ein Gegner hält die
Schildkröte nur an, bis er aufgegessen ist.

## Steuerung

- Die Schildkröte läuft von selbst.
- ⬆️ (blauer Knopf): springen – so erreicht man die Münzen weiter oben.
- 😋 (rosa Knopf): aufessen. Der Knopf wackelt, wenn ein Gegner vor der Schildkröte steht.
- Ins Meer tippen geht auch: Steht ein Gegner nah, wird er gegessen, sonst springt die Schildkröte.
- Tastatur: Pfeil hoch oder W springt, M oder Pfeil rechts isst auf.
- Labyrinth: Pfeil-Knöpfe, Pfeiltasten (oder W, A, S, D) oder ins Labyrinth tippen. Tippt man auf ein
  Feld in derselben Reihe, läuft die Schildkröte bis dorthin, wenn keine Wand im Weg ist.
  Gegen eine Wand wackelt es nur kurz.
- Äpfel und Buchstaben: antippen. Tastatur: die Zahl (0 für 10) oder der Buchstabe; bei den
  Buchstaben auch 1 bis 3.
- 🔊 liest die Aufgabe noch einmal vor.
- Falsche Antwort: freundlicher Hinweis, die Antwort wird gesperrt, neuer Versuch.
- Jede gelöste Aufgabe schenkt 3 Delfin-Münzen.
- Am Ende: Zahl der Delfin-Münzen, der gegessenen Gegner und ein Stern für jede Aufgabe, die beim
  ersten Versuch richtig war (ein Labyrinth gibt immer einen Stern).

## Besonderheiten

- Selbst entwickelt, eine Datei, keine Bibliothek. Meer, Schildkröte, Delfin-Münzen, Gegner, Herzen
  und Labyrinth werden auf Zeichenflächen (`canvas`) gemalt. Nur Fische, Äpfel und Tiere sind Emojis.
- Speicherstand: `localStorage`-Schlüssel `lernspiele.schildkroete` (die meisten Delfin-Münzen).
- Vorlesen nutzt die Sprachausgabe des Geräts (`speechSynthesis`, Deutsch). Ohne Stimme geht alles,
  die Bilder zeigen, was zu tun ist.
- Töne entstehen im Browser (Web Audio), es werden keine Dateien geladen.
- Bei „Bewegung reduzieren“ im Gerät wippen und schwanken die Figuren nicht.
