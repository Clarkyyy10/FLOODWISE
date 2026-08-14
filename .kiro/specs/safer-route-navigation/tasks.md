# Implementation Plan — Safer-Route Navigation

- [x] 1. Route request + display
  - Proxy OSRM through `/api/route`; parse geometry, distance, and duration.
  - Draw candidate routes on the Leaflet map.
  - _Requirements: 1.1_

- [x] 2. Origin/destination selection
  - Predictive destination search (Nominatim) via `DestinationSearch`.
  - "Use my current location" (GPS) and "Select on map" origin options.
  - _Requirements: 1.1, 2.1_

- [x] 3. Risk scoring against live reports
  - Score each route from `computeRoadCondition` outputs (severity, passability,
    verification, freshness); pick the lower-risk candidate.
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 4. Vehicle vs pedestrian handling
  - Prioritize pedestrian status in walking mode; never recommend
    vehicle-passable-but-pedestrian-unsafe roads to walkers.
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Route comparison + explanation UI
  - `RouteOptionsPanel` compares routes with risk labels and a "Why this route?" explanation.
  - Persistent disclaimer that no route is guaranteed safe.
  - _Requirements: 1.3, 4.1, 4.2_

- [x] 6. No-safe-route + outdated/disputed handling
  - When no adequate route exists, present shelters/alerts/map instead of forcing one.
  - Exclude expired reports; down-weight disputed reports.
  - _Requirements: 1.4, 3.1, 3.2_

- [x] 7. Active navigation
  - `NavigationView` with live progress, ETA, and speed telemetry.
  - _Requirements: 1.1, 4.1_
```
