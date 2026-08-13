"use client";

import { useEffect, useRef, useState } from "react";
import { searchDestinations, type GeoPlace } from "@/lib/geocoding";

export default function DestinationSearch({
  onSelect,
  onClear,
  placeholder = "🔍 Where do you want to go?",
  initialQuery = "",
  size = "md",
}: {
  onSelect: (place: GeoPlace) => void;
  onClear: () => void;
  placeholder?: string;
  initialQuery?: string;
  size?: "md" | "lg";
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(!!initialQuery);
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Debounced search on query change.
  useEffect(() => {
    if (picked) return; // don't re-search right after a selection
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const { places, error } = await searchDestinations(q, controller.signal);
        if (controller.signal.aborted) return;
        setResults(places);
        setError(
          error === "geocoding_unavailable"
            ? "Search service is temporarily unavailable."
            : error === "geocoding_failed"
              ? "Couldn't search destinations right now."
              : null,
        );
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Couldn't search destinations right now.");
        }
      } finally {
        setLoading(false);
      }
    }, 350); // debounce

    return () => clearTimeout(handle);
  }, [query, picked]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handleChange(v: string) {
    setQuery(v);
    setPicked(false);
    onClear();
  }

  function pick(place: GeoPlace) {
    setQuery(place.context ? `${place.name}, ${place.context}` : place.name);
    setPicked(true);
    setOpen(false);
    setResults([]);
    onSelect(place);
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        aria-label="Search a destination"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder={placeholder}
        className={
          size === "lg"
            ? "w-full rounded-lg border border-brand/40 bg-[#0d0d10] px-4 py-3.5 text-base font-medium text-white shadow-2xl ring-1 ring-brand/20 placeholder:text-zinc-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/50"
            : "w-full rounded-md border border-white/20 bg-[#0d0d10] px-3 py-2.5 text-sm text-white shadow-lg placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
        }
      />

      {loading && (
        <div className="absolute right-3 top-3 text-[11px] uppercase tracking-wider text-zinc-400">
          Searching…
        </div>
      )}

      {open && (
        <div className="absolute z-[1200] mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-white/15 bg-[#0d0d10] shadow-2xl">
          {error && <div className="px-3 py-3 text-xs text-red-300">{error}</div>}

          {!error && !loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-3 text-xs text-gray-400">No destinations found.</div>
          )}

          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p)}
              className="flex w-full items-start gap-2 border-b border-white/5 px-3 py-2.5 text-left hover:bg-white/5"
            >
              <span className="mt-0.5">{p.inMarikina ? "📍" : "🌐"}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-white">{p.name}</span>
                {p.context && (
                  <span className="block truncate text-[11px] text-gray-400">{p.context}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
