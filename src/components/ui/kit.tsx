import type { ReactNode } from "react";

// Tiny uppercase technical label (e.g. "CONTRACTOR", "DURATION").
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`label ${className}`}>{children}</span>;
}

// Panel surface with optional decorative corner brackets.
export function Panel({
  children,
  brackets = false,
  className = "",
}: {
  children: ReactNode;
  brackets?: boolean;
  className?: string;
}) {
  return (
    <div className={`panel rounded-md ${brackets ? "brackets" : ""} ${className}`}>{children}</div>
  );
}

// Big-number stat card (hero metrics strip).
export function StatCard({
  value,
  label,
  accent = "default",
}: {
  value: ReactNode;
  label: string;
  accent?: "default" | "red" | "green" | "amber";
}) {
  const color =
    accent === "red"
      ? "text-brand"
      : accent === "green"
        ? "text-status-passable"
        : accent === "amber"
          ? "text-status-caution"
          : "text-white";
  return (
    <div className="panel brackets rounded-md px-4 py-3">
      <div className={`text-2xl font-bold leading-none ${color}`}>{value}</div>
      <div className="label mt-1.5">{label}</div>
    </div>
  );
}

// Uppercase status pill (DELAYED / COMPLETED / ONGOING analog).
export function StatusPill({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return (
    <span
      className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

// Key/value row used inside cards.
export function Field({ k, v, danger }: { k: string; v: ReactNode; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-white/5 py-1.5">
      <span className="label">{k}</span>
      <span className={`text-xs font-semibold ${danger ? "text-brand" : "text-zinc-100"}`}>{v}</span>
    </div>
  );
}

// Thin progress / budget bar.
export function Bar({ value, color = "#22c55e" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

// Section eyebrow like "SHEET 002 · PROJECT REGISTRY".
export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="label text-brand/80">{children}</div>;
}
