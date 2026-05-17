// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Parent Preferences
//
// Collapsible card rendered inside the Parent Dashboard. Consolidates:
//   - Narrator voice selection (with preview)
//   - Speech rate slider
//   - Speech pitch slider
//   - Theme (light / dark)
//   - Quick-access to the full Accessibility panel
//
// Child-facing quick toggles (♿ button, ☀️/🌙 button on the dashboard
// header) are deliberately left alone — kids should not need to walk
// through the parent gate to bump up the text size or flip themes.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { applyAccessibility } from "./AccessibilityPanel.jsx";
import { loadAccessibility, saveAccessibility, getAvailableVoices } from "./accessibility-utils.js";
import PremiumVoicePanel from "./PremiumVoicePanel.jsx";

export default function ParentPreferences({ theme, onToggleTheme, onOpenAccessibility }) {
  const [expanded, setExpanded] = useState(false);
  const [a11y, setA11y] = useState(loadAccessibility());
  const [voices, setVoices] = useState([]);
  const [previewing, setPreviewing] = useState(false);

  // Voices load asynchronously in some browsers (Chrome notably).
  // Subscribe to the voiceschanged event so the list populates.
  useEffect(() => {
    const refresh = () => setVoices(getAvailableVoices());
    refresh();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = refresh;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
    }
  }, []);

  const update = (patch) => {
    const next = { ...a11y, ...patch };
    setA11y(next);
    saveAccessibility(next);
    applyAccessibility(next);
  };

  const previewVoice = () => {
    if (!window.speechSynthesis || previewing) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "Hi! This is what your narrator sounds like. You can change the voice, speed, and pitch."
    );
    u.rate = a11y.speechRate || 0.85;
    u.pitch = a11y.speechPitch || 1.1;
    if (a11y.voiceName) {
      const v = window.speechSynthesis.getVoices().find(x => x.name === a11y.voiceName);
      if (v) u.voice = v;
    }
    u.onend = () => setPreviewing(false);
    u.onerror = () => setPreviewing(false);
    setPreviewing(true);
    window.speechSynthesis.speak(u);
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 2px 12px rgba(0,0,0,.04)",
    marginBottom: 14,
  };

  const labelStyle = { fontSize: 12, color: "#475569", fontWeight: 600, marginBottom: 6 };
  const subStyle = { fontSize: 10, color: "#94A3B8", marginBottom: 10 };

  return (
    <div style={cardStyle}>
      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-label="Toggle preferences panel"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
        }}
      >
        <div>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 15, color: "#1E293B", marginBottom: 2 }}>
            Preferences
          </h3>
          <p style={{ fontSize: 11, color: "#94A3B8" }}>
            Narrator voice, theme, accessibility — saved on this device.
          </p>
        </div>
        <span style={{ fontSize: 18, color: "#64748B", transform: expanded ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
      </button>

      {expanded && (
        <div style={{ marginTop: 16 }}>
          {/* Voice selection */}
          <div style={{ marginBottom: 18 }}>
            <div style={labelStyle}>Narrator voice</div>
            <div style={subStyle}>
              {voices.length === 0
                ? "Loading available voices…"
                : `${voices.length} voice${voices.length === 1 ? "" : "s"} available on this device.`}
            </div>
            <select
              value={a11y.voiceName || ""}
              onChange={e => update({ voiceName: e.target.value })}
              disabled={voices.length === 0}
              aria-label="Narrator voice"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                border: "2px solid #E2E8F0",
                borderRadius: 8,
                background: "#fff",
                color: "#1E293B",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <option value="">Auto-pick (recommended)</option>
              {voices.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.lang ? `(${v.lang})` : ""}
                </option>
              ))}
            </select>

            <button
              onClick={previewVoice}
              disabled={previewing || voices.length === 0}
              aria-label="Preview narrator voice"
              style={{
                marginTop: 8,
                fontFamily: "'Fredoka',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 16px",
                border: "1px solid #E2E8F0",
                borderRadius: 100,
                background: previewing ? "#F0F9FF" : "#fff",
                color: previewing ? "#3B82F6" : "#475569",
                cursor: previewing ? "default" : "pointer",
              }}
            >
              {previewing ? "🔊 Playing…" : "🔊 Preview"}
            </button>
          </div>

          {/* ElevenLabs premium voice (Stage 2: server proxy) */}
          <div style={{ marginBottom: 18, paddingTop: 14, borderTop: "1px dashed #E2E8F0" }}>
            <PremiumVoicePanel />
          </div>

          {/* Speech rate */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={labelStyle}>Speech speed</span>
              <span style={{ fontSize: 11, color: "#64748B" }}>{(a11y.speechRate || 0.85).toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.5" max="1.5" step="0.05"
              value={a11y.speechRate || 0.85}
              onChange={e => update({ speechRate: parseFloat(e.target.value) })}
              aria-label="Narration speech rate"
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8" }}>
              <span>Slower</span>
              <span>Default</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Speech pitch */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={labelStyle}>Speech pitch</span>
              <span style={{ fontSize: 11, color: "#64748B" }}>{(a11y.speechPitch || 1.1).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5" max="2.0" step="0.05"
              value={a11y.speechPitch || 1.1}
              onChange={e => update({ speechPitch: parseFloat(e.target.value) })}
              aria-label="Narration speech pitch"
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8" }}>
              <span>Lower</span>
              <span>Default</span>
              <span>Higher</span>
            </div>
          </div>

          {/* Theme */}
          <div style={{ marginBottom: 18 }}>
            <div style={labelStyle}>Theme</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { if (theme !== "light") onToggleTheme(); }}
                aria-label="Light theme"
                aria-pressed={theme === "light"}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: theme === "light" ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                  borderRadius: 8,
                  background: theme === "light" ? "#EFF6FF" : "#fff",
                  cursor: "pointer",
                  fontFamily: "'Fredoka',sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme === "light" ? "#3B82F6" : "#64748B",
                }}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => { if (theme !== "dark") onToggleTheme(); }}
                aria-label="Dark theme"
                aria-pressed={theme === "dark"}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: theme === "dark" ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                  borderRadius: 8,
                  background: theme === "dark" ? "#EFF6FF" : "#fff",
                  cursor: "pointer",
                  fontFamily: "'Fredoka',sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme === "dark" ? "#3B82F6" : "#64748B",
                }}
              >
                🌙 Dark
              </button>
            </div>
          </div>

          {/* Accessibility shortcut */}
          <div>
            <div style={labelStyle}>Accessibility</div>
            <p style={subStyle}>Text size, contrast, dyslexia font, reduced motion, sensory-friendly mode, Full Audio Mode.</p>
            <button
              onClick={onOpenAccessibility}
              aria-label="Open full accessibility settings"
              style={{
                fontFamily: "'Fredoka',sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 18px",
                border: "1px solid #E2E8F0",
                borderRadius: 100,
                background: "#fff",
                color: "#475569",
                cursor: "pointer",
                width: "100%",
              }}
            >
              ♿ Open Accessibility Settings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
