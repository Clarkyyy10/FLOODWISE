// Live open-data sources for FloodWise (server-side, no API key required).
// - Open-Meteo weather/precipitation forecast
// - Open-Meteo Flood API (GloFAS river discharge)
// Both are free, open APIs. Results are cached briefly to respect fair use.

const MARIKINA = { lat: 14.6507, lng: 121.1029 };

export interface LiveData {
  source: string;
  weather?: {
    temperatureC: number;
    precipitationMm: number;
    rainMm: number;
    windKph: number;
    next6hPrecipMm: number;
  };
  river?: {
    todayDischarge: number;
    trend: "rising" | "falling" | "steady" | "unknown";
  };
  fetchedAtMinutesAgo: number;
}

let cache: { at: number; data: LiveData } | null = null;
const TTL = 5 * 60 * 1000;

async function getJson(url: string, ms = 8000): Promise<unknown | null> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const res = await fetch(url, { signal: c.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchMarikinaLiveData(): Promise<LiveData | null> {
  if (cache && Date.now() - cache.at < TTL) {
    return { ...cache.data, fetchedAtMinutesAgo: Math.round((Date.now() - cache.at) / 60000) };
  }

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${MARIKINA.lat}&longitude=${MARIKINA.lng}` +
    `&current=temperature_2m,precipitation,rain,wind_speed_10m` +
    `&hourly=precipitation&forecast_hours=6&timezone=auto`;
  const floodUrl =
    `https://flood-api.open-meteo.com/v1/flood?latitude=${MARIKINA.lat}&longitude=${MARIKINA.lng}` +
    `&daily=river_discharge&forecast_days=3`;

  const [w, f] = await Promise.all([getJson(weatherUrl), getJson(floodUrl)]);

  const data: LiveData = { source: "Open-Meteo", fetchedAtMinutesAgo: 0 };

  const wr = w as
    | { current?: Record<string, number>; hourly?: { precipitation?: number[] } }
    | null;
  if (wr?.current) {
    const next6h = (wr.hourly?.precipitation ?? []).slice(0, 6).reduce((s, v) => s + (v || 0), 0);
    data.weather = {
      temperatureC: wr.current.temperature_2m,
      precipitationMm: wr.current.precipitation,
      rainMm: wr.current.rain,
      windKph: Math.round((wr.current.wind_speed_10m ?? 0) * 1) ,
      next6hPrecipMm: Math.round(next6h * 10) / 10,
    };
  }

  const fr = f as { daily?: { river_discharge?: number[] } } | null;
  const disch = fr?.daily?.river_discharge;
  if (Array.isArray(disch) && disch.length > 0) {
    const today = disch[0] ?? 0;
    const later = disch[disch.length - 1] ?? today;
    const trend =
      later > today * 1.1 ? "rising" : later < today * 0.9 ? "falling" : "steady";
    data.river = { todayDischarge: Math.round(today * 10) / 10, trend };
  }

  if (!data.weather && !data.river) return null;

  cache = { at: Date.now(), data };
  return data;
}
