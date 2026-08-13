// Map layer + style descriptors, kept out of the Leaflet module so non-map
// components (e.g. the Live Map page controls) can import them without pulling
// Leaflet into their bundle.

export interface MapLayers {
  conditions: boolean;
  closures: boolean;
  reports: boolean;
  shelters: boolean;
  route: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  conditions: true,
  closures: true,
  reports: true,
  shelters: true,
  route: true,
};

export type MapStyle = "dark" | "light" | "contrast";

export const LAYER_META: { key: keyof MapLayers; label: string }[] = [
  { key: "conditions", label: "Road Conditions" },
  { key: "closures", label: "Official Closures" },
  { key: "reports", label: "Flood Reports" },
  { key: "shelters", label: "Evacuation Centers" },
  { key: "route", label: "Active Route" },
];

export const MAP_STYLES: { value: MapStyle; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "contrast", label: "High Contrast" },
];
