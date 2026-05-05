import { useState, useEffect, useRef } from "react";
import T from "./data/translations.js";
import { generateCertificate } from "./certificates/generateCertificate.js";
import { generateUserManual } from "./certificates/generateManual.js";


// ═══════════════════════════════════════════════════════════════════
// GROWQUEST BC v3 — User Feedback Build
// 1. Kid-friendly "I can…" translations (kidProfiles)
// 2. Growth Stars (not XP) with clear breakdown
// 3. localStorage session persistence
// 4. Age-adapted quests (Early=emoji/voice/drawing, Primary=guided, Intermediate=reflective)
// 5. Voice-to-text via Web Speech API
// ═══════════════════════════════════════════════════════════════════

const COMPETENCIES={communication:{name:"Communication",color:"#2563EB",colorLight:"#DBEAFE",gradient:"linear-gradient(135deg,#3B82F6,#1D4ED8)",icon:"💬",realm:"Echo Isles",subCompetencies:{communicating:{name:"Communicating",profiles:["I respond meaningfully to communication from peers and adults.","I talk and listen to people I know. I can communicate for a purpose.","I communicate purposefully, using forms and strategies I have practiced.","I communicate clearly and purposefully, using a variety of forms appropriately.","I communicate confidently, showing attention to my audience and purpose.","I communicate with intentional impact, in well-constructed forms."],kidProfiles:["I can listen and show people I understand them.","I can talk and listen to people I know to share ideas.","I can share my ideas using ways I've learned and practiced.","I can explain things clearly using different ways like talking, writing, or drawing.","I think about who I'm talking to and choose the best way to share my message.","I can share powerful messages that make a real difference."]},collaborating:{name:"Working Together",profiles:["I can participate with others in familiar situations.","I cooperate with others for specific purposes.","I contribute during group activities and share roles and responsibilities.","I can confidently interact and build relationships to further shared goals.","I can facilitate group processes and encourage collective responsibility.","I can connect my group with broader networks for various purposes."],kidProfiles:["I can join in when I'm with people I know.","I can work with others to get things done.","I do my part in group work and help share the jobs.","I work well with others and help us reach our goals together.","I can help lead a group and make sure everyone is included.","I can bring different groups together to do bigger things."]}}},thinking:{name:"Thinking",color:"#7C3AED",colorLight:"#EDE9FE",gradient:"linear-gradient(135deg,#8B5CF6,#6D28D9)",icon:"🧠",realm:"Wonder Peaks",subCompetencies:{creativeThinking:{name:"Creative Thinking",profiles:["I get ideas when I play.","I can get new ideas or build on others' ideas to create new things.","I can get new ideas in areas I'm interested in and build skills to make them work.","I can get new ideas or reinterpret others' ideas in novel ways.","I can think outside the box and persevere to develop innovative ideas.","I can develop a body of creative work over time in an area of passion."],kidProfiles:["I get ideas when I play and explore!","I can come up with new ideas or add to someone else's idea.","I get creative ideas about things I care about and work to make them real.","I can take ideas and twist them into something totally new and different.","I keep going even when it's hard, and I come up with things nobody thought of before.","I keep creating amazing things about something I really love."]},criticalThinking:{name:"Thinking It Through",profiles:["I can explore materials and actions.","I can use evidence to make simple judgments.","I can ask questions and consider options using observation and imagination.","I can combine new evidence with what I know to develop reasoned conclusions.","I can evaluate well-chosen evidence to identify alternatives and implications.","I can examine evidence from various perspectives to analyze complex issues."],kidProfiles:["I like to explore and try things out.","I can look at clues to figure things out.","I ask good questions and think about different answers.","I can put together what I already know with new things I learn.","I look carefully at information to see what's really going on.","I can look at tricky problems from lots of different sides."]}}},personalSocial:{name:"Personal & Social",color:"#059669",colorLight:"#D1FAE5",gradient:"linear-gradient(135deg,#10B981,#047857)",icon:"🌱",realm:"Heartwood Grove",subCompetencies:{positiveIdentity:{name:"Knowing Myself",profiles:["I am aware of myself as different from others.","I am aware of different aspects of myself.","I can describe different aspects of my identity.","I have pride in who I am. I am part of larger communities.","I understand that my identity is influenced by many aspects of my life.","I can identify how my life experiences have contributed to who I am."],kidProfiles:["I know I am my own person, different from everyone else.","I know there are lots of parts that make me, me!","I can tell you about what makes me special and unique.","I'm proud of who I am and I belong to communities that matter.","I understand that my family, culture, and experiences all shape who I am.","I can see how all my experiences have helped me become who I am today."]},personalAwareness:{name:"Taking Care of Myself",profiles:["I can show joy and express some wants, needs, and preferences.","I can seek out experiences that make me feel happy and proud.","I can make choices that help me meet my needs and increase my well-being.","I can recognize my strengths and use strategies to manage stress and reach goals.","I recognize my value and take responsibility for my choices and achievements.","I can find internal motivation and act on opportunities for self-growth."],kidProfiles:["I can show when I'm happy and tell people what I want or need.","I look for things that make me feel happy and proud of myself.","I make choices that are good for me and help me feel well.","I know what I'm good at and I have ways to handle tough feelings.","I know I matter, and I take charge of my choices.","I push myself to grow because I want to, not just because someone tells me."]},socialAwareness:{name:"Caring for Others",profiles:["I can be aware of others and my surroundings.","I can interact with others and my surroundings respectfully.","I can interact with others and the environment respectfully and thoughtfully.","I can take purposeful action to support others and the environment.","I can advocate and take action for my communities and the natural world.","I can initiate positive, sustainable change for others and the environment."],kidProfiles:["I notice the people and world around me.","I treat people and the world around me with respect.","I'm thoughtful about how I treat people and take care of the world.","I do things on purpose to help others and take care of nature.","I stand up for my community and the natural world and take action to help.","I start projects that make a lasting positive difference for others and the planet."]}}}};

const AVATARS=[{id:"owl",emoji:"🦉",name:"Wise Owl",desc:"Curious and thoughtful",evolutions:["🥚","🐣","🐥","🦉","🦉","🦉"]},{id:"fox",emoji:"🦊",name:"Clever Fox",desc:"Creative and quick",evolutions:["🥚","🐣","🐥","🦊","🦊","🦊"]},{id:"bear",emoji:"🐻",name:"Kind Bear",desc:"Strong and caring",evolutions:["🥚","🐣","🐥","🐻","🐻","🐻"]},{id:"dolphin",emoji:"🐬",name:"Bright Dolphin",desc:"Playful and social",evolutions:["🥚","🐣","🐥","🐬","🐬","🐬"]},{id:"eagle",emoji:"🦅",name:"Bold Eagle",desc:"Brave and focused",evolutions:["🥚","🐣","🐥","🦅","🦅","🦅"]},{id:"deer",emoji:"🦌",name:"Gentle Deer",desc:"Calm and aware",evolutions:["🥚","🐣","🐥","🦌","🦌","🦌"]},{id:"orca",emoji:"🐋",name:"Team Orca",desc:"A leader and friend",evolutions:["🥚","🐣","🐥","🐋","🐋","🐋"]},{id:"raven",emoji:"🪶",name:"Story Raven",desc:"Wise storyteller",evolutions:["🥚","🐣","🐥","🪶","🪶","🪶"]}];
const EVOLUTION_TITLES=["Egg","Hatchling","Fledgling","Explorer","Champion","Legend"];
const AGE_GROUPS=[{id:"early",label:"Early Years",range:"Ages 4–6",emoji:"🌟"},{id:"primary",label:"Primary",range:"Ages 6–9",emoji:"🚀"},{id:"intermediate",label:"Intermediate",range:"Ages 9–12",emoji:"⚡"}];

