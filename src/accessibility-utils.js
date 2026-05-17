// Pure (non-React) helpers used by AccessibilityPanel and ParentPreferences.
// Kept in a .js file (not .jsx) so unit tests can import them directly under
// Node without a JSX loader. Anything that touches the DOM via CSS variables
// stays in the .jsx file with the React component.

const STORAGE_KEY = "gq_accessibility";

export const DEFAULTS = {
  textSize: "medium",      // small, medium, large, xlarge
  highContrast: false,
  reducedMotion: false,
  sensoryFriendly: false,
  audioNarration: false,
  dyslexiaFont: false,
  fullAudioMode: false,
  // v6.7.2: narration voice preferences
  voiceName: "",           // empty = auto-pick (legacy behaviour)
  speechRate: 0.85,        // 0.5 - 1.5
  speechPitch: 1.1,        // 0.5 - 2.0
};

export function loadAccessibility() {
  try {
    const saved = (typeof localStorage !== "undefined") ? localStorage.getItem(STORAGE_KEY) : null;
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function saveAccessibility(settings) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (e) {}
}

// ── Voice picking ──────────────────────────────────────────────────
// v6.7.2: pulled out so both hooks share it and a user-chosen voice
// (from the Parent Dashboard preferences) takes priority over auto-pick.

export function getAvailableVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices
    .filter(v => v.lang && v.lang.startsWith("en"))
    .map(v => ({ name: v.name, lang: v.lang, isDefault: v.default, _v: v }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function pickVoice(preferredName) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (preferredName) {
    const exact = voices.find(v => v.name === preferredName);
    if (exact) return exact;
    // Saved voice may be unavailable on a different device; fall through.
  }
  const eng = voices.filter(v => v.lang && v.lang.startsWith("en"));
  const preferred = ["Samantha", "Karen", "Moira", "Google UK English Female"];
  for (const pn of preferred) {
    const v = eng.find(x => x.name.includes(pn));
    if (v) return v;
  }
  return eng.find(v => v.name.toLowerCase().includes("female")) || eng[0] || null;
}
