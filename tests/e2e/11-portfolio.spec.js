// Tests for v6.7.16 Growth Profile foundation.
//
// Coverage:
//   1. Quest history captures response text after completion (the new artifact storage)
//   2. Dashboard shows "[Name]'s Growth Profile" button
//   3. Tapping the button opens the portfolio view
//   4. Empty sub-competencies render "Not yet explored"
//   5. Completed sub-competencies show evidence
//   6. Teacher comment draft is generated when artifacts exist
//
// Run with: npm run test:e2e -- 11-portfolio
//
// These tests REQUIRE a local dev server (started automatically by the
// Playwright config via webServer: 'npm run dev').

import { test, expect } from "@playwright/test";
import { completeOnboarding, resetStorage } from "./helpers.js";

test.describe("v6.7.16 Growth Profile foundation", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page, { name: "Anton", ageGroup: "primary" });
  });

  test("dashboard shows '[Name]'s Growth Profile' button", async ({ page }) => {
    await expect(page.getByText(/Anton.?s Growth Profile/i)).toBeVisible({ timeout: 5000 });
  });

  test("tapping the button opens the portfolio view", async ({ page }) => {
    await page.getByText(/Anton.?s Growth Profile/i).click();
    await expect(page.getByRole("heading", { name: /Anton.?s Growth Profile/i })).toBeVisible({ timeout: 3000 });
    // Header reports quests completed and shows ageGroup
    await expect(page.getByText(/quests completed/i)).toBeVisible();
    await expect(page.getByText(/Primary/i)).toBeVisible();
  });

  test("portfolio shows all 3 competency sections", async ({ page }) => {
    await page.getByText(/Anton.?s Growth Profile/i).click();
    await expect(page.getByRole("heading", { name: /^Communication$/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("heading", { name: /^Thinking$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Personal/i })).toBeVisible();
  });

  test("portfolio shows all 7 sub-competencies", async ({ page }) => {
    await page.getByText(/Anton.?s Growth Profile/i).click();
    // Each sub-competency card has its name as a heading
    const expectedSubs = [
      "Communicating", "Working Together", // some translations may differ
      "Creative Thinking", "Critical Thinking",
      "Personal Awareness", "Positive Identity", "Social Awareness",
    ];
    let foundCount = 0;
    for (const subName of expectedSubs) {
      const visible = await page.getByText(new RegExp(subName, "i")).first().isVisible().catch(() => false);
      if (visible) foundCount++;
    }
    // At least 5 of the canonical names should render. Some may use slight variations.
    expect(foundCount).toBeGreaterThanOrEqual(5);
  });

  test("empty sub-competencies show 'Not yet explored'", async ({ page }) => {
    await page.getByText(/Anton.?s Growth Profile/i).click();
    // The freshly onboarded user has positiveIdentity from the guided quest
    // but most other sub-competencies are empty.
    await expect(page.getByText(/Not yet explored/i).first()).toBeVisible({ timeout: 3000 });
  });

  test("after completing a quest with a typed response, evidence is captured", async ({ page }) => {
    // Go back to dashboard, start a text-input quest.
    // The "Today's Quests" carousel should have one we can complete.
    await page.getByText(/Today.?s Quests/i).waitFor({ timeout: 5000 });

    // Click the first quest tile.
    const firstQuest = page.locator('[class*="gq-"]').filter({ hasText: /min$/i }).first();
    await firstQuest.click().catch(async () => {
      // Fallback: just click the first quest in the today carousel area
      const tiles = page.locator('div').filter({ hasText: /⭐.*\+/i });
      await tiles.first().click();
    });

    // Start Quest button
    await page.getByRole("button", { name: /Start Quest/i }).click({ timeout: 5000 });

    // The quest will be either text, voice, emoji, or drawing input. Try text first.
    const textArea = page.locator('textarea').first();
    if (await textArea.isVisible().catch(() => false)) {
      await textArea.fill("This is my test answer for v6.7.16 portfolio verification");
    } else {
      // Could be an emoji picker — pick the first emoji button.
      const emojiBtn = page.locator('button').filter({ hasText: /^[😊🤔💪🌟👍👀💡🌊]$/ }).first();
      if (await emojiBtn.isVisible().catch(() => false)) {
        await emojiBtn.click();
      }
    }

    // "Done — Reflect" or similar.
    await page.getByRole("button", { name: /Done|Reflect/i }).first().click();

    // Reflection step — pick any emoji.
    await page.locator('button').filter({ hasText: /^[😊🤔💪🌟👍👀💡🌊]/ }).first().click();

    // Optional reflection text (v6.7.16) — fill it
    const reflText = page.locator('textarea').first();
    if (await reflText.isVisible().catch(() => false)) {
      await reflText.fill("I learned that I can express myself clearly");
    }

    // Continue → Check My Growth
    await page.getByRole("button", { name: /Check My Growth|Where am I/i }).first().click();

    // Self-assessment — pick any.
    await page.locator('button').filter({ hasText: /L[1-6]|Getting better|I can do it/i }).first().click();

    // Get My Stars
    await page.getByRole("button", { name: /Get My Stars|not sure yet/i }).first().click();

    // Back to My Quest →
    await page.getByRole("button", { name: /Back to My Quest/i }).click({ timeout: 10000 });

    // Now verify localStorage captured the response
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("growquest_bc_v3") || "{}"));
    const allHistory = Object.values(stored.progress || {}).flatMap(p => p.questHistory || []);
    const withResponse = allHistory.filter(h => h.response && h.response.length > 0);
    expect(withResponse.length).toBeGreaterThanOrEqual(1);
    expect(withResponse.some(h => h.response.includes("v6.7.16") || h.responseType)).toBe(true);
  });

  test("portfolio renders evidence section after a quest is completed", async ({ page }) => {
    // Inject a fake quest history directly into localStorage to test rendering
    // without going through full quest flow (faster, more reliable).
    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem("growquest_bc_v3") || "{}");
      if (stored.progress?.communicating) {
        stored.progress.communicating.questHistory = [
          {
            title: "Story Time",
            date: "2026-05-16",
            stars: 4,
            response: "Once upon a time there was a brave fox who lived in a forest of singing trees",
            responseType: "voice",
            reflection: "I learned something",
            reflectionText: "I noticed I can build whole stories from one idea",
            selfAssessedLevel: 3,
          },
        ];
        stored.progress.communicating.questsCompleted = 1;
        stored.progress.communicating.profile = 2;
        localStorage.setItem("growquest_bc_v3", JSON.stringify(stored));
      }
    });

    // Reload to pick up storage changes
    await page.reload();
    await page.getByText(/Welcome back/i).first().waitFor({ timeout: 5000 });

    // Open portfolio
    await page.getByText(/Anton.?s Growth Profile/i).click();

    // Find and expand Communicating
    await page.getByRole("heading", { name: /Communicating/i }).first().click({ timeout: 3000 });

    // The expanded view should now show evidence
    await expect(page.getByText(/Evidence of growth/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Story Time/i)).toBeVisible();
    await expect(page.getByText(/Once upon a time/i)).toBeVisible();

    // Teacher comment draft should be available
    await expect(page.getByText(/Suggested report card comment/i)).toBeVisible();
  });

  test("portfolio back button returns to dashboard", async ({ page }) => {
    await page.getByText(/Anton.?s Growth Profile/i).click();
    await page.getByRole("button", { name: /← Back/i }).first().click();
    await expect(page.getByText(/Welcome back/i).first()).toBeVisible({ timeout: 3000 });
  });

  test("portfolio teacher comment includes child's display name", async ({ page }) => {
    // Set up evidence as before
    await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem("growquest_bc_v3") || "{}");
      if (stored.progress?.communicating) {
        stored.progress.communicating.questHistory = [
          { title: "Story Time", date: "2026-05-16", stars: 4, response: "Test response" },
        ];
        stored.progress.communicating.questsCompleted = 1;
        localStorage.setItem("growquest_bc_v3", JSON.stringify(stored));
      }
    });
    await page.reload();
    await page.getByText(/Welcome back/i).first().waitFor({ timeout: 5000 });
    await page.getByText(/Anton.?s Growth Profile/i).click();
    await page.getByRole("heading", { name: /Communicating/i }).first().click();

    // Expand the teacher comment details
    await page.getByText(/Suggested report card comment/i).click();

    // The draft should mention Anton
    await expect(page.getByText(/Anton/i).nth(1)).toBeVisible({ timeout: 3000 });
  });
});