// Age-adapted quests
const QUESTS={communication:{early:[{id:"ce1",title:"Feelings Show",desc:"Pick the emoji that shows how you feel right now!",sub:"communicating",difficulty:"easy",profile:1,minutes:3,icon:"😊",inputType:"emoji"},{id:"ce2",title:"My Favourite Thing",desc:"Draw your favourite thing, then tell someone about it!",sub:"communicating",difficulty:"easy",profile:2,minutes:5,icon:"🖍️",inputType:"drawing"},{id:"ce3",title:"Helping Hands",desc:"Show someone how to do something you're good at.",sub:"collaborating",difficulty:"easy",profile:2,minutes:5,icon:"🤝",inputType:"emoji"},{id:"ce4",title:"Story Time",desc:"Tell a story about your favourite animal. Use your voice!",sub:"communicating",difficulty:"medium",profile:2,minutes:5,icon:"🎤",inputType:"voice"}],primary:[{id:"cp1",title:"Story Spark",desc:"Tell a short story about your favourite place. What makes it special?",sub:"communicating",alsoTouches:["positiveIdentity"],difficulty:"easy",profile:2,minutes:8,icon:"🎙️",inputType:"voice"},{id:"cp2",title:"Team Builders",desc:"Plan a pretend party with someone. Decide who does what!",sub:"collaborating",difficulty:"medium",profile:3,minutes:10,icon:"🎉",inputType:"text"},{id:"cp3",title:"Picture Words",desc:"Draw something, then explain it so someone else could draw it too.",sub:"communicating",alsoTouches:["creativeThinking"],difficulty:"medium",profile:3,minutes:12,icon:"🎨",inputType:"voice"},{id:"cp4",title:"Question Master",desc:"Listen to someone's story and ask 3 really good questions about it.",sub:"communicating",alsoTouches:["socialAwareness"],difficulty:"medium",profile:4,minutes:8,icon:"🔎",inputType:"text"}],intermediate:[{id:"ci1",title:"Audience Switch",desc:"Explain the same topic two ways: once for a little kid, once for a grown-up.",sub:"communicating",difficulty:"hard",profile:5,minutes:12,icon:"🎭",inputType:"text"},{id:"ci2",title:"Bridge Builder",desc:"Think of a time people disagreed. How could you find a solution using everyone's best ideas?",sub:"collaborating",alsoTouches:["criticalThinking"],difficulty:"hard",profile:5,minutes:15,icon:"🌉",inputType:"text"},{id:"ci3",title:"Debate Coach",desc:"Pick a topic you care about. Write the best argument FOR it, then AGAINST it.",sub:"communicating",alsoTouches:["criticalThinking"],difficulty:"hard",profile:5,minutes:15,icon:"⚡",inputType:"text"},{id:"ci4",title:"Teach It",desc:"Choose something you know well. Create a mini-lesson for someone younger.",sub:"communicating",alsoTouches:["collaborating"],difficulty:"hard",profile:4,minutes:12,icon:"📚",inputType:"text"}]},thinking:{early:[{id:"te1",title:"What Is It?",desc:"Look at a spoon. What ELSE could it be? A tiny shovel? A drum stick? Think of 3 silly ideas!",sub:"creativeThinking",difficulty:"easy",profile:1,minutes:3,icon:"🥄",inputType:"voice"},{id:"te2",title:"Which One?",desc:"Which shape doesn't belong? Why do you think so?",sub:"criticalThinking",difficulty:"easy",profile:2,minutes:3,icon:"🔷",inputType:"emoji"},{id:"te3",title:"Dream House",desc:"Draw your dream treehouse. What cool things would it have?",sub:"creativeThinking",difficulty:"easy",profile:2,minutes:5,icon:"🏠",inputType:"drawing"},{id:"te4",title:"Find the Match",desc:"Find two things in your room that are the same colour. Now two that are the same shape!",sub:"criticalThinking",difficulty:"easy",profile:2,minutes:5,icon:"🔍",inputType:"voice"}],primary:[{id:"tp1",title:"What If?",desc:"Pick any everyday object and invent 5 wild new uses for it!",sub:"creativeThinking",difficulty:"easy",profile:2,minutes:7,icon:"💡",inputType:"voice"},{id:"tp2",title:"Mystery Box",desc:"Use 3 clues to guess what's inside a mystery box. Explain why!",sub:"criticalThinking",difficulty:"medium",profile:3,minutes:10,icon:"🔍",inputType:"text"},{id:"tp3",title:"Remix Lab",desc:"Pick two things that don't go together. Invent something that combines them!",sub:"creativeThinking",alsoTouches:["communicating"],difficulty:"medium",profile:4,minutes:12,icon:"🧪",inputType:"text"},{id:"tp4",title:"True or Tricky?",desc:"'Cats are better than dogs.' Is that a fact or an opinion? How can you tell?",sub:"criticalThinking",difficulty:"medium",profile:3,minutes:8,icon:"🤔",inputType:"text"}],intermediate:[{id:"ti1",title:"Invention Studio",desc:"Think of a problem at home or school. Design something that could fix it.",sub:"creativeThinking",alsoTouches:["personalAwareness"],difficulty:"hard",profile:5,minutes:15,icon:"🛠️",inputType:"text"},{id:"ti2",title:"Two Sides",desc:"Pick a topic where people disagree. Write the best case for EACH side.",sub:"criticalThinking",alsoTouches:["socialAwareness"],difficulty:"hard",profile:5,minutes:15,icon:"⚖️",inputType:"text"},{id:"ti3",title:"Future Thinker",desc:"If you could change one school rule, what would it be? What might happen — good and bad?",sub:"criticalThinking",difficulty:"hard",profile:4,minutes:12,icon:"🔮",inputType:"text"},{id:"ti4",title:"Mash-Up Master",desc:"Combine two school subjects into one new one. What would students learn?",sub:"creativeThinking",difficulty:"hard",profile:4,minutes:12,icon:"🎯",inputType:"text"}]},personalSocial:{early:[{id:"pe1",title:"How Do I Feel?",desc:"Pick the face that shows how you feel right now!",sub:"personalAwareness",difficulty:"easy",profile:1,minutes:3,icon:"🪞",inputType:"emoji"},{id:"pe2",title:"I Am Special",desc:"What are you really good at? Draw it or tell us!",sub:"positiveIdentity",difficulty:"easy",profile:2,minutes:5,icon:"⭐",inputType:"drawing"},{id:"pe3",title:"Calm Cloud",desc:"Breathe in (1-2-3-4), out (1-2-3-4). How does your body feel now?",sub:"personalAwareness",difficulty:"easy",profile:2,minutes:3,icon:"☁️",inputType:"emoji"},{id:"pe4",title:"Kind Helper",desc:"Think of something nice you did for someone. How did it make you feel?",sub:"socialAwareness",alsoTouches:["personalAwareness"],difficulty:"easy",profile:2,minutes:3,icon:"💛",inputType:"emoji"}],primary:[{id:"pp1",title:"My Superpower",desc:"Everyone has something special. What's YOUR superpower?",sub:"positiveIdentity",difficulty:"easy",profile:3,minutes:8,icon:"✨",inputType:"voice"},{id:"pp2",title:"Feelings Weather",desc:"If your feelings were weather today, what would it be? Sunny? Stormy? Why?",sub:"personalAwareness",difficulty:"easy",profile:2,minutes:5,icon:"🌤️",inputType:"voice"},{id:"pp3",title:"Kindness Quest",desc:"Do something kind today. How did it feel for you? How do you think THEY felt?",sub:"socialAwareness",alsoTouches:["personalAwareness"],difficulty:"medium",profile:3,minutes:10,icon:"💛",inputType:"text"},{id:"pp4",title:"My Story Map",desc:"Draw a map of important places, people, and memories that make you who you are.",sub:"positiveIdentity",alsoTouches:["communicating"],difficulty:"medium",profile:4,minutes:12,icon:"🗺️",inputType:"drawing"}],intermediate:[{id:"pi1",title:"Goal Climber",desc:"Set one goal for this week. Break it into 3 steps. What could get in the way?",sub:"personalAwareness",difficulty:"hard",profile:4,minutes:10,icon:"🏔️",inputType:"text"},{id:"pi2",title:"Community Lens",desc:"Notice something in your community that could be better. What's one thing you could do?",sub:"socialAwareness",alsoTouches:["criticalThinking"],difficulty:"hard",profile:5,minutes:15,icon:"🌍",inputType:"text"},{id:"pi3",title:"Identity Web",desc:"What parts of your life have shaped who you are? How do they connect?",sub:"positiveIdentity",difficulty:"hard",profile:5,minutes:12,icon:"🕸️",inputType:"text"},{id:"pi4",title:"Stress Toolkit",desc:"What are 3 things that help you when you're stressed? Why do they work?",sub:"personalAwareness",difficulty:"medium",profile:4,minutes:8,icon:"🧰",inputType:"text"}]}};

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

