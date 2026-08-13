"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";

// Technical date/time/status readout, styled like the reference top-right panel.
export default function LiveClock({ status = "LIVE" }: { status?: string }) {
  const { t } = useI18n();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = now
    ? now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()
    : "--";
  const time = now ? now.toLocaleTimeString("en-US", { hour12: true }) : "--";

  return (
    <div className="panel rounded-md px-3 py-2 font-mono">
      <Row k={t("clock.date")} v={date} />
      <Row k={t("clock.time")} v={time} />
      <Row k={t("clock.status")} v={<span className="text-status-passable">{status}</span>} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[11px]">
      <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">{k}</span>
      <span className="font-semibold text-zinc-100">{v}</span>
    </div>
  );
}
