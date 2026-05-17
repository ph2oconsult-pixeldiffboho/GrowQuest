// Tests for the fix #1 work: PIN can't be bypassed, hashing works,
// rate limit triggers, and change/remove flows require the current PIN.

import { test, expect } from "@playwright/test";
import { completeOnboarding, enterPin, resetStorage } from "./helpers.js";

test.describe("Parent PIN security", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page);
  });

  test("first-run PIN setup, then re-entry required", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await expect(page.getByRole("heading", { name: /Set Up Parent PIN/i })).toBeVisible();

    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN and Continue/i }).click();

    // Lands in parent dashboard.
    await expect(page.getByText(/Growth Journey/i)).toBeVisible({ timeout: 5000 });

    // Back to child dashboard.
    await page.getByRole("button", { name: /Back to/i }).click();
    await expect(page.getByText(/Today.?s Quests/i)).toBeVisible();

    // Re-enter parent — PIN should be required, NOT bypassed.
    await page.getByRole("button", { name: /Parent/i }).click();
    await expect(page.getByRole("heading", { name: /Parent Area/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Remove PIN/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Change PIN/i })).not.toBeVisible();
  });

  test("locked screen has NO bypass buttons (the v6.6 vulnerability)", async ({ page }) => {
    // Set a PIN.
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "9999");
    await page.getByRole("button", { name: /Set PIN/i }).click();
    await page.getByRole("button", { name: /Back to/i }).click();

    // Return to locked PIN screen.
    await page.getByRole("button", { name: /Parent/i }).click();

    // CRITICAL: neither Change nor Remove should appear here.
    await expect(page.getByText(/Remove PIN/)).not.toBeVisible();
    await expect(page.getByText(/Change PIN/)).not.toBeVisible();
  });

  test("five wrong PINs triggers 30-second lockout", async ({ page }) => {
    // Set PIN.
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1111");
    await page.getByRole("button", { name: /Set PIN/i }).click();
    await page.getByRole("button", { name: /Back to/i }).click();

    // Lock and try wrong PINs.
    await page.getByRole("button", { name: /Parent/i }).click();
    for (let i = 0; i < 5; i++) {
      await enterPin(page, "2222");
      await page.getByRole("button", { name: /Open Parent View/i }).click();
      await page.waitForTimeout(150);
    }

    // Should now see the lockout banner.
    await expect(page.getByRole("alert")).toContainText(/Locked|wait|seconds/i);
  });

  test("PIN is stored hashed, not as plaintext", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "4242");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    const stored = await page.evaluate(() => localStorage.getItem("growquest_parent_pin"));
    expect(stored).not.toBe("4242");
    expect(stored).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex
  });

  test("device salt is created and stable", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "5555");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    const salt1 = await page.evaluate(() => localStorage.getItem("growquest_parent_salt"));
    expect(salt1).toMatch(/^[0-9a-f]{32}$/); // 16 random bytes hex

    // Reload — salt must persist.
    await page.reload();
    const salt2 = await page.evaluate(() => localStorage.getItem("growquest_parent_salt"));
    expect(salt2).toBe(salt1);
  });

  test("Change PIN flow requires current PIN", async ({ page }) => {
    // Setup.
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN and Continue/i }).click();

    // Inside parent dashboard, click Change PIN.
    await page.getByRole("button", { name: /Change PIN/i }).click();
    await expect(page.getByText(/Enter your current PIN/i)).toBeVisible();

    // Wrong current PIN.
    await page.getByLabel("Current PIN").fill("9999");
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByRole("alert")).toContainText(/wrong/i);

    // Right current PIN.
    await page.getByLabel("Current PIN").fill("1234");
    await page.getByRole("button", { name: /Continue/i }).click();

    // New PIN prompt.
    await expect(page.getByText(/Choose a new 4-digit PIN/i)).toBeVisible();
    await page.getByLabel("New PIN").fill("5678");
    await page.getByRole("button", { name: /Save/i }).click();

    await expect(page.getByText(/PIN updated/i)).toBeVisible();

    // Re-lock and verify new PIN works, old one doesn't.
    await page.getByRole("button", { name: /Back to/i }).click();
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Open Parent View/i }).click();
    await expect(page.getByRole("alert")).toContainText(/wrong/i);
  });

  test("Remove PIN requires current PIN", async ({ page }) => {
    // Setup.
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN and Continue/i }).click();

    // Click Remove PIN.
    await page.getByRole("button", { name: /Remove PIN/i }).click();
    await expect(page.getByText(/Enter your current PIN to remove/i)).toBeVisible();

    // Wrong PIN doesn't remove.
    await page.getByLabel("Current PIN").fill("9999");
    await page.getByRole("button", { name: /Remove PIN/i }).click();
    await expect(page.getByRole("alert")).toContainText(/wrong/i);

    // Right PIN does remove.
    await page.getByLabel("Current PIN").fill("1234");
    await page.getByRole("button", { name: /Remove PIN/i }).click();
    await expect(page.getByText(/no longer protected/i)).toBeVisible();

    // localStorage should now hold "none".
    const stored = await page.evaluate(() => localStorage.getItem("growquest_parent_pin"));
    expect(stored).toBe("none");
  });
});
