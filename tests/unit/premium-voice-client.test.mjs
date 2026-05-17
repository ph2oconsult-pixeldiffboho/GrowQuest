// Tests for the v6.7.5 server-proxied premium-voice client.
// We verify config persistence (the only state held client-side) and
// the fallback behaviour of synthesizePremiumSpeech when /api/tts is
// unavailable or returns an error.

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// Mock globals BEFORE import.
global.localStorage = {
  _data: new Map(),
  getItem(k) { return this._data.has(k) ? this._data.get(k) : null; },
  setItem(k, v) { this._data.set(k, v); },
  removeItem(k) { this._data.delete(k); },
};
let mockFetchResponse = null;
let mockFetchCalls = [];
global.fetch = async (url, opts) => {
  mockFetchCalls.push({ url, opts });
  if (typeof mockFetchResponse === "function") return mockFetchResponse(url, opts);
  return mockFetchResponse || { ok: false, status: 500 };
};
global.URL = { createObjectURL: () => "blob:fake-url", revokeObjectURL: () => {} };

const {
  loadPremiumVoiceConfig,
  savePremiumVoiceConfig,
  clearPremiumVoiceConfig,
  isPremiumVoiceEnabled,
  fetchPremiumVoices,
  synthesizePremiumSpeech,
  checkPremiumVoiceAvailable,
} = await import("../../src/elevenlabs.js");

// ── Config defaults (premium voice ON by default) ───────────────────

const fresh = loadPremiumVoiceConfig();
log("default config has enabled=true", fresh.enabled === true);
log("default config has empty voiceId", fresh.voiceId === "");
log("default config has empty voiceName", fresh.voiceName === "");
log("isPremiumVoiceEnabled() returns true on first run", isPremiumVoiceEnabled() === true);

// ── Persistence ─────────────────────────────────────────────────────

savePremiumVoiceConfig({ enabled: true, voiceId: "v-rachel", voiceName: "Rachel" });
const saved = loadPremiumVoiceConfig();
log("saves voiceId", saved.voiceId === "v-rachel");
log("saves voiceName", saved.voiceName === "Rachel");
log("saves enabled", saved.enabled === true);

savePremiumVoiceConfig({ enabled: false, voiceId: "v-rachel", voiceName: "Rachel" });
log("isPremiumVoiceEnabled() returns false after disabling", isPremiumVoiceEnabled() === false);

clearPremiumVoiceConfig();
const cleared = loadPremiumVoiceConfig();
log("after clear: defaults restored", cleared.enabled === true && cleared.voiceId === "");

// ── synthesizePremiumSpeech ─────────────────────────────────────────

// Empty text → null
log("returns null for empty text", (await synthesizePremiumSpeech("")) === null);

// Network error → null
mockFetchResponse = async () => { throw new Error("offline"); };
log("returns null on network error", (await synthesizePremiumSpeech("hi")) === null);

// 503 (server not configured) → null
mockFetchResponse = { ok: false, status: 503 };
log("returns null on 503 (TTS not configured)", (await synthesizePremiumSpeech("hi")) === null);

// 429 rate limit → null
mockFetchResponse = { ok: false, status: 429 };
log("returns null on 429 (rate limited)", (await synthesizePremiumSpeech("hi")) === null);

// 502 upstream failure → null
mockFetchResponse = { ok: false, status: 502 };
log("returns null on 502 (upstream)", (await synthesizePremiumSpeech("hi")) === null);

// Success → returns blob URL
mockFetchResponse = { ok: true, blob: async () => ({}) };
const url = await synthesizePremiumSpeech("hi");
log("returns blob URL on success", url === "blob:fake-url");

// Sends POST to /api/tts with text in JSON body
mockFetchCalls = [];
mockFetchResponse = { ok: true, blob: async () => ({}) };
await synthesizePremiumSpeech("Hello child", { voiceId: "v1" });
const c = mockFetchCalls[mockFetchCalls.length - 1];
log("calls /api/tts (not ElevenLabs directly)", c.url === "/api/tts");
log("uses POST method", c.opts.method === "POST");
log("sends text in JSON body", JSON.parse(c.opts.body).text === "Hello child");
log("sends voiceId in body", JSON.parse(c.opts.body).voiceId === "v1");
log("no API key in headers or body", !JSON.stringify(c.opts).includes("xi-api-key"));

// ── fetchPremiumVoices ──────────────────────────────────────────────

mockFetchResponse = { ok: true, json: async () => ({ voices: [{ voice_id: "v1", name: "Bella" }] }) };
const voices = await fetchPremiumVoices();
log("fetchPremiumVoices returns voice array", Array.isArray(voices) && voices[0].name === "Bella");

mockFetchResponse = { ok: false, status: 503 };
const noVoices = await fetchPremiumVoices();
log("fetchPremiumVoices returns [] on 503", Array.isArray(noVoices) && noVoices.length === 0);

mockFetchResponse = async () => { throw new Error("dead"); };
const errVoices = await fetchPremiumVoices();
log("fetchPremiumVoices returns [] on network error", Array.isArray(errVoices) && errVoices.length === 0);

// ── checkPremiumVoiceAvailable ─────────────────────────────────────

mockFetchResponse = { ok: true, json: async () => ({ voices: [] }) };
log("checkPremiumVoiceAvailable true on 200", (await checkPremiumVoiceAvailable()) === true);

mockFetchResponse = { ok: false, status: 503 };
log("checkPremiumVoiceAvailable false on 503", (await checkPremiumVoiceAvailable()) === false);

mockFetchResponse = async () => { throw new Error("x"); };
log("checkPremiumVoiceAvailable false on network error", (await checkPremiumVoiceAvailable()) === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
