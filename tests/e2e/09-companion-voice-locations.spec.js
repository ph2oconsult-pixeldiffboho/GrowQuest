// Tests for the v6.7.3 companion voice picker showing up in the right
// places (consent, welcome, guided onboarding "Start" gate, dashboard
// 🔊 button) and the deferred-narration behaviour.

import { test, expect } from "@playwright/test";
import { resetStorage } from "./helpers.js";

test.describe("Companion voice picker locations", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("Consent screen shows the companion voice picker", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Companion voice/i).first()).toBeVisible();
    await expect(page.getByLabel(/Companion voice/i)).toBeVisible();
  });

  test("Picking a voice on consent persists across reload", async ({ page }) => {
    await page.goto("/");
    const select = page.getByLabel(/Companion voice/i);
    const options = await select.locator("option").allTextContents();
    const realOptions = options.filter(o => !/Auto-pick/i.test(o));
    if (realOptions.length === 0) {
      test.skip(true, "Headless browser exposes no system voices.");
      return;
    }
    await select.selectOption({ index: 1 });
    const saved = await page.evaluate(() => localStorage.getItem("gq_voice_name"));
    expect(saved).toBeTruthy();

    // Reload — value should be remembered (even though consent is not yet given).
    await page.reload();
    const stillSaved = await page.evaluate(() => localStorage.getItem("gq_voice_name"));
    expect(stillSaved).toBe(saved);
  });

  test("Welcome screen has an expandable voice picker", async ({ page }) => {
    // Get past consent first.
    await page.goto("/");
    const checkboxes = page.locator('input[type="checkbox"]');
    for (let i = 0; i < 3; i++) await checkboxes.nth(i).check();
    await page.getByRole("button", { name: /I Agree/i }).click();

    // Look for the "Companion voice: Auto-pick" toggle.
    const voiceToggle = page.getByRole("button", { name: /Toggle companion voice picker/i });
    await expect(voiceToggle).toBeVisible();
    await voiceToggle.click();
    await expect(page.getByLabel(/Companion voice/i)).toBeVisible();
  });

  test("Guided onboarding waits for explicit Start before narrating", async ({ page }) => {
    // Walk through to the guided onboarding screen.
    await page.goto("/");
    const checkboxes = page.locator('input[type="checkbox"]');
    for (let i = 0; i < 3; i++) await checkboxes.nth(i).check();
    await page.getByRole("button", { name: /I Agree/i }).click();
    await page.getByRole("button", { name: /(Begin|New Adventure)/i }).click();
    await page.locator('input[type="text"]').fill("Voicetest");
    await page.getByRole("button", { name: /That.?s Me|Continue/i }).click();
    await page.getByRole("button", { name: /Primary/i }).click();
    // Avatar.
    await page.locator('button').filter({ hasText: /Owl|Fox|Bear|Dolphin|Eagle|Deer|Orca|Raven/i }).first().click();
    await page.locator('input[type="text"]').fill("Buddy");
    await page.getByRole("button", { name: /Continue|Done|Start/i }).click();

    // The Ready-to-begin overlay should be visible.
    await expect(page.getByRole("heading", { name: /Ready to meet/i })).toBeVisible();
    await expect(page.getByLabel(/Companion voice/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Start/i })).toBeVisible();
  });

  test("Dashboard header has a 🔊 button that opens voice picker", async ({ page }) => {
    // Walk through to the dashboard.
    await page.goto("/");
    const checkboxes = page.locator('input[type="checkbox"]');
    for (let i = 0; i < 3; i++) await checkboxes.nth(i).check();
    await page.getByRole("button", { name: /I Agree/i }).click();
    await page.getByRole("button", { name: /(Begin|New Adventure)/i }).click();
    await page.locator('input[type="text"]').fill("Headertest");
    await page.getByRole("button", { name: /That.?s Me|Continue/i }).click();
    await page.getByRole("button", { name: /Primary/i }).click();
    await page.locator('button').filter({ hasText: /Owl|Fox|Bear|Dolphin|Eagle|Deer|Orca|Raven/i }).first().click();
    await page.locator('input[type="text"]').fill("Buddy");
    await page.getByRole("button", { name: /Continue|Done|Start/i }).click();

    // Click Start on the Ready overlay.
    const readyStart = page.getByRole("button", { name: /^Start/ });
    if (await readyStart.isVisible().catch(() => false)) {
      await readyStart.click();
    }
    // Click through guided onboarding to the dashboard.
    for (let i = 0; i < 12; i++) {
      const nextBtn = page.getByRole("button", { name: /Next|Continue|Got it|Start|Skip|Let's go|Awesome/i }).first();
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(200);
      } else { break; }
    }

    await expect(page.getByText(/Today.?s Quests/i)).toBeVisible({ timeout: 10000 });

    // The 🔊 button should now be in the header.
    const voiceBtn = page.getByRole("button", { name: /Change companion voice/i });
    await expect(voiceBtn).toBeVisible();
    await voiceBtn.click();

    // The popover with the voice picker should appear.
    await expect(page.getByText(/Companion voice/i).first()).toBeVisible();
    await expect(page.getByLabel(/Companion voice/i)).toBeVisible();
  });
});
