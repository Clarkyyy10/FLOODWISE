"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./MapView";

// Leaflet touches window/document, so it must never render on the server.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b1220] text-sm text-gray-400">
      Loading map…
    </div>
  ),
});

export default function LiveMap(props: MapViewProps) {
  return <MapView {...props} />;
}