// Voice input — chunked streaming: sends audio every 3s for progressive text on iOS
function useVoice(){
const[on,setOn]=useState(false);const[txt,setTxt]=useState("");const[busy,setBusy]=useState(false);const[err,setErr]=useState("");
const mediaRef=useRef(null);const streamRef=useRef(null);const intervalRef=useRef(null);
const allChunksRef=useRef([]);const mimeRef=useRef("");const txtRef=useRef("");

const sendChunk=async(chunks,isFinal)=>{
if(chunks.length===0)return;
try{
const blob=new Blob(chunks,{type:mimeRef.current});
const reader=new FileReader();
const base64=await new Promise((res,rej)=>{reader.onload=()=>res(reader.result.split(",")[1]);reader.onerror=rej;reader.readAsDataURL(blob)});
const resp=await fetch("/api/transcribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({audio:base64,mimeType:mimeRef.current})});
const data=await resp.json();
if(data.transcript){txtRef.current=data.transcript;setTxt(data.transcript)}
else if(isFinal&&data.error)setErr((data.error||"Failed")+(data.debug?" ["+data.debug+"]":""));
}catch(e){if(isFinal){setErr("Could not transcribe");console.error(e)}}
if(isFinal)setBusy(false)};

const start=async()=>{
try{setErr("");setTxt("");txtRef.current="";allChunksRef.current=[];
const stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream;
const mimeType=MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?"audio/webm;codecs=opus":MediaRecorder.isTypeSupported("audio/mp4")?"audio/mp4":"audio/webm";
mimeRef.current=mimeType;
const mr=new MediaRecorder(stream,{mimeType});
mr.ondataavailable=e=>{if(e.data.size>0)allChunksRef.current.push(e.data)};

// Send accumulated audio every 3 seconds for progressive transcription
intervalRef.current=setInterval(()=>{
if(allChunksRef.current.length>0){
const snapshot=[...allChunksRef.current];
sendChunk(snapshot,false)}
},3000);

mr.onstop=async()=>{
clearInterval(intervalRef.current);intervalRef.current=null;
stream.getTracks().forEach(t=>t.stop());
if(allChunksRef.current.length===0){setOn(false);return}
setBusy(true);
// Final transcription of full audio
sendChunk([...allChunksRef.current],true);
setOn(false)};

mr.start(1000);mediaRef.current=mr;setOn(true)}
catch(e){setErr("Microphone not available");console.error(e)}};

const stop=()=>{if(intervalRef.current){clearInterval(intervalRef.current);intervalRef.current=null}
if(mediaRef.current&&on){mediaRef.current.stop();mediaRef.current=null}};
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
const handleCert=()=>{try{generateCertificate({childName:childName||"Adventurer",subCompetencyKey:subKey,profileLevel:newProfile,profileText,evidenceSummary:{questTitles:questsCompleted||[],contexts:["solo","with_family"],reflections:[],evidenceCount:questsCompleted?.length||0},dateEarned:new Date().toLocaleDateString("en-CA"),avatarName});setCertDone(true)}catch(e){console.error("Certificate error:",e)}};
return<div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.88)",backdropFilter:"blur(16px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,overflowY:"auto"}}><ConfettiBlast active={ph>=1}/><div style={{position:"relative",marginBottom:20}}><ExpandingRings active={ph>=1} color={compColor}/><ParticleBurst active={ph>=1} color={compColor}/><SpinningStars active={ph>=1}/><div style={{fontSize:80,lineHeight:1,position:"relative",zIndex:10,animation:ph>=1?"avatar-evolve 1.2s ease-out":"none"}}>{ev}</div></div>{ph>=1&&<div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"rgba(255,255,255,.5)",textAlign:"center",marginBottom:8}}>{EVOLUTION_TITLES[newProfile-1]}</div>}{ph>=2&&<div style={{animation:"badge-stamp .6s ease-out forwards",background:`linear-gradient(135deg,${compColor},${compColor}CC)`,borderRadius:20,padding:"8px 20px",marginBottom:14}}><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:700,color:"#fff"}}>⭐ Level {newProfile} Unlocked!</span></div>}{ph>=2&&<h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",textAlign:"center",marginBottom:6,animation:"fadeSlideUp .5s ease-out forwards"}}>{subName}</h2>}{ph>=3&&<><div style={{animation:"fadeSlideUp .5s ease-out forwards",background:"rgba(255,255,255,.07)",borderRadius:16,padding:"14px 18px",maxWidth:340,textAlign:"center",marginBottom:20,border:`1px solid ${compColor}30`}}><p style={{fontSize:10,color:compColor,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>What I can do now</p><p style={{fontSize:15,color:"#fff",lineHeight:1.5}}>"{profileText}"</p></div><button onClick={handleCert} style={{animation:"fadeSlideUp .4s ease-out .1s both",fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600,padding:"12px 32px",border:"2px solid rgba(255,255,255,.2)",borderRadius:100,background:certDone?"rgba(16,185,129,.2)":"transparent",color:certDone?"#34D399":"#fff",cursor:"pointer",marginBottom:10,width:"100%",maxWidth:300}}>{certDone?"Certificate Downloaded! ✓":"📄 Download My Certificate"}</button><button onClick={onDone} style={{animation:"fadeSlideUp .4s ease-out .2s both",fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 40px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#FFD700,#FF8C42)",color:"#fff",cursor:"pointer",width:"100%",maxWidth:300}}>Awesome! Continue →</button></>}</div>}

function ProgressRing({progress,size=64,strokeWidth=5,color="#3B82F6",children}){const r=(size-strokeWidth)/2,c=2*Math.PI*r,o=c-(progress/100)*c;return<div style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><svg width={size} height={size} style={{position:"absolute",transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={strokeWidth}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{transition:"stroke-dashoffset .8s ease-out"}}/></svg>{children}</div>}

function VoiceButton({onTranscript}){const{on,txt,busy,err,toggle}=useVoice();const prevTxt=useRef("");
useEffect(()=>{if(txt&&txt!==prevTxt.current){prevTxt.current=txt;onTranscript(txt)}},[txt]);
return<div>
<button onClick={toggle} disabled={busy} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",border:on?"2px solid #EF4444":busy?"2px solid #F59E0B":"2px solid #E2E8F0",borderRadius:100,background:on?"#FEF2F2":busy?"#FFFBEB":"#fff",cursor:busy?"wait":"pointer",fontSize:13,fontWeight:600,color:on?"#EF4444":busy?"#B45309":"#64748B",animation:on?"mic-pulse 1.5s ease-in-out infinite":"none"}}>
<span style={{fontSize:18}}>{on?"🔴":busy?"⏳":"🎤"}</span>
{on?"Recording… tap to stop":busy?"Finishing up…":"Tap to talk"}
</button>
{on&&txt&&<p style={{fontSize:12,color:"#3B82F6",marginTop:6,fontStyle:"italic",lineHeight:1.4}}>"{txt}"</p>}
{err&&<p style={{fontSize:11,color:"#EF4444",marginTop:4}}>{err}</p>}
</div>}

function EmojiPicker({selected,onSelect,label}){const opts=["😊","😢","😠","😮","🤔","😴","🥰","💪"];return<div>{label&&<p style={{fontSize:14,color:"#475569",marginBottom:10,textAlign:"center"}}>{label}</p>}<div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{opts.map((e,i)=><button key={i} onClick={()=>onSelect(e)} style={{fontSize:32,padding:8,borderRadius:14,border:selected===e?"3px solid #3B82F6":"3px solid #E2E8F0",background:selected===e?"#EFF6FF":"#fff",cursor:"pointer",transition:"all .2s",transform:selected===e?"scale(1.15)":"scale(1)"}}>{e}</button>)}</div></div>}

function StarsExplainer({isEarly}){return<div style={{background:"rgba(255,255,255,.06)",borderRadius:14,padding:14,border:"1px solid rgba(255,255,255,.08)",marginTop:8}}><p style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#FFD700",marginBottom:8}}>⭐ How Growth Stars Work</p><div style={{fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.6}}>{isEarly?<><p>You earn stars every time you try a quest!</p><p style={{marginTop:4}}>⭐⭐ for trying · ⭐⭐⭐ for thinking about it · ⭐⭐⭐⭐⭐ for tricky ones</p><p style={{marginTop:4}}>Collect enough stars and your guide grows!</p></>:<><p>Stars show how you're growing. You earn them by:</p><p style={{marginTop:4}}>Completing quests (⭐⭐–⭐⭐⭐⭐⭐) · Reflecting on what you learned (+⭐⭐⭐) · Checking your own growth (+⭐)</p><p style={{marginTop:4}}>Collect enough stars in an area and you reach the next level!</p></>}</div></div>}

// ── SCREENS ────────────────────────────────────────────────────────

function WelcomeScreen({onStart,hasSaved,lang,t,onChangeLang}){const w=t("welcome");return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#0F172A 0%,#1E293B 30%,#1E3A5F 60%,#0F172A 100%)",position:"relative",overflow:"hidden",padding:24}}>{Array.from({length:35},(_,i)=><div key={i} style={{position:"absolute",width:`${1+Math.random()*3}px`,height:`${1+Math.random()*3}px`,backgroundColor:"#fff",borderRadius:"50%",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,opacity:.3+Math.random()*.7,animation:`float ${2+Math.random()*4}s ease-in-out ${Math.random()*2}s infinite`}}/>)}<div style={{position:"absolute",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,.15),transparent 70%)",top:"10%",left:"-5%",filter:"blur(40px)"}}/><button onClick={onChangeLang} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.1)",border:"none",borderRadius:100,padding:"6px 12px",color:"rgba(255,255,255,.5)",fontSize:11,cursor:"pointer",zIndex:10}}>{lang==="fr"?"🇫🇷 FR":"🇬🇧 EN"}</button><div className="gq-fade-in" style={{textAlign:"center",zIndex:1}}><div className="gq-float" style={{fontSize:72,marginBottom:16}}>🌿</div><h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:"clamp(36px,8vw,52px)",fontWeight:700,background:"linear-gradient(135deg,#60A5FA,#A78BFA,#34D399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.1,marginBottom:8}}>GrowQuest<span style={{fontSize:".6em",verticalAlign:"super"}}>BC</span></h1><p style={{color:"rgba(255,255,255,.55)",fontSize:14,fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:32}}>{w.tagline}</p><p style={{color:"rgba(255,255,255,.35)",fontSize:14,maxWidth:300,margin:"0 auto 32px",lineHeight:1.6}}>{w.desc}</p>{hasSaved&&<button onClick={()=>onStart("continue")} style={{fontFamily:"'Fredoka',sans-serif",fontSize:20,fontWeight:600,padding:"16px 48px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer",boxShadow:"0 4px 24px rgba(59,130,246,.4)",marginBottom:12,width:"100%",maxWidth:280}}>{w.continue}</button>}<button onClick={()=>onStart("new")} style={{fontFamily:"'Fredoka',sans-serif",fontSize:hasSaved?16:20,fontWeight:600,padding:hasSaved?"12px 36px":"16px 48px",border:hasSaved?"2px solid rgba(255,255,255,.15)":"none",borderRadius:100,background:hasSaved?"transparent":"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer",boxShadow:hasSaved?"none":"0 4px 24px rgba(59,130,246,.4)",width:"100%",maxWidth:280}}>{hasSaved?w.newAdventure:w.begin}</button></div><p style={{position:"absolute",bottom:12,color:"rgba(255,255,255,.15)",fontSize:9}}>v5.2 — back button fix</p></div>}

function OnboardingScreen({onComplete,lang,t}){const[name,setName]=useState("");const[ag,setAg]=useState(null);const[step,setStep]=useState(0);const o=t("onboard");const ages=[{id:"early",label:o.earlyLabel,range:o.earlyRange,emoji:"🌟"},{id:"primary",label:o.primaryLabel,range:o.primaryRange,emoji:"🚀"},{id:"intermediate",label:o.interLabel,range:o.interRange,emoji:"⚡"}];return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#FFFBEB,#FEF3C7,#ECFDF5)",padding:24}}>{step===0&&<div className="gq-fade-in" style={{textAlign:"center",width:"100%",maxWidth:400}}><div style={{fontSize:48,marginBottom:16}}>👋</div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:28,color:"#334155",marginBottom:8}}>{o.hi}</h2><p style={{color:"#64748B",fontSize:15,marginBottom:32}}>{o.whatName}</p><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder={o.placeholder} style={{width:"100%",padding:"16px 20px",fontSize:18,border:"3px solid #E2E8F0",borderRadius:16,fontFamily:"'Nunito',sans-serif",fontWeight:600,textAlign:"center",background:"#fff"}} onFocus={e=>e.target.style.borderColor="#3B82F6"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&name.trim())setStep(1)}}/><button onClick={()=>name.trim()&&setStep(1)} disabled={!name.trim()} style={{marginTop:24,fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,padding:"14px 40px",border:"none",borderRadius:100,background:name.trim()?"linear-gradient(135deg,#F59E0B,#EF4444)":"#E2E8F0",color:name.trim()?"#fff":"#94A3B8",cursor:name.trim()?"pointer":"default"}}>{o.thatsMe}</button></div>}{step===1&&<div className="gq-fade-in" style={{textAlign:"center",width:"100%",maxWidth:440}}><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,color:"#334155",marginBottom:8}}>{o.niceToMeet} {name}! 🎉</h2><p style={{color:"#64748B",fontSize:15,marginBottom:28}}>{o.howOld}</p><div style={{display:"flex",flexDirection:"column",gap:12}}>{ages.map((a,i)=><button key={a.id} onClick={()=>{setAg(a.id);setTimeout(()=>onComplete({name:name.trim(),ageGroup:a.id}),400)}} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",border:ag===a.id?"3px solid #3B82F6":"3px solid #E2E8F0",borderRadius:16,background:ag===a.id?"#EFF6FF":"#fff",cursor:"pointer",transition:"all .2s",animation:`fadeSlideUp .4s ease-out ${i*.1}s both`}}><span style={{fontSize:32}}>{a.emoji}</span><div style={{textAlign:"left"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,color:"#475569"}}>{a.label}</div><div style={{fontSize:13,color:"#94A3B8"}}>{a.range}</div></div></button>)}</div></div>}</div>}

function AvatarScreen({userName,onComplete}){const[sel,setSel]=useState(null);const[cn,setCn]=useState("");const ch=AVATARS.find(a=>a.id===sel);return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",background:"linear-gradient(170deg,#F0F9FF,#E0E7FF,#FCE7F3)",padding:24,paddingTop:48}}><div className="gq-fade-in" style={{textAlign:"center",maxWidth:480,width:"100%"}}><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,color:"#334155",marginBottom:6}}>Choose Your Guide</h2><p style={{color:"#64748B",fontSize:14,marginBottom:28}}>This friend grows with you!</p><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:28}}>{AVATARS.map((av,i)=><button key={av.id} onClick={()=>{setSel(av.id);setCn(av.name)}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 4px",border:sel===av.id?"3px solid #6366F1":"3px solid transparent",borderRadius:16,background:sel===av.id?"rgba(99,102,241,.08)":"rgba(255,255,255,.7)",cursor:"pointer",transition:"all .2s",animation:`fadeSlideUp .3s ease-out ${i*.05}s both`}}><span style={{fontSize:36,transform:sel===av.id?"scale(1.2)":"scale(1)",transition:"transform .2s"}}>{av.emoji}</span><span style={{fontSize:11,fontWeight:600,color:"#475569"}}>{av.name}</span></button>)}</div>{sel&&ch&&<div className="gq-grow" style={{background:"#fff",borderRadius:20,padding:24,boxShadow:"0 4px 24px rgba(0,0,0,.06)"}}><div style={{fontSize:56,marginBottom:4}}>{ch.emoji}</div><p style={{color:"#64748B",fontSize:13,marginBottom:4}}>{ch.desc}</p><p style={{color:"#94A3B8",fontSize:11,marginBottom:14}}>Your guide evolves as you grow!</p><div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:16,background:"#F8FAFC",borderRadius:12,padding:"10px 12px"}}>{ch.evolutions.map((ev,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:i===0?1:.3}}><span style={{fontSize:i<3?18:22}}>{ev}</span><span style={{fontSize:8,color:"#94A3B8",marginTop:2}}>{EVOLUTION_TITLES[i]}</span></div>)}</div><input type="text" value={cn} onChange={e=>setCn(e.target.value)} placeholder="Name your guide…" style={{width:"100%",padding:"12px 16px",fontSize:16,border:"2px solid #E2E8F0",borderRadius:12,fontFamily:"'Nunito',sans-serif",fontWeight:600,textAlign:"center"}} onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/><button onClick={()=>cn.trim()&&onComplete({avatarId:sel,avatarName:cn.trim()})} disabled={!cn.trim()} style={{marginTop:16,fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:cn.trim()?"linear-gradient(135deg,#6366F1,#8B5CF6)":"#E2E8F0",color:cn.trim()?"#fff":"#94A3B8",cursor:cn.trim()?"pointer":"default"}}>Let's Go! 🚀</button></div>}</div></div>}

function DashboardScreen({profile,onSelectComp,onStartQuest,onParentView}){const{name,avatarId,avatarName,progress,streak,ageGroup}=profile;const av=AVATARS.find(a=>a.id===avatarId);const lv=getAvLv(progress);const evo=av?.evolutions?.[lv-1]||av?.emoji;const tq=Object.values(progress).reduce((s,p)=>s+p.questsCompleted,0);const isE=ageGroup==="early";const qs=getQuestsForAge(ageGroup);const[showInfo,setShowInfo]=useState(false);const[showAvatar,setShowAvatar]=useState(false);const today=Object.entries(qs).map(([ck,q])=>({...q[new Date().getDay()%q.length],compKey:ck}));
return<div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0F172A,#1E293B)",color:"#fff",paddingBottom:40}}><div style={{padding:"20px 20px 24px",background:"linear-gradient(180deg,rgba(59,130,246,.1),transparent)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><div><p style={{fontSize:12,color:"rgba(255,255,255,.4)",fontWeight:600}}>Welcome back</p><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700}}>{name}</h2></div><div style={{display:"flex",alignItems:"center",gap:6}}><button onClick={onParentView} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:100,padding:"8px 12px",color:"rgba(255,255,255,.5)",fontSize:11,fontWeight:600,cursor:"pointer"}}>👤 Parent</button><button onClick={()=>setShowAvatar(!showAvatar)} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.08)",borderRadius:100,padding:"6px 14px 6px 8px",border:"none",cursor:"pointer",color:"#fff"}}><span className="gq-pulse" style={{fontSize:28}}>{evo}</span><div style={{textAlign:"left"}}><div style={{fontSize:12,fontWeight:700,color:"#FFD700"}}>Level {lv}</div><div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{avatarName}</div></div></button></div></div><div style={{display:"flex",gap:8,marginBottom:4}}>{[{v:tq,l:"Quests Done",c:"#fff"},{v:streak>0?`${streak}🔥`:"0",l:"Day Streak",c:"#F59E0B"}].map((s,i)=><div key={i} style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:12,padding:"10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,fontFamily:"'Fredoka',sans-serif",color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>{s.l}</div></div>)}<div onClick={()=>setShowInfo(!showInfo)} style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:12,padding:"10px",textAlign:"center",cursor:"pointer"}}><div style={{fontSize:18}}>⭐</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)",textDecoration:"underline dotted"}}>How Stars Work</div></div></div>{showInfo&&<StarsExplainer isEarly={isE}/>}{showAvatar&&<div className="gq-fade-in" style={{margin:"0 20px",background:"rgba(255,255,255,.06)",borderRadius:16,padding:20,border:"1px solid rgba(255,255,255,.08)"}}>
<div style={{textAlign:"center"}}>
<div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>{av?.evolutions?.map((ev,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:i<lv?1:.3,padding:"4px 8px",borderRadius:12,background:i===lv-1?"rgba(255,215,0,.1)":"transparent",border:i===lv-1?"1px solid rgba(255,215,0,.3)":"1px solid transparent"}}><span style={{fontSize:i===lv-1?36:24}}>{ev}</span><span style={{fontSize:8,color:i===lv-1?"#FFD700":"rgba(255,255,255,.4)",marginTop:2}}>{EVOLUTION_TITLES[i]}</span></div>)}</div>
<p style={{fontSize:13,color:"rgba(255,255,255,.5)"}}>{avatarName} · Level {lv} {EVOLUTION_TITLES[lv-1]}</p>
<p style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:4}}>Complete more quests to help {avatarName} evolve!</p>
</div></div>}</div>
<div style={{padding:"12px 20px 0"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,marginBottom:10,color:"rgba(255,255,255,.55)"}}>Growth Realms</h3><div style={{display:"flex",flexDirection:"column",gap:10}}>{Object.entries(COMPETENCIES).map(([key,comp],i)=>{const sk=Object.keys(comp.subCompetencies);const avg=sk.reduce((s,k)=>s+progress[k].profile,0)/sk.length;return<button key={key} onClick={()=>onSelectComp(key)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,cursor:"pointer",width:"100%",textAlign:"left",animation:`fadeSlideUp .4s ease-out ${i*.08}s both`}}><ProgressRing progress={(avg/6)*100} size={48} strokeWidth={4} color={comp.color}><span style={{fontSize:19}}>{comp.icon}</span></ProgressRing><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,fontWeight:600}}>{comp.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:1}}>{comp.realm} · Level {Math.round(avg)}</div></div><span style={{fontSize:15,color:"rgba(255,255,255,.2)"}}>→</span></button>})}</div></div>
<div style={{padding:"22px 20px 0"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,marginBottom:10,color:"rgba(255,255,255,.55)"}}>Today's Quests</h3><div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8}}>{today.map((q,i)=><div key={i} onClick={()=>onStartQuest(q)} style={{minWidth:180,padding:13,borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.06)",cursor:"pointer",flexShrink:0,animation:`fadeSlideUp .4s ease-out ${.2+i*.08}s both`}}><div style={{fontSize:24,marginBottom:6}}>{q.icon}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,marginBottom:3}}>{q.title}</div><div style={{fontSize:11,color:"rgba(255,255,255,.3)",lineHeight:1.4}}>{q.desc.slice(0,50)}…</div><div style={{marginTop:8,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:"rgba(255,255,255,.2)"}}>⏱{q.minutes}m</span><span style={{fontSize:10,color:"#FFD700",fontWeight:700}}>⭐{QUEST_STARS[q.difficulty]}+</span></div></div>)}</div></div>
<div style={{padding:"22px 20px 0"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,marginBottom:10,color:"rgba(255,255,255,.55)"}}>What I Can Do</h3>{Object.entries(COMPETENCIES).map(([ck,comp])=>Object.entries(comp.subCompetencies).map(([sk,sub])=>{const p=progress[sk];if(p.profile<2)return null;return<div key={sk} style={{padding:"9px 12px",marginBottom:7,borderRadius:10,background:"rgba(255,255,255,.03)",borderLeft:`3px solid ${comp.color}`}}><div style={{fontSize:10,color:comp.color,fontWeight:700,marginBottom:2,textTransform:"uppercase",letterSpacing:.5}}>{sub.name} · Level {p.profile}</div><div style={{fontSize:12,color:"rgba(255,255,255,.55)",lineHeight:1.4}}>{sub.kidProfiles[p.profile-1]}</div></div>}))}</div></div>}

