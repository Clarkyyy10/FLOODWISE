"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useFloodWise } from "@/lib/store";
import LiveMap from "@/components/map/LiveMap";
import { StatusBadge, ReliabilityBar, timeAgo } from "@/components/ui/StatusBadge";
import { StatCard, Eyebrow } from "@/components/ui/kit";
import LiveClock from "@/components/ui/LiveClock";
import { STATUS_LABEL, FLOOD_LEVEL_OPTIONS, HAZARD_OPTIONS } from "@/lib/constants";
import type { Report } from "@/lib/types";

type Tab =
  | "overview"
  | "map"
  | "reports"
  | "closures"
  | "barangays"
  | "shelters"
  | "users"
  | "advisories"
  | "analytics"
  | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "map", label: "Live Flood Map" },
  { id: "reports", label: "Reports Queue" },
  { id: "closures", label: "Official Road Closures" },
  { id: "barangays", label: "Barangay Monitoring" },
  { id: "shelters", label: "Shelter Management" },
  { id: "users", label: "User Management" },
  { id: "advisories", label: "Advisory Management" },
  { id: "analytics", label: "Analytics & History" },
  { id: "settings", label: "System Settings" },
];

export default function LguDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const router = useRouter();
  const { session, ready } = useAuth();

  // Admin-only: citizens (or signed-out users) are redirected to the map.
  useEffect(() => {
    if (ready && session?.role !== "lgu") {
      router.replace("/");
    }
  }, [ready, session, router]);

  if (!ready || session?.role !== "lgu") return null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#09090b] text-white md:max-w-none">
      {/* Admin header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div>
          <Eyebrow>Admin Console · Restricted</Eyebrow>
          <h1 className="text-lg font-bold tracking-wide">🛡 LGU / DRRM DASHBOARD</h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
            Marikina & Nearby Cities · Authoritative
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LiveClock status="ADMIN" />
          </div>
          <Link
            href="/"
            className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-300"
          >
            ← Exit
          </Link>
        </div>
      </header>

      {/* Tab bar — a responsive GRID. Each tab is its own fixed cell and its
          text wraps inside the cell, so tabs can never overlap. On phones this
          lists the tabs in 2 columns down the screen; wider screens use more
          columns. */}
      <div className="grid grid-cols-2 gap-2 border-b border-white/10 p-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`min-w-0 break-words rounded-md px-2 py-2 text-center text-[11px] uppercase leading-tight tracking-wider transition ${
              tab === t.id
                ? "bg-brand text-white"
                : "bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "overview" && <Overview />}
        {tab === "map" && (
          <div className="h-[70vh] overflow-hidden rounded-xl border border-white/10">
            <LiveMap />
          </div>
        )}
        {tab === "reports" && <ReportsQueue />}
        {tab === "closures" && <Closures />}
        {tab === "barangays" && <Barangays />}
        {tab === "shelters" && <ShelterManagement />}
        {tab === "users" && <UserManagement />}
        {tab === "advisories" && <AdvisoryManagement />}
        {tab === "analytics" && <Analytics />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}

