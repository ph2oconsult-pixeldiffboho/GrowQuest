// ═══════════════════════════════════════════════════════════════════
// GrowQuest BC — Teacher Dashboard (Stage 1)
// 
// How it works:
// 1. Teacher creates a class and gets a 6-digit class code
// 2. Students enter the class code when they start the app
// 3. Students "share progress" which generates a shareable code
// 4. Teacher imports student progress codes to see the class view
// 5. All data stays local — no server needed for Stage 1
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { generateStudentReport, generateClassReport } from "./certificates/generateReport.js";

// ── Constants ──────────────────────────────────────────────────────

const COMPETENCY_NAMES = {
  communication: "Communication",
  thinking: "Thinking",
  personalSocial: "Personal & Social",
};

const SUB_NAMES = {
  communicating: "Communicating",
  collaborating: "Working Together",
  creativeThinking: "Creative Thinking",
  criticalThinking: "Thinking It Through",
  positiveIdentity: "Knowing Myself",
  personalAwareness: "Taking Care of Myself",
  socialAwareness: "Caring for Others",
};

const SUB_TO_COMP = {
  communicating: "communication",
  collaborating: "communication",
  creativeThinking: "thinking",
  criticalThinking: "thinking",
  positiveIdentity: "personalSocial",
  personalAwareness: "personalSocial",
  socialAwareness: "personalSocial",
};

const COMP_COLORS = {
  communication: "#2563EB",
  thinking: "#7C3AED",
  personalSocial: "#059669",
};

const PROFILE_NAMES = ["Emerging", "Developing", "Practising", "Confident", "Extending", "Transforming"];

const STORAGE_KEY = "growquest_teacher";

// ── Helper Functions ───────────────────────────────────────────────

function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function saveTeacherData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadTeacherData() {
  try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null; } catch(e) { return null; }
}

// ── Encryption (v6.7) ─────────────────────────────────────────────
// Student progress codes are encrypted with a key derived from the teacher's
// class code (PBKDF2 → AES-GCM). The class code is shared out-of-band by the
// teacher; the child enters it at share time. Result: the code on the wire
// (or in a screenshot) is meaningless without the class code.
//
// Format: "gq1:<saltB64>:<ivB64>:<ciphertextB64>"
//   gq1   = version tag (lets us migrate cleanly later)
//   salt  = 16 random bytes for PBKDF2
//   iv    = 12 random bytes for AES-GCM
//   ct    = AES-GCM(plaintext, derived key)
//
// Legacy plain-base64 codes from v6.6 and earlier are still accepted on
// import (clearly marked as "unencrypted") so existing pilots don't break.

const KDF_ITERATIONS = 150000;
const KDF_HASH = "SHA-256";

function bytesToB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function deriveKey(classCode, salt) {
  const normalised = (classCode || "").trim().toUpperCase();
  if (!normalised) throw new Error("Class code is empty");
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalised),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: KDF_ITERATIONS, hash: KDF_HASH },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptStudentProgress(profile, classCode) {
  const data = {
    n: profile.name,
    a: profile.ageGroup,
    av: profile.avatarId,
    an: profile.avatarName,
    s: profile.streak,
    p: {},
  };
  Object.entries(profile.progress).forEach(([sk, p]) => {
    data.p[sk] = { l: p.profile, s: p.stars, q: p.questsCompleted };
  });

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
  // Legacy format (plain btoa) — accepted but flagged.
  if (!trimmed.startsWith("gq1:")) {
    try {
      const data = JSON.parse(atob(trimmed));
      return {
        name: data.n, ageGroup: data.a, avatarId: data.av, avatarName: data.an,
        streak: data.s, progress: data.p,
        importedAt: new Date().toISOString(),
        _legacy: true,
      };
    } catch (e) { return null; }
  }
  // Encrypted v6.7 format.
  try {
    const [, saltB64, ivB64, ctB64] = trimmed.split(":");
    if (!saltB64 || !ivB64 || !ctB64) return null;
    const salt = b64ToBytes(saltB64);
    const iv = b64ToBytes(ivB64);
    const ct = b64ToBytes(ctB64);
    const key = await deriveKey(classCode, salt);
    const ptBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    const data = JSON.parse(new TextDecoder().decode(ptBuf));
    return {
      name: data.n, ageGroup: data.a, avatarId: data.av, avatarName: data.an,
      streak: data.s, progress: data.p,
      importedAt: new Date().toISOString(),
    };
  } catch (e) {
    return null; // Wrong class code, corrupt code, or tampered ciphertext.
  }
}

