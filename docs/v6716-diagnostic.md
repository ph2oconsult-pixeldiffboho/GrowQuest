# v6.7.16 Live Deploy Diagnostic

After pushing v6.7.16 and verifying Vercel has deployed, open the live app and paste the script below into the browser's dev tools Console tab. It runs a self-check against the v6.7.16 data shape and reports anomalies inline.

No dependencies, no installs. Just paste and read the output.

## How to use

1. Open the live app in a browser
2. Complete a quest (or several)
3. Open dev tools → Console tab
4. Paste the script below, press Enter
5. Read the diagnostic output

## The script

```javascript
(function v6716Diagnostic() {
  const RESULTS = [];
  const log = (label, ok, detail) => {
    RESULTS.push({ ok, label, detail });
    console.log(ok ? "%c✓" : "%c✗", ok ? "color:#10B981;font-weight:bold" : "color:#EF4444;font-weight:bold", label, detail ?? "");
  };

  // 1. Profile exists
  let profile;
  try {
    profile = JSON.parse(localStorage.getItem("growquest_bc_v3") || "null");
    log("Profile exists in localStorage", !!profile, profile ? `child: ${profile.name}` : "missing");
  } catch (e) {
    log("Profile is parseable JSON", false, e.message);
    return;
  }
  if (!profile) return;

  // 2. Progress shape
  const subKeys = Object.keys(profile.progress || {});
  log("Progress has all 7 sub-competencies", subKeys.length === 7, `found ${subKeys.length}: ${subKeys.join(", ")}`);

  // 3. Quest history shape
  const allHistory = Object.values(profile.progress || {}).flatMap(p => p.questHistory || []);
  log("Quest history is an array", Array.isArray(allHistory), `${allHistory.length} entries total`);

  // 4. At least one history entry exists (otherwise can't verify v6.7.16 capture)
  if (allHistory.length === 0) {
    log("Has quest history to verify", false, "complete at least one quest, then re-run");
    return;
  }

  // 5. Latest history entry shape — v6.7.16 fields should be present on new entries
  const latest = allHistory[allHistory.length - 1];
  log("Latest entry has title", typeof latest.title === "string", latest.title);
  log("Latest entry has date", typeof latest.date === "string", latest.date);
  log("Latest entry has stars", typeof latest.stars === "number", latest.stars);

  // v6.7.16 additions — may or may not be present depending on quest type
  const has16Fields = "response" in latest || "responseType" in latest;
  log("Latest entry has v6.7.16 artifact fields", has16Fields, has16Fields ? `responseType: ${latest.responseType}, response length: ${(latest.response || "").length}` : "Either pre-v6.7.16 data OR quest was completed before v6.7.16 deployed");

  if ("response" in latest) {
    log("Response is captured", typeof latest.response === "string", `length: ${latest.response.length}`);
  }
  if ("reflectionText" in latest) {
    log("Reflection text field exists", true, latest.reflectionText ? `"${latest.reflectionText.slice(0, 50)}..."` : "(empty)");
  }

  // 6. Companion voice config
  const voice = localStorage.getItem("gq_premium_voice");
  log("Premium voice config present", !!voice);
  if (voice) {
    try {
      const v = JSON.parse(voice);
      log("Premium voice enabled", v.enabled === true, `voice: ${v.voiceName || v.voiceId}`);
    } catch (e) {
      log("Voice config parseable", false, e.message);
    }
  }

  // 7. Accessibility config
  const a11y = localStorage.getItem("gq_accessibility");
  if (a11y) {
    try {
      const a = JSON.parse(a11y);
      log("Accessibility config parseable", true, `audioNarration: ${a.audioNarration}, voiceName: ${a.voiceName}`);
    } catch (e) {
      log("A11y parseable", false, e.message);
    }
  }

  // 8. Portfolio data builder is reachable
  // The portfolio builder is a module — we can't directly invoke it, but we can
  // verify the data shape is what it would consume.
  const ready = subKeys.every(k => profile.progress[k] && typeof profile.progress[k].profile === "number");
  log("Profile data is portfolio-ready", ready);

  // Summary
  const failed = RESULTS.filter(r => !r.ok).length;
  console.log("");
  console.log(failed === 0 ? "%c✓ All checks passed" : `%c✗ ${failed} check(s) failed`,
    failed === 0 ? "color:#10B981;font-size:14px;font-weight:bold" : "color:#EF4444;font-size:14px;font-weight:bold");
  console.log("");
  console.log("To see your profile data:");
  console.log("  JSON.parse(localStorage.getItem('growquest_bc_v3'))");

  return RESULTS;
})();
```

## What each line means

- **Profile exists**: localStorage has a saved profile. If this fails, the user has never completed onboarding (or storage is disabled).
- **Progress has all 7 sub-competencies**: the initial data model is correct. Should always pass.
- **Quest history is an array / has entries**: at least one quest completion has happened.
- **Latest entry has v6.7.16 artifact fields**: the new fields (response, responseType, reflection, reflectionText) are present on the latest quest. *If this fails on a quest completed AFTER v6.7.16 was deployed, that's a bug.* If it fails on an old quest, that's expected — pre-v6.7.16 entries don't have these fields.
- **Response is captured**: the actual content the child entered. For text quests this is their typed answer; for emoji quests it's the emoji.
- **Profile data is portfolio-ready**: the structure the portfolio component expects is present.

## Common issues this catches

1. **localStorage migration broke something**: profile shape changes between versions can corrupt saved data.
2. **Quest completion path didn't update qDone**: response field missing on new entries means the new artifact-capture wiring isn't working.
3. **Voice config drift**: premium voice toggled off, voice ID stale, etc.
