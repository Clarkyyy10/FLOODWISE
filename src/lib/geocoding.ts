import type { GeoPlace } from "@/app/api/geocode/route";

export type { GeoPlace };

export interface GeocodeResult {
  places: GeoPlace[];
  error?: "geocoding_failed" | "geocoding_unavailable";
}

/**
 * Fetch ranked destination suggestions from our Nominatim proxy.
 * Ranking (predictions, not certainties):
 *   1. inside Marikina
 *   2. name starts with the query (exact/partial prefix)
 *   3. name contains the query
 *   4. Nominatim importance
 */
export async function searchDestinations(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult> {
  const q = query.trim();
  if (q.length < 2) return { places: [] };

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) {
    const err = res.status === 504 ? "geocoding_unavailable" : "geocoding_failed";
    return { places: [], error: err };
  }
  const data = (await res.json()) as { places?: GeoPlace[] };
  const places = data.places ?? [];

  const lower = q.toLowerCase();
  const score = (p: GeoPlace) => {
    let s = 0;
    if (p.inMarikina) s += 1000;
    const name = p.name.toLowerCase();
    if (name === lower) s += 500;
    else if (name.startsWith(lower)) s += 300;
    else if (name.includes(lower)) s += 150;
    s += Math.round((p.importance ?? 0) * 100);
    return s;
  };

  const ranked = [...places].sort((a, b) => score(b) - score(a));
  return { places: ranked };
}

/** Reverse-geocode coordinates into a human-readable label. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<{ name: string; context: string } | null> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { name?: string | null; context?: string | null };
    if (!data.name) return null;
    return { name: data.name, context: data.context ?? "" };
  } catch {
    return null;
  }
}
