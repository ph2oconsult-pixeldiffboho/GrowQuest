// ═══════════════════════════════════════════════════════════════════════════
// PrimaryProfileView — for children aged 7-9.
//
// Design principles:
//   - Reads fluently but still needs warmth
//   - Specific encouragement (process-focused, not "great job")
//   - Visual progression (bars/stamps), no number labels
//   - Empty competencies framed as opportunities, not gaps
//   - Avatar + quest count as the hero — identity + sense of journey
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { renderEncouragement } from "./encouragementTemplates.js";

export default function PrimaryProfileView({ data, onBack }) {
  const [expandedSub, setExpandedSub] = useState(null);
  if (!data) return null;

  const intro = renderEncouragement("primary", "profileIntro", {
    name: data.displayName,
    questCount: data.totalQuests,
  });

  const summary = renderEncouragement("primary", "profileSummary", {
    name: data.displayName,
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #FAFBFC, #EFF6FF)", paddingBottom: 60 }}>
      <div style={{
        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
        color: "#fff",
        padding: "24px 20px 30px",
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
            marginBottom: 12,
          }}>← Back</button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 56 }}>{data.avatarEvolution || "🦊"}</div>
          <div>
            <h1 style={{
              fontFamily: "'Fredoka',sans-serif",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}>{data.displayName}'s Growth Profile</h1>
            {data.totalQuests > 0 && (
              <p style={{ fontSize: 13, opacity: 0.85 }}>
                You've been on {data.totalQuests} {data.totalQuests === 1 ? "adventure" : "adventures"}
              </p>
            )}
          </div>
        </div>
        {intro && (
          <p style={{ fontSize: 14, opacity: 0.95, lineHeight: 1.5, marginTop: 14 }}>
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
        />
      ))}

      {summary && (
        <div style={{ padding: "12px 24px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{summary}</p>
        </div>
      )}
    </div>
  );
}

function CompetencyBlock({ comp, expandedSub, setExpandedSub }) {
  return (
    <div style={{ padding: "18px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{comp.icon}</span>
        <h2 style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 17,
          color: "#334155",
        }}>{comp.name}</h2>
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
          />
        );
      })}
    </div>
  );
}

function SubCompetencyCard({ sub, compColor, isExpanded, onToggle }) {
  const hasQuests = sub.hasArtifacts;
  // v6.7.20: replaced the 6-stamp "level reached" bar with a row of quest-dots.
  // Shows up to 8 dots representing recent quests tried in this sub-competency.
  // This is evidence of practice, not position on a 6-step ladder.
  const questDotCount = Math.min(sub.evidence?.length || 0, 8);
  const questDots = Array.from({ length: 8 }, (_, i) => i < questDotCount);

  const enc = renderEncouragement(
    "primary",
    hasQuests ? "subHasQuests" : "subNoQuests",
    { subName: sub.name }
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

        {/* Stamp progression row */}
        {hasQuests && (
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
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

        {/* Headline: kid-friendly statement (no "Profile N") */}
        {hasQuests ? (
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, marginBottom: 6 }}>
            {sub.currentProfileStatement}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, fontStyle: "italic", marginBottom: 6 }}>
            {enc}
          </p>
        )}

        {hasQuests && enc && (
          <p style={{ fontSize: 12, color: compColor, lineHeight: 1.4 }}>
            {enc}
          </p>
        )}
      </div>

      {/* Expanded: show recent quests as a friendly list */}
      {isExpanded && hasQuests && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
            Things you've done:
          </p>
          {sub.evidence.slice(0, 3).map((ev, ei) => (
            <RecentQuestRow key={ei} ev={ev} />
          ))}
        </div>
      )}

      {/* Expanded: hint of what's next */}
      {isExpanded && hasQuests && sub.nextProfileStatement && (
        <div style={{
          marginTop: 10,
          padding: "8px 12px",
          background: "#FFFBEB",
          borderRadius: 10,
          border: "1px dashed #FCD34D",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#B45309", marginBottom: 2 }}>
            🌱 Growing toward...
          </p>
          <p style={{ fontSize: 12, color: "#78716C", lineHeight: 1.4 }}>
            {sub.nextProfileStatement}
          </p>
        </div>
      )}
    </div>
  );
}

function RecentQuestRow({ ev }) {
  const typeIcon = { voice: "🎤", text: "✍️", emoji: "😊", drawing: "🎨" }[ev.responseType] || "📝";
  return (
    <div style={{
      padding: "8px 10px",
      background: "#FAFBFC",
      borderRadius: 8,
      marginBottom: 6,
      border: "1px solid #F1F5F9",
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
        {typeIcon} {ev.questTitle}
      </p>
      {ev.response && (
        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4, fontStyle: "italic", marginTop: 2 }}>
          "{truncate(ev.response, 100)}"
        </p>
      )}
    </div>
  );
}

function truncate(s, n) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1).trim() + "…";
}
