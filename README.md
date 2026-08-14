<p align="center">
  <img src="https://img.shields.io/badge/FloodWise-Marikina%20Flood%20Intelligence-ef4444?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48L3N2Zz4=" alt="FloodWise" />
</p>

<h1 align="center">🌊 FloodWise</h1>

<p align="center">
  <strong>Community-Driven Flood Intelligence for Marikina City & Nearby Areas</strong>
</p>

<p align="center">
  <em>"Report what you safely see. Know what you can trust. Take the safer route."</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285f4?logo=google" alt="Gemini AI" />
</p>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Safety Principles](#-safety-principles)
- [Key Concepts](#-key-concepts)
- [Available Scripts](#-available-scripts)
- [Internationalization](#-internationalization)
- [Accessibility & Theming](#-accessibility--theming)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌊 About

**FloodWise** is a real-time flood intelligence and navigation platform built for residents, commuters, and local government units (LGUs) in Marikina City and the Marikina River basin area in the Philippines.

The app empowers communities to share on-the-ground flood observations, provides AI-assessed evidence reliability, computes safe navigation routes that avoid flooded roads, and gives LGU disaster risk reduction teams (DRRM) a comprehensive dashboard to manage the situation.

FloodWise is designed with **safety-first principles** — it never guarantees safety, always shows data confidence levels, and treats missing information as potentially dangerous.

---

## ✨ Features

### 🗺️ Live Flood Map
- Interactive Leaflet-based map showing real-time road conditions
- Color-coded status: 🟢 Passable · 🟡 Caution · 🔴 Avoid · ⛔ Closed · ⚪ Unknown
- Multiple map styles: Dark, Light, Satellite, Terrain
- Toggleable layers: road conditions, shelters, flood reports, official closures
- Geolocation with recenter capability

### 📷 Community Flood Reporting
- Guided 7-step reporting flow with safety confirmation gate
- Report vehicle passability, pedestrian conditions, flood depth levels, and hazards
- Photo upload with AI evidence assessment (Google Gemini)
- Location selection via map pin or search
- Reports expire after 90 minutes (freshness decay built-in)

### 🧭 Safer Route Planning
- OSRM-based route candidates scored against live flood conditions
- Routes labeled: **Safest** / **Balanced** / **Fastest**
- Travel modes: 🚗 Car · 🏍️ Motorcycle · 🚶 Walking
- Live turn-by-turn navigation with deviation detection
- Route degradation alerts if conditions change mid-journey

### 🤖 AI Assistant
- Grounded chatbot powered by Google Gemini
- Answers ONLY from current FloodWise data + Open-Meteo live weather
- Never invents flood depths, road statuses, or safety guarantees
- Confidence indicators on every response
- Actionable quick-reply buttons (view map, find route, find shelter, etc.)

### 🔔 Smart Alerts
- Weather warnings, flood notifications, road status changes
- Route-specific alerts for degraded conditions
- Advisory and system notifications
- Mark-as-read support

### 🏠 Evacuation Shelters
- List of shelters with real-time status (Open / Full / Closed)
- Capacity and current occupancy
- One-tap "Get Safest Route" navigation to any shelter
- Distance sorting from user's current location

### 🏛️ LGU / DRRM Dashboard (Admin)
- Role-gated access for local government users
- **Overview** — key stats at a glance
- **Live Flood Map** — full-featured admin map view
- **Reports Queue** — verify, reject, or mark reports as outdated
- **Official Road Closures** — toggle road closures that override community data
- **Barangay Monitoring** — per-barangay condition tracking
- **Shelter Management** — update shelter status, capacity, occupancy
- **User Management** — manage citizen and LGU accounts
- **Advisory Management** — publish advisories to citizens
- **Analytics & History** — historical data and trends

### 🌐 Internationalization (i18n)
- 40+ supported languages
- Bundled dictionaries for English, Filipino, Spanish, Japanese, Arabic
- On-demand AI translation via Gemini for other languages
- RTL (right-to-left) support
- Cached translations in localStorage for offline access

### 🎨 Accessibility & Theming
- Dark, Light, and High-Contrast themes
- Adjustable font sizes (SM / MD / LG / XL) with fluid scaling
- Reduced motion support (Full / Reduced / Off)
- Safe-area support for modern devices (notches, rounded corners)
- WCAG focus indicators
- Zoom enabled (up to 5×) for accessibility

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16.3](https://nextjs.org/) (App Router) |
| **UI** | [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS + Autoprefixer |
| **Maps** | [Leaflet 1.9.4](https://leafletjs.com/) + [React-Leaflet 5.0](https://react-leaflet.js.org/) (SSR-safe dynamic imports) |
| **State Management** | [Zustand 5.0.3](https://zustand-demo.pmnd.rs/) |
| **AI / LLM** | [Google Gemini](https://ai.google.dev/) via `@google/genai` SDK (server-side) |
| **Routing Engine** | [OSRM](http://project-osrm.org/) (server-proxied) |
| **Geocoding** | [OpenStreetMap Nominatim](https://nominatim.org/) (server-proxied) |
| **Weather Data** | [Open-Meteo](https://open-meteo.com/) (free, no API key) |
| **Font** | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.17 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (optional — AI features degrade gracefully without it)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/floodwise.git
cd floodwise

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Gemini API key

# 4. Start the development server
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory (it's git-ignored by default):

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Optional* | Google Gemini API key for AI features. Get one at [AI Studio](https://aistudio.google.com/app/apikey). |
| `GEMINI_MODEL` | No | Override the default model. Defaults to `gemini-flash-lite-latest`. |

> \*AI features (chat assistant, photo evidence assessment, on-demand translation) will gracefully fall back to heuristic methods if no key is provided.

⚠️ **Security**: These are server-side only variables. Never prefix with `NEXT_PUBLIC_` — that would leak keys to the browser.

---

## 📁 Project Structure

```
floodwise/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home — Live Flood Map
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── globals.css         # Tailwind + theme variables
│   │   ├── alerts/             # Alerts page
│   │   ├── shelters/           # Evacuation shelters
│   │   ├── routes/             # Route planning
│   │   ├── report/             # Community reporting
│   │   ├── ai/                 # AI Assistant chat
│   │   ├── lgu/                # LGU/DRRM admin dashboard
│   │   ├── more/               # Settings & more
│   │   ├── login/              # Authentication
│   │   ├── register/           # Registration
│   │   ├── agreement/          # User agreement gate
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   └── api/                # API Routes
│   │       ├── ai/chat/        # AI chat endpoint
│   │       ├── ai/assess/      # AI evidence assessment
│   │       ├── geocode/        # Geocoding proxy
│   │       ├── route/          # OSRM routing proxy
│   │       └── i18n/translate/ # On-demand translation
│   ├── components/
│   │   ├── layout/             # SideNav, BottomNav, ContentFrame, ActiveFloodBanner
│   │   ├── map/                # LiveMap, MapView, NavMap, MapStyleToggle
│   │   ├── providers/          # AuthProvider, ThemeProvider, I18nProvider, AuthGate
│   │   ├── routes/             # DestinationSearch, RouteOptionsPanel, NavigationView
│   │   ├── settings/           # AppearanceSettings, LanguageSettings
│   │   └── ui/                 # ActionButton, StatusBadge, LiveClock, kit
│   ├── hooks/
│   │   └── useGeolocation.ts   # Geolocation hook
│   └── lib/
│       ├── store.ts            # Zustand global store
│       ├── types.ts            # TypeScript domain types
│       ├── constants.ts        # App constants, status colors/labels
│       ├── reliability.ts      # Evidence engine & Road Reliability Index
│       ├── confidence.ts       # Confidence scoring
│       ├── ai.ts               # AI client helpers
│       ├── auth.ts             # Auth utilities
│       ├── routing.ts          # Route scoring logic
│       ├── geocoding.ts        # Geocoding utilities
│       ├── liveData.ts         # Open-Meteo live data fetcher
│       ├── mapLayers.ts        # Map layer definitions
│       ├── languages.ts        # Language registry (40+ langs)
│       ├── mockData.ts         # Demo/mock data
│       ├── agreement.ts        # Agreement helpers
│       └── useRoutePlanner.ts  # Route planning hook
├── .env.example                # Environment variable template
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies & scripts
├── postcss.config.mjs          # PostCSS configuration
└── tailwind.config.ts          # Tailwind CSS configuration
```

---

## 🛡️ Safety Principles

FloodWise is built around strict safety rules:

1. **Never guarantee safety** — The app provides information, not safety assurances. Users must make their own decisions.
2. **AI is one input, never the sole determinant** — AI assessments supplement community data but never override it alone.
3. **"Unknown" is never treated as safe** — Missing data always results in cautious recommendations.
4. **Freshness matters** — Reports decay in weight over time (15-minute fresh window, 90-minute expiry).
5. **Official closures override everything** — LGU-declared closures always take precedence over community reports.
6. **Never enter floodwater** — The app actively discourages dangerous behavior and includes safety gates before reporting.

---

## 🔧 Key Concepts

### Road Reliability Index (RRI)

A score from 0 to 100 that indicates how much you can trust the current status of a road:

- **Evidence Volume** — More recent reports = higher reliability
- **Community Agreement** — Consistent reports boost confidence
- **Freshness Decay** — Older reports lose influence linearly
- **Official Data** — Verified closures provide maximum reliability

### Evidence Engine

The reliability system combines multiple inputs:
- Weighted report consensus (freshness × agreement × AI factor)
- Community confirmations ("Still accurate" / "Situation changed" / "Appears incorrect")
- AI evidence assessment (photo analysis via Gemini)
- Official closure status (always overrides)

### Confidence Levels

Every piece of information shows a confidence indicator:
- **High** — Multiple recent, consistent reports with high RRI
- **Medium** — Some evidence available but limited agreement
- **Low** — Sparse or conflicting data
- **Unknown** — No recent data available

---

## 📜 Available Scripts

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

---

## 🌐 Internationalization

FloodWise supports 40+ languages including:

| Language | Status |
|----------|--------|
| English | ✅ Full dictionary |
| Filipino | ✅ Full dictionary |
| Spanish | ✅ Full dictionary |
| Japanese | ✅ Full dictionary |
| Arabic | ✅ Full dictionary (RTL) |
| Others (40+) | 🤖 AI-translated on demand |

- Language selection is available in Settings (More → Language)
- AI translations are cached in `localStorage` for offline use
- The AI assistant can respond in the user's selected language regardless of dictionary availability
- RTL layout automatically activates for Arabic, Hebrew, Urdu, Persian, etc.

---

## ♿ Accessibility & Theming

### Themes
- **Dark** (default) — optimized for low-light and battery saving
- **Light** — high readability in daylight
- **High Contrast** — stronger borders and pure white text for visibility

### Font Scaling
Fluid font sizing with 4 presets:
- **SM** — Compact (12–15px)
- **MD** — Default (13.5–16px)
- **LG** — Large (15–18px)
- **XL** — Extra Large (16.5–20px)

### Motion Preferences
- **Full** — All animations enabled
- **Reduced** — Minimal transitions
- **Off** — No animations at all

### Device Support
- Safe-area insets for notched/rounded displays
- User-scalable up to 5× zoom
- Bottom navigation on mobile, sidebar on desktop
- Responsive layout adapts from small phones to large displays

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and commit: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Guidelines
- Follow the existing code style (TypeScript strict, Tailwind utilities)
- Maintain safety-first principles in all new features
- Ensure accessibility compliance (WCAG focus indicators, semantic HTML)
- Keep AI grounding rules — never let the AI invent safety data
- Add i18n keys for any new user-facing strings

---

## 📄 License

This project is private. All rights reserved.

---

<p align="center">
  <strong>Built with ❤️ for the safety of Marikina communities</strong>
</p>

<p align="center">
  <sub>FloodWise does not guarantee safety. Always follow official DRRM instructions and never enter floodwater.</sub>
</p>
