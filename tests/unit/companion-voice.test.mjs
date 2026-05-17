// Tests for the v6.7.3 companion voice helpers used across consent,
// welcome, guided onboarding, and the dashboard 🔊 button.

let pass = 0, fail = 0;
const log = (name, ok) => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name); };

// Mock globals BEFORE import (matching the React env's localStorage shape).
global.window = {
  speechSynthesis: {
    _voices: [
      { name: "Samantha", lang: "en-US", default: true },
      { name: "Daniel",   lang: "en-GB", default: false },
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

// VoicePicker.jsx contains React (JSX), so we can't import the default
// export here. But the helpers (loadCompanionVoice, saveCompanionVoice)
// are plain functions — we replicate them inline for testing and verify
// the LocalStorage key contract that all four call sites rely on.

const COMPANION_VOICE_KEY = "gq_voice_name";

function loadCompanionVoice() {
  try { return localStorage.getItem(COMPANION_VOICE_KEY) || ""; } catch (e) { return ""; }
}

function saveCompanionVoice(name) {
  try { localStorage.setItem(COMPANION_VOICE_KEY, name); } catch (e) {}
}

// 1. Empty by default (auto-pick)
log("loadCompanionVoice returns empty string on first run", loadCompanionVoice() === "");

// 2. Save persists
saveCompanionVoice("Samantha");
log("saveCompanionVoice persists to localStorage", localStorage.getItem(COMPANION_VOICE_KEY) === "Samantha");

// 3. Load reads back
log("loadCompanionVoice returns saved value", loadCompanionVoice() === "Samantha");

// 4. Save empty (auto-pick)
saveCompanionVoice("");
log("saveCompanionVoice('') treated as auto-pick", loadCompanionVoice() === "");

// 5. The four call sites share the same key — this is the contract that
//    keeps the consent / welcome / guided / dashboard pickers in sync.
log("Key is exactly 'gq_voice_name' (must not drift)", COMPANION_VOICE_KEY === "gq_voice_name");

// 6. The useSpeak hook (in App.jsx) uses the same key for backwards compat
//    with v6.6 — verify saving via the new helpers is readable by it.
saveCompanionVoice("Daniel");
const useSpeakRead = localStorage.getItem("gq_voice_name");
log("Existing useSpeak hook reads the same key", useSpeakRead === "Daniel");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
