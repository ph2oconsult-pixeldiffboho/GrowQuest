// Tests for the v6.7.1 "play once per day" branch in useAutoNarrate.
//
// IMPORTANT: this test replicates the decision branch from
// src/AccessibilityPanel.jsx → useAutoNarrate. It does NOT import the hook
// directly because hooks need a React tree to run. If the hook's logic
// changes, this test will silently pass while the real behaviour breaks.
// The Playwright e2e test in tests/e2e/ is the source of truth for
// end-to-end "is the welcome-back narration playing exactly once per day".
//
// What this catches: the date-comparison and key-namespacing logic for the
// localStorage memory mechanism. What it doesn't catch: changes to the
// surrounding React code that gates whether the branch is reached at all.

const memory = new Map(); // stand-in for localStorage

function localStorageGet(k) { return memory.has(k) ? memory.get(k) : null; }
function localStorageSet(k, v) { memory.set(k, v); }

// Replicate the decision branch from useAutoNarrate
function shouldNarrate({ enabled, text, memoryKey, today }) {
  if (!enabled || !text) return { play: false, reason: "disabled or empty" };
  if (memoryKey) {
    const last = localStorageGet(`gq_narrate_last:${memoryKey}`);
    if (last === today) return { play: false, reason: "already narrated today" };
    localStorageSet(`gq_narrate_last:${memoryKey}`, today);
  }
  return { play: true, reason: "first time today" };
}

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// Day 1, morning — should play
let r = shouldNarrate({ enabled: true, text: "Welcome", memoryKey: "dashboard-welcome", today: "2026-05-19" });
log("Day 1 first open → plays", r.play === true);

// Day 1, later (mid-day dashboard return) — should NOT play
r = shouldNarrate({ enabled: true, text: "Welcome", memoryKey: "dashboard-welcome", today: "2026-05-19" });
log("Day 1 dashboard return → silent", r.play === false);

// Day 1, even later — still silent
r = shouldNarrate({ enabled: true, text: "Welcome", memoryKey: "dashboard-welcome", today: "2026-05-19" });
log("Day 1 third visit → silent", r.play === false);

// Day 2, morning — plays again
r = shouldNarrate({ enabled: true, text: "Welcome", memoryKey: "dashboard-welcome", today: "2026-05-20" });
log("Day 2 first open → plays", r.play === true);

// Day 2, return — silent
r = shouldNarrate({ enabled: true, text: "Welcome", memoryKey: "dashboard-welcome", today: "2026-05-20" });
log("Day 2 return → silent", r.play === false);

// No memory key → always plays (back-compat for callers that don't opt in)
r = shouldNarrate({ enabled: true, text: "hi", today: "2026-05-19" });
log("no memoryKey → plays (back-compat)", r.play === true);

// Disabled → never plays
r = shouldNarrate({ enabled: false, text: "Welcome", memoryKey: "x", today: "2026-05-19" });
log("disabled → silent", r.play === false);

// Empty text → never plays
r = shouldNarrate({ enabled: true, text: "", memoryKey: "x", today: "2026-05-19" });
log("empty text → silent", r.play === false);

// Different memory key → independent state
memory.clear();
r = shouldNarrate({ enabled: true, text: "a", memoryKey: "key-A", today: "2026-05-19" });
log("key-A plays first time", r.play === true);
r = shouldNarrate({ enabled: true, text: "b", memoryKey: "key-B", today: "2026-05-19" });
log("key-B also plays first time (independent)", r.play === true);
r = shouldNarrate({ enabled: true, text: "a", memoryKey: "key-A", today: "2026-05-19" });
log("key-A silent on return", r.play === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
