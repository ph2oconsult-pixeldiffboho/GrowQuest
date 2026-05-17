// PRIVACY: This function processes child data (first name, quest context).
// Audio is NEVER stored. Prompts are NOT logged. Gemini response is returned and discarded server-side.
// Child's first name is sent to Gemini for story personalisation only.
//
// v6.7: CORS restricted to deployed origin(s); per-IP rate limit added.

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

// 60 stories / 5 min / IP — story generation is cheaper than transcription.
const RL_WINDOW = 5 * 60 * 1000;
const RL_MAX = 60;
const rlMap = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const arr = (rlMap.get(ip) || []).filter(t => now - t < RL_WINDOW);
  if (arr.length >= RL_MAX) return false;
  arr.push(now);
  rlMap.set(ip, arr);
  return true;
}

// v6.7.1: prompt building extracted so it can be unit-tested without hitting
// Gemini. The prompt was rewritten for narrative flow — previously each
// paragraph was instructed to be "DIFFERENT" from the last, which forced
// the discontinuity that teachers noticed. Now we treat the storybook as a
// single continuing story and ask the model to pick up the thread.
export function buildPrompt({ childName, companionName, companionType, questTitle, questResponse, competency, subCompetency, realm, ageGroup, chapterNumber, previousParagraphs }) {
  const ageContext = ageGroup === "early"
    ? "Use very simple words, short sentences (5-8 words each), and a warm, magical tone. The child is 4-6 years old."
    : ageGroup === "primary"
    ? "Use simple but descriptive language, 8-12 word sentences. The child is 6-9 years old."
    : "Use richer vocabulary and longer sentences. The child is 9-12 years old.";

  const realmSettings = {
    "Echo Isles": "a magical archipelago where ideas float as glowing bubbles and words have power",
    "Wonder Peaks": "towering crystal mountains where every question opens a new path",
    "Heartwood Grove": "an ancient forest where the trees remember everything and kindness makes flowers bloom"
  };
  const realmDesc = realmSettings[realm] || "a magical land";

  const isFirstChapter = !previousParagraphs || previousParagraphs.length === 0;
  const recentStory = isFirstChapter
    ? ""
    : `\n\nThe story so far (continue naturally from where this ends):\n${previousParagraphs.slice(-3).join("\n\n")}`;

  const continuityGuidance = isFirstChapter
    ? `- This is Chapter 1. Open by setting the scene in ${realm} and introducing ${childName} and ${companionName} together.`
    : `- Continue the story directly from where it left off. ${childName} and ${companionName} are mid-adventure; pick up the thread.
- Refer to details from earlier paragraphs naturally (places they've been, things they've found, characters they've met). Treat this as the SAME story, not a fresh start.
- Avoid starting with the child's name or with "${childName} smiled/giggled/laughed". Begin from a moment, image, or piece of dialogue that flows from what just happened.`;

  return `You are writing a continuing personalised adventure story for a child named ${childName}. Their animal companion is a ${companionType} named ${companionName}. They are exploring ${realm} — ${realmDesc}.

${childName} just completed a quest called "${questTitle}" which involved ${subCompetency}. ${questResponse ? `Here is what they did or said in the real world: "${questResponse}"` : ""}

Write exactly ONE paragraph (60-90 words) for Chapter ${chapterNumber} of their ongoing story. Rules:
${continuityGuidance}
- Weave what they did in the quest into the events of the chapter, but don't make it the whole paragraph — show them DOING things in the world, not just feeling things.
- Complete every sentence fully. Never end mid-thought or with an ellipsis.
- Don't tease "what might come next". End the chapter with a small, complete moment.
- ${ageContext}
${recentStory}

Return ONLY the story paragraph itself. No quotes around it. No "Chapter ${chapterNumber}:" label. No author notes.`;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(ip)) return res.status(429).json({ error: "Too many requests. Please wait a moment." });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Story feature not configured" });

    const prompt = buildPrompt(req.body);

    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              // v6.7.1: temperature lowered from 0.8 to 0.65 for stronger narrative coherence.
              // Token budget raised slightly to give room for fully-completed sentences.
              generationConfig: { temperature: 0.65, maxOutputTokens: 400 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const paragraph = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          return res.status(200).json({ paragraph });
        }

        const errText = await response.text();
        lastError = `${model}: ${response.status}`;
        console.error(`Story gen ${model} error:`, errText);
      } catch (e) {
        lastError = `${model}: ${e.message}`;
      }
    }

    return res.status(500).json({ error: "Could not generate story", debug: lastError });
  } catch (error) {
    console.error("Story generation error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
