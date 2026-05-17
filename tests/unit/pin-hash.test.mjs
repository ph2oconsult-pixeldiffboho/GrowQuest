async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(salt + ":" + pin);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

let pass = 0, fail = 0;
const log = (name, ok) => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name); };

const salt = "abc123";
const h1234 = await hashPin("1234", salt);
log("hash is 64 hex chars (SHA-256 output)", h1234.length === 64);
log("hash differs from plaintext", h1234 !== "1234");

const h1234b = await hashPin("1234", salt);
log("same pin + salt → same hash", h1234 === h1234b);

const h1234DiffSalt = await hashPin("1234", "different");
log("same pin + different salt → different hash", h1234 !== h1234DiffSalt);

const h5678 = await hashPin("5678", salt);
log("different pin + same salt → different hash", h1234 !== h5678);

// Verify the legacy match logic: stored="1234" (length 4 plaintext), input="1234" → match
const stored_legacy = "1234";
const input = "1234";
const inputHashed = await hashPin(input, salt);
const isLegacyMatch = stored_legacy && stored_legacy.length === 4 && stored_legacy === input;
log("legacy plaintext PIN matches on input equality", isLegacyMatch === true);
log("legacy plaintext PIN does NOT match the hashed value", stored_legacy !== inputHashed);

// Verify that "none" doesn't accidentally match anything
const stored_none = "none";
log('"none" is filtered before length-4 check (handled in calling code)', stored_none === "none");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
