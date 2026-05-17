import { defineConfig, devices } from "@playwright/test";

/**
 * GrowQuest BC end-to-end tests.
 *
 * Run with:
 *   npm run test:e2e          # headless
 *   npm run test:e2e:ui       # interactive UI mode
 *   npm run test:e2e:headed   # watch the browser run the tests
 *
 * The webServer block boots `npm run dev` automatically so you don't
 * need to start it manually. Tests run against http://localhost:3000.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // localStorage is shared per browser context; serial keeps state predictable
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment to also test on mobile WebKit:
    // {
    //   name: "mobile-safari",
    //   use: { ...devices["iPhone 13"] },
    // },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
