"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { LANGUAGES, languageMeta } from "@/lib/languages";

export default function LanguageSettings() {
  const { locale, setLocale, recent, t, translating } = useI18n();
  const [query, setQuery] = useState("");

  const current = languageMeta(locale);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? LANGUAGES.filter(
          (l) =>
            l.english.toLowerCase().includes(q) ||
            l.native.toLowerCase().includes(q) ||
            l.code.toLowerCase().includes(q),
        )
      : LANGUAGES;
    return [...list].sort((a, b) => a.english.localeCompare(b.english));
  }, [query]);

  const recentLangs = recent
    .map((c) => languageMeta(c))
    .filter((l): l is NonNullable<typeof l> => !!l);

  function Row({ code }: { code: string }) {
    const l = languageMeta(code)!;
    const active = code === locale;
    return (
      <button
        onClick={() => setLocale(code)}
        aria-pressed={active}
        lang={code}
        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
          active ? "border-brand/50 bg-brand/10 text-white" : "border-white/10 text-zinc-200 hover:bg-white/5"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="font-medium">{l.native}</span>
          <span className="text-[11px] text-zinc-500">{l.english}</span>
        </span>
        {active && <span className="text-brand">✓</span>}
        {!active && l.rtl && <span className="text-[10px] text-zinc-500">RTL</span>}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
          {t("settings.currentLanguage")}
        </div>
        <div className="mt-0.5 text-sm text-white" lang={locale}>
          🌐 {current ? `${current.native} — ${current.english}` : locale}
        </div>
        {translating && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-brand">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand/40 border-t-brand" />
            Translating interface…
          </div>
        )}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("settings.searchLanguages")}
        aria-label={t("settings.searchLanguages")}
        className="w-full rounded-md border border-white/15 bg-[#0d0d10] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand focus:outline-none"
      />

      {!query && recentLangs.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
            {t("settings.recentlyUsed")}
          </div>
          <div className="space-y-1">
            {recentLangs.map((l) => (
              <Row key={`recent-${l.code}`} code={l.code} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
          {t("settings.allLanguages")}
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
          {filtered.map((l) => (
            <Row key={l.code} code={l.code} />
          ))}
          {filtered.length === 0 && (
            <div className="py-6 text-center text-xs text-zinc-500">No languages found.</div>
          )}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-500">{t("settings.languageNote")}</p>
    </div>
  );
}
