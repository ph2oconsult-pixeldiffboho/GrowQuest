import { jsPDF } from "jspdf";

// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Client-Side User Manual Generator
// Generates a comprehensive printable manual entirely in-browser
// ═══════════════════════════════════════════════════════════════════

const NAVY = [15,23,42];
const SLATE = [51,65,85];
const LSLATE = [100,116,139];
const BLUE = [37,99,235];
const PURPLE = [124,58,237];
const GREEN = [5,150,105];
const GOLD = [245,158,11];
const LGRAY = [248,250,252];
const BORDER = [226,232,240];
const WHITE = [255,255,255];

function addHeader(doc, text, y, color = NAVY, size = 18) {
  doc.setFont("helvetica","bold");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(text, 20, y);
  return y + 8;
}

function addSubHeader(doc, text, y, color = BLUE, size = 13) {
  doc.setFont("helvetica","bold");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(text, 20, y);
  return y + 6;
}

function addBody(doc, text, y, maxW = 170) {
  doc.setFont("helvetica","normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, 20, y);
  return y + lines.length * 4.2;
}

function addBullet(doc, text, y, maxW = 164) {
  doc.setFont("helvetica","normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text("-", 22, y);
  doc.text(lines, 27, y);
  return y + lines.length * 4.2;
}

function addNote(doc, text, y, maxW = 160) {
  doc.setFont("helvetica","italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...LSLATE);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, 25, y);
  return y + lines.length * 3.8 + 2;
}

function addPageNum(doc, page) {
  doc.setFont("helvetica","normal");
  doc.setFontSize(7);
  doc.setTextColor(...LSLATE);
  doc.text(`GrowQuest BC User Manual  |  Page ${page}`, 105, 290, {align:"center"});
}

function checkPage(doc, y, needed = 30) {
  if (y > 270 - needed) {
    addPageNum(doc, doc.internal.pages.length - 1);
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateUserManual() {
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
  let y;
  let page = 0;

  // ── COVER PAGE ────────────────────────────────────────────────
  // Dark background
  for (let i = 0; i < 50; i++) {
    const f = i / 50;
    doc.setFillColor(15 + f*10, 23 + f*15, 42 + f*25);
    doc.rect(0, (297/50)*i, 210, 297/50 + 0.5, "F");
  }

  doc.setFont("helvetica","bold");
  doc.setFontSize(32);
  doc.setTextColor(255,255,255);
  doc.text("GrowQuest BC", 105, 100, {align:"center"});

  doc.setFontSize(18);
  doc.setTextColor(...BLUE);
  doc.text("User Manual", 105, 115, {align:"center"});

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  doc.setTextColor(180,180,180);
  doc.text("A complete guide for parents, teachers,", 105, 140, {align:"center"});
  doc.text("and young adventurers", 105, 147, {align:"center"});

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(75, 158, 135, 158);

  doc.setFontSize(9);
  doc.setTextColor(140,140,140);
  doc.text("Aligned with British Columbia's Core Competencies Curriculum", 105, 170, {align:"center"});
  doc.text("For children ages 4-12 (Early Years to Grade 7)", 105, 177, {align:"center"});

  doc.setFontSize(8);
  doc.setTextColor(100,100,100);
  doc.text("Version 5.2", 105, 250, {align:"center"});

  doc.addPage();

  // ── TABLE OF CONTENTS ─────────────────────────────────────────
  y = 25;
  y = addHeader(doc, "Table of Contents", y);
  y += 4;
  const toc = [
    "1.  What is GrowQuest BC?",
    "2.  Getting Started",
    "3.  The Three Growth Realms",
    "4.  How Quests Work",
    "5.  Growth Stars: How Progress Works",
    "6.  Self-Assessment: Checking My Growth",
    "7.  Voice Input: Tap to Talk",
    "8.  The Parent/Teacher Dashboard",
    "9.  Growth Certificates",
    "10. Tips for Parents and Teachers",
    "11. Tips for Young Adventurers",
    "12. Frequently Asked Questions",
    "13. Curriculum Alignment Reference",
  ];
  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  toc.forEach(item => { doc.text(item, 25, y); y += 7; });
  addPageNum(doc, 1);
  doc.addPage();

  // ── 1. WHAT IS GROWQUEST BC? ──────────────────────────────────
  y = 25;
  y = addHeader(doc, "1. What is GrowQuest BC?", y);
  y = addBody(doc, "GrowQuest BC is an interactive learning app that helps children ages 4 to 12 develop real-life skills aligned with British Columbia's Core Competencies curriculum. Through fun quests, creative challenges, and thoughtful reflection, children grow their abilities in communication, thinking, and personal and social development.", y);
  y += 2;
  y = addBody(doc, "The app feels like a game but teaches like a classroom. Children choose an animal guide that evolves as they grow, complete age-appropriate quests, earn Growth Stars, and track their progress through six developmental levels.", y);
  y += 4;
  y = addSubHeader(doc, "Key Features", y);
  const features = [
    "Age-adapted quests for Early Years (4-6), Primary (6-9), and Intermediate (9-12)",
    "Seven sub-competencies across three core areas",
    "Voice-to-text input so young children can speak instead of type",
    "Growth Stars reward system with clear, visual progress tracking",
    "Simplified self-assessment: emoji-based for young children, condensed for older",
    "Parent/Teacher dashboard with curriculum-aligned progress reports",
    "Printable Growth Certificates for demonstrated competencies",
    "Progress saved automatically between sessions",
    "Optional parent PIN protection for the adult dashboard",
    "Guided onboarding with companion voice narration",
    "Celebration sounds when completing quests and levelling up",
    "Avatar evolution display — tap to see your guide's growth stages",
    "Voice picker to choose your companion's voice",
    "Downloadable User Manual from the parent dashboard",
  ];
  features.forEach(f => { y = checkPage(doc, y, 8); y = addBullet(doc, f, y); });
  addPageNum(doc, 2);
  doc.addPage();

  // ── 2. GETTING STARTED ────────────────────────────────────────
  y = 25;
  y = addHeader(doc, "2. Getting Started", y);
  y += 2;

  const steps = [
    ["Step 1: Open the App", "Open GrowQuest BC in any web browser. If you have played before, tap 'Continue My Quest' to load your saved progress."],
    ["Step 2: Enter Your Name", "Type your name. This appears on your dashboard and certificates."],
    ["Step 3: Choose Your Age Group", "Select Early Years (4-6), Primary (6-9), or Intermediate (9-12). This determines which quests you see and how you interact with them."],
    ["Step 4: Choose Your Guide", "Pick an animal companion from eight options and give it a name. Your guide evolves through six stages: Egg, Hatchling, Fledgling, Explorer, Champion, and Legend."],
    ["Step 5: Start Exploring", "Your dashboard shows Growth Realms, today's quests, and your 'What I Can Do' statements. Tap any realm or quest to begin."],
  ];
  steps.forEach(([title, desc]) => {
    y = checkPage(doc, y, 15);
    y = addSubHeader(doc, title, y);
    y = addBody(doc, desc, y);
    y += 2;
  });
  y += 2;
  y = addNote(doc, "Tip: The age group affects quest difficulty and input methods, not the competency levels. A child in any age group can reach any profile level.", y);
  addPageNum(doc, 3);
  doc.addPage();

  // ── 3. THE THREE GROWTH REALMS ────────────────────────────────
  y = 25;
  y = addHeader(doc, "3. The Three Growth Realms", y);
  y = addBody(doc, "GrowQuest BC is built around British Columbia's three Core Competencies. Each is represented as a realm with its own theme.", y);
  y += 4;

  const realms = [
    ["Echo Isles: Communication", BLUE, [
      ["Communicating", "Sharing ideas clearly through talking, writing, drawing, and listening."],
      ["Working Together", "Cooperating with others, sharing roles, and building toward shared goals."],
    ]],
    ["Wonder Peaks: Thinking", PURPLE, [
      ["Creative Thinking", "Coming up with new ideas, combining concepts, and creating things."],
      ["Thinking It Through", "Asking questions, looking at evidence, and figuring things out."],
    ]],
    ["Heartwood Grove: Personal and Social", GREEN, [
      ["Knowing Myself", "Understanding who you are, your identity, culture, and values."],
      ["Taking Care of Myself", "Managing feelings, setting goals, and making good choices."],
      ["Caring for Others", "Treating others with respect, showing empathy, and helping your community."],
    ]],
  ];

  realms.forEach(([name, color, subs]) => {
    y = checkPage(doc, y, 25);
    y = addSubHeader(doc, name, y, color);
    subs.forEach(([subName, subDesc]) => {
      y = checkPage(doc, y, 8);
      y = addBullet(doc, `${subName}: ${subDesc}`, y);
    });
    y += 4;
  });

  y = addBody(doc, "Each sub-competency has six progressive levels. These are additive: reaching Level 3 means you can still do everything from Levels 1 and 2. Those are strengths you have built and keep.", y);
  addPageNum(doc, 4);
  doc.addPage();

  // ── 4. HOW QUESTS WORK ────────────────────────────────────────
  y = 25;
  y = addHeader(doc, "4. How Quests Work", y);
  y = addBody(doc, "Quests are short activities (3 to 15 minutes) that help children practice and demonstrate their competencies.", y);
  y += 2;
  y = addSubHeader(doc, "Quest Flow", y);
  const questSteps = [
    "1. Preview: See what the quest is about, the realm, time, and stars available.",
    "2. Do the Quest: Complete the activity using emoji, drawing, voice, or text.",
    "3. Reflect: Choose how the quest felt (Fun, Made Me Think, Challenging, Loved It).",
    "4. Self-Assess: Read the 'I can' statements and choose the one that fits you.",
    "5. Earn Stars: See your Growth Stars breakdown and celebrate!",
  ];
  questSteps.forEach(s => { y = checkPage(doc, y, 8); y = addBullet(doc, s, y); });
  y += 4;

  y = addSubHeader(doc, "Input Types by Age", y);
  y = addBullet(doc, "Emoji: Tap the emoji that fits (Early Years feeling/identification quests)", y);
  y = addBullet(doc, "Drawing: Draw on paper, then describe using voice or tap 'I drew it' (younger children)", y);
  y = addBullet(doc, "Voice: Tap the microphone, speak, words appear as text (all ages)", y);
  y = addBullet(doc, "Text: Type your response (Primary and Intermediate)", y);
  y += 4;

  y = addSubHeader(doc, "Cross-Competency Quests", y);
  y = addBody(doc, "Some quests build skills in more than one area. These earn bonus Growth Stars and the secondary sub-competency also receives progress.", y);
  addPageNum(doc, 5);
  doc.addPage();

  // ── 5. GROWTH STARS ───────────────────────────────────────────
  y = 25;
  y = addHeader(doc, "5. Growth Stars: How Progress Works", y);
  y = addBody(doc, "Growth Stars show how you are growing. You earn them every time you complete a quest, and you can see exactly how you earned each one.", y);
  y += 2;
  y = addSubHeader(doc, "How You Earn Stars", y);
  y = addBullet(doc, "Complete an easy quest: 2 stars", y);
  y = addBullet(doc, "Complete a medium quest: 3 stars", y);
  y = addBullet(doc, "Complete a hard quest: 5 stars", y);
  y = addBullet(doc, "Thoughtful reflection: +1 to +3 stars", y);
  y = addBullet(doc, "Complete self-assessment: +1 star", y);
  y = addBullet(doc, "Cross-competency quest: +1 star", y);
  y += 4;

  y = addSubHeader(doc, "Levelling Up", y);
  y = addBody(doc, "Stars needed to reach each level:", y);
  y = addBullet(doc, "Level 2 (Developing): 8 stars", y);
  y = addBullet(doc, "Level 3 (Practising): 12 stars", y);
  y = addBullet(doc, "Level 4 (Confident): 16 stars", y);
  y = addBullet(doc, "Level 5 (Extending): 22 stars", y);
  y = addBullet(doc, "Level 6 (Transforming): 28 stars", y);
  y += 4;
  y = addNote(doc, "Important: Levels are not tied to age or grade. A thoughtful 5-year-old might demonstrate Level 4 in one area, while an 11-year-old might be at Level 2 in another. This is completely normal.", y);
  addPageNum(doc, 6);
  doc.addPage();

  // ── 6. SELF-ASSESSMENT ────────────────────────────────────────
  y = 25;
  y = addHeader(doc, "6. Self-Assessment: Checking My Growth", y);
  y = addBody(doc, 'After each quest, children read "I can" statements and choose the one that sounds most like them. This is a core part of the BC curriculum. It is not a test and there are no wrong answers.', y);
  y += 2;
  y = addSubHeader(doc, "How It Works by Age Group", y);
  y = addBody(doc, "Early Years (4-6): Three big emoji buttons — Just starting (seedling), Getting better (growing), I can do it (tree). No reading required.", y);
  y = addBody(doc, 'Primary and Intermediate (6-12): Four condensed options showing levels around the child\'s current level. Previously demonstrated levels are highlighted as strengths built.', y);
  y += 2;
  y = addBody(doc, 'If a child is unsure, a button says "I\'m not sure yet, that\'s okay!" This defaults to their current level so they still engage without pressure.', y);
  y += 4;
  y = addNote(doc, "For parents: The Parent Dashboard shows both the official curriculum wording and the kid-friendly version side by side.", y);
  y += 6;

  // ── 7. VOICE INPUT ────────────────────────────────────────────
  y = checkPage(doc, y, 60);
  y = addHeader(doc, "7. Voice Input: Tap to Talk", y);
  y = addBody(doc, "GrowQuest includes voice-to-text so children who are not yet comfortable typing can speak their responses. Text appears progressively while they speak.", y);
  y += 2;
  y = addSubHeader(doc, "How to Use It", y);
  y = addBullet(doc, '1. Tap the microphone button ("Tap to talk")', y);
  y = addBullet(doc, "2. The button turns red and pulses. Speak clearly.", y);
  y = addBullet(doc, "3. Your words appear as text every few seconds while you talk.", y);
  y = addBullet(doc, "4. Tap the button again to stop. A final transcription runs for accuracy.", y);
  y = addBullet(doc, "5. During guided onboarding, tap the voice icon to choose your companion's voice or turn narration on/off.", y);
  y += 2;
  y = addSubHeader(doc, "Tips for Best Results", y);
  y = addBullet(doc, "Speak in a quiet room with minimal background noise", y);
  y = addBullet(doc, "Hold the device about 30cm from your mouth", y);
  y = addBullet(doc, "Speak at a normal pace", y);
  y = addBullet(doc, "Works on all modern browsers including Safari on iPhone", y);
  addPageNum(doc, 7);
  doc.addPage();

  // ── 8. PARENT DASHBOARD ───────────────────────────────────────
  y = 25;
  y = addHeader(doc, "8. The Parent/Teacher Dashboard", y);
  y = addBody(doc, "The Parent Dashboard provides a curriculum-aligned view of your child's progress, protected by a 4-digit PIN.", y);
  y += 2;
  y = addSubHeader(doc, "Accessing the Dashboard", y);
  y = addBody(doc, 'Tap "Parent" in the top-right of the child\'s dashboard. You can set a 4-digit PIN to keep this area private, or skip to access it freely. You can add, change, or remove the PIN at any time.', y);
  y += 2;
  y = addSubHeader(doc, "What You Will See", y);
  const dashItems = [
    "Overview: Total quests, average profile level, current streak",
    "Strongest area and growth opportunity at a glance",
    "Per-competency breakdown with official and kid-friendly wording side by side",
    "Recent activity: last five quests per sub-competency with dates and stars",
    "Certificate downloads for any sub-competency at Level 2+",
    "User Manual download",
    "Level explainer reference table",
    "Direct link to the official BC curriculum website",
  ];
  dashItems.forEach(d => { y = checkPage(doc, y, 8); y = addBullet(doc, d, y); });
  y += 4;
  y = addNote(doc, "The Parent Dashboard is the only place where official curriculum language appears. The child always sees kid-friendly translations.", y);
  y += 6;

  // ── 9. CERTIFICATES ───────────────────────────────────────────
  y = checkPage(doc, y, 50);
  y = addHeader(doc, "9. Growth Certificates", y);
  y = addBody(doc, "GrowQuest generates professional, printable Growth Certificates as landscape A4 PDFs.", y);
  y += 2;
  y = addSubHeader(doc, "When Available", y);
  y = addBullet(doc, "Level-Up Celebration: Download button appears when reaching a new level", y);
  y = addBullet(doc, "Parent Dashboard: Download button for every sub-competency at Level 2+", y);
  y += 2;
  y = addSubHeader(doc, "What the Certificate Shows", y);
  ["Child's name", "Sub-competency and profile level", '"I can" statement (kid-friendly)', "Quest titles that contributed", "Date earned and avatar companion name"].forEach(c => {
    y = checkPage(doc, y, 6); y = addBullet(doc, c, y);
  });
  addPageNum(doc, 8);
  doc.addPage();

  // ── 10. TIPS FOR PARENTS ──────────────────────────────────────
  y = 25;
  y = addHeader(doc, "10. Tips for Parents and Teachers", y);
  y += 2;
  const parentTips = [
    "Let children lead. The app is designed for independent use. Their self-assessment is more valuable than accuracy.",
    "Celebrate all growth, not just levelling up. Completing a quest or reflecting thoughtfully are worth celebrating.",
    "Different levels in different areas is normal. The BC curriculum states that competency profiles are developmental and non-linear.",
    "Use the Parent Dashboard for conferences. It shows both official and kid-friendly language.",
    "Print certificates and display them. Physical recognition makes growth feel real.",
    "Talk about the quests. Ask what they did, noticed, and found interesting.",
    "Progress saves automatically. There is no save button. Clearing browser data will reset progress.",
    "Use voice input for younger children. Their ideas matter more than their spelling.",
    "Tap the avatar badge on the dashboard to see all evolution stages. Children love watching their guide grow.",
    "A celebration chime plays when your child earns stars. This audio feedback reinforces achievement.",
  ];
  parentTips.forEach(t => { y = checkPage(doc, y, 12); y = addBullet(doc, t, y); y += 2; });
  y += 4;

  // ── 11. TIPS FOR KIDS ─────────────────────────────────────────
  y = checkPage(doc, y, 50);
  y = addHeader(doc, "11. Tips for Young Adventurers", y);
  y = addBody(doc, "Hello, adventurer! Here are some tips:", y);
  y += 2;
  const kidTips = [
    "There are no wrong answers! Every quest is about YOUR ideas.",
    "Try quests in all three realms, not just your favourite one.",
    "When you reflect, really think about how it felt. That is how you grow!",
    "Use the microphone if you do not like typing.",
    "Your guide evolves as you grow. Keep going!",
    "It is okay to find some quests hard. That means you are learning!",
    "Ask a parent to print your certificates. They look great on the fridge!",
    "Tap on your avatar at the top of the screen to see how your guide will evolve!",
  ];
  kidTips.forEach(t => { y = checkPage(doc, y, 8); y = addBullet(doc, t, y); });
  addPageNum(doc, 9);
  doc.addPage();

  // ── 12. FAQ ───────────────────────────────────────────────────
  y = 25;
  y = addHeader(doc, "12. Frequently Asked Questions", y);
  y += 2;
  const faqs = [
    ["Is this app free?", "Yes. No in-app purchases or advertisements."],
    ["Does it work on my phone?", "Yes. It works in any modern browser on phones, tablets, and computers, including iPhone and iPad."],
    ["Will progress be saved?", "Yes, automatically to your device. Clearing browser data will reset progress. Cloud sync is planned."],
    ["Can my child use it without reading?", "Early Years quests use emoji, drawing, and voice. A parent may need to read quest descriptions for the youngest children."],
    ["Is the voice feature secure?", "Audio is sent to Google Gemini for transcription and is not stored."],
    ["How does this align with the BC curriculum?", "Every quest, level, and self-assessment maps directly to the official BC Core Competencies framework."],
    ["What are Growth Stars?", "They track progress by rewarding quest completion, reflection, and self-assessment with visible stars instead of abstract points."],
    ["What is the guided onboarding?", "When a child first opens the app, their avatar companion walks them through their first quest with voice narration, teaching them how quests, reflection, stars, and self-assessment work before they explore independently."],
    ["Does reaching Level 3 mean Level 1 and 2 are lost?", 'No! Levels are additive. The app shows previous levels as "Strengths I\'ve built."'],
  ];
  faqs.forEach(([q, a]) => {
    y = checkPage(doc, y, 16);
    doc.setFont("helvetica","bold"); doc.setFontSize(9.5); doc.setTextColor(...NAVY);
    doc.text(`Q: ${q}`, 20, y); y += 4.5;
    y = addBody(doc, `A: ${a}`, y); y += 3;
  });
  addPageNum(doc, 10);
  doc.addPage();

  // ── 13. CURRICULUM REFERENCE ──────────────────────────────────
  y = 25;
  y = addHeader(doc, "13. Curriculum Alignment Reference", y);
  y = addBody(doc, "All seven sub-competencies with their official facets from the BC curriculum:", y);
  y += 4;

  const currRef = [
    ["Communication", "Communicating", "Connecting and Engaging; Acquiring, Interpreting and Presenting Information; Focusing on Intent and Purpose"],
    ["Communication", "Collaborating", "Working Collectively; Supporting and Encouraging Others; Shared Responsibility"],
    ["Thinking", "Creative Thinking", "Creating and Innovating; Generating and Incubating; Evaluating and Developing"],
    ["Thinking", "Critical and Reflective Thinking", "Analyzing and Critiquing; Questioning and Investigating; Designing and Developing; Reflecting and Assessing"],
    ["Personal & Social", "Positive Personal and Cultural Identity", "Understanding Relationships and Cultural Contexts; Recognizing Personal Values and Choices; Identifying Personal Strengths and Abilities"],
    ["Personal & Social", "Personal Awareness and Responsibility", "Self-Advocating; Self-Regulating; Well-Being"],
    ["Personal & Social", "Social Awareness and Responsibility", "Building Relationships; Empathy; Contributing to Community and Caring for the Environment"],
  ];

  currRef.forEach(([comp, sub, facets]) => {
    y = checkPage(doc, y, 16);
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...BLUE);
    doc.text(`${comp}:`, 20, y);
    doc.setFont("helvetica","bold"); doc.setTextColor(...NAVY);
    doc.text(sub, 55, y);
    y += 4;
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...LSLATE);
    const fLines = doc.splitTextToSize(facets, 160);
    doc.text(fLines, 25, y);
    y += fLines.length * 3.5 + 5;
  });

  y += 6;
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
  doc.line(60, y, 150, y); y += 6;
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...LSLATE);
  doc.text("GrowQuest BC  |  curriculum.gov.bc.ca/competencies  |  Version 5.2", 105, y, {align:"center"});
  addPageNum(doc, 11);

  // ── Save ──────────────────────────────────────────────────────
  doc.save("GrowQuest_BC_User_Manual.pdf");
}
