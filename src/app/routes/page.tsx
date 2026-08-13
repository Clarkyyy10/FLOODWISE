"use client";

import { useEffect, useRef, useState } from "react";
import { useFloodWise } from "@/lib/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRoutePlanner } from "@/lib/useRoutePlanner";
import DestinationSearch from "@/components/routes/DestinationSearch";
import RouteOptionsPanel from "@/components/routes/RouteOptionsPanel";
import NavigationView from "@/components/routes/NavigationView";
import LiveMap from "@/components/map/LiveMap";
import MapStyleToggle from "@/components/map/MapStyleToggle";
import { reverseGeocode, type GeoPlace } from "@/lib/geocoding";
import { MARIKINA_CENTER } from "@/lib/constants";
import type { MapStyle } from "@/lib/mapLayers";

type LatLng = [number, number];
interface Pending {
  coords: LatLng;
  label: string;
  accuracy: number | null;
  source: "gps" | "map";
}

export default function RoutesPage() {
  const activeFlood = useFloodWise((s) => s.activeFloodMode);
  const geo = useGeolocation(true);

  // Origin (route starting point) — chosen explicitly by the user.
  const [origin, setOrigin] = useState<LatLng>(MARIKINA_CENTER);
  const [originLabel, setOriginLabel] = useState("Marikina City center");
  const [originConfirmed, setOriginConfirmed] = useState(false);
  const [originKey, setOriginKey] = useState(0);

  const [pending, setPending] = useState<Pending | null>(null);
  const [pickMode, setPickMode] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>("dark");
  const [locateError, setLocateError] = useState(false);
  const [focus, setFocus] = useState<{ center: LatLng; ts: number } | null>(null);
  const [shelterDest, setShelterDest] = useState<{ label: string; status: string } | null>(null);
  const wantGps = useRef(true); // auto-detect once on mount

  const planner = useRoutePlanner({
    getOrigin: () => origin,
    livePosition: geo.position,
    originKey,
  });

  useEffect(() => {
    geo.request();

    // Deep link from a shelter's "Get Safest Route": auto-set destination.
    const sp = new URLSearchParams(window.location.search);
    const dLat = parseFloat(sp.get("destLat") ?? "");
    const dLng = parseFloat(sp.get("destLng") ?? "");
    const dName = sp.get("destName");
    if (!Number.isNaN(dLat) && !Number.isNaN(dLng) && dName) {
      const context = sp.get("destContext") ?? "";
      const place: GeoPlace = {
        id: sp.get("shelterId") ?? `dest-${dLat},${dLng}`,
        name: dName,
        context,
        lat: dLat,
        lng: dLng,
        type: "amenity/shelter",
        importance: 1,
        inMarikina: true,
      };
      planner.setPlace(place);
      setShelterDest({ label: context ? `${dName}, ${context}` : dName, status: sp.get("shelterStatus") ?? "unknown" });
      setFocus({ center: [dLat, dLng], ts: Date.now() });
      wantGps.current = false; // don't pop the "confirm current location" panel
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For the shelter flow, adopt the user's live GPS as the origin automatically.
  useEffect(() => {
    if (shelterDest && geo.position && !originConfirmed) {
      setOrigin(geo.position);
      setOriginLabel("Your current location");
      setOriginConfirmed(true);
      setOriginKey((k) => k + 1);
      setPending(null);
    }
  }, [shelterDest, geo.position, originConfirmed]);

  // When a GPS fix arrives after a request, reverse-geocode and offer it.
  useEffect(() => {
    if (!wantGps.current || !geo.position) return;
    wantGps.current = false;
    const [lat, lng] = geo.position;
    setLocateError(false);
    setFocus({ center: geo.position, ts: Date.now() });
    (async () => {
      const rev = await reverseGeocode(lat, lng);
      setPending({
        coords: [lat, lng],
        label: rev ? [rev.name, rev.context].filter(Boolean).join(", ") : "Detected location",
        accuracy: geo.accuracy,
        source: "gps",
      });
    })();
  }, [geo.position, geo.accuracy]);

  // Surface denied/unavailable location as an error the user can act on.
  useEffect(() => {
    if ((geo.status === "denied" || geo.status === "unavailable") && wantGps.current) {
      wantGps.current = false;
      setLocateError(true);
    }
  }, [geo.status]);

  function useMyLocation() {
    setLocateError(false);
    wantGps.current = true;
    if (geo.position) {
      // Already have a fix — re-run the pending flow immediately.
      const [lat, lng] = geo.position;
      setFocus({ center: geo.position, ts: Date.now() });
      reverseGeocode(lat, lng).then((rev) =>
        setPending({
          coords: [lat, lng],
          label: rev ? [rev.name, rev.context].filter(Boolean).join(", ") : "Detected location",
          accuracy: geo.accuracy,
          source: "gps",
        }),
      );
      wantGps.current = false;
    } else {
      geo.request();
    }
  }

  function startPickOnMap() {
    setPickMode(true);
    setPending(null);
  }

  async function handleMapPick(lat: number, lng: number) {
    // Exit pick mode immediately so the confirmation panel becomes visible.
    setPickMode(false);
    setFocus({ center: [lat, lng], ts: Date.now() });
    // Show a provisional marker/label right away, then refine with reverse geocode.
    setPending({ coords: [lat, lng], label: "Locating…", accuracy: null, source: "map" });
    const rev = await reverseGeocode(lat, lng);
    setPending({
      coords: [lat, lng],
      label: rev ? [rev.name, rev.context].filter(Boolean).join(", ") : "Selected point",
      accuracy: null,
      source: "map",
    });
  }

  function confirmOrigin() {
    if (!pending) return;
    setOrigin(pending.coords);
    setOriginLabel(pending.label);
    setOriginConfirmed(true);
    setOriginKey((k) => k + 1);
    setFocus({ center: pending.coords, ts: Date.now() });
    setPending(null);
    setPickMode(false);
  }

  if (planner.navigating) {
    return <NavigationView planner={planner} geo={geo} />;
  }

  const destination = planner.place
    ? { lat: planner.place.lat, lng: planner.place.lng, name: planner.place.name }
    : null;
  const originMarker: LatLng | null =
    pending?.coords ?? (originConfirmed ? origin : null);

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden md:h-screen">
      <div
        className="absolute inset-0"
        role="region"
        aria-label="FloodWise route planning map"
      >
        <LiveMap
          route={planner.selected?.route ?? null}
          destination={destination}
          origin={originMarker}
          userPosition={geo.position}
          focus={focus}
          onMapClick={pickMode ? handleMapPick : undefined}
          mapStyle={mapStyle}
        />
      </div>

      {/* Map dark/light toggle */}
      <div className="absolute right-3 top-3 z-[760]">
        <MapStyleToggle value={mapStyle} onChange={setMapStyle} />
      </div>

      {/* Pick-mode banner */}
      {pickMode && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[750] p-3">
          <div className="mx-auto max-w-xl rounded-md border border-brand/40 bg-[#09090b]/95 px-3 py-2 text-center text-xs text-white backdrop-blur">
            Tap the map to choose your starting point.
            <button
              onClick={() => setPickMode(false)}
              className="pointer-events-auto ml-2 text-brand"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TOP OVERLAYS */}
      {!pickMode && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[700] space-y-2 p-3">
          <div className="pointer-events-auto rounded-md border border-white/10 bg-[#09090b]/85 px-2.5 py-1.5 backdrop-blur">
            <div className="text-[9px] uppercase tracking-[0.15em] text-brand/80">
              Sheet 02 · Safer Route Planning
            </div>
            <h1 className="text-sm font-bold tracking-wide text-white">ROUTES</h1>
          </div>

          {/* Destination search */}
          <div className="pointer-events-auto mx-auto w-full max-w-xl">
            <DestinationSearch
              key={shelterDest?.label ?? "search"}
              initialQuery={shelterDest ? `🏕 ${shelterDest.label}` : ""}
              onSelect={(p) => {
                planner.setPlace(p);
                setShelterDest(null);
                setFocus({ center: [p.lat, p.lng], ts: Date.now() });
              }}
              onClear={() => {
                planner.clearDestination();
                setShelterDest(null);
              }}
            />
            {shelterDest && shelterDest.status === "full" && (
              <div className="mt-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                This shelter is currently reported as full.
              </div>
            )}
            {shelterDest && shelterDest.status === "closed" && (
              <div className="mt-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">
                ⚠️ This shelter is currently reported as closed.
              </div>
            )}
          </div>

          {/* Origin controls */}
          <div className="pointer-events-auto mx-auto w-full max-w-xl space-y-2">
            <div className="flex gap-2">
              <button
                onClick={useMyLocation}
                className="flex-1 rounded-md border border-white/15 bg-[#09090b]/85 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur transition hover:border-brand/40"
              >
                📍 Use My Current Location
              </button>
              <button
                onClick={startPickOnMap}
                className="rounded-md border border-white/15 bg-[#09090b]/85 px-3 py-2 text-xs uppercase tracking-wider text-zinc-200 backdrop-blur transition hover:border-brand/40"
              >
                Select on Map
              </button>
            </div>

            {/* Confirmed origin summary */}
            {originConfirmed && !pending && (
              <div className="rounded-md border border-status-passable/30 bg-[#09090b]/85 px-3 py-1.5 text-[11px] text-zinc-300 backdrop-blur">
                <span className="text-status-passable">●</span> Start:{" "}
                <span className="text-white">{originLabel}</span>
              </div>
            )}

            {/* Location error / fallback */}
            {locateError && !pending && (
              <div className="rounded-md border border-amber-500/30 bg-[#09090b]/90 px-3 py-2 text-[11px] text-amber-100 backdrop-blur">
                Unable to determine your current location.
                <div className="mt-1.5 flex gap-2">
                  <button onClick={useMyLocation} className="rounded bg-amber-500/80 px-2 py-1 font-semibold text-black">
                    Try Again
                  </button>
                  <button onClick={startPickOnMap} className="rounded border border-white/20 px-2 py-1 text-white">
                    Select Location on Map
                  </button>
                </div>
              </div>
            )}

            {/* Pending location confirmation */}
            {pending && (
              <div className="rounded-md border border-brand/40 bg-[#09090b]/95 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-[0.15em] text-brand/80">
                  {pending.source === "gps" ? "Your Current Location" : "Selected Location"}
                </div>
                <div className="mt-1 text-sm text-white">📍 {pending.label}</div>
                {pending.accuracy != null && (
                  <div className="mt-0.5 text-[11px] text-zinc-400">
                    Location accuracy: ~{Math.round(pending.accuracy)} m
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={confirmOrigin}
                    className="flex-1 rounded-md bg-brand py-2 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    Use This Location
                  </button>
                  <button
                    onClick={() => setPending(null)}
                    className="rounded-md border border-white/15 px-3 py-2 text-xs text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROUTE EVALUATION PANEL (bottom sheet) */}
      {!pickMode && (
        <div className="absolute inset-x-0 bottom-0 z-[700] md:inset-auto md:bottom-3 md:left-3 md:top-64 md:w-96">
          <div className="mx-auto max-h-[55vh] w-full max-w-md overflow-y-auto rounded-t-md border border-white/10 bg-[#09090b]/95 p-4 backdrop-blur md:h-full md:max-h-none md:max-w-none md:rounded-md">
            <RouteOptionsPanel planner={planner} activeFlood={activeFlood} />
          </div>
        </div>
      )}
    </div>
  );
}
