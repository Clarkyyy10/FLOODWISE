// English base dictionary — the source of truth for all translation keys.
// Other locales provide a subset; anything missing falls back to English.

export const en = {
  "nav.liveMap": "Live Map",
  "nav.routes": "Routes",
  "nav.report": "Report",
  "nav.alerts": "Alerts",
  "nav.shelters": "Shelters",
  "nav.askAI": "Ask AI",
  "nav.more": "More",
  "nav.lgu": "LGU / DRRM",

  "brand.region": "Marikina & Nearby Cities",

  "common.search": "Search",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.next": "Next",
  "common.submit": "Submit",
  "common.close": "Close",
  "common.tryAgain": "Try Again",
  "common.loading": "Loading",
  "common.save": "Save",
  "common.clear": "Clear",
  "common.enable": "Enable",
  "common.signIn": "Sign in / Create account",
  "common.logout": "Logout",

  "settings.title": "Settings",
  "settings.appearanceA11y": "Appearance & Accessibility",
  "settings.privacy": "Privacy",
  "settings.theme": "Theme",
  "settings.accent": "Accent",
  "settings.textSize": "Text Size",
  "settings.motion": "Motion",
  "settings.language": "Language",
  "settings.currentLanguage": "Current language",
  "settings.changeLanguage": "Change language",
  "settings.searchLanguages": "Search languages…",
  "settings.recentlyUsed": "Recently used",
  "settings.allLanguages": "All languages",
  "settings.chooseLanguage": "Choose your language",
  "settings.languageNote":
    "The interface uses your language where translations are available and falls back to English otherwise. The AI assistant can respond in your chosen language.",

  "theme.dark": "Dark",
  "theme.light": "Light",
  "theme.contrast": "High Contrast",
  "theme.system": "System",

  "motion.full": "Full",
  "motion.reduced": "Reduced",
  "motion.off": "Off",

  "text.sm": "Small",
  "text.md": "Default",
  "text.lg": "Large",
  "text.xl": "Extra Large",

  "status.passable": "Passable",
  "status.caution": "Caution",
  "status.avoid": "Avoid",
  "status.closed": "Officially Closed",
  "status.unknown": "Unknown",

  "report.status.pending": "Pending",
  "report.status.verified": "Verified",
  "report.status.disputed": "Disputed",
  "report.status.expired": "Expired",
  "report.status.rejected": "Rejected",

  "more.myReports": "My Reports",
  "more.guidelines": "Community Guidelines",
  "more.settings": "Settings",
  "more.about": "About FloodWise",
  "more.help": "Help & Support",

  "map.liveConditions": "Live Conditions",
  "map.title": "Marikina Valley Flood Map",
  "map.map": "Map",
  "map.list": "List",
  "map.stat.avoid": "Roads: Avoid",
  "map.stat.caution": "Caution",
  "map.stat.passable": "Passable",
  "map.stat.closures": "Closures",
  "map.recentReports": "Recent Reports",
  "map.layers": "Layers",
  "map.mapStyle": "Map Style",

  "loc.using": "Using your current location",
  "loc.locating": "Getting your location…",
  "loc.idle": "Location not enabled",
  "loc.unavailable": "Location unavailable — using Marikina center",

  "legend.roadConditions": "Road Conditions",
  "legend.reportStatus": "Report Status",
  "glyph.verified": "Verified",
  "glyph.community": "Community",
  "glyph.disputed": "Disputed",
  "glyph.outdated": "Outdated",

  "search.placeholder": "Where do you want to go?",

  "clock.date": "Date",
  "clock.time": "Time",
  "clock.status": "Status",
  "clock.live": "LIVE",
  "clock.flood": "FLOOD",
  "clock.admin": "ADMIN",

  "flood.title": "Active Flood Event",
  "flood.body":
    "Heavy rainfall currently detected in Marikina and nearby cities. Current conditions may change rapidly. If you are already in a safe location and can safely observe the road, you can help the community by submitting a current report.",
  "flood.safety": "Report only if you can do so safely — never enter floodwater.",
  "flood.reportBtn": "Report Current Conditions",
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Record<string, string>;
