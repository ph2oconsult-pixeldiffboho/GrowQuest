// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Premium Voice Panel (v6.7.5, Stage 2)
//
// Rendered inside the Parent Preferences hub. Stage 2 is server-backed:
// the parent flips a toggle (on by default) and picks a voice. The
// server (api/tts.js) holds the ElevenLabs key and bills the GrowQuest
// account.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
  loadPremiumVoiceConfig,
  savePremiumVoiceConfig,
  fetchPremiumVoices,
  synthesizePremiumSpeech,
  checkPremiumVoiceAvailable,
} from "./elevenlabs.js";

export default function PremiumVoicePanel() {
  const [config, setConfig] = useState(() => loadPremiumVoiceConfig());
  const [voices, setVoices] = useState([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [available, setAvailable] = useState(null); // null = checking
  const [previewing, setPreviewing] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [error, setError] = useState("");

  // On mount: check whether the server has TTS configured, then load voices.
  useEffect(() => {
    (async () => {
      const ok = await checkPremiumVoiceAvailable();
      setAvailable(ok);
      if (ok) {
        const v = await fetchPremiumVoices();
        setVoices(v);
        setVoicesLoaded(true);
        // If user has no voice picked yet but server returned voices, pick first.
        if (!config.voiceId && v.length > 0) {
          const next = { ...config, voiceId: v[0].voice_id, voiceName: v[0].name };
          savePremiumVoiceConfig(next);
          setConfig(next);
        }
      }
    })();
    // Clean up audio URLs on unmount.
    return () => { if (previewAudio) URL.revokeObjectURL(previewAudio); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next) => {
    savePremiumVoiceConfig(next);
    setConfig(next);
  };

  const handleToggleEnabled = () => {
    persist({ ...config, enabled: !config.enabled });
  };

  const handlePickVoice = (voiceId) => {
    const v = voices.find(x => x.voice_id === voiceId);
    if (!v) return;
    persist({ ...config, voiceId: v.voice_id, voiceName: v.name });
  };

  const handlePreview = async () => {
    if (!config.voiceId || previewing) return;
    setPreviewing(true);
    setError("");
    const url = await synthesizePremiumSpeech(
      `Hi! This is ${config.voiceName || "your premium companion"}. I'll be your GrowQuest guide.`,
      { voiceId: config.voiceId }
    );
    if (!url) {
      setError("Couldn't generate a preview. The premium voice may be temporarily unavailable.");
      setPreviewing(false);
      return;
    }
    if (previewAudio) URL.revokeObjectURL(previewAudio);
    setPreviewAudio(url);
    const audio = new Audio(url);
    audio.onended = () => setPreviewing(false);
    audio.onerror = () => setPreviewing(false);
    await audio.play().catch(() => setPreviewing(false));
  };

  const labelStyle = { fontSize: 12, color: "#475569", fontWeight: 600, marginBottom: 6 };
  const subStyle = { fontSize: 11, color: "#94A3B8", lineHeight: 1.5 };

  return (
    <div>
      <div style={labelStyle}>Premium voice</div>
      <p style={{ ...subStyle, marginBottom: 12 }}>
        High-quality companion voice via ElevenLabs. Falls back to the built-in browser voice if unavailable.
      </p>

      {available === null && <p style={subStyle}>Checking premium voice availability…</p>}

      {available === false && (
        <div style={{ padding: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 11, color: "#64748B" }}>
          Premium voice is not configured on this deployment. The companion will use your device's built-in voice.
        </div>
      )}

      {available === true && (
        <>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            background: config.enabled ? "#F0FDF4" : "#F8FAFC",
            border: `1px solid ${config.enabled ? "#86EFAC" : "#E2E8F0"}`,
            borderRadius: 8,
            marginBottom: 10,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>
                {config.enabled ? "Premium voice on" : "Premium voice off"}
              </div>
              <div style={{ fontSize: 10, color: "#64748B" }}>
                {config.enabled && config.voiceName ? `Voice: ${config.voiceName}` : "Using built-in browser voice"}
              </div>
            </div>
            <button
              onClick={handleToggleEnabled}
              role="switch"
              aria-checked={config.enabled}
              aria-label="Toggle premium voice"
              style={{
                width: 44, height: 24, borderRadius: 100,
                background: config.enabled ? "#10B981" : "#CBD5E1",
                border: "none",
                position: "relative",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <span style={{
                position: "absolute",
                top: 2, left: config.enabled ? 22 : 2,
                width: 20, height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left .2s",
              }} />
            </button>
          </div>

          {config.enabled && voicesLoaded && voices.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 6 }}>
                Choose a voice
              </div>
              <select
                value={config.voiceId}
                onChange={e => handlePickVoice(e.target.value)}
                aria-label="Premium voice selection"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 12,
                  border: "2px solid #E2E8F0",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#1E293B",
                }}
              >
                {voices.map(v => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p role="alert" style={{ color: "#EF4444", fontSize: 11, marginBottom: 8 }}>{error}</p>}

          {config.enabled && (
            <button
              onClick={handlePreview}
              disabled={previewing || !config.voiceId}
              aria-label="Preview premium voice"
              style={{
                fontFamily: "'Fredoka', sans-serif",
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
              {previewing ? "🔊 Playing…" : "🔊 Preview voice"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
