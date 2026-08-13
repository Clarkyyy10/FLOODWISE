// FloodWise Evidence Engine
// Turns raw community reports into a road condition + Road Reliability Index (RRI).
//
// Hard rules baked in here (from the safety spec):
//  - AI is only ONE input, never the sole determinant.
//  - "Unknown" is never treated as safe.
//  - Old reports lose influence (freshness decay).
//  - Official closures override everything.

import { REPORT_FRESH_MS, REPORT_LIFETIME_MS } from "./constants";
import type {
  Report,
  RoadCondition,
  RoadStatus,
  VehiclePassability,
  PedestrianCondition,
} from "./types";

/** 1.0 for a brand-new report, decaying linearly to 0 at REPORT_LIFETIME_MS. */
export function freshnessWeight(createdAt: number, now = Date.now()): number {
  const age = now - createdAt;
  if (age <= REPORT_FRESH_MS) return 1;
  if (age >= REPORT_LIFETIME_MS) return 0;
  const span = REPORT_LIFETIME_MS - REPORT_FRESH_MS;
  return 1 - (age - REPORT_FRESH_MS) / span;
}

/** Whether a report is old enough that it should be treated as expired. */
export function isExpired(createdAt: number, now = Date.now()): boolean {
  return now - createdAt >= REPORT_LIFETIME_MS;
}

/** Community confirmation adjustment: agreement boosts, disputes shrink weight. */
export function confirmationFactor(report: Report): number {
  let factor = 1;
  for (const c of report.confirmations) {
    if (c.vote === "still_accurate") factor += 0.25;
    else if (c.vote === "situation_changed") factor -= 0.2;
    else if (c.vote === "appears_incorrect") factor -= 0.4;
  }
  return Math.max(0.1, Math.min(2, factor));
}

/** AI is a soft signal only — it nudges weight, it cannot set status. */
export function aiFactor(report: Report): number {
  if (!report.ai) return 1;
  let factor = 1;
  if (report.ai.consistentWithReport) factor += 0.15;
  else factor -= 0.25;
  if (!report.ai.imageQualityOk) factor -= 0.1;
  if (report.ai.confidence === "high") factor += 0.1;
  if (report.ai.confidence === "low") factor -= 0.1;
  return Math.max(0.3, Math.min(1.6, factor));
}

// Map report field enums onto the 4-state road status scale.
const VEHICLE_TO_STATUS: Record<VehiclePassability, RoadStatus> = {
  passable: "passable",
  caution: "caution",
  not_passable: "avoid",
  cannot_determine: "unknown",
};
const PEDESTRIAN_TO_STATUS: Record<PedestrianCondition, RoadStatus> = {
  lower_risk: "passable",
  caution: "caution",
  unsafe: "avoid",
  cannot_determine: "unknown",
};

const SEVERITY: Record<Exclude<RoadStatus, "unknown" | "closed">, number> = {
  passable: 0,
  caution: 1,
  avoid: 2,
};

interface WeightedSample {
  status: RoadStatus;
  weight: number;
}

/** Combine weighted samples into a single status + an agreement measure (0..1). */
function reduceStatus(samples: WeightedSample[]): {
  status: RoadStatus;
  totalWeight: number;
  agreement: number;
} {
  const known = samples.filter((s) => s.status !== "unknown" && s.weight > 0);
  const totalWeight = known.reduce((sum, s) => sum + s.weight, 0);

  if (totalWeight <= 0.05) {
    return { status: "unknown", totalWeight: 0, agreement: 0 };
  }

  const mean =
    known.reduce(
      (sum, s) => sum + SEVERITY[s.status as keyof typeof SEVERITY] * s.weight,
      0,
    ) / totalWeight;

  // Weighted variance -> agreement (low variance = high agreement).
  const variance =
    known.reduce((sum, s) => {
      const d = SEVERITY[s.status as keyof typeof SEVERITY] - mean;
      return sum + d * d * s.weight;
    }, 0) / totalWeight;
  const agreement = 1 / (1 + variance); // 1 when unanimous, lower when conflicting

  let status: RoadStatus;
  if (mean < 0.5) status = "passable";
  else if (mean < 1.5) status = "caution";
  else status = "avoid";

  return { status, totalWeight, agreement };
}

export interface EngineInput {
  roadId: string;
  reports: Report[];
  officialClosure?: boolean;
  now?: number;
}

/** Core: compute the live RoadCondition for a single road. */
export function computeRoadCondition(input: EngineInput): RoadCondition {
  const now = input.now ?? Date.now();
  const officialClosure = input.officialClosure ?? false;

  const active = input.reports.filter(
    (r) => r.roadId === input.roadId && !isExpired(r.createdAt, now) && r.status !== "rejected",
  );

  const lastUpdated = active.length
    ? Math.max(...active.map((r) => r.createdAt))
    : null;

  // Per-report combined weight.
  const weightOf = (r: Report) =>
    freshnessWeight(r.createdAt, now) * confirmationFactor(r) * aiFactor(r);

  const vehicle = reduceStatus(
    active.map((r) => ({ status: VEHICLE_TO_STATUS[r.vehicle], weight: weightOf(r) })),
  );
  const pedestrian = reduceStatus(
    active.map((r) => ({ status: PEDESTRIAN_TO_STATUS[r.pedestrian], weight: weightOf(r) })),
  );

  // Overall = the more severe of the two lenses (safety-first).
  let overall: RoadStatus = worst(vehicle.status, pedestrian.status);

  if (officialClosure) {
    overall = "closed";
  }

  const reliability = officialClosure
    ? 100
    : computeRRI({
        totalWeight: Math.max(vehicle.totalWeight, pedestrian.totalWeight),
        agreement: Math.min(
          vehicle.status === "unknown" ? 1 : vehicle.agreement,
          pedestrian.status === "unknown" ? 1 : pedestrian.agreement,
        ),
        reportCount: active.length,
        lastUpdated,
        now,
      });

  return {
    roadId: input.roadId,
    status: overall,
    vehicleStatus: officialClosure ? "closed" : vehicle.status,
    pedestrianStatus: officialClosure ? "closed" : pedestrian.status,
    reliability,
    lastUpdated,
    reportCount: active.length,
    officialClosure,
  };
}

function worst(a: RoadStatus, b: RoadStatus): RoadStatus {
  const rank: Record<RoadStatus, number> = {
    passable: 1,
    unknown: 2, // unknown outranks passable — never treat unknown as safe
    caution: 3,
    avoid: 4,
    closed: 5,
  };
  return rank[a] >= rank[b] ? a : b;
}

interface RRIInput {
  totalWeight: number;
  agreement: number; // 0..1
  reportCount: number;
  lastUpdated: number | null;
  now: number;
}

/**
 * Road Reliability Index (0..100). Combines:
 *  - evidence volume (total weighted reports)
 *  - agreement between observations
 *  - recency of the latest report
 * This is intentionally tunable — the spec defines the inputs, not fixed weights.
 */
export function computeRRI(inp: RRIInput): number {
  if (inp.reportCount === 0 || inp.lastUpdated === null) return 0;

  // Volume: saturating curve — diminishing returns past ~4 weighted reports.
  const volume = 1 - Math.exp(-inp.totalWeight / 2);

  // Recency: 1.0 if latest report is fresh, decaying with age.
  const recency = freshnessWeight(inp.lastUpdated, inp.now);

  const score = 100 * (0.45 * volume + 0.3 * inp.agreement + 0.25 * recency);
  return Math.round(Math.max(0, Math.min(100, score)));
}
