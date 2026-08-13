// FloodWise domain model
// Encodes the core concepts from the master spec: reports, road conditions,
// reliability, hazards, shelters, alerts, and the LGU/DRRM layer.

export type LatLng = [number, number];

// --- Road / condition status ---------------------------------------------
// 🟢 Passable / 🟡 Caution / 🔴 Avoid / ⚪ Unknown  (+ official closure)
export type RoadStatus = "passable" | "caution" | "avoid" | "unknown" | "closed";

// --- Report field enums ---------------------------------------------------
export type VehiclePassability =
  | "passable"
  | "caution"
  | "not_passable"
  | "cannot_determine";

export type PedestrianCondition =
  | "lower_risk"
  | "caution"
  | "unsafe"
  | "cannot_determine";

export type FloodLevel =
  | "none"
  | "ankle"
  | "knee"
  | "waist"
  | "above_waist"
  | "unknown";

export type Hazard =
  | "strong_current"
  | "open_manhole"
  | "exposed_wires"
  | "fallen_tree"
  | "road_damage"
  | "debris"
  | "damaged_bridge"
  | "slippery"
  | "heavy_traffic"
  | "other";

export type ReportStatus =
  | "pending"
  | "verified"
  | "disputed"
  | "expired"
  | "rejected";

export type TravelMode = "car" | "motorcycle" | "walking";

// --- AI evidence assessment ----------------------------------------------
export interface AiAssessment {
  floodVisible: boolean;
  consistentWithReport: boolean;
  imageQualityOk: boolean;
  confidence: "low" | "medium" | "high";
  note: string;
}

// --- Community confirmation ----------------------------------------------
export type ConfirmationVote = "still_accurate" | "situation_changed" | "appears_incorrect";

export interface Confirmation {
  id: string;
  userId: string;
  vote: ConfirmationVote;
  at: number; // epoch ms
}

// --- Report --------------------------------------------------------------
export interface Report {
  id: string;
  userId: string;
  userName: string; // display handle only — never expose PII publicly
  gps: LatLng;
  roadId: string;
  roadName: string;
  barangay: string;
  createdAt: number; // epoch ms — freshness anchor
  vehicle: VehiclePassability;
  pedestrian: PedestrianCondition;
  floodLevel: FloodLevel;
  hazards: Hazard[];
  photoUrl?: string;
  notes?: string;
  ai?: AiAssessment;
  confirmations: Confirmation[];
  status: ReportStatus;
}

// --- Road ----------------------------------------------------------------
export interface Road {
  id: string;
  name: string;
  barangay: string;
  path: LatLng[]; // polyline geometry
}

// Derived, live condition of a road (computed from reports + official info).
export interface RoadCondition {
  roadId: string;
  status: RoadStatus;
  vehicleStatus: RoadStatus;
  pedestrianStatus: RoadStatus;
  reliability: number; // 0..100 — the Road Reliability Index
  lastUpdated: number | null; // epoch ms of most recent contributing report
  reportCount: number;
  officialClosure: boolean;
}

// --- Shelters ------------------------------------------------------------
export type ShelterStatus = "open" | "full" | "closed";

export interface Shelter {
  id: string;
  name: string;
  location: LatLng;
  barangay: string;
  status: ShelterStatus;
  capacity: number;
  occupancy: number;
  contact: string;
}

// --- Alerts --------------------------------------------------------------
export type AlertKind =
  | "weather"
  | "flood"
  | "road"
  | "route"
  | "advisory"
  | "report_request"
  | "system";

export interface Alert {
  id: string;
  kind: AlertKind;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

// --- Weather -------------------------------------------------------------
export interface Weather {
  rainfallMmHr: number;
  windKph: number;
  condition: string;
  forecastNote: string;
}
