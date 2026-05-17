import { useState, useEffect, useRef } from "react";
import T from "./data/translations.js";
import TeacherDashboard, { ShareProgressButton } from "./TeacherDashboard.jsx";
import AccessibilityPanel, { loadAccessibility, saveAccessibility, applyAccessibility, useNarration, useAutoNarrate, speakWithPremiumFallback } from "./AccessibilityPanel.jsx";
import ParentPreferences from "./ParentPreferences.jsx";
import VoicePicker, { loadCompanionVoice, saveCompanionVoice } from "./VoicePicker.jsx";
import VoiceDiagnostics from "./VoiceDiagnostics.jsx";
import { loadPremiumVoiceConfig, synthesizePremiumSpeech } from "./elevenlabs.js";
import { generateCertificate } from "./certificates/generateCertificate.js";
import { generateUserManual } from "./certificates/generateManual.js";
import { generateStudentReport } from "./certificates/generateReport.js";
import GrowthProfileView from "./portfolio/GrowthProfileView.jsx";
import ChildProfileRouter from "./portfolio/ChildProfileRouter.jsx";
import { buildPortfolioData } from "./portfolio/buildPortfolioData.js";


// ═══════════════════════════════════════════════════════════════════
// GROWQUEST BC v6.7.3 — Voice Picker Everywhere
// 1. Kid-friendly "I can…" translations (kidProfiles)
// 2. Growth Stars (not XP) with clear breakdown
// 3. localStorage session persistence
// 4. Age-adapted quests (Early=emoji/voice/drawing, Primary=guided, Intermediate=reflective)
// 5. Voice-to-text via Web Speech API
// v6.7 — hashed PIN, encrypted share codes, CORS lockdown, truthful certificate evidence, voice cost fix.
// v6.7.1 — welcome-back narration plays once per day; story prompt rewritten for narrative flow.
// v6.7.2 — Parent Preferences hub (narrator voice, rate, pitch, theme).
// v6.7.3 — companion voice picker on consent / welcome / dashboard; narration deferred until user taps Start.
// v6.7.4 — optional ElevenLabs premium voices via bring-your-own-key (Stage 1).
// v6.7.5 — premium voices now server-proxied (Stage 2); on by default for all families.
// v6.7.6 — voice/text sync: typewriter waits for audio with 600ms cap; prefetches next step.
// v6.7.7 — voice list curated to 5; speech-rate slider added to Accessibility (affects companion too).
// v6.7.8 — premium voice catches up: late-audio handling in all paths means cold-start (e.g. step 0) no longer falls back to Web Speech. Voice picker (consent/welcome/onboarding/dashboard) now shows curated ElevenLabs voices when premium is on, curated Web Speech voices when off.
// v6.7.9 — curated voices swapped to conversational (Aria/Jessica/Laura/Matilda/Sarah); default model upgraded from Flash v2.5 to Multilingual v2 (2x cost, warmer); voice_settings tuned for less robotic delivery.
// v6.7.10 — fixed: accessibility narration (Read Aloud / Full Audio Mode) routes through premium voice when enabled, no longer plays system voice on top of ElevenLabs companion.
// v6.7.11 — fixed: late audio from a previous step (step 0 or 1) no longer plays on top of the current step's audio. Uses a generation counter to distinguish between speak() calls instead of an audioRef snapshot (which couldn't tell two adjacent in-flight calls apart).
// v6.7.12 — 10 curated voices (5F + 5M), resolved by name at runtime (was: hardcoded IDs); country labels removed from voice descriptions; default voice now resolved as "Aria" against the live ElevenLabs voices endpoint.
// v6.7.13 — fixed regression where name resolution failure silently fell back to Web Speech. Both /api/tts and /api/tts-voices now use hardcoded fallback IDs (same as v6.7.11) whenever /v1/voices fails or returns no matching names. Premium voice path is never silently broken.
// v6.7.14 — added Voice Diagnostics tool in Parent Dashboard + GET /api/tts-health endpoint. Parent can tap "Run check" to see whether server-to-ElevenLabs, picker voice list, and real synthesis all work — without opening dev tools.
// v6.7.15 — fixed remaining overlap on step 3+: the synchronous-url branch of speak() (Path A cache hit, or Path B success within cap) didn't re-check generation before playing. A stale speak() Promise that resolved during a newer speak()'s setup would play its audio on top of the newer one. Now every audio.play() is preceded by a generation check.
// v6.7.16 — Growth Profile foundation (v6.8 step 1 of 2): quest history now captures response text + curriculum-aligned reflection; new GrowthProfileView component shows the in-app portfolio; dashboard button "[Name]'s Growth Profile" opens it. PDF/DOCX export, Parent Dashboard trigger, name prompt, possessive naming everywhere, "Growing toward..." card come in v6.7.17.
// v6.7.17 — age-appropriate child profile views (early/primary/intermediate); dashboard button now routes to age-tiered child experience (visual progression, no numbers, encouragement language); the v6.7.16 assessment view is now reachable only from Parent Dashboard. Template-based encouragement language lives in src/portfolio/encouragementTemplates.js so a teacher/writer can revise without code changes.
// v6.7.18 — encouragement templates revised after reviewer feedback. Replaced generic praise ("Look what you've done!") and identity labels ("you're someone who likes X") with process-noticing language ("you tried this", "you spent time with X"). Removed external-approval framing ("{avatarName} is proud of you" → "{avatarName} noticed your effort"). Early-years language now emphasises emotional safety ("ready when you are") over stimulation ("adventures waiting!"). Added unit tests that encode the principles so future template additions don't regress.
// v6.7.19 — Pass A of philosophical language audit (separate from full Pass B/C in a future beta branch). Reviewer flagged the product still leaned subtly toward "performance and progression" rather than "reflection and self-awareness." This pass keeps the data model intact (stars, levels still stored) but shifts every child-facing surface from achievement framing to observation framing: "Level N Unlocked!" → "Something changed in {sub}", "Amazing Growth!" → "Quest done. Nice noticing.", "How am I growing?" → "Where am I now?", "What does this say about you?" → "Want to add a note?", "Get My Stars! ⭐" → "Finish quest →". Onboarding dialogue rewritten as witness language ("I'm so excited to meet you" → "Glad you're here", "I'll grow bigger" → "you don't have to chase stars"). Dropped "Level N" labels from dashboard companion strip, "What I Can Do" cards, realm tiles, and the top-right avatar badge — they remain only in the adult assessment view where they belong.
// v6.7.20 — Adopted Alberta's shared child-facing language guide (docs/language-guide/shared-guide.md) with BC-specific appendix (docs/language-guide/bc-appendix.md). Re-audit of v6.7.19 against the guide found violations I'd missed: identity-coded quest descriptions ("What are you really good at?", "things you're better at than most kids your age", "Pick something you're good at"), "Day Streak 🔥" framing, trophy-and-confetti dominance on quest completion, "Strongest Area / Growth Opportunity" on parent dashboard, "Growth Realms" section header, "Champion / Legend" in avatar EVOLUTION_TITLES, 6-of-6 ranking stamps in child profile views. All fixed in v6.7.20. Quest stamps replaced with quest-count dots (evidence of practice rather than position-on-ladder). Avatar titles softened ("Champion" → "Wanderer", "Legend" → "Companion", "Baby" → "Sprout"). Parent dashboard reframed ranking labels as behavioural ("Most practised" / "Yet to explore").
// v6.7.21 — implemented v1.1 shared-guide streak rule for Early Years (4-6). Continuous-streak math removed from the child-facing UI for that age group; replaced with "{N} visits this week" milestone framing computed from quest history. Primary and Intermediate keep the "{N} days · came back" framing introduced in v6.7.20. Same change applied to accessibility narration. Streak counter remains in the data layer for teacher reporting (no schema change). Self-assessment screen audit against v1.1's three-question test surfaced issues with "Just starting / Getting better / I can do it" early-years options, visible L1-L6 pills during primary/intermediate self-assessment, and "Strength I've built" on visited levels — these are documented in the reply to Alberta and held for v6.7.22 once v1.1 of the shared guide is final.
// v6.7.22 — self-assessment audit fixes. Mirrored Alberta's v1.2 fixes for the three audit items: (1) submit buttons now symmetric (dropped gold-to-orange gradient that signalled reward-on-selection — competency colour in both states); (2) "✓ Strength I've built" badge removed entirely from visited levels — identity-coded language replaced with no marker; (3) early-years self-assessment options replaced with "I'm just trying it / I'm getting the hang of it / I've practised this a lot" plus removal of the redundant "How much can you do this?" helper text. ALSO removed L1-L4 pills from primary/intermediate self-assessment (BC's deliberate design choice — Design 1: statement is the sole content, no visual ranking anchor). Reflection→self-assessment button unified to "Where am I now? →" across ages; step 3 heading unified to "Where am I now?" across ages. NEW: language-regression.test.mjs encodes 19 forbidden phrases as a build-time gate so future regressions can't ship silently. The regression test caught 12 real defects on first run — every translation key that had drifted from the live UI strings (since v6.7.19) was caught and fixed.
// ═══════════════════════════════════════════════════════════════════

const COMPETENCIES={communication:{name:"Communication",color:"#2563EB",colorLight:"#DBEAFE",gradient:"linear-gradient(135deg,#3B82F6,#1D4ED8)",icon:"💬",realm:"Echo Isles",subCompetencies:{communicating:{name:"Communicating",profiles:["I respond meaningfully to communication from peers and adults.","I talk and listen to people I know. I can communicate for a purpose.","I communicate purposefully, using forms and strategies I have practiced.","I communicate clearly and purposefully, using a variety of forms appropriately.","I communicate confidently, showing attention to my audience and purpose.","I communicate with intentional impact, in well-constructed forms."],kidProfiles:["I can listen and show people I understand them.","I can talk and listen to people I know to share ideas.","I can share my ideas using ways I've learned and practiced.","I can explain things clearly using different ways like talking, writing, or drawing.","I think about who I'm talking to and choose the best way to share my message.","I can share powerful messages that make a real difference."]},collaborating:{name:"Working Together",profiles:["I can participate with others in familiar situations.","I cooperate with others for specific purposes.","I contribute during group activities and share roles and responsibilities.","I can confidently interact and build relationships to further shared goals.","I can facilitate group processes and encourage collective responsibility.","I can connect my group with broader networks for various purposes."],kidProfiles:["I can join in when I'm with people I know.","I can work with others to get things done.","I do my part in group work and help share the jobs.","I work well with others and help us reach our goals together.","I can help lead a group and make sure everyone is included.","I can bring different groups together to do bigger things."]}}},thinking:{name:"Thinking",color:"#7C3AED",colorLight:"#EDE9FE",gradient:"linear-gradient(135deg,#8B5CF6,#6D28D9)",icon:"🧠",realm:"Wonder Peaks",subCompetencies:{creativeThinking:{name:"Creative Thinking",profiles:["I get ideas when I play.","I can get new ideas or build on others' ideas to create new things.","I can get new ideas in areas I'm interested in and build skills to make them work.","I can get new ideas or reinterpret others' ideas in novel ways.","I can think outside the box and persevere to develop innovative ideas.","I can develop a body of creative work over time in an area of passion."],kidProfiles:["I get ideas when I play and explore!","I can come up with new ideas or add to someone else's idea.","I get creative ideas about things I care about and work to make them real.","I can take ideas and twist them into something totally new and different.","I keep going even when it's hard, and I come up with things nobody thought of before.","I keep creating amazing things about something I really love."]},criticalThinking:{name:"Thinking It Through",profiles:["I can explore materials and actions.","I can use evidence to make simple judgments.","I can ask questions and consider options using observation and imagination.","I can combine new evidence with what I know to develop reasoned conclusions.","I can evaluate well-chosen evidence to identify alternatives and implications.","I can examine evidence from various perspectives to analyze complex issues."],kidProfiles:["I like to explore and try things out.","I can look at clues to figure things out.","I ask good questions and think about different answers.","I can put together what I already know with new things I learn.","I look carefully at information to see what's really going on.","I can look at tricky problems from lots of different sides."]}}},personalSocial:{name:"Personal & Social",color:"#059669",colorLight:"#D1FAE5",gradient:"linear-gradient(135deg,#10B981,#047857)",icon:"🌱",realm:"Heartwood Grove",subCompetencies:{positiveIdentity:{name:"Knowing Myself",profiles:["I am aware of myself as different from others.","I am aware of different aspects of myself.","I can describe different aspects of my identity.","I have pride in who I am. I am part of larger communities.","I understand that my identity is influenced by many aspects of my life.","I can identify how my life experiences have contributed to who I am."],kidProfiles:["I know I am my own person, different from everyone else.","I know there are lots of parts that make me, me!","I can tell you about what makes me special and unique.","I'm proud of who I am and I belong to communities that matter.","I understand that my family, culture, and experiences all shape who I am.","I can see how all my experiences have helped me become who I am today."]},personalAwareness:{name:"Taking Care of Myself",profiles:["I can show joy and express some wants, needs, and preferences.","I can seek out experiences that make me feel happy and proud.","I can make choices that help me meet my needs and increase my well-being.","I can recognize my strengths and use strategies to manage stress and reach goals.","I recognize my value and take responsibility for my choices and achievements.","I can find internal motivation and act on opportunities for self-growth."],kidProfiles:["I can show when I'm happy and tell people what I want or need.","I look for things that make me feel happy and proud of myself.","I make choices that are good for me and help me feel well.","I know what I'm good at and I have ways to handle tough feelings.","I know I matter, and I take charge of my choices.","I push myself to grow because I want to, not just because someone tells me."]},socialAwareness:{name:"Caring for Others",profiles:["I can be aware of others and my surroundings.","I can interact with others and my surroundings respectfully.","I can interact with others and the environment respectfully and thoughtfully.","I can take purposeful action to support others and the environment.","I can advocate and take action for my communities and the natural world.","I can initiate positive, sustainable change for others and the environment."],kidProfiles:["I notice the people and world around me.","I treat people and the world around me with respect.","I'm thoughtful about how I treat people and take care of the world.","I do things on purpose to help others and take care of nature.","I stand up for my community and the natural world and take action to help.","I start projects that make a lasting positive difference for others and the planet."]}}}};

const AVATARS=[{id:"owl",emoji:"🦉",name:"Wise Owl",desc:"Curious and thoughtful",type:"bird",evolutions:["🥚","🐣","🐥","🦉","🦉","🦉"]},{id:"fox",emoji:"🦊",name:"Clever Fox",desc:"Creative and quick",type:"mammal",evolutions:["🌰","🐾","🦊","🦊","🦊","🦊"]},{id:"bear",emoji:"🐻",name:"Kind Bear",desc:"Strong and caring",type:"mammal",evolutions:["🌰","🐾","🧸","🐻","🐻","🐻"]},{id:"dolphin",emoji:"🐬",name:"Bright Dolphin",desc:"Playful and social",type:"marine",evolutions:["🫧","💧","🐟","🐬","🐬","🐬"]},{id:"eagle",emoji:"🦅",name:"Bold Eagle",desc:"Brave and focused",type:"bird",evolutions:["🥚","🐣","🐥","🦅","🦅","🦅"]},{id:"deer",emoji:"🦌",name:"Gentle Deer",desc:"Calm and aware",type:"mammal",evolutions:["🌰","🐾","🦌","🦌","🦌","🦌"]},{id:"orca",emoji:"🐋",name:"Team Orca",desc:"A leader and friend",type:"marine",evolutions:["🫧","💧","🐟","🐋","🐋","🐋"]},{id:"raven",emoji:"🪶",name:"Story Raven",desc:"Wise storyteller",type:"bird",evolutions:["🥚","🐣","🐥","🪶","🪶","🪶"]}];
const EVOLUTION_TITLES=["Seed","Sprout","Young","Explorer","Wanderer","Companion"];
const AGE_GROUPS=[{id:"early",label:"Early Years",range:"Ages 4–6",emoji:"🌟"},{id:"primary",label:"Primary",range:"Ages 6–9",emoji:"🚀"},{id:"intermediate",label:"Intermediate",range:"Ages 9–12",emoji:"⚡"}];

