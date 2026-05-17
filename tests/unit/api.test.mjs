// Smoke-test the API handlers (without actually hitting Gemini).
import transcribe from "../../api/transcribe.js";
import story from "../../api/story.js";

// Minimal req/res mocks
function makeRes() {
  const res = { _headers: {}, _statusCode: 200, _body: null, _ended: false };
  res.setHeader = (k, v) => { res._headers[k] = v; return res; };
  res.status = (c) => { res._statusCode = c; return res; };
  res.json = (b) => { res._body = b; res._ended = true; return res; };
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

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// ── CORS ────────────────────────────────────────────────────────────
// Default ALLOWED_ORIGINS = localhost only
process.env.ALLOWED_ORIGINS = undefined;
delete process.env.ALLOWED_ORIGINS;

// Allowed origin → header set
let res = makeRes();
await transcribe(makeReq({ method: "OPTIONS", origin: "http://localhost:5173" }), res);
log("allowed origin → ACAO set", res._headers["Access-Control-Allow-Origin"] === "http://localhost:5173");

// Disallowed origin → no ACAO header
res = makeRes();
await transcribe(makeReq({ method: "OPTIONS", origin: "https://evil.com" }), res);
log("disallowed origin → no ACAO header", !res._headers["Access-Control-Allow-Origin"]);

// Vary header always set
log("Vary header set on every response", res._headers["Vary"] === "Origin");

// Custom ALLOWED_ORIGINS env var works
process.env.ALLOWED_ORIGINS = "https://growquestbc.vercel.app,https://app.growquest.ca";
res = makeRes();
await transcribe(makeReq({ method: "OPTIONS", origin: "https://growquestbc.vercel.app" }), res);
log("ALLOWED_ORIGINS env → first origin allowed", res._headers["Access-Control-Allow-Origin"] === "https://growquestbc.vercel.app");

res = makeRes();
await transcribe(makeReq({ method: "OPTIONS", origin: "https://app.growquest.ca" }), res);
log("ALLOWED_ORIGINS env → second origin allowed", res._headers["Access-Control-Allow-Origin"] === "https://app.growquest.ca");

res = makeRes();
await transcribe(makeReq({ method: "OPTIONS", origin: "https://localhost:5173" }), res);
log("non-listed origin rejected when env var set", !res._headers["Access-Control-Allow-Origin"]);

// ── Method handling ─────────────────────────────────────────────────
res = makeRes();
await transcribe(makeReq({ method: "GET" }), res);
log("GET on /api/transcribe → 405", res._statusCode === 405);

res = makeRes();
await transcribe(makeReq({ method: "OPTIONS" }), res);
log("OPTIONS on /api/transcribe → 200", res._statusCode === 200);

// ── Missing body ────────────────────────────────────────────────────
res = makeRes();
await transcribe(makeReq({ method: "POST", body: {} }), res);
log("POST without audio → 400", res._statusCode === 400);

res = makeRes();
await story(makeReq({ method: "POST", body: {} }), res);
log("POST to story without API key → 500", res._statusCode === 500);

// ── Rate limit ──────────────────────────────────────────────────────
// 30/5min on transcribe — burst from the same IP
process.env.GEMINI_API_KEY = ""; // intentional: makes calls fail fast instead of hitting Gemini
const ip = "9.9.9.9";
let lastStatus = 0;
for (let i = 0; i < 32; i++) {
  res = makeRes();
  await transcribe(makeReq({ method: "POST", origin: "http://localhost:5173", ip, body: { audio: "test" } }), res);
  lastStatus = res._statusCode;
}
log("31st+ request from same IP → 429", lastStatus === 429);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
