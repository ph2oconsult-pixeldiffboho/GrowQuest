# archive/

Files preserved for a future decision but **not** part of the running app.
Nothing here is imported by `src/`.

## progression.js.deferred

The evidence-based progression engine described in the project README.
Tracks demonstrations across contexts (solo, family, peers, classroom,
community) and detects 7 named recognition types beyond simple level-up:
cross-context demonstration, profile emergence, deepening, stretch
moments, etc.

This file is well-structured and complete. It was never wired into the
running app — the live `src/App.jsx` uses a linear stars-to-level model
(`STARS_THRESH = [8,12,16,22,28,35]`) instead, which is the model the
README claims to have replaced.

**Decision pending (continuation prompt #5):**

- Option A — *Wire it in.* Capture context in the quest flow, replace
  `checkProfileUp` with `detectRecognitions` in `qDone`. Estimated
  effort: ~12 hours. This restores the central differentiator the
  README and pitch deck rely on.

- Option B — *Update the marketing.* Move this file out of the repo,
  update README/pitch deck to describe the actual XP-bar mechanic.
  Faster but sacrifices the "evidence infrastructure" positioning.

Until that decision is made, this file stays here. Do not import from
`archive/` — Vite is configured to build `src/` only.
