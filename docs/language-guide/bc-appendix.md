# GrowQuest BC — Language Guide Appendix

**Companion to:** `shared-guide.md` (v1.1, authored by GrowQuest Alberta)
**This appendix:** BC-specific application notes, May 2026
**Adopted in:** v6.7.20 (with shared guide v1.0); streak rule applied in v6.7.21 (with shared guide v1.1)

This appendix is *additive*. The shared guide is the authoritative source for the voice, the five patterns, and the principles. Anything that applies to both pilots stays there. This document covers only what is specific to BC: the seven Core Competencies, BC reporting conventions, FIPPA-bound consent language, and a few BC-specific implementation notes.

When the two documents conflict, the shared guide wins. If something in this appendix needs to apply to Alberta too, propose it back to Alberta for inclusion in the next version of the shared guide.

---

## 1. The BC Core Competencies — names and child-facing context

BC's K-12 framework uses three Core Competencies, each containing one or more sub-competencies. The full set, with the names children encounter in GrowQuest BC:

**Communication**
- Communicating
- Collaborating

**Thinking**
- Creative Thinking
- Critical & Reflective Thinking (often shortened to "Critical Thinking" in child UI)

**Personal & Social**
- Personal Awareness & Responsibility (often shortened to "Personal Awareness")
- Positive Personal & Cultural Identity (often shortened to "Positive Identity")
- Social Awareness & Responsibility (often shortened to "Social Awareness")

### Applying the shared guide to these names

The shared guide's "practising" pattern works directly: "You've been practising **Critical Thinking**" / "You've spent time with **Collaborating**". No adaptation needed.

The shared guide's "good at / bad at" warning is particularly important for **Positive Personal & Cultural Identity**. That sub-competency name itself is identity-coded by design (BC's framework explicitly centres identity development), so wrapping it in identity-coded language compounds the issue. Use process framing: "You've spent time with how you see yourself" rather than "you're someone with a strong sense of who you are."

The shared guide's "ranking" warning is relevant when displaying multiple sub-competencies side by side. The seven cards on the child's profile should not visually rank them by level. The current implementation (alphabetical or by parent competency, not by progress) is correct.

---

## 2. The BC "I can…" statement convention

BC's framework is built around "I can" statements at each profile level. For example:

> Profile 1 in Communicating: "I can share information about a topic that is important to me."
> Profile 3 in Communicating: "I can present information clearly and in an organized way."

These statements appear as the canonical kid-friendly description for each profile level. In GrowQuest BC's data they live in `sub.kidProfiles[level-1]`.

### How "I can" interacts with the shared guide

The shared guide says to avoid identity labels ("you're someone who…"). It's worth being explicit that **"I can…" statements are NOT identity labels** when used correctly. They describe what the child *can do* — a behaviour state, observable, fluid — not what the child *is*.

The line is:
- ✓ "I can present information clearly" (describes a current capability, can change tomorrow)
- ✗ "I'm a clear communicator" (describes who they are, harder to revise)

The shared guide already prefers process language ("you've been practising…") over capability language ("I can…"). For BC, both are acceptable in their right places:

- The official BC framework wording (the "I can…" statement) stays as-is when displayed as a structural element — for example, in the adult assessment view as a reference, or in the child's profile as a "what you can practise now" card. That's BC framework language, and changing it would obscure the link to BC's documentation.
- The encouragement and observation surrounding that statement uses the shared guide's process pattern. So the framework's "I can present information clearly" sits inside a card whose surrounding language is "You've been practising Communicating. What did you notice?"

In short: BC framework language is preserved verbatim where it's the canonical reference; the voice *around* that reference follows the shared guide.

---

## 3. BC reporting context and which surfaces support which moments

BC's K-12 Reporting Policy requires schools to report on Core Competency development. Each formal report includes:

1. **Self-assessment by the student** of their growth in each Core Competency
2. **Goal-setting** by the student for the next reporting period
3. **A descriptive comment by the teacher** with evidence of growth

GrowQuest BC is designed to support each of these moments. This appendix documents which app surfaces feed which reporting moment, so that future writers don't accidentally degrade a surface that has a specific reporting purpose.

| Reporting moment | App surface | Notes |
|---|---|---|
| Student self-assessment | Child Growth Profile view (age-appropriate) | The kid-friendly "I can" statements at the current profile, plus what they've practised |
| Student goal-setting | "What's next, when you're ready" cards on CompDetailScreen | Currently shows the next profile statement; deliberately *not* framed as "your next target" |
| Teacher descriptive comment | Adult Assessment View → "Suggested report card comment" | Pre-drafts a comment with child name, profile level, evidence titles, and student reflection quote |

