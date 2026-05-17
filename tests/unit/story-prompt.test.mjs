// Verifies story.js builds the right prompt for chapter 1 (cold start) vs
// continuation chapters, and that the v6.7.1 fixes (drop "DIFFERENT" rule,
// add continuity guidance, trim to last 3 paragraphs) are in place.

import { buildPrompt } from "../../api/story.js";

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// Chapter 1 — cold start, no previous paragraphs
const ch1 = buildPrompt({
  childName: "Sam", companionName: "Hoot", companionType: "owl",
  questTitle: "Story Spark", questResponse: "I told my dog about my day",
  competency: "Communication", subCompetency: "Communicating",
  realm: "Echo Isles", ageGroup: "primary", chapterNumber: 1,
  previousParagraphs: []
});
log("Chapter 1 contains 'This is Chapter 1'", ch1.includes("This is Chapter 1"));
log("Chapter 1 does NOT include 'story so far'", !ch1.includes("story so far"));
log("Chapter 1 does NOT include 'continue naturally'", !ch1.includes("continue naturally"));
log("Chapter 1 contains realm description", ch1.includes("magical archipelago"));
log("Chapter 1 includes the quest response", ch1.includes("I told my dog about my day"));
log("Chapter 1 dropped the harmful 'every paragraph must be DIFFERENT'", !ch1.includes("must be DIFFERENT"));
log("Chapter 1 dropped 'End with a hint'", !ch1.includes("hint of what might come next"));

// Chapter 3 — has 2 previous paragraphs
const ch3 = buildPrompt({
  childName: "Sam", companionName: "Hoot", companionType: "owl",
  questTitle: "Detective Listener", questResponse: "I asked my brother what was wrong",
  competency: "Communication", subCompetency: "Communicating",
  realm: "Echo Isles", ageGroup: "primary", chapterNumber: 3,
  previousParagraphs: [
    "Sam and Hoot crossed the singing footbridge into Echo Isles, where every word they spoke turned into a glowing bubble.",
    "By a coral reef, they met a tiny seahorse who had lost her song. Sam listened carefully and helped her find the melody hidden in her heart."
  ]
});
log("Chapter 3 does NOT contain 'This is Chapter 1'", !ch3.includes("This is Chapter 1"));
log("Chapter 3 contains 'mid-adventure'", ch3.includes("mid-adventure"));
log("Chapter 3 contains 'story so far'", ch3.includes("story so far"));
log("Chapter 3 includes prior paragraphs verbatim", ch3.includes("singing footbridge") && ch3.includes("seahorse"));
log("Chapter 3 contains 'SAME story, not a fresh start'", ch3.includes("SAME story"));
log("Chapter 3 keeps the age-appropriate language note", ch3.includes("8-12 word sentences"));

// Chapter 5 — 4 previous, but slice(-3) should trim
const ch5 = buildPrompt({
  childName: "Sam", companionName: "Hoot", companionType: "owl",
  questTitle: "Big Picture", questResponse: "I noticed the pattern",
  competency: "Thinking", subCompetency: "Critical & Reflective Thinking",
  realm: "Wonder Peaks", ageGroup: "intermediate", chapterNumber: 5,
  previousParagraphs: ["P1 oldest", "P2", "P3", "P4 latest"]
});
log("Chapter 5 includes most recent paragraph (P4)", ch5.includes("P4 latest"));
log("Chapter 5 trims oldest paragraph (P1)", !ch5.includes("P1 oldest"));
log("Chapter 5 keeps last 3 (P2, P3, P4)", ch5.includes("P2") && ch5.includes("P3") && ch5.includes("P4 latest"));

// Age-appropriate scaling
const early = buildPrompt({
  childName: "Mia", companionName: "Berry", companionType: "bear", questTitle: "x",
  competency: "Communication", subCompetency: "Communicating",
  realm: "Heartwood Grove", ageGroup: "early", chapterNumber: 1,
  previousParagraphs: []
});
log("Early-years prompt includes short-sentence note", early.includes("5-8 words"));
log("Intermediate prompt includes 'richer vocabulary'", ch5.includes("richer vocabulary"));

// No quest response edge case
const noResp = buildPrompt({
  childName: "Sam", companionName: "Hoot", companionType: "owl",
  questTitle: "Quick Quest", questResponse: "",
  competency: "Communication", subCompetency: "Communicating",
  realm: "Echo Isles", ageGroup: "primary", chapterNumber: 1,
  previousParagraphs: []
});
log("No quest response → no 'Here is what they did' line", !noResp.includes("Here is what they did"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
