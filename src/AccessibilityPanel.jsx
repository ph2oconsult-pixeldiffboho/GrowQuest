// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Accessibility Settings
// 
// Features:
// 1. Text size control (small/medium/large/extra-large)
// 2. High contrast mode
// 3. Reduced motion (disables animations)
// 4. Sensory-friendly mode (muted colours, no particles, simpler UI)
// 5. Audio narration toggle (reads all screen text aloud)
// 6. Dyslexia-friendly font option
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import {
  DEFAULTS,
  loadAccessibility,
  saveAccessibility,
  getAvailableVoices,
  pickVoice,
} from "./accessibility-utils.js";
import { loadPremiumVoiceConfig, synthesizePremiumSpeech } from "./elevenlabs.js";

// Re-export so existing callers ({ loadAccessibility, ... } from "./AccessibilityPanel.jsx")
// continue to work without touching them.
export { loadAccessibility, saveAccessibility, getAvailableVoices, pickVoice };

// v6.7.10: shared utility used by both useNarration and useAutoNarrate so
// the screen-reader narration goes through the premium voice when it's
// enabled, instead of always falling to Web Speech. Without this, when a
// parent turns on "Read Aloud" the dashboard speaks in robotic system
// voice while the companion speaks in ElevenLabs — two voices on top of
// each other.
export async function speakWithPremiumFallback(text, { rate = 0.9, pitch = 1.1 } = {}) {
  if (!text) return;
  // Cancel any in-flight Web Speech so we never end up with two voices
  // overlapping (the bug we're fixing).
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  const clean = text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[⭐✦✨⚡]/gu, "").replace(/\s{2,}/g, " ").trim();
  if (!clean) return;

  const cfg = loadPremiumVoiceConfig();
  if (cfg && cfg.enabled) {
    try {
      const url = await synthesizePremiumSpeech(clean, { voiceId: cfg.voiceId });
      if (url) {
        // Cancel Web Speech one more time, in case anything has fired
        // during our await.
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        const audio = new Audio(url);
        try {
          const clamped = Math.min(2.0, Math.max(0.5, rate / 0.9));
          audio.playbackRate = clamped;
        } catch (_e) {}
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => URL.revokeObjectURL(url);
        await audio.play().catch(() => URL.revokeObjectURL(url));
        return audio; // caller can stop it later if needed
      }
      // synthesize returned null → fall through to Web Speech.
    } catch (e) {
      console.warn("Premium narration failed, falling back to Web Speech:", e);
    }
  }

  // Web Speech fallback (also runs when premium is disabled).
  if (!window.speechSynthesis) return;
  const a11y = loadAccessibility();
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = rate;
  u.pitch = pitch;
  u.volume = 1;
  const v = pickVoice(a11y.voiceName);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

const TEXT_SIZES = {
  small:  { base: 12, scale: 0.85, label: "A", desc: "Smaller" },
  medium: { base: 14, scale: 1.0,  label: "A", desc: "Default" },
  large:  { base: 16, scale: 1.15, label: "A", desc: "Larger" },
  xlarge: { base: 19, scale: 1.35, label: "A", desc: "Extra Large" },
};

// ── Apply Accessibility to DOM ─────────────────────────────────────
// This function applies global CSS variables and classes based on settings

export function applyAccessibility(settings) {
  const root = document.documentElement;
  const s = settings || DEFAULTS;

  // Text size
  const ts = TEXT_SIZES[s.textSize] || TEXT_SIZES.medium;
  root.style.setProperty("--gq-text-scale", ts.scale);
  root.style.setProperty("--gq-text-base", ts.base + "px");

  // Reduced motion
  if (s.reducedMotion) {
    root.classList.add("gq-reduced-motion");
  } else {
    root.classList.remove("gq-reduced-motion");
  }

  // High contrast
  if (s.highContrast) {
    root.classList.add("gq-high-contrast");
  } else {
    root.classList.remove("gq-high-contrast");
  }

  // Sensory friendly
  if (s.sensoryFriendly) {
    root.classList.add("gq-sensory-friendly");
  } else {
    root.classList.remove("gq-sensory-friendly");
  }

  // Dyslexia font
  if (s.dyslexiaFont) {
    root.classList.add("gq-dyslexia-font");
  } else {
    root.classList.remove("gq-dyslexia-font");
  }

  // Full audio mode
  if (s.fullAudioMode) {
    root.classList.add("gq-full-audio");
  } else {
    root.classList.remove("gq-full-audio");
  }
}

