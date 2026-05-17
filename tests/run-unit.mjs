// Simple unit-test runner. No test framework needed — each test file
// runs assertions inline and exits non-zero on failure. Keeps the dep
// surface small.

import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "tests/unit";
const files = readdirSync(dir).filter((f) => f.endsWith(".test.mjs")).sort();

let allPassed = true;
for (const file of files) {
  const path = join(dir, file);
  console.log(`\n── ${file} ──`);
  try {
    execSync(`node ${path}`, { stdio: "inherit" });
  } catch (e) {
    allPassed = false;
  }
}

if (!allPassed) {
  console.error("\nSome unit tests failed.");
  process.exit(1);
}
console.log("\nAll unit tests passed.");
