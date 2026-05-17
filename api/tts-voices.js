// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Voices list for the premium voice picker.
//
// Returns a curated list of voices available on the GrowQuest account.
// Cached server-side for 1 hour since voices rarely change.
//
// Response shape: { voices: [{ voice_id, name, description }, ...] }
//
// v6.7.12: curate by NAME instead of by hardcoded voice_id. ElevenLabs
// has been migrating its default voice library, and the same voice_id
// has been observed mapping to different voice names depending on when
// the voice was created. Names are more stable. We look up the current
// voice_id for each curated name at runtime from /v1/voices, and cache
// the resolved list for 1 hour.
//
// 10 voices: 5 female, 5 male. No country labels in the descriptions —
// the underlying voices are American-English trained, but a children's
// app doesn't need to advertise that. Descriptions focus on character.
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

let cached = null;       // { voices, fetchedAt }
const TTL = 60 * 60 * 1000; // 1 hour

// Curated names — resolved to voice_ids at request time. Order here is
// the order shown in the picker. Female first, then male.
const CURATED_NAMES = [
  // Female
  { name: "Aria",    description: "Warm and welcoming" },
  { name: "Jessica", description: "Bright and expressive" },
  { name: "Laura",   description: "Upbeat and friendly" },
  { name: "Matilda", description: "Calm and reassuring" },
  { name: "Sarah",   description: "Confident and clear" },
  // Male
  { name: "Brian",   description: "Resonant and comforting" },
  { name: "Eric",    description: "Friendly conversational" },
  { name: "Liam",    description: "Articulate and warm" },
  { name: "Will",    description: "Patient storyteller" },
  { name: "Chris",   description: "Casual and approachable" },
];

// v6.7.13: hardcoded fallback voice IDs. If /v1/voices fails or doesn't
// return any matching names, we still hand the picker SOMETHING so the
// premium voice path isn't silently broken. Same IDs as v6.7.9–v6.7.11.
const FALLBACK_IDS = {
  Aria:    "9BWtsMINqrJLrRacOk9x",
  Jessica: "cgSgspJ2msm6clMCkdW9",
  Laura:   "FGY2WhTYpPnrIDTdsKH5",
  Matilda: "XrExE9yKIg1WjnnlVkGX",
  Sarah:   "EXAVITQu4vr4xnSDxMaL",
  Brian:   "nPczCjzI2devNBz1zQrb",
  Eric:    "cjVigY5qzO86Huf0OWal",
  Liam:    "TX3LPaxmHKxFdv7VOQHJ",
  Will:    "bIHbv24MWmeRgasZH58o",
  Chris:   "iP95p4xoKVk53GoZ742B",
};

function buildFallbackVoices() {
  return CURATED_NAMES.map(c => ({
    voice_id: FALLBACK_IDS[c.name] || "",
    name: c.name,
    description: c.description,
  })).filter(v => v.voice_id);
}

export const _CURATED_NAMES = CURATED_NAMES; // exported for use by api/tts.js allowlist
export function _resetVoicesCache() { cached = null; }

// Match a curated entry against the upstream voices list. Returns the
// best match (exact name → starts-with → substring) so display variants
// like "Aria - Conversational" still resolve.
function matchVoice(upstreamVoices, curatedName) {
  const target = curatedName.toLowerCase();
  // Exact match first
  let m = upstreamVoices.find(v => v.name?.toLowerCase() === target);
  if (m) return m;
  // Starts-with
  m = upstreamVoices.find(v => v.name?.toLowerCase().startsWith(target + " ") || v.name?.toLowerCase().startsWith(target + "-"));
  if (m) return m;
  // Substring fallback
  m = upstreamVoices.find(v => v.name?.toLowerCase().includes(target));
  return m || null;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Premium voice not configured" });

  if (cached && Date.now() - cached.fetchedAt < TTL) {
    return res.status(200).json({ voices: cached.voices });
  }

  try {
    const resp = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey, "Accept": "application/json" },
    });
    if (!resp.ok) {
      console.error("ElevenLabs /v1/voices failed:", resp.status, "— using fallback voices");
      // v6.7.13: ALWAYS hand back a non-empty list so the picker has
      // options. Use hardcoded fallback rather than empty array.
      const fallback = cached?.voices?.length ? cached.voices : buildFallbackVoices();
      cached = { voices: fallback, fetchedAt: Date.now() };
      return res.status(200).json({ voices: fallback });
    }
    const data = await resp.json();
    const upstreamVoices = data.voices || [];

    // Resolve each curated name to its current voice_id.
    const voices = [];
    const missing = [];
    for (const curated of CURATED_NAMES) {
      const match = matchVoice(upstreamVoices, curated.name);
      const voice_id = (match && match.voice_id) || FALLBACK_IDS[curated.name];
      if (voice_id) {
        voices.push({
          voice_id,
          name: curated.name,
          description: curated.description,
        });
      } else {
        missing.push(curated.name);
      }
    }
    if (missing.length > 0) {
      console.warn("Curated voices not found on this ElevenLabs account:", missing);
    }
    if (voices.length === 0) {
      // Total failure mode — use hardcoded fallback so picker is never empty.
      console.warn("No curated voices resolved against ElevenLabs — using fallback list");
      const fallback = buildFallbackVoices();
      cached = { voices: fallback, fetchedAt: Date.now() };
      return res.status(200).json({ voices: fallback });
    }

    cached = { voices, fetchedAt: Date.now() };
    return res.status(200).json({ voices });
  } catch (e) {
    console.error("Voices error, using fallback:", e);
    const fallback = cached?.voices?.length ? cached.voices : buildFallbackVoices();
    return res.status(200).json({ voices: fallback });
  }
}