function Overview() {
  const reports = useFloodWise((s) => s.reports);
  const allConditions = useFloodWise((s) => s.allConditions);
  const activeFlood = useFloodWise((s) => s.activeFloodMode);

  const conditions = allConditions();
  const stats = {
    activeEvents: activeFlood ? 1 : 0,
    active: reports.length,
    verified: reports.filter((r) => r.status === "verified").length,
    pending: reports.filter((r) => r.status === "pending").length,
    disputed: reports.filter((r) => r.status === "disputed").length,
    affectedRoads: conditions.filter((c) => c.status === "avoid" || c.status === "closed").length,
    activeHazards: reports.reduce((s, r) => s + r.hazards.length, 0),
    affectedBarangays: new Set(
      conditions
        .filter((c) => c.status === "avoid" || c.status === "closed")
        .map((c) => useFloodWise.getState().roads.find((r) => r.id === c.roadId)?.barangay),
    ).size,
  };

  const cards: { label: string; value: number; accent?: "red" | "green" | "amber" }[] = [
    { label: "Active flood events", value: stats.activeEvents, accent: "red" },
    { label: "Active reports", value: stats.active },
    { label: "Verified reports", value: stats.verified, accent: "green" },
    { label: "Pending reports", value: stats.pending, accent: "amber" },
    { label: "Disputed reports", value: stats.disputed, accent: "amber" },
    { label: "Affected roads", value: stats.affectedRoads, accent: "red" },
    { label: "Active hazards", value: stats.activeHazards },
    { label: "Affected barangays", value: stats.affectedBarangays },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Eyebrow>Live Situation Overview</Eyebrow>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Real-time flood intelligence for Marikina.
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Community observations, verification status, and affected areas — computed live.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} value={c.value} label={c.label} accent={c.accent} />
        ))}
      </div>
    </div>
  );
}

