// Tests for v6.7.17 encouragement renderer.
import { renderEncouragement, encouragementTemplates } from "../../src/portfolio/encouragementTemplates.js";

let pass = 0, fail = 0;
const log = (n, ok) => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", n); };

// ── Basic rendering ────────────────────────────────────────────────
log("returns a string for known situation",
  typeof renderEncouragement("primary", "profileIntro", { name: "Anton", questCount: 5 }) === "string");

log("returns empty string for unknown ageGroup-situation",
  renderEncouragement("nonsense", "profileIntro", {}) === "");

log("returns empty string for unknown situation",
  renderEncouragement("primary", "nonsense", {}) === "");

// ── Placeholder filling ────────────────────────────────────────────
const filled = renderEncouragement("primary", "profileIntro", { name: "Anton", questCount: 5 });
log("placeholders are filled with vars", filled.includes("Anton"));

const allFilled = renderEncouragement("intermediate", "subHasQuests", { name: "Anton", subName: "Critical Thinking" });
log("subName placeholder fills correctly", allFilled.includes("Critical Thinking"));

// ── Fallback to next variant when placeholders missing ─────────────
// "primary.profileIntro" has two variants:
//   1: "Hi {name}! Look at..."        — needs name
//   2: "Welcome back, {name}. ... {questCount} adventures" — needs both
// With only name available, variant 1 should fire and variant 2 should be skipped.
const onlyName = renderEncouragement("primary", "profileIntro", { name: "Anton" });
log("variant 1 fires when only name is available", onlyName.startsWith("Hi Anton"));
log("variant 1 doesn't contain unfilled placeholders", !onlyName.includes("{"));

// ── Returns empty when no variant can be filled ─────────────────────
const noName = renderEncouragement("primary", "profileIntro", {});
log("returns empty when no variant can be filled", noName === "");

// ── ageGroup fallback to primary ────────────────────────────────────
// If someone passes an unknown ageGroup, we default to primary
const fallbackTest = renderEncouragement("preschool", "profileIntro", { name: "Anton" });
log("falls back to primary for unknown ageGroup", fallbackTest.includes("Anton"));

// ── Empty string treated as missing placeholder ─────────────────────
const emptyName = renderEncouragement("primary", "profileIntro", { name: "", questCount: 5 });
log("empty string for required placeholder skips variant", emptyName === "");

// ── Null treated as missing placeholder ─────────────────────────────
const nullName = renderEncouragement("primary", "profileIntro", { name: null });
log("null for required placeholder skips variant", nullName === "");

// ── Templates exist for all three ages and key situations ───────────
const ages = ["early", "primary", "intermediate"];
const situations = ["profileIntro", "subHasQuests", "subNoQuests", "subRecentlyAdvanced", "profileSummary"];
for (const age of ages) {
  for (const sit of situations) {
    log(`${age}.${sit} exists`,
      encouragementTemplates[age]?.[sit] !== undefined);
  }
}

// ── Word budget compliance ──────────────────────────────────────────
function wordCount(s) { return s.split(/\s+/).filter(Boolean).length; }
const budgets = { early: 12, primary: 25, intermediate: 60 };
for (const age of ages) {
  for (const sit of situations) {
    const templates = encouragementTemplates[age]?.[sit];
    const arr = Array.isArray(templates) ? templates : (templates ? [templates] : []);
    for (let i = 0; i < arr.length; i++) {
      // Count words in the raw template (placeholders count as 1 word)
      const wc = wordCount(arr[i]);
      log(`${age}.${sit}[${i}] within budget (${wc} ≤ ${budgets[age]} words)`,
        wc <= budgets[age]);
    }
  }
}

// ── No banned phrases (heuristic for "too gushing") ────────────────
const banned = ["AMAZING", "BRILLIANT", "INCREDIBLE", "SO good", "SUPER"];
for (const age of ages) {
  for (const sit of situations) {
    const templates = encouragementTemplates[age]?.[sit];
    const arr = Array.isArray(templates) ? templates : (templates ? [templates] : []);
    for (let i = 0; i < arr.length; i++) {
      for (const phrase of banned) {
        log(`${age}.${sit}[${i}] avoids "${phrase}"`,
          !arr[i].includes(phrase));
      }
    }
  }
}

// ── No identity labels (reviewer's #2 critique) ─────────────────────
// Templates must not tell the child WHO THEY ARE. Even positive identity
// labels can trap a child. Use behaviour, not identity.
// Example BAD: "You're someone who likes Critical Thinking"
// Example GOOD: "You spent time with Critical Thinking"
const identityPatterns = [
  /you'?re someone/i,
  /you are someone/i,
  /you'?re a /i,         // "you're a thinker", "you're a kind person", etc.
];
for (const age of ages) {
  for (const sit of situations) {
    const templates = encouragementTemplates[age]?.[sit];
    const arr = Array.isArray(templates) ? templates : (templates ? [templates] : []);
    for (let i = 0; i < arr.length; i++) {
      for (const pat of identityPatterns) {
        log(`${age}.${sit}[${i}] avoids identity label /${pat.source}/`,
          !pat.test(arr[i]));
      }
    }
  }
}

// ── No external-approval framing (reviewer's #3 critique) ───────────
// "{avatarName} is proud of you" creates dependence on praise from the
// system. Replace with neutral observation: "{avatarName} noticed your effort"
const externalApprovalPatterns = [
  /\{avatarName\} is proud/i,
  /\{avatarName\} loves/i,
  /\{avatarName\} thinks you/i,
  /makes \{avatarName\} happy/i,
];
for (const age of ages) {
  for (const sit of situations) {
    const templates = encouragementTemplates[age]?.[sit];
    const arr = Array.isArray(templates) ? templates : (templates ? [templates] : []);
    for (let i = 0; i < arr.length; i++) {
      for (const pat of externalApprovalPatterns) {
        log(`${age}.${sit}[${i}] avoids external-approval framing /${pat.source}/`,
          !pat.test(arr[i]));
      }
    }
  }
}

// ── No generic applause (reviewer's #1 critique) ────────────────────
// Phrases like "great job", "keep going!", "wow!" feel warm but don't
// help the child notice anything specific.
const genericApplausePatterns = [
  /great job/i,
  /keep going!/i,        // with exclamation — bland cheerleader
  /^wow[!.]?\s/i,        // starts with "Wow!"
  /you'?re growing!/i,
  /you'?re doing great/i,
];
for (const age of ages) {
  for (const sit of situations) {
    const templates = encouragementTemplates[age]?.[sit];
    const arr = Array.isArray(templates) ? templates : (templates ? [templates] : []);
    for (let i = 0; i < arr.length; i++) {
      for (const pat of genericApplausePatterns) {
        log(`${age}.${sit}[${i}] avoids generic applause /${pat.source}/`,
          !pat.test(arr[i]));
      }
    }
  }
}

// ── No multi-exclamation marks ──────────────────────────────────────
for (const age of ages) {
  for (const sit of situations) {
    const templates = encouragementTemplates[age]?.[sit];
    const arr = Array.isArray(templates) ? templates : (templates ? [templates] : []);
    for (let i = 0; i < arr.length; i++) {
      log(`${age}.${sit}[${i}] uses at most one !`,
        (arr[i].match(/!/g) || []).length <= 1);
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
