// Tests for the v6.7.5 /api/tts serverless function.
// Covers CORS, rate limit, method handling, missing env var, cache hits,
// upstream failure, input validation.

import handler, { _resetCache, _cacheSize, _resetAllowlist } from "../../api/tts.js";

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// ── Mocks ────────────────────────────────────────────────────────────
function makeRes() {
  const res = { _headers: {}, _statusCode: 200, _body: null, _ended: false };
  res.setHeader = (k, v) => { res._headers[k] = v; return res; };
  res.status = (c) => { res._statusCode = c; return res; };
  res.json = (b) => { res._body = b; res._ended = true; return res; };
  res.send = (b) => { res._body = b; res._ended = true; return res; };
  res.end = () => { res._ended = true; return res; };
  return res;
}
function makeReq(opts = {}) {
  return {
    method: opts.method || "POST",
    headers: { "content-type": "application/json", origin: opts.origin || "", "x-forwarded-for": opts.ip || "1.1.1.1" },
    socket: { remoteAddress: opts.ip || "1.1.1.1" },
    body: opts.body || {},
  };
}

// Mock global.fetch to control ElevenLabs responses. The TTS handler
// now calls /v1/voices to resolve the allowlist, so we dispatch by URL.
let mockTtsResponse = null;     // { ok, status, arrayBuffer, text }
let mockVoicesResponse = null;  // { ok, status, json }
let mockFetchCalls = [];
global.fetch = async (url, opts) => {
  mockFetchCalls.push({ url, opts });
  if (typeof url === "string" && url.includes("/v1/voices")) {
    return mockVoicesResponse || {
      ok: true,
      json: async () => ({
        voices: [
          { voice_id: "aria-fake-id",    name: "Aria" },
          { voice_id: "jessica-fake-id", name: "Jessica" },
          { voice_id: "laura-fake-id",   name: "Laura" },
          { voice_id: "matilda-fake-id", name: "Matilda" },
          { voice_id: "sarah-fake-id",   name: "Sarah" },
          { voice_id: "brian-fake-id",   name: "Brian" },
          { voice_id: "eric-fake-id",    name: "Eric" },
          { voice_id: "liam-fake-id",    name: "Liam" },
          { voice_id: "will-fake-id",    name: "Will" },
          { voice_id: "chris-fake-id",   name: "Chris" },
        ],
      }),
    };
  }
  // /v1/text-to-speech/...
  if (typeof mockTtsResponse === "function") return mockTtsResponse(url, opts);
  return mockTtsResponse || { ok: false, status: 500, text: async () => "" };
};

// ── Setup ────────────────────────────────────────────────────────────
process.env.ALLOWED_ORIGINS = "https://growquest.example.com";
process.env.ELEVENLABS_API_KEY = "test-key";

// ── Method / CORS ────────────────────────────────────────────────────
let res = makeRes();
await handler(makeReq({ method: "OPTIONS", origin: "https://growquest.example.com" }), res);
log("OPTIONS returns 200", res._statusCode === 200);
log("OPTIONS sets allowed origin", res._headers["Access-Control-Allow-Origin"] === "https://growquest.example.com");

res = makeRes();
await handler(makeReq({ method: "OPTIONS", origin: "https://evil.com" }), res);
log("OPTIONS from disallowed origin: no ACAO header", !res._headers["Access-Control-Allow-Origin"]);

res = makeRes();
await handler(makeReq({ method: "GET" }), res);
log("GET returns 405", res._statusCode === 405);

// ── Missing API key ─────────────────────────────────────────────────
const savedKey = process.env.ELEVENLABS_API_KEY;
delete process.env.ELEVENLABS_API_KEY;
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "hi" } }), res);
log("503 when ELEVENLABS_API_KEY is unset", res._statusCode === 503);
process.env.ELEVENLABS_API_KEY = savedKey;

// ── Input validation ───────────────────────────────────────────────
_resetCache();
res = makeRes();
await handler(makeReq({ method: "POST", body: {} }), res);
log("400 when text is missing", res._statusCode === 400);

res = makeRes();
await handler(makeReq({ method: "POST", body: { text: 42 } }), res);
log("400 when text is not a string", res._statusCode === 400);

res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "x".repeat(1001) } }), res);
log("400 when text is too long", res._statusCode === 400);

