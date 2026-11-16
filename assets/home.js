// Baut die Startseite aus window.GAMES (siehe games.js).
(function () {
  'use strict';

  var alle = Array.isArray(window.GAMES) ? window.GAMES : [];
  var spiele = alle.filter(function (s) { return s && s.id && !s.hidden; });
  var raster = document.getElementById('spiele');
  var filter = document.getElementById('filter');
  var leer = document.getElementById('leer');

  // Kleine Bilder für bekannte Fächer. Unbekannte Fächer bekommen einfach keins.
  var FACH_BILD = {
    'Sachunterricht': '🌱', 'Mathe': '🔢', 'Erdkunde': '🌍', 'Deutsch': '🔤',
    'Englisch': '💬', 'Musik': '🎵', 'Kunst': '🎨', 'Sport': '⚽'
  };

  function el(name, klasse, text) {
    var e = document.createElement(name);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  if (!spiele.length) {
    leer.hidden = false;
    return;
  }

  var kacheln = spiele.map(function (spiel) {
    var a = el('a', 'kachel');
    a.href = spiel.path || 'games/' + spiel.id + '/';
    a.dataset.fach = spiel.subject || '';

    var bildRahmen = el('div', 'kachel-bild');
    var img = document.createElement('img');
    img.alt = '';
    img.width = 900;
    img.height = 600;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', function () { bildRahmen.classList.add('ohne-bild'); });
    img.src = spiel.thumbnail || 'games/' + spiel.id + '/thumbnail.jpg';
    bildRahmen.appendChild(img);
    var los = el('span', 'kachel-los', '▶');
    los.setAttribute('aria-hidden', 'true');
    bildRahmen.appendChild(los);
    a.appendChild(bildRahmen);

    var text = el('div', 'kachel-text');
    text.appendChild(el('h2', '', spiel.title || spiel.id));
    if (spiel.description) text.appendChild(el('p', '', spiel.description));
    var etiketten = el('ul', 'etiketten');
    if (spiel.age) etiketten.appendChild(el('li', 'etikett-alter', spiel.age));
    if (spiel.subject) etiketten.appendChild(el('li', 'etikett-fach', spiel.subject));
    text.appendChild(etiketten);
    a.appendChild(text);

    raster.appendChild(a);
    return a;
  });

  // Filter-Knöpfe nur, wenn es mindestens zwei Fächer gibt.
  var faecher = [];
  spiele.forEach(function (s) {
    if (s.subject && faecher.indexOf(s.subject) < 0) faecher.push(s.subject);
  });
  if (faecher.length < 2) return;

  var knoepfe = [];
  function waehle(fach, aktiv) {
    knoepfe.forEach(function (k) { k.setAttribute('aria-pressed', k === aktiv ? 'true' : 'false'); });
    kacheln.forEach(function (k) { k.hidden = fach !== null && k.dataset.fach !== fach; });
  }
  function knopf(beschriftung, fach) {
    var b = el('button', '', beschriftung);
    b.type = 'button';
    b.setAttribute('aria-pressed', fach === null ? 'true' : 'false');
    b.addEventListener('click', function () { waehle(fach, b); });
    knoepfe.push(b);
    filter.appendChild(b);
  }
  knopf('Alle', null);
  faecher.forEach(function (f) { knopf((FACH_BILD[f] ? FACH_BILD[f] + ' ' : '') + f, f); });
  filter.hidden = false;
})();
