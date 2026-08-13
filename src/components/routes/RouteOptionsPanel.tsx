"use client";

import { useState } from "react";
import { TRAVEL_MODES, STATUS_LABEL } from "@/lib/constants";
import { timeAgo } from "@/components/ui/StatusBadge";
import { formatDistance, formatDuration } from "@/lib/geo";
import ActionButton from "@/components/ui/ActionButton";
import type { RoutePlanner } from "@/lib/useRoutePlanner";

export default function RouteOptionsPanel({
  planner,
  activeFlood,
}: {
  planner: RoutePlanner;
  activeFlood: boolean;
}) {
  const [showWhy, setShowWhy] = useState<string | null>(null);
  const { place, mode, setMode, fetchState, fetchError, labeled, selected, outsideArea } = planner;

  return (
    <div className="space-y-4">
      {/* Travel mode */}
      <div>
        <div className="mb-2 text-xs text-gray-400">Travel mode</div>
        <div className="flex gap-2">
          {TRAVEL_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 text-xs ${
                mode === m.value
                  ? "border-brand bg-brand/15 text-white"
                  : "border-white/10 bg-white/5 text-gray-300"
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
          <span>
            {place ? `Routes to ${place.name}` : "Route options"}
          </span>
          {labeled.length > 0 && <span>{labeled.length} found</span>}
        </div>

        {outsideArea && (
          <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">
            FloodWise covers Marikina and nearby cities. Conditions outside this area may be
            incomplete.
          </div>
        )}

        {!place && (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-xs text-gray-500">
            Search and select a destination to see safer route options.
          </div>
        )}

        {place && fetchState === "loading" && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-xs text-gray-400">
            Evaluating routes against current road conditions…
          </div>
        )}

        {place && fetchState === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs text-red-200">
            {fetchError}
            <button
              onClick={planner.retry}
              className="mt-2 block w-full rounded-lg bg-red-500/80 py-2 font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {place && fetchState === "ready" && labeled.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-xs text-gray-400">
            No route available to this destination.
          </div>
        )}

        {place && fetchState === "ready" && labeled.length > 0 && (
          <div className="space-y-2">
            {activeFlood && (
              <p className="text-[11px] text-amber-300/90">
                Active flood event — the lower-risk route is recommended by default.
              </p>
            )}
            {labeled.map(({ tag, emoji, route }) => {
              const isSel = selected?.route.id === route.id;
              return (
                <div
                  key={route.id}
                  className={`rounded-xl border p-3 ${
                    isSel ? "border-brand bg-brand/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => planner.setSelectedId(route.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        {emoji} {tag === "Safest" ? "Recommended · Lower-risk" : tag}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDuration(route.durationS)} · {formatDistance(route.distanceM)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Risk: {route.riskLabel}</span>
                      <span>
                        {route.uncertain ? "Limited info" : `Reliability: ${route.reliability}%`}
                      </span>
                    </div>
                    {route.blocked && (
                      <div className="mt-1 text-[11px] text-red-400">
                        Passes a not-passable / closed road
                      </div>
                    )}
                    {route.closures.length > 0 && (
                      <div className="mt-1 text-[11px] text-red-400">
                        🚫 Official closure: {route.closures.join(", ")}
                      </div>
                    )}
                  </button>

                  {isSel && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <button
                        onClick={() => setShowWhy(showWhy === route.id ? null : route.id)}
                        className="text-xs font-medium text-brand"
                      >
                        Why this route?
                      </button>
                      {showWhy === route.id && (
                        <ul className="mt-2 space-y-1 text-[11px] text-gray-300">
                          <li>✓ Recommended based on current available road information</li>
                          <li>✓ Avoids {route.floodedAvoided} recently reported flooded road(s)</li>
                          <li>
                            ✓{" "}
                            {route.closures.length === 0
                              ? "No official closure on selected route"
                              : `Affected by closure: ${route.closures.join(", ")}`}
                          </li>
                          <li>
                            ✓ Last updated:{" "}
                            {route.lastUpdated ? timeAgo(route.lastUpdated) : "no recent reports"}
                          </li>
                          {route.matched.length > 0 ? (
                            <li className="text-gray-500">
                              Segments:{" "}
                              {route.matched
                                .map((m) => `${m.road.name} (${STATUS_LABEL[m.lens]})`)
                                .join(" · ")}
                            </li>
                          ) : (
                            <li className="text-amber-300/80">
                              Limited recent information is available for part of this route.
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ActionButton
        disabled={!planner.canNavigate}
        onAction={async () => {
          await new Promise((r) => setTimeout(r, 400));
          planner.startNavigation();
        }}
        idleLabel="Start Navigation"
        loadingLabel="Starting Navigation…"
        successLabel="Navigation Active"
        className="w-full rounded-xl bg-brand py-3 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-40"
      />
    </div>
  );
}
