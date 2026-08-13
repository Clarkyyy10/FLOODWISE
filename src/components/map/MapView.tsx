"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MARIKINA_CENTER, STATUS_COLOR, STATUS_LABEL, FLOOD_LEVEL_OPTIONS } from "@/lib/constants";
import { MARIKINA_VIEWBOX } from "@/lib/geo";
import { useFloodWise } from "@/lib/store";
import { timeAgo } from "@/components/ui/StatusBadge";
import { confidenceFor, reportStatusGlyph } from "@/lib/confidence";
import { isExpired } from "@/lib/reliability";
import type { ScoredRoute } from "@/lib/routing";
import { DEFAULT_LAYERS, type MapLayers, type MapStyle } from "@/lib/mapLayers";

type LatLng = [number, number];

function emojiIcon(emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:20px;line-height:20px;transform:translate(-50%,-100%)">${emoji}</div>`,
    iconSize: [20, 20],
    iconAnchor: [0, 0],
  });
}

function dotIcon(color: string, glyph: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:9999px;background:${color};border:2px solid #0b1220;box-shadow:0 0 0 2px ${color}66;font-size:11px;color:#0b1220;font-weight:700">${glyph}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const MARIKINA_BOUNDS: [LatLng, LatLng] = [
  [MARIKINA_VIEWBOX.latMin, MARIKINA_VIEWBOX.lonMin],
  [MARIKINA_VIEWBOX.latMax, MARIKINA_VIEWBOX.lonMax],
];

// In-map zoom controls (FloodWise-styled, keyboard accessible).
function ZoomControls() {
  const map = useMap();
  const btn =
    "flex h-9 w-9 items-center justify-center bg-[#09090b]/90 text-lg text-white backdrop-blur transition hover:bg-brand focus-visible:bg-brand";
  return (
    <div className="absolute right-3 top-1/2 z-[500] -translate-y-1/2 overflow-hidden rounded-md border border-white/15 shadow-lg">
      <button className={`${btn} border-b border-white/15`} aria-label="Zoom in" onClick={() => map.zoomIn()}>
        ＋
      </button>
      <button className={btn} aria-label="Zoom out" onClick={() => map.zoomOut()}>
        －
      </button>
    </div>
  );
}

// --- imperative map controllers ------------------------------------------
function InitialFit() {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    map.fitBounds(MARIKINA_BOUNDS, { padding: [20, 20] });
  }, [map]);
  return null;
}

function FitRoute({ route }: { route: ScoredRoute | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!route || route.coordinates.length < 2) return;
    map.fitBounds(route.coordinates as LatLng[], { padding: [40, 40] });
  }, [map, route]);
  return null;
}

