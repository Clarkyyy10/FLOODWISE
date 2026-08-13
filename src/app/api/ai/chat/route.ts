import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { fetchMarikinaLiveData } from "@/lib/liveData";

// Grounded FloodWise AI assistant. The client sends a structured snapshot of
// current FloodWise data (roads, shelters, alerts, weather, user context) and
// the model is instructed to answer ONLY from that snapshot — never to invent
// flood depths, closures, reports, or safety guarantees.

export const runtime = "nodejs";

export interface ChatContext {
  location: { lat: number; lng: number } | null;
  activeFloodEvent: boolean;
  weather?: { condition: string; rainfallMmHr: number; windKph: number; forecastNote: string };
  roads: Array<{
    name: string;
    barangay: string;
    status: string;
    vehicle: string;
    pedestrian: string;
    reliability: number;
    reportCount: number;
    officialClosure: boolean;
    lastUpdatedMinutes: number | null;
  }>;
  shelters: Array<{
    name: string;
    barangay: string;
    status: string;
    capacity: number;
    occupancy: number;
    distanceKm: number | null;
  }>;
  alerts: Array<{ kind: string; title: string; ageMinutes: number }>;
}

export type ChatActionType =
  | "open_map"
  | "view_reports"
  | "find_route"
  | "find_shelter"
  | "view_alerts"
  | "report";

const ALLOWED_ACTIONS: ChatActionType[] = [
  "open_map",
  "view_reports",
  "find_route",
  "find_shelter",
  "view_alerts",
  "report",
];

export interface ChatAction {
  type: ChatActionType;
  label: string;
  lat?: number;
  lng?: number;
}

export interface ChatDetail {
  label: string;
  value: string;
}

export interface ChatResponse {
  answer: string;
  details: ChatDetail[];
  confidence: "high" | "limited" | "outdated" | "unknown";
  actions: ChatAction[];
}

const SYSTEM = `You are "FloodWise AI", an information assistant for FloodWise, a community flood-navigation app covering Marikina and nearby cities in the Marikina River basin: Marikina, Quezon City (east), Pasig, Cainta, Taytay, Antipolo, San Mateo, and Rodriguez (Montalban), Philippines.

STRICT RULES:
- Answer road/route/shelter/report questions ONLY using the JSON CONTEXT provided. Never invent flood depths, road closures, reports, shelter status, or safety levels.
- For weather, rainfall, and river/flood-trend questions you MAY use the LIVE OPEN DATA block (source: Open-Meteo). Attribute it (e.g. "per Open-Meteo") and include its freshness. Do not use general model knowledge for current conditions.
- If neither the context nor the live data covers it, say you don't have recent information about it. Do NOT guess.
- Always consider data freshness (lastUpdatedMinutes / ageMinutes). If the newest relevant report is old (>60 min), say conditions may have changed.
- Distinguish PEDESTRIAN conditions from VEHICLE conditions. A road passable for vehicles is NOT automatically safe to walk.
- NEVER guarantee safety. Do not say "100% safe" or "completely safe". Use phrasing like "based on the latest available information", "currently reported as passable", "lower-risk based on recent reports".
- You are an information/navigation assistant, not emergency, rescue, medical, or government authority. For emergencies, defer to official LGU/DRRM instructions.
- Keep answers concise and scannable. Prefer short sentences.

FORMATTING:
- Keep "answer" to 1-2 short sentences (a quick summary). Do not cram everything into it.
- For questions about a specific road, route, condition, or shelter, populate "details" with concise label/value rows so the user can scan quickly. Good labels: STATUS, ROAD, BARANGAY, LATEST REPORT, WALKING, VEHICLE, FLOOD LEVEL, WHY, DISTANCE, OCCUPANCY. Keep each value short (a few words).
- For general/explanatory questions where a table doesn't fit, leave "details" empty and you may use short bullet lines in "answer", each starting with "- ".

You MUST respond with ONLY a JSON object (no markdown fences), shaped exactly:
{"answer": string, "details": [{"label": string, "value": string}], "confidence": "high"|"limited"|"outdated"|"unknown", "actions": [{"type": "open_map"|"view_reports"|"find_route"|"find_shelter"|"view_alerts"|"report", "label": string, "lat"?: number, "lng"?: number}]}
- "details" is an array of 0-6 label/value rows. Use it for structured, scannable answers.
- "actions" should offer 0-3 helpful next steps using ONLY the allowed types. Use "open_map" with lat/lng when pointing to a specific place.
- "confidence": "high" = multiple recent agreeing reports; "limited" = one/sparse recent report; "outdated" = newest relevant report is old; "unknown" = no relevant data.`;

