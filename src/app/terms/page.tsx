"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TERMS_VERSION,
  TERMS_EFFECTIVE_DATE,
  TERMS_LAST_UPDATED,
  acceptTerms,
  getTermsAcceptance,
} from "@/lib/agreement";

// Table-of-contents entries — each maps to a section id below.
const TOC: { id: string; label: string }[] = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "purpose", label: "2. Purpose of FloodWise" },
  { id: "reporting", label: "3. Community Reporting" },
  { id: "accuracy", label: "4. Accurate Information Requirement" },
  { id: "prohibited", label: "5. Prohibited Reporting Behavior" },
  { id: "consequences", label: "6. Consequences of False Reporting" },
  { id: "safety", label: "7. User Safety" },
  { id: "verification", label: "8. Report Verification" },
  { id: "ai", label: "9. AI-Generated Information" },
  { id: "route", label: "10. Route Safety Disclaimer" },
  { id: "pedestrian", label: "11. Pedestrian Safety" },
  { id: "weather", label: "12. Weather & Flood Information" },
  { id: "shelters", label: "13. Evacuation Shelters" },
  { id: "lgu", label: "14. LGU / DRRM Administrative Accounts" },
  { id: "account", label: "15. Account Responsibilities" },
  { id: "termination", label: "16. Account Suspension & Termination" },
  { id: "location", label: "17. Location Data" },
  { id: "photos", label: "18. Photos & Report Content" },
  { id: "privacy", label: "19. Privacy" },
  { id: "thirdparty", label: "20. Third-Party Services" },
  { id: "availability", label: "21. Service Availability" },
  { id: "emergency", label: "22. Emergency Disclaimer" },
  { id: "changes", label: "23. Changes to Terms" },
];

const ACKS = [
  { id: "read", label: "I have read and agree to the FloodWise Terms & Conditions." },
  {
    id: "accurate",
    label: "I understand that I must submit accurate and truthful community reports.",
  },
  {
    id: "false",
    label:
      "I understand that intentionally false or misleading reports may result in account restrictions or other appropriate action.",
  },
  {
    id: "danger",
    label: "I understand that I must never put myself or others in danger to submit a report.",
  },
  {
    id: "accuracy_limits",
    label:
      "I understand that FloodWise information may not always be completely accurate or current.",
  },
];

