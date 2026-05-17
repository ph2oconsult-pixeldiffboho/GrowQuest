// ═══════════════════════════════════════════════════════════════════════════
// IntermediateProfileView — for children aged 10-12.
//
// Design principles:
//   - Treat them as capable; substantive language, not patronising
//   - Visual progression (bars/stamps), still no "Profile N" labels
//   - Empty competencies framed as opportunities with hooks
//   - Identity-aware framing — "you've been working through" not "great job"
//   - Avatar + a one-line personal-voice summary as hero
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { renderEncouragement } from "./encouragementTemplates.js";

export default function IntermediateProfileView({ data, onBack }) {
  const [expandedSub, setExpandedSub] = useState(null);
  if (!data) return null;

  const intro = renderEncouragement("intermediate", "profileIntro", {
    name: data.displayName,
    questCount: data.totalQuests,
  });

  const summary = renderEncouragement("intermediate", "profileSummary", {
    name: data.displayName,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFC", paddingBottom: 60 }}>
      <div style={{
        background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
        color: "#fff",
        padding: "26px 20px 32px",
        borderRadius: "0 0 24px 24px",
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,.15)",
            border: "none",
            borderRadius: 100,
            padding: "8px 16px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 14,
          }}>← Back</button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 52 }}>{data.avatarEvolution || "🦊"}</div>
          <div>
            <h1 style={{
              fontFamily: "'Fredoka',sans-serif",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}>{data.displayName}'s Growth Profile</h1>
            <p style={{ fontSize: 12, opacity: 0.85 }}>
              {data.totalQuests} quests · {data.streak > 0 ? `${data.streak} ${data.streak === 1 ? "day" : "days"} · came back` : "Welcome back"}
            </p>
          </div>
        </div>
        {intro && (
          <p style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.6 }}>
            {intro}
          </p>
        )}
      </div>

      {data.competencies.map((comp) => (
        <CompetencyBlock
          key={comp.key}
          comp={comp}
          expandedSub={expandedSub}
          setExpandedSub={setExpandedSub}
          displayName={data.displayName}
        />
      ))}

      {summary && (
        <div style={{ padding: "12px 24px 24px" }}>
          <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, fontStyle: "italic" }}>
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

function CompetencyBlock({ comp, expandedSub, setExpandedSub, displayName }) {
  return (
    <div style={{ padding: "18px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{comp.icon}</span>
        <h2 style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 16,
          color: "#334155",
        }}>{comp.name}</h2>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>· {comp.realm}</span>
      </div>

      {comp.subCompetencies.map((sub) => {
        const isExpanded = expandedSub === `${comp.key}-${sub.key}`;
        return (
          <SubCompetencyCard
            key={sub.key}
            sub={sub}
            compColor={comp.color}
            isExpanded={isExpanded}
            onToggle={() => setExpandedSub(isExpanded ? null : `${comp.key}-${sub.key}`)}
            displayName={displayName}
          />
        );
      })}
    </div>
  );
}

function SubCompetencyCard({ sub, compColor, isExpanded, onToggle, displayName }) {
  const hasQuests = sub.hasArtifacts;
  // v6.7.20: replaced 6-of-6 ranking stamps with quest-dots showing
  // how many quests have been tried in this sub-competency.
  const questDotCount = Math.min(sub.evidence?.length || 0, 8);
  const questDots = Array.from({ length: 8 }, (_, i) => i < questDotCount);

  const enc = renderEncouragement(
    "intermediate",
    hasQuests ? "subHasQuests" : "subNoQuests",
    { subName: sub.name, name: displayName }
  );

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
      border: "1px solid #E2E8F0",
    }}>
      <div onClick={onToggle} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{
            fontFamily: "'Fredoka',sans-serif",
            fontSize: 14,
            color: "#475569",
          }}>{sub.name}</h3>
          <span style={{ fontSize: 14, color: "#94A3B8", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>⌄</span>
        </div>

        {hasQuests && (
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {questDots.map((lit, i) => (
              <div key={i} style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: lit ? compColor : "#F1F5F9",
                transition: "background .3s",
              }} />
            ))}
          </div>
        )}

        {hasQuests ? (
          <>
            <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, marginBottom: 8 }}>
              {sub.currentProfileStatement}
            </p>
            {enc && (
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, fontStyle: "italic" }}>
                {enc}
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}>
            {enc}
          </p>
        )}
      </div>

      {isExpanded && hasQuests && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
            Recent work in {sub.name}:
          </p>
          {sub.evidence.slice(0, 4).map((ev, ei) => (
            <EvidenceRow key={ei} ev={ev} />
          ))}

          {sub.nextProfileStatement && (
            <div style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "#EEF2FF",
              borderRadius: 10,
              border: "1px solid #C7D2FE",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#4338CA", marginBottom: 3 }}>
                What's next
              </p>
              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                {sub.nextProfileStatement}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceRow({ ev }) {
  const typeIcon = { voice: "🎤", text: "✍️", emoji: "😊", drawing: "🎨" }[ev.responseType] || "📝";
  return (
    <div style={{
      padding: "10px 12px",
      background: "#FAFBFC",
      borderRadius: 8,
      marginBottom: 6,
      border: "1px solid #F1F5F9",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
          {typeIcon} {ev.questTitle}
        </span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>{ev.date}</span>
      </div>
      {ev.response && (
        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, fontStyle: "italic" }}>
          "{truncate(ev.response, 130)}"
        </p>
      )}
      {ev.reflectionText && (
        <p style={{ fontSize: 11, color: "#10B981", marginTop: 4, lineHeight: 1.4 }}>
          💭 {truncate(ev.reflectionText, 120)}
        </p>
      )}
    </div>
  );
}

function truncate(s, n) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1).trim() + "…";
}
