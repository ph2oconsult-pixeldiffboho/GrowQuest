// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — TTS health endpoint
//
// Returns a JSON diagnostic of the premium voice wiring so we can
// confirm post-deploy whether the path will work without opening dev
// tools and reading server logs.
//
// Response shape (success):
// {
//   ok: true,
//   apiKeyPresent: true,
//   voicesEndpoint: { status: 200, totalVoices: 67 },
//   curated: { resolved: 10, missing: [], names: ['Aria', ...] },
//   defaultVoice: { name: 'Aria', voiceId: 'xxx', resolvedFromUpstream: true },
//   model: 'eleven_multilingual_v2',
//   timestamp: '2026-05-16T...'
// }
//
// No secrets are exposed. Safe to leave permanently enabled.
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];
function allowedOrigins() {
  const env = process.env.ALLOWED_ORIGINS;
  if (!env) return DEFAULT_ORIGINS;
  return env.split(",").map(s => s.trim()).filter(Boolean);
}
function setCors(req, res) {
  const origin = req.headers?.origin || "";
  const allowed = allowedOrigins();
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Keep in sync with api/tts.js CURATED_VOICE_NAMES.
const CURATED_NAMES = ["Aria", "Jessica", "Laura", "Matilda", "Sarah", "Brian", "Eric", "Liam", "Will", "Chris"];

function resolveByName(upstreamVoices, name) {
  const t = name.toLowerCase();
  let m = upstreamVoices.find(v => v.name?.toLowerCase() === t);
  if (m) return { id: m.voice_id, exact: true };
  m = upstreamVoices.find(v => v.name?.toLowerCase().startsWith(t + " ") || v.name?.toLowerCase().startsWith(t + "-"));
  if (m) return { id: m.voice_id, exact: false };
  m = upstreamVoices.find(v => v.name?.toLowerCase().includes(t));
  if (m) return { id: m.voice_id, exact: false };
  return null;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const defaultVoiceName = process.env.ELEVENLABS_DEFAULT_VOICE_NAME || "Aria";
  const defaultModel = process.env.ELEVENLABS_DEFAULT_MODEL || "eleven_multilingual_v2";

  const result = {
    ok: false,
    apiKeyPresent: !!apiKey,
    voicesEndpoint: { status: 0, totalVoices: 0 },
    curated: { resolved: 0, missing: [...CURATED_NAMES], names: [] },
    defaultVoice: { name: defaultVoiceName, voiceId: "", resolvedFromUpstream: false },
    model: defaultModel,
    allowedOrigins: allowedOrigins(),
    timestamp: new Date().toISOString(),
  };

  if (!apiKey) {
    result.error = "ELEVENLABS_API_KEY is not set on the server. Premium voice will fall back to Web Speech for everyone.";
    return res.status(200).json(result);
  }

  try {
    const upstreamResp = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey, "Accept": "application/json" },
    });
    result.voicesEndpoint.status = upstreamResp.status;
    if (!upstreamResp.ok) {
      result.error = `ElevenLabs /v1/voices returned ${upstreamResp.status}. Falling back to hardcoded IDs.`;
      return res.status(200).json(result);
    }
    const data = await upstreamResp.json();
    const upstreamVoices = data.voices || [];
    result.voicesEndpoint.totalVoices = upstreamVoices.length;

    const resolved = [];
    const missing = [];
    for (const name of CURATED_NAMES) {
      const match = resolveByName(upstreamVoices, name);
      if (match) resolved.push({ name, voiceId: match.id, exactMatch: match.exact });
      else missing.push(name);
    }
    result.curated.resolved = resolved.length;
    result.curated.missing = missing;
    result.curated.names = resolved;

    const defaultMatch = resolveByName(upstreamVoices, defaultVoiceName);
    if (defaultMatch) {
      result.defaultVoice.voiceId = defaultMatch.id;
      result.defaultVoice.resolvedFromUpstream = true;
    }

    result.ok = resolved.length > 0;
    if (resolved.length === 0) {
      result.error = "None of the 10 curated voice names resolved against your ElevenLabs account. Server will use hardcoded fallback IDs.";
    }
    return res.status(200).json(result);
  } catch (e) {
    result.error = `Health check threw: ${e.message || String(e)}`;
    return res.status(200).json(result);
  }
}
