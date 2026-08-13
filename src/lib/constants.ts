import type {
  RoadStatus,
  VehiclePassability,
  PedestrianCondition,
  FloodLevel,
  Hazard,
  TravelMode,
} from "./types";

// Marikina City center
export const MARIKINA_CENTER: [number, number] = [14.6507, 121.1029];
export const MARIKINA_ZOOM = 14;

// Freshness: reports fully expire after this window (ms).
export const REPORT_LIFETIME_MS = 90 * 60 * 1000; // 90 minutes
// Reports older than this start losing significant weight.
export const REPORT_FRESH_MS = 15 * 60 * 1000; // 15 minutes

export const STATUS_COLOR: Record<RoadStatus, string> = {
  passable: "#22c55e",
  caution: "#eab308",
  avoid: "#ef4444",
  unknown: "#9ca3af",
  closed: "#7f1d1d",
};

export const STATUS_LABEL: Record<RoadStatus, string> = {
  passable: "Passable",
  caution: "Caution",
  avoid: "Avoid",
  unknown: "Unknown",
  closed: "Officially Closed",
};

// Translation keys for road statuses (used by StatusBadge and legends).
export const STATUS_TKEY: Record<RoadStatus, string> = {
  passable: "status.passable",
  caution: "status.caution",
  avoid: "status.avoid",
  unknown: "status.unknown",
  closed: "status.closed",
};

export const STATUS_EMOJI: Record<RoadStatus, string> = {
  passable: "🟢",
  caution: "🟡",
  avoid: "🔴",
  unknown: "⚪",
  closed: "⛔",
};

export const VEHICLE_OPTIONS: { value: VehiclePassability; label: string; emoji: string }[] = [
  { value: "passable", label: "Passable", emoji: "🟢" },
  { value: "caution", label: "Passable With Caution", emoji: "🟡" },
  { value: "not_passable", label: "Not Passable", emoji: "🔴" },
  { value: "cannot_determine", label: "Cannot Determine", emoji: "⚪" },
];

export const PEDESTRIAN_OPTIONS: { value: PedestrianCondition; label: string; emoji: string }[] = [
  { value: "lower_risk", label: "Lower-Risk Walking Conditions", emoji: "🟢" },
  { value: "caution", label: "Walking With Caution", emoji: "🟡" },
  { value: "unsafe", label: "Unsafe for Walking", emoji: "🔴" },
  { value: "cannot_determine", label: "Cannot Determine", emoji: "⚪" },
];

export const FLOOD_LEVEL_OPTIONS: { value: FloodLevel; label: string }[] = [
  { value: "none", label: "No flooding" },
  { value: "ankle", label: "Ankle-deep" },
  { value: "knee", label: "Knee-deep" },
  { value: "waist", label: "Waist-deep" },
  { value: "above_waist", label: "Above waist" },
  { value: "unknown", label: "Unknown" },
];

export const HAZARD_OPTIONS: { value: Hazard; label: string }[] = [
  { value: "strong_current", label: "Strong water current" },
  { value: "open_manhole", label: "Open manhole" },
  { value: "exposed_wires", label: "Exposed electrical wires" },
  { value: "fallen_tree", label: "Fallen tree" },
  { value: "road_damage", label: "Road damage" },
  { value: "debris", label: "Debris" },
  { value: "damaged_bridge", label: "Damaged bridge" },
  { value: "slippery", label: "Slippery surface" },
  { value: "heavy_traffic", label: "Heavy traffic" },
  { value: "other", label: "Other" },
];

export const TRAVEL_MODES: { value: TravelMode; label: string; emoji: string }[] = [
  { value: "car", label: "Car", emoji: "🚗" },
  { value: "motorcycle", label: "Motorcycle", emoji: "🏍️" },
  { value: "walking", label: "Walking", emoji: "🚶" },
];
