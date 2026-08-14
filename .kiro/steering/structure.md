# FloodWise — Project Structure

```
src/
  app/                     # Next.js App Router pages + API routes
    page.tsx               # Live flood map (home)
    routes/                # Safer-route planning + navigation
    report/                # Community report wizard
    alerts/                # Alerts feed
    shelters/              # Evacuation shelters
    ai/                    # AI assistant chat
    more/                  # Settings, language, legal, Demo/Presentation panel
    lgu/                   # LGU/DRRM admin dashboard (role-guarded)
    login/ register/       # Auth (mock) with reCAPTCHA
    agreement/ terms/ privacy/   # Onboarding + legal
    api/
      ai/{assess,chat}/    # Gemini endpoints
      geocode/             # Nominatim proxy
      route/               # OSRM proxy
      i18n/translate/      # Machine-translation fallback
      auth/captcha/        # reCAPTCHA server-side verification
  components/
    layout/                # SideNav, BottomNav, ContentFrame, ActiveFloodBanner
    map/                   # Leaflet map views + style toggle
    routes/                # DestinationSearch, RouteOptionsPanel, NavigationView
    providers/             # Theme, i18n, Auth, AuthGate
    settings/  ui/  auth/  # Settings panels, UI kit, Captcha widget
  lib/
    store.ts               # Zustand store (single source of runtime state)
    mockData.ts            # SIMULATED demo dataset (reports/shelters/alerts/weather)
    reliability.ts         # Evidence engine -> RoadCondition + Road Reliability Index
    reliability/constants/geo/geocoding/routing/ai/auth/agreement/settings/languages
  locales/                 # en, fil, es, ja, ar dictionaries
  hooks/                   # useGeolocation
```

## Key flows
- **Reports → conditions:** `store.reports` + `reliability.computeRoadCondition()` produce
  each road's status, freshness, and reliability, consumed by map/navigation/AI/dashboard.
- **Auth gate:** `AuthProvider` + `AuthGate` require login; `/lgu` is admin-only (role guard).
- **Demo reset:** `store.resetDemo()` restores the simulated scenario for repeatable demos.

## Conventions
- Provider nesting in `layout.tsx`:
  `ThemeProvider > I18nProvider > AuthProvider > shell(SideNav, main>ContentFrame>AuthGate>children, BottomNav)`.
- Public routes: `/login`, `/register`, `/agreement`, `/terms`, `/privacy`.
- All new UI must stay responsive and translatable (`t()` where practical).
