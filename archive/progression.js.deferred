// ═══════════════════════════════════════════════════════════════════
// Evidence-Based Progression Engine v3
//
// Replaces the linear XP-bar model. Tracks EVIDENCE OF DEMONSTRATION
// across contexts and recognises patterns over time.
// ═══════════════════════════════════════════════════════════════════

export const RECOGNITION_TYPES = {
  FIRST_DEMONSTRATION: { id: "first_demo", title: "First Steps", desc: "You showed this for the first time!", emoji: "🌱", tier: 1 },
  CROSS_CONTEXT:       { id: "cross_context", title: "Growing Roots", desc: "You've shown this in different ways now", emoji: "🌿", tier: 2, threshold: 3 },
  CONSISTENT:          { id: "consistent", title: "Steady Growth", desc: "This is becoming a real strength", emoji: "🌳", tier: 2, threshold: 5 },
  PROFILE_EMERGENCE:   { id: "profile_emerge", title: "New Heights", desc: "You're consistently showing a new level", emoji: "⭐", tier: 3, threshold: 4 },
  STRETCH_MOMENT:      { id: "stretch", title: "Brave Explorer", desc: "You tried something beyond your comfort zone!", emoji: "🚀", tier: 1 },
  GROWTH_CONNECTION:   { id: "connection", title: "Roots Connect", desc: "Growth in one area is helping another", emoji: "🔗", tier: 2 },
  DEEPENING:           { id: "deepening", title: "Deep Roots", desc: "Getting even stronger at a strength", emoji: "💎", tier: 2 },
  MENTOR_READY:        { id: "mentor", title: "Guide Light", desc: "You could help someone else grow here", emoji: "🌟", tier: 4, threshold: 8 },
};

export const REWARD_TIERS = {
  1: { name: "Sensory Celebration", features: ["confetti", "particles", "avatar_bounce", "emoji_burst"] },
  2: { name: "Story & Collection",  features: ["growth_gem", "constellation_star", "journal_prompt"] },
  3: { name: "Recognition",         features: ["certificate", "portfolio_entry", "parent_share", "badge"] },
  4: { name: "Mentorship & Legacy", features: ["quest_creator", "portfolio_export", "mentor_badge"] },
};

export const QUEST_CONTEXTS = [
  { id: "solo",        label: "On my own",        emoji: "🧘" },
  { id: "with_family", label: "With family",      emoji: "🏠" },
  { id: "with_peers",  label: "With friends",     emoji: "👫" },
  { id: "classroom",   label: "At school",        emoji: "🏫" },
  { id: "community",   label: "In my community",  emoji: "🌍" },
];

export const REFLECTION_DEPTHS = [
  { id: "surface",   label: "I did it",             emoji: "👍", hint: "That's a start!" },
  { id: "emerging",  label: "I noticed something",  emoji: "👀", hint: "What did you notice?" },
  { id: "thoughtful",label: "I learned something",  emoji: "💡", hint: "What did you learn?" },
  { id: "deep",      label: "It changed how I think",emoji: "🌊", hint: "How is your thinking different now?" },
];

// ── Evidence ───────────────────────────────────────────────────────

export function createEvidence({ questId, questTitle, subCompetency, demonstratedProfile, context, reflectionText, reflectionDepth, selfAssessedProfile, crossCompetencies }) {
  return {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString("en-CA"),
    questId, questTitle, subCompetency, demonstratedProfile,
    context: context || "solo",
    reflectionText: reflectionText || "",
    reflectionDepth: reflectionDepth || "surface",
    selfAssessedProfile,
    crossCompetencies: crossCompetencies || [],
  };
}

// ── Pattern Recognition ────────────────────────────────────────────

export function getEstablishedProfile(evidence) {
  if (evidence.length === 0) return 1;
  const now = Date.now();
  const weighted = {};
  evidence.forEach(e => {
    const age = (now - new Date(e.timestamp).getTime()) / (1000*60*60*24);
    const w = Math.max(0.3, 1 - age / 90);
    const p = e.demonstratedProfile;
    weighted[p] = (weighted[p] || 0) + w;
  });
  let established = 1;
  for (let p = 6; p >= 1; p--) {
    if ((weighted[p] || 0) >= 2.0) { established = p; break; }
  }
  return established;
}

