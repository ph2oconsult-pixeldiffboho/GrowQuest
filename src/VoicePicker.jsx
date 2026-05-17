// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Shared Voice Picker (v6.7.8)
//
// Used in four places (consent, welcome, guided onboarding "Ready to
// meet" overlay, dashboard 🔊 popover) to let parents choose the
// companion voice.
//
// v6.7.8 — the picker now reflects what's actually playing. When
// premium voice is enabled (the default), it shows the 5 curated
// ElevenLabs voices fetched from /api/tts-voices. When premium is off
// or unavailable, it falls back to a short curated list of Web Speech
// voices that work across macOS, iOS, and modern Chromium browsers.
//
// The picker writes the parent's choice to the storage key that
// matches the active source:
//   - Premium voice on  → gq_premium_voice.voiceId (used by /api/tts)
//   - Premium voice off → gq_voice_name             (used by Web Speech)
// useSpeak() reads whichever is appropriate for the path it's taking.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
  loadPremiumVoiceConfig,
  savePremiumVoiceConfig,
  fetchPremiumVoices,
  synthesizePremiumSpeech,
} from "./elevenlabs.js";

const COMPANION_VOICE_KEY = "gq_voice_name";

export function loadCompanionVoice() {
  try { return localStorage.getItem(COMPANION_VOICE_KEY) || ""; } catch (e) { return ""; }
}

export function saveCompanionVoice(name) {
  try { localStorage.setItem(COMPANION_VOICE_KEY, name); } catch (e) {}
}

// Curated Web Speech fallback list. We match by `name.includes(token)`
// so platform variants like "Samantha (Enhanced)" still hit.
const WEB_SPEECH_CURATED = [
  { token: "Samantha",                 label: "Samantha",  desc: "Warm American (Mac/iOS)" },
  { token: "Karen",                    label: "Karen",     desc: "Australian (Mac/iOS)" },
  { token: "Moira",                    label: "Moira",     desc: "Irish (Mac/iOS)" },
  { token: "Daniel",                   label: "Daniel",    desc: "British (Mac/iOS/Chrome)" },
  { token: "Google UK English Female", label: "Google UK", desc: "British (Chromebook)" },
];

function getCuratedWebSpeechVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const all = window.speechSynthesis.getVoices();
  const found = [];
  const seen = new Set();
  for (const c of WEB_SPEECH_CURATED) {
    if (seen.has(c.label)) continue;
    const match = all.find(v => v.name.includes(c.token) && v.lang && v.lang.startsWith("en"));
    if (match) {
      found.push({ id: match.name, name: c.label, description: c.desc });
      seen.add(c.label);
    }
  }
  // Fallback: if zero curated voices present (unusual platform), expose
  // the first English voice so the picker isn't empty.
  if (found.length === 0) {
    const fallback = all.find(v => v.lang && v.lang.startsWith("en"));
    if (fallback) found.push({ id: fallback.name, name: fallback.name, description: "System voice" });
  }
  return found;
}

/**
 * VoicePicker — controlled UI for picking a companion voice.
 *
 * The legacy `value` / `onChange` props are no longer needed — the
 * picker reads + writes the appropriate storage key internally based on
 * which voice source is active. They're accepted but ignored.
 */
