// Tests for the v6.7.8 VoicePicker source-switching logic. We replicate
// the decision tree as plain functions so we can verify it without a
// React DOM. The real component lives in src/VoicePicker.jsx and must
// follow the same shape.

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// ── Curated Web Speech filter (mirrors getCuratedWebSpeechVoices) ─────

const WEB_SPEECH_CURATED = [
  { token: "Samantha",                 label: "Samantha",  desc: "Warm American (Mac/iOS)" },
  { token: "Karen",                    label: "Karen",     desc: "Australian (Mac/iOS)" },
  { token: "Moira",                    label: "Moira",     desc: "Irish (Mac/iOS)" },
  { token: "Daniel",                   label: "Daniel",    desc: "British (Mac/iOS/Chrome)" },
  { token: "Google UK English Female", label: "Google UK", desc: "British (Chromebook)" },
];

function getCuratedWebSpeechVoices(allVoices) {
  const found = [];
  const seen = new Set();
  for (const c of WEB_SPEECH_CURATED) {
    if (seen.has(c.label)) continue;
    const match = allVoices.find(v => v.name.includes(c.token) && v.lang && v.lang.startsWith("en"));
    if (match) {
      found.push({ id: match.name, name: c.label, description: c.desc });
      seen.add(c.label);
    }
  }
  if (found.length === 0) {
    const fallback = allVoices.find(v => v.lang && v.lang.startsWith("en"));
    if (fallback) found.push({ id: fallback.name, name: fallback.name, description: "System voice" });
  }
  return found;
}

// 1. macOS-like voice list → returns 4 curated entries (no Google UK on Mac)
{
  const macVoices = [
    { name: "Samantha",                   lang: "en-US" },
    { name: "Karen",                      lang: "en-AU" },
    { name: "Moira",                      lang: "en-IE" },
    { name: "Daniel",                     lang: "en-GB" },
    { name: "Albert",                     lang: "en-US" },
    { name: "Alice",                      lang: "it-IT" },
    { name: "Fiona",                      lang: "en-GB" },
    { name: "Zarvox",                     lang: "en-US" },
    { name: "Whisper",                    lang: "en-US" },
    { name: "Trinoids",                   lang: "en-US" },
  ];
  const result = getCuratedWebSpeechVoices(macVoices);
  log("macOS list yields 4 curated voices", result.length === 4);
  log("Samantha is first", result[0].name === "Samantha");
  log("Daniel is included", result.some(v => v.name === "Daniel"));
  log("Zarvox is NOT included", !result.some(v => v.id === "Zarvox"));
}

// 2. Chromebook voice list → includes Google UK
{
  const chromeVoices = [
    { name: "Google US English",          lang: "en-US" },
    { name: "Google UK English Female",   lang: "en-GB" },
    { name: "Google UK English Male",     lang: "en-GB" },
    { name: "Google español",             lang: "es-ES" },
  ];
  const result = getCuratedWebSpeechVoices(chromeVoices);
  log("Chromebook list yields 1 curated voice (Google UK)", result.length === 1);
  log("Google UK label used", result[0].name === "Google UK");
}

// 3. iOS enhanced variants — match by includes()
{
  const iosVoices = [
    { name: "Samantha (Enhanced)",        lang: "en-US" },
    { name: "Karen (Enhanced)",           lang: "en-AU" },
  ];
  const result = getCuratedWebSpeechVoices(iosVoices);
  log("iOS Enhanced variants are matched", result.length === 2);
  log("Stored ID is full name including suffix", result[0].id === "Samantha (Enhanced)");
}

// 4. No curated voices found → falls back to first English voice
{
  const obscureVoices = [
    { name: "VeryRareVoice",              lang: "en-US" },
    { name: "Spanish Voice",              lang: "es-ES" },
  ];
  const result = getCuratedWebSpeechVoices(obscureVoices);
  log("Falls back to first English when none curated present", result.length === 1);
  log("Fallback uses raw name as id", result[0].id === "VeryRareVoice");
}

// 5. No English voices at all → empty result (picker shows loading state)
{
  const noEnglish = [
    { name: "Spanish Voice",              lang: "es-ES" },
    { name: "Japanese Voice",             lang: "ja-JP" },
  ];
  const result = getCuratedWebSpeechVoices(noEnglish);
  log("No English voices → empty result", result.length === 0);
}

// 6. Duplicates not added twice
{
  const dupeVoices = [
    { name: "Samantha",                   lang: "en-US" },
    { name: "Samantha (Premium)",         lang: "en-US" },
  ];
  const result = getCuratedWebSpeechVoices(dupeVoices);
  log("Each curated label appears at most once", result.filter(v => v.name === "Samantha").length === 1);
}

// ── Source decision (mirrors VoicePicker's mount-time choice) ─────────

function decideSource({ premiumEnabled, premiumVoicesFromServer }) {
  if (premiumEnabled && premiumVoicesFromServer && premiumVoicesFromServer.length > 0) {
    return "premium";
  }
  return "webspeech";
}

log("premium on + voices returned → premium source",
  decideSource({ premiumEnabled: true, premiumVoicesFromServer: [{ voice_id: "v1", name: "Rachel" }] }) === "premium");

log("premium on but server returned empty → webspeech source",
  decideSource({ premiumEnabled: true, premiumVoicesFromServer: [] }) === "webspeech");

log("premium on but server returned null → webspeech source",
  decideSource({ premiumEnabled: true, premiumVoicesFromServer: null }) === "webspeech");

log("premium off → webspeech source regardless of server",
  decideSource({ premiumEnabled: false, premiumVoicesFromServer: [{ voice_id: "v1", name: "Rachel" }] }) === "webspeech");

// ── Storage key routing ───────────────────────────────────────────────

function pickStorageKey(source) {
  return source === "premium" ? "gq_premium_voice" : "gq_voice_name";
}

log("premium source writes to gq_premium_voice", pickStorageKey("premium") === "gq_premium_voice");
log("webspeech source writes to gq_voice_name", pickStorageKey("webspeech") === "gq_voice_name");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