export function detectRecognitions(subKey, allEvidence, previousRecognitions) {
  const evidence = allEvidence.filter(e => e.subCompetency === subKey);
  const prev = previousRecognitions.filter(r => r.subCompetency === subKey);
  const prevIds = new Set(prev.map(r => `${r.type}_${r.profileLevel || ""}`));
  const recognitions = [];
  if (evidence.length === 0) return recognitions;

  const latest = evidence[evidence.length - 1];
  const profileLevelsShown = new Set(evidence.map(e => e.demonstratedProfile));
  const contextsByProfile = {};
  const countByProfile = {};
  evidence.forEach(e => {
    if (!contextsByProfile[e.demonstratedProfile]) contextsByProfile[e.demonstratedProfile] = new Set();
    contextsByProfile[e.demonstratedProfile].add(e.context);
    countByProfile[e.demonstratedProfile] = (countByProfile[e.demonstratedProfile] || 0) + 1;
  });

  // FIRST_DEMONSTRATION
  for (const level of profileLevelsShown) {
    if (!prevIds.has(`first_demo_${level}`)) {
      const first = evidence.find(e => e.demonstratedProfile === level);
      if (first === latest) recognitions.push({ type:"first_demo", profileLevel:level, ...RECOGNITION_TYPES.FIRST_DEMONSTRATION });
    }
  }

  // CROSS_CONTEXT
  for (const [p, ctx] of Object.entries(contextsByProfile)) {
    if (ctx.size >= 3 && !prevIds.has(`cross_context_${p}`))
      recognitions.push({ type:"cross_context", profileLevel:parseInt(p), contextCount:ctx.size, ...RECOGNITION_TYPES.CROSS_CONTEXT });
  }

  // CONSISTENT
  for (const [p, count] of Object.entries(countByProfile)) {
    if (count >= 5 && !prevIds.has(`consistent_${p}`))
      recognitions.push({ type:"consistent", profileLevel:parseInt(p), evidenceCount:count, ...RECOGNITION_TYPES.CONSISTENT });
  }

  // PROFILE_EMERGENCE (certificate-eligible)
  for (const [p, count] of Object.entries(countByProfile)) {
    const ctx = contextsByProfile[p] || new Set();
    if (count >= 4 && ctx.size >= 2 && !prevIds.has(`profile_emerge_${p}`))
      recognitions.push({ type:"profile_emerge", profileLevel:parseInt(p), evidenceCount:count, contextCount:ctx.size, certificateEligible:true, ...RECOGNITION_TYPES.PROFILE_EMERGENCE });
  }

  // STRETCH_MOMENT
  const established = getEstablishedProfile(evidence);
  if (latest.demonstratedProfile > established && !prevIds.has(`stretch_${latest.demonstratedProfile}`))
    recognitions.push({ type:"stretch", profileLevel:latest.demonstratedProfile, establishedLevel:established, ...RECOGNITION_TYPES.STRETCH_MOMENT });

  // DEEPENING
  if (countByProfile[established] >= 8 && !prevIds.has(`deepening_${established}`))
    recognitions.push({ type:"deepening", profileLevel:established, ...RECOGNITION_TYPES.DEEPENING });

  // MENTOR_READY
  if (established >= 4) {
    const highCount = evidence.filter(e => e.demonstratedProfile >= 4).length;
    if (highCount >= 8 && !prevIds.has(`mentor_${established}`))
      recognitions.push({ type:"mentor", profileLevel:established, ...RECOGNITION_TYPES.MENTOR_READY });
  }

  return recognitions.map(r => ({ ...r, subCompetency:subKey, timestamp:new Date().toISOString(), rewardTier:r.tier }));
}

// ── Adaptive Quest Suggestions ─────────────────────────────────────

export function suggestQuests(allQuests, allEvidence, competencies) {
  const established = {};
  Object.values(competencies).forEach(comp => {
    Object.keys(comp.subCompetencies).forEach(subKey => {
      const subEv = allEvidence.filter(e => e.subCompetency === subKey);
      established[subKey] = getEstablishedProfile(subEv);
    });
  });

  const suggestions = [];
  const recentIds = new Set(allEvidence.slice(-10).map(e => e.questId));

  Object.values(allQuests).flat().forEach(quest => {
    if (recentIds.has(quest.id)) return;
    const est = established[quest.sub] || 1;
    let priority = 0, reason = "";

    if (quest.profile === est || quest.profile === est + 1) { priority += 10; reason = "Right in your growth zone"; }
    else if (quest.profile === est + 2) { priority += 5; reason = "A stretch challenge"; }

    if (quest.alsoTouches) {
      const weakest = quest.alsoTouches.reduce((m, t) => Math.min(m, established[t] || 1), 6);
      if (weakest < est - 1) { priority += 7; reason = reason || "Connect your growing areas"; }
    }

    const recentSub = allEvidence.slice(-20).filter(e => e.subCompetency === quest.sub).length;
    if (recentSub < 2) { priority += 4; reason = reason || "Time to revisit this area"; }

    if (priority > 0) suggestions.push({ ...quest, priority, reason });
  });

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

// ── Growth Summary for Certificates ────────────────────────────────

export function generateGrowthSummary(subKey, allEvidence) {
  const evidence = allEvidence.filter(e => e.subCompetency === subKey);
  if (evidence.length === 0) return null;
  return {
    subCompetency: subKey,
    establishedProfile: getEstablishedProfile(evidence),
    evidenceCount: evidence.length,
    contexts: [...new Set(evidence.map(e => e.context))],
    questTitles: [...new Set(evidence.map(e => e.questTitle))],
    dateRange: { first: evidence[0]?.date, last: evidence[evidence.length - 1]?.date },
    reflections: evidence.filter(e => e.reflectionText && e.reflectionDepth !== "surface").map(e => e.reflectionText).slice(-3),
  };
}

export function calculateStreak(currentStreak, lastQuestDate) {
  const today = new Date().toDateString();
  if (lastQuestDate === today) return currentStreak;
  if (lastQuestDate === new Date(Date.now() - 86400000).toDateString()) return currentStreak + 1;
  return 1;
}
