// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Client-Side Certificate Generator
// Uses jsPDF to generate printable Growth Certificates in-browser.
// No server required — runs entirely on Vercel.
// ═══════════════════════════════════════════════════════════════════

import { jsPDF } from "jspdf";

// ── Colour Palettes per Competency ─────────────────────────────────
const COMP_COLORS = {
  communication:  { primary: [37, 99, 235],  light: [219, 234, 254], dark: [29, 78, 216]  },
  thinking:       { primary: [124, 58, 237], light: [237, 233, 254], dark: [109, 40, 217] },
  personalSocial: { primary: [5, 150, 105],  light: [209, 250, 229], dark: [4, 120, 87]   },
};

const COMP_NAMES = {
  communication: "Communication",
  thinking: "Thinking",
  personalSocial: "Personal & Social",
};

const SUB_NAMES = {
  communicating:     "Communicating",
  collaborating:     "Collaborating",
  creativeThinking:  "Creative Thinking",
  criticalThinking:  "Critical & Reflective Thinking",
  positiveIdentity:  "Positive Personal & Cultural Identity",
  personalAwareness: "Personal Awareness & Responsibility",
  socialAwareness:   "Social Awareness & Responsibility",
};

const PROFILES = {
  communicating: [
    "I respond meaningfully to communication from peers and adults.",
    "I talk and listen to people I know. I can communicate for a purpose.",
    "I communicate purposefully, using forms and strategies I have practiced.",
    "I communicate clearly and purposefully, using a variety of forms appropriately.",
    "I communicate confidently, showing attention to my audience and purpose.",
    "I communicate with intentional impact, in well-constructed forms.",
  ],
  collaborating: [
    "I can participate with others in familiar situations.",
    "I cooperate with others for specific purposes.",
    "I contribute during group activities and share roles and responsibilities.",
    "I can confidently interact and build relationships to further shared goals.",
    "I can facilitate group processes and encourage collective responsibility.",
    "I can connect my group with broader networks for various purposes.",
  ],
  creativeThinking: [
    "I get ideas when I play.",
    "I can get new ideas or build on others' ideas to create new things.",
    "I can get new ideas in areas I'm interested in and build skills to make them work.",
    "I can get new ideas or reinterpret others' ideas in novel ways.",
    "I can think outside the box and persevere to develop innovative ideas.",
    "I can develop a body of creative work over time in an area of passion.",
  ],
  criticalThinking: [
    "I can explore materials and actions.",
    "I can use evidence to make simple judgments.",
    "I can ask questions and consider options using observation and imagination.",
    "I can combine new evidence with what I know to develop reasoned conclusions.",
    "I can evaluate well-chosen evidence to identify alternatives and implications.",
    "I can examine evidence from various perspectives to analyze complex issues.",
  ],
  positiveIdentity: [
    "I am aware of myself as different from others.",
    "I am aware of different aspects of myself.",
    "I can describe different aspects of my identity.",
    "I have pride in who I am. I am part of larger communities.",
    "I understand that my identity is influenced by many aspects of my life.",
    "I can identify how my life experiences have contributed to who I am.",
  ],
  personalAwareness: [
    "I can show joy and express some wants, needs, and preferences.",
    "I can seek out experiences that make me feel happy and proud.",
    "I can make choices that help me meet my needs and increase my well-being.",
    "I can recognize my strengths and use strategies to manage stress and reach goals.",
    "I recognize my value and take responsibility for my choices and achievements.",
    "I can find internal motivation and act on opportunities for self-growth.",
  ],
  socialAwareness: [
    "I can be aware of others and my surroundings.",
    "I can interact with others and my surroundings respectfully.",
    "I can interact with others and the environment respectfully and thoughtfully.",
    "I can take purposeful action to support others and the environment.",
    "I can advocate and take action for my communities and the natural world.",
    "I can initiate positive, sustainable change for others and the environment.",
  ],
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

const CONTEXT_LABELS = {
  solo: "Independent work",
  with_family: "Family activities",
  with_peers: "Peer collaboration",
  classroom: "Classroom setting",
  community: "Community engagement",
};

// ── Helper: draw a 5-pointed star ──────────────────────────────────
function drawStar(doc, cx, cy, outerR, innerR, color) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push([cx + r * Math.cos(angle), cy - r * Math.sin(angle)]);
  }
  doc.setFillColor(...color);
  // Draw as filled polygon
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  doc.triangle(
    points[0][0], points[0][1],
    points[1][0], points[1][1],
    points[2][0], points[2][1],
    "F"
  );
  // jsPDF doesn't have polygon — use lines
  let path = `${points[0][0]} ${points[0][1]} m `;
  for (let i = 1; i < points.length; i++) {
    path += `${points[i][0]} ${points[i][1]} l `;
  }
  // Fallback: draw filled circle as star substitute (jsPDF polygon support is limited)
  doc.circle(cx, cy, outerR, "F");
}

