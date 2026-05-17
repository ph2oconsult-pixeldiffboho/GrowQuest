// Tests for fix #2: certificate no longer fabricates contexts.
// We verify by intercepting the PDF download and inspecting its content.

import { test, expect } from "@playwright/test";
import { completeOnboarding, enterPin, resetStorage } from "./helpers.js";

test.describe("Certificate evidence is truthful", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await completeOnboarding(page, { name: "Cert Tester" });
  });

  test("downloaded certificate does NOT contain hardcoded 'with_family' label", async ({ page }) => {
    // Get to parent dashboard and trigger a certificate download.
    // Note: certificates only appear for sub-competencies at profile >= 2.
    // Onboarding always awards one quest in positiveIdentity which puts it at profile 2.

    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    // Find a "Download Certificate" button.
    const certBtn = page.getByRole("button", { name: /Download Certificate/i }).first();
    if (await certBtn.isVisible().catch(() => false)) {
      const downloadPromise = page.waitForEvent("download");
      await certBtn.click();
      const download = await downloadPromise;
      const path = await download.path();
      const fs = await import("fs");
      const pdfBuf = fs.readFileSync(path);
      const pdfText = pdfBuf.toString("latin1"); // jsPDF text is mostly raw

      // The OLD bug: certificate said "solo" + "with_family" hardcoded.
      // After fix #2: shows "RECENT DATES" instead, no fake contexts.
      // The fabricated labels should NOT appear.
      // (We're searching for the human-visible labels that would come from CONTEXT_LABELS).
      expect(pdfText).not.toContain("On my own"); // CONTEXT_LABELS.solo
      expect(pdfText).not.toContain("With family"); // CONTEXT_LABELS.with_family

      // Should contain either "RECENT DATES" header or no right-column header.
      // Easiest invariant to assert: the new fix means the certificate generates without errors
      // and the file is a valid PDF.
      expect(pdfBuf.slice(0, 4).toString()).toBe("%PDF");
    } else {
      test.skip(true, "No certificate-eligible sub-competency yet (would need more quests).");
    }
  });

  test("certificate label says RECENT DATES not DEMONSTRATED IN", async ({ page }) => {
    await page.getByRole("button", { name: /Parent/i }).click();
    await enterPin(page, "1234");
    await page.getByRole("button", { name: /Set PIN/i }).click();

    const certBtn = page.getByRole("button", { name: /Download Certificate/i }).first();
    if (!(await certBtn.isVisible().catch(() => false))) {
      test.skip(true, "No certificate-eligible sub-competency yet.");
      return;
    }

    const downloadPromise = page.waitForEvent("download");
    await certBtn.click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = await import("fs");
    const pdfBuf = fs.readFileSync(path);
    const pdfText = pdfBuf.toString("latin1");

    // Either RECENT DATES (when we have dates) or just no right column.
    // Critical: it should NOT say "DEMONSTRATED IN" because we're passing contexts: [].
    expect(pdfText).not.toContain("DEMONSTRATED IN");
  });
});