// Age-adapted quests
const QUESTS={communication:{early:[{id:"ce1",title:"Feelings Show",desc:"Pick the emoji that shows how you feel right now!",sub:"communicating",difficulty:"easy",profile:1,minutes:3,icon:"😊",inputType:"emoji"},{id:"ce2",title:"My Favourite Thing",desc:"Draw your favourite thing, then tell someone about it!",sub:"communicating",difficulty:"easy",profile:2,minutes:5,icon:"🖍️",inputType:"drawing"},{id:"ce3",title:"Helping Hands",desc:"Can you teach someone how to tie their shoes, stack blocks really high, or make a paper airplane? Pick one and show them step by step!",sub:"collaborating",difficulty:"easy",profile:2,minutes:5,icon:"🤝",inputType:"emoji"},{id:"ce4",title:"Story Time",desc:"Tell a story about a brave little animal who goes on an adventure. Where do they go? Who do they meet? Use your voice!",sub:"communicating",difficulty:"medium",profile:2,minutes:5,icon:"🎤",inputType:"voice"}],primary:[{id:"cp1",title:"Story Spark",desc:"Describe your favourite place — maybe your bedroom, a park, or grandma's house. What does it smell like? Sound like? Why does it feel special to you?",sub:"communicating",alsoTouches:["positiveIdentity"],difficulty:"easy",profile:2,minutes:8,icon:"🎙️",inputType:"voice"},{id:"cp2",title:"Team Builders",desc:"You're planning a surprise birthday party for a friend! With a partner, decide: Who brings food? Who makes decorations? Who picks the music? Who sends invitations?",sub:"collaborating",difficulty:"medium",profile:3,minutes:10,icon:"🎉",inputType:"text"},{id:"cp3",title:"Picture Words",desc:"Draw a silly monster with at least 5 weird features. Then describe it to someone WITHOUT showing them — can they draw it from your words alone?",sub:"communicating",alsoTouches:["creativeThinking"],difficulty:"medium",profile:3,minutes:12,icon:"🎨",inputType:"voice"},{id:"cp4",title:"Question Master",desc:"Ask a family member to tell you about their favourite childhood memory. Listen carefully, then ask 3 questions that start with WHO, WHAT, or WHY.",sub:"communicating",alsoTouches:["socialAwareness"],difficulty:"medium",profile:4,minutes:8,icon:"🔎",inputType:"text"}],intermediate:[{id:"ci1",title:"Audience Switch",desc:"Pick ONE: how rain works, why we sleep, or how WiFi works. First explain it to a 5-year-old using simple words. Then explain the same thing to a teacher using proper vocabulary.",sub:"communicating",difficulty:"hard",profile:5,minutes:12,icon:"🎭",inputType:"text"},{id:"ci2",title:"Bridge Builder",desc:"Two friends want to play different games at recess — one wants soccer, one wants tag. Write a solution that uses the best parts of BOTH ideas so everyone's happy.",sub:"collaborating",alsoTouches:["criticalThinking"],difficulty:"hard",profile:5,minutes:15,icon:"🌉",inputType:"text"},{id:"ci3",title:"Debate Coach",desc:"Pick a topic you care about. Write the best argument FOR it, then AGAINST it.",sub:"communicating",alsoTouches:["criticalThinking"],difficulty:"hard",profile:5,minutes:15,icon:"⚡",inputType:"text"},{id:"ci4",title:"Teach It",desc:"Pick something you've practised — a card game, a sport trick, a recipe, or a drawing technique. Write a 5-step lesson that a Grade 1 student could follow.",sub:"communicating",alsoTouches:["collaborating"],difficulty:"hard",profile:4,minutes:12,icon:"📚",inputType:"text"}]},thinking:{early:[{id:"te1",title:"What Is It?",desc:"Look at a spoon. What ELSE could it be? A tiny shovel? A drum stick? Think of 3 silly ideas!",sub:"creativeThinking",difficulty:"easy",profile:1,minutes:3,icon:"🥄",inputType:"voice"},{id:"te2",title:"Which One?",desc:"Which shape doesn't belong? Why do you think so?",sub:"criticalThinking",difficulty:"easy",profile:2,minutes:3,icon:"🔷",inputType:"emoji"},{id:"te3",title:"Dream House",desc:"Draw your dream treehouse. What cool things would it have?",sub:"creativeThinking",difficulty:"easy",profile:2,minutes:5,icon:"🏠",inputType:"drawing"},{id:"te4",title:"Find the Match",desc:"Find two things in your room that are the same colour. Now two that are the same shape!",sub:"criticalThinking",difficulty:"easy",profile:2,minutes:5,icon:"🔍",inputType:"voice"}],primary:[{id:"tp1",title:"What If?",desc:"Grab a sock from your drawer. Now invent 5 wild uses for it that have NOTHING to do with feet. A puppet? A phone case? A bird house? Go wild!",sub:"creativeThinking",difficulty:"easy",profile:2,minutes:7,icon:"💡",inputType:"voice"},{id:"tp2",title:"Mystery Box",desc:"The mystery box makes a rattling sound, is heavier than a book, and feels warm. What could it be? Give 3 guesses and explain WHY each one fits the clues.",sub:"criticalThinking",difficulty:"medium",profile:3,minutes:10,icon:"🔍",inputType:"text"},{id:"tp3",title:"Remix Lab",desc:"A toothbrush and a music player — how could you combine them into one new invention? Draw or describe it!",sub:"creativeThinking",alsoTouches:["communicating"],difficulty:"medium",profile:4,minutes:12,icon:"🧪",inputType:"text"},{id:"tp4",title:"True or Tricky?",desc:"Read these 3 sentences: 'The Earth is round.' 'Pizza is the best food.' 'Dogs can smell 10,000 times better than humans.' Which are FACTS and which are OPINIONS? How can you tell the difference?",sub:"criticalThinking",difficulty:"medium",profile:3,minutes:8,icon:"🤔",inputType:"text"}],intermediate:[{id:"ti1",title:"Invention Studio",desc:"Pick one: lost socks in the laundry, forgetting homework at home, or long lunch lines at school. Design an invention that solves it. Describe how it works and draw a quick sketch.",sub:"creativeThinking",alsoTouches:["personalAwareness"],difficulty:"hard",profile:5,minutes:15,icon:"🛠️",inputType:"text"},{id:"ti2",title:"Two Sides",desc:"Pick a topic where people disagree. Write the best case for EACH side.",sub:"criticalThinking",alsoTouches:["socialAwareness"],difficulty:"hard",profile:5,minutes:15,icon:"⚖️",inputType:"text"},{id:"ti3",title:"Future Thinker",desc:"Your principal says: 'Students can now use phones during lunch.' Write 3 GOOD things that might happen AND 3 PROBLEMS that might happen. What's your final verdict — yes or no?",sub:"criticalThinking",difficulty:"hard",profile:4,minutes:12,icon:"🔮",inputType:"text"},{id:"ti4",title:"Mash-Up Master",desc:"Mash together Math + Art into one new subject. What would it be called? Describe a typical class. What project would students do for their final grade?",sub:"creativeThinking",difficulty:"hard",profile:4,minutes:12,icon:"🎯",inputType:"text"}]},personalSocial:{early:[{id:"pe1",title:"How Do I Feel?",desc:"Pick the face that shows how you feel right now!",sub:"personalAwareness",difficulty:"easy",profile:1,minutes:3,icon:"🪞",inputType:"emoji"},{id:"pe2",title:"I Am Special",desc:"Draw something you've been doing or trying lately. Then tell us about it!",sub:"positiveIdentity",difficulty:"easy",profile:2,minutes:5,icon:"⭐",inputType:"drawing"},{id:"pe3",title:"Calm Cloud",desc:"Breathe in (1-2-3-4), out (1-2-3-4). How does your body feel now?",sub:"personalAwareness",difficulty:"easy",profile:2,minutes:3,icon:"☁️",inputType:"emoji"},{id:"pe4",title:"Kind Helper",desc:"Think of something nice you did for someone. How did it make you feel?",sub:"socialAwareness",alsoTouches:["personalAwareness"],difficulty:"easy",profile:2,minutes:3,icon:"💛",inputType:"emoji"}],primary:[{id:"pp1",title:"My Superpower",desc:"Think of 3 things you've been practising — maybe building things, drawing, or making people laugh. Pick the one that feels most like yours right now, and tell us about a time you used it.",sub:"positiveIdentity",difficulty:"easy",profile:3,minutes:8,icon:"✨",inputType:"voice"},{id:"pp2",title:"Feelings Weather",desc:"Right now, are you: ☀️ Sunny and happy, 🌤️ Mostly good with a few clouds, ⛈️ Stormy and frustrated, or 🌈 Getting better after rain? Pick one and explain what made your weather today.",sub:"personalAwareness",difficulty:"easy",profile:2,minutes:5,icon:"🌤️",inputType:"voice"},{id:"pp3",title:"Kindness Quest",desc:"Do ONE of these right now: write a thank-you note to someone, help clean up without being asked, or compliment a family member on something specific. Then tell us: how did their face look? How did YOU feel?",sub:"socialAwareness",alsoTouches:["personalAwareness"],difficulty:"medium",profile:3,minutes:10,icon:"💛",inputType:"text"},{id:"pp4",title:"My Story Map",desc:"Draw a map of important places, people, and memories that make you who you are.",sub:"positiveIdentity",alsoTouches:["communicating"],difficulty:"medium",profile:4,minutes:12,icon:"🗺️",inputType:"drawing"}],intermediate:[{id:"pi1",title:"Goal Climber",desc:"Set a goal you can finish by Friday — like reading 50 pages, learning 10 new words, or running 2km. Break it into 3 daily steps. Now: what's the #1 thing that might stop you, and what's your backup plan?",sub:"personalAwareness",difficulty:"hard",profile:4,minutes:10,icon:"🏔️",inputType:"text"},{id:"pi2",title:"Community Lens",desc:"Walk around your neighbourhood (or think about your school). Find ONE thing that bothers you — litter, a broken bench, someone being left out. Write a 3-step plan for ONE action YOU could take this week to help.",sub:"socialAwareness",alsoTouches:["criticalThinking"],difficulty:"hard",profile:5,minutes:15,icon:"🌍",inputType:"text"},{id:"pi3",title:"Identity Web",desc:"Name 5 things that make you YOU: a family tradition, a place you've lived, something hard you went through, a person who changed you, and a choice you made. How do these 5 things connect to each other?",sub:"positiveIdentity",difficulty:"hard",profile:5,minutes:12,icon:"🕸️",inputType:"text"},{id:"pi4",title:"Stress Toolkit",desc:"Last time you felt really stressed or upset, what helped? Write your personal Calm-Down Menu with 3 strategies — one for your body (like breathing), one for your mind (like music), and one that involves another person.",sub:"personalAwareness",difficulty:"medium",profile:4,minutes:8,icon:"🧰",inputType:"text"}]}};

function getQuestsForAge(ag){const a=ag||"primary";return{communication:QUESTS.communication[a]||QUESTS.communication.primary,thinking:QUESTS.thinking[a]||QUESTS.thinking.primary,personalSocial:QUESTS.personalSocial[a]||QUESTS.personalSocial.primary};}

// Growth Stars system
const STARS_THRESH=[8,12,16,22,28,35];
const QUEST_STARS={easy:2,medium:3,hard:5};
const REFL_STARS={surface:0,emerging:1,thoughtful:2,deep:3};

function calcStars({difficulty="medium",reflDepth="surface",selfAssessed=false,crossComp=false}){let s=QUEST_STARS[difficulty]||3;s+=(REFL_STARS[reflDepth]||0);if(selfAssessed)s+=1;if(crossComp)s+=1;return s;}
function checkProfileUp(cur,add,prof){if(prof>=6)return{up:false,newProf:6,rem:cur+add};const t=STARS_THRESH[prof-1]||12;const tot=cur+add;if(tot>=t)return{up:true,newProf:prof+1,rem:tot-t};return{up:false,newProf:prof,rem:tot};}
function getAvLv(prog){const k=Object.keys(prog);if(!k.length)return 1;return Math.max(1,Math.min(6,Math.round(k.reduce((s,k2)=>s+prog[k2].profile,0)/k.length)));}

// Persistence
const SK="growquest_bc_v3";
function save(p){try{localStorage.setItem(SK,JSON.stringify(p))}catch(e){}}
function load(){try{const d=localStorage.getItem(SK);return d?JSON.parse(d):null}catch(e){return null}}

// Voice input — records to memory, transcribes ONCE on stop.
// v6.7: previously this re-sent the full accumulated audio every 3 seconds,
// billing ~6× the actual audio length for the same transcript. The UX wasn't
// actually progressive (each chunk overwrote the previous result), so the
// loop is gone. One recording = one API call = one transcript.
function useVoice(){
const[on,setOn]=useState(false);const[txt,setTxt]=useState("");const[busy,setBusy]=useState(false);const[err,setErr]=useState("");
const mediaRef=useRef(null);const streamRef=useRef(null);
const chunksRef=useRef([]);const mimeRef=useRef("");

const transcribe=async(chunks)=>{
if(chunks.length===0){setBusy(false);return}
try{
const blob=new Blob(chunks,{type:mimeRef.current});
const reader=new FileReader();
const base64=await new Promise((res,rej)=>{reader.onload=()=>res(reader.result.split(",")[1]);reader.onerror=rej;reader.readAsDataURL(blob)});
const resp=await fetch("/api/transcribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({audio:base64,mimeType:mimeRef.current})});
const data=await resp.json();
if(data.transcript){setTxt(data.transcript)}
else if(data.error){setErr((data.error||"Failed")+(data.debug?" ["+data.debug+"]":""))}
}catch(e){setErr("Could not transcribe");console.error(e)}
finally{setBusy(false)}};

const start=async()=>{
try{setErr("");setTxt("");chunksRef.current=[];
const stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream;
const mimeType=MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?"audio/webm;codecs=opus":MediaRecorder.isTypeSupported("audio/mp4")?"audio/mp4":"audio/webm";
mimeRef.current=mimeType;
const mr=new MediaRecorder(stream,{mimeType});
mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data)};
mr.onstop=async()=>{
stream.getTracks().forEach(t=>t.stop());
if(chunksRef.current.length===0){setOn(false);return}
setBusy(true);
await transcribe(chunksRef.current);
setOn(false)};
mr.start(1000);mediaRef.current=mr;setOn(true)}
catch(e){setErr("Microphone not available");console.error(e)}};

const stop=()=>{if(mediaRef.current&&on){mediaRef.current.stop();mediaRef.current=null}};
const toggle=()=>on?stop():start();
return{on,txt,busy,err,toggle};}


// Fonts/styles
if(!document.getElementById("gqf")){const l=document.createElement("link");l.id="gqf";l.href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap";l.rel="stylesheet";document.head.appendChild(l)}
if(!document.getElementById("gqs")){const s=document.createElement("style");s.id="gqs";s.textContent=`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}@keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes growBounce{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}@keyframes wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@keyframes ring-expand{0%{transform:scale(0);opacity:.8}100%{transform:scale(3.5);opacity:0}}@keyframes star-spin{0%{transform:rotate(0) scale(0);opacity:0}30%{opacity:1;transform:rotate(180deg) scale(1.2)}100%{transform:rotate(720deg) scale(0);opacity:0}}@keyframes stars-float{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-90px) scale(.5);opacity:0}}@keyframes avatar-evolve{0%{transform:scale(1);filter:brightness(1)}25%{transform:scale(.2);filter:brightness(4)}50%{transform:scale(1.4);filter:brightness(2)}100%{transform:scale(1);filter:brightness(1)}}@keyframes badge-stamp{0%{transform:scale(3) rotate(-20deg);opacity:0}50%{transform:scale(.9) rotate(5deg);opacity:1}70%{transform:scale(1.1) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}@keyframes confetti-fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes number-pop{0%{transform:scale(0) rotate(-10deg)}50%{transform:scale(1.3) rotate(4deg)}100%{transform:scale(1) rotate(0)}}@keyframes mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 12px rgba(239,68,68,0)}}.gq-float{animation:float 3s ease-in-out infinite}.gq-fade-in{animation:fadeSlideUp .5s ease-out forwards}.gq-shimmer{background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.3) 50%,transparent 70%);background-size:200% 100%;animation:shimmer 2.5s infinite}.gq-grow{animation:growBounce .4s ease-out forwards}.gq-wiggle:hover{animation:wiggle .4s ease-in-out}.gq-pulse{animation:pulse 2s ease-in-out infinite}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Nunito',sans-serif}input:focus,textarea:focus{outline:none}`;document.head.appendChild(s)}

// Animations
function ConfettiBlast({active}){if(!active)return null;const c=["#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#96E6A1","#DDA0DD","#FF8C42","#A78BFA"];return<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:200,overflow:"hidden"}}>{Array.from({length:45},(_,i)=><div key={i} style={{position:"absolute",top:-20,left:`${Math.random()*100}%`,width:`${5+Math.random()*9}px`,height:`${5+Math.random()*9}px`,backgroundColor:c[Math.floor(Math.random()*c.length)],borderRadius:Math.random()>.5?"50%":"2px",animation:`confetti-fall ${1.5+Math.random()*2.5}s ease-out ${Math.random()*.8}s forwards`}}/>)}</div>}
function ParticleBurst({active,color="#FFD700"}){const[p,setP]=useState([]);useEffect(()=>{if(!active){setP([]);return}const cs=[color,"#FF6B6B","#4ECDC4","#FFD700","#A78BFA","#34D399"];setP(Array.from({length:20},(_,i)=>{const a=(360/20)*i,d=50+Math.random()*90;return{id:i,sz:4+Math.random()*8,x:Math.cos(a*Math.PI/180)*d,y:Math.sin(a*Math.PI/180)*d,c:cs[i%cs.length],r:Math.random()>.3}}))},[active]);return<div style={{position:"absolute",left:"50%",top:"50%",pointerEvents:"none",zIndex:100}}>{p.map(pt=><div key={pt.id} ref={el=>{if(el&&active)el.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:`translate(calc(${pt.x}px - 50%),calc(${pt.y}px - 50%)) scale(0)`,opacity:0}],{duration:500+Math.random()*400,delay:Math.random()*150,fill:"forwards",easing:"ease-out"})}} style={{position:"absolute",width:pt.sz,height:pt.sz,borderRadius:pt.r?"50%":"2px",backgroundColor:pt.c}}/>)}</div>}
function SpinningStars({active}){if(!active)return null;const s=["⭐","✨","🌟","💫","⭐","✨","🌟","💫"];return<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:95}}>{s.map((st,i)=>{const a=(360/s.length)*i,d=60+Math.random()*35;return<div key={i} style={{position:"absolute",left:"50%",top:"50%",fontSize:14+Math.random()*10,animation:`star-spin ${.7+Math.random()*.4}s ease-out ${i*.07}s forwards`,marginLeft:Math.cos(a*Math.PI/180)*d-10,marginTop:Math.sin(a*Math.PI/180)*d-10}}>{st}</div>})}</div>}
function ExpandingRings({active,color="#FFD700"}){if(!active)return null;return<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:90}}>{[0,.2,.4].map((d,i)=><div key={i} style={{position:"absolute",width:60,height:60,borderRadius:"50%",border:`2px solid ${color}`,animation:`ring-expand 1s ease-out ${d}s forwards`,opacity:0}}/>)}</div>}

function ProfileUpCelebration({subName,subKey,newProfile,profileText,compColor,avatar,childName,avatarName,questsCompleted,onDone}){const[ph,setPh]=useState(0);const[certDone,setCertDone]=useState(false);useEffect(()=>{const t1=setTimeout(()=>setPh(1),300),t2=setTimeout(()=>setPh(2),1100),t3=setTimeout(()=>setPh(3),2000);return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}},[]);const ev=avatar?.evolutions?.[newProfile-1]||avatar?.emoji;
const handleCert=()=>{try{generateCertificate({childName:childName||"Adventurer",subCompetencyKey:subKey,profileLevel:newProfile,profileText,evidenceSummary:{questTitles:questsCompleted||[],contexts:[],reflections:[],evidenceCount:questsCompleted?.length||0},dateEarned:new Date().toLocaleDateString("en-CA"),avatarName});setCertDone(true)}catch(e){console.error("Certificate error:",e)}};
return<div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.88)",backdropFilter:"blur(16px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,overflowY:"auto"}}><ConfettiBlast active={ph>=1}/><div style={{position:"relative",marginBottom:20}}><ExpandingRings active={ph>=1} color={compColor}/><ParticleBurst active={ph>=1} color={compColor}/><SpinningStars active={ph>=1}/><div style={{fontSize:80,lineHeight:1,position:"relative",zIndex:10,animation:ph>=1?"avatar-evolve 1.2s ease-out":"none"}}>{ev}</div></div>{ph>=1&&<div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"rgba(255,255,255,.5)",textAlign:"center",marginBottom:8}}>{EVOLUTION_TITLES[newProfile-1]}</div>}{ph>=2&&<div style={{animation:"badge-stamp .6s ease-out forwards",background:`linear-gradient(135deg,${compColor},${compColor}CC)`,borderRadius:20,padding:"8px 20px",marginBottom:14}}><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,color:"#fff"}}>Something changed in {subName}</span></div>}{ph>=2&&<h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",textAlign:"center",marginBottom:6,animation:"fadeSlideUp .5s ease-out forwards"}}>{subName}</h2>}{ph>=3&&<><div style={{animation:"fadeSlideUp .5s ease-out forwards",background:"rgba(255,255,255,.07)",borderRadius:16,padding:"14px 18px",maxWidth:340,textAlign:"center",marginBottom:20,border:`1px solid ${compColor}30`}}><p style={{fontSize:10,color:compColor,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>What you can practise now</p><p style={{fontSize:15,color:"#fff",lineHeight:1.5}}>"{profileText}"</p></div><button onClick={handleCert} style={{animation:"fadeSlideUp .4s ease-out .1s both",fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,padding:"12px 32px",border:"2px solid rgba(255,255,255,.2)",borderRadius:100,background:certDone?"rgba(16,185,129,.2)":"transparent",color:certDone?"#34D399":"#fff",cursor:"pointer",marginBottom:10,width:"100%",maxWidth:300}}>{certDone?"Certificate Downloaded ✓":"📄 Download My Certificate"}</button><button onClick={onDone} style={{animation:"fadeSlideUp .4s ease-out .2s both",fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 40px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#FFD700,#FF8C42)",color:"#fff",cursor:"pointer",width:"100%",maxWidth:300}}>Continue →</button></>}</div>}

function ProgressRing({progress,size=64,strokeWidth=5,color="#3B82F6",children}){const r=(size-strokeWidth)/2,c=2*Math.PI*r,o=c-(progress/100)*c;return<div style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><svg width={size} height={size} style={{position:"absolute",transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={strokeWidth}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{transition:"stroke-dashoffset .8s ease-out"}}/></svg>{children}</div>}

function VoiceButton({onTranscript}){const{on,txt,busy,err,toggle}=useVoice();const prevTxt=useRef("");
useEffect(()=>{if(txt&&txt!==prevTxt.current){prevTxt.current=txt;onTranscript(txt)}},[txt]);
return<div>
<button onClick={toggle} disabled={busy} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",border:on?"2px solid #EF4444":busy?"2px solid #F59E0B":"2px solid #E2E8F0",borderRadius:100,background:on?"#FEF2F2":busy?"#FFFBEB":"#fff",cursor:busy?"wait":"pointer",fontSize:13,fontWeight:600,color:on?"#EF4444":busy?"#B45309":"#64748B",animation:on?"mic-pulse 1.5s ease-in-out infinite":"none"}}>
<span className="gq-voice-btn" style={{fontSize:18}}>{on?"🔴":busy?"⏳":"🎤"}</span>
{on?"Recording… tap to stop":busy?"Finishing up…":"Tap to talk"}
</button>
{on&&txt&&<p style={{fontSize:12,color:"#3B82F6",marginTop:6,fontStyle:"italic",lineHeight:1.4}}>"{txt}"</p>}
{err&&<p style={{fontSize:11,color:"#EF4444",marginTop:4}}>{err}</p>}
</div>}

function EmojiPicker({selected,onSelect,label}){const opts=["😊","😢","😠","😮","🤔","😴","🥰","💪"];return<div>{label&&<p style={{fontSize:14,color:"#475569",marginBottom:10,textAlign:"center"}}>{label}</p>}<div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{opts.map((e,i)=><button key={i} onClick={()=>onSelect(e)} style={{fontSize:32,padding:8,borderRadius:14,border:selected===e?"3px solid #3B82F6":"3px solid #E2E8F0",background:selected===e?"#EFF6FF":"#fff",cursor:"pointer",transition:"all .2s",transform:selected===e?"scale(1.15)":"scale(1)"}}>{e}</button>)}</div></div>}

function StarsExplainer({isEarly}){return<div style={{background:"rgba(255,255,255,.06)",borderRadius:14,padding:14,border:"1px solid rgba(255,255,255,.08)",marginTop:8}}><p style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#FFD700",marginBottom:8}}>⭐ About Stars</p><div style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.6}}>{isEarly?<><p>Stars are a way to remember what you tried.</p><p style={{marginTop:4}}>⭐⭐ for trying · ⭐⭐⭐ for thinking about it · ⭐⭐⭐⭐⭐ for tricky ones</p><p style={{marginTop:4}}>You don't have to chase them — they're just here.</p></>:<><p>Stars track what you've practised. You pick them up by:</p><p style={{marginTop:4}}>Completing a quest (⭐⭐–⭐⭐⭐⭐⭐) · Reflecting on what you noticed (+⭐⭐⭐) · Checking in on yourself (+⭐)</p><p style={{marginTop:4}}>Each area has stages — you'll see when one fills up.</p></>}</div></div>}

// ── SCREENS ────────────────────────────────────────────────────────

function WelcomeScreen({onStart,hasSaved,lang,t,onTeacherView}){
  const w=t("welcome");
  const [showVoice, setShowVoice] = useState(false);
  const [voiceName, setVoiceName] = useState(() => loadCompanionVoice());
  const displayVoice = voiceName || "Auto-pick";

  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#0F172A 0%,#1E293B 30%,#1E3A5F 60%,#0F172A 100%)",position:"relative",overflow:"hidden",padding:24}}>
    {Array.from({length:35},(_,i)=><div key={i} style={{position:"absolute",width:`${1+Math.random()*3}px`,height:`${1+Math.random()*3}px`,backgroundColor:"#fff",borderRadius:"50%",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,opacity:.3+Math.random()*.7,animation:`float ${2+Math.random()*4}s ease-in-out ${Math.random()*2}s infinite`}}/>)}
    <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,.15),transparent 70%)",top:"10%",left:"-5%",filter:"blur(40px)"}}/>
    <button onClick={()=>onTeacherView&&onTeacherView()} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.1)",border:"none",borderRadius:100,padding:"6px 12px",color:"rgba(255,255,255,.3)",fontSize:10,cursor:"pointer",zIndex:10}}>🎓 Teacher</button>
    <div className="gq-fade-in" style={{textAlign:"center",zIndex:1,maxWidth:340,width:"100%"}}>
      <div className="gq-float" style={{fontSize:72,marginBottom:16}}>🌿</div>
      <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:"clamp(36px,8vw,52px)",fontWeight:700,background:"linear-gradient(135deg,#60A5FA,#A78BFA,#34D399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.1,marginBottom:8}}>GrowQuest<span style={{fontSize:".6em",verticalAlign:"super"}}>BC</span></h1>
      <p style={{color:"rgba(255,255,255,.55)",fontSize:14,fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:32}}>{w.tagline}</p>
      <p style={{color:"rgba(255,255,255,.35)",fontSize:14,maxWidth:300,margin:"0 auto 32px",lineHeight:1.6}}>{w.desc}</p>
      {hasSaved&&<button onClick={()=>onStart("continue")} style={{fontFamily:"'Fredoka',sans-serif",fontSize:20,fontWeight:600,padding:"16px 48px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer",boxShadow:"0 4px 24px rgba(59,130,246,.4)",marginBottom:12,width:"100%",maxWidth:280}}>{w.continue}</button>}
      <button onClick={()=>onStart("new")} style={{fontFamily:"'Fredoka',sans-serif",fontSize:hasSaved?16:20,fontWeight:600,padding:hasSaved?"12px 36px":"16px 48px",border:hasSaved?"2px solid rgba(255,255,255,.15)":"none",borderRadius:100,background:hasSaved?"transparent":"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer",boxShadow:hasSaved?"none":"0 4px 24px rgba(59,130,246,.4)",width:"100%",maxWidth:280}}>{hasSaved?w.newAdventure:w.begin}</button>

      {/* v6.7.3: voice picker accessible from welcome screen */}
      <div style={{marginTop:24,maxWidth:280,marginLeft:"auto",marginRight:"auto",width:"100%"}}>
        <button onClick={()=>setShowVoice(s=>!s)} aria-expanded={showVoice} aria-label="Toggle companion voice picker" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:100,padding:"8px 16px",color:"rgba(255,255,255,.6)",fontSize:12,cursor:"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          🔊 Companion voice: {displayVoice} {showVoice?"▲":"▼"}
        </button>
        {showVoice && <div style={{marginTop:12,padding:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12}}>
          <VoicePicker value={voiceName} onChange={(v)=>{setVoiceName(v);saveCompanionVoice(v)}} variant="dark" compact previewText="Hi! I'm your GrowQuest companion."/>
        </div>}
      </div>
    </div>
    <p style={{position:"absolute",bottom:12,color:"rgba(255,255,255,.15)",fontSize:9}}>v6.7.22 — self-assessment audit + regression test</p>
  </div>
}

