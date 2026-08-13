// Lightweight geodesy helpers (no external deps).
// All coordinates are [lat, lng] to match Leaflet.

export type LatLng = [number, number];

const R = 6371000; // earth radius (m)
const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in meters between two [lat,lng] points. */
export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Local equirectangular projection to meters around a reference latitude.
// Good enough for the small distances we deal with (a single city).
function toXY(p: LatLng, refLat: number): [number, number] {
  const x = toRad(p[1]) * Math.cos(toRad(refLat)) * R;
  const y = toRad(p[0]) * R;
  return [x, y];
}

/** Shortest distance (m) from point p to the segment a-b. */
export function distancePointToSegmentM(p: LatLng, a: LatLng, b: LatLng): number {
  const refLat = a[0];
  const [px, py] = toXY(p, refLat);
  const [ax, ay] = toXY(a, refLat);
  const [bx, by] = toXY(b, refLat);
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Minimum distance (m) between a road polyline and a route polyline.
 * Samples the road's vertices against every route segment — adequate for
 * matching short city road segments to a dense OSRM geometry.
 */
export function minDistanceRoadToRouteM(road: LatLng[], route: LatLng[]): number {
  if (road.length === 0 || route.length < 2) return Infinity;
  let min = Infinity;
  for (const rp of road) {
    for (let i = 0; i < route.length - 1; i++) {
      const d = distancePointToSegmentM(rp, route[i], route[i + 1]);
      if (d < min) min = d;
      if (min < 5) return min; // early exit — clearly on the route
    }
  }
  return min;
}

/** Bounding box [minLat, minLng, maxLat, maxLng] for a set of points, padded. */
export function boundsOf(points: LatLng[], padDeg = 0.003): [LatLng, LatLng] {
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  return [
    [Math.min(...lats) - padDeg, Math.min(...lngs) - padDeg],
    [Math.max(...lats) + padDeg, Math.max(...lngs) + padDeg],
  ];
}

/**
 * Progress of a live position along a route polyline.
 * Uses nearest-vertex matching (stable, dependency-free): finds the closest
 * route vertex to the user and sums the remaining leg distances from there.
 */
export function routeRemaining(
  point: LatLng,
  coords: LatLng[],
): { remainingM: number; offRouteM: number; index: number } {
  if (coords.length < 2) return { remainingM: 0, offRouteM: Infinity, index: 0 };
  let best = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < coords.length; i++) {
    const d = haversineM(point, coords[i]);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  let remaining = 0;
  for (let i = bestIdx; i < coords.length - 1; i++) {
    remaining += haversineM(coords[i], coords[i + 1]);
  }
  return { remainingM: remaining, offRouteM: best, index: bestIdx };
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// Service-area bounding box covering Marikina and the surrounding cities of the
// Marikina River basin: Quezon City (east), Pasig, Cainta, Taytay, Antipolo,
// San Mateo, and Rodriguez (Montalban). Format: [lon_min, lat_max, lon_max, lat_min].
export const MARIKINA_VIEWBOX = { lonMin: 121.0, latMax: 14.76, lonMax: 121.22, latMin: 14.54 };

// Human-readable label for the expanded coverage area.
export const SERVICE_AREA_LABEL = "Marikina & Nearby Cities";

// Cities/municipalities covered (used to bias geocoding toward the region).
export const SERVICE_AREA_CITIES = [
  "Marikina",
  "Quezon City",
  "Pasig",
  "Cainta",
  "Taytay",
  "Antipolo",
  "San Mateo",
  "Rodriguez",
  "Montalban",
];

export function isInMarikinaBox(lat: number, lng: number): boolean {
  return (
    lat >= MARIKINA_VIEWBOX.latMin &&
    lat <= MARIKINA_VIEWBOX.latMax &&
    lng >= MARIKINA_VIEWBOX.lonMin &&
    lng <= MARIKINA_VIEWBOX.lonMax
  );
}
