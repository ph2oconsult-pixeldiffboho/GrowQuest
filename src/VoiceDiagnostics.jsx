// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Voice Diagnostics card
//
// Parent-facing self-test for the premium voice path. Tap "Run check"
// and the UI displays whether each component is wired:
//   1. /api/tts-health (server can reach ElevenLabs at all)
//   2. /api/tts-voices (curated voices resolve)
//   3. /api/tts (real audio synthesis with the default voice)
//
// No dev tools required. Lives in Parent Dashboard.
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";

const API = (typeof window !== "undefined" && window.location.hostname === "localhost")
  ? "http://localhost:3000"
  : ""; // same origin in production

export default function VoiceDiagnostics() {
  const [state, setState] = useState({ running: false, results: null, error: null });

  const runCheck = async () => {
    setState({ running: true, results: null, error: null });
    const results = {
      health: null,
      voices: null,
      tts: null,
    };

    // 1. Health endpoint
    try {
      const r = await fetch(`${API}/api/tts-health`);
      results.health = r.ok ? await r.json() : { ok: false, status: r.status };
    } catch (e) {
      results.health = { ok: false, error: e.message || String(e) };
    }

    // 2. Voices endpoint
    try {
      const r = await fetch(`${API}/api/tts-voices`);
      const data = r.ok ? await r.json() : null;
      results.voices = {
        ok: r.ok,
        status: r.status,
        count: data?.voices?.length || 0,
        names: (data?.voices || []).map(v => v.name).slice(0, 12),
      };
    } catch (e) {
      results.voices = { ok: false, error: e.message || String(e) };
    }

    // 3. Real TTS synthesis (small fixed phrase)
    try {
      const r = await fetch(`${API}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello!" }),
      });
      results.tts = {
        ok: r.ok,
        status: r.status,
        cacheHeader: r.headers.get("X-GQ-Cache") || "",
        contentType: r.headers.get("Content-Type") || "",
        sizeBytes: r.ok ? (await r.arrayBuffer()).byteLength : 0,
      };
      if (!r.ok) {
        try { results.tts.errorBody = await r.text(); } catch {}
      }
    } catch (e) {
      results.tts = { ok: false, error: e.message || String(e) };
    }

    setState({ running: false, results, error: null });
  };

  const overallOk =
    state.results &&
    state.results.health?.ok &&
    state.results.voices?.ok &&
    state.results.tts?.ok;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,.04)", marginBottom: 14 }}>
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 15, color: "#1E293B", marginBottom: 8 }}>Voice Diagnostics</h3>
      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, marginBottom: 12 }}>
        Run a self-test to confirm the premium voice path is wired correctly. Reports show whether the server can reach ElevenLabs, which voices resolved, and whether real audio synthesis works.
      </p>

      <button
        onClick={runCheck}
        disabled={state.running}
        style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 13,
          fontWeight: 600,
          padding: "10px 24px",
          border: "2px solid #C7D2FE",
          borderRadius: 100,
          background: state.running ? "#F8FAFC" : "#fff",
          color: state.running ? "#94A3B8" : "#4338CA",
          cursor: state.running ? "wait" : "pointer",
        }}
      >
        {state.running ? "Running…" : (state.results ? "Re-run check" : "Run check")}
      </button>

      {state.results && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: overallOk ? "#ECFDF5" : "#FEF2F2",
            border: `1px solid ${overallOk ? "#A7F3D0" : "#FECACA"}`,
            color: overallOk ? "#065F46" : "#991B1B",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
          }}>
            {overallOk ? "✓ Premium voice path is healthy" : "✗ Premium voice path has issues — see below"}
          </div>

          {/* Health */}
          <DiagRow label="Server → ElevenLabs voices" ok={state.results.health?.ok}>
            <KV k="API key present" v={state.results.health?.apiKeyPresent ? "yes" : "NO (set ELEVENLABS_API_KEY)"} />
            <KV k="/v1/voices status" v={state.results.health?.voicesEndpoint?.status} />
            <KV k="Total voices on account" v={state.results.health?.voicesEndpoint?.totalVoices} />
            <KV k="Curated resolved" v={`${state.results.health?.curated?.resolved} / 10`} />
            {state.results.health?.curated?.missing?.length > 0 && (
              <KV k="Missing names" v={state.results.health.curated.missing.join(", ")} />
            )}
            <KV k="Default voice resolved" v={state.results.health?.defaultVoice?.resolvedFromUpstream ? `${state.results.health.defaultVoice.name} (${state.results.health.defaultVoice.voiceId.slice(0, 10)}…)` : "no — using fallback"} />
            {state.results.health?.error && <KV k="Error" v={state.results.health.error} highlight />}
          </DiagRow>

          {/* Voices */}
          <DiagRow label="Picker voice list" ok={state.results.voices?.ok && state.results.voices?.count > 0}>
            <KV k="Status" v={state.results.voices?.status} />
            <KV k="Voices returned" v={state.results.voices?.count} />
            {state.results.voices?.names?.length > 0 && (
              <KV k="Names" v={state.results.voices.names.join(", ")} />
            )}
            {state.results.voices?.error && <KV k="Error" v={state.results.voices.error} highlight />}
          </DiagRow>

          {/* TTS */}
          <DiagRow label="Real audio synthesis" ok={state.results.tts?.ok && state.results.tts?.sizeBytes > 0}>
            <KV k="Status" v={state.results.tts?.status} />
            <KV k="Cache" v={state.results.tts?.cacheHeader || "—"} />
            <KV k="Content-Type" v={state.results.tts?.contentType || "—"} />
            <KV k="Audio size" v={state.results.tts?.sizeBytes ? `${state.results.tts.sizeBytes} bytes` : "0"} />
            {state.results.tts?.errorBody && <KV k="Error body" v={state.results.tts.errorBody} highlight />}
            {state.results.tts?.error && <KV k="Error" v={state.results.tts.error} highlight />}
          </DiagRow>
        </div>
      )}
    </div>
  );
}

function DiagRow({ label, ok, children }) {
  return (
    <div style={{ padding: "10px 12px", marginBottom: 8, borderRadius: 8, background: "#F8FAFC", borderLeft: `3px solid ${ok ? "#10B981" : "#EF4444"}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: ok ? "#065F46" : "#991B1B", marginBottom: 4 }}>
        {ok ? "✓" : "✗"} {label}
      </div>
      <div style={{ fontSize: 11, color: "#475569", fontFamily: "'SF Mono', Menlo, monospace" }}>
        {children}
      </div>
    </div>
  );
}

function KV({ k, v, highlight }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "2px 0", color: highlight ? "#991B1B" : "#475569" }}>
      <span style={{ color: "#94A3B8", minWidth: 130 }}>{k}:</span>
      <span style={{ wordBreak: "break-word", flex: 1 }}>{String(v ?? "—")}</span>
    </div>
  );
}
