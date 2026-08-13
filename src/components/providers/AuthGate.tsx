"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

// Routes reachable without an authenticated session (the sign-in flow itself).
const PUBLIC = ["/login", "/register", "/agreement", "/terms", "/privacy"];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Requires an authenticated session to access the app. Unauthenticated users
 * are sent to /login (which itself requires the Community Safety agreement).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (!ready) return;
    if (!session && !publicRoute) {
      router.replace("/login");
    }
  }, [ready, session, publicRoute, router]);

  // Wait for the persisted session to load before deciding (avoids a flash).
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bg text-sm text-zinc-400">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded bg-brand text-xs font-bold text-white">
            FW
          </div>
          Loading FloodWise…
        </div>
      </div>
    );
  }

  // Block protected content from flashing before the redirect runs.
  if (!session && !publicRoute) return null;

  return <>{children}</>;
}
