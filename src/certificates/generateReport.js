// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Student Learning Report Generator
//
// Generates PDF reports aligned with BC K-12 Student Reporting Policy:
// 1. Student self-reflection on Core Competencies
// 2. Descriptive feedback (strengths + areas for growth)
// 3. Evidence of competency development (quest completions)
// 4. Goal setting recommendations
//
// Designed to upload directly to MyEducationBC or print for report cards.
// ═══════════════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";

const COMP_COLORS = {
  communication:  { r: 37, g: 99, b: 235, name: "Communication" },
  thinking:       { r: 124, g: 58, b: 237, name: "Thinking" },
  personalSocial: { r: 5, g: 150, b: 105, name: "Personal & Social" },
};

const SUB_TO_COMP = {
  communicating: "communication",
  collaborating: "communication",
  creativeThinking: "thinking",
  criticalThinking: "thinking",
  positiveIdentity: "personalSocial",
  personalAwareness: "personalSocial",
  socialAwareness: "personalSocial",
};

const SUB_NAMES = {
  communicating: "Communicating",
  collaborating: "Collaborating",
  creativeThinking: "Creative Thinking",
  criticalThinking: "Critical & Reflective Thinking",
  positiveIdentity: "Positive Personal & Cultural Identity",
  personalAwareness: "Personal Awareness & Responsibility",
  socialAwareness: "Social Awareness & Responsibility",
};

const PROFILE_NAMES = ["Emerging", "Developing", "Practising", "Confident", "Extending", "Transforming"];

const PROFILE_DESCRIPTIONS = {
  communicating: [
    "Beginning to communicate in familiar settings with support.",
    "Communicating purposefully in familiar settings.",
    "Using learned communication strategies with some independence.",
    "Communicating effectively across contexts, showing awareness of audience.",
    "Evaluating and adapting communication for impact.",
    "Creating powerful, sustained communication that makes a real difference.",
  ],
  collaborating: [
    "Participating in group activities with support in familiar settings.",
    "Contributing to shared tasks in familiar contexts.",
    "Taking responsibility within group work and sharing roles.",
    "Working effectively with others toward shared goals.",
    "Leading collaborative efforts and ensuring inclusion.",
    "Bringing diverse groups together for sustained, complex projects.",
  ],
  creativeThinking: [
    "Generating ideas through play and exploration.",
    "Building on existing ideas and contributing new ones.",
    "Pursuing creative ideas about topics of personal interest.",
    "Transforming existing ideas into novel approaches.",
    "Persisting through challenges to generate truly original thinking.",
    "Sustaining creative work at a high level in areas of deep engagement.",
  ],
  criticalThinking: [
    "Exploring and investigating with curiosity.",
    "Using evidence to draw simple conclusions.",
    "Asking meaningful questions and considering alternatives.",
    "Integrating prior knowledge with new learning.",
    "Analysing information critically to determine what is most significant.",
    "Examining complex problems from multiple perspectives.",
  ],
  positiveIdentity: [
    "Identifying as a unique individual.",
    "Recognising the many aspects of self.",
    "Describing personal strengths and qualities.",
    "Expressing pride in identity and community belonging.",
    "Understanding how family, culture, and experience shape identity.",
    "Seeing how all life experiences contribute to who they are today.",
  ],
  personalAwareness: [
    "Expressing needs and emotions in familiar settings.",
    "Seeking experiences that bring satisfaction and pride.",
    "Making healthy choices that support personal wellbeing.",
    "Identifying strengths and developing strategies for challenges.",
    "Taking ownership of choices with a sense of personal significance.",
    "Self-motivating growth based on intrinsic drive.",
  ],
  socialAwareness: [
    "Noticing people and the world around them.",
    "Treating others and the environment with respect.",
    "Being thoughtful about relationships and environmental stewardship.",
    "Taking purposeful action to help others and care for nature.",
    "Advocating for community and the natural world.",
    "Initiating projects that create lasting positive impact.",
  ],
};

