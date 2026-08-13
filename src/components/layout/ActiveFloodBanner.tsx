"use client";

import Link from "next/link";
import { useState } from "react";
import { useFloodWise } from "@/lib/store";
import { useI18n } from "@/components/providers/I18nProvider";

export default function ActiveFloodBanner({ compact = false }: { compact?: boolean }) {
  const active = useFloodWise((s) => s.activeFloodMode);
  const weather = useFloodWise((s) => s.weather);
  const { t } = useI18n();
  const [open, setOpen] = useState(!compact);
  if (!active) return null;

  return (
    <div className="w-fit max-w-md rounded-md border-l-4 border-amber-400 bg-[#0d0d10]/95 px-3 py-2 shadow-lg ring-1 ring-white/10 backdrop-blur">
      <button
        onClick={() => compact && setOpen((v) => !v)}
        className="flex items-center gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-400">
          🌧 {t("flood.title")}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-amber-200/80">
          · {weather.rainfallMmHr}mm/hr
        </span>
        {compact && <span className="text-[10px] text-amber-200/60">{open ? "▲" : "▼"}</span>}
      </button>

      {open && (
        <>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-200">{t("flood.body")}</p>
          <p className="mt-1 text-[11px] font-medium text-amber-300">{t("flood.safety")}</p>
          <Link
            href="/report"
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black"
          >
            📷 {t("flood.reportBtn")}
          </Link>
        </>
      )}
    </div>
  );
}
