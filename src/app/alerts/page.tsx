"use client";

import { useFloodWise } from "@/lib/store";
import { timeAgo } from "@/components/ui/StatusBadge";
import type { AlertKind } from "@/lib/types";

const KIND_META: Record<AlertKind, { icon: string; label: string; color: string }> = {
  weather: { icon: "🌧️", label: "Weather Alert", color: "#38bdf8" },
  flood: { icon: "🌊", label: "Flood Alert", color: "#22d3ee" },
  road: { icon: "🔴", label: "Road Alert", color: "#ef4444" },
  route: { icon: "⚠️", label: "Route Alert", color: "#eab308" },
  advisory: { icon: "📢", label: "Official Advisory", color: "#a78bfa" },
  report_request: { icon: "📷", label: "Reporting Request", color: "#f59e0b" },
  system: { icon: "ℹ️", label: "System Message", color: "#9ca3af" },
};

export default function AlertsPage() {
  const alerts = useFloodWise((s) => s.alerts);
  const markRead = useFloodWise((s) => s.markAlertRead);
  const markAll = useFloodWise((s) => s.markAllAlertsRead);

  const sorted = [...alerts].sort((a, b) => b.at - a.at);

  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">Alerts</h1>
          <p className="text-[11px] text-gray-400">Notifications</p>
        </div>
        <button onClick={markAll} className="text-xs font-medium text-brand">
          Mark all as read
        </button>
      </header>

      <div className="space-y-2 px-4 pb-6">
        {sorted.map((a) => {
          const meta = KIND_META[a.kind];
          return (
            <button
              key={a.id}
              onClick={() => markRead(a.id)}
              className={`block w-full rounded-xl border p-3 text-left ${
                a.read ? "border-white/10 bg-white/5" : "border-brand/40 bg-brand/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: meta.color }}
                >
                  {meta.icon} {meta.label}
                </span>
                <span className="text-[10px] text-gray-500">{timeAgo(a.at)}</span>
              </div>
              <div className="mt-1 text-sm font-medium text-white">{a.title}</div>
              <div className="mt-0.5 text-xs text-gray-400">{a.body}</div>
              {!a.read && (
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
