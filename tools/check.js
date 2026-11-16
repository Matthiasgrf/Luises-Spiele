#!/usr/bin/env node
// Prüft die ganze Sammlung ohne Browser:
//   node tools/check.js
// Bei Fehlern endet das Programm mit Exit-Code 1. Warnungen sind erlaubt.
//
// Regeln, die sich automatisch prüfen lassen, gehören in diese Datei.
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, GAMES_DIR, ID_MUSTER, ladeSpiele, spielPfad, bildPfad, jpegGroesse } = require('./lib');

const PFLICHT = ['id', 'title', 'description', 'age', 'subject'];
const HEIM_TEXT = '🏠 Alle Spiele';
// Spiele ohne End-Bildschirm (freies Erkunden) tragen diesen Kommentar und brauchen nur zwei Links.
const OHNE_ENDE = '<!-- check: kein End-Bildschirm -->';
const TEXT_ENDUNGEN = ['.html', '.htm', '.css', '.js', '.mjs', '.svg', '.json'];

let fehlerZahl = 0;
let warnZahl = 0;
let abschnittOffen = null;
let abschnittMeldungen = 0;

function abschnitt(name) {
  abschnittEnde();
  abschnittOffen = name;
  abschnittMeldungen = 0;
}
function abschnittEnde() {
  if (abschnittOffen !== null && abschnittMeldungen === 0) console.log('✔ ' + abschnittOffen);
  abschnittOffen = null;
}
function melde(zeichen, text) {
  if (abschnittOffen !== null && abschnittMeldungen === 0) console.log('▸ ' + abschnittOffen);
  abschnittMeldungen++;
  console.log('    ' + zeichen + ' ' + text);
}
const fehler = (text) => { fehlerZahl++; melde('✖', text); };
const warnung = (text) => { warnZahl++; melde('⚠', text); };

const rel = (datei) => path.relative(ROOT, datei).split(path.sep).join('/') || '.';
const lies = (datei) => fs.readFileSync(datei, 'utf8');
const istDatei = (datei) => { try { return fs.statSync(datei).isFile(); } catch (e) { return false; } };
const istOrdner = (datei) => { try { return fs.statSync(datei).isDirectory(); } catch (e) { return false; } };

/** Gibt es die Datei mit genau dieser Schreibweise? (GitHub Pages unterscheidet Groß und klein.) */
function gibtEsGenau(datei) {
  if (!fs.existsSync(datei)) return false;
  let p = datei;
  while (p !== ROOT && p.startsWith(ROOT)) {
    if (!fs.readdirSync(path.dirname(p)).includes(path.basename(p))) return false;
    p = path.dirname(p);
  }
  return true;
}

function alleDateien(ordner) {
  const liste = [];
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) liste.push(...alleDateien(p));
    else liste.push(p);
  }
  return liste;
}

// ---------------------------------------------------------------- Texte prüfen

/** Zerlegt HTML in: Markup ohne Skript/Stil-Inhalte, alle Skripte, alle Stile. */
function zerlegeHtml(html) {
  const skripte = [];
  const stile = [];
  let markup = html.replace(/<!--[\s\S]*?-->/g, '');
  markup = markup.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (_, a, inhalt, z) => { skripte.push(inhalt); return a + z; });
  markup = markup.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, a, inhalt, z) => { stile.push(inhalt); return a + z; });
  return { markup, skript: skripte.join('\n'), stil: stile.join('\n') };
}

/** Alle Verweise (src, href, …) aus dem Markup. */
function verweiseAusMarkup(markup) {
  const liste = [];
  const muster = /<([a-zA-Z][\w:-]*)\b[^>]*>/g;
  let tag;
  while ((tag = muster.exec(markup))) {
    const attrMuster = /\s(src|href|poster|data|action|formaction|srcset|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    let a;
    while ((a = attrMuster.exec(tag[0]))) {
      const name = a[1].toLowerCase();
      const wert = (a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4]).trim();
      if (name === 'data' && tag[1].toLowerCase() !== 'object') continue;
      if (name === 'srcset') {
        wert.split(',').forEach((teil) => { const u = teil.trim().split(/\s+/)[0]; if (u) liste.push({ tag: tag[1].toLowerCase(), wert: u }); });
      } else liste.push({ tag: tag[1].toLowerCase(), wert });
    }
  }
  return liste;
}

