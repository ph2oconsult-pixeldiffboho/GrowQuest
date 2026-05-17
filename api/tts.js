// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Server-side ElevenLabs TTS proxy (v6.7.5, Stage 2)
//
// The browser POSTs { text, voiceId?, model? } to /api/tts. We call
// ElevenLabs with the server-owned ELEVENLABS_API_KEY and stream the
// resulting audio back as audio/mpeg.
//
// Why a proxy:
//   - Single key controlled by ops, rotatable from Vercel env vars
//   - Per-IP rate limit prevents runaway billing
//   - In-memory cache for common phrases ("Welcome back!", "Great job!")
//     cuts cost ~60-70% compared to naive per-utterance billing
//   - Browser never sees the key
//
// Privacy:
//   - We log nothing about the text being synthesised
//   - Cache key is sha256(text + voiceId + model), text is never stored
//     in cleartext anywhere
//   - Cache lives in the warm function instance only (~1 hour of inactivity
//     before Vercel cold-restarts); not persisted to disk
// ═══════════════════════════════════════════════════════════════════

import crypto from "node:crypto";

// ── CORS ──────────────────────────────────────────────────────────────
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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── Rate limit ────────────────────────────────────────────────────────
// 120 requests / 5 min / IP. TTS is cheaper than transcription per request
// but more frequent (every companion utterance, every audio narration).
const RL_WINDOW = 5 * 60 * 1000;
const RL_MAX = 120;
const rlMap = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const arr = (rlMap.get(ip) || []).filter(t => now - t < RL_WINDOW);
  if (arr.length >= RL_MAX) return false;
  arr.push(now);
  rlMap.set(ip, arr);
  return true;
}

// ── Cache ─────────────────────────────────────────────────────────────
// In-memory, keyed by sha256(text|voice|model). Bounded to 200 entries
// with LRU eviction so a long-running function instance doesn't grow
// without bound. Common kid-facing phrases will dominate the cache.
const CACHE_MAX = 200;
const cache = new Map(); // key → { audio: Buffer, lastUsed: number }

function cacheKey(text, voiceId, model) {
  const h = crypto.createHash("sha256");
  h.update(`${voiceId}|${model}|${text}`);
  return h.digest("hex");
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  entry.lastUsed = Date.now();
  // Re-insert to move to end (Map preserves insertion order).
  cache.delete(key);
  cache.set(key, entry);
  return entry.audio;
}

function cachePut(key, audio) {
  if (cache.size >= CACHE_MAX) {
    // Evict oldest (first key in insertion order).
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { audio, lastUsed: Date.now() });
}

// Exposed for tests
export function _resetCache() { cache.clear(); rlMap.clear(); }
export function _cacheSize() { return cache.size; }

// ── Defaults ──────────────────────────────────────────────────────────
// v6.7.9: default model changed from Flash v2.5 to Multilingual v2 for
// significantly better naturalness. Cost doubles (1 credit/char vs 0.5)
// but the quality jump is the whole point of this pilot.
// v6.7.12: default voice is now resolved by NAME (Aria) at runtime, not
// by hardcoded ID. ElevenLabs has migrated voice IDs and the same ID
// can map to different voices on different accounts. Names are stable.
const DEFAULT_VOICE_NAME = process.env.ELEVENLABS_DEFAULT_VOICE_NAME || "Aria";
const DEFAULT_MODEL = process.env.ELEVENLABS_DEFAULT_MODEL || "eleven_multilingual_v2";
const MAX_TEXT_LENGTH = 1000; // ~30 seconds of speech; prevents abuse

// v6.7.12: curated names. Keep in sync with CURATED_NAMES in
// api/tts-voices.js. We resolve these to current voice_ids at runtime.
const CURATED_VOICE_NAMES = [
  "Aria", "Jessica", "Laura", "Matilda", "Sarah",     // female
  "Brian", "Eric", "Liam", "Will", "Chris",            // male
];

// Resolved cache: { ids: Set<string>, defaultId: string, fetchedAt }
let allowlistCache = null;
const ALLOWLIST_TTL = 60 * 60 * 1000; // 1 hour

export function _resetAllowlist() { allowlistCache = null; }