**Implication for language reviewers:** when you encounter a string on one of these surfaces, you're not just writing copy — you're shaping how a child or teacher will engage with the term-end reporting process. Be especially careful that the language supports rather than substitutes for the conversation that's meant to happen between teacher, student, and family.

---

## 4. FIPPA, consent, and child-facing privacy language

BC's Freedom of Information and Protection of Privacy Act (FIPPA) governs how schools collect, store, and share student information. GrowQuest BC is deployed to school districts (the public body under FIPPA), with the app acting as data processor.

Most FIPPA-related text is parent- or administrator-facing (the consent screen, the parent dashboard's data-handling notice, the share-code system). Some elements are child-facing:

- The "you can ask your parent or teacher to look at this together" framing in any shared artifact
- The consent screen the parent sees before the child uses the app — needs to be honest about what's collected without using the gushing or transactional language the shared guide warns against
- The parent share-code flow — the language a child sees when sharing their profile with a parent

### Tone for child-facing privacy language

The shared guide's voice applies, with one BC-specific addition: **plain reassurance language about who can see what.** This matters because BC families have a high baseline awareness of educational data privacy after the 2021 FIPPA amendments.

- ✓ "Your parent or teacher can see this if you share it with them."
- ✓ "This stays on your device until you choose to share it."
- ✗ "Your stuff is safe!" (gushing, vague)
- ✗ "Privacy protected." (jargon)

### Consent and capacity language

The shared guide doesn't address consent because consent is parent-facing in both pilots. BC-specific note: a child under 13 cannot give meaningful consent to data collection under common interpretations of BC privacy law. Any language that frames a child as "consenting" or "agreeing" to data use should be carefully reviewed — typically the consent flow should be parent-mediated, and the child's screens should not imply they're making a legal commitment.

---

## 5. The streak-for-younger-children rule (resolved in shared guide v1.1)

The shared guide flags streak counters as something to watch ("'You came back today' is gentler than '3-day streak 🔥'"). v1.0 left the BC-specific question — *should the streak counter exist at all for ages 4-6?* — as an open item; v1.1 of the shared guide answers it: **for ages 4-6, continuous-streak math is removed from the child UI entirely and replaced with milestone framing.**

**Implemented in v6.7.21:**
- Dashboard tile: Early Years (4-6) now shows "{N} visits this week" computed from quest history. Primary and Intermediate keep the v6.7.20 "{N} days · came back" framing.
- Accessibility narration: Early Years receives "You have visited N times this week"; older ages receive "You have come back N days in a row."
- The streak counter remains in the data layer (`profile.streak`) for teacher reporting. Only the visible-to-child display changes.

**Open question for further pilot feedback:** is "visits this week" the right cadence, or should it be "visits this month" / "visits since you started"? Weekly framing avoids the daily-streak pressure but still implies a weekly check-in expectation. Worth observing in real pilot use.

---

## 6. BC implementation map — where the principles live in code

As of v6.7.20 (May 2026), the shared guide's principles are applied in BC across these surfaces. This list lets a reviewer quickly check whether a surface is "covered" by the alignment work or still pending.

### Fully aligned (audited against the shared guide)

- **Guided onboarding dialogue** (App.jsx ~line 1144) — rewritten end-to-end as witness language in v6.7.19
- **Quest completion celebration** (App.jsx ~line 247) — "Amazing Growth!" → "Quest done. Nice noticing." in v6.7.19. Trophy 🏆 and confetti animations replaced with quieter ✨ in v6.7.20.
- **Profile-up celebration** (App.jsx ~line 126) — "Level N Unlocked!" → "Something changed in {sub}" in v6.7.19
- **StarsExplainer** (App.jsx ~line 143) — reframed in v6.7.19; flagged by the shared guide as priority surface
- **Child Growth Profile views — Early/Primary/Intermediate** (`src/portfolio/`) — built v6.7.17, language revised v6.7.18, audited v6.7.19. The 6-of-6 ranking stamps in Primary and Intermediate views replaced with quest-count dots in v6.7.20 (evidence of practice, not position on a ladder).
- **Encouragement templates** (`src/portfolio/encouragementTemplates.js`) — revised v6.7.18 with reviewer input; principles encoded as unit tests
- **Reflection prompts** (App.jsx step 2 in QuestScreen) — "What does this show about your growth?" → "What did you notice?" in v6.7.19
- **Self-assessment screen** (App.jsx step 3 in QuestScreen) — "How am I growing?" → "Where am I now?" in v6.7.19
- **Dashboard companion strip** — Level N labels dropped from child-facing UI in v6.7.19
- **CompDetailScreen** — "Strengths I've built" → "What you've practised"; "Next goal" → "What's next, when you're ready" in v6.7.19
- **Quest descriptions** — identity-coded prompts ("What are you really good at?", "things you're better at than most kids your age", "Pick something you're good at") rewritten as process prompts in v6.7.20
- **Streak indicator** — "Day Streak 🔥" → "{N} days · came back" in v6.7.20 (also softened in accessibility narration)
- **Dashboard "Growth Realms" section header** — renamed to "Realms" in v6.7.20 to reduce overuse of "growth"
- **Avatar evolution titles** (`EVOLUTION_TITLES` array) — "Champion" and "Legend" replaced with "Wanderer" and "Companion" in v6.7.20; "Baby" replaced with "Sprout" for consistency with the growth-stage metaphor and to avoid infantilising older children
- **Parent Dashboard "Strongest Area" / "Growth Opportunity"** — reframed as "Most practised" / "Yet to explore" in v6.7.20 (the parent dashboard sits between child- and teacher-facing, and the shared guide flags this surface as needing thoughtful treatment)
- **translations.js** `profileUp` keys (en + fr) — updated v6.7.19

### Adult / teacher-facing — NOT subject to this guide

- **Adult Assessment View** (`src/portfolio/GrowthProfileView.jsx`) — Profile N pills, evidence sections, teacher comment drafts. Correct for that audience.
- **TeacherDashboard.jsx** — uses BC reporting language (Self-Assessment / Evidence / Goals / Family Guidance). Correct for that audience.
- **generateManual.js** — parent/teacher manual with full "Level 2 (Developing)" progression language. Correct for that audience.

### Pending — flagged for future revision

- **Star calculation weighting** — the shared guide's section 1 of "what this doesn't fix" applies. Reflection currently adds 0-3 stars; completion adds 2-5. A future architectural review should consider whether reflection should outweigh completion. Pass B/C work.
- **Streak counter for Early Years** — flagged in section 5 of this appendix. Whether to remove or replace with non-continuous "visits this week" framing for ages 4-6 specifically.
- **The avatar evolution mechanic itself** — shared guide section 2 of "what this doesn't fix" applies. Whether to keep tied to stars or shift to reflection moments. Pass B/C work.

---

## 7. Feedback to Alberta — resolution status

These were the three items BC raised in adopting v1.0 of the shared guide. All three were folded into v1.1.

1. **Streak counters for ages 4-6** — RESOLVED in shared guide v1.1 §"Streaks". Position: remove continuous-streak math for Early Years, replace with milestone framing. Implemented in BC v6.7.21 (see section 5 above).

2. **The "I can…" statement clarification** — RESOLVED in shared guide v1.1 §"A note on canonical framework language". The principle now applies to both products: framework language (BC's "I can…" statements, AB's long-form profile strings) is preserved verbatim where it appears as a canonical reference; the voice around it follows the guide. BC's existing implementation already complies.

3. **The warmth/evaluation line in self-assessment specifically** — RESOLVED in shared guide v1.1 §"The warmth/evaluation line in self-assessment specifically". The three-question test (uniformity across choices / independence from choice / equal treatment of skip) gives reviewers an operational tool. **Pending application:** BC's self-assessment screen has not yet been audited against the v1.1 test. See section 8.

## 8. Self-assessment screen — pending audit against shared guide v1.1

When v1.1 of the shared guide added the warmth/evaluation test for self-assessment, BC ran the test against the v6.7.20 self-assessment screen and surfaced three issues:

- **Early-years option labels** ("Just starting!" / "Getting better!" / "I can do it!") have implicit ranking with exclamation marks that suggest "I can do it!" is the desired answer. A 5-year-old who picks "Just starting!" may feel they gave the "wrong" answer. **Fails:** uniformity test.

- **Visible L1-L4 pills** beside kid-profile statements (Primary/Intermediate) put the level number directly in front of the child during the assessment. **Fails:** the shared guide's general principle of de-emphasising levels in the child experience.

- **"✓ Strength I've built"** label on visited levels evaluates the level the child reached and uses identity-coded "strength" language. **Fails all three of v1.1's tests:** the response isn't uniform, depends on which level was visited, and treats some levels as more valued than others.

These are scheduled for v6.7.22, pending v1.1 of the shared guide being finalised so the implementation aligns with the agreed wording.

---

## Version notes

- **v1.0** (May 2026, adopted in GrowQuest BC v6.7.20) — Initial BC appendix to Alberta's shared guide v1.0. Documents the seven BC Core Competencies, BC reporting context, FIPPA-bound consent language, the streak-for-young-children open question, and the BC implementation map as of v6.7.19.
- **v1.1** (May 2026, with GrowQuest BC v6.7.21) — Updated to reference shared guide v1.1. Streak-for-young-children resolved and implemented in v6.7.21. "I can…" clarification absorbed into v1.1 of the shared guide and now applies to both products. Self-assessment screen audit against v1.1's three-question test added as section 8; fixes scheduled for v6.7.22.