function CompDetailScreen({compKey,profile,onBack,onStartQuest}){const comp=COMPETENCIES[compKey];const qs=(getQuestsForAge(profile.ageGroup)[compKey])||[];return<div style={{minHeight:"100vh",background:"#FAFBFC",paddingBottom:40}}><div style={{background:comp.gradient,padding:"26px 20px 34px",color:"#fff",borderRadius:"0 0 26px 26px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%,rgba(255,255,255,.12),transparent 60%)",pointerEvents:"none"}}/><button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:100,padding:"8px 16px",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12,position:"relative",zIndex:2}}>← Back</button><div style={{fontSize:42,marginBottom:4}}>{comp.icon}</div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,marginBottom:2}}>{comp.name}</h2><p style={{opacity:.7,fontSize:13}}>{comp.realm}</p></div><div style={{padding:"18px 20px"}}>{Object.entries(comp.subCompetencies).map(([sk,sub],si)=>{const p=profile.progress[sk];const th=STARS_THRESH[p.profile-1]||12;const pct=Math.min((p.stars/th)*100,100);return<div key={sk} style={{background:"#fff",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,.04)",animation:`fadeSlideUp .4s ease-out ${si*.1}s both`}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#475569"}}>{sub.name}</h3><span style={{fontSize:11,fontWeight:700,color:comp.color,background:`${comp.color}12`,padding:"3px 10px",borderRadius:100}}>Level {p.profile}</span></div><div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,color:"#94A3B8"}}>{p.questsCompleted} quests</span><span style={{fontSize:10,color:"#94A3B8"}}>⭐ {p.stars}/{th}</span></div><div style={{background:"#F1F5F9",borderRadius:100,height:6,overflow:"hidden"}}><div style={{height:"100%",borderRadius:100,width:`${pct}%`,background:comp.gradient,transition:"width .8s ease-out"}}/></div></div><div style={{background:"#F8FAFC",borderRadius:10,padding:"9px 11px",borderLeft:`3px solid ${comp.color}`}}><p style={{fontSize:10,fontWeight:700,color:comp.color,marginBottom:2,textTransform:"uppercase",letterSpacing:.5}}>What I can do now</p><p style={{fontSize:13,color:"#334155",lineHeight:1.5}}>"{sub.kidProfiles[p.profile-1]}"</p></div>{p.profile>=2&&<div style={{marginTop:7,padding:"7px 11px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0"}}><p style={{fontSize:10,fontWeight:700,color:"#16A34A",marginBottom:3}}>✓ Strengths I've built</p>{sub.kidProfiles.slice(0,p.profile-1).map((prev,pi)=><p key={pi} style={{fontSize:11,color:"#4ADE80",lineHeight:1.4,marginBottom:1}}>• {prev}</p>)}</div>}{p.profile<6&&<div style={{marginTop:7,padding:"7px 11px",background:"#FFFBEB",borderRadius:8,border:"1px dashed #FCD34D"}}><p style={{fontSize:10,fontWeight:700,color:"#B45309",marginBottom:1}}>⭐ Next goal</p><p style={{fontSize:12,color:"#78716C",lineHeight:1.4}}>"{sub.kidProfiles[p.profile]}"</p></div>}</div>})}</div><div style={{padding:"0 20px"}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#475569",marginBottom:10}}>Quests</h3>{qs.map((q,i)=><button key={i} onClick={()=>onStartQuest(q)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 13px",background:"#fff",border:"1px solid #E2E8F0",borderRadius:13,cursor:"pointer",width:"100%",textAlign:"left",marginBottom:8}}><span style={{fontSize:24}}>{q.icon}</span><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,color:"#475569"}}>{q.title}</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{q.desc.slice(0,60)}…</div></div><div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#94A3B8"}}>⏱{q.minutes}m</div><div style={{fontSize:10,color:"#FFB800",fontWeight:700}}>⭐{QUEST_STARS[q.difficulty]}+</div></div></button>)}</div></div>}

function QuestScreen({quest,profile,onComplete,onBack}){const[step,setStep]=useState(0);const[resp,setResp]=useState("");const[selEmoji,setSelEmoji]=useState(null);const[refl,setRefl]=useState(null);const[selfA,setSelfA]=useState(null);const[showConf,setShowConf]=useState(false);const[showPart,setShowPart]=useState(false);const[showPU,setShowPU]=useState(null);const[earned,setEarned]=useState(0);const isE=profile.ageGroup==="early";const iType=quest.inputType||"text";
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

{step===2&&<div className="gq-fade-in" style={{textAlign:"center",maxWidth:400,margin:"0 auto",paddingTop:12}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:21,color:"#334155",marginBottom:6}}>{isE?"How was that?":"How did that feel?"}</h3><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginTop:16,marginBottom:24}}>{rOpts.map((r,i)=><button key={i} onClick={()=>setRefl(i)} style={{padding:13,borderRadius:14,border:refl===i?`3px solid ${cc}`:"3px solid #E2E8F0",background:refl===i?`${cc}08`:"#fff",cursor:"pointer"}}><div style={{fontSize:28,marginBottom:3}}>{r.e}</div><div style={{fontSize:12,fontWeight:600,color:"#475569"}}>{r.l}</div></button>)}</div>{refl!==null&&<button onClick={()=>setStep(3)} style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:cc,color:"#fff",cursor:"pointer",animation:"fadeSlideUp .3s ease-out both"}}>{isE?"Where am I? →":"Check My Growth →"}</button>}</div>}