function OnboardingScreen({onComplete,lang,t}){const[name,setName]=useState("");const[ag,setAg]=useState(null);const[step,setStep]=useState(0);const o=t("onboard");const ages=[{id:"early",label:o.earlyLabel,range:o.earlyRange,emoji:"🌟"},{id:"primary",label:o.primaryLabel,range:o.primaryRange,emoji:"🚀"},{id:"intermediate",label:o.interLabel,range:o.interRange,emoji:"⚡"}];return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#FFFBEB,#FEF3C7,#ECFDF5)",padding:24}}>{step===0&&<div className="gq-fade-in" style={{textAlign:"center",width:"100%",maxWidth:400}}><div style={{fontSize:48,marginBottom:16}}>👋</div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:28,color:"#334155",marginBottom:8}}>{o.hi}</h2><p style={{color:"#64748B",fontSize:15,marginBottom:32}}>{o.whatName}</p><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder={o.placeholder} style={{width:"100%",padding:"16px 20px",fontSize:18,border:"3px solid #E2E8F0",borderRadius:16,fontFamily:"'Nunito',sans-serif",fontWeight:600,textAlign:"center",background:"#fff"}} onFocus={e=>e.target.style.borderColor="#3B82F6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&name.trim())setStep(1)}}/><button onClick={()=>name.trim()&&setStep(1)} disabled={!name.trim()} style={{marginTop:24,fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,padding:"14px 40px",border:"none",borderRadius:100,background:name.trim()?"linear-gradient(135deg,#F59E0B,#EF4444)":"#E2E8F0",color:name.trim()?"#fff":"#94A3B8",cursor:name.trim()?"pointer":"default"}}>{o.thatsMe}</button></div>}{step===1&&<div className="gq-fade-in" style={{textAlign:"center",width:"100%",maxWidth:440}}><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,color:"#334155",marginBottom:8}}>{o.niceToMeet} {name}! 🎉</h2><p style={{color:"#64748B",fontSize:15,marginBottom:28}}>{o.howOld}</p><div style={{display:"flex",flexDirection:"column",gap:12}}>{ages.map((a,i)=><button key={a.id} onClick={()=>{setAg(a.id);setTimeout(()=>onComplete({name:name.trim(),ageGroup:a.id}),400)}} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",border:ag===a.id?"3px solid #3B82F6":"3px solid #E2E8F0",borderRadius:16,background:ag===a.id?"#EFF6FF":"#fff",cursor:"pointer",transition:"all .2s",animation:`fadeSlideUp .4s ease-out ${i*.1}s both`}}><span style={{fontSize:32}}>{a.emoji}</span><div style={{textAlign:"left"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,color:"#475569"}}>{a.label}</div><div style={{fontSize:13,color:"#94A3B8"}}>{a.range}</div></div></button>)}</div></div>}</div>}

function AvatarScreen({userName,onComplete}){const[sel,setSel]=useState(null);const[cn,setCn]=useState("");const ch=AVATARS.find(a=>a.id===sel);return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",background:"linear-gradient(170deg,#F0F9FF,#E0E7FF,#FCE7F3)",padding:24,paddingTop:48}}><div className="gq-fade-in" style={{textAlign:"center",maxWidth:480,width:"100%"}}><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,color:"#334155",marginBottom:6}}>Choose Your Guide</h2><p style={{color:"#64748B",fontSize:14,marginBottom:28}}>This friend will be here with you.</p><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:28}}>{AVATARS.map((av,i)=><button key={av.id} onClick={()=>{setSel(av.id);setCn(av.name)}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 4px",border:sel===av.id?"3px solid #6366F1":"3px solid transparent",borderRadius:16,background:sel===av.id?"rgba(99,102,241,.08)":"rgba(255,255,255,.7)",cursor:"pointer",transition:"all .2s",animation:`fadeSlideUp .3s ease-out ${i*.05}s both`}}><span style={{fontSize:36,transform:sel===av.id?"scale(1.2)":"scale(1)",transition:"transform .2s"}}>{av.emoji}</span><span style={{fontSize:11,fontWeight:600,color:"#475569"}}>{av.name}</span></button>)}</div>{sel&&ch&&<div className="gq-grow" style={{background:"#fff",borderRadius:20,padding:24,boxShadow:"0 4px 24px rgba(0,0,0,.06)"}}><div style={{fontSize:56,marginBottom:4}}>{ch.emoji}</div><p style={{color:"#64748B",fontSize:13,marginBottom:4}}>{ch.desc}</p><p style={{color:"#94A3B8",fontSize:11,marginBottom:14}}>Your guide changes over time.</p><div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:16,background:"#F8FAFC",borderRadius:12,padding:"10px 12px"}}>{ch.evolutions.map((ev,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:i===0?1:.3}}><span style={{fontSize:i<3?18:22}}>{ev}</span><span style={{fontSize:8,color:"#94A3B8",marginTop:2}}>{EVOLUTION_TITLES[i]}</span></div>)}</div><input type="text" value={cn} onChange={e=>setCn(e.target.value)} placeholder="Name your guide…" style={{width:"100%",padding:"12px 16px",fontSize:16,border:"2px solid #E2E8F0",borderRadius:12,fontFamily:"'Nunito',sans-serif",fontWeight:600,textAlign:"center"}} onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/><button onClick={()=>cn.trim()&&onComplete({avatarId:sel,avatarName:cn.trim()})} disabled={!cn.trim()} style={{marginTop:16,fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:cn.trim()?"linear-gradient(135deg,#6366F1,#8B5CF6)":"#E2E8F0",color:cn.trim()?"#fff":"#94A3B8",cursor:cn.trim()?"pointer":"default"}}>Continue →</button></div>}</div></div>}

function DashboardScreen({profile,onSelectComp,onStartQuest,onParentView,onViewStory,onViewPortfolio,isDark,onToggleTheme,onShowA11y,a11y}){const{name,avatarId,avatarName,progress,streak,ageGroup}=profile;const av=AVATARS.find(a=>a.id===avatarId);const lv=getAvLv(progress);const evo=av?.evolutions?.[lv-1]||av?.emoji;const tq=Object.values(progress).reduce((s,p)=>s+p.questsCompleted,0);const isE=ageGroup==="early";const allQs=getQuestsForAge(ageGroup);
// v6.7.21: for Early Years (4-6), compute "visits this week" milestone
// from quest history instead of showing a continuous-streak counter.
// Shared language guide v1.1 §"Streaks" requires this for ages 4-6.
// Streak counter remains in the data layer for teacher reporting.
const visitsThisWeek = (()=>{
  if(!isE) return null;
  const oneWeekAgo = Date.now() - 7*24*60*60*1000;
  const visitDates = new Set();
  Object.values(progress||{}).forEach(p=>{
    (p.questHistory||[]).forEach(h=>{
      if(!h.date) return;
      const t = new Date(h.date).getTime();
      if(!isNaN(t) && t >= oneWeekAgo) visitDates.add(h.date);
    });
  });
  return visitDates.size;
})();
// Rotate quests daily based on date seed so kids see different ones each day
const dayNum=Math.floor(Date.now()/86400000);
const qs=Object.fromEntries(Object.entries(allQs).map(([ck,cqs])=>{
const offset=dayNum%cqs.length;
return[ck,[...cqs.slice(offset),...cqs.slice(0,offset)]];
}));const[showInfo,setShowInfo]=useState(false);const[showAvatar,setShowAvatar]=useState(false);
// v6.7.3: voice picker popover, opens from the 🔊 button in the header
const[showVoicePop,setShowVoicePop]=useState(false);
const[voiceName,setVoiceName]=useState(()=>loadCompanionVoice());
const today=Object.entries(qs).map(([ck,q])=>({...q[new Date().getDay()%q.length],compKey:ck}));
useAutoNarrate(
    a11y?.fullAudioMode ? `Welcome back ${name}. You have done ${tq} quests.${isE ? (visitsThisWeek>0?` You have visited ${visitsThisWeek} ${visitsThisWeek===1?"time":"times"} this week.`:"") : (streak>0?` You have come back ${streak} ${streak===1?"day":"days"} in a row.`:"")} Tap a realm to explore, or scroll down for today's quests.` : null,
    a11y?.fullAudioMode || a11y?.audioNarration,
    "dashboard-welcome"   // plays once per day per device
  );
return<div style={{minHeight:"100vh",background:isDark?"linear-gradient(180deg,#0F172A,#1E293B)":"linear-gradient(180deg,#F8FAFC,#EFF6FF)",color:isDark?"#fff":"#1E293B",paddingBottom:40,transition:"background .3s"}}><div style={{padding:"20px 20px 24px",background:isDark?"linear-gradient(180deg,rgba(59,130,246,.1),transparent)":"linear-gradient(180deg,rgba(59,130,246,.06),transparent)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><div><p style={{fontSize:12,color:isDark?"rgba(255,255,255,.4)":"#94A3B8",fontWeight:600}}>Welcome back</p><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,color:isDark?"#fff":"#1E293B"}}>{name}</h2></div><div style={{display:"flex",alignItems:"center",gap:6}}><button onClick={onShowA11y} style={{background:isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)",border:"none",borderRadius:100,padding:"8px 12px",color:isDark?"rgba(255,255,255,.5)":"#94A3B8",fontSize:13,cursor:"pointer"}} aria-label="Accessibility settings">♿</button><button onClick={onToggleTheme} style={{background:isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)",border:"none",borderRadius:100,padding:"8px 12px",color:isDark?"rgba(255,255,255,.5)":"#94A3B8",fontSize:13,cursor:"pointer"}} aria-label="Toggle light or dark mode">{isDark?"☀️":"🌙"}</button><button onClick={()=>setShowVoicePop(s=>!s)} aria-label="Change companion voice" aria-expanded={showVoicePop} style={{background:showVoicePop?"rgba(59,130,246,.25)":(isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)"),border:"none",borderRadius:100,padding:"8px 12px",color:isDark?"rgba(255,255,255,.5)":"#94A3B8",fontSize:13,cursor:"pointer"}}>🔊</button><button onClick={onParentView} style={{background:isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)",border:"none",borderRadius:100,padding:"8px 12px",color:isDark?"rgba(255,255,255,.5)":"#64748B",fontSize:11,fontWeight:600,cursor:"pointer"}}>👤 Parent</button><button onClick={()=>setShowAvatar(!showAvatar)} style={{display:"flex",alignItems:"center",gap:8,background:isDark?"rgba(255,255,255,.08)":"#fff",borderRadius:100,padding:"6px 14px 6px 8px",border:isDark?"none":"1px solid #E2E8F0",cursor:"pointer",color:isDark?"#fff":"#334155",boxShadow:isDark?"none":"0 2px 6px rgba(0,0,0,.04)"}}><span className="gq-pulse" style={{fontSize:28}}>{evo}</span><div style={{textAlign:"left"}}><div style={{fontSize:11,color:isDark?"rgba(255,255,255,.4)":"#94A3B8"}}>{avatarName}</div></div></button></div></div>{showVoicePop&&<div className="gq-fade-in" style={{margin:"0 20px 14px",padding:14,background:isDark?"rgba(255,255,255,.06)":"#fff",border:isDark?"1px solid rgba(255,255,255,.08)":"1px solid #E2E8F0",borderRadius:12,boxShadow:isDark?"none":"0 4px 16px rgba(0,0,0,.06)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><p style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,color:isDark?"#fff":"#1E293B"}}>Companion voice</p><button onClick={()=>setShowVoicePop(false)} aria-label="Close voice picker" style={{background:"none",border:"none",color:isDark?"rgba(255,255,255,.4)":"#94A3B8",fontSize:18,cursor:"pointer",padding:0,lineHeight:1}}>×</button></div><VoicePicker value={voiceName} onChange={(v)=>{setVoiceName(v);saveCompanionVoice(v)}} variant={isDark?"dark":"light"} compact previewText="Hi. This is your GrowQuest companion."/></div>}<div style={{display:"flex",gap:8,marginBottom:4}}>{[{v:tq,l:"Quests Done",c:"#fff"},isE?{v:visitsThisWeek>0?`${visitsThisWeek}`:"—",l:visitsThisWeek===1?"visit this week":"visits this week",c:"#F59E0B"}:{v:streak>0?`${streak}`:"0",l:streak>0?(streak===1?"day · came back":"days · came back"):"days",c:"#F59E0B"}].map((s,i)=><div key={i} style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:12,padding:"10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,fontFamily:"'Fredoka',sans-serif",color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>{s.l}</div></div>)}<div onClick={()=>setShowInfo(!showInfo)} style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:12,padding:"10px",textAlign:"center",cursor:"pointer"}}><div style={{fontSize:18}}>⭐</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)",textDecoration:"underline dotted"}}>How Stars Work</div></div></div>{showInfo&&<StarsExplainer isEarly={isE}/>}{showAvatar&&<div className="gq-fade-in" style={{margin:"0 20px",background:isDark?"rgba(255,255,255,.06)":"#fff",borderRadius:16,padding:20,border:isDark?"1px solid rgba(255,255,255,.08)":"1px solid #E2E8F0",boxShadow:isDark?"none":"0 4px 16px rgba(0,0,0,.06)"}}>
<div style={{textAlign:"center"}}>
<div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>{av?.evolutions?.map((ev,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:i<lv?1:.3,padding:"4px 8px",borderRadius:12,background:i===lv-1?"rgba(255,215,0,.1)":"transparent",border:i===lv-1?"1px solid rgba(255,215,0,.3)":"1px solid transparent"}}><span style={{fontSize:i===lv-1?36:24}}>{ev}</span><span style={{fontSize:8,color:i===lv-1?"#FFD700":"rgba(255,255,255,.4)",marginTop:2}}>{EVOLUTION_TITLES[i]}</span></div>)}</div>
<p style={{fontSize:13,color:isDark?"rgba(255,255,255,.5)":"#64748B"}}>{avatarName}</p>
<p style={{fontSize:11,color:isDark?"rgba(255,255,255,.3)":"#94A3B8",marginTop:4}}>{avatarName} will keep changing as you keep practising.</p>
</div></div>}</div>
<div style={{padding:"12px 20px 0"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,marginBottom:10,color:isDark?"rgba(255,255,255,.8)":"#334155"}}>Realms</h3><div style={{display:"flex",flexDirection:"column",gap:10}}>{Object.entries(COMPETENCIES).map(([key,comp],i)=>{const sk=Object.keys(comp.subCompetencies);const avg=sk.reduce((s,k)=>s+progress[k].profile,0)/sk.length;return<button key={key} onClick={()=>onSelectComp(key)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:isDark?"rgba(255,255,255,.04)":"#fff",border:isDark?"1px solid rgba(255,255,255,.06)":"1px solid #E2E8F0",borderRadius:16,boxShadow:isDark?"none":"0 2px 8px rgba(0,0,0,.04)",cursor:"pointer",width:"100%",textAlign:"left",animation:`fadeSlideUp .4s ease-out ${i*.08}s both`}}><ProgressRing progress={(avg/6)*100} size={48} strokeWidth={4} color={comp.color}><span style={{fontSize:19}}>{comp.icon}</span></ProgressRing><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,color:isDark?"#fff":comp.color}}>{comp.name}</div><div style={{fontSize:11,color:isDark?"rgba(255,255,255,.3)":"#94A3B8",marginTop:1}}>{comp.realm}</div></div><span style={{fontSize:15,color:isDark?"rgba(255,255,255,.2)":"#CBD5E1"}}>→</span></button>})}</div></div>
<div style={{padding:"22px 20px 0"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,marginBottom:10,color:isDark?"rgba(255,255,255,.8)":"#334155"}}>Today's Quests</h3><div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8}}>{today.map((q,i)=><div key={i} onClick={()=>onStartQuest(q)} style={{minWidth:180,padding:13,borderRadius:14,background:isDark?"rgba(255,255,255,.05)":"#fff",border:isDark?"1px solid rgba(255,255,255,.06)":"1px solid #E2E8F0",cursor:"pointer",boxShadow:isDark?"none":"0 2px 8px rgba(0,0,0,.04)",flexShrink:0,animation:`fadeSlideUp .4s ease-out ${.2+i*.08}s both`}}><div style={{fontSize:24,marginBottom:6}}>{q.icon}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,marginBottom:3,color:isDark?"#fff":"#334155"}}>{q.title}</div><div style={{fontSize:11,color:isDark?"rgba(255,255,255,.3)":"#94A3B8",lineHeight:1.4}}>{q.desc.slice(0,50)}…</div><div style={{marginTop:8,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:isDark?"rgba(255,255,255,.2)":"#94A3B8"}}>⏱{q.minutes}m</span><span style={{fontSize:10,color:"#FFD700",fontWeight:700}}>⭐{QUEST_STARS[q.difficulty]}+</span></div></div>)}</div></div>
<div style={{padding:"10px 20px 0"}}><button onClick={onViewStory} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isDark?"linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,140,66,.08))":"linear-gradient(135deg,rgba(255,215,0,.06),rgba(255,140,66,.04))",border:isDark?"1px solid rgba(255,215,0,.15)":"1px solid rgba(255,215,0,.25)",borderRadius:16,cursor:"pointer",marginBottom:10}}><span style={{fontSize:28}}>📖</span><div style={{flex:1,textAlign:"left"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,color:isDark?"#FFD700":"#B45309"}}>My Story</div><div style={{fontSize:11,color:isDark?"rgba(255,255,255,.35)":"#94A3B8"}}>{(profile.story?.paragraphs?.length||0)} pages · {Math.floor((profile.story?.paragraphs?.length||0)/5)+((profile.story?.paragraphs?.length||0)>0?1:0)} chapters</div></div><span style={{color:isDark?"rgba(255,215,0,.4)":"#F59E0B",fontSize:16}}>→</span></button>
<button onClick={onViewPortfolio} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isDark?"linear-gradient(135deg,rgba(99,102,241,.10),rgba(139,92,246,.08))":"linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.04))",border:isDark?"1px solid rgba(139,92,246,.18)":"1px solid rgba(139,92,246,.25)",borderRadius:16,cursor:"pointer",marginBottom:16}}><span style={{fontSize:28}}>🌱</span><div style={{flex:1,textAlign:"left"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,color:isDark?"#A5B4FC":"#6366F1"}}>{name}'s Growth Profile</div><div style={{fontSize:11,color:isDark?"rgba(255,255,255,.35)":"#94A3B8"}}>See how you're growing across all 7 areas</div></div><span style={{color:isDark?"rgba(165,180,252,.4)":"#8B5CF6",fontSize:16}}>→</span></button></div>
<div style={{padding:"0 20px"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,marginBottom:10,color:isDark?"rgba(255,255,255,.8)":"#334155"}}>What I Can Do</h3>{Object.entries(COMPETENCIES).map(([ck,comp])=>Object.entries(comp.subCompetencies).map(([sk,sub])=>{const p=progress[sk];return<div key={sk} style={{padding:"9px 12px",marginBottom:7,borderRadius:10,background:isDark?"rgba(255,255,255,.03)":"#fff",borderLeft:`3px solid ${comp.color}`,boxShadow:isDark?"none":"0 1px 4px rgba(0,0,0,.03)"}}><div style={{fontSize:10,color:comp.color,fontWeight:700,marginBottom:2,textTransform:"uppercase",letterSpacing:.5}}>{sub.name}</div><div style={{fontSize:12,color:isDark?"rgba(255,255,255,.7)":"#64748B",lineHeight:1.4}}>{sub.kidProfiles[p.profile-1]}</div></div>}))}</div></div>}

