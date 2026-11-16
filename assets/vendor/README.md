# Gemeinsam genutzte Bibliotheken

Hier liegen Bibliotheken, die mehrere Spiele benutzen. Im Moment ist der Ordner leer.

Regeln:

- Die Version steht im Dateinamen, z. B. `three-0.128.0.min.js`. Eine neue Version bekommt eine
  neue Datei; alte Dateien bleiben liegen, solange ein Spiel sie braucht.
- Zu jeder Bibliothek gehört die Lizenzdatei, z. B. `three-0.128.0.LICENSE.txt`.
- Spiele binden die Datei relativ ein: `<script src="../../assets/vendor/three-0.128.0.min.js"></script>`.
- Nichts wird von fremden Servern geladen. Die Datei muss hier im Repository liegen.

Eine Bibliothek, die nur ein einziges Spiel braucht, darf auch direkt im Spiel stecken
(so wie three.js im Spiel `wochentage-einhorn`).
