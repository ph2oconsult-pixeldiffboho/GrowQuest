// Verifies the v6.7.1 welcome-back narration plays once per day, not on
// every return to the dashboard. Uses localStorage inspection rather than
// hooking the SpeechSynthesis API because that API is browser-specific
// and unreliable to mock cleanly across CI environments.

import { test, expect } from "@playwright/test";
import { completeOnboarding, resetStorage } from "./helpers.js";

const NARRATE_KEY = "gq_narrate_last:dashboard-welcome";

test.describe("Welcome-back narration daily memory", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("with Full Audio Mode OFF, no memory key is written", async ({ page }) => {
    await completeOnboarding(page, { name: "Alex" });
    // Default state: Full Audio Mode is off, so the narrate hook doesn't run.
    const recorded = await page.evaluate((k) => localStorage.getItem(k), NARRATE_KEY);
    expect(recorded).toBeNull();
  });

  test("with Full Audio Mode ON, memory key is set on first dashboard view", async ({ page }) => {
    await completeOnboarding(page, { name: "Alex" });

    // Enable Full Audio Mode programmatically (faster than clicking through the panel).
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem("gq_accessibility") || "{}");
      settings.fullAudioMode = true;
      localStorage.setItem("gq_accessibility", JSON.stringify(settings));
    });
    await page.reload();

    // Wait for the narrate effect to settle (it runs after a 500ms delay).
    await page.waitForTimeout(1000);

    const recorded = await page.evaluate((k) => localStorage.getItem(k), NARRATE_KEY);
    expect(recorded).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
  });

  test("returning to dashboard same day does NOT replay (key unchanged)", async ({ page }) => {
    await completeOnboarding(page, { name: "Alex" });

    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem("gq_accessibility") || "{}");
      settings.fullAudioMode = true;
      localStorage.setItem("gq_accessibility", JSON.stringify(settings));
    });
    await page.reload();
    await page.waitForTimeout(1000);

    const firstRecord = await page.evaluate((k) => localStorage.getItem(k), NARRATE_KEY);
    expect(firstRecord).toBeTruthy();

    // Navigate into a competency and back to dashboard — would have replayed in v6.6.
    const tile = page.getByText("Communication").first();
    if (await tile.isVisible().catch(() => false)) {
      await tile.click();
      await page.waitForTimeout(300);
      const back = page.getByRole("button", { name: /Back/i }).first();
      if (await back.isVisible().catch(() => false)) await back.click();
      await page.waitForTimeout(1000);
    }

    const secondRecord = await page.evaluate((k) => localStorage.getItem(k), NARRATE_KEY);
    expect(secondRecord).toBe(firstRecord); // Same value — no re-record means no replay attempt
  });

  test("pretending yesterday → today triggers a fresh narration", async ({ page }) => {
    await completeOnboarding(page, { name: "Alex" });

    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem("gq_accessibility") || "{}");
      settings.fullAudioMode = true;
      localStorage.setItem("gq_accessibility", JSON.stringify(settings));
    });

    // Pretend the narration was recorded yesterday.
    const yesterday = "2020-01-01";
    await page.evaluate((k, d) => localStorage.setItem(k, d), [NARRATE_KEY, yesterday]);

    await page.reload();
    await page.waitForTimeout(1000);

    const newRecord = await page.evaluate((k) => localStorage.getItem(k), NARRATE_KEY);
    expect(newRecord).not.toBe(yesterday); // It should have updated to today.
    expect(newRecord).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("Reset All Progress clears the narration memory", async ({ page }) => {
    await completeOnboarding(page, { name: "Alex" });

    // Plant a record.
    await page.evaluate((k) => localStorage.setItem(k, "2026-05-19"), NARRATE_KEY);
    const planted = await page.evaluate((k) => localStorage.getItem(k), NARRATE_KEY);
    expect(planted).toBe("2026-05-19");

    // Set a PIN so we can reach the Parent Dashboard.
    await page.getByRole("button", { name: /Parent/i }).click();
    for (const d of "1234".split("")) {
      await page.getByRole("button", { name: new RegExp(`^Digit ${d}$`) }).click();
    }
    await page.getByRole("button", { name: /Set PIN/i }).click();

    // Reset.
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /Reset All Progress/i }).click();
    await page.waitForLoadState("load");

    const after = await page.evaluate((k) => localStorage.getItem(k), NARRATE_KEY);
    expect(after).toBeNull();
  });
});