{step===3&&<div className="gq-fade-in" style={{maxWidth:400,margin:"0 auto",paddingTop:12}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:19,color:"#334155",marginBottom:4,textAlign:"center"}}>{isE?"How am I doing?":"How am I growing?"}</h3><p style={{color:"#64748B",fontSize:12,marginBottom:16,textAlign:"center"}}>For <strong>{sc?.name}</strong> — tap the one that sounds most like you:</p>
{isE?<div style={{display:"flex",flexDirection:"column",gap:10}}><p style={{color:"#64748B",fontSize:13,textAlign:"center",marginBottom:4}}>How much can you do this?</p>{[{e:"🌱",l:"Just starting!",v:1},{e:"🌿",l:"Getting better!",v:2},{e:"🌳",l:"I can do it!",v:3}].map((opt)=><button key={opt.v} onClick={()=>setSelfA(opt.v)} style={{padding:"16px",borderRadius:16,border:selfA===opt.v?`3px solid ${cc}`:"2px solid #E2E8F0",background:selfA===opt.v?`${cc}08`:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:40}}>{opt.e}</span><span style={{fontSize:16,fontWeight:600,color:"#475569"}}>{opt.l}</span></button>)}</div>
:<div style={{display:"flex",flexDirection:"column",gap:7}}>{(()=>{const cur=profile.progress[quest.sub]?.profile||1;const show=[Math.max(1,cur-1),cur,Math.min(6,cur+1),Math.min(6,cur+2)].filter((v,i,a)=>a.indexOf(v)===i&&v<=sc?.kidProfiles.length);return show.map((lv,si)=>{const pi=lv-1;const p=sc?.kidProfiles[pi];const isBuilt=lv<cur;return<button key={pi} onClick={()=>setSelfA(lv)} style={{padding:"10px 12px",borderRadius:12,textAlign:"left",border:selfA===lv?`3px solid ${cc}`:"2px solid #E2E8F0",background:selfA===lv?`${cc}08`:isBuilt?"#F0FDF4":"#fff",cursor:"pointer",animation:`fadeSlideUp .3s ease-out ${si*.05}s both`}}><div style={{display:"flex",gap:8,alignItems:"flex-start"}}><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:12,fontWeight:700,color:selfA===lv?"#fff":isBuilt?"#10B981":cc,background:selfA===lv?cc:isBuilt?"#D1FAE5":`${cc}15`,padding:"2px 7px",borderRadius:100,flexShrink:0}}>L{lv}</span><div><p style={{fontSize:12,color:"#64748B",lineHeight:1.5,margin:0}}>{p}</p>{isBuilt&&<p style={{fontSize:10,color:"#10B981",marginTop:2}}>✓ Strength I've built</p>}</div></div></button>})})()}</div>}
<div style={{marginTop:16}}><button onClick={()=>{if(!selfA)setSelfA(profile.progress[quest.sub]?.profile||1);claim()}} style={{width:"100%",fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,padding:"14px 20px",border:"none",borderRadius:100,background:selfA?"linear-gradient(135deg,#FFD700,#FF8C42)":cc,color:"#fff",cursor:"pointer"}}>{selfA?"Get My Stars! ⭐":"I'm not sure yet — that's okay! ⭐"}</button></div></div>}

{step===4&&!showPU&&<div className="gq-fade-in" style={{textAlign:"center",maxWidth:400,margin:"0 auto",paddingTop:32,color:"#fff",position:"relative"}}><div style={{position:"relative",display:"inline-block",marginBottom:16}}><ParticleBurst active={showPart} color={cc}/><ExpandingRings active={showPart} color="#FFD700"/><SpinningStars active={showPart}/><div style={{position:"absolute",left:"50%",top:"30%",transform:"translateX(-50%)",fontFamily:"'Fredoka',sans-serif",fontSize:36,fontWeight:700,color:"#FFD700",textShadow:"0 2px 12px rgba(255,215,0,.5)",animation:"stars-float 1.8s ease-out .3s forwards",zIndex:110,pointerEvents:"none"}}>+{earned} ⭐</div><div className="gq-pulse" style={{fontSize:64,position:"relative",zIndex:10}}>🏆</div></div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,marginBottom:8,animation:"number-pop .5s ease-out .4s both"}}>{isE?"Yay! Great job!":"Amazing Growth!"}</h2>
<div style={{background:"rgba(255,255,255,.06)",borderRadius:14,padding:14,border:"1px solid rgba(255,255,255,.1)",marginBottom:20,textAlign:"left"}}><p style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:8}}>How you earned your stars:</p>{[{l:"Quest completed",v:QUEST_STARS[quest.difficulty]},refl!==null&&REFL_STARS[rOpts[refl].d]>0&&{l:"Thinking about it",v:REFL_STARS[rOpts[refl].d]},selfA&&{l:"Checking my growth",v:1},quest.alsoTouches&&{l:"Helped other skills too",v:1}].filter(Boolean).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:"rgba(255,255,255,.45)"}}>{r.l}</span><span style={{fontSize:12,color:"#FFD700",fontWeight:700}}>{"⭐".repeat(r.v)}</span></div>)}<div style={{borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:6,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:700}}>Total</span><span style={{fontSize:14,fontWeight:700,color:"#FFD700"}}>⭐ {earned} stars</span></div></div>
<button onClick={()=>onComplete(earned)} style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer"}}>Back to My Quest →</button></div>}
</div>}

