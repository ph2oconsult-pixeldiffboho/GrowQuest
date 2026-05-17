// ═══════════════════════════════════════════════════════════════════════════
// encouragementTemplates.js — child-facing language for the Growth Profile.
//
// This file is intentionally separate from the React components so that a
// children's writer or teacher can review and revise the language without
// touching code.
//
// HOW THIS FILE IS STRUCTURED:
//
//   templates[ageGroup][situation] = string  OR  string[]
//
// If a value is an array, the renderer picks the first non-empty template
// for which all placeholders can be filled. This lets you write multiple
// variants and the renderer chooses gracefully.
//
// PLACEHOLDERS available in template strings:
//   {name}         — the child's display name
//   {avatarName}   — the companion avatar's name (e.g. "Clever Fox")
//   {questCount}   — total quests completed (number)
//   {subName}      — the sub-competency name (e.g. "Critical Thinking")
//   {compName}     — the parent competency name (e.g. "Thinking")
//
// LANGUAGE PRINCIPLES (revised by reviewer, May 2026):
//
// The goal is NOT "look how well the app thinks you are doing."
// The goal IS "here is something you noticed, tried, chose, practised,
// or stayed with."
//
// Use these five core patterns:
//   - NOTICING:       "You noticed..."
//   - TRYING:         "You tried..."
//   - CHOOSING:       "You chose..."
//   - STAYING WITH:   "You stayed with..."
//   - REFLECTING:     "You thought about..."
//
// AVOID:
//   - Identity labels — never "you're someone who...", even positive ones.
//     They can trap a child into thinking "what if I'm not next time?"
//     Use behaviour, not identity: "you spent time with X" not "you're a X person".
//   - External-approval framing — "{avatarName} is proud of you" creates
//     dependence on praise. Use "{avatarName} noticed your effort" instead.
//   - Assessment disguised as encouragement — "the way you've been working
//     through these suggests..." reads as the system judging them.
//   - Generic applause — "great job", "amazing", "you're growing!" feel
//     warm but say nothing the child can hold onto.
//   - Stimulation language for early years — replace with permission and
//     emotional safety ("ready when you are", "no rush").
//
// LENGTH BUDGETS by age:
//   - early (4-6):       ≤ 12 words. Shorter is better. One sentence max.
//   - primary (7-9):     ≤ 25 words. Up to two short sentences.
//   - intermediate (10-12): ≤ 60 words. Up to three sentences.
//
// SITUATIONS (the second key):
//   - profileIntro          — top-of-page hello when the child opens their profile
//   - subHasQuests          — shown on a sub-competency card with 1+ quests done
//   - subNoQuests           — shown on a sub-competency card with 0 quests done
//   - subRecentlyAdvanced   — shown when the child has moved up a level recently
//   - profileSummary        — closing line at the bottom of the profile view
// ═══════════════════════════════════════════════════════════════════════════

export const encouragementTemplates = {
  early: {
    profileIntro: [
      "Hi {name}. Ready to look?",
      "Welcome back, {name}.",
    ],
    subHasQuests: [
      "You tried this.",
      "You had a go.",
    ],
    subNoQuests: [
      "Ready when you are.",
      "A new quest is waiting.",
    ],
    subRecentlyAdvanced: [
      "You kept trying 🌱",
      "You tried a new way.",
    ],
    profileSummary: [
      "{avatarName} noticed your effort.",
      "You are growing, step by step.",
    ],
  },

  primary: {
    profileIntro: [
      "Hi {name}. Here are the quests you've explored.",
      "Welcome back, {name}. You've tried {questCount} quests so far.",
    ],
    subHasQuests: [
      "You've been practising {subName}.",
      "You showed your thinking in {subName}.",
      "You tried more than one way here.",
    ],
    subNoQuests: [
      "You haven't tried this yet. It will wait for you.",
      "This is a new area to explore when you're ready.",
    ],
    subRecentlyAdvanced: [
      "You've grown in {subName}. What helped you this time?",
      "You kept practising {subName}, and something changed.",
    ],
    profileSummary: [
      "Every quest gives you something to notice about yourself.",
      "Keep noticing how you think, try, and grow, {name}.",
    ],
  },

  intermediate: {
    profileIntro: [
      "Hi {name}. This profile shows what you've explored, practised, and noticed in GrowQuest.",
      "Welcome back, {name}. You've completed {questCount} quests. Look for patterns in how you've been thinking.",
    ],
    subHasQuests: [
      "You've spent time with {subName}. Look back and notice what changed in your thinking.",
      "You have evidence here from several quests. What does it show you about how you approach {subName}?",
    ],
    subNoQuests: [
      "You haven't explored {subName} yet. It will be here when you're ready.",
      "This area is still open. Try it when you want to stretch a different part of your thinking.",
    ],
    subRecentlyAdvanced: [
      "You've moved forward in {subName}. That growth came from the way you kept thinking through the quests.",
      "Something shifted in {subName}. Look at the evidence and see what helped.",
    ],
    profileSummary: [
      "Your profile reflects what you've practised, not who you have to be.",
      "This is a record of choices, effort, and reflection. You can keep shaping it.",
    ],
  },
};

// ── Renderer ────────────────────────────────────────────────────────
// Pure function. Pick a template, fill placeholders, return a string.
// Returns "" if no template matches — the renderer should handle that
// gracefully by omitting the encouragement element rather than showing
// a placeholder.

export function renderEncouragement(ageGroup, situation, vars = {}) {
  const ageTemplates = encouragementTemplates[ageGroup] || encouragementTemplates.primary;
  const raw = ageTemplates[situation];
  if (!raw) return "";

  const candidates = Array.isArray(raw) ? raw : [raw];

  for (const template of candidates) {
    const filled = fillPlaceholders(template, vars);
    if (filled !== null) return filled;
  }
  return "";
}

function fillPlaceholders(template, vars) {
  // Find every {key} and replace it. If any required key is missing or empty,
  // return null so the caller can try the next template variant.
  const required = [...template.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  for (const key of required) {
    if (vars[key] === undefined || vars[key] === null || vars[key] === "") {
      return null;
    }
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key]));
}
