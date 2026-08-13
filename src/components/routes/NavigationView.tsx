"use client";

import { useMemo, useState } from "react";
import NavMap from "@/components/map/NavMap";
import MapStyleToggle from "@/components/map/MapStyleToggle";
import type { MapStyle } from "@/lib/mapLayers";
import { TRAVEL_MODES } from "@/lib/constants";
import { formatDistance, formatDuration, routeRemaining, haversineM } from "@/lib/geo";
import { useNavTelemetry } from "@/lib/useNavTelemetry";
import { useFloodWise } from "@/lib/store";
import type { RoutePlanner } from "@/lib/useRoutePlanner";
import type { GeoState } from "@/hooks/useGeolocation";

type LatLng = [number, number];

export default function NavigationView({
  planner,
  geo,
}: {
  planner: RoutePlanner;
  geo: GeoState;
}) {
  const roads = useFloodWise((s) => s.roads);
  const setClosure = useFloodWise((s) => s.setClosure);
  const [follow, setFollow] = useState(true);
  const [recenterToken, setRecenterToken] = useState(0);
  const [mapStyle, setMapStyle] = useState<MapStyle>("dark");

  const { selected, place, mode, changed, deviated } = planner;

  // Live remaining distance/time along the selected route.
  const progress = useMemo(() => {
    if (!selected) return null;
    const coords = selected.route.coordinates;
    if (geo.position) {
      const { remainingM } = routeRemaining(geo.position, coords);
      const ratio = selected.route.distanceM > 0 ? remainingM / selected.route.distanceM : 1;
      return {
        remainingM,
        remainingS: selected.route.durationS * Math.min(1, Math.max(0, ratio)),
      };
    }
    return { remainingM: selected.route.distanceM, remainingS: selected.route.durationS };
  }, [selected, geo.position]);

  // "Continue on <road>" — nearest known FloodWise road to the current position.
  const guidance = useMemo(() => {
    if (!selected) return "your route";
    const ref: LatLng | null = geo.position ?? selected.route.coordinates[0] ?? null;
    if (!ref) return "your route";
    let bestName: string | null = null;
    let best = Infinity;
    const candidates = selected.route.matched.length
      ? selected.route.matched.map((m) => m.road)
      : roads;
    for (const road of candidates) {
      for (const v of road.path) {
        const d = haversineM(ref, v);
        if (d < best) {
          best = d;
          bestName = road.name;
        }
      }
    }
    return best <= 250 && bestName ? bestName : "your route";
  }, [selected, geo.position, roads]);

  const tel = useNavTelemetry({
    position: geo.position,
    deviceSpeed: geo.speed,
    accuracy: geo.accuracy,
    destination: place ? [place.lat, place.lng] : [0, 0],
    mode,
    active: !!(selected && place),
  });

  if (!selected || !place || !progress) return null;
  const r = selected.route;
  const modeMeta = TRAVEL_MODES.find((m) => m.value === mode);

  const speedLabel =
    tel.speedKmh != null
      ? `${tel.speedKmh.toFixed(1)} km/h`
      : geo.accuracy != null && geo.accuracy > 60
        ? "GPS accuracy low"
        : "Speed —";
  const stateLabel =
    tel.state === "waiting_gps"
      ? "Waiting for GPS…"
      : tel.state === "waiting_move"
        ? "Waiting for movement — start moving along the route."
        : tel.state === "stationary"
          ? "You're currently stopped."
          : null;

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden md:h-screen">
      <div className="absolute inset-0">
        <NavMap
          route={r}
          destination={{ lat: place.lat, lng: place.lng, name: place.name }}
          userPosition={geo.position}
          heading={geo.heading}
          follow={follow}
          recenterToken={recenterToken}
          onUserPan={() => setFollow(false)}
          mapStyle={mapStyle}
        />

        {/* Map dark/light toggle */}
        <div className="absolute left-3 top-1/2 z-[600] -translate-y-1/2">
          <MapStyleToggle value={mapStyle} onChange={setMapStyle} />
        </div>
      </div>

      {/* Top navigation info panel */}
      <div className="absolute inset-x-0 top-0 z-[700] p-3">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#0b1220]/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              onClick={planner.endNavigation}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
              title="End navigation"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold leading-none text-white">
                {formatDuration(progress.remainingS)}
              </div>
              <div className="mt-0.5 text-[11px] text-gray-400">
                {formatDistance(progress.remainingM)} remaining · {modeMeta?.emoji} {speedLabel}
              </div>
            </div>
            <div className="w-8" />
          </div>

          <div className="mt-2 rounded-lg bg-white/5 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Continue on</div>
            <div className="text-sm font-semibold text-white">{guidance}</div>
          </div>
          <div className="mt-1 text-[10px] text-gray-500">
            Recommended based on current road information
          </div>
          {stateLabel && <div className="mt-1 text-[10px] text-amber-300">{stateLabel}</div>}

          {geo.status === "denied" && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
              Live tracking needs location access. Route is shown; enable location to follow your
              position.
            </div>
          )}
        </div>
      </div>

      {/* Arrival */}
      {tel.state === "arrived" && (
        <div className="absolute inset-x-0 top-[8.5rem] z-[760] px-3">
          <div className="mx-auto max-w-xl rounded-xl border border-status-passable/40 bg-[#09090b]/95 p-3 text-center backdrop-blur">
            <div className="text-sm font-semibold text-status-passable">✓ You&apos;ve arrived</div>
            <p className="mt-0.5 text-[11px] text-zinc-400">{place.name}</p>
            <button
              onClick={planner.endNavigation}
              className="mt-2 w-full rounded-lg bg-brand py-2 text-sm font-semibold uppercase tracking-wider text-white"
            >
              End Navigation
            </button>
          </div>
        </div>
      )}

      {/* Condition-change / deviation warning */}
      {tel.state !== "arrived" && (changed || deviated) && (
        <div className="absolute inset-x-0 top-[8.5rem] z-[700] px-3">
          <div className="mx-auto max-w-xl rounded-xl border border-red-500/40 bg-red-500/15 p-3 backdrop-blur">
            <div className="text-sm font-semibold text-red-200">
              ⚠️ {deviated ? "You've moved off the route" : "Route condition changed"}
            </div>
            <p className="mt-1 text-xs text-red-100/80">
              {deviated
                ? "You appear to have deviated from the selected route."
                : `New flood information was reported on your route${
                    r.matched.find((m) => m.lens === "avoid" || m.lens === "closed")
                      ? ` near ${r.matched.find((m) => m.lens === "avoid" || m.lens === "closed")!.road.name}`
                      : ""
                  }.`}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  planner.findSaferRoute();
                  setFollow(true);
                  setRecenterToken((t) => t + 1);
                }}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white"
              >
                Find safer route
              </button>
              {!deviated && (
                <button
                  onClick={() => planner.setSelectedId(selected.route.id)}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm text-gray-100"
                >
                  Keep current
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Re-center button — appears when auto-follow is suspended */}
      {!follow && (
        <button
          onClick={() => {
            setFollow(true);
            setRecenterToken((t) => t + 1);
          }}
          className="absolute bottom-24 right-3 z-[700] flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b1220]/95 px-4 py-2 text-sm font-medium text-brand shadow-lg backdrop-blur"
        >
          🎯 Re-center
        </button>
      )}

      {/* Bottom: route conditions + demo trigger */}
      <div className="absolute inset-x-0 bottom-0 z-[600] p-3">
        <div className="mx-auto max-w-xl space-y-2">
          {r.matched.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0b1220]/90 p-2.5 backdrop-blur">
              <div className="mb-1 text-[11px] text-gray-400">Conditions on your route</div>
              <div className="flex flex-wrap gap-1.5">
                {r.matched.map((m) => (
                  <span
                    key={m.road.id}
                    className="rounded-full px-2 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: `${statusColor(m.lens)}22`,
                      color: statusColor(m.lens),
                    }}
                  >
                    {m.road.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {r.matched.length > 0 && !changed && (
            <button
              onClick={() => setClosure(r.matched[0].road.id, true)}
              className="w-full rounded-lg border border-white/10 bg-[#0b1220]/80 py-2 text-[11px] text-gray-500 backdrop-blur"
            >
              (Demo) Simulate an official closure on {r.matched[0].road.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function statusColor(s: string): string {
  return (
    {
      passable: "#22c55e",
      caution: "#eab308",
      avoid: "#ef4444",
      unknown: "#9ca3af",
      closed: "#7f1d1d",
    }[s] ?? "#9ca3af"
  );
}
