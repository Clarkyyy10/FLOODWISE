"use client";

import { useEffect, useRef, useState } from "react";
import LiveMap from "@/components/map/LiveMap";
import ActiveFloodBanner from "@/components/layout/ActiveFloodBanner";
import DestinationSearch from "@/components/routes/DestinationSearch";
import RouteOptionsPanel from "@/components/routes/RouteOptionsPanel";
import NavigationView from "@/components/routes/NavigationView";
import LiveClock from "@/components/ui/LiveClock";
import { StatusBadge, timeAgo } from "@/components/ui/StatusBadge";
import { useFloodWise } from "@/lib/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRoutePlanner } from "@/lib/useRoutePlanner";
import { useI18n } from "@/components/providers/I18nProvider";
import { STATUS_COLOR, STATUS_TKEY, FLOOD_LEVEL_OPTIONS } from "@/lib/constants";
import { confidenceFor, reportStatusGlyph } from "@/lib/confidence";
import { isExpired } from "@/lib/reliability";
import MapStyleToggle from "@/components/map/MapStyleToggle";
import {
  DEFAULT_LAYERS,
  LAYER_META,
  MAP_STYLES,
  type MapLayers,
  type MapStyle,
} from "@/lib/mapLayers";
import type { RoadStatus } from "@/lib/types";

type LatLng = [number, number];

