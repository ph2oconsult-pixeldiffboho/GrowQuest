// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Premium voice client (v6.7.5, Stage 2)
//
// The browser no longer talks to ElevenLabs directly. All TTS calls go
// through /api/tts on the GrowQuest server, which holds the API key.
//
// localStorage stores ONLY the parent's preferences:
//   - enabled (boolean): whether to use premium voice at all
//   - voiceId (string):  which voice to use
//   - voiceName (string): display name for the UI
//
// No API keys, no acknowledgement gates, no per-family billing exposure.
// ═══════════════════════════════════════════════════════════════════

const CONFIG_KEY = "gq_premium_voice";

// Default is ON. Parents can flip off in Preferences.
const DEFAULTS = {
  enabled: true,
  voiceId: "",
  voiceName: "",
};

export function loadPremiumVoiceConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function savePremiumVoiceConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      enabled: !!config.enabled,
      voiceId: config.voiceId || "",
      voiceName: config.voiceName || "",
    }));
  } catch (e) {}
}

export function clearPremiumVoiceConfig() {
  try { localStorage.removeItem(CONFIG_KEY); } catch (e) {}
}

export function isPremiumVoiceEnabled() {
  return loadPremiumVoiceConfig().enabled;
}

// ── API calls ──────────────────────────────────────────────────────

/**
 * Fetch the list of available voices from the GrowQuest server. The server
 * proxies to ElevenLabs and caches the result. Returns [] on any failure.
 */
export async function fetchPremiumVoices() {
  try {
    const resp = await fetch("/api/tts-voices");
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.voices || [];
  } catch (e) {
    return [];
  }
}

/**
 * Synthesize text → audio Blob URL via the server proxy.
 * Returns null on any failure — caller falls back to Web Speech.
 */
export async function synthesizePremiumSpeech(text, { voiceId, model } = {}) {
  if (!text) return null;
  try {
    const resp = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId: voiceId || undefined, model }),
    });
    if (!resp.ok) {
      console.warn(`TTS proxy ${resp.status}; falling back to Web Speech.`);
      return null;
    }
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn("TTS proxy error:", e.message);
    return null;
  }
}

/**
 * Tiny health check — used by PremiumVoicePanel on mount to know whether
 * to show "Premium voice is configured on the server" vs a setup message.
 */
export async function checkPremiumVoiceAvailable() {
  try {
    const resp = await fetch("/api/tts-voices");
    return resp.ok;
  } catch (e) {
    return false;
  }
}
