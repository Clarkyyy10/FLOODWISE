import { en, type Dictionary } from "@/locales/en";

// Lazy loaders for shipped UI dictionaries. Languages without a loader fall
// back to English for the UI (the AI can still respond in the chosen language).
export const DICTIONARY_LOADERS: Record<string, () => Promise<Dictionary>> = {
  fil: () => import("@/locales/fil").then((m) => m.fil),
  es: () => import("@/locales/es").then((m) => m.es),
  ja: () => import("@/locales/ja").then((m) => m.ja),
  ar: () => import("@/locales/ar").then((m) => m.ar),
};

export const BASE_DICTIONARY: Dictionary = en;

/** Build a translator over a merged dictionary (locale over English base). */
export function makeTranslator(dict: Dictionary) {
  return (key: string, vars?: Record<string, string | number>): string => {
    let str = dict[key] ?? BASE_DICTIONARY[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    // Dev aid: surface missing keys without showing raw dotted keys to users.
    if (str === key && process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing translation: ${key}`);
    }
    return str;
  };
}