// ── Audio Narration Hook ───────────────────────────────────────────

export function useNarration(enabled) {
  const audioRef = useRef(null); // most-recent premium <audio> so we can stop it
  const speak = async (text) => {
    if (!enabled || !text) return;
    // Stop any prior premium audio.
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.src = ""; } catch (e) {}
      audioRef.current = null;
    }
    const a11y = loadAccessibility();
    const audio = await speakWithPremiumFallback(text, {
      rate: a11y.speechRate || 0.9,
      pitch: a11y.speechPitch || 1.1,
    });
    if (audio) audioRef.current = audio;
  };

  const stop = () => {
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.src = ""; } catch (e) {}
      audioRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  return { speak, stop };
}

// ── Accessibility Settings Panel ───────────────────────────────────

// ── Auto-Narrate Hook ──────────────────────────────────────────────
// Call this in any screen component to auto-speak text when it mounts

export function useAutoNarrate(text, enabled, memoryKey) {
  // memoryKey: optional string. If provided, the narration only plays once
  // per calendar day per device for that key. Useful for "welcome back"
  // greetings that should feel like a morning hello, not a constant prompt.
  const spokenRef = useRef(false);
  const audioRef = useRef(null);
  useEffect(() => {
    if (!enabled || !text || spokenRef.current) return;

    // If a memoryKey was provided, check whether we've already spoken
    // this key today.
    if (memoryKey) {
      try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local-ish
        const last = localStorage.getItem(`gq_narrate_last:${memoryKey}`);
        if (last === today) { spokenRef.current = true; return; }
        localStorage.setItem(`gq_narrate_last:${memoryKey}`, today);
      } catch (e) { /* localStorage blocked — just narrate */ }
    }

    spokenRef.current = true;
    // Small delay to let the screen render first
    const timer = setTimeout(async () => {
      // v6.7.10: use premium voice if enabled (was: Web Speech only).
      const a11y = loadAccessibility();
      const audio = await speakWithPremiumFallback(text, {
        rate: a11y.speechRate || 0.85,
        pitch: a11y.speechPitch || 1.1,
      });
      if (audio) audioRef.current = audio;
    }, 500);
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current.src = ""; } catch (e) {}
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, [text, enabled, memoryKey]);
}

