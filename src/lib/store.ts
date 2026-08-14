"use client";

import { create } from "zustand";
import type {
  Report,
  RoadCondition,
  Alert,
  ConfirmationVote,
  AiAssessment,
  FloodLevel,
} from "./types";
import {
  MOCK_ROADS,
  MOCK_REPORTS,
  MOCK_SHELTERS,
  MOCK_WEATHER,
  MOCK_ALERTS,
} from "./mockData";
import { computeRoadCondition } from "./reliability";

// Current signed-in user (mock auth).
const CURRENT_USER = { id: "u1", name: "you" };

export interface DraftReport {
  roadId: string;
  roadName: string;
  barangay: string;
  gps: [number, number];
  vehicle: Report["vehicle"];
  pedestrian: Report["pedestrian"];
  floodLevel: FloodLevel;
  hazards: Report["hazards"];
  photoUrl?: string;
  notes?: string;
}

interface FloodWiseState {
  reports: Report[];
  closures: Record<string, boolean>; // roadId -> officially closed
  alerts: Alert[];
  shelters: typeof MOCK_SHELTERS;
  weather: typeof MOCK_WEATHER;
  roads: typeof MOCK_ROADS;
  activeFloodMode: boolean;

  // derived
  conditionFor: (roadId: string) => RoadCondition;
  allConditions: () => RoadCondition[];

  // actions
  submitReport: (draft: DraftReport) => Report;
  attachAi: (reportId: string, ai: AiAssessment) => void;
  confirmReport: (reportId: string, vote: ConfirmationVote) => void;
  setClosure: (roadId: string, closed: boolean) => void;
  reviewReport: (reportId: string, status: Report["status"]) => void;
  markAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;
  setActiveFloodMode: (on: boolean) => void;

  // Shelter management (LGU/DRRM). Occupancy changes auto-derive full/open.
  setShelter: (id: string, patch: Partial<(typeof MOCK_SHELTERS)[number]>) => void;

  // Presentation: restore the entire demo scenario to its initial state.
  resetDemo: () => void;
}

// Fresh copies of the seed data so in-session edits never mutate the source
// constants — this is what makes resetDemo() reliably repeatable.
const seed = () => ({
  reports: MOCK_REPORTS.map((r) => ({ ...r })),
  alerts: MOCK_ALERTS.map((a) => ({ ...a })),
  shelters: MOCK_SHELTERS.map((s) => ({ ...s })),
});

// Mock AI vision assessment for a submitted report.
function fakeAiAssess(draft: DraftReport): AiAssessment | undefined {
  if (!draft.photoUrl) return undefined;
  const flood = draft.floodLevel !== "none" && draft.floodLevel !== "unknown";
  return {
    floodVisible: flood,
    consistentWithReport: true,
    imageQualityOk: true,
    confidence: flood ? "high" : "medium",
    note: flood
      ? "Flooding appears visible. Evidence appears consistent with the submitted report."
      : "Image received. No obvious flooding detected; treated as a supporting observation.",
  };
}

export const useFloodWise = create<FloodWiseState>((set, get) => ({
  ...seed(),
  closures: {},
  weather: MOCK_WEATHER,
  roads: MOCK_ROADS,
  activeFloodMode: true, // demo starts mid-event

  conditionFor: (roadId) =>
    computeRoadCondition({
      roadId,
      reports: get().reports,
      officialClosure: !!get().closures[roadId],
    }),

  allConditions: () => {
    const { roads, reports, closures } = get();
    return roads.map((road) =>
      computeRoadCondition({
        roadId: road.id,
        reports,
        officialClosure: !!closures[road.id],
      }),
    );
  },

  submitReport: (draft) => {
    const report: Report = {
      id: `r${Date.now()}`,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      gps: draft.gps,
      roadId: draft.roadId,
      roadName: draft.roadName,
      barangay: draft.barangay,
      createdAt: Date.now(),
      vehicle: draft.vehicle,
      pedestrian: draft.pedestrian,
      floodLevel: draft.floodLevel,
      hazards: draft.hazards,
      photoUrl: draft.photoUrl,
      notes: draft.notes,
      ai: fakeAiAssess(draft),
      confirmations: [],
      status: "pending",
    };
    set((s) => ({ reports: [report, ...s.reports] }));
    return report;
  },

  attachAi: (reportId, ai) => {
    set((s) => ({
      reports: s.reports.map((r) => (r.id === reportId ? { ...r, ai } : r)),
    }));
  },

  confirmReport: (reportId, vote) => {
    set((s) => ({
      reports: s.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              confirmations: [
                ...r.confirmations,
                { id: `c${Date.now()}`, userId: CURRENT_USER.id, vote, at: Date.now() },
              ],
            }
          : r,
      ),
    }));
  },

  setClosure: (roadId, closed) => {
    set((s) => ({ closures: { ...s.closures, [roadId]: closed } }));
  },

  reviewReport: (reportId, status) => {
    set((s) => ({
      reports: s.reports.map((r) => (r.id === reportId ? { ...r, status } : r)),
    }));
  },

  markAlertRead: (alertId) => {
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    }));
  },

  markAllAlertsRead: () => {
    set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) }));
  },

  setActiveFloodMode: (on) => set({ activeFloodMode: on }),

  setShelter: (id, patch) => {
    set((s) => ({
      shelters: s.shelters.map((sh) => {
        if (sh.id !== id) return sh;
        const next = { ...sh, ...patch };
        // Keep occupancy within bounds and auto-derive open/full from it,
        // unless the shelter is explicitly closed.
        next.occupancy = Math.max(0, Math.min(next.capacity, next.occupancy));
        if (next.status !== "closed") {
          next.status = next.occupancy >= next.capacity ? "full" : "open";
        }
        return next;
      }),
    }));
  },

  resetDemo: () => {
    set({
      ...seed(),
      closures: {},
      weather: MOCK_WEATHER,
      roads: MOCK_ROADS,
      activeFloodMode: true,
    });
  },
}));

export { CURRENT_USER };
