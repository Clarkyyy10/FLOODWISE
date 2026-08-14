# Design — Safer-Route Navigation

## Overview
Route planning composes three existing systems: the OSRM routing proxy (`/api/route`),
the Zustand store's live road conditions (`reliability.computeRoadCondition`), and the
Leaflet map. A route planner hook orchestrates origin/destination selection, requests
route geometry, scores each candidate against current reports, and drives the map + panel.

## Architecture
```
DestinationSearch ─┐
useGeolocation ────┤→ useRoutePlanner ─→ /api/route (OSRM) ─→ candidate routes
store conditions ──┘                     │
                                         ▼
                              risk scoring per route
                                         ▼
                     RouteOptionsPanel (compare) + LiveMap (draw)
                                         ▼
                              NavigationView (active nav)
```

## Components and Interfaces
- **useRoutePlanner** (`src/lib/useRoutePlanner.ts`): holds origin, destination (`place`),
  candidate routes, selected route, and `navigating` state; recomputes on origin/destination
  change (`originKey` forces refresh for shelter deep-links).
- **routing** (`src/lib/routing.ts`): calls `/api/route`, returns polylines + distance/time.
- **reliability** (`src/lib/reliability.ts`): per-road status, RRI, freshness decay,
  confirmation/AI weighting, official-closure override.
- **RouteOptionsPanel**: renders compared routes with risk labels and "Why this route?".
- **NavigationView**: active navigation UI (progress, ETA, speed via telemetry).

## Risk scoring (decision-support only)
For each route, intersect its geometry with reported roads and aggregate:
flood severity + vehicle/pedestrian status + hazards + report reliability/freshness.
Higher known-hazard exposure ⇒ higher risk score. The lowest-risk route with adequate
data is recommended. The score is explicitly not a real-world safety guarantee.

## Error Handling
- Routing/geocoding unavailable ⇒ show honest error + retry; do not fabricate a route.
- No adequate route ⇒ present shelters/alerts/map instead of a forced recommendation.
- Location denied ⇒ allow manual origin selection on the map.

## Testing Strategy
- Verify impassable roads are excluded/penalized from recommendations.
- Verify walking mode rejects vehicle-passable-but-pedestrian-unsafe roads.
- Verify expired reports are excluded and disputed reports are down-weighted.
- Verify no UI string claims a route is "safe/guaranteed".
