import type { RoadCondition, Report } from "./types";
import { isExpired } from "./reliability";

// Evidence confidence = how trustworthy the CURRENT INFORMATION is.
// This is explicitly NOT a guarantee of physical safety.
export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export interface Confidence {
  level: ConfidenceLevel;
  label: string;
  detail: string;
  color: string;
}

export function confidenceFor(cond: RoadCondition): Confidence {
  if (cond.officialClosure) {
    return {
      level: "high",
      label: "Official information",
      detail: "Authoritative LGU/DRRM closure",
      color: "#a78bfa",
    };
  }
  if (cond.reportCount === 0) {
    return {
      level: "unknown",
      label: "Unknown",
      detail: "Insufficient recent information",
      color: "#9ca3af",
    };
  }
  if (cond.reliability >= 75) {
    return {
      level: "high",
      label: "High confidence",
      detail: "Recent reports with strong agreement",
      color: "#22c55e",
    };
  }
  if (cond.reliability >= 45) {
    return {
      level: "medium",
      label: "Medium confidence",
      detail: "Recent community report",
      color: "#eab308",
    };
  }
  return {
    level: "low",
    label: "Low confidence",
    detail: "Old or limited evidence",
    color: "#f97316",
  };
}

// Per-report status glyph for the legend / cards.
export function reportStatusGlyph(report: Report): { glyph: string; label: string } {
  if (isExpired(report.createdAt)) return { glyph: "⌛", label: "Outdated" };
  switch (report.status) {
    case "verified":
      return { glyph: "✓", label: "Verified" };
    case "disputed":
      return { glyph: "⚠", label: "Disputed" };
    case "expired":
      return { glyph: "⌛", label: "Outdated" };
    case "rejected":
      return { glyph: "✕", label: "Rejected" };
    default:
      return { glyph: "◐", label: "Community report" };
  }
}
