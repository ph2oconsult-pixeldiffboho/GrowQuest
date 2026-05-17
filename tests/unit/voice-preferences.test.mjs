// Tests for the v6.7.2 voice preference system.
// Imports the real exported helpers from src/accessibility-utils.js.

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// Mock browser globals BEFORE importing.
global.window = {
  speechSynthesis: {
    _voices: [
      { name: "Samantha",                lang: "en-US", default: true  },
      { name: "Karen",                   lang: "en-AU", default: false },
      { name: "Daniel",                  lang: "en-GB", default: false },
      { name: "Google UK English Female",lang: "en-GB", default: false },
      { name: "Thomas",                  lang: "fr-FR", default: false },
      { name: "Yuki",                    lang: "ja-JP", default: false },
    ],
    getVoices() { return this._voices; },
  },
};
global.localStorage = {
  _data: new Map(),
  getItem(k) { return this._data.has(k) ? this._data.get(k) : null; },
  setItem(k, v) { this._data.set(k, v); },
  removeItem(k) { this._data.delete(k); },
};

const { getAvailableVoices, loadAccessibility, saveAccessibility, pickVoice, DEFAULTS } =
  await import("../../src/accessibility-utils.js");

// 1. getAvailableVoices returns only English voices
const voices = getAvailableVoices();
log("returns only English voices", voices.every(v => v.lang.startsWith("en")));
log("excludes French voice (Thomas)", !voices.some(v => v.name === "Thomas"));
log("excludes Japanese voice (Yuki)", !voices.some(v => v.name === "Yuki"));
log("includes 4 English voices", voices.length === 4);

// 2. Sorted alphabetically by name
const names = voices.map(v => v.name);
const sorted = [...names].sort();
log("voices sorted alphabetically", JSON.stringify(names) === JSON.stringify(sorted));

// 3. Each voice has expected fields
log("each voice has name", voices.every(v => typeof v.name === "string"));
log("each voice has lang", voices.every(v => typeof v.lang === "string"));
log("each voice has isDefault flag", voices.every(v => typeof v.isDefault === "boolean"));

// 4. loadAccessibility returns defaults with new fields
const a = loadAccessibility();
log("defaults include voiceName (empty)", a.voiceName === "");
log("defaults include speechRate", typeof a.speechRate === "number");
log("defaults speechRate default is 0.85", a.speechRate === 0.85);
log("defaults speechPitch default is 1.1", a.speechPitch === 1.1);

// 5. saveAccessibility persists the new fields
saveAccessibility({ ...a, voiceName: "Daniel", speechRate: 1.2, speechPitch: 0.9 });
const reloaded = loadAccessibility();
log("voiceName persists", reloaded.voiceName === "Daniel");
log("speechRate persists", reloaded.speechRate === 1.2);
log("speechPitch persists", reloaded.speechPitch === 0.9);

// 6. Loading an older config (no new fields) fills in defaults
localStorage._data.clear();
localStorage.setItem("gq_accessibility", JSON.stringify({ textSize: "large", highContrast: true }));
const legacy = loadAccessibility();
log("legacy config keeps existing keys", legacy.textSize === "large" && legacy.highContrast === true);
log("legacy config gets new voiceName default", legacy.voiceName === "");
log("legacy config gets new speechRate default", legacy.speechRate === 0.85);

// 7. pickVoice returns user-chosen voice when available
const danielPick = pickVoice("Daniel");
log("pickVoice returns saved voice when available", danielPick?.name === "Daniel");

// 8. pickVoice falls back to auto-pick when saved voice is unavailable
const ghostPick = pickVoice("NonexistentVoice12345");
log("pickVoice falls back to auto-pick (Samantha is in preferred list)", ghostPick?.name === "Samantha");

// 9. pickVoice with no preference does auto-pick (Samantha first in preferred list)
const autoPick = pickVoice("");
log("pickVoice with empty preference auto-picks Samantha", autoPick?.name === "Samantha");

// 10. pickVoice respects the preferred fallback chain
// Drop Samantha and Karen, then auto-pick should land on Moira... but only Daniel + Google UK English Female remain
window.speechSynthesis._voices = window.speechSynthesis._voices.filter(v => !["Samantha","Karen"].includes(v.name));
const fallback = pickVoice("");
log("pickVoice falls through preferred list to Google UK English Female", fallback?.name === "Google UK English Female");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
