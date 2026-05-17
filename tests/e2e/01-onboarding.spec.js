// Verifies first-run flow: consent → onboarding → dashboard.
// This is the most important happy-path; if this breaks nothing else matters.

import { test, expect } from "@playwright/test";
import { completeOnboarding, resetStorage } from "./helpers.js";

test.describe("Onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("consent screen requires all three checkboxes", async ({ page }) => {
    await page.goto("/");
    const continueBtn = page.getByRole("button", { name: /I Agree/i });
    await expect(continueBtn).toBeDisabled();

    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await expect(continueBtn).toBeDisabled();

    await checkboxes.nth(1).check();
    await expect(continueBtn).toBeDisabled();

    await checkboxes.nth(2).check();
    await expect(continueBtn).toBeEnabled();
  });

  test("consent screen has 9 expandable privacy sections", async ({ page }) => {
    await page.goto("/");
    // Section titles are buttons; count those that look like privacy questions.
    const sectionButtons = page.locator('button').filter({ hasText: /\?$/ });
    await expect(sectionButtons).toHaveCount(9);
  });

  test("happy path lands on dashboard", async ({ page }) => {
    await completeOnboarding(page, { name: "Sam", ageGroup: "primary" });
    await expect(page.getByText("Sam")).toBeVisible();
    await expect(page.getByText(/Today.?s Quests/i)).toBeVisible();
  });

  test("returning user gets continue option", async ({ page, context }) => {
    await completeOnboarding(page, { name: "Sam" });
    // Reload — should remember the user.
    await page.reload();
    // Welcome screen with continue option (no consent re-prompt).
    const continueBtn = page.getByRole("button").filter({ hasText: /Continue Adventure|Continue/i });
    await expect(continueBtn.first()).toBeVisible({ timeout: 5000 });
  });
});
