"use client";

import { usePathname } from "next/navigation";

// Full-bleed routes (map-centric screens + admin dashboard). Everything else
// gets a readable centered column on desktop.
const AUTH_ROUTES = ["/login", "/register", "/agreement", "/terms", "/privacy"];
const FULL_BLEED = (path: string) =>
  path === "/" ||
  path === "/routes" ||
  path.startsWith("/lgu") ||
  AUTH_ROUTES.includes(path);

export default function ContentFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // `key` re-mounts on navigation so the fade-in transition replays.
  if (FULL_BLEED(pathname)) {
    return (
      <div key={pathname} className="fw-page h-full">
        {children}
      </div>
    );
  }
  return (
    <div key={pathname} className="fw-page mx-auto w-full max-w-3xl">
      {children}
    </div>
  );
}