function CompDetailScreen({compKey,profile,onBack,onStartQuest}){const comp=COMPETENCIES[compKey];const qs=(getQuestsForAge(profile.ageGroup)[compKey])||[];return<div style={{minHeight:"100vh",background:"#FAFBFC",paddingBottom:40}}><div style={{background:comp.gradient,padding:"26px 20px 34px",color:"#fff",borderRadius:"0 0 26px 26px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%,rgba(255,255,255,.12),transparent 60%)",pointerEvents:"none"}}/><button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:100,padding:"8px 16px",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12,position:"relative",zIndex:2}}>← Back</button><div style={{fontSize:42,marginBottom:4}}>{comp.icon}</div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,marginBottom:2}}>{comp.name}</h2><p style={{opacity:.7,fontSize:13}}>{comp.realm}</p></div><div style={{padding:"18px 20px"}}>{Object.entries(comp.subCompetencies).map(([sk,sub],si)=>{const p=profile.progress[sk];const th=STARS_THRESH[p.profile-1]||12;const pct=Math.min((p.stars/th)*100,100);return<div key={sk} style={{background:"#fff",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,.04)",animation:`fadeSlideUp .4s ease-out ${si*.1}s both`}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#475569"}}>{sub.name}</h3></div><div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,color:"#94A3B8"}}>{p.questsCompleted} quests</span><span style={{fontSize:10,color:"#94A3B8"}}>⭐ {p.stars}</span></div><div style={{background:"#F1F5F9",borderRadius:100,height:6,overflow:"hidden"}}><div style={{height:"100%",borderRadius:100,width:`${pct}%`,background:comp.gradient,transition:"width .8s ease-out"}}/></div></div><div style={{background:"#F8FAFC",borderRadius:10,padding:"9px 11px",borderLeft:`3px solid ${comp.color}`}}><p style={{fontSize:10,fontWeight:700,color:comp.color,marginBottom:2,textTransform:"uppercase",letterSpacing:.5}}>What you can practise now</p><p style={{fontSize:13,color:"#334155",lineHeight:1.5}}>"{sub.kidProfiles[p.profile-1]}"</p></div>{p.profile>=2&&<div style={{marginTop:7,padding:"7px 11px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0"}}><p style={{fontSize:10,fontWeight:700,color:"#16A34A",marginBottom:3}}>✓ What you've practised</p>{sub.kidProfiles.slice(0,p.profile-1).map((prev,pi)=><p key={pi} style={{fontSize:11,color:"#4ADE80",lineHeight:1.4,marginBottom:1}}>• {prev}</p>)}</div>}{p.profile<6&&<div style={{marginTop:7,padding:"7px 11px",background:"#FFFBEB",borderRadius:8,border:"1px dashed #FCD34D"}}><p style={{fontSize:10,fontWeight:700,color:"#B45309",marginBottom:1}}>What's next, when you're ready</p><p style={{fontSize:12,color:"#78716C",lineHeight:1.4}}>"{sub.kidProfiles[p.profile]}"</p></div>}</div>})}</div><div style={{padding:"0 20px"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#475569",marginBottom:10}}>Quests</h3>{qs.map((q,i)=><button key={i} onClick={()=>onStartQuest(q)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 13px",background:"#fff",border:"1px solid #E2E8F0",borderRadius:13,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:8}}><span style={{fontSize:24}}>{q.icon}</span><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,color:"#475569"}}>{q.title}</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{q.desc.slice(0,60)}…</div></div><div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#94A3B8"}}>⏱{q.minutes}m</div><div style={{fontSize:10,color:"#FFB800",fontWeight:700}}>⭐{QUEST_STARS[q.difficulty]}+</div></div></button>)}</div></div>}

function QuestScreen({quest,profile,onComplete,onBack,a11y}){const[step,setStep]=useState(0);const[resp,setResp]=useState("");const[selEmoji,setSelEmoji]=useState(null);const[refl,setRefl]=useState(null);const[reflText,setReflText]=useState("");const[selfA,setSelfA]=useState(null);const[showConf,setShowConf]=useState(false);const[showPart,setShowPart]=useState(false);const[showPU,setShowPU]=useState(null);const[earned,setEarned]=useState(0);const isE=profile.ageGroup==="early";const iType=quest.inputType||"text";
const rOpts=isE?[{e:"😊",l:"Fun!",d:"surface"},{e:"🤔",l:"Made me think",d:"emerging"},{e:"💪",l:"Hard!",d:"thoughtful"},{e:"🌟",l:"Loved it!",d:"thoughtful"}]:[{e:"👍",l:"I did it",d:"surface"},{e:"👀",l:"I noticed something",d:"emerging"},{e:"💡",l:"I learned something",d:"thoughtful"},{e:"🌊",l:"It changed how I think",d:"deep"}];
let cc="#3B82F6",cn="",ck="";for(const[k,c] of Object.entries(COMPETENCIES)){if(c.subCompetencies[quest.sub]){cc=c.color;cn=c.name;ck=k;break}}const sc=COMPETENCIES[ck]?.subCompetencies[quest.sub];const hasR=iType==="emoji"?!!selEmoji:!!resp.trim();
const claim=()=>{const d=refl!==null?rOpts[refl].d:"surface";const s=calcStars({difficulty:quest.difficulty,reflDepth:d,selfAssessed:!!selfA,crossComp:!!quest.alsoTouches});setEarned(s);const cur=profile.progress[quest.sub];const r=checkProfileUp(cur.stars,s,cur.profile);if(r.up)setShowPU({subName:sc.name,newProfile:r.newProf,profileText:sc.kidProfiles[r.newProf-1]});else{setStep(4);setShowConf(true);setShowPart(true);playCelebrationSound();setTimeout(()=>{setShowConf(false);setShowPart(false)},3000)}};
const puDone=()=>{setShowPU(null);setStep(4);setShowConf(true);setShowPart(true);playCelebrationSound();setTimeout(()=>{setShowConf(false);setShowPart(false)},3000)};
const av=AVATARS.find(a=>a.id===profile.avatarId);

return<div style={{minHeight:"100vh",background:step===4?"linear-gradient(160deg,#0F172A,#1E293B)":"#FAFBFC",padding:20,paddingTop:28}}><ConfettiBlast active={showConf}/>{showPU&&<ProfileUpCelebration subName={showPU.subName} subKey={quest.sub} newProfile={showPU.newProfile} profileText={showPU.profileText} compColor={cc} avatar={av} childName={profile.name} avatarName={profile.avatarName} questsCompleted={[quest.title]} onDone={puDone}/>}

{step===0&&<div className="gq-fade-in" style={{textAlign:"center",maxWidth:400,margin:"0 auto",paddingTop:28}}><div className="gq-float" style={{fontSize:56,marginBottom:12}}>{quest.icon}</div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:23,color:"#334155",marginBottom:6}}>{quest.title}</h2><span style={{fontSize:11,fontWeight:700,color:cc,background:`${cc}12`,padding:"3px 10px",borderRadius:100}}>{cn}</span><p style={{color:"#64748B",fontSize:15,lineHeight:1.6,marginTop:14,marginBottom:24}}>{quest.desc}</p><div style={{color:"#94A3B8",fontSize:13,marginBottom:24}}>⏱ ~{quest.minutes} min · <span style={{color:"#FFB800"}}>⭐{QUEST_STARS[quest.difficulty]}+ stars</span></div><button onClick={()=>setStep(1)} style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,padding:"14px 40px",border:"none",borderRadius:100,width:"100%",background:`linear-gradient(135deg,${cc},${cc}BB)`,color:"#fff",cursor:"pointer"}}>Start Quest ✦</button><button onClick={onBack} style={{marginTop:12,background:"none",border:"none",color:"#94A3B8",fontSize:14,cursor:"pointer",padding:"8px 16px"}}>← Go back</button></div>}

{step===1&&<div className="gq-fade-in" style={{maxWidth:400,margin:"0 auto"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><span style={{fontSize:20}}>{quest.icon}</span><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#475569"}}>{quest.title}</h3></div><div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 16px rgba(0,0,0,.04)",marginBottom:16}}><p style={{color:"#475569",fontSize:15,lineHeight:1.6,marginBottom:16}}>{quest.desc}</p>
{iType==="emoji"&&<EmojiPicker selected={selEmoji} onSelect={e=>{setSelEmoji(e);setResp(e)}} label={isE?"Pick the one that fits!":undefined}/>}
{iType==="drawing"&&<div style={{textAlign:"center",padding:20,border:"2px dashed #E2E8F0",borderRadius:14}}><p style={{fontSize:36,marginBottom:8}}>🖍️</p><p style={{color:"#94A3B8",fontSize:13}}>Draw on paper, then tell us about it!</p><div style={{marginTop:12}}><VoiceButton onTranscript={t=>setResp(t)}/></div>{!resp&&<button onClick={()=>setResp("I drew it!")} style={{marginTop:8,padding:"8px 16px",border:"2px solid #E2E8F0",borderRadius:100,background:"#fff",fontSize:13,color:"#64748B",cursor:"pointer"}}>I drew it! ✓</button>}{resp&&<p style={{marginTop:8,fontSize:13,color:"#10B981",fontWeight:600}}>✓ {resp}</p>}</div>}
{(iType==="text"||iType==="voice")&&<><textarea value={resp} onChange={e=>setResp(e.target.value)} placeholder={isE?"Tell us what happened…":"Write about what you did or noticed…"} rows={isE?3:5} style={{width:"100%",padding:"12px 14px",fontSize:15,border:"2px solid #E2E8F0",borderRadius:12,fontFamily:"'Nunito',sans-serif",resize:"vertical",lineHeight:1.5}} onFocus={e=>e.target.style.borderColor=cc} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/><div style={{marginTop:8}}><VoiceButton onTranscript={t=>setResp(t)}/></div></>}
</div><button onClick={()=>setStep(2)} disabled={!hasR} style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:hasR?cc:"#E2E8F0",color:hasR?"#fff":"#94A3B8",cursor:hasR?"pointer":"default"}}>{isE?"Done! ✓":"Done — Reflect 🪞"}</button></div>}

{step===2&&<div className="gq-fade-in" style={{textAlign:"center",maxWidth:400,margin:"0 auto",paddingTop:12}}>
  <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:21,color:"#334155",marginBottom:6}}>{isE?"How was that?":"What did you notice?"}</h3>
  {!isE && sc?.name && <p style={{color:"#64748B",fontSize:13,marginBottom:8}}>You just did something in <strong style={{color:cc}}>{sc.name}</strong>.</p>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginTop:12,marginBottom:14}}>{rOpts.map((r,i)=><button key={i} onClick={()=>setRefl(i)} style={{padding:13,borderRadius:14,border:refl===i?`3px solid ${cc}`:"3px solid #E2E8F0",background:refl===i?`${cc}08`:"#fff",cursor:"pointer"}}><div style={{fontSize:28,marginBottom:3}}>{r.e}</div><div style={{fontSize:12,fontWeight:600,color:"#475569"}}>{r.l}</div></button>)}</div>
  {!isE && refl!==null && <div style={{marginBottom:14,textAlign:"left"}}>
    <p style={{fontSize:12,color:"#64748B",marginBottom:6}}>Want to add a note? <span style={{color:"#94A3B8"}}>(optional — one sentence is fine)</span></p>
    <textarea value={reflText} onChange={e=>setReflText(e.target.value)} placeholder={`e.g. "I tried..." or "I noticed..." or "I changed my mind when..."`} rows={2} style={{width:"100%",padding:"10px 12px",fontSize:14,border:"2px solid #E2E8F0",borderRadius:10,fontFamily:"'Nunito',sans-serif",resize:"vertical",lineHeight:1.5}} onFocus={e=>e.target.style.borderColor=cc} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
    <div style={{marginTop:6}}><VoiceButton onTranscript={t=>setReflText(t)}/></div>
  </div>}
  {refl!==null&&<button onClick={()=>setStep(3)} style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:cc,color:"#fff",cursor:"pointer",animation:"fadeSlideUp .3s ease-out both"}}>Where am I now? →</button>}
</div>}

{step===3&&<div className="gq-fade-in" style={{maxWidth:400,margin:"0 auto",paddingTop:12}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:19,color:"#334155",marginBottom:4,textAlign:"center"}}>Where am I now?</h3><p style={{color:"#64748B",fontSize:12,marginBottom:16,textAlign:"center"}}>For <strong>{sc?.name}</strong> — tap the one that sounds most like you:</p>
{isE?<div style={{display:"flex",flexDirection:"column",gap:10}}>{[{e:"🌱",l:"I'm just trying it",v:1},{e:"🌿",l:"I'm getting the hang of it",v:2},{e:"🌳",l:"I've practised this a lot",v:3}].map((opt)=><button key={opt.v} onClick={()=>setSelfA(opt.v)} style={{padding:"16px",borderRadius:16,border:selfA===opt.v?`3px solid ${cc}`:"2px solid #E2E8F0",background:selfA===opt.v?`${cc}08`:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:40}}>{opt.e}</span><span style={{fontSize:16,fontWeight:600,color:"#475569"}}>{opt.l}</span></button>)}</div>
:<div style={{display:"flex",flexDirection:"column",gap:7}}>{(()=>{const cur=profile.progress[quest.sub]?.profile||1;const show=[Math.max(1,cur-1),cur,Math.min(6,cur+1),Math.min(6,cur+2)].filter((v,i,a)=>a.indexOf(v)===i&&v<=sc?.kidProfiles.length);return show.map((lv,si)=>{const pi=lv-1;const p=sc?.kidProfiles[pi];return<button key={pi} onClick={()=>setSelfA(lv)} style={{padding:"12px 14px",borderRadius:12,textAlign:"left",border:selfA===lv?`3px solid ${cc}`:"2px solid #E2E8F0",background:selfA===lv?`${cc}08`:"#fff",cursor:"pointer",animation:`fadeSlideUp .3s ease-out ${si*.05}s both`}}><p style={{fontSize:13,color:"#475569",lineHeight:1.5,margin:0}}>{p}</p></button>})})()}</div>}
<div style={{marginTop:16}}><button onClick={()=>{if(!selfA)setSelfA(profile.progress[quest.sub]?.profile||1);claim()}} style={{width:"100%",fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,padding:"14px 20px",border:"none",borderRadius:100,background:cc,color:"#fff",cursor:"pointer"}}>{selfA?"Finish quest →":"I'm not sure yet — that's okay →"}</button></div></div>}

{step===4&&!showPU&&<div className="gq-fade-in" style={{textAlign:"center",maxWidth:400,margin:"0 auto",paddingTop:32,color:"#fff",position:"relative"}}><div style={{position:"relative",display:"inline-block",marginBottom:16}}><div style={{position:"absolute",left:"50%",top:"30%",transform:"translateX(-50%)",fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:600,color:"#FFD700",opacity:.7,animation:"stars-float 1.8s ease-out .3s forwards",zIndex:110,pointerEvents:"none"}}>+{earned}</div><div style={{fontSize:44,position:"relative",zIndex:10,opacity:.85}}>✨</div></div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,marginBottom:8,animation:"number-pop .5s ease-out .4s both"}}>{isE?"Quest done.":"Quest done. Nice noticing."}</h2>
<div style={{background:"rgba(255,255,255,.06)",borderRadius:14,padding:14,border:"1px solid rgba(255,255,255,.1)",marginBottom:20,textAlign:"left"}}><p style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:8}}>What you did:</p>{[{l:"Quest completed",v:QUEST_STARS[quest.difficulty]},refl!==null&&REFL_STARS[rOpts[refl].d]>0&&{l:"Thinking about it",v:REFL_STARS[rOpts[refl].d]},selfA&&{l:"Checking my growth",v:1},quest.alsoTouches&&{l:"Helped other skills too",v:1}].filter(Boolean).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:"rgba(255,255,255,.45)"}}>{r.l}</span><span style={{fontSize:12,color:"#FFD700",fontWeight:700}}>{"⭐".repeat(r.v)}</span></div>)}<div style={{borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:6,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:700}}>Total</span><span style={{fontSize:14,fontWeight:700,color:"#FFD700"}}>⭐ {earned} stars</span></div></div>
<button onClick={()=>onComplete({
  stars: earned,
  response: resp || (selEmoji||""),
  responseType: iType,
  reflection: refl!==null ? rOpts[refl].l : null,
  reflectionDepth: refl!==null ? rOpts[refl].d : "surface",
  reflectionText: reflText.trim() || null, // v6.8: curriculum-language reflection in child's own words
  selfAssessedLevel: selfA || null,
  questId: quest.id,
})} style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer"}}>Back to My Quest →</button></div>}
</div>}

