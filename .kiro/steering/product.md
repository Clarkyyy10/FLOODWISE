# FloodWise — Product Overview

FloodWise is a trust-aware flood intelligence and navigation web app for Marikina
City and nearby areas (Cainta, Pasig, Taytay, Antipolo, San Mateo, Rodriguez, and
parts of Quezon City). It turns community observations during active flooding into a
Road Reliability Index and lower-risk route recommendations.

## Core idea
Report what you safely see. Know what you can trust. Take the safer route.

## Primary features
- **Live flood map** — community reports rendered as road-condition markers with
  verification status, confidence, and freshness.
- **Community reporting** — residents submit road/pedestrian passability, flood depth,
  and hazards from a safe location.
- **Safer-route navigation** — routing that avoids roads reported as flooded/impassable,
  with separate vehicle vs pedestrian passability.
- **AI assistant** — answers grounded in current FloodWise data (Gemini).
- **Alerts** — weather, flood, road closure, pedestrian, evacuation, official advisories.
- **Evacuation shelters** — status, capacity, occupancy.
- **LGU/DRRM dashboard** — admin-only verification, closures, shelter management, analytics.
- **Multilingual UI** and **responsive design** across phone/tablet/desktop.

## Non-negotiable principles
- **Never fake functionality.** Every feature uses real data/services or an honest fallback.
- **Never guarantee safety.** Use "lower-risk based on current available information."
  Distinguish community reports from official information, and pedestrian vs vehicle passability.
- **Safety first.** Never encourage users to enter danger to submit a report.
- **Unknown is not safe.** Old reports lose influence; official closures override everything.

## Data status (honest)
This build uses in-memory mock/demo data and client-side mock auth (localStorage).
It is structured to migrate to a real backend/database later. Demo data is clearly
labeled as simulated.
