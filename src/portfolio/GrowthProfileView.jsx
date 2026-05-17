// ═══════════════════════════════════════════════════════════════════════════
// GrowthProfileView — in-app HTML view of the child's portfolio
//
// Renders portfolio data produced by buildPortfolioData(). Used:
//   - As the standalone "[Name]'s Growth Profile" screen the child sees
//   - As the source for PDF generation (v6.8.1, when we ship PDF export)
//
// Self-contained — no external dependencies beyond React and the portfolio
// data. Inline styles so it can be rendered into any container.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";

export default function GrowthProfileView({ data, onBack, onExportPdf }) {
  const [expandedSub, setExpandedSub] = useState(null);

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
        No portfolio data available yet.
      </div>
    );
  }

  const title = `${data.displayName}'s Growth Profile`;
  const dateStr = new Date(data.generatedAt).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFC", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
        color: "#fff",
        padding: "24px 20px 32px",
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
        <h1 style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 6,
        }}>{title}</h1>
        <p style={{ fontSize: 13, opacity: 0.85 }}>Generated {dateStr}</p>
        <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 12, opacity: 0.9 }}>
          <span><strong>{data.totalQuests}</strong> quests completed</span>
          {data.streak > 0 && <span><strong>{data.streak}</strong> {data.streak === 1 ? "day" : "days"} · came back</span>}
          <span>{ageGroupLabel(data.ageGroup)}</span>
        </div>
        {onExportPdf && (
          <button onClick={onExportPdf} style={{
            marginTop: 18,
            fontFamily: "'Fredoka',sans-serif",
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 22px",
            border: "2px solid rgba(255,255,255,.3)",
            borderRadius: 100,
            background: "rgba(255,255,255,.15)",
            color: "#fff",
            cursor: "pointer",
          }}>📄 Download PDF</button>
        )}
      </div>

      {/* Intro */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{
          background: "#fff",
          borderRadius: 14,
          padding: 16,
          marginBottom: 18,
          boxShadow: "0 2px 12px rgba(0,0,0,.04)",
          border: "1px solid #E2E8F0",
        }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
            This profile shows {data.displayName}'s growth across BC's Core Competencies.
            Each competency has sub-competencies that develop over time. Profile levels
            describe what {data.displayName} can do — not a grade or rank, but a snapshot
            of growing skills.
          </p>
        </div>
      </div>

      {/* Competencies */}
      {data.competencies.map((comp) => (
        <CompetencyBlock
          key={comp.key}
          comp={comp}
          expandedSub={expandedSub}
          setExpandedSub={setExpandedSub}
          displayName={data.displayName}
        />
      ))}

      {/* Footer note */}
      <div style={{ padding: "8px 20px 32px" }}>
        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", lineHeight: 1.5 }}>
          BC Core Competency profiles are developmental — children grow at their own pace
          and may be at different levels across different areas. This profile is a tool
          for noticing growth, not a final assessment.
        </p>
      </div>
    </div>
  );
}

function CompetencyBlock({ comp, expandedSub, setExpandedSub, displayName }) {
  return (
    <div style={{ padding: "0 20px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{comp.icon}</span>
        <h2 style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 18,
          color: "#334155",
        }}>{comp.name}</h2>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>· {comp.realm}</span>
      </div>

      {comp.subCompetencies.map((sub) => {
        const isExpanded = expandedSub === `${comp.key}-${sub.key}`;
        return (
          <SubCompetencyBlock
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

function SubCompetencyBlock({ sub, compColor, isExpanded, onToggle, displayName }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,.03)",
      border: "1px solid #E2E8F0",
    }}>
      <div onClick={onToggle} style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontFamily: "'Fredoka',sans-serif",
            fontSize: 14,
            color: "#475569",
            marginBottom: 4,
          }}>{sub.name}</h3>
          <p style={{ fontSize: 11, color: "#94A3B8" }}>
            {sub.hasArtifacts
              ? `${sub.evidence.length} ${sub.evidence.length === 1 ? "example" : "examples"}`
              : "Not yet explored"}
          </p>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: compColor,
          background: `${compColor}12`,
          padding: "4px 12px",
          borderRadius: 100,
          marginLeft: 12,
        }}>Profile {sub.currentProfileLevel}</span>
        <span style={{
          fontSize: 18,
          color: "#94A3B8",
          marginLeft: 8,
          transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
          transition: "transform .2s",
        }}>⌄</span>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
          {/* Current profile */}
          <div style={{
            background: "#F8FAFC",
            borderRadius: 10,
            padding: "10px 12px",
            borderLeft: `3px solid ${compColor}`,
            marginBottom: 10,
          }}>
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              color: compColor,
              marginBottom: 3,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>What {displayName} can do now</p>
            <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
              "{sub.currentProfileStatement}"
            </p>
          </div>

          {/* Next profile */}
          {sub.nextProfileStatement && (
            <div style={{
              padding: "8px 12px",
              background: "#FFFBEB",
              borderRadius: 10,
              border: "1px dashed #FCD34D",
              marginBottom: 10,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#B45309", marginBottom: 2 }}>
                ⭐ Growing toward Profile {sub.nextProfileLevel}
              </p>
              <p style={{ fontSize: 12, color: "#78716C", lineHeight: 1.4 }}>
                "{sub.nextProfileStatement}"
              </p>
            </div>
          )}

          {/* Evidence */}
          {sub.evidence.length > 0 ? (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                Evidence of growth:
              </p>
              {sub.evidence.slice(0, 3).map((ev, ei) => (
                <EvidenceItem key={ei} ev={ev} />
              ))}
              {sub.evidence.length > 3 && (
                <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 6 }}>
                  + {sub.evidence.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5, fontStyle: "italic" }}>
              {displayName} has not yet explored this competency. Try a quest in this area
              to start building evidence of growth.
            </p>
          )}

          {/* Teacher comment draft */}
          {sub.hasArtifacts && (
            <details style={{ marginTop: 12 }}>
              <summary style={{
                fontSize: 11,
                color: "#6366F1",
                fontWeight: 700,
                cursor: "pointer",
                padding: "6px 0",
              }}>📝 Suggested report card comment</summary>
              <div style={{
                marginTop: 6,
                padding: 12,
                background: "#EEF2FF",
                borderRadius: 10,
                fontSize: 12,
                color: "#334155",
                lineHeight: 1.6,
              }}>
                {sub.teacherCommentDraft}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceItem({ ev }) {
  const typeIcon = {
    voice: "🎤", text: "✍️", emoji: "😊", drawing: "🎨",
  }[ev.responseType] || "📝";

  return (
    <div style={{
      padding: "10px 12px",
      background: "#FAFBFC",
      borderRadius: 8,
      marginBottom: 6,
      border: "1px solid #F1F5F9",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
          {typeIcon} {ev.questTitle}
        </span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>{ev.date}</span>
      </div>
      {ev.response && (
        <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, fontStyle: "italic" }}>
          "{truncate(ev.response, 140)}"
        </p>
      )}
      {ev.reflectionText && (
        <p style={{ fontSize: 11, color: "#10B981", marginTop: 4, lineHeight: 1.5 }}>
          💭 {truncate(ev.reflectionText, 120)}
        </p>
      )}
      {!ev.response && !ev.reflectionText && (
        <p style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>
          Earned ⭐ {ev.stars}
        </p>
      )}
    </div>
  );
}

function ageGroupLabel(ag) {
  return { early: "Early Years (4-6)", primary: "Primary (7-9)", intermediate: "Intermediate (10-12)" }[ag] || ag;
}

function truncate(s, n) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1).trim() + "…";
}
