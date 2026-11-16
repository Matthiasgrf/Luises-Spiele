#!/usr/bin/env node
// Öffnet Startseite und Spiele in einem echten Browser (Playwright, Chromium):
//   node tools/smoke.js            alles
//   node tools/smoke.js <ordner>   Startseite und nur dieses Spiel
//
// Zwei Größen: Computer (1280×800) und Handy (390×844 mit Touch).
// Als Fehler zählen: JavaScript-Fehler, Fehler in der Konsole, nicht ladbare
// Dateien und jeder Zugriff auf einen fremden Server.
// Screenshots landen in test-ergebnisse/.
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, ERGEBNIS_DIR, ladeSpiele, spielPfad, starteServer, ladePlaywright } = require('./lib');

const GROESSEN = [
  { name: 'computer', optionen: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } },
  { name: 'handy', optionen: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
];

const nurOrdner = process.argv[2];
let fehlerZahl = 0;

function bericht(titel, probleme) {
  if (!probleme.length) { console.log('✔ ' + titel); return; }
  console.log('▸ ' + titel);
  [...new Set(probleme)].forEach((p) => { fehlerZahl++; console.log('    ✖ ' + p); });
}

/** Öffnet eine Seite, sammelt Probleme, ruft pruefung(page, probleme) auf und macht ein Foto. */
async function besuche(browser, server, groesse, adresse, bildName, pruefung) {
  const probleme = [];
  const context = await browser.newContext({ ...groesse.optionen, locale: 'de-DE' });
  const page = await context.newPage();
  const kurz = (u) => (u.startsWith(server.url) ? u.slice(server.url.length - 1) : u);

  // Fremde Server: melden und blockieren.
  await context.route((url) => !/^(data|blob|about):/.test(url.protocol) && url.origin + '/' !== server.url, (route) => {
    probleme.push('Zugriff auf einen fremden Server: ' + route.request().url().slice(0, 120));
    return route.abort();
  });
  page.on('pageerror', (e) => probleme.push('JavaScript-Fehler: ' + String(e.message || e).split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Nicht geladene Dateien melden wir unten genauer (mit Adresse).
    if (/Failed to load resource/.test(text)) return;
    probleme.push('Fehler in der Konsole: ' + text.split('\n')[0].slice(0, 200));
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(server.url)) probleme.push('Datei nicht gefunden (' + r.status() + '): ' + kurz(r.url()));
  });
  page.on('requestfailed', (r) => {
    if (r.url().startsWith(server.url)) probleme.push('Datei konnte nicht geladen werden: ' + kurz(r.url()));
  });

  try {
    await page.goto(server.url + adresse, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(700);
    if (pruefung) await pruefung(page, probleme);
    const breit = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (breit) probleme.push('Die Seite ist breiter als der Bildschirm (man muss seitlich schieben).');
    await page.screenshot({ path: path.join(ERGEBNIS_DIR, bildName + '-' + groesse.name + '.png') });
  } catch (e) {
    probleme.push('Die Seite ließ sich nicht prüfen: ' + String(e.message || e).split('\n')[0]);
  }
  await context.close();
  return probleme;
}

/** Prüft die Kacheln und die Filter der Startseite. */
function pruefeStartseite(sichtbar) {
  return async (page, probleme) => {
    const kacheln = page.locator('a.kachel');
    const anzahl = await kacheln.count();
    if (anzahl !== sichtbar.length) probleme.push('Startseite zeigt ' + anzahl + ' Kacheln, erwartet sind ' + sichtbar.length + '.');
    if (!sichtbar.length) {
      if (!(await page.locator('#leer').isVisible())) probleme.push('Ohne Spiele fehlt der Hinweistext.');
      return;
    }
    const kategorien = [...new Set(sichtbar.map((s) => s.subject))];
    const knoepfe = page.locator('#filter button');
    const knopfZahl = await knoepfe.count();
    if (kategorien.length < 2) {
      if (knopfZahl) probleme.push('Bei nur einer Kategorie dürfen keine Filter-Knöpfe erscheinen.');
      return;
    }
    if (knopfZahl !== kategorien.length + 1) probleme.push('Erwartet sind ' + (kategorien.length + 1) + ' Filter-Knöpfe, gefunden: ' + knopfZahl + '.');
    for (const kategorie of kategorien) {
      const knopf = page.locator('#filter button', { hasText: kategorie }).first();
      await knopf.click();
      const soll = sichtbar.filter((s) => s.subject === kategorie).length;
      const ist = await page.locator('a.kachel:visible').count();
      if (ist !== soll) probleme.push('Filter „' + kategorie + '“ zeigt ' + ist + ' Kacheln, erwartet sind ' + soll + '.');
      if ((await knopf.getAttribute('aria-pressed')) !== 'true') probleme.push('Filter „' + kategorie + '“ trägt nach dem Klick nicht aria-pressed="true".');
    }
    await knoepfe.first().click();
    if ((await page.locator('a.kachel:visible').count()) !== sichtbar.length) probleme.push('Filter „Alle“ zeigt nicht alle Kacheln.');
  };
}

