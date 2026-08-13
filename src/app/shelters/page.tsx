"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFloodWise } from "@/lib/store";
import type { Shelter, ShelterStatus } from "@/lib/types";

const STATUS_STYLE: Record<ShelterStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "#22c55e" },
  full: { label: "Full", color: "#eab308" },
  closed: { label: "Closed", color: "#ef4444" },
};

export default function SheltersPage() {
  const router = useRouter();
  const shelters = useFloodWise((s) => s.shelters);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Build a Routes deep-link that carries this exact shelter as the destination.
  function routeToShelter(sh: Shelter) {
    const [lat, lng] = sh.location;
    const params = new URLSearchParams({
      destLat: String(lat),
      destLng: String(lng),
      destName: sh.name,
      destContext: sh.barangay,
      shelterId: sh.id,
      shelterStatus: sh.status,
    });
    router.push(`/routes?${params.toString()}`);
  }

  function onGetRoute(sh: Shelter) {
    // Full/Closed shelters require an explicit confirmation before routing.
    if ((sh.status === "closed" || sh.status === "full") && confirmId !== sh.id) {
      setConfirmId(sh.id);
      return;
    }
    routeToShelter(sh);
  }

  return (
    <div className="min-h-full">
      <header className="px-4 py-3">
        <h1 className="fw-h1 font-bold text-white">Shelters</h1>
        <p className="text-[11px] text-gray-400">Evacuation centers</p>
      </header>

      <div className="grid grid-cols-1 items-start gap-2 px-4 pb-6 sm:grid-cols-2 xl:grid-cols-3">
        {shelters.map((sh) => {
          const st = STATUS_STYLE[sh.status];
          const open = expanded === sh.id;
          const needsConfirm = confirmId === sh.id;
          return (
            <div key={sh.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setExpanded(open ? null : sh.id)}
              >
                <div>
                  <div className="text-sm font-semibold text-white">{sh.name}</div>
                  <div className="text-[11px] text-gray-400">{sh.barangay}</div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${st.color}22`, color: st.color }}
                >
                  {st.label}
                </span>
              </button>

              {open && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-sm">
                  <Row label="Capacity" value={`${sh.capacity}`} />
                  <Row
                    label="Occupancy"
                    value={`${sh.occupancy} (${Math.round((sh.occupancy / sh.capacity) * 100)}%)`}
                  />
                  <Row label="Contact" value={sh.contact} />

                  {needsConfirm ? (
                    <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <div className="text-xs font-semibold text-amber-200">
                        {sh.status === "closed"
                          ? "⚠️ This shelter is currently reported as closed."
                          : "⚠️ This shelter is currently reported as full."}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => routeToShelter(sh)}
                          className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-black"
                        >
                          Continue Anyway
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg border border-white/15 px-3 py-2 text-xs text-gray-200"
                        >
                          View Other Shelters
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onGetRoute(sh)}
                      className="mt-2 w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white"
                    >
                      🧭 Get Safest Route
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
