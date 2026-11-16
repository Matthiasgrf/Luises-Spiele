# Lernspiele für Kindergartenkinder

Sammlung von Browser-Lernspielen. Startseite mit Kacheln, ein Ordner pro Spiel.

- **Zielgruppe:** Kinder von 6 bis 7 Jahren. Sie können noch nicht lesen oder schreiben.
  Genutzt wird die Seite auf Computer, Tablet und Handy.
- **Sprache:** Deutsch, kindgerecht, kurze Sätze.
- **Veröffentlichung:** GitHub Pages direkt aus `main`, ohne Build-Schritt. Die Seite liegt dort in
  einem Unterordner (`name.github.io/<projekt>/`).
- **Keine Abhängigkeiten:** Die Seite selbst braucht nichts. npm dient nur den Tests (Playwright).
- **Keine fremden Server:** keine CDNs, keine Web-Schriften, keine Tracker, keine externen Links.

## Struktur

```
index.html               Startseite, lädt games.js und assets/home.js
games.js                 Liste aller Spiele – die einzige Datei, die die Startseite steuert
404.html                 Seite für falsche Adressen (alles in einer Datei, Link wird berechnet)
.nojekyll                damit GitHub Pages die Dateien unverändert ausliefert
assets/style.css, home.js, favicon.svg     Design und Skript der Startseite
assets/vendor/           gemeinsam genutzte Bibliotheken, Version im Dateinamen, mit Lizenzdatei
games/<ordner>/          ein Ordner pro Spiel
  index.html             das Spiel, eigenständig in einer Datei
  thumbnail.jpg          Vorschaubild, 900×600, JPEG
  readme.md              Inhalt, Steuerung, Besonderheiten
tools/                   neues-spiel.js, thumbnail.js, check.js, smoke.js, lib.js
tools/vorlage/           Startpunkt für neue Spiele (index.html, readme.md)
.github/workflows/       Prüfung bei jedem Push
.github/pull_request_template.md
test-ergebnisse/         Screenshots von smoke.js (nicht im Repository)
```

`games.js` setzt `window.GAMES`. Die Felder sind oben in der Datei erklärt. Pflicht: `id`, `title`,
`description`, `age`, `subject`. Optional: `hidden`, `path`, `thumbnail`. Die Reihenfolge der
Einträge ist die Reihenfolge der Kacheln. Die Filter-Knöpfe entstehen aus den `subject`-Werten –
darum Fächer immer gleich schreiben (z. B. immer „Mathe“, nicht einmal „Mathematik“).

## Werkzeuge

Alle laufen mit Node ohne zusätzliche Pakete; `thumbnail.js` und `smoke.js` brauchen Playwright
(`npm install`, dann `npx playwright install chromium`). Jedes startet seinen eigenen Webserver.

| Befehl | Was es tut |
| --- | --- |
| `node tools/neues-spiel.js <ordner> "<Titel>" ["<Kategorie>"] ["<Alter>"]` | Legt `games/<ordner>/` an, ergänzt fehlende Dateien aus `tools/vorlage/`, hängt den Eintrag an `games.js` an. Überschreibt nichts. Standard: „Sachunterricht“, „6–7 Jahre“. |
| `node tools/thumbnail.js <ordner> [--klick "<css>"] [--verstecken "<css>"] [--warten <ms>]` | Macht einen Screenshot des Spiels als `thumbnail.jpg` (900×600). `--klick` z. B. für den Start-Knopf, `--verstecken` blendet Elemente aus. |
| `node tools/check.js` | Prüft alle Regeln ohne Browser. Exit-Code 1 bei Fehlern. |
| `node tools/smoke.js [ordner]` | Öffnet Startseite, Spiele und 404-Seite mit Chromium in 1280×800 und 390×844 (Touch). Meldet JavaScript-Fehler, Konsolen-Fehler, fehlende Dateien und Zugriffe auf fremde Server. Screenshots in `test-ergebnisse/`. |

**Regeln, die sich automatisch prüfen lassen, gehören in `tools/check.js`** – nicht nur in diese
Datei. Wer eine neue Regel einführt, baut die Prüfung gleich mit ein.

## Checkliste: Neues Spiel hinzufügen

1. **Zweig anlegen.** Nie direkt auf `main` arbeiten.
2. **Ordner:** `node tools/neues-spiel.js <ordner> "<Titel>" "<Kategorie>"`. Ordnername klein, nur
   Buchstaben ohne Umlaute, Ziffern, `-` und `_`. Ein hochgeladenes Spiel vorher als
   `games/<ordner>/index.html` ablegen – das Werkzeug überschreibt es nicht.