// ── Student Progress Card ──────────────────────────────────────────

function StudentCard({ student, onRemove, teacherName, className, reportingPeriod }) {
  const totalQuests = Object.values(student.progress).reduce((s, p) => s + (p.q || 0), 0);
  const avgLevel = (Object.values(student.progress).reduce((s, p) => s + (p.l || 1), 0) / Object.keys(student.progress).length).toFixed(1);
  
  // Find strongest and weakest
  const subs = Object.entries(student.progress);
  const strongest = subs.reduce((best, [k, v]) => (v.l || 1) > (best[1].l || 1) ? [k, v] : best, subs[0]);
  const weakest = subs.reduce((low, [k, v]) => (v.l || 1) < (low[1].l || 1) ? [k, v] : low, subs[0]);

  return (
    <div style={{background:"#fff",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div>
          <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#1E293B",margin:0}}>{student.name}</h3>
          <span style={{fontSize:11,color:"#94A3B8"}}>{student.ageGroup} · {student.avatarName} · {totalQuests} quests</span>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:700,color:"#3B82F6"}}>{avgLevel}</div>
          <div style={{fontSize:9,color:"#94A3B8"}}>Avg Level</div>
        </div>
      </div>
      
      {/* Mini competency bars */}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {Object.entries(student.progress).map(([sk, p]) => {
          const comp = SUB_TO_COMP[sk];
          const color = COMP_COLORS[comp] || "#94A3B8";
          return (
            <div key={sk} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,color:"#64748B",minWidth:80,maxWidth:110,flexShrink:0}}>{SUB_NAMES[sk] || sk}</span>
              <div style={{flex:1,background:"#F1F5F9",borderRadius:100,height:6,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:100,width:`${((p.l || 1) / 6) * 100}%`,background:color,transition:"width .5s"}} />
              </div>
              <span style={{fontSize:10,color:color,fontWeight:700,width:20,textAlign:"right"}}>L{p.l || 1}</span>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <div style={{flex:1,padding:"6px 8px",background:"#F0FDF4",borderRadius:8,borderLeft:"3px solid #10B981"}}>
          <p style={{fontSize:8,fontWeight:700,color:"#059669",textTransform:"uppercase",letterSpacing:.5}}>Strongest</p>
          <p style={{fontSize:10,color:"#334155"}}>{SUB_NAMES[strongest[0]] || strongest[0]}</p>
        </div>
        <div style={{flex:1,padding:"6px 8px",background:"#FFFBEB",borderRadius:8,borderLeft:"3px solid #F59E0B"}}>
          <p style={{fontSize:8,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:.5}}>Focus Area</p>
          <p style={{fontSize:10,color:"#334155"}}>{SUB_NAMES[weakest[0]] || weakest[0]}</p>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
        <span style={{fontSize:9,color:"#CBD5E1"}}>Imported {new Date(student.importedAt).toLocaleDateString()}</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={() => generateStudentReport({
            studentName: student.name,
            ageGroup: student.ageGroup,
            teacherName: teacherName,
            className: className,
            reportingPeriod: reportingPeriod,
            progress: student.progress,
            questHistory: [],
            storyExcerpts: [],
            avatarName: student.avatarName,
          })} style={{fontSize:9,color:"#3B82F6",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>📄 Report</button>
          <button onClick={onRemove} style={{fontSize:9,color:"#EF4444",background:"none",border:"none",cursor:"pointer"}}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── Class Overview ─────────────────────────────────────────────────

function ClassOverview({ students }) {
  if (students.length === 0) return null;

  const subKeys = Object.keys(SUB_NAMES);
  
  // Calculate class averages per sub-competency
  const classAvg = {};
  subKeys.forEach(sk => {
    const levels = students.map(s => s.progress[sk]?.l || 1);
    classAvg[sk] = (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1);
  });

  // Total quests across class
  const totalQuests = students.reduce((s, st) => s + Object.values(st.progress).reduce((ss, p) => ss + (p.q || 0), 0), 0);
  
  // Students needing attention (lowest overall average)
  const studentAvgs = students.map(s => ({
    name: s.name,
    avg: Object.values(s.progress).reduce((ss, p) => ss + (p.l || 1), 0) / Object.keys(s.progress).length,
  })).sort((a, b) => a.avg - b.avg);

  return (
    <div style={{background:"#fff",borderRadius:16,padding:18,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
      <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#1E293B",marginBottom:12}}>Class Overview</h3>
      
      {/* Quick stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {[
          {v:students.length, l:"Students", c:"#3B82F6"},
          {v:totalQuests, l:"Total Quests", c:"#8B5CF6"},
          {v:(students.reduce((s,st)=>s+st.streak,0)/students.length).toFixed(0), l:"Avg Streak", c:"#F59E0B"},
        ].map((s,i) => (
          <div key={i} style={{textAlign:"center",padding:"10px 4px",background:"#F8FAFC",borderRadius:10}}>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"'Fredoka',sans-serif",color:s.c}}>{s.v}</div>
            <div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Class competency averages */}
      <h4 style={{fontSize:12,fontWeight:700,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>Class Competency Averages</h4>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
        {subKeys.map(sk => {
          const comp = SUB_TO_COMP[sk];
          const color = COMP_COLORS[comp] || "#94A3B8";
          const avg = parseFloat(classAvg[sk]);
          return (
            <div key={sk} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,color:"#64748B",minWidth:80,maxWidth:120,flexShrink:0}}>{SUB_NAMES[sk]}</span>
              <div style={{flex:1,background:"#F1F5F9",borderRadius:100,height:8,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:100,width:`${(avg / 6) * 100}%`,background:color,transition:"width .5s"}} />
              </div>
              <span style={{fontSize:10,color:color,fontWeight:700,width:30,textAlign:"right"}}>{classAvg[sk]}</span>
            </div>
          );
        })}
      </div>

      {/* Students needing attention */}
      {studentAvgs.length >= 3 && (
        <div style={{padding:"10px 12px",background:"#FFFBEB",borderRadius:10,border:"1px solid #FCD34D"}}>
          <p style={{fontSize:10,fontWeight:700,color:"#B45309",marginBottom:4}}>Students Who May Need Support</p>
          {studentAvgs.slice(0, 3).map((s, i) => (
            <p key={i} style={{fontSize:11,color:"#78716C"}}>{s.name} — Avg Level {s.avg.toFixed(1)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Export Report ───────────────────────────────────────────────────

function ExportReport({ className, students }) {
  const handleExport = () => {
    const subKeys = Object.keys(SUB_NAMES);
    let csv = "Student,Age Group,Total Quests,Avg Level,Streak," + subKeys.map(sk => SUB_NAMES[sk] + " Level").join(",") + "\n";
    
    students.forEach(s => {
      const totalQ = Object.values(s.progress).reduce((ss, p) => ss + (p.q || 0), 0);
      const avgL = (Object.values(s.progress).reduce((ss, p) => ss + (p.l || 1), 0) / Object.keys(s.progress).length).toFixed(1);
      const levels = subKeys.map(sk => s.progress[sk]?.l || 1);
      csv += `"${s.name}",${s.ageGroup},${totalQ},${avgL},${s.streak},${levels.join(",")}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${className.replace(/\s/g, "_")}_GrowQuest_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport} style={{
      fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,padding:"12px 24px",
      border:"none",borderRadius:100,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",
      color:"#fff",cursor:"pointer",width:"100%",
    }}>
      📊 Export Class Report (CSV)
    </button>
  );
}

// ── Main Teacher Dashboard ─────────────────────────────────────────

export default function TeacherDashboard({ onBack }) {
  const [data, setData] = useState(() => loadTeacherData() || null);
  const [screen, setScreen] = useState(data ? "dashboard" : "setup");
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { if (data) saveTeacherData(data); }, [data]);

  // ── Setup Screen ───────────────────────────────────────────────
  const SetupScreen = () => {
    const [teacherName, setTeacherName] = useState("");
    const [className, setClassName] = useState("");

    const handleCreate = () => {
      if (!teacherName.trim() || !className.trim()) return;
      const newData = {
        teacherName: teacherName.trim(),
        className: className.trim(),
        classCode: generateClassCode(),
        students: [],
        createdAt: new Date().toISOString(),
      };
      setData(newData);
      setScreen("dashboard");
    };

    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#1E293B,#334155)",padding:24}}>
        <div style={{textAlign:"center",maxWidth:400,width:"100%"}}>
          <div style={{fontSize:48,marginBottom:16}}>🎓</div>
          <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:28,color:"#fff",marginBottom:8}}>Teacher Dashboard</h1>
          <p style={{color:"rgba(255,255,255,.5)",fontSize:13,marginBottom:32}}>Set up your class to track student growth across BC Core Competencies</p>
          
          <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)}
            placeholder="Your name" style={{width:"100%",padding:"14px 18px",fontSize:16,border:"2px solid rgba(255,255,255,.1)",borderRadius:12,background:"rgba(255,255,255,.05)",color:"#fff",fontFamily:"'Nunito',sans-serif",marginBottom:12,textAlign:"center"}} />
          
          <input type="text" value={className} onChange={e => setClassName(e.target.value)}
            placeholder="Class name (e.g. Ms. Smith's Grade 3)" style={{width:"100%",padding:"14px 18px",fontSize:16,border:"2px solid rgba(255,255,255,.1)",borderRadius:12,background:"rgba(255,255,255,.05)",color:"#fff",fontFamily:"'Nunito',sans-serif",marginBottom:24,textAlign:"center"}} />
          
          <button onClick={handleCreate} disabled={!teacherName.trim() || !className.trim()} style={{
            fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,padding:"14px 36px",border:"none",borderRadius:100,width:"100%",
            background:teacherName.trim() && className.trim() ? "linear-gradient(135deg,#3B82F6,#8B5CF6)" : "#475569",
            color:"#fff",cursor:teacherName.trim() && className.trim() ? "pointer" : "default",
          }}>Create My Class</button>
          
          {onBack && <button onClick={onBack} style={{marginTop:16,background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:13,cursor:"pointer"}}>← Back</button>}
        </div>
      </div>
    );
  };

  // ── Import Student ─────────────────────────────────────────────
  // v6.7: codes are encrypted with the class code (or legacy plain base64).
  // The teacher's class code is already known to the dashboard, so we use
  // it as the decryption key automatically.
  const handleImport = async () => {
    setImportError("");
    setImportSuccess("");
    const student = await decryptStudentProgress(importCode.trim(), data.classCode);
    if (!student) {
      setImportError("Couldn't read that code. Check that the student used your class code when generating it.");
      return;
    }
    if (student._legacy) {
      // Old unencrypted code accepted, but warn.
      setImportSuccess(`${student.name} imported (legacy unencrypted code — ask them to regenerate)`);
    }
    // Check for duplicate
    const exists = data.students.find(s => s.name === student.name);
    if (exists) {
      setData(d => ({
        ...d,
        students: d.students.map(s => s.name === student.name ? student : s),
      }));
      if (!student._legacy) setImportSuccess(`Updated ${student.name}'s progress`);
    } else {
      setData(d => ({ ...d, students: [...d.students, student] }));
      if (!student._legacy) setImportSuccess(`Added ${student.name} to the class!`);
    }
    setImportCode("");
    setTimeout(() => setImportSuccess(""), 4000);
  };

  const handleRemoveStudent = (name) => {
    if (window.confirm(`Remove ${name} from the class?`)) {
      setData(d => ({ ...d, students: d.students.filter(s => s.name !== name) }));
    }
  };

  // ── Filter students ────────────────────────────────────────────
  const filteredStudents = data?.students?.filter(s => {
    if (filter === "all") return true;
    if (filter === "early") return s.ageGroup === "early";
    if (filter === "primary") return s.ageGroup === "primary";
    if (filter === "intermediate") return s.ageGroup === "intermediate";
    return true;
  }) || [];

  // ── Dashboard Screen ───────────────────────────────────────────
  if (screen === "setup") return <SetupScreen />;

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",paddingBottom:40}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1E293B,#334155)",padding:"20px 20px 24px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          {onBack && <button onClick={onBack} style={{background:"rgba(255,255,255,.12)",border:"none",borderRadius:100,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back</button>}
          <span style={{fontSize:10,color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.08)",padding:"4px 10px",borderRadius:100}}>Teacher View</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:36}}>🎓</span>
          <div>
            <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,margin:0}}>{data.className}</h2>
            <p style={{fontSize:12,color:"rgba(255,255,255,.5)",margin:0}}>{data.teacherName} · {data.students.length} students</p>
          </div>
        </div>
      </div>

      <div style={{padding:"16px 20px"}}>
        {/* Class Code */}
        <div style={{background:"#fff",borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.04)",textAlign:"center"}}>
          <p style={{fontSize:11,color:"#94A3B8",marginBottom:4}}>Your Class Code</p>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:32,fontWeight:700,color:"#3B82F6",letterSpacing:4}}>{data.classCode}</div>
          <p style={{fontSize:10,color:"#64748B",marginTop:4,lineHeight:1.5}}>Tell students this code (verbally or on a class board). They'll enter it to encrypt their progress before sending it to you. Without it, codes can't be opened.</p>
        </div>

        {/* Import Student */}
        <div style={{background:"#fff",borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
          <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#1E293B",marginBottom:8}}>Import Student Progress</h3>
          <p style={{fontSize:11,color:"#94A3B8",marginBottom:10}}>Ask students to tap "Share My Progress" in their app, then paste the code here:</p>
          <div style={{display:"flex",gap:8}}>
            <input type="text" value={importCode} onChange={e => setImportCode(e.target.value)}
              placeholder="Paste student code…" style={{flex:1,padding:"10px 14px",fontSize:13,border:"2px solid #E2E8F0",borderRadius:10,fontFamily:"monospace"}} />
            <button onClick={handleImport} disabled={!importCode.trim()} style={{
              fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,padding:"10px 16px",border:"none",borderRadius:10,
              background:importCode.trim() ? "#3B82F6" : "#E2E8F0",color:importCode.trim() ? "#fff" : "#94A3B8",cursor:importCode.trim() ? "pointer" : "default",
            }}>Import</button>
          </div>
          {importError && <p style={{fontSize:11,color:"#EF4444",marginTop:6}}>{importError}</p>}
          {importSuccess && <p style={{fontSize:11,color:"#10B981",marginTop:6}}>{importSuccess}</p>}
        </div>

        {/* Class Overview */}
        <ClassOverview students={filteredStudents} />

        {/* Filter */}
        {data.students.length > 0 && (
          <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
            {[
              {id:"all", label:"All"},
              {id:"early", label:"Early Years"},
              {id:"primary", label:"Primary"},
              {id:"intermediate", label:"Intermediate"},
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding:"6px 14px",borderRadius:100,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0,
                background:filter === f.id ? "#3B82F6" : "#E2E8F0",color:filter === f.id ? "#fff" : "#64748B",
              }}>{f.label}</button>
            ))}
          </div>
        )}

        {/* Student Cards */}
        <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#1E293B",marginBottom:10}}>Students ({filteredStudents.length})</h3>
        
        {filteredStudents.length === 0 && (
          <div style={{textAlign:"center",padding:"32px 20px",background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:36,marginBottom:8}}>👋</div>
            <p style={{color:"#94A3B8",fontSize:13}}>No students yet. Share your class code and import their progress to get started.</p>
          </div>
        )}

        {filteredStudents.map((s, i) => (
          <StudentCard key={i} student={s} onRemove={() => handleRemoveStudent(s.name)} teacherName={data?.teacherName} className={data?.className} reportingPeriod="Current Term" />
        ))}

        {/* Reports & Export */}
        {data.students.length > 0 && (
          <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={() => {
              filteredStudents.forEach(s => {
                generateStudentReport({
                  studentName: s.name,
                  ageGroup: s.ageGroup,
                  teacherName: data.teacherName,
                  className: data.className,
                  reportingPeriod: "Current Term",
                  progress: s.progress,
                  questHistory: [],
                  storyExcerpts: [],
                  avatarName: s.avatarName,
                });
              });
            }} style={{
              fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,padding:"12px 24px",
              border:"none",borderRadius:100,background:"linear-gradient(135deg,#059669,#10B981)",
              color:"#fff",cursor:"pointer",width:"100%",
            }}>
              📄 Generate Student Reports (PDF) — {filteredStudents.length} students
            </button>
            <p style={{fontSize:10,color:"#94A3B8",textAlign:"center",margin:0}}>
              BC K-12 Reporting Policy compliant — includes self-assessment, evidence, goals, and family guidance. Upload to MyEducationBC or print.
            </p>
            <ExportReport className={data.className} students={filteredStudents} />
          </div>
        )}

        {/* Reset */}
        <div style={{textAlign:"center",marginTop:24}}>
          <button onClick={() => {
            if (window.confirm("Delete this class and all imported student data? This cannot be undone.")) {
              localStorage.removeItem(STORAGE_KEY);
              setData(null);
              setScreen("setup");
            }
          }} style={{fontSize:11,color:"#EF4444",background:"none",border:"none",cursor:"pointer"}}>
            Delete Class
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Student Share Button (used in the Parent Dashboard) ─────────────
// v6.7: code is encrypted with the teacher's class code. The class code
// is shared out-of-band by the teacher. We do NOT persist it — it's
// re-entered each time a code is generated. This keeps the device free
// of class-key material between shares.
export function ShareProgressButton({ profile }) {
  const [step, setStep] = useState("idle"); // idle | enter-code | code-ready
  const [classCode, setClassCode] = useState("");
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("idle"); setClassCode(""); setCode(null); setCopied(false); setError("");
  };

  const handleGenerate = async () => {
    setError("");
    const cc = classCode.trim().toUpperCase();
    if (!cc) { setError("Please enter your class code"); return; }
    if (cc.length < 4) { setError("Class codes are at least 4 characters"); return; }
    setBusy(true);
    try {
      const encrypted = await encryptStudentProgress(profile, cc);
      setCode(encrypted);
      setStep("code-ready");
    } catch (e) {
      console.error(e);
      setError("Could not generate code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (step === "idle") {
    return (
      <button onClick={() => setStep("enter-code")} aria-label="Generate an encrypted progress code to share with your teacher" style={{
        display:"flex",alignItems:"center",gap:8,padding:"12px 14px",
        background:"#F8FAFC",border:"1px solid #E2E8F0",
        borderRadius:12,cursor:"pointer",width:"100%",
      }}>
        <span style={{fontSize:18}}>📤</span>
        <div style={{textAlign:"left"}}>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,color:"#334155"}}>Generate Progress Code</div>
          <div style={{fontSize:10,color:"#94A3B8"}}>Creates an encrypted code for your teacher</div>
        </div>
      </button>
    );
  }

  if (step === "enter-code") {
    return (
      <div style={{padding:"12px 14px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:12}}>
        <p style={{fontSize:12,color:"#334155",fontWeight:600,marginBottom:4}}>Enter your class code</p>
        <p style={{fontSize:11,color:"#64748B",marginBottom:8}}>Your teacher will have given this to you. Without it, your progress can't be read.</p>
        <input type="text" value={classCode} onChange={e => setClassCode(e.target.value.toUpperCase())} placeholder="e.g. ABC123"
          style={{width:"100%",padding:"10px 12px",fontSize:14,border:"2px solid #E2E8F0",borderRadius:8,fontFamily:"monospace",letterSpacing:2,textAlign:"center",marginBottom:8}}
          autoFocus aria-label="Class code" />
        {error && <p role="alert" style={{fontSize:11,color:"#EF4444",marginBottom:8}}>{error}</p>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleGenerate} disabled={busy} style={{
            fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,padding:"8px 18px",border:"none",borderRadius:100,flex:1,
            background:busy ? "#94A3B8" : "linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#fff",cursor:busy ? "default" : "pointer",
          }}>{busy ? "Encrypting…" : "Generate Code"}</button>
          <button onClick={reset} style={{
            fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,padding:"8px 14px",borderRadius:100,
            background:"#fff",border:"1px solid #E2E8F0",color:"#64748B",cursor:"pointer",
          }}>Cancel</button>
        </div>
      </div>
    );
  }

  // step === "code-ready"
  return (
    <div style={{padding:"12px 14px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:12}}>
      <p style={{fontSize:11,color:"#64748B",marginBottom:6}}>Copy this code and give it to the teacher. They'll need your class code to open it.</p>
      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",marginBottom:8,wordBreak:"break-all",fontSize:10,fontFamily:"monospace",color:"#3B82F6",lineHeight:1.4}}>
        {code.substring(0, 80)}…
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={handleCopy} style={{
          fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,padding:"8px 20px",border:"none",borderRadius:100,flex:1,
          background:copied ? "#10B981" : "#3B82F6",color:"#fff",cursor:"pointer",
        }}>
          {copied ? "Copied! ✓" : "Copy Code"}
        </button>
        <button onClick={reset} style={{
          fontFamily:"'Fredoka',sans-serif",fontSize:13,fontWeight:600,padding:"8px 14px",borderRadius:100,
          background:"#fff",border:"1px solid #E2E8F0",color:"#64748B",cursor:"pointer",
        }}>Done</button>
      </div>
    </div>
  );
}
