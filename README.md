# Lernspiele für Kindergartenkinder

Eine kleine Sammlung von Lernspielen für Kinder von 6 bis 7 Jahren. Die Spiele laufen im Browser
auf Computer, Tablet und Handy. Die Kinder müssen nicht lesen können: Die Spiele arbeiten mit
Bildern, großen Knöpfen und Sprache.

- Keine Werbung, keine Anmeldung, keine Tracker.
- Nichts wird von fremden Servern geladen. Die Seite funktioniert auch in Schulnetzen mit Filtern.
- Kein Build-Schritt: GitHub Pages liefert die Dateien direkt aus dem Zweig `main` aus.

## Lokal starten

```bash
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000/` öffnen.

## Aufbau

| Ort | Inhalt |
| --- | --- |
| `index.html` | Startseite mit den Kacheln |
| `games.js` | Liste aller Spiele – nur diese Datei steuert die Startseite |
| `games/<ordner>/` | ein Ordner pro Spiel: `index.html`, `thumbnail.jpg`, `readme.md` |
| `assets/` | Design und Skript der Startseite, gemeinsame Bibliotheken in `assets/vendor/` |
| `tools/` | Werkzeuge zum Anlegen und Prüfen |
| `404.html` | freundliche Seite für falsche Adressen |

## Ein Spiel hinzufügen

```bash
node tools/neues-spiel.js formen-finden "Formen finden" "Mathe"
```

Das legt `games/formen-finden/` mit einem fertigen Quiz-Gerüst an und trägt das Spiel in `games.js`
ein. Vorhandene Dateien werden nie überschrieben – ein fertiges Spiel kann also vorher schon als
`games/formen-finden/index.html` im Ordner liegen.

Danach:

1. Spiel bauen oder anpassen, Beschreibung in `games.js` und `readme.md` ausfüllen.
2. Vorschaubild machen:

   ```bash
   node tools/thumbnail.js formen-finden --klick "#los"
   ```

3. Prüfen:

   ```bash
   node tools/check.js
   ```

   ```bash
   node tools/smoke.js
   ```

4. Pull Request öffnen – ein Spiel pro Pull Request.

Für `thumbnail.js` und `smoke.js` braucht man einmalig Playwright:

```bash
npm install
```

```bash
npx playwright install chromium
```

Alle Regeln und die ganze Checkliste stehen in [CLAUDE.md](CLAUDE.md).

## Veröffentlichung

GitHub Pages, Quelle: Zweig `main`, Ordner `/ (root)`. Bei jedem Push prüft GitHub Actions die
Sammlung (`.github/workflows/pruefung.yml`) und legt Screenshots als Artefakt ab.