3. **Hochgeladene Spiele inhaltlich nicht verändern.** Texte, Aufgaben, Grafik und Spielablauf
   bleiben, wie sie sind. Erlaubt ist nur, was die Regeln hier verlangen (Links zur Übersicht,
   relative Pfade, fremde Server entfernen). Jede Änderung im Pull Request und in der `readme.md`
   nennen. Vor dem Verschieben oder Löschen vorhandener Dateien nachfragen.
4. **Links zur Übersicht:** `<a href="../../">🏠 Alle Spiele</a>` an drei Stellen: Start-Bildschirm,
   während des Spiels (sichtbar, verdeckt keine Steuerung), End-Bildschirm. Hat ein Spiel wirklich
   keinen End-Bildschirm, genügen zwei Links; dann gehört der Kommentar
   `<!-- check: kein End-Bildschirm -->` in die `index.html`.
5. **Pfade:** nur relative Pfade, kein führendes `/`.
6. **Keine fremden Server:** Bibliotheken, Schriften, Bilder und Töne liegen im Repository.
   Gemeinsam genutzte Bibliotheken nach `assets/vendor/` (Version im Dateinamen, Lizenzdatei dazu).
7. **Kachel:** Eintrag in `games.js` ausfüllen – Titel, ein Satz Beschreibung, Alter, Kategorie.
8. **readme:** `games/<ordner>/readme.md` mit Inhalt, Steuerung, Besonderheiten. Kein „TODO“ mehr.
9. **Vorschaubild:** `node tools/thumbnail.js <ordner>` – am besten mit `--klick` auf den Start-Knopf,
   damit man das Spiel sieht und nicht nur den Titel.
10. **Testen:** `node tools/check.js` und `node tools/smoke.js <ordner>` ohne Fehler. Die Screenshots
    in `test-ergebnisse/` ansehen. Das Spiel mit Playwright (oder von Hand) einmal bis zum
    End-Bildschirm durchspielen, auch in Handy-Größe.
11. **Startseite ansehen:** Kachel, Bild, Etiketten und Filter stimmen, auch auf dem Handy im Hochformat.
12. **Pull Request** öffnen und die Vorlage ausfüllen. Ein Spiel pro Pull Request.

## Anforderungen an selbst entwickelte Spiele

Startpunkt ist `tools/vorlage/index.html` – ein kleines, vollständiges Quiz, das alle Regeln erfüllt.

Technik:

- Ein Spiel = eine eigenständige `index.html` (Stil und Skript in der Datei).
- `<html lang="de">`, viewport-Meta-Tag, `<title>`.
- Speicherstand nur unter einem eigenen `localStorage`-Schlüssel pro Spiel (`lernspiele.<ordner>`),
  nie `localStorage.clear()`. Zugriffe in `try/catch`, das Spiel läuft auch ohne Speicher.
- Bedienbar mit Tastatur, Maus und Touch. Echte `<button>`- und `<a>`-Elemente benutzen.
- Kein Hover-Zwang. Tippflächen mindestens 48 px, Antwort-Knöpfe deutlich größer.
- Läuft auf dem Handy im Hochformat (390×844) ohne seitliches Schieben.

Für Kinder, die nicht lesen können:

- Bilder, Emojis, Farben und Töne tragen die Bedeutung, nicht der Text.
- Fragen und Rückmeldungen vorlesen (`speechSynthesis`, `de-DE`), mit einem 🔊-Knopf zum Wiederholen.
  Ohne Sprachausgabe muss das Spiel trotzdem funktionieren.
- Kurze Sätze. Du-Form. Keine Fachwörter.
- Antworten sind Bilder, Zahlen oder ein einzelnes kurzes Wort – getippt wird, nie geschrieben.

Spielablauf:

- Start-, Spiel- und End-Bildschirm.
- Sichtbarer Fortschritt („Frage 3 / 10“ und ein Balken).
- Falsche Antwort: freundliche Rückmeldung, neuer Versuch. Kein Punktabzug, kein Zeitdruck, kein „Verloren“.
- Richtige Antwort: kurze Erklärung in einem Satz.
- Am Ende „Nochmal spielen“ und der Link zur Übersicht.
- Ton erst nach dem ersten Tippen starten (sonst blockt der Browser ihn).

## Git-Regeln

- Nie direkt auf `main` arbeiten oder pushen. Immer ein Zweig und ein Pull Request.
- Ein Spiel pro Pull Request. Änderungen an Startseite oder Werkzeugen bekommen einen eigenen.
- Vor jedem Commit: `node tools/check.js`. Vor jedem Pull Request zusätzlich `node tools/smoke.js`.
- `node_modules/` und `test-ergebnisse/` gehören nicht ins Repository.
- Bei jedem Push läuft `.github/workflows/pruefung.yml` (check, dann smoke). Die Screenshots hängen
  als Artefakt am Lauf.
