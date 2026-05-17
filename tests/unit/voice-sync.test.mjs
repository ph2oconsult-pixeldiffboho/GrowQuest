// Tests for the v6.7.6 voice/text sync logic in useSpeak.
//
// useSpeak is a React hook, so we can't import it directly. This file
// replicates the decision tree (prefetch cache → ready / pending / miss →
// 600ms cap) and verifies behaviour. The actual hook in App.jsx must
// match this logic — the e2e test (10-premium-voice-server) is the
// source of truth for the integrated behaviour.

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// ── Replica of the decision branch ───────────────────────────────────

function makeCache() { return new Map(); }

function prefetch(cache, key, fetchFn) {
  if (cache.has(key)) return;
  const entry = { status: "pending" };
  cache.set(key, entry);
  fetchFn().then(url => {
    if (url) { entry.status = "ready"; entry.url = url; }
    else     { entry.status = "failed"; }
  }).catch(() => { entry.status = "failed"; });
}

async function awaitPrefetch(cache, key, capMs) {
  const start = Date.now();
  while (true) {
    const e = cache.get(key);
    if (!e) return null;
    if (e.status === "ready") return e.url;
    if (e.status === "failed") return null;
    if (Date.now() - start >= capMs) return null;
    await new Promise(r => setTimeout(r, 10));
  }
}

async function speak(cache, key, fetchFn, capMs = 600) {
  const cached = cache.get(key);
  if (cached?.status === "ready") {
    cache.delete(key);
    return { source: "cached-ready", url: cached.url, waited: 0 };
  }
  if (cached?.status === "pending") {
    const start = Date.now();
    const url = await awaitPrefetch(cache, key, capMs);
    const waited = Date.now() - start;
    if (url) { cache.delete(key); return { source: "cached-pending", url, waited }; }
    return { source: "cached-pending-timeout", url: null, waited };
  }
  // Nothing cached — fetch with cap.
  const start = Date.now();
  const fetchPromise = fetchFn();
  const url = await Promise.race([
    fetchPromise,
    new Promise(r => setTimeout(() => r("__timeout__"), capMs)),
  ]);
  const waited = Date.now() - start;
  if (url === "__timeout__") return { source: "fresh-timeout", url: null, waited };
  return { source: "fresh", url, waited };
}

// ── Tests ─────────────────────────────────────────────────────────────

// 1. Cache hit when prefetch completed before speak
{
  const cache = makeCache();
  prefetch(cache, "hello", async () => "blob:1");
  await new Promise(r => setTimeout(r, 50));  // give prefetch time
  const result = await speak(cache, "hello", async () => { throw new Error("should not fetch") });
  log("ready cache hit returns instantly", result.source === "cached-ready" && result.url === "blob:1");
  log("ready cache hit waited near-zero ms", result.waited < 20);
  log("ready cache entry removed after use", !cache.has("hello"));
}

// 2. Pending cache → audio arrives within cap → returned
{
  const cache = makeCache();
  prefetch(cache, "hello", () => new Promise(r => setTimeout(() => r("blob:2"), 200)));
  // Speak immediately, before prefetch resolves.
  const result = await speak(cache, "hello", async () => { throw new Error("should not fetch") });
  log("pending cache returns URL when prefetch lands in time", result.source === "cached-pending" && result.url === "blob:2");
  log("pending cache waited ~200ms", result.waited >= 150 && result.waited < 350);
}

// 3. Pending cache → prefetch slower than 600ms cap → returns null
{
  const cache = makeCache();
  prefetch(cache, "slow", () => new Promise(r => setTimeout(() => r("blob:3"), 1000)));
  const result = await speak(cache, "slow", async () => { throw new Error("should not fetch") }, 300);
  log("pending cache returns null when slower than cap", result.source === "cached-pending-timeout" && result.url === null);
  log("pending cache waited about the cap", result.waited >= 250 && result.waited < 400);
}

// 4. No prefetch, fresh fetch within cap → succeeds
{
  const cache = makeCache();
  const result = await speak(cache, "fresh", () => new Promise(r => setTimeout(() => r("blob:4"), 100)), 600);
  log("fresh fetch within cap returns URL", result.source === "fresh" && result.url === "blob:4");
}

// 5. No prefetch, fresh fetch beyond cap → timeout
{
  const cache = makeCache();
  const result = await speak(cache, "fresh-slow", () => new Promise(r => setTimeout(() => r("blob:5"), 1000)), 200);
  log("fresh fetch beyond cap returns null", result.source === "fresh-timeout" && result.url === null);
}

// 6. Prefetch deduplication
{
  const cache = makeCache();
  let calls = 0;
  const fetchFn = () => { calls++; return new Promise(r => setTimeout(() => r("blob:6"), 50)); };
  prefetch(cache, "dup", fetchFn);
  prefetch(cache, "dup", fetchFn);
  prefetch(cache, "dup", fetchFn);
  await new Promise(r => setTimeout(r, 100));
  log("prefetch deduplicates by key", calls === 1);
}

// 7. Failed prefetch → speak() retries on demand, returns whatever the retry produces
{
  const cache = makeCache();
  prefetch(cache, "fail", async () => null);  // initial prefetch returns null → fails
  await new Promise(r => setTimeout(r, 30));
  let retryCalled = false;
  const result = await speak(cache, "fail", async () => { retryCalled = true; return "blob:7-retry"; });
  log("failed prefetch triggers retry", retryCalled === true);
  log("retry result is returned", result.url === "blob:7-retry");
}

// 8. Cap respected even when prefetch was already pending for a while
{
  const cache = makeCache();
  prefetch(cache, "longwait", () => new Promise(r => setTimeout(() => r("blob:8"), 2000)));
  // 100ms passes before speak() is called.
  await new Promise(r => setTimeout(r, 100));
  const start = Date.now();
  const result = await speak(cache, "longwait", async () => { throw new Error("should not fetch") }, 300);
  const took = Date.now() - start;
  log("cap measured from speak(), not from prefetch()", result.url === null && took < 400);
}

// 9. Generation counter distinguishes adjacent speak() calls
//    Even when both started with no playing audio, a second speak()
//    should cause the first's late-arrival audio to be discarded.
{
  // Simulate: speak() #1 starts a fetch (no audio yet), generation = 1
  // Then speak() #2 starts, generation = 2
  // Then #1's fetch resolves — handler should bail because gen mismatch.
  let gen = 0;

  // First speak — captures myGen=1
  gen += 1;
  const firstGen = gen;
  const firstFetchResolves = new Promise(r => setTimeout(() => r("blob:first"), 200));

  // Second speak — captures myGen=2
  gen += 1;
  const secondGen = gen;
  const secondFetchResolves = new Promise(r => setTimeout(() => r("blob:second"), 100));

  // Track what plays
  const played = [];
  firstFetchResolves.then(url => {
    if (firstGen !== gen) return; // bail — newer speak() happened
    played.push(url);
  });
  secondFetchResolves.then(url => {
    if (secondGen !== gen) return;
    played.push(url);
  });

  await new Promise(r => setTimeout(r, 300));
  log("Generation guard discards stale late audio", played.length === 1 && played[0] === "blob:second");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
