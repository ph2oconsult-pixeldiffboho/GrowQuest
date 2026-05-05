export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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
