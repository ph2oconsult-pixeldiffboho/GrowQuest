import React, { useState, lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const AppEN = lazy(() => import('./App.jsx'))
const AppFR = lazy(() => import('./AppFR.jsx'))

function LangRouter() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("gq_lang") || null } catch(e) { return null }
  })

  const chooseLang = (l) => {
    setLang(l)
    try { localStorage.setItem("gq_lang", l) } catch(e) {}
  }

  // Language selector
  if (!lang) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#0F172A 0%,#1E293B 30%,#1E3A5F 60%,#0F172A 100%)",padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{textAlign:"center",animation:"fadeSlideUp 0.5s ease-out forwards"}}>
        <div style={{fontSize:72,marginBottom:16,animation:"float 3s ease-in-out infinite"}}>🌿</div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:"clamp(32px,7vw,48px)",fontWeight:700,background:"linear-gradient(135deg,#60A5FA,#A78BFA,#34D399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.1,marginBottom:24}}>
          GrowQuest<span style={{fontSize:"0.6em",verticalAlign:"super"}}>BC</span>
        </h1>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:15,marginBottom:32}}>
          Choose Your Language / Choisis ta langue
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:280,margin:"0 auto"}}>
          <button onClick={() => chooseLang("en")} style={{fontFamily:"'Fredoka',sans-serif",fontSize:20,fontWeight:600,padding:"18px 36px",border:"none",borderRadius:16,background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            🇬🇧 English
          </button>
          <button onClick={() => chooseLang("fr")} style={{fontFamily:"'Fredoka',sans-serif",fontSize:20,fontWeight:600,padding:"18px 36px",border:"none",borderRadius:16,background:"linear-gradient(135deg,#EF4444,#DC2626)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            🇫🇷 Français
          </button>
        </div>
        <p style={{color:"rgba(255,255,255,0.15)",fontSize:9,marginTop:40}}>v5.0 — bilingual</p>
      </div>
    </div>
  )

  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F172A",color:"#fff",fontFamily:"'Fredoka',sans-serif",fontSize:18}}>Loading...</div>}>
      {lang === "fr" ? <AppFR onChangeLang={() => { localStorage.removeItem("gq_lang"); setLang(null) }} /> : <AppEN onChangeLang={() => { localStorage.removeItem("gq_lang"); setLang(null) }} />}
    </Suspense>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangRouter />
  </React.StrictMode>,
)
