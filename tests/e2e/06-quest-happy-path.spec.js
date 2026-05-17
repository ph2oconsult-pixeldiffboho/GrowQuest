// Generic happy-path: complete a quest, see stars, see dashboard update.
// If this breaks, almost everything else has broken too.

import { test, expect } from "@playwright/test";
import { completeOnboarding, resetStorage } from "./helpers.js";

test.describe("Quest completion happy path", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page, { name: "Quester" });
  });

  test("dashboard shows three competency realms", async ({ page }) => {
    // The dashboard renders three "competency tile" buttons.
    await expect(page.getByText("Communication")).toBeVisible();
    await expect(page.getByText("Thinking")).toBeVisible();
    await expect(page.getByText("Personal & Social")).toBeVisible();
  });

  test("can navigate into a competency detail screen", async ({ page }) => {
    // Click a competency tile.
    await page.getByText("Communication").first().click();
    await expect(page.getByText(/Echo Isles/i)).toBeVisible();
    // Should list sub-competencies.
    await expect(page.getByText(/Communicating|Working Together/i)).toBeVisible();
  });

  test("guided onboarding awarded first quest stars", async ({ page }) => {
    // The guided onboarding quest contributes stars in positiveIdentity.
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("growquest_bc_v3") || "{}"));
    expect(stored.progress?.positiveIdentity?.questsCompleted).toBeGreaterThanOrEqual(1);
  });

  test("avatar level is at least 1 after onboarding", async ({ page }) => {
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("growquest_bc_v3") || "{}"));
    const levels = Object.values(stored.progress || {}).map((p) => p.profile);
    expect(Math.max(...levels, 0)).toBeGreaterThanOrEqual(1);
  });
});
