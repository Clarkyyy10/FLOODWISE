import { NextResponse } from "next/server";

// Server-side proxy to the public OSRM demo server.
// OSRM proposes candidate routes (with alternatives); FloodWise scores them
// client-side against current road-condition data. The public demo server
// supports the driving profile, so we always request driving geometry and let
// the client derive per-mode ETAs / apply the correct pedestrian-vs-vehicle
// safety lens.

export const runtime = "nodejs";

export interface RawRoute {
  coordinates: [number, number][]; // [lat, lng]
  distanceM: number;
  durationS: number;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // "lat,lng"
  const to = searchParams.get("to"); // "lat,lng"

  if (!from || !to) {
    return NextResponse.json({ error: "missing_coordinates" }, { status: 400 });
  }

  const [fLat, fLng] = from.split(",").map(Number);
  const [tLat, tLng] = to.split(",").map(Number);
  if ([fLat, fLng, tLat, tLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }

  // OSRM expects lon,lat order.
  const coords = `${fLng},${fLat};${tLng},${tLat}`;
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&alternatives=3&steps=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return NextResponse.json({ error: "routing_failed" }, { status: 502 });
    }
    const data = await res.json();
    if (data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) {
      return NextResponse.json({ error: "no_route" }, { status: 404 });
    }

    const routes: RawRoute[] = data.routes.map(
      (r: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }) => ({
        // Convert [lon,lat] -> [lat,lng] for Leaflet.
        coordinates: r.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
        distanceM: r.distance,
        durationS: r.duration,
      }),
    );

    return NextResponse.json({ routes });
  } catch {
    return NextResponse.json({ error: "routing_unavailable" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
