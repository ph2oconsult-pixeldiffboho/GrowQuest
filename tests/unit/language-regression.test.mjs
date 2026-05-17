// ═══════════════════════════════════════════════════════════════════════════
// Language regression test (v6.7.22).
//
// Borrowed pattern from GrowQuest Alberta's roadtest-voice.mjs PERFORMATIVE_PHRASES list.
// Grep child-facing source files for phrases that the shared language guide
// (docs/language-guide/shared-guide.md) and BC appendix have ruled out.
//
// Catches: forgotten regressions, missed translation keys, copy-paste from
// older versions, new code added without reading the guide.
//
// DOES NOT scan:
//   - // comments — changelog entries legitimately quote old strings
//   - Adult Assessment View (src/portfolio/GrowthProfileView.jsx) — that
//     view uses BC framework progression language by design
//   - TeacherDashboard.jsx — teacher-facing
//   - generateManual.js / generateReport.js — teacher artifact generation
//   - Test fixture files — bad examples are intentional
//   - The shared guide and appendix themselves — they QUOTE the bad strings
//   - encouragementTemplates.test.mjs — already has its own dedicated tests
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let pass = 0, fail = 0;
const log = (n, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(ok ? "✓" : "✗", n, detail ? `— ${detail}` : "");
};

// ── Phrases that should not appear in child-facing source ─────────────────
// Each entry is { phrase, reason, allowedFiles (optional) }.
// phrase: regex or string to grep for
// reason: explanation shown when the test fails
// allowedFiles: array of file paths where this phrase is legitimately present
//               (e.g., the adult assessment view uses "Level N" by design)

