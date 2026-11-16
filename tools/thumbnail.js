#!/usr/bin/env node
// Macht das Vorschaubild für ein Spiel (thumbnail.jpg, 900×600):
//   node tools/thumbnail.js <ordner> [--klick "<css>"] [--verstecken "<css>"] [--warten <ms>]
//
//   --klick "<css>"        klickt vor dem Foto auf dieses Element (mehrfach möglich, z. B. den Start-Knopf)
//   --verstecken "<css>"   blendet Elemente für das Foto aus (mehrfach möglich)
//   --warten <ms>          wartet vor dem Foto so viele Millisekunden (Standard: 800)
'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, ID_MUSTER, ladeSpiele, spielPfad, bildPfad, starteServer, ladePlaywright } = require('./lib');

function hilfe(meldung) {
  if (meldung) console.error(meldung + '\n');
  console.error('Aufruf: node tools/thumbnail.js <ordner> [--klick "<css>"] [--verstecken "<css>"] [--warten <ms>]');
  process.exit(1);
}

const args = process.argv.slice(2);
let ordner = null;
let warten = 800;
const klicks = [];
const verstecken = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--klick' || a === '--verstecken' || a === '--warten') {
    const wert = args[++i];
    if (wert === undefined) hilfe('Nach ' + a + ' fehlt ein Wert.');
    if (a === '--klick') klicks.push(wert);
    else if (a === '--verstecken') verstecken.push(wert);
    else {
      warten = Number(wert);
      if (!Number.isFinite(warten) || warten < 0) hilfe('--warten braucht eine Zahl in Millisekunden.');
    }
  } else if (a.startsWith('--')) hilfe('Unbekannte Option: ' + a);
  else if (ordner === null) ordner = a;
  else hilfe('Zu viele Angaben: ' + a);
}
if (!ordner) hilfe();
if (!ID_MUSTER.test(ordner)) hilfe('Der Ordnername "' + ordner + '" geht nicht.');

// Pfade aus games.js übernehmen, falls dort etwas Abweichendes steht.
let spiel = { id: ordner };
try {
  const eintrag = (ladeSpiele() || []).find((s) => s && s.id === ordner);
  if (eintrag) spiel = eintrag;
} catch (e) { /* games.js kaputt: Standardpfade benutzen */ }

const seite = spielPfad(spiel);
const zielRel = bildPfad(spiel);
const ziel = path.join(ROOT, zielRel);
const seiteDatei = path.join(ROOT, seite.endsWith('/') ? seite + 'index.html' : seite);
if (!fs.existsSync(seiteDatei)) hilfe('Das Spiel gibt es nicht: ' + path.relative(ROOT, seiteDatei));

(async () => {
  const { chromium } = ladePlaywright();
  const server = await starteServer();
  const browser = await chromium.launch();
  let fehler = null;
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 1 });
    await page.goto(server.url + seite, { waitUntil: 'load' });
    for (const css of klicks) {
      // force: auch Knöpfe treffen, die sich bewegen (z. B. ein pulsierender Start-Knopf)
      await page.locator(css).first().click({ timeout: 5000, force: true });
      await page.waitForTimeout(300);
    }
    if (verstecken.length) {
      await page.addStyleTag({ content: verstecken.join(', ') + ' { visibility: hidden !important; }' });
    }
    await page.waitForTimeout(warten);
    await page.screenshot({ path: ziel, type: 'jpeg', quality: 82 });
  } catch (e) {
    fehler = e;
  }
  await browser.close();
  await server.stop();
  if (fehler) {
    console.error('Das Vorschaubild konnte nicht gemacht werden:\n' + fehler.message);
    process.exit(1);
  }
  const kb = Math.round(fs.statSync(ziel).size / 1024);
  console.log('✔ ' + zielRel + ' gespeichert (900×600, ' + kb + ' KB)');
  if (kb > 250) console.log('⚠ Das Bild ist größer als 250 KB. Vielleicht ein ruhigeres Motiv wählen.');
})();
