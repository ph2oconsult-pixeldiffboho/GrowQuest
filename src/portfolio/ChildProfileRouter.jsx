// ═══════════════════════════════════════════════════════════════════════════
// ChildProfileRouter — selects the age-appropriate profile view
//
// Single entry point used by the dashboard. Picks one of:
//   - EarlyYearsProfileView (age 4-6)
//   - PrimaryProfileView (age 7-9)
//   - IntermediateProfileView (age 10-12)
//
// Falls back to PrimaryProfileView if ageGroup is missing/unknown — that
// view is the most universally-readable.
// ═══════════════════════════════════════════════════════════════════════════

import EarlyYearsProfileView from "./EarlyYearsProfileView.jsx";
import PrimaryProfileView from "./PrimaryProfileView.jsx";
import IntermediateProfileView from "./IntermediateProfileView.jsx";

export default function ChildProfileRouter({ data, onBack, onSpeak }) {
  if (!data) return null;

  switch (data.ageGroup) {
    case "early":
      return <EarlyYearsProfileView data={data} onBack={onBack} onSpeak={onSpeak} />;
    case "intermediate":
      return <IntermediateProfileView data={data} onBack={onBack} />;
    case "primary":
    default:
      return <PrimaryProfileView data={data} onBack={onBack} />;
  }
}
