// Liste aller Spiele. Nur diese Datei steuert die Startseite.
// Die Reihenfolge hier ist die Reihenfolge der Kacheln.
//
// Pflichtfelder:
//   id           Ordnername unter games/ (genau gleiche Groß-/Kleinschreibung;
//                nur Buchstaben ohne Umlaute, Ziffern, "-" und "_")
//   title        Name des Spiels auf der Kachel
//   description  ein kurzer Satz: Was macht man in dem Spiel?
//   age          Alter, z. B. "6–7 Jahre" oder "3. Klasse"
//   subject      Kategorie (Fach), z. B. "Sachunterricht", "Mathe", "Erdkunde"
//
// Optional:
//   hidden: true   Spiel erscheint nicht auf der Startseite
//   path           Pfad zum Spiel, wenn er nicht "games/<id>/" ist
//   thumbnail      Pfad zum Bild, wenn er nicht "games/<id>/thumbnail.jpg" ist
//
// Neues Spiel anlegen:  node tools/neues-spiel.js <ordner> "<Titel>"
// Alles prüfen:         node tools/check.js

window.GAMES = [
  {
    id: 'wochentage-einhorn',
    title: 'Wochentage mit dem Einhorn',
    description: 'Lauf mit dem Einhorn von Insel zu Insel und lerne die sieben Wochentage.',
    age: '6–7 Jahre',
    subject: 'Sachunterricht',
  },
  {
    id: 'wie-viele',
    title: 'Wie viele sind es?',
    description: 'Zähle Äpfel, Enten und Sterne und tippe auf die richtige Zahl.',
    age: '6–7 Jahre',
    subject: 'Mathe',
  },
  {
    id: 'meerjungfrau-alphabet',
    title: 'Meerjungfrauen-Alphabet',
    description: 'Schwimm mit der Meerjungfrau, sammle Muscheln und finde die richtigen Buchstaben.',
    age: '6–7 Jahre',
    subject: 'Deutsch',
  },
];
