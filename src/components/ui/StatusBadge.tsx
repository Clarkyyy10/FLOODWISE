"use client";

import type { RoadStatus } from "@/lib/types";
import { STATUS_COLOR, STATUS_TKEY, STATUS_EMOJI } from "@/lib/constants";
import { useI18n } from "@/components/providers/I18nProvider";

export function StatusBadge({ status, size = "sm" }: { status: RoadStatus; size?: "sm" | "md" }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      }`}
      style={{ backgroundColor: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}
    >
      <span>{STATUS_EMOJI[status]}</span>
      {t(STATUS_TKEY[status])}
    </span>
  );
}

export function ReliabilityBar({ value }: { value: number }) {
  const color = value >= 80 ? "#22c55e" : value >= 50 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

export function timeAgo(ts: number | null): string {
  if (ts === null) return "no reports yet";
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}
