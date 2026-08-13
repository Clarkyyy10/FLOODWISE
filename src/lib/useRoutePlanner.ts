"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFloodWise } from "@/lib/store";
import { fetchRoutes, scoreRoutes, labelRoutes } from "@/lib/routing";
import type { RawRoute } from "@/app/api/route/route";
import type { ScoredRoute, LabeledRoute } from "@/lib/routing";
import type { GeoPlace } from "@/lib/geocoding";
import type { TravelMode } from "@/lib/types";
import { distancePointToSegmentM, isInMarikinaBox } from "@/lib/geo";

type LatLng = [number, number];
export type PlannerFetchState = "idle" | "loading" | "ready" | "error";

/**
 * Shared destination -> route-evaluation -> navigation state machine.
 * Keeps all routing/scoring logic in ONE place so the Live Map and the
 * Routes tab don't diverge. OSRM proposes candidate routes; FloodWise scores
 * them against live report/closure data (re-scored reactively for monitoring).
 */
export function useRoutePlanner(opts: {
  getOrigin: () => LatLng;
  livePosition: LatLng | null;
  originKey?: number; // bump to force a route recalculation from a new origin
}) {
  const roads = useFloodWise((s) => s.roads);
  const reports = useFloodWise((s) => s.reports);
  const closures = useFloodWise((s) => s.closures);
  const conditionFor = useFloodWise((s) => s.conditionFor);

  const [place, setPlace] = useState<GeoPlace | null>(null);
  const [mode, setMode] = useState<TravelMode>("car");
  const [raw, setRaw] = useState<RawRoute[]>([]);
  const [fetchState, setFetchState] = useState<PlannerFetchState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [changed, setChanged] = useState(false);
  const baseline = useRef(0);

  const getOriginRef = useRef(opts.getOrigin);
  getOriginRef.current = opts.getOrigin;

  const outsideArea = place ? !isInMarikinaBox(place.lat, place.lng) : false;

  // Generate candidate routes when destination or mode changes.
  useEffect(() => {
    if (!place) {
      setRaw([]);
      setFetchState("idle");
      setSelectedId(null);
      return;
    }
    const controller = new AbortController();
    setFetchState("loading");
    setFetchError(null);
    (async () => {
      const { routes, error } = await fetchRoutes(
        getOriginRef.current(),
        [place.lat, place.lng],
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (error) {
        setFetchState("error");
        setFetchError(
          error === "no_route"
            ? "No route could be calculated to this destination."
            : error === "routing_unavailable"
              ? "Routing service is temporarily unavailable. Please try again."
              : "Couldn't calculate a route right now.",
        );
        setRaw([]);
        return;
      }
      setRaw(routes);
      setFetchState("ready");
    })();
    return () => controller.abort();
    // originKey lets the caller force a refetch when the start point changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place, mode, opts.originKey]);

  // Score against LIVE conditions (re-runs on report/closure changes).
  const scored = useMemo<ScoredRoute[]>(() => {
    if (raw.length === 0) return [];
    return scoreRoutes(raw, { roads, conditionFor, reports, mode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, roads, reports, closures, mode]);

  const labeled = useMemo<LabeledRoute[]>(() => labelRoutes(scored), [scored]);

  // Default selection = Safest.
  useEffect(() => {
    if (labeled.length > 0) {
      const stillValid = labeled.some((l) => l.route.id === selectedId);
      if (!stillValid) setSelectedId(labeled[0].route.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labeled]);

  const selected = useMemo(
    () => labeled.find((l) => l.route.id === selectedId) ?? labeled[0] ?? null,
    [labeled, selectedId],
  );

  const canNavigate =
    !!place &&
    !!selected &&
    selected.route.coordinates.length > 1 &&
    fetchState === "ready";

  // Live monitoring: flag when the selected route degrades vs. its baseline.
  useEffect(() => {
    if (!navigating || !selected) return;
    const r = selected.route;
    if (r.blocked || r.riskScore > baseline.current + 1) setChanged(true);
  }, [navigating, selected]);

  // Deviation detection while navigating.
  const deviated = useMemo(() => {
    if (!navigating || !opts.livePosition || !selected) return false;
    const coords = selected.route.coordinates;
    let min = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const d = distancePointToSegmentM(opts.livePosition, coords[i], coords[i + 1]);
      if (d < min) min = d;
      if (min < 30) break;
    }
    return min > 80;
  }, [navigating, opts.livePosition, selected]);

  function startNavigation() {
    if (!selected) return;
    baseline.current = selected.route.riskScore;
    setChanged(false);
    setNavigating(true);
  }
  function endNavigation() {
    setNavigating(false);
  }
  function findSaferRoute() {
    if (labeled.length > 0) {
      setSelectedId(labeled[0].route.id);
      baseline.current = labeled[0].route.riskScore;
    }
    setChanged(false);
  }
  function retry() {
    setPlace((p) => (p ? { ...p } : p));
  }
  function clearDestination() {
    setPlace(null);
    setRaw([]);
    setFetchState("idle");
    setSelectedId(null);
    setNavigating(false);
    setChanged(false);
  }

  return {
    place,
    setPlace,
    clearDestination,
    outsideArea,
    mode,
    setMode,
    fetchState,
    fetchError,
    scored,
    labeled,
    selectedId,
    setSelectedId,
    selected,
    canNavigate,
    navigating,
    startNavigation,
    endNavigation,
    changed,
    deviated,
    findSaferRoute,
    retry,
  };
}

export type RoutePlanner = ReturnType<typeof useRoutePlanner>;
