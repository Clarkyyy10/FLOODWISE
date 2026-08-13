"use client";

import { useSettings } from "@/components/providers/ThemeProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { ACCENTS, type AccentId, type FontSize, type Motion, type ThemeMode } from "@/lib/settings";

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-500">{label}</div>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-1.5 rounded-md border border-white/10 bg-white/[0.02] p-1"
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`flex-1 whitespace-nowrap rounded px-3 py-2 text-xs font-medium transition ${
                active ? "bg-brand text-white" : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AppearanceSettings() {
  const { settings, update } = useSettings();
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <Segment<ThemeMode>
        label={t("settings.theme")}
        value={settings.theme}
        onChange={(v) => update({ theme: v })}
        options={[
          { value: "dark", label: t("theme.dark") },
          { value: "light", label: t("theme.light") },
          { value: "contrast", label: t("theme.contrast") },
          { value: "system", label: t("theme.system") },
        ]}
      />

      {/* Accent swatches */}
      <div>
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
          {t("settings.accent")}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ACCENTS) as AccentId[]).map((id) => {
            const a = ACCENTS[id];
            const active = settings.accent === id;
            return (
              <button
                key={id}
                onClick={() => update({ accent: id })}
                aria-label={a.label}
                aria-pressed={active}
                title={a.label}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition ${
                  active ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-zinc-400"
                }`}
              >
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: a.swatch }}
                />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <Segment<FontSize>
        label={t("settings.textSize")}
        value={settings.fontSize}
        onChange={(v) => update({ fontSize: v })}
        options={[
          { value: "sm", label: t("text.sm") },
          { value: "md", label: t("text.md") },
          { value: "lg", label: t("text.lg") },
          { value: "xl", label: t("text.xl") },
        ]}
      />

      <Segment<Motion>
        label={t("settings.motion")}
        value={settings.motion}
        onChange={(v) => update({ motion: v })}
        options={[
          { value: "full", label: t("motion.full") },
          { value: "reduced", label: t("motion.reduced") },
          { value: "off", label: t("motion.off") },
        ]}
      />

      <p className="text-[11px] leading-relaxed text-zinc-500">
        Preferences are saved on this device and apply across the whole app. Motion also respects
        your system&apos;s reduced-motion setting.
      </p>
    </div>
  );
}
