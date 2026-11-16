#!/usr/bin/env node
// Legt ein neues Spiel an:
//   node tools/neues-spiel.js <ordner> "<Titel>" ["<Kategorie>"] ["<Alter>"]
//
// - legt games/<ordner>/ an (falls er fehlt)
// - ergänzt fehlende Dateien aus tools/vorlage/
// - hängt den Eintrag an games.js an (falls er fehlt)
// Überschreibt nichts.
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, GAMES_DIR, GAMES_JS, ID_MUSTER, ladeSpiele } = require('./lib');

const VORLAGE = path.join(__dirname, 'vorlage');
const [ordner, titel, kategorie = 'Sachunterricht', alter = '6–7 Jahre'] = process.argv.slice(2);

if (!ordner || !titel) {
  console.error('Aufruf: node tools/neues-spiel.js <ordner> "<Titel>" ["<Kategorie>"] ["<Alter>"]');
  console.error('Beispiel: node tools/neues-spiel.js formen-finden "Formen finden" "Mathe" "6–7 Jahre"');
  process.exit(1);
}
if (!ID_MUSTER.test(ordner)) {
  console.error('Der Ordnername "' + ordner + '" geht nicht.');
  console.error('Erlaubt sind nur Buchstaben ohne Umlaute, Ziffern, "-" und "_". Beispiel: formen-finden');
  process.exit(1);
}

let spiele;
try {
  spiele = ladeSpiele();
  if (!Array.isArray(spiele)) throw new Error('window.GAMES ist keine Liste.');
} catch (e) {
  console.error('games.js lässt sich nicht lesen: ' + e.message);
  process.exit(1);
}
const andereSchreibweise = spiele.find((s) => s && typeof s.id === 'string' && s.id !== ordner && s.id.toLowerCase() === ordner.toLowerCase());
if (andereSchreibweise) {
  console.error('Es gibt schon ein Spiel "' + andereSchreibweise.id + '" – nur die Groß-/Kleinschreibung ist anders.');
  process.exit(1);
}

const js = (text) => "'" + String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const html = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 1. Ordner
const ziel = path.join(GAMES_DIR, ordner);
if (!fs.existsSync(ziel)) {
  fs.mkdirSync(ziel, { recursive: true });
  console.log('✔ Ordner angelegt:      games/' + ordner + '/');
} else {
  console.log('• Ordner gibt es schon: games/' + ordner + '/');
}

// 2. Fehlende Dateien aus der Vorlage
for (const name of fs.readdirSync(VORLAGE)) {
  const zielDatei = path.join(ziel, name);
  const anzeige = path.relative(ROOT, zielDatei).split(path.sep).join('/');
  if (fs.existsSync(zielDatei)) {
    console.log('• bleibt unverändert:   ' + anzeige);
    continue;
  }
  const text = fs.readFileSync(path.join(VORLAGE, name), 'utf8')
    .split('{{ORDNER}}').join(ordner)
    .split('{{TITEL_JS}}').join(js(titel))
    .split('{{TITEL}}').join(name.endsWith('.html') ? html(titel) : titel)
    .split('{{KATEGORIE}}').join(kategorie)
    .split('{{ALTER}}').join(alter);
  fs.writeFileSync(zielDatei, text, { flag: 'wx' });
  console.log('✔ aus Vorlage ergänzt:  ' + anzeige);
}

// 3. Eintrag in games.js
if (spiele.some((s) => s && s.id === ordner)) {
  console.log('• Eintrag gibt es schon in games.js');
} else {
  const quelle = fs.readFileSync(GAMES_JS, 'utf8');
  const ende = quelle.lastIndexOf('];');
  if (ende < 0) {
    console.error('In games.js fehlt das Ende der Liste ("];"). Bitte den Eintrag von Hand ergänzen.');
    process.exit(1);
  }
  let davor = quelle.slice(0, ende).replace(/\s+$/, '');
  if (!davor.endsWith(',') && !davor.endsWith('[')) davor += ',';
  const eintrag = [
    '  {',
    '    id: ' + js(ordner) + ',',
    '    title: ' + js(titel) + ',',
    "    description: 'TODO: Ein kurzer Satz – was macht man in dem Spiel?',",
    '    age: ' + js(alter) + ',',
    '    subject: ' + js(kategorie) + ',',
    '  },',
  ].join('\n');
  fs.writeFileSync(GAMES_JS, davor + '\n' + eintrag + '\n' + quelle.slice(ende));
  console.log('✔ Eintrag angehängt:    games.js');
}

console.log('\nSo geht es weiter:');
console.log('  1. Spiel bauen:        games/' + ordner + '/index.html');
console.log('  2. Texte ausfüllen:    Beschreibung in games.js und games/' + ordner + '/readme.md (alle „TODO“ ersetzen)');
console.log('  3. Vorschaubild:       node tools/thumbnail.js ' + ordner);
console.log('  4. Prüfen:             node tools/check.js  und  node tools/smoke.js ' + ordner);