// ── Parent PIN Gate ────────────────────────────────────────────────
// Security model (v6.7):
// - PIN is hashed (SHA-256) with a per-device salt before storage; the
//   plaintext never touches disk.
// - 5 wrong attempts within a session trigger a 30-second lockout.
// - The locked screen exposes NO bypass: changing or removing the PIN
//   is moved into the Parent Dashboard (behind the unlocked state).
// - Legacy plaintext PINs are auto-migrated to hashed form on first
//   successful entry, so existing users aren't locked out.

const STORED_PIN_KEY="growquest_parent_pin";   // hashed value or "none"
const STORED_PIN_SALT="growquest_parent_salt"; // per-device random salt

function getOrCreateSalt(){
  try{
    let s=localStorage.getItem(STORED_PIN_SALT);
    if(!s){
      const buf=new Uint8Array(16);
      (window.crypto||window.msCrypto).getRandomValues(buf);
      s=Array.from(buf).map(b=>b.toString(16).padStart(2,"0")).join("");
      localStorage.setItem(STORED_PIN_SALT,s);
    }
    return s;
  }catch(e){return "growquest-fallback-salt"}
}

async function hashPin(pin){
  const salt=getOrCreateSalt();
  const data=new TextEncoder().encode(salt+":"+pin);
  const hashBuf=await window.crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function ParentPinGate({onUnlock,onBack}){
const[pin,setPin]=useState("");
const[error,setError]=useState("");
const[busy,setBusy]=useState(false);
const[attempts,setAttempts]=useState(0);
const[lockedUntil,setLockedUntil]=useState(0);
const[, forceTick]=useState(0);

const getSavedPin=()=>{try{return localStorage.getItem(STORED_PIN_KEY)||null}catch(e){return null}};
const[hasSavedPin]=useState(()=>{const v=getSavedPin();return !!v && v!=="none"});
const[setting]=useState(()=>!getSavedPin()); // only set on first run; no toggle from locked screen

// Tick the lockout countdown so the UI re-renders
useEffect(()=>{
  if(!lockedUntil)return;
  const id=setInterval(()=>{
    if(Date.now()>=lockedUntil){setLockedUntil(0);setError("");clearInterval(id)}
    else{forceTick(t=>t+1)}
  },500);
  return()=>clearInterval(id);
},[lockedUntil]);

const handleSubmit=async()=>{
  if(busy)return;
  if(lockedUntil&&Date.now()<lockedUntil)return;
  if(pin.length!==4){setError("Please enter 4 digits");return}
  setBusy(true);
  try{
    if(setting){
      const hashed=await hashPin(pin);
      try{localStorage.setItem(STORED_PIN_KEY,hashed)}catch(e){}
      onUnlock();
    }else{
      const saved=getSavedPin();
      const hashed=await hashPin(pin);
      // Match against hashed value, OR migrate a legacy plaintext PIN.
      const isLegacyMatch=saved&&saved.length===4&&saved===pin;
      if(saved===hashed||isLegacyMatch){
        if(isLegacyMatch){try{localStorage.setItem(STORED_PIN_KEY,hashed)}catch(e){}}
        onUnlock();
      }else{
        const next=attempts+1;
        setAttempts(next);
        setPin("");
        if(next>=5){
          setLockedUntil(Date.now()+30000);
          setError("Too many wrong tries. Locked for 30 seconds.");
        }else{
          setError(`That's not right. ${5-next} ${5-next===1?"try":"tries"} left.`);
        }
      }
    }
  }finally{setBusy(false)}
};

const handleSkip=async()=>{
  // First-run only: parent explicitly opted out of a PIN.
  try{localStorage.setItem(STORED_PIN_KEY,"none")}catch(e){}
  onUnlock();
};

const handleDigit=(n)=>{
  if(lockedUntil&&Date.now()<lockedUntil)return;
  if(n==="del"){setPin(p=>p.slice(0,-1));setError("")}
  else if(pin.length<4){setPin(p=>p+n);setError("")}
};

// If PIN is "none" (parent opted out at first run), go straight through.
// Note: removing the PIN later requires being already unlocked (handled in
// the Parent Dashboard), so reaching this branch means a deliberate choice.
if(getSavedPin()==="none"&&!setting){onUnlock();return null}

const lockedRemaining=lockedUntil?Math.max(0,Math.ceil((lockedUntil-Date.now())/1000)):0;
const isLocked=lockedRemaining>0;

return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#1E293B,#334155)",padding:24}}>
<div className="gq-fade-in" style={{textAlign:"center",maxWidth:340,width:"100%"}}>
<div style={{fontSize:48,marginBottom:16}}>🔒</div>
<h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",marginBottom:6}}>
{setting?"Set Up Parent PIN":"Parent Area"}
</h2>
<p style={{color:"rgba(255,255,255,.5)",fontSize:13,marginBottom:24}}>
{setting?"Choose a 4-digit PIN to keep this area private, or skip for now":"Enter your 4-digit PIN to continue"}
</p>

<div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16}} aria-label="PIN entry">
{[0,1,2,3].map(i=><div key={i} style={{width:44,height:52,borderRadius:12,background:"rgba(255,255,255,.08)",border:pin.length>i?"2px solid #3B82F6":"2px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",fontWeight:700}}>{pin[i]?"●":""}</div>)}
</div>

<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:240,margin:"0 auto 16px",opacity:isLocked?0.4:1,pointerEvents:isLocked?"none":"auto"}}>
{[1,2,3,4,5,6,7,8,9,null,0,"del"].map((n,i)=>
n===null?<div key={i}/>:
<button key={i} onClick={()=>handleDigit(n==="del"?"del":String(n))} disabled={isLocked} aria-label={n==="del"?"Delete":`Digit ${n}`} style={{padding:"14px",borderRadius:12,border:"none",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:n==="del"?16:20,fontWeight:600,cursor:isLocked?"default":"pointer",fontFamily:"'Fredoka',sans-serif"}}>{n==="del"?"⌫":n}</button>
)}
</div>

{error&&<p role="alert" style={{color:"#EF4444",fontSize:12,marginBottom:8}}>{error}{isLocked?` (${lockedRemaining}s)`:""}</p>}

{pin.length===4&&!isLocked&&<button onClick={handleSubmit} disabled={busy} style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,padding:"12px 32px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:busy?"default":"pointer",width:"100%",marginBottom:8,opacity:busy?0.6:1,animation:"fadeSlideUp .3s ease-out both"}}>
{busy?"…":(setting?"Set PIN and Continue":"Open Parent View")}
</button>}

{setting&&<button onClick={handleSkip} style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,padding:"10px 24px",border:"2px solid rgba(255,255,255,.15)",borderRadius:100,background:"transparent",color:"rgba(255,255,255,.6)",cursor:"pointer",width:"100%",marginBottom:8}}>Skip — no PIN needed</button>}

{/* Change / Remove PIN intentionally NOT shown on the locked screen.
    Both actions live in the Parent Dashboard, behind the unlocked state. */}

<button onClick={onBack} style={{marginTop:12,background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:13,cursor:"pointer"}}>← Back</button>
</div>
</div>}

// ── Parent PIN Manager (only rendered inside the unlocked Parent Dashboard) ──

function ParentPinManager(){
const[mode,setMode]=useState("idle"); // idle | verify-change | new | verify-remove
const[currentPin,setCurrentPin]=useState("");
const[newPin,setNewPin]=useState("");
const[error,setError]=useState("");
const[busy,setBusy]=useState(false);
const[message,setMessage]=useState("");
const stored=(()=>{try{return localStorage.getItem(STORED_PIN_KEY)}catch(e){return null}})();
const hasPin=stored&&stored!=="none";

const reset=()=>{setMode("idle");setCurrentPin("");setNewPin("");setError("");setMessage("")};

const verifyCurrent=async(input)=>{
  const saved=(()=>{try{return localStorage.getItem(STORED_PIN_KEY)}catch(e){return null}})();
  if(!saved||saved==="none")return false;
  // Match against hashed or legacy plaintext.
  const h=await hashPin(input);
  return saved===h||(saved.length===4&&saved===input);
};

const handleChange=async()=>{
  setBusy(true);setError("");
  try{
    if(!(await verifyCurrent(currentPin))){setError("Current PIN is wrong");return}
    setMode("new");setCurrentPin("");
  }finally{setBusy(false)}
};

const handleSaveNew=async()=>{
  if(newPin.length!==4){setError("Pick a 4-digit PIN");return}
  setBusy(true);setError("");
  try{
    const h=await hashPin(newPin);
    try{localStorage.setItem(STORED_PIN_KEY,h)}catch(e){}
    setMessage("PIN updated");
    setTimeout(reset,1500);
  }finally{setBusy(false)}
};

const handleRemove=async()=>{
  setBusy(true);setError("");
  try{
    if(!(await verifyCurrent(currentPin))){setError("Current PIN is wrong");return}
    try{localStorage.setItem(STORED_PIN_KEY,"none")}catch(e){}
    setMessage("PIN removed. Parent area is no longer protected on this device.");
    setTimeout(reset,2000);
  }finally{setBusy(false)}
};

const handleSetFirst=async()=>{
  if(newPin.length!==4){setError("Pick a 4-digit PIN");return}
  setBusy(true);setError("");
  try{
    const h=await hashPin(newPin);
    try{localStorage.setItem(STORED_PIN_KEY,h)}catch(e){}
    setMessage("PIN set. The parent area is now protected.");
    setTimeout(reset,1500);
  }finally{setBusy(false)}
};

const inputStyle={fontFamily:"'Nunito',sans-serif",fontSize:18,letterSpacing:8,padding:"10px 14px",border:"2px solid #E2E8F0",borderRadius:10,width:140,textAlign:"center"};
const btn=(label,onClick,kind="primary")=>(
  <button onClick={onClick} disabled={busy} style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,padding:"8px 18px",borderRadius:100,border:kind==="ghost"?"1px solid #E2E8F0":"none",background:kind==="primary"?"linear-gradient(135deg,#3B82F6,#8B5CF6)":kind==="danger"?"#FEE2E2":"#fff",color:kind==="primary"?"#fff":kind==="danger"?"#B91C1C":"#475569",cursor:busy?"default":"pointer",opacity:busy?0.6:1}}>{label}</button>
);

return(
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#1E293B",marginBottom:4}}>Parent PIN</h3>
<p style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>{hasPin?"A 4-digit PIN protects this area on this device.":"No PIN is set. Anyone using this device can open the parent area."}</p>

{message&&<div style={{padding:"8px 12px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,marginBottom:10,fontSize:12,color:"#065F46"}}>{message}</div>}

{mode==="idle"&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
{hasPin?<>
{btn("Change PIN",()=>setMode("verify-change"))}
{btn("Remove PIN",()=>setMode("verify-remove"),"danger")}
</>:btn("Set PIN",()=>setMode("new"))}
</div>}

{mode==="verify-change"&&<div>
<p style={{fontSize:12,color:"#64748B",marginBottom:8}}>Enter your current PIN to continue.</p>
<input type="password" inputMode="numeric" maxLength={4} value={currentPin} onChange={e=>setCurrentPin(e.target.value.replace(/\D/g,"").slice(0,4))} style={inputStyle} autoFocus aria-label="Current PIN"/>
{error&&<p role="alert" style={{color:"#EF4444",fontSize:12,marginTop:6}}>{error}</p>}
<div style={{display:"flex",gap:8,marginTop:10}}>{btn("Continue",handleChange)}{btn("Cancel",reset,"ghost")}</div>
</div>}

{mode==="new"&&<div>
<p style={{fontSize:12,color:"#64748B",marginBottom:8}}>{hasPin?"Choose a new 4-digit PIN.":"Choose a 4-digit PIN."}</p>
<input type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,4))} style={inputStyle} autoFocus aria-label="New PIN"/>
{error&&<p role="alert" style={{color:"#EF4444",fontSize:12,marginTop:6}}>{error}</p>}
<div style={{display:"flex",gap:8,marginTop:10}}>{btn("Save",hasPin?handleSaveNew:handleSetFirst)}{btn("Cancel",reset,"ghost")}</div>
</div>}

{mode==="verify-remove"&&<div>
<p style={{fontSize:12,color:"#64748B",marginBottom:8}}>Enter your current PIN to remove protection.</p>
<input type="password" inputMode="numeric" maxLength={4} value={currentPin} onChange={e=>setCurrentPin(e.target.value.replace(/\D/g,"").slice(0,4))} style={inputStyle} autoFocus aria-label="Current PIN"/>
{error&&<p role="alert" style={{color:"#EF4444",fontSize:12,marginTop:6}}>{error}</p>}
<div style={{display:"flex",gap:8,marginTop:10}}>{btn("Remove PIN",handleRemove,"danger")}{btn("Cancel",reset,"ghost")}</div>
</div>}

</div>
);
}

// ── Parent / Teacher Dashboard ──────────────────────────────────────

function ParentDashboard({profile,onBack,theme,onToggleTheme,onOpenAccessibility,onViewAdultPortfolio}){
const{name,avatarId,avatarName,progress,ageGroup,streak,lastQuestDate}=profile;
const av=AVATARS.find(a=>a.id===avatarId);
const lv=getAvLv(progress);
const evo=av?.evolutions?.[lv-1]||av?.emoji;
const tq=Object.values(progress).reduce((s,p)=>s+p.questsCompleted,0);
const agLabel=AGE_GROUPS.find(a=>a.id===ageGroup)?.label||ageGroup;
const[certMsg,setCertMsg]=useState(null);

const handleCert=(subKey,sub,comp,p)=>{
const hist=p.questHistory||[];
// v6.7: only pass evidence we actually have. We don't yet capture context
// per quest, so don't claim any. Pull recent quest titles and dates from
// real history.
const recent=hist.slice(-4);
const titles=[...new Set(recent.map(h=>h.title))].slice(0,4);
const questDates=recent.map(h=>h.date).filter(Boolean).slice(0,4);
try{generateCertificate({childName:name,subCompetencyKey:subKey,profileLevel:p.profile,profileText:sub.kidProfiles[p.profile-1],evidenceSummary:{questTitles:titles,questDates,contexts:[],reflections:[],evidenceCount:p.questsCompleted},dateEarned:new Date().toLocaleDateString("en-CA"),avatarName});setCertMsg(subKey);setTimeout(()=>setCertMsg(null),3000)}catch(e){console.error(e)}};

// Calculate overall summary
const subKeys=[];
Object.values(COMPETENCIES).forEach(c=>{Object.keys(c.subCompetencies).forEach(sk=>subKeys.push(sk))});
const avgProfile=(subKeys.reduce((s,k)=>s+progress[k].profile,0)/subKeys.length).toFixed(1);
const highestSub=subKeys.reduce((best,k)=>progress[k].profile>progress[best].profile?k:best,subKeys[0]);
const lowestSub=subKeys.reduce((low,k)=>progress[k].profile<progress[low].profile?k:low,subKeys[0]);

// Find sub name helper
const findSubName=(sk)=>{for(const c of Object.values(COMPETENCIES)){if(c.subCompetencies[sk])return c.subCompetencies[sk].name}return sk};

return<div style={{minHeight:"100vh",background:"#F8FAFC",paddingBottom:40}}>
{/* Header */}
<div style={{background:"linear-gradient(135deg,#1E293B,#334155)",padding:"24px 20px 28px",color:"#fff"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
<button onClick={onBack} style={{background:"rgba(255,255,255,.12)",border:"none",borderRadius:100,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back to {name}'s View</button>
<span style={{fontSize:10,color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.08)",padding:"4px 10px",borderRadius:100}}>Parent / Teacher View</span>
</div>
<div style={{display:"flex",alignItems:"center",gap:12}}>
<span style={{fontSize:36}}>{evo}</span>
<div>
<h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700}}>{name}'s Growth Journey</h2>
<p style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>{agLabel} · {avatarName} · Level {lv} ({EVOLUTION_TITLES[lv-1]})</p>
</div>
</div>
</div>

{/* Quick Summary */}
<div style={{padding:"16px 20px"}}>

{/* Preferences hub (v6.7.2) — voice, theme, accessibility, all in one place */}
<ParentPreferences theme={theme} onToggleTheme={onToggleTheme} onOpenAccessibility={onOpenAccessibility}/>

<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:16}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#475569",marginBottom:12}}>Overview</h3>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
{[{v:tq,l:"Quests Completed",c:"#3B82F6"},{v:avgProfile,l:"Average Profile Level",c:"#8B5CF6"},{v:streak>0?`${streak} days`:"—",l:"Current Streak",c:"#F59E0B"}].map((s,i)=>
<div key={i} style={{textAlign:"center",padding:"10px 4px",background:"#F8FAFC",borderRadius:10}}>
<div style={{fontSize:20,fontWeight:700,fontFamily:"'Fredoka',sans-serif",color:s.c}}>{s.v}</div>
<div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>{s.l}</div>
</div>)}
</div>
<div style={{display:"flex",gap:8}}>
<div style={{flex:1,padding:"8px 10px",background:"#F0FDF4",borderRadius:8,borderLeft:"3px solid #10B981"}}>
<p style={{fontSize:9,fontWeight:700,color:"#059669",textTransform:"uppercase",letterSpacing:.5}}>Most practised</p>
<p style={{fontSize:12,color:"#334155",marginTop:2}}>{findSubName(highestSub)} (Level {progress[highestSub].profile})</p>
</div>
<div style={{flex:1,padding:"8px 10px",background:"#FFFBEB",borderRadius:8,borderLeft:"3px solid #F59E0B"}}>
<p style={{fontSize:9,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:.5}}>Yet to explore</p>
<p style={{fontSize:12,color:"#334155",marginTop:2}}>{findSubName(lowestSub)} (Level {progress[lowestSub].profile})</p>
</div>
</div>
</div>

{/* Curriculum note */}
<div style={{background:"#EFF6FF",borderRadius:12,padding:"12px 14px",marginBottom:16,border:"1px solid #BFDBFE"}}>
<p style={{fontSize:11,color:"#1E40AF",lineHeight:1.5}}>
<strong>About these levels:</strong> BC Core Competency profiles are developmental and additive — not tied to specific grades. Children grow at their own pace, and it's normal to be at different levels across different areas. Each level builds on the ones before it.
</p>
</div>

{/* Per-competency breakdown */}
{Object.entries(COMPETENCIES).map(([ck,comp])=><div key={ck} style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
<span style={{fontSize:22}}>{comp.icon}</span>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#475569"}}>{comp.name}</h3>
</div>

{Object.entries(comp.subCompetencies).map(([sk,sub])=>{
const p=progress[sk];
const th=STARS_THRESH[p.profile-1]||12;
const pct=Math.min((p.stars/th)*100,100);
return<div key={sk} style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #F1F5F9"}}>

{/* Sub-competency header */}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
<div>
<span style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,color:"#475569"}}>{sub.name}</span>
<span style={{fontSize:10,color:comp.color,fontWeight:700,marginLeft:8,background:`${comp.color}12`,padding:"2px 8px",borderRadius:100}}>Profile {p.profile}/6</span>
</div>
<span style={{fontSize:10,color:"#94A3B8"}}>{p.questsCompleted} quests · ⭐{p.stars}/{th}</span>
</div>

{/* Progress bar */}
<div style={{background:"#F1F5F9",borderRadius:100,height:5,marginBottom:8,overflow:"hidden"}}>
<div style={{height:"100%",borderRadius:100,width:`${pct}%`,background:comp.gradient,transition:"width .8s ease-out"}}/>
</div>

{/* Current profile - official language for teacher, kid language labelled */}
<div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",marginBottom:6}}>
<p style={{fontSize:9,fontWeight:700,color:comp.color,marginBottom:2,textTransform:"uppercase",letterSpacing:.5}}>Current Profile (Official BC Curriculum Wording)</p>
<p style={{fontSize:12,color:"#334155",lineHeight:1.4,fontStyle:"italic"}}>"{sub.profiles[p.profile-1]}"</p>
</div>
<div style={{background:"#F0F9FF",borderRadius:8,padding:"8px 10px",marginBottom:6}}>
<p style={{fontSize:9,fontWeight:700,color:"#0369A1",marginBottom:2,textTransform:"uppercase",letterSpacing:.5}}>What {name} sees (kid-friendly version)</p>
<p style={{fontSize:12,color:"#334155",lineHeight:1.4}}>"{sub.kidProfiles[p.profile-1]}"</p>
</div>

{/* Previous levels shown as built strengths */}
{p.profile>=2&&<div style={{marginBottom:6}}>
<p style={{fontSize:9,fontWeight:700,color:"#16A34A",marginBottom:3}}>✓ Previously Demonstrated</p>
{sub.profiles.slice(0,p.profile-1).map((prev,pi)=>
<p key={pi} style={{fontSize:10,color:"#64748B",lineHeight:1.4,marginBottom:1,paddingLeft:8}}>Profile {pi+1}: {prev}</p>
)}
</div>}

{/* Next profile */}
{p.profile<6&&<div>
<p style={{fontSize:9,fontWeight:700,color:"#B45309",marginBottom:1}}>Next Profile Goal</p>
<p style={{fontSize:10,color:"#78716C",lineHeight:1.4,paddingLeft:8}}>Profile {p.profile+1}: {sub.profiles[p.profile]}</p>
</div>}

{/* Certificate button */}
{p.profile>=2&&<button onClick={()=>handleCert(sk,sub,comp,p)} style={{marginTop:8,display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:"1px solid #E2E8F0",borderRadius:100,background:certMsg===sk?"#F0FDF4":"#fff",fontSize:11,fontWeight:600,color:certMsg===sk?"#10B981":"#64748B",cursor:"pointer"}}>
{certMsg===sk?"✓ Certificate Downloaded":"📄 Download Certificate for "+sub.name}
</button>}

{/* Quest history */}
{(p.questHistory||[]).length>0&&<div style={{marginTop:8}}>
<p style={{fontSize:9,fontWeight:700,color:"#64748B",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Recent Activity</p>
{(p.questHistory||[]).slice(-5).reverse().map((h,hi)=>
<div key={hi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:hi<Math.min((p.questHistory||[]).length,5)-1?"1px solid #F8FAFC":"none"}}>
<span style={{fontSize:11,color:"#475569"}}>{h.title}</span>
<span style={{fontSize:10,color:"#94A3B8"}}>{h.date} · ⭐{h.stars}</span>
</div>)}
</div>}
</div>})}
</div>)}

{/* What the levels mean */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#475569",marginBottom:10}}>Understanding the Profile Levels</h3>
{[
{l:1,t:"Emerging",d:"Beginning to show awareness. Usually in familiar, supported settings."},
{l:2,t:"Developing",d:"Showing purposeful behaviour. Still mostly in familiar contexts."},
{l:3,t:"Practising",d:"Using learned strategies. Taking more responsibility."},
{l:4,t:"Confident",d:"Adapting to context. Showing metacognition and strategic thinking."},
{l:5,t:"Extending",d:"Evaluating, advocating, thinking critically across perspectives."},
{l:6,t:"Transforming",d:"Creating sustained impact. Connecting with broader networks."},
].map(lv=>
<div key={lv.l} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
<span style={{fontFamily:"'Fredoka',sans-serif",fontSize:11,fontWeight:700,color:"#fff",background:"#94A3B8",padding:"2px 7px",borderRadius:100,flexShrink:0}}>P{lv.l}</span>
<div><span style={{fontSize:12,fontWeight:700,color:"#334155"}}>{lv.t}</span><span style={{fontSize:11,color:"#94A3B8"}}> — {lv.d}</span></div>
</div>)}
</div>

{/* Student Learning Report */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#1E293B",marginBottom:4}}>Student Learning Report</h3>
<p style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>Generate a BC K-12 Reporting Policy compliant report with competency self-assessment, evidence from quests, goals, and family guidance. Upload directly to MyEducationBC or print for report cards.</p>
<button onClick={()=>generateStudentReport({studentName:name,ageGroup:profile.ageGroup,teacherName:"",className:"",reportingPeriod:"Current Term",progress:profile.progress,questHistory:Object.values(profile.progress).flatMap((p,i)=>(p.questHistory||[]).map(q=>({...q,sub:Object.keys(profile.progress)[i]}))),storyExcerpts:profile.story?.paragraphs?.slice(-2)||[],avatarName:profile.avatarName})} style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,padding:"12px 20px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#059669,#10B981)",color:"#fff",cursor:"pointer",width:"100%"}}>📄 Download Student Report (PDF)</button>
</div>

{/* Share Progress with Teacher */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#1E293B",marginBottom:8}}>Share with Teacher</h3>
<p style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>Generate a progress code to share with your child's teacher for their class dashboard.</p>
<ShareProgressButton profile={profile}/>
</div>

{/* User Manual download */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14,textAlign:"center"}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#475569",marginBottom:8}}>User Manual</h3>
<p style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>Download a printable guide covering all features, how quests work, Growth Stars, self-assessment, and curriculum alignment.</p>
<button onClick={()=>{try{generateUserManual()}catch(e){console.error(e)}}} style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,padding:"12px 28px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer"}}>Download User Manual (PDF)</button>
</div>

{/* Parent PIN management (visible only because parent has unlocked this view) */}
<ParentPinManager/>

{/* v6.7.17: assessment-view portfolio for parents/teachers */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14}}>
  <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#1E293B",marginBottom:6}}>Growth Profile (Assessment View)</h3>
  <p style={{fontSize:11,color:"#64748B",lineHeight:1.5,marginBottom:12}}>
    {profile?.name || "Your child"}'s full Growth Profile with BC Core Competency profile levels,
    evidence of growth, and a suggested report card comment draft for each sub-competency.
    The child sees an age-appropriate version of this — without profile numbers or assessment language.
  </p>
  <button onClick={onViewAdultPortfolio} style={{
    fontFamily: "'Fredoka',sans-serif",
    fontSize: 13,
    fontWeight: 600,
    padding: "10px 24px",
    border: "2px solid #C7D2FE",
    borderRadius: 100,
    background: "#fff",
    color: "#4338CA",
    cursor: "pointer",
  }}>Open Assessment View →</button>