function Recenter({ target }: { target: { center: LatLng; ts: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target.center, Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [map, target]);
  return null;
}

// Emits map clicks (used for "Select Location on Map").
function MapClicker({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface MapViewProps {
  route?: ScoredRoute | null;
  destination?: { lat: number; lng: number; name: string } | null;
  origin?: LatLng | null;
  userPosition?: LatLng | null;
  focus?: { center: LatLng; ts: number } | null;
  showShelters?: boolean;
  layers?: MapLayers;
  mapStyle?: MapStyle;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapView({
  route = null,
  destination = null,
  origin = null,
  userPosition = null,
  focus = null,
  showShelters = true,
  layers = DEFAULT_LAYERS,
  mapStyle = "dark",
  onMapClick,
}: MapViewProps) {
  const roads = useFloodWise((s) => s.roads);
  const reports = useFloodWise((s) => s.reports);
  const shelters = useFloodWise((s) => s.shelters);
  const conditionFor = useFloodWise((s) => s.conditionFor);

  // Only visible reports (not rejected).
  const visibleReports = reports.filter((r) => r.status !== "rejected");

  return (
    <div className={`h-full w-full map-style-${mapStyle}`}>
    <MapContainer
      center={MARIKINA_CENTER}
      zoom={14}
      className="h-full w-full"
      zoomControl={false}
      maxBounds={[
        [MARIKINA_VIEWBOX.latMin - 0.08, MARIKINA_VIEWBOX.lonMin - 0.08],
        [MARIKINA_VIEWBOX.latMax + 0.08, MARIKINA_VIEWBOX.lonMax + 0.08],
      ]}
      maxBoundsViscosity={0.5}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InitialFit />
      <FitRoute route={route} />
      <Recenter target={focus} />
      <ZoomControls />
      {onMapClick && <MapClicker onClick={onMapClick} />}

      {/* Road-condition layer: ONLY roads backed by real report/closure data. */}
      {roads.map((road) => {
        const cond = conditionFor(road.id);
        if (cond.reportCount === 0 && !cond.officialClosure) return null; // no decorative lines
        // Layer gating: closures vs. community conditions are independent layers.
        if (cond.officialClosure && !layers.closures) return null;
        if (!cond.officialClosure && !layers.conditions) return null;
        const color = STATUS_COLOR[cond.status];
        const closed = cond.officialClosure;
        return (
          <Polyline
            key={road.id}
            positions={road.path}
            pathOptions={{
              color,
              weight: 7,
              opacity: 0.85,
              dashArray: closed || cond.status === "avoid" ? "8 6" : undefined,
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{road.name}</div>
                <div style={{ color, fontWeight: 600 }}>{STATUS_LABEL[cond.status]}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  🚗 Vehicle: {STATUS_LABEL[cond.vehicleStatus]}
                  <br />
                  🚶 Walking: {STATUS_LABEL[cond.pedestrianStatus]}
                  <br />
                  Reliability: {cond.reliability}% · {timeAgo(cond.lastUpdated)}
                </div>
              </div>
            </Popup>
          </Polyline>
        );
      })}

      {/* Selected route (real geometry) + its matched condition overlays */}
      {layers.route && route && route.coordinates.length > 1 && (
        <>
          <Polyline
            positions={route.coordinates}
            pathOptions={{ color: "#0ea5e9", weight: 6, opacity: 0.9 }}
          />
          {route.matched.map((m) => (
            <Polyline
              key={`rt-${m.road.id}`}
              positions={m.road.path}
              pathOptions={{
                color: STATUS_COLOR[m.lens],
                weight: 8,
                opacity: 0.9,
                dashArray: m.lens === "avoid" || m.lens === "closed" ? "6 6" : undefined,
              }}
            />
          ))}
        </>
      )}

      {/* Flood report markers from actual report data */}
      {layers.reports &&
        visibleReports.map((rep) => {
        const cond = conditionFor(rep.roadId);
        const conf = confidenceFor(cond);
        const glyphInfo = reportStatusGlyph(rep);
        const color = cond.officialClosure ? STATUS_COLOR.closed : STATUS_COLOR[cond.status];
        const outdated = isExpired(rep.createdAt);
        return (
          <Marker
            key={rep.id}
            position={rep.gps}
            icon={dotIcon(outdated ? STATUS_COLOR.unknown : color, glyphInfo.glyph)}
          >
            <Popup>
              <div style={{ minWidth: 210 }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Road Condition
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{rep.roadName}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{rep.barangay}</div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  🚶 Walking: <b>{STATUS_LABEL[cond.pedestrianStatus]}</b>
                  <br />
                  🚗 Vehicle: <b>{STATUS_LABEL[cond.vehicleStatus]}</b>
                </div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  Flood Level:{" "}
                  <b>{FLOOD_LEVEL_OPTIONS.find((f) => f.value === rep.floodLevel)?.label}</b>
                  <br />
                  Reported: <b>{outdated ? "outdated information" : timeAgo(rep.createdAt)}</b>
                  <br />
                  Status: <b>{glyphInfo.label}</b>
                  <br />
                  Evidence:{" "}
                  <b>{rep.photoUrl ? "Photo available" : "Report only"}</b> · {conf.label}
                </div>
                {rep.notes && (
                  <div style={{ marginTop: 6, fontSize: 11, fontStyle: "italic", color: "#555" }}>
                    “{rep.notes}”
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Evacuation centers */}
      {showShelters &&
        layers.shelters &&
        shelters.map((sh) => (
          <Marker key={sh.id} position={sh.location} icon={emojiIcon("🏠")}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700 }}>{sh.name}</div>
                <div style={{ fontSize: 12 }}>
                  {sh.barangay} · {sh.status.toUpperCase()}
                  <br />
                  {sh.occupancy}/{sh.capacity} occupancy
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Start / origin marker (distinct from live location) */}
      {origin && (
        <CircleMarker
          center={origin}
          radius={8}
          pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
        >
          <Popup>Starting location</Popup>
        </CircleMarker>
      )}

      {/* Destination pin */}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={emojiIcon("📍")}>
          <Popup>{destination.name}</Popup>
        </Marker>
      )}

      {/* Live user location (only when actually known — never faked) */}
      {userPosition && (
        <CircleMarker
          center={userPosition}
          radius={8}
          pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 1, weight: 2 }}
        >
          <Popup>Your location</Popup>
        </CircleMarker>
      )}
    </MapContainer>
    </div>
  );
}
