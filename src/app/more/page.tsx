"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFloodWise, CURRENT_USER } from "@/lib/store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import LanguageSettings from "@/components/settings/LanguageSettings";
import { languageMeta } from "@/lib/languages";
import { ReliabilityBar } from "@/components/ui/StatusBadge";
import { FLOOD_LEVEL_OPTIONS } from "@/lib/constants";
import AppearanceSettings from "@/components/settings/AppearanceSettings";

type Panel = "menu" | "myReports" | "guidelines" | "about" | "help" | "settings" | "language";

export default function MorePage() {
  const [panel, setPanel] = useState<Panel>("menu");
  const reports = useFloodWise((s) => s.reports);
  const router = useRouter();
  const { session, logout } = useAuth();
  const { t, locale } = useI18n();

  const mine = reports.filter((r) => r.userId === CURRENT_USER.id);
  const supported = mine.filter((r) => r.status === "verified").length;

  // Contributor reliability (mock): base + confirmations on own reports.
  const contributorReliability = Math.min(
    99,
    mine.length === 0
      ? 80
      : 80 +
          mine.reduce(
            (s, r) => s + r.confirmations.filter((c) => c.vote === "still_accurate").length * 3,
            0,
          ),
  );

  if (panel === "myReports") {
    return (
      <Sub title="My Reports" onBack={() => setPanel("menu")}>
        {mine.length === 0 ? (
          <Empty text="You haven't submitted any reports yet." />
        ) : (
          <div className="space-y-2">
            {mine.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{r.roadName}</span>
                  <StatusChip status={r.status} />
                </div>
                <div className="mt-1 text-[11px] text-gray-400">
                  Flood level:{" "}
                  {FLOOD_LEVEL_OPTIONS.find((f) => f.value === r.floodLevel)?.label} ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Sub>
    );
  }

  if (panel === "guidelines") {
    return (
      <Sub title="Community Guidelines" onBack={() => setPanel("menu")}>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-gray-200">
          <p>Reports should contain truthful information based on what you personally observe.</p>
          <p>Do not intentionally submit false, misleading, fabricated, or harmful information.</p>
          <p>Never put yourself or another person in danger to obtain a report.</p>
          <p>Reports may be reviewed, verified, disputed, or removed.</p>
          <p className="text-xs text-gray-400">
            Repeated intentional abuse can result in warnings, temporary reporting restrictions,
            suspension, or account removal.
          </p>
        </div>
      </Sub>
    );
  }

  if (panel === "about") {
    return (
      <Sub title="About FloodWise" onBack={() => setPanel("menu")}>
        <div className="space-y-3 text-sm leading-relaxed text-gray-200">
          <p className="font-semibold text-white">
            Report what you safely see. Know what you can trust. Take the safer route.
          </p>
          <p>
            FloodWise is a Marikina-focused, trust-aware flood intelligence and navigation system.
            It collects current road-condition observations from residents during active flooding
            and converts them into a Road Reliability Index and safer route recommendations.
          </p>
          <p className="text-xs text-gray-400">
            Safety principles: never enter floodwater to report · unknown is not safe · AI only
            assists · information is time-sensitive · official instructions take priority · no
            route is guaranteed safe.
          </p>
        </div>
      </Sub>
    );
  }

  if (panel === "help") {
    return (
      <Sub title="Help & Support" onBack={() => setPanel("menu")}>
        <div className="space-y-2 text-sm text-gray-300">
          <p>For emergencies, always follow official evacuation and emergency instructions.</p>
          <p>Marikina Rescue 161 · DRRMO hotline (02) 8646-2360.</p>
        </div>
      </Sub>
    );
  }

  if (panel === "language") {
    return (
      <Sub title={t("settings.language")} onBack={() => setPanel("menu")}>
        <LanguageSettings />
      </Sub>
    );
  }

  if (panel === "settings") {
    return (
      <Sub title={t("settings.title")} onBack={() => setPanel("menu")}>
        <div className="mb-2 text-sm font-semibold text-white">Appearance & Accessibility</div>
        <AppearanceSettings />
        <div className="mt-6 space-y-2 text-sm text-gray-300">
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Privacy</div>
          <ToggleRow label="Share location while navigating" defaultOn />
          <ToggleRow label="Show reporting requests during floods" defaultOn />
          <p className="pt-1 text-xs text-gray-500">
            Your identity, email, and phone number are never shown to other residents.
          </p>
        </div>
      </Sub>
    );
  }

  return (
    <div className="min-h-full">
      <header className="px-4 py-3">
        <h1 className="text-lg font-bold text-white">More</h1>
      </header>

      {/* Profile */}
      <div className="mx-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/20 text-xl">
            👤
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              {session ? session.name : `@${CURRENT_USER.name}`}
            </div>
            <div className="text-[11px] text-gray-400">
              {session ? session.email : "Not signed in"}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-gray-400">
            <span>Contributor reliability</span>
            <span>
              {mine.length} report{mine.length === 1 ? "" : "s"} · {supported} verified
            </span>
          </div>
          <ReliabilityBar value={contributorReliability} />
        </div>
      </div>

      {/* Menu */}
      <div className="mt-4 space-y-1 px-4 pb-6">
        <MenuItem icon="📄" label={t("more.myReports")} onClick={() => setPanel("myReports")} />
        <MenuItem
          icon="📜"
          label={t("more.guidelines")}
          onClick={() => setPanel("guidelines")}
        />
        <MenuItem
          icon="🌐"
          label={`${t("settings.language")} · ${languageMeta(locale)?.native ?? locale}`}
          onClick={() => setPanel("language")}
        />
        <MenuItem icon="⚙️" label={t("more.settings")} onClick={() => setPanel("settings")} />
        <MenuItem icon="ℹ️" label={t("more.about")} onClick={() => setPanel("about")} />
        <MenuItem icon="❓" label={t("more.help")} onClick={() => setPanel("help")} />

        {session?.role === "lgu" && (
          <Link
            href="/lgu"
            className="mt-3 flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-medium text-purple-200"
          >
            🛡️ LGU / DRRM Dashboard
          </Link>
        )}

        {session ? (
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400"
          >
            ⎋ Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="mt-3 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-medium text-white"
          >
            ⇥ Sign in / Create account
          </Link>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm text-gray-200 hover:bg-white/5"
    >
      <span className="flex items-center gap-3">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-gray-500">›</span>
    </button>
  );
}

function Sub({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <header className="flex items-center gap-2 px-4 py-3">
        <button onClick={onBack} className="text-gray-400">
          ‹ Back
        </button>
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </header>
      <div className="px-4 pb-6">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-gray-500">{text}</div>;
}

function StatusChip({ status }: { status: string }) {
  const color =
    status === "verified"
      ? "#22c55e"
      : status === "pending"
        ? "#eab308"
        : status === "disputed"
          ? "#f97316"
          : "#9ca3af";
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {status}
    </span>
  );
}

function ToggleRow({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
    >
      <span className="text-gray-200">{label}</span>
      <span
        className={`h-5 w-9 rounded-full p-0.5 transition ${on ? "bg-brand" : "bg-white/20"}`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`}
        />
      </span>
    </button>
  );
}
