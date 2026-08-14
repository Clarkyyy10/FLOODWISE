# Requirements — Safer-Route Navigation

## Introduction
FloodWise helps residents reach a destination using the lower-risk route based on
current community flood reports. The system must never claim a route is guaranteed
safe, and must treat vehicle and pedestrian passability separately.

## Requirements

### Requirement 1 — Find a lower-risk route
**User Story:** As a resident, I want the app to suggest a lower-risk route to my
destination, so that I can avoid roads reported as flooded.

#### Acceptance Criteria
1. WHEN the user selects an origin and destination THEN the system SHALL request route
   options from the routing service (OSRM) and display them on the map.
2. WHEN route options are available THEN the system SHALL score each route using current
   FloodWise reports (severity, passability, verification, freshness).
3. WHEN routes are scored THEN the system SHALL recommend the lower-risk option and label
   it "lower-risk based on available information" — never "safe" or "guaranteed".
4. IF all routes have significant hazards or insufficient data THEN the system SHALL NOT
   force a recommendation and SHALL offer shelters, alerts, and the flood map instead.

### Requirement 2 — Vehicle vs pedestrian passability
**User Story:** As a pedestrian, I want walking-specific guidance, so that I am not sent
down a road that is drivable but unsafe on foot.

#### Acceptance Criteria
1. WHEN the travel mode is walking THEN the system SHALL prioritize pedestrian passability.
2. WHEN a road is vehicle-passable but pedestrian-unsafe THEN the system SHALL NOT
   recommend it to a walking user.
3. WHEN displaying a route THEN the system SHALL show both vehicle and pedestrian status.

### Requirement 3 — Report freshness and status
**User Story:** As a user, I want stale or disputed reports treated cautiously, so that
old information does not drive my route.

#### Acceptance Criteria
1. WHEN a report is older than its lifetime window THEN the system SHALL exclude it from
   current route scoring and mark it outdated.
2. WHEN a report is disputed THEN the system SHALL reduce its weight and surface the conflict.
3. WHEN an official closure exists THEN the system SHALL treat the road as closed regardless
   of community reports.

### Requirement 4 — Safety communication
**User Story:** As a user, I want honest safety messaging, so that I keep my own judgment.

#### Acceptance Criteria
1. WHEN a route is recommended THEN the system SHALL display a disclaimer that conditions can
   change and no route is guaranteed safe.
2. WHEN the user asks the AI why a route was chosen THEN the AI SHALL explain using only
   available FloodWise data and SHALL NOT claim guaranteed safety.
