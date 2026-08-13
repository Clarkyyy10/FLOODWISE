"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MARIKINA_CENTER } from "@/lib/constants";

type LatLng = [number, number];

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

export interface GeoState {
  status: GeoStatus;
  position: LatLng | null; // live position when granted
  origin: LatLng; // best-known origin (falls back to Marikina center)
  accuracy: number | null;
  heading: number | null; // degrees clockwise from north, when available
  speed: number | null; // metres/second, when the device reports it
  error: string | null;
}

/**
 * Live geolocation with graceful fallback.
 * - When permission is granted, watchPosition keeps `position` updated.
 * - When denied/unavailable, `origin` falls back to Marikina center so the
 *   rest of the routing flow still works (with a clear message in the UI).
 */
export function useGeolocation(watch = false): GeoState & { request: () => void } {
  const [state, setState] = useState<GeoState>({
    status: "idle",
    position: null,
    origin: MARIKINA_CENTER,
    accuracy: null,
    heading: null,
    speed: null,
    error: null,
  });
  const watchId = useRef<number | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unavailable", error: "Geolocation not supported." }));
      return;
    }
    setState((s) => ({ ...s, status: "locating", error: null }));

    const onSuccess = (pos: GeolocationPosition) => {
      const p: LatLng = [pos.coords.latitude, pos.coords.longitude];
      setState({
        status: "granted",
        position: p,
        origin: p,
        accuracy: pos.coords.accuracy,
        heading:
          typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading)
            ? pos.coords.heading
            : null,
        speed:
          typeof pos.coords.speed === "number" && pos.coords.speed >= 0
            ? pos.coords.speed
            : null,
        error: null,
      });
    };
    const onError = (err: GeolocationPositionError) => {
      setState((s) => ({
        ...s,
        status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        error:
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Live navigation needs location permission."
            : "Current location unavailable.",
      }));
    };

    if (watch) {
      watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      });
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 15000,
      });
    }
  }, [watch]);

  useEffect(() => {
    return () => {
      if (watchId.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return { ...state, request };
}
