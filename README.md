# GrowQuest BC 🌿

**An interactive growth journey app aligned with British Columbia's Core Competencies curriculum for ages 4–12.**

GrowQuest BC makes the official BC Core Competencies come alive through a joyful, game-like personal growth journey. Children create an avatar companion that evolves as they develop real skills across Communication, Thinking, and Personal & Social competencies.

## What Makes This Different

### Evidence-Based Progression (Not XP Bars)
Traditional educational games use linear XP: do stuff → fill bar → level up. But children don't develop linearly. A child might show Profile 4 communication when talking about something they love, but Profile 2 in an unfamiliar setting. That's normal.

GrowQuest tracks **evidence of demonstration across contexts**. The app recognises patterns over time — when a child consistently shows a competency level across multiple settings, *that's* when growth is acknowledged.

### Adaptive Rewards That Mature With the Child
The reward system has four tiers that evolve based on demonstrated development, not age:

| Tier | Name | When | What |
|------|------|------|------|
| 1 | **Sensory Celebration** | Early/emergent demonstrations | Confetti, particles, avatar animations |
| 2 | **Story & Collection** | Developing/practising | Growth gems, constellation map, journal prompts |
| 3 | **Recognition & Artefacts** | Confident/extending | Printable certificates, portfolio entries, parent sharing |
| 4 | **Mentorship & Legacy** | Transforming | Create quests for others, exportable portfolio |

### Printable Growth Certificates
When a child demonstrates consistent growth (evidence across 2+ contexts, 4+ demonstrations), they earn a **Growth Certificate** — a professionally designed PDF with:
- Their name and avatar companion
- The specific sub-competency and profile level
- The official "I can…" statement from the BC curriculum
- Evidence summary (quest titles, contexts, reflection quotes)
- Curriculum-aligned language a teacher would recognise

### Seven Recognition Types (Not Just "Level Up")
Instead of a single "Profile Up!" moment, the app celebrates different kinds of growth:

- 🌱 **First Steps** — first demonstration at a new level
- 🌿 **Growing Roots** — shown across 3+ different contexts
- 🌳 **Steady Growth** — becoming a real strength (5+ demonstrations)
- ⭐ **New Heights** — consistent new profile level (certificate-eligible)
- 🚀 **Brave Explorer** — tried something beyond comfort zone
- 🔗 **Roots Connect** — growth in one area helping another
- 💎 **Deep Roots** — deepening an existing strength
- 🌟 **Guide Light** — ready to mentor others

## BC Core Competencies Coverage

All three competencies and seven sub-competencies with official six-level progressive profiles:

**Communication**
- Communicating (6 profiles)
- Collaborating (6 profiles)

**Thinking**
- Creative Thinking (6 profiles)
- Critical & Reflective Thinking (6 profiles)

**Personal & Social**
- Positive Personal & Cultural Identity (6 profiles)
- Personal Awareness & Responsibility (6 profiles)
- Social Awareness & Responsibility (6 profiles)

Source: [curriculum.gov.bc.ca/competencies](https://curriculum.gov.bc.ca/competencies)

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: CSS-in-JS (inline styles with design tokens)
- **Fonts**: Fredoka (headings) + Nunito (body)
- **Certificates**: jsPDF (client-side PDF generation — no server needed)
- **Deployment**: Vercel (everything runs in the browser)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
growquest-bc/
├── public/
│   └── favicon.svg
├── src/
│   ├── data/
│   │   ├── curriculum.js          # BC competencies, profiles, avatars
│   │   └── quests.js              # Quest library with curriculum mapping
│   ├── engine/
│   │   └── progression.js         # Evidence-based progression engine
│   ├── certificates/
│   │   ├── generateCertificate.js # jsPDF certificate generator (client-side)
│   │   └── CertificatePreview.jsx # Preview overlay + download button
│   ├── App.jsx                    # Main app with all screens
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles & animations
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Roadmap

- [ ] Persistent storage (Supabase integration)
- [ ] Parent/teacher dashboard with curriculum-aligned summaries
- [ ] PWA support for offline-first mobile experience
- [ ] Voice input/output for younger children
- [ ] Constellation map visual (growth gems as stars)
- [ ] Quest creator mode for Tier 4 children
- [ ] School licensing and classroom integration
- [ ] Grades 8–12 expansion

## Curriculum Alignment

Every quest maps to specific sub-competencies and profile levels. Cross-competency quests explicitly show interconnections (e.g., a collaboration activity that also builds social awareness). Self-assessment uses the official profile language so students reflect using curriculum terminology.

## Privacy & Safety

Designed with COPPA and PIPEDA compliance in mind:
- No data collection without parental consent
- All progress stored locally by default
- No social features without explicit opt-in
- Age-appropriate content only

## License

MIT

---

*Built for BC families and educators who want the Core Competencies to come alive in a joyful, interactive way that supports real personal growth.*