// ── Happy path ──────────────────────────────────────────────────────
_resetCache();
mockTtsResponse = { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "Hello there" } }), res);
log("Success returns 200", res._statusCode === 200);
log("Success sets audio/mpeg Content-Type", res._headers["Content-Type"] === "audio/mpeg");
log("First request is a cache MISS", res._headers["X-GQ-Cache"] === "MISS");

// ── Cache hit on repeat ─────────────────────────────────────────────
mockFetchCalls = [];
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "Hello there" } }), res);
log("Repeat request is a cache HIT", res._headers["X-GQ-Cache"] === "HIT");
log("Cache HIT does NOT call ElevenLabs again", mockFetchCalls.length === 0);

// ── Different voice = different cache key (using two allowlisted voices) ─
mockTtsResponse = { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
mockFetchCalls = [];
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "Hello there", voiceId: "jessica-fake-id" } }), res);
log("Different voiceId triggers a new fetch", mockFetchCalls.length === 1);
log("That request is a MISS", res._headers["X-GQ-Cache"] === "MISS");

// ── Upstream 401 ────────────────────────────────────────────────────
_resetCache();
mockTtsResponse = { ok: false, status: 401, text: async () => "Unauthorized" };
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "fresh text" } }), res);
log("502 when upstream returns 401", res._statusCode === 502);

// ── Upstream 429 ────────────────────────────────────────────────────
mockTtsResponse = { ok: false, status: 429, text: async () => "Rate limited" };
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "fresh text 2" } }), res);
log("502 when upstream returns 429", res._statusCode === 502);

// ── Rate limit ──────────────────────────────────────────────────────
_resetCache();
mockTtsResponse = { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
const burstIp = "9.9.9.9";
let lastStatus;
for (let i = 0; i < 122; i++) {
  res = makeRes();
  await handler(makeReq({ method: "POST", ip: burstIp, body: { text: `unique-${i}` } }), res);
  lastStatus = res._statusCode;
}
log("121st+ request from same IP → 429", lastStatus === 429);

// ── Voice id allowlist ──────────────────────────────────────────────
// Each block resets the allowlist cache so the first /v1/voices call
// happens within the block; mockFetchCalls includes both that call and
// the subsequent /v1/text-to-speech call.
function ttsCall(calls) { return calls.find(c => c.url.includes("/v1/text-to-speech/")); }

_resetCache(); _resetAllowlist();
mockTtsResponse = { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
mockFetchCalls = [];
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "x", voiceId: "aria-fake-id" } }), res);
log("Allowlisted voiceId (Aria) is forwarded to upstream",
  ttsCall(mockFetchCalls)?.url.includes("/v1/text-to-speech/aria-fake-id"));

// Non-allowlisted voiceId (even valid format) → falls back to default
_resetCache(); _resetAllowlist();
mockFetchCalls = [];
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "x", voiceId: "some_other_valid_id_format" } }), res);
log("Non-allowlisted voiceId is replaced with default (Aria)",
  ttsCall(mockFetchCalls)?.url.includes("/v1/text-to-speech/aria-fake-id"));

// Invalid voiceId (special chars) → falls back to default
_resetCache(); _resetAllowlist();
mockFetchCalls = [];
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "x", voiceId: "bad/../path" } }), res);
log("Malformed voiceId is rejected and default used",
  ttsCall(mockFetchCalls)?.url.includes("/v1/text-to-speech/aria-fake-id"));

// Stale voice ID from v6.7.8 (Rachel) → rejected, default used
_resetCache(); _resetAllowlist();
mockFetchCalls = [];
res = makeRes();
await handler(makeReq({ method: "POST", body: { text: "x", voiceId: "rachel-stale-id" } }), res);
log("Stale v6.7.8 voiceId (Rachel) is rejected, default used",
  ttsCall(mockFetchCalls)?.url.includes("/v1/text-to-speech/aria-fake-id"));

// ── Cache size bound ────────────────────────────────────────────────
_resetCache();
mockTtsResponse = { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
for (let i = 0; i < 250; i++) {
  res = makeRes();
  await handler(makeReq({ method: "POST", ip: `10.0.0.${i % 50}`, body: { text: `cache-${i}` } }), res);
}
log("Cache is bounded (size <= 200)", _cacheSize() <= 200);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
