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
├── .github/
│   └── workflows/
│       └── ci.yml                 # Runs unit + e2e tests on every push
├── api/
│   ├── transcribe.js              # Voice transcription via Gemini (CORS-locked)
│   └── story.js                   # AI story generation (CORS-locked)
├── public/
│   └── favicon.svg
├── src/
│   ├── data/
│   │   └── translations.js        # i18n strings (en + fr)
│   ├── certificates/
│   │   ├── generateCertificate.js # jsPDF certificate generator (client-side)
│   │   ├── generateReport.js      # Student Learning Report (BC Reporting Policy)
│   │   └── generateManual.js      # Printable user manual
│   ├── App.jsx                    # Main app with all screens (~960 lines)
│   ├── TeacherDashboard.jsx       # Class management, encrypted share codes
│   ├── AccessibilityPanel.jsx     # 7 accessibility modes
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles & animations
├── tests/
│   ├── unit/                      # Pure Node tests (39 assertions, <2s)
│   ├── e2e/                       # Playwright browser tests
│   └── README.md                  # How to run and add tests
├── archive/                       # Files preserved for future decisions
│   ├── README.md                  # Explains what's here and why
│   └── progression.js.deferred    # Evidence-based engine (pending decision)
├── index.html
├── package.json
├── playwright.config.js
├── vercel.json
├── vite.config.js
└── README.md
```

> **Note:** The architecture differs from earlier README descriptions. Curriculum data and the quest library are currently inlined inside `App.jsx` rather than in separate `data/` modules. The evidence-based progression engine is preserved in `archive/` pending a decision to either wire it in or update the marketing copy. See `archive/README.md`.

## Testing

Two layers, both gated by CI:

```bash
npm run test:unit       # ~2 seconds, no browser needed
npm run test:e2e        # Playwright + Chromium, ~30 seconds
npm test                # both
```

See `tests/README.md` for details. On first run, install Chromium:

```bash
npx playwright install chromium
```


## Environment Variables

Set these in Vercel (Project Settings → Environment Variables). All are server-side only — none are exposed to the browser.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Used by `/api/transcribe` (speech-to-text) and `/api/story` (story generation). |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of origins permitted to call the API. e.g. `https://grow-quest-six.vercel.app`. Without this set, all API routes reject browser requests in production. |
| `ELEVENLABS_API_KEY` | Optional | Enables premium voice on `/api/tts`. Without it, the companion falls back to the device's built-in browser voice. |
| `ELEVENLABS_DEFAULT_VOICE_ID` | Optional | Default voice id when the client doesn't specify one. Defaults to Rachel (`21m00Tcm4TlvDq8ikWAM`). |
| `ELEVENLABS_DEFAULT_MODEL` | Optional | One of `eleven_flash_v2_5` (default, cheaper), `eleven_flash_v2`, `eleven_turbo_v2_5`, `eleven_multilingual_v2`. |


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