export default function LiveMapPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [focus, setFocus] = useState<{ center: LatLng; ts: number } | null>(null);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [mapStyle, setMapStyle] = useState<MapStyle>("dark");
  const [showLayers, setShowLayers] = useState(false);

  const activeFlood = useFloodWise((s) => s.activeFloodMode);
  const allConditions = useFloodWise((s) => s.allConditions);
  const { t } = useI18n();

  const geo = useGeolocation(true);
  const planner = useRoutePlanner({
    getOrigin: () => geo.origin,
    livePosition: geo.position,
  });

  const recenterWanted = useRef(false);

  useEffect(() => {
    geo.request();
    // Honor deep links from the AI assistant: /?lat=&lng= or /?view=list
    const sp = new URLSearchParams(window.location.search);
    const lat = parseFloat(sp.get("lat") ?? "");
    const lng = parseFloat(sp.get("lng") ?? "");
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setFocus({ center: [lat, lng], ts: Date.now() });
    }
    if (sp.get("view") === "list") setView("list");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recenterWanted.current && geo.position) {
      setFocus({ center: geo.position, ts: Date.now() });
      recenterWanted.current = false;
    }
  }, [geo.position]);

  function handleMyLocation() {
    if (geo.position) {
      setFocus({ center: geo.position, ts: Date.now() });
    } else {
      recenterWanted.current = true;
      geo.request();
    }
  }

  if (planner.navigating) {
    return <NavigationView planner={planner} geo={geo} />;
  }

  const destination = planner.place
    ? { lat: planner.place.lat, lng: planner.place.lng, name: planner.place.name }
    : null;

  const conds = allConditions();
  const counts = {
    avoid: conds.filter((c) => c.status === "avoid").length,
    caution: conds.filter((c) => c.status === "caution").length,
    passable: conds.filter((c) => c.status === "passable").length,
    closed: conds.filter((c) => c.officialClosure).length,
  };

  return (
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden md:h-[100dvh]">
      {/* MAP / LIST */}
      {view === "map" ? (
        <div
          className="absolute inset-0"
          role="region"
          aria-label="FloodWise live flood map of Marikina and nearby cities"
        >
          <LiveMap
            route={planner.selected?.route ?? null}
            destination={destination}
            userPosition={geo.position}
            focus={focus}
            layers={layers}
            mapStyle={mapStyle}
          />
        </div>
      ) : (
        <ListView
          onOpen={(center) => {
            setFocus({ center, ts: Date.now() });
            setView("map");
          }}
        />
      )}

      {/* TOP OVERLAYS */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] space-y-2 p-3">
        {/* Primary destination search — prominent at the very top */}
        <div className="pointer-events-auto w-full max-w-2xl">
          <DestinationSearch
            size="lg"
            placeholder={`🔍 ${t("search.placeholder")}`}
            onSelect={(p) => {
              planner.setPlace(p);
              setView("map");
              setFocus({ center: [p.lat, p.lng], ts: Date.now() });
            }}
            onClear={() => planner.clearDestination()}
          />
          <LocationStatus geo={geo} />
        </div>

        <div className="pointer-events-auto flex items-start justify-between gap-2">
          <div className="rounded-md border border-white/10 bg-[#09090b]/85 px-2.5 py-1.5 backdrop-blur">
            <div className="text-[9px] uppercase tracking-[0.15em] text-brand/80">
              Sheet 01 · {t("map.liveConditions")}
            </div>
            <h1 className="text-sm font-bold tracking-wide text-white">{t("map.title")}</h1>
          </div>

          <div className="flex items-start gap-2">
            <div className="flex overflow-hidden rounded-md border border-white/10 bg-[#09090b]/85 text-[11px] backdrop-blur">
              <button
                onClick={() => setView("map")}
                className={`px-3 py-1.5 uppercase tracking-wider ${
                  view === "map" ? "bg-brand text-white" : "text-zinc-400"
                }`}
              >
                {t("map.map")}
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 uppercase tracking-wider ${
                  view === "list" ? "bg-brand text-white" : "text-zinc-400"
                }`}
              >
                {t("map.list")}
              </button>
            </div>
            <div className="hidden md:block">
              <LiveClock status={activeFlood ? t("clock.flood") : t("clock.live")} />
            </div>
          </div>
        </div>

        {/* Stat strip (desktop) */}
        <div className="pointer-events-auto hidden gap-2 md:flex">
          <MiniStat value={counts.avoid} label={t("map.stat.avoid")} color={STATUS_COLOR.avoid} />
          <MiniStat value={counts.caution} label={t("map.stat.caution")} color={STATUS_COLOR.caution} />
          <MiniStat value={counts.passable} label={t("map.stat.passable")} color={STATUS_COLOR.passable} />
          <MiniStat value={counts.closed} label={t("map.stat.closures")} color={STATUS_COLOR.closed} />
        </div>

        <div className="pointer-events-auto">
          <ActiveFloodBanner compact />
        </div>
      </div>

      {/* MAP CONTROLS + LEGEND */}
      {view === "map" && (
        <>
          <div className="absolute bottom-4 right-3 z-[600] flex flex-col gap-2">
            <MapStyleToggle value={mapStyle} onChange={setMapStyle} />
            <button
              onClick={() => setShowLayers((v) => !v)}
              aria-label="Map layers and style"
              aria-expanded={showLayers}
              title="Layers & Style"
              className={`flex h-11 w-11 items-center justify-center rounded-md border text-lg shadow-lg backdrop-blur transition ${
                showLayers
                  ? "border-brand/50 bg-brand/20 text-white"
                  : "border-white/10 bg-[#09090b]/90 text-white hover:border-brand/40"
              }`}
            >
              ▤
            </button>
            <button
              onClick={handleMyLocation}
              aria-label="Center on my location"
              title="My Location"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-[#09090b]/90 text-lg text-white shadow-lg backdrop-blur transition hover:border-brand/40"
            >
              🎯
            </button>
          </div>

          {showLayers && (
            <div className="absolute bottom-4 right-16 z-[700] w-56 rounded-md border border-white/10 bg-[#09090b]/95 p-3 shadow-2xl backdrop-blur">
              <div className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                {t("map.layers")}
              </div>
              <div className="space-y-1">
                {LAYER_META.map((l) => (
                  <label
                    key={l.key}
                    className="flex cursor-pointer items-center justify-between py-1 text-xs text-zinc-200"
                  >
                    {l.label}
                    <input
                      type="checkbox"
                      checked={layers[l.key]}
                      onChange={(e) => setLayers((prev) => ({ ...prev, [l.key]: e.target.checked }))}
                      className="h-4 w-4 accent-brand"
                    />
                  </label>
                ))}
              </div>
              <div className="mb-1.5 mt-3 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                {t("map.mapStyle")}
              </div>
              <div className="flex gap-1 rounded-md border border-white/10 p-1">
                {MAP_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setMapStyle(s.value)}
                    className={`flex-1 rounded px-1.5 py-1 text-[10px] transition ${
                      mapStyle === s.value ? "bg-brand text-white" : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!planner.place && !showLayers && <Legend />}
        </>
      )}

      {/* ROUTE EVALUATION PANEL */}
      {planner.place && view === "map" && (
        <div className="absolute inset-x-0 bottom-0 z-[700] md:inset-auto md:bottom-3 md:left-3 md:top-56 md:w-96">
          <div className="mx-auto max-h-[62vh] w-full max-w-md overflow-y-auto rounded-t-md border border-white/10 bg-[#09090b]/95 p-4 backdrop-blur md:h-full md:max-h-none md:max-w-none md:rounded-md">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-brand/80">
                Route Evaluation
              </span>
              <button
                onClick={() => planner.clearDestination()}
                className="text-[10px] uppercase tracking-wider text-zinc-500"
              >
                Clear
              </button>
            </div>
            <RouteOptionsPanel planner={planner} activeFlood={activeFlood} />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="brackets rounded-md border border-white/10 bg-[#09090b]/85 px-3 py-1.5 backdrop-blur">
      <div className="text-lg font-bold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-500">{label}</div>
    </div>
  );
}

