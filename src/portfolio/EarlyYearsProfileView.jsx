// ═══════════════════════════════════════════════════════════════════════════
// EarlyYearsProfileView — for children aged 4-6.
//
// Design principles for this view:
//   - Reading is hard; rely on icons, colours, and avatar character
//   - No progression numbers anywhere — visual sprout/plant/tree only
//   - No statistics, no assessment language, no teacher comment section
//   - Big tap targets, generous spacing
//   - Tap-to-hear 🔊 button on each section instead of auto-narration
// ═══════════════════════════════════════════════════════════════════════════

import { renderEncouragement } from "./encouragementTemplates.js";

// Visual progression: 6 levels mapped to 3 growth stages.
// L1-L2 = 🌱 (sprout), L3-L4 = 🌿 (plant), L5-L6 = 🌳 (tree).
function growthEmoji(level) {
  if (level <= 2) return "🌱";
  if (level <= 4) return "🌿";
  return "🌳";
}

export default function EarlyYearsProfileView({ data, onBack, onSpeak }) {
  if (!data) return null;

  const intro = renderEncouragement("early", "profileIntro", {
    name: data.displayName,
    avatarName: data.avatarName,
    questCount: data.totalQuests,
  });

  const summary = renderEncouragement("early", "profileSummary", {
    name: data.displayName,
    avatarName: data.avatarName,
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #FEF3C7, #FCE7F3, #E0E7FF)", paddingBottom: 60 }}>
      {/* Big friendly header */}
      <div style={{ padding: "20px 20px 24px", textAlign: "center" }}>
        {onBack && (
          <button onClick={onBack} style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "rgba(255,255,255,.7)",
            border: "none",
            borderRadius: 100,
            padding: "10px 18px",
            color: "#475569",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}>← Back</button>
        )}
        <div style={{ fontSize: 80, margin: "20px 0 8px", animation: "bounce 2s ease-in-out infinite" }}>
          {data.avatarEvolution || "🦊"}
        </div>
        <h1 style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: "#475569",
          marginBottom: 4,
        }}>{data.displayName}'s Profile</h1>
        {intro && (
          <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.5, marginTop: 8 }}>
            {intro}
            {onSpeak && (
              <button onClick={() => onSpeak(intro)} aria-label="Read aloud" style={{
                marginLeft: 8,
                background: "rgba(99,102,241,.12)",
                border: "none",
                borderRadius: 100,
                padding: "4px 10px",
                fontSize: 14,
                cursor: "pointer",
              }}>🔊</button>
            )}
          </p>
        )}
      </div>

      {/* Competency blocks — each is a tile, no expansion needed */}
      {data.competencies.map((comp) => (
        <CompetencyBlock key={comp.key} comp={comp} onSpeak={onSpeak} />
      ))}

      {/* Closing line */}
      {summary && (
        <div style={{ padding: "16px 24px", textAlign: "center" }}>
          <p style={{
            fontFamily: "'Fredoka',sans-serif",
            fontSize: 17,
            color: "#475569",
            lineHeight: 1.4,
          }}>{summary}</p>
        </div>
      )}
    </div>
  );
}

function CompetencyBlock({ comp, onSpeak }) {
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "0 4px" }}>
        <span style={{ fontSize: 28 }}>{comp.icon}</span>
        <h2 style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 20,
          color: comp.color,
        }}>{comp.name}</h2>
      </div>

      {comp.subCompetencies.map((sub) => (
        <SubCompetencyTile key={sub.key} sub={sub} compColor={comp.color} onSpeak={onSpeak} />
      ))}
    </div>
  );
}

function SubCompetencyTile({ sub, compColor, onSpeak }) {
  const hasQuests = sub.hasArtifacts;
  const enc = renderEncouragement(
    "early",
    hasQuests ? "subHasQuests" : "subNoQuests",
    { subName: sub.name }
  );

  const statement = sub.currentProfileStatement;
  const speakText = hasQuests
    ? `${sub.name}. ${statement}. ${enc}`
    : `${sub.name}. ${enc}`;

  return (
    <div style={{
      background: hasQuests ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.45)",
      borderRadius: 18,
      padding: 16,
      marginBottom: 10,
      boxShadow: "0 2px 12px rgba(0,0,0,.05)",
      border: hasQuests ? `2px solid ${compColor}30` : "2px dashed rgba(148,163,184,.4)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{
          fontFamily: "'Fredoka',sans-serif",
          fontSize: 16,
          color: "#475569",
        }}>{sub.name}</h3>
        {hasQuests && (
          <span style={{ fontSize: 28, lineHeight: 1 }}>
            {growthEmoji(sub.currentProfileLevel)}
          </span>
        )}
      </div>

      {hasQuests ? (
        <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.5, marginBottom: 8 }}>
          {statement}
        </p>
      ) : (
        <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.5, fontStyle: "italic" }}>
          {enc}
        </p>
      )}

      {hasQuests && enc && (
        <p style={{ fontSize: 12, color: compColor, lineHeight: 1.4 }}>
          {enc}
        </p>
      )}

      {onSpeak && (
        <button onClick={() => onSpeak(speakText)} aria-label="Read aloud" style={{
          marginTop: 8,
          background: `${compColor}12`,
          border: "none",
          borderRadius: 100,
          padding: "6px 14px",
          fontSize: 14,
          color: compColor,
          fontWeight: 600,
          cursor: "pointer",
        }}>🔊 Read it to me</button>
      )}
    </div>
  );
}