</div>

<VoiceDiagnostics/>

{/* Reset option */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14,textAlign:"center"}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#94A3B8",marginBottom:8}}>Start Fresh</h3>
<p style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>Clear all progress, consent, and preferences. This removes all data from this device and cannot be undone.</p>
<button onClick={()=>{if(window.confirm("Are you sure? This will delete all progress, quests, and stars. This cannot be undone.")){try{localStorage.removeItem("growquest_bc_v3");localStorage.removeItem("growquest_parent_pin");localStorage.removeItem("growquest_parent_salt");localStorage.removeItem("gq_voice");localStorage.removeItem("gq_voice_name");localStorage.removeItem("gq_consent");localStorage.removeItem("gq_theme");localStorage.removeItem("gq_accessibility");localStorage.removeItem("gq_elevenlabs_config");localStorage.removeItem("gq_premium_voice");Object.keys(localStorage).filter(k=>k.startsWith("gq_narrate_last:")).forEach(k=>localStorage.removeItem(k))}catch(e){}window.location.reload()}}} style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,padding:"10px 24px",border:"2px solid #FCA5A5",borderRadius:100,background:"#fff",color:"#EF4444",cursor:"pointer"}}>Reset All Progress</button>
</div>

{/* AI Governance Statement */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#1E293B",marginBottom:8}}>How GrowQuest Uses Technology</h3>
<p style={{fontSize:11,color:"#64748B",lineHeight:1.6,marginBottom:8}}>GrowQuest uses automated tools to assist with two features: voice-to-text (so children can speak instead of type) and draft report generation (to save teacher time). These tools support — but never replace — teacher judgement.</p>
<p style={{fontSize:11,color:"#64748B",lineHeight:1.6,marginBottom:8}}>Automated features do not independently assess children, make educational decisions, or create behavioural profiles. All generated reports are drafts intended for teacher review before use.</p>
<p style={{fontSize:11,color:"#64748B",lineHeight:1.6}}>Voice recordings are processed in memory and immediately discarded — they are never stored. Only the transcribed text is kept. The child's first name is used for story personalisation only.</p>
</div>

{/* Curriculum link */}
<div style={{textAlign:"center",padding:"12px 20px"}}>
<p style={{fontSize:11,color:"#94A3B8",lineHeight:1.5}}>
This app aligns with BC's Core Competencies curriculum.<br/>
Learn more: <a href="https://curriculum.gov.bc.ca/competencies" target="_blank" rel="noopener" style={{color:"#3B82F6"}}>curriculum.gov.bc.ca/competencies</a>
</p>
</div>
</div>
</div>}

// ── Celebration Sound ──────────────────────────────────────────────
// Uses Web Audio API to generate a cheerful chime — no audio files needed

function playCelebrationSound(){
try{
const ctx=new(window.AudioContext||window.webkitAudioContext)();
const notes=[523.25,659.25,783.99,1046.50]; // C5, E5, G5, C6 — a happy major chord arpeggio
notes.forEach((freq,i)=>{
const osc=ctx.createOscillator();
const gain=ctx.createGain();
osc.type="sine";
osc.frequency.value=freq;
gain.gain.setValueAtTime(0,ctx.currentTime+i*0.12);
gain.gain.linearRampToValueAtTime(0.3,ctx.currentTime+i*0.12+0.05);
gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.12+0.5);
osc.connect(gain);gain.connect(ctx.destination);
osc.start(ctx.currentTime+i*0.12);
osc.stop(ctx.currentTime+i*0.12+0.5);
});
// Final sparkle
setTimeout(()=>{
const osc=ctx.createOscillator();const gain=ctx.createGain();
osc.type="triangle";osc.frequency.value=1318.51; // E6
gain.gain.setValueAtTime(0.2,ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.6);
osc.connect(gain);gain.connect(ctx.destination);
osc.start();osc.stop(ctx.currentTime+0.6);
},notes.length*120);
}catch(e){}}

// ── Text-to-Speech Helper ───────────────────────────────────────────

function useSpeak(){
const speakingRef=useRef(false);
const audioRef=useRef(null);  // for ElevenLabs <audio>
// v6.7.11: generation counter. Each speak() call increments this and
// captures the new value. Late-audio handlers compare against this to
// detect whether a newer speak() has happened in the meantime. We can't
// rely on audioRef.current alone, because between speak() calls during
// the "fetch in flight, no audio playing yet" window, audioRef.current
// stays null and the equality check fails to distinguish generations.
const speakGenRef=useRef(0);
// v6.7.6: prefetch cache.
//   Map<cleanText, { status, url?, promise? }>
//   status: "pending" while fetch is in flight, "ready" when URL available, "failed" on null
// Keyed by the cleaned (emoji-stripped) text so prefetch + speak match.
const prefetchRef=useRef(new Map());
const[voices,setVoices]=useState([]);
const[selectedVoice,setSelectedVoice]=useState(()=>{try{return localStorage.getItem("gq_voice_name")||null}catch(e){return null}});

useEffect(()=>{
const load=()=>{
const all=window.speechSynthesis?.getVoices()||[];
const eng=all.filter(v=>v.lang.startsWith("en"));
setVoices(eng);
// Auto-select best voice if none chosen yet
if(!selectedVoice&&eng.length){
const preferred=["Samantha","Karen","Moira","Tessa","Fiona","Martha","Google UK English Female","Microsoft Zira"];
let pick=null;
for(const pn of preferred){pick=eng.find(v=>v.name.includes(pn));if(pick)break}
if(!pick)pick=eng.find(v=>v.name.toLowerCase().includes("female"));
if(!pick)pick=eng.find(v=>!v.name.toLowerCase().includes("male")&&!v.name.toLowerCase().includes("daniel")&&!v.name.toLowerCase().includes("alex"));
if(!pick&&eng.length)pick=eng[0];
if(pick){setSelectedVoice(pick.name);try{localStorage.setItem("gq_voice_name",pick.name)}catch(e){}}
}};
load();
if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=load;

// v6.7.6: clean up any leaked prefetched blob URLs when this hook
// instance unmounts (component switches away).
return ()=>{
  const m=prefetchRef.current;
  m.forEach(entry=>{if(entry?.url) try{URL.revokeObjectURL(entry.url)}catch(e){}});
  m.clear();
};
},[]);

const pickVoice=(name)=>{setSelectedVoice(name);try{localStorage.setItem("gq_voice_name",name)}catch(e){}};

// v6.7.4: clean up any in-flight audio before starting a new utterance.
const stopAudio=()=>{
  if(audioRef.current){
    try{audioRef.current.pause();audioRef.current.src=""}catch(e){}
    audioRef.current=null;
  }
};

// Strip emojis the same way speakWebSpeech / synthesizePremiumSpeech do.
// Used as the prefetch cache key so prefetch + speak agree on the key.
const cleanText=(text)=>text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[⭐✦✨⚡]/gu,"").replace(/\s{2,}/g," ").trim();

const speakWebSpeech=(text,rate,onStart)=>{
  if(!window.speechSynthesis){onStart&&onStart();return}
  window.speechSynthesis.cancel();
  const spokenText=cleanText(text);
  const u=new SpeechSynthesisUtterance(spokenText);
  u.rate=rate;u.pitch=1.15;u.volume=1;
  const allVoices=voices.length?voices:window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith("en"));
  const pick=selectedVoice?allVoices.find(v=>v.name===selectedVoice):allVoices[0];
  if(pick)u.voice=pick;
  // Web Speech latency is near-zero, so fire onStart at speech start.
  u.onstart=()=>{speakingRef.current=true;onStart&&onStart()};
  u.onend=()=>{speakingRef.current=false};
  window.speechSynthesis.speak(u);
  // Safety: if onstart never fires (some browsers swallow it), trigger
  // onStart after a short fallback so the typewriter isn't stuck.
  setTimeout(()=>{if(onStart){const o=onStart;onStart=null;o()}},120);
};

// v6.7.6: prefetch the audio for `text` so a subsequent speak() call
// can start instantly. Safe to call any number of times; in-flight
// fetches are deduplicated by text.
const prefetch=(text)=>{
  if(!text)return;
  const cfg=loadPremiumVoiceConfig();
  if(!cfg||!cfg.enabled)return;  // premium not on → nothing to prefetch
  const key=cleanText(text);
  if(!key)return;
  const existing=prefetchRef.current.get(key);
  if(existing)return;  // already in flight or done
  const entry={status:"pending"};
  prefetchRef.current.set(key,entry);
  synthesizePremiumSpeech(key,{voiceId:cfg.voiceId}).then(url=>{
    if(url){entry.status="ready";entry.url=url}
    else{entry.status="failed"}
  }).catch(()=>{entry.status="failed"});
  entry.promise=Promise.resolve(); // sentinel; resolution monitored via status
};

// Wait up to `capMs` for a pending prefetch to land. Resolves with the
// ready URL, or null if cap elapsed first or fetch failed.
const awaitPrefetch=(key,capMs)=>new Promise(resolve=>{
  const start=Date.now();
  const poll=()=>{
    const e=prefetchRef.current.get(key);
    if(!e){resolve(null);return}
    if(e.status==="ready"){resolve(e.url);return}
    if(e.status==="failed"){resolve(null);return}
    if(Date.now()-start>=capMs){resolve(null);return}
    setTimeout(poll,40);
  };
  poll();
});

// v6.7.6: speak now accepts an optional onStart callback that fires
// the moment audio playback actually begins. Callers (the guided
// onboarding typewriter) use this to keep text + voice in sync.
// v6.7.7: if the user has saved a custom speechRate in accessibility
// preferences, that overrides the caller-passed rate. This way the
// "Slower / Default / Faster" slider applies to BOTH the screen-reader
// narration AND the companion's dialogue.
const speak=async(text,rate=0.9,opts={})=>{
  const onStart=opts.onStart;
  // v6.7.11: increment generation counter. Late-audio handlers from
  // previous speak() calls will see myGen !== speakGenRef.current and
  // refuse to play.
  speakGenRef.current += 1;
  const myGen = speakGenRef.current;
  // Resolve effective rate: user preference wins, fallback to caller's.
  let effectiveRate=rate;
  try{
    const a=loadAccessibility();
    if(a&&typeof a.speechRate==="number")effectiveRate=a.speechRate;
  }catch(e){}
  // Always stop any prior audio so we don't overlap.
  stopAudio();
  if(window.speechSynthesis)window.speechSynthesis.cancel();

  const cfg=loadPremiumVoiceConfig();
  const key=cleanText(text);

  if(cfg&&cfg.enabled){
    try{
      // Three possible states for the requested text:
      //   A. Prefetch finished → URL ready, play immediately.
      //   B. Prefetch still in flight → wait up to 600ms; if it lands
      //      in time, play synced with the typewriter. If the cap hits
      //      first, let text proceed and attach a "late audio" handler
      //      that plays the URL whenever it does arrive — provided no
      //      newer speak() has stolen the floor in the meantime.
      //   C. No prefetch at all → kick off a fresh fetch with the same
      //      race-and-late-attach behaviour.
      //
      // v6.7.11: stale-guard is now myGen !== speakGenRef.current, not
      // an audioRef snapshot. This catches the case where two adjacent
      // speak() calls both timed out before audioRef was set, so an
      // audioRef-based check would think they're the same generation.

      let url=null;
      const cached=prefetchRef.current.get(key);

      if(cached&&cached.status==="ready"&&cached.url){
        // Path A: ready cache hit
        url=cached.url;
        prefetchRef.current.delete(key);
      }else if(cached&&cached.status==="pending"){
        // Path B: prefetch in flight, wait up to 600ms
        url=await awaitPrefetch(key,600);
        if(url){
          prefetchRef.current.delete(key);
        }else{
          // Cap hit. Check whether the prefetch actually failed (rare:
          // status was set to "failed" before cap elapsed) — if so,
          // fall through to Web Speech.
          const finalEntry=prefetchRef.current.get(key);
          if(!finalEntry||finalEntry.status==="failed"){
            prefetchRef.current.delete(key);
            // Don't return; fall through to speakWebSpeech below.
          }else{
            // Still pending. Start the typewriter now; attach late-audio
            // handler so the voice plays when it eventually arrives.
            onStart&&onStart();
            // Poll until the entry resolves (ready or failed).
            const poll=()=>{
              // v6.7.11: bail if a newer speak() has happened.
              if(myGen!==speakGenRef.current)return;
              const e=prefetchRef.current.get(key);
              if(!e){return}  // someone else cleaned it up
              if(e.status==="ready"&&e.url){
                prefetchRef.current.delete(key);
                if(myGen!==speakGenRef.current)return; // re-check after async gap
                // Cancel any in-flight Web Speech before premium plays.
                if(window.speechSynthesis)window.speechSynthesis.cancel();
                // Stop any currently-playing audio element first.
                stopAudio();
                const lateAudio=new Audio(e.url);
                audioRef.current=lateAudio;
                speakingRef.current=true;
                try{
                  const clamped=Math.min(2.0,Math.max(0.5,effectiveRate/0.9));
                  lateAudio.playbackRate=clamped;
                }catch(_e){}
                lateAudio.onended=()=>{speakingRef.current=false;URL.revokeObjectURL(e.url);if(audioRef.current===lateAudio)audioRef.current=null};
                lateAudio.onerror=()=>{speakingRef.current=false;URL.revokeObjectURL(e.url);if(audioRef.current===lateAudio)audioRef.current=null};
                lateAudio.play().catch(()=>{URL.revokeObjectURL(e.url)});
                return;
              }
              if(e.status==="failed"){
                prefetchRef.current.delete(key);
                if(myGen!==speakGenRef.current)return;
                speakWebSpeech(text,effectiveRate); // no onStart (already fired)
                return;
              }
              // Still pending — keep polling.
              setTimeout(poll,80);
            };
            setTimeout(poll,80);
            return;
          }
        }
      }else{
        // Path C: no prefetch, race a fresh fetch against the cap
        const fetchPromise=synthesizePremiumSpeech(key,{voiceId:cfg.voiceId});
        const timeoutPromise=new Promise(r=>setTimeout(()=>r("__timeout__"),600));
        const winner=await Promise.race([fetchPromise,timeoutPromise]);
        if(winner==="__timeout__"){
          // Cap hit. Start the typewriter now; attach late-audio.
          onStart&&onStart();
          fetchPromise.then(lateUrl=>{
            // v6.7.11: bail if a newer speak() has happened.
            if(myGen!==speakGenRef.current)return;
            if(!lateUrl){
              // Late failure → Web Speech, no onStart (already fired).
              speakWebSpeech(text,effectiveRate);
              return;
            }
            // Cancel any in-flight Web Speech and stop any audio that
            // somehow started.
            if(window.speechSynthesis)window.speechSynthesis.cancel();
            stopAudio();
            const audio=new Audio(lateUrl);
            audioRef.current=audio;
            speakingRef.current=true;
            try{
              const clamped=Math.min(2.0,Math.max(0.5,effectiveRate/0.9));
              audio.playbackRate=clamped;
            }catch(_e){}
            audio.onended=()=>{speakingRef.current=false;URL.revokeObjectURL(lateUrl);if(audioRef.current===audio)audioRef.current=null};
            audio.onerror=()=>{speakingRef.current=false;URL.revokeObjectURL(lateUrl);if(audioRef.current===audio)audioRef.current=null};
            audio.play().catch(()=>{URL.revokeObjectURL(lateUrl)});
          });
          return;
        }
        url=winner;
      }

      if(url){
        // v6.7.15: re-check generation before playing. Path A (cache hit)
        // and Path B (prefetch resolved within cap) both reach this point
        // after one or more awaits. If a newer speak() ran during those
        // awaits, our audio is stale and should not play.
        if(myGen!==speakGenRef.current){
          // Clean up the URL we won't use.
          try{URL.revokeObjectURL(url)}catch(_e){}
          return;
        }
        // Cancel any other audio one more time, then play ours.
        if(window.speechSynthesis)window.speechSynthesis.cancel();
        stopAudio();
        const audio=new Audio(url);
        audioRef.current=audio;
        speakingRef.current=true;
        // v6.7.7: scale playback rate to user preference. <audio>.playbackRate
        // ranges 0.5-4.0; we clamp to a sensible band. ElevenLabs renders at
        // its natural speed; we slow/speed via HTMLAudioElement.
        try{
          const clamped=Math.min(2.0,Math.max(0.5,effectiveRate/0.9));
          audio.playbackRate=clamped;
        }catch(e){}
        audio.onplay=()=>{onStart&&onStart()};
        audio.onended=()=>{speakingRef.current=false;URL.revokeObjectURL(url);if(audioRef.current===audio)audioRef.current=null};
        audio.onerror=()=>{speakingRef.current=false;URL.revokeObjectURL(url);if(audioRef.current===audio)audioRef.current=null;speakWebSpeech(text,effectiveRate,onStart)};
        await audio.play().catch(()=>{speakWebSpeech(text,effectiveRate,onStart)});
        return;
      }
      // url is null → fall through to Web Speech.
    }catch(e){
      console.warn("Premium voice path failed, falling back:",e);
    }
  }

  // v6.7.15: final guard before Web Speech fallback — if generation has
  // advanced, a newer speak() is in charge; don't add a stale utterance.
  if(myGen!==speakGenRef.current)return;
  speakWebSpeech(text,effectiveRate,onStart);
};

