# 3D-Druck Telegram Snapshot Script v2.1

[![Version](https://img.shields.io/badge/version-2.1-brightgreen)] [![License](https://img.shields.io/badge/license-MIT-blue.svg)] [![ioBroker](https://img.shields.io/badge/ioBroker-compatible-yellow)]

Dieses Projekt ist ein ioBroker-JavaScript, das den Status deines 3D-Druckers überwacht und per Telegram regelmäßig Snapshots deiner Drucker-Webcam mit Fortschrittsbalken, Restzeit und Dateinamen sendet.

---

## Features

- Start-/Ende-Benachrichtigung bei Druckjobs  
- Fortschrittsupdates in konfigurierbaren Schritten (z.B. alle 10 %)  
- Snapshot der Webcam als Foto in Telegram  
- Emoji-Fortschrittsbalken und formatierte Restzeit  
- Robust gegenüber ioBroker-/Adapter-Neustarts (Erkennung laufender Drucke)

---

## Voraussetzungen

- ioBroker mit JavaScript-Adapter  
- Telegram-Adapter eingerichtet (Bot + Chat-ID bekannt)  
- 3D-Drucker integriert (z.B. Snapmaker) mit folgenden Datenpunkten:
  - Druckstatus (`printing`, `complete`, `idle`, `error`)  
  - Fortschritt in Prozent  
  - Dateiname des Jobs  
  - Restzeit (Sekunden oder kompatibel)  
- Webcam-URL, die ein Snapshot-Bild liefert

---

## Installation

1. **Script anlegen**
   - In ioBroker Admin zu „Skripte" wechseln.  
   - Neues Skript im JavaScript-Adapter erstellen.  
   - Den kompletten Script-Code aus diesem Repository einfügen.

2. **Konfiguration anpassen**
   - Oben im Skript die Konstanten anpassen:
     - `TELEGRAM_INSTANCE` (z.B. `"telegram.0"`)  
     - `CHAT_ID` (deine Chat-ID)  
     - `DP_STATE`, `DP_PROGRESS`, `DP_FILENAME`, `DP_REMAIN` auf deine Datenpunkte  
     - `SNAPSHOT_URL` auf deine Webcam-Snapshot-URL  
     - Optional: `STEP_SIZE` (z.B. 5 oder 10)

3. **Speichern und aktivieren**
   - Skript speichern.  
   - Sicherstellen, dass das Skript aktiviert ist.

---

## Kurzes Tutorial

### 1. Telegram-Chat-ID ermitteln

1. Telegram-Bot im Adapter anlegen und verbinden.  
2. Eine Nachricht an deinen Bot senden.  
3. Im ioBroker-Log oder in den Objekten des Telegram-Adapters nachsehen, welche Chat-ID verwendet wurde.  
4. Diese ID in `CHAT_ID` im Skript eintragen.

### 2. Datenpunkte des Druckers finden

1. Im ioBroker-Admin unter „Objekte" nach deinem Drucker-Adapter suchen (z.B. `Snapmaker_U1`).  
2. Die relevanten Datenpunkte identifizieren:
   - Status (String, z.B. „printing")  
   - Fortschritt (Zahl in Prozent)  
   - Dateiname (String)  
   - Restzeit (Sekunden)  
3. Die vollständigen Pfade in die Konstanten `DP_STATE`, `DP_PROGRESS`, `DP_FILENAME`, `DP_REMAIN` im Skript eintragen.

### 3. Webcam-Snapshot testen

1. Die URL aus `SNAPSHOT_URL` im Browser öffnen.  
2. Wenn ein Bild geladen wird, ist alles gut.  
3. Falls nicht, die richtige Snapshot-URL des Druckers/Webcams ermitteln und im Skript eintragen.

### 4. Funktion testen

1. Einen Druckjob starten.  
2. In Telegram solltest du eine Start-Nachricht mit Fortschritt und kurz danach ein Foto erhalten.  
3. Während des Drucks bekommst du alle `STEP_SIZE` Prozent ein neues Bild.  
4. Am Ende des Drucks kommt eine End-Nachricht + abschließender Snapshot.

---

## Konfigurationstipps

- **STEP_SIZE verkleinern** (z.B. 5), um häufiger Bilder zu bekommen.  
- **SNAP_TIMEOUT** erhöhen, wenn deine Webcam regelmäßig länger braucht.  
- Falls du mehrere Drucker hast, kannst du das Skript kopieren und die Datenpunkte/URLs pro Drucker anpassen.

---

## Lizenz

Dieses Projekt steht unter der **MIT License**.

```text
MIT License

Copyright (c) 2026 Christian Wimmer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
