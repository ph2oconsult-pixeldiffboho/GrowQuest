// ═══════════════════════════════════════════════════════════════════════════
// buildPortfolioData — pure function that turns a profile into portfolio data
//
// Returns a structured object covering ALL 7 sub-competencies in the BC
// framework, even if the child has no artifacts for some. Empty sub-
// competencies are flagged as "not yet explored" so the portfolio shows
// growth opportunities rather than gaps.
//
// Pure function — no DOM, no localStorage, no side effects. Easy to unit test.
//
// Shape of returned object:
// {
//   childName: string,
//   avatarName: string,
//   displayName: string,          // resolved name for the portfolio title
//   generatedAt: ISO date string,
//   ageGroup: 'early' | 'primary' | 'intermediate',
//   totalQuests: number,
//   streak: number,
//   competencies: [
//     {
//       key: 'communication' | 'thinking' | 'personalSocial',
//       name: 'Communication' | etc,
//       icon: '💬' | etc,
//       color: '#xxx',
//       realm: 'Echo Isles' | etc,
//       subCompetencies: [
//         {
//           key: 'communicating' | etc,
//           name: 'Communicating' | etc,
//           currentProfileLevel: 1-6,
//           currentProfileStatement: string,
//           nextProfileLevel: 2-6 | null,
//           nextProfileStatement: string | null,
//           questsCompleted: number,
//           hasArtifacts: boolean,
//           evidence: [
//             {
//               questTitle: string,
//               date: string,
//               stars: number,
//               response: string,
//               responseType: 'text' | 'voice' | 'emoji' | 'drawing',
//               reflection: string | null,
//               reflectionText: string | null,
//               selfAssessedLevel: number | null,
//             }, ...
//           ],
//           teacherCommentDraft: string,    // pre-built report-card-comment template
//         }, ...
//       ]
//     }, ...
//   ]
// }
// ═══════════════════════════════════════════════════════════════════════════

export function buildPortfolioData(profile, competencies, options = {}) {
  if (!profile || !competencies) return null;

  const displayName =
    options.displayName ||
    profile.portfolioName ||
    profile.name ||
    profile.avatarName ||
    "My";

  const totalQuests = Object.values(profile.progress || {})
    .reduce((s, p) => s + (p.questsCompleted || 0), 0);

  const competencyArray = Object.entries(competencies).map(([compKey, comp]) => {
    const subs = Object.entries(comp.subCompetencies).map(([subKey, sub]) => {
      const subProgress = profile.progress?.[subKey] || {
        profile: 1,
        stars: 0,
        questsCompleted: 0,
        questHistory: [],
      };

      const currentLevel = subProgress.profile || 1;
      const nextLevel = currentLevel < 6 ? currentLevel + 1 : null;

      // Evidence is the quest history entries that have actual response content.
      // Older entries (pre-v6.8) won't have `response` and are kept as
      // titles-only — still valid evidence, just less rich.
      const history = subProgress.questHistory || [];
      const evidence = history
        .filter(h => h && h.title) // sanity filter
        .slice() // copy
        .reverse() // most recent first
        .map(h => ({
          questTitle: h.title,
          date: h.date || "",
          stars: h.stars || 0,
          response: h.response || "",
          responseType: h.responseType || "text",
          reflection: h.reflection || null,
          reflectionText: h.reflectionText || null,
          selfAssessedLevel: h.selfAssessedLevel || null,
        }));

      // Pre-build a teacher-comment template using available data.
      const recentTitles = evidence.slice(0, 3).map(e => e.questTitle).filter(Boolean);
      const studentReflection = evidence.find(e => e.reflectionText)?.reflectionText;
      const teacherCommentDraft = buildTeacherCommentDraft({
        childName: displayName,
        subName: sub.name,
        currentLevel,
        currentStatement: sub.officialProfiles?.[currentLevel - 1] || sub.kidProfiles?.[currentLevel - 1] || "",
        recentTitles,
        studentReflection,
      });

      return {
        key: subKey,
        name: sub.name,
        currentProfileLevel: currentLevel,
        currentProfileStatement: sub.kidProfiles?.[currentLevel - 1] || "",
        officialProfileStatement: sub.officialProfiles?.[currentLevel - 1] || null,
        nextProfileLevel: nextLevel,
        nextProfileStatement: nextLevel ? sub.kidProfiles?.[nextLevel - 1] || "" : null,
        questsCompleted: subProgress.questsCompleted || 0,
        hasArtifacts: evidence.length > 0,
        evidence,
        teacherCommentDraft,
      };
    });

    return {
      key: compKey,
      name: comp.name,
      icon: comp.icon,
      color: comp.color,
      realm: comp.realm,
      subCompetencies: subs,
    };
  });

  return {
    childName: profile.name || "",
    avatarName: profile.avatarName || "",
    avatarEvolution: options.avatarEvolution || null,
    displayName,
    generatedAt: new Date().toISOString(),
    ageGroup: profile.ageGroup || "primary",
    totalQuests,
    streak: profile.streak || 0,
    competencies: competencyArray,
  };
}

function buildTeacherCommentDraft({ childName, subName, currentLevel, currentStatement, recentTitles, studentReflection }) {
  if (recentTitles.length === 0) {
    // No quests done in this sub-competency.
    return `${childName} is in the early stages of developing ${subName}. Look for opportunities to introduce activities that target this competency.`;
  }

  const titlesStr =
    recentTitles.length === 1
      ? `"${recentTitles[0]}"`
      : recentTitles.length === 2
      ? `"${recentTitles[0]}" and "${recentTitles[1]}"`
      : recentTitles.slice(0, -1).map(t => `"${t}"`).join(", ") + `, and "${recentTitles[recentTitles.length - 1]}"`;

  let comment = `Based on ${childName}'s recent work in ${subName}, they are demonstrating Profile ${currentLevel}: "${currentStatement}" `;
  comment += `This was evidenced through activities including ${titlesStr}. `;

  if (studentReflection) {
    comment += `${childName}'s own reflection on their growth: "${studentReflection}" `;
  }

  comment += `Continued development in this area can be supported through ongoing opportunities to apply and extend these skills across contexts.`;

  return comment;
}

// Find the sub-competency closest to advancing (highest stars / threshold ratio
// among sub-competencies not yet at the max level). Used by the "Growing
// toward..." dashboard card.
export function findClosestToNextLevel(profile, competencies, starsThresh = [3, 5, 8, 12, 16, 99]) {
  if (!profile?.progress || !competencies) return null;
  let best = null;
  let bestRatio = -1;

  for (const [compKey, comp] of Object.entries(competencies)) {
    for (const [subKey, sub] of Object.entries(comp.subCompetencies)) {
      const sp = profile.progress[subKey];
      if (!sp || sp.profile >= 6) continue;
      const threshold = starsThresh[sp.profile - 1] || 12;
      const ratio = sp.stars / threshold;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = {
          compKey,
          compName: comp.name,
          compColor: comp.color,
          subKey,
          subName: sub.name,
          currentLevel: sp.profile,
          nextLevel: sp.profile + 1,
          nextStatement: sub.kidProfiles?.[sp.profile] || "",
          starsToGo: Math.max(0, threshold - sp.stars),
          progressRatio: ratio,
        };
      }
    }
  }

  return best;
}
