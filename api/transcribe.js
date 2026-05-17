// PRIVACY: This function receives audio, sends it to Gemini for transcription, returns text.
// Audio is processed in memory only — NEVER stored on disk, in logs, or in any database.
// The audio blob is discarded after Gemini returns the transcription.
// No personally identifiable information is sent — only raw audio bytes and MIME type.
//
// v6.7 changes:
//   - CORS restricted to the deployed origin(s). Set ALLOWED_ORIGINS env var
//     (comma-separated list) on Vercel. Falls back to localhost dev URLs.
//   - Coarse per-IP rate limit (in-memory; survives a single warm function
//     instance only — replace with Vercel KV / Upstash for production).

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

// Rate limit: 30 requests / 5 min / IP. In-memory only — see note above.
const RL_WINDOW = 5 * 60 * 1000;
const RL_MAX = 30;
const rlMap = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const arr = (rlMap.get(ip) || []).filter(t => now - t < RL_WINDOW);
  if (arr.length >= RL_MAX) return false;
  arr.push(now);
  rlMap.set(ip, arr);
  return true;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(ip)) return res.status(429).json({ error: "Too many requests. Please wait a moment." });

  try {
    const { audio, mimeType } = req.body;
    if (!audio) return res.status(400).json({ error: "No audio received. Try recording again." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Voice is not set up yet. Ask a parent to check settings." });

    let geminiMime = mimeType || "audio/webm";
    if (geminiMime.includes("mp4")) geminiMime = "audio/mp4";
    else if (geminiMime.includes("webm")) geminiMime = "audio/webm";
    else if (geminiMime.includes("ogg")) geminiMime = "audio/ogg";
    else if (geminiMime.includes("wav")) geminiMime = "audio/wav";

    const models = ["gemini-2.5-flash", "gemini-3-flash-preview"];
    let lastError = null;

    // Try with the original mime type first, then with audio/wav as fallback
    const mimeTypes = [geminiMime, "audio/wav", "audio/mpeg"];

    for (const model of models) {
      for (const tryMime of [geminiMime]) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { inlineData: { mimeType: tryMime, data: audio } },
                    { text: "Transcribe this audio exactly as spoken. Return ONLY the text. If the speaker is a child, transcribe faithfully. If no speech, return empty string." }
                  ]
                }],
                generationConfig: { temperature: 0, maxOutputTokens: 1024 },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            return res.status(200).json({ transcript });
          }

          const errText = await response.text();
          console.error(`Gemini ${model} (${tryMime}) error (${response.status}):`, errText);
          lastError = `${model} ${tryMime}: ${response.status} - ${errText.substring(0, 150)}`;
        } catch (e) {
          console.error(`Gemini ${model} fetch error:`, e.message);
          lastError = `${model}: ${e.message}`;
        }
      }
    }

    return res.status(500).json({ error: "Could not understand the recording. Try speaking a bit louder.", debug: lastError });
  } catch (error) {
    console.error("Transcription error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again.", debug: error.message });
  }
}
