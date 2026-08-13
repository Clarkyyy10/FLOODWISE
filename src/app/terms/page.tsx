"use client";

import { useRouter } from "next/navigation";
import { TERMS_VERSION } from "@/lib/agreement";

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-3 text-sm text-zinc-400">
        ‹ Back
      </button>
      <div className="text-[10px] uppercase tracking-[0.15em] text-brand/80">FloodWise</div>
      <h1 className="text-xl font-bold tracking-wide text-white">Terms of Service</h1>
      <p className="mt-1 text-[11px] text-zinc-500">Version {TERMS_VERSION}</p>

      <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-300">
        <Section title="1. Community Reporting">
          FloodWise relies partly on observations submitted by residents. Reports are shared with
          other users to help them make travel decisions. You are responsible for the reports you
          submit.
        </Section>
        <Section title="2. Accurate Reporting">
          You agree to submit only information you genuinely observed or can reasonably verify. You
          must not submit fabricated, misleading, or malicious reports.
        </Section>
        <Section title="3. Prohibited Behavior">
          Intentional misinformation, spam, harassment, impersonation, and attempts to manipulate
          road-condition data are prohibited.
        </Section>
        <Section title="4. Report Moderation & Verification">
          Reports may be reviewed, verified, disputed, marked outdated, or removed. Community
          reports are not official government information and may require verification by LGU/DRRM
          personnel.
        </Section>
        <Section title="5. Account Actions">
          Violations may result in report removal, warnings, temporary reporting restrictions,
          account suspension, or termination for serious or repeated abuse. Where available, you may
          appeal an action.
        </Section>
        <Section title="6. Safety Responsibility">
          Never put yourself or others in danger to collect a report. FloodWise cannot guarantee
          that any route or location is completely safe; conditions can change rapidly.
        </Section>
        <Section title="7. Location & Photos">
          Location and photos you submit are used to display and verify conditions. Do not include
          unnecessary personal information in reports.
        </Section>
        <Section title="8. Changes">
          These Terms may be updated. Significant changes will be presented for review before
          continued use.
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
