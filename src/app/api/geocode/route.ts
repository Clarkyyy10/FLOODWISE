import { NextResponse } from "next/server";
import { MARIKINA_VIEWBOX, isInMarikinaBox, SERVICE_AREA_CITIES } from "@/lib/geo";

const REGION_REGEX = new RegExp(SERVICE_AREA_CITIES.join("|"), "i");

// Server-side proxy to OpenStreetMap Nominatim.
// Running server-side lets us set a compliant User-Agent and keeps the
// Nominatim usage policy contact in one place. Client debouncing + this
// route keep request volume within fair-use limits.

export const runtime = "nodejs";

export interface GeoPlace {
  id: string;
  name: string;
  context: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
  inMarikina: boolean;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type: string;
  category?: string; // jsonv2 field
  class?: string; // legacy field
  importance?: number;
  address?: Record<string, string>;
}

function shortName(r: NominatimResult): string {
  if (r.name && r.name.trim()) return r.name;
  return r.display_name.split(",")[0];
}

function contextOf(r: NominatimResult): string {
  const a = r.address ?? {};
  const parts = [
    a.suburb || a.village || a.neighbourhood || a.quarter,
    a.city || a.town || a.municipality,
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");
  // Fall back to the tail of the display name.
  return r.display_name.split(",").slice(1, 3).map((s) => s.trim()).join(", ");
}

// Tiny in-memory cache to avoid re-hitting Nominatim for repeated queries
// (respects their fair-use policy alongside client-side debouncing).
const CACHE = new Map<string, { at: number; places: GeoPlace[] }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // --- Reverse geocoding: ?lat=&lng= -> nearest address ---
  const latP = searchParams.get("lat");
  const lngP = searchParams.get("lng");
  if (latP && lngP) {
    const lat = parseFloat(latP);
    const lng = parseFloat(lngP);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
    }
    const revUrl =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${lat}&lon=${lng}&addressdetails=1&zoom=16`;
    const rc = new AbortController();
    const rt = setTimeout(() => rc.abort(), 8000);
    try {
      const rr = await fetch(revUrl, {
        headers: {
          "User-Agent": "FloodWise/1.0 (educational Marikina flood-intelligence app)",
          "Accept-Language": "en",
        },
        signal: rc.signal,
      });
      if (!rr.ok) return NextResponse.json({ error: "geocoding_failed" }, { status: 502 });
      const data = (await rr.json()) as NominatimResult & { error?: string };
      if (data.error) return NextResponse.json({ name: null, context: null });
      return NextResponse.json({ name: shortName(data), context: contextOf(data) });
    } catch {
      return NextResponse.json({ error: "geocoding_unavailable" }, { status: 504 });
    } finally {
      clearTimeout(rt);
    }
  }

  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ places: [] });

  const key = q.toLowerCase();
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return NextResponse.json({ places: hit.places });
  }

  const { lonMin, latMax, lonMax, latMin } = MARIKINA_VIEWBOX;
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2` +
    `&q=${encodeURIComponent(q)}` +
    `&addressdetails=1&limit=8&countrycodes=ph&dedupe=1` +
    `&viewbox=${lonMin},${latMax},${lonMax},${latMin}&bounded=0`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FloodWise/1.0 (educational Marikina flood-intelligence app)",
        "Accept-Language": "en",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "geocoding_failed" }, { status: 502 });
    }
    const data = (await res.json()) as NominatimResult[];
    const places: GeoPlace[] = data.map((r) => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      const inMarikina =
        isInMarikinaBox(lat, lng) || REGION_REGEX.test(r.display_name);
      return {
        id: String(r.place_id),
        name: shortName(r),
        context: contextOf(r),
        lat,
        lng,
        type: `${r.category ?? r.class ?? "place"}/${r.type}`,
        importance: r.importance ?? 0,
        inMarikina,
      };
    });
    CACHE.set(key, { at: Date.now(), places });
    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ error: "geocoding_unavailable" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
