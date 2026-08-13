"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptAgreement, AGREEMENT_VERSION } from "@/lib/agreement";

interface Ack {
  id: string;
  label: string;
}

const ACKS: Ack[] = [
  {
    id: "accuracy",
    label:
      "I will only submit reports based on information I genuinely observed or can reasonably verify.",
  },
  {
    id: "no_misinfo",
    label: "I will not intentionally submit fake, fabricated, misleading, or malicious information.",
  },
  {
    id: "consequences",
    label:
      "I understand that false or intentionally misleading reports may be removed and may result in account restrictions, suspension, or other consequences under the FloodWise Terms of Service.",
  },
  {
    id: "safety",
    label: "I will NOT put myself or another person in danger to collect a report.",
  },
  {
    id: "verification",
    label:
      "I understand that community reports are not automatically official government information and may require verification.",
  },
  {
    id: "route_limits",
    label: "I understand that FloodWise cannot guarantee that a route or location is completely safe.",
  },
];

export default function AgreementPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);

  const allChecked = ACKS.every((a) => checked[a.id]);

  function toggle(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
    setShowHint(false);
  }

  function onContinue() {
    if (!allChecked) {
      setShowHint(true);
      return;
    }
    acceptAgreement(ACKS.filter((a) => checked[a.id]).map((a) => a.id));
    const next =
      new URLSearchParams(window.location.search).get("next") || "/login";
    router.replace(next.startsWith("/") ? next : "/login");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <div className="mb-4 text-center">
        <div className="text-[10px] uppercase tracking-[0.15em] text-brand/80">
          Community Safety &amp; Reporting
        </div>
        <h1 className="text-xl font-bold tracking-wide text-white">
          🌧️ Help Keep Your Community Informed
        </h1>
      </div>

      {/* Intro */}
      <div className="space-y-2 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300">
        <p>
          FloodWise uses community reports to help people understand current flood and road
          conditions. If you are already in a safe location and can observe your surroundings
          safely, your report can help others make better-informed decisions.
        </p>
        <p className="text-zinc-400">
          You can report: flood conditions · road passability · pedestrian passability · road
          closures · hazards · other relevant conditions. Only report what you can genuinely
          observe.
        </p>
      </div>

      {/* Safety first */}
      <div className="mt-3 rounded-md border-l-4 border-amber-400 bg-amber-500/10 p-3">
        <div className="text-sm font-bold uppercase tracking-wide text-amber-300">
          ⚠️ Your Safety Comes First
        </div>
        <p className="mt-1 text-xs leading-relaxed text-amber-100/90">
          Do not put yourself in danger to submit a FloodWise report. Only report conditions you can
          safely observe from your current location.
        </p>
      </div>

      {/* Misinformation warning */}
      <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 p-3">
        <div className="text-sm font-bold uppercase tracking-wide text-red-300">
          ⚠️ Accurate Reporting Is Required
        </div>
        <p className="mt-1 text-xs leading-relaxed text-red-100/90">
          Submitting intentionally false, fabricated, or misleading information can cause other
          people to make unsafe decisions. Only submit information that is truthful and based on
          your actual observation or reliable knowledge.
        </p>
      </div>

      {/* Acknowledgements */}
      <div className="mt-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
          Important Reporting Rules — acknowledge all to continue
        </div>
        <div className="space-y-2">
          {ACKS.map((a) => (
            <label
              key={a.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-xs leading-relaxed transition ${
                checked[a.id] ? "border-brand/40 bg-brand/10 text-white" : "border-white/10 text-zinc-300"
              }`}
            >
              <input
                type="checkbox"
                checked={!!checked[a.id]}
                onChange={() => toggle(a.id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Consequences */}
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Violations may result in report removal, warnings, temporary reporting restrictions, account
        suspension, or account termination for serious or repeated abuse, as governed by the
        FloodWise Terms of Service.
      </p>

      {/* Links */}
      <div className="mt-3 flex gap-4 text-xs">
        <Link href="/terms" className="font-medium text-brand">
          View Terms of Service
        </Link>
        <Link href="/privacy" className="font-medium text-brand">
          View Privacy Policy
        </Link>
      </div>

      {allChecked && (
        <p className="mt-4 text-center text-sm font-medium text-status-passable">
          Thank you for helping keep the FloodWise community informed.
        </p>
      )}
      {showHint && !allChecked && (
        <p className="mt-4 text-center text-xs text-amber-300">
          Please acknowledge all required statements before continuing.
        </p>
      )}

      <button
        onClick={onContinue}
        disabled={!allChecked}
        className="mt-3 w-full rounded-md bg-brand py-3 text-sm font-semibold uppercase tracking-wider text-white transition disabled:opacity-40"
      >
        Continue to FloodWise
      </button>

      <p className="mt-2 text-center text-[10px] text-zinc-600">
        Agreement v{AGREEMENT_VERSION}
      </p>
    </div>
  );
}