// ── Parent PIN Gate ────────────────────────────────────────────────

function ParentPinGate({onUnlock,onBack}){
const[pin,setPin]=useState("");
const[error,setError]=useState("");
const STORED_PIN_KEY="growquest_parent_pin";

const getSavedPin=()=>{try{return localStorage.getItem(STORED_PIN_KEY)||null}catch(e){return null}};
const[hasSavedPin,setHasSavedPin]=useState(()=>!!getSavedPin());
const[setting,setSetting]=useState(()=>!getSavedPin());

// If no PIN has ever been set, show setup screen with skip option
// If PIN exists, require it

const handleSubmit=()=>{
if(setting){
if(pin.length!==4){setError("Please enter 4 digits");return}
try{localStorage.setItem(STORED_PIN_KEY,pin)}catch(e){}
setHasSavedPin(true);
onUnlock();
}else{
if(pin===getSavedPin()){onUnlock()}
else{setError("That's not right. Try again!");setPin("")}
}};

const handleSkip=()=>{
// Mark that they chose no PIN so we don't ask again
try{localStorage.setItem(STORED_PIN_KEY,"none")}catch(e){}
onUnlock();
};

const handleDigit=(n)=>{
if(n==="del"){setPin(p=>p.slice(0,-1));setError("")}
else if(pin.length<4){setPin(p=>p+n);setError("")}
};

// If PIN is "none" (they skipped), go straight through
if(getSavedPin()==="none"&&!setting){onUnlock();return null}

return<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#1E293B,#334155)",padding:24}}>
<div className="gq-fade-in" style={{textAlign:"center",maxWidth:340,width:"100%"}}>
<div style={{fontSize:48,marginBottom:16}}>🔒</div>
<h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",marginBottom:6}}>
{setting?"Set Up Parent PIN":"Parent Area"}
</h2>
<p style={{color:"rgba(255,255,255,.5)",fontSize:13,marginBottom:24}}>
{setting?"Choose a 4-digit PIN to keep this area private, or skip for now":"Enter your 4-digit PIN to continue"}
</p>

<div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16}}>
{[0,1,2,3].map(i=><div key={i} style={{width:44,height:52,borderRadius:12,background:"rgba(255,255,255,.08)",border:pin.length>i?"2px solid #3B82F6":"2px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",fontWeight:700}}>{pin[i]?"●":""}</div>)}
</div>