function ReportsQueue() {
  const reports = useFloodWise((s) => s.reports);
  const reviewReport = useFloodWise((s) => s.reviewReport);
  const [filter, setFilter] = useState<"all" | Report["status"]>("all");

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1">
        {(["all", "pending", "verified", "disputed", "expired", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-2.5 py-1 text-[11px] capitalize ${
              filter === f ? "bg-purple-500 text-white" : "bg-white/5 text-gray-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">{r.roadName}</span>
              <div className="flex items-center gap-2">
                <ReportStatusChip status={r.status} />
                <span className="text-[10px] text-gray-500">{timeAgo(r.createdAt)}</span>
              </div>
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              {r.barangay} · @{r.userName}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <Tag>🚗 {vehicleLabel(r.vehicle)}</Tag>
              <Tag>🚶 {pedLabel(r.pedestrian)}</Tag>
              <Tag>
                🌊 {FLOOD_LEVEL_OPTIONS.find((f) => f.value === r.floodLevel)?.label}
              </Tag>
            </div>
            {r.hazards.length > 0 && (
              <div className="mt-1 text-[11px] text-amber-300">
                ⚠️ {r.hazards.map((h) => HAZARD_OPTIONS.find((o) => o.value === h)?.label).join(", ")}
              </div>
            )}
            {r.notes && <div className="mt-1 text-[11px] italic text-gray-400">“{r.notes}”</div>}

            {r.ai && (
              <div className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-[11px] text-cyan-200">
                🤖 AI Evidence Assessment ({r.ai.confidence} confidence): {r.ai.note}
              </div>
            )}

            <div className="mt-1 text-[11px] text-gray-500">
              Community: {r.confirmations.filter((c) => c.vote === "still_accurate").length}{" "}
              confirm · {r.confirmations.filter((c) => c.vote !== "still_accurate").length} dispute
            </div>

            <div className="mt-2 flex gap-2">
              <ActionBtn
                color="#22c55e"
                active={r.status === "verified"}
                onClick={() => reviewReport(r.id, "verified")}
              >
                Verify
              </ActionBtn>
              <ActionBtn
                color="#ef4444"
                active={r.status === "rejected"}
                onClick={() => reviewReport(r.id, "rejected")}
              >
                Reject
              </ActionBtn>
              <ActionBtn
                color="#9ca3af"
                active={r.status === "expired"}
                onClick={() => reviewReport(r.id, "expired")}
              >
                Mark Outdated
              </ActionBtn>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-gray-500">
            No reports in this queue.
          </div>
        )}
      </div>
    </div>
  );
}

function Closures() {
  const roads = useFloodWise((s) => s.roads);
  const closures = useFloodWise((s) => s.closures);
  const setClosure = useFloodWise((s) => s.setClosure);
  const conditionFor = useFloodWise((s) => s.conditionFor);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        Marking a road officially closed updates the map, alerts users, and excludes it from route
        recommendations.
      </p>
      {roads.map((r) => {
        const closed = !!closures[r.id];
        const cond = conditionFor(r.id);
        return (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div>
              <div className="text-sm font-semibold text-white">{r.name}</div>
              <div className="mt-1">
                <StatusBadge status={cond.status} />
              </div>
            </div>
            <button
              onClick={() => setClosure(r.id, !closed)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                closed ? "bg-white/10 text-gray-300" : "bg-red-700 text-white"
              }`}
            >
              {closed ? "Reopen" : "Mark Closed"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Barangays() {
  const roads = useFloodWise((s) => s.roads);
  const reports = useFloodWise((s) => s.reports);
  const conditionFor = useFloodWise((s) => s.conditionFor);

  const rows = useMemo(() => {
    const map = new Map<string, { affectedRoads: number; activeReports: number }>();
    for (const road of roads) {
      const cond = conditionFor(road.id);
      const entry = map.get(road.barangay) ?? { affectedRoads: 0, activeReports: 0 };
      if (cond.status === "avoid" || cond.status === "caution" || cond.status === "closed") {
        entry.affectedRoads += 1;
      }
      map.set(road.barangay, entry);
    }
    for (const r of reports) {
      const entry = map.get(r.barangay) ?? { affectedRoads: 0, activeReports: 0 };
      entry.activeReports += 1;
      map.set(r.barangay, entry);
    }
    return [...map.entries()].sort((a, b) => b[1].activeReports - a[1].activeReports);
  }, [roads, reports, conditionFor]);

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[20rem] text-left text-sm">
        <thead className="bg-white/5 text-[11px] uppercase text-gray-400">
          <tr>
            <th className="px-3 py-2">Barangay</th>
            <th className="px-3 py-2 text-right">Affected Roads</th>
            <th className="px-3 py-2 text-right">Active Reports</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([barangay, v]) => (
            <tr key={barangay} className="border-t border-white/5">
              <td className="px-3 py-2 text-white">{barangay}</td>
              <td className="px-3 py-2 text-right text-gray-300">{v.affectedRoads}</td>
              <td className="px-3 py-2 text-right text-gray-300">{v.activeReports}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShelterManagement() {
  const shelters = useFloodWise((s) => s.shelters);
  const setShelter = useFloodWise((s) => s.setShelter);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        Adjusting occupancy or status updates the shelter across the map, navigation, AI, and
        citizen views. Reaching capacity auto-marks a shelter “full”.
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {shelters.map((sh) => {
          const pct = Math.round((sh.occupancy / sh.capacity) * 100);
          const nearlyFull = sh.status === "open" && pct >= 85;
          return (
            <div key={sh.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">{sh.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    backgroundColor:
                      sh.status === "full"
                        ? "#eab30822"
                        : sh.status === "closed"
                          ? "#ef444422"
                          : nearlyFull
                            ? "#f9731622"
                            : "#22c55e22",
                    color:
                      sh.status === "full"
                        ? "#eab308"
                        : sh.status === "closed"
                          ? "#ef4444"
                          : nearlyFull
                            ? "#f97316"
                            : "#22c55e",
                  }}
                >
                  {sh.status === "open" && nearlyFull ? "Nearly full" : sh.status}
                </span>
              </div>
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-[11px] text-gray-400">
                  <span>{sh.barangay}</span>
                  <span>
                    {sh.occupancy}/{sh.capacity} ({pct}%)
                  </span>
                </div>
                <ReliabilityBar value={pct} />
              </div>

              {/* Occupancy controls */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Occupancy
                </span>
                <button
                  onClick={() => setShelter(sh.id, { occupancy: sh.occupancy - 25 })}
                  className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                >
                  −25
                </button>
                <button
                  onClick={() => setShelter(sh.id, { occupancy: sh.occupancy + 25 })}
                  className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                >
                  +25
                </button>
                <button
                  onClick={() => setShelter(sh.id, { occupancy: sh.capacity })}
                  className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                >
                  Set full
                </button>
              </div>

              {/* Status controls */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Status</span>
                {(["open", "closed"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() =>
                      setShelter(sh.id, {
                        status: st,
                        occupancy: st === "closed" ? 0 : sh.occupancy,
                      })
                    }
                    className={`rounded-md px-2 py-1 text-xs capitalize ${
                      sh.status === st
                        ? "bg-brand text-white"
                        : "border border-white/15 text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserManagement() {
  const reports = useFloodWise((s) => s.reports);
  const users = useMemo(() => {
    const map = new Map<string, { name: string; count: number; verified: number }>();
    for (const r of reports) {
      const e = map.get(r.userId) ?? { name: r.userName, count: 0, verified: 0 };
      e.count += 1;
      if (r.status === "verified") e.verified += 1;
      map.set(r.userId, e);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [reports]);

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div
          key={u.name}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <span className="text-sm text-white">@{u.name}</span>
          <span className="text-[11px] text-gray-400">
            {u.count} reports · {u.verified} verified
          </span>
        </div>
      ))}
    </div>
  );
}

function AdvisoryManagement() {
  const alerts = useFloodWise((s) => s.alerts);
  const advisories = alerts.filter((a) => a.kind === "advisory");
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-dashed border-white/20 p-3 text-xs text-gray-400">
        Issue an official advisory (visible to all residents in Alerts).
      </div>
      {advisories.map((a) => (
        <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-sm font-semibold text-white">📢 {a.title}</div>
          <div className="mt-0.5 text-[11px] text-gray-400">{a.body}</div>
        </div>
      ))}
    </div>
  );
}

function Analytics() {
  const reports = useFloodWise((s) => s.reports);
  const hazardCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of reports)
      for (const h of r.hazards) m.set(h, (m.get(h) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [reports]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white">Post-event analytics</div>
        <p className="mt-1 text-[11px] text-gray-400">
          Total reports: {reports.length} · Verified:{" "}
          {reports.filter((r) => r.status === "verified").length}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm font-semibold text-white">Common hazards</div>
        {hazardCounts.length === 0 && <div className="text-[11px] text-gray-500">No hazards reported.</div>}
        {hazardCounts.map(([h, n]) => (
          <div key={h} className="flex justify-between py-0.5 text-[11px] text-gray-300">
            <span>{HAZARD_OPTIONS.find((o) => o.value === h)?.label}</span>
            <span>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
      <p>System settings for report expiration windows, reliability weighting, and roles.</p>
      <p className="mt-2 text-[11px] text-gray-500">
        Report lifetime and freshness thresholds are configured in the Evidence Engine.
      </p>
    </div>
  );
}

// helpers
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-white/10 px-1.5 py-0.5 text-gray-300">{children}</span>;
}
function ActionBtn({
  color,
  onClick,
  children,
  active,
}: {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition"
      style={
        active
          ? { backgroundColor: color, color: "#0b0b0e" }
          : { backgroundColor: `${color}22`, color }
      }
    >
      {active ? `✓ ${children}` : children}
    </button>
  );
}

function ReportStatusChip({ status }: { status: Report["status"] }) {
  const color =
    status === "verified"
      ? "#22c55e"
      : status === "pending"
        ? "#eab308"
        : status === "disputed"
          ? "#f97316"
          : status === "rejected"
            ? "#ef4444"
            : "#9ca3af";
  return (
    <span
      className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {status}
    </span>
  );
}
function vehicleLabel(v: Report["vehicle"]) {
  return STATUS_LABEL[
    v === "passable" ? "passable" : v === "caution" ? "caution" : v === "not_passable" ? "avoid" : "unknown"
  ];
}
function pedLabel(p: Report["pedestrian"]) {
  return STATUS_LABEL[
    p === "lower_risk" ? "passable" : p === "caution" ? "caution" : p === "unsafe" ? "avoid" : "unknown"
  ];
}
