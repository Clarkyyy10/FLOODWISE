import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { en } from "@/locales/en";

// On-demand UI translation. Translates the entire English UI dictionary into
// any requested language via Gemini, so languages without a hand-written
// dictionary still localize the interface. Results are cached server-side
// (and client-side by the caller) so each language is translated only once.

export const runtime = "nodejs";

const cache = new Map<string, { at: number; data: Record<string, string> }>();
const TTL = 24 * 60 * 60 * 1000; // 24h

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  const { language, code } = (await req.json()) as { language?: string; code?: string };

  if (!key) return NextResponse.json({ configured: false });
  if (!language) return NextResponse.json({ error: "missing_language" }, { status: 400 });

  const cacheId = code || language;
  const hit = cache.get(cacheId);
  if (hit && Date.now() - hit.at < TTL) {
    return NextResponse.json({ configured: true, translations: hit.data });
  }

  const prompt =
    `Translate the VALUES of this JSON UI dictionary for a flood-safety app into ${language}.\n` +
    `Return ONLY a JSON object with the EXACT same keys and translated values (no markdown, no extra text).\n` +
    `Rules:\n` +
    `- Keep placeholders like {code} or {name} unchanged.\n` +
    `- Keep proper nouns unchanged: "FloodWise", "Marikina", "DRRM", "LGU", "RTL".\n` +
    `- Keep translations concise for UI buttons/labels.\n` +
    `- Preserve the exact meaning, severity, and safety intent of every string.\n\n` +
    `JSON:\n${JSON.stringify(en)}`;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = res.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ configured: true, error: "parse_failed" }, { status: 502 });

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && k in en) clean[k] = v;
    }
    if (Object.keys(clean).length === 0) {
      return NextResponse.json({ configured: true, error: "empty" }, { status: 502 });
    }

    cache.set(cacheId, { at: Date.now(), data: clean });
    return NextResponse.json({ configured: true, translations: clean });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[i18n/translate] failed:", message);
    return NextResponse.json({ configured: true, error: "failed", detail: message }, { status: 502 });
  }
}
