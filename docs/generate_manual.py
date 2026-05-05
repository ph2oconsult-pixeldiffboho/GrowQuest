#!/usr/bin/env python3
"""
GrowQuest BC — User Manual PDF Generator
A comprehensive, printable guide for parents, teachers, and children.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas as pdfcanvas
import os

# ── Colours ─────────────────────────────────────────────────────────
NAVY = HexColor("#0F172A")
SLATE = HexColor("#334155")
LIGHT_SLATE = HexColor("#64748B")
BLUE = HexColor("#2563EB")
PURPLE = HexColor("#7C3AED")
GREEN = HexColor("#059669")
GOLD = HexColor("#F59E0B")
LIGHT_BG = HexColor("#F8FAFC")
LIGHT_BLUE = HexColor("#EFF6FF")
LIGHT_GREEN = HexColor("#ECFDF5")
LIGHT_PURPLE = HexColor("#F5F3FF")
WHITE = HexColor("#FFFFFF")
BORDER = HexColor("#E2E8F0")

# ── Styles ──────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

sTitle = ParagraphStyle("ManualTitle", parent=styles["Title"],
    fontSize=28, leading=34, textColor=NAVY, fontName="Helvetica-Bold",
    alignment=TA_CENTER, spaceAfter=6)

sSubtitle = ParagraphStyle("ManualSubtitle", parent=styles["Normal"],
    fontSize=13, leading=18, textColor=LIGHT_SLATE, fontName="Helvetica",
    alignment=TA_CENTER, spaceAfter=24)

sH1 = ParagraphStyle("H1", parent=styles["Heading1"],
    fontSize=20, leading=26, textColor=NAVY, fontName="Helvetica-Bold",
    spaceBefore=20, spaceAfter=10)

sH2 = ParagraphStyle("H2", parent=styles["Heading2"],
    fontSize=15, leading=20, textColor=BLUE, fontName="Helvetica-Bold",
    spaceBefore=14, spaceAfter=6)

sH3 = ParagraphStyle("H3", parent=styles["Heading3"],
    fontSize=12, leading=16, textColor=PURPLE, fontName="Helvetica-Bold",
    spaceBefore=10, spaceAfter=4)

sBody = ParagraphStyle("Body", parent=styles["Normal"],
    fontSize=10, leading=15, textColor=SLATE, fontName="Helvetica",
    alignment=TA_JUSTIFY, spaceAfter=8)

sBullet = ParagraphStyle("Bullet", parent=sBody,
    leftIndent=16, bulletIndent=6, spaceBefore=2, spaceAfter=2)

sNote = ParagraphStyle("Note", parent=sBody,
    fontSize=9, leading=13, textColor=LIGHT_SLATE, fontName="Helvetica-Oblique",
    leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=8)

sTip = ParagraphStyle("Tip", parent=sBody,
    fontSize=10, leading=14, textColor=HexColor("#047857"), fontName="Helvetica",
    leftIndent=12, spaceBefore=4, spaceAfter=8,
    backColor=HexColor("#ECFDF5"), borderPadding=8)

sTableHeader = ParagraphStyle("TableHeader",
    fontSize=9, leading=12, textColor=WHITE, fontName="Helvetica-Bold")

sTableBody = ParagraphStyle("TableBody",
    fontSize=9, leading=13, textColor=SLATE, fontName="Helvetica")

sFooter = ParagraphStyle("Footer",
    fontSize=7, leading=10, textColor=LIGHT_SLATE, fontName="Helvetica",
    alignment=TA_CENTER)

# ── Page Template ───────────────────────────────────────────────────

def add_page_number(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.setFillColor(LIGHT_SLATE)
    canvas_obj.drawCentredString(A4[0]/2, 15*mm,
        f"GrowQuest BC User Manual  |  Page {doc.page}")
    canvas_obj.restoreState()

def add_cover_bg(canvas_obj, doc):
    w, h = A4
    # Gradient background
    for i in range(50):
        frac = i / 50
        r = int(15 + frac * 10)
        g = int(23 + frac * 15)
        b = int(42 + frac * 25)
        canvas_obj.setFillColor(Color(r/255, g/255, b/255))
        y = h - (h/50) * i
        canvas_obj.rect(0, y - h/50, w, h/50 + 1, fill=1, stroke=0)

# ── Build Document ──────────────────────────────────────────────────

def build_manual(output_path):
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=25*mm,
    )
    story = []
    W = A4[0] - 40*mm  # usable width

    # ================================================================
    # COVER PAGE
    # ================================================================
    story.append(Spacer(1, 40*mm))
    story.append(Paragraph("GrowQuest BC", sTitle))
    story.append(Paragraph("User Manual", ParagraphStyle("CoverSub",
        parent=sTitle, fontSize=18, textColor=BLUE, spaceAfter=20)))
    story.append(Paragraph(
        "A complete guide for parents, teachers, and young adventurers",
        sSubtitle))
    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width="40%", thickness=1, color=GOLD,
        spaceAfter=10, spaceBefore=10, hAlign="CENTER"))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        "Aligned with British Columbia's Core Competencies Curriculum<br/>"
        "For children ages 4-12 (Early Years to Grade 7)",
        ParagraphStyle("CoverNote", parent=sBody, alignment=TA_CENTER,
            textColor=LIGHT_SLATE, fontSize=10)))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("Version 3.7", ParagraphStyle("Ver",
        parent=sBody, alignment=TA_CENTER, textColor=LIGHT_SLATE, fontSize=9)))
    story.append(PageBreak())

    # ================================================================
    # TABLE OF CONTENTS
    # ================================================================
    story.append(Paragraph("Table of Contents", sH1))
    story.append(Spacer(1, 4*mm))
    toc_items = [
        ("1.", "What is GrowQuest BC?"),
        ("2.", "Getting Started"),
        ("3.", "The Three Growth Realms"),
        ("4.", "How Quests Work"),
        ("5.", "Growth Stars: How Progress Works"),
        ("6.", "Self-Assessment: Checking My Growth"),
        ("7.", "Voice Input: Tap to Talk"),
        ("8.", "The Parent/Teacher Dashboard"),
        ("9.", "Growth Certificates"),
        ("10.", "Tips for Parents and Teachers"),
        ("11.", "Tips for Young Adventurers"),
        ("12.", "Frequently Asked Questions"),
        ("13.", "Curriculum Alignment Reference"),
    ]
    for num, title in toc_items:
        story.append(Paragraph(
            f'<b>{num}</b>  {title}',
            ParagraphStyle("TOC", parent=sBody, fontSize=11, leading=18,
                spaceBefore=2, spaceAfter=2)))
    story.append(PageBreak())

    # ================================================================
    # 1. WHAT IS GROWQUEST BC?
    # ================================================================
    story.append(Paragraph("1. What is GrowQuest BC?", sH1))
    story.append(Paragraph(
        "GrowQuest BC is an interactive learning app that helps children ages 4 to 12 "
        "develop real-life skills aligned with British Columbia's Core Competencies curriculum. "
        "Through fun quests, creative challenges, and thoughtful reflection, children grow "
        "their abilities in communication, thinking, and personal and social development.",
        sBody))
    story.append(Paragraph(
        "The app feels like a game but teaches like a classroom. Children choose an animal "
        "guide that evolves as they grow, complete age-appropriate quests, earn Growth Stars, "
        "and track their progress through six developmental levels. Every activity maps "
        "directly to official BC curriculum standards.",
        sBody))
    story.append(Paragraph(
        "<b>Key Features:</b>",
        sBody))
    features = [
        "Age-adapted quests for Early Years (4-6), Primary (6-9), and Intermediate (9-12)",
        "Seven sub-competencies across three core areas",
        "Voice-to-text input so young children can speak instead of type",
        "Growth Stars reward system with clear, visual progress tracking",
        "Self-assessment using official curriculum language (translated for kids)",
        "Parent/Teacher dashboard with curriculum-aligned progress reports",
        "Printable Growth Certificates for demonstrated competencies",
        "Progress saved automatically between sessions",
        "Parent PIN protection for the adult dashboard",
    ]
    for f in features:
        story.append(Paragraph(f"- {f}", sBullet))
    story.append(PageBreak())

    # ================================================================
    # 2. GETTING STARTED
    # ================================================================
    story.append(Paragraph("2. Getting Started", sH1))

    story.append(Paragraph("Step 1: Open the App", sH2))
    story.append(Paragraph(
        "Open GrowQuest BC in any web browser on a phone, tablet, or computer. "
        "The welcome screen shows the GrowQuest BC logo with a \"Begin Your Quest\" button. "
        "If you have played before, you will also see a \"Continue My Quest\" button that "
        "loads your saved progress.",
        sBody))

    story.append(Paragraph("Step 2: Enter Your Name", sH2))
    story.append(Paragraph(
        "Type your name (or a parent can help younger children). "
        "This name appears on your dashboard and on any certificates you earn.",
        sBody))

    story.append(Paragraph("Step 3: Choose Your Age Group", sH2))
    story.append(Paragraph(
        "Select the age group that fits best. This determines which quests you see:",
        sBody))
    age_data = [
        [Paragraph("<b>Age Group</b>", sTableHeader),
         Paragraph("<b>Ages</b>", sTableHeader),
         Paragraph("<b>Quest Style</b>", sTableHeader)],
        [Paragraph("Early Years", sTableBody),
         Paragraph("4-6", sTableBody),
         Paragraph("Emoji picking, drawing, voice recording, simple identification", sTableBody)],
        [Paragraph("Primary", sTableBody),
         Paragraph("6-9", sTableBody),
         Paragraph("Guided voice and text activities, structured reflection", sTableBody)],
        [Paragraph("Intermediate", sTableBody),
         Paragraph("9-12", sTableBody),
         Paragraph("Open-ended writing, multi-perspective thinking, deeper reflection", sTableBody)],
    ]
    t = Table(age_data, colWidths=[W*0.22, W*0.13, W*0.65])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BLUE),
        ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("BACKGROUND", (0,1), (-1,-1), LIGHT_BG),
        ("GRID", (0,0), (-1,-1), 0.5, BORDER),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "<i>Tip: The age group affects quest difficulty and input methods, not the competency "
        "levels. A child in any age group can reach any profile level.</i>", sNote))

    story.append(Paragraph("Step 4: Choose Your Guide", sH2))
    story.append(Paragraph(
        "Pick an animal companion from eight options: Wise Owl, Clever Fox, Kind Bear, "
        "Bright Dolphin, Bold Eagle, Gentle Deer, Team Orca, or Story Raven. "
        "Give your guide a custom name. Your guide evolves as you grow through the levels: "
        "Egg, Hatchling, Fledgling, Explorer, Champion, and Legend.",
        sBody))

    story.append(Paragraph("Step 5: Start Exploring!", sH2))
    story.append(Paragraph(
        "You arrive at your personal dashboard showing your Growth Realms, today's quests, "
        "and your current \"What I Can Do\" statements. Tap any realm or quest to begin.",
        sBody))
    story.append(PageBreak())

    # ================================================================
    # 3. THE THREE GROWTH REALMS
    # ================================================================
    story.append(Paragraph("3. The Three Growth Realms", sH1))
    story.append(Paragraph(
        "GrowQuest BC is built around British Columbia's three Core Competencies. "
        "Each competency is represented as a \"realm\" with its own theme and sub-competencies.",
        sBody))

    realms = [
        ("Echo Isles: Communication", BLUE, [
            ("Communicating", "Sharing ideas clearly through talking, writing, drawing, and listening."),
            ("Working Together", "Cooperating with others, sharing roles, and building toward shared goals."),
        ]),
        ("Wonder Peaks: Thinking", PURPLE, [
            ("Creative Thinking", "Coming up with new ideas, combining concepts, and creating things."),
            ("Thinking It Through", "Asking questions, looking at evidence, and figuring things out."),
        ]),
        ("Heartwood Grove: Personal and Social", GREEN, [
            ("Knowing Myself", "Understanding who you are, your identity, culture, and values."),
            ("Taking Care of Myself", "Managing feelings, setting goals, and making good choices."),
            ("Caring for Others", "Treating others with respect, showing empathy, and helping your community."),
        ]),
    ]

    for realm_name, color, subs in realms:
        story.append(Paragraph(realm_name, ParagraphStyle("RealmH",
            parent=sH2, textColor=color)))
        for sub_name, sub_desc in subs:
            story.append(Paragraph(
                f"<b>{sub_name}:</b> {sub_desc}", sBullet))
        story.append(Spacer(1, 3*mm))

    story.append(Paragraph(
        "Each sub-competency has six progressive levels. These levels are developmental "
        "and additive, meaning each new level builds on top of the ones before it. "
        "Reaching Level 3 does not mean you lose Level 1 and 2. "
        "Those are strengths you have built and keep.", sBody))
    story.append(PageBreak())

    # ================================================================
    # 4. HOW QUESTS WORK
    # ================================================================
    story.append(Paragraph("4. How Quests Work", sH1))
    story.append(Paragraph(
        "Quests are short activities (3 to 15 minutes) that help children practice "
        "and demonstrate their competencies. Each quest targets a specific sub-competency "
        "and profile level.",
        sBody))

    story.append(Paragraph("Quest Flow", sH2))
    steps = [
        ("1. Preview", "See what the quest is about, which realm it belongs to, how long it takes, and how many Growth Stars you can earn."),
        ("2. Do the Quest", "Complete the activity. Depending on the quest and your age group, you might pick emojis, draw on paper and describe it, speak into the microphone, or type your response."),
        ("3. Reflect", "After finishing, choose how the quest felt: Fun, Made Me Think, Challenging, or Loved It. This helps you think about your own learning."),
        ("4. Self-Assess", "Read the \"I can\" statements for the sub-competency and choose the one that sounds most like you right now. This is not a test. There is no wrong answer."),
        ("5. Earn Stars", "See a breakdown of the Growth Stars you earned and celebrate your growth!"),
    ]
    for title, desc in steps:
        story.append(Paragraph(f"<b>{title}:</b> {desc}", sBullet))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("Quest Input Types", sH2))
    input_data = [
        [Paragraph("<b>Type</b>", sTableHeader),
         Paragraph("<b>How It Works</b>", sTableHeader),
         Paragraph("<b>Best For</b>", sTableHeader)],
        [Paragraph("Emoji", sTableBody),
         Paragraph("Tap the emoji that fits", sTableBody),
         Paragraph("Early Years feeling/identification quests", sTableBody)],
        [Paragraph("Drawing", sTableBody),
         Paragraph("Draw on paper, then describe it using voice or the \"I drew it\" button", sTableBody),
         Paragraph("Creative and identity quests for younger children", sTableBody)],
        [Paragraph("Voice", sTableBody),
         Paragraph("Tap the microphone, speak, and your words appear as text", sTableBody),
         Paragraph("All ages, especially children not yet comfortable typing", sTableBody)],
        [Paragraph("Text", sTableBody),
         Paragraph("Type your response in the text area", sTableBody),
         Paragraph("Primary and Intermediate quests", sTableBody)],
    ]
    t2 = Table(input_data, colWidths=[W*0.15, W*0.45, W*0.40])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), PURPLE),
        ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("BACKGROUND", (0,1), (-1,-1), LIGHT_BG),
        ("GRID", (0,0), (-1,-1), 0.5, BORDER),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
        ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ]))
    story.append(t2)

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("Cross-Competency Quests", sH2))
    story.append(Paragraph(
        "Some quests are marked as \"cross-competency,\" meaning they build skills "
        "in more than one area. For example, the \"Picture Words\" quest develops both "
        "Communicating and Creative Thinking. When you complete a cross-competency quest, "
        "you earn bonus Growth Stars and the secondary sub-competency also receives progress.",
        sBody))
    story.append(PageBreak())

    # ================================================================
    # 5. GROWTH STARS
    # ================================================================
    story.append(Paragraph("5. Growth Stars: How Progress Works", sH1))
    story.append(Paragraph(
        "Growth Stars are the way GrowQuest measures and celebrates your progress. "
        "You earn stars every time you complete a quest, and you can see exactly "
        "how you earned each one.",
        sBody))

    story.append(Paragraph("How You Earn Stars", sH2))
    stars_data = [
        [Paragraph("<b>Action</b>", sTableHeader),
         Paragraph("<b>Stars Earned</b>", sTableHeader)],
        [Paragraph("Complete an easy quest", sTableBody),
         Paragraph("2 stars", sTableBody)],
        [Paragraph("Complete a medium quest", sTableBody),
         Paragraph("3 stars", sTableBody)],
        [Paragraph("Complete a hard quest", sTableBody),
         Paragraph("5 stars", sTableBody)],
        [Paragraph("Thoughtful reflection", sTableBody),
         Paragraph("+1 to +3 stars", sTableBody)],
        [Paragraph("Complete self-assessment", sTableBody),
         Paragraph("+1 star", sTableBody)],
        [Paragraph("Cross-competency quest", sTableBody),
         Paragraph("+1 star", sTableBody)],
    ]
    t3 = Table(stars_data, colWidths=[W*0.6, W*0.4])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), GOLD),
        ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("BACKGROUND", (0,1), (-1,-1), HexColor("#FFFBEB")),
        ("GRID", (0,0), (-1,-1), 0.5, BORDER),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
    ]))
    story.append(t3)

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("Levelling Up", sH2))
    story.append(Paragraph(
        "As you collect stars in a sub-competency, you progress toward the next level. "
        "The number of stars needed increases at higher levels:",
        sBody))

    level_data = [
        [Paragraph("<b>Level</b>", sTableHeader),
         Paragraph("<b>Name</b>", sTableHeader),
         Paragraph("<b>Stars Needed</b>", sTableHeader),
         Paragraph("<b>What It Means</b>", sTableHeader)],
        [Paragraph("1", sTableBody), Paragraph("Emerging", sTableBody),
         Paragraph("Start here", sTableBody), Paragraph("Beginning to show awareness, usually in safe, familiar settings", sTableBody)],
        [Paragraph("2", sTableBody), Paragraph("Developing", sTableBody),
         Paragraph("8 stars", sTableBody), Paragraph("Showing purposeful behaviour in familiar contexts", sTableBody)],
        [Paragraph("3", sTableBody), Paragraph("Practising", sTableBody),
         Paragraph("12 stars", sTableBody), Paragraph("Using learned strategies and taking more responsibility", sTableBody)],
        [Paragraph("4", sTableBody), Paragraph("Confident", sTableBody),
         Paragraph("16 stars", sTableBody), Paragraph("Adapting to context, showing strategic thinking", sTableBody)],
        [Paragraph("5", sTableBody), Paragraph("Extending", sTableBody),
         Paragraph("22 stars", sTableBody), Paragraph("Evaluating, thinking critically across perspectives", sTableBody)],
        [Paragraph("6", sTableBody), Paragraph("Transforming", sTableBody),
         Paragraph("28 stars", sTableBody), Paragraph("Creating sustained impact, connecting with broader networks", sTableBody)],
    ]
    t4 = Table(level_data, colWidths=[W*0.08, W*0.15, W*0.15, W*0.62])
    t4.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("BACKGROUND", (0,1), (-1,-1), LIGHT_BG),
        ("GRID", (0,0), (-1,-1), 0.5, BORDER),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
    ]))
    story.append(t4)

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "<i>Important: Levels are not tied to age or grade. A thoughtful 5-year-old might "
        "demonstrate Level 4 in one area, while an 11-year-old might be at Level 2 in another. "
        "This is completely normal and healthy.</i>", sNote))
    story.append(PageBreak())

    # ================================================================
    # 6. SELF-ASSESSMENT
    # ================================================================
    story.append(Paragraph('6. Self-Assessment: Checking My Growth', sH1))
    story.append(Paragraph(
        'After each quest, children are asked to read "I can" statements and choose '
        'the one that sounds most like them right now. This self-assessment is a core part '
        'of the BC curriculum. It is not a test and there are no wrong answers.',
        sBody))

    story.append(Paragraph("How It Works by Age Group", sH2))
    story.append(Paragraph(
        '<b>Early Years (4-6):</b> Children see three simplified options with plant emojis '
        '(seedling, growing, tree) representing the first three levels. They tap the one that feels right.',
        sBody))
    story.append(Paragraph(
        '<b>Primary and Intermediate (6-12):</b> Children see all six "I can" statements '
        'written in kid-friendly language. Levels they have previously demonstrated are '
        'highlighted in green with a "Strength I\'ve built" label, reinforcing that growth is additive.',
        sBody))
    story.append(Paragraph(
        'If a child is unsure, a button says "I\'m not sure yet, and that\'s okay!" '
        "This defaults to their current level so they still engage with the process "
        "without pressure.", sBody))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "<i>For parents and teachers: The self-assessment uses kid-friendly translations of "
        "the official BC curriculum profile language. The Parent Dashboard shows both versions "
        "side by side so you can see the curriculum alignment.</i>", sNote))
    story.append(PageBreak())

    # ================================================================
    # 7. VOICE INPUT
    # ================================================================
    story.append(Paragraph("7. Voice Input: Tap to Talk", sH1))
    story.append(Paragraph(
        "GrowQuest includes a voice-to-text feature so children who are not yet comfortable "
        "typing can speak their responses instead. This is especially useful for Early Years "
        "and Primary age groups.",
        sBody))

    story.append(Paragraph("How to Use It", sH2))
    steps_voice = [
        ("1.", "Tap the microphone button that says \"Tap to talk\""),
        ("2.", "The button turns red and says \"Recording... tap to stop\""),
        ("3.", "Speak clearly. Your words will begin appearing as text every few seconds"),
        ("4.", "When finished, tap the button again to stop recording"),
        ("5.", "A final transcription runs to capture everything accurately"),
    ]
    for num, desc in steps_voice:
        story.append(Paragraph(f"<b>{num}</b> {desc}", sBullet))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("Tips for Best Results", sH2))
    tips_voice = [
        "Speak in a quiet room with minimal background noise",
        "Hold the device about 30cm (one foot) from your mouth",
        "Speak at a normal pace. You do not need to speak slowly",
        "It is okay if the text is not perfectly accurate. The important thing is capturing the child's ideas",
        "The voice feature works on all modern browsers including Safari on iPhone and iPad",
    ]
    for tip in tips_voice:
        story.append(Paragraph(f"- {tip}", sBullet))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "<i>Technical note: Voice input uses Google's Gemini AI for transcription. "
        "Audio is processed securely and is not stored after transcription.</i>", sNote))
    story.append(PageBreak())

    # ================================================================
    # 8. PARENT/TEACHER DASHBOARD
    # ================================================================
    story.append(Paragraph("8. The Parent/Teacher Dashboard", sH1))
    story.append(Paragraph(
        "The Parent Dashboard provides a curriculum-aligned view of your child's progress. "
        "It is protected by a 4-digit PIN that you set on first access.",
        sBody))

    story.append(Paragraph("Accessing the Dashboard", sH2))
    story.append(Paragraph(
        'Tap the "Parent" button in the top-right corner of the child\'s dashboard. '
        "The first time, you will be asked to create a 4-digit PIN. On subsequent visits, "
        "enter your PIN to access the dashboard. You can change your PIN from within the dashboard.",
        sBody))

    story.append(Paragraph("What You Will See", sH2))
    dash_features = [
        ("<b>Overview:</b> Total quests completed, average profile level across all sub-competencies, and current streak"),
        ("<b>Strongest Area and Growth Opportunity:</b> Quick view of where your child is thriving and where they might focus next"),
        ("<b>Per-Competency Breakdown:</b> For each of the seven sub-competencies: current level, progress bar, stars collected, official curriculum wording alongside the kid-friendly version, previously demonstrated levels, and next goal"),
        ("<b>Recent Activity:</b> The last five quests completed in each sub-competency with dates and stars earned"),
        ("<b>Certificate Downloads:</b> Download a Growth Certificate for any sub-competency at Level 2 or above"),
        ("<b>Level Explainer:</b> A reference table explaining what each of the six levels means"),
        ("<b>Curriculum Link:</b> Direct link to the official BC curriculum website for further reading"),
    ]
    for f in dash_features:
        story.append(Paragraph(f"- {f}", sBullet))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "<i>The Parent Dashboard is the only place in the app where the official curriculum "
        "language appears. The child always sees kid-friendly translations.</i>", sNote))
    story.append(PageBreak())

    # ================================================================
    # 9. CERTIFICATES
    # ================================================================
    story.append(Paragraph("9. Growth Certificates", sH1))
    story.append(Paragraph(
        "GrowQuest generates professional, printable Growth Certificates when children "
        "demonstrate growth. These use official BC curriculum language and can be shared "
        "with teachers or displayed at home.",
        sBody))

    story.append(Paragraph("When Certificates Are Available", sH2))
    story.append(Paragraph(
        "Certificates can be downloaded in two places:", sBody))
    story.append(Paragraph(
        "- <b>Level-Up Celebration:</b> When a child reaches a new level in any sub-competency, "
        'a "Download My Certificate" button appears on the celebration screen',
        sBullet))
    story.append(Paragraph(
        "- <b>Parent Dashboard:</b> A download button appears for every sub-competency "
        "at Level 2 or above, so parents can generate certificates at any time",
        sBullet))

    story.append(Paragraph("What the Certificate Shows", sH2))
    cert_items = [
        "Child's name",
        "Sub-competency name and profile level",
        'The "I can" statement for that level (kid-friendly version)',
        "Quest titles that contributed to this growth",
        "Contexts where growth was demonstrated",
        "Date earned",
        "Avatar companion name",
        "GrowQuest BC branding with curriculum reference",
    ]
    for item in cert_items:
        story.append(Paragraph(f"- {item}", sBullet))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "Certificates download as landscape A4 PDF files, ready to print.",
        sBody))
    story.append(PageBreak())

    # ================================================================
    # 10. TIPS FOR PARENTS AND TEACHERS
    # ================================================================
    story.append(Paragraph("10. Tips for Parents and Teachers", sH1))

    tips_parent = [
        ("<b>Let children lead.</b> The app is designed for children to use independently. "
         "Resist the urge to correct or guide their self-assessment. Their reflection is more "
         "valuable than accuracy."),
        ("<b>Celebrate all growth, not just levelling up.</b> Completing a quest, reflecting "
         "thoughtfully, or trying something hard are all worth celebrating."),
        ("<b>Different levels in different areas is normal.</b> The BC curriculum explicitly "
         "states that competency profiles are developmental and non-linear. A child might be "
         "at Level 4 in Creative Thinking and Level 2 in Collaborating."),
        ("<b>Use the Parent Dashboard for conferences.</b> The dashboard shows both "
         "the official curriculum language and the kid-friendly version, making it useful "
         "for parent-teacher conversations."),
        ("<b>Print certificates and display them.</b> Physical recognition matters. "
         "Printing a certificate and putting it on the fridge makes growth feel real."),
        ("<b>Talk about the quests.</b> Ask your child what they did, what they noticed, "
         "and what they found interesting. These conversations extend the learning."),
        ("<b>The app saves progress automatically.</b> There is no save button. "
         "Progress is stored on the device. If you clear browser data, progress will be lost."),
        ("<b>Use voice input for younger children.</b> Children aged 4-6 should use the "
         "microphone button rather than typing. Their ideas matter more than their spelling."),
    ]
    for tip in tips_parent:
        story.append(Paragraph(f"- {tip}", sBullet))
    story.append(PageBreak())

    # ================================================================
    # 11. TIPS FOR YOUNG ADVENTURERS
    # ================================================================
    story.append(Paragraph("11. Tips for Young Adventurers", sH1))
    story.append(Paragraph(
        "Hello, adventurer! Here are some tips to help you get the most out of GrowQuest:",
        sBody))

    tips_kids = [
        "There are no wrong answers! Every quest is about YOUR ideas and YOUR thinking.",
        "Try quests in all three realms, not just your favourite one.",
        "When you reflect on a quest, really think about how it felt. That is how you grow!",
        "Use the microphone if you do not like typing. Your voice works great!",
        "Your guide evolves as you grow. Keep going and watch what happens!",
        "It is okay to find some quests hard. That means you are learning something new.",
        "Check your \"What I Can Do\" statements on the dashboard. You might be surprised how much you have grown!",
        "Ask a parent to print your certificates. They look great on the fridge!",
    ]
    for tip in tips_kids:
        story.append(Paragraph(f"- {tip}", sBullet))
    story.append(PageBreak())

    # ================================================================
    # 12. FAQ
    # ================================================================
    story.append(Paragraph("12. Frequently Asked Questions", sH1))

    faqs = [
        ("Is this app free?",
         "Yes, GrowQuest BC is free to use. There are no in-app purchases or advertisements."),
        ("Does it work on my phone?",
         "Yes. GrowQuest works in any modern web browser on phones, tablets, and computers. "
         "It works on iPhone, iPad, Android, and desktop browsers."),
        ("Will my child's progress be saved?",
         "Yes. Progress saves automatically to your device's browser storage. "
         "However, clearing browser data or using a different device will reset progress. "
         "Future updates will add cloud sync for multi-device support."),
        ("Can my child use it without reading?",
         "Early Years quests are designed for pre-readers. They use emoji selection, "
         "drawing prompts, and voice input. A parent may need to read the quest description "
         "aloud for the youngest children."),
        ("Is the voice feature secure?",
         "Audio recordings are sent to Google's Gemini AI for transcription and are not "
         "stored after processing. No voice data is saved in the app."),
        ("How does this align with the BC curriculum?",
         "Every quest, profile level, and self-assessment statement maps directly to the "
         "official BC Core Competencies framework. The Parent Dashboard shows both the "
         "official curriculum wording and kid-friendly translations."),
        ("Can multiple children use the same device?",
         "Currently, one profile per device browser. To use with multiple children, "
         "use different browsers or browser profiles. Multi-child support is planned."),
        ("What are Growth Stars?",
         "Growth Stars are how the app tracks progress. You earn them by completing quests, "
         "reflecting thoughtfully, and doing self-assessments. They replace traditional "
         "points or XP systems with something more meaningful and visible."),
        ("My child reached Level 3. Does that mean they have lost Level 1 and 2?",
         "No! Levels are additive. Reaching Level 3 means your child can do everything "
         "in Levels 1 and 2, plus new things. The app shows previous levels as "
         '"Strengths I\'ve built" to reinforce this.'),
    ]
    for q, a in faqs:
        story.append(Paragraph(f"<b>Q: {q}</b>", ParagraphStyle("FAQ_Q",
            parent=sBody, textColor=NAVY, spaceBefore=8, spaceAfter=2)))
        story.append(Paragraph(f"A: {a}", sBody))
    story.append(PageBreak())

    # ================================================================
    # 13. CURRICULUM ALIGNMENT REFERENCE
    # ================================================================
    story.append(Paragraph("13. Curriculum Alignment Reference", sH1))
    story.append(Paragraph(
        "The following table shows all seven sub-competencies with their official "
        "facets from the BC curriculum. For the full profile statements, visit "
        "curriculum.gov.bc.ca/competencies.",
        sBody))
    story.append(Spacer(1, 3*mm))

    curr_data = [
        [Paragraph("<b>Competency</b>", sTableHeader),
         Paragraph("<b>Sub-Competency</b>", sTableHeader),
         Paragraph("<b>Official Facets</b>", sTableHeader)],
        [Paragraph("Communication", sTableBody),
         Paragraph("Communicating", sTableBody),
         Paragraph("Connecting and Engaging with Others; Acquiring, Interpreting and Presenting Information; Focusing on Intent and Purpose", sTableBody)],
        [Paragraph("Communication", sTableBody),
         Paragraph("Collaborating", sTableBody),
         Paragraph("Working Collectively; Supporting and Encouraging Others; Shared Responsibility", sTableBody)],
        [Paragraph("Thinking", sTableBody),
         Paragraph("Creative Thinking", sTableBody),
         Paragraph("Creating and Innovating; Generating and Incubating; Evaluating and Developing", sTableBody)],
        [Paragraph("Thinking", sTableBody),
         Paragraph("Critical and Reflective Thinking", sTableBody),
         Paragraph("Analyzing and Critiquing; Questioning and Investigating; Designing and Developing; Reflecting and Assessing", sTableBody)],
        [Paragraph("Personal and Social", sTableBody),
         Paragraph("Positive Personal and Cultural Identity", sTableBody),
         Paragraph("Understanding Relationships and Cultural Contexts; Recognizing Personal Values and Choices; Identifying Personal Strengths and Abilities", sTableBody)],
        [Paragraph("Personal and Social", sTableBody),
         Paragraph("Personal Awareness and Responsibility", sTableBody),
         Paragraph("Self-Advocating; Self-Regulating; Well-Being", sTableBody)],
        [Paragraph("Personal and Social", sTableBody),
         Paragraph("Social Awareness and Responsibility", sTableBody),
         Paragraph("Building Relationships; Empathy; Contributing to Community and Caring for the Environment", sTableBody)],
    ]
    t5 = Table(curr_data, colWidths=[W*0.2, W*0.25, W*0.55])
    t5.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("BACKGROUND", (0,1), (-1,-1), LIGHT_BG),
        ("GRID", (0,0), (-1,-1), 0.5, BORDER),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
        ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ]))
    story.append(t5)

    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width="60%", thickness=0.5, color=BORDER,
        spaceAfter=8, hAlign="CENTER"))
    story.append(Paragraph(
        "GrowQuest BC is aligned with the British Columbia Core Competencies curriculum.<br/>"
        "For more information, visit: <b>curriculum.gov.bc.ca/competencies</b>",
        ParagraphStyle("FinalNote", parent=sBody, alignment=TA_CENTER,
            fontSize=9, textColor=LIGHT_SLATE)))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("Version 3.7", ParagraphStyle("VerEnd",
        parent=sBody, alignment=TA_CENTER, fontSize=8, textColor=LIGHT_SLATE)))

    # ── Build ───────────────────────────────────────────────────────
    doc.build(story, onLaterPages=add_page_number, onFirstPage=lambda c,d: None)
    print(f"User Manual saved to: {output_path}")


if __name__ == "__main__":
    output = "/mnt/user-data/outputs/GrowQuest_BC_User_Manual.pdf"
    build_manual(output)
