"use client";

import dynamic from "next/dynamic";
import type { ScoredRoute } from "@/lib/routing";
import type { MapStyle } from "@/lib/mapLayers";

type LatLng = [number, number];

const NavMapView = dynamic(() => import("./NavMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b1220] text-sm text-gray-400">
      Loading map…
    </div>
  ),
});

export default function NavMap(props: {
  route: ScoredRoute;
  destination: { lat: number; lng: number; name: string };
  userPosition: LatLng | null;
  heading: number | null;
  follow: boolean;
  recenterToken: number;
  onUserPan: () => void;
  mapStyle?: MapStyle;
}) {
  return <NavMapView {...props} />;
}