// ── Helper: draw a diamond ─────────────────────────────────────────
function drawDiamond(doc, cx, cy, size, color) {
  doc.setFillColor(...color);
  doc.triangle(cx, cy - size, cx + size, cy, cx, cy + size, "F");
  doc.triangle(cx, cy - size, cx - size, cy, cx, cy + size, "F");
}

// ── Helper: centered text with max width ───────────────────────────
function centeredText(doc, text, y, maxWidth, pageWidth) {
  const lines = doc.splitTextToSize(text, maxWidth);
  const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
  lines.forEach((line, i) => {
    const tw = doc.getTextWidth(line);
    doc.text(line, (pageWidth - tw) / 2, y + i * lineHeight);
  });
  return lines.length * lineHeight;
}

// ═══════════════════════════════════════════════════════════════════
// Main Certificate Generator
// ═══════════════════════════════════════════════════════════════════

export function generateCertificate({
  childName,
  subCompetencyKey,
  profileLevel,
  profileText: profileTextOverride,
  evidenceSummary,
  dateEarned,
  avatarName,
}) {
  const compKey = SUB_TO_COMP[subCompetencyKey];
  const colors = COMP_COLORS[compKey];
  const subName = SUB_NAMES[subCompetencyKey] || subCompetencyKey;
  const compName = COMP_NAMES[compKey] || compKey;
  // Use kid-friendly text passed in, fall back to stored profiles only as last resort
  const profileText = profileTextOverride || (PROFILES[subCompetencyKey] || [])[profileLevel - 1] || "";

  // Landscape A4: 297mm x 210mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  // ── Background gradient (simulated with rectangles) ──────────
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    const frac = i / steps;
    const r = Math.round(247 - frac * 6);
    const g = Math.round(250 - frac * 5);
    const b = Math.round(255 - frac * 3);
    doc.setFillColor(r, g, b);
    const yStart = (H / steps) * i;
    doc.rect(0, yStart, W, H / steps + 0.5, "F");
  }

  // ── Subtle watermark circles ─────────────────────────────────
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.circle(W * 0.15, H * 0.3, 55, "F");
  doc.circle(W * 0.85, H * 0.7, 40, "F");
  doc.setGState(new doc.GState({ opacity: 1 }));

  // ── Border ───────────────────────────────────────────────────
  const margin = 10;
  const inner = 13;

  // Outer border
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, margin, W - 2 * margin, H - 2 * margin, 5, 5);

  // Inner border (lighter)
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setGState(new doc.GState({ opacity: 0.3 }));
  doc.setLineWidth(0.3);
  doc.roundedRect(inner, inner, W - 2 * inner, H - 2 * inner, 4, 4);
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Corner diamonds
  const corners = [
    [margin + 4, margin + 4],
    [W - margin - 4, margin + 4],
    [margin + 4, H - margin - 4],
    [W - margin - 4, H - margin - 4],
  ];
  corners.forEach(([cx, cy]) => {
    drawDiamond(doc, cx, cy, 2, [245, 158, 11]);
  });

  // ── Header: GROWQUEST BC ─────────────────────────────────────
  let y = 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  const header = "GROWQUEST BC";
  doc.text(header, (W - doc.getTextWidth(header)) / 2, y);

  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  const subheader = "Aligned with British Columbia\u2019s Core Competencies Curriculum";
  doc.text(subheader, (W - doc.getTextWidth(subheader)) / 2, y);

  // ── Stars (one per profile level) ────────────────────────────
  y += 7;
  const starCount = Math.min(profileLevel, 6);
  const starSpacing = 7;
  const startX = W / 2 - ((starCount - 1) * starSpacing) / 2;
  doc.setFillColor(245, 158, 11);
  for (let i = 0; i < starCount; i++) {
    const sx = startX + i * starSpacing;
    doc.circle(sx, y, 1.8, "F");
  }

  // ── Title ────────────────────────────────────────────────────
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  const title = "Growth Certificate";
  doc.text(title, (W - doc.getTextWidth(title)) / 2, y);

  // ── "This certifies that" ────────────────────────────────────
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const certText = "This certifies that";
  doc.text(certText, (W - doc.getTextWidth(certText)) / 2, y);

  // ── Child's Name ─────────────────────────────────────────────
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...colors.primary);
  const nameWidth = doc.getTextWidth(childName);
  doc.text(childName, (W - nameWidth) / 2, y);

  // Gold underline
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  const lineStart = (W - nameWidth) / 2 - 8;
  const lineEnd = (W + nameWidth) / 2 + 8;
  doc.line(lineStart, y + 2, lineEnd, y + 2);

  // ── "has demonstrated consistent growth in" ──────────────────
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const growthText = "has demonstrated consistent growth in";
  doc.text(growthText, (W - doc.getTextWidth(growthText)) / 2, y);

  // ── Sub-competency name ──────────────────────────────────────
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...colors.dark);
  doc.text(subName, (W - doc.getTextWidth(subName)) / 2, y);

  // ── Competency & Profile ─────────────────────────────────────
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  const compLine = `${compName} Core Competency  \u2022  Profile ${profileLevel} of 6`;
  doc.text(compLine, (W - doc.getTextWidth(compLine)) / 2, y);

  // ── Profile Statement Box ────────────────────────────────────
  y += 7;
  const boxW = W * 0.58;
  const boxX = (W - boxW) / 2;
  const boxH = 18;

  // Light background
  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.setGState(new doc.GState({ opacity: 0.5 }));
  doc.roundedRect(boxX, y, boxW, boxH, 2, 2, "F");
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Left accent bar
  doc.setFillColor(...colors.primary);
  doc.rect(boxX, y, 2, boxH, "F");

  // Profile text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const wrappedProfile = doc.splitTextToSize(`"${profileText}"`, boxW - 14);
  const profileY = y + (boxH - wrappedProfile.length * 4.5) / 2 + 3;
  wrappedProfile.forEach((line, i) => {
    const lw = doc.getTextWidth(line);
    doc.text(line, (W - lw) / 2, profileY + i * 4.5);
  });

  // ── Evidence Summary ─────────────────────────────────────────
  y += boxH + 7;
  const leftCol = W * 0.2;
  const rightCol = W * 0.55;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...colors.primary);
  doc.text("GROWTH EVIDENCE", leftCol, y);
  doc.text("DEMONSTRATED IN", rightCol, y);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  const quests = (evidenceSummary.questTitles || []).slice(0, 4);
  quests.forEach((q, i) => {
    doc.text(`\u2022  ${q}`, leftCol + 1, y + i * 4);
  });

  const contexts = (evidenceSummary.contexts || []).slice(0, 4);
  contexts.forEach((ctx, i) => {
    const label = CONTEXT_LABELS[ctx] || ctx;
    doc.text(`\u2022  ${label}`, rightCol + 1, y + i * 4);
  });

  const maxRows = Math.max(quests.length, contexts.length);
  y += maxRows * 4 + 3;

  // Evidence count
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  const evLine = `Based on ${evidenceSummary.evidenceCount || 0} demonstrated instances of growth`;
  doc.text(evLine, (W - doc.getTextWidth(evLine)) / 2, y);

  // ── Reflection Quote ─────────────────────────────────────────
  const reflections = evidenceSummary.reflections || [];
  if (reflections.length > 0) {
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    let refText = reflections[reflections.length - 1];
    if (refText.length > 130) refText = refText.slice(0, 127) + "...";
    const refWrapped = doc.splitTextToSize(
      `Child\u2019s reflection: \u201C${refText}\u201D`,
      W * 0.5
    );
    refWrapped.forEach((line, i) => {
      const lw = doc.getTextWidth(line);
      doc.text(line, (W - lw) / 2, y + i * 3.5);
    });
  }

  // ── Footer ───────────────────────────────────────────────────
  let fy = H - 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${dateEarned}`, W * 0.25, fy);

  if (avatarName) {
    doc.text(`Companion: ${avatarName}`, W * 0.65, fy);
  }

  fy += 5;
  doc.setFontSize(6);
  doc.setTextColor(170, 170, 170);
  const footerLine =
    "GrowQuest BC  \u2022  curriculum.gov.bc.ca/competencies  \u2022  Core Competencies are developmental, progressive, and additive";
  doc.text(footerLine, (W - doc.getTextWidth(footerLine)) / 2, fy);

  // ── Save ─────────────────────────────────────────────────────
  const fileName = `GrowQuest_Certificate_${childName.replace(/\s+/g, "_")}_${subName.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);

  return fileName;
}