export default function VoicePicker({
  variant = "light",
  compact = false,
  previewText = "Hi! This is what your companion sounds like."
}) {
  // "premium" | "webspeech" — which source we're picking from.
  const [source, setSource] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = loadPremiumVoiceConfig();
      if (cfg && cfg.enabled) {
        const premium = await fetchPremiumVoices();
        if (cancelled) return;
        if (premium && premium.length > 0) {
          const mapped = premium.map(v => ({
            id: v.voice_id,
            name: v.name,
            description: v.description || "",
          }));
          setVoices(mapped);
          let initialId = cfg.voiceId;
          if (!mapped.find(v => v.id === initialId)) initialId = mapped[0].id;
          setSelected(initialId);
          if (initialId !== cfg.voiceId) {
            const v = mapped.find(x => x.id === initialId);
            savePremiumVoiceConfig({ ...cfg, voiceId: v.id, voiceName: v.name });
          }
          setSource("premium");
          return;
        }
      }
      // Web Speech fallback.
      const refresh = () => {
        const ws = getCuratedWebSpeechVoices();
        setVoices(ws);
        const saved = loadCompanionVoice();
        const matchedSaved = ws.find(v => v.id === saved);
        setSelected(matchedSaved ? saved : (ws[0]?.id || ""));
      };
      refresh();
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = refresh;
      setSource("webspeech");
    })();

    return () => {
      cancelled = true;
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
      if (previewUrl) try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (newId) => {
    setSelected(newId);
    const v = voices.find(x => x.id === newId);
    if (source === "premium") {
      const cfg = loadPremiumVoiceConfig();
      savePremiumVoiceConfig({ ...cfg, voiceId: newId, voiceName: v?.name || "" });
    } else {
      saveCompanionVoice(newId);
    }
  };

  const previewPremium = async () => {
    if (!selected || previewing) return;
    setPreviewing(true);
    const url = await synthesizePremiumSpeech(previewText, { voiceId: selected });
    if (!url) { setPreviewing(false); return; }
    if (previewUrl) try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    setPreviewUrl(url);
    const audio = new Audio(url);
    audio.onended = () => setPreviewing(false);
    audio.onerror = () => setPreviewing(false);
    await audio.play().catch(() => setPreviewing(false));
  };

  const previewWebSpeech = () => {
    if (!window.speechSynthesis || previewing) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(previewText);
    u.rate = 0.9; u.pitch = 1.15; u.volume = 1;
    if (selected) {
      const v = window.speechSynthesis.getVoices().find(x => x.name === selected);
      if (v) u.voice = v;
    }
    u.onend = () => setPreviewing(false);
    u.onerror = () => setPreviewing(false);
    setPreviewing(true);
    window.speechSynthesis.speak(u);
  };

  const preview = () => {
    if (source === "premium") previewPremium();
    else if (source === "webspeech") previewWebSpeech();
  };

  const dark = variant === "dark";

  const labelStyle = {
    fontSize: 12,
    color: dark ? "rgba(255,255,255,.7)" : "#475569",
    fontWeight: 600,
    marginBottom: 6,
  };
  const selectStyle = {
    width: "100%",
    padding: compact ? "8px 10px" : "10px 12px",
    fontSize: compact ? 12 : 13,
    border: dark ? "1px solid rgba(255,255,255,.2)" : "2px solid #E2E8F0",
    borderRadius: 8,
    background: dark ? "rgba(255,255,255,.08)" : "#fff",
    color: dark ? "#fff" : "#1E293B",
    fontFamily: "'Nunito', sans-serif",
  };
  const btnStyle = {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: compact ? 11 : 12,
    fontWeight: 600,
    padding: compact ? "5px 12px" : "6px 16px",
    border: dark ? "1px solid rgba(255,255,255,.2)" : "1px solid #E2E8F0",
    borderRadius: 100,
    background: previewing
      ? (dark ? "rgba(59,130,246,.25)" : "#F0F9FF")
      : (dark ? "rgba(255,255,255,.08)" : "#fff"),
    color: previewing
      ? (dark ? "#93C5FD" : "#3B82F6")
      : (dark ? "rgba(255,255,255,.8)" : "#475569"),
    cursor: previewing ? "default" : "pointer",
  };

  return (
    <div>
      {!compact && <div style={labelStyle}>Companion voice</div>}
      <select
        value={selected}
        onChange={e => handleChange(e.target.value)}
        disabled={voices.length === 0}
        aria-label="Companion voice"
        style={selectStyle}
      >
        {voices.map(v => (
          <option key={v.id} value={v.id}>
            {v.name}{v.description ? ` — ${v.description}` : ""}
          </option>
        ))}
      </select>
      {voices.length === 0 && (
        <p style={{ fontSize: 10, color: dark ? "rgba(255,255,255,.4)" : "#94A3B8", marginTop: 4 }}>
          Loading available voices…
        </p>
      )}
      <button
        onClick={preview}
        disabled={previewing || voices.length === 0}
        aria-label="Preview companion voice"
        style={{ ...btnStyle, marginTop: 8 }}
      >
        {previewing ? "🔊 Playing…" : "🔊 Preview"}
      </button>
    </div>
  );
}