<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,maxWidth:240,margin:"0 auto 16px"}}>
{[1,2,3,4,5,6,7,8,9,null,0,"del"].map((n,i)=>
n===null?<div key={i}/>:
<button key={i} onClick={()=>handleDigit(n==="del"?"del":String(n))} style={{padding:"14px",borderRadius:12,border:"none",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:n==="del"?16:20,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>{n==="del"?"⌫":n}</button>
)}
</div>

{error&&<p style={{color:"#EF4444",fontSize:12,marginBottom:8}}>{error}</p>}

{pin.length===4&&<button onClick={handleSubmit} style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:600,padding:"12px 32px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer",width:"100%",marginBottom:8,animation:"fadeSlideUp .3s ease-out both"}}>
{setting?"Set PIN and Continue":"Open Parent View"}
</button>}

{setting&&<button onClick={handleSkip} style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,padding:"10px 24px",border:"2px solid rgba(255,255,255,.15)",borderRadius:100,background:"transparent",color:"rgba(255,255,255,.6)",cursor:"pointer",width:"100%",marginBottom:8}}>Skip — no PIN needed</button>}

{hasSavedPin&&!setting&&<button onClick={()=>{setSetting(true);setPin("");setError("")}} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:11,cursor:"pointer",marginTop:4}}>Change PIN</button>}

{hasSavedPin&&!setting&&<button onClick={()=>{try{localStorage.setItem(STORED_PIN_KEY,"none")}catch(e){};onUnlock()}} style={{background:"none",border:"none",color:"rgba(255,255,255,.25)",fontSize:10,cursor:"pointer",marginTop:8}}>Remove PIN</button>}

<button onClick={onBack} style={{marginTop:12,background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:13,cursor:"pointer"}}>← Back</button>
</div>
</div>}

// ── Parent / Teacher Dashboard ──────────────────────────────────────

function ParentDashboard({profile,onBack}){
const{name,avatarId,avatarName,progress,ageGroup,streak,lastQuestDate}=profile;
const av=AVATARS.find(a=>a.id===avatarId);
const lv=getAvLv(progress);
const evo=av?.evolutions?.[lv-1]||av?.emoji;
const tq=Object.values(progress).reduce((s,p)=>s+p.questsCompleted,0);
const agLabel=AGE_GROUPS.find(a=>a.id===ageGroup)?.label||ageGroup;
const[certMsg,setCertMsg]=useState(null);

const handleCert=(subKey,sub,comp,p)=>{
const hist=p.questHistory||[];
const titles=[...new Set(hist.map(h=>h.title))].slice(0,5);
const contexts=["solo","with_family"];
try{generateCertificate({childName:name,subCompetencyKey:subKey,profileLevel:p.profile,profileText:sub.kidProfiles[p.profile-1],evidenceSummary:{questTitles:titles,contexts,reflections:[],evidenceCount:p.questsCompleted},dateEarned:new Date().toLocaleDateString("en-CA"),avatarName});setCertMsg(subKey);setTimeout(()=>setCertMsg(null),3000)}catch(e){console.error(e)}};

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
<p style={{fontSize:9,fontWeight:700,color:"#059669",textTransform:"uppercase",letterSpacing:.5}}>Strongest Area</p>
<p style={{fontSize:12,color:"#334155",marginTop:2}}>{findSubName(highestSub)} (Level {progress[highestSub].profile})</p>
</div>
<div style={{flex:1,padding:"8px 10px",background:"#FFFBEB",borderRadius:8,borderLeft:"3px solid #F59E0B"}}>
<p style={{fontSize:9,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:.5}}>Growth Opportunity</p>
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

{/* User Manual download */}
<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.04)",marginBottom:14,textAlign:"center"}}>
<h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#475569",marginBottom:8}}>User Manual</h3>
<p style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>Download a printable guide covering all features, how quests work, Growth Stars, self-assessment, and curriculum alignment.</p>
<button onClick={()=>{try{generateUserManual()}catch(e){console.error(e)}}} style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,padding:"12px 28px",border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:"pointer"}}>Download User Manual (PDF)</button>
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
},[]);

const pickVoice=(name)=>{setSelectedVoice(name);try{localStorage.setItem("gq_voice_name",name)}catch(e){}};

const speak=(text,rate=0.9)=>{
if(!window.speechSynthesis) return;
window.speechSynthesis.cancel();
const spokenText=text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[⭐✦✨⚡]/gu,"").replace(/\s{2,}/g," ").trim();
const u=new SpeechSynthesisUtterance(spokenText);
u.rate=rate; u.pitch=1.15; u.volume=1;
const allVoices=voices.length?voices:window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith("en"));
const pick=selectedVoice?allVoices.find(v=>v.name===selectedVoice):allVoices[0];
if(pick)u.voice=pick;
u.onstart=()=>{speakingRef.current=true};
u.onend=()=>{speakingRef.current=false};
window.speechSynthesis.speak(u);
};

const preview=(name)=>{
if(!window.speechSynthesis)return;
window.speechSynthesis.cancel();
const u=new SpeechSynthesisUtterance("Hi there! I'm your guide.");
u.rate=0.9;u.pitch=1.15;u.volume=1;
const allVoices=voices.length?voices:window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith("en"));
const v=allVoices.find(vv=>vv.name===name);
if(v)u.voice=v;
window.speechSynthesis.speak(u);
};

