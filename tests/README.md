# GrowQuest BC tests

Two test layers, both run on every push via `.github/workflows/ci.yml`.

## Unit tests (`tests/unit/`)

Pure Node.js, no browser. Cover the cheap-to-test, high-leverage logic
that doesn't depend on the React tree:

- `certificate.test.mjs` — PDF generation handles all evidence shapes
  (legacy contexts, new questDates, empty, both populated). 5 tests.
- `crypto.test.mjs` — share-code encryption round-trips, rejects wrong
  class codes, detects tampering, normalises whitespace, handles legacy
  base64 codes. 15 tests.
- `pin-hash.test.mjs` — PIN hashing is stable, salted, and the legacy
  plaintext PIN migration logic works. 8 tests.
- `api.test.mjs` — API routes honour ALLOWED_ORIGINS, reject disallowed
  origins, return correct status codes, and rate-limit per IP. 11 tests.

**Run locally:**

```bash
npm run test:unit
```

These take under 2 seconds total. If they fail, the matching e2e test
will also fail — start here when debugging.

## End-to-end tests (`tests/e2e/`)

Playwright + Chromium. Boot the dev server and walk through the app as
a real user would. Cover the parts of the smoke-test checklist that
can be automated.

- `01-onboarding.spec.js` — consent screen behaviour and full happy
  path from first visit to dashboard.
- `02-parent-pin.spec.js` — PIN gate has no bypass buttons, rate limit
  triggers, PIN is hashed in localStorage, change/remove flows require
  the current PIN.
- `03-share-encryption.spec.js` — share codes ask for class code, are
  encrypted (no plaintext name in output), reject empty/short class
  codes, round-trip correctly.
- `04-certificate-truth.spec.js` — downloaded PDFs no longer contain
  the fabricated "with_family" context label.
- `05-voice-cost.spec.js` — voice transcription calls `/api/transcribe`
  at most once per recording (was 5-10× in v6.6).
- `06-quest-happy-path.spec.js` — dashboard, navigation, and progress
  persistence work end-to-end.

**Run locally:**

```bash
npm install                       # one-time
npx playwright install chromium   # one-time (~150 MB download)
npm run test:e2e                  # headless
npm run test:e2e:headed           # watch the browser
npm run test:e2e:ui               # interactive UI mode (good for debugging)
```

If the dev server is already running on port 3000, Playwright reuses it.
Otherwise it boots one for the test run.

## All tests

```bash
npm test
```

## CI

`.github/workflows/ci.yml` runs both layers on every push and PR
against `main`. The unit tests run first (fast feedback). E2E follows.
Failure uploads the Playwright HTML report as a workflow artifact you
can download from the GitHub Actions run.

## Adding new tests

Pattern for a new e2e test:

```js
import { test, expect } from "@playwright/test";
import { completeOnboarding, resetStorage } from "./helpers.js";

test.describe("my new feature", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page);
  });

  test("does the thing", async ({ page }) => {
    // …
  });
});
```

For unit tests, just add a `.test.mjs` file under `tests/unit/`. The
runner picks it up automatically.

## What's deliberately not covered

- Visual / pixel comparisons. They're noisy and out of scope right now.
  Add `@playwright/test`'s `toHaveScreenshot` later if you need them.
- Mobile WebKit. The config has a commented-out project for iPhone 13;
  uncomment when ready to add iOS-specific flows.
- Real Gemini calls. The voice test mocks `/api/transcribe`; the story
  generation is not tested end-to-end. Doing so requires the API key in
  CI secrets and incurs Gemini cost on every run.
- Accessibility coverage. Add `@axe-core/playwright` as a follow-up.
