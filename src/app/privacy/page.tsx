"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-3 text-sm text-zinc-400">
        ‹ Back
      </button>
      <div className="text-[10px] uppercase tracking-[0.15em] text-brand/80">FloodWise</div>
      <h1 className="text-xl font-bold tracking-wide text-white">Privacy Policy</h1>

      <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-300">
        <Section title="Account Information">
          Your name and email are used to identify your account. Your identity, email, and phone
          number are never shown publicly to other residents.
        </Section>
        <Section title="Location Information">
          Location is used to show your position, set route origins, and attach coordinates to
          reports. Live location is tracked only during active navigation and stops when navigation
          ends.
        </Section>
        <Section title="Reports & Photos">
          Reports and any attached photos are shared with the community to describe road conditions.
          Avoid including personal information in reports.
        </Section>
        <Section title="Device Information">
          Basic device and browser information may be used to operate the app and diagnose issues.
        </Section>
        <Section title="Data Retention">
          Reports lose influence over time and expire. Cached data (map, saved language, settings)
          is stored on your device.
        </Section>
        <Section title="Administrative Access">
          Authorized LGU/DRRM personnel can review reports to verify conditions and issue official
          information.
        </Section>
        <Section title="Your Controls">
          You can manage location permissions, clear your conversation with the AI, and control your
          account data.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 text-zinc-400">{children}</p>
    </div>
  );
}
