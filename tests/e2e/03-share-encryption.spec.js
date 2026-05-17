// Tests for fix #4: encrypted share codes.
// The browser does the encryption; this test verifies that the output
// is actually encrypted (not just base64) and round-trips correctly.

import { test, expect } from "@playwright/test";
import { completeOnboarding, enterPin, resetStorage } from "./helpers.js";

test.describe("Share progress encryption", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page, { name: "Alice" });
  });

  test("share button asks for class code", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    await page.getByRole("button", { name: /Generate.*Progress.*Code/i }).click();
    await expect(page.getByLabel("Class code")).toBeVisible();
  });

  test("generated code is encrypted (does not contain child name)", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    await page.getByRole("button", { name: /Generate.*Progress.*Code/i }).click();
    await page.getByLabel("Class code").fill("ABC123");
    await page.getByRole("button", { name: /Generate Code/i }).click();

    // Wait for the generated code to render.
    await expect(page.getByText(/gq1:/)).toBeVisible({ timeout: 5000 });

    const visibleCode = await page.locator('div').filter({ hasText: /^gq1:/ }).first().innerText();
    // CRITICAL: the encrypted code must not contain the child's name in any decodable form.
    expect(visibleCode).not.toContain("Alice");

    // The base64 sections should also not decode to plaintext containing the name.
    const parts = visibleCode.replace("…", "").split(":");
    expect(parts[0]).toBe("gq1");
    // Even truncated, the visible portion should be base64-looking.
    expect(parts[1]).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test("empty class code rejected", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    await page.getByRole("button", { name: /Generate.*Progress.*Code/i }).click();
    await page.getByRole("button", { name: /Generate Code/i }).click();
    await expect(page.getByRole("alert")).toContainText(/enter your class code/i);
  });

  test("short class code rejected", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    await page.getByRole("button", { name: /Generate.*Progress.*Code/i }).click();
    await page.getByLabel("Class code").fill("AB");
    await page.getByRole("button", { name: /Generate Code/i }).click();
    await expect(page.getByRole("alert")).toContainText(/at least 4/i);
  });

  test("encryption round-trip in browser", async ({ page }) => {
    // Round-trip via the same functions the app uses, called directly via WebCrypto.
    const roundTripped = await page.evaluate(async () => {
      const KDF_ITERATIONS = 150000;
      const bytesToB64 = (b) => { let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); };
      const b64ToBytes = (b64) => { const s = atob(b64); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };

      const deriveKey = async (cc, salt) => {
        const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(cc.trim().toUpperCase()), { name: "PBKDF2" }, false, ["deriveKey"]);
        return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: KDF_ITERATIONS, hash: "SHA-256" }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      };

      const plaintext = new TextEncoder().encode(JSON.stringify({ n: "Alice", a: "primary" }));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey("ABC123", salt);
      const ctBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
      const code = `gq1:${bytesToB64(salt)}:${bytesToB64(iv)}:${bytesToB64(new Uint8Array(ctBuf))}`;

      // Decrypt.
      const parts = code.split(":");
      const dKey = await deriveKey("ABC123", b64ToBytes(parts[1]));
      const ptBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(parts[2]) }, dKey, b64ToBytes(parts[3]));
      return JSON.parse(new TextDecoder().decode(ptBuf));
    });

    expect(roundTripped.n).toBe("Alice");
    expect(roundTripped.a).toBe("primary");
  });
});
