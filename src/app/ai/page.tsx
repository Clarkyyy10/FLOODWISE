"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFloodWise } from "@/lib/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { askFloodWiseAI } from "@/lib/ai";
import { useI18n } from "@/components/providers/I18nProvider";
import { languageMeta } from "@/lib/languages";
import { haversineM } from "@/lib/geo";
import { STATUS_LABEL } from "@/lib/constants";
import { freshnessWeight } from "@/lib/reliability";
import type { ChatContext, ChatAction, ChatDetail } from "@/app/api/ai/chat/route";

interface Msg {
  role: "user" | "ai";
  text: string;
  confidence?: string;
  details?: ChatDetail[];
  actions?: ChatAction[];
  error?: boolean;
}

const CONFIDENCE_META: Record<string, { label: string; color: string }> = {
  high: { label: "High confidence", color: "#22c55e" },
  limited: { label: "Limited information", color: "#eab308" },
  outdated: { label: "Outdated information", color: "#f97316" },
  unknown: { label: "No recent data", color: "#9ca3af" },
};

// Lightweight renderer: supports **bold** and lines starting with "- "/"• " as bullets.
function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const renderInline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  const bullets = lines.filter((l) => /^\s*[-•]\s+/.test(l));
  if (bullets.length >= 2 && bullets.length === lines.length) {
    return (
      <ul className="list-disc space-y-1 pl-4 leading-relaxed">
        {lines.map((l, i) => (
          <li key={i}>{renderInline(l.replace(/^\s*[-•]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((l, i) => {
        const isBullet = /^\s*[-•]\s+/.test(l);
        return (
          <div key={i} className={isBullet ? "flex gap-1.5" : ""}>
            {isBullet && <span className="text-brand">•</span>}
            <span>{renderInline(l.replace(/^\s*[-•]\s+/, ""))}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AiAssistantPage() {
  const router = useRouter();
  const roads = useFloodWise((s) => s.roads);
  const conditionFor = useFloodWise((s) => s.conditionFor);
  const shelters = useFloodWise((s) => s.shelters);
  const alerts = useFloodWise((s) => s.alerts);
  const weather = useFloodWise((s) => s.weather);
  const activeFlood = useFloodWise((s) => s.activeFloodMode);
  const geo = useGeolocation(false);
  const { locale } = useI18n();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const STORAGE_KEY = "fw_ai_conversation";

  // Load a saved conversation from this device (localStorage — never leaves the browser).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as Msg[]);
    } catch {
      /* ignore corrupt/absent data */
    }
    setHydrated(true);
  }, []);

  // Persist on change (only after the initial load, so we don't clobber it).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [messages, hydrated]);

  function clearConversation() {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const buildContext = (): ChatContext => {
    const now = Date.now();
    return {
      location: geo.position ? { lat: geo.position[0], lng: geo.position[1] } : null,
      activeFloodEvent: activeFlood,
      weather: {
        condition: weather.condition,
        rainfallMmHr: weather.rainfallMmHr,
        windKph: weather.windKph,
        forecastNote: weather.forecastNote,
      },
      roads: roads.map((r) => {
        const c = conditionFor(r.id);
        return {
          name: r.name,
          barangay: r.barangay,
          status: STATUS_LABEL[c.status],
          vehicle: STATUS_LABEL[c.vehicleStatus],
          pedestrian: STATUS_LABEL[c.pedestrianStatus],
          reliability: c.reliability,
          reportCount: c.reportCount,
          officialClosure: c.officialClosure,
          lastUpdatedMinutes:
            c.lastUpdated === null ? null : Math.round((now - c.lastUpdated) / 60000),
        };
      }),
      shelters: shelters.map((s) => ({
        name: s.name,
        barangay: s.barangay,
        status: s.status,
        capacity: s.capacity,
        occupancy: s.occupancy,
        distanceKm: geo.position
          ? Math.round((haversineM(geo.position, s.location) / 1000) * 10) / 10
          : null,
      })),
      alerts: alerts.map((a) => ({
        kind: a.kind,
        title: a.title,
        ageMinutes: Math.round((now - a.at) / 60000),
      })),
    };
  };

  // Dynamic suggested questions.
  const suggestions = useMemo(() => {
    const base = [
      "Which roads are currently flooded?",
      "Is it safe to walk to Marikina City Hall?",
      "Where is the nearest open evacuation center?",
      "Are there any road closures right now?",
      "What should I know about the current flood situation?",
    ];
    if (activeFlood) base.unshift("Is it flooding near me right now?");
    return base;
  }, [activeFlood]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    const res = await askFloodWiseAI(
      q,
      history,
      buildContext(),
      locale === "en" ? undefined : (languageMeta(locale)?.english ?? locale),
    );
    setLoading(false);

    if (!res.configured) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "The FloodWise AI service isn't configured right now. You can still use the Live Map and reports directly.",
          error: true,
          actions: [{ type: "open_map", label: "Open Live Map" }],
        },
      ]);
      return;
    }
    if (res.error || !res.answer) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I can't access the latest FloodWise data right now, so I can't reliably answer that. Try the Live Map or recent reports directly.",
          error: true,
          actions: [
            { type: "open_map", label: "Open Live Map" },
            { type: "view_reports", label: "View Recent Reports" },
          ],
        },
      ]);
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: res.answer!,
        confidence: res.confidence,
        details: res.details,
        actions: res.actions,
      },
    ]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
  }

  function runAction(a: ChatAction) {
    switch (a.type) {
      case "open_map":
        router.push(
          a.lat != null && a.lng != null ? `/?lat=${a.lat}&lng=${a.lng}` : "/",
        );
        break;
      case "view_reports":
        router.push("/?view=list");
        break;
      case "find_route":
        router.push("/routes");
        break;
      case "find_shelter":
        router.push("/shelters");
        break;
      case "view_alerts":
        router.push("/alerts");
        break;
      case "report":
        router.push("/report");
        break;
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-[100dvh]">
      {/* Header */}
      <header className="flex items-start justify-between border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-brand/80">
            FloodWise Intelligence
          </div>
          <h1 className="text-lg font-bold tracking-wide text-white">🤖 FLOODWISE AI</h1>
          <p className="text-[11px] text-zinc-500">
            Ask about current floods, roads, routes, and safety in Marikina & nearby cities.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-zinc-400 transition hover:border-brand/40 hover:text-zinc-200"
          >
            Clear
          </button>
        )}
      </header>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
              I answer using FloodWise&apos;s current reports, road conditions, closures, shelters,
              and alerts — not general guesses. I&apos;ll always flag how recent the information is.
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                Try asking
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-zinc-200 transition hover:border-brand/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-brand text-white"
                  : m.error
                    ? "border border-amber-500/30 bg-amber-500/10 text-amber-100"
                    : "border border-white/10 bg-white/[0.03] text-zinc-100"
              }`}
            >
              {m.role === "ai" && m.confidence && CONFIDENCE_META[m.confidence] && (
                <div
                  className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: CONFIDENCE_META[m.confidence].color }}
                >
                  {CONFIDENCE_META[m.confidence].label}
                </div>
              )}
              <FormattedText text={m.text} />

              {m.role === "ai" && m.details && m.details.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-md border border-white/10">
                  {m.details.map((d, k) => (
                    <div
                      key={k}
                      className="flex items-start justify-between gap-3 border-b border-white/5 px-2.5 py-1.5 last:border-b-0"
                    >
                      <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                        {d.label}
                      </span>
                      <span className="text-right text-xs font-semibold text-zinc-100">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.actions.map((a, j) => (
                    <button
                      key={j}
                      onClick={() => runAction(a)}
                      className="rounded border border-brand/40 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400">
              Checking current FloodWise data…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask FloodWise AI…"
            className="flex-1 rounded-md border border-white/15 bg-[#0d0d10] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand focus:outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-40"
          >
            Ask
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-600">
          Information assistant only — not emergency services. Follow official LGU/DRRM instructions
          in an emergency.
        </p>
      </div>
    </div>
  );
}
