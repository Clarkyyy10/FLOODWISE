"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { hasAcceptedAgreement } from "@/lib/agreement";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"citizen" | "lgu">("citizen");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(false);

  // Require the Community Safety & Reporting agreement before authentication.
  useEffect(() => {
    if (hasAcceptedAgreement()) setAllowed(true);
    else router.replace("/agreement?next=/register");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = register(name, email, password, role);
    setBusy(false);
    if (res.ok) router.push(res.session.role === "lgu" ? "/lgu" : "/");
    else setError(res.error);
  }

  if (!allowed) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 md:min-h-screen">
      <div className="w-full max-w-sm">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded bg-brand text-sm font-bold text-white">
            FW
          </div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-brand/80">
            FloodWise · Marikina &amp; Nearby Cities
          </div>
          <h1 className="text-lg font-bold tracking-wide text-white">CREATE ACCOUNT</h1>
        </div>

        <div className="space-y-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              Account Type
            </span>
            <div className="flex gap-1 rounded-md border border-white/10 p-1">
              {(
                [
                  { v: "citizen", label: "Citizen" },
                  { v: "lgu", label: "LGU / DRRM Staff" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setRole(o.v)}
                  aria-pressed={role === o.v}
                  className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium transition ${
                    role === o.v ? "bg-brand text-white" : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-md border border-white/15 bg-[#0d0d10] px-3 py-2.5 text-sm text-white focus:border-brand focus:outline-none"
              placeholder="Your name"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-md border border-white/15 bg-[#0d0d10] px-3 py-2.5 text-sm text-white focus:border-brand focus:outline-none"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-md border border-white/15 bg-[#0d0d10] px-3 py-2.5 text-sm text-white focus:border-brand focus:outline-none"
              placeholder="At least 6 characters"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-md bg-brand py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create Account"}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-[10px] text-zinc-600">
          Demo accounts are stored on this device only.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
