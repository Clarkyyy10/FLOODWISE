"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";

const TABS = [
  { href: "/", tKey: "nav.liveMap", icon: "🗺️" },
  { href: "/routes", tKey: "nav.routes", icon: "🧭" },
  { href: "/report", tKey: "nav.report", icon: "📷" },
  { href: "/alerts", tKey: "nav.alerts", icon: "🔔" },
  { href: "/shelters", tKey: "nav.shelters", icon: "🏠" },
  { href: "/ai", tKey: "nav.askAI", icon: "🤖" },
  { href: "/more", tKey: "nav.more", icon: "⋯" },
];

const AUTH_ROUTES = ["/login", "/register", "/agreement", "/terms", "/privacy"];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  // Hide app nav inside the LGU dashboard and on the sign-in / agreement flow.
  if (pathname.startsWith("/lgu") || AUTH_ROUTES.includes(pathname)) return null;

  return (
    <nav className="safe-bottom safe-x fixed inset-x-0 bottom-0 z-[1000] flex w-full items-stretch justify-between border-t border-white/10 bg-[#0b0b0e]/95 backdrop-blur md:hidden">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`tap-target flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 ${
              active ? "text-brand" : "text-gray-400"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="w-full truncate text-center text-[9px] leading-tight sm:text-[10px]">
              {t(tab.tKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
