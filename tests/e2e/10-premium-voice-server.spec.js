// Tests for the v6.7.5 server-proxied premium voice flow. We intercept
// /api/tts and /api/tts-voices so the test doesn't hit a real Vercel
// deployment.

import { test, expect } from "@playwright/test";
import { completeOnboarding, enterPin, resetStorage } from "./helpers.js";

async function reachPreferences(page) {
  await page.getByRole("button", { name: /Parent/i }).click();
  await enterPin(page, "1234");
  await page.getByRole("button", { name: /Set PIN/i }).click();
  await page.getByRole("button", { name: /Toggle preferences panel/i }).click();
}

async function mockTtsAvailable(page) {
  await page.route("**/api/tts-voices", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      voices: [
        { voice_id: "v-rachel", name: "Rachel" },
        { voice_id: "v-bella",  name: "Bella" },
      ]
    }) })
  );
  await page.route("**/api/tts", route =>
    route.fulfill({ status: 200, headers: { "Content-Type": "audio/mpeg" }, body: Buffer.from([0xFF, 0xFB]) })
  );
}

async function mockTtsUnavailable(page) {
  await page.route("**/api/tts-voices", route => route.fulfill({ status: 503, body: "" }));
  await page.route("**/api/tts", route => route.fulfill({ status: 503, body: "" }));
}

test.describe("Premium voice (Stage 2 server-side)", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page, { name: "PremTester" });
  });

  test("Premium voice section appears when server has TTS configured", async ({ page }) => {
    await mockTtsAvailable(page);
    await reachPreferences(page);
    await expect(page.getByText(/Premium voice/i).first()).toBeVisible();
    await expect(page.getByText(/Premium voice on/i)).toBeVisible({ timeout: 5000 });
  });

  test("Premium voice section shows fallback message when server lacks TTS", async ({ page }) => {
    await mockTtsUnavailable(page);
    await reachPreferences(page);
    await expect(page.getByText(/not configured on this deployment/i)).toBeVisible({ timeout: 5000 });
  });

  test("Voice picker shows server-provided voices", async ({ page }) => {
    await mockTtsAvailable(page);
    await reachPreferences(page);
    await expect(page.getByLabel("Premium voice selection")).toBeVisible({ timeout: 5000 });
    const options = await page.getByLabel("Premium voice selection").locator("option").allTextContents();
    expect(options).toContain("Rachel");
    expect(options).toContain("Bella");
  });

  test("Toggling premium voice off updates config", async ({ page }) => {
    await mockTtsAvailable(page);
    await reachPreferences(page);
    await expect(page.getByText(/Premium voice on/i)).toBeVisible({ timeout: 5000 });

    await page.getByRole("switch", { name: /Toggle premium voice/i }).click();
    await expect(page.getByText(/Premium voice off/i)).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("gq_premium_voice") || "{}"));
    expect(stored.enabled).toBe(false);
  });

  test("Preview button calls /api/tts when premium is on", async ({ page }) => {
    await mockTtsAvailable(page);
    let ttsCalls = 0;
    await page.route("**/api/tts", route => {
      ttsCalls++;
      route.fulfill({ status: 200, headers: { "Content-Type": "audio/mpeg" }, body: Buffer.from([0xFF, 0xFB]) });
    });
    await reachPreferences(page);
    await expect(page.getByRole("button", { name: /Preview premium voice/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /Preview premium voice/i }).click();
    await page.waitForTimeout(500);
    expect(ttsCalls).toBeGreaterThanOrEqual(1);
  });

  test("No API key is stored in localStorage anywhere", async ({ page }) => {
    await mockTtsAvailable(page);
    await reachPreferences(page);
    await page.waitForTimeout(500);
    // Sweep all localStorage values; none should contain "sk_" or "xi-api-key".
    const dump = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
      return out;
    });
    const all = JSON.stringify(dump);
    expect(all).not.toMatch(/sk_/);
    expect(all).not.toMatch(/xi-api-key/);
  });

  test("Consent screen describes the server-proxied premium voice", async ({ page }) => {
    await resetStorage(page);
    await page.goto("/");
    await expect(page.getByText(/What about the premium companion voice/i)).toBeVisible();
    // Section should mention ElevenLabs + US servers (data-residency disclosure)
    await page.getByRole("button", { name: /What about the premium companion voice/i }).click();
    const text = await page.locator("body").innerText();
    expect(text).toMatch(/ElevenLabs/);
    expect(text).toMatch(/United States|US servers|U.S./i);
  });
});