const FORBIDDEN = [
  // ── Identity labels (shared guide §"What we move away from") ─────────
  { phrase: /you'?re someone who/i, reason: "Identity label — use 'you've been practising' or 'you spent time with' instead" },
  { phrase: /you'?re a (\w+ )?(thinker|communicator|leader|helper|listener|kid|child|person)\b/i, reason: "Identity label" },
  { phrase: /\byou are someone\b/i, reason: "Identity label" },

  // ── External-approval framing (shared guide §"The avatar's voice") ───
  { phrase: /is proud of you/i, reason: "External-approval framing — use 'noticed your effort' instead" },
  { phrase: /\bI'm so proud\b/i, reason: "External-approval framing" },
  { phrase: /makes (me|him|her|them|us) (so )?happy/i, reason: "External-approval framing" },

  // ── Generic praise / gushing (shared guide §"Words we use carefully") ─
  { phrase: /\bgreat job\b/i, reason: "Generic praise — specific observation is always stronger" },
  { phrase: /^[^A-Za-z]*Wow!/m, reason: "Generic exclamation — observation is stronger" },
  { phrase: /you'?re (so )?amazing\b/i, reason: "Generic praise" },
  { phrase: /you'?re (so )?brilliant\b/i, reason: "Generic praise" },
  { phrase: /you'?re doing (so )?well\b/i, reason: "Generic praise (evaluative)" },

  // ── Game/achievement coding (shared guide §"Levels, stars, progression") ──
  { phrase: /level (up|n unlocked)/i, reason: "Game language — child should not see this" },
  { phrase: /you'?ve levelled up/i, reason: "Game language" },
  { phrase: /you'?ve unlocked/i, reason: "Game language — use 'this is open when you're ready' instead" },
  { phrase: /you unlocked\b/i, reason: "Game language" },
  // Note: 'Unlocked' on the PROFILE-UP screen specifically was removed in v6.7.19;
  // this catches any reintroduction.

  // ── Identity-coded specifically from audit (v1.1) ─────────────────────
  { phrase: /Strength I'?ve built/i, reason: "Identity-coded — removed in v6.7.22 self-assessment audit" },
  { phrase: /Force acquise/i, reason: "Identity-coded (French) — must mirror BC's removal" },

  // ── Old self-assessment options (replaced in v6.7.22) ─────────────────
  { phrase: /Just starting!/i, reason: "Old early-years option — replaced with 'I'm just trying it' in v6.7.22" },
  { phrase: /Getting better!/i, reason: "Old early-years option — replaced with 'I'm getting the hang of it' in v6.7.22" },
  // "I can do it!" is harder to grep cleanly because "I can ..." is also
  // the legitimate BC framework statement form. Skip the regex; rely on
  // the helper-text removal to catch this.
  { phrase: /How much can you do this\?/i, reason: "Old self-assessment helper text — removed in v6.7.22" },

  // ── Old reflection/assessment language (replaced in v6.7.19 / v6.7.22) ──
  { phrase: /How am I growing\?/i, reason: "Replaced with 'Where am I now?' in v6.7.19" },
  { phrase: /Check My Growth/i, reason: "Replaced with 'Where am I now?' in v6.7.22" },
  { phrase: /Get My Stars/i, reason: "Replaced with 'Finish quest' in v6.7.19" },

  // ── Old celebration language (replaced in v6.7.19 / v6.7.20) ───────────
  { phrase: /Amazing Growth/i, reason: "Replaced with 'Quest done. Nice noticing.' in v6.7.19" },
  { phrase: /Day Streak/i, reason: "Replaced with '{N} days · came back' in v6.7.20" },
  { phrase: /Strongest Area/i, reason: "Replaced with 'Most practised' in v6.7.20" },
  { phrase: /Growth Opportunity/i, reason: "Replaced with 'Yet to explore' in v6.7.20" },

  // ── Old companion/onboarding language (replaced in v6.7.19) ────────────
  { phrase: /I'?m so excited to meet you/i, reason: "Replaced with 'Glad you're here' in v6.7.19" },
  { phrase: /Will you help me grow/i, reason: "Replaced with 'Want to look around together?' in v6.7.19" },
];

// Files to scan (child-facing surfaces only).
const SCAN_INCLUDE = [
  "src/App.jsx",
  "src/portfolio/EarlyYearsProfileView.jsx",
  "src/portfolio/PrimaryProfileView.jsx",
  "src/portfolio/IntermediateProfileView.jsx",
  "src/portfolio/ChildProfileRouter.jsx",
  "src/portfolio/encouragementTemplates.js",
  "src/data/translations.js",
];

// Files explicitly excluded even if they live under src/.
const SCAN_EXCLUDE = [
  "src/portfolio/GrowthProfileView.jsx",   // adult/teacher assessment view
  "src/TeacherDashboard.jsx",
  "src/certificates/",                      // teacher-facing PDF generation
  "src/AccessibilityPanel.jsx",             // settings UI, not child voice
  "src/ParentPreferences.jsx",              // parent settings
  "src/PremiumVoicePanel.jsx",
  "src/VoiceDiagnostics.jsx",
  "src/VoicePicker.jsx",
  "src/main.jsx",
  "src/elevenlabs.js",
];

function isExcluded(filePath) {
  return SCAN_EXCLUDE.some(ex => filePath.includes(ex));
}

function stripComments(source) {
  // Remove single-line // comments (which legitimately quote old strings
  // in changelog entries). Doesn't try to handle every edge case — just
  // the common case of `// v6.7.X — comment text with "old phrase" inside`.
  return source.replace(/^[ \t]*\/\/.*$/gm, "");
}

function readScanText(filePath) {
  const full = join(process.cwd(), filePath);
  try {
    const raw = readFileSync(full, "utf-8");
    return stripComments(raw);
  } catch (e) {
    return "";
  }
}

// ── Run scan ────────────────────────────────────────────────────────────
for (const file of SCAN_INCLUDE) {
  if (isExcluded(file)) continue;
  const text = readScanText(file);
  if (!text) {
    log(`${file} — readable`, false, "could not read");
    continue;
  }

  for (const { phrase, reason } of FORBIDDEN) {
    const isRegex = phrase instanceof RegExp;
    const found = isRegex
      ? phrase.test(text)
      : text.toLowerCase().includes(String(phrase).toLowerCase());

    log(
      `${file} avoids ${isRegex ? phrase.source : `"${phrase}"`}`,
      !found,
      found ? reason : null
    );
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
