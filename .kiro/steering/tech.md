# FloodWise — Tech Stack & Conventions

## Stack
- **Framework:** Next.js 16 (App Router) + React 19, TypeScript.
- **Styling:** Tailwind CSS. Dark technical theme, JetBrains Mono, red brand accent
  (`rgb(var(--brand))`). Light/contrast themes and font-size scaling supported.
- **State:** Zustand store (`src/lib/store.ts`) holding reports, shelters, alerts,
  closures, weather; road conditions are computed live.
- **Map:** Leaflet + OpenStreetMap tiles (no API key). Dark/light/contrast tile filters.
- **Geocoding:** Nominatim via `/api/geocode` (search + reverse).
- **Routing:** OSRM public demo via `/api/route` (driving profile only on the public demo).
- **AI:** Google Gemini (`@google/genai`) via `/api/ai/*`, grounded in live FloodWise data.
- **Weather:** Open-Meteo (`src/lib/liveData.ts`).
- **CAPTCHA:** Google reCAPTCHA v2 with server-side verification (`/api/auth/captcha`).

## Commands
- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build (run before declaring changes done)

## Environment (`.env.local`, git-ignored)
- `GEMINI_API_KEY`, `GEMINI_MODEL` (defaults to `gemini-flash-lite-latest`)
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (public), `RECAPTCHA_SECRET_KEY` (server-only)
- Secrets never use the `NEXT_PUBLIC_` prefix; provider secret keys stay server-side.

## Conventions
- Reuse existing systems (map, routing, auth) — do not duplicate engines.
- Honor the product safety principles: no guaranteed-safe language, honest fallbacks.
- Verify with `get_diagnostics` + `npm run build` after changes.
- Keep responsive: fluid type via `clamp()`, safe-area utilities, buttons wrap/scale.
