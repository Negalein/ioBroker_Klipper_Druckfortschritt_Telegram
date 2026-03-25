/**
 * ========================================================
 * 3D-Druck Telegram Snapshot Script
 * ========================================================
 * 
 * Überwacht den Status deines 3D-Druckers und sendet per Telegram
 * regelmäßig Snapshots deiner Drucker-Webcam mit Fortschrittsbalken,
 * Restzeit und Dateinamen.
 * 
 * Version:     2.1 (2026-03-25)
 * Autor:       Christian Wimmer
 * ioBroker:    JavaScript-Adapter
 * 
 * LIZENZ: MIT License
 * 
 * Copyright (c) 2026 Christian Wimmer
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * ========================================================
 */

console.log("🖨️ 3D-Druck Telegram Script v2.1 gestartet");

// ==========================
// KONFIGURATION
// ==========================

const TELEGRAM_INSTANCE = "telegram.0";
const CHAT_ID           = DEINE_CHAT_ID;

const DP_STATE     = "0_userdata.0.3DDrucker.Snapmaker_U1.print_stats.state";
const DP_PROGRESS  = "0_userdata.0.3DDrucker.Snapmaker_U1.virtual_sdcard.progress_percent";
const DP_FILENAME  = "0_userdata.0.3DDrucker.Snapmaker_U1.print_stats.filename";
const DP_REMAIN    = "0_userdata.0.3DDrucker.Snapmaker_U1.Restzeit";

const SNAPSHOT_URL = "http://10.0.1.244/webcam/snapshot.jpg";
const DP_LAST_STEP = "0_userdata.0.3DDrucker.Script.lastStep";

const STEP_SIZE    = 10;
const SNAP_TIMEOUT = 5000;
const MAX_STEP     = Math.floor(100 / STEP_SIZE);

// ==========================
// VARIABLEN
// ==========================

let printingActive = false;
let currentFile    = "";

// ==========================
// INIT STATE
// ==========================

createState(DP_LAST_STEP, -1, {
    type:  "number",
    read:  true,
    write: true,
    def:   -1
});

// ==========================
// HELFER
// ==========================

function sendTgText(text) {
    if (!text) return;
    sendTo(TELEGRAM_INSTANCE, "send", {
        text,
        chatId: CHAT_ID
    });
}

function getFileName() {
    const raw = getState(DP_FILENAME)?.val;
    if (!raw || typeof raw !== "string") return "Unbekannt";

    const withoutPath = raw.includes("/") ? raw.split("/").pop() : raw;
    return withoutPath.replace(/\.gcode$/i, "");
}

function formatTime(seconds) {
    const s = Number(seconds);
    if (!Number.isFinite(s) || s <= 0) return "--:--:--";

    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function getBar(p) {
    const progress = Math.min(Math.max(Number(p) || 0, 0), 100);
    const total    = 20;
    const filled   = Math.round((progress / 100) * total);
    let out        = "";

    for (let i = 0; i < total; i++) {
        if (i < filled) {
            if (progress < 30) out += "🟥";
            else if (progress < 70) out += "🟨";
            else out += "🟩";
        } else {
            out += "⬜";
        }
    }
    return out;
}

function buildCaption(progress) {
    const p      = Math.min(Math.max(Number(progress) || 0, 0), 100);
    const remain = getState(DP_REMAIN)?.val;

    return (
`📸 ${p}%
${getBar(p)}
⏱️ ${formatTime(remain)}
📄 ${currentFile || "Unbekannt"}`
    );
}

// ==========================
// SNAPSHOT
// ==========================

function sendSnapshot(progress) {
    const caption = buildCaption(progress);

    httpGet(
        SNAPSHOT_URL,
        { responseType: "arraybuffer", timeout: SNAP_TIMEOUT },
        (err, res) => {
            const hasImage = !err && res && res.data && res.data.byteLength > 1000;

            if (!hasImage) {
                sendTgText(caption + "\n⚠️ Kein Bild");
                return;
            }

            const buffer = Buffer.from(new Uint8Array(res.data));

            writeFile("0_userdata.0", "snapshot_3d.jpg", buffer, () => {
                readFile("0_userdata.0", "snapshot_3d.jpg", (error, data) => {
                    if (error || !data) {
                        sendTgText(caption + "\n⚠️ Lesefehler");
                        return;
                    }

                    sendTo(TELEGRAM_INSTANCE, "send", {
                        text:   data,
                        type:   "photo",
                        caption,
                        chatId: CHAT_ID
                    });
                });
            });
        }
    );
}

// ==========================
// START / STOP
// ==========================

on({ id: DP_STATE, change: "ne" }, obj => {
    const state = obj?.state?.val;

    if (state === "printing") {
        printingActive = true;
        currentFile    = getFileName();

        const p    = Math.floor(Number(getState(DP_PROGRESS)?.val) || 0);
        const step = Math.floor(p / STEP_SIZE);

        setState(DP_LAST_STEP, step, true);

        sendTgText(`🖨️ Start\n📄 ${currentFile}\n📊 ${p}%`);

        setTimeout(() => sendSnapshot(p), 1500);
        return;
    }

    const isEndState = state === "complete" || state === "idle" || state === "error";

    if (isEndState && printingActive) {
        printingActive = false;

        sendTgText(`🏁 Ende\n📄 ${currentFile}\nStatus: ${state}`);

        setTimeout(() => sendSnapshot(100), 2000);

        setState(DP_LAST_STEP, -1, true);
    }
});

// ==========================
// FORTSCHRITT
// ==========================

on({ id: DP_PROGRESS, change: "ne" }, obj => {
    if (!printingActive) return;

    const pRaw = Number(obj?.state?.val) || 0;
    const p    = Math.min(Math.max(Math.floor(pRaw), 0), 100);

    let last = Number(getState(DP_LAST_STEP)?.val);
    if (!Number.isFinite(last)) last = -1;

    while (p >= (last + 1) * STEP_SIZE && last < MAX_STEP) {
        last++;
        setState(DP_LAST_STEP, last, true);
        sendSnapshot(p);
    }
});

// ==========================
// INIT (RESTART)
// ==========================

setTimeout(() => {
    const state = getState(DP_STATE)?.val;

    if (state !== "printing") return;

    printingActive = true;
    currentFile    = getFileName();

    const p    = Math.floor(Number(getState(DP_PROGRESS)?.val) || 0);
    const step = Math.floor(p / STEP_SIZE);

    setState(DP_LAST_STEP, step, true);

    sendTgText(`🔄 Restart erkannt\n📄 ${currentFile}\n📊 ${p}%`);

    setTimeout(() => sendSnapshot(p), 2000);
}, 5000);

console.log("🖨️ 3D-Druck Telegram Script v2.1 bereit");
