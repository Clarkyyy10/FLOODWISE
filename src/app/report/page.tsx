"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFloodWise, type DraftReport } from "@/lib/store";
import {
  VEHICLE_OPTIONS,
  PEDESTRIAN_OPTIONS,
  FLOOD_LEVEL_OPTIONS,
  HAZARD_OPTIONS,
} from "@/lib/constants";
import type {
  VehiclePassability,
  PedestrianCondition,
  FloodLevel,
  Hazard,
} from "@/lib/types";
import { assessReport, fileToBase64 } from "@/lib/ai";
import ActionButton from "@/components/ui/ActionButton";
import DestinationSearch from "@/components/routes/DestinationSearch";
import type { GeoPlace } from "@/lib/geocoding";

type AiStatus = "idle" | "analyzing" | "done" | "fallback";

const AGREEMENT_KEY = "fw_reporting_agreement";

type Phase = "safety" | "declined" | "agreement" | "form" | "done";

export default function ReportPage() {
  const router = useRouter();
  const roads = useFloodWise((s) => s.roads);
  const submitReport = useFloodWise((s) => s.submitReport);
  const attachAi = useFloodWise((s) => s.attachAi);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiResult, setAiResult] = useState<{
    floodVisible: boolean;
    consistentWithReport: boolean;
    confidence: string;
    note: string;
  } | null>(null);

  const [phase, setPhase] = useState<Phase>("safety");
  const [step, setStep] = useState(1);

  // Draft state
  const [roadId, setRoadId] = useState(roads[0].id);
  const [place, setPlace] = useState<GeoPlace | null>(null);
  const [vehicle, setVehicle] = useState<VehiclePassability | null>(null);
  const [pedestrian, setPedestrian] = useState<PedestrianCondition | null>(null);
  const [floodLevel, setFloodLevel] = useState<FloodLevel | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmObserved, setConfirmObserved] = useState(false);

  const road = useMemo(() => roads.find((r) => r.id === roadId)!, [roads, roadId]);

  // Effective report location: a typed/predicted place takes priority, else the
  // auto-detected mapped road segment.
  const chosen = place
    ? {
        roadId: `geo-${place.id}`,
        roadName: place.name,
        barangay: place.context || "Marikina area",
        gps: [place.lat, place.lng] as [number, number],
      }
    : {
        roadId: road.id,
        roadName: road.name,
        barangay: road.barangay,
        gps: road.path[Math.floor(road.path.length / 2)] as [number, number],
      };

  function startReport() {
    const agreed = typeof window !== "undefined" && localStorage.getItem(AGREEMENT_KEY);
    setPhase(agreed ? "form" : "agreement");
    setStep(1);
  }

  function acceptAgreement() {
    if (typeof window !== "undefined") localStorage.setItem(AGREEMENT_KEY, "1");
    setPhase("form");
  }

  function toggleHazard(h: Hazard) {
    setHazards((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  }

  function submit() {
    const draft: DraftReport = {
      roadId: chosen.roadId,
      roadName: chosen.roadName,
      barangay: chosen.barangay,
      gps: chosen.gps,
      vehicle: vehicle!,
      pedestrian: pedestrian!,
      floodLevel: floodLevel!,
      hazards,
      photoUrl,
      notes: notes.trim() || undefined,
    };
    const report = submitReport(draft);
    setPhase("done");

    // Run AI evidence assessment (server-side Gemini) in the background.
    // AI is only ONE input and never sets road status — it augments the report.
    void runAssessment(report.id);
  }

  async function runAssessment(reportId: string) {
    setAiStatus("analyzing");
    let image: { data: string; mimeType: string } | undefined;
    if (photoFile) {
      try {
        image = await fileToBase64(photoFile);
      } catch {
        image = undefined;
      }
    }
    const res = await assessReport({
      roadName: chosen.roadName,
      floodLevel: floodLevel ?? undefined,
      vehicle: vehicle ?? undefined,
      pedestrian: pedestrian ?? undefined,
      hazards,
      notes: notes.trim() || undefined,
      imageBase64: image?.data,
      imageMimeType: image?.mimeType,
    });

    if (res.configured && res.ai) {
      attachAi(reportId, res.ai);
      setAiResult(res.ai);
      setAiStatus("done");
    } else {
      setAiStatus("fallback");
    }
  }

  // ---- Safety check (User Flow B, step 2) --------------------------------
  if (phase === "safety") {
    return (
      <Shell title="Report Current Conditions">
        <div className="space-y-4 px-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="text-sm font-semibold text-amber-300">Safety comes first</div>
            <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
              Never enter floodwater or put yourself in danger to submit a report. Only report if
              you are already in a safe location and can safely observe the road.
            </p>
          </div>
          <p className="text-center text-base font-medium text-white">
            Can you safely observe the situation?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPhase("declined")}
              className="rounded-xl border border-white/15 py-3 text-sm font-semibold text-gray-200"
            >
              No
            </button>
            <button
              onClick={startReport}
              className="rounded-xl bg-brand py-3 text-sm font-semibold text-white"
            >
              Yes, I'm safe
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "declined") {
    return (
      <Shell title="Report Current Conditions">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="text-4xl">🛟</div>
          <div className="text-lg font-semibold text-white">No problem. Stay safe.</div>
          <p className="text-sm text-gray-400">
            Your safety matters more than any report. You can report later if it becomes safe to
            observe the road.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white"
          >
            Back to Map
          </button>
        </div>
      </Shell>
    );
  }

  // ---- Community reporting agreement --------------------------------------
  if (phase === "agreement") {
    return (
      <Shell title="Community Reporting Agreement">
        <div className="space-y-4 px-4">
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-gray-200">
            <p>
              I understand that reports should contain truthful information based on what I
              personally observe.
            </p>
            <p>
              I will not intentionally submit false, misleading, fabricated, or harmful
              information.
            </p>
            <p>
              I understand that I should never put myself or another person in danger to obtain a
              report.
            </p>
            <p>I understand that reports may be reviewed, verified, disputed, or removed.</p>
          </div>
          <button
            onClick={acceptAgreement}
            className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
          >
            I Agree
          </button>
        </div>
      </Shell>
    );
  }

  // ---- Report received ----------------------------------------------------
  if (phase === "done") {
    return (
      <Shell title="Report Received">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="text-4xl">✅</div>
          <div className="text-lg font-semibold text-white">Report Received</div>
          <p className="text-sm text-gray-400">
            Status: Pending Verification. Thank you — your observation helps other residents decide
            which roads to trust.
          </p>

          <div className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs">
            {aiStatus === "analyzing" && (
              <span className="text-cyan-300">🤖 Analyzing evidence with AI…</span>
            )}
            {aiStatus === "done" && aiResult && (
              <div className="space-y-1 text-cyan-300">
                <div className="font-semibold uppercase tracking-wider">
                  🤖 Gemini Evidence Assessment
                </div>
                <div className="text-zinc-200">“{aiResult.note}”</div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
                  <span>Confidence: {aiResult.confidence}</span>
                  <span>Flood visible: {aiResult.floodVisible ? "yes" : "no"}</span>
                  <span>Consistent: {aiResult.consistentWithReport ? "yes" : "no"}</span>
                </div>
                <div className="text-[10px] text-zinc-500">Assists verification only.</div>
              </div>
            )}
            {aiStatus === "fallback" && (
              <span className="text-zinc-400">
                🤖 AI service unavailable — report saved without AI assessment.
              </span>
            )}
            {aiStatus === "idle" && (
              <span className="text-zinc-500">Report queued for verification.</span>
            )}
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            View on Map
          </button>
        </div>
      </Shell>
    );
  }

  // ---- 6-step form --------------------------------------------------------
  const canNext =
    (step === 1 && !!roadId) ||
    (step === 2 && !!vehicle) ||
    (step === 3 && !!pedestrian) ||
    (step === 4 && !!floodLevel) ||
    step === 5 ||
    step === 6;

  return (
    <Shell title="Report Current Conditions">
      <div className="px-4">
        <StepDots total={7} current={step} />

        {step === 1 && (
          <Section title="Step 1 — Location" subtitle="Auto-detected. Type to adjust if needed.">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white">
              📍 {chosen.roadName}
              {chosen.barangay ? `, ${chosen.barangay}` : ""}
            </div>

            {/* Typeable, predictive location search */}
            <label className="mt-3 block text-xs text-gray-400">Search a road or place</label>
            <div className="mt-1">
              <DestinationSearch
                placeholder="🔍 Type a road, barangay, or landmark…"
                onSelect={(p) => setPlace(p)}
                onClear={() => setPlace(null)}
              />
            </div>

            {/* Secondary: quick-pick a mapped FloodWise road */}
            <label className="mt-3 block text-xs text-gray-400">Or pick a mapped road</label>
            <select
              value={place ? "" : roadId}
              onChange={(e) => {
                if (e.target.value) {
                  setPlace(null);
                  setRoadId(e.target.value);
                }
              }}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {place && (
                <option value="" className="bg-[#0b1220]">
                  {chosen.roadName} (typed)
                </option>
              )}
              {roads.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#0b1220]">
                  {r.name} — {r.barangay}
                </option>
              ))}
            </select>
          </Section>
        )}

        {step === 2 && (
          <Section title="Step 2 — Vehicle Passability" subtitle="Can vehicles currently pass through this road?">
            <OptionList
              options={VEHICLE_OPTIONS}
              value={vehicle}
              onChange={setVehicle}
            />
          </Section>
        )}

        {step === 3 && (
          <Section title="Step 3 — Pedestrian Condition" subtitle="What is the current condition for people walking?">
            <OptionList
              options={PEDESTRIAN_OPTIONS}
              value={pedestrian}
              onChange={setPedestrian}
            />
          </Section>
        )}

        {step === 4 && (
          <Section title="Step 4 — Flood Level" subtitle="No precise measurement expected.">
            <div className="space-y-2">
              {FLOOD_LEVEL_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFloodLevel(o.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                    floodLevel === o.value
                      ? "border-brand bg-brand/15 text-white"
                      : "border-white/10 bg-white/5 text-gray-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 5 && (
          <Section title="Step 5 — Hazards" subtitle="Select all that apply (optional).">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {HAZARD_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => toggleHazard(o.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs ${
                    hazards.includes(o.value)
                      ? "border-amber-400 bg-amber-400/15 text-amber-200"
                      : "border-white/10 bg-white/5 text-gray-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 6 && (
          <Section title="Step 6 — Photo & Notes" subtitle="Optional evidence.">
            {photoUrl ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="report" className="w-full rounded-xl" />
                <button
                  onClick={() => {
                    setPhotoUrl(undefined);
                    setPhotoFile(null);
                  }}
                  className="text-xs text-red-400"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-white/20 bg-white/5 py-8 text-sm text-gray-400">
                📷 Take or upload a photo
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (e.g. 'Water reached knee level near the intersection.')"
              rows={3}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500"
            />
          </Section>
        )}

        {step === 7 && (
          <Section title="Review" subtitle="Confirm before submitting.">
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white">
              <ReviewRow label="📍 Location" value={`${chosen.roadName}, ${chosen.barangay}`} />
              <ReviewRow label="🚗 Vehicle" value={labelOf(VEHICLE_OPTIONS, vehicle)} />
              <ReviewRow label="🚶 Pedestrian" value={labelOf(PEDESTRIAN_OPTIONS, pedestrian)} />
              <ReviewRow label="🌊 Flood Level" value={labelOf(FLOOD_LEVEL_OPTIONS, floodLevel)} />
              <ReviewRow
                label="⚠️ Hazards"
                value={
                  hazards.length
                    ? hazards.map((h) => labelOf(HAZARD_OPTIONS, h)).join(", ")
                    : "None"
                }
              />
              <ReviewRow label="📷 Photo" value={photoUrl ? "Attached" : "None"} />
              {notes && <ReviewRow label="📝 Notes" value={notes} />}
            </div>

            {/* Report-safely reminder */}
            <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-500/10 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                ⚠️ Report Safely and Accurately
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-100/90">
                Only submit information you genuinely observed. Do not put yourself or others in
                danger to collect information. If you are in a dangerous location, move to a safe
                place first.
              </p>
            </div>

            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-zinc-200">
              <input
                type="checkbox"
                checked={confirmObserved}
                onChange={(e) => setConfirmObserved(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              I confirm that this report reflects what I observed.
            </label>
          </Section>
        )}

        {/* Nav buttons */}
        <div className="mt-4 flex gap-3 pb-6">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-gray-200"
            >
              Back
            </button>
          )}
          {step < 7 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <ActionButton
              disabled={!confirmObserved}
              onAction={async () => {
                await new Promise((r) => setTimeout(r, 500));
                submit();
              }}
              idleLabel="Submit Report"
              loadingLabel="Submitting…"
              successLabel="Report Submitted"
              className="flex-1 rounded-xl bg-green-500 py-3 text-sm font-semibold uppercase tracking-wider text-black"
            />
          )}
        </div>
      </div>
    </Shell>
  );
}

// ---- small presentational helpers (local to this screen) ------------------
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="px-4 py-3">
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </header>
      {children}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle && <p className="mb-3 mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      {children}
    </div>
  );
}

function OptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; emoji: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm ${
            value === o.value
              ? "border-brand bg-brand/15 text-white"
              : "border-white/10 bg-white/5 text-gray-200"
          }`}
        >
          <span>{o.emoji}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="mb-3 flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${i < current ? "bg-brand" : "bg-white/10"}`}
        />
      ))}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T | null,
): string {
  return options.find((o) => o.value === value)?.label ?? "—";
}
