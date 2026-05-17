// Tests for v6.7.14 /api/tts-health diagnostic endpoint.
// Verifies the shape of the response so we can rely on it for the
// front-end Voice Diagnostics card.

import handler from "../../api/tts-health.js";

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

function makeRes() {
  const res = { _headers: {}, _statusCode: 200, _body: null };
  res.setHeader = (k, v) => { res._headers[k] = v; return res; };
  res.status = (c) => { res._statusCode = c; return res; };
  res.json = (b) => { res._body = b; return res; };
  res.end = () => res;
  return res;
}
function makeReq(opts = {}) {
  return {
    method: opts.method || "GET",
    headers: { origin: opts.origin || "" },
  };
}

// Mock global.fetch
let mockResp = null;
global.fetch = async () => mockResp || { ok: false, status: 500 };

// ── Method handling ────────────────────────────────────────────────
let res = makeRes();
await handler(makeReq({ method: "OPTIONS" }), res);
log("OPTIONS returns 200", res._statusCode === 200);

res = makeRes();
await handler(makeReq({ method: "POST" }), res);
log("POST returns 405", res._statusCode === 405);

// ── Missing API key ────────────────────────────────────────────────
delete process.env.ELEVENLABS_API_KEY;
res = makeRes();
await handler(makeReq(), res);
log("Reports apiKeyPresent: false when env missing", res._body?.apiKeyPresent === false);
log("Reports ok: false when env missing", res._body?.ok === false);
log("Surfaces error message when env missing", typeof res._body?.error === "string");

// ── Upstream 401 ───────────────────────────────────────────────────
process.env.ELEVENLABS_API_KEY = "test-key";
mockResp = { ok: false, status: 401, json: async () => ({}) };
res = makeRes();
await handler(makeReq(), res);
log("Reports voicesEndpoint.status = 401 on upstream auth fail", res._body?.voicesEndpoint?.status === 401);
log("Reports ok: false on upstream fail", res._body?.ok === false);

// ── Upstream success, all voices resolved ──────────────────────────
mockResp = {
  ok: true,
  status: 200,
  json: async () => ({
    voices: [
      { voice_id: "id-aria",    name: "Aria" },
      { voice_id: "id-jessica", name: "Jessica" },
      { voice_id: "id-laura",   name: "Laura" },
      { voice_id: "id-matilda", name: "Matilda" },
      { voice_id: "id-sarah",   name: "Sarah" },
      { voice_id: "id-brian",   name: "Brian" },
      { voice_id: "id-eric",    name: "Eric" },
      { voice_id: "id-liam",    name: "Liam" },
      { voice_id: "id-will",    name: "Will" },
      { voice_id: "id-chris",   name: "Chris" },
      { voice_id: "id-extra",   name: "ExtraVoice" }, // ignored
    ],
  }),
};
res = makeRes();
await handler(makeReq(), res);
log("All 10 curated names resolve when upstream has them", res._body?.curated?.resolved === 10);
log("No missing names when all resolve", res._body?.curated?.missing?.length === 0);
log("totalVoices reflects upstream length", res._body?.voicesEndpoint?.totalVoices === 11);
log("Default voice Aria resolves from upstream", res._body?.defaultVoice?.voiceId === "id-aria");
log("ok: true when at least one resolves", res._body?.ok === true);

// ── Upstream success, partial resolution ──────────────────────────
mockResp = {
  ok: true,
  status: 200,
  json: async () => ({
    voices: [
      { voice_id: "id-aria", name: "Aria" },
      { voice_id: "id-sarah", name: "Sarah" },
      // Other 8 curated names are missing
    ],
  }),
};
res = makeRes();
await handler(makeReq(), res);
log("Partial resolution: 2 of 10 resolved", res._body?.curated?.resolved === 2);
log("Partial resolution: 8 names in missing list", res._body?.curated?.missing?.length === 8);
log("Partial resolution still ok: true (at least one resolved)", res._body?.ok === true);

// ── Upstream returns nothing ──────────────────────────────────────
mockResp = {
  ok: true,
  status: 200,
  json: async () => ({ voices: [] }),
};
res = makeRes();
await handler(makeReq(), res);
log("Empty upstream voices: 0 resolved", res._body?.curated?.resolved === 0);
log("Empty upstream voices: ok: false", res._body?.ok === false);
log("Empty upstream voices: explains in error", typeof res._body?.error === "string");

// ── Substring name matching ───────────────────────────────────────
mockResp = {
  ok: true,
  status: 200,
  json: async () => ({
    voices: [
      { voice_id: "id-aria-variant", name: "Aria - Conversational" },
    ],
  }),
};
res = makeRes();
await handler(makeReq(), res);
log("Substring match: Aria - Conversational matches Aria", res._body?.curated?.resolved === 1);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
