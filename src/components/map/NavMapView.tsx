"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/constants";
import type { ScoredRoute } from "@/lib/routing";
import type { MapStyle } from "@/lib/mapLayers";

type LatLng = [number, number];

function destIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:22px;line-height:22px;transform:translate(-50%,-100%)">📍</div>`,
    iconSize: [22, 22],
    iconAnchor: [0, 0],
  });
}

// User marker: a heading arrow when heading is known, else a plain dot.
function userIcon(heading: number | null) {
  const inner =
    heading === null
      ? `<div style="width:16px;height:16px;border-radius:9999px;background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 0 2px #0ea5e9aa"></div>`
      : `<div style="transform:rotate(${heading}deg);width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:20px solid #0ea5e9;filter:drop-shadow(0 0 2px rgba(0,0,0,.5))"></div>`;
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px">${inner}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function NavCamera({
  userPosition,
  follow,
  recenterToken,
  onUserPan,
  route,
}: {
  userPosition: LatLng | null;
  follow: boolean;
  recenterToken: number;
  onUserPan: () => void;
  route: ScoredRoute;
}) {
  const map = useMap();
  const fitted = useRef(false);
  const NAV_ZOOM = 17;

  // If we have no fix yet, frame the whole route once.
  useEffect(() => {
    if (userPosition || fitted.current) return;
    if (route.coordinates.length > 1) {
      fitted.current = true;
      map.fitBounds(route.coordinates as LatLng[], { padding: [50, 50] });
    }
  }, [map, route, userPosition]);

  // Follow the user while in follow mode.
  useEffect(() => {
    if (userPosition && follow) {
      const z = Math.max(map.getZoom(), NAV_ZOOM);
      map.setView(userPosition, z, { animate: true, duration: 0.5 });
    }
  }, [map, userPosition, follow]);

  // Explicit re-center action.
  useEffect(() => {
    if (recenterToken > 0 && userPosition) {
      map.setView(userPosition, NAV_ZOOM, { animate: true, duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterToken]);

  // A manual drag suspends auto-follow.
  useMapEvents({
    dragstart() {
      onUserPan();
    },
  });

  return null;
}

export default function NavMapView({
  route,
  destination,
  userPosition,
  heading,
  follow,
  recenterToken,
  onUserPan,
  mapStyle = "dark",
}: {
  route: ScoredRoute;
  destination: { lat: number; lng: number; name: string };
  userPosition: LatLng | null;
  heading: number | null;
  follow: boolean;
  recenterToken: number;
  onUserPan: () => void;
  mapStyle?: MapStyle;
}) {
  const dest: LatLng = [destination.lat, destination.lng];
  const start = userPosition ?? route.coordinates[0] ?? dest;

  return (
    <div className={`h-full w-full map-style-${mapStyle}`}>
    <MapContainer center={start} zoom={16} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <NavCamera
        userPosition={userPosition}
        follow={follow}
        recenterToken={recenterToken}
        onUserPan={onUserPan}
        route={route}
      />

      {/* Active route — strong line */}
      <Polyline
        positions={route.coordinates}
        pathOptions={{ color: "#0ea5e9", weight: 7, opacity: 0.95 }}
      />

      {/* FloodWise condition overlays on segments the route uses */}
      {route.matched.map((m) => (
        <Polyline
          key={m.road.id}
          positions={m.road.path}
          pathOptions={{
            color: STATUS_COLOR[m.lens],
            weight: 9,
            opacity: 0.9,
            dashArray: m.lens === "avoid" || m.lens === "closed" ? "6 6" : undefined,
          }}
        >
          <Popup>
            <div style={{ minWidth: 150 }}>
              <div style={{ fontWeight: 700 }}>{m.road.name}</div>
              <div style={{ color: STATUS_COLOR[m.lens], fontWeight: 600 }}>
                {STATUS_LABEL[m.lens]}
              </div>
            </div>
          </Popup>
        </Polyline>
      ))}

      <Marker position={dest} icon={destIcon()}>
        <Popup>{destination.name}</Popup>
      </Marker>

      {userPosition && <Marker position={userPosition} icon={userIcon(heading)} />}
    </MapContainer>
    </div>
  );
}
