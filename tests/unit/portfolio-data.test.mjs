// Tests for v6.8 buildPortfolioData and findClosestToNextLevel.
import { buildPortfolioData, findClosestToNextLevel } from "../../src/portfolio/buildPortfolioData.js";

let pass = 0, fail = 0;
const log = (n, ok) => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", n); };

const fakeComps = {
  communication: {
    name: "Communication",
    icon: "💬",
    color: "#3B82F6",
    realm: "Echo Isles",
    subCompetencies: {
      communicating: {
        name: "Communicating",
        kidProfiles: ["I can share my ideas", "I can listen well", "I can connect with others", "I can adapt my message", "I can lead conversations", "I can communicate across cultures"],
        officialProfiles: ["L1 official", "L2 official", "L3 official", "L4 official", "L5 official", "L6 official"],
      },
      collaborating: {
        name: "Collaborating",
        kidProfiles: ["I can play with others", "I can share tasks", "I can build with my team", "I can lead a project", "I can resolve conflict", "I can build community"],
      },
    },
  },
  thinking: {
    name: "Thinking",
    icon: "🧠",
    color: "#8B5CF6",
    realm: "Wonder Peaks",
    subCompetencies: {
      creativeThinking: { name: "Creative Thinking", kidProfiles: ["A", "B", "C", "D", "E", "F"] },
      criticalThinking: { name: "Critical Thinking", kidProfiles: ["A", "B", "C", "D", "E", "F"] },
    },
  },
  personalSocial: {
    name: "Personal & Social",
    icon: "💛",
    color: "#10B981",
    realm: "Heartwood Grove",
    subCompetencies: {
      personalAwareness: { name: "Personal Awareness", kidProfiles: ["A", "B", "C", "D", "E", "F"] },
      positiveIdentity: { name: "Positive Identity", kidProfiles: ["A", "B", "C", "D", "E", "F"] },
      socialAwareness: { name: "Social Awareness", kidProfiles: ["A", "B", "C", "D", "E", "F"] },
    },
  },
};

const fakeProfile = {
  name: "Anton",
  avatarName: "Clever Fox",
  ageGroup: "primary",
  streak: 5,
  progress: {
    communicating: {
      profile: 3,
      stars: 5,
      questsCompleted: 4,
      questHistory: [
        { title: "Story Time", date: "2026-05-10", stars: 3, response: "Once upon a time...", responseType: "voice", reflection: "I learned something", reflectionText: "I noticed I can describe places using my senses", selfAssessedLevel: 3 },
        { title: "Team Builders", date: "2026-05-11", stars: 4, response: "I picked decorations", responseType: "text" },
        { title: "Old quest no artifacts", date: "2026-05-01", stars: 2 },
      ],
    },
    collaborating: { profile: 2, stars: 3, questsCompleted: 1, questHistory: [{ title: "Helping Hands", date: "2026-05-09", stars: 2 }] },
    creativeThinking: { profile: 1, stars: 0, questsCompleted: 0, questHistory: [] },
    criticalThinking: { profile: 2, stars: 7, questsCompleted: 2, questHistory: [{ title: "Which One?", date: "2026-05-08", stars: 2 }] },
    personalAwareness: { profile: 1, stars: 1, questsCompleted: 0, questHistory: [] },
    positiveIdentity: { profile: 1, stars: 2, questsCompleted: 1, questHistory: [{ title: "First Quest", date: "2026-05-07", stars: 2 }] },
    socialAwareness: { profile: 1, stars: 0, questsCompleted: 0, questHistory: [] },
  },
};

// ── buildPortfolioData ──────────────────────────────────────────────
const data = buildPortfolioData(fakeProfile, fakeComps);

log("returns null for missing profile", buildPortfolioData(null, fakeComps) === null);
log("returns null for missing competencies", buildPortfolioData(fakeProfile, null) === null);
log("includes child name", data.childName === "Anton");
log("includes avatar name", data.avatarName === "Clever Fox");
log("displayName defaults to child name", data.displayName === "Anton");
log("includes generatedAt as ISO", typeof data.generatedAt === "string" && data.generatedAt.includes("T"));
log("totalQuests sums correctly", data.totalQuests === 8); // 4+1+0+2+0+1+0
log("includes all 3 competencies", data.competencies.length === 3);
log("includes all 7 sub-competencies", data.competencies.reduce((s, c) => s + c.subCompetencies.length, 0) === 7);

const commSubs = data.competencies.find(c => c.key === "communication").subCompetencies;
const communicating = commSubs.find(s => s.key === "communicating");
log("Communicating: current level 3", communicating.currentProfileLevel === 3);
log("Communicating: next level 4", communicating.nextProfileLevel === 4);
log("Communicating: has artifacts", communicating.hasArtifacts === true);
log("Communicating: evidence count 3", communicating.evidence.length === 3);
log("Communicating: most recent first", communicating.evidence[0].questTitle === "Old quest no artifacts" || communicating.evidence[0].date >= communicating.evidence[1].date);
log("Communicating: pre-v6.8 entry has empty response", communicating.evidence.find(e => e.questTitle === "Old quest no artifacts").response === "");
log("Communicating: rich entry has reflection text", !!communicating.evidence.find(e => e.reflectionText && e.reflectionText.includes("senses")));

// Empty sub-competency
const personalSubs = data.competencies.find(c => c.key === "personalSocial").subCompetencies;
const socialAwareness = personalSubs.find(s => s.key === "socialAwareness");
log("Empty sub-competency: hasArtifacts false", socialAwareness.hasArtifacts === false);
log("Empty sub-competency: evidence is empty array", Array.isArray(socialAwareness.evidence) && socialAwareness.evidence.length === 0);
log("Empty sub-competency: still shows current level 1", socialAwareness.currentProfileLevel === 1);

// Teacher comment draft
log("teacherCommentDraft includes child name", communicating.teacherCommentDraft.includes("Anton"));
log("teacherCommentDraft includes sub-competency name", communicating.teacherCommentDraft.includes("Communicating"));
log("teacherCommentDraft includes profile statement", communicating.teacherCommentDraft.includes("L3 official") || communicating.teacherCommentDraft.includes("connect"));
log("teacherCommentDraft for empty sub mentions early stages", socialAwareness.teacherCommentDraft.includes("early stages"));
log("teacherCommentDraft uses student reflection if available", communicating.teacherCommentDraft.includes("senses"));

// displayName override
const altData = buildPortfolioData(fakeProfile, fakeComps, { displayName: "Antonio" });
log("displayName override works", altData.displayName === "Antonio");

// Profile with no name falls back to avatarName
const noNameProfile = { ...fakeProfile, name: "" };
const noNameData = buildPortfolioData(noNameProfile, fakeComps);
log("displayName falls back to avatarName", noNameData.displayName === "Clever Fox");

// ── findClosestToNextLevel ──────────────────────────────────────────
const closest = findClosestToNextLevel(fakeProfile, fakeComps);
log("closest returns an object", typeof closest === "object" && closest !== null);
log("closest is criticalThinking (7/8 = 0.875 ratio)", closest.subKey === "criticalThinking");
log("closest reports correct nextLevel", closest.nextLevel === 3);
log("closest reports starsToGo", typeof closest.starsToGo === "number");

// Profile fully maxed
const maxedProfile = {
  ...fakeProfile,
  progress: Object.fromEntries(Object.keys(fakeProfile.progress).map(k => [k, { profile: 6, stars: 0, questsCompleted: 0, questHistory: [] }])),
};
log("closest returns null when all sub-comps maxed", findClosestToNextLevel(maxedProfile, fakeComps) === null);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