export default function TermsPage() {
  const router = useRouter();
  // Read query params from the URL on mount (avoids the useSearchParams
  // Suspense requirement and matches the app's existing pattern).
  const [next, setNext] = useState<string | null>(null);
  // Acceptance UI is shown when arriving as part of onboarding (?next=…) or
  // explicitly (?accept=1). Otherwise the page is a readable reference, but the
  // acknowledgement box is still available at the bottom.
  const [acceptMode, setAcceptMode] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const n = sp.get("next");
    setNext(n);
    setAcceptMode(!!n || sp.get("accept") === "1");
  }, []);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const existing = useMemo(() => getTermsAcceptance(), []);

  const allChecked = ACKS.every((a) => checked[a.id]);

  function toggle(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
    setShowHint(false);
  }

  function onAccept() {
    if (!allChecked) {
      setShowHint(true);
      return;
    }
    acceptTerms(ACKS.filter((a) => checked[a.id]).map((a) => a.id));
    if (next && next.startsWith("/")) router.replace(next);
    else router.push("/more");
  }

  function onDecline() {
    router.push("/agreement");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-3 text-sm text-zinc-400 hover:text-zinc-200"
      >
        ‹ Back
      </button>

      {/* Header */}
      <header>
        <div className="text-[10px] uppercase tracking-[0.15em] text-brand/80">FloodWise</div>
        <h1 className="fw-h1 font-bold tracking-wide text-white">Terms &amp; Conditions</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Please read these Terms &amp; Conditions carefully before using FloodWise.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
          <span>Effective Date: {TERMS_EFFECTIVE_DATE}</span>
          <span>Last Updated: {TERMS_LAST_UPDATED}</span>
          <span>Version: {TERMS_VERSION}</span>
        </div>
        {existing && (
          <p className="mt-2 text-[11px] text-status-passable">
            ✓ You accepted Terms v{existing.termsVersion} on{" "}
            {new Date(existing.acceptedAt).toLocaleDateString()}.
          </p>
        )}
      </header>

      {/* Emergency disclaimer — prominent */}
      <div className="mt-4 rounded-md border-l-4 border-red-500 bg-red-500/10 p-3">
        <div className="text-sm font-bold uppercase tracking-wide text-red-300">
          ⚠️ Emergency?
        </div>
        <p className="mt-1 text-xs leading-relaxed text-red-100/90">
          Do not rely solely on FloodWise during an emergency. Follow instructions from official
          emergency authorities and contact appropriate emergency services when necessary.
          FloodWise is a support and information system, not an emergency-response replacement.
        </p>
      </div>

      {/* Table of contents — a dropdown that works on every screen size. */}
      <details className="mt-4 rounded-md border border-white/10 bg-white/[0.03]" open>
        <summary className="cursor-pointer list-none px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-zinc-400">
          Contents ▾
        </summary>
        <nav className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-white/10 px-4 py-3 sm:grid-cols-2">
          {TOC.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="truncate text-xs text-zinc-400 hover:text-brand"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </details>

      {/* Sections */}
      <div className="mt-5 space-y-5 text-sm leading-relaxed text-zinc-300">
        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            By accessing or using FloodWise, you acknowledge that you have read, understood, and
            agreed to these Terms &amp; Conditions. If you do not agree with these Terms, do not
            create an account or use the community reporting features.
          </p>
          <p className="mt-2 text-zinc-400">
            Viewing publicly available information does not by itself mean you have accepted every
            term, except where required to use specific features such as reporting or account
            creation.
          </p>
        </Section>

        <Section id="purpose" title="2. Purpose of FloodWise">
          <p>
            FloodWise is a flood-awareness, community reporting, mapping, navigation, and emergency
            information platform focused on Marikina City and nearby areas. It is designed to help
            users understand current community-reported conditions, flood-related hazards, road
            passability, pedestrian passability, evacuation shelter availability, and related
            safety information.
          </p>
          <Callout>
            FloodWise is an information and decision-support platform. It is not a replacement for
            official emergency services, government authorities, evacuation instructions, or
            professional emergency responders.
          </Callout>
        </Section>

        <Section id="reporting" title="3. Community Reporting">
          <p>
            Community reporting is one of FloodWise&apos;s core features. Users are encouraged to
            report conditions they can safely observe, such as flood depth and severity, road and
            pedestrian passability, road closures, hazards, obstructions, current local conditions,
            and photos when safely obtained.
          </p>
          <p className="mt-2">
            Please submit reports while a condition is still relevant, when you can do so safely.
          </p>
          <Callout>
            Users are encouraged to report current conditions from a safe location. Users must never
            enter floodwater, approach dangerous areas, or put themselves or others at risk solely
            to submit a report.
          </Callout>
        </Section>

        <Section id="accuracy" title="4. Accurate Information Requirement">
          <p className="font-semibold text-white">Accurate reporting is required.</p>
          <p className="mt-1">You must:</p>
          <List
            items={[
              "Report honestly and report what you actually observed.",
              "Avoid intentionally misleading statements or fabricated information.",
              "Avoid manipulating photos.",
              "Avoid falsely claiming to be at a location.",
              "Avoid deliberately exaggerating flood severity.",
              "Avoid intentionally reporting false road closures.",
              "Avoid intentionally creating panic.",
            ]}
          />
          <p className="mt-2 text-zinc-400">
            You are responsible for ensuring that information you submit is truthful and not
            intentionally misleading.
          </p>
        </Section>

        <Section id="prohibited" title="5. Prohibited Reporting Behavior">
          <p>The following are prohibited:</p>
          <List
            items={[
              "Fake, fabricated, or spam reports; abusively duplicated reports.",
              "Fake, manipulated, or deliberately misleading photos.",
              "False locations, false road closures, or false shelter-availability claims.",
              "Intentional misinformation.",
              "Harassment, threats, hate speech, or malicious content.",
              "Impersonating an LGU/DRRM official, or presenting a community report as an official announcement.",
              "Manipulating the reporting or verification system, or attempting to bypass verification.",
              "Attempting to access administrative features without permission.",
            ]}
          />
        </Section>

        <Section id="consequences" title="6. Consequences of False Reporting">
          <p>
            FloodWise may remove reports and restrict, suspend, or terminate accounts that
            intentionally submit false, fabricated, malicious, or repeatedly misleading
            information. Possible actions include report removal or rejection, warnings, temporary
            reporting restrictions, loss of reporting privileges, account suspension, or account
            termination.
          </p>
          <Callout tone="neutral">
            Not every inaccurate report results in punishment. If a user makes an honest mistake,
            FloodWise may correct or remove the report without treating the mistake as intentional
            misinformation. We distinguish between an honest mistake and intentional
            misinformation.
          </Callout>
        </Section>

        <Section id="safety" title="7. User Safety">
          <p className="font-semibold text-white">Your safety comes first.</p>
          <p className="mt-1">Users must never:</p>
          <List
            items={[
              "Enter floodwater to obtain a report.",
              "Cross a dangerous flooded road just to report it.",
              "Approach damaged infrastructure or enter restricted areas.",
              "Stop in dangerous traffic conditions.",
              "Risk their safety to obtain a photograph.",
              "Remain in a dangerous location to complete a report.",
            ]}
          />
          <Callout>
            FloodWise encourages reporting, but no report is worth risking your life or the safety
            of another person.
          </Callout>
        </Section>

        <Section id="verification" title="8. Report Verification">
          <p>
            Community reports may be pending, verified, disputed, resolved, or expired. A report is
            not automatically an official government statement simply because it appears on the
            map.
          </p>
          <p className="mt-2">
            FloodWise may use community confirmations, photos, location and time information,
            AI-assisted analysis, other available data, and LGU/DRRM verification to evaluate
            reports.
          </p>
        </Section>

        <Section id="ai" title="9. AI-Generated Information">
          <p>
            FloodWise may use AI to help understand user questions, explain flood conditions,
            summarize reports, translate content, assist with route information, identify
            potentially relevant patterns, and support report analysis.
          </p>
          <Callout>
            AI-generated information may contain errors and should not be treated as an
            unquestionable source of truth. AI does not replace emergency responders, government
            authorities, official evacuation instructions, or human verification.
          </Callout>
        </Section>

        <Section id="route" title="10. Route Safety Disclaimer">
          <p>
            FloodWise may provide route recommendations based on available map, weather, flood,
            road, and community-report information. Conditions can change rapidly.
          </p>
          <Callout>
            FloodWise cannot guarantee that any route is completely safe. You remain responsible for
            evaluating your surroundings and following official warnings and instructions.
          </Callout>
        </Section>

        <Section id="pedestrian" title="11. Pedestrian Safety">
          <p>
            Pedestrian passability information is based on available data and reports and may change
            rapidly. A route marked <strong className="text-white">passable</strong> does not
            guarantee that it is completely safe.
          </p>
          <Callout tone="neutral">&quot;Passable&quot; ≠ &quot;Guaranteed Safe.&quot;</Callout>
        </Section>

        <Section id="weather" title="12. Weather & Flood Information">
          <p>
            Weather and flood information may come from official sources, mapping services, weather
            services, government information, community reports, and system-generated analysis.
            Information may become outdated or change rapidly. Follow official emergency
            announcements whenever available.
          </p>
        </Section>

        <Section id="shelters" title="13. Evacuation Shelters">
          <p>
            Shelter information may include location, availability, capacity, occupancy, status, and
            contact information. LGU/DRRM administrators may update shelter availability.
          </p>
          <Callout tone="neutral">
            Shelter availability may change faster than the system can update. Verify critical
            evacuation information with appropriate authorities when possible.
          </Callout>
        </Section>

        <Section id="lgu" title="14. LGU / DRRM Administrative Accounts">
          <p>
            Verified LGU/DRRM administrative accounts have additional permissions and may manage
            official alerts, shelter availability, report verification, the administrative
            dashboard, road-condition information, and other authorized administrative functions.
          </p>
          <p className="mt-2">
            Citizens cannot access these administrative features. Users must not impersonate an
            LGU/DRRM official.
          </p>
        </Section>

        <Section id="account" title="15. Account Responsibilities">
          <p>You are responsible for:</p>
          <List
            items={[
              "Protecting your account credentials and keeping passwords secure.",
              "Providing accurate registration information.",
              "Not sharing authentication credentials.",
              "Not attempting unauthorized access.",
              "Reporting suspicious activity.",
            ]}
          />
          <p className="mt-2 text-zinc-400">
            Notify FloodWise if you believe your account has been compromised.
          </p>
        </Section>

        <Section id="termination" title="16. Account Suspension & Termination">
          <p>
            FloodWise may restrict or suspend accounts when necessary, including for intentional
            misinformation, abuse, harassment, fraudulent activity, unauthorized access attempts,
            system manipulation, impersonation, or repeated violations. Where a review or appeal
            process is available, affected users may request a review.
          </p>
        </Section>

        <Section id="location" title="17. Location Data">
          <p>
            FloodWise may use location to show your current position, create location-based reports,
            calculate routes, find nearby shelters, provide flood alerts, and improve contextual
            information. The app indicates when location is being used, and you can control location
            permissions through your device.
          </p>
        </Section>

        <Section id="photos" title="18. Photos & Report Content">
          <p>
            If you upload photos, you confirm that you have the right to submit the content. You
            must not intentionally upload fake or manipulated evidence intended to mislead, illegal
            or abusive content, or content intended to harm another person. FloodWise may remove
            content that violates these Terms.
          </p>
        </Section>

        <Section id="privacy" title="19. Privacy">
          <p>
            Your personal information and location data are handled according to the FloodWise
            Privacy Policy.
          </p>
          <Link
            href="/privacy"
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand"
          >
            View Privacy Policy →
          </Link>
        </Section>

        <Section id="thirdparty" title="20. Third-Party Services">
          <p>
            Certain functionality may depend on third-party services such as map providers, weather
            APIs, AI APIs, authentication services, geolocation services, and notification services.
            Their respective terms and privacy policies may also apply. FloodWise does not control
            third-party services.
          </p>
        </Section>

        <Section id="availability" title="21. Service Availability">
          <p>
            FloodWise may occasionally become unavailable due to internet connectivity, server
            problems, API failures, maintenance, weather-related infrastructure problems, or
            third-party service outages. FloodWise does not guarantee uninterrupted service.
          </p>
        </Section>

        <Section id="emergency" title="22. Emergency Disclaimer">
          <Callout>
            Do not rely solely on FloodWise during an emergency. Follow instructions from official
            emergency authorities and contact appropriate emergency services when necessary.
            FloodWise is a support and information system, not an emergency-response replacement.
          </Callout>
        </Section>

        <Section id="changes" title="23. Changes to Terms">
          <p>
            We may update these Terms &amp; Conditions when necessary. When material changes are
            made, users may be required to review and accept the updated Terms before continuing to
            use certain features. We store the Terms version, the acceptance timestamp, and the
            associated account when you accept.
          </p>
        </Section>

        {/* Language + legal-draft notes */}
        <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-500">
          <p>
            <strong className="text-zinc-300">Language:</strong> The English version of these Terms
            is the authoritative version. Where a reviewed translation exists it is provided for
            convenience; unreviewed machine translations are not authoritative.
          </p>
          <p className="mt-2">
            <strong className="text-zinc-300">Note:</strong> This document is a project draft. It
            should be reviewed by an appropriate legal professional or responsible organization
            before being used as binding legal terms in a deployed public application. It does not
            automatically satisfy every legal requirement.
          </p>
        </div>
      </div>

      {/* Acceptance */}
      <div id="accept" className="mt-6 scroll-mt-6 rounded-md border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
          User Acceptance
        </div>
        <div className="mt-3 space-y-2">
          {ACKS.map((a) => (
            <label
              key={a.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-xs leading-relaxed transition ${
                checked[a.id]
                  ? "border-brand/40 bg-brand/10 text-white"
                  : "border-white/10 text-zinc-300"
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

        {showHint && !allChecked && (
          <p className="mt-3 text-center text-xs text-amber-300">
            Please check all required acknowledgements to continue.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onAccept}
            disabled={!allChecked}
            className="flex-1 rounded-md bg-brand py-3 text-sm font-semibold uppercase tracking-wider text-white transition disabled:opacity-40"
          >
            Accept &amp; Continue
          </button>
          {acceptMode && (
            <button
              onClick={onDecline}
              className="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-300 transition hover:bg-white/5"
            >
              I Do Not Agree
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-500">
          FloodWise encourages you to help your community by reporting current conditions — but only
          report what you genuinely know, and never put yourself in danger to do so.
        </p>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="fw-h2 font-semibold text-white">{title}</h2>
      <div className="mt-1 text-zinc-400">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-400">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function Callout({
  children,
  tone = "warn",
}: {
  children: React.ReactNode;
  tone?: "warn" | "neutral";
}) {
  const cls =
    tone === "neutral"
      ? "border-white/15 bg-white/[0.04] text-zinc-200"
      : "border-amber-400/50 bg-amber-500/10 text-amber-100/90";
  return (
    <div className={`mt-2 rounded-md border-l-4 p-3 text-xs leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}
