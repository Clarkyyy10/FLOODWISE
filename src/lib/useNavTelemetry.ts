"use client";

import { useEffect, useRef, useState } from "react";
import { haversineM } from "@/lib/geo";
import type { TravelMode } from "@/lib/types";

type LatLng = [number, number];

export type MovementState =
  | "waiting_gps"
  | "waiting_move"
  | "moving"
  | "stationary"
  | "arrived";

export interface NavTelemetry {
  speedKmh: number | null; // smoothed; null when GPS accuracy is too poor
  state: MovementState;
  distanceTraveledM: number;
}

// Movement threshold (km/h) below which the user is considered stationary.
const MOVE_THRESHOLD_KMH: Record<TravelMode, number> = {
  walking: 1.2,
  motorcycle: 3,
  car: 3,
};
const ARRIVE_RADIUS_M = 35;
const POOR_ACCURACY_M = 60;

/**
 * Derives live speed, movement state, and arrival from a stream of GPS fixes.
 * - Uses the device-reported speed when available, else computes it from
 *   position deltas.
 * - Smooths with an exponential moving average to tame GPS noise.
 * - Never reports speed when accuracy is too poor (avoids false precision).
 */
export function useNavTelemetry(opts: {
  position: LatLng | null;
  deviceSpeed: number | null; // m/s
  accuracy: number | null;
  destination: LatLng;
  mode: TravelMode;
  active: boolean;
}): NavTelemetry {
  const { position, deviceSpeed, accuracy, destination, mode, active } = opts;

  const [telemetry, setTelemetry] = useState<NavTelemetry>({
    speedKmh: null,
    state: "waiting_gps",
    distanceTraveledM: 0,
  });

  const last = useRef<{ pos: LatLng; t: number } | null>(null);
  const ema = useRef<number | null>(null); // smoothed speed in m/s
  const hasMoved = useRef(false);
  const traveled = useRef(0);

  // Reset accumulators when navigation (re)starts.
  useEffect(() => {
    if (!active) {
      last.current = null;
      ema.current = null;
      hasMoved.current = false;
      traveled.current = 0;
      setTelemetry({ speedKmh: null, state: "waiting_gps", distanceTraveledM: 0 });
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (!position) {
      setTelemetry((t) => ({ ...t, state: "waiting_gps" }));
      return;
    }

    const now = Date.now();
    const prev = last.current;
    last.current = { pos: position, t: now };

    // Instantaneous speed (m/s): prefer device speed, else derive from delta.
    let inst: number | null = null;
    if (deviceSpeed != null && deviceSpeed >= 0) {
      inst = deviceSpeed;
    } else if (prev) {
      const dt = (now - prev.t) / 1000;
      if (dt > 0.3) {
        const d = haversineM(prev.pos, position);
        inst = d / dt;
        if (d > 1) traveled.current += d;
      }
    }

    if (inst != null) {
      ema.current = ema.current == null ? inst : ema.current * 0.6 + inst * 0.4;
    }

    const poorAccuracy = accuracy != null && accuracy > POOR_ACCURACY_M;
    const speedMs = ema.current ?? 0;
    const speedKmh = poorAccuracy || ema.current == null ? null : speedMs * 3.6;
    const moving = (speedKmh ?? 0) >= MOVE_THRESHOLD_KMH[mode];
    if (moving) hasMoved.current = true;

    const arrived = haversineM(position, destination) <= ARRIVE_RADIUS_M && hasMoved.current;

    let state: MovementState;
    if (arrived) state = "arrived";
    else if (!hasMoved.current) state = "waiting_move";
    else if (moving) state = "moving";
    else state = "stationary";

    setTelemetry({ speedKmh, state, distanceTraveledM: Math.round(traveled.current) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, deviceSpeed, accuracy, active, mode]);

  return telemetry;
}
