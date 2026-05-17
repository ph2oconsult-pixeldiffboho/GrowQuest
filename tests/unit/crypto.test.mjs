// Webcrypto is in globalThis.crypto on Node 22.
// Extract the encrypt/decrypt functions from TeacherDashboard.jsx and round-trip them.

const KDF_ITERATIONS = 150000;
const KDF_HASH = "SHA-256";

function bytesToB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return Buffer.from(s, "binary").toString("base64");
}
function b64ToBytes(b64) {
  const s = Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function deriveKey(classCode, salt) {
  const normalised = (classCode || "").trim().toUpperCase();
  if (!normalised) throw new Error("Class code is empty");
  const baseKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(normalised), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: KDF_ITERATIONS, hash: KDF_HASH },
    baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

async function encryptStudentProgress(profile, classCode) {
  const data = { n: profile.name, a: profile.ageGroup, av: profile.avatarId, an: profile.avatarName, s: profile.streak, p: {} };
  Object.entries(profile.progress).forEach(([sk, p]) => { data.p[sk] = { l: p.profile, s: p.stars, q: p.questsCompleted }; });
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(classCode, salt);
  const ctBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const ct = new Uint8Array(ctBuf);
  return `gq1:${bytesToB64(salt)}:${bytesToB64(iv)}:${bytesToB64(ct)}`;
}

async function decryptStudentProgress(code, classCode) {
  const trimmed = (code || "").trim();
  if (!trimmed.startsWith("gq1:")) {
    try {
      const data = JSON.parse(Buffer.from(trimmed, "base64").toString("utf-8"));
      return { name: data.n, ageGroup: data.a, avatarId: data.av, avatarName: data.an,
        streak: data.s, progress: data.p, importedAt: new Date().toISOString(), _legacy: true };
    } catch (e) { return null; }
  }
  try {
    const [, saltB64, ivB64, ctB64] = trimmed.split(":");
    if (!saltB64 || !ivB64 || !ctB64) return null;
    const salt = b64ToBytes(saltB64);
    const iv = b64ToBytes(ivB64);
    const ct = b64ToBytes(ctB64);
    const key = await deriveKey(classCode, salt);
    const ptBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    const data = JSON.parse(new TextDecoder().decode(ptBuf));
    return { name: data.n, ageGroup: data.a, avatarId: data.av, avatarName: data.an,
      streak: data.s, progress: data.p, importedAt: new Date().toISOString() };
  } catch (e) { return null; }
}

// ── Tests ────────────────────────────────────────────────────────────
const sampleProfile = {
  name: "Test Child", ageGroup: "primary", avatarId: "owl", avatarName: "Hoot", streak: 3,
  progress: { communicating: { profile: 3, stars: 5, questsCompleted: 7 } }
};

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// 1. Round-trip with correct class code
const code1 = await encryptStudentProgress(sampleProfile, "ABC123");
log("round-trip starts with gq1:", code1.startsWith("gq1:"));
log("encrypted code does NOT contain child name in plaintext", !code1.includes("Test Child"));
log("encrypted code does NOT contain decoded name in base64-decoded ciphertext", !Buffer.from(code1.split(":")[3], "base64").toString("binary").includes("Test Child"));
const r1 = await decryptStudentProgress(code1, "ABC123");
log("decryption with correct class code returns name", r1?.name === "Test Child");
log("decryption preserves progress", r1?.progress?.communicating?.l === 3);
log("decryption has importedAt", !!r1?.importedAt);
log("decryption does NOT flag _legacy", !r1?._legacy);

// 2. Wrong class code returns null
const r2 = await decryptStudentProgress(code1, "WRONG1");
log("wrong class code returns null", r2 === null);

// 3. Class code normalisation (case-insensitive, trim)
const r3 = await decryptStudentProgress(code1, "  abc123  ");
log("class code normalised (lowercase + spaces)", r3?.name === "Test Child");

// 4. Legacy v6.6 plain-base64 import
const legacyData = { n: "Old Child", a: "primary", av: "fox", an: "Sly", s: 2, p: { communicating: { l: 2, s: 0, q: 1 } } };
const legacyCode = Buffer.from(JSON.stringify(legacyData)).toString("base64");
const r4 = await decryptStudentProgress(legacyCode, "ABC123");
log("legacy code imports", r4?.name === "Old Child");
log("legacy code flagged with _legacy", r4?._legacy === true);

// 5. Tampering detection
const tampered = code1.slice(0, -10) + "AAAAAAAAAA";
const r5 = await decryptStudentProgress(tampered, "ABC123");
log("tampered ciphertext returns null (GCM auth failure)", r5 === null);

// 6. Empty class code rejected
try {
  await encryptStudentProgress(sampleProfile, "");
  log("empty class code rejected on encrypt", false);
} catch(e) { log("empty class code rejected on encrypt", true); }

// 7. Malformed gq1 code returns null cleanly
const r7 = await decryptStudentProgress("gq1:foo:bar", "ABC123");
log("malformed gq1 code returns null", r7 === null);

// 8. Empty string code
const r8 = await decryptStudentProgress("", "ABC123");
log("empty string code returns null", r8 === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
