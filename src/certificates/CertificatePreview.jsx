// ═══════════════════════════════════════════════════════════════════
// Certificate Preview & Download Component
// Shows a styled HTML preview of the certificate and triggers
// jsPDF generation on download
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { generateCertificate } from "./generateCertificate.js";

const CONTEXT_LABELS = {
  solo: "Independent work",
  with_family: "Family activities",
  with_peers: "Peer collaboration",
  classroom: "Classroom setting",
  community: "Community engagement",
};

const SUB_NAMES = {
  communicating: "Communicating",
  collaborating: "Collaborating",
  creativeThinking: "Creative Thinking",
  criticalThinking: "Critical & Reflective Thinking",
  positiveIdentity: "Positive Personal & Cultural Identity",
  personalAwareness: "Personal Awareness & Responsibility",
  socialAwareness: "Social Awareness & Responsibility",
};

const COMP_COLORS = {
  communicating: "#2563EB",
  collaborating: "#2563EB",
  creativeThinking: "#7C3AED",
  criticalThinking: "#7C3AED",
  positiveIdentity: "#059669",
  personalAwareness: "#059669",
  socialAwareness: "#059669",
};

export default function CertificatePreview({
  childName,
  subCompetencyKey,
  profileLevel,
  profileText,
  evidenceSummary,
  dateEarned,
  avatarName,
  avatarEmoji,
  onClose,
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const subName = SUB_NAMES[subCompetencyKey] || subCompetencyKey;
  const color = COMP_COLORS[subCompetencyKey] || "#2563EB";
  const quests = (evidenceSummary?.questTitles || []).slice(0, 4);
  const contexts = (evidenceSummary?.contexts || []).slice(0, 4);

  const handleDownload = () => {
    setDownloading(true);
    try {
      generateCertificate({
        childName,
        subCompetencyKey,
        profileLevel,
        evidenceSummary: evidenceSummary || { questTitles: [], contexts: [], reflections: [], evidenceCount: 0 },
        dateEarned: dateEarned || new Date().toLocaleDateString("en-CA"),
        avatarName,
      });
      setDownloaded(true);
    } catch (e) {
      console.error("Certificate generation failed:", e);
    }
    setDownloading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Certificate Preview Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(160deg, #F8FAFC, #EFF6FF)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          animation: "fadeSlideUp 0.5s ease-out forwards",
        }}
      >
        {/* Top accent */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, #F59E0B)` }} />

        <div style={{ padding: "20px 24px 24px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
              GrowQuest BC
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
              {Array.from({ length: profileLevel }, (_, i) => (
                <span key={i} style={{ color: "#F59E0B", fontSize: 14 }}>★</span>
              ))}
            </div>
            <h2
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 22,
                color: "#0F172A",
                marginBottom: 4,
              }}
            >
              Growth Certificate
            </h2>
            <p style={{ fontSize: 12, color: "#64748B" }}>This certifies that</p>
          </div>

          {/* Child's name */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <h3
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 24,
                color,
                marginBottom: 2,
              }}
            >
              {childName}
            </h3>
            <div style={{ width: "60%", height: 1, background: "#F59E0B", margin: "0 auto", opacity: 0.5 }} />
          </div>

          {/* Competency */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>
              has demonstrated consistent growth in
            </p>
            <h4
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 16,
                color: "#0F172A",
                marginBottom: 2,
              }}
            >
              {subName}
            </h4>
            <p style={{ fontSize: 10, color: "#94A3B8" }}>Profile {profileLevel} of 6</p>
          </div>

          {/* Profile statement */}
          <div
            style={{
              background: `${color}08`,
              borderLeft: `3px solid ${color}`,
              borderRadius: "0 10px 10px 0",
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#334155",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              "{profileText}"
            </p>
          </div>

          {/* Evidence */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            {quests.length > 0 && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Evidence
                </p>
                {quests.map((q, i) => (
                  <p key={i} style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>• {q}</p>
                ))}
              </div>
            )}
            {contexts.length > 0 && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Contexts
                </p>
                {contexts.map((ctx, i) => (
                  <p key={i} style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>
                    • {CONTEXT_LABELS[ctx] || ctx}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #E2E8F0",
              paddingTop: 10,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 10, color: "#94A3B8" }}>{dateEarned}</span>
            {avatarName && (
              <span style={{ fontSize: 10, color: "#94A3B8" }}>
                {avatarEmoji} {avatarName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, width: "100%", maxWidth: 420 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            padding: "13px 20px",
            border: "2px solid rgba(255,255,255,0.15)",
            borderRadius: 100,
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Close
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            flex: 2,
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            padding: "13px 20px",
            border: "none",
            borderRadius: 100,
            background: downloaded
              ? "linear-gradient(135deg, #10B981, #059669)"
              : "linear-gradient(135deg, #F59E0B, #EF4444)",
            color: "#fff",
            cursor: downloading ? "wait" : "pointer",
            transition: "all 0.3s",
          }}
        >
          {downloaded ? "Downloaded! ✓" : downloading ? "Generating..." : "Download PDF 📄"}
        </button>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 12, textAlign: "center" }}>
        Print this certificate and celebrate your growth!
      </p>
    </div>
  );
}