function verweiseAusCss(css) {
  const liste = [];
  const ohneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let m;
  const url = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi;
  while ((m = url.exec(ohneKommentare))) liste.push({ tag: 'css', wert: (m[1] || m[2] || m[3] || '').trim() });
  const imp = /@import\s+(?:"([^"]*)"|'([^']*)')/gi;
  while ((m = imp.exec(ohneKommentare))) liste.push({ tag: 'css', wert: (m[1] || m[2]).trim() });
  return liste;
}

const FREMD = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;           // http://…, https://…, //…
const SCHEMA = /^[a-z][a-z0-9+.-]*:/i;                    // data:, mailto:, blob:, …

/** Sucht in Skripten nach Zugriffen auf fremde Server und nach absoluten Pfaden. */
function pruefeSkript(skript, name) {
  const fremd = [
    /\b(?:fetch|importScripts|import|sendBeacon|WebSocket|EventSource|Worker|SharedWorker)\s*\(\s*["'`]\s*(?:https?:|wss?:)?\/\/[^"'`\s]*/g,
    /\.open\(\s*["'`][A-Za-z]+["'`]\s*,\s*["'`]\s*(?:https?:)?\/\/[^"'`\s]*/g,
    /\b(?:from|import)\s+["'`](?:https?:)?\/\/[^"'`\s]*/g,
    /\.(?:src|href)\s*=\s*["'`]\s*(?:https?:)?\/\/[^"'`\s]*/g,
    /\b(?:src|href)\s*=\s*\\?["']\s*(?:https?:)?\/\/[^"'`\s\\]*/g,
  ];
  const gefunden = new Set();
  for (const m of fremd) for (const t of skript.match(m) || []) gefunden.add(t.slice(0, 90));
  gefunden.forEach((t) => fehler(name + ': Verweis auf einen fremden Server im Skript: ' + t));

  const absolut = [
    /\b(?:fetch|importScripts|import|Worker)\s*\(\s*["'`]\/(?!\/)[^"'`\s]*/g,
    /\.(?:src|href)\s*=\s*["'`]\/(?!\/)[^"'`\s]*/g,
    /\blocation(?:\.href)?\s*=\s*["'`]\/(?!\/)[^"'`\s]*/g,
  ];
  const abs = new Set();
  for (const m of absolut) for (const t of skript.match(m) || []) abs.add(t.slice(0, 90));
  abs.forEach((t) => fehler(name + ': absoluter Pfad im Skript (führendes „/“): ' + t));
}

/**
 * Prüft Verweise einer Datei: keine fremden Server, keine absoluten Pfade, Ziel vorhanden.
 * Gibt zurück, wie viele <a>-Links auf die Startseite (Hauptordner) zeigen.
 */
function pruefeVerweise(verweise, datei) {
  const name = rel(datei);
  let heimLinks = 0;
  const gemeldet = new Set();
  for (const { tag, wert } of verweise) {
    if (!wert || wert.startsWith('#')) continue;
    const schluessel = tag + ' ' + wert;
    if (FREMD.test(wert)) {
      if (!gemeldet.has(schluessel)) fehler(name + ': Verweis auf einen fremden Server: ' + wert.slice(0, 90));
      gemeldet.add(schluessel);
      continue;
    }
    if (SCHEMA.test(wert)) continue;
    if (wert.startsWith('/')) {
      if (!gemeldet.has(schluessel)) fehler(name + ': absoluter Pfad „' + wert + '“ – bitte relativ schreiben (ohne führendes „/“).');
      gemeldet.add(schluessel);
      continue;
    }
    let pfad = wert.split('#')[0].split('?')[0];
    try { pfad = decodeURIComponent(pfad); } catch (e) { /* so lassen */ }
    const ziel = path.resolve(path.dirname(datei), pfad);
    if (ziel !== ROOT && !ziel.startsWith(ROOT + path.sep)) {
      if (!gemeldet.has(schluessel)) fehler(name + ': „' + wert + '“ zeigt aus dem Projekt heraus.');
      gemeldet.add(schluessel);
      continue;
    }
    if (tag === 'a' && ziel === ROOT) heimLinks++;
    const echtesZiel = istOrdner(ziel) ? path.join(ziel, 'index.html') : ziel;
    if (!gibtEsGenau(echtesZiel)) {
      if (!gemeldet.has(schluessel)) fehler(name + ': „' + wert + '“ gibt es nicht (Schreibweise und Groß-/Kleinschreibung prüfen).');
      gemeldet.add(schluessel);
    }
  }
  return heimLinks;
}

/** Prüft eine Textdatei (HTML, CSS, JS, SVG). Gibt Infos für weitere Prüfungen zurück. */
function pruefeTextdatei(datei) {
  const endung = path.extname(datei).toLowerCase();
  const text = lies(datei);
  const name = rel(datei);
  let heimLinks = 0;
  let skript = '';
  if (endung === '.html' || endung === '.htm' || endung === '.svg') {
    const teile = zerlegeHtml(text);
    skript = teile.skript;
    heimLinks = pruefeVerweise(verweiseAusMarkup(teile.markup), datei);
    pruefeVerweise(verweiseAusCss(teile.stil), datei);
    // style="…url(…)…" direkt im Markup
    pruefeVerweise(verweiseAusCss((teile.markup.match(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi) || []).join('\n')), datei);
  } else if (endung === '.css') {
    pruefeVerweise(verweiseAusCss(text), datei);
  } else if (endung === '.js' || endung === '.mjs') {
    skript = text;
  }
  if (skript) pruefeSkript(skript, name);
  return { text, skript, heimLinks };
}

/** Findet localStorage-Schlüssel in einem Skript. */
function speicherSchluessel(skript, name) {
  const schluessel = new Set();
  if (/localStorage\s*\.\s*clear\s*\(/.test(skript)) {
    fehler(name + ': localStorage.clear() ist verboten – das löscht auch die Spielstände der anderen Spiele.');
  }
  let m;
  const aufruf = /localStorage\s*\.\s*(?:getItem|setItem|removeItem)\s*\(\s*([^,)]+)/g;
  while ((m = aufruf.exec(skript))) {
    const arg = m[1].trim();
    const wort = /^(["'`])([^"'`$]*)\1$/.exec(arg);
    if (wort) { schluessel.add(wort[2]); continue; }
    if (/^[A-Za-z_$][\w$]*$/.test(arg)) {
      const def = new RegExp('\\b(?:const|let|var)\\s+' + arg.replace(/\$/g, '\\$') + '\\s*=\\s*(["\'`])([^"\'`$]*)\\1').exec(skript);
      if (def) { schluessel.add(def[2]); continue; }
    }
    warnung(name + ': localStorage-Schlüssel „' + arg.slice(0, 40) + '“ lässt sich nicht automatisch erkennen. Bitte einen festen Text benutzen.');
  }
  const klammer = /localStorage\s*\[\s*(["'`])([^"'`$]*)\1\s*\]/g;
  while ((m = klammer.exec(skript))) schluessel.add(m[2]);
  return schluessel;
}

// ---------------------------------------------------------------- Ablauf

const speicher = new Map(); // Schlüssel -> Set der Besitzer
function merkeSchluessel(besitzer, schluessel) {
  schluessel.forEach((s) => {
    if (!speicher.has(s)) speicher.set(s, new Set());
    speicher.get(s).add(besitzer);
  });
}

// 1. games.js
abschnitt('games.js');
let spiele = null;
try {
  spiele = ladeSpiele();
  if (!Array.isArray(spiele)) {
    fehler('window.GAMES muss eine Liste sein: window.GAMES = [ … ];');
    spiele = null;
  }
} catch (e) {
  fehler('games.js lässt sich nicht lesen: ' + e.message);
}

const gueltig = [];
if (spiele) {
  const gesehen = new Map();
  spiele.forEach((spiel, i) => {
    const wo = 'Eintrag ' + (i + 1) + (spiel && typeof spiel.id === 'string' ? ' („' + spiel.id + '“)' : '');
    if (!spiel || typeof spiel !== 'object') { fehler(wo + ': ist kein Objekt { … }.'); return; }
    let ok = true; // false nur, wenn sich das Spiel wegen kaputter Pfade nicht weiter prüfen lässt
    for (const feld of PFLICHT) {
      if (typeof spiel[feld] !== 'string' || !spiel[feld].trim()) fehler(wo + ': Pflichtfeld „' + feld + '“ fehlt oder ist leer.');
      else if (spiel[feld].includes('TODO')) fehler(wo + ': Im Feld „' + feld + '“ steht noch „TODO“.');
    }
    for (const feld of ['path', 'thumbnail']) {
      if (spiel[feld] === undefined) continue;
      if (typeof spiel[feld] !== 'string' || !spiel[feld].trim()) { fehler(wo + ': „' + feld + '“ muss ein Text sein.'); ok = false; }
      else if (FREMD.test(spiel[feld]) || SCHEMA.test(spiel[feld])) { fehler(wo + ': „' + feld + '“ zeigt auf einen fremden Server.'); ok = false; }
      else if (spiel[feld].startsWith('/')) { fehler(wo + ': „' + feld + '“ ist ein absoluter Pfad – bitte ohne führendes „/“.'); ok = false; }
    }
    if (spiel.hidden !== undefined && typeof spiel.hidden !== 'boolean') fehler(wo + ': „hidden“ muss true oder false sein.');
    if (typeof spiel.id !== 'string' || !spiel.id.trim()) return;
    if (!ID_MUSTER.test(spiel.id)) { fehler(wo + ': „id“ darf nur Buchstaben ohne Umlaute, Ziffern, „-“ und „_“ enthalten.'); return; }
    const klein = spiel.id.toLowerCase();
    if (gesehen.has(klein)) { fehler(wo + ': Die id gibt es doppelt (auch Eintrag ' + gesehen.get(klein) + ').'); return; }
    gesehen.set(klein, i + 1);
    if (ok) gueltig.push(spiel);
  });
}

// 2. Jeder Ordner in games/ braucht einen Eintrag
if (spiele && istOrdner(GAMES_DIR)) {
  // Ohne Groß-/Kleinschreibung vergleichen: Eine falsche Schreibweise meldet Schritt 3 genauer.
  const belegt = new Set(gueltig.map((s) => path.resolve(ROOT, spielPfad(s).replace(/[^/]*\.html$/, '')).toLowerCase()));
  for (const e of fs.readdirSync(GAMES_DIR, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (!belegt.has(path.join(GAMES_DIR, e.name).toLowerCase())) fehler('Der Ordner games/' + e.name + '/ hat keinen Eintrag in games.js.');
  }
}

// 3. Jedes Spiel
for (const spiel of gueltig) {
  abschnitt('games/' + spiel.id + (spiel.hidden ? '  (versteckt)' : ''));
  const seite = spielPfad(spiel);
  const ordner = path.resolve(ROOT, seite.replace(/[^/]*\.html$/, ''));
  const index = path.resolve(ROOT, seite.endsWith('/') ? seite + 'index.html' : seite);

  if (ordner !== ROOT && !ordner.startsWith(ROOT + path.sep)) { fehler('Der Pfad zeigt aus dem Projekt heraus: ' + seite); continue; }
  const geschwister = istOrdner(path.dirname(ordner)) ? fs.readdirSync(path.dirname(ordner)) : [];
  const aehnlich = geschwister.find((n) => n !== path.basename(ordner) && n.toLowerCase() === path.basename(ordner).toLowerCase());
  if (!istOrdner(ordner) && !aehnlich) { fehler('Der Ordner ' + rel(ordner) + '/ fehlt.'); continue; }
  if (aehnlich || !gibtEsGenau(ordner)) { fehler('Der Ordner ' + rel(ordner) + '/ ist anders geschrieben als in games.js (Groß-/Kleinschreibung).'); continue; }

  // readme.md
  const readme = path.join(ordner, 'readme.md');
  if (!gibtEsGenau(readme)) fehler('readme.md fehlt.');
  else {
    const text = lies(readme);
    if (!text.trim()) fehler('readme.md ist leer.');
    if (text.includes('TODO')) fehler('In readme.md steht noch „TODO“.');
  }

  // thumbnail.jpg
  const bild = path.resolve(ROOT, bildPfad(spiel));
  if (!gibtEsGenau(bild)) fehler(rel(bild) + ' fehlt. Erzeugen mit: node tools/thumbnail.js ' + spiel.id);
  else {
    const daten = fs.readFileSync(bild);
    const g = jpegGroesse(daten);
    if (!g) fehler(rel(bild) + ' ist keine JPEG-Datei.');
    else if (g.breite !== 900 || g.hoehe !== 600) fehler(rel(bild) + ' ist ' + g.breite + '×' + g.hoehe + ' groß, muss aber genau 900×600 sein.');
    if (daten.length > 250 * 1024) warnung(rel(bild) + ' ist ' + Math.round(daten.length / 1024) + ' KB groß (empfohlen: höchstens 250 KB).');
  }

  // index.html
  if (!gibtEsGenau(index)) { fehler(rel(index) + ' fehlt.'); continue; }
  let heimLinks = 0;
  let html = '';
  const schluessel = new Set();
  for (const datei of alleDateien(ordner)) {
    if (!TEXT_ENDUNGEN.includes(path.extname(datei).toLowerCase())) continue;
    const info = pruefeTextdatei(datei);
    if (info.skript) speicherSchluessel(info.skript, rel(datei)).forEach((s) => schluessel.add(s));
    if (datei === index) { heimLinks = info.heimLinks; html = info.text; }
  }
  merkeSchluessel('games/' + spiel.id, schluessel);

  if (html.includes('TODO')) fehler('In ' + rel(index) + ' steht noch „TODO“.');
  if (!/<html\b[^>]*\blang\s*=\s*["']?de\b/i.test(html)) fehler('<html lang="de"> fehlt.');
  if (!/<meta\b[^>]*name\s*=\s*["']?viewport/i.test(html)) fehler('Das viewport-Meta-Tag fehlt.');
  if (!/<title>\s*[^<\s][^<]*<\/title>/i.test(html)) fehler('Der <title> fehlt oder ist leer.');

  const texte = html.split(HEIM_TEXT).length - 1;
  const noetig = html.includes(OHNE_ENDE) ? 2 : 3;
  if (heimLinks === 0) fehler('Der Link zur Übersicht fehlt: <a href="../../">' + HEIM_TEXT + '</a>');
  else if (heimLinks < noetig) {
    fehler('Nur ' + heimLinks + ' Link(s) zur Übersicht gefunden, nötig sind ' + noetig + ' (Start-Bildschirm, im Spiel, End-Bildschirm).');
  }
  if (texte === 0) fehler('Der Text „' + HEIM_TEXT + '“ fehlt.');
  else if (texte < noetig) fehler('Der Text „' + HEIM_TEXT + '“ steht nur ' + texte + '-mal im Spiel, nötig sind ' + noetig + '.');
}

// 4. Startseite und gemeinsame Dateien
abschnitt('Startseite und gemeinsame Dateien');
for (const name of ['index.html', '404.html', '.nojekyll', 'assets/style.css', 'assets/home.js', 'assets/favicon.svg']) {
  if (!gibtEsGenau(path.join(ROOT, name))) fehler(name + ' fehlt.');
}
const gemeinsam = ['index.html', '404.html'].map((n) => path.join(ROOT, n)).filter(istDatei);
if (istOrdner(path.join(ROOT, 'assets'))) {
  gemeinsam.push(...alleDateien(path.join(ROOT, 'assets')).filter((d) => {
    const imVendor = rel(d).startsWith('assets/vendor/');
    return TEXT_ENDUNGEN.includes(path.extname(d).toLowerCase()) && !imVendor;
  }));
}
const startSchluessel = new Set();
for (const datei of gemeinsam) {
  const info = pruefeTextdatei(datei);
  if (info.skript) speicherSchluessel(info.skript, rel(datei)).forEach((s) => startSchluessel.add(s));
}
merkeSchluessel('Startseite', startSchluessel);

// 5. localStorage-Schlüssel dürfen nicht doppelt vergeben sein
abschnitt('Speicherstände (localStorage)');
for (const [s, besitzer] of speicher) {
  if (besitzer.size > 1) fehler('Der Schlüssel „' + s + '“ wird mehrfach benutzt: ' + [...besitzer].join(', ') + '. Jedes Spiel braucht einen eigenen.');
}
abschnittEnde();

// Ergebnis
console.log('');
if (fehlerZahl) {
  console.log('✖ ' + fehlerZahl + ' Fehler' + (warnZahl ? ', ' + warnZahl + ' Warnung(en)' : '') + '. Bitte beheben und noch einmal prüfen.');
  process.exit(1);
}
console.log('✔ Alles in Ordnung: ' + gueltig.length + ' Spiel(e) geprüft' + (warnZahl ? ', ' + warnZahl + ' Warnung(en)' : '') + '.');
