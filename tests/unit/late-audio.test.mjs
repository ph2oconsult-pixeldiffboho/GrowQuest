// Tests for the v6.7.8 late-audio fix.
//
// Before v6.7.8, when the 600ms cap elapsed on the very first companion
// utterance (cold-start Vercel function + ElevenLabs latency = 2-5s),
// the premium voice was silently dropped and Web Speech took over. The
// teacher reported this as "ElevenLabs voice doesn't come on until the
// third speech bubble" — by step 2, the prefetch had had time to land.
//
// This test models the decision tree post-fix:
//   1. Pending prefetch + cap hits + audio arrives late → play late audio
//   2. No prefetch + cap hits + audio arrives late → play late audio
//   3. Late audio is suppressed if a newer speak() has taken over
//   4. Late failure falls back to Web Speech, not silence

let pass = 0, fail = 0;
const log = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(ok ? "✓" : "✗", name, detail); };

// ── Replica of the v6.7.8 flow ────────────────────────────────────────

// "audioRef" — a single-slot ref that tracks the currently playing audio.
// A newer speak() overwriting this means older late-arriving audio
// should NOT play.
function makeAudioRef() { return { current: null }; }

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

// Simulated speak() that returns synchronously after the cap, and reports
// late-audio outcomes via callbacks.
async function speakWithLateHandling(cache, key, fetchFn, capMs, audioRef, webSpeechFallback) {
  const cached = cache.get(key);

  // Path B: pending prefetch
  if (cached?.status === "pending") {
    const url = await awaitPrefetch(cache, key, capMs);
    if (url) {
      // Ready before cap — play normally.
      audioRef.current = { url, source: "in-time" };
      cache.delete(key);
      return { source: "cached-pending-intime", outcome: "played" };
    }
    // Cap hit. Was it because of failure?
    const finalEntry = cache.get(key);
    if (!finalEntry || finalEntry.status === "failed") {
      cache.delete(key);
      // Fall through to Web Speech.
      webSpeechFallback();
      return { source: "cached-pending-failed", outcome: "web-speech" };
    }
    // Still pending. Capture audioRef AT TIMEOUT and poll for late.
    const startedAudioRefAt = audioRef.current;
    return new Promise(resolve => {
      const poll = () => {
        const e = cache.get(key);
        if (!e) { resolve({ source: "cached-pending-late", outcome: "removed" }); return; }
        if (e.status === "ready" && e.url) {
          cache.delete(key);
          if (audioRef.current !== startedAudioRefAt) {
            resolve({ source: "cached-pending-late", outcome: "suppressed-stale" });
            return;
          }
          audioRef.current = { url: e.url, source: "late" };
          resolve({ source: "cached-pending-late", outcome: "played-late" });
          return;
        }
        if (e.status === "failed") {
          cache.delete(key);
          if (audioRef.current !== startedAudioRefAt) {
            resolve({ source: "cached-pending-late", outcome: "suppressed-stale" });
            return;
          }
          webSpeechFallback();
          resolve({ source: "cached-pending-late", outcome: "web-speech-late" });
          return;
        }
        setTimeout(poll, 20);
      };
      setTimeout(poll, 20);
    });
  }

  // Path C: no prefetch
  const fetchPromise = fetchFn();
  const winner = await Promise.race([
    fetchPromise,
    new Promise(r => setTimeout(() => r("__timeout__"), capMs)),
  ]);
  if (winner === "__timeout__") {
    const startedAudioRefAt = audioRef.current;
    return new Promise(resolve => {
      fetchPromise.then(lateUrl => {
        if (audioRef.current !== startedAudioRefAt) {
          resolve({ source: "fresh-late", outcome: "suppressed-stale" });
          return;
        }
        if (!lateUrl) {
          webSpeechFallback();
          resolve({ source: "fresh-late", outcome: "web-speech-late" });
          return;
        }
        audioRef.current = { url: lateUrl, source: "late" };
        resolve({ source: "fresh-late", outcome: "played-late" });
      });
    });
  }
  audioRef.current = { url: winner, source: "in-time" };
  return { source: "fresh-intime", outcome: "played" };
}