const preview=(name)=>{
  // Preview is for Web Speech voices only (the premium voice preview is in
  // PremiumVoicePanel, which goes through /api/tts directly).
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance("Hi there! I'm your guide.");
  u.rate=0.9;u.pitch=1.15;u.volume=1;
  const allVoices=voices.length?voices:window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith("en"));
  const v=allVoices.find(vv=>vv.name===name);
  if(v)u.voice=v;
  window.speechSynthesis.speak(u);
};

const stop=()=>{
  // v6.7.11: bump generation so any in-flight late-audio handlers from
  // a previous speak() will bail out instead of playing belatedly.
  speakGenRef.current += 1;
  stopAudio();
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  speakingRef.current=false;
};
return{speak,stop,prefetch,voices,selectedVoice,pickVoice,preview};}

// ── Guided Onboarding Quest ────────────────────────────────────────
// The companion walks the child through their very first experience
// so they understand quests, stars, reflection, and self-assessment
// before exploring independently.

function GuidedOnboarding({profile,onComplete}){
const[step,setStep]=useState(0);
const[response,setResponse]=useState("");
const[selEmoji,setSelEmoji]=useState(null);
const[refl,setRefl]=useState(null);
const[showConf,setShowConf]=useState(false);
const[showPart,setShowPart]=useState(false);
const[typing,setTyping]=useState("");
const[typingDone,setTypingDone]=useState(false);
const{speak,stop,prefetch,voices:availableVoices,selectedVoice,pickVoice,preview}=useSpeak();
const timerRef=useRef(null);
const[voiceOn,setVoiceOn]=useState(()=>{try{const v=localStorage.getItem("gq_voice");return v===null?true:v==="true"}catch(e){return true}});
const[showVoicePicker,setShowVoicePicker]=useState(false);
// v6.7.3: gate auto-narration behind an explicit Start tap so the user
// can pick a voice (and verify they're ready) before the companion speaks.
const[started,setStarted]=useState(false);

const toggleVoice=()=>{const nv=!voiceOn;setVoiceOn(nv);try{localStorage.setItem("gq_voice",String(nv))}catch(e){};if(!nv)stop()};

const av=AVATARS.find(a=>a.id===profile.avatarId);
const evo=av?.evolutions?.[0]||"🌰";
const name=profile.name;
const avName=profile.avatarName||av?.name;
const isEarly=profile.ageGroup==="early";
const[voiceReady,setVoiceReady]=useState(false);

// Only birds hatch from eggs
const birdIds=["owl","eagle","raven"];
const introVerb=birdIds.includes(av?.id)?"I just hatched from my egg":"I just sprouted from my seed";

// Wait for voices to load before starting the first speech
useEffect(()=>{
const check=()=>{const v=window.speechSynthesis?.getVoices()||[];if(v.length>0)setVoiceReady(true)};
check();
if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=check;
const fallback=setTimeout(()=>setVoiceReady(true),1500);
return()=>clearTimeout(fallback);
},[]);

// Companion dialogue for each step
const dialogue=[
  // 0: Wake up
  {text:`Hi ${name}. I'm ${avName}. ${introVerb}. Glad you're here.`,emoji:evo,action:"next",btnText:"Yes, let's look"},
  // 1: Explain realms
  {text:`There are three places to explore. Echo Isles for sharing ideas 💬. Wonder Peaks for thinking 🧠. Heartwood Grove for being yourself 🌱.`,emoji:evo,action:"next",btnText:"Tell me more"},
  // 2: First mini quest
  {text:isEarly
    ?`Let's try a quest. Pick the emoji that shows how you feel right now.`
    :`Let's try a quest together. Tell me: what's one thing you've been practising lately?`,
    emoji:evo,action:"quest",btnText:null},
  // 3: Reflection — v6.7.19: process-noticing, not evaluation
  {text:`${name}, take a moment. What did you notice?`,emoji:evo,action:"reflect",btnText:null},
  // 4: Stars earned — v6.7.19: stars as a record, not a chase
  {text:`You picked up your first stars. ⭐⭐ Stars are a small way to remember what you tried. You don't have to chase them — they're just here.`,emoji:evo,action:"next",btnText:"Got it"},
  // 5: Dashboard intro
  {text:`The dashboard shows the three places and today's quests. I'll be here when you want to look at something together.`,emoji:evo,action:"finish",btnText:"Let's look around"},
];

const current=dialogue[step]||dialogue[0];

// Typewriter effect + speak — v6.7.6 sync.
//
// The typewriter no longer starts at effect-mount time. Instead we
// pass an onStart callback into speak(); useSpeak fires it the moment
// audio actually begins (either when premium audio is .play()ing, or
// at SpeechSynthesisUtterance.onstart for Web Speech). This keeps
// text + voice aligned even when the network has 400-800ms of
// latency. useSpeak caps the wait at 600ms so it never feels broken.
//
// After audio starts, we prefetch the NEXT step's text so the user's
// "Continue" tap is met with a ready audio URL instead of a fresh
// round-trip.
useEffect(()=>{
  if(!started)return;

  setTyping("");setTypingDone(false);
  const text=current.text;
  const rate=isEarly?0.85:0.92;

  // iOS speechSynthesis warm-up. Only matters when Web Speech is the
  // active path (premium voice routes through <audio>, not the
  // SpeechSynthesis API), but harmless either way.
  if(!voiceReady){
    const warmup=new SpeechSynthesisUtterance("");
    warmup.volume=0;
    window.speechSynthesis?.speak(warmup);
    setVoiceReady(true);
  }

  // Define the typewriter inside the effect so we can start it from
  // either path below.
  let typewriterStarted=false;
  const startTypewriter=()=>{
    if(typewriterStarted)return;
    typewriterStarted=true;
    let i=0;
    timerRef.current=setInterval(()=>{
      i++;
      if(i<=text.length){setTyping(text.slice(0,i))}
      else{clearInterval(timerRef.current);setTypingDone(true)}
    },30);
  };

  if(voiceOn){
    // First-step iOS delay: voices may take ~800ms to load.
    const delay=(!voiceReady && step===0)?800:0;
    setTimeout(()=>{
      speak(text,rate,{onStart:startTypewriter}).then(()=>{
        // Once audio is in flight, kick off prefetch of the next
        // step so the next transition is instant.
        const next=dialogue[step+1];
        if(next&&next.text)prefetch(next.text);
      });
    },delay);
  }else{
    // Voice off: start the typewriter immediately, no audio.
    startTypewriter();
  }

  return()=>{clearInterval(timerRef.current);stop()};
},[step,started]);

const goNext=()=>{
  if(step<dialogue.length-1)setStep(step+1);
};

const handleFinish=()=>{
  // Award first stars to a sub-competency
  setShowConf(true);setShowPart(true);playCelebrationSound();
  setTimeout(()=>{setShowConf(false);setShowPart(false);onComplete(2)},2500);
};

const reflOptions=isEarly
  ?[{e:"😊",l:"Fun!"},{e:"🤔",l:"Made me think"},{e:"💪",l:"Tricky!"},{e:"🌟",l:"Loved it!"}]
  :[{e:"😊",l:"Easy"},{e:"🤔",l:"Made me think"},{e:"💪",l:"Challenging"},{e:"🌟",l:"Loved it!"}];

return<div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0F172A 0%,#1E293B 40%,#1E3A5F 100%)",display:"flex",flexDirection:"column",alignItems:"center",padding:20,paddingTop:40,position:"relative",overflow:"hidden"}}>
<ConfettiBlast active={showConf}/>

{/* Stars background */}
{Array.from({length:20},(_,i)=><div key={i} style={{position:"absolute",width:`${1+Math.random()*2}px`,height:`${1+Math.random()*2}px`,backgroundColor:"#fff",borderRadius:"50%",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,opacity:.2+Math.random()*.5,animation:`float ${2+Math.random()*4}s ease-in-out ${Math.random()*2}s infinite`}}/>)}

{/* v6.7.3: Ready-to-begin overlay. Pick a voice, then tap Start.
    Narration won't auto-fire until the user explicitly continues. */}
{!started && <div style={{position:"absolute",inset:0,zIndex:50,background:"rgba(15,23,42,.92)",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
  <div className="gq-fade-in" style={{textAlign:"center",maxWidth:340,width:"100%"}}>
    <div className="gq-float" style={{fontSize:64,marginBottom:16}}>{evo}</div>
    <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,color:"#fff",marginBottom:8}}>Ready to meet {avName}?</h2>
    <p style={{color:"rgba(255,255,255,.55)",fontSize:14,lineHeight:1.5,marginBottom:24}}>Before we begin, take a moment to pick the voice your companion will speak in. You can change it any time.</p>

    <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:14,marginBottom:20}}>
      <VoicePicker
        value={loadCompanionVoice()}
        onChange={(v)=>{saveCompanionVoice(v);pickVoice(v)}}
        variant="dark"
        compact
        previewText={`Hi. I'm ${avName}.`}
      />
    </div>

    <button onClick={()=>{prefetch(dialogue[0]?.text);setStarted(true)}} style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer",width:"100%"}}>Start ✨</button>
  </div>
</div>}

{/* Voice controls */}
<div style={{position:"absolute",top:16,right:16,zIndex:10,display:"flex",gap:6}}>
<button onClick={toggleVoice} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:100,padding:"8px 12px",color:voiceOn?"#fff":"rgba(255,255,255,.4)",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
{voiceOn?"🔊":"🔇"}
</button>
{voiceOn&&<button onClick={()=>setShowVoicePicker(!showVoicePicker)} style={{background:showVoicePicker?"rgba(59,130,246,.3)":"rgba(255,255,255,.1)",border:"none",borderRadius:100,padding:"8px 12px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
🎙️ Voice
</button>}
</div>

{/* Voice picker dropdown */}
{showVoicePicker&&voiceOn&&<div style={{position:"absolute",top:52,right:16,zIndex:20,background:"rgba(30,41,59,.95)",backdropFilter:"blur(12px)",borderRadius:16,padding:12,maxHeight:280,overflowY:"auto",width:220,border:"1px solid rgba(255,255,255,.1)"}}>
<p style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:8,fontWeight:600}}>Choose a voice:</p>
{availableVoices.length===0&&<p style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>Loading voices...</p>}
{availableVoices.map((v,i)=><button key={i} onClick={()=>{pickVoice(v.name);preview(v.name);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 10px",marginBottom:4,borderRadius:10,border:selectedVoice===v.name?"2px solid #3B82F6":"2px solid transparent",background:selectedVoice===v.name?"rgba(59,130,246,.15)":"rgba(255,255,255,.05)",color:"#fff",fontSize:11,cursor:"pointer"}}>
<div style={{fontWeight:600}}>{v.name.replace("Microsoft ","").replace("Google ","")}</div>
<div style={{fontSize:9,color:"rgba(255,255,255,.35)",marginTop:1}}>{v.lang}</div>
</button>)}
<button onClick={()=>setShowVoicePicker(false)} style={{marginTop:6,width:"100%",padding:"6px",border:"none",borderRadius:8,background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.5)",fontSize:11,cursor:"pointer"}}>Done</button>
</div>}

{/* Companion avatar */}
<div style={{position:"relative",marginBottom:16}}>
{showPart&&<><ParticleBurst active={showPart} color="#FFD700"/><SpinningStars active={showPart}/></>}
<div className={typingDone?"gq-float":""} style={{fontSize:72,transition:"transform 0.3s",transform:typingDone?"scale(1)":"scale(1.05)"}}>{evo}</div>
</div>

{/* Speech bubble */}
<div className="gq-fade-in" style={{background:"rgba(255,255,255,.08)",backdropFilter:"blur(8px)",borderRadius:20,padding:"18px 22px",maxWidth:360,width:"100%",marginBottom:20,border:"1px solid rgba(255,255,255,.1)",position:"relative",minHeight:80}}>
{/* Bubble pointer */}
<div style={{position:"absolute",top:-8,left:"50%",marginLeft:-8,width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderBottom:"8px solid rgba(255,255,255,.08)"}}/>
<p style={{fontSize:isEarly?16:15,color:"#fff",lineHeight:1.6,minHeight:48}}>{typing}<span style={{opacity:typingDone?0:1,animation:"pulse 1s ease-in-out infinite"}}>|</span></p>
</div>

{/* Action area — depends on current step */}
<div style={{maxWidth:360,width:"100%"}}>

{/* Simple next button */}
{current.action==="next"&&typingDone&&<button onClick={goNext} className="gq-grow" style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer",boxShadow:"0 4px 20px rgba(59,130,246,.3)"}}>
{current.btnText}
</button>}

{/* Mini quest */}
{current.action==="quest"&&typingDone&&<div className="gq-fade-in" style={{background:"rgba(255,255,255,.06)",borderRadius:16,padding:16,border:"1px solid rgba(255,255,255,.08)"}}>
{isEarly?
  <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
    {["😊","😢","😮","🤔","🥰","💪","😴","🎉"].map((e,i)=>
    <button key={i} onClick={()=>{setSelEmoji(e);setResponse(e);setTimeout(goNext,600)}} style={{fontSize:32,padding:8,borderRadius:14,border:selEmoji===e?"3px solid #3B82F6":"3px solid rgba(255,255,255,.1)",background:selEmoji===e?"rgba(59,130,246,.15)":"rgba(255,255,255,.05)",cursor:"pointer",transition:"all .2s"}}>{e}</button>)}
  </div>
:
  <div>
    <textarea value={response} onChange={e=>setResponse(e.target.value)} placeholder="Type or use the microphone…" rows={3}
      style={{width:"100%",padding:"12px 14px",fontSize:15,border:"2px solid rgba(255,255,255,.1)",borderRadius:12,fontFamily:"'Nunito',sans-serif",resize:"none",lineHeight:1.5,background:"rgba(255,255,255,.05)",color:"#fff"}}/>
    <div style={{marginTop:8}}><VoiceButton onTranscript={t=>setResponse(t)}/></div>
    {response.trim()&&<button onClick={goNext} style={{marginTop:10,fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,padding:"12px 28px",border:"none",borderRadius:100,width:"100%",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer"}}>That's my answer! →</button>}
  </div>
}
</div>}

{/* Reflection */}
{current.action==="reflect"&&typingDone&&<div className="gq-fade-in" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
{reflOptions.map((r,i)=><button key={i} onClick={()=>{setRefl(i);setTimeout(goNext,600)}} style={{padding:13,borderRadius:14,border:refl===i?"3px solid #3B82F6":"3px solid rgba(255,255,255,.08)",background:refl===i?"rgba(59,130,246,.1)":"rgba(255,255,255,.05)",cursor:"pointer",transition:"all .2s"}}>
<div style={{fontSize:28,marginBottom:3}}>{r.e}</div>
<div style={{fontSize:12,fontWeight:600,color:"#fff"}}>{r.l}</div>
</button>)}
</div>}

{/* Finish */}
{current.action==="finish"&&typingDone&&<button onClick={handleFinish} className="gq-grow" style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:"linear-gradient(135deg,#FFD700,#FF8C42)",color:"#fff",cursor:"pointer",boxShadow:"0 4px 20px rgba(245,158,11,.3)"}}>
{current.btnText}
</button>}

</div>

{/* Step dots */}
<div style={{display:"flex",gap:6,marginTop:24}}>
{dialogue.map((_,i)=><div key={i} style={{width:i===step?20:6,height:6,borderRadius:100,background:i<=step?"#3B82F6":"rgba(255,255,255,.15)",transition:"all .3s"}}/>)}
</div>

{/* Skip option for returning users */}
{step<3&&<button onClick={()=>onComplete(0)} style={{marginTop:16,background:"none",border:"none",color:"rgba(255,255,255,.25)",fontSize:11,cursor:"pointer"}}>Skip intro (I've done this before)</button>}

</div>
}


// ── My Story Screen ────────────────────────────────────────────────

function MyStoryScreen({profile,onBack}){
const{name,avatarId,avatarName,story}=profile;
const av=AVATARS.find(a=>a.id===avatarId);
const paragraphs=story?.paragraphs||[];
const PARAS_PER_CHAPTER=5;

// Group into chapters
const chapters=[];
for(let i=0;i<paragraphs.length;i+=PARAS_PER_CHAPTER){
const chapterParas=paragraphs.slice(i,i+PARAS_PER_CHAPTER);
const chapterNum=Math.floor(i/PARAS_PER_CHAPTER)+1;
// Chapter title based on the dominant realm
const realmCounts={};
chapterParas.forEach(p=>{if(p.realm)realmCounts[p.realm]=(realmCounts[p.realm]||0)+1});
const topRealm=Object.entries(realmCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"The Adventure";
const chapterTitles={"Echo Isles":"Voices on the Wind","Wonder Peaks":"The Crystal Path","Heartwood Grove":"Where the Trees Whisper"};
chapters.push({num:chapterNum,title:chapterTitles[topRealm]||topRealm,paragraphs:chapterParas,complete:chapterParas.length>=PARAS_PER_CHAPTER});
}

if(paragraphs.length===0){
return<div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
<button onClick={onBack} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.1)",border:"none",borderRadius:100,padding:"8px 16px",color:"#fff",fontSize:13,cursor:"pointer"}}>← Back</button>
<div style={{fontSize:64,marginBottom:16}}>{av?.emoji||"📖"}</div>
<h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,color:"#fff",textAlign:"center",marginBottom:8}}>Your Story Awaits!</h2>
<p style={{color:"rgba(255,255,255,.5)",fontSize:14,textAlign:"center",maxWidth:300,lineHeight:1.6}}>Complete your first quest and {avatarName} will start writing your very own adventure story!</p>
</div>}

return<div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)",paddingBottom:40}}>
<div style={{padding:"20px 20px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
<button onClick={onBack} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:100,padding:"8px 16px",color:"#fff",fontSize:13,cursor:"pointer"}}>← Back</button>
<span style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"rgba(255,255,255,.3)"}}>{paragraphs.length} pages written</span>
</div>

<div style={{textAlign:"center",padding:"0 20px 24px"}}>
<div style={{fontSize:48,marginBottom:8}}>{av?.emoji||"📖"}</div>
<h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:28,background:"linear-gradient(135deg,#FFD700,#FF8C42)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>The Adventures of {name} & {avatarName}</h1>
<p style={{color:"rgba(255,255,255,.35)",fontSize:12}}>A personal growth story</p>
</div>

{chapters.map((ch,ci)=><div key={ci} style={{margin:"0 20px 20px",background:"rgba(255,255,255,.04)",borderRadius:20,padding:"20px 18px",border:"1px solid rgba(255,255,255,.06)"}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
<span style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:700,color:"#FFD700",background:"rgba(255,215,0,.1)",padding:"4px 12px",borderRadius:100}}>Chapter {ch.num}</span>
<span style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,color:"#fff"}}>{ch.title}</span>
{ch.complete&&<span style={{fontSize:10,color:"#34D399",marginLeft:"auto"}}>✓ Complete</span>}
</div>
{ch.paragraphs.map((p,pi)=><div key={pi} style={{marginBottom:12,paddingLeft:12,borderLeft:"2px solid rgba(255,255,255,.06)"}}>
<p style={{fontSize:14,color:"rgba(255,255,255,.75)",lineHeight:1.7,fontFamily:"Georgia,serif",fontStyle:"italic"}}>{p.text}</p>
<div style={{display:"flex",gap:8,marginTop:4}}>
<span style={{fontSize:9,color:"rgba(255,255,255,.2)"}}>{p.date}</span>
<span style={{fontSize:9,color:"rgba(255,255,255,.15)"}}>·</span>
<span style={{fontSize:9,color:"rgba(255,255,255,.2)"}}>{p.quest}</span>
</div>
</div>)}
{!ch.complete&&<div style={{textAlign:"center",padding:"8px 0"}}>
<p style={{fontSize:11,color:"rgba(255,255,255,.2)",fontStyle:"italic"}}>{PARAS_PER_CHAPTER-ch.paragraphs.length} more quests to complete this chapter...</p>
</div>}
</div>)}

