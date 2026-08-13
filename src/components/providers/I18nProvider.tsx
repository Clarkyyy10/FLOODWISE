"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BASE_DICTIONARY, DICTIONARY_LOADERS, makeTranslator } from "@/lib/i18n";
import { isRtl, languageMeta } from "@/lib/languages";
import type { Dictionary } from "@/locales/en";

interface Ctx {
  locale: string;
  dir: "ltr" | "rtl";
  recent: string[];
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (code: string) => void;
  ready: boolean;
  translating: boolean;
}

const I18nContext = createContext<Ctx | null>(null);

const LOCALE_KEY = "fw_locale";
const RECENT_KEY = "fw_locale_recent";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState("en");
  const [dict, setDict] = useState<Dictionary>(BASE_DICTIONARY);
  const [recent, setRecent] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [translating, setTranslating] = useState(false);

  const applyDocLang = useCallback((code: string) => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = code;
    document.documentElement.dir = isRtl(code) ? "rtl" : "ltr";
  }, []);

  const loadDict = useCallback(async (code: string) => {
    if (code === "en") {
      setDict(BASE_DICTIONARY);
      return;
    }

    // 1. Bundled hand-written dictionary.
    const loader = DICTIONARY_LOADERS[code];
    if (loader) {
      try {
        setDict(await loader());
      } catch {
        setDict(BASE_DICTIONARY);
      }
      return;
    }

    // 2. Cached machine translation from a previous session.
    try {
      const cached = localStorage.getItem(`fw_dict_${code}`);
      if (cached) {
        setDict(JSON.parse(cached) as Dictionary);
        return;
      }
    } catch {
      /* ignore */
    }

    // 3. Translate the whole UI dictionary on demand (Gemini), then cache it.
    setTranslating(true);
    setDict(BASE_DICTIONARY); // keep UI usable (English) while translating
    try {
      const meta = languageMeta(code);
      const res = await fetch("/api/i18n/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: meta?.english ?? code, code }),
      });
      const data = (await res.json()) as {
        configured?: boolean;
        translations?: Dictionary;
      };
      if (data.translations) {
        setDict(data.translations);
        try {
          localStorage.setItem(`fw_dict_${code}`, JSON.stringify(data.translations));
        } catch {
          /* storage full */
        }
      }
    } catch {
      setDict(BASE_DICTIONARY);
    } finally {
      setTranslating(false);
    }
  }, []);

  // Load persisted locale on mount.
  useEffect(() => {
    const saved =
      (typeof window !== "undefined" && localStorage.getItem(LOCALE_KEY)) || "en";
    let savedRecent: string[] = [];
    try {
      savedRecent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    } catch {
      savedRecent = [];
    }
    setRecent(savedRecent);
    setLocaleState(saved);
    applyDocLang(saved);
    loadDict(saved).finally(() => setReady(true));
  }, [applyDocLang, loadDict]);

  const setLocale = useCallback(
    (code: string) => {
      setLocaleState(code);
      applyDocLang(code);
      void loadDict(code);
      try {
        localStorage.setItem(LOCALE_KEY, code);
        const nextRecent = [code, ...recent.filter((c) => c !== code)].slice(0, 5);
        setRecent(nextRecent);
        localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
      } catch {
        /* storage unavailable */
      }
    },
    [applyDocLang, loadDict, recent],
  );

  const t = useMemo(() => makeTranslator(dict), [dict]);
  const dir: "ltr" | "rtl" = isRtl(locale) ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, dir, recent, t, setLocale, ready, translating }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