/** Prüft, dass im Spiel ein Link zur Übersicht zu sehen ist. */
async function pruefeSpiel(page, probleme) {
  const links = page.locator('a', { hasText: 'Alle Spiele' });
  const anzahl = await links.count();
  let sichtbar = false;
  for (let i = 0; i < anzahl; i++) if (await links.nth(i).isVisible()) sichtbar = true;
  if (!sichtbar) probleme.push('Auf dem Start-Bildschirm ist kein Link „🏠 Alle Spiele“ zu sehen.');
}

(async () => {
  let spiele;
  try {
    spiele = ladeSpiele();
    if (!Array.isArray(spiele)) throw new Error('window.GAMES ist keine Liste.');
  } catch (e) {
    console.error('games.js lässt sich nicht lesen: ' + e.message + '\nBitte zuerst node tools/check.js ausführen.');
    process.exit(1);
  }
  let zuPruefen = spiele;
  if (nurOrdner) {
    zuPruefen = spiele.filter((s) => s.id === nurOrdner);
    if (!zuPruefen.length) {
      console.error('Das Spiel „' + nurOrdner + '“ steht nicht in games.js.');
      process.exit(1);
    }
  }
  const sichtbar = spiele.filter((s) => !s.hidden);

  const { chromium } = ladePlaywright();
  fs.rmSync(ERGEBNIS_DIR, { recursive: true, force: true });
  fs.mkdirSync(ERGEBNIS_DIR, { recursive: true });
  const server = await starteServer();
  const browser = await chromium.launch();

  try {
    for (const groesse of GROESSEN) {
      console.log('\n' + groesse.name + ' (' + groesse.optionen.viewport.width + '×' + groesse.optionen.viewport.height + ')');
      bericht('Startseite', await besuche(browser, server, groesse, '', 'startseite', pruefeStartseite(sichtbar)));
      for (const spiel of zuPruefen) {
        bericht(spielPfad(spiel), await besuche(browser, server, groesse, spielPfad(spiel), 'spiel-' + spiel.id, pruefeSpiel));
      }
      bericht('404-Seite', await besuche(browser, server, groesse, 'games/gibt-es-nicht/', 'seite-404', async (page, probleme) => {
        // Die Antwort 404 ist hier gewollt und kein Problem.
        for (let i = probleme.length - 1; i >= 0; i--) if (/^Datei nicht gefunden \(404\): \/games\/gibt-es-nicht\/$/.test(probleme[i])) probleme.splice(i, 1);
        const link = page.locator('a#heim');
        if (!(await link.count())) { probleme.push('Auf der 404-Seite fehlt der Link zur Startseite.'); return; }
        const ziel = new URL(await link.getAttribute('href'), page.url()).href;
        if (ziel !== server.url) probleme.push('Der Link auf der 404-Seite führt nicht zur Startseite, sondern zu ' + ziel);
      }));
    }
  } finally {
    await browser.close();
    await server.stop();
  }

  console.log('\nScreenshots: ' + path.relative(ROOT, ERGEBNIS_DIR) + '/');
  if (fehlerZahl) {
    console.log('✖ ' + fehlerZahl + ' Problem(e) gefunden.');
    process.exit(1);
  }
  console.log('✔ Alles in Ordnung.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