// v6.7.13: hardcoded fallback IDs in case name resolution fails. These
// are the same IDs that worked in v6.7.9–v6.7.11. They may or may not
// resolve to voices with the names we expect (ElevenLabs migrates IDs),
// but having them as a fallback prevents the whole premium path from
// collapsing into Web Speech if /v1/voices is slow, fails, or returns
// an unexpected shape.
const FALLBACK_NAME_TO_ID = {
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

function buildFallbackAllowlist() {
  const ids = new Set(Object.values(FALLBACK_NAME_TO_ID));
  const defaultId = FALLBACK_NAME_TO_ID[DEFAULT_VOICE_NAME] || FALLBACK_NAME_TO_ID.Aria;
  return { ids, defaultId, fetchedAt: Date.now() };
}

async function getAllowlist(apiKey) {
  if (allowlistCache && Date.now() - allowlistCache.fetchedAt < ALLOWLIST_TTL) {
    return allowlistCache;
  }
  try {
    const resp = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey, "Accept": "application/json" },
    });
    if (!resp.ok) {
      // v6.7.13: fall back to hardcoded IDs, don't return empty.
      console.warn("ElevenLabs /v1/voices failed:", resp.status, "— using fallback allowlist");
      allowlistCache = buildFallbackAllowlist();
      return allowlistCache;
    }
    const data = await resp.json();
    const upstream = data.voices || [];
    const nameToId = new Map();
    for (const v of upstream) {
      if (v.name && v.voice_id) nameToId.set(v.name.toLowerCase(), v.voice_id);
    }
    // Helper: match by exact, then starts-with, then substring
    const resolveName = (name) => {
      const t = name.toLowerCase();
      if (nameToId.has(t)) return nameToId.get(t);
      for (const [n, id] of nameToId) {
        if (n.startsWith(t + " ") || n.startsWith(t + "-")) return id;
      }
      for (const [n, id] of nameToId) {
        if (n.includes(t)) return id;
      }
      return null;
    };
    const ids = new Set();
    let resolvedCount = 0;
    for (const name of CURATED_VOICE_NAMES) {
      const id = resolveName(name) || FALLBACK_NAME_TO_ID[name];
      if (id) { ids.add(id); resolvedCount++; }
    }
    if (resolvedCount === 0) {
      // Total failure mode — every curated name failed. Use the full
      // hardcoded fallback rather than returning an empty allowlist.
      console.warn("No curated voices resolved against ElevenLabs — using fallback allowlist");
      allowlistCache = buildFallbackAllowlist();
      return allowlistCache;
    }
    const defaultId =
      resolveName(DEFAULT_VOICE_NAME) ||
      FALLBACK_NAME_TO_ID[DEFAULT_VOICE_NAME] ||
      [...ids][0] ||
      "";
    allowlistCache = { ids, defaultId, fetchedAt: Date.now() };
    return allowlistCache;
  } catch (e) {
    console.error("Allowlist resolution failed, using fallback:", e);
    allowlistCache = buildFallbackAllowlist();
    return allowlistCache;
  }
}

const ALLOWED_MODELS = new Set([
  "eleven_multilingual_v2",  // default — warmer, 1 credit/char
  "eleven_flash_v2_5",       // cheaper, 0.5 credit/char, less warmth
  "eleven_flash_v2",
  "eleven_turbo_v2_5",
]);

// ── Handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(ip)) return res.status(429).json({ error: "Too many requests. Please wait a moment." });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Premium voice not configured" });

  try {
    const { text, voiceId, model } = req.body || {};
    if (!text || typeof text !== "string") return res.status(400).json({ error: "Missing text" });
    if (text.length > MAX_TEXT_LENGTH) return res.status(400).json({ error: "Text too long" });

    // v6.7.12: resolve allowlist dynamically by name.
    const { ids: allowedIds, defaultId } = await getAllowlist(apiKey);
    const chosenVoice = (voiceId && allowedIds.has(voiceId)) ? voiceId : defaultId;
    const chosenModel = (model && ALLOWED_MODELS.has(model)) ? model : DEFAULT_MODEL;

    if (!chosenVoice) {
      console.error("No voices available — allowlist resolution returned empty");
      return res.status(503).json({ error: "Premium voice not available" });
    }

    const key = cacheKey(text, chosenVoice, chosenModel);
    const hit = cacheGet(key);
    if (hit) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-GQ-Cache", "HIT");
      return res.status(200).send(hit);
    }

    const elevenResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(chosenVoice)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: chosenModel,
          // v6.7.9: tuned for engaging-but-natural children's companion.
          // - stability 0.4:  more emotional variation than default 0.5
          //   (matters for "Great job!" vs "Let's think about that...")
          // - similarity_boost 0.85: keeps the voice recognisable across requests
          // - style 0.4: a touch more expressive than neutral
          // - speaker_boost: clearer for younger ears
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.85,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenResp.ok) {
      const body = await elevenResp.text().catch(() => "");
      console.error(`ElevenLabs TTS ${elevenResp.status}:`, body.slice(0, 200));
      return res.status(502).json({ error: "Premium voice unavailable", upstream: elevenResp.status });
    }

    const arrayBuf = await elevenResp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    cachePut(key, buf);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-GQ-Cache", "MISS");
    return res.status(200).send(buf);
  } catch (e) {
    console.error("TTS error:", e);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// ── Voices list ───────────────────────────────────────────────────────
// Exported as a separate endpoint via api/tts-voices.js — see that file.