const stop=()=>{window.speechSynthesis.cancel();speakingRef.current=false};
return{speak,stop,voices,selectedVoice,pickVoice,preview};}

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
const{speak,stop,voices:availableVoices,selectedVoice,pickVoice,preview}=useSpeak();
const timerRef=useRef(null);
const[voiceOn,setVoiceOn]=useState(()=>{try{const v=localStorage.getItem("gq_voice");return v===null?true:v==="true"}catch(e){return true}});
const[showVoicePicker,setShowVoicePicker]=useState(false);

const toggleVoice=()=>{const nv=!voiceOn;setVoiceOn(nv);try{localStorage.setItem("gq_voice",String(nv))}catch(e){};if(!nv)stop()};

const av=AVATARS.find(a=>a.id===profile.avatarId);
const evo=av?.evolutions?.[0]||"🥚";
const name=profile.name;
const avName=profile.avatarName||av?.name;
const isEarly=profile.ageGroup==="early";
const[voiceReady,setVoiceReady]=useState(false);

// Only birds hatch from eggs
const birdIds=["owl","eagle","raven"];
const introVerb=birdIds.includes(av?.id)?"I just hatched from my egg":"I just arrived";

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
  {text:`Hi ${name}! I'm ${avName}. ${introVerb} and I'm so excited to meet you! Will you help me grow?`,emoji:evo,action:"next",btnText:"Yes! Let's go! 🎉"},
  // 1: Explain realms
  {text:`There are three amazing places to explore! Echo Isles for sharing ideas 💬, Wonder Peaks for thinking big 🧠, and Heartwood Grove for being your best self 🌱.`,emoji:evo,action:"next",btnText:"Cool! What do we do?"},
  // 2: First mini quest
  {text:isEarly
    ?`Let's try our first quest! Pick the emoji that shows how you feel right now.`
    :`Let's try our first quest together! Tell me: what is one thing you're really good at?`,
    emoji:evo,action:"quest",btnText:null},
  // 3: Reflection
  {text:`Nice one, ${name}! Now let's think about that for a moment. How did it feel?`,emoji:evo,action:"reflect",btnText:null},
  // 4: Stars earned
  {text:`You just earned your first Growth Stars! ⭐⭐ Every time you do a quest and think about it, you earn stars. Collect enough and I'll grow bigger!`,emoji:evo,action:"next",btnText:"I want more stars!"},
  // 5: Dashboard intro
  {text:`Your dashboard shows everything — your Growth Realms, today's quests, and what you can do. Ready to explore on your own? I'll be right here with you!`,emoji:evo,action:"finish",btnText:"Let's explore! 🚀"},
];

const current=dialogue[step]||dialogue[0];

// Typewriter effect + speak
useEffect(()=>{
  setTyping("");setTypingDone(false);
  const text=current.text;
  // On iOS, speechSynthesis needs a user gesture first.
  // Step 0 plays after user already tapped "Let's Go" on avatar screen.
  // On iOS, voices take up to 1s to load. Warm up and delay first speech.
  const delay = (!voiceReady && step===0) ? 800 : 100;
  if(!voiceReady){
    const warmup=new SpeechSynthesisUtterance("");
    warmup.volume=0;
    window.speechSynthesis?.speak(warmup);
    setVoiceReady(true);
  }
  if(voiceOn) setTimeout(()=>speak(text, isEarly ? 0.85 : 0.92), delay);
  let i=0;
  timerRef.current=setInterval(()=>{
    i++;
    if(i<=text.length){setTyping(text.slice(0,i))}
    else{clearInterval(timerRef.current);setTypingDone(true)}
  },30);
  return()=>{clearInterval(timerRef.current);stop()};
},[step]);

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

</div>}

// ── Main App ───────────────────────────────────────────────────────
export default function GrowQuestEN({onChangeLang}){

const[screen,setScreen]=useState("welcome");
const[prof,setProf]=useState(null);const[selComp,setSelComp]=useState(null);const[quest,setQuest]=useState(null);const[parentView,setParentView]=useState(false);const[parentUnlocked,setParentUnlocked]=useState(false);const[hasSaved]=useState(()=>!!load());



// Translation helper


// Language selector screen
const initP=()=>{const p={};Object.values(COMPETENCIES).forEach(c=>{Object.keys(c.subCompetencies).forEach(sk=>{p[sk]={profile:1,stars:0,questsCompleted:0,questHistory:[]}})});return p};
useEffect(()=>{if(prof)save(prof)},[prof]);
const welc=a=>{if(a==="continue"){const s=load();if(s){setProf(s);setScreen("dashboard");return}}setScreen("onboard")};
const onboard=({name,ageGroup})=>{setProf({name,ageGroup,avatarId:null,avatarName:null,progress:initP(),streak:0,lastQuestDate:null,onboarded:false});setScreen("avatar")};
const avDone=({avatarId,avatarName})=>{setProf(p=>({...p,avatarId,avatarName}));setScreen("guided")};
const guidedDone=(stars)=>{
  if(stars>0){setProf(p=>{const np={...p.progress};const sub="positiveIdentity";if(np[sub]){const r=checkProfileUp(np[sub].stars,stars,np[sub].profile);np[sub]={...np[sub],stars:r.rem,profile:r.newProf,questsCompleted:np[sub].questsCompleted+1,questHistory:[...np[sub].questHistory,{title:"First Quest",date:new Date().toLocaleDateString("en-CA"),stars}].slice(-20)}}return{...p,progress:np,onboarded:true,streak:1,lastQuestDate:new Date().toDateString()}})}
  else{setProf(p=>({...p,onboarded:true}))}
  setScreen("dashboard");
};
const qDone=stars=>{if(quest){setProf(p=>{const np={...p.progress};const sub=quest.sub;if(np[sub]){const r=checkProfileUp(np[sub].stars,stars,np[sub].profile);const hist=np[sub].questHistory||[];hist.push({title:quest.title,date:new Date().toLocaleDateString("en-CA"),stars});np[sub]={...np[sub],stars:r.rem,profile:r.newProf,questsCompleted:np[sub].questsCompleted+1,questHistory:hist.slice(-20)}}if(quest.alsoTouches)quest.alsoTouches.forEach(t=>{if(np[t]){const b=Math.max(1,Math.floor(stars*.3)),cr=checkProfileUp(np[t].stars,b,np[t].profile);np[t]={...np[t],stars:cr.rem,profile:cr.newProf}}});const td=new Date().toDateString();const wt=p.lastQuestDate===td;const wy=p.lastQuestDate===new Date(Date.now()-86400000).toDateString();return{...p,progress:np,streak:wt?p.streak:(wy?p.streak+1:1),lastQuestDate:td}})}setQuest(null);setSelComp(null);setScreen("dashboard")};
if(screen==="welcome")return<WelcomeScreen onStart={welc} hasSaved={hasSaved} lang="en" t={(s)=>T[s]?.en||T[s]?.en||{}} onChangeLang={onChangeLang}/>;
if(screen==="onboard")return<OnboardingScreen onComplete={onboard} lang="en" t={(s)=>T[s]?.en||T[s]?.en||{}}/>;
if(screen==="avatar")return<AvatarScreen userName={prof?.name} onComplete={avDone}/>;
if(screen==="guided")return<GuidedOnboarding profile={prof} onComplete={guidedDone}/>;
if(parentView&&!parentUnlocked)return<ParentPinGate onUnlock={()=>setParentUnlocked(true)} onBack={()=>{setParentView(false);setParentUnlocked(false)}}/>;
if(parentView&&parentUnlocked)return<ParentDashboard profile={prof} onBack={()=>{setParentView(false);setParentUnlocked(false)}}/>;
if(quest)return<QuestScreen quest={quest} profile={prof} onComplete={qDone} onBack={()=>setQuest(null)}/>;
if(selComp)return<CompDetailScreen compKey={selComp} profile={prof} onBack={()=>setSelComp(null)} onStartQuest={q=>setQuest(q)}/>;
return<DashboardScreen profile={prof} onSelectComp={k=>setSelComp(k)} onStartQuest={q=>setQuest(q)} onParentView={()=>setParentView(true)} onChangeLang={onChangeLang}/>;}
