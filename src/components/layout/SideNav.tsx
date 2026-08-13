"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";

const TABS = [
  { href: "/", code: "01", tKey: "nav.liveMap", icon: "🗺" },
  { href: "/routes", code: "02", tKey: "nav.routes", icon: "🧭" },
  { href: "/report", code: "03", tKey: "nav.report", icon: "📷" },
  { href: "/alerts", code: "04", tKey: "nav.alerts", icon: "🔔" },
  { href: "/shelters", code: "05", tKey: "nav.shelters", icon: "🏠" },
  { href: "/ai", code: "06", tKey: "nav.askAI", icon: "🤖" },
  { href: "/more", code: "07", tKey: "nav.more", icon: "⋯" },
];

const AUTH_ROUTES = ["/login", "/register", "/agreement", "/terms", "/privacy"];

export default function SideNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { session } = useAuth();
  if (pathname.startsWith("/lgu") || AUTH_ROUTES.includes(pathname)) return null;

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[#0b0b0e] md:flex">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-brand text-xs font-bold text-white">
            FW
          </span>
          <div>
            <div className="text-sm font-bold tracking-wide text-white">FLOODWISE</div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-500">
              {t("brand.region")}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 text-[9px] uppercase tracking-[0.15em] text-zinc-600">
        Navigation
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-brand/15 text-white ring-1 ring-inset ring-brand/40"
                  : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              <span
                className={`text-[10px] font-bold ${active ? "text-brand" : "text-zinc-600"}`}
              >
                {tab.code}
              </span>
              <span className="text-base">{tab.icon}</span>
              <span className="uppercase tracking-wider">{t(tab.tKey)}</span>
            </Link>
          );
        })}
      </nav>

      {session?.role === "lgu" && (
        <div className="border-t border-white/10 p-3">
          <Link
            href="/lgu"
            className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs uppercase tracking-wider text-zinc-300 transition hover:border-brand/40"
          >
            🛡 {t("nav.lgu")}
          </Link>
        </div>
      )}
    </aside>
  );
}
