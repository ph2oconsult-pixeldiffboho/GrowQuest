// Tests for the v6.7.2 Parent Preferences hub.

import { test, expect } from "@playwright/test";
import { completeOnboarding, enterPin, resetStorage } from "./helpers.js";

async function openParentDashboard(page) {
  await page.getByRole("button", { name: /Parent/i }).click();
  await enterPin(page, "1234");
  await page.getByRole("button", { name: /Set PIN/i }).click();
}

test.describe("Parent Preferences hub", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page, { name: "Pref Tester" });
  });

  test("Preferences card is visible in parent dashboard", async ({ page }) => {
    await openParentDashboard(page);
    await expect(page.getByRole("heading", { name: /Preferences/i })).toBeVisible();
  });

  test("Preferences expands and shows voice, rate, pitch, theme, a11y", async ({ page }) => {
    await openParentDashboard(page);
    await page.getByRole("button", { name: /Toggle preferences panel/i }).click();

    await expect(page.getByText(/Narrator voice/i)).toBeVisible();
    await expect(page.getByLabel("Narrator voice")).toBeVisible();
    await expect(page.getByLabel("Narration speech rate")).toBeVisible();
    await expect(page.getByLabel("Narration speech pitch")).toBeVisible();
    await expect(page.getByLabel(/Light theme/i)).toBeVisible();
    await expect(page.getByLabel(/Dark theme/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Open.*Accessibility/i })).toBeVisible();
  });

  test("changing the speech rate persists to localStorage", async ({ page }) => {
    await openParentDashboard(page);
    await page.getByRole("button", { name: /Toggle preferences panel/i }).click();

    const slider = page.getByLabel("Narration speech rate");
    await slider.evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, "1.25");

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("gq_accessibility") || "{}"));
    expect(stored.speechRate).toBeCloseTo(1.25, 2);
  });

  test("changing pitch persists to localStorage", async ({ page }) => {
    await openParentDashboard(page);
    await page.getByRole("button", { name: /Toggle preferences panel/i }).click();

    const slider = page.getByLabel("Narration speech pitch");
    await slider.evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, "1.5");

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("gq_accessibility") || "{}"));
    expect(stored.speechPitch).toBeCloseTo(1.5, 2);
  });

  test("selecting a voice persists to localStorage", async ({ page }) => {
    await openParentDashboard(page);
    await page.getByRole("button", { name: /Toggle preferences panel/i }).click();

    const select = page.getByLabel("Narrator voice");
    // Pick any non-empty option (the auto-pick option is empty value).
    const options = await select.locator("option").allTextContents();
    const realOptions = options.filter(o => !/Auto-pick/i.test(o));
    if (realOptions.length === 0) {
      test.skip(true, "Headless browser exposes no system voices.");
      return;
    }
    await select.selectOption({ index: 1 }); // first non-default option

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("gq_accessibility") || "{}"));
    expect(stored.voiceName).toBeTruthy();
  });

  test("theme toggle in preferences mirrors header toggle", async ({ page }) => {
    await openParentDashboard(page);
    await page.getByRole("button", { name: /Toggle preferences panel/i }).click();

    const initialTheme = await page.evaluate(() => localStorage.getItem("gq_theme"));
    // Click the OPPOSITE of current.
    if (initialTheme === "dark" || initialTheme === null) {
      await page.getByLabel(/Light theme/i).click();
      const after = await page.evaluate(() => localStorage.getItem("gq_theme"));
      expect(after).toBe("light");
    } else {
      await page.getByLabel(/Dark theme/i).click();
      const after = await page.evaluate(() => localStorage.getItem("gq_theme"));
      expect(after).toBe("dark");
    }
  });

  test("Open Accessibility Settings opens the panel without closing parent view", async ({ page }) => {
    await openParentDashboard(page);
    await page.getByRole("button", { name: /Toggle preferences panel/i }).click();
    await page.getByRole("button", { name: /Open.*Accessibility/i }).click();

    // The accessibility panel should be open (its heading "Settings" or similar should appear).
    // Be lenient on heading text — just look for some panel-specific control.
    await expect(page.getByText(/Text Size|Audio Narration|Dyslexia/i).first()).toBeVisible();
    // And the parent dashboard's Reset All Progress button should still exist in DOM (parent view not closed).
    // It may be visually hidden behind the panel but the element should be present.
    expect(await page.locator("text=/Reset All Progress/i").count()).toBeGreaterThan(0);
  });
});