export function generateStudentReport({
  studentName,
  ageGroup,
  teacherName,
  className,
  reportingPeriod,
  progress,
  questHistory,
  storyExcerpts,
  avatarName,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const W = 215.9;
  const M = 15; // margins
  const CW = W - 2 * M; // content width
  let y = M;

  const ageLabel = ageGroup === "early" ? "Early Years (K-2)" : ageGroup === "primary" ? "Primary (3-5)" : "Intermediate (6-7)";

  // ── Helper Functions ──────────────────────────────────────────

  function addText(text, x, yPos, opts = {}) {
    doc.setFont("helvetica", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(opts.r || 51, opts.g || 65, opts.b || 85);
    if (opts.align) {
      doc.text(text, x, yPos, { align: opts.align });
    } else {
      doc.text(text, x, yPos);
    }
  }

  function addWrappedText(text, x, yPos, maxWidth, opts = {}) {
    doc.setFont("helvetica", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(opts.r || 51, opts.g || 65, opts.b || 85);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPos);
    return yPos + lines.length * (opts.lineHeight || 4.5);
  }

  function checkPage(needed) {
    if (y + needed > 260) {
      doc.addPage();
      y = M;
      return true;
    }
    return false;
  }

  function drawLine(x1, yPos, x2, color) {
    doc.setDrawColor(color?.r || 226, color?.g || 232, color?.b || 240);
    doc.setLineWidth(0.3);
    doc.line(x1, yPos, x2, yPos);
  }

  // ── PAGE 1: HEADER & OVERVIEW ─────────────────────────────────

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 28, "F");

  addText("GROWQUEST BC", M, 10, { size: 16, bold: true, r: 255, g: 255, b: 255 });
  addText("Core Competency Student Learning Report", M, 17, { size: 9, r: 148, g: 163, b: 184 });
  addText("Aligned with BC K-12 Student Reporting Policy", M, 23, { size: 7, r: 100, g: 116, b: 139 });

  // Report label
  addText("CONFIDENTIAL — STUDENT REPORT", W - M, 10, { size: 7, bold: true, r: 239, g: 68, b: 68, align: "right" });

  y = 35;

  // Student info box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, 30, 2, 2, "FD");

  addText("Student:", M + 4, y + 7, { size: 8, r: 100, g: 116, b: 139 });
  addText(studentName || "Student", M + 28, y + 7, { size: 11, bold: true, r: 15, g: 23, b: 42 });

  addText("Grade Level:", M + 4, y + 14, { size: 8, r: 100, g: 116, b: 139 });
  addText(ageLabel, M + 32, y + 14, { size: 9, r: 51, g: 65, b: 85 });

  addText("Teacher:", M + 90, y + 7, { size: 8, r: 100, g: 116, b: 139 });
  addText(teacherName || "Teacher", M + 110, y + 7, { size: 9, bold: true, r: 51, g: 65, b: 85 });

  addText("Class:", M + 90, y + 14, { size: 8, r: 100, g: 116, b: 139 });
  addText(className || "Class", M + 106, y + 14, { size: 9, r: 51, g: 65, b: 85 });

  addText("Reporting Period:", M + 4, y + 21, { size: 8, r: 100, g: 116, b: 139 });
  addText(reportingPeriod || "Term 1", M + 40, y + 21, { size: 9, r: 51, g: 65, b: 85 });

  addText("Date:", M + 90, y + 21, { size: 8, r: 100, g: 116, b: 139 });
  addText(new Date().toLocaleDateString("en-CA"), M + 103, y + 21, { size: 9, r: 51, g: 65, b: 85 });

  y += 37;

  // ── OVERVIEW STATISTICS ────────────────────────────────────────

  addText("COMPETENCY OVERVIEW", M, y, { size: 11, bold: true, r: 15, g: 23, b: 42 });
  y += 7;

  // Calculate stats
  const subs = Object.entries(progress || {});
  const totalQuests = subs.reduce((s, [, p]) => s + (p.questsCompleted || p.q || 0), 0);
  const avgLevel = subs.length > 0 ? (subs.reduce((s, [, p]) => s + (p.profile || p.l || 1), 0) / subs.length) : 1;

  // Find strongest and weakest
  let strongest = null, weakest = null, strongestLevel = 0, weakestLevel = 7;
  subs.forEach(([sk, p]) => {
    const level = p.profile || p.l || 1;
    if (level > strongestLevel) { strongest = sk; strongestLevel = level; }
    if (level < weakestLevel) { weakest = sk; weakestLevel = level; }
  });

  // Stats boxes
  const boxW = (CW - 8) / 3;
  const stats = [
    { label: "Quests Completed", value: String(totalQuests), color: { r: 37, g: 99, b: 235 } },
    { label: "Average Profile Level", value: avgLevel.toFixed(1), color: { r: 124, g: 58, b: 237 } },
    { label: "Strongest Area", value: SUB_NAMES[strongest] || "—", color: { r: 5, g: 150, b: 105 } },
  ];

  stats.forEach((s, i) => {
    const x = M + i * (boxW + 4);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxW, 18, 1.5, 1.5, "F");
    const valSize = s.value.length > 20 ? 7 : s.value.length > 12 ? 9 : 14;
    addText(s.value, x + boxW / 2, y + (valSize < 10 ? 9 : 8), { size: valSize, bold: true, ...s.color, align: "center" });
    addText(s.label, x + boxW / 2, y + 14, { size: 7, r: 100, g: 116, b: 139, align: "center" });
  });

  y += 25;

  // ── CORE COMPETENCY PROFILES ───────────────────────────────────

  addText("CORE COMPETENCY SELF-ASSESSMENT & EVIDENCE", M, y, { size: 11, bold: true, r: 15, g: 23, b: 42 });
  y += 3;
  y = addWrappedText(
    "As required by the BC K-12 Student Reporting Policy, the following reflects the student's self-assessment of the three Core Competencies, supported by evidence from completed quests and activities.",
    M, y + 4, CW, { size: 8, italic: true, r: 100, g: 116, b: 139 }
  );
  y += 3;

  // For each core competency area
  const compGroups = {
    communication: { subs: ["communicating", "collaborating"], ...COMP_COLORS.communication },
    thinking: { subs: ["creativeThinking", "criticalThinking"], ...COMP_COLORS.thinking },
    personalSocial: { subs: ["positiveIdentity", "personalAwareness", "socialAwareness"], ...COMP_COLORS.personalSocial },
  };

  Object.entries(compGroups).forEach(([compKey, comp]) => {
    checkPage(55);

    // Competency header bar
    doc.setFillColor(comp.r, comp.g, comp.b);
    doc.roundedRect(M, y, CW, 8, 1, 1, "F");
    addText(comp.name.toUpperCase(), M + 4, y + 5.5, { size: 9, bold: true, r: 255, g: 255, b: 255 });
    y += 11;

    // Each sub-competency
    comp.subs.forEach(sk => {
      const p = progress?.[sk] || {};
      const level = p.profile || p.l || 1;
      const profileName = PROFILE_NAMES[level - 1] || "Emerging";
      const description = PROFILE_DESCRIPTIONS[sk]?.[level - 1] || "";
      const subName = SUB_NAMES[sk] || sk;

      checkPage(35);

      // Sub-competency name and level
      addText(subName, M + 2, y, { size: 9, bold: true, r: 51, g: 65, b: 85 });
      addText(`Profile Level ${level}: ${profileName}`, M + CW - 2, y, { size: 8, bold: true, r: comp.r, g: comp.g, b: comp.b, align: "right" });
      y += 4;

      // Profile progress bar
      const barW = CW - 4;
      const barH = 3;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(M + 2, y, barW, barH, 1, 1, "F");
      doc.setFillColor(comp.r, comp.g, comp.b);
      doc.roundedRect(M + 2, y, barW * (level / 6), barH, 1, 1, "F");

      // Level markers
      for (let i = 1; i <= 6; i++) {
        const markerX = M + 2 + (barW * i / 6) - 2;
        doc.setFontSize(5);
        doc.setTextColor(148, 163, 184);
        doc.text(String(i), markerX + 1, y + barH + 3.5, { align: "center" });
      }
      y += 8;

      // Current profile description
      addText("Current Self-Assessment:", M + 2, y, { size: 7, bold: true, r: 100, g: 116, b: 139 });
      y += 3.5;
      y = addWrappedText(description, M + 2, y, CW - 4, { size: 8.5, italic: true, r: 51, g: 65, b: 85 });
      y += 1;

      // Quest evidence
      const subHistory = (questHistory || []).filter(q => q.sub === sk);
      if (subHistory.length > 0) {
        addText("Evidence from Quests:", M + 2, y, { size: 7, bold: true, r: 100, g: 116, b: 139 });
        y += 3.5;
        subHistory.slice(-3).forEach(q => {
          checkPage(8);
          addText(`• ${q.title} (${q.date || "recent"}) — ${q.stars || 0} Growth Stars earned`, M + 4, y, { size: 7.5, r: 71, g: 85, b: 105 });
          y += 3.5;
        });
      }

      y += 3;
      drawLine(M + 2, y, M + CW - 2);
      y += 4;
    });

    y += 2;
  });

  // ── DESCRIPTIVE FEEDBACK ───────────────────────────────────────

  checkPage(45);

  addText("DESCRIPTIVE FEEDBACK", M, y, { size: 11, bold: true, r: 15, g: 23, b: 42 });
  y += 7;

  // Strengths
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(M, y, CW, 4, 1, 1, "F");
  addText("Strengths & Areas of Growth", M + 4, y + 3, { size: 8, bold: true, r: 5, g: 150, b: 105 });
  y += 7;

  if (strongest) {
    const strongDesc = PROFILE_DESCRIPTIONS[strongest]?.[strongestLevel - 1] || "";
    y = addWrappedText(
      `${studentName} demonstrates particular strength in ${SUB_NAMES[strongest]}. At Profile Level ${strongestLevel} (${PROFILE_NAMES[strongestLevel - 1]}), ${studentName} is ${strongDesc.toLowerCase()}`,
      M + 2, y, CW - 4, { size: 9, r: 51, g: 65, b: 85 }
    );
    y += 3;
  }

  if (totalQuests > 0) {
    y = addWrappedText(
      `Through ${totalQuests} completed quests, ${studentName} has demonstrated engagement with the Core Competencies across ${Object.keys(compGroups).filter(ck => compGroups[ck].subs.some(sk => (progress?.[sk]?.questsCompleted || progress?.[sk]?.q || 0) > 0)).length} of 3 competency areas.`,
      M + 2, y, CW - 4, { size: 9, r: 51, g: 65, b: 85 }
    );
    y += 3;
  }

  // Areas for growth
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(M, y, CW, 4, 1, 1, "F");
  addText("Areas for Future Growth", M + 4, y + 3, { size: 8, bold: true, r: 180, g: 115, b: 0 });
  y += 7;

  if (weakest && weakest !== strongest) {
    const weakDesc = PROFILE_DESCRIPTIONS[weakest]?.[Math.min(weakestLevel, 5)] || "";
    y = addWrappedText(
      `${studentName} has opportunity for growth in ${SUB_NAMES[weakest]}. The next profile level involves ${weakDesc.toLowerCase()} Continued engagement with quests in this area will support development.`,
      M + 2, y, CW - 4, { size: 9, r: 51, g: 65, b: 85 }
    );
    y += 3;
  }

  // ── HOW FAMILIES CAN HELP AT HOME ──────────────────────────────

  checkPage(30);
  y += 3;

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(M, y, CW, 4, 1, 1, "F");
  addText("How Families Can Help at Home", M + 4, y + 3, { size: 8, bold: true, r: 37, g: 99, b: 235 });
  y += 7;

  const homeActivities = [
    `Ask ${studentName} about their Growth Story — they have a personalised adventure that grows with each quest.`,
    `Encourage ${studentName} to describe what they learned after completing activities, building reflection skills.`,
    `Celebrate strengths: ${studentName} is strongest in ${SUB_NAMES[strongest] || "multiple areas"} — acknowledge and build on this.`,
    weakest ? `Support growth in ${SUB_NAMES[weakest]} through everyday conversations about ${weakest.includes("social") ? "community and helping others" : weakest.includes("thinking") ? "creative problem-solving" : weakest.includes("personal") ? "feelings and identity" : "sharing ideas and listening"}.` : "Continue supporting regular engagement with GrowQuest activities.",
  ];

  homeActivities.forEach(activity => {
    checkPage(8);
    y = addWrappedText(`• ${activity}`, M + 2, y, CW - 6, { size: 8.5, r: 51, g: 65, b: 85 });
    y += 1.5;
  });

  // ── GOAL SETTING ───────────────────────────────────────────────

  checkPage(30);
  y += 3;

  addText("STUDENT GOAL SETTING", M, y, { size: 11, bold: true, r: 15, g: 23, b: 42 });
  y += 3;
  y = addWrappedText(
    "As required by the BC K-12 Student Reporting Policy, the following goals are informed by the student's self-assessment of the Core Competencies.",
    M, y + 1, CW, { size: 8, italic: true, r: 100, g: 116, b: 139 }
  );
  y += 5;

  // Auto-generated goals based on weakest areas
  const goalAreas = subs.sort((a, b) => (a[1].profile || a[1].l || 1) - (b[1].profile || b[1].l || 1)).slice(0, 3);

  goalAreas.forEach(([sk, p]) => {
    checkPage(12);
    const level = p.profile || p.l || 1;
    const nextLevel = Math.min(level + 1, 6);
    const nextDesc = PROFILE_DESCRIPTIONS[sk]?.[nextLevel - 1] || "";

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(M, y, CW, 12, 1, 1, "F");
    addText(`Goal: ${SUB_NAMES[sk]}`, M + 3, y + 4, { size: 8, bold: true, r: 51, g: 65, b: 85 });
    y = addWrappedText(
      `Move from Level ${level} (${PROFILE_NAMES[level - 1]}) to Level ${nextLevel} (${PROFILE_NAMES[nextLevel - 1]}): ${nextDesc}`,
      M + 3, y + 7.5, CW - 6, { size: 7.5, r: 100, g: 116, b: 139 }
    );
    y += 5;
  });

  // ── STORY EXCERPT (if available) ───────────────────────────────

  if (storyExcerpts && storyExcerpts.length > 0) {
    checkPage(30);
    y += 3;

    addText("FROM THE STUDENT'S GROWTH STORY", M, y, { size: 11, bold: true, r: 15, g: 23, b: 42 });
    y += 3;
    y = addWrappedText(
      `${studentName}'s personalised adventure with ${avatarName || "their companion"} reflects their real competency growth through narrative:`,
      M, y + 1, CW, { size: 8, italic: true, r: 100, g: 116, b: 139 }
    );
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(M, y, CW, 3 + storyExcerpts.slice(-2).length * 14, 2, 2, "F");
    y += 3;

    storyExcerpts.slice(-2).forEach(excerpt => {
      checkPage(15);
      y = addWrappedText(
        `"${excerpt.text}"`,
        M + 4, y, CW - 8, { size: 9, italic: true, r: 71, g: 85, b: 105, lineHeight: 5 }
      );
      addText(`— ${excerpt.quest || "Quest"}, ${excerpt.date || "recent"}`, M + CW - 6, y, { size: 6.5, r: 148, g: 163, b: 184, align: "right" });
      y += 5;
    });
  }

  // ── FOOTER ─────────────────────────────────────────────────────

  y = 262;
  drawLine(M, y, M + CW);
  y += 3;
  addText("Generated by GrowQuest BC — aligned with BC Core Competencies (curriculum.gov.bc.ca/competencies)", M, y, { size: 6, r: 148, g: 163, b: 184 });
  addText("This report supports the BC K-12 Student Reporting Policy requirements for student self-reflection on Core Competencies and goal setting.", M, y + 3, { size: 6, r: 148, g: 163, b: 184 });
  addText(`Report generated: ${new Date().toLocaleDateString("en-CA")}  |  Upload to MyEducationBC or print for report cards`, M, y + 6, { size: 6, r: 148, g: 163, b: 184 });

  // ── Save ───────────────────────────────────────────────────────
  doc.save(`${(studentName || "Student").replace(/\s/g, "_")}_Core_Competency_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ── Class Report Generator (CSV for all students) ────────────────

export function generateClassReport({ className, teacherName, students, reportingPeriod }) {
  const subKeys = Object.keys(SUB_NAMES);
  
  let csv = "Student Learning Report — " + (className || "Class") + "\n";
  csv += "Teacher: " + (teacherName || "") + " | Period: " + (reportingPeriod || "Term") + " | Generated: " + new Date().toLocaleDateString("en-CA") + "\n\n";
  csv += "Student,Age Group,Total Quests,Avg Level,Streak," + subKeys.map(sk => SUB_NAMES[sk]).join(",") + "," + subKeys.map(sk => SUB_NAMES[sk] + " Profile").join(",") + ",Strongest Area,Growth Area\n";

  (students || []).forEach(s => {
    const progress = s.progress || {};
    const totalQ = Object.values(progress).reduce((sum, p) => sum + (p.q || p.questsCompleted || 0), 0);
    const levels = subKeys.map(sk => progress[sk]?.l || progress[sk]?.profile || 1);
    const avgL = (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1);
    const profiles = levels.map(l => PROFILE_NAMES[l - 1] || "Emerging");
    
    const strongest = subKeys[levels.indexOf(Math.max(...levels))];
    const weakest = subKeys[levels.indexOf(Math.min(...levels))];

    csv += `"${s.name}",${s.ageGroup},${totalQ},${avgL},${s.streak || 0},${levels.join(",")},${profiles.join(",")},${SUB_NAMES[strongest]},${SUB_NAMES[weakest]}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(className || "Class").replace(/\s/g, "_")}_Student_Report_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