export default function AccessibilityPanel({ settings, onChange, onClose }) {
  const s = settings || DEFAULTS;

  const update = (key, value) => {
    const newSettings = { ...s, [key]: value };
    onChange(newSettings);
    saveAccessibility(newSettings);
    applyAccessibility(newSettings);
  };

  const ToggleRow = ({ label, desc, icon, value, onToggle }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: "1px solid #F1F5F9",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{label}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{desc}</div>
        </div>
      </div>
      <button onClick={onToggle} style={{
        width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
        background: value ? "#3B82F6" : "#E2E8F0", position: "relative", transition: "background .2s",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 11, background: "#fff", position: "absolute",
          top: 3, left: value ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
        }} />
      </button>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 24px 32px",
        maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,.15)",
      }}>
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E2E8F0" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 22, color: "#1E293B", margin: 0 }}>
            Accessibility
          </h2>
          <button onClick={onClose} style={{
            background: "#F1F5F9", border: "none", borderRadius: 100, width: 32, height: 32,
            fontSize: 16, cursor: "pointer", color: "#64748B",
          }}>✕</button>
        </div>

        <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>
          Adjust these settings to make GrowQuest work best for you
        </p>

        {/* Full Audio Mode — Featured */}
        <div style={{
          padding: "16px", marginBottom: 12, borderRadius: 16,
          background: s.fullAudioMode ? "linear-gradient(135deg,#EFF6FF,#DBEAFE)" : "#F8FAFC",
          border: s.fullAudioMode ? "2px solid #3B82F6" : "2px solid #E2E8F0",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <span style={{ fontSize: 28 }}>🎧</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>Full Audio Mode</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  Everything is spoken aloud. No reading needed. Voice responses only. Large buttons.
                </div>
              </div>
            </div>
            <button onClick={() => {
              const newFull = !s.fullAudioMode;
              const updates = { fullAudioMode: newFull };
              if (newFull) {
                updates.audioNarration = true;
                updates.textSize = "xlarge";
              }
              update("fullAudioMode", newFull);
              if (newFull) {
                onChange({ ...s, ...updates });
                saveAccessibility({ ...s, ...updates });
                applyAccessibility({ ...s, ...updates });
              }
            }} style={{
              width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
              background: s.fullAudioMode ? "#3B82F6" : "#E2E8F0", position: "relative", transition: "background .2s",
              flexShrink: 0,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, background: "#fff", position: "absolute",
                top: 3, left: s.fullAudioMode ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
              }} />
            </button>
          </div>
          {s.fullAudioMode && <p style={{ fontSize: 10, color: "#3B82F6", marginTop: 8, fontWeight: 600 }}>
            Active: Text size set to extra-large, all screens narrated, voice input enabled
          </p>}
        </div>

        {/* Text Size */}
        <div style={{ padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>🔤</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Text Size</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Make text bigger or smaller</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(TEXT_SIZES).map(([key, ts]) => (
              <button key={key} onClick={() => update("textSize", key)} style={{
                flex: 1, padding: "10px 4px", borderRadius: 10, border: "none", cursor: "pointer",
                background: s.textSize === key ? "#3B82F6" : "#F1F5F9",
                color: s.textSize === key ? "#fff" : "#64748B",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}>
                <span style={{ fontSize: ts.base, fontWeight: 700 }}>{ts.label}</span>
                <span style={{ fontSize: 9 }}>{ts.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <ToggleRow
          icon="🔲"
          label="High Contrast"
          desc="Stronger borders and bolder text colours"
          value={s.highContrast}
          onToggle={() => update("highContrast", !s.highContrast)}
        />

        <ToggleRow
          icon="🎯"
          label="Reduced Motion"
          desc="Stops animations, particles, and floating effects"
          value={s.reducedMotion}
          onToggle={() => update("reducedMotion", !s.reducedMotion)}
        />

        <ToggleRow
          icon="🌿"
          label="Sensory-Friendly"
          desc="Muted colours, simpler visuals, calmer experience"
          value={s.sensoryFriendly}
          onToggle={() => update("sensoryFriendly", !s.sensoryFriendly)}
        />

        <ToggleRow
          icon="🔊"
          label="Read Aloud"
          desc="Speaks quest instructions and screen text"
          value={s.audioNarration}
          onToggle={() => update("audioNarration", !s.audioNarration)}
        />

        {/* v6.7.7: speech-rate slider lives here so it's reachable without
            the parent PIN. Applies to BOTH the screen-reader narration and
            the companion's spoken dialogue. */}
        <div style={{ padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>⏱️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Speech Speed</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Slow the voice down if it's too fast to follow</div>
            </div>
            <span style={{ fontSize: 12, color: "#64748B", fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>
              {(s.speechRate || 0.85).toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={s.speechRate || 0.85}
            onChange={e => update("speechRate", parseFloat(e.target.value))}
            aria-label="Speech speed"
            style={{ width: "100%", marginTop: 4 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
            <span>Slower</span>
            <span>Default</span>
            <span>Faster</span>
          </div>
        </div>

        <ToggleRow
          icon="📖"
          label="Dyslexia-Friendly Font"
          desc="Uses a clearer, more readable typeface"
          value={s.dyslexiaFont}
          onToggle={() => update("dyslexiaFont", !s.dyslexiaFont)}
        />

        {/* Reset */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => {
            onChange({ ...DEFAULTS });
            saveAccessibility(DEFAULTS);
            applyAccessibility(DEFAULTS);
          }} style={{
            fontSize: 12, color: "#94A3B8", background: "none", border: "none", cursor: "pointer",
          }}>Reset to defaults</button>
        </div>
      </div>
    </div>
  );
}