function LocationStatus({ geo }: { geo: ReturnType<typeof useGeolocation> }) {
  const { t } = useI18n();
  const text =
    geo.status === "granted"
      ? `◉ ${t("loc.using")}`
      : geo.status === "locating"
        ? `◌ ${t("loc.locating")}`
        : geo.status === "idle"
          ? `○ ${t("loc.idle")}`
          : `○ ${t("loc.unavailable")}`;
  return (
    <div className="mt-1 flex items-center justify-between rounded-md border border-white/10 bg-[#09090b]/70 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 backdrop-blur">
      <span>{text}</span>
      {geo.status !== "granted" && (
        <button onClick={geo.request} className="font-semibold text-brand">
          {t("common.enable")}
        </button>
      )}
    </div>
  );
}

function Legend() {
  const { t } = useI18n();
  const conditions: RoadStatus[] = ["passable", "caution", "avoid", "unknown", "closed"];
  const statuses = [
    { g: "✓", k: "glyph.verified" },
    { g: "◐", k: "glyph.community" },
    { g: "⚠", k: "glyph.disputed" },
    { g: "⌛", k: "glyph.outdated" },
  ];
  return (
    <div className="absolute bottom-4 left-3 z-[500] rounded-md border border-white/10 bg-[#09090b]/90 p-3 text-[10px] text-zinc-200 shadow-lg backdrop-blur">
      <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-zinc-500">
        {t("legend.roadConditions")}
      </div>
      {conditions.map((s) => (
        <div key={s} className="flex items-center gap-1.5 py-0.5">
          <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: STATUS_COLOR[s] }} />
          {t(STATUS_TKEY[s])}
        </div>
      ))}
      <div className="mb-1 mt-2 text-[9px] uppercase tracking-[0.15em] text-zinc-500">
        {t("legend.reportStatus")}
      </div>
      {statuses.map((s) => (
        <div key={s.k} className="flex items-center gap-1.5 py-0.5">
          <span className="w-4 text-center">{s.g}</span>
          {t(s.k)}
        </div>
      ))}
    </div>
  );
}

function severityRank(s: RoadStatus): number {
  return { passable: 1, unknown: 2, caution: 3, avoid: 4, closed: 5 }[s];
}

function ListView({ onOpen }: { onOpen: (center: LatLng) => void }) {
  const reports = useFloodWise((s) => s.reports);
  const conditionFor = useFloodWise((s) => s.conditionFor);
  const { t } = useI18n();

  const sorted = [...reports]
    .filter((r) => r.status !== "rejected")
    .sort((a, b) => {
      const cb = conditionFor(b.roadId);
      const ca = conditionFor(a.roadId);
      const recency = b.createdAt - a.createdAt;
      if (Math.abs(recency) > 60 * 1000) return recency;
      return severityRank(cb.status) - severityRank(ca.status);
    });

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#09090b] px-4 pb-6 pt-40">
      <div className="mx-auto max-w-xl space-y-2">
        <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
          {t("map.recentReports")}
        </div>
        {sorted.map((r) => {
          const cond = conditionFor(r.roadId);
          const conf = confidenceFor(cond);
          const glyph = reportStatusGlyph(r);
          const outdated = isExpired(r.createdAt);
          return (
            <button
              key={r.id}
              onClick={() => onOpen(r.gps)}
              className="block w-full rounded-md border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-brand/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{r.roadName}</span>
                <StatusBadge status={cond.status} />
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                {r.barangay}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                <span>🚶 {t(STATUS_TKEY[cond.pedestrianStatus])}</span>
                <span>🚗 {t(STATUS_TKEY[cond.vehicleStatus])}</span>
                <span>🌊 {FLOOD_LEVEL_OPTIONS.find((f) => f.value === r.floodLevel)?.label}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-zinc-500">
                  {glyph.glyph} {glyph.label} · {outdated ? "outdated information" : timeAgo(r.createdAt)}
                </span>
                <span style={{ color: conf.color }}>{conf.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
