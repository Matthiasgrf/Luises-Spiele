// Gemeinsame Helfer für die Werkzeuge in tools/.
// Braucht nur Node – keine zusätzlichen Pakete.
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const GAMES_JS = path.join(ROOT, 'games.js');
const ERGEBNIS_DIR = path.join(ROOT, 'test-ergebnisse');

// Erlaubte Ordnernamen: Buchstaben ohne Umlaute, Ziffern, "-" und "_".
const ID_MUSTER = /^[A-Za-z0-9_-]+$/;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

/** Liest games.js und gibt window.GAMES zurück (wirft bei Fehlern). */
function ladeSpiele() {
  const code = fs.readFileSync(GAMES_JS, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: 'games.js' });
  return sandbox.window.GAMES;
}

/** Pfad zum Spiel, relativ zum Hauptordner, immer mit "/" am Ende. */
function spielPfad(spiel) {
  const p = spiel.path || 'games/' + spiel.id + '/';
  return p.endsWith('/') || p.endsWith('.html') ? p : p + '/';
}

/** Pfad zum Vorschaubild, relativ zum Hauptordner. */
function bildPfad(spiel) {
  return spiel.thumbnail || 'games/' + spiel.id + '/thumbnail.jpg';
}

/**
 * Startet einen kleinen Webserver für den Hauptordner auf einem freien Port.
 * Verhält sich wie GitHub Pages: Ordner liefern ihre index.html,
 * unbekannte Adressen liefern 404.html mit Status 404.
 */
function starteServer() {
  const server = http.createServer((req, res) => {
    let urlPfad;
    try {
      urlPfad = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      res.writeHead(400).end();
      return;
    }
    let datei = path.join(ROOT, path.normalize(urlPfad));
    if (datei !== ROOT && !datei.startsWith(ROOT + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    let status = 200;
    try {
      if (fs.statSync(datei).isDirectory()) {
        if (!urlPfad.endsWith('/')) {
          res.writeHead(301, { Location: urlPfad + '/' }).end();
          return;
        }
        datei = path.join(datei, 'index.html');
      }
      fs.accessSync(datei);
    } catch (e) {
      status = 404;
      datei = path.join(ROOT, '404.html');
    }
    fs.readFile(datei, (fehler, inhalt) => {
      if (fehler) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
        return;
      }
      res.writeHead(status, {
        'Content-Type': MIME[path.extname(datei).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(inhalt);
    });
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const url = 'http://127.0.0.1:' + server.address().port + '/';
      resolve({ url, stop: () => new Promise((r) => server.close(r)) });
    });
  });
}

/** Lädt Playwright oder beendet das Programm mit einer verständlichen Meldung. */
function ladePlaywright() {
  try {
    return require('playwright');
  } catch (e) {
    console.error('Playwright fehlt. Bitte einmal ausführen:\n  npm install\n  npx playwright install chromium');
    process.exit(1);
  }
}

/** Liest Breite und Höhe aus einer JPEG-Datei. Gibt null zurück, wenn es kein JPEG ist. */
function jpegGroesse(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xff) { i++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const laenge = buf.readUInt16BE(i + 2);
    const istSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (istSOF) return { hoehe: buf.readUInt16BE(i + 5), breite: buf.readUInt16BE(i + 7) };
    i += 2 + laenge;
  }
  return null;
}

module.exports = {
  ROOT, GAMES_DIR, GAMES_JS, ERGEBNIS_DIR, ID_MUSTER,
  ladeSpiele, spielPfad, bildPfad, starteServer, ladePlaywright, jpegGroesse,
};
