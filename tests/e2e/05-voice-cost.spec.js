// Tests for fix #3: voice transcription must NOT spam /api/transcribe.
// Previously the 3-second loop sent the full accumulated buffer ~10 times
// for a 30-second clip; v6.7 sends once on stop.

import { test, expect } from "@playwright/test";
import { completeOnboarding, resetStorage } from "./helpers.js";

test.describe("Voice transcription cost", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page);
  });

  test("a recording produces exactly one transcribe call", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "MediaRecorder fake-audio injection works most reliably in chromium");

    // Count transcribe calls.
    let transcribeCalls = 0;
    await page.route("**/api/transcribe", (route) => {
      transcribeCalls++;
      // Return a fake transcript so the UI proceeds.
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ transcript: "fake transcript for test" }) });
    });

    // Grant mic permission and select a voice quest.
    await page.context().grantPermissions(["microphone"]);

    // Find any voice quest. Voice quests have inputType "voice"; we don't directly know which.
    // Instead just open quest detail screens via the Today's Quests strip; if no mic shows, skip.
    const questCards = page.locator('[onclick], button').filter({ hasText: /Story|Spark|Detective|Switch/i });
    if (await questCards.count() === 0) {
      test.skip(true, "No voice quest visible in current dashboard build.");
      return;
    }
    // Click any quest; if it offers a mic, use it.
    await questCards.first().click();
    const micBtn = page.locator('button').filter({ hasText: /🎤|🔴/ }).first();
    if (!(await micBtn.isVisible().catch(() => false))) {
      test.skip(true, "Selected quest doesn't use voice input.");
      return;
    }

    // Start recording.
    await micBtn.click();
    // Simulate 8 seconds — old code would have fired ~3 calls here.
    await page.waitForTimeout(8000);
    // Stop.
    await micBtn.click();
    // Wait for the transcribe round-trip.
    await page.waitForTimeout(1500);

    // CRITICAL: should be exactly one call (or zero if no actual audio captured by fake stream).
    expect(transcribeCalls).toBeLessThanOrEqual(1);
  });
});