// ── Tests ─────────────────────────────────────────────────────────────

// Test 1: Pending prefetch hits cap, audio arrives 1s later → plays late.
// (This is the exact bug the teacher saw on step 0.)
{
  const cache = makeCache();
  const audioRef = makeAudioRef();
  let webSpeechCalled = false;
  prefetch(cache, "step-0", () => new Promise(r => setTimeout(() => r("blob:step0"), 1000)));
  const result = await speakWithLateHandling(
    cache, "step-0",
    () => { throw new Error("should not refetch") },
    300, audioRef,
    () => { webSpeechCalled = true; }
  );
  log("cold step 0 pending + cap hit → plays late", result.outcome === "played-late");
  log("cold step 0 plays the premium URL (not Web Speech)", audioRef.current?.url === "blob:step0" && audioRef.current?.source === "late");
  log("Web Speech is NOT called when premium catches up", webSpeechCalled === false);
}

// Test 2: User advances before late audio arrives → suppressed
{
  const cache = makeCache();
  const audioRef = makeAudioRef();
  prefetch(cache, "step-0", () => new Promise(r => setTimeout(() => r("blob:step0"), 800)));
  // Kick off speak; don't await yet
  const speakPromise = speakWithLateHandling(
    cache, "step-0", () => null, 200, audioRef, () => {}
  );
  // After 300ms (cap hit + a bit), user "advances" — newer speak runs
  // synchronously and sets audioRef to a different audio.
  await new Promise(r => setTimeout(r, 350));
  audioRef.current = { url: "blob:newer", source: "user-advanced" };
  // Wait for late audio to attempt to play.
  const result = await speakPromise;
  log("stale late audio is suppressed when user advanced", result.outcome === "suppressed-stale");
  log("audioRef preserves the newer audio", audioRef.current?.url === "blob:newer");
}

// Test 3: No prefetch, cap hits, late audio arrives → plays
{
  const cache = makeCache();
  const audioRef = makeAudioRef();
  const result = await speakWithLateHandling(
    cache, "fresh-key",
    () => new Promise(r => setTimeout(() => r("blob:fresh"), 800)),
    200, audioRef, () => {}
  );
  log("fresh fetch + cap hit + late arrival → plays late", result.outcome === "played-late");
  log("fresh late audio is the premium URL", audioRef.current?.url === "blob:fresh");
}

// Test 4: Late audio FAILS → Web Speech fallback (not silence)
{
  const cache = makeCache();
  const audioRef = makeAudioRef();
  let webSpeechCalled = false;
  prefetch(cache, "step-0", () => new Promise(r => setTimeout(() => r(null), 500))); // null = failure
  const result = await speakWithLateHandling(
    cache, "step-0",
    () => null,
    100, audioRef,
    () => { webSpeechCalled = true; }
  );
  log("late premium failure triggers Web Speech fallback",
    result.outcome === "web-speech-late" && webSpeechCalled === true);
  log("user is never left silent on a late failure", webSpeechCalled === true);
}

// Test 5: In-time arrival still plays normally (no regression on fast path)
{
  const cache = makeCache();
  const audioRef = makeAudioRef();
  prefetch(cache, "step-0", () => new Promise(r => setTimeout(() => r("blob:fast"), 50)));
  // Speak only after prefetch has had time to finish.
  await new Promise(r => setTimeout(r, 100));
  const result = await speakWithLateHandling(
    cache, "step-0", () => null, 600, audioRef, () => {}
  );
  // After 100ms wait, status should already be "ready" — but our test
  // model treats that as Path B's "in-time" since it goes through
  // awaitPrefetch.
  log("ready cache hit plays normally (no late path)",
    result.outcome === "played" && audioRef.current?.source === "in-time");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
