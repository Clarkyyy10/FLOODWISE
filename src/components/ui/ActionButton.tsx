"use client";

import { useRef, useState } from "react";

type Phase = "idle" | "loading" | "success" | "error";

export default function ActionButton({
  onAction,
  idleLabel,
  loadingLabel,
  successLabel,
  errorLabel = "Try again",
  className = "",
  disabled = false,
  resetMs = 1600,
}: {
  onAction: () => void | Promise<void>;
  idleLabel: string;
  loadingLabel: string;
  successLabel: string;
  errorLabel?: string;
  className?: string;
  disabled?: boolean;
  resetMs?: number;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = useRef(false);

  async function handle() {
    if (busy.current || disabled) return; // prevent duplicate submissions
    busy.current = true;
    setPhase("loading");
    try {
      await onAction();
      setPhase("success");
      setTimeout(() => setPhase("idle"), resetMs);
    } catch {
      setPhase("error");
      setTimeout(() => setPhase("idle"), resetMs);
    } finally {
      busy.current = false;
    }
  }

  const label =
    phase === "loading"
      ? loadingLabel
      : phase === "success"
        ? `${successLabel} ✓`
        : phase === "error"
          ? errorLabel
          : idleLabel;

  return (
    <button
      onClick={handle}
      disabled={disabled || phase === "loading"}
      aria-busy={phase === "loading"}
      className={`${className} ${phase === "error" ? "ring-1 ring-red-500/60" : ""} disabled:opacity-60`}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {phase === "loading" && (
          <span
            aria-hidden
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {label}
      </span>
    </button>
  );
}
