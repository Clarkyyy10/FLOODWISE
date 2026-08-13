"use client";

import type { MapStyle } from "@/lib/mapLayers";

// One-tap Dark/Light map toggle. The icon shows the mode you'll switch TO.
// (High Contrast remains available via the Layers panel on the Live Map.)
export default function MapStyleToggle({
  value,
  onChange,
  className = "",
}: {
  value: MapStyle;
  onChange: (v: MapStyle) => void;
  className?: string;
}) {
  const isLight = value === "light";
  const next: MapStyle = isLight ? "dark" : "light";
  return (
    <button
      onClick={() => onChange(next)}
      aria-label={`Switch to ${next} map`}
      title={`Switch to ${next} map`}
      className={`flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-[#09090b]/90 text-lg text-white shadow-lg backdrop-blur transition hover:border-brand/40 ${className}`}
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
}
