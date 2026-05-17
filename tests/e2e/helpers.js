// Helpers shared across e2e tests.

import { expect } from "@playwright/test";

/**
 * Walk through consent + onboarding to land on the dashboard.
 * Most tests start from a fresh user; this sets that up.
 */
export async function completeOnboarding(page, { name = "Tester", ageGroup = "primary" } = {}) {
  await page.goto("/");

  // Consent screen — tick all 3 checkboxes, click continue.
  await expect(page.getByRole("heading", { name: /Privacy.*Consent/i })).toBeVisible();
  const checkboxes = page.locator('input[type="checkbox"]');
  await expect(checkboxes).toHaveCount(3);
  for (let i = 0; i < 3; i++) await checkboxes.nth(i).check();
  await page.getByRole("button", { name: /I Agree/i }).click();

  // Welcome screen — start fresh.
  await page.getByRole("button", { name: /(Begin|New Adventure)/i }).click();

  // Onboarding: name → age.
  await page.locator('input[type="text"]').fill(name);
  await page.getByRole("button", { name: /That.?s Me|Continue/i }).click();
  const ageButton = page.getByRole("button", { name: new RegExp(ageGroup === "early" ? "Early Years" : ageGroup === "primary" ? "Primary" : "Intermediate", "i") });
  await ageButton.click();

  // Avatar pick (any one).
  await expect(page.getByText(/Pick a Companion|Choose your companion/i)).toBeVisible({ timeout: 5000 });
  // The avatar grid renders 8 options; pick the first.
  await page.locator('button').filter({ hasText: /Owl|Fox|Bear|Dolphin|Eagle|Deer|Orca|Raven/i }).first().click();
  // Companion name input.
  await page.locator('input[type="text"]').fill("Buddy");
  await page.getByRole("button", { name: /Continue|Done|Start/i }).click();

  // Guided onboarding — click through whatever steps exist until dashboard.
  // The guided flow may have a few next/continue steps and a skippable first quest.
  for (let i = 0; i < 12; i++) {
    const nextBtn = page.getByRole("button", { name: /Next|Continue|Got it|Start|Skip/i }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(200);
    } else {
      break;
    }
  }

  // Land on dashboard.
  await expect(page.getByText(/Welcome back/i).first()).toBeVisible({ timeout: 10000 });
}

/**
 * Tap the four-digit PIN keypad to enter a code.
 */
export async function enterPin(page, pin) {
  for (const digit of pin.split("")) {
    await page.getByRole("button", { name: new RegExp(`^Digit ${digit}$`) }).click();
  }
}

/**
 * Clear all localStorage so each test starts fresh.
 */
export async function resetStorage(page) {
  await page.goto("/");
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
  });
}