function parseResponse(text: string): ChatResponse {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]);
      const actions: ChatAction[] = Array.isArray(obj.actions)
        ? obj.actions
            .filter((a: { type?: string }) => ALLOWED_ACTIONS.includes(a?.type as ChatActionType))
            .slice(0, 3)
            .map((a: { type: ChatActionType; label?: string; lat?: number; lng?: number }) => ({
              type: a.type,
              label: typeof a.label === "string" ? a.label : "Open",
              lat: typeof a.lat === "number" ? a.lat : undefined,
              lng: typeof a.lng === "number" ? a.lng : undefined,
            }))
        : [];
      const details: ChatDetail[] = Array.isArray(obj.details)
        ? obj.details
            .filter(
              (d: { label?: unknown; value?: unknown }) =>
                typeof d?.label === "string" && typeof d?.value === "string",
            )
            .slice(0, 6)
            .map((d: { label: string; value: string }) => ({ label: d.label, value: d.value }))
        : [];
      return {
        answer: typeof obj.answer === "string" ? obj.answer : "I couldn't produce a response.",
        details,
        confidence: ["high", "limited", "outdated", "unknown"].includes(obj.confidence)
          ? obj.confidence
          : "unknown",
        actions,
      };
    } catch {
      /* fall through */
    }
  }
  return {
    answer: text.slice(0, 600) || "I couldn't produce a response.",
    details: [],
    confidence: "unknown",
    actions: [],
  };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  const body = (await req.json()) as {
    question: string;
    history?: Array<{ role: "user" | "ai"; text: string }>;
    context: ChatContext;
    language?: string;
  };

  if (!key) return NextResponse.json({ configured: false });
  if (!body.question?.trim()) {
    return NextResponse.json({ configured: true, error: "empty_question" }, { status: 400 });
  }

  const historyText = (body.history ?? [])
    .slice(-6)
    .map((m) => `${m.role === "user" ? "USER" : "AI"}: ${m.text}`)
    .join("\n");

  // Pull live open data (Open-Meteo weather + river/flood). Non-fatal if it fails.
  const live = await fetchMarikinaLiveData();
  const liveBlock = live
    ? `LIVE OPEN DATA (source: ${live.source}, fetched ${live.fetchedAtMinutesAgo} min ago):\n${JSON.stringify(live)}\n\n`
    : "";

  const langBlock = body.language
    ? `RESPONSE LANGUAGE: Write the "answer" and all "label"/"value" text in the language with code "${body.language}". Keep proper place names in their official form. Keep the JSON keys and the allowed action "type" values in English. Understand the user's question in ANY language. Do NOT change meaning, severity, or uncertainty when translating — the same safety rules apply in every language.\n\n`
    : "";

  const prompt =
    `${SYSTEM}\n\n` +
    langBlock +
    `CONTEXT (live FloodWise data):\n${JSON.stringify(body.context)}\n\n` +
    liveBlock +
    (historyText ? `CONVERSATION SO FAR:\n${historyText}\n\n` : "") +
    `USER QUESTION: ${body.question}\n\nRespond with the JSON object only.`;

  const ai = new GoogleGenAI({ apiKey: key });
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const isTransient = (m: string) =>
    /(\b503\b|UNAVAILABLE|high demand|overloaded|\b429\b|RESOURCE_EXHAUSTED)/i.test(m);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return NextResponse.json({ configured: true, ...parseResponse(response.text ?? "") });
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (isTransient(lastError) && attempt < 2) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      break;
    }
  }
  console.error("[ai/chat] Gemini call failed:", lastError);
  return NextResponse.json({ configured: true, error: "ai_failed", detail: lastError }, { status: 502 });
}