{chapters.length>0&&chapters[chapters.length-1].complete&&<div style={{textAlign:"center",padding:"12px 20px"}}>
<div style={{fontSize:32,marginBottom:8}}>✨</div>
<p style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"rgba(255,255,255,.4)"}}>New chapter begins with your next quest!</p>
</div>}
</div>}


// ── Consent & Privacy Screen ───────────────────────────────────────

function ConsentScreen({onConsent}){
const[expanded,setExpanded]=useState(null);
const[agreed,setAgreed]=useState({data:false,ai:false,age:false});
const[voiceName,setVoiceName]=useState(()=>loadCompanionVoice());
const allAgreed=agreed.data&&agreed.ai&&agreed.age;

const sections=[
{id:"what",title:"What information does GrowQuest collect?",content:"GrowQuest collects your child's first name (or nickname), age group (not exact age), quest responses, self-assessment choices, and competency progress. This information stays on this device unless your child uses voice input or the growth story feature, which use an external service to convert speech to text and generate story paragraphs."},
{id:"voice",title:"How is voice input handled?",content:"When your child uses the microphone to speak an answer, the audio is sent to a transcription service, converted to text, and the audio is immediately discarded. The audio recording is never stored anywhere. Only the transcribed text is kept on this device."},
{id:"story",title:"How does the growth story work?",content:"After each quest, a short story paragraph is generated using your child's first name and their companion character name. No other personal information is sent. The generated story is stored on this device only."},
{id:"stored",title:"Where is data stored?",content:"All progress, preferences, and generated content are stored on this device only (in the browser). Nothing is uploaded to a server or cloud. If you clear your browser data, the progress will be lost."},
{id:"sharing",title:"Who can see my child's data?",content:"Only people with access to this device. If you choose to share progress with a teacher using the Share Progress feature, you will generate a code manually — nothing is sent automatically. Teachers can only see data you explicitly share."},
{id:"ai",title:"How is automated technology used?",content:"GrowQuest uses automated tools for two features: (1) converting speech to text so children can speak instead of type, and (2) generating personalised story paragraphs. These tools assist with engagement only — they do not assess your child, make educational decisions, or create behavioural profiles. All generated reports are drafts intended for teacher review."},
{id:"premium-voice",title:"What about the premium companion voice?",content:"By default, GrowQuest's companion uses a high-quality premium voice (provided by ElevenLabs via a GrowQuest server). When premium voice is on, the companion's spoken text — which can include your child's first name and quest title — is sent to ElevenLabs servers in the United States for speech synthesis. Your child's microphone audio is never sent to ElevenLabs (microphone audio is handled by the separate speech-to-text service). You can turn premium voice off in the Parent Preferences, and the companion will use your device's built-in text-to-speech instead, with no data leaving the device."},
{id:"rights",title:"What are my rights?",content:"You can stop using GrowQuest at any time. You can reset all progress from the Parent dashboard, which permanently deletes all data on this device. You can choose not to use voice input or the story feature — the core quests and self-assessment work without them."},
{id:"contact",title:"Questions or concerns?",content:"Contact peter@ph2oconsult.com with any questions about how GrowQuest handles your child's information."},
];

return<div style={{minHeight:"100vh",background:"linear-gradient(180deg,#F8FAFC,#EFF6FF)",padding:24,display:"flex",flexDirection:"column",alignItems:"center"}}>
<div style={{maxWidth:540,width:"100%"}}>
<div style={{textAlign:"center",marginBottom:24,paddingTop:20}}>
<div style={{fontSize:36,marginBottom:8}}>🔒</div>
<h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:28,color:"#0F172A",marginBottom:8}}>Privacy & Consent</h1>
<p style={{color:"#64748B",fontSize:14,lineHeight:1.6}}>Before your child uses GrowQuest, please review how we handle their information.</p>
</div>

{/* Expandable sections */}
<div style={{marginBottom:20}}>
{sections.map(s=><div key={s.id} style={{marginBottom:6}}>
<button onClick={()=>setExpanded(expanded===s.id?null:s.id)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"#fff",border:"1px solid #E2E8F0",borderRadius:expanded===s.id?"12px 12px 0 0":"12px",cursor:"pointer",textAlign:"left"}}>
<span style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,color:"#334155"}}>{s.title}</span>
<span style={{fontSize:12,color:"#94A3B8",flexShrink:0,marginLeft:8}}>{expanded===s.id?"▲":"▼"}</span>
</button>
{expanded===s.id&&<div style={{padding:"12px 16px",background:"#fff",border:"1px solid #E2E8F0",borderTop:"none",borderRadius:"0 0 12px 12px"}}>
<p style={{fontSize:13,color:"#64748B",lineHeight:1.7,margin:0}}>{s.content}</p>
</div>}
</div>)}
</div>

{/* Voice picker (v6.7.3) — set the companion voice BEFORE any narration starts */}
<div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #E2E8F0",marginBottom:20}}>
<p style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,color:"#0F172A",marginBottom:6}}>Companion voice</p>
<p style={{fontSize:12,color:"#64748B",lineHeight:1.5,marginBottom:14}}>The character that guides your child will speak in this voice. You can change this any time from the dashboard.</p>
<VoicePicker value={voiceName} onChange={(v)=>{setVoiceName(v);saveCompanionVoice(v)}} previewText="Hi! I'm your GrowQuest companion. I'll guide you on your growth journey."/>
</div>

{/* Consent checkboxes */}
<div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #E2E8F0",marginBottom:20}}>
<p style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,color:"#0F172A",marginBottom:14}}>I confirm that:</p>

{[
{key:"data",label:"I have read and understand how GrowQuest collects and uses my child's information"},
{key:"ai",label:"I understand that voice input and story generation use an external automated service, and that audio recordings are not stored"},
{key:"age",label:"I am the parent or guardian of the child who will use this app, or I have authority to provide consent on their behalf"},
].map(c=><label key={c.key} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12,cursor:"pointer"}}>
<input type="checkbox" checked={agreed[c.key]} onChange={()=>setAgreed(a=>({...a,[c.key]:!a[c.key]}))} style={{marginTop:3,width:18,height:18,flexShrink:0,accentColor:"#2563EB"}}/>
<span style={{fontSize:13,color:"#475569",lineHeight:1.5}}>{c.label}</span>
</label>)}
</div>

<button onClick={()=>allAgreed&&onConsent()} disabled={!allAgreed} style={{width:"100%",fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,padding:"16px",border:"none",borderRadius:100,background:allAgreed?"linear-gradient(135deg,#2563EB,#7C3AED)":"#E2E8F0",color:allAgreed?"#fff":"#94A3B8",cursor:allAgreed?"pointer":"default",marginBottom:12}}>
I Agree — Continue to GrowQuest
</button>

<p style={{textAlign:"center",fontSize:11,color:"#94A3B8",lineHeight:1.5}}>You can withdraw consent at any time by resetting progress in the Parent dashboard. This consent applies to this device only.</p>
</div>
</div>}

// ── Main App ───────────────────────────────────────────────────────
export default function GrowQuestBC(){

const[screen,setScreen]=useState("welcome");
const[prof,setProf]=useState(null);const[selComp,setSelComp]=useState(null);const[quest,setQuest]=useState(null);const[parentView,setParentView]=useState(false);const[storyView,setStoryView]=useState(false);const[teacherView,setTeacherView]=useState(false);const[portfolioView,setPortfolioView]=useState(false);const[adultPortfolioView,setAdultPortfolioView]=useState(false);const[consented,setConsented]=useState(()=>{try{return localStorage.getItem("gq_consent")==="true"}catch(e){return false}});const[a11y,setA11y]=useState(()=>loadAccessibility());const[showA11y,setShowA11y]=useState(false);const[theme,setTheme]=useState(()=>{try{return localStorage.getItem("gq_theme")||"dark"}catch(e){return"dark"}});const toggleTheme=()=>{const nt=theme==="dark"?"light":"dark";setTheme(nt);try{localStorage.setItem("gq_theme",nt)}catch(e){}};const isDark=theme==="dark";const[parentUnlocked,setParentUnlocked]=useState(false);const[hasSaved]=useState(()=>!!load());



// Translation helper


// Language selector screen
const initP=()=>{const p={};Object.values(COMPETENCIES).forEach(c=>{Object.keys(c.subCompetencies).forEach(sk=>{p[sk]={profile:1,stars:0,questsCompleted:0,questHistory:[]}})});return p};
useEffect(()=>{applyAccessibility(a11y)},[a11y]);
useEffect(()=>{if(prof)save(prof)},[prof]);

// Re-lock the parent area when the tab becomes hidden for 2+ minutes.
// Prevents a parent unlocking on a shared device and the child returning later.
useEffect(()=>{
  let hiddenAt=null;
  const onVis=()=>{
    if(document.hidden){hiddenAt=Date.now()}
    else if(hiddenAt&&Date.now()-hiddenAt>120000){setParentUnlocked(false);hiddenAt=null}
    else{hiddenAt=null}
  };
  document.addEventListener("visibilitychange",onVis);
  return()=>document.removeEventListener("visibilitychange",onVis);
},[]);
const welc=a=>{if(a==="continue"){const s=load();if(s){setProf(s);setScreen("dashboard");return}}setScreen("onboard")};
const onboard=({name,ageGroup})=>{setProf({name,ageGroup,avatarId:null,avatarName:null,progress:initP(),streak:0,lastQuestDate:null,onboarded:false,story:{paragraphs:[],chapters:[]}});setScreen("avatar")};
const avDone=({avatarId,avatarName})=>{setProf(p=>({...p,avatarId,avatarName}));setScreen("guided")};
const guidedDone=(stars)=>{
  if(stars>0){setProf(p=>{const np={...p.progress};const sub="positiveIdentity";if(np[sub]){const r=checkProfileUp(np[sub].stars,stars,np[sub].profile);np[sub]={...np[sub],stars:r.rem,profile:r.newProf,questsCompleted:np[sub].questsCompleted+1,questHistory:[...np[sub].questHistory,{title:"First Quest",date:new Date().toLocaleDateString("en-CA"),stars}].slice(-20)}}return{...p,progress:np,onboarded:true,streak:1,lastQuestDate:new Date().toDateString()}})}
  else{setProf(p=>({...p,onboarded:true}))}
  setScreen("dashboard");
};
const qDone=arg=>{
  // v6.8: arg can be a number (legacy) OR an object with stars + artifact data.
  // Backward compatible — onboarding guidedDone still passes a number.
  const isObj = arg !== null && typeof arg === "object";
  const stars = isObj ? (arg.stars || 0) : arg;
  const histEntry = isObj
    ? {
        title: quest.title,
        date: new Date().toLocaleDateString("en-CA"),
        stars,
        // v6.8 artifact fields — optional, all may be null/empty
        response: arg.response || "",
        responseType: arg.responseType || quest.inputType || "text",
        reflection: arg.reflection || null,
        reflectionDepth: arg.reflectionDepth || "surface",
        reflectionText: arg.reflectionText || null, // v6.8: curriculum-language reflection
        selfAssessedLevel: arg.selfAssessedLevel || null,
        questId: arg.questId || quest.id,
      }
    : { title: quest.title, date: new Date().toLocaleDateString("en-CA"), stars };

  if(quest){setProf(p=>{const np={...p.progress};const sub=quest.sub;if(np[sub]){const r=checkProfileUp(np[sub].stars,stars,np[sub].profile);const hist=np[sub].questHistory||[];hist.push(histEntry);np[sub]={...np[sub],stars:r.rem,profile:r.newProf,questsCompleted:np[sub].questsCompleted+1,questHistory:hist.slice(-20)}}if(quest.alsoTouches)quest.alsoTouches.forEach(t=>{if(np[t]){const b=Math.max(1,Math.floor(stars*.3)),cr=checkProfileUp(np[t].stars,b,np[t].profile);np[t]={...np[t],stars:cr.rem,profile:cr.newProf}}});const td=new Date().toDateString();const wt=p.lastQuestDate===td;const wy=p.lastQuestDate===new Date(Date.now()-86400000).toDateString();return{...p,progress:np,streak:wt?p.streak:(wy?p.streak+1:1),lastQuestDate:td}})}
  // Generate story paragraph in background
if(quest){
const storyData={childName:prof?.name,companionName:prof?.avatarName,companionType:AVATARS.find(a=>a.id===prof?.avatarId)?.name||"companion",questTitle:quest.title,questResponse:histEntry.response||"",competency:Object.entries(COMPETENCIES).find(([k,c])=>c.subCompetencies[quest.sub])?.[1]?.name||"",subCompetency:Object.values(COMPETENCIES).flatMap(c=>Object.entries(c.subCompetencies)).find(([k])=>k===quest.sub)?.[1]?.name||"",realm:Object.entries(COMPETENCIES).find(([k,c])=>c.subCompetencies[quest.sub])?.[1]?.realm||"",ageGroup:prof?.ageGroup||"primary",chapterNumber:Math.floor((prof?.story?.paragraphs?.length||0)/5)+1,previousParagraphs:(prof?.story?.paragraphs||[]).slice(-3).map(p=>p.text)};
fetch("/api/story",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(storyData)}).then(r=>r.json()).then(data=>{if(data.paragraph){setProf(p=>{const newParas=[...(p.story?.paragraphs||[]),{text:data.paragraph,quest:quest.title,realm:storyData.realm,date:new Date().toLocaleDateString("en-CA"),competency:storyData.competency}];return{...p,story:{...p.story,paragraphs:newParas}}})}}).catch(e=>console.error("Story gen error:",e));}
setQuest(null);setSelComp(null);setScreen("dashboard");};
if(!consented)return<ConsentScreen onConsent={()=>{try{localStorage.setItem("gq_consent","true")}catch(e){};setConsented(true)}}/>;
if(screen==="welcome")return<WelcomeScreen onStart={welc} hasSaved={hasSaved} lang="en" t={(s)=>T[s]?.en||T[s]?.en||{}} onTeacherView={()=>setTeacherView(true)}/>;
if(screen==="onboard")return<OnboardingScreen onComplete={onboard} lang="en" t={(s)=>T[s]?.en||T[s]?.en||{}}/>;
if(screen==="avatar")return<AvatarScreen userName={prof?.name} onComplete={avDone}/>;
if(screen==="guided")return<GuidedOnboarding profile={prof} onComplete={guidedDone}/>;
if(teacherView&&!parentUnlocked)return<ParentPinGate onUnlock={()=>setParentUnlocked(true)} onBack={()=>{setTeacherView(false);setParentUnlocked(false)}}/>;
if(teacherView&&parentUnlocked)return<TeacherDashboard onBack={()=>{setTeacherView(false);setParentUnlocked(false)}}/>;
if(storyView)return<MyStoryScreen profile={prof} onBack={()=>setStoryView(false)}/>;
if(portfolioView){
  // v6.7.17: route to age-appropriate child view.
  const av=AVATARS.find(a=>a.id===prof?.avatarId);
  const lv=getAvLv(prof?.progress||{});
  const evo=av?.evolutions?.[lv-1]||av?.emoji;
  const data=buildPortfolioData(prof,COMPETENCIES,{avatarEvolution:evo});
  return<ChildProfileRouter data={data} onBack={()=>setPortfolioView(false)} onSpeak={(text)=>speakWithPremiumFallback(text,{rate:0.85,pitch:1.1})}/>;
}
if(adultPortfolioView){
  // v6.7.17: adult assessment view, reachable only from Parent Dashboard.
  const av=AVATARS.find(a=>a.id===prof?.avatarId);
  const lv=getAvLv(prof?.progress||{});
  const evo=av?.evolutions?.[lv-1]||av?.emoji;
  const data=buildPortfolioData(prof,COMPETENCIES,{avatarEvolution:evo});
  return<GrowthProfileView data={data} onBack={()=>setAdultPortfolioView(false)}/>;
}
if(parentView&&!parentUnlocked)return<ParentPinGate onUnlock={()=>setParentUnlocked(true)} onBack={()=>{setParentView(false);setParentUnlocked(false)}}/>;
if(parentView&&parentUnlocked)return<>{showA11y&&<AccessibilityPanel settings={a11y} onChange={setA11y} onClose={()=>setShowA11y(false)}/>}<ParentDashboard profile={prof} onBack={()=>{setParentView(false);setParentUnlocked(false)}} theme={theme} onToggleTheme={toggleTheme} onOpenAccessibility={()=>setShowA11y(true)} onViewAdultPortfolio={()=>setAdultPortfolioView(true)}/></>;
if(quest)return<QuestScreen quest={quest} profile={prof} onComplete={qDone} onBack={()=>setQuest(null)} a11y={a11y}/>;
if(selComp)return<CompDetailScreen compKey={selComp} profile={prof} onBack={()=>setSelComp(null)} onStartQuest={q=>setQuest(q)}/>;
return<>{showA11y&&<AccessibilityPanel settings={a11y} onChange={setA11y} onClose={()=>setShowA11y(false)}/>}<DashboardScreen profile={prof} onSelectComp={k=>setSelComp(k)} onStartQuest={q=>setQuest(q)} onParentView={()=>setParentView(true)} onViewStory={()=>setStoryView(true)} onViewPortfolio={()=>setPortfolioView(true)} isDark={isDark} onToggleTheme={toggleTheme} onShowA11y={()=>setShowA11y(true)} a11y={a11y}/></>;}
