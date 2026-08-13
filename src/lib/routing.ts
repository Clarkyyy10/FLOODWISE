import type { RawRoute } from "@/app/api/route/route";
import type {
  Road,
  RoadCondition,
  RoadStatus,
  TravelMode,
  Report,
  Hazard,
} from "./types";
import { minDistanceRoadToRouteM } from "./geo";

type LatLng = [number, number];

const MATCH_THRESHOLD_M = 45; // how close a route must pass to "use" a known road

const RISK_WEIGHT: Record<RoadStatus, number> = {
  passable: 0,
  unknown: 1.5, // unknown is never treated as safe
  caution: 1,
  avoid: 4,
  closed: 99,
};

const MOTO_HAZARDS: Hazard[] = ["slippery", "debris", "strong_current", "road_damage"];

export interface MatchedRoad {
  road: Road;
  cond: RoadCondition;
  lens: RoadStatus; // vehicle or pedestrian status, per travel mode
}

export interface ScoredRoute {
  id: string;
  coordinates: LatLng[];
  distanceM: number;
  durationS: number; // mode-adjusted travel time
  matched: MatchedRoad[];
  riskScore: number;
  riskLabel: "Low" | "Medium" | "Higher";
  reliability: number; // 0..100
  blocked: boolean; // passes an avoid/closed segment
  closures: string[]; // officially closed road names on the route
  floodedAvoided: number;
  lastUpdated: number | null;
  uncertain: boolean;
}

export interface LabeledRoute {
  tag: "Safest" | "Balanced" | "Fastest";
  emoji: string;
  route: ScoredRoute;
}

export interface RouteResult {
  routes: RawRoute[];
  error?: "no_route" | "routing_failed" | "routing_unavailable";
}

export async function fetchRoutes(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<RouteResult> {
  const res = await fetch(
    `/api/route?from=${from[0]},${from[1]}&to=${to[0]},${to[1]}`,
    { signal },
  );
  if (!res.ok) {
    const err =
      res.status === 404
        ? "no_route"
        : res.status === 504
          ? "routing_unavailable"
          : "routing_failed";
    return { routes: [], error: err };
  }
  const data = (await res.json()) as { routes?: RawRoute[] };
  return { routes: data.routes ?? [] };
}

function adjustDuration(mode: TravelMode, raw: RawRoute): number {
  if (mode === "walking") return raw.distanceM / 1.4; // ~5 km/h
  if (mode === "motorcycle") return raw.durationS * 0.9;
  return raw.durationS;
}

export interface ScoreContext {
  roads: Road[];
  conditionFor: (roadId: string) => RoadCondition;
  reports: Report[];
  mode: TravelMode;
}

/** Score a set of raw OSRM routes against current FloodWise conditions. */
export function scoreRoutes(raw: RawRoute[], ctx: ScoreContext): ScoredRoute[] {
  const { roads, conditionFor, reports, mode } = ctx;

  // Network-wide flooded roads (for "roads avoided" transparency).
  const networkFlooded = roads.filter((r) => {
    const c = conditionFor(r.id);
    const lens = mode === "walking" ? c.pedestrianStatus : c.vehicleStatus;
    return lens === "avoid" || lens === "closed";
  }).length;

  return raw.map((route, i) => {
    const matched: MatchedRoad[] = [];
    for (const road of roads) {
      const d = minDistanceRoadToRouteM(road.path, route.coordinates);
      if (d <= MATCH_THRESHOLD_M) {
        const cond = conditionFor(road.id);
        const lens = mode === "walking" ? cond.pedestrianStatus : cond.vehicleStatus;
        matched.push({ road, cond, lens });
      }
    }

    let riskScore = matched.reduce((sum, m) => sum + RISK_WEIGHT[m.lens], 0);

    // Motorcycle: penalize hazards that matter more on two wheels.
    if (mode === "motorcycle") {
      for (const m of matched) {
        const hazardous = reports.some(
          (rep) =>
            rep.roadId === m.road.id &&
            rep.hazards.some((h) => MOTO_HAZARDS.includes(h)),
        );
        if (hazardous) riskScore += 1;
      }
    }

    const reliability = matched.length
      ? Math.round(matched.reduce((s, m) => s + m.cond.reliability, 0) / matched.length)
      : 0;

    const blocked = matched.some((m) => m.lens === "avoid" || m.lens === "closed");
    const closures = matched.filter((m) => m.cond.officialClosure).map((m) => m.road.name);
    const floodedOnRoute = matched.filter(
      (m) => m.lens === "avoid" || m.lens === "closed",
    ).length;
    const floodedAvoided = Math.max(0, networkFlooded - floodedOnRoute);

    const lastUpdatedVals = matched
      .map((m) => m.cond.lastUpdated)
      .filter((v): v is number => v !== null);
    const lastUpdated = lastUpdatedVals.length ? Math.max(...lastUpdatedVals) : null;

    const uncertain = matched.length === 0 || reliability < 40;

    const riskLabel: ScoredRoute["riskLabel"] =
      riskScore >= 4 ? "Higher" : riskScore >= 1.5 ? "Medium" : "Low";

    return {
      id: `route-${i}`,
      coordinates: route.coordinates,
      distanceM: route.distanceM,
      durationS: adjustDuration(mode, route),
      matched,
      riskScore,
      riskLabel,
      reliability,
      blocked,
      closures,
      floodedAvoided,
      lastUpdated,
      uncertain,
    };
  });
}

/** Rank + label scored routes as Safest / Balanced / Fastest. */
export function labelRoutes(scored: ScoredRoute[]): LabeledRoute[] {
  if (scored.length === 0) return [];
  if (scored.length === 1) {
    return [{ tag: "Safest", emoji: "🟢", route: scored[0] }];
  }

  const safest = [...scored].sort(
    (a, b) =>
      Number(a.blocked) - Number(b.blocked) ||
      a.riskScore - b.riskScore ||
      a.durationS - b.durationS,
  )[0];

  const nonBlocked = scored.filter((r) => !r.blocked);
  const fastest = (nonBlocked.length ? nonBlocked : scored).sort(
    (a, b) => a.durationS - b.durationS,
  )[0];

  // Balanced: normalize time + risk, pick best that isn't already chosen.
  const times = scored.map((r) => r.durationS);
  const risks = scored.map((r) => r.riskScore);
  const norm = (v: number, arr: number[]) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return max === min ? 0 : (v - min) / (max - min);
  };
  const balanced = [...scored].sort(
    (a, b) =>
      0.5 * norm(a.durationS, times) +
        0.5 * norm(a.riskScore, risks) -
        (0.5 * norm(b.durationS, times) + 0.5 * norm(b.riskScore, risks)),
  )[0];

  const out: LabeledRoute[] = [
    { tag: "Safest", emoji: "🟢", route: safest },
    { tag: "Balanced", emoji: "🟡", route: balanced },
    { tag: "Fastest", emoji: "🔵", route: fastest },
  ];

  // Dedupe by route id, keeping the first (priority) label.
  const seen = new Set<string>();
  return out.filter((l) => {
    if (seen.has(l.route.id)) return false;
    seen.add(l.route.id);
    return true;
  });
}
